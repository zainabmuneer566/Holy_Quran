import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getChapter, getTafsir, getTafsirResources, getVerseByKey, QuranApiError } from "@/lib/quran/server";
import { tafsirToParagraphs } from "@/lib/quran/text";
import type { TafsirContent } from "@/lib/quran/types";
import { ApiProblem } from "@/components/setup-notice";

export const dynamic = "force-dynamic";
type Params = Promise<{ surah: string; ayah: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { surah, ayah } = await params;
  return { title: `Tafsir ${surah}:${ayah}` };
}

export default async function TafsirPage({ params, searchParams }: { params: Params; searchParams: Promise<{ id?: string }> }) {
  const { surah: s, ayah: a } = await params;
  const { id: rawId } = await searchParams;
  const surah = Number(s), ayah = Number(a);
  if (!/^\d+$/.test(s) || !/^\d+$/.test(a) || surah < 1 || surah > 114 || ayah < 1) notFound();

  try {
    const chapter = await getChapter(surah);
    if (ayah > chapter.verses_count) notFound();
    const key = `${surah}:${ayah}`;
    const [verse, resources] = await Promise.all([getVerseByKey(key), getTafsirResources().catch(() => [])]);

    const listed = resources.filter((r) => ["english", "urdu"].includes(r.language_name.toLowerCase()));
    const requested = Number(rawId);
    const current = listed.find((r) => r.id === requested) ?? listed.find((r) => r.language_name.toLowerCase() === "english") ?? listed[0];

    let content: TafsirContent | null = null;
    let problem: string | null = null;
    if (!current) problem = "No tafsir resources are available from the content source right now.";
    else {
      try {
        content = await getTafsir(current.id, key);
      } catch (e) {
        if (!(e instanceof QuranApiError)) throw e;
        problem = "This tafsir could not be loaded for this ayah. Try another tafsir or try again shortly.";
      }
    }
    const paragraphs = content ? tafsirToParagraphs(content.text) : [];
    const isUrdu = current?.language_name.toLowerCase() === "urdu";

    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <p className="text-xs text-muted">Tafsir</p>
        <h1 className="text-2xl font-semibold sm:text-[28px]">{chapter.name_simple} {key}</h1>

        <section aria-label="Ayah" className="mt-4 rounded-xl border border-line bg-surface p-4">
          <p lang="ar" dir="rtl" className="arabic-text">{verse.text_uthmani}</p>
          <Link href={`/quran/${surah}#ayah-${ayah}`} className="mt-2 inline-block text-sm text-accent underline">Back to the ayah in the reader</Link>
        </section>

        {listed.length > 0 && (
          <form method="get" className="mt-4 flex flex-wrap items-end gap-2">
            <label className="flex min-w-0 flex-col text-xs text-muted">
              Tafsir
              <select name="id" defaultValue={current?.id} className="mt-1 max-w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink">
                {listed.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.language_name})</option>)}
              </select>
            </label>
            <button className="rounded-md bg-accent px-3 py-1.5 text-sm text-bg">Show</button>
          </form>
        )}

        <section aria-label="Tafsir text" className="mt-4">
          {current && (
            <p className="mb-2 text-xs text-muted">
              Source: {content?.resource_name || current.name}{current.author_name ? ` — ${current.author_name}` : ""}.
              This is commentary, separate from the Quran text and its translations.
            </p>
          )}
          {problem && <p role="alert" className="rounded-xl border border-line bg-surface p-3 text-sm">{problem}</p>}
          {content && paragraphs.length === 0 && <p className="text-sm text-muted">This tafsir has no text for this ayah.</p>}
          <div lang={isUrdu ? "ur" : "en"} dir={isUrdu ? "rtl" : "ltr"} className={`space-y-3 ${isUrdu ? "urdu-text text-base" : "text-[15px] leading-relaxed"}`}>
            {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        <nav aria-label="Ayah navigation" className="mt-8 flex justify-between text-sm">
          {ayah > 1 ? <Link href={`/tafsir/${surah}/${ayah - 1}${current ? `?id=${current.id}` : ""}`} className="rounded-md border border-line bg-surface px-4 py-2 hover:border-accent">← Ayah {ayah - 1}</Link> : <span />}
          {ayah < chapter.verses_count ? <Link href={`/tafsir/${surah}/${ayah + 1}${current ? `?id=${current.id}` : ""}`} className="rounded-md border border-line bg-surface px-4 py-2 hover:border-accent">Ayah {ayah + 1} →</Link> : <span />}
        </nav>
      </div>
    );
  } catch (e) {
    if (e instanceof QuranApiError) return <ApiProblem error={e} />;
    throw e;
  }
}
