/**
 * Cleans HTML from *translation* text only (footnote markers, tags).
 * Never apply this to Arabic Quran text.
 */
export function cleanTranslation(html: string): string {
  return html
    .replace(/<sup[^>]*>.*?<\/sup>/gis, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}
