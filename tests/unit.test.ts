import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNext } from "../lib/utils/safe-redirect.ts";
import { currentStreak, dailyVerseKey, formatDates } from "../lib/utils/daily.ts";
import { rateLimited } from "../lib/utils/rate-limit.ts";
import { cleanTranslation, parseTajweed, tafsirToParagraphs } from "../lib/quran/text.ts";
import { resolveAudioUrl } from "../lib/quran/audio.ts";

test("safeNext allows only same-site paths", () => {
  assert.equal(safeNext("/bookmarks"), "/bookmarks");
  assert.equal(safeNext("/quran/2#ayah-5"), "/quran/2#ayah-5");
  for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "evil", "/a\nb", "", null, undefined]) {
    assert.equal(safeNext(bad as string | null | undefined), "/", String(bad));
  }
});

test("dailyVerseKey walks the ayahs in order and repeats", () => {
  const counts = [7, 286, 200];
  assert.equal(dailyVerseKey(counts, new Date("1970-01-01T12:00:00Z")), "1:1");
  assert.equal(dailyVerseKey(counts, new Date("1970-01-02T00:00:00Z")), "1:2");
  assert.equal(dailyVerseKey(counts, new Date("1970-01-08T00:00:00Z")), "2:1");
  assert.equal(dailyVerseKey(counts, new Date("1970-01-01T23:59:59Z")), "1:1");
  const total = 7 + 286 + 200;
  assert.equal(dailyVerseKey(counts, new Date(Date.UTC(1970, 0, 1 + total))), "1:1");
  for (let d = 0; d < 600; d++) {
    const [s, a] = dailyVerseKey(counts, new Date(Date.UTC(2026, 0, 1 + d))).split(":").map(Number);
    assert.ok(s >= 1 && s <= 3 && a >= 1 && a <= counts[s - 1]);
  }
});

test("currentStreak counts consecutive read days", () => {
  const today = new Date("2026-10-31T10:00:00Z");
  assert.equal(currentStreak([], today), 0);
  assert.equal(currentStreak(["2026-10-31", "2026-10-30", "2026-10-29"], today), 3);
  assert.equal(currentStreak(["2026-10-30", "2026-10-29"], today), 2); // today not read yet
  assert.equal(currentStreak(["2026-10-31", "2026-10-29"], today), 1); // gap breaks it
  assert.equal(currentStreak(["2026-10-28"], today), 0);
});

test("formatDates returns Gregorian and a Hijri date", () => {
  const d = formatDates(new Date("2026-10-31T00:00:00Z"));
  assert.match(d.gregorian, /2026/);
  assert.match(d.hijri, /AH/);
});

test("cleanTranslation removes footnotes and tags and decodes entities once", () => {
  assert.equal(cleanTranslation("Praise<sup foot_note=1>1</sup> be to <b>God</b>"), "Praise be to God");
  assert.equal(cleanTranslation("a &amp; b"), "a & b");
  assert.equal(cleanTranslation("&amp;lt;"), "&lt;");
});

test("tafsirToParagraphs never keeps markup and splits paragraphs", () => {
  const html = '<p>First &amp; second</p><p>Third<br/>fourth</p><script>alert(1)</script><img src=x onerror="alert(1)"><style>p{}</style><b onclick="x()">bold</b>';
  const out = tafsirToParagraphs(html);
  assert.deepEqual(out, ["First & second", "Third", "fourth", "bold"]);
  assert.ok(!out.join("").includes("<"));
  assert.ok(!out.join("").includes("alert"));
  assert.deepEqual(tafsirToParagraphs(""), []);
});

test("parseTajweed uses only the provider's annotations", () => {
  const segs = parseTajweed("a<tajweed class=ghunnah>bc</tajweed>d<tajweed class=qalaqah>e</tajweed><span class=end>1</span>");
  assert.deepEqual(segs, [
    { text: "a", rule: null }, { text: "bc", rule: "ghunnah" }, { text: "d", rule: null },
    { text: "e", rule: "qalaqah" }, { text: "1", rule: null },
  ]);
  assert.deepEqual(parseTajweed("plain"), [{ text: "plain", rule: null }]);
});

test("resolveAudioUrl handles relative and absolute provider paths", () => {
  assert.equal(resolveAudioUrl("https://x.test/a.mp3", "verse"), "https://x.test/a.mp3");
  assert.equal(resolveAudioUrl("//x.test/a.mp3", "verse"), "https://x.test/a.mp3");
  assert.equal(resolveAudioUrl("Alafasy/mp3/001001.mp3", "verse"), "https://verses.quran.com/Alafasy/mp3/001001.mp3");
  assert.equal(resolveAudioUrl("/wbw/001_001_001.mp3", "word"), "https://audio.qurancdn.com/wbw/001_001_001.mp3");
});

test("rateLimited blocks after the limit within the window", () => {
  const key = `t:${Math.random()}`;
  for (let i = 0; i < 3; i++) assert.equal(rateLimited(key, 3, 60_000), false);
  assert.equal(rateLimited(key, 3, 60_000), true);
  assert.equal(rateLimited(`${key}:other`, 3, 60_000), false);
});
