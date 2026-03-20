import { useState, useEffect, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut, RefreshCw, Info } from "lucide-react";

const DOMAIN_COLORS: Record<string, string> = {
  science: "#34d399", technology: "#60a5fa", history: "#fb923c", mathematics: "#818cf8",
  philosophy: "#a78bfa", arts: "#f472b6", culture: "#fbbf24", geography: "#4ade80",
  economics: "#f97316", biology: "#10b981", physics: "#3b82f6", general: "#94a3b8",
};

function getDomainColor(domain: string) {
  const d = (domain || "general").toLowerCase();
  for (const [key, color] of Object.entries(DOMAIN_COLORS)) {
    if (d.includes(key)) return color;
  }
  return DOMAIN_COLORS.general;
}

function computeLayout(nodes: any[], edges: any[], w: number, h: number) {
  if (!nodes.length) return { positions: {}, computed: [] };
  const positions: Record<string, { x: number; y: number }> = {};
  const n = nodes.length;
  const cx = w / 2, cy = h / 2;
  nodes.forEach((node, i) => {
    const angle = (i / n) * Math.PI * 2;
    const r = Math.min(w, h) * 0.38;
    positions[node.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  // Simple spring relaxation
  for (let iter = 0; iter < 30; iter++) {
    const forces: Record<string, { x: number; y: number }> = {};
    nodes.forEach(n => { forces[n.id] = { x: 0, y: 0 }; });
    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const pa = positions[a.id], pb = positions[b.id];
        const dx = pa.x - pb.x, dy = pa.y - pb.y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const force = 800 / (dist * dist);
        forces[a.id].x += dx / dist * force;
        forces[a.id].y += dy / dist * force;
        forces[b.id].x -= dx / dist * force;
        forces[b.id].y -= dy / dist * force;
      }
    }
    // Attraction along edges
    edges.forEach((e: any) => {
      const pa = positions[e.from], pb = positions[e.to];
      if (!pa || !pb) return;
      const dx = pb.x - pa.x, dy = pb.y - pa.y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const force = dist * 0.015;
      forces[e.from].x += dx / dist * force;
      forces[e.from].y += dy / dist * force;
      forces[e.to].x -= dx / dist * force;
      forces[e.to].y -= dy / dist * force;
    });
    // Gravity to center
    nodes.forEach(n => {
      const p = positions[n.id];
      forces[n.id].x += (cx - p.x) * 0.01;
      forces[n.id].y += (cy - p.y) * 0.01;
    });
    // Apply
    nodes.forEach(n => {
      const p = positions[n.id];
      p.x = Math.max(30, Math.min(w - 30, p.x + forces[n.id].x * 0.5));
      p.y = Math.max(30, Math.min(h - 30, p.y + forces[n.id].y * 0.5));
    });
  }
  return { positions, computed: nodes };
}

export default function GraphPage() {
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const [layout, setLayout] = useState<{ positions: Record<string, { x: number; y: number }>; computed: any[] }>({ positions: {}, computed: [] });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const W = 900, H = 600;

  const fetchGraph = async () => {
    setLoading(true);
    const data = await fetch("/api/hive/graph").then(r => r.json()).catch(() => ({ nodes: [], edges: [] }));
    setGraphData(data);
    const displayNodes = data.nodes.slice(0, 80);
    const edgeSet = new Set(displayNodes.map((n: any) => n.id));
    const displayEdges = data.edges.filter((e: any) => edgeSet.has(e.from) && edgeSet.has(e.to)).slice(0, 150);
    setLayout(computeLayout(displayNodes, displayEdges, W, H));
    setLoading(false);
  };

  useEffect(() => { fetchGraph(); }, []);

  const displayNodes = graphData.nodes.slice(0, 80);
  const edgeSet = new Set(displayNodes.map((n: any) => n.id));
  const displayEdges = graphData.edges.filter((e: any) => edgeSet.has(e.from) && edgeSet.has(e.to)).slice(0, 150);

  const connectedToHovered = hoveredNode
    ? new Set(displayEdges.filter((e: any) => e.from === hoveredNode || e.to === hoveredNode).flatMap((e: any) => [e.from, e.to]))
    : null;

  return (
    <div className="flex-1 flex flex-col" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
      <div className="px-4 pt-5 pb-3 flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-0.5">Knowledge Graph</h1>
          <p className="text-white/30 text-sm">{graphData.nodeCount} nodes · {graphData.edgeCount} resonance links</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.min(2.5, z + 0.2))} className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:text-white"><ZoomIn size={14} /></button>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:text-white"><ZoomOut size={14} /></button>
          <button onClick={fetchGraph} className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:text-white"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative overflow-hidden mx-4 mb-4 rounded-2xl border border-white/8" style={{ background: "#04040f" }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">Building knowledge graph...</div>
        ) : displayNodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">No knowledge nodes yet — Quantapedia engine is generating...</div>
        ) : (
          <svg ref={svgRef} className="w-full h-full" viewBox={`0 0 ${W} ${H}`} style={{ transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`, transformOrigin: "center", cursor: "grab" }}>
            <defs>
              <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0a0a1f" />
                <stop offset="100%" stopColor="#04040f" />
              </radialGradient>
            </defs>
            <rect width={W} height={H} fill="url(#bg-grad)" />
            {displayEdges.map((e: any, i: number) => {
              const from = layout.positions[e.from];
              const to = layout.positions[e.to];
              if (!from || !to) return null;
              const isHighlighted = connectedToHovered?.has(e.from) && connectedToHovered?.has(e.to);
              return (
                <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={isHighlighted ? "#818cf8" : "rgba(255,255,255,0.06)"}
                  strokeWidth={isHighlighted ? 1.5 : 0.5}
                  strokeOpacity={isHighlighted ? 0.8 : 0.4} />
              );
            })}
            {displayNodes.map((node: any) => {
              const pos = layout.positions[node.id];
              if (!pos) return null;
              const color = getDomainColor(node.domain);
              const r = node.generated ? (Math.min(12, 5 + (node.views || 0) / 3)) : 4;
              const isHovered = hoveredNode === node.id;
              const isDimmed = hoveredNode && !connectedToHovered?.has(node.id);
              return (
                <g key={node.id} className="cursor-pointer" onClick={() => setSelected(node)} onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)}>
                  {isHovered && <circle cx={pos.x} cy={pos.y} r={r + 8} fill={color} fillOpacity={0.15} />}
                  <circle cx={pos.x} cy={pos.y} r={r}
                    fill={color} fillOpacity={isDimmed ? 0.15 : (node.generated ? 0.9 : 0.3)}
                    stroke={isHovered ? color : "transparent"} strokeWidth={2} />
                  {(isHovered || node.views > 5) && (
                    <text x={pos.x} y={pos.y + r + 10} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.6)" fontFamily="monospace">
                      {(node.label || node.id).slice(0, 20)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {selected && (
          <div className="absolute bottom-4 left-4 max-w-xs rounded-xl border border-white/15 bg-black/80 backdrop-blur-sm p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="font-black text-white text-sm">{selected.label || selected.id}</div>
              <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white ml-2 text-xs">✕</button>
            </div>
            <div className="text-white/40 text-[10px] mb-2">Domain: {selected.domain || "general"}</div>
            <div className="text-white/40 text-[10px] mb-3">Views: {selected.views || 0} · {selected.generated ? "✓ Generated" : "⏳ Queued"}</div>
            <a href={`/quantapedia/${selected.id}`} className="text-[10px] font-bold text-violet-400 hover:text-violet-300">Open in Quantapedia →</a>
          </div>
        )}

        <div className="absolute top-4 right-4 flex flex-col gap-1.5">
          {Object.entries(DOMAIN_COLORS).slice(0, 6).map(([domain, color]) => (
            <div key={domain} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-[9px] text-white/30 capitalize">{domain}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
