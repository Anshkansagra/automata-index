import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPaperById, getRelatedPapers } from "@/lib/queries";
import { getSavedPaperIdSet } from "@/lib/savedPapers";
import { createClient } from "@/lib/supabase/server";
import { PaperCard } from "@/components/PaperCard";
import { SaveButton } from "@/components/SaveButton";
import { CiteButton } from "@/components/CiteButton";
import { PdfPreview } from "@/components/PdfPreview";
import { AlsoIndexedVia } from "@/components/AlsoIndexedVia";

const SITE_URL = "https://automata-index.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const paper = await getPaperById(id);
  if (!paper) return { title: "Paper not found — Cortexa" };

  const description = paper.abstract
    ? paper.abstract.slice(0, 200).trimEnd() + (paper.abstract.length > 200 ? "…" : "")
    : `${paper.authors.slice(0, 3).join(", ")} — free open-access paper on Cortexa.`;

  return {
    title: `${paper.title} — Cortexa`,
    description,
    alternates: { canonical: `${SITE_URL}/paper/${paper.id}` },
    openGraph: {
      title: paper.title,
      description,
      url: `${SITE_URL}/paper/${paper.id}`,
      type: "article",
      publishedTime: paper.published_date ?? undefined,
      authors: paper.authors,
    },
    twitter: {
      card: "summary",
      title: paper.title,
      description,
    },
  };
}

export default async function PaperDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paper = await getPaperById(id);
  if (!paper) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [related, savedIds] = await Promise.all([
    getRelatedPapers(paper),
    user ? getSavedPaperIdSet(supabase, user.id) : Promise.resolve(new Set<string>()),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
      <Link
        href="/#browse"
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Browse
      </Link>

      <article className="mt-6">
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
          {typeof paper.citation_count === "number" && (
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Cited by {paper.citation_count}
            </span>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
          {paper.title}
        </h1>

        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {paper.authors.map((author, i) => (
            <span key={author}>
              <Link
                href={`/author/${encodeURIComponent(author)}`}
                className="hover:text-accent hover:underline"
              >
                {author}
              </Link>
              {i < paper.authors.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>

        {paper.tldr && (
          <p className="mt-4 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            TL;DR: {paper.tldr}
          </p>
        )}

        {paper.abstract && (
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {paper.abstract}
          </p>
        )}

        <AlsoIndexedVia entries={paper.also_indexed_via} />

        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          {paper.pdf_url && (
            <>
              <a
                href={paper.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent hover:underline"
              >
                View free PDF
              </a>
              <PdfPreview url={paper.pdf_url} title={paper.title} />
            </>
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
          {user && <SaveButton paperId={paper.id} initialSaved={savedIds.has(paper.id)} />}
        </div>
      </article>

      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Related papers
          </h2>
          <div className="papers-columns">
            {related.map((r) => (
              <PaperCard key={r.id} paper={r} isLoggedIn={!!user} isSaved={savedIds.has(r.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
