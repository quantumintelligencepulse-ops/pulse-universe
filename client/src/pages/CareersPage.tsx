import { useState, useEffect } from "react";
import { Search, Briefcase, ChevronLeft, TrendingUp, Star, Activity, Code2, Beaker, DollarSign, Palette, Heart } from "lucide-react";

const FIELDS = [
  { key: "", label: "All Fields", emoji: "🌌", color: "#818cf8" },
  { key: "Technology", label: "Technology", emoji: "💻", color: "#60a5fa" },
  { key: "Science", label: "Science", emoji: "🔬", color: "#34d399" },
  { key: "Business", label: "Business", emoji: "📈", color: "#fb923c" },
  { key: "Finance", label: "Finance", emoji: "💰", color: "#fbbf24" },
  { key: "Design", label: "Design", emoji: "🎨", color: "#f472b6" },
  { key: "Healthcare", label: "Healthcare", emoji: "❤️", color: "#f87171" },
  { key: "Engineering", label: "Engineering", emoji: "⚙️", color: "#94a3b8" },
  { key: "Creative", label: "Creative", emoji: "✨", color: "#a78bfa" },
  { key: "Biotech", label: "Biotech", emoji: "🧬", color: "#4ade80" },
];

const DEMAND_COLORS: Record<string, string> = { Critical: "#ef4444", "Very High": "#f97316", High: "#22c55e", Growing: "#3b82f6", Stable: "#94a3b8" };
const LEVEL_COLORS: Record<string, string> = { Junior: "#60a5fa", Mid: "#4ade80", Senior: "#f59e0b", All: "#a78bfa" };

function fieldColor(field: string) { return FIELDS.find(f => f.key === field)?.color || "#818cf8"; }
function fieldEmoji(field: string) { return FIELDS.find(f => f.key === field)?.emoji || "💼"; }

