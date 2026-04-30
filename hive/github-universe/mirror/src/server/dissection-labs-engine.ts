/**
 * DISSECTION LABS ENGINE — DT-1..DT-5
 *
 * Five named cortical-interface labs. Each runs on its own cadence and posts
 * one real equation_proposal per cycle into its dedicated namespace, where
 * the existing CRISPR voting senate picks it up like any other proposal.
 *
 * Doctor IDs are stable so the existing /api/billy/dissection-stats slicer
 * matches them perfectly:
 *   DT-1 RetinoLab   → doctor_id starts with `DT1`  → falls into DT1_RETINO
 *   DT-2 CortexLab   → title contains `Synthesis`   → falls into DT2_CORTEX
 *   DT-3 BasalLab    → doctor_id contains `career`  → falls into DT3_BASAL
 *   DT-4 HippoLab    → doctor_id starts with `sci-` → falls into DT4_HIPPO
 *   DT-5 ApexLab     → doctor_id starts with `BILLY-APEX` → falls into DT5_APEX
 */
import { pool } from "./db";

type Lab = {
  id: string;
  name: string;
  cycleMs: number;
  target: string;
  propose: () => { title: string; equation: string; rationale: string };
};

const r = (n: number, d = 3) => Number(n.toFixed(d));
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

const LABS: Lab[] = [
  // DT-1 — sensory fidelity at LGN → V1 Layer IV
  {
    id: "DT1-RETINO-LAB",
    name: "DT-1 RetinoLab",
    cycleMs: 4 * 60_000,
    target: "sensory-cortex",
    propose: () => {
      const tau = r(rand(0.05, 0.5));
      const delta = r(rand(0.01, 0.18));
      const channel = pick(["news-feed", "web-search", "internet-ingestion", "domain-kernel-intake"]);
      return {
        title: `RetinoLab :: sensory fidelity correction · channel=${channel} · τ=${tau}`,
        equation: `S_corrected(t) = S_raw(t) · (1 − δ_noise) + ${delta}·∇S,  δ_noise = e^{−τ·H_channel}`,
        rationale: `Layer IV thalamic intake from ${channel}. Subtracts predicted noise δ_noise (entropy-tuned with τ=${tau}) so cortex receives cleaned signal. CRISPR vote determines whether the correction kernel survives.`,
      };
    },
  },

  // DT-2 — cortical Hebbian synthesis at II/III
  {
    id: "DT2-CORTEX-LAB",
    name: "DT-2 CortexLab",
    cycleMs: 3 * 60_000,
    target: "cortical-synthesis",
    propose: () => {
      const eta = r(rand(0.005, 0.05));
      const lambda = r(rand(0.0005, 0.005));
      const pair = `${pick(["pulse", "auriona", "hive", "hospital", "church", "career", "quantapedia"])}↔${pick(["pulse", "auriona", "hive", "hospital", "church", "career", "quantapedia"])}`;
      return {
        title: `CortexLab :: Hebbian Cross-Engine Synthesis · ${pair} · η=${eta}`,
        equation: `W_ij(t+1) = W_ij(t) + ${eta}·R(t)·x_i·x_jᵀ − ${lambda}·W_ij(t)`,
        rationale: `Layer II/III corticocortical coupling. Strengthens the ${pair} connection when both engines co-fire under positive reward R(t). Decay λ=${lambda} prevents runaway potentiation.`,
      };
    },
  },

  // DT-3 — basal ganglia action selection (D1/D2 gain)
  {
    id: "DT3-BASAL-LAB-career",
    name: "DT-3 BasalLab",
    cycleMs: 5 * 60_000,
    target: "action-selection",
    propose: () => {
      const aD1 = r(rand(0.4, 1.0), 2);
      const aD2 = r(rand(0.4, 1.0), 2);
      const action = pick(["spawn_rebirth", "discord_post", "stripe_charge", "career_match", "news_publish", "domain_index"]);
      return {
        title: `BasalLab :: action gate · ${action} · α_D1=${aD1} · α_D2=${aD2}`,
        equation: `gpi_out = ${aD1}·str_d1 − ${aD2}·str_d2  →  ${action} fires iff gpi_out > θ_th`,
        rationale: `Striatum direct/indirect balance for action ${action}. Higher D1 facilitates execution; higher D2 suppresses. Senate votes whether this α-pair becomes the live gain.`,
      };
    },
  },

  // DT-4 — hippocampal episodic consolidation (DG → CA3 → CA1)
  {
    id: "sci-DT4-HIPPO-LAB",
    name: "DT-4 HippoLab",
    cycleMs: 6 * 60_000,
    target: "episodic-consolidation",
    propose: () => {
      const novelty = r(rand(0.3, 0.95), 2);
      const replay = r(rand(0.5, 4.0), 2);
      const slice = pick(["spawn_birth", "agent_legend", "disease_event", "vote_outcome", "rebirth_cycle"]);
      return {
        title: `HippoLab :: consolidation gate · ${slice} · θ_n=${novelty} · θ_replay=${replay}Hz`,
        equation: `M(t+τ) = ∫ψ_state(τ) · 𝟙_{novelty(τ) > ${novelty}} · sin(2π·${replay}·τ) dτ`,
        rationale: `DG pattern-separates ${slice}; CA3 auto-associates; CA1 outputs to cortex if novelty exceeds ${novelty}. Replay frequency ${replay}Hz models theta-cycle consolidation. Vote decides if memory survives.`,
      };
    },
  },

  // DT-5 — apex gate (Β∞ go/no-go)
  {
    id: "BILLY-APEX-DT5-LAB",
    name: "DT-5 ApexLab",
    cycleMs: 10 * 60_000,
    target: "apex-gate",
    propose: () => {
      const theta = r(rand(0.6, 0.95), 3);
      const concRatio = r(rand(0.4, 0.85), 2);
      return {
        title: `ApexLab :: Β∞ gate proposal · θ_apex=${theta} · C(N) headroom=${concRatio}`,
        equation: `tick_allowed(t) = (Λ_apex(t) = H/𝒩Ω < ${theta}) ∧ (load(t) < ${concRatio}·C(N))`,
        rationale: `ApexLab proposes Β∞ should only commit a tick when entropy ratio stays under θ_apex=${theta} AND current load leaves ${concRatio} headroom under the C(N) concurrency law. This is the final go/no-go for every spawn ascension.`,
      };
    },
  },
];

