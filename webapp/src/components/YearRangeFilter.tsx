const CURRENT_YEAR = new Date().getFullYear();

export function YearRangeFilter({
  yearFrom,
  yearTo,
  q,
  source,
  sort,
}: {
  yearFrom?: number;
  yearTo?: number;
  q?: string;
  source?: string;
  sort?: string;
}) {
  return (
    <form action="/" method="get" className="flex flex-wrap items-center gap-2 text-sm">
      {q && <input type="hidden" name="q" value={q} />}
      {source && <input type="hidden" name="source" value={source} />}
      {sort && <input type="hidden" name="sort" value={sort} />}
      <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Year</span>
      <input
        type="number"
        name="yearFrom"
        defaultValue={yearFrom ?? ""}
        placeholder="From"
        min={1900}
        max={CURRENT_YEAR}
        className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <span className="text-zinc-400">–</span>
      <input
        type="number"
        name="yearTo"
        defaultValue={yearTo ?? ""}
        placeholder="To"
        min={1900}
        max={CURRENT_YEAR}
        className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:border-accent hover:text-accent dark:border-zinc-700 dark:text-zinc-300"
      >
        Apply
      </button>
    </form>
  );
}
