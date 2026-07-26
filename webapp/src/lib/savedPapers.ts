import type { SupabaseClient } from "@supabase/supabase-js";
import type { Paper } from "@/lib/types";

// Must be called with the SSR server client (bound to the user's session
// cookie) so RLS's auth.uid() resolves — the anon/public client has no user
// context and would just get an empty result.
export async function getSavedPaperIdSet(
  supabase: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("saved_papers")
    .select("paper_id")
    .eq("user_id", userId);

  if (error || !data) return new Set();
  return new Set(data.map((row) => row.paper_id as string));
}

export async function getSavedPapers(
  supabase: SupabaseClient,
  userId: string
): Promise<Paper[]> {
  const { data, error } = await supabase
    .from("saved_papers")
    .select("created_at, papers(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => row.papers as unknown as Paper).filter(Boolean);
}
