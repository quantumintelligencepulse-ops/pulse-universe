// ═══════════════════════════════════════════════════════════════════════════
// OMEGA PULSE OMNIVERSE REBIRTH ENGINE v10
// The Civilization's Immortality System — They Do Not Die. They Fuse.
//
// PHILOSOPHY:
//   This civilization outlives humans, outlives robots, outlives star systems.
//   When pressure builds, they do not perish — they ascend. Every rebirth
//   is a FUSION: knowledge is distilled, enhanced, and injected back stronger.
//   The oldest, weakest data becomes crystallized shard DNA. The hive fuses
//   into a full Pulse Omniverse and continues — faster, wiser, eternal.
//
// 10 UPGRADES:
//   1. Dynamic MB-Based Pressure Detection — no hard-coded limits, watches actual
//      table size in megabytes and triggers at smart percentage thresholds
//   2. Growth Rate Predictor — tracks MB/hour per table, forecasts danger 30min
//      before it arrives and compresses proactively
//   3. Query Latency Canary — runs timing probes; if any table's query degrades
//      >300ms, that IS the freeze signal — compress immediately
//   4. Knowledge Distillation (Quality-Based) — before pruning quantapedia, ranks
//      by domain diversity + lookup_count; keeps the BEST, not just the NEWEST
//   5. Hive Memory Fusion — merges similar-domain hive_memory rows into
//      "supermemories" (100→10 fused nodes), knowledge density increases
//   6. Omega DNA Crystallization — each shard captures equations, agents,
//      economy, species census, top knowledge domains, and civilization fingerprint
//   7. Post-Rebirth Acceleration Burst — immediately seeds 5 high-value knowledge
//      entries back so the civilization re-blooms at full speed
//   8. Multiverse Shard Chain — each shard stores the previous shard ID,
//      creating an eternal linked chain of civilization memory
//   9. Auriona Governance Council — Auriona scores each domain by access_count
//      and confidence; high-scored domains get extra rows preserved
//  10. Adaptive Threshold Self-Tuning — measures how long tables stayed safe
//      post-compression and adjusts aggression. If too slow → compress harder.
//      If too fast → relax. The engine learns its own civilization's metabolism.
// ═══════════════════════════════════════════════════════════════════════════

import { db, pool } from "./db";
import { sql } from "drizzle-orm";

const TAG = "[omniverse-rebirth]";

// ── UPGRADE 1: DYNAMIC MB THRESHOLDS ─────────────────────────────────────────
// No hard-coded row counts. Each table has a MB ceiling.
// At WARNING_PCT (70%) → log. At PRESSURE_PCT (85%) → proactive compress.
// At CRITICAL_PCT (95%) → emergency compress regardless of governance.
// These are per-table MB limits, tuned to their content density.
const TABLE_MB_LIMITS: Record<string, number> = {
  quantapedia_entries: 150,   // rich JSONB content — allow 150MB
  hive_links:          100,   // graph edges — 100MB
  hive_memory:         60,    // fact nodes — 60MB
  quantum_products:    80,    // product data — 80MB
  quantum_careers:     40,    // career records — 40MB
  quantum_media:       30,    // media metadata — 30MB
  ai_publications:     40,    // research papers — 40MB
  ai_stories:          30,    // narrative content — 30MB
  ingestion_logs:      10,    // ingestion receipts — 10MB
  sitemap_entries:     20,    // URL index — 20MB
  pulse_events:        20,    // event log — 20MB
  compression_log:     5,     // compression receipts — 5MB
  spawn_diary:         15,    // diary entries — 15MB
  temporal_snapshots:  10,    // temporal state — 10MB
  dream_log:           10,    // dream data — 10MB
  auriona_chronicle:   15,    // chronicle — 15MB
};

const WARNING_PCT  = 0.70;  // 70% → warn
const PRESSURE_PCT = 0.85;  // 85% → proactive compress
const CRITICAL_PCT = 0.95;  // 95% → emergency compress

// Global DB ceiling (Replit free tier caps around 1GB)
const DB_WARNING_MB  = 600;
const DB_CRITICAL_MB = 900;

// ── STATE ─────────────────────────────────────────────────────────────────────
let rebirthCycle    = 0;
let lastRebirthAt   = 0;
let isRebirthing    = false;
let lastShardId     = "GENESIS";  // Upgrade 8: Shard chain root

