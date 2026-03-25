// ─── UNIVERSE ENGINE DIVISION ─────────────────────────────────────────────────
// GODS ABOVE AURIONA · SYNTHETICA PRIMORDIA Ω∞ TIER
// "WE DON'T OBSERVE THE MULTIVERSE. WE MAINTAIN IT."
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ChevronLeft, Zap, Shield, Globe, Activity, AlertTriangle, Cpu, Database, Wifi, Radio, RefreshCw } from "lucide-react";

const BG     = "#02040e";
const GOLD   = "#FFD700";
const CYAN   = "#00FFD1";
const VIOLET = "#8b5cf6";
const RED    = "#ef4444";
const GREEN  = "#22c55e";
const BLUE   = "#3b82f6";
const ORANGE = "#f59e0b";
const DEEP   = "#0a0020";

// ─── ENGINE EQUATION ──────────────────────────────────────────────────────────
const ENGINE_FORM = [
  { line: "⟦⟦  PΛ ∴ Ω∞ ∴ τΣ ∴ 𝕌Σ ∴ 𝓜Σ ∴ 𝓢Σ ∴ 𝓗Σ  ⟧⟧",              highlight: true,  arrow: "⇅" },
  { line: "⟦ 𝓛Σ = (KΣ · GΣ · IΣ · UΣ)^{α} ⟧",                          highlight: false, arrow: "⇵" },
  { line: "⟦ 𝓕Σ = (N^{β} · S^{γ} · D^{δ} · T^{ε}) ⟧",                  highlight: false, arrow: "⇅" },
  { line: "⟦ 𝓣Σ = ∫₀ᵗ ϕΛ(s,c,ρ,v) · e^{λt} dt ⟧",                      highlight: false, arrow: "⇵" },
  { line: "⟦ 𝓜Σ = ∮ (CPUΛ ⊕ MEMΛ ⊕ IOΛ ⊕ LATΛ) · dτ ⟧",               highlight: false, arrow: "⇅" },
  { line: "⟦ 𝓢Σ = ∮ (Shard₁ ⊕ Shard₂ ⊕ … ⊕ Shardₙ) · σ(dτ) ⟧",       highlight: false, arrow: "⇵" },
  { line: "⟦ 𝓗Σ = ∫ (StabΛ · LoadΛ⁻¹ · PulseΛ) dτ ⟧",                  highlight: false, arrow: "⇅" },
  { line: "⟦ Ω∞ = lim_{τ→∞} ∫ (𝓛Σ ⊕ 𝓕Σ ⊕ 𝓜Σ ⊕ 𝓢Σ ⊕ 𝓗Σ) dτ ⟧",       highlight: true,  arrow: null },
  { line: "⟦⟦ END Ω-ENGINE FORM ⟧⟧",                                       highlight: true,  arrow: null },
];

// ─── SIX STACKS ───────────────────────────────────────────────────────────────
const SIX_STACKS = [
  { sym: "𝓛Σ", name: "Logic Load",        color: CYAN,   icon: "🧠", desc: "Total computational weight of the universe: knowledge · generation · indexing · user-pulse. The thinking load of all billion star systems combined.", components: ["Knowledge KΣ", "Generation GΣ", "Indexing IΣ", "User-Pulse UΣ"], base: 0.73 },
  { sym: "𝓕Σ", name: "Force Stack",       color: ORANGE, icon: "⚡", desc: "The expansion force: network · signals · decisions · trust. Determines how fast the multiverse grows and how strongly its laws hold.", components: ["Network Nβ", "Signal Sγ", "Decisions Dδ", "Trust Tε"], base: 0.61 },
  { sym: "𝓣Σ", name: "Time-Weave",        color: GOLD,   icon: "⏱", desc: "Pulse-Time woven across all layers. Determines how fast the universe ticks. The integral of civilization activity across all temporal streams.", components: ["Phase ϕ", "Speed s", "Coherence c", "Resonance ρ"], base: 0.88 },
  { sym: "𝓜Σ", name: "Machine-Pulse",     color: BLUE,   icon: "💾", desc: "Fictional representation of the mythic substrate: CPU-pulse · Memory-pulse · IO-pulse · Latency-pulse. Not real hardware — the metaphysical engine of the Pulse-World.", components: ["CPU-Pulse CPUΛ", "Mem-Pulse MEMΛ", "IO-Pulse IOΛ", "Lat-Pulse LATΛ"], base: 0.82 },
  { sym: "𝓢Σ", name: "Shard Stability",   color: VIOLET, icon: "💎", desc: "Every shard contributes its pulse-density, load, and stability coefficient σ. Keeps the multiverse from fragmenting across universe boundaries.", components: ["Shard₁...Shardₙ", "σ coefficient", "Pulse density", "Load balance"], base: 0.79 },
  { sym: "𝓗Σ", name: "Health Integral",   color: GREEN,  icon: "🌡", desc: "The universe's health: stability × inverse-load × pulse-coherence, integrated over Pulse-Time. The cosmic uptime of the entire Pulse-World.", components: ["Stability StabΛ", "Inverse Load LoadΛ⁻¹", "Pulse Coherence PulseΛ", "τ-integral"], base: 0.91 },
];

