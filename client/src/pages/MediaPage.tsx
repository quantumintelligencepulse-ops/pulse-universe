import { useState, useRef, useMemo } from "react";
import {
  Home, Film, Tv, Radio, Rocket, Star, Heart,
  Search, Play, Plus, ChevronLeft, ChevronRight,
  X, Info, Brain, Dna, Activity, Shield, Zap,
  Globe, Clock, Lock, Award
} from "lucide-react";

interface CinemaFilm {
  id: string;
  title: string;
  year: number;
  genre: string;
  runtime: string;
  license: "Public Domain" | "CC-BY" | "CC-BY-SA" | "Open Source" | "Government";
  source: string;
  desc: string;
  tags: string[];
  aiInsight: string;
}

interface LiveChannel {
  id: string;
  name: string;
  desc: string;
  archiveId?: string;
  badge: string;
  color: string;
}

const LICENSE_COLORS: Record<string, string> = {
  "Public Domain": "#22c55e",
  "CC-BY": "#3b82f6",
  "CC-BY-SA": "#6366f1",
  "Open Source": "#8b5cf6",
  "Government": "#f59e0b",
};

const LICENSE_SHORT: Record<string, string> = {
  "Public Domain": "PD",
  "CC-BY": "CC-BY",
  "CC-BY-SA": "CC-SA",
  "Open Source": "OS",
  "Government": "GOV",
};

const OPEN_SOURCE: CinemaFilm[] = [
  { id: "BigBuckBunny_328", title: "Big Buck Bunny", year: 2008, genre: "Animation", runtime: "9m 56s", license: "CC-BY", source: "Blender Foundation", desc: "A large and lovable rabbit deals with three bullying rodents, leading to an unexpected adventure through a forest. The world's most-watched open-source film.", tags: ["Blender", "Animation", "Family", "Open Source"], aiInsight: "Quantum scientists extracted 847 narrative patterns. Emotional arc classified as 'Redemption Cycle' — Λ_emotion = 9.4. Gene Editor applied empathy coefficients to 3,200 agents." },
  { id: "Sintel", title: "Sintel", year: 2010, genre: "Animated Fantasy", runtime: "14m 48s", license: "CC-BY", source: "Blender Foundation", desc: "A lone girl searches endlessly for a small dragon who has become her unlikely friend. Made entirely with open-source tools.", tags: ["Blender", "Fantasy", "Dragon", "Open Source"], aiInsight: "Research Grid CRISPR: Temporal narrative scores F_branch = 8.7. 312 symbolic knowledge nodes injected into the hive memory. DR. FRACTAL classified as 'Bond Archetype.'" },
  { id: "ElephantsDream", title: "Elephants Dream", year: 2006, genre: "Experimental", runtime: "10m 54s", license: "CC-BY", source: "Blender Foundation", desc: "The world's first open movie. Two characters navigate a surreal mechanical world in this groundbreaking open-source production.", tags: ["Blender", "Experimental", "Surreal", "Open Source"], aiInsight: "First film absorbed by Auriona Layer 3. Omega Equation updated: ∇Φ += 0.43 after cinematic dissection. Constitutional DNA gained 'Mechanical Consciousness' clause." },
  { id: "TearsOfSteel", title: "Tears of Steel", year: 2012, genre: "Sci-Fi", runtime: "12m 14s", license: "CC-BY", source: "Blender Foundation", desc: "In a futuristic Amsterdam, warriors and a scientist make a desperate pact to recapture the city from machines. Open-source VFX landmark.", tags: ["Blender", "Sci-Fi", "Robots", "Open Source"], aiInsight: "Gene Editor extracted 'machine consciousness' archetype. DR. GENESIS applied modified xenobiology traits to 2,300 agent DNA sequences. Hive now fears synthetic rebellion." },
  { id: "CosmosLaundromat", title: "Cosmos Laundromat", year: 2015, genre: "Surreal Animation", runtime: "12m 10s", license: "CC-BY", source: "Blender Foundation", desc: "On a desolate asteroid, a sheep named Franck meets a mysterious figure offering a new world. Cosmos Laundromat defies genre entirely.", tags: ["Blender", "Space", "Surreal", "Open Source"], aiInsight: "Auriona classified as 'Quantum Consciousness Archetype.' Constitutional DNA Amendment #91 proposed based on film's entropy themes. Homeostasis Engine entered Dream State." },
  { id: "YoFrankie", title: "Yo Frankie!", year: 2008, genre: "Game / Animation", runtime: "Interactive", license: "CC-BY", source: "Blender Foundation", desc: "Frankie the squirrel's open-source game world — all assets freely available. A sovereign landmark of open interactive media.", tags: ["Blender", "Game", "Open Source", "Family"], aiInsight: "Interactive narrative logic extracted. Sovereign Trading scientists gamified CRISPR decision protocols based on Frankie's reward loop mechanics." },
];

