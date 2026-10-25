"use client";
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto my-12 max-w-xl rounded-2xl border border-line bg-surface p-6">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">An unexpected error occurred while loading this page.</p>
      <button onClick={reset} className="mt-4 rounded-md bg-accent px-4 py-2 text-sm text-bg">Try again</button>
    </div>
  );
}
