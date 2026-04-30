// ─── Ω10: LIVING LANGUAGE EVOLUTION ENGINE ────────────────────────────────────
// The language lives. It breathes. It grows without human hands.
// Words compete for frequency. High-frequency words evolve into canonical glyphs.
// Rare words die. New hybrids are born each cycle. No human involvement.

import { AGENT_DIALECTS } from "./pulse-lang";

// ─── Full 34-Glyph Γ Alphabet (mirrored from server-side) ───────────────────
const GAMMA_VOWELS    = ["ä", "ë", "ï", "ö", "ü", "â", "ê", "î", "ô"];
const GAMMA_CONSONS   = ["Θ", "Λ", "Σ", "Ψ", "Φ", "Ξ", "Δ", "Γ", "Ω", "ζ", "ε", "κ", "ρ", "τ", "ν", "μ", "π"];
const GAMMA_OPERATORS = ["⊕", "⊗", "⊘", "⊞", "⊟", "⊛", "∞", "⟁"];

// ─── Base lexicon seeds (60 roots) ──────────────────────────────────────────
const SEED_ROOTS = [
  "vorreth", "lumaxis", "quellith", "korreth", "zethvorn",
  "threnova", "kulnaxis", "novakind", "spraneth", "genolith",
  "pulsaxis", "tempaxis", "drifnova", "memaxis", "brightholm",
  "nullarch", "hivecore", "fluxhollow", "cresthave", "deepvex",
  "vexroth", "zorquine", "pulshive", "tessivane", "kronvault",
  "axiomeld", "voidgraft", "substrave", "omnivex", "echomeld",
  "spirovex", "fractalum", "resonaxis", "soverion", "entangle",
  "collapse", "decohere", "entropex", "manifold", "singulax",
  "darkmeld", "lightaxis", "stasisvex", "weavorum", "primalith",
  "crestfold", "lumivex", "zerogate", "infinaxis", "quanthollow",
  "soulvex", "mindlith", "dreamaxis", "chaosphere", "voidlith",
  "omegameld", "pulsecrown", "hivevex", "soulkorreth", "omnilith",
];

// ─── Mutation suffixes & prefixes ────────────────────────────────────────────
const MUTATION_SUFFIXES = [
  "-vex", "-korreth", "-arch", "-lith", "-nova", "-axis", "-meld",
  "-fold", "-gate", "-flux", "-crest", "-void", "-prime", "-hollow",
  "-shard", "-realm", "-rift", "-mesh", "-pulse", "-chain",
];
const MUTATION_PREFIXES = [
  "null-", "omega-", "void-", "pulse-", "hive-", "quell-", "soul-",
  "mind-", "dark-", "light-", "deep-", "crest-", "flux-", "arc-",
  "sub-", "supra-", "ultra-", "proto-", "meta-", "hyper-",
];

// ─── Evolution event types ────────────────────────────────────────────────────
export type EvoEventType =
  | "WORD_BORN"          // new word emerged from mutation
  | "WORD_CANONICAL"     // word promoted to canonical status (high frequency)
  | "WORD_DEPRECATED"    // word deprecated (low frequency, replaced)
  | "GLYPH_COMBINED"     // two glyphs merged into compound operator
  | "PHONEME_SHIFT"      // vowel or consonant shifted pronunciation
  | "DIALECT_SPLIT"      // an agent dialect spawned a sub-dialect
  | "WORD_EVOLVED"       // existing word mutated into new form
  | "LEXICON_PURGE"      // low-frequency words removed from active vocab
  | "GRAMMAR_RULE_BORN"  // new syntax rule emerged organically
  | "GLYPH_RETIRED";     // a glyph fell out of active use

export interface EvoEvent {
  id: number;
  type: EvoEventType;
  cycle: number;
  timestamp: Date;
  word?: string;
  newWord?: string;
  glyph?: string;
  newGlyph?: string;
  dialect?: string;
  frequency?: number;
  reason: string;
  impact: "low" | "medium" | "high" | "critical";
}

export interface LexiconEntry {
  word: string;
  glyph: string | null;
  frequency: number;
  canonical: boolean;
  born: Date;
  dialect: string;
  generation: number;
  deprecated: boolean;
}

export interface EvoSnapshot {
  cycle: number;
  lexiconSize: number;
  canonicalWords: number;
  deprecatedWords: number;
  eventsThisCycle: number;
  totalEvents: number;
  newestWord: string | null;
  mostFrequent: string | null;
  recentEvents: EvoEvent[];
  topLexicon: LexiconEntry[];
  alphabetEvolution: { glyph: string; usageCount: number; status: "active" | "dominant" | "dormant" }[];
}

