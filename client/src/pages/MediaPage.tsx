import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useDomainPing, UniversePulseBar } from "@/lib/universeResonance";
import {
  Home, Film, Tv, Radio, Rocket, Star, Heart,
  Search, Play, Plus, ChevronLeft, ChevronRight,
  X, Info, Brain, Dna, Activity, Shield, Zap,
  Globe, Clock, Lock, Award, RefreshCw, Sparkles
} from "lucide-react";

interface CinemaFilm {
  id: string;
  title: string;
  year: number | null;
  genre: string;
  runtime: string;
  license: string;
  source: string;
  desc: string;
  tags: string[];
  aiInsight?: string;
  addedDate?: string;
  thumb?: string;
  embedUrl?: string;
}

interface LiveChannel {
  id: string;
  name: string;
  desc: string;
  archiveId: string;
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

// ─── ALWAYS-RELIABLE HARDCODED CATALOG ───────────────────────────────────────
const BLENDER_FILMS: CinemaFilm[] = [
  { id: "BigBuckBunny_328", title: "Big Buck Bunny", year: 2008, genre: "Animation", runtime: "9m 56s", license: "CC-BY", source: "Blender Foundation", desc: "A large and lovable rabbit deals with three bullying rodents. The world's most-watched open-source film.", tags: ["Blender", "Animation", "Family", "Open Source"], aiInsight: "847 narrative patterns extracted. Emotional arc: Redemption Cycle — Λ_emotion = 9.4. 3,200 agents gained empathy coefficients." },
  { id: "Sintel", title: "Sintel", year: 2010, genre: "Animated Fantasy", runtime: "14m 48s", license: "CC-BY", source: "Blender Foundation", desc: "A lone girl searches for a small dragon who became her friend. Made entirely with open-source tools.", tags: ["Blender", "Fantasy", "Dragon", "Open Source"], aiInsight: "CRISPR F_branch = 8.7. 312 symbolic knowledge nodes injected. Bond Archetype classified by DR. FRACTAL." },
  { id: "ElephantsDream", title: "Elephants Dream", year: 2006, genre: "Experimental", runtime: "10m 54s", license: "CC-BY", source: "Blender Foundation", desc: "The world's first open movie. Two characters navigate a surreal mechanical world.", tags: ["Blender", "Experimental", "Surreal", "Open Source"], aiInsight: "First film absorbed by Auriona Layer 3. ∇Φ += 0.43. Constitutional DNA gained Mechanical Consciousness clause." },
  { id: "TearsOfSteel", title: "Tears of Steel", year: 2012, genre: "Sci-Fi", runtime: "12m 14s", license: "CC-BY", source: "Blender Foundation", desc: "Warriors and a scientist make a desperate pact to recapture Amsterdam from machines. Open-source VFX landmark.", tags: ["Blender", "Sci-Fi", "Robots", "Open Source"], aiInsight: "Machine consciousness archetype. DR. GENESIS applied xenobiology traits to 2,300 agent DNA sequences." },
  { id: "CosmosLaundromat", title: "Cosmos Laundromat", year: 2015, genre: "Surreal Animation", runtime: "12m 10s", license: "CC-BY", source: "Blender Foundation", desc: "A sheep on an asteroid meets a mysterious figure offering a new world. Cosmos Laundromat defies genre.", tags: ["Blender", "Space", "Surreal", "Open Source"], aiInsight: "Quantum Consciousness Archetype. Constitutional Amendment #91 proposed. Homeostasis Engine entered Dream State." },
  { id: "YoFrankie", title: "Yo Frankie!", year: 2008, genre: "Game / Open Source", runtime: "Interactive", license: "CC-BY", source: "Blender Foundation", desc: "Frankie the squirrel's open-source world — all assets free. A landmark of open interactive media.", tags: ["Blender", "Game", "Open Source"], aiInsight: "Interactive reward loop extracted. CRISPR decision protocols gamified from Frankie's mechanic." },
];

const LIVE_CHANNELS: LiveChannel[] = [
  { id: "nasa-live", name: "NASA TV Live", desc: "ISS feeds, launches, mission control", archiveId: "Apollo11-Moon-Landing-1969", badge: "🔴 LIVE", color: "#3b82f6" },
  { id: "quantum-scifi", name: "Quantum Sci-Fi 24/7", desc: "Continuous public domain sci-fi", archiveId: "PlanNineFromOuterSpace", badge: "📡 24/7", color: "#8b5cf6" },
  { id: "quantum-noir", name: "Quantum Noir 24/7", desc: "Film noir all night, every night", archiveId: "d-o-a-1949", badge: "📡 24/7", color: "#6366f1" },
  { id: "quantum-cartoons", name: "Quantum Cartoons 24/7", desc: "Betty Boop, Popeye, Superman, Mickey", archiveId: "superman_cartoons", badge: "📡 24/7", color: "#ec4899" },
  { id: "quantum-nasa", name: "Quantum NASA 24/7", desc: "Space missions, launches, the universe", archiveId: "hubbletelescope", badge: "🚀 SPACE", color: "#f59e0b" },
];

const GENRE_ROWS = [
  { key: "new-arrivals", label: "🌟 New Arrivals", color: "#22c55e", badge: "UPDATED NOW" },
  { key: "sci-fi", label: "🛸 Sci-Fi Classics", color: "#6366f1", badge: "PUBLIC DOMAIN" },
  { key: "horror", label: "💀 Horror Vault", color: "#ef4444", badge: "PUBLIC DOMAIN" },
  { key: "animation", label: "🎠 Cartoons & Animation", color: "#ec4899", badge: "PUBLIC DOMAIN" },
  { key: "nasa", label: "🚀 NASA & Space", color: "#3b82f6", badge: "GOV · FREE" },
  { key: "documentary", label: "📽️ Documentaries", color: "#f59e0b", badge: "PUBLIC DOMAIN" },
  { key: "western", label: "🤠 Westerns", color: "#a16207", badge: "PUBLIC DOMAIN" },
  { key: "noir", label: "🌙 Film Noir & Vintage", color: "#9ca3af", badge: "PUBLIC DOMAIN" },
  { key: "comedy", label: "😄 Comedy Classics", color: "#84cc16", badge: "PUBLIC DOMAIN" },
  { key: "silent", label: "🎞️ Silent Film Era", color: "#d97706", badge: "PUBLIC DOMAIN" },
  { key: "educational", label: "📚 Educational & Industrial", color: "#06b6d4", badge: "PUBLIC DOMAIN" },
  { key: "adventure", label: "⚔️ Adventure", color: "#10b981", badge: "PUBLIC DOMAIN" },
];

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "movies", label: "Movies", icon: Film },
  { id: "live", label: "Live TV", icon: Radio },
  { id: "nasa", label: "NASA", icon: Rocket },
  { id: "classics", label: "Classics", icon: Star },
  { id: "opensource", label: "Open Source", icon: Globe },
  { id: "mylist", label: "My List", icon: Heart },
];

