import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Factory, ArrowLeft, RefreshCw, Loader2, CheckCircle2, XCircle,
  Globe, Github, Mail, Cpu, TrendingUp, Layers, Zap, Clock, BarChart3
} from "lucide-react";

interface FactoryStats {
  total_built: number;
  total_failed: number;
  total_archived: number;
  current_cycle: number;
  current_industry: string | null;
  last_build_at: string | null;
  queue: Record<string, number>;
  sectors: { sector_name: string; count: string }[];
  total_industries: number;
  factory_index: number;
  factory_running: boolean;
  github_repo: string;
  contact_email: string;
}

interface RecentBuild {
  id: number;
  industry_slug: string;
  industry_name: string;
  sector_name: string;
  app_id: number;
  app_name: string;
  status: string;
  completed_at: string;
  trust_score?: number;
  view_count?: number;
}

interface IndustryEntry {
  slug: string;
  name: string;
  level: string;
  sector: string;
  apps_built: number;
}

const SECTOR_COLORS: Record<string, string> = {
  "Energy": "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400",
  "Materials": "from-stone-500/20 to-gray-500/10 border-stone-500/30 text-stone-400",
  "Industrials": "from-blue-500/20 to-sky-500/10 border-blue-500/30 text-blue-400",
  "Consumer Discretionary": "from-pink-500/20 to-rose-500/10 border-pink-500/30 text-pink-400",
  "Consumer Staples": "from-green-500/20 to-emerald-500/10 border-green-500/30 text-green-400",
  "Health Care": "from-red-500/20 to-rose-500/10 border-red-500/30 text-red-400",
  "Financials": "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
  "Information Technology": "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400",
  "Communication Services": "from-violet-500/20 to-purple-500/10 border-violet-500/30 text-violet-400",
  "Utilities": "from-yellow-500/20 to-lime-500/10 border-yellow-500/30 text-yellow-400",
  "Real Estate": "from-indigo-500/20 to-blue-500/10 border-indigo-500/30 text-indigo-400",
};

function getSectorColor(sector: string) {
  return SECTOR_COLORS[sector] || "from-gray-500/20 to-gray-500/10 border-gray-500/30 text-gray-400";
}

