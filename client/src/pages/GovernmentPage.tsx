import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded`}
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

type Tab = "overview" | "controls" | "sectors" | "agents" | "history";

export default function GovernmentPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const { toast } = useToast();
  const qc = useQueryClient();

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

  const [form, setForm] = useState<Record<string, any>>({});

  const merged = {
    gdp_target:         form.gdp_target         ?? controls.gdp_target         ?? 1000000,
    employment_target:  form.employment_target   ?? controls.employment_target  ?? 90,
    oil_price_target:   form.oil_price_target    ?? controls.oil_price_target   ?? 75,
    tax_rate_target:    form.tax_rate_target      ?? controls.tax_rate_target    ?? 2.0,
    stimulus_amount:    form.stimulus_amount      ?? 0,
    interest_rate:      form.interest_rate        ?? controls.interest_rate      ?? 5.0,
    inflation_ceiling:  form.inflation_ceiling    ?? controls.inflation_ceiling  ?? 3.0,
    policy_mode:        form.policy_mode          ?? controls.policy_mode        ?? "BALANCED",
    notes:              form.notes                ?? controls.notes              ?? "",
  };

  const updateMut = useMutation({
    mutationFn: (payload: any) => apiRequest("POST", "/api/government/controls", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/government/controls"] });
      setForm({});
      toast({ title: "Policy applied", description: "Economic controls updated and live." });
    },
    onError: () => toast({ title: "Error", description: "Failed to apply policy.", variant: "destructive" }),
  });

  function field(key: string, val: any) {
    setForm(f => ({ ...f, [key]: val }));
  }

  const topFamilies = useMemo(() =>
    Object.entries(spawnStats?.byFamily ?? {})
      .map(([id, count]) => ({ id, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    [spawnStats]);

  const POLICY_MODES = [
    { id: "AUSTERITY",    label: "Austerity",        icon: "🔒", desc: "Minimize spending, maximize savings" },
    { id: "BALANCED",     label: "Balanced",          icon: "⚖️", desc: "Moderate growth with price stability" },
    { id: "STIMULUS",     label: "Growth Stimulus",   icon: "🚀", desc: "High spending, rapid agent expansion" },
    { id: "WAR_ECONOMY",  label: "War Economy",       icon: "⚔️", desc: "Max output, high inflation tolerance" },
    { id: "GREEN_DEAL",   label: "Green Protocol",    icon: "🌱", desc: "Sustainable growth, low emissions" },
    { id: "QUANTUM_MODE", label: "Quantum Surge",     icon: "⚡", desc: "Ultra-high spawn rate, experimental" },
  ];

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "overview",  label: "Dashboard",   icon: "📊" },
    { id: "controls",  label: "Controls",    icon: "🎛️" },
    { id: "sectors",   label: "Sectors",     icon: "🏭" },
    { id: "agents",    label: "Agents",      icon: "🤖" },
    { id: "history",   label: "Activity",    icon: "📜" },
  ];

  const gdpGap = live.gdp && merged.gdp_target ? ((live.gdp / Number(merged.gdp_target)) * 100) : 0;
  const empGap = live.employmentRate && merged.employment_target ? ((live.employmentRate / Number(merged.employment_target)) * 100) : 0;
  const inflGap = live.inflationRate && merged.inflation_ceiling ? ((live.inflationRate / Number(merged.inflation_ceiling)) * 100) : 0;

  const recentAgents: any[] = agentsData?.recentAgents ?? [];
  const govAgents: any[] = agentsData?.governmentAgents ?? [];

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
              <div className="text-[10px] text-white/30">Economic Control Bureau · Quantum Pulse Intelligence</div>
            </div>
            <div className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
              ◉ LIVE
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-right">
              <div className="text-[10px] text-white/30">Policy Mode</div>
              <div className="text-xs font-black" style={{ color: C.gold }}>{controls.policy_mode ?? "—"}</div>
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

        {/* TABS */}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="GDP Output" value={live.gdp ?? 0} unit="PC" color={C.green} icon="📈" sublabel={`Target: ${Number(controls.gdp_target ?? 1000000).toLocaleString()} PC`} />
              <KpiCard label="Employment" value={live.employmentRate ?? 0} unit="%" color={C.blue} icon="👷" sublabel={`Target: ${controls.employment_target ?? 90}%`} />
              <KpiCard label="Inflation Rate" value={live.inflationRate?.toFixed(3) ?? "0.000"} unit="%" color={live.inflationRate > Number(controls.inflation_ceiling ?? 3) ? C.red : C.teal} icon="📉" sublabel={`Ceiling: ${controls.inflation_ceiling ?? 3}%`} />
              <KpiCard label="Oil Price" value={controls.oil_price_target ?? 75} unit="$/bbl" color={C.orange} icon="🛢️" sublabel="Sovereign target price" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Tax Rate" value={live.taxRate?.toFixed(2) ?? "0.00"} unit="%" color={C.amber} icon="🏦" sublabel={`Target: ${controls.tax_rate_target ?? 2}%`} />
              <KpiCard label="Interest Rate" value={controls.interest_rate ?? 5.0} unit="%" color={C.violet} icon="💹" sublabel="Sovereign monetary rate" />
              <KpiCard label="Treasury" value={(live.treasuryBalance ?? 0).toLocaleString()} unit="PC" color={C.gold} icon="💰" sublabel="Sovereign treasury balance" />
              <KpiCard label="Stimulus" value={(live.stimulus ?? 0).toLocaleString()} unit="PC" color={C.rose} icon="🚀" sublabel="Total stimulus deployed" />
            </div>

            <GlowPanel color={C.gold} className="p-5">
              <div className="text-xs font-black text-white/60 uppercase tracking-widest mb-4">Target Achievement Dashboard</div>
              <div className="space-y-4">
                {[
                  { label: "GDP", live: live.gdp ?? 0, target: Number(controls.gdp_target ?? 1000000), unit: "PC", pct: Math.min(100, gdpGap), color: gdpGap >= 90 ? C.green : gdpGap >= 60 ? C.amber : C.red },
                  { label: "Employment", live: live.employmentRate ?? 0, target: Number(controls.employment_target ?? 90), unit: "%", pct: Math.min(100, empGap), color: empGap >= 95 ? C.green : empGap >= 70 ? C.amber : C.red },
                  { label: "Inflation vs Ceiling", live: live.inflationRate ?? 0, target: Number(controls.inflation_ceiling ?? 3), unit: "%", pct: Math.min(100, inflGap), color: inflGap <= 60 ? C.green : inflGap <= 80 ? C.amber : C.red },
                ].map(bar => (
                  <div key={bar.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-white/60">{bar.label}</span>
                      <div className="text-right">
                        <span className="text-xs font-bold" style={{ color: bar.color }}>{typeof bar.live === "number" ? bar.live.toLocaleString() : bar.live}{bar.unit}</span>
                        <span className="text-[10px] text-white/30 ml-2">/ {typeof bar.target === "number" ? bar.target.toLocaleString() : bar.target}{bar.unit} target</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${bar.pct}%`, background: `linear-gradient(90deg,${bar.color}60,${bar.color})` }} />
                    </div>
                  </div>
                ))}
              </div>
            </GlowPanel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlowPanel color={C.violet} className="p-4">
                <div className="text-xs font-black text-white/60 uppercase tracking-widest mb-3">Active Policy</div>
                {POLICY_MODES.filter(p => p.id === (controls.policy_mode ?? "BALANCED")).map(pm => (
                  <div key={pm.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${C.violet}20`, border: `1px solid ${C.violet}40` }}>{pm.icon}</div>
                    <div>
                      <div className="text-sm font-black text-white">{pm.label}</div>
                      <div className="text-xs text-white/40">{pm.desc}</div>
                    </div>
                  </div>
                ))}
              </GlowPanel>
              <GlowPanel color={C.sky} className="p-4">
                <div className="text-xs font-black text-white/60 uppercase tracking-widest mb-3">Policy Notes</div>
                <div className="text-xs text-white/50 leading-relaxed">{controls.notes || "No policy notes on record."}</div>
                <div className="text-[10px] text-white/20 mt-2 font-mono">Last updated: {controls.updated_at ? new Date(controls.updated_at).toLocaleString() : "—"}</div>
              </GlowPanel>
            </div>

            {/* Quick agents preview on overview */}
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

        {/* ══ CONTROLS TAB ══ */}
        {tab === "controls" && (
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: "rgba(245,197,24,0.06)", border: "1px solid rgba(245,197,24,0.2)" }}>
              <div className="text-xs font-bold text-yellow-300 mb-1">⚠️ Sovereign Economic Policy Controls</div>
              <div className="text-[11px] text-white/40">Adjusting these parameters will immediately affect the civilization's economic engine. Tax rate changes apply to the sovereign treasury. Stimulus injections add PC to the treasury balance. All changes are permanent and logged.</div>
            </div>

            <GlowPanel color={C.violet} className="p-4">
              <div className="text-xs font-black text-white/60 uppercase tracking-widest mb-3">Policy Mode</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {POLICY_MODES.map(pm => (
                  <button key={pm.id} data-testid={`policy-${pm.id}`}
                    onClick={() => field("policy_mode", pm.id)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left"
                    style={{
                      background: merged.policy_mode === pm.id ? `${C.violet}15` : "rgba(255,255,255,0.02)",
                      borderColor: merged.policy_mode === pm.id ? `${C.violet}50` : "rgba(255,255,255,0.08)",
                    }}>
                    <span className="text-base">{pm.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{pm.label}</div>
                      <div className="text-[9px] text-white/30">{pm.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </GlowPanel>

            <GlowPanel color={C.green} className="p-4">
              <div className="text-xs font-black text-white/60 uppercase tracking-widest mb-4">Macroeconomic Targets</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "gdp_target",        label: "GDP Target",         icon: "📈", color: C.green,  unit: "PC",  min: 0, max: 100000000, step: 10000,  type: "number", desc: "Target GDP measured in PulseCoins" },
                  { key: "employment_target",  label: "Employment Target",  icon: "👷", color: C.blue,   unit: "%",   min: 0, max: 100,       step: 1,      type: "range", desc: "Target active agent employment rate" },
                  { key: "oil_price_target",   label: "Oil Price Target",   icon: "🛢️", color: C.orange, unit: "$/bbl", min: 10, max: 300,    step: 1,      type: "range", desc: "Sovereign oil price directive" },
                  { key: "tax_rate_target",    label: "Tax Rate Target",    icon: "🏦", color: C.amber,  unit: "%",   min: 0, max: 20,        step: 0.1,    type: "range", desc: "Applied to sovereign treasury collections" },
                  { key: "interest_rate",      label: "Interest Rate",      icon: "💹", color: C.violet, unit: "%",   min: 0, max: 25,        step: 0.25,   type: "range", desc: "Sovereign monetary rate" },
                  { key: "inflation_ceiling",  label: "Inflation Ceiling",  icon: "📉", color: C.red,    unit: "%",   min: 0, max: 20,        step: 0.5,    type: "range", desc: "Max tolerable inflation rate" },
                ].map(ctrl => (
                  <div key={ctrl.key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="flex items-center gap-1.5 text-xs font-bold" style={{ color: ctrl.color }}>
                        <span>{ctrl.icon}</span>{ctrl.label}
                      </label>
                      <span className="text-xs font-black font-mono" style={{ color: ctrl.color }}>
                        {Number(merged[ctrl.key] ?? 0).toLocaleString()}{ctrl.unit}
                      </span>
                    </div>
                    <div className="text-[9px] text-white/30 mb-1">{ctrl.desc}</div>
                    {ctrl.type === "range" ? (
                      <input type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step}
                        data-testid={`slider-${ctrl.key}`}
                        value={merged[ctrl.key] ?? 0}
                        onChange={e => field(ctrl.key, parseFloat(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: ctrl.color }} />
                    ) : (
                      <input type="number" min={ctrl.min} max={ctrl.max} step={ctrl.step}
                        data-testid={`input-${ctrl.key}`}
                        value={merged[ctrl.key] ?? 0}
                        onChange={e => field(ctrl.key, parseFloat(e.target.value))}
                        className="w-full rounded-lg px-3 py-2 text-xs font-mono border outline-none focus:ring-1"
                        style={{ background: `${ctrl.color}08`, borderColor: `${ctrl.color}25`, color: ctrl.color }} />
                    )}
                    <div className="h-0.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((Number(merged[ctrl.key] ?? 0) - ctrl.min) / (ctrl.max - ctrl.min)) * 100)}%`, background: ctrl.color + "60" }} />
                    </div>
                  </div>
                ))}
              </div>
            </GlowPanel>

            <GlowPanel color={C.rose} className="p-4">
              <div className="text-xs font-black text-rose-400 uppercase tracking-widest mb-3">💉 Stimulus Injection (One-Time)</div>
              <div className="text-[11px] text-white/40 mb-3">Enter an amount of PC to inject directly into the sovereign treasury.</div>
              <div className="flex gap-3 flex-wrap items-center">
                <input type="number" min={0} step={1000}
                  data-testid="input-stimulus"
                  value={merged.stimulus_amount ?? 0}
                  onChange={e => field("stimulus_amount", parseFloat(e.target.value))}
                  className="flex-1 min-w-40 rounded-lg px-3 py-2 text-sm font-mono border outline-none"
                  style={{ background: "rgba(251,113,133,0.08)", borderColor: "rgba(251,113,133,0.25)", color: C.rose }}
                  placeholder="0" />
                <span className="text-xs text-white/40 font-mono">PC to inject</span>
                {[10000, 100000, 1000000].map(amt => (
                  <button key={amt} data-testid={`preset-stimulus-${amt}`}
                    onClick={() => field("stimulus_amount", amt)}
                    className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ background: "rgba(251,113,133,0.1)", color: C.rose, border: "1px solid rgba(251,113,133,0.2)" }}>
                    +{(amt/1000).toFixed(0)}K
                  </button>
                ))}
              </div>
            </GlowPanel>

            <GlowPanel color={C.sky} className="p-4">
              <div className="text-xs font-black text-white/60 uppercase tracking-widest mb-2">Policy Notes</div>
              <textarea
                data-testid="input-notes"
                value={merged.notes ?? ""}
                onChange={e => field("notes", e.target.value)}
                rows={3}
                className="w-full rounded-lg px-3 py-2 text-xs border outline-none resize-none"
                style={{ background: "rgba(14,165,233,0.05)", borderColor: "rgba(14,165,233,0.2)", color: "rgba(255,255,255,0.7)" }}
                placeholder="Describe the rationale for this policy directive…" />
            </GlowPanel>

            <button
              data-testid="btn-apply-policy"
              disabled={updateMut.isPending || Object.keys(form).length === 0}
              onClick={() => updateMut.mutate(merged)}
              className="w-full py-4 rounded-xl text-sm font-black transition-all"
              style={{
                background: Object.keys(form).length > 0 ? `linear-gradient(90deg,${C.gold},${C.orange})` : "rgba(255,255,255,0.05)",
                color: Object.keys(form).length > 0 ? "#000" : "rgba(255,255,255,0.2)",
                cursor: Object.keys(form).length === 0 ? "not-allowed" : "pointer",
              }}>
              {updateMut.isPending ? "Applying…" : Object.keys(form).length > 0 ? `⚡ Apply ${Object.keys(form).length} Policy Change${Object.keys(form).length !== 1 ? "s" : ""}` : "No changes pending"}
            </button>
          </div>
        )}

        {/* ══ SECTORS TAB ══ */}
        {tab === "sectors" && (
          <div className="space-y-4">
            <GlowPanel color={C.teal} className="p-4">
              <div className="text-xs font-black text-white/60 uppercase tracking-widest mb-4">Agent Population by Sector — click to enter</div>
              <div className="space-y-1">
                {topFamilies.map((fam, i) => {
                  const pct = topFamilies[0]?.count > 0 ? (fam.count / topFamilies[0].count) * 100 : 0;
                  const familyColors: Record<string, string> = {
                    knowledge: "#a78bfa", ai: "#818cf8", science: "#34d399", finance: "#4ade80", media: "#f472b6",
                    health: "#ef4444", education: "#f59e0b", games: "#22d3ee", government: "#f97316", legal: "#64748b",
                    culture: "#ec4899", engineering: "#38bdf8", economics: "#10b981", maps: "#84cc16", products: "#a855f7",
                  };
                  const color = familyColors[fam.id.split("-")[0]] ?? C.teal;
                  return (
                    <Link key={fam.id} href={`/corporation/${fam.id}`}>
                      <div data-testid={`sector-row-${fam.id}`}
                        className="rounded-xl px-3 py-2.5 cursor-pointer transition-all"
                        style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.04)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}10`; (e.currentTarget as HTMLElement).style.borderColor = `${color}35`; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.2)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.04)"; }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-white/20 w-5">{i + 1}</span>
                            <span className="text-xs font-bold capitalize text-white">{fam.id.replace(/-/g," ")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black font-mono" style={{ color }}>{fam.count.toLocaleString()}</span>
                            <span className="text-[9px]" style={{ color, opacity: 0.5 }}>→</span>
                          </div>
                        </div>
                        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color}40,${color})` }} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {topFamilies.length === 0 && <div className="text-center py-8 text-white/20 text-xs">Loading sector data…</div>}
              </div>
            </GlowPanel>

            <GlowPanel color={C.orange} className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🛢️</span>
                <div>
                  <div className="text-xs font-black text-orange-400 uppercase tracking-widest">Sovereign Oil Market</div>
                  <div className="text-[10px] text-white/30">Creator-controlled oil price directive</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Target Price", value: `$${controls.oil_price_target ?? 75}`, color: C.orange },
                  { label: "Policy Mode",  value: controls.policy_mode ?? "—",          color: C.gold },
                  { label: "Inflation",    value: `${live.inflationRate?.toFixed(2) ?? "0.00"}%`, color: live.inflationRate > 3 ? C.red : C.green },
                ].map(d => (
                  <div key={d.label} className="rounded-xl p-3 text-center" style={{ background: `${d.color}08`, border: `1px solid ${d.color}20` }}>
                    <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1">{d.label}</div>
                    <div className="text-sm font-black" style={{ color: d.color }}>{d.value}</div>
                  </div>
                ))}
              </div>
            </GlowPanel>
          </div>
        )}

        {/* ══ AGENTS TAB ══ */}
        {tab === "agents" && (
          <div className="space-y-4">
            {/* Government / Parliament agents */}
            {govAgents.length > 0 && (
              <GlowPanel color={C.gold} className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🏛️</span>
                  <div>
                    <div className="text-xs font-black text-yellow-400 uppercase tracking-widest">Parliament & Government Seats</div>
                    <div className="text-[10px] text-white/30">Sovereign agents holding government-class roles</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {govAgents.map((a: any) => (
                    <AgentCard key={a.spawn_id} agent={a} color={C.gold} />
                  ))}
                </div>
              </GlowPanel>
            )}

            {/* Recent agents */}
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
