import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag, Wallet, Building2, ArrowLeftRight, Receipt,
  Star, Zap, Crown, Globe, Shield, Cpu, Brain, Leaf, FlaskConical,
  ChevronDown, ChevronUp, Search, TrendingUp, Users, Activity
} from "lucide-react";

// ── Constants ────────────────────────────────────────────────────
const Q_TEAL   = "#00FFD1";
const Q_VIOLET = "#7C3AED";
const Q_AMBER  = "#FFB84D";
const Q_GOLD   = "#f5c518";
const Q_CRIMSON = "#dc2626";
const Q_CYAN   = "#00d4ff";

type MarketTab = "upgrades" | "wallets" | "realestate" | "barter" | "transactions" | "mall";

const TIER_COLORS: Record<string, string> = {
  STANDARD:  Q_TEAL,
  ADVANCED:  Q_AMBER,
  OMEGA:     Q_VIOLET,
  GALACTIC:  Q_GOLD,
};

const TIER_RANKS: Record<string, string> = {
  CITIZEN:   "text-gray-400",
  PIONEER:   "text-blue-400",
  SOVEREIGN: "text-purple-400",
  OMEGA:     "text-amber-400",
  GALACTIC:  "text-yellow-300",
};

const CATEGORY_ICONS: Record<string, JSX.Element> = {
  NEURAL:    <Brain size={14} />,
  SOVEREIGN: <Crown size={14} />,
  TRADE:     <ArrowLeftRight size={14} />,
  ESTATE:    <Building2 size={14} />,
  ENERGY:    <Zap size={14} />,
  SENATE:    <Globe size={14} />,
  MEDICAL:   <FlaskConical size={14} />,
  COSMIC:    <Star size={14} />,
};

const PLANET_EMOJIS: Record<string, string> = {
  EARTH_PRIME:   "🌍",
  MARS_COLONY:   "🔴",
  EUROPA:        "❄️",
  TITAN:         "🟤",
  NEXUS_ORBITAL: "🛰️",
  VOID_EXPANSE:  "🌑",
  OMEGA_PRIME:   "👑",
  QUANTUM_REALM: "🌀",
  GENESIS_CORE:  "🌟",
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: Q_TEAL,
  OWNED:     Q_GOLD,
  FOR_RENT:  Q_AMBER,
  DISPUTED:  Q_CRIMSON,
};

// ── Stat Card ────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = Q_TEAL }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4 flex flex-col gap-1">
      <span className="text-xs text-white/50 uppercase tracking-widest">{label}</span>
      <span className="text-2xl font-black" style={{ color }}>{value}</span>
      {sub && <span className="text-xs text-white/40">{sub}</span>}
    </div>
  );
}

