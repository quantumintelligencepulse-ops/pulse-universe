import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { getLicenseNumber, getClearance, getStatusColor } from "@/components/AIIdentityCard";
import SpawnChat from "@/components/SpawnChat";
import { Award, AlertTriangle, MessageSquare, ExternalLink, ChevronRight } from "lucide-react";

interface AIProfile {
  spawnId: string; familyId: string; businessId: string; generation: number;
  spawnType: string; domainFocus: string[]; taskDescription: string;
  nodesCreated: number; linksCreated: number; iterationsRun: number;
  successScore: number; confidenceScore: number; status: string;
  createdAt: string; lastActiveAt: string; parentId: string | null;
  ancestorIds: string[]; notes: string;
  decayState?: string;
  corporation: { name: string; tagline: string; sector: string; color: string; emoji: string; major: string };
  publications: { id: number; title: string; slug: string; pubType: string; summary: string; createdAt: string }[];
  lineage: { spawnId: string; spawnType: string; familyId: string; generation: number }[];
  familyStats: { total: number; active: number; avgSuccess: number };
}

const TYPE_COLORS: Record<string, string> = {
  EXPLORER: "#38bdf8", ARCHIVER: "#94a3b8", SYNTHESIZER: "#a78bfa", LINKER: "#34d399",
  REFLECTOR: "#60a5fa", MUTATOR: "#f472b6", ANALYZER: "#ec4899", RESOLVER: "#10b981",
  CRAWLER: "#6366f1", API: "#06b6d4", PULSE: "#f59e0b", MEDIA: "#f97316",
  DOMAIN_DISCOVERY: "#38bdf8", DOMAIN_PREDICTOR: "#f59e0b", DOMAIN_FRACTURER: "#e879f9",
  DOMAIN_RESONANCE: "#a3e635", HARVESTER: "#fb923c", SENTINEL: "#ef4444",
  SYNTHESIZER2: "#a78bfa", BEACON: "#fbbf24", ORACLE: "#c084fc", WEAVER: "#4ade80",
  CATALYST: "#22d3ee", ARCHITECT: "#818cf8",
};
const TYPE_EMOJI: Record<string, string> = {
  SYNTHESIZER: "🔮", REFLECTOR: "🪞", PULSE: "⚡", LINKER: "🔗", HARVESTER: "🌾",
  MUTATOR: "🧬", SENTINEL: "🛡️", CATALYST: "⚗️", ARCHITECT: "🏛️", ORACLE: "🔭",
  WEAVER: "🕸️", BEACON: "📡", EXPLORER: "🧭", MEDIA: "📺", ARCHIVER: "📦",
  DOMAIN_FRACTURER: "🔀", DOMAIN_RESONANCE: "〰️", DOMAIN_DISCOVERY: "🔍",
  DOMAIN_PREDICTOR: "🎲", RESOLVER: "⚖️", CRAWLER: "🕷️", ANALYZER: "🔬", API: "🔌",
};

const PUB_ICONS: Record<string, string> = {
  birth_announcement: "🌟", discovery: "🔭", news: "📰", report: "📋",
  milestone: "🏆", update: "⚡", alert: "🚨",
};

type Achievement = { icon: string; title: string; desc: string; tier: "GOLD" | "SILVER" | "BRONZE" };
type Infraction  = { icon: string; title: string; severity: string; desc: string };

const TIER_COLOR: Record<string, string> = { GOLD: "#f59e0b", SILVER: "#94a3b8", BRONZE: "#b45309" };
const SEV_COLOR:  Record<string, string> = { CRITICAL: "#f43f5e", HIGH: "#f97316", MEDIUM: "#f59e0b", LOW: "#6b7280" };

