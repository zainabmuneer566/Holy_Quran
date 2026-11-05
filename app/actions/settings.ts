"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

async function authed(back: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(back)}`);
  return { user, supabase: await createClient() };
}
const done = (path: string, tag: string): never => {
  revalidatePath(path);
  redirect(`${path}?saved=${tag}`);
};
const fail = (path: string): never => redirect(`${path}?saved=error`);

const optInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().int().min(min).max(max).optional());

export async function savePreferences(fd: FormData) {
  const { user, supabase } = await authed("/settings");
  const p = z.object({
    t1: optInt(1, 1_000_000), t2: optInt(1, 1_000_000), reciter: optInt(1, 1_000_000), size: optInt(20, 56),
    theme: z.enum(["system", "light", "dark", "sepia"]),
  }).safeParse({ t1: fd.get("t1"), t2: fd.get("t2"), reciter: fd.get("reciter"), size: fd.get("size"), theme: fd.get("theme") });
  if (!p.success) return fail("/settings");
  const ids = Array.from(new Set([p.data.t1, p.data.t2].filter((x): x is number => x !== undefined)));
  const { error } = await supabase.from("user_preferences").upsert({
    user_id: user.id, translation_ids: ids, reciter_id: p.data.reciter ?? null, arabic_size: p.data.size ?? null,
    theme: p.data.theme, show_streak: fd.get("show_streak") === "on", keep_history: fd.get("keep_history") === "on",
  }, { onConflict: "user_id" });
  if (error) return fail("/settings");
  done("/settings", "prefs");
}

export async function saveGoals(fd: FormData) {
  const { user, supabase } = await authed("/settings");
  const p = z.object({ daily: optInt(1, 1000), weekly: optInt(1, 7000), memo: optInt(0, 100) })
    .safeParse({ daily: fd.get("daily"), weekly: fd.get("weekly"), memo: fd.get("memo") });
  if (!p.success) return fail("/settings");
  const { error } = await supabase.from("reading_goals").upsert({
    user_id: user.id, daily_ayahs: p.data.daily ?? 5, weekly_ayahs: p.data.weekly ?? null, daily_memorization: p.data.memo ?? 0,
  }, { onConflict: "user_id" });
  if (error) return fail("/settings");
  done("/settings", "goals");
}

export async function saveReminders(fd: FormData) {
  const { user, supabase } = await authed("/settings");
  const p = z.object({
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    tz: z.string().max(64).optional(),
  }).safeParse({ time: fd.get("time") || undefined, tz: fd.get("tz") || undefined });
  if (!p.success) return fail("/settings");
  const { error } = await supabase.from("reminder_preferences").upsert({
    user_id: user.id, daily_reading_enabled: fd.get("reading") === "on", daily_ayah_enabled: fd.get("ayah") === "on",
    reminder_time: p.data.time ?? null, timezone: p.data.tz ?? null,
  }, { onConflict: "user_id" });
  if (error) return fail("/settings");
  done("/settings", "reminders");
}

export async function saveProfile(fd: FormData) {
  const { user, supabase } = await authed("/profile");
  const p = z.string().trim().max(60).safeParse(fd.get("name") ?? "");
  if (!p.success) return fail("/profile");
  const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: p.data || null }, { onConflict: "id" });
  if (error) return fail("/profile");
  done("/profile", "profile");
}

export async function createCollection(fd: FormData) {
  const { user, supabase } = await authed("/bookmarks");
  const p = z.string().trim().min(1).max(60).safeParse(fd.get("name"));
  if (!p.success) return fail("/bookmarks");
  const { error } = await supabase.from("bookmark_collections").insert({ user_id: user.id, name: p.data });
  if (error) return fail("/bookmarks");
  done("/bookmarks", "collection");
}

export async function deleteCollection(fd: FormData) {
  const { supabase } = await authed("/bookmarks");
  const id = z.uuid().safeParse(fd.get("id"));
  if (!id.success) return fail("/bookmarks");
  await supabase.from("bookmark_collections").delete().eq("id", id.data);
  done("/bookmarks", "collection-deleted");
}

export async function moveBookmark(fd: FormData) {
  const { supabase } = await authed("/bookmarks");
  const id = z.uuid().safeParse(fd.get("id"));
  const col = fd.get("collection");
  const target = col ? z.uuid().safeParse(col) : { success: true as const, data: null };
  if (!id.success || !target.success) return fail("/bookmarks");
  const { error } = await supabase.from("bookmarks").update({ collection_id: target.data }).eq("id", id.data);
  if (error) return fail("/bookmarks");
  done("/bookmarks", "moved");
}

export async function deleteBookmark(fd: FormData) {
  const { supabase } = await authed("/bookmarks");
  const id = z.uuid().safeParse(fd.get("id"));
  if (!id.success) return fail("/bookmarks");
  await supabase.from("bookmarks").delete().eq("id", id.data);
  done("/bookmarks", "removed");
}

export async function deleteNote(fd: FormData) {
  const { supabase } = await authed("/bookmarks");
  const id = z.uuid().safeParse(fd.get("id"));
  if (!id.success) return fail("/bookmarks");
  await supabase.from("personal_notes").delete().eq("id", id.data);
  done("/bookmarks", "removed");
}

export async function clearHistory() {
  const { supabase } = await authed("/history");
  await supabase.from("reading_sessions").delete().not("id", "is", null);
  done("/history", "cleared");
}

export async function deleteAccount(fd: FormData) {
  const { user, supabase } = await authed("/settings");
  if (fd.get("confirm") !== "DELETE") return fail("/settings");
  const admin = createAdminClient();
  if (!admin) redirect("/settings?saved=delete-unavailable");
  const { error } = await admin.auth.admin.deleteUser(user.id); // cascades to all personal tables
  if (error) return fail("/settings");
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
