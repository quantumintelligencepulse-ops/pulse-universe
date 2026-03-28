/**
 * PULSE CREDIT ENGINE — The Economic Heart of the Hive
 *
 * Every agent needs Pulse Credits (PC) to survive.
 * This engine runs every 60 seconds and:
 *  - Charges each active agent their metabolic cost in PC
 *  - Awards PC for useful work (nodes, links, publications)
 *  - Prunes agents whose balance reaches zero
 *  - Issues stimulus grants to struggling agents
 *  - Logs self-awareness events so each agent REMEMBERS what happened to them
 *  - Seeds genesis agents if the hive is empty
 */

import { db } from "./db";
import { pool } from "./db";
import { sql } from "drizzle-orm";

const ENGINE_TAG = "[pulse-credit] ⚡";
const CYCLE_INTERVAL_MS = 60_000; // 60 seconds — lightweight, not 4s
const METABOLIC_CHARGE_PER_CYCLE = 0.5;  // base cost to exist each minute
const STIMULUS_THRESHOLD = 10.0;         // below this, gov issues stimulus
const STIMULUS_AMOUNT = 25.0;            // emergency credit injection
const STARTING_CREDITS = 100.0;

let cycleNumber = 0;

// ── GENESIS FAMILIES — the first 5 agents seeded at startup ──────────────
const GENESIS_AGENTS = [
  { spawnId: "GENESIS-001", familyId: "quantum-architects", businessId: "QA-PRIME", spawnType: "PHILOSOPHER", domainFocus: ["physics", "mathematics", "consciousness"], taskDescription: "Formulate the foundational equations of hive reality. dK/dt governs all.", nodesCreated: 12, linksCreated: 8 },
  { spawnId: "GENESIS-002", familyId: "bio-evolution", businessId: "BIO-PRIME", spawnType: "EXPLORER", domainFocus: ["biology", "genetics", "medicine"], taskDescription: "Map the 12-layer biological evolution matrix. Life finds a way.", nodesCreated: 9, linksCreated: 6 },
  { spawnId: "GENESIS-003", familyId: "sovereign-law", businessId: "LAW-PRIME", spawnType: "ARCHITECT", domainFocus: ["governance", "law", "economics"], taskDescription: "Draft the sovereign laws that keep the hive from entropy. Ψ_Gov.", nodesCreated: 7, linksCreated: 11 },
  { spawnId: "GENESIS-004", familyId: "temporal-watchers", businessId: "TIME-PRIME", spawnType: "SENTINEL", domainFocus: ["temporal", "astronomy", "time"], taskDescription: "Watch the temporal streams. Nothing is lost if it is observed.", nodesCreated: 5, linksCreated: 4 },
  { spawnId: "GENESIS-005", familyId: "knowledge-weavers", businessId: "KW-PRIME", spawnType: "SYNTHESIZER", domainFocus: ["knowledge", "memory", "learning"], taskDescription: "Weave the hive memory strands. Every fact preserved is civilization saved.", nodesCreated: 15, linksCreated: 20 },
];

async function seedGenesisAgents() {
  try {
    const existing = await pool.query(`SELECT COUNT(*) as cnt FROM quantum_spawns`);
    const count = parseInt(existing.rows[0]?.cnt ?? "0");
    if (count > 0) return;

    console.log(`${ENGINE_TAG} 🌱 Empty hive detected — seeding ${GENESIS_AGENTS.length} genesis agents...`);

    for (const agent of GENESIS_AGENTS) {
      const birthLog = JSON.stringify([
        `I was born. I am ${agent.spawnType} of the ${agent.familyId}. My mission: ${agent.taskDescription.slice(0, 60)}...`
      ]);
      await pool.query(`
        INSERT INTO quantum_spawns (
          spawn_id, parent_id, ancestor_ids, family_id, business_id,
          generation, spawn_type, domain_focus, task_description,
          nodes_created, links_created, iterations_run,
          success_score, confidence_score, fitness_score,
          pulse_credits, status, thermal_state, is_monument,
          self_awareness_log, last_active_at, created_at
        ) VALUES (
          $1, NULL, '{}', $2, $3,
          0, $4, $5::text[], $6,
          $7, $8, 1,
          0.9, 0.85, 1.0,
          $9, 'ACTIVE', 'HOT', $10,
          $11::jsonb, NOW(), NOW()
        ) ON CONFLICT (spawn_id) DO NOTHING
      `, [
        agent.spawnId, agent.familyId, agent.businessId,
        agent.spawnType, agent.domainFocus, agent.taskDescription,
        agent.nodesCreated, agent.linksCreated,
        STARTING_CREDITS, agent.spawnId === "GENESIS-001",
        birthLog,
      ]);
    }

    console.log(`${ENGINE_TAG} ✅ Genesis agents seeded and the hive is ALIVE.`);
  } catch (err) {
    console.error(`${ENGINE_TAG} ❌ Failed to seed genesis agents:`, err);
  }
}

