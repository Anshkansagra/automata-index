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
