"use client";
import { useEffect } from "react";
import { Pause, Play } from "lucide-react";
import { useAudio, type Track } from "./audio-provider";

export function ChapterAudio({ tracks }: { tracks: Track[] }) {
  const { registerPage } = useAudio();
  useEffect(() => { registerPage(tracks); }, [tracks, registerPage]);
  return null;
}

export function PlayAyahButton({ url, label }: { url: string; label: string }) {
  const a = useAudio();
  const active = a.current?.url === url;
  const isPlaying = active && a.playing;
  return (
    <button
      onClick={() => (active ? a.toggle() : a.playUrl(url))}
      aria-label={isPlaying ? `Pause ${label}` : `Play ${label}`}
      className="rounded-full border border-line p-1.5 text-accent hover:border-accent"
    >
      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
    </button>
  );
}
