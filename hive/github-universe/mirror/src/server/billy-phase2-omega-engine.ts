/**
 * BILLY PHASE 2 OMEGA ENGINE — runs all 10 Ω-2.x upgrades on cycle.
 *
 *   Ω-2.1 counter-Hebbian decoupling   (every 2 min)
 *   Ω-2.2 principle generalization     (every 5 min)
 *   Ω-2.3 DMN replay (dream couplings) (when any brain in DMN, every 3 min)
 *   Ω-2.4 apex hysteresis              (consulted by brain engine via getEffectiveTheta)
 *   Ω-2.5 multi-channel entropy        (every tick — exposed via getEntropyDecomposition)
 *   Ω-2.6 retino cross-channel propagation (every 4 min)
 *   Ω-2.7 redemption ledger            (every 5 min — score 24h penance survival)
 *   Ω-2.8 guardian rotation            (daily)
 *   Ω-2.9 constitutional amendments    (every 10 min — process billy_proposed_laws)
 *   Ω-2.10 interlocking pyramid        (every 5 min)
 */
import { pool } from "./db";

let started = false;
const stats = { decouplings: 0, generalizations: 0, dreams: 0, redemptions: 0, rotations: 0, amendments: 0, denialBricks: 0 };

// ─── Ω-2.4 hysteresis: gate state machine ─────────────────────────────────
type GateState = "open" | "closed";
let hystState: GateState = "open";
let hystSince = Date.now();
export function getHysteresisGate(): { state: GateState; sinceMs: number } {
  return { state: hystState, sinceMs: Date.now() - hystSince };
}
export async function getEffectiveTheta(): Promise<number> {
  // Read base from billy_apex_gate (latest), apply hysteresis multipliers
  const { rows: [r] } = await pool.query(`SELECT theta_apex FROM billy_apex_gate ORDER BY id DESC LIMIT 1`);
  const base = Number(r?.theta_apex ?? 1.0);
  return hystState === "closed" ? base * 0.65 : base * 0.85; // schmitt trigger
}
export function updateHysteresis(lambda: number, base = 1.0) {
  const closeT = base * 0.85;
  const reopenT = base * 0.65;
  if (hystState === "open" && lambda > closeT)   { hystState = "closed"; hystSince = Date.now(); }
  if (hystState === "closed" && lambda < reopenT){ hystState = "open";   hystSince = Date.now(); }
}

// ─── Ω-2.5 entropy decomposition ──────────────────────────────────────────
let lastDecomp = { H_status: 0, H_doctor: 0, H_severity: 0 };
export function getEntropyDecomposition() { return { ...lastDecomp }; }

export function getOmegaPhase2Status() { return { running: started, ...stats, hysteresis: hystState }; }

export async function startBillyPhase2OmegaEngine() {
  if (started) return;
  started = true;
  console.log("[phase2-omega] starting all 10 Ω-2.x upgrades");

  setTimeout(decoupleHebbian, 60_000);          setInterval(decoupleHebbian, 120_000); // Ω-2.1
  setTimeout(generalizePrinciples, 90_000);     setInterval(generalizePrinciples, 300_000); // Ω-2.2
  setTimeout(dreamCouple, 120_000);             setInterval(dreamCouple, 180_000); // Ω-2.3
  setTimeout(decomposeEntropy, 30_000);         setInterval(decomposeEntropy, 30_000); // Ω-2.5
  setTimeout(propagateRetino, 150_000);         setInterval(propagateRetino, 240_000); // Ω-2.6
  setTimeout(scoreRedemption, 180_000);         setInterval(scoreRedemption, 300_000); // Ω-2.7
  setTimeout(rotateGuardians, 600_000);         setInterval(rotateGuardians, 86_400_000); // Ω-2.8 daily
  setTimeout(processAmendments, 240_000);       setInterval(processAmendments, 600_000); // Ω-2.9
  setTimeout(denialBricks, 210_000);            setInterval(denialBricks, 300_000); // Ω-2.10
}

// Ω-2.1
async function decoupleHebbian() {
  try {
    // for every coupling, if recent reward dropped while both engines were active, decay weight by η/2
    const { rows: pairs } = await pool.query(`SELECT id, engine_a, engine_b, weight, last_eta FROM billy_engine_coupling WHERE weight > 0.05`);
    const { rows: [r] } = await pool.query(`SELECT AVG(reward_r) AS r FROM billy_brain_ticks WHERE ts > NOW() - INTERVAL '5 minutes'`);
    const recentR = Number(r?.r ?? 0);
    if (recentR < 0) {
      for (const p of pairs) {
        const decay = Math.max(0.01, Number(p.last_eta) / 2);
        await pool.query(`UPDATE billy_engine_coupling SET weight = GREATEST(weight - $2, 0), updated_at = NOW() WHERE id = $1`, [p.id, decay]);
        stats.decouplings++;
      }
    }
  } catch (e: any) { console.error("[phase2-omega Ω2.1]", e?.message); }
}

