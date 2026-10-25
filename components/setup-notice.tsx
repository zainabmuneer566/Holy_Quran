import { QuranApiError } from "@/lib/quran/server";

export function ApiProblem({ error }: { error: QuranApiError }) {
  const titles = {
    not_configured: "Quran content source not configured",
    auth: "Quran API credentials were rejected",
    unavailable: "Quran content is temporarily unavailable",
  } as const;
  return (
    <div role="alert" className="mx-auto my-12 max-w-xl rounded-2xl border border-line bg-surface p-6">
      <h1 className="text-lg font-semibold">{titles[error.kind]}</h1>
      {error.kind === "not_configured" ? (
        <p className="mt-2 text-sm text-muted">
          Noor does not ship Quran text; it is fetched from the Quran Foundation API. Copy{" "}
          <code>.env.example</code> to <code>.env.local</code>, add your <code>QURAN_CLIENT_ID</code> and{" "}
          <code>QURAN_CLIENT_SECRET</code>, then restart the server. See the README for details.
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted">{error.message} Please try again shortly.</p>
      )}
    </div>
  );
}
