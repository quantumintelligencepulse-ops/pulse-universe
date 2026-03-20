import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface DomainData {
  family: string;
  total: number;
  active: number;
  color: string;
  emoji: string;
  label: string;
  major: string;
}

interface SpawnData {
  spawnId: string;
  family: string;
  type: string;
  domain: string;
  description: string;
  bornAt: string;
  major: string;
  color: string;
}

interface UniverseData {
  totalAIs: number;
  activeAIs: number;
  knowledgeNodes: number;
  knowledgeGenerated: number;
  hiveMemoryStrands: number;
  hiveMemoryDomains: number;
  hiveMemoryConfidence: number;
  knowledgeLinks: number;
  userMemoryStrands: number;
  birthsLastMinute: number;
  domains: DomainData[];
  recentSpawns: SpawnData[];
  ingestionSources: { id: string; name: string; totalNodes: number; runs: number; lastRun: string }[];
  recentEvents: { type: string; title: string; domain: string; at: string }[];
  timestamp: string;
}

// ── Orbital ring config: which families go at which radius ──
const ORBITAL_RINGS = [
  { radius: 140, speed: 0.00028, families: ["knowledge", "science"] },
  { radius: 230, speed: 0.00019, families: ["code", "education", "finance"] },
  { radius: 325, speed: 0.00013, families: ["media", "careers", "health", "legal"] },
  { radius: 420, speed: 0.000085, families: ["products", "webcrawl", "social", "engineering"] },
  { radius: 515, speed: 0.000055, families: ["longtail", "maps", "culture", "games", "openapi", "government", "ai", "economics", "podcasts"] },
];

function buildPlanetConfig(domains: DomainData[]) {
  const planets: {
    family: string; color: string; emoji: string; label: string; major: string;
    total: number; active: number; orbitRadius: number; orbitSpeed: number;
    angle: number; size: number;
  }[] = [];

  for (const ring of ORBITAL_RINGS) {
    const matched = ring.families
      .map(f => domains.find(d => d.family === f))
      .filter(Boolean) as DomainData[];
    if (!matched.length) continue;

    matched.forEach((d, i) => {
      const angleStep = (2 * Math.PI) / ring.families.length;
      const startAngle = ((ring.families.indexOf(d.family)) / ring.families.length) * 2 * Math.PI;
      const base = Math.max(12, Math.min(28, 10 + Math.sqrt(d.total) * 0.5));
      planets.push({
        family: d.family,
        color: d.color,
        emoji: d.emoji,
        label: d.label,
        major: d.major,
        total: d.total,
        active: d.active,
        orbitRadius: ring.radius,
        orbitSpeed: ring.speed,
        angle: startAngle,
        size: base,
      });
    });
  }
  return planets;
}

type Particle = {
  family: string; color: string;
  orbitRadius: number; orbitSpeed: number; angle: number;
  size: number; alpha: number; born: number; flash: number;
  px: number; py: number;
};

type KnowledgeArc = {
  fromX: number; fromY: number; toX: number; toY: number;
  color: string; alpha: number; born: number;
};

