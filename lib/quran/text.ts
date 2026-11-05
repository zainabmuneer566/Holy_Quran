function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&"); // last, so "&amp;lt;" stays "&lt;"
}

/**
 * Cleans HTML from *translation* text only (footnote markers, tags).
 * Never apply this to Arabic Quran text.
 */
export function cleanTranslation(html: string): string {
  return decodeEntities(html.replace(/<sup[^>]*>.*?<\/sup>/gis, "").replace(/<[^>]+>/g, "")).trim();
}

/**
 * Turns provider tafsir HTML into plain paragraphs. Nothing is rendered as HTML,
 * so markup in the source can never execute; headings and lists become plain lines.
 */
export function tafsirToParagraphs(html: string): string[] {
  const text = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "\n")
    .replace(/<[^>]*>/g, "");
  return decodeEntities(text)
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export interface TajweedSegment {
  text: string;
  rule: string | null;
}

/**
 * Splits the provider's annotated Tajweed text into plain segments.
 * Rules come only from the provider's own markup; nothing is inferred here.
 */
export function parseTajweed(html: string): TajweedSegment[] {
  const out: TajweedSegment[] = [];
  const re = /<tajweed\s+class=["']?([a-z_]+)["']?\s*>([\s\S]*?)<\/tajweed>/gi;
  const strip = (s: string) => s.replace(/<[^>]*>/g, "");
  let last = 0;
  for (const m of html.matchAll(re)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ text: strip(html.slice(last, start)), rule: null });
    out.push({ text: strip(m[2]), rule: m[1] });
    last = start + m[0].length;
  }
  if (last < html.length) out.push({ text: strip(html.slice(last)), rule: null });
  return out.filter((s) => s.text.length > 0);
}
