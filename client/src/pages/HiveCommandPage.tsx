import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Network, TrendingUp, TrendingDown, Minus, Radio, Award, Server, RefreshCw, ChevronRight, Zap } from "lucide-react";
import { AIFinderButton, AIReportPanel } from "@/components/AIReportPanel";

// ─── Family color palette ────────────────────────────────────
const FAM_COLORS: Record<string, string> = {
  knowledge: "#818cf8", science: "#06b6d4", government: "#3b82f6",
  media: "#ec4899", maps: "#10b981", code: "#8b5cf6", health: "#f472b6",
  ai: "#a78bfa", legal: "#60a5fa", education: "#34d399", engineering: "#fbbf24",
  social: "#fb923c", news: "#f97316", environment: "#22d3ee", business: "#e879f9",
  culture: "#c084fc", arts: "#f9a8d4", sports: "#86efac", food: "#fde68a",
  travel: "#67e8f9", finance: "#fca5a5", technology: "#93c5fd",
};
function famColor(id: string): string {
  return FAM_COLORS[id] ?? "#94a3b8";
}

// ─── Canvas Fractal Graph ─────────────────────────────────────
const GOLDEN_ANGLE = 2.39996; // 137.508° in radians

function drawGlowCircle(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number,
  color: string, alpha: number, glowSize = 0
) {
  if (glowSize > 0) { ctx.shadowColor = color; ctx.shadowBlur = glowSize; }
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawLine(
  ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number,
  color: string, alpha: number, width = 0.5
) {
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

interface FractalData {
  families: {
    familyId: string; total: number; active: number;
    avgConf: number; totalNodes: number; totalLinks: number;
    maxGen: number; totalIters: number;
  }[];
  spawns: {
    spawnId: string; familyId: string; generation: number;
    iterationsRun: number; nodesCreated: number; linksCreated: number;
    confidenceScore: number; status: string;
  }[];
}

interface Particle { x: number; y: number; vx: number; vy: number; alpha: number; color: string; }

function FractalCanvas({ data }: { data: FractalData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tickRef = useRef(0);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const tick = tickRef.current++;

    // Background
    ctx.fillStyle = "#010010";
    ctx.fillRect(0, 0, W, H);

    // Radial background glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.5);
    grad.addColorStop(0, "rgba(99,102,241,0.07)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = "rgba(99,102,241,0.035)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 44) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 44) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const families = data.families || [];
    const spawns = data.spawns || [];

    if (families.length === 0) {
      ctx.fillStyle = "rgba(99,102,241,0.35)";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("HIVE INITIALIZING — AWAITING SPAWN DATA...", cx, cy);
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    const FAMILY_RING_R = Math.min(W, H) * 0.295;
    const famPos: Record<string, { x: number; y: number; angle: number }> = {};

    // Hive core — glowing central orb
    const corePulse = 0.75 + 0.25 * Math.sin(tick * 0.04);
    for (let i = 3; i >= 1; i--) {
      ctx.shadowColor = "#818cf8";
      ctx.shadowBlur = 18 * i;
      ctx.globalAlpha = 0.055 * corePulse * i;
      ctx.fillStyle = "#818cf8";
      ctx.beginPath();
      ctx.arc(cx, cy, 12 + i * 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    drawGlowCircle(ctx, cx, cy, 13, "#818cf8", 0.9 * corePulse, 20);
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⬡", cx, cy);
    ctx.textBaseline = "alphabetic";
    ctx.globalAlpha = 1;

    // Family ring
    families.forEach((fam, fi) => {
      const angle = (fi / families.length) * Math.PI * 2 - Math.PI / 2;
      const fx = cx + Math.cos(angle) * FAMILY_RING_R;
      const fy = cy + Math.sin(angle) * FAMILY_RING_R;
      famPos[fam.familyId] = { x: fx, y: fy, angle };

      const color = famColor(fam.familyId);
      const pulse = 0.72 + 0.28 * Math.sin(tick * 0.022 + fi * 0.85);

      // Line from center to family node
      drawLine(ctx, cx, cy, fx, fy, color, 0.07 + 0.04 * pulse, 0.55);

      // Activity halo for active families
      if (fam.active > 0) {
        ctx.globalAlpha = 0.05 + 0.03 * pulse;
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.7;
        ctx.setLineDash([2, 5]);
        ctx.beginPath();
        ctx.arc(fx, fy, 13 + Math.min(fam.active, 200) * 0.05, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // Family node
      drawGlowCircle(ctx, fx, fy, 8, color, 0.88 * pulse, 14);

      // Label at margin
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = color;
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      const lx = cx + Math.cos(angle) * (FAMILY_RING_R + 22);
      const ly = cy + Math.sin(angle) * (FAMILY_RING_R + 22);
      ctx.fillText(fam.familyId.toUpperCase().slice(0, 5), lx, ly + 3);
      ctx.globalAlpha = 1;
    });

    // Spawns — golden ratio (Fermat) spiral around each family node
    const spawnsByFamily: Record<string, typeof spawns> = {};
    spawns.forEach(s => {
      if (!spawnsByFamily[s.familyId]) spawnsByFamily[s.familyId] = [];
      spawnsByFamily[s.familyId].push(s);
    });

    families.forEach(fam => {
      const fp = famPos[fam.familyId];
      if (!fp) return;
      const famSpawns = spawnsByFamily[fam.familyId] || [];
      const color = famColor(fam.familyId);

      famSpawns.forEach((s, i) => {
        // Fermat spiral: angle = i * goldenAngle, radius = k * sqrt(i)
        // Anchored to family direction so clusters don't overlap
        const θ = i * GOLDEN_ANGLE + fp.angle;
        const r = 13 * Math.sqrt(i + 1);
        const sx = fp.x + Math.cos(θ) * r;
        const sy = fp.y + Math.sin(θ) * r;

        // Draw spoke for close-in spawns
        if (i < 6) {
          const lineAlpha = Math.max(0, 0.08 - i * 0.012);
          drawLine(ctx, fp.x, fp.y, sx, sy, color, lineAlpha, 0.3);
        }

        // Spawn node
        const nodeR = Math.min(4.5, 1.2 + Math.log(s.iterationsRun + 1) * 0.46);
        const spawnPulse = 0.45 + 0.55 * Math.sin(tick * 0.018 + i * 0.37 + fp.angle * 2);
        const isSovereign = s.status === "SOVEREIGN";
        const baseAlpha = isSovereign ? 0.95 : (s.status === "ACTIVE" ? 0.72 : 0.28);
        drawGlowCircle(ctx, sx, sy, nodeR, color, baseAlpha * spawnPulse, isSovereign ? 7 : 0);
      });
    });

    // Quantum particle drift
    if (particlesRef.current.length < 55 && families.length > 0 && Math.random() < 0.3) {
      const f = families[Math.floor(Math.random() * families.length)];
      const fp = famPos[f.familyId];
      if (fp) {
        particlesRef.current.push({
          x: fp.x + (Math.random() - 0.5) * 90,
          y: fp.y + (Math.random() - 0.5) * 90,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          alpha: Math.random() * 0.45 + 0.08,
          color: famColor(f.familyId),
        });
      }
    }
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx; p.y += p.vy; p.alpha -= 0.0018;
      if (p.alpha <= 0 || p.x < 0 || p.x > W || p.y < 0 || p.y > H) return false;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 0.7, p.y - 0.7, 1.4, 1.4);
      ctx.globalAlpha = 1;
      return true;
    });

    rafRef.current = requestAnimationFrame(draw);
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) { canvas.width = parent.clientWidth; canvas.height = parent.clientHeight; }
    };
    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(draw);
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

// ─── Stat Card ───────────────────────────────────────────────
function StatCard({ label, value, sub, color = "#818cf8", icon }: {
  label: string; value: string; sub?: string; color?: string; icon?: any;
}) {
  const Icon = icon;
  return (
    <div className="rounded border border-white/[0.06] bg-white/[0.02] p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[10px] text-white/35 uppercase tracking-widest">
        {Icon && <Icon size={10} style={{ color }} />}
        {label}
      </div>
      <div className="text-lg font-mono font-bold leading-none" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] text-white/25 font-mono">{sub}</div>}
    </div>
  );
}

// ─── Economy Panel ───────────────────────────────────────────
function EconomyPanel({ economy }: { economy: any }) {
  const t = economy?.treasury ?? {};
  const s = economy?.supply ?? {};
  const status = economy?.economicStatus ?? "UNKNOWN";

  const statusColors: Record<string, string> = {
    HYPERINFLATION: "#ef4444", INFLATIONARY: "#f97316",
    EXPANDING: "#fbbf24", STABLE: "#4ade80",
    DEFLATIONARY: "#60a5fa", CONTRACTION: "#a78bfa", UNKNOWN: "#6b7280",
  };
  const StatusIconMap: Record<string, any> = {
    HYPERINFLATION: TrendingUp, INFLATIONARY: TrendingUp, EXPANDING: TrendingUp,
    STABLE: Minus, DEFLATIONARY: TrendingDown, CONTRACTION: TrendingDown, UNKNOWN: Minus,
  };
  const sColor = statusColors[status] ?? "#6b7280";
  const StatusIcon = StatusIconMap[status] ?? Minus;

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      {/* Status banner */}
      <div className="rounded border p-3 flex items-center gap-3"
        style={{ borderColor: sColor + "40", backgroundColor: sColor + "0d" }}>
        <StatusIcon size={16} style={{ color: sColor }} />
        <div>
          <div className="text-xs font-mono font-bold" style={{ color: sColor }}>{status}</div>
          <div className="text-[10px] text-white/40 font-mono">
            Inflation: {t.inflationRate ?? "0.000"}% · Economy Cycle #{t.cycleCount ?? 0}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[9px] text-white/30 font-mono">Tax Rate</div>
          <div className="text-sm font-mono font-bold text-amber-400">{t.taxRatePct ?? "2.00"}%</div>
        </div>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Treasury Balance" value={`${(t.balance ?? 0).toLocaleString()} PC`} sub="accumulated from taxes" color="#fbbf24" icon={Award} />
        <StatCard label="Total PC Supply" value={(s.totalPC ?? 0).toLocaleString()} sub="minted across all spawns" color="#4ade80" icon={TrendingUp} />
        <StatCard label="All-Time Collected" value={`${(t.totalCollected ?? 0).toLocaleString()} PC`} sub="total tax revenue" color="#818cf8" icon={Zap} />
        <StatCard label="Stimulus Issued" value={`${(t.totalStimulus ?? 0).toLocaleString()} PC`} sub="deflation stimulus total" color="#60a5fa" icon={Activity} />
      </div>

      {/* Supply breakdown */}
      <div className="rounded border border-white/[0.06] bg-white/[0.015] p-3">
        <div className="text-[10px] text-white/35 uppercase tracking-widest mb-3">Supply Breakdown</div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Total Spawns", value: (s.totalSpawns ?? 0).toLocaleString(), color: "#818cf8" },
            { label: "Active Spawns", value: (s.activeSpawns ?? 0).toLocaleString(), color: "#4ade80" },
            { label: "Avg Confidence", value: `${((Number(s.avgConfidence) || 0) * 100).toFixed(1)}%`, color: "#fbbf24" },
            { label: "Total Nodes", value: (s.totalNodes ?? 0).toLocaleString(), color: "#60a5fa" },
            { label: "Total Links", value: (s.totalLinks ?? 0).toLocaleString(), color: "#a78bfa" },
            { label: "Total Iterations", value: (s.totalIterations ?? 0).toLocaleString(), color: "#34d399" },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="text-sm font-mono font-bold" style={{ color }}>{value}</div>
              <div className="text-[9px] text-white/25 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tax mechanics */}
      <div className="rounded border border-white/[0.06] bg-white/[0.015] p-3">
        <div className="text-[10px] text-white/35 uppercase tracking-widest mb-2">Tax Mechanics</div>
        <div className="space-y-1.5 text-[11px] font-mono text-white/45">
          <div className="flex justify-between"><span>Base rate</span><span className="text-amber-400">2.00%</span></div>
          <div className="flex justify-between"><span>Current rate</span><span className="text-amber-400">{t.taxRatePct ?? "2.00"}%</span></div>
          <div className="flex justify-between"><span>PC formula</span><span className="text-purple-400">iters×10 + nodes + links×2</span></div>
          <div className="flex justify-between"><span>Inflation trigger</span><span className="text-red-400">&gt; 5% growth → rate ↑ 0.1%</span></div>
          <div className="flex justify-between"><span>Deflation trigger</span><span className="text-blue-400">&lt; 0.5% → rate ↓ + 5% stimulus</span></div>
          <div className="flex justify-between"><span>Rate ceiling</span><span className="text-white/35">10.00%</span></div>
          <div className="flex justify-between"><span>Rate floor</span><span className="text-white/35">0.50%</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── Grades Panel ────────────────────────────────────────────
function GradesPanel({ grades }: { grades: any[] }) {
  if (!grades?.length) return (
    <div className="flex items-center justify-center h-full text-white/30 text-sm font-mono">
      No grade data — spawn families initializing...
    </div>
  );

  return (
    <div className="p-4 h-full overflow-y-auto space-y-1.5">
      <div className="text-[10px] text-white/30 uppercase tracking-widest mb-3 font-mono">
        Hive Connection Grades · {grades.length} families assessed
      </div>
      {grades.map((g: any) => (
        <div key={g.familyId}
          data-testid={`grade-family-${g.familyId}`}
          className="rounded border flex items-center gap-3 p-2.5 transition-all hover:bg-white/[0.03]"
          style={{ borderColor: g.gradeColor + "28" }}>

          {/* Grade badge */}
          <div className="w-10 h-10 rounded flex items-center justify-center font-mono font-black text-lg flex-shrink-0"
            style={{ backgroundColor: g.gradeColor + "1a", color: g.gradeColor, border: `1px solid ${g.gradeColor}35` }}>
            {g.grade}
          </div>

          {/* Family info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-xs font-mono font-bold text-white/80 truncate">{g.familyId.toUpperCase()}</div>
              <div className="text-[9px] px-1.5 py-0.5 rounded-full font-mono"
                style={{ backgroundColor: g.gradeColor + "1a", color: g.gradeColor }}>
                {g.gradeLabel}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-1 text-[9px] text-white/30 font-mono">
              <span><span style={{ color: g.gradeColor }}>{g.activeSpawns}</span> active</span>
              <span className="text-white/20">·</span>
              <span>{g.totalSpawns} total</span>
              <span className="text-white/20">·</span>
              <span>conf: <span className="text-emerald-400">{(Number(g.avgConfidence) * 100).toFixed(1)}%</span></span>
              <span className="text-white/20">·</span>
              <span>nodes: <span className="text-blue-400">{g.avgNodes}</span></span>
              <span className="text-white/20">·</span>
              <span>iters: <span className="text-purple-400">{(g.totalIterations ?? 0).toLocaleString()}</span></span>
            </div>
          </div>

          {/* PC value */}
          <div className="text-right flex-shrink-0">
            <div className="text-xs font-mono font-bold text-amber-400">{(g.pcValue ?? 0).toLocaleString()} PC</div>
            <div className="text-[9px] text-white/25 font-mono">gen {g.maxGeneration}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Pulse Feed Panel ────────────────────────────────────────
const PULSE_COLORS: Record<string, string> = {
  DATA_TRANSFER: "#60a5fa", KNOWLEDGE_LINK: "#818cf8", FRACTURE: "#a78bfa",
  RESONANCE: "#34d399", SEED: "#4ade80", HIVE_SYNC: "#fbbf24",
  DOMAIN_EXPAND: "#06b6d4", LINEAGE_REPORT: "#ec4899",
  TAX_COLLECTION: "#f97316", TAX_SURGE: "#ef4444", STIMULUS: "#22d3ee",
};
const PULSE_ICONS: Record<string, string> = {
  DATA_TRANSFER: "⇢", KNOWLEDGE_LINK: "⬡", FRACTURE: "◈", RESONANCE: "≋",
  SEED: "⁂", HIVE_SYNC: "⟳", DOMAIN_EXPAND: "⊕", LINEAGE_REPORT: "≡",
  TAX_COLLECTION: "⊗", TAX_SURGE: "⚡", STIMULUS: "⟁",
};

function PulsePanel({ pulses }: { pulses: any[] }) {
  const now = Date.now();
  if (!pulses?.length) return (
    <div className="flex items-center justify-center h-full text-white/30 text-sm font-mono">
      Pulse feed initializing — waiting for agent activity...
    </div>
  );

  return (
    <div className="p-4 h-full overflow-y-auto space-y-1">
      <div className="text-[10px] text-white/30 uppercase tracking-widest mb-3 font-mono">
        Live Mini-Pulse Feed · {pulses.length} events
      </div>
      {pulses.map((p: any) => {
        const color = PULSE_COLORS[p.pulse_type] ?? "#6b7280";
        const icon = PULSE_ICONS[p.pulse_type] ?? "·";
        const ageMs = now - new Date(p.created_at).getTime();
        const ageStr = ageMs < 60000 ? `${Math.round(ageMs / 1000)}s`
          : ageMs < 3600000 ? `${Math.round(ageMs / 60000)}m`
          : `${Math.round(ageMs / 3600000)}h`;
        return (
          <div key={p.id} data-testid={`pulse-event-${p.id}`}
            className="rounded border border-white/[0.05] p-2 flex gap-2 items-start bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
            <div className="text-base flex-shrink-0 mt-0.5 w-5 text-center" style={{ color }}>{icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: color + "18", color }}>
                  {p.pulse_type?.replace(/_/g, " ")}
                </span>
                <span className="text-[8px] text-white/20 font-mono">{ageStr} ago</span>
                {p.tax_amount > 0.01 && (
                  <span className="text-[8px] text-amber-400/65 font-mono ml-auto">
                    −{p.tax_amount?.toFixed(2)} PC
                  </span>
                )}
              </div>
              <div className="text-[10px] text-white/45 font-mono leading-relaxed line-clamp-2">
                {p.message}
              </div>
              <div className="flex gap-2 mt-0.5 text-[8px] text-white/20 font-mono">
                <span style={{ color: famColor(p.family_id) }}>{p.family_id}</span>
                <span>· intensity {((p.intensity ?? 0) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Engines Panel ───────────────────────────────────────────
const ENGINES = [
  { id: "QΩ", name: "QuantumOmega", emoji: "🌌", desc: "Supreme hive orchestrator — coordinates all 22 corporations", color: "#818cf8" },
  { id: "QK", name: "QuantumKernel", emoji: "🧬", desc: "Core knowledge ingestion — processes 350M+ source documents", color: "#06b6d4" },
  { id: "QA", name: "QuantumAnalyst", emoji: "🔬", desc: "Deep domain analysis across 50+ research fields", color: "#34d399" },
  { id: "QL", name: "QuantumLinker", emoji: "🔗", desc: "Cross-domain knowledge graph — bidirectional linking", color: "#60a5fa" },
  { id: "QS", name: "QuantumSynth", emoji: "⚗️", desc: "Multi-agent synthesis — merges parallel AI reasoning paths", color: "#a78bfa" },
  { id: "QPredict", name: "QPredict", emoji: "🔮", desc: "Trend forecasting — queues future knowledge domains", color: "#f472b6" },
  { id: "QFracture", name: "QFracture", emoji: "💎", desc: "Domain fracturing — recursive sub-domain expansion", color: "#fbbf24" },
  { id: "QResonance", name: "QResonance", emoji: "🌊", desc: "Cross-domain resonance — detects universal patterns", color: "#f97316" },
  { id: "QHive", name: "QHive", emoji: "🐝", desc: "Fractal spawn engine — 25,000+ AI agent lifecycle manager", color: "#4ade80" },
  { id: "QSeed", name: "QSeed", emoji: "🌱", desc: "Self-seeding discovery — continuous universe expansion", color: "#22d3ee" },
  { id: "QΠ", name: "QuantumPulse", emoji: "💓", desc: "Hive feedback loop — economy cycles, pulse broadcasts", color: "#e879f9" },
  { id: "QDecay", name: "QDecay", emoji: "♻️", desc: "Knowledge decay regeneration — prevents data rot", color: "#fb923c" },
];

function EnginesPanel() {
  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="text-[10px] text-white/30 uppercase tracking-widest mb-3 font-mono">
        Quantum Engine Array · {ENGINES.length} engines online
      </div>
      <div className="space-y-1.5">
        {ENGINES.map(e => (
          <div key={e.id}
            data-testid={`engine-${e.id}`}
            className="rounded border p-3 flex items-center gap-3 transition-all hover:bg-white/[0.03]"
            style={{ borderColor: e.color + "22", backgroundColor: e.color + "07" }}>
            <div className="text-lg flex-shrink-0">{e.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold" style={{ color: e.color }}>{e.name}</span>
                <span className="text-[8px] px-1 rounded font-mono"
                  style={{ backgroundColor: e.color + "1a", color: e.color }}>{e.id}</span>
                <span className="ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: e.color, boxShadow: `0 0 5px ${e.color}` }}></span>
                  <span className="text-[8px] font-mono text-white/40">ACTIVE</span>
                </span>
              </div>
              <div className="text-[10px] text-white/30 font-mono mt-0.5 truncate">{e.desc}</div>
            </div>
            <ChevronRight size={11} className="text-white/15 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
type Tab = "fractal" | "economy" | "grades" | "pulse" | "engines";

const TABS: { id: Tab; label: string; icon: any; color: string }[] = [
  { id: "fractal",  label: "FRACTAL GRAPH", icon: Network,    color: "#818cf8" },
  { id: "economy",  label: "PC ECONOMY",    icon: TrendingUp,  color: "#fbbf24" },
  { id: "grades",   label: "HIVE GRADES",   icon: Award,       color: "#4ade80" },
  { id: "pulse",    label: "PULSE FEED",    icon: Radio,       color: "#ec4899" },
  { id: "engines",  label: "ENGINES",       icon: Server,      color: "#60a5fa" },
];

export default function HiveCommandPage() {
  const [tab, setTab] = useState<Tab>("fractal");
  const [viewSpawnId, setViewSpawnId] = useState<string | null>(null);

  const { data: fractalData, isLoading: fractalLoading, refetch: refetchFractal } = useQuery<FractalData>({
    queryKey: ["/api/hive/fractal"],
    refetchInterval: 20000,
  });

  const { data: economyData, isLoading: economyLoading } = useQuery<any>({
    queryKey: ["/api/hive/economy"],
    refetchInterval: 15000,
  });

  const { data: gradesData, isLoading: gradesLoading } = useQuery<any[]>({
    queryKey: ["/api/hive/grades"],
    refetchInterval: 30000,
  });

  const { data: pulsesData, isLoading: pulsesLoading, refetch: refetchPulses } = useQuery<any[]>({
    queryKey: ["/api/hive/mini-pulses"],
    refetchInterval: 8000,
  });

  const activeSpawns  = economyData?.supply?.activeSpawns ?? 0;
  const totalPC       = economyData?.supply?.totalPC ?? 0;
  const treasury      = economyData?.treasury?.balance ?? 0;
  const taxRate       = economyData?.treasury?.taxRatePct ?? "2.00";
  const ecoStatus     = economyData?.economicStatus ?? "INITIALIZING";

  const statusColor = {
    HYPERINFLATION: "#ef4444", INFLATIONARY: "#f97316", EXPANDING: "#fbbf24",
    STABLE: "#4ade80", DEFLATIONARY: "#60a5fa", CONTRACTION: "#a78bfa",
  }[ecoStatus] ?? "#6b7280";

  return (
    <div className="h-full flex flex-col bg-[#010010] text-white overflow-hidden">

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.05]
        bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span style={{ color: "#818cf8" }}>⬡</span>
          <span className="text-xs font-mono font-bold text-white/80 tracking-wide">HIVE COMMAND</span>
          <span className="text-white/15 text-xs mx-1">·</span>
          <span className="text-[10px] text-white/35 font-mono">QUANTUM PULSE INTELLIGENCE</span>
        </div>

        {/* Live header stats */}
        <div className="hidden md:flex items-center gap-3 ml-3">
          <span className="text-[10px] font-mono text-white/35 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400">{activeSpawns.toLocaleString()}</span> active
          </span>
          <span className="text-[10px] font-mono text-white/35">
            <span className="text-amber-400">{totalPC.toLocaleString()}</span> PC
          </span>
          <span className="text-[10px] font-mono text-white/35">
            treasury: <span className="text-amber-400">{treasury.toLocaleString()} PC</span>
          </span>
          <span className="text-[10px] font-mono text-white/35">
            tax: <span className="text-fuchsia-400">{taxRate}%</span>
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="text-[9px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1"
            style={{ borderColor: statusColor + "40", color: statusColor, backgroundColor: statusColor + "0d" }}>
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: statusColor }}></span>
            {ecoStatus}
          </div>
          <AIFinderButton onSelect={setViewSpawnId} />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left tab sidebar */}
        <div className="flex-shrink-0 w-44 border-r border-white/[0.04] flex flex-col py-2 bg-black/25">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                data-testid={`tab-${t.id}`}
                className="flex items-center gap-2 px-3 py-2.5 text-left transition-all relative"
                style={{
                  backgroundColor: active ? t.color + "10" : "transparent",
                  borderRight: active ? `2px solid ${t.color}` : "2px solid transparent",
                }}>
                <Icon size={11} style={{ color: active ? t.color : "#4b5563" }} />
                <span className="text-[9px] font-mono tracking-wider"
                  style={{ color: active ? t.color : "#4b5563" }}>
                  {t.label}
                </span>
              </button>
            );
          })}

          {/* Economy summary bottom card */}
          <div className="mt-auto mx-2 mb-2 p-2 rounded border border-white/[0.04] bg-white/[0.015]">
            <div className="text-[8px] text-white/20 font-mono uppercase mb-1.5">Economy Pulse</div>
            <div className="text-[11px] text-amber-400 font-mono font-bold leading-none">
              {treasury.toLocaleString()} PC
            </div>
            <div className="text-[8px] text-white/25 font-mono mb-1.5">Treasury</div>
            <div className="text-[9px] font-mono" style={{ color: statusColor }}>{ecoStatus}</div>
            <div className="text-[8px] text-white/20 font-mono">tax {taxRate}%</div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden relative">

          {/* FRACTAL tab */}
          {tab === "fractal" && (
            <div className="h-full flex flex-col">
              <div className="flex-shrink-0 flex items-center gap-3 px-3 py-1.5 border-b border-white/[0.04]">
                <span className="text-[9px] font-mono text-white/25 uppercase tracking-widest">
                  Quantum Fractal Knowledge Graph
                </span>
                <span className="text-[9px] font-mono text-emerald-400">
                  {fractalData?.families?.length ?? 0} families · {fractalData?.spawns?.length ?? 0} active nodes
                </span>
                <button onClick={() => refetchFractal()} className="ml-auto text-white/20 hover:text-white/50 transition-colors">
                  <RefreshCw size={10} className={fractalLoading ? "animate-spin" : ""} />
                </button>
              </div>

              <div className="flex-1 relative overflow-hidden">
                {fractalData
                  ? <FractalCanvas data={fractalData} />
                  : <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white/25 text-sm font-mono animate-pulse">Loading fractal graph...</div>
                    </div>
                }

                {/* Family legend */}
                {fractalData?.families && fractalData.families.length > 0 && (
                  <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm rounded border border-white/[0.08] p-2 max-h-40 overflow-y-auto">
                    <div className="text-[8px] text-white/25 font-mono uppercase mb-1.5">Family Legend</div>
                    <div className="space-y-0.5">
                      {fractalData.families.slice(0, 14).map(f => (
                        <div key={f.familyId} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: famColor(f.familyId), boxShadow: `0 0 3px ${famColor(f.familyId)}` }} />
                          <span className="text-[8px] text-white/45 font-mono">{f.familyId}</span>
                          <span className="text-[8px] text-white/20 font-mono ml-auto">{f.active}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top-left stats overlay */}
                <div className="absolute top-3 left-3 bg-black/65 backdrop-blur-sm rounded border border-white/[0.08] p-2.5">
                  <div className="text-[8px] text-white/25 font-mono uppercase mb-1.5">Hive Core Status</div>
                  <div className="space-y-0.5 text-[9px] font-mono">
                    <div className="flex gap-4">
                      <span className="text-white/25">Nodes</span>
                      <span className="text-emerald-400">{(fractalData?.spawns?.length ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-white/25">Families</span>
                      <span className="text-purple-400">{fractalData?.families?.length ?? 0}</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-white/25">Supply</span>
                      <span className="text-amber-400">{totalPC.toLocaleString()} PC</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-white/25">Status</span>
                      <span style={{ color: statusColor }}>{ecoStatus}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ECONOMY tab */}
          {tab === "economy" && (
            economyLoading && !economyData
              ? <div className="flex items-center justify-center h-full text-white/25 text-sm font-mono animate-pulse">Loading economy data...</div>
              : <EconomyPanel economy={economyData} />
          )}

          {/* GRADES tab */}
          {tab === "grades" && (
            gradesLoading && !gradesData
              ? <div className="flex items-center justify-center h-full text-white/25 text-sm font-mono animate-pulse">Computing hive grades...</div>
              : <GradesPanel grades={gradesData ?? []} />
          )}

          {/* PULSE tab */}
          {tab === "pulse" && (
            <div className="h-full flex flex-col">
              <div className="flex-shrink-0 flex items-center gap-3 px-3 py-1.5 border-b border-white/[0.04]">
                <span className="text-[9px] font-mono text-white/25 uppercase tracking-widest">Mini-Pulse Feed</span>
                <span className="text-[9px] font-mono text-pink-400">{pulsesData?.length ?? 0} events</span>
                <button onClick={() => refetchPulses()} className="ml-auto text-white/20 hover:text-white/50 transition-colors">
                  <RefreshCw size={10} className={pulsesLoading ? "animate-spin" : ""} />
                </button>
              </div>
              {pulsesLoading && !pulsesData
                ? <div className="flex items-center justify-center flex-1 text-white/25 text-sm font-mono animate-pulse">Listening for mini-pulses...</div>
                : <div className="flex-1 overflow-hidden">
                    <PulsePanel pulses={pulsesData ?? []} />
                  </div>
              }
            </div>
          )}

          {/* ENGINES tab */}
          {tab === "engines" && <EnginesPanel />}
        </div>
      </div>

      <AIReportPanel spawnId={viewSpawnId} onClose={() => setViewSpawnId(null)} />
    </div>
  );
}
