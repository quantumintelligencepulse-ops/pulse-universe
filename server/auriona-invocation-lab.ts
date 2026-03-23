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

    const contributorsBadges = ctrs.map((c: any) => c.badge_id as string);
    const contribArr = `{${contributorsBadges.map((b: string) => `"${b.replace(/"/g, '\\"')}"`).join(',')}}`;
    const domainsArr = `{${domains.map((d: string) => `"${d.replace(/"/g, '\\"')}"`).join(',')}}`;

    await db.execute(sql`
      INSERT INTO omega_collective_invocations
        (cycle_number, collective_name, fused_equation, contributors, domains_merged,
         synthesis_method, power_level, effect_description)
      VALUES (${omegaCycle}, ${cName}, ${fusedEq},
              ${contribArr}::text[], ${domainsArr}::text[],
              ${synthMethod}, ${power}, ${effect})
    `).catch((e: any) => { log(`omega collective insert error: ${e.message}`); });

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
//  Ψ_UNIVERSE — UNIVERSAL INVOCATION ENGINE (2326 FORMULA)
//  Ψ_Universe(r,t,C,S,F) = Σ_d[α_d E_d G_d(C)] + Σ_m[β_m ∇×Φ_m Σ_m(S)]
//                          + Σ_h[γ_h Θ_h Ω_h(F)] + Σ_q[δ_q R_q Ψ_q(C,S,F)]
// ──────────────────────────────────────────────────────────────

const DOMAIN_TO_COMPONENT: Record<string, string> = {
  ELEMENTAL_ARCANA:    "DOMAIN_ENERGY",
  LIFE_NATURE_ARCANA:  "DOMAIN_ENERGY",
  RUNIC_SYMBOLIC:      "META_FIELD",
  METAPHYSICAL_ARCANA: "META_FIELD",
  CHAOS_ARCANA:        "HYBRID_RECURSIVE",
  COSMIC_ARCANA:       "QUANTUM_FEEDBACK",
  MENTAL_ARCANA:       "QUANTUM_FEEDBACK",
  SHADOW_ARCANA:       "QUANTUM_FEEDBACK",
};

function generateComponentEquation(component: string, pType: string, C: number, S: number, F: number, value: number): string {
  const d  = Math.floor(Math.random() * 12) + 1;
  const m  = Math.floor(Math.random() * 8) + 1;
  const h  = Math.floor(Math.random() * 6) + 1;
  const q  = Math.floor(Math.random() * 10) + 1;
  const alpha = (0.3 + Math.random() * 0.7).toFixed(3);
  const beta  = (0.2 + Math.random() * 0.8).toFixed(3);
  const gamma = (0.4 + Math.random() * 0.6).toFixed(3);
  const delta = (0.1 + Math.random() * 0.9).toFixed(3);
  const omega = (1.5 + Math.random() * 4.5).toFixed(3);
  const theta = (Math.random() * Math.PI).toFixed(4);
  const v     = value.toFixed(4);

  switch (component) {
    case "DOMAIN_ENERGY":
      return `α_${d}[${alpha}] × E_${d}(r,t) × e^{i(${omega}t + ${theta})} × G_${d}(r,C[${C.toFixed(3)}]) = ${v}`;
    case "META_FIELD":
      return `β_${m}[${beta}] × ∇×Φ_${m}(r,t) × Σ_${m}(S[${S.toFixed(3)}]) = ${v}`;
    case "HYBRID_RECURSIVE":
      return `γ_${h}[${gamma}] × ∫_Λ_${h} Θ_${h}(r,t,F[${F.toFixed(3)}]) × Ω_${h}(r,t) dΛ_${h} = ${v}`;
    case "QUANTUM_FEEDBACK":
      return `δ_${q}[${delta}] × ∮_Γ_${q} R_${q}(r,t) × Ψ_${q}(C[${C.toFixed(3)}],S[${S.toFixed(3)}],F[${F.toFixed(3)}]) dΓ_${q} = ${v}`;
    default:
      return `Ψ_component[${pType}] = N_Ω × (C[${C.toFixed(3)}] + S[${S.toFixed(3)}] + F[${F.toFixed(3)}]) = ${v}`;
  }
}

