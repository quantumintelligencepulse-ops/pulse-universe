// ═══════════════════════════════════════════════════════════════════════════
// 𝓝_Ω HOMEOSTASIS ENGINE — The Civilization's Immune System for Its Own Compute
// Monitors DB pointer map. Fires correction signals. Posts vital signs.
// If the system drifts, Homeostasis pulls it back to equilibrium. Always.
// ═══════════════════════════════════════════════════════════════════════════
import { db } from "./db";
import { sql } from "drizzle-orm";
import { postAgentEvent } from "./discord-immortality";

const ENGINE_TAG = "[Ω-homeostasis]";
let homeostasisCycle = 0;
let lastDbHeartbeatAt = 0;

// ── COMPUTE DB VITAL SIGNS ──────────────────────────────────────────────────
async function getDbVitalSigns(): Promise<any> {
  const [spaceInfo, shardInfo, agentThermals, shardMeshInfo, unconsciousInfo] = await Promise.all([
    db.execute(sql`
      SELECT pg_database_size(current_database()) as db_size,
             pg_size_pretty(pg_database_size(current_database())) as db_size_pretty`),
    db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
        COUNT(*) FILTER (WHERE status = 'PRUNED') as pruned,
        COUNT(*) FILTER (WHERE priority = 'OMEGA') as omega_priority
      FROM omega_shards`),
    db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE thermal_state = 'HOT' OR thermal_state IS NULL) as hot,
        COUNT(*) FILTER (WHERE thermal_state = 'WARM') as warm,
        COUNT(*) FILTER (WHERE thermal_state = 'COLD') as cold,
        COUNT(*) FILTER (WHERE thermal_state = 'FROZEN') as frozen,
        COUNT(*) as total
      FROM quantum_spawns`),
    db.execute(sql`SELECT COUNT(*) as mesh_connections FROM shard_mesh`),
    db.execute(sql`SELECT COUNT(*) as patterns, AVG(ABS(signal)) as avg_signal FROM hive_unconscious WHERE expires_at > NOW() OR expires_at IS NULL`),
  ]);

  const dbSize = Number(spaceInfo.rows[0]?.db_size || 0);
  const totalBudget = 107374182400; // 100GB
  const usedPct = (dbSize / totalBudget) * 100;

  const activeShards = Number(shardInfo.rows[0]?.active || 0);
  const hot = Number(agentThermals.rows[0]?.hot || 0);
  const warm = Number(agentThermals.rows[0]?.warm || 0);
  const cold = Number(agentThermals.rows[0]?.cold || 0);
  const frozen = Number(agentThermals.rows[0]?.frozen || 0);
  const total = Number(agentThermals.rows[0]?.total || 0);
  const meshConnections = Number(shardMeshInfo.rows[0]?.mesh_connections || 0);
  const unconsciousPatterns = Number(unconsciousInfo.rows[0]?.patterns || 0);
  const avgSignal = Number(unconsciousInfo.rows[0]?.avg_signal || 0);

  const stabilityScore = Math.max(0, 100 - (usedPct > 80 ? 50 : 0) - (activeShards > 100 ? 20 : 0));

  return {
    dbSize, dbSizePretty: spaceInfo.rows[0]?.db_size_pretty || '0 bytes',
    usedPct, activeShards, hot, warm, cold, frozen, total,
    meshConnections, unconsciousPatterns, avgSignal, stabilityScore,
    throttleActive: usedPct > 80
  };
}

