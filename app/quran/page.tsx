import type { Metadata } from "next";
import { getChapters, QuranApiError } from "@/lib/quran/server";
import { ApiProblem } from "@/components/setup-notice";
import { SurahList } from "@/components/surah-list";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Surahs" };

export default async function QuranIndex() {
  try {
    const chapters = await getChapters();
    const items = chapters.map((c) => ({
      id: c.id,
      nameSimple: c.name_simple,
      nameArabic: c.name_arabic,
      meaning: c.translated_name.name,
      place: c.revelation_place === "madinah" ? "Medinan" : "Meccan",
      verses: c.verses_count,
    }));
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">The Holy Quran</h1>
        <SurahList items={items} />
      </div>
    );
  } catch (e) {
    if (e instanceof QuranApiError) return <ApiProblem error={e} />;
    throw e;
  }
}
