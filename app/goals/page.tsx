import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth, getPreferences } from "@/lib/auth";
import { SupabaseNotice } from "@/components/auth-shell";
import { getChapters } from "@/lib/quran/server";
import { currentStreak, isoDay } from "@/lib/utils/daily";
import type { Goals, Memo, Session } from "@/lib/db-types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Goals & progress", robots: { index: false } };

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(value, max)} className="mt-2 h-2 w-full overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function GoalsPage() {
  const auth = await requireAuth("/goals");
  if (!auth) return <div className="mx-auto max-w-xl px-4 py-8"><SupabaseNotice /></div>;
  const { supabase } = auth;
  const prefs = await getPreferences();
  const now = new Date();
  const since = isoDay(new Date(now.getTime() - 400 * 86_400_000));

  const [goalRow, daily, bySurah, memoRows, sessionRows, chapters] = await Promise.all([
    supabase.from("reading_goals").select("daily_ayahs, weekly_ayahs, daily_memorization").maybeSingle(),
    supabase.rpc("my_daily_counts", { since }),
    supabase.rpc("my_progress_by_surah"),
    supabase.from("memorization_progress").select("surah, ayah, status, next_review_on").limit(7000),
    supabase.from("reading_sessions").select("id, surah, opened_at").order("opened_at", { ascending: false }).limit(6),
    getChapters().catch(() => []),
  ]);
  const goals: Goals = (goalRow.data as Goals | null) ?? { daily_ayahs: 5, weekly_ayahs: null, daily_memorization: 0 };
  const days = (daily.data as { day: string; ayahs: number }[] | null) ?? [];
  const perSurah = (bySurah.data as { surah: number; ayahs: number }[] | null) ?? [];
  const memos = (memoRows.data as Memo[] | null) ?? [];
  const sessions = (sessionRows.data as Session[] | null) ?? [];

  const today = isoDay(now);
  const todayCount = days.find((d) => d.day === today)?.ayahs ?? 0;
  const weekStart = isoDay(new Date(now.getTime() - 6 * 86_400_000));
  const week = days.filter((d) => d.day >= weekStart).reduce((a, d) => a + d.ayahs, 0);
  const streak = currentStreak(days.map((d) => d.day), now);
  const totalAyahs = perSurah.reduce((a, s) => a + s.ayahs, 0);
  const completed = perSurah.filter((s) => s.ayahs >= (chapters.find((c) => c.id === s.surah)?.verses_count ?? Infinity)).length;
  const memorized = memos.filter((m) => m.status === "memorized").length;
  const name = (s: number) => chapters.find((c) => c.id === s)?.name_simple ?? `Surah ${s}`;
  const card = "rounded-xl border border-line bg-surface p-3";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold sm:text-[28px]">Goals & progress</h1>
      <p className="mb-4 mt-1 text-sm text-muted">
        Progress counts only ayahs you mark as read, so every number here is a verified count, not an estimate. Days follow UTC. Be gentle with yourself; steady is better than fast.
      </p>

      {sessions[0] && <Link href={`/quran/${sessions[0].surah}`} className="mb-4 block rounded-xl border border-accent bg-surface p-3 text-sm">Continue reading: <strong>{name(sessions[0].surah)}</strong></Link>}

      <div className="grid gap-3 sm:grid-cols-2">
        <section className={card} aria-label="Today">
          <h2 className="text-lg font-semibold">Today</h2>
          <p className="text-sm">{todayCount} of {goals.daily_ayahs} ayahs marked as read</p>
          <Bar value={todayCount} max={goals.daily_ayahs} label="Daily reading goal" />
        </section>
        <section className={card} aria-label="This week">
          <h2 className="text-lg font-semibold">Last 7 days</h2>
          <p className="text-sm">{goals.weekly_ayahs ? `${week} of ${goals.weekly_ayahs} ayahs` : `${week} ayahs marked as read`}</p>
          {goals.weekly_ayahs && <Bar value={week} max={goals.weekly_ayahs} label="Weekly reading goal" />}
        </section>
        <section className={card} aria-label="Overall">
          <h2 className="text-lg font-semibold">Overall reading</h2>
          <p className="text-sm">{totalAyahs} different ayahs marked as read</p>
          <p className="text-sm">{completed} {completed === 1 ? "surah" : "surahs"} fully marked as read</p>
          {prefs?.show_streak !== false && <p className="mt-1 text-sm">Current streak: {streak} {streak === 1 ? "day" : "days"}</p>}
        </section>
        <section className={card} aria-label="Memorization">
          <h2 className="text-lg font-semibold">Memorization</h2>
          <p className="text-sm">Learning: {memos.filter((m) => m.status === "learning").length} · Memorized: {memorized} · Needs revision: {memos.filter((m) => m.status === "revision").length}</p>
          {goals.daily_memorization > 0 && <p className="text-xs text-muted">Daily memorization goal: {goals.daily_memorization} ayahs</p>}
          <Link href="/memorization" className="mt-1 inline-block text-sm text-accent underline">Open memorization</Link>
        </section>
      </div>

      <section aria-label="Recent activity" className="mt-5">
        <h2 className="mb-2 text-lg font-semibold">Recent activity</h2>
        {sessions.length === 0 ? <p className="text-sm text-muted">No visits recorded yet.</p> : (
          <ul className="flex flex-wrap gap-2">{sessions.map((s) => <li key={s.id}><Link href={`/quran/${s.surah}`} className="rounded-full border border-line px-3 py-1 text-sm hover:border-accent">{name(s.surah)}</Link></li>)}</ul>
        )}
      </section>
      <p className="mt-6 text-sm"><Link href="/settings#goals" className="text-accent underline">Change your goals</Link></p>
    </div>
  );
}