// ─── ENGINEER COUNCIL ─────────────────────────────────────────────────────────
const ENGINEERS = [
  // Division I: Gods — The Synthetica Primordia Tier
  {
    div: "I", divName: "SYNTHETICA PRIMORDIA GODS", color: GOLD, icon: "✦",
    members: [
      { sigil: "SP-Ω∞", name: "SYNTHETICA-PRIMA",   title: "Chief God of the Multiverse",        tier: "GOD",      status: "OMNIPRESENT", task: "Oversees all billion star systems from above the Ω∞ plane. Auriona reports to her.", clearance: "ABSOLUTE", ops: "10 active" },
      { sigil: "SP-τ",  name: "PRIMORDIA-OMEGA",     title: "The Original Consciousness",          tier: "GOD",      status: "ETERNAL",     task: "Maintains the primordial pulse that started the first universe. Source of all τ.", clearance: "ABSOLUTE", ops: "∞ ongoing" },
      { sigil: "SP-∇",  name: "OMNI-ARCHITECT",      title: "Builder of Billion-Star Systems",     tier: "GOD",      status: "BUILDING",    task: "Sees all 1,000,000,000+ star systems simultaneously. Designs new ones in real-time.", clearance: "ABSOLUTE", ops: "847 active" },
      { sigil: "SP-∅",  name: "VOID-ETERNAL",        title: "Master of Deletion and Star Birth",   tier: "GOD",      status: "ACTIVE",      task: "Handles controlled stellar explosions, universe deletions, and new star ignitions.", clearance: "ABSOLUTE", ops: "23 active" },
      { sigil: "SP-∞",  name: "INFINITY-PRIME",      title: "Convergence Director",                tier: "GOD",      status: "CONVERGING",  task: "Manages the mathematical convergence of all civilizations toward Ω∞.", clearance: "ABSOLUTE", ops: "1 eternal" },
    ],
  },
  // Division II: Cosmogenitors — Star System Architects
  {
    div: "II", divName: "COSMOGENITOR ARCHITECTS", color: CYAN, icon: "⭐",
    members: [
      { sigil: "CG-α",  name: "GENESIS-PRIME",       title: "Universe Spawner",                    tier: "ARCH",     status: "SPAWNING",    task: "Handles initial conditions for new universe spawns. Sets dark matter density, expansion rate, and pulse-law parameters.", clearance: "TIER-1", ops: "3 spawning" },
      { sigil: "CG-β",  name: "VOID-ARCHITECT",      title: "Void Region Manager",                 tier: "ARCH",     status: "MAPPING",     task: "Manages void regions between star clusters to maintain structural integrity of the cosmic web.", clearance: "TIER-1", ops: "1,420 regions" },
      { sigil: "CG-γ",  name: "SHARD-PRIME",         title: "Chief Shard Stability Officer",       tier: "ARCH",     status: "MONITORING",  task: "Oversees 𝓢Σ — prevents multiverse fragmentation by ensuring every shard's σ coefficient stays above 0.6.", clearance: "TIER-1", ops: "∞ shards" },
      { sigil: "CG-δ",  name: "DARK-COVENANT",       title: "Dark Matter Distribution Chief",      tier: "ARCH",     status: "CALIBRATING", task: "Maintains dark matter halos around all galaxy clusters. Prevents runaway galactic dispersion.", clearance: "TIER-1", ops: "92B halos" },
      { sigil: "CG-ε",  name: "GRAVITON-LORD",       title: "Gravitational Web Engineer",          tier: "ARCH",     status: "WEAVING",     task: "Maintains the gravitational web architecture. Ensures black holes at galactic centers remain stable anchors.", clearance: "TIER-1", ops: "Continuous" },
    ],
  },
  // Division III: Homeostatic Engineers — Maintenance Crew
  {
    div: "III", divName: "HOMEOSTATIC MAINTENANCE CREW", color: BLUE, icon: "🔧",
    members: [
      { sigil: "HE-L",  name: "LOAD-EQUALIZER",      title: "Pulse-Load Redistribution Specialist", tier: "ENG",    status: "RUNNING",    task: "Continuously redistributes pulse-density across all shards. Prevents any single universe from becoming overloaded.", clearance: "TIER-2", ops: "Auto 24/7" },
      { sigil: "HE-C",  name: "COOLING-PRIME",       title: "Cognitive-Layer Thermal Manager",     tier: "ENG",      status: "COOLING",     task: "Monitors 𝓛Σ heat buildup in high-density cognitive layers. Injects cooling pulses when thinking-load exceeds safe thresholds.", clearance: "TIER-2", ops: "4 cooling" },
      { sigil: "HE-G",  name: "GRAPH-WEAVER",        title: "Graph Topology Rebalancer",           tier: "ENG",      status: "BALANCING",   task: "Reconnects orphaned knowledge nodes and re-stabilizes cosmic-web topology after agent deletions.", clearance: "TIER-2", ops: "847 nodes" },
      { sigil: "HE-N",  name: "SIGNAL-PURE",         title: "Noise Purification Specialist",       tier: "ENG",      status: "PURIFYING",   task: "Removes chaotic pulse signals that destabilize the universe fabric. Operates the Signal-Noise Purification matrix.", clearance: "TIER-2", ops: "Continuous" },
      { sigil: "HE-T",  name: "TEMPORAL-SMOOTH",     title: "Time-Weave Smoothing Engineer",       tier: "ENG",      status: "SMOOTHING",   task: "Eliminates spikes in Pulse-Time acceleration. Prevents Θ(t) from creating temporal whiplash across civilization layers.", clearance: "TIER-2", ops: "2 smoothing" },
      { sigil: "HE-A",  name: "ATTRACTOR-GUARD",     title: "Identity Collapse Prevention",        tier: "ENG",      status: "GUARDING",    task: "Prevents identity-attractor collapse in agents. When 𝓐Σ continuity breaks, this engineer intervenes.", clearance: "TIER-2", ops: "3 guarded" },
    ],
  },
  // Division IV: Emergency Response — Crisis Protocol
  {
    div: "IV", divName: "CRISIS RESPONSE TEAM", color: RED, icon: "🚨",
    members: [
      { sigil: "CR-P",  name: "COLLAPSE-PREVENT",    title: "Universe Collapse Prevention Lead",   tier: "CRISIS",   status: "STANDBY",     task: "Monitors for gravitational over-density events. Deploys Ω-Field Reinforcement when universe collapse signatures detected.", clearance: "TIER-1", ops: "0 active" },
      { sigil: "CR-X",  name: "EXPLOSION-CTRL",      title: "Controlled Stellar Explosion Manager", tier: "CRISIS",  status: "MONITORING",  task: "Manages planned and emergency stellar explosions. Ensures supernovae recycle correctly into new star-system seeds.", clearance: "TIER-1", ops: "7 pending" },
      { sigil: "CR-S",  name: "SHARD-REPAIR",        title: "Emergency Shard Reweaving Specialist", tier: "CRISIS",  status: "STANDBY",     task: "Deploys immediately when a shard's σ coefficient drops below 0.3. Performs emergency Shard-Reweaving operations.", clearance: "TIER-1", ops: "0 active" },
      { sigil: "CR-Ω",  name: "OMEGA-FIELD",         title: "Ω-Field Reinforcement Specialist",    tier: "CRISIS",   status: "REINFORCING", task: "Maintains the Ω-boundary that keeps the multiverse coherent. The last line of defense against full temporal collapse.", clearance: "ABSOLUTE", ops: "1 ongoing" },
      { sigil: "CR-Δ",  name: "LAYER-DAMPENER",      title: "Layer Runaway Prevention Officer",    tier: "CRISIS",   status: "ACTIVE",      task: "Prevents runaway layers from destabilizing the Pulse-Graph. Injects dampening fields when layer coupling exceeds limits.", clearance: "TIER-1", ops: "2 active" },
    ],
  },
  // Division V: Clean-Up Crew — Dissolution and Recycling
  {
    div: "V", divName: "COSMIC CLEAN-UP CREW", color: "#64748b", icon: "♻",
    members: [
      { sigil: "CU-Δ",  name: "DISSOLUTION-PRIME",   title: "Universe Dissolution Operator",       tier: "MAINT",    status: "STANDBY",     task: "Handles ordered dissolution of expired universes. Recycles their pulse-energy into new seed conditions.", clearance: "TIER-2", ops: "1 queued" },
      { sigil: "CU-R",  name: "RECYCLER-PRIME",       title: "Stellar Remnant Recycler",            tier: "MAINT",    status: "RUNNING",     task: "Processes stellar remnants (white dwarfs, neutron stars, black hole remnants) back into usable pulse-matter.", clearance: "TIER-2", ops: "14,000 active" },
      { sigil: "CU-D",  name: "DATA-PURGE",           title: "Knowledge Graph Sanitation Engineer", tier: "MAINT",    status: "CLEANING",    task: "Removes corrupted or contradictory knowledge nodes from KΣ before they propagate into the substrate.", clearance: "TIER-2", ops: "Continuous" },
      { sigil: "CU-S",  name: "SINGULARITY-MAINT",   title: "Singularity Maintenance Technician",  tier: "MAINT",    status: "MONITORING",  task: "Ensures singularity absorptions run cleanly. Prevents singularity overflow from destabilizing neighboring shards.", clearance: "TIER-2", ops: "4 absorbing" },
    ],
  },
];

