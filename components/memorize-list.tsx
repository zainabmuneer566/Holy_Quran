"use client";
import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { setMemorization } from "@/app/actions/personal";
import { ChapterAudio, PlayAyahButton } from "./ayah-audio";
import type { MemoStatus } from "@/lib/db-types";

export interface MemoVerse { n: number; arabic: string; audioUrl: string | null; status: MemoStatus | null }

export function MemorizeList({ surah, surahName, verses, signedIn }: { surah: number; surahName: string; verses: MemoVerse[]; signedIn: boolean }) {
  const [hideAll, setHideAll] = useState(true);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<Record<number, MemoStatus | null>>(() => Object.fromEntries(verses.map((v) => [v.n, v.status])));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const tracks = verses.flatMap((v) => (v.audioUrl ? [{ url: v.audioUrl, label: `${surahName} · ayah ${v.n}` }] : []));

  function change(n: number, value: string) {
    const next = value === "none" ? null : (value as MemoStatus);
    const prev = status[n] ?? null;
    setStatus((s) => ({ ...s, [n]: next }));
    setMessage(null);
    start(async () => {
      const r = await setMemorization(surah, n, next ?? "none");
      if (!r.ok) { setStatus((s) => ({ ...s, [n]: prev })); setMessage(r.error); }
    });
  }

  return (
    <div>
      <ChapterAudio tracks={tracks} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => { setHideAll((h) => !h); setRevealed(new Set()); }}
          className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm hover:border-accent">
          {hideAll ? "Show all text" : "Hide all text"}
        </button>
        <p className="text-xs text-muted">Use the player's repeat button to loop one ayah or the whole range.</p>
      </div>
      {!signedIn && <p className="mb-3 text-xs text-muted">You can practise without an account. Sign in to save your progress.</p>}
      {message && <p role="alert" className="mb-3 text-sm text-danger">{message}</p>}
      <ul className="divide-y divide-line">
        {verses.map((v) => {
          const shown = !hideAll || revealed.has(v.n);
          return (
            <li key={v.n} className="py-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="rounded-full border border-gold px-2 py-0.5 text-gold">{surah}:{v.n}</span>
                {v.audioUrl ? <PlayAyahButton url={v.audioUrl} label={`ayah ${v.n}`} /> : <span>Audio unavailable</span>}
                {hideAll && (
                  <button type="button" aria-label={shown ? `Hide ayah ${v.n}` : `Reveal ayah ${v.n}`}
                    onClick={() => setRevealed((r) => { const n = new Set(r); if (n.has(v.n)) n.delete(v.n); else n.add(v.n); return n; })}
                    className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 hover:border-accent">
                    {shown ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />} {shown ? "Hide" : "Reveal"}
                  </button>
                )}
                <label className="ml-auto flex items-center gap-1">
                  <span className="sr-only">Status for ayah {v.n}</span>
                  <select value={status[v.n] ?? "none"} disabled={!signedIn || pending} onChange={(e) => change(v.n, e.target.value)}
                    className="rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink">
                    <option value="none">Not tracked</option>
                    <option value="learning">Learning</option>
                    <option value="memorized">Memorized</option>
                    <option value="revision">Needs revision</option>
                  </select>
                </label>
              </div>
              {shown ? (
                <p lang="ar" dir="rtl" className="arabic-text mt-1">{v.arabic}</p>
              ) : (
                <p className="mt-2 rounded-md border border-dashed border-line px-3 py-4 text-center text-sm text-muted">Text hidden. Recite from memory, then reveal to check.</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