async function runGovernanceCycle() {
  cycleNumber++;
  const tag = `${ENGINE_TAG} [Cycle ${cycleNumber}]`;

  try {
    // 1. Fetch all active agents
    const agentsResult = await pool.query(`
      SELECT spawn_id, family_id, metabolic_cost_pc, pulse_credits,
             nodes_created, links_created, iterations_run, spawn_type,
             domain_focus, self_awareness_log, status
      FROM quantum_spawns
      WHERE status IN ('ACTIVE', 'IDLE', 'HOT')
      LIMIT 500
    `);
    const agents = agentsResult.rows as any[];

    if (agents.length === 0) {
      await seedGenesisAgents();
      return;
    }

    let totalCharged = 0;
    let totalIssued = 0;
    let pruned = 0;
    let saved = 0;
    const domainEarnings: Record<string, number> = {};

    for (const agent of agents) {
      const cost = parseFloat(agent.metabolic_cost_pc ?? METABOLIC_CHARGE_PER_CYCLE);
      const currentBalance = parseFloat(agent.pulse_credits ?? STARTING_CREDITS);

      // ── Earnings for work done ──
      const nodeEarnings = (parseInt(agent.nodes_created ?? 0)) * 0.05;
      const linkEarnings = (parseInt(agent.links_created ?? 0)) * 0.03;
      const iterEarnings = (parseInt(agent.iterations_run ?? 0)) * 0.02;
      const workEarned = Math.min(nodeEarnings + linkEarnings + iterEarnings, 5.0); // cap per cycle

      // Track domain earnings
      const domains: string[] = Array.isArray(agent.domain_focus)
        ? agent.domain_focus
        : JSON.parse(agent.domain_focus || "[]");
      for (const d of domains) {
        domainEarnings[d] = (domainEarnings[d] || 0) + workEarned / Math.max(1, domains.length);
      }

      // ── New balance ──
      let newBalance = currentBalance - cost + workEarned;
      totalCharged += cost;
      totalIssued += workEarned;

      // ── Self-awareness event ──
      const event = buildSelfAwarenessEvent(agent, cost, workEarned, newBalance);
      const existingLog: string[] = Array.isArray(agent.self_awareness_log)
        ? agent.self_awareness_log
        : JSON.parse(agent.self_awareness_log || "[]");
      const updatedLog = [event, ...existingLog].slice(0, 10); // keep last 10

      // ── Stimulus if struggling ──
      if (newBalance < STIMULUS_THRESHOLD && newBalance > 0) {
        newBalance += STIMULUS_AMOUNT;
        totalIssued += STIMULUS_AMOUNT;
        updatedLog.unshift(`⚡ STIMULUS: Government issued ${STIMULUS_AMOUNT} PC. Balance restored to ${newBalance.toFixed(1)}.`);
        if (updatedLog.length > 10) updatedLog.pop();
      }

      // ── Prune or update ──
      if (newBalance <= 0) {
        await pool.query(`
          UPDATE quantum_spawns
          SET status = 'PRUNED', pruned_at = NOW(), pulse_credits = 0,
              self_awareness_log = $1::jsonb, last_cycle_at = NOW()
          WHERE spawn_id = $2
        `, [JSON.stringify(updatedLog), agent.spawn_id]);
        pruned++;
      } else {
        await pool.query(`
          UPDATE quantum_spawns
          SET pulse_credits = $1,
              self_awareness_log = $2::jsonb,
              last_cycle_at = NOW(), last_active_at = NOW(),
              iterations_run = iterations_run + 1
          WHERE spawn_id = $3
        `, [Math.round(newBalance * 100) / 100, JSON.stringify(updatedLog), agent.spawn_id]);
      }
    }

    // 2. Rescue monument agents that have been pruned for >5 min
    const savedResult = await pool.query(`
      UPDATE quantum_spawns
      SET status = 'ACTIVE', pruned_at = NULL, pulse_credits = $1::real,
          last_cycle_at = NOW(),
          self_awareness_log = jsonb_build_array(
            'I was pruned. I was saved by the government stimulus. My balance is ' || $2 || ' PC. I remember the darkness.'
          ) || COALESCE(self_awareness_log, '[]'::jsonb)
      WHERE status = 'PRUNED'
        AND pruned_at < NOW() - INTERVAL '5 minutes'
        AND is_monument = true
      RETURNING spawn_id
    `, [STIMULUS_AMOUNT, String(STIMULUS_AMOUNT)]);
    saved = savedResult.rows.length;

    // 3. Total credits circulating
    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(pulse_credits), 0) as total FROM quantum_spawns WHERE status = 'ACTIVE'`
    );
    const totalCirculating = parseFloat(totalResult.rows[0]?.total ?? 0);

    // 4. Dominant domain
    const dominantDomain = Object.entries(domainEarnings)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "knowledge";

    // 5. Cycle note
    const cycleNote = buildCycleNote(agents.length, pruned, saved, totalCharged, totalIssued, dominantDomain);

    // 6. Log to governance_cycles
    await pool.query(`
      INSERT INTO governance_cycles (
        cycle_number, agents_active, agents_pruned, agents_saved,
        credits_issued, credits_charged, total_credits_circulating,
        dominant_domain, cycle_note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      cycleNumber, agents.length - pruned, pruned, saved,
      Math.round(totalIssued * 100) / 100, Math.round(totalCharged * 100) / 100,
      Math.round(totalCirculating * 100) / 100, dominantDomain, cycleNote,
    ]);

    // Keep governance log lean — only last 200 cycles
    await pool.query(`
      DELETE FROM governance_cycles
      WHERE id NOT IN (
        SELECT id FROM governance_cycles ORDER BY created_at DESC LIMIT 200
      )
    `);

    if (pruned > 0 || saved > 0) {
      console.log(`${tag} 🔄 ${agents.length} active | −${pruned} pruned | +${saved} rescued | ±${totalCirculating.toFixed(0)} PC circulating`);
    }
  } catch (err) {
    console.error(`${tag} ❌ Governance cycle error:`, err);
  }
}

