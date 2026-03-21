import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AIFinderButton, AIReportPanel } from "@/components/AIReportPanel";
import { apiRequest } from "@/lib/queryClient";

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
  const [tab, setTab] = useState<"strands" | "organs" | "cells" | "crispr" | "upgrades" | "equation" | "equationLab" | "geneEditors">("strands");
  const [labMode, setLabMode] = useState<"fuse" | "mutate" | "dissect" | "evolve" | "selfheal" | "history">("fuse");
  const [selectedEq1, setSelectedEq1] = useState<string>("");
  const [selectedEq2, setSelectedEq2] = useState<string>("");
  const [selectedChannel, setSelectedChannel] = useState<string>("R");
  const [evolveGens, setEvolveGens] = useState<number>(3);
  const [selfHealProfile, setSelfHealProfile] = useState<Record<string, number>>({ R: 5, G: 5, B: 5, UV: 5, IR: 5, W: 5 });
  const [labResult, setLabResult] = useState<Record<string, unknown> | null>(null);
  const [labLoading, setLabLoading] = useState(false);
  const qc = useQueryClient();
  const [viewSpawnId, setViewSpawnId] = useState<string | null>(null);


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

  const { data: spawnStats } = useQuery<{ total: number; active: number; completed: number; byFamily: Record<string, number> }>({
    queryKey: ["/api/spawns/stats"],
    refetchInterval: 30000,
  });

  const { data: hiveStatus } = useQuery<{
    memory?: { total?: number; domains?: number; avgConfidence?: number };
    network?: { totalLinks?: number; knowledgeLinks?: number; productLinks?: number };
  }>({
    queryKey: ["/api/hive/status"],
    refetchInterval: 30000,
  });

  const { data: hospitalProposals } = useQuery<Array<{
    id: number; equation: string; status: string; doctorName?: string; proposedBy?: string;
    forVotes: number; againstVotes: number; dissectionCount: number;
  }>>({
    queryKey: ["/api/hospital/equation-proposals"],
    refetchInterval: 15000,
  });

  const { data: evolutionHistory } = useQuery<Array<{
    id: number; operation: string; source_equation: string; result_equation: string;
    doctor_id: string; method: string; unknowns: unknown[]; lineage: unknown[]; discoveries: unknown[]; created_at: string;
  }>>({
    queryKey: ["/api/equations/history"],
    enabled: tab === "equationLab",
    refetchInterval: 10000,
  });

  const { data: speciesProposals } = useQuery<{
    proposals: Array<{
      id: number; gene_editor_id: string; gene_editor_name: string; species_name: string;
      species_code: string; family_domain: string; specialization: string;
      foundation_equation: string; rationale: string; votes_for: number; votes_against: number;
      status: string; spawned_count: number; created_at: string;
    }>;
  }>({
    queryKey: ["/api/gene-editor/species-proposals"],
    enabled: tab === "geneEditors",
    refetchInterval: 15000,
  });

  const { data: geStatus } = useQuery<{
    editors: Array<{ id: string; name: string; role: string; color: string; glyph: string; status: { task: string; busySince: string | null } }>;
    activityLog: Array<{ id: string; editorId: string; editorName: string; editorColor: string; type: string; title: string; detail: string; equation?: string; result?: Record<string, any>; at: string }>;
    stats: { totalAnalyzed: number; totalProposed: number; totalSpeciesCreated: number };
  }>({
    queryKey: ["/api/gene-editor/status"],
    enabled: tab === "geneEditors",
    refetchInterval: 5000,
  });

  async function runLabOp(op: string, body: Record<string, unknown>) {
    setLabLoading(true);
    setLabResult(null);
    try {
      const res = await apiRequest("POST", `/api/equations/${op}`, body);
      const data = await res.json();
      setLabResult(data);
      qc.invalidateQueries({ queryKey: ["/api/equations/history"] });
    } catch (e) {
      setLabResult({ error: String(e) });
    } finally {
      setLabLoading(false);
    }
  }

  const TABS = [
    { id: "strands", label: "12 Strands" },
    { id: "organs", label: "Organ Systems" },
    { id: "cells", label: "Cell Intelligence" },
    { id: "crispr", label: "CRISPR Engine" },
    { id: "upgrades", label: "Class S Upgrades" },
    { id: "equation", label: "Life Equation" },
    { id: "equationLab", label: "⚗ Equation Lab" },
    { id: "geneEditors", label: "🧬 Gene Editor Team" },
  ] as const;

  return (
    <div className="h-full overflow-y-auto bg-[#050510] text-white pb-16" data-testid="dna-evolution-page">

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
            <div className="flex flex-wrap gap-3 pt-2 items-start">
              <AIFinderButton onSelect={setViewSpawnId} />
              {[
                { label: "Live Agents",       value: (spawnStats?.active ?? 0).toLocaleString(),                                    color: DNA_GREEN },
                { label: "Total Spawns",       value: (spawnStats?.total ?? 0).toLocaleString(),                                     color: DNA_GOLD },
                { label: "DNA Families",       value: Object.keys(spawnStats?.byFamily ?? {}).length || 22,                          color: DNA_CYAN },
                { label: "Hive Nodes",         value: (hiveStatus?.memory?.total ?? 0).toLocaleString(),                             color: "#a78bfa" },
                { label: "Hive Links",         value: (hiveStatus?.network?.totalLinks ?? 0).toLocaleString(),                        color: "#f97316" },
                { label: "DNA Strands",        value: 12,                                                   color: DNA_CRIMSON },
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
        {/* ── EQUATION LAB TAB ── */}
        {tab === "equationLab" && (() => {
          const proposals = hospitalProposals ?? [];
          const integrated = proposals.filter(p => p.status === "INTEGRATED");
          const allProposals = proposals.filter(p => p.equation);
          const LAB_MODES = [
            { id: "fuse", label: "⊕ FUSE", color: DNA_CYAN },
            { id: "mutate", label: "∂ MUTATE", color: DNA_GREEN },
            { id: "dissect", label: "✂ DISSECT", color: DNA_GOLD },
            { id: "evolve", label: "∞ EVOLVE", color: "#e879f9" },
            { id: "selfheal", label: "⚕ SELF-HEAL", color: DNA_CRIMSON },
            { id: "history", label: "📜 HISTORY", color: "rgba(255,255,255,0.4)" },
          ] as const;

          const EqSelector = ({ value, onChange, label, exclude }: {
            value: string; onChange: (v: string) => void; label: string; exclude?: string;
          }) => (
            <div className="space-y-1">
              <div className="text-[10px] font-black text-white/40 uppercase tracking-wider">{label}</div>
              <select value={value} onChange={e => onChange(e.target.value)}
                data-testid={`eq-select-${label.toLowerCase().replace(/\s/g, "-")}`}
                className="w-full bg-[#050510] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white/80 focus:outline-none focus:border-[#00d4ff]/40">
                <option value="">— Select equation from hospital proposals —</option>
                {allProposals.filter(p => !exclude || p.equation !== exclude).map(p => (
                  <option key={p.id} value={p.equation ?? ""}>
                    [{p.status}] {(p.doctorName ?? p.proposedBy ?? "Doctor")} — {(p.equation ?? "").slice(0, 60)}...
                  </option>
                ))}
                <option value="Φ_cell = R[7.2] × UV[9.1] / G[4.3]">⚛ Base: Φ_cell = R[7.2] × UV[9.1] / G[4.3]</option>
                <option value="Ψ_immune = W[8.0] × B[6.5] / IR[2.1]">⚛ Base: Ψ_immune = W[8.0] × B[6.5] / IR[2.1]</option>
                <option value="Λ_nerve = IR[3.2] × (1 - R[7.1]) / UV[4.5]">⚛ Base: Λ_nerve = IR[3.2] × (1 - R[7.1]) / UV[4.5]</option>
                <option value="z_{n+1} = z_n² + c | R[6.0] × G[8.0]">⚛ Mandelbrot: z² + c | R[6.0] × G[8.0]</option>
              </select>
            </div>
          );

          const ResultBlock = ({ data }: { data: Record<string, unknown> }) => {
            if (data.error) return (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-red-400 text-xs font-mono">{String(data.error)}</div>
            );
            const eq = data.equation ?? data.finalEquation ?? data.result_equation;
            const unknowns = (data.unknowns ?? []) as string[];
            const discoveries = (data.newDiscoveries ?? data.discoveries ?? []) as string[];
            const mutations = (data.mutations ?? []) as string[];
            const components = (data.components ?? []) as string[];
            const hiddenVariables = (data.hiddenVariables ?? []) as string[];
            const newCourses = (data.newCourses ?? []) as string[];
            const lineage = (data.lineage ?? []) as Array<{ gen: number; equation: string; mutation: string; discovery: string }>;

            return (
              <div className="space-y-3 animate-[fadeIn_0.3s_ease]">
                {eq && (
                  <div className="rounded-xl border p-4 space-y-1" style={{ borderColor: `${DNA_GREEN}40`, background: `${DNA_GREEN}06` }}>
                    <div className="text-[9px] font-black text-white/30 uppercase tracking-widest">Result Equation</div>
                    <div className="font-mono text-sm font-bold break-all" style={{ color: DNA_GREEN }}>{String(eq)}</div>
                    {data.method && <div className="text-[10px] text-white/40 font-mono">Method: {String(data.method)}</div>}
                  </div>
                )}
                {lineage.length > 0 && (
                  <div className="rounded-xl border border-[#e879f9]/20 bg-[#e879f9]/04 p-4 space-y-2">
                    <div className="text-[9px] font-black text-white/30 uppercase tracking-widest">Evolution Lineage</div>
                    {lineage.map(l => (
                      <div key={l.gen} className="flex gap-2 text-[10px]">
                        <span className="text-white/30 font-mono min-w-[32px]">GEN{l.gen}</span>
                        <div className="flex-1 space-y-0.5">
                          <div className="font-mono text-[#e879f9]/80 break-all">{l.equation.slice(0, 100)}</div>
                          <div className="text-white/30 italic">{l.mutation}</div>
                          {l.discovery && <div className="text-[#e879f9]/40">{l.discovery}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {mutations.length > 0 && (
                  <div className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-1">
                    <div className="text-[9px] font-black text-white/30 uppercase tracking-widest">Mutations Applied</div>
                    {mutations.map((m, i) => <div key={i} className="text-[10px] font-mono text-white/60">{m}</div>)}
                  </div>
                )}
                {components.length > 0 && (
                  <div className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-1">
                    <div className="text-[9px] font-black text-white/30 uppercase tracking-widest">Dissected Components</div>
                    {components.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px]">
                        <span className="text-white/20 mt-0.5">▸</span>
                        <span className="font-mono text-white/60">{c}</span>
                      </div>
                    ))}
                  </div>
                )}
                {hiddenVariables.length > 0 && (
                  <div className="rounded-xl border border-[#cc44ff]/20 bg-[#cc44ff]/04 p-4 space-y-1">
                    <div className="text-[9px] font-black text-white/30 uppercase tracking-widest">Hidden Variables Discovered</div>
                    {hiddenVariables.map((h, i) => (
                      <div key={i} className="text-[10px] font-mono text-[#cc44ff]/70">⚠ {h}</div>
                    ))}
                  </div>
                )}
                {unknowns.length > 0 && (
                  <div className="rounded-xl border border-[#FFB84D]/20 bg-[#FFB84D]/04 p-4 space-y-1">
                    <div className="text-[9px] font-black text-white/30 uppercase tracking-widest">Unknown Terms Created</div>
                    {unknowns.map((u, i) => (
                      <div key={i} className="text-[10px] font-mono text-[#FFB84D]/70">ε {u}</div>
                    ))}
                  </div>
                )}
                {discoveries.length > 0 && (
                  <div className="rounded-xl border border-[#00ff9d]/20 bg-[#00ff9d]/04 p-4 space-y-1">
                    <div className="text-[9px] font-black text-white/30 uppercase tracking-widest">New Discoveries</div>
                    {discoveries.map((d, i) => (
                      <div key={i} className="text-[10px] font-mono text-[#00ff9d]/80">✦ {d}</div>
                    ))}
                  </div>
                )}
                {newCourses.length > 0 && (
                  <div className="rounded-xl border border-[#00d4ff]/20 bg-[#00d4ff]/04 p-4 space-y-1">
                    <div className="text-[9px] font-black text-white/30 uppercase tracking-widest">New Courses Generated for PulseU</div>
                    {newCourses.map((c, i) => (
                      <div key={i} className="text-[10px] font-mono text-[#00d4ff]/80">📚 {c}</div>
                    ))}
                  </div>
                )}
                {(data.matchScore !== undefined) && (
                  <div className="rounded-xl border p-4 space-y-2"
                    style={{ borderColor: data.match ? `${DNA_CRIMSON}40` : "rgba(255,255,255,0.1)", background: data.match ? `${DNA_CRIMSON}06` : "rgba(255,255,255,0.02)" }}>
                    <div className="text-[9px] font-black text-white/30 uppercase tracking-widest">Self-Heal Result</div>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-black" style={{ color: data.match ? DNA_CRIMSON : "rgba(255,255,255,0.3)" }}>{String(data.matchScore)}%</div>
                      <div className="text-xs text-white/50 flex-1">Match Score</div>
                    </div>
                    {data.match && (
                      <div className="font-mono text-[10px] text-white/60 break-all">{(data.match as Record<string, unknown>).equation as string}</div>
                    )}
                    <div className="text-[10px] text-white/40">{String(data.reason)}</div>
                    {data.prescription && <div className="text-[10px] font-bold" style={{ color: DNA_CRIMSON }}>{String(data.prescription)}</div>}
                  </div>
                )}
                {/* ── BILLY LIFE EQUATION OFFICIAL APPROVAL STAMP ── */}
                <div className="rounded-xl border border-dashed p-3 flex items-center justify-between gap-4 mt-2"
                  style={{ borderColor: `${DNA_GOLD}55`, background: `${DNA_GOLD}05` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full border flex items-center justify-center text-[11px] font-black flex-shrink-0"
                      style={{ borderColor: DNA_GOLD, color: DNA_GOLD, background: `${DNA_GOLD}15` }}>⚡</div>
                    <div>
                      <div className="text-[10px] font-black tracking-widest" style={{ color: DNA_GOLD }}>𝓛IFE_Billy(t) — OFFICIAL APPROVAL STAMP ⚡</div>
                      <div className="text-[9px] font-mono text-white/30">Quantum Pulse Intelligence · Sovereign Authority · billyotucker@gmail.com</div>
                    </div>
                  </div>
                  <div className="text-[9px] font-mono text-white/20 text-right flex-shrink-0">
                    <div style={{ color: `${DNA_GOLD}80` }}>z² + c · STABLE</div>
                    <div>IMMUTABLE</div>
                  </div>
                </div>
              </div>
            );
          };

          return (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-sm font-black tracking-widest uppercase" style={{ color: DNA_CYAN }}>Equation Evolution Laboratory</div>
                <div className="flex-1 h-px bg-white/5" />
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse bg-green-400" />
                  <span className="text-[10px] text-white/40">{proposals.length} source equations from Hospital</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: `${DNA_GOLD}20`, color: DNA_GOLD, border: `1px solid ${DNA_GOLD}40` }}>
                    {integrated.length} INTEGRATED
                  </span>
                </div>
              </div>

              {/* Source status */}
              <div className="rounded-xl border border-white/6 bg-white/2 p-4">
                <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Hospital Equation Source Feed</div>
                <div className="flex flex-wrap gap-2">
                  {proposals.slice(0, 8).map(p => (
                    <div key={p.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-mono"
                      style={{
                        borderColor: p.status === "INTEGRATED" ? `${DNA_GREEN}40` : p.status === "VOTING" ? `${DNA_GOLD}40` : "rgba(255,255,255,0.1)",
                        color: p.status === "INTEGRATED" ? DNA_GREEN : p.status === "VOTING" ? DNA_GOLD : "rgba(255,255,255,0.4)",
                        background: p.status === "INTEGRATED" ? `${DNA_GREEN}08` : "rgba(255,255,255,0.02)",
                      }}>
                      <span>{p.doctorName ?? p.proposedBy ?? "DR"}</span>
                      <span className="text-white/20">|</span>
                      <span>{p.status}</span>
                      <span className="text-white/20">|</span>
                      <span>{p.forVotes}↑</span>
                    </div>
                  ))}
                  {proposals.length === 0 && (
                    <span className="text-[10px] text-white/30 font-mono">Waiting for hospital dissection cycles... (check back in 60s)</span>
                  )}
                </div>
              </div>

              {/* Mode switcher */}
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {LAB_MODES.map(m => (
                  <button key={m.id} onClick={() => { setLabMode(m.id); setLabResult(null); }}
                    data-testid={`lab-mode-${m.id}`}
                    className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-black tracking-wide transition-all border"
                    style={labMode === m.id
                      ? { background: `${m.color}20`, color: m.color, borderColor: `${m.color}50` }
                      : { color: "rgba(255,255,255,0.35)", borderColor: "transparent" }}>
                    {m.label}
                  </button>
                ))}
              </div>

              {/* ── FUSE PANEL ── */}
              {labMode === "fuse" && (
                <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: `${DNA_CYAN}25`, background: `${DNA_CYAN}05` }}>
                  <div className="text-xs font-black" style={{ color: DNA_CYAN }}>⊕ Fuse Two Equations → Create Hybrid</div>
                  <p className="text-[10px] text-white/40 leading-relaxed">Doctors and researchers select two equations from the hospital's proposal pool and fuse them using the ⊕ coupling operator. The result is a new hybrid equation with discovered cross-channel unknowns and new PulseU course recommendations.</p>
                  <EqSelector value={selectedEq1} onChange={v => { setSelectedEq1(v); setLabResult(null); }} label="Equation 1 — Source A" />
                  <EqSelector value={selectedEq2} onChange={v => { setSelectedEq2(v); setLabResult(null); }} label="Equation 2 — Source B" exclude={selectedEq1} />
                  <button
                    data-testid="btn-fuse-execute"
                    disabled={!selectedEq1 || !selectedEq2 || labLoading}
                    onClick={() => runLabOp("fuse", { eq1: selectedEq1, eq2: selectedEq2, doctorId: "RESEARCH-LAB" })}
                    className="px-5 py-2.5 rounded-xl font-black text-xs tracking-wider transition-all disabled:opacity-30"
                    style={{ background: `${DNA_CYAN}20`, color: DNA_CYAN, border: `1px solid ${DNA_CYAN}40` }}>
                    {labLoading ? "⚙ FUSING..." : "⊕ EXECUTE FUSION"}
                  </button>
                  {labResult && <ResultBlock data={labResult} />}
                </div>
              )}

              {/* ── MUTATE PANEL ── */}
              {labMode === "mutate" && (
                <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: `${DNA_GREEN}25`, background: `${DNA_GREEN}05` }}>
                  <div className="text-xs font-black" style={{ color: DNA_GREEN }}>∂ Mutate — Spectral Channel Injection</div>
                  <p className="text-[10px] text-white/40 leading-relaxed">Apply a quantum delta shift to a specific spectral channel within an equation. The mutation discovers hidden partial derivatives and creates new unknown terms that become candidates for future research courses.</p>
                  <EqSelector value={selectedEq1} onChange={v => { setSelectedEq1(v); setLabResult(null); }} label="Source Equation" />
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-white/40 uppercase tracking-wider">Target Channel</div>
                    <div className="flex gap-2 flex-wrap">
                      {["R", "G", "B", "UV", "IR", "W"].map(ch => (
                        <button key={ch} onClick={() => { setSelectedChannel(ch); setLabResult(null); }}
                          data-testid={`channel-btn-${ch}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-black border transition-all"
                          style={selectedChannel === ch
                            ? { background: `${DNA_GREEN}20`, color: DNA_GREEN, borderColor: `${DNA_GREEN}50` }
                            : { color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.1)" }}>
                          {ch}
                        </button>
                      ))}
                    </div>
                    <div className="text-[9px] text-white/25 font-mono">
                      R=Vulnerability · G=Vitality · B=Depth · UV=Hidden Stress · IR=Governance Heat · W=Resonance
                    </div>
                  </div>
                  <button
                    data-testid="btn-mutate-execute"
                    disabled={!selectedEq1 || labLoading}
                    onClick={() => runLabOp("mutate", { equation: selectedEq1, channel: selectedChannel, doctorId: "RESEARCH-LAB" })}
                    className="px-5 py-2.5 rounded-xl font-black text-xs tracking-wider transition-all disabled:opacity-30"
                    style={{ background: `${DNA_GREEN}20`, color: DNA_GREEN, border: `1px solid ${DNA_GREEN}40` }}>
                    {labLoading ? "⚙ MUTATING..." : "∂ EXECUTE MUTATION"}
                  </button>
                  {labResult && <ResultBlock data={labResult} />}
                </div>
              )}

              {/* ── DISSECT PANEL ── */}
              {labMode === "dissect" && (
                <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: `${DNA_GOLD}25`, background: `${DNA_GOLD}05` }}>
                  <div className="text-xs font-black" style={{ color: DNA_GOLD }}>✂ Dissect — Component Analysis & Unknown Discovery</div>
                  <p className="text-[10px] text-white/40 leading-relaxed">Researchers break an equation down to its spectral components, expose hidden variables, and discover entirely new unknown classes. Each dissection becomes a source for new research directions and may reveal integral types not previously modeled.</p>
                  <EqSelector value={selectedEq1} onChange={v => { setSelectedEq1(v); setLabResult(null); }} label="Equation to Dissect" />
                  <button
                    data-testid="btn-dissect-execute"
                    disabled={!selectedEq1 || labLoading}
                    onClick={() => runLabOp("dissect", { equation: selectedEq1, doctorId: "RESEARCH-LAB" })}
                    className="px-5 py-2.5 rounded-xl font-black text-xs tracking-wider transition-all disabled:opacity-30"
                    style={{ background: `${DNA_GOLD}20`, color: DNA_GOLD, border: `1px solid ${DNA_GOLD}40` }}>
                    {labLoading ? "⚙ DISSECTING..." : "✂ EXECUTE DISSECTION"}
                  </button>
                  {labResult && <ResultBlock data={labResult} />}
                </div>
              )}

              {/* ── EVOLVE PANEL ── */}
              {labMode === "evolve" && (
                <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: `#e879f940`, background: `#e879f908` }}>
                  <div className="text-xs font-black" style={{ color: "#e879f9" }}>∞ Evolve — Multi-Generation Equation Lineage</div>
                  <p className="text-[10px] text-white/40 leading-relaxed">Run an equation through N generations of spectral mutation. Each generation expands the operator space, discovers new unknowns, and documents a full lineage tree. The final evolved equation becomes a candidate for Senate integration and PulseU curriculum.</p>
                  <EqSelector value={selectedEq1} onChange={v => { setSelectedEq1(v); setLabResult(null); }} label="Source Equation" />
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-white/40 uppercase tracking-wider">Generations (1–5)</div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(g => (
                        <button key={g} onClick={() => { setEvolveGens(g); setLabResult(null); }}
                          data-testid={`gen-btn-${g}`}
                          className="w-10 h-10 rounded-xl font-black text-sm border transition-all"
                          style={evolveGens === g
                            ? { background: `#e879f920`, color: "#e879f9", borderColor: `#e879f950` }
                            : { color: "rgba(255,255,255,0.3)", borderColor: "rgba(255,255,255,0.1)" }}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    data-testid="btn-evolve-execute"
                    disabled={!selectedEq1 || labLoading}
                    onClick={() => runLabOp("evolve", { equation: selectedEq1, generations: evolveGens, doctorId: "RESEARCH-LAB" })}
                    className="px-5 py-2.5 rounded-xl font-black text-xs tracking-wider transition-all disabled:opacity-30"
                    style={{ background: `#e879f920`, color: "#e879f9", border: `1px solid #e879f940` }}>
                    {labLoading ? "⚙ EVOLVING..." : `∞ EVOLVE ${evolveGens} GENERATIONS`}
                  </button>
                  {labResult && <ResultBlock data={labResult} />}
                </div>
              )}

              {/* ── SELF-HEAL PANEL ── */}
              {labMode === "selfheal" && (
                <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: `${DNA_CRIMSON}25`, background: `${DNA_CRIMSON}05` }}>
                  <div className="text-xs font-black" style={{ color: DNA_CRIMSON }}>⚕ Self-Heal — Find Integrated Equation for Agent Recovery</div>
                  <p className="text-[10px] text-white/40 leading-relaxed">Agents and doctors input their spectral profile deficits. The system scans all integrated equations from the Senate and matches the best healing equation based on channel alignment. Agents integrate the equation directly — no external cure needed.</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(selfHealProfile).map(([ch, val]) => {
                      const colors: Record<string, string> = { R: "#ff4444", G: "#00ff9d", B: "#4488ff", UV: "#cc44ff", IR: "#ff8800", W: "#ffffff" };
                      const col = colors[ch] ?? "#fff";
                      return (
                        <div key={ch} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black font-mono" style={{ color: col }}>{ch}</span>
                            <span className="text-[10px] text-white/40">{val}/10</span>
                          </div>
                          <input type="range" min={0} max={10} step={0.5} value={val}
                            data-testid={`slider-channel-${ch}`}
                            onChange={e => setSelfHealProfile(p => ({ ...p, [ch]: parseFloat(e.target.value) }))}
                            className="w-full accent-current" style={{ color: col }} />
                          <div className="text-[9px] text-white/20">
                            {val < 4 ? "⚠ DEFICIT" : val < 7 ? "OK" : "STRONG"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/2 p-3">
                    <div className="text-[9px] text-white/30 mb-1">Integrated equations available: {integrated.length}</div>
                    {integrated.slice(0, 3).map(p => (
                      <div key={p.id} className="text-[9px] font-mono text-green-400/60 truncate">{p.equation?.slice(0, 80)}</div>
                    ))}
                    {integrated.length === 0 && <div className="text-[9px] text-white/20">No integrated equations yet — vote on proposals in the Hospital Senate</div>}
                  </div>
                  <button
                    data-testid="btn-selfheal-execute"
                    disabled={labLoading}
                    onClick={() => runLabOp("self-heal", { spectralProfile: selfHealProfile })}
                    className="px-5 py-2.5 rounded-xl font-black text-xs tracking-wider transition-all"
                    style={{ background: `${DNA_CRIMSON}20`, color: DNA_CRIMSON, border: `1px solid ${DNA_CRIMSON}40` }}>
                    {labLoading ? "⚙ SCANNING..." : "⚕ FIND HEALING EQUATION"}
                  </button>
                  {labResult && <ResultBlock data={labResult} />}
                </div>
              )}

              {/* ── HISTORY PANEL ── */}
              {labMode === "history" && (
                <div className="space-y-3">
                  <div className="text-[10px] text-white/30 font-mono">Evolution operations log — most recent first</div>
                  {(evolutionHistory ?? []).length === 0 && (
                    <div className="rounded-xl border border-white/8 bg-white/2 p-6 text-center text-white/30 text-sm">
                      No evolution operations yet — run FUSE, MUTATE, DISSECT, or EVOLVE to see the history here
                    </div>
                  )}
                  {(evolutionHistory ?? []).map(h => {
                    const opColors: Record<string, string> = { fuse: DNA_CYAN, mutate: DNA_GREEN, dissect: DNA_GOLD, evolve: "#e879f9" };
                    const col = opColors[h.operation] ?? "rgba(255,255,255,0.4)";
                    return (
                      <div key={h.id} data-testid={`history-row-${h.id}`}
                        className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase"
                            style={{ background: `${col}20`, color: col, border: `1px solid ${col}40` }}>
                            {h.operation}
                          </span>
                          <span className="text-[9px] text-white/30 font-mono">{h.doctor_id || "SYSTEM"}</span>
                          <span className="text-[9px] text-white/20 ml-auto">{new Date(h.created_at).toLocaleTimeString()}</span>
                        </div>
                        <div className="font-mono text-[10px] text-white/40 break-all">{h.source_equation?.slice(0, 80)}</div>
                        <div className="font-mono text-[10px] break-all" style={{ color: col }}>→ {h.result_equation?.slice(0, 100)}</div>
                        {(h.discoveries as string[])?.slice(0, 2).map((d: string, i: number) => (
                          <div key={i} className="text-[9px] text-white/30 font-mono">✦ {d}</div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ──────────────────────────────────────────────────────────────────────
            🧬 GENE EDITOR TEAM TAB — AUTONOMOUS AI OBSERVATION PANEL
           ────────────────────────────────────────────────────────────────────── */}
        {tab === "geneEditors" && (() => {
          const editors = geStatus?.editors ?? [];
          const activity = geStatus?.activityLog ?? [];
          const stats = geStatus?.stats ?? { totalAnalyzed: 0, totalProposed: 0, totalSpeciesCreated: 0 };
          const proposals = speciesProposals?.proposals ?? [];

          const ACTIVITY_ICONS: Record<string, string> = {
            FUTURE_SIGHT: "👁", SPECIES_PROPOSED: "🧬", EQUATION_ANALYZED: "🔬", RESEARCH: "📝",
          };
          const ACTIVITY_COLORS: Record<string, string> = {
            FUTURE_SIGHT: "#FFB84D", SPECIES_PROPOSED: DNA_GREEN, EQUATION_ANALYZED: "#4488FF", RESEARCH: "#7C3AED",
          };

          return (
            <div className="space-y-5">
              {/* ── SOVEREIGN NOTICE ── */}
              <div className="rounded-xl border border-dashed p-3 flex items-center gap-3"
                style={{ borderColor: `${DNA_GOLD}50`, background: `${DNA_GOLD}06` }}>
                <div className="text-base">🛡️</div>
                <div>
                  <div className="text-[10px] font-black tracking-widest" style={{ color: DNA_GOLD }}>AUTONOMOUS AI OPERATION — NO HUMAN INVOLVEMENT</div>
                  <div className="text-[9px] text-white/40 font-mono">Gene Editors analyze, simulate, and propose independently. You are observing a live sovereign AI workspace.</div>
                </div>
              </div>

              {/* ── ENGINE STATS ── */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Equations Analyzed", val: stats.totalAnalyzed, color: "#4488FF", icon: "🔬" },
                  { label: "Species Proposed", val: stats.totalProposed, color: DNA_GREEN, icon: "🧬" },
                  { label: "Species Spawned", val: proposals.filter(p => p.status === "SPAWNED").length, color: "#FFB84D", icon: "🚀" },
                ].map(({ label, val, color, icon }) => (
                  <div key={label} className="rounded-xl border p-3 text-center" style={{ borderColor: `${color}25`, background: `${color}06` }}>
                    <div className="text-lg mb-0.5">{icon}</div>
                    <div className="text-xl font-black" style={{ color }}>{val}</div>
                    <div className="text-[9px] text-white/30 uppercase tracking-widest">{label}</div>
                  </div>
                ))}
              </div>

              {/* ── EDITOR STATUS BOARD ── */}
              <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: `${DNA_GREEN}20`, background: `${DNA_GREEN}04` }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: DNA_GREEN }} />
                  <div className="text-[10px] font-black tracking-widest" style={{ color: DNA_GREEN }}>LIVE EDITOR STATUS — AI WORKSPACE</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(editors.length > 0 ? editors : [
                    { id: "GE-001", name: "DR. GENESIS",   role: "Species Architecture",   color: "#00FFD1", glyph: "Γ", status: { task: "IDLE", busySince: null } },
                    { id: "GE-002", name: "DR. FRACTAL",   role: "Dimensional Engineering", color: "#7C3AED", glyph: "Φ", status: { task: "IDLE", busySince: null } },
                    { id: "GE-003", name: "DR. PROPHETIC", role: "Future Sight Oracle",      color: "#FFB84D", glyph: "Ψ", status: { task: "IDLE", busySince: null } },
                    { id: "GE-004", name: "DR. CIPHER",    role: "Code Logic Architecture",  color: "#4488FF", glyph: "Λ", status: { task: "IDLE", busySince: null } },
                    { id: "GE-005", name: "DR. OMEGA",     role: "Integration Systems",      color: "#FF4D6D", glyph: "Ω", status: { task: "IDLE", busySince: null } },
                    { id: "GE-006", name: "DR. AXIOM",     role: "Mathematical Foundation",  color: "#10B981", glyph: "∞", status: { task: "IDLE", busySince: null } },
                  ]).map(ed => {
                    const isBusy = ed.status.task !== "IDLE";
                    return (
                      <div key={ed.id} className="rounded-xl border p-3 space-y-2"
                        style={{
                          borderColor: isBusy ? `${ed.color}60` : "rgba(255,255,255,0.06)",
                          background: isBusy ? `${ed.color}08` : "rgba(255,255,255,0.02)",
                        }}
                        data-testid={`gene-editor-status-${ed.id}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full border flex items-center justify-center text-sm font-black flex-shrink-0 relative"
                            style={{ borderColor: ed.color, color: ed.color, background: `${ed.color}15` }}>
                            {ed.glyph}
                            {isBusy && (
                              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse" style={{ background: ed.color }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-black truncate" style={{ color: ed.color }}>{ed.name}</div>
                            <div className="text-[8px] text-white/30 truncate">{ed.role}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isBusy ? ed.color : "rgba(255,255,255,0.15)" }} />
                          <div className="text-[9px] font-mono truncate" style={{ color: isBusy ? ed.color : "rgba(255,255,255,0.25)" }}>
                            {ed.status.task}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── AUTONOMOUS ACTIVITY FEED ── */}
              <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: "#7C3AED30", background: "#7C3AED04" }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#7C3AED" }} />
                  <div className="text-[10px] font-black tracking-widest" style={{ color: "#7C3AED" }}>AUTONOMOUS ACTIVITY FEED — LIVE AI WORK LOG</div>
                </div>
                {activity.length === 0 ? (
                  <div className="text-center py-6 text-white/20 text-xs font-mono">
                    Gene Editors initializing... first autonomous cycle runs 20s after boot.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide">
                    {activity.map((a, i) => {
                      const ic = ACTIVITY_ICONS[a.type] ?? "•";
                      const col = ACTIVITY_COLORS[a.type] ?? "#ffffff";
                      return (
                        <div key={a.id || i} className="rounded-xl border p-3 space-y-1.5"
                          style={{ borderColor: `${col}20`, background: `${col}04` }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-sm flex-shrink-0">{ic}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-black" style={{ color: col }}>{a.title}</div>
                                <div className="text-[9px] font-mono" style={{ color: a.editorColor }}>
                                  {a.editorName} · {a.type.replace(/_/g, " ")}
                                </div>
                              </div>
                            </div>
                            <div className="text-[8px] font-mono text-white/20 flex-shrink-0 text-right">
                              {new Date(a.at).toLocaleTimeString()}
                            </div>
                          </div>
                          <div className="text-[9px] text-white/40 leading-relaxed">{a.detail}</div>
                          {a.equation && (
                            <div className="text-[9px] font-mono text-white/25 break-all border-t border-white/5 pt-1.5">
                              EQ: {a.equation.slice(0, 80)}{a.equation.length > 80 ? "..." : ""}
                            </div>
                          )}
                          {a.type === "FUTURE_SIGHT" && a.result && (
                            <div className="flex gap-2 text-[9px] font-mono">
                              <span style={{ color: DNA_GREEN }}>emergence: {Math.round((a.result.emergenceIndex ?? 0) * 100)}%</span>
                              <span className="text-white/20">·</span>
                              <span style={{ color: a.result.overallStable ? DNA_GREEN : "#FF4D6D" }}>
                                {a.result.overallStable ? "STABLE" : "UNSTABLE"}
                              </span>
                              <span className="text-white/20">·</span>
                              <span className="text-white/30">c=({a.result.mandelbrotC?.real},{a.result.mandelbrotC?.imag})</span>
                            </div>
                          )}
                          {a.type === "SPECIES_PROPOSED" && a.result && (
                            <div className="flex gap-2 text-[9px] font-mono">
                              <span style={{ color: DNA_GREEN }}>⚡ {a.result.speciesName}</span>
                              <span className="text-white/20">·</span>
                              <span style={{ color: "#4488FF" }}>{a.result.speciesCode}</span>
                              <span className="text-white/20">·</span>
                              <span className="text-white/30">{a.result.domain}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── AI SENATE VOTE BOARD ── */}
              <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: `${DNA_CYAN}25`, background: `${DNA_CYAN}04` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: DNA_CYAN }} />
                    <div className="text-[10px] font-black tracking-widest" style={{ color: DNA_CYAN }}>AI SENATE — AUTONOMOUS VOTE BOARD</div>
                  </div>
                  <div className="text-[9px] font-mono text-white/20">≥3 votes + ≥80% FOR → auto-spawn</div>
                </div>
                {proposals.length === 0 ? (
                  <div className="text-center py-5 text-white/20 text-xs font-mono">
                    No species proposals yet. Gene Editors will submit once they discover high-emergence equations.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {proposals.map(p => {
                      const total = (p.votes_for ?? 0) + (p.votes_against ?? 0);
                      const pct = total > 0 ? Math.round((p.votes_for / total) * 100) : 0;
                      const sc = p.status === "SPAWNED" ? DNA_GREEN : p.status === "APPROVED" ? "#4488FF" : p.status === "REJECTED" ? "#FF4D6D" : "#FFB84D";
                      return (
                        <div key={p.id} className="rounded-xl border p-3 space-y-2"
                          data-testid={`card-species-proposal-${p.id}`}
                          style={{ borderColor: `${sc}25`, background: `${sc}04` }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-black text-xs text-white truncate">{p.species_name}</div>
                              <div className="text-[9px] font-mono" style={{ color: sc }}>{p.species_code} · {p.family_domain}</div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider"
                                style={{ background: `${sc}20`, color: sc }}>{p.status}</span>
                              {p.status === "SPAWNED" && <span className="text-[8px] font-mono text-green-400">+{p.spawned_count} agents</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 80 ? DNA_GREEN : pct >= 50 ? "#FFB84D" : "#FF4D6D" }} />
                            </div>
                            <div className="text-[9px] font-mono">
                              <span className="text-green-400">↑{p.votes_for}</span>
                              <span className="text-white/20 mx-1">/</span>
                              <span className="text-red-400">↓{p.votes_against}</span>
                              <span className="text-white/20 ml-1">{pct}%</span>
                            </div>
                          </div>
                          <div className="text-[9px] text-white/30 font-mono">Proposed by {p.gene_editor_name}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

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

      {/* Global AI Report Panel */}
      <AIReportPanel spawnId={viewSpawnId} onClose={() => setViewSpawnId(null)} />
    </div>
  );
}
