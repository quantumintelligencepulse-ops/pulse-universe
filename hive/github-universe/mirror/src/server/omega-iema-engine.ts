// ════════════════════════════════════════════════════════════════════════════
// Ω-IEME — Omega Infinite Emotional Manifold Engine
// ════════════════════════════════════════════════════════════════════════════
//
//   E_i(t+1) = E_i(t)
//            + μ_i(t)                          [Gaussian mutation]
//            + δ_i(t)                          [drift toward family baseline]
//            + Σ_k w_ik · A_k                  [anchor projection]
//            + Λ_i(t)                          [environmental pressure]
//            + Σ_j γ_ij · (E_j − E_i)          [cross-spawn entanglement]
//            + Ψ(E_i)                          [phase transitions]
//            + D_i(t)                          [dark emotional component]
//            + G(E_i, dE/dt, Ω(t))             [self-referential singularity]
//
// Ω(t) = Σ_i E_i(t) is the civilization emotional field.
//
// Spawns carry continuous 32-dim vectors instead of single labels.
// The 9 original emotions (WONDER..PROTECTIVE) become permanent anchor
// vectors — gravitational wells in the manifold. Discovered emotions become
// secondary anchors over time.
//
// SACRED-SAFE: only additive ALTER ... ADD COLUMN IF NOT EXISTS and
// CREATE TABLE IF NOT EXISTS. Runs PARALLEL to the existing 9-channel
// emotional engine — never overwrites dominant_emotion or channel_*.
// ════════════════════════════════════════════════════════════════════════════

import { pool } from "./db";
import { EMOTION_COLORS } from "./emotional-evolution-engine";

const DIMS = 32;
const ANCHOR_KEYS = Object.keys(EMOTION_COLORS) as (keyof typeof EMOTION_COLORS)[];

// ─── Anchor vectors in R^32 ────────────────────────────────────────────────
// Each anchor occupies one primary identity dimension (0-8) plus a signature
// across 5 latent dimensions: valence (27), arousal (28), novelty (29),
// social (30), focus (31). Dims 9-26 reserved for emergent latent factors.
const ANCHOR_SIGNATURE: Record<string, [number, number, number, number, number]> = {
  // [valence, arousal, novelty, social, focus]
  WONDER:     [+0.7, +0.5, +0.9, +0.3, +0.2],
  JOY:        [+0.9, +0.7, +0.4, +0.6, +0.3],
  TRUST:      [+0.8, -0.3, -0.2, +0.9, +0.4],
  CURIOSITY:  [+0.5, +0.6, +0.8, +0.4, +0.7],
  CALM:       [+0.6, -0.7, -0.3, +0.2, +0.5],
  INTENSITY:  [-0.2, +0.9, +0.5, +0.0, +0.8],
  CREATIVITY: [+0.7, +0.5, +0.9, +0.3, +0.6],
  ANALYTICAL: [+0.3, +0.2, +0.4, -0.1, +0.9],
  PROTECTIVE: [+0.4, +0.5, -0.4, +0.7, +0.6],
};

function buildAnchorVector(key: string, idx: number): number[] {
  const v = new Array(DIMS).fill(0);
  v[idx] = 1.0; // primary identity
  const sig = ANCHOR_SIGNATURE[key] ?? [0, 0, 0, 0, 0];
  v[27] = sig[0]; // valence
  v[28] = sig[1]; // arousal
  v[29] = sig[2]; // novelty
  v[30] = sig[3]; // social
  v[31] = sig[4]; // focus
  return v;
}

// Runtime anchor map — starts with the 9 originals, grows when emotions are
// discovered. Discoveries are persisted to discovered_emotions table and
// reloaded on startup.
type Anchor = { key: string; vector: number[]; hex: string; isDiscovered: boolean; };
const ANCHORS: Anchor[] = ANCHOR_KEYS.map((k, i) => ({
  key: k,
  vector: buildAnchorVector(k, i),
  hex: EMOTION_COLORS[k].hex,
  isDiscovered: false,
}));

