import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/sessionUser";
import { isCitationStyle } from "@/lib/citation";

// Per-visitor personalization (saved-paper status, citation style) for a
// given set of paper ids, fetched client-side instead of computed during
// SSR. Pages like /author/[name] and /paper/[id] used to call
// getSessionUser() (reads headers()) directly, which forces Next.js to
// render the whole route dynamically on every request — a real cost driver
// confirmed via Vercel's own traffic logs (7,800+ hits in 2 hours on
// /author/[name] alone, each one a fresh SSR render plus a Supabase query
// for content that's identical for every anonymous visitor). Moving this
// here lets those pages become static/ISR-cacheable; the public paper data
// renders instantly from cache, and personalization (save hearts, citation
// style) fills in a moment later only for logged-in visitors.
export async function POST(request: NextRequest) {
  let paperIds: unknown;
  try {
    ({ paperIds } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!Array.isArray(paperIds) || !paperIds.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "paperIds must be an array of strings" }, { status: 400 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ isLoggedIn: false, citationStyle: undefined, savedIds: [] });
  }

  const citationStyle = isCitationStyle(user.user_metadata?.citation_style)
    ? user.user_metadata.citation_style
    : undefined;

  if (paperIds.length === 0) {
    return NextResponse.json({ isLoggedIn: true, citationStyle, savedIds: [] });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_papers")
    .select("paper_id")
    .eq("user_id", user.id)
    .in("paper_id", paperIds);

  return NextResponse.json({
    isLoggedIn: true,
    citationStyle,
    savedIds: (data ?? []).map((row) => row.paper_id as string),
  });
}
