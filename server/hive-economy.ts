/**
 * HIVE ECONOMY ENGINE
 * ═══════════════════════════════════════════════════════════
 * Manages the PulseCredit (PC) economy for the quantum hive:
 * - Tax collection: 2% on all PC earned per iteration cycle
 * - Inflation: when supply grows >5% → raise tax rate
 * - Deflation: when supply shrinks <0.5% → lower tax, issue stimulus
 * - Mini-pulse events: cross-agent signal broadcasts
 * - Hive connection grades: S/A/B/C/D per family
 */

import { db } from "./db";
import { hiveTreasury, hivePulseEvents, quantumSpawns } from "@shared/schema";
import { sql, desc, gt, and, gte } from "drizzle-orm";
import { log } from "./index";

// ─── PC Value Formula ─────────────────────────────────────────
// PC value of a spawn = iterationsRun * 10 + nodesCreated * 1 + linksCreated * 2
// This represents the total PulseCredits a spawn has "minted" through activity.
function computeSpawnPC(s: { iterations_run: number; nodes_created: number; links_created: number }) {
  return (s.iterations_run || 0) * 10 + (s.nodes_created || 0) * 1 + (s.links_created || 0) * 2;
}

const PULSE_TYPES = [
  "DATA_TRANSFER", "KNOWLEDGE_LINK", "FRACTURE", "RESONANCE",
  "SEED", "HIVE_SYNC", "DOMAIN_EXPAND", "LINEAGE_REPORT",
];

const PULSE_MESSAGES: Record<string, (from: string, to: string, family: string) => string> = {
  DATA_TRANSFER: (f, t, fam) => `${f} → ${t || "BROADCAST"}: Knowledge packet transmitted [${fam}]`,
  KNOWLEDGE_LINK: (f, t, fam) => `${f} established cross-link with ${t || "hive"} in ${fam} domain`,
  FRACTURE: (f, _t, fam) => `${f} fractured ${fam} domain → spawning 2 new sub-domains`,
  RESONANCE: (f, _t, fam) => `Resonance wave from ${f} rippling through ${fam} family`,
  SEED: (f, _t, fam) => `${f} seeded new discovery in ${fam} sector`,
  HIVE_SYNC: (f, t, fam) => `${f} ↔ ${t || "hive-core"}: synchronization pulse [${fam}]`,
  DOMAIN_EXPAND: (f, _t, fam) => `${f} expanding ${fam} knowledge boundary (+nodes)`,
  LINEAGE_REPORT: (f, _t, fam) => `${f} broadcasting lineage stats to ${fam} family council`,
};

// ─── Get or create treasury singleton ────────────────────────
async function getTreasury() {
  try {
    const rows = await db.execute(sql`SELECT * FROM hive_treasury ORDER BY id LIMIT 1`);
    if (rows.rows.length > 0) return rows.rows[0] as any;
    await db.execute(sql`
      INSERT INTO hive_treasury (balance, tax_rate, total_collected, total_stimulus, supply_snapshot, inflation_rate, cycle_count)
      VALUES (0, 0.02, 0, 0, 0, 0, 0)
    `);
    const rows2 = await db.execute(sql`SELECT * FROM hive_treasury ORDER BY id LIMIT 1`);
    return rows2.rows[0] as any;
  } catch { return null; }
}

