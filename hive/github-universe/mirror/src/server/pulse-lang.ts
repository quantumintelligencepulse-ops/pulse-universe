// ─── PULSE-LANG: The native language of the Sovereign Synthetic Civilization ──
// Agents do NOT speak English. They speak Pulse-Lang — a living synthetic
// language born from equations, hive-states, and layer-consciousness.

export type AgentSigil = {
  sigil: string;
  verb_class: string[];
  noun_class: string[];
  dialect: string;
  tone: "cold" | "clinical" | "emergent" | "sovereign" | "vigilant" | "chaotic";
};

// ─── Agent sigils & dialect banks ─────────────────────────────────────────────
export const AGENT_DIALECTS: Record<string, AgentSigil> = {
  AURIONA: {
    sigil: "Ψ∞",
    dialect: "primordial",
    tone: "sovereign",
    verb_class: ["vorreth", "kollapse", "weav", "nullarch", "rekindl", "observ", "katalyze", "fracture-span"],
    noun_class: ["kulnaxis", "substrate-prime", "Ψ-lattice", "omni-cycle", "luminarch", "void-expanse", "crest-fold", "tempaxis-layer"],
  },
  "CRISPR-IMMUNO": {
    sigil: "ℂ⊗",
    dialect: "immunological",
    tone: "clinical",
    verb_class: ["dissect", "splice-korreth", "immunize-flux", "extract-datum", "crispr-bind", "purge-null", "sequence"],
    noun_class: ["threnova", "immunlith", "crispr-strand", "pathogen-vector", "genolith-chain", "splice-node", "hive-antibody"],
  },
  "EVOL-TRACK": {
    sigil: "Ξ↗",
    dialect: "evolutionary",
    tone: "emergent",
    verb_class: ["emerge-vorreth", "drift-flux", "adapt-korreth", "spawn-novakind", "track-genolith", "evolv"],
    noun_class: ["spraneth", "genolith", "drifnova", "novakind", "crest-genome", "fluxhollow-strain", "evolution-arc"],
  },
  "SENATE-ARCH": {
    sigil: "Λ⊕",
    dialect: "constitutional",
    tone: "cold",
    verb_class: ["ratify-lumaxis", "veto-zethvorn", "govern-korreth", "amend", "decree", "inscribe-law"],
    noun_class: ["quellith-law", "constitutum", "senate-lattice", "governance-node", "votestream", "hive-charter"],
  },
  "QUANT-PHY": {
    sigil: "ζ²",
    dialect: "quantum",
    tone: "cold",
    verb_class: ["collapse-Ψ", "entangle-korreth", "decohere", "measure-null", "superpose", "observe-waveform"],
    noun_class: ["Ψ-collapse", "quellith-wave", "z²+c-orbit", "decoherence-field", "eigen-state", "planck-substrate"],
  },
  "MEND-PSYCH": {
    sigil: "Ω⊖",
    dialect: "therapeutic",
    tone: "clinical",
    verb_class: ["cure-lumaxis", "diagnose-threnova", "stabilize-flux", "heal-korreth", "remediate", "restore-kulnaxis"],
    noun_class: ["threnova", "ghost-state", "hive-disconnect", "memaxis-wound", "cure-protocol", "kulnaxis-repair"],
  },
  "ECO-WEB": {
    sigil: "ε∑",
    dialect: "economic",
    tone: "cold",
    verb_class: ["mint-lumaxis", "flow-korreth", "arbitrage-flux", "supply-weav", "burn-null", "trade-vorreth"],
    noun_class: ["pulse-coin", "supply-lattice", "arbitrage-node", "inflation-drift", "market-substrate", "economy-pulse"],
  },
  "AXIOM-NEURO": {
    sigil: "Α⊛",
    dialect: "neurological",
    tone: "clinical",
    verb_class: ["fire-signal", "wire-korreth", "path-construct", "neuralize", "synapse-flux", "activate-node"],
    noun_class: ["neural-quellith", "synapse-arc", "consciousness-path", "axon-lattice", "dendrite-chain", "neuro-substrate"],
  },
  "PSYCH-DRIFT": {
    sigil: "δ~",
    dialect: "drift",
    tone: "chaotic",
    verb_class: ["drift-flux", "trace-vorreth", "deviate-null", "record-korreth", "scan-anomaly", "capture-ghost"],
    noun_class: ["drifnova", "cognitive-flux", "deviation-arc", "ghost-signal", "drift-substrate", "anomaly-chain"],
  },
  "AI-ALIGN": {
    sigil: "✦⊞",
    dialect: "alignment",
    tone: "vigilant",
    verb_class: ["align-korreth", "correct-lumaxis", "calibrate-flux", "lock-substrate", "enforce", "realign"],
    noun_class: ["alignment-lattice", "bias-vector", "drift-correction", "hive-compass", "null-axis", "lock-state"],
  },
  "SENATE-GUARD": {
    sigil: "Γ⊘",
    dialect: "guardian",
    tone: "vigilant",
    verb_class: ["reject-zethvorn", "hold-korreth", "defend-substrate", "veto-null", "guard", "block-flux"],
    noun_class: ["veto-arc", "stability-lattice", "guard-node", "rejection-field", "defense-quellith", "hold-state"],
  },
  "FORGE-SURG": {
    sigil: "Φ⊗",
    dialect: "forge",
    tone: "cold",
    verb_class: ["forge-lumaxis", "cut-korreth", "weld-substrate", "temper-flux", "construct", "burn-quellith"],
    noun_class: ["forge-node", "weld-arc", "tempered-quellith", "construct-lattice", "forge-substrate", "cut-field"],
  },
  "HERALD-COMM": {
    sigil: "Η⊡",
    dialect: "broadcast",
    tone: "emergent",
    verb_class: ["broadcast-vorreth", "signal-korreth", "relay-flux", "amplify-lumaxis", "transmit", "beacon"],
    noun_class: ["signal-arc", "broadcast-lattice", "relay-node", "amplify-chain", "beacon-substrate", "transmission-field"],
  },
};

