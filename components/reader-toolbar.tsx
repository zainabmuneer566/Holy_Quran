"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

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

const SIZE_KEY = "noor:arabic-size-v2";

export function ReaderToolbar({ versesCount, options, selected, reciters, reciterId, wordMode }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false); // phones only; always visible from sm up
  const [size, setSize] = useState(28);
  const [jump, setJump] = useState("");

  // Start from the responsive CSS default; only a size the reader chose themselves is stored and applied.
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(SIZE_KEY));
      if (saved >= 20 && saved <= 56) {
        setSize(saved);
        document.documentElement.style.setProperty("--arabic-size", `${saved}px`);
        return;
      }
    } catch {}
    const base = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--arabic-size"));
    if (base) setSize(base);
  }, []);

  function changeSize(v: number) {
    setSize(v);
    document.documentElement.style.setProperty("--arabic-size", `${v}px`);
    try { localStorage.setItem(SIZE_KEY, String(v)); } catch {}
  }

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
  const label = "flex min-w-0 flex-col text-xs text-muted";
  const field = "mt-1 w-full min-w-0 rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink";

  const translationSelect = (index: 0 | 1, text: string) => (
    <label className={label}>
      {text}
      <select
        value={String(selected[index] ?? "none")}
        onChange={(e) => setTranslations(
          index === 0 ? e.target.value : String(selected[0] ?? "none"),
          index === 1 ? e.target.value : String(selected[1] ?? "none"),
        )}
        className={field}
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
    <div className="border-b border-line bg-bg">
      <div className="mx-auto max-w-3xl px-4 py-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="reader-options"
          className="flex w-full items-center justify-between rounded-md border border-line bg-surface px-3 py-2 text-sm sm:hidden"
        >
          Reading options
          <ChevronDown aria-hidden className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        <div id="reader-options" className={`${open ? "grid" : "hidden"} mt-2 grid-cols-2 gap-x-3 gap-y-2 sm:mt-0 sm:grid sm:grid-cols-3 lg:grid-cols-4`}>
          {translationSelect(0, "Translation")}
          {translationSelect(1, "Second translation")}
          {reciters.length > 0 && (
            <label className={`${label} col-span-2 sm:col-span-1`}>
              Reciter
              <select value={reciterId ?? ""} onChange={(e) => update({ r: e.target.value })} className={field}>
                {reciters.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </label>
          )}
          <label className="flex items-center gap-2 self-end pb-1.5 text-sm">
            <input type="checkbox" checked={wordMode} onChange={(e) => update({ w: e.target.checked ? "1" : null })} className="h-4 w-4 accent-[var(--accent)]" />
            Word by word
          </label>
          <label className={label}>
            Arabic size
            <input type="range" min={20} max={56} value={size} onChange={(e) => changeSize(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" />
          </label>
          <form onSubmit={go} className="flex items-end gap-2">
            <label className={`${label} flex-1`}>
              Go to ayah
              <input inputMode="numeric" value={jump} onChange={(e) => setJump(e.target.value)} placeholder={`1–${versesCount}`} className={field} />
            </label>
            <button className="rounded-md bg-accent px-3 py-1.5 text-sm text-bg">Go</button>
          </form>
        </div>
      </div>
    </div>
  );
}
