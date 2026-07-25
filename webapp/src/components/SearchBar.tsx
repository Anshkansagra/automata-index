export function SearchBar({ defaultValue }: { defaultValue: string }) {
  return (
    <form action="/" method="get" className="w-full">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search robotics, ML, deep learning, neural networks…"
        className="w-full rounded-full border border-zinc-300 bg-white px-5 py-3 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
    </form>
  );
}
