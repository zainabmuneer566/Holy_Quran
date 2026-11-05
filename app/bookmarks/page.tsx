import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { SupabaseNotice } from "@/components/auth-shell";
import { SavedBanner } from "@/components/saved-banner";
import { getChapters } from "@/lib/quran/server";
import { createCollection, deleteBookmark, deleteCollection, deleteNote, moveBookmark } from "@/app/actions/settings";
import type { Bookmark, Collection, Note } from "@/lib/db-types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bookmarks & notes", robots: { index: false } };

export default async function BookmarksPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const auth = await requireAuth("/bookmarks");
  if (!auth) return <div className="mx-auto max-w-xl px-4 py-8"><SupabaseNotice /></div>;
  const { saved } = await searchParams;
  const { supabase } = auth;

  const [cols, marks, notes, chapters] = await Promise.all([
    supabase.from("bookmark_collections").select("id, name").order("name"),
    supabase.from("bookmarks").select("id, collection_id, surah, ayah, created_at").order("created_at", { ascending: false }),
    supabase.from("personal_notes").select("id, surah, ayah, body, updated_at").order("updated_at", { ascending: false }),
    getChapters().catch(() => []),
  ]);
  const collections = (cols.data as Collection[] | null) ?? [];
  const bookmarks = (marks.data as Bookmark[] | null) ?? [];
  const noteList = (notes.data as Note[] | null) ?? [];
  const name = (s: number) => chapters.find((c) => c.id === s)?.name_simple ?? `Surah ${s}`;
  const groups = [{ id: null as string | null, title: "Unsorted" }, ...collections.map((c) => ({ id: c.id as string | null, title: c.name }))];
  const field = "rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink";
  const small = "rounded-md border border-line px-2 py-1 text-xs hover:border-accent";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold sm:text-[28px]">Bookmarks & notes</h1>
      <p className="mb-4 mt-1 text-sm text-muted">Private to your account and synced across your devices. Save ayahs from the reader.</p>
      <SavedBanner tag={saved} />

      <form action={createCollection} className="mb-5 flex gap-2">
        <label className="flex-1"><span className="sr-only">New collection name</span>
          <input name="name" required maxLength={60} placeholder="New collection name" className={`${field} w-full`} /></label>
        <button className="rounded-md bg-accent px-3 py-1.5 text-sm text-bg">Add collection</button>
      </form>

      {bookmarks.length === 0 && <p className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">No bookmarks yet. Open a surah and tap Bookmark under any ayah.</p>}
      {groups.map((g) => {
        const items = bookmarks.filter((b) => b.collection_id === g.id);
        if (items.length === 0 && g.id === null) return null;
        return (
          <section key={g.id ?? "none"} aria-label={g.title} className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{g.title}</h2>
              {g.id && (
                <form action={deleteCollection}><input type="hidden" name="id" value={g.id} />
                  <button className={small} aria-label={`Delete collection ${g.title}`}>Delete collection</button></form>
              )}
            </div>
            {items.length === 0 && <p className="text-sm text-muted">Empty.</p>}
            <ul className="space-y-2">
              {items.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3 text-sm">
                  <Link href={`/quran/${b.surah}#ayah-${b.ayah}`} className="min-w-0 flex-1 text-accent underline">{name(b.surah)} {b.surah}:{b.ayah}</Link>
                  <form action={moveBookmark} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={b.id} />
                    <label><span className="sr-only">Collection</span>
                      <select name="collection" defaultValue={b.collection_id ?? ""} className="rounded-md border border-line bg-bg px-1 py-1 text-xs text-ink">
                        <option value="">Unsorted</option>
                        {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select></label>
                    <button className={small}>Move</button>
                  </form>
                  <form action={deleteBookmark}><input type="hidden" name="id" value={b.id} /><button className={small} aria-label={`Remove bookmark ${b.surah}:${b.ayah}`}>Remove</button></form>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section aria-label="Notes" className="mt-8">
        <h2 className="mb-2 text-lg font-semibold">Notes</h2>
        {noteList.length === 0 && <p className="text-sm text-muted">No notes yet. Tap Note under any ayah to write one.</p>}
        <ul className="space-y-2">
          {noteList.map((n) => (
            <li key={n.id} className="rounded-xl border border-line bg-surface p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/quran/${n.surah}#ayah-${n.ayah}`} className="text-accent underline">{name(n.surah)} {n.surah}:{n.ayah}</Link>
                <form action={deleteNote}><input type="hidden" name="id" value={n.id} /><button className={small} aria-label={`Delete note ${n.surah}:${n.ayah}`}>Delete</button></form>
              </div>
              <p className="mt-1 whitespace-pre-wrap">{n.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
