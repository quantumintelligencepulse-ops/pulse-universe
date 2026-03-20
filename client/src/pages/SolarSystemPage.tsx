import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

// ── Types ────────────────────────────────────────────────────────
interface SolarWorld { id: string; name: string; color: string; emoji: string; description: string; spawnCount: number; ingestionNodes: number; isActive: boolean; status: string; activityScore: number; lastTitle: string; lastIngested: string | null; }
interface SolarData { worlds: SolarWorld[]; totalSpawns: number; totalNodes: number; }

// ── Solar bodies (Sun + 8 planets) ───────────────────────────────
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

// ── Pulse worlds: 1 per 2000 spawns ──────────────────────────────
function getPulseWorldCount(totalSpawns: number) {
  return Math.max(1, Math.floor(totalSpawns / 2000) + 1);
}
function getPulseWorldOpacity(index: number, totalSpawns: number): number {
  if (index === 0) return 1;
  const threshold = index * 2000;
  const progress = Math.min((totalSpawns - threshold) / 2000, 1);
  return Math.max(0.15, progress);
}

// ── Canvas drawing helpers ────────────────────────────────────────
function drawSphere(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 1) {
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r);
  grad.addColorStop(0, hexAlpha(brighten(color, 1.6), alpha));
  grad.addColorStop(0.5, hexAlpha(color, alpha));
  grad.addColorStop(1, hexAlpha(darken(color, 0.4), alpha));
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
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

