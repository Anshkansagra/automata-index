// Suspense fallback for <Sidebar /> — matches its layout exactly (mobile top
// bar + desktop fixed aside) so there's no shift when the real one streams
// in. Static (no session/data calls), which is the whole point: wrapping
// Sidebar in Suspense keeps its per-request session lookup from forcing
// every page in the app into dynamic rendering, so pages with no dynamic
// data of their own (terms, privacy, about, methodology, developers, login,
// register) can be served from cache instead of hitting Supabase on every
// single visit or crawler request.
export function SidebarSkeleton() {
  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-black/80">
        <span className="flex items-center gap-2 text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-50">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          CORTEXA
        </span>
      </div>

      <aside className="fixed left-0 top-0 z-50 hidden h-full w-64 flex-col overflow-y-auto border-r border-zinc-200 bg-white p-4 md:flex dark:border-zinc-800 dark:bg-black">
        <span className="flex items-center gap-2 text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-50">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          CORTEXA
        </span>
      </aside>
    </>
  );
}
