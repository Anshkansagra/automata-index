import Link from "next/link";
import { RoboticGripper } from "@/components/illustrations";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center sm:px-8">
      <div className="h-40 w-40 text-zinc-300 dark:text-zinc-700">
        <RoboticGripper />
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Page not found</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Whatever you were looking for isn&apos;t here — it may have moved, or the link might be
        wrong.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover"
      >
        Back to Cortexa
      </Link>
    </div>
  );
}
