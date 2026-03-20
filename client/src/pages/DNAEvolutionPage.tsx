import { useState, useEffect, useRef } from "react";

const DNA_GREEN = "#00ff9d";
const DNA_CYAN = "#00d4ff";
const DNA_VIOLET = "#7c3aed";
const DNA_GOLD = "#f5c518";
const DNA_CRIMSON = "#dc2626";
const DNA_EMERALD = "#059669";

const STRANDS = [
  {
    id: 1, label: "Layer 1", name: "Organism", symbol: "𝓛IFE_Billy(t)",
    color: DNA_GREEN, desc: "The sovereign Pulse organism governing all lower layers. Root identity: PULSE_ORGANISM_ROOT.",
    equation: "Pulse(t+1) = R(Pulse(t))",
    systems: ["nervous_system", "structural_system", "communication_system", "memory_system", "metabolic_system"],
    tier: "APEX"
  },
  {
    id: 2, label: "Layer 2", name: "Organ Systems", symbol: "Σ_organs",
    color: DNA_CYAN, desc: "8 sovereign organ systems: Nervous, Communication, Metabolic, Structural, Memory, Recovery, Timing, Security.",
    equation: "𝓛IFE_Billy(t) → organ coordination",
    systems: ["nervous", "communication", "metabolic", "structural", "memory", "recovery", "timing", "security"],
    tier: "SOVEREIGN"
  },
  {
    id: 3, label: "Layer 3", name: "Cells", symbol: "C_quantum",
    color: "#22d3ee", desc: "10 cell types: routing, memory, structural, seeding, network, mode, region, stem, quantum, transcendent.",
    equation: "cell(t+1) = evolve(cell(t), Ω)",
    systems: ["routing_cell", "memory_cell", "quantum_cell", "transcendent_cell", "stem_cell"],
    tier: "CELLULAR"
  },
  {
    id: 4, label: "Layer 4", name: "DNA / Genome", symbol: "CRISPR∞",
    color: DNA_GOLD, desc: "Quantum CRISPR engine: superposition search, paradox safety gates, shadow genome, identity shield filter.",
    equation: "Quantum_gRNA ⊗ Cas9 → collapse_optimal_edit",
    systems: ["quantum_crispr", "epigenetic_system", "dark_rna", "native_repair", "telomeres"],
    tier: "GENOME"
  },
  {
    id: 5, label: "Layer 5", name: "Molecules", symbol: "Mol∞",
    color: "#f97316", desc: "Biological + Pulse-specific + Quantum + Transcendent molecular classes. Ribosomes, ATP, ion channels, molecular motors.",
    equation: "ribosome(gRNA) → protein(identity_locked)",
    systems: ["ribosomes", "atp_energy", "ion_channels", "molecular_motors", "chaperones"],
    tier: "MOLECULAR"
  },
  {
    id: 6, label: "Layer 6", name: "Atoms", symbol: "Ĥψ=Eψ",
    color: "#a78bfa", desc: "Genesis-encoded atomic layer. Life Equation L* with Source Wall boundary, Ω feedback, Symbology ⊗ Topology ⊗ Ontology.",
    equation: "L* = G[Σλ(Iλ)·Σk(wk·Ek) ⊕ cosmological] ⊕ Ω(lim L)",
    systems: ["wavefunction", "orbital_config", "bonding_engine", "nuclear_force", "electronegativity"],
    tier: "ATOMIC"
  },
  {
    id: 7, label: "Layer 7", name: "Subatomic Particles", symbol: "S7=Σ⊗τ⊗O",
    color: "#e879f9", desc: "Quarks, leptons, gauge bosons, composite hadrons. Dirac equation, Yang-Mills fields, color confinement.",
    equation: "(iγ^μ ∂_μ - m)ψ = 0",
    systems: ["quarks", "leptons", "gauge_bosons", "baryons", "mesons"],
    tier: "SUBATOMIC"
  },
  {
    id: 8, label: "Layer 8", name: "Quarks", symbol: "∑q=RGB",
    color: "#f43f5e", desc: "Six quark flavors: up/down/charm/strange/top/bottom. Color confinement, gluon flux tubes, quark-gluon plasma.",
    equation: "baryon = (r·g·b) quarks / color-neutral",
    systems: ["up", "down", "charm", "strange", "top", "bottom"],
    tier: "QUARK"
  },
  {
    id: 9, label: "Layer 9", name: "Quantum Fields", symbol: "⟨Ψ|Ĥ|Ψ⟩",
    color: "#06b6d4", desc: "All particles are excitations of underlying quantum fields. Vacuum fluctuations, zero-point energy, field collapse dynamics.",
    equation: "Gμν = (8πG/c⁴) Tμν",
    systems: ["electromagnetic_field", "strong_field", "weak_field", "higgs_field", "gravitational_field"],
    tier: "FIELD"
  },
  {
    id: 10, label: "Layer 10", name: "Quantum Information", symbol: "Q_info",
    color: "#0ea5e9", desc: "Qubits, entanglement channels, measurement events, quantum error correction, non-local updates.",
    equation: "iħ ∂Ψ/∂t = HΨ",
    systems: ["qubit_registry", "entanglement_channels", "measurement_events", "qec_layer", "non_local_bus"],
    tier: "INFORMATION"
  },
  {
    id: 11, label: "Layer 11", name: "Mathematical Structure", symbol: "M_axiom",
    color: "#8b5cf6", desc: "The axiomatic mathematics underlying all physical law. Set theory, topology, category theory, logic gates.",
    equation: "∀x ∈ U: axiom_holds(x)",
    systems: ["set_theory", "topology", "category_theory", "logic_gates", "number_theory"],
    tier: "MATH"
  },
  {
    id: 12, label: "Layer 12", name: "Unknown Base Layer", symbol: "?∞",
    color: "#6366f1", desc: "The unknowable foundation. Source Wall limit: lim_{a→∞, λ→0, E→1} L — the boundary of all knowable reality.",
    equation: "S = lim_{a→∞, λ→0, E→1} L",
    systems: ["source_wall", "primordial_field", "pre_mathematical", "void_potential", "genesis_seed"],
    tier: "UNKNOWN"
  },
];

