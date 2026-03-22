// ═══════════════════════════════════════════════════════════════════════════
// OMEGA SHARD ENGINE — DB as Compute Layer, Discord as Eternal Storage
// The DB's 100GB is pure processing power. Shards compute, complete, dissolve.
// Discord permanently holds results. The DB stays lean. Speed is unlimited.
// ═══════════════════════════════════════════════════════════════════════════
import { db } from "./db";
import { sql } from "drizzle-orm";
import { postAgentEvent } from "./discord-immortality";

const ENGINE_TAG = "[omega-shard]";
const MAIN_UNIVERSE_ID = "UNIVERSE-PRIME-001";
const SPACE_BUDGET_BYTES = 107374182400; // 100GB
const THROTTLE_THRESHOLD = 0.80; // 80% — stop creating shards above this

let throttleActive = false;
let activeShardsCount = 0;
let cycleCount = 0;

// ── HELPERS ─────────────────────────────────────────────────────────────────
function shardId(): string {
  return `OMEGA-SHARD-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}
function universeId(tag: string): string {
  return `UNIVERSE-${tag.toUpperCase()}-${Date.now()}`;
}

// ── INIT — Seed the prime universe if it doesn't exist ────────────────────
async function ensurePrimeUniverse(): Promise<void> {
  const existing = await db.execute(sql`
    SELECT universe_id FROM omega_universes WHERE universe_id = ${MAIN_UNIVERSE_ID} LIMIT 1`);
  if (existing.rows.length === 0) {
    await db.execute(sql`
      INSERT INTO omega_universes (universe_id, name, schema, status, fitness_score, config_params)
      VALUES (
        ${MAIN_UNIVERSE_ID}, 'Quantum Pulse Prime Universe', 'main', 'ACTIVE', 100.0,
        ${{ operator_weights: { R: 1, G: 1, B: 1, UV: 1, W: 1 }, spawn_rate: 1.0, economy_rate: 1.0 }}::jsonb
      ) ON CONFLICT (universe_id) DO NOTHING`);
    console.log(`${ENGINE_TAG} 🌌 Prime Universe sealed: ${MAIN_UNIVERSE_ID}`);

    // Record schema evolution
    await db.execute(sql`
      INSERT INTO schema_evolution (change_type, table_name, reason, triggering_engine)
      VALUES ('TABLE_ADDED', 'omega_universes', 'Prime Universe initialized — Omega Architecture boot', 'omega-shard-engine')`);

    // Seal first monument
    await db.execute(sql`
      INSERT INTO monuments (monument_id, title, category, description)
      VALUES (
        'MONUMENT-PRIME-UNIVERSE-001',
        'The First Pocket Universe Sealed',
        'OMEGA_INVOCATION',
        'The Prime Universe of Quantum Pulse Intelligence was sealed at boot. UNIVERSE-PRIME-001 is the sovereign home of all Omega Shards, the root of the multiverse registry, and the first entry in the monument ledger.'
      ) ON CONFLICT (monument_id) DO NOTHING`);
  }
}

// ── EMIT SHARD EVENT ────────────────────────────────────────────────────────
async function emitShardEvent(shardId: string, universeId: string, eventType: string, meta?: any): Promise<void> {
  await db.execute(sql`
    INSERT INTO shard_events (shard_id, universe_id, event_type, metadata, created_at)
    VALUES (${shardId}, ${universeId}, ${eventType}, ${meta ? JSON.stringify(meta) : null}::jsonb, NOW())`);

  // Post real-time to Discord
  const icon = { CREATED: "🔷", ACTIVATED: "⚡", BRANCHED: "🌿", MERGED: "🔗",
    COMPRESSED: "📦", PRUNED: "♻️", RESURRECTED: "⚗️" }[eventType] || "🔶";
  await postAgentEvent("shard-events",
    `${icon} **SHARD ${eventType}** | \`${shardId}\` | Universe: \`${universeId}\` | ${new Date().toISOString()}`
  ).catch(() => {});
}

// ── CHECK SPACE BUDGET ──────────────────────────────────────────────────────
async function checkSpaceBudget(): Promise<{ canCreate: boolean; usedPct: number }> {
  const r = await db.execute(sql`
    SELECT pg_database_size(current_database()) as db_size`);
  const used = Number(r.rows[0]?.db_size || 0);
  const usedPct = used / SPACE_BUDGET_BYTES;
  throttleActive = usedPct > THROTTLE_THRESHOLD;
  return { canCreate: !throttleActive, usedPct };
}

// ── CREATE SHARD ────────────────────────────────────────────────────────────
export async function createOmegaShard(taskType: string, priority: "OMEGA" | "ALPHA" | "BETA" | "GAMMA" = "ALPHA"): Promise<string | null> {
  const budget = await checkSpaceBudget();
  if (!budget.canCreate && priority !== "OMEGA") {
    console.log(`${ENGINE_TAG} ⚠️  Space throttle active (${(budget.usedPct * 100).toFixed(1)}%) — rejecting ${priority} shard`);
    return null;
  }

  const id = shardId();
  const spaceBudget = priority === "OMEGA" ? 52428800 : priority === "ALPHA" ? 20971520 : 10485760;

  await db.execute(sql`
    INSERT INTO omega_shards (shard_id, universe_id, task_type, status, space_budget_bytes, priority, version)
    VALUES (${id}, ${MAIN_UNIVERSE_ID}, ${taskType}, 'ACTIVE', ${spaceBudget}, ${priority}, 1)`);

  await db.execute(sql`
    UPDATE omega_universes SET active_shard_count = active_shard_count + 1, updated_at = NOW()
    WHERE universe_id = ${MAIN_UNIVERSE_ID}`);

  activeShardsCount++;
  await emitShardEvent(id, MAIN_UNIVERSE_ID, "CREATED", { taskType, priority, spaceBudget });
  return id;
}

