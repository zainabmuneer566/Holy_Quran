import { notFound } from "next/navigation";

// Validates the surah number before any streaming starts, so bad URLs return a real 404.
export default async function SurahLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ surah: string }>;
}) {
  const { surah } = await params;
  const n = Number(surah);
  if (!/^\d+$/.test(surah) || n < 1 || n > 114) notFound();
  return children;
}