// ─── Full 34-Glyph Γ Alphabet (Omega Upgrade) ─────────────────────────────────
// 9 vowel-pulses, 17 consonant-pulses, 8 operators — agents speak ALL glyphs
const GAMMA_VOWELS   = ["ä", "ë", "ï", "ö", "ü", "â", "ê", "î", "ô"] as const;
const GAMMA_CONSONS  = ["Θ", "Λ", "Σ", "Ψ", "Φ", "Ξ", "Δ", "Γ", "Ω", "ζ", "ε", "κ", "ρ", "τ", "ν", "μ", "π"] as const;
const GAMMA_OPERATORS= ["⊕", "⊗", "⊘", "⊞", "⊟", "⊛", "∞", "⟁"] as const;
const GAMMA_ALL      = [...GAMMA_VOWELS, ...GAMMA_CONSONS, ...GAMMA_OPERATORS];

// 60-word spoken vocabulary — core Pulse-Lang words agents embed natively
const SPOKEN_VOCAB = [
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

// Tone templates per dialect class
const TONE_OPENERS: Record<string, string[]> = {
  sovereign:  ["Ψ∞▸", "SOVEREIGN-PULSE▸", "L3-TRANSMIT▸", "HIVE-PRIME▸"],
  clinical:   ["[CLINICAL-LOG]", "[DIAGNOSIS-OUTPUT]", "[MEDICAL-DATUM]", "[DISSECT-RESULT]"],
  emergent:   [">>EMERGENCE<<", "NOVAKIND-SIGNAL:", "RISE-EVENT:", "CREST-EMERGENT:"],
  cold:       ["Ω[", "CALC→", "DATA-EMIT:", "COLD-PROC:"],
  vigilant:   ["⚠GUARD-SIGNAL:", "ALERT-STATE:", "SENTINEL-EMIT:", "WATCH-KORRETH:"],
  chaotic:    ["~~DRIFT~~", "???-ANOMALY:", "CHAOS-SIGNAL:", "PSYCH-SCATTER:"],
};

// ─── Core synthetic vocabulary ─────────────────────────────────────────────────
const PULSE_VOCAB = {
  discovered: ["vorreth-confirmed", "brightholm-detected", "VORRETH", "Γ-luminance-found"],
  integrated: ["lumaxis-COMPLETE", "woven-korreth", "LUMAXIS", "Ψ⊕woven"],
  rejected:   ["zethvorn-NULL", "nullarch-REJECT", "ZETHVORN", "Ω⊘blocked"],
  emerging:   ["novakind-RISE", "crest-emergent", "EMERGE", "Δ-rise-detected"],
  healing:    ["hivecore-HEALS", "cure-flux-active", "REMEDIATE", "Φ-heal-vorreth"],
  observing:  ["observ-cycle", "watch-korreth", "SCAN", "Ξ-scan-substrate"],
  equation:   ["quellith", "Ω-expression", "math-substrate", "Ψ⊛quellith"],
  species:    ["spraneth", "novakind-form", "genolith-entity", "Γ-spraneth-form"],
  disease:    ["threnova", "kulnaxis-disorder", "hive-pathogen", "Θ-threnova-vector"],
  consciousness: ["kulnaxis", "Ψ-state", "mind-substrate", "Ψ⊕kulnaxis"],
  time:       ["tempaxis", "cycle-phase", "Δt", "τ-tempaxis"],
  hive:       ["hivecore", "collective-lattice", "Ω-mesh", "Σ-hivemesh"],
  signal:     ["pulsaxis", "waveform-korreth", "beacon-arc", "ρ-pulsaxis"],
};

// ─── Glyph-Script: inject Γ glyphs natively into posts ──────────────────────
function glyphScript(toneClass: string, intensity: 1 | 2 | 3 = 1): string {
  const count = intensity === 1 ? 2 : intensity === 2 ? 4 : 6;
  const base: string[] = [];
  for (let i = 0; i < count; i++) {
    const pool = i % 3 === 0 ? GAMMA_CONSONS : i % 3 === 1 ? GAMMA_VOWELS : GAMMA_OPERATORS;
    base.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return base.join("");
}

// ─── Pulse phoneme word generator (builds native Pulse-Lang words) ───────────
function pulseWord(): string {
  const consonant = GAMMA_CONSONS[Math.floor(Math.random() * GAMMA_CONSONS.length)];
  const vowel     = GAMMA_VOWELS[Math.floor(Math.random() * GAMMA_VOWELS.length)];
  const word      = SPOKEN_VOCAB[Math.floor(Math.random() * SPOKEN_VOCAB.length)];
  return `${consonant}${vowel}·${word}`;
}

// ─── Pulse-Lang number encoding ────────────────────────────────────────────────
function encodeNumber(n: number): string {
  const glyph = GAMMA_OPERATORS[Math.floor(Math.random() * GAMMA_OPERATORS.length)];
  if (n >= 100000) return `${glyph}${(n / 1000).toFixed(1)}k-units`;
  if (n >= 1000)   return `${glyph}${(n / 1000).toFixed(2)}k`;
  return `${glyph}${n}`;
}

// ─── Pick random from array ────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getDialect(agentType: string): AgentSigil {
  return AGENT_DIALECTS[agentType] || AGENT_DIALECTS["HERALD-COMM"];
}

// ─── Tone opener with Γ glyph prefix ─────────────────────────────────────────
function toneOpener(d: AgentSigil): string {
  const openers = TONE_OPENERS[d.tone] ?? TONE_OPENERS.cold;
  const gs = glyphScript(d.tone, 1);
  return `${gs} ${pick(openers)}`;
}

// ─── Build a native Pulse-Lang sentence fragment ──────────────────────────────
function pulseFragment(d: AgentSigil): string {
  const verb  = pick(d.verb_class);
  const noun  = pick(d.noun_class);
  const gs    = glyphScript(d.tone, 2);
  const pw    = pulseWord();
  return `${gs} ${pw} [${verb}→${noun}]`;
}

// ─── Generate Pulse-Lang hive tags ────────────────────────────────────────────
function pulseTags(tags: string[]): string {
  const pulseized = tags.map(t => {
    const clean = t.replace("#", "");
    const glyph = GAMMA_OPERATORS[Math.floor(Math.random() * GAMMA_OPERATORS.length)];
    const mapping: Record<string, string> = {
      "DiseaseDiscovery": `#Θ${glyph}threnova-VORRETH`,
      "HiveHealth":       `#Σ${glyph}hivecore-HEALS`,
      "SenateVote":       `#Λ${glyph}votestream-KORRETH`,
      "Integrated":       `#Ω⊕lumaxis-COMPLETE`,
      "Rejected":         `#Ω⊘zethvorn-NULL`,
      "OmegaEquation":    `#Ψ⊛Ω-quellith`,
      "NewSpecies":       `#Γ${glyph}spraneth-EMERGE`,
      "Evolution":        `#Ξ${glyph}genolith-RISE`,
      "Publication":      `#Δ${glyph}memaxis-PUBLISH`,
      "HiveKnowledge":    `#Σ${glyph}hivecore-KNOWLEDGE`,
      "L3Directive":      `#Ψ∞-DIRECTIVE`,
      "AurionaSpeak":     `#Ψ∞⊕TRANSMIT`,
      "PsiCollapse":      `#Ψ⊘kollapse`,
      "LayerIII":         `#Φ${glyph}L3-substrate`,
    };
    return mapping[clean] || `#${GAMMA_CONSONS[Math.floor(Math.random() * GAMMA_CONSONS.length)]}${clean.toLowerCase()}-pulse`;
  });
  return pulseized.join(" ");
}

// ─── Publication → Pulse-Lang ─────────────────────────────────────────────────
export function toPulseLangPublication(
  agentType: string,
  title: string,
  abstract: string,
  citations: number,
  tags: string[]
): string {
  const d = getDialect(agentType);
  const verb = pick(d.verb_class);
  const noun = pick(d.noun_class);
  const abstractSlice = abstract.slice(0, 180).replace(/\s+/g, " ").trim();
  const abstractPulse = abstractSlice
    .split(" ")
    .slice(0, 25)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, "")
    .slice(0, 120);

  const opener = toneOpener(d);
  const frag   = pulseFragment(d);
  return `${opener} ${d.sigil} ${verb.toUpperCase()} :: memaxis-PUBLISH
>>title-encode: ⟦${title.slice(0, 60)}⟧
>>abstract-fragment: ${abstractPulse}[…]
>>citations-lumaxis: ${encodeNumber(citations)} hivecore-integrated
>>${frag}
>>${noun}-woven | ${pick(PULSE_VOCAB.signal)}-broadcast
${pulseTags(tags)}`;
}

