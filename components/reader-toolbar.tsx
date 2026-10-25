"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export interface TranslationOption { id: number; label: string; language: string }
export interface ReciterOption { id: number; label: string }

interface Props {
  versesCount: number;
  options: TranslationOption[];
  selected: number[];
  reciters: ReciterOption[];
  reciterId: number | null;
  wordMode: boolean;
}

export function ReaderToolbar({ versesCount, options, selected, reciters, reciterId, wordMode }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [size, setSize] = useState(34);
  const [jump, setJump] = useState("");

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem("noor:arabic-size"));
      if (saved >= 24 && saved <= 60) setSize(saved);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.style.setProperty("--arabic-size", `${size}px`);
    try { localStorage.setItem("noor:arabic-size", String(size)); } catch {}
  }, [size]);

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k); else next.set(k, v);
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function setTranslations(first: string, second: string) {
    const ids = Array.from(new Set([first, second].filter((v) => v && v !== "none")));
    update({ t: ids.length ? ids.join(",") : "none" });
  }

  function go(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(jump);
    if (Number.isInteger(n) && n >= 1 && n <= versesCount) location.hash = `ayah-${n}`;
  }

  const groups = ["english", "urdu"].map((lang) => ({ lang, items: options.filter((o) => o.language === lang) }));
  const sel = "mt-1 max-w-[14rem] rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink";
  const translationSelect = (index: 0 | 1, label: string) => (
    <label className="flex flex-col text-xs text-muted">
      {label}
      <select
        value={String(selected[index] ?? "none")}
        onChange={(e) => setTranslations(
          index === 0 ? e.target.value : String(selected[0] ?? "none"),
          index === 1 ? e.target.value : String(selected[1] ?? "none"),
        )}
        className={sel}
      >
        <option value="none">None</option>
        {groups.map((g) => (
          <optgroup key={g.lang} label={g.lang[0].toUpperCase() + g.lang.slice(1)}>
            {g.items.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </optgroup>
        ))}
      </select>
    </label>
  );

  return (
    <div className="sticky top-14 z-20 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-end gap-4 px-4 py-3">
        {translationSelect(0, "Translation")}
        {translationSelect(1, "Second translation")}
        {reciters.length > 0 && (
          <label className="flex flex-col text-xs text-muted">
            Reciter
            <select value={reciterId ?? ""} onChange={(e) => update({ r: e.target.value })} className={sel}>
              {reciters.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </label>
        )}
        <label className="flex items-center gap-2 pb-1.5 text-sm">
          <input type="checkbox" checked={wordMode} onChange={(e) => update({ w: e.target.checked ? "1" : null })} className="h-4 w-4 accent-[var(--accent)]" />
          Word by word
        </label>
        <label className="flex flex-col text-xs text-muted">
          Arabic size
          <input type="range" min={24} max={60} value={size} onChange={(e) => setSize(Number(e.target.value))} className="mt-2 w-28 accent-[var(--accent)]" />
        </label>
        <form onSubmit={go} className="flex items-end gap-2">
          <label className="flex flex-col text-xs text-muted">
            Go to ayah
            <input inputMode="numeric" value={jump} onChange={(e) => setJump(e.target.value)} placeholder={`1–${versesCount}`}
              className="mt-1 w-20 rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink" />
          </label>
          <button className="rounded-md bg-accent px-3 py-1.5 text-sm text-bg">Go</button>
        </form>
      </div>
    </div>
  );
}
