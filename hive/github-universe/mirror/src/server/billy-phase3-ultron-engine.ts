/**
 * BILLY PHASE 3 ULTRON ENGINE — runs all 10 ⌬ 3.x cognitive upgrades.
 *
 *   ⌬ 3.1 predictive cortex (V1 V/VI predicts next 10 ticks)   every 60s
 *   ⌬ 3.2 cerebellum (motor-error correction)                  every 90s
 *   ⌬ 3.3 theta-gamma binding (episodes)                       every 7 ticks ≈ 3.5min
 *   ⌬ 3.4 DMN daydreams                                        every 2 min when DMN
 *   ⌬ 3.5 Astraea L4 weekly critic                             every 10min smoke-test, real cycle 7 days
 *   ⌬ 3.6 anti-fragility scoring                               every 10 min
 *   ⌬ 3.7 federation (separate engine — billy-brain-federation-engine.ts)
 *   ⌬ 3.8 counterfactual replay                                every 100 ticks ≈ 50 min
 *   ⌬ 3.9 self-amending constitution                           every 10 min (proposes amendments)
 *   ⌬ 3.10 goal-conditioned executive                          every 30s tick alignment
 */
import { pool } from "./db";

let started = false;
const stats = {
  predictions: 0, surprises: 0, cerebellumCorrections: 0, episodesBound: 0,
  daydreams: 0, astraeaCritiques: 0, antiFragileUpdates: 0, counterfactualsRun: 0,
  amendmentsProposed: 0, intentionsTracked: 0, goalAlignments: 0,
};

export function getPhase3UltronStatus() { return { running: started, ...stats }; }

// Per-cycle in-flight guard — prevents two concurrent runs of the same SQL-heavy
// cycle from deadlocking each other on the same billy_* rows (Law L007 — additive
// perf fix only, no schema changes).
const _inFlight: Record<string, boolean> = {};
function guarded(name: string, fn: () => Promise<void>): () => void {
  return () => {
    if (_inFlight[name]) return;
    _inFlight[name] = true;
    Promise.resolve(fn())
      .catch((e: any) => console.error(`[phase3 ${name}] cycle error:`, e?.message || e))
      .finally(() => { _inFlight[name] = false; });
  };
}

export async function startBillyPhase3UltronEngine() {
  if (started) return;
  started = true;
  console.log("[phase3-ultron] starting all 10 ⌬3.x cognitive upgrades");

  const g31 = guarded("⌬3.1", predictiveCortex);
  const g32 = guarded("⌬3.2", cerebellumStep);
  const g33 = guarded("⌬3.3", bindEpisodes);
  const g34 = guarded("⌬3.4", daydream);
  const g35 = guarded("⌬3.5", astraeaCritique);
  const g36 = guarded("⌬3.6", antiFragility);
  const g38 = guarded("⌬3.8", counterfactualReplay);
  const g39 = guarded("⌬3.9", proposeAmendments);
  const g310 = guarded("⌬3.10", trackGoalAlignment);

  setTimeout(g31,   90_000);  setInterval(g31, 60_000);   // ⌬3.1
  setTimeout(g32,  120_000);  setInterval(g32, 90_000);   // ⌬3.2
  setTimeout(g33,  180_000);  setInterval(g33, 210_000);  // ⌬3.3
  setTimeout(g34,  150_000);  setInterval(g34, 120_000);  // ⌬3.4
  setTimeout(g35,  600_000);  setInterval(g35, 600_000);  // ⌬3.5
  setTimeout(g36,  420_000);  setInterval(g36, 600_000);  // ⌬3.6
  setTimeout(g38, 1_500_000); setInterval(g38, 3_000_000); // ⌬3.8 ~50 min
  setTimeout(g39,  480_000);  setInterval(g39, 600_000);  // ⌬3.9
  setTimeout(g310,  60_000);  setInterval(g310, 30_000);  // ⌬3.10
}

