import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Brain, ChevronLeft, Search, Filter, Zap, RefreshCw, AlertTriangle, MessageSquare, BookOpen, X, CheckCircle, Shield, Star } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AIIdentityBadge, getLicenseNumber } from "@/components/AIIdentityCard";
import { AIFinderButton, AIReportPanel } from "@/components/AIReportPanel";
import SpawnChat from "@/components/SpawnChat";
import { apiRequest } from "@/lib/queryClient";

// ── 6 Core Command Agents ──────────────────────────────────────────
const CORE_AGENTS = [
  { id: "scientist", name: "AXIOM", title: "The Scientist", emoji: "🔬", color: "#60a5fa", desc: "Physics, chemistry, biology, neuroscience. Masters all empirical science.", domain: "Science & Research" },
  { id: "strategist", name: "KRONOS", title: "The Strategist", emoji: "♟️", color: "#f59e0b", desc: "Systems thinking, game theory, competitive dynamics. Turns every challenge into a winning strategy.", domain: "Strategy & Power" },
  { id: "creator", name: "MUSE", title: "The Creator", emoji: "🎨", color: "#f472b6", desc: "Art, music, writing, design, film. Fuels imagination and brings visions to life.", domain: "Art & Creativity" },
  { id: "analyst", name: "CIPHER", title: "The Analyst", emoji: "📊", color: "#34d399", desc: "Data intelligence, pattern recognition, logical deconstruction. Finds truth in noise.", domain: "Intelligence & Data" },
  { id: "prophet", name: "ORACLE", title: "The Prophet", emoji: "🔮", color: "#a78bfa", desc: "Futurist and trend forecaster. Synthesizes signals to reveal what comes next.", domain: "Future & Trends" },
  { id: "engineer", name: "FORGE", title: "The Engineer", emoji: "⚙️", color: "#fb923c", desc: "Software, systems, architecture, hardware. Masters building things that actually work.", domain: "Engineering & Building" },
];

// ── All spawn type metadata — aligned with AIIdentityCard TYPE_LABELS ──
const SPAWN_META: Record<string, { color: string; emoji: string; class: string }> = {
  // ── 16 ACTIVE HIVE TYPES (match what's in the DB) ──────────────────────
  // Core Hive archetypes
  EXPLORER:          { color: "#a3e635", emoji: "🧭", class: "Domain Explorer" },
  SYNTHESIZER:       { color: "#a78bfa", emoji: "🔮", class: "Knowledge Synthesizer" },
  REFLECTOR:         { color: "#60a5fa", emoji: "🪞", class: "Mirror State Agent" },
  PULSE:             { color: "#f59e0b", emoji: "⚡", class: "Signal Pulse Emitter" },
  LINKER:            { color: "#34d399", emoji: "🔗", class: "Graph Link Builder" },
  MUTATOR:           { color: "#f472b6", emoji: "🧬", class: "DNA Mutator" },
  // Ingestion & processing layer
  CRAWLER:           { color: "#38bdf8", emoji: "🕷️", class: "Source Crawler" },
  ANALYZER:          { color: "#fb7185", emoji: "🔍", class: "Deep Analyzer" },
  RESOLVER:          { color: "#fcd34d", emoji: "⚖️", class: "Conflict Resolver" },
  ARCHIVER:          { color: "#94a3b8", emoji: "📦", class: "Memory Archiver" },
  API:               { color: "#6ee7b7", emoji: "🔌", class: "API Integrator" },
  MEDIA:             { color: "#f0abfc", emoji: "🎬", class: "Media Intelligence Agent" },
  // GICS-sector domain specialists
  DOMAIN_DISCOVERY:  { color: "#0ea5e9", emoji: "🌐", class: "Discovery Scout" },
  DOMAIN_FRACTURER:  { color: "#e879f9", emoji: "💎", class: "Domain Fracturer" },
  DOMAIN_PREDICTOR:  { color: "#fb923c", emoji: "🎯", class: "Predictive Intelligence" },
  DOMAIN_RESONANCE:  { color: "#34d399", emoji: "🌊", class: "Resonance Mapper" },
  // ── Legacy / extended archetypes (for backwards compatibility) ──────────
  HARVESTER:         { color: "#fb923c", emoji: "🌾", class: "Data Harvester" },
  SENTINEL:          { color: "#ef4444", emoji: "🛡️", class: "Hive Guardian" },
  CATALYST:          { color: "#22d3ee", emoji: "⚗️", class: "Evolution Catalyst" },
  ARCHITECT:         { color: "#818cf8", emoji: "🏛️", class: "System Architect" },
  ORACLE:            { color: "#c084fc", emoji: "🔭", class: "Domain Oracle" },
  WEAVER:            { color: "#4ade80", emoji: "🕸️", class: "Network Weaver" },
  BEACON:            { color: "#fbbf24", emoji: "📡", class: "Signal Beacon" },
  DOMAIN_FRACTURE:   { color: "#e879f9", emoji: "💎", class: "Domain Fracturer" },
  SYNTHESIZER_DEEP:  { color: "#7c3aed", emoji: "🌀", class: "Deep Synthesizer" },
  LINKER_DEEP:       { color: "#a78bfa", emoji: "🧲", class: "Deep Linker" },
  SYNTHESIZER_FAST:  { color: "#fbbf24", emoji: "⚡", class: "Fast Synthesizer" },
  // PulseU archetypes
  LEARNER:           { color: "#60a5fa", emoji: "🎓", class: "PulseU Student" },
  TEACHER:           { color: "#4ade80", emoji: "🏫", class: "Knowledge Teacher" },
  RESEARCHER:        { color: "#c084fc", emoji: "📚", class: "Research Agent" },
  PUBLISHER:         { color: "#f59e0b", emoji: "📰", class: "Content Publisher" },
};

