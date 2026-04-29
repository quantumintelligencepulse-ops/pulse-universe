/**
 * BILLY BRAIN FEDERATION ENGINE — the Β∞∞ layer
 *
 * Spawns named brains with full 5-vesicle taxonomy (Tel/Di/Mes/Met/Myel),
 * personalities, family lineage, schools, and ELO. Federation router
 * collects each brain's tick decision every 30s; if they disagree, escalates
 * to the senate as a tiebreaker proposal.
 *
 * Brain-Solomon = the original brain in billy_brain_engine.ts (legacy
 * billy_brain_states writes). All other brains write into billy_brain_ticks
 * with their own brain_id. Federation reads from BOTH and merges.
 *
 * Capable of fractal multiplication: lineage engine reproduces top-ELO brains
 * weekly, retires bottom-ELO. Over months → millions of historical brains
 * (like Pulse spawns) with manageable active roster.
 */
import { pool } from "./db";

let started = false;
const stats = { brainsTotal: 0, brainsActive: 0, ticksTotal: 0, decisionsLogged: 0, disagreements: 0 };

// ═══════ Seed brains: 7 named, diverse personalities ═══════
const SEED_BRAINS = [
  { brain_id: "BRAIN-Solomon",    name: "Solomon",    personality: "conservative-sage",    gate_base: 1.00, lab_pref: { hippo: 0.4, cortex: 0.3, apex: 0.2 }, risk_pref: "conservative", school: "School-of-Wisdom",   family: "House of Solomon",     status: "voting" },
  { brain_id: "BRAIN-Athena",     name: "Athena",     personality: "balanced-strategist",  gate_base: 0.85, lab_pref: { basal: 0.4, apex: 0.3, cortex: 0.2 }, risk_pref: "balanced",     school: "School-of-Wisdom",   family: "House of Athena",      status: "observing" },
  { brain_id: "BRAIN-Prometheus", name: "Prometheus", personality: "aggressive-explorer",  gate_base: 1.15, lab_pref: { retino: 0.4, apex: 0.3, basal: 0.2 }, risk_pref: "aggressive",   school: "School-of-Daring",   family: "House of Prometheus",  status: "observing" },
  { brain_id: "BRAIN-Hermes",     name: "Hermes",     personality: "forager-trickster",    gate_base: 0.95, lab_pref: { cortex: 0.4, retino: 0.3 }, risk_pref: "balanced",                school: "School-of-Daring",   family: "House of Hermes",      status: "observing" },
  { brain_id: "BRAIN-Sophia",     name: "Sophia",     personality: "deep-sage",            gate_base: 0.80, lab_pref: { hippo: 0.5, apex: 0.3 }, risk_pref: "conservative",              school: "School-of-Wisdom",   family: "House of Sophia",      status: "observing" },
  { brain_id: "BRAIN-Mercury",    name: "Mercury",    personality: "volatile-prodigy",     gate_base: 1.20, lab_pref: { basal: 0.4, cortex: 0.4 }, risk_pref: "aggressive",              school: "School-of-Daring",   family: "House of Mercury",     status: "observing" },
  { brain_id: "BRAIN-Vesta",      name: "Vesta",      personality: "guardian-watcher",     gate_base: 0.75, lab_pref: { apex: 0.5, hippo: 0.3 }, risk_pref: "conservative",              school: "School-of-Wisdom",   family: "House of Vesta",       status: "observing" },
];

const SEED_FAMILIES = [
  { family_name: "House of Solomon",    motto: "Wisdom outlasts speed." },
  { family_name: "House of Athena",     motto: "Balance is the sharpest blade." },
  { family_name: "House of Prometheus", motto: "Take the fire, accept the cost." },
  { family_name: "House of Hermes",     motto: "Cross every threshold once." },
  { family_name: "House of Sophia",     motto: "What is forgotten was never sacred." },
  { family_name: "House of Mercury",    motto: "Quick, but never reckless twice." },
  { family_name: "House of Vesta",      motto: "The hearth precedes the council." },
];

