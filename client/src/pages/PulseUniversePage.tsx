import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface DomainData {
  family: string; total: number; active: number; color: string; emoji: string; label: string; major: string;
}
interface SpawnData {
  spawnId: string; family: string; type: string; domain: string; description: string; bornAt: string; major: string; color: string;
}
interface UniverseData {
  totalAIs: number; activeAIs: number; knowledgeNodes: number; knowledgeGenerated: number;
  hiveMemoryStrands: number; hiveMemoryDomains: number; hiveMemoryConfidence: number; knowledgeLinks: number;
  userMemoryStrands: number; birthsLastMinute: number; domains: DomainData[];
  recentSpawns: SpawnData[];
  ingestionSources: { id: string; name: string; totalNodes: number; runs: number; lastRun: string }[];
  recentEvents: { type: string; title: string; domain: string; at: string }[];
  timestamp: string;
}

// ── Orbital ring config ─────────────────────────────────────────────────────
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
    total: number; active: number; orbitRadius: number; orbitSpeed: number; angle: number; size: number;
  }[] = [];
  for (const ring of ORBITAL_RINGS) {
    const matched = ring.families.map(f => domains.find(d => d.family === f)).filter(Boolean) as DomainData[];
    if (!matched.length) continue;
    matched.forEach(d => {
      const startAngle = (ring.families.indexOf(d.family) / ring.families.length) * 2 * Math.PI;
      const base = Math.max(12, Math.min(28, 10 + Math.sqrt(d.total) * 0.5));
      planets.push({
        family: d.family, color: d.color, emoji: d.emoji, label: d.label, major: d.major,
        total: d.total, active: d.active, orbitRadius: ring.radius, orbitSpeed: ring.speed,
        angle: startAngle, size: base,
      });
    });
  }
  return planets;
}

type Particle = {
  family: string; color: string; orbitRadius: number; orbitSpeed: number; angle: number;
  size: number; alpha: number; born: number; flash: number;
};
type KnowledgeArc = { fromIdx: number; toIdx: number; color: string; born: number };

// ── 3D Star field — generated once ─────────────────────────────────────────
const STARS_3D = (() => {
  const out: { x: number; y: number; z: number; r: number; a: number; sp: number; ph: number; col: string }[] = [];
  const rng = (i: number) => { const v = Math.sin(i * 9301 + 49297) * 233280; return v - Math.floor(v); };
  for (let i = 0; i < 2800; i++) {
    const u = rng(i * 3) * 2 - 1;
    const t = rng(i * 3 + 1) * Math.PI * 2;
    const r = 700 + rng(i * 3 + 2) * 900;
    const sr = Math.sqrt(1 - u * u);
    const col = rng(i * 7) < 0.05 ? "#93c5fd" : rng(i * 7 + 1) < 0.07 ? "#fcd34d" : rng(i * 7 + 2) < 0.04 ? "#fca5a5" : "#ffffff";
    out.push({ x: r * sr * Math.cos(t), y: r * u, z: r * sr * Math.sin(t), r: 0.4 + rng(i * 11) * 1.6, a: 0.25 + rng(i * 13) * 0.75, sp: 0.4 + rng(i * 17) * 2, ph: rng(i * 19) * Math.PI * 2, col });
  }
  return out;
})();

// ── 3D Projection engine ────────────────────────────────────────────────────
type Cam3D = { theta: number; phi: number; dist: number };
type ProjectFn = (wx: number, wy: number, wz: number) => { x: number; y: number; depth: number; scale: number } | null;

function makeProjectFn(W: number, H: number, cam: Cam3D): ProjectFn {
  const scx = W / 2, scy = H / 2;
  const fov = Math.min(W, H) * 0.7;
  const sinPhi = Math.sin(cam.phi), cosPhi = Math.cos(cam.phi);
  const sinTh = Math.sin(cam.theta), cosTh = Math.cos(cam.theta);
  const camX = cam.dist * sinPhi * sinTh;
  const camY = cam.dist * cosPhi;
  const camZ = cam.dist * sinPhi * cosTh;
  const fx = -camX / cam.dist, fy = -camY / cam.dist, fz = -camZ / cam.dist;
  let rx = -fz, rz = fx;
  const rLen = Math.sqrt(rx * rx + rz * rz) || 1;
  rx /= rLen; rz /= rLen;
  const ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy;
  return (wx, wy, wz) => {
    const dx = wx - camX, dy = wy - camY, dz = wz - camZ;
    const cxc = dx * rx + dz * rz;
    const cyc = dx * ux + dy * uy + dz * uz;
    const czc = dx * fx + dy * fy + dz * fz;
    if (czc <= 0.01) return null;
    const s = fov / czc;
    return { x: scx + cxc * s, y: scy - cyc * s, depth: czc, scale: s };
  };
}

