-- Run this in the Supabase SQL Editor (same place you ran schema.sql / 002_search_vector.sql).
-- Adds authors to full-text search so searching a researcher's name surfaces
-- their papers, not just title/abstract matches.

-- Postgres's built-in array_to_string() is marked STABLE (not IMMUTABLE) for
-- generic array types, which GENERATED ALWAYS AS columns reject outright.
-- It's fully deterministic for plain text[] (no locale/session dependence),
-- so this thin wrapper re-declares it IMMUTABLE for that one case.
create or replace function immutable_text_array_to_string(text[], text)
returns text
language sql
immutable
parallel safe
as $$ select array_to_string($1, $2) $$;

alter table papers drop column search_vector;

alter table papers add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(abstract, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(immutable_text_array_to_string(authors, ' '), '')), 'C')
  ) stored;

create index if not exists papers_search_vector_idx
  on papers using gin (search_vector);
