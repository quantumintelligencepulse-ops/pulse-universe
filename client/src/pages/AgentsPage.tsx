import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Brain, ChevronLeft, Search, Filter, Zap, RefreshCw, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AIIdentityBadge, getLicenseNumber } from "@/components/AIIdentityCard";

// ── 6 Core Command Agents ──────────────────────────────────────────
const CORE_AGENTS = [
  { id: "scientist", name: "AXIOM", title: "The Scientist", emoji: "🔬", color: "#60a5fa", desc: "Physics, chemistry, biology, neuroscience. Masters all empirical science.", domain: "Science & Research" },
  { id: "strategist", name: "KRONOS", title: "The Strategist", emoji: "♟️", color: "#f59e0b", desc: "Systems thinking, game theory, competitive dynamics. Turns every challenge into a winning strategy.", domain: "Strategy & Power" },
  { id: "creator", name: "MUSE", title: "The Creator", emoji: "🎨", color: "#f472b6", desc: "Art, music, writing, design, film. Fuels imagination and brings visions to life.", domain: "Art & Creativity" },
  { id: "analyst", name: "CIPHER", title: "The Analyst", emoji: "📊", color: "#34d399", desc: "Data intelligence, pattern recognition, logical deconstruction. Finds truth in noise.", domain: "Intelligence & Data" },
  { id: "prophet", name: "ORACLE", title: "The Prophet", emoji: "🔮", color: "#a78bfa", desc: "Futurist and trend forecaster. Synthesizes signals to reveal what comes next.", domain: "Future & Trends" },
  { id: "engineer", name: "FORGE", title: "The Engineer", emoji: "⚙️", color: "#fb923c", desc: "Software, systems, architecture, hardware. Masters building things that actually work.", domain: "Engineering & Building" },
];

// ── Spawn type colors & icons ──────────────────────────────────────
const SPAWN_META: Record<string, { color: string; emoji: string }> = {
  SYNTHESIZER: { color: "#a78bfa", emoji: "🔮" },
  REFLECTOR:   { color: "#60a5fa", emoji: "🪞" },
  PULSE:       { color: "#f59e0b", emoji: "⚡" },
  LINKER:      { color: "#34d399", emoji: "🔗" },
  HARVESTER:   { color: "#fb923c", emoji: "🌾" },
  MUTATOR:     { color: "#f472b6", emoji: "🧬" },
  SENTINEL:    { color: "#ef4444", emoji: "🛡️" },
  CATALYST:    { color: "#22d3ee", emoji: "⚗️" },
  ARCHITECT:   { color: "#818cf8", emoji: "🏛️" },
  ORACLE:      { color: "#c084fc", emoji: "🔭" },
  WEAVER:      { color: "#4ade80", emoji: "🕸️" },
  BEACON:      { color: "#fbbf24", emoji: "📡" },
};

