import { XMLParser } from "fast-xml-parser";
import { ARXIV_CATEGORIES, UNDERREPRESENTED_ARXIV_CATEGORIES } from "@/lib/ingest/categories";
import { sanitizeDate } from "@/lib/ingest/sanitizeDate";
import { upsertPapers } from "@/lib/ingest/upsertPapers";
import { partitionByExistingDoi } from "@/lib/ingest/alsoIndexedVia";
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

function mapEntry(entry: ArxivEntry): Omit<Paper, "id" | "created_at" | "also_indexed_via"> {
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
    citation_count: null,
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

// Fetches, dedupes, and upserts one page of results for a given search
// query — shared by both the main combined-category pull and the dedicated
// top-up fetches below.
async function ingestPage(searchQuery: string, start: number, pageSize: number) {
  const entries = await fetchPage(searchQuery, start, pageSize);
  if (entries.length === 0) return { fetched: 0, upserted: 0 };

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

  const { newRows } = await partitionByExistingDoi(rows);
  const { count } = newRows.length > 0 ? await upsertPapers(newRows) : { count: 0 };

  return { fetched: entries.length, upserted: count };
}

// arXiv asks API clients to wait ~3s between paginated requests.
export async function ingestArxiv({ pages = 4, pageSize = 250 } = {}) {
  const searchQuery = ARXIV_CATEGORIES.map((c) => `cat:${c}`).join(" OR ");

  let totalFetched = 0;
  let totalUpserted = 0;

  for (let page = 0; page < pages; page++) {
    const result = await ingestPage(searchQuery, page * pageSize, pageSize);
    totalFetched += result.fetched;
    totalUpserted += result.upserted;
    if (result.fetched === 0) break;

    await sleep(3000);
  }

  // cs.LG/cs.CV/cs.AI each publish hundreds of papers a day; the combined
  // query above sorts everything by date, so a low-volume category (VLSI's
  // cs.AR, MLOps-adjacent cs.SE) rarely makes it into that shared slice.
  // Give each of them its own dedicated fetch so they get a guaranteed slot.
  for (const category of UNDERREPRESENTED_ARXIV_CATEGORIES) {
    const result = await ingestPage(`cat:${category}`, 0, 50);
    totalFetched += result.fetched;
    totalUpserted += result.upserted;
    await sleep(3000);
  }

  return { fetched: totalFetched, upserted: totalUpserted };
}
