-- Run this in the Supabase SQL Editor (same place as the previous migrations).

-- 003_saved_papers.sql only granted select/insert/delete — moving a saved
-- paper into a collection needs an update on its own collection_id, which
-- was silently blocked by RLS (no matching policy = no rows affected, no
-- visible error).
create policy "Users can move their own saved papers between collections"
  on saved_papers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