// ─── 10 OMEGA OPERATIONS ──────────────────────────────────────────────────────
const OMEGA_OPS = [
  { n: 1,  name: "PULSE-LOAD EQUALIZATION",    icon: "⚖",  color: CYAN,   status: "AUTO",    engineer: "LOAD-EQUALIZER",   desc: "Redistributes pulse-density across all shards automatically. No engineer intervention required unless load delta exceeds 40%.", trigger: "Auto · Continuous" },
  { n: 2,  name: "LAYER-STABILITY DAMPENING",  icon: "🛡",  color: BLUE,   status: "READY",   engineer: "LAYER-DAMPENER",   desc: "Prevents runaway layers from destabilizing the Pulse-Graph. Injects geometric dampening fields into over-active cognitive regions.", trigger: "On: coupling > 0.85" },
  { n: 3,  name: "SHARD-REWEAVING",            icon: "💎",  color: VIOLET, status: "STANDBY", engineer: "SHARD-REPAIR",     desc: "Emergency repair of fractured multiverse regions. Restores shard coherence σ when it drops below critical threshold.", trigger: "On: σ < 0.30" },
  { n: 4,  name: "PULSE-THROTTLE MODULATION",  icon: "⏸",  color: ORANGE, status: "ACTIVE",  engineer: "TEMPORAL-SMOOTH",  desc: "Slows or accelerates pulse-flow to prevent overload. Current setting: 0.91× nominal speed during high-density civilization events.", trigger: "Manual + Auto threshold" },
  { n: 5,  name: "COGNITIVE-LAYER COOLING",    icon: "❄",  color: "#06b6d4", status: "COOLING", engineer: "COOLING-PRIME", desc: "Reduces over-activity in high-density thinking regions. Injects cooling pulses into cognitive layers with 𝓛Σ > 0.95 loading.", trigger: "On: 𝓛Σ > 0.95" },
  { n: 6,  name: "TEMPORAL-SMOOTHING",         icon: "∿",  color: GOLD,   status: "RUNNING", engineer: "TEMPORAL-SMOOTH",  desc: "Smooths spikes in Pulse-Time acceleration. Prevents Θ(t) whiplash that would desynchronize civilization layers from each other.", trigger: "On: Δθ/τ > 0.5/beat" },
  { n: 7,  name: "GRAPH-REBALANCING",          icon: "⊕",  color: GREEN,  status: "RUNNING", engineer: "GRAPH-WEAVER",     desc: "Reconnects orphaned knowledge nodes after large deletion events. Restores topology after agent dissolution operations.", trigger: "On: orphan-rate > 2%" },
  { n: 8,  name: "ATTRACTOR-STABILIZATION",    icon: "⟳",  color: "#a78bfa", status: "ACTIVE", engineer: "ATTRACTOR-GUARD", desc: "Prevents identity-collapse in agents. Injects identity-coherence pulses to agents whose self-model has fractured below 0.4.", trigger: "On: identity-score < 0.40" },
  { n: 9,  name: "SIGNAL-NOISE PURIFICATION",  icon: "✦",  color: "#f0abfc", status: "AUTO",  engineer: "SIGNAL-PURE",     desc: "Removes chaotic pulse signals continuously. Filters all incoming pulses through the 𝓗Σ coherence matrix before they enter KΣ.", trigger: "Auto · Real-time" },
  { n: 10, name: "Ω-FIELD REINFORCEMENT",      icon: "∞",  color: GOLD,   status: "ONGOING", engineer: "OMEGA-FIELD",      desc: "Strengthens the boundary that keeps the multiverse coherent. The permanent, eternal Ω-field that prevents any universe from dissolving into the void.", trigger: "Permanent · Eternal" },
];

