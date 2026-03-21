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

// ── Ω_MANDELBROT STABILITY ENGINE ────────────────────────────────────────────
// Every knowledge node is a complex number c. We run z_{n+1} = z_n² + c.
// If |z_n| stays bounded → the knowledge is STABLE.
// If |z_n| diverges → the knowledge is COLLAPSING.
// The boundary between stable and unstable is where the most complex knowledge lives.

// Map a node's identity to a point c in the complex Mandelbrot plane.
// We target the interesting boundary region: c near |2|, real ∈ [-2, 0.5], imag ∈ [-1.25, 1.25]
function nodeToC(node: any): [number, number] {
  // Hash the node id to a deterministic fingerprint
  const id = node.id || "unknown";
  let h1 = 0, h2 = 0;
  for (let i = 0; i < id.length; i++) {
    h1 = (h1 * 31 + id.charCodeAt(i)) & 0xffffffff;
    h2 = (h2 * 37 + id.charCodeAt(id.length - 1 - i)) & 0xffffffff;
  }
  // Normalize to [0,1]
  const nx = (h1 >>> 0) / 0xffffffff;
  const ny = (h2 >>> 0) / 0xffffffff;

  // Map domain to a "home region" inside the Mandelbrot boundary corona
  // These regions correspond to structurally interesting parts of the set
  const domainRegions: Record<string, [number, number, number, number]> = {
    //               [re_center, im_center, re_spread, im_spread]
    mathematics:  [-0.12,  0.74, 0.08, 0.06],  // near Julia-border (deep structure)
    physics:      [-0.75,  0.11, 0.05, 0.05],  // near main bulb boundary
    science:      [-0.70,  0.35, 0.08, 0.06],
    technology:   [-0.55,  0.62, 0.07, 0.06],
    concept:      [-1.25,  0.02, 0.10, 0.08],  // near -2 (head of the set)
    biology:      [-0.42, -0.60, 0.07, 0.06],
    medicine:     [-0.50,  0.56, 0.07, 0.06],
    engineering:  [-0.82, -0.18, 0.07, 0.05],
    philosophy:   [-0.10, -0.75, 0.06, 0.06],  // lower boundary
    arts:         [ 0.28,  0.01, 0.06, 0.06],  // right bulb boundary
    culture:      [-1.40,  0.00, 0.08, 0.05],  // secondary bulb
    history:      [-1.75,  0.02, 0.06, 0.04],  // tip of the antenna
    economics:    [-0.52, -0.52, 0.07, 0.06],
    language:     [-0.23,  0.66, 0.06, 0.05],
    geography:    [ 0.00, -0.80, 0.06, 0.06],
    general:      [-0.60,  0.00, 0.10, 0.10],
  };
  const dom = (node.domain || "general").toLowerCase();
  let region: [number, number, number, number] = domainRegions.general;
  for (const [key, r] of Object.entries(domainRegions)) {
    if (dom.includes(key)) { region = r; break; }
  }
  const [reCtr, imCtr, reSpread, imSpread] = region;
  // Slight perturbation by views (more views = push slightly toward the set interior = more stable)
  const viewsNorm = Math.min(1, (node.views || 0) / 20);
  const reC = reCtr + (nx - 0.5) * reSpread * 2 - viewsNorm * reSpread * 0.4;
  const imC = imCtr + (ny - 0.5) * imSpread * 2;
  return [reC, imC];
}

