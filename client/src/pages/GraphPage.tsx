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

// ── KOCH SNOWFLAKE — true iterative fractal ───────────────────────────────────
// Returns all boundary vertices of a Koch snowflake polygon centered at (0,0).
// depth=3 gives the classic 6-pointed spike snowflake (48 vertices per edge = 192 total).
function kochPoints(depth: number, r: number): Array<[number, number]> {
  const angle = (deg: number) => deg * Math.PI / 180;
  // Start: equilateral triangle
  let pts: Array<[number, number]> = [
    [r * Math.cos(angle(-90)), r * Math.sin(angle(-90))],
    [r * Math.cos(angle(150)), r * Math.sin(angle(150))],
    [r * Math.cos(angle(30)),  r * Math.sin(angle(30))],
  ];
  for (let iter = 0; iter < depth; iter++) {
    const next: Array<[number, number]> = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const p1: [number, number] = [a[0] + dx / 3, a[1] + dy / 3];
      const p2: [number, number] = [a[0] + dx * 2 / 3, a[1] + dy * 2 / 3];
      // Apex: rotate (p2-p1) by -60 degrees and add to p1
      const ex = p2[0] - p1[0], ey = p2[1] - p1[1];
      const c60 = Math.cos(-Math.PI / 3), s60 = Math.sin(-Math.PI / 3);
      const peak: [number, number] = [p1[0] + ex * c60 - ey * s60, p1[1] + ex * s60 + ey * c60];
      next.push(a, p1, peak, p2);
    }
    pts = next;
  }
  return pts;
}

// Convert point array to SVG path string (closed polygon)
function kochPath(pts: Array<[number, number]>): string {
  if (!pts.length) return "";
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) d += ` L${pts[i][0].toFixed(2)},${pts[i][1].toFixed(2)}`;
  return d + " Z";
}

// Pre-compute Koch paths at two depths for different node sizes
const KOCH_PATH_SM = kochPath(kochPoints(3, 1)); // tiny (r=1), scaled by transform
const KOCH_PATH_LG = kochPath(kochPoints(3, 1)); // same path, bigger transform scale