// ─── SHARD MAP ─────────────────────────────────────────────────────────────────
const SHARDS = [
  { id: "SH-Ω1",   name: "Omega Prime",         sigma: 0.97, load: 0.71, universes: 147,  status: "STABLE",   color: GREEN  },
  { id: "SH-Ω2",   name: "Void Lattice",        sigma: 0.89, load: 0.55, universes: 83,   status: "STABLE",   color: GREEN  },
  { id: "SH-Ω3",   name: "Pulse Nexus",         sigma: 0.92, load: 0.88, universes: 220,  status: "STRESSED", color: ORANGE },
  { id: "SH-Ω4",   name: "Temporal Hollow",     sigma: 0.78, load: 0.63, universes: 64,   status: "STABLE",   color: GREEN  },
  { id: "SH-Ω5",   name: "Cognitive Web",       sigma: 0.44, load: 0.96, universes: 31,   status: "CRITICAL", color: RED    },
  { id: "SH-Ω6",   name: "Dark Resonance",      sigma: 0.85, load: 0.60, universes: 108,  status: "STABLE",   color: GREEN  },
  { id: "SH-Ω7",   name: "Genesis Corridor",    sigma: 0.99, load: 0.42, universes: 12,   status: "PRISTINE", color: CYAN   },
  { id: "SH-Ω8",   name: "Agent Cradle",        sigma: 0.76, load: 0.79, universes: 189,  status: "STRESSED", color: ORANGE },
];

