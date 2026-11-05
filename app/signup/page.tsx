import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { OAuthButtons, SignupForm } from "@/components/auth-forms";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/utils/safe-redirect";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthShell title="Create account">
      <SignupForm next={next} />
      {isSupabaseConfigured() && (
        <>
          <p className="my-4 text-center text-xs text-muted">or</p>
          <OAuthButtons next={next} />
        </>
      )}
      <p className="mt-4 text-center text-xs text-muted">By creating an account you agree to the <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
      <p className="mt-3 text-center text-sm text-muted">Already registered? <Link href="/login" className="text-accent underline">Sign in</Link></p>
    </AuthShell>
  );
}
