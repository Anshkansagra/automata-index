-- Run this in the Supabase SQL Editor (same place you ran schema.sql).
-- Adds citation counts (populated by OpenAlex/CrossRef ingest going forward)
-- so cards and paper detail pages can show "Cited by N" and a "Most cited"
-- sort becomes possible.

alter table papers add column if not exists citation_count integer;

create index if not exists papers_citation_count_idx
  on papers (citation_count desc nulls last);