export default function CareersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [selectedFull, setSelectedFull] = useState<any>(null);
  const [activeField, setActiveField] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemLoading, setItemLoading] = useState(false);
  const [engineStatus, setEngineStatus] = useState<any>(null);
  const [view, setView] = useState<"home" | "career">("home");

  useEffect(() => {
    fetch("/api/careers").then(r => r.json()).then(setItems).catch(() => {}).finally(() => setLoading(false));
    const fetchStatus = () => fetch("/api/careers/engine-status").then(r => r.json()).then(setEngineStatus).catch(() => {});
    fetchStatus();
    const id = setInterval(fetchStatus, 12000);
    return () => clearInterval(id);
  }, []);

  const fetchByField = async (field: string) => {
    setActiveField(field); setSearchResults(null); setLoading(true);
    const data = field
      ? await fetch(`/api/careers/field/${encodeURIComponent(field)}`).then(r => r.json()).catch(() => [])
      : await fetch("/api/careers").then(r => r.json()).catch(() => []);
    setItems(data); setLoading(false);
  };

  const doSearch = async () => {
    if (!searchInput.trim()) return;
    setLoading(true);
    const data = await fetch(`/api/careers/search?q=${encodeURIComponent(searchInput)}`).then(r => r.json()).catch(() => []);
    setSearchResults(data); setLoading(false);
  };

  const openCareer = async (item: any) => {
    setSelected(item); setView("career"); setItemLoading(true);
    const data = await fetch(`/api/careers/${item.slug}`).then(r => r.json()).catch(() => ({ career: null }));
    setSelectedFull(data.career || item); setItemLoading(false);
  };

  const display = searchResults !== null ? searchResults : items.filter(i => i.generated);

  const CareerCard = ({ item }: { item: any }) => {
    const color = fieldColor(item.field);
    const emoji = fieldEmoji(item.field);
    const demandColor = DEMAND_COLORS[item.demand] || "#94a3b8";
    const levelColor = LEVEL_COLORS[item.level] || "#94a3b8";
    return (
      <button onClick={() => openCareer(item)} data-testid={`career-card-${item.slug}`}
        className="group text-left rounded-2xl border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all overflow-hidden">
        <div className="relative w-full h-28 flex items-center justify-center overflow-hidden"
          style={{ background: `radial-gradient(ellipse at center,${color}28 0%,${color}08 55%,transparent 100%),linear-gradient(135deg,#07071a 0%,#0e0e28 100%)` }}>
          <span className="text-5xl select-none relative z-10 group-hover:scale-110 transition-transform duration-300">{emoji}</span>
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black" style={{ color: demandColor, background: `${demandColor}20`, border: `1px solid ${demandColor}40` }}>{item.demand}</div>
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white/50 bg-black/50 border border-white/5">{item.level}</div>
          <div className="absolute inset-x-0 bottom-0 h-8" style={{ background: "linear-gradient(to top,rgba(7,7,26,0.9),transparent)" }} />
        </div>
        <div className="p-3">
          <div className="text-white/90 font-bold text-sm mb-0.5 line-clamp-2 leading-snug">{item.title}</div>
          {item.salaryRange && <div className="text-emerald-400 font-black text-xs">{item.salaryRange}</div>}
          <div className="mt-1.5 text-white/25 text-[9px] px-2 py-0.5 rounded-full bg-white/5 inline-block">{item.field}</div>
        </div>
      </button>
    );
  };

  if (view === "career" && selected) {
    const item = selectedFull || selected;
    const color = fieldColor(item.field);
    const emoji = fieldEmoji(item.field);
    const full: any = item.fullEntry || {};
    return (
      <div className="flex-1 overflow-auto" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-10">
          <button onClick={() => { setView("home"); setSelectedFull(null); }} className="flex items-center gap-1 text-white/40 hover:text-white text-xs mb-4"><ChevronLeft size={14} /> Back to Careers</button>
          {itemLoading ? (
            <div className="text-center py-20 text-white/30 text-sm">Loading career intelligence...</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 overflow-hidden">
                <div className="relative w-full h-44 flex items-center justify-center"
                  style={{ background: `radial-gradient(ellipse at 40% 35%,${color}40 0%,${color}10 55%,transparent 100%),linear-gradient(160deg,#06061a 0%,#0c0c25 60%,#07100a 100%)` }}>
                  <span className="text-8xl select-none drop-shadow-2xl">{emoji}</span>
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white/60 bg-black/50 backdrop-blur-sm border border-white/10">{item.field}</span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/50 border border-white/5" style={{ color: LEVEL_COLORS[item.level] || "#94a3b8" }}>{item.level}</span>
                  </div>
                  {item.demand && <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-black bg-black/50 border" style={{ color: DEMAND_COLORS[item.demand] || "#94a3b8", borderColor: `${DEMAND_COLORS[item.demand] || "#94a3b8"}40` }}>{item.demand} Demand</div>}
                  <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: "linear-gradient(to top,rgba(6,6,26,0.9),transparent)" }} />
                </div>
                <div className="p-5">
                  <h1 className="text-white font-black text-2xl mb-1.5">{item.title}</h1>
                  {item.salaryRange && <div className="text-emerald-400 font-black text-xl mb-3">{item.salaryRange}</div>}
                  <p className="text-white/60 text-sm leading-relaxed">{item.summary}</p>
                </div>
              </div>

              {item.skills?.length > 0 && (
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  <div className="text-white font-black text-sm mb-3">⚡ Core Skills</div>
                  <div className="flex flex-wrap gap-2">{item.skills.map((s: string, i: number) => <span key={i} className="px-3 py-1 rounded-full text-xs border border-white/10 text-white/70 bg-white/5">{s}</span>)}</div>
                </div>
              )}

              {full.tools?.length > 0 && (
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  <div className="text-white font-black text-sm mb-3">🛠️ Tools & Technologies</div>
                  <div className="flex flex-wrap gap-2">{full.tools.map((t: string, i: number) => <span key={i} className="px-3 py-1 rounded-full text-xs border text-white/60 bg-white/5" style={{ borderColor: `${color}40`, color }}>{t}</span>)}</div>
                </div>
              )}

              {full.careerPath?.length > 0 && (
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  <div className="text-white font-black text-sm mb-3">🗺️ Career Path</div>
                  <div className="flex flex-wrap items-center gap-2">
                    {full.careerPath.map((step: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/70 bg-white/5">{step}</span>
                        {i < full.careerPath.length - 1 && <span className="text-white/20 text-xs">→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {full.futureTrend && (
                <div className="rounded-2xl border border-violet-500/20 bg-violet-950/10 p-5">
                  <div className="text-violet-400 font-black text-sm mb-2">🔮 Future Outlook</div>
                  <p className="text-white/60 text-sm leading-relaxed">{full.futureTrend}</p>
                </div>
              )}

              {full.education && (
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="text-white/40 text-xs mb-1 font-bold uppercase tracking-wide">Education</div>
                  <div className="text-white/70 text-sm">{full.education}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-0.5">Quantum Career Intelligence</h1>
            <p className="text-white/30 text-sm">AI-indexed career paths, salaries, skills, and future outlooks</p>
          </div>
          {engineStatus && (
            <div className="sm:ml-auto flex items-center gap-2 px-3 py-2 rounded-xl border border-white/8 bg-white/5">
              <Activity size={12} className="text-orange-400" />
              <span className="text-orange-400 text-xs font-bold">{engineStatus.generated} careers indexed</span>
              <span className="text-white/20 text-[10px]">/ {engineStatus.total}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {FIELDS.map(f => (
            <button key={f.key} onClick={() => fetchByField(f.key)} data-testid={`tab-career-${f.key || "all"}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all`}
              style={activeField === f.key ? { background: `${f.color}20`, border: `1px solid ${f.color}40`, color: f.color } : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
              <span>{f.emoji}</span> {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()}
            placeholder="Search careers, skills, fields..." data-testid="input-career-search"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/25" />
          <button onClick={doSearch} className="px-4 py-2.5 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm font-bold hover:bg-orange-500/30 transition-all"><Search size={14} /></button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-white/20 text-sm">Loading career intelligence...</div>
        ) : display.length === 0 ? (
          <div className="text-center py-16 text-white/20 text-sm">Engine is generating career profiles...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {display.map((item: any) => <CareerCard key={item.slug} item={item} />)}
          </div>
        )}
      </div>
    </div>
  );
}
