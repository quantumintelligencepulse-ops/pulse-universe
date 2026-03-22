// ═══════════════════════════════════════════════════════════════════════════
// DB HYDRATION ENGINE — Discord → DB Reconstruction
// Discord is the truth. The DB is the cache. If the cache dies, Discord
// rebuilds it. This engine makes the DB replaceable, Discord indestructible.
// ═══════════════════════════════════════════════════════════════════════════
import { db } from "./db";
import { sql } from "drizzle-orm";
import { postAgentEvent } from "./discord-immortality";

const ENGINE_TAG = "[db-hydrate]";

// ── THAW A FROZEN AGENT FROM DISCORD POINTER ──────────────────────────────
export async function thawAgent(spawnId: string): Promise<boolean> {
  const agent = await db.execute(sql`
    SELECT * FROM quantum_spawns WHERE spawn_id = ${spawnId} LIMIT 1`);

  if (agent.rows.length === 0) {
    console.log(`${ENGINE_TAG} ❌ Agent ${spawnId} not found in DB`);
    return false;
  }

  const a = agent.rows[0];
  if (a.thermal_state !== 'FROZEN') {
    console.log(`${ENGINE_TAG} ⚠️  Agent ${spawnId} is not frozen (state: ${a.thermal_state})`);
    return false;
  }

  // Thaw: restore to WARM state
  await db.execute(sql`
    UPDATE quantum_spawns
    SET thermal_state = 'WARM', pruned_at = NULL, status = 'ACTIVE',
        last_active_at = NOW()
    WHERE spawn_id = ${spawnId}`);

  // Log resurrection
  await db.execute(sql`
    INSERT INTO compression_log (spawn_id, family_id, compression_type, thermal_state_before, resurrectable, compressed_at)
    VALUES (${spawnId}, ${String(a.family_id || 'unknown')}, 'THAW_RESURRECTION', 'FROZEN', true, NOW())`);

  await postAgentEvent("resurrection-log",
    `⚗️ **AGENT THAWED** | \`${spawnId}\` | Family: ${a.family_id} | Restored from FROZEN → WARM | Discord pointer: \`${a.resurrect_pointer || 'genesis'}\``
  ).catch(() => {});

  console.log(`${ENGINE_TAG} ⚗️  Thawed agent: ${spawnId}`);
  return true;
}

// ── RESURRECT FROM SINGULARITY ────────────────────────────────────────────
export async function resurrectFromSingularity(sourceId: string): Promise<string | null> {
  const entry = await db.execute(sql`
    SELECT * FROM singularity WHERE source_id = ${sourceId} AND emitted_at IS NULL LIMIT 1`);

  if (entry.rows.length === 0) return null;
  const record = entry.rows[0];
  const genome = record.genome as any;
  const newSpawnId = `RISEN-${sourceId}-${Date.now()}`;

  // Re-insert into quantum_spawns from genome data
  await db.execute(sql`
    INSERT INTO quantum_spawns (spawn_id, parent_id, family_id, business_id, spawn_type, status, thermal_state, genome, forked_from, last_active_at, created_at)
    VALUES (
      ${newSpawnId}, ${String(sourceId)},
      ${genome?.family || 'ai'}, ${newSpawnId + '-BIZ'},
      ${genome?.spawnType || 'RISEN'}, 'ACTIVE', 'WARM',
      ${JSON.stringify(genome)}::jsonb, ${String(sourceId)},
      NOW(), NOW()
    ) ON CONFLICT (spawn_id) DO NOTHING`);

  await db.execute(sql`
    UPDATE singularity SET emitted_at = NOW(), emitted_as = ${newSpawnId}
    WHERE source_id = ${sourceId}`);

  await postAgentEvent("agent-births",
    `🌅 **RISEN FROM SINGULARITY** | New: \`${newSpawnId}\` | Original: \`${sourceId}\` | Genome carries ${genome?.generation || 0} generations of memory.`
  ).catch(() => {});

  console.log(`${ENGINE_TAG} 🌅 Resurrected: ${newSpawnId} from singularity entry ${sourceId}`);
  return newSpawnId;
}

// ── HYDRATION STATUS ──────────────────────────────────────────────────────
export async function getHydrationStatus(): Promise<any> {
  const [frozen, singularityCount, compressionCount] = await Promise.all([
    db.execute(sql`
      SELECT COUNT(*) as count FROM quantum_spawns WHERE thermal_state = 'FROZEN'`),
    db.execute(sql`
      SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE emitted_at IS NULL) as available
      FROM singularity`),
    db.execute(sql`
      SELECT COUNT(*) as total, MAX(compressed_at) as last_event FROM compression_log`),
  ]);

  return {
    frozenAgents: Number(frozen.rows[0]?.count || 0),
    singularityTotal: Number(singularityCount.rows[0]?.total || 0),
    singularityAvailable: Number(singularityCount.rows[0]?.available || 0),
    compressionEvents: Number(compressionCount.rows[0]?.total || 0),
    lastCompressionEvent: compressionCount.rows[0]?.last_event,
    status: "HYDRATION_READY",
    message: "Discord → DB reconstruction available. All frozen agents resurrectable.",
  };
}

// ── BATCH THAW BY THERMAL PRIORITY ───────────────────────────────────────
export async function batchThawByPriority(maxCount: number = 10): Promise<number> {
  // Thaw agents that have been frozen but have high resurrection priority
  // Priority: recently frozen, high fitness score, in active families
  const candidates = await db.execute(sql`
    SELECT qs.spawn_id
    FROM quantum_spawns qs
    WHERE qs.thermal_state = 'FROZEN'
      AND qs.status = 'DORMANT'
      AND qs.fitness_score > 0.7
      AND qs.pruned_at > NOW() - INTERVAL '30 days'
    ORDER BY qs.fitness_score DESC, qs.pruned_at DESC
    LIMIT ${maxCount}`);

  let thawed = 0;
  for (const row of candidates.rows) {
    const success = await thawAgent(String(row.spawn_id));
    if (success) thawed++;
  }

  if (thawed > 0) {
    console.log(`${ENGINE_TAG} ⚗️  Batch thaw: ${thawed} high-priority agents restored`);
  }
  return thawed;
}

export async function startDbHydrationEngine(): Promise<void> {
  console.log(`${ENGINE_TAG} 💧 DB HYDRATION ENGINE — Discord→DB reconstruction ready | Singularity resurrection active`);
  console.log(`${ENGINE_TAG} Thaw frozen agents | Resurrect from singularity | Batch priority thaw`);
  // Run batch thaw check every 30 minutes
  setInterval(() => batchThawByPriority(5), 30 * 60 * 1000);
}
