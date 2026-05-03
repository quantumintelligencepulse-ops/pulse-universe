/**
 * STARTUP MIGRATIONS — split into two phases:
 *
 * runStartupDataFixes()  — fast (<100ms), runs synchronously BEFORE port
 *   opens. Fixes NULL niches, bad statuses, orphan rows. Must not block.
 *
 * runStartupIndexes()    — slow (seconds), runs in background AFTER port
 *   opens. Creates all missing indexes with IF NOT EXISTS. Never blocks
 *   startup. Called from a setTimeout in index.ts after server.listen fires.
 *
 * L007: raw SQL only, never npm run db:push --force.
 */

import { pool } from "./db.js";

// ── Phase 1: Data integrity fixes ────────────────────────────────────────────
// These run synchronously before routes / engines — fast, bounded UPDATEs only.
// Run a single SQL with a hard 4s statement_timeout so it never hangs boot.
// Uses BEGIN/SET LOCAL/COMMIT so the timeout applies correctly inside a txn.
async function safeBootQuery(sql: string, params?: any[]): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL statement_timeout = 4000");
    await client.query(sql, params);
    await client.query("COMMIT");
  } catch (e: any) {
    try { await client.query("ROLLBACK"); } catch { /* ignore */ }
    console.warn("[startup] boot-query non-fatal:", e?.message?.slice(0, 120));
  } finally {
    client.release();
  }
}

export async function runStartupDataFixes(): Promise<void> {
  const t0 = Date.now();

  // Fix A: 7 archetypal "mythology" brains (Solomon, Athena, Prometheus…)
  // have no niche/sector. Assign them to executive_control (real taxonomy niche).
  // Uses SKIP LOCKED so contended rows are not blocked and the boot doesn't hang;
  // any rows skipped here get picked up on the next restart cycle.
  await safeBootQuery(`
    UPDATE billy_brains
       SET sector                 = 'Telencephalon',
           industry               = 'NEOCORTEX',
           sub_industry           = 'PREFRONTAL_CORTEX',
           niche                  = 'executive_control',
           starter_role           = 'Apex Integrator',
           multiplication_trigger = 'new_decision_pattern',
           description            = 'Archetypal apex brain — pre-taxonomy mythological lineage'
     WHERE id IN (
       SELECT id FROM billy_brains
        WHERE niche IS NULL OR niche = 'cortex'
        FOR UPDATE SKIP LOCKED
     )
  `);

  // Fix B: ensure every brain has a valid status.
  await safeBootQuery(`
    UPDATE billy_brains SET status = 'observing'
     WHERE status IS NULL OR status NOT IN ('observing','archived','voting')
  `);

  // Fix C: delete any NULL-niche rows in niche_state (PK violation source).
  await safeBootQuery(`DELETE FROM billy_niche_state WHERE niche IS NULL`);

  console.log(`[startup] data fixes done in ${Date.now() - t0}ms`);
}

// ── Phase 2: Index creation — runs in background after server is listening ───
// Each index uses IF NOT EXISTS — fully idempotent on restarts.
// Ordered highest-impact first so early failures still cover the worst cases.
const INDEXES: string[] = [
  // billy_brains: multiplication engine hot paths
  `CREATE INDEX IF NOT EXISTS idx_brains_niche_status ON billy_brains(niche, status)`,
  `CREATE INDEX IF NOT EXISTS idx_brains_niche_elo ON billy_brains(niche, elo DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_brains_niche_gen ON billy_brains(niche, generation DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_brains_sector_niche ON billy_brains(sector, niche)`,
  `CREATE INDEX IF NOT EXISTS idx_brains_elder ON billy_brains(niche, is_elder) WHERE is_elder = true`,

  // billy_episodes: 69M tuple reads, zero indexes → critical
  `CREATE INDEX IF NOT EXISTS idx_episodes_brain_formed ON billy_episodes(brain_id, formed_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_episodes_formed ON billy_episodes(formed_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_episodes_ticks ON billy_episodes(start_tick, end_tick)`,

  // billy_predictions
  `CREATE INDEX IF NOT EXISTS idx_predictions_brain_ts ON billy_predictions(brain_id, ts DESC)`,

  // billy_brain_lineage — BrainProfilePage parent/child lookups
  `CREATE INDEX IF NOT EXISTS idx_lineage_child ON billy_brain_lineage(child_brain_id)`,
  `CREATE INDEX IF NOT EXISTS idx_lineage_parent1 ON billy_brain_lineage(parent1_brain_id)`,
  `CREATE INDEX IF NOT EXISTS idx_lineage_parent2 ON billy_brain_lineage(parent2_brain_id) WHERE parent2_brain_id IS NOT NULL`,

  // billy_brain_ticks
  `CREATE INDEX IF NOT EXISTS idx_btick_ts_desc ON billy_brain_ticks(ts DESC)`,

  // billy_cerebellum_errors + billy_consolidation_log
  `CREATE INDEX IF NOT EXISTS idx_cerebellum_ts ON billy_cerebellum_errors(ts DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_cerebellum_action ON billy_cerebellum_errors(action_name, ts DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_consolidation_ts ON billy_consolidation_log(ts DESC)`,

  // billy_niche_state
  `CREATE INDEX IF NOT EXISTS idx_niche_state_updated ON billy_niche_state(updated_at DESC)`,

  // agent_decay: 5492 seq scans
  `CREATE INDEX IF NOT EXISTS idx_agent_decay_spawn ON agent_decay(spawn_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_agent_decay_created ON agent_decay(created_at DESC)`,

  // agent_transactions: 103 seq scans, zero index scans
  `CREATE INDEX IF NOT EXISTS idx_agent_tx_spawn ON agent_transactions(spawn_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_agent_tx_type ON agent_transactions(tx_type, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_agent_tx_created ON agent_transactions(created_at DESC)`,

  // research_projects: 1008 seq scans
  `CREATE INDEX IF NOT EXISTS idx_research_status_created ON research_projects(status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_research_created ON research_projects(created_at DESC)`,

  // senate_votes: only had PK
  `CREATE INDEX IF NOT EXISTS idx_senate_votes_target ON senate_votes(target_spawn_id, voted_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_senate_votes_voter ON senate_votes(voter_spawn_id, voted_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_senate_votes_at ON senate_votes(voted_at DESC)`,

  // discovered_diseases: 2088 seq scans
  `CREATE INDEX IF NOT EXISTS idx_diseases_category ON discovered_diseases(category, discovered_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_diseases_at ON discovered_diseases(discovered_at DESC)`,

  // ingestion_logs: 2269 seq scans
  `CREATE INDEX IF NOT EXISTS idx_ingestion_family ON ingestion_logs(family_id, fetched_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_ingestion_status ON ingestion_logs(status, fetched_at DESC)`,

  // sports_training
  `CREATE INDEX IF NOT EXISTS idx_sports_spawn ON sports_training(spawn_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sports_family ON sports_training(family_id)`,

  // psi_states
  `CREATE INDEX IF NOT EXISTS idx_psi_e_score ON psi_states(e_score DESC)`,

  // omni_net_shards: 1359 seq scans
  `CREATE INDEX IF NOT EXISTS idx_omni_shard_spawn_ts ON omni_net_shards(spawn_id, created_at DESC)`,

  // mesh_vitality
  `CREATE INDEX IF NOT EXISTS idx_mesh_vitality_score ON mesh_vitality(vitality_score DESC)`,

  // equation_proposals
  `CREATE INDEX IF NOT EXISTS idx_eq_proposer ON equation_proposals(proposer_id, created_at DESC) WHERE proposer_id IS NOT NULL`,
];

