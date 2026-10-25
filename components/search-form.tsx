"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

const KEY = "noor:recent-searches";

export function SearchForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(raw)) setRecent(raw.filter((x): x is string => typeof x === "string").slice(0, 6));
    } catch {}
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 6);
    setRecent(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <div>
      <form onSubmit={submit} role="search" className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Search the Quran</span>
          <Search aria-hidden className="absolute left-3 top-3 h-4 w-4 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Word, phrase, surah name, or reference like 2:255"
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3" />
        </label>
        <button className="rounded-xl bg-accent px-5 text-bg">Search</button>
      </form>
      {recent.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Recent:</span>
          {recent.map((r) => (
            <Link key={r} href={`/search?q=${encodeURIComponent(r)}`} className="rounded-full border border-line px-3 py-0.5 hover:border-accent">{r}</Link>
          ))}
        </p>
      )}
    </div>
  );
}
