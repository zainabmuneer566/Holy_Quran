"use client";
import { useState } from "react";
import type { TajweedSegment } from "@/lib/quran/text";

// Colours are display choices; the rule for each segment comes only from the provider's annotations.
const RULES: Record<string, { label: string; color: string }> = {
  ham_wasl: { label: "Hamzat al-wasl (connecting alif)", color: "#8a8f98" },
  slnt: { label: "Silent letter", color: "#8a8f98" },
  laam_shamsiyah: { label: "Lam shamsiyah (silent lam)", color: "#8a8f98" },
  madda_normal: { label: "Madd, natural (2 counts)", color: "#e08a1e" },
  madda_permissible: { label: "Madd, permissible length", color: "#d9731a" },
  madda_necessary: { label: "Madd, necessary", color: "#c03030" },
  madda_obligatory: { label: "Madd, obligatory", color: "#b02a8a" },
  qalaqah: { label: "Qalqalah (echoing sound)", color: "#2f7fd1" },
  ikhfa: { label: "Ikhfa (hiding)", color: "#c2547d" },
  ikhfa_shafawi: { label: "Ikhfa shafawi", color: "#c2547d" },
  iqlab: { label: "Iqlab", color: "#2aa3b3" },
  idgham_ghunnah: { label: "Idgham with ghunnah", color: "#2a9d5f" },
  idgham_wo_ghunnah: { label: "Idgham without ghunnah", color: "#5aa02a" },
  idgham_shafawi: { label: "Idgham shafawi", color: "#2a9d5f" },
  idgham_mutajanisayn: { label: "Idgham mutajanisayn", color: "#5aa02a" },
  idgham_mutaqaribayn: { label: "Idgham mutaqaribayn", color: "#5aa02a" },
  ghunnah: { label: "Ghunnah (nasal sound)", color: "#d6652a" },
};

export interface TajweedVerse { key: string; segments: TajweedSegment[] }

export function TajweedText({ verses }: { verses: TajweedVerse[] }) {
  const [colors, setColors] = useState(true);
  const used = new Set(verses.flatMap((v) => v.segments.map((s) => s.rule).filter((r): r is string => !!r && r in RULES)));
  return (
    <div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={colors} onChange={(e) => setColors(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
        Show Tajweed colours
      </label>
      {colors && used.size > 0 && (
        <ul aria-label="Colour legend" className="mt-3 grid gap-1 text-xs sm:grid-cols-2">
          {[...used].map((r) => (
            <li key={r} className="flex items-center gap-2">
              <span aria-hidden className="inline-block h-3 w-3 rounded-full" style={{ background: RULES[r].color }} />
              {RULES[r].label}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 divide-y divide-line">
        {verses.map((v) => (
          <div key={v.key} className="py-3">
            <span className="rounded-full border border-gold px-2 py-0.5 text-xs text-gold">{v.key}</span>
            <p lang="ar" dir="rtl" className="arabic-text mt-1">
              {v.segments.map((s, i) => (
                <span key={i} style={colors && s.rule && RULES[s.rule] ? { color: RULES[s.rule].color } : undefined}>{s.text}</span>
              ))}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
