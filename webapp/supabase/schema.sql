-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).

create extension if not exists pg_trgm;

create table if not exists papers (
  id uuid primary key default gen_random_uuid(),
  source text not null,              -- 'arxiv' | 'core' | 'semantic_scholar'
  source_id text not null,           -- id in the source system (e.g. arXiv id, CORE id)
  doi text,
  title text not null,
  authors text[] not null default '{}',
  abstract text,
  published_date date,
  categories text[] not null default '{}',  -- e.g. {cs.RO, cs.LG}
  publisher text,
  pdf_url text,                      -- only ever populated when the source marks the work open access
  landing_page_url text not null,    -- safe to always store: links out, never redistributes the file
  is_open_access boolean not null default true,
  tldr text,                         -- AI-generated summary, filled in during Phase 3
  created_at timestamptz not null default now(),

  constraint papers_source_unique unique (source, source_id)
);

create unique index if not exists papers_doi_unique
  on papers (doi)
  where doi is not null;

create index if not exists papers_published_date_idx on papers (published_date desc);
create index if not exists papers_categories_idx on papers using gin (categories);
create index if not exists papers_title_trgm_idx on papers using gin (title gin_trgm_ops);
create index if not exists papers_abstract_trgm_idx on papers using gin (abstract gin_trgm_ops);

alter table papers enable row level security;

-- Public, read-only: anyone (anon key) can browse the index.
create policy "Public read access" on papers
  for select using (true);

-- Writes only via the service_role key (used by the ingestion script/server, never the browser).
