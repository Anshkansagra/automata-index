-- Run this in the Supabase SQL Editor (same place as the previous migrations).

create table if not exists saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  source text,                  -- optional source filter, e.g. 'arxiv'
  label text,                   -- friendly display name, defaults to the query itself
  last_notified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists saved_searches_user_id_idx on saved_searches (user_id);

-- Prevent literal duplicate saves of the same query+source for one user.
-- coalesce(source, '') so two NULL sources are still treated as equal
-- (plain unique constraints treat NULL as distinct from NULL).
create unique index if not exists saved_searches_unique
  on saved_searches (user_id, query, (coalesce(source, '')));

alter table saved_searches enable row level security;

create policy "Users can view their own saved searches"
  on saved_searches for select
  using (auth.uid() = user_id);

create policy "Users can create saved searches"
  on saved_searches for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own saved searches"
  on saved_searches for delete
  using (auth.uid() = user_id);

-- No update policy for regular users — last_notified_at is only ever
-- advanced by the digest cron job, which uses the service_role key
-- (bypasses RLS) and is never exposed to the browser.
