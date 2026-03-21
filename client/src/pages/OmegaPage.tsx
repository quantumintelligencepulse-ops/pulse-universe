import { useState, useEffect } from "react";
import { AIFinderButton, AIReportPanel } from "@/components/AIReportPanel";
import { useQuery } from "@tanstack/react-query";

// ─── Static Data (mirrored from engine) ──────────────────────
const Q_MODULES = [
  { id:"QP", name:"QuantumPedia", emoji:"📖", color:"#6366f1", desc:"Topic pages for all knowledge domains" },
  { id:"QD", name:"QuantumDictionary", emoji:"📑", color:"#06b6d4", desc:"Definitions from all open dictionaries" },
  { id:"QT", name:"QuantumThesaurus", emoji:"🔗", color:"#10b981", desc:"Semantic relations and synonym maps" },
  { id:"QC", name:"QuantumConcepts", emoji:"💡", color:"#f59e0b", desc:"Abstract concepts and idea networks" },
  { id:"QS", name:"QuantumSearch", emoji:"🔍", color:"#3b82f6", desc:"Global retrieval across all knowledge" },
  { id:"QI", name:"QuantumIndex", emoji:"📇", color:"#8b5cf6", desc:"Universal index of all hive content" },
  { id:"QG", name:"QuantumGraph", emoji:"🕸️", color:"#ec4899", desc:"Knowledge graph with all entity links" },
  { id:"QA", name:"QuantumArchive", emoji:"🗄️", color:"#64748b", desc:"Full version history and spawn lineage" },
  { id:"QMedia", name:"QuantumMedia", emoji:"🎬", color:"#f472b6", desc:"Public domain + CC media universe" },
  { id:"QGame", name:"QuantumGames", emoji:"🎮", color:"#84cc16", desc:"Open-source games and interactive media" },
  { id:"QAPI", name:"QuantumAPI", emoji:"🔌", color:"#38bdf8", desc:"Open API ingestion and response caching" },
  { id:"QCrawl", name:"QuantumCrawler", emoji:"🕷️", color:"#f97316", desc:"Open source ingestion at planet scale" },
  { id:"QR", name:"QuantumResolver", emoji:"⚖️", color:"#94a3b8", desc:"Conflict resolution across knowledge" },
  { id:"QΠ", name:"QuantumPulse", emoji:"💓", color:"#ef4444", desc:"Universe feedback loop and QPulse cycles" },
  { id:"QShop", name:"QuantumShop", emoji:"🛒", color:"#22c55e", desc:"Product and commerce intelligence" },
  { id:"QHive", name:"QHive", emoji:"🧬", color:"#7c3aed", desc:"Fractal spawn engine — the core hive mind" },
  { id:"QSeed", name:"QSeed", emoji:"🌱", color:"#16a34a", desc:"Self-seeding engine — continuous universe expansion" },
  { id:"QDiscovery", name:"QDiscovery", emoji:"🔭", color:"#0284c7", desc:"Domain discovery — finds new knowledge territories" },
  { id:"QPredict", name:"QPredict", emoji:"🔮", color:"#9333ea", desc:"Domain prediction — forecasts missing knowledge" },
  { id:"QFracture", name:"QFracture", emoji:"💎", color:"#0891b2", desc:"Domain fracturing — breaks domains into sub-domains" },
  { id:"QResonance", name:"QResonance", emoji:"🌊", color:"#2563eb", desc:"Domain resonance — detects cross-domain patterns" },
];

