"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { forgotPassword, login, resetPassword, signup, type FormState } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";

const input = "mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm";
const button = "w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg disabled:opacity-60";

function Status({ state }: { state: FormState }) {
  return (
    <>
      {state.error && <p role="alert" className="rounded-md border border-danger/40 p-2 text-sm text-danger">{state.error}</p>}
      {state.message && <p role="status" className="rounded-md border border-line p-2 text-sm">{state.message}</p>}
    </>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <label className="block text-sm">Email<input name="email" type="email" required autoComplete="email" className={input} /></label>
      <label className="block text-sm">Password<input name="password" type="password" required autoComplete="current-password" className={input} /></label>
      <Status state={state} />
      <button className={button} disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      <p className="text-center text-xs"><Link href="/forgot-password" className="text-accent underline">Forgot your password?</Link></p>
    </form>
  );
}

export function SignupForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signup, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <label className="block text-sm">Name (optional)<input name="name" maxLength={60} autoComplete="name" className={input} /></label>
      <label className="block text-sm">Email<input name="email" type="email" required autoComplete="email" className={input} /></label>
      <label className="block text-sm">Password<input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={input} />
        <span className="text-xs text-muted">At least 8 characters.</span></label>
      <Status state={state} />
      <button className={button} disabled={pending}>{pending ? "Creating account…" : "Create account"}</button>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPassword, {});
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">Email<input name="email" type="email" required autoComplete="email" className={input} /></label>
      <Status state={state} />
      <button className={button} disabled={pending}>{pending ? "Sending…" : "Send reset link"}</button>
    </form>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState(resetPassword, {});
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">New password<input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={input} /></label>
      <label className="block text-sm">Confirm password<input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={input} /></label>
      <Status state={state} />
      <button className={button} disabled={pending}>{pending ? "Saving…" : "Set new password"}</button>
    </form>
  );
}

export function OAuthButtons({ next }: { next: string }) {
  const [error, setError] = useState<string | null>(null);
  async function go(provider: "google" | "facebook") {
    setError(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setError("Could not start sign-in. This provider may not be enabled yet.");
  }
  const b = "w-full rounded-md border border-line bg-surface px-4 py-2 text-sm hover:border-accent";
  return (
    <div className="space-y-2">
      <button type="button" className={b} onClick={() => go("google")}>Continue with Google</button>
      <button type="button" className={b} onClick={() => go("facebook")}>Continue with Facebook</button>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    </div>
  );
}
