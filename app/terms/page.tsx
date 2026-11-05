import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = { title: "Terms of Use" };

export default function Terms() {
  const h = "mt-5 text-lg font-semibold";
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 text-[15px] leading-relaxed">
      <p role="note" className="mb-4 rounded-md border border-gold p-2 text-sm">Draft for review. This text has not been reviewed by a lawyer and must be checked before launch.</p>
      <h1 className="text-2xl font-semibold sm:text-[28px]">Terms of Use</h1>
      <p className="mt-2 text-sm text-muted">{APP_NAME} — last updated: [date to be completed]</p>

      <h2 className={h}>Using the service</h2>
      <p>{APP_NAME} is provided free for personal reading, listening and study. Please do not misuse the service, attempt to access other people&apos;s data, or overload it.</p>

      <h2 className={h}>Content and sources</h2>
      <p>Quran text, translations, tafsir and recitations come from third-party providers and remain subject to their licences and terms. We display them as supplied and attribute translators, authors and reciters where the source provides this. Despite care, errors can occur in any digital text; please verify important passages against a trusted printed Mushaf.</p>

      <h2 className={h}>Not religious advice</h2>
      <p>Tafsir, Tajweed summaries and other learning material are for education and are not religious rulings. The memorization and progress tools are personal aids and do not assess or certify recitation. Please learn with qualified teachers.</p>

      <h2 className={h}>Your account</h2>
      <p>You are responsible for keeping your sign-in details secure. You can delete your account at any time in Settings.</p>

      <h2 className={h}>No warranty</h2>
      <p>The service is provided &quot;as is&quot;, and may change or be unavailable at times. [Add limitation of liability, governing law and contact details after legal review.]</p>
    </div>
  );
}
