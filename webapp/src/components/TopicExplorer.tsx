"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TOPIC_TAXONOMY } from "@/lib/topics";

type SubscribeStatus = "idle" | "saving" | "saved" | "error";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 18a2.5 2.5 0 0 0 5 0" strokeLinecap="round" />
    </svg>
  );
}

export function TopicExplorer({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const router = useRouter();
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, SubscribeStatus>>({});

  function searchFor(term: string) {
    router.push(`/?q=${encodeURIComponent(term)}#browse`);
  }

  async function subscribe(term: string) {
    setStatus((s) => ({ ...s, [term]: "saving" }));
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus((s) => ({ ...s, [term]: "error" }));
      return;
    }

    const { error } = await supabase.from("saved_searches").insert({
      user_id: user.id,
      query: term,
      source: null,
      label: term,
    });

    // A unique-constraint violation just means it's already saved.
    setStatus((s) => ({ ...s, [term]: error && error.code !== "23505" ? "error" : "saved" }));
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="grid grid-cols-2 gap-px bg-zinc-200 sm:grid-cols-3 md:grid-cols-4 dark:bg-zinc-800">
        {TOPIC_TAXONOMY.map((group) => {
          const isOpen = openCategory === group.category;
          return (
            <button
              key={group.category}
              onClick={() => setOpenCategory(isOpen ? null : group.category)}
              className={`bg-white px-3 py-2.5 text-left text-sm font-medium transition-colors dark:bg-zinc-950 ${
                isOpen
                  ? "text-accent"
                  : "text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
              }`}
            >
              {group.category}
            </button>
          );
        })}
      </div>

      {openCategory && (
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex flex-wrap gap-2">
            {TOPIC_TAXONOMY.find((g) => g.category === openCategory)?.terms.map((term) => {
              const termStatus = status[term] ?? "idle";
              return (
                <div
                  key={term}
                  className="flex items-center overflow-hidden rounded-full border border-zinc-300 dark:border-zinc-700"
                >
                  <button
                    onClick={() => searchFor(term)}
                    className="px-3 py-1 text-xs text-zinc-600 transition-colors hover:text-accent dark:text-zinc-400"
                  >
                    {term}
                  </button>
                  {isLoggedIn && (
                    <button
                      type="button"
                      onClick={() => subscribe(term)}
                      disabled={termStatus === "saving" || termStatus === "saved"}
                      title={
                        termStatus === "saved"
                          ? "Subscribed — you'll get emailed about new matches"
                          : `Subscribe to "${term}"`
                      }
                      className={`flex items-center border-l border-zinc-300 px-2 py-1 transition-colors dark:border-zinc-700 ${
                        termStatus === "saved"
                          ? "text-accent"
                          : "text-zinc-400 hover:text-accent dark:text-zinc-500"
                      }`}
                    >
                      <BellIcon />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