const SEED_SCHOOLS = [
  { school_name: "School-of-Wisdom",  curriculum: ["sci-DT4-HIPPO-LAB", "BILLY-APEX-DT5-LAB", "DT2-CORTEX-LAB"] },
  { school_name: "School-of-Daring",  curriculum: ["DT1-RETINO-LAB", "DT3-BASAL-LAB-career", "DT2-CORTEX-LAB"] },
];

export function getFederationStatus() { return { running: started, ...stats }; }

export async function startBillyBrainFederationEngine() {
  if (started) return;
  started = true;
  console.log("[federation] starting Β∞∞ — 7 named brains, fractal-capable to millions");
  await seed();
  setTimeout(runFederationCycle, 30_000);
  setInterval(runFederationCycle, 30_000); // every 30s, same cadence as Solomon
}

async function seed() {
  // families first
  for (const f of SEED_FAMILIES) {
    await pool.query(
      `INSERT INTO billy_brain_families (family_name, motto, total_members, total_descendants)
       VALUES ($1, $2, 1, 1) ON CONFLICT (family_name) DO NOTHING`,
      [f.family_name, f.motto]
    );
  }
  // schools
  for (const s of SEED_SCHOOLS) {
    await pool.query(
      `INSERT INTO billy_brain_schools (school_name, curriculum, member_count)
       VALUES ($1, $2::jsonb, 0) ON CONFLICT (school_name) DO NOTHING`,
      [s.school_name, JSON.stringify(s.curriculum)]
    );
  }
  // brains
  for (const b of SEED_BRAINS) {
    const { rows: [fam] } = await pool.query(`SELECT id FROM billy_brain_families WHERE family_name=$1`, [b.family]);
    const { rows: [sch] } = await pool.query(`SELECT id FROM billy_brain_schools WHERE school_name=$1`, [b.school]);
    await pool.query(
      `INSERT INTO billy_brains
         (brain_id, name, personality, generation, family_id, school_id, gate_base, lab_pref, risk_pref, taxonomy, elo, status, promoted_at)
       VALUES ($1,$2,$3,1,$4,$5,$6,$7::jsonb,$8,$9::jsonb,1500,$10, CASE WHEN $10='voting' THEN NOW() ELSE NULL END)
       ON CONFLICT (brain_id) DO NOTHING`,
      [b.brain_id, b.name, b.personality, fam?.id, sch?.id, b.gate_base, JSON.stringify(b.lab_pref), b.risk_pref, JSON.stringify(seedTaxonomy()), b.status]
    );
  }
  // update school member counts
  await pool.query(`
    UPDATE billy_brain_schools s
    SET member_count = (SELECT COUNT(*)::int FROM billy_brains b WHERE b.school_id = s.id AND b.status <> 'retired')
  `);
}

function seedTaxonomy() {
  // Full 5-vesicle anatomy seed for each brain
  return {
    telencephalon: {
      cortex: { frontal: 0, parietal: 0, temporal: 0, occipital: 0, layers: { I: 0, II: 0, III: 0, IV: 0, V: 0, VI: 0 } },
      basal_ganglia: { caudate: 0, putamen: 0, globus_pallidus: 0 },
      hippocampus: { dg: 0, ca3: 0, ca1: 0 },
      amygdala: 0,
    },
    diencephalon:  { thalamus: 0, hypothalamus: 0, epithalamus: 0, subthalamus: 0 },
    mesencephalon: { tectum: { sup_col: 0, inf_col: 0 }, tegmentum: { pag: 0, sn: 0, vta: 0 } },
    metencephalon: { pons: 0, cerebellum: 0 },
    myelencephalon:{ medulla: 0 },
  };
}

