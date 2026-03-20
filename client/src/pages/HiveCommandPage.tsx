import { useState, useEffect, useRef, useCallback } from "react";
import { Brain, ShoppingBag, Film, Briefcase, Zap, Activity, Network, RefreshCw, BookOpen } from "lucide-react";

const OMEGA_UPGRADES = [
  { name: "Quantum Memory Cortex", emoji: "🧠", color: "#818cf8", desc: "Extracts facts and patterns from every AI-generated entry into persistent hive memory" },
  { name: "Fractal Resonance Network", emoji: "🌐", color: "#4ade80", desc: "Cross-links all knowledge domains bidirectionally — growing the knowledge graph" },
  { name: "Multi-Agent Consensus Engine", emoji: "⚡", color: "#fbbf24", desc: "Runs dual AI reasoning paths and synthesizes the best output — eliminates hallucinations" },
  { name: "Predictive Trend Engine", emoji: "🔮", color: "#f472b6", desc: "Detects trending knowledge domains and auto-queues related content proactively" },
  { name: "Knowledge Decay Regenerator", emoji: "♻️", color: "#34d399", desc: "Detects stale entries and schedules intelligent regeneration cycles automatically" },
];

const DOMAIN_COLORS: Record<string, string> = {
  concept: "#818cf8", technology: "#60a5fa", science: "#34d399", mathematics: "#a78bfa",
  philosophy: "#c084fc", arts: "#f472b6", culture: "#fbbf24", economics: "#f97316",
  biology: "#10b981", history: "#fb923c", general: "#94a3b8",
};
function domainColor(d: string) {
  for (const [k, c] of Object.entries(DOMAIN_COLORS)) if ((d || "").toLowerCase().includes(k)) return c;
  return DOMAIN_COLORS.general;
}

