import type { Metadata, Viewport } from "next";
import "@fontsource/amiri-quran/400.css";
import "@fontsource/noto-nastaliq-urdu/400.css";
import "./globals.css";
import { APP_NAME } from "@/lib/config";
import { Header } from "@/components/header";
import { AudioProvider } from "@/components/audio-provider";
import { MiniPlayer } from "@/components/mini-player";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — The Holy Quran`, template: `%s · ${APP_NAME}` },
  description: "Read the Holy Quran in Arabic with translations. Free to read, no account required.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const themeScript = `try{var t=localStorage.getItem('noor:theme')||'system';if(t==='system'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <AudioProvider>
          <Header />
          <main>{children}</main>
          <footer className="mt-10 border-t border-line px-4 py-6 pb-28 text-center text-xs text-muted">
            Quran text, translations and recitations are provided by the Quran Foundation content API.
          </footer>
          <MiniPlayer />
        </AudioProvider>
      </body>
    </html>
  );
}
