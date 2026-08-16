-- Run this in the Supabase SQL Editor (same place as the previous migrations).
-- search_papers, related_papers, and papers_by_author all `returns setof
-- papers`, which includes every column — including search_vector, the
-- weighted tsvector Postgres uses internally for full-text ranking. Measured
-- directly: search_vector is ~44% of a papers row's JSON payload, and the
-- client never uses it (it only matters inside Postgres's own @@ matching).
-- Since search_papers is hit on nearly every search, this was a meaningful,
-- unnecessary chunk of egress. Switching to an explicit column list drops it
-- entirely from what's sent over the wire, with no change in behavior.
-- CREATE OR REPLACE can't change a function's return type in place —
-- Postgres requires the old signature dropped first.
drop function if exists search_papers(text, text, integer);
drop function if exists related_papers(uuid, integer);
drop function if exists papers_by_author(text, integer);

create function search_papers(
  search_query text,
  filter_source text default null,
  result_limit int default 30
)
returns table(
  id uuid, source text, source_id text, doi text, title text, authors text[],
  abstract text, published_date date, categories text[], publisher text,
  pdf_url text, landing_page_url text, is_open_access boolean, tldr text,
  created_at timestamptz, citation_count integer, also_indexed_via jsonb
)
language sql
stable
as $$
  select id, source, source_id, doi, title, authors, abstract, published_date,
         categories, publisher, pdf_url, landing_page_url, is_open_access, tldr,
         created_at, citation_count, also_indexed_via
  from papers
  where search_vector @@ websearch_to_tsquery('english', search_query)
    and (filter_source is null or source = filter_source)
  order by ts_rank(search_vector, websearch_to_tsquery('english', search_query)) desc
  limit result_limit;
$$;

create function related_papers(
  target_paper_id uuid,
  result_limit int default 6
)
returns table(
  id uuid, source text, source_id text, doi text, title text, authors text[],
  abstract text, published_date date, categories text[], publisher text,
  pdf_url text, landing_page_url text, is_open_access boolean, tldr text,
  created_at timestamptz, citation_count integer, also_indexed_via jsonb
)
language sql
stable
as $$
  with target as (
    select id, categories, title
    from papers
    where id = target_paper_id
  ),
  candidates as (
    select p.*
    from papers p, target t
    where p.id <> t.id
      and (
        p.categories && t.categories
        or p.search_vector @@ plainto_tsquery('english', t.title)
      )
    order by p.published_date desc nulls last
    limit 300
  )
  select c.id, c.source, c.source_id, c.doi, c.title, c.authors, c.abstract,
         c.published_date, c.categories, c.publisher, c.pdf_url, c.landing_page_url,
         c.is_open_access, c.tldr, c.created_at, c.citation_count, c.also_indexed_via
  from candidates c, target t
  order by
    (select count(*) from unnest(c.categories) cat where cat = any(t.categories)) desc,
    ts_rank(c.search_vector, plainto_tsquery('english', t.title)) desc
  limit result_limit;
$$;

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
  select id, source, source_id, doi, title, authors, abstract, published_date,
         categories, publisher, pdf_url, landing_page_url, is_open_access, tldr,
         created_at, citation_count, also_indexed_via
  from papers
  where exists (
    select 1 from unnest(authors) a where lower(a) = lower(author_name)
  )
  order by published_date desc nulls last
  limit result_limit;
$$;
