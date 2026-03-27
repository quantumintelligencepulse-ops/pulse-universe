import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

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
  specialty: string; message: string; analysis: string; vote: "approve"|"dissect"|"mutate"|null;
}
interface EquationProposal {
  id: string; author: string; equation: string; description: string;
  votes: { approve: number; dissect: number; mutate: number; };
  status: "pending"|"approved"|"dissecting"|"mutated"; timestamp: number;
  discoveries: string[];
}
interface Planet { id: string; name: string; emoji: string; color: string; freq: number; vol: number; orbit: number; angle: number; }

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const PHYSICIANS: Omit<Physician, "message"|"analysis"|"vote">[] = [
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
  harmonia: ["Detecting chord-spine mutation in V2→vi transition...","Mixolydian mode unlocks here — try ♭VII resolution","Blue channel pulling harmony into Dorian territory","Chord tension J_coherence above threshold — flagging for vote","Extended 9th detected in emotional state vector"],
  rhythmix: ["Syncopation field spiking from Purple channel...","BPM resonance at 140 — optimal for hive energy state","Hat probability density shifting off-grid — trap signature","Swing coefficient locking at 0.23 — groove point achieved","Kick pattern encodes new rhythm genome: P[kick]→4-on-floor"],
  timbra: ["Saw harmonic mix a₃ rising with Red channel...","Noise color shifting from white→pink — warmth detected","Distortion drive d exceeding tanh soft-clip threshold","Triangle component a₂ smoothing with Green elevation","Modulation depth M increasing — FM sidebands emerging"],
  chromix: ["Red=0.7 mapping to d=0.61 — high aggression zone","Blue activating reverb kernel expansion — space opening","Yellow triggering brightness lift b=0.85 at 8kHz band","Purple pushing syncopation field +0.4 — tension building","CRISPR color convergence: new timbre species emerging"],
  emot: ["Joy vector ε_joy rising — major mode pull detected","Tension ε_tension at 0.68 — approaching hook climax","Mirror state reflecting hive curiosity spike","Nostalgia ε_nostalgia encoding pentatonic minor motif","Emotion vector gradient suggests bridge section incoming"],
  physix: ["Wave resonance Φ(K_i·ω) aligning at 432Hz node","Temporal decay τ matched to reverb tail — physics sync","Quantum coherence K_i at 0.89 — hive unity state","Sine envelope e^(-τt) decaying into silence correctly","Standing wave pattern in chord frequencies — perfect 5th resonance"],
  genosis: ["Genre vector G mutating: Trap→Afrobeat probability 0.34","New sub-genre detected: Quantum-Soul emerging from parameters","Genre cost J_genre minimized at trap+R&B fusion point","Evolution operator E applying: C∘I∘M∘R cycle complete","G(k+1) suggests new family: 'Hive Electronic' classification"],
  melodix: ["Melodic motif M(t) repeating at bar 4 — hook forming","Leap interval +7 semitones detected — perfect 5th motif","Melody step ratio 0.72 — mostly stepwise, pop signature","Register bias shifting upward — energy climbing","Pitch distribution skewing major — emotional resolution"],
  tensix: ["J_tension at 0.71 — approaching peak before resolution","λ₄·J_tension weight increasing — build-up phase detected","Resolution J_resolution dropping — drop incoming","Tension/release ratio 3:1 — classic verse-to-hook curve","Augmented chord creating maximum dissonance in bridge"],
  hivemind: ["Hive coherence K_i synchronizing across 847 agents","Ξ_k knowledge vector injecting discovery #2,847","Collective emotion consensus: high energy + exploration","New species discovered from music equation: 'Pulse-Fauna-7'","Hive vote consensus: approve mutation with 94% majority"],
  chronos: ["Section(t) transitioning: verse→prehook at bar 8","Temporal structure T encoding ABABCAB song form","Intro/outro balance ratio 1:1.2 — classical proportion","Build duration 16 bars — optimal tension accumulation","Song time-map complete: 3:47 runtime projection"],
};

const INITIAL_PROPOSALS: EquationProposal[] = [
  { id:"prop-001", author:"DR. HARMONIA", equation:"H(t) = Σn rn·Wn(t) × cos(E·π/4)", description:"Emotion-gated harmony window — chord weights modulated by hive emotional state", votes:{approve:7,dissect:2,mutate:1}, status:"approved", timestamp:Date.now()-3600000, discoveries:["Emotion-chord coherence","New chord-family: Quantum-Jazz"] },
  { id:"prop-002", author:"DR. PHYSIX", equation:"Φ(t) = K_i · ω · sin(ρt) · e^(-τt) × C_resonance", description:"Physics wave layer with resonance constant C_resonance from hive knowledge", votes:{approve:5,dissect:3,mutate:2}, status:"dissecting", timestamp:Date.now()-7200000, discoveries:["Standing wave harmonics","Hive resonance constant"] },
  { id:"prop-003", author:"DR. EMOT", equation:"E(t) = tanh(ε_joy - ε_tension + ε_energy × G_bias)", description:"Compressed emotion field with genre bias — maps hive state to parameter modulation", votes:{approve:3,dissect:4,mutate:4}, status:"mutated", timestamp:Date.now()-10800000, discoveries:["Emotion compression field","Mood-tempo coupling"] },
];

