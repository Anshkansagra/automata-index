-- Run this in the Supabase SQL Editor (same place you ran schema.sql).
-- Exact-ish (case-insensitive) author lookup for the /author/[name] page —
-- deliberately NOT the fuzzy full-text search used by the search bar, so a
-- name only matches papers that actually list that exact author.

create or replace function papers_by_author(author_name text, result_limit int default 50)
returns setof papers
language sql
stable
as $$
  select *
  from papers
  where exists (
    select 1 from unnest(authors) a where lower(a) = lower(author_name)
  )
  order by published_date desc nulls last
  limit result_limit;
$$;
