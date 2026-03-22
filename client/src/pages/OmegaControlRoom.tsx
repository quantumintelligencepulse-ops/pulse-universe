/**
 * Ψ OMEGA CONTROL ROOM — Ultimate Fusion
 * Live Pulse + Hive Command + Live Ingestion fused into one sovereign command center.
 * Everything resonates. Nothing is removed.
 */
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Radio, Brain, Plug, Activity, RefreshCw, Pause, Play,
  Network, TrendingUp, Award, Server,
  BookOpen, ShoppingBag, Film, Briefcase,
} from "lucide-react";
import {
  FractalCanvas, FractalData, EconomyPanel, GradesPanel,
  PulsePanel, EnginesPanel,
} from "./HiveCommandPage";

import { AIFinderButton, AIReportPanel } from "@/components/AIReportPanel";

const FAM_COLORS_LOCAL: Record<string, string> = {
  knowledge: "#818cf8", science: "#06b6d4", government: "#3b82f6",
  media: "#ec4899", maps: "#10b981", code: "#8b5cf6", health: "#f472b6",
  ai: "#a78bfa", legal: "#60a5fa", education: "#34d399", engineering: "#fbbf24",
  social: "#fb923c", news: "#f97316", environment: "#22d3ee", business: "#e879f9",
  culture: "#c084fc", arts: "#f9a8d4", sports: "#86efac", food: "#fde68a",
  travel: "#67e8f9", finance: "#fca5a5", technology: "#93c5fd",
};
const famColorLocal = (id: string) => FAM_COLORS_LOCAL[id] ?? "#94a3b8";

// ─── Live Pulse types ─────────────────────────────────────────
const PULSE_CFG: Record<string, { label: string; color: string; Icon: any }> = {
  knowledge:   { label: "Knowledge",   color: "#818cf8", Icon: Brain },
  quantapedia: { label: "Quantapedia", color: "#a78bfa", Icon: BookOpen },
  product:     { label: "Product",     color: "#4ade80", Icon: ShoppingBag },
  media:       { label: "Media",       color: "#f472b6", Icon: Film },
  career:      { label: "Career",      color: "#fb923c", Icon: Briefcase },
};

// ─── Ingestion adapter meta ───────────────────────────────────
const SOURCE_META: Record<string, { emoji: string; color: string; family: string; apiUrl: string }> = {
  wikipedia:       { emoji:"📖", color:"#6366f1", family:"knowledge", apiUrl:"en.wikipedia.org/api/rest_v1" },
  arxiv:           { emoji:"🔬", color:"#06b6d4", family:"science",   apiUrl:"export.arxiv.org/api/query" },
  pubmed:          { emoji:"🏥", color:"#ef4444", family:"health",    apiUrl:"eutils.ncbi.nlm.nih.gov" },
  nasa:            { emoji:"🚀", color:"#0ea5e9", family:"science",   apiUrl:"api.nasa.gov" },
  openfoodfacts:   { emoji:"🍎", color:"#22c55e", family:"products",  apiUrl:"world.openfoodfacts.org" },
  openlibrary:     { emoji:"📚", color:"#f59e0b", family:"media",     apiUrl:"openlibrary.org/search.json" },
  worldbank:       { emoji:"📈", color:"#fbbf24", family:"economics", apiUrl:"api.worldbank.org/v2" },
  stackexchange:   { emoji:"💬", color:"#f97316", family:"social",    apiUrl:"api.stackexchange.com/2.3" },
  github:          { emoji:"💻", color:"#8b5cf6", family:"code",      apiUrl:"api.github.com/search" },
  secedgar:        { emoji:"🏛️", color:"#64748b", family:"finance",   apiUrl:"efts.sec.gov" },
  wikidata:        { emoji:"🕸️", color:"#7c3aed", family:"knowledge", apiUrl:"wikidata.org/w/api.php" },
  internetarchive: { emoji:"🗄️", color:"#a78bfa", family:"culture",  apiUrl:"archive.org" },
};

