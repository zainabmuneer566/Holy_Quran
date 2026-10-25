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

## Status (Phase 2)

**Implemented**
- Reader: Arabic (Amiri Quran), English and Urdu translations (up to two, with attribution), Arabic size slider, jump-to-ayah, previous/next surah, juz and page labels
- Recitation: reciter list from the provider, per-ayah play/pause, persistent mini-player (play/pause, previous/next ayah, seek, speed, volume, repeat ayah or surah, auto-advance to next ayah), Media Session controls, remembered speed/volume/repeat, error states, "Audio unavailable" when an ayah has no audio
- Word by word: toggle in the reader toolbar; select a word to see its transliteration, word translation (Urdu when your first translation is Urdu), position, and play word audio when the provider supplies it
- Juz: `/juz` index and `/juz/[number]` with links to each surah range
- Search: Arabic and translation search through the provider, surah-name matches, direct ayah references (e.g. `2:255`), highlighted matches, pagination, recent searches (stored in your browser)
- Loading skeletons, error boundary, proper 404s, and clear states for missing/bad credentials, provider outage, missing translations and missing audio

**Not yet built**: Supabase auth and personal data (bookmarks, notes, history), tafsir, memorization, tajweed, goals, daily ayah, sharing, a dedicated `/listen` studio page, repeat-a-range and a surah playlist queue, search filters by surah/juz and a separate "Arabic vs translation" toggle, Hizb/Ruku navigation, Mushaf-style layout, SEO files, shadcn/ui components.

## Verification performed
- `tsc --noEmit` and `next build` pass.
- Juz pages, reciter switching, audio URL resolution, missing-audio handling, word mode, search (highlighting, pagination, ayah-reference redirect, denied-access message), 404s and error states were exercised against a **local mock** of the API's response shapes.

## Not verified against the live provider (please check)
These were written from the provider's documented v4 shapes and could not be run against the real service from the build environment:
- OAuth token flow and the `/juzs`, `/resources/recitations`, `/search` endpoints and their paging (search `page` is assumed 1-based)
- Verse audio via the `audio=<reciter id>` parameter, and the audio hosts used to resolve relative paths (`verses.quran.com` for verses, `audio.qurancdn.com` for words) in `lib/quran/audio.ts`
- Word fields (`word_fields=text_uthmani`, word translation language via `language`)
- Whether your credentials include search access
- Actual audio playback, Arabic rendering in browsers, mobile layouts, accessibility audit

If something fails, the on-screen message says which part, and fixes should be small edits in `lib/quran/server.ts` or `lib/quran/audio.ts`.

## UI notes
- Only the audio player is fixed to the screen (while audio is playing). The site header and the reader options scroll away with the page.
- Type scale: page headings 24-28px, section headings 18px, body 14-16px, secondary text 12-14px. Quran text is separate and adjustable: default 26px on phones, 30px on tablets, 32px on desktop. The size slider's choice is remembered in the browser.

## Deploying
Vercel-compatible. Add the same environment variables in the project settings.