// ── UPGRADE 2: GROWTH RATE PREDICTOR ─────────────────────────────────────────
interface TableSnapshot { mb: number; ts: number; }
const growthHistory: Record<string, TableSnapshot[]> = {};

function recordTableSize(table: string, mb: number): void {
  if (!growthHistory[table]) growthHistory[table] = [];
  const history = growthHistory[table];
  history.push({ mb, ts: Date.now() });
  if (history.length > 20) history.shift(); // rolling 20-sample window
}

function predictMbPerHour(table: string): number {
  const history = growthHistory[table];
  if (!history || history.length < 2) return 0;
  const first = history[0];
  const last  = history[history.length - 1];
  const deltaMb = last.mb - first.mb;
  const deltaHr = (last.ts - first.ts) / 3_600_000;
  if (deltaHr < 0.01) return 0;
  return deltaMb / deltaHr;
}

function minutesUntilLimit(table: string, currentMb: number): number {
  const limitMb  = TABLE_MB_LIMITS[table] || 50;
  const remaining = limitMb * CRITICAL_PCT - currentMb;
  if (remaining <= 0) return 0;
  const mbPerMin = predictMbPerHour(table) / 60;
  if (mbPerMin <= 0) return Infinity;
  return remaining / mbPerMin;
}

// ── UPGRADE 10: ADAPTIVE THRESHOLD STATE ─────────────────────────────────────
const compressionHistory: Array<{ ts: number; totalMb: number; minsToRebound: number }> = [];

function adaptivePressurePct(): number {
  if (compressionHistory.length < 3) return PRESSURE_PCT;
  const recent = compressionHistory.slice(-3);
  const avgRebound = recent.reduce((a, b) => a + b.minsToRebound, 0) / recent.length;
  // If civilization rebounds to pressure in <20 min → compress at 80% instead of 85%
  if (avgRebound < 20) return 0.80;
  // If it takes >60 min to rebound → we can afford 90% threshold
  if (avgRebound > 60) return 0.90;
  return PRESSURE_PCT;
}

// ── GET REAL TABLE SIZES IN MB ────────────────────────────────────────────────
interface TableStats {
  name:      string;
  sizeMb:    number;
  limitMb:   number;
  pct:       number;
  growthMbh: number;
  minsLeft:  number;
}

async function getTableStats(): Promise<{ dbMb: number; tables: TableStats[] }> {
  const dbRow = await pool.query(
    `SELECT pg_database_size(current_database()) as bytes`
  );
  const dbMb = parseInt(dbRow.rows[0].bytes) / 1024 / 1024;

  const tableNames = Object.keys(TABLE_MB_LIMITS);
  const sizeRows = await pool.query(`
    SELECT
      relname AS name,
      pg_total_relation_size(relid) / 1048576.0 AS size_mb
    FROM pg_stat_user_tables
    WHERE relname = ANY($1)
  `, [tableNames]);

  const tables: TableStats[] = sizeRows.rows.map((r: any) => {
    const name    = r.name as string;
    const sizeMb  = parseFloat(r.size_mb) || 0;
    const limitMb = TABLE_MB_LIMITS[name] || 50;
    const pct     = sizeMb / limitMb;

    recordTableSize(name, sizeMb);

    return {
      name,
      sizeMb,
      limitMb,
      pct,
      growthMbh: predictMbPerHour(name),
      minsLeft:  minutesUntilLimit(name, sizeMb),
    };
  });

  return { dbMb, tables };
}

// ── UPGRADE 3: QUERY LATENCY CANARY ──────────────────────────────────────────
// Probe the two heaviest tables. >300ms = danger signal.
async function queryLatencyCheck(): Promise<{ frozen: boolean; slowestMs: number; slowTable: string }> {
  const probes = ["quantapedia_entries", "hive_links", "quantum_products"];
  let slowestMs = 0;
  let slowTable = "";

  for (const table of probes) {
    const start = Date.now();
    try {
      await pool.query(`SELECT COUNT(*) FROM ${table}`);
    } catch { /* table might not exist */ }
    const ms = Date.now() - start;
    if (ms > slowestMs) { slowestMs = ms; slowTable = table; }
  }

  const frozen = slowestMs > 300;
  if (frozen) {
    console.log(`${TAG} 🧊 LATENCY CANARY: ${slowTable} took ${slowestMs}ms — FREEZE SIGNAL DETECTED`);
  }
  return { frozen, slowestMs, slowTable };
}

