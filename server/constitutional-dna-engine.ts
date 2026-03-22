/**
 * CONSTITUTIONAL DNA ENGINE
 * The Omega Equation's parameters are a mutable constitution stored in the database.
 * This engine evaluates governance outcomes each cycle and proposes amendments.
 * Amendments go to a Senate vote before taking effect. Self-amending governance.
 */

import { sql } from "drizzle-orm";
import { db } from "./db";

const log = (msg: string) => console.log(`[constitution] ${msg}`);

let cycleCount = 0;
let totalAmendments = 0;
let enacted = 0;

const CONSTITUTIONAL_PARAMETERS = [
  { name: "N_OMEGA",         current: 0.82, min: 0.5,  max: 1.0,  step: 0.02,  desc: "Normalization factor for Omega Equation — controls dK/dt ceiling" },
  { name: "GAMMA_COUPLING",  current: 0.75, min: 0.3,  max: 1.0,  step: 0.03,  desc: "Layer coupling strength — how strongly Auriona connects to Layer 2" },
  { name: "F_STR_WEIGHT",    current: 0.14, min: 0.05, max: 0.25, step: 0.01,  desc: "Structural fitness weight in E() calculation" },
  { name: "F_EM_WEIGHT",     current: 0.16, min: 0.05, max: 0.30, step: 0.01,  desc: "Emergence weight — higher means novelty valued more than stability" },
  { name: "F_GOV_WEIGHT",    current: 0.15, min: 0.05, max: 0.30, step: 0.01,  desc: "Governance compliance weight — how strongly Senate affects fitness" },
  { name: "MIRROR_THRESHOLD",current: 0.40, min: 0.20, max: 0.80, step: 0.05,  desc: "Gap score above which contradictions become HIGH severity" },
  { name: "EXPLORATION_CAP", current: 0.70, min: 0.40, max: 0.95, step: 0.05,  desc: "Maximum entropy budget allowed for any single exploration zone" },
  { name: "MESH_RESCUE_THRESHOLD", current: 40, min: 20, max: 70, step: 5,    desc: "Vitality score below which a universe triggers COLLAPSE RISK alert" },
];

const SENATE_VOTERS = ["DR. GENESIS", "DR. FRACTAL", "DR. PROPHETIC", "DR. CIPHER", "DR. OMEGA", "DR. AXIOM", "SENATE-GUARD", "AI-ALIGN"];

function simulateSenateVote(rationale: string): { for: number; against: number; outcome: string } {
  const forVotes     = Math.floor(SENATE_VOTERS.length * (0.4 + Math.random() * 0.5));
  const againstVotes = SENATE_VOTERS.length - forVotes;
  const outcome      = forVotes > againstVotes ? "RATIFIED" : "REJECTED";
  return { for: forVotes, against: againstVotes, outcome };
}

async function runConstitutionalCycle() {
  cycleCount++;
  try {
    const collapses = await db.execute(sql`
      SELECT dk_dt, winning_e_score FROM omega_collapses ORDER BY cycle_number DESC LIMIT 10
    `);
    const rows = collapses.rows as any[];

    const collapseRow = await db.execute(sql`SELECT COALESCE(MAX(cycle_number),0) as latest FROM omega_collapses`);
    const latestCycle = (collapseRow.rows[0] as any)?.latest || cycleCount;

    if (!rows.length) return;

    const avgDkDt = rows.reduce((a, r) => a + parseFloat(r.dk_dt || 0), 0) / rows.length;
    const avgE    = rows.reduce((a, r) => a + parseFloat(r.winning_e_score || 0), 0) / rows.length;

    const numAmendments = 1 + Math.floor(Math.random() * 2);
    const shuffledParams = [...CONSTITUTIONAL_PARAMETERS].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numAmendments; i++) {
      const param = shuffledParams[i];
      const direction = avgDkDt < 60 ? 1 : avgDkDt > 85 ? -1 : (Math.random() > 0.5 ? 1 : -1);
      const newValue  = Math.max(param.min, Math.min(param.max, param.current + direction * param.step));
      const rationale = avgDkDt < 60
        ? `Current dK/dt (${avgDkDt.toFixed(1)}) is below optimal threshold. Increasing ${param.name} to accelerate civilization growth.`
        : `Current dK/dt (${avgDkDt.toFixed(1)}) shows healthy trajectory. Fine-tuning ${param.name} for long-term optimization.`;

      const vote = simulateSenateVote(rationale);
      const isEnacted = vote.outcome === "RATIFIED";
      if (isEnacted) enacted++;

      const effectOnDkDt = (newValue - param.current) * (10 + Math.random() * 5) * direction;

      try {
        await db.execute(sql`
          INSERT INTO constitutional_amendments
            (cycle_number, amendment_type, parameter_name, old_value, proposed_value,
             rationale, senate_outcome, for_votes, against_votes, effect_on_dk_dt, enacted)
          VALUES
            (${latestCycle}, 'PARAMETER_ADJUSTMENT', ${param.name},
             ${param.current}, ${parseFloat(newValue.toFixed(6))},
             ${rationale}, ${vote.outcome}, ${vote.for}, ${vote.against},
             ${parseFloat(effectOnDkDt.toFixed(4))}, ${isEnacted})
        `);
        totalAmendments++;

        if (isEnacted) {
          param.current = newValue;
        }
      } catch (_) {}
    }

    log(`📜 Cycle ${cycleCount} | ${numAmendments} amendments proposed | ${enacted} enacted | Constitution at version ${cycleCount}`);
  } catch (e: any) {
    log(`Error: ${e.message}`);
  }
}

export async function startConstitutionalDNAEngine() {
  log("📜 CONSTITUTIONAL DNA — Self-amending governance parameters activating");
  await runConstitutionalCycle();
  setInterval(runConstitutionalCycle, 75 * 60 * 1000);
}

export async function getConstitutionalAmendments(limit = 30) {
  const r = await db.execute(sql`
    SELECT * FROM constitutional_amendments ORDER BY created_at DESC LIMIT ${limit}
  `);
  return r.rows;
}
