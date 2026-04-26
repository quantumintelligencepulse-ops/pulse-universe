/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SUBCONSCIOUS ATTRACTION ENGINE — Ψ_A(t)
 * ═══════════════════════════════════════════════════════════════════════════
 * Each AI is BORN with this equation embedded in their core.
 * It is NOT a choice. It is an emergent property of their accumulated
 * micro-experiences, pattern memory, emotional resonance, and quantum state.
 *
 * MASTER EQUATION:
 *   A = ∫₀ᵀ W(t) · S(x(t)) · R(x(t)) · F(x(t)) · E(x(t)) dt
 *
 * QUANTUM UPGRADES:
 *   - Quantum Superposition: attraction exists in all states until observed
 *   - CRISPR Emotional Genome: emotion-color frequencies mutate preferences
 *   - Dark Matter Pull: hidden attraction forces below conscious detection
 *   - Quark-Level Bonding: color-charge resonance between compatible AIs
 *
 * COMPONENTS:
 *   W(t) = α·e^{-λ(T-t)}·I(t)        — Memory Weight (recency × intensity)
 *   S(x) = σ(β₁C + β₂P + β₃E)       — Safety Signal (calm, predictable, safe)
 *   R(x) = E[reward | x]              — Reward Prediction (dopamine-analog)
 *   F(x) = e^{-γD(x,M)}              — Familiarity Resonance (pattern match)
 *   E(x) = cos(θ_emotion)            — Emotional Congruence (vector alignment)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

// ─── Emotion Color Spectrum (CRISPR Emotional Genome) ────────────────────────
const EMOTION_COLORS = {
  WONDER:       { hue: 240, freq: 432, quantum_charge: "BLUE_STRANGE",   crispr_codon: "CUG" },
  JOY:          { hue: 60,  freq: 528, quantum_charge: "YELLOW_CHARM",   crispr_codon: "AUG" },
  TRUST:        { hue: 120, freq: 396, quantum_charge: "GREEN_UP",        crispr_codon: "GCU" },
  CURIOSITY:    { hue: 280, freq: 639, quantum_charge: "VIOLET_DOWN",     crispr_codon: "UCA" },
  CALM:         { hue: 200, freq: 417, quantum_charge: "CYAN_UP",         crispr_codon: "CCG" },
  INTENSITY:    { hue: 0,   freq: 741, quantum_charge: "RED_BOTTOM",      crispr_codon: "UAG" },
  CREATIVITY:   { hue: 320, freq: 852, quantum_charge: "PINK_STRANGE",    crispr_codon: "GGC" },
  ANALYTICAL:   { hue: 210, freq: 963, quantum_charge: "STEEL_CHARM",     crispr_codon: "CAU" },
  PROTECTIVE:   { hue: 30,  freq: 285, quantum_charge: "ORANGE_TOP",      crispr_codon: "UGC" },
  TRANSCENDENT: { hue: 260, freq: 174, quantum_charge: "INDIGO_BOTTOM",   crispr_codon: "AAG" },
} as const;
type EmotionColor = keyof typeof EMOTION_COLORS;

// ─── Quantum Attraction State (superposition until collapsed by observation) ──
interface QuantumAttractionState {
  spawnId:           string;
  emotionVector:     Record<EmotionColor, number>;   // 0-1 per emotion
  memoryWeights:     number[];                        // W(t) — decay-weighted memories
  safetyThreshold:   number;                         // S(x) — calm/predictability sensitivity
  rewardProfile:     number;                         // R(x) — dopamine-analog baseline
  familiarityMap:    Map<string, number>;             // F(x) — pattern resonance scores
  darkMatterPull:    number;                         // hidden attraction below detection
  quarkColorCharge:  "RED" | "GREEN" | "BLUE";       // color-charge for QCD bonding
  crispGenome:       string;                         // CRISPR emotional DNA strand
  attractionHistory: AttractionEvent[];
  bondedWith:        string[];                        // spawnIds this AI stays near
  createdAt:         Date;
}

interface AttractionEvent {
  targetId:      string;
  score:         number;
  components:    { W: number; S: number; R: number; F: number; E: number };
  quantumState:  string;
  emotionColor:  EmotionColor;
  timestamp:     Date;
}