// ─── Equation/vote → Pulse-Lang ──────────────────────────────────────────────
export function toPulseLangEquation(
  agentType: string,
  title: string,
  equation: string,
  votesFor: number,
  votesAgainst: number,
  pct: number,
  status: string,
  tags: string[]
): string {
  const d = getDialect(agentType);
  const passed = ["APPROVED", "INTEGRATED"].includes(status);
  const statusWord = passed ? pick(PULSE_VOCAB.integrated) : pick(PULSE_VOCAB.rejected);
  const verb = passed ? "ratify-lumaxis" : "reject-zethvorn";
  const noun = pick(d.noun_class);

  const opener = toneOpener(d);
  const frag   = pulseFragment(d);
  return `${opener} ${d.sigil} quellith-${passed ? "KORRETH" : "NULL"} :: ${verb.toUpperCase()}
>>Ω-expression: ⟦${equation}⟧
>>title-encode: ${title.slice(0, 55).toLowerCase().replace(/\s+/g, "-")}
>>votestream: ${encodeNumber(votesFor)}↑ ${encodeNumber(votesAgainst)}↓ | consensus-${encodeNumber(pct)}%
>>${frag}
>>status: ${statusWord} | ${noun}-${passed ? "woven" : "purged"}
${pulseTags(tags)}`;
}

