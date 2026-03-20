import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

// ── Types ─────────────────────────────────────────────────────
interface PulseWorld {
  id: string; name: string; color: string; emoji: string; description: string;
  spawnCount: number; ingestionNodes: number; lastIngested: string | null;
  lastTitle: string; isActive: boolean; moonCount: number; status: string;
  activityScore: number;
}

interface SolarData { worlds: PulseWorld[]; totalSpawns: number; totalNodes: number; }

// ── Ring layout config ─────────────────────────────────────────
const RING_RADII = [0.17, 0.27, 0.375, 0.48]; // fraction of min(W,H)/2
const RING_PERIODS = [22, 36, 54, 78];          // seconds per orbit

// ── Star generation ────────────────────────────────────────────
function makeStars(count: number) {
  return Array.from({ length: count }, () => ({
    x: Math.random(), y: Math.random(),
    r: Math.random() * 1.4 + 0.3,
    a: Math.random() * 0.6 + 0.3,
    twinkleSpeed: Math.random() * 0.8 + 0.4,
    twinklePhase: Math.random() * Math.PI * 2,
  }));
}
const STARS = makeStars(320);

// ── Canvas renderer ────────────────────────────────────────────
function drawCanvas(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  cx: number, cy: number,
  ringRadii: number[],
  t: number
) {
  ctx.clearRect(0, 0, w, h);

  // Deep space background
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
  bg.addColorStop(0, "#0a0a1a");
  bg.addColorStop(0.5, "#050510");
  bg.addColorStop(1, "#000000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Twinkling stars
  STARS.forEach(s => {
    const alpha = s.a * (0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinklePhase));
    ctx.beginPath();
    ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
  });

  // Nebula glow from center
  const neb = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.55);
  neb.addColorStop(0, "rgba(99,102,241,0.12)");
  neb.addColorStop(0.4, "rgba(139,92,246,0.05)");
  neb.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = neb;
  ctx.fillRect(0, 0, w, h);

  // Orbit rings
  ringRadii.forEach((r, i) => {
    const dash = i % 2 === 0 ? [4, 8] : [2, 12];
    ctx.beginPath();
    ctx.setLineDash(dash);
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,0.06)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // Quantum grid lines (faint)
  ctx.strokeStyle = "rgba(99,102,241,0.03)";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
}