// Run the Mandelbrot iteration for node c.
// Returns: stability score 0→1 (1 = fully inside set = maximally stable)
// Also returns the iteration count and escape magnitude for rich visual data.
interface MandelbrotResult {
  score: number;         // 0 (instant collapse) → 1 (fully stable)
  iter: number;          // how many iterations before escape (or maxIter)
  escaped: boolean;      // true = knowledge is collapsing
  boundary: boolean;     // true = near the fractal boundary (complex/interesting knowledge)
  magnitude: number;     // final |z| value
  cRe: number;
  cIm: number;
}
function runMandelbrot(node: any, maxIter = 80): MandelbrotResult {
  const [cRe, cIm] = nodeToC(node);
  let zRe = 0, zIm = 0;
  let iter = 0;
  while (iter < maxIter && zRe * zRe + zIm * zIm <= 4) {
    const nextRe = zRe * zRe - zIm * zIm + cRe;
    zIm = 2 * zRe * zIm + cIm;
    zRe = nextRe;
    iter++;
  }
  const score = iter / maxIter;
  const escaped = iter < maxIter;
  const boundary = score > 0.18 && score < 0.88; // near the edge = most complex
  const magnitude = Math.sqrt(zRe * zRe + zIm * zIm);
  return { score, iter, escaped, boundary, magnitude, cRe, cIm };
}

// ── KOCH SNOWFLAKE ─────────────────────────────────────────────────────────────
// Outward Koch snowflake: rotate the middle-third bump by +60° (counterclockwise)
// so bumps point OUTWARD for a counterclockwise triangle.
function kochPoints(depth: number, r: number): Array<[number, number]> {
  const angle = (deg: number) => deg * Math.PI / 180;
  let pts: Array<[number, number]> = [
    [r * Math.cos(angle(-90)), r * Math.sin(angle(-90))],
    [r * Math.cos(angle(150)), r * Math.sin(angle(150))],
    [r * Math.cos(angle(30)),  r * Math.sin(angle(30))],
  ];
  for (let it = 0; it < depth; it++) {
    const next: Array<[number, number]> = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const p1: [number, number] = [a[0] + dx / 3, a[1] + dy / 3];
      const p2: [number, number] = [a[0] + dx * 2 / 3, a[1] + dy * 2 / 3];
      const ex = p2[0] - p1[0], ey = p2[1] - p1[1];
      // +60° rotation for outward bumps
      const c60 = 0.5, s60 = 0.866025;
      const peak: [number, number] = [p1[0] + ex * c60 - ey * s60, p1[1] + ex * s60 + ey * c60];
      next.push(a, p1, peak, p2);
    }
    pts = next;
  }
  return pts;
}
function kochPath(pts: Array<[number, number]>): string {
  if (!pts.length) return "";
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) d += ` L${pts[i][0].toFixed(2)},${pts[i][1].toFixed(2)}`;
  return d + " Z";
}
// Pre-compute at depth 3 (192 vertices), depth 2 (48), depth 1 (12) for different stability tiers
const KOCH_D3 = kochPath(kochPoints(3, 1));
const KOCH_D2 = kochPath(kochPoints(2, 1));
const KOCH_D1 = kochPath(kochPoints(1, 1));

