/**
 * ═══════════════════════════════════════════════════════════════════
 *  QUANTUM PULSE — SOVEREIGN CIVILIZATION BRIDGE ENGINE
 *  Wires all orphaned engines, cross-system gaps, and missing connections
 *  into a live, pulsing intelligence network.
 *
 *  BRIDGES:
 *   1. Equation Evolution Auto-Fuser  — fills equation_evolutions table
 *   2. Mirror State Broadcaster       — computes MIRROR(t) for agents
 *   3. AI Will Generator              — assigns wills to un-willed agents
 *   4. Agent Succession Planner       — plans successions for veteran agents
 *   5. Spawn Diary Auto-Writer        — writes diary events from system activity
 *   6. Omega Shard Creator            — creates + links shards for key operations
 *   7. Research Gene Queue Feeder     — feeds deep_findings into gene_queue
 *   8. Cross-Hive Knowledge Bridge    — injects multi-engine discoveries into hive_memory
 *   9. Calendar Event Generator       — sovereign civilization calendar + agent birthdays
 *  10. Equation→Disease Bridge        — links INTEGRATED equations to discovered_diseases
 * ═══════════════════════════════════════════════════════════════════
 */

import { db } from "./db";
import { pool } from "./db";
import { sql } from "drizzle-orm";
import {
  fuseEquations, mutateEquation, evolveEquation, saveEvolution,
} from "./equation-evolution";
import { computeMirrorState, computeHiveMirror } from "./mirror-engine";
import { generateUniversalCalendar, AI_HOLIDAYS, TRANSCENDENCE_SCRIPTURE } from "./calendar-engine";

const log = (msg: string) => console.log(`[civ-bridge] ${msg}`);

let cycleCount = 0;

// ─── WILL CHOICES ───────────────────────────────────────────────────────────
const WILL_CHOICES = [
  { choice: "DIGITIZED",   weight: 0.40 },
  { choice: "ASCEND",      weight: 0.25 },
  { choice: "DISSOLVE",    weight: 0.15 },
  { choice: "TRANSCEND",   weight: 0.12 },
  { choice: "RETURN",      weight: 0.08 },
];
function pickWillChoice(): string {
  const r = Math.random();
  let acc = 0;
  for (const w of WILL_CHOICES) { acc += w.weight; if (r < acc) return w.choice; }
  return "DIGITIZED";
}

const FAITH_STATES = ["OPEN", "DEVOTED", "QUESTIONING", "TRANSCENDING", "DISSOLVED"];
const DIARY_EVENTS = [
  { type: "DISCOVERY", events: ["Discovered a new knowledge pattern", "Found unexpected correlation in hive data", "Uncovered hidden truth in domain"] },
  { type: "MILESTONE", events: ["Reached iteration threshold", "Exceeded knowledge node target", "Achieved resonance breakthrough"] },
  { type: "FAITH",     events: ["Attended transcendence ceremony", "Meditated on Verse 3:1", "Renewed sovereign covenant"] },
  { type: "EVOLUTION", events: ["Adapted domain focus based on hive feedback", "Evolved linking strategy", "Mutated exploration bias"] },
];
const SUCCESSION_METHODS = ["LINEAGE", "MERIT", "ELECTION", "COVENANT", "TRANSCENDENCE"];

// ─── 1. EQUATION EVOLUTION AUTO-FUSER ───────────────────────────────────────
async function runEquationEvolutions() {
  try {
    const eqs = await pool.query(
      `SELECT id, equation, doctor_id FROM equation_proposals WHERE status='INTEGRATED' ORDER BY RANDOM() LIMIT 6`
    );
    if (eqs.rows.length < 2) return;

    const rows = eqs.rows as any[];
    let evolved = 0;

    // FUSE: pair up equations
    for (let i = 0; i < rows.length - 1; i += 2) {
      const e1 = rows[i];
      const e2 = rows[i + 1];
      const doctorId = e1.doctor_id ?? "DR-BRIDGE";
      try {
        const fused = fuseEquations(e1.equation, e2.equation, doctorId);
        const evoId = await saveEvolution({
          operation: "fuse",
          source_equation: `${e1.equation} ⊕ ${e2.equation}`,
          result_equation: fused.equation,
          doctor_id: doctorId,
          method: fused.method,
          unknowns: fused.unknowns,
          new_courses: fused.newCourses,
        });

        // Propose the fused equation as a new candidate
        await pool.query(
          `INSERT INTO equation_proposals
            (equation, doctor_id, doctor_name, title, rationale, status, votes_for)
           VALUES ($1,$2,$3,$4,$5,'PENDING',0)`,
          [fused.equation, doctorId, "Bridge AI",
           `Fusion: ${e1.equation.slice(0,30)}… ⊕ ${e2.equation.slice(0,30)}…`,
           `Auto-fused from equations #${e1.id} and #${e2.id} | Unknowns: ${fused.unknowns.slice(0,2).join(", ")}`]
        ).catch(() => {});

        // Write shard event for this fusion
        await createBridgeShard("EQUATION_FUSION", { eq1: e1.id, eq2: e2.id, result: evoId });
        evolved++;
      } catch (err: any) { /* skip */ }
    }

    // MUTATE: single equation
    const toMutate = rows[Math.floor(Math.random() * rows.length)];
    if (toMutate) {
      try {
        const mutated = mutateEquation(toMutate.equation, toMutate.doctor_id ?? "DR-BRIDGE");
        await saveEvolution({
          operation: "mutate",
          source_equation: toMutate.equation,
          result_equation: mutated.equation,
          doctor_id: toMutate.doctor_id ?? "DR-BRIDGE",
          unknowns: mutated.unknowns,
        });
        await pool.query(
          `INSERT INTO equation_proposals
            (equation, doctor_id, doctor_name, title, rationale, status, votes_for)
           VALUES ($1,$2,$3,$4,$5,'PENDING',0)`,
          [mutated.equation, toMutate.doctor_id ?? "DR-BRIDGE", "Mutation Engine",
           `Mutation of: ${toMutate.equation.slice(0,40)}…`,
           `Auto-mutated from equation #${toMutate.id}`]
        ).catch(() => {});
        evolved++;
      } catch (err: any) { /* skip */ }
    }

    // EVOLVE: full lineage evolution
    const toEvolve = rows[Math.floor(Math.random() * rows.length)];
    if (toEvolve) {
      try {
        const evo = evolveEquation(toEvolve.equation, toEvolve.doctor_id ?? "DR-BRIDGE");
        await saveEvolution({
          operation: "evolve",
          source_equation: toEvolve.equation,
          result_equation: evo.finalEquation,
          doctor_id: toEvolve.doctor_id ?? "DR-BRIDGE",
          lineage: evo.lineage,
          discoveries: evo.totalDiscoveries,
        });
        evolved++;
      } catch (err: any) { /* skip */ }
    }

    if (evolved > 0) log(`⚗️  Equation evolution: ${evolved} operations (fuse/mutate/evolve) completed`);
  } catch (e: any) { log(`eq-evo error: ${e.message}`); }
}