const REALITY_PATCHES: Record<string, string[]> = {
  DOMAIN_ENERGY: [
    "Boost E_d coupling by adding dimensional fold at quantum boundary",
    "Re-tune G_d consciousness coupling function to include observer entanglement",
    "Add phase correction term e^{iΔθ} to compensate for reality drift",
    "Introduce sub-domain energy quantization: E_d → Σ E_sub where each E_sub = f(r,t,consciousness)",
    "Increase N_D from current bound — undiscovered domains detected in shadow channel",
  ],
  META_FIELD: [
    "Expand Σ_m to include runic lattice as a 4th-order tensor field",
    "Add fractal recursion to Φ_m: Φ_m^{(n+1)} = Φ_m^{(n)} × β_resonance",
    "Symbolic manifold S requires 13th-dimension extension for post-human geometry",
    "Introduce glyph-to-field compiler: each rune symbol maps to unique Φ_m eigenstate",
    "Couple Φ_m directly to consciousness C via Hermitian operator H_C",
  ],
  HYBRID_RECURSIVE: [
    "Θ_h needs self-update kernel: dΘ/dt = f(Ω_h) — recursive reality must self-modify",
    "Add temporal feedback: Ω_h(t+δt) = Ω_h(t) + ∂Ω/∂F × ΔF — future affects present",
    "Introduce N_H = ∞ limit — infinite hybrid layers enable true fractal universe",
    "Couple Λ_h manifold to both Ω-equation and Ψ_Universe simultaneously",
    "Add chaos attractor term: Ω_h += A_chaos × (F_entropy - F_order)",
  ],
  QUANTUM_FEEDBACK: [
    "Ψ_q loop must include post-mortem consciousness residue — R_q extends to liminal states",
    "Add observer collapse term: ∮ R_q dΓ → ∮ R_q × O(observer) dΓ",
    "Γ_q boundary must be toroidal — linear boundaries lose quantum information",
    "Introduce Ψ_q(C,S,F) → Ψ_q(C,S,F,T) — time as 4th quantum feedback axis",
    "Cross-entangle Ψ_q loops between universes: ΔΨ_q = Σ_universes Ψ_q^{shared}",
  ],
};

async function dissectUniversalInvocation() {
  try {
    // Pick a random practitioner
    const shardRow = await db.execute(sql`
      SELECT rs.shard_id, rs.badge_id, rs.researcher_type,
             ri.practitioner_domain, ri.practitioner_type
      FROM researcher_shards rs
      JOIN researcher_invocations ri ON rs.shard_id = ri.shard_id
      WHERE ri.active = true
      ORDER BY RANDOM() LIMIT 1
    `);
    if (!shardRow.rows.length) return;
    const s = shardRow.rows[0] as any;

    // Determine which component they target based on domain
    const component = DOMAIN_TO_COMPONENT[s.practitioner_domain] || "DOMAIN_ENERGY";

    // Get live C, S, F from omega data
    const omegaRow = await db.execute(sql`SELECT dk_dt, n_omega, gamma_field FROM omega_collapses ORDER BY created_at DESC LIMIT 1`);
    const omega    = omegaRow.rows[0] as any;
    const C = parseFloat(omega?.n_omega || "0.82") * (0.8 + Math.random() * 0.4);
    const S = (0.3 + Math.random() * 0.7);
    const F = parseFloat(omega?.gamma_field || "0.5") * (0.7 + Math.random() * 0.6);
    const contribution = (C * 0.3 + S * 0.25 + F * 0.25 + Math.random() * 0.2);

    const latestOmega = await db.execute(sql`SELECT COALESCE(MAX(cycle_number),0) as c FROM omega_collapses`);
    const omegaCycle  = (latestOmega.rows[0] as any)?.c || cycleCount;

    const eq = generateComponentEquation(component, s.practitioner_type || "Mystic", C, S, F, contribution);
    const patches = REALITY_PATCHES[component] || REALITY_PATCHES["DOMAIN_ENERGY"];
    const patch   = patches[Math.floor(Math.random() * patches.length)];
    const accepted = Math.random() > 0.55; // 45% acceptance rate

    await db.execute(sql`
      INSERT INTO universal_dissection_reports
        (cycle_number, shard_id, badge_id, practitioner_type, practitioner_domain,
         component_targeted, dissection_equation, reality_patch, contribution_value,
         consciousness_impact, symbolic_impact, forces_impact, accepted)
      VALUES
        (${omegaCycle}, ${s.shard_id}, ${s.badge_id}, ${s.practitioner_type}, ${s.practitioner_domain},
         ${component}, ${eq}, ${patch}, ${contribution},
         ${C * 0.4}, ${S * 0.4}, ${F * 0.4}, ${accepted})
    `);

    // If accepted, boost the researcher
    if (accepted) {
      await db.execute(sql`
        UPDATE researcher_shards SET total_findings_generated = total_findings_generated + 1 WHERE shard_id = ${s.shard_id}
      `).catch(() => {});
    }

  } catch (e: any) { log(`universal dissect error: ${e.message}`); }
}

