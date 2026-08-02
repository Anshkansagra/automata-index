import "server-only";
import { headers } from "next/headers";

export type SessionUser = {
  id: string;
  email: string | null;
  user_metadata: Record<string, unknown>;
  app_metadata: Record<string, unknown>;
  identities: { provider: string }[];
};

export const SESSION_USER_HEADER = "x-cortexa-user";

// Reads the user proxy.ts already validated via supabase.auth.getUser() for
// this request. Every page (plus the Sidebar, rendered on every page via the
// root layout) used to call getUser() again independently — each call is a
// network round-trip to Supabase's Auth server, so a single page load was
// paying for that validation 2-3 times over. proxy.ts is the only place
// allowed to set this header, and it always strips any client-supplied copy
// first, so this is never attacker-controlled.
export async function getSessionUser(): Promise<SessionUser | null> {
  const h = await headers();
  const raw = h.get(SESSION_USER_HEADER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}