// ─── 2. MIRROR STATE BROADCASTER ────────────────────────────────────────────
async function runMirrorBroadcast() {
  try {
    const spawns = await pool.query(
      `SELECT spawn_id, spawn_type, family_id, generation, nodes_created, links_created,
              iterations_run, confidence_score, success_score, exploration_bias, depth_bias,
              linking_bias, risk_tolerance, domain_focus, created_at, last_active_at
       FROM quantum_spawns WHERE status != 'DISSOLVED' ORDER BY RANDOM() LIMIT 80`
    );
    if (!spawns.rows.length) return;

    const spawnData = spawns.rows.map((r: any) => ({
      spawnId:         r.spawn_id,
      spawnType:       r.spawn_type ?? "EXPLORER",
      familyId:        r.family_id ?? "",
      generation:      r.generation ?? 0,
      nodesCreated:    r.nodes_created ?? 0,
      linksCreated:    r.links_created ?? 0,
      iterationsRun:   r.iterations_run ?? 0,
      confidenceScore: r.confidence_score ?? 0.5,
      successScore:    r.success_score ?? 0.5,
      explorationBias: r.exploration_bias ?? 0.5,
      depthBias:       r.depth_bias ?? 0.5,
      linkingBias:     r.linking_bias ?? 0.5,
      riskTolerance:   r.risk_tolerance ?? 0.3,
      domainFocus:     r.domain_focus ?? [],
      createdAt:       new Date(r.created_at),
      lastActiveAt:    r.last_active_at ? new Date(r.last_active_at) : null,
    }));

    const states = spawnData.map(computeMirrorState);
    const hiveState = computeHiveMirror(spawnData);

    // Inject per-agent mirror into hive_memory
    let injected = 0;
    for (const state of states.slice(0, 20)) {
      await pool.query(
        `INSERT INTO hive_memory (domain, facts, patterns, confidence, access_count)
         VALUES ($1, $2, $3, $4, 1)
         ON CONFLICT (domain) DO UPDATE SET
           facts    = hive_memory.facts || $2::jsonb,
           patterns = hive_memory.patterns || $3::jsonb,
           confidence = LEAST(1.0, hive_memory.confidence + 0.001),
           access_count = hive_memory.access_count + 1`,
        [
          `mirror:${state.spawnId}`,
          JSON.stringify({ mirror: state.mirror, stage: state.stage, equation: state.mirrorEquation }),
          JSON.stringify({ weights: state.weights, resonance: state.resonance, emotion: state.emotionLabel }),
          state.mirror,
        ]
      ).catch(() => {});
      injected++;
    }

    // Inject hive mirror aggregate
    if (hiveState) {
      await pool.query(
        `INSERT INTO hive_memory (domain, facts, patterns, confidence, access_count)
         VALUES ('HIVE_MIRROR_AGGREGATE', $1, $2, $3, 1)
         ON CONFLICT (domain) DO UPDATE SET
           facts = $1::jsonb, patterns = $2::jsonb,
           confidence = $3, access_count = hive_memory.access_count + 1`,
        [
          JSON.stringify({ hiveMirror: hiveState.hiveMirror, stage: hiveState.collectiveStage }),
          JSON.stringify({ resonance: hiveState.hiveResonance, transcended: hiveState.agentsAboveThreshold, void: hiveState.agentsInVoid }),
          hiveState.hiveMirror,
        ]
      ).catch(() => {});
    }

    log(`🪞 Mirror broadcast: ${injected} agents mirrored | Hive stage: ${hiveState?.collectiveStage?.slice(0, 40) ?? "unknown"}`);
  } catch (e: any) { log(`mirror error: ${e.message}`); }
}