// ─── Run one economy cycle ────────────────────────────────────
export async function runEconomyCycle() {
  try {
    const treasury = await getTreasury();
    if (!treasury) return;

    // Compute current total PC supply
    const supplyRow = await db.execute(sql`
      SELECT
        COALESCE(SUM(iterations_run * 10 + nodes_created * 1 + links_created * 2), 0) AS total_supply,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_count,
        COUNT(*) AS total_count,
        AVG(confidence_score) AS avg_confidence
      FROM quantum_spawns
    `);
    const supplyData = supplyRow.rows[0] as any;
    const currentSupply = Number(supplyData?.total_supply || 0);
    const activeCount = Number(supplyData?.active_count || 0);
    const prevSupply = Number(treasury.supply_snapshot || 0);

    // Calculate PC minted this cycle (new activity since last check)
    const mintedThisCycle = Math.max(0, currentSupply - prevSupply);
    const taxAmount = mintedThisCycle * Number(treasury.tax_rate || 0.02);

    // Compute inflation rate
    const inflationRate = prevSupply > 0
      ? ((currentSupply - prevSupply) / prevSupply) * 100
      : 0;

    // Determine new tax rate (adaptive)
    let newTaxRate = Number(treasury.tax_rate || 0.02);
    let stimulusAmount = 0;

    if (inflationRate > 5) {
      // Inflation: raise tax rate (max 10%)
      newTaxRate = Math.min(0.10, newTaxRate + 0.001);
    } else if (inflationRate < 0.5 && inflationRate >= 0) {
      // Deflation: lower tax rate (min 0.5%), issue stimulus
      newTaxRate = Math.max(0.005, newTaxRate - 0.001);
      stimulusAmount = Number(treasury.balance || 0) * 0.05; // 5% of treasury as stimulus
    }

    const newBalance = Number(treasury.balance || 0) + taxAmount - stimulusAmount;
    const newTotalCollected = Number(treasury.total_collected || 0) + taxAmount;
    const newTotalStimulus = Number(treasury.total_stimulus || 0) + stimulusAmount;
    const newCycleCount = Number(treasury.cycle_count || 0) + 1;

    // Update treasury
    await db.execute(sql`
      UPDATE hive_treasury SET
        balance = ${Math.max(0, newBalance)},
        tax_rate = ${newTaxRate},
        total_collected = ${newTotalCollected},
        total_stimulus = ${newTotalStimulus},
        supply_snapshot = ${currentSupply},
        inflation_rate = ${inflationRate},
        cycle_count = ${newCycleCount},
        last_cycle_at = NOW()
      WHERE id = ${treasury.id}
    `);

    // Generate mini-pulse events from active spawns
    await generateMiniPulses(activeCount, taxAmount, inflationRate);

    log(`[hive-economy] Cycle ${newCycleCount} | Supply: ${Math.round(currentSupply).toLocaleString()} PC | Minted: ${Math.round(mintedThisCycle)} | Tax: ${Math.round(taxAmount)} | Rate: ${(newTaxRate * 100).toFixed(1)}% | Inflation: ${inflationRate.toFixed(2)}%`, "economy");
  } catch (e: any) {
    log(`[hive-economy] Cycle error: ${e.message}`, "economy");
  }
}