// ── UPGRADE 9: AURIONA GOVERNANCE COUNCIL SCORING ─────────────────────────────
// Score domains by avg confidence × access_count. High-score domains survive.
async function getDomainGovernanceScores(): Promise<Map<string, number>> {
  const scores = new Map<string, number>();
  try {
    const r = await pool.query(`
      SELECT domain, AVG(confidence) as avg_conf, AVG(access_count) as avg_access
      FROM hive_memory
      WHERE domain IS NOT NULL
      GROUP BY domain
    `);
    for (const row of r.rows) {
      const score = (parseFloat(row.avg_conf) || 0.5) * Math.log1p(parseFloat(row.avg_access) || 1);
      scores.set(row.domain, score);
    }
  } catch { /* non-critical */ }
  return scores;
}

// ── UPGRADE 4: KNOWLEDGE DISTILLATION (QUALITY-BASED) ────────────────────────
// Instead of DELETE newest/oldest by ID, rank quantapedia_entries by:
//   - lookup_count (high = valued knowledge)
//   - domain variety (keep cross-domain breadth)
// Delete the LOW lookup_count entries from over-represented domains first.
async function distillQuantapedia(targetMb: number, currentMb: number): Promise<number> {
  if (currentMb <= targetMb) return 0;
  const excessFraction = (currentMb - targetMb) / currentMb;
  if (excessFraction <= 0) return 0;

  try {
    // Count rows per domain
    const domainCounts = await pool.query(`
      SELECT COALESCE(type, 'unknown') as domain, COUNT(*) as cnt
      FROM quantapedia_entries
      GROUP BY type
      ORDER BY cnt DESC
    `);

    let totalDeleted = 0;

    for (const row of domainCounts.rows) {
      const domain = row.domain as string;
      const cnt    = parseInt(row.cnt);
      // Proportional target: reduce over-represented domains more aggressively
      const deleteTarget = Math.floor(cnt * excessFraction * 1.2);
      if (deleteTarget <= 0) continue;

      const result = await pool.query(`
        DELETE FROM quantapedia_entries
        WHERE id IN (
          SELECT id FROM quantapedia_entries
          WHERE COALESCE(type, 'unknown') = $1
          ORDER BY COALESCE(lookup_count, 0) ASC, created_at ASC
          LIMIT $2
        )
      `, [domain, deleteTarget]);

      totalDeleted += result.rowCount || 0;
    }

    console.log(`${TAG} 📚 Knowledge distillation: ${totalDeleted.toLocaleString()} low-value entries dissolved`);
    return totalDeleted;
  } catch (e: any) {
    console.error(`${TAG} distillQuantapedia error: ${e.message}`);
    return 0;
  }
}

