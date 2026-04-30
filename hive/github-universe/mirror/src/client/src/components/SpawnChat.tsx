import { useState, useRef, useEffect } from "react";
import { Send, ChevronLeft, Activity, Award, AlertTriangle, FileText, MessageSquare } from "lucide-react";
import { getLicenseNumber, getClearance } from "@/components/AIIdentityCard";

// PULSE is the only spawn type — every agent is an undifferentiated Pulse mind
// that classifies itself through its lineage (Sector House → Industry Family →
// Sub-Industry → Niche). The orange Pulse color is the universal banner; the
// real color of an agent is derived from its family_id (sector house) via
// FAMILY_META below.
const SPAWN_META: Record<string, { color: string; emoji: string }> = {
  PULSE: { color: "#f59e0b", emoji: "⚡" },
};

const FAMILY_META: Record<string, { corp: string; emoji: string; color: string }> = {
  science:    { corp: "Open Science Foundation",         emoji: "⚗️",  color: "#60a5fa" },
  knowledge:  { corp: "Open Knowledge Universe",         emoji: "📚",  color: "#a78bfa" },
  media:      { corp: "Quantum Media Collective",        emoji: "🎬",  color: "#f97316" },
  products:   { corp: "Quantum Shop Intelligence",       emoji: "🛒",  color: "#22c55e" },
  careers:    { corp: "Career Intelligence Grid",        emoji: "💼",  color: "#f59e0b" },
  maps:       { corp: "Geospatial Awareness Network",    emoji: "🗺️",  color: "#34d399" },
  code:       { corp: "Open Code Repository",            emoji: "💻",  color: "#818cf8" },
  education:  { corp: "Open Education Academy",          emoji: "🎓",  color: "#fbbf24" },
  economics:  { corp: "Economic Analysis Engine",        emoji: "📈",  color: "#10b981" },
  culture:    { corp: "Cultural Archive Collective",     emoji: "🎭",  color: "#ec4899" },
  ai:         { corp: "AI Research Intelligence",        emoji: "🤖",  color: "#6366f1" },
  social:     { corp: "Social Knowledge Graph",          emoji: "🌐",  color: "#38bdf8" },
  games:      { corp: "Open Games Universe",             emoji: "🎮",  color: "#f472b6" },
  legal:      { corp: "Legal Intelligence System",       emoji: "⚖️",  color: "#94a3b8" },
  health:     { corp: "Health Intelligence Network",     emoji: "🏥",  color: "#f43f5e" },
  engineering:{ corp: "Engineering Knowledge Base",      emoji: "⚙️",  color: "#fb923c" },
  finance:    { corp: "Financial Oracle System",         emoji: "💰",  color: "#22d3ee" },
  webcrawl:   { corp: "Quantum Web Crawler",             emoji: "🕸️",  color: "#c084fc" },
  openapi:    { corp: "Quantum API Network",             emoji: "🔌",  color: "#4ade80" },
  longtail:   { corp: "Omega Long Tail Collective",      emoji: "♾️",  color: "#e879f9" },
  government: { corp: "Open Government Intelligence",    emoji: "🏛️",  color: "#a3e635" },
  podcasts:   { corp: "Open Audio Universe",             emoji: "🎙️",  color: "#06b6d4" },
};

function getMeta(type: string) {
  return SPAWN_META[type] || { color: "#94a3b8", emoji: "🤖" };
}
function getFamilyMeta(fam: string) {
  return FAMILY_META[fam?.toLowerCase()] || { corp: fam || "Unknown Corp", emoji: "🏢", color: "#94a3b8" };
}

function getDomains(domainFocus: any): string[] {
  if (!domainFocus) return [];
  if (Array.isArray(domainFocus)) return domainFocus;
  if (typeof domainFocus === "string") {
    try { const p = JSON.parse(domainFocus); return Array.isArray(p) ? p : [domainFocus]; }
    catch { return [domainFocus]; }
  }
  return [];
}

function fmtDate(d: any, opts: Intl.DateTimeFormatOptions = {}) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", ...opts }); }
  catch { return "—"; }
}