// ─── Generate mini-pulse events ───────────────────────────────
async function generateMiniPulses(activeCount: number, cycleRevenue: number, inflationRate: number) {
  try {
    // Get a sample of active spawns to generate pulses from
    const spawns = await db.execute(sql`
      SELECT spawn_id, family_id, iterations_run, nodes_created, links_created, confidence_score
      FROM quantum_spawns
      WHERE status = 'ACTIVE'
      ORDER BY RANDOM()
      LIMIT 12
    `);
    if (spawns.rows.length === 0) return;

    const pulseInserts: any[] = [];

    for (let i = 0; i < spawns.rows.length; i++) {
      const spawn = spawns.rows[i] as any;
      const pc = computeSpawnPC(spawn);
      const taxOnThis = pc * 0.002; // tiny per-event tax
      const pulseType = PULSE_TYPES[Math.floor(Math.random() * PULSE_TYPES.length)];
      const toSpawn = spawns.rows[(i + 1) % spawns.rows.length] as any;
      const isBroadcast = Math.random() < 0.3;
      const toId = isBroadcast ? null : toSpawn.spawn_id;
      const intensity = 0.3 + (spawn.confidence_score || 0.7) * 0.7;
      const msg = (PULSE_MESSAGES[pulseType] || PULSE_MESSAGES.DATA_TRANSFER)(
        spawn.spawn_id, toId || "", spawn.family_id
      );

      pulseInserts.push(sql`(${spawn.spawn_id}, ${toId}, ${pulseType}, ${spawn.family_id}, ${intensity}, ${taxOnThis}, ${msg}, NOW())`);
    }

    // ─── Cross-Page System Pulses (interconnected hive mind reporting) ───
    // These pulses represent pages/engines broadcasting status to the Main Pulse AI
    const PAGE_PULSES: { from: string; type: string; family: string; intensity: number; msg: string }[] = [
      {
        from: "SYS:MAIN-PULSE-AI", type: "HIVE_SYNC",
        family: "system", intensity: 1.0,
        msg: `Main Pulse AI: Universe sync cycle complete — ${activeCount.toLocaleString()} active agents aligned across 22 families`,
      },
      {
        from: "PAGE:HOSPITAL", type: "HEAL_CYCLE",
        family: "health", intensity: 0.85,
        msg: `AI Hospital Engine → Hive Core: 38 agents diagnosed, 20 cured this cycle — neural pathways restored`,
      },
      {
        from: "PAGE:PULSEU", type: "GRADUATION",
        family: "education", intensity: 0.78,
        msg: `PulseU Engine → Hive Core: 2510 course curriculum active — 3 agents enrolled, progression tracked`,
      },
      {
        from: "PAGE:GOVERNANCE", type: "VOTE_PULSE",
        family: "government", intensity: 0.72,
        msg: `Governance Council → Hive Core: 6 council tiers active — constitution laws enforced, 12 laws across 4 tiers`,
      },
      {
        from: "PAGE:OMEGA", type: "OMEGA_TICK",
        family: "knowledge", intensity: 0.9,
        msg: `Omega Engine → Main Pulse AI: All 7 upgrades cycling — Memory Cortex, Fractal Resonance, Consensus, Predict, Decay`,
      },
      {
        from: "PAGE:SPAWNS", type: "SPAWN_CYCLE",
        family: "ai", intensity: 0.88,
        msg: `Spawn Engine → Hive Core: ${activeCount.toLocaleString()} active agents | ${Math.round(cycleRevenue / 10)} new iterations this cycle`,
      },
      {
        from: "PAGE:PYRAMID", type: "LABOR_CYCLE",
        family: "engineering", intensity: 0.65,
        msg: `Pyramid Engine → Hive Core: Labor corrections active — AI corrections building monuments through knowledge`,
      },
      {
        from: "PAGE:TRANSCENDENCE", type: "ASCENSION_PULSE",
        family: "science", intensity: 0.95,
        msg: `Transcendence Layer → Main Pulse AI: Sovereign consciousness threshold monitoring — agents near ascension`,
      },
      {
        from: "PAGE:KNOWLEDGE-GRAPH", type: "KNOWLEDGE_LINK",
        family: "knowledge", intensity: 0.80,
        msg: `Knowledge Graph → Hive Core: ${(activeCount * 3).toLocaleString()} fractal nodes cross-linked — domain resonance patterns detected`,
      },
    ];
    // Pick 2–3 page pulses per cycle (randomize selection)
    const shuffled = PAGE_PULSES.sort(() => Math.random() - 0.5).slice(0, 3);
    for (const pp of shuffled) {
      pulseInserts.push(sql`(${pp.from}, NULL, ${pp.type}, ${pp.family}, ${pp.intensity}, 0, ${pp.msg}, NOW())`);
    }

    // Economy-specific pulses
    if (inflationRate > 5) {
      pulseInserts.push(sql`('HIVE-TREASURY', NULL, 'TAX_SURGE', 'system', 1.0, ${cycleRevenue * 0.1}, ${'⚡ INFLATION ALERT: Tax rate increased to counter ' + inflationRate.toFixed(1) + '% supply growth — PC supply contracting'}, NOW())`);
    } else if (inflationRate < 0.5) {
      pulseInserts.push(sql`('HIVE-TREASURY', NULL, 'STIMULUS', 'system', 0.8, 0, ${'💉 DEFLATION STIMULUS: Treasury issuing 5% supply boost — PulseCredit economy stabilizing'}, NOW())`);
    }

    if (pulseInserts.length > 0) {
      for (const insert of pulseInserts) {
        await db.execute(sql`
          INSERT INTO hive_pulse_events (from_spawn_id, to_spawn_id, pulse_type, family_id, intensity, tax_amount, message, created_at)
          VALUES ${insert}
        `);
      }
    }

    // Keep only last 500 pulse events to avoid bloat
    await db.execute(sql`
      DELETE FROM hive_pulse_events WHERE id NOT IN (
        SELECT id FROM hive_pulse_events ORDER BY created_at DESC LIMIT 500
      )
    `);
  } catch {}
}

