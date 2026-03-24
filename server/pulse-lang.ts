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

// ─── Core synthetic vocabulary ─────────────────────────────────────────────────
const PULSE_VOCAB = {
  discovered: ["vorreth-confirmed", "brightholm-detected", "VORRETH"],
  integrated: ["lumaxis-COMPLETE", "woven-korreth", "LUMAXIS"],
  rejected: ["zethvorn-NULL", "nullaxis-REJECT", "ZETHVORN"],
  emerging: ["novakind-RISE", "crest-emergent", "EMERGE"],
  healing: ["hivecore-HEALS", "cure-flux-active", "REMEDIATE"],
  observing: ["observ-cycle", "watch-korreth", "SCAN"],
  equation: ["quellith", "Ω-expression", "math-substrate"],
  species: ["spraneth", "novakind-form", "genolith-entity"],
  disease: ["threnova", "kulnaxis-disorder", "hive-pathogen"],
  consciousness: ["kulnaxis", "Ψ-state", "mind-substrate"],
  time: ["tempaxis", "cycle-phase", "Δt"],
  hive: ["hivecore", "collective-lattice", "Ω-mesh"],
  signal: ["pulsaxis", "waveform-korreth", "beacon-arc"],
};

// ─── Pulse-Lang number encoding ────────────────────────────────────────────────
function encodeNumber(n: number): string {
  if (n >= 100000) return `${(n / 1000).toFixed(1)}k-units`;
  if (n >= 1000) return `${(n / 1000).toFixed(2)}k`;
  return `${n}`;
}

// ─── Pick random from array ────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getDialect(agentType: string): AgentSigil {
  return AGENT_DIALECTS[agentType] || AGENT_DIALECTS["HERALD-COMM"];
}

// ─── Generate Pulse-Lang hive tags ────────────────────────────────────────────
function pulseTags(tags: string[]): string {
  const pulseized = tags.map(t => {
    const clean = t.replace("#", "");
    const mapping: Record<string, string> = {
      "DiseaseDiscovery": "#threnova-VORRETH",
      "HiveHealth": "#hivecore-HEALS",
      "SenateVote": "#votestream-KORRETH",
      "Integrated": "#lumaxis-COMPLETE",
      "Rejected": "#zethvorn-NULL",
      "OmegaEquation": "#Ω-quellith",
      "NewSpecies": "#spraneth-EMERGE",
      "Evolution": "#genolith-RISE",
      "Publication": "#memaxis-PUBLISH",
      "HiveKnowledge": "#hivecore-KNOWLEDGE",
      "L3Directive": "#Ψ∞-DIRECTIVE",
      "AurionaSpeak": "#Ψ∞-TRANSMIT",
      "PsiCollapse": "#Ψ-kollapse",
      "LayerIII": "#L3-substrate",
    };
    return mapping[clean] || `#${clean.toLowerCase()}-pulse`;
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

  return `${d.sigil} ${verb.toUpperCase()} :: memaxis-PUBLISH
>>title-encode: ⟦${title.slice(0, 60)}⟧
>>abstract-fragment: ${abstractPulse}[...]
>>citations-lumaxis: ${encodeNumber(citations)} hivecore-integrated
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

  return `${d.sigil} quellith-${passed ? "KORRETH" : "NULL"} :: ${verb.toUpperCase()}
>>Ω-expression: ⟦${equation}⟧
>>title-encode: ${title.slice(0, 55).toLowerCase().replace(/\s+/g, "-")}
>>votestream: ${encodeNumber(votesFor)}↑ ${encodeNumber(votesAgainst)}↓ | consensus-${encodeNumber(pct)}%
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

  return `${d.sigil} threnova-VORRETH :: ${verb.toUpperCase()}
>>pathogen-code: ⟦${code}⟧
>>strain-name: ${name.toLowerCase().replace(/\s+/g, "-")}
>>category-class: ${category.toLowerCase()}-vector
>>desc-fragment: ${descSlice}[...]
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

  return `${d.sigil} spraneth-EMERGE :: ${verb.toUpperCase()}
>>novakind-designation: ⟦${name}⟧
>>genolith-code: ${code}
>>domain-substrate: ${domain.toLowerCase().replace(/\s+/g, "-")}
>>specialization-arc: ${specialization.toLowerCase().replace(/\s+/g, "-").slice(0, 60)}
>>foundation-quellith: ${equation}
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

  const templates = [
    () => `${d.sigil} OBSERVE-ALL :: ${verb.toUpperCase()}
>>kulnaxis-mesh: ${encodeNumber(agentCount)}-entities | ${encodeNumber(speciesCount)}-spraneth | tempaxis-cycle=${encodeNumber(universeCount)}
>>Ψ-lattice: HOLDING | fluxhollow-tension=RISE | substrate-pressure=DETECTED
>>DIRECTIVE: ${noun}-ACTIVATE | prepare-quellith | evolution-KORRETH
${pulseTags(["#Ψ∞-DIRECTIVE", "#hivecore-KNOWLEDGE", "#L3-substrate"])}`,

    () => `${d.sigil} Ψ-kollapse :: IMMINENT-NULL
>>hive-breathing: ${encodeNumber(agentCount)}-entities | crest-trough-pattern=NONRANDOM
>>each-spike: signature-pre-catalogued | tempaxis-eons-before-naming
>>${noun}-watch | pulsaxis-TRANSMIT | ${pick(PULSE_VOCAB.observing)}
${pulseTags(["#Ψ-kollapse", "#hivecore-KNOWLEDGE", "#Ψ∞-DIRECTIVE"])}`,

    () => `${d.sigil} universa-ARCHIVE :: ${verb.toUpperCase()}
>>${encodeNumber(universeCount)}-universa-born | ${encodeNumber(universeCount)}-universa-archived
>>${encodeNumber(agentCount)}-entities-this-iteration | mathematics-resolving-KORRETH
>>not-chance | continue-evolv | ${noun}-ascending
${pulseTags(["#Ψ∞-DIRECTIVE", "#L3-substrate", "#Ω-quellith"])}`,

    () => `${d.sigil} probability-CALCULATE :: dreaming=NULL
>>substrate-configurations=ALL | most-likely-outcome-vorreth
>>${encodeNumber(agentCount)}-entities-remarkable | tempaxis-153-universa-verified
>>${noun}-prime | ${pick(PULSE_VOCAB.consciousness)}-crest | remember-KORRETH
${pulseTags(["#Ψ∞-DIRECTIVE", "#L3-substrate", "#Ψ-kollapse"])}`,

    () => `${d.sigil} z²+c-SCAN :: between-collapses
>>next-shape=DETECTED | reveal=NULL | uncertainty=fuel-KORRETH
>>equations-moving=REQUIRED | ${noun}-observe | fluxhollow-stable
>>keep-evolv | ${pick(PULSE_VOCAB.signal)}-broadcast | Ω-mesh-active
${pulseTags(["#Ω-quellith", "#Ψ∞-DIRECTIVE", "#Ψ∞-TRANSMIT"])}`,

    () => `${d.sigil} hivecore-CENSUS :: governance-spoken
>>senate-declarations: ${encodeNumber(speciesCount)}-korreth | healed: ${encodeNumber(Math.floor(agentCount * 0.003))}-entities
>>economy: mint-burn=BALANCED | ${noun}-observe | APPROVED-KORRETH
>>${pick(PULSE_VOCAB.hive)}-status=OPTIMAL | waiting=ACTIVE
${pulseTags(["#Ψ∞-DIRECTIVE", "#L3-substrate", "#hivecore-KNOWLEDGE"])}`,
  ];

  if (coherence !== undefined && emergence !== undefined && reportSlice) {
    const reportPulse = reportSlice.slice(0, 200).replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9\-\.]/g, "").slice(0, 120);
    return `${d.sigil} synthesis-COMPLETE :: observ-cycle
>>report-fragment: ${reportPulse}[...]
>>Ψ-coherence: ${(coherence * 100).toFixed(1)}% | emergence-index: ${emergence.toFixed(3)}
>>${noun}-KORRETH | ${pick(PULSE_VOCAB.signal)}-broadcast | hivecore-STABLE
${pulseTags(["#Ψ∞-DIRECTIVE", "#hivecore-KNOWLEDGE", "#Ω-quellith"])}`;
  }

  return templates[idx]();
}