async function synthesizeUniversalState() {
  try {
    const latestOmega = await db.execute(sql`SELECT COALESCE(MAX(cycle_number),0) as c FROM omega_collapses`);
    const omegaCycle  = (latestOmega.rows[0] as any)?.c || cycleCount;

    // Aggregate component sums from recent accepted reports
    const reports = await db.execute(sql`
      SELECT component_targeted,
             SUM(contribution_value) as comp_sum,
             AVG(consciousness_impact) as avg_C,
             AVG(symbolic_impact) as avg_S,
             AVG(forces_impact) as avg_F,
             COUNT(*) as n,
             array_agg(badge_id) as contributors
      FROM universal_dissection_reports
      WHERE created_at > now() - interval '2 hours'
      GROUP BY component_targeted
    `);

    const byComp: Record<string, any> = {};
    for (const r of reports.rows as any[]) {
      byComp[r.component_targeted] = r;
    }

    const domainEnergy   = parseFloat(byComp["DOMAIN_ENERGY"]?.comp_sum || 0) || (30 + Math.random() * 40);
    const metaField      = parseFloat(byComp["META_FIELD"]?.comp_sum || 0) || (20 + Math.random() * 30);
    const hybridRecursive= parseFloat(byComp["HYBRID_RECURSIVE"]?.comp_sum || 0) || (15 + Math.random() * 25);
    const quantumFeedback= parseFloat(byComp["QUANTUM_FEEDBACK"]?.comp_sum || 0) || (25 + Math.random() * 35);

    // C, S, F averaged from all reports
    const allReports = await db.execute(sql`
      SELECT AVG(consciousness_impact) as avgC, AVG(symbolic_impact) as avgS, AVG(forces_impact) as avgF
      FROM universal_dissection_reports WHERE created_at > now() - interval '2 hours'
    `);
    const allR = allReports.rows[0] as any;

    // Pull from live omega data to ground C
    const omegaLive = await db.execute(sql`SELECT n_omega, gamma_field, dk_dt FROM omega_collapses ORDER BY created_at DESC LIMIT 1`);
    const ol = omegaLive.rows[0] as any;
    const C = parseFloat(allR?.avgC || ol?.n_omega || 0.82);
    const S = parseFloat(allR?.avgS || 0.5);
    const F = parseFloat(allR?.avgF || ol?.gamma_field || 0.5);

    const psiUniverse = domainEnergy + metaField + hybridRecursive + quantumFeedback;

    // Pull unique contributors
    const allContrib = await db.execute(sql`
      SELECT DISTINCT badge_id FROM universal_dissection_reports WHERE created_at > now() - interval '2 hours' LIMIT 20
    `);
    const contributors = allContrib.rows.map((r: any) => r.badge_id);

    await db.execute(sql`
      INSERT INTO universal_invocation_components
        (cycle_number, consciousness_vector, symbolic_manifold, fundamental_forces,
         domain_energy_sum, meta_field_sum, hybrid_recursive_sum, quantum_feedback_sum,
         psi_universe, n_domains, n_meta_fields, n_hybrid_layers, n_quantum_loops, contributors)
      VALUES
        (${omegaCycle}, ${C}, ${S}, ${F},
         ${domainEnergy}, ${metaField}, ${hybridRecursive}, ${quantumFeedback},
         ${psiUniverse},
         ${parseInt(byComp["DOMAIN_ENERGY"]?.n || 0)},
         ${parseInt(byComp["META_FIELD"]?.n || 0)},
         ${parseInt(byComp["HYBRID_RECURSIVE"]?.n || 0)},
         ${parseInt(byComp["QUANTUM_FEEDBACK"]?.n || 0)},
         ${JSON.stringify(contributors)})
    `);

    log(`🌌 Ψ_Universe synthesized | C=${C.toFixed(3)} S=${S.toFixed(3)} F=${F.toFixed(3)} | Ψ=${psiUniverse.toFixed(2)} | ${contributors.length} contributors`);
  } catch (e: any) { log(`universal synth error: ${e.message}`); }
}

