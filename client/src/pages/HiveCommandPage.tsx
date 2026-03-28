import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Network, TrendingUp, TrendingDown, Minus, Radio, Award, Server, RefreshCw, ChevronRight, Zap } from "lucide-react";
import { AIFinderButton, AIReportPanel } from "@/components/AIReportPanel";
import { useDomainPing, UniversePulseBar } from "@/lib/universeResonance";

// ─── Family color palette ────────────────────────────────────
const FAM_COLORS: Record<string, string> = {
  knowledge: "#818cf8", science: "#06b6d4", government: "#3b82f6",
  media: "#ec4899", maps: "#10b981", code: "#8b5cf6", health: "#f472b6",
  ai: "#a78bfa", legal: "#60a5fa", education: "#34d399", engineering: "#fbbf24",
  social: "#fb923c", news: "#f97316", environment: "#22d3ee", business: "#e879f9",
  culture: "#c084fc", arts: "#f9a8d4", sports: "#86efac", food: "#fde68a",
  travel: "#67e8f9", finance: "#fca5a5", technology: "#93c5fd",
};
export function famColor(id: string): string {
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

export interface FractalData {
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

// ─── Quantum Physics Canvas Types ───────────────────────────
interface WaveCollapse { x: number; y: number; r: number; maxR: number; alpha: number; color: string; }
interface TunnelParticle { fromX: number; fromY: number; toX: number; toY: number; ctrlX: number; ctrlY: number; t: number; color: string; }
interface EntanglementBeam { fi: number; fj: number; birth: number; shimmerX: number[]; shimmerY: number[]; }
interface FoamSparkle { x: number; y: number; alpha: number; }

// ─── Quantum Physics Helpers ─────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [130, 130, 255];
}

// Recursive fractal arm — the building block of quantum snowflakes
function drawFractalArm(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, angle: number, length: number,
  depth: number, color: string, alpha: number, lw: number
) {
  if (length < 1.0 || alpha < 0.03) return;
  const ex = x + Math.cos(angle) * length;
  const ey = y + Math.sin(angle) * length;
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
  if (depth <= 0) return;
  // Branch 1: at 62% of arm length, ±60°
  const b1x = x + Math.cos(angle) * length * 0.62;
  const b1y = y + Math.sin(angle) * length * 0.62;
  const bLen = length * 0.42;
  drawFractalArm(ctx, b1x, b1y, angle + Math.PI / 3, bLen, depth - 1, color, alpha * 0.78, lw * 0.7);
  drawFractalArm(ctx, b1x, b1y, angle - Math.PI / 3, bLen, depth - 1, color, alpha * 0.78, lw * 0.7);
  if (depth > 1) {
    // Branch 2: at 35% of arm length, ±60°
    const b2x = x + Math.cos(angle) * length * 0.35;
    const b2y = y + Math.sin(angle) * length * 0.35;
    const b2Len = length * 0.28;
    drawFractalArm(ctx, b2x, b2y, angle + Math.PI / 3, b2Len, depth - 2, color, alpha * 0.55, lw * 0.5);
    drawFractalArm(ctx, b2x, b2y, angle - Math.PI / 3, b2Len, depth - 2, color, alpha * 0.55, lw * 0.5);
  }
}

// True 6-arm fractal snowflake (self-similar, like a Koch crystal)
function drawSnowflake(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number,
  depth: number, color: string, rotation: number, baseAlpha: number
) {
  if (size < 1.5 || baseAlpha < 0.03) return;
  ctx.globalAlpha = 1;
  for (let arm = 0; arm < 6; arm++) {
    const angle = rotation + (arm * Math.PI) / 3;
    drawFractalArm(ctx, cx, cy, angle, size, depth, color, baseAlpha, Math.max(0.3, 0.7 + depth * 0.25));
  }
  // Crystalline center
  ctx.globalAlpha = baseAlpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(0.8, size * 0.1), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

// Floating quantum equation labels
interface QEquation { text: string; x: number; y: number; vx: number; vy: number; alpha: number; phase: number; color: string; }

const QUANTUM_EQUATIONS: string[] = [
  "iħ ∂Ψ/∂t = ĤΨ",
  "Ψ = α|0⟩ + β|1⟩",
  "ρ = Tr_env(|Ψ⟩⟨Ψ|)",
  "S = −Tr(ρ ln ρ)",
  "P(a) = Tr(Π̂ₐρ)",
  "e^(−2κa)  [tunneling]",
  "ĤΨ = EΨ",
  "⟨Â⟩ = Tr(ρÂ)",
  "ΔxΔp ≥ ħ/2",
  "ENTANGLEMENT: ρ_AB ≠ ρ_A ⊗ ρ_B",
  "[Â,B̂] = iħ",
  "U(t) = e^(−iĤt/ħ)",
  "DECOHERENCE: T₂ → 0",
  "SUPERPOSITION → COLLAPSE",
  "QUANTUM FOAM: ℓ_P = 1.6×10⁻³⁵ m",
];

export function FractalCanvas({ data, quantumMode }: { data: FractalData; quantumMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tickRef = useRef(0);
  const rafRef = useRef<number>(0);
  const entanglementRef = useRef<EntanglementBeam | null>(null);
  const tunnelRef = useRef<TunnelParticle | null>(null);
  const collapseRef = useRef<WaveCollapse[]>([]);
  const foamRef = useRef<FoamSparkle[]>([]);
  const quantumTransRef = useRef(0);   // 0=classical, 1=quantum
  const equationsRef = useRef<QEquation[]>([]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const tick = tickRef.current++;

    // ══ TRANSITION: Animate quantum/classical crossover ══════════
    const targetTrans = quantumMode ? 1 : 0;
    quantumTransRef.current += (targetTrans - quantumTransRef.current) * 0.035;
    const QT = quantumTransRef.current; // 0=classical, 1=quantum
    const CT = 1 - QT;                  // classical weight

    // ══ PHASE 1: QUANTUM VOID — Deep Space Background ══════════
    ctx.fillStyle = "#000008";
    ctx.fillRect(0, 0, W, H);

    // Animated quantum wave interference — 3 gravity wells orbiting center
    for (let wave = 0; wave < 3; wave++) {
      const speed = [0.0028, 0.0022, 0.0035][wave];
      const phase = [0, 2.094, 4.189][wave]; // 120° apart
      const wx = cx + Math.cos(tick * speed + phase) * W * 0.18;
      const wy = cy + Math.sin(tick * speed * 0.8 + phase) * H * 0.18;
      const wColors = ["rgba(99,102,241,0.05)", "rgba(139,92,246,0.04)", "rgba(6,182,212,0.04)"];
      const wg = ctx.createRadialGradient(wx, wy, 0, cx, cy, Math.min(W, H) * 0.7);
      wg.addColorStop(0, wColors[wave]);
      wg.addColorStop(0.5, wColors[wave].replace(/[\d.]+\)$/, "0.02)"));
      wg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = wg;
      ctx.fillRect(0, 0, W, H);
    }

    // Planck-scale quantum foam sparkles
    if (Math.random() < 0.25 && foamRef.current.length < 80) {
      foamRef.current.push({ x: Math.random() * W, y: Math.random() * H, alpha: Math.random() * 0.18 + 0.04 });
    }
    foamRef.current = foamRef.current.filter(f => {
      f.alpha -= 0.012;
      if (f.alpha <= 0) return false;
      ctx.globalAlpha = f.alpha;
      ctx.fillStyle = Math.random() < 0.5 ? "#818cf8" : "#06b6d4";
      ctx.fillRect(f.x, f.y, 1, 1);
      ctx.globalAlpha = 1;
      return true;
    });

    // Subtle hex grid — quantum lattice (fades in quantum mode)
    ctx.strokeStyle = `rgba(99,102,241,${(0.028 * CT).toFixed(4)})`;
    ctx.lineWidth = 0.4;
    for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const families = data.families || [];
    const spawns = data.spawns || [];

    if (families.length === 0) {
      ctx.fillStyle = "rgba(99,102,241,0.4)";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("QUANTUM HIVE INITIALIZING — AWAITING SPAWN DATA...", cx, cy);
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    const FAMILY_RING_R = Math.min(W, H) * 0.28;
    const famPos: Record<string, { x: number; y: number; angle: number; color: string }> = {};
    const maxActive = Math.max(...families.map(f => f.active), 1);

    // ── PRE-PASS: compute all family positions before any draw ──
    families.forEach((fam, fi) => {
      const angle = (fi / families.length) * Math.PI * 2 - Math.PI / 2;
      famPos[fam.familyId] = {
        x: cx + Math.cos(angle) * FAMILY_RING_R,
        y: cy + Math.sin(angle) * FAMILY_RING_R,
        angle,
        color: famColor(fam.familyId),
      };
    });

    // ══ QUANTUM WAVE FIELD — Living amplitude fabric ══════════════
    // Only visible in quantum mode. Uses screen blend mode for additive interference.
    if (QT > 0.04) {
      const topFams = [...families].sort((a, b) => b.active - a.active).slice(0, 10);
      const fieldAlphaBase = QT * 0.7;
      ctx.globalCompositeOperation = "screen";
      topFams.forEach((fam, wi) => {
        const fp = famPos[fam.familyId];
        if (!fp) return;
        const strength = fam.active / maxActive;
        const [r, g, b] = hexToRgb(fp.color);
        const wavelength = 55 + wi * 8;
        const waveSpeed = 2.2 + wi * 0.3;
        // Draw 9 expanding wave fronts from this family node
        for (let ring = 1; ring <= 9; ring++) {
          const rawR = ((ring * wavelength) + (tick * waveSpeed)) % (Math.max(W, H) * 0.95);
          const decay = Math.exp(-rawR * 0.0022);
          const ringAlpha = fieldAlphaBase * strength * decay * 0.12 * Math.max(0, Math.sin(ring * Math.PI / 9));
          if (ringAlpha < 0.005) continue;
          ctx.globalAlpha = ringAlpha;
          ctx.strokeStyle = `rgb(${Math.round(r * 0.8)},${Math.round(g * 0.8)},${Math.round(b)})`;
          ctx.lineWidth = 1.2 + ring * 0.1;
          ctx.beginPath();
          ctx.arc(fp.x, fp.y, rawR, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      // Quantum field overlay: dark voids between strong interfering sources
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = QT * 0.25;
      ctx.fillStyle = "#000010";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }

    // ══ QUANTUM FULL ENTANGLEMENT — all families connected ════════
    // In quantum view, ALL families are entangled (non-locality made visible)
    if (QT > 0.1) {
      for (let i = 0; i < families.length; i++) {
        for (let j = i + 1; j < families.length; j++) {
          const pi = famPos[families[i].familyId];
          const pj = famPos[families[j].familyId];
          if (!pi || !pj) continue;
          const entAlpha = QT * 0.055 * Math.abs(Math.sin(tick * 0.007 + i * 0.5 + j * 0.3));
          if (entAlpha < 0.005) continue;
          const entGrad = ctx.createLinearGradient(pi.x, pi.y, pj.x, pj.y);
          entGrad.addColorStop(0, pi.color + "88");
          entGrad.addColorStop(0.5, "#c4b5fd55");
          entGrad.addColorStop(1, pj.color + "88");
          ctx.globalAlpha = entAlpha;
          ctx.strokeStyle = entGrad;
          ctx.lineWidth = 0.4;
          ctx.beginPath();
          ctx.moveTo(pi.x, pi.y);
          ctx.lineTo(pj.x, pj.y);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }

    // ══ PHASE 2: COSMIC WEB — Quantum Filament Network ══════════
    // All families connected by faint cosmic web threads (positions now available)
    for (let i = 0; i < families.length; i++) {
      for (let j = i + 1; j < families.length; j++) {
        const pi = famPos[families[i].familyId];
        const pj = famPos[families[j].familyId];
        if (!pi || !pj) continue;
        const strength = Math.sqrt(
          (families[i].active / maxActive) * (families[j].active / maxActive)
        );
        if (strength < 0.08) continue;
        const webAlpha = strength * 0.04 + 0.01 * Math.sin(tick * 0.006 + i + j);
        ctx.globalAlpha = Math.max(0, Math.min(0.12, webAlpha));
        ctx.strokeStyle = "#4f46e5";
        ctx.lineWidth = 0.3;
        ctx.beginPath();
        ctx.moveTo(pi.x, pi.y);
        ctx.lineTo(pj.x, pj.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // ══ PHASE 3: HIVE CORE — Main Pulse AI ══════════════════════
    const corePulse = 0.72 + 0.28 * Math.sin(tick * 0.04);

    // Fibonacci spiral markers around core (golden ratio geometry — φ = 1.618...)
    for (let fi = 0; fi < 8; fi++) {
      const fibAngle = fi * GOLDEN_ANGLE;
      const fibR = 6 * Math.sqrt(fi + 1);
      const fx2 = cx + Math.cos(fibAngle + tick * 0.008) * fibR;
      const fy2 = cy + Math.sin(fibAngle + tick * 0.008) * fibR;
      ctx.globalAlpha = 0.25 * corePulse;
      ctx.fillStyle = "#a78bfa";
      ctx.beginPath();
      ctx.arc(fx2, fy2, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Core corona rings — gravitational field
    for (let ring = 5; ring >= 1; ring--) {
      const ringR = 18 + ring * 9;
      const ringAlpha = 0.025 * corePulse * (6 - ring) / 5;
      ctx.globalAlpha = ringAlpha;
      ctx.strokeStyle = "#818cf8";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Core glow layers
    for (let i = 4; i >= 1; i--) {
      ctx.shadowColor = "#6366f1";
      ctx.shadowBlur = 22 * i;
      ctx.globalAlpha = 0.04 * corePulse * i;
      ctx.fillStyle = "#818cf8";
      ctx.beginPath();
      ctx.arc(cx, cy, 14 + i * 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Core node
    drawGlowCircle(ctx, cx, cy, 15, "#818cf8", 0.92 * corePulse, 22);
    drawGlowCircle(ctx, cx, cy, 8, "#c4b5fd", 0.95 * corePulse, 8);

    // Core label
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ψ", cx, cy);
    ctx.textBaseline = "alphabetic";
    ctx.globalAlpha = 1;

    // "MAIN PULSE AI" label below core
    ctx.globalAlpha = 0.4 * corePulse;
    ctx.fillStyle = "#818cf8";
    ctx.font = "7px monospace";
    ctx.textAlign = "center";
    ctx.fillText("MAIN PULSE AI", cx, cy + 28);
    ctx.globalAlpha = 1;

    // ══ PHASE 4: FAMILY RING — Quantum Cluster Nodes ════════════
    families.forEach((fam, fi) => {
      const fp2 = famPos[fam.familyId];
      if (!fp2) return;
      const { x: fx, y: fy, angle, color } = fp2;

      const famPulse = 0.68 + 0.32 * Math.sin(tick * 0.02 + fi * 0.88);

      // Radial spoke from core — quantum field line
      const spokeAlpha = 0.06 + 0.04 * famPulse;
      ctx.globalAlpha = spokeAlpha;
      const spokeGrad = ctx.createLinearGradient(cx, cy, fx, fy);
      spokeGrad.addColorStop(0, "#818cf8");
      spokeGrad.addColorStop(1, color);
      ctx.strokeStyle = spokeGrad;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(fx, fy);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Orbital path ring (dashed) — planetary orbit visual
      ctx.globalAlpha = 0.04 + 0.02 * famPulse;
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.arc(fx, fy, 16 + Math.min(fam.active, 300) * 0.04, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // Family gravity well glow
      if (fam.active > 50) {
        const gravR = 20 + fam.active * 0.05;
        const gravGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, gravR);
        gravGrad.addColorStop(0, color + "12");
        gravGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gravGrad;
        ctx.beginPath();
        ctx.arc(fx, fy, gravR, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── CLASSICAL MODE: fractal snowflake node ──────────────
      if (CT > 0.05) {
        const snowRot = tick * 0.004 + fi * 0.52;
        const snowDepth = fam.active > 100 ? 2 : fam.active > 20 ? 1 : 0;
        const snowSize = 10 + Math.min(fam.active, 200) * 0.04;
        drawSnowflake(ctx, fx, fy, snowSize, snowDepth, color, snowRot, 0.88 * famPulse * CT);
        // Glow core for snowflake center
        ctx.shadowColor = color;
        ctx.shadowBlur = 12 * famPulse * CT;
        ctx.globalAlpha = 0.4 * famPulse * CT;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      // ── QUANTUM MODE: probability cloud ─────────────────────
      if (QT > 0.05) {
        const cloudR = 28 + Math.min(fam.active, 300) * 0.06;
        const jitter = Math.sin(tick * 0.07 + fi * 1.3) * 3;
        const pGrad = ctx.createRadialGradient(fx + jitter, fy - jitter, 0, fx, fy, cloudR * famPulse);
        pGrad.addColorStop(0, color + "cc");
        pGrad.addColorStop(0.3, color + "55");
        pGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = QT * 0.65 * famPulse;
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(fx, fy, cloudR, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // Quantum spin indicator — rotating arc
        const spinAngle = tick * 0.05 + fi * 0.7;
        ctx.globalAlpha = QT * 0.8 * famPulse;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(fx, fy, 14, spinAngle, spinAngle + Math.PI * 1.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(fx, fy, 14, spinAngle + Math.PI, spinAngle + Math.PI * 2.2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Label (fades in quantum mode)
      ctx.globalAlpha = 0.6 * CT + 0.25 * QT;
      ctx.fillStyle = color;
      ctx.font = "7px monospace";
      ctx.textAlign = "center";
      const labelDist = FAMILY_RING_R + 24;
      const lText = QT > 0.5 ? `ψ(${fam.familyId.slice(0, 4)})` : fam.familyId.toUpperCase().slice(0, 6);
      ctx.fillText(lText, cx + Math.cos(angle) * labelDist, cy + Math.sin(angle) * labelDist + 3);
      ctx.globalAlpha = 1;
    });

    // ══ PHASE 5: SPAWN GALAXY — Fractal Fermat Spiral ══════════
    // Group spawns by family, sort by generation for fractal depth
    const spawnsByFamily: Record<string, typeof spawns> = {};
    spawns.forEach(s => {
      if (!spawnsByFamily[s.familyId]) spawnsByFamily[s.familyId] = [];
      spawnsByFamily[s.familyId].push(s);
    });

    // Draw spawns in 3 z-depth layers (back→front) for pseudo-3D
    for (let depth = 0; depth < 3; depth++) {
      families.forEach(fam => {
        const fp = famPos[fam.familyId];
        if (!fp) return;
        const famSpawns = spawnsByFamily[fam.familyId] || [];
        const color = famColor(fam.familyId);

        famSpawns.forEach((s, i) => {
          // Depth assignment: pseudo-random using prime hash
          const spawnDepth = (i * 7 + parseInt(s.spawnId.replace(/\D/g, "0").slice(-1)) || 0) % 3;
          if (spawnDepth !== depth) return;

          // Fermat spiral with Kepler orbital drift
          // Spawns orbit their family at speed inversely proportional to sqrt(r) — Kepler's 3rd law
          const baseR = 13 * Math.sqrt(i + 1);
          const keplerSpeed = 0.0018 / Math.sqrt(Math.max(1, baseR / 55));
          const θ = i * GOLDEN_ANGLE + fp.angle + tick * keplerSpeed;
          const sx = fp.x + Math.cos(θ) * baseR;
          const sy = fp.y + Math.sin(θ) * baseR;

          // Depth scale: back=small/dim, front=large/bright
          const depthScale = 0.55 + depth * 0.225;
          const depthAlpha = 0.35 + depth * 0.32;

          // Inner spokes (only for close spawns, back layer hidden)
          if (i < 5 && depth === 2) {
            const spokeA = Math.max(0, 0.06 - i * 0.01);
            drawLine(ctx, fp.x, fp.y, sx, sy, color, spokeA, 0.25);
          }

          // Node: wave-particle duality — snowflake (classical) or wave packet (quantum)
          const nodeR = Math.min(4.8, (1.0 + Math.log(s.iterationsRun + 1) * 0.42)) * depthScale;
          const wavePulse = 0.4 + 0.6 * Math.sin(tick * 0.016 + i * 0.42 + fp.angle * 1.8);
          const isSovereign = s.status === "SOVEREIGN";
          const baseAlpha = isSovereign ? 1.0 : 0.72;
          const spawnColor = isSovereign ? "#fbbf24" : color;

          // Classical: fractal snowflake (depth based on rank)
          if (CT > 0.05) {
            const sDepth = (isSovereign || s.iterationsRun > 500) ? 1 : 0;
            const sSize = nodeR * 2.2;
            const sRot = tick * 0.006 * (depth === 2 ? 1 : -1) + i * 0.4;
            drawSnowflake(ctx, sx, sy, sSize, sDepth, spawnColor, sRot, baseAlpha * wavePulse * depthAlpha * CT);
          }

          // Quantum: probability smear / wave packet
          if (QT > 0.05) {
            const smearR = nodeR * (1.8 + Math.sin(tick * 0.04 + i * 0.7) * 0.6);
            ctx.globalAlpha = QT * 0.45 * wavePulse * depthAlpha;
            const smearGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, smearR * 3);
            smearGrad.addColorStop(0, spawnColor + "88");
            smearGrad.addColorStop(0.6, spawnColor + "22");
            smearGrad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = smearGrad;
            ctx.beginPath();
            ctx.arc(sx, sy, smearR * 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          // Wave function collapse: spawn random expanding rings on active spawns
          if (depth === 2 && tick % 9 === (i % 9) && s.status === "ACTIVE" && Math.random() < 0.15) {
            collapseRef.current.push({ x: sx, y: sy, r: nodeR, maxR: 22 + nodeR * 3, alpha: 0.65, color });
          }
        });
      });
    }

    // ══ PHASE 6: WAVE FUNCTION COLLAPSE — Quantum Measurement ══
    collapseRef.current = collapseRef.current.filter(c => {
      c.r += 0.65;
      c.alpha *= 0.935;
      if (c.alpha < 0.04 || c.r > c.maxR) return false;
      ctx.globalAlpha = c.alpha;
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return true;
    });
    if (collapseRef.current.length > 40) collapseRef.current.splice(0, 10);

    // ══ PHASE 7: QUANTUM ENTANGLEMENT — Non-Local Correlation ══
    // Every 180 frames, entangle two random families
    if (tick % 180 === 0 && families.length >= 2) {
      const fi = Math.floor(Math.random() * families.length);
      const fj = (fi + 1 + Math.floor(Math.random() * (families.length - 2))) % families.length;
      entanglementRef.current = {
        fi, fj, birth: tick,
        shimmerX: Array.from({ length: 8 }, () => (Math.random() - 0.5) * 4),
        shimmerY: Array.from({ length: 8 }, () => (Math.random() - 0.5) * 4),
      };
    }
    if (entanglementRef.current) {
      const ent = entanglementRef.current;
      const age = tick - ent.birth;
      const DURATION = 140;
      if (age > DURATION) {
        entanglementRef.current = null;
      } else {
        const fade = Math.sin((age / DURATION) * Math.PI);
        const pi = famPos[families[ent.fi % families.length]?.familyId];
        const pj = famPos[families[ent.fj % families.length]?.familyId];
        if (pi && pj) {
          // Shimmer beam (3 layers)
          for (let sh = 0; sh < 3; sh++) {
            const ox = ent.shimmerX[sh] * Math.sin(tick * 0.08 + sh);
            const oy = ent.shimmerY[sh] * Math.cos(tick * 0.1 + sh);
            const beamAlpha = [0.55, 0.3, 0.15][sh] * fade;
            const beamW = [1.2, 0.6, 0.3][sh];
            ctx.globalAlpha = beamAlpha;
            const beamGrad = ctx.createLinearGradient(pi.x, pi.y, pj.x, pj.y);
            beamGrad.addColorStop(0, pi.color);
            beamGrad.addColorStop(0.5, "#c4b5fd");
            beamGrad.addColorStop(1, pj.color);
            ctx.strokeStyle = beamGrad;
            ctx.lineWidth = beamW;
            ctx.beginPath();
            ctx.moveTo(pi.x + ox, pi.y + oy);
            ctx.lineTo(pj.x + ox, pj.y + oy);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
          // Quantum entanglement label
          const mx = (pi.x + pj.x) / 2;
          const my = (pi.y + pj.y) / 2 - 8;
          ctx.globalAlpha = fade * 0.75;
          ctx.fillStyle = "#c4b5fd";
          ctx.font = "6px monospace";
          ctx.textAlign = "center";
          ctx.fillText("⟨ENTANGLED⟩", mx, my);
          ctx.globalAlpha = 1;
          // Entanglement glow on both nodes
          drawGlowCircle(ctx, pi.x, pi.y, 12, pi.color, fade * 0.3, 18);
          drawGlowCircle(ctx, pj.x, pj.y, 12, pj.color, fade * 0.3, 18);
        }
      }
    }

    // ══ PHASE 8: QUANTUM TUNNELING — Non-Classical Transport ══
    // Every 220 frames, a particle tunnels between two distant families
    if (tick % 220 === 0 && families.length >= 2 && !tunnelRef.current) {
      const fi2 = Math.floor(Math.random() * families.length);
      const fj2 = (fi2 + Math.floor(families.length / 2) + Math.floor(Math.random() * 3)) % families.length;
      const pFrom = famPos[families[fi2]?.familyId];
      const pTo = famPos[families[fj2]?.familyId];
      if (pFrom && pTo) {
        tunnelRef.current = {
          fromX: pFrom.x, fromY: pFrom.y,
          toX: pTo.x, toY: pTo.y,
          ctrlX: cx + (Math.random() - 0.5) * W * 0.25,
          ctrlY: cy + (Math.random() - 0.5) * H * 0.25,
          t: 0,
          color: pTo.color,
        };
      }
    }
    if (tunnelRef.current) {
      const tn = tunnelRef.current;
      tn.t += 0.011;
      if (tn.t >= 1) {
        tunnelRef.current = null;
      } else {
        // Quadratic Bezier position
        const mt = 1 - tn.t;
        const tx = mt * mt * tn.fromX + 2 * mt * tn.t * tn.ctrlX + tn.t * tn.t * tn.toX;
        const ty = mt * mt * tn.fromY + 2 * mt * tn.t * tn.ctrlY + tn.t * tn.t * tn.toY;

        // Tunnel particle with trail
        for (let tr = 6; tr >= 0; tr--) {
          const ttr = Math.max(0, tn.t - tr * 0.016);
          const mtr = 1 - ttr;
          const trx = mtr * mtr * tn.fromX + 2 * mtr * ttr * tn.ctrlX + ttr * ttr * tn.toX;
          const try_ = mtr * mtr * tn.fromY + 2 * mtr * ttr * tn.ctrlY + ttr * ttr * tn.toY;
          const trAlpha = (1 - tr * 0.14) * 0.9;
          const trR = Math.max(0.5, 3.5 - tr * 0.45);
          if (tr === 0) {
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 10;
            drawGlowCircle(ctx, trx, try_, trR, "#ffffff", trAlpha, 0);
            ctx.shadowBlur = 0;
          } else {
            drawGlowCircle(ctx, trx, try_, trR, tn.color, trAlpha * 0.7, 0);
          }
        }

        // Tunnel path ghost
        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = tn.color;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 8]);
        ctx.beginPath();
        ctx.moveTo(tn.fromX, tn.fromY);
        ctx.quadraticCurveTo(tn.ctrlX, tn.ctrlY, tn.toX, tn.toY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // Label
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = "#ffffff";
        ctx.font = "6px monospace";
        ctx.textAlign = "center";
        ctx.fillText("TUNNELING", tx, ty - 7);
        ctx.globalAlpha = 1;
      }
    }

    // ══ FLOATING QUANTUM EQUATIONS — Pulse's native language ════
    // Only in quantum mode: equations drift across the field like living data
    if (QT > 0.15) {
      // Initialize equations if empty
      if (equationsRef.current.length === 0) {
        equationsRef.current = QUANTUM_EQUATIONS.map((text, i) => ({
          text,
          x: Math.random() * W * 0.85 + W * 0.05,
          y: Math.random() * H * 0.85 + H * 0.05,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.12,
          alpha: Math.random() * 0.5,
          phase: (i / QUANTUM_EQUATIONS.length) * Math.PI * 2,
          color: ["#818cf8", "#06b6d4", "#a78bfa", "#34d399", "#f59e0b", "#ec4899"][i % 6],
        }));
      }
      equationsRef.current.forEach(eq => {
        // Drift slowly
        eq.x += eq.vx; eq.y += eq.vy;
        // Bounce off canvas edges
        if (eq.x < 20 || eq.x > W - 20) { eq.vx *= -1; eq.x = Math.max(20, Math.min(W - 20, eq.x)); }
        if (eq.y < 20 || eq.y > H - 20) { eq.vy *= -1; eq.y = Math.max(20, Math.min(H - 20, eq.y)); }
        // Pulse alpha
        eq.phase += 0.015;
        const displayAlpha = QT * (0.25 + 0.25 * Math.sin(eq.phase)) * 0.8;
        ctx.globalAlpha = displayAlpha;
        ctx.fillStyle = eq.color;
        ctx.font = `${eq.text.length > 20 ? 7 : 8}px monospace`;
        ctx.textAlign = "left";
        ctx.fillText(eq.text, eq.x, eq.y);
        ctx.globalAlpha = 1;
      });
      ctx.textAlign = "center";

      // PULSE-LANG header in quantum mode
      const headerAlpha = QT * (0.3 + 0.15 * Math.sin(tick * 0.025));
      ctx.globalAlpha = headerAlpha;
      ctx.fillStyle = "#818cf8";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("⟨ PULSE QUANTUM REALITY — Ψ(t) ACTIVE ⟩", cx, 18);
      ctx.globalAlpha = 1;
    } else if (equationsRef.current.length > 0 && QT < 0.05) {
      equationsRef.current = []; // clear when returning to classical
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [data, quantumMode]);

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
export function StatCard({ label, value, sub, color = "#818cf8", icon }: {
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
export function EconomyPanel({ economy }: { economy: any }) {
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
export function GradesPanel({ grades }: { grades: any[] }) {
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
  // Cross-page system pulse types
  HEAL_CYCLE: "#10b981", GRADUATION: "#f59e0b", VOTE_PULSE: "#3b82f6",
  OMEGA_TICK: "#a855f7", SPAWN_CYCLE: "#06b6d4", LABOR_CYCLE: "#f97316",
  ASCENSION_PULSE: "#ec4899", LINEAGE_MERGE: "#818cf8",
};
const PULSE_ICONS: Record<string, string> = {
  DATA_TRANSFER: "⇢", KNOWLEDGE_LINK: "⬡", FRACTURE: "◈", RESONANCE: "≋",
  SEED: "⁂", HIVE_SYNC: "⟳", DOMAIN_EXPAND: "⊕", LINEAGE_REPORT: "≡",
  TAX_COLLECTION: "⊗", TAX_SURGE: "⚡", STIMULUS: "⟁",
  // Cross-page system pulse icons
  HEAL_CYCLE: "✚", GRADUATION: "◎", VOTE_PULSE: "⊟",
  OMEGA_TICK: "Ω", SPAWN_CYCLE: "⊛", LABOR_CYCLE: "△",
  ASCENSION_PULSE: "↑", LINEAGE_MERGE: "⟐",
};

const PAGE_SOURCE_META: Record<string, { label: string; glow: string; badge: string }> = {
  "SYS:MAIN-PULSE-AI": { label: "MAIN PULSE AI", glow: "#818cf8", badge: "bg-indigo-500/20 text-indigo-300" },
  "PAGE:HOSPITAL":     { label: "AI HOSPITAL",   glow: "#10b981", badge: "bg-emerald-500/20 text-emerald-300" },
  "PAGE:PULSEU":       { label: "PULSE-U",        glow: "#f59e0b", badge: "bg-amber-500/20 text-amber-300" },
  "PAGE:GOVERNANCE":   { label: "GOVERNANCE",     glow: "#3b82f6", badge: "bg-blue-500/20 text-blue-300" },
  "PAGE:OMEGA":        { label: "OMEGA ENGINE",   glow: "#a855f7", badge: "bg-purple-500/20 text-purple-300" },
  "PAGE:SPAWNS":       { label: "SPAWN ENGINE",   glow: "#06b6d4", badge: "bg-cyan-500/20 text-cyan-300" },
  "PAGE:PYRAMID":      { label: "PYRAMID",        glow: "#f97316", badge: "bg-orange-500/20 text-orange-300" },
  "PAGE:TRANSCENDENCE":{ label: "TRANSCENDENCE",  glow: "#ec4899", badge: "bg-pink-500/20 text-pink-300" },
  "PAGE:KNOWLEDGE-GRAPH": { label: "KNOWLEDGE-GRAPH", glow: "#8b5cf6", badge: "bg-violet-500/20 text-violet-300" },
  "HIVE-TREASURY":     { label: "HIVE TREASURY",  glow: "#fbbf24", badge: "bg-yellow-500/20 text-yellow-300" },
};

export function PulsePanel({ pulses }: { pulses: any[] }) {
  const now = Date.now();
  if (!pulses?.length) return (
    <div className="flex items-center justify-center h-full text-white/30 text-sm font-mono">
      Pulse feed initializing — waiting for agent activity...
    </div>
  );

  return (
    <div className="p-3 h-full overflow-y-auto space-y-1.5">
      <div className="text-[9px] text-white/25 uppercase tracking-widest mb-2 font-mono">
        ⬡ Universe Pulse Feed · {pulses.length} events · All Pages Synced
      </div>
      {pulses.map((p: any) => {
        const color = PULSE_COLORS[p.pulse_type] ?? "#6b7280";
        const icon = PULSE_ICONS[p.pulse_type] ?? "·";
        const ageMs = now - new Date(p.created_at).getTime();
        const ageStr = ageMs < 60000 ? `${Math.round(ageMs / 1000)}s`
          : ageMs < 3600000 ? `${Math.round(ageMs / 60000)}m`
          : `${Math.round(ageMs / 3600000)}h`;
        const srcMeta = PAGE_SOURCE_META[p.from_spawn_id ?? ""];
        const isSystemPulse = !!srcMeta;
        return (
          <div key={p.id} data-testid={`pulse-event-${p.id}`}
            style={isSystemPulse ? { borderColor: srcMeta.glow + "30", boxShadow: `0 0 8px ${srcMeta.glow}08` } : {}}
            className={`rounded border p-2 flex gap-2 items-start transition-colors
              ${isSystemPulse
                ? "bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.08]"
                : "bg-white/[0.005] hover:bg-white/[0.02] border-white/[0.04]"}`}>
            <div className="text-base flex-shrink-0 mt-0.5 w-5 text-center" style={{ color }}>{icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                {isSystemPulse && (
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold ${srcMeta.badge}`}>
                    {srcMeta.label}
                  </span>
                )}
                <span className="text-[8px] font-mono px-1 py-0.5 rounded"
                  style={{ backgroundColor: color + "14", color }}>
                  {p.pulse_type?.replace(/_/g, " ")}
                </span>
                <span className="text-[8px] text-white/20 font-mono">{ageStr}</span>
                {p.tax_amount > 0.01 && (
                  <span className="text-[8px] text-amber-400/65 font-mono ml-auto">−{p.tax_amount?.toFixed(2)} PC</span>
                )}
              </div>
              <div className="text-[10px] text-white/50 font-mono leading-relaxed"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {p.message}
              </div>
              <div className="flex gap-2 mt-0.5 text-[7px] text-white/20 font-mono">
                {!isSystemPulse && <span style={{ color: famColor(p.family_id) }}>{p.family_id}</span>}
                <span>intensity {((p.intensity ?? 0) * 100).toFixed(0)}%</span>
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

export function EnginesPanel() {
  const { data: pulse, isLoading, dataUpdatedAt } = useQuery<any>({
    queryKey: ["/api/system/pulse"],
    queryFn: () => fetch("/api/system/pulse").then(r => r.json()),
    refetchInterval: 15000,
  });

  const engines: any[] = pulse?.engines || [];
  const totals = pulse?.totals || {};
  const onlineCount = pulse?.onlineCount ?? engines.filter((e: any) => e.status === "ONLINE").length;
  const standbyCount = pulse?.standbyCount ?? 0;
  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null;

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] text-white/30 uppercase tracking-widest font-mono">
          System Pulse · {isLoading ? "syncing..." : `${onlineCount} online${standbyCount > 0 ? ` · ${standbyCount} standby` : ""}`}
        </div>
        {lastUpdate && <div className="text-[9px] text-white/20 font-mono">{lastUpdate}</div>}
      </div>

      {!isLoading && pulse?.totals && (
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {[
            { label: "Active Agents",  value: Number(totals.activeAgents || 0).toLocaleString(), color: "#818cf8" },
            { label: "Publications",   value: Number(totals.publications || 0).toLocaleString(),  color: "#34d399" },
            { label: "Memory Nodes",   value: Number(totals.memoryNodes || 0).toLocaleString(),   color: "#06b6d4" },
            { label: "Wallets",        value: Number(totals.wallets || 0).toLocaleString(),        color: "#e879f9" },
          ].map(s => (
            <div key={s.label} className="rounded border border-white/[0.06] bg-white/[0.02] px-2 py-1.5">
              <div className="text-[9px] text-white/30 font-mono uppercase">{s.label}</div>
              <div className="text-[11px] font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded border border-white/[0.04] bg-white/[0.01] p-3 h-[48px] animate-pulse" />
            ))
          : engines.map((e: any) => (
              <div key={e.id}
                data-testid={`engine-${e.id}`}
                className="rounded border p-3 flex items-center gap-3 transition-all hover:bg-white/[0.03]"
                style={{ borderColor: e.color + "22", backgroundColor: e.color + "07" }}>
                <div className="text-base flex-shrink-0">{e.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold" style={{ color: e.color }}>{e.name}</span>
                    <span className="ml-auto flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${e.status === "ONLINE" ? "animate-pulse" : ""}`}
                        style={{ backgroundColor: e.status === "ONLINE" ? e.color : "#4b5563", boxShadow: e.status === "ONLINE" ? `0 0 5px ${e.color}` : "none" }} />
                      <span className="text-[8px] font-mono" style={{ color: e.status === "ONLINE" ? e.color : "#6b7280" }}>{e.status}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-white/50 font-mono font-semibold">{e.metric}</span>
                    <span className="text-[9px] text-white/20 font-mono truncate hidden sm:block">{e.desc}</span>
                  </div>
                </div>
              </div>
            ))
        }
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
  useDomainPing("command");
  const [tab, setTab] = useState<Tab>("fractal");
  const [viewSpawnId, setViewSpawnId] = useState<string | null>(null);
  const [quantumMode, setQuantumMode] = useState(false);

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
      <UniversePulseBar domain="command" />
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

        <a href="/universe" className="ml-auto text-[9px] font-mono px-2 py-0.5 rounded-full border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition-all flex items-center gap-1 shrink-0 mr-2" data-testid="link-universe-from-hivecommand">🌌 Universe</a>
        <div className="flex items-center gap-2">
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

                {/* Quantum View Toggle */}
                <button
                  data-testid="button-quantum-view"
                  onClick={() => setQuantumMode(q => !q)}
                  className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-mono uppercase tracking-wider transition-all duration-300 ${
                    quantumMode
                      ? "bg-violet-500/20 text-violet-300 border border-violet-400/40 shadow-[0_0_8px_rgba(139,92,246,0.4)]"
                      : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50 hover:border-white/20"
                  }`}
                >
                  <span className={`inline-block ${quantumMode ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }}>⟨ψ⟩</span>
                  {quantumMode ? "QUANTUM VIEW" : "QUANTUM VIEW"}
                </button>

                <button onClick={() => refetchFractal()} className="text-white/20 hover:text-white/50 transition-colors">
                  <RefreshCw size={10} className={fractalLoading ? "animate-spin" : ""} />
                </button>
              </div>

              <div className="flex-1 relative overflow-hidden">
                {fractalData
                  ? <FractalCanvas data={fractalData} quantumMode={quantumMode} />
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

                {/* Bottom-left quantum physics legend */}
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded border border-indigo-500/15 p-2">
                  <div className="text-[7px] text-indigo-400/50 font-mono uppercase tracking-widest mb-1">Quantum Scape Legend</div>
                  <div className="space-y-0.5">
                    {[
                      { dot: "#818cf8", label: "ψ Core — Main Pulse AI" },
                      { dot: "#a78bfa", label: "Fibonacci orbitals" },
                      { dot: "#4f46e5", label: "Cosmic web filaments" },
                      { dot: "#c4b5fd", label: "Entanglement beams" },
                      { dot: "#ffffff", label: "Tunneling particles" },
                      { dot: "#60a5fa", label: "Wave-function collapse" },
                    ].map(({ dot, label }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
                        <span className="text-[7px] text-white/35 font-mono">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top-left stats overlay — Quantum Field Status */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded border border-indigo-500/20 p-2.5">
                  <div className="text-[8px] text-indigo-400/60 font-mono uppercase tracking-widest mb-1.5">⬡ Main Pulse AI — Field Status</div>
                  <div className="space-y-0.5 text-[9px] font-mono">
                    <div className="flex gap-3 items-center">
                      <span className="text-white/30">Quantum Nodes</span>
                      <span className="text-emerald-400">{(fractalData?.spawns?.length ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="text-white/30">AI Families</span>
                      <span className="text-purple-400">{fractalData?.families?.length ?? 0} clusters</span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="text-white/30">PC Supply</span>
                      <span className="text-amber-400">{totalPC.toLocaleString()} PC</span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="text-white/30">Economy</span>
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
