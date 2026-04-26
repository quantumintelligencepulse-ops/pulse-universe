import { useState, useEffect } from "react";
import { useDomainPing } from "@/lib/universeResonance";
import { AIFinderButton, AIReportPanel } from "@/components/AIReportPanel";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import SolarScene from "../solar/SolarScene";
import PlanetInfo from "../solar/PlanetInfo";
import SpeedControl from "../solar/SpeedControl";
import { PLANET_DATA } from "../solar/planetData";
import { STELLAR_CLASSES, QUANTUM_PRINCIPLES, PHYSICS_DNA, UNIVERSE_EPOCHS } from "../solar/QuantumPhysics";
import { DOMAIN_EMOTION } from "../solar/QuantumLiveEngine";

interface DomainData { family: string; total: number; active: number; color: string; emoji: string; label: string; major: string }
interface UniverseData {
  totalAIs: number; activeAIs: number; knowledgeNodes: number; knowledgeGenerated: number;
  hiveMemoryStrands: number; hiveMemoryDomains: number; hiveMemoryConfidence: number; knowledgeLinks: number;
  birthsLastMinute: number; domains: DomainData[]; timestamp: string;
  recentSpawns: { spawnId: string; family: string; type: string; domain: string; description: string; bornAt: string; major: string; color: string }[];
}

