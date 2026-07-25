import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabasePublic } from "@/lib/supabase/public";
import { getPapers } from "@/lib/queries";
import { PaperCard } from "@/components/PaperCard";

async function getStats() {
  const [{ count: total }, { count: arxiv }, { count: crossref }, { count: core }] =
    await Promise.all([
      supabasePublic.from("papers").select("id", { count: "exact", head: true }),
      supabasePublic.from("papers").select("id", { count: "exact", head: true }).eq("source", "arxiv"),
      supabasePublic.from("papers").select("id", { count: "exact", head: true }).eq("source", "crossref"),
      supabasePublic.from("papers").select("id", { count: "exact", head: true }).eq("source", "core"),
    ]);

  return { total: total ?? 0, arxiv: arxiv ?? 0, crossref: crossref ?? 0, core: core ?? 0 };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [stats, recentPapers] = await Promise.all([getStats(), getPapers({ limit: 10 })]);
  const name = (user.user_metadata?.full_name as string | undefined) || user.email;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Welcome back, {name}
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total papers indexed", value: stats.total },
          { label: "arXiv", value: stats.arxiv },
          { label: "MDPI / IEEE (OA)", value: stats.crossref },
          { label: "CORE", value: stats.core },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {stat.value.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Latest papers
        </h2>
        <Link
          href="/#browse"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Browse all →
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {recentPapers.map((paper) => (
          <PaperCard key={paper.id} paper={paper} />
        ))}
      </div>
    </div>
  );
}