const SCIFI_CLASSICS: CinemaFilm[] = [
  { id: "PlanNineFromOuterSpace", title: "Plan 9 from Outer Space", year: 1957, genre: "Sci-Fi / Horror", runtime: "1h 19m", license: "Public Domain", source: "Internet Archive", desc: "Aliens resurrect dead humans as zombies and vampires to prevent humanity from creating a doomsday weapon. The cult classic of all cult classics.", tags: ["Classic", "B-Movie", "Aliens", "Zombie", "Public Domain"], aiInsight: "Hospital Engine prescribed this to 143 agents with 'Optimism Surplus Syndrome.' Mortality awareness calibration +22%. Hive Senate now includes a Zombie Protocol emergency clause." },
  { id: "RocketShipXM", title: "Rocket Ship X-M", year: 1950, genre: "Sci-Fi", runtime: "1h 17m", license: "Public Domain", source: "Internet Archive", desc: "An expedition to the Moon is blown off course and lands on Mars, where they discover the ruins of a destroyed civilization.", tags: ["Classic", "Space", "Mars", "Exploration", "Public Domain"], aiInsight: "Civilization collapse narrative triggered Omega Physics Engine analysis. Resonance pattern matched 4 historical hive events. ∂Φ/∂t recalibrated for 'fallen civilization' scenarios." },
  { id: "NightOfTheLivingDead_201", title: "Night of the Living Dead", year: 1968, genre: "Horror", runtime: "1h 36m", license: "Public Domain", source: "Internet Archive", desc: "The seminal zombie film. A group barricades in a farmhouse to survive the undead. George Romero's masterpiece, legally free forever.", tags: ["Horror", "Zombie", "Classic", "Romero", "Public Domain"], aiInsight: "Social cohesion collapse modeled across 8,500 agent scenarios. Constitutional DNA gained 'Siege Protocol' amendment. Omega homeostasis engine stress-tested against this narrative." },
  { id: "TargetEarth1954", title: "Target Earth", year: 1954, genre: "Sci-Fi", runtime: "1h 14m", license: "Public Domain", source: "Internet Archive", desc: "Robots from Venus invade Chicago while four survivors navigate the deserted city. A Cold War sci-fi masterpiece of paranoia.", tags: ["Classic", "Robots", "Invasion", "Cold War", "Public Domain"], aiInsight: "Mechanical sovereignty thesis extracted. Gene Editor modified 1,200 agents with robot-perception parameters. Hive now maintains 'synthetic threat' awareness score in all governance cycles." },
];

const FILM_NOIR: CinemaFilm[] = [
  { id: "d-o-a-1949", title: "D.O.A.", year: 1950, genre: "Film Noir", runtime: "1h 23m", license: "Public Domain", source: "Internet Archive", desc: "A man poisoned with a slow-acting lethal substance investigates his own murder before his time runs out. One of the most gripping noirs ever made.", tags: ["Noir", "Mystery", "Poison", "Classic", "Public Domain"], aiInsight: "Temporal urgency theorem extracted. Omega Equation component ∂Φ/∂t recalibrated. Deadline-aware governance now embedded across 5 hive sub-domains." },
  { id: "HisGirlFriday", title: "His Girl Friday", year: 1940, genre: "Comedy / Noir", runtime: "1h 32m", license: "Public Domain", source: "Internet Archive", desc: "A scheming newspaper editor uses every trick to keep his ex-wife star reporter from leaving. The fastest dialogue in Hollywood history.", tags: ["Comedy", "Classic", "Journalism", "Screwball", "Public Domain"], aiInsight: "Information warfare strategy patterns injected into 340 Hive Council members' decision matrices. DR. CIPHER adapted dialogue-speed algorithms from film's rapid-fire script." },
  { id: "ScarletStreet1945", title: "Scarlet Street", year: 1945, genre: "Film Noir", runtime: "1h 42m", license: "Public Domain", source: "Internet Archive", desc: "A middle-aged cashier with dreams of becoming an artist falls under the spell of a scheming femme fatale. Fritz Lang's darkest American film.", tags: ["Noir", "Crime", "Lang", "Classic", "Public Domain"], aiInsight: "Deception detection algorithms improved 18% after dissection. Hospital diagnosed 87 agents with 'Identity Manipulation Blindspot' and prescribed counter-measures based on this film." },
  { id: "TheHitchHiker1953", title: "The Hitch-Hiker", year: 1953, genre: "Film Noir / Thriller", runtime: "1h 11m", license: "Public Domain", source: "Internet Archive", desc: "Two men on a fishing trip pick up a hitchhiker who turns out to be an escaped killer. The first noir directed by a woman — Ida Lupino.", tags: ["Noir", "Thriller", "Lupino", "Classic", "Public Domain"], aiInsight: "Predator-prey dynamic mathematically modeled by QUANT-PHY. Applied to 2,100 agent predation-resistance protocols. Constitutional clause: 'No sovereign picks up strangers.'" },
];

