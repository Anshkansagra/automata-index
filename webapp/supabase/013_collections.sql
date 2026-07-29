-- Run this in the Supabase SQL Editor (same place as the previous migrations).

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),

  constraint collections_user_name_unique unique (user_id, name)
);

create index if not exists collections_user_id_idx on collections (user_id);

alter table collections enable row level security;

create policy "Users can view their own collections"
  on collections for select
  using (auth.uid() = user_id);

create policy "Users can create their own collections"
  on collections for insert
  with check (auth.uid() = user_id);

create policy "Users can rename their own collections"
  on collections for update
  using (auth.uid() = user_id);

create policy "Users can delete their own collections"
  on collections for delete
  using (auth.uid() = user_id);

-- Nullable: an unassigned saved paper is simply uncategorized. Deleting a
-- collection un-categorizes its papers rather than un-saving them.
alter table saved_papers
  add column if not exists collection_id uuid references collections(id) on delete set null;

create index if not exists saved_papers_collection_id_idx on saved_papers (collection_id);