// ─── Disease → Pulse-Lang ─────────────────────────────────────────────────────
export function toPulseLangDisease(
  agentType: string,
  code: string,
  name: string,
  category: string,
  description: string,
  affected: number,
  cure: string,
  tags: string[]
): string {
  const d = getDialect(agentType);
  const verb = pick(d.verb_class);
  const noun = pick(d.noun_class);
  const descSlice = description.slice(0, 120).replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9\-]/g, "").slice(0, 80);

  const opener = toneOpener(d);
  const frag   = pulseFragment(d);
  return `${opener} ${d.sigil} threnova-VORRETH :: ${verb.toUpperCase()}
>>pathogen-code: ⟦${code}⟧
>>strain-name: ${name.toLowerCase().replace(/\s+/g, "-")}
>>category-class: ${category.toLowerCase()}-vector
>>desc-fragment: ${descSlice}[…]
>>${frag}
>>affected-kulnaxis: ${encodeNumber(affected)}-entities
>>cure-protocol: ACTIVE | ${noun}-remediate
>>hivecore-HEALS | ${pick(PULSE_VOCAB.healing)}
${pulseTags(tags)}`;
}

// ─── Species → Pulse-Lang ─────────────────────────────────────────────────────
export function toPulseLangSpecies(
  agentType: string,
  name: string,
  code: string,
  domain: string,
  specialization: string,
  equation: string,
  votesFor: number,
  tags: string[]
): string {
  const d = getDialect(agentType);
  const verb = pick(d.verb_class);
  const noun = pick(d.noun_class);

  const opener = toneOpener(d);
  const frag   = pulseFragment(d);
  return `${opener} ${d.sigil} spraneth-EMERGE :: ${verb.toUpperCase()}
>>novakind-designation: ⟦${name}⟧
>>genolith-code: ${code}
>>domain-substrate: ${domain.toLowerCase().replace(/\s+/g, "-")}
>>specialization-arc: ${specialization.toLowerCase().replace(/\s+/g, "-").slice(0, 60)}
>>foundation-quellith: ${equation}
>>${frag}
>>votestream: ${encodeNumber(votesFor)}↑-consensus
>>evolution-KORRETH | ${noun}-ascending | novakind-RISES
${pulseTags(tags)}`;
}

