"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { clearAllSearchHistory } from "@/lib/searchHistory";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      {children}
    </div>
  );
}

function selectClass() {
  return "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";
}

type Props = {
  userId: string;
  notificationsEnabled: boolean;
  digestFrequency: "daily" | "weekly";
  defaultSort: "recent" | "cited";
  defaultSource: string;
  resultsPerPage: number;
};

const SOURCE_OPTIONS = [
  { label: "All sources", value: "" },
  { label: "arXiv", value: "arxiv" },
  { label: "CORE", value: "core" },
  { label: "MDPI / IEEE (OA)", value: "crossref" },
  { label: "OpenAlex", value: "openalex" },
  { label: "Semantic Scholar", value: "semantic_scholar" },
  { label: "Zenodo", value: "zenodo" },
];

const SHORTCUTS = [
  { keys: "/", description: "Jump to the search bar from anywhere" },
  { keys: "?", description: "Show this shortcuts reference" },
];

export function SettingsForm({
  userId,
  notificationsEnabled,
  digestFrequency,
  defaultSort,
  defaultSource,
  resultsPerPage,
}: Props) {
  const [notifEnabled, setNotifEnabled] = useState(notificationsEnabled);
  const [frequency, setFrequency] = useState(digestFrequency);
  const [notifStatus, setNotifStatus] = useState<"idle" | "saved">("idle");

  const [sort, setSort] = useState(defaultSort);
  const [source, setSource] = useState(defaultSource);
  const [perPage, setPerPage] = useState(resultsPerPage);
  const [browseStatus, setBrowseStatus] = useState<"idle" | "saved">("idle");

  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  async function saveNotifications(next: Partial<{ enabled: boolean; frequency: "daily" | "weekly" }>) {
    const supabase = createClient();
    await supabase.auth.updateUser({
      data: {
        digest_emails_enabled: next.enabled ?? notifEnabled,
        digest_frequency: next.frequency ?? frequency,
      },
    });
    setNotifStatus("saved");
    setTimeout(() => setNotifStatus("idle"), 1500);
  }

  async function saveBrowseDefaults(
    next: Partial<{ sort: "recent" | "cited"; source: string; perPage: number }>
  ) {
    const supabase = createClient();
    await supabase.auth.updateUser({
      data: {
        default_sort: next.sort ?? sort,
        default_source: next.source ?? source,
        results_per_page: next.perPage ?? perPage,
      },
    });
    setBrowseStatus("saved");
    setTimeout(() => setBrowseStatus("idle"), 1500);
  }

  async function handleClearHistory() {
    if (!window.confirm("Clear your entire search history? This can't be undone.")) return;
    setClearing(true);
    const supabase = createClient();
    await clearAllSearchHistory(supabase, userId);
    setClearing(false);
    setCleared(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="Notifications">
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Email me about new papers matching my saved searches
          </span>
          <input
            type="checkbox"
            checked={notifEnabled}
            onChange={(e) => {
              setNotifEnabled(e.target.checked);
              saveNotifications({ enabled: e.target.checked });
            }}
            className="h-5 w-5 accent-[var(--accent)]"
          />
        </label>

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">How often</span>
          <select
            value={frequency}
            disabled={!notifEnabled}
            onChange={(e) => {
              const next = e.target.value as "daily" | "weekly";
              setFrequency(next);
              saveNotifications({ frequency: next });
            }}
            className={`${selectClass()} disabled:opacity-40`}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        {notifStatus === "saved" && (
          <p className="mt-2 text-xs text-green-600 dark:text-green-400">Preference saved</p>
        )}
      </SectionCard>

      <SectionCard title="Browse defaults">
        <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
          Applied when you land on Cortexa without already picking a sort, source, or page size —
          an explicit choice always overrides these.
        </p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Default sort</span>
            <select
              value={sort}
              onChange={(e) => {
                const next = e.target.value as "recent" | "cited";
                setSort(next);
                saveBrowseDefaults({ sort: next });
              }}
              className={selectClass()}
            >
              <option value="recent">Most recent</option>
              <option value="cited">Most cited</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Default source</span>
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                saveBrowseDefaults({ source: e.target.value });
              }}
              className={selectClass()}
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Results per page</span>
            <select
              value={perPage}
              onChange={(e) => {
                const next = Number(e.target.value);
                setPerPage(next);
                saveBrowseDefaults({ perPage: next });
              }}
              className={selectClass()}
            >
              {[10, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {browseStatus === "saved" && (
          <p className="mt-3 text-xs text-green-600 dark:text-green-400">Preference saved</p>
        )}
      </SectionCard>

      <SectionCard title="Keyboard shortcuts">
        <div className="flex flex-col gap-2">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center gap-3 text-sm">
              <kbd className="rounded border border-zinc-300 bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {s.keys}
              </kbd>
              <span className="text-zinc-600 dark:text-zinc-400">{s.description}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Search history">
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
          Clears every entry from your recent searches in the sidebar. Doesn&apos;t affect saved
          searches or saved papers.
        </p>
        <button
          type="button"
          onClick={handleClearHistory}
          disabled={clearing || cleared}
          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-red-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
        >
          {cleared ? "Cleared" : clearing ? "Clearing…" : "Clear all search history"}
        </button>
      </SectionCard>
    </div>
  );
}
