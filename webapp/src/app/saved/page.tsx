import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSavedPapers } from "@/lib/savedPapers";
import { getSavedSearches } from "@/lib/savedSearches";
import { getCollections } from "@/lib/collections";
import { SavedSearchList } from "@/components/SavedSearchList";
import { SavedPapersExport } from "@/components/SavedPapersExport";
import { SavedPapersSection } from "@/components/SavedPapersSection";
import { isCitationStyle } from "@/lib/citation";

export default async function SavedPapersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  const citationStyle = isCitationStyle(user.user_metadata?.citation_style)
    ? user.user_metadata.citation_style
    : undefined;

  const [papers, searches, collections] = await Promise.all([
    getSavedPapers(supabase, user.id),
    getSavedSearches(supabase, user.id),
    getCollections(supabase, user.id),
  ]);

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
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Saved papers
          </h2>
          <SavedPapersExport papers={papers} />
        </div>
        <SavedPapersSection
          userId={user.id}
          initialPapers={papers}
          initialCollections={collections}
          citationStyle={citationStyle}
        />
      </div>
    </div>
  );
}