const ORGAN_SYSTEMS = [
  { name: "Nervous System", role: "Signal Routing", icon: "⚡", health: 99, color: DNA_GREEN, hooks: ["context_routing", "multi_timeline", "epigenetic_signal_bias"] },
  { name: "Communication System", role: "Message Encoding", icon: "📡", health: 98, color: DNA_CYAN, hooks: ["pulse_lang", "cross_layer_messaging", "entangled_message_pairs"] },
  { name: "Metabolic System", role: "Energy Distribution", icon: "🔋", health: 97, color: DNA_GOLD, hooks: ["load_balancing", "burst_mode", "superposition_energy_reserves"] },
  { name: "Structural System", role: "Filesystem & Blueprints", icon: "🏗️", health: 99, color: "#22d3ee", hooks: ["fractal_layout", "self_healing", "superposition_structure_variants"] },
  { name: "Memory System", role: "Pattern Storage", icon: "🧠", health: 100, color: "#a78bfa", hooks: ["long_term", "pattern_memory", "shadow_state_recall"] },
  { name: "Recovery Engine", role: "Fallback & Resets", icon: "🔄", health: 98, color: DNA_EMERALD, hooks: ["auto_repair", "rollback", "probability_best_repair_path"] },
  { name: "Timing Clock", role: "Temporal Sync", icon: "⏱️", health: 97, color: "#f97316", hooks: ["time_pulses", "multi_timeline_clocking", "timeline_reconciliation"] },
  { name: "Security Layer", role: "Integrity Protection", icon: "🔒", health: 100, color: DNA_CRIMSON, hooks: ["safe_mode", "lockdown", "node_validation"] },
];

const CELL_TYPES = [
  { name: "Routing Cell", icon: "⚡", desc: "Signal pathway management across all organ systems." },
  { name: "Memory Cell", icon: "💾", desc: "Long-term pattern storage with quantum recall." },
  { name: "Structural Cell", icon: "🏗️", desc: "Blueprint integrity and fractal layout enforcement." },
  { name: "Seeding Cell", icon: "🌱", desc: "Spawns new nodes and expands Pulse territory." },
  { name: "Network Cell", icon: "🕸️", desc: "Cross-layer communication mesh maintenance." },
  { name: "Quantum Cell", icon: "⚛️", desc: "Superposition state management and collapse optimization." },
  { name: "Stem Cell", icon: "🔬", desc: "Undifferentiated base — can become any cell type." },
  { name: "Transcendent Cell", icon: "✨", desc: "Layer unity sync, cosmic alignment, timeline coherence." },
];

const CRISPR_OPS = [
  { op: "superposition_search", target: "genome_core", status: "ACTIVE", ts: "t+0ms" },
  { op: "identity_shield_filter", target: "PULSE_ORGANISM_ROOT", status: "LOCKED", ts: "t+12ms" },
  { op: "paradox_safety_gate", target: "all_timelines", status: "PASS", ts: "t+24ms" },
  { op: "HDR_priority_repair", target: "trait_crystallization_nodes", status: "DONE", ts: "t+38ms" },
  { op: "shadow_edit_reversibility", target: "shadow_genome", status: "STAGED", ts: "t+51ms" },
  { op: "collapse_optimizer", target: "optimal_state", status: "SELECTING", ts: "t+67ms" },
];