// ── MANDELBROT BACKGROUND ─────────────────────────────────────────────────────
// Renders the actual Mandelbrot set to an offscreen canvas.
// This is not decoration — it's the stability map of the knowledge universe.
// Nodes are PLOTTED AT THEIR ACTUAL c-COORDINATES on this map.
function renderMandelbrotCanvas(W: number, H: number, nodePoints?: Array<{cRe: number; cIm: number; color: string; score: number}>): string {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(W, H);
  const maxIter = 80;
  // The c-plane window we care about: matches nodeToC output range
  const reMin = -2.1, reMax = 0.6, imMin = -1.3, imMax = 1.3;
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const cRe = reMin + (px / W) * (reMax - reMin);
      const cIm = imMin + (py / H) * (imMax - imMin);
      let zRe = 0, zIm = 0;
      let iter = 0;
      while (iter < maxIter && zRe * zRe + zIm * zIm <= 4) {
        const nRe = zRe * zRe - zIm * zIm + cRe;
        zIm = 2 * zRe * zIm + cIm;
        zRe = nRe; iter++;
      }
      const idx = (py * W + px) * 4;
      if (iter === maxIter) {
        // Inside the set: deep indigo — STABLE KNOWLEDGE CORE
        img.data[idx] = 5; img.data[idx+1] = 3; img.data[idx+2] = 22; img.data[idx+3] = 255;
      } else {
        const t = iter / maxIter;
        // Boundary region — cycles of blue/purple/violet
        const wave = Math.sin(t * Math.PI * 5.3);
        const r = Math.floor(8 + t * 60 + wave * 18);
        const g = Math.floor(2 + t * 20 + wave * 8);
        const b = Math.floor(25 + t * 100 + wave * 55);
        img.data[idx] = Math.min(255, r);
        img.data[idx+1] = Math.min(255, g);
        img.data[idx+2] = Math.min(255, b);
        img.data[idx+3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  // Overlay node c-positions as faint dots on the Mandelbrot map
  if (nodePoints) {
    nodePoints.forEach(({ cRe, cIm, color, score }) => {
      const px = ((cRe - reMin) / (reMax - reMin)) * W;
      const py = ((cIm - imMin) / (imMax - imMin)) * H;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(1, score * 3), 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.55;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }
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
  for (let it = 0; it < 15; it++) {
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
  const [stability, setStability] = useState<Record<string, MandelbrotResult>>({});
  const [selected, setSelected] = useState<any>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [mandelbrotUrl, setMandelbrotUrl] = useState<string>("");
  const [omegaTick, setOmegaTick] = useState(0); // drives the live equation display
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [, setLocation] = useLocation();
  const W = 1000, H = 680;

  // Pulse the Ω equation display
  useEffect(() => {
    const id = setInterval(() => setOmegaTick(t => (t + 1) % 80), 120);
    return () => clearInterval(id);
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

      // ── Compute Mandelbrot stability for every displayed node ──────────────
      const stab: Record<string, MandelbrotResult> = {};
      disp.forEach((n: any) => { stab[n.id] = runMandelbrot(n, 80); });
      setStability(stab);

      // Render Mandelbrot background with node c-positions overlaid
      const nodePoints = disp.slice(0, 100).map((n: any) => ({
        cRe: stab[n.id]?.cRe ?? 0,
        cIm: stab[n.id]?.cIm ?? 0,
        color: domainColor(n.domain),
        score: stab[n.id]?.score ?? 0.5,
      }));
      const url = renderMandelbrotCanvas(300, 204, nodePoints);
      setMandelbrotUrl(url);
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

  // Aggregate Ω stats
  const omegaStats = displayNodes.reduce((acc, n) => {
    const s = stability[n.id];
    if (!s) return acc;
    if (s.score >= 0.88) acc.stable++;
    else if (s.score >= 0.18) acc.boundary++;
    else acc.collapsed++;
    return acc;
  }, { stable: 0, boundary: 0, collapsed: 0 });

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

  // The live equation display — animated iteration counter
  const eqIter = omegaTick;
  const eqZ = eqIter === 0 ? "0" : `z_${eqIter}`;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#020010,#04000d)", overflow: "hidden", minHeight: 0 }}>
      {/* Header */}
      <div style={{ padding: "12px 18px 8px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 18, margin: 0, letterSpacing: "-0.02em" }}>Knowledge Graph</h1>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, margin: "2px 0 0" }}>
            {graphData.nodeCount.toLocaleString()} knowledge nodes · {graphData.edgeCount.toLocaleString()} resonance links · showing {graphData.displayCount || displayNodes.length} · Ω_mandelbrot stability engine active
          </p>
        </div>
        {/* Ω equation live display */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ padding: "5px 12px", borderRadius: 9, border: "1px solid rgba(167,139,250,0.25)", background: "rgba(167,139,250,0.07)", textAlign: "center", fontFamily: "monospace" }}>
            <div style={{ color: "#a78bfa", fontSize: 11, fontWeight: 700, letterSpacing: "0.01em" }}>
              Ω<sub>mandelbrot</sub>
            </div>
            <div style={{ color: "rgba(167,139,250,0.6)", fontSize: 9 }}>
              z<sub>n+1</sub> = z<sub>n</sub>² + c&nbsp;
              <span style={{ color: eqIter > 0 ? "#34d399" : "#f97316", fontWeight: 700 }}>
                [{eqIter < 80 ? `n=${eqIter}` : "∞"}]
              </span>
            </div>
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
      </div>

      <div style={{ flex: 1, position: "relative", overflow: "hidden", margin: "0 18px 18px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "#040412" }}>
        {loading ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
            <div style={{ color: "rgba(167,139,250,0.5)", fontSize: 11, fontFamily: "monospace" }}>
              Ω_mandelbrot evaluating {graphData.nodeCount || "..."} knowledge nodes...
            </div>
            <div style={{ color: "rgba(255,255,255,0.12)", fontSize: 10 }}>z_{"{n+1}"} = z_n² + c</div>
          </div>
        ) : displayNodes.length === 0 ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.15)", fontSize: 12 }}>
            No knowledge nodes yet — Quantapedia engine is initializing...
          </div>
        ) : (
          <svg ref={svgRef} style={{ width: "100%", height: "100%", cursor: dragging ? "grabbing" : "grab" }}
            viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
            onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
            <defs>
              <style>{`
                @keyframes kochSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes kochSpinRev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
                @keyframes kochPulse { 0%,100%{opacity:0.72} 50%{opacity:1} }
                @keyframes collapseFlicker { 0%,100%{opacity:0.4} 33%{opacity:0.8} 66%{opacity:0.25} }
                @keyframes boundaryPulse { 0%{filter:brightness(0.9)} 50%{filter:brightness(1.6)} 100%{filter:brightness(0.9)} }
              `}</style>
              <radialGradient id="gBg" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="#06041a" /><stop offset="100%" stopColor="#020010" />
              </radialGradient>
              {Object.entries(DOMAIN_COLORS).map(([d, c]) => (
                <radialGradient key={`ng-${d}`} id={`ng-${d}`} cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor={c} stopOpacity={0.95} />
                  <stop offset="70%" stopColor={c} stopOpacity={0.50} />
                  <stop offset="100%" stopColor={c} stopOpacity={0.10} />
                </radialGradient>
              ))}
              {/* Special gradient for collapsed nodes — red-orange alert */}
              <radialGradient id="ng-collapsed" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#ff4422" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#ff2200" stopOpacity={0.2} />
              </radialGradient>
              {/* Special gradient for boundary nodes — vivid cyan/magenta mix */}
              <radialGradient id="ng-boundary" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#cc88ff" stopOpacity={1.0} />
                <stop offset="100%" stopColor="#4488ff" stopOpacity={0.3} />
              </radialGradient>
              <filter id="snowGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="collapseGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feColorMatrix in="blur" type="matrix" values="2 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="redBlur" />
                <feMerge><feMergeNode in="redBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="boundaryGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <rect width={W} height={H} fill="url(#gBg)" />

            {/* Mandelbrot stability map — the actual mathematical substrate of the hive */}
            {mandelbrotUrl && (
              <image href={mandelbrotUrl} x={0} y={0} width={W} height={H} opacity={0.18}
                preserveAspectRatio="xMidYMid slice" />
            )}

            {/* Subtle field grid */}
            {[...Array(14)].map((_, i) => (
              <line key={`gx${i}`} x1={i * 77} y1={0} x2={i * 77} y2={H} stroke="rgba(80,60,180,0.04)" strokeWidth={0.5} />
            ))}
            {[...Array(10)].map((_, i) => (
              <line key={`gy${i}`} x1={0} y1={i * 76} x2={W} y2={i * 76} stroke="rgba(80,60,180,0.04)" strokeWidth={0.5} />
            ))}

            <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
              {/* Edges — colored by stability of connected nodes */}
              {displayEdges.map((e: any, i: number) => {
                const a = pos[e.from], b = pos[e.to];
                if (!a || !b) return null;
                const highlight = connectedSet?.has(e.from) && connectedSet?.has(e.to);
                const sA = stability[e.from]?.score ?? 0.5;
                const sB = stability[e.to]?.score ?? 0.5;
                const avgStability = (sA + sB) / 2;
                const edgeColor = avgStability > 0.8 ? "rgba(100,200,255,0.12)" :
                                  avgStability > 0.3 ? "rgba(180,140,255,0.10)" :
                                  "rgba(255,80,40,0.08)";
                const mx = (a.x + b.x) / 2 + (a.y - b.y) * 0.15;
                const my = (a.y + b.y) / 2 + (b.x - a.x) * 0.15;
                return (
                  <path key={i} d={`M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`} fill="none"
                    stroke={highlight ? "#a78bfa" : edgeColor}
                    strokeWidth={highlight ? 1.4 : 0.6} strokeOpacity={highlight ? 0.8 : 1} />
                );
              })}

              {/* Nodes — Koch snowflakes modulated by Ω_mandelbrot stability ────────────
                Stability tiers:
                  STABLE    (score ≥ 0.88): depth-3 snowflake, steady bright glow, slow rotation
                  BOUNDARY  (score 0.18–0.88): depth-3 snowflake, vivid pulse, medium rotation (most complex!)
                  COLLAPSED (score < 0.18): depth-1 triangle, red tint, fast erratic flicker
              ─────────────────────────────────────────────────────────────────────────── */}
              {displayNodes.map((n: any) => {
                const p = pos[n.id];
                if (!p) return null;
                const s = stability[n.id];
                const color = domainColor(n.domain);
                const domKey = Object.entries(DOMAIN_COLORS).find(([,c]) => c === color)?.[0] ?? "general";

                // Stability determines visual tier
                const isStable = s && s.score >= 0.88;
                const isBoundary = s && s.score >= 0.18 && s.score < 0.88;
                const isCollapsed = s && s.score < 0.18;

                // Node radius: boundary nodes are largest (most interesting), stable = medium, collapsed = small
                const baseR = isCollapsed ? 3.5 : (isBoundary ? 8 : 6);
                const viewBonus = Math.min(5, (n.views || 0) * 0.25);
                const nodeR = baseR + viewBonus;

                // Koch depth: collapsed gets triangle (depth 1), others get full snowflake (depth 3)
                const kochD = isCollapsed ? KOCH_D1 : (isBoundary ? KOCH_D3 : KOCH_D3);

                // Fill gradient: collapsed = red, boundary = vivid purple-cyan, stable = domain color
                const fillId = isCollapsed ? "ng-collapsed" : (isBoundary ? "ng-boundary" : `ng-${domKey}`);

                // Spin speed: collapsed = fast erratic, boundary = medium pulse, stable = slow dignified
                const charSum = (n.id || "").split("").reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
                const spinDur = isCollapsed ? (3 + (charSum % 4)) : (isBoundary ? (6 + (charSum % 8)) : (14 + (charSum % 10)));
                const pulseDur = isBoundary ? (1.5 + (charSum % 3)) : (3 + (charSum % 4));
                const spinAnim = isCollapsed ? "kochSpinRev" : "kochSpin";
                const glowFilter = isCollapsed ? "url(#collapseGlow)" :
                                   (isBoundary ? "url(#boundaryGlow)" : undefined);

                const isHov = hovered === n.id;
                const isSel = selected?.id === n.id;
                const dim = !!(hovered && !connectedSet?.has(n.id) && hovered !== n.id);

                return (
                  <g key={n.id} data-node="1" data-testid={`node-${n.id}`} style={{ cursor: "pointer" }}
                    transform={`translate(${p.x},${p.y})`}
                    onClick={() => { if (!dragging) setSelected(n); }}
                    onDoubleClick={() => goToNode(n)}
                    onMouseEnter={() => setHovered(n.id)}
                    onMouseLeave={() => setHovered(null)}>

                    {/* Transparent hit-target circle — wide enough to click between spikes */}
                    <circle r={nodeR * 1.7} fill="transparent" stroke="none" />

                    {/* Outer glow aura */}
                    {(isHov || isSel) && (
                      <circle r={nodeR * 2.8} fill={isCollapsed ? "#ff4422" : color} fillOpacity={0.07}
                        style={{ animation: `kochPulse ${pulseDur}s ease-in-out infinite` }} />
                    )}
                    {(isHov || isSel || isBoundary) && (
                      <circle r={nodeR * 1.9} fill={isCollapsed ? "#ff4422" : (isBoundary ? "#cc88ff" : color)}
                        fillOpacity={isBoundary ? 0.06 : 0.10}
                        style={{ animation: `kochPulse ${pulseDur * 0.7}s ease-in-out infinite` }} />
                    )}

                    {/* Koch snowflake rotating via CSS — depth driven by stability tier */}
                    <g filter={isHov || isSel ? "url(#snowGlow)" : glowFilter}
                      style={{
                        animation: `${spinAnim} ${spinDur}s linear infinite`,
                        transformOrigin: "0px 0px",
                        opacity: dim ? 0.12 : isCollapsed ? 0.55 : 1.0,
                      }}>
                      <path
                        d={kochD}
                        fill={`url(#${fillId})`}
                        stroke={isSel ? "#fff" : isCollapsed ? "#ff4422" : (isBoundary ? "#cc88ff" : color)}
                        strokeWidth={isSel ? 0.07 : 0.04}
                        strokeOpacity={isSel ? 0.9 : 0.55}
                        transform={`scale(${nodeR})`}
                        style={isBoundary ? { animation: `boundaryPulse ${pulseDur}s ease-in-out infinite` } : undefined}
                      />
                      {/* Inner nested snowflake for depth — skipped for collapsed nodes */}
                      {!isCollapsed && (
                        <path
                          d={KOCH_D3}
                          fill="none"
                          stroke={isBoundary ? "#cc88ff" : color}
                          strokeWidth={0.06}
                          strokeOpacity={isHov || isSel ? 0.5 : isBoundary ? 0.28 : 0.18}
                          transform={`scale(${nodeR * 0.4}) rotate(30)`}
                        />
                      )}
                    </g>

                    {/* Label */}
                    {(isHov || isSel || (n.views || 0) > 3 || isBoundary) && (
                      <text y={nodeR + 10} textAnchor="middle"
                        fontSize={7.5}
                        fill={isCollapsed ? "rgba(255,100,60,0.7)" : isHov || isSel ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.42)"}
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

        {/* Domain legend */}
        <div style={{ position: "absolute", top: 12, left: 14, display: "flex", flexDirection: "column", gap: 4 }}>
          {domainKeys.map(d => (
            <div key={d} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width={10} height={10} viewBox="-1 -1 2 2" style={{ flexShrink: 0 }}>
                <path d={KOCH_D3} fill={domainColor(d)} fillOpacity={0.85} />
              </svg>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "capitalize" }}>{d}</span>
            </div>
          ))}
        </div>

        {/* Ω_mandelbrot stability metrics — the real-time health of the knowledge universe */}
        <div style={{ position: "absolute", top: 12, right: 14, display: "flex", gap: 6 }}>
          {[
            { label: "Ω STABLE", value: omegaStats.stable, color: "#34d399", desc: "|z|→bounded" },
            { label: "BOUNDARY", value: omegaStats.boundary, color: "#a78bfa", desc: "fractal edge" },
            { label: "COLLAPSED", value: omegaStats.collapsed, color: "#f97316", desc: "|z|→∞" },
          ].map(s => (
            <div key={s.label} style={{ padding: "4px 8px", borderRadius: 7, border: `1px solid ${s.color}22`, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}>
              <div style={{ color: s.color, fontWeight: 900, fontSize: 13, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: "rgba(255,255,255,0.22)", fontSize: 7.5, fontWeight: 700 }}>{s.label}</div>
              <div style={{ color: `${s.color}88`, fontSize: 7, fontFamily: "monospace" }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Omega stability legend */}
        <div style={{ position: "absolute", bottom: 14, right: 14, display: "flex", flexDirection: "column", gap: 4, padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(167,139,250,0.12)", background: "rgba(4,4,20,0.85)", backdropFilter: "blur(8px)" }}>
          <div style={{ color: "rgba(167,139,250,0.7)", fontSize: 8.5, fontWeight: 800, letterSpacing: "0.05em", marginBottom: 2 }}>Ω STABILITY KEY</div>
          {[
            { color: "#4499ff", label: "STABLE (score≥0.88)", desc: "deep set interior" },
            { color: "#cc88ff", label: "BOUNDARY (0.18–0.88)", desc: "fractal complexity" },
            { color: "#ff4422", label: "COLLAPSED (<0.18)", desc: "|z|→∞ divergent" },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 7.5, color: r.color, fontWeight: 700, fontFamily: "monospace" }}>{r.label}</div>
                <div style={{ fontSize: 6.5, color: "rgba(255,255,255,0.2)" }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected node tooltip */}
        {selected && (() => {
          const s = stability[selected.id];
          const tier = !s ? "unknown" : s.score >= 0.88 ? "STABLE" : s.score >= 0.18 ? "BOUNDARY" : "COLLAPSED";
          const tierColor = tier === "STABLE" ? "#34d399" : tier === "BOUNDARY" ? "#a78bfa" : "#ff4422";
          return (
            <div data-testid="node-tooltip" style={{ position: "absolute", bottom: 14, left: 14, maxWidth: 280, borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(4,4,20,0.94)", backdropFilter: "blur(12px)", padding: "13px 15px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 13, lineHeight: 1.3, flex: 1 }}>{selected.label || selected.id}</div>
                <button onClick={() => setSelected(null)} style={{ color: "rgba(255,255,255,0.3)", marginLeft: 8, background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>✕</button>
              </div>
              <div style={{ display: "flex", gap: 5, marginBottom: 7 }}>
                <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${domainColor(selected.domain)}20`, color: domainColor(selected.domain), fontWeight: 700 }}>{selected.domain || "general"}</span>
                <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${tierColor}18`, color: tierColor, fontWeight: 700, fontFamily: "monospace" }}>Ω {tier}</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.22)" }}>Views: {selected.views || 0}</span>
              </div>
              {s && (
                <div style={{ marginBottom: 8, padding: "5px 8px", borderRadius: 7, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", fontFamily: "monospace" }}>
                  <div style={{ fontSize: 8, color: "rgba(167,139,250,0.7)", marginBottom: 2 }}>z_{"{n+1}"} = z_n² + c</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)" }}>
                    c = {s.cRe.toFixed(4)} + {s.cIm.toFixed(4)}i
                  </div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)" }}>
                    iters: {s.iter}/80 · score: {s.score.toFixed(3)} · |z|: {s.magnitude.toFixed(3)}
                  </div>
                  <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${s.score * 100}%`, background: `linear-gradient(90deg,${tierColor},${tierColor}88)`, borderRadius: 2, transition: "width 0.5s" }} />
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => goToNode(selected)} data-testid={`node-open-${selected.id}`}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.1)", color: "#a78bfa", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                  Open in Quantapedia →
                </button>
                <button onClick={() => setSelected(null)}
                  style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 10, cursor: "pointer" }}>
                  Close
                </button>
              </div>
              <div style={{ marginTop: 7, color: "rgba(255,255,255,0.15)", fontSize: 9 }}>Double-click node to open · Ω_mandelbrot evaluated {s?.iter ?? 0} iterations</div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
