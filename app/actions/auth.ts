"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeNext } from "@/lib/utils/safe-redirect";
import { rateLimited } from "@/lib/utils/rate-limit";

export interface FormState { error?: string; message?: string }

const email = z.email("Enter a valid email address.");
const newPassword = z.string().min(8, "Use at least 8 characters.").max(72, "Use at most 72 characters.");

async function context(bucket: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const origin = h.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return { origin, limited: rateLimited(`${bucket}:${ip}`) };
}

const unavailable: FormState = { error: "The sign-in service is unavailable right now. Please try again shortly." };
const isOutage = (e: { name?: string; status?: number }) => e.name === "AuthRetryableFetchError" || (e.status ?? 0) >= 500;

const notConfigured: FormState = { error: "Accounts are not configured on this server yet." };
const tooMany: FormState = { error: "Too many attempts. Please wait a minute and try again." };

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return notConfigured;
  const parsed = z.object({ email, password: z.string().min(1, "Enter your password.") }).safeParse({
    email: fd.get("email"), password: fd.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if ((await context("login")).limited) return tooMany;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (isOutage(error)) return unavailable;
    return { error: /confirm/i.test(error.message) ? "Please confirm your email first. Check your inbox." : "Incorrect email or password." };
  }
  redirect(safeNext(String(fd.get("next") ?? "")));
}

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return notConfigured;
  const parsed = z.object({
    email, password: newPassword, name: z.string().trim().max(60, "Name is too long.").optional(),
  }).safeParse({ email: fd.get("email"), password: fd.get("password"), name: fd.get("name") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { origin, limited } = await context("signup");
  if (limited) return tooMany;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.name ?? "" }, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    if (isOutage(error)) return unavailable;
    return { error: "Could not create the account. Try a different email or a stronger password." };
  }
  if (data.session) redirect(safeNext(String(fd.get("next") ?? "")));
  return { message: "Almost done. Check your email and open the confirmation link." };
}

export async function forgotPassword(_: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return notConfigured;
  const parsed = email.safeParse(fd.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { origin, limited } = await context("forgot");
  if (limited) return tooMany;
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${origin}/auth/callback?next=/reset-password` });
  // Same answer whether or not the address has an account.
  return { message: "If that email has an account, a reset link is on its way." };
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return notConfigured;
  const pw = newPassword.safeParse(fd.get("password"));
  if (!pw.success) return { error: pw.error.issues[0].message };
  if (fd.get("password") !== fd.get("confirm")) return { error: "The passwords do not match." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: pw.data });
  if (error) return { error: "This reset link has expired. Request a new one." };
  redirect("/");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
