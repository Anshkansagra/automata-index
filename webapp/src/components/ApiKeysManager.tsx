"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ApiKeyMeta } from "@/lib/apiKeys";

export function ApiKeysManager({ initialKeys }: { initialKeys: ApiKeyMeta[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const activeKeys = keys.filter((k) => !k.revoked_at);

  async function createKey() {
    setCreating(true);
    setError("");
    const res = await fetch("/api/keys", { method: "POST" });
    const body = await res.json();
    setCreating(false);

    if (!res.ok) {
      setError(body.error ?? "Failed to create key");
      return;
    }

    setNewKey(body.key);
    setKeys((prev) => [
      { id: body.id, name: body.name, key_prefix: body.key_prefix, created_at: body.created_at, last_used_at: null, revoked_at: null },
      ...prev,
    ]);
  }

  async function revokeKey(id: string) {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k)));
    const supabase = createClient();
    await supabase.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", id);
  }

  async function copyKey() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Read-only programmatic access to the paper index. See{" "}
        <a href="/developers" className="text-accent hover:underline">
          the API docs
        </a>{" "}
        for usage.
      </p>

      {newKey && (
        <div className="rounded-md border border-accent/40 bg-accent-soft/40 p-4">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
            Copy this key now — it won&apos;t be shown again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-white px-2 py-1.5 text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              {newKey}
            </code>
            <button
              type="button"
              onClick={copyKey}
              className="shrink-0 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-accent hover:text-accent dark:border-zinc-700 dark:text-zinc-300"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {activeKeys.length > 0 && (
        <div className="flex flex-col gap-2">
          {activeKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {key.name}
                </p>
                <p className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {key.key_prefix}… · created {new Date(key.created_at).toLocaleDateString()}
                  {key.last_used_at ? ` · last used ${new Date(key.last_used_at).toLocaleDateString()}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => revokeKey(key.id)}
                className="shrink-0 text-xs font-medium text-red-600 hover:underline dark:text-red-400"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={createKey}
        disabled={creating || activeKeys.length >= 5}
        className="self-start rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
      >
        {creating ? "Generating…" : activeKeys.length >= 5 ? "Key limit reached (5)" : "Generate new key"}
      </button>
    </div>
  );
}
