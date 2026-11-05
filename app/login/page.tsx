import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm, OAuthButtons } from "@/components/auth-forms";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/utils/safe-redirect";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNext(rawNext);
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthShell title="Sign in">
      {error && <p role="alert" className="mb-3 rounded-md border border-danger/40 p-2 text-sm text-danger">That link is invalid or has expired. Please try again.</p>}
      <LoginForm next={next} />
      {isSupabaseConfigured() && (
        <>
          <p className="my-4 text-center text-xs text-muted">or</p>
          <OAuthButtons next={next} />
        </>
      )}
      <p className="mt-5 text-center text-sm text-muted">New here? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-accent underline">Create an account</Link></p>
    </AuthShell>
  );
}
