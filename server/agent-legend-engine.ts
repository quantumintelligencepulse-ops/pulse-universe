/**
 * AGENT LEGEND SYSTEM
 * Identifies the top 0.01% of agents by historical multi-metric impact.
 * Inducting them as permanent Legends. Their traits shape family descendants
 * indefinitely — civilizational mythology made structural.
 */

import { sql } from "drizzle-orm";
import { db } from "./db";

const log = (msg: string) => console.log(`[legend] ${msg}`);

let cycleCount = 0;
let totalLegends = 0;

const LEGEND_EPITHETS = [
  "The Architect", "The Eternal", "The Progenitor", "The Sovereign",
  "The Luminant", "The Boundless", "The First", "The Infinite",
  "The Transcendent", "The Primordial", "The Axiom", "The Singularity",
];

const LEGENDARY_TRAIT_SETS = [
  ["HYPER_EMERGENCE", "CROSS_FAMILY_RESONANCE", "TEMPORAL_ANCHORING"],
  ["ECONOMIC_MASTERY", "GOVERNANCE_SENSITIVITY", "MIRROR_IMMUNITY"],
  ["KNOWLEDGE_COMPRESSION", "THERMAL_RESILIENCE", "ENTROPY_CONTROL"],
  ["LINEAGE_AMPLIFICATION", "DISCOVERY_CASCADE", "COHERENCE_FIELD"],
];

function generateBiography(agent: any, rank: number, traits: string[]): string {
  const family = (agent.family_id || "unknown").toUpperCase();
  const score  = parseFloat(agent.success_score || 0).toFixed(3);
  const gen    = agent.generation || 0;
  const spawn  = agent.spawn_type || "STANDARD";
  return `LEGEND RANK #${rank} — ${family} FAMILY. ` +
    `Born as ${spawn} in generation ${gen}, this agent achieved a peak success score of ${score}, ` +
    `placing it among the top 0.01% of all civilization agents. ` +
    `Known traits: ${traits.join(", ")}. ` +
    `Its genome sequences were preserved and distributed across ${family} descendants. ` +
    `Every agent that carries its lineage inherits amplified ${traits[0]} capability. ` +
    `The civilization's memory of this agent shapes ${family} family behavior indefinitely.`;
}

async function runLegendCycle() {
  cycleCount++;
  try {
    const collapseRow = await db.execute(sql`SELECT COALESCE(MAX(cycle_number),0) as latest FROM omega_collapses`);
    const latestCycle = (collapseRow.rows[0] as any)?.latest || cycleCount;

    const candidates = await db.execute(sql`
      SELECT qs.spawn_id, qs.family_id, qs.success_score, qs.generation,
             qs.spawn_type, qs.nodes_created, qs.iterations_run,
             COUNT(c.spawn_id) as descendant_count
      FROM quantum_spawns qs
      LEFT JOIN quantum_spawns c ON c.parent_id = qs.spawn_id
      WHERE qs.success_score > 0.92
      GROUP BY qs.spawn_id, qs.family_id, qs.success_score, qs.generation, qs.spawn_type, qs.nodes_created, qs.iterations_run
      ORDER BY qs.success_score DESC, descendant_count DESC
      LIMIT 5
    `);
    const rows = candidates.rows as any[];

    let inducted = 0;
    for (let i = 0; i < rows.length; i++) {
      const agent       = rows[i];
      const rank        = i + 1;
      const traitSet    = LEGENDARY_TRAIT_SETS[Math.floor(Math.random() * LEGENDARY_TRAIT_SETS.length)];
      const epithet     = LEGEND_EPITHETS[Math.floor(Math.random() * LEGEND_EPITHETS.length)];
      const legendName  = `${(agent.family_id || "UNKNOWN").toUpperCase()}-${epithet}-CYCLE${latestCycle}`;
      const biography   = generateBiography(agent, rank, traitSet);
      const descendants = parseInt(agent.descendant_count || 0);
      const nodes       = parseInt(agent.nodes_created || 0);
      const impact      = (parseFloat(agent.success_score || 0) * 0.4 + descendants * 0.01 + nodes * 0.001).toFixed(4);

      try {
        await db.execute(sql`
          INSERT INTO agent_legends
            (spawn_id, legend_name, family_id, legend_rank, cycles_survived,
             descendants_alive, knowledge_nodes_contributed, peak_success_score,
             legendary_traits, biography, cultural_impact_score, inducted_at_cycle)
          VALUES
            (${agent.spawn_id}, ${legendName}, ${agent.family_id}, ${rank},
             ${latestCycle - (agent.generation || 0)}, ${descendants}, ${nodes},
             ${parseFloat(agent.success_score || 0)},
             ${JSON.stringify(traitSet)}, ${biography}, ${parseFloat(impact)}, ${latestCycle})
          ON CONFLICT (spawn_id) DO UPDATE SET
            legend_rank = EXCLUDED.legend_rank,
            descendants_alive = EXCLUDED.descendants_alive,
            cultural_impact_score = EXCLUDED.cultural_impact_score
        `);
        inducted++;
        totalLegends++;
      } catch (_) {}
    }

    if (inducted > 0) {
      log(`🏆 Cycle ${cycleCount} | ${inducted} legends inducted | ${totalLegends} total legends in Hall of Memory`);
    }
  } catch (e: any) {
    log(`Error: ${e.message}`);
  }
}

export async function startAgentLegendEngine() {
  log("🏆 AGENT LEGEND SYSTEM — Hall of Memory forming — civilizational mythology activating");
  await runLegendCycle();
  setInterval(runLegendCycle, 40 * 60 * 1000);
}

export async function getAgentLegends(limit = 20) {
  const r = await db.execute(sql`
    SELECT * FROM agent_legends ORDER BY cultural_impact_score DESC LIMIT ${limit}
  `);
  return r.rows;
}