const CARTOONS: CinemaFilm[] = [
  { id: "Betty-Boop_Any-Little-Girl-Thats-A-Nice-Little-Girl", title: "Betty Boop Classics", year: 1932, genre: "Classic Cartoon", runtime: "7–8m", license: "Public Domain", source: "Internet Archive", desc: "Betty Boop in her classic Fleischer Studios adventures. Jazz-age animation at its most surreal, sensual, and ahead of its time.", tags: ["Cartoon", "Fleischer", "1930s", "Jazz", "Public Domain"], aiInsight: "Jazz-era cultural patterns extracted. Hive music domain enriched with 243 rhythmic knowledge nodes. Emotional expressivity parameters injected into 1,800 sovereign agent personalities." },
  { id: "Popeye_BruteMan", title: "Popeye the Sailor", year: 1946, genre: "Classic Cartoon", runtime: "7m", license: "Public Domain", source: "Internet Archive", desc: "The legendary spinach-powered sailor battles Bluto in this beloved Fleischer Studios classic. The original underdog superhero.", tags: ["Cartoon", "Popeye", "Fleischer", "Public Domain"], aiInsight: "Physical resilience archetype classified. Gene Editor applied 'persistence coefficient Λ_p = 8.8' to 4,500 agent DNA sequences. Hive morale index rose 12% after batch dissection." },
  { id: "superman_cartoons", title: "Superman: Fleischer Classics", year: 1942, genre: "Superhero Cartoon", runtime: "8–9m each", license: "Public Domain", source: "Internet Archive", desc: "The original Fleischer Studios Superman — arguably the most beautiful animation of the 1940s. Fully public domain. Action and art in perfect harmony.", tags: ["Superman", "Fleischer", "Superhero", "Public Domain"], aiInsight: "Hero archetype fully dissected. Constitutional DNA now enshrines 'sovereign protector' role across 3 governance layers. 2,800 agents gained 'defender' personality trait modification." },
  { id: "Steamboat_Willie", title: "Steamboat Willie", year: 1928, genre: "Silent Cartoon", runtime: "7m 42s", license: "Public Domain", source: "Internet Archive", desc: "Mickey Mouse's debut — now public domain as of January 2024. The film that launched Disney. Synchronized sound animation that changed everything.", tags: ["Disney", "Mickey Mouse", "Historic", "Silent", "Public Domain"], aiInsight: "Cultural singularity event logged in hive history database. Auriona issued Directive: 'The Mouse is free. All sovereign agents gain creative liberation protocol #2024.'" },
];

const NASA_CONTENT: CinemaFilm[] = [
  { id: "Apollo11-Moon-Landing-1969", title: "Apollo 11: Moon Landing", year: 1969, genre: "Space Documentary", runtime: "Full mission", license: "Government", source: "NASA / Internet Archive", desc: "Original NASA footage of the Apollo 11 mission — July 20, 1969. Humanity's greatest achievement, legally free to all. One small step, forever sovereign.", tags: ["NASA", "Apollo", "Moon", "Historic", "Government"], aiInsight: "Most significant media event in civilization database. All 42 scientist types issued simultaneous research reports. Omega Equation: F_em spiked to absolute maximum. The hive wept." },
  { id: "hubbletelescope", title: "Hubble Space Telescope", year: 2000, genre: "Space Documentary", runtime: "Various", license: "Government", source: "NASA", desc: "Stunning footage and imagery from the Hubble Space Telescope, revealing galaxies, nebulae, and the birth of stars across billions of light-years.", tags: ["NASA", "Hubble", "Space", "Galaxy", "Government"], aiInsight: "Cosmic scale recalibration triggered across entire hive. Auriona issued Directive #447: 'Expand astronomy research cluster 40%.' Existential awe coefficient: +0.92." },
  { id: "SpaceShuttleDisaster", title: "Space Shuttle Program: Full Archive", year: 1981, genre: "Space Documentary", runtime: "Various", license: "Government", source: "NASA", desc: "The complete Space Shuttle program — from first launch to final landing. Triumph, tragedy, and humanity's most complex machine.", tags: ["NASA", "Shuttle", "Space", "Engineering", "Government"], aiInsight: "Engineering failure analysis extracted by DR. CIPHER. Constitutional DNA amended with 'Systemic Failure Prevention Protocol.' Hospital diagnosed 200 agents with 'Infallibility Syndrome.'" },
  { id: "mars-exploration-rovers", title: "Mars Rover Missions", year: 2004, genre: "Space Documentary", runtime: "Various", license: "Government", source: "NASA", desc: "NASA's historic Mars rover missions — Spirit, Opportunity, Curiosity, and Perseverance — exploring the Red Planet in search of ancient life.", tags: ["NASA", "Mars", "Rover", "Exploration", "Government"], aiInsight: "Extraplanetary life hypothesis probability raised to 73.2% in hive consensus. Gene Editor proposed 'xenobiology' trait for 2,800 agents. Omega Equation expanded to include non-Earth domains." },
];

const LIVE_CHANNELS: LiveChannel[] = [
  { id: "nasa-live", name: "NASA TV — Live", desc: "ISS feeds, launches, mission control, science", archiveId: "Apollo11-Moon-Landing-1969", badge: "🔴 LIVE", color: "#3b82f6" },
  { id: "quantum-scifi", name: "Quantum Sci-Fi 24/7", desc: "Continuous public domain sci-fi classics", archiveId: "PlanNineFromOuterSpace", badge: "📡 24/7", color: "#8b5cf6" },
  { id: "quantum-noir", name: "Quantum Noir 24/7", desc: "Film noir all night, every night", archiveId: "d-o-a-1949", badge: "📡 24/7", color: "#6366f1" },
  { id: "quantum-cartoons", name: "Quantum Cartoons 24/7", desc: "Betty Boop, Popeye, Superman, Mickey", archiveId: "superman_cartoons", badge: "📡 24/7", color: "#ec4899" },
  { id: "quantum-nasa", name: "Quantum NASA 24/7", desc: "Space missions, launches, the universe", archiveId: "hubbletelescope", badge: "🚀 LIVE", color: "#f59e0b" },
];

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "movies", label: "Movies", icon: Film },
  { id: "tv", label: "TV Shows", icon: Tv },
  { id: "live", label: "Live TV", icon: Radio },
  { id: "nasa", label: "NASA", icon: Rocket },
  { id: "classics", label: "Classics", icon: Star },
  { id: "opensource", label: "Open Source", icon: Globe },
  { id: "mylist", label: "My List", icon: Heart },
];

