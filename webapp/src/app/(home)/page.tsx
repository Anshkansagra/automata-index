import { getPapers, type PaperSort } from "@/lib/queries";
import { getSavedPaperIdSet } from "@/lib/savedPapers";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/sessionUser";
import { PaperCard } from "@/components/PaperCard";
import { SearchBar } from "@/components/SearchBar";
import { FilterPills } from "@/components/FilterPills";
import { SortControl } from "@/components/SortControl";
import { YearRangeFilter } from "@/components/YearRangeFilter";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { TopicExplorer } from "@/components/TopicExplorer";
import { SaveSearchButton } from "@/components/SaveSearchButton";
import { logSearch } from "@/lib/searchHistory";
import { NeuralNetwork } from "@/components/illustrations";
import { isCitationStyle } from "@/lib/citation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    source?: string;
    sort?: string;
    yearFrom?: string;
    yearTo?: string;
  }>;
}) {
  const { q = "", source, sort, yearFrom, yearTo } = await searchParams;

  const supabase = await createClient();
  const user = await getSessionUser();
  const citationStyle = isCitationStyle(user?.user_metadata?.citation_style)
    ? user.user_metadata.citation_style
    : undefined;

  // Only fall back to the user's saved defaults when they haven't explicitly
  // picked something this visit — an explicit choice in the URL always wins.
  const defaultSource = (user?.user_metadata?.default_source as string) || "";
  const defaultSort = user?.user_metadata?.default_sort === "cited" ? "cited" : "recent";
  const resultsPerPage = Number(user?.user_metadata?.results_per_page) || 30;

  const activeSources = source
    ? source.split(",").map((s) => s.trim()).filter(Boolean)
    : defaultSource
      ? [defaultSource]
      : [];
  const activeSort: PaperSort = sort ? (sort === "cited" ? "cited" : "recent") : defaultSort;
  const yearFromNum = yearFrom ? Number(yearFrom) : undefined;
  const yearToNum = yearTo ? Number(yearTo) : undefined;

  const [papers, savedIds] = await Promise.all([
    getPapers({
      q,
      sources: activeSources,
      sort: activeSort,
      yearFrom: yearFromNum,
      yearTo: yearToNum,
      limit: resultsPerPage,
    }),
    user ? getSavedPaperIdSet(supabase, user.id) : Promise.resolve(new Set<string>()),
  ]);

  if (user && q.trim()) {
    logSearch(supabase, user.id, q.trim());
  }

  return (
    <div className="bg-zinc-50 dark:bg-black">
      <HeroSlideshow />

      <main id="browse" className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <SearchBar defaultValue={q} />
          {q.trim() && (
            <SaveSearchButton query={q} source={source ?? null} isLoggedIn={!!user} />
          )}
          <FilterPills q={q} activeSources={activeSources} extraParams={{ sort, yearFrom, yearTo }} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <SortControl
              activeSort={activeSort}
              isSearching={!!q.trim()}
              extraParams={{ q, source, yearFrom, yearTo }}
            />
            <YearRangeFilter
              yearFrom={yearFromNum}
              yearTo={yearToNum}
              q={q}
              source={source}
              sort={sort}
            />
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Explore by topic
            </h2>
            <TopicExplorer />
          </div>
        </div>

        {papers.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="h-40 w-40 text-zinc-300 dark:text-zinc-700">
              <NeuralNetwork />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No papers found. Try a different search term or clear your filters.
            </p>
          </div>
        ) : (
          <div className="papers-columns">
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
      </main>
    </div>
  );
}
