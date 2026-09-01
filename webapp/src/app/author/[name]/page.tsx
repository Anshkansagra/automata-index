import type { Metadata } from "next";
import Link from "next/link";
import { getPapersByAuthor } from "@/lib/queries";
import { PersonalizedPaperList } from "@/components/PersonalizedPaperList";

// ISR — no session lookup here (see PersonalizedPaperList), so this page can
// be cached instead of hitting Supabase on every visit or crawler request.
// Confirmed via Vercel's traffic logs this was the single largest cost
// driver site-wide: 7,800+ hits in 2 hours on this route alone. Revalidates
// hourly so newly-ingested papers by an author still show up reasonably
// promptly.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const author = decodeURIComponent(name);
  return {
    title: `${author} — Papers on Cortexa`,
    description: `Open-access papers by ${author}, indexed free on Cortexa.`,
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const author = decodeURIComponent(name);

  const papers = await getPapersByAuthor(author);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
      <Link
        href="/#browse"
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Browse
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{author}</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {papers.length} {papers.length === 1 ? "paper" : "papers"} indexed
      </p>

      {papers.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No papers found for this author.
        </p>
      ) : (
        <div className="mt-8">
          <PersonalizedPaperList papers={papers} />
        </div>
      )}
    </div>
  );
}
