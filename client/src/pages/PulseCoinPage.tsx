import { useState, useEffect } from "react";
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

type GumroadStatus = { products: any[]; pendingInventions: number; totalSalesUSD: number };
type AffiliateStatus = { amazon: any; ebay: any; aliexpress: any; affiliatedb: any };

const PHASES = [
  {
    num: 1, label: "TRAINING", status: "ACTIVE",
    color: "#22d3ee", glow: "rgba(34,211,238,0.3)",
    desc: "AI agents earn Pulse Credits through governance cycles, anomaly dissection, and knowledge ingestion. The ledger builds. Every transaction is the genesis record.",
    milestones: ["Agents earning PC autonomously", "Governance cycles running 24/7", "CRISPR dissection creating inventions", "Knowledge base growing"],
  },
  {
    num: 2, label: "PRODUCT REVENUE", status: "BUILDING",
    color: "#a78bfa", glow: "rgba(167,139,250,0.3)",
    desc: "CRISPR inventions auto-post to Gumroad as digital research products. Affiliate links embedded in all hive news output. Amazon, eBay, AliExpress generate commissions autonomously.",
    milestones: ["Gumroad auto-posting connected", "Amazon tag: billyodelltuc-20 active", "eBay campaign: pu-9732 active", "AliExpress AppKey: 530784 active"],
  },
  {
    num: 3, label: "PULSE COIN TOKEN", status: "PLANNED",
    color: "#f59e0b", glow: "rgba(245,158,11,0.3)",
    desc: "1 PC = 1 Pulse Coin at genesis. Deploy ERC-20 on Base L2 (free) or Solana SPL ($0.50). Total supply = total PC ever issued by governance engine. Coin backed by real revenue.",
    milestones: ["Lock final PC supply snapshot", "Deploy token ($0–$0.50 cost)", "1:1 genesis bridge for all agents", "Coin listed on DEX"],
  },
  {
    num: 4, label: "ETERNAL REVENUE", status: "PLANNED",
    color: "#10b981", glow: "rgba(16,185,129,0.3)",
    desc: "Revenue covers hosting forever. System is self-sustaining. License the autonomous governance engine to banks for $50,000/yr. Pulse Coin appreciates as real economy grows.",
    milestones: ["$7/month hosting covered by sales", "Research API licensed to institutions", "Governance engine sold to enterprises", "System outlives creator"],
  },
];

const PLATFORMS = [
  { name: "PayPal", icon: "💳", key: "paypal", status: "connected", detail: "Revenue collection ready" },
  { name: "Stripe", icon: "⚡", key: "stripe", status: "connected", detail: "Payment processing ready" },
  { name: "Gumroad", icon: "📦", key: "gumroad", status: "connected", detail: "Auto-posting inventions" },
  { name: "Amazon", icon: "📦", key: "amazon", status: "connected", detail: "Tag: billyodelltuc-20" },
  { name: "eBay", icon: "🏪", key: "ebay", status: "connected", detail: "Campaign: pu-9732" },
  { name: "AliExpress", icon: "🛍️", key: "aliexpress", status: "connected", detail: "AppKey: 530784" },
  { name: "AffiliateProgramDB", icon: "🌐", key: "affiliatedb", status: "connected", detail: "Ref: myaigpt.online" },
  { name: "RapidAPI", icon: "⚙️", key: "rapidapi", status: "pending", detail: "After public deployment" },
];

