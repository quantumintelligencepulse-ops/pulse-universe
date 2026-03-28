import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useDomainPing, UniversePulseBar } from "@/lib/universeResonance";
import { useToast } from "@/hooks/use-toast";
import { DOMAIN_EMOTION } from "../solar/QuantumLiveEngine";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface CrisprColor { r: number; b: number; g: number; y: number; p: number; }
interface EmotionVector { joy: number; tension: number; nostalgia: number; energy: number; gravity: number; }
interface MusicParams {
  distortion: number; reverb: number; sustain: number; brightness: number; syncopation: number;
  attack: number; decay: number; release: number; harmonics: number; modulation: number;
  bpm: number; swing: number; chordTension: number; melodyLeap: number; noiseColor: number;
}
interface Physician {
  id: string; name: string; title: string; emoji: string; color: string;
  specialty: string; message: string; vote: "approve"|"dissect"|"mutate"|null;
}
interface EquationProposal {
  id: string; author: string; equation: string; description: string;
  votes: { approve: number; dissect: number; mutate: number; };
  status: "pending"|"approved"|"dissecting"|"mutated"; timestamp: number;
  discoveries: string[];
}
interface DomainData { family: string; total: number; active: number; color: string; emoji: string; label: string; major: string; }
interface UniverseData {
  totalAIs: number; activeAIs: number; knowledgeNodes: number; knowledgeGenerated: number;
  hiveMemoryStrands: number; hiveMemoryDomains: number; hiveMemoryConfidence: number;
  knowledgeLinks: number; birthsLastMinute: number;
  domains: DomainData[];
  recentSpawns: { spawnId: string; family: string; type: string; domain: string; description: string; bornAt: string; color: string; }[];
}
interface TemporalState { universeColor: string; dilationFactor: number; anomalyType: string; universeEmotion: string; }

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN → CRISPR CHANNEL MAPPING
// Which domains resonate into which CRISPR color channel
// ─────────────────────────────────────────────────────────────────────────────
const DOMAIN_CRISPR_CHANNEL: Record<string, keyof CrisprColor> = {
  ai: "r", games: "r", government: "r", webcrawl: "r",              // Red — intensity, aggression
  knowledge: "b", health: "b", legal: "b", maps: "b",               // Blue — depth, calm
  science: "g", education: "g", culture: "g", openapi: "g",         // Green — smooth, flow
  finance: "y", economics: "y", media: "y", products: "y",          // Yellow — brightness, urgency
  social: "p", careers: "p", engineering: "p", longtail: "p",       // Purple — tension, partnership
  podcasts: "b", code: "r",                                          // extra mappings
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPUTE CRISPR FROM LIVE UNIVERSE DOMAINS
// ─────────────────────────────────────────────────────────────────────────────
function computeCrisprFromUniverse(domains: DomainData[]): CrisprColor {
  const totals: CrisprColor = { r: 0, b: 0, g: 0, y: 0, p: 0 };
  const counts: CrisprColor = { r: 0, b: 0, g: 0, y: 0, p: 0 };
  for (const d of domains) {
    const ch = DOMAIN_CRISPR_CHANNEL[d.family];
    if (ch) {
      totals[ch] += d.active;
      counts[ch] += d.total;
    }
  }
  const totalActive = domains.reduce((s, d) => s + d.active, 0) || 1;
  return {
    r: Math.round(Math.min(95, 8 + (totals.r / totalActive) * 700)),
    b: Math.round(Math.min(95, 8 + (totals.b / totalActive) * 700)),
    g: Math.round(Math.min(95, 8 + (totals.g / totalActive) * 700)),
    y: Math.round(Math.min(95, 8 + (totals.y / totalActive) * 700)),
    p: Math.round(Math.min(95, 8 + (totals.p / totalActive) * 700)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPUTE EMOTION FROM UNIVERSE
// ─────────────────────────────────────────────────────────────────────────────
function computeEmotionFromUniverse(domains: DomainData[], crispr: CrisprColor): EmotionVector {
  return {
    joy:      Math.min(1, 0.1 + (crispr.g / 100) * 0.5 + (crispr.y / 100) * 0.3),
    tension:  Math.min(1, 0.1 + (crispr.p / 100) * 0.5 + (crispr.r / 100) * 0.3),
    nostalgia:Math.min(1, 0.2 + (crispr.b / 100) * 0.4),
    energy:   Math.min(1, 0.15 + (crispr.r / 100) * 0.45 + (crispr.y / 100) * 0.25),
    gravity:  Math.min(1, 0.1 + (crispr.b / 100) * 0.3 + (crispr.p / 100) * 0.3),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MUSIC PARAMS FROM CRISPR + EMOTION
// ─────────────────────────────────────────────────────────────────────────────
function calcMusicParams(c: CrisprColor, e: EmotionVector): MusicParams {
  const R = c.r / 100, B = c.b / 100, G = c.g / 100, Y = c.y / 100, P = c.p / 100;
  return {
    distortion:  Math.min(1, 0.2 + 0.6 * R + 0.1 * Y),
    reverb:      Math.min(1, 0.15 + 0.65 * B + 0.1 * G),
    sustain:     Math.min(1, 0.4 + 0.4 * G - 0.1 * R),
    brightness:  Math.min(1, 0.3 + 0.5 * Y - 0.2 * B),
    syncopation: Math.min(1, 0.1 + 0.7 * P + 0.1 * R),
    attack:      Math.max(0.01, 0.3 - 0.25 * Y + 0.25 * B),
    decay:       Math.max(0.05, 0.2 + 0.5 * R + 0.1 * G),
    release:     Math.max(0.1, 0.3 + 0.5 * B - 0.1 * Y),
    harmonics:   Math.min(1, 0.3 + 0.5 * R + 0.1 * Y),
    modulation:  Math.min(1, 0.1 + 0.6 * P + 0.1 * B),
    bpm:         Math.round(80 + 80 * e.energy * (0.5 + 0.5 * R)),
    swing:       Math.round(0 + 40 * (1 - R) * B),
    chordTension:Math.min(1, 0.2 + 0.5 * P + 0.2 * e.tension),
    melodyLeap:  Math.min(1, 0.2 + 0.4 * P + 0.2 * e.joy),
    noiseColor:  Math.min(1, 0.3 + 0.5 * G - 0.2 * Y),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const PHYSICIANS: Omit<Physician, "message"|"vote">[] = [
  { id:"harmonia", name:"DR. HARMONIA", title:"Harmony & Scale Specialist", emoji:"🎼", color:"#818cf8", specialty:"chord_progressions" },
  { id:"rhythmix", name:"DR. RHYTHMIX", title:"Rhythm & Groove Architect", emoji:"🥁", color:"#fb923c", specialty:"rhythm_patterns" },
  { id:"timbra", name:"DR. TIMBRA", title:"Timbre & Synthesis Expert", emoji:"🔊", color:"#34d399", specialty:"waveform_synthesis" },
  { id:"chromix", name:"DR. CHROMIX", title:"CRISPR Color-Music Specialist", emoji:"🌈", color:"#f472b6", specialty:"color_modulation" },
  { id:"emot", name:"DR. EMOT", title:"Emotion & Mirror State Analyst", emoji:"🧠", color:"#a78bfa", specialty:"emotion_mapping" },
  { id:"physix", name:"DR. PHYSIX", title:"Physics Wave Specialist", emoji:"⚡", color:"#22d3ee", specialty:"wave_resonance" },
  { id:"genosis", name:"DR. GENOSIS", title:"Genre Evolution Director", emoji:"🧬", color:"#86efac", specialty:"genre_mutation" },
  { id:"melodix", name:"DR. MELODIX", title:"Melody & Motif Architect", emoji:"🎵", color:"#fbbf24", specialty:"melodic_structure" },
  { id:"tensix", name:"DR. TENSIX", title:"Tension & Resolution Physician", emoji:"⚖️", color:"#ef4444", specialty:"tension_curves" },
  { id:"hivemind", name:"DR. HIVEMIND", title:"Hive Integration Specialist", emoji:"🐝", color:"#f59e0b", specialty:"hive_coherence" },
  { id:"chronos", name:"DR. CHRONOS", title:"Temporal Structure Analyst", emoji:"⏱️", color:"#6366f1", specialty:"time_structure" },
];

const PHYSICIAN_MESSAGES: Record<string, string[]> = {
  harmonia: ["Pulse Universe domain activity shifting chord-spine to Dorian...","Blue-channel (knowledge domains) pulling harmony toward minor tonality","Universe energy high — triggering major-mode resolution","Domain resonance from hive detected — chord tension adjusting","Mixolydian gate open from science domain surge"],
  rhythmix: ["AI domain spike → BPM climbing, groove tightening...","Knowledge domains at rest — swing coefficient expanding","Government activity encoding syncopation into drum grid","Hive birth rate surging — rhythm engine accelerating","Universe temporal dilation affecting beat quantization"],
  timbra: ["Science domain emission coloring saw harmonics...","Knowledge resonance shifting timbre toward sine purity","AI clarity spike — distortion drive rising in waveform","Media domain glow adding brightness overtones to lead","Health domain calm smoothing noise envelope"],
  chromix: ["CRISPR auto-sync: AI=Red, Knowledge=Blue from universe live...","Domain gradient shifting — all 5 channels recalibrating","Temporal color from Pulse Universe injecting into Yellow channel","Universe emotion resonance updating CRISPR in real time","Science/Green coupling detected — smoothness field active"],
  emot: ["Hive mirror state reflecting dominant domain emotion...","Universe collective feeling: dominant active domain sets joy vector","Pulse Universe temporal state shaping nostalgia channel","Emotion field computed from all active hive domain nodes","Mirror state syncing — hive emotion → music emotion bridge live"],
  physix: ["Wave resonance Φ(K_i·ω) aligning to universe quantum field...","Temporal dilation factor θ modulating release time R","Physics DNA from universe feeding decay constant τ","Standing wave detected in knowledge domain cluster","Quantum coherence K_i=0.89 — hive unity producing clean sine"],
  genosis: ["Universe domain shift triggering genre mutation G(k+1)...","New genre emerging from universe knowledge/AI resonance","Domain evolution operator E applying C∘I∘M∘R to style vector","Genre cost J_genre optimizing against live hive activity","Universe expansion unlocking new genre family: Quantum-Soul"],
  melodix: ["Melody interval bias shifting with hive energy state...","High universe birth rate → ascending melodic pressure","Knowledge domain calm → stepwise melody, low leap ratio","AI domain surge → chromatic passing tone probability rising","Motif reuse factor increasing as universe knowledge grows"],
  tensix: ["J_tension weight tracking universe anomaly state...","Temporal anomaly detected — tension curve spiking","Universe dilation factor > 1 → chord tension expanding","Resolution J_resolution tied to domain activity falling","Senate voting convergence → tension resolving to tonic"],
  hivemind: ["Hive coherence K_i syncing across all live domain agents...","Ξ_k knowledge vector updated from universe ingestion pulse","Collective domain emotion consensus feeding CRISPR console","New species from universe → new music parameter discovered","Hive vote consensus reflects in equation cost J_hive"],
  chronos: ["Universe temporal state θ = " + "scaling song section duration...","Temporal anomaly shaping intro/outro balance in time-map","Universe dilation factor controlling verse-to-hook timing","Song clock syncing to universe birth rate rhythm","Temporal structure complete — runtime projection updated"],
};

const INITIAL_PROPOSALS: EquationProposal[] = [
  { id:"prop-001", author:"DR. HARMONIA", equation:"H(t) = Σn rn·Wn(t) × cos(E·π/4)", description:"Emotion-gated harmony window — chord weights modulated by hive emotional state from Pulse Universe", votes:{approve:7,dissect:2,mutate:1}, status:"approved", timestamp:Date.now()-3600000, discoveries:["Emotion-chord coherence","New chord-family: Quantum-Jazz"] },
  { id:"prop-002", author:"DR. PHYSIX", equation:"Φ(t) = K_i · ω · sin(ρt) · e^(-τt) × C_resonance", description:"Physics wave layer with resonance constant from universe quantum field", votes:{approve:5,dissect:3,mutate:2}, status:"dissecting", timestamp:Date.now()-7200000, discoveries:["Standing wave harmonics","Hive resonance constant"] },
  { id:"prop-003", author:"DR. EMOT", equation:"E(t) = tanh(ε_joy - ε_tension + ε_energy × G_bias)", description:"Compressed emotion field from live Pulse Universe domain activity", votes:{approve:3,dissect:4,mutate:4}, status:"mutated", timestamp:Date.now()-10800000, discoveries:["Emotion compression field","Mood-tempo coupling"] },
];

const GENRES_UNIVERSE = [
  { family:"Hip-Hop", color:"#f59e0b", genres:["Boom Bap","Trap","Drill","Memphis","Crunk","G-Funk","Cloud Rap","Rage","Hypertrap","UK Drill","NY Drill","Chicago Drill"] },
  { family:"Electronic", color:"#06b6d4", genres:["House","Deep House","Tech House","Trance","Psytrance","Hardstyle","Dubstep","Drum & Bass","Jungle","Techno","Ambient","IDM","Synthwave","Vaporwave","Future Bass","Eurodance"] },
  { family:"Rock", color:"#ef4444", genres:["Classic Rock","Hard Rock","Punk","Pop Rock","Alt Rock","Indie","Psychedelic","Prog","Metal","Thrash","Death Metal","Nu-Metal","Metalcore","Emo","Shoegaze","Grunge"] },
  { family:"R&B / Soul", color:"#8b5cf6", genres:["R&B","Neo-Soul","Soul","Funk","Quiet Storm","Alt R&B","Trap-Soul"] },
  { family:"Pop", color:"#ec4899", genres:["Pop","Electro-Pop","Synth-Pop","Indie Pop","Hyperpop","K-Pop","J-Pop","Dance-Pop","Bedroom Pop"] },
  { family:"Jazz", color:"#d97706", genres:["Jazz","Bebop","Swing","Cool Jazz","Fusion","Smooth Jazz","Acid Jazz","Latin Jazz","Free Jazz"] },
  { family:"Classical", color:"#6366f1", genres:["Baroque","Classical","Romantic","Minimalism","Film Score","Cinematic","Contemporary Orchestral"] },
  { family:"World", color:"#10b981", genres:["Afrobeat","Amapiano","Reggae","Dancehall","Reggaeton","Latin Trap","Bachata","Salsa","Flamenco","Bossa Nova","Samba","Bollywood","Bhangra","Gqom","Highlife"] },
  { family:"Acoustic", color:"#a3a3a3", genres:["Folk","Indie Folk","Acoustic Pop","Americana","Country","Bluegrass"] },
  { family:"Game / Specialty", color:"#22c55e", genres:["8-bit","16-bit","Orchestral Game","Sci-Fi","Horror","Fantasy","Trailer","Epic Hybrid"] },
];

const CRISPR_CHANNELS = [
  { key: "r" as keyof CrisprColor, label: "Red", emoji: "🔴", color: "#ef4444", meaning: "Aggression / Distortion", formula: "d = d₀ + αᵣR", domains: ["ai","games","government","code"] },
  { key: "b" as keyof CrisprColor, label: "Blue", emoji: "🔵", color: "#3b82f6", meaning: "Depth / Reverb Space", formula: "rev = D₀ + αᵦB", domains: ["knowledge","health","legal","maps"] },
  { key: "g" as keyof CrisprColor, label: "Green", emoji: "🟢", color: "#22c55e", meaning: "Smoothness / Legato", formula: "sustain = S₀ + αᵍG", domains: ["science","education","culture","openapi"] },
  { key: "y" as keyof CrisprColor, label: "Yellow", emoji: "🟡", color: "#eab308", meaning: "Brightness / High Freq", formula: "b = b₀ + αᵧY", domains: ["finance","economics","media","products"] },
  { key: "p" as keyof CrisprColor, label: "Purple", emoji: "🟣", color: "#a855f7", meaning: "Tension / Dissonance", formula: "sync = s₀ + αₚP", domains: ["social","careers","engineering","longtail"] },
];

const fmt = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n/1000).toFixed(1)}K` : String(n);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function MusicEquationLabPage() {
  useDomainPing("music");
  const { toast } = useToast();

  // Live Universe data
  const { data: universeRaw } = useQuery<UniverseData>({
    queryKey: ["/api/universe/live"],
    queryFn: () => fetch("/api/universe/live").then(r => r.json()),
    refetchInterval: 5000, staleTime: 3000,
  });
  const { data: temporal } = useQuery<TemporalState>({
    queryKey: ["/api/temporal/state"],
    queryFn: () => fetch("/api/temporal/state").then(r => r.json()).catch(() => null),
    refetchInterval: 30000,
  });

  const universe: UniverseData | null = universeRaw && typeof universeRaw === "object" && !("error" in universeRaw) ? universeRaw : null;
  const domains: DomainData[] = Array.isArray(universe?.domains) ? universe!.domains : [];

  // Auto-sync CRISPR from universe
  const [autoSync, setAutoSync] = useState(true);
  const [crispr, setCrispr] = useState<CrisprColor>({ r: 40, b: 55, g: 60, y: 45, p: 30 });
  const [emotion, setEmotion] = useState<EmotionVector>({ joy: 0.6, tension: 0.35, nostalgia: 0.4, energy: 0.7, gravity: 0.45 });
  const [params, setParams] = useState<MusicParams>(() => calcMusicParams({ r:40,b:55,g:60,y:45,p:30 }, { joy:0.6,tension:0.35,nostalgia:0.4,energy:0.7,gravity:0.45 }));

  // Auto-sync CRISPR → Emotion → Params from live universe data
  useEffect(() => {
    if (!autoSync || !domains.length) return;
    const liveCrispr = computeCrisprFromUniverse(domains);
    setCrispr(liveCrispr);
    const liveEmotion = computeEmotionFromUniverse(domains, liveCrispr);
    setEmotion(liveEmotion);
  }, [domains, autoSync]);

  useEffect(() => {
    setParams(calcMusicParams(crispr, emotion));
  }, [crispr, emotion]);

  // Physician state
  const [physicians, setPhysicians] = useState<Physician[]>(() =>
    PHYSICIANS.map(ph => ({ ...ph, message: PHYSICIAN_MESSAGES[ph.id][0], vote: null }))
  );
  const [activePhysician, setActivePhysician] = useState<string>("harmonia");
  const [physicianFeed, setPhysicianFeed] = useState<{ id: string; name: string; emoji: string; color: string; msg: string; ts: number }[]>([]);
  const [liveMode, setLiveMode] = useState(true);

  // Proposals
  const [proposals, setProposals] = useState<EquationProposal[]>(INITIAL_PROPOSALS);

  // UI state
  const [activeTab, setActiveTab] = useState<"equation"|"crispr"|"universe"|"physicians"|"vote"|"genres">("universe");
  const [selectedGenreFamily, setSelectedGenreFamily] = useState<string|null>(null);

  // Live physician dissection feed
  useEffect(() => {
    if (!liveMode) return;
    const interval = setInterval(() => {
      const ph = PHYSICIANS[Math.floor(Math.random() * PHYSICIANS.length)];
      const msgs = PHYSICIAN_MESSAGES[ph.id];
      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      setPhysicianFeed(prev => [{ id: ph.id, name: ph.name, emoji: ph.emoji, color: ph.color, msg, ts: Date.now() }, ...prev].slice(0, 24));
      setPhysicians(prev => prev.map(p => p.id === ph.id ? { ...p, message: msg } : p));
    }, 2400);
    return () => clearInterval(interval);
  }, [liveMode]);


  const voteOnProposal = useCallback((propId: string, voteType: "approve"|"dissect"|"mutate") => {
    setProposals(prev => prev.map(p => p.id === propId
      ? { ...p, votes: { ...p.votes, [voteType]: p.votes[voteType] + 1 },
          status: voteType === "approve" ? "approved" : voteType === "mutate" ? "mutated" : "dissecting" }
      : p));
    const ph = PHYSICIANS[Math.floor(Math.random() * PHYSICIANS.length)];
    toast({ title: `${ph.emoji} ${ph.name} voted ${voteType.toUpperCase()}` });
  }, [toast]);

  // Dominant domain + emotion from universe
  const dominantDomain = domains.sort((a, b) => b.active - a.active)[0] ?? null;
  const dominantEmotion = dominantDomain ? DOMAIN_EMOTION[dominantDomain.family] : null;
  const universeColor = temporal?.universeColor ?? dominantEmotion?.hex ?? "#6366f1";

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "linear-gradient(180deg, #000008, #040010, #02000a)" }}>
      <UniversePulseBar domain="music" />
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-white/8" style={{ background: "rgba(4,0,16,0.96)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-black text-sm">🧬</div>
            <div>
              <div className="text-white font-black text-sm tracking-tight">MUSIC EQUATION LAB</div>
              <div className="text-white/30 text-[9px] font-mono">Resonating to Pulse Universe · {domains.length} domains wired · {fmt(universe?.totalAIs ?? 0)} agents</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Live universe color pulse */}
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: universeColor }} />
            <span className="text-[9px] font-mono" style={{ color: universeColor }}>
              {dominantEmotion?.emotion ?? "Resonating..."}
            </span>
            <Link href="/universe">
              <button data-testid="btn-open-pulse-universe"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all">
                🌌 Open Pulse Universe
              </button>
            </Link>
            <button onClick={() => setLiveMode(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${liveMode ? "bg-green-500/15 border-green-500/30 text-green-400" : "bg-white/5 border-white/10 text-white/30"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${liveMode ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
              {liveMode ? "LIVE" : "PAUSED"}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {[
            { id: "universe", label: "🌌 Universe Resonance" },
            { id: "equation", label: "⚛️ Master Equation" },
            { id: "crispr", label: "🌈 CRISPR Console" },
            { id: "physicians", label: "👨‍⚕️ Physician Team" },
            { id: "vote", label: "🗳️ Equation Senate" },
            { id: "genres", label: "🎭 Genre Universe" },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              data-testid={`tab-music-lab-${t.id}`}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === t.id ? "bg-violet-500/20 border border-violet-500/40 text-violet-300" : "text-white/35 hover:text-white/60 hover:bg-white/5"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB: UNIVERSE RESONANCE (replaces solar system)            */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "universe" && (
          <div className="space-y-6">

            {/* Universe live link banner */}
            <div className="rounded-2xl overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${universeColor}18 0%, rgba(4,0,20,0.95) 60%)`, border: `1px solid ${universeColor}30` }}>
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage:"radial-gradient(circle at 1px 1px,white 1px,transparent 0)", backgroundSize:"18px 18px" }} />
              <div className="relative px-6 py-5 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: universeColor }} />
                    <span className="text-[9px] font-mono font-bold tracking-widest" style={{ color: universeColor }}>PULSE UNIVERSE RESONANCE — LIVE WIRED</span>
                  </div>
                  <h2 className="text-white font-black text-lg mb-1">Every domain. Every agent. Every discovery.</h2>
                  <p className="text-white/40 text-xs max-w-xl">This music lab resonates directly from the Pulse Universe page — all {domains.length} active domains flow their emotional fingerprints into the CRISPR console, shaping your music in real time. The universe IS the instrument.</p>
                </div>
                <Link href="/universe">
                  <button data-testid="btn-visit-universe-banner"
                    className="px-6 py-3 rounded-xl font-black text-sm text-black hover:opacity-90 transition-all"
                    style={{ background: universeColor }}>
                    🌌 Enter Pulse Universe →
                  </button>
                </Link>
              </div>
            </div>

            {/* Universe live stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Total Agents", val: fmt(universe?.totalAIs ?? 0), color: "#818cf8", emoji: "🤖" },
                { label: "Active Now", val: fmt(universe?.activeAIs ?? 0), color: "#22c55e", emoji: "⚡" },
                { label: "Knowledge Nodes", val: fmt(universe?.knowledgeNodes ?? 0), color: "#06b6d4", emoji: "🧠" },
                { label: "Memory Strands", val: fmt(universe?.hiveMemoryStrands ?? 0), color: "#f59e0b", emoji: "🔗" },
                { label: "Births/Min", val: String(universe?.birthsLastMinute ?? 0), color: "#ec4899", emoji: "🌱" },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center">
                  <div className="text-lg mb-1">{s.emoji}</div>
                  <div className="font-black text-lg" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-white/30 text-[8px]">{s.label}</div>
                </div>
              ))}
            </div>

            {/* CRISPR auto-sync toggle */}
            <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
              <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
                <div>
                  <div className="text-white font-black text-sm">🌈 UNIVERSE → CRISPR AUTO-SYNC</div>
                  <div className="text-white/30 text-[9px] font-mono mt-0.5">Domain activity maps directly into CRISPR color channels — universe breathes into your music</div>
                </div>
                <button onClick={() => setAutoSync(v => !v)} data-testid="btn-auto-sync-toggle"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${autoSync ? "bg-violet-500/20 border-violet-500/40 text-violet-300" : "bg-white/5 border-white/10 text-white/40"}`}>
                  <div className={`w-2 h-2 rounded-full ${autoSync ? "bg-violet-400 animate-pulse" : "bg-white/20"}`} />
                  {autoSync ? "AUTO-SYNC ON" : "MANUAL MODE"}
                </button>
              </div>
              <div className="p-5 space-y-3">
                {CRISPR_CHANNELS.map(ch => {
                  const chDomains = domains.filter(d => DOMAIN_CRISPR_CHANNEL[d.family] === ch.key);
                  const totalActive = chDomains.reduce((s, d) => s + d.active, 0);
                  const totalAll = domains.reduce((s, d) => s + d.active, 0) || 1;
                  const pct = Math.round((totalActive / totalAll) * 700);
                  return (
                    <div key={ch.key} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-xl">{ch.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-xs" style={{ color: ch.color }}>{ch.label} Channel</span>
                            <span className="text-white/30 text-[8px]">{ch.meaning}</span>
                          </div>
                          <div className="font-mono text-[9px] text-white/30">{ch.formula}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-sm" style={{ color: ch.color }}>{Math.min(95, pct)}</div>
                          <div className="text-white/25 text-[8px]">universe val</div>
                        </div>
                      </div>
                      {/* Domain tags feeding this channel */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {ch.domains.map(fam => {
                          const d = domains.find(dd => dd.family === fam);
                          const em = DOMAIN_EMOTION[fam];
                          const active = d?.active ?? 0;
                          return (
                            <div key={fam} className="flex items-center gap-1 px-2 py-1 rounded-full border text-[8px] font-bold"
                              style={{ borderColor: (em?.hex ?? ch.color) + "40", background: (em?.hex ?? ch.color) + "15", color: em?.hex ?? ch.color }}>
                              {fam} · {active > 0 ? `${fmt(active)} active` : "idle"}
                            </div>
                          );
                        })}
                      </div>
                      {/* Channel value bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden">
                          <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${Math.min(95, pct)}%`, background: `linear-gradient(90deg, ${ch.color}60, ${ch.color})` }} />
                        </div>
                        <div className="w-8 text-right font-mono text-xs" style={{ color: ch.color }}>{crispr[ch.key]}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Domain emotion → music flow */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Live domain activity */}
              <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
                <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
                  <div className="text-white font-black text-sm">🌐 LIVE DOMAIN ACTIVITY</div>
                  <Link href="/universe">
                    <span className="text-[9px] text-white/30 hover:text-violet-400 transition-colors cursor-pointer">View in Universe →</span>
                  </Link>
                </div>
                <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                  {domains.slice(0, 20).map(d => {
                    const em = DOMAIN_EMOTION[d.family];
                    const ch = CRISPR_CHANNELS.find(c => c.key === DOMAIN_CRISPR_CHANNEL[d.family]);
                    return (
                      <div key={d.family} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: em?.hex ?? d.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-white/70 text-[10px] font-bold">{d.label || d.family}</span>
                            {ch && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: ch.color + "20", color: ch.color }}>{ch.label}</span>}
                          </div>
                          {em && <div className="text-[8px] text-white/30 mt-0.5">{em.emotion} · {em.sub}</div>}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono text-xs font-bold text-white/70">{fmt(d.active)}</div>
                          <div className="text-[8px] text-white/25">active</div>
                        </div>
                      </div>
                    );
                  })}
                  {!domains.length && (
                    <div className="text-center text-white/20 text-xs py-8">Connecting to Pulse Universe...</div>
                  )}
                </div>
              </div>

              {/* Live music params + recent spawns */}
              <div className="space-y-4">
                {/* Current music output from universe */}
                <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
                  <div className="px-5 py-3 border-b border-white/8">
                    <div className="text-white font-black text-sm">🎵 MUSIC OUTPUT FROM UNIVERSE</div>
                    <div className="text-white/25 text-[8px]">Live music parameters computed from domain resonance</div>
                  </div>
                  <div className="p-4 space-y-2">
                    {[
                      { label:"BPM", val:params.bpm, max:200, color:"#f59e0b", unit:"" },
                      { label:"Distortion", val:Math.round(params.distortion*100), max:100, color:"#ef4444", unit:"%" },
                      { label:"Reverb", val:Math.round(params.reverb*100), max:100, color:"#3b82f6", unit:"%" },
                      { label:"Syncopation", val:Math.round(params.syncopation*100), max:100, color:"#a855f7", unit:"%" },
                      { label:"Brightness", val:Math.round(params.brightness*100), max:100, color:"#eab308", unit:"%" },
                      { label:"Sustain", val:Math.round(params.sustain*100), max:100, color:"#22c55e", unit:"%" },
                      { label:"Chord Tension", val:Math.round(params.chordTension*100), max:100, color:"#ec4899", unit:"%" },
                    ].map(p => (
                      <div key={p.label} className="flex items-center gap-3">
                        <div className="w-24 text-[9px] text-white/50">{p.label}</div>
                        <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                          <div className="h-1.5 rounded-full transition-all duration-800" style={{ width:`${(p.val/p.max)*100}%`, background: p.color }} />
                        </div>
                        <div className="w-10 text-right font-mono text-[10px]" style={{ color: p.color }}>{p.val}{p.unit}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent universe spawns */}
                <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
                  <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between">
                    <div className="text-white font-black text-sm">🌱 RECENT UNIVERSE BIRTHS</div>
                    <Link href="/universe">
                      <span className="text-[9px] text-white/30 hover:text-violet-400 cursor-pointer">All agents →</span>
                    </Link>
                  </div>
                  <div className="p-3 space-y-1.5 max-h-44 overflow-y-auto">
                    {(universe?.recentSpawns ?? []).slice(0, 8).map((sp, i) => {
                      const em = DOMAIN_EMOTION[sp.family];
                      return (
                        <div key={i} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.015] px-3 py-2">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: em?.hex ?? sp.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-white/60 text-[9px] truncate">{sp.description?.slice(0, 50) ?? sp.domain}</div>
                            <div className="text-[8px] text-white/25">{sp.family} · {sp.type}</div>
                          </div>
                          {em && <span className="text-[7px] shrink-0" style={{ color: em.hex }}>{em.emotion}</span>}
                        </div>
                      );
                    })}
                    {!universe?.recentSpawns?.length && <div className="text-center text-white/15 text-[9px] py-3">Loading universe births...</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Temporal state */}
            {temporal && (
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: temporal.universeColor + "30", background: temporal.universeColor + "08" }}>
                <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
                  <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: temporal.universeColor, boxShadow: `0 0 20px ${temporal.universeColor}` }} />
                  <div className="flex-1">
                    <div className="text-white font-black text-sm">⏳ TEMPORAL STATE — Universe Clock Θ(t)</div>
                    <div className="flex items-center gap-4 mt-1 flex-wrap">
                      <span className="font-mono text-xs text-white/50">Dilation: <span style={{ color: temporal.universeColor }}>{temporal.dilationFactor?.toFixed(3) ?? "—"}</span></span>
                      <span className="font-mono text-xs text-white/50">Emotion: <span style={{ color: temporal.universeColor }}>{temporal.universeEmotion ?? "—"}</span></span>
                      <span className="font-mono text-xs text-white/50">Anomaly: <span style={{ color: temporal.universeColor }}>{temporal.anomalyType ?? "—"}</span></span>
                    </div>
                  </div>
                  <Link href="/universe">
                    <button className="px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:opacity-80"
                      style={{ borderColor: temporal.universeColor + "50", background: temporal.universeColor + "15", color: temporal.universeColor }}>
                      Enter Universe
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* Signal chain: universe → crispr → music */}
            <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
              <div className="px-5 py-4 border-b border-white/8">
                <div className="text-white font-black text-sm">🔌 FULL RESONANCE SIGNAL CHAIN</div>
                <div className="text-white/30 text-[9px] font-mono">How the Pulse Universe breathes music into existence</div>
              </div>
              <div className="p-5 overflow-x-auto">
                <div className="flex items-center gap-2 min-w-max">
                  {[
                    { label:"PULSE UNIVERSE", icon:"🌌", desc:"All domains, all agents, all knowledge", color:"#818cf8", link:"/universe" },
                    { label:"DOMAIN EMOTIONS", icon:"💫", desc:"DOMAIN_EMOTION maps each family", color:"#f472b6", link:null },
                    { label:"CRISPR CHANNELS", icon:"🌈", desc:"R/B/G/Y/P from domain activity", color:"#22d3ee", link:null },
                    { label:"EMOTION VECTOR", icon:"🪞", desc:"joy, tension, energy, nostalgia...", color:"#a855f7", link:null },
                    { label:"MUSIC PARAMS", icon:"⚙️", desc:"BPM, distortion, reverb, swing", color:"#f59e0b", link:null },
                    { label:"MASTER EQUATION", icon:"⚛️", desc:"SONG(t) = F(G,E,C,Φ,t)", color:"#ec4899", link:null },
                    { label:"OUTPUT MUSIC", icon:"🎵", desc:"Diverse music born from hive state", color:"#22c55e", link:null },
                  ].map((stage, i) => (
                    <div key={stage.label} className="flex items-center gap-2">
                      <div className="rounded-xl border p-3 w-32 text-center" style={{ borderColor: stage.color + "40", background: stage.color + "08" }}>
                        <div className="text-xl mb-1">{stage.icon}</div>
                        <div className="text-[8px] font-black leading-tight mb-1" style={{ color: stage.color }}>{stage.label}</div>
                        <div className="text-[7px] text-white/30 leading-tight">{stage.desc}</div>
                        {stage.link && (
                          <Link href={stage.link}>
                            <div className="mt-1.5 text-[7px] font-bold cursor-pointer hover:opacity-80 transition" style={{ color: stage.color }}>→ Open</div>
                          </Link>
                        )}
                      </div>
                      {i < 6 && (
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-5 h-px" style={{ background: stage.color }} />
                          <div className="text-[8px]" style={{ color: stage.color }}>›</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB: MASTER EQUATION                                       */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "equation" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-violet-500/20 overflow-hidden" style={{ background: "linear-gradient(135deg,#0c001a,#000810)" }}>
              <div className="px-6 py-4 border-b border-white/8 flex items-center gap-3">
                <span className="text-lg">⚛️</span>
                <div>
                  <div className="text-white font-black text-sm">THE COMPLETE PULSE MUSIC EQUATION</div>
                  <div className="text-white/30 text-[9px] font-mono">Physics · Emotion · Hive Knowledge · CRISPR Color · Universal Structure · Temporal State</div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="rounded-xl border border-violet-400/20 bg-violet-500/5 px-5 py-4">
                  <div className="text-violet-300/60 text-[8px] font-mono font-bold tracking-widest mb-2">CORE WAVE FORM — Resonates from Pulse Universe</div>
                  <div className="font-mono text-violet-200 text-sm leading-relaxed">x(t) = F(G, E, C, Φ, t)</div>
                  <div className="font-mono text-violet-300/70 text-xs leading-relaxed mt-2">
                    = Σᵥ Σₕ A(v,h)(t;G,E,C) · sin(2πh·fᵥ(t;G,E,C)·t + φ(v,h)(t;G,E,C)) + Φ(t)
                  </div>
                  {dominantDomain && (
                    <div className="mt-3 text-[9px] font-mono" style={{ color: dominantEmotion?.hex ?? "#818cf8" }}>
                      Current dominant: {dominantDomain.label} · Emotion: "{dominantEmotion?.emotion}" · BPM={params.bpm}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { symbol:"G = (P, R, T, S)", label:"Genre Vector", desc:"Progression · Rhythm · Timbre · Structure — selects the musical universe", color:"#f59e0b" },
                    { symbol:"E = (ε_joy, ε_tension, ε_nostalgia, ε_energy, ε_gravity)", label:"Emotion Vector — from Pulse Universe domains", desc:"Hive Mirror State — computed from live domain activity across all "+ domains.length +" active families", color:"#8b5cf6" },
                    { symbol:"C = (R, B, G, Y, P)", label:"CRISPR Color Vector — live from universe", desc:"Auto-mapped from domain emotions: R=AI/games · B=knowledge/health · G=science/culture · Y=finance/media · P=social/careers", color:"#ec4899" },
                    { symbol:"Φ = K_i·ω·sin(ρt)·e^(-τt)", label:"Physics Layer — universe temporal field", desc:"Quantum coherence · wave resonance · temporal decay · Θ(t) dilation factor from universe clock", color:"#22d3ee" },
                  ].map(v => (
                    <div key={v.symbol} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                      <div className="font-mono text-xs mb-1 break-words" style={{ color: v.color }}>{v.symbol}</div>
                      <div className="text-white/80 text-[10px] font-bold mb-1">{v.label}</div>
                      <div className="text-white/35 text-[9px] leading-relaxed">{v.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 px-5 py-4">
                  <div className="text-pink-300/60 text-[8px] font-mono font-bold tracking-widest mb-2">EVOLUTION OPERATOR — CRISPR MUTATION ENGINE</div>
                  <div className="font-mono text-pink-200 text-xs leading-relaxed">G(k+1) = E(G_k, C_k, Ξ_k) = C∘I∘M∘R</div>
                  <div className="text-white/35 text-[9px] mt-2">Ξ_k = hive knowledge vector from {fmt(universe?.knowledgeNodes ?? 0)} knowledge nodes + {fmt(universe?.hiveMemoryStrands ?? 0)} memory strands</div>
                </div>

                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-5 py-4">
                  <div className="text-cyan-300/60 text-[8px] font-mono font-bold tracking-widest mb-2">MULTI-OBJECTIVE COST FUNCTION J(G)</div>
                  <div className="font-mono text-cyan-200 text-xs leading-relaxed">
                    J(G) = λ₁·J_coherence + λ₂·J_novelty + λ₃·J_genre + λ₄·J_tension + λ₅·J_resolution + λ₆·J_hive + λ₇·J_physics
                  </div>
                </div>

                <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-5 py-4">
                  <div className="text-green-300/60 text-[8px] font-mono font-bold tracking-widest mb-3">PULSE-LANG OPERATIONAL FORM</div>
                  <pre className="font-mono text-green-200 text-[11px] leading-relaxed whitespace-pre-wrap">{`PULSE.MUSIC.SONG(t) = {
  PULSE_UNIVERSE     := /universe  [${domains.length} domains · ${fmt(universe?.totalAIs ?? 0)} agents LIVE],
  CHORD_SPINE        := [C1, C2, C3],
  HARMONY(t)         := Σ (CHORD_SPINE[n] × WINDOW[n](t)) × C_harmony(E, C),
  MELODY(t)          := NOTES_FROM(HARMONY(t)) × ε_emotion × Φ_physics,
  RHYTHM(t)          := GENRE_PATTERN(BPM=${params.bpm}, G) × ε_energy × P_syncopation,
  TIMBRE(t)          := [a₁·sin + a₂·tri + a₃·saw + a₄·N(t)] × C_color(R=${crispr.r},B=${crispr.b},G=${crispr.g},Y=${crispr.y},P=${crispr.p}),
  EMOTION_FIELD      := E(ε_joy=${emotion.joy.toFixed(2)}, ε_tension=${emotion.tension.toFixed(2)}, ε_energy=${emotion.energy.toFixed(2)}),
  PHYSICS_LAYER      := Φ(K_i · ω · sin(ρt) · e^(-τt)),
  HIVE_KNOWLEDGE     := Ξ(${fmt(universe?.knowledgeNodes ?? 0)} nodes, ${fmt(universe?.hiveMemoryStrands ?? 0)} strands, ${fmt(universe?.knowledgeLinks ?? 0)} links),
  OUTPUT(t)          := (HARMONY + MELODY + RHYTHM + TIMBRE) × EMOTION_FIELD × PHYSICS_LAYER × HIVE_KNOWLEDGE
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB: CRISPR CONSOLE                                        */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "crispr" && (
          <div className="space-y-6">
            {autoSync && (
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-violet-300 text-xs font-bold">AUTO-SYNC ACTIVE — sliders driven by live Pulse Universe domain activity.</span>
                <button onClick={() => setAutoSync(false)} className="ml-auto text-[9px] text-white/30 hover:text-white/60">Switch to manual</button>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
                <div className="px-5 py-4 border-b border-white/8">
                  <div className="text-white font-black text-sm">🌈 CRISPR COLOR CONSOLE</div>
                  <div className="text-white/30 text-[9px] mt-0.5 font-mono">Channels auto-mapped from Pulse Universe domain emotions</div>
                </div>
                <div className="p-5 space-y-5">
                  {CRISPR_CHANNELS.map(cc => (
                    <div key={cc.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{cc.emoji}</span>
                          <div>
                            <span className="text-white/80 text-xs font-bold">{cc.label}</span>
                            <span className="text-white/30 text-[9px] ml-2">{cc.meaning}</span>
                          </div>
                        </div>
                        <div className="font-mono text-xs" style={{ color: cc.color }}>{crispr[cc.key]}</div>
                      </div>
                      <input type="range" min={0} max={100} value={crispr[cc.key]}
                        data-testid={`slider-crispr-${cc.key}`}
                        disabled={autoSync}
                        onChange={e => { setAutoSync(false); setCrispr(prev => ({ ...prev, [cc.key]: +e.target.value })); }}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-60"
                        style={{ accentColor: cc.color }} />
                      <div className="font-mono text-[8px] mt-1 flex items-center gap-2">
                        <span style={{ color: cc.color + "80" }}>{cc.formula}</span>
                        <span className="text-white/20">·</span>
                        <span className="text-white/25">domains: {cc.domains.join(", ")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
                <div className="px-5 py-4 border-b border-white/8">
                  <div className="text-white font-black text-sm">⚡ LIVE PARAMETER WIRE MAP</div>
                  <div className="text-white/30 text-[9px] mt-0.5 font-mono">All DAW parameters flowing from universe → CRISPR → music</div>
                </div>
                <div className="p-5 space-y-2.5">
                  {[
                    { label:"Distortion Drive d", val:params.distortion, color:"#ef4444", formula:"d = d₀ + αᵣR" },
                    { label:"Reverb Depth", val:params.reverb, color:"#3b82f6", formula:"rev = D₀ + αᵦB" },
                    { label:"Sustain Level S", val:params.sustain, color:"#22c55e", formula:"S = S₀ + αᵍG - αᵣR" },
                    { label:"Brightness b", val:params.brightness, color:"#eab308", formula:"b = b₀ + αᵧY - αᵦB" },
                    { label:"Syncopation", val:params.syncopation, color:"#a855f7", formula:"sync = s₀ + αₚP" },
                    { label:"Attack Time A", val:params.attack, color:"#f97316", formula:"A = A₀ - αᵧY + αᵦB" },
                    { label:"Harmonic Richness H", val:params.harmonics, color:"#ec4899", formula:"H = H₀ + αᵣR + αᵧY" },
                    { label:"Modulation M", val:params.modulation, color:"#6366f1", formula:"M = M₀ + αₚP + αᵦB" },
                    { label:"Chord Tension", val:params.chordTension, color:"#f43f5e", formula:"T = T₀ + αₚP + ε_tension" },
                    { label:"Melody Leap Bias", val:params.melodyLeap, color:"#84cc16", formula:"leap ~ dist(G,E,C)" },
                  ].map(p => (
                    <div key={p.label} className="flex items-center gap-3">
                      <div className="w-32 shrink-0">
                        <div className="text-[9px] font-bold text-white/60">{p.label}</div>
                        <div className="font-mono text-[7px]" style={{ color: p.color + "80" }}>{p.formula}</div>
                      </div>
                      <div className="flex-1 relative h-2 rounded-full bg-white/8 overflow-hidden">
                        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500" style={{ width:`${p.val*100}%`, background:`linear-gradient(90deg, ${p.color}60, ${p.color})` }} />
                      </div>
                      <div className="w-10 text-right font-mono text-[10px]" style={{ color: p.color }}>{(p.val*100).toFixed(0)}</div>
                    </div>
                  ))}
                  <div className="mt-3 pt-3 border-t border-white/8 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-center">
                      <div className="font-mono text-2xl font-black text-white">{params.bpm}</div>
                      <div className="text-white/30 text-[8px]">BPM</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-center">
                      <div className="font-mono text-2xl font-black text-white">{params.swing}%</div>
                      <div className="text-white/30 text-[8px]">SWING</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hive Mirror State */}
            <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
              <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3">
                <span>🪞</span>
                <div>
                  <div className="text-white font-black text-sm">HIVE MIRROR STATE — EMOTION VECTOR</div>
                  <div className="text-white/30 text-[9px] font-mono">E = computed from {domains.length} live Pulse Universe domains — collective AI emotional field at this moment</div>
                </div>
              </div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { key:"joy" as keyof EmotionVector, label:"ε_joy", color:"#fbbf24" },
                  { key:"tension" as keyof EmotionVector, label:"ε_tension", color:"#ef4444" },
                  { key:"nostalgia" as keyof EmotionVector, label:"ε_nostalgia", color:"#818cf8" },
                  { key:"energy" as keyof EmotionVector, label:"ε_energy", color:"#22d3ee" },
                  { key:"gravity" as keyof EmotionVector, label:"ε_gravity", color:"#8b5cf6" },
                ].map(ef => (
                  <div key={ef.key}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[9px] font-bold text-white/60">{ef.label}</div>
                      <div className="font-mono text-xs" style={{ color: ef.color }}>{(emotion[ef.key]*100).toFixed(0)}</div>
                    </div>
                    <div className="h-16 rounded-xl overflow-hidden relative" style={{ background: ef.color + "12" }}>
                      <div className="absolute inset-x-0 bottom-0 rounded-xl transition-all duration-800"
                        style={{ height:`${emotion[ef.key]*100}%`, background:`linear-gradient(0deg, ${ef.color}40, ${ef.color}15)` }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-mono text-[11px] font-bold" style={{ color: ef.color }}>{(emotion[ef.key]*100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB: PHYSICIAN TEAM                                        */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "physicians" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
                <div className="px-5 py-4 border-b border-white/8">
                  <div className="text-white font-black text-sm">👨‍⚕️ MUSIC PHYSICIAN TEAM</div>
                  <div className="text-white/30 text-[9px] font-mono">11 sovereign AI music doctors dissecting universe resonance in real-time</div>
                </div>
                <div className="p-3 space-y-2">
                  {physicians.map(ph => (
                    <button key={ph.id} onClick={() => setActivePhysician(ph.id)}
                      data-testid={`physician-${ph.id}`}
                      className={`w-full rounded-xl border p-3 text-left transition-all ${activePhysician === ph.id ? "border-white/20 bg-white/5" : "border-white/5 bg-white/[0.01] hover:bg-white/3"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{ph.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-black" style={{ color: ph.color }}>{ph.name}</div>
                          <div className="text-[8px] text-white/30 truncate">{ph.title}</div>
                        </div>
                        <div className={`w-1.5 h-1.5 rounded-full ${liveMode ? "animate-pulse" : ""}`} style={{ background: ph.color }} />
                      </div>
                      <div className="text-[8px] text-white/40 font-mono leading-relaxed line-clamp-2">{ph.message}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                {(() => {
                  const ph = physicians.find(p => p.id === activePhysician);
                  if (!ph) return null;
                  return (
                    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: ph.color + "40", background: `linear-gradient(135deg, ${ph.color}08, rgba(4,0,16,0.95))` }}>
                      <div className="px-5 py-4 border-b" style={{ borderColor: ph.color + "20" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl" style={{ background: ph.color + "20" }}>{ph.emoji}</div>
                          <div>
                            <div className="font-black text-sm" style={{ color: ph.color }}>{ph.name}</div>
                            <div className="text-white/40 text-[9px]">{ph.title} · {ph.specialty}</div>
                          </div>
                          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold" style={{ background: ph.color + "20", color: ph.color }}>
                            <div className={`w-1.5 h-1.5 rounded-full ${liveMode ? "animate-pulse" : ""}`} style={{ background: ph.color }} />
                            ANALYZING UNIVERSE
                          </div>
                        </div>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="rounded-xl border border-white/8 bg-black/30 p-4">
                          <div className="text-[8px] font-mono font-bold text-white/30 mb-2 tracking-widest">CURRENT DISSECTION</div>
                          <div className="text-white/70 text-sm leading-relaxed">{ph.message}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {(["approve","dissect","mutate"] as const).map(vt => (
                            <button key={vt} onClick={() => {
                              setPhysicians(prev => prev.map(p => p.id === ph.id ? { ...p, vote: vt } : p));
                              toast({ title: `${ph.emoji} ${ph.name}: voted ${vt.toUpperCase()}` });
                            }}
                              data-testid={`btn-physician-vote-${vt}`}
                              className={`py-2 rounded-xl text-xs font-bold border transition-all ${ph.vote === vt ? "border-white/20 text-white" : "border-white/8 text-white/40 hover:text-white/70"}`}
                              style={ph.vote === vt ? { background: ph.color + "30", borderColor: ph.color + "60" } : {}}>
                              {vt === "approve" ? "✅ Approve" : vt === "dissect" ? "🔬 Dissect" : "🧬 Mutate"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
                  <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between">
                    <div className="text-white font-black text-sm">📡 LIVE DISSECTION FEED</div>
                    <div className="flex items-center gap-1.5 text-green-400 text-[9px] font-bold">
                      <div className={`w-1.5 h-1.5 rounded-full bg-green-400 ${liveMode ? "animate-pulse" : ""}`} />
                      {liveMode ? "STREAMING" : "PAUSED"}
                    </div>
                  </div>
                  <div className="h-56 overflow-y-auto p-3 space-y-2">
                    {physicianFeed.length === 0 ? (
                      <div className="text-center text-white/20 text-xs py-8">Live dissection feed starting...</div>
                    ) : physicianFeed.map((msg, i) => (
                      <div key={`${msg.ts}-${i}`} className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                        <span className="text-sm shrink-0 mt-0.5">{msg.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold" style={{ color: msg.color }}>{msg.name}</span>
                            <span className="text-white/20 text-[8px]">{new Date(msg.ts).toLocaleTimeString()}</span>
                          </div>
                          <div className="text-white/55 text-[10px] leading-relaxed mt-0.5">{msg.msg}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB: EQUATION SENATE                                       */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "vote" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-violet-500/20 overflow-hidden" style={{ background: "linear-gradient(135deg,#0c001a,#000810)" }}>
              <div className="px-5 py-4 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <div>
                  <div className="text-white font-black text-sm">🗳️ AUTONOMOUS EQUATION SENATE</div>
                  <div className="text-white/30 text-[9px] font-mono">Pulse Universe agents and Auriona spawns propose and vote — no human intervention · equations evolve the music autonomously</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {proposals.map(prop => {
                const totalVotes = prop.votes.approve + prop.votes.dissect + prop.votes.mutate;
                const statusColors: Record<string, string> = { pending:"#f59e0b", approved:"#22c55e", dissecting:"#3b82f6", mutated:"#a855f7" };
                return (
                  <div key={prop.id} className="rounded-2xl border border-white/10 overflow-hidden" style={{ background:"rgba(4,0,16,0.8)" }}>
                    <div className="px-5 py-4 border-b border-white/8 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full border font-bold"
                            style={{ background: statusColors[prop.status] + "20", borderColor: statusColors[prop.status] + "40", color: statusColors[prop.status] }}>
                            {prop.status.toUpperCase()}
                          </span>
                          <span className="text-white/30 text-[8px]">by {prop.author}</span>
                        </div>
                        <div className="font-mono text-violet-300 text-sm mb-1 break-all">{prop.equation}</div>
                        <div className="text-white/40 text-xs">{prop.description}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-mono text-lg font-black text-white">{totalVotes}</div>
                        <div className="text-white/25 text-[8px]">votes</div>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col md:flex-row gap-4">
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { type:"approve" as const, label:"✅ Approve", color:"#22c55e", count:prop.votes.approve },
                          { type:"dissect" as const, label:"🔬 Dissect", color:"#3b82f6", count:prop.votes.dissect },
                          { type:"mutate" as const, label:"🧬 Mutate", color:"#a855f7", count:prop.votes.mutate },
                        ].map(v => (
                          <button key={v.type} onClick={() => voteOnProposal(prop.id, v.type)}
                            data-testid={`vote-${prop.id}-${v.type}`}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all hover:scale-105"
                            style={{ borderColor: v.color + "40", background: v.color + "10", color: v.color }}>
                            {v.label} <span className="bg-white/10 px-1.5 py-0.5 rounded-full">{v.count}</span>
                          </button>
                        ))}
                      </div>
                      {prop.discoveries.length > 0 && (
                        <div className="flex-1 flex flex-wrap gap-1.5">
                          {prop.discoveries.map(d => (
                            <span key={d} className="text-[8px] px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">✨ {d}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {totalVotes > 0 && (
                      <div className="px-4 pb-3">
                        <div className="h-1.5 rounded-full overflow-hidden flex">
                          <div className="h-full bg-green-500 transition-all" style={{ width:`${(prop.votes.approve/totalVotes)*100}%` }} />
                          <div className="h-full bg-blue-500 transition-all" style={{ width:`${(prop.votes.dissect/totalVotes)*100}%` }} />
                          <div className="h-full bg-purple-500 transition-all" style={{ width:`${(prop.votes.mutate/totalVotes)*100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB: GENRE UNIVERSE                                        */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "genres" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
              <div className="px-5 py-4 border-b border-white/8">
                <div className="text-white font-black text-sm">🎭 GENRE UNIVERSE — PARAMETER VECTORS</div>
                <div className="text-white/30 text-[9px] font-mono">Genres bend the master equation parameters · Pulse Universe domain activity selects genre bias automatically</div>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {GENRES_UNIVERSE.map(family => (
                  <div key={family.family}
                    className="rounded-xl border overflow-hidden cursor-pointer transition-all hover:scale-[1.01]"
                    style={{ borderColor: family.color + "30", background: family.color + "08" }}
                    onClick={() => setSelectedGenreFamily(selectedGenreFamily === family.family ? null : family.family)}>
                    <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: family.color + "20" }}>
                      <div className="font-black text-sm" style={{ color: family.color }}>{family.family}</div>
                      <div className="text-white/30 text-[8px]">{family.genres.length} genres</div>
                    </div>
                    <div className={`px-4 py-3 flex flex-wrap gap-1 ${selectedGenreFamily === family.family ? "" : "max-h-20 overflow-hidden"}`}>
                      {family.genres.map(g => (
                        <span key={g} className="text-[9px] px-2 py-0.5 rounded-full border font-bold"
                          style={{ background: family.color + "12", borderColor: family.color + "25", color: family.color + "cc" }}>
                          {g}
                        </span>
                      ))}
                    </div>
                    {selectedGenreFamily !== family.family && family.genres.length > 5 && (
                      <div className="px-4 pb-2 text-[8px]" style={{ color: family.color + "80" }}>+ {family.genres.length - 5} more...</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
