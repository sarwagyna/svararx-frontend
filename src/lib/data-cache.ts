"use client";
/**
 * Lightweight in-memory data cache with TTL + stale-while-revalidate.
 *
 * The module-level Map persists across client-side (soft) navigations within a
 * tab, so revisiting a page shows data instantly and only refetches when the
 * cached copy is older than its TTL. A full page reload starts fresh.
 */

type Entry<T> = { data: T; ts: number };

const store = new Map<string, Entry<unknown>>();

export function getCached<T>(key: string): T | undefined {
  return (store.get(key) as Entry<T> | undefined)?.data;
}

export function isCacheFresh(key: string, ttlMs: number): boolean {
  const entry = store.get(key);
  return !!entry && Date.now() - entry.ts < ttlMs;
}

export function setCached<T>(key: string, data: T): void {
  store.set(key, { data, ts: Date.now() });
}

/** Drop a single key, all keys with a prefix, or (no arg) the whole cache. */
export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of [...store.keys()]) {
    if (key === prefix || key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

interface SwrOptions<T> {
  ttlMs?: number;
  onData: (data: T, fromCache: boolean) => void;
  onError?: (err: unknown) => void;
  onSettled?: () => void;
}

/**
 * Stale-while-revalidate loader:
 *   1. emits cached data immediately (if present),
 *   2. skips the network entirely when the cache is still fresh,
 *   3. otherwise fetches, caches, and emits the fresh data.
 */
export async function swrLoad<T>(
  key: string,
  fetcher: () => Promise<T>,
  { ttlMs = 30_000, onData, onError, onSettled }: SwrOptions<T>
): Promise<void> {
  const cached = getCached<T>(key);
  if (cached !== undefined) {
    onData(cached, true);
    if (isCacheFresh(key, ttlMs)) {
      onSettled?.();
      return;
    }
  }
  try {
    const fresh = await fetcher();
    setCached(key, fresh);
    onData(fresh, false);
  } catch (err) {
    onError?.(err);
  } finally {
    onSettled?.();
  }
}