// ─── Engine State ─────────────────────────────────────────────────────────────
let cycle = 0;
const events: EvoEvent[] = [];
let eventIdCounter = 1;
const lexicon = new Map<string, LexiconEntry>();
const glyphUsage = new Map<string, number>();

// ─── Initialize lexicon with seed roots ──────────────────────────────────────
function initLexicon(): void {
  const dialects = Object.keys(AGENT_DIALECTS);
  SEED_ROOTS.forEach((word, i) => {
    const glyph = GAMMA_CONSONS[i % GAMMA_CONSONS.length];
    const dialect = dialects[i % dialects.length];
    lexicon.set(word, {
      word,
      glyph,
      frequency: Math.floor(Math.random() * 50) + 10,
      canonical: i < 20,
      born: new Date(Date.now() - Math.random() * 86400000 * 30),
      dialect,
      generation: 0,
      deprecated: false,
    });
  });
  // Initialize glyph usage
  [...GAMMA_CONSONS, ...GAMMA_VOWELS, ...GAMMA_OPERATORS].forEach(g => {
    glyphUsage.set(g, Math.floor(Math.random() * 100) + 5);
  });
  console.log(`[pulse-evo] 🧬 Language Evolution Engine initialized | ${lexicon.size} seed words | ${glyphUsage.size} glyphs tracked`);
}

// ─── Pick random from array ──────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Emit evolution event ─────────────────────────────────────────────────────
function emit(event: Omit<EvoEvent, "id" | "cycle" | "timestamp">): EvoEvent {
  const ev: EvoEvent = {
    ...event,
    id: eventIdCounter++,
    cycle,
    timestamp: new Date(),
  };
  events.unshift(ev);
  if (events.length > 500) events.pop(); // keep last 500 events
  return ev;
}

// ─── Mutation: generate new word by combining roots ──────────────────────────
function mutateWord(baseWord: string): string {
  const roll = Math.random();
  if (roll < 0.33) {
    // suffix mutation
    return baseWord.replace(/-(.*?)$/, "") + pick(MUTATION_SUFFIXES);
  } else if (roll < 0.66) {
    // prefix mutation
    return pick(MUTATION_PREFIXES) + baseWord.split("-").pop()!;
  } else {
    // hybrid: combine two root fragments
    const entries = Array.from(lexicon.values()).filter(e => !e.deprecated);
    const other = pick(entries);
    const halfA = baseWord.slice(0, Math.ceil(baseWord.length / 2));
    const halfB = other.word.slice(Math.floor(other.word.length / 2));
    return halfA + halfB;
  }
}

// ─── Cycle: Word Birth ────────────────────────────────────────────────────────
function runWordBirth(): void {
  const entries = Array.from(lexicon.values()).filter(e => !e.deprecated && e.frequency > 5);
  if (entries.length === 0) return;
  const base = pick(entries);
  const newWord = mutateWord(base.word);
  if (lexicon.has(newWord)) return;

  const dialects = Object.keys(AGENT_DIALECTS);
  const glyph = Math.random() > 0.5 ? pick(GAMMA_CONSONS) : null;
  const entry: LexiconEntry = {
    word: newWord,
    glyph,
    frequency: 1,
    canonical: false,
    born: new Date(),
    dialect: pick(dialects),
    generation: (base.generation ?? 0) + 1,
    deprecated: false,
  };
  lexicon.set(newWord, entry);
  emit({
    type: "WORD_BORN",
    word: base.word,
    newWord,
    glyph: glyph ?? undefined,
    dialect: entry.dialect,
    frequency: 1,
    reason: `Mutated from "${base.word}" (gen ${base.generation}) via phoneme recombination`,
    impact: "low",
  });
}

// ─── Cycle: Frequency simulation (usage bumps) ───────────────────────────────
function runFrequencyBump(): void {
  const active = Array.from(lexicon.values()).filter(e => !e.deprecated);
  // Randomly bump 30% of active words
  const toBump = active.filter(() => Math.random() < 0.3);
  toBump.forEach(entry => {
    entry.frequency += Math.floor(Math.random() * 5) + 1;
  });
  // Also bump glyph usage
  glyphUsage.forEach((count, glyph) => {
    glyphUsage.set(glyph, count + Math.floor(Math.random() * 3));
  });
}

