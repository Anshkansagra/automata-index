"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SaveButton({
  paperId,
  initialSaved,
}: {
  paperId: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    setPending(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPending(false);
      return;
    }

    if (saved) {
      const { error } = await supabase
        .from("saved_papers")
        .delete()
        .eq("user_id", user.id)
        .eq("paper_id", paperId);
      if (!error) setSaved(false);
    } else {
      const { error } = await supabase
        .from("saved_papers")
        .insert({ user_id: user.id, paper_id: paperId });
      if (!error) setSaved(true);
    }

    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={saved ? "Remove from saved papers" : "Save paper"}
      className={`font-medium transition-colors disabled:opacity-50 ${
        saved
          ? "text-amber-600 dark:text-amber-400"
          : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300"
      }`}
    >
      {saved ? "★ Saved" : "☆ Save"}
    </button>
  );
}
