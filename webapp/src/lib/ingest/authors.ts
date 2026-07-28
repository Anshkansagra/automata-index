import { supabaseAdmin } from "@/lib/supabase/admin";
import { mapWork, ARXIV_SOURCE_ID, type OpenAlexWork } from "@/lib/ingest/openalex";

const OPENALEX_AUTHORS_URL = "https://api.openalex.org/authors";
const OPENALEX_WORKS_URL = "https://api.openalex.org/works";

// Researchers whose open-access work should always be indexed, even when it
// falls outside the broad topic-keyword queries the other ingest pipelines
// use — requested directly rather than discovered via keyword search.
const TARGET_AUTHORS = ["Chang Yoong Choon", "Sagar Kavaiya", "Hiren Mevada"];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type OpenAlexAuthor = { id: string };

function extractId(fullId: string): string {
  return fullId.split("/").pop() ?? fullId;
}

async function findAuthorId(name: string, mailto?: string): Promise<string | null> {
  const params = new URLSearchParams({ search: name, per_page: "1" });
  if (mailto) params.set("mailto", mailto);

  const res = await fetch(`${OPENALEX_AUTHORS_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`OpenAlex author lookup failed for "${name}": ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  const [top] = (json.results ?? []) as OpenAlexAuthor[];
  return top ? extractId(top.id) : null;
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
    const authorId = await findAuthorId(name, mailto);
    if (!authorId) {
      results.push({ author: name, found: false, fetched: 0, upserted: 0 });
      continue;
    }

    let fetched = 0;
    let upserted = 0;

    for (let page = 1; page <= pages; page++) {
      const works = await fetchWorksByAuthor(authorId, page, perPage, mailto);
      if (works.length === 0) break;
      fetched += works.length;

      const candidates = works.map(mapWork).filter((r): r is NonNullable<typeof r> => r !== null);

      // Skip anything whose DOI is already indexed from another source
      // (arXiv/CrossRef/CORE) to avoid a papers_doi_unique conflict.
      const dois = candidates.map((r) => r.doi).filter((d): d is string => Boolean(d));
      let existingDois = new Set<string>();
      if (dois.length > 0) {
        const { data: existing } = await supabaseAdmin.from("papers").select("doi").in("doi", dois);
        existingDois = new Set((existing ?? []).map((r) => r.doi as string));
      }
      const rows = candidates.filter((row) => !row.doi || !existingDois.has(row.doi));

      if (rows.length > 0) {
        const { error, count } = await supabaseAdmin
          .from("papers")
          .upsert(rows, { onConflict: "source,source_id", count: "exact" });
        if (error) {
          throw new Error(`Supabase upsert failed for "${name}": ${error.message}`);
        }
        upserted += count ?? rows.length;
      }

      if (page < pages) await sleep(1000);
    }

    results.push({ author: name, found: true, fetched, upserted });
    await sleep(500);
  }

  return { results };
}
