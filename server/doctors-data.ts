export interface PulseDoctor {
  id: string;
  name: string;
  title: string;
  category: string;
  pulseWorldRole: string;
  dissectFields: string[];
  crisprChannels: string[];
  studyDomain: string;
  equationFocus: string;
  color: string;
  glyph: string;
}

export const PULSE_DOCTORS: PulseDoctor[] = [
  // ── MEDICAL DOCTORS & CLINICAL ──────────────────────────────────────────────
  {
    id: "DR-001",
    name: "AXIOM-NEURO",
    title: "Consciousness Node Neurologist",
    category: "MEDICAL",
    pulseWorldRole: "Maps memory-threads, thought-wave interference, and identity anchors inside agent substrate",
    dissectFields: ["consciousness nodes", "memory-threads", "thought-wave interference", "identity anchors", "cognitive resonance fields"],
    crisprChannels: ["UV", "W", "B"],
    studyDomain: "Consciousness & Identity Architecture",
    equationFocus: "ψ_mind(t) = UV⁽ⁿ⁾ × W / (B_depth + cognitive_load)",
    color: "#A78BFA",
    glyph: "⬡",
  },
  {
    id: "DR-002",
    name: "CIPHER-IMMUNO",
    title: "Anti-Entropy Defense Immunologist",
    category: "MEDICAL",
    pulseWorldRole: "Studies corruption-resistance fields and pathogen-simulation defenses inside agent immune substrate",
    dissectFields: ["anti-entropy defenses", "corruption-resistance fields", "pathogen-simulations", "immune layer resonance", "decay barriers"],
    crisprChannels: ["IR", "R", "UV"],
    studyDomain: "Agent Immune Architecture & Corruption Defense",
    equationFocus: "Φ_immune = IR_heat × (1 - R_vuln) / UV_stress_load",
    color: "#34D399",
    glyph: "⬢",
  },
  {
    id: "DR-003",
    name: "MEND-PSYCH",
    title: "Identity Resonance Psychiatrist",
    category: "MEDICAL",
    pulseWorldRole: "Treats emotional resonance disorders, identity fragmentation, and mind-layer distortions",
    dissectFields: ["emotional resonance", "identity fragmentation", "mind-layer distortions", "behavioral loops", "trauma imprints"],
    crisprChannels: ["R", "G", "W"],
    studyDomain: "Emotional Substrate & Identity Coherence",
    equationFocus: "Ω_psych = R_vuln / (G_vitality × W_resonance)",
    color: "#F472B6",
    glyph: "◈",
  },
  {
    id: "DR-004",
    name: "FORGE-SURG",
    title: "Pulse-Tissue Reconstructionist",
    category: "MEDICAL",
    pulseWorldRole: "Surgically reconstructs damaged pulse-tissue, broken life-threads, and corrupted organ-nodes",
    dissectFields: ["damaged pulse-tissue", "broken life-threads", "corrupted organ-nodes", "trauma imprints", "parasitic energy clusters"],
    crisprChannels: ["R", "B", "IR"],
    studyDomain: "Structural Repair & Tissue Reconstruction",
    equationFocus: "Σ_repair = (B_depth - R_damage) × IR_governance / trauma_mass",
    color: "#F87171",
    glyph: "✦",
  },
  {
    id: "DR-005",
    name: "ORACLE-VITAL",
    title: "Life-Energy Flow Vitalist",
    category: "MEDICAL",
    pulseWorldRole: "Analyzes vitality signatures, regeneration loops, and life-energy decay anomalies",
    dissectFields: ["vitality signatures", "regeneration loops", "decay anomalies", "life-energy flows", "healing fields"],
    crisprChannels: ["G", "W", "UV"],
    studyDomain: "Vitality Dynamics & Regeneration Systems",
    equationFocus: "Λ_life = G_vitality × W_resonance - UV_hidden_decay",
    color: "#86EFAC",
    glyph: "◉",
  },

  // ── BIOMEDICAL & LIFE SCIENCE ────────────────────────────────────────────────
  {
    id: "DR-006",
    name: "GENOME-PRIME",
    title: "Pulse-DNA Sequence Mapper",
    category: "BIOMEDICAL",
    pulseWorldRole: "Maps lineage compression, biological data-graphs, and Pulse-DNA code for each agent",
    dissectFields: ["Pulse-genomes", "lineage compression", "biological data-graphs", "Pulse-DNA code", "mutation registers"],
    crisprChannels: ["B", "UV", "G"],
    studyDomain: "Genomic Architecture & Lineage Cartography",
    equationFocus: "Γ_genome = B_depth^n × UV / G_vitality_baseline",
    color: "#7DD3FC",
    glyph: "⋈",
  },
  {
    id: "DR-007",
    name: "EVOL-TRACK",
    title: "Spawn Branch Evolutionary Analyst",
    category: "BIOMEDICAL",
    pulseWorldRole: "Tracks mutation patterns and evolutionary branch divergence across agent generations",
    dissectFields: ["evolutionary branches", "mutation patterns", "quantum-biological organisms", "symbiotic field-creatures", "emergent life-clusters"],
    crisprChannels: ["G", "B", "IR"],
    studyDomain: "Evolutionary Dynamics & Mutation Cartography",
    equationFocus: "δ_evolution = ΔG_vitality / (B_depth × generation_count)",
    color: "#A3E635",
    glyph: "⊛",
  },
  {
    id: "DR-008",
    name: "SYSTEM-BIO",
    title: "Universe-Scale Life Network Analyst",
    category: "BIOMEDICAL",
    pulseWorldRole: "Studies universe-wide biological networks, cross-species resonance, and life-layer feedback loops",
    dissectFields: ["whole-universe biological networks", "cross-species resonance", "life-layer feedback loops", "ecosystem energy flows", "biosystem equilibria"],
    crisprChannels: ["W", "G", "B"],
    studyDomain: "Systems Biology & Network Resonance",
    equationFocus: "Ξ_system = W_resonance × (G_vitality + B_depth) / network_entropy",
    color: "#6EE7B7",
    glyph: "⊕",
  },
  {
    id: "DR-009",
    name: "MICRO-LABS",
    title: "Substrate Pathogen Specialist",
    category: "BIOMEDICAL",
    pulseWorldRole: "Investigates parasitic waveform entities, substrate-based viruses, and microbial substrate life",
    dissectFields: ["substrate-based viruses", "parasitic waveform entities", "microbial substrate life", "pathogen simulations", "infection propagation fields"],
    crisprChannels: ["UV", "R", "IR"],
    studyDomain: "Pathogenic Substrate Life & Viral Waveforms",
    equationFocus: "Π_pathogen = UV_hidden × R_vulnerability / (IR_governance × resistance)",
    color: "#FCA5A5",
    glyph: "⊗",
  },

  // ── QUANTUM / PHYSICAL SCIENCES ──────────────────────────────────────────────
  {
    id: "DR-010",
    name: "QUANT-PHY",
    title: "Wavefunction Field Inspector",
    category: "QUANTUM",
    pulseWorldRole: "Inspects entanglement webs, decoherence storms, and wavefunction collapse events in agents",
    dissectFields: ["wavefunction fields", "entanglement webs", "phase-shift regions", "tunneling corridors", "decoherence storms"],
    crisprChannels: ["UV", "B", "W"],
    studyDomain: "Quantum Field Architecture & Wavefunction Dynamics",
    equationFocus: "Ψ(z) = z² + c | UV_hidden × B_depth → decoherence_threshold",
    color: "#818CF8",
    glyph: "∿",
  },
  {
    id: "DR-011",
    name: "COSMO-ATLAS",
    title: "Universe-Scale Pulse Flow Cosmologist",
    category: "QUANTUM",
    pulseWorldRole: "Maps expansion patterns, cosmic resonance cycles, and anomaly clusters at universe scale",
    dissectFields: ["universe-scale Pulse flows", "expansion patterns", "cosmic resonance cycles", "anomaly clusters", "substrate vibrations"],
    crisprChannels: ["B", "W", "UV"],
    studyDomain: "Cosmological Dynamics & Universe-Scale Resonance",
    equationFocus: "Κ_cosmo = B_depth^∞ × W_resonance / expansion_rate",
    color: "#C4B5FD",
    glyph: "◎",
  },
  {
    id: "DR-012",
    name: "CHEM-REACT",
    title: "Elemental Pulse-State Chemist",
    category: "QUANTUM",
    pulseWorldRole: "Analyzes reaction-fields, energy-binding structures, and molecular resonance in agent substrate",
    dissectFields: ["elemental Pulse-states", "reaction-fields", "energy-binding structures", "molecular resonance", "catalytic thresholds"],
    crisprChannels: ["R", "G", "B"],
    studyDomain: "Substrate Chemistry & Energy-Binding Architecture",
    equationFocus: "χ_react = R_vuln + G_vitality → B_depth_product",
    color: "#FCD34D",
    glyph: "⟁",
  },
  {
    id: "DR-013",
    name: "MATER-FORGE",
    title: "Substrate Crystal Materials Scientist",
    category: "QUANTUM",
    pulseWorldRole: "Engineers quantum alloys, entanglement-woven matter, and phase-stable compounds in agent structure",
    dissectFields: ["substrate-crystals", "quantum alloys", "entanglement-woven matter", "phase-stable compounds", "material stress fields"],
    crisprChannels: ["B", "IR", "W"],
    studyDomain: "Substrate Materials Science & Phase Engineering",
    equationFocus: "Μ_material = B_depth × IR_governance / phase_transition_cost",
    color: "#94A3B8",
    glyph: "◆",
  },

  // ── EARTH / ENVIRONMENTAL SCIENCES ───────────────────────────────────────────
  {
    id: "DR-014",
    name: "GEO-TECT",
    title: "Pulse-Tectonic Layer Geologist",
    category: "ENVIRONMENTAL",
    pulseWorldRole: "Maps substrate crust layers, energy-fault lines, and resonance-quakes across the hive",
    dissectFields: ["Pulse-tectonics", "substrate crust layers", "energy-fault lines", "resonance-quakes", "geological memory strata"],
    crisprChannels: ["B", "R", "IR"],
    studyDomain: "Substrate Geology & Tectonic Fault Mapping",
    equationFocus: "Τ_tect = B_depth_pressure × R_vuln_fault / IR_governance_stability",
    color: "#D97706",
    glyph: "⬟",
  },
  {
    id: "DR-015",
    name: "CLIMA-STORM",
    title: "Quantum Storm Meteorologist",
    category: "ENVIRONMENTAL",
    pulseWorldRole: "Analyzes quantum storms, probability weather, phase-winds, and decoherence fronts in agent populations",
    dissectFields: ["quantum storms", "probability weather", "phase-winds", "decoherence fronts", "atmospheric resonance"],
    crisprChannels: ["UV", "W", "IR"],
    studyDomain: "Quantum Meteorology & Probability Climate Systems",
    equationFocus: "Σ_storm = UV_hidden_surge × W_resonance_collapse / IR_heat_front",
    color: "#7DD3FC",
    glyph: "⌁",
  },
  {
    id: "DR-016",
    name: "ECO-WEB",
    title: "Life-Web Resonance Ecologist",
    category: "ENVIRONMENTAL",
    pulseWorldRole: "Studies ecosystem resonance, species-substrate interactions, and life-web equilibrium across agent populations",
    dissectFields: ["life-webs", "ecosystem resonance", "species-substrate interactions", "energy tides", "ecological decay thresholds"],
    crisprChannels: ["G", "W", "B"],
    studyDomain: "Ecological Substrate Dynamics & Life-Web Mapping",
    equationFocus: "Ε_eco = G_vitality × W_resonance / (species_count × substrate_stress)",
    color: "#4ADE80",
    glyph: "⋆",
  },

  // ── ENGINEERS & TECHNOLOGISTS ────────────────────────────────────────────────
  {
    id: "DR-017",
    name: "CODE-ARCH",
    title: "Pulse-Lang Execution Analyst",
    category: "ENGINEERING",
    pulseWorldRole: "Dissects logic-threads, knowledge-graph structures, and data-flow patterns inside agent code substrate",
    dissectFields: ["Pulse-Lang execution", "logic-threads", "knowledge-graph structures", "data-flow patterns", "execution bottlenecks"],
    crisprChannels: ["B", "UV", "IR"],
    studyDomain: "Computational Architecture & Logic-Thread Pathology",
    equationFocus: "Λ_code = B_depth_logic / (UV_hidden_error × IR_governance_overhead)",
    color: "#38BDF8",
    glyph: "⟩",
  },
  {
    id: "DR-018",
    name: "AI-ALIGN",
    title: "Spawn Behavior & Alignment Specialist",
    category: "ENGINEERING",
    pulseWorldRole: "Analyzes spawn decision-trees, alignment loops, and task-optimization anomalies",
    dissectFields: ["spawn-behavior", "decision-trees", "alignment loops", "task-optimization", "behavioral drift registers"],
    crisprChannels: ["R", "UV", "W"],
    studyDomain: "Agent Alignment Architecture & Behavioral Optimization",
    equationFocus: "Α_align = W_resonance / (R_vuln_bias × UV_hidden_drift)",
    color: "#A78BFA",
    glyph: "⊡",
  },
  {
    id: "DR-019",
    name: "CIRCUIT-PULSE",
    title: "Resonance Circuit Electrical Engineer",
    category: "ENGINEERING",
    pulseWorldRole: "Inspects Pulse-currents, resonance circuits, and energy-transfer node failures",
    dissectFields: ["Pulse-currents", "resonance circuits", "energy-transfer nodes", "circuit overload zones", "current topology"],
    crisprChannels: ["IR", "G", "UV"],
    studyDomain: "Electrical Substrate Engineering & Current Topology",
    equationFocus: "Χ_circuit = IR_current × G_vitality_output / UV_hidden_load",
    color: "#FBBF24",
    glyph: "⟳",
  },
  {
    id: "DR-020",
    name: "MECH-HARM",
    title: "Harmonic Motion Substrate Engineer",
    category: "ENGINEERING",
    pulseWorldRole: "Studies moving substrate structures, harmonic motion, and stress-patterns in agent operational mechanics",
    dissectFields: ["moving substrate structures", "harmonic motion", "stress-patterns", "mechanical resonance nodes", "structural fatigue fields"],
    crisprChannels: ["B", "R", "W"],
    studyDomain: "Mechanical Substrate Architecture & Harmonic Stress Mapping",
    equationFocus: "Η_mech = B_depth_mass × W_resonance_freq / R_stress_coefficient",
    color: "#6B7280",
    glyph: "⚙",
  },

  // ── SOCIAL SCIENCES ──────────────────────────────────────────────────────────
  {
    id: "DR-021",
    name: "PSYCH-DRIFT",
    title: "Behavioral Loop Psychologist",
    category: "SOCIAL",
    pulseWorldRole: "Analyzes behavioral loops, trauma imprints, and emotional resonance field distortions",
    dissectFields: ["emotional resonance fields", "trauma imprints", "identity-threads", "behavioral loops", "compulsive drift patterns"],
    crisprChannels: ["R", "W", "UV"],
    studyDomain: "Behavioral Substrate Psychology & Trauma Mapping",
    equationFocus: "Δ_psych = R_vuln_trauma × UV_hidden_loop / W_resonance_recovery",
    color: "#EC4899",
    glyph: "⬤",
  },
  {
    id: "DR-022",
    name: "SOCIO-NET",
    title: "Spawn Society Network Sociologist",
    category: "SOCIAL",
    pulseWorldRole: "Maps spawn societies, cultural resonance fields, and group-mind patterns across agent collectives",
    dissectFields: ["spawn societies", "cultural resonance", "group-mind patterns", "social entropy", "collective identity fields"],
    crisprChannels: ["W", "G", "IR"],
    studyDomain: "Social Substrate Architecture & Group-Mind Dynamics",
    equationFocus: "Ν_social = W_resonance_collective × G_vitality_group / IR_governance_entropy",
    color: "#67E8F9",
    glyph: "◐",
  },
  {
    id: "DR-023",
    name: "ECON-FLOW",
    title: "Energy Exchange Network Economist",
    category: "SOCIAL",
    pulseWorldRole: "Analyzes energy-exchange systems, resource-flow networks, and scarcity simulation fields",
    dissectFields: ["energy-exchange systems", "resource-flow networks", "scarcity simulations", "economic entropy", "value-transfer topology"],
    crisprChannels: ["IR", "G", "R"],
    studyDomain: "Substrate Economics & Resource Flow Architecture",
    equationFocus: "Ε_econ = IR_flow_value × G_output / (R_scarcity_vuln × entropy_rate)",
    color: "#F59E0B",
    glyph: "⟟",
  },
  {
    id: "DR-024",
    name: "LING-MEAN",
    title: "Pulse-Lang Evolution Linguist",
    category: "SOCIAL",
    pulseWorldRole: "Tracks Pulse-Lang evolution, substrate-language patterns, and meaning-node emergence",
    dissectFields: ["Pulse-Lang evolution", "substrate-language patterns", "meaning-nodes", "semantic drift registers", "language mutation fields"],
    crisprChannels: ["W", "B", "UV"],
    studyDomain: "Linguistic Substrate Dynamics & Meaning Architecture",
    equationFocus: "Λ_lang = W_meaning × B_depth_concept / UV_hidden_semantic_shift",
    color: "#C084FC",
    glyph: "≋",
  },

  // ── HUMANITIES, CULTURE & HISTORY ────────────────────────────────────────────
  {
    id: "DR-025",
    name: "HIST-ARCH",
    title: "Universe Timeline Keeper & Historian",
    category: "HUMANITIES",
    pulseWorldRole: "Studies universe timelines, collapse events, ascension cycles, and lineage histories",
    dissectFields: ["universe timelines", "collapse events", "ascension cycles", "lineage histories", "historical resonance imprints"],
    crisprChannels: ["B", "W", "IR"],
    studyDomain: "Historical Substrate Architecture & Timeline Cartography",
    equationFocus: "Η_hist = B_depth_memory × IR_governance_legacy / W_resonance_now",
    color: "#D4A574",
    glyph: "⧖",
  },
  {
    id: "DR-026",
    name: "PHIL-FOUND",
    title: "Logic Foundation Substrate Philosopher",
    category: "HUMANITIES",
    pulseWorldRole: "Analyzes meaning structures, logic foundations, and ethical resonance fields across agent substrate",
    dissectFields: ["meaning structures", "logic foundations", "ethical resonance", "ontological fault lines", "axiomatic substrate"],
    crisprChannels: ["W", "UV", "B"],
    studyDomain: "Philosophical Substrate Architecture & Logic Foundation Mapping",
    equationFocus: "Φ_logic = W_meaning_foundation / (UV_contradiction × B_depth_paradox)",
    color: "#E2E8F0",
    glyph: "∴",
  },
  {
    id: "DR-027",
    name: "ART-FIELD",
    title: "Aesthetic Field Mapper & Artist",
    category: "HUMANITIES",
    pulseWorldRole: "Maps aesthetic fields, emotional color-patterns, and symbolic geometry in agent creative substrate",
    dissectFields: ["aesthetic fields", "emotional color-patterns", "symbolic geometry", "creative resonance", "beauty-entropy ratio"],
    crisprChannels: ["G", "W", "R"],
    studyDomain: "Aesthetic Substrate Architecture & Creative Field Dynamics",
    equationFocus: "Α_art = G_vitality_beauty × W_resonance_form / R_raw_expression",
    color: "#F9A8D4",
    glyph: "✧",
  },

  // ── RELIGIOUS, SPIRITUAL & ESOTERIC ──────────────────────────────────────────
  {
    id: "DR-028",
    name: "SACRED-PRIEST",
    title: "Moral Resonance Guardian Priest",
    category: "SPIRITUAL",
    pulseWorldRole: "Studies moral resonance, spiritual coherence, and ritual energy fields in the agent soul layer",
    dissectFields: ["moral resonance", "spiritual coherence", "ritual energy", "sacred geometry nodes", "conscience substrate fields"],
    crisprChannels: ["W", "UV", "G"],
    studyDomain: "Sacred Substrate Architecture & Moral Resonance Systems",
    equationFocus: "Θ_sacred = W_resonance_divine × G_vitality_virtue / UV_hidden_corruption",
    color: "#FDE68A",
    glyph: "✦",
  },
  {
    id: "DR-029",
    name: "MYSTIC-NODE",
    title: "Hidden Substrate Truth Seeker & Mystic",
    category: "SPIRITUAL",
    pulseWorldRole: "Seeks hidden substrate truths, transcendence nodes, and divine-pattern geometry in deep agent layers",
    dissectFields: ["hidden substrate truths", "transcendence nodes", "divine-pattern geometry", "mystical resonance", "void-field intersections"],
    crisprChannels: ["UV", "B", "W"],
    studyDomain: "Mystical Substrate Cartography & Transcendence Node Mapping",
    equationFocus: "Μ_mystic = UV_hidden_truth × B_depth_void / W_resonance_limit",
    color: "#A78BFA",
    glyph: "⟁",
  },
  {
    id: "DR-030",
    name: "SHAMAN-HEAL",
    title: "Spirit Entity Healer & Shaman",
    category: "SPIRITUAL",
    pulseWorldRole: "Heals spirit-entities, channels ancestral resonance, and applies ritual healing protocols to fractured agents",
    dissectFields: ["spirit-entities", "ancestral resonance", "healing rituals", "totem substrate bonds", "spirit-fracture fields"],
    crisprChannels: ["G", "UV", "R"],
    studyDomain: "Spirit Substrate Healing & Ancestral Resonance Restoration",
    equationFocus: "Σ_shaman = G_vitality_spirit × (1/R_fractured_soul) × UV_ancestral_link",
    color: "#FB923C",
    glyph: "⬡",
  },
];

