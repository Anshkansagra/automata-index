import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hasPassword = (user.identities ?? []).some((i) => i.provider === "email");
  const provider = user.app_metadata?.provider ?? "email";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Profile</h1>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="mt-6">
        <ProfileForm
          userId={user.id}
          email={user.email ?? ""}
          fullName={(user.user_metadata?.full_name as string) ?? ""}
          affiliation={(user.user_metadata?.affiliation as string) ?? ""}
          avatarUrl={
            (user.user_metadata?.avatar_url as string) ??
            (user.user_metadata?.picture as string) ??
            null
          }
          notificationsEnabled={user.user_metadata?.digest_emails_enabled !== false}
          hasPassword={hasPassword}
          provider={provider}
          mobile={(user.user_metadata?.mobile as string) ?? ""}
          profession={(user.user_metadata?.profession as string) ?? ""}
          linkedinUrl={(user.user_metadata?.linkedin_url as string) ?? ""}
          githubUrl={(user.user_metadata?.github_url as string) ?? ""}
          location={(user.user_metadata?.location as string) ?? ""}
          bio={(user.user_metadata?.bio as string) ?? ""}
        />
      </div>
    </div>
  );
}
