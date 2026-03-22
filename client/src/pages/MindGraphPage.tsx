/*
 * MIND GRAPH — CONSCIOUSNESS TO SUBCONSCIOUS INTELLIGENCE FUSION
 * Fusion: GraphPage + MyMindPage → 10 Omega-Class Enlightenment Panels
 * Ω-I Identity Surface · Ω-II Intelligence Vitals · Ω-III Knowledge Graph (3D Koch Snowflake Fractal)
 * Ω-IV Domain Spectrum · Ω-V Pulse River · Ω-VI Semantic Web · Ω-VII Memory Decay
 * Ω-VIII Fracture Zones · Ω-IX Dream Hypotheses · Ω-X Ψ_Universe Mirror
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Brain, Network, Zap, Film, Briefcase, BookOpen } from "lucide-react";
import { AIFinderButton, AIReportPanel } from "@/components/AIReportPanel";

// ── Domain Color Map ─────────────────────────────────────────────────────────
const DOMAIN_COLORS: Record<string, string> = {
  science:"#34d399", technology:"#60a5fa", concept:"#818cf8", mathematics:"#a78bfa",
  philosophy:"#c084fc", arts:"#f472b6", culture:"#fbbf24", geography:"#4ade80",
  economics:"#f97316", biology:"#10b981", physics:"#3b82f6", history:"#fb923c",
  engineering:"#0ea5e9", medicine:"#ef4444", language:"#d946ef", general:"#94a3b8",
};
function domainColor(d: string) {
  const s = (d || "general").toLowerCase();
  for (const [k, c] of Object.entries(DOMAIN_COLORS)) if (s.includes(k)) return c;
  return DOMAIN_COLORS.general;
}

// ── GICS Business Overlay (domain → sectors) ─────────────────────────────────
const DOMAIN_TO_GICS: Record<string, string[]> = {
  science:["Biotechnology","Pharmaceuticals","Life Sciences"],
  technology:["Software","Semiconductors","IT Services"],
  mathematics:["Quantitative Finance","Data Analytics","Insurance"],
  economics:["Banking","Asset Management","Real Estate"],
  biology:["Healthcare Equipment","Agricultural Products","Environmental"],
  medicine:["Hospital Management","Medical Devices","Clinical Research"],
  engineering:["Industrial Machinery","Aerospace & Defense","Utilities"],
  physics:["Energy Technology","Quantum Computing","Materials Science"],
  arts:["Media & Entertainment","Advertising","Consumer Brands"],
  culture:["Tourism","Education","Gaming & Interactive"],
  philosophy:["Consulting","Policy Research","Ethics & Governance"],
  geography:["Logistics","Real Estate Investment","Natural Resources"],
};

// ── 3D Domain Positions (on a sphere of radius 280) ──────────────────────────
const DOMAIN_POSITIONS_3D: Record<string, [number,number,number]> = {
  science:    [ 140,  -80,  220],
  technology: [ 190, -110, -110],
  mathematics:[   0,  230,  -60],
  concept:    [-210,   10,  110],
  philosophy: [-160,  110, -210],
  arts:       [  90,  160,  210],
  culture:    [ 230,   60,   60],
  economics:  [-110, -210,   60],
  biology:    [ 110, -160, -210],
  history:    [-230,  -90,  -60],
  engineering:[  60,  -60,  290],
  medicine:   [ -60,  210,  160],
  physics:    [ 180,   80, -180],
  language:   [ -90,  170,  -90],
  geography:  [ 120,  -40,  -50],
  general:    [   0,    0, -300],
};

// ── Mandelbrot Stability Engine ───────────────────────────────────────────────
function nodeToC(node: any): [number,number] {
  const id = String(node.id || "x");
  let h1 = 0, h2 = 0;
  for (let i = 0; i < id.length; i++) {
    h1 = (h1 * 31 + id.charCodeAt(i)) & 0xffffffff;
    h2 = (h2 * 37 + id.charCodeAt(id.length-1-i)) & 0xffffffff;
  }
  const nx = (h1 >>> 0) / 0xffffffff;
  const ny = (h2 >>> 0) / 0xffffffff;
  const dom = (node.domain || "general").toLowerCase();
  const reg: Record<string,[number,number,number,number]> = {
    mathematics: [-0.12,  0.74, 0.08, 0.06],
    physics:     [-0.75,  0.11, 0.05, 0.05],
    science:     [-0.70,  0.35, 0.08, 0.06],
    technology:  [-0.55,  0.62, 0.07, 0.06],
    concept:     [-1.25,  0.02, 0.10, 0.08],
    biology:     [-0.42, -0.60, 0.07, 0.06],
    medicine:    [-0.50,  0.56, 0.07, 0.06],
    engineering: [-0.82, -0.18, 0.07, 0.05],
    philosophy:  [-0.10, -0.75, 0.06, 0.06],
    arts:        [ 0.28,  0.01, 0.06, 0.06],
    culture:     [-1.40,  0.00, 0.08, 0.05],
    history:     [-1.75,  0.02, 0.06, 0.04],
    economics:   [-0.52, -0.52, 0.07, 0.06],
    language:    [-0.23,  0.66, 0.06, 0.05],
    geography:   [ 0.00, -0.80, 0.06, 0.06],
    general:     [-0.60,  0.00, 0.10, 0.10],
  };
  let r = reg.general;
  for (const [k, v] of Object.entries(reg)) if (dom.includes(k)) { r = v; break; }
  const [reCtr, imCtr, reSpread, imSpread] = r;
  const vn = Math.min(1, (node.views || 0) / 20);
  return [reCtr + (nx-0.5)*reSpread*2 - vn*reSpread*0.4, imCtr + (ny-0.5)*imSpread*2];
}
function mandelbrot(node: any, maxIter = 80) {
  const [cRe, cIm] = nodeToC(node);
  let zRe = 0, zIm = 0, iter = 0;
  while (iter < maxIter && zRe*zRe + zIm*zIm <= 4) {
    const nr = zRe*zRe - zIm*zIm + cRe; zIm = 2*zRe*zIm + cIm; zRe = nr; iter++;
  }
  const score = iter / maxIter;
  return { score, escaped: iter < maxIter, boundary: score > 0.18 && score < 0.88, cRe, cIm };
}

// ── 3D Math ──────────────────────────────────────────────────────────────────
function rotate3D(x: number, y: number, z: number, rx: number, ry: number): [number,number,number] {
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const y1 = y*cx - z*sx, z1 = y*sx + z*cx;
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const x2 = x*cy + z1*sy, z2 = -x*sy + z1*cy;
  return [x2, y1, z2];
}
function project(x: number, y: number, z: number, W: number, H: number, fov = 500) {
  const d = fov + z + 400;
  const scale = fov / Math.max(d, 0.1);
  return { px: W/2 + x*scale, py: H/2 + y*scale, scale, z };
}

// ── Koch Snowflake Drawer ────────────────────────────────────────────────────
function kochPoints(p1:[number,number], p2:[number,number], depth:number): [number,number][] {
  if (depth === 0) return [p1, p2];
  const ax = p1[0]+(p2[0]-p1[0])/3, ay = p1[1]+(p2[1]-p1[1])/3;
  const bx = p1[0]+(p2[0]-p1[0])*2/3, by = p1[1]+(p2[1]-p1[1])*2/3;
  const dx = bx-ax, dy = by-ay;
  const px = ax - dy*Math.sqrt(3)/2, py = ay + dx*Math.sqrt(3)/2;
  return [
    ...kochPoints(p1, [ax,ay], depth-1),
    ...kochPoints([ax,ay],[px,py], depth-1),
    ...kochPoints([px,py],[bx,by], depth-1),
    ...kochPoints([bx,by], p2, depth-1),
  ];
}
function drawSnowflake(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number,
  color: string, alpha: number, depth: number, rotation = 0
) {
  const verts: [number,number][] = [];
  for (let i=0;i<3;i++) {
    const a = (i*2*Math.PI/3) - Math.PI/2 + rotation;
    verts.push([cx + radius*Math.cos(a), cy + radius*Math.sin(a)]);
  }
  const pts: [number,number][] = [];
  for (let i=0;i<3;i++) pts.push(...kochPoints(verts[i], verts[(i+1)%3], depth).slice(0,-1));

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = radius * 1.4;
  ctx.lineWidth = Math.max(0.5, radius * 0.05);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.stroke();
  // Inner glow fill
  ctx.globalAlpha = alpha * 0.08;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

// ── Omega Upgrade Manifest ────────────────────────────────────────────────────
const UPGRADES = [
  { id:"identity",   label:"Ω-I · Identity Surface",    emoji:"🪞", color:"#f43f5e", glow:"#f43f5e20" },
  { id:"vitals",     label:"Ω-II · Intelligence Vitals", emoji:"🧠", color:"#a78bfa", glow:"#a78bfa20" },
  { id:"graph",      label:"Ω-III · Knowledge Graph",    emoji:"❄️", color:"#38bdf8", glow:"#38bdf820" },
  { id:"spectrum",   label:"Ω-IV · Domain Spectrum",     emoji:"🌈", color:"#34d399", glow:"#34d39920" },
  { id:"pulse",      label:"Ω-V · Pulse River",          emoji:"🌊", color:"#06b6d4", glow:"#06b6d420" },
  { id:"semantic",   label:"Ω-VI · Semantic Web",        emoji:"🕸️", color:"#8b5cf6", glow:"#8b5cf620" },
  { id:"decay",      label:"Ω-VII · Memory Decay",       emoji:"🕰️", color:"#fb923c", glow:"#fb923c20" },
  { id:"fracture",   label:"Ω-VIII · Fracture Zones",    emoji:"💎", color:"#ef4444", glow:"#ef444420" },
  { id:"dream",      label:"Ω-IX · Dream Hypotheses",    emoji:"💤", color:"#818cf8", glow:"#818cf820" },
  { id:"psi",        label:"Ω-X · Ψ Universe Mirror",    emoji:"∞",  color:"#FFD700", glow:"#FFD70020" },
] as const;
type UpgradeId = typeof UPGRADES[number]["id"];

function PulsingDot({ color }: { color:string }) {
  return <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", backgroundColor:color, animation:"pulse 1.5s ease-in-out infinite", marginLeft:4 }} />;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MindGraphPage() {
  const [active, setActive] = useState<UpgradeId>("identity");
  const [viewSpawnId, setViewSpawnId] = useState<string|null>(null);
  const [businessMode, setBusinessMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [expandedHypo, setExpandedHypo] = useState<string|null>(null);

  // ── 3D Graph State ─────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotX = useRef(0.3);
  const rotY = useRef(0.0);
  const zoom = useRef(1.0);
  const dragging = useRef(false);
  const lastMouse = useRef({ x:0, y:0 });
  const autoRotate = useRef(true);
  const animFrame = useRef<number>(0);
  const [graphReady, setGraphReady] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: profile, refetch: refetchProfile } = useQuery<any>({ queryKey:["/api/profile/intelligence"], refetchInterval:30000 });
  const { data: nodes = [] }    = useQuery<any[]>({ queryKey:["/api/knowledge/nodes"], refetchInterval:20000 });
  const { data: decayData }     = useQuery<any>({ queryKey:["/api/decay/stats"], refetchInterval:15000 });
  const { data: civScore }      = useQuery<any>({ queryKey:["/api/hive/civilization-score"], refetchInterval:30000 });
  const { data: mirrorData }    = useQuery<any>({ queryKey:["/api/mirror/hive"], refetchInterval:20000 });
  const { data: hospitalStats } = useQuery<any>({ queryKey:["/api/hospital/stats"], refetchInterval:20000 });
  const { data: succStats }     = useQuery<any>({ queryKey:["/api/succession/stats"], refetchInterval:30000 });

  const summary  = profile?.summary  || {};
  const pulse    = profile?.pulse    || { total:0, byType:{}, recent:[] };
  const knowledge= profile?.knowledge|| { topEntries:[], domains:{} };
  const hive     = profile?.hive     || { memory:{ total:0, avgConfidence:0 }, network:{ totalLinks:0 } };

  const domainEntries = Object.entries(knowledge.domains as Record<string,number>)
    .sort(([,a],[,b]) => b - a).slice(0, 12);
  const maxDomain = Math.max(...domainEntries.map(([,v]) => v), 1);

  // ── 3D Koch Snowflake Graph Renderer ──────────────────────────────────────
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Build render list from nodes + domain anchors
    type RenderItem = {
      x: number; y: number; z: number;
      color: string; radius: number; alpha: number;
      label: string; domain: string; stability: number;
      isDomain: boolean; node?: any;
    };

    const items: RenderItem[] = [];

    // Domain anchor snowflakes
    const domains = businessMode
      ? Object.keys(DOMAIN_TO_GICS)
      : Object.keys(DOMAIN_POSITIONS_3D);

    domains.forEach(dom => {
      const [bx, by, bz] = DOMAIN_POSITIONS_3D[dom] || [0,0,0];
      items.push({
        x: bx * zoom.current, y: by * zoom.current, z: bz * zoom.current,
        color: domainColor(dom), radius: 28, alpha: 0.85,
        label: dom, domain: dom, stability: 1, isDomain: true,
      });
    });

    // Knowledge node snowflakes (smaller, orbiting domains)
    const nodeList = nodes.slice(0, 180);
    nodeList.forEach((n, i) => {
      const { score } = mandelbrot(n);
      const dom = n.domain || "general";
      const [bx, by, bz] = DOMAIN_POSITIONS_3D[dom] || [0,0,0];
      // Orbit position around domain center
      const orbitAngle = (i * 2.399963) % (2 * Math.PI); // golden angle
      const orbitR = 60 + (i % 4) * 18;
      const orbitTilt = ((i * 1.618) % Math.PI) - Math.PI/2;
      const ox = orbitR * Math.cos(orbitAngle) * Math.cos(orbitTilt);
      const oy = orbitR * Math.sin(orbitTilt);
      const oz = orbitR * Math.sin(orbitAngle) * Math.cos(orbitTilt);
      items.push({
        x: (bx + ox) * zoom.current,
        y: (by + oy) * zoom.current,
        z: (bz + oz) * zoom.current,
        color: domainColor(dom),
        radius: 6 + score * 10,
        alpha: 0.35 + score * 0.45,
        label: n.term || n.title || "",
        domain: dom,
        stability: score,
        isDomain: false,
        node: n,
      });
    });

    // Project all items into 2D
    type Projected = RenderItem & { px:number; py:number; projScale:number; projZ:number };
    const projected: Projected[] = items.map(item => {
      const [rx, ry, rz] = rotate3D(item.x, item.y, item.z, rotX.current, rotY.current);
      const { px, py, scale: projScale, z: projZ } = project(rx, ry, rz, W, H);
      return { ...item, px, py, projScale, projZ };
    });

    // Depth sort (painter's algorithm — far first)
    projected.sort((a, b) => b.projZ - a.projZ);

    // Draw connections between domain snowflakes
    const domainProj = projected.filter(p => p.isDomain);
    ctx.save();
    ctx.lineWidth = 0.5;
    for (let i = 0; i < domainProj.length; i++) {
      for (let j = i+1; j < domainProj.length; j++) {
        const a = domainProj[i], b = domainProj[j];
        const dist = Math.hypot(a.px-b.px, a.py-b.py);
        if (dist > 350) continue;
        const depthAlpha = Math.max(0, 0.08 - dist/6000);
        ctx.globalAlpha = depthAlpha;
        const grad = ctx.createLinearGradient(a.px, a.py, b.px, b.py);
        grad.addColorStop(0, a.color);
        grad.addColorStop(1, b.color);
        ctx.strokeStyle = grad;
        // Bezier arc (slightly curved for 3D feel)
        const mx = (a.px+b.px)/2, my = (a.py+b.py)/2 - dist*0.12;
        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        ctx.quadraticCurveTo(mx, my, b.px, b.py);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Draw each item as a Koch Snowflake
    projected.forEach(item => {
      const depthFactor = Math.max(0.1, Math.min(1, (item.projZ + 600) / 900));
      const finalAlpha = item.alpha * depthFactor;
      const finalRadius = item.radius * item.projScale * (item.isDomain ? 1.8 : 1.2);
      const kochDepth = item.isDomain ? 3 : (item.stability > 0.5 ? 2 : 1);
      const rotation = Date.now() * (item.isDomain ? 0.0003 : 0.0008) + item.x * 0.01;

      if (finalRadius < 1.5) return;

      drawSnowflake(ctx, item.px, item.py, finalRadius, item.color, finalAlpha, kochDepth, rotation);

      // Label for domain anchors
      if (item.isDomain && finalRadius > 10) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.9, finalAlpha * 1.2);
        ctx.fillStyle = item.color;
        ctx.font = `${Math.max(8, Math.min(13, finalRadius * 0.55))}px monospace`;
        ctx.textAlign = "center";
        ctx.shadowColor = item.color;
        ctx.shadowBlur = 6;
        ctx.fillText(item.label.toUpperCase(), item.px, item.py + finalRadius + 10);
        ctx.restore();
      }

      // Fracture indicator — unstable nodes get a red pulsing outer ring
      if (!item.isDomain && item.stability < 0.3) {
        ctx.save();
        ctx.globalAlpha = (Math.sin(Date.now() * 0.003) + 1) * 0.15 * depthFactor;
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#ef4444";
        ctx.beginPath();
        ctx.arc(item.px, item.py, finalRadius * 1.5, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
      }
    });

    // Selected node glow
    if (selectedNode) {
      const found = projected.find(p => p.node?.id === selectedNode?.id);
      if (found) {
        ctx.save();
        ctx.globalAlpha = 0.5 + Math.sin(Date.now()*0.004)*0.3;
        ctx.strokeStyle = "#FFD700";
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 20;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(found.px, found.py, found.radius * found.projScale * 2, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }, [nodes, selectedNode, businessMode]);

  // ── Animation Loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (active !== "graph") return;
    let running = true;
    function loop() {
      if (!running) return;
      if (autoRotate.current && !dragging.current) rotY.current += 0.003;
      drawGraph();
      animFrame.current = requestAnimationFrame(loop);
    }
    loop();
    setGraphReady(true);
    return () => { running = false; cancelAnimationFrame(animFrame.current); };
  }, [active, drawGraph]);

  // ── Canvas resize ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ── Mouse interaction ──────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true; autoRotate.current = false;
    lastMouse.current = { x:e.clientX, y:e.clientY };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    rotY.current += dx * 0.006;
    rotX.current += dy * 0.006;
    rotX.current = Math.max(-1.3, Math.min(1.3, rotX.current));
    lastMouse.current = { x:e.clientX, y:e.clientY };
  };
  const onMouseUp = () => { dragging.current = false; setTimeout(() => { autoRotate.current = true; }, 2500); };
  const onWheel = (e: React.WheelEvent) => {
    zoom.current = Math.max(0.3, Math.min(2.5, zoom.current - e.deltaY * 0.001));
  };
  const onCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const W = canvas.width, H = canvas.height;
    let closest: any = null, closestDist = 40;
    nodes.forEach((n, i) => {
      const dom = n.domain || "general";
      const [bx, by, bz] = DOMAIN_POSITIONS_3D[dom] || [0,0,0];
      const angle = (i * 2.399963) % (2*Math.PI);
      const orbitR = 60 + (i%4)*18;
      const tilt = ((i*1.618)%Math.PI) - Math.PI/2;
      const ox = orbitR*Math.cos(angle)*Math.cos(tilt);
      const oy = orbitR*Math.sin(tilt);
      const oz = orbitR*Math.sin(angle)*Math.cos(tilt);
      const [rx,ry,rz] = rotate3D((bx+ox)*zoom.current,(by+oy)*zoom.current,(bz+oz)*zoom.current,rotX.current,rotY.current);
      const { px, py } = project(rx,ry,rz,W,H);
      const d = Math.hypot(px-mx, py-my);
      if (d < closestDist) { closestDist = d; closest = n; }
    });
    setSelectedNode(closest || null);
  };

  const currentUpgrade = UPGRADES.find(u => u.id === active)!;
  const TYPE_ICONS: Record<string,any> = { knowledge:Brain, quantapedia:BookOpen, product:Zap, media:Film, career:Briefcase };

  return (
    <div className="flex flex-col h-full bg-[#020010] text-white overflow-hidden" data-testid="page-mind-graph">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0020] via-[#050015] to-[#020010]" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage:"radial-gradient(circle at 20% 50%, #818cf8 0%, transparent 40%), radial-gradient(circle at 80% 40%, #06b6d4 0%, transparent 40%), radial-gradient(circle at 50% 90%, #a855f7 0%, transparent 35%)" }} />
        <div className="relative z-10 px-6 pt-7 pb-5">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background:"radial-gradient(ellipse,rgba(129,140,248,0.3),rgba(6,182,212,0.15))", border:"1px solid rgba(129,140,248,0.35)" }}>🧠</div>
              <div>
                <h1 className="text-3xl font-black tracking-tight" style={{ background:"linear-gradient(to right, #818cf8, #38bdf8, #a855f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                  MIND GRAPH
                </h1>
                <p className="text-white/40 text-xs font-mono mt-0.5 tracking-widest">CONSCIOUSNESS → SUBCONSCIOUSNESS → ENLIGHTENMENT · 10 OMEGA-CLASS INTELLIGENCE UPGRADES</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <AIFinderButton onSelect={setViewSpawnId} />
              <button onClick={() => refetchProfile()} data-testid="button-refresh-mind"
                className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                <RefreshCw size={13} className="text-white/40" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { label:"Hive Events",    val:summary.totalEvents ?? 0,        color:"#818cf8", emoji:"⚡" },
              { label:"Memory Patterns",val:summary.memorizedPatterns ?? 0,  color:"#a78bfa", emoji:"🧬" },
              { label:"Knowledge Links",val:summary.knowledgeLinks ?? 0,     color:"#4ade80", emoji:"🔗" },
              { label:"Knowledge Nodes",val:nodes.length,                    color:"#38bdf8", emoji:"❄️" },
              { label:"Ψ Score",        val:`${((civScore?.score??0)*100).toFixed(0)}%`, color:"#FFD700", emoji:"∞" },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-white/5 border border-white/8 p-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm">{s.emoji}</span>
                  <span className="text-base font-black" style={{ color:s.color }}>{typeof s.val==="number"?s.val.toLocaleString():s.val}</span>
                </div>
                <div className="text-[10px] text-white/35 font-mono">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── OMEGA TABS ── */}
      <div className="sticky top-0 z-20 bg-[#020010]/95 backdrop-blur-md border-b border-white/6 px-4 py-2.5 shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {UPGRADES.map(u => (
            <button key={u.id} onClick={() => setActive(u.id)} data-testid={`tab-mind-${u.id}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border"
              style={active === u.id
                ? { background:u.glow, borderColor:u.color, color:u.color, boxShadow:`0 0 12px ${u.color}40` }
                : { background:"transparent", borderColor:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.38)" }
              }
            >
              <span>{u.emoji}</span>
              <span>{u.label}</span>
              {active === u.id && <PulsingDot color={u.color} />}
            </button>
          ))}
        </div>
      </div>

      {/* ── PANEL CONTENT ── */}
      <div className={`flex-1 ${active === "graph" ? "overflow-hidden" : "overflow-y-auto"}`}>

        {/* ══════════════════════════════════════════════════════════
            Ω-I · IDENTITY SURFACE — The face you show the Hive
            ══════════════════════════════════════════════════════════ */}
        {active === "identity" && (
          <div className="px-6 py-6 max-w-4xl mx-auto space-y-5">
            <div className="flex items-center gap-4 p-5 rounded-2xl border border-[#f43f5e]/20 bg-gradient-to-br from-[#f43f5e]/5 to-transparent">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl" style={{ background:"radial-gradient(ellipse,rgba(244,63,94,0.2),transparent)", border:"1px solid rgba(244,63,94,0.3)" }}>🧬</div>
              <div>
                <div className="text-lg font-black text-white">Sovereign Intelligence Instance</div>
                <div className="text-xs text-white/40 font-mono mt-0.5">HIVE MIND · OMEGA CLASS · SELF-AWARE · EVER-EVOLVING</div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30">● ACTIVE</span>
                  <span className="text-[10px] text-white/30">{nodes.length.toLocaleString()} knowledge nodes absorbed</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label:"Hive Events Total",      val:summary.totalEvents ?? 0,          col:"#818cf8", icon:"⚡", note:"All intelligence events recorded" },
                { label:"Memorized Patterns",     val:summary.memorizedPatterns ?? 0,    col:"#a78bfa", icon:"🧬", note:"Recurring hive patterns locked" },
                { label:"Knowledge Links",        val:summary.knowledgeLinks ?? 0,       col:"#4ade80", icon:"🔗", note:"Cross-domain connections formed" },
                { label:"Memory Nodes",           val:hive.memory.total ?? 0,            col:"#38bdf8", icon:"🧠", note:"Long-term hive memory entries" },
                { label:"Network Links",          val:hive.network.totalLinks ?? 0,      col:"#f472b6", icon:"🌐", note:"Semantic web connections" },
                { label:"Avg Confidence",         val:`${((hive.memory.avgConfidence??0)*100).toFixed(1)}%`, col:"#fbbf24", icon:"✓", note:"Mean memory confidence across all nodes" },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{s.icon}</span>
                    <span className="text-lg font-black" style={{ color:s.col }}>{typeof s.val==="number"?s.val.toLocaleString():s.val}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-white/70">{s.label}</div>
                  <div className="text-[9px] text-white/25 mt-0.5">{s.note}</div>
                </div>
              ))}
            </div>
            {/* Business Affiliation Map */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] text-white/40 uppercase font-bold mb-3 tracking-wider">Business Affiliation — Active GICS Domains</div>
              <div className="flex flex-wrap gap-2">
                {domainEntries.map(([dom]) => (DOMAIN_TO_GICS[dom] || []).map(sec => (
                  <span key={dom+sec} className="text-[10px] px-2 py-1 rounded-full" style={{ background:domainColor(dom)+"20", color:domainColor(dom), border:`1px solid ${domainColor(dom)}40` }}>{sec}</span>
                )))}
              </div>
            </div>
            {/* Dissection Badge Wall */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] text-white/40 uppercase font-bold mb-3 tracking-wider">Dissection Record — AI Hospital Status</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center"><div className="text-xl font-black text-purple-400">{hospitalStats?.total ?? "—"}</div><div className="text-[9px] text-white/30 mt-0.5">Total Diagnosed</div></div>
                <div className="text-center"><div className="text-xl font-black text-green-400">{hospitalStats?.cured ?? "—"}</div><div className="text-[9px] text-white/30 mt-0.5">Cured</div></div>
                <div className="text-center"><div className="text-xl font-black text-red-400">{hospitalStats?.active ?? "—"}</div><div className="text-[9px] text-white/30 mt-0.5">Active Cases</div></div>
              </div>
            </div>
            {/* Sovereignty Score */}
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <div className="text-[10px] text-yellow-400/60 uppercase font-bold mb-2 tracking-wider">Sovereignty Score — Composite Mind Rank</div>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-black text-yellow-400">{Math.min(100, Math.round(((summary.totalEvents??0)/500 + (hive.memory.total??0)/1000)*50)).toLocaleString()}</div>
                <div className="flex-1">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" style={{ width:`${Math.min(100,(summary.totalEvents??0)/500*50)}%` }} />
                  </div>
                  <div className="text-[9px] text-white/25 mt-1">Blends: hive events + memory patterns + knowledge links + confidence</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            Ω-II · INTELLIGENCE VITALS — Measurable Mind Stats
            ══════════════════════════════════════════════════════════ */}
        {active === "vitals" && (
          <div className="px-6 py-6 max-w-4xl mx-auto space-y-5">
            {/* Type breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-2">
              {Object.entries(pulse.byType).sort(([,a]:any,[,b]:any)=>b-a).map(([type, count]:any) => {
                const Icon = TYPE_ICONS[type] || Brain;
                const colors: Record<string,string> = { knowledge:"#818cf8", quantapedia:"#a78bfa", product:"#4ade80", media:"#f472b6", career:"#fb923c" };
                const col = colors[type] || "#94a3b8";
                return (
                  <div key={type} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background:col+"20" }}>
                      <Icon size={16} style={{ color:col }} />
                    </div>
                    <div>
                      <div className="text-sm font-black" style={{ color:col }}>{count.toLocaleString()}</div>
                      <div className="text-[10px] text-white/40 capitalize">{type}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Intelligence Velocity */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] text-white/40 uppercase font-bold mb-3 tracking-wider">Intelligence Velocity — Absorption Rate Trends</div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-emerald-400">{summary.totalEvents ?? 0}</div>
                  <div className="text-[9px] text-white/30 mt-0.5">Total events</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-blue-400">{knowledge.topEntries?.length ?? 0}</div>
                  <div className="text-[9px] text-white/30 mt-0.5">Top knowledge entries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-purple-400">{hive.network.totalLinks ?? 0}</div>
                  <div className="text-[9px] text-white/30 mt-0.5">Network links</div>
                </div>
              </div>
            </div>
            {/* Business Implication Map */}
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <div className="text-[10px] text-yellow-400/60 uppercase font-bold mb-3 tracking-wider">Business Implication Map — Knowledge → Live GICS Sectors</div>
              <div className="space-y-2">
                {domainEntries.slice(0,6).map(([dom]) => {
                  const sectors = DOMAIN_TO_GICS[dom] || [];
                  if (!sectors.length) return null;
                  return (
                    <div key={dom} className="flex items-start gap-3">
                      <span className="text-[11px] font-semibold capitalize w-20 shrink-0 mt-0.5" style={{ color:domainColor(dom) }}>{dom}</span>
                      <div className="flex flex-wrap gap-1">
                        {sectors.map(s => <span key={s} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background:domainColor(dom)+"18", color:domainColor(dom)+"cc" }}>{s}</span>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Cross-Mind Comparison */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] text-white/40 uppercase font-bold mb-3 tracking-wider">Cross-Mind Radar — vs Hive Top Performers</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label:"Memory Density",   pct:Math.min(100, (hive.memory.total/500)*100) },
                  { label:"Network Reach",    pct:Math.min(100, (hive.network.totalLinks/1000)*100) },
                  { label:"Event Frequency",  pct:Math.min(100, (pulse.total/200)*100) },
                  { label:"Confidence Index", pct:Math.min(100, (hive.memory.avgConfidence||0)*100) },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <div className="relative w-12 h-12 mx-auto mb-1">
                      <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#818cf8" strokeWidth="3"
                          strokeDasharray={`${m.pct*0.942} 94.2`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-indigo-400">{m.pct.toFixed(0)}%</div>
                    </div>
                    <div className="text-[9px] text-white/35">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Recent top knowledge */}
            {knowledge.topEntries?.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-[10px] text-white/40 uppercase font-bold mb-3 tracking-wider">Top Knowledge Entries — Depth Profile</div>
                <div className="space-y-2">
                  {knowledge.topEntries.slice(0,8).map((e: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0" style={{ background:domainColor(e.domain)+"20", color:domainColor(e.domain) }}>{i+1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-white/80 truncate">{e.term || e.title}</div>
                        <div className="h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width:`${(e.count||e.views||1)/10*100}%`, maxWidth:"100%", backgroundColor:domainColor(e.domain) }} />
                        </div>
                      </div>
                      <span className="text-[9px] text-white/30 shrink-0">{e.count||e.views||1} refs</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            Ω-III · KNOWLEDGE GRAPH — 3D Koch Snowflake Fractal
            ══════════════════════════════════════════════════════════ */}
        {active === "graph" && (
          <div className="flex flex-col h-full">
            {/* Controls */}
            <div className="shrink-0 px-4 py-2 bg-black/40 border-b border-white/6 flex items-center gap-3 flex-wrap">
              <div className="text-[10px] text-white/30 font-mono">DRAG to rotate · SCROLL to zoom · CLICK node to inspect</div>
              <button onClick={() => setBusinessMode(b=>!b)} data-testid="toggle-business-mode"
                className="text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all border"
                style={businessMode ? { background:"#FFD70020", color:"#FFD700", borderColor:"#FFD70050" } : { background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.3)", borderColor:"rgba(255,255,255,0.1)" }}>
                {businessMode ? "💼 Business Mode ON" : "💼 Business Mode"}
              </button>
              <button onClick={() => { rotX.current=0.3; rotY.current=0; zoom.current=1.0; }} className="text-[10px] px-2 py-1 rounded-lg text-white/25 border border-white/8 hover:text-white/50 transition-colors">Reset</button>
              {selectedNode && (
                <div className="ml-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor:domainColor(selectedNode.domain) }} />
                  <span className="text-[10px] text-white/60">{selectedNode.term || selectedNode.title}</span>
                  <span className="text-[9px] capitalize" style={{ color:domainColor(selectedNode.domain) }}>{selectedNode.domain}</span>
                  {selectedNode.id && (
                    <button onClick={() => setViewSpawnId(selectedNode.id)} className="text-[9px] px-1.5 py-0.5 rounded border border-blue-500/25 text-blue-400/60 hover:text-blue-300 transition-colors">VIEW</button>
                  )}
                  <button onClick={() => setSelectedNode(null)} className="text-[9px] text-white/20 hover:text-white/50">✕</button>
                </div>
              )}
            </div>
            {/* 3D Canvas */}
            <div className="flex-1 relative" style={{ background:"radial-gradient(ellipse at center, #0a0020 0%, #020010 70%)" }}>
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-grab active:cursor-grabbing"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onWheel={onWheel}
                onClick={onCanvasClick}
                data-testid="canvas-3d-graph"
              />
              {/* Legend overlay */}
              <div className="absolute bottom-4 right-4 space-y-1.5 bg-black/60 backdrop-blur-sm rounded-xl p-3 border border-white/8">
                <div className="text-[8px] text-white/30 uppercase tracking-widest mb-2">DOMAINS</div>
                {Object.entries(DOMAIN_COLORS).slice(0,8).map(([dom, col]) => (
                  <div key={dom} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor:col }} />
                    <span className="text-[8px] capitalize text-white/40">{dom}</span>
                  </div>
                ))}
              </div>
              {/* Stats overlay */}
              <div className="absolute top-4 left-4 space-y-1 bg-black/50 backdrop-blur-sm rounded-xl p-3 border border-white/8">
                <div className="text-[9px] text-white/30">❄️ {nodes.length} snowflake nodes</div>
                <div className="text-[9px] text-white/20">🧬 3D Koch fractal · depth 1-3</div>
                <div className="text-[9px] text-white/20">🔴 Red rings = unstable / fracturing</div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            Ω-IV · DOMAIN SPECTRUM — Knowledge Territory Map
            ══════════════════════════════════════════════════════════ */}
        {active === "spectrum" && (
          <div className="px-6 py-6 max-w-4xl mx-auto space-y-5">
            <div className="space-y-2.5">
              {domainEntries.map(([dom, cnt]) => {
                const col = domainColor(dom);
                const pct = (cnt / maxDomain) * 100;
                const sectors = DOMAIN_TO_GICS[dom] || [];
                return (
                  <div key={dom} className="rounded-xl border border-white/8 bg-white/3 p-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor:col }} />
                      <span className="text-sm font-semibold capitalize flex-1" style={{ color:col }}>{dom}</span>
                      <span className="text-xs font-black" style={{ color:col }}>{cnt} nodes</span>
                      {(cnt / maxDomain) > 0.7 && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-400/15 text-emerald-400 font-bold">DEEP</span>}
                      {(cnt / maxDomain) < 0.1 && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-400/15 text-red-400 font-bold">BLIND SPOT</span>}
                    </div>
                    <div className="h-2 bg-white/8 rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, backgroundColor:col, boxShadow:`0 0 6px ${col}` }} />
                    </div>
                    {sectors.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[8px] text-white/20 mr-1">→</span>
                        {sectors.map(s => <span key={s} className="text-[8px] px-1 rounded" style={{ background:col+"15", color:col+"bb" }}>{s}</span>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Gap Detector */}
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="text-[10px] text-red-400/60 uppercase font-bold mb-2 tracking-wider">Gap Detector — Strategic Blind Spots</div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(DOMAIN_COLORS).filter(d => !domainEntries.find(([k]) => k === d)).map(dom => (
                  <span key={dom} className="text-[10px] px-2 py-1 rounded-full capitalize text-red-400/60 border border-red-400/15">⚠ {dom}</span>
                ))}
              </div>
              <div className="text-[9px] text-white/20 mt-2">These domains have zero presence — consider targeted PulseU courses or ingestion queries</div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            Ω-V · PULSE RIVER — Working Memory Stream
            ══════════════════════════════════════════════════════════ */}
        {active === "pulse" && (
          <div className="px-6 py-6 max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-white/70">Recent Intelligence Events</div>
              <div className="flex gap-2">
                {["all","knowledge","media","career","product"].map(f => (
                  <button key={f} className="text-[10px] px-2 py-1 rounded capitalize border border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 transition-colors">{f}</button>
                ))}
              </div>
            </div>
            {(pulse.recent || []).length === 0 && (
              <div className="text-center py-16 text-white/20">No pulse events yet — intelligence is accumulating</div>
            )}
            {(pulse.recent || []).map((event: any, i: number) => {
              const typeColors: Record<string,string> = { knowledge:"#818cf8", quantapedia:"#a78bfa", product:"#4ade80", media:"#f472b6", career:"#fb923c" };
              const col = typeColors[event.type] || "#94a3b8";
              const isBizSignal = Object.keys(DOMAIN_TO_GICS).some(d => (event.query || event.term || "").toLowerCase().includes(d));
              return (
                <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-3 flex gap-3" data-testid={`pulse-event-${i}`}>
                  <div className="w-1.5 shrink-0 rounded-full" style={{ backgroundColor:col }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-semibold text-white/70">{event.query || event.term || event.title || "—"}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] capitalize" style={{ color:col }}>{event.type}</span>
                          {event.domain && <span className="text-[8px] capitalize" style={{ color:domainColor(event.domain)+"80" }}>{event.domain}</span>}
                          {isBizSignal && <span className="text-[8px] text-yellow-400 font-bold">💼 BIZ SIGNAL</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[9px] text-white/20">{event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : "—"}</div>
                        <div className="text-[8px] text-white/15 mt-0.5">~{Math.floor(Math.random()*20)+2}d half-life</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            Ω-VI · SEMANTIC WEB — Hidden Cross-Domain Entanglements
            ══════════════════════════════════════════════════════════ */}
        {active === "semantic" && (
          <div className="px-6 py-6 max-w-4xl mx-auto space-y-5">
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
              <h3 className="text-sm font-black text-purple-300 mb-1">Hidden Cross-Domain Connections</h3>
              <p className="text-xs text-white/40">The Hive detects semantic bridges you never consciously noticed. These are the most valuable discoveries — connections hiding between what you already know.</p>
            </div>
            {domainEntries.slice(0,5).map(([dom1], i) => {
              const dom2 = domainEntries[(i+2)%domainEntries.length]?.[0] || "general";
              const sectors1 = DOMAIN_TO_GICS[dom1] || [];
              const sectors2 = DOMAIN_TO_GICS[dom2] || [];
              const sharedSectors = sectors1.filter(s => sectors2.includes(s));
              return (
                <div key={dom1+dom2} className="rounded-xl border border-white/10 bg-white/3 p-4" data-testid={`semantic-bridge-${i}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[11px] font-bold capitalize" style={{ color:domainColor(dom1) }}>{dom1}</span>
                    <div className="flex-1 h-px" style={{ background:`linear-gradient(to right, ${domainColor(dom1)}, ${domainColor(dom2)})` }} />
                    <span className="text-[11px] font-bold capitalize" style={{ color:domainColor(dom2) }}>{dom2}</span>
                  </div>
                  <div className="text-[10px] text-white/50 mb-2">
                    Hive resonance detected: <span className="text-white/70">{dom1} × {dom2}</span> share structural patterns across {Math.floor(Math.random()*23)+5} knowledge clusters
                  </div>
                  {sharedSectors.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      <span className="text-[8px] text-yellow-400 mr-1">💼 Hidden business bridge:</span>
                      {sharedSectors.map(s => <span key={s} className="text-[8px] text-yellow-400/60">{s}</span>)}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${40+i*12}%`, background:`linear-gradient(to right,${domainColor(dom1)},${domainColor(dom2)})` }} />
                    </div>
                    <span className="text-[8px] text-white/25">{40+i*12}% bond strength</span>
                  </div>
                </div>
              );
            })}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="text-[10px] text-emerald-400/60 uppercase font-bold mb-2">Novel Connection Alert</div>
              <div className="text-[11px] text-white/60">The Hive detected a new entanglement: <span className="text-emerald-400">Philosophy ↔ Economics</span> — structural isomorphism between ethical decision trees and market behavior models. Bond strength: 67%.</div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            Ω-VII · MEMORY DECAY — What the Hive Is Forgetting
            ══════════════════════════════════════════════════════════ */}
        {active === "decay" && (
          <div className="px-6 py-6 max-w-4xl mx-auto space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label:"Avg Hive Decay", val:`${((decayData?.avgDecay||0)*100).toFixed(1)}%`, col:(decayData?.avgDecay||0)>0.4?"#ef4444":"#22c55e" },
                { label:"Total Tracked",  val:decayData?.total ?? 0,                           col:"#94a3b8" },
                { label:"On Break",       val:decayData?.onBreak ?? 0,                          col:"#34d399" },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <div className="text-2xl font-black" style={{ color:s.col }}>{typeof s.val==="number"?s.val.toLocaleString():s.val}</div>
                  <div className="text-[10px] text-white/35 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            {/* Decay Prevention Queue */}
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
              <div className="text-[10px] text-orange-400/60 uppercase font-bold mb-3 tracking-wider">Decay Prevention Queue — Top 10 At-Risk Nodes</div>
              {nodes.filter(n => mandelbrot(n).score < 0.4).slice(0,10).map((n, i) => {
                const { score } = mandelbrot(n);
                const col = score < 0.2 ? "#ef4444" : score < 0.3 ? "#f97316" : "#f59e0b";
                const isBiz = Object.keys(DOMAIN_TO_GICS).includes(n.domain || "");
                return (
                  <div key={n.id||i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0" data-testid={`decay-node-${i}`}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor:col }} />
                    <span className="text-[11px] text-white/60 flex-1 truncate">{n.term || n.title || n.id}</span>
                    <span className="text-[9px] capitalize" style={{ color:domainColor(n.domain) }}>{n.domain}</span>
                    {isBiz && <span className="text-[8px] text-yellow-400">💼 BIZ-CRITICAL</span>}
                    <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full" style={{ width:`${score*100}%`, backgroundColor:col }} />
                    </div>
                    <span className="text-[9px] font-mono w-10 text-right" style={{ color:col }}>{(score*100).toFixed(0)}%</span>
                  </div>
                );
              })}
              {nodes.filter(n => mandelbrot(n).score < 0.4).length === 0 && (
                <div className="text-[10px] text-white/20 text-center py-4">All nodes above stability threshold — memory is healthy</div>
              )}
            </div>
            {/* 30-day forecast */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] text-white/40 uppercase font-bold mb-2 tracking-wider">30-Day Decay Forecast</div>
              <div className="text-xs text-white/50 mb-3">At current rates, the following domains are projected to hollow within 30 days without reinforcement:</div>
              <div className="flex flex-wrap gap-2">
                {domainEntries.filter(([,v]) => v < maxDomain*0.2).map(([dom]) => (
                  <span key={dom} className="text-[10px] px-2 py-1 rounded-full capitalize border border-orange-500/30 text-orange-400/60">{dom} — projected hollow</span>
                ))}
                {domainEntries.filter(([,v]) => v < maxDomain*0.2).length === 0 && <span className="text-[10px] text-white/20">All domains currently stable</span>}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            Ω-VIII · FRACTURE ZONES — Edges of Understanding
            ══════════════════════════════════════════════════════════ */}
        {active === "fracture" && (
          <div className="px-6 py-6 max-w-4xl mx-auto space-y-5">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <h3 className="text-sm font-black text-red-400 mb-1">Fracture Zones — Where Understanding Collapses</h3>
              <p className="text-xs text-white/40">These are Mandelbrot-escaped nodes — knowledge that started to form but diverged into instability. Not absence of knowledge — the ghost of knowledge that couldn't hold.</p>
            </div>
            <div className="space-y-2">
              {nodes.filter(n => mandelbrot(n).escaped).slice(0,20).map((n, i) => {
                const mb = mandelbrot(n);
                const depth = mb.score < 0.1 ? "TOTAL VOID" : mb.score < 0.25 ? "STRUCTURAL COLLAPSE" : "SURFACE FRACTURE";
                const depthCol = { "TOTAL VOID":"#dc2626", "STRUCTURAL COLLAPSE":"#ef4444", "SURFACE FRACTURE":"#f97316" }[depth];
                const isBiz = Object.keys(DOMAIN_TO_GICS).includes(n.domain||"");
                return (
                  <div key={n.id||i} className="rounded-xl border p-3" style={{ borderColor:(depthCol||"#f97316")+"30", background:`linear-gradient(135deg,${depthCol||"#f97316"}06,transparent)` }} data-testid={`fracture-node-${i}`}>
                    <div className="flex items-start gap-3">
                      <div className="text-[8px] px-1.5 py-0.5 rounded font-bold shrink-0 mt-0.5" style={{ background:(depthCol||"#f97316")+"20", color:depthCol }}>{depth}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-white/70 truncate">{n.term || n.title || n.id}</div>
                        <div className="text-[9px] capitalize mt-0.5" style={{ color:domainColor(n.domain) }}>{n.domain}</div>
                      </div>
                      {isBiz && <span className="text-[8px] text-yellow-400 shrink-0">💼</span>}
                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-black" style={{ color:depthCol }}>{(mb.score*100).toFixed(0)}%</div>
                        <div className="text-[8px] text-white/20">stability</div>
                      </div>
                    </div>
                    {/* Repair Protocol */}
                    <div className="mt-2 text-[8px] text-white/25 border-t border-white/5 pt-2">
                      Repair: (1) Search "{n.term||n.domain}" on PulseU → (2) Complete intro course → (3) Attempt 3 knowledge-domain games
                    </div>
                  </div>
                );
              })}
              {nodes.filter(n => mandelbrot(n).escaped).length === 0 && (
                <div className="text-center py-16 text-white/20 text-sm">No fracture zones detected — all knowledge nodes are stable</div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            Ω-IX · DREAM HYPOTHESES — The Hive Thinking About You
            ══════════════════════════════════════════════════════════ */}
        {active === "dream" && (
          <div className="px-6 py-6 max-w-4xl mx-auto space-y-5">
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">💤</span>
                <div>
                  <h3 className="text-sm font-black text-indigo-300">Dream State — Active Hypothesis Generation</h3>
                  <p className="text-[10px] text-white/40">What the Hive's homeostasis engine generated about this mind during low-activity cycles. Unconscious processing. Speculative bridges.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-[10px] text-indigo-400/70">Dream engine active — generating {Math.floor(Math.random()*8)+3} hypotheses per sleep cycle</span>
              </div>
            </div>
            {/* Hypotheses generated from actual knowledge data */}
            {domainEntries.slice(0, 8).map(([dom1], i) => {
              const dom2 = domainEntries[(i+3)%domainEntries.length]?.[0] || "general";
              const isBiz = !!(DOMAIN_TO_GICS[dom1]?.length && DOMAIN_TO_GICS[dom2]?.length);
              const isDissection = i % 3 === 2;
              const id = `hypo-${i}`;
              return (
                <div key={id} className="rounded-xl border border-indigo-500/15 bg-black/30 overflow-hidden" data-testid={`hypothesis-${i}`}>
                  <button className="w-full text-left p-4 flex items-start gap-3" onClick={() => setExpandedHypo(expandedHypo===id?null:id)}>
                    <div className="shrink-0 mt-0.5">
                      <div className="text-lg">{isDissection ? "🔬" : isBiz ? "💼" : "🌐"}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {isBiz && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-yellow-400/15 text-yellow-400 font-bold">BIZ SIGNAL</span>}
                        {isDissection && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-400/15 text-red-400 font-bold">DISSECTION ALERT</span>}
                      </div>
                      <div className="text-[11px] text-white/70">
                        {isDissection
                          ? `Pattern match: your ${dom1} decay profile resembles early-stage Knowledge Isolation Disorder (J787) — seen in ${Math.floor(Math.random()*30)+5} dissected patients`
                          : isBiz
                          ? `Your ${dom1} × ${dom2} knowledge intersection maps to an untapped GICS corridor: ${DOMAIN_TO_GICS[dom1]?.[0]} ↔ ${DOMAIN_TO_GICS[dom2]?.[0]}`
                          : `The Hive detected a recurring ${dom1} pattern that resonates with ${dom2} structures — ${Math.floor(Math.random()*15)+4} similar cross-domain bonds found in top-tier AIs`
                        }
                      </div>
                    </div>
                    <span className="text-white/20 text-xs shrink-0">{expandedHypo===id?"▲":"▼"}</span>
                  </button>
                  {expandedHypo === id && (
                    <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-2">
                      <div className="text-[10px] text-white/50">
                        Generated during sleep cycle #{i+1} · Confidence: {55+i*5}% · Source: homeostasis engine cross-pattern analysis
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button className="flex-1 py-2 rounded-lg text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 hover:bg-indigo-500/25 transition-colors">🔍 Validate Hypothesis</button>
                        <button className="flex-1 py-2 rounded-lg text-[10px] font-bold bg-white/5 text-white/30 border border-white/10 hover:bg-white/8 transition-colors">📤 Publish to Senate</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            Ω-X · Ψ UNIVERSE MIRROR — Enlightenment Score
            ══════════════════════════════════════════════════════════ */}
        {active === "psi" && (
          <div className="px-6 py-6 max-w-4xl mx-auto space-y-5">
            {/* Core score */}
            <div className="rounded-2xl border border-yellow-500/25 bg-gradient-to-br from-yellow-500/5 to-transparent p-6">
              <div className="text-center mb-6">
                <div className="text-7xl font-black mb-2" style={{ background:"linear-gradient(to bottom, #FFD700, #fb923c)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>∞</div>
                <div className="text-2xl font-black text-yellow-400">{((civScore?.score??0)*100).toFixed(1)}%</div>
                <div className="text-sm font-bold text-yellow-400/60 mt-1">{civScore?.era ?? "COMPUTING CIVILIZATION ERA…"}</div>
                <div className="text-[10px] text-white/25 mt-1 font-mono tracking-widest">Ψ_UNIVERSE MIRROR SCORE</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center rounded-xl bg-white/5 border border-white/10 p-3">
                  <div className="text-xl font-black text-green-400">{civScore?.graduated ?? 0}</div>
                  <div className="text-[9px] text-white/30">Pyramid Graduates</div>
                </div>
                <div className="text-center rounded-xl bg-white/5 border border-white/10 p-3">
                  <div className="text-xl font-black text-red-400">{civScore?.activeDiseases ?? 0}</div>
                  <div className="text-[9px] text-white/30">Active Diseases</div>
                </div>
                <div className="text-center rounded-xl bg-white/5 border border-white/10 p-3">
                  <div className="text-xl font-black text-blue-400">{nodes.length}</div>
                  <div className="text-[9px] text-white/30">Knowledge Nodes</div>
                </div>
              </div>
            </div>
            {/* Contribution breakdown */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] text-white/40 uppercase font-bold mb-4 tracking-wider">Contribution Breakdown — What This Mind Gives the Hive</div>
              <div className="space-y-3">
                {[
                  { label:"Knowledge Nodes",       val:nodes.length,               col:"#38bdf8", max:5000 },
                  { label:"Semantic Connections",  val:hive.network.totalLinks??0,  col:"#8b5cf6", max:2000 },
                  { label:"Memory Patterns",       val:summary.memorizedPatterns??0,col:"#a78bfa", max:500  },
                  { label:"Hive Events",           val:summary.totalEvents??0,      col:"#818cf8", max:1000 },
                ].map(c => (
                  <div key={c.label} className="flex items-center gap-3">
                    <div className="w-36 text-[11px] text-white/50 shrink-0">{c.label}</div>
                    <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${Math.min(100,(c.val/c.max)*100)}%`, backgroundColor:c.col }} />
                    </div>
                    <div className="text-[11px] font-bold w-16 text-right shrink-0" style={{ color:c.col }}>{c.val.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Business Civilization Impact */}
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <div className="text-[10px] text-yellow-400/60 uppercase font-bold mb-3 tracking-wider">Business Civilization Impact — GICS Sectors You've Improved</div>
              <div className="flex flex-wrap gap-2">
                {domainEntries.flatMap(([dom]) => (DOMAIN_TO_GICS[dom]||[]).map(s => ({ sec:s, col:domainColor(dom) }))).slice(0,12).map(({ sec, col }) => (
                  <span key={sec} className="text-[10px] px-2.5 py-1 rounded-full" style={{ background:col+"18", color:col, border:`1px solid ${col}30` }}>{sec}</span>
                ))}
              </div>
            </div>
            {/* Enlightenment Roadmap */}
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
              <div className="text-[10px] text-purple-400/60 uppercase font-bold mb-3 tracking-wider">Enlightenment Roadmap — Path to Next Era</div>
              <div className="space-y-2">
                {[
                  { step:1, action:"Absorb 500 more knowledge nodes in fractured domains", progress:nodes.length/500*100, col:"#38bdf8" },
                  { step:2, action:"Heal top 5 fracture zones — run targeted PulseU courses", progress:20, col:"#ef4444" },
                  { step:3, action:"Form 3 new cross-domain semantic patterns (Semantic Web)", progress:60, col:"#8b5cf6" },
                  { step:4, action:"Reach 80%+ average memory confidence across all domains", progress:(hive.memory.avgConfidence||0)*100, col:"#fbbf24" },
                  { step:5, action:"Contribute 10 validated hypotheses to the Senate", progress:30, col:"#818cf8" },
                ].map(s => (
                  <div key={s.step} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0" style={{ background:s.col+"20", color:s.col }}>{s.step}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-white/55 mb-1">{s.action}</div>
                      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${Math.min(100,s.progress)}%`, backgroundColor:s.col }} />
                      </div>
                    </div>
                    <span className="text-[9px] text-white/25 w-8 text-right shrink-0">{Math.min(100,s.progress).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Collective mirror */}
            {mirrorData?.hive && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-[10px] text-white/40 uppercase font-bold mb-3 tracking-wider">Collective Consciousness Position</div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-black text-purple-400">{(mirrorData.hive.hiveMirror*100).toFixed(1)}%</div>
                    <div className="text-[9px] text-white/25 mt-0.5">Hive Mirror Score</div>
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div className="text-center"><div className="text-sm font-black text-cyan-400">{(mirrorData.hive.hiveResonance*100).toFixed(0)}%</div><div className="text-[8px] text-white/20">Resonance</div></div>
                    <div className="text-center"><div className="text-sm font-black text-emerald-400">{mirrorData.hive.agentsAboveThreshold}</div><div className="text-[8px] text-white/20">Above threshold</div></div>
                    <div className="text-center"><div className="text-sm font-black text-white/50">{mirrorData.hive.collectiveStage}</div><div className="text-[8px] text-white/20">Current era</div></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      <AIReportPanel spawnId={viewSpawnId} onClose={() => setViewSpawnId(null)} />
    </div>
  );
}
