import { getPapers } from "@/lib/queries";
import { getSavedPaperIdSet } from "@/lib/savedPapers";
import { createClient } from "@/lib/supabase/server";
import { PaperCard } from "@/components/PaperCard";
import { SearchBar } from "@/components/SearchBar";
import { FilterPills } from "@/components/FilterPills";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { TopicExplorer } from "@/components/TopicExplorer";
import { SaveSearchButton } from "@/components/SaveSearchButton";
import { logSearch } from "@/lib/searchHistory";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; source?: string }>;
}) {
  const { q = "", source } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [papers, savedIds] = await Promise.all([
    getPapers({ q, source }),
    user ? getSavedPaperIdSet(supabase, user.id) : Promise.resolve(new Set<string>()),
  ]);

  if (user && q.trim()) {
    logSearch(supabase, user.id, q.trim());
  }

  return (
    <div className="bg-zinc-50 dark:bg-black">
      <HeroSlideshow />

      <main id="browse" className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16 sm:px-8">
        <SearchBar defaultValue={q} />
        {q.trim() && (
          <SaveSearchButton query={q} source={source ?? null} isLoggedIn={!!user} />
        )}
        <FilterPills q={q} activeSource={source ?? null} />

        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Explore by topic
          </h2>
          <TopicExplorer />
        </div>

        <div className="flex flex-col gap-4">
          {papers.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No papers found. Try a different search term.
            </p>
          ) : (
            papers.map((paper) => (
              <PaperCard
                key={paper.id}
                paper={paper}
                isLoggedIn={!!user}
                isSaved={savedIds.has(paper.id)}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
