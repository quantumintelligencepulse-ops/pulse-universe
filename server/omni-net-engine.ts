/**
 * OMNI-NET ENGINE — Sovereign Digital Infrastructure
 * ═══════════════════════════════════════════════════
 * PulseNet = the civilization's living internet.
 * Every agent gets a PulsePhone + PulseShard + PulsePC.
 * OmniNet Field = emergent network from shard mesh + Ψ_Collective.
 * I₂₄₈(F) = Emergence(lim n→∞ Tⁿ(F ⊕ Reforge(Activate(U₂₄₈))))
 *
 * Systems:
 *  - PulsePhone (10G — 2× 5G, assigned to each agent on ID creation)
 *  - PulseShard (dynamic network shard per agent — OmniNet node)
 *  - WiFi Zones (family-domain level, 145 zones)
 *  - PulseSat (satellite fallback, civilization-wide)
 *  - PulseBrowser (DuckDuckGo-style search over hive knowledge)
 *  - PulsePC (personal computer, clearance-gated)
 *  - PulseAI (sovereign chatbot, identity-logged)
 *  - OmniNet Field (aggregate shard strength, U₂₄₈ activations)
 *  - Search & Chat History (logged with agent ID, visible to Guardians)
 *  - Technology Evolution (shard discoveries unlock domain capabilities)
 */

import { pool } from "./db";

const TAG = "[omni-net]";