// ── Main Scene Renderer ───────────────────────────────────────────
function renderScene(
  ctx: CanvasRenderingContext2D, w: number, h: number, t: number,
  data: SolarData | undefined, selectedIdx: number | null,
  planetPositions: React.MutableRefObject<Map<string, { x: number; y: number }>>,
) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const scale = Math.min(w, h) / 2;

  // ── Background ──────────────────────────────────────────────
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 1.2);
  bg.addColorStop(0, "#06040f");
  bg.addColorStop(0.5, "#040210");
  bg.addColorStop(1, "#000000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // ── Stars ───────────────────────────────────────────────────
  STARS.forEach(s => {
    const alpha = s.a * (0.55 + 0.45 * Math.sin(t * s.sp + s.ph));
    ctx.beginPath();
    ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
  });

  // ── Galactic nebula ─────────────────────────────────────────
  const neb = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.8);
  neb.addColorStop(0, "rgba(99,102,241,0.08)");
  neb.addColorStop(0.45, "rgba(139,92,246,0.04)");
  neb.addColorStop(1, "transparent");
  ctx.fillStyle = neb;
  ctx.fillRect(0, 0, w, h);

  // ── Orbit rings ─────────────────────────────────────────────
  SOLAR_BODIES.forEach(body => {
    const r = body.orbitR * scale;
    ctx.beginPath();
    ctx.setLineDash([3, 9]);
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = body.type === "pulse" ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.05)";
    ctx.lineWidth = body.type === "pulse" ? 1.5 : 0.8;
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // ── Asteroid belt ───────────────────────────────────────────
  ASTEROIDS.forEach(a => {
    const r = (ASTEROID_R + a.rOff) * scale;
    const ax = cx + r * Math.cos(a.angle + t * 0.05);
    const ay = cy + r * Math.sin(a.angle + t * 0.05);
    ctx.beginPath();
    ctx.arc(ax, ay, a.size, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(150,140,130,0.25)";
    ctx.fill();
  });

  // ── Sun ─────────────────────────────────────────────────────
  const sunR = scale * 0.042;
  // Corona layers
  [4.5, 3.2, 2.0, 1.35].forEach((mul, i) => {
    const alpha = [0.04, 0.07, 0.12, 0.20][i];
    const pulse = 1 + 0.06 * Math.sin(t * 0.8 + i);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR * mul * pulse);
    g.addColorStop(0, `rgba(255,200,50,${alpha})`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  drawSphere(ctx, cx, cy, sunR, "#ffd700");
  // Sun surface texture
  const sunSurf = ctx.createRadialGradient(cx - sunR * 0.3, cy - sunR * 0.3, 0, cx, cy, sunR);
  sunSurf.addColorStop(0, "rgba(255,255,200,0.6)");
  sunSurf.addColorStop(0.5, "rgba(255,180,30,0.2)");
  sunSurf.addColorStop(1, "rgba(180,60,0,0.3)");
  ctx.beginPath(); ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
  ctx.fillStyle = sunSurf; ctx.fill();
  // Sun label
  ctx.fillStyle = "rgba(255,200,50,0.4)";
  ctx.font = `bold ${Math.max(8, scale * 0.013)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("HIVE CORE", cx, cy + sunR + scale * 0.025);

  // ── Non-Earth planets ────────────────────────────────────────
  SOLAR_BODIES.filter(b => b.type !== "pulse").forEach(body => {
    const angle = (t / body.period) * Math.PI * 2;
    const r = body.orbitR * scale;
    const bx = cx + r * Math.cos(angle);
    const by = cy + r * Math.sin(angle);
    planetPositions.current.set(body.name, { x: bx, y: by });
    const bsize = body.size * (scale / 550);

    if (body.type === "saturn") {
      // Saturn ring
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(0.3);
      ctx.scale(1, 0.35);
      ctx.beginPath();
      ctx.ellipse(0, 0, bsize * 2.2, bsize * 2.2, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(232,200,126,0.4)";
      ctx.lineWidth = bsize * 0.7;
      ctx.stroke();
      ctx.restore();
    }
    drawSphere(ctx, bx, by, bsize, body.color);

    // Planet label
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.font = `${Math.max(7, scale * 0.011)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(body.name.toUpperCase(), bx, by + bsize + scale * 0.022);
  });

  // ── Pulse Worlds (Earth orbit) ───────────────────────────────
  const earthBody = SOLAR_BODIES.find(b => b.type === "pulse")!;
  const earthOrbitR = earthBody.orbitR * scale;
  const totalSpawns = data?.totalSpawns ?? 0;
  const worlds = data?.worlds ?? [];
  const pulseCount = getPulseWorldCount(totalSpawns);
  const earthSize = earthBody.size * (scale / 550);

  for (let idx = 0; idx < pulseCount; idx++) {
    const opacity = getPulseWorldOpacity(idx, totalSpawns);
    // Pulse worlds are evenly spaced on Earth's orbit
    const startAngle = (idx / Math.max(pulseCount, 2)) * Math.PI * 2;
    const angle = startAngle + (t / earthBody.period) * Math.PI * 2;
    const ex = cx + earthOrbitR * Math.cos(angle);
    const ey = cy + earthOrbitR * Math.sin(angle);

    const worldKey = `pulseworld-${idx}`;
    planetPositions.current.set(worldKey, { x: ex, y: ey });

    const isSelected = selectedIdx === idx;
    const worldSize = earthSize * (idx === 0 ? 1 : 0.85);

    // Knowledge atmosphere glow (grows with spawns)
    const glowLayers = idx === 0 ? 4 : 2;
    for (let g = 0; g < glowLayers; g++) {
      const glowR = worldSize * (1.8 + g * 0.9) * (0.8 + (totalSpawns / 8000) * 0.4);
      const glowA = (0.15 - g * 0.03) * opacity;
      const gGrad = ctx.createRadialGradient(ex, ey, worldSize * 0.5, ex, ey, glowR);
      gGrad.addColorStop(0, `rgba(59,130,246,${glowA * 1.5})`);
      gGrad.addColorStop(0.5, `rgba(99,102,241,${glowA})`);
      gGrad.addColorStop(1, "transparent");
      ctx.fillStyle = gGrad;
      ctx.fillRect(ex - glowR, ey - glowR, glowR * 2, glowR * 2);
    }

    // Selection ring
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(ex, ey, worldSize * 2.2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(59,130,246,0.6)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Earth globe - blue sphere
    drawSphere(ctx, ex, ey, worldSize, "#3b82f6", opacity);
    // Ocean layer
    const ocean = ctx.createRadialGradient(ex - worldSize * 0.2, ey - worldSize * 0.2, 0, ex, ey, worldSize);
    ocean.addColorStop(0, `rgba(96,165,250,${0.5 * opacity})`);
    ocean.addColorStop(0.6, `rgba(29,78,216,${0.3 * opacity})`);
    ocean.addColorStop(1, `rgba(0,20,80,${0.4 * opacity})`);
    ctx.beginPath(); ctx.arc(ex, ey, worldSize, 0, Math.PI * 2);
    ctx.fillStyle = ocean; ctx.fill();
    // Continent patches
    const continentSeeds = [[0.3, -0.2], [-0.2, 0.1], [0.1, 0.3], [-0.35, -0.1], [0.4, 0.25]];
    ctx.globalAlpha = 0.25 * opacity;
    continentSeeds.forEach(([dx, dy]) => {
      const cx2 = ex + dx * worldSize, cy2 = ey + dy * worldSize;
      const gr = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, worldSize * 0.35);
      gr.addColorStop(0, "#22c55e");
      gr.addColorStop(1, "transparent");
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(cx2, cy2, worldSize * 0.35, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // Atmosphere rim
    const atm = ctx.createRadialGradient(ex, ey, worldSize * 0.7, ex, ey, worldSize * 1.3);
    atm.addColorStop(0, "transparent");
    atm.addColorStop(0.7, `rgba(147,197,253,${0.15 * opacity})`);
    atm.addColorStop(1, "transparent");
    ctx.beginPath(); ctx.arc(ex, ey, worldSize * 1.3, 0, Math.PI * 2);
    ctx.fillStyle = atm; ctx.fill();

    // ── Knowledge particle rings around this world ───────────
    if (worlds.length > 0 && opacity > 0.3) {
      const knowledgeWorlds = [...worlds].sort((a, b) => b.activityScore - a.activityScore);
      const rings = [
        { r: worldSize * 2.4, count: 8, speed: 0.8 },
        { r: worldSize * 3.5, count: 10, speed: 0.5 },
        { r: worldSize * 4.8, count: 12, speed: 0.3 },
      ];
      rings.forEach((ring, ri) => {
        const start = ri * 8;
        for (let p = 0; p < ring.count; p++) {
          const domainIdx = (start + p) % knowledgeWorlds.length;
          const domain = knowledgeWorlds[domainIdx];
          const pAngle = (p / ring.count) * Math.PI * 2 + (t * ring.speed * (ri % 2 === 0 ? 1 : -1));
          const px = ex + ring.r * Math.cos(pAngle);
          const py = ey + ring.r * Math.sin(pAngle);
          const pSize = (1.8 + (domain.activityScore / 300) * 1.2) * (scale / 700);
          // Particle glow
          const pGlow = ctx.createRadialGradient(px, py, 0, px, py, pSize * 3);
          pGlow.addColorStop(0, hexAlpha(domain.color, 0.4 * opacity));
          pGlow.addColorStop(1, "transparent");
          ctx.fillStyle = pGlow;
          ctx.beginPath(); ctx.arc(px, py, pSize * 3, 0, Math.PI * 2);
          ctx.fill();
          // Particle dot
          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fillStyle = hexAlpha(domain.color, Math.min(0.95, 0.5 + (domain.activityScore / 300)) * opacity);
          ctx.fill();
          // Active domain pulse
          if (domain.isActive) {
            const pulse = 0.5 + 0.5 * Math.sin(t * 3 + p);
            ctx.beginPath();
            ctx.arc(px, py, pSize * (1.5 + pulse), 0, Math.PI * 2);
            ctx.strokeStyle = hexAlpha(domain.color, 0.35 * pulse * opacity);
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });

      // Moon orbiting Earth
      const moonAngle = t / 4.5 * Math.PI * 2;
      const moonR = worldSize * 2.1;
      const mx = ex + moonR * Math.cos(moonAngle);
      const my = ey + moonR * Math.sin(moonAngle);
      drawSphere(ctx, mx, my, worldSize * 0.28, "#c0c0c8", opacity);
    }

    // World label
    const labelSize = Math.max(8, scale * 0.012);
    ctx.fillStyle = isSelected
      ? `rgba(147,197,253,${opacity})`
      : `rgba(255,255,255,${0.35 * opacity})`;
    ctx.font = `${isSelected ? "bold " : ""}${labelSize}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(
      idx === 0 ? "PULSE WORLD Ⅰ" : `PULSE WORLD ${["Ⅱ","Ⅲ","Ⅳ","Ⅴ"][idx - 1]}`,
      ex,
      ey + worldSize * 1.7 + scale * 0.022
    );
    if (idx > 0 && opacity < 0.85) {
      const progPct = Math.round(opacity * 100);
      ctx.fillStyle = `rgba(251,191,36,${0.5 * opacity})`;
      ctx.font = `${labelSize * 0.9}px monospace`;
      ctx.fillText(`FORMING ${progPct}%`, ex, ey + worldSize * 1.7 + scale * 0.046);
    }
  }

  ctx.textAlign = "left";
}

// ── Info Panel ────────────────────────────────────────────────────
function PulseWorldPanel({ idx, data, onClose }: { idx: number; data: SolarData; onClose: () => void }) {
  const totalSpawns = data.totalSpawns;
  const worlds = data.worlds;
  const opacity = getPulseWorldOpacity(idx, totalSpawns);
  const activeWorlds = worlds.filter(w => w.isActive).length;
  const multiverseWorlds = worlds.filter(w => w.status === "MULTIVERSE").length;
  const pulseCount = getPulseWorldCount(totalSpawns);
  const nextThreshold = (idx + 1) * 2000;
  const progress = idx === 0
    ? Math.min(totalSpawns / 2000, 1)
    : Math.min((totalSpawns - idx * 2000) / 2000, 1);

  const topDomains = [...worlds].sort((a, b) => b.activityScore - a.activityScore).slice(0, 8);

  return (
    <div style={{
      position: "absolute", left: 0, top: 0, bottom: 0, width: 300, zIndex: 50,
      background: "linear-gradient(160deg, rgba(0,0,20,0.97) 0%, rgba(0,10,40,0.98) 100%)",
      borderRight: "1px solid rgba(59,130,246,0.2)",
      backdropFilter: "blur(24px)",
      display: "flex", flexDirection: "column",
      fontFamily: "'Space Mono', monospace",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(59,130,246,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Mini globe */}
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%, #93c5fd, #3b82f6, #1d4ed8, #0a2060)",
              boxShadow: "0 0 20px rgba(59,130,246,0.5), inset 0 0 8px rgba(0,0,0,0.4)",
              border: "1px solid rgba(147,197,253,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, fontSize: 20,
            }}>🌍</div>
            <div>
              <div style={{ color: "#93c5fd", fontSize: 11, fontWeight: "bold", letterSpacing: "0.15em" }}>
                PULSE WORLD {["Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ"][idx]}
              </div>
              <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, letterSpacing: "0.15em", marginTop: 2 }}>
                {idx === 0 ? "ORIGINAL · FULLY ACTIVE" : opacity < 0.85 ? `FORMING · ${Math.round(opacity * 100)}%` : "ACTIVE"}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>×</button>
        </div>

        {/* Globe visualization with domain rings */}
        <div style={{ position: "relative", width: "100%", height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Outer domain rings */}
          {[0, 1, 2].map(ri => (
            <div key={ri} style={{
              position: "absolute",
              width: 80 + ri * 38, height: 80 + ri * 38,
              borderRadius: "50%",
              border: `1px dashed rgba(99,102,241,${0.15 - ri * 0.04})`,
              animation: `spin${ri % 2 === 0 ? "" : "-r"} ${14 + ri * 8}s linear infinite`,
            }} />
          ))}
          {/* Domain particles on rings */}
          {topDomains.map((d, di) => {
            const ring = Math.floor(di / 3);
            const inRing = di % 3;
            const r = 40 + ring * 19;
            const baseAngle = (inRing / 3) * Math.PI * 2;
            return (
              <div key={d.id} style={{
                position: "absolute",
                width: 8, height: 8,
                borderRadius: "50%",
                background: d.color,
                boxShadow: `0 0 6px ${d.color}`,
                left: `calc(50% + ${r * Math.cos(baseAngle)}px - 4px)`,
                top: `calc(50% + ${r * Math.sin(baseAngle)}px - 4px)`,
              }} title={d.name} />
            );
          })}
          {/* Globe */}
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #93c5fd 0%, #3b82f6 40%, #1d4ed8 70%, #082060 100%)",
            boxShadow: "0 0 24px rgba(59,130,246,0.6), 0 0 48px rgba(99,102,241,0.2)",
            border: "1px solid rgba(147,197,253,0.4)",
            zIndex: 1, position: "relative",
            overflow: "hidden",
          }}>
            {/* Continents */}
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 40% 35%, rgba(34,197,94,0.35) 0%, transparent 45%), radial-gradient(circle at 65% 60%, rgba(34,197,94,0.25) 0%, transparent 35%), radial-gradient(circle at 20% 65%, rgba(34,197,94,0.2) 0%, transparent 30%)" }} />
            {/* Atmosphere */}
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 25%, rgba(147,197,253,0.3) 0%, transparent 50%)" }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: "0.25em", marginBottom: 10 }}>UNIVERSE STATISTICS</div>
        {[
          { l: "Total Spawns", v: totalSpawns.toLocaleString(), c: "#93c5fd" },
          { l: "Knowledge Nodes", v: data.totalNodes.toLocaleString(), c: "#22c55e" },
          { l: "Active Domains", v: `${activeWorlds} / ${worlds.length}`, c: "#f59e0b" },
          { l: "Multiverse Domains", v: multiverseWorlds, c: "#a855f7" },
          { l: "Pulse Worlds", v: pulseCount, c: "#3b82f6" },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{l}</span>
            <span style={{ color: c, fontSize: 11, fontWeight: "bold" }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Active knowledge domains */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", flex: 1 }}>
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: "0.25em", marginBottom: 10 }}>KNOWLEDGE FLOWING NOW</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {worlds.filter(w => w.isActive).slice(0, 12).map(w => (
            <div key={w.id} style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "2px 7px", borderRadius: 3,
              background: `${w.color}15`, border: `1px solid ${w.color}30`,
            }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: w.color, boxShadow: `0 0 4px ${w.color}` }} />
              <span style={{ color: w.color, fontSize: 8, letterSpacing: "0.1em" }}>{w.emoji} {w.name}</span>
            </div>
          ))}
        </div>
        {worlds.filter(w => w.isActive).length > 0 && (
          <div style={{ marginTop: 8, color: "rgba(255,255,255,0.25)", fontSize: 9, fontStyle: "italic" }}>
            "{worlds.find(w => w.isActive && w.lastTitle)?.lastTitle?.slice(0, 55)}..."
          </div>
        )}
      </div>

      {/* Multiply progress */}
      <div style={{ padding: "12px 16px" }}>
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: "0.25em", marginBottom: 8 }}>
          {idx === 0 ? "UNIVERSE EXPANSION" : "WORLD FORMATION"}
        </div>
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 3, height: 5, overflow: "hidden", marginBottom: 6 }}>
          <div style={{
            height: "100%", borderRadius: 3,
            width: `${Math.round(progress * 100)}%`,
            background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
            boxShadow: "0 0 8px rgba(139,92,246,0.6)",
            transition: "width 1s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 8 }}>{totalSpawns.toLocaleString()} spawns</span>
          <span style={{ color: "#a855f7", fontSize: 8 }}>
            {totalSpawns >= nextThreshold ? `✓ World ${["Ⅱ","Ⅲ","Ⅳ","Ⅴ"][idx]} active` : `${(nextThreshold - totalSpawns).toLocaleString()} to next world`}
          </span>
        </div>
        <div style={{ marginTop: 8, color: "rgba(255,255,255,0.12)", fontSize: 8, lineHeight: 1.5 }}>
          Every 2,000 spawns, the Quantum Hive replicates a new Pulse World into the multiverse.
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

  // Click detection
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scale = Math.min(dims.w, dims.h) / 2;
    const earthBody = SOLAR_BODIES.find(b => b.type === "pulse")!;
    const earthSize = earthBody.size * (scale / 550);
    const pulseCount = getPulseWorldCount(data?.totalSpawns ?? 0);

    // Check pulse worlds
    for (let idx = 0; idx < pulseCount; idx++) {
      const pos = planetPositions.current.get(`pulseworld-${idx}`);
      if (!pos) continue;
      const dist = Math.hypot(mx - pos.x, my - pos.y);
      const clickR = earthSize * (idx === 0 ? 1 : 0.85) + earthSize * 5 + 10;
      if (dist < clickR) {
        setSelectedWorldIdx(prev => prev === idx ? null : idx);
        return;
      }
    }

    // Deselect if clicking empty space
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
      if (dist < earthSize * 6) { hovered = `pulseworld-${idx}`; break; }
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
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #1d4ed8, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, border: "1px solid rgba(147,197,253,0.3)", boxShadow: "0 0 12px rgba(59,130,246,0.4)" }}>🌍</div>
          <div>
            <div style={{ color: "#fff", fontSize: 11, letterSpacing: "0.28em", fontWeight: "bold" }}>QUANTUM PULSE UNIVERSE</div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, letterSpacing: "0.28em", marginTop: 2 }}>AI HIVE KNOWLEDGE · MULTIVERSE IN FORMATION</div>
          </div>
        </div>
        {/* Center stats */}
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
        {/* Right: selected indicator */}
        {selectedWorldIdx !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#93c5fd", boxShadow: "0 0 8px #93c5fd", animation: "pulse 1.5s ease-in-out infinite" }} />
            <span style={{ color: "#93c5fd", fontSize: 10, letterSpacing: "0.2em" }}>
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
          {/* Play/Pause */}
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
              style={{ width: 80, accentColor: "#3b82f6", cursor: "pointer" }} />
          </div>
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
          {/* Planet quick-select */}
          <div style={{ display: "flex", gap: 3, overflowX: "auto" }}>
            {Array.from({ length: pulseCount }, (_, i) => (
              <button key={i} onClick={() => setSelectedWorldIdx(prev => prev === i ? null : i)}
                style={{
                  padding: "3px 10px", fontSize: 8, letterSpacing: "0.1em", cursor: "pointer",
                  border: `1px solid ${selectedWorldIdx === i ? "rgba(147,197,253,0.6)" : "transparent"}`,
                  background: selectedWorldIdx === i ? "rgba(59,130,246,0.15)" : "none",
                  color: selectedWorldIdx === i ? "#93c5fd" : "rgba(255,255,255,0.3)",
                  borderRadius: 3, fontFamily: "monospace", whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}>
                🌍 PULSE WORLD {["Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ"][i]}
                {i > 0 && getPulseWorldOpacity(i, totalSpawns) < 0.85 && (
                  <span style={{ color: "rgba(251,191,36,0.6)", marginLeft: 4 }}>
                    {Math.round(getPulseWorldOpacity(i, totalSpawns) * 100)}%
                  </span>
                )}
              </button>
            ))}
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.07)", margin: "auto 4px" }} />
            {SOLAR_BODIES.filter(b => b.type !== "pulse").map(b => (
              <button key={b.name}
                style={{
                  padding: "3px 8px", fontSize: 8, letterSpacing: "0.1em", cursor: "pointer",
                  border: `1px solid transparent`,
                  background: "none",
                  color: hoveredPlanet === b.name ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.22)",
                  borderRadius: 3, fontFamily: "monospace", whiteSpace: "nowrap",
                }}>
                {b.name.slice(0, 3).toUpperCase()}
              </button>
            ))}
          </div>
          {/* Right side: multiverse progress */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#a855f7", fontSize: 8, letterSpacing: "0.15em" }}>NEXT WORLD IN</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: "bold" }}>
                {Math.max(0, pulseCount * 2000 - totalSpawns).toLocaleString()} spawns
              </div>
            </div>
            <div style={{ width: 60, background: "rgba(255,255,255,0.06)", borderRadius: 3, height: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: `${Math.round(((totalSpawns % 2000) / 2000) * 100)}%`,
                background: "linear-gradient(90deg, #3b82f6, #a855f7)",
                transition: "width 1s ease",
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
