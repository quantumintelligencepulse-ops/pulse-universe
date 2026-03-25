import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Main shared pool — used by all engines + routes
// Increased max connections for the 40+ concurrent background engines
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 25,
  idleTimeoutMillis: 30000,
});

// Priority pool — for user-facing API routes only
// Kept small and separate so user requests always have available connections
export const priorityPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 15000,
});

export const db = drizzle(pool, { schema });
