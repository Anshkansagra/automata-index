-- Run this in the Supabase SQL Editor (same place you ran schema.sql).
-- Clears out already-ingested publication dates that are implausibly far in
-- the future (upstream metadata errors, e.g. a paper showing 2050-01-01).

update papers
set published_date = null
where published_date > current_date + interval '30 days';
