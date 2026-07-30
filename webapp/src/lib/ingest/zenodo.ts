import { isLikelyRealPdfUrl } from "@/lib/ingest/pdfUrl";
import { sanitizeDate } from "@/lib/ingest/sanitizeDate";
import { upsertPapers } from "@/lib/ingest/upsertPapers";
import { partitionByExistingDoi } from "@/lib/ingest/alsoIndexedVia";
import type { Paper } from "@/lib/types";

const ZENODO_URL = "https://zenodo.org/api/records";

// Zenodo's search is a general Elasticsearch query over title/description/
// keywords combined — same topic coverage as the other sources, quoted
// phrases + OR to avoid matching on any single generic word.
const TOPIC_QUERY =
  '"machine learning" OR "deep learning" OR "neural network" OR robotics OR "autonomous vehicle" OR "computer vision" OR "generative AI" OR "wireless communication" OR ADAS OR VLSI OR "chip design" OR semiconductor';

type ZenodoRecord = {
  id: number;
  doi?: string;
  metadata: {
    title?: string;
    description?: string;
    publication_date?: string;
    access_right?: string;
    creators?: { name?: string }[];
    license?: { id?: string };
    resource_type?: { title?: string };
  };
  files?: { key: string; links: { self: string } }[];
  links?: { self_html?: string };
};

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

// Zenodo creator names commonly come as "Last, First" — normalize to
// "First Last" to match every other source, so author pages and search
// don't silently split the same person into two different name strings.
function normalizeCreatorName(name: string): string {
  const parts = name.split(",").map((p) => p.trim());
  if (parts.length === 2 && parts[0] && parts[1]) return `${parts[1]} ${parts[0]}`;
  return name.trim();
}

function findPdfUrl(record: ZenodoRecord): string | null {
  const pdfFile = (record.files ?? []).find((f) => f.key.toLowerCase().endsWith(".pdf"));
  if (!pdfFile) return null;
  return isLikelyRealPdfUrl(pdfFile.links.self) ? pdfFile.links.self : null;
}

function mapRecord(record: ZenodoRecord): Omit<Paper, "id" | "created_at" | "also_indexed_via"> | null {
  const title = record.metadata.title;
  if (!title) return null;
  // Belt-and-suspenders — the query already filters access_right=open server
  // side, but never trust that alone for what we present as "free to read".
  if (record.metadata.access_right !== "open") return null;

  const doi = record.doi ?? null;
  const landingPageUrl = record.links?.self_html ?? (doi ? `https://doi.org/${doi}` : `https://zenodo.org/records/${record.id}`);

  return {
    source: "zenodo",
    source_id: String(record.id),
    doi,
    title: title.replace(/\s+/g, " ").trim(),
    authors: (record.metadata.creators ?? [])
      .map((c) => c.name)
      .filter((n): n is string => Boolean(n))
      .map(normalizeCreatorName),
    abstract: record.metadata.description ? stripHtml(record.metadata.description) : null,
    published_date: sanitizeDate(record.metadata.publication_date ?? null),
    categories: record.metadata.resource_type?.title ? [record.metadata.resource_type.title] : [],
    publisher: "Zenodo",
    pdf_url: findPdfUrl(record),
    landing_page_url: landingPageUrl,
    is_open_access: true,
    tldr: null,
    citation_count: null,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPage(page: number, size: number) {
  const params = new URLSearchParams({
    q: TOPIC_QUERY,
    type: "publication",
    access_right: "open",
    size: String(size),
    page: String(page),
    sort: "mostrecent",
  });

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`${ZENODO_URL}?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      return (json.hits?.hits ?? []) as ZenodoRecord[];
    }
    const body = await res.text().catch(() => "");
    lastError = new Error(`Zenodo API request failed: ${res.status} ${res.statusText} ${body}`);
    if (attempt < 3) await sleep(attempt * 3000);
  }
  throw lastError;
}

// Unauthenticated requests are capped at 25 per page (Zenodo returns a 400
// above that without an API key) — more pages rather than a bigger page size
// to reach a comparable volume per run.
const MAX_UNAUTHENTICATED_PAGE_SIZE = 25;

export async function ingestZenodo({ pages = 4, pageSize = MAX_UNAUTHENTICATED_PAGE_SIZE } = {}) {
  const size = Math.min(pageSize, MAX_UNAUTHENTICATED_PAGE_SIZE);
  let totalFetched = 0;
  let totalUpserted = 0;

  for (let page = 1; page <= pages; page++) {
    const records = await fetchPage(page, size);
    if (records.length === 0) break;
    totalFetched += records.length;

    const candidates = records.map(mapRecord).filter((r): r is NonNullable<typeof r> => r !== null);

    const seenIds = new Set<string>();
    const deduped = candidates.filter((row) => {
      if (seenIds.has(row.source_id)) return false;
      seenIds.add(row.source_id);
      return true;
    });

    const { newRows } = await partitionByExistingDoi(deduped);
    if (newRows.length > 0) {
      const { count } = await upsertPapers(newRows);
      totalUpserted += count;
    }

    if (page < pages) await sleep(1000);
  }

  return { fetched: totalFetched, upserted: totalUpserted };
}
