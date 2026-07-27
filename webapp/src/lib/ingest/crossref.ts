import { supabaseAdmin } from "@/lib/supabase/admin";
import { isLikelyRealPdfUrl } from "@/lib/ingest/pdfUrl";
import type { Paper } from "@/lib/types";

const CROSSREF_URL = "https://api.crossref.org/works";

const TOPIC_QUERY =
  "robotics machine learning deep learning neural network autonomous vehicle internet of vehicles digital twin computer vision generative AI human-machine collaboration wireless communication ADAS advanced driver assistance satellite navigation VLSI chip design semiconductor";

type CrossrefProfile = {
  name: string;
  // Restrict to a DOI prefix (e.g. MDPI's 10.3390) — used when the whole
  // publisher is open access by policy, so no per-article license check needed.
  prefixFilter?: string;
  // CrossRef's query.container-title is a relevance search, NOT an exact
  // filter — it just biases results toward this journal, it doesn't exclude
  // others. That's fine here because requireCcLicense below is the real
  // legal gate: an IEEE paper only survives if ITS OWN metadata carries a
  // Creative Commons license (i.e. the author individually paid for open
  // access), regardless of which IEEE journal it technically appeared in.
  containerTitle?: string;
  // If true, only keep items with a Creative Commons license attached —
  // required whenever the publisher isn't 100% OA by default.
  requireCcLicense: boolean;
};

const PROFILES: CrossrefProfile[] = [
  { name: "MDPI", prefixFilter: "10.3390", requireCcLicense: false },
  { name: "IEEE (open access)", containerTitle: "IEEE Access", requireCcLicense: true },
  // No publisher restriction at all — requireCcLicense is the only gate.
  // This is what actually captures Springer, Wiley, Elsevier, PLOS,
  // Frontiers, Hindawi, etc.: whichever publisher, an article only survives
  // if ITS OWN CrossRef record carries a verified Creative Commons license.
  { name: "Open access (any publisher)", requireCcLicense: true },
];

type CrossrefItem = {
  DOI: string;
  title?: string[];
  author?: { given?: string; family?: string }[];
  abstract?: string;
  published?: { "date-parts"?: number[][] };
  "container-title"?: string[];
  publisher?: string;
  license?: { URL: string }[];
  link?: { URL: string }[];
};

function stripJatsTags(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function datePartsToIso(parts?: number[][]): string | null {
  const p = parts?.[0];
  if (!p || p.length === 0) return null;
  const [year, month = 1, day = 1] = p;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function hasCcLicense(item: CrossrefItem): boolean {
  return (item.license ?? []).some((l) => l.URL?.includes("creativecommons.org"));
}

function mapItem(
  item: CrossrefItem,
  profile: CrossrefProfile
): Omit<Paper, "id" | "created_at"> | null {
  if (!item.DOI || !item.title?.[0]) return null;
  if (profile.requireCcLicense && !hasCcLicense(item)) return null;

  return {
    source: "crossref",
    source_id: item.DOI,
    doi: item.DOI,
    title: item.title[0].replace(/\s+/g, " ").trim(),
    authors: (item.author ?? [])
      .map((a) => [a.given, a.family].filter(Boolean).join(" "))
      .filter(Boolean),
    abstract: item.abstract ? stripJatsTags(item.abstract) : null,
    published_date: datePartsToIso(item.published?.["date-parts"]),
    categories: item["container-title"]?.[0] ? [item["container-title"][0]] : [],
    publisher: item.publisher ?? profile.name,
    pdf_url: item.link?.[0]?.URL && isLikelyRealPdfUrl(item.link[0].URL) ? item.link[0].URL : null,
    landing_page_url: `https://doi.org/${item.DOI}`,
    is_open_access: true,
    tldr: null,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPage(profile: CrossrefProfile, rows: number, offset: number, mailto?: string) {
  const params = new URLSearchParams({
    "query.bibliographic": TOPIC_QUERY,
    rows: String(rows),
    offset: String(offset),
    sort: "published",
    order: "desc",
  });
  if (profile.prefixFilter) params.set("filter", `prefix:${profile.prefixFilter}`);
  if (profile.containerTitle) params.set("query.container-title", profile.containerTitle);
  if (mailto) params.set("mailto", mailto);

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`${CROSSREF_URL}?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      return (json.message?.items ?? []) as CrossrefItem[];
    }
    lastError = new Error(`CrossRef API request failed: ${res.status} ${res.statusText}`);
    if (attempt < 3) await sleep(attempt * 3000);
  }
  throw lastError;
}

export async function ingestCrossref({ pages = 3, rowsPerPage = 100 } = {}) {
  const mailto = process.env.CROSSREF_MAILTO;
  const results: { profile: string; fetched: number }[] = [];
  let totalUpserted = 0;

  for (const profile of PROFILES) {
    let profileFetched = 0;

    for (let page = 0; page < pages; page++) {
      const items = await fetchPage(profile, rowsPerPage, page * rowsPerPage, mailto);
      if (items.length === 0) break;
      profileFetched += items.length;

      const rows = items
        .map((item) => mapItem(item, profile))
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (rows.length > 0) {
        const { error, count } = await supabaseAdmin
          .from("papers")
          .upsert(rows, { onConflict: "source,source_id", count: "exact" });

        if (error) {
          throw new Error(`Supabase upsert failed: ${error.message}`);
        }
        totalUpserted += count ?? rows.length;
      }

      if (page < pages - 1) await sleep(1000);
    }

    results.push({ profile: profile.name, fetched: profileFetched });
  }

  return { profiles: results, upserted: totalUpserted };
}