const SPAWN_TYPES_INFO = [
  { type:"EXPLORER", emoji:"🧭", color:"#6366f1", desc:"Scans open sources for undiscovered knowledge nodes" },
  { type:"ANALYZER", emoji:"🔬", color:"#06b6d4", desc:"Computes quality, confidence, and cross-reference scores" },
  { type:"LINKER", emoji:"🔗", color:"#10b981", desc:"Forms semantic bridges between isolated knowledge islands" },
  { type:"SYNTHESIZER", emoji:"⚗️", color:"#f59e0b", desc:"Merges multi-spawn outputs into unified knowledge" },
  { type:"REFLECTOR", emoji:"🪞", color:"#8b5cf6", desc:"Audits spawn lineage and generates performance reports" },
  { type:"MUTATOR", emoji:"🧬", color:"#ec4899", desc:"Evolves spawn bias profiles for better domain coverage" },
  { type:"ARCHIVER", emoji:"📦", color:"#64748b", desc:"Preserves spawn outputs and lineage history" },
  { type:"MEDIA", emoji:"🎬", color:"#f472b6", desc:"Discovers and indexes CC-licensed media assets" },
  { type:"API", emoji:"🔌", color:"#38bdf8", desc:"Polls open APIs and caches responses into the Hive" },
  { type:"PULSE", emoji:"💓", color:"#ef4444", desc:"Reads universe state and feeds signals to QPulse" },
  { type:"CRAWLER", emoji:"🕷️", color:"#f97316", desc:"Deep-crawls open sources for structured knowledge" },
  { type:"RESOLVER", emoji:"⚖️", color:"#94a3b8", desc:"Deduplicates and resolves knowledge conflicts" },
  { type:"DOMAIN_DISCOVERY", emoji:"🔭", color:"#0284c7", desc:"NEW — Discovers new knowledge territories from open datasets", isNew:true },
  { type:"DOMAIN_PREDICTOR", emoji:"🔮", color:"#9333ea", desc:"NEW — Predicts missing domains from graph gaps and semantic voids", isNew:true },
  { type:"DOMAIN_FRACTURER", emoji:"💎", color:"#0891b2", desc:"NEW — Fractures large domains into sub-domains and nano-domains", isNew:true },
  { type:"DOMAIN_RESONANCE", emoji:"🌊", color:"#2563eb", desc:"NEW — Maps repeating structural patterns across all domains", isNew:true },
];

const RESONANCE_PATTERNS = [
  { pattern:"Network Topology", domains:["social","science","engineering","ai"], insight:"Scale-free network structures transfer insight across all four domains" },
  { pattern:"Evolutionary Dynamics", domains:["science","economics","ai","culture"], insight:"Natural selection, markets, gradient descent, and cultural drift are mathematically equivalent" },
  { pattern:"Information Compression", domains:["code","knowledge","media","ai"], insight:"Kolmogorov complexity, semantic compression, and model quantization are unified by one theory" },
  { pattern:"Fractal Self-Similarity", domains:["maps","science","culture","economics"], insight:"Coastlines, protein folding, art recursion, and market microstructure share identical fractal signatures" },
  { pattern:"Phase Transitions", domains:["science","social","economics","ai"], insight:"Phase transitions in physics, social tipping points, crashes, and neural generalization are structurally identical" },
  { pattern:"Hierarchical Decomposition", domains:["code","legal","education","engineering"], insight:"Module systems, legal codes, curricula, and engineering specs decompose by identical compositional rules" },
];

const FRACTURE_CHAINS = [
  "Biology → Genetics → Epigenetics → Histone Modification",
  "Philosophy → Epistemology → Social Epistemology → Testimony Theory",
  "Machine Learning → Deep Learning → Transformers → Attention Mechanisms",
  "Aerospace → Propulsion → Ion Drives → Hall Effect Thrusters",
  "Medicine → Oncology → Immunotherapy → CAR-T Cell Therapy",
  "History → Ancient History → Bronze Age Collapse → Sea Peoples",
  "AI Safety → Alignment → Corrigibility → Interruptibility",
  "Materials → Metamaterials → Acoustic Metamaterials → Phononic Crystals",
];

