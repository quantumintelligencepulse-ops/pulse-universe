/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OMEGA PERFORMANCE ENGINE — 10-Layer Stability & Resource Management
 * ═══════════════════════════════════════════════════════════════════════════
 * Layer 1:  Memory Watchdog        — heap monitor, auto-pause under pressure
 * Layer 2:  Engine Priority Tiers  — CRITICAL / NORMAL / BACKGROUND
 * Layer 3:  Adaptive Intervals     — stretch low-priority cycles under load
 * Layer 4:  DB Circuit Breaker     — skip cycles when pool is saturated
 * Layer 5:  Hot API Response Cache — 30s cache for 15 most-called endpoints
 * Layer 6:  Concurrent Limiter     — max N engines running simultaneously
 * Layer 7:  Self-Ping Keepalive    — prevent Replit sleep-on-idle
 * Layer 8:  Backpressure Guard     — skip if previous cycle still running
 * Layer 9:  DB Query Cache         — 60s cache for identical DB queries
 * Layer 10: Startup Stagger        — unique delay per engine, no DB spike
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { pool } from "./db";
import type { Request, Response, NextFunction } from "express";

// ─── Layer 1: Memory Watchdog ─────────────────────────────────────────────────
const HEAP_WARNING_MB = 400;   // warn at 400MB
const HEAP_CRITICAL_MB = 600;  // pause background engines at 600MB
const HEAP_EMERGENCY_MB = 800; // pause normal engines at 800MB

type PressureLevel = "normal" | "warning" | "critical" | "emergency";
let currentPressure: PressureLevel = "normal";
let lastHeapMB = 0;
const pressureListeners: ((level: PressureLevel) => void)[] = [];

export function onPressureChange(fn: (level: PressureLevel) => void) {
  pressureListeners.push(fn);
}

function checkMemory() {
  const used = process.memoryUsage();
  lastHeapMB = Math.round(used.heapUsed / 1024 / 1024);
  const rss = Math.round(used.rss / 1024 / 1024);

  let level: PressureLevel = "normal";
  if (lastHeapMB >= HEAP_EMERGENCY_MB) level = "emergency";
  else if (lastHeapMB >= HEAP_CRITICAL_MB) level = "critical";
  else if (lastHeapMB >= HEAP_WARNING_MB) level = "warning";

  if (level !== currentPressure) {
    currentPressure = level;
    console.log(`[perf] 🧠 Memory pressure: ${level.toUpperCase()} — heap ${lastHeapMB}MB / rss ${rss}MB`);
    pressureListeners.forEach(fn => fn(level));
  }

  // Force GC hint under emergency
  if (level === "emergency" && global.gc) {
    try { global.gc(); } catch {}
  }
}

export function getMemoryPressure(): PressureLevel { return currentPressure; }
export function getHeapMB(): number { return lastHeapMB; }

// ─── Layer 2 & 3: Engine Priority Tiers + Adaptive Intervals ─────────────────
export type EnginePriority = "CRITICAL" | "NORMAL" | "BACKGROUND";

export function shouldEngineRun(priority: EnginePriority): boolean {
  if (currentPressure === "emergency" && priority !== "CRITICAL") return false;
  if (currentPressure === "critical" && priority === "BACKGROUND") return false;
  return true;
}

export function adaptiveInterval(baseMsec: number, priority: EnginePriority): number {
  if (priority === "CRITICAL") return baseMsec;
  if (currentPressure === "critical") return baseMsec * 3;
  if (currentPressure === "warning") return baseMsec * 2;
  return baseMsec;
}

// ─── Layer 4: DB Circuit Breaker ──────────────────────────────────────────────
const MAX_POOL_WAITING = 5;  // if more than 5 queries waiting, skip the cycle

export function dbCircuitBreakerOpen(): boolean {
  try {
    const stat = (pool as any);
    const waiting = stat.waitingCount ?? 0;
    if (waiting > MAX_POOL_WAITING) {
      return true; // circuit open — skip
    }
  } catch {}
  return false;
}

// ─── Layer 5: Hot API Response Cache ─────────────────────────────────────────
interface CacheEntry { data: any; expiresAt: number; hits: number; }
const responseCache = new Map<string, CacheEntry>();
let cacheHits = 0;
let cacheMisses = 0;

const CACHEABLE_ROUTES: Record<string, number> = {
  "/api/stats":                    30_000,
  "/api/agents/active":            30_000,
  "/api/omega/status":             30_000,
  "/api/feed/news":                20_000,
  "/api/quantapedia/entries":      45_000,
  "/api/spawn/families":           60_000,
  "/api/spawn/status":             30_000,
  "/api/hive/status":              30_000,
  "/api/economy/stats":            60_000,
  "/api/marketplace/stats":        60_000,
  "/api/research/stats":           60_000,
  "/api/seo/stats":                60_000,
  "/api/breaking-news/stats":      30_000,
  "/api/indexing/status":          30_000,
  "/api/invocation/discoveries":   45_000,
};

export function apiCacheMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "GET") return next();
  const ttl = CACHEABLE_ROUTES[req.path];
  if (!ttl) return next();

  const key = req.path + (req.query ? JSON.stringify(req.query) : "");
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    cacheHits++;
    cached.hits++;
    res.setHeader("X-Cache", "HIT");
    res.setHeader("X-Cache-Hits", String(cached.hits));
    return res.json(cached.data);
  }

  cacheMisses++;
  const originalJson = res.json.bind(res);
  res.json = (data: any) => {
    if (res.statusCode === 200) {
      responseCache.set(key, { data, expiresAt: Date.now() + ttl, hits: 0 });
    }
    return originalJson(data);
  };
  next();
}

