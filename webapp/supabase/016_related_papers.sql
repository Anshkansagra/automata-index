-- Run this in the Supabase SQL Editor (same place you ran the earlier migrations).
-- The existing "related papers" query (client-side in queries.ts) only
-- required one shared category and sorted by recency. Broad categories like
-- cs.LG cover thousands of unrelated papers, so it was surfacing whatever's
-- newest in that bucket rather than anything actually similar. This ranks by
-- (a) how many categories two papers share, then (b) text similarity between
-- the candidate and the target paper's title, using the search_vector index
-- that already powers search — no new ingestion or embeddings needed.
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
  )
  select p.*
  from papers p, target t
  where p.id <> t.id
    and (
      p.categories && t.categories
      or p.search_vector @@ plainto_tsquery('english', t.title)
    )
  order by
    (select count(*) from unnest(p.categories) c where c = any(t.categories)) desc,
    ts_rank(p.search_vector, plainto_tsquery('english', t.title)) desc
  limit result_limit;
$$;