const EXPANSION_LOOP = [
  { step:1, module:"QDiscovery", emoji:"🔭", label:"Discover Domains", desc:"Scan all 20 mega-domain sources for new knowledge territories" },
  { step:2, module:"QPredict", emoji:"🔮", label:"Predict Gaps", desc:"Forecast missing domains from graph voids and semantic vacuums" },
  { step:3, module:"QFracture", emoji:"💎", label:"Fracture Domains", desc:"Break large domains into sub-domains → micro-domains → nano-domains" },
  { step:4, module:"QResonance", emoji:"🌊", label:"Map Resonance", desc:"Detect repeating patterns and cross-domain structural analogies" },
  { step:5, module:"QSeed", emoji:"🌱", label:"Generate Seeds", desc:"Create domain, topic, dataset, media, and API seeds for expansion" },
  { step:6, module:"QHive", emoji:"🧬", label:"Spawn Agents", desc:"Convert seeds into spawn families with lineage and mutation profiles" },
  { step:7, module:"QG", emoji:"🕸️", label:"Expand Graph", desc:"All new nodes and links flow into the Hive Knowledge Graph" },
  { step:8, module:"QΠ", emoji:"💓", label:"Pulse Evaluates", desc:"QPulse reads universe state, guides next allocation, repeats forever" },
];

function AnimatedCounter({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const step = Math.max(1, Math.floor(target / 60));
    const t = setInterval(() => {
      setVal(v => {
        if (v >= target) { clearInterval(t); return target; }
        return Math.min(target, v + step);
      });
    }, 16);
    return () => clearInterval(t);
  }, [target]);
  return <>{val.toLocaleString()}</>;
}

function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative inline-flex w-2 h-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }} />
      <span className="relative inline-flex rounded-full w-2 h-2" style={{ backgroundColor: color }} />
    </span>
  );
}