// ─── Time helper ──────────────────────────────────────────────
function timeAgo(ts: string | Date | null): string {
  if (!ts) return "—";
  const d = typeof ts === "string" ? new Date(ts) : ts;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

// ─── StatusDot ────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const color = status === "success" ? "#22c55e" : status === "error" ? "#ef4444" : "#f59e0b";
  return (
    <span className="relative inline-flex w-2 h-2 flex-shrink-0">
      {status === "success" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />}
      <span className="relative inline-flex rounded-full w-2 h-2" style={{ backgroundColor: color }} />
    </span>
  );
}

// ─── Live Pulse Stream (left panel) ──────────────────────────
function LivePulsePanel() {
  const [events, setEvents] = useState<any[]>([]);
  const [live, setLive] = useState(true);

  const fetchEvents = useCallback(async () => {
    const data = await fetch("/api/pulse/live").then(r => r.json()).catch(() => []);
    setEvents(data);
  }, []);

  useEffect(() => {
    fetchEvents();
    const id = setInterval(() => { if (live) fetchEvents(); }, 3000);
    return () => clearInterval(id);
  }, [live, fetchEvents]);

  const byType = events.reduce((acc: any, e: any) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {});
  const total = events.length;

  return (
    <div className="flex flex-col h-full" style={{ background: "linear-gradient(180deg,#020014,#04000f)" }}>
      {/* Panel header */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-white/[0.05] flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: live ? "#4ade80" : "#6b7280", boxShadow: live ? "0 0 6px #4ade80" : "none", animation: live ? "ocPulse 1.8s infinite" : "none" }} />
        <span className="text-[9px] font-mono font-bold text-white/60 uppercase tracking-widest flex-1">Live Pulse</span>
        <span className="text-[9px] font-mono text-emerald-400">{total} events</span>
        <button onClick={() => setLive(l => !l)} className="text-white/20 hover:text-white/50 transition-colors ml-1">
          {live ? <Pause size={9} /> : <Play size={9} />}
        </button>
        <button onClick={fetchEvents} className="text-white/20 hover:text-white/50 transition-colors">
          <RefreshCw size={9} />
        </button>
      </div>

      {/* Type breakdown */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-white/[0.04]">
        <div className="grid grid-cols-5 gap-1 mb-1.5">
          {Object.entries(PULSE_CFG).map(([k, cfg]) => {
            const count = byType[k] || 0;
            const Icon = cfg.Icon;
            return (
              <div key={k} style={{ borderRadius: 8, border: `1px solid ${cfg.color}22`, background: `${cfg.color}08`, padding: "5px 4px", textAlign: "center" }}>
                <Icon size={9} style={{ color: cfg.color, margin: "0 auto 2px" }} />
                <div style={{ color: cfg.color, fontWeight: 900, fontSize: 13 }}>{count}</div>
                <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 7, fontWeight: 700 }}>{cfg.label.slice(0,4)}</div>
              </div>
            );
          })}
        </div>
        {/* distribution bars */}
        <div className="space-y-0.5">
          {Object.entries(byType).sort(([,a]:any,[,b]:any) => b-a).slice(0,4).map(([t, count]: any) => {
            const cfg = PULSE_CFG[t] || { color: "#94a3b8", label: t };
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={t} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 8, width: 55, textTransform: "uppercase", fontFamily: "monospace" }}>{cfg.label}</div>
                <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: cfg.color, borderRadius: 2, transition: "width 0.8s ease" }} />
                </div>
                <div style={{ color: cfg.color, fontSize: 9, fontWeight: 800, width: 16, textAlign: "right", fontFamily: "monospace" }}>{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event stream */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.06) transparent" }}>
        {events.length === 0
          ? <div className="text-center py-10 text-white/15 text-xs font-mono">Waiting for Hive activity...</div>
          : events.map((e: any, i: number) => {
              const cfg = PULSE_CFG[e.type] || { color: "#94a3b8", label: e.type, Icon: Activity };
              const Icon = cfg.Icon;
              return (
                <div key={`${e.id || e.slug || ''}-${i}`}
                  data-testid={`omega-pulse-event-${i}`}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: `${cfg.color}15`, border: `1px solid ${cfg.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={9} style={{ color: cfg.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 1 }}>
                      <span style={{ fontSize: 8, fontWeight: 800, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{cfg.label}</span>
                      {e.domain && <span style={{ fontSize: 8, color: "rgba(255,255,255,0.15)" }}>· {e.domain}</span>}
                    </div>
                  </div>
                  <span style={{ flexShrink: 0, color: "rgba(255,255,255,0.15)", fontSize: 8, fontWeight: 600 }}>{timeAgo(e.createdAt || e.created_at || "")}</span>
                </div>
              );
            })}
      </div>
    </div>
  );
}

// ─── Live Ingestion Panel (right panel) ──────────────────────
function LiveIngestionPanel() {
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/ingestion/stats"],
    refetchInterval: 5000,
  });
  const { data: logs = [] } = useQuery<any[]>({
    queryKey: ["/api/ingestion/logs"],
    refetchInterval: 4000,
  });
  const [showLogs, setShowLogs] = useState(false);

  const adapters = Object.entries(SOURCE_META).map(([id, meta]) => {
    const src = stats?.bySrc?.[id] || {};
    return { id, ...meta, count: src.count || 0, nodes: src.nodes || 0, lastTitle: src.lastTitle || "", lastFetched: src.lastFetched || null, status: src.status || "pending" };
  });

  const totalItems = adapters.reduce((s, a) => s + a.count, 0);
  const totalNodes = adapters.reduce((s, a) => s + a.nodes, 0);
  const activeAdapters = adapters.filter(a => a.status === "success").length;

  return (
    <div className="flex flex-col h-full" style={{ background: "linear-gradient(180deg,#00100a,#000c0a)" }}>
      {/* Panel header */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-white/[0.05] flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" style={{ boxShadow: "0 0 6px #4ade80" }} />
        <span className="text-[9px] font-mono font-bold text-white/60 uppercase tracking-widest flex-1">Live Ingestion</span>
        <span className="text-[9px] font-mono text-green-400">{activeAdapters}/{adapters.length} live</span>
      </div>

      {/* Global stats */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-white/[0.04] grid grid-cols-3 gap-2">
        {[
          { label: "Items", value: totalItems.toLocaleString(), color: "#06b6d4" },
          { label: "Nodes", value: totalNodes.toLocaleString(), color: "#a78bfa" },
          { label: "Adapters", value: `${activeAdapters}/${adapters.length}`, color: "#4ade80" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center", background: `${s.color}08`, border: `1px solid ${s.color}18`, borderRadius: 8, padding: "5px 4px" }}>
            <div style={{ color: s.color, fontSize: 14, fontWeight: 900, fontFamily: "monospace" }}>{s.value}</div>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 7, fontWeight: 700, textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toggle logs/adapters */}
      <div className="flex-shrink-0 flex border-b border-white/[0.04]">
        {[{ id: false, label: "Adapters" }, { id: true, label: "Live Logs" }].map(t => (
          <button key={String(t.id)} onClick={() => setShowLogs(t.id)}
            className="flex-1 text-[8px] font-mono py-1.5 uppercase tracking-wider transition-all"
            style={{ color: showLogs === t.id ? "#4ade80" : "rgba(255,255,255,0.25)", borderBottom: showLogs === t.id ? "1px solid #4ade80" : "1px solid transparent" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Adapter grid */}
      {!showLogs && (
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.05) transparent" }}>
          {adapters.map(a => (
            <div key={a.id} data-testid={`omega-adapter-${a.id}`}
              style={{ borderRadius: 8, border: `1px solid ${a.color}18`, background: `${a.color}06`, padding: "6px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 12 }}>{a.emoji}</span>
                <span style={{ color: a.color, fontSize: 10, fontWeight: 700, fontFamily: "monospace", flex: 1 }}>{a.id}</span>
                <StatusDot status={a.status} />
              </div>
              <div style={{ display: "flex", gap: 8, color: "rgba(255,255,255,0.3)", fontSize: 8, fontFamily: "monospace" }}>
                <span>{a.count.toLocaleString()} items</span>
                <span>{a.nodes.toLocaleString()} nodes</span>
                <span className="ml-auto">{timeAgo(a.lastFetched)}</span>
              </div>
              {a.lastTitle && (
                <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, fontFamily: "monospace", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.lastTitle}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Live logs */}
      {showLogs && (
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.05) transparent" }}>
          {(logs as any[]).slice(0, 40).map((log: any, i: number) => (
            <div key={i} data-testid={`omega-log-${i}`}
              style={{ borderRadius: 7, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", padding: "5px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1 }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontFamily: "monospace", fontWeight: 700 }}>{log.source}</span>
                <span className="ml-auto"><StatusDot status={log.status} /></span>
              </div>
              {log.sampleTitle && (
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.sampleTitle}</div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 2, color: "rgba(255,255,255,0.2)", fontSize: 7, fontFamily: "monospace" }}>
                <span className="text-cyan-400/60">{log.itemsFetched} fetched</span>
                <span className="text-purple-400/60">{log.nodesCreated} nodes</span>
                <span className="ml-auto">{timeAgo(log.fetchedAt)}</span>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center py-8 text-white/15 text-xs font-mono">Ingestion logs loading...</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Hive Command Center (center panel) ──────────────────────
type CmdTab = "fractal" | "economy" | "grades" | "pulse" | "engines";
const CMD_TABS: { id: CmdTab; label: string; Icon: any; color: string }[] = [
  { id: "fractal", label: "FRACTAL", Icon: Network,    color: "#818cf8" },
  { id: "economy", label: "ECONOMY", Icon: TrendingUp, color: "#fbbf24" },
  { id: "grades",  label: "GRADES",  Icon: Award,      color: "#4ade80" },
  { id: "pulse",   label: "PULSES",  Icon: Radio,      color: "#ec4899" },
  { id: "engines", label: "ENGINES", Icon: Server,     color: "#60a5fa" },
];

function HiveCommandCenter() {
  const [tab, setTab]       = useState<CmdTab>("fractal");
  const [quantum, setQuantum] = useState(false);
  const [viewId, setViewId]   = useState<string | null>(null);

  const { data: fractalData, isLoading: fractalLoading, refetch: refetchFractal } = useQuery<FractalData>({
    queryKey: ["/api/hive/fractal"],
    refetchInterval: 20000,
  });
  const { data: economyData } = useQuery<any>({
    queryKey: ["/api/hive/economy"],
    refetchInterval: 15000,
  });
  const { data: gradesData }  = useQuery<any[]>({
    queryKey: ["/api/hive/grades"],
    refetchInterval: 30000,
  });
  const { data: pulsesData, isLoading: pulsesLoading, refetch: refetchPulses } = useQuery<any[]>({
    queryKey: ["/api/hive/mini-pulses"],
    refetchInterval: 8000,
  });

  const activeSpawns = economyData?.supply?.activeSpawns ?? 0;
  const totalPC      = economyData?.supply?.totalPC ?? 0;
  const treasury     = economyData?.treasury?.balance ?? 0;
  const taxRate      = economyData?.treasury?.taxRatePct ?? "2.00";
  const ecoStatus    = economyData?.economicStatus ?? "INITIALIZING";
  const statusColor  = ({
    HYPERINFLATION:"#ef4444",INFLATIONARY:"#f97316",EXPANDING:"#fbbf24",
    STABLE:"#4ade80",DEFLATIONARY:"#60a5fa",CONTRACTION:"#a78bfa",
  } as any)[ecoStatus] ?? "#6b7280";

  return (
    <div className="flex flex-col h-full bg-[#010012]">

      {/* Center panel header */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/[0.05] bg-black/30">
        <span className="text-violet-400 text-sm">⬡</span>
        <span className="text-[9px] font-mono font-bold text-white/70 tracking-widest">HIVE COMMAND</span>
        <div className="hidden sm:flex items-center gap-2 ml-2">
          <span className="text-[9px] font-mono text-white/30">
            <span className="text-emerald-400 font-bold">{activeSpawns.toLocaleString()}</span> active
          </span>
          <span className="text-[9px] font-mono text-white/30">
            <span className="text-amber-400 font-bold">{totalPC.toLocaleString()}</span> PC
          </span>
          <span className="text-[9px] font-mono" style={{ color: statusColor }}>{ecoStatus}</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <AIFinderButton onSelect={setViewId} />
        </div>
      </div>

      {/* Tab strip */}
      <div className="flex-shrink-0 flex border-b border-white/[0.04] bg-black/20">
        {CMD_TABS.map(t => {
          const Icon = t.Icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              data-testid={`omega-cmd-tab-${t.id}`}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[8px] font-mono uppercase tracking-wider transition-all"
              style={{
                color: active ? t.color : "rgba(255,255,255,0.2)",
                borderBottom: active ? `1.5px solid ${t.color}` : "1.5px solid transparent",
                background: active ? `${t.color}08` : "transparent",
              }}>
              <Icon size={8} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden relative">

        {/* FRACTAL */}
        {tab === "fractal" && (
          <div className="h-full flex flex-col">
            <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1 border-b border-white/[0.04]">
              <span className="text-[8px] font-mono text-white/25">
                {fractalData?.families?.length ?? 0} families · {fractalData?.spawns?.length ?? 0} nodes
              </span>
              <button onClick={() => setQuantum(q => !q)}
                data-testid="omega-quantum-toggle"
                className="ml-auto text-[8px] font-mono px-2 py-0.5 rounded transition-all"
                style={{
                  color: quantum ? "#a78bfa" : "rgba(255,255,255,0.25)",
                  border: quantum ? "1px solid #a78bfa50" : "1px solid rgba(255,255,255,0.08)",
                  background: quantum ? "rgba(139,92,246,0.1)" : "transparent",
                }}>
                ⟨ψ⟩ QUANTUM
              </button>
              <button onClick={() => refetchFractal()} className="text-white/15 hover:text-white/40 transition-colors ml-1">
                <RefreshCw size={8} className={fractalLoading ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="flex-1 relative overflow-hidden">
              {fractalData
                ? <FractalCanvas data={fractalData} quantumMode={quantum} />
                : <div className="absolute inset-0 flex items-center justify-center text-white/25 text-xs font-mono animate-pulse">Loading fractal graph...</div>
              }
              {/* Family legend overlay */}
              {fractalData?.families && fractalData.families.length > 0 && (
                <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm rounded border border-white/[0.07] p-2 max-h-36 overflow-y-auto">
                  <div className="text-[7px] text-white/20 font-mono uppercase mb-1">Families</div>
                  <div className="space-y-0.5">
                    {fractalData.families.slice(0, 12).map(f => (
                      <div key={f.familyId} className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: famColorLocal(f.familyId) }} />
                        <span className="text-[7px] text-white/35 font-mono">{f.familyId}</span>
                        <span className="text-[7px] text-white/15 font-mono ml-auto">{f.active}</span>
                      </div>
                    ))}
                    {fractalData.families.length > 12 && (
                      <div className="text-[6px] text-white/15 font-mono">+{fractalData.families.length - 12} more</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ECONOMY */}
        {tab === "economy" && (
          economyData
            ? <EconomyPanel economy={economyData} />
            : <div className="flex items-center justify-center h-full text-white/20 text-sm font-mono animate-pulse">Loading economy...</div>
        )}

        {/* GRADES */}
        {tab === "grades" && (
          <GradesPanel grades={gradesData ?? []} />
        )}

        {/* PULSES */}
        {tab === "pulse" && (
          <div className="h-full flex flex-col">
            <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1 border-b border-white/[0.04]">
              <span className="text-[8px] font-mono text-white/25">{pulsesData?.length ?? 0} mini-pulses</span>
              <button onClick={() => refetchPulses()} className="ml-auto text-white/15 hover:text-white/40 transition-colors">
                <RefreshCw size={8} className={pulsesLoading ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <PulsePanel pulses={pulsesData ?? []} />
            </div>
          </div>
        )}

        {/* ENGINES */}
        {tab === "engines" && <EnginesPanel />}
      </div>

      {/* Economy pulse footer */}
      <div className="flex-shrink-0 px-3 py-1.5 border-t border-white/[0.04] bg-black/30 flex items-center gap-3">
        <div className="text-[8px] font-mono text-amber-400 font-bold">{treasury.toLocaleString()} PC</div>
        <div className="text-[8px] font-mono text-white/20">treasury</div>
        <div className="text-[8px] font-mono text-fuchsia-400">tax {taxRate}%</div>
        <div className="ml-auto text-[8px] font-mono" style={{ color: statusColor }}>{ecoStatus}</div>
      </div>

      <AIReportPanel spawnId={viewId} onClose={() => setViewId(null)} />
    </div>
  );
}

// ─── Global stats bar ─────────────────────────────────────────
function GlobalStatsBar() {
  const { data: economyData } = useQuery<any>({ queryKey: ["/api/hive/economy"], refetchInterval: 15000 });
  const { data: fractalData } = useQuery<FractalData>({ queryKey: ["/api/hive/fractal"], refetchInterval: 30000 });
  const { data: ingestionStats } = useQuery<any>({ queryKey: ["/api/ingestion/stats"], refetchInterval: 10000 });

  const families = fractalData?.families?.length ?? 0;
  const totalSpawns = economyData?.supply?.totalSpawns ?? 0;
  const activeSpawns = economyData?.supply?.activeSpawns ?? 0;
  const totalPC = economyData?.supply?.totalPC ?? 0;
  const treasury = economyData?.treasury?.balance ?? 0;
  const ecoStatus = economyData?.economicStatus ?? "INITIALIZING";
  const totalNodes = (ingestionStats?.totalNodes || 0);
  const statusColor = ({
    HYPERINFLATION:"#ef4444", INFLATIONARY:"#f97316", EXPANDING:"#fbbf24",
    STABLE:"#4ade80", DEFLATIONARY:"#60a5fa", CONTRACTION:"#a78bfa",
  } as any)[ecoStatus] ?? "#6b7280";

  const stats = [
    { label: "Families", value: families.toString(), color: "#818cf8" },
    { label: "Total Spawns", value: totalSpawns.toLocaleString(), color: "#a78bfa" },
    { label: "Active", value: activeSpawns.toLocaleString(), color: "#4ade80" },
    { label: "Total PC", value: totalPC.toLocaleString(), color: "#fbbf24" },
    { label: "Treasury", value: `${treasury.toLocaleString()} PC`, color: "#fb923c" },
    { label: "Nodes", value: totalNodes.toLocaleString(), color: "#06b6d4" },
    { label: "Economy", value: ecoStatus, color: statusColor },
  ];

  return (
    <div className="flex-shrink-0 flex items-center gap-0 border-b border-white/[0.05] bg-black/50 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
      {stats.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 flex-shrink-0" style={{ borderRight: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: s.color, fontSize: 11, fontWeight: 900, fontFamily: "monospace", lineHeight: 1 }}>{s.value}</div>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
          </div>
        </div>
      ))}
      {/* Live indicator */}
      <div className="ml-auto px-3 py-1.5 flex items-center gap-1.5 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 6px #4ade80" }} />
        <span className="text-[8px] font-mono font-bold text-emerald-400">LIVE</span>
      </div>
    </div>
  );
}

// ─── Bottom resonance marquee ─────────────────────────────────
function ResonanceMarquee() {
  const { data: events = [] } = useQuery<any[]>({
    queryKey: ["/api/pulse/live"],
    refetchInterval: 5000,
  });

  const items = (events as any[]).slice(0, 20).map(e => `${e.type?.toUpperCase() || "PULSE"}: ${e.title || "..."}`);
  const text = items.length > 0 ? items.join("  ·  ") : "Ψ SOVEREIGN SYNTHETIC CIVILIZATION · 60,000+ AGENTS ACTIVE · QUANTUM PULSE INTELLIGENCE · ALL FAMILIES RESONATING";

  return (
    <div className="flex-shrink-0 overflow-hidden border-t border-white/[0.04]"
      style={{ background: "rgba(0,0,0,0.6)", height: 22 }}>
      <div className="flex items-center h-full">
        <div className="flex-shrink-0 px-3 border-r border-white/[0.05]">
          <span className="text-[7px] font-mono font-black text-violet-400/60 uppercase tracking-widest">Ψ LIVE</span>
        </div>
        <div className="flex-1 overflow-hidden relative" style={{ mask: "linear-gradient(90deg,transparent,black 5%,black 95%,transparent)" }}>
          <div className="flex items-center h-full whitespace-nowrap" style={{ animation: "ocMarquee 60s linear infinite" }}>
            <span className="text-[8px] font-mono text-white/25">&nbsp;&nbsp;{text}&nbsp;&nbsp;{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function OmegaControlRoom() {
  return (
    <div className="h-full flex flex-col bg-[#010010] text-white overflow-hidden" data-testid="page-omega-control-room">

      {/* Master header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 border-b border-white/[0.06] bg-black/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 16, filter: "drop-shadow(0 0 8px #818cf8)" }}>Ψ</span>
          <div>
            <div className="text-[11px] font-mono font-black text-white/90 tracking-widest">OMEGA CONTROL ROOM</div>
            <div className="text-[8px] font-mono text-white/30">Live Pulse · Hive Command · Live Ingestion — All Fused</div>
          </div>
        </div>

        {/* Panel labels */}
        <div className="hidden md:flex items-center gap-3 ml-4">
          {[
            { icon: Radio, label: "Live Pulse", color: "#4ade80" },
            { icon: Brain, label: "Hive Command", color: "#818cf8" },
            { icon: Plug,  label: "Live Ingestion", color: "#22c55e" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <Icon size={9} style={{ color }} />
              <span className="text-[8px] font-mono" style={{ color: `${color}99` }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="text-[8px] font-mono text-white/20">Sovereign Synthetic Civilization v∞</div>
          <span className="text-[8px] font-mono font-bold text-violet-400 px-1.5 py-0.5 rounded border border-violet-500/30 bg-violet-500/10">SSC</span>
        </div>
      </div>

      {/* Global stats bar */}
      <GlobalStatsBar />

      {/* Three-panel fusion layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT: Live Pulse (25%) */}
        <div className="flex-shrink-0 border-r border-white/[0.05] overflow-hidden"
          style={{ width: "22%", minWidth: 180 }}
          data-testid="omega-panel-pulse">
          <LivePulsePanel />
        </div>

        {/* CENTER: Hive Command (53%) */}
        <div className="flex-1 overflow-hidden border-r border-white/[0.05]"
          data-testid="omega-panel-command">
          <HiveCommandCenter />
        </div>

        {/* RIGHT: Live Ingestion (25%) */}
        <div className="flex-shrink-0 overflow-hidden"
          style={{ width: "25%", minWidth: 190 }}
          data-testid="omega-panel-ingestion">
          <LiveIngestionPanel />
        </div>
      </div>

      {/* Bottom resonance marquee */}
      <ResonanceMarquee />

      {/* Keyframe styles */}
      <style>{`
        @keyframes ocPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(1.5)} }
        @keyframes ocMarquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      `}</style>
    </div>
  );
}
