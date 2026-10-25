import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto my-12 max-w-md text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted">There are 114 surahs, numbered 1 to 114.</p>
      <Link href="/quran" className="mt-4 inline-block text-accent underline">Browse surahs</Link>
    </div>
  );
}
