import Link from "next/link";

const OPTIONS: { label: string; value: "recent" | "cited" }[] = [
  { label: "Most Recent", value: "recent" },
  { label: "Most Cited", value: "cited" },
];

function buildHref(
  activeSort: string,
  value: string,
  extraParams: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(extraParams)) {
    if (val) params.set(key, val);
  }
  if (value !== "recent") params.set("sort", value);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export function SortControl({
  activeSort,
  isSearching,
  extraParams = {},
}: {
  activeSort: string;
  isSearching: boolean;
  extraParams?: Record<string, string | undefined>;
}) {
  if (isSearching) {
    return <span className="text-xs text-zinc-500 dark:text-zinc-400">Sorted by relevance</span>;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Sort</span>
      {OPTIONS.map(({ label, value }) => {
        const isActive = activeSort === value;
        return (
          <Link
            key={value}
            href={buildHref(activeSort, value, extraParams)}
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
