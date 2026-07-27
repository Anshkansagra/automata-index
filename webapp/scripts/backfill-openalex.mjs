// One-off local bulk backfill for OpenAlex — NOT part of the deployed app.
// Run with: node scripts/backfill-openalex.mjs [pages] [perPage]

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8")
  .split(/\r?\n/)
  .forEach((line) => {
    const m = line.match(/^([A-Z_]+)=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  });

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const OPENALEX_URL = "https://api.openalex.org/works";
const ARXIV_SOURCE_ID = "S4306400194";
const TOPIC_QUERY =
  'robotics OR "machine learning" OR "deep learning" OR "neural network" OR "autonomous vehicle" OR "internet of vehicles" OR "digital twin" OR "computer vision" OR "generative AI" OR "human-machine collaboration" OR "wireless communication" OR ADAS OR "satellite navigation" OR VLSI OR "chip design" OR semiconductor';

function reconstructAbstract(index) {
  if (!index) return null;
  const maxPos = Math.max(...Object.values(index).flat());
  const words = new Array(maxPos + 1).fill("");
  for (const [word, positions] of Object.entries(index)) {
    for (const pos of positions) words[pos] = word;
  }
  const text = words.join(" ").replace(/\s+/g, " ").trim();
  return text || null;
}

function extractWorkId(fullId) {
  return fullId.split("/").pop() ?? fullId;
}

function isLikelyRealPdfUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.startsWith("api.")) return false;
    if (parsed.pathname.includes("/content/article/")) return false;
    if (parsed.searchParams.has("httpAccept")) return false;
    return true;
  } catch {
    return false;
  }
}

function mapWork(work) {
  const title = work.title || work.display_name;
  if (!title) return null;
  const oaUrl = work.open_access?.oa_url;
  const pdfUrl = oaUrl && isLikelyRealPdfUrl(oaUrl) ? oaUrl : null;
  const landingPageUrl =
    work.primary_location?.landing_page_url ||
    (work.doi ? work.doi : `https://openalex.org/${extractWorkId(work.id)}`);

  return {
    source: "openalex",
    source_id: extractWorkId(work.id),
    doi: work.doi ? work.doi.replace("https://doi.org/", "") : null,
    title: title.replace(/\s+/g, " ").trim(),
    authors: (work.authorships ?? []).map((a) => a.author?.display_name).filter(Boolean),
    abstract: reconstructAbstract(work.abstract_inverted_index),
    published_date: work.publication_date ?? null,
    categories: work.primary_location?.source?.display_name ? [work.primary_location.source.display_name] : [],
    publisher:
      work.primary_location?.source?.host_organization_name ||
      work.primary_location?.source?.display_name ||
      "OpenAlex",
    pdf_url: pdfUrl,
    landing_page_url: landingPageUrl,
    is_open_access: true,
    tldr: null,
  };
}

async function fetchPage(page, perPage, mailto) {
  const params = new URLSearchParams({
    search: TOPIC_QUERY,
    filter: `open_access.is_oa:true,primary_location.source.id:!${ARXIV_SOURCE_ID}`,
    page: String(page),
    per_page: String(perPage),
    sort: "publication_date:desc",
  });
  if (mailto) params.set("mailto", mailto);

  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`${OPENALEX_URL}?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      return json.results ?? [];
    }
    console.log(`  page ${page} failed: ${res.status}, retrying...`);
    await sleep(attempt * 5000);
  }
  return [];
}

async function main() {
  const pages = Number(process.argv[2]) || 15;
  const perPage = Number(process.argv[3]) || 200;
  const mailto = env.CROSSREF_MAILTO;

  const { count: startCount } = await supabase.from("papers").select("id", { count: "exact", head: true });
  console.log(`Starting total: ${startCount}`);

  let totalUpserted = 0;

  for (let page = 1; page <= pages; page++) {
    const works = await fetchPage(page, perPage, mailto);
    if (works.length === 0) {
      console.log(`page ${page}: empty, stopping`);
      break;
    }

    const candidates = works.map(mapWork).filter(Boolean);
    const seenDois = new Set();
    const deduped = candidates.filter((row) => {
      if (!row.doi) return true;
      if (seenDois.has(row.doi)) return false;
      seenDois.add(row.doi);
      return true;
    });

    const dois = deduped.map((r) => r.doi).filter(Boolean);
    let existingDois = new Set();
    if (dois.length > 0) {
      const { data: existing } = await supabase.from("papers").select("doi").in("doi", dois);
      existingDois = new Set((existing ?? []).map((r) => r.doi));
    }
    const rows = deduped.filter((row) => !row.doi || !existingDois.has(row.doi));

    if (rows.length > 0) {
      const { error, count } = await supabase
        .from("papers")
        .upsert(rows, { onConflict: "source,source_id", count: "exact" });
      if (error) {
        console.log(`page ${page} upsert error: ${error.message}`);
      } else {
        totalUpserted += count ?? 0;
        console.log(`page ${page}: fetched ${works.length}, new ${rows.length}, upserted ${count} (running total ${totalUpserted})`);
      }
    } else {
      console.log(`page ${page}: fetched ${works.length}, all duplicates/skipped`);
    }

    await sleep(1000);
  }

  const { count: endCount } = await supabase.from("papers").select("id", { count: "exact", head: true });
  console.log(`\nDone. Upserted: ${totalUpserted}. Total papers: ${startCount} -> ${endCount}`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
