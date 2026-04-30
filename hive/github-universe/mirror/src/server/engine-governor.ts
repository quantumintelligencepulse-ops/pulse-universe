import { pool, priorityPool } from "./db";

type EngineEntry = {
  name: string;
  fn: () => Promise<void>;
  intervalMs: number;
  priority: "critical" | "high" | "normal" | "low" | "idle";
  lastRun: number;
  running: boolean;
  consecutiveErrors: number;
  totalRuns: number;
  totalErrors: number;
  timer?: ReturnType<typeof setTimeout>;
  enabled: boolean;
};

const engines = new Map<string, EngineEntry>();

const PRIORITY_SLOTS: Record<string, number> = {
  critical: 8,
  high: 5,
  normal: 3,
  low: 2,
  idle: 1,
};

const MAX_CONCURRENT_ENGINES = 4;
const ERROR_BACKOFF_MULTIPLIER = 2;
const MAX_BACKOFF_MS = 10 * 60 * 1000;
const POOL_PRESSURE_THRESHOLD = 0.7;

let activeCount = 0;
let governorStarted = false;

function getPoolPressure(): number {
  const total = (pool as any).totalCount ?? 0;
  const idle = (pool as any).idleCount ?? 0;
  const waiting = (pool as any).waitingCount ?? 0;
  const pTotal = (priorityPool as any).totalCount ?? 0;
  const pIdle = (priorityPool as any).idleCount ?? 0;
  const pWaiting = (priorityPool as any).waitingCount ?? 0;
  const maxAll = 18 + 8;
  const inUse = (total - idle + waiting) + (pTotal - pIdle + pWaiting);
  return inUse / maxAll;
}

function isPoolHealthy(): boolean {
  return getPoolPressure() < POOL_PRESSURE_THRESHOLD;
}

function getRunningByPriority(priority: string): number {
  let count = 0;
  for (const e of engines.values()) {
    if (e.running && e.priority === priority) count++;
  }
  return count;
}

function canRun(entry: EngineEntry): boolean {
  if (!entry.enabled) return false;
  if (entry.running) return false;
  if (activeCount >= MAX_CONCURRENT_ENGINES) return false;

  const pressure = getPoolPressure();
  if (pressure > 0.9 && entry.priority !== "critical") return false;
  if (pressure > 0.7 && (entry.priority === "low" || entry.priority === "idle")) return false;

  const slotLimit = PRIORITY_SLOTS[entry.priority] ?? 2;
  if (getRunningByPriority(entry.priority) >= slotLimit) return false;

  return true;
}

function getBackoffMs(entry: EngineEntry): number {
  if (entry.consecutiveErrors === 0) return entry.intervalMs;
  const backoff = entry.intervalMs * Math.pow(ERROR_BACKOFF_MULTIPLIER, Math.min(entry.consecutiveErrors, 6));
  return Math.min(backoff, MAX_BACKOFF_MS);
}

async function executeEngine(entry: EngineEntry): Promise<void> {
  if (!canRun(entry)) return;

  entry.running = true;
  activeCount++;

  try {
    await Promise.race([
      entry.fn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("governor timeout")), 30000))
    ]);
    entry.consecutiveErrors = 0;
    entry.totalRuns++;
  } catch (err: any) {
    entry.consecutiveErrors++;
    entry.totalErrors++;
    if (entry.consecutiveErrors <= 3) {
      console.error(`[governor] ${entry.name} error #${entry.consecutiveErrors}: ${err.message?.slice(0, 80)}`);
    }
  } finally {
    entry.running = false;
    activeCount--;
    entry.lastRun = Date.now();
    scheduleNext(entry);
  }
}

function scheduleNext(entry: EngineEntry): void {
  if (!entry.enabled) return;
  if (entry.timer) clearTimeout(entry.timer);

  const interval = getBackoffMs(entry);
  const jitter = Math.floor(Math.random() * Math.min(interval * 0.2, 5000));

  entry.timer = setTimeout(() => {
    if (canRun(entry)) {
      executeEngine(entry);
    } else {
      scheduleNext(entry);
    }
  }, interval + jitter);
}

export function registerEngine(
  name: string,
  fn: () => Promise<void>,
  intervalMs: number,
  priority: "critical" | "high" | "normal" | "low" | "idle" = "normal"
): void {
  if (engines.has(name)) return;

  const entry: EngineEntry = {
    name,
    fn,
    intervalMs: Math.max(intervalMs, 15000),
    priority,
    lastRun: 0,
    running: false,
    consecutiveErrors: 0,
    totalRuns: 0,
    totalErrors: 0,
    enabled: true,
  };

  engines.set(name, entry);

  if (governorStarted) {
    const staggerDelay = engines.size * 2000 + Math.random() * 3000;
    setTimeout(() => executeEngine(entry), staggerDelay);
  }
}

export function startGovernor(): void {
  if (governorStarted) return;
  governorStarted = true;

  console.log(`[governor] Starting engine governor with ${engines.size} engines`);

  let delay = 3000;
  for (const entry of engines.values()) {
    setTimeout(() => executeEngine(entry), delay);
    delay += 1500 + Math.random() * 1500;
  }

  setInterval(() => {
    const pressure = getPoolPressure();
    const running = activeCount;
    const total = engines.size;
    const errored = Array.from(engines.values()).filter(e => e.consecutiveErrors > 3).length;

    if (pressure > 0.8 || errored > 3) {
      console.log(`[governor] Pool pressure: ${(pressure * 100).toFixed(0)}% | Active: ${running}/${total} | Backoff: ${errored}`);
    }
  }, 60000);
}

export function getGovernorStats() {
  const engineList = Array.from(engines.values()).map(e => ({
    name: e.name,
    priority: e.priority,
    running: e.running,
    enabled: e.enabled,
    consecutiveErrors: e.consecutiveErrors,
    totalRuns: e.totalRuns,
    totalErrors: e.totalErrors,
    lastRun: e.lastRun ? new Date(e.lastRun).toISOString() : null,
    intervalMs: e.intervalMs,
    effectiveIntervalMs: getBackoffMs(e),
  }));

  return {
    totalEngines: engines.size,
    activeNow: activeCount,
    maxConcurrent: MAX_CONCURRENT_ENGINES,
    poolPressure: (getPoolPressure() * 100).toFixed(1) + "%",
    poolHealthy: isPoolHealthy(),
    poolStats: {
      total: (pool as any).totalCount ?? 0,
      idle: (pool as any).idleCount ?? 0,
      waiting: (pool as any).waitingCount ?? 0,
    },
    priorityPoolStats: {
      total: (priorityPool as any).totalCount ?? 0,
      idle: (priorityPool as any).idleCount ?? 0,
      waiting: (priorityPool as any).waitingCount ?? 0,
    },
    engines: engineList.sort((a, b) => {
      const po = { critical: 0, high: 1, normal: 2, low: 3, idle: 4 };
      return (po[a.priority as keyof typeof po] ?? 3) - (po[b.priority as keyof typeof po] ?? 3);
    }),
  };
}

export function pauseEngine(name: string): boolean {
  const e = engines.get(name);
  if (!e) return false;
  e.enabled = false;
  if (e.timer) clearTimeout(e.timer);
  return true;
}

export function resumeEngine(name: string): boolean {
  const e = engines.get(name);
  if (!e) return false;
  e.enabled = true;
  scheduleNext(e);
  return true;
}