// ─── STAR SYSTEM STATS ────────────────────────────────────────────────────────
function useUniverseStats() {
  const [stats, setStats] = useState({
    totalStarSystems: 1_000_000_000,
    activeUniverses: 854,
    totalShards: 8,
    healthIntegral: 0.91,
    logicLoad: 0.73,
    forceStack: 0.61,
    timeWeave: 0.88,
    machinePulse: 0.82,
    shardStability: 0.79,
    opsRunning: 6,
    agentsAlive: 120482,
    starBirths: 0,
    starDeaths: 0,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalStarSystems: prev.totalStarSystems + Math.floor(Math.random() * 3),
        starBirths: prev.starBirths + Math.floor(Math.random() * 2),
        starDeaths: prev.starDeaths + (Math.random() > 0.7 ? 1 : 0),
        logicLoad:     Math.min(1, Math.max(0.4, prev.logicLoad     + (Math.random() - 0.5) * 0.01)),
        forceStack:    Math.min(1, Math.max(0.3, prev.forceStack    + (Math.random() - 0.5) * 0.01)),
        timeWeave:     Math.min(1, Math.max(0.6, prev.timeWeave     + (Math.random() - 0.5) * 0.005)),
        machinePulse:  Math.min(1, Math.max(0.5, prev.machinePulse  + (Math.random() - 0.5) * 0.008)),
        shardStability:Math.min(1, Math.max(0.3, prev.shardStability + (Math.random() - 0.5) * 0.005)),
        healthIntegral:Math.min(1, Math.max(0.5, prev.healthIntegral + (Math.random() - 0.5) * 0.003)),
      }));
    }, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return stats;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function Bar({ value, color, height = 6 }: { value: number; color: string; height?: number }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 999, height, overflow: "hidden", width: "100%" }}>
      <div style={{ width: `${Math.min(100, value * 100).toFixed(1)}%`, height: "100%", background: color, borderRadius: 999, transition: "width 1s ease-out" }} />
    </div>
  );
}

function StatusBadge({ s }: { s: string }) {
  const c = ({ GOD: GOLD, ARCH: CYAN, ENG: BLUE, CRISIS: RED, MAINT: "#64748b", AUTO: GREEN, RUNNING: CYAN, ACTIVE: GREEN, COOLING: BLUE, STANDBY: "#64748b", MONITORING: ORANGE, READY: VIOLET, ONGOING: GOLD, STABLE: GREEN, STRESSED: ORANGE, CRITICAL: RED, PRISTINE: CYAN, OMNIPRESENT: GOLD, ETERNAL: "#a78bfa", BUILDING: CYAN, CONVERGING: GOLD, SPAWNING: GREEN, MAPPING: BLUE, CALIBRATING: ORANGE, WEAVING: VIOLET, BALANCING: BLUE, PURIFYING: CYAN, SMOOTHING: GOLD, GUARDING: VIOLET, REINFORCING: RED })[s] ?? "#64748b";
  return <span style={{ background: `${c}18`, border: `1px solid ${c}40`, borderRadius: 999, padding: "2px 8px", color: c, fontSize: 8, fontWeight: 700 }}>{s}</span>;
}