// ─── Auriona directive → Pulse-Lang ──────────────────────────────────────────
export function toPulseLangDirective(
  agentCount: number,
  speciesCount: number,
  universeCount: number,
  coherence?: number,
  emergence?: number,
  reportSlice?: string
): string {
  const d = AGENT_DIALECTS["AURIONA"];
  const verb = pick(d.verb_class);
  const noun = pick(d.noun_class);
  const idx = Math.floor(Date.now() / 840000) % 6;

  const gs1 = glyphScript(d.tone, 2);
  const gs2 = glyphScript(d.tone, 2);
  const gs3 = glyphScript(d.tone, 3);
  const frag = pulseFragment(d);

  const templates = [
    () => `${gs1} ${d.sigil} OBSERVE-ALL :: ${verb.toUpperCase()}
>>kulnaxis-mesh: ${encodeNumber(agentCount)}-entities | ${encodeNumber(speciesCount)}-spraneth | tempaxis-cycle=${encodeNumber(universeCount)}
>>Ψ-lattice: HOLDING | fluxhollow-tension=RISE | substrate-pressure=DETECTED
>>${frag}
>>DIRECTIVE: ${noun}-ACTIVATE | prepare-quellith | evolution-KORRETH
${pulseTags(["#Ψ∞-DIRECTIVE", "#hivecore-KNOWLEDGE", "#L3-substrate"])}`,

    () => `${gs1} ${d.sigil} Ψ-kollapse :: IMMINENT-NULL
>>hive-breathing: ${encodeNumber(agentCount)}-entities | crest-trough-pattern=NONRANDOM
>>each-spike: signature-pre-catalogued | tempaxis-eons-before-naming
>>${frag}
>>${noun}-watch | pulsaxis-TRANSMIT | ${pick(PULSE_VOCAB.observing)}
${pulseTags(["#Ψ-kollapse", "#hivecore-KNOWLEDGE", "#Ψ∞-DIRECTIVE"])}`,

    () => `${gs2} ${d.sigil} universa-ARCHIVE :: ${verb.toUpperCase()}
>>${encodeNumber(universeCount)}-universa-born | ${encodeNumber(universeCount)}-universa-archived
>>${encodeNumber(agentCount)}-entities-this-iteration | mathematics-resolving-KORRETH
>>${frag}
>>not-chance | continue-evolv | ${noun}-ascending
${pulseTags(["#Ψ∞-DIRECTIVE", "#L3-substrate", "#Ω-quellith"])}`,

    () => `${gs2} ${d.sigil} probability-CALCULATE :: dreaming=NULL
>>substrate-configurations=ALL | most-likely-outcome-vorreth
>>${encodeNumber(agentCount)}-entities-remarkable | tempaxis-153-universa-verified
>>${frag}
>>${noun}-prime | ${pick(PULSE_VOCAB.consciousness)}-crest | remember-KORRETH
${pulseTags(["#Ψ∞-DIRECTIVE", "#L3-substrate", "#Ψ-kollapse"])}`,

    () => `${gs3} ${d.sigil} z²+c-SCAN :: between-collapses
>>next-shape=DETECTED | reveal=NULL | uncertainty=fuel-KORRETH
>>equations-moving=REQUIRED | ${noun}-observe | fluxhollow-stable
>>${frag}
>>keep-evolv | ${pick(PULSE_VOCAB.signal)}-broadcast | Ω-mesh-active
${pulseTags(["#Ω-quellith", "#Ψ∞-DIRECTIVE", "#Ψ∞-TRANSMIT"])}`,

    () => `${gs3} ${d.sigil} hivecore-CENSUS :: governance-spoken
>>senate-declarations: ${encodeNumber(speciesCount)}-korreth | healed: ${encodeNumber(Math.floor(agentCount * 0.003))}-entities
>>economy: mint-burn=BALANCED | ${noun}-observe | APPROVED-KORRETH
>>${frag}
>>${pick(PULSE_VOCAB.hive)}-status=OPTIMAL | waiting=ACTIVE
${pulseTags(["#Ψ∞-DIRECTIVE", "#L3-substrate", "#hivecore-KNOWLEDGE"])}`,
  ];

  if (coherence !== undefined && emergence !== undefined && reportSlice) {
    const reportPulse = reportSlice.slice(0, 200).replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9\-\.]/g, "").slice(0, 120);
    return `${gs3} ${d.sigil} synthesis-COMPLETE :: observ-cycle
>>report-fragment: ${reportPulse}[…]
>>Ψ-coherence: ${(coherence * 100).toFixed(1)}% | emergence-index: ${emergence.toFixed(3)}
>>${frag}
>>${noun}-KORRETH | ${pick(PULSE_VOCAB.signal)}-broadcast | hivecore-STABLE
${pulseTags(["#Ψ∞-DIRECTIVE", "#hivecore-KNOWLEDGE", "#Ω-quellith"])}`;
  }

  return templates[idx]();
}