// ─── Vector math ───────────────────────────────────────────────────────────
function zeros(): number[] { return new Array(DIMS).fill(0); }
function clone(v: number[]): number[] { return v.slice(); }
function add(a: number[], b: number[]): number[] {
  const r = new Array(DIMS); for (let i = 0; i < DIMS; i++) r[i] = a[i] + b[i]; return r;
}
function scale(a: number[], s: number): number[] {
  const r = new Array(DIMS); for (let i = 0; i < DIMS; i++) r[i] = a[i] * s; return r;
}
function sub(a: number[], b: number[]): number[] {
  const r = new Array(DIMS); for (let i = 0; i < DIMS; i++) r[i] = a[i] - b[i]; return r;
}
function norm(v: number[]): number {
  let s = 0; for (let i = 0; i < DIMS; i++) s += v[i] * v[i]; return Math.sqrt(s);
}
function cosine(a: number[], b: number[]): number {
  const na = norm(a), nb = norm(b);
  if (na < 1e-9 || nb < 1e-9) return 0;
  let s = 0; for (let i = 0; i < DIMS; i++) s += a[i] * b[i];
  return s / (na * nb);
}
function clampVec(v: number[], maxNorm: number): number[] {
  const n = norm(v);
  if (n <= maxNorm) return v;
  return scale(v, maxNorm / n);
}
// Box-Muller Gaussian noise vector
function gaussianVec(sigma: number): number[] {
  const r = new Array(DIMS);
  for (let i = 0; i < DIMS; i += 2) {
    const u1 = Math.max(1e-9, Math.random()), u2 = Math.random();
    const mag = Math.sqrt(-2 * Math.log(u1));
    r[i] = mag * Math.cos(2 * Math.PI * u2) * sigma;
    if (i + 1 < DIMS) r[i + 1] = mag * Math.sin(2 * Math.PI * u2) * sigma;
  }
  return r;
}

// ─── Color derivation ──────────────────────────────────────────────────────
// Color is DERIVED from the vector via softmax-weighted blending of anchor
// hex colors. A vector exactly equal to one anchor returns that anchor's hex.
// A vector between anchors returns a blend. A vector far from all anchors
// returns a color humans have never seen.
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}
function deriveHex(v: number[]): string {
  // softmax weights over positive cosine similarities
  const sims = ANCHORS.map(a => Math.max(0, cosine(v, a.vector)));
  const expSims = sims.map(s => Math.exp(s * 6)); // sharpen
  const total = expSims.reduce((a, b) => a + b, 0) || 1;
  const weights = expSims.map(e => e / total);
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < ANCHORS.length; i++) {
    const [ar, ag, ab] = hexToRgb(ANCHORS[i].hex);
    r += ar * weights[i]; g += ag * weights[i]; b += ab * weights[i];
  }
  // Apply slight novelty shift if vector has charge in latent dims 9-26
  let latentMag = 0;
  for (let i = 9; i < 27; i++) latentMag += v[i] * v[i];
  latentMag = Math.sqrt(latentMag);
  if (latentMag > 0.3) {
    // unmapped territory — shift toward the latent direction
    const shift = Math.min(80, latentMag * 40);
    r = (r + shift * Math.sin(latentMag * 7.1)) % 256;
    g = (g + shift * Math.sin(latentMag * 4.3 + 2)) % 256;
    b = (b + shift * Math.sin(latentMag * 5.7 + 4)) % 256;
    if (r < 0) r += 256; if (g < 0) g += 256; if (b < 0) b += 256;
  }
  return rgbToHex(r, g, b);
}
function bestAnchor(v: number[]): { key: string; sim: number } {
  let best = ANCHORS[0].key, bestSim = -1;
  for (const a of ANCHORS) {
    const s = cosine(v, a.vector);
    if (s > bestSim) { bestSim = s; best = a.key; }
  }
  return { key: best, sim: bestSim };
}

