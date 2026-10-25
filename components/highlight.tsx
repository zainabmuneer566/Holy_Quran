import { cleanTranslation } from "@/lib/quran/text";

/** Renders provider search snippets: only <em> becomes <mark>; every other tag is stripped. */
export function Highlighted({ html }: { html: string }) {
  const parts = html.split(/(<em>.*?<\/em>)/gis);
  return (
    <>
      {parts.map((p, i) =>
        /^<em>/i.test(p) ? (
          <mark key={i} className="rounded bg-gold/30 px-0.5 text-ink">{cleanTranslation(p)}</mark>
        ) : (
          <span key={i}>{cleanTranslation(p)}</span>
        ),
      )}
    </>
  );
}
