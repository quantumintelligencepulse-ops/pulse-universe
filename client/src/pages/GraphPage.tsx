import { useState, useEffect, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut, RefreshCw, Maximize2 } from "lucide-react";
import { useLocation } from "wouter";

const DOMAIN_COLORS: Record<string, string> = {
  science: "#34d399", technology: "#60a5fa", concept: "#818cf8", mathematics: "#a78bfa",
  philosophy: "#c084fc", arts: "#f472b6", culture: "#fbbf24", geography: "#4ade80",
  economics: "#f97316", biology: "#10b981", physics: "#3b82f6", history: "#fb923c",
  general: "#94a3b8", engineering: "#0ea5e9", medicine: "#ef4444", language: "#d946ef",
};
function domainColor(d: string) {
  const s = (d || "general").toLowerCase();
  for (const [k, c] of Object.entries(DOMAIN_COLORS)) if (s.includes(k)) return c;
  return DOMAIN_COLORS.general;
}

function computeLayout(nodes: any[], edges: any[], W: number, H: number) {
  if (!nodes.length) return {};
  const pos: Record<string, { x: number; y: number }> = {};
  const cx = W / 2, cy = H / 2;
  // Group by domain for radial cluster layout
  const groups: Record<string, string[]> = {};
  nodes.forEach(n => { const d = n.domain || "general"; (groups[d] = groups[d] || []).push(n.id); });
  const groupKeys = Object.keys(groups);
  nodes.forEach((n) => {
    const d = n.domain || "general";
    const gi = groupKeys.indexOf(d);
    const groupAngle = (gi / groupKeys.length) * Math.PI * 2;
    const siblings = groups[d];
    const si = siblings.indexOf(n.id);
    const innerR = Math.min(W, H) * 0.15;
    const outerR = Math.min(W, H) * 0.42;
    const r = innerR + (si / Math.max(siblings.length - 1, 1)) * (outerR - innerR) * 0.6;
    const spread = (Math.PI * 2) / groupKeys.length * 0.85;
    const angle = groupAngle + (si / Math.max(siblings.length, 1) - 0.5) * spread;
    pos[n.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  // Light spring relaxation
  for (let iter = 0; iter < 15; iter++) {
    const forces: Record<string, { x: number; y: number }> = {};
    nodes.forEach(n => { forces[n.id] = { x: 0, y: 0 }; });
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const pa = pos[nodes[i].id], pb = pos[nodes[j].id];
        if (!pa || !pb) continue;
        const dx = pa.x - pb.x, dy = pa.y - pb.y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        if (dist < 50) {
          const f = (50 - dist) / dist * 0.5;
          forces[nodes[i].id].x += dx * f; forces[nodes[i].id].y += dy * f;
          forces[nodes[j].id].x -= dx * f; forces[nodes[j].id].y -= dy * f;
        }
      }
    }
    edges.forEach((e: any) => {
      const pa = pos[e.from], pb = pos[e.to];
      if (!pa || !pb) return;
      const dx = pb.x - pa.x, dy = pb.y - pa.y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const f = dist * 0.003;
      forces[e.from].x += dx * f; forces[e.from].y += dy * f;
      forces[e.to].x -= dx * f; forces[e.to].y -= dy * f;
    });
    nodes.forEach(n => {
      const p = pos[n.id];
      p.x = Math.max(20, Math.min(W - 20, p.x + forces[n.id].x));
      p.y = Math.max(20, Math.min(H - 20, p.y + forces[n.id].y));
    });
  }
  return pos;
}

export default function GraphPage() {
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[]; nodeCount: number; edgeCount: number }>({ nodes: [], edges: [], nodeCount: 0, edgeCount: 0 });
  const [loading, setLoading] = useState(true);
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({});
  const [selected, setSelected] = useState<any>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [, setLocation] = useLocation();
  const W = 1000, H = 680;

  const loadGraph = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetch("/api/hive/graph").then(r => r.json()).catch(() => ({ nodes: [], edges: [], nodeCount: 0, edgeCount: 0 }));
      setGraphData(d);
      const disp = d.nodes.slice(0, 120);
      const edgeSet = new Set(disp.map((n: any) => n.id));
      const dispEdges = d.edges.filter((e: any) => edgeSet.has(e.from) && edgeSet.has(e.to)).slice(0, 200);
      setPos(computeLayout(disp, dispEdges, W, H));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadGraph(); }, [loadGraph]);

  const displayNodes = graphData.nodes.slice(0, 120);
  const edgeSet = new Set(displayNodes.map((n: any) => n.id));
  const displayEdges = graphData.edges.filter((e: any) => edgeSet.has(e.from) && edgeSet.has(e.to)).slice(0, 200);
  const connectedSet = hovered
    ? new Set(displayEdges.filter((e: any) => e.from === hovered || e.to === hovered).flatMap((e: any) => [e.from, e.to]))
    : null;

  const onWheel = useCallback((ev: React.WheelEvent) => {
    ev.preventDefault();
    setScale(s => Math.max(0.25, Math.min(4, s * (ev.deltaY < 0 ? 1.12 : 0.9))));
  }, []);

  const onMouseDown = useCallback((ev: React.MouseEvent) => {
    if ((ev.target as SVGElement).closest("g[data-node]")) return;
    setDragging(true);
    dragStart.current = { mx: ev.clientX, my: ev.clientY, px: pan.x, py: pan.y };
  }, [pan]);

  const onMouseMove = useCallback((ev: React.MouseEvent) => {
    if (!dragging || !dragStart.current) return;
    setPan({ x: dragStart.current.px + (ev.clientX - dragStart.current.mx), y: dragStart.current.py + (ev.clientY - dragStart.current.my) });
  }, [dragging]);

  const onMouseUp = useCallback(() => { setDragging(false); dragStart.current = null; }, []);

  const goToNode = (node: any) => setLocation(`/quantapedia/${node.id}`);

  const domainKeys = [...new Set(displayNodes.map(n => n.domain || "general"))].slice(0, 8);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#020010,#04000d)", overflow: "hidden", minHeight: 0 }}>
      <div style={{ padding: "12px 18px 8px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 18, margin: 0, letterSpacing: "-0.02em" }}>Knowledge Graph</h1>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, margin: "2px 0 0" }}>
            {graphData.nodeCount} knowledge nodes · {graphData.edgeCount} resonance links · scroll to zoom · drag to pan
          </p>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <button onClick={() => setScale(s => Math.min(4, s * 1.25))} data-testid="button-zoom-in"
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ZoomIn size={13} />
          </button>
          <button onClick={() => setScale(s => Math.max(0.25, s * 0.8))} data-testid="button-zoom-out"
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ZoomOut size={13} />
          </button>
          <button onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }} data-testid="button-reset-view"
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Maximize2 size={12} />
          </button>
          <button onClick={loadGraph} data-testid="button-refresh-graph"
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, position: "relative", overflow: "hidden", margin: "0 18px 18px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "#040412" }}>
        {loading ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.18)", fontSize: 12 }}>
            Building knowledge graph from {graphData.nodeCount || "..."} nodes...
          </div>
        ) : displayNodes.length === 0 ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.15)", fontSize: 12 }}>
            No generated knowledge nodes yet — Quantapedia engine is working...
          </div>
        ) : (
          <svg ref={svgRef} style={{ width: "100%", height: "100%", cursor: dragging ? "grabbing" : "grab" }}
            viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
            onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
            <defs>
              <radialGradient id="gBg" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="#0a0818" /><stop offset="100%" stopColor="#040412" />
              </radialGradient>
              {Object.entries(DOMAIN_COLORS).map(([d, c]) => (
                <radialGradient key={d} id={`ng-${d}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={c} stopOpacity={0.9} /><stop offset="100%" stopColor={c} stopOpacity={0.4} />
                </radialGradient>
              ))}
            </defs>
            <rect width={W} height={H} fill="url(#gBg)" />
            <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`} style={{ transformOrigin: `${W/2}px ${H/2}px` }}>
              {displayEdges.map((e: any, i: number) => {
                const a = pos[e.from], b = pos[e.to];
                if (!a || !b) return null;
                const highlight = connectedSet?.has(e.from) && connectedSet?.has(e.to);
                const mx = (a.x + b.x) / 2 + (a.y - b.y) * 0.15;
                const my = (a.y + b.y) / 2 + (b.x - a.x) * 0.15;
                return (
                  <path key={i} d={`M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`} fill="none"
                    stroke={highlight ? "#818cf8" : "rgba(255,255,255,0.04)"}
                    strokeWidth={highlight ? 1.2 : 0.5} strokeOpacity={highlight ? 0.7 : 1} />
                );
              })}
              {displayNodes.map((n: any) => {
                const p = pos[n.id];
                if (!p) return null;
                const color = domainColor(n.domain);
                const r = Math.min(10, 4 + (n.views || 0) * 0.3);
                const isHov = hovered === n.id;
                const isSel = selected?.id === n.id;
                const dim = hovered && !connectedSet?.has(n.id) && hovered !== n.id;
                return (
                  <g key={n.id} data-node="1" style={{ cursor: "pointer" }}
                    onClick={() => { if (!dragging) { setSelected(n); } }}
                    onDoubleClick={() => goToNode(n)}
                    onMouseEnter={() => setHovered(n.id)}
                    onMouseLeave={() => setHovered(null)}>
                    {(isHov || isSel) && <circle cx={p.x} cy={p.y} r={r + 10} fill={color} fillOpacity={0.12} />}
                    {(isHov || isSel) && <circle cx={p.x} cy={p.y} r={r + 5} fill={color} fillOpacity={0.08} />}
                    <circle cx={p.x} cy={p.y} r={r} fill={color} fillOpacity={dim ? 0.12 : 0.85}
                      stroke={isSel ? "#fff" : isHov ? color : "transparent"} strokeWidth={isSel ? 1.5 : 1} />
                    {(isHov || isSel || (n.views || 0) > 3) && (
                      <text x={p.x} y={p.y + r + 9} textAnchor="middle" fontSize={7.5} fill="rgba(255,255,255,0.55)" fontFamily="monospace" style={{ pointerEvents: "none" }}>
                        {(n.label || n.id).slice(0, 18)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {/* Domain legend */}
        <div style={{ position: "absolute", top: 12, left: 14, display: "flex", flexDirection: "column", gap: 3 }}>
          {domainKeys.map(d => (
            <div key={d} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: domainColor(d), flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", textTransform: "capitalize" }}>{d}</span>
            </div>
          ))}
        </div>

        {/* Stats overlay */}
        <div style={{ position: "absolute", top: 12, right: 14, display: "flex", gap: 8 }}>
          {[
            { label: "NODES", value: graphData.nodeCount },
            { label: "LINKS", value: graphData.edgeCount },
          ].map(s => (
            <div key={s.label} style={{ padding: "4px 8px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
              <div style={{ color: "#a78bfa", fontWeight: 900, fontSize: 13, lineHeight: 1 }}>{s.value.toLocaleString()}</div>
              <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Selected node tooltip */}
        {selected && (
          <div style={{ position: "absolute", bottom: 14, left: 14, maxWidth: 260, borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(4,4,20,0.92)", backdropFilter: "blur(12px)", padding: "13px 15px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 13, lineHeight: 1.3, flex: 1 }}>{selected.label || selected.id}</div>
              <button onClick={() => setSelected(null)} style={{ color: "rgba(255,255,255,0.3)", marginLeft: 8, background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
              <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${domainColor(selected.domain)}20`, color: domainColor(selected.domain), fontWeight: 700 }}>{selected.domain || "general"}</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>Views: {selected.views || 0}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setLocation(`/quantapedia/${selected.id}`)} data-testid={`node-open-${selected.id}`}
                style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.1)", color: "#a78bfa", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                Open in Quantapedia →
              </button>
              <button onClick={() => setSelected(null)}
                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 10, cursor: "pointer" }}>
                Close
              </button>
            </div>
            <div style={{ marginTop: 7, color: "rgba(255,255,255,0.2)", fontSize: 9 }}>Double-click node to open directly</div>
          </div>
        )}
      </div>
    </div>
  );
}
