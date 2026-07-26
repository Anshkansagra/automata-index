"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SaveSearchButton({
  query,
  source,
  isLoggedIn,
}: {
  query: string;
  source: string | null;
  isLoggedIn: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  if (!isLoggedIn || !query.trim()) return null;

  async function handleSave() {
    setStatus("saving");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("error");
      return;
    }

    const { error } = await supabase.from("saved_searches").insert({
      user_id: user.id,
      query: query.trim(),
      source,
      label: query.trim(),
    });

    // A unique-constraint violation just means it's already saved — treat
    // that as success rather than an error the user needs to react to.
    setStatus(error && error.code !== "23505" ? "error" : "saved");
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={status === "saving" || status === "saved"}
      className="text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline disabled:no-underline disabled:opacity-70 dark:text-zinc-400 dark:hover:text-zinc-50"
    >
      {status === "saved"
        ? "✓ Saved — email me new matches"
        : status === "error"
          ? "Couldn't save, try again"
          : "🔔 Get emailed about new matches"}
    </button>
  );
}
