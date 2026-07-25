import type { NextRequest } from "next/server";

// Accepts either our own manual header (local/curl testing) or the
// `Authorization: Bearer <CRON_SECRET>` header Vercel Cron Jobs send
// automatically when INGEST_SECRET is also set as the project's CRON_SECRET.
export function isAuthorizedIngestRequest(request: NextRequest): boolean {
  const expected = process.env.INGEST_SECRET;
  if (!expected) return false;

  const manualHeader = request.headers.get("x-ingest-secret");
  if (manualHeader === expected) return true;

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${expected}`;
}
