import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { getSessionUser } from "@/lib/auth/sessionUser";

export default async function AdminFeedbackPage() {
  const user = await getSessionUser();

  if (!isAdminEmail(user?.email)) notFound();

  const { data: feedback, error } = await supabaseAdmin
    .from("feedback")
    .select("id, email, message, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load feedback: ${error.message}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Feedback</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {feedback.length} submission{feedback.length === 1 ? "" : "s"}
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {feedback.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No feedback yet.</p>
        )}
        {feedback.map((f) => (
          <div
            key={f.id}
            className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{f.email ?? "Anonymous"}</span>
              <span>{new Date(f.created_at).toLocaleString()}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
              {f.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
