import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBismillahText, getChapter, getChapterVerses, getRecitations, getTranslationResources, QuranApiError,
} from "@/lib/quran/server";
import { resolveAudioUrl } from "@/lib/quran/audio";
import { ChapterAudio, PlayAyahButton } from "@/components/ayah-audio";
import { StudyVerse } from "@/components/study-verse";
import { cleanTranslation } from "@/lib/quran/text";
import { ApiProblem } from "@/components/setup-notice";
import { ReaderToolbar } from "@/components/reader-toolbar";
import { ReadingTracker } from "@/components/continue-reading";

export const dynamic = "force-dynamic";

type Params = Promise<{ surah: string }>;
type Search = Promise<{ t?: string; r?: string; w?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { surah } = await params;
  return { title: `Surah ${surah}` };
}

function meta0(list: { id: number; language_name: string }[], id: number): string {
  return list.find((x) => x.id === id)?.language_name.toLowerCase() ?? "english";
}

function parseSurah(raw: string): number | null {
  const n = Number(raw);
  return /^\d+$/.test(raw) && n >= 1 && n <= 114 ? n : null;
}

export default async function SurahPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { surah: raw } = await params;
  const { t, r, w } = await searchParams;
  const wordMode = w === "1";
  const id = parseSurah(raw);
  if (!id) notFound();

  try {
    const [chapter, resources, recitations] = await Promise.all([
      getChapter(id),
      getTranslationResources(),
      // Audio is optional: if the recitation list fails, the reader still works.
      getRecitations().catch(() => []),
    ]);

    const reciters = recitations.map((x) => ({ id: x.id, label: x.style ? `${x.reciter_name} (${x.style})` : x.reciter_name }));
    const requested = Number(r);
    const reciterId = reciters.some((x) => x.id === requested) ? requested : (reciters.find((x) => x.id === 7)?.id ?? reciters[0]?.id ?? null);

    const supported = resources.filter((r) => ["english", "urdu"].includes(r.language_name.toLowerCase()));
    const options = supported.map((r) => ({
      id: r.id,
      label: r.author_name || r.name,
      language: r.language_name.toLowerCase(),
    }));

    let selected: number[];
    if (t === "none") selected = [];
    else if (t) {
      selected = t.split(",").map(Number).filter((n) => options.some((o) => o.id === n)).slice(0, 2);
    } else {
      const english = supported.find((r) => r.id === 20) ?? supported.find((r) => r.language_name.toLowerCase() === "english");
      selected = english ? [english.id] : [];
    }

    const [verses, bismillah] = await Promise.all([
      getChapterVerses(id, {
        translationIds: selected,
        reciterId: reciterId ?? undefined,
        words: wordMode,
        wordLanguage: selected[0] !== undefined && meta0(supported, selected[0]) === "urdu" ? "ur" : "en",
      }),
      chapter.bismillah_pre ? getBismillahText() : Promise.resolve(null),
    ]);

    const meta = new Map(supported.map((r) => [r.id, r]));
    const prev = id > 1 ? id - 1 : null;
    const next = id < 114 ? id + 1 : null;
    const qp = new URLSearchParams();
    if (t) qp.set("t", t);
    if (r) qp.set("r", r);
    if (wordMode) qp.set("w", "1");
    const q = qp.toString() ? `?${qp.toString()}` : "";
    const tracks = verses.flatMap((v) =>
      v.audio?.url ? [{ url: resolveAudioUrl(v.audio.url, "verse"), label: `${chapter.name_simple} · ayah ${v.verse_number}` }] : [],
    );

    return (
      <>
        <ReadingTracker surah={id} name={chapter.name_simple} />
        <ChapterAudio tracks={tracks} />
        <ReaderToolbar versesCount={chapter.verses_count} options={options} selected={selected} reciters={reciters} reciterId={reciterId} wordMode={wordMode} />
        <div className="mx-auto max-w-3xl px-4 py-5">
          <header className="mb-5 text-center">
            <p className="text-xs text-muted">Surah {chapter.id} · {chapter.revelation_place === "madinah" ? "Medinan" : "Meccan"} · {chapter.verses_count} ayahs</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-[28px]">{chapter.name_simple}</h1>
            <p lang="ar" dir="rtl" className="mt-0.5 font-arabic text-2xl sm:text-[28px]">{chapter.name_arabic}</p>
            <p className="text-xs text-muted">{chapter.translated_name.name}</p>
          </header>

          {bismillah && (
            <p lang="ar" dir="rtl" className="arabic-text mb-4 text-center" style={{ textAlign: "center" }}>{bismillah}</p>
          )}

          {selected.length > 0 && (
            <p className="mb-4 text-xs text-muted">
              Translation{selected.length > 1 ? "s" : ""}:{" "}
              {selected.map((sid) => meta.get(sid)?.name ?? `#${sid}`).join(" · ")}
            </p>
          )}

          <div className="divide-y divide-line">
            {verses.map((v) => (
              <article key={v.id} id={`ayah-${v.verse_number}`} className="scroll-mt-4 py-4">
                <div className="mb-2 flex items-center justify-between text-xs text-muted">
                  <span className="flex items-center gap-2">
                    <span className="rounded-full border border-gold px-2 py-0.5 text-gold">{v.verse_key}</span>
                    {v.audio?.url ? (
                      <PlayAyahButton url={resolveAudioUrl(v.audio.url, "verse")} label={`ayah ${v.verse_key}`} />
                    ) : reciterId ? (
                      <span className="text-xs">Audio unavailable</span>
                    ) : null}
                  </span>
                  <span>Juz {v.juz_number} · Page {v.page_number}</span>
                </div>
                {wordMode && v.words?.length ? (
                  <StudyVerse words={v.words} verseKey={v.verse_key} />
                ) : (
                  <p lang="ar" dir="rtl" className="arabic-text">{v.text_uthmani}</p>
                )}
                {selected.map((sid) => {
                  const tr = v.translations?.find((x) => x.resource_id === sid);
                  const isUrdu = meta.get(sid)?.language_name.toLowerCase() === "urdu";
                  return tr ? (
                    <p
                      key={sid}
                      lang={isUrdu ? "ur" : "en"}
                      dir={isUrdu ? "rtl" : "ltr"}
                      className={isUrdu ? "urdu-text mt-2 text-base" : "mt-2 text-[15px] leading-relaxed text-muted"}
                    >
                      {cleanTranslation(tr.text)}
                    </p>
                  ) : (
                    <p key={sid} className="mt-2 text-xs italic text-muted">Translation unavailable for this ayah.</p>
                  );
                })}
              </article>
            ))}
          </div>

          <nav aria-label="Surah navigation" className="mt-8 flex justify-between text-sm">
            {prev ? <Link href={`/quran/${prev}${q}`} className="rounded-md border border-line bg-surface px-4 py-2 hover:border-accent">← Surah {prev}</Link> : <span />}
            <Link href="/quran" className="px-4 py-2 text-muted hover:text-accent">All surahs</Link>
            {next ? <Link href={`/quran/${next}${q}`} className="rounded-md border border-line bg-surface px-4 py-2 hover:border-accent">Surah {next} →</Link> : <span />}
          </nav>
        </div>
      </>
    );
  } catch (e) {
    if (e instanceof QuranApiError) return <ApiProblem error={e} />;
    throw e;
  }
}
