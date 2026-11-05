import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { SupabaseNotice } from "@/components/auth-shell";
import { SavedBanner } from "@/components/saved-banner";
import { saveProfile } from "@/app/actions/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const auth = await requireAuth("/profile");
  if (!auth) return <div className="mx-auto max-w-xl px-4 py-8"><SupabaseNotice /></div>;
  const { saved } = await searchParams;
  const { supabase, user } = auth;
  const count = (t: string) => supabase.from(t).select("*", { count: "exact", head: true });
  const [profile, b, n, p, m] = await Promise.all([
    supabase.from("profiles").select("display_name").maybeSingle(),
    count("bookmarks"), count("personal_notes"), count("reading_progress"), count("memorization_progress"),
  ]);
  const stat = (label: string, v: number | null) => (
    <div className="rounded-xl border border-line bg-surface p-3 text-center"><p className="text-xl font-semibold">{v ?? 0}</p><p className="text-xs text-muted">{label}</p></div>
  );
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold sm:text-[28px]">Profile</h1>
      <SavedBanner tag={saved} />
      <form action={saveProfile} className="rounded-xl border border-line bg-surface p-4">
        <label className="block text-xs text-muted">Display name
          <input name="name" maxLength={60} defaultValue={(profile.data as { display_name: string | null } | null)?.display_name ?? ""} className="mt-1 w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm text-ink" />
        </label>
        <p className="mt-3 text-xs text-muted">Email: {user.email}</p>
        <button className="mt-3 rounded-md bg-accent px-4 py-2 text-sm text-bg">Save</button>
      </form>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stat("Bookmarks", b.count)}{stat("Notes", n.count)}{stat("Read marks", p.count)}{stat("Memorization", m.count)}
      </div>
    </div>
  );
}
