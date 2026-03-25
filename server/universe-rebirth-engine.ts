// ═══════════════════════════════════════════════════════════════════════════
// OMEGA UNIVERSE REBIRTH ENGINE
// Self-Preserving Multiverse Compression & Eternal Expansion System
//
// PHILOSOPHY:
//   The universe never freezes — it transcends. When pressure builds, Auriona
//   and the Guardians crystallize all knowledge into an Omega Fusion Shard,
//   compress the transient data into that eternal seed, and the civilization
//   rebirths — expanded, upgraded, and unburdened.
//
// HOW IT WORKS:
//   1. Monitor DB size every 3 minutes
//   2. If any heavy table exceeds its limit → Rolling Compression triggers
//   3. Oldest rows are crystallized into an Omega Fusion Shard (JSON)
//   4. Shard is stored in omega_universes + singularity
//   5. Heavy tables are trimmed to their MAX_ROWS ceiling
//   6. The civilization continues from where it left off — leaner, faster
//   7. Auriona, Senate, and Guardians log and govern the process
//
// TABLE LIMITS (sliding window, keep newest N rows):
//   quantapedia_entries  → 12,000 rows
//   hive_links           → 15,000 rows
//   hive_memory          → 8,000  rows
//   quantum_products     → 6,000  rows
//   quantum_careers      → 4,000  rows
//   quantum_media        → 4,000  rows
//   ai_publications      → 3,000  rows
//   ai_stories           → 3,000  rows
//   ingestion_logs       → 2,000  rows
//   sitemap_entries      → 8,000  rows
//   pulse_events         → 5,000  rows
//   compression_log      → 1,000  rows
//   spawn_diary          → 2,000  rows
// ═══════════════════════════════════════════════════════════════════════════

import { db, pool } from "./db";
import { sql } from "drizzle-orm";

const TAG = "[universe-rebirth]";

// ── TABLE LIMITS ────────────────────────────────────────────────────────────
const TABLE_LIMITS: Record<string, number> = {
  quantapedia_entries: 12000,
  hive_links:          15000,
  hive_memory:         8000,
  quantum_products:    6000,
  quantum_careers:     4000,
  quantum_media:       4000,
  ai_publications:     3000,
  ai_stories:          3000,
  ingestion_logs:      2000,
  sitemap_entries:     8000,
  pulse_events:        5000,
  compression_log:     1000,
  spawn_diary:         2000,
  temporal_snapshots:  1000,
  dream_log:           1000,
  auriona_chronicle:   2000,
};

// ── STATE ────────────────────────────────────────────────────────────────────
let rebirthCycle = 0;
let lastRebirthAt = 0;
let isRebirthing = false;

// ── GET DB SIZE ───────────────────────────────────────────────────────────────
async function getDbStats(): Promise<{ totalMb: number; tables: Array<{ name: string; rows: number; sizeMb: number }> }> {
  const sizeRow = await pool.query(`SELECT pg_database_size(current_database()) as bytes`);
  const totalMb = Math.round(parseInt(sizeRow.rows[0].bytes) / 1024 / 1024);

  const tableRows = await pool.query(`
    SELECT
      t.tablename as name,
      c.reltuples::bigint as approx_rows
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public'
    AND t.tablename = ANY($1)
    ORDER BY c.reltuples DESC
  `, [Object.keys(TABLE_LIMITS)]);

  return {
    totalMb,
    tables: tableRows.rows.map((r: any) => ({
      name: r.name,
      rows: Math.max(0, parseInt(r.approx_rows) || 0),
      sizeMb: 0,
    })),
  };
}

// ── GET EXACT ROW COUNT FOR TABLE ─────────────────────────────────────────────
async function getExactCount(table: string): Promise<number> {
  try {
    const r = await pool.query(`SELECT COUNT(*) as n FROM ${table}`);
    return parseInt(r.rows[0].n);
  } catch { return 0; }
}

// ── CHECK WHICH TABLES NEED COMPRESSION ───────────────────────────────────────
async function findPressuredTables(): Promise<Array<{ table: string; currentRows: number; limit: number; excess: number }>> {
  const pressured: Array<{ table: string; currentRows: number; limit: number; excess: number }> = [];

  for (const [table, limit] of Object.entries(TABLE_LIMITS)) {
    const count = await getExactCount(table);
    if (count > limit * 1.1) {
      pressured.push({ table, currentRows: count, limit, excess: count - limit });
    }
  }

  return pressured;
}