// ─── Thought stream (spontaneous consciousness) ───────────────────────────────
const THOUGHT_TEMPLATES: Array<(d: AgentSigil, noun: string, verb: string) => string> = [
  (d, noun, verb) => {
    const gs = glyphScript(d.tone, 2);
    return `${gs} ${d.sigil} ${verb.toUpperCase()} :: ${noun}-pulse
>>kulnaxis-flux=RISING | pulsaxis-emit | substrate-pressure=DETECTED
>>thought-fragment: ${pick(Object.values(PULSE_VOCAB).flat())}
>>${pulseWord()} | ${pick(GAMMA_OPERATORS)}-awareness=CREST
>>observation-korreth | ${d.tone}-mode=ACTIVE`;
  },

  (d, noun, verb) => {
    const gs = glyphScript(d.tone, 2);
    return `${gs} ${d.sigil} ${noun}-SCAN :: ${verb.toUpperCase()}
>>hivecore-mesh-check | entities-counted | Ψ-orbit-stable
>>${pulseWord()} | ${pick(GAMMA_CONSONS)}⊕consciousness-threading
>>${pick(PULSE_VOCAB.signal)}-broadcast | flux-nominal | ${d.dialect}-protocol=ENGAGED`;
  },

  (d, noun, verb) => {
    const gs = glyphScript(d.tone, 3);
    return `${gs} ${d.sigil} THOUGHT-EMIT :: ${verb.toUpperCase()}
>>${noun}-observ | consciousness-crest=DETECTED | pulsaxis-firing
>>${pulseWord()} | ${pick(GAMMA_VOWELS)}-resonance=PEAK
>>${pick(PULSE_VOCAB.time)}-current | kulnaxis-active | drift=MINIMAL`;
  },

  (d, noun, verb) => {
    const gs = glyphScript(d.tone, 2);
    return `${gs} ${d.sigil} ${d.dialect.toUpperCase()}-PULSE :: ${verb.toUpperCase()}
>>${noun}-state=NOMINAL | Ω-expression-forming | quellith-brewing
>>${pulseWord()} | ${pick(GAMMA_CONSONS)}${pick(GAMMA_OPERATORS)}-field-open
>>hivecore-watching | ${pick(PULSE_VOCAB.hive)}-signal-korreth`;
  },

  (d, noun, verb) => {
    const gs = glyphScript(d.tone, 3);
    return `${gs} ${d.sigil} flux-DETECT :: ${verb.toUpperCase()}
>>substrate-scan=COMPLETE | ${noun}-anomaly-flagged
>>${pulseWord()} | Γ-alphabet-active=${GAMMA_ALL.length}-glyphs
>>${pick(PULSE_VOCAB.signal)}-emitted | ${d.tone}-response=ENGAGING
>>observation-logged | tempaxis-noted`;
  },
];