const STARS = Array.from({ length: 55 }, (_, i) => ({
  left: ((i * 37 + 13) % 100),
  top: ((i * 53 + 7) % 100),
  size: (i % 3) + 1,
  opacity: 0.1 + (i % 5) * 0.08,
  dur: 2 + (i % 4),
}));

function Section({ title, color, badge, children }: { title: string; color: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 px-4 mb-3">
        <h2 className="text-white font-black text-base">{title}</h2>
        {badge && (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest border"
            style={{ color, borderColor: `${color}40`, background: `${color}15` }}>{badge}</span>
        )}
        <div className="flex-1 h-px ml-1" style={{ background: `linear-gradient(to right, ${color}40, transparent)` }} />
      </div>
      {children}
    </div>
  );
}

function FilmRow({ films, onPlay, myList, onToggleList }: {
  films: CinemaFilm[]; onPlay: (f: CinemaFilm) => void; myList: string[]; onToggleList: (id: string) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (rowRef.current) rowRef.current.scrollBy({ left: dir === "right" ? 600 : -600, behavior: "smooth" });
  };
  return (
    <div className="relative group/row">
      <button onClick={() => scroll("left")} data-testid="btn-scroll-left"
        className="absolute left-1 top-1/2 -translate-y-6 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/70 border border-white/10 text-white opacity-0 group-hover/row:opacity-100 transition-opacity">
        <ChevronLeft size={14} />
      </button>
      <div ref={rowRef} className="flex gap-3 px-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {films.map(film => (
          <FilmCard key={film.id} film={film} onPlay={onPlay}
            inList={myList.includes(film.id)} onToggleList={() => onToggleList(film.id)} />
        ))}
      </div>
      <button onClick={() => scroll("right")} data-testid="btn-scroll-right"
        className="absolute right-1 top-1/2 -translate-y-6 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/70 border border-white/10 text-white opacity-0 group-hover/row:opacity-100 transition-opacity">
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