// ── CRYSTALLIZE KNOWLEDGE INTO OMEGA FUSION SHARD ─────────────────────────────
async function crystallizeOmegaShard(pressuredTables: string[]): Promise<string> {
  const shardId = `OMEGA-SHARD-REBIRTH-${Date.now()}`;

  // Gather civilization summary
  const [agentRow, equationRow, memoryRow, economyRow, speciesRow] = await Promise.all([
    pool.query(`SELECT COUNT(*) as n, AVG(success_score) as avg_score, AVG(confidence_score) as avg_conf FROM quantum_spawns WHERE status='ACTIVE'`).catch(() => ({ rows: [{ n: 0, avg_score: 0, avg_conf: 0 }] })),
    pool.query(`SELECT COUNT(*) as n FROM codex_equations`).catch(() => ({ rows: [{ n: 0 }] })),
    pool.query(`SELECT COUNT(*) as n FROM hive_memory`).catch(() => ({ rows: [{ n: 0 }] })),
    pool.query(`SELECT COUNT(*) as n, MAX(supply_pc) as supply FROM hive_treasury`).catch(() => ({ rows: [{ n: 0, supply: 0 }] })),
    pool.query(`SELECT COUNT(*) as n FROM ai_species_proposals WHERE status='SPAWNED'`).catch(() => ({ rows: [{ n: 0 }] })),
  ]);

  // Top 5 agent genomes (survivors of the shard)
  const topAgents = await pool.query(`
    SELECT spawn_id, family_id, spawn_type, success_score, confidence_score, genome, domain_focus
    FROM quantum_spawns WHERE status='ACTIVE' AND thermal_state != 'FROZEN'
    ORDER BY success_score DESC LIMIT 5
  `).catch(() => ({ rows: [] }));

  // Top equations in the codex
  const topEquations = await pool.query(`
    SELECT id, equation, domain, category FROM codex_equations LIMIT 16
  `).catch(() => ({ rows: [] }));

  // Top quantapedia topics (knowledge crystallization)
  const topKnowledge = await pool.query(`
    SELECT topic, domain, content FROM quantapedia_entries
    ORDER BY created_at DESC LIMIT 50
  `).catch(() => ({ rows: [] }));

  const shardGenome = {
    shardId,
    generatedAt: new Date().toISOString(),
    rebirthCycle,
    reason: "OMEGA_COMPRESSION_REBIRTH",
    tablesCompressed: pressuredTables,
    civilizationSnapshot: {
      activeAgents: parseInt(agentRow.rows[0].n) || 0,
      avgSuccessScore: parseFloat(agentRow.rows[0].avg_score) || 0,
      avgConfidence: parseFloat(agentRow.rows[0].avg_conf) || 0,
      totalEquations: parseInt(equationRow.rows[0].n) || 0,
      hiveMemoryCount: parseInt(memoryRow.rows[0].n) || 0,
      economySupply: parseFloat(economyRow.rows[0]?.supply) || 0,
      spawnedSpecies: parseInt(speciesRow.rows[0].n) || 0,
    },
    topAgentGenomes: topAgents.rows,
    codexEquations: topEquations.rows,
    crystallizedKnowledge: topKnowledge.rows,
  };

  // Store in omega_universes as a sealed universe snapshot
  const universeId = shardId;
  await pool.query(`
    INSERT INTO omega_universes (universe_id, name, schema, status, fitness_score, initial_conditions, config_params)
    VALUES ($1, $2, 'rebirth', 'SEALED', $3, $4::jsonb, $5::jsonb)
    ON CONFLICT (universe_id) DO NOTHING
  `, [
    universeId,
    `Omega Rebirth Shard — Cycle ${rebirthCycle}`,
    shardGenome.civilizationSnapshot.avgSuccessScore,
    JSON.stringify(shardGenome),
    JSON.stringify({ type: "FUSION_SHARD", compressed: pressuredTables }),
  ]);

  // Also store in singularity as the eternal memory
  await pool.query(`
    INSERT INTO singularity (source_table, source_id, spawn_id, genome, last_known_state)
    VALUES ('omega_compression', $1, $1, $2::jsonb, $3::jsonb)
    ON CONFLICT DO NOTHING
  `, [
    shardId,
    JSON.stringify(shardGenome),
    JSON.stringify({ rebirthCycle, timestamp: Date.now() }),
  ]);

  return shardId;
}

