-- Run this in the Supabase SQL Editor (same place as the previous migrations).

create table if not exists saved_papers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  paper_id uuid not null references papers(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint saved_papers_unique unique (user_id, paper_id)
);

create index if not exists saved_papers_user_id_idx on saved_papers (user_id);

alter table saved_papers enable row level security;

-- Each user can only see, create, and remove their own saved papers.
create policy "Users can view their own saved papers"
  on saved_papers for select
  using (auth.uid() = user_id);

create policy "Users can save papers"
  on saved_papers for insert
  with check (auth.uid() = user_id);

create policy "Users can unsave their own papers"
  on saved_papers for delete
  using (auth.uid() = user_id);
