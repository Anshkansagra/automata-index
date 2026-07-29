import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Paper } from "@/lib/types";

// also_indexed_via is deliberately excluded here: it's populated by
// partitionByExistingDoi's targeted UPDATE, not by ingestion's own upsert.
// Including it in this payload would overwrite it back to empty every time
// a source re-fetches a paper it already indexed (which happens on every
// run, since recent pages keep re-covering recently-seen papers).
type PaperRow = Omit<Paper, "id" | "created_at" | "also_indexed_via">;

// Every ingest source writes citation_count, but the column ships via its
// own migration that isn't guaranteed to have landed in every environment
// yet. PostgREST rejects an entire upsert batch outright if any row
// references an unknown column — so a schema lag here would otherwise take
// down ALL paper ingestion, not just citation counts. Retry once without
// the field rather than let that happen.
export async function upsertPapers(rows: PaperRow[]): Promise<{ count: number }> {
  const { error, count } = await supabaseAdmin
    .from("papers")
    .upsert(rows, { onConflict: "source,source_id", count: "exact" });

  if (!error) return { count: count ?? rows.length };

  if (error.code === "PGRST204" && error.message.includes("citation_count")) {
    const strippedRows = rows.map((row) =>
      Object.fromEntries(Object.entries(row).filter(([key]) => key !== "citation_count"))
    );
    const retry = await supabaseAdmin
      .from("papers")
      .upsert(strippedRows, { onConflict: "source,source_id", count: "exact" });
    if (retry.error) {
      throw new Error(`Supabase upsert failed: ${retry.error.message}`);
    }
    return { count: retry.count ?? strippedRows.length };
  }

  throw new Error(`Supabase upsert failed: ${error.message}`);
}
