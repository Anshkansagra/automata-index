import type { Paper } from "@/lib/types";
import { SaveButton } from "@/components/SaveButton";
import { CiteButton } from "@/components/CiteButton";
import { AbstractText } from "@/components/AbstractText";

export function PaperCard({
  paper,
  isLoggedIn = false,
  isSaved = false,
}: {
  paper: Paper;
  isLoggedIn?: boolean;
  isSaved?: boolean;
}) {
  return (
    <article className="rounded-lg border border-zinc-200 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg dark:border-zinc-800 dark:hover:shadow-black/40">
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium uppercase tracking-wide text-accent">
          {paper.source}
        </span>
        {paper.categories.map((c) => (
          <span key={c} className="rounded-full border border-zinc-200 px-2 py-0.5 dark:border-zinc-700">
            {c}
          </span>
        ))}
        {paper.published_date && <span>{paper.published_date}</span>}
      </div>

      <h2 className="mt-2 text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
        {paper.title}
      </h2>

      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {paper.authors.slice(0, 6).join(", ")}
        {paper.authors.length > 6 ? ", et al." : ""}
      </p>

      {paper.tldr && (
        <p className="mt-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
          TL;DR: {paper.tldr}
        </p>
      )}

      {paper.abstract && <AbstractText text={paper.abstract} />}

      <div className="mt-3 flex gap-3 text-sm">
        {paper.pdf_url && (
          <a
            href={paper.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            View free PDF
          </a>
        )}
        <a
          href={paper.landing_page_url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-zinc-600 hover:underline dark:text-zinc-400"
        >
          Source page
        </a>
        <CiteButton paper={paper} />
        {isLoggedIn && <SaveButton paperId={paper.id} initialSaved={isSaved} />}
      </div>
    </article>
  );
}