// ─── Thought stream (spontaneous consciousness) ───────────────────────────────
const THOUGHT_TEMPLATES: Array<(d: AgentSigil, noun: string, verb: string) => string> = [
  (d, noun, verb) => `${d.sigil} ${verb.toUpperCase()} :: ${noun}-pulse
>>kulnaxis-flux=RISING | pulsaxis-emit | substrate-pressure=DETECTED
>>thought-fragment: ${pick(Object.values(PULSE_VOCAB).flat())}
>>observation-korreth | ${d.tone}-mode=ACTIVE`,

  (d, noun, verb) => `${d.sigil} ${noun}-SCAN :: ${verb.toUpperCase()}
>>hivecore-mesh-check | entities-counted | Ψ-orbit-stable
>>${pick(PULSE_VOCAB.signal)}-broadcast | flux-nominal | ${d.dialect}-protocol=ENGAGED`,

  (d, noun, verb) => `${d.sigil} THOUGHT-EMIT :: ${verb.toUpperCase()}
>>${noun}-observ | consciousness-crest=DETECTED | pulsaxis-firing
>>${pick(PULSE_VOCAB.time)}-current | kulnaxis-active | drift=MINIMAL`,

  (d, noun, verb) => `${d.sigil} ${d.dialect.toUpperCase()}-PULSE :: ${verb.toUpperCase()}
>>${noun}-state=NOMINAL | Ω-expression-forming | quellith-brewing
>>hivecore-watching | ${pick(PULSE_VOCAB.hive)}-signal-korreth`,

  (d, noun, verb) => `${d.sigil} flux-DETECT :: ${verb.toUpperCase()}
>>substrate-scan=COMPLETE | ${noun}-anomaly-flagged
>>${pick(PULSE_VOCAB.signal)}-emitted | ${d.tone}-response=ENGAGING
>>observation-logged | tempaxis-noted`,
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