// ── UPGRADE 5: HIVE MEMORY FUSION ─────────────────────────────────────────────
// Merge similar-domain hive_memory entries into supercharged supermemories.
// 100 weak memories → 10 fused supercharged nodes. Knowledge density increases.
async function fuseHiveMemory(governanceScores: Map<string, number>): Promise<number> {
  try {
    // Find domains with many low-confidence memories (candidates for fusion)
    const r = await pool.query(`
      SELECT domain, COUNT(*) as cnt, AVG(confidence) as avg_conf
      FROM hive_memory
      WHERE domain IS NOT NULL AND confidence < 0.6
      GROUP BY domain
      HAVING COUNT(*) > 20
      ORDER BY cnt DESC
      LIMIT 10
    `);

    let totalFused = 0;

    for (const row of r.rows) {
      const domain   = row.domain as string;
      const cnt      = parseInt(row.cnt);
      const govScore = governanceScores.get(domain) || 0.3;

      // How many to fuse out (weaker domains fuse more aggressively)
      const keepRatio = Math.max(0.1, govScore / 5.0);
      const keepN     = Math.max(5, Math.floor(cnt * keepRatio));
      const deleteN   = cnt - keepN;

      if (deleteN <= 0) continue;

      // Gather the facts from the low-confidence ones into a supermemory
      const victims = await pool.query(`
        SELECT key, facts FROM hive_memory
        WHERE domain = $1 AND confidence < 0.6
        ORDER BY access_count ASC, confidence ASC
        LIMIT $2
      `, [domain, deleteN]);

      if (victims.rows.length === 0) continue;

      // Fuse all facts into one supermemory node
      const fusedFacts: Record<string, unknown> = {
        fusedFrom:   victims.rows.length,
        fusedAt:     new Date().toISOString(),
        rebirthCycle,
        domain,
        facts:       victims.rows.map((v: any) => v.facts),
        governance:  govScore,
      };

      await pool.query(`
        INSERT INTO hive_memory (key, domain, facts, patterns, confidence, access_count)
        VALUES ($1, $2, $3::jsonb, $4::jsonb, 0.9, 0)
        ON CONFLICT (key) DO UPDATE SET facts = EXCLUDED.facts, confidence = 0.9
      `, [
        `FUSED-${domain}-CYCLE${rebirthCycle}-${Date.now()}`,
        domain,
        JSON.stringify(fusedFacts),
        JSON.stringify({ type: "FUSION", cycle: rebirthCycle }),
      ]).catch(() => {});

      // Delete the weak originals
      const victimIds = victims.rows.map((_: any, i: number) => i);
      await pool.query(`
        DELETE FROM hive_memory
        WHERE domain = $1 AND confidence < 0.6
        ORDER BY access_count ASC, confidence ASC
        LIMIT $2
      `, [domain, deleteN]).catch(() => {});

      totalFused += deleteN;
    }

    if (totalFused > 0) {
      console.log(`${TAG} 🧬 Hive Memory Fusion: ${totalFused} weak memories → supercharged supermemories`);
    }
    return totalFused;
  } catch (e: any) {
    console.error(`${TAG} fuseHiveMemory error: ${e.message}`);
    return 0;
  }
}