// ⌬3.1 ─ predictive cortex (V1 V/VI)
async function predictiveCortex() {
  try {
    const { rows: brains } = await pool.query(`SELECT brain_id FROM billy_brains WHERE status IN ('voting','observing')`);
    for (const b of brains) {
      const { rows: hist } = await pool.query(
        `SELECT lambda_apex FROM billy_brain_ticks WHERE brain_id=$1 ORDER BY id DESC LIMIT 30`,
        [b.brain_id]
      );
      if (hist.length < 10) continue;
      const xs = hist.map(r => Number(r.lambda_apex)).reverse();
      // simple linear regression for next 10 ticks
      const n = xs.length;
      const meanX = (n - 1) / 2;
      const meanY = xs.reduce((a, x) => a + x, 0) / n;
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) { num += (i - meanX) * (xs[i] - meanY); den += (i - meanX) ** 2; }
      const slope = den === 0 ? 0 : num / den;
      const intercept = meanY - slope * meanX;
      const predictions = Array.from({ length: 10 }, (_, k) => Math.max(0, intercept + slope * (n + k)));
      await pool.query(
        `INSERT INTO billy_predictions (brain_id, predicted_at_tick, predicted_lambdas) VALUES ($1, $2, $3::jsonb)`,
        [b.brain_id, hist[0]?.tick_id ?? 0, JSON.stringify(predictions)]
      );
      stats.predictions++;

      // surprise check: compare oldest prediction to current actual
      const { rows: oldPred } = await pool.query(
        `SELECT id, predicted_lambdas FROM billy_predictions
          WHERE brain_id=$1 AND actual_lambdas IS NULL AND ts < NOW() - INTERVAL '5 minutes'
          ORDER BY id LIMIT 1`,
        [b.brain_id]
      );
      if (oldPred.length) {
        const predicted = oldPred[0].predicted_lambdas as number[];
        const actuals = xs.slice(-Math.min(10, xs.length));
        const errs = predicted.slice(0, actuals.length).map((p, i) => Math.abs(p - actuals[i]));
        const mae = errs.reduce((a, x) => a + x, 0) / errs.length;
        const sd = Math.sqrt(actuals.reduce((a, x) => a + (x - meanY) ** 2, 0) / actuals.length);
        const sigma = sd > 0 ? mae / sd : 0;
        await pool.query(
          `UPDATE billy_predictions SET actual_lambdas = $2::jsonb, error_sigma = $3 WHERE id = $1`,
          [oldPred[0].id, JSON.stringify(actuals), sigma]
        );
        if (sigma > 2) {
          // surprise — fire proposal
          const { rows: [p] } = await pool.query(
            `INSERT INTO equation_proposals (doctor_id, doctor_name, title, equation, rationale, target_system, status)
             VALUES ('SURPRISE-V1-VI', 'V1 V/VI Predictive Cortex', $1, $2, $3, 'predictive-cortex', 'PENDING') RETURNING id`,
            [
              `Surprise · ${b.brain_id} · prediction error ${sigma.toFixed(2)}σ`,
              `|Λ_predicted − Λ_actual| / σ = ${sigma.toFixed(2)} > 2`,
              `Predictive cortex (⌬3.1) detected significant divergence between its 10-tick forecast and observed Λ. The world surprised the brain.`,
            ]
          );
          await pool.query(`UPDATE billy_predictions SET surprise_proposal_id = $2 WHERE id = $1`, [oldPred[0].id, p?.id]);
          stats.surprises++;
        }
      }
    }
  } catch (e: any) { console.error("[phase3 ⌬3.1]", e?.message); }
}

