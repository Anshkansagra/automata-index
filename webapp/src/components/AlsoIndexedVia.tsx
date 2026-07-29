import type { Paper } from "@/lib/types";

const SOURCE_LABELS: Record<string, string> = {
  arxiv: "arXiv",
  crossref: "CrossRef",
  openalex: "OpenAlex",
  core: "CORE",
};

export function AlsoIndexedVia({ entries }: { entries: Paper["also_indexed_via"] | undefined }) {
  if (!entries || entries.length === 0) return null;

  return (
    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
      Also available via:{" "}
      {entries.map((entry, i) => (
        <span key={entry.url}>
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            {entry.publisher || SOURCE_LABELS[entry.source] || entry.source}
          </a>
          {i < entries.length - 1 ? ", " : ""}
        </span>
      ))}
    </p>
  );
}
