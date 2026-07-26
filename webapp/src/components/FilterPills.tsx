import Link from "next/link";

const SOURCES: { label: string; value: string | null }[] = [
  { label: "All sources", value: null },
  { label: "arXiv", value: "arxiv" },
  { label: "CORE", value: "core" },
  { label: "MDPI / IEEE (OA)", value: "crossref" },
  { label: "OpenAlex", value: "openalex" },
];

function buildHref(q: string, source: string | null) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (source) params.set("source", source);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export function FilterPills({
  q,
  activeSource,
}: {
  q: string;
  activeSource: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {SOURCES.map(({ label, value }) => {
        const isActive = value === activeSource;
        return (
          <Link
            key={label}
            href={buildHref(q, value)}
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
