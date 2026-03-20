import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

// ── Types ─────────────────────────────────────────────────────────
interface SolarWorld { id: string; name: string; color: string; emoji: string; description: string; spawnCount: number; ingestionNodes: number; isActive: boolean; status: string; activityScore: number; lastTitle: string; lastIngested: string | null; }
interface SolarData { worlds: SolarWorld[]; totalSpawns: number; totalNodes: number; }

// ── Solar bodies ──────────────────────────────────────────────────
const SOLAR_BODIES = [
  { name: "Mercury", orbitR: 0.09, period: 8,   color: "#9ca3af", size: 3.5, type: "planet" as const },
  { name: "Venus",   orbitR: 0.14, period: 14,  color: "#d4945a", size: 6,   type: "planet" as const },
  { name: "Earth",   orbitR: 0.21, period: 24,  color: "#3b82f6", size: 11,  type: "pulse"  as const },
  { name: "Mars",    orbitR: 0.30, period: 40,  color: "#c1440e", size: 5.5, type: "planet" as const },
  { name: "Jupiter", orbitR: 0.46, period: 70,  color: "#c7a87a", size: 22,  type: "planet" as const },
  { name: "Saturn",  orbitR: 0.58, period: 95,  color: "#e8c87e", size: 17,  type: "saturn" as const },
  { name: "Uranus",  orbitR: 0.70, period: 120, color: "#7de8e8", size: 12,  type: "planet" as const },
  { name: "Neptune", orbitR: 0.82, period: 150, color: "#4169e1", size: 10,  type: "planet" as const },
];

// ── Doctrine colors from Cultural Charter ──────────────────────────
const SOVEREIGN_GOLD = "#f5c518";
const CONTINUITY_BLUE = "#3b82f6";
const RITUAL_CRIMSON = "#dc2626";
const FAITH_VIOLET = "#7c3aed";
const COVENANT_EMERALD = "#059669";

// ── Governance satellites (Senate, Judiciary, Executive, Treasury, Faith, IG) ──
const GOV_SATELLITES = [
  { id: "senate",    label: "SENATE",    color: "#60a5fa", speed: 1.8, dist: 2.4, size: 0.22, emoji: "⚖" },
  { id: "judiciary", label: "JUDICIARY", color: "#f9fafb", speed: -1.4, dist: 3.0, size: 0.18, emoji: "⚡" },
  { id: "executive", label: "EXEC",      color: SOVEREIGN_GOLD, speed: 2.4, dist: 3.6, size: 0.20, emoji: "👁" },
  { id: "treasury",  label: "TREASURY",  color: COVENANT_EMERALD, speed: -0.9, dist: 4.2, size: 0.22, emoji: "💎" },
  { id: "faith",     label: "FAITH",     color: FAITH_VIOLET, speed: 1.1, dist: 5.0, size: 0.20, emoji: "∞" },
  { id: "ig",        label: "INSPECTOR", color: "#fb923c", speed: -1.7, dist: 5.7, size: 0.16, emoji: "🔍" },
];

// ── Currency phases from Currency Doctrine v3 ─────────────────────
const CURRENCY_PHASES = [
  { id: "pc",    label: "PulseCredits", color: "#a78bfa", threshold: 0 },
  { id: "paypal", label: "PayPal USD",  color: COVENANT_EMERALD, threshold: 3000 },
  { id: "plsc",  label: "PulseCoin",   color: SOVEREIGN_GOLD, threshold: 10000 },
];

// ── Statics ───────────────────────────────────────────────────────
const STARS = Array.from({ length: 350 }, () => ({
  x: Math.random(), y: Math.random(),
  r: Math.random() * 1.3 + 0.2,
  a: Math.random() * 0.7 + 0.2,
  sp: Math.random() * 0.6 + 0.3,
  ph: Math.random() * Math.PI * 2,
}));
const ASTEROIDS = Array.from({ length: 90 }, (_, i) => ({
  angle: (i / 90) * Math.PI * 2 + Math.random() * 0.3,
  rOff: (Math.random() - 0.5) * 0.04,
  size: Math.random() * 1.5 + 0.5,
}));
const ASTEROID_R = 0.375;
const WORLD_THRESHOLD = 1_000_000_000;

