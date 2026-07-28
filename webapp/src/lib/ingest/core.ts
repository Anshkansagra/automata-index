import { supabaseAdmin } from "@/lib/supabase/admin";
import { sanitizeDate } from "@/lib/ingest/sanitizeDate";
import type { Paper } from "@/lib/types";

const CORE_API_URL = "https://api.core.ac.uk/v3/search/works";

const TOPIC_QUERY =
  '(robotics OR "machine learning" OR "deep learning" OR "neural network" OR "reinforcement learning" OR "computer vision" OR "generative AI")';

type CoreAuthor = { name: string } | string;

type CoreResult = {
  id: number;
  doi: string | null;
  title: string;
  authors?: CoreAuthor[];
  abstract?: string | null;
  publishedDate?: string | null;
  yearPublished?: number | null;
  publisher?: string | null;
  downloadUrl?: string | null;
  sourceFulltextUrls?: string[];
  fieldsOfStudy?: string[];
};

function mapAuthor(a: CoreAuthor): string {
  return typeof a === "string" ? a : a.name;
}

function mapResult(result: CoreResult): Omit<Paper, "id" | "created_at"> | null {
  // Skip anything CORE doesn't actually have full text for — we only ever
  // store/link works we can legally point users to.
  const pdfUrl = result.downloadUrl || result.sourceFulltextUrls?.[0] || null;
  if (!pdfUrl) return null;

  const publishedDate = sanitizeDate(
    (result.publishedDate?.slice(0, 10) || null) ??
      (result.yearPublished ? `${result.yearPublished}-01-01` : null)
  );

  return {
    source: "core",
    source_id: String(result.id),
    doi: result.doi ?? null,
    title: result.title.replace(/\s+/g, " ").trim(),
    authors: (result.authors ?? []).map(mapAuthor),
    abstract: result.abstract?.replace(/\s+/g, " ").trim() ?? null,
    published_date: publishedDate,
    categories: result.fieldsOfStudy ?? [],
    publisher: result.publisher ?? "CORE (Open Access aggregate)",
    pdf_url: pdfUrl,
    landing_page_url: `https://core.ac.uk/works/${result.id}`,
    is_open_access: true,
    tldr: null,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// CORE's free-tier backend occasionally 504s under load (it tells us so via
// its own Retry-After header) — retry a couple of times before giving up.
async function fetchCoreWithRetry(url: string, apiKey: string, attempts = 3) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (res.ok) return res;

    const retryAfter = Number(res.headers.get("retry-after")) || attempt * 5;
    lastError = new Error(`CORE API request failed: ${res.status} ${res.statusText}`);
    if (attempt < attempts) await sleep(retryAfter * 1000);
  }

  throw lastError;
}

export async function ingestCore({ limit = 25 } = {}) {
  const apiKey = process.env.CORE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing CORE_API_KEY in .env.local");
  }

  const params = new URLSearchParams({ q: TOPIC_QUERY, limit: String(limit) });
  const res = await fetchCoreWithRetry(`${CORE_API_URL}?${params.toString()}`, apiKey);

  const json = await res.json();
  const results: CoreResult[] = json.results ?? [];

  const rows = results.map(mapResult).filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) {
    return { fetched: results.length, upserted: 0 };
  }

  const { error, count } = await supabaseAdmin
    .from("papers")
    .upsert(rows, { onConflict: "source,source_id", count: "exact" });

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  return { fetched: results.length, upserted: count ?? rows.length };
}