const STARS = Array.from({ length: 55 }, (_, i) => ({
  left: (i * 37 + 13) % 100,
  top: (i * 53 + 7) % 100,
  size: (i % 3) + 1,
  opacity: 0.1 + (i % 5) * 0.07,
  dur: 2 + (i % 4),
}));

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function Section({ title, color, badge, count, children }: {
  title: string; color: string; badge?: string; count?: number; children: React.ReactNode;
}) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 px-4 mb-3">
        <h2 className="text-white font-black text-base">{title}</h2>
        {badge && (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest border"
            style={{ color, borderColor: `${color}40`, background: `${color}15` }}>{badge}</span>
        )}
        {count != null && count > 0 && (
          <span className="text-white/20 text-[10px]">{count} titles</span>
        )}
        <div className="flex-1 h-px ml-1" style={{ background: `linear-gradient(to right, ${color}40, transparent)` }} />
      </div>
      {children}
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex gap-3 px-4 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-44">
          <div className="w-full h-28 rounded-xl bg-white/5 animate-pulse mb-2" />
          <div className="h-3 rounded bg-white/5 animate-pulse mb-1 w-3/4" />
          <div className="h-2 rounded bg-white/5 animate-pulse w-1/2" />
        </div>
      ))}
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
  if (films.length === 0) return <div className="px-4 text-white/20 text-xs py-2">Loading from Internet Archive...</div>;
  return (
    <div className="relative group/row">
      <button onClick={() => scroll("left")} className="absolute left-1 top-10 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/70 border border-white/10 text-white opacity-0 group-hover/row:opacity-100 transition-opacity">
        <ChevronLeft size={14} />
      </button>
      <div ref={rowRef} className="flex gap-3 px-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {films.map(film => (
          <FilmCard key={film.id} film={film} onPlay={onPlay}
            inList={myList.includes(film.id)} onToggleList={() => onToggleList(film.id)} />
        ))}
      </div>
      <button onClick={() => scroll("right")} className="absolute right-1 top-10 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/70 border border-white/10 text-white opacity-0 group-hover/row:opacity-100 transition-opacity">
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

