import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { ContinueReading } from "@/components/continue-reading";

const featured = [
  { href: "/quran/1", label: "Al-Fatihah" },
  { href: "/quran/2", label: "Al-Baqarah" },
  { href: "/quran/18", label: "Al-Kahf" },
  { href: "/quran/36", label: "Ya-Sin" },
  { href: "/quran/55", label: "Ar-Rahman" },
  { href: "/quran/67", label: "Al-Mulk" },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="py-16 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-accent sm:text-5xl">{APP_NAME}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Read the Holy Quran in Arabic with translations, in a calm and distraction-free reader.
          No account needed to read.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/quran" className="rounded-xl bg-accent px-6 py-3 font-medium text-bg">
            Browse all 114 surahs
          </Link>
          <ContinueReading />
        </div>
      </section>

      <section aria-labelledby="featured">
        <h2 id="featured" className="mb-4 text-sm font-medium uppercase tracking-wide text-gold">
          Frequently read
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {featured.map((f) => (
            <li key={f.href}>
              <Link href={f.href} className="block rounded-2xl border border-line bg-surface p-4 text-center shadow-sm hover:border-accent">
                {f.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
