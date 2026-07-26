// One-off local bulk backfill — NOT part of the deployed app (Vercel's 60s
// function limit can't run something this long). Run with:
//   node scripts/backfill.mjs
// Writes directly to the same production Supabase project as .env.local.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";

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

// ---------- arXiv ----------
const ARXIV_CATEGORIES = ["cs.RO", "cs.LG", "cs.AI", "cs.CV", "cs.NE", "stat.ML", "eess.SY", "cs.SY", "eess.SP", "cs.NI", "cs.HC"];
const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function toArray(v) {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function extractArxivId(entryId) {
  return (entryId.split("/abs/")[1] ?? entryId).replace(/v\d+$/, "");
}

function mapArxivEntry(entry) {
  const arxivId = extractArxivId(entry.id);
  const links = toArray(entry.link);
  const pdfLink = links.find((l) => l["@_title"] === "pdf")?.["@_href"];
  return {
    source: "arxiv",
    source_id: arxivId,
    doi: entry["arxiv:doi"] ?? null,
    title: entry.title.replace(/\s+/g, " ").trim(),
    authors: toArray(entry.author).map((a) => a.name),
    abstract: entry.summary.replace(/\s+/g, " ").trim(),
    published_date: entry.published.slice(0, 10),
    categories: toArray(entry.category).map((c) => c["@_term"]),
    publisher: "arXiv",
    pdf_url: pdfLink ?? `https://arxiv.org/pdf/${arxivId}`,
    landing_page_url: `https://arxiv.org/abs/${arxivId}`,
    is_open_access: true,
    tldr: null,
  };
}

async function backfillArxiv(pages, pageSize) {
  const searchQuery = ARXIV_CATEGORIES.map((c) => `cat:${c}`).join(" OR ");
  let total = 0;

  for (let page = 0; page < pages; page++) {
    const params = new URLSearchParams({
      search_query: searchQuery,
      sortBy: "submittedDate",
      sortOrder: "descending",
      start: String(page * pageSize),
      max_results: String(pageSize),
    });
    const res = await fetch(`http://export.arxiv.org/api/query?${params.toString()}`);
    if (!res.ok) {
      console.log(`  [arxiv] page ${page} failed: ${res.status}`);
      await sleep(5000);
      continue;
    }
    const xml = await res.text();
    const parsed = xmlParser.parse(xml);
    const entries = toArray(parsed.feed?.entry);
    if (entries.length === 0) {
      console.log(`  [arxiv] page ${page} empty, stopping`);
      break;
    }

    const seenDois = new Set();
    const rows = entries.map(mapArxivEntry).filter((row) => {
      if (!row.doi) return true;
      if (seenDois.has(row.doi)) return false;
      seenDois.add(row.doi);
      return true;
    });
    const { error, count } = await supabase
      .from("papers")
      .upsert(rows, { onConflict: "source,source_id", count: "exact" });
    if (error) {
      console.log(`  [arxiv] page ${page} upsert error: ${error.message}`);
    } else {
      total += count ?? 0;
      console.log(`  [arxiv] page ${page}: fetched ${entries.length}, upserted ${count} (running total ${total})`);
    }
    await sleep(3000);
  }
  return total;
}

// ---------- CrossRef ----------
const TOPIC_QUERY =
  "robotics machine learning deep learning neural network autonomous vehicle internet of vehicles digital twin computer vision generative AI human-machine collaboration wireless communication ADAS advanced driver assistance satellite navigation";

const CROSSREF_PROFILES = [
  { name: "MDPI", prefixFilter: "10.3390", requireCcLicense: false },
  { name: "IEEE (open access)", containerTitle: "IEEE Access", requireCcLicense: true },
  { name: "Open access (any publisher)", requireCcLicense: true },
];

function stripJats(text) {
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function crossrefDate(parts) {
  const p = parts?.[0];
  if (!p || p.length === 0) return null;
  const [y, m = 1, d = 1] = p;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function hasCcLicense(item) {
  return (item.license ?? []).some((l) => l.URL?.includes("creativecommons.org"));
}

function mapCrossrefItem(item, profile) {
  if (!item.DOI || !item.title?.[0]) return null;
  if (profile.requireCcLicense && !hasCcLicense(item)) return null;
  return {
    source: "crossref",
    source_id: item.DOI,
    doi: item.DOI,
    title: item.title[0].replace(/\s+/g, " ").trim(),
    authors: (item.author ?? []).map((a) => [a.given, a.family].filter(Boolean).join(" ")).filter(Boolean),
    abstract: item.abstract ? stripJats(item.abstract) : null,
    published_date: crossrefDate(item.published?.["date-parts"]),
    categories: item["container-title"]?.[0] ? [item["container-title"][0]] : [],
    publisher: item.publisher ?? profile.name,
    pdf_url: item.link?.[0]?.URL ?? null,
    landing_page_url: `https://doi.org/${item.DOI}`,
    is_open_access: true,
    tldr: null,
  };
}

async function backfillCrossref(pages, rowsPerPage) {
  let total = 0;
  for (const profile of CROSSREF_PROFILES) {
    console.log(`  [crossref:${profile.name}] starting`);
    for (let page = 0; page < pages; page++) {
      const params = new URLSearchParams({
        "query.bibliographic": TOPIC_QUERY,
        rows: String(rowsPerPage),
        offset: String(page * rowsPerPage),
        sort: "published",
        order: "desc",
      });
      if (profile.prefixFilter) params.set("filter", `prefix:${profile.prefixFilter}`);
      if (profile.containerTitle) params.set("query.container-title", profile.containerTitle);
      if (env.CROSSREF_MAILTO) params.set("mailto", env.CROSSREF_MAILTO);

      const res = await fetch(`https://api.crossref.org/works?${params.toString()}`);
      if (!res.ok) {
        console.log(`  [crossref:${profile.name}] page ${page} failed: ${res.status}`);
        await sleep(5000);
        continue;
      }
      const json = await res.json();
      const items = json.message?.items ?? [];
      if (items.length === 0) {
        console.log(`  [crossref:${profile.name}] page ${page} empty, stopping profile`);
        break;
      }

      const rows = items.map((item) => mapCrossrefItem(item, profile)).filter(Boolean);
      if (rows.length > 0) {
        const { error, count } = await supabase
          .from("papers")
          .upsert(rows, { onConflict: "source,source_id", count: "exact" });
        if (error) {
          console.log(`  [crossref:${profile.name}] page ${page} upsert error: ${error.message}`);
        } else {
          total += count ?? 0;
          console.log(
            `  [crossref:${profile.name}] page ${page}: fetched ${items.length}, kept ${rows.length}, upserted ${count} (running total ${total})`
          );
        }
      }
      await sleep(1000);
    }
  }
  return total;
}

async function main() {
  const [arxivPages, arxivPageSize, crossrefPages, crossrefRowsPerPage] = process.argv
    .slice(2)
    .map(Number);

  const { count: startCount } = await supabase.from("papers").select("id", { count: "exact", head: true });
  console.log(`Starting total: ${startCount}`);

  console.log("\n=== arXiv backfill ===");
  const arxivTotal = await backfillArxiv(arxivPages || 40, arxivPageSize || 250);

  console.log("\n=== CrossRef backfill ===");
  const crossrefTotal = await backfillCrossref(crossrefPages || 25, crossrefRowsPerPage || 100);

  const { count: endCount } = await supabase.from("papers").select("id", { count: "exact", head: true });
  console.log(`\nDone. arXiv upserts: ${arxivTotal}, CrossRef upserts: ${crossrefTotal}`);
  console.log(`Total papers: ${startCount} -> ${endCount}`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