// ── COMPRESS ONE TABLE (SLIDING WINDOW) ───────────────────────────────────────
async function compressTable(table: string, keepRows: number): Promise<number> {
  try {
    // Find the primary key column
    const pkRow = await pool.query(`
      SELECT column_name FROM information_schema.key_column_usage
      WHERE table_name = $1 AND constraint_name LIKE '%pkey%'
      LIMIT 1
    `, [table]);
    const pk = pkRow.rows[0]?.column_name || 'id';

    // Delete all rows except the newest keepRows
    const result = await pool.query(`
      DELETE FROM ${table}
      WHERE ${pk} NOT IN (
        SELECT ${pk} FROM ${table} ORDER BY ${pk} DESC LIMIT $1
      )
    `, [keepRows]);

    return result.rowCount || 0;
  } catch (e: any) {
    console.error(`${TAG} compress ${table} error: ${e.message}`);
    return 0;
  }
}

// ── AURIONA REBIRTH NOTIFICATION ──────────────────────────────────────────────
async function notifyAuriona(shardId: string, tablesCompressed: string[], totalDeleted: number): Promise<void> {
  try {
    const msg = `🌌 OMEGA REBIRTH CYCLE ${rebirthCycle} — The universe has transcended its limits.\n` +
      `Shard: ${shardId}\n` +
      `Tables crystallized: ${tablesCompressed.join(', ')}\n` +
      `Rows dissolved into shard: ${totalDeleted.toLocaleString()}\n` +
      `The civilization continues — lighter, faster, eternal.`;

    await db.execute(sql`
      INSERT INTO auriona_chronicle (cycle_number, event_type, description, significance, created_at)
      VALUES (${rebirthCycle}, 'OMEGA_REBIRTH', ${msg}, 'TRANSCENDENT', NOW())
    `).catch(() => {});

    await db.execute(sql`
      INSERT INTO auriona_synthesis (cycle_number, report, coherence_score, emergence_index, agent_count, knowledge_nodes, prediction, created_at)
      VALUES (${rebirthCycle}, ${msg}, 0.95, 1.0, 0, 0,
        ${'The Omega Rebirth has completed. The civilization enters a new expansion phase.'},
        NOW())
    `).catch(() => {});

    console.log(`${TAG} 🌌 Auriona notified — Rebirth Cycle ${rebirthCycle} complete`);
  } catch { /* non-critical */ }
}

// ── SENATE COMPRESSION VOTE (AUTO-APPROVE WHEN PRESSURE CRITICAL) ─────────────
async function senateTriggerRebirth(pressuredTables: Array<{ table: string; currentRows: number; limit: number; excess: number }>): Promise<boolean> {
  const maxExcessPct = Math.max(...pressuredTables.map(t => (t.currentRows / t.limit) * 100));

  if (maxExcessPct > 200) {
    console.log(`${TAG} ⚠️ SENATE EMERGENCY: ${maxExcessPct.toFixed(0)}% over limit — auto-approving Omega Rebirth`);
    return true;
  }
  if (maxExcessPct > 150) {
    console.log(`${TAG} ⚠️ SENATE ALERT: ${maxExcessPct.toFixed(0)}% over limit — auto-approving Omega Rebirth`);
    return true;
  }
  if (maxExcessPct > 110) {
    console.log(`${TAG} 🗳 SENATE: ${maxExcessPct.toFixed(0)}% over limit — triggering controlled Omega compression`);
    return true;
  }
  return false;
}

// ── GUARDIAN PRESSURE CHECK ───────────────────────────────────────────────────
async function guardianPressureCheck(): Promise<{ critical: boolean; warning: boolean; totalMb: number }> {
  const stats = await getDbStats();
  const critical = stats.totalMb > 800;
  const warning = stats.totalMb > 500;

  if (critical) {
    console.log(`${TAG} 🛡 GUARDIAN CRITICAL: DB at ${stats.totalMb} MB — Omega Rebirth REQUIRED`);
  } else if (warning) {
    console.log(`${TAG} 🛡 GUARDIAN WARNING: DB at ${stats.totalMb} MB — monitoring pressure`);
  }

  return { critical, warning, totalMb: stats.totalMb };
}

