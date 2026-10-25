"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export interface LastRead { surah: number; name: string }

export function ContinueReading() {
  const [last, setLast] = useState<LastRead | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("noor:last");
      if (raw) setLast(JSON.parse(raw) as LastRead);
    } catch {}
  }, []);
  if (!last) return null;
  return (
    <Link href={`/quran/${last.surah}`} className="inline-block rounded-xl border border-line bg-surface px-4 py-2.5 text-sm hover:border-accent">
      Continue reading: <strong>{last.name}</strong>
    </Link>
  );
}

export function ReadingTracker({ surah, name }: LastRead) {
  useEffect(() => {
    try {
      localStorage.setItem("noor:last", JSON.stringify({ surah, name }));
    } catch {}
  }, [surah, name]);
  return null;
}
