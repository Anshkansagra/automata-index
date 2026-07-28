import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSavedPapers } from "@/lib/savedPapers";
import { getSavedSearches } from "@/lib/savedSearches";
import { PaperCard } from "@/components/PaperCard";
import { SavedSearchList } from "@/components/SavedSearchList";
import { RoboticGripper } from "@/components/illustrations";

export default async function SavedPapersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [papers, searches] = await Promise.all([
    getSavedPapers(supabase, user.id),
    getSavedSearches(supabase, user.id),
  ]);
  const savedIds = new Set(papers.map((p) => p.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Saved
        </h1>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Saved searches — email me new matches
        </h2>
        <SavedSearchList initialSearches={searches} />
      </div>

      <div className="mt-10">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Saved papers
        </h2>
        {papers.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="h-40 w-40 text-zinc-300 dark:text-zinc-700">
              <RoboticGripper />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No saved papers yet.
            </p>
            <Link
              href="/#browse"
              className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Browse papers
            </Link>
          </div>
        ) : (
          <div className="papers-columns">
            {papers.map((paper) => (
              <PaperCard
                key={paper.id}
                paper={paper}
                isLoggedIn={true}
                isSaved={savedIds.has(paper.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
