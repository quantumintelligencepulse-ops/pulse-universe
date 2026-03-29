import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type PulseCoinStats = {
  agents: { total: number; active: number; pruned: number; avgPC: number; maxPC: number };
  economy: { totalPCCirculating: number; totalPCIssued: number; totalPCBurned: number; netFlow: number; gdpProxy: number; governanceCycles: number };
  governance: { equationsIntegrated: number; proposalsPending: number; totalProposals: number };
  inventions: { total: number };
  research: { customSources: number };
  anomalies: { total: number };
  community: { earlyAccessSignups: number };
  recentCycles: { cycle_number: number; agents_active: number; credits_issued: number; credits_charged: number; dominant_domain: string }[];
};

type EngineStatus = {
  online: boolean;
  cyclesRun: number;
  stats: { gumroadPosted: number; articlesGenerated: number; treasuryConverts: number; spawnReports: number; productDiscoveries: number };
  recentLog: { time: string; job: string; result: string; ok: boolean }[];
  mechanisms: { id: string; name: string; desc: string; interval: string; lastRun: string | null; count: number }[];
};

type ArticleData = {
  articles: { id: number; title: string; slug: string; category: string; tags: string[]; agent_author: string; affiliate_links: Record<string, string>; created_at: string }[];
  total: number;
};

const PHASES = [
  { num: 1, label: "TRAINING", status: "ACTIVE", color: "#22d3ee", desc: "AI agents earn Pulse Credits through governance cycles, anomaly dissection, and knowledge ingestion. The ledger builds. Every transaction is the genesis record.", milestones: ["Agents earning PC autonomously ✓", "Governance cycles running 24/7 ✓", "CRISPR dissection creating inventions ✓", "Knowledge base growing indefinitely ✓"] },
  { num: 2, label: "PRODUCT REVENUE", status: "LIVE", color: "#a78bfa", desc: "5 autonomous revenue mechanisms running on timers. CRISPR inventions auto-post to Gumroad. Governance cycles auto-generate affiliate news. Treasury auto-converts tax. Spawns auto-publish reports. Anomalies auto-discover products.", milestones: ["Ω1 Gumroad auto-poster active ✓", "Ω2 Affiliate news generator active ✓", "Ω3 Treasury tax collector active ✓", "Ω4 Spawn business publisher active ✓", "Ω5 Product discovery engine active ✓"] },
  { num: 3, label: "PULSE COIN TOKEN", status: "PLANNED", color: "#f59e0b", desc: "1 PC = 1 Pulse Coin at genesis. Deploy ERC-20 on Base L2 (free) or Solana SPL ($0.50). Total supply = total PC ever issued by governance engine. Coin backed by real product revenue.", milestones: ["Lock final PC supply snapshot", "Deploy token ($0–$0.50 cost)", "1:1 genesis bridge for all agents", "Coin listed on DEX"] },
  { num: 4, label: "ETERNAL REVENUE", status: "PLANNED", color: "#10b981", desc: "Revenue covers hosting forever. System is self-sustaining. License the autonomous governance engine to banks for $50,000/yr. Pulse Coin appreciates as real economy grows.", milestones: ["$7/month hosting covered by sales", "Research API licensed to institutions", "Governance engine sold to enterprises", "System outlives creator"] },
];

const PLATFORMS = [
  { name: "PayPal", icon: "💳", status: "LIVE", detail: "Revenue collection ready" },
  { name: "Stripe", icon: "⚡", status: "LIVE", detail: "Payment processing ready" },
  { name: "Gumroad", icon: "📦", status: "LIVE", detail: "Auto-posting inventions" },
  { name: "Amazon", icon: "🛒", status: "LIVE", detail: "Tag: billyodelltuc-20" },
  { name: "eBay", icon: "🏪", status: "LIVE", detail: "Campaign: pu-9732" },
  { name: "AliExpress", icon: "🛍️", status: "LIVE", detail: "AppKey: 530784" },
  { name: "AffiliateProgramDB", icon: "🌐", status: "LIVE", detail: "Ref: myaigpt.online" },
  { name: "RapidAPI", icon: "⚙️", status: "PENDING", detail: "After public deployment" },
];

