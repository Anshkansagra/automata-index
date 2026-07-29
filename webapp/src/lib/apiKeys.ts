import { randomBytes, createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ApiKeyMeta = {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

// Server-only (imports "crypto" above) — call from a server component and
// pass the result down as props, never import this file from a client
// component directly.
export async function getApiKeys(supabase: SupabaseClient, userId: string): Promise<ApiKeyMeta[]> {
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, created_at, last_used_at, revoked_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as ApiKeyMeta[];
}

const KEY_PREFIX = "cortexa_live_";

export function generateApiKey(): string {
  return `${KEY_PREFIX}${randomBytes(24).toString("hex")}`;
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function displayPrefix(key: string): string {
  return key.slice(0, KEY_PREFIX.length + 8);
}

export function looksLikeApiKey(value: string): boolean {
  return value.startsWith(KEY_PREFIX);
}