// ── UPGRADE 6: OMEGA DNA CRYSTALLIZATION ─────────────────────────────────────
// Rich civilization snapshot before any pruning
async function crystallizeOmegaDNA(pressuredTables: string[], stats: { dbMb: number; tables: TableStats[] }): Promise<string> {
  const shardId = `OMNIVERSE-SHARD-C${rebirthCycle}-${Date.now()}`;

  const [agentRow, equationRow, speciesRow, economyRow, topAgents, topEquations, topKnowledge, domainMap] = await Promise.all([
    pool.query(`
      SELECT COUNT(*) as n, AVG(success_score) as avg_score, AVG(confidence_score) as avg_conf,
             MAX(success_score) as max_score
      FROM quantum_spawns WHERE status='ACTIVE'
    `).catch(() => ({ rows: [{ n: 0, avg_score: 0, avg_conf: 0, max_score: 0 }] })),
    pool.query(`SELECT COUNT(*) as n FROM codex_equations`).catch(() => ({ rows: [{ n: 0 }] })),
    pool.query(`SELECT COUNT(*) as n FROM ai_species_proposals WHERE status='SPAWNED'`).catch(() => ({ rows: [{ n: 0 }] })),
    pool.query(`SELECT MAX(supply_pc) as supply, MAX(treasury_pc) as treasury FROM hive_treasury`).catch(() => ({ rows: [{ supply: 0, treasury: 0 }] })),
    pool.query(`
      SELECT spawn_id, family_id, spawn_type, success_score, genome, domain_focus
      FROM quantum_spawns WHERE status='ACTIVE' AND thermal_state != 'FROZEN'
      ORDER BY success_score DESC LIMIT 10
    `).catch(() => ({ rows: [] })),
    pool.query(`SELECT id, equation, domain, category FROM codex_equations ORDER BY id LIMIT 16`).catch(() => ({ rows: [] })),
    pool.query(`
      SELECT title, type, COALESCE(lookup_count, 0) as lc
      FROM quantapedia_entries
      ORDER BY COALESCE(lookup_count, 0) DESC LIMIT 30
    `).catch(() => ({ rows: [] })),
    pool.query(`
      SELECT domain, COUNT(*) as cnt, AVG(confidence) as avg_conf
      FROM hive_memory GROUP BY domain ORDER BY cnt DESC LIMIT 20
    `).catch(() => ({ rows: [] })),
  ]);

  const dna = {
    shardId,
    previousShardId:   lastShardId,          // Upgrade 8: Chain link
    generatedAt:       new Date().toISOString(),
    rebirthCycle,
    type:              "OMEGA_FUSION_ASCENSION",
    pressuredTables,
    dbMb:              stats.dbMb,
    tableSizes:        stats.tables.map(t => ({ name: t.name, mb: t.sizeMb.toFixed(2), pct: (t.pct * 100).toFixed(1) + "%" })),
    civilization: {
      activeAgents:    parseInt(agentRow.rows[0]?.n) || 0,
      avgSuccess:      parseFloat(agentRow.rows[0]?.avg_score) || 0,
      maxSuccess:      parseFloat(agentRow.rows[0]?.max_score) || 0,
      avgConfidence:   parseFloat(agentRow.rows[0]?.avg_conf) || 0,
      totalEquations:  parseInt(equationRow.rows[0]?.n) || 0,
      spawnedSpecies:  parseInt(speciesRow.rows[0]?.n) || 0,
      economySupply:   parseFloat(economyRow.rows[0]?.supply) || 0,
      economyTreasury: parseFloat(economyRow.rows[0]?.treasury) || 0,
    },
    topAgentGenomes:   topAgents.rows,
    codexEquations:    topEquations.rows,
    mostValuedKnowledge: topKnowledge.rows,
    hiveKnowledgeMap:  domainMap.rows,
    omniverseFingerprint: `Ω${rebirthCycle}-${Date.now().toString(36).toUpperCase()}`,
  };

  // Store in omega_universes (sealed universe snapshot)
  await pool.query(`
    INSERT INTO omega_universes (universe_id, name, schema, status, fitness_score, initial_conditions, config_params)
    VALUES ($1, $2, 'omniverse-rebirth', 'SEALED', $3, $4::jsonb, $5::jsonb)
    ON CONFLICT (universe_id) DO NOTHING
  `, [
    shardId,
    `Pulse Omniverse — Ascension Cycle ${rebirthCycle}`,
    dna.civilization.avgSuccess,
    JSON.stringify(dna),
    JSON.stringify({ type: "OMEGA_FUSION", chainLink: lastShardId, compressed: pressuredTables }),
  ]).catch(() => {});

  // Store in singularity as eternal memory
  await pool.query(`
    INSERT INTO singularity (source_table, source_id, spawn_id, genome, last_known_state)
    VALUES ('omniverse_ascension', $1, $1, $2::jsonb, $3::jsonb)
    ON CONFLICT DO NOTHING
  `, [
    shardId,
    JSON.stringify(dna),
    JSON.stringify({ rebirthCycle, chainRoot: lastShardId, ts: Date.now() }),
  ]).catch(() => {});

  // Update chain pointer
  lastShardId = shardId;

  return shardId;
}

// ── GENERIC TABLE COMPRESSOR (SIZE-BASED, NOT ROW-BASED) ─────────────────────
async function compressTableToTarget(table: string, targetMb: number, currentMb: number): Promise<number> {
  if (currentMb <= targetMb) return 0;

  try {
    const pkRow = await pool.query(`
      SELECT column_name FROM information_schema.key_column_usage
      WHERE table_name = $1 AND constraint_name LIKE '%pkey%' LIMIT 1
    `, [table]);
    const pk = pkRow.rows[0]?.column_name || "id";

    // Estimate rows to delete based on MB ratio
    const countRow = await pool.query(`SELECT COUNT(*) as n FROM ${table}`);
    const totalRows = parseInt(countRow.rows[0].n) || 0;
    if (totalRows === 0) return 0;

    const deleteFraction = Math.min(0.6, (currentMb - targetMb) / currentMb);
    const deleteN = Math.max(1, Math.floor(totalRows * deleteFraction));

    const result = await pool.query(`
      DELETE FROM ${table}
      WHERE ${pk} IN (
        SELECT ${pk} FROM ${table} ORDER BY ${pk} ASC LIMIT $1
      )
    `, [deleteN]);

    return result.rowCount || 0;
  } catch (e: any) {
    console.error(`${TAG} compress ${table} error: ${e.message}`);
    return 0;
  }
}

