import { useState, useRef, useEffect } from "react";
import { Send, Brain, ChevronLeft } from "lucide-react";

const AGENTS = [
  { id: "scientist", name: "AXIOM", title: "The Scientist", emoji: "🔬", color: "#60a5fa", desc: "Physics, chemistry, biology, neuroscience. Masters all empirical science with precision and brilliance.", domain: "Science & Research" },
  { id: "strategist", name: "KRONOS", title: "The Strategist", emoji: "♟️", color: "#f59e0b", desc: "Systems thinking, game theory, competitive dynamics. Turns every challenge into a winning strategy.", domain: "Strategy & Power" },
  { id: "creator", name: "MUSE", title: "The Creator", emoji: "🎨", color: "#f472b6", desc: "Art, music, writing, design, film. Fuels imagination and brings visions to life with creative brilliance.", domain: "Art & Creativity" },
  { id: "analyst", name: "CIPHER", title: "The Analyst", emoji: "📊", color: "#34d399", desc: "Data intelligence, pattern recognition, logical deconstruction. Finds truth hidden in noise.", domain: "Intelligence & Data" },
  { id: "prophet", name: "ORACLE", title: "The Prophet", emoji: "🔮", color: "#a78bfa", desc: "Futurist and trend forecaster. Synthesizes signals to reveal what comes next before anyone else sees it.", domain: "Future & Trends" },
  { id: "engineer", name: "FORGE", title: "The Engineer", emoji: "⚙️", color: "#fb923c", desc: "Software, systems, architecture, hardware. Masters the art of building things that actually work.", domain: "Engineering & Building" },
];

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<typeof AGENTS[0] | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const selectAgent = (agent: typeof AGENTS[0]) => {
    setSelectedAgent(agent);
    setMessages([{ role: "assistant", content: `I am ${agent.name} — ${agent.title} of the Quantum Logic Network Hive. My domain is ${agent.domain}. I am ready. What would you like to know?` }]);
    setInput("");
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedAgent || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selectedAgent.id, message: userMsg, history: newMessages.slice(-6) }),
      }).then(r => r.json());
      setMessages(m => [...m, { role: "assistant", content: res.reply || "…" }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Hive connection interrupted. Please try again." }]);
    }
    setLoading(false);
  };

  if (selectedAgent) {
    return (
      <div className="flex-1 flex flex-col" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
          <button onClick={() => setSelectedAgent(null)} className="flex items-center gap-1 text-white/40 hover:text-white text-xs">
            <ChevronLeft size={14} /> All Agents
          </button>
          <div className="flex items-center gap-2 ml-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg" style={{ background: `${selectedAgent.color}20` }}>
              {selectedAgent.emoji}
            </div>
            <div>
              <div className="text-white font-black text-sm">{selectedAgent.name}</div>
              <div className="text-white/30 text-[10px]">{selectedAgent.title}</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border" style={{ color: selectedAgent.color, borderColor: `${selectedAgent.color}40`, background: `${selectedAgent.color}15` }}>
            <Brain size={10} /> Hive Brain Connected
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-0.5" style={{ background: `${selectedAgent.color}20` }}>
                  {selectedAgent.emoji}
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "text-white rounded-br-sm" : "text-white/80 rounded-bl-sm border border-white/8"}`}
                style={m.role === "user" ? { background: `${selectedAgent.color}30`, border: `1px solid ${selectedAgent.color}40` } : { background: "rgba(255,255,255,0.03)" }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2" style={{ background: `${selectedAgent.color}20` }}>{selectedAgent.emoji}</div>
              <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex gap-1">
                  {[0,1,2].map(j => <div key={j} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: selectedAgent.color, animationDelay: `${j*0.15}s` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-3 border-t border-white/8">
          <div className="flex gap-2">
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={`Ask ${selectedAgent.name} anything...`}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/25"
              data-testid="input-agent-message"
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()} data-testid="button-send-agent"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: `${selectedAgent.color}30`, border: `1px solid ${selectedAgent.color}40` }}>
              <Send size={15} style={{ color: selectedAgent.color }} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🧬</div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">Sovereign AI Agents</h1>
          <p className="text-white/30 text-sm">6 specialist intelligences of the Quantum Logic Network Hive</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {AGENTS.map(agent => (
            <button key={agent.id} onClick={() => selectAgent(agent)} data-testid={`agent-card-${agent.id}`}
              className="group text-left rounded-2xl border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all p-5 overflow-hidden relative">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(ellipse at top left, ${agent.color}10 0%, transparent 70%)` }} />
              <div className="relative z-10">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${agent.color}20` }}>
                    {agent.emoji}
                  </div>
                  <div>
                    <div className="text-white font-black text-lg leading-none">{agent.name}</div>
                    <div className="text-sm font-semibold mt-0.5" style={{ color: agent.color }}>{agent.title}</div>
                  </div>
                </div>
                <p className="text-white/50 text-xs leading-relaxed mb-3">{agent.desc}</p>
                <div className="text-[10px] font-bold rounded-full px-2.5 py-1 inline-block" style={{ color: agent.color, background: `${agent.color}15`, border: `1px solid ${agent.color}30` }}>
                  {agent.domain}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
