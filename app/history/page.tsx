import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth, getPreferences } from "@/lib/auth";
import { SupabaseNotice } from "@/components/auth-shell";
import { SavedBanner } from "@/components/saved-banner";
import { getChapters } from "@/lib/quran/server";
import { clearHistory } from "@/app/actions/settings";
import type { Session } from "@/lib/db-types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reading history", robots: { index: false } };

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const auth = await requireAuth("/history");
  if (!auth) return <div className="mx-auto max-w-xl px-4 py-8"><SupabaseNotice /></div>;
  const { saved } = await searchParams;
  const prefs = await getPreferences();
  const [rows, chapters] = await Promise.all([
    auth.supabase.from("reading_sessions").select("id, surah, opened_at").order("opened_at", { ascending: false }).limit(100),
    getChapters().catch(() => []),
  ]);
  const sessions = (rows.data as Session[] | null) ?? [];
  const name = (s: number) => chapters.find((c) => c.id === s)?.name_simple ?? `Surah ${s}`;
  const fmt = (iso: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(iso)) + " UTC";
  const recent = [...new Map(sessions.map((s) => [s.surah, s])).values()].slice(0, 8);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold sm:text-[28px]">Reading history</h1>
      <SavedBanner tag={saved} />
      {prefs && prefs.keep_history === false && <p className="mb-4 rounded-md border border-line p-2 text-sm">History is turned off in Settings, so new visits are not recorded.</p>}

      {sessions[0] && (
        <Link href={`/quran/${sessions[0].surah}`} className="mb-5 block rounded-xl border border-accent bg-surface p-3 text-sm">
          Resume reading: <strong>{name(sessions[0].surah)}</strong> <span className="text-muted">({fmt(sessions[0].opened_at)})</span>
        </Link>
      )}
      {recent.length > 0 && (
        <section aria-label="Recent surahs" className="mb-5">
          <h2 className="mb-2 text-lg font-semibold">Recently read surahs</h2>
          <ul className="flex flex-wrap gap-2">{recent.map((s) => <li key={s.surah}><Link href={`/quran/${s.surah}`} className="rounded-full border border-line px-3 py-1 text-sm hover:border-accent">{name(s.surah)}</Link></li>)}</ul>
        </section>
      )}
      <section aria-label="All visits">
        <h2 className="mb-2 text-lg font-semibold">Visits</h2>
        {sessions.length === 0 ? <p className="text-sm text-muted">Nothing yet. Surahs you open while signed in will appear here.</p> : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface text-sm">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <Link href={`/quran/${s.surah}`} className="text-accent underline">{name(s.surah)}</Link><span className="text-xs text-muted">{fmt(s.opened_at)}</span>
              </li>
            ))}
          </ul>
        )}
        {sessions.length > 0 && <form action={clearHistory} className="mt-4"><button className="rounded-md border border-line px-3 py-1.5 text-sm hover:border-accent">Clear history</button></form>}
      </section>
    </div>
  );
}
