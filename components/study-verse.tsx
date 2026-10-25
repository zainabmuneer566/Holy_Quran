"use client";
import { useState } from "react";
import { Volume2 } from "lucide-react";
import type { Word } from "@/lib/quran/types";
import { resolveAudioUrl } from "@/lib/quran/audio";

export function StudyVerse({ words, verseKey }: { words: Word[]; verseKey: string }) {
  const [sel, setSel] = useState<number | null>(null);
  const [audioError, setAudioError] = useState(false);
  const word = words.find((w) => w.id === sel) ?? null;

  function playWord(w: Word) {
    if (!w.audio_url) return;
    setAudioError(false);
    new Audio(resolveAudioUrl(w.audio_url, "word")).play().catch(() => setAudioError(true));
  }

  return (
    <div>
      <p lang="ar" dir="rtl" className="arabic-text">
        {words.map((w) =>
          w.char_type_name === "word" ? (
            <button
              key={w.id}
              onClick={() => { setSel(w.id === sel ? null : w.id); setAudioError(false); }}
              aria-pressed={w.id === sel}
              className={`mx-0.5 rounded-md px-1 hover:bg-line ${w.id === sel ? "bg-line text-accent" : ""}`}
            >
              {w.text_uthmani}
            </button>
          ) : (
            <span key={w.id} className="mx-0.5">{w.text_uthmani}</span>
          ),
        )}
      </p>
      {word && (
        <div role="region" aria-label="Word details" className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-line bg-surface p-4">
          <span lang="ar" dir="rtl" className="font-arabic text-3xl">{word.text_uthmani}</span>
          <div className="min-w-0 flex-1 text-sm">
            {word.transliteration?.text && <p className="italic text-muted">{word.transliteration.text}</p>}
            <p>{word.translation?.text || <span className="text-muted">No word translation available.</span>}</p>
            <p className="text-xs text-muted">{verseKey} · word {word.position}</p>
          </div>
          {word.audio_url ? (
            <button onClick={() => playWord(word)} className="flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-sm hover:border-accent">
              <Volume2 aria-hidden className="h-4 w-4" /> Play word
            </button>
          ) : (
            <span className="text-xs text-muted">Word audio unavailable</span>
          )}
          {audioError && <span role="alert" className="text-xs text-red-600">Could not play word audio.</span>}
        </div>
      )}
    </div>
  );
}
