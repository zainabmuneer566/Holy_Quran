"use client";
import { Pause, Play, Repeat, Repeat1, SkipBack, SkipForward, Volume2, X } from "lucide-react";
import { useAudio, type RepeatMode } from "./audio-provider";

const fmt = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");
const nextMode: Record<RepeatMode, RepeatMode> = { off: "ayah", ayah: "surah", surah: "off" };
const modeLabel: Record<RepeatMode, string> = { off: "Repeat off", ayah: "Repeat ayah", surah: "Repeat surah" };

export function MiniPlayer() {
  const a = useAudio();
  if (!a.current) return null;
  const btn = "rounded-full p-2 hover:bg-line disabled:opacity-40";
  return (
    <div role="region" aria-label="Audio player" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface shadow-lg">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
        <div className="min-w-0 flex-1 basis-40">
          <p className="truncate text-sm font-medium">{a.current.label}</p>
          {a.error && <p role="alert" className="text-xs text-red-600">{a.error}</p>}
        </div>
        <div className="flex items-center">
          <button className={btn} onClick={a.prev} disabled={!a.hasPrev} aria-label="Previous ayah"><SkipBack className="h-4 w-4" /></button>
          <button className={`${btn} bg-accent text-bg hover:bg-accent`} onClick={a.toggle} aria-label={a.playing ? "Pause" : "Play"}>
            {a.playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button className={btn} onClick={a.next} disabled={!a.hasNext} aria-label="Next ayah"><SkipForward className="h-4 w-4" /></button>
          <button className={btn} onClick={() => a.setRepeat(nextMode[a.repeat])} aria-label={modeLabel[a.repeat]} title={modeLabel[a.repeat]}>
            {a.repeat === "ayah" ? <Repeat1 className="h-4 w-4 text-accent" /> : <Repeat className={`h-4 w-4 ${a.repeat === "surah" ? "text-accent" : ""}`} />}
          </button>
        </div>
        <div className="flex basis-full items-center gap-2 text-xs text-muted sm:basis-auto sm:flex-1">
          <span className="w-9 text-right tabular-nums">{fmt(a.time)}</span>
          <input type="range" aria-label="Seek" min={0} max={a.duration || 0} step={0.1} value={Math.min(a.time, a.duration || 0)}
            onChange={(e) => a.seek(Number(e.target.value))} className="min-w-0 flex-1 accent-[var(--accent)]" />
          <span className="w-9 tabular-nums">{fmt(a.duration)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <select aria-label="Playback speed" value={a.rate} onChange={(e) => a.setRate(Number(e.target.value))} className="rounded border border-line bg-surface px-1 py-1">
            {[0.75, 1, 1.25, 1.5].map((r) => <option key={r} value={r}>{r}×</option>)}
          </select>
          <Volume2 aria-hidden className="h-4 w-4 text-muted" />
          <input type="range" aria-label="Volume" min={0} max={1} step={0.05} value={a.volume} onChange={(e) => a.setVolume(Number(e.target.value))} className="w-16 accent-[var(--accent)]" />
          <button className={btn} onClick={a.stop} aria-label="Close player"><X className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
