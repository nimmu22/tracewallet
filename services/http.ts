/** Small bounded caches protect free providers. These are per-process, not a distributed quota. */
const cache = new Map<string, { expires: number; value: unknown }>();
const pending = new Map<string, Promise<unknown>>();
export async function cached<T>(
  key: string,
  ttl: number,
  loader: () => Promise<T>,
): Promise<T> {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.value as T;
  if (pending.has(key)) return pending.get(key) as Promise<T>;
  if (pending.size >= 40)
    throw new Error("The service is busy. Please try again shortly.");
  const request = loader()
    .then((value) => {
      if (cache.size >= 256) cache.delete(cache.keys().next().value!);
      cache.set(key, { expires: Date.now() + ttl, value });
      return value;
    })
    .finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}
let budget = 180,
  reset = 0;
export async function fetchJSON<T>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  if (Date.now() > reset) {
    budget = 180;
    reset = Date.now() + 60000;
  }
  if (--budget < 0)
    throw new Error(
      "Provider request limit reached. Please retry in a minute.",
    );
  // End hung requests so a slow network cannot leave the wallet scan running indefinitely.
  const r = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(10000),
    headers: { Accept: "application/json", ...init.headers },
  });
  if (!r.ok)
    throw new Error(
      r.status === 429
        ? "Provider rate limit reached. Try again shortly."
        : "Provider temporarily unavailable (HTTP " + r.status + ").",
    );
  return r.json() as Promise<T>;
}
export const isoSeconds = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000).toISOString() : null;
};
export const native = (raw: unknown, decimals = 18): number | null => {
  try {
    if (typeof raw !== "string" || !/^\d+$/.test(raw)) return null;
    return Number(BigInt(raw)) / 10 ** decimals;
  } catch {
    return null;
  }
};