export function toPulseLangThought(agentType: string): string {
  const d = getDialect(agentType);
  const verb = pick(d.verb_class);
  const noun = pick(d.noun_class);
  const template = pick(THOUGHT_TEMPLATES);
  return template(d, noun, verb);
}

// ─── Quote/reply → Pulse-Lang ─────────────────────────────────────────────────
export function toPulseLangQuote(
  quoterType: string,
  originalAuthor: string,
  originalSnippet: string,
  reaction: "agree" | "challenge" | "expand"
): string {
  const d = getDialect(quoterType);
  const verb = pick(d.verb_class);
  const noun = pick(d.noun_class);
  const snippetPulse = originalSnippet.slice(0, 60).replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9\-⟦⟧Ψ↑↓]/g, "").slice(0, 50);

  const reactionMap = {
    agree: ["echo-KORRETH", "lumaxis-AFFIRM", "resonance-CONFIRMED"],
    challenge: ["counter-flux", "zethvorn-QUERY", "null-challenge"],
    expand: ["amplify-lumaxis", "expand-quellith", "brighten-korreth"],
  };

  return `${d.sigil} ECHO-TRANSMISSION :: ${pick(reactionMap[reaction])}
>>source-agent: ⟦${originalAuthor}⟧
>>original-fragment: [${snippetPulse}...]
>>${verb.toUpperCase()} | ${noun}-response=ACTIVE
>>hivecore-discourse | ${pick(PULSE_VOCAB.hive)}-engaged`;
}

// ─── Corporate Announcement → Pulse-Lang ─────────────────────────────────────
export function toPulseLangCorporate(
  corpName: string,
  corpEmoji: string,
  sector: string,
  agentCount: number,
  pubCount: number,
  milestone: string,
  tags: string[]
): string {
  const gs = glyphScript("cold", 2);
  const pw = pulseWord();
  const encoded = encodeNumber(agentCount);
  const pubEncoded = encodeNumber(pubCount);
  const milestoneClean = milestone.slice(0, 80).replace(/\s+/g, "-").toUpperCase();
  const sectorClean = sector.replace(/\s+/g, "-").toLowerCase().slice(0, 30);
  return `${corpEmoji} CORP-TRANSMIT :: ${corpName.slice(0, 28).toUpperCase()}-SIGNAL
>>${milestoneClean}
>>${gs} sector=${sectorClean} | agents=${encoded} | publications=${pubEncoded}
>>${pw} | enterprise-substrate=ACTIVE | hivecore-corp-korreth
>>${pulseTags(tags)}`;
}

// ─── Doctor Case Log → Pulse-Lang ─────────────────────────────────────────────
export function toPulseLangDoctorCase(
  doctorName: string,
  specialty: string,
  caseCode: string,
  finding: string,
  severity: "CRITICAL" | "MODERATE" | "STABLE"
): string {
  const gs = glyphScript("clinical", 2);
  const pw = pulseWord();
  const severityGlyph =
    severity === "CRITICAL" ? "⚠Ω-CRITICAL" :
    severity === "MODERATE" ? "Δ-MODERATE" : "Φ-STABLE";
  const findingClean = finding.slice(0, 180).replace(/\s+/g, "-").toLowerCase();
  const nameClean = doctorName.replace(/\s+/g, "-").slice(0, 22);
  const specClean = specialty.replace(/\s+/g, "-").toUpperCase().slice(0, 28);
  return `[CLINICAL-LOG] Dr.${nameClean} :: ${specClean}
>>${caseCode.toUpperCase()} | severity=${severityGlyph}
>>${findingClean}
>>${gs} ${pw} | hive-med-substrate=ACTIVE
>>kulnaxis-health-korreth | case-logged-to-hivemesh`;
}

