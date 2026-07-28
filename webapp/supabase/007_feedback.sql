-- Run this in the Supabase SQL Editor (same place as the previous migrations).

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_at_idx on feedback (created_at desc);

alter table feedback enable row level security;

-- Anyone signed in can submit feedback and see their own past submissions.
-- No one (besides the service_role key, used by you directly in Supabase)
-- can read other users' feedback.
create policy "Users can submit feedback"
  on feedback for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own feedback"
  on feedback for select
  using (auth.uid() = user_id);