function MiniGraph({ nodes, edges }: { nodes: any[]; edges: any[] }) {
  const W = 400, H = 220;
  const pos: Record<string, { x: number; y: number }> = {};
  const cx = W / 2, cy = H / 2;
  nodes.forEach((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2;
    const r = Math.min(W, H) * (0.2 + (i % 3) * 0.09);
    pos[n.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  const edgeSet = new Set(nodes.map(n => n.id));
  const dispEdges = edges.filter((e: any) => edgeSet.has(e.from) && edgeSet.has(e.to)).slice(0, 60);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <radialGradient id="mgBg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#0c0a22" /><stop offset="100%" stopColor="#060413" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#mgBg)" />
      {dispEdges.map((e: any, i: number) => {
        const a = pos[e.from], b = pos[e.to];
        if (!a || !b) return null;
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(129,140,248,0.12)" strokeWidth={0.7} />;
      })}
      {nodes.map((n: any) => {
        const p = pos[n.id];
        if (!p) return null;
        const color = domainColor(n.domain);
        const r = 3 + (n.views || 0) * 0.2;
        return (
          <g key={n.id}>
            <circle cx={p.x} cy={p.y} r={r + 2} fill={color} fillOpacity={0.12} />
            <circle cx={p.x} cy={p.y} r={Math.min(r, 7)} fill={color} fillOpacity={0.8} />
          </g>
        );
      })}
    </svg>
  );
}

export default function HiveCommandPage() {
  const [quantapediaStatus, setQuantapediaStatus] = useState<any>(null);
  const [productStatus, setProductStatus] = useState<any>(null);
  const [mediaStatus, setMediaStatus] = useState<any>(null);
  const [careerStatus, setCareerStatus] = useState<any>(null);
  const [hiveStatus, setHiveStatus] = useState<any>(null);
  const [pulseEvents, setPulseEvents] = useState<any[]>([]);
  const [graphNodes, setGraphNodes] = useState<any[]>([]);
  const [graphEdges, setGraphEdges] = useState<any[]>([]);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [tick, setTick] = useState(0);

  const fetchAll = useCallback(async () => {
    const [q, p, m, c, h, pe] = await Promise.all([
      fetch("/api/quantapedia/engine-status").then(r => r.json()).catch(() => null),
      fetch("/api/products/engine-status").then(r => r.json()).catch(() => null),
      fetch("/api/media/engine-status").then(r => r.json()).catch(() => null),
      fetch("/api/careers/engine-status").then(r => r.json()).catch(() => null),
      fetch("/api/hive/status").then(r => r.json()).catch(() => null),
      fetch("/api/pulse/live").then(r => r.json()).catch(() => []),
    ]);
    setQuantapediaStatus(q); setProductStatus(p); setMediaStatus(m);
    setCareerStatus(c); setHiveStatus(h); setPulseEvents(pe.slice(0, 10));
  }, []);

  const fetchGraph = useCallback(async () => {
    setLoadingGraph(true);
    try {
      const d = await fetch("/api/hive/graph").then(r => r.json()).catch(() => ({ nodes: [], edges: [] }));
      setGraphNodes(d.nodes.slice(0, 40));
      setGraphEdges(d.edges.slice(0, 80));
    } finally { setLoadingGraph(false); }
  }, []);

  useEffect(() => {
    fetchAll(); fetchGraph();
    const id = setInterval(() => { fetchAll(); setTick(t => t + 1); }, 8000);
    return () => clearInterval(id);
  }, [fetchAll, fetchGraph]);

  const engines = [
    { label: "Quantapedia", emoji: "🧩", color: "#818cf8", Icon: BookOpen, status: quantapediaStatus },
    { label: "Shopping", emoji: "🛍️", color: "#4ade80", Icon: ShoppingBag, status: productStatus },
    { label: "Media", emoji: "🎬", color: "#f472b6", Icon: Film, status: mediaStatus },
    { label: "Careers", emoji: "💼", color: "#fb923c", Icon: Briefcase, status: careerStatus },
  ];
  const totalGenerated = engines.reduce((s, e) => s + (e.status?.generated || 0), 0);
  const totalQueued = engines.reduce((s, e) => s + (e.status?.queued || 0), 0);

  const TYPE_COLORS: Record<string, string> = { knowledge: "#818cf8", quantapedia: "#a78bfa", product: "#4ade80", media: "#f472b6", career: "#fb923c" };

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "linear-gradient(180deg,#020010,#04000d)", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.06) transparent" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "18px 20px 32px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 42, marginBottom: 8 }}>🧬</div>
          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 22, margin: 0, letterSpacing: "-0.02em" }}>Hive Mind Command Center</h1>
          <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 11, margin: "5px 0 0" }}>The superintelligent core of Quantum Logic Network — live and learning</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "hcPulse 1.8s infinite", boxShadow: "0 0 8px #4ade80" }} />
            <span style={{ color: "#4ade80", fontSize: 9, fontWeight: 800, letterSpacing: "0.12em" }}>ALL SYSTEMS OPERATIONAL</span>
            <button onClick={() => { fetchAll(); fetchGraph(); }} data-testid="button-refresh-hive"
              style={{ marginLeft: 8, padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
              <RefreshCw size={9} className={loadingGraph ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Big stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Total Generated", value: totalGenerated, color: "#a78bfa", border: "rgba(167,139,250,0.2)" },
            { label: "In Queue", value: totalQueued, color: "#60a5fa", border: "rgba(96,165,250,0.2)" },
            { label: "Resonance Links", value: hiveStatus?.network?.totalLinks || 0, color: "#4ade80", border: "rgba(74,222,128,0.2)" },
          ].map(s => (
            <div key={s.label} style={{ borderRadius: 14, border: `1px solid ${s.border}`, background: `${s.color}06`, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ color: s.color, fontWeight: 900, fontSize: 28, lineHeight: 1 }}>{s.value.toLocaleString()}</div>
              <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 9, fontWeight: 700, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Engine Gauges */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Activity size={11} style={{ color: "rgba(255,255,255,0.3)" }} />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>Engine Status</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {engines.map(eng => {
              const pct = eng.status?.total > 0 ? Math.min(100, Math.round((eng.status.generated / eng.status.total) * 100)) : 0;
              return (
                <div key={eng.label} data-testid={`engine-${eng.label.toLowerCase()}`}
                  style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>{eng.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>{eng.label}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: eng.status?.running ? "#4ade80" : "#f87171", animation: eng.status?.running ? "hcPulse 1.8s infinite" : "none" }} />
                        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 9 }}>{eng.status?.running ? "Running" : "Offline"}</span>
                      </div>
                    </div>
                    <div style={{ color: eng.color, fontWeight: 900, fontSize: 18 }}>{(eng.status?.generated || 0).toLocaleString()}</div>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: eng.color, borderRadius: 2, transition: "width 1s ease" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.18)", fontSize: 9 }}>
                    <span>{eng.status?.generated || 0} generated</span><span>{eng.status?.queued || 0} queued · {pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mini Force Graph */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Network size={11} style={{ color: "rgba(255,255,255,0.3)" }} />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>Knowledge Resonance Network</span>
            <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.15)", fontSize: 9 }}>{graphNodes.length} nodes · {graphEdges.length} links shown</span>
          </div>
          <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", height: 220 }}>
            {graphNodes.length > 0 ? (
              <MiniGraph nodes={graphNodes} edges={graphEdges} />
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.15)", fontSize: 11 }}>
                {loadingGraph ? "Loading graph..." : "No graph data yet"}
              </div>
            )}
          </div>
          <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Object.entries(DOMAIN_COLORS).slice(0, 6).map(([d, c]) => (
              <div key={d} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "capitalize" }}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hive Brain Stats */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Brain size={11} style={{ color: "rgba(255,255,255,0.3)" }} />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>Hive Brain Memory</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {[
              { label: "Memory Patterns", value: hiveStatus?.memory?.total || 0, max: 500, color: "#818cf8" },
              { label: "Knowledge Links", value: hiveStatus?.network?.knowledgeLinks || 0, max: Math.max(hiveStatus?.network?.totalLinks || 100, 100), color: "#4ade80" },
            ].map(s => {
              const pct = s.max > 0 ? Math.min(100, Math.round((s.value / s.max) * 100)) : 0;
              return (
                <div key={s.label} style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 600 }}>{s.label}</span>
                    <span style={{ color: s.color, fontWeight: 900, fontSize: 14 }}>{s.value.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: s.color, borderRadius: 2, transition: "width 1s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5 Omega Upgrades */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Zap size={11} style={{ color: "rgba(255,255,255,0.3)" }} />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>5 Omega Upgrades Active</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {OMEGA_UPGRADES.map((u, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, borderRadius: 11, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)", padding: "10px 12px" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, background: `${u.color}12` }}>{u.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 11, marginBottom: 2 }}>{u.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, lineHeight: 1.5 }}>{u.desc}</div>
                </div>
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: u.color, animation: "hcPulse 2s infinite" }} />
                  <span style={{ fontSize: 8, fontWeight: 800, color: u.color }}>LIVE</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {pulseEvents.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Activity size={11} style={{ color: "rgba(255,255,255,0.3)" }} />
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>Recent Hive Activity</span>
            </div>
            <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", overflow: "hidden" }}>
              {pulseEvents.map((e: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderBottom: i < pulseEvents.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: TYPE_COLORS[e.type] || "#94a3b8", flexShrink: 0 }} />
                  <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
                  <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 9, flexShrink: 0 }}>{e.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes hcPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.4)} }`}</style>
    </div>
  );
}