function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of responseCache.entries()) {
    if (entry.expiresAt < now) responseCache.delete(key);
  }
}

export function invalidateCache(pathPrefix: string) {
  for (const key of responseCache.keys()) {
    if (key.startsWith(pathPrefix)) responseCache.delete(key);
  }
}

// ─── Layer 6: Concurrent Engine Limiter ───────────────────────────────────────
const MAX_CONCURRENT = 8;
let runningEngines = 0;
const engineQueue: (() => void)[] = [];

export async function withEngineSemaphore<T>(
  name: string,
  priority: EnginePriority,
  fn: () => Promise<T>
): Promise<T | null> {
  if (!shouldEngineRun(priority)) return null;
  if (dbCircuitBreakerOpen() && priority !== "CRITICAL") return null;

  return new Promise((resolve) => {
    const run = async () => {
      runningEngines++;
      try {
        const result = await fn();
        resolve(result);
      } catch (e: any) {
        resolve(null);
      } finally {
        runningEngines--;
        if (engineQueue.length > 0) {
          const next = engineQueue.shift()!;
          next();
        }
      }
    };

    if (runningEngines < MAX_CONCURRENT) {
      run();
    } else {
      engineQueue.push(run);
    }
  });
}

// ─── Layer 7: Self-Ping Keepalive ─────────────────────────────────────────────
let keepaliveActive = false;

function startKeepalive() {
  if (keepaliveActive) return;
  keepaliveActive = true;
  const PING_INTERVAL = 4 * 60 * 1000; // every 4 minutes

  setInterval(async () => {
    try {
      const port = process.env.PORT || "5000";
      await fetch(`http://localhost:${port}/api/stats`, {
        signal: AbortSignal.timeout(5000),
      });
    } catch {}
  }, PING_INTERVAL);

  console.log("[perf] 💓 Keepalive active — self-ping every 4 minutes (prevents Replit sleep)");
}

// ─── Layer 8: Backpressure Guard ──────────────────────────────────────────────
const runningFlags = new Map<string, boolean>();

export function createBackpressureGuard(engineId: string, fn: () => Promise<void>): () => Promise<void> {
  return async () => {
    if (runningFlags.get(engineId)) return; // previous cycle still running
    runningFlags.set(engineId, true);
    try { await fn(); }
    finally { runningFlags.set(engineId, false); }
  };
}

// ─── Layer 9: DB Query Cache ──────────────────────────────────────────────────
const queryCache = new Map<string, { rows: any[]; expiresAt: number }>();
let queryCacheHits = 0;

export async function cachedQuery(
  sql: string,
  params: any[] = [],
  ttlMs: number = 60_000
): Promise<{ rows: any[] }> {
  const key = sql + JSON.stringify(params);
  const cached = queryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    queryCacheHits++;
    return { rows: cached.rows };
  }
  const result = await pool.query(sql, params);
  queryCache.set(key, { rows: result.rows, expiresAt: Date.now() + ttlMs });
  return result;
}

function pruneQueryCache() {
  const now = Date.now();
  for (const [key, entry] of queryCache.entries()) {
    if (entry.expiresAt < now) queryCache.delete(key);
  }
}

// ─── Layer 10: Startup Stagger Registry ───────────────────────────────────────
let staggerIndex = 0;
const STAGGER_STEP_MS = 1200; // 1.2s between each engine start

export function getStaggeredDelay(baseDelayMs: number): number {
  const slot = staggerIndex++;
  return baseDelayMs + slot * STAGGER_STEP_MS;
}

// ─── Performance Status Export ────────────────────────────────────────────────
export function getPerformanceStatus() {
  return {
    memory: {
      heapMB: lastHeapMB,
      pressure: currentPressure,
      thresholds: { warning: HEAP_WARNING_MB, critical: HEAP_CRITICAL_MB, emergency: HEAP_EMERGENCY_MB },
    },
    engines: {
      running: runningEngines,
      queued: engineQueue.length,
      maxConcurrent: MAX_CONCURRENT,
    },
    apiCache: {
      size: responseCache.size,
      hits: cacheHits,
      misses: cacheMisses,
      hitRate: cacheHits + cacheMisses > 0
        ? Math.round((cacheHits / (cacheHits + cacheMisses)) * 100) + "%"
        : "0%",
    },
    queryCache: {
      size: queryCache.size,
      hits: queryCacheHits,
    },
    keepalive: keepaliveActive,
    dbCircuitBreaker: dbCircuitBreakerOpen() ? "OPEN (protecting DB)" : "closed",
  };
}

// ─── Start the performance engine ─────────────────────────────────────────────
export function startOmegaPerformanceEngine() {
  console.log("[perf] ⚡ OMEGA PERFORMANCE ENGINE ONLINE — 10 stability layers active");
  console.log("[perf]    L1: Memory Watchdog    L2: Priority Tiers  L3: Adaptive Intervals");
  console.log("[perf]    L4: DB Circuit Breaker L5: API Cache       L6: Concurrent Limiter");
  console.log("[perf]    L7: Keepalive          L8: Backpressure    L9: Query Cache  L10: Stagger");

  // Memory check every 30 seconds
  checkMemory();
  setInterval(checkMemory, 30_000);

  // Prune caches every 5 minutes
  setInterval(() => { pruneCache(); pruneQueryCache(); }, 5 * 60_000);

  // Start keepalive
  startKeepalive();

  // Initial heap report after 10s
  setTimeout(() => {
    checkMemory();
    console.log(`[perf] 📊 Initial heap: ${lastHeapMB}MB | Pressure: ${currentPressure}`);
  }, 10_000);
}