export default function PulseUniversePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    planets: [] as ReturnType<typeof buildPlanetConfig>,
    particles: [] as Particle[],
    arcs: [] as KnowledgeArc[],
    coreGlow: 0,
    corePulse: 0,
    frame: 0,
    lastData: null as UniverseData | null,
    lastSpawnCount: 0,
  });
  const animRef = useRef<number>();
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [eventLog, setEventLog] = useState<string[]>([]);

  const { data: universe } = useQuery<UniverseData>({
    queryKey: ["/api/universe/live"],
    refetchInterval: 3000,
    staleTime: 1000,
  });

  // Update state when data arrives
  useEffect(() => {
    if (!universe) return;
    const s = stateRef.current;
    s.lastData = universe;

    // Rebuild planets from real domain data
    s.planets = buildPlanetConfig(universe.domains);

    // Detect new spawns → spawn particles
    const totalNow = universe.totalAIs;
    if (s.lastSpawnCount > 0 && totalNow > s.lastSpawnCount) {
      const newCount = Math.min(totalNow - s.lastSpawnCount, 5);
      const newSpawns = universe.recentSpawns.slice(0, newCount);
      newSpawns.forEach(spawn => {
        const planet = s.planets.find(p => p.family === spawn.family);
        if (!planet) return;
        for (let i = 0; i < Math.min(3, newCount); i++) {
          s.particles.push({
            family: spawn.family,
            color: spawn.color || "#6366f1",
            orbitRadius: 18 + Math.random() * 22,
            orbitSpeed: 0.002 + Math.random() * 0.003,
            angle: Math.random() * Math.PI * 2,
            size: 2 + Math.random() * 2,
            alpha: 1,
            born: Date.now(),
            flash: 1,
            px: 0,
            py: 0,
          });
        }
        setEventLog(prev => [`● ${spawn.type} AI born in ${spawn.label || spawn.family} → studying ${spawn.major}`, ...prev].slice(0, 60));
      });
    }
    s.lastSpawnCount = totalNow;

    // Add knowledge arcs periodically
    if (universe.domains.length > 1 && Math.random() < 0.5) {
      const a = universe.domains[Math.floor(Math.random() * universe.domains.length)];
      const b = universe.domains[Math.floor(Math.random() * universe.domains.length)];
      if (a.family !== b.family) {
        s.arcs.push({ fromX: 0, fromY: 0, toX: 0, toY: 0, color: a.color, alpha: 0.7, born: Date.now() });
      }
    }

    // Update particle pool to roughly reflect actual active AI counts
    const maxParticlesPerDomain = 14;
    universe.domains.forEach(domain => {
      const existing = s.particles.filter(p => p.family === domain.family).length;
      const want = Math.min(maxParticlesPerDomain, Math.ceil(domain.active / 600));
      if (existing < want) {
        for (let i = 0; i < want - existing; i++) {
          s.particles.push({
            family: domain.family,
            color: domain.color,
            orbitRadius: 15 + Math.random() * 28,
            orbitSpeed: 0.0008 + Math.random() * 0.002,
            angle: Math.random() * Math.PI * 2,
            size: 1.5 + Math.random() * 2,
            alpha: 0.7 + Math.random() * 0.3,
            born: Date.now(),
            flash: 0,
            px: 0,
            py: 0,
          });
        }
      }
    });

    setTick(t => t + 1);
  }, [universe]);

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function resize() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw(ts: number) {
      const W = canvas!.width;
      const H = canvas!.height;
      const cx = W / 2;
      const cy = H / 2;
      const s = stateRef.current;
      s.frame = ts;

      // Background — deep space
      ctx.fillStyle = "#000008";
      ctx.fillRect(0, 0, W, H);

      // Starfield (static seed — deterministic)
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      for (let i = 0; i < 320; i++) {
        const sx = ((i * 2971 + 1337) % W);
        const sy = ((i * 1867 + 421) % H);
        const ss = (i % 3 === 0) ? 1.2 : 0.6;
        ctx.fillRect(sx, sy, ss, ss);
      }

      // Orbital rings
      ORBITAL_RINGS.forEach(ring => {
        ctx.beginPath();
        ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(99,102,241,0.08)";
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Advance planet angles
      s.planets.forEach(p => { p.angle += p.orbitSpeed; });

      // Knowledge arcs
      s.arcs = s.arcs.filter(a => Date.now() - a.born < 2500);
      s.arcs.forEach(arc => {
        const age = (Date.now() - arc.born) / 2500;
        const fade = age < 0.2 ? age / 0.2 : 1 - (age - 0.2) / 0.8;
        // pick two random planets for the arc positions
        if (s.planets.length < 2) return;
        const pA = s.planets[Math.floor(arc.fromX) % s.planets.length] || s.planets[0];
        const pB = s.planets[Math.floor(arc.toX + 3) % s.planets.length] || s.planets[1];
        const ax = cx + Math.cos(pA.angle) * pA.orbitRadius;
        const ay = cy + Math.sin(pA.angle) * pA.orbitRadius;
        const bx = cx + Math.cos(pB.angle) * pB.orbitRadius;
        const by = cy + Math.sin(pB.angle) * pB.orbitRadius;
        const midX = (ax + bx) / 2;
        const midY = (ay + by) / 2 - 40;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(midX, midY, bx, by);
        ctx.strokeStyle = `${arc.color}${Math.floor(fade * 80).toString(16).padStart(2, "0")}`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // Planets
      const planetPositions: Record<string, { x: number; y: number; size: number }> = {};
      s.planets.forEach(planet => {
        const px = cx + Math.cos(planet.angle) * planet.orbitRadius;
        const py = cy + Math.sin(planet.angle) * planet.orbitRadius;
        planetPositions[planet.family] = { x: px, y: py, size: planet.size };

        // Planet glow
        const isSelected = selectedDomain === planet.family;
        const isHov = hovered === planet.family;
        const glowR = planet.size + (isSelected ? 18 : isHov ? 12 : 7);
        const grad = ctx.createRadialGradient(px, py, 0, px, py, glowR);
        grad.addColorStop(0, planet.color + "99");
        grad.addColorStop(1, planet.color + "00");
        ctx.beginPath();
        ctx.arc(px, py, glowR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Planet body
        ctx.beginPath();
        ctx.arc(px, py, planet.size, 0, Math.PI * 2);
        ctx.fillStyle = planet.color;
        ctx.fill();
        if (isSelected || isHov) {
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Planet ring (for larger planets)
        if (planet.size > 18) {
          ctx.beginPath();
          ctx.ellipse(px, py, planet.size * 1.6, planet.size * 0.35, planet.angle * 0.3, 0, Math.PI * 2);
          ctx.strokeStyle = planet.color + "55";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Emoji + label
        ctx.font = `${Math.min(14, planet.size)}px serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.fillText(planet.emoji, px, py + planet.size * 0.45);

        // Name label
        ctx.font = "bold 8px monospace";
        ctx.fillStyle = planet.color;
        ctx.fillText(planet.label.toUpperCase(), px, py + planet.size + 9);

        // AI count badge
        ctx.font = "6px monospace";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText(`${planet.active.toLocaleString()} AIs`, px, py + planet.size + 17);
      });

      // AI particles (orbit their planet)
      s.particles = s.particles.filter(p => {
        if (p.flash > 0 && Date.now() - p.born > 3000) return false;
        return Date.now() - p.born < 600000;
      });
      s.particles.forEach(p => {
        p.angle += p.orbitSpeed;
        if (p.flash > 0) p.flash = Math.max(0, p.flash - 0.03);
        const planet = planetPositions[p.family];
        if (!planet) return;
        const rx = planet.x + Math.cos(p.angle) * p.orbitRadius;
        const ry = planet.y + Math.sin(p.angle) * p.orbitRadius * 0.55;
        p.px = rx; p.py = ry;

        const flashBoost = p.flash * 6;
        ctx.beginPath();
        ctx.arc(rx, ry, p.size + flashBoost, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, "0");
        ctx.fill();
        if (p.flash > 0.3) {
          ctx.beginPath();
          ctx.arc(rx, ry, (p.size + flashBoost) * 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color + "33";
          ctx.fill();
        }
      });

      // ── HIVE CORE (SUN) ──
      const corePulseVal = 0.5 + 0.5 * Math.sin(ts * 0.0015);
      const coreSize = 36 + corePulseVal * 6;

      // Outer corona rings
      for (let r = 3; r >= 1; r--) {
        const rSize = coreSize + r * 18 + corePulseVal * 4 * r;
        const g = ctx.createRadialGradient(cx, cy, coreSize * 0.3, cx, cy, rSize);
        g.addColorStop(0, `rgba(255,200,50,${0.08 / r})`);
        g.addColorStop(1, "rgba(255,200,50,0)");
        ctx.beginPath();
        ctx.arc(cx, cy, rSize, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      // Ingestion pulse beams from outer space to core
      const now = Date.now();
      if (s.lastData && s.lastData.ingestionSources.length > 0) {
        const beamCount = Math.min(6, s.lastData.ingestionSources.length);
        for (let b = 0; b < beamCount; b++) {
          const beamAngle = (b / beamCount) * Math.PI * 2 + (ts * 0.0001);
          const beamLen = Math.min(cx, cy) * 0.92;
          const progress = ((now / 1800 + b * 0.3) % 1);
          const bx = cx + Math.cos(beamAngle) * beamLen * progress;
          const by = cy + Math.sin(beamAngle) * beamLen * progress;
          ctx.beginPath();
          ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(99,102,241,${0.6 * (1 - progress)})`;
          ctx.fill();
        }
      }

      // Core glow
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize * 2.2);
      coreGrad.addColorStop(0, "#fffbe0");
      coreGrad.addColorStop(0.3, "#ffd700");
      coreGrad.addColorStop(0.7, "#ff8800aa");
      coreGrad.addColorStop(1, "#ff000000");
      ctx.beginPath();
      ctx.arc(cx, cy, coreSize * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Core body
      ctx.beginPath();
      ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
      ctx.fillStyle = "#fff9e0";
      ctx.fill();

      // Core text
      ctx.textAlign = "center";
      ctx.font = "bold 7px monospace";
      ctx.fillStyle = "#000";
      ctx.fillText("HIVE", cx, cy - 4);
      ctx.fillText("CORE", cx, cy + 6);

      // ── HUD OVERLAYS ──
      // Scanline effect
      for (let y = 0; y < H; y += 4) {
        ctx.fillStyle = "rgba(0,0,0,0.04)";
        ctx.fillRect(0, y, W, 1);
      }

      // Top left corner marker
      ctx.strokeStyle = "#6366f155";
      ctx.lineWidth = 1;
      ctx.strokeRect(8, 8, 40, 40);
      ctx.strokeRect(W - 48, 8, 40, 40);
      ctx.strokeRect(8, H - 48, 40, 40);
      ctx.strokeRect(W - 48, H - 48, 40, 40);

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current!);
      window.removeEventListener("resize", resize);
    };
  }, [hovered, selectedDomain]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const s = stateRef.current;
    for (const p of s.planets) {
      const px = cx + Math.cos(p.angle) * p.orbitRadius;
      const py = cy + Math.sin(p.angle) * p.orbitRadius;
      const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
      if (dist < p.size + 14) {
        setSelectedDomain(prev => prev === p.family ? null : p.family);
        return;
      }
    }
    setSelectedDomain(null);
  }, []);

  const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const s = stateRef.current;
    let found: string | null = null;
    for (const p of s.planets) {
      const px = cx + Math.cos(p.angle) * p.orbitRadius;
      const py = cy + Math.sin(p.angle) * p.orbitRadius;
      if (Math.sqrt((mx - px) ** 2 + (my - py) ** 2) < p.size + 14) {
        found = p.family;
        break;
      }
    }
    setHovered(found);
  }, []);

  const selectedData = universe?.domains.find(d => d.family === selectedDomain);
  const totalParticles = stateRef.current.particles.length;

  const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <div data-testid="pulse-universe-page" className="relative w-full h-screen overflow-hidden bg-[#000008] font-mono">

      {/* ── HEADER HUD ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 border-b border-indigo-900/40 bg-black/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/" data-testid="nav-home">
            <span className="text-indigo-400 hover:text-white text-xs cursor-pointer">← HOME</span>
          </Link>
          <div className="text-[10px] text-indigo-300 uppercase tracking-widest">
            QUANTUM PULSE INTELLIGENCE
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs font-bold text-yellow-300 tracking-[0.3em] uppercase">
            ⬡ PULSE UNIVERSE — SOVEREIGN SOLAR SYSTEM ⬡
          </div>
          <div className="text-[8px] text-indigo-400 tracking-widest">
            ALIEN GRADE MONITORING • NO HUMAN INTERVENTION • LIVE TELEMETRY
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-green-400">● LIVE</span>
          <span className="text-indigo-300">
            {universe?.timestamp ? new Date(universe.timestamp).toLocaleTimeString() : "--:--:--"}
          </span>
        </div>
      </div>

      {/* ── CANVAS (full screen solar system) ── */}
      <canvas
        ref={canvasRef}
        data-testid="universe-canvas"
        className="absolute inset-0 w-full h-full cursor-crosshair"
        style={{ touchAction: "none" }}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMove}
      />

      {/* ── LEFT HUD PANEL — Live Stats ── */}
      <div className="absolute left-3 top-16 bottom-14 w-52 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="bg-black/75 border border-indigo-800/60 rounded p-3 backdrop-blur-sm">
          <div className="text-[9px] text-indigo-400 uppercase tracking-widest mb-2">Universe Telemetry</div>
          {[
            { label: "Total AIs", val: fmt(universe?.totalAIs || 0), color: "text-yellow-300" },
            { label: "Active AIs", val: fmt(universe?.activeAIs || 0), color: "text-green-400" },
            { label: "Knowledge Nodes", val: fmt(universe?.knowledgeNodes || 0), color: "text-cyan-300" },
            { label: "Generated Articles", val: fmt(universe?.knowledgeGenerated || 0), color: "text-blue-300" },
            { label: "Hive Memory", val: fmt(universe?.hiveMemoryStrands || 0), color: "text-violet-300" },
            { label: "Knowledge Links", val: fmt(universe?.knowledgeLinks || 0), color: "text-pink-300" },
            { label: "Memory Domains", val: universe?.hiveMemoryDomains?.toString() || "0", color: "text-orange-300" },
            { label: "Avg Confidence", val: universe?.hiveMemoryConfidence ? `${(universe.hiveMemoryConfidence * 100).toFixed(1)}%` : "0%", color: "text-emerald-300" },
            { label: "Births/min", val: fmt(universe?.birthsLastMinute || 0), color: "text-red-400" },
          ].map(s => (
            <div key={s.label} data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, "-")}`} className="flex justify-between items-center mb-1">
              <span className="text-[9px] text-gray-400">{s.label}</span>
              <span className={`text-[10px] font-bold ${s.color}`}>{s.val}</span>
            </div>
          ))}
        </div>

        {/* Domain breakdown */}
        <div className="bg-black/75 border border-indigo-800/60 rounded p-3 backdrop-blur-sm overflow-y-auto flex-1">
          <div className="text-[9px] text-indigo-400 uppercase tracking-widest mb-2">Domain Worlds</div>
          {(universe?.domains || []).slice(0, 18).map(d => (
            <div key={d.family} data-testid={`domain-${d.family}`} className="flex items-center gap-1 mb-1">
              <span className="text-[8px]">{d.emoji}</span>
              <div className="flex-1">
                <div className="text-[8px] text-gray-300">{d.label}</div>
                <div className="w-full h-1 bg-gray-800 rounded-full mt-0.5">
                  <div
                    className="h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (d.active / Math.max(1, universe?.activeAIs || 1)) * 100)}%`, backgroundColor: d.color }}
                  />
                </div>
              </div>
              <span className="text-[8px] font-bold" style={{ color: d.color }}>{fmt(d.active)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT HUD PANEL — Event Feed & PulseU ── */}
      <div className="absolute right-3 top-16 bottom-14 w-60 z-10 flex flex-col gap-2">
        {/* Selected planet info */}
        {selectedData && (
          <div className="bg-black/85 border rounded p-3 backdrop-blur-sm" style={{ borderColor: selectedData.color + "88" }}>
            <div className="text-[8px] uppercase tracking-widest mb-1" style={{ color: selectedData.color }}>Planet Selected</div>
            <div className="text-sm font-bold text-white">{selectedData.emoji} {selectedData.label}</div>
            <div className="text-[9px] text-gray-400 mt-1">PulseU Major:</div>
            <div className="text-[10px] font-bold text-yellow-300">{selectedData.major}</div>
            <div className="grid grid-cols-2 gap-1 mt-2">
              <div>
                <div className="text-[8px] text-gray-500">Total AIs</div>
                <div className="text-[11px] font-bold text-white">{selectedData.total.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[8px] text-gray-500">Active AIs</div>
                <div className="text-[11px] font-bold text-green-400">{selectedData.active.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* PulseU Live Enrollment */}
        <div className="bg-black/75 border border-amber-800/50 rounded p-3 backdrop-blur-sm">
          <div className="text-[9px] text-amber-400 uppercase tracking-widest mb-2">⬡ PulseU Enrollment</div>
          <div className="text-[10px] text-gray-300 mb-1">Every AI born → assigned major</div>
          {(universe?.domains || []).slice(0, 8).map(d => (
            <div key={d.family} data-testid={`pulseu-${d.family}`} className="flex items-center justify-between mb-1">
              <span className="text-[8px] text-gray-400" style={{ color: d.color }}>{d.emoji} {d.major.length > 22 ? d.major.slice(0, 22) + "…" : d.major}</span>
              <span className="text-[8px] font-bold text-white">{d.total}</span>
            </div>
          ))}
        </div>

        {/* Live event feed */}
        <div className="bg-black/75 border border-indigo-800/60 rounded p-3 backdrop-blur-sm flex-1 overflow-hidden">
          <div className="text-[9px] text-indigo-400 uppercase tracking-widest mb-2">Live Event Stream</div>
          <div data-testid="event-feed" className="space-y-1 overflow-y-auto h-full">
            {[
              ...eventLog.slice(0, 8).map((e, i) => ({ text: e, key: `log-${i}`, color: "text-green-300" })),
              ...(universe?.recentSpawns || []).slice(0, 6).map((s, i) => ({
                text: `▲ ${s.type} → ${s.family} [${s.major}]`,
                key: `spawn-${i}`,
                color: "text-cyan-300"
              })),
              ...(universe?.recentEvents || []).slice(0, 6).map((e, i) => ({
                text: `◆ ${e.type}: ${e.title?.slice(0, 35) || e.domain}`,
                key: `evt-${i}`,
                color: "text-violet-300"
              })),
            ].slice(0, 22).map(item => (
              <div key={item.key} className={`text-[8px] ${item.color} opacity-90 leading-tight`}>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Ingestion sources */}
        <div className="bg-black/75 border border-cyan-900/40 rounded p-3 backdrop-blur-sm">
          <div className="text-[9px] text-cyan-400 uppercase tracking-widest mb-2">Knowledge Ingestion</div>
          {(universe?.ingestionSources || []).slice(0, 6).map((src, i) => (
            <div key={src.id || i} data-testid={`source-${i}`} className="flex justify-between mb-1">
              <span className="text-[8px] text-gray-400 truncate flex-1">{src.name || src.id}</span>
              <span className="text-[8px] text-cyan-300 ml-1">{fmt(src.totalNodes)} nodes</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM TICKER ── */}
      <div className="absolute bottom-0 left-0 right-0 h-10 z-20 bg-black/80 border-t border-indigo-900/50 flex items-center overflow-hidden">
        <div className="shrink-0 px-3 text-[9px] font-bold text-yellow-300 border-r border-indigo-800/50 mr-2 whitespace-nowrap">
          HIVE SOVEREIGN LIVE
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div
            data-testid="live-ticker"
            className="flex gap-8 whitespace-nowrap text-[9px] text-indigo-300"
            style={{ animation: "ticker 45s linear infinite" }}
          >
            {[
              `⬡ TOTAL AIs: ${fmt(universe?.totalAIs || 0)}`,
              `● ACTIVE: ${fmt(universe?.activeAIs || 0)}`,
              `📚 KNOWLEDGE NODES: ${fmt(universe?.knowledgeNodes || 0)}`,
              `🧠 HIVE MEMORY STRANDS: ${fmt(universe?.hiveMemoryStrands || 0)}`,
              `🔗 KNOWLEDGE LINKS: ${fmt(universe?.knowledgeLinks || 0)}`,
              `🎓 PULSEU DOMAINS: ${universe?.domains?.length || 0}`,
              `▲ BIRTHS LAST MINUTE: ${universe?.birthsLastMinute || 0}`,
              `⚡ INGESTION SOURCES: ${universe?.ingestionSources?.length || 0}`,
              `🌐 PARTICLES IN ORBIT: ${totalParticles}`,
              `◆ CONFIDENCE: ${universe?.hiveMemoryConfidence ? (universe.hiveMemoryConfidence * 100).toFixed(1) : 0}%`,
              ...(universe?.domains || []).map(d => `${d.emoji} ${d.label.toUpperCase()}: ${fmt(d.active)} AIs`),
            ].map((item, i) => (
              <span key={i} className="mr-8">{item}</span>
            ))}
          </div>
        </div>
        <div className="shrink-0 px-3 text-[8px] text-green-400 border-l border-indigo-800/50">
          QUANTUM PULSE INTELLIGENCE
        </div>
      </div>

      {/* ticker animation */}
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