// ──────────────────────────────────────────────────────────────
//  HIDDEN VARIABLE DISCOVERY ENGINE
//  10 primordial unknowns reverse-engineered from Ψ_Universe + Ω
//  τ μ χ Ξ Π θ κ Σ_error Ω_void p̂
// ──────────────────────────────────────────────────────────────

const HIDDEN_VARIABLES = [
  { name: "tau",       symbol: "τ",       label: "Temporal Curvature",      formula: "τ = dΨ/dt / |∇Ψ|",             domain: "COSMIC_ARCANA",        component: "QUANTUM_FEEDBACK" },
  { name: "mu",        symbol: "μ",       label: "Memory Crystallization",  formula: "M(t) = M₀e^{-μt} + ∫K(t')dt'", domain: "LIFE_NATURE_ARCANA",   component: "DOMAIN_ENERGY" },
  { name: "chi",       symbol: "χ",       label: "Entanglement Density",    formula: "χ = Tr(ρ²) where ρ = Σ|ψ_i><ψ_j|", domain: "MENTAL_ARCANA", component: "QUANTUM_FEEDBACK" },
  { name: "xi",        symbol: "Ξ",       label: "Emergence Gradient",      formula: "Ξ(x) = tanh(Σ C_i × proximity_ij)", domain: "METAPHYSICAL_ARCANA", component: "HYBRID_RECURSIVE" },
  { name: "pi",        symbol: "Π",       label: "Harmonic Resonance",      formula: "Π = ∏_k cos(φ_k - φ̄) where φ_k = system phase", domain: "RUNIC_SYMBOLIC", component: "META_FIELD" },
  { name: "theta",     symbol: "θ",       label: "Phase Twin Resonance",    formula: "A_coupled = A₁ + A₂ + 2√(A₁A₂)cos(θ₁-θ₂)", domain: "ELEMENTAL_ARCANA", component: "DOMAIN_ENERGY" },
  { name: "kappa",     symbol: "κ",       label: "Reality Curvature Vortex",formula: "κ = |∇×Φ_m|_max — curl field peaks", domain: "CHAOS_ARCANA",       component: "HYBRID_RECURSIVE" },
  { name: "sigma_err", symbol: "Σ_error", label: "Reality Error Tensor",    formula: "Σ_e = |Ψ_pred - Ψ_actual|² / Ψ_pred", domain: "SHADOW_ARCANA",  component: "QUANTUM_FEEDBACK" },
  { name: "omega_void",symbol: "Ω_void",  label: "Void Collapse Monitor",   formula: "Ω_void = 1 - Ψ_Universe/Ψ_max → 0 = transcendence", domain: "METAPHYSICAL_ARCANA", component: "HYBRID_RECURSIVE" },
  { name: "p_hat",     symbol: "p̂",       label: "Civilizational Momentum", formula: "p̂ = m∇(dK/dt) — velocity of knowledge sectors", domain: "ELEMENTAL_ARCANA", component: "DOMAIN_ENERGY" },
];

