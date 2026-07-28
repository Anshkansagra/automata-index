import { XMLParser } from "fast-xml-parser";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ARXIV_CATEGORIES } from "@/lib/ingest/categories";
import { sanitizeDate } from "@/lib/ingest/sanitizeDate";
import type { Paper } from "@/lib/types";

const ARXIV_API_URL = "http://export.arxiv.org/api/query";

// fast-xml-parser doesn't force single children into arrays — normalize here.
function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

type ArxivEntry = {
  id: string;
  published: string;
  title: string;
  summary: string;
  author?: { name: string } | { name: string }[];
  link?: Record<string, string> | Record<string, string>[];
  category?: Record<string, string> | Record<string, string>[];
  "arxiv:doi"?: string;
};

function extractArxivId(entryId: string): string {
  const raw = entryId.split("/abs/")[1] ?? entryId;
  return raw.replace(/v\d+$/, "");
}

function mapEntry(entry: ArxivEntry): Omit<Paper, "id" | "created_at"> {
  const arxivId = extractArxivId(entry.id);
  const links = toArray(entry.link);
  const pdfLink = links.find((l) => l["@_title"] === "pdf")?.["@_href"];

  return {
    source: "arxiv",
    source_id: arxivId,
    doi: entry["arxiv:doi"] ?? null,
    title: entry.title.replace(/\s+/g, " ").trim(),
    authors: toArray(entry.author).map((a) => a.name),
    abstract: entry.summary.replace(/\s+/g, " ").trim(),
    published_date: sanitizeDate(entry.published.slice(0, 10)),
    categories: toArray(entry.category).map((c) => c["@_term"]),
    publisher: "arXiv",
    pdf_url: pdfLink ?? `https://arxiv.org/pdf/${arxivId}`,
    landing_page_url: `https://arxiv.org/abs/${arxivId}`,
    is_open_access: true,
    tldr: null,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

async function fetchPage(searchQuery: string, start: number, pageSize: number) {
  const params = new URLSearchParams({
    search_query: searchQuery,
    sortBy: "submittedDate",
    sortOrder: "descending",
    start: String(start),
    max_results: String(pageSize),
  });

  const res = await fetch(`${ARXIV_API_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`arXiv API request failed: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();
  const parsed = parser.parse(xml);
  return toArray(parsed.feed?.entry) as ArxivEntry[];
}

// arXiv asks API clients to wait ~3s between paginated requests.
export async function ingestArxiv({ pages = 4, pageSize = 250 } = {}) {
  const searchQuery = ARXIV_CATEGORIES.map((c) => `cat:${c}`).join(" OR ");

  let totalFetched = 0;
  let totalUpserted = 0;

  for (let page = 0; page < pages; page++) {
    const entries = await fetchPage(searchQuery, page * pageSize, pageSize);
    if (entries.length === 0) break;

    // A handful of arXiv entries share an externally-registered DOI (e.g.
    // cross-listed or later-published versions of the same work). Postgres
    // can't apply ON CONFLICT twice to the same target within one bulk
    // upsert, so drop later duplicates within this batch before writing.
    const seenDois = new Set<string>();
    const rows = entries.map(mapEntry).filter((row) => {
      if (!row.doi) return true;
      if (seenDois.has(row.doi)) return false;
      seenDois.add(row.doi);
      return true;
    });

    const { error, count } = await supabaseAdmin
      .from("papers")
      .upsert(rows, { onConflict: "source,source_id", count: "exact" });

    if (error) {
      throw new Error(`Supabase upsert failed: ${error.message}`);
    }

    totalFetched += entries.length;
    totalUpserted += count ?? rows.length;

    if (page < pages - 1) await sleep(3000);
  }

  return { fetched: totalFetched, upserted: totalUpserted };
}
