import type { SupabaseClient } from "@supabase/supabase-js";

export type Collection = { id: string; name: string };

export async function getCollections(supabase: SupabaseClient, userId: string): Promise<Collection[]> {
  const { data, error } = await supabase
    .from("collections")
    .select("id, name")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as Collection[];
}
