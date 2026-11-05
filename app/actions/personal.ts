"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { isoDay } from "@/lib/utils/daily";
import type { MemoStatus } from "@/lib/db-types";

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const ref = z.object({ surah: z.number().int().min(1).max(114), ayah: z.number().int().min(1).max(286) });
const SIGN_IN = "Please sign in to save this.";
const FAILED = "Could not save. Please try again.";

async function authed() {
  const user = await getCurrentUser();
  if (!user) return null;
  return { user, supabase: await createClient() };
}

export async function toggleBookmark(surah: number, ayah: number): Promise<Result<{ bookmarked: boolean }>> {
  const r = ref.safeParse({ surah, ayah });
  if (!r.success) return { ok: false, error: "Invalid ayah." };
  const a = await authed();
  if (!a) return { ok: false, error: SIGN_IN };
  const { data: existing } = await a.supabase.from("bookmarks").select("id").eq("surah", surah).eq("ayah", ayah).maybeSingle();
  if (existing) {
    const { error } = await a.supabase.from("bookmarks").delete().eq("id", existing.id);
    if (error) return { ok: false, error: FAILED };
    revalidatePath("/bookmarks");
    return { ok: true, bookmarked: false };
  }
  const { error } = await a.supabase.from("bookmarks").insert({ user_id: a.user.id, surah, ayah });
  if (error) return { ok: false, error: FAILED };
  revalidatePath("/bookmarks");
  return { ok: true, bookmarked: true };
}

export async function saveNote(surah: number, ayah: number, body: string): Promise<Result<{ saved: boolean }>> {
  const r = ref.safeParse({ surah, ayah });
  const text = body.trim();
  if (!r.success || text.length > 5000) return { ok: false, error: "Notes can be up to 5000 characters." };
  const a = await authed();
  if (!a) return { ok: false, error: SIGN_IN };
  if (!text) {
    const { error } = await a.supabase.from("personal_notes").delete().eq("surah", surah).eq("ayah", ayah);
    if (error) return { ok: false, error: FAILED };
    revalidatePath("/bookmarks");
    return { ok: true, saved: false };
  }
  const { error } = await a.supabase
    .from("personal_notes")
    .upsert({ user_id: a.user.id, surah, ayah, body: text }, { onConflict: "user_id,surah,ayah" });
  if (error) return { ok: false, error: FAILED };
  revalidatePath("/bookmarks");
  return { ok: true, saved: true };
}

export async function toggleRead(surah: number, ayah: number): Promise<Result<{ readToday: boolean }>> {
  const r = ref.safeParse({ surah, ayah });
  if (!r.success) return { ok: false, error: "Invalid ayah." };
  const a = await authed();
  if (!a) return { ok: false, error: SIGN_IN };
  const today = isoDay(new Date());
  const { data: existing } = await a.supabase.from("reading_progress").select("ayah")
    .eq("surah", surah).eq("ayah", ayah).eq("read_on", today).maybeSingle();
  if (existing) {
    const { error } = await a.supabase.from("reading_progress").delete().eq("surah", surah).eq("ayah", ayah).eq("read_on", today);
    if (error) return { ok: false, error: FAILED };
    revalidatePath("/goals");
    return { ok: true, readToday: false };
  }
  const { error } = await a.supabase.from("reading_progress").insert({ user_id: a.user.id, surah, ayah, read_on: today });
  if (error) return { ok: false, error: FAILED };
  revalidatePath("/goals");
  return { ok: true, readToday: true };
}

const REVIEW_DAYS: Record<MemoStatus, number | null> = { learning: null, revision: 1, memorized: 7 };

export async function setMemorization(surah: number, ayah: number, status: MemoStatus | "none"): Promise<Result> {
  const r = ref.safeParse({ surah, ayah });
  if (!r.success || !["none", "learning", "memorized", "revision"].includes(status)) return { ok: false, error: "Invalid request." };
  const a = await authed();
  if (!a) return { ok: false, error: SIGN_IN };
  if (status === "none") {
    const { error } = await a.supabase.from("memorization_progress").delete().eq("surah", surah).eq("ayah", ayah);
    if (error) return { ok: false, error: FAILED };
  } else {
    const days = REVIEW_DAYS[status];
    const next = days === null ? null : isoDay(new Date(Date.now() + days * 86_400_000));
    const { error } = await a.supabase
      .from("memorization_progress")
      .upsert({ user_id: a.user.id, surah, ayah, status, next_review_on: next }, { onConflict: "user_id,surah,ayah" });
    if (error) return { ok: false, error: FAILED };
  }
  revalidatePath("/memorization");
  revalidatePath("/goals");
  return { ok: true };
}

/** Logs that a surah was opened (history / resume), unless the user turned history off. */
export async function recordVisit(surah: number): Promise<void> {
  if (!z.number().int().min(1).max(114).safeParse(surah).success) return;
  const a = await authed();
  if (!a) return;
  const { data: prefs } = await a.supabase.from("user_preferences").select("keep_history").eq("user_id", a.user.id).maybeSingle();
  if (prefs && prefs.keep_history === false) return;
  const { data: last } = await a.supabase.from("reading_sessions").select("surah, opened_at")
    .order("opened_at", { ascending: false }).limit(1).maybeSingle();
  if (last && last.surah === surah && Date.now() - new Date(last.opened_at).getTime() < 30 * 60_000) return;
  await a.supabase.from("reading_sessions").insert({ user_id: a.user.id, surah });
}