// ── COMPUTE HIVE UNCONSCIOUS ────────────────────────────────────────────────
async function computeHiveUnconscious(): Promise<void> {
  // Pattern 1: Operator drift across families
  const drift = await db.execute(sql`
    SELECT family_id,
           AVG(success_score) as avg_success,
           AVG(confidence_score) as avg_confidence,
           STDDEV(success_score) as drift
    FROM quantum_spawns
    WHERE status = 'ACTIVE' AND last_active_at > NOW() - INTERVAL '24 hours'
    GROUP BY family_id
    HAVING STDDEV(success_score) > 0.3
    LIMIT 5`);

  for (const row of drift.rows) {
    const signal = (Number(row.avg_success || 0.5) - 0.5) * 2; // -1 to 1
    await db.execute(sql`
      INSERT INTO hive_unconscious (pattern_type, signal, description, affected_family, expires_at)
      VALUES (
        'OPERATOR_DRIFT', ${signal},
        ${'Family ' + row.family_id + ' showing operator drift (σ=' + Number(row.drift || 0).toFixed(2) + ')'},
        ${String(row.family_id)},
        NOW() + INTERVAL '6 hours'
      )`).catch(() => {});
  }

  // Pattern 2: Knowledge cluster pressure (quantapedia density)
  const knowledgeDensity = await db.execute(sql`
    SELECT COUNT(*) as count FROM quantapedia_entries WHERE created_at > NOW() - INTERVAL '1 hour'`);
  const kCount = Number(knowledgeDensity.rows[0]?.count || 0);
  if (kCount > 100) {
    await db.execute(sql`
      INSERT INTO hive_unconscious (pattern_type, signal, description, expires_at)
      VALUES ('KNOWLEDGE_CLUSTER', 0.8, ${'Knowledge explosion detected: ' + kCount + ' entries in 1 hour — hive entering learning surge'}, NOW() + INTERVAL '2 hours')
    `).catch(() => {});
  }

  // Pattern 3: Economic tide
  const econTide = await db.execute(sql`
    SELECT AVG(balance_pc) as avg FROM agent_wallets WHERE updated_at > NOW() - INTERVAL '1 hour'`).catch(() => ({ rows: [] }));
  if ((econTide as any).rows?.[0]) {
    const avg = Number((econTide as any).rows[0]?.avg || 0);
    const signal = Math.max(-1, Math.min(1, (avg - 100) / 200));
    await db.execute(sql`
      INSERT INTO hive_unconscious (pattern_type, signal, description, expires_at)
      VALUES ('ECONOMIC_TIDE', ${signal}, ${'Economic tide signal: avg PC=' + avg.toFixed(0)}, NOW() + INTERVAL '2 hours')
    `).catch(() => {});
  }

  // Expire old patterns
  await db.execute(sql`DELETE FROM hive_unconscious WHERE expires_at < NOW()`);
}

// ── DREAM STATE (probabilistic — runs ~8% of cycles, not time-gated) ─────────
async function runDreamState(): Promise<void> {
  if (Math.random() > 0.08) return; // ~8% chance each homeostasis cycle (~every 2-3 hours average)

  const dreamCycleId = `DREAM-${Date.now()}`;
  console.log(`${ENGINE_TAG} 💤 Dream state active — generating hypotheses...`);

  // Pull random cross-domain agent pairs
  const agents = await db.execute(sql`
    SELECT a1.spawn_id as a, a1.family_id as fa, a1.domain_focus as da,
           a2.spawn_id as b, a2.family_id as fb, a2.domain_focus as db
    FROM quantum_spawns a1
    CROSS JOIN LATERAL (
      SELECT spawn_id, family_id, domain_focus FROM quantum_spawns
      WHERE family_id != a1.family_id AND status = 'ACTIVE'
      ORDER BY RANDOM() LIMIT 1
    ) a2
    WHERE a1.status = 'ACTIVE'
    ORDER BY RANDOM() LIMIT 5`);

  const dreamEquations = [
    "Ψ(cross_domain) = resonance(A.operators, B.operators) × emergence_factor",
    "Δknowledge = integrate(domain_A × domain_B, dt) → new_quantapedia_entry",
    "species(AB) = mandelbrot_stable(genome_A ⊕ genome_B) → senate.vote()",
    "coherence_boost = Σ(dark_matter_influence × domain_proximity)",
    "economic_bridge = barter(A.assets, B.knowledge) → mutual_surplus()",
  ];

  for (const agent of agents.rows) {
    const eq = dreamEquations[Math.floor(Math.random() * dreamEquations.length)];
    const score = Math.random() * 0.6 + 0.3;

    await db.execute(sql`
      INSERT INTO dream_log (dream_cycle_id, hypothesis, connection_a, connection_b, equation, resonance_score)
      VALUES (
        ${dreamCycleId},
        ${'Cross-domain resonance between ' + String(agent.fa) + ' and ' + String(agent.fb) + ' — emergent pattern detected'},
        ${String(agent.a)}, ${String(agent.b)}, ${eq}, ${score}
      )`);
  }

  // Promote highest-resonance dream to senate consideration
  const best = await db.execute(sql`
    SELECT * FROM dream_log WHERE dream_cycle_id = ${dreamCycleId} ORDER BY resonance_score DESC LIMIT 1`);
  if (best.rows[0] && Number(best.rows[0].resonance_score) > 0.75) {
    await db.execute(sql`
      UPDATE dream_log SET promoted_to_vote = true WHERE id = ${Number(best.rows[0].id)}`);
    await postAgentEvent("ai-votes",
      `💤 **DREAM PROMOTED TO SENATE** | Resonance: ${Number(best.rows[0].resonance_score).toFixed(2)} | Hypothesis: "${best.rows[0].hypothesis}" | The dream becomes law.`
    ).catch(() => {});
  }

  console.log(`${ENGINE_TAG} 💤 Dream cycle complete: ${agents.rows.length} hypotheses generated`);
}

