-- Run this in the Supabase SQL Editor (same place as the previous migrations).
-- Vercel flagged a 5xx spike on /author/[name] from Supabase upstream
-- timeouts. Root cause, confirmed directly: papers_by_author()'s
-- `where exists (select 1 from unnest(authors) a where lower(a) = lower($1))`
-- has zero index support — every call does a full per-row scan across all
-- 23,000+ papers, unnesting and lowercasing each row's author list. Measured
-- at ~900ms for a single call; the institution page fires three of these in
-- parallel (Promise.all over CHARUSAT_AUTHORS), and crawler traffic hitting
-- multiple author pages compounds it further — enough to hit timeouts.
--
-- Fix: a generated lowercase-authors column with a GIN index, so the lookup
-- becomes an indexed array-overlap check instead of a full scan.
alter table papers add column if not exists authors_lower text[]
  generated always as (
    (select coalesce(array_agg(lower(a)), '{}') from unnest(authors) a)
  ) stored;

create index if not exists papers_authors_lower_idx
  on papers using gin (authors_lower);

drop function if exists papers_by_author(text, integer);

create function papers_by_author(author_name text, result_limit int default 50)
returns table(
  id uuid, source text, source_id text, doi text, title text, authors text[],
  abstract text, published_date date, categories text[], publisher text,
  pdf_url text, landing_page_url text, is_open_access boolean, tldr text,
  created_at timestamptz, citation_count integer, also_indexed_via jsonb
)
language sql
stable
as $$
  select id, source, source_id, doi, title, authors, left(abstract, 400) as abstract,
         published_date, categories, publisher, pdf_url, landing_page_url, is_open_access,
         tldr, created_at, citation_count, also_indexed_via
  from papers
  where authors_lower && array[lower(author_name)]
  order by published_date desc nulls last
  limit result_limit;
$$;
