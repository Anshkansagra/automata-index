import { isLikelyRealPdfUrl } from "@/lib/ingest/pdfUrl";
import { sanitizeDate } from "@/lib/ingest/sanitizeDate";
import { upsertPapers } from "@/lib/ingest/upsertPapers";
import { partitionByExistingDoi } from "@/lib/ingest/alsoIndexedVia";
import type { Paper } from "@/lib/types";

const S2_BULK_URL = "https://api.semanticscholar.org/graph/v1/paper/search/bulk";
const S2_BATCH_URL = "https://api.semanticscholar.org/graph/v1/paper/batch";

// Semantic Scholar's search supports `|` (OR), `+`/`-`, and quoted phrases —
// same topic coverage as the other sources.
const TOPIC_QUERY =
  'robotics | "machine learning" | "deep learning" | "neural network" | "autonomous vehicle" | "computer vision" | "generative AI" | "wireless communication" | ADAS | VLSI | "chip design" | semiconductor';

// tldr is NOT a supported field on /search/bulk (confirmed by testing —
// the API rejects it there) but IS supported on /paper/batch, so tldr is
// fetched in a second, smaller call for just the papers that survive
// filtering below, rather than for every raw bulk result.
const SEARCH_FIELDS = "title,abstract,authors,year,publicationDate,venue,externalIds,openAccessPdf,isOpenAccess,citationCount";

type S2Paper = {
  paperId: string;
  title?: string | null;
  abstract?: string | null;
  year?: number | null;
  publicationDate?: string | null;
  venue?: string | null;
  externalIds?: { DOI?: string; ArXiv?: string };
  authors?: { name?: string }[];
  openAccessPdf?: { url?: string } | null;
  isOpenAccess?: boolean;
  citationCount?: number | null;
};

type Candidate = Omit<Paper, "id" | "created_at" | "also_indexed_via" | "tldr">;

// Anything Semantic Scholar attributes an arXiv id to is a paper we already
// ingest directly and comprehensively via the arXiv source itself — unlike
// OpenAlex/CrossRef these usually have no DOI to dedupe on (a pure preprint
// never gets one), so skipping here (rather than relying on
// partitionByExistingDoi) is what actually keeps this source complementary.
function toCandidate(p: S2Paper): Candidate | null {
  if (!p.title || !p.isOpenAccess) return null;
  if (p.externalIds?.ArXiv) return null;

  const doi = p.externalIds?.DOI ?? null;
  const pdfUrlCandidate = p.openAccessPdf?.url;
  const pdfUrl = pdfUrlCandidate && isLikelyRealPdfUrl(pdfUrlCandidate) ? pdfUrlCandidate : null;
  const landingPageUrl = doi
    ? `https://doi.org/${doi}`
    : `https://www.semanticscholar.org/paper/${p.paperId}`;

  return {
    source: "semantic_scholar",
    source_id: p.paperId,
    doi,
    title: p.title.replace(/\s+/g, " ").trim(),
    authors: (p.authors ?? []).map((a) => a.name).filter((n): n is string => Boolean(n)),
    abstract: p.abstract ? p.abstract.replace(/\s+/g, " ").trim() : null,
    published_date: sanitizeDate(p.publicationDate ?? (p.year ? `${p.year}-01-01` : null)),
    categories: p.venue ? [p.venue] : [],
    publisher: p.venue || "Semantic Scholar",
    pdf_url: pdfUrl,
    landing_page_url: landingPageUrl,
    is_open_access: true,
    citation_count: typeof p.citationCount === "number" ? p.citationCount : null,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPage(token: string | null, apiKey?: string) {
  const params = new URLSearchParams({
    query: TOPIC_QUERY,
    fields: SEARCH_FIELDS,
    sort: "publicationDate:desc",
  });
  if (token) params.set("token", token);

  const headers: Record<string, string> = {};
  if (apiKey) headers["x-api-key"] = apiKey;

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`${S2_BULK_URL}?${params.toString()}`, { headers });
    if (res.ok) {
      const json = await res.json();
      return { data: (json.data ?? []) as S2Paper[], token: json.token as string | undefined };
    }
    lastError = new Error(`Semantic Scholar API request failed: ${res.status} ${res.statusText}`);
    // The unauthenticated shared rate-limit pool is easy to hit — back off
    // longer than the other sources' retries do.
    if (attempt < 3) await sleep(attempt * 5000);
  }
  throw lastError;
}

// The one field none of the other sources provide — a real, model-generated
// one-line summary. tldr is frequently null even for papers S2 does cover,
// so a fetch failure here is treated as "no tldr" rather than aborting the
// whole ingestion run over a non-essential enrichment field.
async function fetchTldrs(paperIds: string[], apiKey?: string): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();
  if (paperIds.length === 0) return result;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;

  for (let i = 0; i < paperIds.length; i += 500) {
    const chunk = paperIds.slice(i, i + 500);
    try {
      const res = await fetch(`${S2_BATCH_URL}?fields=tldr`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ids: chunk }),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { paperId: string; tldr?: { text?: string } | null }[];
      for (const item of json) {
        result.set(item.paperId, item.tldr?.text ?? null);
      }
    } catch {
      // skip this chunk's tldr enrichment, papers still get inserted without it
    }
  }
  return result;
}

export async function ingestSemanticScholar({ pages = 2 } = {}) {
  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY || undefined;
  let totalFetched = 0;
  let totalUpserted = 0;
  let token: string | null = null;

  for (let page = 0; page < pages; page++) {
    const { data, token: nextToken } = await fetchPage(token, apiKey);
    if (data.length === 0) break;
    totalFetched += data.length;

    const candidates = data.map(toCandidate).filter((r): r is Candidate => r !== null);

    const seenIds = new Set<string>();
    const deduped = candidates.filter((row) => {
      if (seenIds.has(row.source_id)) return false;
      seenIds.add(row.source_id);
      return true;
    });

    const tldrMap = await fetchTldrs(
      deduped.map((c) => c.source_id),
      apiKey
    );
    const withTldr = deduped.map((c) => ({ ...c, tldr: tldrMap.get(c.source_id) ?? null }));

    const { newRows } = await partitionByExistingDoi(withTldr);
    if (newRows.length > 0) {
      const { count } = await upsertPapers(newRows);
      totalUpserted += count;
    }

    token = nextToken ?? null;
    if (!token) break;
    if (page < pages - 1) await sleep(1000);
  }

  return { fetched: totalFetched, upserted: totalUpserted };
}