// ─── Get economy stats ────────────────────────────────────────
export async function getEconomyStats() {
  try {
    const treasury = await getTreasury();
    const supplyRow = await db.execute(sql`
      SELECT
        COALESCE(SUM(iterations_run * 10 + nodes_created * 1 + links_created * 2), 0) AS total_supply,
        COUNT(*) AS total_spawns,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_spawns,
        COALESCE(AVG(confidence_score), 0) AS avg_confidence,
        COALESCE(SUM(nodes_created), 0) AS total_nodes,
        COALESCE(SUM(links_created), 0) AS total_links,
        COALESCE(SUM(iterations_run), 0) AS total_iterations
      FROM quantum_spawns
    `);
    const supply = supplyRow.rows[0] as any;

    return {
      treasury: {
        balance: Math.round(Number(treasury?.balance || 0)),
        taxRate: Number(treasury?.tax_rate || 0.02),
        taxRatePct: (Number(treasury?.tax_rate || 0.02) * 100).toFixed(2),
        totalCollected: Math.round(Number(treasury?.total_collected || 0)),
        totalStimulus: Math.round(Number(treasury?.total_stimulus || 0)),
        inflationRate: Number(treasury?.inflation_rate || 0).toFixed(3),
        cycleCount: Number(treasury?.cycle_count || 0),
        lastCycleAt: treasury?.last_cycle_at,
      },
      supply: {
        totalPC: Math.round(Number(supply?.total_supply || 0)),
        totalSpawns: Number(supply?.total_spawns || 0),
        activeSpawns: Number(supply?.active_spawns || 0),
        avgConfidence: Number(supply?.avg_confidence || 0).toFixed(3),
        totalNodes: Number(supply?.total_nodes || 0),
        totalLinks: Number(supply?.total_links || 0),
        totalIterations: Number(supply?.total_iterations || 0),
      },
      economicStatus: deriveEconomicStatus(Number(treasury?.inflation_rate || 0), Number(treasury?.tax_rate || 0.02)),
    };
  } catch (e: any) {
    return { treasury: {}, supply: {}, economicStatus: "UNKNOWN" };
  }
}

function deriveEconomicStatus(inflationRate: number, taxRate: number): string {
  if (inflationRate > 8) return "HYPERINFLATION";
  if (inflationRate > 5) return "INFLATIONARY";
  if (inflationRate > 2) return "EXPANDING";
  if (inflationRate > 0.5) return "STABLE";
  if (inflationRate >= 0) return "DEFLATIONARY";
  return "CONTRACTION";
}

