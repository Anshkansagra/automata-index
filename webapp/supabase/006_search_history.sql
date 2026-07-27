-- Run this in the Supabase SQL Editor (same place as the previous migrations).

create table if not exists search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  created_at timestamptz not null default now()
);

create index if not exists search_history_user_id_idx on search_history (user_id, created_at desc);

alter table search_history enable row level security;

create policy "Users can view their own search history"
  on search_history for select
  using (auth.uid() = user_id);

create policy "Users can log their own searches"
  on search_history for insert
  with check (auth.uid() = user_id);

create policy "Users can clear their own search history"
  on search_history for delete
  using (auth.uid() = user_id);
