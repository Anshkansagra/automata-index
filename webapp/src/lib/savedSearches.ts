import type { SupabaseClient } from "@supabase/supabase-js";

export type SavedSearch = {
  id: string;
  query: string;
  source: string | null;
  label: string | null;
  created_at: string;
};

export async function getSavedSearches(
  supabase: SupabaseClient,
  userId: string
): Promise<SavedSearch[]> {
  const { data, error } = await supabase
    .from("saved_searches")
    .select("id, query, source, label, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as SavedSearch[];
}
