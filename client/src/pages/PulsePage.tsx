import { useState, useEffect, useRef } from "react";
import { Zap, Brain, ShoppingBag, BookOpen, Film, Briefcase, Activity, Radio } from "lucide-react";

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  knowledge: { label: "Knowledge", color: "#818cf8", icon: Brain, bg: "#818cf820" },
  product: { label: "Product", color: "#4ade80", icon: ShoppingBag, bg: "#4ade8020" },
  media: { label: "Media", color: "#f472b6", icon: Film, bg: "#f472b620" },
  career: { label: "Career", color: "#fb923c", icon: Briefcase, bg: "#fb923c20" },
  quantapedia: { label: "Quantapedia", color: "#818cf8", icon: BookOpen, bg: "#818cf820" },
};

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function PulsePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [live, setLive] = useState(true);
  const [tick, setTick] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchEvents = async () => {
    const data = await fetch("/api/pulse/live").then(r => r.json()).catch(() => []);
    setEvents(data);
  };

  useEffect(() => {
    fetchEvents();
    const id = setInterval(() => { if (live) fetchEvents(); setTick(t => t + 1); }, 3000);
    return () => clearInterval(id);
  }, [live]);

  const totalToday = events.length;
  const byType = events.reduce((acc: any, e: any) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {});

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">Live</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Live World Pulse</h1>
            <p className="text-white/30 text-sm mt-0.5">Every discovery the Hive makes, in real time</p>
          </div>
          <button onClick={() => setLive(l => !l)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${live ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/5 text-white/40"}`}>
            <Radio size={12} /> {live ? "LIVE" : "PAUSED"}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
            const count = byType[type] || 0;
            const Icon = cfg.icon;
            return (
              <div key={type} className="rounded-xl border border-white/8 p-3" style={{ background: cfg.bg }}>
                <Icon size={14} style={{ color: cfg.color }} className="mb-1.5" />
                <div className="text-xl font-black" style={{ color: cfg.color }}>{count}</div>
                <div className="text-white/40 text-[10px] font-semibold">{cfg.label}</div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
            <Activity size={13} className="text-white/40" />
            <span className="text-white/60 text-xs font-semibold">Hive Activity Stream</span>
            <span className="ml-auto text-white/20 text-[10px]">{totalToday} events recorded</span>
          </div>
          <div ref={listRef} className="divide-y divide-white/5">
            {events.length === 0 ? (
              <div className="py-16 text-center text-white/20 text-sm">Waiting for Hive activity...</div>
            ) : events.map((e: any, i: number) => {
              const cfg = TYPE_CONFIG[e.type] || { label: e.type, color: "#ffffff", icon: Zap, bg: "#ffffff10" };
              const Icon = cfg.icon;
              return (
                <div key={e.id || i} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors group">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: cfg.bg }}>
                    <Icon size={12} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/80 text-sm font-medium leading-snug truncate">{e.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
                      {e.domain && <span className="text-white/20 text-[10px]">{e.domain}</span>}
                    </div>
                  </div>
                  <div className="text-white/20 text-[10px] flex-shrink-0 mt-0.5">{timeAgo(e.createdAt)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
