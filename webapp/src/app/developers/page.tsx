import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API — Cortexa",
  description: "Free, read-only API access to Cortexa's open-access paper index.",
};

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-zinc-900 p-4 text-xs leading-relaxed text-zinc-100 dark:bg-black">
      <code>{children}</code>
    </pre>
  );
}

export default function DevelopersPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">API</h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        Free, read-only access to the same paper index the site searches — for scripts,
        dashboards, or your own tools. No cost, no approval process.
      </p>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Get a key</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Generate one from{" "}
          <Link href="/profile" className="text-accent hover:underline">
            your profile
          </Link>
          . It&apos;s shown once at creation — copy it somewhere safe.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Request</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-900">GET /api/v1/papers</code>{" "}
          with your key as a bearer token:
        </p>
        <div className="mt-3">
          <CodeBlock>{`curl "https://automata-index.vercel.app/api/v1/papers?q=robotics&limit=10" \\
  -H "Authorization: Bearer cortexa_live_..."`}</CodeBlock>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Query parameters</h2>
        <div className="mt-2 overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="px-3 py-2">Param</th>
                <th className="px-3 py-2">Description</th>
              </tr>
            </thead>
            <tbody className="text-zinc-700 dark:text-zinc-300">
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-3 py-2 font-mono text-xs">q</td>
                <td className="px-3 py-2">Search query (relevance-ranked full-text search)</td>
              </tr>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-3 py-2 font-mono text-xs">source</td>
                <td className="px-3 py-2">Filter to one of: arxiv, crossref, openalex, core</td>
              </tr>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-3 py-2 font-mono text-xs">sort</td>
                <td className="px-3 py-2">recent (default) or cited</td>
              </tr>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-3 py-2 font-mono text-xs">yearFrom / yearTo</td>
                <td className="px-3 py-2">Restrict to a publication year range</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">limit</td>
                <td className="px-3 py-2">Results per request, default 20, max 50</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Response</h2>
        <div className="mt-2">
          <CodeBlock>{`{
  "results": [
    {
      "id": "...",
      "title": "...",
      "authors": ["..."],
      "abstract": "...",
      "published_date": "2026-01-15",
      "source": "arxiv",
      "publisher": "arXiv",
      "pdf_url": "https://arxiv.org/pdf/...",
      "landing_page_url": "https://arxiv.org/abs/...",
      "citation_count": 3,
      "also_indexed_via": []
    }
  ],
  "count": 10
}`}</CodeBlock>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Rate limit</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          60 requests per minute per key. The response includes{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-900">X-RateLimit-Remaining</code>{" "}
          so you can back off before hitting it.
        </p>
      </div>

      <div className="mt-10 flex justify-center gap-4">
        <Link
          href="/methodology"
          className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:border-accent hover:text-accent dark:border-zinc-700 dark:text-zinc-300"
        >
          Methodology
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
