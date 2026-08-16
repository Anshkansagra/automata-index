import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import type { Paper } from "@/lib/types";
import type { SavedSearch } from "@/lib/savedSearches";
import { SITE_URL } from "@/lib/siteUrl";
import { PAPER_COLUMNS } from "@/lib/queries";

async function findNewMatches(search: SavedSearch, since: string): Promise<Paper[]> {
  let query = supabaseAdmin
    .from("papers")
    .select(PAPER_COLUMNS)
    .gt("created_at", since)
    .order("created_at", { ascending: false })
    .limit(10);

  if (search.source) query = query.eq("source", search.source);

  // Same full-text search the site uses, just without the RPC wrapper so we
  // can add the created_at cutoff (the RPC doesn't expose that filter).
  query = query.textSearch("search_vector", search.query, { type: "websearch" });

  const { data, error } = await query;
  if (error || !data) return [];
  return data as Paper[];
}

function renderDigestHtml(sections: { search: SavedSearch; papers: Paper[] }[]) {
  const body = sections
    .map(
      ({ search, papers }) => `
        <h2 style="font-size:16px;margin:24px 0 8px;">
          New papers for "${search.label || search.query}"
        </h2>
        ${papers
          .map(
            (p) => `
              <div style="margin-bottom:14px;">
                <a href="${p.landing_page_url}" style="font-weight:600;color:#111;text-decoration:none;">
                  ${p.title}
                </a>
                <div style="font-size:13px;color:#666;">${p.authors.slice(0, 4).join(", ")}</div>
                ${p.pdf_url ? `<a href="${p.pdf_url}" style="font-size:13px;color:#2563eb;">View free PDF</a>` : ""}
              </div>
            `
          )
          .join("")}
      `
    )
    .join("");

  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h1 style="font-size:20px;">New papers matching your saved searches</h1>
      ${body}
      <p style="margin-top:32px;font-size:12px;color:#999;">
        <a href="${SITE_URL}/saved">Manage your saved searches</a>
      </p>
    </div>
  `;
}

export async function sendDigests() {
  const runStartedAt = new Date().toISOString();

  const { data: searches, error } = await supabaseAdmin
    .from("saved_searches")
    .select("id, user_id, query, source, label, last_notified_at, created_at");

  if (error) throw new Error(`Failed to load saved searches: ${error.message}`);
  if (!searches || searches.length === 0) return { usersEmailed: 0, searchesChecked: 0 };

  const byUser = new Map<string, typeof searches>();
  for (const s of searches) {
    if (!byUser.has(s.user_id)) byUser.set(s.user_id, []);
    byUser.get(s.user_id)!.push(s);
  }

  let usersEmailed = 0;
  const processedSearchIds: string[] = [];

  for (const [userId, userSearches] of byUser) {
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData.user?.email) continue;

    // Respect the user's notification preference — skip entirely (don't
    // even advance last_notified_at) so a paused user catches up on
    // whatever they missed once they turn it back on.
    if (userData.user.user_metadata?.digest_emails_enabled === false) continue;

    // Weekly users are skipped entirely (not just "not sent") on off days —
    // advancing last_notified_at anyway would only give them a 1-day lookback
    // once their real send day arrives, defeating "weekly".
    const frequency = userData.user.user_metadata?.digest_frequency === "weekly" ? "weekly" : "daily";
    if (frequency === "weekly") {
      const lastSent = userData.user.user_metadata?.last_digest_sent_at as string | undefined;
      const daysSinceLastSent = lastSent
        ? (Date.now() - new Date(lastSent).getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;
      if (daysSinceLastSent < 7) continue;
    }

    const sections: { search: SavedSearch; papers: Paper[] }[] = [];

    for (const search of userSearches) {
      const papers = await findNewMatches(search, search.last_notified_at);
      processedSearchIds.push(search.id);
      if (papers.length > 0) sections.push({ search, papers });
    }

    if (sections.length === 0) continue;

    await sendEmail({
      to: userData.user.email,
      subject: `Cortexa: ${sections.reduce((n, s) => n + s.papers.length, 0)} new papers matching your saved searches`,
      html: renderDigestHtml(sections),
    });
    usersEmailed++;

    if (frequency === "weekly") {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { ...userData.user.user_metadata, last_digest_sent_at: runStartedAt },
      });
    }
  }

  if (processedSearchIds.length > 0) {
    await supabaseAdmin
      .from("saved_searches")
      .update({ last_notified_at: runStartedAt })
      .in("id", processedSearchIds);
  }

  return { usersEmailed, searchesChecked: searches.length };
}