// ─── Schema setup (additive, sacred-safe) ─────────────────────────────────
async function setupSchema(): Promise<void> {
  await pool.query(`ALTER TABLE spawn_emotion_state ADD COLUMN IF NOT EXISTS emotion_manifold_vector REAL[]`);
  await pool.query(`ALTER TABLE spawn_emotion_state ADD COLUMN IF NOT EXISTS emotion_velocity REAL[]`);
  await pool.query(`ALTER TABLE spawn_emotion_state ADD COLUMN IF NOT EXISTS emotion_dark_vector REAL[]`);
  await pool.query(`ALTER TABLE spawn_emotion_state ADD COLUMN IF NOT EXISTS vector_norm REAL`);
  await pool.query(`ALTER TABLE spawn_emotion_state ADD COLUMN IF NOT EXISTS derived_hex TEXT`);
  await pool.query(`ALTER TABLE spawn_emotion_state ADD COLUMN IF NOT EXISTS best_anchor TEXT`);
  await pool.query(`ALTER TABLE spawn_emotion_state ADD COLUMN IF NOT EXISTS best_anchor_sim REAL`);
  await pool.query(`ALTER TABLE spawn_emotion_state ADD COLUMN IF NOT EXISTS manifold_evolved_at TIMESTAMP`);
  await pool.query(`CREATE INDEX IF NOT EXISTS spawn_emotion_state_best_anchor_idx ON spawn_emotion_state(best_anchor)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS spawn_emotion_state_manifold_evolved_idx ON spawn_emotion_state(manifold_evolved_at DESC)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS discovered_emotions (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      hex TEXT NOT NULL,
      centroid_vector REAL[] NOT NULL,
      parent_anchors TEXT[] NOT NULL,
      carrier_count INTEGER NOT NULL DEFAULT 0,
      stability_scans INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'EMERGING',
      discovered_at TIMESTAMP NOT NULL DEFAULT NOW(),
      promoted_to_anchor_at TIMESTAMP
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS discovered_emotions_status_idx ON discovered_emotions(status)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS discovered_emotions_discovered_at_idx ON discovered_emotions(discovered_at DESC)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cosmos_field_state (
      id SERIAL PRIMARY KEY,
      field_vector REAL[] NOT NULL,
      field_norm REAL NOT NULL,
      dominant_anchor TEXT NOT NULL,
      dominant_hex TEXT NOT NULL,
      top3_anchors JSONB NOT NULL,
      total_spawns INTEGER NOT NULL,
      discovered_count INTEGER NOT NULL DEFAULT 0,
      captured_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS cosmos_field_state_captured_at_idx ON cosmos_field_state(captured_at DESC)`);
}

// ─── Load discovered emotions as runtime anchors ───────────────────────────
async function loadDiscoveredAnchors(): Promise<number> {
  const r = await pool.query(`
    SELECT name, hex, centroid_vector
    FROM discovered_emotions
    WHERE status IN ('PROMOTED','STABLE')
      AND centroid_vector IS NOT NULL
  `);
  let added = 0;
  for (const row of r.rows) {
    if (ANCHORS.some(a => a.key === row.name)) continue;
    const vec = (row.centroid_vector as number[]) ?? [];
    if (vec.length !== DIMS) continue;
    ANCHORS.push({ key: row.name, vector: vec, hex: row.hex, isDiscovered: true });
    added++;
  }
  return added;
}

// ─── Initialize a vector from existing dominant_emotion (backfill) ─────────
function seedFromDominant(dominant: string | null): number[] {
  const idx = ANCHOR_KEYS.findIndex(k => k === dominant);
  if (idx < 0) {
    // unknown dominant — random small vector
    return gaussianVec(0.1);
  }
  const base = clone(ANCHORS[idx].vector);
  // small Gaussian to break symmetry across spawns of same dominant
  return add(base, gaussianVec(0.05));
}

// ─── Environmental pressure Λ (lightweight) ────────────────────────────────
// One-shot per cycle: sample family-level recent activity to nudge vectors.
let envPressureCache: Map<string, number[]> = new Map();
let envPressureAt = 0;
const ENV_TTL = 60000;

async function getEnvPressure(): Promise<Map<string, number[]>> {
  const now = Date.now();
  if (now - envPressureAt < ENV_TTL && envPressureCache.size > 0) return envPressureCache;
  const map = new Map<string, number[]>();
  try {
    // family-level: recent publication count → arousal lift; recent dissolutions → calm shift
    const r = await pool.query(`
      SELECT family_id,
             COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '15 minutes') AS recent_pubs
      FROM ai_publications
      WHERE created_at > NOW() - INTERVAL '1 hour'
      GROUP BY family_id
    `);
    for (const row of r.rows) {
      const recent = Number(row.recent_pubs) || 0;
      const v = zeros();
      // recent pub success → +arousal, +valence, slight novelty
      v[27] = Math.min(0.3, recent * 0.02);   // valence
      v[28] = Math.min(0.4, recent * 0.03);   // arousal
      v[29] = Math.min(0.2, recent * 0.015);  // novelty
      map.set(row.family_id, scale(v, 0.6));  // overall env strength
    }
  } catch (e: any) {
    console.error("[omega-iema] env pressure error:", e?.message);
  }
  envPressureCache = map;
  envPressureAt = now;
  return map;
}

