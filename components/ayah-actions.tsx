"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BookOpen, Bookmark, Check, Share2, StickyNote } from "lucide-react";
import { saveNote, toggleBookmark, toggleRead } from "@/app/actions/personal";

interface Props {
  surah: number;
  ayah: number;
  signedIn: boolean;
  bookmarked: boolean;
  note: string;
  readToday: boolean;
  arabic: string;
  translation: string | null;
  translationSource: string | null;
}

const icon = "h-4 w-4";
const base = "inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs hover:border-accent";

export function AyahActions(p: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [bookmarked, setBookmarked] = useState(p.bookmarked);
  const [read, setRead] = useState(p.readToday);
  const [note, setNote] = useState(p.note);
  const [draft, setDraft] = useState(p.note);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const requireSignIn = () => {
    router.push(`/login?next=${encodeURIComponent(`${location.pathname}${location.search}#ayah-${p.ayah}`)}`);
  };

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, onOk: () => void) {
    if (!p.signedIn) return requireSignIn();
    setStatus(null);
    start(async () => {
      const r = await fn();
      if (r.ok) onOk(); else setStatus(r.error ?? "Could not save.");
    });
  }

  async function share() {
    const url = `${location.origin}/reader/${p.surah}/${p.ayah}`;
    const parts = [p.arabic, p.translation, `Quran ${p.surah}:${p.ayah}`, p.translationSource ? `Translation: ${p.translationSource}` : null, url];
    const text = parts.filter(Boolean).join("\n\n");
    try {
      if (navigator.share) await navigator.share({ title: `Quran ${p.surah}:${p.ayah}`, text, url });
      else { await navigator.clipboard.writeText(text); setStatus("Copied to clipboard."); }
    } catch { /* cancelled */ }
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-1.5">
        <button type="button" aria-pressed={bookmarked} disabled={pending} className={`${base} ${bookmarked ? "border-accent text-accent" : ""}`}
          onClick={() => run(() => toggleBookmark(p.surah, p.ayah), () => setBookmarked((b) => !b))}>
          <Bookmark className={icon} aria-hidden fill={bookmarked ? "currentColor" : "none"} /> {bookmarked ? "Saved" : "Bookmark"}
        </button>
        <button type="button" aria-expanded={open} className={`${base} ${note ? "border-accent text-accent" : ""}`}
          onClick={() => (p.signedIn ? setOpen((o) => !o) : requireSignIn())}>
          <StickyNote className={icon} aria-hidden /> {note ? "Edit note" : "Note"}
        </button>
        <button type="button" aria-pressed={read} disabled={pending} className={`${base} ${read ? "border-accent text-accent" : ""}`}
          onClick={() => run(() => toggleRead(p.surah, p.ayah), () => setRead((r) => !r))}>
          <Check className={icon} aria-hidden /> {read ? "Read today" : "Mark read"}
        </button>
        <Link href={`/tafsir/${p.surah}/${p.ayah}`} className={base}><BookOpen className={icon} aria-hidden /> Tafsir</Link>
        <button type="button" className={base} onClick={share}><Share2 className={icon} aria-hidden /> Share</button>
      </div>

      {open && (
        <div className="mt-2 rounded-xl border border-line bg-surface p-3">
          <label className="block text-xs text-muted">
            Your private note
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={5000} rows={3}
              className="mt-1 w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm text-ink" />
          </label>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={pending} className="rounded-md bg-accent px-3 py-1.5 text-xs text-bg"
              onClick={() => run(() => saveNote(p.surah, p.ayah, draft), () => { setNote(draft.trim()); setStatus(draft.trim() ? "Note saved." : "Note deleted."); })}>
              Save
            </button>
            {note && (
              <button type="button" disabled={pending} className="rounded-md border border-line px-3 py-1.5 text-xs"
                onClick={() => run(() => saveNote(p.surah, p.ayah, ""), () => { setNote(""); setDraft(""); setOpen(false); })}>
                Delete note
              </button>
            )}
          </div>
        </div>
      )}
      {status && <p role="status" className="mt-1 text-xs text-muted">{status}</p>}
    </div>
  );
}