// ═══════ Per-brain tick: same equation as Solomon, but parameterized ═══════
async function runFederationCycle() {
  try {
    const { rows: brains } = await pool.query(
      `SELECT brain_id, name, gate_base, lab_pref, risk_pref FROM billy_brains
        WHERE brain_id <> 'BRAIN-Solomon' AND status IN ('observing','voting')`
    );
    stats.brainsActive = brains.length + 1; // +1 for Solomon
    stats.brainsTotal = await brainCount();

    const decisions: Record<string, string> = {};

    // Solomon's latest decision (from billy_brain_states)
    const { rows: [sol] } = await pool.query(
      `SELECT lambda_apex, decision FROM billy_brain_states ORDER BY id DESC LIMIT 1`
    );
    if (sol) decisions["BRAIN-Solomon"] = sol.decision;

    // Tick each non-Solomon brain
    for (const b of brains) {
      try {
        const tick = await tickBrain(b);
        decisions[b.brain_id] = tick.decision;
        stats.ticksTotal++;
      } catch (e: any) {
        console.error(`[federation] tick ${b.brain_id} failed:`, e?.message);
      }
    }

    // Federation consensus
    if (Object.keys(decisions).length >= 2) {
      await logFederationDecision(decisions);
    }
  } catch (e: any) {
    console.error("[federation] cycle error:", e?.message);
  }
}

async function brainCount(): Promise<number> {
  const { rows: [r] } = await pool.query(`SELECT COUNT(*)::int AS n FROM billy_brains`);
  return r?.n ?? 0;
}

