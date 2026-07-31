-- Run this in the Supabase SQL Editor (same place as the previous migrations).
-- The feedback form previously required a logged-in session (insert policy
-- only allowed auth.uid() = user_id, and NULL = NULL is never true in SQL,
-- so an anonymous submission with a null user_id was always rejected). This
-- lets anonymous visitors submit feedback too, while still allowing
-- logged-in users to attach their own user_id as before.
drop policy if exists "Users can submit feedback" on feedback;

create policy "Anyone can submit feedback"
  on feedback for insert
  with check (
    (auth.uid() is not null and auth.uid() = user_id)
    or (auth.uid() is null and user_id is null)
  );
