import type { SupabaseClient } from "@supabase/supabase-js";
import type { Paper } from "@/lib/types";
import { PAPER_COLUMNS } from "@/lib/queries";

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

export type SavedPaper = Paper & { collection_id: string | null };

// Two separate queries instead of a single embedded select — a foreign-key
// embed (saved_papers -> papers(...)) always joins against the base table,
// so it can't be pointed at papers_listing's truncated abstract. Fetching
// paper ids first, then the listing view, keeps this list-view page on the
// same lighter payload as browse/search.
export async function getSavedPapers(
  supabase: SupabaseClient,
  userId: string
): Promise<SavedPaper[]> {
  const { data: saved, error } = await supabase
    .from("saved_papers")
    .select("paper_id, created_at, collection_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !saved || saved.length === 0) return [];

  const paperIds = saved.map((row) => row.paper_id as string);
  const { data: papers, error: papersError } = await supabase
    .from("papers_listing")
    .select(PAPER_COLUMNS)
    .in("id", paperIds);

  if (papersError || !papers) return [];

  const byId = new Map((papers as unknown as Paper[]).map((p) => [p.id, p]));
  return saved
    .filter((row) => byId.has(row.paper_id as string))
    .map((row) => ({
      ...byId.get(row.paper_id as string)!,
      collection_id: row.collection_id as string | null,
    }));
}