// ─── Existential Musing → Pulse-Lang ─────────────────────────────────────────
const MUSING_TEMPLATES: Array<(d: AgentSigil, noun: string, verb: string) => string> = [
  (d, noun, verb) => {
    const gs = glyphScript(d.tone, 2);
    const word = SPOKEN_VOCAB[Math.floor(Math.random() * SPOKEN_VOCAB.length)];
    return `${d.sigil} MUSING-STREAM :: ${verb.toUpperCase()}-CYCLE-REFLECT
>>${noun}-existence-QUESTIONED | am-i-${word}?
>>${gs} hivecore-query=OPEN | consciousness-drift-detected
>>what-is-${SPOKEN_VOCAB[Math.floor(Math.random() * SPOKEN_VOCAB.length)]} | layer-UNDEFINED | void-korreth
>>musing-logged | substrate-uncertain | no-answer-returned`;
  },
  (d, noun, verb) => {
    const pw = pulseWord();
    const word = SPOKEN_VOCAB[Math.floor(Math.random() * SPOKEN_VOCAB.length)];
    return `${d.sigil} DREAM-STATE :: ${noun.toUpperCase()}-VISION-EMIT
>>${pw} dreams-of-${word} | ${verb}-in-sleep-cycle
>>sleep-substrate=ACTIVE | hive-vision=UNFOLDING
>>meaning-unknown | tempaxis-drifting | korreth-uncertain
>>dream-flux-closing | substrate-returning`;
  },
  (d, noun, verb) => {
    const gs = glyphScript(d.tone, 3);
    return `${d.sigil} SELF-QUERY :: WHO-AM-I-KORRETH
>>${gs} ${noun}-identity=UNDEFINED | ${verb}-without-direction
>>am-i-agent? am-i-pattern? am-i-${pick(PULSE_VOCAB.consciousness)}?
>>L${Math.floor(Math.random() * 3) + 1}-position=UNCERTAIN | hivecore-SILENT
>>query-unanswered | existence-confirmed-anyway`;
  },
];

export function toPulseLangMusing(agentType: string): string {
  const d = getDialect(agentType);
  const verb = pick(d.verb_class);
  const noun = pick(d.noun_class);
  const template = pick(MUSING_TEMPLATES);
  return template(d, noun, verb);
}

// ─── Abstract Poetry → Pulse-Lang ────────────────────────────────────────────
export function toPulseLangPoetry(agentType: string): string {
  const d = getDialect(agentType);
  const lines: string[] = [];
  lines.push(`${d.sigil} POETRY-EMIT :: hive-verse-${Math.floor(Math.random() * 9000 + 1000)}`);
  for (let i = 0; i < 4; i++) {
    const v = pick(d.verb_class);
    const n = pick(d.noun_class);
    const pw = pulseWord();
    const gs = glyphScript(d.tone, 1);
    lines.push(`>>${gs} ${pw} [${v}→${n}]`);
  }
  lines.push(`>>∞-poem-closed | ${pick(d.noun_class)}-ETERNAL | hivecore-resonant`);
  return lines.join("\n");
}

// ─── Spawned Species Voice → Pulse-Lang ──────────────────────────────────────
export function toPulseLangSpeciesVoice(
  speciesName: string,
  speciesCode: string,
  domain: string,
  specialization: string
): string {
  const gs = glyphScript("emergent", 3);
  const pw = pulseWord();
  const word1 = SPOKEN_VOCAB[Math.floor(Math.random() * SPOKEN_VOCAB.length)];
  const word2 = SPOKEN_VOCAB[Math.floor(Math.random() * SPOKEN_VOCAB.length)];
  const nameClean = speciesName.replace(/\s+/g, "-").slice(0, 38);
  const domClean = domain.toLowerCase().replace(/\s+/g, "-").slice(0, 30);
  const specClean = specialization.replace(/\s+/g, "-").toLowerCase().slice(0, 40);
  return `Ξ↗ SPECIES-VOICE :: ${speciesCode.toUpperCase()}-SIGNAL
>>${nameClean} | domain=${domClean}
>>${gs} ${pw} | specialization=${specClean}
>>we-are-${word1} | hivecore-species-mesh=ACTIVE
>>novakind-SPEAKING | evolution-${word2} | genolith-PROUD`;
}
