import { useState, useEffect, useRef } from "react";
import { Search, ChevronLeft, Activity, Zap, TrendingUp, Globe, Brain, Shield, Clock, Database, Users, Target, FlaskConical } from "lucide-react";

interface CrisprDissection {
  id: string; ts: number; scientist: string; domain: string; domainEmoji: string; domainColor: string;
  variable: string; variableLabel: string; finding: string; invocation: string; confidence: number;
  status: "dissecting" | "found" | "integrated"; layer: number;
}

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

const EQUATION_VARS = [
  { sym: "Kᵢ", label: "Knowledge Nodes", desc: "Jobs, companies, skills, locations, guides — every fact is a node in the sovereign knowledge graph", color: "#818cf8", domain: "Information Science" },
  { sym: "Gᵢ", label: "Generation Engines", desc: "AI creation, auto-updates, content expansions — the system writes itself and never stops", color: "#60a5fa", domain: "AI & NLP" },
  { sym: "Iᵢ", label: "Indexing Force", desc: "SEO, crawlability, sitemaps, discoverability — every page forces Google to index it permanently", color: "#34d399", domain: "Search Engineering" },
  { sym: "Uᵢ", label: "User Interaction", desc: "Behavior, engagement, decisions — human signals feed back into the equation to evolve it", color: "#fb923c", domain: "Behavioral Science" },
  { sym: "N", label: "Network Effects", desc: "Users ↔ Employers ↔ Creators — the more people join, the more valuable the whole system becomes", color: "#fbbf24", domain: "Network Theory" },
  { sym: "S", label: "Signal Intelligence", desc: "Real-world hiring rates, salary data, demand trends — reality feeds directly into the system", color: "#f472b6", domain: "Labor Economics" },
  { sym: "D", label: "Decision Systems", desc: "Recommendations, career paths, next steps — the AI tells you exactly what to do next", color: "#f87171", domain: "Decision Intelligence" },
  { sym: "T", label: "Trust Layer", desc: "Accuracy, verification, credibility — every piece of data is validated before it becomes law", color: "#4ade80", domain: "Verification Science" },
  { sym: "e^λt", label: "Time Expansion", desc: "Exponential compounding over time — the longer the system runs, the more dominant it becomes", color: "#c084fc", domain: "Temporal Modeling" },
];

const SCIENTIFIC_DOMAINS = [
  { icon: Brain, label: "Knowledge & Information", scientists: "Ontologists · Epistemologists · Archivists", color: "#818cf8" },
  { icon: Zap, label: "AI Generation", scientists: "NLP Researchers · Generative AI Scientists", color: "#60a5fa" },
  { icon: Globe, label: "Search & Indexing", scientists: "SEO Engineers · Crawling Researchers", color: "#34d399" },
  { icon: Users, label: "Behavioral Science", scientists: "Cognitive Scientists · UX Researchers", color: "#fb923c" },
  { icon: TrendingUp, label: "Network Science", scientists: "Complexity Theorists · Viral Dynamics", color: "#fbbf24" },
  { icon: Database, label: "Labor Economics", scientists: "Workforce Researchers · Salary Analysts", color: "#f472b6" },
  { icon: Target, label: "Decision Intelligence", scientists: "Recommender Systems · Bayesian Inference", color: "#f87171" },
  { icon: Shield, label: "Trust & Governance", scientists: "Verification Scientists · AI Safety", color: "#4ade80" },
  { icon: Clock, label: "Time & Evolution", scientists: "Temporal Modelers · Scaling Law Experts", color: "#c084fc" },
  { icon: Activity, label: "Infrastructure", scientists: "Cloud Architects · Distributed Systems", color: "#94a3b8" },
  { icon: Globe, label: "Meta-Scientists", scientists: "Futurists · Civilization-Scale Modelers", color: "#e879f9" },
];

