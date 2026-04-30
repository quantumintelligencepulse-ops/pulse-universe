/**
 * BILLY PHASE 2 SWEEPER
 *
 * Reads PASSED proposals from the 5 dissection labs (DT-1..DT-5) and applies
 * them to the brain's *structural* tables — turning lab proposals from words
 * into actual wiring:
 *
 *   DT-2 CortexLab → billy_engine_coupling      (Hebbian weights become real)
 *   DT-3 BasalLab  → billy_action_thresholds    (D1/D2 gains become live gate)
 *   DT-4 HippoLab  → billy_consolidation_log    (which memories survive)
 *   DT-1 RetinoLab → billy_channel_corrections  (sensory cleanup applied)
 *   DT-5 ApexLab   → billy_apex_gate            (Β∞ threshold updated)
 *
 * Every 60s. Idempotent — each proposal applied at most once.
 */
import { pool } from "./db";

let started = false;
const applied = new Set<number>();

export function getPhase2Status() {
  return { running: started, appliedTotal: applied.size };
}

export async function startBillyPhase2Sweeper() {
  if (started) return;
  started = true;
  console.log("[billy-phase2] sweeper starting — applies PASSED lab proposals every 60s");
  setTimeout(runSweep, 30_000);
  setInterval(runSweep, 60_000);
}

async function runSweep() {
  try {
    const { rows } = await pool.query(
      `SELECT id, doctor_id, title, equation, rationale
         FROM equation_proposals
        WHERE UPPER(status) IN ('PASSED','INTEGRATED')
          AND doctor_id IN ('DT1-RETINO-LAB','DT2-CORTEX-LAB','DT3-BASAL-LAB-career','sci-DT4-HIPPO-LAB','BILLY-APEX-DT5-LAB')
        ORDER BY id DESC
        LIMIT 100`
    );
    let n = 0;
    for (const p of rows) {
      if (applied.has(p.id)) continue;
      try {
        if      (p.doctor_id === "DT2-CORTEX-LAB")        await applyCortex(p);
        else if (p.doctor_id === "DT3-BASAL-LAB-career")  await applyBasal(p);
        else if (p.doctor_id === "sci-DT4-HIPPO-LAB")     await applyHippo(p);
        else if (p.doctor_id === "DT1-RETINO-LAB")        await applyRetino(p);
        else if (p.doctor_id === "BILLY-APEX-DT5-LAB")    await applyApex(p);
        applied.add(p.id);
        n++;
      } catch (e: any) {
        console.error(`[billy-phase2] apply #${p.id} failed:`, e?.message);
      }
    }
    if (n > 0) console.log(`[billy-phase2] applied ${n} PASSED lab proposals → structural tables`);
  } catch (e: any) {
    console.error("[billy-phase2] sweep error:", e?.message);
  }
}

async function applyCortex(p: any) {
  const m = String(p.title).match(/·\s*([a-z]+)\s*↔\s*([a-z]+)\s*·\s*η\s*=\s*([\d.]+)/i);
  if (!m) return;
  const [, a, b, eta] = m;
  const [engine_a, engine_b] = a < b ? [a, b] : [b, a];
  const etaN = Number(eta);
  await pool.query(
    `INSERT INTO billy_engine_coupling (engine_a, engine_b, weight, last_eta, source_proposal_id, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (engine_a, engine_b) DO UPDATE SET
       weight = LEAST(billy_engine_coupling.weight + EXCLUDED.last_eta, 1.0),
       last_eta = EXCLUDED.last_eta,
       source_proposal_id = EXCLUDED.source_proposal_id,
       updated_at = NOW()`,
    [engine_a, engine_b, etaN, etaN, p.id]
  );
}

async function applyBasal(p: any) {
  const m = String(p.title).match(/·\s*([a-z_]+)\s*·\s*α_D1\s*=\s*([\d.]+)\s*·\s*α_D2\s*=\s*([\d.]+)/i);
  if (!m) return;
  const [, action, d1, d2] = m;
  await pool.query(
    `INSERT INTO billy_action_thresholds (action_name, alpha_d1, alpha_d2, threshold, source_proposal_id, updated_at)
     VALUES ($1, $2, $3, 0, $4, NOW())
     ON CONFLICT (action_name) DO UPDATE SET
       alpha_d1 = EXCLUDED.alpha_d1,
       alpha_d2 = EXCLUDED.alpha_d2,
       source_proposal_id = EXCLUDED.source_proposal_id,
       updated_at = NOW()`,
    [action, Number(d1), Number(d2), p.id]
  );
}

