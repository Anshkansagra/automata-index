import { supabaseAdmin } from "@/lib/supabase/admin";
import { baseDoi } from "@/lib/ingest/baseDoi";

export type AlsoIndexedEntry = { source: string; publisher: string | null; url: string };

type CandidateRow = {
  doi: string | null;
  source: string;
  publisher: string | null;
  landing_page_url: string;
};

// Multiple sources sometimes surface the same paper under the same DOI (an
// arXiv preprint that's later published in IEEE Access, say). papers_doi_unique
// forbids inserting a second row for that DOI, so instead of silently
// dropping the second source's info, this appends a small "also indexed via"
// pointer onto the existing row and excludes that candidate from the insert
// batch. Rows with no DOI, or a DOI not seen before, pass through untouched.
export async function partitionByExistingDoi<T extends CandidateRow>(
  rows: T[]
): Promise<{ newRows: T[] }> {
  const dois = [...new Set(rows.map((r) => r.doi).filter((d): d is string => Boolean(d)))];
  if (dois.length === 0) return { newRows: rows };

  // Look up both the exact DOI and its base form, so a versioned candidate
  // (or a versioned row already in the DB) matches either way.
  const lookupDois = [...new Set(dois.flatMap((d) => [d, baseDoi(d)]))];

  const { data: existing } = await supabaseAdmin
    .from("papers")
    .select("id, doi, also_indexed_via")
    .in("doi", lookupDois);

  if (!existing || existing.length === 0) return { newRows: rows };

  const existingByDoi = new Map<string, (typeof existing)[number]>();
  for (const r of existing) {
    if (!r.doi) continue;
    existingByDoi.set(r.doi, r);
    existingByDoi.set(baseDoi(r.doi), r);
  }
  const newRows: T[] = [];

  for (const row of rows) {
    const match = row.doi ? existingByDoi.get(row.doi) ?? existingByDoi.get(baseDoi(row.doi)) : undefined;
    if (!match) {
      newRows.push(row);
      continue;
    }

    const already: AlsoIndexedEntry[] = Array.isArray(match.also_indexed_via)
      ? (match.also_indexed_via as AlsoIndexedEntry[])
      : [];
    if (already.some((e) => e.source === row.source)) continue;

    const updated = [...already, { source: row.source, publisher: row.publisher, url: row.landing_page_url }];
    await supabaseAdmin.from("papers").update({ also_indexed_via: updated }).eq("id", match.id);
  }

  return { newRows };
}
