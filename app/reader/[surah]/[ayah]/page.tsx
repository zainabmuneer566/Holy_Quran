import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getChapter, getRecitations, getTranslationResources, getVerseByKey, QuranApiError } from "@/lib/quran/server";
import { resolveAudioUrl } from "@/lib/quran/audio";
import { cleanTranslation } from "@/lib/quran/text";
import { ApiProblem } from "@/components/setup-notice";
import { ChapterAudio, PlayAyahButton } from "@/components/ayah-audio";
import { AyahActions } from "@/components/ayah-actions";
import { getCurrentUser, getPreferences } from "@/lib/auth";
import { getSurahPersonal } from "@/lib/personal";

export const dynamic = "force-dynamic";
type Params = Promise<{ surah: string; ayah: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { surah, ayah } = await params;
  const title = `Quran ${surah}:${ayah}`;
  try {
    const v = await getVerseByKey(`${surah}:${ayah}`, { translationIds: [20] });
    const text = cleanTranslation(v.translations?.[0]?.text ?? "");
    return { title, description: text ? text.slice(0, 200) : undefined, openGraph: { title, description: text.slice(0, 200) || undefined } };
  } catch {
    return { title };
  }
}

export default async function SingleAyah({ params }: { params: Params }) {
  const { surah: s, ayah: a } = await params;
  const surah = Number(s), ayah = Number(a);
  if (!/^\d+$/.test(s) || !/^\d+$/.test(a) || surah < 1 || surah > 114 || ayah < 1) notFound();

  try {
    const user = await getCurrentUser();
    const prefs = await getPreferences();
    const [chapter, resources, recitations] = await Promise.all([getChapter(surah), getTranslationResources(), getRecitations().catch(() => [])]);
    if (ayah > chapter.verses_count) notFound();

    const supported = resources.filter((r) => ["english", "urdu"].includes(r.language_name.toLowerCase()));
    const savedT = (prefs?.translation_ids ?? []).filter((n) => supported.some((r) => r.id === n)).slice(0, 1);
    const tid = savedT[0] ?? supported.find((r) => r.id === 20)?.id ?? supported.find((r) => r.language_name.toLowerCase() === "english")?.id;
    const reciterId = recitations.find((x) => x.id === prefs?.reciter_id)?.id ?? recitations.find((x) => x.id === 7)?.id ?? recitations[0]?.id;

    const verse = await getVerseByKey(`${surah}:${ayah}`, { translationIds: tid ? [tid] : [], reciterId });
    const meta = supported.find((r) => r.id === tid);
    const isUrdu = meta?.language_name.toLowerCase() === "urdu";
    const translation = cleanTranslation(verse.translations?.[0]?.text ?? "") || null;
    const audioUrl = verse.audio?.url ? resolveAudioUrl(verse.audio.url, "verse") : null;
    const personal = user ? await getSurahPersonal(surah) : null;

    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        {audioUrl && <ChapterAudio tracks={[{ url: audioUrl, label: `${chapter.name_simple} · ayah ${ayah}` }]} />}
        <p className="text-center text-xs text-muted">{chapter.name_simple} · {surah}:{ayah}</p>
        <article className="mt-3 rounded-2xl border border-gold bg-surface p-5 shadow-sm">
          <p lang="ar" dir="rtl" className="arabic-text">{verse.text_uthmani}</p>
          {translation && (
            <p lang={isUrdu ? "ur" : "en"} dir={isUrdu ? "rtl" : "ltr"} className={isUrdu ? "urdu-text mt-3 text-base" : "mt-3 text-[15px] leading-relaxed text-muted"}>{translation}</p>
          )}
          <p className="mt-4 border-t border-line pt-2 text-xs text-muted">
            Quran {surah}:{ayah}{meta ? ` · Translation: ${meta.author_name || meta.name}` : ""}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {audioUrl ? <PlayAyahButton url={audioUrl} label={`ayah ${surah}:${ayah}`} /> : <span className="text-xs text-muted">Audio unavailable</span>}
          </div>
          <AyahActions
            surah={surah} ayah={ayah} signedIn={Boolean(user)}
            bookmarked={personal?.bookmarked.has(ayah) ?? false} note={personal?.notes.get(ayah) ?? ""} readToday={personal?.readToday.has(ayah) ?? false}
            arabic={verse.text_uthmani} translation={translation} translationSource={meta ? meta.author_name || meta.name : null}
          />
        </article>
        <p className="mt-4 text-center text-sm"><Link href={`/quran/${surah}#ayah-${ayah}`} className="text-accent underline">Read the whole surah</Link></p>
        <nav aria-label="Ayah navigation" className="mt-6 flex justify-between text-sm">
          {ayah > 1 ? <Link href={`/reader/${surah}/${ayah - 1}`} className="rounded-md border border-line bg-surface px-4 py-2 hover:border-accent">← Ayah {ayah - 1}</Link> : <span />}
          {ayah < chapter.verses_count ? <Link href={`/reader/${surah}/${ayah + 1}`} className="rounded-md border border-line bg-surface px-4 py-2 hover:border-accent">Ayah {ayah + 1} →</Link> : <span />}
        </nav>
      </div>
    );
  } catch (e) {
    if (e instanceof QuranApiError) return <ApiProblem error={e} />;
    throw e;
  }
}
