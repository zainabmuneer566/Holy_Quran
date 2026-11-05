import { isSupabaseConfigured } from "@/lib/supabase/config";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-sm px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">{title}</h1>
      {isSupabaseConfigured() ? children : <SupabaseNotice />}
    </div>
  );
}

export function SupabaseNotice() {
  return (
    <div role="status" className="rounded-xl border border-line bg-surface p-4 text-sm">
      <p className="font-medium">Accounts are not set up on this server yet.</p>
      <p className="mt-1 text-muted">
        Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (see SETUP.md), then redeploy.
        Reading, listening and search work without an account.
      </p>
    </div>
  );
}