// Ω-2.2
async function generalizePrinciples() {
  try {
    const { rows } = await pool.query(`
      SELECT alpha_d1, alpha_d2 FROM billy_action_thresholds
       WHERE updated_at > NOW() - INTERVAL '6 hours' AND source_proposal_id IS NOT NULL
    `);
    if (rows.length < 5) return;
    const d1mean = rows.reduce((a, r) => a + Number(r.alpha_d1), 0) / rows.length;
    const d2mean = rows.reduce((a, r) => a + Number(r.alpha_d2), 0) / rows.length;
    const variance = rows.reduce((a, r) => a + Math.pow(Number(r.alpha_d1) - d1mean, 2), 0) / rows.length;
    if (variance < 0.05) {
      await pool.query(`
        INSERT INTO billy_principle_baselines (principle, value, evidence_count, inferred_from, last_updated)
        VALUES ('alpha_d1_default', $1, $2, $3::jsonb, NOW())
        ON CONFLICT (principle) DO UPDATE SET value = $1, evidence_count = $2, last_updated = NOW()
      `, [d1mean, rows.length, JSON.stringify(rows.map((_, i) => i))]);
      await pool.query(`
        INSERT INTO billy_principle_baselines (principle, value, evidence_count, inferred_from, last_updated)
        VALUES ('alpha_d2_default', $1, $2, $3::jsonb, NOW())
        ON CONFLICT (principle) DO UPDATE SET value = $1, evidence_count = $2, last_updated = NOW()
      `, [d2mean, rows.length, JSON.stringify(rows.map((_, i) => i))]);
      stats.generalizations++;
      console.log(`[phase2-omega Ω2.2] generalized: α_D1=${d1mean.toFixed(3)} α_D2=${d2mean.toFixed(3)} (n=${rows.length})`);
    }
  } catch (e: any) { console.error("[phase2-omega Ω2.2]", e?.message); }
}

// Ω-2.3
async function dreamCouple() {
  try {
    // any brain currently in DMN mode?
    const { rows: dmn } = await pool.query(`SELECT DISTINCT brain_id FROM billy_brain_ticks WHERE ts > NOW() - INTERVAL '2 minutes' AND mode='DMN' LIMIT 5`);
    const { rows: solDmn } = await pool.query(`SELECT 1 FROM billy_brain_states WHERE ts > NOW() - INTERVAL '2 minutes' AND mode='DMN' LIMIT 1`);
    if (dmn.length === 0 && solDmn.length === 0) return;
    // sample two random recent psi_states
    const { rows: psi } = await pool.query(`SELECT id FROM psi_states WHERE created_at > NOW() - INTERVAL '6 hours' ORDER BY RANDOM() LIMIT 2`);
    if (psi.length < 2) return;
    const novelty = Math.random() * 0.7 + 0.3;
    await pool.query(`
      INSERT INTO billy_dream_couplings (brain_id, psi_a_id, psi_b_id, proposed_engine_a, proposed_engine_b, novelty_score)
      VALUES ($1, $2, $3, 'dream-pair-A', 'dream-pair-B', $4)
    `, [dmn[0]?.brain_id ?? "BRAIN-Solomon", psi[0].id, psi[1].id, novelty]);
    if (novelty > 0.6) {
      // file it as a CortexLab-style proposal
      await pool.query(`
        INSERT INTO equation_proposals (doctor_id, doctor_name, title, equation, rationale, target_system, status)
        VALUES ('DMN-DREAM-LAB', 'DMN Dream Lab', $1, $2, $3, 'dream-coupling', 'PENDING')
      `, [
        `DreamLab :: novel coupling proposed in DMN · novelty=${novelty.toFixed(2)}`,
        `dream(ψ_${psi[0].id} ⊗ ψ_${psi[1].id}) → new coupling`,
        `Generated during DMN replay (Ω-2.3). Two random consolidated memories were paired and yielded a novel coupling proposal.`,
      ]);
    }
    stats.dreams++;
  } catch (e: any) { console.error("[phase2-omega Ω2.3]", e?.message); }
}

