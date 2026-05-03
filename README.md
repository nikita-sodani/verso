# Verso

A calm, intelligent reading space for the internet. Paste any article URL or upload a PDF — Verso strips the noise, restores the typography, and gives you a place to read, highlight, and remember what matters.

## What ships in V2

- **Cross-device sync** via Supabase (Postgres + Storage + Realtime)
- **Auth** via Google OAuth + email magic link
- **Local-first** — IndexedDB stays the read cache so the app is instant offline; the server is the source of truth.
- **Realtime** — highlight on phone, see it on laptop within a second.
- **Row-Level Security** — every row is scoped to its owner at the database level.
- Everything from V1: three themes (Paper, Night, Ember), four highlight colors, PDF reader, highlights page with markdown export.

## Run locally

### 1. Set up Supabase (one-time, ~5 min)

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor → paste the contents of `supabase/schema.sql` → Run.
3. Authentication → Providers → enable **Google** (paste your Google OAuth client ID + secret) and **Email** (magic link is on by default).
4. (Optional but recommended for production) Authentication → SMTP Settings → set custom SMTP via Resend so you're not capped at 4 emails/hour.

### 2. Set up Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials.
2. Create an OAuth 2.0 client (Web application).
3. Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
4. Copy the client ID and secret into Supabase → Authentication → Providers → Google.

### 3. Configure env

```bash
cp .env.local.example .env.local
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL` — Settings → API → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Settings → API → anon public

### 4. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this folder to a git repo.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the two `NEXT_PUBLIC_SUPABASE_*` env vars in the Vercel project settings.
4. Add your production URL to:
   - Supabase → Authentication → URL Configuration → Site URL + Redirect URLs
   - Google Cloud OAuth → Authorized redirect URIs (now your Vercel URL hits the Supabase callback so this is already covered)

The `/api/parse` route runs on Vercel's Node runtime (jsdom needs Node, not Edge).

### Before you go fully public

- **Rate limit `/api/parse`.** It fetches arbitrary URLs server-side; unbounded it can be abused as a proxy. Add [Upstash Ratelimit](https://upstash.com/docs/oss/sdks/ts/ratelimit/overview).
- **Update `metadataBase`** in `app/layout.tsx` to your real domain.
- **Add a favicon + OG image** to `/public`.
- **Set up Resend SMTP** in Supabase to lift the 4/hour magic-link cap.
- **Bump Next.js to 16.x** (security CVEs fixed) — pending in V2 todo.

## Architecture

```
┌────────────────┐  optimistic write  ┌──────────────┐
│   UI / React   │ ─────────────────► │  IDB cache   │  reads
│                │                    │ (idb-keyval) │ ◄───── reads
└──────┬─────────┘                    └──────────────┘
       │ also writes
       ▼
┌──────────────────┐  realtime push  ┌──────────────┐
│   sync.ts        │ ◄────────────── │  Supabase    │
│ (server mirror)  │ ──────────────► │  Postgres+   │
└──────────────────┘                 │  Storage     │
                                     └──────────────┘
```

- `lib/storage.ts` — IDB read/write (the cache)
- `lib/sync.ts` — IDB writes + Supabase upsert/delete (the durable layer)
- `lib/pdfStorage.ts` — Supabase Storage with local IDB fallback
- `lib/supabase/{client,server,middleware,types}.ts` — Supabase client variants
- `components/SyncBoot.tsx` — runs migration + pull + realtime subscription on auth
- `supabase/schema.sql` — DB schema, RLS policies, realtime publication, storage bucket

### Highlight model

Highlights are stored as `{ text, prefix, suffix, color }`. On render we re-find the text in the DOM using the prefix+suffix as anchor — survives re-renders without storing fragile XPath.

### V1 → V2 migration

When a V1 user (anonymous IDB-only) signs in for the first time, `SyncBoot` reads the existing IDB items + highlights and uploads them to the server before the first pull. Idempotent and one-shot per user.