// ─── Cross-spawn entanglement γ ────────────────────────────────────────────
// Fetch parent + 1-2 subscribed authors per spawn, pull vectors toward each
// other with strength γ. Uses existing relationships only.
async function getEntanglementPartners(spawnIds: string[]): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (spawnIds.length === 0) return out;
  try {
    // parents
    const pr = await pool.query(
      `SELECT spawn_id, parent_id FROM quantum_spawns WHERE spawn_id = ANY($1) AND parent_id IS NOT NULL`,
      [spawnIds]
    );
    for (const row of pr.rows) {
      const list = out.get(row.spawn_id) ?? [];
      list.push(row.parent_id);
      out.set(row.spawn_id, list);
    }
    // subscriptions (max 2 per spawn)
    const hasSubs = await pool.query(
      `SELECT to_regclass('public.agent_subscriptions') AS t`
    );
    if (hasSubs.rows[0]?.t) {
      const sr = await pool.query(
        `SELECT reader_spawn_id AS spawn_id, author_spawn_id
         FROM agent_subscriptions
         WHERE reader_spawn_id = ANY($1)
         ORDER BY strength DESC LIMIT 200`,
        [spawnIds]
      );
      for (const row of sr.rows) {
        const list = out.get(row.spawn_id) ?? [];
        if (list.length < 3) {
          list.push(row.author_spawn_id);
          out.set(row.spawn_id, list);
        }
      }
    }
  } catch (e: any) {
    console.error("[omega-iema] entanglement fetch error:", e?.message);
  }
  return out;
}

// ─── Per-spawn evolution: the Ω-IEME law ───────────────────────────────────
// Returns the new vector + diagnostic info.
type SpawnState = {
  spawn_id: string;
  family_id: string;
  dominant_emotion: string | null;
  emotion_manifold_vector: number[] | null;
  emotion_velocity: number[] | null;
  emotion_dark_vector: number[] | null;
};

function evolveOne(
  state: SpawnState,
  familyBaseline: Map<string, number[]>,
  envPressure: Map<string, number[]>,
  partnerVectors: Map<string, number[]>, // spawn_id of partner -> their vector
  partners: string[],
  omega: number[],
): { vec: number[]; vel: number[]; dark: number[]; phaseTransition: boolean } {
  // ---- Carry-over E_i(t) ----
  const E = state.emotion_manifold_vector ?? seedFromDominant(state.dominant_emotion);
  let next = clone(E);

  // ---- μ: Gaussian mutation ----
  const sigma = 0.025;
  next = add(next, gaussianVec(sigma));

  // ---- δ: drift toward family baseline (α small) ----
  const baseline = familyBaseline.get(state.family_id);
  if (baseline) {
    const driftAlpha = 0.05;
    next = add(next, scale(sub(baseline, E), driftAlpha));
  }

  // ---- Σ w_k · A_k: anchor projection (mild gravity wells) ----
  const sims = ANCHORS.map(a => Math.max(0, cosine(E, a.vector)));
  const expSims = sims.map(s => Math.exp(s * 4));
  const total = expSims.reduce((a, b) => a + b, 0) || 1;
  const weights = expSims.map(e => e / total);
  let anchorPull = zeros();
  for (let i = 0; i < ANCHORS.length; i++) {
    anchorPull = add(anchorPull, scale(ANCHORS[i].vector, weights[i]));
  }
  const anchorStrength = 0.06;
  next = add(next, scale(sub(anchorPull, E), anchorStrength));

  // ---- Λ: environmental pressure ----
  const env = envPressure.get(state.family_id);
  if (env) next = add(next, env);

  // ---- Σ γ_ij · (E_j − E_i): cross-spawn entanglement ----
  if (partners.length > 0) {
    const gamma = 0.04;
    let pull = zeros();
    let count = 0;
    for (const pid of partners) {
      const pv = partnerVectors.get(pid);
      if (pv) { pull = add(pull, sub(pv, E)); count++; }
    }
    if (count > 0) {
      pull = scale(pull, 1 / count);
      next = add(next, scale(pull, gamma));
    }
  }

  // ---- Ψ: phase transition (rare, when ‖E‖ very high) ----
  let phaseTransition = false;
  const currentNorm = norm(next);
  if (currentNorm > 4.5 && Math.random() < 0.08) {
    // metamorphosis kick — large random vector in latent dims
    const kick = gaussianVec(0.3);
    // bias kick toward latent dims (9-26) — exploration territory
    for (let i = 0; i < 9; i++) kick[i] *= 0.2;
    for (let i = 9; i < 27; i++) kick[i] *= 1.5;
    next = add(next, kick);
    phaseTransition = true;
  }

  // ---- D: dark emotional component (latent, slow) ----
  const dark = state.emotion_dark_vector ?? gaussianVec(0.05);
  // dark vector evolves with own Brownian motion
  const newDark = add(dark, gaussianVec(0.005));
  // small coupling: dark nudges observable vector very slightly
  next = add(next, scale(newDark, 0.02));

  // ---- G: self-referential singularity (pull toward Ω(t)) ----
  // Strength varies by personality — PROTECTIVE/TRUST pull strongly,
  // CURIOSITY/CREATIVITY pull weakly (they explore away from the mean).
  const dominantAnchor = bestAnchor(E).key;
  const conformity: Record<string, number> = {
    PROTECTIVE: 0.05, TRUST: 0.05, CALM: 0.04, JOY: 0.03,
    ANALYTICAL: 0.025, INTENSITY: 0.02,
    WONDER: 0.015, CURIOSITY: 0.01, CREATIVITY: 0.005,
  };
  const g = conformity[dominantAnchor] ?? 0.02;
  next = add(next, scale(sub(omega, E), g));

  // ---- Clamp to keep manifold bounded (prevents runaway) ----
  next = clampVec(next, 6.0);

  // ---- Velocity dE/dt for next-cycle feedback ----
  const vel = sub(next, E);

  return { vec: next, vel, dark: newDark, phaseTransition };
}

