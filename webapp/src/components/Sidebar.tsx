import { supabasePublic } from "@/lib/supabase/public";
import { SidebarClient } from "@/components/SidebarClient";

// No headers()/cookies() usage here on purpose — session-dependent data
// (name, avatar, recent searches, saved count) is fetched client-side by
// SidebarClient via /api/session-info instead. This component lives in the
// root layout, so any dynamic API it used would force every page in the app
// into dynamic rendering. See api/session-info/route.ts for the full reason.
export async function Sidebar() {
  const { count: totalPapers } = await supabasePublic
    .from("papers")
    .select("id", { count: "exact", head: true });

  return <SidebarClient totalPapers={totalPapers ?? 0} />;
}