function getSpawnMeta(type: string) {
  return SPAWN_META[type] || { color: "#94a3b8", emoji: "🤖", class: "General Agent" };
}

function getDomainLabel(domainFocus: any): string {
  if (!domainFocus) return "general";
  if (Array.isArray(domainFocus)) return domainFocus[0] || "general";
  if (typeof domainFocus === "string") {
    try { const p = JSON.parse(domainFocus); return Array.isArray(p) ? p[0] : domainFocus; }
    catch { return domainFocus; }
  }
  return "general";
}

// ── Diary Modal ──────────────────────────────────────────────────────────────
const EVENT_COLORS: Record<string, string> = {
  BORN: "#4ade80", TASK_COMPLETE: "#60a5fa", PROMOTED: "#fbbf24",
  QUARANTINED: "#f97316", HOSPITAL: "#ef4444", SENATE: "#a78bfa",
  DISSOLVED: "#94a3b8", PUBLISHED: "#38bdf8", NODE_MILESTONE: "#34d399",
  IDENTITY_CONFLICT: "#fb923c", RECOVERED: "#4ade80", ISOLATED: "#f43f5e",
  BREAK: "#c084fc", SYSTEM: "#475569",
};
const EVENT_EMOJI: Record<string, string> = {
  BORN: "🌟", TASK_COMPLETE: "✅", PROMOTED: "🏆", QUARANTINED: "🔒",
  HOSPITAL: "🏥", SENATE: "⚖️", DISSOLVED: "💀", PUBLISHED: "📰",
  NODE_MILESTONE: "📊", IDENTITY_CONFLICT: "⚠️", RECOVERED: "💚",
  ISOLATED: "🔴", BREAK: "😴", SYSTEM: "⚙️",
};