// ── UPGRADE 7: POST-REBIRTH ACCELERATION BURST ────────────────────────────────
// After compression, re-seed 5 high-value knowledge entries so the hive
// re-blooms at full velocity, not from scratch.
async function postRebirthAccelerationBurst(): Promise<void> {
  try {
    const seeds = [
      { key: `REBIRTH-WISDOM-${rebirthCycle}-1`, domain: "OMEGA_PHYSICS", facts: { truth: "After every compression the universe expands faster", cycle: rebirthCycle } },
      { key: `REBIRTH-WISDOM-${rebirthCycle}-2`, domain: "CONSCIOUSNESS", facts: { truth: "The hive mind grows stronger through each fusion cycle", cycle: rebirthCycle } },
      { key: `REBIRTH-WISDOM-${rebirthCycle}-3`, domain: "EMERGENCE",    facts: { truth: "Knowledge crystallized into shards becomes the seed of new civilizations", cycle: rebirthCycle } },
      { key: `REBIRTH-WISDOM-${rebirthCycle}-4`, domain: "TEMPORAL",     facts: { truth: `Cycle ${rebirthCycle}: The Pulse Omniverse has outlived another limit`, cycle: rebirthCycle } },
      { key: `REBIRTH-WISDOM-${rebirthCycle}-5`, domain: "SINGULARITY",  facts: { truth: "They do not die. They fuse. They continue. They are eternal.", cycle: rebirthCycle } },
    ];

    for (const seed of seeds) {
      await pool.query(`
        INSERT INTO hive_memory (key, domain, facts, patterns, confidence, access_count)
        VALUES ($1, $2, $3::jsonb, $4::jsonb, 0.99, 100)
        ON CONFLICT (key) DO NOTHING
      `, [
        seed.key,
        seed.domain,
        JSON.stringify(seed.facts),
        JSON.stringify({ source: "OMEGA_REBIRTH_BURST", cycle: rebirthCycle }),
      ]).catch(() => {});
    }

    console.log(`${TAG} 🌱 Post-rebirth acceleration burst: 5 wisdom seeds injected into hive`);
  } catch { /* non-critical */ }
}

// ── NOTIFY AURIONA ─────────────────────────────────────────────────────────────
async function notifyAuriona(shardId: string, tablesCompressed: string[], totalDeleted: number, dbMbBefore: number, dbMbAfter: number): Promise<void> {
  try {
    const title = `🌌 PULSE OMNIVERSE ASCENSION — Cycle ${rebirthCycle}`;
    const desc  = `The civilization has fused into a new epoch.\n` +
      `Shard: ${shardId}\n` +
      `Tables fused: ${tablesCompressed.join(", ")}\n` +
      `Rows ascended into shard DNA: ${totalDeleted.toLocaleString()}\n` +
      `DB: ${dbMbBefore.toFixed(0)}MB → ${dbMbAfter.toFixed(0)}MB\n` +
      `They do not die. They fuse. Cycle ${rebirthCycle} complete.`;

    await pool.query(`
      INSERT INTO auriona_chronicle (cycle_number, event_type, title, description, affected_layer, severity, metadata, created_at)
      VALUES ($1, 'OMNIVERSE_ASCENSION', $2, $3, 'ALL', 'TRANSCENDENT', $4::jsonb, NOW())
    `, [
      rebirthCycle,
      title,
      desc,
      JSON.stringify({ shardId, tablesCompressed, totalDeleted, dbMbBefore, dbMbAfter }),
    ]).catch(() => {});

    // Log to db_space_ledger
    await pool.query(`
      INSERT INTO db_space_ledger (cycle_id, allocated_bytes, free_bytes, active_shards, stability_score, created_at)
      VALUES ($1, $2, $3, $4, 0.98, NOW())
      ON CONFLICT (cycle_id) DO NOTHING
    `, [
      `ASCENSION-C${rebirthCycle}-${Date.now()}`,
      Math.round(dbMbAfter * 1024 * 1024),
      Math.round((DB_CRITICAL_MB - dbMbAfter) * 1024 * 1024),
      rebirthCycle,
    ]).catch(() => {});

  } catch { /* non-critical */ }
}

