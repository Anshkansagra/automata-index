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
  let query = supabase.from("papers").select("*").limit(limit);

  if (sort === "cited") {
    query = query.order("citation_count", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("published_date", { ascending: false, nullsFirst: false });
  }

  if (selectedSources.length > 0) {
    query = query.in("source", selectedSources);
  }
  if (yearFrom) {
    query = query.gte("published_date", `${yearFrom}-01-01`);
  }
  if (yearTo) {
    query = query.lte("published_date", `${yearTo}-12-31`);
  }

  const { data, error } = await query;
  if (error) {
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
  if (error) {
    throw new Error(`Failed to load author's papers: ${error.message}`);
  }
  return data as Paper[];
}
