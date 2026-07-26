import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSavedPapers } from "@/lib/savedPapers";
import { PaperCard } from "@/components/PaperCard";

export default async function SavedPapersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const papers = await getSavedPapers(supabase, user.id);
  const savedIds = new Set(papers.map((p) => p.id));

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Saved papers
        </h1>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {papers.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No saved papers yet — click ☆ Save on any paper to add it here.
          </p>
        ) : (
          papers.map((paper) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              isLoggedIn={true}
              isSaved={savedIds.has(paper.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
