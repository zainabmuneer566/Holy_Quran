import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { ForgotForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPage() {
  return (
    <AuthShell title="Reset your password">
      <p className="mb-3 text-sm text-muted">Enter your email and we will send you a link to choose a new password.</p>
      <ForgotForm />
    </AuthShell>
  );
}
