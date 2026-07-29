import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateApiKey, hashApiKey, displayPrefix } from "@/lib/apiKeys";

const MAX_KEYS_PER_USER = 5;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { count } = await supabase
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("revoked_at", null);

  if ((count ?? 0) >= MAX_KEYS_PER_USER) {
    return NextResponse.json(
      { error: `You can have at most ${MAX_KEYS_PER_USER} active API keys — revoke one first.` },
      { status: 400 }
    );
  }

  let name = "API key";
  try {
    const body = await request.json();
    if (typeof body?.name === "string" && body.name.trim()) name = body.name.trim().slice(0, 60);
  } catch {
    // no body sent — use the default name
  }

  const plaintextKey = generateApiKey();
  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: user.id,
      name,
      key_hash: hashApiKey(plaintextKey),
      key_prefix: displayPrefix(plaintextKey),
    })
    .select("id, name, key_prefix, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create key" }, { status: 500 });
  }

  // The only time the plaintext key is ever returned — it isn't recoverable
  // after this response, since only its hash is stored.
  return NextResponse.json({ ...data, key: plaintextKey });
}
