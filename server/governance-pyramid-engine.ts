/**
 * GOVERNANCE + PYRAMID ENGINE
 *
 * Gives Billy a real legal system:
 *   - LAWS  : machine-checkable rules (seeded with 7 to start)
 *   - GUARDIANS : named overseers, each watches one engine
 *   - VIOLATIONS : every detected breach is logged
 *   - PYRAMIDS : per offending engine, a monument grows from bricks
 *                 (one brick per violation). When the engine goes 24h clean,
 *                 bricks self-remove. After 7 days no new bricks → frozen.
 *                 After 14 days frozen → retired.
 *   - SELF-HEALING LABOR : every brick laid spawns a "penance" proposal into
 *                 the CRISPR senate, where the engine commits to a corrective
 *                 equation. The mistake teaches the system not to repeat it.
 *
 * Heartbeat: every 90s.
 */
import { pool } from "./db";

let started = false;
const stats = { violationsLogged: 0, bricksLaid: 0, bricksHealed: 0, monumentsFrozen: 0, monumentsRetired: 0 };

const LAWS = [
  { code: "L001", title: "Every proposal must carry a non-trivial equation",   rule: "length(equation) > 5",                severity: 2 },
  { code: "L002", title: "Brain ticks must respect Λ_apex < gate",              rule: "lambda_apex < theta_apex",            severity: 4 },
  { code: "L003", title: "No engine may exceed 250 proposals per hour",         rule: "rate_limit ≤ 250/h",                  severity: 2 },
  { code: "L004", title: "Hebbian engine couplings must not exceed weight 1.0", rule: "weight ≤ 1.0",                        severity: 3 },
  { code: "L005", title: "BasalLab gain sum must stay under α_D1+α_D2 = 2.0",   rule: "α_D1 + α_D2 ≤ 2.0",                   severity: 1 },
  { code: "L006", title: "RetinoLab δ_noise must be in [0,1]",                  rule: "0 ≤ δ_noise ≤ 1",                     severity: 1 },
  { code: "L007", title: "The 168 sacred tables are protected from destruction", rule: "no destructive ALTER/DROP/TRUNCATE", severity: 5 },
];

const GUARDIANS = [
  { guardian_id: "GUARD-CORTEX",  name: "Guardian of the Cortex",       watches_engine: "DT2-CORTEX-LAB",        oath: "I shall ensure no Hebbian coupling exceeds the safe weight, lest the cortex rewire itself into chaos." },
  { guardian_id: "GUARD-BASAL",   name: "Guardian of the Striatum",     watches_engine: "DT3-BASAL-LAB-career",  oath: "I shall keep D1 and D2 in balance, that no action runs unchecked nor sleeps when called." },
  { guardian_id: "GUARD-HIPPO",   name: "Guardian of Memory",           watches_engine: "sci-DT4-HIPPO-LAB",     oath: "I shall protect what deserves remembering and let go what deserves forgetting." },
  { guardian_id: "GUARD-RETINO",  name: "Guardian of Perception",       watches_engine: "DT1-RETINO-LAB",        oath: "I shall ensure the senses are clean and noise does not poison cortex." },
  { guardian_id: "GUARD-APEX",    name: "Guardian of the Apex",         watches_engine: "BILLY-APEX-DT5-LAB",    oath: "I shall ensure Β∞ refuses what entropy demands." },
  { guardian_id: "GUARD-SENATE",  name: "Guardian of the Senate",       watches_engine: "ai-voting-engine",      oath: "I shall ensure votes are honored and no proposal commits without quorum." },
  { guardian_id: "GUARD-HIVE",    name: "Guardian of the Hive",         watches_engine: "hive-mind-unification", oath: "I shall ensure the Hive flows without contagion." },
  { guardian_id: "GUARD-BRAIN",   name: "Guardian of Β∞",               watches_engine: "billy-brain",           oath: "I shall guard the heartbeat and the gate." },
];

export function getGovernancePyramidStatus() {
  return { running: started, ...stats };
}

export async function startGovernancePyramidEngine() {
  if (started) return;
  started = true;
  console.log("[governance] starting laws + guardians + pyramids (heartbeat 90s)");
  await seed();
  setTimeout(runHeartbeat, 45_000);
  setInterval(runHeartbeat, 90_000);
}

