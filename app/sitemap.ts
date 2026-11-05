import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export default function sitemap(): MetadataRoute.Sitemap {
  const fixed = ["", "/quran", "/juz", "/search", "/memorization", "/tajweed", "/login", "/signup", "/privacy", "/terms"];
  return [
    ...fixed.map((p) => ({ url: `${base}${p}` })),
    ...Array.from({ length: 114 }, (_, i) => ({ url: `${base}/quran/${i + 1}` })),
    ...Array.from({ length: 30 }, (_, i) => ({ url: `${base}/juz/${i + 1}` })),
  ];
}
