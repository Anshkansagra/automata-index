-- Run this in the Supabase SQL Editor (same place as the previous migrations).
-- Lets a user mark a collection public and share it via a plain URL — a
-- professor building a reading list can share one link with students instead
-- of everyone re-saving the same papers individually. Uses the collection's
-- own uuid as the share identifier (non-sequential, effectively unguessable)
-- rather than adding a separate slug column.
alter table collections add column if not exists is_public boolean not null default false;

create policy "Anyone can view public collections"
  on collections for select
  using (is_public = true);

-- The existing "Users can rename their own collections" UPDATE policy
-- already covers toggling is_public — RLS gates rows, not columns, so no
-- separate policy is needed for that.

-- A public collection's papers must also be visible to anonymous viewers —
-- otherwise the collection metadata would be visible but empty.
create policy "Anyone can view saved_papers in a public collection"
  on saved_papers for select
  using (
    collection_id is not null
    and exists (select 1 from collections c where c.id = collection_id and c.is_public = true)
  );
