import type { Metadata } from "next";
import Link from "next/link";
import { getChapters, getJuzs, QuranApiError } from "@/lib/quran/server";
import { ApiProblem } from "@/components/setup-notice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Juz" };

export default async function JuzIndex() {
  try {
    const [juzs, chapters] = await Promise.all([getJuzs(), getChapters()]);
    const name = (id: string) => chapters.find((c) => c.id === Number(id))?.name_simple ?? `Surah ${id}`;
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-semibold sm:text-[28px]">Juz (Para)</h1>
        <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {juzs.map((j) => {
            const [firstSurah, range] = Object.entries(j.verse_mapping)[0] ?? ["1", "1-1"];
            return (
              <li key={j.id}>
                <Link href={`/juz/${j.juz_number}`} className="block rounded-xl border border-line bg-surface p-3 shadow-sm hover:border-accent">
                  <span className="text-[15px] font-medium">Juz {j.juz_number}</span>
                  <span className="block text-xs text-muted">Starts: {name(firstSurah)} {range.split("-")[0]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  } catch (e) {
    if (e instanceof QuranApiError) return <ApiProblem error={e} />;
    throw e;
  }
}
