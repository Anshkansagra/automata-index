import { NextRequest } from "next/server";
import { getPapers, type PaperSort } from "@/lib/queries";
import { SITE_URL } from "@/lib/siteUrl";

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string)
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const source = searchParams.get("source") ?? undefined;
  const sort: PaperSort = searchParams.get("sort") === "cited" ? "cited" : "recent";

  const papers = await getPapers({ q, source, sort, limit: 50 });

  const title = q ? `Cortexa — "${q}"` : "Cortexa — Latest open-access papers";
  const feedUrl = `${SITE_URL}/feed.xml${request.nextUrl.search}`;

  const items = papers
    .map((p) => {
      const authorLine = p.authors.length > 0 ? `${p.authors.slice(0, 5).join(", ")} — ` : "";
      const description = escapeXml(`${authorLine}${p.abstract?.slice(0, 500) ?? ""}`);
      const pubDate = p.published_date ? new Date(p.published_date).toUTCString() : null;

      return `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE_URL}/paper/${p.id}</link>
      <guid isPermaLink="false">${escapeXml(`${p.source}:${p.source_id}`)}</guid>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ""}
      <description>${description}</description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${SITE_URL}</link>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <description>Free, open-access research papers on robotics, machine learning, and AI.</description>
    <language>en-us</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=1800",
    },
  });
}
