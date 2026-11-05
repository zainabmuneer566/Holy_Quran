import type { Metadata } from "next";
import Link from "next/link";
import { getChapters, getChapterVerses, getRecitations, QuranApiError } from "@/lib/quran/server";
import { resolveAudioUrl } from "@/lib/quran/audio";
import { ApiProblem } from "@/components/setup-notice";
import { MemorizeList } from "@/components/memorize-list";
import { getCurrentUser, getPreferences } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isoDay } from "@/lib/utils/daily";
import type { Memo } from "@/lib/db-types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Memorization" };

export default async function MemorizationPage({ searchParams }: { searchParams: Promise<{ s?: string; from?: string; to?: string }> }) {
  const sp = await searchParams;
  try {
    const user = await getCurrentUser();
    const prefs = await getPreferences();
    const chapters = await getChapters();
    const surah = Number(sp.s);
    const chapter = chapters.find((c) => c.id === surah);

    let memos: Memo[] = [];
    let due: Memo[] = [];
    if (user) {
      const supabase = await createClient();
      const [all, dueRows] = await Promise.all([
        supabase.from("memorization_progress").select("surah, ayah, status, next_review_on").limit(7000),
        supabase.from("memorization_progress").select("surah, ayah, status, next_review_on").lte("next_review_on", isoDay(new Date())).order("next_review_on").limit(20),
      ]);
      memos = (all.data as Memo[] | null) ?? [];
      due = (dueRows.data as Memo[] | null) ?? [];
    }
    const count = (s: string) => memos.filter((m) => m.status === s).length;

    let list: React.ReactNode = null;
    if (chapter) {
      const from = Math.min(Math.max(Math.floor(Number(sp.from)) || 1, 1), chapter.verses_count);
      const to = Math.min(Math.max(Math.floor(Number(sp.to)) || Math.min(from + 6, chapter.verses_count), from), chapter.verses_count, from + 49);
      const recitations = await getRecitations().catch(() => []);
      const reciterId = recitations.find((x) => x.id === prefs?.reciter_id)?.id ?? recitations.find((x) => x.id === 7)?.id ?? recitations[0]?.id;
      const all = await getChapterVerses(chapter.id, { translationIds: [], reciterId });
      const status = new Map(memos.filter((m) => m.surah === chapter.id).map((m) => [m.ayah, m.status]));
      const verses = all.filter((v) => v.verse_number >= from && v.verse_number <= to).map((v) => ({
        n: v.verse_number, arabic: v.text_uthmani, audioUrl: v.audio?.url ? resolveAudioUrl(v.audio.url, "verse") : null, status: status.get(v.verse_number) ?? null,
      }));
      list = (
        <section aria-label="Practice" className="mt-5">
          <h2 className="mb-2 text-lg font-semibold">{chapter.name_simple}, ayahs {from}–{to}</h2>
          <MemorizeList key={`${chapter.id}-${from}-${to}`} surah={chapter.id} surahName={chapter.name_simple} verses={verses} signedIn={Boolean(user)} />
        </section>
      );
    }

    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-semibold sm:text-[28px]">Memorization</h1>
        <p className="mt-1 text-sm text-muted">
          A personal practice tool: hide the text, recite, then reveal to check. It does not assess your recitation or Tajweed, so please learn with a qualified teacher.
        </p>

        <form method="get" className="mt-4 grid grid-cols-3 items-end gap-2 sm:grid-cols-[1fr_5rem_5rem_auto]">
          <label className="col-span-3 flex flex-col text-xs text-muted sm:col-span-1">Surah
            <select name="s" defaultValue={chapter?.id ?? ""} className="mt-1 rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink">
              <option value="" disabled>Choose…</option>
              {chapters.map((c) => <option key={c.id} value={c.id}>{c.id}. {c.name_simple}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-xs text-muted">From
            <input name="from" inputMode="numeric" defaultValue={sp.from ?? ""} placeholder="1" className="mt-1 rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink" />
          </label>
          <label className="flex flex-col text-xs text-muted">To
            <input name="to" inputMode="numeric" defaultValue={sp.to ?? ""} className="mt-1 rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink" />
          </label>
          <button className="rounded-md bg-accent px-3 py-1.5 text-sm text-bg">Practise</button>
        </form>

        {user && (
          <section aria-label="Your progress" className="mt-5 rounded-xl border border-line bg-surface p-3 text-sm">
            <p>Tracked ayahs — learning: <strong>{count("learning")}</strong> · memorized: <strong>{count("memorized")}</strong> · needs revision: <strong>{count("revision")}</strong></p>
            {due.length > 0 && (
              <p className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-muted">Due for revision:</span>
                {due.map((d) => (
                  <Link key={`${d.surah}:${d.ayah}`} href={`/memorization?s=${d.surah}&from=${d.ayah}&to=${d.ayah}`} className="rounded-full border border-line px-2 py-0.5 text-xs hover:border-accent">{d.surah}:{d.ayah}</Link>
                ))}
              </p>
            )}
          </section>
        )}
        {!user && <p className="mt-4 text-xs text-muted"><Link href="/login?next=/memorization" className="text-accent underline">Sign in</Link> to track what you have learned and get revision dates.</p>}
        {list}
      </div>
    );
  } catch (e) {
    if (e instanceof QuranApiError) return <ApiProblem error={e} />;
    throw e;
  }
}
