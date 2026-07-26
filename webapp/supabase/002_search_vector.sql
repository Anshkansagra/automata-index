-- Run this in the Supabase SQL Editor (same place you ran schema.sql).
-- Adds real full-text search so multi-word queries find relevant partial
-- matches (Google-Scholar-style) instead of requiring one exact substring.

alter table papers
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(abstract, '')), 'B')
  ) stored;

create index if not exists papers_search_vector_idx
  on papers using gin (search_vector);

-- Relevance-ranked search (like Google Scholar) — matches papers where a
-- word appears anywhere in title/abstract, ranked by how well they match,
-- rather than requiring the whole typed phrase as one exact substring.
create or replace function search_papers(
  search_query text,
  filter_source text default null,
  result_limit int default 30
)
returns setof papers
language sql
stable
as $$
  select *
  from papers
  where search_vector @@ websearch_to_tsquery('english', search_query)
    and (filter_source is null or source = filter_source)
  order by ts_rank(search_vector, websearch_to_tsquery('english', search_query)) desc
  limit result_limit;
$$;
