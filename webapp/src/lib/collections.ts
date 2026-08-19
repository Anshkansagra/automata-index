import type { SupabaseClient } from "@supabase/supabase-js";
import { supabasePublic } from "@/lib/supabase/public";
import { PAPER_COLUMNS } from "@/lib/queries";
import type { Paper } from "@/lib/types";

export type Collection = { id: string; name: string; is_public: boolean };

export async function getCollections(supabase: SupabaseClient, userId: string): Promise<Collection[]> {
  const { data, error } = await supabase
    .from("collections")
    .select("id, name, is_public")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as Collection[];
}

export type PublicCollection = { id: string; name: string; papers: Paper[] };

// Anon client — visibility is enforced entirely by the "Anyone can view
// public collections" RLS policy (022_public_collections.sql), so a
// non-public or nonexistent id just returns null here, same as a 404.
export async function getPublicCollection(collectionId: string): Promise<PublicCollection | null> {
  const { data: collection, error } = await supabasePublic
    .from("collections")
    .select("id, name")
    .eq("id", collectionId)
    .eq("is_public", true)
    .maybeSingle();

  if (error || !collection) return null;

  const { data: saved } = await supabasePublic
    .from("saved_papers")
    .select("paper_id, created_at")
    .eq("collection_id", collectionId)
    .order("created_at", { ascending: false });

  if (!saved || saved.length === 0) return { id: collection.id, name: collection.name, papers: [] };

  const paperIds = saved.map((row) => row.paper_id as string);
  const { data: papers } = await supabasePublic.from("papers_listing").select(PAPER_COLUMNS).in("id", paperIds);

  const byId = new Map((papers as unknown as Paper[] | null)?.map((p) => [p.id, p]) ?? []);
  const ordered = saved.map((row) => byId.get(row.paper_id as string)).filter((p): p is Paper => Boolean(p));

  return { id: collection.id, name: collection.name, papers: ordered };
}
