import { supabasePublic as supabase } from "@/lib/supabase/public";
import type { Paper } from "@/lib/types";

export async function getPapers({
  q,
  source,
  limit = 30,
}: {
  q?: string;
  source?: string;
  limit?: number;
}): Promise<Paper[]> {
  // With a search term: relevance-ranked full-text search (websearch syntax —
  // "introduction to machine learning" matches papers containing those words
  // anywhere in title/abstract, ranked by relevance, not one exact phrase).
  if (q && q.trim()) {
    const { data, error } = await supabase.rpc("search_papers", {
      search_query: q.trim(),
      filter_source: source ?? null,
      result_limit: limit,
    });

    if (error) {
      throw new Error(`Failed to search papers: ${error.message}`);
    }
    return data as Paper[];
  }

  // No search term: plain browse, newest first.
  let query = supabase
    .from("papers")
    .select("*")
    .order("published_date", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (source) {
    query = query.eq("source", source);
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
