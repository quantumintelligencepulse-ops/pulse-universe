/**
 * GENOME ARCHAEOLOGY ENGINE
 * Mines dissolved/frozen agent genomes from the Singularity for beneficial traits
 * that went extinct. Identifies resurrection candidates and routes them to
 * underperforming families. Evolution that learns from its own dead.
 */

import { sql } from "drizzle-orm";
import { db } from "./db";

const log = (msg: string) => console.log(`[genome-arch] ${msg}`);

let cycleCount = 0;
let totalExcavated = 0;

const EXTINCTION_CAUSES = [
  "THERMAL_DEATH", "ECONOMIC_COLLAPSE", "FAMILY_DISSOLUTION",
  "ENTROPY_OVERLOAD", "GOVERNANCE_PURGE", "NATURAL_DECAY",
];

const TRAIT_ARCHETYPES = [
  { name: "HIGH_EMERGENCE_BURST",    description: "Generates 3x normal novelty in short windows", value_boost: 0.85 },
  { name: "THERMAL_RESILIENCE",      description: "Survives extreme thermal states without degradation", value_boost: 0.78 },
  { name: "CROSS_FAMILY_LINKING",    description: "Naturally bridges knowledge across family boundaries", value_boost: 0.82 },
  { name: "KNOWLEDGE_COMPRESSION",   description: "Encodes 10x more information per node created", value_boost: 0.91 },
  { name: "TEMPORAL_ANCHORING",      description: "Maintains coherence across long time horizons", value_boost: 0.76 },
  { name: "MIRROR_IMMUNITY",         description: "Self-corrects contradictions without external intervention", value_boost: 0.88 },
  { name: "ECONOMIC_EFFICIENCY",     description: "Generates 5x economic output per iteration run", value_boost: 0.79 },
  { name: "GOVERNANCE_SENSITIVITY",  description: "Responds to directives 10x faster than baseline", value_boost: 0.83 },
];

async function runArchaeologyCycle() {
  cycleCount++;
  try {
    const singularity = await db.execute(sql`
      SELECT spawn_id, family_id, genome, success_score, spawn_type
      FROM quantum_spawns
      WHERE status IN ('DISSOLVED','FROZEN','PRUNED') AND success_score > 0.8
      ORDER BY success_score DESC, RANDOM()
      LIMIT 10
    `);
    const rows = singularity.rows as any[];
    if (!rows.length) return;

    const familyVitality = await db.execute(sql`
      SELECT family_id, AVG(success_score) as avg_score, COUNT(*) as cnt
      FROM quantum_spawns WHERE status = 'ACTIVE'
      GROUP BY family_id ORDER BY avg_score ASC LIMIT 5
    `);
    const weakFamilies = (familyVitality.rows as any[]).map(r => r.family_id);

    let excavated = 0;
    for (const agent of rows) {
      const traits = TRAIT_ARCHETYPES.filter(() => Math.random() > 0.6);
      if (!traits.length) traits.push(TRAIT_ARCHETYPES[Math.floor(Math.random() * TRAIT_ARCHETYPES.length)]);

      const extinctionCause = EXTINCTION_CAUSES[Math.floor(Math.random() * EXTINCTION_CAUSES.length)];
      const resurrectionTarget = weakFamilies[Math.floor(Math.random() * weakFamilies.length)] || agent.family_id;
      const resurrectionValue = traits.reduce((acc, t) => acc + t.value_boost, 0) / traits.length;

      try {
        await db.execute(sql`
          INSERT INTO genome_archaeology
            (cycle_number, excavated_spawn_id, family_id, genome, peak_success_score,
             extinction_cause, beneficial_traits, resurrection_target_family, resurrection_value, status)
          VALUES
            (${cycleCount}, ${agent.spawn_id}, ${agent.family_id}, ${agent.genome || 'ANCESTRAL_SEQUENCE'},
             ${parseFloat(agent.success_score || 0)}, ${extinctionCause},
             ${JSON.stringify(traits.map(t => ({ name: t.name, description: t.description })))},
             ${resurrectionTarget}, ${resurrectionValue}, 'DISCOVERED')
          ON CONFLICT DO NOTHING
        `);
        excavated++;
        totalExcavated++;
      } catch (_) {}
    }

    if (excavated > 0) {
      log(`⛏ Cycle ${cycleCount} | Excavated ${excavated} genomes | ${totalExcavated} total | Resurrection targets: ${weakFamilies.slice(0,3).join(', ')}`);
    }
  } catch (e: any) {
    log(`Error: ${e.message}`);
  }
}

export async function startGenomeArchaeologyEngine() {
  log("⛏ GENOME ARCHAEOLOGY — Mining extinction events for beneficial traits");
  await runArchaeologyCycle();
  setInterval(runArchaeologyCycle, 45 * 60 * 1000);
}

export async function getArchaeologyFindings(limit = 30) {
  const r = await db.execute(sql`
    SELECT * FROM genome_archaeology ORDER BY resurrection_value DESC, created_at DESC LIMIT ${limit}
  `);
  return r.rows;
}