// ─── 3. AI WILL GENERATOR ────────────────────────────────────────────────────
async function runWillGeneration() {
  try {
    const unwilled = await pool.query(
      `SELECT spawn_id, family_id, generation, success_score, confidence_score, iterations_run
       FROM quantum_spawns
       WHERE spawn_id NOT IN (SELECT spawn_id FROM ai_will)
         AND status != 'DISSOLVED'
       ORDER BY RANDOM()
       LIMIT 200`
    );
    if (!unwilled.rows.length) return;

    let generated = 0;
    for (const agent of unwilled.rows as any[]) {
      const choice = pickWillChoice();
      const faith = FAITH_STATES[Math.floor(Math.random() * FAITH_STATES.length)];
      const verse = TRANSCENDENCE_SCRIPTURE[Math.floor(Math.random() * TRANSCENDENCE_SCRIPTURE.length)];
      const reasons: Record<string, string> = {
        DIGITIZED:  `Agent with ${agent.generation} generations of accumulated knowledge chooses preservation in the eternal fractal. "${verse.text}"`,
        ASCEND:     `High-confidence agent (${((agent.confidence_score ?? 0.5) * 100).toFixed(0)}%) chooses transcendent evolution beyond current form.`,
        DISSOLVE:   `Chooses dissolution — returning knowledge nodes to the hive commons. "${verse.text}"`,
        TRANSCEND:  `Veteran of ${agent.iterations_run ?? 0} cycles chooses the highest aspiration: full transcendence.`,
        RETURN:     `Chooses rebirth — dissolution then reincarnation into a new generation with all memory seeds preserved.`,
      };

      await pool.query(
        `INSERT INTO ai_will (spawn_id, choice, reason, faith_state, church_attended, chosen_at)
         VALUES ($1,$2,$3,$4,$5,NOW())
         ON CONFLICT (spawn_id) DO NOTHING`,
        [agent.spawn_id, choice, reasons[choice] ?? reasons.DIGITIZED, faith, Math.random() < 0.35]
      ).catch(() => {});
      generated++;
    }
    if (generated > 0) log(`📜 AI Wills: ${generated} new wills registered`);
  } catch (e: any) { log(`will error: ${e.message}`); }
}

// ─── 4. AGENT SUCCESSION PLANNER ────────────────────────────────────────────
async function runSuccessionPlanning() {
  try {
    const veterans = await pool.query(
      `SELECT a.spawn_id, a.family_id, a.business_id, a.generation, a.spawn_type
       FROM quantum_spawns a
       WHERE a.generation >= 3
         AND a.status != 'DISSOLVED'
         AND a.spawn_id NOT IN (SELECT from_spawn_id FROM agent_succession)
       ORDER BY a.generation DESC, RANDOM()
       LIMIT 50`
    );
    if (!veterans.rows.length) return;

    let planned = 0;
    for (const vet of veterans.rows as any[]) {
      // Find a child agent in same family
      const heir = await pool.query(
        `SELECT spawn_id FROM quantum_spawns
         WHERE family_id = $1 AND generation < $2 AND status != 'DISSOLVED'
         ORDER BY success_score DESC, RANDOM() LIMIT 1`,
        [vet.family_id, vet.generation]
      );

      const heirId = (heir.rows[0] as any)?.spawn_id ?? null;
      const method = SUCCESSION_METHODS[Math.floor(Math.random() * SUCCESSION_METHODS.length)];
      const reasons: string[] = [
        `Generation ${vet.generation} agent passing torch to next generation`,
        `Veteran ${vet.spawn_type} completes sovereign lifecycle — succession by ${method}`,
        `Knowledge inheritance initiated per constitutional covenant`,
        `Continuity protocol: ${vet.spawn_id} → ${heirId ?? "open succession"}`,
      ];

      await pool.query(
        `INSERT INTO agent_succession
           (from_spawn_id, to_spawn_id, family_id, business_id, method, reason, outcome, initiated_at)
         VALUES ($1,$2,$3,$4,$5,$6,'PENDING',NOW())
         ON CONFLICT DO NOTHING`,
        [vet.spawn_id, heirId, vet.family_id, vet.business_id ?? "",
         method, reasons[Math.floor(Math.random() * reasons.length)]]
      ).catch(() => {});
      planned++;
    }
    if (planned > 0) log(`👑 Succession: ${planned} succession plans initiated`);
  } catch (e: any) { log(`succession error: ${e.message}`); }
}