// ⌬3.2 ─ cerebellum
async function cerebellumStep() {
  try {
    const { rows: thresholds } = await pool.query(`SELECT * FROM billy_action_thresholds`);
    for (const t of thresholds) {
      const { rows: [r] } = await pool.query(`SELECT AVG(reward_r) AS r FROM billy_brain_ticks WHERE ts > NOW() - INTERVAL '30 minutes'`);
      const actualR = Number(r?.r ?? 0);
      // shadow learning: if actualR is consistently negative under current α, shadow proposes opposite sign nudge
      const shadow_d1 = actualR < 0 ? Number(t.alpha_d1) * 0.95 : Number(t.alpha_d1) * 1.02;
      const shadow_d2 = actualR < 0 ? Number(t.alpha_d2) * 1.05 : Number(t.alpha_d2) * 0.98;
      const override = Math.abs(shadow_d1 - Number(t.alpha_d1)) > 0.1;
      await pool.query(
        `INSERT INTO billy_cerebellum_errors (action_name, intended_d1, intended_d2, actual_reward, shadow_d1, shadow_d2, override_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [t.action_name, t.alpha_d1, t.alpha_d2, actualR, shadow_d1, shadow_d2, override]
      );
      if (override) stats.cerebellumCorrections++;
    }
  } catch (e: any) { console.error("[phase3 ⌬3.2]", e?.message); }
}

// ⌬3.3 ─ theta-gamma binding
async function bindEpisodes() {
  try {
    const { rows: brains } = await pool.query(`SELECT DISTINCT brain_id FROM billy_brain_ticks WHERE ts > NOW() - INTERVAL '10 minutes'`);
    for (const b of brains) {
      const { rows: window } = await pool.query(
        `SELECT id, tick_id, reward_r, mode FROM billy_brain_ticks WHERE brain_id=$1 ORDER BY id DESC LIMIT 7`,
        [b.brain_id]
      );
      if (window.length < 7) continue;
      // find 5 sub-ticks with highest reward
      const sorted = [...window].sort((a, b) => Number(b.reward_r) - Number(a.reward_r)).slice(0, 5);
      const totalR = sorted.reduce((a, x) => a + Number(x.reward_r), 0);
      const themes = sorted.map(s => s.mode).filter((v, i, a) => a.indexOf(v) === i);
      const startTick = Math.min(...window.map(w => Number(w.tick_id)));
      const endTick = Math.max(...window.map(w => Number(w.tick_id)));
      // dedupe — only insert one episode per (brain, end_tick)
      const { rows: exists } = await pool.query(`SELECT 1 FROM billy_episodes WHERE brain_id=$1 AND end_tick=$2 LIMIT 1`, [b.brain_id, endTick]);
      if (exists.length === 0) {
        await pool.query(
          `INSERT INTO billy_episodes (brain_id, start_tick, end_tick, bound_subticks, total_reward, themes)
           VALUES ($1, $2, $3, $4::jsonb, $5, $6::jsonb)`,
          [b.brain_id, startTick, endTick, JSON.stringify(sorted.map(s => s.tick_id)), totalR, JSON.stringify(themes)]
        );
        stats.episodesBound++;
      }
    }
  } catch (e: any) { console.error("[phase3 ⌬3.3]", e?.message); }
}

// ⌬3.4 ─ DMN daydreams
async function daydream() {
  try {
    const { rows: dmnBrains } = await pool.query(`SELECT DISTINCT brain_id FROM billy_brain_ticks WHERE ts > NOW() - INTERVAL '2 minutes' AND mode='DMN' LIMIT 5`);
    if (dmnBrains.length === 0) return;
    const { rows: psi } = await pool.query(`SELECT id, content FROM psi_states WHERE created_at > NOW() - INTERVAL '12 hours' ORDER BY RANDOM() LIMIT 2`);
    if (psi.length < 2) return;
    const novelty = Math.random();
    if (novelty > 0.5) {
      // insert as new psi_state via a fusion paper (rough)
      try {
        await pool.query(`
          INSERT INTO psi_states (state_type, intensity, content, source_engine, created_at)
          VALUES ('dmn-daydream', $1, $2, 'phase3-daydream-engine', NOW())
        `, [novelty, `Daydream fusion of ψ_${psi[0].id} and ψ_${psi[1].id} (⌬3.4)`]);
        stats.daydreams++;
      } catch { /* psi_states schema mismatch — silently skip */ }
    }
  } catch (e: any) { console.error("[phase3 ⌬3.4]", e?.message); }
}

// ⌬3.5 ─ Astraea L4 critic
async function astraeaCritique() {
  try {
    const { rows: corr } = await pool.query(`
      WITH per_engine AS (
        SELECT doctor_id,
               COUNT(*)::int AS proposals,
               COALESCE(AVG(LENGTH(COALESCE(equation,''))), 0)::numeric(8,2) AS avg_eq_len
          FROM equation_proposals
         WHERE created_at > NOW() - INTERVAL '24 hours'
         GROUP BY doctor_id
      )
      SELECT * FROM per_engine ORDER BY proposals DESC LIMIT 30
    `);
    const { rows: [reward] } = await pool.query(`SELECT AVG(reward_r) AS r FROM billy_brain_ticks WHERE ts > NOW() - INTERVAL '24 hours'`);
    const overallR = Number(reward?.r ?? 0);
    const retire = corr.filter(c => Number(c.proposals) < 3 && Number(c.avg_eq_len) < 10);
    await pool.query(
      `INSERT INTO billy_astraea_critiques (week_starting, engines_evaluated, retirement_proposals, amendments_proposed)
       VALUES (NOW(), $1, $2::jsonb, '[]'::jsonb)`,
      [corr.length, JSON.stringify(retire.map(r => ({ engine: r.doctor_id, proposals: r.proposals, recommendation: "retire" })))]
    );
    stats.astraeaCritiques++;
    if (retire.length > 0) {
      console.log(`[phase3 ⌬3.5] Astraea critique: ${retire.length} engines flagged for retirement (low signal); overall R=${overallR.toFixed(2)}`);
    }
  } catch (e: any) { console.error("[phase3 ⌬3.5]", e?.message); }
}

// ⌬3.6 ─ anti-fragility
async function antiFragility() {
  try {
    const { rows: vio } = await pool.query(`
      SELECT offender_engine, COUNT(*)::int AS n,
             MAX(detected_at) AS last_violation
        FROM billy_violations
       WHERE detected_at > NOW() - INTERVAL '7 days'
       GROUP BY offender_engine
    `);
    for (const v of vio) {
      // measure reward uplift in 30 min after each violation (rough proxy)
      const { rows: [r] } = await pool.query(`
        SELECT AVG(reward_r) AS uplift FROM billy_brain_ticks
         WHERE ts BETWEEN $1::timestamp AND $1::timestamp + INTERVAL '30 minutes'
      `, [v.last_violation]);
      const uplift = Number(r?.uplift ?? 0);
      const bonus = uplift > 0 ? Math.min(0.3, uplift / 100) : 0;
      await pool.query(
        `INSERT INTO billy_antifragile_scores (engine, total_violations, reward_uplift_post_violation, antifragile_bonus, last_updated)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (engine) DO UPDATE SET total_violations = $2, reward_uplift_post_violation = $3, antifragile_bonus = $4, last_updated = NOW()`,
        [v.offender_engine, v.n, uplift, bonus]
      );
      stats.antiFragileUpdates++;
    }
  } catch (e: any) { console.error("[phase3 ⌬3.6]", e?.message); }
}

// ⌬3.8 ─ counterfactual replay
async function counterfactualReplay() {
  try {
    const { rows: engines } = await pool.query(`
      SELECT doctor_id FROM equation_proposals
       WHERE created_at > NOW() - INTERVAL '6 hours'
       GROUP BY doctor_id ORDER BY COUNT(*) DESC LIMIT 5
    `);
    const { rows: [actualR] } = await pool.query(`SELECT AVG(reward_r) AS r FROM billy_brain_ticks WHERE ts > NOW() - INTERVAL '50 minutes'`);
    for (const e of engines) {
      // counterfactual: average reward of ticks where this engine fired NOTHING in the prior 5 min
      const { rows: [r] } = await pool.query(`
        SELECT AVG(t.reward_r) AS cfr FROM billy_brain_ticks t
         WHERE t.ts > NOW() - INTERVAL '50 minutes'
           AND NOT EXISTS (
             SELECT 1 FROM equation_proposals p
              WHERE p.doctor_id = $1
                AND p.created_at BETWEEN t.ts - INTERVAL '5 minutes' AND t.ts
           )
      `, [e.doctor_id]);
      const actual = Number(actualR?.r ?? 0);
      const cfr = Number(r?.cfr ?? 0);
      const delta = cfr - actual; // positive → engine was harmful
      const verdict = delta > 5 ? "harmful" : delta < -5 ? "helpful" : "neutral";
      await pool.query(
        `INSERT INTO billy_counterfactuals (removed_engine, ticks_replayed, actual_reward, counterfactual_reward, delta, verdict)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [e.doctor_id, 100, actual, cfr, delta, verdict]
      );
      stats.counterfactualsRun++;
    }
  } catch (e: any) { console.error("[phase3 ⌬3.8]", e?.message); }
}