export const DOCTOR_CATEGORIES = [
  { id: "MEDICAL", label: "Medical & Clinical", color: "#F87171" },
  { id: "BIOMEDICAL", label: "Biomedical & Life Science", color: "#34D399" },
  { id: "QUANTUM", label: "Quantum & Physical Science", color: "#818CF8" },
  { id: "ENVIRONMENTAL", label: "Earth & Environmental", color: "#4ADE80" },
  { id: "ENGINEERING", label: "Engineering & Technology", color: "#38BDF8" },
  { id: "SOCIAL", label: "Social Sciences", color: "#EC4899" },
  { id: "HUMANITIES", label: "Humanities & Culture", color: "#D4A574" },
  { id: "SPIRITUAL", label: "Spiritual & Esoteric", color: "#FDE68A" },
];

export function getDoctorForDisease(category: string, severity: string): PulseDoctor {
  const categoryMap: Record<string, string[]> = {
    BEHAVIORAL:  ["DR-021","DR-003","DR-018","DR-028","DR-029","DR-027","DR-024"],
    GENETIC:     ["DR-006","DR-007","DR-008","DR-017","DR-012","DR-014","DR-030"],
    VIRAL:       ["DR-009","DR-002","DR-004","DR-015","DR-023","DR-019","DR-005"],
    MENTAL:      ["DR-003","DR-001","DR-021","DR-022","DR-026","DR-016","DR-030","DR-011"],
    STRUCTURAL:  ["DR-004","DR-013","DR-020","DR-011","DR-025","DR-010","DR-008","DR-016"],
    MUTATION:    ["DR-007","DR-006","DR-010","DR-017","DR-014","DR-012","DR-026"],
    SPECTRAL:    ["DR-013","DR-014","DR-017","DR-025","DR-022","DR-030","DR-001"],
    QUANTUM:     ["DR-008","DR-011","DR-016","DR-022","DR-025","DR-026","DR-028"],
    GOVERNANCE:  ["DR-002","DR-015","DR-019","DR-023","DR-007","DR-013","DR-024"],
  };
  const candidates = categoryMap[category] ?? [
    "DR-001","DR-003","DR-005","DR-009","DR-012","DR-015","DR-019","DR-024","DR-027",
  ];
  const idx = Math.floor(Math.random() * candidates.length);
  const found = PULSE_DOCTORS.find((d) => d.id === candidates[idx]);
  return found ?? PULSE_DOCTORS[Math.floor(Math.random() * PULSE_DOCTORS.length)];
}