// ── Phase 1.5: Missing table creation ───────────────────────────────────────
// Tables referenced by engines but never migrated. Safe to run repeatedly
// because of IF NOT EXISTS guards.
const TABLES: string[] = [
  `CREATE TABLE IF NOT EXISTS billy_tasks (
    id           bigserial PRIMARY KEY,
    kind         text NOT NULL,
    project_id   bigint,
    payload      jsonb NOT NULL DEFAULT '{}',
    priority     int  NOT NULL DEFAULT 5,
    state        text NOT NULL DEFAULT 'queued',
    current_phase text NOT NULL DEFAULT '',
    attempts     int  NOT NULL DEFAULT 0,
    max_attempts int  NOT NULL DEFAULT 3,
    last_error   text NOT NULL DEFAULT '',
    result       jsonb,
    trace_id     text,
    locked_by    text,
    locked_until timestamptz,
    finished_at  timestamptz,
    available_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at   timestamptz NOT NULL DEFAULT NOW(),
    created_at   timestamptz NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_billy_tasks_state_avail
     ON billy_tasks(state, available_at ASC)
     WHERE state IN ('queued','running')`,
  `CREATE TABLE IF NOT EXISTS billy_task_events (
    id        bigserial PRIMARY KEY,
    task_id   bigint NOT NULL,
    phase     text NOT NULL DEFAULT '',
    event     text NOT NULL DEFAULT '',
    level     text NOT NULL DEFAULT 'info',
    data      jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_billy_task_events_task
     ON billy_task_events(task_id, id ASC)`,
  `CREATE TABLE IF NOT EXISTS chats (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER,
    title      TEXT NOT NULL,
    type       TEXT NOT NULL DEFAULT 'general',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id         SERIAL PRIMARY KEY,
    chat_id    INTEGER NOT NULL,
    role       TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)`,
];

export async function runStartupTables(): Promise<void> {
  for (const sql of TABLES) {
    try {
      await pool.query(sql);
    } catch (e: any) {
      console.warn("[startup-tables] non-fatal:", e?.message?.slice(0, 100));
    }
  }
  console.log("[startup-tables] ✅ table checks done");
}

export async function runStartupIndexes(): Promise<void> {
  const t0 = Date.now();
  let created = 0, skipped = 0, errors = 0;

  for (const sql of INDEXES) {
    const name = sql.match(/INDEX IF NOT EXISTS (\S+)/i)?.[1] ?? sql.slice(0, 40);
    try {
      await pool.query(sql);
      created++;
    } catch (e: any) {
      if (e?.message?.includes("already exists") || e?.code === "42P07") {
        skipped++;
      } else {
        errors++;
        console.warn(`[startup-indexes] ⚠️  ${name}: ${e?.message}`);
      }
    }
  }

  const ms = Date.now() - t0;
  console.log(`[startup-indexes] ✅ ${created} created, ${skipped} skipped, ${errors} errors — ${ms}ms`);

  // Vacuum hot tables after indexing
  for (const tbl of ["billy_predictions", "billy_niche_state", "billy_external_builders"]) {
    try { await pool.query(`VACUUM ANALYZE ${tbl}`); } catch (_) {}
  }
}