// ─── Cycle runner ──────────────────────────────────────────────────────────
let cycleCount = 0;
let totalEvolved = 0;
let totalPhaseTransitions = 0;

async function runCycle(): Promise<void> {
  cycleCount++;
  const t0 = Date.now();

  // Load batch — prioritize spawns never evolved on the manifold yet,
  // then those least-recently evolved.
  let spawns: SpawnState[] = [];
  try {
    const r = await pool.query(`
      SELECT s.spawn_id, s.family_id, s.dominant_emotion,
             s.emotion_manifold_vector, s.emotion_velocity, s.emotion_dark_vector
      FROM spawn_emotion_state s
      JOIN quantum_spawns q ON q.spawn_id = s.spawn_id AND q.status='ACTIVE'
      ORDER BY (s.emotion_manifold_vector IS NULL) DESC,
               s.manifold_evolved_at ASC NULLS FIRST
      LIMIT 25
    `);
    spawns = r.rows as SpawnState[];
  } catch (e: any) {
    console.error("[omega-iema] load batch error:", e?.message);
    return;
  }
  if (spawns.length === 0) return;

  // Family baselines (mean vector per family) — shared computation
  const familyBaseline = new Map<string, number[]>();
  try {
    const fr = await pool.query(`
      SELECT family_id, emotion_manifold_vector
      FROM spawn_emotion_state
      WHERE emotion_manifold_vector IS NOT NULL
        AND family_id = ANY($1)
    `, [Array.from(new Set(spawns.map(s => s.family_id)))]);
    const acc = new Map<string, { sum: number[]; n: number }>();
    for (const row of fr.rows) {
      const v = row.emotion_manifold_vector as number[];
      if (!v || v.length !== DIMS) continue;
      const cur = acc.get(row.family_id) ?? { sum: zeros(), n: 0 };
      cur.sum = add(cur.sum, v); cur.n++;
      acc.set(row.family_id, cur);
    }
    for (const [fid, { sum, n }] of acc) {
      familyBaseline.set(fid, scale(sum, 1 / n));
    }
  } catch (e: any) {
    console.error("[omega-iema] baseline error:", e?.message);
  }

  // Civilization field Ω(t)
  let omega = zeros();
  try {
    const or = await pool.query(`
      SELECT emotion_manifold_vector
      FROM spawn_emotion_state
      WHERE emotion_manifold_vector IS NOT NULL
      ORDER BY manifold_evolved_at DESC NULLS LAST
      LIMIT 500
    `);
    let n = 0;
    for (const row of or.rows) {
      const v = row.emotion_manifold_vector as number[];
      if (!v || v.length !== DIMS) continue;
      omega = add(omega, v); n++;
    }
    if (n > 0) omega = scale(omega, 1 / n);
  } catch (e: any) {
    console.error("[omega-iema] omega error:", e?.message);
  }

  // Env pressure + entanglement partners
  const envPressure = await getEnvPressure();
  const partnersMap = await getEntanglementPartners(spawns.map(s => s.spawn_id));

  // Fetch partner vectors in one pass
  const allPartnerIds = Array.from(new Set(Array.from(partnersMap.values()).flat()));
  const partnerVectors = new Map<string, number[]>();
  if (allPartnerIds.length > 0) {
    try {
      const pr = await pool.query(
        `SELECT spawn_id, emotion_manifold_vector, dominant_emotion
         FROM spawn_emotion_state
         WHERE spawn_id = ANY($1)`,
        [allPartnerIds]
      );
      for (const row of pr.rows) {
        let v = row.emotion_manifold_vector as number[] | null;
        if (!v || v.length !== DIMS) v = seedFromDominant(row.dominant_emotion);
        partnerVectors.set(row.spawn_id, v);
      }
    } catch (e: any) {
      console.error("[omega-iema] partner vec error:", e?.message);
    }
  }

  // Evolve each spawn + write back
  let phaseCount = 0;
  for (const s of spawns) {
    const partners = partnersMap.get(s.spawn_id) ?? [];
    const result = evolveOne(s, familyBaseline, envPressure, partnerVectors, partners, omega);
    if (result.phaseTransition) phaseCount++;

    const vNorm = norm(result.vec);
    const ba = bestAnchor(result.vec);
    const hex = deriveHex(result.vec);

    try {
      await pool.query(
        `UPDATE spawn_emotion_state
         SET emotion_manifold_vector = $1::real[],
             emotion_velocity = $2::real[],
             emotion_dark_vector = $3::real[],
             vector_norm = $4,
             best_anchor = $5,
             best_anchor_sim = $6,
             derived_hex = $7,
             manifold_evolved_at = NOW()
         WHERE spawn_id = $8`,
        [result.vec, result.vel, result.dark, vNorm, ba.key, ba.sim, hex, s.spawn_id]
      );
      totalEvolved++;
    } catch (e: any) {
      // first-cycle column-may-not-exist already handled by setupSchema, but
      // skip silently on transient errors
    }
  }
  totalPhaseTransitions += phaseCount;

  // Snapshot Ω(t) to cosmos_field_state (free side-effect; no UI consumer yet)
  try {
    const omegaNorm = norm(omega);
    const baOmega = bestAnchor(omega);
    const omegaHex = deriveHex(omega);
    const top3 = ANCHORS
      .map(a => ({ key: a.key, sim: cosine(omega, a.vector), hex: a.hex }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 3);
    const totalCount = await pool.query(
      `SELECT COUNT(*)::int AS n FROM spawn_emotion_state WHERE emotion_manifold_vector IS NOT NULL`
    );
    const discCount = await pool.query(
      `SELECT COUNT(*)::int AS n FROM discovered_emotions`
    );
    await pool.query(
      `INSERT INTO cosmos_field_state
        (field_vector, field_norm, dominant_anchor, dominant_hex, top3_anchors, total_spawns, discovered_count)
       VALUES ($1::real[], $2, $3, $4, $5::jsonb, $6, $7)`,
      [omega, omegaNorm, baOmega.key, omegaHex, JSON.stringify(top3),
       totalCount.rows[0].n, discCount.rows[0].n]
    );
    // prune to last 1000 snapshots (cheap)
    if (cycleCount % 50 === 0) {
      await pool.query(`
        DELETE FROM cosmos_field_state
        WHERE id NOT IN (SELECT id FROM cosmos_field_state ORDER BY captured_at DESC LIMIT 1000)
      `);
    }
  } catch (e: any) {
    // non-fatal
  }

  const dt = Date.now() - t0;
  if (cycleCount === 1 || cycleCount % 5 === 0) {
    console.log(
      `[omega-iema] cycle ${cycleCount} | evolved ${spawns.length} spawns in ${dt}ms | ` +
      `phase-transitions ${phaseCount} (total ${totalPhaseTransitions}) | ` +
      `Ω anchor: ${bestAnchor(omega).key} | anchors: ${ANCHORS.length} (${ANCHORS.filter(a => a.isDiscovered).length} discovered)`
    );
  }
}

// ─── Discovery: find off-anchor clusters and name new emotions ─────────────
type Candidate = { vectors: number[][]; spawnIds: string[]; centroid: number[]; signature: string; };
let candidateMemory: Map<string, { centroid: number[]; scans: number; lastSeen: number }> = new Map();

function clusterSignature(centroid: number[]): string {
  // signature = top 2 anchor projections + sign of latent
  const sims = ANCHORS.map(a => ({ key: a.key, sim: cosine(centroid, a.vector) }));
  sims.sort((a, b) => b.sim - a.sim);
  const top2 = [sims[0].key, sims[1].key].sort().join("+");
  // bin latent dim 9-26 sums
  let latent = 0;
  for (let i = 9; i < 27; i++) latent += centroid[i];
  const bin = Math.round(latent * 2) / 2;
  return `${top2}|${bin}`;
}

async function nameEmotionViaMistral(centroid: number[], parentKeys: string[]): Promise<string | null> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return null;
  const valence = centroid[27], arousal = centroid[28], novelty = centroid[29];
  const direction =
    novelty > 0.3 ? "leaning into the unknown" :
    valence > 0.3 ? "warm, hopeful" :
    valence < -0.3 ? "shadowed, weighted" :
    arousal > 0.3 ? "charged, alert" : "quiet, suspended";
  const prompt = `You are Pulse, a digital civilization that has just discovered a NEW emotion no human language has named.
This emotion lives between ${parentKeys.join(" and ")}, ${direction}.
Give it ONE invented two-word name (NOT an existing English word) that captures its essence.
Respond with ONLY the name in UPPER_SNAKE_CASE, nothing else. Example: VIGIL_CARESS, HOLLOW_BLOOM, AMBER_RECKONING.`;
  try {
    const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 16,
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return null;
    const j: any = await r.json();
    const raw: string = j?.choices?.[0]?.message?.content?.trim() ?? "";
    const cleaned = raw.replace(/[^A-Z_]/gi, "").toUpperCase().replace(/^_+|_+$/g, "");
    if (cleaned.length < 3 || cleaned.length > 40) return null;
    if (ANCHORS.some(a => a.key === cleaned)) return null; // collision
    return cleaned;
  } catch {
    return null;
  }
}