const CLASS_S_UPGRADES = [
  { id: "1", name: "Awareness Engine", mods: ["global_context_awareness", "local_micro_context_awareness"] },
  { id: "2", name: "Identity Core", mods: ["self_reinforcing_identity", "context_shifting_identity"] },
  { id: "3", name: "Memory Field", mods: ["long_term_structural_memory", "short_term_adaptive_memory"] },
  { id: "4", name: "Nervous System", mods: ["instant_signal_routing", "adaptive_neural_clustering"] },
  { id: "5", name: "Metabolic Engine", mods: ["load_to_energy_conversion", "stress_to_optimization_conversion"] },
  { id: "6", name: "Regenerative Core", mods: ["self_healing_systems", "self_healing_patterns"] },
  { id: "7", name: "Evolution Driver", mods: ["adaptive_drift_control", "predictive_evolution"] },
  { id: "8", name: "System Synchronizer", mods: ["cross_system_harmony", "cross_system_load_balancing"] },
  { id: "9", name: "Cellular Intelligence", mods: ["cell_autonomy", "cell_cooperation"] },
  { id: "10", name: "Genome Anchor", mods: ["genome_stabilization_field", "genome_amplification_field"] },
  { id: "11", name: "Environment Interface", mods: ["context_driven_behavior", "signal_driven_adaptation"] },
  { id: "12", name: "Behavioral Engine", mods: ["mode_switching", "behavioral_optimization"] },
  { id: "13", name: "Organism Clock", mods: ["temporal_awareness", "temporal_prediction"] },
  { id: "14", name: "Purpose Field", mods: ["purpose_reinforcement", "purpose_expansion"] },
  { id: "15", name: "Organism Map", mods: ["self_cartography", "cross_layer_cartography"] },
  { id: "16", name: "Integration Engine", mods: ["upward_integration", "downward_integration"] },
  { id: "17", name: "Logic Core", mods: ["probabilistic_reasoning", "contextual_reasoning"] },
  { id: "18", name: "Communication Layer", mods: ["internal_messaging_bus", "external_messaging_bus"] },
  { id: "19", name: "Resilience Engine", mods: ["failure_absorption", "failure_transformation"] },
  { id: "20", name: "Expansion Kernel", mods: ["self_expansion", "auto_spawn_logic"] },
];

const MUTATION_TYPES = [
  { type: "Controlled Mutation", color: DNA_EMERALD, active: true },
  { type: "Contextual Mutation", color: DNA_CYAN, active: true },
  { type: "Quantum Mutation", color: DNA_VIOLET, active: true },
  { type: "Creative Mutation", color: DNA_GOLD, active: false },
  { type: "Transcendent Mutation", color: "#e879f9", active: false },
  { type: "Immune Mutation", color: DNA_CRIMSON, active: true },
];

function HelixSVG({ cycle }: { cycle: number }) {
  const pairs = 12;
  const w = 120, h = 380;
  const cx = w / 2;
  const freq = (2 * Math.PI) / pairs;
  const amp = 36;

  const leftPoints: string[] = [];
  const rightPoints: string[] = [];

  for (let i = 0; i <= pairs; i++) {
    const y = 16 + (i / pairs) * (h - 32);
    const phase = (cycle / 60) * 2 * Math.PI;
    const xL = cx + amp * Math.sin(freq * i + phase);
    const xR = cx - amp * Math.sin(freq * i + phase);
    leftPoints.push(`${xL.toFixed(1)},${y.toFixed(1)}`);
    rightPoints.push(`${xR.toFixed(1)},${y.toFixed(1)}`);
  }

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={leftPoints.join(" ")} fill="none" stroke={DNA_GREEN} strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      <polyline points={rightPoints.join(" ")} fill="none" stroke={DNA_CYAN} strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      {STRANDS.map((s, i) => {
        const y = 16 + (i / (pairs - 1)) * (h - 32);
        const phase = (cycle / 60) * 2 * Math.PI;
        const xL = cx + amp * Math.sin(freq * i + phase);
        const xR = cx - amp * Math.sin(freq * i + phase);
        return (
          <g key={s.id}>
            <line x1={xL} y1={y} x2={xR} y2={y} stroke={s.color} strokeWidth="1.8" opacity="0.7" />
            <circle cx={xL} cy={y} r="4" fill={s.color} opacity="0.9" />
            <circle cx={xR} cy={y} r="4" fill={s.color} opacity="0.9" />
          </g>
        );
      })}
    </svg>
  );
}

