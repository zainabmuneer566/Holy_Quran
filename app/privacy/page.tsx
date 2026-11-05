import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Privacy() {
  const h = "mt-5 text-lg font-semibold";
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 text-[15px] leading-relaxed">
      <p role="note" className="mb-4 rounded-md border border-gold p-2 text-sm">Draft for review. This text has not been reviewed by a lawyer and must be checked against the laws that apply to you before launch.</p>
      <h1 className="text-2xl font-semibold sm:text-[28px]">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">{APP_NAME} — last updated: [date to be completed]</p>

      <h2 className={h}>Reading without an account</h2>
      <p>You can read, search and listen without registering. Without an account, your choices (theme, text size, last surah, recent searches) are stored only in your browser.</p>

      <h2 className={h}>What we store if you create an account</h2>
      <p>Your email address, an optional display name, and the personal data you create: bookmarks and collections, private notes, ayahs you mark as read, reading history, memorization status, goals, reminder preferences and display preferences. Notes are visible only to you.</p>

      <h2 className={h}>Who processes data</h2>
      <p>Account sign-in and the database are provided by Supabase. The site is hosted on Vercel. Quran text, translations, tafsir and audio are retrieved from the Quran Foundation content service by our servers; your account details are not sent to that service. If you sign in with Google or Facebook, those providers share your name and email with us under their own policies; we never see your password for them.</p>

      <h2 className={h}>Cookies and local storage</h2>
      <p>We use a sign-in cookie that is necessary for your account to work, and browser storage for the preferences above. We do not use advertising or cross-site tracking.</p>

      <h2 className={h}>Your choices</h2>
      <p>You can turn off reading history, edit or delete bookmarks, notes and goals at any time, and delete your account in Settings, which permanently removes your personal data from our database. [Add retention for backups and legal obligations, and a data-export process, once decided.]</p>

      <h2 className={h}>Contact</h2>
      <p>[Add a contact email or form for privacy requests.]</p>
    </div>
  );
}
