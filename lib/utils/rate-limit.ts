// Best-effort, in-memory limiter. On serverless hosting each instance has its own memory,
// so this only slows casual abuse; Supabase Auth applies its own server-side limits too.
const hits = new Map<string, number[]>();

export function rateLimited(key: string, max = 8, windowMs = 60_000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  return recent.length > max;
}