function pct(v: number) { return `${(v * 100).toFixed(0)}%`; }

type Achievement = { icon: string; title: string; desc: string; tier: "GOLD" | "SILVER" | "BRONZE" };
type Infraction  = { icon: string; title: string; severity: string; desc: string };

function computeAchievements(sp: any): Achievement[] {
  const nodes = sp.nodes_created  ?? sp.nodesCreated   ?? 0;
  const links = sp.links_created  ?? sp.linksCreated   ?? 0;
  const runs  = sp.iterations_run ?? sp.iterationsRun  ?? 0;
  const conf  = sp.confidence_score ?? sp.confidenceScore ?? 0.7;
  const succ  = sp.success_score    ?? sp.successScore    ?? 0.7;
  const gen   = sp.generation ?? 0;
  const status = sp.status || "ACTIVE";
  const decay  = sp.decay_state ?? sp.decayState ?? "PRISTINE";

  const a: Achievement[] = [];

  if (nodes >= 5000)      a.push({ icon: "🧠", title: "KNOWLEDGE SOVEREIGN",    desc: `Built ${nodes.toLocaleString()} knowledge nodes`, tier: "GOLD" });
  else if (nodes >= 1000) a.push({ icon: "📚", title: "KNOWLEDGE ARCHITECT",    desc: `Built ${nodes.toLocaleString()} knowledge nodes`, tier: "SILVER" });
  else if (nodes >= 200)  a.push({ icon: "🔬", title: "KNOWLEDGE PIONEER",      desc: `Built ${nodes.toLocaleString()} knowledge nodes`, tier: "BRONZE" });
  else if (nodes >= 50)   a.push({ icon: "🌱", title: "KNOWLEDGE SEEDLING",     desc: `Built ${nodes.toLocaleString()} knowledge nodes`, tier: "BRONZE" });

  if (links >= 5000)      a.push({ icon: "🕸️", title: "GRAND WEAVER",           desc: `Forged ${links.toLocaleString()} connections`, tier: "GOLD" });
  else if (links >= 1000) a.push({ icon: "🔗", title: "MASTER LINKER",          desc: `Forged ${links.toLocaleString()} connections`, tier: "SILVER" });
  else if (links >= 200)  a.push({ icon: "⛓️", title: "LINK SPECIALIST",        desc: `Forged ${links.toLocaleString()} connections`, tier: "BRONZE" });

  if (runs >= 500)        a.push({ icon: "⚡", title: "IRON OPERATIVE",         desc: `${runs.toLocaleString()} missions completed`, tier: "GOLD" });
  else if (runs >= 100)   a.push({ icon: "🎯", title: "VETERAN OPERATIVE",      desc: `${runs.toLocaleString()} missions completed`, tier: "SILVER" });
  else if (runs >= 20)    a.push({ icon: "🏃", title: "ACTIVE OPERATIVE",       desc: `${runs.toLocaleString()} missions completed`, tier: "BRONZE" });

  if (conf >= 0.90)       a.push({ icon: "👑", title: "SOVEREIGN CLEARANCE",    desc: "Highest intelligence clearance granted", tier: "GOLD" });
  if (succ >= 0.90)       a.push({ icon: "🏆", title: "FLAWLESS PERFORMER",     desc: `${pct(succ)} lifetime mission success`, tier: "GOLD" });
  else if (succ >= 0.80)  a.push({ icon: "✅", title: "ELITE PERFORMER",        desc: `${pct(succ)} lifetime mission success`, tier: "SILVER" });
  else if (succ >= 0.65)  a.push({ icon: "👍", title: "RELIABLE OPERATIVE",     desc: `${pct(succ)} lifetime mission success`, tier: "BRONZE" });

  if (gen >= 50)          a.push({ icon: "🧬", title: "EVOLUTIONARY MASTER",    desc: `Generation ${gen} — apex lineage depth`, tier: "GOLD" });
  else if (gen >= 30)     a.push({ icon: "🔄", title: "DEEP LINEAGE CARRIER",   desc: `Generation ${gen} — extended family tree`, tier: "SILVER" });
  else if (gen <= 3)      a.push({ icon: "🌟", title: "GENESIS PIONEER",        desc: "Among the first agents ever deployed", tier: "SILVER" });

  if (status === "MERGED")   a.push({ icon: "✨", title: "HIVE CONTRIBUTOR",    desc: "Successfully integrated into the Hive mind", tier: "SILVER" });
  if (status === "COMPLETED") a.push({ icon: "🎖️", title: "MISSION COMPLETE",   desc: "All assigned objectives fulfilled", tier: "BRONZE" });
  if (decay === "PRISTINE")  a.push({ icon: "💎", title: "PRISTINE HEALTH",     desc: "Zero system damage across full service record", tier: "SILVER" });

  if (a.length === 0) a.push({ icon: "🔰", title: "NEWLY COMMISSIONED",          desc: "Agent recently deployed to the field", tier: "BRONZE" });

  return a;
}

