import { createClient } from "@/lib/supabase/server";
import { getRecentSearchHistory } from "@/lib/searchHistory";
import { SidebarClient } from "@/components/SidebarClient";

export async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const recentSearches = user ? await getRecentSearchHistory(supabase, user.id) : [];

  const name = (user?.user_metadata?.full_name as string) || user?.email || "";
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string) ?? (user?.user_metadata?.picture as string) ?? null;

  return (
    <SidebarClient
      isLoggedIn={!!user}
      name={name}
      email={user?.email ?? ""}
      avatarUrl={avatarUrl}
      recentSearches={recentSearches}
    />
  );
}
