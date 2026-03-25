/**
 * Server-side response cache for user-facing endpoints
 * Prevents startup page loads from waiting on DB while background engines run
 */

type CacheEntry<T> = { data: T; expiresAt: number };
const cache = new Map<string, CacheEntry<any>>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function invalidateCache(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

// Cached wrappers used by routes
export async function cachedOrFetch<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const hit = getCached<T>(key);
  if (hit !== null) return hit;
  const result = await fetcher();
  setCached(key, result, ttlMs);
  return result;
}
