import type { Metadata } from "next";
import Link from "next/link";
import { getChapters, getChapterVerses, QuranApiError } from "@/lib/quran/server";
import { parseTajweed } from "@/lib/quran/text";
import { TajweedText } from "@/components/tajweed-text";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tajweed" };

const lessons = [
  { title: "Noon sakinah and tanween", body: "When a silent noon or tanween meets the next letter, one of four rules applies: Izhar (pronounce clearly, before the throat letters ء ه ع ح غ خ), Idgham (merge, before ي ر م ل و ن), Iqlab (the sound changes to a meem, before ب), and Ikhfa (hide the noon, before the remaining letters)." },
  { title: "Meem sakinah", body: "A silent meem has three rules: Ikhfa shafawi (before ب), Idgham shafawi (before م), and Izhar shafawi (before every other letter)." },
  { title: "Qalqalah", body: "A slight echoing bounce when one of the letters ق ط ب ج د carries a sukoon, whether in the middle of a word or when you stop on it." },
  { title: "Ghunnah", body: "A nasal sound held on a noon or meem that carries a shaddah." },
  { title: "Madd (prolongation)", body: "A natural madd is held for two counts. Other madd types are extended by different lengths, and these lengths are best learned by listening to, and reciting with, a qualified teacher." },
];

export default async function TajweedPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s } = await searchParams;
  const surah = Math.min(Math.max(Math.floor(Number(s)) || 1, 1), 114);

  let sample: { key: string; segments: ReturnType<typeof parseTajweed> }[] = [];
  let annotated = false;
  let problem: string | null = null;
  let names: { id: number; name: string }[] = [];
  try {
    names = (await getChapters()).map((c) => ({ id: c.id, name: c.name_simple }));
    const verses = (await getChapterVerses(surah, { translationIds: [], tajweed: true, maxPages: 1 })).slice(0, 12);
    annotated = verses.some((v) => v.text_uthmani_tajweed && /<tajweed/i.test(v.text_uthmani_tajweed));
    sample = verses.map((v) => ({
      key: v.verse_key,
      segments: annotated && v.text_uthmani_tajweed ? parseTajweed(v.text_uthmani_tajweed) : [{ text: v.text_uthmani, rule: null }],
    }));
  } catch (e) {
    if (!(e instanceof QuranApiError)) throw e;
    problem = e.kind === "not_configured" ? "The Quran content source is not configured yet, so examples cannot be shown." : "Examples are temporarily unavailable.";
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold sm:text-[28px]">Tajweed</h1>
      <p className="mt-1 text-sm text-muted">
        Short summaries of common rules. This is an introduction for learning, not a replacement for a qualified teacher, and the app does not check or certify your recitation.
      </p>

      <section aria-labelledby="rules" className="mt-5">
        <h2 id="rules" className="mb-2 text-lg font-semibold">Common rules</h2>
        <div className="space-y-2">
          {lessons.map((l) => (
            <details key={l.title} className="rounded-xl border border-line bg-surface p-3">
              <summary className="cursor-pointer text-[15px] font-medium">{l.title}</summary>
              <p className="mt-2 text-sm text-muted">{l.body}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="examples" className="mt-6">
        <h2 id="examples" className="mb-2 text-lg font-semibold">See it in the text</h2>
        <form method="get" className="mb-3 flex items-end gap-2">
          <label className="flex min-w-0 flex-col text-xs text-muted">Surah
            <select name="s" defaultValue={surah} className="mt-1 rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink">
              {names.length ? names.map((c) => <option key={c.id} value={c.id}>{c.id}. {c.name}</option>) : <option value={surah}>{surah}</option>}
            </select>
          </label>
          <button className="rounded-md bg-accent px-3 py-1.5 text-sm text-bg">Show</button>
        </form>
        {problem && <p role="alert" className="rounded-xl border border-line bg-surface p-3 text-sm">{problem}</p>}
        {!problem && !annotated && (
          <p role="status" className="mb-3 rounded-xl border border-line bg-surface p-3 text-sm">
            The content source did not return Tajweed annotations for this request, so the text is shown without colours. Colour coding needs a source that provides them; nothing is guessed here.
          </p>
        )}
        {sample.length > 0 && <TajweedText verses={sample} />}
        <p className="mt-3 text-xs text-muted">Showing the first ayahs only. <Link className="text-accent underline" href={`/quran/${surah}`}>Open the full surah</Link>.</p>
      </section>
    </div>
  );
}
