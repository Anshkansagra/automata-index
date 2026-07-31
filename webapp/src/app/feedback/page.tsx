"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from("feedback").insert({
      user_id: user?.id ?? null,
      email: user?.email ?? (email.trim() || null),
      message: message.trim(),
    });

    if (insertError) {
      setStatus("error");
      setError("Something went wrong — try again.");
      return;
    }

    setMessage("");
    setEmail("");
    setStatus("sent");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Feedback</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Found a bug, a broken link, or have an idea for what Cortexa should do next? Tell me here —
        every submission gets read.
      </p>

      {status === "sent" ? (
        <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          Thanks — got it.{" "}
          <Link href="/" className="underline">
            Back to Cortexa
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="What's broken, confusing, or missing?"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          {!isLoggedIn && (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email (optional, in case I want to follow up)"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          )}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {status === "sending" ? "Sending…" : "Send feedback"}
            </button>
            {status === "error" && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
