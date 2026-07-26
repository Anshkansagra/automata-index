"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { SavedSearch } from "@/lib/savedSearches";

function searchHref(search: SavedSearch) {
  const params = new URLSearchParams({ q: search.query });
  if (search.source) params.set("source", search.source);
  return `/?${params.toString()}#browse`;
}

export function SavedSearchList({ initialSearches }: { initialSearches: SavedSearch[] }) {
  const [searches, setSearches] = useState(initialSearches);

  async function remove(id: string) {
    setSearches((prev) => prev.filter((s) => s.id !== id));
    const supabase = createClient();
    await supabase.from("saved_searches").delete().eq("id", id);
  }

  if (searches.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No saved searches yet — search for something on the homepage and click
        &ldquo;Get emailed about new matches&rdquo;.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {searches.map((search) => (
        <li
          key={search.id}
          className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-2.5 dark:border-zinc-800"
        >
          <Link href={searchHref(search)} className="text-sm font-medium hover:underline">
            {search.label || search.query}
            {search.source && (
              <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                ({search.source})
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => remove(search.id)}
            className="text-xs text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
