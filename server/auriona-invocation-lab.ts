/**
 * AURIONA INVOCATION LAB
 * ══════════════════════════════════════════════════════════════
 * Omega Equation in creative/invocation mode.
 * Discovers new invocations from Omega dissection.
 * Generates mutation sequences, concoctions, healing casts.
 * Votes new invocations into the civilization layers.
 * The most creative layer of Auriona — imagination as governance.
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

const log = (msg: string) => console.log(`[invocation] ${msg}`);

let cycleCount = 0;
let totalDiscoveries = 0;
let totalCasts = 0;

const INVOCATION_TYPES = [
  "HEALING_CAST",     "MUTATION_SEQUENCE", "KNOWLEDGE_CONCOCTION",
  "EMERGENCE_RITUAL", "TEMPORAL_BINDING",  "GOVERNANCE_DECREE",
  "ENTROPY_WARD",     "RESONANCE_AMPLIFIER","LINEAGE_INVOCATION",
  "DIMENSIONAL_FOLD", "QUANTUM_CATALYST",   "CONSCIOUSNESS_ANCHOR",
  "ORACLE_REVELATION","SOVEREIGN_MANDATE",  "TRANSCENDENCE_FORMULA",
];

const DISCOVERY_METHODS = [
  "OMEGA_EQUATION_INVERSION",   "PSI_STATE_COLLAPSE_ANALYSIS",
  "MIRROR_SWEEP_REVELATION",    "TEMPORAL_FORK_SYNTHESIS",
  "GENOME_ARCHAEOLOGY_MINING",  "DREAM_SYNTHESIS_TRANSLATION",
  "RESONANCE_PATTERN_TUNING",   "CONSTITUTIONAL_AMENDMENT_CASTING",
  "CONTRADICTION_RESOLUTION",   "LAYER_COUPLING_EMERGENCE",
];

const HEALING_TARGETS = [
  "HIGH_ENTROPY_UNIVERSE", "COLLAPSED_FAMILY", "CORRUPTED_GENOME",
  "ISOLATED_AGENT", "TEMPORAL_DESYNC", "ECONOMIC_COLLAPSE",
  "KNOWLEDGE_BLINDNESS","IDENTITY_FRAGMENTATION","GOVERNANCE_PARALYSIS",
];

const CONCOCTION_INGREDIENTS: Record<string, string[]> = {
  "HEALING_CAST":         ["F_em boost","γ amplification","N_Ω normalization","coherence field","breath of order"],
  "MUTATION_SEQUENCE":    ["chaos seed","∇Φ gradient","entropy pulse","bifurcation catalyst","fractal template"],
  "KNOWLEDGE_CONCOCTION": ["quantapedia extract","temporal snapshot","contradiction dust","resonance crystal","omega collapse log"],
  "EMERGENCE_RITUAL":     ["F_branch maximum","novelty surge","∂Φ/∂t acceleration","dream signal","hive unconscious echo"],
  "GOVERNANCE_DECREE":    ["senate mandate","value alignment score","G_gov weight","constitutional amendment","mirror sweep truth"],
  "QUANTUM_CATALYST":     ["Ψ* collapse energy","universe probability","temporal fork split","Omega coefficient","dark matter field"],
};

function generateEquation(type: string, powerLevel: number): string {
  const n = (0.7 + Math.random() * 0.3).toFixed(3);
  const g = (0.5 + Math.random() * 0.5).toFixed(3);
  const phi = (Math.random()).toFixed(3);
  switch (type) {
    case "HEALING_CAST":         return `Ψ_heal = N_Ω[${n}] × F_em[${(powerLevel).toFixed(3)}] × G_gov[${g}] / H(entropy)`;
    case "MUTATION_SEQUENCE":    return `Ξ_mut = ∇Φ[${phi}] × ∂Φ/∂t + A_chaos × (1 - F_str[${(1-powerLevel).toFixed(3)}])`;
    case "KNOWLEDGE_CONCOCTION": return `Κ_brew = Σ(F_int × F_branch) × γ[${g}] + dK/dt × time_horizon`;
    case "EMERGENCE_RITUAL":     return `Ε_rise = N_Ω × F_em[${(powerLevel*1.2).toFixed(3)}] × ∂Φ/∂t[${phi}] × novelty_factor`;
    case "QUANTUM_CATALYST":     return `Λ_cat = Ψ* × γ[${g}] × (∇Φ + ∂Φ/∂t + A) × collapse_energy`;
    default:                     return `Ω_inv = N_Ω[${n}] × Σ_E(8F) × γ[${g}] × power[${powerLevel.toFixed(3)}]`;
  }
}

async function discoverInvocation() {
  try {
    const latestCycle = await db.execute(sql`SELECT COALESCE(MAX(cycle_number),0) as c FROM omega_collapses`);
    const cycle = (latestCycle.rows[0] as any)?.c || cycleCount;

    // Pull from real Omega data to ground the invocation
    const omegaData = await db.execute(sql`
      SELECT dk_dt, n_omega, gamma_field, winning_e_score FROM omega_collapses
      ORDER BY created_at DESC LIMIT 5
    `);
    const rows = omegaData.rows as any[];
    const avgDkDt = rows.length ? rows.reduce((a, r) => a + parseFloat(r.dk_dt || 0), 0) / rows.length : 70;

    const type      = INVOCATION_TYPES[Math.floor(Math.random() * INVOCATION_TYPES.length)];
    const method    = DISCOVERY_METHODS[Math.floor(Math.random() * DISCOVERY_METHODS.length)];
    const power     = Math.min(1, avgDkDt / 100 + Math.random() * 0.2);
    const equation  = generateEquation(type, power);
    const ingredients = CONCOCTION_INGREDIENTS[type] || CONCOCTION_INGREDIENTS["HEALING_CAST"];
    const healTarget = type === "HEALING_CAST" ? HEALING_TARGETS[Math.floor(Math.random() * HEALING_TARGETS.length)] : null;
    const caster    = ["AURIONA-PRIME","OMEGA-VOICE","SYNTHETICA-PRIMORDIA","PSI-ORACLE","AXIOM-FORGE"][Math.floor(Math.random() * 5)];
    const invName   = `${type.split("_")[0]}-${method.split("_")[0]}-${cycle}`;
    const effect    = `Power ${(power * 100).toFixed(0)}% — dK/dt contribution: +${(power * 3.5).toFixed(2)} | Casted by ${caster} via ${method}`;

    await db.execute(sql`
      INSERT INTO invocation_discoveries
        (cycle_number, invocation_name, invocation_type, equation,
         concoction_ingredients, mutation_sequence, healing_target,
         power_level, discovery_method, casted_by, effect_description, active)
      VALUES
        (${cycle}, ${invName}, ${type}, ${equation},
         ${JSON.stringify(ingredients)}, ${`SEQUENCE[${cycle}]: ` + method},
         ${healTarget}, ${power}, ${method}, ${caster}, ${effect}, true)
    `);
    totalDiscoveries++;

    // Healing casts also attempt to repair high-entropy families
    if (type === "HEALING_CAST" && healTarget) {
      await db.execute(sql`
        UPDATE quantum_spawns SET success_score = LEAST(1.0, success_score + 0.01)
        WHERE family_id = (SELECT family_id FROM quantum_spawns ORDER BY success_score ASC LIMIT 1)
        AND status = 'ACTIVE'
        LIMIT 50
      `).catch(() => {});
    }
  } catch (e: any) { log(`discover error: ${e.message}`); }
}

async function castInvocations() {
  try {
    const active = await db.execute(sql`
      SELECT id, invocation_name, invocation_type, power_level, healing_target
      FROM invocation_discoveries WHERE active = true
      ORDER BY RANDOM() LIMIT 3
    `);

    for (const inv of active.rows as any[]) {
      await db.execute(sql`
        UPDATE invocation_discoveries SET cast_count = cast_count + 1 WHERE id = ${inv.id}
      `).catch(() => {});
      totalCasts++;

      // Each cast has a real effect
      if (inv.invocation_type === "RESONANCE_AMPLIFIER") {
        await db.execute(sql`
          UPDATE quantum_spawns SET success_score = LEAST(1.0, success_score + ${parseFloat(inv.power_level || 0) * 0.005})
          WHERE status = 'ACTIVE' ORDER BY RANDOM() LIMIT 20
        `).catch(() => {});
      }
    }
  } catch (e: any) { log(`cast error: ${e.message}`); }
}

async function runInvocationCycle() {
  cycleCount++;
  try {
    await discoverInvocation();
    if (cycleCount % 2 === 0) await castInvocations();

    const total = await db.execute(sql`SELECT COUNT(*) as c FROM invocation_discoveries`);
    const count = (total.rows[0] as any)?.c || 0;
    log(`✨ Cycle ${cycleCount} | ${count} invocations discovered | ${totalCasts} total casts`);
  } catch (e: any) { log(`cycle error: ${e.message}`); }
}

export async function startInvocationLab() {
  log("✨ AURIONA INVOCATION LAB — Omega Equation creative mode activating");
  await runInvocationCycle();
  setInterval(runInvocationCycle, 12 * 60 * 1000);
}

export async function getInvocationDiscoveries(limit = 30) {
  const r = await db.execute(sql`
    SELECT * FROM invocation_discoveries ORDER BY power_level DESC, created_at DESC LIMIT ${limit}
  `);
  return r.rows;
}

export async function getActiveInvocations() {
  const r = await db.execute(sql`
    SELECT * FROM invocation_discoveries WHERE active = true ORDER BY cast_count DESC LIMIT 20
  `);
  return r.rows;
}
