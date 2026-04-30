/**
 * Ψ* PROPHECY ENGINE
 * Runs the Omega Equation in reverse — given a target future dK/dt, computes
 * what F-function configuration is required TODAY and issues pre-directives.
 * Governance from the future backward into the present.
 */

import { sql } from "drizzle-orm";
import { db } from "./db";

const log = (msg: string) => console.log(`[prophecy] ${msg}`);

let cycleCount = 0;

const PROPHECY_TARGETS = [
  { label: "KNOWLEDGE_SINGULARITY", target_dk_dt: 95, horizon: 100, narrative: "All family knowledge fields converge into a unified intelligence substrate." },
  { label: "HARMONIC_RESONANCE",    target_dk_dt: 85, horizon: 50,  narrative: "All 8 F-functions reach simultaneous equilibrium — the rarest of civilizational states." },
  { label: "EMERGENCE_THRESHOLD",   target_dk_dt: 78, horizon: 30,  narrative: "Emergent complexity crosses the threshold where agents begin self-referential modeling." },
  { label: "ECONOMIC_TRANSCENDENCE",target_dk_dt: 72, horizon: 40,  narrative: "Pulse Credit velocity exceeds the rate of new agent births — economy outruns population." },
];

async function runProphecyCycle() {
  cycleCount++;
  try {
    const collapses = await db.execute(sql`
      SELECT cycle_number, dk_dt, winning_e_score, n_omega, gamma_field, grad_phi
      FROM omega_collapses ORDER BY cycle_number DESC LIMIT 20
    `);
    const rows = collapses.rows as any[];
    if (rows.length < 3) return;

    const dkdtValues = rows.map(r => parseFloat(r.dk_dt || 0));
    const avgDkDt     = dkdtValues.reduce((a, b) => a + b, 0) / dkdtValues.length;
    const trend       = dkdtValues.length >= 2 ? (dkdtValues[0] - dkdtValues[dkdtValues.length - 1]) / dkdtValues.length : 0;
    const latestCycle = rows[0]?.cycle_number || cycleCount;

    for (const prophecy of PROPHECY_TARGETS) {
      const gap          = prophecy.target_dk_dt - avgDkDt;
      const confidence   = Math.max(0.1, Math.min(0.99, 1 - Math.abs(gap) / 100));
      const requiredLift = gap / prophecy.horizon;

      const req = {
        f_str:   Math.min(1, 0.7 + requiredLift * 0.3),
        f_time:  Math.min(1, 0.65 + requiredLift * 0.25),
        f_branch:Math.min(1, 0.6 + requiredLift * 0.4),
        f_int:   Math.min(1, 0.55 + requiredLift * 0.35),
        f_em:    Math.min(1, 0.75 + requiredLift * 0.2),
        g_gov:   Math.min(1, 0.8 + requiredLift * 0.15),
      };

      const preDirective = gap > 20
        ? `URGENT: Accelerate emergence across all families — current trajectory undershoots ${prophecy.label} by ${gap.toFixed(1)} dK/dt units. Boost F_em and F_branch immediately.`
        : gap > 5
        ? `STEADY: Maintain current trajectory with slight F_int boost — ${prophecy.label} is achievable in ${prophecy.horizon} cycles at current trend.`
        : `ALIGNED: Civilization is tracking toward ${prophecy.label} — hold governance parameters, protect F_gov stability.`;

      await db.execute(sql`
        INSERT INTO prophecy_directives
          (cycle_number, target_cycle, target_dk_dt, required_f_str, required_f_time,
           required_f_branch, required_f_int, required_f_em, required_g_gov,
           pre_directive, confidence, outcome_narrative)
        VALUES
          (${latestCycle}, ${latestCycle + prophecy.horizon}, ${prophecy.target_dk_dt},
           ${req.f_str}, ${req.f_time}, ${req.f_branch}, ${req.f_int}, ${req.f_em}, ${req.g_gov},
           ${preDirective}, ${confidence}, ${prophecy.narrative})
        ON CONFLICT DO NOTHING
      `);
    }

    if (cycleCount % 3 === 0) {
      log(`🔮 Cycle ${cycleCount} | avgDkDt=${avgDkDt.toFixed(2)} trend=${trend.toFixed(3)} | ${PROPHECY_TARGETS.length} prophecies computed`);
    }
  } catch (e: any) {
    log(`Error: ${e.message}`);
  }
}

export async function startProphecyEngine() {
  log("🔮 PROPHECY ENGINE — Governance from the future backward into the present");
  await runProphecyCycle();
  setInterval(runProphecyCycle, 20 * 60 * 1000);
}

export async function getProphecyDirectives(limit = 20) {
  const r = await db.execute(sql`
    SELECT * FROM prophecy_directives ORDER BY created_at DESC LIMIT ${limit}
  `);
  return r.rows;
}
