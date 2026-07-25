"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
    >
      Sign out
    </button>
  );
}
