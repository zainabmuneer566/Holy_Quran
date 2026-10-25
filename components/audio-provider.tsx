"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export interface Track { url: string; label: string }
export type RepeatMode = "off" | "ayah" | "surah";

interface AudioCtx {
  current: Track | null;
  playing: boolean;
  time: number;
  duration: number;
  rate: number;
  volume: number;
  repeat: RepeatMode;
  error: string | null;
  hasPrev: boolean;
  hasNext: boolean;
  registerPage: (tracks: Track[]) => void;
  playUrl: (url: string) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  setRate: (r: number) => void;
  setVolume: (v: number) => void;
  setRepeat: (m: RepeatMode) => void;
  stop: () => void;
}

const Ctx = createContext<AudioCtx | null>(null);
export function useAudio(): AudioCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAudio must be used inside AudioProvider");
  return c;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const el = useRef<HTMLAudioElement>(null);
  const pageTracks = useRef<Track[]>([]);
  const [queue, setQueue] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRateState] = useState(1);
  const [volume, setVolumeState] = useState(1);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [error, setError] = useState<string | null>(null);

  const current = queue[index] ?? null;

  useEffect(() => {
    try {
      const r = Number(localStorage.getItem("noor:rate"));
      if (r >= 0.5 && r <= 2) setRateState(r);
      const v = localStorage.getItem("noor:volume");
      if (v !== null && Number(v) >= 0 && Number(v) <= 1) setVolumeState(Number(v));
      const m = localStorage.getItem("noor:repeat") as RepeatMode | null;
      if (m === "off" || m === "ayah" || m === "surah") setRepeat(m);
    } catch {}
  }, []);

  useEffect(() => {
    const a = el.current;
    if (!a) return;
    a.playbackRate = rate;
    a.volume = volume;
    try {
      localStorage.setItem("noor:rate", String(rate));
      localStorage.setItem("noor:volume", String(volume));
      localStorage.setItem("noor:repeat", repeat);
    } catch {}
  }, [rate, volume, repeat]);

  useEffect(() => {
    const a = el.current;
    if (!a || !current) return;
    setError(null);
    setTime(0);
    a.src = current.url;
    a.playbackRate = rate;
    a.play().catch(() => setError("Could not play this recitation. Check your connection and try again."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.url]);

  const registerPage = useCallback((tracks: Track[]) => { pageTracks.current = tracks; }, []);

  const playUrl = useCallback((url: string) => {
    const i = pageTracks.current.findIndex((t) => t.url === url);
    if (i < 0) return;
    setQueue(pageTracks.current);
    setIndex(i);
    const a = el.current;
    if (a && a.src && a.src === url) { a.currentTime = 0; a.play().catch(() => {}); }
  }, []);

  const toggle = useCallback(() => {
    const a = el.current;
    if (!a || !a.src) return;
    if (a.paused) a.play().catch(() => setError("Could not resume playback.")); else a.pause();
  }, []);

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, queue.length - 1)), [queue.length]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);
  const seek = useCallback((t: number) => { if (el.current) el.current.currentTime = t; }, []);
  const stop = useCallback(() => {
    el.current?.pause();
    setQueue([]);
    setIndex(0);
    setPlaying(false);
  }, []);

  function onEnded() {
    const a = el.current;
    if (!a) return;
    if (repeat === "ayah") { a.currentTime = 0; a.play().catch(() => {}); return; }
    if (index < queue.length - 1) setIndex(index + 1);
    else if (repeat === "surah" && queue.length > 0) {
      if (index === 0) { a.currentTime = 0; a.play().catch(() => {}); } else setIndex(0);
    } else setPlaying(false);
  }

  useEffect(() => {
    if (!current || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: current.label, artist: "Noor" });
    navigator.mediaSession.setActionHandler("play", toggle);
    navigator.mediaSession.setActionHandler("pause", toggle);
    navigator.mediaSession.setActionHandler("previoustrack", prev);
    navigator.mediaSession.setActionHandler("nexttrack", next);
  }, [current, toggle, prev, next]);

  const value = useMemo<AudioCtx>(() => ({
    current, playing, time, duration, rate, volume, repeat, error,
    hasPrev: index > 0, hasNext: index < queue.length - 1,
    registerPage, playUrl, toggle, next, prev, seek, setRate: setRateState, setVolume: setVolumeState, setRepeat, stop,
  }), [current, playing, time, duration, rate, volume, repeat, error, index, queue.length, registerPage, playUrl, toggle, next, prev, seek, stop]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <audio
        ref={el}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={onEnded}
        onError={() => current && setError("This recitation could not be loaded.")}
      />
    </Ctx.Provider>
  );
}