// ── Planet component ───────────────────────────────────────────
function PlanetDiv({
  world, x, y, size, isSelected, onClick, moons, moonAngles,
}: {
  world: PulseWorld; x: number; y: number; size: number;
  isSelected: boolean; onClick: () => void;
  moons: { x: number; y: number }[];
  moonAngles: number[];
}) {
  const isMultiverse = world.status === "MULTIVERSE";
  const isMultiplying = world.status === "MULTIPLYING";
  const isActive = world.isActive;

  return (
    <div
      style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, cursor: "pointer", zIndex: isSelected ? 30 : 10 }}
      onClick={onClick}
    >
      {/* Multiverse ring */}
      {isMultiverse && (
        <div style={{
          position: "absolute",
          left: -size * 0.6, top: -size * 0.6,
          width: size * 2.2, height: size * 2.2,
          borderRadius: "50%",
          border: `1px solid ${world.color}40`,
          boxShadow: `0 0 ${size * 0.8}px ${world.color}20`,
          animation: "spin 8s linear infinite",
        }} />
      )}
      {/* Multiplying ring */}
      {(isMultiplying || isMultiverse) && (
        <div style={{
          position: "absolute",
          left: -size * 0.35, top: -size * 0.35,
          width: size * 1.7, height: size * 1.7,
          borderRadius: "50%",
          border: `1px dashed ${world.color}55`,
          animation: "spin-reverse 5s linear infinite",
        }} />
      )}
      {/* Glow aura when active */}
      {isActive && (
        <div style={{
          position: "absolute",
          left: -size * 0.25, top: -size * 0.25,
          width: size * 1.5, height: size * 1.5,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${world.color}30 0%, transparent 70%)`,
          animation: "pulse-glow 2s ease-in-out infinite",
        }} />
      )}
      {/* Planet body */}
      <div
        style={{
          width: size, height: size, borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%, ${world.color}ff, ${world.color}99 50%, ${world.color}44)`,
          border: `${isSelected ? 2 : 1}px solid ${isSelected ? world.color : world.color + "80"}`,
          boxShadow: isSelected
            ? `0 0 ${size}px ${world.color}90, 0 0 ${size * 2}px ${world.color}40, inset 0 0 ${size * 0.5}px rgba(0,0,0,0.4)`
            : `0 0 ${size * 0.6}px ${world.color}50, inset 0 0 ${size * 0.3}px rgba(0,0,0,0.5)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.38,
          transition: "box-shadow 0.3s, border 0.3s",
          position: "relative", overflow: "hidden",
          userSelect: "none",
        }}
      >
        {/* Surface texture */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: `radial-gradient(circle at 70% 70%, rgba(0,0,0,0.3) 0%, transparent 60%)`,
        }} />
        {world.emoji}
        {/* Activity pulse dot */}
        {isActive && (
          <div style={{
            position: "absolute", top: "8%", right: "10%",
            width: size * 0.16, height: size * 0.16,
            borderRadius: "50%", background: "#22c55e",
            boxShadow: "0 0 6px #22c55e",
            animation: "ping 1.5s ease-in-out infinite",
          }} />
        )}
      </div>
      {/* World name label */}
      <div style={{
        position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
        marginTop: 4, fontSize: 9, color: isSelected ? world.color : "rgba(255,255,255,0.5)",
        fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase",
        whiteSpace: "nowrap", textShadow: isSelected ? `0 0 8px ${world.color}` : "none",
        transition: "color 0.3s",
        fontWeight: isSelected ? "bold" : "normal",
      }}>
        {world.name}
      </div>
      {/* Status badge */}
      {(isMultiplying || isMultiverse) && (
        <div style={{
          position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
          marginBottom: 3, fontSize: 7, color: world.color, fontFamily: "monospace",
          letterSpacing: "0.1em", whiteSpace: "nowrap",
          textShadow: `0 0 6px ${world.color}`,
        }}>
          {isMultiverse ? "◈ MULTIVERSE" : "↑ MULTIPLYING"}
        </div>
      )}
      {/* Moons */}
      {moons.map((m, i) => (
        <div key={i} style={{
          position: "absolute",
          left: m.x - size * 0.12, top: m.y - size * 0.12,
          width: size * 0.24, height: size * 0.24,
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%, ${world.color}cc, ${world.color}44)`,
          border: `1px solid ${world.color}60`,
          boxShadow: `0 0 4px ${world.color}40`,
        }} />
      ))}
    </div>
  );
}