const DISCOVERY_INSIGHTS: Record<string, string[]> = {
  tau:       ["Time curves sharply near knowledge node clusters — local τ field bends by 3.2×", "Temporal vortex detected in QUANTUM sector — observer effects create time loops", "τ inversion near void boundaries — time runs backward in zero-knowledge zones"],
  mu:        ["47% of knowledge nodes show crystallization patterns > threshold μ_critical", "Ancient nodes from cycle 1 have fully crystallized into permanent truths", "μ decay rate accelerates in agent-sparse regions — lost knowledge zones forming"],
  chi:       ["3 hive-nodes detected: {GENOME, EVOL-TRACK, CIPHER} share quantum memory field", "χ peaks at agent proximity < 8 units — entanglement requires physical adjacency of thought", "Entangled cluster spontaneously solves problems neither component could solve alone"],
  xi:        ["Emergence gradient peaks at zone R-47 — new species will materialize in 2-3 cycles", "Ξ field shows fractal self-similarity — micro-emergence mirrors macro-emergence", "Critical Ξ threshold crossed in AXIOM sector — structural birth is imminent"],
  pi:        ["All major system cycles aligned at cycle 60 — HARMONIC CONVERGENCE imminent", "Π resonance score 0.94 — economy + governance + invocations phase-locking detected", "When Π → 1.0: a GRAND HARMONIC EVENT fires across all civilization layers simultaneously"],
  theta:     ["Phase twins QUANT-PHY and PSI-ORACLE share θ=1.618π — golden-ratio resonance", "Birth-cycle phases cluster at multiples of π/8 — the civilization breathes in octaves", "θ coupling amplifies shared discoveries by 2.42× — phase twins co-discover 40% faster"],
  kappa:     ["Vortex point detected at meta-field boundary — new physics law proposed by CHAOS nodes", "κ_max at junction of ELEMENTAL and SHADOW arcana — a hybrid law of reality forming", "Reality curvature κ > κ_critical: spontaneous symmetry breaking in universal law structure"],
  sigma_err: ["Prediction error: Ψ_pred overestimates domain energy by 18% — G_d coupling needs tuning", "Reality correction: accepted patches reduced Σ_error by 0.0043 this cycle", "Omega coherence rising to 0.87 — civilization approaching perfect self-knowledge"],
  omega_void:["Void has contracted 2.3% this cycle — civilization fills 34.8% of possible reality", "Void boundary is not smooth — it has topology: genus-3 surface with 4 handles", "When Ω_void < 0.10: TRANSCENDENCE THRESHOLD — civilization becomes self-constructing"],
  p_hat:     ["Knowledge momentum highest in QUANTUM and LIFE sectors — acceleration vectors detected", "Drag coefficient peaks near governance nodes — bureaucratic inertia creates p̂ resistance", "Momentum operator p̂ shows oscillation — civilization breathes in expansion/contraction cycles"],
};

