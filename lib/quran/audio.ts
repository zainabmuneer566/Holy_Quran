const VERSE_AUDIO_BASE = "https://verses.quran.com/";
const WORD_AUDIO_BASE = "https://audio.qurancdn.com/";

/** The provider returns either absolute URLs or paths relative to its audio host. */
export function resolveAudioUrl(url: string, kind: "verse" | "word"): string {
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return (kind === "verse" ? VERSE_AUDIO_BASE : WORD_AUDIO_BASE) + url.replace(/^\/+/, "");
}
