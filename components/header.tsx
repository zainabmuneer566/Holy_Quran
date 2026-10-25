import Link from "next/link";
import { BookOpen } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="border-b border-line bg-bg">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold text-accent">
          <BookOpen aria-hidden className="h-5 w-5" />
          {APP_NAME}
        </Link>
        <nav aria-label="Main" className="flex items-center gap-3 text-sm sm:gap-4">
          <Link href="/quran" className="hover:text-accent">Surahs</Link>
          <Link href="/juz" className="hover:text-accent">Juz</Link>
          <Link href="/search" className="hover:text-accent">Search</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