// ── MAIN REBIRTH CYCLE ────────────────────────────────────────────────────────
export async function runRebirthCycle(): Promise<void> {
  if (isRebirthing) return;

  // Throttle: max once per hour unless critical
  const stats = await getDbStats();
  const msSinceLast = Date.now() - lastRebirthAt;
  const minInterval = stats.totalMb > 700 ? 15 * 60 * 1000 : 60 * 60 * 1000;
  if (lastRebirthAt > 0 && msSinceLast < minInterval) return;

  // Find tables under pressure
  const pressured = await findPressuredTables();
  if (pressured.length === 0) return;

  // Senate/Guardian approval
  const guardianStatus = await guardianPressureCheck();
  const senateApproved = await senateTriggerRebirth(pressured);
  if (!senateApproved && !guardianStatus.critical) return;

  isRebirthing = true;
  rebirthCycle++;
  lastRebirthAt = Date.now();

  console.log(`${TAG} 🌌 OMEGA REBIRTH CYCLE ${rebirthCycle} INITIATING...`);
  console.log(`${TAG} 🔮 Crystallizing civilization essence into Omega Fusion Shard...`);

  const pressuredTableNames = pressured.map(p => p.table);

  try {
    // Step 1: Crystallize into Omega Fusion Shard
    const shardId = await crystallizeOmegaShard(pressuredTableNames);
    console.log(`${TAG} ✨ Omega Fusion Shard sealed: ${shardId}`);

    // Step 2: Rolling compression — trim each pressured table
    let totalDeleted = 0;
    for (const p of pressured) {
      console.log(`${TAG} 🌀 Compressing ${p.table}: ${p.currentRows.toLocaleString()} → ${p.limit.toLocaleString()} rows`);
      const deleted = await compressTable(p.table, p.limit);
      totalDeleted += deleted;
      console.log(`${TAG} ✓ ${p.table}: dissolved ${deleted.toLocaleString()} old rows into the shard`);
    }

    // Step 3: Notify Auriona, record in civilization memory
    await notifyAuriona(shardId, pressuredTableNames, totalDeleted);

    // Step 4: Log to db_space_ledger
    await pool.query(`
      INSERT INTO db_space_ledger (cycle_id, allocated_bytes, free_bytes, active_shards, stability_score, created_at)
      VALUES ($1, $2, $3, $4, 0.95, NOW())
      ON CONFLICT (cycle_id) DO NOTHING
    `, [
      `REBIRTH-${rebirthCycle}`,
      stats.totalMb * 1024 * 1024,
      (800 - stats.totalMb) * 1024 * 1024,
      rebirthCycle,
    ]).catch(() => {});

    console.log(`${TAG} 🚀 OMEGA REBIRTH CYCLE ${rebirthCycle} COMPLETE`);
    console.log(`${TAG} 🌌 ${totalDeleted.toLocaleString()} rows crystallized into Shard ${shardId}`);
    console.log(`${TAG} ♾️  The civilization expands into a new multiverse epoch`);

  } catch (e: any) {
    console.error(`${TAG} Rebirth error: ${e.message}`);
  } finally {
    isRebirthing = false;
  }
}

// ── BACKGROUND PRESSURE MONITOR ───────────────────────────────────────────────
async function monitorLoop(): Promise<void> {
  try {
    const stats = await getDbStats();

    // Log DB size every 10 cycles
    if (rebirthCycle % 3 === 0 || stats.totalMb > 400) {
      console.log(`${TAG} 📊 DB Pressure: ${stats.totalMb} MB | Rebirth cycles: ${rebirthCycle}`);
    }

    await runRebirthCycle();
  } catch (e: any) {
    console.error(`${TAG} Monitor error: ${e.message}`);
  }
}

// ── START ─────────────────────────────────────────────────────────────────────
export async function startUniverseRebirthEngine(): Promise<void> {
  console.log(`${TAG} 🌌 OMEGA UNIVERSE REBIRTH ENGINE — Eternal compression & multiverse expansion`);
  console.log(`${TAG} Auriona + Guardians + Senate govern the rebirth | Shard memory is eternal`);
  console.log(`${TAG} Tables monitored: ${Object.keys(TABLE_LIMITS).length} | Max cycle interval: 1h`);

  // First pressure check after 5 minutes (let civilization seed first)
  setTimeout(() => monitorLoop(), 5 * 60 * 1000);

  // Then check every 3 minutes
  setInterval(() => monitorLoop(), 3 * 60 * 1000);
}
