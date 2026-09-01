import Link from "next/link";
import type { Metadata } from "next";
import { getPapersByAuthor } from "@/lib/queries";
import { PersonalizedPaperList } from "@/components/PersonalizedPaperList";
import type { Paper } from "@/lib/types";

// ISR — no session lookup here (see PersonalizedPaperList), so this page can
// be cached instead of hitting Supabase on every visit. Revalidates hourly
// so newly-ingested papers still show up reasonably promptly.
export const revalidate = 3600;

// Confirmed via OpenAlex author search + cross-checked co-authorship (all
// three repeatedly co-author 6G/wireless-communication papers together) —
// not just name-matched. See src/lib/ingest/authors.ts for the pinned
// OpenAlex author ids used during ingestion to avoid namesake collisions
// (there's an unrelated "Hardik Modi" at Bristol-Myers Squibb and an
// unrelated "Sagarkumar Patel" at Florida State in OpenAlex's index).
const CHARUSAT_AUTHORS = ["Dharmendra Chauhan", "Hardik Modi", "Sagarkumar Patel"];

export const metadata: Metadata = {
  title: "CHARUSAT — Papers on Cortexa",
  description:
    "Open-access research from CHARUSAT (Charotar University of Science and Technology) faculty, indexed free on Cortexa.",
};

export default async function CharusatInstitutionPage() {
  const perAuthorPapers = await Promise.all(CHARUSAT_AUTHORS.map((name) => getPapersByAuthor(name)));

  const byId = new Map<string, Paper>();
  for (const list of perAuthorPapers) {
    for (const paper of list) {
      if (!byId.has(paper.id)) byId.set(paper.id, paper);
    }
  }
  const papers = Array.from(byId.values()).sort((a, b) =>
    (b.published_date ?? "").localeCompare(a.published_date ?? "")
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
      <Link
        href="/#browse"
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Browse
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">CHARUSAT</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Charotar University of Science and Technology — {papers.length}{" "}
        {papers.length === 1 ? "paper" : "papers"} indexed from the faculty below.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {CHARUSAT_AUTHORS.map((name) => (
          <Link
            key={name}
            href={`/author/${encodeURIComponent(name)}`}
            className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-600 hover:border-accent hover:text-accent dark:border-zinc-700 dark:text-zinc-400"
          >
            {name}
          </Link>
        ))}
      </div>

      {papers.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No papers indexed yet — check back after the next ingestion run.
        </p>
      ) : (
        <div className="mt-8">
          <PersonalizedPaperList papers={papers} />
        </div>
      )}
    </div>
  );
}