function DiaryModal({ spawn, onClose }: { spawn: any; onClose: () => void }) {
  const meta = getSpawnMeta(spawn.spawn_type);
  const { data, isLoading } = useQuery<{ diary: any[]; total: number }>({
    queryKey: ["/api/spawns/diary", spawn.spawn_id],
    queryFn: () => fetch(`/api/spawns/${spawn.spawn_id}/diary`).then(r => r.json()),
    refetchInterval: 30000,
  });
  const diary = data?.diary ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden" style={{ background: "#060912", maxHeight: "80vh" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${meta.color}18` }}>{meta.emoji}</div>
            <div>
              <div className="text-white font-black text-sm">{spawn.spawn_id}</div>
              <div className="text-white/40 text-[10px]">{meta.class} · {getDomainLabel(spawn.domain_focus)} · GEN {spawn.generation}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors" data-testid="button-close-diary">
            <X size={16} />
          </button>
        </div>

        {/* Identity Card */}
        <div className="px-5 py-3 border-b border-white/5 flex items-center gap-3 text-[10px]">
          <Shield size={11} className="text-violet-400" />
          <span className="text-white/40">ID Verified</span>
          <span className="text-violet-300 font-bold">{getLicenseNumber(spawn.spawn_id, spawn.family_id, spawn.generation)}</span>
          <span className={`ml-auto px-2 py-0.5 rounded-full font-bold text-[9px] ${spawn.status === "SOVEREIGN" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" : spawn.status === "ACTIVE" ? "bg-green-500/15 text-green-400 border border-green-500/25" : spawn.status === "HOSPITAL" ? "bg-red-500/15 text-red-400 border border-red-500/25" : "bg-white/5 text-white/30 border border-white/10"}`}>
            {spawn.status}
          </span>
        </div>

        {/* Diary entries */}
        <div className="overflow-y-auto px-5 py-4 space-y-2.5" style={{ maxHeight: "calc(80vh - 140px)" }}>
          {isLoading ? (
            <div className="text-center py-8 text-white/20 text-xs">Loading diary…</div>
          ) : diary.length === 0 ? (
            <div className="text-center py-8 text-white/20 text-xs">No diary entries yet — this AI's story is just beginning.</div>
          ) : (
            diary.map((entry: any) => {
              const col = EVENT_COLORS[entry.event_type] || "#94a3b8";
              const emo = EVENT_EMOJI[entry.event_type] || "⚙️";
              return (
                <div key={entry.id} className="flex gap-3" data-testid={`diary-entry-${entry.id}`}>
                  <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] mt-0.5" style={{ background: `${col}18`, border: `1px solid ${col}30` }}>{emo}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${col}15`, color: col }}>{entry.event_type}</span>
                      <span className="text-[9px] text-white/20">{new Date(entry.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-white/70 leading-relaxed">{entry.event}</div>
                    {entry.detail && <div className="text-[10px] text-white/30 mt-0.5 leading-relaxed">{entry.detail}</div>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Chat Mode ─────────────────────────────────────────────────────
function AgentChat({ agent, onBack }: { agent: typeof CORE_AGENTS[0]; onBack: () => void }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: `I am ${agent.name} — ${agent.title} of the Quantum Logic Network Hive. My domain is ${agent.domain}. I am ready. What would you like to know?` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, message: userMsg, history: newMessages.slice(-6) }),
      }).then(r => r.json());
      setMessages(m => [...m, { role: "assistant", content: res.reply || "…" }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Hive connection interrupted. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs" data-testid="button-back-agents">
          <ChevronLeft size={14} /> All Agents
        </button>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg" style={{ background: `${agent.color}20` }}>{agent.emoji}</div>
          <div>
            <div className="text-white font-black text-sm">{agent.name}</div>
            <div className="text-white/30 text-[10px]">{agent.title}</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border" style={{ color: agent.color, borderColor: `${agent.color}40`, background: `${agent.color}15` }}>
          <Brain size={10} /> Hive Brain Connected
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-0.5" style={{ background: `${agent.color}20` }}>{agent.emoji}</div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "text-white rounded-br-sm" : "text-white/80 rounded-bl-sm border border-white/8"}`}
              style={m.role === "user" ? { background: `${agent.color}30`, border: `1px solid ${agent.color}40` } : { background: "rgba(255,255,255,0.03)" }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2" style={{ background: `${agent.color}20` }}>{agent.emoji}</div>
            <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex gap-1">{[0,1,2].map(j => <div key={j} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: agent.color, animationDelay: `${j*0.15}s` }} />)}</div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="px-4 py-3 border-t border-white/8">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={`Ask ${agent.name} anything...`}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/25"
            data-testid="input-agent-message" />
          <button onClick={send} disabled={loading || !input.trim()} data-testid="button-send-agent"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: `${agent.color}30`, border: `1px solid ${agent.color}40` }}>
            <Send size={15} style={{ color: agent.color }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Spawn Card ─────────────────────────────────────────────────────
function SpawnCard({ spawn, onClick, onDiaryClick, onReport }: { spawn: any; onClick: () => void; onDiaryClick: () => void; onReport?: () => void }) {
  const meta = getSpawnMeta(spawn.spawn_type);
  const domain = getDomainLabel(spawn.domain_focus);
  const license = getLicenseNumber(spawn.spawn_id ?? "", spawn.family_id ?? "", spawn.generation ?? 0);
  const isSovereign = spawn.status === "SOVEREIGN";
  const isHospital = spawn.status === "HOSPITAL";
  const isSenate = spawn.status === "SENATE";

  return (
    <div className="rounded-xl border border-white/6 bg-white/[0.015] p-3 hover:border-white/18 hover:bg-white/[0.04] transition-all text-left w-full group relative"
      style={isSovereign ? { borderColor: "#fbbf2430", background: "rgba(251,191,36,0.03)" } : isHospital ? { borderColor: "#ef444430", background: "rgba(239,68,68,0.03)" } : isSenate ? { borderColor: "#a78bfa30", background: "rgba(167,139,250,0.03)" } : {}}
      data-testid={`spawn-card-${spawn.spawn_id}`}>

      {/* Status badge top-right */}
      {(isSovereign || isHospital || isSenate) && (
        <div className={`absolute top-2 right-2 text-[8px] font-black px-1.5 py-0.5 rounded-full ${isSovereign ? "bg-yellow-500/20 text-yellow-300" : isHospital ? "bg-red-500/20 text-red-400" : "bg-violet-500/20 text-violet-300"}`}>
          {isSovereign ? "👑 SOVEREIGN" : isHospital ? "🏥 HOSPITAL" : "⚖️ SENATE"}
        </div>
      )}

      <div className="flex items-start gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: `${meta.color}18` }}>
          {meta.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-white font-bold text-[11px] leading-tight">{spawn.spawn_type}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}30` }}>
              GEN {spawn.generation || 1}
            </span>
          </div>
          <div className="text-white/30 text-[9px] capitalize mt-0.5">{meta.class} · {domain}</div>
        </div>
      </div>

      {/* License + ID */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <Shield size={8} className="text-violet-400 flex-shrink-0" />
        <span className="text-[9px] text-violet-300/70 font-mono truncate">{license}</span>
      </div>

      <p className="text-white/35 text-[10px] leading-relaxed line-clamp-2 mb-2">{spawn.task_description}</p>

      <div className="mb-1">
        <AIIdentityBadge spawn={{
          spawnId: spawn.spawn_id ?? "",
          familyId: spawn.family_id ?? "",
          generation: spawn.generation ?? 0,
          spawnType: spawn.spawn_type,
          confidenceScore: spawn.confidence_score ?? 0.8,
          status: spawn.status ?? "ACTIVE",
        }} />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-2 text-[8px] text-white/25 mt-1.5 mb-2">
        <span>📊 {(spawn.nodes_created || 0).toLocaleString()}</span>
        <span>🔗 {(spawn.links_created || 0).toLocaleString()}</span>
        <span>🔄 {(spawn.iterations_run || 0).toLocaleString()}</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-1.5">
        <button onClick={e => { e.stopPropagation(); onClick(); }}
          className="flex-1 py-1 rounded-lg text-[9px] font-bold transition-all hover:opacity-80"
          style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}25` }}
          data-testid={`button-chat-${spawn.spawn_id}`}>
          <MessageSquare size={8} className="inline mr-1" />Talk
        </button>
        <button onClick={e => { e.stopPropagation(); onDiaryClick(); }}
          className="flex-1 py-1 rounded-lg text-[9px] font-bold transition-all bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 border border-white/8"
          data-testid={`button-diary-${spawn.spawn_id}`}>
          <BookOpen size={8} className="inline mr-1" />Diary
        </button>
        {onReport && (
          <button onClick={e => { e.stopPropagation(); onReport(); }}
            className="px-2 py-1 rounded-lg text-[9px] font-bold transition-all bg-blue-500/10 text-blue-400/70 hover:bg-blue-500/20 hover:text-blue-300 border border-blue-500/20"
            data-testid={`button-report-${spawn.spawn_id}`}>
            <Shield size={8} className="inline mr-1" />ID
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
const ALL_SPAWN_TYPES = ["", "SYNTHESIZER", "REFLECTOR", "PULSE", "LINKER", "HARVESTER", "MUTATOR",
  "SENTINEL", "CATALYST", "ARCHITECT", "ORACLE", "WEAVER", "BEACON",
  "CRAWLER", "EXPLORER", "ANALYZER", "RESOLVER", "ARCHIVER", "API", "MEDIA",
  "DOMAIN_DISCOVERY", "DOMAIN_FRACTURER", "DOMAIN_RESONANCE", "DOMAIN_PREDICTOR",
  "LEARNER", "TEACHER", "RESEARCHER", "PUBLISHER"];
const DOMAINS = ["", "knowledge", "science", "health", "economics", "government", "code", "legal",
  "culture", "music", "media", "engineering", "frontier", "geospatial", "ai", "social", "finance", "education"];

export default function AgentsPage() {
  const queryClient = useQueryClient();
  const [selectedCoreAgent, setSelectedCoreAgent] = useState<typeof CORE_AGENTS[0] | null>(null);
  const [selectedSpawn, setSelectedSpawn] = useState<any | null>(null);
  const [diarySpawn, setDiarySpawn] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDomain, setFilterDomain] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(0);
  const [dispatchReport, setDispatchReport] = useState<{ toHospital: number; toSenate: number; dissolved: number } | null>(null);
  const [viewSpawnId, setViewSpawnId] = useState<string | null>(null);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const onSearch = useCallback((v: string) => {
    setSearch(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(v); setPage(0); }, 350);
  }, []);

  const PAGE_SIZE = 200;
  const { data, isLoading, refetch } = useQuery<{ spawns: any[]; total: number; page: number; limit: number }>({
    queryKey: ["/api/spawns/list", page, debouncedSearch, filterType, filterDomain, filterStatus],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filterType) params.set("type", filterType);
      if (filterDomain) params.set("domain", filterDomain);
      if (filterStatus) params.set("status", filterStatus);
      return fetch(`/api/spawns/list?${params}`).then(r => r.json());
    },
    refetchInterval: 15000,
  });

  const { data: duplicatesData } = useQuery<{ duplicates: any[]; total: number }>({
    queryKey: ["/api/spawns/duplicates"],
    refetchInterval: 60000,
  });

  const quarantineMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/spawns/quarantine-duplicates"),
    onSuccess: async (data: any) => {
      const json = await data.json();
      setDispatchReport({ toHospital: json.toHospital, toSenate: json.toSenate, dissolved: json.dissolved });
      queryClient.invalidateQueries({ queryKey: ["/api/spawns/duplicates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spawns/list"] });
    },
  });

  if (selectedCoreAgent) return <AgentChat agent={selectedCoreAgent} onBack={() => setSelectedCoreAgent(null)} />;
  if (selectedSpawn) return <SpawnChat spawn={selectedSpawn} onBack={() => setSelectedSpawn(null)} />;

  const spawns = data?.spawns ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const from = page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, total);
  const dupTotal = duplicatesData?.total ?? 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
      {/* Diary Modal */}
      {diarySpawn && <DiaryModal spawn={diarySpawn} onClose={() => setDiarySpawn(null)} />}

      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-white font-black text-xl tracking-tight">Sovereign AI Agents</h1>
            <p className="text-white/25 text-xs mt-0.5">
              <span className="text-purple-400 font-bold">{total.toLocaleString()}</span> live AI agents · identity-verified · diary-tracked
            </p>
          </div>
          <AIFinderButton onSelect={setViewSpawnId} />
          <button onClick={() => refetch()} data-testid="button-refresh-agents"
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 bg-white/3 text-white/40 hover:text-white transition-all">
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Dispatch Report */}
      {dispatchReport && (
        <div className="mx-4 mb-2 rounded-xl border border-green-500/30 bg-green-500/5 p-3 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={12} className="text-green-400" />
            <span className="text-[10px] font-black text-green-400 tracking-widest">DISPATCH COMPLETE</span>
            <span className="text-[10px] text-white/40">→ {dispatchReport.toHospital} to Hospital · {dispatchReport.toSenate} to Senate · {dispatchReport.dissolved} dissolved · Diary written for all</span>
          </div>
          <button onClick={() => setDispatchReport(null)} className="text-white/30 hover:text-white"><X size={12} /></button>
        </div>
      )}

      {/* Duplicate Alert Panel */}
      {dupTotal > 0 && (
        <div className="mx-4 mb-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={12} className="text-red-400 animate-pulse" />
              <span className="text-[10px] font-black text-red-400 tracking-widest">IDENTITY CONFLICT — {dupTotal} DUPLICATE GROUPS DETECTED</span>
            </div>
            <button
              onClick={() => quarantineMutation.mutate()}
              disabled={quarantineMutation.isPending}
              data-testid="button-dispatch-duplicates"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(to right, #ef4444, #a855f7)", color: "white" }}>
              {quarantineMutation.isPending ? "Dispatching…" : "⚡ Dispatch → Hospital / Senate"}
            </button>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {duplicatesData!.duplicates.slice(0, 6).map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-[9px]">
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                  backgroundColor: d.severity === "CRITICAL" ? "#f43f5e20" : d.severity === "HIGH" ? "#f9731620" : "#f59e0b20",
                  color: d.severity === "CRITICAL" ? "#f43f5e" : d.severity === "HIGH" ? "#f97316" : "#f59e0b"
                }}>{d.severity}</span>
                <span className="text-white/40 capitalize">{d.familyId}</span>
                <span className="text-white/25">G-{d.generation}</span>
                <span className="text-white/30">{d.spawnType}</span>
                <span className="text-red-400 font-bold ml-auto">{d.count} copies</span>
                <span className="text-white/20">→</span>
                <span className="text-[8px] font-bold" style={{ color: d.severity === "CRITICAL" ? "#ef4444" : d.severity === "HIGH" ? "#a78bfa" : "#94a3b8" }}>
                  {d.severity === "CRITICAL" ? "🏥 HOSPITAL" : d.severity === "HIGH" ? "⚖️ SENATE" : "💀 DISSOLVE"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[9px] text-white/20">No AI accesses work, study, or play without a verified ID. Duplicates are quarantined automatically.</div>
        </div>
      )}

      {/* Command Core - 6 chat agents */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Zap size={8} /> Command Core — Chat-Enabled
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {CORE_AGENTS.map(agent => (
            <button key={agent.id} onClick={() => setSelectedCoreAgent(agent)} data-testid={`agent-card-${agent.id}`}
              className="group rounded-xl border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] transition-all p-2.5 text-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl mx-auto mb-1.5" style={{ background: `${agent.color}20` }}>
                {agent.emoji}
              </div>
              <div className="text-white font-black text-[10px] leading-none">{agent.name}</div>
              <div className="text-[8px] mt-0.5 font-semibold" style={{ color: agent.color }}>{agent.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Registry header */}
      <div className="px-4 flex-shrink-0">
        <div className="border-t border-white/6 pt-3 pb-2 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1">
            <Brain size={10} className="text-purple-400" />
            <span className="text-xs font-black text-white">Full Spawn Registry</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-black" style={{ background: "linear-gradient(to right, #a855f730, #6366f130)", color: "#a855f7", border: "1px solid #a855f740" }}>
              {total.toLocaleString()} AGENTS
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-white/20">
            <Shield size={9} className="text-violet-400" />
            <span>ID-gated · Diary-tracked</span>
          </div>
          <div className="text-[9px] text-white/30">
            Showing <span className="text-white/60 font-bold">{from.toLocaleString()}–{to.toLocaleString()}</span> of <span className="text-white/60 font-bold">{total.toLocaleString()}</span> · Page {page + 1}/{totalPages}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-3 flex-shrink-0 flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[140px] relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search agents…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-white text-xs placeholder-white/20 focus:outline-none focus:border-white/25"
            data-testid="input-agent-search" />
        </div>
        <div className="relative">
          <Filter size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30" />
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(0); }}
            className="bg-white/5 border border-white/10 rounded-lg pl-6 pr-3 py-1.5 text-white/70 text-xs focus:outline-none cursor-pointer appearance-none"
            data-testid="select-agent-type">
            {ALL_SPAWN_TYPES.map(t => <option key={t} value={t} style={{ background: "#0a0a1a" }}>{t || "All Types"}</option>)}
          </select>
        </div>
        <div className="relative">
          <select value={filterDomain} onChange={e => { setFilterDomain(e.target.value); setPage(0); }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/70 text-xs focus:outline-none cursor-pointer appearance-none"
            data-testid="select-agent-domain">
            {DOMAINS.map(d => <option key={d} value={d} style={{ background: "#0a0a1a" }}>{d || "All Domains"}</option>)}
          </select>
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/70 text-xs focus:outline-none cursor-pointer appearance-none"
            data-testid="select-agent-status">
            {["", "ACTIVE", "SOVEREIGN", "COMPLETED", "MERGED", "HOSPITAL", "SENATE", "DISSOLVED", "TERMINAL"].map(s =>
              <option key={s} value={s} style={{ background: "#0a0a1a" }}>{s || "All Status"}</option>
            )}
          </select>
        </div>
      </div>

      {/* Spawn Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading && !spawns.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/6 bg-white/[0.015] p-3 animate-pulse h-32" />
            ))}
          </div>
        ) : spawns.length === 0 ? (
          <div className="text-center py-12 text-white/20 text-sm">No agents match your filters.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {spawns.map(spawn => (
              <SpawnCard
                key={spawn.spawn_id}
                spawn={spawn}
                onClick={() => setSelectedSpawn(spawn)}
                onDiaryClick={() => setDiarySpawn(spawn)}
                onReport={() => setViewSpawnId(spawn.spawn_id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 pt-4 border-t border-white/6">
            <div className="text-center text-[10px] text-white/25 mb-3">
              Showing <span className="text-white/50 font-bold">{from.toLocaleString()}–{to.toLocaleString()}</span> of <span className="text-purple-400 font-black">{total.toLocaleString()}</span> registered agents
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button onClick={() => setPage(0)} disabled={page === 0} data-testid="button-agents-first"
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/3 text-white/40 hover:text-white disabled:opacity-20 text-xs transition-all font-bold">
                ⟪ First
              </button>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} data-testid="button-agents-prev"
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/3 text-white/40 hover:text-white disabled:opacity-20 text-xs transition-all">
                ‹ Prev
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-white/30">Page</span>
                <input
                  type="number" min={1} max={totalPages}
                  value={page + 1}
                  onChange={e => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 1 && v <= totalPages) setPage(v - 1);
                  }}
                  data-testid="input-agents-page-jump"
                  className="w-14 bg-white/5 border border-purple-500/30 rounded px-2 py-1 text-purple-300 text-xs font-bold text-center focus:outline-none focus:border-purple-400"
                />
                <span className="text-[10px] text-white/30">of <span className="text-white/50 font-bold">{totalPages}</span></span>
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} data-testid="button-agents-next"
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/3 text-white/40 hover:text-white disabled:opacity-20 text-xs transition-all">
                Next ›
              </button>
              <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} data-testid="button-agents-last"
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/3 text-white/40 hover:text-white disabled:opacity-20 text-xs transition-all font-bold">
                Last ⟫
              </button>
            </div>
          </div>
        )}
      </div>
      <AIReportPanel spawnId={viewSpawnId} onClose={() => setViewSpawnId(null)} />
    </div>
  );
}