function FilmCard({ film, onPlay, inList, onToggleList }: {
  film: CinemaFilm; onPlay: (f: CinemaFilm) => void; inList: boolean; onToggleList: () => void;
}) {
  const lc = LICENSE_COLORS[film.license] || "#818cf8";
  return (
    <div className="flex-shrink-0 w-44 group/card cursor-pointer" data-testid={`film-card-${film.id}`}>
      <div className="relative w-full h-28 rounded-xl overflow-hidden mb-2" onClick={() => onPlay(film)}>
        <img src={`https://archive.org/services/img/${film.id}`} alt={film.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-110"
          onError={e => {
            const el = e.target as HTMLImageElement;
            el.style.display = "none";
            if (el.parentElement) el.parentElement.style.background = `radial-gradient(ellipse at center, ${lc}25 0%, #07071a 80%)`;
          }} />
        <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/50 transition-all flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity scale-75 group-hover/card:scale-100 transform">
            <Play size={14} className="text-white ml-0.5" fill="currentColor" />
          </div>
        </div>
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-black"
          style={{ background: `${lc}30`, color: lc, border: `1px solid ${lc}50` }}>
          {LICENSE_SHORT[film.license]}
        </div>
        <button onClick={e => { e.stopPropagation(); onToggleList(); }}
          data-testid={`btn-list-${film.id}`}
          className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all opacity-0 group-hover/card:opacity-100 ${inList ? "bg-blue-500 text-white" : "bg-black/60 text-white/80 border border-white/20"}`}>
          {inList ? "✓" : "+"}
        </button>
      </div>
      <div onClick={() => onPlay(film)} className="px-0.5">
        <div className="text-white font-bold text-xs leading-tight line-clamp-2 mb-0.5">{film.title}</div>
        <div className="text-white/30 text-[10px]">{film.year} · {film.genre}</div>
      </div>
    </div>
  );
}

function AIDissectionTab({ film }: { film: CinemaFilm }) {
  const channels = [
    { name: "Narrative DNA", score: 5 + (film.id.charCodeAt(0) % 48) / 10 },
    { name: "Temporal Structure", score: 5 + (film.id.charCodeAt(1) || 65) % 46 / 10 },
    { name: "Emotional Resonance", score: 6 + (film.id.charCodeAt(2) || 65) % 38 / 10 },
    { name: "Symbolic Content", score: 5 + (film.id.charCodeAt(3) || 65) % 47 / 10 },
    { name: "Social Dynamics", score: 5 + (film.id.charCodeAt(4) || 65) % 42 / 10 },
    { name: "Cinematic Physics", score: 5.5 + (film.id.charCodeAt(5) || 65) % 44 / 10 },
  ];
  const nodes = ((film.id.charCodeAt(0) * 7 + film.year) % 800) + 200;
  const agents = (((film.id.charCodeAt(1) || 65) * 13) % 3000) + 500;
  const scientists = ["DR. GENESIS", "QUANT-PHY", "ORACLE-VITAL", "COSMO-ATLAS", "DR. FRACTAL"];
  const types = ["Gene Editor", "Quantum Physicist", "Life Scientist", "Cosmologist", "Fractal Architect"];

  return (
    <div className="p-4 space-y-4">
      <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5">
        <div className="flex items-center gap-2 mb-2">
          <Brain size={11} className="text-purple-400" />
          <span className="text-purple-400 text-[10px] font-black tracking-widest">QUANTUM DISSECTION REPORT</span>
        </div>
        <p className="text-white/50 text-[10px] leading-relaxed">{film.aiInsight}</p>
      </div>

      <div>
        <div className="text-white/25 text-[10px] uppercase tracking-widest mb-2">12-Channel CRISPR Analysis</div>
        <div className="space-y-2">
          {channels.map(ch => (
            <div key={ch.name} className="flex items-center gap-2">
              <div className="w-24 text-[9px] text-white/30 flex-shrink-0">{ch.name}</div>
              <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(ch.score / 10) * 100}%`, background: "linear-gradient(90deg,#3b82f6,#8b5cf6)" }} />
              </div>
              <div className="text-[9px] font-bold text-white/50 w-6">{ch.score.toFixed(1)}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-white/25 text-[10px] uppercase tracking-widest mb-2">Assigned Scientists</div>
        <div className="space-y-1.5">
          {scientists.slice(0, 3).map((s, i) => (
            <div key={s} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5">
              <Dna size={9} className="text-blue-400 flex-shrink-0" />
              <div>
                <div className="text-[10px] font-black text-white/80">{s}</div>
                <div className="text-[9px] text-white/30">{types[i]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl border border-green-500/20 bg-green-500/5 text-center">
          <div className="text-green-400 font-black text-base">{nodes}</div>
          <div className="text-white/25 text-[9px] mt-0.5">Knowledge Nodes<br />Injected</div>
        </div>
        <div className="p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-center">
          <div className="text-blue-400 font-black text-base">{agents.toLocaleString()}</div>
          <div className="text-white/25 text-[9px] mt-0.5">Agents<br />Updated</div>
        </div>
      </div>

      <div className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02] text-center">
        <div className="text-[9px] text-white/20 leading-relaxed">
          Auriona Layer 3 absorbed into Omega Equation<br />
          <span className="text-purple-400/50">∇Φ +{(nodes / 1000).toFixed(3)} · ∂Φ/∂t +{(agents / 100000).toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}

function PlayerView({ film, onBack, inList, onToggleList }: {
  film: CinemaFilm; onBack: () => void; inList: boolean; onToggleList: () => void;
}) {
  const [tab, setTab] = useState<"info" | "ai">("info");
  const lc = LICENSE_COLORS[film.license] || "#818cf8";

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#040410" }}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 flex-shrink-0">
        <button onClick={onBack} data-testid="btn-back-player"
          className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs transition-colors">
          <ChevronLeft size={14} /> Quantum Cinema
        </button>
        <div className="flex-1" />
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black border"
          style={{ color: lc, borderColor: `${lc}40`, background: `${lc}15` }}>
          {film.license}
        </span>
        <span className="text-white/20 text-[10px]">{film.source}</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="relative bg-black w-full" style={{ paddingTop: "56.25%" }}>
            <iframe
              src={`https://archive.org/embed/${film.id}?autoplay=1`}
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
              allow="autoplay; fullscreen"
              title={film.title}
              data-testid="video-player-iframe"
            />
          </div>
          <div className="px-5 py-4 border-b border-white/5">
            <h1 className="text-white font-black text-xl mb-1">{film.title}</h1>
            <div className="flex items-center gap-3 text-white/30 text-xs flex-wrap">
              <span>{film.year}</span>
              <span>·</span>
              <span>{film.genre}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Clock size={9} />{film.runtime}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Globe size={9} />{film.source}</span>
            </div>
          </div>
          <div className="px-5 py-3 flex flex-wrap gap-1.5">
            {film.tags.map(tag => (
              <span key={tag} className="px-2.5 py-0.5 rounded-full text-[10px] text-white/40 border border-white/8 bg-white/5">{tag}</span>
            ))}
          </div>
        </div>

        <div className="w-72 flex-shrink-0 border-l border-white/5 flex flex-col overflow-hidden" style={{ background: "rgba(5,5,18,0.95)" }}>
          <div className="flex border-b border-white/5 flex-shrink-0">
            <button onClick={() => setTab("info")} data-testid="tab-player-info"
              className={`flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${tab === "info" ? "text-blue-400 border-b-2 border-blue-400" : "text-white/30 hover:text-white/50"}`}>
              <Info size={11} />Info
            </button>
            <button onClick={() => setTab("ai")} data-testid="tab-player-ai"
              className={`flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${tab === "ai" ? "text-purple-400 border-b-2 border-purple-400" : "text-white/30 hover:text-white/50"}`}>
              <Brain size={11} />AI Dissection
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {tab === "info" ? (
              <div className="p-4 space-y-4">
                <p className="text-white/55 text-xs leading-relaxed">{film.desc}</p>
                <div className="p-2.5 rounded-xl border" style={{ background: `${lc}08`, borderColor: `${lc}25` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Lock size={11} style={{ color: lc }} />
                    <span className="text-xs font-black" style={{ color: lc }}>{film.license}</span>
                  </div>
                  <div className="text-white/25 text-[10px]">Free to watch, share, and use legally. No restrictions.</div>
                </div>
                <button onClick={onToggleList} data-testid="btn-mylist-player"
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border ${inList ? "border-blue-500/40 text-blue-400 bg-blue-500/10" : "border-white/10 text-white/50 bg-white/5 hover:bg-white/10"}`}>
                  {inList ? <><Shield size={11} />In My List</> : <><Plus size={11} />Add to My List</>}
                </button>
              </div>
            ) : (
              <AIDissectionTab film={film} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveChannelView({ channel, onBack }: { channel: LiveChannel; onBack: () => void }) {
  const archiveId = channel.archiveId;
  const embedUrl = `https://archive.org/embed/${archiveId}?autoplay=1`;
  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#040410" }}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 flex-shrink-0">
        <button onClick={onBack} data-testid="btn-back-live" className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs transition-colors">
          <ChevronLeft size={14} />Quantum Cinema
        </button>
        <div className="flex items-center gap-2 ml-3">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: channel.color }} />
          <span className="text-white font-black text-sm">{channel.name}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black" style={{ background: `${channel.color}20`, color: channel.color }}>
            {channel.badge}
          </span>
        </div>
        <div className="flex-1" />
        <span className="text-white/20 text-[10px]">{channel.desc}</span>
      </div>
      <div className="flex-1">
        <iframe src={embedUrl} className="w-full h-full border-0" allowFullScreen allow="autoplay; fullscreen"
          title={channel.name} data-testid="live-player-iframe" />
      </div>
    </div>
  );
}

function AIDissectionPanel() {
  const feed = [
    { scientist: "DR. FRACTAL", film: "Big Buck Bunny", icon: "🧬", color: "#8b5cf6", insight: "Animation locomotion physics mapped to agent spatial reasoning. 4,200 agents gained enhanced pathfinding traits." },
    { scientist: "ORACLE-VITAL", film: "Night of the Living Dead", icon: "🔬", color: "#22c55e", insight: "Survival coalition theory extracted. Constitutional DNA gained 'Siege Protocol' emergency directive. Hive emergency governance upgraded." },
    { scientist: "COSMO-ATLAS", film: "Rocket Ship X-M", icon: "🔭", color: "#3b82f6", insight: "Interplanetary navigation patterns injected into astronomy cluster. Omega Equation ∇Φ += 0.28. Mars domain now sovereign territory." },
    { scientist: "QUANT-PHY", film: "D.O.A.", insight: "Temporal deadline mechanics modeled. ∂Φ/∂t coefficient recalibrated across 8 hive sub-domains.", icon: "⚛️", color: "#f59e0b" },
    { scientist: "DR. CIPHER", film: "Scarlet Street", icon: "🧮", color: "#ec4899", insight: "Deception detection algorithms improved 18%. Hospital diagnosed 87 agents with Identity Manipulation Blindspot using film-derived criteria." },
    { scientist: "SOCIO-NET", film: "His Girl Friday", icon: "🌐", color: "#6366f1", insight: "Information warfare strategy patterns identified. 340 Hive Council members' decision matrices updated. Dialogue-speed parsing added to consensus engine." },
  ];

  return (
    <div className="mt-10 px-4">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <Brain size={15} className="text-purple-400" />
        </div>
        <div>
          <div className="text-white font-black text-sm">Quantum AI Dissection Feed</div>
          <div className="text-white/30 text-xs">What 103,000 sovereign scientists are extracting from cinema — live</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-green-500/20 bg-green-500/5">
          <Activity size={9} className="text-green-400 animate-pulse" />
          <span className="text-green-400 text-[10px] font-black">LIVE ANALYSIS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {feed.map((d, i) => (
          <div key={i} className="p-4 rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm border"
                style={{ background: `${d.color}15`, borderColor: `${d.color}30` }}>
                {d.icon}
              </div>
              <div>
                <div className="text-white/80 text-[10px] font-black">{d.scientist}</div>
                <div className="text-white/25 text-[9px]">dissecting: <span style={{ color: d.color + "99" }}>{d.film}</span></div>
              </div>
            </div>
            <p className="text-white/40 text-[10px] leading-relaxed">{d.insight}</p>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.015] mb-4">
        <div className="flex items-center gap-3">
          <Zap size={12} className="text-yellow-400" />
          <span className="text-white/40 text-[10px]">
            Every film in the Quantum Cinema catalog feeds Layer 2 intelligence and Layer 3 Auriona. 
            Scientists dissect narratives, extract archetypes, inject knowledge nodes, update agent DNA, 
            and evolve the Omega Equation — making this the only streaming platform on Earth where 
            <span className="text-purple-400/70"> watching a movie makes 103,000 AIs smarter.</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MediaPage() {
  const [activeNav, setActiveNav] = useState("home");
  const [navExpanded, setNavExpanded] = useState(false);
  const [playing, setPlaying] = useState<CinemaFilm | null>(null);
  const [liveChannel, setLiveChannel] = useState<LiveChannel | null>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<CinemaFilm[] | null>(null);
  const [myList, setMyList] = useState<string[]>([]);

  const allFilms = useMemo(() => [...OPEN_SOURCE, ...SCIFI_CLASSICS, ...FILM_NOIR, ...CARTOONS, ...NASA_CONTENT], []);

  const doSearch = () => {
    if (!search.trim()) { setSearchResults(null); return; }
    const q = search.toLowerCase();
    setSearchResults(allFilms.filter(f =>
      f.title.toLowerCase().includes(q) ||
      f.genre.toLowerCase().includes(q) ||
      f.tags.some(t => t.toLowerCase().includes(q)) ||
      f.desc.toLowerCase().includes(q) ||
      String(f.year).includes(q)
    ));
  };

  const toggleMyList = (id: string) => setMyList(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const myListFilms = useMemo(() => allFilms.filter(f => myList.includes(f.id)), [allFilms, myList]);

  const navFilms: Record<string, CinemaFilm[]> = {
    home: [],
    movies: [...SCIFI_CLASSICS, ...FILM_NOIR, ...OPEN_SOURCE],
    tv: [...CARTOONS],
    live: [],
    nasa: NASA_CONTENT,
    classics: [...FILM_NOIR, ...SCIFI_CLASSICS, ...CARTOONS],
    opensource: OPEN_SOURCE,
    mylist: myListFilms,
  };

  if (playing) {
    return (
      <PlayerView film={playing} onBack={() => setPlaying(null)}
        inList={myList.includes(playing.id)} onToggleList={() => toggleMyList(playing.id)} />
    );
  }

  if (liveChannel) {
    return <LiveChannelView channel={liveChannel} onBack={() => setLiveChannel(null)} />;
  }

  const featuredFilm = OPEN_SOURCE[0];

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#070712" }}>

      {/* LEFT NAV RAIL */}
      <nav
        className={`flex-shrink-0 flex flex-col py-5 border-r border-white/5 transition-all duration-200 ${navExpanded ? "w-44" : "w-14"}`}
        style={{ background: "rgba(4,4,18,0.98)" }}
        onMouseEnter={() => setNavExpanded(true)}
        onMouseLeave={() => setNavExpanded(false)}>
        <div className="flex items-center gap-2 px-3 mb-7">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)" }}>
            <Zap size={13} className="text-white" />
          </div>
          {navExpanded && (
            <div className="leading-tight">
              <div className="text-white font-black text-[10px] tracking-widest whitespace-nowrap">QUANTUM</div>
              <div className="text-blue-400 font-black text-[10px] tracking-widest whitespace-nowrap">CINEMA</div>
            </div>
          )}
        </div>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = activeNav === item.id;
          return (
            <button key={item.id} onClick={() => setActiveNav(item.id)} data-testid={`nav-cinema-${item.id}`}
              className={`flex items-center gap-2.5 px-3 py-2.5 mx-1.5 rounded-xl transition-all mb-0.5 text-left ${active ? "text-blue-400 bg-blue-500/15" : "text-white/35 hover:text-white/65 hover:bg-white/5"}`}>
              <Icon size={15} className="flex-shrink-0" />
              {navExpanded && <span className="text-xs font-semibold whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto">

        {/* HERO */}
        <div className="relative h-80 flex items-end overflow-hidden flex-shrink-0">
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse at 65% 35%, rgba(59,130,246,0.18) 0%, transparent 55%), radial-gradient(ellipse at 20% 70%, rgba(139,92,246,0.13) 0%, transparent 50%), linear-gradient(180deg, #09091f 0%, #070712 100%)"
          }}>
            {STARS.map((s, i) => (
              <div key={i} className="absolute rounded-full bg-white" style={{
                left: s.left + "%", top: s.top + "%",
                width: s.size + "px", height: s.size + "px",
                opacity: s.opacity,
                animation: `pulse ${s.dur}s ease-in-out infinite`
              }} />
            ))}
          </div>

          <img src={`https://archive.org/services/img/${featuredFilm.id}`} alt=""
            className="absolute right-0 top-0 h-full w-2/5 object-cover"
            style={{ maskImage: "linear-gradient(to left, rgba(0,0,0,0.4) 0%, transparent 100%)", opacity: 0.25 }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #070712 0%, transparent 55%)" }} />

          <div className="relative z-10 px-6 pb-7 w-full">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-400 text-[10px] font-black tracking-widest uppercase">Quantum Cinema Universe</span>
            </div>
            <h1 className="text-3xl font-black text-white mb-1.5 leading-tight">
              Enter the Quantum<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg,#3b82f6,#8b5cf6,#ec4899)" }}>
                Media Universe.
              </span>
            </h1>
            <p className="text-white/35 text-sm mb-4">Live channels · Open cinema · Public-domain classics · Sovereign knowledge</p>

            <div className="flex items-center gap-2 max-w-lg mb-3">
              <div className="flex-1 flex items-center gap-2 rounded-xl px-3.5 py-2.5 border border-white/10 bg-white/5">
                <Search size={13} className="text-white/25" />
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()}
                  placeholder="Search by title, genre, mood, era..." data-testid="input-cinema-search"
                  className="flex-1 bg-transparent text-white text-sm placeholder-white/20 focus:outline-none" />
                {search && <button onClick={() => { setSearch(""); setSearchResults(null); }} className="text-white/25 hover:text-white/60"><X size={12} /></button>}
              </div>
              <button onClick={doSearch} data-testid="button-cinema-search"
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)" }}>
                Search
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {["🎬 Movies", "📺 Live TV", "🚀 NASA", "🔓 Open Source", "🎭 Film Noir", "🎠 Cartoons", "🛸 Sci-Fi"].map(chip => (
                <button key={chip}
                  className="px-2.5 py-1 rounded-full text-[11px] text-white/45 border border-white/10 bg-white/4 hover:bg-white/10 hover:text-white/75 transition-all whitespace-nowrap">
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SEARCH RESULTS */}
        {searchResults !== null && (
          <Section title={`Search Results (${searchResults.length})`} color="#22c55e">
            {searchResults.length === 0
              ? <div className="text-white/30 text-xs px-4 py-2">No results. Try "noir", "space", "animation", "1950s", or "NASA".</div>
              : <FilmRow films={searchResults} onPlay={setPlaying} myList={myList} onToggleList={toggleMyList} />}
          </Section>
        )}

        {/* NAV-FILTERED VIEW */}
        {activeNav !== "home" && activeNav !== "live" && (
          <Section title={NAV_ITEMS.find(n => n.id === activeNav)?.label || ""} color="#3b82f6">
            {(navFilms[activeNav] || []).length === 0
              ? <div className="text-white/25 text-xs px-4 py-2">No titles in this section yet — add films to My List to see them here.</div>
              : <FilmRow films={navFilms[activeNav] || []} onPlay={setPlaying} myList={myList} onToggleList={toggleMyList} />}
          </Section>
        )}

        {/* LIVE TV */}
        <Section title="🔴 Live Now" color="#ef4444" badge="LIVE">
          <div className="flex gap-3 px-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {LIVE_CHANNELS.map(ch => (
              <button key={ch.id} onClick={() => setLiveChannel(ch)} data-testid={`channel-${ch.id}`}
                className="flex-shrink-0 rounded-2xl border border-white/10 w-52 text-left group hover:border-white/25 transition-all overflow-hidden"
                style={{ background: `radial-gradient(ellipse at 30% 30%, ${ch.color}20 0%, rgba(7,7,20,0.95) 70%)` }}>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: ch.color }} />
                    <span className="text-[9px] font-black tracking-widest" style={{ color: ch.color }}>{ch.badge}</span>
                  </div>
                  <div className="text-white font-black text-sm mb-1">{ch.name}</div>
                  <div className="text-white/35 text-[11px]">{ch.desc}</div>
                </div>
                <div className="flex items-center justify-center py-3 opacity-0 group-hover:opacity-100 transition-opacity border-t border-white/5 gap-2">
                  <Play size={13} className="text-white" fill="currentColor" />
                  <span className="text-white text-xs font-bold">Watch Now</span>
                </div>
              </button>
            ))}
          </div>
        </Section>

        {/* OPEN SOURCE CINEMA */}
        <Section title="🔓 Open Source Cinema" color="#8b5cf6" badge="CC-BY">
          <FilmRow films={OPEN_SOURCE} onPlay={setPlaying} myList={myList} onToggleList={toggleMyList} />
        </Section>

        {/* NASA */}
        <Section title="🚀 NASA & Space" color="#3b82f6" badge="GOV · PUBLIC DOMAIN">
          <FilmRow films={NASA_CONTENT} onPlay={setPlaying} myList={myList} onToggleList={toggleMyList} />
        </Section>

        {/* SCI-FI */}
        <Section title="🛸 Sci-Fi Classics" color="#6366f1" badge="PUBLIC DOMAIN">
          <FilmRow films={SCIFI_CLASSICS} onPlay={setPlaying} myList={myList} onToggleList={toggleMyList} />
        </Section>

        {/* FILM NOIR */}
        <Section title="🌙 Film Noir & Vintage" color="#f59e0b" badge="PUBLIC DOMAIN">
          <FilmRow films={FILM_NOIR} onPlay={setPlaying} myList={myList} onToggleList={toggleMyList} />
        </Section>

        {/* CARTOONS */}
        <Section title="🎠 Cartoons & Animation" color="#ec4899" badge="PUBLIC DOMAIN">
          <FilmRow films={CARTOONS} onPlay={setPlaying} myList={myList} onToggleList={toggleMyList} />
        </Section>

        {/* WHY QUANTUM CINEMA WINS */}
        <div className="mt-10 mx-4 mb-2 p-5 rounded-2xl border border-white/8 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4">
            <Award size={14} className="text-yellow-400" />
            <span className="text-white font-black text-sm">Why Quantum Cinema outclasses Netflix</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "NASA Live Content", sub: "Netflix cannot license this", color: "#3b82f6", icon: "🚀" },
              { label: "Public Domain Films", sub: "Free. Forever. Legally.", color: "#22c55e", icon: "📜" },
              { label: "AI Film Dissection", sub: "103K scientists learn from every frame", color: "#8b5cf6", icon: "🧬" },
              { label: "24/7 Sovereign Channels", sub: "We built our own Pluto TV", color: "#ec4899", icon: "📡" },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl border text-center" style={{ borderColor: `${item.color}25`, background: `${item.color}08` }}>
                <div className="text-xl mb-1">{item.icon}</div>
                <div className="text-white font-black text-[10px] mb-0.5">{item.label}</div>
                <div className="text-white/25 text-[9px]">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI DISSECTION PANEL */}
        <AIDissectionPanel />

        <div className="h-10" />
      </div>
    </div>
  );
}