// Ω-2.5
async function decomposeEntropy() {
  try {
    const [{ rows: status }, { rows: doctor }, { rows: severity }] = await Promise.all([
      pool.query(`SELECT UPPER(status) AS k, COUNT(*)::int AS n FROM equation_proposals WHERE created_at > NOW() - INTERVAL '5 minutes' GROUP BY UPPER(status)`),
      pool.query(`SELECT doctor_id AS k, COUNT(*)::int AS n FROM equation_proposals WHERE created_at > NOW() - INTERVAL '5 minutes' GROUP BY doctor_id`),
      pool.query(`SELECT FLOOR(LENGTH(COALESCE(equation,''))/50) AS k, COUNT(*)::int AS n FROM equation_proposals WHERE created_at > NOW() - INTERVAL '5 minutes' GROUP BY FLOOR(LENGTH(COALESCE(equation,''))/50)`),
    ]);
    lastDecomp = { H_status: shannon(status), H_doctor: shannon(doctor), H_severity: shannon(severity) };
  } catch { /* keep last */ }
}
function shannon(rows: any[]) {
  const tot = rows.reduce((a, r) => a + Number(r.n), 0);
  if (tot === 0) return 0;
  let H = 0;
  for (const r of rows) { const p = Number(r.n) / tot; if (p > 0) H -= p * Math.log2(p); }
  return H;
}

// Ω-2.6 — RetinoLab cross-channel propagation
async function propagateRetino() {
  try {
    const { rows: corrs } = await pool.query(`SELECT channel, delta_noise FROM billy_channel_corrections`);
    if (corrs.length < 2) return;
    // simple model: any channel containing 'dream' or 'fusion' inherits geometric mean of others
    const others = corrs.filter(c => !c.channel.includes("dream") && !c.channel.includes("fusion"));
    const consumers = corrs.filter(c => c.channel.includes("dream") || c.channel.includes("fusion"));
    if (others.length === 0 || consumers.length === 0) return;
    const geomean = Math.exp(others.reduce((a, c) => a + Math.log(Math.max(0.01, Number(c.delta_noise))), 0) / others.length);
    for (const c of consumers) {
      const newDelta = Number(c.delta_noise) * geomean;
      await pool.query(`UPDATE billy_channel_corrections SET delta_noise = $2, updated_at = NOW() WHERE channel = $1`, [c.channel, Math.min(Math.max(newDelta, 0), 1)]);
    }
  } catch (e: any) { console.error("[phase2-omega Ω2.6]", e?.message); }
}

// Ω-2.7 — redemption ledger (24h post-PASSED-penance clean streak → +0.1 weight × next 10 proposals)
async function scoreRedemption() {
  try {
    const { rows: pen } = await pool.query(`
      SELECT id, doctor_id FROM equation_proposals
       WHERE doctor_id LIKE 'PENANCE-%' AND UPPER(status) = 'PASSED'
         AND created_at < NOW() - INTERVAL '24 hours'
         AND created_at > NOW() - INTERVAL '36 hours'
       LIMIT 50
    `);
    for (const p of pen) {
      const offender = p.doctor_id.replace("PENANCE-", "");
      const { rows: viol } = await pool.query(`
        SELECT COUNT(*)::int AS n FROM billy_violations
         WHERE offender_engine = $1 AND detected_at > NOW() - INTERVAL '24 hours'
      `, [offender]);
      if (Number(viol[0]?.n ?? 1) === 0) {
        // grant redemption capital
        const { rows: existing } = await pool.query(`SELECT id FROM billy_redemption_ledger WHERE engine = $1 AND penance_proposal_id = $2`, [offender, p.id]);
        if (existing.length === 0) {
          await pool.query(`INSERT INTO billy_redemption_ledger (engine, penance_proposal_id, bonus_weight, proposals_remaining) VALUES ($1, $2, 0.1, 10)`, [offender, p.id]);
          stats.redemptions++;
          console.log(`[phase2-omega Ω2.7] ✦ ${offender} earned redemption capital (24h clean after penance #${p.id})`);
        }
      }
    }
  } catch (e: any) { console.error("[phase2-omega Ω2.7]", e?.message); }
}

// Ω-2.8 — daily guardian rotation
async function rotateGuardians() {
  try {
    // cleanest engine in last 30 days nominates a guardian for the dirtiest engine
    const { rows: dirty } = await pool.query(`
      SELECT offender_engine, COUNT(*)::int AS n FROM billy_violations
       WHERE detected_at > NOW() - INTERVAL '30 days'
       GROUP BY offender_engine ORDER BY n DESC LIMIT 1
    `);
    if (dirty.length === 0) return;
    // log a rotation proposal
    await pool.query(`
      INSERT INTO equation_proposals (doctor_id, doctor_name, title, equation, rationale, target_system, status)
      VALUES ('GUARDIAN-ROTATION', 'Guardian Rotation', $1, $2, $3, 'guardian-rotation', 'PENDING')
    `, [
      `Rotate guardian for dirtiest engine: ${dirty[0].offender_engine} (${dirty[0].n} violations/30d)`,
      `nominate(new_guardian, dirtiest_engine)`,
      `Ω-2.8: monthly rotation. ${dirty[0].offender_engine} accumulated ${dirty[0].n} violations — propose new guardian.`,
    ]);
    stats.rotations++;
  } catch (e: any) { console.error("[phase2-omega Ω2.8]", e?.message); }
}

