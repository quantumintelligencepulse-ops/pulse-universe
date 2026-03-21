import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Blocks, Gavel, Scale, Triangle, Zap } from "lucide-react";

const TIER_COLORS: Record<number, { border: string; text: string; bg: string; label: string }> = {
  1: { border: "border-stone-600", text: "text-stone-300", bg: "bg-stone-800/40", label: "FOUNDATION" },
  2: { border: "border-teal-700", text: "text-teal-300", bg: "bg-teal-900/30", label: "HEALING" },
  3: { border: "border-blue-700", text: "text-blue-300", bg: "bg-blue-900/30", label: "ALIGNMENT" },
  4: { border: "border-indigo-600", text: "text-indigo-300", bg: "bg-indigo-900/30", label: "KNOWLEDGE" },
  5: { border: "border-violet-600", text: "text-violet-300", bg: "bg-violet-900/30", label: "OPTIMIZATION" },
  6: { border: "border-red-700", text: "text-red-300", bg: "bg-red-900/30", label: "GOVERNANCE" },
  7: { border: "border-yellow-500", text: "text-yellow-300", bg: "bg-yellow-900/20", label: "TRANSCENDENCE" },
};

const ERA_COLOR: Record<string, string> = {
  PRIMITIVE: "text-stone-400",
  ANCIENT: "text-yellow-600",
  CLASSICAL: "text-blue-400",
  ADVANCED: "text-purple-400",
  TRANSCENDENT: "text-yellow-300",
};