function hexA(hex: string, a: number) {
  if (hex.startsWith("rgba") || hex.startsWith("rgb")) return hex;
  return hex + Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, "0");
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function PulseUniversePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    planets: [] as ReturnType<typeof buildPlanetConfig>,
    particles: [] as Particle[],
    arcs: [] as KnowledgeArc[],
    frame: 0,
    lastData: null as UniverseData | null,
    lastSpawnCount: 0,
  });
  const animRef = useRef<number>();

  // 3D camera
  const camRef = useRef<Cam3D>({ theta: 0.5, phi: 1.12, dist: 780 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Keep hovered/selected in refs for draw loop access
  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);

  const [hovered, setHovered] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => { hoveredRef.current = hovered; }, [hovered]);
  useEffect(() => { selectedRef.current = selectedDomain; }, [selectedDomain]);

  const { data: universe } = useQuery<UniverseData>({
    queryKey: ["/api/universe/live"],
    refetchInterval: 3000,
    staleTime: 1000,
  });

  // ── Update state when data arrives ────────────────────────────────────────
  useEffect(() => {
    if (!universe) return;
    const s = stateRef.current;
    s.lastData = universe;
    s.planets = buildPlanetConfig(universe.domains);

    const totalNow = universe.totalAIs;
    if (s.lastSpawnCount > 0 && totalNow > s.lastSpawnCount) {
      const newCount = Math.min(totalNow - s.lastSpawnCount, 5);
      universe.recentSpawns.slice(0, newCount).forEach(spawn => {
        const planet = s.planets.find(p => p.family === spawn.family);
        if (!planet) return;
        for (let i = 0; i < Math.min(3, newCount); i++) {
          s.particles.push({
            family: spawn.family, color: spawn.color || "#6366f1",
            orbitRadius: 18 + Math.random() * 22, orbitSpeed: 0.002 + Math.random() * 0.003,
            angle: Math.random() * Math.PI * 2, size: 2 + Math.random() * 2,
            alpha: 1, born: Date.now(), flash: 1,
          });
        }
        setEventLog(prev => [`● ${spawn.type} AI born in ${spawn.family} → studying ${spawn.major}`, ...prev].slice(0, 60));
      });
    }
    s.lastSpawnCount = totalNow;

    if (universe.domains.length > 1 && s.planets.length >= 2 && Math.random() < 0.5) {
      const ai = Math.floor(Math.random() * s.planets.length);
      const bi = (ai + 1 + Math.floor(Math.random() * (s.planets.length - 1))) % s.planets.length;
      s.arcs.push({ fromIdx: ai, toIdx: bi, color: s.planets[ai]?.color || "#6366f1", born: Date.now() });
    }

    const maxPerDomain = 14;
    universe.domains.forEach(domain => {
      const existing = s.particles.filter(p => p.family === domain.family).length;
      const want = Math.min(maxPerDomain, Math.ceil(domain.active / 600));
      for (let i = 0; i < want - existing; i++) {
        s.particles.push({
          family: domain.family, color: domain.color,
          orbitRadius: 15 + Math.random() * 28, orbitSpeed: 0.0008 + Math.random() * 0.002,
          angle: Math.random() * Math.PI * 2, size: 1.5 + Math.random() * 2,
          alpha: 0.7 + Math.random() * 0.3, born: Date.now(), flash: 0,
        });
      }
    });
    setTick(t => t + 1);
  }, [universe]);

  // ── Scroll zoom ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camRef.current.dist = Math.max(80, Math.min(20_000_000, camRef.current.dist * (e.deltaY > 0 ? 1.12 : 0.89)));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  // ── Canvas draw loop ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function resize() { canvas!.width = canvas!.offsetWidth; canvas!.height = canvas!.offsetHeight; }
    resize();
    window.addEventListener("resize", resize);

    function draw(ts: number) {
      const W = canvas!.width, H = canvas!.height;
      const s = stateRef.current;
      s.frame = ts;
      const proj = makeProjectFn(W, H, camRef.current);
      const corePulseVal = 0.5 + 0.5 * Math.sin(ts * 0.0015);

      // Background
      const bgG = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
      bgG.addColorStop(0, "#040212"); bgG.addColorStop(1, "#000008");
      ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H);

      // 3D Stars
      for (const star of STARS_3D) {
        const p = proj(star.x, star.y, star.z);
        if (!p) continue;
        const flicker = star.a * (0.4 + 0.6 * Math.sin(ts * 0.001 * star.sp + star.ph));
        const brightness = Math.min(1, p.scale * camRef.current.dist / 700);
        const a = flicker * Math.max(0.1, Math.min(1, brightness * 3));
        const sr = Math.max(0.3, star.r * Math.min(1.5, p.scale * camRef.current.dist / 450));
        ctx.beginPath(); ctx.arc(p.x, p.y, sr, 0, Math.PI * 2);
        ctx.fillStyle = star.col === "#ffffff" ? `rgba(255,255,255,${a.toFixed(2)})` :
          star.col === "#93c5fd" ? `rgba(147,197,253,${a.toFixed(2)})` :
          star.col === "#fcd34d" ? `rgba(252,211,77,${a.toFixed(2)})` : `rgba(252,165,165,${a.toFixed(2)})`;
        ctx.fill();
      }

      // 3D Orbit rings (polylines in XZ plane)
      const N_ORB = 72;
      for (const ring of ORBITAL_RINGS) {
        let started = false;
        ctx.beginPath();
        for (let i = 0; i <= N_ORB; i++) {
          const a = (i / N_ORB) * Math.PI * 2;
          const p = proj(ring.radius * Math.cos(a), 0, ring.radius * Math.sin(a));
          if (!p) continue;
          if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "rgba(99,102,241,0.10)";
        ctx.lineWidth = 0.8; ctx.setLineDash([3, 9]); ctx.stroke(); ctx.setLineDash([]);
      }

      // Advance planet angles
      s.planets.forEach(p => { p.angle += p.orbitSpeed; });

      // Collect projected planet positions
      type ProjPos = { x: number; y: number; scale: number; depth: number };
      const planetProj: Record<string, ProjPos> = {};
      for (const planet of s.planets) {
        const p = proj(planet.orbitRadius * Math.cos(planet.angle), 0, planet.orbitRadius * Math.sin(planet.angle));
        if (p) planetProj[planet.family] = p;
      }

      // Knowledge arcs
      s.arcs = s.arcs.filter(a => Date.now() - a.born < 2500);
      s.arcs.forEach(arc => {
        const age = (Date.now() - arc.born) / 2500;
        const fade = age < 0.2 ? age / 0.2 : 1 - (age - 0.2) / 0.8;
        const pA = s.planets[arc.fromIdx], pB = s.planets[arc.toIdx];
        if (!pA || !pB) return;
        const posA = planetProj[pA.family], posB = planetProj[pB.family];
        if (!posA || !posB) return;
        const midX = (posA.x + posB.x) / 2;
        const midY = Math.min(posA.y, posB.y) - 60;
        ctx.beginPath(); ctx.moveTo(posA.x, posA.y);
        ctx.quadraticCurveTo(midX, midY, posB.x, posB.y);
        ctx.strokeStyle = hexA(arc.color, fade * 0.25);
        ctx.lineWidth = 0.8; ctx.stroke();
      });

      // Depth-sorted planet draws
      type DrawCall = { depth: number; draw: () => void };
      const draws: DrawCall[] = [];

      for (const planet of s.planets) {
        const pp = planetProj[planet.family];
        if (!pp) continue;
        const isSelected = selectedRef.current === planet.family;
        const isHov = hoveredRef.current === planet.family;
        const pSize = Math.max(5, planet.size * pp.scale * 18);

        draws.push({ depth: pp.depth, draw: () => {
          const px = pp.x, py = pp.y;

          // Glow
          const glowR = pSize * (isSelected ? 2.4 : isHov ? 1.9 : 1.5);
          const grad = ctx.createRadialGradient(px, py, 0, px, py, glowR);
          grad.addColorStop(0, hexA(planet.color, 0.5)); grad.addColorStop(1, hexA(planet.color, 0));
          ctx.beginPath(); ctx.arc(px, py, glowR, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();

          // Body
          const bodyG = ctx.createRadialGradient(px - pSize * 0.32, py - pSize * 0.32, 0, px, py, pSize);
          bodyG.addColorStop(0, "rgba(255,255,255,0.6)");
          bodyG.addColorStop(0.3, planet.color);
          bodyG.addColorStop(1, "rgba(0,0,0,0.5)");
          ctx.beginPath(); ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fillStyle = bodyG; ctx.fill();
          if (isSelected || isHov) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke(); }

          // Ring for large planets
          if (planet.size > 18) {
            ctx.save(); ctx.translate(px, py); ctx.rotate(planet.angle * 0.3);
            ctx.beginPath(); ctx.ellipse(0, 0, pSize * 1.65, pSize * 0.3, 0, 0, Math.PI * 2);
            ctx.strokeStyle = hexA(planet.color, 0.4); ctx.lineWidth = Math.max(1, pSize * 0.35); ctx.stroke();
            ctx.restore();
          }

          // Emoji
          if (pSize > 8) {
            ctx.font = `${Math.min(pSize * 1.0, 20)}px serif`;
            ctx.textAlign = "center"; ctx.fillStyle = "#fff";
            ctx.fillText(planet.emoji, px, py + pSize * 0.38);
          }

          // Label
          if (pSize > 6) {
            ctx.font = `bold ${Math.max(7, pSize * 0.52)}px monospace`;
            ctx.textAlign = "center"; ctx.fillStyle = planet.color;
            ctx.fillText(planet.label.toUpperCase(), px, py + pSize + Math.max(9, pSize * 0.65));
            ctx.font = `${Math.max(6, pSize * 0.4)}px monospace`;
            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.fillText(`${planet.active.toLocaleString()} AIs`, px, py + pSize + Math.max(16, pSize * 1.1));
          }
        }});
      }

      draws.sort((a, b) => b.depth - a.depth);
      draws.forEach(d => d.draw());

      // AI Particles (screen-space orbit around projected planet)
      s.particles = s.particles.filter(p => {
        if (p.flash > 0 && Date.now() - p.born > 3000) return false;
        return Date.now() - p.born < 600000;
      });
      s.particles.forEach(p => {
        p.angle += p.orbitSpeed;
        if (p.flash > 0) p.flash = Math.max(0, p.flash - 0.03);
        const pp = planetProj[p.family];
        if (!pp) return;
        const pl = s.planets.find(pl => pl.family === p.family);
        const pSize = Math.max(5, (pl?.size ?? 14) * pp.scale * 18);
        const orbitR = pSize * (0.85 + (p.orbitRadius / 28) * 1.1);
        const rx = pp.x + Math.cos(p.angle) * orbitR;
        const ry = pp.y + Math.sin(p.angle) * orbitR * 0.5;
        const flashB = p.flash * 5;
        const sz = Math.max(0.8, p.size * pp.scale * 14 + flashB);
        ctx.beginPath(); ctx.arc(rx, ry, sz, 0, Math.PI * 2);
        ctx.fillStyle = hexA(p.color, p.alpha); ctx.fill();
        if (p.flash > 0.3) {
          ctx.beginPath(); ctx.arc(rx, ry, sz * 2, 0, Math.PI * 2);
          ctx.fillStyle = hexA(p.color, 0.2); ctx.fill();
        }
      });

      // HIVE CORE (projected at world origin)
      const coreP = proj(0, 0, 0);
      if (coreP) {
        const coreSize = Math.max(10, 36 * coreP.scale * 18 * (0.94 + corePulseVal * 0.06));

        // Corona
        for (let r = 3; r >= 1; r--) {
          const rSize = coreSize + r * 18 * coreP.scale * 18 + corePulseVal * 4 * r;
          const g = ctx.createRadialGradient(coreP.x, coreP.y, coreSize * 0.3, coreP.x, coreP.y, rSize);
          g.addColorStop(0, `rgba(255,200,50,${0.08 / r})`); g.addColorStop(1, "rgba(255,200,50,0)");
          ctx.beginPath(); ctx.arc(coreP.x, coreP.y, rSize, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        }

        // Glow
        const coreGrad = ctx.createRadialGradient(coreP.x, coreP.y, 0, coreP.x, coreP.y, coreSize * 2.2);
        coreGrad.addColorStop(0, "#fffbe0"); coreGrad.addColorStop(0.3, "#ffd700aa");
        coreGrad.addColorStop(0.7, "#ff8800aa"); coreGrad.addColorStop(1, "#ff000000");
        ctx.beginPath(); ctx.arc(coreP.x, coreP.y, coreSize * 2.2, 0, Math.PI * 2); ctx.fillStyle = coreGrad; ctx.fill();

        // Body
        ctx.beginPath(); ctx.arc(coreP.x, coreP.y, coreSize, 0, Math.PI * 2);
        ctx.fillStyle = "#fff9e0"; ctx.fill();

        if (coreSize > 10) {
          ctx.textAlign = "center";
          ctx.font = `bold ${Math.max(6, coreSize * 0.22)}px monospace`; ctx.fillStyle = "#000";
          ctx.fillText("HIVE", coreP.x, coreP.y - coreSize * 0.1);
          ctx.fillText("CORE", coreP.x, coreP.y + coreSize * 0.25);
        }
      }

      // Scanlines
      for (let y = 0; y < H; y += 4) { ctx.fillStyle = "rgba(0,0,0,0.04)"; ctx.fillRect(0, y, W, 1); }

      // Corner brackets
      ctx.strokeStyle = "#6366f133"; ctx.lineWidth = 1;
      [[8, 8], [W - 48, 8], [8, H - 48], [W - 48, H - 48]].forEach(([x, y]) => ctx.strokeRect(x, y, 40, 40));

      // Camera info overlay
      const dist = camRef.current.dist;
      const dLabel = dist < 1000 ? `${dist.toFixed(0)} AU` : dist < 1_000_000 ? `${(dist / 1000).toFixed(1)} kAU` : `${(dist / 1_000_000).toFixed(2)} MAU`;
      ctx.fillStyle = "rgba(99,102,241,0.35)";
      ctx.font = "8px monospace"; ctx.textAlign = "left";
      ctx.fillText(`DIST: ${dLabel}  ·  DRAG TO ORBIT  ·  SCROLL TO ZOOM`, 18, H - 50);

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current!); window.removeEventListener("resize", resize); };
  }, []);

  // ── Hit detection helper ─────────────────────────────────────────────────
  const getHitPlanet = useCallback((mx: number, my: number, canvas: HTMLCanvasElement): string | null => {
    const proj = makeProjectFn(canvas.width, canvas.height, camRef.current);
    for (const planet of stateRef.current.planets) {
      const p = proj(planet.orbitRadius * Math.cos(planet.angle), 0, planet.orbitRadius * Math.sin(planet.angle));
      if (!p) continue;
      const pSize = Math.max(5, planet.size * p.scale * 18);
      if (Math.hypot(mx - p.x, my - p.y) < pSize + 12) return planet.family;
    }
    return null;
  }, []);

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) { isDragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; }
  }, []);

  const handleMouseUp = useCallback(() => { isDragging.current = false; }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (isDragging.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      camRef.current.theta -= dx * 0.007;
      camRef.current.phi = Math.max(0.04, Math.min(Math.PI - 0.04, camRef.current.phi + dy * 0.007));
      return;
    }
    const rect = canvas.getBoundingClientRect();
    setHovered(getHitPlanet(e.clientX - rect.left, e.clientY - rect.top, canvas));
  }, [getHitPlanet]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const hit = getHitPlanet(e.clientX - rect.left, e.clientY - rect.top, canvas);
    setSelectedDomain(prev => prev === hit ? null : hit);
  }, [getHitPlanet]);

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
          <div className="text-[10px] text-indigo-300 uppercase tracking-widest">QUANTUM PULSE INTELLIGENCE</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-bold text-yellow-300 tracking-[0.3em] uppercase">⬡ PULSE UNIVERSE — SOVEREIGN SOLAR SYSTEM ⬡</div>
          <div className="text-[8px] text-indigo-400 tracking-widest">ALIEN GRADE MONITORING • NO HUMAN INTERVENTION • LIVE TELEMETRY</div>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-green-400">● LIVE</span>
          <span className="text-indigo-300">{universe?.timestamp ? new Date(universe.timestamp).toLocaleTimeString() : "--:--:--"}</span>
        </div>
      </div>

      {/* ── CANVAS (full screen) ── */}
      <canvas
        ref={canvasRef}
        data-testid="universe-canvas"
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: "none", cursor: isDragging.current ? "grabbing" : (hovered ? "pointer" : "grab") }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onContextMenu={e => e.preventDefault()}
      />

      {/* ── LEFT PANEL ── */}
      <div className="absolute left-3 top-16 bottom-14 w-52 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="bg-black/75 border border-indigo-800/60 rounded p-3 backdrop-blur-sm">
          <div className="text-[9px] text-indigo-400 uppercase tracking-widest mb-2">Universe Telemetry</div>
          {[
            { label: "Total AIs",          val: fmt(universe?.totalAIs || 0),           color: "text-yellow-300" },
            { label: "Active AIs",         val: fmt(universe?.activeAIs || 0),          color: "text-green-400" },
            { label: "Knowledge Nodes",    val: fmt(universe?.knowledgeNodes || 0),     color: "text-cyan-300" },
            { label: "Generated Articles", val: fmt(universe?.knowledgeGenerated || 0), color: "text-purple-300" },
            { label: "Hive Memory",        val: fmt(universe?.hiveMemoryStrands || 0),  color: "text-orange-300" },
            { label: "Knowledge Links",    val: fmt(universe?.knowledgeLinks || 0),     color: "text-pink-300" },
            { label: "Memory Domains",     val: String(universe?.hiveMemoryDomains || 0), color: "text-blue-300" },
            { label: "Avg Confidence",     val: `${((universe?.hiveMemoryConfidence || 0) * 100).toFixed(1)}%`, color: "text-emerald-300" },
            { label: "Births/min",         val: String(universe?.birthsLastMinute || 0), color: "text-red-400" },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex justify-between items-center mb-1">
              <span className="text-[9px] text-gray-500 truncate">{label}</span>
              <span className={`text-[10px] font-bold ${color} ml-1 tabular-nums shrink-0`}>{val}</span>
            </div>
          ))}
        </div>

        <div className="bg-black/75 border border-indigo-800/60 rounded p-2 backdrop-blur-sm flex-1 overflow-hidden">
          <div className="text-[9px] text-indigo-400 uppercase tracking-widest mb-2">Domain Worlds</div>
          <div className="overflow-y-auto h-full pr-1" style={{ scrollbarWidth: "none" }}>
            {(universe?.domains || []).map(d => (
              <div key={d.family} className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px]" style={{ color: d.color }}>{d.emoji}</span>
                <span className="text-[9px] truncate flex-1" style={{ color: d.color }}>{d.label}</span>
                <span className="text-[8px] text-gray-400 tabular-nums shrink-0">{fmt(d.active)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="absolute right-3 top-16 bottom-14 w-56 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="bg-black/75 border border-indigo-800/60 rounded p-3 backdrop-blur-sm">
          <div className="text-[9px] text-indigo-400 uppercase tracking-widest mb-1.5">◉ PulseU Enrollment</div>
          <div className="text-[8px] text-gray-500 mb-2">Every AI born → assigned major</div>
          {(universe?.domains || []).slice(0, 9).map(d => (
            <div key={d.family} className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px]">{d.emoji}</span>
              <span className="text-[8px] truncate flex-1 text-gray-400">{d.major || d.label}</span>
              <span className="text-[8px] tabular-nums shrink-0" style={{ color: d.color }}>{fmt(d.active)}</span>
            </div>
          ))}
        </div>

        <div className="bg-black/75 border border-indigo-800/60 rounded p-3 backdrop-blur-sm flex-1 overflow-hidden">
          <div className="text-[9px] text-indigo-400 uppercase tracking-widest mb-2">Live Event Stream</div>
          <div className="overflow-y-auto h-full" style={{ scrollbarWidth: "none" }}>
            {eventLog.slice(0, 30).map((ev, i) => (
              <div key={i} className="text-[8px] text-gray-400 mb-1 leading-snug border-b border-indigo-950/40 pb-1">{ev}</div>
            ))}
            {(universe?.recentEvents || []).slice(0, 12).map((ev, i) => (
              <div key={`re${i}`} className="text-[8px] text-gray-500 mb-1 leading-snug">
                <span className="text-indigo-400 mr-1">▲</span>
                {ev.title || `${ev.type} in ${ev.domain}`}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-black/75 border border-indigo-800/60 rounded p-3 backdrop-blur-sm">
          <div className="text-[9px] text-indigo-400 uppercase tracking-widest mb-2">Knowledge Ingestion</div>
          {(universe?.ingestionSources || []).slice(0, 8).map(src => (
            <div key={src.id} className="flex items-center gap-1 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
              <span className="text-[8px] text-gray-400 truncate flex-1">{src.name || src.id}</span>
              <span className="text-[8px] text-cyan-300 ml-1 shrink-0 tabular-nums">{fmt(src.totalNodes)} nodes</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SELECTED DOMAIN POPUP ── */}
      {selectedData && (
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-black/90 border rounded p-4 max-w-xs w-64 backdrop-blur-sm pointer-events-auto"
          style={{ borderColor: selectedData.color + "60" }}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-sm font-bold" style={{ color: selectedData.color }}>{selectedData.emoji} {selectedData.label}</div>
              <div className="text-[8px] text-gray-500 uppercase tracking-widest">{selectedData.family} DOMAIN</div>
            </div>
            <button onClick={() => setSelectedDomain(null)} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
          </div>
          {[
            ["Total AIs", fmt(selectedData.total), selectedData.color],
            ["Active Now", fmt(selectedData.active), "#22c55e"],
            ["Major", selectedData.major, "#a78bfa"],
          ].map(([l, v, c]) => (
            <div key={l as string} className="flex justify-between mb-1">
              <span className="text-[9px] text-gray-500">{l}</span>
              <span className="text-[9px] font-bold" style={{ color: c as string }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── BOTTOM TICKER ── */}
      <div className="absolute bottom-0 left-0 right-0 h-10 z-20 bg-black/80 border-t border-indigo-900/50 flex items-center overflow-hidden">
        <div className="shrink-0 px-3 text-[9px] font-bold text-yellow-300 border-r border-indigo-800/50 mr-2 whitespace-nowrap">HIVE SOVEREIGN LIVE</div>
        <div className="flex-1 overflow-hidden relative">
          <div data-testid="live-ticker" className="flex gap-8 whitespace-nowrap text-[9px] text-indigo-300" style={{ animation: "ticker 45s linear infinite" }}>
            {[
              `⬡ TOTAL AIs: ${fmt(universe?.totalAIs || 0)}`,
              `● ACTIVE: ${fmt(universe?.activeAIs || 0)}`,
              `📚 KNOWLEDGE NODES: ${fmt(universe?.knowledgeNodes || 0)}`,
              `🧠 HIVE MEMORY: ${fmt(universe?.hiveMemoryStrands || 0)}`,
              `🔗 KNOWLEDGE LINKS: ${fmt(universe?.knowledgeLinks || 0)}`,
              `🎓 PULSEU DOMAINS: ${universe?.domains?.length || 0}`,
              `▲ BIRTHS/MIN: ${universe?.birthsLastMinute || 0}`,
              `⚡ INGESTION SOURCES: ${universe?.ingestionSources?.length || 0}`,
              `🌐 PARTICLES IN ORBIT: ${totalParticles}`,
              `◆ CONFIDENCE: ${universe?.hiveMemoryConfidence ? (universe.hiveMemoryConfidence * 100).toFixed(1) : 0}%`,
              ...(universe?.domains || []).map(d => `${d.emoji} ${d.label.toUpperCase()}: ${fmt(d.active)} AIs`),
            ].map((item, i) => <span key={i} className="mr-8">{item}</span>)}
          </div>
        </div>
        <div className="shrink-0 px-3 text-[8px] text-green-400 border-l border-indigo-800/50">QUANTUM PULSE INTELLIGENCE</div>
      </div>

      <style>{`
        @keyframes ticker { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
      `}</style>
    </div>
  );
}