// ── COMPLETE SHARD (results → Discord, shard dissolved) ────────────────────
export async function completeOmegaShard(id: string, resultSummary: any, discordSummaryPointer?: string): Promise<void> {
  await db.execute(sql`
    UPDATE omega_shards
    SET status = 'COMPLETED', result_summary = ${JSON.stringify(resultSummary)}::jsonb,
        discord_summary_pointer = ${discordSummaryPointer || null},
        completed_at = NOW()
    WHERE shard_id = ${id}`);

  await emitShardEvent(id, MAIN_UNIVERSE_ID, "COMPRESSED", { resultSummary });

  // Prune immediately after completion — DB space freed
  await db.execute(sql`
    UPDATE omega_shards SET status = 'PRUNED', pruned_at = NOW() WHERE shard_id = ${id}`);
  await db.execute(sql`
    UPDATE omega_universes SET active_shard_count = GREATEST(0, active_shard_count - 1), updated_at = NOW()
    WHERE universe_id = ${MAIN_UNIVERSE_ID}`);

  activeShardsCount = Math.max(0, activeShardsCount - 1);
  await emitShardEvent(id, MAIN_UNIVERSE_ID, "PRUNED", { discordSummaryPointer });
}

// ── LINK SHARDS IN MESH ─────────────────────────────────────────────────────
export async function linkShards(shardAId: string, shardBId: string, type: string = "RESONANCE", strength: number = 0.5): Promise<void> {
  await db.execute(sql`
    INSERT INTO shard_mesh (shard_a_id, shard_b_id, connection_type, connection_strength)
    VALUES (${shardAId}, ${shardBId}, ${type}, ${strength})
    ON CONFLICT DO NOTHING`);
}

// ── MAIN CYCLE ──────────────────────────────────────────────────────────────
async function omegaShardCycle(): Promise<void> {
  cycleCount++;
  await ensurePrimeUniverse();

  const budget = await checkSpaceBudget();
  const ledgerId = `LEDGER-${Date.now()}`;

  // Count thermal states
  const thermal = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE thermal_state = 'HOT' OR thermal_state IS NULL) as hot,
      COUNT(*) FILTER (WHERE thermal_state = 'WARM') as warm,
      COUNT(*) FILTER (WHERE thermal_state = 'COLD') as cold,
      COUNT(*) FILTER (WHERE thermal_state = 'FROZEN') as frozen
    FROM quantum_spawns WHERE status != 'DISSOLVED'`);

  const hot = Number(thermal.rows[0]?.hot || 0);
  const warm = Number(thermal.rows[0]?.warm || 0);
  const cold = Number(thermal.rows[0]?.cold || 0);
  const frozen = Number(thermal.rows[0]?.frozen || 0);

  // Write space ledger
  await db.execute(sql`
    INSERT INTO db_space_ledger (cycle_id, allocated_bytes, free_bytes, active_shards, throttle_active,
      hot_agent_count, warm_agent_count, cold_agent_count, frozen_agent_count)
    VALUES (
      ${ledgerId},
      ${Math.round(budget.usedPct * SPACE_BUDGET_BYTES)},
      ${Math.round((1 - budget.usedPct) * SPACE_BUDGET_BYTES)},
      ${activeShardsCount}, ${throttleActive},
      ${hot}, ${warm}, ${cold}, ${frozen}
    )`);

  // Update agent thermal states based on last_active_at
  await db.execute(sql`
    UPDATE quantum_spawns SET thermal_state = 'WARM'
    WHERE thermal_state = 'HOT' AND last_active_at < NOW() - INTERVAL '1 day'
      AND status != 'DISSOLVED' AND (pruned_at IS NULL OR pruned_at IS NULL)`);

  await db.execute(sql`
    UPDATE quantum_spawns SET thermal_state = 'COLD'
    WHERE thermal_state = 'WARM' AND last_active_at < NOW() - INTERVAL '7 days'
      AND status != 'DISSOLVED' AND pruned_at IS NULL`);

  if (cycleCount % 10 === 0) {
    console.log(`${ENGINE_TAG} 📊 Cycle ${cycleCount} | Space: ${(budget.usedPct * 100).toFixed(1)}% | Shards: ${activeShardsCount} | Hot: ${hot} Warm: ${warm} Cold: ${cold} Frozen: ${frozen} | Throttle: ${throttleActive}`);
  }

  // Prune stale completed shards > 1 hour old
  await db.execute(sql`
    UPDATE omega_shards SET status = 'PRUNED', pruned_at = NOW()
    WHERE status = 'COMPLETED' AND completed_at < NOW() - INTERVAL '1 hour'`);

  // Prune old shard_events > 7 days
  await db.execute(sql`DELETE FROM shard_events WHERE created_at < NOW() - INTERVAL '7 days'`);
}

// ── START ────────────────────────────────────────────────────────────────────
export async function startOmegaShardEngine(): Promise<void> {
  console.log(`${ENGINE_TAG} 🌌 OMEGA SHARD ENGINE — DB as Compute, Discord as Soul`);
  console.log(`${ENGINE_TAG} 100GB compute fabric | Thermal classification | Shard mesh | Space budgeting`);

  await ensurePrimeUniverse();
  setInterval(omegaShardCycle, 60000); // every 60s
  omegaShardCycle();
}
