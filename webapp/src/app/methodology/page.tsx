import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology — Cortexa",
  description:
    "How Cortexa sources, verifies, and indexes open-access research papers — and what counts as genuinely open access here.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <div className="mt-2 flex flex-col gap-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">How Cortexa works</h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        A short, honest account of where the index comes from and how &ldquo;open access&rdquo; is
        decided — written for anyone deciding whether to trust a link before clicking it.
      </p>

      <Section title="Sources">
        <p>
          Cortexa pulls from three places, rebuilt daily: <strong>arXiv</strong> (via its public
          Atom API, across robotics, ML, AI, computer vision, and related categories),{" "}
          <strong>CrossRef</strong> (covering MDPI, individually open-access IEEE Transactions
          articles, and other open-access publishers), and <strong>OpenAlex</strong> (a broad
          scholarly index, used both for general coverage and for excluding results already
          covered by arXiv so the sources stay complementary rather than redundant).
        </p>
      </Section>

      <Section title="What &ldquo;open access&rdquo; means here">
        <p>
          &ldquo;Open access&rdquo; isn&apos;t one uniform thing across publishers. MDPI is 100%
          open access by policy, so every MDPI paper qualifies automatically. Everywhere else —
          IEEE, Springer, Elsevier, and other publishers — a paper only gets indexed if{" "}
          <strong>its own record carries a verified Creative Commons license</strong>, regardless
          of which journal it technically appeared in. That&apos;s what lets Cortexa include
          individually open-access articles from otherwise-paywalled IEEE Transactions journals,
          without misrepresenting the paywalled majority of that same journal as free.
        </p>
        <p>
          A paper never gets marked open access just because it showed up in an open-access-
          sounding search result — the license check happens per-article, every time.
        </p>
      </Section>

      <Section title="PDF link verification">
        <p>
          Publisher APIs sometimes list a metadata endpoint as the &ldquo;PDF link&rdquo; instead
          of the actual file — clicking it opens raw XML instead of a paper. Every PDF link is
          checked against a small set of rules (rejecting API-shaped hostnames, metadata paths,
          and telltale query parameters) before it&apos;s ever shown as &ldquo;View free
          PDF.&rdquo; When a link doesn&apos;t pass, Cortexa falls back to linking the
          paper&apos;s landing page instead of showing a broken download.
        </p>
      </Section>

      <Section title="Deduplication">
        <p>
          The same paper often exists in more than one source — an arXiv preprint later published
          in IEEE Access, for instance. Cortexa keeps one canonical entry per paper (matched by
          DOI) rather than showing duplicates, and notes the others as &ldquo;also available
          via&rdquo; on that entry instead of dropping the information entirely.
        </p>
      </Section>

      <Section title="What this isn&apos;t">
        <p>
          Cortexa doesn&apos;t host, mirror, or redistribute any paper&apos;s file. Every download
          link points to the publisher&apos;s or repository&apos;s own copy. Nothing here is
          scraped from behind a paywall.
        </p>
      </Section>

      <div className="mt-10 flex justify-center gap-4">
        <Link
          href="/about"
          className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:border-accent hover:text-accent dark:border-zinc-700 dark:text-zinc-300"
        >
          About
        </Link>
        <Link
          href="/"
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          ← Back to Cortexa
        </Link>
      </div>
    </div>
  );
}
