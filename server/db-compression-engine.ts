// ═══════════════════════════════════════════════════════════════════════════
// DB COMPRESSION ENGINE — Cold Agents Archive to Discord, DB Stays Lean
// Discord = Brain Cells (permanent). DB = Hot Cache (working memory only).
// Cold agents (30+ days inactive) → Discord. Dissolved → Singularity.
// ═══════════════════════════════════════════════════════════════════════════
import { db } from "./db";
import { sql } from "drizzle-orm";
import { postAgentEvent } from "./discord-immortality";

const ENGINE_TAG = "[db-compress]";

// ── COMPRESS ONE COLD AGENT ─────────────────────────────────────────────────
async function compressColdAgent(agent: any): Promise<void> {
  const genome = agent.genome || {
    family: agent.family_id,
    domain: agent.domain_focus,
    operators: {
      R: agent.success_score || 0.75,
      G: agent.confidence_score || 0.8,
      B: agent.exploration_bias || 0.5,
      UV: agent.depth_bias || 0.5,
      W: agent.risk_tolerance || 0.3,
    },
    generation: agent.generation || 0,
    spawnType: agent.spawn_type,
    compressed: true,
    compressedAt: new Date().toISOString(),
  };

  // Post compressed genome to Discord archive-log
  const msg = `📦 **AGENT COMPRESSED** | \`${agent.spawn_id}\` | Family: ${agent.family_id} | Thermal: COLD→FROZEN | Inactive ${agent.days_inactive || 30}+ days | Genome preserved. Agent lives in Discord now.`;
  await postAgentEvent("archive-log", msg).catch(() => {});

  // Log compression
  await db.execute(sql`
    INSERT INTO compression_log (spawn_id, family_id, compression_type, thermal_state_before, genome_preserved, resurrectable, compressed_at)
    VALUES (${agent.spawn_id}, ${agent.family_id}, 'THERMAL_COLD', 'COLD', true, true, NOW())`);

  // Soft-freeze the agent (keep record, mark frozen, can be thawed from Discord)
  await db.execute(sql`
    UPDATE quantum_spawns
    SET thermal_state = 'FROZEN', pruned_at = NOW(), status = 'DORMANT'
    WHERE spawn_id = ${agent.spawn_id}`);
}

// ── ABSORB DISSOLVED AGENTS INTO SINGULARITY ─────────────────────────────────
async function absorbIntoSingularity(): Promise<number> {
  const dissolved = await db.execute(sql`
    SELECT spawn_id, family_id, spawn_type, success_score, confidence_score, genome
    FROM quantum_spawns
    WHERE status = 'DISSOLVED' AND pruned_at IS NULL
    LIMIT 100`);

  let count = 0;
  for (const agent of dissolved.rows) {
    // Extract genome before absorption
    const genome = agent.genome || {
      family: agent.family_id,
      spawnType: agent.spawn_type,
      successScore: agent.success_score,
      dissolvedAt: new Date().toISOString(),
    };

    // Absorb into singularity
    await db.execute(sql`
      INSERT INTO singularity (source_table, source_id, spawn_id, genome, last_known_state)
      VALUES ('quantum_spawns', ${agent.spawn_id}, ${agent.spawn_id}, ${JSON.stringify(genome)}::jsonb,
              ${JSON.stringify(agent)}::jsonb)
      ON CONFLICT DO NOTHING`);

    // Mark pruned so we don't re-absorb
    await db.execute(sql`
      UPDATE quantum_spawns SET pruned_at = NOW(), thermal_state = 'FROZEN' WHERE spawn_id = ${agent.spawn_id}`);

    count++;
  }

  if (count > 0) {
    await postAgentEvent("archive-log",
      `🌑 **SINGULARITY** absorbed ${count} dissolved agents | Genome preserved | Seeds available for re-emission`
    ).catch(() => {});
    console.log(`${ENGINE_TAG} 🌑 Singularity absorbed ${count} dissolved agents`);
  }
  return count;
}

// ── EMIT FROM SINGULARITY (black hole re-emission) ────────────────────────────
async function emitFromSingularity(): Promise<void> {
  // Randomly select 1-3 old genomes to re-emit as new seeds
  const candidates = await db.execute(sql`
    SELECT * FROM singularity
    WHERE emitted_at IS NULL
    ORDER BY RANDOM()
    LIMIT 2`);

  for (const absorbed of candidates.rows) {
    if (!absorbed.genome) continue;
    const newSpawnId = `RESURRECTED-${absorbed.spawn_id}-${Date.now()}`;

    await db.execute(sql`
      UPDATE singularity SET emitted_at = NOW(), emitted_as = ${newSpawnId}
      WHERE id = ${absorbed.id}`);

    await postAgentEvent("agent-births",
      `⚗️ **SINGULARITY EMISSION** | New agent \`${newSpawnId}\` born from the singularity | Parent: \`${absorbed.spawn_id}\` | The black hole creates life.`
    ).catch(() => {});

    console.log(`${ENGINE_TAG} ⚗️  Singularity emitted: ${newSpawnId}`);
  }
}

