import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import SolarScene from "../solar/SolarScene";
import PlanetInfo from "../solar/PlanetInfo";
import SpeedControl from "../solar/SpeedControl";
import { PLANET_DATA } from "../solar/planetData";

interface DomainData {
  family: string; total: number; active: number; color: string; emoji: string; label: string; major: string;
}
interface UniverseData {
  totalAIs: number; activeAIs: number; knowledgeNodes: number; knowledgeGenerated: number;
  hiveMemoryStrands: number; hiveMemoryDomains: number; hiveMemoryConfidence: number; knowledgeLinks: number;
  birthsLastMinute: number; domains: DomainData[];
  recentSpawns: { spawnId: string; family: string; type: string; domain: string; description: string; bornAt: string; major: string; color: string }[];
  ingestionSources: { id: string; name: string; totalNodes: number; runs: number; lastRun: string }[];
  recentEvents: { type: string; title: string; domain: string; at: string }[];
  timestamp: string;
}

const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1000).toFixed(1)}K` : String(n);

export default function PulseUniversePage() {
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [timeScale, setTimeScale] = useState(1);

  const { data: universe } = useQuery<UniverseData>({
    queryKey: ["/api/universe/live"],
    refetchInterval: 4000,
    staleTime: 2000,
  });

  const selectedPlanetData = selectedPlanet ? PLANET_DATA[selectedPlanet] ?? null : null;

  return (
    <div data-testid="pulse-universe-page" className="relative w-full h-screen overflow-hidden bg-black font-mono">

      {/* ── THREE.JS FULL SCREEN ── */}
      <div className="absolute inset-0 z-0">
        <SolarScene
          onPlanetClick={setSelectedPlanet}
          selectedPlanet={selectedPlanet}
          onDeselect={() => setSelectedPlanet(null)}
          timeScale={timeScale}
        />
      </div>

      {/* ── PLANET INFO PANEL (left slide-in) ── */}
      <PlanetInfo planet={selectedPlanetData} onBack={() => setSelectedPlanet(null)} />

      {/* ── SPEED CONTROL ── */}
      <SpeedControl speed={timeScale} onSpeedChange={setTimeScale} />

      {/* ── HEADER ── */}
      <div className="absolute top-0 left-0 right-0 h-12 z-20 flex items-center justify-between px-4 bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link href="/" data-testid="nav-home">
            <span className="text-white/50 hover:text-white text-xs cursor-pointer transition-colors tracking-widest uppercase">← Home</span>
          </Link>
          <span className="text-white/25 text-[10px] tracking-[0.35em] uppercase hidden sm:block">Quantum Pulse Intelligence</span>
        </div>
        <div className="text-center">
          <div className="text-[11px] font-bold text-yellow-300/90 tracking-[0.25em] uppercase">⬡ PULSE UNIVERSE — REAL SOLAR SYSTEM ⬡</div>
          <div className="text-[8px] text-white/30 tracking-widest hidden sm:block">REAL TEXTURES · REAL ORBITS · REAL PHYSICS · CLICK ANY PLANET</div>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-green-400/80">● LIVE</span>
          <span className="text-white/30">{universe?.timestamp ? new Date(universe.timestamp).toLocaleTimeString() : "--:--:--"}</span>
        </div>
      </div>

      {/* ── RIGHT PANEL: Universe Stats ── */}
      <div className="absolute right-3 top-14 bottom-14 w-52 z-10 flex flex-col gap-2 pointer-events-none">

        {/* Telemetry */}
        <div className="bg-black/65 border border-white/10 rounded p-3 backdrop-blur-md">
          <div className="text-[8px] text-blue-400/80 uppercase tracking-[0.3em] mb-2">Universe Telemetry</div>
          {[
            { label: "Total AIs",          val: fmt(universe?.totalAIs || 0),           color: "text-yellow-300" },
            { label: "Active AIs",         val: fmt(universe?.activeAIs || 0),          color: "text-green-400" },
            { label: "Knowledge Nodes",    val: fmt(universe?.knowledgeNodes || 0),     color: "text-cyan-300" },
            { label: "Hive Memory",        val: fmt(universe?.hiveMemoryStrands || 0),  color: "text-orange-300" },
            { label: "Knowledge Links",    val: fmt(universe?.knowledgeLinks || 0),     color: "text-pink-300" },
            { label: "Births/min",         val: String(universe?.birthsLastMinute || 0), color: "text-red-400" },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex justify-between items-center mb-1">
              <span className="text-[8px] text-white/25 truncate">{label}</span>
              <span className={`text-[9px] font-bold ${color} ml-1 tabular-nums shrink-0`}>{val}</span>
            </div>
          ))}
        </div>

        {/* Domain Worlds */}
        <div className="bg-black/65 border border-white/10 rounded p-2 backdrop-blur-md flex-1 overflow-hidden">
          <div className="text-[8px] text-blue-400/80 uppercase tracking-[0.3em] mb-2">AI Domain Worlds</div>
          <div className="overflow-y-auto h-full pr-1" style={{ scrollbarWidth: "none" }}>
            {(universe?.domains || []).map(d => (
              <div key={d.family} className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px]" style={{ color: d.color }}>{d.emoji}</span>
                <span className="text-[8px] truncate flex-1" style={{ color: d.color }}>{d.label}</span>
                <span className="text-[7px] text-white/30 tabular-nums shrink-0">{fmt(d.active)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-black/65 border border-white/10 rounded p-2 backdrop-blur-md">
          <div className="text-[8px] text-blue-400/80 uppercase tracking-[0.3em] mb-1.5">Live Spawns</div>
          <div className="overflow-hidden" style={{ maxHeight: "90px" }}>
            {(universe?.recentSpawns || []).slice(0, 5).map((s, i) => (
              <div key={i} className="text-[7px] text-white/35 mb-0.5 truncate">
                <span style={{ color: s.color || "#6366f1" }}>●</span> {s.type} → {s.family}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PLANET QUICK SELECTOR ── */}
      <div className="absolute left-3 bottom-14 z-20 flex flex-col gap-1 pointer-events-auto">
        <div className="text-[7px] text-white/25 uppercase tracking-widest mb-1">Planets</div>
        {["Sun","Mercury","Venus","Earth","Mars","Jupiter","Saturn","Uranus","Neptune"].map(name => (
          <button
            key={name}
            data-testid={`planet-btn-${name.toLowerCase()}`}
            onClick={() => setSelectedPlanet(prev => prev === name ? null : name)}
            className={`text-left text-[8px] px-2 py-0.5 rounded transition-all font-mono tracking-wider ${selectedPlanet === name ? 'bg-blue-500/30 text-white border border-blue-400/40' : 'text-white/30 hover:text-white/70 border border-transparent hover:border-white/10'}`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* ── BOTTOM TICKER ── */}
      <div className="absolute bottom-0 left-0 right-0 h-10 z-20 bg-black/70 border-t border-white/10 flex items-center overflow-hidden">
        <div className="shrink-0 px-3 text-[8px] font-bold text-yellow-300/80 border-r border-white/10 mr-2 whitespace-nowrap">HIVE LIVE</div>
        <div className="flex-1 overflow-hidden">
          <div data-testid="live-ticker" className="flex gap-8 whitespace-nowrap text-[8px] text-white/30" style={{ animation: "ticker 55s linear infinite" }}>
            {[
              `⬡ TOTAL AIs: ${fmt(universe?.totalAIs || 0)}`,
              `● ACTIVE: ${fmt(universe?.activeAIs || 0)}`,
              `📚 KNOWLEDGE: ${fmt(universe?.knowledgeNodes || 0)} nodes`,
              `🧠 HIVE MEMORY: ${fmt(universe?.hiveMemoryStrands || 0)} strands`,
              `🔗 LINKS: ${fmt(universe?.knowledgeLinks || 0)}`,
              `🎓 PULSEU DOMAINS: ${universe?.domains?.length || 0}`,
              `▲ BIRTHS/MIN: ${universe?.birthsLastMinute || 0}`,
              `🌐 REAL SOLAR SYSTEM · THREE.JS WEBGL`,
              `◆ CONFIDENCE: ${universe?.hiveMemoryConfidence ? (universe.hiveMemoryConfidence * 100).toFixed(1) : 0}%`,
              ...(universe?.domains || []).map(d => `${d.emoji} ${d.label.toUpperCase()}: ${fmt(d.active)} AIs`),
            ].map((item, i) => <span key={i} className="mr-8">{item}</span>)}
          </div>
        </div>
        <div className="shrink-0 px-3 text-[7px] text-green-400/60 border-l border-white/10">QPI</div>
      </div>

      <style>{`
        @keyframes ticker { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
      `}</style>
    </div>
  );
}
