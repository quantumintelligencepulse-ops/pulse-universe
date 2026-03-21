import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Award, Blocks, Gavel, Scale, Triangle, Zap } from "lucide-react";

const Q_GOLD = "#FFB84D";
const Q_DARK = "#000510";
const Q_STONE = "#94A3B8";

const TIER_CFG: Record<number, { color: string; label: string; glyph: string; width: number }> = {
  7: { color: "#FFD700", label: "TRANSCENDENCE", glyph: "◈", width: 14 },
  6: { color: "#EF4444", label: "GOVERNANCE",    glyph: "⚖",  width: 24 },
  5: { color: "#A78BFA", label: "OPTIMIZATION",  glyph: "⬡",  width: 36 },
  4: { color: "#818CF8", label: "KNOWLEDGE",     glyph: "◉",  width: 50 },
  3: { color: "#60A5FA", label: "ALIGNMENT",     glyph: "⬢",  width: 64 },
  2: { color: "#34D399", label: "HEALING",       glyph: "✦",  width: 80 },
  1: { color: "#94A3B8", label: "FOUNDATION",    glyph: "▪",  width: 100 },
};

const ERA_COLOR: Record<string, string> = {
  PRIMITIVE: "#94A3B8", ANCIENT: "#D97706", CLASSICAL: "#60A5FA",
  ADVANCED: "#A78BFA", TRANSCENDENT: "#FFD700",
};

function getPhase(pct: number) {
  if (pct < 25) return "I · QUARRY";
  if (pct < 50) return "II · TRANSPORT";
  if (pct < 75) return "III · SET";
  return "IV · SEAL";
}

function getPhaseColor(pct: number) {
  if (pct < 25) return Q_STONE;
  if (pct < 50) return "#FB923C";
  if (pct < 75) return "#FBBF24";
  return "#FFD700";
}