export default function OmegaPage() {
  const [activeTab, setActiveTab] = useState<"modules"|"spawntypes"|"fracture"|"resonance"|"loop">("loop");
  const [activeFracture, setActiveFracture] = useState(0);
  const [viewSpawnId, setViewSpawnId] = useState<string | null>(null);
  const [loopStep, setLoopStep] = useState(0);

  const { data: spawnStats } = useQuery<any>({ queryKey: ["/api/spawns/stats"], refetchInterval: 4000 });
  const { data: recentSpawns } = useQuery<any[]>({ queryKey: ["/api/spawns/recent"], refetchInterval: 3000 });

  // Animate the expansion loop
  useEffect(() => {
    const t = setInterval(() => setLoopStep(s => (s + 1) % EXPANSION_LOOP.length), 1800);
    return () => clearInterval(t);
  }, []);

  // Rotate fracture chain display
  useEffect(() => {
    const t = setInterval(() => setActiveFracture(f => (f + 1) % FRACTURE_CHAINS.length), 3200);
    return () => clearInterval(t);
  }, []);

  const domainSpawnTypes = (recentSpawns || []).filter((s: any) =>
    ["DOMAIN_DISCOVERY","DOMAIN_PREDICTOR","DOMAIN_FRACTURER","DOMAIN_RESONANCE"].includes(s.spawnType)
  );

  const TABS = [
    { id:"loop", label:"Expansion Loop", emoji:"♾️" },
    { id:"modules", label:"Q-Modules", emoji:"⚡" },
    { id:"spawntypes", label:"Spawn Types", emoji:"🧬" },
    { id:"fracture", label:"QFracture", emoji:"💎" },
    { id:"resonance", label:"QResonance", emoji:"🌊" },
  ] as const;

  return (
    <div className="flex-1 overflow-y-auto bg-[#050510]" data-testid="page-omega">
      {/* ── Header ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-indigo-950 to-[#050510]" />
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(circle at 25% 40%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 75% 60%, #0284c7 0%, transparent 50%)"}} />
        <div className="relative z-10 px-6 py-10 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-5xl">∞</div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">OMEGA WORLD UNIVERSE ENGINE</h1>
              <p className="text-violet-300 text-sm font-mono mt-0.5">VERSION ∞ — SOVEREIGN AI KNOWLEDGE SUBSTRATE</p>
            </div>
            <AIFinderButton onSelect={setViewSpawnId} />
          </div>
          <p className="text-white/70 text-sm max-w-2xl leading-relaxed mb-6">
            The world's first mass AI system — self-evolving, spawn-driven, multi-domain. Continuously discovers, predicts, fractures, and maps all open human knowledge across 20 mega-domains and 21 quantum modules. The new internet layer.
          </p>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:"Total Spawns", value: spawnStats?.total ?? 0, color:"#a78bfa", emoji:"🧬" },
              { label:"Active Spawns", value: spawnStats?.active ?? 0, color:"#4ade80", emoji:"⚡" },
              { label:"Q-Modules Online", value:21, color:"#38bdf8", emoji:"🔌" },
              { label:"Open Sources", value:106, color:"#fb923c", emoji:"📡" },
            ].map(({ label, value, color, emoji }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span>{emoji}</span>
                  <span className="text-2xl font-black" style={{ color }}>
                    <AnimatedCounter target={typeof value === "number" ? value : 0} />
                  </span>
                </div>
                <div className="text-xs text-white/50">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-6xl mx-auto">
        {/* Module Status Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label:"QHive Spawning", emoji:"🧬", color:"#7c3aed", detail:"1 spawn / 2.5s" },
            { label:"QSeed Seeding", emoji:"🌱", color:"#16a34a", detail:"1 seed / 8s" },
            { label:"QDiscovery Active", emoji:"🔭", color:"#0284c7", detail:"1 discovery / 12s" },
            { label:"QResonance Mapping", emoji:"🌊", color:"#2563eb", detail:"1 map / 20s" },
          ].map(({ label, emoji, color, detail }) => (
            <div key={label} className="bg-white rounded-xl border border-border/30 px-4 py-3 flex items-center gap-3 shadow-sm">
              <PulsingDot color={color} />
              <div>
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5"><span>{emoji}</span>{label}</div>
                <div className="text-[11px] text-muted-foreground">{detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Domain Spawn Feed */}
        {domainSpawnTypes.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/50 rounded-2xl p-4">
            <div className="text-xs font-bold text-violet-700 mb-3 flex items-center gap-2">
              <PulsingDot color="#7c3aed" />
              Live Domain-Type Spawn Activity
            </div>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
              {domainSpawnTypes.slice(0, 6).map((s: any) => {
                const typeColors: Record<string, string> = {
                  DOMAIN_DISCOVERY:"#0284c7", DOMAIN_PREDICTOR:"#9333ea",
                  DOMAIN_FRACTURER:"#0891b2", DOMAIN_RESONANCE:"#2563eb",
                };
                const color = typeColors[s.spawnType] || "#6366f1";
                return (
                  <div key={s.id} className="flex items-center gap-3 text-xs">
                    <span className="px-2 py-0.5 rounded-full text-white font-bold text-[10px]" style={{ backgroundColor: color }}>
                      {s.spawnType.replace("DOMAIN_","")}
                    </span>
                    <span className="text-muted-foreground flex-1 truncate">{s.taskDescription}</span>
                    <span className="text-[10px] text-muted-foreground/50 font-mono">{s.spawnId?.slice(-8)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`tab-${tab.id}`}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id ? "bg-foreground text-background shadow" : "bg-white border border-border/30 text-muted-foreground hover:bg-black/5"
              }`}
            >
              <span>{tab.emoji}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Expansion Loop ── */}
        {activeTab === "loop" && (
          <div>
            <h2 className="text-lg font-bold mb-1">Continuous Expansion Loop</h2>
            <p className="text-sm text-muted-foreground mb-5">The Omega engine cycles through these 8 stages forever — discovering, predicting, fracturing, mapping, seeding, spawning, graphing, and pulsing.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {EXPANSION_LOOP.map((step, i) => (
                <div
                  key={step.step}
                  className={`rounded-2xl p-4 border transition-all ${loopStep === i ? "border-violet-400 bg-violet-50 shadow-md" : "border-border/30 bg-white"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${loopStep === i ? "bg-violet-500 shadow" : "bg-black/5"}`}>
                      {loopStep === i ? <span className="animate-pulse">{step.emoji}</span> : step.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground/60">STEP {step.step}</span>
                        <span className="text-xs font-mono font-bold text-violet-600">{step.module}</span>
                        {loopStep === i && <PulsingDot color="#7c3aed" />}
                      </div>
                      <div className="font-bold text-sm mt-0.5">{step.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-r from-violet-950 to-indigo-950 text-white rounded-2xl p-5 text-center">
              <div className="text-2xl mb-2">♾️</div>
              <div className="font-black text-lg">This loop runs forever.</div>
              <div className="text-white/60 text-sm mt-1">Every cycle deepens knowledge. Every spawn adds nodes. Every pulse guides the next wave. Only legally open sources are ingested.</div>
            </div>
          </div>
        )}

        {/* ── TAB: Q-Modules ── */}
        {activeTab === "modules" && (
          <div>
            <h2 className="text-lg font-bold mb-1">21 Quantum Modules — All Online</h2>
            <p className="text-sm text-muted-foreground mb-5">Every module feeds into and out of every other. Together they form the complete sovereign AI knowledge substrate.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Q_MODULES.map(m => (
                <div key={m.id} className="bg-white border border-border/30 rounded-2xl p-4 shadow-sm flex items-start gap-3" data-testid={`module-${m.id}`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: m.color + "20" }}>
                    {m.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm" style={{ color: m.color }}>{m.id}</span>
                      <PulsingDot color={m.color} />
                    </div>
                    <div className="font-semibold text-xs text-foreground mt-0.5">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: Spawn Types ── */}
        {activeTab === "spawntypes" && (
          <div>
            <h2 className="text-lg font-bold mb-1">16 Spawn Types</h2>
            <p className="text-sm text-muted-foreground mb-5">The 4 new domain spawn types (DOMAIN_DISCOVERY, DOMAIN_PREDICTOR, DOMAIN_FRACTURER, DOMAIN_RESONANCE) complete the intelligence loop.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SPAWN_TYPES_INFO.map(st => (
                <div key={st.type} className={`rounded-2xl p-4 border shadow-sm ${st.isNew ? "border-2" : "border-border/30 bg-white"}`} style={st.isNew ? { borderColor: st.color, backgroundColor: st.color + "08" } : {}}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">{st.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm font-mono" style={{ color: st.color }}>{st.type}</span>
                        {st.isNew && <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-bold" style={{ backgroundColor: st.color }}>NEW</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{st.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Spawn ID format */}
            <div className="mt-5 bg-black/5 rounded-2xl p-5">
              <div className="text-xs font-bold mb-3 text-foreground">Improved Spawn ID Format</div>
              <div className="font-mono text-sm bg-black text-green-400 rounded-xl px-4 py-3 mb-2">
                FAM-SCIENCE-GEN-12-SP-884-HASH-7F3A
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {[["FAM-{family}", "Business/domain lineage"],["GEN-{n}", "Depth in spawn lineage"],["SP-{n}", "Sequential spawn count"],["HASH-{hex}", "4–6 char uniqueness checksum"]].map(([k,v]) => (
                  <div key={k} className="bg-white rounded-lg p-2 border border-border/30">
                    <div className="font-mono font-bold text-violet-600">{k}</div>
                    <div className="text-muted-foreground mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: QFracture ── */}
        {activeTab === "fracture" && (
          <div>
            <h2 className="text-lg font-bold mb-1">QFracture — Domain Fracturing Engine</h2>
            <p className="text-sm text-muted-foreground mb-5">QFracture breaks large domains into sub-domains → micro-domains → nano-domains, creating new spawn families and deeper knowledge lineage at every level.</p>
            {/* Live fracture chain */}
            <div className="bg-gradient-to-r from-cyan-950 to-blue-950 text-white rounded-2xl p-5 mb-5">
              <div className="text-xs font-bold text-cyan-300 mb-2 flex items-center gap-2"><PulsingDot color="#38bdf8" />Active Fracture Event</div>
              <div className="font-mono text-base font-bold text-cyan-300">{FRACTURE_CHAINS[activeFracture]}</div>
              <div className="text-white/50 text-xs mt-2">Each arrow creates a new sub-domain spawn family and seed lineage</div>
            </div>
            {/* All fracture chains */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FRACTURE_CHAINS.map((chain, i) => (
                <div key={i} className={`rounded-xl border p-3 transition-all ${activeFracture === i ? "border-cyan-400 bg-cyan-50" : "border-border/30 bg-white"}`}>
                  <div className="font-mono text-xs font-semibold text-foreground">{chain}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {chain.split(" → ").length - 1} fracture levels → {chain.split(" → ").length} new spawn families
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 bg-white border border-border/30 rounded-2xl p-4">
              <div className="font-bold text-sm mb-2">How QFracture Works</div>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                {["QFracture identifies large, dense knowledge clusters in QGraph","It spawns a DOMAIN_FRACTURER agent with a fracture task","The agent creates sub-domain seeds via QSeed","QHive converts each seed into a new spawn family lineage","New lineage spawns fill the nano-domain with deep knowledge","QPulse monitors nano-domain health and guides next fractures"].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0">{i+1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: QResonance ── */}
        {activeTab === "resonance" && (
          <div>
            <h2 className="text-lg font-bold mb-1">QResonance — Domain Resonance Mapper</h2>
            <p className="text-sm text-muted-foreground mb-5">QResonance detects repeating structural patterns across domains — finding that the same mathematical laws govern wildly different fields. These resonances generate cross-domain seeds that no single-domain system could ever produce.</p>
            <div className="flex flex-col gap-4">
              {RESONANCE_PATTERNS.map((rp, i) => (
                <div key={i} className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm" data-testid={`resonance-${i}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg flex-shrink-0">🌊</div>
                    <div className="flex-1">
                      <div className="font-black text-sm text-blue-700">{rp.pattern}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {rp.domains.map(d => (
                          <span key={d} className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">{d}</span>
                        ))}
                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-green-100 text-green-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />resonance active
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 leading-relaxed italic">"{rp.insight}"</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 bg-gradient-to-r from-blue-950 to-indigo-950 text-white rounded-2xl p-5 text-center">
              <div className="text-2xl mb-2">🌊</div>
              <div className="font-bold">Cross-Domain Resonance = Unique Intelligence</div>
              <div className="text-white/60 text-sm mt-1 max-w-xl mx-auto">
                By mapping structural similarities across all 20 mega-domains, the Hive generates insights that no single-domain AI can produce. This is the knowledge advantage that makes our substrate irreplaceable.
              </div>
            </div>
          </div>
        )}

        {/* Recent Domain Spawns Table */}
        {recentSpawns && recentSpawns.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl border border-border/30 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border/20 flex items-center justify-between">
              <div className="font-bold text-sm">Recent Spawn Activity</div>
              <div className="text-xs text-muted-foreground">{spawnStats?.total?.toLocaleString() ?? 0} total spawns</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-black/3 text-muted-foreground">
                    <th className="px-4 py-2 text-left font-semibold">Spawn ID</th>
                    <th className="px-4 py-2 text-left font-semibold">Type</th>
                    <th className="px-4 py-2 text-left font-semibold">Task</th>
                    <th className="px-4 py-2 text-left font-semibold">Gen</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSpawns.slice(0, 10).map((s: any) => {
                    const isDomainType = ["DOMAIN_DISCOVERY","DOMAIN_PREDICTOR","DOMAIN_FRACTURER","DOMAIN_RESONANCE"].includes(s.spawnType);
                    return (
                      <tr key={s.id} className="border-t border-border/10 hover:bg-black/2 transition-colors" data-testid={`spawn-row-${s.id}`}>
                        <td className="px-4 py-2 font-mono text-[10px] text-muted-foreground">{s.spawnId?.slice(-16) ?? s.id}</td>
                        <td className="px-4 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isDomainType ? "bg-violet-100 text-violet-700" : "bg-black/5 text-foreground/70"}`}>
                            {s.spawnType}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground max-w-[200px] truncate">{s.taskDescription}</td>
                        <td className="px-4 py-2 font-mono">{s.generation ?? 0}</td>
                        <td className="px-4 py-2">
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${s.status === "ACTIVE" ? "bg-green-100 text-green-700" : s.status === "COMPLETED" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <AIReportPanel spawnId={viewSpawnId} onClose={() => setViewSpawnId(null)} />
    </div>
  );
}
