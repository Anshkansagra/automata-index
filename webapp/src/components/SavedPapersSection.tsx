"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PaperCard } from "@/components/PaperCard";
import { RoboticGripper } from "@/components/illustrations";
import type { Collection } from "@/lib/collections";
import type { SavedPaper } from "@/lib/savedPapers";
import type { CitationStyle } from "@/lib/citation";

function pillClass(active: boolean) {
  return `rounded-full border px-3 py-1 text-sm transition-colors ${
    active
      ? "border-accent bg-accent text-white"
      : "border-zinc-300 text-zinc-700 hover:border-accent hover:text-accent dark:border-zinc-700 dark:text-zinc-300"
  }`;
}

export function SavedPapersSection({
  userId,
  initialPapers,
  initialCollections,
  citationStyle,
}: {
  userId: string;
  initialPapers: SavedPaper[];
  initialCollections: Collection[];
  citationStyle?: CitationStyle;
}) {
  const [papers, setPapers] = useState(initialPapers);
  const [collections, setCollections] = useState(initialCollections);
  const [filter, setFilter] = useState<string | null>(null); // null = All, "" = Uncategorized
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const counts = new Map<string, number>();
  for (const p of papers) {
    const key = p.collection_id ?? "";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const uncategorizedCount = counts.get("") ?? 0;

  const visible = filter === null ? papers : papers.filter((p) => (p.collection_id ?? "") === filter);

  async function createCollection(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("collections")
      .insert({ user_id: userId, name })
      .select("id, name")
      .single();
    setCreating(false);
    if (!error && data) {
      setCollections((prev) => [...prev, data as Collection]);
      setNewName("");
    }
  }

  async function deleteCollection(id: string) {
    if (!window.confirm("Delete this collection? Its papers stay saved, just uncategorized.")) return;
    const supabase = createClient();
    await supabase.from("collections").delete().eq("id", id).eq("user_id", userId);
    setCollections((prev) => prev.filter((c) => c.id !== id));
    setPapers((prev) => prev.map((p) => (p.collection_id === id ? { ...p, collection_id: null } : p)));
    setFilter((f) => (f === id ? null : f));
  }

  async function toggleShare(id: string, makePublic: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from("collections")
      .update({ is_public: makePublic })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return;
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, is_public: makePublic } : c)));
    if (makePublic) {
      const url = `${window.location.origin}/collection/${id}`;
      navigator.clipboard?.writeText(url).catch(() => {});
      window.alert(`Public link copied:\n${url}`);
    }
  }

  async function movePaper(paperId: string, collectionId: string | null) {
    setPapers((prev) => prev.map((p) => (p.id === paperId ? { ...p, collection_id: collectionId } : p)));
    const supabase = createClient();
    await supabase
      .from("saved_papers")
      .update({ collection_id: collectionId })
      .eq("user_id", userId)
      .eq("paper_id", paperId);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setFilter(null)} className={pillClass(filter === null)}>
          All ({papers.length})
        </button>
        {collections.map((c) => (
          <div key={c.id} className="flex items-center gap-1">
            <button type="button" onClick={() => setFilter(c.id)} className={pillClass(filter === c.id)}>
              {c.name} ({counts.get(c.id) ?? 0})
            </button>
            <button
              type="button"
              onClick={() => toggleShare(c.id, !c.is_public)}
              aria-label={c.is_public ? `Unshare collection ${c.name}` : `Share collection ${c.name} publicly`}
              title={c.is_public ? "Public — click to unshare" : "Share publicly"}
              className={c.is_public ? "text-accent" : "text-zinc-300 hover:text-accent dark:text-zinc-600"}
            >
              {c.is_public ? "🔗" : "🔒"}
            </button>
            <button
              type="button"
              onClick={() => deleteCollection(c.id)}
              aria-label={`Delete collection ${c.name}`}
              className="text-zinc-300 hover:text-red-500 dark:text-zinc-600"
            >
              ×
            </button>
          </div>
        ))}
        {uncategorizedCount > 0 && (
          <button type="button" onClick={() => setFilter("")} className={pillClass(filter === "")}>
            Uncategorized ({uncategorizedCount})
          </button>
        )}
        <form onSubmit={createCollection} className="flex items-center gap-1.5">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New collection…"
            className="w-32 rounded-full border border-dashed border-zinc-300 bg-transparent px-3 py-1 text-sm outline-none focus:border-accent dark:border-zinc-700"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-600 hover:border-accent hover:text-accent disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400"
          >
            + Add
          </button>
        </form>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="h-40 w-40 text-zinc-300 dark:text-zinc-700">
            <RoboticGripper />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {papers.length === 0 ? "No saved papers yet." : "No papers in this collection yet."}
          </p>
          {papers.length === 0 && (
            <Link
              href="/#browse"
              className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Browse papers
            </Link>
          )}
        </div>
      ) : (
        <div className="papers-columns">
          {visible.map((paper) => (
            <div key={paper.id}>
              <PaperCard paper={paper} isLoggedIn isSaved citationStyle={citationStyle} />
              {collections.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5 px-1">
                  <label className="text-xs text-zinc-400 dark:text-zinc-500">Collection</label>
                  <select
                    value={paper.collection_id ?? ""}
                    onChange={(e) => movePaper(paper.id, e.target.value || null)}
                    className="rounded-md border border-zinc-300 bg-transparent px-1.5 py-0.5 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                  >
                    <option value="">Uncategorized</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