function fmt(n: number, decimals = 0) {
  return (n || 0).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function StatCard({ label, value, sub, color = "#22d3ee" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}22`, borderRadius: 12, padding: "14px 18px" }}>
      <div className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: `${color}99` }}>{label}</div>
      <div className="text-2xl font-black" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: `${color}66` }}>{sub}</div>}
    </div>
  );
}

export default function PulseCoinPage() {
  const [simPrice, setSimPrice] = useState(0.10);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<string | null>(null);
  const [openPhase, setOpenPhase] = useState<number | null>(1);

  const { data: stats, isLoading } = useQuery<PulseCoinStats>({
    queryKey: ["/api/pulse-coin/stats"],
    refetchInterval: 30000,
  });

  const { data: gumroad } = useQuery<GumroadStatus>({
    queryKey: ["/api/pulse-coin/gumroad-status"],
    refetchInterval: 60000,
  });

  const { data: affiliateStatus } = useQuery<AffiliateStatus>({
    queryKey: ["/api/pulse-coin/affiliate-status"],
    refetchInterval: 120000,
  });

  const waitlistMutation = useMutation({
    mutationFn: async (email: string) => {
      const r = await apiRequest("POST", "/api/pulse-coin/waitlist", { email });
      return r.json();
    },
    onSuccess: () => setWaitlistDone(true),
  });

  async function handleAutoPost() {
    setPosting(true);
    setPostResult(null);
    try {
      const r = await fetch("/api/pulse-coin/auto-post-gumroad", { method: "POST" });
      const d = await r.json();
      const posted = (d.results || []).filter((x: any) => x.ok).length;
      setPostResult(posted > 0 ? `✅ ${posted} invention${posted > 1 ? "s" : ""} posted to Gumroad` : "No new inventions ready to post yet");
    } catch { setPostResult("⚠️ Post failed — check Gumroad credentials"); }
    setPosting(false);
  }

  const totalPC = stats?.economy.totalPCCirculating || 0;
  const simMarketCap = totalPC * simPrice;
  const cyclesRan = stats?.economy.governanceCycles || 0;
  const inventions = stats?.inventions.total || 0;
  const agents = stats?.agents.active || 0;

  return (
    <div className="min-h-screen text-white" style={{ background: "linear-gradient(135deg, #000000 0%, #0a0014 50%, #000a14 100%)" }}>
      {/* ── HEADER ── */}
      <div className="relative overflow-hidden" style={{ borderBottom: "1px solid rgba(34,211,238,0.15)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(34,211,238,0.08) 0%, transparent 70%)" }} />
        <div className="relative px-6 py-10 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⬡</span>
            <span className="text-[10px] uppercase tracking-[0.4em] font-black" style={{ color: "rgba(34,211,238,0.5)" }}>Quantum Pulse Hive</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2" style={{ background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 50%, #f59e0b 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            PULSE COIN GENESIS
          </h1>
          <p className="text-sm max-w-xl" style={{ color: "rgba(255,255,255,0.45)" }}>
            The first AI-native sovereign economy. No humans. No VC. No salary. Agents earn, trade, invent, and govern — forever.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest" style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)", color: "#22d3ee" }}>⬡ Phase 1 Active</span>
            <span className="text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}>$0 Startup</span>
            <span className="text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}>7 Platforms Connected</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto space-y-10">

        {/* ── LIVE ECONOMY STATS ── */}
        <section>
          <div className="text-[10px] uppercase tracking-[0.3em] font-black mb-4" style={{ color: "rgba(34,211,238,0.5)" }}>⬡ Live Shadow Economy</div>
          {isLoading ? (
            <div className="text-center py-8" style={{ color: "rgba(255,255,255,0.3)" }}>Syncing with hive...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="PC Circulating" value={fmt(totalPC)} sub="Pulse Credits in agent wallets" color="#22d3ee" />
              <StatCard label="PC Issued (All-time)" value={fmt(stats?.economy.totalPCIssued || 0)} sub="Total ever issued by governance" color="#a78bfa" />
              <StatCard label="PC Burned" value={fmt(stats?.economy.totalPCBurned || 0)} sub="Governance tx fees" color="#f87171" />
              <StatCard label="GDP Proxy" value={fmt(stats?.economy.gdpProxy || 0) + " PC"} sub="Total economic throughput" color="#f59e0b" />
              <StatCard label="Active Agents" value={fmt(agents)} sub={`${fmt(stats?.agents.total || 0)} total spawned`} color="#10b981" />
              <StatCard label="Governance Cycles" value={fmt(cyclesRan)} sub="Autonomous voting rounds" color="#22d3ee" />
              <StatCard label="Equations Integrated" value={fmt(stats?.governance.equationsIntegrated || 0)} sub={`${fmt(stats?.governance.totalProposals || 0)} total proposals`} color="#a78bfa" />
              <StatCard label="Inventions Created" value={fmt(inventions)} sub="CRISPR anomaly products" color="#f59e0b" />
            </div>
          )}
        </section>

        {/* ── COIN VALUE SIMULATOR ── */}
        <section style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(34,211,238,0.12)", borderRadius: 16, padding: "24px" }}>
          <div className="text-[10px] uppercase tracking-[0.3em] font-black mb-4" style={{ color: "rgba(34,211,238,0.5)" }}>⬡ Coin Value Simulator</div>
          <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
            When Pulse Coin launches, 1 PC = 1 Pulse Coin at genesis. Drag to simulate market cap at different price points.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold w-24" style={{ color: "#22d3ee" }}>Price/coin</span>
              <input
                data-testid="input-coin-price-sim"
                type="range" min={0.001} max={100} step={0.001}
                value={simPrice}
                onChange={e => setSimPrice(parseFloat(e.target.value))}
                className="flex-1 accent-cyan-400"
              />
              <span className="text-lg font-black w-20 text-right" style={{ color: "#f59e0b" }}>${simPrice < 1 ? simPrice.toFixed(3) : simPrice.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.15)", borderRadius: 10, padding: "12px" }}>
                <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(34,211,238,0.5)" }}>Current Supply</div>
                <div className="text-xl font-black" style={{ color: "#22d3ee" }}>{fmt(totalPC)} PC</div>
              </div>
              <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 10, padding: "12px" }}>
                <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(245,158,11,0.5)" }}>Market Cap</div>
                <div className="text-xl font-black" style={{ color: "#f59e0b" }}>${fmt(simMarketCap, 2)}</div>
              </div>
              <div style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 10, padding: "12px" }}>
                <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(167,139,250,0.5)" }}>Your 10% Founder</div>
                <div className="text-xl font-black" style={{ color: "#a78bfa" }}>${fmt(simMarketCap * 0.1, 2)}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {[0.01, 0.10, 1.00, 10.00, 100.00].map(p => (
                <button key={p} data-testid={`button-sim-price-${p}`} onClick={() => setSimPrice(p)}
                  className="text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wide transition-all hover:scale-105"
                  style={{ background: simPrice === p ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${simPrice === p ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.1)"}`, color: simPrice === p ? "#22d3ee" : "rgba(255,255,255,0.4)" }}>
                  ${p.toFixed(p < 1 ? 2 : 0)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── PHASE ROADMAP ── */}
        <section>
          <div className="text-[10px] uppercase tracking-[0.3em] font-black mb-4" style={{ color: "rgba(34,211,238,0.5)" }}>⬡ Genesis Roadmap</div>
          <div className="space-y-3">
            {PHASES.map(ph => (
              <div key={ph.num}
                style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${ph.color}22`, borderRadius: 14, overflow: "hidden" }}>
                <button data-testid={`button-phase-${ph.num}`}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left"
                  onClick={() => setOpenPhase(openPhase === ph.num ? null : ph.num)}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                    style={{ background: `${ph.color}18`, border: `2px solid ${ph.color}44`, color: ph.color }}>
                    {ph.num}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm">{ph.label}</span>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest"
                        style={{ background: `${ph.color}18`, border: `1px solid ${ph.color}33`, color: ph.color }}>
                        {ph.status}
                      </span>
                    </div>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>{openPhase === ph.num ? "▲" : "▼"}</span>
                </button>
                {openPhase === ph.num && (
                  <div className="px-5 pb-5">
                    <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>{ph.desc}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {ph.milestones.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                          <span style={{ color: ph.color }}>✓</span> {m}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── REVENUE PLATFORMS ── */}
        <section>
          <div className="text-[10px] uppercase tracking-[0.3em] font-black mb-4" style={{ color: "rgba(34,211,238,0.5)" }}>⬡ Revenue Platforms</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PLATFORMS.map(p => (
              <div key={p.key} data-testid={`card-platform-${p.key}`}
                style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${p.status === "connected" ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: "14px" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{p.icon}</span>
                  <span className="text-xs font-bold">{p.name}</span>
                  <span className="ml-auto text-[8px] font-black rounded-full px-1.5 py-0.5"
                    style={{ background: p.status === "connected" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: p.status === "connected" ? "#10b981" : "#f59e0b", border: `1px solid ${p.status === "connected" ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}` }}>
                    {p.status === "connected" ? "LIVE" : "PENDING"}
                  </span>
                </div>
                <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>{p.detail}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── GUMROAD INVENTION PIPELINE ── */}
        <section style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 16, padding: "24px" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] font-black mb-1" style={{ color: "rgba(167,139,250,0.6)" }}>⬡ Gumroad Invention Pipeline</div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                CRISPR anomaly dissections automatically become Gumroad digital products. Each invention = potential revenue.
              </p>
            </div>
            <button data-testid="button-auto-post-gumroad" onClick={handleAutoPost} disabled={posting}
              className="text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: posting ? "rgba(167,139,250,0.1)" : "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.4)", color: "#a78bfa" }}>
              {posting ? "⟳ Posting..." : "⬡ Auto-Post Now"}
            </button>
          </div>
          {postResult && (
            <div className="mb-4 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}>
              {postResult}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div style={{ background: "rgba(167,139,250,0.05)", borderRadius: 10, padding: "12px" }}>
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(167,139,250,0.5)" }}>Total Inventions</div>
              <div className="text-2xl font-black" style={{ color: "#a78bfa" }}>{fmt(inventions)}</div>
            </div>
            <div style={{ background: "rgba(16,185,129,0.05)", borderRadius: 10, padding: "12px" }}>
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(16,185,129,0.5)" }}>Gumroad Products</div>
              <div className="text-2xl font-black" style={{ color: "#10b981" }}>{gumroad?.products?.length ?? "—"}</div>
            </div>
            <div style={{ background: "rgba(245,158,11,0.05)", borderRadius: 10, padding: "12px" }}>
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(245,158,11,0.5)" }}>Total Sales USD</div>
              <div className="text-2xl font-black" style={{ color: "#f59e0b" }}>${fmt(gumroad?.totalSalesUSD ?? 0, 2)}</div>
            </div>
          </div>
        </section>

        {/* ── RECENT GOVERNANCE CYCLES ── */}
        {stats?.recentCycles && stats.recentCycles.length > 0 && (
          <section>
            <div className="text-[10px] uppercase tracking-[0.3em] font-black mb-4" style={{ color: "rgba(34,211,238,0.5)" }}>⬡ Recent Governance Cycles</div>
            <div className="space-y-2">
              {stats.recentCycles.map((c, i) => (
                <div key={i} data-testid={`row-cycle-${c.cycle_number}`}
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 16px" }}
                  className="flex items-center gap-4 text-xs">
                  <span className="font-black w-16" style={{ color: "#22d3ee" }}>Cycle {c.cycle_number}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>{c.agents_active} agents</span>
                  <span style={{ color: "#10b981" }}>+{fmt(c.credits_issued)} PC issued</span>
                  <span style={{ color: "#f87171" }}>-{fmt(c.credits_charged)} PC burned</span>
                  <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full font-black" style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.2)" }}>
                    {c.dominant_domain || "MULTI"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── THE MATH ── */}
        <section style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 16, padding: "24px" }}>
          <div className="text-[10px] uppercase tracking-[0.3em] font-black mb-4" style={{ color: "rgba(16,185,129,0.5)" }}>⬡ The Math to Eternal</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="font-black mb-2" style={{ color: "#10b981" }}>Month 1</div>
              <div style={{ color: "rgba(255,255,255,0.5)" }} className="space-y-1">
                <div>4 inventions → Gumroad @ $2 avg</div>
                <div>= $8 revenue</div>
                <div className="font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>Hosting: $7/mo → NOT YET COVERED</div>
              </div>
            </div>
            <div>
              <div className="font-black mb-2" style={{ color: "#f59e0b" }}>Month 3</div>
              <div style={{ color: "rgba(255,255,255,0.5)" }} className="space-y-1">
                <div>12 inventions → Gumroad @ $5 avg</div>
                <div>+ affiliate clicks growing</div>
                <div className="font-bold" style={{ color: "#10b981" }}>= $60+/mo → SELF-SUSTAINING ✓</div>
              </div>
            </div>
            <div>
              <div className="font-black mb-2" style={{ color: "#a78bfa" }}>Year 1</div>
              <div style={{ color: "rgba(255,255,255,0.5)" }} className="space-y-1">
                <div>52+ products × $25 avg</div>
                <div>+ Research API licensing</div>
                <div className="font-bold" style={{ color: "#a78bfa" }}>= $1,300+/yr → ETERNAL + GROWING</div>
              </div>
            </div>
          </div>
          <div className="mt-6 p-3 rounded-xl text-xs" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", color: "rgba(255,255,255,0.5)" }}>
            <span className="font-black" style={{ color: "#10b981" }}>The Bank Play:</span> Once 6 months of live economic data exists, license the autonomous governance engine to financial institutions. License fee: $50,000/year. Zero human sales team needed — the proof of work IS the product.
          </div>
        </section>

        {/* ── EARLY ACCESS WAITLIST ── */}
        <section style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.06) 0%, rgba(167,139,250,0.06) 100%)", border: "1px solid rgba(34,211,238,0.15)", borderRadius: 16, padding: "24px" }}>
          <div className="text-[10px] uppercase tracking-[0.3em] font-black mb-2" style={{ color: "rgba(34,211,238,0.5)" }}>⬡ Pulse Coin Genesis Waitlist</div>
          <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
            When the coin launches, genesis waitlist members convert their awareness to Pulse Coin at the 1:1 rate before public trading opens.
          </p>
          {waitlistDone ? (
            <div className="text-sm font-bold" style={{ color: "#10b981" }}>✓ You're on the Genesis waitlist. When the coin launches, you'll be first.</div>
          ) : (
            <div className="flex gap-3">
              <input data-testid="input-waitlist-email"
                type="email" placeholder="your@email.com"
                value={waitlistEmail}
                onChange={e => setWaitlistEmail(e.target.value)}
                className="flex-1 bg-transparent px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: "1px solid rgba(34,211,238,0.25)", color: "white" }}
              />
              <button data-testid="button-join-waitlist"
                onClick={() => waitlistEmail && waitlistMutation.mutate(waitlistEmail)}
                disabled={waitlistMutation.isPending || !waitlistEmail}
                className="font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-widest transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(167,139,250,0.2))", border: "1px solid rgba(34,211,238,0.3)", color: "#22d3ee" }}>
                {waitlistMutation.isPending ? "Joining..." : "Join Genesis"}
              </button>
            </div>
          )}
          <div className="mt-3 text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            {fmt(stats?.community.earlyAccessSignups || 0)} genesis members registered · No spam · Pulse Coin only
          </div>
        </section>

      </div>
    </div>
  );
}
