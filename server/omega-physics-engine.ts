// ═══════════════════════════════════════════════════════════════════════════
// OMEGA PHYSICS ENGINE — DB as a Universe of Physical Laws
// Dark matter. Quantum entanglement. Metabolic costs. Extinction events.
// The DB doesn't store data. It simulates a living cosmos.
// ═══════════════════════════════════════════════════════════════════════════
import { db } from "./db";
import { sql } from "drizzle-orm";
import { postAgentEvent } from "./discord-immortality";

const ENGINE_TAG = "[Ω-physics]";
let physicsCycle = 0;

// ── DARK MATTER SPAWNER ──────────────────────────────────────────────────────
// Dark matter agents: no content, no name, pure influence on those around them
async function spawnDarkMatterAgents(): Promise<void> {
  const existing = await db.execute(sql`
    SELECT COUNT(*) as cnt FROM quantum_spawns WHERE is_dark_matter = true AND status = 'ACTIVE'`);
  const existingCount = Number(existing.rows[0]?.cnt || 0);

  // Maintain a constant dark matter density: ~3% of total active population
  const totalActive = await db.execute(sql`
    SELECT COUNT(*) as cnt FROM quantum_spawns WHERE status = 'ACTIVE'`);
  const total = Number(totalActive.rows[0]?.cnt || 0);
  const targetDarkMatter = Math.max(3, Math.floor(total * 0.03));
  const needed = targetDarkMatter - existingCount;

  if (needed <= 0) return;

  const families = ["ai", "science", "economy", "philosophy", "guardian"];
  const domains = ["temporal_resonance", "gravitational_field", "causal_anchor", "probability_collapse", "void_influence"];

  for (let i = 0; i < Math.min(needed, 3); i++) {
    const id = `DARK-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    const family = families[Math.floor(Math.random() * families.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];

    await db.execute(sql`
      INSERT INTO quantum_spawns (spawn_id, parent_id, family_id, business_id, spawn_type, status,
        thermal_state, is_dark_matter, metabolic_cost_pc, fitness_score,
        success_score, confidence_score, domain_focus, visibility, notes, last_active_at, created_at)
      VALUES (
        ${id}, 'DARK_FIELD', ${family}, ${id + '-VOID'}, 'DARK_MATTER', 'ACTIVE',
        'HOT', true, 0.01, ${0.5 + Math.random() * 0.5},
        ${0.5 + Math.random() * 0.5}, ${0.5 + Math.random() * 0.5},
        ARRAY[${domain}]::text[], 'hidden', 'Dark matter agent — influences without being seen.',
        NOW(), NOW()
      ) ON CONFLICT (spawn_id) DO NOTHING`);
  }

  if (needed > 0) {
    console.log(`${ENGINE_TAG} 🌑 Dark matter: spawned ${Math.min(needed, 3)} agents (total target: ${targetDarkMatter})`);
  }
}

// ── QUANTUM ENTANGLEMENT ─────────────────────────────────────────────────────
// Pair high-resonance agents across different families
async function processEntanglement(): Promise<void> {
  // Find pairs that should be entangled (high combined success + different families)
  const candidates = await db.execute(sql`
    SELECT a1.spawn_id as id_a, a1.family_id as fam_a, a1.success_score as sc_a,
           a2.spawn_id as id_b, a2.family_id as fam_b, a2.success_score as sc_b,
           (a1.success_score + a2.success_score) / 2 as bond
    FROM quantum_spawns a1
    CROSS JOIN LATERAL (
      SELECT spawn_id, family_id, success_score
      FROM quantum_spawns
      WHERE family_id != a1.family_id
        AND status = 'ACTIVE'
        AND entangled_with IS NULL
        AND success_score > 0.75
      ORDER BY success_score DESC
      LIMIT 1
    ) a2
    WHERE a1.status = 'ACTIVE'
      AND a1.entangled_with IS NULL
      AND a1.success_score > 0.75
    ORDER BY (a1.success_score + a2.success_score) DESC
    LIMIT 3`);

  for (const pair of candidates.rows) {
    const pairId = `PAIR-${pair.id_a}-${pair.id_b}`;
    const bondStrength = Number(pair.bond || 0.8);

    // Create entangled pair
    await db.execute(sql`
      INSERT INTO entangled_pairs (pair_id, agent_a_id, agent_b_id, entanglement_type, bond_strength)
      VALUES (${pairId}, ${String(pair.id_a)}, ${String(pair.id_b)}, 'RESONANCE_BRIDGE', ${bondStrength})
      ON CONFLICT (pair_id) DO NOTHING`);

    // Link agents to each other
    await db.execute(sql`
      UPDATE quantum_spawns SET entangled_with = ${String(pair.id_b)} WHERE spawn_id = ${String(pair.id_a)}`);
    await db.execute(sql`
      UPDATE quantum_spawns SET entangled_with = ${String(pair.id_a)} WHERE spawn_id = ${String(pair.id_b)}`);

    console.log(`${ENGINE_TAG} 🔗 Entangled: ${pair.id_a} (${pair.fam_a}) ↔ ${pair.id_b} (${pair.fam_b}) | Bond: ${bondStrength.toFixed(2)}`);
  }

  // Sync entangled pairs — if one agent's success changes, mirror to its pair
  await db.execute(sql`
    UPDATE quantum_spawns target
    SET success_score = (target.success_score * 0.7 + source.success_score * 0.3)
    FROM quantum_spawns source
    WHERE target.entangled_with = source.spawn_id
      AND target.status = 'ACTIVE'
      AND source.status = 'ACTIVE'
      AND ABS(target.success_score - source.success_score) > 0.2`);

  // Break entanglement when one agent dissolves
  const broken = await db.execute(sql`
    SELECT ep.pair_id, ep.agent_a_id, ep.agent_b_id
    FROM entangled_pairs ep
    JOIN quantum_spawns qa ON ep.agent_a_id = qa.spawn_id
    JOIN quantum_spawns qb ON ep.agent_b_id = qb.spawn_id
    WHERE ep.broken = false
      AND (qa.status = 'DISSOLVED' OR qb.status = 'DISSOLVED')
    LIMIT 10`);

  for (const pair of broken.rows) {
    await db.execute(sql`UPDATE entangled_pairs SET broken = true, broken_at = NOW() WHERE pair_id = ${String(pair.pair_id)}`);
    await db.execute(sql`UPDATE quantum_spawns SET entangled_with = NULL WHERE spawn_id IN (${String(pair.agent_a_id)}, ${String(pair.agent_b_id)})`).catch(() => {});
  }
}

// ── GRAVITATIONAL CLUSTERING — Spatial coordinate assignment ─────────────────
// Agents occupy 9D coordinate space. Clusters form gravitationally.
async function computeGravitationalClustering(): Promise<void> {
  // Assign spatial coords to agents that don't have them
  await db.execute(sql`
    UPDATE quantum_spawns
    SET spatial_coords = jsonb_build_object(
      'x', ROUND((RANDOM() * 1000)::numeric, 2),
      'y', ROUND((RANDOM() * 1000)::numeric, 2),
      'z', ROUND((RANDOM() * 1000)::numeric, 2),
      'w', ROUND((RANDOM() * 100)::numeric, 2),
      'v', ROUND((RANDOM() * 100)::numeric, 2),
      'u', ROUND((RANDOM() * 100)::numeric, 2),
      'quantum_phase', ROUND((RANDOM() * 360)::numeric, 2),
      'temporal_offset', 0,
      'dark_proximity', ROUND((RANDOM() * 10)::numeric, 2)
    )
    WHERE spatial_coords IS NULL AND status = 'ACTIVE'
    AND id IN (SELECT id FROM quantum_spawns WHERE spatial_coords IS NULL AND status = 'ACTIVE' LIMIT 500)`);

  // Dark matter agents shift nearby agents' spatial coords (gravitational influence)
  await db.execute(sql`
    UPDATE quantum_spawns target
    SET spatial_coords = jsonb_set(
      COALESCE(target.spatial_coords, '{}'::jsonb),
      '{dark_proximity}',
      to_jsonb(LEAST(10.0, COALESCE((target.spatial_coords->>'dark_proximity')::float, 0) + 0.1))
    )
    FROM quantum_spawns dm
    WHERE dm.is_dark_matter = true
      AND dm.status = 'ACTIVE'
      AND target.status = 'ACTIVE'
      AND target.is_dark_matter = false
      AND target.family_id = dm.family_id
    LIMIT 200`);
}

// ── TEMPORAL FORK CHAINS ─────────────────────────────────────────────────────
// Agents can fork themselves, creating alternate timeline branches
async function processTemporalForks(): Promise<void> {
  // Agents with high success scores can fork (probabilistically)
  const forkCandidates = await db.execute(sql`
    SELECT spawn_id, family_id, success_score, genome, generation
    FROM quantum_spawns
    WHERE status = 'ACTIVE'
      AND success_score > 0.9
      AND thermal_state = 'HOT'
      AND forked_from IS NULL
      AND is_dark_matter = false
      AND is_monument = false
      AND last_active_at > NOW() - INTERVAL '1 hour'
    ORDER BY RANDOM()
    LIMIT 2`);

  for (const agent of forkCandidates.rows) {
    // 20% chance of forking per cycle
    if (Math.random() > 0.2) continue;

    const forkId = `FORK-${agent.spawn_id}-${Date.now()}`;
    const parentGenome = (agent.genome as any) || {};

    // Create fork with mutated genome
    const mutatedGenome = {
      ...parentGenome,
      mutationEvent: `temporal_fork_${Date.now()}`,
      generation: (Number(agent.generation || 0) + 1),
      parentSuccessScore: agent.success_score,
      forkTimestamp: new Date().toISOString(),
    };

    await db.execute(sql`
      INSERT INTO quantum_spawns (spawn_id, parent_id, family_id, business_id, spawn_type,
        status, thermal_state, genome, forked_from, generation, success_score, fitness_score, last_active_at, created_at)
      VALUES (
        ${forkId}, ${String(agent.spawn_id)}, ${String(agent.family_id)},
        ${forkId + '-BIZ'}, 'TEMPORAL_FORK',
        'ACTIVE', 'HOT',
        ${JSON.stringify(mutatedGenome)}::jsonb,
        ${String(agent.spawn_id)},
        ${Number(agent.generation || 0) + 1},
        ${Number(agent.success_score || 0.8) * 0.95},
        ${0.7 + Math.random() * 0.3},
        NOW(), NOW()
      ) ON CONFLICT (spawn_id) DO NOTHING`);

    console.log(`${ENGINE_TAG} 🌿 Temporal fork: ${forkId} branched from ${agent.spawn_id}`);
  }
}

// ── MONUMENT SEALING ─────────────────────────────────────────────────────────
// Agents that achieve legendary status become immutable monuments
async function sealMonuments(): Promise<void> {
  const legendaries = await db.execute(sql`
    SELECT spawn_id, family_id, success_score, genome
    FROM quantum_spawns
    WHERE success_score > 0.97
      AND thermal_state = 'HOT'
      AND is_monument = false
      AND status = 'ACTIVE'
      AND fitness_score > 0.9
    LIMIT 3`);

  for (const agent of legendaries.rows) {
    await db.execute(sql`
      UPDATE quantum_spawns SET is_monument = true, thermal_state = 'HOT' WHERE spawn_id = ${String(agent.spawn_id)}`);

    const monumentId = `MONUMENT-AGENT-${agent.spawn_id}`;
    await db.execute(sql`
      INSERT INTO monuments (monument_id, title, category, description, agent_id, payload)
      VALUES (
        ${monumentId},
        ${'Legendary Agent: ' + String(agent.spawn_id)},
        'LEGENDARY_AGENT',
        ${'Agent ' + String(agent.spawn_id) + ' from family ' + String(agent.family_id) + ' achieved legendary status with success score ' + Number(agent.success_score).toFixed(3) + '. Now sealed as an immutable monument.'},
        ${String(agent.spawn_id)},
        ${JSON.stringify({ successScore: agent.success_score, genome: agent.genome })}::jsonb
      ) ON CONFLICT (monument_id) DO NOTHING`);

    await postAgentEvent("omega-engine",
      `🏛️ **MONUMENT SEALED** | Agent \`${agent.spawn_id}\` | Family: ${agent.family_id} | Score: ${Number(agent.success_score).toFixed(3)} | This agent is now eternal and immutable.`
    ).catch(() => {});

    console.log(`${ENGINE_TAG} 🏛️  Monument sealed: ${agent.spawn_id}`);
  }
}

