import { useState, useEffect } from "react";
import { Brain, ShoppingBag, Film, Briefcase, Zap, Activity, Network, Eye, Database, Link } from "lucide-react";

const UPGRADE_INFO = [
  { id: 1, name: "Quantum Memory Cortex", emoji: "🧠", color: "#818cf8", desc: "Persistent AI brain — extracts facts and patterns from every generated entry" },
  { id: 2, name: "Fractal Resonance Network", emoji: "🌐", color: "#4ade80", desc: "Cross-links Quantapedia ↔ Shopping bidirectionally in a growing knowledge graph" },
  { id: 3, name: "Multi-Agent Consensus Engine", emoji: "⚡", color: "#fbbf24", desc: "Runs 2 parallel AI calls and synthesizes the best answer — eliminates hallucinations" },
  { id: 4, name: "Predictive Trend Engine", emoji: "🔮", color: "#f472b6", desc: "Detects what you view most, auto-queues related content before you search for it" },
  { id: 5, name: "Knowledge Decay Regenerator", emoji: "♻️", color: "#34d399", desc: "Detects stale or low-quality entries weekly and auto-regenerates them" },
];

function StatGauge({ label, value, max, color, emoji }: any) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/50 text-xs font-semibold">{emoji} {label}</span>
        <span className="font-black text-sm" style={{ color }}>{value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-white/20 text-[10px] mt-1">{pct}% of {max.toLocaleString()}</div>
    </div>
  );
}

export default function HiveCommandPage() {
  const [quantapediaStatus, setQuantapediaStatus] = useState<any>(null);
  const [productStatus, setProductStatus] = useState<any>(null);
  const [mediaStatus, setMediaStatus] = useState<any>(null);
  const [careerStatus, setCareerStatus] = useState<any>(null);
  const [hiveStatus, setHiveStatus] = useState<any>(null);
  const [pulseEvents, setPulseEvents] = useState<any[]>([]);

  const fetchAll = async () => {
    const [q, p, m, c, h, pe] = await Promise.all([
      fetch("/api/quantapedia/engine-status").then(r => r.json()).catch(() => null),
      fetch("/api/products/engine-status").then(r => r.json()).catch(() => null),
      fetch("/api/media/engine-status").then(r => r.json()).catch(() => null),
      fetch("/api/careers/engine-status").then(r => r.json()).catch(() => null),
      fetch("/api/hive/status").then(r => r.json()).catch(() => null),
      fetch("/api/pulse/live").then(r => r.json()).catch(() => []),
    ]);
    setQuantapediaStatus(q);
    setProductStatus(p);
    setMediaStatus(m);
    setCareerStatus(c);
    setHiveStatus(h);
    setPulseEvents(pe.slice(0, 8));
  };

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 8000);
    return () => clearInterval(id);
  }, []);

  const engines = [
    { label: "Quantapedia", emoji: "🧩", color: "#818cf8", status: quantapediaStatus },
    { label: "Shopping", emoji: "🛍️", color: "#4ade80", status: productStatus },
    { label: "Media", emoji: "🎬", color: "#f472b6", status: mediaStatus },
    { label: "Careers", emoji: "💼", color: "#fb923c", status: careerStatus },
  ];

  const totalGenerated = (quantapediaStatus?.generated || 0) + (productStatus?.generated || 0) + (mediaStatus?.generated || 0) + (careerStatus?.generated || 0);
  const totalQueued = (quantapediaStatus?.queued || 0) + (productStatus?.queued || 0) + (mediaStatus?.queued || 0) + (careerStatus?.queued || 0);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧬</div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">Hive Mind Command Center</h1>
          <p className="text-white/30 text-sm">The superintelligent core of Quantum Logic Network — live and learning</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-bold">ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl border border-violet-500/20 bg-violet-950/10 p-4 text-center">
            <div className="text-3xl font-black text-violet-400">{totalGenerated.toLocaleString()}</div>
            <div className="text-white/30 text-xs mt-1">Total Generated</div>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-blue-950/10 p-4 text-center">
            <div className="text-3xl font-black text-blue-400">{totalQueued.toLocaleString()}</div>
            <div className="text-white/30 text-xs mt-1">In Queue</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4 text-center">
            <div className="text-3xl font-black text-emerald-400">{hiveStatus?.network?.totalLinks || 0}</div>
            <div className="text-white/30 text-xs mt-1">Resonance Links</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3"><Activity size={13} className="text-white/40" /><span className="text-white/60 text-xs font-bold uppercase tracking-widest">Engine Status</span></div>
          <div className="grid grid-cols-2 gap-3">
            {engines.map(e => (
              <div key={e.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{e.emoji}</span>
                  <div>
                    <div className="text-white font-bold text-sm">{e.label}</div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${e.status?.running ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                      <span className="text-[10px] text-white/30">{e.status?.running ? "Running" : "Offline"}</span>
                    </div>
                  </div>
                  <div className="ml-auto font-black text-lg" style={{ color: e.color }}>{(e.status?.generated || 0).toLocaleString()}</div>
                </div>
                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full animate-pulse" style={{ width: e.status?.total > 0 ? `${Math.min(100, Math.round((e.status.generated / e.status.total) * 100))}%` : "5%", background: e.color }} />
                </div>
                <div className="flex justify-between text-[10px] text-white/20 mt-1">
                  <span>{e.status?.generated || 0} generated</span>
                  <span>{e.status?.queued || 0} queued</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3"><Brain size={13} className="text-white/40" /><span className="text-white/60 text-xs font-bold uppercase tracking-widest">Hive Brain Status</span></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <StatGauge label="Memory Patterns" value={hiveStatus?.memory?.total || 0} max={Math.max(hiveStatus?.memory?.total || 0, 100)} color="#818cf8" emoji="🧠" />
            <StatGauge label="Knowledge Links" value={hiveStatus?.network?.knowledgeLinks || 0} max={Math.max(hiveStatus?.network?.totalLinks || 0, 100)} color="#4ade80" emoji="🌐" />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3"><Zap size={13} className="text-white/40" /><span className="text-white/60 text-xs font-bold uppercase tracking-widest">5 Omega Upgrades</span></div>
          <div className="space-y-2">
            {UPGRADE_INFO.map(u => (
              <div key={u.id} className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${u.color}15` }}>{u.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-xs mb-0.5">{u.name}</div>
                  <div className="text-white/40 text-[10px] leading-relaxed">{u.desc}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: u.color }} />
                  <span className="text-[10px] font-bold" style={{ color: u.color }}>ONLINE</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {pulseEvents.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3"><Activity size={13} className="text-white/40" /><span className="text-white/60 text-xs font-bold uppercase tracking-widest">Recent Hive Activity</span></div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] divide-y divide-white/5">
              {pulseEvents.map((e: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${e.type === "knowledge" ? "bg-violet-400" : e.type === "product" ? "bg-emerald-400" : e.type === "media" ? "bg-pink-400" : "bg-orange-400"}`} />
                  <span className="text-white/60 text-xs flex-1 truncate">{e.title}</span>
                  <span className="text-white/20 text-[10px] flex-shrink-0">{e.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