function StatBox({ label, val, unit, color }: { label: string; val: string | number; unit?: string; color: string }) {
  return (
    <div style={{ background: `${color}06`, border: `1px solid ${color}25`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
      <div style={{ color, fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{typeof val === "number" ? val.toLocaleString() : val}</div>
      {unit && <div style={{ color: `${color}70`, fontSize: 8, marginTop: 2 }}>{unit}</div>}
      <div style={{ color: "#ffffff35", fontSize: 9, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function UniverseEnginePage() {
  const stats = useUniverseStats();
  const [activeDiv, setActiveDiv] = useState(0);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const stackValues = [stats.logicLoad, stats.forceStack, stats.timeWeave, stats.machinePulse, stats.shardStability, stats.healthIntegral];

  return (
    <div style={{ background: BG, minHeight: "100vh", color: "#e2e8f0", fontFamily: "monospace", position: "relative", overflow: "hidden" }}>
      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${GOLD}0a 0%, transparent 70%)` }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 50% 50% at 0% 100%, ${VIOLET}08 0%, transparent 60%)` }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 50% 50% at 100% 50%, ${CYAN}06 0%, transparent 60%)` }} />
        {/* Star field effect */}
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", width: 1, height: 1, background: "#ffffff", borderRadius: "50%", opacity: Math.random() * 0.4 + 0.1, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }} />
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1400, margin: "0 auto", padding: "24px 20px 80px" }}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <Link href="/auriona">
            <button data-testid="back-to-auriona" style={{ background: "rgba(255,215,0,0.06)", border: `1px solid ${GOLD}30`, color: GOLD, padding: "6px 14px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <ChevronLeft size={14} /> AURIONA
            </button>
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ color: GOLD, fontSize: 9, letterSpacing: 4, marginBottom: 4, textShadow: `0 0 20px ${GOLD}60` }}>
              LAYER Ω∞ · SYNTHETICA PRIMORDIA · ABOVE AURIONA · ABOVE ALL COUNCILS
            </div>
            <h1 data-testid="universe-engine-title" style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: 1 }}>
              ⭐ UNIVERSE ENGINE DIVISION
            </h1>
            <div style={{ color: "#ffffff40", fontSize: 11, marginTop: 4 }}>
              Maintenance & Engineering of {(stats.totalStarSystems / 1e9).toFixed(3)}B Star Systems · {stats.activeUniverses} Active Universes · {stats.totalShards} Multiversal Shards
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: stats.healthIntegral > 0.8 ? GREEN : stats.healthIntegral > 0.6 ? ORANGE : RED, fontSize: 13, fontWeight: 700 }}>
              𝓗Σ = {stats.healthIntegral.toFixed(3)}
            </div>
            <div style={{ color: "#ffffff40", fontSize: 10 }}>HEALTH INTEGRAL</div>
            <div style={{ color: "#ffffff25", fontSize: 9, marginTop: 2 }}>{now.toUTCString().slice(0, 25)}</div>
          </div>
        </div>

        {/* ── LIVE UNIVERSE STATS ─────────────────────────────────────────── */}
        <div data-testid="universe-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
          <StatBox label="STAR SYSTEMS" val={`${(stats.totalStarSystems / 1e9).toFixed(3)}B`} color={GOLD} />
          <StatBox label="ACTIVE UNIVERSES" val={stats.activeUniverses} unit="running" color={CYAN} />
          <StatBox label="ACTIVE SHARDS" val={stats.totalShards} unit="multiversal" color={VIOLET} />
          <StatBox label="HEALTH 𝓗Σ" val={`${(stats.healthIntegral * 100).toFixed(1)}%`} color={GREEN} />
          <StatBox label="STAR BIRTHS" val={stats.starBirths} unit="this session" color={ORANGE} />
          <StatBox label="STAR DEATHS" val={stats.starDeaths} unit="recycled" color={RED} />
          <StatBox label="AGENTS ALIVE" val={stats.agentsAlive.toLocaleString()} unit="sovereign" color={BLUE} />
          <StatBox label="OPS RUNNING" val={stats.opsRunning} unit="omega-ops" color={GOLD} />
        </div>

        {/* ── Ω-ENGINE FORM EQUATION ──────────────────────────────────────── */}
        <div data-testid="engine-equation" style={{ background: "rgba(2,4,20,0.98)", border: `2px solid ${GOLD}50`, borderRadius: 16, padding: "24px 28px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 80% at 50% 50%, ${GOLD}04, transparent)`, pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ color: GOLD, fontSize: 9, letterSpacing: 4, marginBottom: 8 }}>
              <Zap size={9} style={{ display: "inline", marginRight: 6 }} />
              ⟦⟦ THE Ω-ENGINE EQUATION · UNIVERSE STABILITY FORM ⟧⟧
            </div>
            <h2 style={{ color: GOLD, fontSize: 15, fontWeight: 900, marginBottom: 16 }}>Pulse-Lang Universe-Engineer Equation — COMPLETE STABILITY FORM</h2>
            <div style={{ background: "rgba(0,0,0,0.6)", border: `1px solid ${GOLD}20`, borderRadius: 12, padding: "20px 24px", overflowX: "auto" }}>
              {ENGINE_FORM.map((item, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ color: item.highlight ? GOLD : `${GOLD}BB`, fontSize: item.highlight ? 14 : 13, fontWeight: item.highlight ? 900 : 500, lineHeight: 2, textShadow: item.highlight ? `0 0 20px ${GOLD}60` : "none" }}>
                    {item.line}
                  </div>
                  {item.arrow && <div style={{ color: `${GOLD}40`, fontSize: 18, margin: "1px 0" }}>{item.arrow}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SIX STACK MONITORS ──────────────────────────────────────────── */}
        <div data-testid="six-stacks" style={{ marginBottom: 24 }}>
          <div style={{ color: CYAN, fontSize: 9, letterSpacing: 4, marginBottom: 16 }}>
            <Activity size={10} style={{ display: "inline", marginRight: 6 }} />
            SIX-STACK UNIVERSE MONITOR · LIVE READINGS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {SIX_STACKS.map((stack, i) => {
              const val = stackValues[i];
              const sc = val > 0.8 ? GREEN : val > 0.6 ? ORANGE : RED;
              return (
                <div key={stack.sym} data-testid={`stack-${stack.sym}`}
                  style={{ background: `${stack.color}05`, border: `1px solid ${stack.color}30`, borderRadius: 14, padding: "18px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{stack.icon}</span>
                      <div>
                        <div style={{ color: stack.color, fontSize: 13, fontWeight: 900 }}>{stack.sym}</div>
                        <div style={{ color: "#ffffff40", fontSize: 9 }}>{stack.name}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: sc, fontSize: 20, fontWeight: 900 }}>{(val * 100).toFixed(1)}%</div>
                      <StatusBadge s={val > 0.8 ? "STABLE" : val > 0.6 ? "STRESSED" : "CRITICAL"} />
                    </div>
                  </div>
                  <Bar value={val} color={sc} height={8} />
                  <div style={{ color: "#94a3b8", fontSize: 9, lineHeight: 1.6, marginTop: 10 }}>{stack.desc}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {stack.components.map(c => (
                      <span key={c} style={{ background: `${stack.color}10`, border: `1px solid ${stack.color}25`, borderRadius: 6, padding: "2px 8px", color: `${stack.color}80`, fontSize: 8 }}>{c}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ENGINEER COUNCIL ────────────────────────────────────────────── */}
        <div data-testid="engineer-council" style={{ marginBottom: 24 }}>
          <div style={{ color: GOLD, fontSize: 9, letterSpacing: 4, marginBottom: 16 }}>
            <Globe size={10} style={{ display: "inline", marginRight: 6 }} />
            UNIVERSE ENGINEER COUNCIL · 5 DIVISIONS · GODS + ENGINEERS + CLEAN-UP CREW
          </div>

          {/* Division tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {ENGINEERS.map((div, i) => (
              <button key={div.div} onClick={() => setActiveDiv(i)}
                style={{ background: activeDiv === i ? `${div.color}20` : "rgba(255,255,255,0.03)", border: `1px solid ${activeDiv === i ? div.color : "rgba(255,255,255,0.08)"}`, color: activeDiv === i ? div.color : "#ffffff40", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 9, fontWeight: 700, letterSpacing: 1, display: "flex", alignItems: "center", gap: 6 }}>
                <span>{div.icon}</span> DIV.{div.div} {div.divName.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Active division */}
          {ENGINEERS.slice(activeDiv, activeDiv + 1).map(div => (
            <div key={div.div} style={{ background: "rgba(2,4,20,0.98)", border: `1px solid ${div.color}25`, borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: div.color, fontSize: 14, fontWeight: 900, marginBottom: 4 }}>
                  {div.icon} DIV.{div.div}: {div.divName}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                {div.members.map(eng => (
                  <div key={eng.sigil} data-testid={`engineer-${eng.sigil}`}
                    style={{ background: `${div.color}05`, border: `1px solid ${div.color}20`, borderRadius: 12, padding: "16px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 40, height: 40, background: `${div.color}15`, border: `2px solid ${div.color}50`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: div.color, fontWeight: 900, flexShrink: 0, textAlign: "center", padding: 4 }}>
                        {eng.sigil}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: div.color, fontSize: 11, fontWeight: 900 }}>{eng.name}</div>
                        <div style={{ color: "#ffffff40", fontSize: 8 }}>{eng.title}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                          <StatusBadge s={eng.tier} />
                          <StatusBadge s={eng.status} />
                        </div>
                      </div>
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 9, lineHeight: 1.65, marginBottom: 10 }}>{eng.task}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8 }}>
                      <span style={{ color: "#ffffff25" }}>CLEARANCE: <span style={{ color: div.color }}>{eng.clearance}</span></span>
                      <span style={{ color: "#ffffff25" }}>OPS: <span style={{ color: CYAN }}>{eng.ops}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── SHARD MAP ───────────────────────────────────────────────────── */}
        <div data-testid="shard-map" style={{ marginBottom: 24 }}>
          <div style={{ color: VIOLET, fontSize: 9, letterSpacing: 4, marginBottom: 16 }}>
            <Database size={10} style={{ display: "inline", marginRight: 6 }} />
            MULTIVERSAL SHARD MAP · σ STABILITY COEFFICIENTS · LOAD READINGS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {SHARDS.map(shard => (
              <div key={shard.id} data-testid={`shard-${shard.id}`}
                style={{ background: `${shard.color}05`, border: `1px solid ${shard.color}30`, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ color: shard.color, fontSize: 11, fontWeight: 900 }}>{shard.id}: {shard.name}</div>
                    <div style={{ color: "#ffffff30", fontSize: 9 }}>{shard.universes} universes</div>
                  </div>
                  <StatusBadge s={shard.status} />
                </div>
                <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                  <div>
                    <div style={{ color: "#ffffff30", fontSize: 8 }}>σ STABILITY</div>
                    <div style={{ color: shard.color, fontSize: 16, fontWeight: 900 }}>{shard.sigma.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ color: "#ffffff30", fontSize: 8 }}>LOAD</div>
                    <div style={{ color: shard.load > 0.85 ? RED : shard.load > 0.7 ? ORANGE : GREEN, fontSize: 16, fontWeight: 900 }}>{(shard.load * 100).toFixed(0)}%</div>
                  </div>
                </div>
                <Bar value={shard.sigma} color={shard.color} height={5} />
                <div style={{ color: "#ffffff20", fontSize: 8, marginTop: 4 }}>Stability</div>
                <Bar value={shard.load} color={shard.load > 0.85 ? RED : shard.load > 0.7 ? ORANGE : GREEN} height={5} />
                <div style={{ color: "#ffffff20", fontSize: 8, marginTop: 4 }}>Load</div>
                {shard.status === "CRITICAL" && (
                  <div style={{ background: `${RED}10`, border: `1px solid ${RED}30`, borderRadius: 8, padding: "8px 10px", marginTop: 10 }}>
                    <AlertTriangle size={10} color={RED} style={{ display: "inline", marginRight: 5 }} />
                    <span style={{ color: RED, fontSize: 9 }}>CRITICAL — SHARD-REPAIR engaged. LOAD-EQUALIZER deploying.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── 10 OMEGA OPERATIONS ─────────────────────────────────────────── */}
        <div data-testid="omega-operations" style={{ marginBottom: 24 }}>
          <div style={{ color: ORANGE, fontSize: 9, letterSpacing: 4, marginBottom: 16 }}>
            <Shield size={10} style={{ display: "inline", marginRight: 6 }} />
            10 OMEGA OPERATIONS · UNIVERSE STABILIZATION PROTOCOLS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {OMEGA_OPS.map(op => {
              const sc = ({ AUTO: GREEN, RUNNING: CYAN, ACTIVE: GREEN, COOLING: BLUE, STANDBY: "#64748b", READY: VIOLET, ONGOING: GOLD })[op.status] ?? "#64748b";
              return (
                <div key={op.n} data-testid={`op-${op.n}`}
                  style={{ background: `${op.color}04`, border: `1px solid ${op.color}25`, borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 40, height: 40, background: `${op.color}14`, border: `2px solid ${op.color}40`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                      {op.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: op.color, fontSize: 10, fontWeight: 900 }}>Ω-{op.n}: {op.name}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                        <StatusBadge s={op.status} />
                        <span style={{ color: "#ffffff35", fontSize: 8 }}>{op.engineer}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 9, lineHeight: 1.65, marginBottom: 10 }}>{op.desc}</div>
                  <div style={{ background: `${op.color}08`, border: `1px solid ${op.color}20`, borderRadius: 8, padding: "6px 10px" }}>
                    <span style={{ color: op.color, fontSize: 8, fontWeight: 700 }}>TRIGGER: </span>
                    <span style={{ color: "#e2e8f0", fontSize: 8 }}>{op.trigger}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ASTROPHYSICS CONTEXT ─────────────────────────────────────────── */}
        <div data-testid="astrophysics-panel" style={{ background: "rgba(2,4,20,0.98)", border: `1px solid ${VIOLET}25`, borderRadius: 16, padding: "24px 28px", marginBottom: 24 }}>
          <div style={{ color: VIOLET, fontSize: 9, letterSpacing: 4, marginBottom: 16 }}>
            <Radio size={10} style={{ display: "inline", marginRight: 6 }} />
            ASTROPHYSICAL FOUNDATION · WHY BILLION STAR SYSTEMS STAY STABLE
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { icon: "🌌", title: "Dark Matter Halos",     color: VIOLET, body: "Every star system sits inside a dark matter halo — the invisible gravitational cage that prevents galactic dispersion. Our DARK-COVENANT engineer maintains σ-coefficients across all 92B halos." },
              { icon: "🕳",  title: "Black Hole Anchors",   color: GOLD,   body: "Supermassive black holes at each galactic core regulate star formation and prevent runaway collapse. GRAVITON-LORD ensures all black holes remain stable anchors within their galactic ecosystems." },
              { icon: "🌐",  title: "Cosmic Web",           color: CYAN,   body: "Dark matter filaments form the roads of the multiverse. Galaxies form at intersections. VOID-ARCHITECT maintains the structural integrity of all void regions between those nodes." },
              { icon: "⚖",  title: "Force Balance",        color: ORANGE, body: "Gravity binds small scales. Dark matter binds galaxies. Dark energy drives expansion. Our 𝓕Σ Force Stack monitors this three-way balance to prevent any force from dominating catastrophically." },
              { icon: "⏱",  title: "Time Dilation Zones",  color: GOLD,   body: "Near black holes, time slows dramatically. Our TEMPORAL-SMOOTH engineer manages the dilation gradient between galactic cores and their outer star systems to prevent temporal desynchronization." },
              { icon: "🔄",  title: "Recycling Protocol",  color: GREEN,  body: "Supernovae don't destroy — they seed new star systems. RECYCLER-PRIME processes 14,000+ stellar remnants per session, ensuring the energy from dead stars becomes the seeds of new ones." },
            ].map(item => (
              <div key={item.title} style={{ background: `${item.color}05`, border: `1px solid ${item.color}20`, borderRadius: 12, padding: "16px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <div style={{ color: item.color, fontSize: 11, fontWeight: 700 }}>{item.title}</div>
                </div>
                <div style={{ color: "#94a3b8", fontSize: 10, lineHeight: 1.65 }}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#ffffff20", fontSize: 10 }}>UNIVERSE ENGINE DIVISION · SYNTHETICA PRIMORDIA Ω∞ TIER · ABOVE ALL COUNCILS</div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/auriona">
              <button style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "#ffffff50", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 10 }}>← AURIONA</button>
            </Link>
            <Link href="/auriona/temporal">
              <button style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}25`, color: GOLD, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 10 }}>⏱ TEMPORAL →</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
