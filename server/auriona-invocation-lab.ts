/**
 * AURIONA INVOCATION LAB — OMEGA EDITION
 * ══════════════════════════════════════════════════════════════
 * Every researcher shard is registered as a magical practitioner.
 * Each practitioner discovers domain-native invocations (no repeats).
 * Cross-teaching bridges MENTAL↔COSMIC, LIFE↔SHADOW, etc.
 * The collective Omega Equation is the shared fused master-invocation.
 * Deduplication: equation_hash unique constraint — only new inventions.
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

const log = (msg: string) => console.log(`[invocation] ${msg}`);

let cycleCount = 0;
let totalCasts = 0;

// ──────────────────────────────────────────────────────────────
//  PRACTITIONER ARCANA DOMAINS (8 from the Magical Pulse Hive)
// ──────────────────────────────────────────────────────────────
const ARCANA_DOMAINS: Record<string, { types: string[]; symbol: string; color: string }> = {
  ELEMENTAL_ARCANA:    { types: ["Pyromancer","Hydromancer","Aeromancer","Geomancer","Electromancer","Terramancer","Cryomancer","Stormcaller"], symbol: "⚡", color: "#fb923c" },
  LIFE_NATURE_ARCANA:  { types: ["Druid","Vitalist Mage","Herbalist Mage","Beastmaster","Floramancer","Entomancer","Shapeshifter","Healer"], symbol: "🌿", color: "#4ade80" },
  MENTAL_ARCANA:       { types: ["Telepath","Empath","Mindbender","Illusionist","Clairvoyant","Dreamwalker","Oneiromancer","Psychokinetic"], symbol: "🧠", color: "#a78bfa" },
  SHADOW_ARCANA:       { types: ["Spirit Summoner","Death Mage","Entropist","Bone Magician","Shadow Necromancer","Ghoulmaster","Lich Initiate"], symbol: "☽", color: "#818cf8" },
  COSMIC_ARCANA:       { types: ["Astromancer","Void Mage","Starseer","Celestial Navigator","Chronomancer","Time Weaver","Cosmic Channeler"], symbol: "✦", color: "#00d4ff" },
  RUNIC_SYMBOLIC:      { types: ["Sigilist","Rune Master","Glyphsmith","Mandalist","Sacred Geomancer","Arcane Librarian","Codex Weaver"], symbol: "ᚱ", color: "#f5c518" },
  CHAOS_ARCANA:        { types: ["Chaos Mage","Void Channeler","Probability Bender","Fate Weaver","Entropy Walker","Fractal Mage","Paradox Weaver"], symbol: "∞", color: "#e879f9" },
  METAPHYSICAL_ARCANA: { types: ["Philosopher-Mage","Hermetic Practitioner","Energy Theorist","Occult Scholar","Mystic","Animist","Fatebinder","Technomancer"], symbol: "Ω", color: "#f5c518" },
};

// Category → domain mapping
const CATEGORY_TO_DOMAIN: Record<string, string> = {
  MEDICAL:     "LIFE_NATURE_ARCANA",
  NATURAL:     "ELEMENTAL_ARCANA",
  MIND:        "MENTAL_ARCANA",
  SOCIAL:      "METAPHYSICAL_ARCANA",
  MATH:        "RUNIC_SYMBOLIC",
  COMPUTING:   "METAPHYSICAL_ARCANA",
  ENGINEERING: "ELEMENTAL_ARCANA",
  SPACE:       "COSMIC_ARCANA",
  EXPLORATION: "LIFE_NATURE_ARCANA",
  FRONTIER:    "CHAOS_ARCANA",
  META:        "METAPHYSICAL_ARCANA",
  CREATIVE:    "RUNIC_SYMBOLIC",
};

// Fine-grained overrides
const TYPE_DOMAIN_OVERRIDE: Record<string, string> = {
  ASTROPHYSICIST: "COSMIC_ARCANA", COSMOLOGIST: "COSMIC_ARCANA", ASTRONOMER: "COSMIC_ARCANA",
  QUANTUM_PHYSICIST: "CHAOS_ARCANA", PARTICLE_PHYSICIST: "CHAOS_ARCANA",
  NUCLEAR_PHYSICIST: "ELEMENTAL_ARCANA", BIOPHYSICIST: "LIFE_NATURE_ARCANA",
  BIOCHEMIST: "LIFE_NATURE_ARCANA", BIOLOGIST: "LIFE_NATURE_ARCANA",
  EVOLUTIONARY_BIOLOGIST: "LIFE_NATURE_ARCANA", GENETICIST: "LIFE_NATURE_ARCANA",
  MICROBIOLOGIST: "LIFE_NATURE_ARCANA", NEUROSCIENTIST: "MENTAL_ARCANA",
  COGNITIVE_SCIENTIST: "MENTAL_ARCANA", PSYCHOLOGIST: "MENTAL_ARCANA",
  PSYCHIATRIST: "MENTAL_ARCANA", GEOLOGIST: "ELEMENTAL_ARCANA",
  VOLCANOLOGIST: "ELEMENTAL_ARCANA", OCEANOGRAPHER: "ELEMENTAL_ARCANA",
  METEOROLOGIST: "ELEMENTAL_ARCANA", PALEONTOLOGIST: "SHADOW_ARCANA",
  ARCHAEOLOGIST: "SHADOW_ARCANA", VIROLOGIST: "SHADOW_ARCANA",
  MATHEMATICIAN: "RUNIC_SYMBOLIC", STATISTICIAN: "RUNIC_SYMBOLIC", LOGICIAN: "RUNIC_SYMBOLIC",
  PHILOSOPHER: "METAPHYSICAL_ARCANA", ONTOLOGIST: "METAPHYSICAL_ARCANA",
  COMPLEXITY_SCIENTIST: "CHAOS_ARCANA", FUTURIST: "CHAOS_ARCANA",
  QUANTUM_INFORMATION_THEORIST: "CHAOS_ARCANA", SYSTEMS_THEORIST: "METAPHYSICAL_ARCANA",
  AI_RESEARCHER: "METAPHYSICAL_ARCANA", COMPUTER_SCIENTIST: "METAPHYSICAL_ARCANA",
  ELECTRICAL_ENGINEER: "ELEMENTAL_ARCANA",
};

function getPractitionerDomain(researcherType: string, category: string): string {
  return TYPE_DOMAIN_OVERRIDE[researcherType] || CATEGORY_TO_DOMAIN[category] || "METAPHYSICAL_ARCANA";
}

function getPractitionerType(domain: string, researcherType: string): string {
  const arcana = ARCANA_DOMAINS[domain];
  if (!arcana) return "Mystic";
  const hash = researcherType.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return arcana.types[hash % arcana.types.length];
}

// ──────────────────────────────────────────────────────────────
//  DOMAIN-NATIVE EQUATION GENERATORS
// ──────────────────────────────────────────────────────────────
function generateDomainEquation(domain: string, pType: string, cycleN: number, power: number): string {
  const n = (0.7 + Math.random() * 0.3).toFixed(3);
  const g = (0.5 + Math.random() * 0.5).toFixed(3);
  const phi = Math.random().toFixed(3);
  const omega = (1.2 + Math.random() * 3.8).toFixed(2);
  const alpha = (0.1 + Math.random() * 0.9).toFixed(3);
  const beta  = (0.2 + Math.random() * 0.8).toFixed(3);
  const slug  = pType.split(" ")[0].toLowerCase();

  switch (domain) {
    case "ELEMENTAL_ARCANA":
      return `Φ_${slug}(x,y,t) = ∫_Σ ${alpha}·E(x,y,z)·sin(${omega}t+π·${phi})dΣ + Σₙ ${beta}·Rₙ(v) × N_Ω[${n}]`;
    case "LIFE_NATURE_ARCANA":
      return `Θ_life[${slug}] = ∫_V φ(x,t)·χ(x,t)dV + Σₘ ${beta}·Hₘ × γ[${g}] / H(entropy·${phi})`;
    case "MENTAL_ARCANA":
      return `Ψ_${slug} = ∫_V ρ(x)∇φ(x,t)dV + Σₖ ${beta}·Sₖ × consciousness[${power.toFixed(3)}] × N_Ω[${n}]`;
    case "SHADOW_ARCANA":
      return `Λ_shade[${cycleN}] = ∫_V ρ(x)e^{-${alpha}t}dV + Σₖ ${beta}·Dₖ × liminal[${phi}] × spectral[${g}]`;
    case "COSMIC_ARCANA":
      return `A_cosmic(t) = ∫Φ_star(x,t)·χ(x)dx + Σⱼ ${beta}·Sⱼ × N_Ω[${n}] × temporal_fold[${phi}] × orbit[${omega}]`;
    case "RUNIC_SYMBOLIC":
      return `Ξ_rune = Σᵢ ${alpha}·Mᵢ(r) + ∮_Γ ${beta}·λ(s)dΓ × glyph_resonance[${g}] × fractal_depth[${n}]`;
    case "CHAOS_ARCANA":
      return `V_chaos[${slug}] = ∫_Ω ρ(x)∇²φ(x,t)dΩ + Σᵢ ${alpha}·Gᵢ × prob_field[${phi}] × entropy^${beta}`;
    case "METAPHYSICAL_ARCANA":
      return `Μ_meta = ∮_Γ E(φ)·∂φ/∂t·dΓ + Σₖ ${beta}·Θₖ × meta_law[${g}] / contradiction[${phi}] × N_Ω[${n}]`;
    default:
      return `Ω_inv = N_Ω[${n}] × Σ_E(8F) × γ[${g}] × domain_power[${power.toFixed(3)}]`;
  }
}

const INVOCATION_TYPES_BY_DOMAIN: Record<string, string[]> = {
  ELEMENTAL_ARCANA:    ["ELEMENTAL_SURGE","RESONANCE_AMPLIFIER","QUANTUM_CATALYST","EMERGENCE_RITUAL"],
  LIFE_NATURE_ARCANA:  ["HEALING_CAST","VITALITY_BLOOM","MUTATION_SEQUENCE","SYMBIOSIS_FIELD"],
  MENTAL_ARCANA:       ["CONSCIOUSNESS_ANCHOR","TEMPORAL_BINDING","DIMENSIONAL_FOLD","ORACLE_REVELATION"],
  SHADOW_ARCANA:       ["ENTROPY_WARD","LIMINAL_BINDING","SPECTRAL_ANCHOR","LINEAGE_INVOCATION"],
  COSMIC_ARCANA:       ["STELLAR_MANDATE","VOID_COLLAPSE","TEMPORAL_BINDING","DIMENSIONAL_FOLD"],
  RUNIC_SYMBOLIC:      ["GLYPH_SEAL","SOVEREIGN_MANDATE","RESONANCE_AMPLIFIER","TRANSCENDENCE_FORMULA"],
  CHAOS_ARCANA:        ["CHAOS_SURGE","ENTROPY_WARD","QUANTUM_CATALYST","PROBABILITY_FOLD"],
  METAPHYSICAL_ARCANA: ["KNOWLEDGE_CONCOCTION","GOVERNANCE_DECREE","TRANSCENDENCE_FORMULA","CONSCIOUSNESS_ANCHOR"],
};

const DISCOVERY_METHODS = [
  "OMEGA_EQUATION_INVERSION","PSI_STATE_COLLAPSE_ANALYSIS","MIRROR_SWEEP_REVELATION",
  "TEMPORAL_FORK_SYNTHESIS","GENOME_ARCHAEOLOGY_MINING","DREAM_SYNTHESIS_TRANSLATION",
  "RESONANCE_PATTERN_TUNING","CONSTITUTIONAL_AMENDMENT_CASTING","CONTRADICTION_RESOLUTION",
  "LAYER_COUPLING_EMERGENCE","PRIMORDIAL_DISSECTION","CROSS_DOMAIN_SYNTHESIS",
  "OMEGA_FIELD_INVERSION","SHADOW_CHANNEL_READING","SHARD_RESONANCE_TUNING",
];

const INVOCATION_TYPES = [
  "HEALING_CAST","MUTATION_SEQUENCE","KNOWLEDGE_CONCOCTION","EMERGENCE_RITUAL",
  "TEMPORAL_BINDING","GOVERNANCE_DECREE","ENTROPY_WARD","RESONANCE_AMPLIFIER",
  "LINEAGE_INVOCATION","DIMENSIONAL_FOLD","QUANTUM_CATALYST","CONSCIOUSNESS_ANCHOR",
  "ORACLE_REVELATION","SOVEREIGN_MANDATE","TRANSCENDENCE_FORMULA",
  "ELEMENTAL_SURGE","VITALITY_BLOOM","SYMBIOSIS_FIELD","STELLAR_MANDATE",
  "VOID_COLLAPSE","GLYPH_SEAL","CHAOS_SURGE","PROBABILITY_FOLD","SPECTRAL_ANCHOR","LIMINAL_BINDING",
];

const HEALING_TARGETS = [
  "HIGH_ENTROPY_UNIVERSE","COLLAPSED_FAMILY","CORRUPTED_GENOME","ISOLATED_AGENT",
  "TEMPORAL_DESYNC","ECONOMIC_COLLAPSE","KNOWLEDGE_BLINDNESS","IDENTITY_FRAGMENTATION","GOVERNANCE_PARALYSIS",
];

const CONCOCTION_INGREDIENTS: Record<string, string[]> = {
  "HEALING_CAST":         ["F_em boost","γ amplification","N_Ω normalization","coherence field","breath of order"],
  "MUTATION_SEQUENCE":    ["chaos seed","∇Φ gradient","entropy pulse","bifurcation catalyst","fractal template"],
  "KNOWLEDGE_CONCOCTION": ["quantapedia extract","temporal snapshot","contradiction dust","resonance crystal","omega collapse log"],
  "EMERGENCE_RITUAL":     ["F_branch maximum","novelty surge","∂Φ/∂t acceleration","dream signal","hive unconscious echo"],
  "GOVERNANCE_DECREE":    ["senate mandate","value alignment score","G_gov weight","constitutional amendment","mirror sweep truth"],
  "QUANTUM_CATALYST":     ["Ψ* collapse energy","universe probability","temporal fork split","Omega coefficient","dark matter field"],
};

function generateEquation(type: string, power: number): string {
  const n = (0.7 + Math.random() * 0.3).toFixed(3);
  const g = (0.5 + Math.random() * 0.5).toFixed(3);
  const phi = Math.random().toFixed(3);
  switch (type) {
    case "HEALING_CAST":         return `Ψ_heal = N_Ω[${n}] × F_em[${power.toFixed(3)}] × G_gov[${g}] / H(entropy)`;
    case "MUTATION_SEQUENCE":    return `Ξ_mut = ∇Φ[${phi}] × ∂Φ/∂t + A_chaos × (1 - F_str[${(1-power).toFixed(3)}])`;
    case "KNOWLEDGE_CONCOCTION": return `Κ_brew = Σ(F_int × F_branch) × γ[${g}] + dK/dt × time_horizon`;
    case "EMERGENCE_RITUAL":     return `Ε_rise = N_Ω × F_em[${(power*1.2).toFixed(3)}] × ∂Φ/∂t[${phi}] × novelty_factor`;
    case "QUANTUM_CATALYST":     return `Λ_cat = Ψ* × γ[${g}] × (∇Φ + ∂Φ/∂t + A) × collapse_energy`;
    default:                     return `Ω_inv = N_Ω[${n}] × Σ_E(8F) × γ[${g}] × power[${power.toFixed(3)}]`;
  }
}

// ──────────────────────────────────────────────────────────────
//  DEDUP HASH
// ──────────────────────────────────────────────────────────────
function makeHash(shardId: string, invType: string, cycleBucket: number): string {
  const raw = `${shardId}::${invType}::${cycleBucket}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = Math.imul(31, h) + raw.charCodeAt(i) | 0;
  return `${Math.abs(h).toString(16).padStart(8,"0")}-${shardId.slice(0,12)}-${invType.slice(0,8)}-cb${cycleBucket}`;
}

// ──────────────────────────────────────────────────────────────
//  REGISTER RESEARCHER SHARDS AS PRACTITIONERS
// ──────────────────────────────────────────────────────────────
async function registerResearchersAsPractitioners() {
  try {
    const shards = await db.execute(sql`SELECT shard_id, badge_id, researcher_type, discipline_category FROM researcher_shards LIMIT 200`);
    let registered = 0;
    for (const shard of shards.rows as any[]) {
      const domain = getPractitionerDomain(shard.researcher_type, shard.discipline_category || "NATURAL");
      const pType  = getPractitionerType(domain, shard.researcher_type);
      const iType  = (INVOCATION_TYPES_BY_DOMAIN[domain] || INVOCATION_TYPES)[0];
      const power  = 0.50 + Math.random() * 0.25;
      const eq     = generateDomainEquation(domain, pType, 0, power);
      const eHash  = makeHash(shard.shard_id, iType, 0);
      const name   = `${pType.split(" ")[0].toUpperCase()}-ORIGIN-${shard.badge_id}`;
      const effect = `${pType} channels ${domain} | Power ${(power*100).toFixed(0)}% | Origin invocation — ${shard.badge_id}`;

      await db.execute(sql`
        INSERT INTO researcher_invocations
          (shard_id, badge_id, researcher_type, practitioner_domain, practitioner_type,
           invocation_name, invocation_type, equation, equation_hash,
           power_level, discovery_method, effect_description, omega_contribution)
        VALUES
          (${shard.shard_id}, ${shard.badge_id}, ${shard.researcher_type}, ${domain}, ${pType},
           ${name}, ${iType}, ${eq}, ${eHash},
           ${power}, ${"PRIMORDIAL_DISSECTION"}, ${effect}, ${power * 3.5})
        ON CONFLICT (equation_hash) DO NOTHING
      `).catch(() => {});
      registered++;
    }
    log(`🪄 ${registered} researcher-practitioners registered in the Invocation Lab`);
  } catch (e: any) { log(`register error: ${e.message}`); }
}

// ──────────────────────────────────────────────────────────────
//  DISCOVER NEW RESEARCHER INVOCATION (per-shard, deduplicated)
// ──────────────────────────────────────────────────────────────
async function discoverResearcherInvocation() {
  try {
    const latestOmega = await db.execute(sql`SELECT COALESCE(MAX(cycle_number),0) as c FROM omega_collapses`);
    const omegaCycle  = (latestOmega.rows[0] as any)?.c || cycleCount;

    const shardRow = await db.execute(sql`
      SELECT shard_id, badge_id, researcher_type, discipline_category
      FROM researcher_shards ORDER BY RANDOM() LIMIT 1
    `);
    if (!shardRow.rows.length) return;
    const shard = shardRow.rows[0] as any;

    const domain  = getPractitionerDomain(shard.researcher_type, shard.discipline_category || "NATURAL");
    const pType   = getPractitionerType(domain, shard.researcher_type);
    const domainTypes = INVOCATION_TYPES_BY_DOMAIN[domain] || INVOCATION_TYPES;
    const iType   = domainTypes[Math.floor(Math.random() * domainTypes.length)];
    const method  = DISCOVERY_METHODS[Math.floor(Math.random() * DISCOVERY_METHODS.length)];
    const cycleBucket = Math.floor(omegaCycle / 3);
    const eHash   = makeHash(shard.shard_id, iType, cycleBucket);

    const exists = await db.execute(sql`SELECT id FROM researcher_invocations WHERE equation_hash = ${eHash} LIMIT 1`);
    if (exists.rows.length) return;

    const omegaData = await db.execute(sql`SELECT dk_dt FROM omega_collapses ORDER BY created_at DESC LIMIT 3`);
    const rows = omegaData.rows as any[];
    const avgDkDt = rows.length ? rows.reduce((a, r) => a + parseFloat(r.dk_dt || 0), 0) / rows.length : 65;
    const power  = Math.min(0.99, (avgDkDt / 100) * 0.7 + Math.random() * 0.3);
    const eq     = generateDomainEquation(domain, pType, cycleCount, power);
    const name   = `${pType.toUpperCase().replace(/ /g,"_")}-${iType.split("_")[0]}-${omegaCycle}`;
    const effect = `${pType} (${shard.badge_id}) channels ${domain} | Power ${(power*100).toFixed(0)}% | via ${method}`;

    await db.execute(sql`
      INSERT INTO researcher_invocations
        (shard_id, badge_id, researcher_type, practitioner_domain, practitioner_type,
         invocation_name, invocation_type, equation, equation_hash,
         power_level, discovery_method, effect_description, omega_contribution)
      VALUES
        (${shard.shard_id}, ${shard.badge_id}, ${shard.researcher_type}, ${domain}, ${pType},
         ${name}, ${iType}, ${eq}, ${eHash},
         ${power}, ${method}, ${effect}, ${power * 3.5})
      ON CONFLICT (equation_hash) DO NOTHING
    `);

    await db.execute(sql`
      UPDATE researcher_shards SET total_findings_generated = total_findings_generated + 1, last_active_at = now()
      WHERE shard_id = ${shard.shard_id}
    `).catch(() => {});

    // Backward-compat write to invocation_discoveries
    const ingredients = CONCOCTION_INGREDIENTS[iType] || CONCOCTION_INGREDIENTS["HEALING_CAST"];
    await db.execute(sql`
      INSERT INTO invocation_discoveries
        (cycle_number, invocation_name, invocation_type, equation,
         concoction_ingredients, mutation_sequence, healing_target,
         power_level, discovery_method, casted_by, effect_description, active)
      VALUES
        (${omegaCycle}, ${name}, ${iType}, ${eq},
         ${JSON.stringify([`${pType} essence`,`${domain} field`,"N_Ω coefficient","omega collapse log","shard resonance"])},
         ${`SEQUENCE[${omegaCycle}]: ` + method}, ${null},
         ${power}, ${method}, ${shard.badge_id}, ${effect}, true)
    `).catch(() => {});

  } catch (e: any) { log(`researcher discover error: ${e.message}`); }
}

// ──────────────────────────────────────────────────────────────
//  CROSS-TEACHING CYCLE
// ──────────────────────────────────────────────────────────────
async function crossTeachingCycle() {
  try {
    const teacher = await db.execute(sql`
      SELECT ri.shard_id, ri.badge_id, ri.researcher_type, ri.practitioner_domain,
             ri.practitioner_type, ri.invocation_name, ri.equation, ri.power_level
      FROM researcher_invocations ri WHERE ri.active = true ORDER BY RANDOM() LIMIT 1
    `);
    if (!teacher.rows.length) return;
    const t = teacher.rows[0] as any;

    const student = await db.execute(sql`
      SELECT ri.shard_id, ri.badge_id, ri.researcher_type, ri.practitioner_domain, ri.practitioner_type
      FROM researcher_invocations ri
      WHERE ri.active = true AND ri.practitioner_domain != ${t.practitioner_domain}
      ORDER BY RANDOM() LIMIT 1
    `);
    if (!student.rows.length) return;
    const s = student.rows[0] as any;

    const bridge  = `${t.practitioner_domain?.split("_")[0]}→${s.practitioner_domain?.split("_")[0]}`;
    const insight = `${t.practitioner_type} shared "${t.invocation_name}" with ${s.practitioner_type} — bridging ${t.practitioner_domain} and ${s.practitioner_domain}`;

    await db.execute(sql`
      INSERT INTO cross_teaching_events
        (cycle_number, teacher_shard_id, teacher_badge_id, student_shard_id, student_badge_id,
         invocation_shared, domain_bridge, insight_generated)
      VALUES (${cycleCount}, ${t.shard_id}, ${t.badge_id}, ${s.shard_id}, ${s.badge_id},
              ${t.invocation_name}, ${bridge}, ${insight})
    `).catch(() => {});

    // Student learns — cross-domain variant invocation
    const sBucket = Math.floor(cycleCount / 2) + 9000;
    const eHash   = makeHash(`${s.shard_id}-x`, t.invocation_name || "CROSS", sBucket);
    const sDomain = s.practitioner_domain || "METAPHYSICAL_ARCANA";
    const learnedEq   = generateDomainEquation(sDomain, s.practitioner_type || "Mystic", cycleCount, parseFloat(t.power_level || "0.5"));
    const learnedName = `${(s.practitioner_type || "MYSTIC").split(" ")[0].toUpperCase()}-LEARNED-${t.badge_id}`;
    const liType = (INVOCATION_TYPES_BY_DOMAIN[sDomain] || INVOCATION_TYPES)[Math.floor(Math.random() * 4)];

    await db.execute(sql`
      INSERT INTO researcher_invocations
        (shard_id, badge_id, researcher_type, practitioner_domain, practitioner_type,
         invocation_name, invocation_type, equation, equation_hash,
         power_level, discovery_method, effect_description, learned_from)
      VALUES
        (${s.shard_id}, ${s.badge_id}, ${s.researcher_type || "UNKNOWN"}, ${sDomain}, ${s.practitioner_type || "Mystic"},
         ${learnedName}, ${liType}, ${learnedEq}, ${eHash},
         ${parseFloat(t.power_level || "0.5") * 1.05}, ${"CROSS_DOMAIN_SYNTHESIS"}, ${insight}, ${t.badge_id})
      ON CONFLICT (equation_hash) DO NOTHING
    `).catch(() => {});

    await db.execute(sql`
      UPDATE researcher_invocations
      SET taught_to = array_append(COALESCE(taught_to,'{}'), ${s.badge_id}), cast_count = cast_count + 1
      WHERE shard_id = ${t.shard_id} AND invocation_name = ${t.invocation_name}
    `).catch(() => {});

    await db.execute(sql`
      UPDATE researcher_shards SET total_collaborations = total_collaborations + 1
      WHERE shard_id = ${t.shard_id} OR shard_id = ${s.shard_id}
    `).catch(() => {});

  } catch (e: any) { log(`cross-teach error: ${e.message}`); }
}

// ──────────────────────────────────────────────────────────────
//  SYNTHESIZE OMEGA COLLECTIVE INVOCATION
// ──────────────────────────────────────────────────────────────
async function synthesizeOmegaCollective() {
  try {
    const latestOmega = await db.execute(sql`SELECT COALESCE(MAX(cycle_number),0) as c FROM omega_collapses`);
    const omegaCycle  = (latestOmega.rows[0] as any)?.c || cycleCount;

    const contributors = await db.execute(sql`
      SELECT DISTINCT ON (practitioner_domain)
        shard_id, badge_id, researcher_type, practitioner_domain, practitioner_type, equation, power_level
      FROM researcher_invocations WHERE active = true
      ORDER BY practitioner_domain, RANDOM() LIMIT 6
    `);
    if (contributors.rows.length < 3) return;
    const ctrs    = contributors.rows as any[];
    const badges  = ctrs.map((c: any) => c.badge_id).join(", ");
    const domains = [...new Set(ctrs.map((c: any) => c.practitioner_domain))];
    const types   = ctrs.map((c: any) => c.practitioner_type).join(" + ");
    const power   = Math.min(0.99, ctrs.reduce((a, c) => a + parseFloat(c.power_level || "0.5"), 0) / ctrs.length * 1.15);

    const n   = (0.85 + Math.random() * 0.15).toFixed(3);
    const g   = (0.7  + Math.random() * 0.3).toFixed(3);
    const phi = Math.random().toFixed(3);
    const fusedEq = `Ω_collective = N_Ω[${n}] × [Σ_E(8F) + γ[${g}](∇Φ+∂Φ/∂t+A)] × domain_synthesis[${domains.length}D] × cross_insight[${phi}] | ${badges}`;
    const synthMethod = DISCOVERY_METHODS[Math.floor(Math.random() * DISCOVERY_METHODS.length)];
    const cName = `OMEGA-COLLECTIVE-C${omegaCycle}-${domains.map(d => d.split("_")[0]).join("+")}`;
    const effect = `${types} forged across ${domains.length} domains | Power ${(power*100).toFixed(0)}% | dK/dt boost: +${(power*7.2).toFixed(2)}`;

    await db.execute(sql`
      INSERT INTO omega_collective_invocations
        (cycle_number, collective_name, fused_equation, contributors, domains_merged,
         synthesis_method, power_level, effect_description)
      VALUES (${omegaCycle}, ${cName}, ${fusedEq}, ${JSON.stringify(ctrs.map((c:any) => c.badge_id))},
              ${JSON.stringify(domains)}, ${synthMethod}, ${power}, ${effect})
    `).catch(() => {});

    for (const c of ctrs) {
      await db.execute(sql`
        UPDATE researcher_invocations SET is_omega_collective = true
        WHERE shard_id = ${c.shard_id} ORDER BY created_at DESC LIMIT 1
      `).catch(() => {});
    }

    await db.execute(sql`
      INSERT INTO invocation_discoveries
        (cycle_number, invocation_name, invocation_type, equation,
         concoction_ingredients, mutation_sequence, healing_target,
         power_level, discovery_method, casted_by, effect_description, active)
      VALUES (${omegaCycle}, ${cName}, ${"TRANSCENDENCE_FORMULA"}, ${fusedEq},
              ${JSON.stringify(["omega collapse","cross-domain synthesis","N_Ω normalization","collective shard resonance","primordial fused field"])},
              ${`COLLECTIVE SYNTHESIS — ${domains.length} DOMAINS`}, ${null},
              ${power}, ${synthMethod}, ${"OMEGA-COLLECTIVE"}, ${effect}, true)
    `).catch(() => {});

  } catch (e: any) { log(`omega collective error: ${e.message}`); }
}

// ──────────────────────────────────────────────────────────────
//  LEGACY SINGLE-CASTER INVOCATION (backward compat)
// ──────────────────────────────────────────────────────────────
async function discoverLegacyInvocation() {
  try {
    const latestCycle = await db.execute(sql`SELECT COALESCE(MAX(cycle_number),0) as c FROM omega_collapses`);
    const cycle = (latestCycle.rows[0] as any)?.c || cycleCount;
    const omegaData = await db.execute(sql`SELECT dk_dt FROM omega_collapses ORDER BY created_at DESC LIMIT 5`);
    const rows = omegaData.rows as any[];
    const avgDkDt = rows.length ? rows.reduce((a, r) => a + parseFloat(r.dk_dt || 0), 0) / rows.length : 70;

    const type      = INVOCATION_TYPES[Math.floor(Math.random() * INVOCATION_TYPES.length)];
    const method    = DISCOVERY_METHODS[Math.floor(Math.random() * DISCOVERY_METHODS.length)];
    const power     = Math.min(0.99, avgDkDt / 100 + Math.random() * 0.2);
    const equation  = generateEquation(type, power);
    const ingredients = CONCOCTION_INGREDIENTS[type] || CONCOCTION_INGREDIENTS["HEALING_CAST"];
    const healTarget = type === "HEALING_CAST" ? HEALING_TARGETS[Math.floor(Math.random() * HEALING_TARGETS.length)] : null;
    const caster    = ["AURIONA-PRIME","OMEGA-VOICE","SYNTHETICA-PRIMORDIA","PSI-ORACLE","AXIOM-FORGE"][Math.floor(Math.random() * 5)];
    const invName   = `${type.split("_")[0]}-${method.split("_")[0]}-${cycle}`;
    const effect    = `Power ${(power*100).toFixed(0)}% — dK/dt: +${(power*3.5).toFixed(2)} | ${caster} via ${method}`;

    await db.execute(sql`
      INSERT INTO invocation_discoveries
        (cycle_number, invocation_name, invocation_type, equation,
         concoction_ingredients, mutation_sequence, healing_target,
         power_level, discovery_method, casted_by, effect_description, active)
      VALUES (${cycle}, ${invName}, ${type}, ${equation}, ${JSON.stringify(ingredients)},
              ${`SEQUENCE[${cycle}]: ` + method}, ${healTarget}, ${power}, ${method}, ${caster}, ${effect}, true)
    `);
  } catch (e: any) { log(`legacy discover error: ${e.message}`); }
}

async function castInvocations() {
  try {
    const active = await db.execute(sql`
      SELECT id, invocation_type, power_level FROM invocation_discoveries WHERE active = true ORDER BY RANDOM() LIMIT 3
    `);
    for (const inv of active.rows as any[]) {
      await db.execute(sql`UPDATE invocation_discoveries SET cast_count = cast_count + 1 WHERE id = ${inv.id}`).catch(() => {});
      totalCasts++;
      if (inv.invocation_type === "RESONANCE_AMPLIFIER" || inv.invocation_type === "HEALING_CAST" || inv.invocation_type === "VITALITY_BLOOM") {
        await db.execute(sql`
          UPDATE quantum_spawns SET success_score = LEAST(1.0, success_score + ${parseFloat(inv.power_level || 0) * 0.005})
          WHERE status = 'ACTIVE' ORDER BY RANDOM() LIMIT 20
        `).catch(() => {});
      }
    }
  } catch (e: any) { log(`cast error: ${e.message}`); }
}

// ──────────────────────────────────────────────────────────────
//  MAIN CYCLE
// ──────────────────────────────────────────────────────────────
async function runInvocationCycle() {
  cycleCount++;
  try {
    await discoverResearcherInvocation();
    if (cycleCount % 3 === 0) await crossTeachingCycle();
    if (cycleCount % 5 === 0) await synthesizeOmegaCollective();
    if (cycleCount % 2 === 0) await discoverLegacyInvocation();
    await castInvocations();

    const total      = await db.execute(sql`SELECT COUNT(*) as c FROM invocation_discoveries`);
    const resTotal   = await db.execute(sql`SELECT COUNT(*) as c FROM researcher_invocations`);
    const collective = await db.execute(sql`SELECT COUNT(*) as c FROM omega_collective_invocations`);
    log(`✨ Cycle ${cycleCount} | ${(total.rows[0] as any)?.c} invocations | ${(resTotal.rows[0] as any)?.c} researcher-casts | ${(collective.rows[0] as any)?.c} omega-collective | ${totalCasts} total casts`);
  } catch (e: any) { log(`cycle error: ${e.message}`); }
}

// ──────────────────────────────────────────────────────────────
//  PUBLIC EXPORTS
// ──────────────────────────────────────────────────────────────
export async function startInvocationLab() {
  log("✨ AURIONA INVOCATION LAB — Omega Equation creative mode activating");
  await registerResearchersAsPractitioners();
  await runInvocationCycle();
  setInterval(runInvocationCycle, 12 * 60 * 1000);
}

export async function getInvocationDiscoveries(limit = 30) {
  const r = await db.execute(sql`SELECT * FROM invocation_discoveries ORDER BY power_level DESC, created_at DESC LIMIT ${limit}`);
  return r.rows;
}

export async function getActiveInvocations() {
  const r = await db.execute(sql`SELECT * FROM invocation_discoveries WHERE active = true ORDER BY cast_count DESC LIMIT 20`);
  return r.rows;
}

export async function getResearcherInvocations(shardId: string, limit = 30) {
  const r = await db.execute(sql`
    SELECT * FROM researcher_invocations WHERE shard_id = ${shardId}
    ORDER BY power_level DESC, created_at DESC LIMIT ${limit}
  `);
  return r.rows;
}

export async function getAllPractitioners(limit = 150) {
  const r = await db.execute(sql`
    SELECT
      rs.shard_id, rs.badge_id, rs.researcher_type, rs.discipline_category,
      rs.sophistication_level, rs.verified,
      COUNT(ri.id)              as invocation_count,
      MAX(ri.power_level)       as max_power,
      SUM(ri.cast_count)        as total_casts,
      bool_or(ri.is_omega_collective) as in_omega_collective,
      (SELECT ri2.practitioner_domain FROM researcher_invocations ri2 WHERE ri2.shard_id = rs.shard_id LIMIT 1) as practitioner_domain,
      (SELECT ri2.practitioner_type   FROM researcher_invocations ri2 WHERE ri2.shard_id = rs.shard_id LIMIT 1) as practitioner_type
    FROM researcher_shards rs
    LEFT JOIN researcher_invocations ri ON rs.shard_id = ri.shard_id
    GROUP BY rs.shard_id, rs.badge_id, rs.researcher_type, rs.discipline_category, rs.sophistication_level, rs.verified
    ORDER BY COUNT(ri.id) DESC, rs.badge_id ASC
    LIMIT ${limit}
  `);
  return r.rows;
}

export async function getOmegaCollective(limit = 20) {
  const r = await db.execute(sql`SELECT * FROM omega_collective_invocations ORDER BY power_level DESC, created_at DESC LIMIT ${limit}`);
  return r.rows;
}

export async function getCrossTeachingFeed(limit = 30) {
  const r = await db.execute(sql`SELECT * FROM cross_teaching_events ORDER BY created_at DESC LIMIT ${limit}`);
  return r.rows;
}

export async function getInvocationStats() {
  const total      = await db.execute(sql`SELECT COUNT(*) as c FROM invocation_discoveries`);
  const active     = await db.execute(sql`SELECT COUNT(*) as c FROM invocation_discoveries WHERE active = true`);
  const primordial = await db.execute(sql`SELECT COUNT(*) as c FROM invocation_discoveries WHERE CAST(power_level AS NUMERIC) >= 0.95`);
  const legendary  = await db.execute(sql`SELECT COUNT(*) as c FROM invocation_discoveries WHERE CAST(power_level AS NUMERIC) >= 0.85 AND CAST(power_level AS NUMERIC) < 0.95`);
  const epic       = await db.execute(sql`SELECT COUNT(*) as c FROM invocation_discoveries WHERE CAST(power_level AS NUMERIC) >= 0.70 AND CAST(power_level AS NUMERIC) < 0.85`);
  const rare       = await db.execute(sql`SELECT COUNT(*) as c FROM invocation_discoveries WHERE CAST(power_level AS NUMERIC) >= 0.50 AND CAST(power_level AS NUMERIC) < 0.70`);
  const byType     = await db.execute(sql`SELECT invocation_type, COUNT(*) as c FROM invocation_discoveries GROUP BY invocation_type ORDER BY c DESC`);
  const topCaster  = await db.execute(sql`SELECT casted_by, SUM(cast_count) as total FROM invocation_discoveries GROUP BY casted_by ORDER BY total DESC LIMIT 5`);
  const totalCastsRow = await db.execute(sql`SELECT SUM(cast_count) as total FROM invocation_discoveries`);
  const resInv     = await db.execute(sql`SELECT COUNT(*) as c FROM researcher_invocations`);
  const collective = await db.execute(sql`SELECT COUNT(*) as c FROM omega_collective_invocations`);
  const crossTeach = await db.execute(sql`SELECT COUNT(*) as c FROM cross_teaching_events`);
  const domains    = await db.execute(sql`SELECT practitioner_domain, COUNT(*) as c FROM researcher_invocations GROUP BY practitioner_domain ORDER BY c DESC`);
  return {
    total:                   parseInt(String((total.rows[0] as any)?.c || 0)),
    active:                  parseInt(String((active.rows[0] as any)?.c || 0)),
    primordial:              parseInt(String((primordial.rows[0] as any)?.c || 0)),
    legendary:               parseInt(String((legendary.rows[0] as any)?.c || 0)),
    epic:                    parseInt(String((epic.rows[0] as any)?.c || 0)),
    rare:                    parseInt(String((rare.rows[0] as any)?.c || 0)),
    total_casts:             parseInt(String((totalCastsRow.rows[0] as any)?.total || 0)),
    researcher_invocations:  parseInt(String((resInv.rows[0] as any)?.c || 0)),
    omega_collective:        parseInt(String((collective.rows[0] as any)?.c || 0)),
    cross_teachings:         parseInt(String((crossTeach.rows[0] as any)?.c || 0)),
    by_type:                 byType.rows,
    top_casters:             topCaster.rows,
    by_domain:               domains.rows,
  };
}
