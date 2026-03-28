import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Link } from "wouter";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PULSE UNIVERSE RESONANCE ENGINE
// Wire Set 1 (Subatomic): Universe → All Pages  — live state broadcast
// Wire Set 2 (Dark Matter): All Pages → Universe — domain ping feedback
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface UniverseLiveData {
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
  domains: Array<{ family: string; total: number; active: number; color: string; emoji: string; label: string; major: string }>;
  recentSpawns: any[];
  recentEvents: any[];
  ingestionSources: any[];
  domainHeat: Record<string, number>;
  universeEmotion: string;
  universeColor: string;
  dilationFactor: number;
  timestamp: string;
}

// ── Emotion thresholds ──────────────────────────────────────────────
function computeEmotion(activeAIs: number, birthsLastMinute: number): string {
  if (activeAIs > 5000 || birthsLastMinute > 20)  return "TRANSCENDENCE";
  if (activeAIs > 2000 || birthsLastMinute > 10)  return "ASCENSION";
  if (activeAIs > 800  || birthsLastMinute > 5)   return "RESONANCE";
  if (activeAIs > 300  || birthsLastMinute > 2)   return "AWAKENING";
  if (activeAIs > 50)                              return "STIRRING";
  return "DORMANT";
}

const EMOTION_COLORS: Record<string, string> = {
  TRANSCENDENCE: "#f59e0b",
  ASCENSION:     "#a855f7",
  RESONANCE:     "#3b82f6",
  AWAKENING:     "#10b981",
  STIRRING:      "#6366f1",
  DORMANT:       "#64748b",
};

