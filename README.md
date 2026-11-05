# Noor — The Holy Quran (Phase 1)

A Quran reading web app built with Next.js (App Router), TypeScript and Tailwind CSS. The app name is configurable via `NEXT_PUBLIC_APP_NAME`.

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in credentials (see below)
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run typecheck`, `npm run build`, `npm start`.

## Quran content source

Noor ships **no Quran text**. Arabic text, translations and metadata are fetched server-side from the
[Quran Foundation Content API](https://api-docs.quran.com/). Arabic is rendered exactly as returned (`text_uthmani`);
translation HTML (footnote markers) is cleaned for display only.

| Content | Source endpoint |
|---|---|
| Surah list / metadata | `/chapters`, `/chapters/{id}` |
| Arabic text + juz/page | `/verses/by_chapter/{id}` (`text_uthmani`) |
| Translations (English, Urdu) | `/resources/translations`, `translations=` param on verses |
| Opening formula (bismillah) | `/verses/by_key/1:1` |

### Credentials
1. Request API access at the Quran Foundation (see the API docs link above).
2. Put `QURAN_CLIENT_ID` and `QURAN_CLIENT_SECRET` in `.env.local`. They are read only on the server and are never sent to the browser.
3. If you were issued **pre-production** credentials, also set `QURAN_OAUTH_URL` and `QURAN_API_BASE` to the prelive hosts shown in `.env.example`.

**Development shortcut:** `QURAN_ALLOW_PUBLIC_API=true` reads from the public `api.quran.com` endpoint with no credentials. Review the provider's terms before relying on this beyond local development.

Without credentials or that flag, pages show a clear setup message instead of content.

## Status

**Works without any account** (needs only the Quran content source): Surah and Juz navigation, reader with English/Urdu translations, word by word, per-ayah recitation with a persistent player, search, tafsir (`/tafsir/[surah]/[ayah]`), shareable single-ayah pages (`/reader/[surah]/[ayah]`), Tajweed learning page (colours only when the provider returns annotations), memorization practice (hide/reveal/listen), Daily Ayah with Gregorian and calculated Hijri dates, light/dark/sepia themes, sitemap, robots and favicon.

**Needs Supabase (see SETUP.md)**: sign up / sign in / sign out, password reset, Google and Facebook sign-in, bookmarks with collections, private notes, mark-as-read progress, reading history and resume, memorization tracking with revision dates, goals dashboard, settings (translations, reciter, theme, text size, privacy), profile, account deletion (also needs the service-role key).

**Saved but not active**: reminder preferences are stored, but nothing sends notifications yet.

**Not implemented**: temporary local bookmarks for visitors, repeat-a-range and a surah playlist queue, a dedicated `/listen` studio page, Mushaf-style page layout, Hizb/Ruku navigation, search filters by surah/juz, data export, other interface languages, an image share card (sharing is text plus a link to the ayah page).

## Tests
```
npm run typecheck   # TypeScript
npm run test:unit   # logic and safety helpers
npm run test:db     # runs the real database migration in an in-process Postgres and checks row level security
npm test            # both test suites
```
`test:db` uses a stub of Supabase's `auth` schema, so it verifies the schema and policies, not a live Supabase project.

## Not verified against live services
- The Quran Foundation endpoints (OAuth, audio hosts, tafsir, search, Tajweed annotations and rule names) were checked only against a local stand-in of their documented response shapes.
- Supabase Auth flows (email confirmation, password reset, Google, Facebook) and the Supabase client calls were not run against a real project.
- No automated browser or screen-reader testing has been done; colour contrast was checked by calculation (all text colours meet WCAG AA 4.5:1 in all three themes).
- Privacy Policy and Terms are drafts and need legal review.

## UI notes
- Only the audio player is fixed to the screen (while audio is playing). The site header and the reader options scroll away with the page.
- Type scale: page headings 24-28px, section headings 18px, body 14-16px, secondary text 12-14px. Quran text is separate and adjustable: default 26px on phones, 30px on tablets, 32px on desktop. The size slider's choice is remembered in the browser.

## Deploying
Vercel-compatible. Add the same environment variables in the project settings.