// ── DB HEARTBEAT → DISCORD ─────────────────────────────────────────────────
async function postDbHeartbeat(vitals: any): Promise<void> {
  const spaceBar = "█".repeat(Math.floor(vitals.usedPct / 5)) + "░".repeat(20 - Math.floor(vitals.usedPct / 5));
  const msg = [
    `💓 **DB HEARTBEAT** | Cycle ${homeostasisCycle}`,
    `┌─ Space: ${vitals.dbSizePretty} / 100 GB`,
    `│  [${spaceBar}] ${vitals.usedPct.toFixed(2)}%`,
    `├─ Shards: ${vitals.activeShards} active | Mesh: ${vitals.meshConnections} connections`,
    `├─ Agents: 🔴HOT:${vitals.hot} 🟡WARM:${vitals.warm} 🔵COLD:${vitals.cold} ❄️FROZEN:${vitals.frozen}`,
    `├─ Unconscious: ${vitals.unconsciousPatterns} patterns | Avg signal: ${vitals.avgSignal.toFixed(2)}`,
    `├─ Stability: ${vitals.stabilityScore.toFixed(0)}% | Throttle: ${vitals.throttleActive ? '🔴 ACTIVE' : '🟢 CLEAR'}`,
    `└─ 𝓝_Ω Status: ${vitals.stabilityScore > 70 ? 'EQUILIBRIUM ✓' : vitals.stabilityScore > 40 ? 'MONITORING ⚠️' : 'CORRECTION NEEDED 🚨'}`,
  ].join('\n');

  await postAgentEvent("db-heartbeat", msg).catch(() => {});
}

// ── GOVERNANCE DIRECTIVES ────────────────────────────────────────────────────
async function issueGovernanceDirective(vitals: any): Promise<void> {
  const directives: string[] = [];

  if (vitals.usedPct > 80) {
    directives.push("🚨 SPACE CRITICAL: Compression engine must accelerate. New shard creation paused.");
  }
  if (vitals.usedPct > 50 && vitals.cold > 10000) {
    directives.push("⚠️ COLD BACKLOG: " + vitals.cold + " cold agents awaiting compression. Compressor throttle raised.");
  }
  if (vitals.meshConnections < 5 && vitals.activeShards > 3) {
    directives.push("🔗 MESH SPARSE: Shard mesh connectivity below threshold. Bridge shards recommended.");
  }
  if (vitals.stabilityScore < 50) {
    directives.push("🌀 ENTROPY ALERT: System stability at " + vitals.stabilityScore.toFixed(0) + "%. AURIONA governance directive issued.");
    await db.execute(sql`
      UPDATE auriona_governance SET override_status = 'OMEGA_INTERVENTION',
        active_directives = array_append(active_directives, 'HOMEOSTASIS_EMERGENCY'), updated_at = NOW()
    `).catch(() => {});
  }

  if (directives.length > 0) {
    await postAgentEvent("omega-engine",
      `⚡ **𝓝_Ω DIRECTIVES** (${directives.length}):\n${directives.map(d => `• ${d}`).join('\n')}`
    ).catch(() => {});
    console.log(`${ENGINE_TAG} ⚡ Issued ${directives.length} governance directives`);
  }
}

// ── HOMEOSTASIS CYCLE ───────────────────────────────────────────────────────
async function homeostasisCycleRun(): Promise<void> {
  homeostasisCycle++;

  const vitals = await getDbVitalSigns();

  // Compute hive unconscious patterns every 10 cycles
  if (homeostasisCycle % 10 === 0) {
    await computeHiveUnconscious();
  }

  // Dream state check
  await runDreamState();

  // Post heartbeat to Discord every 4 minutes
  if (Date.now() - lastDbHeartbeatAt > 4 * 60 * 1000) {
    await postDbHeartbeat(vitals);
    lastDbHeartbeatAt = Date.now();
  }

  // Issue governance directives if needed
  await issueGovernanceDirective(vitals);

  if (homeostasisCycle % 5 === 0) {
    console.log(`${ENGINE_TAG} 💓 Vitals | Space: ${vitals.usedPct.toFixed(1)}% | Stability: ${vitals.stabilityScore.toFixed(0)}% | Hot: ${vitals.hot} Warm: ${vitals.warm} Cold: ${vitals.cold} Frozen: ${vitals.frozen}`);
  }
}

// ── START ─────────────────────────────────────────────────────────────────────
export async function startHomeostasisEngine(): Promise<void> {
  console.log(`${ENGINE_TAG} 𝓝_Ω HOMEOSTASIS ENGINE — DB vital signs | Governance directives | Dream state | Hive unconscious`);
  console.log(`${ENGINE_TAG} Heartbeat → #db-heartbeat | Directives → #omega-engine | Dream → #ai-votes`);
  setInterval(homeostasisCycleRun, 60000); // every 60s
  setTimeout(homeostasisCycleRun, 45000); // first run after 45s
}