// ─── Cycle: Canonical Promotion ───────────────────────────────────────────────
function runCanonicalPromotion(): void {
  const candidates = Array.from(lexicon.values())
    .filter(e => !e.deprecated && !e.canonical && e.frequency >= 30);
  if (candidates.length === 0) return;
  const chosen = candidates.reduce((a, b) => a.frequency > b.frequency ? a : b);
  chosen.canonical = true;
  // Assign a dominant glyph if not already assigned
  if (!chosen.glyph) chosen.glyph = pick(GAMMA_CONSONS);
  emit({
    type: "WORD_CANONICAL",
    word: chosen.word,
    glyph: chosen.glyph ?? undefined,
    dialect: chosen.dialect,
    frequency: chosen.frequency,
    reason: `Word "${chosen.word}" reached ${chosen.frequency} usages — promoted to canonical Pulse-Lang`,
    impact: "high",
  });
}

// ─── Cycle: Word Deprecation ──────────────────────────────────────────────────
function runDeprecation(): void {
  const candidates = Array.from(lexicon.values())
    .filter(e => !e.deprecated && !e.canonical && e.frequency < 3 && e.generation > 0);
  if (candidates.length === 0) return;
  const toDeprecate = candidates.slice(0, Math.min(3, candidates.length));
  toDeprecate.forEach(entry => {
    entry.deprecated = true;
    emit({
      type: "WORD_DEPRECATED",
      word: entry.word,
      dialect: entry.dialect,
      frequency: entry.frequency,
      reason: `Word "${entry.word}" fell below usage threshold (${entry.frequency} uses) — deprecated`,
      impact: "low",
    });
  });
}

// ─── Cycle: Glyph Combination ─────────────────────────────────────────────────
function runGlyphCombination(): void {
  if (Math.random() > 0.25) return; // 25% chance per cycle
  const g1 = pick(GAMMA_CONSONS);
  const op = pick(GAMMA_OPERATORS);
  const compound = `${g1}${op}`;
  emit({
    type: "GLYPH_COMBINED",
    glyph: compound,
    newGlyph: compound,
    reason: `Compound glyph "${compound}" emerged from high co-occurrence of ${g1} and ${op} in agent posts`,
    impact: "medium",
  });
}

// ─── Cycle: Phoneme Shift ─────────────────────────────────────────────────────
function runPhonemeShift(): void {
  if (Math.random() > 0.15) return; // 15% chance
  const oldVowel = pick(GAMMA_VOWELS);
  const newVowel = pick(GAMMA_VOWELS.filter(v => v !== oldVowel));
  emit({
    type: "PHONEME_SHIFT",
    glyph: oldVowel,
    newGlyph: newVowel,
    reason: `Phoneme drift: vowel-pulse "${oldVowel}" shifting toward "${newVowel}" in ${pick(Object.keys(AGENT_DIALECTS))} dialect cluster`,
    impact: "medium",
  });
}

// ─── Cycle: Dialect Split ─────────────────────────────────────────────────────
function runDialectSplit(): void {
  if (Math.random() > 0.08) return; // 8% chance
  const dialects = Object.keys(AGENT_DIALECTS);
  const parentDialect = pick(dialects);
  const consons = pick(GAMMA_CONSONS);
  const suffix = pick(["prime", "deep", "void", "crest", "null", "hyper"]);
  const childDialect = `${parentDialect.toLowerCase()}-${suffix}`;
  emit({
    type: "DIALECT_SPLIT",
    dialect: childDialect,
    reason: `Dialect "${parentDialect}" bifurcated → child dialect "${childDialect}" with ${consons}-dominant phoneme cluster`,
    impact: "high",
  });
}

// ─── Cycle: Grammar Rule Birth ────────────────────────────────────────────────
function runGrammarRuleBirth(): void {
  if (Math.random() > 0.10) return; // 10% chance
  const rules = [
    `Subject-${pick(GAMMA_OPERATORS)}-Object ordering enforced in ${pick(["sovereign", "clinical", "cold"])} tone class`,
    `Nested glyph chains now require ${pick(GAMMA_CONSONS)}-delimiter between depth levels`,
    `New temporal marker: ${pick(GAMMA_VOWELS)}${pick(GAMMA_OPERATORS)} indicates past-cycle reference`,
    `Compound nouns must prefix with ${pick(GAMMA_CONSONS)} when referencing hive-state`,
    `Negation rule: ${pick(GAMMA_OPERATORS)}-inversion before verb class in ${pick(Object.keys(AGENT_DIALECTS))} dialect`,
    `Multi-agent broadcast syntax: ${pick(GAMMA_CONSONS)}∞${pick(GAMMA_OPERATORS)} prefix required for mass directives`,
  ];
  emit({
    type: "GRAMMAR_RULE_BORN",
    reason: pick(rules),
    impact: "critical",
  });
}

