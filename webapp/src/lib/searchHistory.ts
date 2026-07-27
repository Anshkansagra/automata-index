import type { SupabaseClient } from "@supabase/supabase-js";

export async function logSearch(supabase: SupabaseClient, userId: string, query: string) {
  // Fire-and-forget style — a logging failure should never break the page.
  await supabase.from("search_history").insert({ user_id: userId, query }).then(
    () => {},
    () => {}
  );
}

export async function getRecentSearchHistory(
  supabase: SupabaseClient,
  userId: string,
  limit = 6
): Promise<string[]> {
  const { data, error } = await supabase
    .from("search_history")
    .select("query")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !data) return [];

  // Dedupe while preserving recency order, then cap to `limit`.
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const row of data) {
    const q = row.query as string;
    if (seen.has(q)) continue;
    seen.add(q);
    unique.push(q);
    if (unique.length >= limit) break;
  }
  return unique;
}
