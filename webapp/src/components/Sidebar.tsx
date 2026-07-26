import { createClient } from "@/lib/supabase/server";
import { SidebarClient } from "@/components/SidebarClient";

export async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <SidebarClient isLoggedIn={!!user} />;
}
