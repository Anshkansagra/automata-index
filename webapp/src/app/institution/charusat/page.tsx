import Link from "next/link";
import type { Metadata } from "next";
import { getPapersByAuthor } from "@/lib/queries";
import { getSavedPaperIdSet } from "@/lib/savedPapers";
import { createClient } from "@/lib/supabase/server";
import { PaperCard } from "@/components/PaperCard";
import { isCitationStyle } from "@/lib/citation";
import type { Paper } from "@/lib/types";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const citationStyle = isCitationStyle(user?.user_metadata?.citation_style)
    ? user.user_metadata.citation_style
    : undefined;

  const [perAuthorPapers, savedIds] = await Promise.all([
    Promise.all(CHARUSAT_AUTHORS.map((name) => getPapersByAuthor(name))),
    user ? getSavedPaperIdSet(supabase, user.id) : Promise.resolve(new Set<string>()),
  ]);

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
        <div className="papers-columns mt-8">
          {papers.map((paper) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              isLoggedIn={!!user}
              isSaved={savedIds.has(paper.id)}
              citationStyle={citationStyle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
