import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool, Client } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const _rawPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 18,
  min: 2,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 8000,
  allowExitOnIdle: false,
});
_rawPool.on('error', (err) => {
  console.error('[pool] idle client error (main):', err.message);
});

let _bgQueryActive = 0;
const _BG_CONCURRENCY = 6;
const _bgWaitQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void; args: any[] }> = [];

function _drainBgWait() {
  while (_bgQueryActive < _BG_CONCURRENCY && _bgWaitQueue.length > 0) {
    const item = _bgWaitQueue.shift()!;
    _bgQueryActive++;
    (_rawPool.query as any)(...item.args)
      .then(item.resolve)
      .catch(item.reject)
      .finally(() => { _bgQueryActive--; _drainBgWait(); });
  }
}

export const pool = new Proxy(_rawPool, {
  get(target, prop) {
    if (prop === 'query') {
      return (...args: any[]) => {
        const waiting = (target as any).waitingCount ?? 0;
        if (waiting >= 10) {
          return new Promise((resolve, reject) => {
            _bgWaitQueue.push({ resolve, reject, args });
            _drainBgWait();
          });
        }
        return (target.query as any)(...args);
      };
    }
    const val = (target as any)[prop];
    return typeof val === 'function' ? val.bind(target) : val;
  }
});

export const priorityPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 8,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
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

const apiPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  min: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: false,
});
apiPool.on('error', (err) => {
  console.error('[pool] idle client error (api):', err.message);
});
apiPool.on('connect', (client) => {
  client.query('SET statement_timeout = 15000').catch(() => {});
});
console.log("[db] ✅ API query pool ready (max 5)");

export async function directQuery(sql: string, params?: any[]): Promise<pg.QueryResult> {
  return apiPool.query(sql, params);
}

export function getPoolHealth() {
  return {
    main: { total: (_rawPool as any).totalCount ?? 0, idle: (_rawPool as any).idleCount ?? 0, waiting: (_rawPool as any).waitingCount ?? 0, max: 18 },
    priority: { total: (priorityPool as any).totalCount ?? 0, idle: (priorityPool as any).idleCount ?? 0, waiting: (priorityPool as any).waitingCount ?? 0, max: 8 },
    api: { total: (apiPool as any).totalCount ?? 0, idle: (apiPool as any).idleCount ?? 0, waiting: (apiPool as any).waitingCount ?? 0, max: 5 },
    bgQueue: { active: bgActive + _bgQueryActive, queued: bgQueryQueue.length + _bgWaitQueue.length, maxConcurrent: BG_MAX_CONCURRENT },
  };
}

export const db = drizzle(pool, { schema });
export const priorityDb = drizzle(priorityPool, { schema });
