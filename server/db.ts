import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Main shared pool — used by all background engines
// Larger pool + longer timeout so engines queue instead of crashing
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 28,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 12000,
  allowExitOnIdle: false,
});
pool.on('error', (err) => {
  console.error('[pool] idle client error (main):', err.message);
});

// ── PRIORITY POOL — DEDICATED TO USER-FACING CHAT/AUTH ONLY ─────────────────
// Background engines NEVER touch this pool.
// Always has connections available for real users.
export const priorityPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 8,
  min: 2,
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 3000,
  allowExitOnIdle: false,
});
priorityPool.on('error', (err) => {
  console.error('[pool] idle client error (priority):', err.message);
});

// Session pool — DEDICATED to express-session only.
// NEVER shared with background engines. This ensures login/auth
// always works even when the main pool is fully saturated.
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

export const db = drizzle(pool, { schema });

// priorityDb — for user-facing routes ONLY (chat, messages, auth lookups)
// Never imported by background engines
export const priorityDb = drizzle(priorityPool, { schema });
