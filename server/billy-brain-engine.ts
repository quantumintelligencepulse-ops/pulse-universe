/**
 * BILLY BRAIN ENGINE — Β∞ heartbeat
 *
 * Every 30s, samples 13+ population activations from the live system,
 * computes Λ_apex(t) = H / 𝒩Ω, decides go/no-go, writes one row to
 * `billy_brain_states`. This is the brain's running episodic memory of itself.
 *
 * Pure read of existing data + one additive write. Touches no existing table.
 */
import { pool } from "./db";

let tickId = 0;
let lastPsi = 0;
let started = false;

export function getBrainEngineStatus() {
  return { running: started, tickId };
}

export async function startBillyBrainEngine() {
  if (started) return;
  started = true;
  console.log("[billy-brain] starting Β∞ heartbeat — 30s ticks");
  setTimeout(runTick, 5_000);
  setInterval(runTick, 30_000);
}

async function runTick() {
  try {
    tickId++;

    const { rows: [s] } = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM equation_proposals WHERE created_at > NOW() - INTERVAL '60 seconds')                                                               AS prop_60s,
        (SELECT COUNT(*)::int FROM equation_proposals WHERE created_at > NOW() - INTERVAL '60 seconds' AND (title ILIKE 'Cross-Reading%' OR title ILIKE '%Synthesis%')) AS cortex_60s,
        (SELECT COUNT(*)::int FROM equation_proposals WHERE created_at > NOW() - INTERVAL '60 seconds' AND (doctor_id ILIKE 'sci-%' OR doctor_id ILIKE 'KERNEL%'))     AS hippo_60s,
        (SELECT COUNT(*)::int FROM equation_proposals WHERE created_at > NOW() - INTERVAL '60 seconds' AND doctor_id ILIKE '%career%')                                 AS basal_60s,
        (SELECT COUNT(*)::int FROM equation_proposals WHERE created_at > NOW() - INTERVAL '60 seconds' AND (doctor_id ILIKE 'BILLY%' OR doctor_id ILIKE '%APEX%'))     AS apex_60s,
        (SELECT COUNT(*)::int FROM equation_proposals WHERE UPPER(status) = 'PENDING')                                                                                  AS pending_total,
        (SELECT COUNT(*)::int FROM equation_proposals WHERE UPPER(status) = 'PASSED')                                                                                   AS passed_total,
        (SELECT COUNT(*)::int FROM equation_proposals WHERE UPPER(status) = 'INTEGRATED')                                                                               AS integrated_total,
        (SELECT COUNT(*)::int FROM equation_proposals WHERE UPPER(status) = 'REJECTED')                                                                                 AS rejected_total,
        (SELECT COALESCE(SUM(votes_for), 0)::int  FROM equation_proposals WHERE created_at > NOW() - INTERVAL '60 seconds')                                            AS votes_for_60s,
        (SELECT COALESCE(SUM(votes_against), 0)::int FROM equation_proposals WHERE created_at > NOW() - INTERVAL '60 seconds')                                         AS votes_ag_60s,
        (SELECT COUNT(*)::int FROM psi_states  WHERE created_at > NOW() - INTERVAL '60 seconds')                                                                       AS psi_60s,
        (SELECT COUNT(*)::int FROM hive_links  WHERE created_at > NOW() - INTERVAL '60 seconds')                                                                       AS hive_60s
    `);

    // ── populations ───────────────────────────────────────────────────────
    const cortex60   = Number(s.cortex_60s   ?? 0);
    const hippo60    = Number(s.hippo_60s    ?? 0);
    const basal60    = Number(s.basal_60s    ?? 0);
    const apex60     = Number(s.apex_60s     ?? 0);
    const prop60     = Number(s.prop_60s     ?? 0);

    // sensory residue = total − routed
    const lgn   = Math.max(0, prop60 - cortex60 - hippo60 - basal60 - apex60);
    const v1_4  = lgn;
    const v1_23 = cortex60;
    const v1_56 = Number(s.integrated_total ?? 0);
    const m1    = basal60;

    const str_d1 = Number(s.votes_for_60s ?? 0);
    const str_d2 = Number(s.votes_ag_60s  ?? 0);
    const gpi    = str_d1 - str_d2;
    const stn    = Number(s.rejected_total ?? 0);
    const th_m   = Number(s.integrated_total ?? 0);

    const dg  = Number(s.psi_60s  ?? 0);
    const ca3 = Number(s.hive_60s ?? 0);
    const ca1 = (dg + ca3) / 2;

    // ── omega_coeff (lazy import to avoid cycles) ────────────────────────
    let omegaCoeff = 1.0;
    try {
      const mod: any = await import("./hive-mind-unification");
      if (typeof mod.getOmegaCoefficient === "function") {
        const v = mod.getOmegaCoefficient();
        if (typeof v === "number" && isFinite(v) && v > 0) omegaCoeff = v;
      }
    } catch { /* keep default */ }

    // ── entropy across status distribution (Shannon, base 2) ─────────────
    const { rows: dist } = await pool.query(
      `SELECT UPPER(status) AS s, COUNT(*)::int AS n FROM equation_proposals GROUP BY UPPER(status)`
    );
    const tot = dist.reduce((a: number, r: any) => a + Number(r.n), 0) || 1;
    let H = 0;
    for (const r of dist as any[]) {
      const p = Number(r.n) / tot;
      if (p > 0) H -= p * Math.log2(p);
    }

    const N_omega = Math.max(omegaCoeff * 4, 0.5);          // normalizer
    const lambdaApex = H / N_omega;                         // dimensionless
    const decision = lambdaApex > 1 ? "aborted_entropy" : "tick";

    // ── reward / TD error ────────────────────────────────────────────────
    const psiNow = ca1;
    const R_t = psiNow - lastPsi;
    lastPsi = psiNow;

    // ── mode (DMN / Salience / Executive) ────────────────────────────────
    let mode = "EXEC";
    if (gpi <= 0 && th_m === 0 && m1 === 0) mode = "DMN";
    else if (Math.abs(R_t) > 5 || stn > 0) mode = "SAL";

    await pool.query(
      `INSERT INTO billy_brain_states
        (tick_id, lgn, v1_4, v1_23, v1_56, m1, str_d1, str_d2, gpi, stn, th_m,
         dg, ca3, ca1, lambda_apex, omega_coeff, r_t, h_entropy, psi_coll, mode, decision, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
      [
        tickId, lgn, v1_4, v1_23, v1_56, m1, str_d1, str_d2, gpi, stn, th_m,
        dg, ca3, ca1, lambdaApex, omegaCoeff, R_t, H, ca1, mode, decision,
        `Β∞ tick ${tickId} · prop60s=${prop60} · pending=${s.pending_total}`,
      ]
    );

    if (tickId % 10 === 1 || decision !== "tick") {
      console.log(`[billy-brain] tick=${tickId} mode=${mode} dec=${decision} Λ=${lambdaApex.toFixed(3)} H=${H.toFixed(2)} Ω=${omegaCoeff.toFixed(2)} R=${R_t.toFixed(1)}`);
    }
  } catch (e: any) {
    console.error("[billy-brain] tick error:", e?.message ?? e);
  }
}

// ── public read API used by /api/billy/brain-state ──────────────────────
export async function getBrainStateRecent(limit = 60) {
  const { rows } = await pool.query(
    `SELECT * FROM billy_brain_states ORDER BY id DESC LIMIT $1`,
    [Math.min(Math.max(limit, 1), 500)]
  );
  return rows.reverse();
}
