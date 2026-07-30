import type { Metadata } from "next";
import Link from "next/link";
import { getPapersByAuthor } from "@/lib/queries";
import { getSavedPaperIdSet } from "@/lib/savedPapers";
import { createClient } from "@/lib/supabase/server";
import { PaperCard } from "@/components/PaperCard";
import { isCitationStyle } from "@/lib/citation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const author = decodeURIComponent(name);
  return {
    title: `${author} — Papers on Cortexa`,
    description: `Open-access papers by ${author}, indexed free on Cortexa.`,
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const author = decodeURIComponent(name);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const citationStyle = isCitationStyle(user?.user_metadata?.citation_style)
    ? user.user_metadata.citation_style
    : undefined;

  const [papers, savedIds] = await Promise.all([
    getPapersByAuthor(author),
    user ? getSavedPaperIdSet(supabase, user.id) : Promise.resolve(new Set<string>()),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
      <Link
        href="/#browse"
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Browse
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{author}</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {papers.length} {papers.length === 1 ? "paper" : "papers"} indexed
      </p>

      {papers.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No papers found for this author.
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
