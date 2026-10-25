import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getChapters, getJuzs, QuranApiError } from "@/lib/quran/server";
import { ApiProblem } from "@/components/setup-notice";

export const dynamic = "force-dynamic";
type Params = Promise<{ number: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { number } = await params;
  return { title: `Juz ${number}` };
}

export default async function JuzPage({ params }: { params: Params }) {
  const { number } = await params;
  const n = Number(number);
  if (!/^\d+$/.test(number) || n < 1 || n > 30) notFound();
  try {
    const [juzs, chapters] = await Promise.all([getJuzs(), getChapters()]);
    const juz = juzs.find((j) => j.juz_number === n);
    if (!juz) notFound();
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-semibold sm:text-[28px]">Juz {n}</h1>
        <p className="mt-1 text-sm text-muted">{juz.verses_count} ayahs. Choose where to start reading:</p>
        <ul className="mt-4 space-y-2.5">
          {Object.entries(juz.verse_mapping).map(([surah, range]) => {
            const [from, to] = range.split("-");
            const c = chapters.find((x) => x.id === Number(surah));
            return (
              <li key={surah}>
                <Link href={`/quran/${surah}#ayah-${from}`} className="flex items-center justify-between rounded-xl border border-line bg-surface p-3 text-sm hover:border-accent">
                  <span>{c?.name_simple ?? `Surah ${surah}`}</span>
                  <span className="text-sm text-muted">ayahs {from}–{to ?? from}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <nav aria-label="Juz navigation" className="mt-6 flex justify-between text-sm">
          {n > 1 ? <Link href={`/juz/${n - 1}`} className="rounded-md border border-line bg-surface px-4 py-2 hover:border-accent">← Juz {n - 1}</Link> : <span />}
          {n < 30 ? <Link href={`/juz/${n + 1}`} className="rounded-md border border-line bg-surface px-4 py-2 hover:border-accent">Juz {n + 1} →</Link> : <span />}
        </nav>
      </div>
    );
  } catch (e) {
    if (e instanceof QuranApiError) return <ApiProblem error={e} />;
    throw e;
  }
}