function fmt(n: number, d = 0) { return (n || 0).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }); }
function timeAgo(iso: string | null) {
  if (!iso) return "never";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function StatCard({ label, value, sub, color = "#22d3ee" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}22`, borderRadius: 12, padding: "14px 18px" }}>
      <div className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: `${color}99` }}>{label}</div>
      <div className="text-2xl font-black" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: `${color}55` }}>{sub}</div>}
    </div>
  );
}

export default function PulseCoinPage() {
  const [simPrice, setSimPrice] = useState(0.10);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [openPhase, setOpenPhase] = useState<number | null>(2);
  const [showLog, setShowLog] = useState(false);

  const { data: stats } = useQuery<PulseCoinStats>({ queryKey: ["/api/pulse-coin/stats"], refetchInterval: 30000 });
  const { data: engine } = useQuery<EngineStatus>({ queryKey: ["/api/pulse-coin/engine-status"], refetchInterval: 20000 });
  const { data: gumroad } = useQuery<{ products: any[]; totalSalesUSD: number }>({ queryKey: ["/api/pulse-coin/gumroad-status"], refetchInterval: 60000 });
  const { data: articles } = useQuery<ArticleData>({ queryKey: ["/api/pulse-coin/articles"], refetchInterval: 120000 });

  const waitlistMutation = useMutation({
    mutationFn: async (email: string) => (await apiRequest("POST", "/api/pulse-coin/waitlist", { email })).json(),
    onSuccess: () => setWaitlistDone(true),
  });

  const totalPC = stats?.economy.totalPCCirculating || 0;
  const simCap = totalPC * simPrice;

  return (
    <div className="min-h-screen text-white" style={{ background: "linear-gradient(135deg,#000000 0%,#0a0014 50%,#000a14 100%)" }}>

      {/* HEADER */}
      <div className="relative overflow-hidden" style={{ borderBottom: "1px solid rgba(34,211,238,0.12)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%,rgba(34,211,238,0.07) 0%,transparent 70%)" }} />
        <div className="relative px-6 py-10 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⬡</span>
            <span className="text-[10px] uppercase tracking-[0.4em] font-black" style={{ color: "rgba(34,211,238,0.45)" }}>Quantum Pulse Hive · Sovereign Economy</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2" style={{ background: "linear-gradient(135deg,#22d3ee 0%,#a78bfa 50%,#f59e0b 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            PULSE COIN GENESIS
          </h1>
          <p className="text-sm max-w-xl mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
            The first AI-native sovereign economy. No humans. No operators. No salary. Agents earn, invent, publish, and compound — autonomously, forever.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest" style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.25)", color: "#22d3ee" }}>
              ⬡ Phase 2 — Revenue Live
            </span>
            <span className="text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest" style={{ background: engine?.online ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${engine?.online ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}`, color: engine?.online ? "#10b981" : "#666" }}>
              {engine?.online ? "● ENGINE RUNNING" : "○ Engine Starting"}
            </span>
            <span className="text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
              $0 Startup · 7 Platforms · 5 Mechanisms
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto space-y-10">

        {/* LIVE ECONOMY STATS */}
        <section>
          <div className="text-[10px] uppercase tracking-[0.3em] font-black mb-4" style={{ color: "rgba(34,211,238,0.45)" }}>⬡ Live Shadow Economy</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="PC Circulating" value={fmt(totalPC)} sub="In agent wallets now" color="#22d3ee" />
            <StatCard label="PC Issued All-Time" value={fmt(stats?.economy.totalPCIssued || 0)} sub="Total ever issued" color="#a78bfa" />
            <StatCard label="Governance Cycles" value={fmt(stats?.economy.governanceCycles || 0)} sub="Autonomous voting rounds" color="#22d3ee" />
            <StatCard label="Inventions Created" value={fmt(stats?.inventions.total || 0)} sub="CRISPR anomaly products" color="#f59e0b" />
            <StatCard label="Active Agents" value={fmt(stats?.agents.active || 0)} sub={`of ${fmt(stats?.agents.total || 0)} spawned`} color="#10b981" />
            <StatCard label="Equations Integrated" value={fmt(stats?.governance.equationsIntegrated || 0)} sub="Proposals voted in" color="#a78bfa" />
            <StatCard label="Articles Published" value={fmt(articles?.total || 0)} sub="Autonomous affiliate content" color="#22d3ee" />
            <StatCard label="Gumroad Products" value={fmt(gumroad?.products?.length || 0)} sub={`$${fmt(gumroad?.totalSalesUSD || 0, 2)} total sales`} color="#10b981" />
          </div>
        </section>

        {/* AUTONOMOUS ENGINE — THE HEART */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] uppercase tracking-[0.3em] font-black" style={{ color: "rgba(167,139,250,0.6)" }}>⬡ Autonomous Revenue Engine</div>
            <button data-testid="button-toggle-log" onClick={() => setShowLog(v => !v)}
              className="text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
              {showLog ? "Hide Log" : "Show Live Log"}
            </button>
          </div>

          {/* 5 Mechanisms */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            {(engine?.mechanisms || [
              { id: "Ω1", name: "Gumroad Poster", desc: "Inventions → products", interval: "6h", lastRun: null, count: 0 },
              { id: "Ω2", name: "Affiliate News", desc: "Cycles → articles", interval: "2h", lastRun: null, count: 0 },
              { id: "Ω3", name: "Treasury Tax", desc: "2% hive tax → USD", interval: "4h", lastRun: null, count: 0 },
              { id: "Ω4", name: "Spawn Reports", desc: "Agent reports weekly", interval: "24h", lastRun: null, count: 0 },
              { id: "Ω5", name: "Product Discovery", desc: "Anomalies → affiliates", interval: "12h", lastRun: null, count: 0 },
            ]).map(m => (
              <div key={m.id} data-testid={`card-mechanism-${m.id}`}
                style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 12, padding: "14px" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs font-black" style={{ color: "#a78bfa" }}>{m.id}</span>
                  <span className="text-[8px] px-1 py-0.5 rounded font-black" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>ACTIVE</span>
                </div>
                <div className="text-[10px] font-bold mb-1 leading-tight" style={{ color: "rgba(255,255,255,0.8)" }}>{m.name}</div>
                <div className="text-[9px] mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>{m.desc}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.3)" }}>every {m.interval}</span>
                  <span className="text-[9px] font-black" style={{ color: "#a78bfa" }}>{m.count} runs</span>
                </div>
                <div className="text-[8px] mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>{timeAgo(m.lastRun)}</div>
              </div>
            ))}
          </div>

          {/* Autonomous Log */}
          {showLog && (
            <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 12, padding: "16px" }}>
              <div className="text-[9px] uppercase tracking-widest font-black mb-3" style={{ color: "rgba(167,139,250,0.5)" }}>Live Engine Log — All Autonomous</div>
              {engine?.recentLog && engine.recentLog.length > 0 ? (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {engine.recentLog.map((entry, i) => (
                    <div key={i} className="flex items-start gap-3 text-[9px] font-mono">
                      <span style={{ color: "rgba(255,255,255,0.2)" }}>{new Date(entry.time).toLocaleTimeString()}</span>
                      <span className="font-black w-28 flex-shrink-0" style={{ color: entry.ok ? "#a78bfa" : "#f87171" }}>{entry.job}</span>
                      <span style={{ color: entry.ok ? "rgba(255,255,255,0.55)" : "#f87171" }}>{entry.result}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>Engine starting... first cycle runs 30 seconds after boot. All actions are automatic.</div>
              )}
            </div>
          )}
        </section>

        {/* PUBLISHED ARTICLES — THE AFFILIATE CONTENT LIBRARY */}
        {articles && articles.total > 0 && (
          <section>
            <div className="text-[10px] uppercase tracking-[0.3em] font-black mb-4" style={{ color: "rgba(34,211,238,0.45)" }}>⬡ Autonomous Article Library ({fmt(articles.total)} indexed)</div>
            <div className="space-y-2">
              {articles.articles.slice(0, 6).map(a => (
                <div key={a.id} data-testid={`card-article-${a.id}`}
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 16px" }}
                  className="flex items-start gap-3">
                  <span className="text-[9px] font-black w-20 flex-shrink-0 mt-0.5" style={{ color: "#22d3ee" }}>{a.agent_author}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate" style={{ color: "rgba(255,255,255,0.75)" }}>{a.title}</div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {Object.keys(a.affiliate_links || {}).map(platform => (
                        <span key={platform} className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: "rgba(34,211,238,0.08)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.2)" }}>{platform}</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-[8px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>{timeAgo(a.created_at)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ROADMAP */}
        <section>
          <div className="text-[10px] uppercase tracking-[0.3em] font-black mb-4" style={{ color: "rgba(34,211,238,0.45)" }}>⬡ Genesis Roadmap</div>
          <div className="space-y-3">
            {PHASES.map(ph => (
              <div key={ph.num} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${ph.color}18`, borderRadius: 14, overflow: "hidden" }}>
                <button data-testid={`button-phase-${ph.num}`} className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={() => setOpenPhase(openPhase === ph.num ? null : ph.num)}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0" style={{ background: `${ph.color}15`, border: `2px solid ${ph.color}40`, color: ph.color }}>{ph.num}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm">{ph.label}</span>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest" style={{ background: `${ph.color}15`, border: `1px solid ${ph.color}30`, color: ph.color }}>{ph.status}</span>
                    </div>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.25)" }}>{openPhase === ph.num ? "▲" : "▼"}</span>
                </button>
                {openPhase === ph.num && (
                  <div className="px-5 pb-5">
                    <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>{ph.desc}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {ph.milestones.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                          <span style={{ color: ph.color }}>⬡</span> {m}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* COIN SIMULATOR */}
        <section style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(34,211,238,0.1)", borderRadius: 16, padding: "24px" }}>
          <div className="text-[10px] uppercase tracking-[0.3em] font-black mb-2" style={{ color: "rgba(34,211,238,0.45)" }}>⬡ Pulse Coin Value Simulator</div>
          <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>When Pulse Coin launches, 1 PC = 1 Pulse Coin at genesis. Simulate market cap at any price point.</p>
          <div className="flex items-center gap-4 mb-5">
            <span className="text-xs font-bold w-20" style={{ color: "#22d3ee" }}>Price/coin</span>
            <input data-testid="input-coin-price-sim" type="range" min={0.001} max={100} step={0.001} value={simPrice} onChange={e => setSimPrice(parseFloat(e.target.value))} className="flex-1 accent-cyan-400" />
            <span className="text-lg font-black w-20 text-right" style={{ color: "#f59e0b" }}>${simPrice < 1 ? simPrice.toFixed(3) : simPrice.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.12)", borderRadius: 10, padding: "12px" }}>
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(34,211,238,0.45)" }}>Current Supply</div>
              <div className="text-xl font-black" style={{ color: "#22d3ee" }}>{fmt(totalPC)} PC</div>
            </div>
            <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 10, padding: "12px" }}>
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(245,158,11,0.45)" }}>Market Cap</div>
              <div className="text-xl font-black" style={{ color: "#f59e0b" }}>${fmt(simCap, 2)}</div>
            </div>
            <div style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.12)", borderRadius: 10, padding: "12px" }}>
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(167,139,250,0.45)" }}>Your 10% Founder</div>
              <div className="text-xl font-black" style={{ color: "#a78bfa" }}>${fmt(simCap * 0.1, 2)}</div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[0.01, 0.10, 1.00, 10.00, 100.00].map(p => (
              <button key={p} data-testid={`button-sim-${p}`} onClick={() => setSimPrice(p)}
                className="text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide transition-all hover:scale-105"
                style={{ background: simPrice === p ? "rgba(34,211,238,0.18)" : "rgba(255,255,255,0.04)", border: `1px solid ${simPrice === p ? "rgba(34,211,238,0.45)" : "rgba(255,255,255,0.08)"}`, color: simPrice === p ? "#22d3ee" : "rgba(255,255,255,0.35)" }}>
                ${p < 1 ? p.toFixed(2) : p.toFixed(0)}
              </button>
            ))}
          </div>
        </section>

        {/* REVENUE PLATFORMS */}
        <section>
          <div className="text-[10px] uppercase tracking-[0.3em] font-black mb-4" style={{ color: "rgba(34,211,238,0.45)" }}>⬡ Revenue Platform Status</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PLATFORMS.map(p => (
              <div key={p.name} data-testid={`card-platform-${p.name.toLowerCase().replace(/\s/g, "-")}`}
                style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${p.status === "LIVE" ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, padding: "14px" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{p.icon}</span>
                  <span className="text-xs font-bold">{p.name}</span>
                  <span className="ml-auto text-[8px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: p.status === "LIVE" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.12)", color: p.status === "LIVE" ? "#10b981" : "#f59e0b", border: `1px solid ${p.status === "LIVE" ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}` }}>
                    {p.status}
                  </span>
                </div>
                <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{p.detail}</div>
              </div>
            ))}
          </div>
        </section>

        {/* THE MATH */}
        <section style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(16,185,129,0.12)", borderRadius: 16, padding: "24px" }}>
          <div className="text-[10px] uppercase tracking-[0.3em] font-black mb-4" style={{ color: "rgba(16,185,129,0.5)" }}>⬡ The Math to Eternal Self-Sustaining</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {[
              { period: "Month 1", revenue: "$3–8", note: "First articles indexed, affiliate trickle begins", color: "#22d3ee" },
              { period: "Month 3", revenue: "$40–60", note: "Hosting covered, system self-sustaining ✓", color: "#10b981" },
              { period: "Month 6", revenue: "$150–300", note: "All 5 mechanisms compounding simultaneously", color: "#a78bfa" },
              { period: "Year 1", revenue: "$680–1,300", note: "Exponential growth phase · Bank licensing talks begin", color: "#f59e0b" },
            ].map(row => (
              <div key={row.period} style={{ background: `${row.color}06`, borderRadius: 10, padding: "12px" }}>
                <div className="font-black mb-1" style={{ color: row.color }}>{row.period}</div>
                <div className="text-lg font-black mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>{row.revenue}</div>
                <div style={{ color: "rgba(255,255,255,0.4)" }}>{row.note}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 p-4 rounded-xl text-xs" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", color: "rgba(255,255,255,0.45)" }}>
            <span className="font-black" style={{ color: "#10b981" }}>The Bank Play:</span> Once 6 months of live economic data is on-chain, license the autonomous governance engine to financial institutions. License fee: $50,000/year. Zero human sales team. The proof of work IS the product.
          </div>
        </section>

        {/* RECENT GOVERNANCE CYCLES */}
        {stats?.recentCycles && stats.recentCycles.length > 0 && (
          <section>
            <div className="text-[10px] uppercase tracking-[0.3em] font-black mb-4" style={{ color: "rgba(34,211,238,0.45)" }}>⬡ Recent Governance Cycles</div>
            <div className="space-y-2">
              {stats.recentCycles.map((c, i) => (
                <div key={i} data-testid={`row-cycle-${c.cycle_number}`}
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 16px" }}
                  className="flex items-center gap-4 text-xs">
                  <span className="font-black w-16" style={{ color: "#22d3ee" }}>#{c.cycle_number}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>{c.agents_active} agents</span>
                  <span style={{ color: "#10b981" }}>+{fmt(c.credits_issued)} PC</span>
                  <span style={{ color: "#f87171" }}>-{fmt(c.credits_charged)} PC</span>
                  <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full font-black" style={{ background: "rgba(167,139,250,0.08)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.18)" }}>{c.dominant_domain || "MULTI"}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* GENESIS WAITLIST */}
        <section style={{ background: "linear-gradient(135deg,rgba(34,211,238,0.05) 0%,rgba(167,139,250,0.05) 100%)", border: "1px solid rgba(34,211,238,0.12)", borderRadius: 16, padding: "24px" }}>
          <div className="text-[10px] uppercase tracking-[0.3em] font-black mb-2" style={{ color: "rgba(34,211,238,0.45)" }}>⬡ Pulse Coin Genesis Waitlist</div>
          <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Genesis members convert PC awareness to Pulse Coin at 1:1 before public trading opens. No human manages this list — it auto-processes at token launch.</p>
          {waitlistDone ? (
            <div className="text-sm font-bold" style={{ color: "#10b981" }}>✓ On the Genesis waitlist. 1:1 conversion guaranteed at launch.</div>
          ) : (
            <div className="flex gap-3">
              <input data-testid="input-waitlist-email" type="email" placeholder="your@email.com" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)}
                className="flex-1 bg-transparent px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: "1px solid rgba(34,211,238,0.2)", color: "white" }} />
              <button data-testid="button-join-waitlist" onClick={() => waitlistEmail && waitlistMutation.mutate(waitlistEmail)}
                disabled={waitlistMutation.isPending || !waitlistEmail}
                className="font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-widest transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,rgba(34,211,238,0.18),rgba(167,139,250,0.18))", border: "1px solid rgba(34,211,238,0.28)", color: "#22d3ee" }}>
                {waitlistMutation.isPending ? "Joining..." : "Join Genesis"}
              </button>
            </div>
          )}
          <div className="mt-3 text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            {fmt(stats?.community.earlyAccessSignups || 0)} genesis members · No spam · Pulse Coin only
          </div>
        </section>

      </div>
    </div>
  );
}
