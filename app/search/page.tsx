import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getChapters, QuranApiError, searchQuran } from "@/lib/quran/server";
import type { SearchResponse } from "@/lib/quran/types";
import { ApiProblem } from "@/components/setup-notice";
import { SearchForm } from "@/components/search-form";
import { Highlighted } from "@/components/highlight";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q: raw, page: rawPage } = await searchParams;
  const q = (raw ?? "").trim().slice(0, 200);
  const page = Math.max(1, Math.floor(Number(rawPage)) || 1);

  const shell = (body: React.ReactNode) => (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-3 text-2xl font-semibold sm:text-[28px]">Search</h1>
      <SearchForm initial={q} />
      {body}
    </div>
  );
  if (!q) return shell(<p className="mt-6 text-sm text-muted">Search Arabic words or phrases, English or Urdu translations, surah names, or jump straight to an ayah with a reference such as 2:255.</p>);

  try {
    const chapters = await getChapters();
    const ref = q.match(/^(\d{1,3})\s*[:.]\s*(\d{1,3})$/);
    if (ref) {
      const c = chapters.find((x) => x.id === Number(ref[1]));
      const a = Number(ref[2]);
      if (c && a >= 1 && a <= c.verses_count) redirect(`/quran/${c.id}#ayah-${a}`);
      return shell(<p className="mt-6 text-sm text-muted">No such ayah{c ? `: ${c.name_simple} has ${c.verses_count} ayahs` : ""}.</p>);
    }

    const ql = q.toLowerCase();
    const surahs = chapters
      .filter((c) => String(c.id) === q || c.name_arabic.includes(q) || (ql.length >= 2 && c.name_simple.toLowerCase().includes(ql)))
      .slice(0, 5);

    let result: SearchResponse | null = null;
    let searchProblem: string | null = null;
    if (!/^\d+$/.test(q)) {
      try {
        result = await searchQuran(q, page);
      } catch (e) {
        if (!(e instanceof QuranApiError)) throw e;
        searchProblem = e.kind === "auth"
          ? "Verse search was rejected by the provider. Your API credentials may not include search access."
          : "Verse search is temporarily unavailable. Surah matches are still shown.";
      }
    }
    const pageLink = (p: number) => `/search?q=${encodeURIComponent(q)}&page=${p}`;

    return shell(
      <>
        {surahs.length > 0 && (
          <section className="mt-6" aria-labelledby="surah-matches">
            <h2 id="surah-matches" className="mb-2 text-lg font-semibold text-gold">Surahs</h2>
            <ul className="space-y-2">
              {surahs.map((c) => (
                <li key={c.id}>
                  <Link href={`/quran/${c.id}`} className="flex items-center justify-between rounded-xl border border-line bg-surface p-3 hover:border-accent">
                    <span>{c.id}. {c.name_simple}</span>
                    <span lang="ar" dir="rtl" className="font-arabic text-lg">{c.name_arabic}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {searchProblem && <p role="alert" className="mt-6 rounded-xl border border-line bg-surface p-4 text-sm">{searchProblem}</p>}
        {result && (
          <section className="mt-6" aria-labelledby="verse-matches">
            <h2 id="verse-matches" className="mb-1 text-lg font-semibold text-gold">Verses</h2>
            <p className="mb-3 text-xs text-muted">
              {result.total_results} result{result.total_results === 1 ? "" : "s"}. Matches come from the provider&apos;s search index; open an ayah in the reader for the full authoritative text.
            </p>
            {result.results.length === 0 ? (
              <p className="text-sm text-muted">No verses matched.</p>
            ) : (
              <ul className="space-y-3">
                {result.results.map((r) => {
                  const [s, a] = r.verse_key.split(":");
                  return (
                    <li key={r.verse_key} className="rounded-xl border border-line bg-surface p-3">
                      <Link href={`/quran/${s}#ayah-${a}`} className="text-sm font-medium text-accent hover:underline">{r.verse_key} — open in reader</Link>
                      {(r.highlighted || r.text) && (
                        <p lang="ar" dir="rtl" className="mt-2 font-arabic text-xl leading-loose"><Highlighted html={r.highlighted || r.text || ""} /></p>
                      )}
                      {r.translations?.map((t, i) => (
                        <p key={i} className="mt-2 text-sm text-muted">
                          <Highlighted html={t.text} />
                          {t.name && <span className="block text-xs opacity-70">{t.name}</span>}
                        </p>
                      ))}
                    </li>
                  );
                })}
              </ul>
            )}
            {result.total_pages > 1 && (
              <nav aria-label="Search pages" className="mt-6 flex items-center justify-between text-sm">
                {page > 1 ? <Link href={pageLink(page - 1)} className="rounded-md border border-line bg-surface px-4 py-2">← Previous</Link> : <span />}
                <span className="text-muted">Page {result.current_page} of {result.total_pages}</span>
                {page < result.total_pages ? <Link href={pageLink(page + 1)} className="rounded-md border border-line bg-surface px-4 py-2">Next →</Link> : <span />}
              </nav>
            )}
          </section>
        )}
      </>,
    );
  } catch (e) {
    if (e instanceof QuranApiError) return <ApiProblem error={e} />;
    throw e;
  }
}