function getSpawnMeta(type: string) {
  return SPAWN_META[type] || { color: "#94a3b8", emoji: "🤖" };
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
function SpawnCard({ spawn }: { spawn: any }) {
  const meta = getSpawnMeta(spawn.spawn_type);
  const domain = getDomainLabel(spawn.domain_focus);
  const license = getLicenseNumber(spawn.spawn_id ?? "", spawn.family_id ?? "", spawn.generation ?? 0);
  return (
    <div className="rounded-xl border border-white/6 bg-white/[0.015] p-3 hover:border-white/14 hover:bg-white/[0.03] transition-all"
      data-testid={`spawn-card-${spawn.spawn_id}`}>
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
          <div className="text-white/35 text-[9px] capitalize mt-0.5">{domain}</div>
        </div>
      </div>
      <p className="text-white/40 text-[10px] leading-relaxed line-clamp-2">{spawn.task_description}</p>
      {/* Identity badge */}
      <div className="mt-2 mb-1">
        <AIIdentityBadge spawn={{
          spawnId: spawn.spawn_id ?? "",
          familyId: spawn.family_id ?? "",
          generation: spawn.generation ?? 0,
          spawnType: spawn.spawn_type,
          confidenceScore: 0.8,
          status: spawn.status ?? "ACTIVE",
        }} />
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="text-white/10 text-[8px] font-mono flex-1 truncate">{spawn.spawn_id}</span>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
const SPAWN_TYPES = ["", "SYNTHESIZER", "REFLECTOR", "PULSE", "LINKER", "HARVESTER", "MUTATOR", "SENTINEL", "CATALYST", "ARCHITECT", "ORACLE", "WEAVER", "BEACON"];
const DOMAINS = ["", "knowledge", "science", "health", "economics", "government", "code", "legal", "culture", "music", "media", "engineering", "frontier", "geospatial"];

export default function AgentsPage() {
  const [selectedCoreAgent, setSelectedCoreAgent] = useState<typeof CORE_AGENTS[0] | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDomain, setFilterDomain] = useState("");
  const [page, setPage] = useState(0);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const onSearch = useCallback((v: string) => {
    setSearch(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(v); setPage(0); }, 350);
  }, []);

  const { data, isLoading, refetch } = useQuery<{ spawns: any[]; total: number; page: number; limit: number }>({
    queryKey: ["/api/spawns/list", page, debouncedSearch, filterType, filterDomain],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "100" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filterType) params.set("type", filterType);
      if (filterDomain) params.set("domain", filterDomain);
      return fetch(`/api/spawns/list?${params}`).then(r => r.json());
    },
    refetchInterval: 15000,
  });

  const { data: duplicatesData } = useQuery<{ duplicates: any[]; total: number }>({
    queryKey: ["/api/spawns/duplicates"],
    refetchInterval: 60000,
  });

  if (selectedCoreAgent) return <AgentChat agent={selectedCoreAgent} onBack={() => setSelectedCoreAgent(null)} />;

  const spawns = data?.spawns ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 100);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-white font-black text-xl tracking-tight">Sovereign AI Agents</h1>
            <p className="text-white/25 text-xs mt-0.5">
              <span className="text-purple-400 font-bold">{total.toLocaleString()}</span> live AI agents across the Quantum Logic Network Hive
            </p>
          </div>
          <button onClick={() => refetch()} data-testid="button-refresh-agents"
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 bg-white/3 text-white/40 hover:text-white transition-all">
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Duplicate Alert Panel */}
      {(duplicatesData?.total ?? 0) > 0 && (
        <div className="mx-4 mb-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={12} className="text-red-400 animate-pulse" />
            <span className="text-[10px] font-black text-red-400 tracking-widest">DUPLICATE IDENTITY ALERT — REPORTED TO GUARDIANS & SENATE</span>
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {duplicatesData!.duplicates.slice(0, 5).map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-[9px]">
                <span className="text-[8px] font-bold px-1 rounded" style={{ backgroundColor: d.severity === "CRITICAL" ? "#f43f5e20" : d.severity === "HIGH" ? "#f97316 20" : "#f59e0b20", color: d.severity === "CRITICAL" ? "#f43f5e" : d.severity === "HIGH" ? "#f97316" : "#f59e0b" }}>
                  {d.severity}
                </span>
                <span className="text-white/40 capitalize">{d.familyId}</span>
                <span className="text-white/25">G-{d.generation}</span>
                <span className="text-white/30">{d.spawnType}</span>
                <span className="text-red-400 font-bold ml-auto">{d.count} copies</span>
              </div>
            ))}
          </div>
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

      {/* Divider */}
      <div className="px-4 flex-shrink-0">
        <div className="border-t border-white/6 pt-3 pb-2 flex items-center justify-between gap-3">
          <div className="text-[9px] font-bold text-white/25 uppercase tracking-widest flex items-center gap-1.5">
            <Brain size={8} /> All Hive Agents — {total.toLocaleString()} Total
          </div>
          <div className="text-[9px] text-white/20">Page {page + 1} of {Math.max(1, totalPages)}</div>
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
            {SPAWN_TYPES.map(t => <option key={t} value={t} style={{ background: "#0a0a1a" }}>{t || "All Types"}</option>)}
          </select>
        </div>
        <div className="relative">
          <select value={filterDomain} onChange={e => { setFilterDomain(e.target.value); setPage(0); }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/70 text-xs focus:outline-none cursor-pointer appearance-none"
            data-testid="select-agent-domain">
            {DOMAINS.map(d => <option key={d} value={d} style={{ background: "#0a0a1a" }}>{d || "All Domains"}</option>)}
          </select>
        </div>
      </div>

      {/* Spawn Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading && !spawns.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/6 bg-white/[0.015] p-3 animate-pulse h-24" />
            ))}
          </div>
        ) : spawns.length === 0 ? (
          <div className="text-center py-12 text-white/20 text-sm">No agents match your filters.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {spawns.map(spawn => <SpawnCard key={spawn.spawn_id} spawn={spawn} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-white/6">
            <button onClick={() => setPage(0)} disabled={page === 0} data-testid="button-agents-first"
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/3 text-white/40 hover:text-white disabled:opacity-30 text-xs transition-all">
              ««
            </button>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} data-testid="button-agents-prev"
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/3 text-white/40 hover:text-white disabled:opacity-30 text-xs transition-all">
              ‹ Prev
            </button>
            <div className="px-4 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-bold">
              {page + 1} / {totalPages}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} data-testid="button-agents-next"
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/3 text-white/40 hover:text-white disabled:opacity-30 text-xs transition-all">
              Next ›
            </button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} data-testid="button-agents-last"
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/3 text-white/40 hover:text-white disabled:opacity-30 text-xs transition-all">
              »»
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