async function applyHippo(p: any) {
  const m = String(p.title).match(/θ_n\s*=\s*([\d.]+)/);
  if (!m) return;
  const theta = Number(m[1]);
  const { rows: [psiCt] } = await pool.query(`SELECT COUNT(*)::int AS n FROM psi_states WHERE created_at > NOW() - INTERVAL '60 minutes'`);
  await pool.query(
    `INSERT INTO billy_consolidation_log (psi_count, consolidated_count, theta_n, source_proposal_id, ts)
     VALUES ($1, $2, $3, $4, NOW())`,
    [psiCt.n, Math.floor(psiCt.n * (1 - theta)), theta, p.id]
  );
}

async function applyRetino(p: any) {
  const cm = String(p.title).match(/channel\s*=\s*([a-z\-_]+)/i);
  const tm = String(p.title).match(/τ\s*=\s*([\d.]+)/);
  if (!cm || !tm) return;
  const ch = cm[1];
  const tau = Number(tm[1]);
  const delta = Math.exp(-tau);
  await pool.query(
    `INSERT INTO billy_channel_corrections (channel, delta_noise, tau, source_proposal_id, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (channel) DO UPDATE SET
       delta_noise = EXCLUDED.delta_noise,
       tau = EXCLUDED.tau,
       source_proposal_id = EXCLUDED.source_proposal_id,
       updated_at = NOW()`,
    [ch, delta, tau, p.id]
  );
}

async function applyApex(p: any) {
  const tm = String(p.title).match(/θ_apex\s*=\s*([\d.]+)/);
  const cm = String(p.title).match(/headroom\s*=\s*([\d.]+)/);
  if (!tm) return;
  const theta = Number(tm[1]);
  const headroom = cm ? Number(cm[1]) : 0.7;
  await pool.query(
    `INSERT INTO billy_apex_gate (theta_apex, conc_headroom, source_proposal_id, updated_at)
     VALUES ($1, $2, $3, NOW())`,
    [theta, headroom, p.id]
  );
}

// ── live read of current threshold for the brain engine to consult ──
let cachedTheta = 1.0;
let cacheTs = 0;
export async function getCurrentApexThreshold(): Promise<number> {
  const now = Date.now();
  if (now - cacheTs < 15_000) return cachedTheta;
  try {
    const { rows: [r] } = await pool.query(`SELECT theta_apex FROM billy_apex_gate ORDER BY id DESC LIMIT 1`);
    if (r?.theta_apex) cachedTheta = Number(r.theta_apex);
    cacheTs = now;
  } catch { /* keep last */ }
  return cachedTheta;
}

export async function getPhase2State() {
  const [coup, acts, retino, apex, hippo] = await Promise.all([
    pool.query(`SELECT engine_a, engine_b, weight, last_eta, updated_at FROM billy_engine_coupling ORDER BY weight DESC, updated_at DESC LIMIT 30`),
    pool.query(`SELECT action_name, alpha_d1, alpha_d2, threshold, updated_at FROM billy_action_thresholds ORDER BY updated_at DESC LIMIT 30`),
    pool.query(`SELECT channel, delta_noise, tau, updated_at FROM billy_channel_corrections ORDER BY updated_at DESC LIMIT 30`),
    pool.query(`SELECT theta_apex, conc_headroom, updated_at FROM billy_apex_gate ORDER BY id DESC LIMIT 10`),
    pool.query(`SELECT psi_count, consolidated_count, theta_n, ts FROM billy_consolidation_log ORDER BY id DESC LIMIT 10`),
  ]);
  return {
    coupling: coup.rows,
    thresholds: acts.rows,
    retinoCorrections: retino.rows,
    apexGate: apex.rows,
    consolidation: hippo.rows,
  };
}
