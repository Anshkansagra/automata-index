import { getPapers } from "@/lib/queries";
import { PaperCard } from "@/components/PaperCard";
import { SearchBar } from "@/components/SearchBar";
import { FilterPills } from "@/components/FilterPills";
import { HeroSlideshow } from "@/components/HeroSlideshow";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; source?: string }>;
}) {
  const { q = "", source } = await searchParams;
  const papers = await getPapers({ q, source });

  return (
    <div className="bg-zinc-50 dark:bg-black">
      <HeroSlideshow />

      <main id="browse" className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16 sm:px-8">
        <SearchBar defaultValue={q} />
        <FilterPills q={q} activeSource={source ?? null} />

        <div className="flex flex-col gap-4">
          {papers.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No papers found. Try a different search term.
            </p>
          ) : (
            papers.map((paper) => <PaperCard key={paper.id} paper={paper} />)
          )}
        </div>
      </main>
    </div>
  );
}