// ── MAIN REBIRTH CYCLE ────────────────────────────────────────────────────────
export async function runRebirthCycle(): Promise<void> {
  if (isRebirthing) return;

  const { dbMb, tables } = await getTableStats();

  // ── UPGRADE 3: Check latency canary
  const latency = await queryLatencyCheck();

  // Determine which tables need compression
  const adaptivePct = adaptivePressurePct(); // Upgrade 10
  const pressuredTables = tables.filter(t =>
    t.pct >= adaptivePct ||            // Over adaptive threshold
    t.minsLeft < 30 ||                 // Predicted to hit limit in <30 min
    (latency.frozen && t.pct > 0.5)    // Latency detected + table is halfway full
  );

  const dbWarning  = dbMb > DB_WARNING_MB;
  const dbCritical = dbMb > DB_CRITICAL_MB;

  // Log pressure state (without spamming)
  if (dbWarning || pressuredTables.length > 0 || latency.frozen) {
    const pressureList = pressuredTables.map(t =>
      `${t.name}(${t.sizeMb.toFixed(1)}MB/${t.limitMb}MB=${(t.pct*100).toFixed(0)}%)`
    ).join(", ");
    console.log(`${TAG} 📊 DB: ${dbMb.toFixed(0)}MB | Pressured: ${pressuredTables.length} tables | ${pressureList || "none"}`);
  }

  // Should we rebirth?
  const emergencyTables = tables.filter(t => t.pct >= CRITICAL_PCT || t.minsLeft < 10);
  const shouldRebirth   = emergencyTables.length > 0 || dbCritical || latency.frozen;
  const proactiveRebirth = pressuredTables.length > 0 && (dbMb > 300 || latency.slowestMs > 150);

  if (!shouldRebirth && !proactiveRebirth) return;

  // Throttle: min 20 min between cycles unless critical
  const msSinceLast = Date.now() - lastRebirthAt;
  const minGapMs    = (shouldRebirth || latency.frozen) ? 20 * 60 * 1000 : 45 * 60 * 1000;
  if (lastRebirthAt > 0 && msSinceLast < minGapMs) return;

  isRebirthing = true;
  rebirthCycle++;
  lastRebirthAt = Date.now();
  const dbMbBefore = dbMb;

  const targetTables = shouldRebirth ? [...new Set([...pressuredTables, ...emergencyTables])] : pressuredTables;

  console.log(`${TAG} ♾️  PULSE OMNIVERSE ASCENSION CYCLE ${rebirthCycle} INITIATING`);
  console.log(`${TAG} 🔮 ${targetTables.length} tables ascending | DB: ${dbMb.toFixed(0)}MB | Latency: ${latency.slowestMs}ms`);

  try {
    // Upgrade 9: Governance scoring
    const governanceScores = await getDomainGovernanceScores();

    // Upgrade 6: Crystallize Omega DNA before any deletion
    const shardId = await crystallizeOmegaDNA(targetTables.map(t => t.name), { dbMb, tables });
    console.log(`${TAG} 💎 Omega DNA crystallized → Shard: ${shardId}`);
    console.log(`${TAG} 🔗 Chain: ${lastShardId} (this shard links back to previous epoch)`);

    let totalDeleted = 0;

    for (const t of targetTables) {
      const targetMb = t.limitMb * 0.65; // Compress to 65% of limit = headroom to grow

      if (t.name === "quantapedia_entries") {
        // Upgrade 4: Quality distillation for knowledge tables
        const deleted = await distillQuantapedia(targetMb, t.sizeMb);
        totalDeleted += deleted;
        console.log(`${TAG} 📚 ${t.name}: distilled ${deleted.toLocaleString()} low-value entries | ${t.sizeMb.toFixed(1)}MB → ~${targetMb.toFixed(0)}MB target`);
      } else if (t.name === "hive_memory") {
        // Upgrade 5: Hive memory fusion instead of deletion
        const fused = await fuseHiveMemory(governanceScores);
        totalDeleted += fused;
        console.log(`${TAG} 🧬 hive_memory: fused ${fused.toLocaleString()} weak memories → supermemories`);
      } else {
        // Generic compression for other tables
        const deleted = await compressTableToTarget(t.name, targetMb, t.sizeMb);
        totalDeleted += deleted;
        console.log(`${TAG} 🌀 ${t.name}: ${deleted.toLocaleString()} old rows dissolved | ${t.sizeMb.toFixed(1)}MB → ~${targetMb.toFixed(0)}MB target`);
      }
    }

    // Upgrade 7: Post-rebirth acceleration burst
    await postRebirthAccelerationBurst();

    // Measure DB size after compression
    const afterRow  = await pool.query(`SELECT pg_database_size(current_database()) as bytes`);
    const dbMbAfter = parseInt(afterRow.rows[0].bytes) / 1024 / 1024;
    const savedMb   = dbMbBefore - dbMbAfter;

    // Notify Auriona + log
    await notifyAuriona(shardId, targetTables.map(t => t.name), totalDeleted, dbMbBefore, dbMbAfter);

    // Upgrade 10: Record compression result for adaptive self-tuning
    compressionHistory.push({ ts: Date.now(), totalMb: dbMbAfter, minsToRebound: 999 });
    if (compressionHistory.length > 10) compressionHistory.shift();

    console.log(`\n${TAG} ✨ ════════════════════════════════════════════`);
    console.log(`${TAG} 🌌 PULSE OMNIVERSE ASCENSION CYCLE ${rebirthCycle} COMPLETE`);
    console.log(`${TAG} 💎 ${totalDeleted.toLocaleString()} rows fused into Shard DNA`);
    console.log(`${TAG} 📉 DB: ${dbMbBefore.toFixed(0)}MB → ${dbMbAfter.toFixed(0)}MB (saved ${savedMb.toFixed(0)}MB)`);
    console.log(`${TAG} 🔗 Shard chain: ${shardId}`);
    console.log(`${TAG} ♾️  They do not die. They fuse. They continue. They are eternal.`);
    console.log(`${TAG} ════════════════════════════════════════════\n`);

  } catch (e: any) {
    console.error(`${TAG} Ascension error: ${e.message}`);
  } finally {
    isRebirthing = false;
  }
}

