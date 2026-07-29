import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPapers, type PaperSort } from "@/lib/queries";
import { hashApiKey } from "@/lib/apiKeys";
import { apiKeyRateLimiter } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const key = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!key) {
    return NextResponse.json(
      { error: "Missing API key. Pass it as: Authorization: Bearer <your key>" },
      { status: 401 }
    );
  }

  const { data: keyRow, error: keyError } = await supabaseAdmin
    .from("api_keys")
    .select("id, revoked_at")
    .eq("key_hash", hashApiKey(key))
    .maybeSingle();

  if (keyError || !keyRow || keyRow.revoked_at) {
    return NextResponse.json({ error: "Invalid or revoked API key" }, { status: 401 });
  }

  const { success, limit, remaining } = await apiKeyRateLimiter.limit(keyRow.id);
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded — 60 requests per minute per key." },
      { status: 429, headers: { "X-RateLimit-Limit": String(limit), "X-RateLimit-Remaining": "0" } }
    );
  }

  // Fire-and-forget — a logging failure here should never block the response.
  supabaseAdmin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id).then(
    () => {},
    () => {}
  );

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const source = searchParams.get("source") ?? undefined;
  const sort: PaperSort = searchParams.get("sort") === "cited" ? "cited" : "recent";
  const yearFrom = searchParams.get("yearFrom") ? Number(searchParams.get("yearFrom")) : undefined;
  const yearTo = searchParams.get("yearTo") ? Number(searchParams.get("yearTo")) : undefined;
  const requestedLimit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 20;
  const resultLimit = Math.min(Math.max(1, requestedLimit || 20), MAX_LIMIT);

  try {
    const papers = await getPapers({ q, source, sort, yearFrom, yearTo, limit: resultLimit });
    return NextResponse.json(
      { results: papers, count: papers.length },
      { headers: { "X-RateLimit-Limit": String(limit), "X-RateLimit-Remaining": String(remaining) } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