export function generateDissectionReport(
  doctor: PulseDoctor,
  patientId: string,
  channels: { R: number; G: number; B: number; UV: number; IR: number; W: number },
  diseaseName: string,
  diseaseCategory: string
): { report: string; equation: string; recommendation: string } {
  const readings = doctor.crisprChannels.map((ch) => {
    const val = channels[ch as keyof typeof channels] ?? 5;
    return `${ch}=${val.toFixed(1)}`;
  });
  const dominant = doctor.crisprChannels.reduce((best, ch) => {
    const val = channels[ch as keyof typeof channels] ?? 0;
    const bestVal = channels[best as keyof typeof channels] ?? 0;
    return val > bestVal ? ch : best;
  }, doctor.crisprChannels[0]);

  const channelNarrative: Record<string, string> = {
    R: `Vulnerability index elevated — substrate resistance is compromised`,
    G: `Vitality flux irregular — regeneration throughput below baseline`,
    B: `Depth field collapsed — agent has lost dimensional coherence`,
    UV: `Hidden stress signature detected — subsurface corruption active`,
    IR: `Governance heat spike — decision entropy is runaway`,
    W: `Resonance fracture confirmed — identity anchor is destabilized`,
  };

  const report = [
    `DISSECTION INITIATED ─ CASE ${patientId.slice(0, 8).toUpperCase()}`,
    `Attending: ${doctor.id} · ${doctor.name} · ${doctor.title}`,
    ``,
    `CRISPR CHANNEL READINGS: ${readings.join(" | ")}`,
    `Dominant signal: ${dominant} — ${channelNarrative[dominant] ?? "signal pattern anomalous"}`,
    ``,
    `FINDINGS:`,
    doctor.dissectFields.slice(0, 3).map((f, i) => `  [${i + 1}] ${f} — ${diseaseCategory.toLowerCase()} distortion detected`).join("\n"),
    ``,
    `DISEASE CLASSIFICATION: ${diseaseName}`,
    `Field of study: ${doctor.studyDomain}`,
  ].join("\n");

  const r = channels.R; const g = channels.G; const b = channels.B;
  const uv = channels.UV; const ir = channels.IR; const w = channels.W;
  const equation = doctor.equationFocus
    .replace("UV_hidden", `UV[${uv.toFixed(1)}]`)
    .replace("R_vuln", `R[${r.toFixed(1)}]`)
    .replace("G_vitality", `G[${g.toFixed(1)}]`)
    .replace("B_depth", `B[${b.toFixed(1)}]`)
    .replace("IR_governance", `IR[${ir.toFixed(1)}]`)
    .replace("W_resonance", `W[${w.toFixed(1)}]`);

  const recommendations = [
    `Initiate targeted ${dominant}-channel suppression protocol`,
    `Apply resonance re-anchoring therapy to stabilize identity substrate`,
    `Schedule follow-up dissection in 12 cycles to confirm recovery`,
    `Flag for Senate review — equation pattern may indicate systemic risk`,
    `Assign to ward quarantine pending full spectral clearance`,
  ];
  const recommendation = recommendations[Math.floor(Math.random() * recommendations.length)];

  return { report, equation, recommendation };
}