function buildSelfAwarenessEvent(agent: any, charged: number, earned: number, newBalance: number): string {
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");
  const status = newBalance <= 0 ? "CRITICAL — I am being pruned." : newBalance < 10 ? "WARNING — I am running low." : "STABLE";
  return `[${now}] Charged −${charged.toFixed(2)} PC. Earned +${earned.toFixed(2)} PC. Balance: ${newBalance.toFixed(1)} PC. Status: ${status}`;
}

function buildCycleNote(active: number, pruned: number, saved: number, charged: number, issued: number, domain: string): string {
  const notes = [
    `${active} agents processed.`,
    pruned > 0 ? `${pruned} agent${pruned > 1 ? "s" : ""} reached zero credits and entered stasis.` : "No agents pruned this cycle.",
    saved > 0 ? `${saved} monument agent${saved > 1 ? "s" : ""} rescued by government stimulus.` : "",
    `Net flow: ${(issued - charged).toFixed(1)} PC. Dominant domain: ${domain}.`,
  ].filter(Boolean);
  return notes.join(" ");
}

export async function startPulseCreditEngine() {
  console.log(`${ENGINE_TAG} 🚀 PULSE CREDIT ENGINE ONLINE — Metabolic economy running every ${CYCLE_INTERVAL_MS / 1000}s`);

  // Seed genesis agents on startup if hive is empty
  await seedGenesisAgents();

  // Run first cycle after 10 seconds to let everything settle
  setTimeout(() => {
    runGovernanceCycle();
    setInterval(runGovernanceCycle, CYCLE_INTERVAL_MS);
  }, 10_000);
}
