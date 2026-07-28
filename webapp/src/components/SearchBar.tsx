export function SearchBar({ defaultValue }: { defaultValue: string }) {
  return (
    <form action="/" method="get" className="relative w-full">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search robotics, ML, deep learning, neural networks…"
        className="w-full rounded-full border border-zinc-300 bg-white px-5 py-3 pr-12 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded border border-zinc-300 px-1.5 py-0.5 text-xs text-zinc-400 sm:block dark:border-zinc-700 dark:text-zinc-500">
        /
      </kbd>
    </form>
  );
}
