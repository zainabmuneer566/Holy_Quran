import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isoDay } from "@/lib/utils/daily";

export interface SurahPersonal {
  bookmarked: Set<number>;
  notes: Map<number, string>;
  readToday: Set<number>;
}

export async function getSurahPersonal(surah: number): Promise<SurahPersonal> {
  const supabase = await createClient();
  const [b, n, r] = await Promise.all([
    supabase.from("bookmarks").select("ayah").eq("surah", surah),
    supabase.from("personal_notes").select("ayah, body").eq("surah", surah),
    supabase.from("reading_progress").select("ayah").eq("surah", surah).eq("read_on", isoDay(new Date())),
  ]);
  return {
    bookmarked: new Set((b.data ?? []).map((x: { ayah: number }) => x.ayah)),
    notes: new Map((n.data ?? []).map((x: { ayah: number; body: string }) => [x.ayah, x.body])),
    readToday: new Set((r.data ?? []).map((x: { ayah: number }) => x.ayah)),
  };
}