export default function FactoryDashboard({ onBack }: { onBack: () => void }) {
  const [stats, setStats] = useState<FactoryStats | null>(null);
  const [recent, setRecent] = useState<RecentBuild[]>([]);
  const [industries, setIndustries] = useState<IndustryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "recent" | "industries">("overview");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [buildingSlug, setBuildingSlug] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r, ind] = await Promise.all([
        fetch("/api/forge/factory/stats").then(r => r.json()),
        fetch("/api/forge/factory/recent").then(r => r.json()).then(d => Array.isArray(d) ? d : []),
        fetch("/api/forge/factory/industries").then(r => r.json()).then(d => Array.isArray(d) ? d : []),
      ]);
      setStats(s);
      setRecent(r);
      setIndustries(ind);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, [refresh]);

  const triggerBuild = async (slug: string) => {
    setBuildingSlug(slug);
    try {
      const res = await fetch(`/api/forge/factory/build/${slug}`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Build failed" }));
        alert(err.error || "Build failed");
      } else {
        setTimeout(refresh, 2000);
      }
    } catch {}
    setBuildingSlug(null);
  };

  const uniqueSectors = [...new Set(industries.map(i => i.sector))].sort();
  const filteredIndustries = sectorFilter === "all" ? industries : industries.filter(i => i.sector === sectorFilter);
  const completedCount = stats?.queue?.complete || 0;
  const pendingCount = stats?.queue?.pending || 0;
  const failedCount = stats?.queue?.failed || 0;
  const coveragePercent = stats ? Math.round((completedCount / Math.max(stats.total_industries, 1)) * 100) : 0;

  return (
    <div className="w-full min-h-full bg-background">
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-accent/10 transition-all" data-testid="button-factory-back">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Factory className="w-5 h-5 text-[#F5C518]" />
          <div className="flex-1">
            <h1 className="text-sm font-bold tracking-tight">Autonomous App Factory</h1>
            <p className="text-[10px] text-muted-foreground font-mono">
              {stats?.factory_running ? "⚡ Building..." : "◆ Idle"} · Cycle {stats?.current_cycle || 1} · {stats?.total_industries || 0} industries mapped
            </p>
          </div>
          <button onClick={refresh} disabled={loading}
            className="p-2 rounded-lg hover:bg-accent/10 transition-all text-muted-foreground" data-testid="button-factory-refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-20">
        {loading && !stats ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#F5C518]" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
              {[
                { v: stats?.total_built || 0, l: "Apps Built", icon: CheckCircle2, c: "text-emerald-400" },
                { v: coveragePercent, l: "Coverage %", icon: BarChart3, c: "text-[#00FFD1]", suffix: "%" },
                { v: stats?.total_industries || 0, l: "Industries", icon: Layers, c: "text-violet-400" },
                { v: stats?.total_archived || 0, l: "GitHub Archived", icon: Github, c: "text-gray-400" },
                { v: stats?.total_failed || 0, l: "Failed", icon: XCircle, c: "text-red-400" },
                { v: stats?.current_cycle || 1, l: "Cycle", icon: RefreshCw, c: "text-[#F5C518]" },
              ].map((s) => (
                <motion.div key={s.l} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card/30 px-4 py-3 text-center">
                  <s.icon className={`w-4 h-4 mx-auto mb-1.5 ${s.c}`} />
                  <div className={`text-xl font-black ${s.c}`}>{s.v.toLocaleString()}{s.suffix || ""}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{s.l}</div>
                </motion.div>
              ))}
            </div>

            {stats?.current_industry && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-xl border border-[#F5C518]/20 bg-[#F5C518]/5 p-4 mb-6 flex items-center gap-3">
                <Cpu className="w-5 h-5 text-[#F5C518] animate-pulse shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#F5C518]">Currently Building</p>
                  <p className="text-xs text-muted-foreground">{stats.current_industry}</p>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  #{stats.factory_index + 1} / {stats.total_industries}
                </div>
              </motion.div>
            )}

            <div className="rounded-xl border border-border bg-card/20 p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-[#00FFD1]" />
                <span className="text-xs font-semibold">Factory Links</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <a href={stats?.github_repo || "#"} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-all"
                  data-testid="link-factory-github">
                  <Github className="w-3.5 h-3.5" /> {stats?.github_repo?.replace("https://github.com/", "")}
                </a>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" /> {stats?.contact_email}
                </span>
                {stats?.last_build_at && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" /> Last: {new Date(stats.last_build_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-1.5 mb-5 border-b border-border pb-3">
              {[
                { id: "overview" as const, l: "Sector Coverage" },
                { id: "recent" as const, l: `Recent Builds (${recent.length})` },
                { id: "industries" as const, l: `All Industries (${industries.length})` },
              ].map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    tab === t.id ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`button-factory-tab-${t.id}`}>
                  {t.l}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Industry Coverage</span>
                    <span className="text-xs font-mono text-[#00FFD1]">{completedCount} / {stats?.total_industries || 0}</span>
                  </div>
                  <div className="h-2 rounded-full bg-border overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${coveragePercent}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-[#00FFD1] to-[#4F8EFF]" />
                  </div>
                </div>

                {stats?.sectors && stats.sectors.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stats.sectors.map((s, i) => {
                      const color = getSectorColor(s.sector_name);
                      return (
                        <motion.div key={s.sector_name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`rounded-xl border bg-gradient-to-br p-4 ${color}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold truncate">{s.sector_name}</span>
                            <span className="text-lg font-black">{s.count}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">apps built</p>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Factory className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No apps built yet — factory will start building shortly.</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">The factory scans all GICS industries autonomously.</p>
                  </div>
                )}
              </div>
            )}

            {tab === "recent" && (
              <div>
                {recent.length > 0 ? (
                  <div className="space-y-2">
                    {recent.map((b, i) => (
                      <motion.div key={b.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="rounded-xl border border-border bg-card/30 p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{b.app_name || b.industry_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground font-mono">{b.sector_name}</span>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-muted-foreground">{b.industry_name}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {b.trust_score && (
                            <span className="text-xs text-[#00FFD1] font-mono block">⚡{b.trust_score}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {b.completed_at ? new Date(b.completed_at).toLocaleDateString() : ""}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No builds completed yet.</p>
                  </div>
                )}
              </div>
            )}

            {tab === "industries" && (
              <div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <button onClick={() => setSectorFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                      sectorFilter === "all" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground border border-transparent"
                    }`} data-testid="button-filter-all">
                    All ({industries.length})
                  </button>
                  {uniqueSectors.map((s) => (
                    <button key={s} onClick={() => setSectorFilter(s)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                        sectorFilter === s ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground border border-transparent"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredIndustries.map((ind, i) => (
                    <motion.div key={ind.slug} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.5) }}
                      className="rounded-xl border border-border bg-card/30 p-3 flex items-center gap-3 group hover:border-border/80 transition-all">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        ind.apps_built > 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-muted/10 border border-border"
                      }`}>
                        {ind.apps_built > 0 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Zap className="w-4 h-4 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{ind.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">{ind.sector}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {ind.apps_built > 0 && (
                          <span className="text-[10px] text-emerald-400 font-mono">{ind.apps_built} built</span>
                        )}
                        <button onClick={() => triggerBuild(ind.slug)} disabled={buildingSlug === ind.slug}
                          className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-1 rounded-lg border border-border hover:border-[#00FFD1]/30 hover:text-[#00FFD1] transition-all disabled:opacity-50"
                          data-testid={`button-build-${ind.slug}`}>
                          {buildingSlug === ind.slug ? <Loader2 className="w-3 h-3 animate-spin" /> : "Build"}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