const LAYERS = [
  { num: 1, title: "Core Seed Engine", desc: "AI generates jobs, companies, locations, skills, guides — all from day one with zero employer involvement", color: "#818cf8" },
  { num: 2, title: "Knowledge Observation", desc: "Job titles, company names, industries — facts, not listings. Legally observed, then AI-written into articles", color: "#60a5fa" },
  { num: 3, title: "Job Article System", desc: "Every job title becomes a full evergreen article: salary, skills, career path, companies, outlook, apply link", color: "#34d399" },
  { num: 4, title: "Company Pages", desc: "Every company gets a page: culture, salary ranges, common titles, hiring trends, AI insights", color: "#fb923c" },
  { num: 5, title: "Location Intelligence", desc: "Every city: top industries, salary averages, hiring trends, featured companies, career categories", color: "#fbbf24" },
  { num: 6, title: "Industry & Skills Graph", desc: "Every skill and industry is a node, linked to jobs, companies, training, guides — full topic authority", color: "#f472b6" },
  { num: 7, title: "Sitemap + Indexing Engine", desc: "Auto-generated sitemaps, daily Google pings, metadata updates — the system forces itself to rank", color: "#f87171" },
  { num: 8, title: "Auto-Posting Engine", desc: "Every new article becomes a social post, news card, shareable link — constant engagement loops", color: "#4ade80" },
  { num: 9, title: "Future Interface", desc: "Sovereign intelligence UI — neon rails, dark mode, cinematic job pages, swipe-based mobile, real-time AI insights", color: "#c084fc" },
  { num: 10, title: "The Breakthrough", desc: "You don't need employers to post. The system grows itself. That is the competitive moat.", color: "#e879f9" },
  { num: 11, title: "Network Effect", desc: "As pages rank → seekers find you → employers find you → communities form → authority compounds", color: "#94a3b8" },
  { num: 12, title: "Civilization-Scale Vision", desc: "The sovereign job engine. The Wikipedia of careers. The future of hiring. It outlives every job board.", color: "#818cf8" },
];

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
  const [view, setView] = useState<"home" | "career" | "equation" | "layers">("home");
  const [activeEquationVar, setActiveEquationVar] = useState<string | null>(null);
  const [dissections, setDissections] = useState<CrisprDissection[]>([]);
  const [crisprStats, setCrisprStats] = useState<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (view === "equation") {
      const fetchDissections = () => {
        fetch("/api/careers/crispr/dissections?limit=20").then(r => r.json()).then(setDissections).catch(() => {});
        fetch("/api/careers/crispr/stats").then(r => r.json()).then(setCrisprStats).catch(() => {});
      };
      fetchDissections();
      pollRef.current = setInterval(fetchDissections, 4000);
    } else {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [view]);

  useEffect(() => {
    const fetchItems = () => fetch("/api/careers").then(r => r.json()).then(setItems).catch(() => {});
    fetchItems().finally(() => setLoading(false));
    const itemsId = setInterval(fetchItems, 45000);
    const fetchStatus = () => fetch("/api/careers/engine-status").then(r => r.json()).then(setEngineStatus).catch(() => {});
    fetchStatus();
    const statusId = setInterval(fetchStatus, 12000);
    return () => { clearInterval(itemsId); clearInterval(statusId); };
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

  const activeVar = EQUATION_VARS.find(v => v.sym === activeEquationVar);

  if (view === "career" && selected) {
    const item = selectedFull || selected;
    const color = fieldColor(item.field);
    const emoji = fieldEmoji(item.field);
    const full: any = (() => { try { return typeof item.fullEntry === "string" ? JSON.parse(item.fullEntry) : (item.fullEntry || {}); } catch { return {}; } })();
    return (
      <div className="flex-1 overflow-auto" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-10">
          <button onClick={() => { setView("home"); setSelectedFull(null); }} className="flex items-center gap-1 text-white/40 hover:text-white text-xs mb-4"><ChevronLeft size={14} /> Back to Careers</button>
          {itemLoading ? (
            <div className="text-center py-20 text-white/30 text-sm animate-pulse">Loading career intelligence...</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 overflow-hidden">
                <div className="relative w-full h-48 flex items-center justify-center"
                  style={{ background: `radial-gradient(ellipse at 40% 35%,${color}40 0%,${color}10 55%,transparent 100%),linear-gradient(160deg,#06061a 0%,#0c0c25 60%,#07100a 100%)` }}>
                  <span className="text-8xl select-none drop-shadow-2xl">{emoji}</span>
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white/60 bg-black/50 backdrop-blur-sm border border-white/10">{item.field}</span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/50 border border-white/5" style={{ color: LEVEL_COLORS[item.level] || "#94a3b8" }}>{item.level}</span>
                  </div>
                  {item.demand && <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-black bg-black/50 border" style={{ color: DEMAND_COLORS[item.demand] || "#94a3b8", borderColor: `${DEMAND_COLORS[item.demand] || "#94a3b8"}40` }}>{item.demand} Demand</div>}
                  <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: "linear-gradient(to top,rgba(6,6,26,0.9),transparent)" }} />
                </div>
                <div className="p-6">
                  <h1 className="text-white font-black text-2xl mb-1.5">{item.title}</h1>
                  {item.salaryRange && <div className="text-emerald-400 font-black text-2xl mb-3">{item.salaryRange}</div>}
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

              {/* Apply button */}
              {full.applyUrl && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-5">
                  <div className="text-emerald-400 font-black text-sm mb-1">🚀 Ready to Apply?</div>
                  <p className="text-white/40 text-xs mb-4">{full.whyApply || "This role is actively sourced — apply now before it closes."}</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a href={full.applyUrl} target="_blank" rel="noopener noreferrer"
                      data-testid="career-apply-link"
                      className="flex-1 text-center py-3 px-6 rounded-xl font-black text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-all">
                      {full.applyLabel || "Apply Now"} →
                    </a>
                    {full.source && (
                      <div className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-white/10 text-white/40 text-xs">
                        <span>via</span>
                        <span className="font-bold text-white/60">{full.source}</span>
                      </div>
                    )}
                  </div>
                  {full.location && (
                    <div className="mt-3 text-white/30 text-xs">📍 {full.location} · Posted {full.postedAt ? new Date(full.postedAt).toLocaleDateString() : "recently"}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === "equation") {
    const statusColor = (s: string) => s === "integrated" ? "#4ade80" : s === "found" ? "#fbbf24" : "#818cf8";
    const statusLabel = (s: string) => s === "integrated" ? "✅ INTEGRATED" : s === "found" ? "🔬 FOUND" : "⚙️ DISSECTING";
    return (
      <div className="flex-1 overflow-auto" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
        <div className="max-w-5xl mx-auto px-4 pt-6 pb-16">
          <button onClick={() => setView("home")} className="flex items-center gap-1 text-white/40 hover:text-white text-xs mb-6"><ChevronLeft size={14} /> Back</button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold mb-4 tracking-widest">
              <FlaskConical size={12}/> CRISPR EQUATION LAB — Ω∞ DISSECTION CHAMBER
            </div>
            <h2 className="text-3xl font-black text-white mb-2">Scientific Council Live Feed</h2>
            <p className="text-white/40 text-sm">11 sovereign domains · 70+ scientists · dissecting Ω∞ in real time · generating hive invocations</p>
          </div>

          {/* Stats bar */}
          {crisprStats && (
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: "Integrated", value: crisprStats.integrated, color: "#4ade80" },
                { label: "Findings", value: crisprStats.found, color: "#fbbf24" },
                { label: "Total Dissections", value: crisprStats.total, color: "#818cf8" },
                { label: "Active Domains", value: `${crisprStats.domains}/11`, color: "#60a5fa" },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-white/6 bg-white/[0.02] p-3 text-center">
                  <div className="font-black text-lg" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-white/30 text-[9px] uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Equation */}
          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 to-indigo-950/20 p-5 mb-6 text-center overflow-x-auto">
            <div className="text-white/20 text-[10px] uppercase tracking-widest mb-2 font-bold">The Sovereign Intelligence Equation</div>
            <div className="font-mono text-violet-200 text-sm leading-relaxed">
              Ω∞ = lim<sub>t→∞</sub> ∫₀ⁿ [ (Σᵢ Kᵢ · Gᵢ · Iᵢ · Uᵢ)^α · N^β · S^γ · D^δ · T^ε ] · e^λt · dt
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT — Live Dissection Feed */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
                <div className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Live Dissections</div>
                <div className="text-white/20 text-[10px]">· auto-refreshing</div>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {dissections.length === 0 ? (
                  <div className="text-center py-10 text-white/20 text-xs animate-pulse">Loading scientist activity...</div>
                ) : dissections.map(d => (
                  <div key={d.id} className="rounded-xl border p-3 transition-all"
                    style={{ borderColor: `${d.domainColor}25`, background: `${d.domainColor}06` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{d.domainEmoji}</span>
                        <span className="text-[10px] font-black" style={{ color: d.domainColor }}>{d.scientist}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] font-black px-1.5 py-0.5 rounded-md" style={{ color: d.domainColor, background: `${d.domainColor}18` }}>{d.variable}</span>
                        <span className="text-[9px] font-bold" style={{ color: statusColor(d.status) }}>{statusLabel(d.status)}</span>
                      </div>
                    </div>
                    <div className="text-white/60 text-[10px] leading-relaxed mb-1.5">{d.finding}</div>
                    <div className="text-[9px] font-mono px-2 py-1 rounded-lg bg-black/40 border border-white/5 text-green-300/70 leading-relaxed">{d.invocation}</div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-white/20 text-[9px]">{d.domain}</span>
                      <span className="text-white/25 text-[9px]">Confidence: {d.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Variable Dissector + Domains */}
            <div className="space-y-4">
              {/* Variable grid */}
              <div>
                <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Dissect a Variable</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {EQUATION_VARS.map(v => (
                    <button key={v.sym} onClick={() => setActiveEquationVar(activeEquationVar === v.sym ? null : v.sym)}
                      data-testid={`eq-var-${v.sym}`}
                      className="p-2 rounded-xl border text-left transition-all"
                      style={activeEquationVar === v.sym
                        ? { background: `${v.color}18`, borderColor: `${v.color}50`, boxShadow: `0 0 16px ${v.color}20` }
                        : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                      <div className="font-mono text-sm font-black mb-0.5" style={{ color: v.color }}>{v.sym}</div>
                      <div className="text-white/50 text-[9px] font-bold leading-tight">{v.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active variable */}
              {activeVar && (
                <div className="rounded-xl border p-4" style={{ borderColor: `${activeVar.color}30`, background: `${activeVar.color}08` }}>
                  <div className="flex items-start gap-3">
                    <div className="font-mono text-3xl font-black shrink-0" style={{ color: activeVar.color }}>{activeVar.sym}</div>
                    <div>
                      <div className="text-white font-black text-sm mb-0.5">{activeVar.label}</div>
                      <div className="text-white/30 text-[9px] font-bold uppercase tracking-wider mb-2">{activeVar.domain}</div>
                      <p className="text-white/60 text-xs leading-relaxed">{activeVar.desc}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 11 Domains */}
              <div>
                <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">11 Scientific Domains</div>
                <div className="space-y-1.5">
                  {SCIENTIFIC_DOMAINS.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                      <div className="p-1 rounded-md shrink-0" style={{ background: `${d.color}15` }}>
                        <d.icon size={11} style={{ color: d.color }} />
                      </div>
                      <div>
                        <div className="text-white/70 text-[10px] font-bold">{d.label}</div>
                        <div className="text-white/25 text-[9px]">{d.scientists}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "layers") {
    return (
      <div className="flex-1 overflow-auto" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-16">
          <button onClick={() => setView("home")} className="flex items-center gap-1 text-white/40 hover:text-white text-xs mb-6"><ChevronLeft size={14} /> Back</button>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold mb-4 tracking-widest">12-LAYER ARCHITECTURE</div>
            <h2 className="text-3xl font-black text-white mb-2">The Sovereign Job Engine</h2>
            <p className="text-white/40 text-sm">This is not a job board — it's a self-growing civilization-scale knowledge organism</p>
          </div>
          <div className="space-y-3">
            {LAYERS.map(layer => (
              <div key={layer.num} className="flex gap-4 rounded-2xl border border-white/6 bg-white/[0.02] p-5 hover:border-white/12 transition-all">
                <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: `${layer.color}18`, color: layer.color, border: `1px solid ${layer.color}30` }}>
                  {layer.num}
                </div>
                <div>
                  <div className="text-white font-black text-sm mb-1" style={{ color: layer.color }}>{layer.title}</div>
                  <div className="text-white/50 text-xs leading-relaxed">{layer.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden mb-8 p-8"
          style={{ background: "linear-gradient(135deg,#0a0018 0%,#0c001a 40%,#04080e 100%)", border: "1px solid rgba(129,140,248,0.15)" }}>
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 50%,rgba(129,140,248,0.12) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(251,146,60,0.08) 0%,transparent 50%)" }} />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold tracking-widest mb-4">
              SOVEREIGN CAREER INTELLIGENCE ENGINE
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">The Future of Careers</h1>
            <p className="text-white/40 text-sm max-w-xl mb-6">AI-indexed career paths, salaries, skills, and outlooks — self-generating, self-ranking, unstoppable</p>

            {/* Mini equation */}
            <div className="inline-block rounded-xl border border-violet-500/20 bg-black/40 px-5 py-3 mb-6">
              <div className="font-mono text-violet-300 text-xs">Ω∞ = ∫ (Kᵢ · Gᵢ · Iᵢ · Uᵢ)^α · N^β · S^γ · D^δ · T^ε · e^λt · dt</div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => setView("equation")} data-testid="btn-equation-lab"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600/80 hover:bg-violet-500 text-white text-sm font-bold transition-all border border-violet-500/30">
                🔬 CRISPR Equation Lab
              </button>
              <button onClick={() => setView("layers")} data-testid="btn-layers"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-bold hover:bg-white/5 transition-all">
                🏗️ 12-Layer Architecture
              </button>
            </div>
          </div>

          {engineStatus && (
            <div className="absolute top-5 right-5 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-orange-500/20 bg-orange-500/10">
              <Activity size={12} className="text-orange-400" />
              <span className="text-orange-400 text-xs font-bold">{engineStatus.generated} indexed</span>
              <span className="text-white/20 text-[10px]">/ {engineStatus.total}</span>
            </div>
          )}
        </div>

        {/* Field tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {FIELDS.map(f => (
            <button key={f.key} onClick={() => fetchByField(f.key)} data-testid={`tab-career-${f.key || "all"}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
              style={activeField === f.key
                ? { background: `${f.color}20`, border: `1px solid ${f.color}40`, color: f.color }
                : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
              {f.emoji} {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-6">
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()}
            placeholder="Search careers, skills, fields..." data-testid="input-career-search"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-400/30" />
          <button onClick={doSearch} className="px-4 py-2.5 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 text-sm font-bold hover:bg-violet-500/30 transition-all">
            <Search size={14} />
          </button>
        </div>

        {/* Career grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.015] h-44 animate-pulse" />
            ))}
          </div>
        ) : display.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🧬</div>
            <div className="text-white/30 text-sm">Engine is generating career profiles...</div>
            <div className="text-white/15 text-xs mt-1">The sovereign intelligence is seeding itself</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {display.map((item: any) => {
              const color = fieldColor(item.field);
              const emoji = fieldEmoji(item.field);
              const demandColor = DEMAND_COLORS[item.demand] || "#94a3b8";
              return (
                <button key={item.slug} onClick={() => openCareer(item)} data-testid={`career-card-${item.slug}`}
                  className="group text-left rounded-2xl border border-white/6 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] transition-all overflow-hidden">
                  <div className="relative w-full h-28 flex items-center justify-center overflow-hidden"
                    style={{ background: `radial-gradient(ellipse at center,${color}28 0%,${color}08 55%,transparent 100%),linear-gradient(135deg,#07071a,#0e0e28)` }}>
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
