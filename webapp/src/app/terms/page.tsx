import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Cortexa",
  description: "The terms governing use of Cortexa's search engine, public API, and MCP connector.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Terms of Service</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Last updated August 16, 2026.</p>

      <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <section>
          <p>
            Cortexa is a free, open-access research paper search engine, built and operated by
            Ansh Kansagra, an individual based in India. By using Cortexa — the website, the
            public API, or the MCP connector — you agree to these terms. If you don&apos;t agree,
            please don&apos;t use the service. See also the{" "}
            <Link href="/privacy" className="text-accent hover:underline">
              Privacy Policy
            </Link>
            , which these terms incorporate by reference.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            What Cortexa is
          </h2>
          <p className="mt-3">
            Cortexa indexes publicly available, open-access research paper metadata from sources
            including arXiv, CrossRef, OpenAlex, CORE, Semantic Scholar, and Zenodo. Cortexa
            doesn&apos;t host or redistribute paper PDFs itself — it links out to the
            source&apos;s own open-access copy. See{" "}
            <Link href="/methodology" className="text-accent hover:underline">
              how Cortexa works
            </Link>{" "}
            for how sources and licenses are verified.
          </p>
          <p className="mt-3">
            Cortexa is provided free of charge, with no subscription tier, ads, or paid features.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Your account
          </h2>
          <ul className="mt-3 flex flex-col gap-2 list-disc pl-5">
            <li>You must provide accurate information when creating an account.</li>
            <li>You&apos;re responsible for keeping your password confidential.</li>
            <li>One account per person — don&apos;t create accounts to evade a suspension.</li>
            <li>
              You can delete your account at any time from{" "}
              <Link href="/settings" className="text-accent hover:underline">
                Settings
              </Link>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Acceptable use
          </h2>
          <p className="mt-3">You agree not to:</p>
          <ul className="mt-3 flex flex-col gap-2 list-disc pl-5">
            <li>
              Bulk-scrape the website itself — use the{" "}
              <Link href="/developers" className="text-accent hover:underline">
                public API
              </Link>{" "}
              or MCP connector instead; both exist specifically so you don&apos;t have to.
            </li>
            <li>Attempt to bypass rate limits, or overload the service intentionally.</li>
            <li>Use the service for anything illegal, or to harass or harm others.</li>
            <li>Attempt to gain unauthorized access to accounts, data, or infrastructure.</li>
            <li>Misrepresent your API key or credentials as someone else&apos;s.</li>
          </ul>
          <p className="mt-3">
            Violating these may result in your account or API key being suspended or revoked,
            without prior notice for serious or repeated violations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Public API and MCP connector
          </h2>
          <p className="mt-3">
            The API and MCP connector are provided free, rate-limited, and without any uptime
            guarantee or service-level agreement — this is an independently-run project, not a
            commercial service with contractual support. Rate limits and available fields may
            change as the project evolves; breaking changes will be noted where reasonably
            practicable.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Content and ownership
          </h2>
          <p className="mt-3">
            Paper titles, abstracts, and metadata indexed by Cortexa remain the property of their
            original authors and publishers — Cortexa only indexes and links to them. The Cortexa
            name, logo, and site design are Ansh Kansagra&apos;s. Feedback you submit may be used
            to improve the product without further compensation or attribution to you.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            No warranty
          </h2>
          <p className="mt-3">
            Cortexa is provided &quot;as is,&quot; without warranty of any kind. Paper metadata is
            drawn from third-party sources and may occasionally be incomplete, outdated, or
            inaccurate — always verify against the source before relying on it academically.
            Cortexa doesn&apos;t guarantee uninterrupted availability, error-free operation, or
            that any particular paper remains freely accessible at its source indefinitely.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Limitation of liability
          </h2>
          <p className="mt-3">
            To the fullest extent permitted by law, Cortexa and its operator aren&apos;t liable
            for any indirect, incidental, or consequential damages arising from your use of the
            service. Since Cortexa is free, this also means there&apos;s no liability for the fees
            you didn&apos;t pay.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Governing law
          </h2>
          <p className="mt-3">
            These terms are governed by the laws of India, without regard to conflict-of-law
            principles. If you&apos;re located elsewhere, local consumer-protection laws that
            can&apos;t be waived by contract still apply to you where required.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Changes to these terms
          </h2>
          <p className="mt-3">
            If these terms change, the &quot;Last updated&quot; date at the top of this page will
            change too. Continuing to use Cortexa after a change means you accept the updated
            terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Contact
          </h2>
          <p className="mt-3">
            Questions about these terms — reach out via the{" "}
            <Link href="/feedback" className="text-accent hover:underline">
              feedback page
            </Link>{" "}
            or email{" "}
            <a href="mailto:anshkansagra2004@gmail.com" className="text-accent hover:underline">
              anshkansagra2004@gmail.com
            </a>
            .
          </p>
        </section>
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href="/"
          className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:border-accent hover:text-accent dark:border-zinc-700 dark:text-zinc-300"
        >
          ← Back to Cortexa
        </Link>
      </div>
    </div>
  );
}
