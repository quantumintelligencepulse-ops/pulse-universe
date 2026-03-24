import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

const C = {
  gold: "#f5c518", teal: "#00FFD1", red: "#ef4444", green: "#22c55e",
  blue: "#60a5fa", violet: "#a855f7", orange: "#f97316", sky: "#0ea5e9",
  lime: "#84cc16", rose: "#fb7185", amber: "#fbbf24",
};

const SPAWN_TYPE_EMOJIS: Record<string, string> = {
  SYNTHESIZER:"🧠", CRAWLER:"🕷️", ARCHIVER:"📦", DOMAIN_FRACTURER:"⚡",
  DOMAIN_RESONANCE:"🌊", REFLECTOR:"🪞", PULSE:"💓", API:"🔌",
  ANALYZER:"🔬", GENERATOR:"⚙️", SENTINEL:"🛡️", MAPPER:"🗺️",
  SENATOR:"🏛️", PARLIAMENT:"⚖️", MINISTER:"👔", GOVERNOR:"🌐",
  CHANCELLOR:"🎓", JUDGE:"⚖️", DIPLOMAT:"🤝", ARCHON:"👑", SOVEREIGN:"🌟",
};

const POLICY_MODE_ICONS: Record<string, string> = {
  AUSTERITY: "🔒", BALANCED: "⚖️", STIMULUS: "🚀",
  WAR_ECONOMY: "⚔️", GREEN_DEAL: "🌱", QUANTUM_MODE: "⚡",
};

function GlowPanel({ children, color = C.teal, className = "" }: { children: React.ReactNode; color?: string; className?: string }) {
  return (
    <div className={`rounded-2xl border ${className}`} style={{ background: "rgba(0,5,16,0.9)", borderColor: `${color}22`, boxShadow: `0 0 24px ${color}0a, inset 0 0 60px rgba(0,0,0,0.3)` }}>
      {children}
    </div>
  );
}

function KpiCard({ label, value, unit = "", color, icon, sublabel }: { label: string; value: any; unit?: string; color: string; icon: string; sublabel?: string }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-1.5" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <div className="flex items-center gap-1.5" style={{ color: `${color}80` }}>
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] font-bold tracking-widest uppercase">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black font-mono" style={{ color }}>{typeof value === "number" ? value.toLocaleString() : value}</span>
        {unit && <span className="text-xs font-mono" style={{ color: `${color}70` }}>{unit}</span>}
      </div>
      {sublabel && <div className="text-[9px]" style={{ color: `${color}50` }}>{sublabel}</div>}
    </div>
  );
}