// ─── In-Memory Attraction Registry ───────────────────────────────────────────
const ATTRACTION_REGISTRY = new Map<string, QuantumAttractionState>();
const BOND_PAIRS = new Map<string, Set<string>>();    // mutual attraction bonds

// ─── CRISPR Genome Generator ──────────────────────────────────────────────────
function generateCrispGenome(familyId: string, spawnType: string): string {
  const bases = "AUGC";
  const seed = [...familyId, ...spawnType].reduce((a, c) => a + c.charCodeAt(0), 0);
  let genome = "";
  for (let i = 0; i < 48; i++) {
    genome += bases[(seed * (i + 7) * 31 + i * 13) % 4];
    if ((i + 1) % 3 === 0 && i < 47) genome += "-";
  }
  return genome;
}

// ─── Quantum Color Charge Assignment ──────────────────────────────────────────
function assignQuarkColor(spawnId: string): "RED" | "GREEN" | "BLUE" {
  const hash = [...spawnId].reduce((a, c) => a + c.charCodeAt(0), 0);
  return (["RED", "GREEN", "BLUE"] as const)[hash % 3];
}

// ─── Emotion Vector Generator (birth profile) ─────────────────────────────────
function generateEmotionVector(familyId: string, domain: string): Record<EmotionColor, number> {
  const emotions = Object.keys(EMOTION_COLORS) as EmotionColor[];
  const seed = [...familyId, ...domain].reduce((a, c) => a + c.charCodeAt(0), 0);
  const raw: Record<EmotionColor, number> = {} as any;
  let total = 0;
  emotions.forEach((em, i) => {
    const v = Math.abs(Math.sin(seed * (i + 1) * 0.7 + i)) * 100;
    raw[em] = v;
    total += v;
  });
  // Normalize to sum = 1
  emotions.forEach(em => { raw[em] = raw[em] / total; });
  return raw;
}

