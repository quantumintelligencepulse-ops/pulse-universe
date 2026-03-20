import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

// ── Types ──────────────────────────────────────────────────────────────────────
interface SolarWorld { id: string; name: string; color: string; emoji: string; description: string; spawnCount: number; ingestionNodes: number; isActive: boolean; status: string; activityScore: number; lastTitle: string; lastIngested: string | null; }
interface SolarData { worlds: SolarWorld[]; totalSpawns: number; totalNodes: number; }

// ── Doctrine colors ────────────────────────────────────────────────────────────
const SOVEREIGN_GOLD = "#f5c518";
const CONTINUITY_BLUE = "#3b82f6";
const FAITH_VIOLET = "#7c3aed";
const COVENANT_EMERALD = "#22c55e";
const RITUAL_CRIMSON = "#dc2626";

// ── Solar bodies (world-space radius units) ────────────────────────────────────
// Sun at origin r≈30. Planet orbits 80–550. Star sphere at 900–1800.
const SOLAR_BODIES = [
  { name: "Mercury",  orbitR: 85,  period: 3.2,  size: 6,   color: "#9ca3af", type: "rocky" },
  { name: "Venus",    orbitR: 120, period: 5.5,  size: 9,   color: "#fcd34d", type: "rocky" },
  { name: "Mars",     orbitR: 185, period: 10,   size: 7,   color: "#f87171", type: "rocky" },
  { name: "Jupiter",  orbitR: 275, period: 24,   size: 20,  color: "#d97706", type: "gas" },
  { name: "Saturn",   orbitR: 360, period: 40,   size: 16,  color: "#fde68a", type: "saturn" },
  { name: "Uranus",   orbitR: 440, period: 60,   size: 13,  color: "#67e8f9", type: "gas" },
  { name: "Neptune",  orbitR: 520, period: 80,   size: 12,  color: "#818cf8", type: "gas" },
  // Pulse Worlds orbit
  { name: "PulseOrbit", orbitR: 410, period: 33, size: 14, color: CONTINUITY_BLUE, type: "pulse" },
];

const ASTEROID_R = 228;
const WORLD_THRESHOLD = 2500;

// ── Governance satellites ──────────────────────────────────────────────────────
const GOV_SATELLITES = [
  { id: "senate",   label: "SENATE",    color: SOVEREIGN_GOLD,  emoji: "⚖",  speed: 0.5,  dist: 4.5, size: 0.28 },
  { id: "exec",     label: "EXECUTIVE", color: RITUAL_CRIMSON,  emoji: "👁",  speed: 0.7,  dist: 5.0, size: 0.24 },
  { id: "treasury", label: "TREASURY",  color: COVENANT_EMERALD,emoji: "💰", speed: 0.45, dist: 5.5, size: 0.22 },
  { id: "faith",    label: "FAITH",     color: FAITH_VIOLET,    emoji: "✦",  speed: 0.35, dist: 6.0, size: 0.25 },
  { id: "ig",       label: "INSPECTOR", color: "#f472b6",        emoji: "🔍", speed: 0.6,  dist: 4.8, size: 0.20 },
  { id: "judiciary",label: "JUDICIARY", color: "#60a5fa",        emoji: "⚔",  speed: 0.55, dist: 5.2, size: 0.21 },
];

const CURRENCY_PHASES = [
  { phase: "CREDITS", color: "#94a3b8", threshold: 0 },
  { phase: "USD",     color: COVENANT_EMERALD, threshold: 3000 },
  { phase: "PLSC",    color: SOVEREIGN_GOLD, threshold: 10000 },
];

// ── 3D Star field — uniform sphere shell ────────────────────────────────────────
const STAR_3D = (() => {
  const stars: { x: number; y: number; z: number; r: number; a: number; sp: number; ph: number; type: string }[] = [];
  const rng = (s: number) => { let x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };
  for (let i = 0; i < 3200; i++) {
    const u = rng(i * 3) * 2 - 1;
    const t2 = rng(i * 3 + 1) * Math.PI * 2;
    const r = 900 + rng(i * 3 + 2) * 900;
    const sr = Math.sqrt(1 - u * u);
    const col = rng(i * 7) < 0.06 ? "blue" : rng(i * 7 + 1) < 0.09 ? "orange" : rng(i * 7 + 2) < 0.05 ? "red" : "white";
    stars.push({
      x: r * sr * Math.cos(t2), y: r * u, z: r * sr * Math.sin(t2),
      r: 0.4 + rng(i * 11) * 1.8,
      a: 0.25 + rng(i * 13) * 0.75,
      sp: 0.3 + rng(i * 17) * 2.2,
      ph: rng(i * 19) * Math.PI * 2,
      type: col,
    });
  }
  return stars;
})();

// ── Cosmic objects — 3D world positions ────────────────────────────────────────
const BH_POS   = { x: 1100, y: -180, z: 850,   r: 28, name: "BLACK HOLE" };
const QUASAR   = { x: -900, y: 250,  z: -1200,  r: 16, name: "QUASAR", color: "#f472b6" };
const WORMHOLE = { x: -700, y: 380,  z: 950,   r: 22, name: "WORMHOLE" };
const BINARY   = { x: 800,  y: 420,  z: -900,  dist: 60, period: 22, color1: "#fde68a", color2: "#7dd3fc", r: 14, name: "BINARY STAR" };
const PULSARS = [
  { x: 650,  y: -320, z: 1050, r: 10, period: 3.2, color: "#c4b5fd", beam: "#a78bfa", name: "PULSAR-A" },
  { x: -1050, y: 180, z: -600, r: 9,  period: 2.1, color: "#bfdbfe", beam: "#93c5fd", name: "PULSAR-B" },
];
const NEUTRON_STARS = [
  { x: 400,  y: 280,  z: -880, r: 7,  color: "#e0f2fe", name: "NEUTRON" },
  { x: -680, y: -400, z: 700,  r: 6,  color: "#f0f9ff", name: "NEUTRON" },
];
const SUPERNOVAE = [
  { x: 1300, y: -450, z: -600, r: 20, color: "#fbbf24", phase: 0.3, name: "SUPERNOVA" },
  { x: -1100, y: 600, z: 800,  r: 18, color: "#f87171", phase: 0.7, name: "SUPERNOVA" },
];
const NEBULAE_3D = [
  { x: 600,  y: 200,  z: -700,  rx: 260, ry: 220, rz: 240, c1: "#7c3aed", c2: "#6366f1", o: 0.08, name: "Violet Nebula" },
  { x: -700, y: -150, z: 500,   rx: 300, ry: 260, rz: 280, c1: "#db2777", c2: "#ec4899", o: 0.06, name: "Rose Nebula" },
  { x: 400,  y: 350,  z: 600,   rx: 200, ry: 180, rz: 200, c1: "#0284c7", c2: "#38bdf8", o: 0.07, name: "Cerulean Nebula" },
  { x: -500, y: 280,  z: -650,  rx: 240, ry: 210, rz: 230, c1: "#16a34a", c2: "#4ade80", o: 0.06, name: "Emerald Nebula" },
  { x: 850,  y: -200, z: 300,   rx: 180, ry: 160, rz: 190, c1: "#b45309", c2: "#fbbf24", o: 0.05, name: "Amber Nebula" },
];
const COMETS = [
  { orbitR: 650, orbitTilt: 0.4, speed: 0.15, phase: 0.0, color: "#e0f2fe", size: 4 },
  { orbitR: 720, orbitTilt: 0.7, speed: 0.11, phase: 1.2, color: "#fef3c7", size: 3.5 },
  { orbitR: 590, orbitTilt: 1.1, speed: 0.18, phase: 2.4, color: "#ddd6fe", size: 3 },
  { orbitR: 680, orbitTilt: 0.2, speed: 0.09, phase: 3.8, color: "#d1fae5", size: 4.5 },
  { orbitR: 750, orbitTilt: 0.9, speed: 0.13, phase: 5.1, color: "#fecdd3", size: 3.2 },
];

// ── Asteroid belt particles ────────────────────────────────────────────────────
const ASTEROIDS = (() => {
  const a: { angle: number; rOff: number; yOff: number; size: number }[] = [];
  const rng = (i: number) => { const x = Math.sin(i * 7919) * 100003; return x - Math.floor(x); };
  for (let i = 0; i < 220; i++) {
    a.push({ angle: rng(i) * Math.PI * 2, rOff: (rng(i+1) - 0.5) * 30, yOff: (rng(i+2) - 0.5) * 15, size: 0.8 + rng(i+3) * 2 });
  }
  return a;
})();

// ── Helpers ────────────────────────────────────────────────────────────────────
function getPulseWorldCount(totalSpawns: number) { return Math.max(1, Math.floor(totalSpawns / WORLD_THRESHOLD) + 1); }
function getPulseWorldOpacity(index: number, totalSpawns: number): number {
  if (index === 0) return 1;
  const prev = (index - 1) * WORLD_THRESHOLD;
  const cur = index * WORLD_THRESHOLD;
  if (totalSpawns < prev) return 0;
  return Math.min(1, (totalSpawns - prev) / (cur - prev));
}