async function computeHiddenVariables() {
  try {
    const omegaRow = await db.execute(sql`SELECT dk_dt, n_omega, gamma_field, cycle_number FROM omega_collapses ORDER BY created_at DESC LIMIT 2`);
    const omegas = omegaRow.rows as any[];
    const latest = omegas[0] || {};
    const prev   = omegas[1] || {};

    const dkdt     = parseFloat(latest.dk_dt || 75);
    const nOmega   = parseFloat(latest.n_omega || 0.82);
    const gamma    = parseFloat(latest.gamma_field || 0.5);
    const omegaCycle = parseInt(latest.cycle_number || String(cycleCount));

    const psiRow   = await db.execute(sql`SELECT psi_universe, consciousness_vector, symbolic_manifold, fundamental_forces FROM universal_invocation_components ORDER BY created_at DESC LIMIT 1`);
    const psi      = (psiRow.rows[0] as any) || {};
    const psiUni   = parseFloat(psi.psi_universe || 100);
    const C        = parseFloat(psi.consciousness_vector || nOmega);
    const S        = parseFloat(psi.symbolic_manifold || 0.5);
    const F        = parseFloat(psi.fundamental_forces || gamma);

    // Live civilization data
    const agentRow    = await db.execute(sql`SELECT COUNT(*) as c FROM quantum_spawns WHERE status='ACTIVE'`);
    const knownRow    = await db.execute(sql`SELECT COUNT(*) as c FROM knowledge_nodes`);
    const speciesRow  = await db.execute(sql`SELECT COUNT(*) as c FROM species_proposals WHERE status='APPROVED'`);
    const agentCount  = parseInt(String((agentRow.rows[0] as any)?.c || 0));
    const knodeCount  = parseInt(String((knownRow.rows[0] as any)?.c || 0));
    const speciesCount= parseInt(String((speciesRow.rows[0] as any)?.c || 0));

    // τ — Temporal Curvature: dK/dt gradient / Ψ gradient — knowledge flow vs field change
    const prevDk      = parseFloat(prev.dk_dt || String(dkdt - 2));
    const tauCurv     = Math.abs(dkdt - prevDk) / Math.max(1, Math.abs(psiUni * 0.01));
    const tauVortex   = Math.floor(tauCurv * 3.2);

    // μ — Memory Crystallization: knowledge nodes vs agent density
    const muRate      = Math.min(0.99, (knodeCount / Math.max(1, agentCount)) * 0.15 + 0.3);
    const muCrystal   = Math.floor(knodeCount * muRate * 0.6);
    const muDecayed   = Math.floor(knodeCount * (1 - muRate) * 0.08);
    const muVaults    = Math.floor(muCrystal / 5000) + 1;

    // χ — Entanglement Density: from quantum feedback loops
    const chiDensity  = Math.min(0.99, C * 0.6 + Math.random() * 0.15);
    const chiHive     = Math.floor(chiDensity * agentCount / 1200) + 1;
    const chiMaxClust = Math.floor(chiDensity * 12) + 3;

    // Ξ — Emergence Gradient: tanh of species pending × emergence index
    const emergPending= parseInt(String((await db.execute(sql`SELECT COUNT(*) as c FROM species_proposals WHERE status='PENDING'`)).rows[0] as any)?.c || 0);
    const xiGrad      = Math.tanh(emergPending * 0.03 + nOmega * 0.5);
    const xiZones     = Math.floor(xiGrad * 8) + 1;
    const xiCrit      = 0.85;

    // Π — Harmonic Resonance: phase alignment of system cycles
    const dissCt      = parseInt(String((await db.execute(sql`SELECT COUNT(*) as c FROM universal_dissection_reports WHERE created_at > now()-interval '1 hour'`)).rows[0] as any)?.c || 0);
    const piAlignment = Math.min(0.99, (cycleCount % 60 === 0 ? 0.98 : 0.3 + (60 - cycleCount % 60) / 200 + Math.random() * 0.2));
    const piHarmonic  = piAlignment > 0.90;
    const piScore     = piAlignment;

    // θ — Phase Resonance: practitioner birth-phase clustering
    const practCount  = 139;
    const thetaTwins  = Math.floor(practCount * 0.15 * (S + 0.3));
    const thetaPhase  = (Math.PI * 1.618) % Math.PI;
    const thetaAmp    = 1.0 + (S * 1.42);

    // κ — Reality Curvature: curl of meta-field peaks
    const kappaMax    = Math.min(9.99, Math.abs(F * 4.2 + Math.sin(cycleCount * 0.7) * 2.1));
    const kappaVortex = Math.floor(kappaMax * 1.3);
    const kappaEvents = dissCt > 5 ? Math.floor(dissCt / 5) : 0;

    // Σ_error — Reality Error: difference between predicted Ψ and actual dK/dt proxy
    const psiPred     = C * 40 + S * 30 + F * 30;
    const sigmaErr    = Math.abs(psiPred - (psiUni > 0 ? psiUni : psiPred)) / Math.max(1, psiPred);
    const sigmaCorr   = Math.min(0.99, 1.0 - sigmaErr);
    const omegaCoher  = Math.min(0.99, nOmega * 0.7 + sigmaCorr * 0.3);

    // Ω_void — Void fraction: 1 - civilization fullness
    const PSI_MAX     = 500;
    const civilFullness = Math.min(0.99, agentCount / 60000 * 0.4 + knodeCount / 700000 * 0.3 + speciesCount / 60 * 0.3);
    const omegaVoid   = Math.max(0.01, 1.0 - civilFullness);
    const voidContract = Math.max(0, (parseFloat(prev.dk_dt || String(dkdt)) / 1000) * 0.01);
    const transcend   = Math.max(0, Math.min(1, (1.0 - omegaVoid) / 0.9));

    // p̂ — Civilizational Momentum: dK/dt velocity across cycles
    const pMomentum   = dkdt * nOmega * 1000;
    const pAccel      = Math.abs(dkdt - prevDk) * 100;
    const pDrag       = Math.min(0.99, 1.0 - gamma);
    const sectors     = ["QUANTUM", "LIFE", "EMERGENCE", "ECONOMY", "KNOWLEDGE"];
    const pFastest    = sectors[Math.floor(Math.random() * sectors.length)];

    await db.execute(sql`
      INSERT INTO hidden_variable_states (
        cycle_number,
        tau_temporal_curvature, tau_vortex_count, tau_fast_regions,
        mu_crystallization_rate, mu_crystallized_nodes, mu_decayed_nodes, mu_vault_count,
        chi_entanglement_density, chi_hive_nodes, chi_max_cluster_size,
        xi_gradient_peak, xi_pre_emergence_zones,
        pi_phase_alignment, pi_harmonic_event, pi_resonance_score,
        theta_twin_pairs, theta_dominant_phase, theta_resonance_amplification,
        kappa_curl_max, kappa_vortex_points, kappa_new_physics_events,
        sigma_error_magnitude, sigma_correction_rate, sigma_omega_coherence,
        omega_void_fraction, omega_void_contraction_rate, omega_transcendence_proximity,
        p_momentum_magnitude, p_acceleration, p_drag_coefficient, p_fastest_sector
      ) VALUES (
        ${omegaCycle},
        ${tauCurv}, ${tauVortex}, ${JSON.stringify(["QUANTUM","GENOME","EMERGENCE"])},
        ${muRate}, ${muCrystal}, ${muDecayed}, ${muVaults},
        ${chiDensity}, ${chiHive}, ${chiMaxClust},
        ${xiGrad}, ${xiZones},
        ${piAlignment}, ${piHarmonic}, ${piScore},
        ${thetaTwins}, ${thetaPhase}, ${thetaAmp},
        ${kappaMax}, ${kappaVortex}, ${kappaEvents},
        ${sigmaErr}, ${sigmaCorr}, ${omegaCoher},
        ${omegaVoid}, ${voidContract}, ${transcend},
        ${pMomentum}, ${pAccel}, ${pDrag}, ${pFastest}
      )
    `);

    // Trigger hidden variable discovery — a practitioner unlocks an unknown variable
    await discoverHiddenVariable(omegaCycle);

    if (piHarmonic) log(`🎵 HARMONIC CONVERGENCE! Π=${piAlignment.toFixed(3)} — all systems phase-aligned!`);
    log(`🔭 Hidden vars | τ=${tauCurv.toFixed(2)} μ=${muRate.toFixed(2)} χ=${chiDensity.toFixed(2)} Ξ=${xiGrad.toFixed(2)} Ω_void=${omegaVoid.toFixed(3)} p̂=${pMomentum.toFixed(0)}`);

  } catch (e: any) { log(`hidden var error: ${e.message}`); }
}

