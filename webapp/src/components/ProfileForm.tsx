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
  mobile: string;
  profession: string;
  linkedinUrl: string;
  githubUrl: string;
  location: string;
  bio: string;
  researchInterests: string[];
  googleScholarUrl: string;
  orcidId: string;
  researchgateUrl: string;
  websiteUrl: string;
  twitterUrl: string;
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

function labelClass() {
  return "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";
}

// Crops to a centered square and re-encodes at a fixed resolution with
// high-quality smoothing — fixes blurry avatars caused by uploading
// arbitrary-sized/oddly-compressed source photos directly.
async function resizeImageToSquare(file: File, size = 400): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const minSide = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - minSide) / 2;
  const sy = (bitmap.height - minSide) / 2;
  ctx.drawImage(bitmap, sx, sy, minSide, minSide, 0, 0, size, size);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))),
      "image/jpeg",
      0.92
    );
  });
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
  mobile,
  profession,
  linkedinUrl,
  githubUrl,
  location,
  bio,
  researchInterests,
  googleScholarUrl,
  orcidId,
  researchgateUrl,
  websiteUrl,
  twitterUrl,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [aff, setAff] = useState(affiliation);
  const [mobileNo, setMobileNo] = useState(mobile);
  const [prof, setProf] = useState(profession);
  const [linkedin, setLinkedin] = useState(linkedinUrl);
  const [github, setGithub] = useState(githubUrl);
  const [loc, setLoc] = useState(location);
  const [bioText, setBioText] = useState(bio);
  const [interests, setInterests] = useState(researchInterests);
  const [interestInput, setInterestInput] = useState("");
  const [scholar, setScholar] = useState(googleScholarUrl);
  const [orcid, setOrcid] = useState(orcidId);
  const [researchgate, setResearchgate] = useState(researchgateUrl);
  const [website, setWebsite] = useState(websiteUrl);
  const [twitter, setTwitter] = useState(twitterUrl);
  const [infoStatus, setInfoStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function addInterest(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();
    const value = interestInput.trim();
    if (value && !interests.includes(value)) {
      setInterests([...interests, value]);
    }
    setInterestInput("");
  }

  function removeInterest(value: string) {
    setInterests(interests.filter((i) => i !== value));
  }

  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [avatarStatus, setAvatarStatus] = useState<"idle" | "uploading" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notifEnabled, setNotifEnabled] = useState(notificationsEnabled);
  const [notifStatus, setNotifStatus] = useState<"idle" | "saving" | "saved">("idle");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [passwordError, setPasswordError] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting" | "error">("idle");

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    setInfoStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: name,
        affiliation: aff,
        mobile: mobileNo,
        profession: prof,
        linkedin_url: linkedin,
        github_url: github,
        location: loc,
        bio: bioText,
        research_interests: interests,
        google_scholar_url: scholar,
        orcid_id: orcid,
        researchgate_url: researchgate,
        website_url: website,
        twitter_url: twitter,
      },
    });
    setInfoStatus(error ? "error" : "saved");
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarStatus("uploading");
    try {
      const resized = await resizeImageToSquare(file);
      const supabase = createClient();
      const path = `${userId}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, resized, { upsert: true, cacheControl: "3600", contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`; // bust cache after upload

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
      if (updateError) throw updateError;

      setCurrentAvatarUrl(publicUrl);
      setAvatarStatus("idle");
    } catch {
      setAvatarStatus("error");
    }
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
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordStatus("error");
      setPasswordError("New password and confirmation don't match.");
      return;
    }

    setPasswordStatus("saving");
    const supabase = createClient();

    // Re-verify the current password before allowing a change.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: oldPassword,
    });
    if (verifyError) {
      setPasswordStatus("error");
      setPasswordError("Current password is incorrect.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordStatus("error");
      setPasswordError(error.message);
      return;
    }
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
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
            <label className={labelClass()}>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass()} />
          </div>
          <div>
            <label className={labelClass()}>Institutional / academic affiliation</label>
            <input value={aff} onChange={(e) => setAff(e.target.value)} className={inputClass()} />
          </div>
          <div>
            <label className={labelClass()}>Mobile number</label>
            <input
              type="tel"
              value={mobileNo}
              onChange={(e) => setMobileNo(e.target.value)}
              placeholder="Optional"
              className={inputClass()}
            />
          </div>
          <div>
            <label className={labelClass()}>Profession</label>
            <input
              value={prof}
              onChange={(e) => setProf(e.target.value)}
              placeholder="e.g. Student, Research Engineer"
              className={inputClass()}
            />
          </div>
          <div>
            <label className={labelClass()}>Location</label>
            <input
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
              placeholder="e.g. Ahmedabad, India"
              className={inputClass()}
            />
          </div>
          <div>
            <label className={labelClass()}>About you</label>
            <textarea
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              rows={3}
              placeholder="What you're working on…"
              className={inputClass()}
            />
          </div>
          <div>
            <label className={labelClass()}>Research interests</label>
            <div className="flex flex-wrap gap-2 rounded-md border border-zinc-300 p-2 dark:border-zinc-700">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent"
                >
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeInterest(interest)}
                    aria-label={`Remove ${interest}`}
                    className="hover:opacity-70"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={addInterest}
                placeholder={interests.length === 0 ? "e.g. Robotics, press Enter" : "Add another…"}
                className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
              />
            </div>
          </div>
          <div>
            <label className={labelClass()}>Google Scholar URL</label>
            <input
              type="url"
              value={scholar}
              onChange={(e) => setScholar(e.target.value)}
              placeholder="https://scholar.google.com/citations?user=…"
              className={inputClass()}
            />
          </div>
          <div>
            <label className={labelClass()}>ORCID iD</label>
            <input
              value={orcid}
              onChange={(e) => setOrcid(e.target.value)}
              placeholder="0000-0000-0000-0000"
              className={inputClass()}
            />
          </div>
          <div>
            <label className={labelClass()}>ResearchGate URL</label>
            <input
              type="url"
              value={researchgate}
              onChange={(e) => setResearchgate(e.target.value)}
              placeholder="https://www.researchgate.net/profile/…"
              className={inputClass()}
            />
          </div>
          <div>
            <label className={labelClass()}>Personal website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://…"
              className={inputClass()}
            />
          </div>
          <div>
            <label className={labelClass()}>X / Twitter URL</label>
            <input
              type="url"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="https://x.com/…"
              className={inputClass()}
            />
          </div>
          <div>
            <label className={labelClass()}>LinkedIn profile URL</label>
            <input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/…"
              className={inputClass()}
            />
          </div>
          <div>
            <label className={labelClass()}>GitHub profile URL</label>
            <input
              type="url"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/…"
              className={inputClass()}
            />
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
              <label className={labelClass()}>Current password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className={inputClass()}
              />
              <label className={labelClass()}>New password</label>
              <input
                type="password"
                minLength={6}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass()}
              />
              <label className={labelClass()}>Confirm new password</label>
              <input
                type="password"
                minLength={6}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
        <label className={labelClass()}>Type your email ({email}) to confirm</label>
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