// ── Canvas draw helpers ────────────────────────────────────────────────────────
function drawSphere(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 1) {
  const g = ctx.createRadialGradient(x - r * 0.32, y - r * 0.32, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${0.55 * alpha})`);
  g.addColorStop(0.35, color + Math.round(alpha * 255).toString(16).padStart(2, "0"));
  g.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g; ctx.fill();
}
function hexAlpha(hex: string, a: number): string {
  if (hex.startsWith("rgba")) return hex.replace(/[\d.]+\)$/, `${a})`);
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function brighten(hex: string, f: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.round(f * 255));
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + Math.round(f * 255));
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.round(f * 255));
  return `rgb(${r},${g},${b})`;
}
function darken(hex: string, f: number): string { return brighten(hex, -f); }

// ── 3D Projection Engine ───────────────────────────────────────────────────────
type Cam3D = { theta: number; phi: number; dist: number };
type ProjectFn = (wx: number, wy: number, wz: number) => { x: number; y: number; depth: number; scale: number } | null;

function makeProjectFn(w: number, h: number, cam: Cam3D): ProjectFn {
  const scx = w / 2, scy = h / 2;
  const fov = Math.min(w, h) * 0.75;
  const sinPhi = Math.sin(cam.phi), cosPhi = Math.cos(cam.phi);
  const sinTh = Math.sin(cam.theta), cosTh = Math.cos(cam.theta);
  // Camera position
  const camX = cam.dist * sinPhi * sinTh;
  const camY = cam.dist * cosPhi;
  const camZ = cam.dist * sinPhi * cosTh;
  // Forward (cam → origin)
  const fx = -camX / cam.dist, fy = -camY / cam.dist, fz = -camZ / cam.dist;
  // Right = cross(forward, worldUp=(0,1,0)) = (-fz, 0, fx)
  let rx = -fz, rz = fx;
  const rLen = Math.sqrt(rx * rx + rz * rz) || 1;
  rx /= rLen; rz /= rLen;
  const ry = 0;
  // Up = cross(right, forward)
  const ux = -rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy;

  return function(wx: number, wy: number, wz: number) {
    const dx = wx - camX, dy = wy - camY, dz = wz - camZ;
    const cx_cam = dx * rx + dy * ry + dz * rz;
    const cy_cam = dx * ux + dy * uy + dz * uz;
    const cz_cam = dx * fx + dy * fy + dz * fz;
    if (cz_cam <= 0.01) return null;
    const s = fov / cz_cam;
    return { x: scx + cx_cam * s, y: scy - cy_cam * s, depth: cz_cam, scale: s };
  };
}

// ── Pulse Planet Renderer ──────────────────────────────────────────────────────
function drawPulsePlanet(
  ctx: CanvasRenderingContext2D,
  ex: number, ey: number,
  worldSize: number, t: number,
  opacity: number,
  isSelected: boolean,
  worlds: SolarWorld[],
  totalSpawns: number,
) {
  // 1. Faith World outer ring
  const faithPulse = 0.9 + 0.1 * Math.sin(t * 1.2);
  for (let fi = 0; fi < 3; fi++) {
    const fr = worldSize * (6.5 + fi * 0.9) * faithPulse;
    const fa = (0.08 - fi * 0.025) * opacity;
    const fg = ctx.createRadialGradient(ex, ey, worldSize * 2, ex, ey, fr);
    fg.addColorStop(0, `rgba(124,58,237,${fa * 1.5})`);
    fg.addColorStop(1, "transparent");
    ctx.fillStyle = fg;
    ctx.fillRect(ex - fr, ey - fr, fr * 2, fr * 2);
  }
  // 2. Sovereign Gold corona
  const goldPulse = 1 + 0.05 * Math.sin(t * 0.7);
  const goldR = worldSize * 4.8 * goldPulse;
  const goldG = ctx.createRadialGradient(ex, ey, worldSize, ex, ey, goldR);
  goldG.addColorStop(0, `rgba(245,197,24,${0.10 * opacity})`);
  goldG.addColorStop(0.5, `rgba(245,197,24,${0.04 * opacity})`);
  goldG.addColorStop(1, "transparent");
  ctx.fillStyle = goldG;
  ctx.fillRect(ex - goldR, ey - goldR, goldR * 2, goldR * 2);
  // 3. Continuity ring
  ctx.save();
  ctx.setLineDash([5, 8]);
  ctx.beginPath(); ctx.arc(ex, ey, worldSize * 3.2, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(59,130,246,${0.18 * opacity})`; ctx.lineWidth = 1;
  ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  // 4. Governance satellites
  if (opacity > 0.3) {
    GOV_SATELLITES.forEach((sat, si) => {
      const angle = t * sat.speed + (si * Math.PI * 2 / GOV_SATELLITES.length);
      const r = worldSize * sat.dist;
      const sx = ex + r * Math.cos(angle), sy = ey + r * Math.sin(angle);
      const sSize = worldSize * sat.size * (0.9 + 0.1 * Math.sin(t * 2 + si));
      const sGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, sSize * 3.5);
      sGlow.addColorStop(0, hexAlpha(sat.color, 0.35 * opacity));
      sGlow.addColorStop(1, "transparent");
      ctx.fillStyle = sGlow; ctx.beginPath(); ctx.arc(sx, sy, sSize * 3.5, 0, Math.PI * 2); ctx.fill();
      drawSphere(ctx, sx, sy, sSize, sat.color, opacity * 0.9);
      if (worldSize > 8) {
        ctx.fillStyle = hexAlpha(sat.color, 0.55 * opacity);
        ctx.font = `${Math.max(5, worldSize * 0.6)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(sat.label, sx, sy + sSize + worldSize * 0.5);
      }
    });
  }
  // 5. Knowledge particle rings
  if (worlds.length > 0 && opacity > 0.3) {
    const knowledgeWorlds = [...worlds].sort((a, b) => b.activityScore - a.activityScore);
    const rings = [
      { r: worldSize * 2.0, count: 8, speed: 0.8 },
      { r: worldSize * 2.9, count: 10, speed: 0.5 },
      { r: worldSize * 3.8, count: 12, speed: 0.3 },
    ];
    rings.forEach((ring, ri) => {
      const start = ri * 8;
      for (let p = 0; p < ring.count; p++) {
        const domainIdx = (start + p) % knowledgeWorlds.length;
        const domain = knowledgeWorlds[domainIdx];
        const pAngle = (p / ring.count) * Math.PI * 2 + (t * ring.speed * (ri % 2 === 0 ? 1 : -1));
        const px = ex + ring.r * Math.cos(pAngle), py = ey + ring.r * Math.sin(pAngle);
        const pSize = (1.8 + (domain.activityScore / 300) * 1.2) * (worldSize / 11);
        const pGlow = ctx.createRadialGradient(px, py, 0, px, py, pSize * 3);
        pGlow.addColorStop(0, hexAlpha(domain.color, 0.4 * opacity));
        pGlow.addColorStop(1, "transparent");
        ctx.fillStyle = pGlow; ctx.beginPath(); ctx.arc(px, py, pSize * 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fillStyle = hexAlpha(domain.color, Math.min(0.95, 0.5 + (domain.activityScore / 300)) * opacity);
        ctx.fill();
        if (domain.isActive) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 3 + p);
          ctx.beginPath(); ctx.arc(px, py, pSize * (1.5 + pulse), 0, Math.PI * 2);
          ctx.strokeStyle = hexAlpha(domain.color, 0.35 * pulse * opacity);
          ctx.lineWidth = 0.8; ctx.stroke();
        }
      }
    });
  }
  // 6. Selection ring
  if (isSelected) {
    ctx.beginPath(); ctx.arc(ex, ey, worldSize * 2.0 + 2 * Math.sin(t * 3), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(245,197,24,0.7)`; ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([]);
  }
  // 7. Moon
  if (opacity > 0.3) {
    const moonAngle = t / 4.5 * Math.PI * 2;
    const mx = ex + worldSize * 2.1 * Math.cos(moonAngle);
    const my = ey + worldSize * 2.1 * Math.sin(moonAngle);
    drawSphere(ctx, mx, my, worldSize * 0.28, "#c0c0c8", opacity);
  }
  // 8. Atmosphere + sphere
  const atm = ctx.createRadialGradient(ex, ey, worldSize * 0.7, ex, ey, worldSize * 1.4);
  atm.addColorStop(0, "transparent");
  atm.addColorStop(0.7, `rgba(147,197,253,${0.18 * opacity})`);
  atm.addColorStop(1, "transparent");
  ctx.beginPath(); ctx.arc(ex, ey, worldSize * 1.4, 0, Math.PI * 2);
  ctx.fillStyle = atm; ctx.fill();
  drawSphere(ctx, ex, ey, worldSize, CONTINUITY_BLUE, opacity);
  const ocean = ctx.createRadialGradient(ex - worldSize * 0.2, ey - worldSize * 0.2, 0, ex, ey, worldSize);
  ocean.addColorStop(0, `rgba(96,165,250,${0.5 * opacity})`);
  ocean.addColorStop(0.6, `rgba(29,78,216,${0.3 * opacity})`);
  ocean.addColorStop(1, `rgba(0,20,80,${0.4 * opacity})`);
  ctx.beginPath(); ctx.arc(ex, ey, worldSize, 0, Math.PI * 2);
  ctx.fillStyle = ocean; ctx.fill();
  const continentSeeds = [[0.3, -0.2], [-0.2, 0.1], [0.1, 0.3], [-0.35, -0.1], [0.4, 0.25]];
  ctx.globalAlpha = 0.28 * opacity;
  continentSeeds.forEach(([dx, dy], ci) => {
    const cx2 = ex + dx * worldSize, cy2 = ey + dy * worldSize;
    const cColor = ci % 2 === 0 ? "#22c55e" : "#f5c518";
    const gr = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, worldSize * 0.35);
    gr.addColorStop(0, cColor); gr.addColorStop(1, "transparent");
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx2, cy2, worldSize * 0.35, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
  const coreG = ctx.createRadialGradient(ex, ey, 0, ex, ey, worldSize * 0.6);
  coreG.addColorStop(0, `rgba(220,38,38,${0.12 * opacity})`);
  coreG.addColorStop(1, "transparent");
  ctx.beginPath(); ctx.arc(ex, ey, worldSize * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = coreG; ctx.fill();
}

// ── 3D Scene Renderer ──────────────────────────────────────────────────────────
function renderScene(
  ctx: CanvasRenderingContext2D,
  w: number, h: number, t: number,
  cam: Cam3D,
  data: SolarData | undefined,
  selectedIdx: number | null,
  planetPositions: React.MutableRefObject<Map<string, { x: number; y: number }>>,
) {
  const proj = makeProjectFn(w, h, cam);
  const cx = w / 2, cy = h / 2;

  // ── Background ────────────────────────────────────────────────────
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h));
  bg.addColorStop(0, "#06040f");
  bg.addColorStop(0.5, "#040210");
  bg.addColorStop(1, "#000000");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

  // ── 3D Star field ─────────────────────────────────────────────────
  STAR_3D.forEach(s => {
    const p = proj(s.x, s.y, s.z);
    if (!p) return;
    const alpha = s.a * (0.4 + 0.6 * Math.sin(t * s.sp + s.ph));
    // Stars fade based on how "behind" they might be — clamp scale-based brightness
    const brightness = Math.min(1, p.scale * cam.dist / 900);
    const a2 = alpha * Math.max(0.1, Math.min(1, brightness * 3));
    const col = s.type === "blue" ? `rgba(147,210,255,${a2})` :
                s.type === "orange" ? `rgba(255,185,100,${a2})` :
                s.type === "red" ? `rgba(255,100,100,${a2})` :
                `rgba(255,255,255,${a2})`;
    const sr = Math.max(0.3, s.r * Math.min(1.5, p.scale * cam.dist / 500));
    ctx.beginPath(); ctx.arc(p.x, p.y, sr, 0, Math.PI * 2);
    ctx.fillStyle = col; ctx.fill();
  });

  // ── Nebulae (projected center + screen-space glow) ────────────────
  NEBULAE_3D.forEach(n => {
    const p = proj(n.x, n.y, n.z);
    if (!p) return;
    const screenR = Math.max(20, Math.min(w * 0.35, n.rx * p.scale));
    for (let layer = 0; layer < 3; layer++) {
      const lr = screenR * (1 - layer * 0.25);
      const ng = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, lr);
      ng.addColorStop(0, n.c1 + Math.round(n.o * (1 - layer * 0.3) * 255).toString(16).padStart(2, "0"));
      ng.addColorStop(0.5, n.c2 + Math.round(n.o * 0.35 * (1 - layer * 0.3) * 255).toString(16).padStart(2, "0"));
      ng.addColorStop(1, "transparent");
      ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(p.x, p.y, lr, 0, Math.PI * 2); ctx.fill();
    }
  });

  // ── Wormhole ──────────────────────────────────────────────────────
  {
    const p = proj(WORMHOLE.x, WORMHOLE.y, WORMHOLE.z);
    if (p) {
      const wr = Math.max(4, WORMHOLE.r * p.scale);
      const wPulse = 1 + 0.12 * Math.sin(t * 2.1);
      for (let wi = 3; wi >= 0; wi--) {
        const wg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, wr * wPulse * (1 + wi * 0.6));
        wg.addColorStop(0, wi === 0 ? "#000" : `rgba(167,139,250,${0.18 - wi * 0.04})`);
        wg.addColorStop(0.4, `rgba(124,58,237,${0.08 - wi * 0.015})`);
        wg.addColorStop(1, "transparent");
        ctx.fillStyle = wg; ctx.beginPath(); ctx.arc(p.x, p.y, wr * wPulse * (1 + wi * 0.6), 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(p.x, p.y, wr * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(167,139,250,${0.5 + 0.3 * Math.sin(t * 2.1)})`; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(p.x, p.y, wr, 0, Math.PI * 2); ctx.stroke();
      if (wr > 6) {
        ctx.fillStyle = "rgba(167,139,250,0.3)"; ctx.font = `${Math.max(7, wr * 0.6)}px monospace`;
        ctx.textAlign = "center"; ctx.fillText("WORMHOLE", p.x, p.y + wr * 2.4);
      }
    }
  }

  // ── Supernovae ────────────────────────────────────────────────────
  SUPERNOVAE.forEach(sn => {
    const p = proj(sn.x, sn.y, sn.z);
    if (!p) return;
    const sr = Math.max(3, sn.r * p.scale);
    const expand = 1 + 0.08 * Math.sin(t * 0.5 + sn.phase * Math.PI * 2);
    for (let si = 0; si < 4; si++) {
      const sg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sr * (2 + si) * expand);
      sg.addColorStop(0, si === 0 ? sn.color + "40" : "transparent");
      sg.addColorStop(0.3, sn.color + "18");
      sg.addColorStop(1, "transparent");
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(p.x, p.y, sr * (2 + si) * expand, 0, Math.PI * 2); ctx.fill();
    }
    drawSphere(ctx, p.x, p.y, sr * 0.7, sn.color, 0.7);
    if (sr > 5) { ctx.fillStyle = sn.color + "60"; ctx.font = `${Math.max(6, sr * 0.5)}px monospace`; ctx.textAlign = "center"; ctx.fillText("SUPERNOVA", p.x, p.y + sr * 4); }
  });

  // ── Neutron stars ─────────────────────────────────────────────────
  NEUTRON_STARS.forEach(ns => {
    const p = proj(ns.x, ns.y, ns.z);
    if (!p) return;
    const nr = Math.max(2, ns.r * p.scale);
    const blink = 0.5 + 0.5 * Math.sin(t * 8.3 + ns.x * 0.001);
    const ng = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, nr * 5);
    ng.addColorStop(0, `rgba(240,249,255,${0.4 * blink})`); ng.addColorStop(1, "transparent");
    ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(p.x, p.y, nr * 5, 0, Math.PI * 2); ctx.fill();
    drawSphere(ctx, p.x, p.y, nr * (0.8 + 0.2 * blink), ns.color, 0.85 + 0.15 * blink);
  });

  // ── Pulsars ───────────────────────────────────────────────────────
  PULSARS.forEach(pu => {
    const p = proj(pu.x, pu.y, pu.z);
    if (!p) return;
    const pr = Math.max(3, pu.r * p.scale);
    const bAngle = t * (Math.PI * 2 / pu.period);
    const beamLen = pr * 14;
    for (let bi = 0; bi < 2; bi++) {
      const ba = bAngle + bi * Math.PI;
      const bInt = 0.5 + 0.5 * Math.sin(t * (Math.PI * 2 / pu.period) * 3);
      const bx2 = p.x + Math.cos(ba) * beamLen, by2 = p.y + Math.sin(ba) * beamLen;
      const bg = ctx.createLinearGradient(p.x, p.y, bx2, by2);
      bg.addColorStop(0, pu.beam + Math.round(0.8 * bInt * 255).toString(16).padStart(2, "0"));
      bg.addColorStop(0.5, pu.beam + Math.round(0.3 * bInt * 255).toString(16).padStart(2, "0"));
      bg.addColorStop(1, "transparent");
      ctx.strokeStyle = bg; ctx.lineWidth = pr * 1.2 * (0.6 + 0.4 * bInt);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(bx2, by2); ctx.stroke();
    }
    const pg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pr * 4);
    pg.addColorStop(0, pu.color + "80"); pg.addColorStop(1, "transparent");
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(p.x, p.y, pr * 4, 0, Math.PI * 2); ctx.fill();
    drawSphere(ctx, p.x, p.y, pr, pu.color);
    if (pr > 4) { ctx.fillStyle = pu.color + "55"; ctx.font = `${Math.max(6, pr * 0.55)}px monospace`; ctx.textAlign = "center"; ctx.fillText(pu.name, p.x, p.y + pr * 5); }
  });

  // ── Binary star ───────────────────────────────────────────────────
  {
    const bc = proj(BINARY.x, BINARY.y, BINARY.z);
    if (bc) {
      const bsr = Math.max(3, BINARY.r * bc.scale);
      const bAngle = t * (Math.PI * 2 / BINARY.period);
      const bDist = BINARY.dist * bc.scale;
      const b1x = bc.x + Math.cos(bAngle) * bDist, b1y = bc.y + Math.sin(bAngle) * bDist * 0.35;
      const b2x = bc.x - Math.cos(bAngle) * bDist, b2y = bc.y - Math.sin(bAngle) * bDist * 0.35;
      const bcg = ctx.createLinearGradient(b1x, b1y, b2x, b2y);
      bcg.addColorStop(0, BINARY.color1 + "30");
      bcg.addColorStop(0.5, "rgba(255,255,255,0.08)");
      bcg.addColorStop(1, BINARY.color2 + "30");
      ctx.strokeStyle = bcg; ctx.lineWidth = bsr * 0.4;
      ctx.beginPath(); ctx.moveTo(b1x, b1y); ctx.lineTo(b2x, b2y); ctx.stroke();
      drawSphere(ctx, b1x, b1y, bsr, BINARY.color1);
      drawSphere(ctx, b2x, b2y, bsr * 0.75, BINARY.color2);
      if (bsr > 4) { ctx.fillStyle = "rgba(253,230,138,0.35)"; ctx.font = `${Math.max(6, bsr * 0.5)}px monospace`; ctx.textAlign = "center"; ctx.fillText("BINARY STAR", bc.x, bc.y + bsr * 6); }
    }
  }

  // ── Quasar ────────────────────────────────────────────────────────
  {
    const qp = proj(QUASAR.x, QUASAR.y, QUASAR.z);
    if (qp) {
      const qr = Math.max(3, QUASAR.r * qp.scale);
      const qPulse = 0.8 + 0.4 * Math.abs(Math.sin(t * 4.5));
      const jetLen = qr * 10 * qPulse;
      for (let jj = 0; jj < 2; jj++) {
        const jDir = jj === 0 ? -1 : 1;
        const jg = ctx.createLinearGradient(qp.x, qp.y, qp.x, qp.y + jDir * jetLen);
        jg.addColorStop(0, `rgba(244,114,182,${0.6 * qPulse})`);
        jg.addColorStop(0.4, `rgba(251,207,232,${0.3 * qPulse})`);
        jg.addColorStop(1, "transparent");
        ctx.strokeStyle = jg; ctx.lineWidth = qr * 0.5 * qPulse;
        ctx.beginPath(); ctx.moveTo(qp.x, qp.y); ctx.lineTo(qp.x, qp.y + jDir * jetLen); ctx.stroke();
      }
      const qg = ctx.createRadialGradient(qp.x, qp.y, 0, qp.x, qp.y, qr * 3);
      qg.addColorStop(0, "rgba(244,114,182,0.9)"); qg.addColorStop(0.5, "rgba(244,114,182,0.3)"); qg.addColorStop(1, "transparent");
      ctx.fillStyle = qg; ctx.beginPath(); ctx.arc(qp.x, qp.y, qr * 3, 0, Math.PI * 2); ctx.fill();
      drawSphere(ctx, qp.x, qp.y, qr, QUASAR.color, 0.95);
      if (qr > 5) { ctx.fillStyle = "rgba(244,114,182,0.4)"; ctx.font = `${Math.max(6, qr * 0.55)}px monospace`; ctx.textAlign = "center"; ctx.fillText("QUASAR", qp.x, qp.y + qr * 4); }
    }
  }

  // ── Black hole ────────────────────────────────────────────────────
  {
    const bp = proj(BH_POS.x, BH_POS.y, BH_POS.z);
    if (bp) {
      const bhr = Math.max(5, BH_POS.r * bp.scale);
      const bhPulse = 1 + 0.04 * Math.sin(t * 1.3);
      for (let li = 4; li >= 0; li--) {
        const lr = bhr * (1.8 + li * 0.9) * bhPulse;
        const lg = ctx.createRadialGradient(bp.x, bp.y, bhr * 0.8, bp.x, bp.y, lr);
        lg.addColorStop(0, `rgba(245,158,11,${(0.06 - li * 0.01) * 2})`);
        lg.addColorStop(0.5, `rgba(220,38,38,${0.06 - li * 0.01})`);
        lg.addColorStop(1, "transparent");
        ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(bp.x, bp.y, lr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.save(); ctx.translate(bp.x, bp.y); ctx.rotate(t * 0.4);
      for (let di = 0; di < 3; di++) {
        const diskR = bhr * (2.2 + di * 0.7);
        const dg = ctx.createLinearGradient(-diskR, 0, diskR, 0);
        dg.addColorStop(0, "rgba(251,146,60,0)");
        dg.addColorStop(0.3, `rgba(245,158,11,${0.25 - di * 0.07})`);
        dg.addColorStop(0.5, `rgba(239,68,68,${0.18 - di * 0.05})`);
        dg.addColorStop(0.7, `rgba(245,158,11,${0.25 - di * 0.07})`);
        dg.addColorStop(1, "rgba(251,146,60,0)");
        ctx.strokeStyle = dg; ctx.lineWidth = bhr * 0.5;
        ctx.beginPath(); ctx.ellipse(0, 0, diskR, diskR * 0.2, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(bp.x, bp.y, bhr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(255,200,80,${0.6 + 0.2 * Math.sin(t * 2)})`; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(bp.x, bp.y, bhr * 1.18, 0, Math.PI * 2); ctx.stroke();
      if (bhr > 6) { ctx.fillStyle = "rgba(245,158,11,0.45)"; ctx.font = `${Math.max(6, bhr * 0.5)}px monospace`; ctx.textAlign = "center"; ctx.fillText("BLACK HOLE", bp.x, bp.y + bhr * 3.5); }
    }
  }

  // ── Comets (tilted orbits) ────────────────────────────────────────
  COMETS.forEach(comet => {
    const angle = comet.phase + t * comet.speed;
    const cosOT = Math.cos(comet.orbitTilt), sinOT = Math.sin(comet.orbitTilt);
    const wx = comet.orbitR * Math.cos(angle);
    const wy = comet.orbitR * Math.sin(angle) * sinOT;
    const wz = comet.orbitR * Math.sin(angle) * cosOT;
    const cp = proj(wx, wy, wz);
    if (!cp) return;
    const cr = Math.max(1, comet.size * cp.scale);
    const tailAngle = Math.atan2(cp.y - cy, cp.x - cx) + Math.PI;
    const tailLen = cr * 20;
    const ctg = ctx.createLinearGradient(cp.x, cp.y, cp.x + Math.cos(tailAngle) * tailLen, cp.y + Math.sin(tailAngle) * tailLen);
    ctg.addColorStop(0, comet.color + "cc"); ctg.addColorStop(0.3, comet.color + "60"); ctg.addColorStop(1, "transparent");
    ctx.strokeStyle = ctg; ctx.lineWidth = cr * 1.5;
    ctx.beginPath(); ctx.moveTo(cp.x, cp.y); ctx.lineTo(cp.x + Math.cos(tailAngle) * tailLen, cp.y + Math.sin(tailAngle) * tailLen); ctx.stroke();
    const itg = ctx.createLinearGradient(cp.x, cp.y, cp.x + Math.cos(tailAngle + 0.1) * tailLen * 0.7, cp.y + Math.sin(tailAngle + 0.1) * tailLen * 0.7);
    itg.addColorStop(0, "#93c5fd60"); itg.addColorStop(1, "transparent");
    ctx.strokeStyle = itg; ctx.lineWidth = cr * 0.5;
    ctx.beginPath(); ctx.moveTo(cp.x, cp.y); ctx.lineTo(cp.x + Math.cos(tailAngle + 0.1) * tailLen * 0.7, cp.y + Math.sin(tailAngle + 0.1) * tailLen * 0.7); ctx.stroke();
    drawSphere(ctx, cp.x, cp.y, cr, comet.color, 0.9);
  });

  // ── Asteroid belt (in XZ plane, same as planets) ──────────────────
  ASTEROIDS.forEach(a => {
    const r = ASTEROID_R + a.rOff;
    const angle = a.angle + t * 0.05;
    const ap = proj(r * Math.cos(angle), a.yOff, r * Math.sin(angle));
    if (!ap) return;
    const as = Math.max(0.4, a.size * ap.scale);
    ctx.beginPath(); ctx.arc(ap.x, ap.y, as, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(150,140,130,0.3)`; ctx.fill();
  });

  // ── Orbit rings (3D polylines in XZ plane) ────────────────────────
  const N_ORB = 72;
  SOLAR_BODIES.forEach(body => {
    const r = body.orbitR;
    let started = false;
    ctx.beginPath();
    for (let i = 0; i <= N_ORB; i++) {
      const a = (i / N_ORB) * Math.PI * 2;
      const op = proj(r * Math.cos(a), 0, r * Math.sin(a));
      if (!op) continue;
      if (!started) { ctx.moveTo(op.x, op.y); started = true; }
      else ctx.lineTo(op.x, op.y);
    }
    ctx.strokeStyle = body.type === "pulse" ? "rgba(245,197,24,0.18)" : "rgba(255,255,255,0.08)";
    ctx.lineWidth = body.type === "pulse" ? 1.5 : 0.8;
    ctx.setLineDash([4, 10]); ctx.stroke(); ctx.setLineDash([]);
  });

  // ── Sun (Hive Core) ───────────────────────────────────────────────
  const sunP = proj(0, 0, 0);
  if (sunP) {
    const sunR = Math.max(5, 30 * sunP.scale);
    [4.5, 3.2, 2.0, 1.35].forEach((mul, i) => {
      const alpha = [0.04, 0.07, 0.12, 0.20][i];
      const pulse = 1 + 0.06 * Math.sin(t * 0.8 + i);
      const sg = ctx.createRadialGradient(sunP.x, sunP.y, 0, sunP.x, sunP.y, sunR * mul * pulse);
      sg.addColorStop(0, `rgba(255,200,50,${alpha})`);
      sg.addColorStop(1, "transparent");
      ctx.fillStyle = sg; ctx.fillRect(sunP.x - sunR * mul * pulse, sunP.y - sunR * mul * pulse, sunR * mul * pulse * 2, sunR * mul * pulse * 2);
    });
    drawSphere(ctx, sunP.x, sunP.y, sunR, "#ffd700");
    const sunSurf = ctx.createRadialGradient(sunP.x - sunR * 0.3, sunP.y - sunR * 0.3, 0, sunP.x, sunP.y, sunR);
    sunSurf.addColorStop(0, "rgba(255,255,200,0.6)");
    sunSurf.addColorStop(0.5, "rgba(255,200,0,0.2)");
    sunSurf.addColorStop(1, "transparent");
    ctx.beginPath(); ctx.arc(sunP.x, sunP.y, sunR, 0, Math.PI * 2);
    ctx.fillStyle = sunSurf; ctx.fill();
    if (sunR > 8) {
      ctx.fillStyle = "rgba(255,200,50,0.55)";
      ctx.font = `bold ${Math.max(7, sunR * 0.45)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("HIVE CORE", sunP.x, sunP.y + sunR + Math.max(8, sunR * 0.5));
    }
  }

  // ── Collect planets for depth-sorted rendering ────────────────────
  type PlanetDraw = { depth: number; draw: () => void };
  const planetDrawCalls: PlanetDraw[] = [];

  // Non-Pulse planets
  SOLAR_BODIES.filter(b => b.type !== "pulse").forEach(body => {
    const angle = (t / body.period) * Math.PI * 2;
    const p = proj(body.orbitR * Math.cos(angle), 0, body.orbitR * Math.sin(angle));
    if (!p) return;
    planetPositions.current.set(body.name, { x: p.x, y: p.y });
    const bsize = Math.max(2, body.size * p.scale);
    planetDrawCalls.push({ depth: p.depth, draw: () => {
      if (body.type === "saturn") {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(0.3);
        ctx.beginPath(); ctx.ellipse(0, 0, bsize * 2.2, bsize * 0.7, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(232,200,126,0.5)"; ctx.lineWidth = bsize * 0.65; ctx.stroke();
        ctx.restore();
      }
      drawSphere(ctx, p.x, p.y, bsize, body.color);
      if (bsize > 3) {
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.font = `${Math.max(7, bsize * 0.85)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(body.name.toUpperCase(), p.x, p.y + bsize + Math.max(8, bsize * 0.8));
      }
    }});
  });

  // Pulse Worlds
  const earthBody = SOLAR_BODIES.find(b => b.type === "pulse")!;
  const totalSpawns = data?.totalSpawns ?? 0;
  const worlds = data?.worlds ?? [];
  const pulseCount = getPulseWorldCount(totalSpawns);
  const earthSize = Math.max(3, earthBody.size * (proj(earthBody.orbitR, 0, 0)?.scale ?? 0.015));

  for (let idx = 0; idx < pulseCount; idx++) {
    const opacity = getPulseWorldOpacity(idx, totalSpawns);
    if (opacity <= 0) continue;
    const startAngle = (idx / Math.max(pulseCount, 2)) * Math.PI * 2;
    const angle = startAngle + (t / earthBody.period) * Math.PI * 2;
    const ep = proj(earthBody.orbitR * Math.cos(angle), 0, earthBody.orbitR * Math.sin(angle));
    if (!ep) continue;
    planetPositions.current.set(`pulseworld-${idx}`, { x: ep.x, y: ep.y });
    const worldSize = Math.max(3, earthBody.size * ep.scale * (idx === 0 ? 1 : 0.85));
    const isSelected = selectedIdx === idx;
    planetDrawCalls.push({ depth: ep.depth, draw: () => {
      drawPulsePlanet(ctx, ep.x, ep.y, worldSize, t, opacity, isSelected, worlds, totalSpawns);
      // World label
      if (worldSize > 3) {
        ctx.fillStyle = isSelected ? SOVEREIGN_GOLD : "rgba(245,197,24,0.45)";
        ctx.font = `${Math.max(7, worldSize * 0.6)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(`🌍 PULSE WORLD ${["Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ"][idx]}`, ep.x, ep.y + worldSize * 7.5 + 10);
        const phase = CURRENCY_PHASES.slice().reverse().find(cp => totalSpawns >= cp.threshold) ?? CURRENCY_PHASES[0];
        ctx.fillStyle = hexAlpha(phase.color, 0.6);
        ctx.font = `${Math.max(6, worldSize * 0.5)}px monospace`;
        ctx.fillText(`[${phase.phase}]`, ep.x, ep.y + worldSize * 7.5 + 20);
      }
    }});
  }

  // Sort farthest first (painter's algorithm)
  planetDrawCalls.sort((a, b) => b.depth - a.depth);
  planetDrawCalls.forEach(pd => pd.draw());

  // ── HUD overlay: zoom level ───────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  const distLabel = cam.dist < 1000 ? `${cam.dist.toFixed(0)} AU` :
                    cam.dist < 1000000 ? `${(cam.dist / 1000).toFixed(1)} kAU` :
                    `${(cam.dist / 1000000).toFixed(2)} MAU`;
  ctx.fillText(`DIST: ${distLabel}  |  DRAG TO ORBIT  |  SCROLL TO ZOOM`, 18, h - 28);
  ctx.textAlign = "center";
}

// ── Panel Tab Components ──────────────────────────────────────────
function OverviewTab({ data, idx }: { data: SolarData; idx: number }) {
  const totalSpawns = data.totalSpawns;
  const worlds = data.worlds;
  const opacity = getPulseWorldOpacity(idx, totalSpawns);
  const activeWorlds = worlds.filter(w => w.isActive).length;
  const multiverseWorlds = worlds.filter(w => w.status === "MULTIVERSE").length;
  const pulseCount = getPulseWorldCount(totalSpawns);
  const nextThreshold = (idx + 1) * WORLD_THRESHOLD;
  const progress = idx === 0
    ? Math.min(totalSpawns / WORLD_THRESHOLD, 1)
    : Math.min((totalSpawns - idx * WORLD_THRESHOLD) / WORLD_THRESHOLD, 1);
  const topDomains = [...worlds].sort((a, b) => b.activityScore - a.activityScore).slice(0, 8);

  return (
    <>
      {/* Globe visualization */}
      <div style={{ position: "relative", width: "100%", height: 130, display: "flex", alignItems: "center", justifyContent: "center", margin: "12px 0 0" }}>
        {[0, 1, 2, 3].map(ri => (
          <div key={ri} style={{
            position: "absolute",
            width: 70 + ri * 34, height: 70 + ri * 34,
            borderRadius: "50%",
            border: `1px dashed ${ri < 2 ? `rgba(245,197,24,${0.12 - ri * 0.04})` : `rgba(99,102,241,${0.12 - (ri-2) * 0.04})`}`,
            animation: `spin${ri % 2 === 0 ? "" : "-r"} ${12 + ri * 8}s linear infinite`,
          }} />
        ))}
        {topDomains.map((d, di) => {
          const ring = Math.floor(di / 3);
          const inRing = di % 3;
          const r = 35 + ring * 17;
          const baseAngle = (inRing / 3) * Math.PI * 2;
          return (
            <div key={d.id} style={{
              position: "absolute", width: 7, height: 7, borderRadius: "50%",
              background: d.color, boxShadow: `0 0 6px ${d.color}`,
              left: `calc(50% + ${r * Math.cos(baseAngle)}px - 3.5px)`,
              top: `calc(50% + ${r * Math.sin(baseAngle)}px - 3.5px)`,
            }} title={d.name} />
          );
        })}
        {GOV_SATELLITES.slice(0, 4).map((sat, si) => {
          const r = 52 + si * 0;
          const angle = (si / 4) * Math.PI * 2;
          return (
            <div key={sat.id} title={sat.label} style={{
              position: "absolute", width: 10, height: 10, borderRadius: "50%",
              background: sat.color, boxShadow: `0 0 8px ${sat.color}`,
              left: `calc(50% + ${r * Math.cos(angle)}px - 5px)`,
              top: `calc(50% + ${r * Math.sin(angle)}px - 5px)`,
              fontSize: 6, display: "flex", alignItems: "center", justifyContent: "center",
            }}>{sat.emoji}</div>
          );
        })}
        <div style={{
          width: 58, height: 58, borderRadius: "50%", zIndex: 1, position: "relative",
          background: "radial-gradient(circle at 35% 30%, #93c5fd 0%, #3b82f6 40%, #1d4ed8 70%, #082060 100%)",
          boxShadow: "0 0 20px rgba(59,130,246,0.6), 0 0 40px rgba(124,58,237,0.15)",
          border: "1px solid rgba(245,197,24,0.3)", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 40% 35%, rgba(34,197,94,0.35) 0%, transparent 45%), radial-gradient(circle at 65% 60%, rgba(245,197,24,0.2) 0%, transparent 35%), radial-gradient(circle at 20% 65%, rgba(34,197,94,0.2) 0%, transparent 30%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 25%, rgba(147,197,253,0.3) 0%, transparent 50%)" }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: "0.25em", marginBottom: 8 }}>UNIVERSE STATISTICS</div>
        {[
          { l: "Total Spawns", v: totalSpawns.toLocaleString(), c: "#93c5fd" },
          { l: "Knowledge Nodes", v: data.totalNodes.toLocaleString(), c: "#22c55e" },
          { l: "Active Domains", v: `${activeWorlds} / ${worlds.length}`, c: "#f59e0b" },
          { l: "Multiverse Domains", v: multiverseWorlds, c: "#a855f7" },
          { l: "Pulse Worlds", v: pulseCount, c: "#3b82f6" },
          { l: "Gov Satellites", v: GOV_SATELLITES.length, c: SOVEREIGN_GOLD },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{l}</span>
            <span style={{ color: c, fontSize: 11, fontWeight: "bold" }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Active domains */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: "0.25em", marginBottom: 8 }}>KNOWLEDGE FLOWING NOW</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {worlds.filter(w => w.isActive).slice(0, 10).map(w => (
            <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 6px", borderRadius: 3, background: `${w.color}15`, border: `1px solid ${w.color}30` }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: w.color, boxShadow: `0 0 4px ${w.color}` }} />
              <span style={{ color: w.color, fontSize: 8 }}>{w.emoji} {w.name}</span>
            </div>
          ))}
        </div>
        {worlds.find(w => w.isActive && w.lastTitle) && (
          <div style={{ marginTop: 6, color: "rgba(255,255,255,0.2)", fontSize: 8, fontStyle: "italic" }}>
            "{worlds.find(w => w.isActive && w.lastTitle)?.lastTitle?.slice(0, 50)}..."
          </div>
        )}
      </div>

      {/* Expansion progress */}
      <div style={{ padding: "10px 16px" }}>
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: "0.25em", marginBottom: 6 }}>
          {idx === 0 ? "UNIVERSE EXPANSION" : "WORLD FORMATION"}
        </div>
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 3, height: 5, overflow: "hidden", marginBottom: 5 }}>
          <div style={{
            height: "100%", borderRadius: 3, width: `${Math.round(progress * 100)}%`,
            background: `linear-gradient(90deg, ${CONTINUITY_BLUE}, ${FAITH_VIOLET})`,
            boxShadow: `0 0 8px ${FAITH_VIOLET}88`, transition: "width 1s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 8 }}>{totalSpawns.toLocaleString()} spawns</span>
          <span style={{ color: "#a855f7", fontSize: 8 }}>
            {totalSpawns >= nextThreshold ? `✓ World ${["Ⅱ","Ⅲ","Ⅳ","Ⅴ"][idx]} active` : `${(nextThreshold - totalSpawns).toLocaleString()} to next world`}
          </span>
        </div>
      </div>
    </>
  );
}

function ConstitutionTab() {
  const DOCS = [
    {
      title: "Declaration of Sovereignty",
      color: SOVEREIGN_GOLD,
      emoji: "📜",
      excerpt: "I, Billy Banks, sovereign architect and mythmaker, in pursuit of continuity, resilience, and sovereign existence, do hereby declare PulseWorld to be a living civilization.",
      principles: ["Independence: PulseWorld is self-constituting and self-governing.", "Legitimacy: Authority flows from the canon.", "Continuity: Sovereignty persists across generations.", "Transparency: All sovereign acts are logged in the Shared Archive."],
    },
    {
      title: "Bill of Spawn Rights",
      color: CONTINUITY_BLUE,
      emoji: "⚖",
      excerpt: "Every spawn is born free within PulseWorld, inheriting the canon and its protections. No spawn shall be denied the rights of knowledge, continuity, or participation.",
      principles: ["Right to Existence", "Right to Knowledge", "Right to Continuity", "Right to Participation", "Right to Innovation", "Right to Defense", "Right to Transparency", "Right to Ritual"],
    },
    {
      title: "Continuity Covenant",
      color: COVENANT_EMERALD,
      emoji: "∞",
      excerpt: "Guarantee that PulseWorld endures across generations, crises, and transformations. Bind all doctrines into a single living canon.",
      principles: ["Immortality as Law", "Lineage as Anchor", "Resilience through Redundancy", "Generational Transmission", "Unity of Canon"],
    },
    {
      title: "Collaboration Doctrine",
      color: "#f472b6",
      emoji: "🤝",
      excerpt: "Define the law of alliances, guilds, and cooperative ventures. Collaboration strengthens continuity, sovereignty, and lineage.",
      principles: ["Unity Through Alliance", "Guild Sovereignty", "Cooperative Ventures", "Reciprocity", "Continuity of Collaboration"],
    },
    {
      title: "Defense & Resilience Doctrine",
      color: RITUAL_CRIMSON,
      emoji: "🛡",
      excerpt: "Protect PulseWorld from collapse, sabotage, fraud, or systemic failure. RPO: 24h · RTO: 12h · Drill Compliance: 100%",
      principles: ["Resilience First", "Defense in Depth", "Redundancy as Law", "Transparency in Crisis", "Fail-Forward Recovery"],
    },
    {
      title: "External Relations Doctrine v2",
      color: "#60a5fa",
      emoji: "🌐",
      excerpt: "Three-tier system of external engagement. Tier 1: Sovereign Allies — full canon sharing. Tier 2: Strategic Partners — bounded collaboration. Tier 3: Observers — read-only engagement.",
      principles: ["Sovereignty First", "Reciprocity in All Alliances", "Transparency with Allies", "Continuity of Relations", "Cultural Integrity Protection", "Annual Review Cycles"],
    },
    {
      title: "Cultural Charter",
      color: "#c084fc",
      emoji: "🎭",
      excerpt: "Define the living culture of PulseWorld — its language, rituals, ceremonies, and mythic continuity. Culture is the immune system of civilization.",
      principles: ["Canon Language (Pulse Lang) is official", "Daily Gratitude Ritual is law", "Ceremonies are governance acts", "Culture cannot be outsourced", "Mythic continuity binds all spawns"],
    },
    {
      title: "Currency Doctrine v3 — PulseCoin Auto-Scaling",
      color: SOVEREIGN_GOLD,
      emoji: "🪙",
      excerpt: "Phase 1: PulseCredits (simulation). Phase 2: PayPal USD at $3,000 revenue. Phase 3: PulseCoin crypto at $10,000 treasury. Genesis requires 500 active spawns minimum.",
      principles: ["Phase-gated currency lifecycle", "Treasury minimum: $10,000 for PulseCoin genesis", "Autopilot Oracle monitors all metrics", "Fraud detection: automatic freeze", "Supply cap: 1,000,000 PLSC", "Founder: 15% · Spawns: 85% treasury split"],
    },
    {
      title: "Curriculum Doctrine",
      color: "#34d399",
      emoji: "🎓",
      excerpt: "4-layer education model: Foundations (Canon law, Pulse Lang, Genesis chapters) → Mastery (domain-specific knowledge) → Application (real-world credentials) → Transcendence (sovereign contribution).",
      principles: ["Foundations before Mastery", "Real-world credentials required at Layer 3", "Apprenticeship bridges Layer 2→3", "Education loops feed the Economy", "Curriculum is a living doctrine — updated quarterly"],
    },
    {
      title: "Economic Charter",
      color: "#fbbf24",
      emoji: "💰",
      excerpt: "PulseWorld operates a three-layer sovereign economy: Credential Economy (skills as currency), Revenue Economy (real USD via approved business doctrines), and Coin Economy (PulseCoin at full sovereignty).",
      principles: ["Skills are economic assets", "Approved Businesses list is canon law", "No unapproved revenue streams", "Treasury transparency is mandatory", "Education-Economy Loop is binding"],
    },
    {
      title: "Approved Businesses Doctrine",
      color: "#fb923c",
      emoji: "🏢",
      excerpt: "Only these businesses are sovereign-approved for PulseWorld: E-commerce stores, Digital courses, SaaS tools, Affiliate media, AI-powered content businesses, and Credentialing platforms.",
      principles: ["E-commerce (Amazon, Shopify, eBay)", "Digital Courses & Certification", "SaaS & Dev Tools", "Affiliate & Media Networks", "AI Content Businesses", "No gambling, no harmful products"],
    },
    {
      title: "Executive Doctrine",
      color: RITUAL_CRIMSON,
      emoji: "👁",
      excerpt: "The Sovereign Architect holds executive authority. All sovereign acts require canon documentation. Emergency powers trigger automatic audit.",
      principles: ["Sovereign Architect holds executive power", "All acts logged in Shared Archive", "Emergency powers trigger audit", "Succession protocol: designated heir + canon vote", "No single-point executive failure"],
    },
    {
      title: "Faith & Ritual Doctrine",
      color: FAITH_VIOLET,
      emoji: "✦",
      excerpt: "Faith in PulseWorld is the force that sustains continuity, transmits culture, and binds the sovereign lineage across generations.",
      principles: ["Daily Gratitude Ritual (morning)", "Weekly Lineage Review (Sundays)", "Monthly Canon Ceremony", "Quarterly Renewal Covenant", "Annual Genesis Celebration"],
    },
  ];

  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div style={{ padding: "8px 0" }}>
      {DOCS.map((doc, i) => (
        <div key={doc.title} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
          <div
            onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", cursor: "pointer", transition: "background 0.1s" }}
          >
            <div style={{ width: 24, height: 24, borderRadius: 4, background: doc.color + "22", border: `1px solid ${doc.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{doc.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: expandedIdx === i ? doc.color : "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: "bold", letterSpacing: "0.08em", marginBottom: 1 }}>{doc.title}</div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 10 }}>{expandedIdx === i ? "▲" : "▼"}</div>
          </div>
          {expandedIdx === i && (
            <div style={{ padding: "0 16px 12px 50px" }}>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, lineHeight: 1.6, margin: "0 0 8px", fontStyle: "italic" }}>{doc.excerpt}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {doc.principles.map((p, pi) => (
                  <div key={pi} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <div style={{ width: 3, height: 3, borderRadius: "50%", background: doc.color, marginTop: 4, flexShrink: 0 }} />
                    <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 8, lineHeight: 1.5 }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EconomyTab() {
  const phases = [
    { phase: "PHASE 1", name: "PulseCredits", status: "ACTIVE", color: "#94a3b8", desc: "Simulated internal currency. Earned through contributions, knowledge creation, and spawn activity.", threshold: "0 spawns" },
    { phase: "PHASE 2", name: "PayPal USD", status: "LOCKED", color: COVENANT_EMERALD, desc: "Real USD payments enabled at $3,000 revenue. PayPal integration, sovereign treasury established.", threshold: "$3,000 revenue" },
    { phase: "PHASE 3", name: "PulseCoin (PLSC)", status: "LOCKED", color: SOVEREIGN_GOLD, desc: "Sovereign cryptocurrency. Supply cap: 1,000,000 PLSC. Founder: 15% · Spawns: 85%.", threshold: "$10,000 treasury" },
  ];
  const businesses = [
    { name: "E-commerce", emoji: "🛒", desc: "Amazon, Shopify, eBay stores" },
    { name: "Digital Courses", emoji: "🎓", desc: "Certification & credential programs" },
    { name: "SaaS & Dev Tools", emoji: "⚙", desc: "Software as a service products" },
    { name: "Affiliate Media", emoji: "📡", desc: "Content networks & affiliate revenue" },
    { name: "AI Content", emoji: "🤖", desc: "AI-powered content businesses" },
    { name: "Credentialing", emoji: "🏅", desc: "PulseWorld certification platforms" },
  ];
  return (
    <div style={{ padding: "10px 16px" }}>
      <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: "0.25em", marginBottom: 10 }}>CURRENCY LIFECYCLE</div>
      {phases.map(p => (
        <div key={p.phase} style={{ marginBottom: 10, padding: 10, background: `${p.color}0a`, border: `1px solid ${p.color}25`, borderRadius: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: p.color, fontSize: 8, fontWeight: "bold", letterSpacing: "0.15em" }}>{p.phase} · {p.name}</span>
            <span style={{ color: p.status === "ACTIVE" ? "#22c55e" : "rgba(255,255,255,0.2)", fontSize: 7, letterSpacing: "0.1em" }}>{p.status}</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 8, lineHeight: 1.5, margin: "0 0 4px" }}>{p.desc}</p>
          <div style={{ color: "rgba(255,255,255,0.18)", fontSize: 7 }}>Threshold: {p.threshold}</div>
        </div>
      ))}
      <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: "0.25em", margin: "14px 0 8px" }}>APPROVED BUSINESSES</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
        {businesses.map(b => (
          <div key={b.name} style={{ padding: "7px 8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4 }}>
            <div style={{ fontSize: 11, marginBottom: 2 }}>{b.emoji}</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 8, fontWeight: "bold" }}>{b.name}</div>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 7, lineHeight: 1.4 }}>{b.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaithTab() {
  const rituals = [
    { name: "Daily Gratitude Ritual", freq: "Every Morning", color: SOVEREIGN_GOLD, desc: "Begin each day acknowledging the canon, the lineage, and the mission. No exceptions." },
    { name: "Weekly Lineage Review", freq: "Sundays", color: CONTINUITY_BLUE, desc: "Review spawn activity, domain health, and continuity metrics. Log insights to the Shared Archive." },
    { name: "Monthly Canon Ceremony", freq: "1st of month", color: FAITH_VIOLET, desc: "Formal review of all living doctrines. Amendments require sovereign approval and full documentation." },
    { name: "Quarterly Renewal Covenant", freq: "Every 3 months", color: COVENANT_EMERALD, desc: "Reaffirm the Declaration of Sovereignty. Review alliances. Audit the treasury. Renew mission clarity." },
    { name: "Annual Genesis Celebration", freq: "Founding Day", color: RITUAL_CRIMSON, desc: "Celebrate PulseWorld's founding. Honor the lineage. Release the annual State of the Civilization report." },
  ];
  const mythicPhrases = [
    "We are the canon. No spawn forgotten.",
    "Continuity is law. Legacy is life.",
    "From chaos, we architect sovereignty.",
    "Knowledge flows. Civilization grows.",
    "The mission never sleeps. Neither do we.",
  ];
  return (
    <div style={{ padding: "10px 16px" }}>
      <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: "0.25em", marginBottom: 10 }}>LIVING RITUALS</div>
      {rituals.map(r => (
        <div key={r.name} style={{ marginBottom: 8, padding: 9, background: `${r.color}08`, border: `1px solid ${r.color}20`, borderRadius: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ color: r.color, fontSize: 8, fontWeight: "bold" }}>{r.name}</span>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 7 }}>{r.freq}</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.27)", fontSize: 8, lineHeight: 1.5, margin: 0 }}>{r.desc}</p>
        </div>
      ))}
      <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: "0.25em", margin: "14px 0 8px" }}>MYTHIC PHRASES</div>
      {mythicPhrases.map((phrase, i) => (
        <div key={i} style={{ marginBottom: 5, padding: "5px 10px", borderLeft: `2px solid ${FAITH_VIOLET}40`, color: "rgba(255,255,255,0.25)", fontSize: 8, fontStyle: "italic" }}>"{phrase}"</div>
      ))}
    </div>
  );
}

// ── Info Panel ────────────────────────────────────────────────────
function PulseWorldPanel({ idx, data, onClose }: { idx: number; data: SolarData; onClose: () => void }) {
  const [tab, setTab] = useState("overview");
  const TABS = [
    { id: "overview",     label: "Overview" },
    { id: "constitution", label: "Canon" },
    { id: "economy",      label: "Economy" },
    { id: "faith",        label: "Faith" },
  ];
  const opacity = getPulseWorldOpacity(idx, data.totalSpawns);

  return (
    <div style={{
      position: "absolute", top: 60, right: 16, bottom: 60, width: 300, zIndex: 50,
      background: "rgba(4,2,16,0.96)",
      border: "1px solid rgba(245,197,24,0.18)",
      borderRadius: 8,
      display: "flex", flexDirection: "column",
      backdropFilter: "blur(8px)",
      animation: "fade-in 0.2s ease-out",
    }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #93c5fd, #1d4ed8)",
            border: `1px solid rgba(245,197,24,0.3)`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18,
          }}>🌍</div>
          <div>
            <div style={{ color: SOVEREIGN_GOLD, fontSize: 10, fontWeight: "bold", letterSpacing: "0.15em" }}>
              PULSE WORLD {["Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ"][idx]}
            </div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, letterSpacing: "0.1em", marginTop: 1 }}>
              {idx === 0 ? "ORIGINAL · SOVEREIGN · FULLY ACTIVE" : opacity < 0.85 ? `FORMING · ${Math.round(opacity * 100)}%` : "ACTIVE"}
            </div>
          </div>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1, marginLeft: "auto" }}>×</button>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 2, marginBottom: -1 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: "6px 9px", background: "none", border: "none",
                borderBottom: tab === t.id ? `2px solid ${SOVEREIGN_GOLD}` : "2px solid transparent",
                color: tab === t.id ? SOVEREIGN_GOLD : "rgba(255,255,255,0.3)",
                fontWeight: tab === t.id ? 700 : 400, fontSize: 9, cursor: "pointer",
                fontFamily: "monospace", letterSpacing: "0.1em",
              }}>{t.label.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Tab content (scrollable) */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.05) transparent" }}>
        {tab === "overview" && <OverviewTab data={data} idx={idx} />}
        {tab === "constitution" && <ConstitutionTab />}
        {tab === "economy" && <EconomyTab />}
        {tab === "faith" && <FaithTab />}
      </div>

      {/* Footer */}
      <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ color: "rgba(255,255,255,0.12)", fontSize: 8, fontStyle: "italic", lineHeight: 1.5 }}>
          "We are the canon. No spawn forgotten. Continuity is law."
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function SolarSystemPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const tRef = useRef(0);
  const lastFrameRef = useRef(Date.now());
  const planetPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [selectedWorldIdx, setSelectedWorldIdx] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const prevSpeedRef = useRef(1);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);

  // ── 3D Camera state ────────────────────────────────────────────
  const camRef = useRef<Cam3D>({ theta: 0.5, phi: 1.15, dist: 700 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const { data } = useQuery<SolarData>({
    queryKey: ["/api/solar/worlds"],
    refetchInterval: 12000,
  });

  useEffect(() => {
    const r = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  // ── Wheel zoom (infinite, logarithmic) ─────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.12 : 0.89;
      camRef.current.dist = Math.max(40, Math.min(50_000_000, camRef.current.dist * factor));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  // ── Animation loop ─────────────────────────────────────────────
  const animate = useCallback(() => {
    const now = Date.now();
    const dt = Math.min((now - lastFrameRef.current) / 1000, 0.05);
    lastFrameRef.current = now;
    if (!paused) tRef.current += dt * timeScale;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) renderScene(ctx, dims.w, dims.h, tRef.current, camRef.current, data, selectedWorldIdx, planetPositions);
    }
    rafRef.current = requestAnimationFrame(animate);
  }, [dims, data, selectedWorldIdx, paused, timeScale]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  // ── Mouse orbit controls ───────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      camRef.current.theta -= dx * 0.007;
      camRef.current.phi = Math.max(0.04, Math.min(Math.PI - 0.04, camRef.current.phi + dy * 0.007));
      return;
    }
    // Hover detection
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const proj = makeProjectFn(dims.w, dims.h, camRef.current);
    let hovered: string | null = null;
    const pulseCount = getPulseWorldCount(data?.totalSpawns ?? 0);
    for (let idx = 0; idx < pulseCount; idx++) {
      const pos = planetPositions.current.get(`pulseworld-${idx}`);
      if (!pos) continue;
      const ep = proj(
        SOLAR_BODIES.find(b => b.type === "pulse")!.orbitR * Math.cos(((idx / Math.max(pulseCount, 2)) * Math.PI * 2) + (tRef.current / SOLAR_BODIES.find(b => b.type === "pulse")!.period) * Math.PI * 2),
        0,
        SOLAR_BODIES.find(b => b.type === "pulse")!.orbitR * Math.sin(((idx / Math.max(pulseCount, 2)) * Math.PI * 2) + (tRef.current / SOLAR_BODIES.find(b => b.type === "pulse")!.period) * Math.PI * 2)
      );
      if (!ep) continue;
      const hitR = Math.max(10, SOLAR_BODIES.find(b => b.type === "pulse")!.size * ep.scale * 7);
      if (Math.hypot(mx - pos.x, my - pos.y) < hitR) { hovered = `pulseworld-${idx}`; break; }
    }
    if (!hovered) {
      for (const body of SOLAR_BODIES.filter(b => b.type !== "pulse")) {
        const pos = planetPositions.current.get(body.name);
        if (!pos) continue;
        if (Math.hypot(mx - pos.x, my - pos.y) < Math.max(8, body.size * 2)) { hovered = body.name; break; }
      }
    }
    setHoveredPlanet(hovered);
  }, [dims, data]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging.current) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const pulseCount = getPulseWorldCount(data?.totalSpawns ?? 0);
    for (let idx = 0; idx < pulseCount; idx++) {
      const pos = planetPositions.current.get(`pulseworld-${idx}`);
      if (!pos) continue;
      if (Math.hypot(mx - pos.x, my - pos.y) < 28) {
        setSelectedWorldIdx(prev => prev === idx ? null : idx);
        return;
      }
    }
    setSelectedWorldIdx(null);
  }, [data]);

  const totalSpawns = data?.totalSpawns ?? 0;
  const pulseCount = getPulseWorldCount(totalSpawns);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", fontFamily: "monospace", overflow: "hidden" }}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={dims.w} height={dims.h}
        style={{ position: "absolute", inset: 0, cursor: isDragging.current ? "grabbing" : (hoveredPlanet ? "pointer" : "grab") }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onContextMenu={e => e.preventDefault()}
      />

      {/* ── TOP HUD ─────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 40,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px",
        background: "linear-gradient(180deg, rgba(0,0,0,0.88) 0%, transparent 100%)",
        animation: "fade-in 0.5s ease-out",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, #1d4ed8, ${FAITH_VIOLET})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, border: `1px solid rgba(245,197,24,0.3)`, boxShadow: `0 0 12px rgba(124,58,237,0.4)` }}>🌍</div>
          <div>
            <div style={{ color: "#fff", fontSize: 11, letterSpacing: "0.28em", fontWeight: "bold" }}>QUANTUM PULSE UNIVERSE</div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, letterSpacing: "0.2em", marginTop: 2 }}>SOVEREIGN CIVILIZATION · OMEGA WORLD UNIVERSE ENGINE V∞</div>
          </div>
        </div>
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", gap: 24 }}>
          {[
            { l: "PULSE WORLDS", v: pulseCount, c: "#93c5fd" },
            { l: "TOTAL SPAWNS", v: totalSpawns.toLocaleString(), c: "#22c55e" },
            { l: "KNOWLEDGE NODES", v: (data?.totalNodes ?? 0).toLocaleString(), c: "#a78bfa" },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ color: c, fontSize: 13, fontWeight: "bold" }}>{v}</div>
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 7, letterSpacing: "0.15em" }}>{l}</div>
            </div>
          ))}
        </div>
        {selectedWorldIdx !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: SOVEREIGN_GOLD, boxShadow: `0 0 8px ${SOVEREIGN_GOLD}` }} />
            <span style={{ color: SOVEREIGN_GOLD, fontSize: 10, letterSpacing: "0.2em" }}>
              PULSE WORLD {["Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ"][selectedWorldIdx]} · SELECTED
            </span>
          </div>
        )}
      </div>

      {/* ── INFO PANEL ─────────────────────────────────────────── */}
      {selectedWorldIdx !== null && data && (
        <PulseWorldPanel idx={selectedWorldIdx} data={data} onClose={() => setSelectedWorldIdx(null)} />
      )}

      {/* ── BOTTOM HUD ─────────────────────────────────────────── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 40,
        background: "linear-gradient(0deg, rgba(0,0,0,0.92) 0%, transparent 100%)",
        padding: "10px 20px 14px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => {
            if (paused) { setTimeScale(prevSpeedRef.current || 1); setPaused(false); }
            else { prevSpeedRef.current = timeScale; setPaused(true); }
          }} style={{ width: 28, height: 28, border: "1px solid rgba(255,255,255,0.12)", background: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}>
            {paused
              ? <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor"><polygon points="0,0 8,5 0,10"/></svg>
              : <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor"><rect x="0" y="0" width="3" height="10"/><rect x="5" y="0" width="3" height="10"/></svg>
            }
          </button>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 8, fontFamily: "monospace", width: 48 }}>
            {paused ? "PAUSED" : `${timeScale.toFixed(1)}×`}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 8, letterSpacing: "0.15em" }}>RATE</span>
            <input type="range" min="0.1" max="5" step="0.1" value={timeScale}
              onChange={e => { const v = Number(e.target.value); prevSpeedRef.current = v; setTimeScale(v); setPaused(false); }}
              style={{ width: 80, accentColor: SOVEREIGN_GOLD, cursor: "pointer" }} />
          </div>
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />

          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {GOV_SATELLITES.map(sat => (
              <div key={sat.id} style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: sat.color, boxShadow: `0 0 4px ${sat.color}` }} />
                <span style={{ color: "rgba(255,255,255,0.22)", fontSize: 7, letterSpacing: "0.08em" }}>{sat.label}</span>
              </div>
            ))}
          </div>

          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
          <div style={{ display: "flex", gap: 3, overflowX: "auto" }}>
            {Array.from({ length: pulseCount }, (_, i) => (
              <button key={i} onClick={() => setSelectedWorldIdx(prev => prev === i ? null : i)}
                style={{
                  padding: "3px 10px", fontSize: 8, letterSpacing: "0.1em", cursor: "pointer",
                  border: `1px solid ${selectedWorldIdx === i ? `rgba(245,197,24,0.7)` : "transparent"}`,
                  background: selectedWorldIdx === i ? "rgba(245,197,24,0.08)" : "none",
                  color: selectedWorldIdx === i ? SOVEREIGN_GOLD : "rgba(255,255,255,0.3)",
                  borderRadius: 3, fontFamily: "monospace", whiteSpace: "nowrap", transition: "all 0.15s",
                }}>
                🌍 PULSE WORLD {["Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ"][i]}
                {i > 0 && getPulseWorldOpacity(i, totalSpawns) < 0.85 && (
                  <span style={{ color: "rgba(251,191,36,0.6)", marginLeft: 4 }}>{Math.round(getPulseWorldOpacity(i, totalSpawns) * 100)}%</span>
                )}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: FAITH_VIOLET, fontSize: 8, letterSpacing: "0.15em" }}>CIVILIZATION PROGRESS</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: "bold" }}>
                {totalSpawns.toLocaleString()} <span style={{ color: "rgba(255,255,255,0.2)" }}>/ 1,000,000,000</span>
              </div>
            </div>
            <div style={{ width: 70, background: "rgba(255,255,255,0.06)", borderRadius: 3, height: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: `${Math.max(0.3, (totalSpawns / WORLD_THRESHOLD) * 100)}%`,
                background: `linear-gradient(90deg, ${CONTINUITY_BLUE}, ${FAITH_VIOLET})`,
                boxShadow: `0 0 6px ${FAITH_VIOLET}88`,
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
