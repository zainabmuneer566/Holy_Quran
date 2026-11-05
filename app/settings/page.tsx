import type { Metadata } from "next";
import { requireAuth, getPreferences } from "@/lib/auth";
import { SupabaseNotice } from "@/components/auth-shell";
import { SavedBanner } from "@/components/saved-banner";
import { getRecitations, getTranslationResources } from "@/lib/quran/server";
import { deleteAccount, saveGoals, savePreferences, saveReminders } from "@/app/actions/settings";
import { signOut } from "@/app/actions/auth";
import type { Goals, Reminders } from "@/lib/db-types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings", robots: { index: false } };

const field = "mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink";
const lab = "block text-xs text-muted";
const save = "rounded-md bg-accent px-4 py-2 text-sm text-bg";
const card = "mb-5 rounded-xl border border-line bg-surface p-4";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const auth = await requireAuth("/settings");
  if (!auth) return <div className="mx-auto max-w-xl px-4 py-8"><SupabaseNotice /></div>;
  const { saved } = await searchParams;
  const { supabase, user } = auth;
  const prefs = await getPreferences();
  const [g, r, translations, recitations] = await Promise.all([
    supabase.from("reading_goals").select("daily_ayahs, weekly_ayahs, daily_memorization").maybeSingle(),
    supabase.from("reminder_preferences").select("daily_reading_enabled, daily_ayah_enabled, reminder_time, timezone").maybeSingle(),
    getTranslationResources().catch(() => []),
    getRecitations().catch(() => []),
  ]);
  const goals = (g.data as Goals | null) ?? { daily_ayahs: 5, weekly_ayahs: null, daily_memorization: 0 };
  const rem = (r.data as Reminders | null) ?? { daily_reading_enabled: false, daily_ayah_enabled: false, reminder_time: null, timezone: null };
  const tr = translations.filter((t) => ["english", "urdu"].includes(t.language_name.toLowerCase()));
  const t1 = prefs?.translation_ids?.[0] ?? "";
  const t2 = prefs?.translation_ids?.[1] ?? "";
  const canDelete = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const trOptions = (
    <>
      <option value="">Default</option>
      {tr.map((t) => <option key={t.id} value={t.id}>{t.author_name || t.name} ({t.language_name})</option>)}
    </>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-semibold sm:text-[28px]">Settings</h1>
      <p className="mb-4 text-sm text-muted">Signed in as {user.email}</p>
      <SavedBanner tag={saved} />

      <form action={savePreferences} className={card} id="preferences">
        <h2 className="mb-3 text-lg font-semibold">Reading and privacy</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={lab}>Translation<select name="t1" defaultValue={String(t1)} className={field}>{trOptions}</select></label>
          <label className={lab}>Second translation<select name="t2" defaultValue={String(t2)} className={field}>{trOptions}</select></label>
          <label className={lab}>Reciter
            <select name="reciter" defaultValue={String(prefs?.reciter_id ?? "")} className={field}>
              <option value="">Default</option>
              {recitations.map((x) => <option key={x.id} value={x.id}>{x.reciter_name}{x.style ? ` (${x.style})` : ""}</option>)}
            </select>
          </label>
          <label className={lab}>Theme
            <select name="theme" defaultValue={prefs?.theme ?? "system"} className={field}>
              <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option><option value="sepia">Sepia</option>
            </select>
          </label>
          <label className={lab}>Arabic text size (20–56, blank for automatic)
            <input name="size" type="number" min={20} max={56} defaultValue={prefs?.arabic_size ?? ""} className={field} />
          </label>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="keep_history" defaultChecked={prefs?.keep_history ?? true} className="h-4 w-4 accent-[var(--accent)]" /> Keep my reading history</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="show_streak" defaultChecked={prefs?.show_streak ?? true} className="h-4 w-4 accent-[var(--accent)]" /> Show my reading streak</label>
        </div>
        <p className="mt-2 text-xs text-muted">Theme and text size apply on devices that have not set their own yet.</p>
        <button className={`${save} mt-3`}>Save</button>
      </form>

      <form action={saveGoals} className={card} id="goals">
        <h2 className="mb-3 text-lg font-semibold">Goals</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={lab}>Ayahs per day<input name="daily" type="number" min={1} max={1000} defaultValue={goals.daily_ayahs} className={field} /></label>
          <label className={lab}>Ayahs per week (optional)<input name="weekly" type="number" min={1} max={7000} defaultValue={goals.weekly_ayahs ?? ""} className={field} /></label>
          <label className={lab}>Memorize per day<input name="memo" type="number" min={0} max={100} defaultValue={goals.daily_memorization} className={field} /></label>
        </div>
        <button className={`${save} mt-3`}>Save goals</button>
      </form>

      <form action={saveReminders} className={card} id="reminders">
        <h2 className="mb-1 text-lg font-semibold">Reminders</h2>
        <p className="mb-3 text-xs text-muted">Your choices are saved, but this app does not send notifications yet. They will be used when reminders are added.</p>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="reading" defaultChecked={rem.daily_reading_enabled} className="h-4 w-4 accent-[var(--accent)]" /> Daily reading reminder</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="ayah" defaultChecked={rem.daily_ayah_enabled} className="h-4 w-4 accent-[var(--accent)]" /> Daily ayah reminder</label>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className={lab}>Time<input name="time" type="time" defaultValue={rem.reminder_time?.slice(0, 5) ?? ""} className={field} /></label>
          <label className={lab}>Time zone<input name="tz" maxLength={64} defaultValue={rem.timezone ?? ""} placeholder="e.g. Europe/London" className={field} /></label>
        </div>
        <button className={`${save} mt-3`}>Save reminders</button>
      </form>

      <section className={card} aria-labelledby="account">
        <h2 id="account" className="mb-3 text-lg font-semibold">Account</h2>
        <form action={signOut}><button className="rounded-md border border-line px-4 py-2 text-sm hover:border-accent">Sign out</button></form>
        <form action={deleteAccount} className="mt-5 border-t border-line pt-4">
          <h3 className="text-[15px] font-medium text-danger">Delete account</h3>
          <p className="mt-1 text-xs text-muted">Permanently deletes your account and all of your bookmarks, notes, progress, history and preferences. This cannot be undone.</p>
          {!canDelete && <p className="mt-1 text-xs text-muted">Not enabled on this server yet (needs the SUPABASE_SERVICE_ROLE_KEY server setting; see SETUP.md).</p>}
          <label className={`${lab} mt-2`}>Type DELETE to confirm<input name="confirm" autoComplete="off" className={field} /></label>
          <button disabled={!canDelete} className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50">Delete my account</button>
        </form>
      </section>
    </div>
  );
}