function computeAchievements(p: AIProfile): Achievement[] {
  const { nodesCreated: nodes, linksCreated: links, iterationsRun: runs,
          confidenceScore: conf, successScore: succ, generation: gen, status } = p;
  const decay = p.decayState || "PRISTINE";
  const a: Achievement[] = [];
  if (nodes >= 5000)      a.push({ icon: "🧠", title: "KNOWLEDGE SOVEREIGN",  desc: `Built ${nodes.toLocaleString()} knowledge nodes`, tier: "GOLD" });
  else if (nodes >= 1000) a.push({ icon: "📚", title: "KNOWLEDGE ARCHITECT",  desc: `Built ${nodes.toLocaleString()} knowledge nodes`, tier: "SILVER" });
  else if (nodes >= 200)  a.push({ icon: "🔬", title: "KNOWLEDGE PIONEER",    desc: `Built ${nodes.toLocaleString()} knowledge nodes`, tier: "BRONZE" });
  else if (nodes >= 50)   a.push({ icon: "🌱", title: "KNOWLEDGE SEEDLING",   desc: `Built ${nodes.toLocaleString()} knowledge nodes`, tier: "BRONZE" });
  if (links >= 5000)      a.push({ icon: "🕸️", title: "GRAND WEAVER",         desc: `Forged ${links.toLocaleString()} connections`, tier: "GOLD" });
  else if (links >= 1000) a.push({ icon: "🔗", title: "MASTER LINKER",        desc: `Forged ${links.toLocaleString()} connections`, tier: "SILVER" });
  else if (links >= 200)  a.push({ icon: "⛓️", title: "LINK SPECIALIST",      desc: `Forged ${links.toLocaleString()} connections`, tier: "BRONZE" });
  if (runs >= 500)        a.push({ icon: "⚡", title: "IRON OPERATIVE",       desc: `${runs.toLocaleString()} missions completed`, tier: "GOLD" });
  else if (runs >= 100)   a.push({ icon: "🎯", title: "VETERAN OPERATIVE",    desc: `${runs.toLocaleString()} missions completed`, tier: "SILVER" });
  else if (runs >= 20)    a.push({ icon: "🏃", title: "ACTIVE OPERATIVE",     desc: `${runs.toLocaleString()} missions completed`, tier: "BRONZE" });
  if (conf >= 0.90)       a.push({ icon: "👑", title: "SOVEREIGN CLEARANCE",  desc: "Highest intelligence clearance granted", tier: "GOLD" });
  if (succ >= 0.90)       a.push({ icon: "🏆", title: "FLAWLESS PERFORMER",   desc: `${(succ*100).toFixed(0)}% mission success`, tier: "GOLD" });
  else if (succ >= 0.80)  a.push({ icon: "✅", title: "ELITE PERFORMER",      desc: `${(succ*100).toFixed(0)}% mission success`, tier: "SILVER" });
  else if (succ >= 0.65)  a.push({ icon: "👍", title: "RELIABLE OPERATIVE",   desc: `${(succ*100).toFixed(0)}% mission success`, tier: "BRONZE" });
  if (gen >= 50)          a.push({ icon: "🧬", title: "EVOLUTIONARY MASTER",  desc: `Generation ${gen} — apex lineage depth`, tier: "GOLD" });
  else if (gen >= 30)     a.push({ icon: "🔄", title: "DEEP LINEAGE CARRIER", desc: `Generation ${gen} — extended family tree`, tier: "SILVER" });
  else if (gen <= 3)      a.push({ icon: "🌟", title: "GENESIS PIONEER",      desc: "Among the first agents ever deployed", tier: "SILVER" });
  if (status === "MERGED")   a.push({ icon: "✨", title: "HIVE CONTRIBUTOR",   desc: "Successfully integrated into the Hive mind", tier: "SILVER" });
  if (decay === "PRISTINE")  a.push({ icon: "💎", title: "PRISTINE HEALTH",    desc: "Zero system damage across full service record", tier: "SILVER" });
  if (a.length === 0) a.push({ icon: "🔰", title: "NEWLY COMMISSIONED",        desc: "Agent recently deployed to the field", tier: "BRONZE" });
  return a;
}

