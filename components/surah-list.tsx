"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export interface SurahItem {
  id: number;
  nameSimple: string;
  nameArabic: string;
  meaning: string;
  place: string;
  verses: number;
}

export function SurahList({ items }: { items: SurahItem[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (i) =>
        String(i.id) === s ||
        i.nameSimple.toLowerCase().includes(s) ||
        i.meaning.toLowerCase().includes(s) ||
        i.nameArabic.includes(q.trim()),
    );
  }, [items, q]);

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Filter surahs</span>
        <Search aria-hidden className="absolute left-3 top-3 h-4 w-4 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by name or number"
          className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3"
        />
      </label>
      <p className="mt-3 text-sm text-muted" aria-live="polite">{filtered.length} of {items.length} surahs</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {filtered.map((s) => (
          <li key={s.id}>
            <Link
              href={`/quran/${s.id}`}
              className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm transition hover:border-accent"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold text-sm text-gold">
                {s.id}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{s.nameSimple}</span>
                <span className="block truncate text-xs text-muted">
                  {s.meaning} · {s.place} · {s.verses} ayahs
                </span>
              </span>
              <span lang="ar" dir="rtl" className="font-arabic text-2xl">{s.nameArabic}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
