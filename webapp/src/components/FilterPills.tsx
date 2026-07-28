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
    </div>
  );
}
