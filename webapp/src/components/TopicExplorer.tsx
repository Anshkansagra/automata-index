"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TOPIC_TAXONOMY } from "@/lib/topics";

export function TopicExplorer() {
  const router = useRouter();
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  function searchFor(term: string) {
    router.push(`/?q=${encodeURIComponent(term)}#browse`);
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
            {TOPIC_TAXONOMY.find((g) => g.category === openCategory)?.terms.map((term) => (
              <button
                key={term}
                onClick={() => searchFor(term)}
                className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-600 transition-colors hover:border-accent hover:text-accent dark:border-zinc-700 dark:text-zinc-400"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
