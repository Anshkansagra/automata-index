-- Run this in the Supabase SQL Editor (same place as the previous migrations).

alter table papers
  add column if not exists also_indexed_via jsonb not null default '[]'::jsonb;

comment on column papers.also_indexed_via is
  'Cross-source duplicates by DOI: when a later-ingested source finds a paper
   already indexed (e.g. an arXiv preprint later published in IEEE Access),
   instead of inserting a second row (which would violate papers_doi_unique)
   we record a pointer here: [{ "source": "crossref", "publisher": "IEEE",
   "url": "https://doi.org/..." }, ...]. The original row stays canonical.';