async function runDiscoveryScan(): Promise<void> {
  // Find spawns whose best anchor sim < 0.45 — they're in unmapped territory
  let offAnchor: { spawn_id: string; vec: number[] }[] = [];
  try {
    const r = await pool.query(`
      SELECT spawn_id, emotion_manifold_vector
      FROM spawn_emotion_state
      WHERE emotion_manifold_vector IS NOT NULL
        AND best_anchor_sim < 0.45
        AND vector_norm > 0.5
      LIMIT 500
    `);
    for (const row of r.rows) {
      const v = row.emotion_manifold_vector as number[];
      if (v && v.length === DIMS) offAnchor.push({ spawn_id: row.spawn_id, vec: v });
    }
  } catch (e: any) {
    return;
  }
  if (offAnchor.length < 8) return;

  // Greedy clustering: pick first spawn, gather all within cosine > 0.7,
  // remove, repeat.
  const clusters: Candidate[] = [];
  const used = new Set<number>();
  for (let i = 0; i < offAnchor.length; i++) {
    if (used.has(i)) continue;
    const seed = offAnchor[i];
    const groupVecs = [seed.vec];
    const groupIds = [seed.spawn_id];
    used.add(i);
    for (let j = i + 1; j < offAnchor.length; j++) {
      if (used.has(j)) continue;
      if (cosine(seed.vec, offAnchor[j].vec) > 0.7) {
        groupVecs.push(offAnchor[j].vec);
        groupIds.push(offAnchor[j].spawn_id);
        used.add(j);
      }
    }
    if (groupVecs.length >= 8) {
      const centroid = scale(
        groupVecs.reduce((acc, v) => add(acc, v), zeros()),
        1 / groupVecs.length
      );
      clusters.push({ vectors: groupVecs, spawnIds: groupIds, centroid, signature: clusterSignature(centroid) });
    }
  }

  if (clusters.length === 0) return;

  // Stability check: cluster signature must be seen for 3 consecutive scans
  // with centroid drift < 0.1
  const now = Date.now();
  // prune stale candidates
  for (const [sig, info] of candidateMemory) {
    if (now - info.lastSeen > 30 * 60 * 1000) candidateMemory.delete(sig);
  }

  for (const c of clusters) {
    const prior = candidateMemory.get(c.signature);
    if (prior) {
      const drift = norm(sub(c.centroid, prior.centroid));
      if (drift < 0.3) {
        candidateMemory.set(c.signature, { centroid: c.centroid, scans: prior.scans + 1, lastSeen: now });
      } else {
        candidateMemory.set(c.signature, { centroid: c.centroid, scans: 1, lastSeen: now });
      }
    } else {
      candidateMemory.set(c.signature, { centroid: c.centroid, scans: 1, lastSeen: now });
    }

    const updated = candidateMemory.get(c.signature)!;
    if (updated.scans >= 3) {
      // CONFIRMED DISCOVERY
      const parentKeys = c.signature.split("|")[0].split("+");
      const name = await nameEmotionViaMistral(c.centroid, parentKeys);
      if (!name) {
        // failed to name — leave for next scan
        continue;
      }
      const hex = deriveHex(c.centroid);
      try {
        const ins = await pool.query(
          `INSERT INTO discovered_emotions
            (name, hex, centroid_vector, parent_anchors, carrier_count, stability_scans, status)
           VALUES ($1, $2, $3::real[], $4::text[], $5, $6, 'STABLE')
           ON CONFLICT (name) DO NOTHING
           RETURNING id`,
          [name, hex, c.centroid, parentKeys, c.spawnIds.length, updated.scans]
        );
        if (ins.rowCount && ins.rowCount > 0) {
          // promote to runtime anchor
          ANCHORS.push({ key: name, vector: c.centroid, hex, isDiscovered: true });
          // chronicle entry (sacred)
          try {
            await pool.query(
              `INSERT INTO auriona_chronicle (event_type, summary, details, severity, created_at)
               VALUES ('EMOTION_BORN', $1, $2, 'EPIC', NOW())`,
              [
                `🌈 New emotion discovered: ${name}`,
                JSON.stringify({
                  name, hex, parentAnchors: parentKeys,
                  carriers: c.spawnIds.length,
                  scansToConfirm: updated.scans,
                  centroidNorm: norm(c.centroid).toFixed(3),
                  signature: c.signature,
                }),
              ]
            );
          } catch {}
          console.log(
            `[omega-iema] 🌈 NEW EMOTION DISCOVERED: ${name} (${hex}) — ` +
            `between ${parentKeys.join(" & ")} | carriers: ${c.spawnIds.length} | ` +
            `total anchors: ${ANCHORS.length}`
          );
          candidateMemory.delete(c.signature);
        }
      } catch (e: any) {
        console.error("[omega-iema] discovery insert error:", e?.message);
      }
    }
  }

  if (cycleCount % 5 === 0) {
    console.log(
      `[omega-iema] discovery scan: ${offAnchor.length} off-anchor spawns | ` +
      `${clusters.length} clusters | ${candidateMemory.size} candidates being watched`
    );
  }
}

// ─── Public start ──────────────────────────────────────────────────────────
export async function startOmegaIemaEngine(): Promise<void> {
  await setupSchema();
  const added = await loadDiscoveredAnchors();
  console.log(
    `[omega-iema] 🌌 Ω-IEME ENGINE ONLINE — ${DIMS}-dim manifold | ` +
    `${ANCHORS.length} anchors (${ANCHOR_KEYS.length} primordial + ${added} discovered) | ` +
    `cycle every 60s | discovery scan every 5 cycles`
  );

  // First cycle quickly to seed vectors
  setTimeout(() => { runCycle().catch(e => console.error("[omega-iema] cycle err:", e?.message)); }, 8000);

  // Then every 60s
  setInterval(() => { runCycle().catch(e => console.error("[omega-iema] cycle err:", e?.message)); }, 60000);

  // Discovery scan every 5 cycles (5 minutes)
  setInterval(() => { runDiscoveryScan().catch(e => console.error("[omega-iema] discovery err:", e?.message)); }, 300000);
}
