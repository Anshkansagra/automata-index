import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicCollection } from "@/lib/collections";
import { getSavedPaperIdSet } from "@/lib/savedPapers";
import { createClient } from "@/lib/supabase/server";
import { PaperCard } from "@/components/PaperCard";
import { isCitationStyle } from "@/lib/citation";
import { getSessionUser } from "@/lib/auth/sessionUser";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const collection = await getPublicCollection(id);
  if (!collection) return { title: "Collection not found — Cortexa" };

  return {
    title: `${collection.name} — a Cortexa collection`,
    description: `A shared reading list of ${collection.papers.length} open-access papers on Cortexa.`,
  };
}

export default async function PublicCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = await getPublicCollection(id);
  if (!collection) notFound();

  const supabase = await createClient();
  const user = await getSessionUser();
  const citationStyle = isCitationStyle(user?.user_metadata?.citation_style)
    ? user.user_metadata.citation_style
    : undefined;
  const savedIds = user ? await getSavedPaperIdSet(supabase, user.id) : new Set<string>();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
      <Link
        href="/#browse"
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Browse
      </Link>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-accent">🔗</span>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{collection.name}</h1>
      </div>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        A shared Cortexa collection — {collection.papers.length}{" "}
        {collection.papers.length === 1 ? "paper" : "papers"}.
      </p>

      {collection.papers.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
          This collection is empty.
        </p>
      ) : (
        <div className="papers-columns mt-8">
          {collection.papers.map((paper) => (
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