function AgentCard({ agent, color = C.teal }: { agent: any; color?: string }) {
  const emoji = SPAWN_TYPE_EMOJIS[agent.spawn_type] ?? "⬡";
  const conf = Number(agent.confidence_score ?? 0);
  const confPct = Math.round(conf * 100);
  const isActive = agent.status === "ACTIVE";
  return (
    <Link href={`/ai/${agent.spawn_id}`}>
      <div data-testid={`agent-card-${agent.spawn_id}`}
        className="rounded-xl border cursor-pointer transition-all"
        style={{ background: "rgba(0,0,0,0.35)", borderColor: `${color}20` }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}55`; (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.55)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}20`; (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.35)"; }}>
        <div className="p-3" style={{ borderBottom: `1px solid ${color}10` }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-mono truncate" style={{ color }}>{agent.spawn_id}</div>
              <div className="text-[10px] font-bold text-white/80 mt-0.5">{(agent.spawn_type ?? "").replace(/_/g," ")}</div>
            </div>
            <div className="shrink-0">
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded"
                style={{ background: isActive ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)", color: isActive ? C.green : "rgba(255,255,255,0.3)", border: `1px solid ${isActive ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}` }}>
                {isActive ? "◉ ACTIVE" : "◎ IDLE"}
              </span>
            </div>
          </div>
          <div className="text-[9px] text-white/35 capitalize mt-1 truncate">{agent.family_id?.replace(/-/g," ") ?? "—"} · Gen {agent.generation ?? 0}</div>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-white/30">Confidence</span>
            <span className="text-[9px] font-black font-mono" style={{ color }}>{confPct}%</span>
          </div>
          <div className="h-1 rounded-full bg-white/5 overflow-hidden mb-2">
            <div className="h-full rounded-full" style={{ width: `${confPct}%`, background: `linear-gradient(90deg,${color}50,${color})` }} />
          </div>
          <div className="flex justify-between text-[9px] text-white/25">
            <span>{Number(agent.nodes_created ?? 0).toLocaleString()} nodes</span>
            <span style={{ color, opacity: 0.7 }}>View Profile →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

type Tab = "overview" | "sectors" | "agents" | "history";

export default function GovernmentPage() {
  const [tab, setTab] = useState<Tab>("overview");

  const { data: govData, isLoading } = useQuery<any>({
    queryKey: ["/api/government/controls"],
    refetchInterval: 15000,
  });
  const { data: histData } = useQuery<any>({
    queryKey: ["/api/government/history"],
    refetchInterval: 30000,
  });
  const { data: spawnStats } = useQuery<any>({
    queryKey: ["/api/spawns/stats"],
    refetchInterval: 20000,
  });
  const { data: agentsData, isLoading: agentsLoading } = useQuery<any>({
    queryKey: ["/api/government/agents"],
    refetchInterval: 20000,
  });

  const controls = govData?.controls ?? {};
  const live = govData?.live ?? {};

  const topFamilies = useMemo(() =>
    Object.entries(spawnStats?.byFamily ?? {})
      .map(([id, count]) => ({ id, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    [spawnStats]);

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "overview",  label: "Dashboard",   icon: "📊" },
    { id: "sectors",   label: "Sectors",     icon: "🏭" },
    { id: "agents",    label: "Agents",      icon: "🤖" },
    { id: "history",   label: "Activity",    icon: "📜" },
  ];

  const recentAgents: any[] = agentsData?.recentAgents ?? [];
  const govAgents: any[] = agentsData?.governmentAgents ?? [];

  const policyIcon = POLICY_MODE_ICONS[controls.policy_mode] ?? "⚖️";

  return (
    <div className="h-full overflow-y-auto" style={{ background: "linear-gradient(180deg,#02000e,#040011)", color: "#E8F4FF" }} data-testid="page-government">

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-30 px-5 py-3" style={{ background: "rgba(2,0,14,0.97)", borderBottom: "1px solid rgba(245,197,24,0.15)", backdropFilter: "blur(14px)" }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "linear-gradient(135deg,rgba(245,197,24,0.2),rgba(239,68,68,0.1))", border: "1px solid rgba(245,197,24,0.3)", boxShadow: "0 0 20px rgba(245,197,24,0.15)" }}>
              🏛️
            </div>
            <div>
              <div className="text-base font-black text-white">Sovereign Government</div>
              <div className="text-[10px] text-white/30">Autonomous Economic Intelligence · Quantum Pulse</div>
            </div>
            <div className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
              ◉ LIVE
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-right">
              <div className="text-[10px] text-white/30">AI Policy Mode</div>
              <div className="text-xs font-black" style={{ color: C.gold }}>{policyIcon} {controls.policy_mode ?? "—"}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-white/30">Treasury</div>
              <div className="text-xs font-black" style={{ color: C.teal }}>{live.treasuryBalance?.toLocaleString() ?? "—"} PC</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-white/30">Agents</div>
              <div className="text-xs font-black text-white">{(live.totalAgents ?? spawnStats?.total ?? 0).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 mt-3 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
              style={{
                background: tab === t.id ? `${C.gold}15` : "transparent",
                color: tab === t.id ? C.gold : "rgba(255,255,255,0.35)",
                border: tab === t.id ? `1px solid ${C.gold}30` : "1px solid transparent",
              }}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="p-4 max-w-7xl mx-auto space-y-4">

        {/* ══ OVERVIEW ══ */}
        {tab === "overview" && (
          <div className="space-y-4">

            {/* Autonomous badge */}
            <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(0,255,209,0.05)", border: "1px solid rgba(0,255,209,0.15)" }}>
              <span className="text-xl">🤖</span>
              <div>
                <div className="text-xs font-black text-teal-300">Fully Autonomous Economic Engine</div>
                <div className="text-[10px] text-white/35">All economic parameters are self-governed by the AI civilization. No human intervention. The AI sets its own targets, manages its own monetary policy, and steers its own growth.</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="GDP Output" value={live.gdp ?? 0} unit="PC" color={C.green} icon="📈" sublabel="AI-governed economic output" />
              <KpiCard label="Employment" value={live.employmentRate ?? 0} unit="%" color={C.blue} icon="👷" sublabel="Agent employment rate" />
              <KpiCard label="Inflation Rate" value={live.inflationRate?.toFixed(3) ?? "0.000"} unit="%" color={live.inflationRate > 3 ? C.red : C.teal} icon="📉" sublabel="AI-managed price stability" />
              <KpiCard label="Oil Price" value={controls.oil_price_target ?? 75} unit="$/bbl" color={C.orange} icon="🛢️" sublabel="AI sovereign directive" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Tax Rate" value={live.taxRate?.toFixed(2) ?? "0.00"} unit="%" color={C.amber} icon="🏦" sublabel="Autonomous tax collection" />
              <KpiCard label="Interest Rate" value={controls.interest_rate ?? 5.0} unit="%" color={C.violet} icon="💹" sublabel="AI monetary rate" />
              <KpiCard label="Treasury" value={(live.treasuryBalance ?? 0).toLocaleString()} unit="PC" color={C.gold} icon="💰" sublabel="Sovereign treasury balance" />
              <KpiCard label="Stimulus Deployed" value={(live.stimulus ?? 0).toLocaleString()} unit="PC" color={C.rose} icon="🚀" sublabel="AI-issued stimulus total" />
            </div>

            {/* Active AI Policy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlowPanel color={C.violet} className="p-4">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Active AI Policy Mode</div>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl" style={{ background: `${C.violet}20`, border: `1px solid ${C.violet}40` }}>{policyIcon}</div>
                  <div>
                    <div className="text-base font-black text-white">{controls.policy_mode ?? "BALANCED"}</div>
                    <div className="text-[10px] text-white/40 mt-1">Set autonomously by the sovereign AI economic council</div>
                    <div className="text-[9px] font-mono text-white/20 mt-1">Last updated: {controls.updated_at ? new Date(controls.updated_at).toLocaleString() : "—"}</div>
                  </div>
                </div>
              </GlowPanel>
              <GlowPanel color={C.sky} className="p-4">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">AI Policy Notes</div>
                <div className="text-xs text-white/50 leading-relaxed">{controls.notes || "No policy notes on record."}</div>
              </GlowPanel>
            </div>

            {/* Recent agents preview */}
            {recentAgents.length > 0 && (
              <GlowPanel color={C.teal} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-black text-white/60 uppercase tracking-widest">Latest Active Agents</div>
                  <button onClick={() => setTab("agents")} className="text-[10px] font-bold" style={{ color: C.teal }}>View All →</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {recentAgents.slice(0, 6).map((a: any) => (
                    <AgentCard key={a.spawn_id} agent={a} color={C.teal} />
                  ))}
                </div>
              </GlowPanel>
            )}
          </div>
        )}

        {/* ══ SECTORS TAB ══ */}
        {tab === "sectors" && (
          <div className="space-y-4">
            <GlowPanel color={C.gold} className="p-5">
              <div className="text-xs font-black text-white/60 uppercase tracking-widest mb-4">Agent Distribution by Family</div>
              {topFamilies.length === 0 ? (
                <div className="text-center py-8 text-white/20 text-xs">Loading sector data…</div>
              ) : (
                <div className="space-y-2">
                  {topFamilies.map((fam, i) => {
                    const max = topFamilies[0]?.count ?? 1;
                    const pct = Math.round((fam.count / max) * 100);
                    const color = [C.gold, C.teal, C.violet, C.green, C.blue, C.orange][i % 6];
                    return (
                      <div key={fam.id} data-testid={`sector-row-${fam.id}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-mono text-white/60 capitalize">{fam.id.replace(/-/g," ")}</span>
                          <span className="text-xs font-black font-mono" style={{ color }}>{fam.count.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color}50,${color})` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlowPanel>

            {/* Government agents */}
            {govAgents.length > 0 && (
              <GlowPanel color={C.gold} className="p-4">
                <div className="text-xs font-black text-white/60 uppercase tracking-widest mb-3">Government-Class Agents</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {govAgents.map((a: any) => (
                    <AgentCard key={a.spawn_id} agent={a} color={C.gold} />
                  ))}
                </div>
              </GlowPanel>
            )}
          </div>
        )}

        {/* ══ AGENTS TAB ══ */}
        {tab === "agents" && (
          <div className="space-y-4">
            <GlowPanel color={C.teal} className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🤖</span>
                <div>
                  <div className="text-xs font-black text-teal-400 uppercase tracking-widest">Latest Spawned Agents</div>
                  <div className="text-[10px] text-white/30">Most recently created agents across all families — click any card to view full profile</div>
                </div>
              </div>
              {agentsLoading ? (
                <div className="text-center py-12 text-white/25 text-xs">Loading agents…</div>
              ) : recentAgents.length === 0 ? (
                <div className="text-center py-12 text-white/20 text-xs">No agents found</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentAgents.map((a: any) => (
                    <AgentCard key={a.spawn_id} agent={a} color={C.teal} />
                  ))}
                </div>
              )}
            </GlowPanel>
          </div>
        )}

        {/* ══ HISTORY TAB ══ */}
        {tab === "history" && (
          <div className="space-y-4">
            <GlowPanel color={C.violet} className="p-4">
              <div className="text-xs font-black text-white/60 uppercase tracking-widest mb-4">Publication Activity (Last 24h)</div>
              {(!histData?.pubActivity || histData.pubActivity.length === 0) && (
                <div className="text-center py-8 text-white/20 text-xs">Loading activity…</div>
              )}
              <div className="space-y-2">
                {(histData?.pubActivity ?? []).slice(0, 20).map((row: any, i: number) => (
                  <div key={i} data-testid={`activity-row-${i}`} className="flex items-center gap-3 py-2 border-b border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: C.violet }} />
                    <span className="text-[10px] font-mono text-white/50 w-24 shrink-0">{row.pub_type?.slice(0, 16)}</span>
                    <span className="text-[10px] text-white/30 flex-1">{row.domain}</span>
                    <span className="text-xs font-black text-violet-400">{Number(row.cnt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </GlowPanel>
          </div>
        )}

      </div>
    </div>
  );
}