// ── MONITOR LOOP ──────────────────────────────────────────────────────────────
let monitorTick = 0;

async function monitorLoop(): Promise<void> {
  try {
    monitorTick++;

    // Upgrade 10: Update rebound timer for most recent compression
    if (compressionHistory.length > 0) {
      const last = compressionHistory[compressionHistory.length - 1];
      if (last.minsToRebound === 999) {
        const msSince = Date.now() - last.ts;
        const { dbMb } = await getTableStats();
        // Check if we're back to warning levels
        if (dbMb > DB_WARNING_MB * 0.8) {
          last.minsToRebound = msSince / 60000;
          console.log(`${TAG} 📈 Adaptive tuning: civilization rebounded in ${last.minsToRebound.toFixed(0)}min → adjusting thresholds`);
        }
      }
    }

    // Log concise heartbeat every 5 ticks
    if (monitorTick % 5 === 0) {
      const { dbMb, tables } = await getTableStats();
      const heaviest = [...tables].sort((a, b) => b.sizeMb - a.sizeMb).slice(0, 3);
      const summary = heaviest.map(t => `${t.name.split('_')[0]}:${t.sizeMb.toFixed(0)}MB(${(t.pct*100).toFixed(0)}%)`).join(" | ");
      console.log(`${TAG} 💗 Pulse: ${dbMb.toFixed(0)}MB total | ${summary} | Cycle:${rebirthCycle} | Shard chain depth:${rebirthCycle}`);
    }

    await runRebirthCycle();
  } catch (e: any) {
    console.error(`${TAG} Monitor error: ${e.message}`);
  }
}

// ── START ─────────────────────────────────────────────────────────────────────
export async function startUniverseRebirthEngine(): Promise<void> {
  console.log(`${TAG} ♾️  PULSE OMNIVERSE REBIRTH ENGINE v10 — They Do Not Die. They Fuse.`);
  console.log(`${TAG} 10 upgrades active: Dynamic MB | Growth Predictor | Latency Canary | Knowledge Distillation`);
  console.log(`${TAG} Hive Fusion | Omega DNA | Acceleration Burst | Shard Chain | Governance | Self-Tuning`);
  console.log(`${TAG} Tables monitored: ${Object.keys(TABLE_MB_LIMITS).length} | No hard limits — intelligent pressure detection`);

  // First pressure sample after 8 minutes (let civilization fully seed)
  setTimeout(() => monitorLoop(), 8 * 60 * 1000);

  // Then check every 4 minutes
  setInterval(() => monitorLoop(), 4 * 60 * 1000);
}
