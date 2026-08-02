import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabasePublic } from "@/lib/supabase/public";
import { getPapers } from "@/lib/queries";
import { getSavedPaperIdSet } from "@/lib/savedPapers";
import { PaperCard } from "@/components/PaperCard";
import { isCitationStyle } from "@/lib/citation";
import { getSessionUser } from "@/lib/auth/sessionUser";

async function getStats() {
  const [
    { count: total },
    { count: arxiv },
    { count: crossref },
    { count: mdpi },
    { count: ieee },
    { count: openalex },
    { count: core },
    { count: semanticScholar },
    { count: zenodo },
  ] = await Promise.all([
    supabasePublic.from("papers").select("id", { count: "exact", head: true }),
    supabasePublic.from("papers").select("id", { count: "exact", head: true }).eq("source", "arxiv"),
    supabasePublic.from("papers").select("id", { count: "exact", head: true }).eq("source", "crossref"),
    supabasePublic
      .from("papers")
      .select("id", { count: "exact", head: true })
      .eq("source", "crossref")
      .or("publisher.ilike.%MDPI%,publisher.ilike.%Multidisciplinary%"),
    supabasePublic
      .from("papers")
      .select("id", { count: "exact", head: true })
      .eq("source", "crossref")
      .ilike("publisher", "%Electrical and Electronics%"),
    supabasePublic.from("papers").select("id", { count: "exact", head: true }).eq("source", "openalex"),
    supabasePublic.from("papers").select("id", { count: "exact", head: true }).eq("source", "core"),
    supabasePublic
      .from("papers")
      .select("id", { count: "exact", head: true })
      .eq("source", "semantic_scholar"),
    supabasePublic.from("papers").select("id", { count: "exact", head: true }).eq("source", "zenodo"),
  ]);

  return {
    total: total ?? 0,
    arxiv: arxiv ?? 0,
    crossref: crossref ?? 0,
    mdpi: mdpi ?? 0,
    ieee: ieee ?? 0,
    openalex: openalex ?? 0,
    core: core ?? 0,
    semanticScholar: semanticScholar ?? 0,
    zenodo: zenodo ?? 0,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const [stats, recentPapers, savedIds] = await Promise.all([
    getStats(),
    getPapers({ limit: 10 }),
    getSavedPaperIdSet(supabase, user.id),
  ]);
  const name = (user.user_metadata?.full_name as string | undefined) || user.email;
  const citationStyle = isCitationStyle(user.user_metadata?.citation_style)
    ? user.user_metadata.citation_style
    : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Welcome back, {name}
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total papers indexed", value: stats.total },
          { label: "arXiv", value: stats.arxiv },
          { label: "MDPI", value: stats.mdpi },
          { label: "IEEE (OA)", value: stats.ieee },
          { label: "OpenAlex", value: stats.openalex },
          { label: "CORE", value: stats.core },
          { label: "Semantic Scholar", value: stats.semanticScholar },
          { label: "Zenodo", value: stats.zenodo },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-zinc-200 border-t-2 border-t-accent p-4 dark:border-zinc-800 dark:border-t-accent"
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
        <div className="flex gap-4 text-sm font-medium">
          <Link
            href="/saved"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Saved papers ({savedIds.size}) →
          </Link>
          <Link
            href="/#browse"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Browse all →
          </Link>
        </div>
      </div>

      <div className="papers-columns mt-4">
        {recentPapers.map((paper) => (
          <PaperCard
            key={paper.id}
            paper={paper}
            isLoggedIn={true}
            isSaved={savedIds.has(paper.id)}
            citationStyle={citationStyle}
          />
        ))}
      </div>
    </div>
  );
}