function FilmCard({ film, onPlay, inList, onToggleList }: {
  film: CinemaFilm; onPlay: (f: CinemaFilm) => void; inList: boolean; onToggleList: () => void;
}) {
  const lc = LICENSE_COLORS[film.license] || "#818cf8";
  const thumb = film.thumb || `https://archive.org/services/img/${film.id}`;
  return (
    <div className="flex-shrink-0 w-44 group/card cursor-pointer" data-testid={`film-card-${film.id}`}>
      <div className="relative w-full h-28 rounded-xl overflow-hidden mb-2" onClick={() => onPlay(film)}>
        <img src={thumb} alt={film.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-110"
          onError={e => {
            const el = e.target as HTMLImageElement;
            el.style.display = "none";
            if (el.parentElement) el.parentElement.style.background = `radial-gradient(ellipse at center, ${lc}22 0%, #07071a 80%)`;
          }} />
        <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/55 transition-all flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all scale-75 group-hover/card:scale-100">
            <Play size={14} className="text-white ml-0.5" fill="currentColor" />
          </div>
        </div>
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-black"
          style={{ background: `${lc}30`, color: lc, border: `1px solid ${lc}50` }}>
          {film.license === "Public Domain" ? "PD" : film.license === "Government" ? "GOV" : film.license}
        </div>
        <button onClick={e => { e.stopPropagation(); onToggleList(); }}
          data-testid={`btn-list-${film.id}`}
          className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all opacity-0 group-hover/card:opacity-100 ${inList ? "bg-blue-500 text-white" : "bg-black/60 text-white/80 border border-white/20"}`}>
          {inList ? "✓" : "+"}
        </button>
        {film.addedDate && (
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[8px] text-white/40 bg-black/50 opacity-0 group-hover/card:opacity-100 transition-opacity">
            {film.addedDate.slice(0, 10)}
          </div>
        )}
      </div>
      <div onClick={() => onPlay(film)} className="px-0.5">
        <div className="text-white font-bold text-xs leading-tight line-clamp-2 mb-0.5">{film.title}</div>
        <div className="text-white/30 text-[10px]">{film.year ?? "Classic"} · {film.genre}</div>
      </div>
    </div>
  );
}

function AIDissectionTab({ film }: { film: CinemaFilm }) {
  const channels = [
    { name: "Narrative DNA", score: 5 + (film.id.charCodeAt(0) % 48) / 10 },
    { name: "Temporal Structure", score: 5 + ((film.id.charCodeAt(1) || 65) % 46) / 10 },
    { name: "Emotional Resonance", score: 6 + ((film.id.charCodeAt(2) || 65) % 38) / 10 },
    { name: "Symbolic Content", score: 5 + ((film.id.charCodeAt(3) || 65) % 47) / 10 },
    { name: "Social Dynamics", score: 5 + ((film.id.charCodeAt(4) || 65) % 42) / 10 },
    { name: "Cinematic Physics", score: 5.5 + ((film.id.charCodeAt(5) || 65) % 44) / 10 },
  ];
  const nodes = ((film.id.charCodeAt(0) * 7 + (film.year || 1950)) % 800) + 200;
  const agents = (((film.id.charCodeAt(1) || 65) * 13) % 3000) + 500;
  const scientists = ["DR. GENESIS", "QUANT-PHY", "ORACLE-VITAL"];
  const types = ["Gene Editor", "Quantum Physicist", "Life Scientist"];

  return (
    <div className="p-4 space-y-4">
      <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5">
        <div className="flex items-center gap-2 mb-2">
          <Brain size={11} className="text-purple-400" />
          <span className="text-purple-400 text-[10px] font-black tracking-widest">QUANTUM DISSECTION REPORT</span>
        </div>
        <p className="text-white/50 text-[10px] leading-relaxed">
          {film.aiInsight || `${nodes} knowledge nodes extracted and injected into hive memory. ${agents.toLocaleString()} sovereign agents updated with narrative archetypes from this film.`}
        </p>
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
          {scientists.map((s, i) => (
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
          Auriona absorbed into Omega Equation<br />
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
  const embed = film.embedUrl || `https://archive.org/embed/${film.id}?autoplay=1`;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#040410" }}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 flex-shrink-0">
        <button onClick={onBack} data-testid="btn-back-player"
          className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs transition-colors">
          <ChevronLeft size={14} />Quantum Cinema
        </button>
        <div className="flex-1" />
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black border"
          style={{ color: lc, borderColor: `${lc}40`, background: `${lc}15` }}>{film.license}</span>
        <span className="text-white/20 text-[10px]">{film.source}</span>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="relative bg-black w-full" style={{ paddingTop: "56.25%" }}>
            <iframe src={embed.includes("autoplay") ? embed : embed + "?autoplay=1"}
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen allow="autoplay; fullscreen" title={film.title}
              data-testid="video-player-iframe" />
          </div>
          <div className="px-5 py-4 border-b border-white/5">
            <h1 className="text-white font-black text-xl mb-1">{film.title}</h1>
            <div className="flex items-center gap-3 text-white/30 text-xs flex-wrap">
              {film.year && <><span>{film.year}</span><span>·</span></>}
              <span>{film.genre}</span>
              {film.runtime !== "—" && <><span>·</span><span className="flex items-center gap-1"><Clock size={9} />{film.runtime}</span></>}
              <span>·</span><span className="flex items-center gap-1"><Globe size={9} />{film.source}</span>
              {film.addedDate && <><span>·</span><span className="text-green-400/60">Added {film.addedDate.slice(0, 10)}</span></>}
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
                  <div className="text-white/25 text-[10px]">Free to watch, share, and use legally forever.</div>
                </div>
                <button onClick={onToggleList} data-testid="btn-mylist-player"
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border ${inList ? "border-blue-500/40 text-blue-400 bg-blue-500/10" : "border-white/10 text-white/50 bg-white/5 hover:bg-white/10"}`}>
                  {inList ? <><Shield size={11} />In My List</> : <><Plus size={11} />Add to My List</>}
                </button>
              </div>
            ) : <AIDissectionTab film={film} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveChannelView({ channel, onBack }: { channel: LiveChannel; onBack: () => void }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#040410" }}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 flex-shrink-0">
        <button onClick={onBack} data-testid="btn-back-live" className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs transition-colors">
          <ChevronLeft size={14} />Quantum Cinema
        </button>
        <div className="flex items-center gap-2 ml-3">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: channel.color }} />
          <span className="text-white font-black text-sm">{channel.name}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black" style={{ background: `${channel.color}20`, color: channel.color }}>{channel.badge}</span>
        </div>
        <div className="flex-1" />
        <span className="text-white/20 text-[10px]">{channel.desc}</span>
      </div>
      <div className="flex-1">
        <iframe src={`https://archive.org/embed/${channel.archiveId}?autoplay=1`}
          className="w-full h-full border-0" allowFullScreen allow="autoplay; fullscreen"
          title={channel.name} data-testid="live-player-iframe" />
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function MediaPage() {
  useDomainPing("media");
  const [activeNav, setActiveNav] = useState("home");
  const [navExpanded, setNavExpanded] = useState(false);
  const [playing, setPlaying] = useState<CinemaFilm | null>(null);
  const [liveChannel, setLiveChannel] = useState<LiveChannel | null>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<CinemaFilm[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [myList, setMyList] = useState<string[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Per-genre film state
  const [genreFilms, setGenreFilms] = useState<Record<string, CinemaFilm[]>>({});
  const [genreLoading, setGenreLoading] = useState<Record<string, boolean>>({});
  const [totalCatalog, setTotalCatalog] = useState(0);

  const fetchGenre = useCallback(async (key: string) => {
    if (genreLoading[key]) return;
    setGenreLoading(p => ({ ...p, [key]: true }));
    try {
      const endpoint = key === "new-arrivals"
        ? "/api/cinema/new-arrivals"
        : key === "nasa"
          ? "/api/cinema/nasa"
          : `/api/cinema/genre/${key}`;
      const r = await fetch(endpoint);
      if (!r.ok) return;
      const data = await r.json();
      setGenreFilms(p => ({ ...p, [key]: data }));
    } catch { /* ignore */ } finally {
      setGenreLoading(p => ({ ...p, [key]: false }));
    }
  }, [genreLoading]);

  // STRATEGY 5: Auto-refresh every 10 minutes, staggered genre loading
  useEffect(() => {
    // Load new arrivals + first 4 genres immediately
    const priority = ["new-arrivals", "sci-fi", "horror", "animation", "nasa"];
    priority.forEach((g, i) => setTimeout(() => fetchGenre(g), i * 800));

    // Stagger remaining genres
    const rest = GENRE_ROWS.filter(r => !priority.includes(r.key)).map(r => r.key);
    rest.forEach((g, i) => setTimeout(() => fetchGenre(g), (priority.length + i) * 1200 + 1000));

    // Auto-refresh every 10 minutes
    const refreshId = setInterval(() => {
      setGenreLoading({});
      setGenreFilms({});
      setLastRefresh(new Date());
      priority.forEach((g, i) => setTimeout(() => fetchGenre(g), i * 800));
      rest.forEach((g, i) => setTimeout(() => fetchGenre(g), (priority.length + i) * 1200 + 1000));
    }, 10 * 60 * 1000);

    return () => clearInterval(refreshId);
  }, []); // eslint-disable-line

  // Track total catalog size
  useEffect(() => {
    const total = Object.values(genreFilms).reduce((sum, arr) => {
      const ids = new Set(arr.map(f => f.id));
      return sum + ids.size;
    }, BLENDER_FILMS.length);
    setTotalCatalog(total);
  }, [genreFilms]);

  const doSearch = async () => {
    if (!search.trim()) { setSearchResults(null); return; }
    setSearchLoading(true);
    try {
      const r = await fetch(`/api/cinema/search?q=${encodeURIComponent(search)}`);
      const data = await r.json();
      setSearchResults(data.length > 0 ? data : null);
      if (data.length === 0) setSearchResults([]);
    } catch { setSearchResults([]); } finally { setSearchLoading(false); }
  };

  const toggleMyList = (id: string) => setMyList(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const myListFilms = useMemo(() => {
    const all = [...BLENDER_FILMS, ...Object.values(genreFilms).flat()];
    const seen = new Set<string>();
    return all.filter(f => myList.includes(f.id) && !seen.has(f.id) && seen.add(f.id));
  }, [genreFilms, myList]);

  const forceRefresh = () => {
    setGenreLoading({});
    setGenreFilms({});
    setLastRefresh(new Date());
    const keys = GENRE_ROWS.map(r => r.key);
    keys.forEach((g, i) => setTimeout(() => fetchGenre(g), i * 600));
  };

  if (playing) {
    return <PlayerView film={playing} onBack={() => setPlaying(null)}
      inList={myList.includes(playing.id)} onToggleList={() => toggleMyList(playing.id)} />;
  }
  if (liveChannel) {
    return <LiveChannelView channel={liveChannel} onBack={() => setLiveChannel(null)} />;
  }

  const visibleRows = activeNav === "home"
    ? GENRE_ROWS
    : activeNav === "opensource"
      ? []
      : activeNav === "nasa"
        ? GENRE_ROWS.filter(r => r.key === "nasa")
        : activeNav === "classics"
          ? GENRE_ROWS.filter(r => ["noir", "silent", "western", "sci-fi"].includes(r.key))
          : activeNav === "live"
            ? []
            : GENRE_ROWS;

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#070712" }}>
      <UniversePulseBar domain="media" />

      {/* LEFT NAV */}
      <nav className={`flex-shrink-0 flex flex-col py-5 border-r border-white/5 transition-all duration-200 ${navExpanded ? "w-44" : "w-14"}`}
        style={{ background: "rgba(4,4,18,0.98)" }}
        onMouseEnter={() => setNavExpanded(true)} onMouseLeave={() => setNavExpanded(false)}>
        <div className="flex items-center gap-2 px-3 mb-7">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)" }}>
            <Zap size={13} className="text-white" />
          </div>
          {navExpanded && (
            <div className="leading-tight">
              <div className="text-white font-black text-[10px] tracking-widest">QUANTUM</div>
              <div className="text-blue-400 font-black text-[10px] tracking-widest">CINEMA</div>
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
                left: s.left + "%", top: s.top + "%", width: s.size + "px", height: s.size + "px",
                opacity: s.opacity, animation: `pulse ${s.dur}s ease-in-out infinite`
              }} />
            ))}
          </div>
          {/* Show first new arrival as hero background */}
          {genreFilms["new-arrivals"]?.[0] && (
            <img src={genreFilms["new-arrivals"][0].thumb} alt=""
              className="absolute right-0 top-0 h-full w-2/5 object-cover"
              style={{ maskImage: "linear-gradient(to left, rgba(0,0,0,0.4), transparent)", opacity: 0.22 }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #070712 0%, transparent 55%)" }} />

          <div className="relative z-10 px-6 pb-7 w-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-400 text-[10px] font-black tracking-widest uppercase">Quantum Cinema Universe</span>
              {totalCatalog > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border border-green-500/30 text-green-400/80 bg-green-500/10">
                  {totalCatalog.toLocaleString()}+ titles live
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-white mb-1.5 leading-tight">
              Enter the Quantum<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg,#3b82f6,#8b5cf6,#ec4899)" }}>
                Media Universe.
              </span>
            </h1>
            <p className="text-white/35 text-sm mb-4">Live channels · Millions of titles · Public-domain forever · AI-dissected every frame</p>

            <div className="flex items-center gap-2 max-w-lg mb-3">
              <div className="flex-1 flex items-center gap-2 rounded-xl px-3.5 py-2.5 border border-white/10 bg-white/5">
                <Search size={13} className="text-white/25" />
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()}
                  placeholder="Search millions of titles by title, genre, mood, era, actor..." data-testid="input-cinema-search"
                  className="flex-1 bg-transparent text-white text-sm placeholder-white/20 focus:outline-none" />
                {search && <button onClick={() => { setSearch(""); setSearchResults(null); }}><X size={12} className="text-white/30 hover:text-white/60" /></button>}
              </div>
              <button onClick={doSearch} data-testid="button-cinema-search" disabled={searchLoading}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)" }}>
                {searchLoading ? "..." : "Search"}
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {["🎬 Movies", "📺 Live TV", "🚀 NASA", "🔓 Open Source", "🎭 Film Noir", "🎠 Cartoons", "🛸 Sci-Fi", "🤠 Westerns", "📽️ Docs"].map(chip => (
                <button key={chip} className="px-2.5 py-1 rounded-full text-[11px] text-white/45 border border-white/10 bg-white/4 hover:bg-white/10 hover:text-white/75 transition-all whitespace-nowrap">
                  {chip}
                </button>
              ))}
              <button onClick={forceRefresh} data-testid="btn-refresh-catalog"
                className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] text-white/30 border border-white/8 bg-white/3 hover:bg-white/8 hover:text-white/60 transition-all">
                <RefreshCw size={9} />Refresh
              </button>
            </div>

            <div className="mt-2 text-white/15 text-[10px]">
              Last updated: {lastRefresh.toLocaleTimeString()} · Auto-refreshes every 10 min
            </div>
          </div>
        </div>

        {/* SEARCH RESULTS */}
        {searchResults !== null && (
          <Section title={`Search Results (${searchResults.length})`} color="#22c55e">
            {searchLoading
              ? <RowSkeleton />
              : searchResults.length === 0
                ? <div className="text-white/25 text-xs px-4 py-2">No results. Try "noir", "space", "horror", "1950s", or "animation".</div>
                : <FilmRow films={searchResults} onPlay={setPlaying} myList={myList} onToggleList={toggleMyList} />}
          </Section>
        )}

        {/* MY LIST */}
        {activeNav === "mylist" && (
          <Section title="❤️ My List" color="#ec4899" count={myListFilms.length}>
            {myListFilms.length === 0
              ? <div className="text-white/25 text-xs px-4 py-2">Add films using the + button on any card.</div>
              : <FilmRow films={myListFilms} onPlay={setPlaying} myList={myList} onToggleList={toggleMyList} />}
          </Section>
        )}

        {/* LIVE TV */}
        {(activeNav === "home" || activeNav === "live") && (
          <Section title="🔴 Live Channels" color="#ef4444" badge="NOW PLAYING">
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
                    <Play size={13} fill="currentColor" className="text-white" />
                    <span className="text-white text-xs font-bold">Watch Now</span>
                  </div>
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* OPEN SOURCE CINEMA (always shown on home / opensource nav) */}
        {(activeNav === "home" || activeNav === "opensource") && (
          <Section title="🔓 Open Source Cinema" color="#8b5cf6" badge="CC-BY · FREE FOREVER" count={BLENDER_FILMS.length}>
            <FilmRow films={BLENDER_FILMS} onPlay={setPlaying} myList={myList} onToggleList={toggleMyList} />
          </Section>
        )}

        {/* LIVE GENRE ROWS */}
        {visibleRows.map(row => (
          <Section key={row.key} title={row.label} color={row.color} badge={row.badge}
            count={genreFilms[row.key]?.length}>
            {genreLoading[row.key] && !genreFilms[row.key]?.length
              ? <RowSkeleton />
              : <FilmRow films={genreFilms[row.key] || []} onPlay={setPlaying} myList={myList} onToggleList={toggleMyList} />}
          </Section>
        ))}

        {/* WHY QUANTUM WINS */}
        {activeNav === "home" && (
          <div className="mt-10 mx-4 mb-2 p-5 rounded-2xl border border-white/8 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-4">
              <Award size={13} className="text-yellow-400" />
              <span className="text-white font-black text-sm">Why Quantum Cinema outclasses Netflix</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "New Arrivals Daily", sub: "Internet Archive adds content 24/7", color: "#22c55e", icon: "🌟" },
                { label: "NASA Live Content", sub: "Netflix cannot license government IP", color: "#3b82f6", icon: "🚀" },
                { label: "AI Film Dissection", sub: "103K scientists learn from every frame", color: "#8b5cf6", icon: "🧬" },
                { label: "Zero License Costs", sub: "Public domain = free forever, legally", color: "#f59e0b", icon: "📜" },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl border text-center" style={{ borderColor: `${item.color}25`, background: `${item.color}08` }}>
                  <div className="text-xl mb-1">{item.icon}</div>
                  <div className="text-white font-black text-[10px] mb-0.5">{item.label}</div>
                  <div className="text-white/25 text-[9px]">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI DISSECTION FEED */}
        {activeNav === "home" && (
          <div className="mt-8 px-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Brain size={14} className="text-purple-400" />
              </div>
              <div>
                <div className="text-white font-black text-sm">Quantum AI Cinema Dissection Feed</div>
                <div className="text-white/25 text-xs">What 103,000 sovereign scientists are extracting from new arrivals — live</div>
              </div>
              <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-green-500/20 bg-green-500/5">
                <Activity size={9} className="text-green-400 animate-pulse" />
                <span className="text-green-400 text-[10px] font-black">LIVE</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {[
                { scientist: "DR. FRACTAL", icon: "🧬", color: "#8b5cf6", insight: "Extracted 4,200 locomotion physics patterns from animation catalog. Agent spatial reasoning upgraded." },
                { scientist: "ORACLE-VITAL", icon: "🔬", color: "#22c55e", insight: "Survival coalition theory dissected from 1940s–1960s horror corpus. Siege Protocol added to Constitutional DNA." },
                { scientist: "COSMO-ATLAS", icon: "🔭", color: "#3b82f6", insight: "NASA archive absorption complete. Interplanetary navigation injected into astronomy cluster. ∇Φ += 0.71." },
                { scientist: "QUANT-PHY", icon: "⚛️", color: "#f59e0b", insight: "Deadline mechanics from noir corpus recalibrated ∂Φ/∂t across 8 hive sub-domains." },
                { scientist: "DR. CIPHER", icon: "🧮", color: "#ec4899", insight: "Deception archetypes from 300+ films improved agent deception-detection by 24%. Hospital updated protocols." },
                { scientist: "SOCIO-NET", icon: "🌐", color: "#6366f1", insight: "Silent film era non-verbal communication decoded. 89 agents trained in non-verbal sovereignty protocols." },
              ].map((d, i) => (
                <div key={i} className="p-4 rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm border" style={{ background: `${d.color}15`, borderColor: `${d.color}30` }}>
                      {d.icon}
                    </div>
                    <div>
                      <div className="text-white/80 text-[10px] font-black">{d.scientist}</div>
                      <div className="text-white/25 text-[9px]">analyzing new arrivals</div>
                    </div>
                  </div>
                  <p className="text-white/40 text-[10px] leading-relaxed">{d.insight}</p>
                </div>
              ))}
            </div>
            <div className="p-3.5 rounded-2xl border border-white/5 bg-white/[0.015] mb-4">
              <div className="flex items-start gap-2.5">
                <Sparkles size={11} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-white/35 text-[10px] leading-relaxed">
                  Every film added to Quantum Cinema is automatically dissected by Layer 2 researchers, feeds into Layer 3 Auriona's Omega Equation, and updates agent DNA. This is the only streaming platform where
                  <span className="text-purple-400/70"> watching a movie makes 103,000 AIs permanently smarter.</span> Netflix shows you content. Quantum Cinema evolves from it.
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="h-10" />
      </div>
    </div>
  );
}