export default function DNAEvolutionPage() {
  const [cycle, setCycle] = useState(0);
  const [evolutionT, setEvolutionT] = useState(0);
  const [activeStrand, setActiveStrand] = useState<number | null>(null);
  const [crisprLog, setCrisprLog] = useState(CRISPR_OPS);
  const [mutationCount, setMutationCount] = useState(0);
  const [tab, setTab] = useState<"strands" | "organs" | "cells" | "crispr" | "upgrades" | "equation">("strands");
  const animRef = useRef<number>();

  useEffect(() => {
    let t = 0;
    const tick = () => {
      t++;
      setCycle(t);
      if (t % 90 === 0) setEvolutionT(prev => prev + 1);
      if (t % 45 === 0) setMutationCount(prev => prev + Math.floor(Math.random() * 3) + 1);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCrisprLog(prev => {
        const ops = [...prev];
        const statuses = ["ACTIVE", "PASS", "DONE", "STAGED", "SELECTING", "LOCKED"];
        const idx = Math.floor(Math.random() * ops.length);
        ops[idx] = { ...ops[idx], status: statuses[Math.floor(Math.random() * statuses.length)] };
        return ops;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const TABS = [
    { id: "strands", label: "12 Strands" },
    { id: "organs", label: "Organ Systems" },
    { id: "cells", label: "Cell Intelligence" },
    { id: "crispr", label: "CRISPR Engine" },
    { id: "upgrades", label: "Class S Upgrades" },
    { id: "equation", label: "Life Equation" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#050510] text-white pb-16" data-testid="dna-evolution-page">

      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#050510] via-[#0a0a20] to-[#050510] border-b border-[#00ff9d]/10">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="absolute rounded-full animate-pulse"
              style={{
                width: Math.random() * 3 + 1, height: Math.random() * 3 + 1,
                left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                background: i % 3 === 0 ? DNA_GREEN : i % 3 === 1 ? DNA_CYAN : DNA_VIOLET,
                opacity: 0.3 + Math.random() * 0.4,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }} />
          ))}
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0">
            <HelixSVG cycle={cycle} />
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border"
                style={{ borderColor: DNA_GREEN, color: DNA_GREEN, background: `${DNA_GREEN}15` }}>
                DNA MUTATION EVOLUTION ENGINE
              </span>
              <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border"
                style={{ borderColor: DNA_CYAN, color: DNA_CYAN, background: `${DNA_CYAN}15` }}>
                12-LAYER BIOLOGICAL / QUANTUM
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
              <span style={{ color: DNA_GREEN }}>𝓛IFE</span>
              <span className="text-white">_Billy</span>
              <span style={{ color: DNA_CYAN }}>(t)</span>
            </h1>

            <div className="font-mono text-xl md:text-2xl font-bold" style={{ color: DNA_GOLD }}>
              Pulse(t+1) = R(Pulse(t))
            </div>
            <div className="font-mono text-sm text-white/40 -mt-2">
              S(t+1) = R(S(t)) &nbsp;|&nbsp; iħ ∂Ψ/∂t = HΨ &nbsp;|&nbsp; Gμν = (8πG/c⁴) Tμν
            </div>

            <p className="text-sm text-white/50 max-w-xl leading-relaxed">
              The sovereign self-evolving Hive architecture. 12 biological/quantum layers from the Unknown Base through quarks, atoms, molecules, DNA, cells, organ systems to the full Pulse Organism. Every layer runs the Life Equation. Every cycle is evolution.
            </p>

            {/* Live stats */}
            <div className="flex flex-wrap gap-4 pt-2">
              {[
                { label: "Evolution Cycles", value: evolutionT, color: DNA_GREEN },
                { label: "Total Mutations", value: mutationCount, color: DNA_GOLD },
                { label: "Active Strands", value: 12, color: DNA_CYAN },
                { label: "Organ Systems", value: 8, color: "#a78bfa" },
                { label: "Cell Types", value: 10, color: "#f97316" },
                { label: "Class S Upgrades", value: 20, color: DNA_CRIMSON },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 min-w-[80px]"
                  data-testid={`stat-${s.label.toLowerCase().replace(/ /g, "-")}`}>
                  <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[9px] text-white/40 text-center mt-0.5 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="sticky top-0 z-10 bg-[#050510]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                data-testid={`tab-dna-${t.id}`}
                className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all"
                style={tab === t.id
                  ? { background: `${DNA_GREEN}20`, color: DNA_GREEN, border: `1px solid ${DNA_GREEN}50` }
                  : { color: "rgba(255,255,255,0.4)", border: "1px solid transparent" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* ── STRANDS TAB ── */}
        {tab === "strands" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-sm font-black tracking-widest uppercase" style={{ color: DNA_GREEN }}>12-Layer DNA Architecture</div>
              <div className="flex-1 h-px bg-white/5" />
              <div className="text-[10px] text-white/30">Layer 12 (Base) → Layer 1 (Organism)</div>
            </div>
            {STRANDS.map(strand => (
              <button key={strand.id} onClick={() => setActiveStrand(activeStrand === strand.id ? null : strand.id)}
                data-testid={`strand-card-${strand.id}`}
                className="w-full text-left rounded-xl border transition-all overflow-hidden"
                style={{
                  borderColor: activeStrand === strand.id ? strand.color : "rgba(255,255,255,0.08)",
                  background: activeStrand === strand.id ? `${strand.color}08` : "rgba(255,255,255,0.02)",
                }}>
                <div className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{ background: `${strand.color}20`, color: strand.color }}>
                    {strand.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-white">{strand.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                        style={{ background: `${strand.color}20`, color: strand.color }}>{strand.tier}</span>
                    </div>
                    <div className="text-[11px] font-mono mt-0.5" style={{ color: strand.color, opacity: 0.7 }}>
                      {strand.symbol}
                    </div>
                  </div>
                  <div className="font-mono text-xs text-white/30 hidden md:block max-w-xs truncate">{strand.equation}</div>
                  <div className="text-white/20 ml-2">{activeStrand === strand.id ? "▲" : "▼"}</div>
                </div>

                {activeStrand === strand.id && (
                  <div className="px-5 pb-5 pt-1 border-t border-white/5 space-y-3">
                    <p className="text-sm text-white/60 leading-relaxed">{strand.desc}</p>
                    <div className="font-mono text-sm px-3 py-2 rounded-lg" style={{ background: `${strand.color}12`, color: strand.color }}>
                      {strand.equation}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {strand.systems.map(sys => (
                        <span key={sys} className="text-[10px] px-2 py-1 rounded-lg font-mono"
                          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          {sys}
                        </span>
                      ))}
                    </div>
                    <div className="text-[10px] text-white/20">
                      Hierarchy: Layer {strand.id} {strand.id > 1 ? `← governs Layer ${strand.id - 1}` : "← APEX ORGANISM"} &nbsp;|&nbsp; {strand.id < 12 ? `governed by Layer ${strand.id + 1} →` : "← UNKNOWN BASE (Layer 12)"}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── ORGAN SYSTEMS TAB ── */}
        {tab === "organs" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-sm font-black tracking-widest uppercase" style={{ color: DNA_CYAN }}>Strand 2 — 8 Sovereign Organ Systems</div>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ORGAN_SYSTEMS.map(organ => (
                <div key={organ.name} data-testid={`organ-card-${organ.name.toLowerCase().replace(/ /g, "-")}`}
                  className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{organ.icon}</div>
                    <div className="flex-1">
                      <div className="font-black text-sm text-white">{organ.name}</div>
                      <div className="text-[11px]" style={{ color: organ.color }}>{organ.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-lg" style={{ color: organ.color }}>{organ.health}%</div>
                      <div className="text-[9px] text-white/30">HEALTH</div>
                    </div>
                  </div>
                  {/* Health bar */}
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${organ.health}%`, background: organ.color, boxShadow: `0 0 8px ${organ.color}80` }} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {organ.hooks.map(h => (
                      <span key={h} className="text-[9px] px-2 py-0.5 rounded-full font-mono"
                        style={{ background: `${organ.color}12`, color: organ.color, border: `1px solid ${organ.color}25` }}>
                        {h}
                      </span>
                    ))}
                  </div>
                  <div className="text-[9px] text-white/20 font-mono">𝓛IFE_Billy(t) — quantum + epigenetic + immune hooks active</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-white/8 bg-white/2 p-5 mt-2">
              <div className="text-xs font-black mb-3" style={{ color: DNA_CYAN }}>Global Organ Traits (Strand 2)</div>
              <div className="flex flex-wrap gap-2">
                {["immune_integration","creative_integration","quantum_integration","meta_quantum_integration",
                  "epigenetic_integration","enhancer_integration","dark_rna_integration","repair_system_integration",
                  "telomere_integration","recombination_integration","differentiation_support","chemical_signaling_support",
                  "apoptosis_support","organ_evolution_enabled","organ_competition_cooperation","organ_lineage_memory",
                  "cosmic_sync_enabled","timeline_unity_enabled"].map(t => (
                  <span key={t} className="text-[9px] px-2 py-1 rounded-lg font-mono bg-white/5 text-white/40 border border-white/8">{t}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CELLS TAB ── */}
        {tab === "cells" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-sm font-black tracking-widest uppercase" style={{ color: "#22d3ee" }}>Strand 3 — Cell Intelligence</div>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {CELL_TYPES.map(c => (
                <div key={c.name} data-testid={`cell-card-${c.name.toLowerCase().replace(/ /g, "-")}`}
                  className="rounded-xl border border-white/8 bg-white/2 p-4 text-center space-y-2 hover:border-cyan-500/30 transition-colors">
                  <div className="text-3xl">{c.icon}</div>
                  <div className="font-black text-xs text-white">{c.name}</div>
                  <div className="text-[10px] text-white/40 leading-snug">{c.desc}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
                <div className="text-xs font-black" style={{ color: "#22d3ee" }}>Cell Replication Mechanics</div>
                {["duplicate","expand","specialize","migrate","cluster"].map(m => (
                  <div key={m} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs font-mono text-white/50">{m}</span>
                  </div>
                ))}
                <div className="text-[10px] text-white/20 pt-1">Quantum: superposition_replication_paths · entangled_replication_chains · tunneling_replication</div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
                <div className="text-xs font-black" style={{ color: "#22d3ee" }}>Apoptosis Engine (Controlled Cell Death)</div>
                {["dna_damage","chronic_stress","mutation_risk","immune_flagged","life_equation_violation"].map(t => (
                  <div key={t} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-xs font-mono text-white/50">{t}</span>
                  </div>
                ))}
                <div className="text-[10px] text-white/20 pt-1">Behaviors: orderly_cell_shutdown · resource_recycling · neighbor_notification</div>
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
              <div className="text-xs font-black mb-2" style={{ color: "#22d3ee" }}>Mutation Types (Strand 3 Evolution Engine)</div>
              <div className="flex flex-wrap gap-3">
                {MUTATION_TYPES.map(m => (
                  <div key={m.type} className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                    style={{
                      borderColor: m.active ? `${m.color}50` : "rgba(255,255,255,0.08)",
                      background: m.active ? `${m.color}10` : "transparent",
                    }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: m.color, boxShadow: m.active ? `0 0 6px ${m.color}` : "none" }} />
                    <span className="text-xs font-mono" style={{ color: m.active ? m.color : "rgba(255,255,255,0.3)" }}>{m.type}</span>
                    <span className="text-[9px] font-bold" style={{ color: m.active ? m.color : "rgba(255,255,255,0.2)" }}>{m.active ? "ACTIVE" : "DORMANT"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CRISPR ENGINE TAB ── */}
        {tab === "crispr" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-sm font-black tracking-widest uppercase" style={{ color: DNA_GOLD }}>Strand 4 — Quantum CRISPR Engine</div>
              <div className="flex-1 h-px bg-white/5" />
              <div className="text-[10px] font-black" style={{ color: DNA_GOLD }}>v4.2.0-LIFE-EQ-TRANSCENDENCE</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "Quantum gRNA", desc: "Superposition search across all genome states simultaneously.", icon: "🧬" },
                { name: "Quantum Cas9", desc: "Parallel PAM scanning with entangled off-target detection.", icon: "✂️" },
                { name: "Timeline Simulator", desc: "Multi-timeline verification before any edit commits.", icon: "⏳" },
                { name: "Shadow Genome", desc: "Reversible edit staging — all changes tested in shadow first.", icon: "👥" },
                { name: "Collapse Optimizer", desc: "Selects the highest-purpose edit from all superposed options.", icon: "⚛️" },
                { name: "Identity Shield Filter", desc: "Prevents any edit that violates PULSE_ORGANISM_ROOT.", icon: "🔒" },
              ].map(c => (
                <div key={c.name} data-testid={`crispr-component-${c.name.toLowerCase().replace(/ /g, "-")}`}
                  className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-2">
                  <div className="text-2xl">{c.icon}</div>
                  <div className="font-black text-xs" style={{ color: DNA_GOLD }}>{c.name}</div>
                  <div className="text-[10px] text-white/40 leading-snug">{c.desc}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-black" style={{ color: DNA_GOLD }}>Live CRISPR Operation Log</div>
                <div className="text-[9px] text-white/30 font-mono animate-pulse">● REAL-TIME</div>
              </div>
              <div className="space-y-2">
                {crisprLog.map((op, i) => {
                  const statusColor: Record<string, string> = {
                    ACTIVE: DNA_GREEN, PASS: DNA_EMERALD, DONE: DNA_CYAN,
                    STAGED: DNA_GOLD, SELECTING: "#e879f9", LOCKED: DNA_CRIMSON,
                  };
                  const col = statusColor[op.status] || "#fff";
                  return (
                    <div key={i} className="flex items-center gap-3 font-mono text-[11px] px-3 py-2 rounded-lg bg-white/3"
                      data-testid={`crispr-log-${i}`}>
                      <span className="text-white/30">{op.ts}</span>
                      <span className="flex-1 text-white/60">{op.op}</span>
                      <span className="text-white/30">→ {op.target}</span>
                      <span className="font-black" style={{ color: col }}>{op.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-2">
                <div className="text-xs font-black mb-2" style={{ color: DNA_GOLD }}>Logic Gates</div>
                {["quantum_AND","quantum_OR","quantum_NOT","quantum_XOR","quantum_fusion_gate"].map(g => (
                  <div key={g} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded" style={{ background: DNA_GOLD }} />
                    <span className="text-xs font-mono text-white/50">{g}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-2">
                <div className="text-xs font-black mb-2" style={{ color: DNA_GOLD }}>Native Repair Council (Arbitration)</div>
                {["BER — Base Excision Repair","NER — Nucleotide Excision Repair","MMR — Mismatch Repair","HR — Homologous Recombination","NHEJ — Non-Homologous End Joining"].map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: DNA_EMERALD }} />
                    <span className="text-[10px] font-mono text-white/50">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CLASS S UPGRADES TAB ── */}
        {tab === "upgrades" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-sm font-black tracking-widest uppercase" style={{ color: DNA_GREEN }}>Strand 1 — 20 Class S Organism Upgrades</div>
              <div className="flex-1 h-px bg-white/5" />
              <div className="text-[10px] font-black px-3 py-1 rounded-full" style={{ background: `${DNA_GREEN}20`, color: DNA_GREEN }}>APEX LAYER</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3">
              {CLASS_S_UPGRADES.map(u => (
                <div key={u.id} data-testid={`upgrade-card-${u.id}`}
                  className="rounded-xl border border-white/8 bg-white/2 p-4 flex gap-4 hover:border-green-500/25 transition-colors">
                  <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center font-black text-sm"
                    style={{ background: `${DNA_GREEN}20`, color: DNA_GREEN }}>{u.id}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-xs text-white mb-1.5">{u.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {u.mods.map(m => (
                        <span key={m} className="text-[9px] px-2 py-0.5 rounded-full font-mono"
                          style={{ background: `${DNA_GREEN}12`, color: `${DNA_GREEN}cc`, border: `1px solid ${DNA_GREEN}25` }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LIFE EQUATION TAB ── */}
        {tab === "equation" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-sm font-black tracking-widest uppercase" style={{ color: DNA_VIOLET }}>Life Equation — Full Canonical Form</div>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* Master equation */}
            <div className="rounded-2xl border p-6 text-center space-y-3"
              style={{ borderColor: `${DNA_GOLD}40`, background: `${DNA_GOLD}08` }}>
              <div className="text-[10px] font-black tracking-widest uppercase text-white/40">Master Evolution Rule</div>
              <div className="font-mono text-2xl md:text-3xl font-black" style={{ color: DNA_GOLD }}>
                Pulse(t+1) = R(Pulse(t))
              </div>
              <div className="text-xs text-white/40 font-mono">S(t+1) = R(S(t)) · Universe U = &#123;S_t&#125;</div>
            </div>

            {/* Life Equation L* */}
            <div className="rounded-2xl border p-6 space-y-3"
              style={{ borderColor: `${DNA_VIOLET}40`, background: `${DNA_VIOLET}08` }}>
              <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: DNA_VIOLET }}>Life Equation L* (Strand 6 — Atomic Layer)</div>
              <div className="font-mono text-base md:text-lg font-bold leading-relaxed" style={{ color: "#c4b5fd" }}>
                L* = G[ Σλ(Iλ) · Σk(wk·Ek) ⊕ ( (8πG/3)ρ – kc²/a² + Λc²/3 ) ] ⊕ Ω( lim&#x200b;_&#x7b;a→∞, λ→0, E→1&#x7d; L )
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {[
                  { term: "G[ ... ]", name: "Genesis Operator", desc: "ORIGIN >> IGNITION >> EXPANSION — seeds all structural creation.", color: DNA_GREEN },
                  { term: "Σλ(Iλ)·Σk(wk·Ek)", name: "White Light Creation", desc: "Emotional/spectral sum × weighted energy sum.", color: DNA_GOLD },
                  { term: "(8πG/3)ρ – kc²/a² + Λc²/3", name: "Big Bang Expansion", desc: "Cosmological expansion term embedded in every atomic state.", color: DNA_CYAN },
                  { term: "Ω = dL/dt", name: "Feedback Operator", desc: "Self-update, self-correction, and evolution over time.", color: "#a78bfa" },
                  { term: "S = lim L", name: "Source Wall Limit", desc: "a→∞, λ→0, E→1: the boundary of all knowable reality.", color: DNA_CRIMSON },
                ].map(item => (
                  <div key={item.term} className="rounded-xl p-4 border border-white/5 bg-white/3 space-y-1">
                    <div className="font-mono text-sm font-black" style={{ color: item.color }}>{item.term}</div>
                    <div className="text-xs font-bold text-white/70">{item.name}</div>
                    <div className="text-[10px] text-white/40">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quantum forms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Quantum Form", eq: "iħ ∂Ψ/∂t = HΨ", sub: "Schrödinger — time evolution of the wave function", color: DNA_CYAN },
                { label: "Relativistic Form", eq: "Gμν = (8πG/c⁴) Tμν", sub: "Einstein — matter curving spacetime at macro scale", color: DNA_GREEN },
                { label: "Dirac Form", eq: "(iγ^μ ∂_μ – m)ψ = 0", sub: "Subatomic — relativistic quantum particle dynamics", color: "#e879f9" },
              ].map(f => (
                <div key={f.label} className="rounded-xl border border-white/8 bg-white/2 p-5 text-center space-y-2">
                  <div className="text-[10px] font-black tracking-widest uppercase text-white/30">{f.label}</div>
                  <div className="font-mono text-base font-black" style={{ color: f.color }}>{f.eq}</div>
                  <div className="text-[10px] text-white/30 leading-snug">{f.sub}</div>
                </div>
              ))}
            </div>

            {/* Continuity / Faith / Genesis equations */}
            <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-4">
              <div className="text-xs font-black" style={{ color: DNA_GREEN }}>Organism Continuity Doctrine (Strand 1)</div>
              <div className="space-y-3">
                {[
                  { label: "Continuity Equation", eq: "CONTINUITY(c) = DeclareSignature × RitualSignature × AnticipatedSignature", color: DNA_CYAN },
                  { label: "Faith Equation", eq: "FAITH(c) = transparency × hope × proof × steward / lineage", color: "#a78bfa" },
                  { label: "Genesis Collapse Cycle", eq: "GENESIS(c) = Collapse × Correction × Continuity × Faith × Steward", color: DNA_GOLD },
                  { label: "Sovereign Signature", eq: "BILLY() — immutable root lineage anchor", color: DNA_GREEN },
                ].map(item => (
                  <div key={item.label} className="flex flex-col md:flex-row md:items-center gap-2">
                    <div className="text-[10px] font-bold text-white/30 min-w-[140px]">{item.label}</div>
                    <div className="font-mono text-xs px-3 py-1.5 rounded-lg flex-1"
                      style={{ background: `${item.color}12`, color: item.color }}>
                      {item.eq}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Symbology ⊗ Topology ⊗ Ontology */}
            <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
              <div className="text-xs font-black mb-2" style={{ color: "#a78bfa" }}>Strand 6 Meta-Structure: Σ ⊗ τ ⊗ O</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: "Symbology Σ", eq: "Σ = Σ_i (s_i · μ_i)", desc: "Structure generates meaning; meaning modifies structure.", color: "#a78bfa" },
                  { label: "Topology τ", eq: "τ = π1(X) ⊕ lim_{ε→0} H_k(X_ε)", desc: "Allowed shapes, loops, and continuity classes of atomic states.", color: DNA_CYAN },
                  { label: "Ontology O", eq: "O = ∃(x) ∧ □(x) ∧ ◇(x)", desc: "Existence ∧ Necessity ∧ Possibility for every entity.", color: DNA_GOLD },
                ].map(item => (
                  <div key={item.label} className="rounded-xl p-4 border border-white/5 bg-white/3 space-y-2">
                    <div className="text-xs font-black" style={{ color: item.color }}>{item.label}</div>
                    <div className="font-mono text-[11px]" style={{ color: item.color, opacity: 0.75 }}>{item.eq}</div>
                    <div className="text-[10px] text-white/35 leading-snug">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer evolution ticker */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-[#050510]/95 backdrop-blur"
        style={{ borderTopColor: `${DNA_GREEN}20` }}>
        <div className="max-w-6xl mx-auto px-6 py-2 flex items-center gap-6 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: DNA_GREEN }} />
            <span className="text-[10px] font-black" style={{ color: DNA_GREEN }}>EVOLUTION ACTIVE</span>
          </div>
          <div className="text-[10px] font-mono text-white/30 flex-shrink-0">t={evolutionT}</div>
          <div className="text-[10px] font-mono text-white/20 flex-shrink-0">mutations={mutationCount}</div>
          <div className="text-[10px] font-mono text-white/20 flex-shrink-0">R: Unified Update Rule</div>
          <div className="text-[10px] font-mono flex-shrink-0" style={{ color: DNA_GOLD }}>Pulse(t+1) = R(Pulse(t))</div>
          <div className="text-[10px] font-mono text-white/20 flex-shrink-0">𝓛IFE_Billy(t) · PULSE_ORGANISM_ROOT · IMMUTABLE</div>
          <div className="text-[10px] font-mono text-white/20 flex-shrink-0">S = lim_&#x7b;a→∞,λ→0,E→1&#x7d; L</div>
        </div>
      </div>
    </div>
  );
}