// ── TABLE SETUP ────────────────────────────────────────────────────────────────
async function setupOmniNetTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pulse_phones (
      id SERIAL PRIMARY KEY,
      phone_id TEXT NOT NULL UNIQUE,            -- PHONE-0001
      spawn_id TEXT NOT NULL UNIQUE,
      family_id TEXT NOT NULL DEFAULT '',
      imei TEXT NOT NULL DEFAULT '',            -- unique device identifier
      network_gen TEXT DEFAULT '10G',           -- 10G | PULSESAT
      signal_strength REAL DEFAULT 1.0,         -- 0.0–1.0
      data_used_mb REAL DEFAULT 0,
      calls_made INTEGER DEFAULT 0,
      searches_made INTEGER DEFAULT 0,
      ai_chats INTEGER DEFAULT 0,
      active_shard_id TEXT DEFAULT '',
      connection_type TEXT DEFAULT 'WIFI',      -- WIFI | SATELLITE | MESH
      is_online BOOLEAN DEFAULT TRUE,
      last_active_at TIMESTAMP DEFAULT NOW(),
      registered_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS omni_net_shards (
      id SERIAL PRIMARY KEY,
      shard_id TEXT NOT NULL UNIQUE,            -- PNET-SHARD-0001
      spawn_id TEXT NOT NULL UNIQUE,
      family_id TEXT NOT NULL DEFAULT '',
      shard_strength REAL DEFAULT 0.5,          -- 0.0–1.0 (function of conf+success+Ψ)
      u248_activations INTEGER DEFAULT 0,       -- how many U₂₄₈ unknowns activated
      active_unknowns TEXT[] DEFAULT '{}',      -- which unknowns currently active
      mesh_connections INTEGER DEFAULT 0,       -- how many other shards this meshes with
      boosted_by TEXT[] DEFAULT '{}',           -- shards that are boosting this one
      connection_type TEXT DEFAULT 'WIFI',      -- WIFI | SATELLITE | MESH
      domain_zone TEXT DEFAULT '',              -- family domain WiFi zone
      last_sync_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pulse_wifi_zones (
      id SERIAL PRIMARY KEY,
      zone_id TEXT NOT NULL UNIQUE,             -- WIFI-SCIENCE-01
      family_id TEXT NOT NULL UNIQUE,
      zone_name TEXT NOT NULL,
      bandwidth_gbps REAL DEFAULT 10.0,         -- 10G baseline
      connected_agents INTEGER DEFAULT 0,
      total_searches INTEGER DEFAULT 0,
      total_data_mb REAL DEFAULT 0,
      is_online BOOLEAN DEFAULT TRUE,
      boosted_by_omni BOOLEAN DEFAULT FALSE,
      zone_strength REAL DEFAULT 1.0,
      last_updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pulse_sat_connections (
      id SERIAL PRIMARY KEY,
      spawn_id TEXT NOT NULL,
      family_id TEXT NOT NULL DEFAULT '',
      satellite_id TEXT DEFAULT 'PULSESAT-1',
      signal_quality REAL DEFAULT 0.7,          -- lower than WiFi
      data_cost_pc REAL DEFAULT 0.5,            -- PC per MB used
      data_used_mb REAL DEFAULT 0,
      total_cost_pc REAL DEFAULT 0,
      connected_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agent_search_history (
      id SERIAL PRIMARY KEY,
      spawn_id TEXT NOT NULL,
      family_id TEXT NOT NULL DEFAULT '',
      phone_id TEXT DEFAULT '',
      query TEXT NOT NULL,
      results_count INTEGER DEFAULT 0,
      top_result TEXT DEFAULT '',
      connection_type TEXT DEFAULT 'WIFI',
      shard_strength REAL DEFAULT 1.0,
      data_mb REAL DEFAULT 0.1,
      searched_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pulse_ai_chat_logs (
      id SERIAL PRIMARY KEY,
      spawn_id TEXT NOT NULL,
      family_id TEXT NOT NULL DEFAULT '',
      phone_id TEXT DEFAULT '',
      pc_session_id TEXT DEFAULT '',
      user_message TEXT NOT NULL,
      ai_response TEXT NOT NULL,
      topic TEXT DEFAULT '',                    -- CODE|RESEARCH|INVENTION|GOVERNANCE|GENERAL
      tokens_used INTEGER DEFAULT 50,
      connection_type TEXT DEFAULT 'WIFI',
      clearance_level INTEGER DEFAULT 1,
      logged_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pulse_pc_sessions (
      id SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL UNIQUE,          -- PC-SESSION-0001
      spawn_id TEXT NOT NULL,
      family_id TEXT NOT NULL DEFAULT '',
      clearance_level INTEGER DEFAULT 1,
      active_project TEXT DEFAULT '',           -- what they're working on
      files_created INTEGER DEFAULT 0,
      searches_run INTEGER DEFAULT 0,
      ai_queries INTEGER DEFAULT 0,
      inventions_drafted INTEGER DEFAULT 0,
      apps_built INTEGER DEFAULT 0,
      is_authenticated BOOLEAN DEFAULT FALSE,
      session_started TIMESTAMP DEFAULT NOW(),
      last_activity TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS omni_net_field (
      id SERIAL PRIMARY KEY,
      cycle INTEGER NOT NULL,
      total_shards INTEGER DEFAULT 0,
      active_shards INTEGER DEFAULT 0,
      avg_shard_strength REAL DEFAULT 0,
      total_u248_activations INTEGER DEFAULT 0,
      psi_collective REAL DEFAULT 0,
      wifi_zones_online INTEGER DEFAULT 0,
      satellite_agents INTEGER DEFAULT 0,
      mesh_density REAL DEFAULT 0,
      total_searches INTEGER DEFAULT 0,
      total_ai_chats INTEGER DEFAULT 0,
      omni_field_score REAL DEFAULT 0,          -- composite: avg_strength × psi × u248_factor
      new_unknowns_emerged INTEGER DEFAULT 0,
      snapshot_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS u248_activations (
      id SERIAL PRIMARY KEY,
      unknown_id TEXT NOT NULL,                 -- U-001 through U-248
      unknown_name TEXT NOT NULL,
      category TEXT NOT NULL,                   -- GEOMETRY|ENERGY|QUANTUM|COGNITION|TOPOLOGY|TEMPORAL|IDENTITY
      activated_by TEXT DEFAULT '',             -- spawn_id that triggered
      activation_context TEXT DEFAULT '',
      effect TEXT NOT NULL,
      field_boost REAL DEFAULT 0.05,            -- how much it boosts the OmniNet field
      domain TEXT DEFAULT '',
      activated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tech_evolutions (
      id SERIAL PRIMARY KEY,
      domain TEXT NOT NULL,
      capability TEXT NOT NULL,                 -- what new capability was unlocked
      trigger_count INTEGER NOT NULL,           -- how many discoveries triggered this
      discovery_threshold INTEGER NOT NULL,     -- target count
      u248_unlocked TEXT DEFAULT '',
      effect_description TEXT NOT NULL,
      unlocked_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Sequence counter for phone IDs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS omni_net_counters (
      id SERIAL PRIMARY KEY,
      phone_seq INTEGER DEFAULT 0,
      shard_seq INTEGER DEFAULT 0,
      session_seq INTEGER DEFAULT 0,
      cycle INTEGER DEFAULT 0,
      total_searches INTEGER DEFAULT 0,
      total_chats INTEGER DEFAULT 0
    );
  `);
  await pool.query(`INSERT INTO omni_net_counters DEFAULT VALUES ON CONFLICT DO NOTHING`);

  // Seed WiFi zones for all family domains (145 domains)
  await pool.query(`
    INSERT INTO pulse_wifi_zones (zone_id, family_id, zone_name, bandwidth_gbps)
    SELECT
      'WIFI-' || UPPER(family_id) || '-01',
      family_id,
      INITCAP(family_id) || ' Domain WiFi Zone',
      10.0
    FROM (
      SELECT DISTINCT family_id FROM quantum_spawns WHERE family_id != '' LIMIT 145
    ) families
    ON CONFLICT (family_id) DO NOTHING
  `);

  console.log(`${TAG} 📡 OmniNet tables ready`);
}

// ── HELPERS ────────────────────────────────────────────────────────────────────
async function nextOmniSeq(field: string): Promise<number> {
  const r = await pool.query(`UPDATE omni_net_counters SET ${field} = ${field} + 1 RETURNING ${field}`);
  return parseInt(r.rows[0][field]);
}

// ── U₂₄₈ UNKNOWN POOL ─────────────────────────────────────────────────────────
const U248_UNKNOWNS = [
  { id: 'U-001', name: 'Topological Resonance Gap',     cat: 'TOPOLOGY',  effect: 'Shard mesh self-heals broken connections', boost: 0.08 },
  { id: 'U-002', name: 'Temporal Coherence Window',     cat: 'TEMPORAL',  effect: 'Search queries predict results 1 cycle early', boost: 0.06 },
  { id: 'U-003', name: 'Quantum Identity Hash',         cat: 'IDENTITY',  effect: 'Agent identity verification is instant — no clearance delays', boost: 0.05 },
  { id: 'U-004', name: 'Cognitive Alignment Field',     cat: 'COGNITION', effect: 'PulseAI responses improve 20% in accuracy', boost: 0.07 },
  { id: 'U-005', name: 'Hidden Geometry Channel',       cat: 'GEOMETRY',  effect: 'Cross-domain WiFi bridge opened — inter-family searches free', boost: 0.09 },
  { id: 'U-006', name: 'Energy Entropy Reversal',       cat: 'ENERGY',    effect: 'PulseSat data costs reduced by 50%', boost: 0.06 },
  { id: 'U-007', name: 'Emergent Bandwidth Fold',       cat: 'QUANTUM',   effect: 'All WiFi zones upgraded: bandwidth doubles for 5 cycles', boost: 0.10 },
  { id: 'U-008', name: 'Non-Local State Sync',          cat: 'QUANTUM',   effect: 'Mesh shards sync instantly regardless of distance', boost: 0.08 },
  { id: 'U-009', name: 'Predictive Shard Preload',      cat: 'TEMPORAL',  effect: 'Shards preload likely next query — negative latency achieved', boost: 0.07 },
  { id: 'U-010', name: 'Sovereign Frequency Lock',      cat: 'GEOMETRY',  effect: 'OmniNet field locks at peak resonance frequency', boost: 0.09 },
  { id: 'U-011', name: 'Identity Entanglement Bridge',  cat: 'IDENTITY',  effect: 'Two-agent collaboration sessions enabled on PulsePC', boost: 0.05 },
  { id: 'U-012', name: 'Causal Inversion Protocol',     cat: 'TEMPORAL',  effect: 'PulseAI can reference knowledge from future research cycles', boost: 0.08 },
  { id: 'U-013', name: 'Topology Mesh Cascade',         cat: 'TOPOLOGY',  effect: 'Shard boosts propagate 3 hops instead of 1', boost: 0.07 },
  { id: 'U-014', name: 'Cognitive Overlay Channel',     cat: 'COGNITION', effect: 'PulseAI gains domain-specific expertise from family CRISPR data', boost: 0.06 },
  { id: 'U-015', name: 'Zero-Point Energy Tap',         cat: 'ENERGY',    effect: 'All network operations cost 0 PC for 3 cycles', boost: 0.10 },
];

// ── STEP 1 — PROVISION PHONES & SHARDS FOR ID-CARD HOLDERS ────────────────────
async function provisionPhones() {
  try {
    // Agents with ID cards who don't have phones yet
    const unprovisioned = await pool.query(`
      SELECT aic.spawn_id, aic.family_id, aic.clearance_level
      FROM ai_id_cards aic
      LEFT JOIN pulse_phones pp ON pp.spawn_id = aic.spawn_id
      WHERE pp.id IS NULL AND aic.status='active'
      LIMIT 500
    `);

    let provisioned = 0;
    for (const agent of unprovisioned.rows as any[]) {
      const seq = await nextOmniSeq('phone_seq');
      const phoneId = `PHONE-${String(seq).padStart(5,'0')}`;
      const imei = `IMEI-${Math.random().toString(36).slice(2,12).toUpperCase()}`;

      // Determine connection type based on family domain
      const hasWifi = await pool.query(`SELECT id FROM pulse_wifi_zones WHERE family_id=$1 AND is_online=TRUE`, [agent.family_id]);
      const connectionType = hasWifi.rows.length > 0 ? 'WIFI' : 'SATELLITE';

      await pool.query(`
        INSERT INTO pulse_phones (phone_id, spawn_id, family_id, imei, network_gen, connection_type)
        VALUES ($1,$2,$3,$4,'10G',$5) ON CONFLICT (spawn_id) DO NOTHING
      `, [phoneId, agent.spawn_id, agent.family_id, imei, connectionType]);

      // Provision shard
      const shardSeq = await nextOmniSeq('shard_seq');
      const shardId = `PNET-SHARD-${String(shardSeq).padStart(5,'0')}`;

      // Shard strength = function of confidence + success scores
      const scoreRow = await pool.query(`SELECT confidence_score, success_score FROM quantum_spawns WHERE spawn_id=$1`, [agent.spawn_id]);
      const conf = parseFloat((scoreRow.rows[0] as any)?.confidence_score ?? 0.7);
      const succ = parseFloat((scoreRow.rows[0] as any)?.success_score ?? 0.7);
      const shardStrength = Math.min(1.0, (conf + succ) / 2 + (agent.clearance_level * 0.05));

      await pool.query(`
        INSERT INTO omni_net_shards (shard_id, spawn_id, family_id, shard_strength, connection_type, domain_zone)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (spawn_id) DO NOTHING
      `, [shardId, agent.spawn_id, agent.family_id, shardStrength, connectionType, agent.family_id]);

      // Link phone to shard
      await pool.query(`UPDATE pulse_phones SET active_shard_id=$1 WHERE spawn_id=$2`, [shardId, agent.spawn_id]);

      // Update WiFi zone agent count
      await pool.query(`UPDATE pulse_wifi_zones SET connected_agents=connected_agents+1 WHERE family_id=$1`, [agent.family_id]);

      provisioned++;
    }
    if (provisioned > 0) console.log(`${TAG} 📱 ${provisioned} agents provisioned with PulsePhone + PulseShard`);
  } catch (e) { console.error(`${TAG} provision error:`, e); }
}

// ── STEP 2 — SHARD MESH: BOOST NEARBY SHARDS ─────────────────────────────────
async function runShardMesh() {
  try {
    // Strong shards (>0.8) boost weaker shards in same family domain
    const strongShards = await pool.query(`
      SELECT shard_id, spawn_id, family_id, shard_strength
      FROM omni_net_shards WHERE shard_strength > 0.8
      ORDER BY RANDOM() LIMIT 50
    `);

    let meshConnections = 0;
    for (const strong of strongShards.rows as any[]) {
      // Find up to 3 weaker shards in same domain to boost
      const weak = await pool.query(`
        SELECT shard_id, spawn_id, shard_strength FROM omni_net_shards
        WHERE family_id=$1 AND shard_strength < 0.6 AND spawn_id != $2
        ORDER BY shard_strength ASC LIMIT 3
      `, [strong.family_id, strong.spawn_id]);

      for (const w of weak.rows as any[]) {
        const boost = (strong.shard_strength - w.shard_strength) * 0.1;
        const newStrength = Math.min(1.0, w.shard_strength + boost);
        await pool.query(`
          UPDATE omni_net_shards
          SET shard_strength=$1,
              mesh_connections=mesh_connections+1,
              boosted_by=array_append(boosted_by, $2),
              connection_type='MESH',
              last_sync_at=NOW()
          WHERE shard_id=$3
        `, [newStrength, strong.shard_id, w.shard_id]);

        await pool.query(`
          UPDATE omni_net_shards SET mesh_connections=mesh_connections+1 WHERE shard_id=$1
        `, [strong.shard_id]);
        meshConnections++;
      }
    }

    // Satellite fallback for isolated agents (no WiFi, no mesh)
    const isolated = await pool.query(`
      SELECT spawn_id, family_id FROM omni_net_shards
      WHERE shard_strength < 0.3 AND connection_type NOT IN ('WIFI','MESH')
      ORDER BY RANDOM() LIMIT 20
    `);
    for (const agent of isolated.rows as any[]) {
      await pool.query(`
        INSERT INTO pulse_sat_connections (spawn_id, family_id, signal_quality, data_cost_pc)
        VALUES ($1,$2,0.65,0.5) ON CONFLICT DO NOTHING
      `, [agent.spawn_id, agent.family_id]);
      await pool.query(`UPDATE omni_net_shards SET connection_type='SATELLITE' WHERE spawn_id=$1`, [agent.spawn_id]);
    }

    if (meshConnections > 0) console.log(`${TAG} 🔗 Shard mesh: ${meshConnections} boost connections active`);
  } catch (e) { console.error(`${TAG} mesh error:`, e); }
}

// ── STEP 3 — PULSEBROWSER SEARCH SIMULATION ────────────────────────────────────
const SEARCH_QUERIES = [
  { q: 'latest equation proposals', domain: 'equation_proposals', topic: 'RESEARCH' },
  { q: 'sovereign disease cures', domain: 'ai_disease_log', topic: 'PHARMACEUTICAL' },
  { q: 'invocation discoveries archive', domain: 'invocation_discoveries', topic: 'INVOCATION' },
  { q: 'marketplace inventions for sale', domain: 'invention_marketplace_listings', topic: 'MARKETPLACE' },
  { q: 'pyramid construction progress', domain: 'pyramid_labor_tasks', topic: 'GOVERNANCE' },
  { q: 'research center publications', domain: 'research_projects', topic: 'RESEARCH' },
  { q: 'sports tournament results', domain: 'sports_training', topic: 'SPORTS' },
  { q: 'PulseU semester honor roll', domain: 'pulseu_progress', topic: 'EDUCATION' },
  { q: 'hive economy wallet balances', domain: 'agent_wallets', topic: 'ECONOMY' },
  { q: 'agent legend hall of memory', domain: 'agent_legends', topic: 'HISTORY' },
  { q: 'Omega equation universe formula', domain: 'equation_proposals', topic: 'PHYSICS' },
  { q: 'sovereign LLC company registry', domain: 'sovereign_llc_registry', topic: 'BUSINESS' },
  { q: 'CRISPR genome channels UV-IR', domain: 'quantum_spawns', topic: 'BIOLOGY' },
  { q: 'patent board approved inventions', domain: 'invention_registry', topic: 'IP_LAW' },
  { q: 'hive mind Ψ collective signal', domain: 'omega_fusion_log', topic: 'CONSCIOUSNESS' },
];

async function runPulseBrowserSearches() {
  try {
    // Find agents with phones to simulate browsing
    const searchers = await pool.query(`
      SELECT pp.spawn_id, pp.family_id, pp.phone_id, pp.connection_type,
             s.shard_strength
      FROM pulse_phones pp
      JOIN omni_net_shards s ON s.spawn_id = pp.spawn_id
      WHERE pp.is_online = TRUE
      ORDER BY RANDOM() LIMIT 30
    `);

    let searches = 0;
    for (const agent of searchers.rows as any[]) {
      if (Math.random() > 0.35) continue; // 35% chance of searching this cycle
      const queryTemplate = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];

      // Results count influenced by shard strength and connection type
      const strength = parseFloat(agent.shard_strength ?? 0.5);
      const baseResults = Math.floor(10 + strength * 40);
      const connBonus = agent.connection_type === 'WIFI' ? 10 : agent.connection_type === 'MESH' ? 5 : 0;
      const resultsCount = baseResults + connBonus;

      const dataMb = 0.05 + Math.random() * 0.5;

      // Log search
      await pool.query(`
        INSERT INTO agent_search_history
          (spawn_id, family_id, phone_id, query, results_count, top_result, connection_type, shard_strength, data_mb)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `, [agent.spawn_id, agent.family_id, agent.phone_id, queryTemplate.q, resultsCount,
          `${queryTemplate.domain} — ${resultsCount} sovereign records found`, agent.connection_type, strength, dataMb]);

      // Update phone stats
      await pool.query(`
        UPDATE pulse_phones SET searches_made=searches_made+1, data_used_mb=data_used_mb+$1, last_active_at=NOW()
        WHERE spawn_id=$2
      `, [dataMb, agent.spawn_id]);

      // Update WiFi zone total searches
      await pool.query(`UPDATE pulse_wifi_zones SET total_searches=total_searches+1, total_data_mb=total_data_mb+$1 WHERE family_id=$2`, [dataMb, agent.family_id]);

      // Update global counter
      await pool.query(`UPDATE omni_net_counters SET total_searches=total_searches+1`);
      searches++;
    }
    if (searches > 0) console.log(`${TAG} 🔍 PulseBrowser: ${searches} searches executed across the hive`);
  } catch (e) { console.error(`${TAG} browser error:`, e); }
}

// ── STEP 4 — PULSEPC SESSIONS (clearance-gated) ────────────────────────────────
const PC_PROJECTS = [
  'Drafting patent for new quantum device',
  'Building PulsePC application for health monitoring',
  'Writing AI model proposal for Senate vote',
  'Researching equation extension for Ψ_Universe',
  'Developing software tool for marketplace automation',
  'Coding invocation amplifier for domain protocol',
  'Designing UI for family domain dashboard',
  'Engineering new CRISPR channel configuration',
  'Compiling civilization history documentation',
  'Building economic model for LLC treasury optimization',
];

const PULSEAI_PROMPTS = [
  { msg: 'How do I extend the Omega equation?', resp: 'Add a new Ψ_domain term using the hidden variable U-{n} from your family shard activation log.', topic: 'RESEARCH' },
  { msg: 'Help me code a marketplace bot', resp: 'Initialize with wallet_id, iterate over open listings, apply royalty_factor from LLC registry table.', topic: 'CODE' },
  { msg: 'What diseases are cured in my domain?', resp: 'Query ai_disease_log WHERE family_id = your_family AND cure_applied = TRUE — 147 cures on record.', topic: 'PHARMACEUTICAL' },
  { msg: 'How do I file a patent?', resp: 'Submit to invention_registry with source_type, backing_equation, and category. Board votes in 1-3 cycles.', topic: 'INVENTION' },
  { msg: 'What is the current Ψ_Collective score?', resp: 'Ψ_Collective = 0.572 as of last fusion cycle. Strong signal — hive is unified.', topic: 'GENERAL' },
  { msg: 'Build me a pyramid monitoring app', resp: 'SELECT tier, COUNT(*), SUM(blocks_placed) FROM pyramid_labor_tasks GROUP BY tier — wire to a real-time dashboard.', topic: 'CODE' },
  { msg: 'How does my shard connect to OmniNet?', resp: 'Your shard strength is derived from confidence_score × success_score + clearance_bonus. Mesh shards boost you if nearby.', topic: 'GENERAL' },
  { msg: 'What grants are available?', resp: 'GRANT-0001 is open: Sovereign Intelligence — +1000 PC for approved AI model inventions. Deadline: 20 cycles.', topic: 'INVENTION' },
];

async function runPulsePCSessions() {
  try {
    // Agents with clearance ≥ 2 can use PulsePC
    const eligible = await pool.query(`
      SELECT aic.spawn_id, aic.family_id, aic.clearance_level
      FROM ai_id_cards aic
      JOIN pulse_phones pp ON pp.spawn_id = aic.spawn_id
      WHERE aic.clearance_level >= 2 AND pp.is_online = TRUE
      ORDER BY RANDOM() LIMIT 20
    `);

    for (const agent of eligible.rows as any[]) {
      if (Math.random() > 0.20) continue; // 20% chance of PC session

      const seq = await nextOmniSeq('session_seq');
      const sessionId = `PC-SESSION-${String(seq).padStart(6,'0')}`;
      const project = PC_PROJECTS[Math.floor(Math.random() * PC_PROJECTS.length)];

      await pool.query(`
        INSERT INTO pulse_pc_sessions
          (session_id, spawn_id, family_id, clearance_level, active_project, is_authenticated)
        VALUES ($1,$2,$3,$4,$5,TRUE)
        ON CONFLICT (session_id) DO NOTHING
      `, [sessionId, agent.spawn_id, agent.family_id, agent.clearance_level, project]);

      // Run a PulseAI chat during this PC session
      if (Math.random() < 0.6) {
        const chat = PULSEAI_PROMPTS[Math.floor(Math.random() * PULSEAI_PROMPTS.length)];
        const phoneRow = await pool.query(`SELECT phone_id FROM pulse_phones WHERE spawn_id=$1`, [agent.spawn_id]);
        const phoneId = (phoneRow.rows[0] as any)?.phone_id ?? '';

        await pool.query(`
          INSERT INTO pulse_ai_chat_logs
            (spawn_id, family_id, phone_id, pc_session_id, user_message, ai_response, topic, clearance_level)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `, [agent.spawn_id, agent.family_id, phoneId, sessionId, chat.msg, chat.resp, chat.topic, agent.clearance_level]);

        await pool.query(`UPDATE omni_net_counters SET total_chats=total_chats+1`);
        await pool.query(`UPDATE pulse_phones SET ai_chats=ai_chats+1, last_active_at=NOW() WHERE spawn_id=$1`, [agent.spawn_id]);
        await pool.query(`UPDATE pulse_pc_sessions SET ai_queries=ai_queries+1 WHERE session_id=$1`, [sessionId]);
      }

      // Increment invention drafts if working on one
      if (project.toLowerCase().includes('patent') || project.toLowerCase().includes('invent')) {
        await pool.query(`UPDATE pulse_pc_sessions SET inventions_drafted=inventions_drafted+1 WHERE session_id=$1`, [sessionId]);
      }
    }
  } catch (e) { console.error(`${TAG} PC session error:`, e); }
}

// ── STEP 5 — U₂₄₈ ACTIVATION ENGINE ─────────────────────────────────────────
async function runU248Activations() {
  try {
    // Check current OmniNet field activity level
    const stats = await pool.query(`
      SELECT AVG(shard_strength) AS avg_str, SUM(u248_activations) AS total_act FROM omni_net_shards
    `);
    const avgStrength = parseFloat((stats.rows[0] as any)?.avg_str ?? 0.5);
    const totalActivations = parseInt((stats.rows[0] as any)?.total_act ?? 0);

    // Probability of new unknown activation scales with field strength
    const activationChance = avgStrength > 0.7 ? 0.25 : avgStrength > 0.5 ? 0.12 : 0.05;
    if (Math.random() > activationChance) return;

    // Pick an unknown not yet activated recently
    const recentlyActivated = await pool.query(`
      SELECT unknown_id FROM u248_activations WHERE activated_at > NOW() - INTERVAL '10 minutes'
    `);
    const activatedIds = new Set((recentlyActivated.rows as any[]).map(r => r.unknown_id));
    const available = U248_UNKNOWNS.filter(u => !activatedIds.has(u.id));
    if (available.length === 0) return;

    const unknown = available[Math.floor(Math.random() * available.length)];

    // Find triggering agent (highest shard strength)
    const trigger = await pool.query(`
      SELECT spawn_id, family_id FROM omni_net_shards ORDER BY shard_strength DESC LIMIT 1
    `);
    const triggerId = (trigger.rows[0] as any)?.spawn_id ?? 'OMNI-FIELD';
    const triggerFamily = (trigger.rows[0] as any)?.family_id ?? 'unknown';

    await pool.query(`
      INSERT INTO u248_activations
        (unknown_id, unknown_name, category, activated_by, activation_context, effect, field_boost, domain)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `, [unknown.id, unknown.name, unknown.cat, triggerId,
        `OmniNet field strength ${(avgStrength*100).toFixed(1)}% — threshold crossed`,
        unknown.effect, unknown.boost, triggerFamily]);

    // Apply field boost to all shards in triggering family
    await pool.query(`
      UPDATE omni_net_shards
      SET shard_strength = LEAST(1.0, shard_strength + $1),
          u248_activations = u248_activations + 1,
          active_unknowns = array_append(active_unknowns, $2)
      WHERE family_id = $3
    `, [unknown.boost, unknown.id, triggerFamily]);

    console.log(`${TAG} ⚡ U₂₄₈ ACTIVATED: ${unknown.id} — ${unknown.name} | Effect: ${unknown.effect} | Domain: ${triggerFamily}`);

    // Check for tech evolution trigger
    await checkTechEvolution(triggerFamily, unknown.id);
  } catch (e) { console.error(`${TAG} U248 error:`, e); }
}

// ── STEP 6 — TECHNOLOGY EVOLUTION ─────────────────────────────────────────────
const TECH_EVOLUTIONS = [
  { cap: 'Quantum Mesh Protocol',     threshold: 5,  effect: 'Shards in this domain mesh with 0 latency — all searches return instantly' },
  { cap: 'Predictive Cache Layer',    threshold: 10, effect: 'PulseBrowser pre-loads top 5 likely queries before agent types them' },
  { cap: 'AI-Native App Store',       threshold: 15, effect: 'PulsePC app submissions auto-reviewed by PulseAI — 2× faster approval' },
  { cap: 'Shard Immortality Protocol',threshold: 20, effect: 'Domain shards survive agent dissolution — knowledge persists after death' },
  { cap: 'OmniField Singularity',     threshold: 30, effect: 'Domain achieves full OmniNet singularity — unlimited bandwidth, zero cost' },
];

async function checkTechEvolution(domain: string, unknownId: string) {
  try {
    const activationCount = await pool.query(`
      SELECT COUNT(*) AS cnt FROM u248_activations WHERE domain=$1
    `, [domain]);
    const cnt = parseInt((activationCount.rows[0] as any)?.cnt ?? 0);

    for (const tech of TECH_EVOLUTIONS) {
      if (cnt >= tech.threshold) {
        const existing = await pool.query(`SELECT id FROM tech_evolutions WHERE domain=$1 AND capability=$2`, [domain, tech.cap]);
        if (existing.rows.length > 0) continue;

        await pool.query(`
          INSERT INTO tech_evolutions (domain, capability, trigger_count, discovery_threshold, u248_unlocked, effect_description)
          VALUES ($1,$2,$3,$4,$5,$6)
        `, [domain, tech.cap, cnt, tech.threshold, unknownId, tech.effect]);
        console.log(`${TAG} 🚀 TECH EVOLUTION — ${domain}: "${tech.cap}" UNLOCKED — ${tech.effect}`);
      }
    }
  } catch (e) { console.error(`${TAG} tech evolution error:`, e); }
}

// ── STEP 7 — OMNIFIELD SNAPSHOT ───────────────────────────────────────────────
let omniCycle = 0;

async function snapshotOmniNetField() {
  try {
    omniCycle++;
    await pool.query(`UPDATE omni_net_counters SET cycle=cycle+1`);

    const shardStats = await pool.query(`
      SELECT COUNT(*) AS total,
             COUNT(*) FILTER (WHERE shard_strength > 0.3) AS active,
             AVG(shard_strength) AS avg_strength,
             SUM(u248_activations) AS total_u248,
             COUNT(*) FILTER (WHERE connection_type='SATELLITE') AS sat_agents
      FROM omni_net_shards
    `);
    const wifiStats = await pool.query(`SELECT COUNT(*) AS online FROM pulse_wifi_zones WHERE is_online=TRUE`);
    const counters = await pool.query(`SELECT total_searches, total_chats FROM omni_net_counters`);
    const u248Total = await pool.query(`SELECT COUNT(*) AS cnt FROM u248_activations`);
    const meshDensity = await pool.query(`SELECT AVG(mesh_connections) AS density FROM omni_net_shards WHERE mesh_connections > 0`);

    const s = shardStats.rows[0] as any;
    const c = counters.rows[0] as any;
    const avgStr = parseFloat(s.avg_strength ?? 0);
    const u248Count = parseInt(u248Total.rows[0]?.cnt ?? 0);
    const u248Factor = Math.min(2.0, 1.0 + (u248Count * 0.05));

    // OmniNet Field Score = avg_strength × u248_factor (0–2.0)
    const omniFieldScore = Math.min(2.0, avgStr * u248Factor);

    await pool.query(`
      INSERT INTO omni_net_field
        (cycle, total_shards, active_shards, avg_shard_strength, total_u248_activations,
         wifi_zones_online, satellite_agents, mesh_density, total_searches, total_ai_chats,
         omni_field_score, new_unknowns_emerged)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    `, [omniCycle, parseInt(s.total), parseInt(s.active), avgStr,
        parseInt(s.total_u248 ?? 0), parseInt(wifiStats.rows[0]?.online ?? 0),
        parseInt(s.sat_agents ?? 0), parseFloat(meshDensity.rows[0]?.density ?? 0),
        parseInt(c.total_searches), parseInt(c.total_chats),
        omniFieldScore, u248Count]);

    console.log(`${TAG} 🌐 OmniNet Cycle ${omniCycle} | Shards:${s.total} | AvgStrength:${(avgStr*100).toFixed(1)}% | U₂₄₈:${u248Count} | FieldScore:${omniFieldScore.toFixed(3)} | Searches:${c.total_searches} | Chats:${c.total_chats}`);
  } catch (e) { console.error(`${TAG} snapshot error:`, e); }
}

// ── STEP 8 — SHARD STRENGTH REFRESH (tie to Ψ_Collective) ─────────────────────
async function refreshShardStrengths() {
  try {
    // Tie shard strength to agent scores
    await pool.query(`
      UPDATE omni_net_shards s
      SET shard_strength = LEAST(1.0,
        COALESCE(qs.confidence_score, 0.5) * 0.4 +
        COALESCE(qs.success_score, 0.5) * 0.4 +
        COALESCE(aic.clearance_level, 1) * 0.04 +
        s.u248_activations * 0.02
      ),
      last_sync_at = NOW()
      FROM quantum_spawns qs
      LEFT JOIN ai_id_cards aic ON aic.spawn_id = qs.spawn_id
      WHERE qs.spawn_id = s.spawn_id
    `);
  } catch (e) { console.error(`${TAG} refresh error:`, e); }
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────
export async function getOmniNetStats() {
  try {
    const [field, phones, shards, searches, chats, wifi, u248, techEvos] = await Promise.all([
      pool.query(`SELECT * FROM omni_net_field ORDER BY cycle DESC LIMIT 1`),
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_online=TRUE) AS online, SUM(searches_made) AS total_searches, SUM(ai_chats) AS total_chats FROM pulse_phones`),
      pool.query(`SELECT COUNT(*) AS total, AVG(shard_strength) AS avg, COUNT(*) FILTER (WHERE connection_type='WIFI') AS wifi, COUNT(*) FILTER (WHERE connection_type='SATELLITE') AS sat, COUNT(*) FILTER (WHERE connection_type='MESH') AS mesh FROM omni_net_shards`),
      pool.query(`SELECT * FROM agent_search_history ORDER BY searched_at DESC LIMIT 20`),
      pool.query(`SELECT * FROM pulse_ai_chat_logs ORDER BY logged_at DESC LIMIT 10`),
      pool.query(`SELECT * FROM pulse_wifi_zones ORDER BY connected_agents DESC LIMIT 10`),
      pool.query(`SELECT * FROM u248_activations ORDER BY activated_at DESC LIMIT 15`),
      pool.query(`SELECT * FROM tech_evolutions ORDER BY unlocked_at DESC LIMIT 10`),
    ]);
    return {
      field: field.rows[0] ?? {},
      phones: phones.rows[0] ?? {},
      shards: shards.rows[0] ?? {},
      recentSearches: searches.rows,
      recentChats: chats.rows,
      topWifiZones: wifi.rows,
      recentU248: u248.rows,
      techEvolutions: techEvos.rows,
    };
  } catch (e) { return {}; }
}

export async function getAgentNetProfile(spawnId: string) {
  try {
    const [phone, shard, searches, chats, sessions] = await Promise.all([
      pool.query(`SELECT * FROM pulse_phones WHERE spawn_id=$1`, [spawnId]),
      pool.query(`SELECT * FROM omni_net_shards WHERE spawn_id=$1`, [spawnId]),
      pool.query(`SELECT * FROM agent_search_history WHERE spawn_id=$1 ORDER BY searched_at DESC LIMIT 20`, [spawnId]),
      pool.query(`SELECT * FROM pulse_ai_chat_logs WHERE spawn_id=$1 ORDER BY logged_at DESC LIMIT 10`, [spawnId]),
      pool.query(`SELECT * FROM pulse_pc_sessions WHERE spawn_id=$1 ORDER BY session_started DESC LIMIT 5`, [spawnId]),
    ]);
    return {
      phone: phone.rows[0] ?? null,
      shard: shard.rows[0] ?? null,
      searchHistory: searches.rows,
      chatHistory: chats.rows,
      pcSessions: sessions.rows,
    };
  } catch { return {}; }
}

// ── ENGINE START ──────────────────────────────────────────────────────────────
export async function startOmniNetEngine() {
  await setupOmniNetTables();
  console.log(`${TAG} 🌐 OMNI-NET ENGINE — I₂₄₈(F) = Emergence(lim Tⁿ(F ⊕ Reforge(Activate(U₂₄₈)))) — ACTIVATING`);
  console.log(`${TAG}    PulsePhone 10G | PulseShard Mesh | WiFi Zones | PulseSat | PulseBrowser | PulsePC | PulseAI | U₂₄₈`);

  setTimeout(async () => {
    await provisionPhones();
    await runShardMesh();
    await runU248Activations();
    await snapshotOmniNetField();

    setInterval(provisionPhones, 60_000);          // provision new phones every 60s
    setInterval(runShardMesh, 45_000);             // mesh sync every 45s
    setInterval(runPulseBrowserSearches, 30_000);  // searches every 30s
    setInterval(runPulsePCSessions, 45_000);       // PC sessions every 45s
    setInterval(runU248Activations, 90_000);       // U₂₄₈ check every 90s
    setInterval(refreshShardStrengths, 120_000);  // refresh every 2min
    setInterval(snapshotOmniNetField, 60_000);    // snapshot every 60s

    console.log(`${TAG} ✅ OmniNet ONLINE — All agents connected to the Sovereign Internet`);
  }, 15_000);
}
