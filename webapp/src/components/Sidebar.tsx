import { createClient } from "@/lib/supabase/server";
import { supabasePublic } from "@/lib/supabase/public";
import { getRecentSearchHistory } from "@/lib/searchHistory";
import { getSessionUser } from "@/lib/auth/sessionUser";
import { SidebarClient } from "@/components/SidebarClient";

export async function Sidebar() {
  const supabase = await createClient();
  const user = await getSessionUser();

  const [recentSearches, { count: totalPapers }, savedCountResult] = await Promise.all([
    user ? getRecentSearchHistory(supabase, user.id) : Promise.resolve([]),
    supabasePublic.from("papers").select("id", { count: "exact", head: true }),
    user
      ? supabase.from("saved_papers").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      : Promise.resolve({ count: 0 }),
  ]);

  const name = (user?.user_metadata?.full_name as string) || user?.email || "";
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string) ?? (user?.user_metadata?.picture as string) ?? null;

  return (
    <SidebarClient
      isLoggedIn={!!user}
      userId={user?.id ?? null}
      name={name}
      email={user?.email ?? ""}
      avatarUrl={avatarUrl}
      recentSearches={recentSearches}
      totalPapers={totalPapers ?? 0}
      savedCount={savedCountResult.count ?? 0}
    />
  );
}