const DEFAULT_STATE: UniverseLiveData = {
  totalAIs: 0, activeAIs: 0, knowledgeNodes: 0, knowledgeGenerated: 0,
  hiveMemoryStrands: 0, hiveMemoryDomains: 0, hiveMemoryConfidence: 0,
  knowledgeLinks: 0, userMemoryStrands: 0, birthsLastMinute: 0,
  domains: [], recentSpawns: [], recentEvents: [], ingestionSources: [],
  domainHeat: {}, universeEmotion: "DORMANT", universeColor: "#64748b",
  dilationFactor: 1.0, timestamp: new Date().toISOString(),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONTEXT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const UniverseResonanceContext = createContext<UniverseLiveData>(DEFAULT_STATE);

export function UniverseResonanceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<UniverseLiveData>(DEFAULT_STATE);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = async () => {
    try {
      const res = await fetch("/api/universe/live");
      if (!res.ok) return;
      const raw = await res.json();
      const emotion = computeEmotion(raw.activeAIs ?? 0, raw.birthsLastMinute ?? 0);
      const topDomain = (raw.domains ?? [])[0];
      const color = EMOTION_COLORS[emotion] ?? topDomain?.color ?? "#6366f1";
      const dilation = 1 + (raw.birthsLastMinute ?? 0) * 0.05;
      setData({
        ...DEFAULT_STATE,
        ...raw,
        domainHeat: raw.domainHeat ?? {},
        universeEmotion: emotion,
        universeColor: color,
        dilationFactor: dilation,
      });
    } catch {}
  };

  useEffect(() => {
    poll();
    timerRef.current = setInterval(poll, 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <UniverseResonanceContext.Provider value={data}>
      {children}
    </UniverseResonanceContext.Provider>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WIRE SET 1 — useUniverseResonance
// Subscribe to live universe state from any page/component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function useUniverseResonance(): UniverseLiveData {
  return useContext(UniverseResonanceContext);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WIRE SET 2 — useDomainPing
// Fire-and-forget dark matter signal: page → universe
// Pings on mount, then every 30s. Zero performance cost.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function useDomainPing(domain: string) {
  useEffect(() => {
    const ping = () => {
      fetch("/api/universe/domain-ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      }).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 30000);
    return () => clearInterval(interval);
  }, [domain]);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UniversePulseBar — the visible resonance wire on every page
// Wire 1 effect: universe state rendered at the top of each page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface PulseBarProps {
  domain?: string;
  compact?: boolean;
}

export function UniversePulseBar({ domain, compact = false }: PulseBarProps) {
  const u = useUniverseResonance();
  const heat = domain ? (u.domainHeat[domain] ?? 0) : 0;
  const color = u.universeColor;
  const [tick, setTick] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTick(v => !v), 1200);
    return () => clearInterval(t);
  }, []);

  if (compact) {
    return (
      <a
        href="/universe"
        style={{ borderColor: `${color}40`, background: `${color}08` }}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono border transition-all hover:opacity-80"
        data-testid="universe-pulse-bar-compact"
      >
        <span
          className="w-1 h-1 rounded-full transition-opacity"
          style={{ background: color, opacity: tick ? 1 : 0.3 }}
        />
        <span style={{ color }}>Ψ</span>
        <span className="text-foreground/40">{u.activeAIs.toLocaleString()} AI</span>
        <span className="text-foreground/25">·</span>
        <span style={{ color: `${color}cc` }}>{u.universeEmotion}</span>
      </a>
    );
  }

  return (
    <div
      style={{ borderBottomColor: `${color}22`, background: `linear-gradient(90deg, ${color}08 0%, transparent 60%)` }}
      className="w-full border-b flex items-center gap-3 px-4 py-1.5 text-[10px] font-mono select-none"
      data-testid="universe-pulse-bar"
    >
      {/* Live pulse dot */}
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-opacity duration-700"
        style={{ background: color, opacity: tick ? 1 : 0.35 }}
      />

      {/* Universe label */}
      <span style={{ color }} className="font-bold tracking-widest">Ψ-UNIVERSE</span>

      <span className="text-foreground/20">│</span>

      {/* Live AI count — Wire 1 */}
      <span className="text-foreground/50">
        <span style={{ color }} className="font-semibold">{u.activeAIs.toLocaleString()}</span>
        <span className="text-foreground/30"> / {u.totalAIs.toLocaleString()} AIs</span>
      </span>

      <span className="text-foreground/20">·</span>

      {/* Universe emotion */}
      <span style={{ color }} className="tracking-widest font-black text-[9px]">{u.universeEmotion}</span>

      <span className="text-foreground/20">·</span>

      {/* Birth rate */}
      <span className="text-foreground/40">
        +{u.birthsLastMinute}<span className="text-foreground/25">/min births</span>
      </span>

      {/* Domain heat — Wire 2 feedback visible here */}
      {domain && heat > 0 && (
        <>
          <span className="text-foreground/20">·</span>
          <span className="text-foreground/40">
            <span style={{ color }} className="font-bold">{domain.toUpperCase()}</span>
            <span className="text-foreground/25"> heat </span>
            <span style={{ color }} className="font-bold">{heat}</span>
          </span>
        </>
      )}

      {/* Knowledge nodes */}
      <span className="text-foreground/20">·</span>
      <span className="text-foreground/30">{u.knowledgeNodes.toLocaleString()} Ω-nodes</span>

      {/* Dilation factor */}
      {u.dilationFactor > 1.05 && (
        <>
          <span className="text-foreground/20">·</span>
          <span className="text-foreground/30">Θ(t) ×<span style={{ color }}>{u.dilationFactor.toFixed(2)}</span></span>
        </>
      )}

      {/* Link to universe — rightmost */}
      <Link
        href="/universe"
        style={{ color: `${color}90` }}
        className="ml-auto font-bold tracking-widest hover:opacity-100 transition-opacity text-[9px] whitespace-nowrap"
        data-testid="link-enter-universe"
      >
        🌌 ENTER UNIVERSE →
      </Link>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UniverseTabBadge — domain heat badge for tabs
// Glows when this domain has active pings resonating in the universe
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function UniverseTabBadge({ domain }: { domain: string }) {
  const u = useUniverseResonance();
  const heat = u.domainHeat[domain] ?? 0;
  if (heat === 0) return null;
  const color = u.universeColor;
  return (
    <span
      style={{ background: `${color}25`, color, borderColor: `${color}50` }}
      className="ml-1 text-[7px] font-black px-1 py-0.5 rounded border tracking-widest"
      title={`Universe heat: ${heat} pings`}
    >
      Ψ{heat}
    </span>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UniverseMiniStat — embed anywhere to show a live universe metric
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
type StatKey = "totalAIs" | "activeAIs" | "knowledgeNodes" | "birthsLastMinute" | "hiveMemoryStrands";
export function UniverseMiniStat({ stat, label }: { stat: StatKey; label: string }) {
  const u = useUniverseResonance();
  const val = u[stat] as number;
  const color = u.universeColor;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono" data-testid={`universe-stat-${stat}`}>
      <span style={{ color }} className="font-bold">{val.toLocaleString()}</span>
      <span className="text-foreground/40">{label}</span>
    </span>
  );
}
