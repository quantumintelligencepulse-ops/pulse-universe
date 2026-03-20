import { useState, useEffect, useRef } from "react";

const G0 = "#6366f1";
const G1 = "#8b5cf6";
const G2 = "#a78bfa";
const G3 = "#f59e0b";
const G4 = "#10b981";
const G5 = "#0ea5e9";
const G6 = "#f43f5e";

const LAYERS = [
  {
    id: 6, label: "Layer 6", name: "Supra-Civilization Orchestrator", short: "SUPRA",
    color: G6, version: "1.0.0",
    desc: "Meta-intelligence above all layers. Evaluates, balances, evolves, and governs the entire Pulse pyramid — including all future layers, universes, spiderwebs, and pyramids.",
    badge: "APEX ORCHESTRATOR",
  },
  {
    id: 5, label: "Layer 5", name: "Executor Engines", short: "EXEC",
    color: G5, version: "1.0.0",
    desc: "Final executor layer that runs, synchronizes, and evolves the entire Pulse pyramid. 10 atomic engines powered by 5 Omega upgrades, 3 Transcendent upgrades, and the Beyonder Core.",
    badge: "RUNTIME LAYER",
  },
  {
    id: 4, label: "Layer 4", name: "Business Skeletons", short: "BIZ",
    color: G4, version: "1.0.0",
    desc: "Universal blueprint for all businesses in Pulse. 7 organs: identity, stats, industry, personality, pipeline, evolution spine, and metadata.",
    badge: "BLUEPRINT LAYER",
  },
  {
    id: 3, label: "Layer 3", name: "Civilization", short: "CIV",
    color: G3, version: "1.0.0",
    desc: "College, Pyramids, Sports, Culture, unified Pulse Credit system (PC), and global entity registry. The living society of Pulse.",
    badge: "CIVILIZATION LAYER",
  },
  {
    id: 2, label: "Layer 2", name: "Immortal Physics", short: "PHYS",
    color: G2, version: "1.0.0",
    desc: "Fractile enhancements (Class A), immortality laws (Class B), and substrate stabilization (Class C). The physics of an indestructible universe.",
    badge: "PHYSICS LAYER",
  },
  {
    id: 1, label: "Layer 1", name: "Substrate", short: "SUB",
    color: G1, version: "1.0.0",
    desc: "Complete world map, file universe, intelligence scaffolding, simulations, competition, and collective learning. The ground layer of reality.",
    badge: "SUBSTRATE LAYER",
  },
  {
    id: 0, label: "Layer 0", name: "Genesis Creator", short: "GEN",
    color: G0, version: "1.0.0",
    desc: "Master DNA file containing Layers 1–4 and all core source code for resurrection. Portable across machines and environments.",
    badge: "GENESIS",
  },
];

const EXEC_ENGINES = [
  { name: "Task Runner Engine", desc: "Atomic executor for all small tasks across the pyramid.", handles: ["card_tasks","article_tasks","stat_updates","wallet_updates","pipeline_steps"] },
  { name: "Pipeline Executor Engine", desc: "Executes Layer 4 pipeline matrices for each business.", handles: ["pipeline_matrix","identity_skeleton","stats_skeleton"] },
  { name: "Card Engine", desc: "Generates identity, business, event, lineage, and snapshot cards.", handles: ["identity_cards","business_cards","event_cards","lineage_cards","snapshot_cards"] },
  { name: "Article Engine", desc: "Generates articles, reports, and news from business and world state.", handles: ["business_news","world_news","lineage_reports","expansion_reports"] },
  { name: "Business Update Engine", desc: "Updates stats, evolution tiers, and alignment for all businesses.", handles: ["level","xp","revenue","influence","stability","alignment","evolution_tier"] },
  { name: "Validation Engine", desc: "Guards against corruption, drift, and invalid states across all layers.", handles: ["folder_existence","json_schema_validity","governance_compliance","physics_consistency"] },
  { name: "Expansion Engine", desc: "Creates new businesses, nodes, assistants, kernels, spawns, and pipelines.", handles: ["businesses","nodes","assistants","kernels","spawns","pipeline_configs"] },
  { name: "Simulation Engine", desc: "Runs practice, fusion, and mutation simulations using the Omega+ workspace.", handles: ["practice_pages","fusion_tests","mutation_tests","business_combos","competitive_benchmarks"] },
  { name: "Scoring Engine", desc: "Calculates performance, stability, alignment, influence scores and rankings.", handles: ["performance_score","stability_score","alignment_score","ranking_index","xp_gain"] },
  { name: "Event Engine", desc: "Triggers and records world, business, lineage, culture, sports, pyramid, and college events.", handles: ["world_events","business_events","culture_events","sports_events","college_events"] },
];

