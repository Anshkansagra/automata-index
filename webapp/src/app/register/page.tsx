"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { AuthFeatureGrid, AuthChecklist } from "@/components/AuthFeatureGrid";

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

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setStatus("sent");
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-zinc-950 via-zinc-950 to-indigo-950 md:min-h-screen">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
        {/* Left: marketing content */}
        <div className="text-white">
          <span className="inline-block rounded-full border border-accent/40 bg-accent-soft/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-accent">
            Free &amp; Open Access
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Cortexa</h1>
          <p className="mt-2 text-lg text-zinc-300">Research Index for Robotics, ML &amp; AI</p>
          <p className="mt-4 max-w-md text-zinc-400">
            One search across arXiv, MDPI, IEEE Access, and more — every paper genuinely free to
            read, verified open access, no scraped content.
          </p>

          <div className="mt-8">
            <AuthFeatureGrid />
          </div>
        </div>

        {/* Right: account creation card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Create Account</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Free — no credit card needed</p>

          <div className="mt-5">
            <AuthChecklist />
          </div>

          {status === "sent" ? (
            <p className="mt-6 rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
              Check your inbox — we sent a confirmation link to {email}.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
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

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                By creating an account, you agree to Cortexa&apos;s{" "}
                <Link href="/terms" className="text-accent hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-accent hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>

              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-1 w-full rounded-full bg-accent py-3 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {status === "loading" ? "Creating account…" : "Create Account"}
              </button>

              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                or
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              </div>

              <GoogleSignInButton />
            </form>
          )}

          <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
