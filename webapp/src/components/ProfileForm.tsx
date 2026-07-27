"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar } from "@/components/Avatar";

type Props = {
  userId: string;
  email: string;
  fullName: string;
  affiliation: string;
  avatarUrl: string | null;
  notificationsEnabled: boolean;
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

export function ProfileForm({
  userId,
  email,
  fullName,
  affiliation,
  avatarUrl,
  notificationsEnabled,
  hasPassword,
  provider,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [aff, setAff] = useState(affiliation);
  const [infoStatus, setInfoStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [avatarStatus, setAvatarStatus] = useState<"idle" | "uploading" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notifEnabled, setNotifEnabled] = useState(notificationsEnabled);
  const [notifStatus, setNotifStatus] = useState<"idle" | "saving" | "saved">("idle");

  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [passwordError, setPasswordError] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting" | "error">("idle");

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    setInfoStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name, affiliation: aff },
    });
    setInfoStatus(error ? "error" : "saved");
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarStatus("uploading");
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (uploadError) {
      setAvatarStatus("error");
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`; // bust cache after upload

    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });

    if (updateError) {
      setAvatarStatus("error");
      return;
    }

    setCurrentAvatarUrl(publicUrl);
    setAvatarStatus("idle");
  }

  async function toggleNotifications(checked: boolean) {
    setNotifEnabled(checked);
    setNotifStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { digest_emails_enabled: checked },
    });
    setNotifStatus(error ? "idle" : "saved");
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

  async function deleteAccount() {
    setDeleteStatus("deleting");
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (!res.ok) {
      setDeleteStatus("error");
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="Profile information">
        <div className="mb-5 flex items-center gap-4">
          <Avatar avatarUrl={currentAvatarUrl} name={name || email} size={64} />
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarStatus === "uploading"}
              className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-accent hover:text-accent disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
            >
              {avatarStatus === "uploading" ? "Uploading…" : "Change photo"}
            </button>
            {avatarStatus === "error" && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                Upload failed — try a PNG/JPEG under 2MB.
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>

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
              className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
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

      <SectionCard title="Notifications">
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Email me about new papers matching my saved searches
          </span>
          <input
            type="checkbox"
            checked={notifEnabled}
            onChange={(e) => toggleNotifications(e.target.checked)}
            className="h-5 w-5 accent-[var(--accent)]"
          />
        </label>
        {notifStatus === "saved" && (
          <p className="mt-2 text-xs text-green-600 dark:text-green-400">Preference saved</p>
        )}
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
                  className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
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

      <SectionCard title="Danger zone">
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
          Permanently deletes your account, saved papers, and saved searches. This cannot be undone.
        </p>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Type your email ({email}) to confirm
        </label>
        <input
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          className={inputClass()}
          placeholder={email}
        />
        <button
          type="button"
          disabled={deleteConfirm !== email || deleteStatus === "deleting"}
          onClick={deleteAccount}
          className="mt-3 rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {deleteStatus === "deleting" ? "Deleting…" : "Delete my account"}
        </button>
        {deleteStatus === "error" && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            Something went wrong — try again or contact support.
          </p>
        )}
      </SectionCard>
    </div>
  );
}