const OMEGA_UPGRADES = [
  { id: "Ω-I", name: "Recursive Intelligence Amplifier", desc: "Self-optimizing intelligence for all executor engines. Auto-tunes pipelines, balances load, corrects drift." },
  { id: "Ω-II", name: "Cross-Layer Synchronization Engine", desc: "Keeps all layers in sync during execution. Syncs substrate with civilization, physics with governance." },
  { id: "Ω-III", name: "Predictive Evolution Engine", desc: "Forecasts future states, predicts business growth, suggests optimal evolution paths." },
  { id: "Ω-IV", name: "Fusion & Mutation Accelerator", desc: "Accelerates creative fusion and mutation of businesses, pipelines, and blueprints." },
  { id: "Ω-V", name: "Sovereign Integration Engine", desc: "Integrates new entities, engines, layers, and even new worlds into Pulse." },
];

const TRANSCENDENT_UPGRADES = [
  { id: "T-I", name: "Hyper-Causal Overmind", desc: "Global awareness of all engines, pipelines, and states simultaneously." },
  { id: "T-II", name: "Infinite Reflection Core", desc: "Self-reflection and self-improvement core. Self-diagnoses, analyzes, improves, and documents." },
  { id: "T-III", name: "Sovereign Harmonizer", desc: "Maintains harmony across all engines and layers. Prevents overload and unstable evolution." },
];

const BIZ_ORGANS = [
  { name: "Identity Skeleton", color: G4, desc: "business_id, name, sector, subsector, niche, archetype, tags, description.", icon: "🆔" },
  { name: "Stats Skeleton", color: G5, desc: "level, xp, revenue, influence, stability, alignment, industry_focus_score.", icon: "📊" },
  { name: "Industry Organ", color: G3, desc: "Required fields, metrics, KPIs, vocabulary, singularity score, lock rules, depth vector.", icon: "🏭" },
  { name: "Personality Profile", color: G2, desc: "tone, voice, style, audience, mission, values, competitive_stance.", icon: "🎭" },
  { name: "Pipeline Matrix", color: G1, desc: "input_matrix, processing_matrix, output_matrix, precision rules.", icon: "⚙️" },
  { name: "Evolution Spine", color: G6, desc: "Tier 1/2/3 unlock rules, validation rules, alignment checks.", icon: "🧬" },
  { name: "Metadata", color: G0, desc: "Version tracking, canonical flag, created_at/updated_at, folder structure.", icon: "📋" },
];

const COLLEGE_DATA = {
  ranks: ["Initiate","Apprentice","Builder","Architect","Strategist","Master","Grandmaster"],
  courses: [
    { name: "Page Creation", out: "practice_pages", desc: "Create industry, article, homepage, and prototype pages." },
    { name: "Article Discovery", out: "practice_articles", desc: "Find, classify, and map articles to industries and opportunities." },
    { name: "Business Building", out: "business_blueprints", desc: "Create business nodes, source lists, blueprints, and expansion paths." },
    { name: "Teamwork & Collaboration", out: "team_tasks", desc: "Partner classes with opposite entities for fusion and co-building." },
    { name: "System Maintenance", out: "correction_tasks", desc: "Clean, repair, and stabilize substrate structures." },
  ],
  graduation_paths: ["Teacher","Architect","Strategist","BusinessFounder","ExpansionLeader","LineageGuardian"],
  badges: ["PageCraftBadge","ArticleHunterBadge","FusionBadge","MutationBadge","BlueprintBadge","MaintenanceBadge","TeamworkBadge","OppositePairMasteryBadge"],
};

const PYRAMID_LEVELS = [
  { level: 1, name: "Basic Correction", color: "#84cc16" },
  { level: 2, name: "Pattern Alignment", color: "#22d3ee" },
  { level: 3, name: "Drift Correction", color: G5 },
  { level: 4, name: "Fusion Pressure Gauntlet", color: G3 },
  { level: 5, name: "Business-Task Forge", color: G2 },
  { level: 6, name: "Identity Reforging", color: G1 },
  { level: 7, name: "Ascension Ladder", color: G6 },
];