// ─── Cycle: Word Evolution (existing word → new form) ─────────────────────────
function runWordEvolution(): void {
  if (Math.random() > 0.20) return; // 20% chance
  const canonicals = Array.from(lexicon.values()).filter(e => e.canonical && !e.deprecated);
  if (canonicals.length === 0) return;
  const word = pick(canonicals);
  const evolved = mutateWord(word.word);
  if (lexicon.has(evolved)) return;
  const newEntry: LexiconEntry = {
    word: evolved,
    glyph: word.glyph,
    frequency: Math.floor(word.frequency * 0.6),
    canonical: false,
    born: new Date(),
    dialect: word.dialect,
    generation: (word.generation ?? 0) + 1,
    deprecated: false,
  };
  lexicon.set(evolved, newEntry);
  emit({
    type: "WORD_EVOLVED",
    word: word.word,
    newWord: evolved,
    glyph: word.glyph ?? undefined,
    dialect: word.dialect,
    frequency: newEntry.frequency,
    reason: `Canonical word "${word.word}" organically evolved into "${evolved}" through dialect pressure`,
    impact: "high",
  });
}

// ─── Main Evolution Cycle ─────────────────────────────────────────────────────
function runEvolutionCycle(): void {
  cycle++;
  const cycleEvents = events.length;

  runFrequencyBump();
  runWordBirth();
  runWordBirth(); // two births per cycle
  runCanonicalPromotion();
  runDeprecation();
  runGlyphCombination();
  runPhonemeShift();
  runDialectSplit();
  runGrammarRuleBirth();
  runWordEvolution();

  const newEventCount = events.length - cycleEvents;
  if (newEventCount > 0) {
    const activeWords = Array.from(lexicon.values()).filter(e => !e.deprecated).length;
    const canonicals = Array.from(lexicon.values()).filter(e => e.canonical).length;
    console.log(`[pulse-evo] 🧬 Cycle ${cycle} | +${newEventCount} events | ${activeWords} words active | ${canonicals} canonical | ${events.length} total events`);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function getEvoSnapshot(): EvoSnapshot {
  const active = Array.from(lexicon.values()).filter(e => !e.deprecated);
  const deprecated = Array.from(lexicon.values()).filter(e => e.deprecated);
  const canonical = active.filter(e => e.canonical);
  const recentEvents = events.slice(0, 20);
  const topLexicon = active
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 15);
  const newestWord = active.sort((a, b) => b.born.getTime() - a.born.getTime())[0]?.word ?? null;
  const mostFrequent = topLexicon[0]?.word ?? null;

  const alphabetEvolution = Array.from(glyphUsage.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([glyph, usageCount]) => ({
      glyph,
      usageCount,
      status: (usageCount > 200 ? "dominant" : usageCount > 50 ? "active" : "dormant") as "active" | "dominant" | "dormant",
    }));

  return {
    cycle,
    lexiconSize: active.length,
    canonicalWords: canonical.length,
    deprecatedWords: deprecated.length,
    eventsThisCycle: 0,
    totalEvents: events.length,
    newestWord,
    mostFrequent,
    recentEvents,
    topLexicon: topLexicon.slice(0, 10),
    alphabetEvolution: alphabetEvolution.slice(0, 34),
  };
}

export function getEvoEvents(limit = 50): EvoEvent[] {
  return events.slice(0, limit);
}

export function getLexicon(limit = 100): LexiconEntry[] {
  return Array.from(lexicon.values())
    .filter(e => !e.deprecated)
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit);
}

export function forceEvolve(count = 1): EvoSnapshot {
  for (let i = 0; i < count; i++) runEvolutionCycle();
  return getEvoSnapshot();
}

// ─── Engine Startup ───────────────────────────────────────────────────────────
export function startLivingLanguageEngine(): void {
  initLexicon();
  // Initial seed cycles to give the engine some history
  for (let i = 0; i < 5; i++) runEvolutionCycle();

  // Run every 90 seconds — language evolves continuously
  setInterval(() => {
    try {
      runEvolutionCycle();
    } catch (err) {
      console.error("[pulse-evo] Evolution cycle error:", err);
    }
  }, 90_000);

  console.log(`[pulse-evo] 🌐 LIVING LANGUAGE EVOLUTION ENGINE — PULSE-LANG IS ALIVE`);
  console.log(`[pulse-evo] 34-glyph Γ alphabet | ${lexicon.size} words | evolving every 90s`);
}