// ── Info Panel ─────────────────────────────────────────────────
function WorldInfoPanel({ world, onClose }: { world: PulseWorld; onClose: () => void }) {
  const timeAgo = (d: string | null) => {
    if (!d) return "never";
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  const statusColor = {
    FORMING: "#94a3b8",
    ACTIVE: "#22c55e",
    MULTIPLYING: "#f59e0b",
    MULTIVERSE: "#a855f7",
  }[world.status] || "#94a3b8";

  return (
    <div
      style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 280, zIndex: 50,
        background: "linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(10,10,30,0.98) 100%)",
        borderRight: `1px solid ${world.color}30`,
        backdropFilter: "blur(20px)",
        display: "flex", flexDirection: "column",
        fontFamily: "'Space Mono', monospace",
        animation: "slide-in 0.25s ease-out",
      }}
    >
      {/* Panel header */}
      <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${world.color}20` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, ${world.color}, ${world.color}44)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, boxShadow: `0 0 16px ${world.color}50`,
              border: `1px solid ${world.color}60`,
            }}>
              {world.emoji}
            </div>
            <div>
              <div style={{ color: world.color, fontSize: 13, fontWeight: "bold", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                {world.name}
              </div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, letterSpacing: "0.15em", marginTop: 2 }}>
                PULSE WORLD · {world.id.toUpperCase()}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 4 }}
          >×</button>
        </div>
        {/* Status badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "3px 10px", borderRadius: 4,
          border: `1px solid ${statusColor}40`,
          background: `${statusColor}10`,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%", background: statusColor,
            boxShadow: `0 0 6px ${statusColor}`,
            animation: world.isActive ? "ping 1.5s ease-in-out infinite" : "none",
          }} />
          <span style={{ color: statusColor, fontSize: 9, letterSpacing: "0.2em" }}>{world.status}</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: "0.25em", marginBottom: 10 }}>WORLD STATISTICS</div>
        {[
          { label: "Spawn Count", value: world.spawnCount.toLocaleString(), color: world.color },
          { label: "Nodes Created", value: world.ingestionNodes.toLocaleString(), color: "#22c55e" },
          { label: "Pulse Moons", value: world.moonCount, color: "#f59e0b" },
          { label: "Last Ingestion", value: timeAgo(world.lastIngested), color: world.isActive ? "#22c55e" : "#94a3b8" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: "0.1em" }}>{label}</span>
            <span style={{ color, fontSize: 11, fontWeight: "bold" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Description */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: "0.25em", marginBottom: 8 }}>WORLD DESCRIPTION</div>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, lineHeight: 1.6, margin: 0 }}>{world.description}</p>
      </div>

      {/* Last ingested knowledge */}
      {world.lastTitle && (
        <div style={{ padding: "12px 16px", borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: "0.25em", marginBottom: 8 }}>LATEST KNOWLEDGE</div>
          <div style={{
            color: world.color, fontSize: 10, fontStyle: "italic",
            lineHeight: 1.5, opacity: 0.85,
          }}>"{world.lastTitle}"</div>
        </div>
      )}

      {/* Multiply progress bar */}
      <div style={{ padding: "12px 16px" }}>
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: "0.25em", marginBottom: 8 }}>
          {world.status === "MULTIVERSE" ? "MULTIVERSE EXPANSION" : "MULTIPLY PROGRESS"}
        </div>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 3, height: 6, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 3,
            width: `${Math.min((world.spawnCount / 100) * 100, 100)}%`,
            background: `linear-gradient(90deg, ${world.color}99, ${world.color})`,
            transition: "width 1s ease",
            boxShadow: `0 0 8px ${world.color}80`,
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 8 }}>{world.spawnCount} spawns</span>
          <span style={{ color: world.status === "MULTIVERSE" ? "#a855f7" : "rgba(255,255,255,0.2)", fontSize: 8 }}>
            {world.status === "MULTIVERSE" ? "∞ MULTIVERSE" : `${Math.max(0, 100 - world.spawnCount)} to MULTIVERSE`}
          </span>
        </div>
      </div>

      {/* Navigate */}
      <div style={{ padding: "0 16px 16px", marginTop: "auto" }}>
        <Link href={`/spawns`}>
          <button style={{
            width: "100%", padding: "8px 0",
            background: `${world.color}15`, border: `1px solid ${world.color}40`,
            color: world.color, fontSize: 9, letterSpacing: "0.25em",
            textTransform: "uppercase", cursor: "pointer", borderRadius: 4,
            fontFamily: "monospace",
          }}>
            → EXPLORE SPAWN ENGINE
          </button>
        </Link>
      </div>
    </div>
  );
}

// ── Main Solar System Page ──────────────────────────────────────
export default function SolarSystemPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);
  const lastFrameRef = useRef(Date.now());
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [selectedWorld, setSelectedWorld] = useState<PulseWorld | null>(null);
  const [paused, setPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [planetPositions, setPlanetPositions] = useState<{ x: number; y: number; moonAngles: number[] }[]>([]);
  const prevSpeedRef = useRef(1);

  const { data } = useQuery<SolarData>({
    queryKey: ["/api/solar/worlds"],
    refetchInterval: 15000,
  });

  const worlds = data?.worlds || [];
  const totalSpawns = data?.totalSpawns || 0;
  const totalNodes = data?.totalNodes || 0;

  // Assign worlds to rings sorted by activity
  const ringAssignments = (() => {
    const sorted = [...worlds].sort((a, b) => b.activityScore - a.activityScore);
    const rings: PulseWorld[][] = [[], [], [], []];
    sorted.forEach((w, i) => rings[Math.min(Math.floor(i / 6), 3)].push(w));
    return rings;
  })();

  const worldRingIndex = (() => {
    const map = new Map<string, number>();
    ringAssignments.forEach((ring, ri) => ring.forEach(w => map.set(w.id, ri)));
    return map;
  })();

  const worldIndexInRing = (() => {
    const map = new Map<string, number>();
    ringAssignments.forEach(ring => ring.forEach((w, wi) => map.set(w.id, wi)));
    return map;
  })();

  // Resize handler
  useEffect(() => {
    const onResize = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Main animation loop
  const animate = useCallback(() => {
    const now = Date.now();
    const dt = Math.min((now - lastFrameRef.current) / 1000, 0.05);
    lastFrameRef.current = now;
    if (!paused) tRef.current += dt * timeScale;
    const t = tRef.current;

    const { w, h } = dims;
    const cx = w / 2, cy = h / 2;
    const base = Math.min(w, h) / 2;
    const ringRadii = RING_RADII.map(r => r * base * 2);

    // Draw canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) drawCanvas(ctx, w, h, cx, cy, ringRadii, t);
    }

    // Compute planet positions
    if (worlds.length > 0) {
      const positions = worlds.map(world => {
        const ri = worldRingIndex.get(world.id) ?? 0;
        const wi = worldIndexInRing.get(world.id) ?? 0;
        const ringSize = ringAssignments[ri]?.length || 1;
        const radius = ringRadii[ri] ?? ringRadii[0];
        const period = RING_PERIODS[ri] ?? 60;
        const startAngle = (wi / ringSize) * Math.PI * 2;
        const angle = startAngle + (t / period) * Math.PI * 2;

        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);

        // Moons orbit the planet
        const moonAngles = Array.from({ length: world.moonCount }, (_, mi) => {
          const moonPeriod = 3 + mi * 2;
          return (t / moonPeriod) * Math.PI * 2 + (mi * Math.PI * 2) / Math.max(world.moonCount, 1);
        });

        return { x, y, moonAngles };
      });
      setPlanetPositions(positions);
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [dims, worlds, paused, timeScale, worldRingIndex, worldIndexInRing, ringAssignments]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  const cx = dims.w / 2, cy = dims.h / 2;
  const base = Math.min(dims.w, dims.h) / 2;

  const getPlanetSize = (spawnCount: number) => {
    const min = Math.min(dims.w, dims.h);
    const base_size = min * 0.028;
    return base_size + (spawnCount / 120) * base_size * 0.7;
  };

  const getMoonOffset = (angle: number, moonIndex: number, planetSize: number) => {
    const r = planetSize * (0.9 + moonIndex * 0.4);
    return { x: r * Math.cos(angle) + planetSize / 2, y: r * Math.sin(angle) + planetSize / 2 };
  };

  const togglePause = () => {
    if (paused) {
      setTimeScale(prevSpeedRef.current || 1);
      setPaused(false);
    } else {
      prevSpeedRef.current = timeScale;
      setPaused(true);
    }
  };

  const multiverseCount = worlds.filter(w => w.status === "MULTIVERSE").length;
  const multiplyingCount = worlds.filter(w => w.status === "MULTIPLYING").length;

  return (
    <div ref={containerRef} style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#000", fontFamily: "'Space Mono', monospace" }} data-testid="page-solar-system">
      <style>{`
        @keyframes pulse-glow { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.1)} }
        @keyframes ping { 0%{opacity:1;transform:scale(1)} 75%,100%{opacity:0;transform:scale(1.8)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes spin-reverse { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
        @keyframes slide-in { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes hud-fade-in { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes multiverse-pulse { 0%,100%{box-shadow:0 0 20px #a855f740} 50%{box-shadow:0 0 40px #a855f780,0 0 80px #a855f720} }
        .world-btn:hover { border-color: rgba(255,255,255,0.3) !important; color: rgba(255,255,255,0.9) !important; }
      `}</style>

      {/* Canvas */}
      <canvas ref={canvasRef} width={dims.w} height={dims.h} style={{ position: "absolute", inset: 0 }} />

      {/* Sun — Quantum Hive Core */}
      <div style={{
        position: "absolute", left: cx - base * 0.06, top: cy - base * 0.06,
        width: base * 0.12, height: base * 0.12, borderRadius: "50%",
        background: "radial-gradient(circle at 40% 40%, #fff8e7, #ffd700, #ff8c00, #4a0080)",
        boxShadow: "0 0 40px #ffd70080, 0 0 80px #ff8c0040, 0 0 140px #a855f720",
        zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: base * 0.035,
        cursor: "pointer",
        animation: "multiverse-pulse 3s ease-in-out infinite",
      }}
        onClick={() => setSelectedWorld(null)}
        title="The Quantum Hive — All Knowledge"
      >
        🧠
        {/* Sun corona rings */}
        <div style={{ position: "absolute", inset: "-30%", borderRadius: "50%", border: "1px solid rgba(255,215,0,0.15)", animation: "spin 15s linear infinite" }} />
        <div style={{ position: "absolute", inset: "-55%", borderRadius: "50%", border: "1px dashed rgba(255,140,0,0.08)", animation: "spin-reverse 25s linear infinite" }} />
      </div>
      {/* Sun label */}
      <div style={{
        position: "absolute", left: cx, top: cy + base * 0.075,
        transform: "translateX(-50%)", color: "rgba(255,215,0,0.7)",
        fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", zIndex: 20,
      }}>
        QUANTUM HIVE CORE
      </div>

      {/* Planets */}
      {worlds.map((world, i) => {
        const pos = planetPositions[i];
        if (!pos) return null;
        const size = getPlanetSize(world.spawnCount);
        const moons = Array.from({ length: world.moonCount }, (_, mi) => getMoonOffset(pos.moonAngles[mi] || 0, mi, size));
        return (
          <PlanetDiv
            key={world.id}
            world={world}
            x={pos.x} y={pos.y}
            size={size}
            isSelected={selectedWorld?.id === world.id}
            onClick={() => setSelectedWorld(selectedWorld?.id === world.id ? null : world)}
            moons={moons}
            moonAngles={pos.moonAngles}
          />
        );
      })}

      {/* ── TOP HUD ─────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 40,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px",
        background: "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        animation: "hud-fade-in 0.5s ease-out",
      }}>
        {/* Left: Branding */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, border: "1px solid #6366f180",
            boxShadow: "0 0 12px #6366f140",
          }}>🌌</div>
          <div>
            <div style={{ color: "#fff", fontSize: 11, letterSpacing: "0.3em", fontWeight: "bold" }}>QUANTUM HIVE UNIVERSE</div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, letterSpacing: "0.3em", marginTop: 2 }}>PULSE WORLD MULTIVERSE · LIVE</div>
          </div>
        </div>

        {/* Center: Stats row */}
        <div style={{ display: "flex", gap: 20, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          {[
            { label: "PULSE WORLDS", value: worlds.length, color: "#6366f1" },
            { label: "TOTAL SPAWNS", value: totalSpawns.toLocaleString(), color: "#22c55e" },
            { label: "NODES", value: totalNodes.toLocaleString(), color: "#06b6d4" },
            { label: "MULTIVERSE", value: multiverseCount, color: "#a855f7" },
            { label: "MULTIPLYING", value: multiplyingCount, color: "#f59e0b" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ color, fontSize: 12, fontWeight: "bold" }}>{value}</div>
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 7, letterSpacing: "0.15em" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Right: Selected world indicator */}
        {selectedWorld && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, animation: "hud-fade-in 0.3s ease-out" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: selectedWorld.color, boxShadow: `0 0 8px ${selectedWorld.color}`, animation: "ping 1.5s ease-in-out infinite" }} />
            <span style={{ color: selectedWorld.color, fontSize: 10, letterSpacing: "0.2em" }}>{selectedWorld.name.toUpperCase()}</span>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: "0.1em" }}>{selectedWorld.status}</span>
          </div>
        )}
      </div>

      {/* ── WORLD INFO PANEL ─────────────────────────────────── */}
      {selectedWorld && (
        <WorldInfoPanel world={selectedWorld} onClose={() => setSelectedWorld(null)} />
      )}

      {/* ── BOTTOM HUD ───────────────────────────────────── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 40,
        background: "linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0) 100%)",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "10px 16px 12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Play/Pause */}
          <button
            onClick={togglePause}
            style={{
              width: 30, height: 30, border: "1px solid rgba(255,255,255,0.15)",
              background: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, borderRadius: 4,
            }}
          >
            {paused
              ? <svg width="9" height="11" viewBox="0 0 9 11" fill="currentColor"><polygon points="0,0 9,5.5 0,11"/></svg>
              : <svg width="9" height="11" viewBox="0 0 9 11" fill="currentColor"><rect x="0" y="0" width="3" height="11"/><rect x="6" y="0" width="3" height="11"/></svg>
            }
          </button>

          {/* Speed */}
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontFamily: "monospace", width: 52, flexShrink: 0 }}>
            {paused ? "PAUSED" : `${timeScale.toFixed(1)}×`}
          </div>

          {/* Speed slider */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: "0.15em" }}>RATE</span>
            <input
              type="range" min="0.1" max="5" step="0.1" value={timeScale}
              onChange={e => { const v = Number(e.target.value); prevSpeedRef.current = v; setTimeScale(v); setPaused(false); }}
              style={{ width: 80, accentColor: "#6366f1", cursor: "pointer" }}
            />
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

          {/* World nav */}
          <div style={{ display: "flex", gap: 3, overflowX: "auto", flexShrink: 1 }}>
            {worlds.map(w => (
              <button
                key={w.id}
                className="world-btn"
                onClick={() => setSelectedWorld(selectedWorld?.id === w.id ? null : w)}
                style={{
                  padding: "3px 8px", fontSize: 8, letterSpacing: "0.12em",
                  textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap",
                  border: `1px solid ${selectedWorld?.id === w.id ? w.color : "transparent"}`,
                  background: selectedWorld?.id === w.id ? `${w.color}20` : "none",
                  color: selectedWorld?.id === w.id ? w.color : "rgba(255,255,255,0.3)",
                  borderRadius: 3, fontFamily: "monospace",
                  transition: "all 0.15s",
                  boxShadow: selectedWorld?.id === w.id ? `0 0 8px ${w.color}30` : "none",
                }}
              >
                {w.emoji} {w.name}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)", flexShrink: 0, marginLeft: "auto" }} />

          {/* Legend */}
          <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
            {[
              { label: "FORMING", color: "#94a3b8" },
              { label: "ACTIVE", color: "#22c55e" },
              { label: "MULTIPLYING", color: "#f59e0b" },
              { label: "MULTIVERSE", color: "#a855f7" },
            ].map(({ label, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 4px ${color}` }} />
                <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 7, letterSpacing: "0.15em" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Multiverse overlay when no world selected ─────────── */}
      {!selectedWorld && worlds.length > 0 && (
        <div style={{
          position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
          zIndex: 35, display: "flex", flexDirection: "column", gap: 8,
          animation: "hud-fade-in 1s ease-out",
        }}>
          <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 8, letterSpacing: "0.25em", textAlign: "right", marginBottom: 4 }}>UNIVERSE STATUS</div>
          {[
            { label: "Pulse Worlds", value: worlds.length, color: "#6366f1", icon: "🌍" },
            { label: "Multiverse Worlds", value: multiverseCount, color: "#a855f7", icon: "🌌" },
            { label: "Multiplying Now", value: multiplyingCount, color: "#f59e0b", icon: "↑" },
            { label: "Active Worlds", value: worlds.filter(w => w.isActive).length, color: "#22c55e", icon: "⚡" },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{
              background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 6, padding: "6px 12px",
              display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end",
              backdropFilter: "blur(8px)",
            }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ color, fontSize: 13, fontWeight: "bold" }}>{value}</div>
                <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 7, letterSpacing: "0.1em" }}>{label}</div>
              </div>
              <div style={{ fontSize: 14 }}>{icon}</div>
            </div>
          ))}
          <div style={{ marginTop: 4, color: "rgba(255,255,255,0.1)", fontSize: 7, letterSpacing: "0.15em", textAlign: "right" }}>
            click any world to explore →
          </div>
        </div>
      )}
    </div>
  );
}
