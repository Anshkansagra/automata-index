import { supabaseAdmin } from "@/lib/supabase/admin";
import { mapWork, ARXIV_SOURCE_ID, type OpenAlexWork } from "@/lib/ingest/openalex";
import { upsertPapers } from "@/lib/ingest/upsertPapers";

const OPENALEX_AUTHORS_URL = "https://api.openalex.org/authors";
const OPENALEX_WORKS_URL = "https://api.openalex.org/works";

// Researchers whose open-access work should always be indexed, even when it
// falls outside the broad topic-keyword queries the other ingest pipelines
// use — requested directly rather than discovered via keyword search.
const TARGET_AUTHORS = ["Chang Yoong Choon", "Sagar Kavaiya", "Hiren Mewada"];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type OpenAlexAuthor = { id: string; display_name: string; works_count: number };

function extractId(fullId: string): string {
  return fullId.split("/").pop() ?? fullId;
}

// OpenAlex sometimes splits one real person into several unmerged author
// profiles (e.g. after an institution change) — matching only the top result
// silently drops whichever works landed on the other profile(s). Pull every
// profile whose display name matches exactly (case-insensitive) instead.
async function findAuthorIds(name: string, mailto?: string): Promise<string[]> {
  const params = new URLSearchParams({ search: name, per_page: "10" });
  if (mailto) params.set("mailto", mailto);

  const res = await fetch(`${OPENALEX_AUTHORS_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`OpenAlex author lookup failed for "${name}": ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  const results = (json.results ?? []) as OpenAlexAuthor[];
  const normalized = name.toLowerCase();

  return results
    .filter((a) => a.display_name?.toLowerCase() === normalized && a.works_count > 0)
    .map((a) => extractId(a.id));
}

async function fetchWorksByAuthor(authorId: string, page: number, perPage: number, mailto?: string) {
  const params = new URLSearchParams({
    filter: `author.id:${authorId},open_access.is_oa:true,primary_location.source.id:!${ARXIV_SOURCE_ID}`,
    page: String(page),
    per_page: String(perPage),
    sort: "publication_date:desc",
  });
  if (mailto) params.set("mailto", mailto);

  const res = await fetch(`${OPENALEX_WORKS_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`OpenAlex works lookup failed for author ${authorId}: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return (json.results ?? []) as OpenAlexWork[];
}

export async function ingestAuthors({ pages = 2, perPage = 100 } = {}) {
  const mailto = process.env.CROSSREF_MAILTO;
  const results: { author: string; found: boolean; fetched: number; upserted: number }[] = [];

  for (const name of TARGET_AUTHORS) {
    const authorIds = await findAuthorIds(name, mailto);
    if (authorIds.length === 0) {
      results.push({ author: name, found: false, fetched: 0, upserted: 0 });
      continue;
    }

    let fetched = 0;
    let upserted = 0;

    for (const authorId of authorIds) {
      for (let page = 1; page <= pages; page++) {
        const works = await fetchWorksByAuthor(authorId, page, perPage, mailto);
        if (works.length === 0) break;
        fetched += works.length;

        const candidates = works.map(mapWork).filter((r): r is NonNullable<typeof r> => r !== null);

        // Skip anything whose DOI is already indexed from another source
        // (arXiv/CrossRef/CORE, or an earlier profile for the same person)
        // to avoid a papers_doi_unique conflict.
        const dois = candidates.map((r) => r.doi).filter((d): d is string => Boolean(d));
        let existingDois = new Set<string>();
        if (dois.length > 0) {
          const { data: existing } = await supabaseAdmin.from("papers").select("doi").in("doi", dois);
          existingDois = new Set((existing ?? []).map((r) => r.doi as string));
        }
        const rows = candidates.filter((row) => !row.doi || !existingDois.has(row.doi));

        if (rows.length > 0) {
          const { count } = await upsertPapers(rows);
          upserted += count;
        }

        if (page < pages) await sleep(1000);
      }

      await sleep(500);
    }

    results.push({ author: name, found: true, fetched, upserted });
  }

  return { results };
}
