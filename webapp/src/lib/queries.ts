import { supabasePublic as supabase } from "@/lib/supabase/public";
import type { Paper } from "@/lib/types";

export type PaperSort = "recent" | "cited";

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
    const { data, error } = await supabase.rpc("search_papers", {
      search_query: q.trim(),
      filter_source: selectedSources.length === 1 ? selectedSources[0] : null,
      result_limit: limit,
    });

    if (error) {
      throw new Error(`Failed to search papers: ${error.message}`);
    }
    const results = data as Paper[];
    return selectedSources.length > 1
      ? results.filter((p) => selectedSources.includes(p.source))
      : results;
  }

  // No search term: plain browse.
  function buildQuery(useCitationSort: boolean) {
    let q = supabase.from("papers").select("*").limit(limit);

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
  const { data, error } = await supabase.from("papers").select("*").eq("id", id).maybeSingle();
  if (error) {
    throw new Error(`Failed to load paper: ${error.message}`);
  }
  return data as Paper | null;
}

// "More like this" without any AI/embeddings — papers sharing at least one
// category, newest first, excluding the paper itself.
export async function getRelatedPapers(paper: Paper, limit = 6): Promise<Paper[]> {
  if (paper.categories.length === 0) return [];

  const { data, error } = await supabase
    .from("papers")
    .select("*")
    .overlaps("categories", paper.categories)
    .neq("id", paper.id)
    .order("published_date", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load related papers: ${error.message}`);
  }
  return data as Paper[];
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
