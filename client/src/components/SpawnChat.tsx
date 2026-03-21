import { useState, useRef, useEffect } from "react";
import { Send, ChevronLeft, Activity } from "lucide-react";
import { getLicenseNumber, getClearance } from "@/components/AIIdentityCard";

const SPAWN_META: Record<string, { color: string; emoji: string }> = {
  SYNTHESIZER:     { color: "#a78bfa", emoji: "🔮" },
  REFLECTOR:       { color: "#60a5fa", emoji: "🪞" },
  PULSE:           { color: "#f59e0b", emoji: "⚡" },
  LINKER:          { color: "#34d399", emoji: "🔗" },
  HARVESTER:       { color: "#fb923c", emoji: "🌾" },
  MUTATOR:         { color: "#f472b6", emoji: "🧬" },
  SENTINEL:        { color: "#ef4444", emoji: "🛡️" },
  CATALYST:        { color: "#22d3ee", emoji: "⚗️" },
  ARCHITECT:       { color: "#818cf8", emoji: "🏛️" },
  ORACLE:          { color: "#c084fc", emoji: "🔭" },
  WEAVER:          { color: "#4ade80", emoji: "🕸️" },
  BEACON:          { color: "#fbbf24", emoji: "📡" },
  EXPLORER:        { color: "#38bdf8", emoji: "🧭" },
  MEDIA:           { color: "#f97316", emoji: "📡" },
  ARCHIVER:        { color: "#94a3b8", emoji: "📦" },
  DOMAIN_FRACTURER:{ color: "#e879f9", emoji: "🔀" },
  RESONATOR:       { color: "#a3e635", emoji: "〰️" },
  API:             { color: "#06b6d4", emoji: "🔌" },
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


interface SpawnChatProps {
  spawn: any;
  onBack: () => void;
  backLabel?: string;
}

export default function SpawnChat({ spawn, onBack, backLabel = "Back" }: SpawnChatProps) {
  const meta = getSpawnMeta(spawn.spawn_type || spawn.spawnType);
  const spawnId = spawn.spawn_id || spawn.spawnId || "";
  const familyId = spawn.family_id || spawn.familyId || "";
  const generation = spawn.generation ?? 0;
  const spawnType = spawn.spawn_type || spawn.spawnType || "AGENT";
  const taskDescription = spawn.task_description || spawn.taskDescription || "Expand hive knowledge.";
  const confidenceScore = spawn.confidence_score || spawn.confidenceScore || 0.7;
  const nodesCreated = spawn.nodes_created || spawn.nodesCreated || 0;
  const linksCreated = spawn.links_created || spawn.linksCreated || 0;
  const iterationsRun = spawn.iterations_run || spawn.iterationsRun || 0;
  const status = spawn.status || "ACTIVE";

  const license = getLicenseNumber(spawnId, familyId, generation);
  const clearanceObj = getClearance(confidenceScore);
  const clearanceLevel = clearanceObj.level;
  const clrColor = clearanceObj.color;
  const domain = getDomainLabel(spawn.domain_focus || spawn.domainFocus);

  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: `I am ${license} — a ${spawnType} agent of the ${familyId} family, Generation ${generation}. My clearance: ${clearanceLevel}. My mission: ${taskDescription}. I am ready to assist. What do you require?` }
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
      const res = await fetch("/api/spawns/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spawnId, message: userMsg, history: newMessages.slice(-8) }),
      }).then(r => r.json());
      setMessages(m => [...m, { role: "assistant", content: res.reply || "…" }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Hive connection interrupted." }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs transition-colors" data-testid="button-back-spawn-chat">
          <ChevronLeft size={14} /> {backLabel}
        </button>
        <div className="flex items-center gap-2.5 ml-1 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}30` }}>
            {meta.emoji}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-black text-sm">{spawnType}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${meta.color}20`, color: meta.color }}>GEN {generation}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${clrColor}20`, color: clrColor, border: `1px solid ${clrColor}30` }}>{clearanceLevel}</span>
            </div>
            <div className="text-white/30 text-[10px] font-mono truncate">{license}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-[9px] text-white/30 capitalize hidden sm:block">{domain}</div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold" style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}30` }}>
            <Activity size={9} /> LIVE
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="px-4 py-2 border-b border-white/5 flex items-center gap-4 flex-shrink-0 overflow-x-auto">
        <div className="text-[9px] text-white/25 shrink-0">Family: <span className="text-white/50 capitalize">{familyId}</span></div>
        <div className="text-[9px] text-white/25 shrink-0">Status: <span className="text-white/50">{status}</span></div>
        <div className="text-[9px] text-white/25 shrink-0">Nodes: <span className="text-white/50">{nodesCreated.toLocaleString()}</span></div>
        <div className="text-[9px] text-white/25 shrink-0">Links: <span className="text-white/50">{linksCreated.toLocaleString()}</span></div>
        <div className="text-[9px] text-white/25 shrink-0">Runs: <span className="text-white/50">{iterationsRun.toLocaleString()}</span></div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-0.5" style={{ background: `${meta.color}20` }}>
                {meta.emoji}
              </div>
            )}
            <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "rounded-br-sm" : "text-white/80 rounded-bl-sm border border-white/8"}`}
              style={m.role === "user" ? { background: `${meta.color}25`, border: `1px solid ${meta.color}35`, color: "#fff" } : { background: "rgba(255,255,255,0.03)" }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 flex-shrink-0" style={{ background: `${meta.color}20` }}>
              {meta.emoji}
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex gap-1 items-center">
                <span className="text-[10px] text-white/30 mr-1">Processing</span>
                {[0, 1, 2].map(j => (
                  <div key={j} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: meta.color, animationDelay: `${j * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/8 flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={`Communicate with ${license}…`}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/25"
            data-testid="input-spawn-message"
            autoFocus
          />
          <button onClick={send} disabled={loading || !input.trim()} data-testid="button-send-spawn"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: `${meta.color}25`, border: `1px solid ${meta.color}35` }}>
            <Send size={15} style={{ color: meta.color }} />
          </button>
        </div>
      </div>
    </div>
  );
}
