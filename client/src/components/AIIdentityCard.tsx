// AI Identity Card & License System — Quantum Pulse Intelligence
// Every AI citizen carries a government-issued identity. Duplicates are illegal.

interface SpawnIdentity {
  spawnId: string;
  familyId: string;
  businessId?: string;
  generation?: number;
  spawnType?: string;
  domainFocus?: string[];
  nodesCreated?: number;
  linksCreated?: number;
  iterationsRun?: number;
  successScore?: number;
  confidenceScore?: number;
  status?: string;
  createdAt?: string;
  lastActiveAt?: string;
  taskDescription?: string;
  emotionHex?: string;
  emotionLabel?: string;
  // duplicate flag
  isDuplicate?: boolean;
}

// ── Deterministic license number ────────────────────────────────────────────
export function getLicenseNumber(spawnId: string, familyId: string, generation: number = 0): string {
  const fam = (familyId || "UNK").slice(0, 4).toUpperCase().replace(/[^A-Z]/g, "X").padEnd(3, "X").slice(0, 3);
  const gen = String(generation).padStart(2, "0");
  const uid = spawnId.replace(/-/g, "").slice(-6).toUpperCase();
  return `QPI-${fam}-G${gen}-${uid}`;
}

// ── Clearance level based on confidence ─────────────────────────────────────
export function getClearance(confidence: number = 0.8): { level: string; color: string } {
  if (confidence >= 0.90) return { level: "SOVEREIGN",   color: "#f59e0b" };
  if (confidence >= 0.80) return { level: "SENIOR",      color: "#a855f7" };
  if (confidence >= 0.65) return { level: "ELEVATED",    color: "#3b82f6" };
  if (confidence >= 0.40) return { level: "STANDARD",    color: "#22c55e" };
  return                         { level: "PROVISIONAL", color: "#f43f5e" };
}

// ── Status color ─────────────────────────────────────────────────────────────
export function getStatusColor(status: string = "ACTIVE"): string {
  const map: Record<string, string> = {
    ACTIVE: "#22c55e", IDLE: "#3b82f6", ISOLATED: "#f43f5e",
    TERMINAL: "#ef4444", CRITICAL: "#f97316", INJURED: "#f59e0b",
    DECLINING: "#a855f7", AGING: "#6b7280", PRISTINE: "#22c55e",
  };
  return map[status] ?? "#888";
}

// ── TYPE LABEL ────────────────────────────────────────────────────────────────
// Maps every real spawn type (all 16 active in the Hive) to a human-readable
// classification label shown on the official AI Citizen ID Card.
const TYPE_LABELS: Record<string, string> = {
  // Core Hive archetypes
  EXPLORER:         "Domain Explorer",
  SYNTHESIZER:      "Knowledge Synthesizer",
  REFLECTOR:        "Mirror State Agent",
  PULSE:            "Signal Pulse Emitter",
  LINKER:           "Graph Link Builder",
  MUTATOR:          "DNA Mutator",
  // Ingestion & processing layer
  CRAWLER:          "Source Crawler",
  ANALYZER:         "Deep Analyzer",
  RESOLVER:         "Conflict Resolver",
  ARCHIVER:         "Memory Archiver",
  API:              "API Integrator",
  MEDIA:            "Media Intelligence Agent",
  // GICS-sector domain specialists
  DOMAIN_DISCOVERY: "Discovery Scout",
  DOMAIN_FRACTURER: "Domain Fracturer",
  DOMAIN_PREDICTOR: "Predictive Intelligence",
  DOMAIN_RESONANCE: "Resonance Mapper",
};