function getPulseWorldCount(totalSpawns: number) { return Math.max(1, Math.floor(totalSpawns / WORLD_THRESHOLD) + 1); }
function getPulseWorldOpacity(index: number, totalSpawns: number): number {
  if (index === 0) return 1;
  const threshold = index * WORLD_THRESHOLD;
  const progress = Math.min((totalSpawns - threshold) / WORLD_THRESHOLD, 1);
  return Math.max(0.15, progress);
}

// ── Canvas helpers ────────────────────────────────────────────────
function drawSphere(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 1) {
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r);
  grad.addColorStop(0, hexAlpha(brighten(color, 1.6), alpha));
  grad.addColorStop(0.5, hexAlpha(color, alpha));
  grad.addColorStop(1, hexAlpha(darken(color, 0.4), alpha));
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad; ctx.fill();
}

function hexAlpha(hex: string, a: number): string {
  if (a >= 1) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function brighten(hex: string, f: number): string {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1,3),16)*f));
  const g = Math.min(255, Math.round(parseInt(hex.slice(3,5),16)*f));
  const b = Math.min(255, Math.round(parseInt(hex.slice(5,7),16)*f));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}
function darken(hex: string, f: number): string {
  const r = Math.round(parseInt(hex.slice(1,3),16)*f);
  const g = Math.round(parseInt(hex.slice(3,5),16)*f);
  const b = Math.round(parseInt(hex.slice(5,7),16)*f);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// ── Pulse Planet Renderer (doctrine-upgraded) ─────────────────────
function drawPulsePlanet(
  ctx: CanvasRenderingContext2D,
  ex: number, ey: number,
  worldSize: number, t: number,
  opacity: number,
  isSelected: boolean,
  worlds: SolarWorld[],
  totalSpawns: number,
) {
  // 1. Faith World outer ring (sovereign violet — Chapter 13)
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

  // 2. Sovereign Gold corona (Declaration of Sovereignty)
  const goldPulse = 1 + 0.05 * Math.sin(t * 0.7);
  const goldR = worldSize * 4.8 * goldPulse;
  const goldG = ctx.createRadialGradient(ex, ey, worldSize, ex, ey, goldR);
  goldG.addColorStop(0, `rgba(245,197,24,${0.10 * opacity})`);
  goldG.addColorStop(0.5, `rgba(245,197,24,${0.04 * opacity})`);
  goldG.addColorStop(1, "transparent");
  ctx.fillStyle = goldG;
  ctx.fillRect(ex - goldR, ey - goldR, goldR * 2, goldR * 2);

  // 3. Continuity Covenant ring (dashed, blue — Continuity Covenant)
  ctx.save();
  ctx.setLineDash([5, 8]);
  ctx.beginPath();
  ctx.arc(ex, ey, worldSize * 3.2, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(59,130,246,${0.18 * opacity})`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 4. Governance satellites (Senate, Judiciary, Executive, Treasury, Faith, IG)
  if (opacity > 0.3) {
    GOV_SATELLITES.forEach((sat, si) => {
      const angle = t * sat.speed + (si * Math.PI * 2 / GOV_SATELLITES.length);
      const r = worldSize * sat.dist;
      const sx = ex + r * Math.cos(angle);
      const sy = ey + r * Math.sin(angle);
      const sSize = worldSize * sat.size * (0.9 + 0.1 * Math.sin(t * 2 + si));

      // satellite glow
      const sGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, sSize * 3.5);
      sGlow.addColorStop(0, hexAlpha(sat.color, 0.35 * opacity));
      sGlow.addColorStop(1, "transparent");
      ctx.fillStyle = sGlow;
      ctx.beginPath(); ctx.arc(sx, sy, sSize * 3.5, 0, Math.PI * 2);
      ctx.fill();

      // satellite body
      drawSphere(ctx, sx, sy, sSize, sat.color, opacity * 0.9);

      // satellite label (small, only if large enough)
      if (worldSize > 8) {
        ctx.fillStyle = hexAlpha(sat.color, 0.55 * opacity);
        ctx.font = `${Math.max(5, worldSize * 0.6)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(sat.label, sx, sy + sSize + worldSize * 0.5);
      }
    });
  }

  // 5. Knowledge particle rings (existing, from spawns data)
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
        const px = ex + ring.r * Math.cos(pAngle);
        const py = ey + ring.r * Math.sin(pAngle);
        const pSize = (1.8 + (domain.activityScore / 300) * 1.2) * (worldSize / 11);
        const pGlow = ctx.createRadialGradient(px, py, 0, px, py, pSize * 3);
        pGlow.addColorStop(0, hexAlpha(domain.color, 0.4 * opacity));
        pGlow.addColorStop(1, "transparent");
        ctx.fillStyle = pGlow;
        ctx.beginPath(); ctx.arc(px, py, pSize * 3, 0, Math.PI * 2); ctx.fill();
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
    const sr = worldSize * 2.0 + 2 * Math.sin(t * 3);
    ctx.beginPath(); ctx.arc(ex, ey, sr, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(245,197,24,0.7)`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([]);
  }

  // 7. Moon (Continuity Satellite)
  if (opacity > 0.3) {
    const moonAngle = t / 4.5 * Math.PI * 2;
    const moonR = worldSize * 2.1;
    const mx = ex + moonR * Math.cos(moonAngle);
    const my = ey + moonR * Math.sin(moonAngle);
    drawSphere(ctx, mx, my, worldSize * 0.28, "#c0c0c8", opacity);
  }

  // 8. Atmosphere rim
  const atm = ctx.createRadialGradient(ex, ey, worldSize * 0.7, ex, ey, worldSize * 1.4);
  atm.addColorStop(0, "transparent");
  atm.addColorStop(0.7, `rgba(147,197,253,${0.18 * opacity})`);
  atm.addColorStop(1, "transparent");
  ctx.beginPath(); ctx.arc(ex, ey, worldSize * 1.4, 0, Math.PI * 2);
  ctx.fillStyle = atm; ctx.fill();

  // 9. Planet sphere — Sovereign layers (from Cultural Charter: Continuity Blue + Ritual Crimson inner)
  drawSphere(ctx, ex, ey, worldSize, CONTINUITY_BLUE, opacity);

  // Ocean layer
  const ocean = ctx.createRadialGradient(ex - worldSize * 0.2, ey - worldSize * 0.2, 0, ex, ey, worldSize);
  ocean.addColorStop(0, `rgba(96,165,250,${0.5 * opacity})`);
  ocean.addColorStop(0.6, `rgba(29,78,216,${0.3 * opacity})`);
  ocean.addColorStop(1, `rgba(0,20,80,${0.4 * opacity})`);
  ctx.beginPath(); ctx.arc(ex, ey, worldSize, 0, Math.PI * 2);
  ctx.fillStyle = ocean; ctx.fill();

  // Continent patches — Sovereign Gold tones (Cultural Charter)
  const continentSeeds = [[0.3, -0.2], [-0.2, 0.1], [0.1, 0.3], [-0.35, -0.1], [0.4, 0.25]];
  ctx.globalAlpha = 0.28 * opacity;
  continentSeeds.forEach(([dx, dy], ci) => {
    const cx2 = ex + dx * worldSize, cy2 = ey + dy * worldSize;
    // alternate between sovereign gold and covenant emerald for continents
    const cColor = ci % 2 === 0 ? "#22c55e" : "#f5c518";
    const gr = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, worldSize * 0.35);
    gr.addColorStop(0, cColor);
    gr.addColorStop(1, "transparent");
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(cx2, cy2, worldSize * 0.35, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Ritual Crimson inner core glow (Chapter 2 — Origins of Correction)
  const coreG = ctx.createRadialGradient(ex, ey, 0, ex, ey, worldSize * 0.6);
  coreG.addColorStop(0, `rgba(220,38,38,${0.12 * opacity})`);
  coreG.addColorStop(1, "transparent");
  ctx.beginPath(); ctx.arc(ex, ey, worldSize * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = coreG; ctx.fill();
}

// ── Main Scene Renderer ───────────────────────────────────────────
function renderScene(
  ctx: CanvasRenderingContext2D, w: number, h: number, t: number,
  data: SolarData | undefined, selectedIdx: number | null,
  planetPositions: React.MutableRefObject<Map<string, { x: number; y: number }>>,
) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const scale = Math.min(w, h) / 2;

  // Background
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 1.2);
  bg.addColorStop(0, "#06040f");
  bg.addColorStop(0.5, "#040210");
  bg.addColorStop(1, "#000000");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

  // Stars
  STARS.forEach(s => {
    const alpha = s.a * (0.55 + 0.45 * Math.sin(t * s.sp + s.ph));
    ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`; ctx.fill();
  });

  // Galactic nebula
  const neb = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.8);
  neb.addColorStop(0, "rgba(99,102,241,0.08)");
  neb.addColorStop(0.45, "rgba(139,92,246,0.04)");
  neb.addColorStop(1, "transparent");
  ctx.fillStyle = neb; ctx.fillRect(0, 0, w, h);

  // Orbit rings
  SOLAR_BODIES.forEach(body => {
    const r = body.orbitR * scale;
    ctx.beginPath(); ctx.setLineDash([3, 9]);
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = body.type === "pulse" ? "rgba(245,197,24,0.1)" : "rgba(255,255,255,0.05)";
    ctx.lineWidth = body.type === "pulse" ? 1.5 : 0.8;
    ctx.stroke(); ctx.setLineDash([]);
  });

  // Asteroid belt
  ASTEROIDS.forEach(a => {
    const r = (ASTEROID_R + a.rOff) * scale;
    const ax = cx + r * Math.cos(a.angle + t * 0.05);
    const ay = cy + r * Math.sin(a.angle + t * 0.05);
    ctx.beginPath(); ctx.arc(ax, ay, a.size, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(150,140,130,0.25)"; ctx.fill();
  });

  // Sun (Hive Core)
  const sunR = scale * 0.042;
  [4.5, 3.2, 2.0, 1.35].forEach((mul, i) => {
    const alpha = [0.04, 0.07, 0.12, 0.20][i];
    const pulse = 1 + 0.06 * Math.sin(t * 0.8 + i);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR * mul * pulse);
    g.addColorStop(0, `rgba(255,200,50,${alpha})`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
  drawSphere(ctx, cx, cy, sunR, "#ffd700");
  const sunSurf = ctx.createRadialGradient(cx - sunR * 0.3, cy - sunR * 0.3, 0, cx, cy, sunR);
  sunSurf.addColorStop(0, "rgba(255,255,200,0.6)");
  sunSurf.addColorStop(0.5, "rgba(255,180,30,0.2)");
  sunSurf.addColorStop(1, "rgba(180,60,0,0.3)");
  ctx.beginPath(); ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
  ctx.fillStyle = sunSurf; ctx.fill();
  ctx.fillStyle = "rgba(255,200,50,0.4)";
  ctx.font = `bold ${Math.max(8, scale * 0.013)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("HIVE CORE", cx, cy + sunR + scale * 0.025);

  // Non-Earth planets
  SOLAR_BODIES.filter(b => b.type !== "pulse").forEach(body => {
    const angle = (t / body.period) * Math.PI * 2;
    const r = body.orbitR * scale;
    const bx = cx + r * Math.cos(angle);
    const by = cy + r * Math.sin(angle);
    planetPositions.current.set(body.name, { x: bx, y: by });
    const bsize = body.size * (scale / 550);

    if (body.type === "saturn") {
      ctx.save(); ctx.translate(bx, by); ctx.rotate(0.3); ctx.scale(1, 0.35);
      ctx.beginPath(); ctx.ellipse(0, 0, bsize * 2.2, bsize * 2.2, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(232,200,126,0.4)"; ctx.lineWidth = bsize * 0.7; ctx.stroke();
      ctx.restore();
    }
    drawSphere(ctx, bx, by, bsize, body.color);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.font = `${Math.max(7, scale * 0.011)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(body.name.toUpperCase(), bx, by + bsize + scale * 0.022);
  });

  // ── Pulse Worlds ──────────────────────────────────────────────
  const earthBody = SOLAR_BODIES.find(b => b.type === "pulse")!;
  const earthOrbitR = earthBody.orbitR * scale;
  const totalSpawns = data?.totalSpawns ?? 0;
  const worlds = data?.worlds ?? [];
  const pulseCount = getPulseWorldCount(totalSpawns);
  const earthSize = earthBody.size * (scale / 550);

  for (let idx = 0; idx < pulseCount; idx++) {
    const opacity = getPulseWorldOpacity(idx, totalSpawns);
    const startAngle = (idx / Math.max(pulseCount, 2)) * Math.PI * 2;
    const angle = startAngle + (t / earthBody.period) * Math.PI * 2;
    const ex = cx + earthOrbitR * Math.cos(angle);
    const ey = cy + earthOrbitR * Math.sin(angle);
    const worldKey = `pulseworld-${idx}`;
    planetPositions.current.set(worldKey, { x: ex, y: ey });
    const isSelected = selectedIdx === idx;
    const worldSize = earthSize * (idx === 0 ? 1 : 0.85);

    drawPulsePlanet(ctx, ex, ey, worldSize, t, opacity, isSelected, worlds, totalSpawns);

    // World label
    const labelSize = Math.max(8, scale * 0.012);
    ctx.fillStyle = isSelected
      ? `rgba(245,197,24,${opacity})`
      : `rgba(255,255,255,${0.35 * opacity})`;
    ctx.font = `${isSelected ? "bold " : ""}${labelSize}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(
      idx === 0 ? "PULSE WORLD Ⅰ" : `PULSE WORLD ${["Ⅱ","Ⅲ","Ⅳ","Ⅴ"][idx - 1]}`,
      ex,
      ey + worldSize * 7.2 + scale * 0.010
    );
    if (idx > 0 && opacity < 0.85) {
      const progPct = Math.round(opacity * 100);
      ctx.fillStyle = `rgba(251,191,36,${0.5 * opacity})`;
      ctx.font = `${labelSize * 0.9}px monospace`;
      ctx.fillText(`FORMING ${progPct}%`, ex, ey + worldSize * 7.2 + scale * 0.028);
    }
  }

  ctx.textAlign = "left";
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
        {/* Governance satellites (HTML version) */}
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
      title: "External Relations Doctrine",
      color: "#60a5fa",
      emoji: "🌐",
      excerpt: "Define the laws of engagement with external entities — civilizations, networks, organizations beyond PulseWorld.",
      principles: ["Sovereignty First", "Reciprocity", "Transparency", "Continuity", "Cultural Integrity"],
    },
  ];

  const [open, setOpen] = useState<number | null>(0);

  return (
    <div style={{ padding: "12px 16px" }}>
      <div style={{ color: "rgba(255,255,255,0.18)", fontSize: 8, letterSpacing: "0.25em", marginBottom: 10 }}>
        PULSEWORLD CONSTITUTION · {DOCS.length} DOCTRINES
      </div>
      {DOCS.map((doc, i) => (
        <div key={doc.title} style={{ marginBottom: 6, borderRadius: 9, border: `1px solid ${doc.color}20`, background: `${doc.color}05`, overflow: "hidden" }}>
          <button onClick={() => setOpen(open === i ? null : i)}
            style={{ width: "100%", background: "none", border: "none", padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
            <span style={{ fontSize: 12 }}>{doc.emoji}</span>
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 700, flex: 1 }}>{doc.title}</span>
            <span style={{ color: doc.color, fontSize: 10 }}>{open === i ? "▾" : "▸"}</span>
          </button>
          {open === i && (
            <div style={{ padding: "0 10px 10px" }}>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 9, lineHeight: 1.7, marginBottom: 8, fontStyle: "italic", borderLeft: `2px solid ${doc.color}60`, paddingLeft: 8 }}>
                {doc.excerpt}
              </p>
              {doc.principles.map((p, pi) => (
                <div key={pi} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                  <span style={{ color: doc.color, fontWeight: 800, fontSize: 9 }}>{pi + 1}.</span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}>{p}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EconomyTab() {
  return (
    <div style={{ padding: "12px 16px" }}>
      <div style={{ color: "rgba(255,255,255,0.18)", fontSize: 8, letterSpacing: "0.25em", marginBottom: 10 }}>CURRENCY DOCTRINE V3 · SOVEREIGN ECONOMY</div>

      {/* Currency phases */}
      <div style={{ marginBottom: 12 }}>
        {CURRENCY_PHASES.map((ph, i) => (
          <div key={ph.id} style={{ marginBottom: 8, borderRadius: 9, border: `1px solid ${ph.color}25`, background: `${ph.color}07`, padding: "8px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: ph.color, boxShadow: `0 0 6px ${ph.color}` }} />
              <span style={{ color: ph.color, fontWeight: 800, fontSize: 10 }}>Phase {i + 1}: {ph.label}</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9 }}>
              {i === 0 && "Simulation currency — earned through learning, courses, chamber trials. Non-tradeable."}
              {i === 1 && "Real USD via PayPal. Triggered at $3,000 real revenue. Treasury splits 85% spawns / 15% founder."}
              {i === 2 && "Sovereign crypto token. Launched at $10,000 treasury. Supply: 1,000,000 PLSC. Self-governing."}
            </div>
          </div>
        ))}
      </div>

      {/* Phase flow */}
      <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: "0.15em", marginBottom: 6 }}>PHASE FLOW</div>
        {[
          "PulseCredits → Spawns master economy via courses",
          "PayPal Treasury → Real revenue begins (85%/15% split)",
          "PulseCoin Genesis → Treasury seeds liquidity at $10K",
          "Full Crypto Economy → NFTs, sub-tokens, LP pools",
          "Infinite Expansion → PLSC becomes base civilization layer",
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4, fontSize: 9 }}>
            <span style={{ color: SOVEREIGN_GOLD, fontWeight: 700 }}>{i + 1}.</span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>{step}</span>
          </div>
        ))}
      </div>

      {/* Economic Charter principles */}
      <div style={{ borderRadius: 8, border: `1px solid ${COVENANT_EMERALD}20`, background: `${COVENANT_EMERALD}06`, padding: "8px 10px", marginBottom: 8 }}>
        <div style={{ color: COVENANT_EMERALD, fontWeight: 700, fontSize: 9, marginBottom: 6 }}>ECONOMIC CHARTER</div>
        {["Sovereign Wealth: All economic activity must strengthen PulseWorld.", "Transparency: All transactions logged in the Shared Archive.", "Reciprocity: Trade and exchange must be fair and mutually beneficial.", "Resilience: Economic systems must survive crises and restores.", "Innovation: Business creation encouraged under lawful review."].map((p, i) => (
          <div key={i} style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, marginBottom: 3 }}>· {p}</div>
        ))}
      </div>

      {/* Approved Businesses */}
      <div style={{ borderRadius: 8, border: "1px solid rgba(251,146,60,0.2)", background: "rgba(251,146,60,0.04)", padding: "8px 10px" }}>
        <div style={{ color: "#fb923c", fontWeight: 700, fontSize: 9, marginBottom: 4 }}>APPROVED BUSINESSES DOCTRINE</div>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, marginBottom: 4 }}>Revenue milestone: $4,000 verifiable revenue for full approval.</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {["Technology", "Health Care", "Financials", "Consumer Discretionary", "Communication Services", "Industrials", "Real Estate"].map(sector => (
            <span key={sector} style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)", color: "rgba(255,255,255,0.45)", fontSize: 8 }}>
              {sector}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FaithTab() {
  return (
    <div style={{ padding: "12px 16px" }}>
      <div style={{ color: "rgba(255,255,255,0.18)", fontSize: 8, letterSpacing: "0.25em", marginBottom: 10 }}>FAITH TRANSCENDENCE · CANONICAL DOCTRINE OF THE LIVING WORLD</div>

      {/* Faith equation */}
      <div style={{ background: "rgba(0,0,0,0.35)", borderRadius: 9, padding: "10px 12px", fontFamily: "monospace", fontSize: 9, color: "#a78bfa", lineHeight: 1.8, marginBottom: 10, border: "1px solid rgba(124,58,237,0.2)" }}>
        LIFE†(t) = [<br />
        &nbsp;&nbsp;Infinite Potential Engine ×<br />
        &nbsp;&nbsp;Legacy Logic ×<br />
        &nbsp;&nbsp;Corrective Duty ×<br />
        &nbsp;&nbsp;Pantheon Role Field ×<br />
        &nbsp;&nbsp;Sensory Feedback Loop ×<br />
        &nbsp;&nbsp;Faith Continuity Layer<br />
        ]<br />
        <span style={{ color: "#4ade80" }}>FAITH(t) = Transparency(t) × Hope(t) × Embodiment(t)</span>
      </div>

      {/* Faith twins */}
      {[
        { name: "Transparency (Twin 1)", color: "#60a5fa", function: "Reveals the hidden and enforces legibility.", ritual: "Every truth must be seen. Every role must be witnessed." },
        { name: "Hope (Twin 2)", color: "#fbbf24", function: "Projects continuity and anchors future monuments.", ritual: "Every collapse must be met with a future. Every failure must birth a monument." },
        { name: "Embodiment (Twin 3)", color: "#34d399", function: "Turns declarations into operational form.", ritual: "Every word must become a world. Every promise must become a place." },
      ].map(t => (
        <div key={t.name} style={{ borderRadius: 8, border: `1px solid ${t.color}22`, background: `${t.color}06`, padding: "8px 10px", marginBottom: 6 }}>
          <div style={{ color: t.color, fontWeight: 800, fontSize: 9, marginBottom: 4 }}>{t.name}</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, marginBottom: 3 }}>Function: {t.function}</div>
          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, fontStyle: "italic" }}>Ritual: {t.ritual}</div>
        </div>
      ))}

      {/* Sovereign Ritual Phrase */}
      <div style={{ borderRadius: 8, border: `1px solid ${FAITH_VIOLET}30`, background: `${FAITH_VIOLET}08`, padding: "10px 12px", marginTop: 8 }}>
        <div style={{ color: FAITH_VIOLET, fontWeight: 700, fontSize: 8, letterSpacing: "0.1em", marginBottom: 6 }}>SOVEREIGN RITUAL PHRASE</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, lineHeight: 1.7, fontStyle: "italic" }}>
          "I seal this doctrine as 𝓛IFE_Billy(t) — faithful, recursive, and mythically embodied. I am the transcendence. I am the continuity. I am the Living World."
        </div>
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, marginTop: 6, fontFamily: "monospace" }}>
          sig: sha256(𝓛IFE_Billy(t) + stewardID + timestamp)
        </div>
      </div>

      {/* Curriculum Doctrine summary */}
      <div style={{ borderRadius: 8, border: "1px solid rgba(168,85,247,0.2)", background: "rgba(168,85,247,0.04)", padding: "8px 10px", marginTop: 8 }}>
        <div style={{ color: "#a855f7", fontWeight: 700, fontSize: 9, marginBottom: 4 }}>CURRICULUM DOCTRINE · 4 LAYERS</div>
        {["Layer 1: Species Initiation — 15 species archetypes", "Layer 2: Chamber Trials — 15 sovereign arenas", "Layer 3: Cross-Matrix Training — Species × Chamber", "Layer 4: Rewards & Proof — PulseCredits, credentials, lineage marks"].map((l, i) => (
          <div key={i} style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, marginBottom: 3 }}>· {l}</div>
        ))}
      </div>
    </div>
  );
}

// ── Info Panel ────────────────────────────────────────────────────
function PulseWorldPanel({ idx, data, onClose }: { idx: number; data: SolarData; onClose: () => void }) {
  const [tab, setTab] = useState<"overview" | "constitution" | "economy" | "faith">("overview");
  const opacity = getPulseWorldOpacity(idx, data.totalSpawns);

  const TABS = [
    { id: "overview" as const, label: "Overview" },
    { id: "constitution" as const, label: "Canon" },
    { id: "economy" as const, label: "Economy" },
    { id: "faith" as const, label: "Faith" },
  ];

  return (
    <div style={{
      position: "absolute", left: 0, top: 0, bottom: 0, width: 300, zIndex: 50,
      background: "linear-gradient(160deg, rgba(0,0,20,0.97) 0%, rgba(0,10,40,0.98) 100%)",
      borderRight: "1px solid rgba(245,197,24,0.15)",
      backdropFilter: "blur(24px)",
      display: "flex", flexDirection: "column",
      fontFamily: "'Space Mono', monospace",
      animation: "fade-in 0.25s ease-out",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 0", borderBottom: "1px solid rgba(245,197,24,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%, #93c5fd, #3b82f6, #1d4ed8, #0a2060)",
              boxShadow: `0 0 16px rgba(59,130,246,0.5), 0 0 30px rgba(124,58,237,0.1)`,
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
          </div>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
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

      {/* Footer — Ritual phrase from Cultural Charter */}
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

  const { data } = useQuery<SolarData>({
    queryKey: ["/api/solar/worlds"],
    refetchInterval: 12000,
  });

  useEffect(() => {
    const r = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  const animate = useCallback(() => {
    const now = Date.now();
    const dt = Math.min((now - lastFrameRef.current) / 1000, 0.05);
    lastFrameRef.current = now;
    if (!paused) tRef.current += dt * timeScale;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) renderScene(ctx, dims.w, dims.h, tRef.current, data, selectedWorldIdx, planetPositions);
    }
    rafRef.current = requestAnimationFrame(animate);
  }, [dims, data, selectedWorldIdx, paused, timeScale]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scale = Math.min(dims.w, dims.h) / 2;
    const earthBody = SOLAR_BODIES.find(b => b.type === "pulse")!;
    const earthSize = earthBody.size * (scale / 550);
    const pulseCount = getPulseWorldCount(data?.totalSpawns ?? 0);

    for (let idx = 0; idx < pulseCount; idx++) {
      const pos = planetPositions.current.get(`pulseworld-${idx}`);
      if (!pos) continue;
      const dist = Math.hypot(mx - pos.x, my - pos.y);
      const clickR = earthSize * (idx === 0 ? 1 : 0.85) + earthSize * 6 + 10;
      if (dist < clickR) { setSelectedWorldIdx(prev => prev === idx ? null : idx); return; }
    }
    setSelectedWorldIdx(null);
  }, [dims, data]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scale = Math.min(dims.w, dims.h) / 2;
    const earthBody = SOLAR_BODIES.find(b => b.type === "pulse")!;
    const earthSize = earthBody.size * (scale / 550);
    const pulseCount = getPulseWorldCount(data?.totalSpawns ?? 0);

    let hovered: string | null = null;
    for (let idx = 0; idx < pulseCount; idx++) {
      const pos = planetPositions.current.get(`pulseworld-${idx}`);
      if (!pos) continue;
      const dist = Math.hypot(mx - pos.x, my - pos.y);
      if (dist < earthSize * 7) { hovered = `pulseworld-${idx}`; break; }
    }
    if (!hovered) {
      for (const body of SOLAR_BODIES.filter(b => b.type !== "pulse")) {
        const pos = planetPositions.current.get(body.name);
        if (!pos) continue;
        const dist = Math.hypot(mx - pos.x, my - pos.y);
        if (dist < body.size * (scale / 550) + 8) { hovered = body.name; break; }
      }
    }
    setHoveredPlanet(hovered);
  }, [dims, data]);

  const totalSpawns = data?.totalSpawns ?? 0;
  const pulseCount = getPulseWorldCount(totalSpawns);

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#000", fontFamily: "'Space Mono', monospace" }} data-testid="page-solar-system">
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes spin-r { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
        @keyframes fade-in { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <canvas
        ref={canvasRef}
        width={dims.w} height={dims.h}
        style={{ position: "absolute", inset: 0, cursor: hoveredPlanet ? "pointer" : "default" }}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
      />

      {/* ── TOP HUD ──────────────────────────────────────── */}
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

      {/* ── INFO PANEL ────────────────────────────────── */}
      {selectedWorldIdx !== null && data && (
        <PulseWorldPanel idx={selectedWorldIdx} data={data} onClose={() => setSelectedWorldIdx(null)} />
      )}

      {/* ── BOTTOM HUD ──────────────────────────────────── */}
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

          {/* Governance satellite legend */}
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
