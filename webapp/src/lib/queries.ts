import { supabasePublic as supabase } from "@/lib/supabase/public";
import type { Paper } from "@/lib/types";

// PostgREST's `.or()` filter syntax uses `,` and `()` as control characters —
// strip them from user input so a search term can't break the filter string.
function sanitizeForOr(term: string) {
  return term.replace(/[,()]/g, " ").trim();
}

export async function getPapers({
  q,
  source,
  limit = 30,
}: {
  q?: string;
  source?: string;
  limit?: number;
}): Promise<Paper[]> {
  let query = supabase
    .from("papers")
    .select("*")
    .order("published_date", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (source) {
    query = query.eq("source", source);
  }

  if (q && q.trim()) {
    const term = sanitizeForOr(q);
    query = query.or(`title.ilike.%${term}%,abstract.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load papers: ${error.message}`);
  }

  return data as Paper[];
}