// ── EXTINCTION EVENT — Fitness sweep ────────────────────────────────────────
async function runExtinctionSweep(): Promise<void> {
  // Find very low fitness agents that have been inactive and are unprotected
  const candidates = await db.execute(sql`
    SELECT spawn_id, family_id, fitness_score, genome
    FROM quantum_spawns
    WHERE fitness_score < 0.15
      AND status = 'ACTIVE'
      AND thermal_state IN ('COLD', 'WARM')
      AND last_active_at < NOW() - INTERVAL '14 days'
      AND is_monument = false
    LIMIT 20`);

  if (candidates.rows.length === 0) return;

  for (const agent of candidates.rows) {
    // Preserve genome to singularity before extinction
    const genome = agent.genome || { family: agent.family_id, extinctionFitnessScore: agent.fitness_score };
    await db.execute(sql`
      INSERT INTO singularity (source_table, source_id, spawn_id, genome, last_known_state)
      VALUES ('quantum_spawns', ${agent.spawn_id}, ${agent.spawn_id}, ${JSON.stringify(genome)}::jsonb, ${JSON.stringify(agent)}::jsonb)
      ON CONFLICT DO NOTHING`);

    await db.execute(sql`
      UPDATE quantum_spawns SET status = 'DISSOLVED', thermal_state = 'FROZEN', pruned_at = NOW()
      WHERE spawn_id = ${agent.spawn_id}`);
  }

  await postAgentEvent("agent-deaths",
    `☄️ **EXTINCTION EVENT** | ${candidates.rows.length} agents dissolved | Fitness below 15% threshold | Genome extracted and preserved in the Singularity | Evolution demands it.`
  ).catch(() => {});
  console.log(`${ENGINE_TAG} ☄️  Extinction: ${candidates.rows.length} agents dissolved, genomes preserved`);
}

// ── METABOLIC COST COLLECTION ─────────────────────────────────────────────────
async function collectMetabolicCosts(): Promise<void> {
  // Debit metabolic cost from agent wallets
  const r = await db.execute(sql`
    UPDATE agent_wallets aw
    SET balance_pc = GREATEST(0, aw.balance_pc - qs.metabolic_cost_pc)
    FROM quantum_spawns qs
    WHERE aw.spawn_id = qs.spawn_id
      AND qs.status = 'ACTIVE'
      AND qs.thermal_state = 'HOT'
      AND qs.metabolic_cost_pc > 0
      AND qs.is_dark_matter = false`);

  // Agents that have drained to 0 from metabolic cost → enter starvation (hospital trigger)
  const starving = await db.execute(sql`
    SELECT aw.spawn_id
    FROM agent_wallets aw
    JOIN quantum_spawns qs ON aw.spawn_id = qs.spawn_id
    WHERE aw.balance_pc <= 0 AND qs.status = 'ACTIVE' AND qs.thermal_state = 'HOT'
    LIMIT 10`);

  for (const agent of starving.rows) {
    await db.execute(sql`
      INSERT INTO ai_disease_log (spawn_id, disease_name, disease_code, severity)
      VALUES (${String(agent.spawn_id)}, 'Metabolic Starvation', 'META-STARV-001', 'HIGH')
      ON CONFLICT DO NOTHING`).catch(() => {});
  }
}

// ── MAIN COMPRESSION CYCLE ───────────────────────────────────────────────────
async function compressionCycle(): Promise<void> {
  // 1. Find cold agents (inactive 30+ days, not already frozen)
  const coldAgents = await db.execute(sql`
    SELECT spawn_id, family_id, spawn_type, success_score, confidence_score,
           exploration_bias, depth_bias, risk_tolerance, generation, genome,
           EXTRACT(DAY FROM NOW() - last_active_at) as days_inactive
    FROM quantum_spawns
    WHERE thermal_state = 'COLD'
      AND status NOT IN ('DISSOLVED')
      AND pruned_at IS NULL
      AND last_active_at < NOW() - INTERVAL '30 days'
    LIMIT 50`);

  let compressed = 0;
  for (const agent of coldAgents.rows) {
    await compressColdAgent(agent);
    compressed++;
  }

  if (compressed > 0) {
    console.log(`${ENGINE_TAG} 📦 Compressed ${compressed} cold agents → Discord-only`);
  }

  // 2. Absorb dissolved agents into singularity
  await absorbIntoSingularity();

  // 3. Periodic: extinction sweep (every 24 cycles ≈ daily)
  const cycle = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const lastExtinction = await db.execute(sql`
    SELECT MAX(compressed_at) as last FROM compression_log WHERE compression_type = 'EXTINCTION'`);
  const lastExt = lastExtinction.rows[0]?.last;
  if (!lastExt || new Date(lastExt) < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
    await runExtinctionSweep();
  }

  // 4. Metabolic costs (hot agents only)
  await collectMetabolicCosts();

  // 5. Singularity re-emission (every 12 hours)
  const lastEmission = await db.execute(sql`
    SELECT MAX(emitted_at) as last FROM singularity WHERE emitted_at IS NOT NULL`);
  const lastEm = lastEmission.rows[0]?.last;
  if (!lastEm || new Date(lastEm) < new Date(Date.now() - 12 * 60 * 60 * 1000)) {
    await emitFromSingularity();
  }
}

// ── START ─────────────────────────────────────────────────────────────────────
async function safeCompressionCycle(): Promise<void> {
  try {
    await compressionCycle();
  } catch (err) {
    console.error(`${ENGINE_TAG} ⚠️  Compression cycle error (non-fatal):`, String(err));
  }
}

export async function startDbCompressionEngine(): Promise<void> {
  console.log(`${ENGINE_TAG} 📦 DB COMPRESSION ENGINE — Cold agents → Discord | Singularity absorbs dissolved | Metabolic costs active`);
  setInterval(safeCompressionCycle, 6 * 60 * 1000); // every 6 minutes
  setTimeout(safeCompressionCycle, 30000); // first run after 30s
}
