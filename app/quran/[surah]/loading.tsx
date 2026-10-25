export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10" aria-busy="true" aria-label="Loading surah">
      <div className="mx-auto h-8 w-48 animate-pulse rounded bg-line" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="mt-8 space-y-3">
          <div className="ml-auto h-10 w-4/5 animate-pulse rounded bg-line" />
          <div className="h-4 w-3/5 animate-pulse rounded bg-line" />
        </div>
      ))}
    </div>
  );
}