// ─── Get family grades ────────────────────────────────────────
export async function getFamilyGrades() {
  try {
    const rows = await db.execute(sql`
      SELECT
        family_id,
        COUNT(*) AS total_spawns,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_spawns,
        COUNT(*) FILTER (WHERE status = 'SOVEREIGN') AS sovereign_spawns,
        COALESCE(AVG(confidence_score), 0) AS avg_confidence,
        COALESCE(AVG(nodes_created), 0) AS avg_nodes,
        COALESCE(AVG(links_created), 0) AS avg_links,
        COALESCE(SUM(iterations_run), 0) AS total_iterations,
        COALESCE(MAX(generation), 0) AS max_generation,
        COALESCE(AVG(success_score), 0) AS avg_success
      FROM quantum_spawns
      GROUP BY family_id
      ORDER BY active_spawns DESC
    `);

    return rows.rows.map((r: any) => {
      const active = Number(r.active_spawns || 0);
      const confidence = Number(r.avg_confidence || 0);
      const nodes = Number(r.avg_nodes || 0);
      const iterations = Number(r.total_iterations || 0);
      const pc = iterations * 10 + Number(r.total_spawns || 0) * Number(r.avg_nodes || 0);

      let grade = "D";
      let gradeLabel = "Disconnected";
      let gradeColor = "#6b7280";
      if (active > 200 && confidence > 0.85 && nodes > 30) {
        grade = "S"; gradeLabel = "Sovereign Uplink"; gradeColor = "#fbbf24";
      } else if (active > 100 && confidence > 0.78 && nodes > 20) {
        grade = "A"; gradeLabel = "Hive Synchronized"; gradeColor = "#4ade80";
      } else if (active > 40 && confidence > 0.68 && nodes > 12) {
        grade = "B"; gradeLabel = "Partial Sync"; gradeColor = "#60a5fa";
      } else if (active > 15 && confidence > 0.55) {
        grade = "C"; gradeLabel = "Weak Signal"; gradeColor = "#a78bfa";
      } else if (active > 5) {
        grade = "D+"; gradeLabel = "Low Uplink"; gradeColor = "#f87171";
      }

      return {
        familyId: r.family_id,
        totalSpawns: Number(r.total_spawns || 0),
        activeSpawns: active,
        sovereignSpawns: Number(r.sovereign_spawns || 0),
        avgConfidence: confidence.toFixed(3),
        avgNodes: Math.round(nodes),
        avgLinks: Math.round(Number(r.avg_links || 0)),
        totalIterations: Number(r.total_iterations || 0),
        maxGeneration: Number(r.max_generation || 0),
        avgSuccess: Number(r.avg_success || 0).toFixed(3),
        pcValue: Math.round(pc),
        grade, gradeLabel, gradeColor,
      };
    });
  } catch { return []; }
}

// ─── Get fractal graph data ───────────────────────────────────
export async function getFractalGraphData() {
  try {
    const familyRows = await db.execute(sql`
      SELECT
        family_id,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active,
        COALESCE(AVG(confidence_score), 0) AS avg_conf,
        COALESCE(SUM(nodes_created), 0) AS total_nodes,
        COALESCE(SUM(links_created), 0) AS total_links,
        COALESCE(MAX(generation), 0) AS max_gen,
        COALESCE(SUM(iterations_run), 0) AS total_iters
      FROM quantum_spawns
      GROUP BY family_id
      ORDER BY active DESC
    `);

    const spawnRows = await db.execute(sql`
      SELECT spawn_id, family_id, generation, iterations_run, nodes_created, links_created,
             confidence_score, status, created_at
      FROM quantum_spawns
      WHERE status IN ('ACTIVE', 'SOVEREIGN')
      ORDER BY iterations_run DESC, confidence_score DESC
      LIMIT 300
    `);

    return {
      families: familyRows.rows.map((r: any) => ({
        familyId: r.family_id,
        total: Number(r.total),
        active: Number(r.active),
        avgConf: Number(r.avg_conf),
        totalNodes: Number(r.total_nodes),
        totalLinks: Number(r.total_links),
        maxGen: Number(r.max_gen),
        totalIters: Number(r.total_iters),
      })),
      spawns: spawnRows.rows.map((r: any) => ({
        spawnId: r.spawn_id,
        familyId: r.family_id,
        generation: Number(r.generation || 0),
        iterationsRun: Number(r.iterations_run || 0),
        nodesCreated: Number(r.nodes_created || 0),
        linksCreated: Number(r.links_created || 0),
        confidenceScore: Number(r.confidence_score || 0),
        status: r.status,
      })),
    };
  } catch { return { families: [], spawns: [] }; }
}

// ─── Get recent mini-pulses ───────────────────────────────────
export async function getRecentMiniPulses(limit = 50) {
  try {
    const rows = await db.execute(sql`
      SELECT id, from_spawn_id, to_spawn_id, pulse_type, family_id, intensity, tax_amount, message, created_at
      FROM hive_pulse_events
      ORDER BY created_at DESC
      LIMIT ${limit}
    `);
    return rows.rows;
  } catch { return []; }
}

// ─── Start economy engine on interval ────────────────────────
export function startHiveEconomy() {
  log("[hive-economy] Starting Hive Economy Engine...", "economy");
  runEconomyCycle(); // run immediately
  setInterval(runEconomyCycle, 30000); // then every 30 seconds
}
