import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Cortexa",
  description: "What Cortexa collects, why, and how to control or delete it.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Privacy Policy</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Last updated August 16, 2026.</p>

      <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <section>
          <p>
            Cortexa is a free, open-access research paper search engine, built and operated by
            Ansh Kansagra. This page explains what data Cortexa collects, why, who it&apos;s
            shared with, and how you can control or delete it. Cortexa doesn&apos;t sell data,
            doesn&apos;t run ads, and doesn&apos;t share your data with anyone beyond the service
            providers listed below that Cortexa relies on to operate.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            What Cortexa collects
          </h2>
          <ul className="mt-3 flex flex-col gap-3 list-disc pl-5">
            <li>
              <strong>Account data.</strong> If you register, Cortexa stores your email and a
              securely hashed password (handled by Supabase Auth — Cortexa never sees or stores
              your plaintext password). If you sign in with Google instead, Cortexa receives your
              name, email, and profile picture from Google.
            </li>
            <li>
              <strong>Profile fields you choose to add.</strong> Affiliation, bio, research
              interests, social links, and similar fields on your Profile page — all optional,
              all editable or removable at any time.
            </li>
            <li>
              <strong>Usage data tied to your account.</strong> Saved papers, collections, saved
              searches, search history, and citation-style/display preferences — used to make the
              product work (showing your saved papers back to you) and to personalize defaults.
            </li>
            <li>
              <strong>Feedback submissions.</strong> The message you write on the{" "}
              <Link href="/feedback" className="text-accent hover:underline">
                feedback page
              </Link>
              , plus an email address if you choose to provide one (not required — anonymous
              feedback is supported).
            </li>
            <li>
              <strong>API keys.</strong> If you generate a developer API key, Cortexa stores a
              one-way cryptographic hash of it, never the key itself, plus its creation and
              last-used timestamps.
            </li>
            <li>
              <strong>Basic visitor analytics.</strong> Aggregate, privacy-preserving page-view
              analytics via Vercel Analytics — this doesn&apos;t use tracking cookies or build
              individual visitor profiles.
            </li>
            <li>
              <strong>IP address, briefly.</strong> Used only to enforce rate limits against abuse
              (e.g. scraping). Not stored long-term or tied to your account.
            </li>
          </ul>
          <p className="mt-3">
            The research papers themselves — titles, abstracts, authors, categories — are public
            metadata drawn from arXiv, CrossRef, OpenAlex, CORE, Semantic Scholar, and Zenodo.
            That&apos;s not personal data about you; it&apos;s the content the search engine
            indexes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Service providers Cortexa relies on
          </h2>
          <p className="mt-3">
            Cortexa is a small, independently-run project built on established infrastructure
            providers rather than custom servers. Each of the following processes data only to
            provide their respective piece of the service, under their own privacy terms:
          </p>
          <ul className="mt-3 flex flex-col gap-2 list-disc pl-5">
            <li>
              <strong>Supabase</strong> — database, authentication, and password/session handling.
            </li>
            <li>
              <strong>Vercel</strong> — hosting, and aggregate analytics.
            </li>
            <li>
              <strong>Upstash</strong> — short-lived rate-limit counters keyed by IP address.
            </li>
            <li>
              <strong>Resend</strong> — delivery of saved-search digest emails, if you&apos;ve
              opted into them.
            </li>
            <li>
              <strong>Google</strong> — only if you choose &quot;Sign in with Google&quot; instead
              of an email/password account.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Cookies
          </h2>
          <p className="mt-3">
            Cortexa uses one essential cookie to keep you signed in (managed by Supabase Auth).
            There are no third-party advertising or tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            The public API and MCP connector
          </h2>
          <p className="mt-3">
            Cortexa&apos;s read-only public API and Claude connector (Model Context Protocol
            server) expose the same public paper data available through search on the site — no
            account or personal data is required to use them, and they don&apos;t collect
            anything beyond the same abuse-prevention rate limiting described above.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Where your data is processed
          </h2>
          <p className="mt-3">
            The service providers listed above are global infrastructure companies, and your data
            may be processed on servers outside your country, including in the United States.
            Each provider maintains its own security and compliance program; Cortexa doesn&apos;t
            operate any servers of its own.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Your rights
          </h2>
          <p className="mt-3">You can, at any time:</p>
          <ul className="mt-3 flex flex-col gap-2 list-disc pl-5">
            <li>
              <strong>Access or correct your data</strong> — view and edit your account and
              profile fields directly on your{" "}
              <Link href="/profile" className="text-accent hover:underline">
                Profile
              </Link>{" "}
              and{" "}
              <Link href="/settings" className="text-accent hover:underline">
                Settings
              </Link>{" "}
              pages.
            </li>
            <li>
              <strong>Request a copy of your data</strong> — email{" "}
              <a href="mailto:anshkansagra2004@gmail.com" className="text-accent hover:underline">
                anshkansagra2004@gmail.com
              </a>{" "}
              and it will be sent to you. This isn&apos;t automated yet, so allow a few days for a
              reply.
            </li>
            <li>
              <strong>Delete your data</strong> — delete your account at any time from{" "}
              <Link href="/settings" className="text-accent hover:underline">
                Settings
              </Link>
              . This permanently removes your account, saved papers, collections, saved searches,
              search history, and API keys. It can&apos;t be undone.
            </li>
            <li>
              <strong>Raise a concern or complaint</strong> — contact the email above; it will be
              treated as the grievance/redressal contact for this policy.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Children&apos;s privacy
          </h2>
          <p className="mt-3">
            Cortexa isn&apos;t directed at children and doesn&apos;t knowingly collect data from
            anyone under 18.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Changes to this policy
          </h2>
          <p className="mt-3">
            If this policy changes, the &quot;Last updated&quot; date at the top of this page will
            change too. Material changes will be noted here directly — there&apos;s no separate
            mailing list this gets announced through.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Contact
          </h2>
          <p className="mt-3">
            Questions about this policy or your data — reach out via the{" "}
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