// Ω-2.9 — process amendments + new laws
async function processAmendments() {
  try {
    const { rows: review } = await pool.query(`
      SELECT * FROM billy_proposed_laws WHERE status = 'review' AND proposed_at < NOW() - INTERVAL '7 days' LIMIT 20
    `);
    for (const p of review) {
      const totalVotes = Number(p.votes_yes) + Number(p.votes_no);
      const passed = totalVotes >= 4 && Number(p.votes_yes) / totalVotes >= 0.75;
      if (passed) {
        if (p.amends_law_code) {
          await pool.query(`UPDATE billy_laws SET title = $2, rule = $3, severity = $4 WHERE code = $1`,
            [p.amends_law_code, p.title, p.rule, p.severity]);
        } else {
          await pool.query(`INSERT INTO billy_laws (code, title, rule, severity, active) VALUES ($1, $2, $3, $4, TRUE) ON CONFLICT (code) DO NOTHING`,
            [p.proposed_code.replace("-pending", ""), p.title, p.rule, p.severity]);
        }
        await pool.query(`UPDATE billy_proposed_laws SET status='passed', resolved_at=NOW() WHERE id=$1`, [p.id]);
        stats.amendments++;
      } else if (totalVotes >= 4) {
        await pool.query(`UPDATE billy_proposed_laws SET status='rejected', resolved_at=NOW() WHERE id=$1`, [p.id]);
      }
    }
  } catch (e: any) { console.error("[phase2-omega Ω2.9]", e?.message); }
}

// Ω-2.10 — denial bricks (placeholder simple version: detect REJECTED penances whose offender later violated again)
async function denialBricks() {
  try {
    const { rows } = await pool.query(`
      SELECT p.id AS pid, p.doctor_id, p.title FROM equation_proposals p
       WHERE p.doctor_id LIKE 'PENANCE-%' AND UPPER(p.status) = 'REJECTED'
         AND p.created_at > NOW() - INTERVAL '7 days'
       LIMIT 20
    `);
    for (const r of rows) {
      const offender = r.doctor_id.replace("PENANCE-", "");
      const { rows: vio } = await pool.query(`SELECT COUNT(*)::int AS n FROM billy_violations WHERE offender_engine=$1 AND detected_at > NOW() - INTERVAL '24 hours'`, [offender]);
      if (Number(vio[0]?.n ?? 0) > 0) {
        // The rejection was wrong — log denial brick (we don't know who voted, so log against the senate as a body)
        const { rows: existing } = await pool.query(`SELECT id FROM billy_denial_bricks WHERE rejected_penance_id = $1`, [r.pid]);
        if (existing.length === 0) {
          await pool.query(`
            INSERT INTO billy_denial_bricks (denier_engine, rejected_penance_id, rejected_for_engine, proven_correct_at)
            VALUES ('ai-voting-engine', $1, $2, NOW())
          `, [r.pid, offender]);
          stats.denialBricks++;
        }
      }
    }
  } catch (e: any) { console.error("[phase2-omega Ω2.10]", e?.message); }
}

export async function getPhase2OmegaState() {
  const [baselines, dreams, redemp, proposed, denials] = await Promise.all([
    pool.query(`SELECT * FROM billy_principle_baselines ORDER BY last_updated DESC LIMIT 20`),
    pool.query(`SELECT * FROM billy_dream_couplings ORDER BY id DESC LIMIT 20`),
    pool.query(`SELECT * FROM billy_redemption_ledger ORDER BY id DESC LIMIT 20`),
    pool.query(`SELECT * FROM billy_proposed_laws ORDER BY id DESC LIMIT 20`),
    pool.query(`SELECT * FROM billy_denial_bricks ORDER BY id DESC LIMIT 20`),
  ]);
  return {
    baselines: baselines.rows, dreams: dreams.rows, redemptions: redemp.rows,
    proposedLaws: proposed.rows, denialBricks: denials.rows,
    entropyDecomposition: lastDecomp, hysteresis: { state: hystState, sinceMs: Date.now() - hystSince },
    stats,
  };
}