// ── MANDELBROT BACKGROUND ─────────────────────────────────────────────────────
// Rendered once to a low-res offscreen canvas, embedded as SVG image.
// Deep purple/blue/indigo palette — makes the fractal nodes feel at home.
function renderMandelbrotToDataURL(W: number, H: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(W, H);
  const maxIter = 48;
  const cx = -0.65, cy = 0.0, zoom = 2.8;
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      let zr = 0, zi = 0;
      const cr = cx + (px / W - 0.5) * zoom * (W / H);
      const ci = cy + (py / H - 0.5) * zoom;
      let iter = 0;
      while (zr * zr + zi * zi < 4 && iter < maxIter) {
        const tmp = zr * zr - zi * zi + cr;
        zi = 2 * zr * zi + ci; zr = tmp; iter++;
      }
      const idx = (py * W + px) * 4;
      if (iter === maxIter) {
        img.data[idx] = 2; img.data[idx+1] = 2; img.data[idx+2] = 12; img.data[idx+3] = 255;
      } else {
        const t = iter / maxIter;
        // Purple → deep blue → indigo palette
        const r = Math.floor(t < 0.5 ? t * 2 * 40 : (1 - t) * 2 * 35 + 5);
        const g = Math.floor(t * t * 18);
        const b = Math.floor(20 + t * 55 + Math.sin(t * Math.PI * 6) * 35);
        img.data[idx] = r; img.data[idx+1] = g; img.data[idx+2] = b; img.data[idx+3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}

// ── LAYOUT ────────────────────────────────────────────────────────────────────
function computeLayout(nodes: any[], edges: any[], W: number, H: number) {
  if (!nodes.length) return {};
  const pos: Record<string, { x: number; y: number }> = {};
  const cx = W / 2, cy = H / 2;
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

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function GraphPage() {
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[]; nodeCount: number; edgeCount: number; displayCount: number }>({ nodes: [], edges: [], nodeCount: 0, edgeCount: 0, displayCount: 0 });
  const [loading, setLoading] = useState(true);
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({});
  const [selected, setSelected] = useState<any>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [mandelbrotUrl, setMandelbrotUrl] = useState<string>("");
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [, setLocation] = useLocation();
  const W = 1000, H = 680;

  // Render Mandelbrot background once
  useEffect(() => {
    const url = renderMandelbrotToDataURL(200, 136);
    setMandelbrotUrl(url);
  }, []);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetch("/api/hive/graph?limit=300").then(r => r.json()).catch(() => ({ nodes: [], edges: [], nodeCount: 0, edgeCount: 0, displayCount: 0 }));
      setGraphData(d);
      const disp = d.nodes.slice(0, 300);
      const edgeSet = new Set(disp.map((n: any) => n.id));
      const dispEdges = d.edges.filter((e: any) => edgeSet.has(e.from) && edgeSet.has(e.to)).slice(0, 600);
      setPos(computeLayout(disp, dispEdges, W, H));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadGraph();
    const interval = setInterval(loadGraph, 20000);
    return () => clearInterval(interval);
  }, [loadGraph]);

  const displayNodes = graphData.nodes.slice(0, 300);
  const edgeSet = new Set(displayNodes.map((n: any) => n.id));
  const displayEdges = graphData.edges.filter((e: any) => edgeSet.has(e.from) && edgeSet.has(e.to)).slice(0, 600);
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
      {/* Header */}
      <div style={{ padding: "12px 18px 8px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 18, margin: 0, letterSpacing: "-0.02em" }}>Knowledge Graph</h1>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, margin: "2px 0 0" }}>
            {graphData.nodeCount.toLocaleString()} knowledge nodes · {graphData.edgeCount.toLocaleString()} resonance links · showing {graphData.displayCount || displayNodes.length} · live · auto-updates
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
              <style>{`
                @keyframes kochSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes kochPulse { 0%,100% { opacity:0.72; } 50% { opacity:1; } }
                @keyframes kochGlow { 0%,100% { filter:brightness(1); } 50% { filter:brightness(1.6); } }
                @keyframes snowFlicker { 0%,100%{opacity:0.5} 50%{opacity:0.85} }
              `}</style>
              <radialGradient id="gBg" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="#06041a" /><stop offset="100%" stopColor="#020010" />
              </radialGradient>
              {/* Per-domain radial gradients for snowflake fill */}
              {Object.entries(DOMAIN_COLORS).map(([d, c]) => (
                <radialGradient key={d} id={`ng-${d}`} cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor={c} stopOpacity={0.95} />
                  <stop offset="60%" stopColor={c} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={c} stopOpacity={0.15} />
                </radialGradient>
              ))}
              {/* Glow filter for hovered/selected nodes */}
              <filter id="snowGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="snowGlowSm" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Background: flat dark fill */}
            <rect width={W} height={H} fill="url(#gBg)" />

            {/* Mandelbrot-inspired fractal background — faint purple/blue wash */}
            {mandelbrotUrl && (
              <image href={mandelbrotUrl} x={0} y={0} width={W} height={H} opacity={0.14}
                preserveAspectRatio="xMidYMid slice" />
            )}

            {/* Subtle grid lines for depth */}
            {[...Array(14)].map((_, i) => (
              <line key={`gx${i}`} x1={i * 77} y1={0} x2={i * 77} y2={H}
                stroke="rgba(100,80,200,0.04)" strokeWidth={0.5} />
            ))}
            {[...Array(10)].map((_, i) => (
              <line key={`gy${i}`} x1={0} y1={i * 76} x2={W} y2={i * 76}
                stroke="rgba(100,80,200,0.04)" strokeWidth={0.5} />
            ))}

            <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`} style={{ transformOrigin: `${W/2}px ${H/2}px` }}>
              {/* Edges — curved bezier lines */}
              {displayEdges.map((e: any, i: number) => {
                const a = pos[e.from], b = pos[e.to];
                if (!a || !b) return null;
                const highlight = connectedSet?.has(e.from) && connectedSet?.has(e.to);
                const mx = (a.x + b.x) / 2 + (a.y - b.y) * 0.15;
                const my = (a.y + b.y) / 2 + (b.x - a.x) * 0.15;
                return (
                  <path key={i} d={`M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`} fill="none"
                    stroke={highlight ? "#818cf8" : "rgba(180,160,255,0.06)"}
                    strokeWidth={highlight ? 1.3 : 0.6} strokeOpacity={highlight ? 0.75 : 1} />
                );
              })}

              {/* Nodes — Koch fractal snowflakes */}
              {displayNodes.map((n: any) => {
                const p = pos[n.id];
                if (!p) return null;
                const color = domainColor(n.domain);
                const domKey = Object.entries(DOMAIN_COLORS).find(([,c]) => c === color)?.[0] ?? "general";

                // Node size: base 5px + view bonus, capped at 14
                const nodeR = Math.min(14, 5 + (n.views || 0) * 0.3);
                const isHov = hovered === n.id;
                const isSel = selected?.id === n.id;
                const dim = !!(hovered && !connectedSet?.has(n.id) && hovered !== n.id);

                // Animation: each node gets a slightly different spin speed based on id hash
                const charSum = n.id.split("").reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
                const spinDur = 8 + (charSum % 14); // 8–22 seconds
                const pulseDur = 2.5 + (charSum % 4); // 2.5–6.5 seconds

                return (
                  <g key={n.id} data-node="1" data-testid={`node-${n.id}`} style={{ cursor: "pointer" }}
                    transform={`translate(${p.x},${p.y})`}
                    onClick={() => { if (!dragging) setSelected(n); }}
                    onDoubleClick={() => goToNode(n)}
                    onMouseEnter={() => setHovered(n.id)}
                    onMouseLeave={() => setHovered(null)}>

                    {/* Transparent hit area — ensures click events land even between snowflake spikes */}
                    <circle r={nodeR * 1.6} fill="transparent" stroke="none" />

                    {/* Outer glow aura (only when hovered or selected) */}
                    {(isHov || isSel) && (
                      <circle r={nodeR * 2.8} fill={color} fillOpacity={0.08}
                        style={{ animation: `kochPulse ${pulseDur}s ease-in-out infinite` }} />
                    )}
                    {(isHov || isSel) && (
                      <circle r={nodeR * 1.9} fill={color} fillOpacity={0.12}
                        style={{ animation: `kochPulse ${pulseDur * 0.7}s ease-in-out infinite` }} />
                    )}

                    {/* Koch snowflake — rotates continuously via CSS animation */}
                    <g filter={isHov || isSel ? "url(#snowGlow)" : undefined}
                      style={{
                        animation: `kochSpin ${spinDur}s linear infinite`,
                        transformOrigin: "0px 0px",
                        opacity: dim ? 0.14 : isHov || isSel ? 1.0 : 0.82,
                      }}>
                      {/* Snowflake fill — KOCH_PATH_SM is at r=1, scaled to nodeR */}
                      <path
                        d={KOCH_PATH_SM}
                        fill={`url(#ng-${domKey})`}
                        stroke={isSel ? "#fff" : color}
                        strokeWidth={isSel ? 0.06 : 0.04}
                        strokeOpacity={isSel ? 0.9 : 0.55}
                        transform={`scale(${nodeR})`}
                        style={{ animation: `kochGlow ${pulseDur}s ease-in-out infinite` }}
                      />
                      {/* Inner smaller snowflake at 42% scale — nested fractal look */}
                      <path
                        d={KOCH_PATH_SM}
                        fill="none"
                        stroke={color}
                        strokeWidth={0.06}
                        strokeOpacity={isHov || isSel ? 0.55 : 0.22}
                        transform={`scale(${nodeR * 0.42}) rotate(30)`}
                      />
                    </g>

                    {/* Label — show on hover, select, or popular nodes */}
                    {(isHov || isSel || (n.views || 0) > 3) && (
                      <text y={nodeR + 10} textAnchor="middle"
                        fontSize={7.5} fill={isHov || isSel ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)"}
                        fontFamily="monospace" style={{ pointerEvents: "none" }}>
                        {(n.label || n.id).slice(0, 20)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {/* Domain legend — with Koch snowflake icons instead of dots */}
        <div style={{ position: "absolute", top: 12, left: 14, display: "flex", flexDirection: "column", gap: 4 }}>
          {domainKeys.map(d => (
            <div key={d} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width={10} height={10} viewBox="-1 -1 2 2" style={{ flexShrink: 0 }}>
                <path d={KOCH_PATH_SM} fill={domainColor(d)} fillOpacity={0.85}
                  stroke={domainColor(d)} strokeWidth={0.03} />
              </svg>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "capitalize" }}>{d}</span>
            </div>
          ))}
        </div>

        {/* Stats overlay */}
        <div style={{ position: "absolute", top: 12, right: 14, display: "flex", gap: 8 }}>
          {[
            { label: "TOTAL", value: graphData.nodeCount },
            { label: "SHOWN", value: graphData.displayCount || displayNodes.length },
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
          <div data-testid="node-tooltip" style={{ position: "absolute", bottom: 14, left: 14, maxWidth: 260, borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(4,4,20,0.92)", backdropFilter: "blur(12px)", padding: "13px 15px" }}>
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
