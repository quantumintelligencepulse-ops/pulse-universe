import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 30,
  min: 2,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 8000,
  allowExitOnIdle: false,
});
pool.on('error', (err) => {
  console.error('[pool] idle client error (main):', err.message);
});

export const priorityPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 15,
  min: 3,
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: false,
});
priorityPool.on('error', (err) => {
  console.error('[pool] idle client error (priority):', err.message);
});

export const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  min: 1,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 3000,
  allowExitOnIdle: false,
});
sessionPool.on('error', (err) => {
  console.error('[pool] idle client error (session):', err.message);
});

let bgQueryQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void; fn: () => Promise<any> }> = [];
let bgActive = 0;
const BG_MAX_CONCURRENT = 4;

function processBgQueue() {
  while (bgActive < BG_MAX_CONCURRENT && bgQueryQueue.length > 0) {
    const item = bgQueryQueue.shift()!;
    bgActive++;
    item.fn()
      .then(item.resolve)
      .catch(item.reject)
      .finally(() => { bgActive--; processBgQueue(); });
  }
}

export function throttledBgQuery(fn: () => Promise<any>): Promise<any> {
  return new Promise((resolve, reject) => {
    bgQueryQueue.push({ resolve, reject, fn });
    processBgQueue();
  });
}

export function getPoolHealth() {
  return {
    main: { total: (pool as any).totalCount ?? 0, idle: (pool as any).idleCount ?? 0, waiting: (pool as any).waitingCount ?? 0, max: 30 },
    priority: { total: (priorityPool as any).totalCount ?? 0, idle: (priorityPool as any).idleCount ?? 0, waiting: (priorityPool as any).waitingCount ?? 0, max: 15 },
    bgQueue: { active: bgActive, queued: bgQueryQueue.length, maxConcurrent: BG_MAX_CONCURRENT },
  };
}

export const db = drizzle(pool, { schema });
export const priorityDb = drizzle(priorityPool, { schema });