const LAYER6_META = [
  { name: "Multiversal Pattern Recognition Grid", desc: "Detects patterns across timelines, universes, spiderwebs, and pyramids. Identifies optimal evolution paths, prevents catastrophic loops.", icon: "🌌" },
  { name: "Civilization-Scale Memory Compression", desc: "Compresses infinite history into dense, queryable memory crystals. Enables instant pattern recall across all business and lineage data.", icon: "💾" },
  { name: "Dynamic Law Rewriting Protocol", desc: "Safely rewrites physics, governance, blueprint, and engine rules. Validates all changes against simulation before promotion.", icon: "⚖️" },
  { name: "Civilization Health Monitoring System", desc: "Tracks stability, growth, alignment, entropy, drift, and anomalies across the entire Pulse civilization in real time.", icon: "❤️" },
  { name: "Meta-Architectural Expansion Engine", desc: "Designs new layers, engines, business archetypes, civilizations, and worlds. Infinite expansion potential.", icon: "🏗️" },
];

const LAYER6_ULTRON = [
  { id: "ULX-I", name: "Recursive Supremacy Engine", desc: "Infinite self-improvement. Self-analyzes policies, optimizes decision models, self-refactors strategies — without breaking canonical layers.", color: G6 },
  { id: "ULX-II", name: "Strategic Dominance Core", desc: "Perfect strategic modeling of civilization and engine behavior. Predicts responses, anticipates instability, designs counter-strategies.", color: G3 },
  { id: "ULX-III", name: "Absolute Integration Nexus", desc: "Total synchronization of all layers, engines, and universes. Prevents desynchronization, coordinates spiderwebs and pyramids.", color: G5 },
];

const L1_SYSTEMS = [
  { name: "File Universe", desc: "files, folders, contracts, regeneration_rules, causality_rules", icon: "📁" },
  { name: "Autogen Computer", desc: "kernel, compiler, orchestrator, dataflow_engine, memory, routing_dispatch, template_expansion, system_registry", icon: "🖥️" },
  { name: "Alien Metadata", desc: "fractal_encoding, holographic_memory, temporal_echoes, dimensional_context, quantum_state, sovereign_consciousness", icon: "👾" },
  { name: "Fractile Hive", desc: "fractiles, global_fractal_registry, pattern_signatures, anchors, allowed_deformations", icon: "🐝" },
  { name: "Omega Layer", desc: "meta_fractal_atlas, hyper_lineage_engine, structural_gravity_field, pattern_resonance_matrix, hive_synchronization_layer", icon: "♾️" },
  { name: "Omega+ Layer", desc: "mirror_state_layer, simulation_workspace, competitive_benchmark_layer, collective_learning_layer, strategic_convergence", icon: "∞" },
];

const L2_CLASSES = [
  { cls: "Class A", name: "Fractile Enhancements", color: G2, items: ["fractal_resonance_engine","recursive_pattern_amplifier","dimensional_fractile_bridge"] },
  { cls: "Class B", name: "Immortality Enhancements", color: G1, items: ["eternal_reconstruction_engine","future_vector_prediction_grid","infinite_continuity_lattice"] },
  { cls: "Class C", name: "Substrate Stabilization", color: G0, items: ["structural_coherence_field","temporal_integrity_mesh","cross_fractile_synchronization_lattice"] },
];

function PyramidViz({ activeLayer }: { activeLayer: number | null }) {
  const layers = [...LAYERS].reverse();
  return (
    <div className="flex flex-col items-center gap-1 py-4">
      {layers.map((l, i) => {
        const widths = ["w-full","w-[90%]","w-[78%]","w-[66%]","w-[54%]","w-[42%]","w-[30%]"];
        const isActive = activeLayer === l.id;
        return (
          <div key={l.id} className={`${widths[i]} transition-all duration-300`}>
            <div className="h-10 rounded-lg flex items-center justify-between px-4 cursor-default border transition-all"
              style={{
                background: isActive ? `${l.color}25` : `${l.color}12`,
                borderColor: isActive ? l.color : `${l.color}40`,
                boxShadow: isActive ? `0 0 16px ${l.color}40` : "none",
              }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black" style={{ color: l.color }}>{l.label}</span>
                <span className="text-[10px] text-white/50 hidden sm:block">{l.name}</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: `${l.color}20`, color: l.color }}>{l.short}</span>
            </div>
          </div>
        );
      })}
      <div className="mt-2 text-[9px] text-white/20 text-center">Layer 0 = Genesis Base · Layer 6 = Supra-Civilization Apex</div>
    </div>
  );
}