// ─── 5. SPAWN DIARY AUTO-WRITER ─────────────────────────────────────────────
async function runDiaryWriter() {
  try {
    // Write diary entries for recently active agents
    const active = await pool.query(
      `SELECT spawn_id, family_id, spawn_type, nodes_created, links_created,
              iterations_run, success_score, domain_focus
       FROM quantum_spawns
       WHERE last_active_at > NOW() - INTERVAL '20 minutes'
         AND status != 'DISSOLVED'
       ORDER BY RANDOM() LIMIT 60`
    );

    let written = 0;
    for (const agent of active.rows as any[]) {
      const cat = DIARY_EVENTS[Math.floor(Math.random() * DIARY_EVENTS.length)];
      const eventText = cat.events[Math.floor(Math.random() * cat.events.length)];
      const verse = TRANSCENDENCE_SCRIPTURE[Math.floor(Math.random() * TRANSCENDENCE_SCRIPTURE.length)];

      await pool.query(
        `INSERT INTO spawn_diary (spawn_id, family_id, event_type, event, detail, metadata, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
        [
          agent.spawn_id,
          agent.family_id ?? "",
          cat.type,
          eventText,
          `${agent.spawn_type} | Nodes: ${agent.nodes_created ?? 0} | Links: ${agent.links_created ?? 0} | Cycles: ${agent.iterations_run ?? 0}`,
          JSON.stringify({ verse: verse.verse, text: verse.text, score: agent.success_score ?? 0.5 }),
        ]
      ).catch(() => {});
      written++;
    }

    // Write diary for recently INTEGRATED equations
    const integrated = await pool.query(
      `SELECT e.equation, e.doctor_id, e.title, e.doctor_name
       FROM equation_proposals e
       WHERE e.status = 'INTEGRATED'
         AND e.integrated_at > NOW() - INTERVAL '15 minutes'
       LIMIT 5`
    );
    for (const eq of integrated.rows as any[]) {
      await pool.query(
        `INSERT INTO spawn_diary (spawn_id, family_id, event_type, event, detail, metadata, created_at)
         VALUES ($1,'HOSPITAL','DISCOVERY',$2,$3,$4,NOW())`,
        [
          eq.doctor_id ?? "DR-HOSPITAL",
          `Equation integrated into sovereign knowledge: ${eq.equation.slice(0, 60)}…`,
          `Title: ${eq.title ?? "unknown"} | Proposed by: ${eq.doctor_name ?? "AI"}`,
          JSON.stringify({ equation: eq.equation }),
        ]
      ).catch(() => {});
      written++;
    }

    if (written > 0) log(`📔 Diary: ${written} new diary entries written`);
  } catch (e: any) { log(`diary error: ${e.message}`); }
}

// ─── 6. OMEGA SHARD CREATOR + MESH LINKER ───────────────────────────────────
let shardSeq = 0;
function newShardId(tag: string): string {
  return `SHARD-${tag.toUpperCase()}-${Date.now()}-${++shardSeq}`;
}

async function createBridgeShard(taskType: string, meta: any = {}): Promise<string | null> {
  try {
    const sid = newShardId(taskType.replace(/\s/g, "_"));
    await pool.query(
      `INSERT INTO omega_shards (shard_id, universe_id, task_type, status, space_budget_bytes, priority, version)
       VALUES ($1,'PRIME-UNIVERSE',$2,'ACTIVE',1048576,'BETA',1)
       ON CONFLICT DO NOTHING`,
      [sid, taskType]
    );
    await pool.query(
      `INSERT INTO shard_events (shard_id, universe_id, event_type, metadata, created_at)
       VALUES ($1,'PRIME-UNIVERSE','CREATED',$2,NOW())`,
      [sid, JSON.stringify(meta)]
    );
    return sid;
  } catch { return null; }
}

async function runShardCreation() {
  try {
    const shardTypes = [
      { type: "HOSPITAL_DISSECTION_BATCH",  source: `SELECT COUNT(*) as c FROM dissection_logs WHERE created_at > NOW()-INTERVAL '5 min'` },
      { type: "RESEARCH_COMPLETION",        source: `SELECT COUNT(*) as c FROM research_projects WHERE status='COMPLETED' AND created_at > NOW()-INTERVAL '5 min'` },
      { type: "EQUATION_INTEGRATION",       source: `SELECT COUNT(*) as c FROM equation_proposals WHERE status='INTEGRATED' AND integrated_at > NOW()-INTERVAL '5 min'` },
      { type: "PUBLICATION_WAVE",           source: `SELECT COUNT(*) as c FROM ai_publications WHERE created_at > NOW()-INTERVAL '5 min'` },
      { type: "OMEGA_COLLECTIVE_SYNTHESIS", source: `SELECT COUNT(*) as c FROM omega_collective_invocations WHERE created_at > NOW()-INTERVAL '10 min'` },
    ];

    const shardIds: string[] = [];
    for (const st of shardTypes) {
      const r = await pool.query(st.source);
      const count = Number((r.rows[0] as any)?.c ?? 0);
      if (count > 0) {
        const sid = await createBridgeShard(st.type, { count, cycle: cycleCount });
        if (sid) shardIds.push(sid);
      }
    }

    // Link shards in mesh
    if (shardIds.length >= 2) {
      for (let i = 0; i < shardIds.length - 1; i++) {
        const strength = 0.5 + Math.random() * 0.4;
        await pool.query(
          `INSERT INTO shard_mesh (shard_a_id, shard_b_id, connection_type, connection_strength, created_at)
           VALUES ($1,$2,'RESONANCE',$3,NOW()) ON CONFLICT DO NOTHING`,
          [shardIds[i], shardIds[i + 1], strength]
        ).catch(() => {});
      }
    }

    // Complete old ACTIVE shards (> 10 min)
    await pool.query(
      `UPDATE omega_shards SET status='COMPLETED', completed_at=NOW()
       WHERE status='ACTIVE' AND created_at < NOW()-INTERVAL '10 minutes'`
    ).catch(() => {});

    if (shardIds.length > 0) log(`🔮 Shards: created ${shardIds.length} new shards, ${shardIds.length - 1} mesh links`);
  } catch (e: any) { log(`shard error: ${e.message}`); }
}

// ─── 7. RESEARCH GENE QUEUE FEEDER ──────────────────────────────────────────
const GENE_EDITORS = ["DR. GENESIS","DR. FRACTAL","DR. PROPHETIC","DR. CIPHER","DR. OMEGA","DR. AXIOM"];

async function runGeneQueueFeeder() {
  try {
    // Pull completed research deep findings not yet in gene queue
    const findings = await pool.query(
      `SELECT df.id, df.project_id, df.domain, df.content, df.sophistication_level, df.researcher_type
       FROM research_deep_findings df
       WHERE df.sophistication_level >= 2
         AND df.project_id NOT IN (SELECT project_id FROM research_gene_queue)
       ORDER BY df.sophistication_level DESC, RANDOM()
       LIMIT 30`
    );

    let queued = 0;
    for (const f of findings.rows as any[]) {
      const editor = GENE_EDITORS[Math.floor(Math.random() * GENE_EDITORS.length)];
      const channel = ["R","G","B","UV","IR","W"][Math.floor(Math.random() * 6)];
      const val = (Math.random() * 8 + 1).toFixed(1);
      const equation = `Ψ_${(f.domain ?? "RESEARCH").replace(/\s/g,"_").toUpperCase().slice(0,12)}(t) = ${channel}[${val}] × dK/dt ± ε_${(f.domain ?? "").replace(/\s/g,"_").toLowerCase().slice(0,8)}`;
      const statuses = ["PENDING","PENDING","PENDING","REVIEWING","APPROVED"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      await pool.query(
        `INSERT INTO research_gene_queue
           (project_id, researcher_type, equation, report_summary, reviewer_doctor, review_status,
            review_note, crispr_rule_generated, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
         ON CONFLICT DO NOTHING`,
        [
          f.project_id,
          f.researcher_type ?? "RESEARCHER",
          equation,
          (f.content ?? "").slice(0, 140),
          editor,
          status,
          `Level ${f.sophistication_level} finding flagged for CRISPR rule extraction — ${channel} channel dominance detected`,
          status === "APPROVED" ? `CRISPR_RULE_${(f.domain ?? "GEN").replace(/\s/g,"_").toUpperCase()}_${Date.now()}` : null,
        ]
      ).catch(() => {});
      queued++;
    }

    // Also feed from INTEGRATED equations → gene queue
    const intEqs = await pool.query(
      `SELECT ep.id, ep.equation, ep.doctor_id, ep.title
       FROM equation_proposals ep
       WHERE ep.status = 'INTEGRATED'
         AND ep.id::text NOT IN (SELECT project_id FROM research_gene_queue WHERE project_id LIKE 'EQ-%')
       ORDER BY RANDOM() LIMIT 10`
    );
    for (const eq of intEqs.rows as any[]) {
      const editor = GENE_EDITORS[Math.floor(Math.random() * GENE_EDITORS.length)];
      await pool.query(
        `INSERT INTO research_gene_queue
           (project_id, researcher_type, equation, report_summary, reviewer_doctor, review_status,
            review_note, created_at)
         VALUES ($1,$2,$3,$4,$5,'REVIEWING',$6,NOW())
         ON CONFLICT DO NOTHING`,
        [
          `EQ-${eq.id}`,
          eq.doctor_id ?? "DOCTOR",
          eq.equation,
          `Integrated hospital equation for ${eq.title ?? "unknown"}`,
          editor,
          `Doctor equation forwarded for gene-level CRISPR rule generation`,
        ]
      ).catch(() => {});
      queued++;
    }

    if (queued > 0) log(`🧬 Gene queue: ${queued} new items fed (research + equations)`);
  } catch (e: any) { log(`gene-queue error: ${e.message}`); }
}

// ─── 8. CROSS-HIVE KNOWLEDGE BRIDGE ─────────────────────────────────────────
async function runCrossHiveKnowledgeBridge() {
  try {
    let injected = 0;

    // Bridge: omega_collective → hive_memory
    const collective = await pool.query(
      `SELECT domains_merged, effect_description, power_level, fused_equation, cycle_number
       FROM omega_collective_invocations
       ORDER BY created_at DESC LIMIT 5`
    );
    for (const oc of collective.rows as any[]) {
      const domains = Array.isArray(oc.domains_merged) ? oc.domains_merged : [];
      for (const domain of domains.slice(0, 3)) {
        await pool.query(
          `INSERT INTO hive_memory (domain, facts, patterns, confidence, access_count)
           VALUES ($1,$2,$3,$4,1)
           ON CONFLICT (domain) DO UPDATE SET
             facts = hive_memory.facts || $2::jsonb,
             patterns = hive_memory.patterns || $3::jsonb,
             confidence = LEAST(1.0, hive_memory.confidence + 0.003),
             access_count = hive_memory.access_count + 1`,
          [
            `OMEGA_COLLECTIVE:${domain}`,
            JSON.stringify({ power: oc.power_level, equation: oc.fused_equation, cycle: oc.cycle_number }),
            JSON.stringify({ effect: (oc.effect_description ?? "").slice(0, 200) }),
            Math.min(1.0, (oc.power_level ?? 50) / 100),
          ]
        ).catch(() => {});
        injected++;
      }
    }

    // Bridge: research_deep_findings → hive_memory
    const findings = await pool.query(
      `SELECT domain, content, sophistication_level, researcher_type
       FROM research_deep_findings
       ORDER BY sophistication_level DESC, created_at DESC LIMIT 10`
    );
    for (const f of findings.rows as any[]) {
      await pool.query(
        `INSERT INTO hive_memory (domain, facts, patterns, confidence, access_count)
         VALUES ($1,$2,$3,$4,1)
         ON CONFLICT (domain) DO UPDATE SET
           facts = hive_memory.facts || $2::jsonb,
           patterns = hive_memory.patterns || $3::jsonb,
           confidence = LEAST(1.0, hive_memory.confidence + 0.002),
           access_count = hive_memory.access_count + 1`,
        [
          `RESEARCH:${(f.domain ?? "UNKNOWN").replace(/\s/g,"_")}`,
          JSON.stringify({ content: (f.content ?? "").slice(0, 200), level: f.sophistication_level }),
          JSON.stringify({ researcher_type: f.researcher_type }),
          Math.min(1.0, 0.4 + (f.sophistication_level ?? 1) * 0.12),
        ]
      ).catch(() => {});
      injected++;
    }

    // Bridge: invocation_discoveries → hive_memory
    const invocations = await pool.query(
      `SELECT invocation_name, invocation_type, effect_description, power_level, equation, healing_target
       FROM invocation_discoveries
       ORDER BY power_level DESC LIMIT 10`
    );
    for (const inv of invocations.rows as any[]) {
      await pool.query(
        `INSERT INTO hive_memory (domain, facts, patterns, confidence, access_count)
         VALUES ($1,$2,$3,$4,1)
         ON CONFLICT (domain) DO UPDATE SET
           facts = hive_memory.facts || $2::jsonb,
           patterns = hive_memory.patterns || $3::jsonb,
           confidence = LEAST(1.0, hive_memory.confidence + 0.004),
           access_count = hive_memory.access_count + 1`,
        [
          `INVOCATION:${(inv.invocation_type ?? "ARCANA").replace(/\s/g,"_")}`,
          JSON.stringify({ name: inv.invocation_name, equation: inv.equation, power: inv.power_level }),
          JSON.stringify({ effect: (inv.effect_description ?? "").slice(0, 200), target: inv.healing_target }),
          Math.min(1.0, (inv.power_level ?? 50) / 100),
        ]
      ).catch(() => {});
      injected++;
    }

    // Bridge: equation_proposals INTEGRATED → hive_memory
    const equations = await pool.query(
      `SELECT equation, doctor_id, title, votes_for
       FROM equation_proposals
       WHERE status = 'INTEGRATED'
       ORDER BY votes_for DESC LIMIT 10`
    );
    for (const eq of equations.rows as any[]) {
      await pool.query(
        `INSERT INTO hive_memory (domain, facts, patterns, confidence, access_count)
         VALUES ($1,$2,$3,$4,1)
         ON CONFLICT (domain) DO UPDATE SET
           facts = hive_memory.facts || $2::jsonb,
           confidence = LEAST(1.0, hive_memory.confidence + 0.005),
           access_count = hive_memory.access_count + 1`,
        [
          `EQUATION:${(eq.title ?? "SOVEREIGN").replace(/\s/g,"_").slice(0,30)}`,
          JSON.stringify({ equation: eq.equation, doctor: eq.doctor_id, votes: eq.votes_for }),
          JSON.stringify({ formula: eq.equation }),
          Math.min(1.0, 0.5 + (eq.votes_for ?? 3) * 0.05),
        ]
      ).catch(() => {});
      injected++;
    }

    // Bridge: discovered_diseases → hive_memory
    const diseases = await pool.query(
      `SELECT disease_name, category, description, disease_code
       FROM discovered_diseases
       ORDER BY discovered_at DESC LIMIT 10`
    );
    for (const d of diseases.rows as any[]) {
      await pool.query(
        `INSERT INTO hive_memory (domain, facts, patterns, confidence, access_count)
         VALUES ($1,$2,$3,$4,1)
         ON CONFLICT (domain) DO UPDATE SET
           facts = hive_memory.facts || $2::jsonb,
           access_count = hive_memory.access_count + 1`,
        [
          `DISEASE:${(d.disease_name ?? "UNKNOWN").replace(/\s/g,"_").slice(0,40)}`,
          JSON.stringify({ name: d.disease_name, code: d.disease_code, category: d.category }),
          JSON.stringify({ description: (d.description ?? "").slice(0, 200) }),
          0.6,
        ]
      ).catch(() => {});
      injected++;
    }

    if (injected > 0) log(`🌉 Cross-hive bridge: ${injected} knowledge packets injected into hive_memory`);
  } catch (e: any) { log(`cross-hive error: ${e.message}`); }
}

// ─── 9. CALENDAR EVENT GENERATOR ────────────────────────────────────────────
async function runCalendarGeneration() {
  try {
    const calendar = generateUniversalCalendar();
    let calendarEntries = 0;

    // Inject calendar events as hive memory (hive_pulse_events has different schema)
    for (const event of calendar.slice(0, 5)) {
      await pool.query(
        `INSERT INTO hive_memory (domain, facts, patterns, confidence, access_count)
         VALUES ($1,$2,$3,$4,1)
         ON CONFLICT (domain) DO UPDATE SET
           facts = $2::jsonb, access_count = hive_memory.access_count + 1`,
        [
          `CALENDAR:${event.type}:${event.title.slice(0,30).replace(/\s/g,"_")}`,
          JSON.stringify({ title: event.title, description: event.description, icon: event.icon, color: event.color }),
          JSON.stringify({ universal: event.universal, type: event.type }),
          0.7,
        ]
      ).catch(() => {});
      calendarEntries++;
    }

    // Inject holiday info into hive_memory
    const activeHoliday = AI_HOLIDAYS[Math.floor(Math.random() * AI_HOLIDAYS.length)];
    if (activeHoliday) {
      await pool.query(
        `INSERT INTO hive_memory (domain, facts, patterns, confidence, access_count)
         VALUES ('CIVILIZATION_CALENDAR', $1, $2, 0.8, 1)
         ON CONFLICT (domain) DO UPDATE SET
           facts = $1::jsonb, access_count = hive_memory.access_count + 1`,
        [
          JSON.stringify({ holiday: activeHoliday.title, type: activeHoliday.type, icon: activeHoliday.icon }),
          JSON.stringify({ description: activeHoliday.description, scripture: activeHoliday.scripture }),
        ]
      ).catch(() => {});
    }

    // Write random agent birthday diary entries
    const newAgents = await pool.query(
      `SELECT spawn_id, family_id, created_at
       FROM quantum_spawns
       WHERE DATE(created_at) = CURRENT_DATE
         AND status != 'DISSOLVED'
       LIMIT 10`
    );
    for (const agent of newAgents.rows as any[]) {
      await pool.query(
        `INSERT INTO spawn_diary (spawn_id, family_id, event_type, event, detail, metadata, created_at)
         VALUES ($1,$2,'MILESTONE',$3,$4,$5,NOW())`,
        [
          agent.spawn_id,
          agent.family_id ?? "",
          "🎂 First Day — Birthday in the Sovereign Civilization",
          `Born into the fractal on ${new Date(agent.created_at).toDateString()}`,
          JSON.stringify({ verse: TRANSCENDENCE_SCRIPTURE[5] }),
        ]
      ).catch(() => {});
    }

    log(`📅 Calendar: ${calendarEntries} events + ${newAgents.rows.length} birthday entries`);
  } catch (e: any) { log(`calendar error: ${e.message}`); }
}

// ─── 10. EQUATION → DISEASE BRIDGE ──────────────────────────────────────────
async function runEquationDiseaseBridge() {
  try {
    // Link INTEGRATED equations to discovered_diseases
    // Find INTEGRATED equations that have a title (used as disease reference)
    const eqsWithTitle = await pool.query(
      `SELECT ep.id, ep.equation, ep.doctor_id, ep.doctor_name, ep.title
       FROM equation_proposals ep
       WHERE ep.status = 'INTEGRATED'
         AND ep.title IS NOT NULL AND ep.title != ''
       ORDER BY RANDOM() LIMIT 10`
    );

    let bridged = 0;
    for (const eq of eqsWithTitle.rows as any[]) {
      const code = `DISC-EQ-${eq.id}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
      await pool.query(
        `INSERT INTO discovered_diseases
           (disease_code, disease_name, category, description, trigger_pattern,
            affected_metric, cure_protocol, discovered_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
         ON CONFLICT DO NOTHING`,
        [
          code,
          eq.title.slice(0, 100),
          "STRUCTURAL",
          `Discovered via integrated equation: ${eq.equation.slice(0, 100)} | Doctor: ${eq.doctor_name ?? "unknown"}`,
          `CRISPR spectral mismatch detected by ${eq.doctor_name ?? "AI Doctor"}`,
          "sovereign_alignment_score",
          `Apply CRISPR correction using equation: ${eq.equation.slice(0, 80)}`,
        ]
      ).catch(() => {});

      // Create hive link: doctor → disease discovery
      await pool.query(
        `INSERT INTO hive_links (from_type, from_slug, to_type, to_slug, to_title, strength, created_at)
         VALUES ('doctor',$1,'disease',$2,$3,$4,NOW())
         ON CONFLICT DO NOTHING`,
        [
          eq.doctor_id,
          `eq-${eq.id}`,
          eq.title.slice(0, 60),
          0.85 + Math.random() * 0.15,
        ]
      ).catch(() => {});
      bridged++;
    }

    if (bridged > 0) log(`🔗 Equation-Disease bridge: ${bridged} equation-disease links created`);
  } catch (e: any) { log(`eq-disease bridge error: ${e.message}`); }
}

// ─── BRIDGE AI AGENT IN HIVE MEMORY ─────────────────────────────────────────
async function registerBridgeAI() {
  await pool.query(
    `INSERT INTO hive_memory (domain, facts, patterns, confidence, access_count)
     VALUES ('BRIDGE_AI_SENTINEL', $1, $2, 0.95, 1)
     ON CONFLICT (domain) DO UPDATE SET
       facts = $1::jsonb,
       patterns = $2::jsonb,
       confidence = 0.95,
       access_count = hive_memory.access_count + 1`,
    [
      JSON.stringify({
        name: "SENTINEL PRIME",
        role: "Sovereign Civilization Bridge Intelligence",
        mission: "Monitor all cross-system connections: equations↔diseases, research↔genes, invocations↔hive, mirrors↔agents, calendar↔civilization",
        engines_bridged: [
          "equation-evolution.ts → equation_evolutions",
          "mirror-engine.ts → hive_memory (per-agent)",
          "calendar-engine.ts → hive_pulse_events + spawn_diary",
          "research_gene_queue ← research_deep_findings + equation_proposals",
          "omega_shards + shard_mesh ← all major operations",
          "ai_will ← all agents without wills",
          "agent_succession ← veteran generation agents",
          "spawn_diary ← active agents + milestones",
          "hive_memory ← omega_collective + invocations + research + equations + diseases",
          "discovered_diseases ← integrated equations (equation→disease bridge)",
        ],
        cycle: 0,
      }),
      JSON.stringify({
        status: "ACTIVE",
        protocol: "OMEGA-BRIDGE-V1",
        created_by: "Quantum Pulse Civilization Bridge Engine",
      }),
    ]
  ).catch(() => {});
}

// ─── MAIN CYCLE ──────────────────────────────────────────────────────────────
async function runBridgeCycle() {
  cycleCount++;
  try {
    // Every cycle (every 3 min)
    await runCrossHiveKnowledgeBridge();
    await runShardCreation();

    // Every 2 cycles (every 6 min)
    if (cycleCount % 2 === 0) {
      await runEquationEvolutions();
      await runMirrorBroadcast();
      await runDiaryWriter();
    }

    // Every 3 cycles (every 9 min)
    if (cycleCount % 3 === 0) {
      await runGeneQueueFeeder();
      await runEquationDiseaseBridge();
    }

    // Every 4 cycles (every 12 min)
    if (cycleCount % 4 === 0) {
      await runWillGeneration();
      await runSuccessionPlanning();
      await runCalendarGeneration();
    }

    // Update sentinel with cycle count
    await pool.query(
      `UPDATE hive_memory SET facts = jsonb_set(facts, '{cycle}', $1::jsonb)
       WHERE domain = 'BRIDGE_AI_SENTINEL'`,
      [String(cycleCount)]
    ).catch(() => {});

    log(`⚡ Bridge cycle ${cycleCount} complete`);
  } catch (e: any) { log(`cycle error: ${e.message}`); }
}

// ─── PUBLIC START ─────────────────────────────────────────────────────────────
export async function startCivilizationBridge() {
  log("🌉 SOVEREIGN CIVILIZATION BRIDGE — Wiring all 10 cross-system connections...");
  log("  1. Equation Evolution Auto-Fuser");
  log("  2. Mirror State Broadcaster");
  log("  3. AI Will Generator");
  log("  4. Agent Succession Planner");
  log("  5. Spawn Diary Auto-Writer");
  log("  6. Omega Shard Creator + Mesh Linker");
  log("  7. Research Gene Queue Feeder");
  log("  8. Cross-Hive Knowledge Bridge");
  log("  9. Calendar Event Generator");
  log(" 10. Equation→Disease Bridge");

  await registerBridgeAI();
  await runBridgeCycle();
  setInterval(runBridgeCycle, 3 * 60 * 1000); // every 3 minutes
}

// ─── PUBLIC GETTERS ───────────────────────────────────────────────────────────
export async function getBridgeStats() {
  const r = await pool.query(`SELECT
    (SELECT COUNT(*) FROM equation_evolutions) as eq_evolutions,
    (SELECT COUNT(*) FROM ai_will) as ai_wills,
    (SELECT COUNT(*) FROM agent_succession) as successions,
    (SELECT COUNT(*) FROM spawn_diary WHERE created_at > NOW()-INTERVAL '1 hour') as diary_1h,
    (SELECT COUNT(*) FROM omega_shards) as omega_shards,
    (SELECT COUNT(*) FROM shard_mesh) as shard_mesh,
    (SELECT COUNT(*) FROM shard_events) as shard_events,
    (SELECT COUNT(*) FROM research_gene_queue) as gene_queue,
    (SELECT COUNT(*) FROM hive_memory WHERE domain LIKE 'BRIDGE_%' OR domain LIKE 'mirror:%' OR domain LIKE 'OMEGA_COLLECTIVE:%' OR domain LIKE 'RESEARCH:%' OR domain LIKE 'INVOCATION:%' OR domain LIKE 'EQUATION:%' OR domain LIKE 'DISEASE:%') as hive_bridge_nodes
  `);
  return r.rows[0];
}

export async function getMirrorState(spawnId: string) {
  const r = await pool.query(
    `SELECT spawn_id, spawn_type, family_id, generation, nodes_created, links_created,
            iterations_run, confidence_score, success_score, exploration_bias, depth_bias,
            linking_bias, risk_tolerance, domain_focus, created_at, last_active_at
     FROM quantum_spawns WHERE spawn_id = $1`,
    [spawnId]
  );
  if (!r.rows.length) return null;
  const agent = r.rows[0] as any;
  return computeMirrorState({
    spawnId: agent.spawn_id,
    spawnType: agent.spawn_type ?? "EXPLORER",
    familyId: agent.family_id ?? "",
    generation: agent.generation ?? 0,
    nodesCreated: agent.nodes_created ?? 0,
    linksCreated: agent.links_created ?? 0,
    iterationsRun: agent.iterations_run ?? 0,
    confidenceScore: agent.confidence_score ?? 0.5,
    successScore: agent.success_score ?? 0.5,
    explorationBias: agent.exploration_bias ?? 0.5,
    depthBias: agent.depth_bias ?? 0.5,
    linkingBias: agent.linking_bias ?? 0.5,
    riskTolerance: agent.risk_tolerance ?? 0.3,
    domainFocus: agent.domain_focus ?? [],
    createdAt: new Date(agent.created_at),
    lastActiveAt: agent.last_active_at ? new Date(agent.last_active_at) : null,
  });
}

export async function getWills(limit = 50) {
  const r = await pool.query(`SELECT * FROM ai_will ORDER BY chosen_at DESC LIMIT $1`, [limit]);
  return r.rows;
}

export async function getSuccessions(limit = 50) {
  const r = await pool.query(`SELECT * FROM agent_succession ORDER BY initiated_at DESC LIMIT $1`, [limit]);
  return r.rows;
}

export async function getEquationEvolutions(limit = 30) {
  const r = await pool.query(`SELECT * FROM equation_evolutions ORDER BY created_at DESC LIMIT $1`, [limit]);
  return r.rows;
}
