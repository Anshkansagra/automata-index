import Link from "next/link";
import type { Metadata } from "next";
import { RoboticGripper } from "@/components/illustrations";

export const metadata: Metadata = {
  title: "About — Cortexa",
  description: "The story and the person behind Cortexa, a free open-access research index for robotics, ML, and AI.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">About Cortexa</h1>

      <div className="mt-8 flex flex-col gap-4 text-zinc-700 dark:text-zinc-300">
        <p>
          Cortexa exists because finding free, legitimately open-access research on robotics,
          machine learning, and AI meant manually checking arXiv, MDPI, and IEEE separately, every
          time. Cortexa aggregates all of it into one searchable index — real papers, verified
          open access, no paywalls, no scraped content.
        </p>
        <p>
          The index is rebuilt daily, currently covers 16,000+ papers across arXiv, CrossRef
          (MDPI, individually open-access IEEE, and other publishers), and OpenAlex, and keeps
          growing.
        </p>
      </div>

      <div className="mt-10 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <div className="flex items-start gap-5">
          <div className="hidden h-20 w-20 shrink-0 text-accent opacity-90 sm:block">
            <RoboticGripper />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Built by Ansh Kansagra
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              I&apos;m a final-stretch Electronics &amp; Communication Engineering undergraduate,
              heading into a robotics-focused master&apos;s next. Cortexa started as a personal
              tool to stop losing time hunting for free versions of papers across five different
              sites, and grew into a full production system — data pipelines, authentication,
              search infrastructure, and a design built to actually be used, not just demoed.
            </p>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              If you&apos;re working on something in robotics, ML, or AI — research, a product,
              or hiring — I&apos;d like to hear from you.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
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