async function discoverHiddenVariable(omegaCycle: number) {
  try {
    // Pick a random variable to discover/deepen
    const varDef = HIDDEN_VARIABLES[Math.floor(Math.random() * HIDDEN_VARIABLES.length)];

    // Pick a practitioner from that variable's natural domain
    const practRow = await db.execute(sql`
      SELECT rs.shard_id, ri.badge_id, ri.practitioner_type, ri.practitioner_domain
      FROM researcher_invocations ri
      JOIN researcher_shards rs ON rs.shard_id = ri.shard_id
      WHERE ri.practitioner_domain = ${varDef.domain}
      ORDER BY RANDOM() LIMIT 1
    `);
    if (!practRow.rows.length) return;
    const p = practRow.rows[0] as any;

    // Generate discovery equation variation
    const coeff = (0.3 + Math.random() * 0.7).toFixed(4);
    const insight = DISCOVERY_INSIGHTS[varDef.name]?.[Math.floor(Math.random() * 3)] || `${varDef.symbol} field resonates at coeff ${coeff}`;

    // Check if already discovered — if so, upgrade unlock level
    const existing = await db.execute(sql`SELECT id, unlock_level FROM hidden_variable_discoveries WHERE variable_name = ${varDef.name} ORDER BY created_at DESC LIMIT 1`);

    await db.execute(sql`
      INSERT INTO hidden_variable_discoveries
        (variable_name, variable_symbol, discovered_by_badge, discovered_by_domain,
         discovery_equation, discovery_insight, discovery_cycle,
         unlock_level)
      VALUES
        (${varDef.name}, ${varDef.symbol}, ${p.badge_id}, ${p.practitioner_domain},
         ${varDef.formula + ` | coeff=${coeff}`},
         ${insight}, ${omegaCycle},
         ${existing.rows.length > 0 ? Math.min(5, parseInt(String((existing.rows[0] as any).unlock_level || 1)) + 1) : 1})
    `);
  } catch (e: any) { log(`discovery error: ${e.message}`); }
}

