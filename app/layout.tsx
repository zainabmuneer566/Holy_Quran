import type { Metadata, Viewport } from "next";
import "@fontsource/amiri-quran/400.css";
import "@fontsource/noto-nastaliq-urdu/400.css";
import "./globals.css";
import { APP_NAME } from "@/lib/config";
import { Header } from "@/components/header";
import { AudioProvider } from "@/components/audio-provider";
import { MiniPlayer } from "@/components/mini-player";
import { DevicePrefs } from "@/components/device-prefs";
import { getPreferences } from "@/lib/auth";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${APP_NAME} — The Holy Quran`, template: `%s · ${APP_NAME}` },
  description: "Read the Holy Quran in Arabic with translations. Free to read, no account required.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const themeScript = `try{var t=localStorage.getItem('noor:theme')||'system';if(t==='system'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const prefs = await getPreferences();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-bg">
          Skip to content
        </a>
        <AudioProvider>
          {prefs && <DevicePrefs theme={prefs.theme} size={prefs.arabic_size} />}
          <Header />
          <main id="main" tabIndex={-1}>{children}</main>
          <footer className="mt-10 border-t border-line px-4 py-6 pb-28 text-center text-xs text-muted">
            <p>Quran text, translations and recitations are provided by the Quran Foundation content API.</p>
            <p className="mt-2"><Link href="/privacy" className="underline">Privacy</Link> · <Link href="/terms" className="underline">Terms</Link></p>
          </footer>
          <MiniPlayer />
        </AudioProvider>
      </body>
    </html>
  );
}