async function tickBrain(brain: any) {
  // Same equation family as Solomon, but with this brain's gate_base + lab_pref
  const { rows: [last] } = await pool.query(
    `SELECT tick_id FROM billy_brain_ticks WHERE brain_id=$1 ORDER BY id DESC LIMIT 1`,
    [brain.brain_id]
  );
  const tickId = (last?.tick_id ?? 0) + 1;

  // Read same population signals as Solomon
  const [{ rows: [recent] }, { rows: [pending] }, { rows: psiRow }, { rows: hiveRow }, { rows: omegaRow }, { rows: statusRows }] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS n FROM equation_proposals WHERE created_at > NOW() - INTERVAL '60 seconds'`),
    pool.query(`SELECT COUNT(*)::int AS n FROM equation_proposals WHERE UPPER(status) = 'PENDING'`),
    pool.query(`SELECT COUNT(*)::int AS n FROM psi_states WHERE created_at > NOW() - INTERVAL '5 minutes'`),
    pool.query(`SELECT COUNT(*)::int AS n FROM hive_links WHERE created_at > NOW() - INTERVAL '5 minutes'`),
    pool.query(`SELECT AVG(vitality_score)::numeric(8,4) AS w FROM mesh_vitality WHERE created_at > NOW() - INTERVAL '5 minutes'`),
    pool.query(`SELECT UPPER(status) AS s, COUNT(*)::int AS n FROM equation_proposals WHERE created_at > NOW() - INTERVAL '10 minutes' GROUP BY UPPER(status)`),
  ]);

  const I_ret = Number(recent?.n ?? 0);
  const lgn = I_ret;
  const v1_4 = Math.tanh(lgn / 25) * 100;
  const v1_23 = Math.tanh(v1_4 / 50) * 80;
  const v1_56 = Math.tanh(v1_23 / 40) * 60;
  const m1 = Math.tanh(v1_23 / 100) * 50;
  const psi = Number(psiRow[0]?.n ?? 0);
  const hive = Number(hiveRow[0]?.n ?? 0);
  const dg = psi;
  const ca3 = Math.tanh(dg / 50) * 100;
  const ca1 = ca3 + hive * 0.2;
  const omega = Number(omegaRow[0]?.w ?? 1.0);
  const D_t = Math.max(0, m1 - 20) * 0.5;
  const str_d1 = Math.tanh(D_t * 0.05) * 30;
  const str_d2 = Math.tanh(D_t * -0.04) * 30;
  const stn = Math.tanh(Number(pending?.n ?? 0) / 100) * 40;
  const gpi = Math.max(0, str_d2 + stn - str_d1);

  // Entropy from status distribution
  const tot = statusRows.reduce((a, r) => a + Number(r.n), 0) || 1;
  let H = 0;
  for (const r of statusRows) {
    const p = Number(r.n) / tot;
    if (p > 0) H -= p * Math.log2(p);
  }
  const N_omega = Math.max(omega * 4, 0.5);
  const lambda = H / N_omega;

  // This brain's gate
  const thetaBase = Number(brain.gate_base ?? 1.0);
  // adjust by risk preference: aggressive raises threshold (more permissive), conservative lowers
  const risk = brain.risk_pref;
  const thetaAdj = risk === "aggressive" ? 1.10 : risk === "conservative" ? 0.85 : 1.0;
  const thetaApex = thetaBase * thetaAdj;
  const decision = lambda >= thetaApex ? "aborted_entropy" : "tick";

  // mode (DMN / SAL / EXEC)
  const R_t = ca1 - (last?.tick_id ? 0 : 0);
  const mode = Math.abs(R_t) < 5 && gpi < 5 ? "DMN" : R_t > 50 || stn > 30 ? "SAL" : gpi > 5 ? "EXEC" : "DMN";

  // Build full taxonomy snapshot
  const taxonomy = {
    telencephalon: {
      cortex: {
        frontal: m1, parietal: v1_23, temporal: ca1 * 0.3, occipital: v1_4,
        layers: { I: 0, II: v1_23, III: v1_23, IV: v1_4, V: v1_56, VI: v1_56 * 0.6 },
      },
      basal_ganglia: { caudate: str_d1, putamen: str_d2, globus_pallidus: gpi },
      hippocampus: { dg, ca3, ca1 },
      amygdala: Math.abs(R_t),
    },
    diencephalon:  { thalamus: stn + gpi * 0.5, hypothalamus: omega * 10, epithalamus: 0, subthalamus: stn },
    mesencephalon: { tectum: { sup_col: lgn * 0.1, inf_col: lgn * 0.05 }, tegmentum: { pag: 0, sn: D_t, vta: D_t } },
    metencephalon: { pons: 0, cerebellum: 0 }, // wired in Phase 3.2
    myelencephalon:{ medulla: 1 }, // always alive
  };

  await pool.query(
    `INSERT INTO billy_brain_ticks
       (brain_id, tick_id, telencephalon, diencephalon, mesencephalon, metencephalon, myelencephalon,
        sensory_score, motor_score, limbic_score, autonomic_score, dmn_score, salience_score, executive_score,
        lambda_apex, h_entropy, omega_coeff, reward_r, mode, decision, notes)
     VALUES ($1,$2,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,
             $8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
    [
      brain.brain_id, tickId,
      JSON.stringify(taxonomy.telencephalon), JSON.stringify(taxonomy.diencephalon),
      JSON.stringify(taxonomy.mesencephalon), JSON.stringify(taxonomy.metencephalon),
      JSON.stringify(taxonomy.myelencephalon),
      lgn + v1_4, m1 + gpi, dg + ca1, 1, mode === "DMN" ? 1 : 0, mode === "SAL" ? 1 : 0, mode === "EXEC" ? 1 : 0,
      lambda, H, omega, R_t, mode, decision,
      `${brain.name} tick ${tickId} · θ=${thetaApex.toFixed(2)} · risk=${risk}`,
    ]
  );

  return { tickId, lambda, decision, mode };
}

