import { supabasePublic as supabase } from "@/lib/supabase/public";
import type { Paper } from "@/lib/types";

export type PaperSort = "recent" | "cited";

// If the strict (AND-all-words) search returns fewer results than this,
// fall back to a broader (OR-any-word) search too — compound/abbreviated
// topic labels like "CI/CD for ML" often don't appear verbatim in an
// otherwise-relevant paper's title/abstract, so the strict match alone was
// returning 0 results even when relevant papers existed.
const BROAD_FALLBACK_THRESHOLD = 5;

// Matches every column of Paper except search_vector — a generated tsvector
// that's ~44% of a row's payload and is never used client-side (only
// Postgres's own full-text @@ matching needs it). select("*") was shipping
// that dead weight over the wire on every browse/detail-page load.
export const PAPER_COLUMNS =
  "id, source, source_id, doi, title, authors, abstract, published_date, categories, publisher, pdf_url, landing_page_url, is_open_access, tldr, created_at, citation_count, also_indexed_via";

export async function getPapers({
  q,
  source,
  sources,
  sort = "recent",
  yearFrom,
  yearTo,
  limit = 30,
}: {
  q?: string;
  /** @deprecated use `sources` — kept for existing single-source callers (dashboard, etc). */
  source?: string;
  sources?: string[];
  sort?: PaperSort;
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
}): Promise<Paper[]> {
  const selectedSources =
    sources && sources.length > 0
      ? sources
      : source
        ? source.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

  // With a search term: relevance-ranked full-text search (websearch syntax —
  // "introduction to machine learning" matches papers containing those words
  // anywhere in title/abstract, ranked by relevance, not one exact phrase).
  // search_papers only takes a single source filter, so multi-source
  // selection is applied client-side after the relevance-ranked fetch.
  if (q && q.trim()) {
    const trimmedQuery = q.trim();
    const filterSource = selectedSources.length === 1 ? selectedSources[0] : null;

    const { data, error } = await supabase.rpc("search_papers", {
      search_query: trimmedQuery,
      filter_source: filterSource,
      result_limit: limit,
    });

    if (error) {
      throw new Error(`Failed to search papers: ${error.message}`);
    }
    let results = data as Paper[];

    if (results.length < BROAD_FALLBACK_THRESHOLD) {
      const { data: broadData, error: broadError } = await supabase.rpc("search_papers_broad", {
        search_query: trimmedQuery,
        filter_source: filterSource,
        result_limit: limit,
      });

      // search_papers_broad ships via a separate migration that may not have
      // landed in every environment yet — degrade to the strict results
      // alone instead of a 500.
      if (!broadError && broadData) {
        const seenIds = new Set(results.map((p) => p.id));
        const extra = (broadData as Paper[]).filter((p) => !seenIds.has(p.id));
        results = [...results, ...extra].slice(0, limit);
      }
    }

    return selectedSources.length > 1
      ? results.filter((p) => selectedSources.includes(p.source))
      : results;
  }

  // No search term: plain browse. Uses papers_listing (abstract capped at
  // 400 chars — see PAPER_COLUMNS) since list views only ever show a short
  // preview; getPaperById queries the base table for the full abstract.
  function buildQuery(useCitationSort: boolean) {
    let q = supabase.from("papers_listing").select(PAPER_COLUMNS).limit(limit);

    q =
      useCitationSort
        ? q.order("citation_count", { ascending: false, nullsFirst: false })
        : q.order("published_date", { ascending: false, nullsFirst: false });

    if (selectedSources.length > 0) {
      q = q.in("source", selectedSources);
    }
    if (yearFrom) {
      q = q.gte("published_date", `${yearFrom}-01-01`);
    }
    if (yearTo) {
      q = q.lte("published_date", `${yearTo}-12-31`);
    }
    return q;
  }

  const { data, error } = await buildQuery(sort === "cited");

  // "Most Cited" depends on a citation_count column that may not exist yet
  // on every environment (rolled out via a separate migration) — degrade to
  // the default newest-first sort instead of taking the whole page down.
  if (error) {
    if (sort === "cited" && error.code === "42703") {
      const fallback = await buildQuery(false);
      if (fallback.error) {
        throw new Error(`Failed to load papers: ${fallback.error.message}`);
      }
      return fallback.data as Paper[];
    }
    throw new Error(`Failed to load papers: ${error.message}`);
  }

  return data as Paper[];
}

export async function getPaperById(id: string): Promise<Paper | null> {
  const { data, error } = await supabase.from("papers").select(PAPER_COLUMNS).eq("id", id).maybeSingle();
  if (error) {
    throw new Error(`Failed to load paper: ${error.message}`);
  }
  return data as Paper | null;
}

// "More like this" without any AI/embeddings — ranked by shared-category
// count, then by title/abstract text similarity via the same search_vector
// that powers search. related_papers() ships via a separate migration that
// may not have landed in every environment yet — degrade to the older
// category-overlap-only query (recency sort) instead of a 500.
export async function getRelatedPapers(paper: Paper, limit = 6): Promise<Paper[]> {
  if (paper.categories.length === 0) return [];

  const { data, error } = await supabase.rpc("related_papers", {
    target_paper_id: paper.id,
    result_limit: limit,
  });

  if (!error) return data as Paper[];
  if (error.code !== "PGRST202") {
    throw new Error(`Failed to load related papers: ${error.message}`);
  }

  const fallback = await supabase
    .from("papers_listing")
    .select(PAPER_COLUMNS)
    .overlaps("categories", paper.categories)
    .neq("id", paper.id)
    .order("published_date", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (fallback.error) {
    throw new Error(`Failed to load related papers: ${fallback.error.message}`);
  }
  return fallback.data as Paper[];
}

// Exact-ish author match — case-insensitive equality against any element of
// the authors array (unlike full-text search, this must not fuzzy-match
// unrelated authors whose name happens to share a word).
export async function getPapersByAuthor(name: string, limit = 50): Promise<Paper[]> {
  const { data, error } = await supabase.rpc("papers_by_author", {
    author_name: name,
    result_limit: limit,
  });

  // The papers_by_author() function ships via a separate migration that may
  // not have landed in every environment yet — degrade to an empty result
  // (renders the page's existing "no papers found" state) instead of a 500.
  if (error) {
    if (error.code === "PGRST202") return [];
    throw new Error(`Failed to load author's papers: ${error.message}`);
  }
  return data as Paper[];
}
