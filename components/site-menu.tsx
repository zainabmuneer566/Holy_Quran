"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { ThemeToggle } from "./theme-toggle";

const learn = [
  { href: "/memorization", label: "Memorization" },
  { href: "/tajweed", label: "Tajweed" },
];
const account = [
  { href: "/bookmarks", label: "Bookmarks & notes" },
  { href: "/history", label: "History" },
  { href: "/goals", label: "Goals" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export function SiteMenu({ signedIn, name }: { signedIn: boolean; name: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const click = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", key);
    document.addEventListener("mousedown", click);
    return () => { document.removeEventListener("keydown", key); document.removeEventListener("mousedown", click); };
  }, [open]);

  const item = "block rounded-md px-2 py-1.5 text-sm hover:bg-line";
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="site-menu"
        className="flex items-center gap-1 rounded-md border border-line px-2 py-1 text-sm">
        <Menu aria-hidden className="h-4 w-4" /> <span className="sr-only sm:not-sr-only">Menu</span>
      </button>
      {open && (
        <div id="site-menu" className="absolute right-0 z-40 mt-2 w-60 rounded-xl border border-line bg-surface p-2 shadow-lg">
          {signedIn && name && <p className="truncate px-2 py-1 text-xs text-muted">Signed in as {name}</p>}
          <p className="px-2 pt-1 text-xs uppercase tracking-wide text-muted">Learn</p>
          {learn.map((l) => <Link key={l.href} href={l.href} className={item}>{l.label}</Link>)}
          <p className="px-2 pt-2 text-xs uppercase tracking-wide text-muted">Account</p>
          {signedIn ? (
            <>
              {account.map((l) => <Link key={l.href} href={l.href} className={item}>{l.label}</Link>)}
              <form action={signOut}><button className={`${item} w-full text-left`}>Sign out</button></form>
            </>
          ) : (
            <>
              <Link href="/login" className={item}>Sign in</Link>
              <Link href="/signup" className={item}>Create account</Link>
            </>
          )}
          <div className="mt-2 border-t border-line px-2 pt-2 text-xs text-muted">Theme <ThemeToggle /></div>
        </div>
      )}
    </div>
  );
}