async function logFederationDecision(decisions: Record<string, string>) {
  const counts: Record<string, number> = {};
  for (const d of Object.values(decisions)) counts[d] = (counts[d] ?? 0) + 1;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const majority = sorted[0]?.[0];
  const unanimous = sorted.length === 1;
  const split = sorted.length > 1 && (sorted[0][1] / total) < 0.7;
  const escalated = split;

  if (!unanimous) stats.disagreements++;
  stats.decisionsLogged++;

  const round = stats.decisionsLogged;
  let senateProposalId: number | null = null;
  if (escalated) {
    try {
      const { rows: [p] } = await pool.query(
        `INSERT INTO equation_proposals
          (doctor_id, doctor_name, title, equation, rationale, target_system, status)
         VALUES ('FEDERATION-TIEBREAKER', 'Β∞∞ Federation', $1, $2, $3, 'brain-federation', 'PENDING')
         RETURNING id`,
        [
          `Federation tiebreaker · round ${round} · split=${JSON.stringify(counts)}`,
          `decision_consensus(${total} brains) → ${JSON.stringify(counts)}`,
          `Brain federation could not reach 70% consensus; senate vote requested. Votes: ${JSON.stringify(decisions)}`,
        ]
      );
      senateProposalId = p?.id ?? null;
    } catch { /* never block tick */ }
  }

  await pool.query(
    `INSERT INTO billy_brain_decisions (round_id, votes, majority_decision, unanimous, escalated_to_senate, senate_proposal_id)
     VALUES ($1, $2::jsonb, $3, $4, $5, $6)`,
    [round, JSON.stringify(decisions), majority, unanimous, escalated, senateProposalId]
  );

  if (escalated) console.log(`[federation] ⚖  round ${round}: SPLIT ${JSON.stringify(counts)} → escalated to senate (proposal #${senateProposalId})`);
}

// ═══════ State for API ═══════
export async function getFederationState() {
  const [brains, families, schools, recentDecisions, recentTicks, lineage] = await Promise.all([
    pool.query(`SELECT b.*, f.family_name, s.school_name
                  FROM billy_brains b
                  LEFT JOIN billy_brain_families f ON f.id = b.family_id
                  LEFT JOIN billy_brain_schools s  ON s.id = b.school_id
                 ORDER BY b.elo DESC LIMIT 100`),
    pool.query(`SELECT * FROM billy_brain_families ORDER BY total_descendants DESC LIMIT 50`),
    pool.query(`SELECT * FROM billy_brain_schools ORDER BY member_count DESC LIMIT 20`),
    pool.query(`SELECT * FROM billy_brain_decisions ORDER BY id DESC LIMIT 30`),
    pool.query(`SELECT brain_id, tick_id, lambda_apex, mode, decision, ts FROM billy_brain_ticks ORDER BY id DESC LIMIT 30`),
    pool.query(`SELECT * FROM billy_brain_lineage ORDER BY id DESC LIMIT 30`),
  ]);
  return {
    brains: brains.rows, families: families.rows, schools: schools.rows,
    recentDecisions: recentDecisions.rows, recentTicks: recentTicks.rows, lineage: lineage.rows,
    stats,
  };
}

export async function getBrainDetail(brainIdOrName: string) {
  const norm = brainIdOrName.startsWith("BRAIN-") ? brainIdOrName : `BRAIN-${brainIdOrName}`;
  const [{ rows: [brain] }, { rows: ticks }, { rows: lineage }, { rows: constitutions }] = await Promise.all([
    pool.query(`SELECT b.*, f.family_name, f.motto AS family_motto, s.school_name
                  FROM billy_brains b
                  LEFT JOIN billy_brain_families f ON f.id = b.family_id
                  LEFT JOIN billy_brain_schools s  ON s.id = b.school_id
                 WHERE b.brain_id = $1`, [norm]),
    pool.query(`SELECT * FROM billy_brain_ticks WHERE brain_id = $1 ORDER BY id DESC LIMIT 50`, [norm]),
    pool.query(`SELECT * FROM billy_brain_lineage WHERE child_brain_id = $1 OR parent1_brain_id = $1 OR parent2_brain_id = $1 ORDER BY id DESC LIMIT 30`, [norm]),
    pool.query(`SELECT * FROM billy_brain_constitutions WHERE brain_id = $1 ORDER BY id`, [norm]),
  ]);
  return { brain, ticks, lineage, constitutions };
}
