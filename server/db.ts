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
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 18,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 4000,
  allowExitOnIdle: false,
});
pool.on('error', (err) => {
  console.error('[pool] idle client error (main):', err.message);
});

// Priority pool — for user-facing API storage queries
export const priorityPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 7,
  min: 1,
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
