"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TOPIC_TAXONOMY } from "@/lib/topics";

const selectClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition-colors focus:border-accent disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";

export function TopicExplorer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState("");
  const [term, setTerm] = useState("");
  const [pendingTerm, setPendingTerm] = useState<string | null>(null);
  const [paramsSnapshot, setParamsSnapshot] = useState(searchParams.toString());
  const wasPending = useRef(false);

  // Render-time state adjustment (React's documented pattern for reacting to
  // a changed value without an effect): once the URL's own `q` reflects the
  // term we requested, the navigation has actually landed.
  const currentSnapshot = searchParams.toString();
  if (currentSnapshot !== paramsSnapshot) {
    setParamsSnapshot(currentSnapshot);
    if (pendingTerm && searchParams.get("q") === pendingTerm) {
      setPendingTerm(null);
    }
  }

  // Safety net so the "please wait" box never gets stuck open, and a scroll
  // to the results once it clears — same-hash (#browse) navigations don't
  // reliably re-trigger the browser's own anchor scroll, so this is explicit.
  useEffect(() => {
    if (pendingTerm) {
      wasPending.current = true;
      const timeout = setTimeout(() => setPendingTerm(null), 4000);
      return () => clearTimeout(timeout);
    }
    if (wasPending.current) {
      wasPending.current = false;
      document.getElementById("browse")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [pendingTerm]);

  const categoryTerms = TOPIC_TAXONOMY.find((g) => g.category === category)?.terms ?? [];

  function goToTerm(value: string) {
    if (!value) return;
    setTerm(value);
    setPendingTerm(value);
    router.push(`/?q=${encodeURIComponent(value)}#browse`);
  }

  return (
    <div className="relative rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="topic-select"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            Topic
          </label>
          <select
            id="topic-select"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setTerm("");
            }}
            className={selectClass}
          >
            <option value="">Select a topic…</option>
            {TOPIC_TAXONOMY.map((group) => (
              <option key={group.category} value={group.category}>
                {group.category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="subtopic-select"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            Subtopic
          </label>
          <select
            id="subtopic-select"
            value={term}
            disabled={!category}
            onChange={(e) => goToTerm(e.target.value)}
            className={selectClass}
          >
            <option value="">{category ? "Select a subtopic…" : "Choose a topic first"}</option>
            {categoryTerms.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {pendingTerm && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/90 backdrop-blur-sm dark:bg-zinc-950/90">
          <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-zinc-300 border-t-accent dark:border-zinc-700" />
            Please wait while we open &ldquo;{pendingTerm}&rdquo;…
          </div>
        </div>
      )}
    </div>
  );
}
