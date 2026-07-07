# Napkins

An art zine for Minervans by Minervans. Digital home for the magazine: a bookshelf of
published issues, an immersive per-issue reader, and a playground of individual pieces —
plus a hidden admin pipeline for uploading new content.

## Stack

- [Next.js](https://nextjs.org) (App Router) + Tailwind + Framer Motion, hosted on Vercel
- [Supabase](https://supabase.com) — Postgres (metadata), Storage (PDFs + images), Auth (admin magic links)

## Routes

| Route | Purpose |
|---|---|
| `/` | Bookshelf of all published issues |
| `/issues/[issueNumber]` | Full-issue reader |
| `/playground` | Scattered napkins, one per piece; click to read |
| `/napkin-drawer` | Hidden staff login (magic link) |
| `/admin` | Upload dashboard (whitelisted admins only) |

## One-time Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql)
   — first add the remaining admin emails to the `admin_whitelist` insert.
3. In **Authentication → Sign In / Up**, turn **off** "Allow new users to sign up",
   then invite each whitelisted admin from **Authentication → Users → Invite user**.
4. Copy the project URL and anon key from **Settings → API** into `.env.local`
   (template in [.env.example](.env.example)).

## Development

```bash
npm install
npm run dev
```

## Build phases

1. **Bookshelf** — landing page, covers face forward, click through to an issue
2. **Reader** — pre-rendered page images, spread view on desktop, single page on mobile
3. **Playground** — seeded scatter of napkins, funky type, PDF modal via react-pdf
4. **Admin** — magic-link login, issue upload + batch piece upload straight to Supabase