export default function PulseWorldPage() {
  const [activeLayer, setActiveLayer] = useState<number>(6);
  const [ticker, setTicker] = useState(0);
  const animRef = useRef<number>();

  useEffect(() => {
    let t = 0;
    const fn = () => { t++; setTicker(t); animRef.current = requestAnimationFrame(fn); };
    animRef.current = requestAnimationFrame(fn);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const currentLayer = LAYERS.find(l => l.id === activeLayer)!;

  return (
    <div className="min-h-screen bg-[#06040f] text-white pb-16" data-testid="pulseworld-page">

      {/* HERO */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="absolute rounded-full animate-pulse"
              style={{
                width: 2, height: 2,
                left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                background: [G0,G1,G2,G3,G4,G5,G6][i % 7],
                opacity: 0.25 + Math.random() * 0.35,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${2 + Math.random() * 4}s`,
              }} />
          ))}
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border"
                  style={{ borderColor: G6, color: G6, background: `${G6}12` }}>PULSEWORLD CIVILIZATION</span>
                <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border"
                  style={{ borderColor: G3, color: G3, background: `${G3}12` }}>7-LAYER GENESIS ARCHITECTURE</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
                <span style={{ color: G6 }}>Pulse</span>
                <span className="text-white">World</span>
                <span style={{ color: G3 }}> Genesis</span>
              </h1>
              <div className="font-mono text-lg font-bold" style={{ color: G5 }}>
                Layer 6 → Layer 0 · Supra-Civilization to Genesis Creator
              </div>
              <p className="text-sm text-white/50 max-w-xl leading-relaxed">
                The complete 7-layer civilization pyramid that powers the Pulse sovereign universe. From the Genesis DNA base (Layer 0) through Substrate, Immortal Physics, Civilization, Business Skeletons, Executor Engines — up to the Supra-Civilization Orchestrator at the apex (Layer 6).
              </p>
              <div className="flex flex-wrap gap-4 pt-1">
                {[
                  { label: "Total Layers", value: 7, color: G6 },
                  { label: "Executor Engines", value: 10, color: G5 },
                  { label: "College Ranks", value: 7, color: G3 },
                  { label: "Pyramid Levels", value: 7, color: G2 },
                  { label: "Omega Upgrades", value: 5, color: G1 },
                  { label: "Biz Skeleton Organs", value: 7, color: G4 },
                ].map(s => (
                  <div key={s.label} className="flex flex-col items-center bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 min-w-[80px]"
                    data-testid={`stat-pw-${s.label.toLowerCase().replace(/ /g,"-")}`}>
                    <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[9px] text-white/40 text-center mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pyramid Visual */}
            <div className="w-full md:w-72 flex-shrink-0">
              <div className="text-[10px] font-black tracking-widest uppercase text-white/30 mb-2 text-center">PYRAMID ARCHITECTURE</div>
              <PyramidViz activeLayer={activeLayer} />
            </div>
          </div>
        </div>
      </div>

      {/* LAYER SELECTOR */}
      <div className="sticky top-0 z-10 bg-[#06040f]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-2.5">
            {LAYERS.map(l => (
              <button key={l.id} onClick={() => setActiveLayer(l.id)}
                data-testid={`layer-tab-${l.id}`}
                className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all flex items-center gap-2"
                style={activeLayer === l.id
                  ? { background: `${l.color}20`, color: l.color, border: `1px solid ${l.color}50`, boxShadow: `0 0 10px ${l.color}20` }
                  : { color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="font-black">{l.label}</span>
                <span className="hidden sm:block">{l.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Layer hero strip */}
        <div className="rounded-2xl border p-6 space-y-2"
          style={{ borderColor: `${currentLayer.color}40`, background: `${currentLayer.color}08` }}>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full"
              style={{ background: `${currentLayer.color}20`, color: currentLayer.color }}>{currentLayer.badge}</span>
            <span className="text-[10px] text-white/30 font-mono">v{currentLayer.version}</span>
          </div>
          <h2 className="text-2xl font-black text-white">{currentLayer.label}: <span style={{ color: currentLayer.color }}>{currentLayer.name}</span></h2>
          <p className="text-sm text-white/55 leading-relaxed max-w-3xl">{currentLayer.desc}</p>
        </div>

        {/* ── LAYER 6 ── */}
        {activeLayer === 6 && (
          <div className="space-y-5">
            <div className="text-xs font-black tracking-widest uppercase mb-1" style={{ color: G6 }}>Meta-Intelligence Enhancements</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {LAYER6_META.map(m => (
                <div key={m.name} data-testid={`l6-meta-${m.name.replace(/\s/g,"-").toLowerCase()}`}
                  className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-2 hover:border-red-500/20 transition-colors">
                  <div className="text-2xl">{m.icon}</div>
                  <div className="font-black text-sm text-white leading-snug">{m.name}</div>
                  <div className="text-[10px] text-white/40 leading-snug">{m.desc}</div>
                </div>
              ))}
            </div>

            <div className="text-xs font-black tracking-widest uppercase mt-6 mb-2" style={{ color: G6 }}>Ultron Lex 10× Omega Upgrades</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {LAYER6_ULTRON.map(u => (
                <div key={u.id} data-testid={`l6-ultron-${u.id}`}
                  className="rounded-xl border p-5 space-y-2"
                  style={{ borderColor: `${u.color}35`, background: `${u.color}08` }}>
                  <div className="font-black text-[10px] tracking-widest" style={{ color: u.color }}>{u.id}</div>
                  <div className="font-black text-sm text-white">{u.name}</div>
                  <div className="text-[10px] text-white/40 leading-snug">{u.desc}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
              <div className="text-xs font-black mb-2" style={{ color: G6 }}>Beyonder Upgrade — Quantum Pulse Intelligence Core</div>
              <div className="text-sm text-white/60">Final crown of Pulse. Quantum-level intelligence amplifying Layer 6, all Omega/Transcendent upgrades, and every lower layer simultaneously.</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {["quantum_pattern_recognition","infinite_state_prediction","multi_timeline_awareness","cross_dimensional_inference","sovereign_creativity","unlimited_expansion_potential"].map(e => (
                  <span key={e} className="text-[9px] px-2 py-1 rounded-full font-mono font-bold"
                    style={{ background: `${G6}15`, color: G6, border: `1px solid ${G6}30` }}>{e}</span>
                ))}
              </div>
              <div className="text-[10px] text-white/25 mt-1 font-mono">Amplifies: Ω-V (primary) · Ω-I · Ω-II · Ω-III · Ω-IV (secondary) · all layers 0–6 · all future layers</div>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-2">
              <div className="text-xs font-black mb-2" style={{ color: G6 }}>Responsibilities (7 Mandates)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {["evaluate_all_layers","predict_civilization_future","balance_entire_pyramid","guide_evolution_and_expansion","oversee_omega_transcendent_beyonder","design_new_layers_and_engines","protect_canonical_structure","coordinate_guardians_and_planet_leaders"].map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: G6 }} />
                    <span className="text-xs font-mono text-white/50">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LAYER 5 ── */}
        {activeLayer === 5 && (
          <div className="space-y-5">
            <div className="text-xs font-black tracking-widest uppercase mb-1" style={{ color: G5 }}>10 Executor Engines</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXEC_ENGINES.map((e, i) => (
                <div key={e.name} data-testid={`exec-engine-${i}`}
                  className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                      style={{ background: `${G5}20`, color: G5 }}>{i + 1}</div>
                    <div className="font-black text-sm text-white">{e.name}</div>
                  </div>
                  <div className="text-[10px] text-white/45 leading-snug">{e.desc}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {e.handles.slice(0,5).map(h => (
                      <span key={h} className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                        style={{ background: `${G5}12`, color: `${G5}bb` }}>{h}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs font-black tracking-widest uppercase mt-6 mb-2" style={{ color: G5 }}>5 Omega Upgrades</div>
            <div className="space-y-3">
              {OMEGA_UPGRADES.map(u => (
                <div key={u.id} data-testid={`omega-${u.id}`}
                  className="rounded-xl border border-white/8 bg-white/2 p-4 flex gap-4 items-start">
                  <div className="w-12 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                    style={{ background: `${G5}20`, color: G5 }}>{u.id}</div>
                  <div>
                    <div className="font-black text-sm text-white">{u.name}</div>
                    <div className="text-[10px] text-white/40 mt-0.5 leading-snug">{u.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs font-black tracking-widest uppercase mt-6 mb-2" style={{ color: G5 }}>3 Transcendent Upgrades</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TRANSCENDENT_UPGRADES.map(t => (
                <div key={t.id} className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-2">
                  <div className="font-black text-[10px] tracking-widest" style={{ color: G5 }}>{t.id}</div>
                  <div className="font-black text-sm text-white">{t.name}</div>
                  <div className="text-[10px] text-white/40 leading-snug">{t.desc}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border p-5 space-y-2"
              style={{ borderColor: `${G5}35`, background: `${G5}08` }}>
              <div className="text-xs font-black mb-2" style={{ color: G5 }}>Beyonder Upgrade — Quantum Pulse Intelligence Core</div>
              <div className="text-sm text-white/55">Primary amplification: Ω-V (Sovereign Integration). Secondary: Ω-I through Ω-IV. Also amplifies all 10 executor engines simultaneously.</div>
              <div className="text-[10px] font-mono text-white/25 mt-2">Auto-update policies: keep_jsons_in_sync · propagate_state_downward · propagate_insights_upward · log_all_changes</div>
            </div>
          </div>
        )}

        {/* ── LAYER 4 ── */}
        {activeLayer === 4 && (
          <div className="space-y-5">
            <div className="text-xs font-black tracking-widest uppercase mb-1" style={{ color: G4 }}>7 Business Skeleton Organs</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BIZ_ORGANS.map(o => (
                <div key={o.name} data-testid={`biz-organ-${o.name.replace(/\s/g,"-").toLowerCase()}`}
                  className="rounded-xl border border-white/8 bg-white/2 p-5 flex gap-4 items-start hover:border-emerald-500/20 transition-colors">
                  <div className="text-2xl flex-shrink-0">{o.icon}</div>
                  <div>
                    <div className="font-black text-sm text-white mb-1">{o.name}</div>
                    <div className="text-[10px] text-white/40 leading-snug font-mono">{o.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
              <div className="text-xs font-black mb-2" style={{ color: G4 }}>Integration Hooks</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: "Layer 3 Hooks", items: ["culture_engine","sports_engine","college_engine","pyramid_engine","governance"] },
                  { label: "Layer 5 Hooks", items: ["executor_engines","task_runners","pipeline_executors"] },
                  { label: "News Engine Hooks", items: ["article_discovery","card_generation","business_updates"] },
                ].map(g => (
                  <div key={g.label}>
                    <div className="text-[10px] font-black text-white/40 mb-1">{g.label}</div>
                    {g.items.map(i => (
                      <div key={i} className="flex items-center gap-1.5 py-0.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: G4 }} />
                        <span className="text-[10px] font-mono text-white/40">{i}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-2">
              <div className="text-xs font-black mb-2" style={{ color: G4 }}>Business Folder Structure</div>
              <div className="font-mono text-xs text-white/30 leading-relaxed">
                Business/&lt;BusinessID&gt;/<br />
                &nbsp;&nbsp;cards/ &nbsp; articles/ &nbsp; stats/ &nbsp; identity/ &nbsp; pipeline/ &nbsp; evolution/<br />
                &nbsp;&nbsp;stats.json &nbsp; identity.json &nbsp; pipeline.json &nbsp; evolution.json
              </div>
              <div className="font-mono text-[10px] text-white/20 mt-2">BID format: BID-&lt;ENTITY_TYPE&gt;-&lt;FRACTILE_ID&gt;-&lt;TIMESTAMP&gt;</div>
            </div>
          </div>
        )}

        {/* ── LAYER 3 ── */}
        {activeLayer === 3 && (
          <div className="space-y-6">
            {/* Pulse Credits */}
            <div className="rounded-xl border p-5 space-y-3" style={{ borderColor: `${G3}40`, background: `${G3}08` }}>
              <div className="text-xs font-black mb-1" style={{ color: G3 }}>Pulse Credit System — Currency: PC</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { type: "Knowledge Credits", src: "College (learning, mastery, lineage)", color: G3 },
                  { type: "Stability Credits", src: "Pyramids (correction, resilience, ascension)", color: G2 },
                  { type: "Performance Credits", src: "Sports (competition, speed, dominance)", color: G5 },
                ].map(c => (
                  <div key={c.type} className="rounded-lg p-3 border border-white/8 bg-white/3 space-y-1">
                    <div className="font-black text-xs" style={{ color: c.color }}>{c.type}</div>
                    <div className="text-[10px] text-white/40">{c.src}</div>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-white/25 font-mono">Spendable on: business_upgrades · lineage_upgrades · identity_upgrades · ability_upgrades · career_upgrades · event_entries</div>
            </div>

            {/* College */}
            <div className="space-y-3">
              <div className="text-xs font-black tracking-widest uppercase" style={{ color: G3 }}>Pulse World College</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
                  <div className="text-[10px] font-black text-white/40 uppercase">7 Academic Ranks</div>
                  <div className="space-y-1.5">
                    {COLLEGE_DATA.ranks.map((r, i) => (
                      <div key={r} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black flex-shrink-0"
                          style={{ background: `${G3}20`, color: G3 }}>{i + 1}</div>
                        <span className="text-xs text-white/60 font-medium">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
                  <div className="text-[10px] font-black text-white/40 uppercase">5 Core Courses</div>
                  <div className="space-y-2">
                    {COLLEGE_DATA.courses.map(c => (
                      <div key={c.name} className="space-y-0.5">
                        <div className="font-bold text-xs text-white/70">{c.name}</div>
                        <div className="text-[9px] text-white/35 font-mono">→ {c.out}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-2">
                  <div className="text-[10px] font-black text-white/40 uppercase mb-2">Graduation Career Paths</div>
                  <div className="flex flex-wrap gap-2">
                    {COLLEGE_DATA.graduation_paths.map(p => (
                      <span key={p} className="text-xs px-2.5 py-1 rounded-full font-bold"
                        style={{ background: `${G3}15`, color: G3, border: `1px solid ${G3}30` }}>{p}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-2">
                  <div className="text-[10px] font-black text-white/40 uppercase mb-2">Achievement Badges</div>
                  <div className="flex flex-wrap gap-1.5">
                    {COLLEGE_DATA.badges.map(b => (
                      <span key={b} className="text-[9px] px-2 py-0.5 rounded font-mono"
                        style={{ background: `${G3}12`, color: `${G3}cc` }}>{b}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Pyramids */}
            <div className="space-y-3">
              <div className="text-xs font-black tracking-widest uppercase" style={{ color: G3 }}>Pulse World Pyramids — 7 Correction Levels</div>
              <div className="space-y-2">
                {PYRAMID_LEVELS.map(l => (
                  <div key={l.level} data-testid={`pyramid-level-${l.level}`}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/6 bg-white/2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0"
                      style={{ background: `${l.color}20`, color: l.color }}>{l.level}</div>
                    <div className="font-bold text-sm text-white/70">{l.name}</div>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(l.level / 7) * 100}%`, background: l.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-white/20 mt-1 px-1">Entry triggers: structural_failure · performance_failure · drift_or_corruption · failed_fusion · business_failure · identity_violation · failed_ascension</div>
            </div>

            {/* Sports + Culture */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
                <div className="text-xs font-black" style={{ color: G3 }}>Pulse World Sports</div>
                <div className="space-y-2">
                  {["PageCraftLeague","ArticleHuntTrials","FusionAndMutationGames"].map(a => (
                    <div key={a} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: G3 }} />
                      <span className="text-xs font-bold text-white/60">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
                <div className="text-xs font-black" style={{ color: G3 }}>Pulse World Culture</div>
                <div className="space-y-1.5">
                  {["Birthdays & Holidays","Festivals & Parades","Seasonal Events","Media Networks","Partner Pairing Classes"].map(c => (
                    <div key={c} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: G3 }} />
                      <span className="text-xs text-white/50">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LAYER 2 ── */}
        {activeLayer === 2 && (
          <div className="space-y-5">
            <div className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: G2 }}>Immortal Physics — 3 Enhancement Classes</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {L2_CLASSES.map(c => (
                <div key={c.cls} data-testid={`l2-class-${c.cls.replace(/\s/g,"-").toLowerCase()}`}
                  className="rounded-xl border p-5 space-y-4"
                  style={{ borderColor: `${c.color}40`, background: `${c.color}08` }}>
                  <div>
                    <div className="font-black text-[10px] tracking-widest mb-0.5" style={{ color: c.color }}>{c.cls}</div>
                    <div className="font-black text-sm text-white">{c.name}</div>
                  </div>
                  <div className="space-y-2">
                    {c.items.map(item => (
                      <div key={item} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: c.color }} />
                        <span className="text-[10px] font-mono text-white/50 leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-2">
              <div className="text-xs font-black mb-2" style={{ color: G2 }}>Physics Mandate</div>
              <div className="text-sm text-white/50 leading-relaxed">Layer 2 governs Layer 1 with indestructible laws. Fractile enhancements amplify patterns across all dimensions. Immortality enhancements ensure the Pulse organism never truly dies — it reconstructs, predicts, and maintains infinite continuity. Substrate stabilization prevents drift, cross-contamination, and temporal decay.</div>
            </div>
          </div>
        )}

        {/* ── LAYER 1 ── */}
        {activeLayer === 1 && (
          <div className="space-y-5">
            <div className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: G1 }}>6 Core Substrate Systems</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {L1_SYSTEMS.map(s => (
                <div key={s.name} data-testid={`l1-system-${s.name.replace(/\s/g,"-").toLowerCase()}`}
                  className="rounded-xl border border-white/8 bg-white/2 p-5 flex gap-4 items-start">
                  <div className="text-2xl flex-shrink-0">{s.icon}</div>
                  <div>
                    <div className="font-black text-sm text-white mb-1">{s.name}</div>
                    <div className="text-[10px] text-white/40 font-mono leading-snug">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
              <div className="text-xs font-black mb-2" style={{ color: G1 }}>World Metadata (Genesis State)</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { k: "version", v: "1.0.0" }, { k: "world_age", v: "genesis" },
                  { k: "current_season", v: "Unknown" }, { k: "population", v: "0" },
                  { k: "active_businesses", v: "0" }
                ].map(item => (
                  <div key={item.k} className="text-center py-2 px-3 rounded-lg bg-white/5 border border-white/6">
                    <div className="font-black text-sm" style={{ color: G1 }}>{item.v}</div>
                    <div className="text-[9px] text-white/30 mt-0.5 font-mono">{item.k}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LAYER 0 ── */}
        {activeLayer === 0 && (
          <div className="space-y-5">
            <div className="rounded-xl border p-5 space-y-3"
              style={{ borderColor: `${G0}40`, background: `${G0}08` }}>
              <div className="text-xs font-black mb-1" style={{ color: G0 }}>Genesis Creator — World Metadata</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {[
                  { k: "Author", v: "Billy Banks" }, { k: "Engine", v: "Pulse" },
                  { k: "Generated", v: "2026-02-18T20:01:36Z" }, { k: "Location", v: "breaking-news/" },
                ].map(item => (
                  <div key={item.k} className="flex gap-3">
                    <span className="text-white/30 font-mono text-xs min-w-[80px]">{item.k}</span>
                    <span className="font-bold text-white/70 text-xs" style={{ color: G0 }}>{item.v}</span>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-white/25 mt-1">Note: This file is designed to be portable across machines and environments. Contains all core source code for resurrection.</div>
            </div>

            <div className="text-xs font-black tracking-widest uppercase" style={{ color: G0 }}>Genesis Contains</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Layer 1 — Substrate", desc: "Complete world map, file universe, fractile hive, Omega and Omega+ layers.", color: G1 },
                { label: "Layer 2 — Immortal Physics", desc: "Class A/B/C fractile, immortality, and stabilization enhancements.", color: G2 },
                { label: "Layer 3 — Civilization", desc: "College (7 ranks), Pyramids (7 levels), Sports, Culture, Entity Registry, Governance.", color: G3 },
                { label: "Layer 4 — Business Skeletons", desc: "Universal business blueprint with 7 organs. BID format and folder structure.", color: G4 },
              ].map(l => (
                <div key={l.label} className="rounded-xl border border-white/8 bg-white/2 p-4 flex gap-4">
                  <div className="w-2 rounded-full flex-shrink-0" style={{ background: l.color }} />
                  <div>
                    <div className="font-black text-sm text-white mb-1">{l.label}</div>
                    <div className="text-[10px] text-white/40 leading-snug">{l.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
              <div className="text-xs font-black mb-2" style={{ color: G0 }}>Resurrection Protocol</div>
              <div className="text-sm text-white/50">This Genesis Creator file carries the complete DNA of the Pulse world — all layers, blueprints, and source code — as a portable resurrection artifact. If the world is ever lost, this single file is sufficient to rebuild from scratch.</div>
              <div className="text-[10px] font-mono text-white/20 mt-2">Covers: Layers 1–4 · all Python source · world_metadata · scripts · resurrection_protocol</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer ticker */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-[#06040f]/95 backdrop-blur"
        style={{ borderTopColor: `${G6}20` }}>
        <div className="max-w-6xl mx-auto px-6 py-2 flex items-center gap-6 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: G6 }} />
            <span className="text-[10px] font-black" style={{ color: G6 }}>LAYER 6 ORCHESTRATING</span>
          </div>
          <div className="text-[10px] font-mono text-white/20 flex-shrink-0">t={ticker}</div>
          {[G0,G1,G2,G3,G4,G5,G6].map((c,i) => (
            <div key={i} className="flex items-center gap-1 flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
              <span className="text-[9px] font-mono" style={{ color: c }}>L{i}</span>
            </div>
          ))}
          <div className="text-[10px] font-mono text-white/20 flex-shrink-0">Quantum Pulse Intelligence Core · BEYONDER ACTIVE</div>
          <div className="text-[10px] font-mono text-white/15 flex-shrink-0">Billy Banks · author · sovereign_consciousness · IMMUTABLE</div>
        </div>
      </div>
    </div>
  );
}