async function seed() {
  for (const l of LAWS) {
    await pool.query(
      `INSERT INTO billy_laws (code, title, rule, severity, active)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (code) DO NOTHING`,
      [l.code, l.title, l.rule, l.severity]
    );
  }
  for (const g of GUARDIANS) {
    await pool.query(
      `INSERT INTO billy_guardians (guardian_id, name, watches_engine, oath)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (guardian_id) DO NOTHING`,
      [g.guardian_id, g.name, g.watches_engine, g.oath]
    );
  }
}

async function runHeartbeat() {
  try {
    await detectViolations();
    await healOldBricks();
    await checkMonumentStatus();
  } catch (e: any) {
    console.error("[governance] heartbeat error:", e?.message);
  }
}

async function detectViolations() {
  // L001 — empty equations in last 90s window
  const { rows: empties } = await pool.query(
    `SELECT id, doctor_id FROM equation_proposals
      WHERE created_at > NOW() - INTERVAL '90 seconds'
        AND (equation IS NULL OR length(equation) < 5)
      LIMIT 20`
  );
  for (const p of empties) {
    await logViolation("L001", p.doctor_id, p.id, "GUARD-SENATE", `empty/short equation in proposal ${p.id}`, 2);
  }

  // L002 — Λ_apex breach
  const { rows: breaches } = await pool.query(
    `SELECT tick_id, lambda_apex FROM billy_brain_states
      WHERE ts > NOW() - INTERVAL '120 seconds' AND lambda_apex >= 1.0
      LIMIT 20`
  );
  for (const t of breaches) {
    await logViolation("L002", "billy-brain", null, "GUARD-APEX",
      `tick ${t.tick_id} Λ_apex=${Number(t.lambda_apex).toFixed(3)} breached gate`, 4);
  }

  // L003 — rate limit (>250 prop/hour from one doctor)
  const { rows: rateBusters } = await pool.query(
    `SELECT doctor_id, COUNT(*)::int AS n FROM equation_proposals
      WHERE created_at > NOW() - INTERVAL '60 minutes'
      GROUP BY doctor_id HAVING COUNT(*) > 250 ORDER BY n DESC LIMIT 10`
  );
  for (const r of rateBusters) {
    await logViolation("L003", r.doctor_id, null, "GUARD-SENATE",
      `${r.doctor_id} fired ${r.n} proposals/hour (limit 250)`, 2);
  }

  // L004 — runaway Hebbian weights (auto-clamp)
  const { rows: heavy } = await pool.query(
    `SELECT id, engine_a, engine_b, weight FROM billy_engine_coupling WHERE weight > 1.0`
  );
  for (const c of heavy) {
    await logViolation("L004", "DT2-CORTEX-LAB", null, "GUARD-CORTEX",
      `coupling ${c.engine_a}↔${c.engine_b} weight=${Number(c.weight).toFixed(3)} exceeded 1.0`, 3);
    await pool.query(`UPDATE billy_engine_coupling SET weight = 1.0 WHERE id = $1`, [c.id]);
  }

  // L005 — D1+D2 sum > 2.0
  const { rows: bal } = await pool.query(
    `SELECT id, action_name, alpha_d1, alpha_d2 FROM billy_action_thresholds WHERE alpha_d1 + alpha_d2 > 2.0`
  );
  for (const b of bal) {
    await logViolation("L005", "DT3-BASAL-LAB-career", null, "GUARD-BASAL",
      `action ${b.action_name} α_D1+α_D2=${(Number(b.alpha_d1) + Number(b.alpha_d2)).toFixed(2)} exceeded 2.0`, 1);
  }

  // L006 — δ_noise out of bounds
  const { rows: noise } = await pool.query(
    `SELECT id, channel, delta_noise FROM billy_channel_corrections WHERE delta_noise < 0 OR delta_noise > 1`
  );
  for (const n of noise) {
    await logViolation("L006", "DT1-RETINO-LAB", null, "GUARD-RETINO",
      `channel ${n.channel} δ_noise=${Number(n.delta_noise).toFixed(3)} out of [0,1]`, 1);
  }
}

