// ─── CAREER IN-MEMORY CACHE ────────────────────────────────────────────────────
// Loads careers from DB once at startup, serves from RAM for instant API responses
// Refreshes every 2 minutes in the background

import { storage } from "./storage";

let cache: any[] = [];
let cacheByField: Record<string, any[]> = {};
let lastLoad = 0;
let loading = false;

async function loadCache(): Promise<void> {
  if (loading) return;
  loading = true;
  try {
    const all = await storage.getAllCareers(200);
    if (all && all.length > 0) {
      cache = all;
      const grouped: Record<string, any[]> = {};
      for (const item of all) {
        if (item.field) {
          if (!grouped[item.field]) grouped[item.field] = [];
          grouped[item.field].push(item);
        }
      }
      cacheByField = grouped;
      lastLoad = Date.now();
      console.log(`[career-cache] ✅ Loaded ${all.length} careers into memory cache`);
    }
  } catch (e: any) {
    console.log(`[career-cache] Load failed: ${e?.message} — retrying in 30s`);
  } finally {
    loading = false;
  }
}

export function getCareersFromCache(limit = 100): any[] {
  return cache.slice(0, limit);
}

export function getCareersByFieldFromCache(field: string, limit = 50): any[] {
  return (cacheByField[field] || []).slice(0, limit);
}

export function isCacheReady(): boolean {
  return cache.length > 0;
}

export function invalidateCache(): void {
  // Reload on next request
  lastLoad = 0;
}

export function addToCache(item: any): void {
  // Add/update item in cache without full reload
  const idx = cache.findIndex(c => c.slug === item.slug);
  if (idx >= 0) {
    cache[idx] = { ...cache[idx], ...item };
  } else {
    cache.unshift(item);
  }
  if (item.field) {
    if (!cacheByField[item.field]) cacheByField[item.field] = [];
    const fidx = cacheByField[item.field].findIndex(c => c.slug === item.slug);
    if (fidx >= 0) {
      cacheByField[item.field][fidx] = { ...cacheByField[item.field][fidx], ...item };
    } else {
      cacheByField[item.field].unshift(item);
    }
  }
}

export function startCareerCache(): void {
  console.log("[career-cache] 🚀 Career cache starting — loading from DB in 8s...");

  // Initial load after 8s (let other engines settle first)
  setTimeout(async () => {
    await loadCache();
    // If first load failed, retry every 15s until it works
    if (!isCacheReady()) {
      const retryId = setInterval(async () => {
        if (isCacheReady()) { clearInterval(retryId); return; }
        await loadCache();
      }, 15000);
    }
  }, 8000);

  // Refresh every 2 minutes
  setInterval(() => loadCache(), 2 * 60 * 1000);
}
