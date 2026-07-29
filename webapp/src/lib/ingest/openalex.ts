import { isLikelyRealPdfUrl } from "@/lib/ingest/pdfUrl";
import { sanitizeDate } from "@/lib/ingest/sanitizeDate";
import { upsertPapers } from "@/lib/ingest/upsertPapers";
import { partitionByExistingDoi } from "@/lib/ingest/alsoIndexedVia";
import type { Paper } from "@/lib/types";

const OPENALEX_URL = "https://api.openalex.org/works";
// OpenAlex's `search` treats bare space-separated words as AND (must all be
// present) — unlike CrossRef/CORE's relevance-style OR. Needs explicit OR +
// quoted phrases to actually match "any of these topics" instead of "every
// single one of these ~20 terms in the same document" (which matched almost
// nothing).
const TOPIC_QUERY =
  'robotics OR "machine learning" OR "deep learning" OR "neural network" OR "autonomous vehicle" OR "internet of vehicles" OR "digital twin" OR "computer vision" OR "generative AI" OR "human-machine collaboration" OR "wireless communication" OR ADAS OR "satellite navigation" OR VLSI OR "chip design" OR semiconductor';

// arXiv's OpenAlex source ID — excluded because we already ingest arXiv
// directly and comprehensively; this keeps OpenAlex complementary instead
// of redundant.
export const ARXIV_SOURCE_ID = "S4306400194";

export type OpenAlexWork = {
  id: string;
  doi: string | null;
  title: string | null;
  display_name: string | null;
  publication_date: string | null;
  cited_by_count?: number;
  authorships?: { author?: { display_name?: string } }[];
  abstract_inverted_index?: Record<string, number[]>;
  primary_location?: {
    landing_page_url?: string;
    pdf_url?: string;
    source?: { display_name?: string; host_organization_name?: string };
  };
  open_access?: { is_oa?: boolean; oa_url?: string };
};

function reconstructAbstract(index?: Record<string, number[]>): string | null {
  if (!index) return null;
  const maxPos = Math.max(...Object.values(index).flat());
  const words: string[] = new Array(maxPos + 1).fill("");
  for (const [word, positions] of Object.entries(index)) {
    for (const pos of positions) words[pos] = word;
  }
  const text = words.join(" ").replace(/\s+/g, " ").trim();
  return text || null;
}

function extractWorkId(fullId: string): string {
  return fullId.split("/").pop() ?? fullId;
}

// OpenAlex's primary_location.pdf_url is documented as "a direct link to a
// PDF" but is unreliable in practice — for some Elsevier/Wiley records it's
// actually a publisher API endpoint that returns raw XML metadata, not a
// PDF. open_access.oa_url (sourced from Unpaywall) is far more trustworthy,
// so that's the only field we use; anything that still looks like a
// publisher API call gets rejected outright rather than shown as "free PDF".
export function mapWork(work: OpenAlexWork): Omit<Paper, "id" | "created_at" | "also_indexed_via"> | null {
  const title = work.title || work.display_name;
  if (!title) return null;

  const oaUrl = work.open_access?.oa_url;
  const pdfUrl = oaUrl && isLikelyRealPdfUrl(oaUrl) ? oaUrl : null;
  const landingPageUrl =
    work.primary_location?.landing_page_url ||
    (work.doi ? work.doi : `https://openalex.org/${extractWorkId(work.id)}`);

  return {
    source: "openalex",
    source_id: extractWorkId(work.id),
    doi: work.doi ? work.doi.replace("https://doi.org/", "") : null,
    title: title.replace(/\s+/g, " ").trim(),
    authors: (work.authorships ?? [])
      .map((a) => a.author?.display_name)
      .filter((name): name is string => Boolean(name)),
    abstract: reconstructAbstract(work.abstract_inverted_index),
    published_date: sanitizeDate(work.publication_date),
    categories: work.primary_location?.source?.display_name
      ? [work.primary_location.source.display_name]
      : [],
    publisher:
      work.primary_location?.source?.host_organization_name ||
      work.primary_location?.source?.display_name ||
      "OpenAlex",
    pdf_url: pdfUrl,
    landing_page_url: landingPageUrl,
    is_open_access: true,
    tldr: null,
    citation_count: typeof work.cited_by_count === "number" ? work.cited_by_count : null,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPage(page: number, perPage: number, mailto?: string) {
  const params = new URLSearchParams({
    // title_and_abstract.search (rather than the top-level `search` param)
    // restricts matching to just the title/abstract instead of full text —
    // the top-level search let through off-topic papers (e.g. a psychology
    // thesis, a housing-cost accounting paper) whose body text happened to
    // mention a generic overlap word like "network" or "communication"
    // somewhere unrelated to our topics.
    filter: `title_and_abstract.search:${TOPIC_QUERY},open_access.is_oa:true,primary_location.source.id:!${ARXIV_SOURCE_ID}`,
    page: String(page),
    per_page: String(perPage),
    sort: "publication_date:desc",
  });
  if (mailto) params.set("mailto", mailto);

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`${OPENALEX_URL}?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      return (json.results ?? []) as OpenAlexWork[];
    }
    lastError = new Error(`OpenAlex API request failed: ${res.status} ${res.statusText}`);
    if (attempt < 3) await sleep(attempt * 3000);
  }
  throw lastError;
}

export async function ingestOpenAlex({ pages = 2, perPage = 100 } = {}) {
  const mailto = process.env.CROSSREF_MAILTO;
  let totalFetched = 0;
  let totalUpserted = 0;

  for (let page = 1; page <= pages; page++) {
    const works = await fetchPage(page, perPage, mailto);
    if (works.length === 0) break;
    totalFetched += works.length;

    const candidates = works.map(mapWork).filter((r): r is NonNullable<typeof r> => r !== null);

    // Dedupe within this batch by DOI first (same issue as arXiv: two
    // OpenAlex works can occasionally share a DOI).
    const seenDois = new Set<string>();
    const deduped = candidates.filter((row) => {
      if (!row.doi) return true;
      if (seenDois.has(row.doi)) return false;
      seenDois.add(row.doi);
      return true;
    });

    // Anything whose DOI we already have from another source (arXiv/CrossRef)
    // doesn't get a second row — it gets recorded as an "also indexed via"
    // pointer on the existing row instead, avoiding a papers_doi_unique
    // conflict while keeping the cross-source info.
    const { newRows } = await partitionByExistingDoi(deduped);

    if (newRows.length > 0) {
      const { count } = await upsertPapers(newRows);
      totalUpserted += count;
    }

    if (page < pages) await sleep(1000);
  }

  return { fetched: totalFetched, upserted: totalUpserted };
}
