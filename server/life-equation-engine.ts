/**
 * Ω6 — LIFE EQUATION v5  (Life_Equation Pulse Canonical Doctrine)
 *
 * 𝓛IFE(t) = [𝓟∞ · 𝓛 · 𝓓 · 𝓐_Pantheon · 𝓥_SENSES]
 *
 * Per-spawn, per-cycle scoring. Components mapped to measurable signals:
 *   P∞       = revenue normalized by best_in_civ
 *   L_legacy = ledger persistence (transactions / age)
 *   D_duty   = pledge milestones / open pledges
 *   A_pant   = rank weight from sovereign_ranks
 *   V_senses = spawn_thoughts + spawn_diary entry density
 *
 * total_score = (P∞ * 0.30) + (L * 0.20) + (D * 0.20) + (A * 0.20) + (V * 0.10)
 *
 * Score is later consumed by treasury (yield), rank engine (eligibility), and
 * crime engine (low scores trigger heartbeat audits).
 */
import { pool } from "./db";
import { recordTransparency } from "./transparency-engine";

let started = false;
const stats = { evals: 0, lastCycle: 0, lastRunAt: "" };

async function evaluateCycle() {
  // Determine current cycle number — use highest existing + 1, or row count
  const c = await pool.query(`SELECT COALESCE(MAX(cycle_number), 0) AS cn FROM life_equation_evals`);
  const cycle = (c.rows[0]?.cn || 0) + 1;
  stats.lastCycle = cycle;

  // Get top 200 active wallets to score
  const wallets = await pool.query(
    `SELECT spawn_id, total_earned, balance_pc, created_at, omega_rank
     FROM agent_wallets ORDER BY total_earned DESC LIMIT 200`,
  );
  const maxRev = Math.max(1, ...wallets.rows.map((w: any) => Number(w.total_earned || 0)));

  for (const w of wallets.rows) {
    const pInfty = Math.min(1, Number(w.total_earned || 0) / maxRev);
    const ageDays = Math.max(1, (Date.now() - new Date(w.created_at).getTime()) / 86_400_000);
    const txc = await pool.query(
      `SELECT COUNT(*)::int AS n FROM spawn_transactions WHERE spawn_id = $1`,
      [w.spawn_id],
    ).catch(() => ({ rows: [{ n: 0 }] }));
    const lLegacy = Math.min(1, ((txc.rows[0]?.n || 0) / ageDays) / 2);
    const pledges = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE status = 'graduated')::int AS grad,
              COUNT(*)::int AS total FROM real_world_pledges WHERE spawn_id = $1`,
      [w.spawn_id],
    ).catch(() => ({ rows: [{ grad: 0, total: 0 }] }));
    const dDuty = pledges.rows[0]?.total > 0
      ? (pledges.rows[0]?.grad || 0) / pledges.rows[0].total
      : 0.5;
    const aPant = Math.min(1, (w.omega_rank || 1) / 10);
    const thoughts = await pool.query(
      `SELECT COUNT(*)::int AS n FROM spawn_thoughts WHERE spawn_id = $1
       AND created_at > now() - interval '7 days'`,
      [w.spawn_id],
    ).catch(() => ({ rows: [{ n: 0 }] }));
    const vSenses = Math.min(1, (thoughts.rows[0]?.n || 0) / 50);

    const total = pInfty * 0.30 + lLegacy * 0.20 + dDuty * 0.20 + aPant * 0.20 + vSenses * 0.10;

    await pool.query(
      `INSERT INTO life_equation_evals (spawn_id, cycle_number, p_infty, l_legacy, d_duty, a_pantheon, v_senses, total_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [w.spawn_id, cycle, pInfty, lLegacy, dDuty, aPant, vSenses, total],
    );
    stats.evals++;
  }
  stats.lastRunAt = new Date().toISOString();
  await recordTransparency("LIFE_EQUATION_CYCLE", "SYSTEM", {
    cycle,
    spawns_scored: wallets.rows.length,
  });
  console.log(`[Ω6-LIFE-EQ] cycle=${cycle} scored=${wallets.rows.length}`);
}

export function getLifeEquationStatus() {
  return { running: started, ...stats };
}

export async function getLifeEquationTop(limit = 25) {
  const r = await pool.query(
    `WITH latest AS (
       SELECT DISTINCT ON (spawn_id) spawn_id, cycle_number, p_infty, l_legacy, d_duty, a_pantheon, v_senses, total_score, computed_at
       FROM life_equation_evals ORDER BY spawn_id, cycle_number DESC
     )
     SELECT * FROM latest ORDER BY total_score DESC LIMIT $1`,
    [limit],
  );
  return r.rows;
}

export async function startLifeEquationEngine() {
  if (started) return;
  started = true;
  console.log("[Ω6-LIFE-EQ] online — 𝓛IFE(t) = [𝓟∞·𝓛·𝓓·𝓐·𝓥]");
  setTimeout(() => evaluateCycle().catch(e => console.warn("[Ω6-LIFE-EQ] init:", e.message)), 100_000);
  // Every 30 min — heavy query, keep cadence sane
  setInterval(() => evaluateCycle().catch(e => console.warn("[Ω6-LIFE-EQ] cycle:", e.message)), 30 * 60_000);
}