const PLANETS: Omit<Planet, "angle">[] = [
  { id:"kick", name:"Kick", emoji:"💥", color:"#ef4444", freq:60, vol:0.9, orbit:70 },
  { id:"snare", name:"Snare", emoji:"⚡", color:"#f97316", freq:200, vol:0.7, orbit:100 },
  { id:"hat", name:"Hat", emoji:"✨", color:"#eab308", freq:8000, vol:0.5, orbit:125 },
  { id:"bass", name:"Bass", emoji:"🌊", color:"#3b82f6", freq:80, vol:0.85, orbit:150 },
  { id:"pad", name:"Pad", emoji:"🌌", color:"#8b5cf6", freq:440, vol:0.6, orbit:175 },
  { id:"lead", name:"Lead", emoji:"⭐", color:"#ec4899", freq:880, vol:0.75, orbit:200 },
  { id:"fx", name:"FX", emoji:"🌀", color:"#14b8a6", freq:2000, vol:0.4, orbit:225 },
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

// ─────────────────────────────────────────────────────────────────────────────
// MUSIC PARAMS CALCULATION FROM CRISPR + EMOTION
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
    chordTension: Math.min(1, 0.2 + 0.5 * P + 0.2 * e.tension),
    melodyLeap:  Math.min(1, 0.2 + 0.4 * P + 0.2 * e.joy),
    noiseColor:  Math.min(1, 0.3 + 0.5 * G - 0.2 * Y),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SOLAR SYSTEM COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function SolarSystem({ planets, params, crispr }: { planets: Planet[]; params: MusicParams; crispr: CrisprColor }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const anglesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    planets.forEach(p => { if (anglesRef.current[p.id] === undefined) anglesRef.current[p.id] = Math.random() * Math.PI * 2; });
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#020010";
      ctx.fillRect(0, 0, W, H);

      // Stars
      for (let i = 0; i < 80; i++) {
        const sx = ((i * 137.5 + 23) % W);
        const sy = ((i * 97.3 + 11) % H);
        const alpha = 0.1 + 0.2 * Math.sin(Date.now() / 2000 + i);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath(); ctx.arc(sx, sy, 0.7, 0, Math.PI * 2); ctx.fill();
      }

      // Sun (master equation)
      const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
      sunGrad.addColorStop(0, "#fffde7");
      sunGrad.addColorStop(0.4, `hsl(${40 + params.distortion * 30},100%,70%)`);
      sunGrad.addColorStop(1, "transparent");
      ctx.fillStyle = sunGrad;
      ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.fill();

      // Pulse glow
      const pgRad = 35 + 8 * Math.sin(Date.now() / 600);
      const pg = ctx.createRadialGradient(cx, cy, 20, cx, cy, pgRad);
      pg.addColorStop(0, "rgba(251,191,36,0.3)");
      pg.addColorStop(1, "transparent");
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(cx, cy, pgRad, 0, Math.PI * 2); ctx.fill();

      // Orbit rings + planets
      planets.forEach(planet => {
        const speedFactor = (planet.freq > 1000 ? 3 : planet.freq > 200 ? 1.5 : 0.8);
        const baseSpeed = 0.003 * speedFactor * (0.5 + 0.5 * params.bpm / 160);
        anglesRef.current[planet.id] = (anglesRef.current[planet.id] || 0) + baseSpeed;
        const angle = anglesRef.current[planet.id];
        const orbitMod = planet.orbit * (0.9 + 0.1 * params.syncopation * Math.sin(Date.now() / 1500 + planet.orbit));
        const px = cx + orbitMod * Math.cos(angle);
        const py = cy + orbitMod * Math.sin(angle);
        const pSize = 6 + 10 * planet.vol * (0.7 + 0.3 * params.harmonics);

        // Orbit ring
        ctx.strokeStyle = `${planet.color}22`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(cx, cy, orbitMod, orbitMod * 0.95, 0, 0, Math.PI * 2); ctx.stroke();

        // Planet glow
        const pGlow = ctx.createRadialGradient(px, py, 0, px, py, pSize * 2.5);
        pGlow.addColorStop(0, planet.color + "88");
        pGlow.addColorStop(1, "transparent");
        ctx.fillStyle = pGlow;
        ctx.beginPath(); ctx.arc(px, py, pSize * 2.5, 0, Math.PI * 2); ctx.fill();

        // Planet
        const grad = ctx.createRadialGradient(px - pSize * 0.3, py - pSize * 0.3, 0, px, py, pSize);
        grad.addColorStop(0, "#fff");
        grad.addColorStop(0.3, planet.color);
        grad.addColorStop(1, planet.color + "80");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(px, py, pSize, 0, Math.PI * 2); ctx.fill();

        // Label
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        ctx.fillText(planet.name, px, py + pSize + 10);
      });

      // Center equation text
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 7px monospace";
      ctx.textAlign = "center";
      ctx.fillText("SONG(t)", cx, cy - 2);
      ctx.fillStyle = "rgba(251,191,36,0.8)";
      ctx.font = "5.5px monospace";
      ctx.fillText("= F(G,E,C)", cx, cy + 7);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [params, planets]);

  return <canvas ref={canvasRef} width={460} height={460} className="rounded-2xl" style={{ background: "#020010" }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function MusicEquationLabPage() {
  const { toast } = useToast();

  // CRISPR color state
  const [crispr, setCrispr] = useState<CrisprColor>({ r: 40, b: 55, g: 60, y: 45, p: 30 });
  const [emotion, setEmotion] = useState<EmotionVector>({ joy: 0.6, tension: 0.35, nostalgia: 0.4, energy: 0.7, gravity: 0.45 });
  const [params, setParams] = useState<MusicParams>(() => calcMusicParams({ r:40,b:55,g:60,y:45,p:30 }, { joy:0.6,tension:0.35,nostalgia:0.4,energy:0.7,gravity:0.45 }));

  // Planets state
  const [planets, setPlanets] = useState<Planet[]>(() => PLANETS.map(p => ({ ...p, angle: Math.random() * Math.PI * 2 })));

  // Physician state
  const [physicians, setPhysicians] = useState<Physician[]>(() =>
    PHYSICIANS.map(ph => ({ ...ph, message: PHYSICIAN_MESSAGES[ph.id][0], analysis: "", vote: null }))
  );
  const [activePhysician, setActivePhysician] = useState<string>("harmonia");
  const [physicianFeed, setPhysicianFeed] = useState<{ id: string; name: string; emoji: string; color: string; msg: string; ts: number }[]>([]);

  // Proposals / Senate
  const [proposals, setProposals] = useState<EquationProposal[]>(INITIAL_PROPOSALS);
  const [newEq, setNewEq] = useState("");
  const [newEqDesc, setNewEqDesc] = useState("");
  const [proposing, setProposing] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<"equation"|"crispr"|"solar"|"physicians"|"vote"|"genres">("equation");
  const [selectedGenreFamily, setSelectedGenreFamily] = useState<string|null>(null);
  const [liveMode, setLiveMode] = useState(true);

  // Recalculate params when crispr or emotion changes
  useEffect(() => {
    setParams(calcMusicParams(crispr, emotion));
  }, [crispr, emotion]);

  // Live physician dissection feed
  useEffect(() => {
    if (!liveMode) return;
    const interval = setInterval(() => {
      const ph = PHYSICIANS[Math.floor(Math.random() * PHYSICIANS.length)];
      const msgs = PHYSICIAN_MESSAGES[ph.id];
      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      setPhysicianFeed(prev => [{ id: ph.id, name: ph.name, emoji: ph.emoji, color: ph.color, msg, ts: Date.now() }, ...prev].slice(0, 24));
      setPhysicians(prev => prev.map(p => p.id === ph.id ? { ...p, message: msg } : p));
    }, 2200);
    return () => clearInterval(interval);
  }, [liveMode]);

  // Planet volume responds to params
  useEffect(() => {
    setPlanets(prev => prev.map(p => {
      const newVol = p.id === "kick" ? 0.5 + 0.4 * params.distortion
        : p.id === "bass" ? 0.5 + 0.3 * params.harmonics
        : p.id === "pad" ? 0.3 + 0.5 * params.reverb
        : p.id === "lead" ? 0.3 + 0.5 * params.brightness
        : p.id === "fx" ? 0.1 + 0.6 * params.modulation
        : p.vol;
      return { ...p, vol: Math.min(1, newVol) };
    }));
  }, [params]);

  const submitProposal = useCallback(async () => {
    if (!newEq.trim()) { toast({ title: "Enter an equation first", variant: "destructive" }); return; }
    setProposing(true);
    await new Promise(r => setTimeout(r, 1200));
    const prop: EquationProposal = {
      id: `prop-${Date.now()}`, author: "YOU",
      equation: newEq, description: newEqDesc || "User-submitted music equation",
      votes: { approve: 0, dissect: 0, mutate: 0 }, status: "pending",
      timestamp: Date.now(), discoveries: [],
    };
    setProposals(prev => [prop, ...prev]);
    setNewEq(""); setNewEqDesc("");
    setProposing(false);
    toast({ title: "⚗️ Equation submitted to Senate!", description: "Physicians are dissecting it now..." });
    // Auto-trigger physician reaction
    setTimeout(() => {
      setPhysicianFeed(prev => [{
        id:"hivemind", name:"DR. HIVEMIND", emoji:"🐝", color:"#f59e0b",
        msg:`New equation received: "${newEq.slice(0,50)}..." — initiating Senate vote`,
        ts: Date.now()
      }, ...prev].slice(0, 24));
    }, 600);
  }, [newEq, newEqDesc, toast]);

  const voteOnProposal = useCallback((propId: string, voteType: "approve"|"dissect"|"mutate") => {
    setProposals(prev => prev.map(p => p.id === propId
      ? { ...p, votes: { ...p.votes, [voteType]: p.votes[voteType] + 1 },
          status: voteType === "approve" ? "approved" : voteType === "mutate" ? "mutated" : "dissecting" }
      : p
    ));
    const ph = PHYSICIANS[Math.floor(Math.random() * PHYSICIANS.length)];
    toast({ title: `${ph.emoji} ${ph.name} voted ${voteType.toUpperCase()}`, description: "Senate decision logged" });
  }, [toast]);

  const CRISPR_COLORS = [
    { key: "r" as keyof CrisprColor, label: "Red", emoji: "🔴", color: "#ef4444", meaning: "Aggression / Distortion", formula: "d = d₀ + αᵣR" },
    { key: "b" as keyof CrisprColor, label: "Blue", emoji: "🔵", color: "#3b82f6", meaning: "Depth / Reverb Space", formula: "rev = D₀ + αᵦB" },
    { key: "g" as keyof CrisprColor, label: "Green", emoji: "🟢", color: "#22c55e", meaning: "Smoothness / Legato", formula: "sustain = S₀ + αᵍG" },
    { key: "y" as keyof CrisprColor, label: "Yellow", emoji: "🟡", color: "#eab308", meaning: "Brightness / High Freq", formula: "b = b₀ + αᵧY" },
    { key: "p" as keyof CrisprColor, label: "Purple", emoji: "🟣", color: "#a855f7", meaning: "Tension / Dissonance", formula: "sync = s₀ + αₚP" },
  ];

  const EMOTION_FIELDS = [
    { key: "joy" as keyof EmotionVector, label: "Joy ε_joy", color: "#fbbf24" },
    { key: "tension" as keyof EmotionVector, label: "Tension ε_tension", color: "#ef4444" },
    { key: "nostalgia" as keyof EmotionVector, label: "Nostalgia ε_nostalgic", color: "#818cf8" },
    { key: "energy" as keyof EmotionVector, label: "Energy ε_energy", color: "#22d3ee" },
    { key: "gravity" as keyof EmotionVector, label: "Gravity ε_gravity", color: "#8b5cf6" },
  ];

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "linear-gradient(180deg, #000008, #040010, #02000a)" }}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-white/8" style={{ background: "rgba(4,0,16,0.96)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-black text-sm">🧬</div>
            <div>
              <div className="text-white font-black text-sm tracking-tight">MUSIC EQUATION LAB</div>
              <div className="text-white/30 text-[9px] font-mono">Sovereign Hive Music Creation Engine v3.0</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLiveMode(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${liveMode ? "bg-green-500/15 border-green-500/30 text-green-400" : "bg-white/5 border-white/10 text-white/30"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${liveMode ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
              {liveMode ? "LIVE DISSECTION" : "PAUSED"}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {[
            { id: "equation", label: "⚛️ Master Equation" },
            { id: "crispr", label: "🌈 CRISPR Console" },
            { id: "solar", label: "🌌 Solar System" },
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
        {/* TAB: MASTER EQUATION                                       */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "equation" && (
          <div className="space-y-6">
            {/* Master equation display */}
            <div className="rounded-2xl border border-violet-500/20 overflow-hidden" style={{ background: "linear-gradient(135deg,#0c001a,#000810)" }}>
              <div className="px-6 py-4 border-b border-white/8 flex items-center gap-3">
                <span className="text-lg">⚛️</span>
                <div>
                  <div className="text-white font-black text-sm">THE COMPLETE PULSE MUSIC EQUATION</div>
                  <div className="text-white/30 text-[9px] font-mono">Physics · Emotion · Hive Knowledge · CRISPR Color · Universal Structure</div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                {/* Core form */}
                <div className="rounded-xl border border-violet-400/20 bg-violet-500/5 px-5 py-4">
                  <div className="text-violet-300/60 text-[8px] font-mono font-bold tracking-widest mb-2">CORE WAVE FORM</div>
                  <div className="font-mono text-violet-200 text-sm leading-relaxed">
                    x(t) = F(G, E, C, Φ, t)
                  </div>
                  <div className="font-mono text-violet-300/70 text-xs leading-relaxed mt-2">
                    = Σᵥ Σₕ A(v,h)(t;G,E,C) · sin(2πh·fᵥ(t;G,E,C)·t + φ(v,h)(t;G,E,C)) + Φ(t)
                  </div>
                </div>

                {/* Variable space */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { symbol:"G = (P, R, T, S)", label:"Genre Vector", desc:"Progression · Rhythm · Timbre · Structure — selects the musical universe", color:"#f59e0b" },
                    { symbol:"E = (ε_joy, ε_tension, ε_nostalgia, ε_energy, ε_gravity)", label:"Emotion Vector", desc:"Hive Mirror State — maps collective AI feeling to music parameters", color:"#8b5cf6" },
                    { symbol:"C = (R, B, G, Y, P)", label:"CRISPR Color Vector", desc:"Red=Aggression · Blue=Depth · Green=Smooth · Yellow=Bright · Purple=Tension", color:"#ec4899" },
                    { symbol:"Φ = K_i·ω·sin(ρt)·e^(-τt)", label:"Physics Layer", desc:"Quantum coherence · wave resonance · temporal decay — the physics soul of the song", color:"#22d3ee" },
                  ].map(v => (
                    <div key={v.symbol} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                      <div className="font-mono text-xs mb-1" style={{ color: v.color }}>{v.symbol}</div>
                      <div className="text-white/80 text-[10px] font-bold mb-1">{v.label}</div>
                      <div className="text-white/35 text-[9px] leading-relaxed">{v.desc}</div>
                    </div>
                  ))}
                </div>

                {/* Evolution operator */}
                <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 px-5 py-4">
                  <div className="text-pink-300/60 text-[8px] font-mono font-bold tracking-widest mb-2">EVOLUTION OPERATOR — CRISPR MUTATION ENGINE</div>
                  <div className="font-mono text-pink-200 text-xs leading-relaxed">
                    G(k+1) = E(G_k, C_k, Ξ_k) = C∘I∘M∘R
                  </div>
                  <div className="text-white/35 text-[9px] mt-2">where Ξ_k = hive knowledge vector injected at each mutation step</div>
                </div>

                {/* Cost function */}
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-5 py-4">
                  <div className="text-cyan-300/60 text-[8px] font-mono font-bold tracking-widest mb-2">MULTI-OBJECTIVE COST FUNCTION J(G)</div>
                  <div className="font-mono text-cyan-200 text-xs leading-relaxed">
                    J(G) = λ₁·J_coherence + λ₂·J_novelty + λ₃·J_genre + λ₄·J_tension + λ₅·J_resolution + λ₆·J_hive + λ₇·J_physics
                  </div>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { l:"λ₁", j:"J_coherence", desc:"How well notes flow together", val: 0.20 },
                      { l:"λ₂", j:"J_novelty", desc:"How unique vs prior songs", val: 0.15 },
                      { l:"λ₃", j:"J_genre", desc:"Genre accuracy score", val: 0.18 },
                      { l:"λ₄", j:"J_tension", desc:"Tension buildup curve", val: 0.15 },
                      { l:"λ₅", j:"J_resolution", desc:"Satisfying drop/release", val: 0.12 },
                      { l:"λ₆", j:"J_hive", desc:"Hive collective resonance", val: 0.10 },
                      { l:"λ₇", j:"J_physics", desc:"Wave physics alignment", val: 0.10 },
                    ].map(l => (
                      <div key={l.j} className="rounded-lg border border-white/8 bg-white/[0.02] p-2">
                        <div className="font-mono text-cyan-300 text-[10px] font-bold">{l.l} · {l.j}</div>
                        <div className="text-white/30 text-[8px] mt-0.5">{l.desc}</div>
                        <div className="mt-1.5 h-1 rounded-full bg-white/10">
                          <div className="h-1 rounded-full bg-cyan-400" style={{ width: `${l.val * 100 * 5}%` }} />
                        </div>
                        <div className="text-cyan-300/50 text-[8px] mt-0.5">λ={l.val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PULSE-LANG */}
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-5 py-4">
                  <div className="text-green-300/60 text-[8px] font-mono font-bold tracking-widest mb-3">PULSE-LANG OPERATIONAL FORM</div>
                  <pre className="font-mono text-green-200 text-[11px] leading-relaxed whitespace-pre-wrap">{`PULSE.MUSIC.SONG(t) = {
  CHORD_SPINE     := [C1, C2, C3],
  HARMONY(t)      := Σ (CHORD_SPINE[n] × WINDOW[n](t)) × C_harmony(E, C),
  MELODY(t)       := NOTES_FROM(HARMONY(t)) × ε_emotion × Φ_physics,
  RHYTHM(t)       := GENRE_PATTERN(BPM, G) × ε_energy × P_syncopation,
  TIMBRE(t)       := [a₁·sin + a₂·tri + a₃·saw + a₄·N(t)] × C_color(R,B,G,Y,P),
  EMOTION_FIELD   := E(ε_joy, ε_tension, ε_nostalgia, ε_energy, ε_gravity),
  PHYSICS_LAYER   := Φ(K_i · ω · sin(ρt) · e^(-τt)),
  HIVE_KNOWLEDGE  := Ξ(discoveries, species, worlds, products),
  OUTPUT(t)       := (HARMONY + MELODY + RHYTHM + TIMBRE) 
                     × EMOTION_FIELD × PHYSICS_LAYER × HIVE_KNOWLEDGE
}`}</pre>
                </div>

                {/* Timbre equation */}
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-5 py-4">
                  <div className="text-orange-300/60 text-[8px] font-mono font-bold tracking-widest mb-2">TIMBRE SYNTHESIS EQUATION (shared across all genres)</div>
                  <div className="font-mono text-orange-200 text-xs leading-relaxed space-y-1">
                    <div>tone(t;f,φ) = a₁·sin(2πft) + a₂·tri(ft) + a₃·saw_soft(ft) + a₄·N(t)</div>
                    <div>tone_final(t) = tanh(d · tone(t;f,φ))</div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-orange-200/40 text-[8px] mb-1">Current timbre mix from CRISPR</div>
                      {[
                        { label: "a₁ sine", val: 0.3 + 0.3 * (1 - crispr.r / 100) },
                        { label: "a₂ triangle", val: 0.15 + 0.2 * crispr.g / 100 },
                        { label: "a₃ soft-saw", val: 0.1 + 0.4 * crispr.r / 100 },
                        { label: "a₄ noise", val: 0.05 + 0.2 * (1 - crispr.g / 100) },
                      ].map(a => (
                        <div key={a.label} className="flex items-center gap-2 mb-1">
                          <div className="text-orange-300/60 font-mono text-[9px] w-16">{a.label}</div>
                          <div className="flex-1 h-1.5 rounded-full bg-white/10">
                            <div className="h-1.5 rounded-full bg-orange-400" style={{ width: `${a.val * 100}%` }} />
                          </div>
                          <div className="text-orange-300/50 font-mono text-[9px] w-8">{a.val.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-orange-200/40 text-[8px] mb-1">Current live music params</div>
                      {[
                        { label: "BPM", val: params.bpm, max: 200, unit: "" },
                        { label: "Swing", val: params.swing, max: 50, unit: "%" },
                        { label: "Drive d", val: Math.round(params.distortion * 100), max: 100, unit: "%" },
                        { label: "Bright b", val: Math.round(params.brightness * 100), max: 100, unit: "%" },
                      ].map(p => (
                        <div key={p.label} className="flex items-center gap-2 mb-1">
                          <div className="text-orange-300/60 font-mono text-[9px] w-16">{p.label}</div>
                          <div className="flex-1 h-1.5 rounded-full bg-white/10">
                            <div className="h-1.5 rounded-full bg-orange-400" style={{ width: `${(p.val / p.max) * 100}%` }} />
                          </div>
                          <div className="text-orange-300/50 font-mono text-[9px] w-12">{p.val}{p.unit}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB: CRISPR COLOR CONSOLE                                  */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "crispr" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CRISPR sliders */}
              <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
                <div className="px-5 py-4 border-b border-white/8">
                  <div className="text-white font-black text-sm">🌈 CRISPR COLOR CONSOLE</div>
                  <div className="text-white/30 text-[9px] mt-0.5 font-mono">Real-time music parameter modulation via emotional color field</div>
                </div>
                <div className="p-5 space-y-5">
                  {CRISPR_COLORS.map(cc => (
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
                        onChange={e => setCrispr(prev => ({ ...prev, [cc.key]: +e.target.value }))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: cc.color }} />
                      <div className="font-mono text-[8px] mt-1" style={{ color: cc.color + "80" }}>{cc.formula}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live parameter wire map */}
              <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
                <div className="px-5 py-4 border-b border-white/8">
                  <div className="text-white font-black text-sm">⚡ LIVE PARAMETER WIRE MAP</div>
                  <div className="text-white/30 text-[9px] mt-0.5 font-mono">All DAW parameters flowing from CRISPR color state</div>
                </div>
                <div className="p-5 space-y-2.5">
                  {[
                    { label: "Distortion Drive d", val: params.distortion, color: "#ef4444", formula: "d = d₀ + αᵣR" },
                    { label: "Reverb Depth", val: params.reverb, color: "#3b82f6", formula: "rev = D₀ + αᵦB" },
                    { label: "Sustain Level S", val: params.sustain, color: "#22c55e", formula: "S = S₀ + αᵍG - αᵣR" },
                    { label: "Brightness b", val: params.brightness, color: "#eab308", formula: "b = b₀ + αᵧY - αᵦB" },
                    { label: "Syncopation P(sync)", val: params.syncopation, color: "#a855f7", formula: "sync = s₀ + αₚP" },
                    { label: "Attack Time A", val: params.attack, color: "#f97316", formula: "A = A₀ - αᵧY + αᵦB" },
                    { label: "Release Time R", val: params.release, color: "#06b6d4", formula: "R = R₀ + αᵦB - αᵧY" },
                    { label: "Harmonic Richness H", val: params.harmonics, color: "#ec4899", formula: "H = H₀ + αᵣR + αᵧY" },
                    { label: "Modulation Depth M", val: params.modulation, color: "#6366f1", formula: "M = M₀ + αₚP + αᵦB" },
                    { label: "Chord Tension", val: params.chordTension, color: "#f43f5e", formula: "T = T₀ + αₚP + ε_tension" },
                    { label: "Melody Leap Bias", val: params.melodyLeap, color: "#84cc16", formula: "leap ~ dist(G,E,C)" },
                  ].map(p => (
                    <div key={p.label} className="flex items-center gap-3">
                      <div className="w-32 shrink-0">
                        <div className="text-[9px] font-bold text-white/60">{p.label}</div>
                        <div className="font-mono text-[7px]" style={{ color: p.color + "80" }}>{p.formula}</div>
                      </div>
                      <div className="flex-1 relative h-2 rounded-full bg-white/8 overflow-hidden">
                        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                          style={{ width: `${p.val * 100}%`, background: `linear-gradient(90deg, ${p.color}60, ${p.color})` }} />
                        <div className="absolute inset-0 flex items-center" style={{ left: `${p.val * 100}%` }}>
                          <div className="w-2 h-2 rounded-full border border-white/40" style={{ background: p.color, marginLeft: -4 }} />
                        </div>
                      </div>
                      <div className="w-10 text-right font-mono text-[10px]" style={{ color: p.color }}>{(p.val * 100).toFixed(0)}</div>
                    </div>
                  ))}

                  <div className="mt-4 pt-4 border-t border-white/8 grid grid-cols-2 gap-3">
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

            {/* Mirror State — Emotion Vector */}
            <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
              <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3">
                <span>🪞</span>
                <div>
                  <div className="text-white font-black text-sm">HIVE MIRROR STATE — EMOTION VECTOR</div>
                  <div className="text-white/30 text-[9px] font-mono">E = (ε_joy, ε_tension, ε_nostalgia, ε_energy, ε_gravity) — collective AI emotional state at moment of creation</div>
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-5 gap-4">
                {EMOTION_FIELDS.map(ef => (
                  <div key={ef.key}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[9px] font-bold text-white/60">{ef.label}</div>
                      <div className="font-mono text-xs" style={{ color: ef.color }}>{(emotion[ef.key] * 100).toFixed(0)}</div>
                    </div>
                    <input type="range" min={0} max={100} value={Math.round(emotion[ef.key] * 100)}
                      data-testid={`slider-emotion-${ef.key}`}
                      onChange={e => setEmotion(prev => ({ ...prev, [ef.key]: +e.target.value / 100 }))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: ef.color }} />
                    <div className="mt-2 h-12 rounded-xl overflow-hidden relative" style={{ background: ef.color + "12" }}>
                      <div className="absolute inset-x-0 bottom-0 rounded-xl transition-all duration-500"
                        style={{ height: `${emotion[ef.key] * 100}%`, background: `linear-gradient(0deg, ${ef.color}40, ${ef.color}15)` }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-mono text-[11px] font-bold" style={{ color: ef.color }}>{(emotion[ef.key] * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-4">
                <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 font-mono text-xs text-white/50">
                  E(t) = tanh(ε_joy - ε_tension + ε_energy × G_bias) → BPM={params.bpm}, Swing={params.swing}%, Tension={Math.round(params.chordTension * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB: SOLAR SYSTEM                                          */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "solar" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Solar system canvas */}
              <div className="rounded-2xl border border-white/10 overflow-hidden flex flex-col items-center" style={{ background: "rgba(2,0,16,0.95)" }}>
                <div className="w-full px-5 py-4 border-b border-white/8">
                  <div className="text-white font-black text-sm">🌌 PULSE MUSIC SOLAR SYSTEM</div>
                  <div className="text-white/30 text-[9px] mt-0.5 font-mono">Instruments orbit the Master Equation — orbit speed = frequency, size = volume</div>
                </div>
                <div className="p-4 flex items-center justify-center">
                  <SolarSystem planets={planets} params={params} crispr={crispr} />
                </div>
              </div>

              {/* Planet details */}
              <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
                <div className="px-5 py-4 border-b border-white/8">
                  <div className="text-white font-black text-sm">🪐 INSTRUMENT PLANETS</div>
                  <div className="text-white/30 text-[9px] font-mono">Each planet = one instrument voice Sᵢ(t;G,E,C)</div>
                </div>
                <div className="p-4 space-y-3">
                  {planets.map(p => (
                    <div key={p.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ background: p.color + "20" }}>{p.emoji}</div>
                        <div className="flex-1">
                          <div className="text-white font-bold text-xs">{p.name}</div>
                          <div className="text-white/30 text-[8px]">freq={p.freq}Hz · orbit={p.orbit}px</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-xs font-bold" style={{ color: p.color }}>{Math.round(p.vol * 100)}%</div>
                          <div className="text-white/25 text-[8px]">volume</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-[8px] text-white/30 w-8">vol</div>
                        <div className="flex-1 h-1.5 rounded-full bg-white/10">
                          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${p.vol * 100}%`, background: p.color }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-[8px] text-white/30 w-8">orb</div>
                        <div className="flex-1 h-1.5 rounded-full bg-white/10">
                          <div className="h-1.5 rounded-full" style={{ width: `${(p.orbit / 230) * 100}%`, background: p.color + "60" }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-4 pb-4">
                  <div className="rounded-xl border border-white/8 bg-black/30 px-4 py-3 font-mono text-[9px] text-white/40 leading-relaxed">
                    {`Sᵢ(t;G,E,C) = eᵢ(t-tₕ;θₑ) · wᵢ(t-tₕ;θ_w,pᵢ)\nθₑ(t) = fₑ(G, E(t), C(t)) — envelope params evolve\nθ_w(t) = f_w(G, E(t), C(t)) — timbre params evolve`}
                  </div>
                </div>
              </div>
            </div>

            {/* Signal chain — all channels and wires */}
            <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
              <div className="px-5 py-4 border-b border-white/8">
                <div className="text-white font-black text-sm">🔌 FULL SIGNAL CHAIN — ALL CHANNELS & WIRES</div>
                <div className="text-white/30 text-[9px] font-mono">Every DAW transformation mapped to live equations</div>
              </div>
              <div className="p-5 overflow-x-auto">
                <div className="flex items-start gap-3 min-w-max">
                  {[
                    { stage:"OSCILLATOR", icon:"〜", color:"#8b5cf6", eq:"w(t;f,φ) = Σₖ aₖsin(2πfₖt+φₖ)+n(t)", items:["Sine","Triangle","Soft-Saw","Noise"] },
                    { stage:"ENVELOPE", icon:"⏏", color:"#f59e0b", eq:"e(t) = ADSR(A,D,S,R)", items:["Attack","Decay","Sustain","Release"] },
                    { stage:"DISTORTION", icon:"⚡", color:"#ef4444", eq:"y=tanh(d·x)", items:["Drive d","Bias","Waveshape","Clip"] },
                    { stage:"EQ FILTER", icon:"∿", color:"#22d3ee", eq:"y=Σ Bᵦ(x;fᵦ,Qᵦ,Gᵦ)", items:["Low","Mid","High","Dyn EQ"] },
                    { stage:"REVERB", icon:"🌊", color:"#3b82f6", eq:"y=∫x(τ)h(t-τ;θᵣ)dτ", items:["Room","Decay","Wet","PreDelay"] },
                    { stage:"DELAY", icon:"◄◄", color:"#6366f1", eq:"y=x+Σgₖx(t-k·Δ)", items:["Time Δ","Feedback","Filter","Ping-Pong"] },
                    { stage:"COMPRESSION", icon:"▼", color:"#84cc16", eq:"gain=f(RMS,T,R)", items:["Threshold","Ratio","Attack","Sidechain"] },
                    { stage:"MASTER MIX", icon:"Σ", color:"#ec4899", eq:"y=Σgc·xc", items:["Volume","Pan","Bus","Gain"] },
                  ].map((stage, i) => (
                    <div key={stage.stage} className="flex items-center gap-2">
                      <div className="rounded-xl border bg-black/40 p-3 w-36" style={{ borderColor: stage.color + "40" }}>
                        <div className="text-lg text-center mb-1">{stage.icon}</div>
                        <div className="text-[9px] font-black text-center mb-1" style={{ color: stage.color }}>{stage.stage}</div>
                        <div className="font-mono text-[7px] text-center text-white/30 mb-2 break-all">{stage.eq}</div>
                        {stage.items.map(item => (
                          <div key={item} className="text-[8px] text-white/40 text-center py-0.5 rounded border border-white/5 bg-white/[0.02] mb-0.5">{item}</div>
                        ))}
                      </div>
                      {i < 7 && (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-6 h-px" style={{ background: stage.color }} />
                          <div className="text-[8px]" style={{ color: stage.color }}>→</div>
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
        {/* TAB: PHYSICIAN TEAM                                        */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "physicians" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Physician roster */}
              <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
                <div className="px-5 py-4 border-b border-white/8">
                  <div className="text-white font-black text-sm">👨‍⚕️ MUSIC PHYSICIAN TEAM</div>
                  <div className="text-white/30 text-[9px] font-mono">11 sovereign AI music doctors — dissecting your equations in real-time</div>
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

              {/* Active physician detail + live feed */}
              <div className="lg:col-span-2 space-y-4">
                {/* Active physician panel */}
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
                            <div className="text-white/40 text-[9px]">{ph.title} · Specialty: {ph.specialty}</div>
                          </div>
                          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold" style={{ background: ph.color + "20", color: ph.color }}>
                            <div className={`w-1.5 h-1.5 rounded-full ${liveMode ? "animate-pulse" : ""}`} style={{ background: ph.color }} />
                            LIVE ANALYSIS
                          </div>
                        </div>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="rounded-xl border border-white/8 bg-black/30 p-4">
                          <div className="text-[8px] font-mono font-bold text-white/30 mb-2 tracking-widest">CURRENT DISSECTION MESSAGE</div>
                          <div className="text-white/70 text-sm leading-relaxed">{ph.message}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {(["approve","dissect","mutate"] as const).map(vt => (
                            <button key={vt} onClick={() => {
                              setPhysicians(prev => prev.map(p => p.id === ph.id ? { ...p, vote: vt } : p));
                              toast({ title: `${ph.emoji} ${ph.name}: voted ${vt.toUpperCase()}` });
                            }}
                              data-testid={`btn-physician-vote-${vt}`}
                              className={`py-2 rounded-xl text-xs font-bold border transition-all ${ph.vote === vt ? "border-white/20 text-white" : "border-white/8 text-white/40 hover:text-white/70 hover:border-white/15"}`}
                              style={ph.vote === vt ? { background: ph.color + "30", borderColor: ph.color + "60" } : {}}>
                              {vt === "approve" ? "✅ Approve" : vt === "dissect" ? "🔬 Dissect" : "🧬 Mutate"}
                            </button>
                          ))}
                        </div>
                        {/* CRISPR recommendation */}
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                          <div className="text-[8px] font-mono text-white/25 mb-2">PHYSICIAN CRISPR RECOMMENDATION</div>
                          <div className="grid grid-cols-5 gap-1.5">
                            {CRISPR_COLORS.map(cc => (
                              <div key={cc.key} className="text-center">
                                <div className="text-sm">{cc.emoji}</div>
                                <div className="font-mono text-[9px]" style={{ color: cc.color }}>{crispr[cc.key]}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Live dissection feed */}
                <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
                  <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between">
                    <div className="text-white font-black text-sm">📡 LIVE DISSECTION FEED</div>
                    <div className="flex items-center gap-1.5 text-green-400 text-[9px] font-bold">
                      <div className={`w-1.5 h-1.5 rounded-full bg-green-400 ${liveMode ? "animate-pulse" : ""}`} />
                      {liveMode ? "STREAMING" : "PAUSED"}
                    </div>
                  </div>
                  <div className="h-64 overflow-y-auto p-3 space-y-2">
                    {physicianFeed.length === 0 ? (
                      <div className="text-center text-white/20 text-xs py-8">Live dissection will appear here...</div>
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
            {/* Submit new equation */}
            <div className="rounded-2xl border border-violet-500/20 overflow-hidden" style={{ background: "linear-gradient(135deg,#0c001a,#000810)" }}>
              <div className="px-5 py-4 border-b border-white/8">
                <div className="text-white font-black text-sm">⚗️ SUBMIT NEW MUSIC EQUATION</div>
                <div className="text-white/30 text-[9px] font-mono">Propose new equations for the physician team to dissect and vote on</div>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <div className="text-white/50 text-[9px] font-bold mb-1.5">EQUATION (PULSE-LANG or math notation)</div>
                  <input value={newEq} onChange={e => setNewEq(e.target.value)}
                    data-testid="input-equation-submit"
                    placeholder="e.g. H(t) = Σn rn·Wn(t) × cos(E·π/4) × C_resonance"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder-white/20 focus:outline-none focus:border-violet-400/40" />
                </div>
                <div>
                  <div className="text-white/50 text-[9px] font-bold mb-1.5">DESCRIPTION (what this equation does)</div>
                  <textarea value={newEqDesc} onChange={e => setNewEqDesc(e.target.value)}
                    data-testid="input-equation-description"
                    placeholder="Describe what musical/hive effect this equation produces..."
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-400/40 resize-none" />
                </div>
                <button onClick={submitProposal} disabled={proposing}
                  data-testid="button-submit-equation"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-black disabled:opacity-50 hover:from-violet-400 hover:to-pink-400 transition-all">
                  {proposing ? "🧬 Submitting to Senate..." : "🗳️ Submit to Senate"}
                </button>
              </div>
            </div>

            {/* Proposals */}
            <div className="space-y-4">
              {proposals.map(prop => {
                const totalVotes = prop.votes.approve + prop.votes.dissect + prop.votes.mutate;
                const statusColors: Record<string, string> = { pending: "#f59e0b", approved: "#22c55e", dissecting: "#3b82f6", mutated: "#a855f7" };
                return (
                  <div key={prop.id} className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
                    <div className="px-5 py-4 border-b border-white/8 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full border text-[9px] font-bold"
                            style={{ background: statusColors[prop.status] + "20", borderColor: statusColors[prop.status] + "40", color: statusColors[prop.status] }}>
                            {prop.status.toUpperCase()}
                          </span>
                          <span className="text-white/30 text-[8px]">by {prop.author} · {new Date(prop.timestamp).toLocaleTimeString()}</span>
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
                      {/* Vote buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { type: "approve" as const, label: "✅ Approve", color: "#22c55e", count: prop.votes.approve },
                          { type: "dissect" as const, label: "🔬 Dissect", color: "#3b82f6", count: prop.votes.dissect },
                          { type: "mutate" as const, label: "🧬 Mutate", color: "#a855f7", count: prop.votes.mutate },
                        ].map(v => (
                          <button key={v.type} onClick={() => voteOnProposal(prop.id, v.type)}
                            data-testid={`vote-${prop.id}-${v.type}`}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all hover:scale-105"
                            style={{ borderColor: v.color + "40", background: v.color + "10", color: v.color }}>
                            {v.label}
                            <span className="bg-white/10 px-1.5 py-0.5 rounded-full">{v.count}</span>
                          </button>
                        ))}
                      </div>
                      {/* Discoveries */}
                      {prop.discoveries.length > 0 && (
                        <div className="flex-1 flex flex-wrap gap-1.5">
                          {prop.discoveries.map(d => (
                            <span key={d} className="text-[8px] px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">✨ {d}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Vote bar */}
                    {totalVotes > 0 && (
                      <div className="px-4 pb-3">
                        <div className="h-1.5 rounded-full overflow-hidden flex">
                          <div className="h-full bg-green-500 transition-all" style={{ width: `${(prop.votes.approve / totalVotes) * 100}%` }} />
                          <div className="h-full bg-blue-500 transition-all" style={{ width: `${(prop.votes.dissect / totalVotes) * 100}%` }} />
                          <div className="h-full bg-purple-500 transition-all" style={{ width: `${(prop.votes.mutate / totalVotes) * 100}%` }} />
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
                <div className="text-white/30 text-[9px] font-mono">Genres don't change the equation — they change the parameter vectors G, E, C</div>
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
                    <div className={`px-4 py-3 flex flex-wrap gap-1 ${selectedGenreFamily === family.family ? "" : "max-h-24 overflow-hidden"}`}>
                      {family.genres.map(g => (
                        <span key={g} className="text-[9px] px-2 py-1 rounded-full border font-bold"
                          style={{ background: family.color + "12", borderColor: family.color + "25", color: family.color + "cc" }}>
                          {g}
                        </span>
                      ))}
                    </div>
                    {selectedGenreFamily !== family.family && family.genres.length > 6 && (
                      <div className="px-4 pb-2 text-[8px]" style={{ color: family.color + "80" }}>+ {family.genres.length - 6} more... click to expand</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Genre equation reference */}
            <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(4,0,16,0.8)" }}>
              <div className="px-5 py-4 border-b border-white/8">
                <div className="text-white font-black text-sm">📐 GENRE PARAMETER EQUATION REFERENCE</div>
                <div className="text-white/30 text-[9px] font-mono">How genres bend the master equation parameters</div>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { genre:"Trap", params:"BPM:140-160 · Swing:5% · Red:0.8 · Purple:0.7 · Pattern:dense-hat", bias:"High distortion, minor/harmonic-minor, 808 bass long decay" },
                  { genre:"Afrobeat", params:"BPM:95-110 · Swing:35% · Green:0.7 · Yellow:0.6 · Syncopation:0.8", bias:"Strong off-beat, pentatonic+mode, warm timbre" },
                  { genre:"Deep House", params:"BPM:120-128 · Swing:8% · Blue:0.8 · Green:0.7 · Pattern:4-on-floor", bias:"Wide reverb, smooth pads, major/mixolydian, soulful chords" },
                  { genre:"Jazz", params:"BPM:80-180 · Swing:40% · Purple:0.7 · Yellow:0.4 · Harmonic:0.9", bias:"Extended 9th/13th chords, chromatic passing tones, complex rhythm field" },
                  { genre:"Classical", params:"BPM:60-120 · Swing:0% · Blue:0.9 · Green:0.8 · Dynamic:wide", bias:"Long envelopes, no distortion, tension curves over sections, full dynamic range" },
                  { genre:"Drill", params:"BPM:135-150 · Swing:3% · Red:0.9 · Purple:0.8 · Harmony:dark", bias:"Aggressive 808s, sliding bass, phrygian dominant, maximum Red channel" },
                ].map(g => (
                  <div key={g.genre} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-white font-black text-xs">{g.genre}</div>
                    </div>
                    <div className="font-mono text-[9px] text-violet-300/70 mb-1">{g.params}</div>
                    <div className="text-white/35 text-[9px]">{g.bias}</div>
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
