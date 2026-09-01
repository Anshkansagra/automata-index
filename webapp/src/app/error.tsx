"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RoboticGripper } from "@/components/illustrations";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center sm:px-8">
      <div className="h-40 w-40 text-zinc-300 dark:text-zinc-700">
        <RoboticGripper />
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Something went wrong</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        That&apos;s on us, not you. Try again, or head back and pick up where you left off.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:border-accent hover:text-accent dark:border-zinc-700 dark:text-zinc-300"
        >
          Back to Cortexa
        </Link>
      </div>
    </div>
  );
}