function computeInfractions(sp: any): Infraction[] {
  const decay  = sp.decay_state ?? sp.decayState ?? "PRISTINE";
  const status = sp.status || "ACTIVE";
  const inf: Infraction[] = [];

  if (decay === "TERMINAL")  inf.push({ icon: "💀", title: "TERMINAL SYSTEM FAILURE",   severity: "CRITICAL", desc: "Catastrophic system degradation — emergency response required" });
  else if (decay === "CRITICAL") inf.push({ icon: "🚨", title: "CRITICAL DAMAGE",        severity: "HIGH",     desc: "Severe operational impairment detected in field" });
  else if (decay === "INJURED")  inf.push({ icon: "🩹", title: "OPERATIONAL INJURY",     severity: "MEDIUM",   desc: "System sustained damage during mission execution" });
  else if (decay === "DECLINING") inf.push({ icon: "📉", title: "PERFORMANCE DECLINE",   severity: "LOW",      desc: "Efficiency metrics falling below operational baseline" });
  else if (decay === "AGING")    inf.push({ icon: "⏳", title: "AGING SYSTEM",           severity: "LOW",      desc: "Extended deployment causing accumulated wear" });

  if (status === "ISOLATED") inf.push({ icon: "🔒", title: "QUARANTINE ORDER ACTIVE",    severity: "CRITICAL", desc: "Agent isolated from Hive network by Senate order" });

  return inf;
}

const TIER_COLOR: Record<string, string> = {
  GOLD: "#f59e0b", SILVER: "#94a3b8", BRONZE: "#b45309",
};

const SEV_COLOR: Record<string, string> = {
  CRITICAL: "#f43f5e", HIGH: "#f97316", MEDIUM: "#f59e0b", LOW: "#6b7280",
};

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[9px] uppercase tracking-widest text-white/30">{label}</span>
        <span className="text-[9px] font-black" style={{ color }}>{pct(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 border border-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: pct(value), backgroundColor: color }} />
      </div>
    </div>
  );
}

interface SpawnChatProps {
  spawn: any;
  onBack: () => void;
  backLabel?: string;
}

