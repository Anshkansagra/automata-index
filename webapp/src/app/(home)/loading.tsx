function CardSkeleton() {
  return (
    <div className="mb-4 animate-pulse break-inside-avoid rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-3 h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-2 h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-3 h-3 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-2 h-3 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
      <div className="mx-auto mb-6 h-12 w-full max-w-3xl animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      <div className="papers-columns">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
