-- Run this in the Supabase SQL Editor (same place as the previous migrations).

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'API key',
  key_hash text not null,       -- sha256 of the actual key; the plaintext key is never stored
  key_prefix text not null,     -- first ~12 chars, shown in the UI so users can tell keys apart
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create unique index if not exists api_keys_key_hash_unique on api_keys (key_hash);
create index if not exists api_keys_user_id_idx on api_keys (user_id);

alter table api_keys enable row level security;

-- Users can see their own keys' metadata (never key_hash's plaintext source,
-- since that's never stored anywhere) and revoke them. Only the server
-- (service_role, via /api/v1/papers) looks a key up by hash to authenticate
-- a request — that's not exposed through RLS to any user's own session.
create policy "Users can view their own API keys"
  on api_keys for select
  using (auth.uid() = user_id);

create policy "Users can create their own API keys"
  on api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can revoke their own API keys"
  on api_keys for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own API keys"
  on api_keys for delete
  using (auth.uid() = user_id);
