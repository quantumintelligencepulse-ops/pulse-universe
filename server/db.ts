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
  max: 25,
  idleTimeoutMillis: 30000,
});

// Priority pool — for user-facing API storage queries
export const priorityPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 15000,
});

// Session pool — DEDICATED to express-session only.
// NEVER shared with background engines. This ensures login/auth
// always works even when the main pool is fully saturated.
export const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 60000,
});

export const db = drizzle(pool, { schema });
