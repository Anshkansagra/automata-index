"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NeuralNetwork } from "@/components/illustrations";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <div className="hidden w-1/2 flex-col justify-center bg-zinc-950 px-16 text-white sm:flex">
        <h2 className="text-3xl font-semibold tracking-tight">Welcome back.</h2>
        <p className="mt-4 max-w-sm text-zinc-400">
          Pick up where you left off — your saved papers and searches are waiting.
        </p>
        <div className="mt-10 h-56 text-blue-400 opacity-80">
          <NeuralNetwork />
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 py-16 sm:w-1/2">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Log in</h1>

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
            className="w-full rounded-full bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {status === "loading" ? "Logging in…" : "Log in"}
          </button>

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            or
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <GoogleSignInButton />

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            New here?{" "}
            <Link href="/register" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
