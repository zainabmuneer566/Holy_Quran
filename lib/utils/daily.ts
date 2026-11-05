/** Picks the daily ayah: walks through all ayahs in order, one per UTC day, then repeats. */
export function dailyVerseKey(versesPerSurah: number[], date: Date): string {
  const total = versesPerSurah.reduce((a, b) => a + b, 0);
  if (total <= 0) throw new Error("No verses");
  const day = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000);
  let index = ((day % total) + total) % total;
  for (let s = 0; s < versesPerSurah.length; s++) {
    if (index < versesPerSurah[s]) return `${s + 1}:${index + 1}`;
    index -= versesPerSurah[s];
  }
  throw new Error("unreachable");
}

/** Calendar dates are calculated (Umm al-Qura), so they can differ from local moon sighting by a day. */
export function formatDates(date: Date): { gregorian: string; hijri: string } {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" };
  return {
    gregorian: new Intl.DateTimeFormat("en-GB", opts).format(date),
    hijri: new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", opts).format(date),
  };
}

export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Consecutive days with at least one read, ending today (or yesterday if today has none yet). */
export function currentStreak(readDays: string[], today: Date): number {
  const set = new Set(readDays);
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (!set.has(isoDay(d))) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0;
  while (set.has(isoDay(d))) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}
