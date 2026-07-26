"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RoboticGripper } from "@/components/illustrations";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, affiliation },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    // If email confirmation is disabled, signUp already returns a live
    // session — go straight to the papers, no inbox-checking needed.
    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setStatus("sent");
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <div className="hidden w-1/2 flex-col justify-center bg-gradient-to-br from-zinc-950 via-zinc-950 to-indigo-950 px-16 text-white sm:flex">
        <h2 className="text-3xl font-semibold tracking-tight">
          Join the index.
        </h2>
        <p className="mt-4 max-w-sm text-zinc-400">
          Free access to robotics, ML, and AI research — no paywalls, ever.
          Create an account to save papers and get personalized digests.
        </p>
        <div className="mt-10 h-56 text-accent opacity-90">
          <RoboticGripper />
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 py-16 sm:w-1/2">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Create your account
          </h1>

          {status === "sent" ? (
            <p className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
              Check your inbox — we sent a confirmation link to {email}.
            </p>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Full name
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Institutional / academic affiliation
                </label>
                <input
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Email
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-full bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {status === "loading" ? "Creating account…" : "Create account"}
              </button>

              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                or
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              </div>

              <GoogleSignInButton />
            </>
          )}

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