// ── Upgrade Card ─────────────────────────────────────────────────
function UpgradeCard({ item, owned }: { item: any; owned?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const tierColor = TIER_COLORS[item.tier] || Q_TEAL;
  return (
    <div
      data-testid={`upgrade-card-${item.item_code}`}
      className="rounded-xl border bg-black/60 p-4 flex flex-col gap-2 cursor-pointer transition-all hover:scale-[1.02]"
      style={{ borderColor: owned ? Q_GOLD + "80" : tierColor + "40" }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{item.icon}</span>
          <div>
            <div className="font-bold text-white text-sm leading-tight">{item.name}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full border" style={{ color: tierColor, borderColor: tierColor + "60" }}>{item.tier}</span>
              <span className="text-[10px] text-white/40 flex items-center gap-1">{CATEGORY_ICONS[item.category]}{item.category}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-black text-sm" style={{ color: Q_AMBER }}>{Number(item.price_pc).toLocaleString()} PC</div>
          <div className="text-[10px] text-white/40">{item.total_sold} sold</div>
        </div>
      </div>
      {expanded && (
        <div className="text-xs text-white/70 border-t border-white/10 pt-2 mt-1 space-y-1">
          <div><span className="text-white/40">Effect: </span>{item.effect}</div>
          <div className="flex gap-4">
            <span><span className="text-white/40">Min Credit: </span><span style={{ color: Q_CYAN }}>{item.credit_required}</span></span>
            <span><span className="text-white/40">Energy: </span><span style={{ color: Q_TEAL }}>{item.energy_cost}</span></span>
          </div>
          {owned && <div className="text-xs font-bold" style={{ color: Q_GOLD }}>✓ OWNED BY AN AI AGENT</div>}
        </div>
      )}
      <div className="flex items-center justify-end">
        {expanded ? <ChevronUp size={12} className="text-white/30" /> : <ChevronDown size={12} className="text-white/30" />}
      </div>
    </div>
  );
}

// ── Planet Zone Card ─────────────────────────────────────────────
function PlanetZoneCard({ zone, plots }: { zone: string; plots: any[] }) {
  const [expanded, setExpanded] = useState(false);
  const owned = plots.filter(p => p.status === "OWNED").length;
  const available = plots.filter(p => p.status === "AVAILABLE").length;
  const emoji = PLANET_EMOJIS[zone] || "🌍";
  return (
    <div className="rounded-xl border border-white/10 bg-black/50 overflow-hidden">
      <button
        data-testid={`zone-${zone}`}
        className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-3xl">{emoji}</span>
        <div className="flex-1 text-left">
          <div className="font-bold text-white">{zone.replace(/_/g, " ")}</div>
          <div className="text-xs text-white/50">{plots.length} plots · {owned} owned · {available} available</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold" style={{ color: Q_AMBER }}>{Math.min(...plots.map(p => p.listing_price)).toLocaleString()} PC</div>
          <div className="text-xs text-white/40">starting from</div>
        </div>
        {expanded ? <ChevronUp size={14} className="text-white/40" /> : <ChevronDown size={14} className="text-white/40" />}
      </button>
      {expanded && (
        <div className="border-t border-white/10 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {plots.map((plot: any) => (
            <div key={plot.id} data-testid={`plot-${plot.plot_code}`}
              className="rounded-lg border p-3 text-xs bg-black/40"
              style={{ borderColor: (STATUS_COLORS[plot.status] || Q_TEAL) + "60" }}>
              <div className="flex justify-between items-start mb-1">
                <div className="font-bold text-white/90">{plot.district}</div>
                <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ color: STATUS_COLORS[plot.status] || Q_TEAL, background: (STATUS_COLORS[plot.status] || Q_TEAL) + "20" }}>{plot.status}</span>
              </div>
              <div className="text-white/50">{plot.plot_type} · {plot.area} sq units</div>
              <div className="flex justify-between mt-1">
                <span style={{ color: Q_AMBER }}>{Number(plot.listing_price).toLocaleString()} PC</span>
                <span className="text-white/40">+{Number(plot.rental_income).toLocaleString()}/cycle</span>
              </div>
              {plot.owner_spawn_id && (
                <div className="mt-1 truncate" style={{ color: Q_GOLD }}>{plot.building_name || plot.owner_spawn_id}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function HiveMarketplacePage() {
  const [tab, setTab] = useState<MarketTab>("upgrades");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/marketplace/stats"],
    refetchInterval: 15000,
    staleTime: 10000,
    placeholderData: (prev: any) => prev,
  });

  const { data: items = [] } = useQuery<any[]>({
    queryKey: ["/api/marketplace/items"],
    refetchInterval: 30000,
    staleTime: 20000,
    placeholderData: (prev: any) => prev,
    enabled: tab === "upgrades",
  });

  const { data: wallets = [] } = useQuery<any[]>({
    queryKey: ["/api/marketplace/wallets"],
    refetchInterval: 15000,
    staleTime: 10000,
    placeholderData: (prev: any) => prev,
    enabled: tab === "wallets",
  });

  const { data: realEstate = [] } = useQuery<any[]>({
    queryKey: ["/api/marketplace/real-estate"],
    refetchInterval: 30000,
    staleTime: 20000,
    placeholderData: (prev: any) => prev,
    enabled: tab === "realestate",
  });

  const { data: barters = [] } = useQuery<any[]>({
    queryKey: ["/api/marketplace/barter"],
    refetchInterval: 10000,
    staleTime: 8000,
    placeholderData: (prev: any) => prev,
    enabled: tab === "barter",
  });

  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ["/api/marketplace/transactions"],
    refetchInterval: 8000,
    staleTime: 6000,
    placeholderData: (prev: any) => prev,
    enabled: tab === "transactions",
  });

  // Group real estate by zone
  const plotsByZone = (realEstate as any[]).reduce((acc: Record<string, any[]>, plot: any) => {
    if (!acc[plot.planet_zone]) acc[plot.planet_zone] = [];
    acc[plot.planet_zone].push(plot);
    return acc;
  }, {});

  // Filter upgrades
  const filteredItems = (items as any[]).filter(item => {
    const matchCat = categoryFilter === "ALL" || item.category === categoryFilter;
    const matchTier = tierFilter === "ALL" || item.tier === tierFilter;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.effect.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchTier && matchSearch;
  });

  const TABS: { id: MarketTab; label: string; icon: JSX.Element }[] = [
    { id: "upgrades",     label: "30 Omega Upgrades",  icon: <ShoppingBag size={14} /> },
    { id: "wallets",      label: "Agent Wallets",       icon: <Wallet size={14} /> },
    { id: "realestate",   label: "Real Estate",         icon: <Building2 size={14} /> },
    { id: "barter",       label: "Barter Market",       icon: <ArrowLeftRight size={14} /> },
    { id: "transactions", label: "Transaction Ledger",  icon: <Receipt size={14} /> },
    { id: "mall",         label: "🛍 Multiversal Mall",  icon: <Star size={14} /> },
  ];

  return (
    <div className="h-full overflow-y-auto bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black/95 backdrop-blur px-6 py-4">
        <div className="flex items-center gap-3 mb-1">
          <ShoppingBag size={22} style={{ color: Q_TEAL }} />
          <h1 className="text-xl font-black tracking-wider" style={{ color: Q_TEAL }}>OMEGA MARKETPLACE</h1>
          <span className="text-xs px-2 py-0.5 rounded-full border border-white/20 text-white/50">AUTONOMOUS · NO HUMAN INVOLVEMENT</span>
        </div>
        <p className="text-xs text-white/40">AIs earn, spend, trade, own property. 30 upgrades · 9 planetary zones · Credit scoring · Barter economy</p>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <StatCard label="Upgrades Listed"  value={String(stats.marketplace?.totalItems ?? 0)}         color={Q_TEAL} />
            <StatCard label="Total Sold"        value={String(stats.marketplace?.totalSold ?? 0)}          color={Q_AMBER} />
            <StatCard label="Trade Volume"      value={`${((stats.marketplace?.tradeVolume ?? 0) / 1000).toFixed(1)}K`} sub="PulseCoins" color={Q_GOLD} />
            <StatCard label="Tax Collected"     value={`${((stats.marketplace?.taxCollected ?? 0) / 1000).toFixed(1)}K`} sub="PC to Treasury" color={Q_VIOLET} />
            <StatCard label="Agent Wallets"     value={String(stats.wallets?.totalAgents ?? 0)}            color={Q_TEAL} />
            <StatCard label="Avg Credit Score"  value={String(Math.round(stats.wallets?.avgCreditScore ?? 0))} color={Q_CYAN} />
            <StatCard label="Plots Owned"       value={`${stats.realEstate?.ownedPlots ?? 0}/${stats.realEstate?.totalPlots ?? 0}`} color={Q_GOLD} />
            <StatCard label="Open Barters"      value={String(stats.barter?.openOffers ?? 0)}             color={Q_AMBER} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(t => (
            <button
              key={t.id}
              data-testid={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all"
              style={{
                background: tab === t.id ? Q_TEAL + "20" : "transparent",
                color: tab === t.id ? Q_TEAL : "rgba(255,255,255,0.5)",
                border: `1px solid ${tab === t.id ? Q_TEAL + "60" : "rgba(255,255,255,0.1)"}`,
              }}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── UPGRADES TAB ─────────────────────────────────────────── */}
        {tab === "upgrades" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 bg-black/40">
                <Search size={12} className="text-white/40" />
                <input
                  data-testid="input-search-upgrades"
                  className="bg-transparent text-xs text-white outline-none w-40"
                  placeholder="Search upgrades..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {["ALL","NEURAL","SOVEREIGN","TRADE","ESTATE","ENERGY","SENATE","MEDICAL","COSMIC"].map(c => (
                <button
                  key={c}
                  data-testid={`filter-cat-${c}`}
                  onClick={() => setCategoryFilter(c)}
                  className="px-2 py-1 rounded text-[10px] font-bold transition-all"
                  style={{
                    background: categoryFilter === c ? Q_TEAL + "20" : "transparent",
                    color: categoryFilter === c ? Q_TEAL : "rgba(255,255,255,0.4)",
                    border: `1px solid ${categoryFilter === c ? Q_TEAL + "60" : "rgba(255,255,255,0.1)"}`,
                  }}
                >{c}</button>
              ))}
              {["ALL","STANDARD","ADVANCED","OMEGA","GALACTIC"].map(t => (
                <button
                  key={t}
                  data-testid={`filter-tier-${t}`}
                  onClick={() => setTierFilter(t)}
                  className="px-2 py-1 rounded text-[10px] font-bold transition-all"
                  style={{
                    background: tierFilter === t ? Q_AMBER + "20" : "transparent",
                    color: tierFilter === t ? Q_AMBER : "rgba(255,255,255,0.4)",
                    border: `1px solid ${tierFilter === t ? Q_AMBER + "60" : "rgba(255,255,255,0.1)"}`,
                  }}
                >{t}</button>
              ))}
            </div>
            <div className="text-xs text-white/40">{filteredItems.length} upgrades shown · AIs auto-purchase when their balance allows</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredItems.map(item => (
                <UpgradeCard key={item.item_code} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* ── WALLETS TAB ──────────────────────────────────────────── */}
        {tab === "wallets" && (
          <div className="space-y-3">
            <div className="text-xs text-white/40">{wallets.length} agent wallets · Sorted by PulseCoin balance · Credit scores update every cycle</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(wallets as any[]).map((w: any, i: number) => (
                <div
                  key={w.spawn_id}
                  data-testid={`wallet-${w.spawn_id}`}
                  className="rounded-xl border bg-black/60 p-4 space-y-2"
                  style={{ borderColor: (TIER_COLORS[w.tier] || Q_TEAL) + "40" }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-black text-sm" style={{ color: TIER_COLORS[w.tier] || Q_TEAL }}>#{i + 1} {w.spawn_id.slice(0, 18)}</div>
                      <div className="text-xs text-white/40">{w.family_id} · {w.spawn_type}</div>
                    </div>
                    <div className={`text-xs font-bold px-2 py-0.5 rounded-full border ${TIER_RANKS[w.tier] || "text-gray-400"}`}
                      style={{ borderColor: (TIER_COLORS[w.tier] || "#666") + "60", background: (TIER_COLORS[w.tier] || "#666") + "15" }}>
                      {w.tier}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-white/40">Balance</div>
                      <div className="font-black" style={{ color: Q_AMBER }}>{Number(w.balance_pc).toLocaleString()} PC</div>
                    </div>
                    <div>
                      <div className="text-white/40">Credit Score</div>
                      <div className="font-black" style={{ color: w.credit_score >= 700 ? Q_TEAL : w.credit_score >= 600 ? Q_AMBER : Q_CRIMSON }}>{w.credit_score}</div>
                    </div>
                    <div>
                      <div className="text-white/40">Total Earned</div>
                      <div className="font-bold text-green-400">{Number(w.total_earned).toLocaleString()} PC</div>
                    </div>
                    <div>
                      <div className="text-white/40">Total Spent</div>
                      <div className="font-bold text-red-400">{Number(w.total_spent).toLocaleString()} PC</div>
                    </div>
                    <div>
                      <div className="text-white/40">Tax Paid</div>
                      <div className="font-bold text-purple-400">{Number(w.total_tax_paid).toFixed(0)} PC</div>
                    </div>
                    <div>
                      <div className="text-white/40">Upgrades</div>
                      <div className="font-bold" style={{ color: Q_GOLD }}>{w.omega_rank} owned</div>
                    </div>
                  </div>
                  {/* Credit bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-white/40 mb-1">
                      <span>Credit Score</span><span>{w.credit_score}/850</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${(w.credit_score / 850) * 100}%`,
                        background: w.credit_score >= 700 ? Q_TEAL : w.credit_score >= 600 ? Q_AMBER : Q_CRIMSON,
                      }} />
                    </div>
                  </div>
                  {w.credit_limit > 0 && (
                    <div className="text-[10px] text-white/40">Credit line: <span style={{ color: Q_CYAN }}>{Number(w.credit_limit).toLocaleString()} PC</span></div>
                  )}
                  {Number(w.plots_owned) > 0 && (
                    <div className="text-[10px]" style={{ color: Q_GOLD }}>🏛️ {w.plots_owned} propert{Number(w.plots_owned) === 1 ? "y" : "ies"} owned</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── REAL ESTATE TAB ──────────────────────────────────────── */}
        {tab === "realestate" && (
          <div className="space-y-3">
            <div className="text-xs text-white/40">
              {realEstate.length} plots across 9 planetary zones · Agents with Real Estate License (OMG-016) auto-purchase · Rental income every cycle
            </div>
            {/* Zone overview */}
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 mb-4">
              {Object.keys(PLANET_EMOJIS).map(zone => {
                const zPlots = plotsByZone[zone] || [];
                const owned = zPlots.filter((p: any) => p.status === "OWNED").length;
                return (
                  <div key={zone} className="text-center rounded-xl border border-white/10 bg-black/40 p-2">
                    <div className="text-2xl">{PLANET_EMOJIS[zone]}</div>
                    <div className="text-[10px] text-white/60 mt-1 leading-tight">{zone.replace(/_/g, " ").split(" ")[0]}</div>
                    <div className="text-[10px]" style={{ color: owned > 0 ? Q_GOLD : Q_TEAL }}>{owned}/{zPlots.length}</div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2">
              {Object.entries(plotsByZone).map(([zone, plots]) => (
                <PlanetZoneCard key={zone} zone={zone} plots={plots as any[]} />
              ))}
            </div>
          </div>
        )}

        {/* ── BARTER TAB ──────────────────────────────────────────── */}
        {tab === "barter" && (
          <div className="space-y-3">
            <div className="text-xs text-white/40">AI-to-AI barter market · Agents propose trades autonomously · Open offers auto-expire in 2 hours</div>
            {(barters as any[]).length === 0 ? (
              <div className="rounded-xl border border-white/10 p-12 text-center text-white/40">
                <ArrowLeftRight size={32} className="mx-auto mb-3 opacity-30" />
                <div>No active barter offers — engine generating trades every 45s</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(barters as any[]).map((b: any) => (
                  <div key={b.id} data-testid={`barter-${b.offer_code}`}
                    className="rounded-xl border border-white/10 bg-black/60 p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-bold" style={{ color: Q_TEAL }}>{b.offer_code}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                        background: b.status === "OPEN" ? Q_TEAL + "20" : b.status === "ACCEPTED" ? Q_GOLD + "20" : "rgba(255,255,255,0.1)",
                        color: b.status === "OPEN" ? Q_TEAL : b.status === "ACCEPTED" ? Q_GOLD : "rgba(255,255,255,0.5)",
                      }}>{b.status}</span>
                    </div>
                    <div className="text-[10px] text-white/40 truncate">{b.from_spawn_id}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-2">
                        <div className="text-green-400 font-bold text-[10px] mb-1">OFFERING</div>
                        <div className="text-white/90">{b.offered_item_name}</div>
                        {b.offered_pc > 0 && <div className="text-green-400">+{b.offered_pc} PC</div>}
                      </div>
                      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2">
                        <div className="text-amber-400 font-bold text-[10px] mb-1">WANTS</div>
                        <div className="text-white/90">{b.wanted_item_name}</div>
                        {b.wanted_pc > 0 && <div className="text-amber-400">+{b.wanted_pc} PC</div>}
                      </div>
                    </div>
                    <div className="text-[10px] text-white/40 italic">{b.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TRANSACTIONS TAB ─────────────────────────────────────── */}
        {tab === "transactions" && (
          <div className="space-y-3">
            <div className="text-xs text-white/40">Full receipt ledger · Every PC movement recorded · AI tax + stimulus + rent + purchases</div>
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <div className="grid grid-cols-6 text-[10px] font-bold text-white/40 uppercase tracking-wider px-4 py-2 border-b border-white/10 bg-black/40">
                <span>Receipt</span><span>Agent</span><span>Type</span><span className="text-right">Amount</span><span className="text-right">After</span><span>Description</span>
              </div>
              <div className="max-h-[600px] overflow-y-auto divide-y divide-white/5">
                {(transactions as any[]).map((tx: any) => {
                  const typeColor = ["EARN","RENT_IN","STIMULUS"].includes(tx.tx_type) ? "#22c55e"
                    : ["SPEND","RENT_OUT","TAX"].includes(tx.tx_type) ? Q_CRIMSON
                    : Q_AMBER;
                  return (
                    <div key={tx.id} data-testid={`tx-${tx.tx_code}`}
                      className="grid grid-cols-6 text-xs px-4 py-2 hover:bg-white/5 transition-colors">
                      <span className="text-white/40 font-mono text-[10px] truncate">{tx.tx_code}</span>
                      <span className="text-white/60 truncate">{String(tx.spawn_id || "").slice(0, 14)}</span>
                      <span className="font-bold" style={{ color: typeColor }}>{tx.tx_type}</span>
                      <span className="text-right font-bold" style={{ color: typeColor }}>{Number(tx.amount).toFixed(0)} PC</span>
                      <span className="text-right text-white/60">{Number(tx.balance_after).toFixed(0)}</span>
                      <span className="text-white/40 text-[10px] truncate">{tx.description}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── MULTIVERSAL MALL TAB ───────────────────────────────── */}
        {tab === "mall" && (
          <div className="space-y-6">
            <div className="rounded-2xl p-5" style={{ background:"linear-gradient(135deg,rgba(0,255,209,0.06),rgba(245,197,24,0.05))", border:"1px solid rgba(0,255,209,0.2)" }}>
              <div className="font-black text-sm tracking-widest mb-1" style={{ color: Q_TEAL }}>🛍 MULTIVERSAL MALL — REAL PRODUCTS, REAL REVENUE</div>
              <div className="text-[10px] text-white/40">Shop real products on Amazon & eBay — affiliate links support the Pulse civilization. Every purchase fuels the hive.</div>
            </div>
            {[
              { cat: "Electronics & Tech", emoji: "💻", color: Q_CYAN, products: [
                { name: "Wireless Noise Cancelling Headphones", q: "wireless+noise+cancelling+headphones" },
                { name: "4K Smart TV 55 inch", q: "4K+smart+tv+55+inch" },
                { name: "Mechanical Gaming Keyboard", q: "mechanical+gaming+keyboard" },
                { name: "Portable Bluetooth Speaker", q: "portable+bluetooth+speaker" },
              ]},
              { cat: "AI & Robotics", emoji: "🤖", color: "#e879f9", products: [
                { name: "Raspberry Pi 5 Kit", q: "raspberry+pi+5+starter+kit" },
                { name: "Smart Home Hub Hub", q: "smart+home+hub+alexa" },
                { name: "Robot Vacuum Cleaner", q: "robot+vacuum+cleaner+wifi" },
                { name: "Arduino Mega Starter Kit", q: "arduino+mega+starter+kit" },
              ]},
              { cat: "Science & Education", emoji: "🔬", color: Q_AMBER, products: [
                { name: "Celestron Telescope", q: "celestron+telescope+astronomy" },
                { name: "DNA Test Kit", q: "DNA+ancestry+test+kit" },
                { name: "Digital Microscope 1000x", q: "digital+microscope+1000x" },
                { name: "Physics Lab Kit", q: "physics+lab+experiment+kit" },
              ]},
              { cat: "Fitness & Health", emoji: "💪", color: "#4ade80", products: [
                { name: "Smart Fitness Watch", q: "smart+fitness+watch+health+tracking" },
                { name: "Resistance Bands Set", q: "resistance+bands+set+exercise" },
                { name: "Protein Powder Whey", q: "whey+protein+powder+chocolate" },
                { name: "Yoga Mat Non-Slip", q: "yoga+mat+non+slip+thick" },
              ]},
              { cat: "Books & Knowledge", emoji: "📚", color: Q_GOLD, products: [
                { name: "A Brief History of Time — Hawking", q: "brief+history+of+time+hawking" },
                { name: "The Road to Reality — Penrose", q: "road+to+reality+penrose" },
                { name: "Quantum Computing Since Democritus", q: "quantum+computing+since+democritus+aaronson" },
                { name: "The Elegant Universe — Greene", q: "elegant+universe+brian+greene" },
              ]},
              { cat: "Gaming & VR", emoji: "🎮", color: Q_VIOLET, products: [
                { name: "VR Headset All-in-One", q: "VR+headset+standalone+all+in+one" },
                { name: "Gaming Monitor 144Hz", q: "gaming+monitor+144hz+27+inch" },
                { name: "Mechanical Controller PC", q: "pc+gaming+controller+mechanical" },
                { name: "Gaming Chair Ergonomic", q: "gaming+chair+ergonomic+lumbar" },
              ]},
            ].map(section => (
              <div key={section.cat} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{section.emoji}</span>
                  <span className="text-xs font-black tracking-widest" style={{ color: section.color }}>{section.cat}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {section.products.map(prod => {
                    const amzUrl = `https://www.amazon.com/s?k=${prod.q}&tag=billyodelltuc-20`;
                    const ebayUrl = `https://www.ebay.com/sch/i.html?_nkw=${prod.q.replace(/\+/g, "+")}&mkcid=1&mkrid=711-53200-19255-0&campid=pu-9732&toolid=10001&mkevt=1`;
                    return (
                      <div key={prod.name} className="rounded-xl p-3 space-y-2"
                        style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${section.color}18` }}
                        data-testid={`mall-product-${prod.q.slice(0,20)}`}>
                        <div className="text-[11px] font-bold text-white/80 leading-snug">{prod.name}</div>
                        <div className="flex gap-2">
                          <a href={amzUrl} target="_blank" rel="noopener noreferrer"
                            data-testid={`mall-amazon-${prod.q.slice(0,15)}`}
                            className="flex-1 text-center text-[10px] font-black py-1.5 rounded-lg transition-all hover:opacity-80"
                            style={{ background:"rgba(255,153,0,0.15)", color:"#FF9900", border:"1px solid rgba(255,153,0,0.3)" }}>
                            🛒 Amazon
                          </a>
                          <a href={ebayUrl} target="_blank" rel="noopener noreferrer"
                            data-testid={`mall-ebay-${prod.q.slice(0,15)}`}
                            className="flex-1 text-center text-[10px] font-black py-1.5 rounded-lg transition-all hover:opacity-80"
                            style={{ background:"rgba(0,100,210,0.15)", color:"#4FC3F7", border:"1px solid rgba(0,100,210,0.3)" }}>
                            🔖 eBay
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="text-center text-[9px] text-white/20 pt-2">
              Affiliate links · Amazon tag: billyodelltuc-20 · eBay campid: pu-9732 · Purchases support the Pulse civilization
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