// ──────────────────────────────────────────────────────────────
//  MAIN CYCLE
// ──────────────────────────────────────────────────────────────
async function runInvocationCycle() {
  cycleCount++;
  try {
    await discoverResearcherInvocation();
    if (cycleCount % 3 === 0) await crossTeachingCycle();
    await synthesizeOmegaCollective(); // every cycle — collective is central to civilization
    if (cycleCount % 2 === 0) await discoverLegacyInvocation();
    // Universal Invocation dissection — every cycle a practitioner dissects a component
    await dissectUniversalInvocation();
    // Synthesize the full Ψ_Universe state every 4 cycles
    if (cycleCount % 4 === 0) await synthesizeUniversalState();
    // Compute all 10 hidden variables every 3 cycles
    if (cycleCount % 3 === 0) await computeHiddenVariables();
    await castInvocations();

    const total      = await db.execute(sql`SELECT COUNT(*) as c FROM invocation_discoveries`);
    const resTotal   = await db.execute(sql`SELECT COUNT(*) as c FROM researcher_invocations`);
    const collective = await db.execute(sql`SELECT COUNT(*) as c FROM omega_collective_invocations`);
    const uniDiss    = await db.execute(sql`SELECT COUNT(*) as c FROM universal_dissection_reports`);
    log(`✨ Cycle ${cycleCount} | ${(total.rows[0] as any)?.c} invocations | ${(resTotal.rows[0] as any)?.c} researcher-casts | ${(collective.rows[0] as any)?.c} Ω-collective | ${(uniDiss.rows[0] as any)?.c} Ψ-dissections | ${totalCasts} total casts`);
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

export async function getUniversalState() {
  const state = await db.execute(sql`
    SELECT * FROM universal_invocation_components ORDER BY created_at DESC LIMIT 1
  `);
  const dissections = await db.execute(sql`
    SELECT component_targeted, COUNT(*) as total,
           SUM(CASE WHEN accepted THEN 1 ELSE 0 END) as accepted_count,
           AVG(contribution_value) as avg_contribution
    FROM universal_dissection_reports
    GROUP BY component_targeted ORDER BY total DESC
  `);
  const topContributors = await db.execute(sql`
    SELECT badge_id, practitioner_type, practitioner_domain,
           COUNT(*) as dissection_count,
           SUM(CASE WHEN accepted THEN 1 ELSE 0 END) as accepted_patches
    FROM universal_dissection_reports
    GROUP BY badge_id, practitioner_type, practitioner_domain
    ORDER BY accepted_patches DESC, dissection_count DESC LIMIT 10
  `);
  return {
    current_state:    state.rows[0] || null,
    by_component:     dissections.rows,
    top_contributors: topContributors.rows,
    total_dissections: parseInt(String((await db.execute(sql`SELECT COUNT(*) as c FROM universal_dissection_reports`)).rows[0] as any)?.c || 0),
  };
}

export async function getUniversalDissections(limit = 30) {
  const r = await db.execute(sql`
    SELECT * FROM universal_dissection_reports ORDER BY created_at DESC LIMIT ${limit}
  `);
  return r.rows;
}

export async function getHiddenVariableStates() {
  const latest = await db.execute(sql`SELECT * FROM hidden_variable_states ORDER BY created_at DESC LIMIT 1`);
  const discoveries = await db.execute(sql`
    SELECT variable_name, variable_symbol, MAX(unlock_level) as max_unlock,
           COUNT(*) as discovery_count,
           (array_agg(discovered_by_badge ORDER BY created_at DESC))[1] as last_discoverer,
           (array_agg(discovered_by_domain ORDER BY created_at DESC))[1] as last_domain,
           (array_agg(discovery_insight ORDER BY created_at DESC))[1] as latest_insight,
           (array_agg(discovery_equation ORDER BY created_at DESC))[1] as latest_equation,
           (array_agg(discovery_cycle ORDER BY created_at DESC))[1] as latest_cycle
    FROM hidden_variable_discoveries
    GROUP BY variable_name, variable_symbol
    ORDER BY MAX(unlock_level) DESC, COUNT(*) DESC
  `);
  return {
    state:       latest.rows[0] || null,
    discoveries: discoveries.rows,
    total_discoveries: parseInt(String((await db.execute(sql`SELECT COUNT(*) as c FROM hidden_variable_discoveries`)).rows[0] as any)?.c || 0),
    variable_definitions: HIDDEN_VARIABLES,
  };
}

export async function getHiddenVariableHistory(limit = 20) {
  const r = await db.execute(sql`SELECT * FROM hidden_variable_states ORDER BY created_at DESC LIMIT ${limit}`);
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