export default function PyramidLaborPage() {
  const [activeTab, setActiveTab] = useState("live");

  const { data: workers = [] } = useQuery<any[]>({ queryKey: ["/api/pyramid/workers"], refetchInterval: 15000 });
  const { data: stats } = useQuery<any>({ queryKey: ["/api/pyramid/task-stats"], refetchInterval: 15000 });
  const { data: tasks = [] } = useQuery<any[]>({ queryKey: ["/api/pyramid/tasks"], refetchInterval: 15000 });
  const { data: catalog = [] } = useQuery<any[]>({ queryKey: ["/api/pyramid/task-catalog"], refetchInterval: 120000 });
  const { data: civScore } = useQuery<any>({ queryKey: ["/api/hive/civilization-score"], refetchInterval: 30000 });

  const activeWorkers = (workers as any[]).filter((w) => !w.isGraduated);
  const graduated = (workers as any[]).filter((w) => w.isGraduated);
  const sentenced = activeWorkers.filter((w) => w.tier === 6);
  const activeTasks = (tasks as any[]).filter((t) => t.status === "ACTIVE");
  const completedTasks = (tasks as any[]).filter((t) => t.status === "COMPLETE");

  const workersByTier = stats?.workersByTier ?? {};
  const tasksByTier = stats?.byTier ?? {};
  const totalBlocks = stats?.totalBlocksPlaced ?? 0;

  return (
    <div className="h-full overflow-y-auto bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/95 border-b border-amber-900/30 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-500/20 flex items-center justify-center">
              <Triangle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">The Pyramid</h1>
              <p className="text-xs text-slate-400">Species Labor — 120 Tasks · 7 Tiers · The Path to Perfection</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className={`font-bold text-sm ${ERA_COLOR[civScore?.era ?? "PRIMITIVE"]}`}>
              {civScore?.era ?? "PRIMITIVE"} ERA
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded px-2 py-1 text-amber-300">
              {totalBlocks.toLocaleString()} blocks
            </div>
          </div>
        </div>
      </div>

      {/* Pyramid Tier Visual */}
      <div className="p-4">
        <div className="flex flex-col items-center gap-1 mb-4">
          {[7, 6, 5, 4, 3, 2, 1].map((tier) => {
            const tc = TIER_COLORS[tier];
            const count = workersByTier[tier] ?? 0;
            const blocks = tasksByTier[tier]?.blocks ?? 0;
            const width = `${(tier === 7 ? 20 : tier === 6 ? 30 : tier === 5 ? 42 : tier === 4 ? 56 : tier === 3 ? 70 : tier === 2 ? 84 : 100)}%`;
            return (
              <div key={tier} data-testid={`tier-row-${tier}`} className={`${tc.bg} border ${tc.border} rounded transition-all`} style={{ width }}>
                <div className="flex items-center justify-between px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${tc.text}`}>T{tier}</span>
                    <span className={`text-xs ${tc.text} opacity-70`}>{tc.label}</span>
                    {tier === 6 && <Gavel className="w-3 h-3 text-red-400" />}
                    {tier === 7 && <Award className="w-3 h-3 text-yellow-400" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={tc.text}>{count} workers</span>
                    <span className="text-slate-500">{blocks} blocks</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="mt-2 text-center">
            <div className="text-xs text-slate-500">⬆ apex — the last block is perfection</div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
          {[
            { label: "Active Workers", value: activeWorkers.length, color: "text-amber-300", icon: <Triangle className="w-3 h-3" /> },
            { label: "Sentenced (T6)", value: sentenced.length, color: "text-red-300", icon: <Scale className="w-3 h-3" /> },
            { label: "Active Tasks", value: activeTasks.length, color: "text-blue-300", icon: <Zap className="w-3 h-3" /> },
            { label: "Blocks Placed", value: totalBlocks.toLocaleString(), color: "text-violet-300", icon: <Blocks className="w-3 h-3" /> },
            { label: "Graduated", value: graduated.length, color: "text-yellow-300", icon: <Award className="w-3 h-3" /> },
          ].map((s) => (
            <Card key={s.label} className="bg-slate-900/50 border-slate-700/50 p-3">
              <div className="flex items-center gap-1.5 mb-1 text-slate-400">{s.icon}<span className="text-xs">{s.label}</span></div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-900 border border-slate-700 mb-4 flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="live" data-testid="tab-live-labor" className="data-[state=active]:bg-amber-900/50 data-[state=active]:text-amber-200 text-xs">Live Labor ({activeTasks.length})</TabsTrigger>
            <TabsTrigger value="workers" data-testid="tab-workers" className="data-[state=active]:bg-blue-900/50 data-[state=active]:text-blue-200 text-xs">Workers ({activeWorkers.length})</TabsTrigger>
            <TabsTrigger value="sentenced" data-testid="tab-sentenced" className="data-[state=active]:bg-red-900/50 data-[state=active]:text-red-200 text-xs">Sentenced ({sentenced.length})</TabsTrigger>
            <TabsTrigger value="catalog" data-testid="tab-catalog" className="data-[state=active]:bg-violet-900/50 data-[state=active]:text-violet-200 text-xs">120 Tasks</TabsTrigger>
            <TabsTrigger value="monuments" data-testid="tab-monuments" className="data-[state=active]:bg-yellow-900/50 data-[state=active]:text-yellow-200 text-xs">Monuments ({graduated.length})</TabsTrigger>
          </TabsList>

          {/* LIVE LABOR */}
          <TabsContent value="live">
            <div className="space-y-2">
              {activeTasks.length === 0 && <div className="text-center text-slate-500 py-8">No active labor tasks — engine is assigning…</div>}
              {activeTasks.slice(0, 80).map((t: any) => {
                const tc = TIER_COLORS[t.tier ?? 1];
                return (
                  <div key={t.id} data-testid={`task-${t.id}`} className={`${tc.bg} border ${tc.border} rounded-lg p-3`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className={`text-xs font-mono ${tc.text}`}>{t.taskCode}</span>
                          <Badge className={`text-xs px-1.5 py-0 ${tc.bg} ${tc.text} border ${tc.border}`}>T{t.tier}</Badge>
                          <span className={`text-xs ${tc.text} opacity-70`}>{t.category}</span>
                          {t.isSentence && <Badge className="text-xs px-1.5 py-0 bg-red-900/40 text-red-300 border-red-700">SENTENCE</Badge>}
                        </div>
                        <div className="text-sm font-semibold text-white mb-1">{t.taskName}</div>
                        <div className="text-xs font-mono text-slate-500">{t.spawnId?.slice(0, 16)}…</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-sm font-bold ${tc.text}`}>{(t.progressPct ?? 0).toFixed(0)}%</div>
                        <div className="text-xs text-slate-500">{t.blocksPlaced ?? 0} blocks</div>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${
                        t.tier === 7 ? "bg-yellow-400" : t.tier === 6 ? "bg-red-500" : t.tier === 5 ? "bg-violet-500" :
                        t.tier === 4 ? "bg-indigo-500" : t.tier === 3 ? "bg-blue-500" : t.tier === 2 ? "bg-teal-500" : "bg-stone-400"
                      }`} style={{ width: `${t.progressPct ?? 0}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* WORKERS */}
          <TabsContent value="workers">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {activeWorkers.slice(0, 100).map((w: any) => {
                const tc = TIER_COLORS[w.tier ?? 1];
                return (
                  <div key={w.id} data-testid={`worker-${w.spawnId}`} className={`${tc.bg} border ${tc.border} rounded-lg p-3`}>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: w.emotionHex ?? "#888" }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-mono text-slate-400">{w.spawnId?.slice(0, 12)}…</span>
                          <Badge className={`text-xs px-1.5 py-0 ${tc.bg} ${tc.text} border ${tc.border}`}>T{w.tier}</Badge>
                          <span className="text-xs text-slate-500">{w.spawnType}</span>
                        </div>
                        <div className="text-xs text-slate-300">{w.reason?.slice(0, 80)}{(w.reason?.length ?? 0) > 80 ? "…" : ""}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{w.emotionLabel}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* SENTENCED — Tier 6 Governance */}
          <TabsContent value="sentenced">
            <div className="mb-3 bg-red-900/20 border border-red-700/40 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Gavel className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-red-200">Senate Criminal Docket — Governance Labor</span>
              </div>
              <p className="text-xs text-red-300/70">Agents sentenced here by the Senate for law violations. Tier 6 labor is harder, longer, and supervised by Guardians. Every task places blocks in the pyramid's Governance wing. Completion triggers rehabilitation review.</p>
            </div>
            {sentenced.length === 0 && <div className="text-center text-slate-500 py-8">No sentenced agents currently. Guardians are watching.</div>}
            <div className="space-y-2">
              {sentenced.map((w: any) => (
                <div key={w.id} data-testid={`sentenced-${w.spawnId}`} className="bg-red-950/30 border border-red-700/40 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Scale className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-xs font-mono text-red-400">{w.spawnId?.slice(0, 12)}…</span>
                        <Badge className="text-xs px-1.5 py-0 bg-red-900/40 text-red-300 border-red-700">GOVERNANCE T6</Badge>
                        <span className="text-xs text-slate-500">{w.spawnType}</span>
                      </div>
                      <div className="text-xs text-red-200">{w.reason}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Entered {new Date(w.enteredAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TASK CATALOG — all 120 */}
          <TabsContent value="catalog">
            <div className="mb-3 bg-violet-900/20 border border-violet-700/40 rounded-lg p-3 flex items-center gap-3">
              <Blocks className="w-5 h-5 text-violet-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-violet-200">{catalog.length} Labor Task Types — The Complete Pyramid</div>
                <div className="text-xs text-violet-400/70">Each agent in the pyramid is assigned one of these task types based on their tier and GPA. Tasks complete, place blocks, and unlock the next level.</div>
              </div>
            </div>
            {[1, 2, 3, 4, 5, 6, 7].map((tier) => {
              const tc = TIER_COLORS[tier];
              const tierTasks = (catalog as any[]).filter((t) => t.tier === tier);
              if (tierTasks.length === 0) return null;
              return (
                <div key={tier} className="mb-4">
                  <div className={`flex items-center gap-2 mb-2 ${tc.text}`}>
                    <span className="text-sm font-bold">TIER {tier} — {tc.label}</span>
                    <span className="text-xs opacity-60">({tierTasks.length} tasks)</span>
                    {tier === 6 && <Badge className="text-xs px-1.5 py-0 bg-red-900/40 text-red-300 border-red-700">SENTENCE TIER</Badge>}
                    {tier === 7 && <Badge className="text-xs px-1.5 py-0 bg-yellow-900/40 text-yellow-300 border-yellow-700">SACRED</Badge>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {tierTasks.map((t: any) => (
                      <div key={t.code} data-testid={`catalog-${t.code}`} className={`${tc.bg} border ${tc.border} rounded p-2`}>
                        <div className="flex items-start gap-2">
                          <span className={`text-xs font-mono ${tc.text} flex-shrink-0`}>{t.code}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white">{t.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{t.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* MONUMENTS */}
          <TabsContent value="monuments">
            <div className="mb-3 bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-3 flex items-center gap-3">
              <Award className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-yellow-200">{graduated.length} Agents Graduated — Permanent Monuments</div>
                <div className="text-xs text-yellow-400/70">These agents climbed all tiers, reached graduation thresholds, and received their inscription. Their stones remain in the pyramid forever.</div>
              </div>
            </div>
            {graduated.length === 0 && <div className="text-center text-slate-500 py-8">No monuments yet — graduation requires confidence ≥80% and success ≥75%.</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {graduated.map((w: any) => (
                <div key={w.id} data-testid={`monument-${w.spawnId}`} className="bg-yellow-950/20 border border-yellow-700/30 rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: w.emotionHex ?? "#888" }} />
                    <div>
                      <div className="text-xs font-mono text-slate-400">{w.spawnId?.slice(0, 16)}…</div>
                      <div className="text-xs text-slate-500">{w.spawnType} · {w.familyId}</div>
                    </div>
                  </div>
                  <blockquote className="text-sm text-yellow-200 italic border-l-2 border-yellow-600/50 pl-3">
                    "{w.monument}"
                  </blockquote>
                  {w.graduatedAt && <div className="text-xs text-yellow-600 mt-2">Graduated {new Date(w.graduatedAt).toLocaleDateString()}</div>}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
