# Cortexa

Free, open-access search engine for robotics, machine learning, and AI research papers. Cortexa aggregates and verifies open-access content daily from arXiv, CrossRef, OpenAlex, CORE, Semantic Scholar, and Zenodo — no paywalls, no scraped content, every result links to a legitimately free copy.

**Live site:** [cortexa.online](https://www.cortexa.online)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Anshkansagra/automata-index&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN&envDescription=Supabase%20project%20credentials%20and%20Upstash%20Redis%20credentials%20(for%20rate%20limiting)%20are%20required.%20See%20README%20for%20optional%20vars.&project-name=cortexa&repository-name=cortexa)

## Features

- Full-text, relevance-ranked search across 23,000+ open-access papers
- Save papers into collections, with optional public sharing via a plain URL
- Citation export (BibTeX, APA, MLA, Chicago, IEEE, Vancouver)
- Saved searches with email digests when new matching papers appear
- RSS feed, author pages, and institution pages
- A free, read-only public API
- A [Claude MCP connector](https://www.cortexa.online/developers#claude-connector-mcp) — search papers directly inside a Claude conversation

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres, Auth) · Vercel (hosting, Cron) · Upstash (rate limiting) · Resend (email)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Required for the app to run:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, admin operations) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (site-wide rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |

Optional, needed only for specific features:

| Variable | Purpose |
| --- | --- |
| `INGEST_SECRET` | Shared secret protecting `/api/ingest/*` cron routes |
| `RESEND_API_KEY` | Sending saved-search digest emails |
| `DIGEST_FROM_EMAIL` | From-address for digest emails (has a default) |
| `CROSSREF_MAILTO` | Contact email for CrossRef's "polite pool" API access |
| `CORE_API_KEY` | Higher rate limits when ingesting from CORE |
| `SEMANTIC_SCHOLAR_API_KEY` | Higher rate limits when ingesting from Semantic Scholar |

Database schema and migrations live in [`/supabase`](./supabase) — run `schema.sql` first, then the numbered migrations in order.

## License

MIT — see [LICENSE](../LICENSE).

---

Thanks to Vercel for their support of open-source software.
