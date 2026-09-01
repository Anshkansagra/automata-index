-- Run this in the Supabase SQL Editor (same place as the previous migrations).
-- search_papers requires every significant word to match (websearch_to_tsquery
-- ANDs them), which is precise but too strict for compound/abbreviated topic
-- labels like "CI/CD for ML" or "VLSI Design" — a paper can be genuinely on
-- topic without containing that exact phrasing. Verified earlier: those
-- searches returned 0 or near-0 results even after fixing ingestion coverage,
-- because the problem was the query strictness, not missing content.
--
-- This adds a second, broader function that ORs the same significant words
-- instead of ANDing them (built by taking plainto_tsquery's AND-form and
-- swapping & for |), ranked by relevance so partial matches still surface in
-- a sensible order. The app calls this only as a fallback when the strict
-- search returns few results — see getPapers() in queries.ts.
create or replace function search_papers_broad(
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
  with broad_query as (
    select nullif(
      replace(plainto_tsquery('english', search_query)::text, ' & ', ' | '),
      ''
    )::tsquery as tsq
  )
  select id, source, source_id, doi, title, authors, left(abstract, 400) as abstract,
         published_date, categories, publisher, pdf_url, landing_page_url, is_open_access,
         tldr, created_at, citation_count, also_indexed_via
  from papers, broad_query
  where broad_query.tsq is not null
    and search_vector @@ broad_query.tsq
    and (filter_source is null or source = filter_source)
  order by ts_rank(search_vector, broad_query.tsq) desc
  limit result_limit;
$$;
