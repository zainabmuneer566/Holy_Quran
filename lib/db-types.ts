export interface Preferences {
  translation_ids: number[];
  reciter_id: number | null;
  arabic_size: number | null;
  theme: "system" | "light" | "dark" | "sepia" | null;
  show_streak: boolean;
  keep_history: boolean;
}
export interface Bookmark { id: string; collection_id: string | null; surah: number; ayah: number; created_at: string }
export interface Collection { id: string; name: string }
export interface Note { id: string; surah: number; ayah: number; body: string; updated_at: string }
export interface Goals { daily_ayahs: number; weekly_ayahs: number | null; daily_memorization: number }
export interface Reminders { daily_reading_enabled: boolean; daily_ayah_enabled: boolean; reminder_time: string | null; timezone: string | null }
export type MemoStatus = "learning" | "memorized" | "revision";
export interface Memo { surah: number; ayah: number; status: MemoStatus; next_review_on: string | null }
export interface Session { id: string; surah: number; opened_at: string }
