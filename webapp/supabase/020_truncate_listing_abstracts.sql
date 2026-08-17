-- Run this in the Supabase SQL Editor (same place as the previous migrations).
-- Abstracts are now ~53% of a papers row's payload (measured directly) after
-- the search_vector fix in 019 — the single biggest remaining egress cost.
-- Listing views (browse, search results, saved papers, related papers) only
-- ever show a short preview anyway (PaperCard already caps display at 800
-- chars client-side), so there's no reason to transfer the full abstract for
-- every row in a list. The paper detail page (getPaperById, unaffected by
-- any of this) still gets the full abstract — this only touches list views.
create or replace view papers_listing as
select
  id, source, source_id, doi, title, authors,
  left(abstract, 400) as abstract,
  published_date, categories, publisher, pdf_url, landing_page_url,
  is_open_access, tldr, created_at, citation_count, also_indexed_via
from papers;

grant select on papers_listing to anon, authenticated;

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
  select id, source, source_id, doi, title, authors, left(abstract, 400) as abstract,
         published_date, categories, publisher, pdf_url, landing_page_url, is_open_access,
         tldr, created_at, citation_count, also_indexed_via
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
  select c.id, c.source, c.source_id, c.doi, c.title, c.authors,
         left(c.abstract, 400) as abstract,
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
  select id, source, source_id, doi, title, authors, left(abstract, 400) as abstract,
         published_date, categories, publisher, pdf_url, landing_page_url, is_open_access,
         tldr, created_at, citation_count, also_indexed_via
  from papers
  where exists (
    select 1 from unnest(authors) a where lower(a) = lower(author_name)
  )
  order by published_date desc nulls last
  limit result_limit;
$$;
