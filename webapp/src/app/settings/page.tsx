import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/SettingsForm";

export const metadata: Metadata = {
  title: "Settings — Cortexa",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Settings</h1>
        <Link
          href="/profile"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Profile
        </Link>
      </div>

      <div className="mt-6">
        <SettingsForm
          userId={user.id}
          notificationsEnabled={user.user_metadata?.digest_emails_enabled !== false}
          digestFrequency={user.user_metadata?.digest_frequency === "weekly" ? "weekly" : "daily"}
          defaultSort={user.user_metadata?.default_sort === "cited" ? "cited" : "recent"}
          defaultSource={(user.user_metadata?.default_source as string) ?? ""}
          resultsPerPage={Number(user.user_metadata?.results_per_page) || 30}
        />
      </div>
    </div>
  );
}
