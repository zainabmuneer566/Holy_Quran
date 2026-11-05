import Link from "next/link";
import { getChapters, getTranslationResources, getVerseByKey } from "@/lib/quran/server";
import { cleanTranslation } from "@/lib/quran/text";
import { dailyVerseKey, formatDates } from "@/lib/utils/daily";
import { getPreferences } from "@/lib/auth";

/** Shows nothing if the content source is unavailable; the rest of the home page still works. */
export async function DailyAyah() {
  try {
    const now = new Date();
    const [chapters, resources, prefs] = await Promise.all([getChapters(), getTranslationResources().catch(() => []), getPreferences()]);
    const key = dailyVerseKey(chapters.map((c) => c.verses_count), now);
    const supported = resources.filter((r) => ["english", "urdu"].includes(r.language_name.toLowerCase()));
    const wanted = prefs?.translation_ids?.[0];
    const meta = supported.find((r) => r.id === wanted) ?? supported.find((r) => r.id === 20) ?? supported.find((r) => r.language_name.toLowerCase() === "english");
    const verse = await getVerseByKey(key, { translationIds: meta ? [meta.id] : [] });
    const [s] = key.split(":");
    const translation = cleanTranslation(verse.translations?.[0]?.text ?? "");
    const isUrdu = meta?.language_name.toLowerCase() === "urdu";
    const dates = formatDates(now);
    return (
      <section aria-labelledby="daily" className="mx-auto mb-10 max-w-2xl">
        <h2 id="daily" className="mb-3 text-lg font-semibold text-gold">Daily ayah</h2>
        <article className="rounded-2xl border border-gold bg-surface p-5 shadow-sm">
          <p className="text-xs text-muted">{dates.gregorian} · {dates.hijri}</p>
          <p lang="ar" dir="rtl" className="arabic-text mt-3">{verse.text_uthmani}</p>
          {translation && <p lang={isUrdu ? "ur" : "en"} dir={isUrdu ? "rtl" : "ltr"} className={isUrdu ? "urdu-text mt-2 text-base" : "mt-2 text-[15px] leading-relaxed text-muted"}>{translation}</p>}
          <p className="mt-3 text-xs text-muted">
            {chapters.find((c) => c.id === Number(s))?.name_simple} {key}{meta ? ` · Translation: ${meta.author_name || meta.name}` : ""}
          </p>
          <Link href={`/reader/${s}/${key.split(":")[1]}`} className="mt-2 inline-block text-sm text-accent underline">Open, listen and share</Link>
        </article>
        <p className="mt-2 text-center text-xs text-muted">Hijri dates are calculated and may differ by a day from local moon sighting.</p>
      </section>
    );
  } catch {
    return null;
  }
}
