# Verso

A calm, intelligent reading space for the internet. Paste any article URL or upload a PDF — Verso strips the noise, restores the typography, and gives you a place to read, highlight, and remember what matters.

## What's in V1

- Landing page at `/`
- Library at `/library` — grid of saved articles + PDFs
- Reader at `/read/[id]` — three themes (Paper, Night, Ember), adjustable typography
- Highlight & action bar — Key idea, Insight, Important, Question colors
- Highlights page at `/highlights` with markdown export
- Settings at `/settings`
- Server route `/api/parse` — fetches the URL server-side, runs Mozilla Readability, returns clean HTML
- Everything stored locally in IndexedDB. No accounts, no cloud.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel (going public)

1. Push this folder to a git repo.
2. Import it at https://vercel.com/new — defaults are fine.
3. Set your custom domain in the Vercel dashboard.

The `/api/parse` route runs on Vercel's Node runtime (jsdom needs Node, not Edge) — already configured via `export const runtime = "nodejs"`.

### Before you go public — recommended

- **Rate limit `/api/parse`.** It fetches arbitrary URLs server-side. Unbounded, it can be abused as a proxy. Easiest add: [Upstash Ratelimit](https://upstash.com/docs/oss/sdks/ts/ratelimit/overview) (~10 lines).
- **Add basic analytics.** Vercel Analytics or Plausible — privacy-friendly options.
- **Update `metadataBase`** in `app/layout.tsx` to your real domain so social cards resolve.
- **Add a favicon and OG image** to `/public`.

## Architecture notes

- `app/` — Next.js App Router pages
- `components/` — UI components (all client-side except where noted)
- `lib/storage.ts` — IndexedDB wrapper (idb-keyval)
- `lib/highlights.ts` — text-offset based highlight serialization, robust to minor DOM changes
- `lib/types.ts` — shared types and theme tokens

### Highlight model

Highlights are stored as `{ text, prefix, suffix, color }`. On render we re-find the text in the DOM using the prefix+suffix as anchor — survives re-renders without storing fragile XPath.

### Why no auth / cloud

V1 ships with localStorage only so you can launch publicly without DB ops or privacy paperwork. When you're ready for cross-device sync, swap `lib/storage.ts` to call Supabase / Convex / etc. behind the same interface.