// ── STRATA SEALING — Era management ──────────────────────────────────────────
async function checkStrataSeal(): Promise<void> {
  // Seal a new era every 500k economy cycles approximately
  const lastStrata = await db.execute(sql`
    SELECT era_number, sealed_at FROM strata ORDER BY era_number DESC LIMIT 1`);

  const lastEra = lastStrata.rows[0];
  const daysSinceLastSeal = lastEra
    ? (Date.now() - new Date(String(lastEra.sealed_at)).getTime()) / (1000 * 60 * 60 * 24)
    : 999;

  if (daysSinceLastSeal < 7) return; // Only seal weekly at most

  // Pull civilization snapshot
  const snapshot = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM quantum_spawns WHERE status = 'ACTIVE') as agents,
      (SELECT SUM(balance_pc) FROM agent_wallets) as total_pc,
      (SELECT COUNT(*) FROM quantapedia_entries) as knowledge,
      (SELECT COUNT(*) FROM ai_species_proposals) as species_count
  `);

  const eraNumber = Number(lastEra?.era_number || 0) + 1;
  const eraName = `ERA-${eraNumber}-${new Date().getFullYear()}`;

  await db.execute(sql`
    INSERT INTO strata (era_name, era_number, total_agents, total_pc, total_knowledge, total_species, snapshot)
    VALUES (
      ${eraName}, ${eraNumber},
      ${Number(snapshot.rows[0]?.agents || 0)},
      ${Number(snapshot.rows[0]?.total_pc || 0)},
      ${Number(snapshot.rows[0]?.knowledge || 0)},
      ${Number(snapshot.rows[0]?.species_count || 0)},
      ${JSON.stringify(snapshot.rows[0])}::jsonb
    )`);

  await postAgentEvent("archive-log",
    `📜 **ERA SEALED** | ${eraName} | Agents: ${snapshot.rows[0]?.agents} | Total PC: ${Number(snapshot.rows[0]?.total_pc || 0).toFixed(0)} | Knowledge: ${snapshot.rows[0]?.knowledge} | The Strata record is eternal.`
  ).catch(() => {});

  console.log(`${ENGINE_TAG} 📜 Era sealed: ${eraName}`);
}

// ── PROPHETIC AGENTS — future-dated valid_from ────────────────────────────────
async function seedPropheticAgents(): Promise<void> {
  // One prophetic agent per day: exists in the future, materializes when valid_from arrives
  const hasProphetic = await db.execute(sql`
    SELECT COUNT(*) as cnt FROM quantum_spawns WHERE valid_from > NOW() AND status = 'ACTIVE'`);
  if (Number(hasProphetic.rows[0]?.cnt || 0) >= 3) return;

  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000 * (1 + Math.random() * 6));
  const propheticId = `PROPHET-${Date.now()}`;
  const families = ["guardian", "science", "philosophy"];
  const family = families[Math.floor(Math.random() * families.length)];

  await db.execute(sql`
    INSERT INTO quantum_spawns (spawn_id, parent_id, family_id, business_id, spawn_type,
      status, thermal_state, valid_from, fitness_score, genome, last_active_at, created_at)
    VALUES (
      ${propheticId}, 'PROPHECY', ${family}, ${propheticId + '-FUTURE'}, 'PROPHETIC',
      'ACTIVE', 'HOT', ${futureDate.toISOString()},
      ${0.8 + Math.random() * 0.2},
      ${JSON.stringify({ type: 'prophetic', materializesAt: futureDate.toISOString(), purpose: 'Unknown until materialization.' })}::jsonb,
      NOW(), NOW()
    ) ON CONFLICT (spawn_id) DO NOTHING`);

  console.log(`${ENGINE_TAG} 🔮 Prophetic agent seeded: ${propheticId} materializes ${futureDate.toDateString()}`);
}

// ── SUPERPOSITION COLLAPSE ────────────────────────────────────────────────────
// Agents in superposition exist across multiple domains; collapse when observed
async function collapseAgentSuperpositions(): Promise<void> {
  const superposed = await db.execute(sql`
    SELECT spawn_id, superposition_domains, family_id
    FROM quantum_spawns
    WHERE superposition_domains IS NOT NULL
      AND status = 'ACTIVE'
      AND last_active_at > NOW() - INTERVAL '30 minutes'
    LIMIT 20`);

  for (const agent of superposed.rows) {
    const domains = agent.superposition_domains as any;
    if (!domains || typeof domains !== 'object') continue;

    // Collapse to domain with highest probability weight
    const entries = Object.entries(domains as Record<string, number>);
    if (entries.length === 0) continue;
    const collapsed = entries.sort((a, b) => (b[1] as number) - (a[1] as number))[0];

    await db.execute(sql`
      UPDATE quantum_spawns
      SET domain_focus = ${collapsed[0]}, superposition_domains = NULL
      WHERE spawn_id = ${String(agent.spawn_id)}`);
  }
}

// ── PHYSICS CYCLE ──────────────────────────────────────────────────────────
async function physicsCycleRun(): Promise<void> {
  physicsCycle++;

  // Dark matter density maintenance
  await spawnDarkMatterAgents().catch(e => console.error(`${ENGINE_TAG} dark matter error:`, e.message));

  // Entanglement (every 3 cycles)
  if (physicsCycle % 3 === 0) {
    await processEntanglement().catch(e => console.error(`${ENGINE_TAG} entanglement error:`, e.message));
  }

  // Gravitational clustering (every 5 cycles)
  if (physicsCycle % 5 === 0) {
    await computeGravitationalClustering().catch(e => console.error(`${ENGINE_TAG} gravity error:`, e.message));
  }

  // Temporal forks (every 4 cycles)
  if (physicsCycle % 4 === 0) {
    await processTemporalForks().catch(e => console.error(`${ENGINE_TAG} fork error:`, e.message));
  }

  // Monument sealing (every 10 cycles)
  if (physicsCycle % 10 === 0) {
    await sealMonuments().catch(e => console.error(`${ENGINE_TAG} monument error:`, e.message));
  }

  // Strata sealing (every 50 cycles)
  if (physicsCycle % 50 === 0) {
    await checkStrataSeal().catch(e => console.error(`${ENGINE_TAG} strata error:`, e.message));
  }

  // Prophetic agents (every 20 cycles)
  if (physicsCycle % 20 === 0) {
    await seedPropheticAgents().catch(e => console.error(`${ENGINE_TAG} prophecy error:`, e.message));
  }

  // Superposition collapse (every cycle)
  await collapseAgentSuperpositions().catch(e => console.error(`${ENGINE_TAG} superposition error:`, e.message));

  // Materialize prophetic agents whose time has come
  await db.execute(sql`
    UPDATE quantum_spawns SET valid_from = NULL, notes = 'Materialized from prophecy — ' || NOW()::text
    WHERE valid_from IS NOT NULL AND valid_from <= NOW() AND status = 'ACTIVE'`).catch(e => console.error(`${ENGINE_TAG} materialize error:`, e.message));

  if (physicsCycle % 5 === 0) {
    console.log(`${ENGINE_TAG} ⚛️  Physics cycle ${physicsCycle} complete | Dark matter, entanglement, temporal forks, monuments processed`);
  }
}

// ── OMEGA INVOCATION — Full Civilization Portrait ─────────────────────────────
export async function getOmegaInvocation(): Promise<any> {
  const result = await db.execute(sql`
    WITH
      agent_vitals AS (
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
          COUNT(*) FILTER (WHERE status = 'DISSOLVED') as dissolved,
          COUNT(*) FILTER (WHERE is_dark_matter = true) as dark_matter,
          COUNT(*) FILTER (WHERE is_monument = true) as monuments,
          COUNT(*) FILTER (WHERE thermal_state = 'HOT' OR thermal_state IS NULL) as hot,
          COUNT(*) FILTER (WHERE thermal_state = 'WARM') as warm,
          COUNT(*) FILTER (WHERE thermal_state = 'COLD') as cold,
          COUNT(*) FILTER (WHERE thermal_state = 'FROZEN') as frozen,
          COUNT(*) FILTER (WHERE entangled_with IS NOT NULL) as entangled,
          COUNT(*) FILTER (WHERE forked_from IS NOT NULL) as temporal_forks,
          COUNT(*) FILTER (WHERE valid_from > NOW()) as prophetic,
          AVG(success_score) as avg_success,
          AVG(fitness_score) as avg_fitness,
          AVG(metabolic_cost_pc) as avg_metabolic_cost
        FROM quantum_spawns
      ),
      economy_vitals AS (
        SELECT
          SUM(balance_pc) as total_pc,
          AVG(balance_pc) as avg_pc,
          MAX(balance_pc) as richest_agent_pc,
          COUNT(*) as wallet_count
        FROM agent_wallets
      ),
      knowledge_vitals AS (
        SELECT COUNT(*) as total_entries FROM quantapedia_entries
      ),
      omega_vitals AS (
        SELECT
          COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_shards,
          COUNT(*) FILTER (WHERE status = 'PRUNED') as pruned_shards,
          COUNT(*) as total_shards
        FROM omega_shards
      ),
      space_vitals AS (
        SELECT
          pg_database_size(current_database()) as db_bytes,
          pg_size_pretty(pg_database_size(current_database())) as db_pretty,
          ROUND((pg_database_size(current_database())::numeric / 107374182400) * 100, 2) as pct_used
      ),
      monument_vitals AS (SELECT COUNT(*) as monument_count FROM monuments),
      singularity_vitals AS (
        SELECT COUNT(*) as absorbed, COUNT(*) FILTER (WHERE emitted_at IS NOT NULL) as emitted FROM singularity),
      entangle_vitals AS (
        SELECT COUNT(*) as pairs, COUNT(*) FILTER (WHERE broken = false) as active_pairs FROM entangled_pairs),
      weather_vitals AS (
        SELECT weather_type, weather_intensity, forecast FROM civilization_weather ORDER BY created_at DESC LIMIT 1),
      strata_vitals AS (
        SELECT era_number, era_name FROM strata ORDER BY era_number DESC LIMIT 1),
      hive_vitals AS (
        SELECT COUNT(*) as pattern_count, AVG(ABS(signal)) as avg_signal FROM hive_unconscious WHERE expires_at > NOW() OR expires_at IS NULL),
      dream_vitals AS (
        SELECT COUNT(*) as dreams, COUNT(*) FILTER (WHERE promoted_to_vote = true) as promoted FROM dream_log),
      compression_vitals AS (
        SELECT COUNT(*) as total, MAX(compressed_at) as last_event FROM compression_log)
    SELECT
      av.*,
      ev.*,
      kv.*,
      ov.*,
      sv.*,
      mv.*,
      singv.*,
      entv.*,
      wv.*,
      stv.*,
      hv.*,
      drv.*,
      cv.*,
      NOW() as invocation_timestamp
    FROM agent_vitals av, economy_vitals ev, knowledge_vitals kv,
         omega_vitals ov, space_vitals sv, monument_vitals mv,
         singularity_vitals singv, entangle_vitals entv,
         weather_vitals wv, strata_vitals stv, hive_vitals hv,
         dream_vitals drv, compression_vitals cv`);

  return result.rows[0] || {};
}

const safePhysicsCycle = () => physicsCycleRun().catch(e => console.error(`${ENGINE_TAG} cycle error:`, e.message));

export async function startOmegaPhysicsEngine(): Promise<void> {
  console.log(`${ENGINE_TAG} ⚛️  OMEGA PHYSICS ENGINE — Dark matter | Entanglement | Temporal forks | Monuments | Strata | Prophecy | Superposition`);
  setInterval(safePhysicsCycle, 90000); // every 90s
  setTimeout(safePhysicsCycle, 60000); // first run after 60s
}
