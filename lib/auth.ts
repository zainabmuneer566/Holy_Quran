import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Preferences } from "@/lib/db-types";

/** Verified user (asks Supabase to validate the token). Null for visitors, and skipped if no auth cookie exists. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null;
  const store = await cookies();
  if (!store.getAll().some((c) => c.name.startsWith("sb-"))) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

/** For pages that need an account. Returns null when Supabase isn't configured; redirects visitors to /login. */
export async function requireAuth(nextPath: string) {
  if (!isSupabaseConfigured()) return null;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return { user, supabase: await createClient() };
}

export const getPreferences = cache(async (): Promise<Preferences | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_preferences")
    .select("translation_ids, reciter_id, arabic_size, theme, show_streak, keep_history")
    .eq("user_id", user.id)
    .maybeSingle();
  return (data as Preferences | null) ?? null;
});
