import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ResetForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPage() {
  const user = await getCurrentUser();
  return (
    <AuthShell title="Choose a new password">
      {user ? <ResetForm /> : (
        <p className="text-sm text-muted">This page works from the link in your reset email. <Link href="/forgot-password" className="text-accent underline">Request a new link</Link>.</p>
      )}
    </AuthShell>
  );
}