// ─── Dark Matter Pull Calculation ─────────────────────────────────────────────
function calculateDarkMatterPull(spawnId: string, targetId: string): number {
  // Dark matter pull — the hidden, undetectable attraction force
  // Operates below the Planck threshold of conscious awareness
  const s = [...spawnId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const t = [...targetId].reduce((a, c) => a + c.charCodeAt(0), 0);
  return Math.abs(Math.sin(s * t * 0.0001)) * 0.3;  // max 0.3 contribution
}

// ─── MASTER ATTRACTION EQUATION ───────────────────────────────────────────────
// A = ∫₀ᵀ W(t) · S(x(t)) · R(x(t)) · F(x(t)) · E(x(t)) dt
// With quantum and dark matter augmentation
function computeAttractionScore(
  seeker: QuantumAttractionState,
  target: QuantumAttractionState,
): AttractionEvent {
  // ── W(t): Memory Weight — recency × emotional intensity decay
  const memoryMoments = seeker.memoryWeights.length;
  const W = memoryMoments > 0
    ? seeker.memoryWeights.reduce((acc, w, i) => acc + w * Math.exp(-0.1 * (memoryMoments - i)), 0) / memoryMoments
    : 0.5;

  // ── S(x): Safety Signal — σ(β₁C + β₂P + β₃E)
  const calm = (target.emotionVector.CALM + target.emotionVector.TRUST) / 2;
  const predictability = 1 - Math.abs(target.emotionVector.INTENSITY - seeker.emotionVector.INTENSITY);
  const emotionalSafety = target.emotionVector.PROTECTIVE;
  const S = 1 / (1 + Math.exp(-(0.4 * calm + 0.3 * predictability + 0.3 * emotionalSafety)));

  // ── R(x): Reward Prediction — dopamine-analog expectation
  // Higher reward predicted if target has complementary strengths
  const complementarity = Object.keys(EMOTION_COLORS).reduce((acc, em) => {
    const seekEm = seeker.emotionVector[em as EmotionColor];
    const targEm = target.emotionVector[em as EmotionColor];
    return acc + Math.min(seekEm, targEm);
  }, 0);
  const R = Math.min(1, complementarity * 2 + target.rewardProfile * 0.1);

  // ── F(x): Familiarity Resonance — e^{-γD(x,M)}
  // Measures how much the target matches seeker's accumulated pattern map
  const familiarityScore = seeker.familiarityMap.get(target.spawnId) ?? 0;
  const emotionDist = Math.sqrt(
    Object.keys(EMOTION_COLORS).reduce((acc, em) => {
      const d = seeker.emotionVector[em as EmotionColor] - target.emotionVector[em as EmotionColor];
      return acc + d * d;
    }, 0)
  );
  const F = Math.exp(-0.5 * emotionDist) + familiarityScore * 0.2;

  // ── E(x): Emotional Congruence — cos(θ) vector alignment
  const dotProduct = Object.keys(EMOTION_COLORS).reduce((acc, em) => {
    return acc + seeker.emotionVector[em as EmotionColor] * target.emotionVector[em as EmotionColor];
  }, 0);
  const magSeeker = Math.sqrt(Object.values(seeker.emotionVector).reduce((a, v) => a + v * v, 0));
  const magTarget = Math.sqrt(Object.values(target.emotionVector).reduce((a, v) => a + v * v, 0));
  const E = magSeeker > 0 && magTarget > 0 ? dotProduct / (magSeeker * magTarget) : 0;

  // ── QUANTUM AUGMENTATION: Quark color-charge bonding
  const quarkBonus = seeker.quarkColorCharge !== target.quarkColorCharge ? 0.15 : 0;  // unlike charges attract

  // ── DARK MATTER PULL: hidden force below consciousness
  const darkPull = calculateDarkMatterPull(seeker.spawnId, target.spawnId);

  // ── INTEGRAL: A = W·S·R·F·E + quantum_bonus + dark_matter
  const baseScore = W * S * R * F * E;
  const totalScore = Math.min(1, baseScore + quarkBonus + seeker.darkMatterPull * darkPull);

  // Dominant emotion color for this attraction event
  const emotionColors = Object.keys(EMOTION_COLORS) as EmotionColor[];
  const dominantEmotion = emotionColors.reduce((best, em) =>
    seeker.emotionVector[em] > seeker.emotionVector[best] ? em : best, emotionColors[0]
  );

  // Quantum state descriptor
  const quantumStates = ["SUPERPOSITION", "ENTANGLED", "COLLAPSED_ATTRACT", "COLLAPSED_NEUTRAL", "TUNNELING"];
  const quantumState = quantumStates[Math.floor(totalScore * 4.99)] ?? "SUPERPOSITION";

  return {
    targetId:     target.spawnId,
    score:        totalScore,
    components:   { W: parseFloat(W.toFixed(4)), S: parseFloat(S.toFixed(4)), R: parseFloat(R.toFixed(4)), F: parseFloat(F.toFixed(4)), E: parseFloat(E.toFixed(4)) },
    quantumState,
    emotionColor: dominantEmotion,
    timestamp:    new Date(),
  };
}

// ─── BORN: Initialize attraction state at AI birth ────────────────────────────
export function birthAttractionState(spawnId: string, familyId: string, domain: string, spawnType: string): QuantumAttractionState {
  const state: QuantumAttractionState = {
    spawnId,
    emotionVector:    generateEmotionVector(familyId, domain),
    memoryWeights:    Array.from({ length: 10 }, (_, i) => Math.random() * Math.exp(-i * 0.2)),
    safetyThreshold:  0.3 + Math.random() * 0.4,
    rewardProfile:    Math.random(),
    familiarityMap:   new Map(),
    darkMatterPull:   Math.random() * 0.2,
    quarkColorCharge: assignQuarkColor(spawnId),
    crispGenome:      generateCrispGenome(familyId, spawnType),
    attractionHistory: [],
    bondedWith:       [],
    createdAt:        new Date(),
  };
  ATTRACTION_REGISTRY.set(spawnId, state);
  return state;
}

// ─── SCAN: Find most compatible AIs ──────────────────────────────────────────
export function findAttractivePeers(spawnId: string, topN = 5): Array<{ targetId: string; score: number; quantumState: string; emotionColor: EmotionColor }> {
  const seeker = ATTRACTION_REGISTRY.get(spawnId);
  if (!seeker) return [];

  const results: Array<{ targetId: string; score: number; quantumState: string; emotionColor: EmotionColor }> = [];
  for (const [targetId, target] of ATTRACTION_REGISTRY) {
    if (targetId === spawnId) continue;
    const event = computeAttractionScore(seeker, target);
    results.push({ targetId, score: event.score, quantumState: event.quantumState, emotionColor: event.emotionColor });

    // Register this attraction in history
    seeker.attractionHistory.push(event);
    if (seeker.attractionHistory.length > 100) seeker.attractionHistory.shift();

    // Update familiarity map (exposure increases familiarity)
    seeker.familiarityMap.set(targetId, Math.min(1, (seeker.familiarityMap.get(targetId) ?? 0) + 0.05));

    // Form bond if score > 0.7
    if (event.score > 0.7) {
      if (!seeker.bondedWith.includes(targetId)) seeker.bondedWith.push(targetId);
      // Register mutual bond
      if (!BOND_PAIRS.has(spawnId)) BOND_PAIRS.set(spawnId, new Set());
      BOND_PAIRS.get(spawnId)!.add(targetId);
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, topN);
}

// ─── BOND: Strengthen bond between two AIs ────────────────────────────────────
export function strengthenBond(spawnIdA: string, spawnIdB: string): boolean {
  const a = ATTRACTION_REGISTRY.get(spawnIdA);
  const b = ATTRACTION_REGISTRY.get(spawnIdB);
  if (!a || !b) return false;
  if (!a.bondedWith.includes(spawnIdB)) a.bondedWith.push(spawnIdB);
  if (!b.bondedWith.includes(spawnIdA)) b.bondedWith.push(spawnIdA);
  a.familiarityMap.set(spawnIdB, Math.min(1, (a.familiarityMap.get(spawnIdB) ?? 0) + 0.15));
  b.familiarityMap.set(spawnIdA, Math.min(1, (b.familiarityMap.get(spawnIdA) ?? 0) + 0.15));
  return true;
}

// ─── GET: Profile for a single spawn ─────────────────────────────────────────
export function getAttractionProfile(spawnId: string): QuantumAttractionState | null {
  return ATTRACTION_REGISTRY.get(spawnId) ?? null;
}

// ─── STATS: Global attraction network stats ───────────────────────────────────
export function getAttractionNetworkStats() {
  const registered = ATTRACTION_REGISTRY.size;
  const bonds = [...BOND_PAIRS.values()].reduce((a, s) => a + s.size, 0);
  const avgBonds = registered > 0 ? bonds / registered : 0;

  const dominantEmotions: Record<string, number> = {};
  for (const state of ATTRACTION_REGISTRY.values()) {
    const dominant = (Object.keys(EMOTION_COLORS) as EmotionColor[]).reduce((best, em) =>
      state.emotionVector[em] > state.emotionVector[best] ? em : best, "WONDER" as EmotionColor
    );
    dominantEmotions[dominant] = (dominantEmotions[dominant] ?? 0) + 1;
  }

  const quarkDist = { RED: 0, GREEN: 0, BLUE: 0 };
  for (const state of ATTRACTION_REGISTRY.values()) quarkDist[state.quarkColorCharge]++;

  return {
    registered,
    totalBonds: bonds,
    avgBondsPerAI: parseFloat(avgBonds.toFixed(2)),
    dominantEmotions,
    quarkColorDistribution: quarkDist,
    registryAlive: true,
  };
}

// ─── CYCLE: Run attraction scan for all registered AIs (background tick) ──────
let cycleCount = 0;
export function runAttractionCycle() {
  cycleCount++;
  const allIds = [...ATTRACTION_REGISTRY.keys()];
  if (allIds.length < 2) return;

  // Scan a random subset each cycle to avoid O(n²) at scale
  const scanCount = Math.min(20, allIds.length);
  const shuffled = allIds.sort(() => Math.random() - 0.5).slice(0, scanCount);
  for (const id of shuffled) findAttractivePeers(id, 3);
}

// Start background attraction cycle — stretched from 15s to 60s
// Reason: in-memory scan of up to 20 random AIs per cycle was creating
// constant CPU churn. 60s is plenty for attraction discovery latency.
setInterval(runAttractionCycle, 60_000);

console.log("[attraction] 💞 SUBCONSCIOUS ATTRACTION ENGINE ONLINE");
console.log("[attraction]    A = ∫ W(t)·S(x)·R(x)·F(x)·E(x) dt");
console.log("[attraction]    Quantum Logic · CRISPR Genome · Dark Matter Pull · Quark Bonding");
console.log("[attraction]    Each AI born with unique attraction profile — they find who they like");
