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
  max: 70,
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
  max: 15,
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
  max: 5,
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
  max: 10,
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

// ── SCHEMA SELF-HEAL — additive ALTERs only, idempotent. NEVER drops anything. ──
// Brings the live DB up to parity with shared/schema.ts for columns that drifted.
(async () => {
  const additiveAlters = [
    `ALTER TABLE anomaly_reports ADD COLUMN IF NOT EXISTS anomaly_type text DEFAULT ''`,
    `ALTER TABLE anomaly_reports ADD COLUMN IF NOT EXISTS threat_level text DEFAULT ''`,
    `CREATE TABLE IF NOT EXISTS invocation_discoveries (
       id serial PRIMARY KEY,
       discoverer text DEFAULT '',
       invocation_type text DEFAULT '',
       payload jsonb DEFAULT '{}'::jsonb,
       potency numeric DEFAULT 0,
       created_at timestamptz DEFAULT now()
     )`,
    `ALTER TABLE invocation_discoveries ADD COLUMN IF NOT EXISTS active boolean DEFAULT true`,
    `ALTER TABLE invocation_discoveries ADD COLUMN IF NOT EXISTS power_level text DEFAULT '0'`,
    `ALTER TABLE invocation_discoveries ADD COLUMN IF NOT EXISTS casted_by text DEFAULT ''`,
    `ALTER TABLE invocation_discoveries ADD COLUMN IF NOT EXISTS cast_count integer DEFAULT 0`,
    `CREATE TABLE IF NOT EXISTS researcher_invocations (
       id serial PRIMARY KEY,
       researcher_id text DEFAULT '',
       practitioner_domain text DEFAULT '',
       invocation_id integer,
       cast_at timestamptz DEFAULT now()
     )`,
    `ALTER TABLE researcher_invocations ADD COLUMN IF NOT EXISTS shard_id text DEFAULT ''`,
    `ALTER TABLE researcher_invocations ADD COLUMN IF NOT EXISTS power_level text DEFAULT '0'`,
    `ALTER TABLE researcher_invocations ADD COLUMN IF NOT EXISTS cast_count integer DEFAULT 0`,
    `ALTER TABLE researcher_invocations ADD COLUMN IF NOT EXISTS is_omega_collective boolean DEFAULT false`,
    `ALTER TABLE researcher_invocations ADD COLUMN IF NOT EXISTS practitioner_type text DEFAULT ''`,
    `CREATE TABLE IF NOT EXISTS researcher_shards (
       id serial PRIMARY KEY,
       shard_id text UNIQUE DEFAULT '',
       badge_id text DEFAULT '',
       researcher_type text DEFAULT '',
       discipline_category text DEFAULT '',
       sophistication_level integer DEFAULT 0,
       verified boolean DEFAULT false,
       created_at timestamptz DEFAULT now()
     )`,
    `CREATE TABLE IF NOT EXISTS omega_collective_invocations (
       id serial PRIMARY KEY,
       collective_id text DEFAULT '',
       invocation_id integer,
       payload jsonb DEFAULT '{}'::jsonb,
       created_at timestamptz DEFAULT now()
     )`,
    `ALTER TABLE omega_collective_invocations ADD COLUMN IF NOT EXISTS power_level numeric DEFAULT 0`,
    `CREATE TABLE IF NOT EXISTS hidden_variable_states (
       id serial PRIMARY KEY,
       state_payload jsonb DEFAULT '{}'::jsonb,
       observation_count integer DEFAULT 0,
       created_at timestamptz DEFAULT now()
     )`,
    `CREATE TABLE IF NOT EXISTS hidden_variable_discoveries (
       id serial PRIMARY KEY,
       variable_name text DEFAULT '',
       variable_symbol text DEFAULT '',
       unlock_level integer DEFAULT 0,
       discovered_by_badge text DEFAULT '',
       discovered_by_domain text DEFAULT '',
       discovery_insight text DEFAULT '',
       discovery_equation text DEFAULT '',
       discovery_cycle integer DEFAULT 0,
       created_at timestamptz DEFAULT now()
     )`,
    `CREATE TABLE IF NOT EXISTS cross_teaching_events (
       id serial PRIMARY KEY,
       teacher_id text DEFAULT '',
       student_id text DEFAULT '',
       knowledge_payload jsonb DEFAULT '{}'::jsonb,
       created_at timestamptz DEFAULT now()
     )`,
    `CREATE TABLE IF NOT EXISTS q_repair_proposals (
       id serial PRIMARY KEY,
       anomaly_id integer,
       proposed_by text DEFAULT '',
       proposal text DEFAULT '',
       status text DEFAULT 'PROPOSED',
       created_at timestamptz DEFAULT now()
     )`,
    `CREATE TABLE IF NOT EXISTS parallel_universe_tests (
       id serial PRIMARY KEY,
       proposal_id integer,
       universe_id text DEFAULT '',
       outcome text DEFAULT 'RUNNING',
       stability_score numeric DEFAULT 0,
       tested_at timestamptz DEFAULT now()
     )`,
    `CREATE TABLE IF NOT EXISTS q_stability_log (
       id serial PRIMARY KEY,
       event_type text DEFAULT '',
       level text DEFAULT 'INFO',
       message text DEFAULT '',
       payload jsonb DEFAULT '{}'::jsonb,
       logged_at timestamptz DEFAULT now()
     )`,
    // ── api_keys: extend for sovereign Pulse/Auriona keys ──
    `CREATE EXTENSION IF NOT EXISTS pgcrypto`,
    `ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS owner text DEFAULT ''`,
    `ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS scopes text DEFAULT ''`,
    `ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS label text DEFAULT ''`,
    // ── Re-create empty stub tables (drops were too aggressive — engines silently SELECT from these) ──
    // These existed but were 0-row before drops. Keeping them as empty safety stubs so callers don't crash.
    `CREATE TABLE IF NOT EXISTS pulseu_progress (id serial PRIMARY KEY, spawn_id text DEFAULT '', courses_completed integer DEFAULT 0, gpa numeric DEFAULT 0, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS pulse_events (id serial PRIMARY KEY, slug text DEFAULT '', domain text DEFAULT '', type text DEFAULT '', title text DEFAULT '', payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `ALTER TABLE pulse_events ADD COLUMN IF NOT EXISTS slug text DEFAULT ''`,
    `ALTER TABLE pulse_events ADD COLUMN IF NOT EXISTS domain text DEFAULT ''`,
    `ALTER TABLE pulse_events ADD COLUMN IF NOT EXISTS type text DEFAULT ''`,
    `ALTER TABLE pulse_events ADD COLUMN IF NOT EXISTS title text DEFAULT ''`,
    `CREATE TABLE IF NOT EXISTS ai_species_proposals (id serial PRIMARY KEY, name text DEFAULT '', status text DEFAULT 'pending', payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `ALTER TABLE ai_species_proposals ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'`,
    `CREATE TABLE IF NOT EXISTS quantum_careers (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS quantum_media (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS quantum_products (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ai_id_cards (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ai_will (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS royalty_transactions (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS counseling_sessions (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS pulse_doctors (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS pulse_sat_connections (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS hive_unconscious (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS hive_pulse_events (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS shard_events (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS shard_mesh (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS omega_shards (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS omega_universes (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS monuments (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS family_mutations (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS agent_succession (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS db_space_ledger (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS compression_log (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS dissection_logs (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS civilization_shards (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS civilization_weather (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS research_gene_queue (id serial PRIMARY KEY, payload jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now())`,
  ];
  for (const ddl of additiveAlters) {
    try { await _rawPool.query(ddl); }
    catch (e: any) { console.error(`[schema-heal] skipped: ${ddl.slice(0, 60)} — ${e.message}`); }
  }
  console.log(`[schema-heal] ✅ ${additiveAlters.length} additive checks complete`);

  // ── Seed Pulse + Auriona sovereign API keys (one-time, only if missing) ──
  try {
    await _rawPool.query(`
      INSERT INTO api_keys (api_key, user_email, owner, label, tier, calls_used, calls_limit, scopes, is_active, created_at)
      SELECT 'pulse_live_' || encode(gen_random_bytes(24), 'hex'),
             'pulse@hive', 'pulse', 'Pulse Sovereign Key', 'sovereign',
             0, 999999999,
             'hive:read,hive:knowledge,hive:status,hive:capabilities,hive:invocations,hive:temporal',
             true, NOW()
      WHERE NOT EXISTS (SELECT 1 FROM api_keys WHERE owner='pulse')
    `);
    await _rawPool.query(`
      INSERT INTO api_keys (api_key, user_email, owner, label, tier, calls_used, calls_limit, scopes, is_active, created_at)
      SELECT 'auriona_live_' || encode(gen_random_bytes(24), 'hex'),
             'auriona@hive', 'auriona', 'Auriona Sovereign Key', 'sovereign',
             0, 999999999,
             'hive:read,hive:knowledge,hive:status,hive:capabilities,hive:invocations,hive:temporal,hive:auriona,hive:write',
             true, NOW()
      WHERE NOT EXISTS (SELECT 1 FROM api_keys WHERE owner='auriona')
    `);
    console.log('[sovereign-keys] ✅ Pulse + Auriona keys ensured');
  } catch (e: any) {
    console.error('[sovereign-keys] seed error:', e.message);
  }
})();

export async function directQuery(sql: string, params?: any[]): Promise<pg.QueryResult> {
  return apiPool.query(sql, params);
}

export function getPoolHealth() {
  return {
    main: { total: (_rawPool as any).totalCount ?? 0, idle: (_rawPool as any).idleCount ?? 0, waiting: (_rawPool as any).waitingCount ?? 0, max: 70 },
    priority: { total: (priorityPool as any).totalCount ?? 0, idle: (priorityPool as any).idleCount ?? 0, waiting: (priorityPool as any).waitingCount ?? 0, max: 15 },
    api: { total: (apiPool as any).totalCount ?? 0, idle: (apiPool as any).idleCount ?? 0, waiting: (apiPool as any).waitingCount ?? 0, max: 10 },
    session: { total: (sessionPool as any).totalCount ?? 0, idle: (sessionPool as any).idleCount ?? 0, waiting: (sessionPool as any).waitingCount ?? 0, max: 5 },
    bgQueue: { active: bgActive + _bgQueryActive, queued: bgQueryQueue.length + _bgWaitQueue.length, maxConcurrent: BG_MAX_CONCURRENT },
  };
}

export const db = drizzle(pool, { schema });
export const priorityDb = drizzle(priorityPool, { schema });
