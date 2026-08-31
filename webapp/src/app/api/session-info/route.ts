import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/sessionUser";
import { getRecentSearchHistory } from "@/lib/searchHistory";

// Session-dependent sidebar data (name, avatar, recent searches, saved
// count), fetched client-side by SidebarClient instead of computed during
// SSR. Reading the session via headers()/cookies() during SSR — even just
// in the root layout's Sidebar — forces every page in the app into dynamic
// rendering, since Next.js classifies a whole route as dynamic if anything
// in its tree (including the layout) uses a dynamic API. Moving it here
// keeps the layout itself free of dynamic APIs, so pages with no dynamic
// data of their own (terms, privacy, about, methodology, developers, login,
// register) can be statically generated and served from cache instead of
// hitting Supabase on every single visit or crawler request.
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({
      isLoggedIn: false,
      userId: null,
      name: "",
      email: "",
      avatarUrl: null,
      recentSearches: [],
      savedCount: 0,
    });
  }

  const supabase = await createClient();
  const [recentSearches, savedCountResult] = await Promise.all([
    getRecentSearchHistory(supabase, user.id),
    supabase.from("saved_papers").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  return NextResponse.json({
    isLoggedIn: true,
    userId: user.id,
    name: (user.user_metadata?.full_name as string) || user.email || "",
    email: user.email ?? "",
    avatarUrl: (user.user_metadata?.avatar_url as string) ?? (user.user_metadata?.picture as string) ?? null,
    recentSearches,
    savedCount: savedCountResult.count ?? 0,
  });
}