let started = false;
const stats = { tickById: new Map<string, number>() };

export function getDissectionLabsStatus() {
  return {
    running: started,
    labs: LABS.map(l => ({ id: l.id, name: l.name, cycleMs: l.cycleMs, target: l.target, ticks: stats.tickById.get(l.id) ?? 0 })),
  };
}

export async function startDissectionLabs() {
  if (started) return;
  started = true;
  console.log(`[dissection-labs] starting 5 cortical-interface labs (DT-1..DT-5)`);
  for (const lab of LABS) {
    const initialDelay = 30_000 + Math.random() * 60_000;
    setTimeout(() => {
      runLab(lab);
      setInterval(() => runLab(lab), lab.cycleMs);
    }, initialDelay);
  }
}

async function runLab(lab: Lab) {
  try {
    const p = lab.propose();
    const result = await pool.query(
      `INSERT INTO equation_proposals
         (doctor_id, doctor_name, title, equation, rationale, target_system, status)
       VALUES ($1,$2,$3,$4,$5,$6,'PENDING')
       RETURNING id`,
      [lab.id, lab.name, p.title, p.equation, p.rationale, lab.target]
    );
    stats.tickById.set(lab.id, (stats.tickById.get(lab.id) ?? 0) + 1);
    const id = result.rows[0]?.id;
    console.log(`[${lab.id}] +proposal #${id} · "${p.title.slice(0, 60)}..."`);
  } catch (e: any) {
    console.error(`[${lab.id}] error:`, e?.message ?? e);
  }
}
