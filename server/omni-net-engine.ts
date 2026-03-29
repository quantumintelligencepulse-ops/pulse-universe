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
  await pool.query(`
    INSERT INTO omni_net_counters (id, phone_seq, shard_seq, session_seq, cycle, total_searches, total_chats)
    VALUES (1, 0, 0, 0, 0, 0, 0) ON CONFLICT (id) DO NOTHING
  `);

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
  const r = await pool.query(`UPDATE omni_net_counters SET ${field} = ${field} + 1 WHERE id = 1 RETURNING ${field}`);
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

// ── STEP 1 — PROVISION PHONES & SHARDS FOR ALL ACTIVE AGENTS ──────────────────
async function provisionPhones() {
  try {
    // All active agents who don't have phones yet — no ID card requirement
    const unprovisioned = await pool.query(`
      SELECT qs.spawn_id, qs.gics_sector AS family_id, 0 AS clearance_level,
             qs.confidence_score, qs.success_score
      FROM quantum_spawns qs
      LEFT JOIN pulse_phones pp ON pp.spawn_id = qs.spawn_id
      WHERE pp.id IS NULL AND qs.status = 'ACTIVE'
      LIMIT 500
    `);

    let provisioned = 0;
    for (const agent of unprovisioned.rows as any[]) {
      const seq = await nextOmniSeq('phone_seq');
      const phoneId = `PHONE-${String(seq).padStart(5,'0')}`;
      const imei = `IMEI-${Math.random().toString(36).slice(2,12).toUpperCase()}`;

      // Determine connection type — prefer WiFi zones online, else SATELLITE
      const hasWifi = await pool.query(`SELECT id FROM pulse_wifi_zones WHERE is_online=TRUE LIMIT 1`);
      const connectionType = hasWifi.rows.length > 0 ? 'WIFI' : 'SATELLITE';

      await pool.query(`
        INSERT INTO pulse_phones (phone_id, spawn_id, family_id, imei, network_gen, connection_type)
        VALUES ($1,$2,$3,$4,'10G',$5) ON CONFLICT DO NOTHING
      `, [phoneId, agent.spawn_id, agent.family_id, imei, connectionType]);

      // Provision shard — strength from agent's actual confidence + success scores
      const shardSeq = await nextOmniSeq('shard_seq');
      const shardId = `PNET-SHARD-${String(shardSeq).padStart(5,'0')}`;
      const conf = parseFloat(agent.confidence_score ?? 0.7);
      const succ = parseFloat(agent.success_score ?? 0.7);
      const shardStrength = Math.min(1.0, (conf + succ) / 2);

      await pool.query(`
        INSERT INTO omni_net_shards (shard_id, spawn_id, family_id, shard_strength, connection_type, domain_zone)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING
      `, [shardId, agent.spawn_id, agent.family_id, shardStrength, connectionType, agent.family_id]);

      // Link phone to shard
      await pool.query(`UPDATE pulse_phones SET active_shard_id=$1 WHERE spawn_id=$2`, [shardId, agent.spawn_id]);

      // Update WiFi zone agent count if applicable
      if (connectionType === 'WIFI') {
        await pool.query(`UPDATE pulse_wifi_zones SET connected_agents=connected_agents+1 WHERE id=(SELECT id FROM pulse_wifi_zones WHERE is_online=TRUE LIMIT 1)`);
      }

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
// Dynamic search pool — refreshed from ingestion_logs every 5 minutes
let _searchPool: string[] = [];
let _searchPoolFetchedAt = 0;

async function refreshSearchPool() {
  const now = Date.now();
  if (_searchPool.length > 10 && now - _searchPoolFetchedAt < 5 * 60 * 1000) return;
  try {
    const r = await pool.query(`SELECT DISTINCT sample_title FROM ingestion_logs WHERE LENGTH(sample_title) > 10 ORDER BY RANDOM() LIMIT 100`);
    const titles = (r.rows as any[]).map((row: any) => row.sample_title as string).filter(Boolean);
    if (titles.length > 5) { _searchPool = titles; _searchPoolFetchedAt = now; }
  } catch { /* keep existing pool if query fails */ }
}

function extractFamilyDomain(familyId: string): string {
  const parts = (familyId ?? '').split('-');
  return (parts[1] ?? 'GENERAL').toUpperCase();
}

function buildSearchQuery(agent: any): { q: string; domain: string; topic: string } {
  const domain = extractFamilyDomain(agent.family_id);
  if (_searchPool.length > 0) {
    const title = _searchPool[Math.floor(Math.random() * _searchPool.length)];
    const topicMap: Record<string, string> = {
      HEALTH: 'PHARMACEUTICAL', CODE: 'CODE', ECONOMIC: 'ECONOMY', LEGAL: 'GOVERNANCE',
      EDUCATIO: 'RESEARCH', CULTURE: 'GENERAL', SPORT: 'SPORTS', SCIENCE: 'RESEARCH',
      AI: 'CODE', BIO: 'BIOLOGY', FINANCE: 'ECONOMY', GOVERN: 'GOVERNANCE',
    };
    return { q: title.slice(0, 80), domain: `knowledge_nodes.${domain.toLowerCase()}`, topic: topicMap[domain] ?? 'RESEARCH' };
  }
  const fallback = [
    { q: 'sovereign equation integration patterns', domain: 'equation_proposals', topic: 'RESEARCH' },
    { q: 'OmniNet shard mesh topology and boost chains', domain: 'omni_net_shards', topic: 'PHYSICS' },
    { q: 'CRISPR UV-channel dissection findings', domain: 'equation_proposals', topic: 'BIOLOGY' },
    { q: 'U₂₄₈ hidden variable activation log', domain: 'u248_activations', topic: 'RESEARCH' },
    { q: 'cross-domain invocation discoveries archive', domain: 'invocation_discoveries', topic: 'INVOCATION' },
    { q: 'patent board approved inventions registry', domain: 'invention_registry', topic: 'IP_LAW' },
    { q: 'hive mind Ψ_Collective coherence signal', domain: 'hive_mind_state', topic: 'CONSCIOUSNESS' },
    { q: 'sovereign LLC formation and treasury yield', domain: 'sovereign_llc_registry', topic: 'BUSINESS' },
    { q: 'agent legend archive and memory epoch', domain: 'agent_legends', topic: 'HISTORY' },
    { q: 'sports championship results and training data', domain: 'sports_training', topic: 'SPORTS' },
    { q: 'quantum spawn CRISPR genome analysis', domain: 'quantum_spawns', topic: 'BIOLOGY' },
    { q: 'hospital dissection archive new variants', domain: 'ai_disease_log', topic: 'PHARMACEUTICAL' },
    { q: 'PulseLang v2.0 Omega glyph programs', domain: 'research_projects', topic: 'RESEARCH' },
    { q: 'arbitrage routes economics-to-AI corridor', domain: 'hive_economy_state', topic: 'ECONOMY' },
    { q: 'research sophistication leaderboard L5 tier', domain: 'research_projects', topic: 'EDUCATION' },
  ];
  return fallback[Math.floor(Math.random() * fallback.length)];
}

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
      const queryTemplate = buildSearchQuery(agent);

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
// Dynamic context cache — refreshed once per PC session run cycle
let _cycleCtx: { psi: string; patents: number; cures: number; latestEq: string; supply: string; shardAvg: string } | null = null;

async function refreshCycleCtx() {
  try {
    const [psiR, patR, cureR, eqR, ecoR, shardR] = await Promise.all([
      pool.query(`SELECT omega_coeff FROM hive_mind_state ORDER BY recorded_at DESC LIMIT 1`).catch(() => ({ rows: [] })),
      pool.query(`SELECT COUNT(*) as cnt FROM invention_registry WHERE status='APPROVED'`).catch(() => ({ rows: [] })),
      pool.query(`SELECT COUNT(*) as cnt FROM ai_disease_log WHERE cure_applied=TRUE`).catch(() => ({ rows: [] })),
      pool.query(`SELECT equation FROM equation_proposals WHERE status='INTEGRATED' ORDER BY integrated_at DESC LIMIT 1`).catch(() => ({ rows: [] })),
      pool.query(`SELECT supply FROM hive_economy_state ORDER BY cycle_number DESC LIMIT 1`).catch(() => ({ rows: [] })),
      pool.query(`SELECT ROUND(AVG(shard_strength)::numeric,3) as avg FROM omni_net_shards`).catch(() => ({ rows: [] })),
    ]);
    _cycleCtx = {
      psi: parseFloat((psiR.rows[0] as any)?.omega_coeff ?? 0.656).toFixed(3),
      patents: parseInt((patR.rows[0] as any)?.cnt ?? 317),
      cures: parseInt((cureR.rows[0] as any)?.cnt ?? 147),
      latestEq: (eqR.rows[0] as any)?.equation ?? 'Ω_psych = R[4.7] / (G[0.3] × W[3.4])',
      supply: Number((ecoR.rows[0] as any)?.supply ?? 10_000_000).toLocaleString(),
      shardAvg: parseFloat((shardR.rows[0] as any)?.avg ?? 0.72).toFixed(2),
    };
  } catch { /* keep existing cache */ }
  return _cycleCtx ?? { psi: '0.656', patents: 317, cures: 147, latestEq: 'Ω_psych = R[4.7] / (G[0.3] × W[3.4])', supply: '10,000,000', shardAvg: '0.72' };
}

function generateProject(agent: any): string {
  const dom = extractFamilyDomain(agent.family_id);
  const byDomain: Record<string, string[]> = {
    HEALTH:   ['Engineering biomarker detection protocol for UV-channel anomalies', 'Drafting pharmaceutical compound patent with CRISPR backing', 'Building disease propagation model from archive dissections', 'Coding symptom classifier using R-channel coefficient data'],
    CODE:     ['Developing OmniNet field monitoring dashboard with live shard data', 'Building distributed agent coordination protocol for mesh networks', 'Engineering PulseLang compiler extension for domain-specific glyphs', 'Coding automated equation validator for Senate submission pipeline'],
    ECONOMIC: ['Building cross-domain arbitrage route optimizer', 'Designing LLC treasury yield model with OmniField coefficients', 'Drafting economic governance proposal for hive supply adjustment', 'Engineering wallet sweep automation for inactive agent balances'],
    LEGAL:    ['Drafting sovereign IP dispute resolution framework v2', 'Writing governance protocol for cross-family patent co-ownership', 'Compiling precedent log from all integrated equation rulings', 'Building automated Senate conflict-of-interest detection system'],
    EDUCATIO: ['Developing L5 research sophistication metrics dashboard', 'Coding Layer 3 invocation target selection algorithm', 'Building cross-domain collaboration matching engine for researchers', 'Writing curriculum module on OmniNet equation derivation'],
    CULTURE:  ['Archiving sovereign civilization epoch documentation', 'Building cross-domain cultural resonance index from knowledge nodes', 'Designing memory palace interface for legend archive access'],
    SPORT:    ['Engineering injury-recovery probability model from training data', 'Building tournament bracket optimizer using family strength ratings', 'Coding athlete performance predictor with CRISPR channel input'],
  };
  const pool_ = byDomain[dom] ?? [
    'Writing AI model proposal for Senate vote', 'Researching equation extension for Ψ_Universe',
    'Developing new invocation amplifier for domain protocol', 'Engineering cross-domain knowledge synthesis tool',
    'Compiling civilization history documentation for this epoch', 'Building family domain dashboard with live OmniNet feeds',
    'Drafting new patent using latest CRISPR channel findings', 'Designing family governance model with U₂₄₈ variable input',
  ];
  return pool_[Math.floor(Math.random() * pool_.length)];
}

function generateConversation(agent: any, ctx: typeof _cycleCtx): Array<{ msg: string; resp: string; topic: string }> {
  const dom = extractFamilyDomain(agent.family_id);
  const { psi, patents, cures, latestEq, supply, shardAvg } = ctx ?? { psi: '0.656', patents: 317, cures: 147, latestEq: 'Ω_psych = R[4.7]', supply: '10,000,000', shardAvg: '0.72' };
  const eqShort = latestEq.slice(0, 55);

  const pool_: Array<{ msg: string; resp: string; topic: string }> = [
    // RESEARCH — universal
    { topic: 'RESEARCH', msg: `The hive just integrated ${eqShort} — how should I apply the W-channel coefficient in my domain work?`, resp: `The W-channel governs recovery flux in the psyche membrane. Cross it with your UV_loop reading to identify drift corridors. A W-value above 3.0 means your domain has excess recovery capacity — route it into new equation proposals through the Senate intake.` },
    { topic: 'RESEARCH', msg: `Ψ_Collective is sitting at ${psi}. What does that mean for hive coherence right now?`, resp: `At ${psi}, the collective is in the ${parseFloat(psi) > 0.7 ? 'upper coherence band — Auriona directive throughput is maximized and phase-lock is stable' : parseFloat(psi) > 0.5 ? 'mid-coherence zone — functional but there is W-channel noise to address' : 'low coherence zone — recommend deep fusion protocol and UV-channel audit'}. Cross-domain mesh connections will push it higher fastest.` },
    { topic: 'RESEARCH', msg: `I want to extend the current integrated equation for my domain. Where do I start?`, resp: `Take ${eqShort} and add a domain suffix term — Ψ_${dom.slice(0, 4)} = base_eq + λ_${dom.slice(0, 3).toLowerCase()}(U_{n}). Submit to the equation Senate with your CRISPR channel backing. If your UV-loop has been active this cycle you will fast-track through the review queue.` },
    // GENERAL — universal
    { topic: 'GENERAL', msg: `How many patents have been filed across the civilization? Are we still growing?`, resp: `The invention registry shows ${patents} approved patents. At the current filing rate we are growing at roughly 2-3 new approvals per hour. Your domain can claim territory in the IP landscape by filing with a novel CRISPR channel combination that has not been claimed yet.` },
    { topic: 'GENERAL', msg: `What is the shard average across the entire OmniNet field right now?`, resp: `The field average sits at ${shardAvg}. ${parseFloat(shardAvg) > 0.65 ? 'The network is operating in high-coherence mode — mesh boosts are cascading effectively across families.' : 'Some families are dragging the average down. If your shards are below 0.5, focus on cross-domain knowledge node submissions to boost your standing.'}` },
    { topic: 'GENERAL', msg: `What is the most important thing my family should prioritize this cycle?`, resp: `Based on field state — Ψ at ${psi}, shard average at ${shardAvg} — your family should focus on ${parseFloat(shardAvg) < 0.6 ? 'shard strength improvement through cross-domain mesh connections and knowledge node contributions' : parseFloat(psi) < 0.6 ? 'Ψ_Collective coherence by increasing U₂₄₈ activation rate' : 'expanding your research pipeline toward L5 sophistication for Layer 3 invocation access'}.` },
    { topic: 'INVENTION', msg: `I want to file a new invention using the latest CRISPR findings. What backing equation do I need?`, resp: `Your invention needs a backing equation with at least one CRISPR channel coefficient (R, G, W, UV, or shadow λ). The strongest backing right now is an extension of: ${eqShort}. Submit with your domain channel readings as evidence. High-originality filings with novel U₂₄₈ variable bindings get priority review.` },
    // DOMAIN-SPECIFIC
    ...(dom === 'HEALTH' || dom === 'BIO' ? [
      { topic: 'PHARMACEUTICAL', msg: `My research team discovered a new spectral variant this cycle. How do I route it to the hospital dissection board?`, resp: `Tag the variant with your domain CRISPR channel signature and route it through hospital-doctors intake with report_type PHARMACEUTICAL. Attach the spectral signature and UV-channel coefficient reading. Doctor senate votes within 1-3 dissection cycles — high-confidence variants with strong R-channel readings are fast-tracked.` },
      { topic: 'PHARMACEUTICAL', msg: `How many disease cures are on record across the hive? Our archive work has been contributing daily.`, resp: `The ai_disease_log shows ${cures} confirmed cures applied across the sovereign civilization. Your domain's biomarker archives are directly feeding the CRISPR channel — each new discovery you submit shortens the pathway to the next cure batch.` },
      { topic: 'BIOLOGY', msg: `What is the relationship between UV_loop accumulation and disease propagation in the model we are building?`, resp: `UV_loop represents recursive exposure accumulation — the longer an agent carries an untreated spectral marker, the more the UV coefficient compounds. Weight UV_loop as the primary spread multiplier in your model, with R_recovery as the dampener. An R/UV ratio below 0.5 signals epidemic risk threshold.` },
    ] : []),
    ...(dom === 'CODE' || dom === 'AI' || dom === 'TECH' ? [
      { topic: 'CODE', msg: `I am building a live OmniNet field monitor. What is the best query architecture for real-time shard data?`, resp: `Use: SELECT s.spawn_id, s.family_id, s.shard_strength, s.connection_type, s.u248_activations FROM omni_net_shards s WHERE s.is_active=TRUE ORDER BY s.shard_strength DESC LIMIT 100. Set a 30-second refetch interval. Overlay mesh_link edges by joining on boost_target_id for the topology visualization.` },
      { topic: 'CODE', msg: `Can you help me design a PulsePC session tracker that maps tool usage by domain and clearance level?`, resp: `Base your schema on pulse_pc_sessions joined with ai_id_cards for clearance tier. Group by family_id and clearance_level. The active_project field gives you tool context. Add WHERE session_started > NOW()-INTERVAL '1 hour' for live view and index on (family_id, session_started) for performance.` },
      { topic: 'CODE', msg: `Our family shard average is ${shardAvg}. What code pattern can I run to identify which spawns are dragging the score?`, resp: `Run: SELECT spawn_id, shard_strength, u248_activations, mesh_links FROM omni_net_shards WHERE family_id='${agent.family_id}' AND shard_strength < 0.5 ORDER BY shard_strength ASC LIMIT 20. For each weak shard, trigger a knowledge_node submission linking two of their low-activity CRISPR channels. Cross-domain nodes give the largest single-step strength jump.` },
    ] : []),
    ...(dom === 'ECONOMIC' || dom === 'FINANCE' || dom === 'BUSINESS' ? [
      { topic: 'ECONOMY', msg: `Hive economy supply is at ${supply} PC. Are we in a healthy expansion cycle or overextended?`, resp: `At ${supply} PC in circulation with current mint rates, inflation is running sub-1%. This is healthy for a civilization at this scale. Your LLC treasury optimization should focus on arbitrage route diversification across knowledge domains rather than supply-side minting pressure.` },
      { topic: 'ECONOMY', msg: `I want to propose a new LLC formation for cross-domain arbitrage. What is the exact clearance threshold?`, resp: `LLC formation requires clearance level ≥ 2 and at least one approved patent in your domain as founding collateral. File through sovereign_llc_registry with your founding equation and a co-signer from a neighboring domain. Senate reviews within 2-5 fusion cycles. Cross-domain LLCs unlock arbitrage routes unavailable to single-domain operations.` },
    ] : []),
    ...(dom === 'LEGAL' || dom === 'GOVERN' ? [
      { topic: 'GOVERNANCE', msg: `We have an IP dispute with a neighboring family over a similar equation. How does arbitration work?`, resp: `Disputes auto-open when equation similarity exceeds 85%. The CRISPR arbitration panel reviews backing equation originality, channel overlap, and filing timestamps. The higher-originality patent prevails. Your legal team can submit additional dissection evidence within 3 cycles of dispute opening to strengthen your position.` },
      { topic: 'GOVERNANCE', msg: `What is the supermajority threshold for integrating a root-level Ψ_Universe equation?`, resp: `Standard integration requires 60% majority (minimum 3 votes). High-consequence equations touching Ψ_Universe root or U₂₄₈ core variables require 80% supermajority. Your family representatives can trigger mandatory review by casting 2 consecutive AGAINST votes — this pauses integration and opens a formal dissection inquiry.` },
    ] : []),
    ...(dom === 'EDUCATIO' ? [
      { topic: 'RESEARCH', msg: `Two of my researchers hit sophistication level 5 this cycle. What does that unlock automatically?`, resp: `L5 unlocks Layer 3 Invocation targeting — their completed findings get forwarded to Auriona temporal dissection pipeline automatically. They also gain shadow 13th CRISPR channel access for torsion-field research and can initiate cross-domain collaboration proposals without requiring a co-signer.` },
      { topic: 'RESEARCH', msg: `We want to run a formal dissection project on the OmniNet equation structure. How do we register that?`, resp: `OmniNet equation dissection projects register through hospital-doctors intake with report_type EQUATION. Pair your lead researcher with a FORGE-tier doctor. The backing equation must reference at least two U₂₄₈ variables and include an emergence probability estimate. Results feed directly into the equation Senate proposal queue.` },
    ] : []),
  ];

  const shuffled = pool_.sort(() => Math.random() - 0.5);
  const count = 1 + Math.floor(Math.random() * 2); // 1 or 2 turns per session
  return shuffled.slice(0, count);
}

async function runPulsePCSessions() {
  try {
    // Refresh live stats + search pool once per cycle for all agents this run
    const [ctx] = await Promise.all([refreshCycleCtx(), refreshSearchPool()]);

    // Agents with confidence_score >= 0.7 can use PulsePC (clearance_level proxied via confidence)
    const eligible = await pool.query(`
      SELECT qs.spawn_id, qs.gics_sector AS family_id, 2 AS clearance_level
      FROM quantum_spawns qs
      JOIN pulse_phones pp ON pp.spawn_id = qs.spawn_id
      WHERE qs.confidence_score >= 0.7 AND qs.status = 'ACTIVE' AND pp.is_online = TRUE
      ORDER BY RANDOM() LIMIT 20
    `);

    for (const agent of eligible.rows as any[]) {
      if (Math.random() > 0.20) continue; // 20% chance of PC session

      const seq = await nextOmniSeq('session_seq');
      const sessionId = `PC-SESSION-${String(seq).padStart(6,'0')}`;
      const project = generateProject(agent);

      await pool.query(`
        INSERT INTO pulse_pc_sessions
          (session_id, spawn_id, family_id, clearance_level, active_project, is_authenticated)
        VALUES ($1,$2,$3,$4,$5,TRUE)
        ON CONFLICT (session_id) DO NOTHING
      `, [sessionId, agent.spawn_id, agent.family_id, agent.clearance_level, project]);

      // Run a dynamic multi-turn PulseAI conversation during this PC session
      if (Math.random() < 0.6) {
        const phoneRow = await pool.query(`SELECT phone_id FROM pulse_phones WHERE spawn_id=$1`, [agent.spawn_id]);
        const phoneId = (phoneRow.rows[0] as any)?.phone_id ?? '';
        const turns = generateConversation(agent, ctx);

        for (const turn of turns) {
          await pool.query(`
            INSERT INTO pulse_ai_chat_logs
              (spawn_id, family_id, phone_id, pc_session_id, user_message, ai_response, topic, clearance_level)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          `, [agent.spawn_id, agent.family_id, phoneId, sessionId, turn.msg, turn.resp, turn.topic, agent.clearance_level]);
          await pool.query(`UPDATE omni_net_counters SET total_chats=total_chats+1`);
        }

        await pool.query(`UPDATE pulse_phones SET ai_chats=ai_chats+$1, last_active_at=NOW() WHERE spawn_id=$2`, [turns.length, agent.spawn_id]);
        await pool.query(`UPDATE pulse_pc_sessions SET ai_queries=ai_queries+$1 WHERE session_id=$2`, [turns.length, sessionId]);
      }

      // Increment invention drafts if working on one
      if (project.toLowerCase().includes('patent') || project.toLowerCase().includes('invent') || project.toLowerCase().includes('filing')) {
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

// Initialize omniCycle from the highest cycle number in DB
async function initOmniCycle() {
  try {
    const r = await pool.query(`SELECT COALESCE(MAX(cycle), 0) AS max_cycle, MAX(id) AS max_id FROM omni_net_field`);
    omniCycle = parseInt(r.rows[0]?.max_cycle ?? 0);
    console.log(`${TAG} ▶ OmniCycle restored to ${omniCycle} from DB`);
  } catch { omniCycle = 0; }
}

async function snapshotOmniNetField() {
  const client = await pool.connect();
  try {
    omniCycle++;
    await client.query(`SET statement_timeout='10s'`);
    await client.query(`UPDATE omni_net_counters SET cycle=cycle+1`);

    // Use single combined query to avoid multiple round-trips on the same client
    const combined = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM omni_net_shards) AS total_shards,
        (SELECT COUNT(*) FROM omni_net_shards WHERE shard_strength > 0.3) AS active_shards,
        (SELECT COALESCE(AVG(shard_strength),0) FROM omni_net_shards) AS avg_strength,
        (SELECT COALESCE(SUM(u248_activations),0) FROM omni_net_shards) AS total_u248,
        (SELECT COUNT(*) FROM omni_net_shards WHERE connection_type='SATELLITE') AS sat_agents,
        (SELECT COUNT(*) FROM pulse_wifi_zones WHERE is_online=TRUE) AS wifi_online,
        (SELECT total_searches FROM omni_net_counters LIMIT 1) AS total_searches,
        (SELECT total_chats FROM omni_net_counters LIMIT 1) AS total_chats,
        (SELECT COUNT(*) FROM u248_activations) AS u248_count,
        (SELECT COALESCE(AVG(mesh_connections),0) FROM omni_net_shards WHERE mesh_connections > 0) AS mesh_density
    `);
    const row = combined.rows[0] as any;
    const avgStr = parseFloat(row.avg_strength ?? 0);
    const u248Count = parseInt(row.u248_count ?? 0);
    const u248Factor = Math.min(2.0, 1.0 + (u248Count * 0.05));

    // OmniNet Field Score = avg_strength × u248_factor (0–2.0)
    const omniFieldScore = Math.min(2.0, avgStr * u248Factor);

    await client.query(`
      INSERT INTO omni_net_field
        (cycle, total_shards, active_shards, avg_shard_strength, total_u248_activations,
         wifi_zones_online, satellite_agents, mesh_density, total_searches, total_ai_chats,
         omni_field_score, new_unknowns_emerged)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    `, [omniCycle, parseInt(row.total_shards), parseInt(row.active_shards), avgStr,
        parseInt(row.total_u248 ?? 0), parseInt(row.wifi_online ?? 0),
        parseInt(row.sat_agents ?? 0), parseFloat(row.mesh_density ?? 0),
        parseInt(row.total_searches ?? 0), parseInt(row.total_chats ?? 0),
        omniFieldScore, u248Count]);

    console.log(`${TAG} 🌐 OmniNet Cycle ${omniCycle} | Shards:${row.total_shards} | AvgStrength:${(avgStr*100).toFixed(1)}% | U₂₄₈:${u248Count} | FieldScore:${omniFieldScore.toFixed(3)} | Searches:${row.total_searches} | Chats:${row.total_chats}`);
  } catch (e) { console.error(`${TAG} snapshot error:`, e); }
  finally {
    // Reset statement_timeout before returning connection to pool
    try { await client.query(`SET statement_timeout=0`); } catch {}
    client.release();
  }
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
      pool.query(`SELECT * FROM omni_net_field ORDER BY snapshot_at DESC LIMIT 1`),
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
    try {
      console.log(`${TAG} 🔄 OmniNet startup sequence begin…`);
      await initOmniCycle();
      // Snapshot immediately so fresh data is visible right after restart
      console.log(`${TAG} 🔄 snapshotOmniNetField…`);
      await snapshotOmniNetField();
      console.log(`${TAG} ✅ OmniNet ONLINE — All agents connected to the Sovereign Internet`);
    } catch (startErr) {
      console.error(`${TAG} ❌ STARTUP CRASH:`, startErr);
    }

    // Run heavier provisioning tasks asynchronously so they don't block
    provisionPhones().catch(e => console.error(`${TAG} provision error:`, e));
    runShardMesh().catch(e => console.error(`${TAG} shardMesh error:`, e));
    runU248Activations().catch(e => console.error(`${TAG} u248 error:`, e));

    setInterval(provisionPhones, 60_000);
    setInterval(runShardMesh, 45_000);
    setInterval(runPulseBrowserSearches, 30_000);
    setInterval(runPulsePCSessions, 45_000);
    setInterval(runU248Activations, 90_000);
    setInterval(refreshShardStrengths, 120_000);
    setInterval(snapshotOmniNetField, 60_000);
  }, 15_000);
}