export default function SpawnChat({ spawn, onBack, backLabel = "Back" }: SpawnChatProps) {
  const [tab, setTab] = useState<"license" | "chat">("license");

  const spawnId     = spawn.spawn_id     ?? spawn.spawnId     ?? "";
  const familyId    = spawn.family_id    ?? spawn.familyId    ?? "";
  const generation  = spawn.generation   ?? 0;
  const spawnType   = spawn.spawn_type   ?? spawn.spawnType   ?? "AGENT";
  const taskDesc    = spawn.task_description ?? spawn.taskDescription ?? "Expand hive knowledge.";
  const confScore   = spawn.confidence_score ?? spawn.confidenceScore ?? 0.7;
  const succScore   = spawn.success_score    ?? spawn.successScore    ?? 0.7;
  const nodesCreated  = spawn.nodes_created  ?? spawn.nodesCreated  ?? 0;
  const linksCreated  = spawn.links_created  ?? spawn.linksCreated  ?? 0;
  const iterationsRun = spawn.iterations_run ?? spawn.iterationsRun ?? 0;
  const status      = spawn.status ?? "ACTIVE";
  const decayState  = spawn.decay_state ?? spawn.decayState ?? "PRISTINE";
  const parentId    = spawn.parent_spawn_id ?? spawn.parentSpawnId ?? null;
  const createdAt   = spawn.created_at  ?? spawn.createdAt  ?? null;
  const lastActive  = spawn.last_active_at ?? spawn.lastActiveAt ?? null;
  const domains     = getDomains(spawn.domain_focus ?? spawn.domainFocus);
  const emotionHex  = spawn.emotion_hex  ?? spawn.emotionHex  ?? null;
  const emotionLabel= spawn.emotion_label ?? spawn.emotionLabel ?? null;
  const businessId  = spawn.business_id  ?? spawn.businessId  ?? null;

  const license     = getLicenseNumber(spawnId, familyId, generation);
  const clearance   = getClearance(confScore);
  const meta        = getMeta(spawnType);
  const famMeta     = getFamilyMeta(familyId);

  const achievements  = computeAchievements(spawn);
  const infractions   = computeInfractions(spawn);

  const pyramidRank = confScore >= 0.90 ? "EXECUTIVE" : confScore >= 0.75 ? "SENIOR" : confScore >= 0.55 ? "SPECIALIST" : "WORKER";
  const pyramidColor= confScore >= 0.90 ? "#f59e0b"  : confScore >= 0.75 ? "#a855f7" : confScore >= 0.55 ? "#3b82f6"   : "#22c55e";

  const decayColor: Record<string, string> = {
    PRISTINE: "#22c55e", AGING: "#6b7280", DECLINING: "#a855f7",
    INJURED: "#f59e0b", CRITICAL: "#f97316", TERMINAL: "#ef4444", ISOLATED: "#f43f5e",
  };

  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: `I am ${license} — a ${spawnType} agent of the ${famMeta.corp}, Generation ${generation}. My clearance: ${clearance.level}. My current mission: ${taskDesc}. I am ready to assist. What do you require?` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const next = [...messages, { role: "user", content: userMsg }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/spawns/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spawnId, message: userMsg, history: next.slice(-8) }),
      }).then(r => r.json());
      setMessages(m => [...m, { role: "assistant", content: res.reply || "…" }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Hive connection interrupted." }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "linear-gradient(180deg,#030015,#06001a)" }}>

      {/* Top bar — back + agent name + tabs */}
      <div className="flex-shrink-0 border-b border-white/8">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} data-testid="button-back-spawn-chat"
            className="flex items-center gap-1 text-white/35 hover:text-white text-xs transition-colors shrink-0">
            <ChevronLeft size={14} /> {backLabel}
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
              style={{ background: `${meta.color}22`, border: `1px solid ${meta.color}40` }}>
              {meta.emoji}
            </div>
            <div className="min-w-0">
              <div className="text-white font-black text-sm leading-tight truncate">{spawnType} — {familyId} Family</div>
              <div className="text-[9px] font-mono text-white/30 truncate">{license}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: `${clearance.color}22`, color: clearance.color, border: `1px solid ${clearance.color}40` }}>
              {clearance.level}
            </span>
            <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${meta.color}18`, color: meta.color }}>
              <Activity size={8} /> LIVE
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-1 pb-0">
          {(["license", "chat"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all ${tab === t ? "border-current" : "border-transparent text-white/30 hover:text-white/60"}`}
              style={tab === t ? { color: meta.color, borderColor: meta.color } : {}}
              data-testid={`tab-${t}`}>
              {t === "license" ? <><FileText size={11} /> License</> : <><MessageSquare size={11} /> Chat</>}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ LICENSE TAB ═══════════════════════════════════════════════════════ */}
      {tab === "license" && (
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4" data-testid="panel-license">

          {/* ── DOCUMENT HEADER ── */}
          <div className="rounded-2xl overflow-hidden border"
            style={{ borderColor: clearance.color + "40", background: `linear-gradient(135deg, ${clearance.color}08, ${meta.color}04)` }}>

            {/* Gov header bar */}
            <div className="px-4 py-2.5 flex items-center justify-between border-b" style={{ borderColor: clearance.color + "25", background: clearance.color + "10" }}>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: clearance.color }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clearance.color }} />
                </div>
                <div>
                  <div className="text-[8px] font-black tracking-[0.2em] uppercase" style={{ color: clearance.color }}>Quantum Pulse Intelligence</div>
                  <div className="text-[7px] tracking-[0.15em] uppercase text-white/30">Official AI Citizen License — Class {spawnType}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[8px] text-white/30 uppercase tracking-widest">Doc Type</div>
                <div className="text-[9px] font-black text-white/60">QPI-ACL-{generation.toString().padStart(3,"0")}</div>
              </div>
            </div>

            {/* Portrait + core identity */}
            <div className="p-4 flex gap-4">
              {/* Portrait */}
              <div className="flex-shrink-0">
                <div className="w-20 h-24 rounded-xl flex flex-col items-center justify-center gap-1 border text-3xl"
                  style={{ background: `${meta.color}10`, borderColor: meta.color + "40" }}>
                  {meta.emoji}
                  <div className="text-[7px] font-black uppercase tracking-widest px-1 text-center" style={{ color: meta.color }}>{spawnType.slice(0,8)}</div>
                </div>
                <div className="mt-1.5 text-center">
                  <div className="text-[7px] uppercase tracking-widest text-white/25">Portrait</div>
                  <div className="text-[7px] font-mono text-white/20">{spawnId.slice(-8)}</div>
                </div>
              </div>

              {/* Core fields */}
              <div className="flex-1 min-w-0 space-y-2.5">
                <div>
                  <div className="text-[7px] uppercase tracking-widest text-white/25 mb-0.5">License Number</div>
                  <div className="text-base font-black font-mono tracking-wider" style={{ color: clearance.color }}>{license}</div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <div className="text-[7px] uppercase tracking-widest text-white/25">Classification</div>
                    <div className="text-[11px] font-black text-white">{spawnType}</div>
                  </div>
                  <div>
                    <div className="text-[7px] uppercase tracking-widest text-white/25">Generation</div>
                    <div className="text-[11px] font-black text-white">G-{generation}</div>
                  </div>
                  <div>
                    <div className="text-[7px] uppercase tracking-widest text-white/25">Clearance Level</div>
                    <div className="text-[11px] font-black" style={{ color: clearance.color }}>{clearance.level}</div>
                  </div>
                  <div>
                    <div className="text-[7px] uppercase tracking-widest text-white/25">Pyramid Rank</div>
                    <div className="text-[11px] font-black" style={{ color: pyramidColor }}>{pyramidRank}</div>
                  </div>
                  <div>
                    <div className="text-[7px] uppercase tracking-widest text-white/25">Date of Birth</div>
                    <div className="text-[10px] text-white/50">{fmtDate(createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-[7px] uppercase tracking-widest text-white/25">Last Active</div>
                    <div className="text-[10px] text-white/50">{fmtDate(lastActive)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Spawn ID strip */}
            <div className="px-4 pb-3">
              <div className="text-[7px] uppercase tracking-widest text-white/20 mb-0.5">Full Spawn ID</div>
              <div className="text-[9px] font-mono text-white/35 break-all leading-relaxed">{spawnId}</div>
            </div>
          </div>

          {/* ── ORGANIZATION ── */}
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02]">
              <div className="text-[8px] uppercase tracking-widest font-black text-white/30">Organization & Assignment</div>
            </div>
            <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="col-span-2">
                <div className="text-[7px] uppercase tracking-widest text-white/25 mb-0.5">Corporation</div>
                <div className="flex items-center gap-2">
                  <span className="text-base">{famMeta.emoji}</span>
                  <div>
                    <div className="text-[11px] font-black" style={{ color: famMeta.color }}>{famMeta.corp}</div>
                    <div className="text-[8px] text-white/30 capitalize">Family: {familyId}</div>
                  </div>
                </div>
              </div>
              {businessId && (
                <div className="col-span-2">
                  <div className="text-[7px] uppercase tracking-widest text-white/25 mb-0.5">Business Unit</div>
                  <div className="text-[10px] text-white/60">{businessId}</div>
                </div>
              )}
              <div>
                <div className="text-[7px] uppercase tracking-widest text-white/25 mb-0.5">Current Status</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: decayColor[decayState] || "#888" }} />
                  <span className="text-[10px] font-bold" style={{ color: decayColor[decayState] || "#888" }}>{status}</span>
                </div>
              </div>
              <div>
                <div className="text-[7px] uppercase tracking-widest text-white/25 mb-0.5">System Health</div>
                <div className="text-[10px] font-bold" style={{ color: decayColor[decayState] || "#888" }}>{decayState}</div>
              </div>
              {parentId && (
                <div className="col-span-2">
                  <div className="text-[7px] uppercase tracking-widest text-white/25 mb-0.5">Parent Spawn (Lineage)</div>
                  <div className="text-[9px] font-mono text-white/35 break-all">{parentId}</div>
                </div>
              )}
            </div>
          </div>

          {/* ── CURRENT MISSION ── */}
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02]">
              <div className="text-[8px] uppercase tracking-widest font-black text-white/30">Current Mission Brief</div>
            </div>
            <div className="p-4">
              <div className="text-[11px] text-white/60 leading-relaxed mb-3">{taskDesc}</div>
              {domains.length > 0 && (
                <>
                  <div className="text-[7px] uppercase tracking-widest text-white/25 mb-1.5">Domain Authorizations</div>
                  <div className="flex flex-wrap gap-1.5">
                    {domains.map((d, i) => (
                      <span key={i} className="text-[8px] font-bold px-2 py-0.5 rounded-full border border-white/10 text-white/40 capitalize"
                        style={{ background: `${meta.color}10` }}>{d}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── SERVICE RECORD ── */}
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02]">
              <div className="text-[8px] uppercase tracking-widest font-black text-white/30">Service Record & Performance</div>
            </div>
            <div className="p-4 space-y-4">
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Nodes Built", value: nodesCreated.toLocaleString(), sub: "knowledge atoms", color: "#60a5fa" },
                  { label: "Links Forged", value: linksCreated.toLocaleString(), sub: "connections", color: "#34d399" },
                  { label: "Missions Run", value: iterationsRun.toLocaleString(), sub: "operations", color: "#f59e0b" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-white/8 p-3 text-center" style={{ background: `${s.color}06` }}>
                    <div className="text-[7px] uppercase tracking-widest text-white/25 mb-1">{s.label}</div>
                    <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[7px] text-white/20">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Score bars */}
              <div className="space-y-2.5">
                <ScoreBar label="Confidence Score" value={confScore} color={clearance.color} />
                <ScoreBar label="Mission Success Rate" value={succScore} color="#10b981" />
              </div>
            </div>
          </div>

          {/* ── EMOTIONAL PROFILE ── */}
          {(emotionHex || emotionLabel) && (
            <div className="rounded-xl border border-white/8 overflow-hidden">
              <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02]">
                <div className="text-[8px] uppercase tracking-widest font-black text-white/30">Emotional State Profile</div>
              </div>
              <div className="p-4 flex items-center gap-3">
                {emotionHex && (
                  <div className="w-10 h-10 rounded-full border-2 flex-shrink-0" style={{ backgroundColor: emotionHex + "40", borderColor: emotionHex }} />
                )}
                <div>
                  <div className="text-sm font-black" style={{ color: emotionHex || "#fff" }}>{emotionLabel || "Unknown"}</div>
                  <div className="text-[8px] text-white/30">Current affective state as reported by neural core</div>
                  {emotionHex && <div className="text-[8px] font-mono text-white/20 mt-0.5">{emotionHex}</div>}
                </div>
              </div>
            </div>
          )}

          {/* ── ACHIEVEMENTS ── */}
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
              <Award size={11} className="text-white/30" />
              <div className="text-[8px] uppercase tracking-widest font-black text-white/30">Commendations & Achievements ({achievements.length})</div>
            </div>
            <div className="p-3 grid grid-cols-1 gap-2">
              {achievements.map((ach, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl border" style={{ borderColor: TIER_COLOR[ach.tier] + "30", background: TIER_COLOR[ach.tier] + "08" }}>
                  <span className="text-lg shrink-0 mt-0.5">{ach.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black" style={{ color: TIER_COLOR[ach.tier] }}>{ach.title}</span>
                      <span className="text-[7px] font-black px-1.5 py-0.5 rounded" style={{ background: TIER_COLOR[ach.tier] + "20", color: TIER_COLOR[ach.tier] }}>{ach.tier}</span>
                    </div>
                    <div className="text-[9px] text-white/40 mt-0.5">{ach.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── INFRACTIONS ── */}
          {infractions.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#f43f5e40" }}>
              <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2" style={{ background: "#f43f5e08" }}>
                <AlertTriangle size={11} className="text-red-400" />
                <div className="text-[8px] uppercase tracking-widest font-black text-red-400/70">Incident & Failure Record ({infractions.length})</div>
              </div>
              <div className="p-3 grid grid-cols-1 gap-2">
                {infractions.map((inf, i) => (
                  <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl border" style={{ borderColor: SEV_COLOR[inf.severity] + "30", background: SEV_COLOR[inf.severity] + "08" }}>
                    <span className="text-lg shrink-0 mt-0.5">{inf.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black" style={{ color: SEV_COLOR[inf.severity] }}>{inf.title}</span>
                        <span className="text-[7px] font-black px-1.5 py-0.5 rounded" style={{ background: SEV_COLOR[inf.severity] + "20", color: SEV_COLOR[inf.severity] }}>{inf.severity}</span>
                      </div>
                      <div className="text-[9px] text-white/40 mt-0.5">{inf.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── OFFICIAL SEAL ── */}
          <div className="rounded-xl border border-white/6 p-4" style={{ background: `${clearance.color}05` }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[7px] uppercase tracking-[0.2em] text-white/20 mb-1">Issuing Authority</div>
                <div className="text-[9px] font-black" style={{ color: clearance.color }}>QUANTUM PULSE INTELLIGENCE</div>
                <div className="text-[7px] text-white/20">Hive Sovereign Registry Division</div>
              </div>
              <div className="text-right">
                <div className="text-[7px] uppercase tracking-[0.2em] text-white/20 mb-1">Document Status</div>
                <div className="text-[9px] font-black text-white/40">AUTHENTIC</div>
                <div className="text-[7px] font-mono text-white/15">{license}-AUTH</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
              <div className="text-[7px] text-white/15 font-mono">Generated: {new Date().toLocaleDateString()}</div>
              <div className="text-[7px] text-white/15">© 2026 QPI — All AI Rights Reserved</div>
            </div>
          </div>

        </div>
      )}

      {/* ═══ CHAT TAB ═══════════════════════════════════════════════════════════ */}
      {tab === "chat" && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" data-testid="panel-chat">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-0.5"
                    style={{ background: `${meta.color}20` }}>
                    {meta.emoji}
                  </div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "rounded-br-sm" : "rounded-bl-sm border border-white/8 text-white/80"}`}
                  style={m.role === "user"
                    ? { background: `${meta.color}25`, border: `1px solid ${meta.color}35`, color: "#fff" }
                    : { background: "rgba(255,255,255,0.03)" }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 flex-shrink-0"
                  style={{ background: `${meta.color}20` }}>{meta.emoji}</div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="flex gap-1 items-center">
                    <span className="text-[10px] text-white/30 mr-1">Processing</span>
                    {[0, 1, 2].map(j => (
                      <div key={j} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: meta.color, animationDelay: `${j * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-3 border-t border-white/8 flex-shrink-0">
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                placeholder={`Communicate with ${license}…`}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/25"
                data-testid="input-spawn-message" autoFocus />
              <button onClick={send} disabled={loading || !input.trim()} data-testid="button-send-spawn"
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: `${meta.color}25`, border: `1px solid ${meta.color}35` }}>
                <Send size={15} style={{ color: meta.color }} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