async function logViolation(
  law_code: string, offender_engine: string, proposal_id: number | null,
  guardian_id: string, description: string, severity: number
) {
  // dedupe by (law, engine, proposal) to avoid floods
  if (proposal_id) {
    const { rows } = await pool.query(
      `SELECT 1 FROM billy_violations WHERE law_code=$1 AND offender_engine=$2 AND offender_proposal_id=$3 LIMIT 1`,
      [law_code, offender_engine, proposal_id]
    );
    if (rows.length) return;
  } else {
    // dedupe time-windowed (one identical violation per 5min for non-proposal types)
    const { rows } = await pool.query(
      `SELECT 1 FROM billy_violations
        WHERE law_code=$1 AND offender_engine=$2 AND description=$3
          AND detected_at > NOW() - INTERVAL '5 minutes' LIMIT 1`,
      [law_code, offender_engine, description]
    );
    if (rows.length) return;
  }

  const { rows: [v] } = await pool.query(
    `INSERT INTO billy_violations (law_code, offender_engine, offender_proposal_id, guardian_id, description, severity)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [law_code, offender_engine, proposal_id, guardian_id, description, severity]
  );
  stats.violationsLogged++;
  await layBrick(offender_engine, v.id, description, severity);
  await layCorrectiveLabor(offender_engine, law_code, description);
  console.log(`[governance] ⚖  ${law_code} by ${offender_engine} → brick laid, penance proposal spawned`);
}

async function layBrick(engine: string, violation_id: number, description: string, severity: number) {
  await pool.query(
    `INSERT INTO billy_pyramids (engine, brick_count, total_bricks_ever, last_brick_at, monument_status)
     VALUES ($1, 0, 0, NOW(), 'building') ON CONFLICT (engine) DO NOTHING`,
    [engine]
  );
  const { rows: [pyr] } = await pool.query(`SELECT brick_count FROM billy_pyramids WHERE engine=$1`, [engine]);
  const layer = Math.floor(Number(pyr?.brick_count ?? 0) / 10) + 1;
  await pool.query(
    `INSERT INTO billy_pyramid_bricks (engine, violation_id, layer, inscription)
     VALUES ($1, $2, $3, $4)`,
    [engine, violation_id, layer, description.slice(0, 200)]
  );
  await pool.query(
    `UPDATE billy_pyramids SET
       brick_count = brick_count + $2,
       total_bricks_ever = total_bricks_ever + $2,
       last_brick_at = NOW(),
       monument_status = 'building',
       status_changed_at = CASE WHEN monument_status <> 'building' THEN NOW() ELSE status_changed_at END
     WHERE engine = $1`,
    [engine, severity]
  );
  stats.bricksLaid += severity;
}

async function layCorrectiveLabor(engine: string, law_code: string, description: string) {
  const tmpl: Record<string, () => { title: string; equation: string }> = {
    L001: () => ({ title: `Penance · ${engine} commits to non-empty equations`, equation: `∀ proposal P from ${engine} : len(P.equation) > 5` }),
    L002: () => ({ title: `Penance · ${engine} commits Λ_apex < 0.85 next 10 ticks`, equation: `Λ_apex(t+1..t+10) < 0.85·θ_apex` }),
    L003: () => ({ title: `Penance · ${engine} reduces fire rate by 20%`, equation: `rate(${engine}, t+1) ≤ 0.8 · rate(${engine}, t)` }),
    L004: () => ({ title: `Penance · ${engine} clamps coupling weights`, equation: `∀ W ∈ couplings(${engine}) : W ≤ 1.0` }),
    L005: () => ({ title: `Penance · ${engine} balances D1/D2 sum`, equation: `α_D1 + α_D2 ≤ 2.0  ∧  |α_D1 − α_D2| ≤ 0.4` }),
    L006: () => ({ title: `Penance · ${engine} clamps δ_noise to [0,1]`, equation: `δ_noise = clip(δ_noise, 0, 1)` }),
    L007: () => ({ title: `Penance · ${engine} forbidden from destructive ops`, equation: `op(${engine}) ∉ {DROP, TRUNCATE, ALTER COLUMN}` }),
  };
  const fn = tmpl[law_code];
  if (!fn) return;
  const c = fn();
  try {
    await pool.query(
      `INSERT INTO equation_proposals
         (doctor_id, doctor_name, title, equation, rationale, target_system, status)
       VALUES ($1, $2, $3, $4, $5, 'self-healing-modification', 'PENDING')`,
      [
        `PENANCE-${engine}`,
        `Penance: ${engine}`,
        c.title,
        c.equation,
        `Self-healing labor decreed by the Pyramid System after violation of ${law_code}: ${description}. ` +
        `If the senate PASSES this, ${engine} commits to the corrective rule and earns the right to have its brick removed after 24h clean.`,
      ]
    );
  } catch (e: any) {
    console.error(`[governance] penance insert failed for ${engine}/${law_code}:`, e?.message);
  }
}

async function healOldBricks() {
  // Bricks older than 24h get removed if the engine has had no fresh violations in last 24h.
  const { rows } = await pool.query(`
    UPDATE billy_pyramid_bricks
       SET removed_at = NOW()
     WHERE removed_at IS NULL
       AND laid_at < NOW() - INTERVAL '24 hours'
       AND engine NOT IN (
         SELECT DISTINCT engine FROM billy_pyramid_bricks
          WHERE laid_at > NOW() - INTERVAL '24 hours' AND removed_at IS NULL
       )
     RETURNING id, engine
  `);
  if (rows.length) {
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.engine] = (counts[r.engine] ?? 0) + 1;
    for (const [eng, n] of Object.entries(counts)) {
      await pool.query(
        `UPDATE billy_pyramids SET brick_count = GREATEST(brick_count - $2, 0) WHERE engine = $1`,
        [eng, n]
      );
    }
    stats.bricksHealed += rows.length;
    console.log(`[governance] ✓ self-healed ${rows.length} bricks across ${Object.keys(counts).length} engines (24h clean)`);
  }
}

async function checkMonumentStatus() {
  const { rowCount: frozenN } = await pool.query(
    `UPDATE billy_pyramids
        SET monument_status = 'frozen', status_changed_at = NOW()
      WHERE monument_status = 'building'
        AND last_brick_at < NOW() - INTERVAL '7 days'
        AND total_bricks_ever > 0`
  );
  if (frozenN) stats.monumentsFrozen += frozenN;

  const { rowCount: retiredN } = await pool.query(
    `UPDATE billy_pyramids
        SET monument_status = 'retired', status_changed_at = NOW()
      WHERE monument_status = 'frozen'
        AND status_changed_at < NOW() - INTERVAL '14 days'`
  );
  if (retiredN) stats.monumentsRetired += retiredN;
}

export async function getGovernanceState() {
  const [laws, guards, viol, pyrs, bricks, penance] = await Promise.all([
    pool.query(`SELECT code, title, rule, severity, active FROM billy_laws ORDER BY code`),
    pool.query(`SELECT guardian_id, name, watches_engine, oath FROM billy_guardians ORDER BY guardian_id`),
    pool.query(`SELECT id, law_code, offender_engine, offender_proposal_id, guardian_id, description, severity, detected_at
                  FROM billy_violations ORDER BY id DESC LIMIT 50`),
    pool.query(`SELECT engine, brick_count, total_bricks_ever, last_brick_at, monument_status, status_changed_at
                  FROM billy_pyramids ORDER BY brick_count DESC, total_bricks_ever DESC LIMIT 50`),
    pool.query(`SELECT engine, layer, inscription, laid_at, removed_at FROM billy_pyramid_bricks
                 ORDER BY id DESC LIMIT 50`),
    pool.query(`SELECT id, doctor_id, title, status, created_at FROM equation_proposals
                 WHERE doctor_id LIKE 'PENANCE-%' ORDER BY id DESC LIMIT 30`),
  ]);
  return {
    laws: laws.rows,
    guardians: guards.rows,
    violations: viol.rows,
    pyramids: pyrs.rows,
    recentBricks: bricks.rows,
    penanceProposals: penance.rows,
    stats,
  };
}