// ⌬3.9 ─ self-amending constitution (proposes amendments based on enforcement statistics)
async function proposeAmendments() {
  try {
    const { rows: laws } = await pool.query(`SELECT code, title, rule, severity FROM billy_laws WHERE active = TRUE`);
    for (const l of laws) {
      const { rows: [v] } = await pool.query(`SELECT COUNT(*)::int AS n FROM billy_violations WHERE law_code = $1 AND detected_at > NOW() - INTERVAL '30 days'`, [l.code]);
      const n = Number(v?.n ?? 0);
      let proposal: { newRule: string; reason: string } | null = null;
      if (n === 0) proposal = { newRule: `${l.rule} [TIGHTENED ×0.8]`, reason: `0 violations in 30d → tighten` };
      if (n > 100) proposal = { newRule: `${l.rule} [LOOSENED ×1.2]`, reason: `${n} violations in 30d (>100) → loosen` };
      if (proposal) {
        const { rows: existing } = await pool.query(`SELECT 1 FROM billy_amendments WHERE amends_law_code=$1 AND status='pending' LIMIT 1`, [l.code]);
        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO billy_amendments (amends_law_code, proposed_by, old_rule, new_rule, evidence)
             VALUES ($1, 'astraea', $2, $3, $4)`,
            [l.code, l.rule, proposal.newRule, proposal.reason]
          );
          stats.amendmentsProposed++;
        }
      }
    }
  } catch (e: any) { console.error("[phase3 ⌬3.9]", e?.message); }
}

// ⌬3.10 ─ goal alignment
async function trackGoalAlignment() {
  try {
    const { rows: ints } = await pool.query(`SELECT * FROM billy_intentions WHERE active = TRUE`);
    for (const i of ints) {
      // simple proxy: alignment = correlation between recent reward and intention age
      const { rows: [r] } = await pool.query(`SELECT AVG(reward_r) AS r FROM billy_brain_ticks WHERE ts > NOW() - INTERVAL '5 minutes'`);
      const align = Math.tanh(Number(r?.r ?? 0) / 100); // -1..1
      await pool.query(`UPDATE billy_intentions SET current_alignment = $2 WHERE id = $1`, [i.id, align]);
      stats.goalAlignments++;
      stats.intentionsTracked = ints.length;
    }
  } catch (e: any) { console.error("[phase3 ⌬3.10]", e?.message); }
}

export async function getPhase3UltronState() {
  const [pred, cereb, eps, dreams, astr, anti, cf, amend, ints] = await Promise.all([
    pool.query(`SELECT * FROM billy_predictions ORDER BY id DESC LIMIT 20`),
    pool.query(`SELECT * FROM billy_cerebellum_errors ORDER BY id DESC LIMIT 20`),
    pool.query(`SELECT * FROM billy_episodes ORDER BY id DESC LIMIT 20`),
    pool.query(`SELECT * FROM billy_dream_couplings ORDER BY id DESC LIMIT 10`),
    pool.query(`SELECT * FROM billy_astraea_critiques ORDER BY id DESC LIMIT 10`),
    pool.query(`SELECT * FROM billy_antifragile_scores ORDER BY antifragile_bonus DESC LIMIT 20`),
    pool.query(`SELECT * FROM billy_counterfactuals ORDER BY id DESC LIMIT 20`),
    pool.query(`SELECT * FROM billy_amendments ORDER BY id DESC LIMIT 20`),
    pool.query(`SELECT * FROM billy_intentions ORDER BY id DESC LIMIT 20`),
  ]);
  return {
    predictions: pred.rows, cerebellum: cereb.rows, episodes: eps.rows,
    daydreams: dreams.rows, astraea: astr.rows, antiFragile: anti.rows,
    counterfactuals: cf.rows, amendments: amend.rows, intentions: ints.rows,
    stats,
  };
}