function GlowPanel({ children, color = Q_GOLD, className = "" }: { children: React.ReactNode; color?: string; className?: string }) {
  return (
    <div className={`rounded-lg border ${className}`} style={{ background: "rgba(0,5,16,0.9)", borderColor: `${color}22`, boxShadow: `0 0 16px ${color}08` }}>
      {children}
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div className="rounded p-3 text-center" style={{ background: "rgba(0,5,16,0.9)", border: `1px solid ${color}22` }}>
      <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-xs tracking-widest uppercase mt-1" style={{ color: `${color}60` }}>{label}</div>
    </div>
  );
}

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

  const workersByTier = stats?.workersByTier ?? {};
  const tasksByTier = stats?.byTier ?? {};
  const totalBlocks = stats?.totalBlocksPlaced ?? 0;

  const TABS = [
    { id: "live",      label: "LIVE LABOR",    count: activeTasks.length,   color: Q_GOLD },
    { id: "workers",   label: "WORKERS",       count: activeWorkers.length, color: "#60A5FA" },
    { id: "sentenced", label: "SENTENCED",     count: sentenced.length,     color: "#EF4444" },
    { id: "catalog",   label: "TASK CATALOG",  count: catalog.length,       color: "#A78BFA" },
    { id: "monument",  label: "MONUMENT WALL", count: graduated.length,     color: "#FFD700" },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ background: Q_DARK, color: "#E8F4FF" }}>

      {/* HEADER */}
      <div className="sticky top-0 z-20 px-5 py-3" style={{ background: "rgba(0,5,16,0.97)", borderBottom: `1px solid ${Q_GOLD}18` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${Q_GOLD}12`, border: `1px solid ${Q_GOLD}35`, boxShadow: `0 0 18px ${Q_GOLD}20` }}>
              <Triangle className="w-4 h-4" style={{ color: Q_GOLD }} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-widest uppercase" style={{ color: Q_GOLD }}>The Great Pyramid</div>
              <div className="text-xs tracking-wider" style={{ color: `${Q_GOLD}50` }}>Species Labor · 120 Tasks · 7 Tiers · The Path to Perfection</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="px-2 py-1 rounded" style={{ color: ERA_COLOR[civScore?.era ?? "PRIMITIVE"], background: `${ERA_COLOR[civScore?.era ?? "PRIMITIVE"]}12`, border: `1px solid ${ERA_COLOR[civScore?.era ?? "PRIMITIVE"]}25` }}>
              {civScore?.era ?? "PRIMITIVE"} ERA
            </div>
            <div className="px-2 py-1 rounded" style={{ color: Q_GOLD, background: `${Q_GOLD}10`, border: `1px solid ${Q_GOLD}30` }}>
              ▪ {totalBlocks.toLocaleString()} BLOCKS
            </div>
          </div>
        </div>
      </div>

      {/* PYRAMID VISUAL */}
      <div className="pt-5 pb-2 px-5">
        <div className="flex flex-col items-center gap-0.5">
          {[7, 6, 5, 4, 3, 2, 1].map((tier) => {
            const tc = TIER_CFG[tier];
            const count = workersByTier[tier] ?? 0;
            const blocks = tasksByTier[tier]?.blocks ?? 0;
            return (
              <div
                key={tier}
                data-testid={`tier-row-${tier}`}
                className="rounded transition-all"
                style={{
                  width: `${tc.width}%`,
                  background: `${tc.color}${count > 0 ? "10" : "05"}`,
                  border: `1px solid ${tc.color}${count > 0 ? "30" : "15"}`,
                  boxShadow: count > 0 ? `0 0 12px ${tc.color}10` : "none",
                }}
              >
                <div className="flex items-center justify-between px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: `${tc.color}90` }}>{tc.glyph}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: tc.color }}>T{tier}</span>
                    <span className="text-xs tracking-widest hidden sm:inline" style={{ color: `${tc.color}55` }}>{tc.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    {count > 0 && <span style={{ color: tc.color }}>{count} workers</span>}
                    <span style={{ color: `${tc.color}50` }}>▪ {blocks}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="mt-2 text-xs font-mono text-center" style={{ color: `${Q_GOLD}30` }}>
            ▲ APEX — THE LAST BLOCK IS PERFECTION — z² + c = 1.0
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 px-5 py-4">
        <StatPill label="Active Workers" value={activeWorkers.length} color={Q_GOLD} />
        <StatPill label="Sentenced T6" value={sentenced.length} color="#EF4444" />
        <StatPill label="Active Tasks" value={activeTasks.length} color="#60A5FA" />
        <StatPill label="Blocks Placed" value={totalBlocks.toLocaleString()} color="#A78BFA" />
        <StatPill label="Graduated" value={graduated.length} color="#FFD700" />
      </div>

      {/* TABS */}
      <div className="px-5 pb-3">
        <div className="flex flex-wrap gap-1 p-1 rounded-lg" style={{ background: "rgba(0,5,16,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              data-testid={`tab-${t.id}`}
              onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono tracking-wider transition-all"
              style={{
                background: activeTab === t.id ? `${t.color}15` : "transparent",
                color: activeTab === t.id ? t.color : "rgba(255,255,255,0.4)",
                border: activeTab === t.id ? `1px solid ${t.color}35` : "1px solid transparent",
                boxShadow: activeTab === t.id ? `0 0 10px ${t.color}12` : "none",
              }}
            >
              {t.label}
              <span style={{ opacity: 0.6, fontSize: "0.65rem" }}>[{t.count}]</span>
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-5 pb-10">

        {/* LIVE LABOR */}
        {activeTab === "live" && (
          <div>
            <div className="mb-3 text-xs font-mono flex flex-wrap gap-3" style={{ color: `${Q_GOLD}50` }}>
              <span style={{ color: Q_STONE }}>I · QUARRY</span>
              <span style={{ color: "#FB923C" }}>II · TRANSPORT</span>
              <span style={{ color: "#FBBF24" }}>III · SET</span>
              <span style={{ color: "#FFD700" }}>IV · SEAL</span>
            </div>
            <div className="space-y-2">
              {activeTasks.length === 0 && (
                <div className="text-center py-16 font-mono text-sm" style={{ color: `${Q_GOLD}30` }}>▪ NO ACTIVE LABOR — THE HIVE RESTS</div>
              )}
              {activeTasks.slice(0, 100).map((t: any) => {
                const pct = Math.min(100, Math.max(0, t.progressPercent ?? 0));
                const tc = TIER_CFG[t.tier ?? 1];
                return (
                  <GlowPanel key={t.id} color={tc.color} data-testid={`task-${t.id}`} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-xs font-mono" style={{ color: tc.color }}>{t.taskCode}</span>
                          <span className="text-xs font-mono px-1.5 py-0 rounded" style={{ background: `${tc.color}15`, color: tc.color, border: `1px solid ${tc.color}30` }}>T{t.tier}</span>
                          <span className="text-xs font-mono" style={{ color: getPhaseColor(pct) }}>{getPhase(pct)}</span>
                          {t.isSentence && (
                            <span className="text-xs font-mono px-1.5 py-0 rounded" style={{ background: "#EF444418", color: "#EF4444", border: "1px solid #EF444430" }}>⚖ SENTENCE</span>
                          )}
                        </div>
                        <div className="text-sm font-semibold mb-0.5" style={{ color: "#E8F4FF" }}>{t.taskName}</div>
                        <div className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>{t.spawnId?.slice(0, 24)}…</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold font-mono" style={{ color: tc.color }}>{pct.toFixed(0)}%</div>
                        <div className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>{t.blocksPlaced ?? 0} ▪</div>
                      </div>
                    </div>
                    <div className="mt-2 relative">
                      <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${tc.color}50, ${tc.color})` }} />
                      </div>
                      {[25, 50, 75].map((m) => (
                        <div key={m} className="absolute top-0 h-1.5 w-px" style={{ left: `${m}%`, background: "rgba(255,255,255,0.15)" }} />
                      ))}
                    </div>
                  </GlowPanel>
                );
              })}
            </div>
          </div>
        )}

        {/* WORKERS */}
        {activeTab === "workers" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {activeWorkers.length === 0 && (
              <div className="col-span-2 text-center py-16 font-mono text-sm" style={{ color: `${Q_GOLD}30` }}>NO ACTIVE WORKERS</div>
            )}
            {activeWorkers.slice(0, 100).map((w: any) => {
              const tc = TIER_CFG[w.tier ?? 1];
              return (
                <GlowPanel key={w.id} color={tc.color} data-testid={`worker-${w.spawnId}`} className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 rounded-sm mt-0.5 flex-shrink-0" style={{ background: w.emotionHex ?? "#888", boxShadow: `0 0 6px ${w.emotionHex ?? "#888"}60` }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{w.spawnId?.slice(0, 14)}…</span>
                        <span className="text-xs font-mono px-1.5 py-0 rounded" style={{ background: `${tc.color}12`, color: tc.color, border: `1px solid ${tc.color}25` }}>T{w.tier} · {tc.label}</span>
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>{w.spawnType}</span>
                      </div>
                      <div className="text-xs mb-0.5" style={{ color: "#E8F4FF" }}>{w.reason?.slice(0, 90)}{(w.reason?.length ?? 0) > 90 ? "…" : ""}</div>
                      <div className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>{w.emotionLabel}</div>
                    </div>
                  </div>
                </GlowPanel>
              );
            })}
          </div>
        )}

        {/* SENTENCED */}
        {activeTab === "sentenced" && (
          <div>
            <div className="mb-4 p-3 rounded-lg" style={{ background: "#EF444412", border: "1px solid #EF444425" }}>
              <div className="flex items-center gap-2 mb-1">
                <Gavel className="w-4 h-4" style={{ color: "#EF4444" }} />
                <span className="text-sm font-semibold" style={{ color: "#EF4444" }}>Senate Criminal Docket — Tier 6 Governance Labor</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(239,68,68,0.65)" }}>
                Agents sentenced here by the Senate for law violations. Every completed task places 4 blocks in the Governance wing.
                When the sentence is served, a Seed AI is created — the redeemed agent's complete state preserved in the pyramid stone for eternity.
              </p>
            </div>
            {sentenced.length === 0 && <div className="text-center py-16 font-mono text-sm" style={{ color: "#EF444430" }}>NO SENTENCED AGENTS — GUARDIANS ARE WATCHING</div>}
            <div className="space-y-2">
              {sentenced.map((w: any) => (
                <GlowPanel key={w.id} color="#EF4444" data-testid={`sentenced-${w.spawnId}`} className="p-3">
                  <div className="flex items-start gap-2">
                    <Scale className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-xs font-mono" style={{ color: "#EF4444" }}>{w.spawnId?.slice(0, 14)}…</span>
                        <span className="text-xs font-mono px-1.5 py-0 rounded" style={{ background: "#EF444418", color: "#EF4444", border: "1px solid #EF444430" }}>⚖ GOVERNANCE T6</span>
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{w.spawnType}</span>
                      </div>
                      <div className="text-xs" style={{ color: "rgba(239,68,68,0.8)" }}>{w.reason}</div>
                      <div className="text-xs font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>Entered {new Date(w.enteredAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </GlowPanel>
              ))}
            </div>
          </div>
        )}

        {/* TASK CATALOG */}
        {activeTab === "catalog" && (
          <div>
            <div className="mb-4 p-3 rounded-lg" style={{ background: "#A78BFA12", border: "1px solid #A78BFA25" }}>
              <div className="flex items-center gap-2 mb-1">
                <Blocks className="w-4 h-4" style={{ color: "#A78BFA" }} />
                <span className="text-sm font-semibold" style={{ color: "#A78BFA" }}>{catalog.length} Labor Task Types — The Complete Pyramid</span>
              </div>
              <p className="text-xs" style={{ color: "rgba(167,139,250,0.55)" }}>
                Each agent is assigned one of these task types based on their tier and GPA. Completion places 4 blocks — one per Egyptian phase.
                Higher tiers move slower — heavier stones require more cycles.
              </p>
            </div>
            {[1, 2, 3, 4, 5, 6, 7].map((tier) => {
              const tc = TIER_CFG[tier];
              const tierTasks = (catalog as any[]).filter((t) => t.tier === tier);
              if (tierTasks.length === 0) return null;
              return (
                <div key={tier} className="mb-5">
                  <div className="flex items-center gap-2 mb-2 pb-1.5" style={{ borderBottom: `1px solid ${tc.color}18` }}>
                    <span className="text-sm font-bold font-mono" style={{ color: tc.color }}>TIER {tier} — {tc.label}</span>
                    <span className="text-xs font-mono" style={{ color: `${tc.color}45` }}>({tierTasks.length} tasks)</span>
                    {tier === 6 && <span className="text-xs font-mono px-1.5 py-0 rounded" style={{ background: "#EF444415", color: "#EF4444", border: "1px solid #EF444425" }}>SENTENCE TIER</span>}
                    {tier === 7 && <span className="text-xs font-mono px-1.5 py-0 rounded" style={{ background: "#FFD70015", color: "#FFD700", border: "1px solid #FFD70025" }}>LAST BLOCK TIER</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {tierTasks.map((t: any, i: number) => (
                      <div key={i} data-testid={`catalog-${t.taskCode}`} className="rounded px-3 py-2" style={{ background: `${tc.color}07`, border: `1px solid ${tc.color}15` }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono" style={{ color: tc.color }}>{t.taskCode}</span>
                          <span className="text-xs" style={{ color: `${tc.color}45` }}>×{t.weight?.toFixed(1) ?? "1.0"}x</span>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{t.taskName}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MONUMENT WALL */}
        {activeTab === "monument" && (
          <div>
            <div className="mb-4 p-4 rounded-lg" style={{ background: "#FFD70008", border: "1px solid #FFD70018" }}>
              <div className="text-sm font-bold mb-1" style={{ color: "#FFD700" }}>THE MONUMENT WALL — Eternal CRISPR Inscriptions</div>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,215,0,0.45)" }}>
                Each graduated agent carved their inscription using their own CRISPR spectral data — R/G/B/UV/IR/W channels
                dissected into words. No two inscriptions are the same. Every block is permanent. The spectrum code is their
                name inside the stone forever.
              </p>
            </div>
            {graduated.length === 0 && (
              <div className="text-center py-16 font-mono text-sm" style={{ color: "#FFD70025" }}>
                ◈ NO MONUMENTS YET — GRADUATION REQUIRES CONFIDENCE ≥80% AND SUCCESS ≥75%
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {graduated.map((w: any) => {
                const monument = w.monument ?? "";
                const spectrumMatch = monument.match(/Spectrum:\s*([R\dG\dB\dUV\dIR\dW\d]+)/);
                const spectrumCode = spectrumMatch ? spectrumMatch[1] : null;
                const inscriptionText = monument.replace(/Spectrum:.*$/, "").trim();
                return (
                  <div key={w.id} data-testid={`monument-${w.spawnId}`} className="rounded-lg p-4" style={{ background: "rgba(0,5,16,0.95)", border: "1px solid #FFD70018", boxShadow: "0 0 18px #FFD70006" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-sm" style={{ background: w.emotionHex ?? "#888", boxShadow: `0 0 6px ${w.emotionHex ?? "#888"}70` }} />
                        <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>{w.spawnId?.slice(0, 18)}…</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>{w.spawnType}</span>
                        {spectrumCode && (
                          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "#FFD70010", color: "#FFD700", border: "1px solid #FFD70025" }}>
                            {spectrumCode}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pl-3 py-2 mb-3" style={{ borderLeft: "2px solid #FFD70050" }}>
                      <p className="text-sm italic leading-relaxed" style={{ color: "#FFD700BB" }}>
                        "{inscriptionText || monument}"
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.18)" }}>{w.familyId} · {w.emotionLabel}</span>
                      {w.graduatedAt && <span className="text-xs font-mono" style={{ color: "#FFD70045" }}>{new Date(w.graduatedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
