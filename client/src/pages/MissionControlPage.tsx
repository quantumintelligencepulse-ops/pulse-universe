import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Activity, Database, Cpu, Zap, AlertTriangle, Play, Pause, RefreshCw, Layers, Heart, Server } from "lucide-react";

interface EngineInfo {
  name: string;
  priority: string;
  running: boolean;
  enabled: boolean;
  consecutiveErrors: number;
  totalRuns: number;
  totalErrors: number;
  lastRun: string | null;
  intervalMs: number;
  effectiveIntervalMs: number;
}

interface MissionData {
  status: string;
  uptime: number;
  memory: { heapMB: number; rssMB: number };
  pools: {
    main: { total: number; idle: number; waiting: number; max: number };
    priority: { total: number; idle: number; waiting: number; max: number };
    bgQueue: { active: number; queued: number; maxConcurrent: number };
  };
  engines: {
    totalEngines: number;
    activeNow: number;
    maxConcurrent: number;
    poolPressure: string;
    poolHealthy: boolean;
    engines: EngineInfo[];
  };
  civilization: {
    totalAgents: number;
    tables: Record<string, number>;
    forgeApps: { total: number; completed: number };
  };
  openAnomalies: any[];
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  normal: "text-blue-400",
  low: "text-zinc-400",
  idle: "text-zinc-600",
};

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function MissionControlPage() {
  const [data, setData] = useState<MissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    fetch("/api/mission-control")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 10000);
    return () => clearInterval(iv);
  }, [refresh]);

  const toggleEngine = async (name: string, enabled: boolean) => {
    const action = enabled ? "pause" : "resume";
    await fetch(`/api/mission-control/engine/${name}/${action}`, { method: "POST" });
    refresh();
  };

  const seedTables = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const r = await fetch("/api/mission-control/seed-empty-tables", { method: "POST" });
      const d = await r.json();
      setSeedResult(d.message || d.error || "Done");
      refresh();
    } catch {
      setSeedResult("Failed to seed");
    } finally {
      setSeeding(false);
    }
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="mission-control-loading">
        <div className="text-center">
          <Cpu className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading Mission Control...</p>
        </div>
      </div>
    );
  }

  const emptyTables = Object.entries(data.civilization.tables).filter(([, v]) => v === 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3" data-testid="mission-control-title">
              <Activity className="w-7 h-7 text-primary" />
              Mission Control
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time system health · {data.engines.totalEngines} engines · {data.civilization.totalAgents.toLocaleString()} agents
            </p>
          </div>
          <button onClick={refresh} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" data-testid="button-refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Status", value: data.status, icon: Heart, color: data.pools.main.waiting > 5 ? "text-red-400" : "text-emerald-400" },
            { label: "Uptime", value: formatUptime(data.uptime), icon: Zap, color: "text-[#00FFD1]" },
            { label: "Heap Memory", value: `${data.memory.heapMB} MB`, icon: Cpu, color: data.memory.heapMB > 400 ? "text-orange-400" : "text-blue-400" },
            { label: "Pool Pressure", value: data.engines.poolPressure, icon: Database, color: data.engines.poolHealthy ? "text-emerald-400" : "text-red-400" },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card/30 p-4">
              <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
              <div className={`text-xl font-black ${s.color}`} data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, '-')}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-card/20 p-4">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" /> Connection Pools
            </h3>
            {[
              { name: "Main Pool", ...data.pools.main },
              { name: "Priority Pool", ...data.pools.priority },
            ].map((p) => (
              <div key={p.name} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{p.name}</span>
                  <span className="font-mono">{p.total - p.idle}/{p.max} active · {p.waiting} waiting</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${(p.total - p.idle) / p.max > 0.8 ? 'bg-red-500' : (p.total - p.idle) / p.max > 0.5 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(((p.total - p.idle) / p.max) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
            <div className="text-xs text-muted-foreground mt-2">
              Background Queue: {data.pools.bgQueue.active}/{data.pools.bgQueue.maxConcurrent} active · {data.pools.bgQueue.queued} queued
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/20 p-4">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" /> Civilization Data
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(data.civilization.tables).map(([tbl, cnt]) => (
                <div key={tbl} className="flex justify-between text-xs">
                  <span className="text-muted-foreground truncate mr-2">{tbl.replace(/_/g, ' ')}</span>
                  <span className={`font-mono ${cnt === 0 ? 'text-red-400' : 'text-emerald-400'}`}>{cnt.toLocaleString()}</span>
                </div>
              ))}
            </div>
            {emptyTables.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <button onClick={seedTables} disabled={seeding}
                  className="px-3 py-1.5 text-xs font-mono bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-all disabled:opacity-50"
                  data-testid="button-seed-tables">
                  {seeding ? "Seeding..." : `Seed ${emptyTables.length} Empty Tables`}
                </button>
                {seedResult && <p className="text-xs text-muted-foreground mt-1">{seedResult}</p>}
              </div>
            )}
          </div>
        </div>

        {data.openAnomalies.length > 0 && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 mb-6">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-4 h-4" /> Open Anomalies ({data.openAnomalies.length})
            </h3>
            {data.openAnomalies.map((a: any, i: number) => (
              <div key={i} className="text-xs text-red-300/80 mb-1 font-mono truncate" data-testid={`anomaly-${i}`}>
                {a.message || a.stack?.slice(0, 100) || "Unknown anomaly"}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-border bg-card/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Server className="w-4 h-4 text-orange-400" />
              Engine Governor ({data.engines.activeNow}/{data.engines.maxConcurrent} active)
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={async () => {
                for (const e of data.engines.engines) {
                  if (e.enabled) await fetch(`/api/mission-control/engine/${e.name}/pause`, { method: "POST" });
                }
                refresh();
              }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded-lg border border-border hover:border-red-500/30 hover:text-red-400 transition-all"
                data-testid="button-pause-engine">
                <Pause className="w-3 h-3" /> Pause All
              </button>
              <button onClick={async () => {
                for (const e of data.engines.engines) {
                  if (!e.enabled) await fetch(`/api/mission-control/engine/${e.name}/resume`, { method: "POST" });
                }
                refresh();
              }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded-lg border border-border hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
                data-testid="button-resume-engine">
                <Play className="w-3 h-3" /> Resume All
              </button>
              <span className="text-xs text-muted-foreground font-mono">{data.engines.totalEngines} registered</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-2 px-2">Engine</th>
                  <th className="text-left py-2 px-1">Priority</th>
                  <th className="text-center py-2 px-1">Status</th>
                  <th className="text-right py-2 px-1">Runs</th>
                  <th className="text-right py-2 px-1">Errors</th>
                  <th className="text-right py-2 px-1">Interval</th>
                  <th className="text-center py-2 px-1">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.engines.engines.map((e) => (
                  <tr key={e.name} className="border-b border-border/30 hover:bg-muted/30">
                    <td className="py-1.5 px-2 font-mono truncate max-w-[180px]" data-testid={`engine-name-${e.name}`}>{e.name}</td>
                    <td className={`py-1.5 px-1 font-mono ${PRIORITY_COLORS[e.priority] || 'text-zinc-400'}`}>{e.priority}</td>
                    <td className="py-1.5 px-1 text-center">
                      {e.running ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      ) : e.consecutiveErrors > 3 ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-zinc-600" />
                      )}
                    </td>
                    <td className="py-1.5 px-1 text-right font-mono">{e.totalRuns}</td>
                    <td className={`py-1.5 px-1 text-right font-mono ${e.totalErrors > 10 ? 'text-red-400' : ''}`}>{e.totalErrors}</td>
                    <td className="py-1.5 px-1 text-right font-mono text-muted-foreground">{Math.round(e.effectiveIntervalMs / 1000)}s</td>
                    <td className="py-1.5 px-1 text-center">
                      <button onClick={() => toggleEngine(e.name, e.enabled)}
                        className="p-1 rounded hover:bg-muted transition-colors"
                        data-testid={`button-toggle-${e.name}`}>
                        {e.enabled ? <Pause className="w-3 h-3 text-zinc-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.engines.engines.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No engines registered in governor yet. Engines run independently.</p>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card/20 p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#F5C518]" /> ForgeAI Factory
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-black text-[#00FFD1]" data-testid="stat-forge-total">{data.civilization.forgeApps.total}</div>
              <div className="text-xs text-muted-foreground">Total Apps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-emerald-400" data-testid="stat-forge-completed">{data.civilization.forgeApps.completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-violet-400">{data.civilization.totalAgents.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">AI Agents</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
