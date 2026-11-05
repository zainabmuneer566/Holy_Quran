# Setting up accounts for Noor

Reading, listening, search, tafsir, Tajweed and practice-mode memorization work **without** an account.
Bookmarks, notes, history, goals, saved progress and settings need the steps below. Do them in order.

## 1. Create the Supabase project (free)
1. Go to supabase.com, sign in with GitHub, click **New project**, name it `Noor`, generate and save a database password, pick the nearest region, and create it.
2. When it is ready, open **Project Settings → API Keys** (or **API**). Copy:
   - **Project URL** (looks like `https://abcd.supabase.co`)
   - the **anon** / **publishable** key
3. Never share or commit the **service_role** / **secret** key. It is only needed for step 5.

## 2. Create the tables and security rules
1. In Supabase, open **SQL Editor → New query**.
2. Open `supabase/migrations/0001_init.sql` from this project, copy all of it, paste it in, and click **Run**. You should see "Success".
3. Check **Table Editor**: you should see `profiles`, `bookmarks`, `personal_notes`, `reading_progress` and others, each marked with row level security (RLS) enabled.

Run it **once**. Running it again will fail because the tables already exist.

## 3. Connect the app
**Locally:** put these in `.env.local`, then restart `npm run dev`:
```
NEXT_PUBLIC_SUPABASE_URL=your project url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your anon/publishable key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
**On Vercel:** open your project, **Settings → Environment Variables**, add the same three (use your real site address for `NEXT_PUBLIC_SITE_URL`), then **Deployments → ⋯ → Redeploy**. These values are baked in at build time, so a redeploy is required.

## 4. Tell Supabase your site address
In Supabase open **Authentication → URL Configuration**:
- **Site URL:** your live address, e.g. `https://holy-quran-nine.vercel.app`
- **Redirect URLs:** add `https://holy-quran-nine.vercel.app/**` and `http://localhost:3000/**`

Without this, confirmation emails, password resets and Google/Facebook sign-in will not return to your site.

## 5. Optional: allow "Delete account"
In Vercel add `SUPABASE_SERVICE_ROLE_KEY` (the **secret** key from step 1) as an environment variable and redeploy. Do not put it in any `NEXT_PUBLIC_` variable.

## 6. Email confirmation
**Authentication → Sign In / Providers → Email**: keep "Confirm email" on for a public site. Supabase's built-in email sender has a low hourly limit, so for real use configure your own SMTP service under **Authentication → SMTP Settings**.

## 7. Google sign-in (optional)
1. Go to console.cloud.google.com, create a project, then **APIs & Services → OAuth consent screen** and complete it.
2. **Credentials → Create credentials → OAuth client ID → Web application.**
3. Under **Authorized redirect URIs** paste the callback shown in Supabase at **Authentication → Providers → Google** (it looks like `https://abcd.supabase.co/auth/v1/callback`).
4. Copy the Client ID and Client Secret into that Supabase Google provider page, enable it, and save.

## 8. Facebook sign-in (optional)
1. Go to developers.facebook.com, create an app, and add the **Facebook Login** product.
2. In **Facebook Login → Settings**, add the same Supabase callback URL (`https://abcd.supabase.co/auth/v1/callback`) under **Valid OAuth Redirect URIs**.
3. Copy the **App ID** and **App Secret** (App Settings → Basic) into **Authentication → Providers → Facebook** in Supabase, enable it, and save.
4. Facebook apps start in development mode; only app testers can sign in until you complete Facebook's review and switch the app live.

## Check it works
1. Open your site, choose **Menu → Create account**, register, and confirm via the email link.
2. Open a surah, tap **Bookmark** under an ayah, then open **Menu → Bookmarks & notes**.
3. Sign in with a second account and confirm the first account's bookmarks are not visible.
