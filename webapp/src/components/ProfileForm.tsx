"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

type Props = {
  email: string;
  fullName: string;
  affiliation: string;
  hasPassword: boolean;
  provider: string;
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      {children}
    </div>
  );
}

function inputClass() {
  return "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";
}

export function ProfileForm({ email, fullName, affiliation, hasPassword, provider }: Props) {
  const [name, setName] = useState(fullName);
  const [aff, setAff] = useState(affiliation);
  const [infoStatus, setInfoStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [passwordError, setPasswordError] = useState("");

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    setInfoStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name, affiliation: aff },
    });
    setInfoStatus(error ? "error" : "saved");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordStatus("saving");
    setPasswordError("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordStatus("error");
      setPasswordError(error.message);
      return;
    }
    setNewPassword("");
    setPasswordStatus("saved");
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="Profile information">
        <form onSubmit={saveInfo} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Full name
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass()} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Institutional / academic affiliation
            </label>
            <input value={aff} onChange={(e) => setAff(e.target.value)} className={inputClass()} />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={infoStatus === "saving"}
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
            >
              {infoStatus === "saving" ? "Saving…" : "Save changes"}
            </button>
            {infoStatus === "saved" && <span className="text-sm text-green-600 dark:text-green-400">Saved</span>}
            {infoStatus === "error" && <span className="text-sm text-red-600 dark:text-red-400">Couldn&apos;t save</span>}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Display">
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">Theme</p>
        <ThemeToggle />
      </SectionCard>

      <SectionCard title="Security">
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{email}</p>
          </div>

          {hasPassword ? (
            <form onSubmit={changePassword} className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                New password
              </label>
              <input
                type="password"
                minLength={6}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass()}
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={passwordStatus === "saving"}
                  className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
                >
                  {passwordStatus === "saving" ? "Updating…" : "Change password"}
                </button>
                {passwordStatus === "saved" && (
                  <span className="text-sm text-green-600 dark:text-green-400">Password updated</span>
                )}
                {passwordStatus === "error" && (
                  <span className="text-sm text-red-600 dark:text-red-400">{passwordError}</span>
                )}
              </div>
            </form>
          ) : (
            <p className="border-t border-zinc-200 pt-4 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              Signed in with {provider === "google" ? "Google" : provider} — no password to manage here.
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
