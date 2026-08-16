-- Run this in the Supabase SQL Editor (same place as the previous migrations).
-- related_papers() was computing an expensive per-row category-overlap
-- subquery across every row matching the WHERE clause before the LIMIT could
-- shrink the set. For a paper in a broad category (cs.LG has thousands of
-- papers), that meant ranking thousands of rows before returning just 6 —
-- slow enough to hit Supabase's statement timeout under load (confirmed via
-- Vercel's anomaly alert: transient 500s on /paper/[id] from this RPC).
-- Fix: take a cheap, index-backed first pass (bounded to 300 rows, ordered
-- by recency) before doing the expensive relevance ranking, so the ranking
-- step never runs over more than 300 rows regardless of category size.
create or replace function related_papers(
  target_paper_id uuid,
  result_limit int default 6
)
returns setof papers
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
  select c.*
  from candidates c, target t
  order by
    (select count(*) from unnest(c.categories) cat where cat = any(t.categories)) desc,
    ts_rank(c.search_vector, plainto_tsquery('english', t.title)) desc
  limit result_limit;
$$;