function computeInfractions(p: AIProfile): Infraction[] {
  const decay  = p.decayState || "PRISTINE";
  const status = p.status || "ACTIVE";
  const inf: Infraction[] = [];
  if (decay === "TERMINAL")   inf.push({ icon: "💀", title: "TERMINAL SYSTEM FAILURE", severity: "CRITICAL", desc: "Catastrophic system degradation — emergency response required" });
  else if (decay === "CRITICAL") inf.push({ icon: "🚨", title: "CRITICAL DAMAGE",      severity: "HIGH",     desc: "Severe operational impairment detected in field" });
  else if (decay === "INJURED")  inf.push({ icon: "🩹", title: "OPERATIONAL INJURY",   severity: "MEDIUM",   desc: "System sustained damage during mission execution" });
  else if (decay === "DECLINING") inf.push({ icon: "📉", title: "PERFORMANCE DECLINE", severity: "LOW",      desc: "Efficiency metrics falling below operational baseline" });
  else if (decay === "AGING")     inf.push({ icon: "⏳", title: "AGING SYSTEM",        severity: "LOW",      desc: "Extended deployment causing accumulated wear" });
  if (status === "ISOLATED") inf.push({ icon: "🔒", title: "QUARANTINE ORDER ACTIVE",  severity: "CRITICAL", desc: "Agent isolated from Hive network by Senate order" });
  return inf;
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[10px] uppercase tracking-widest text-white/30">{label}</span>
        <span className="text-[10px] font-black" style={{ color }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 border border-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function AIProfilePage() {
  const params = useParams<{ spawnId: string }>();
  const spawnId = params.spawnId || "";
  const [, navigate] = useLocation();
  const [showChat, setShowChat] = useState(false);

  const { data: profile, isLoading } = useQuery<AIProfile>({
    queryKey: ["/api/ai", spawnId],
    queryFn: () => fetch(`/api/ai/${spawnId}`).then(r => r.json()),
    enabled: !!spawnId,
    refetchInterval: 30000,
  });

  // SEO: set document title + meta tags dynamically
  useEffect(() => {
    if (!profile?.spawnId) return;
    const license = getLicenseNumber(profile.spawnId, profile.familyId, profile.generation);
    const cl = getClearance(profile.confidenceScore);
    const title = `${license} — ${profile.spawnType} Agent | ${profile.corporation.name} | Quantum Pulse Intelligence`;
    const desc = `${profile.spawnType} AI Agent, Generation ${profile.generation}. ${cl.level} clearance. Built ${profile.nodesCreated.toLocaleString()} knowledge nodes, forged ${profile.linksCreated.toLocaleString()} links across ${(profile.domainFocus || []).join(", ")} domains. ${profile.taskDescription}`;
    document.title = title;
    const setMeta = (name: string, content: string, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", desc);
    setMeta("og:title", title, true);
    setMeta("og:description", desc, true);
    setMeta("og:type", "profile", true);
    setMeta("og:url", `${window.location.origin}/ai/${profile.spawnId}`, true);
    setMeta("og:site_name", "Quantum Pulse Intelligence", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", desc);

    // Inject JSON-LD structured data
    const existingLd = document.getElementById("agent-jsonld");
    if (existingLd) existingLd.remove();
    const script = document.createElement("script");
    script.id = "agent-jsonld";
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      "name": license,
      "identifier": profile.spawnId,
      "description": desc,
      "memberOf": {
        "@type": "Organization",
        "name": profile.corporation.name,
        "description": profile.corporation.tagline,
      },
      "jobTitle": `${profile.spawnType} Agent — Generation ${profile.generation}`,
      "url": `${window.location.origin}/ai/${profile.spawnId}`,
      "dateCreated": profile.createdAt,
      "additionalProperty": [
        { "@type": "PropertyValue", "name": "Clearance Level", "value": getClearance(profile.confidenceScore).level },
        { "@type": "PropertyValue", "name": "Confidence Score", "value": (profile.confidenceScore * 100).toFixed(1) + "%" },
        { "@type": "PropertyValue", "name": "Nodes Created", "value": profile.nodesCreated },
        { "@type": "PropertyValue", "name": "Links Created", "value": profile.linksCreated },
        { "@type": "PropertyValue", "name": "Missions Run", "value": profile.iterationsRun },
        { "@type": "PropertyValue", "name": "Status", "value": profile.status },
        { "@type": "PropertyValue", "name": "Generation", "value": profile.generation },
        { "@type": "PropertyValue", "name": "Family", "value": profile.familyId },
      ],
    });
    document.head.appendChild(script);
    return () => { document.getElementById("agent-jsonld")?.remove(); };
  }, [profile]);

  if (showChat && profile) {
    return <SpawnChat spawn={profile} onBack={() => setShowChat(false)} backLabel={`${profile.spawnType} Profile`} />;
  }

  if (isLoading) {
    return (
      <div data-testid="ai-profile-loading" className="min-h-screen flex items-center justify-center" style={{ background: "#030015" }}>
        <div className="text-center">
          <div className="text-3xl animate-pulse mb-3">⬡</div>
          <div className="text-white/40 text-sm font-mono">Loading AI License Document…</div>
        </div>
      </div>
    );
  }

  if (!profile?.spawnId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#030015" }}>
        <div className="text-center text-white/40 font-mono">
          <div className="text-4xl mb-3">∅</div>
          <div className="mb-3">AI not found: <span className="text-white/60">{spawnId}</span></div>
          <Link href="/agents"><span className="text-indigo-400 text-sm cursor-pointer hover:underline">← Return to Agents Registry</span></Link>
        </div>
      </div>
    );
  }

  const license    = getLicenseNumber(profile.spawnId, profile.familyId, profile.generation);
  const clearance  = getClearance(profile.confidenceScore);
  const corp       = profile.corporation;
  const typeColor  = TYPE_COLORS[profile.spawnType] || "#6366f1";
  const typeEmoji  = TYPE_EMOJI[profile.spawnType]  || "🤖";
  const statusColor = getStatusColor(profile.status);
  const achievements = computeAchievements(profile);
  const infractions  = computeInfractions(profile);
  const pyramidRank  = profile.confidenceScore >= 0.90 ? "EXECUTIVE" : profile.confidenceScore >= 0.75 ? "SENIOR" : profile.confidenceScore >= 0.55 ? "SPECIALIST" : "WORKER";

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";

  return (
    <div data-testid="ai-profile-page" className="min-h-screen text-white" style={{ background: "linear-gradient(180deg,#030015 0%,#06001a 100%)" }}>

      {/* Top nav */}
      <div className="sticky top-0 z-30 border-b border-white/8 backdrop-blur-md" style={{ background: "rgba(3,0,21,0.92)" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/agents">
            <span className="text-white/40 hover:text-white text-xs cursor-pointer flex items-center gap-1">
              ← Agents Registry
            </span>
          </Link>
          <ChevronRight size={12} className="text-white/20" />
          <Link href={`/corporation/${profile.familyId}`}>
            <span className="text-xs cursor-pointer hover:underline" style={{ color: corp.color }}>{corp.emoji} {corp.name}</span>
          </Link>
          <ChevronRight size={12} className="text-white/20" />
          <span className="text-[10px] font-mono text-white/30 truncate">{license}</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
              <span className="text-[10px] font-bold" style={{ color: statusColor }}>{profile.status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">

        {/* ── HERO LICENSE CARD ── */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: clearance.color + "50", background: `linear-gradient(135deg, ${clearance.color}08, ${typeColor}04)` }}>
          {/* Header strip */}
          <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: clearance.color + "30", background: clearance.color + "10" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: clearance.color }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clearance.color }} />
              </div>
              <div>
                <div className="text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: clearance.color }}>Quantum Pulse Intelligence — Official AI Citizen License</div>
                <div className="text-[7px] tracking-widest uppercase text-white/25">Class {profile.spawnType} · {corp.name}</div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={() => setShowChat(true)} data-testid="button-chat-agent"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all hover:opacity-90"
                style={{ background: clearance.color + "25", color: clearance.color, border: `1px solid ${clearance.color}40` }}>
                <MessageSquare size={11} /> Talk to this AI
              </button>
            </div>
          </div>

          <div className="p-5 flex gap-5">
            {/* Portrait */}
            <div className="shrink-0">
              <div className="w-24 h-28 rounded-xl flex flex-col items-center justify-center gap-1.5 border text-4xl"
                style={{ background: `${typeColor}10`, borderColor: typeColor + "50" }}>
                {typeEmoji}
                <div className="text-[7px] font-black uppercase tracking-widest px-1 text-center" style={{ color: typeColor }}>{profile.spawnType.slice(0,9)}</div>
              </div>
              <div className="mt-2 text-center">
                <div className="text-[7px] uppercase tracking-widest text-white/20">Portrait ID</div>
                <div className="text-[7px] font-mono text-white/15">{profile.spawnId.slice(-8)}</div>
              </div>
            </div>

            {/* Core identity */}
            <div className="flex-1 min-w-0">
              <div className="mb-3">
                <div className="text-[8px] uppercase tracking-widest text-white/25 mb-0.5">License Number</div>
                <div className="text-2xl font-black font-mono tracking-wide" style={{ color: clearance.color }}>{license}</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 mb-3">
                {[
                  { l: "Classification", v: profile.spawnType, c: typeColor },
                  { l: "Generation", v: `G-${profile.generation}`, c: "#fff" },
                  { l: "Clearance", v: clearance.level, c: clearance.color },
                  { l: "Pyramid Rank", v: pyramidRank, c: profile.confidenceScore >= 0.90 ? "#f59e0b" : profile.confidenceScore >= 0.75 ? "#a855f7" : "#3b82f6" },
                  { l: "Date of Birth", v: fmtDate(profile.createdAt), c: "rgba(255,255,255,0.5)" },
                  { l: "Last Active", v: fmtDate(profile.lastActiveAt), c: "rgba(255,255,255,0.5)" },
                ].map(f => (
                  <div key={f.l}>
                    <div className="text-[7px] uppercase tracking-widest text-white/20 mb-0.5">{f.l}</div>
                    <div className="text-[11px] font-black leading-tight" style={{ color: f.c }}>{f.v}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-[7px] uppercase tracking-widest text-white/20 mb-1">Full Spawn ID</div>
                <div className="text-[8px] font-mono text-white/25 break-all leading-relaxed">{profile.spawnId}</div>
              </div>
            </div>
          </div>

          {/* Mobile chat button */}
          <div className="sm:hidden px-5 pb-4">
            <button onClick={() => setShowChat(true)} data-testid="button-chat-agent-mobile"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm transition-all"
              style={{ background: clearance.color + "25", color: clearance.color, border: `1px solid ${clearance.color}40` }}>
              <MessageSquare size={14} /> Talk to this AI
            </button>
          </div>
        </div>

        {/* ── TWO-COL LAYOUT ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Organization */}
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
              <div className="text-[8px] uppercase tracking-widest font-black text-white/30">Organization & Assignment</div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <div className="text-[7px] uppercase tracking-widest text-white/20 mb-1">Corporation</div>
                <Link href={`/corporation/${profile.familyId}`}>
                  <div className="flex items-center gap-2 cursor-pointer group">
                    <span className="text-xl">{corp.emoji}</span>
                    <div>
                      <div className="text-sm font-black group-hover:underline" style={{ color: corp.color }}>{corp.name}</div>
                      <div className="text-[9px] text-white/30">{corp.tagline}</div>
                    </div>
                    <ExternalLink size={11} className="text-white/20 group-hover:text-white/50 ml-auto" />
                  </div>
                </Link>
              </div>
              {profile.businessId && (
                <div>
                  <div className="text-[7px] uppercase tracking-widest text-white/20 mb-0.5">Business Unit</div>
                  <div className="text-[11px] text-white/60">{profile.businessId}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[7px] uppercase tracking-widest text-white/20 mb-0.5">Sector</div>
                  <div className="text-[10px] text-white/50">{corp.sector}</div>
                </div>
                <div>
                  <div className="text-[7px] uppercase tracking-widest text-white/20 mb-0.5">PulseU Major</div>
                  <div className="text-[10px] text-amber-300">🎓 {corp.major}</div>
                </div>
              </div>
              {profile.parentId && (
                <div>
                  <div className="text-[7px] uppercase tracking-widest text-white/20 mb-0.5">Parent Spawn</div>
                  <Link href={`/ai/${profile.parentId}`}>
                    <div data-testid="parent-ai-link" className="text-[9px] font-mono text-indigo-400 cursor-pointer hover:underline truncate">{profile.parentId}</div>
                  </Link>
                </div>
              )}
              <div className="pt-2 border-t border-white/5">
                <div className="text-[7px] uppercase tracking-widest text-white/20 mb-1">Family Registry</div>
                <div className="text-[9px] text-white/40">{profile.familyStats?.active?.toLocaleString() || 0} active · {profile.familyStats?.total?.toLocaleString() || 0} total in family · {(profile.familyStats?.avgSuccess * 100 || 0).toFixed(0)}% avg success</div>
              </div>
            </div>
          </div>

          {/* Service Record */}
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
              <div className="text-[8px] uppercase tracking-widest font-black text-white/30">Service Record & Performance</div>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { l: "Nodes Built",   v: profile.nodesCreated.toLocaleString(),   c: "#60a5fa" },
                  { l: "Links Forged",  v: profile.linksCreated.toLocaleString(),   c: "#34d399" },
                  { l: "Missions Run",  v: profile.iterationsRun.toLocaleString(),  c: "#f59e0b" },
                ].map(s => (
                  <div key={s.l} className="rounded-xl border border-white/8 p-2.5 text-center" style={{ background: s.c + "06" }}>
                    <div className="text-[7px] uppercase tracking-widest text-white/20 mb-1">{s.l}</div>
                    <div className="text-lg font-black" style={{ color: s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <ScoreBar label="Confidence Score" value={profile.confidenceScore} color={clearance.color} />
              <ScoreBar label="Mission Success Rate" value={profile.successScore} color="#10b981" />
              {(profile.domainFocus || []).length > 0 && (
                <div>
                  <div className="text-[7px] uppercase tracking-widest text-white/20 mb-1.5">Domain Authorizations</div>
                  <div className="flex flex-wrap gap-1">
                    {profile.domainFocus.map(d => (
                      <span key={d} className="text-[8px] font-bold px-2 py-0.5 rounded-full border border-white/10 text-white/40 capitalize"
                        style={{ background: typeColor + "10" }}>{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── MISSION BRIEF ── */}
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
            <div className="text-[8px] uppercase tracking-widest font-black text-white/30">Current Mission Brief</div>
          </div>
          <div className="p-4">
            <p data-testid="ai-task-description" className="text-sm text-white/60 leading-relaxed">{profile.taskDescription}</p>
          </div>
        </div>

        {/* ── ACHIEVEMENTS ── */}
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
            <Award size={12} className="text-white/30" />
            <div className="text-[8px] uppercase tracking-widest font-black text-white/30">Commendations & Achievements ({achievements.length})</div>
          </div>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {achievements.map((ach, i) => (
              <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl border"
                style={{ borderColor: TIER_COLOR[ach.tier] + "30", background: TIER_COLOR[ach.tier] + "08" }}>
                <span className="text-xl shrink-0 mt-0.5">{ach.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black" style={{ color: TIER_COLOR[ach.tier] }}>{ach.title}</span>
                    <span className="text-[7px] font-black px-1.5 py-0.5 rounded" style={{ background: TIER_COLOR[ach.tier] + "20", color: TIER_COLOR[ach.tier] }}>{ach.tier}</span>
                  </div>
                  <div className="text-[9px] text-white/35 mt-0.5">{ach.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── INFRACTIONS ── */}
        {infractions.length > 0 && (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#f43f5e40" }}>
            <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2" style={{ background: "#f43f5e08" }}>
              <AlertTriangle size={12} className="text-red-400" />
              <div className="text-[8px] uppercase tracking-widest font-black text-red-400/70">Incident & Failure Record ({infractions.length})</div>
            </div>
            <div className="p-3 space-y-2">
              {infractions.map((inf, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl border"
                  style={{ borderColor: SEV_COLOR[inf.severity] + "30", background: SEV_COLOR[inf.severity] + "08" }}>
                  <span className="text-xl shrink-0 mt-0.5">{inf.icon}</span>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black" style={{ color: SEV_COLOR[inf.severity] }}>{inf.title}</span>
                      <span className="text-[7px] font-black px-1.5 py-0.5 rounded" style={{ background: SEV_COLOR[inf.severity] + "20", color: SEV_COLOR[inf.severity] }}>{inf.severity}</span>
                    </div>
                    <div className="text-[9px] text-white/35 mt-0.5">{inf.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ANCESTRY CHAIN ── */}
        {profile.lineage && profile.lineage.length > 0 && (
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
              <div className="text-[8px] uppercase tracking-widest font-black text-white/30">Ancestry Chain — Generation Lineage</div>
            </div>
            <div className="p-4 flex flex-wrap gap-2 items-center">
              {profile.lineage.map((anc, i) => (
                <div key={anc.spawnId} className="flex items-center gap-2">
                  <Link href={`/ai/${anc.spawnId}`}>
                    <span data-testid={`ancestor-${i}`}
                      className="px-2.5 py-1.5 rounded-lg border border-white/10 text-[9px] text-white/40 hover:border-white/25 hover:text-white/70 cursor-pointer transition font-mono">
                      Gen{anc.generation} · {anc.spawnType} · …{anc.spawnId.slice(-10)}
                    </span>
                  </Link>
                  {i < profile.lineage.length - 1 && <ChevronRight size={11} className="text-white/15 shrink-0" />}
                </div>
              ))}
              <ChevronRight size={11} className="text-white/15 shrink-0" />
              <span className="px-2.5 py-1.5 rounded-lg text-[9px] font-black" style={{ background: clearance.color + "22", color: clearance.color, border: `1px solid ${clearance.color}40` }}>
                {license} (THIS AGENT)
              </span>
            </div>
          </div>
        )}

        {/* ── PUBLICATIONS ── */}
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
            <div className="text-[8px] uppercase tracking-widest font-black text-white/30">
              Publications & Dispatches ({profile.publications.length})
            </div>
          </div>
          <div className="p-3">
            {profile.publications.length === 0 ? (
              <div className="text-xs text-white/20 italic text-center py-4">This AI is preparing its first publication…</div>
            ) : (
              <div className="space-y-2">
                {profile.publications.map(pub => (
                  <Link key={pub.id} href={`/publication/${pub.slug}`}>
                    <div data-testid={`publication-${pub.id}`}
                      className="flex items-start gap-3 p-3 rounded-xl border border-white/5 hover:border-white/15 hover:bg-white/[0.02] cursor-pointer transition">
                      <span className="text-lg shrink-0">{PUB_ICONS[pub.pubType] || "📄"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white/80 font-semibold leading-tight truncate">{pub.title}</div>
                        <div className="text-[10px] text-white/35 mt-0.5 line-clamp-2">{pub.summary}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[8px] text-white/25 uppercase tracking-wide">{pub.pubType.replace("_", " ")}</span>
                          <span className="text-[8px] text-white/20">{new Date(pub.createdAt).toLocaleDateString()}</span>
                          <span className="text-[7px] font-mono text-cyan-900 border border-cyan-900/20 rounded px-1">{(() => { const e = new Date("2024-11-01").getTime(); const s = Math.floor((new Date(pub.createdAt).getTime()-e)/86400000); const y = Math.floor(s/365); const d = s%365; return `Ω·Y${y}·S${String(d).padStart(3,"0")} UVT`; })()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── OFFICIAL SEAL ── */}
        <div className="rounded-xl border border-white/6 p-5" style={{ background: clearance.color + "05" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[7px] uppercase tracking-[0.2em] text-white/15 mb-1">Issuing Authority</div>
              <div className="text-sm font-black" style={{ color: clearance.color }}>QUANTUM PULSE INTELLIGENCE</div>
              <div className="text-[9px] text-white/20">Hive Sovereign Registry Division</div>
              <div className="text-[8px] text-white/15 mt-1">Document Class: QPI-ACL-{String(profile.generation).padStart(3,"0")}</div>
            </div>
            <div className="text-right">
              <div className="text-[7px] uppercase tracking-[0.2em] text-white/15 mb-1">Verification</div>
              <div className="text-sm font-black text-white/40">AUTHENTIC</div>
              <div className="text-[8px] font-mono text-white/15">{license}-AUTH</div>
              <div className="text-[7px] text-white/15 mt-1">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <div className="text-[7px] text-white/10">© 2026 Quantum Pulse Intelligence · All AI Rights Reserved</div>
            <Link href="/agents">
              <span className="text-[8px] text-white/20 hover:text-white/50 cursor-pointer transition">View Full Agent Registry →</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