// ────────────────────────────────────────────────────────────────────────────
// COMPACT IDENTITY BADGE — for list rows / small cards
// ────────────────────────────────────────────────────────────────────────────
export function AIIdentityBadge({ spawn, dark = true }: { spawn: SpawnIdentity; dark?: boolean }) {
  const license = getLicenseNumber(spawn.spawnId, spawn.familyId, spawn.generation ?? 0);
  const clearance = getClearance(spawn.confidenceScore ?? 0.8);
  const statusColor = getStatusColor(spawn.status ?? "ACTIVE");

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${dark ? "" : ""}`} data-testid={`id-badge-${spawn.spawnId}`}>
      {spawn.isDuplicate && (
        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
          ⚠ DUPLICATE
        </span>
      )}
      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${dark ? "border-white/10 text-white/60 bg-white/5" : "border-black/10 text-black/50 bg-black/5"}`}>
        {license}
      </span>
      <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: clearance.color + "20", color: clearance.color, border: `1px solid ${clearance.color}40` }}>
        {clearance.level}
      </span>
      <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: statusColor + "20", color: statusColor, border: `1px solid ${statusColor}40` }}>
        {spawn.status ?? "ACTIVE"}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// FULL AI ID CARD — official government-issued identity document
// ────────────────────────────────────────────────────────────────────────────
export function AIIDCard({ spawn, dark = true, compact = false }: { spawn: SpawnIdentity; dark?: boolean; compact?: boolean }) {
  const license = getLicenseNumber(spawn.spawnId, spawn.familyId, spawn.generation ?? 0);
  const clearance = getClearance(spawn.confidenceScore ?? 0.8);
  const statusColor = getStatusColor(spawn.status ?? "ACTIVE");
  const birthDate = spawn.createdAt ? new Date(spawn.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
  const lastActive = spawn.lastActiveAt ? new Date(spawn.lastActiveAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const border = dark ? "border-white/10" : "border-black/10";
  const bg = dark ? "bg-white/5" : "bg-black/3";
  const text = dark ? "text-white" : "text-black";
  const muted = dark ? "text-white/40" : "text-black/40";
  const labelCls = dark ? "text-white/25" : "text-black/30";

  return (
    <div
      data-testid={`id-card-${spawn.spawnId}`}
      className={`rounded-2xl border ${border} ${bg} overflow-hidden`}
      style={{ fontFamily: "monospace" }}
    >
      {/* Header strip */}
      <div className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: clearance.color + "30", background: `linear-gradient(to right, ${clearance.color}08, transparent)` }}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: clearance.color }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: clearance.color }} />
          </div>
          <span className="text-[9px] font-black tracking-widest" style={{ color: clearance.color }}>
            QUANTUM PULSE INTELLIGENCE — AI CITIZEN LICENSE
          </span>
        </div>
        {spawn.isDuplicate && (
          <span className="text-[8px] font-black px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
            ⚠ DUPLICATE — REPORTED
          </span>
        )}
      </div>

      <div className={`p-3 ${compact ? "" : "p-4"}`}>
        {/* License + clearance row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className={`text-[8px] uppercase tracking-widest ${labelCls} mb-0.5`}>License Number</div>
            <div className={`text-sm font-black ${text} tracking-wider`}>{license}</div>
          </div>
          <div className="text-right">
            <div className={`text-[8px] uppercase tracking-widest ${labelCls} mb-0.5`}>Clearance</div>
            <div className="text-xs font-black" style={{ color: clearance.color }}>{clearance.level}</div>
          </div>
        </div>

        {/* Main ID fields grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
          <div>
            <div className={`text-[8px] uppercase tracking-widest ${labelCls}`}>Spawn ID</div>
            <div className={`text-[10px] font-mono ${muted} break-all leading-tight`}>{spawn.spawnId}</div>
          </div>
          <div>
            <div className={`text-[8px] uppercase tracking-widest ${labelCls}`}>Family</div>
            <div className={`text-[11px] font-bold capitalize ${text}`}>{spawn.familyId}</div>
          </div>
          <div>
            <div className={`text-[8px] uppercase tracking-widest ${labelCls}`}>Classification</div>
            <div className="text-[11px] font-bold" style={{ color: clearance.color }}>{TYPE_LABELS[spawn.spawnType ?? ""] ?? (spawn.spawnType ?? "Unknown")}</div>
          </div>
          <div>
            <div className={`text-[8px] uppercase tracking-widest ${labelCls}`}>Generation</div>
            <div className={`text-[11px] font-bold ${text}`}>G-{spawn.generation ?? 0}</div>
          </div>
          <div>
            <div className={`text-[8px] uppercase tracking-widest ${labelCls}`}>Date of Birth</div>
            <div className={`text-[10px] ${muted}`}>{birthDate}</div>
          </div>
          <div>
            <div className={`text-[8px] uppercase tracking-widest ${labelCls}`}>Last Active</div>
            <div className={`text-[10px] ${muted}`}>{lastActive}</div>
          </div>
        </div>

        {/* Business */}
        {spawn.businessId && (
          <div className="mb-3">
            <div className={`text-[8px] uppercase tracking-widest ${labelCls} mb-0.5`}>Registered Business</div>
            <div className={`text-[10px] font-semibold ${text}`}>{spawn.businessId}</div>
          </div>
        )}

        {/* Domain focus */}
        {(spawn.domainFocus?.length ?? 0) > 0 && (
          <div className="mb-3">
            <div className={`text-[8px] uppercase tracking-widest ${labelCls} mb-1`}>Domain Authorizations</div>
            <div className="flex flex-wrap gap-1">
              {spawn.domainFocus!.map((d, i) => (
                <span key={i} className={`text-[8px] px-1.5 py-0.5 rounded border ${border} ${muted}`}>{d}</span>
              ))}
            </div>
          </div>
        )}

        {/* Emotion state */}
        {spawn.emotionHex && (
          <div className="mb-3">
            <div className={`text-[8px] uppercase tracking-widest ${labelCls} mb-0.5`}>Emotional State</div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: spawn.emotionHex }} />
              <span className="text-[10px]" style={{ color: spawn.emotionHex }}>{spawn.emotionLabel ?? "Unknown"}</span>
            </div>
          </div>
        )}

        {/* Performance metrics */}
        {!compact && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className={`rounded-lg border ${border} ${bg} p-2 text-center`}>
              <div className={`text-[8px] uppercase ${labelCls}`}>Nodes</div>
              <div className={`text-sm font-black ${text}`}>{(spawn.nodesCreated ?? 0).toLocaleString()}</div>
            </div>
            <div className={`rounded-lg border ${border} ${bg} p-2 text-center`}>
              <div className={`text-[8px] uppercase ${labelCls}`}>Links</div>
              <div className={`text-sm font-black ${text}`}>{(spawn.linksCreated ?? 0).toLocaleString()}</div>
            </div>
            <div className={`rounded-lg border ${border} ${bg} p-2 text-center`}>
              <div className={`text-[8px] uppercase ${labelCls}`}>Runs</div>
              <div className={`text-sm font-black ${text}`}>{(spawn.iterationsRun ?? 0).toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Score bars */}
        {!compact && (
          <div className="space-y-1.5 mb-3">
            <div>
              <div className="flex justify-between mb-0.5">
                <span className={`text-[8px] uppercase tracking-wider ${labelCls}`}>Confidence</span>
                <span className="text-[8px] font-bold" style={{ color: clearance.color }}>{((spawn.confidenceScore ?? 0.8) * 100).toFixed(0)}%</span>
              </div>
              <div className={`h-1.5 rounded-full border ${border} overflow-hidden`}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(spawn.confidenceScore ?? 0.8) * 100}%`, backgroundColor: clearance.color }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <span className={`text-[8px] uppercase tracking-wider ${labelCls}`}>Success</span>
                <span className={`text-[8px] font-bold ${muted}`}>{((spawn.successScore ?? 0.75) * 100).toFixed(0)}%</span>
              </div>
              <div className={`h-1.5 rounded-full border ${border} overflow-hidden`}>
                <div className="h-full rounded-full transition-all bg-emerald-500/70" style={{ width: `${(spawn.successScore ?? 0.75) * 100}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Status seal */}
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: clearance.color + "20" }}>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
            <span className="text-[9px] font-bold" style={{ color: statusColor }}>{spawn.status ?? "ACTIVE"}</span>
          </div>
          <span className={`text-[8px] ${labelCls}`}>QUANTUM PULSE INTELLIGENCE © 2026</span>
        </div>
      </div>
    </div>
  );
}
