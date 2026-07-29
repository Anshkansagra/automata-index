import Link from "next/link";

const SOURCES: { label: string; value: string }[] = [
  { label: "arXiv", value: "arxiv" },
  { label: "CORE", value: "core" },
  { label: "MDPI / IEEE (OA)", value: "crossref" },
  { label: "OpenAlex", value: "openalex" },
];

function buildHref(
  q: string,
  activeSources: string[],
  toggled: string | null,
  extraParams: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);

  const nextSources = toggled
    ? activeSources.includes(toggled)
      ? activeSources.filter((s) => s !== toggled)
      : [...activeSources, toggled]
    : []; // toggled === null → "All sources" clears the selection

  if (nextSources.length > 0) params.set("source", nextSources.join(","));
  for (const [key, value] of Object.entries(extraParams)) {
    if (value) params.set(key, value);
  }

  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

function buildFeedHref(q: string, activeSources: string[], sort?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (activeSources.length > 0) params.set("source", activeSources.join(","));
  if (sort) params.set("sort", sort);
  const qs = params.toString();
  return qs ? `/feed.xml?${qs}` : "/feed.xml";
}

export function FilterPills({
  q,
  activeSources,
  extraParams = {},
}: {
  q: string;
  activeSources: string[];
  extraParams?: Record<string, string | undefined>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={buildHref(q, activeSources, null, extraParams)}
        className={`rounded-full border px-3 py-1 text-sm transition-colors ${
          activeSources.length === 0
            ? "border-accent bg-accent text-white"
            : "border-zinc-300 text-zinc-700 hover:border-accent hover:text-accent dark:border-zinc-700 dark:text-zinc-300"
        }`}
      >
        All sources
      </Link>
      {SOURCES.map(({ label, value }) => {
        const isActive = activeSources.includes(value);
        return (
          <Link
            key={value}
            href={buildHref(q, activeSources, value, extraParams)}
            aria-pressed={isActive}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              isActive
                ? "border-accent bg-accent text-white"
                : "border-zinc-300 text-zinc-700 hover:border-accent hover:text-accent dark:border-zinc-700 dark:text-zinc-300"
            }`}
          >
            {label}
          </Link>
        );
      })}
      <a
        href={buildFeedHref(q, activeSources, extraParams.sort)}
        title="Subscribe to this search as an RSS feed"
        className="flex items-center gap-1 rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-500 transition-colors hover:border-accent hover:text-accent dark:border-zinc-700 dark:text-zinc-400"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
          <path d="M4 4a16 16 0 0 1 16 16h-3a13 13 0 0 0-13-13V4zM4 10a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7v-3zM6.5 15.5A2.5 2.5 0 1 1 4 18a2.5 2.5 0 0 1 2.5-2.5z" />
        </svg>
        RSS
      </a>
    </div>
  );
}
