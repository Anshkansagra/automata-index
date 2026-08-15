import type { MetadataRoute } from "next";
import { supabasePublic } from "@/lib/supabase/public";
import { SITE_URL as BASE_URL } from "@/lib/siteUrl";

// Capped at the most recent 5,000 papers — keeps this fast to generate on
// every crawl request instead of serializing the entire (growing) table.
const MAX_PAPER_URLS = 5000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: papers } = await supabasePublic
    .from("papers")
    .select("id, created_at")
    .order("created_at", { ascending: false })
    .limit(MAX_PAPER_URLS);

  const paperUrls: MetadataRoute.Sitemap = (papers ?? []).map((p) => ({
    url: `${BASE_URL}/paper/${p.id}`,
    lastModified: new Date(p.created_at),
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/methodology`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/developers`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/institution/charusat`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.4 },
    ...paperUrls,
  ];
}