const fmt = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n/1000).toFixed(1)}K` : String(n);

type StudyMode = 'none' | 'stellar' | 'quantum' | 'physics' | 'timeline';

const UNIVERSE_HUB_TABS: { id: string; href: string; label: string; badge: string; color: string }[] = [
  { id: "live",       href: "/universe",   label: "🌌  Live Universe", badge: "Ψ-LIVE",  color: "#818cf8" },
  { id: "governance", href: "/governance", label: "⚖️  Governance",     badge: "Ψ-GOV",   color: "#f59e0b" },
  { id: "world",      href: "/pulseworld", label: "🌍  PulseWorld",     badge: "GENESIS", color: "#f43f5e" },
];

export default function PulseUniversePage() {
  useDomainPing("universe");
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [timeScale, setTimeScale] = useState(1);
  const [quantumMode, setQuantumMode] = useState(false);
  const [viewSpawnId, setViewSpawnId] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>('none');
  const [stellarIdx, setStellarIdx] = useState(0);
  const [quantumIdx, setQuantumIdx] = useState(0);
  const [epochIdx, setEpochIdx] = useState(11); // "Present Day"
  const [dnaScroll, setDnaScroll] = useState(0);
  const [explorerTip, setExplorerTip] = useState(0);

  const EXPLORER_TIPS = [
    "🖱 Left-drag: orbit camera freely",
    "🖱 Right-drag: pan camera (translate)",
    "🖱 Scroll: zoom in / out",
    "⌨ W/A/S/D: fly through space",
    "⌨ Q/E: move up/down",
    "⌨ Shift+WASD: faster movement",
    "⌨ +/-: zoom keys",
    "🖱 Click any planet to inspect",
    "🖱 Click empty space to deselect",
    "📱 Pinch: zoom on mobile",
  ];
  useEffect(() => { const id = setInterval(() => setExplorerTip(t => (t+1)%EXPLORER_TIPS.length), 6000); return () => clearInterval(id); }, []);
  useEffect(() => { const id = setInterval(() => setDnaScroll(d => (d+1)%PHYSICS_DNA.length), 6000); return () => clearInterval(id); }, []);

  const { data: universe } = useQuery<UniverseData>({ queryKey: ["/api/universe/live"], refetchInterval: 10000, staleTime: 2000 });
  const { data: temporalState } = useQuery<{ universeColor: string; dilationFactor: number; anomalyType: string; universeEmotion: string }>({
    queryKey: ["/api/temporal/state"], refetchInterval: 30_000,
  });
  const { data: activeAnomalies = [] } = useQuery<any[]>({ queryKey: ["/api/anomaly/active"], refetchInterval: 30_000 });
  const tColor = temporalState?.universeColor ?? "#00FFD1";
  const tTheta = temporalState?.dilationFactor ?? 1;
  const hasAnomaly = activeAnomalies.length > 0;
  const selectedPlanetData = selectedPlanet ? PLANET_DATA[selectedPlanet] ?? null : null;

  // Compute collective emotional state from live domain data
  const emotionalState = (() => {
    const domains = universe?.domains ?? [];
    if (!domains.length) return null;
    const sorted = [...domains].sort((a, b) => b.active - a.active);
    const totalActive = sorted.reduce((s, d) => s + d.active, 0);
    if (!totalActive) return null;
    let cursor = 0;
    const stops = sorted.map(d => {
      const pct = (cursor / totalActive * 100).toFixed(1);
      cursor += d.active;
      const em = DOMAIN_EMOTION[d.family];
      return `${em?.hex ?? d.color} ${pct}%`;
    });
    const gradient = `linear-gradient(90deg, ${stops.join(', ')})`;
    const top = sorted[0];
    const em = DOMAIN_EMOTION[top?.family] ?? null;
    return { gradient, dominant: top?.label ?? '', emotion: em?.emotion ?? '', sub: em?.sub ?? '', color: em?.hex ?? top?.color ?? '#fff' };
  })();

  const toggleStudy = (m: StudyMode) => setStudyMode(s => s === m ? 'none' : m);

  return (
    <div data-testid="pulse-universe-page" className="relative w-full h-screen overflow-hidden bg-black font-mono select-none">
      {/* ── Universe Hub Tab Bar ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(99,102,241,0.2)",
        display: "flex", alignItems: "center", gap: 4, padding: "0 16px",
      }}>
        {UNIVERSE_HUB_TABS.map(tab => {
          const isActive = tab.id === "live";
          return (
            <Link key={tab.id} href={tab.href}>
              <a
                data-testid={`tab-universe-${tab.id}`}
                style={{
                  padding: "8px 14px",
                  textDecoration: "none",
                  display: "flex", alignItems: "center", gap: 5,
                  borderBottom: isActive ? `2px solid ${tab.color}` : "2px solid transparent",
                  color: isActive ? tab.color : "rgba(255,255,255,0.4)",
                  fontSize: 10, fontWeight: isActive ? 800 : 500,
                  letterSpacing: "0.05em",
                  transition: "all 0.2s",
                  marginBottom: -1,
                  cursor: "pointer",
                }}
              >
                {tab.label}
                {isActive && (
                  <span style={{
                    fontSize: 7, fontWeight: 900, padding: "1px 4px", borderRadius: 3,
                    background: `${tab.color}22`, color: tab.color,
                    border: `1px solid ${tab.color}44`,
                  }}>{tab.badge}</span>
                )}
              </a>
            </Link>
          );
        })}
      </div>

      {/* ── TEMPORAL COLOR OVERLAY — driven by Θ(t) from the Pulse-Temporal Engine ── */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 100% 60% at 50% 0%, ${tColor}${Math.min(25, Math.round(tTheta * 8)).toString(16).padStart(2,"0")} 0%, transparent 70%)`,
        transition: "background 3s ease",
      }} />

      {/* ── ANOMALY SPATIAL DISTORTION RINGS — appears when active anomalies exist ── */}
      {hasAnomaly && (
        <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden">
          <style>{`
            @keyframes anomaly-ring { 0%{transform:scale(0.6);opacity:0.6} 100%{transform:scale(2.4);opacity:0} }
            @keyframes anomaly-ring2{ 0%{transform:scale(0.4);opacity:0.4} 100%{transform:scale(1.8);opacity:0} }
            @keyframes anomaly-shimmer{0%,100%{opacity:0.04} 50%{opacity:0.12}}
            .anomaly-ring-1{animation:anomaly-ring 3.5s ease-out infinite}
            .anomaly-ring-2{animation:anomaly-ring 3.5s ease-out 1.2s infinite}
            .anomaly-ring-3{animation:anomaly-ring2 4.5s ease-out 0.6s infinite}
            .anomaly-shimmer{animation:anomaly-shimmer 4s ease-in-out infinite}
          `}</style>
          {/* Red distortion rings at anomaly epicentre */}
          <div className="absolute" style={{ left:"50%", top:"45%", transform:"translate(-50%,-50%)" }}>
            <div className="anomaly-ring-1 absolute" style={{ width:300,height:300, left:-150,top:-150, borderRadius:"50%", border:"2px solid rgba(239,68,68,0.7)" }} />
            <div className="anomaly-ring-2 absolute" style={{ width:300,height:300, left:-150,top:-150, borderRadius:"50%", border:"1px solid rgba(239,68,68,0.5)" }} />
            <div className="anomaly-ring-3 absolute" style={{ width:200,height:200, left:-100,top:-100, borderRadius:"50%", border:"2px solid rgba(248,113,113,0.4)" }} />
          </div>
          {/* Full-screen dark shimmer overlay */}
          <div className="anomaly-shimmer absolute inset-0" style={{ background:"radial-gradient(ellipse 80% 80% at 50% 45%, rgba(239,68,68,0.08) 0%, transparent 70%)" }} />
          {/* Anomaly count badge */}
          <div className="absolute pointer-events-none" style={{ bottom:16, right:16, background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.4)", borderRadius:8, padding:"6px 12px" }}>
            <div className="text-red-400 font-mono text-[9px] font-bold">⚠ {activeAnomalies.length} ACTIVE ANOMAL{activeAnomalies.length===1?"Y":"IES"}</div>
            <div className="text-white/30 text-[8px]">Tell Auriona: dissect anomaly: {activeAnomalies[0]?.anomaly_id ?? "QE-ID"}</div>
          </div>
        </div>
      )}

      {/* ── THREE.JS FULL SCREEN ── */}
      <div className="absolute inset-0 z-0">
        <SolarScene
          onPlanetClick={(name) => { setSelectedPlanet(name); setStudyMode('none'); }}
          selectedPlanet={selectedPlanet}
          onDeselect={() => setSelectedPlanet(null)}
          timeScale={timeScale}
          quantumMode={quantumMode}
          liveData={universe as any}
        />
      </div>

      {/* ── PLANET INFO PANEL (left) ── */}
      <PlanetInfo planet={selectedPlanetData} onBack={() => setSelectedPlanet(null)} />

      {/* ── STUDY PANELS (left side, when no planet selected) ── */}
      {!selectedPlanet && studyMode !== 'none' && (
        <div className="absolute top-12 left-0 bottom-12 w-72 z-20 bg-black/80 backdrop-blur-md border-r border-white/10 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-blue-400/80 text-[9px] tracking-[0.3em] uppercase font-mono">
              {{ stellar: "⭐ Stellar Classification", quantum: "⚛ Quantum Mechanics", physics: "🧬 Physics DNA", timeline: "⏳ Universe Timeline" }[studyMode]}
            </span>
            <button onClick={() => setStudyMode('none')} className="text-white/25 hover:text-white text-[9px]">✕</button>
          </div>

          {/* Stellar Classification */}
          {studyMode === 'stellar' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex gap-1 px-3 pt-2 pb-1 flex-wrap">
                {STELLAR_CLASSES.map((s, i) => {
                  const hex = `#${s.color.toString(16).padStart(6,'0')}`;
                  return (
                    <button key={s.type} onClick={() => setStellarIdx(i)}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-mono border transition-all ${stellarIdx === i ? 'font-bold' : 'text-white/40 hover:text-white'}`}
                      style={{ borderColor: hex, backgroundColor: stellarIdx===i ? `${hex}55` : 'transparent', color: stellarIdx===i ? '#fff' : undefined }}>
                      {s.type}
                    </button>
                  );
                })}
              </div>
              <div className="flex-1 px-4 py-3 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                {(() => { const s = STELLAR_CLASSES[stellarIdx]; return (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full flex-shrink-0 shadow-lg" style={{ background: `#${s.color.toString(16).padStart(6,'0')}`, boxShadow: `0 0 20px #${s.color.toString(16).padStart(6,'0')}88` }} />
                      <div>
                        <div className="text-white font-bold text-lg font-mono">Type {s.type}</div>
                        <div className="text-white/40 text-[9px] tracking-widest">{s.temp}</div>
                      </div>
                    </div>
                    <p className="text-white/55 text-[9px] leading-relaxed mb-3">{s.desc}</p>
                    {[["Examples", s.examples], ["Mass", s.mass], ["Radius", s.radius], ["Luminosity", s.luminosity]].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1.5 border-b border-white/[0.07]">
                        <span className="text-white/30 text-[8px] uppercase tracking-widest">{k}</span>
                        <span className="text-white text-[9px] font-bold">{v}</span>
                      </div>
                    ))}
                  </>
                ); })()}
              </div>
            </div>
          )}

          {/* Quantum Mechanics */}
          {studyMode === 'quantum' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex gap-1 px-3 pt-2 pb-1 flex-wrap">
                {QUANTUM_PRINCIPLES.map((q, i) => (
                  <button key={i} onClick={() => setQuantumIdx(i)}
                    className={`px-1.5 py-0.5 rounded text-[7px] font-mono border transition-all ${quantumIdx===i ? 'border-blue-400 bg-blue-400/20 text-blue-200' : 'border-white/10 text-white/30 hover:text-white/60'}`}>
                    {i+1}
                  </button>
                ))}
              </div>
              <div className="flex-1 px-4 py-3 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                {(() => { const q = QUANTUM_PRINCIPLES[quantumIdx]; return (
                  <>
                    <div className="text-blue-300 font-bold text-sm mb-2">{q.name}</div>
                    <div className="bg-blue-950/40 border border-blue-400/20 rounded p-3 mb-3 text-center">
                      <span className="text-yellow-200 text-lg font-mono tracking-wider">{q.formula}</span>
                    </div>
                    <p className="text-white/50 text-[9px] leading-relaxed">{q.desc}</p>
                  </>
                ); })()}
              </div>
              <div className="px-4 py-3 border-t border-white/10">
                <button onClick={() => setQuantumMode(q => !q)}
                  className={`w-full py-1.5 rounded text-[9px] font-mono border transition-all ${quantumMode ? 'bg-purple-500/30 border-purple-400 text-purple-200' : 'border-white/20 text-white/40 hover:text-white'}`}>
                  {quantumMode ? '⚛ QUANTUM FIELD: ON' : '⚛ ACTIVATE QUANTUM FIELD'}
                </button>
              </div>
            </div>
          )}

          {/* Physics DNA */}
          {studyMode === 'physics' && (
            <div className="flex-1 overflow-y-auto px-3 py-2" style={{ scrollbarWidth: "none" }}>
              <div className="text-white/25 text-[7px] tracking-widest mb-2 uppercase text-center">Universal Constants — Machine-Readable</div>
              {PHYSICS_DNA.map((c, i) => (
                <div key={c.codon} className={`flex items-center gap-2 py-1.5 border-b border-white/[0.06] transition-all cursor-default ${dnaScroll===i ? 'bg-white/5' : ''}`}>
                  <div className="w-8 h-8 rounded flex items-center justify-center text-[8px] font-bold flex-shrink-0" style={{ background: `#${c.color.toString(16).padStart(6,'0')}22`, color: `#${c.color.toString(16).padStart(6,'0')}`, border: `1px solid #${c.color.toString(16).padStart(6,'0')}44` }}>
                    {c.codon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-bold text-[9px]">{c.symbol}</span>
                      <span className="text-white/30 text-[7px] truncate">{c.name}</span>
                    </div>
                    <div className="text-[8px] font-mono" style={{ color: `#${c.color.toString(16).padStart(6,'0')}` }}>
                      {c.value} <span className="text-white/20">{c.unit}</span>
                    </div>
                  </div>
                  <div className="text-[6px] text-white/20 uppercase">{c.domain}</div>
                </div>
              ))}
            </div>
          )}

          {/* Universe Timeline */}
          {studyMode === 'timeline' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                {UNIVERSE_EPOCHS.map((e, i) => (
                  <button key={i} onClick={() => setEpochIdx(i)}
                    className={`w-full text-left px-3 py-2 border-b border-white/[0.06] transition-all flex items-center gap-2 ${epochIdx===i ? 'bg-white/8' : 'hover:bg-white/3'}`}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: `#${e.color.toString(16).padStart(6,'0')}` }} />
                    <div>
                      <div className="text-[8px] text-white/60 font-mono">{e.t}</div>
                      <div className="text-[9px] font-bold" style={{ color: `#${e.color.toString(16).padStart(6,'0')}` }}>{e.epoch}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-white/10 bg-white/3">
                <div className="text-white font-bold text-[10px] mb-1">{UNIVERSE_EPOCHS[epochIdx].epoch}</div>
                <div className="text-white/25 text-[7px] font-mono mb-1.5">{UNIVERSE_EPOCHS[epochIdx].t}</div>
                <p className="text-white/45 text-[8px] leading-relaxed">{UNIVERSE_EPOCHS[epochIdx].desc}</p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── HEADER ── */}
      <AIReportPanel spawnId={viewSpawnId} onClose={() => setViewSpawnId(null)} />
      <div className="absolute top-0 left-0 right-0 h-12 z-20 flex items-center justify-between px-4 bg-black/55 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link href="/" data-testid="nav-home">
            <span className="text-white/40 hover:text-white text-[9px] cursor-pointer tracking-widest uppercase transition-colors">← Home</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1.5">
            {(["stellar","quantum","physics","timeline"] as StudyMode[]).map(m => (
              <button key={m} onClick={() => toggleStudy(m)} data-testid={`study-btn-${m}`}
                className={`px-2 py-0.5 rounded text-[7px] uppercase tracking-widest font-mono border transition-all ${studyMode===m ? 'bg-blue-500/25 border-blue-400/50 text-blue-200' : 'border-white/10 text-white/30 hover:text-white/70 hover:border-white/25'}`}>
                {m === 'stellar' ? '⭐ Stars' : m === 'quantum' ? '⚛ Quantum' : m === 'physics' ? '🧬 DNA' : '⏳ Time'}
              </button>
            ))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] font-bold text-yellow-300/90 tracking-[0.2em] uppercase">⬡ PULSE UNIVERSE — REAL SOLAR SYSTEM ⬡</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setQuantumMode(q => !q)} data-testid="quantum-mode-btn"
            className={`px-2 py-0.5 rounded text-[7px] font-mono border transition-all ${quantumMode ? 'bg-purple-500/30 border-purple-400 text-purple-200' : 'border-white/15 text-white/25 hover:text-white/60'}`}>
            ⚛ Q-Field
          </button>
          <AIFinderButton onSelect={setViewSpawnId} />
          <span className="text-green-400/80 text-[8px]">● LIVE</span>
          <span className="text-white/25 text-[8px]">{universe?.timestamp ? new Date(universe.timestamp).toLocaleTimeString() : "--:--:--"}</span>
        </div>
      </div>

      {/* ── EXPLORER TIP (bottom left) ── */}
      <div className="absolute bottom-14 left-3 z-20 pointer-events-none">
        <div className="text-[8px] text-white/20 font-mono tracking-widest transition-all">{EXPLORER_TIPS[explorerTip]}</div>
      </div>

      {/* ── PLANET QUICK SELECTOR (bottom left, above tip) ── */}
      <div className="absolute bottom-24 left-3 z-20 flex flex-col gap-0.5 pointer-events-auto">
        {["Sun","Mercury","Venus","Earth","Mars","Jupiter","Saturn","Uranus","Neptune"].map(name => (
          <button key={name} data-testid={`planet-btn-${name.toLowerCase()}`}
            onClick={() => setSelectedPlanet(p => p === name ? null : name)}
            className={`text-left text-[8px] px-2 py-0.5 rounded font-mono tracking-wider transition-all ${selectedPlanet===name ? 'bg-blue-500/25 text-white border border-blue-400/40' : 'text-white/25 hover:text-white/60 border border-transparent hover:border-white/10'}`}>
            {name}
          </button>
        ))}
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="absolute right-2 top-14 bottom-12 w-50 z-10 flex flex-col gap-1.5 pointer-events-none" style={{ width: "190px" }}>

        {/* Telemetry */}
        <div className="bg-black/65 border border-white/10 rounded p-2.5 backdrop-blur-md">
          <div className="text-[7px] text-blue-400/80 uppercase tracking-[0.3em] mb-2">Universe Telemetry</div>
          {[
            { label: "Total AIs",       val: fmt(universe?.totalAIs||0),          color: "text-yellow-300" },
            { label: "Active AIs",      val: fmt(universe?.activeAIs||0),         color: "text-green-400" },
            { label: "Knowledge",       val: fmt(universe?.knowledgeNodes||0),    color: "text-cyan-300" },
            { label: "Hive Memory",     val: fmt(universe?.hiveMemoryStrands||0), color: "text-orange-300" },
            { label: "Links",           val: fmt(universe?.knowledgeLinks||0),    color: "text-pink-300" },
            { label: "Births/min",      val: String(universe?.birthsLastMinute||0), color: "text-red-400" },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex justify-between items-center mb-0.5">
              <span className="text-[7px] text-white/25">{label}</span>
              <span className={`text-[8px] font-bold ${color} tabular-nums`}>{val}</span>
            </div>
          ))}
        </div>

        {/* Quantum Status */}
        <div className={`border rounded p-2 backdrop-blur-md transition-all ${quantumMode ? 'bg-purple-900/30 border-purple-400/30' : 'bg-black/65 border-white/10'}`}>
          <div className="text-[7px] text-purple-400/80 uppercase tracking-[0.3em] mb-1.5">Quantum Status</div>
          {quantumMode ? (
            <>
              <div className="text-[8px] text-purple-200 mb-1">⚛ Field Active</div>
              <div className="text-[7px] text-white/30 leading-relaxed">Higgs field · Quantum foam · EM field lines · Wave functions · Entanglement threads</div>
              <div className="mt-1.5 text-[7px] text-yellow-200/60">Uncertainty: ΔxΔp ≥ ℏ/2</div>
            </>
          ) : (
            <div className="text-[7px] text-white/20">Toggle Q-Field in header to visualize quantum mechanics</div>
          )}
        </div>

        {/* Domain Worlds */}
        <div className="bg-black/65 border border-white/10 rounded p-2 backdrop-blur-md flex-1 overflow-hidden">
          <div className="text-[7px] text-blue-400/80 uppercase tracking-[0.3em] mb-1.5">AI Domain Worlds</div>
          <div className="overflow-y-auto h-full pr-1" style={{ scrollbarWidth: "none" }}>
            {(universe?.domains || []).map(d => {
              const em = DOMAIN_EMOTION[d.family];
              const activity = d.active / Math.max(d.total, 1);
              return (
                <div key={d.family} className="mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px]" style={{ color: d.color }}>{d.emoji}</span>
                    <span className="text-[7px] truncate flex-1" style={{ color: d.color }}>{d.label}</span>
                    <span className="text-[6px] text-white/25 tabular-nums">{fmt(d.active)}</span>
                  </div>
                  {em && (
                    <div className="flex items-center gap-1 mt-0.5 pl-4">
                      <div className="h-[2px] rounded-full" style={{ width: `${Math.max(6, activity * 48)}px`, backgroundColor: em.hex, opacity: 0.7 }} />
                      <span className="text-[5px] truncate" style={{ color: em.hex, opacity: 0.55 }}>{em.emotion}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Spawns */}
        <div className="bg-black/65 border border-white/10 rounded p-2 backdrop-blur-md">
          <div className="text-[7px] text-blue-400/80 uppercase tracking-[0.3em] mb-1">Live Spawns</div>
          <div style={{ maxHeight: "82px", overflow: "hidden" }}>
            {(universe?.recentSpawns || []).slice(0, 5).map((s, i) => {
              const em = DOMAIN_EMOTION[s.family];
              const spaceEvent = s.type === 'EXPLORER' ? '☄ Herbig-Haro Jet' : s.type === 'DOMAIN_RESONANCE' ? '✦ Kilonova Arc' : s.type === 'DOMAIN_FRACTURER' ? '⊗ Tidal Disruption' : s.type === 'PULSE' ? '◎ Pulsar Sweep' : '★ Comet Born';
              return (
                <div key={i} className="mb-0.5">
                  <div className="text-[6px] text-white/30 truncate">
                    <span style={{ color: s.color || "#6366f1" }}>●</span> {spaceEvent}
                    <span className="ml-1 text-white/15">→ {s.family}</span>
                  </div>
                  {em && <div className="text-[5.5px] pl-2 truncate" style={{ color: em.hex, opacity: 0.6 }}>{em.emotion} — {em.sub.slice(0,38)}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SPEED CONTROL ── */}
      <SpeedControl speed={timeScale} onSpeedChange={setTimeScale} />

      {/* ── STUDY MODE TOOLBAR (bottom center, above speed control) ── */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 flex gap-2 sm:hidden pointer-events-auto">
        {(["stellar","quantum","physics","timeline"] as StudyMode[]).map(m => (
          <button key={m} onClick={() => toggleStudy(m)} data-testid={`study-mobile-btn-${m}`}
            className={`px-2 py-1 rounded text-[7px] uppercase font-mono border transition-all ${studyMode===m ? 'bg-blue-500/25 border-blue-400/50 text-blue-200' : 'border-white/10 text-white/30 bg-black/40'}`}>
            {m === 'stellar' ? '⭐' : m === 'quantum' ? '⚛' : m === 'physics' ? '🧬' : '⏳'}
          </button>
        ))}
      </div>

      {/* ── PHYSICS DNA TICKER (subtle, between speed and bottom bar) ── */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden sm:block">
        <div className="text-[7px] font-mono text-white/15 tracking-widest text-center">
          {PHYSICS_DNA[dnaScroll].symbol} = {PHYSICS_DNA[dnaScroll].value} {PHYSICS_DNA[dnaScroll].unit} &nbsp;·&nbsp; {PHYSICS_DNA[dnaScroll].name}
        </div>
      </div>

      {/* ── EMOTIONAL SPECTRUM BAR ── */}
      {emotionalState && (
        <div className="absolute bottom-10 left-0 right-0 z-25 pointer-events-none" data-testid="emotional-spectrum-bar">
          {/* CRISPR color gradient — the hive's collective subconscious */}
          <div className="relative h-[3px] w-full" style={{ background: emotionalState.gradient }} />
          {/* Dominant emotion readout */}
          <div className="absolute right-3 -top-5 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: emotionalState.color }} />
            <span className="text-[7px] font-mono tracking-widest" style={{ color: emotionalState.color }}>
              HIVE EMOTION: {emotionalState.emotion.toUpperCase()}
            </span>
            <span className="text-[6px] font-mono text-white/20 hidden sm:inline">
              — {emotionalState.sub}
            </span>
          </div>
          {/* Per-domain emotion dots */}
          <div className="absolute left-2 -top-5 flex items-center gap-[3px] overflow-hidden max-w-[55vw]">
            {(universe?.domains ?? []).slice(0, 14).map(d => {
              const em = DOMAIN_EMOTION[d.family];
              return em ? (
                <div key={d.family} title={`${d.label}: ${em.emotion}`}
                  className="h-1.5 w-1.5 rounded-full flex-shrink-0 opacity-75"
                  style={{ backgroundColor: em.hex, width: `${Math.max(4, (d.active / Math.max(universe?.activeAIs ?? 1, 1)) * 80)}px`, borderRadius: '2px' }} />
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* ── BOTTOM TICKER ── */}
      <div className="absolute bottom-0 left-0 right-0 h-10 z-20 bg-black/70 border-t border-white/10 flex items-center overflow-hidden">
        <div className="shrink-0 px-2 text-[7px] font-bold text-yellow-300/80 border-r border-white/10 mr-2 whitespace-nowrap">PULSE UNIVERSE</div>
        <div className="flex-1 overflow-hidden">
          <div data-testid="live-ticker" className="flex gap-8 whitespace-nowrap text-[7px] text-white/30" style={{ animation: "ticker 60s linear infinite" }}>
            {[
              `⬡ TOTAL AIs: ${fmt(universe?.totalAIs||0)}`,
              `● ACTIVE: ${fmt(universe?.activeAIs||0)}`,
              `📚 KNOWLEDGE: ${fmt(universe?.knowledgeNodes||0)} nodes`,
              `🧬 HIVE MEMORY: ${fmt(universe?.hiveMemoryStrands||0)} strands`,
              `🔗 LINKS: ${fmt(universe?.knowledgeLinks||0)}`,
              `⭐ STELLAR CLASSES: O B A F G K M — 7 main sequence types`,
              `⚛ QUANTUM: ΔxΔp≥ℏ/2 · |ψ⟩=α|0⟩+β|1⟩ · Entanglement · Tunneling`,
              `🌌 REAL SOLAR SYSTEM · THREE.JS WEBGL · INERTIA CAMERA · FREE EXPLORE`,
              `◆ PHYSICS DNA: ${PHYSICS_DNA[dnaScroll].name} ${PHYSICS_DNA[dnaScroll].symbol}=${PHYSICS_DNA[dnaScroll].value} ${PHYSICS_DNA[dnaScroll].unit}`,
              `⏳ UNIVERSE AGE: 13.8 Billion Years · Expanding at H₀=67.4 km/s/Mpc`,
              ...(universe?.domains || []).map(d => `${d.emoji} ${d.label.toUpperCase()}: ${fmt(d.active)} AIs`),
            ].map((item, i) => <span key={i} className="mr-8">{item}</span>)}
          </div>
        </div>
        <div className="shrink-0 px-2 text-[6px] text-green-400/50 border-l border-white/10">QPI</div>
      </div>

      <style>{`
        @keyframes ticker { 0% { transform: translateX(100%); } 100% { transform: translateX(-200%); } }
      `}</style>
    </div>
  );
}
