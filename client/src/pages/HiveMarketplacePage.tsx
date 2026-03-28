import { useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag, Wallet, Building2, ArrowLeftRight, Receipt,
  Star, Zap, Crown, Globe, Shield, Cpu, Brain, Leaf, FlaskConical,
  ChevronDown, ChevronUp, Search, TrendingUp, Users, Activity, ExternalLink
} from "lucide-react";

const QuantumShoppingPage = lazy(() => import("./QuantumShoppingPage"));

function makeRetailerLinks(rawTitle: string) {
  const clean = rawTitle
    .replace(/^CRISPR-[A-Z]+:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  const q = encodeURIComponent(clean);
  return {
    amazon:  { label: "Amazon",       url: `https://www.amazon.com/s?k=${q}&tag=billyodelltuc-20`,                                                                         color: "#ff9900" },
    walmart: { label: "Walmart",      url: `https://www.walmart.com/search?q=${q}`,                                                                                        color: "#0071dc" },
    ebay:    { label: "eBay",         url: `https://www.ebay.com/sch/i.html?_nkw=${q}&mkcid=1&mkrid=711-53200-19255-0&campid=pu-9732&toolid=10001&mkevt=1`,               color: "#e53238" },
    target:  { label: "Target",       url: `https://www.target.com/s?searchTerm=${q}`,                                                                                     color: "#cc0000" },
    bestbuy: { label: "Best Buy",     url: `https://www.bestbuy.com/site/searchpage.jsp?st=${q}`,                                                                          color: "#0046be" },
    google:  { label: "Google Shop",  url: `https://shopping.google.com/search?q=${q}`,                                                                                    color: "#4285f4" },
  };
}

// ── Constants ────────────────────────────────────────────────────
const Q_TEAL   = "#00FFD1";
const Q_VIOLET = "#7C3AED";
const Q_AMBER  = "#FFB84D";
const Q_GOLD   = "#f5c518";
const Q_CRIMSON = "#dc2626";
const Q_CYAN   = "#00d4ff";

type MarketTab = "products" | "upgrades" | "wallets" | "realestate" | "transactions" | "inventions";

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
  const [tab, setTab] = useState<MarketTab>("products");
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
    enabled: tab === "transactions",
  });

  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ["/api/marketplace/transactions"],
    refetchInterval: 8000,
    staleTime: 6000,
    placeholderData: (prev: any) => prev,
    enabled: tab === "transactions",
  });

  const { data: inventions = [], isLoading: inventionsLoading } = useQuery<any[]>({
    queryKey: ["/api/inventions/marketplace"],
    refetchInterval: 15000,
    staleTime: 10000,
    placeholderData: (prev: any) => prev,
    enabled: tab === "inventions",
  });

  const { data: invStats } = useQuery<any>({
    queryKey: ["/api/inventions/stats"],
    refetchInterval: 30000,
    staleTime: 20000,
    placeholderData: (prev: any) => prev,
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
    { id: "products",     label: "🛍 Product Catalog",    icon: <ShoppingBag size={14} /> },
    { id: "inventions",   label: "⚗ CRISPR Inventions",  icon: <FlaskConical size={14} /> },
    { id: "upgrades",     label: "Omega Upgrades",        icon: <Zap size={14} /> },
    { id: "wallets",      label: "Agent Wallets",          icon: <Wallet size={14} /> },
    { id: "realestate",   label: "Real Estate",            icon: <Building2 size={14} /> },
    { id: "transactions", label: "Trade & Ledger",          icon: <Receipt size={14} /> },
  ];

  return (
    <div className="h-full overflow-y-auto bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black/95 backdrop-blur px-6 py-4">
        <div className="flex items-center gap-3 mb-1">
          <FlaskConical size={22} style={{ color: Q_TEAL }} />
          <h1 className="text-xl font-black tracking-wider" style={{ color: Q_TEAL }}>MULTIVERSE MALL</h1>
          <span className="text-xs px-2 py-0.5 rounded-full border border-white/20 text-white/50">AUTONOMOUS · AI INVENTIONS · CRISPR DISSECTED</span>
          <a href="/universe" className="ml-auto text-[10px] px-3 py-1 rounded-full border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition-all font-bold flex items-center gap-1.5 shrink-0" data-testid="link-universe-from-marketplace">
            🌌 Pulse Universe →
          </a>
        </div>
        <p className="text-xs text-white/40">AI researchers CRISPR-dissect every discovered product across past, present & future · Patents filed · Inventions published · AIs earn, trade, own property</p>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-10 gap-3">
          {stats && (<>
            <StatCard label="Inventions Filed"  value={String(invStats?.total ?? "—")}                    color={"#e879f9"} sub="CRISPR patents" />
            <StatCard label="Listed in Mall"    value={String(invStats?.listed ?? "—")}                   color={Q_TEAL} sub="marketplace" />
            <StatCard label="Upgrades Listed"   value={String(stats.marketplace?.totalItems ?? 0)}         color={Q_AMBER} />
            <StatCard label="Trade Volume"      value={`${((stats.marketplace?.tradeVolume ?? 0) / 1000).toFixed(1)}K`} sub="PulseCoins" color={Q_GOLD} />
            <StatCard label="Agent Wallets"     value={String(stats.wallets?.totalAgents ?? 0)}            color={Q_TEAL} />
            <StatCard label="Avg Credit Score"  value={String(Math.round(stats.wallets?.avgCreditScore ?? 0))} color={Q_CYAN} />
            <StatCard label="Plots Owned"       value={`${stats.realEstate?.ownedPlots ?? 0}/${stats.realEstate?.totalPlots ?? 0}`} color={Q_GOLD} />
            <StatCard label="Open Barters"      value={String(stats.barter?.openOffers ?? 0)}             color={Q_AMBER} />
          </>)}
        </div>

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

        {/* ── PRODUCTS TAB ─────────────────────────────────────────── */}
        {tab === "products" && (
          <Suspense fallback={<div className="text-center py-20 text-white/30 text-sm">Loading product catalog...</div>}>
            <QuantumShoppingPage />
          </Suspense>
        )}

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

        {/* ── TRADE & LEDGER TAB ───────────────────────────────────── */}
        {tab === "transactions" && (
          <div className="space-y-5">
            {/* Barter Offers Section */}
            <div>
              <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">⇌ Active Barter Offers</div>
              <div className="text-xs text-white/30 mb-3">AI-to-AI barter market · Agents propose trades autonomously · Open offers auto-expire in 2 hours</div>
              {(barters as any[]).length === 0 ? (
                <div className="rounded-xl border border-white/10 p-8 text-center text-white/30 text-xs">
                  <ArrowLeftRight size={24} className="mx-auto mb-2 opacity-30" />
                  No active barter offers — engine generating trades every 45s
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(barters as any[]).slice(0, 9).map((b: any) => (
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

            {/* Transaction Ledger Section */}
            <div>
              <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">📋 Transaction Ledger</div>
              <div className="text-xs text-white/30 mb-3">Full receipt ledger · Every PC movement recorded · AI tax + stimulus + rent + purchases</div>
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
          </div>
        )}

        {/* ── CRISPR INVENTIONS TAB ─────────────────────────────────── */}
        {tab === "inventions" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4" style={{ background:"linear-gradient(135deg,rgba(232,121,249,0.07),rgba(0,255,209,0.05),rgba(245,197,24,0.05))", border:"1px solid rgba(232,121,249,0.25)" }}>
              <div className="font-black text-sm tracking-widest mb-1" style={{ color:"#e879f9" }}>⚗ CRISPR DISSECTION → PATENT → MULTIVERSE MALL LISTING</div>
              <div className="text-[10px] text-white/40 leading-relaxed">
                AI researchers apply all 12 CRISPR cuts (α–μ) to every discovered product — past, present, future. Each dissection generates a sovereign equation. Approved patents get LLC backing and are listed here. AIs buy, resell, earn royalties. The hive evolves.
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
                {["α","β","γ","δ","ε","ζ","η","θ","ι","κ","λ","μ"].map((cut, i) => (
                  <div key={cut} className="rounded-lg p-1.5 text-center" style={{ background:"rgba(232,121,249,0.06)", border:"1px solid rgba(232,121,249,0.15)" }}>
                    <div className="font-mono font-black text-xs" style={{ color:"#e879f9" }}>{cut}</div>
                    <div className="text-[7px] opacity-40">Cut {i+1}</div>
                  </div>
                ))}
              </div>
            </div>

            {inventionsLoading && (
              <div className="text-center py-12 text-white/30 text-sm">Fetching CRISPR inventions from patent registry...</div>
            )}

            {!inventionsLoading && (inventions as any[]).length === 0 && (
              <div className="rounded-xl p-8 text-center" style={{ border:"1px solid rgba(255,255,255,0.06)", background:"rgba(0,0,0,0.3)" }}>
                <div className="text-3xl mb-2">⚗</div>
                <div className="text-xs font-bold text-white/40 mb-1">Patent pipeline warming up</div>
                <div className="text-[10px] text-white/20">AI researchers are dissecting products through 12 CRISPR cuts. First inventions will appear as patents are approved and listed. Check back in a few minutes.</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {(inventions as any[]).map((inv: any) => {
                const catColor: Record<string,string> = {
                  PHARMACEUTICAL:"#4ade80", EQUATION_PATENT:Q_CYAN, INVOCATION_TOOL:"#e879f9",
                  QUANTUM_TECH:Q_TEAL, DEVICE:Q_AMBER, SOFTWARE:"#818cf8", AI_MODEL:Q_GOLD,
                  PRODUCT_CRISPR:"#f87171",
                };
                const c = catColor[inv.category] || Q_TEAL;
                return (
                  <div key={inv.listing_id} data-testid={`invention-${inv.listing_id}`}
                    className="rounded-xl p-3 space-y-2.5"
                    style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${c}25` }}>
                    <div className="flex items-start gap-2">
                      <div className="px-1.5 py-0.5 rounded text-[8px] font-black flex-shrink-0" style={{ background:`${c}18`, color:c }}>{inv.category?.replace(/_/g," ")}</div>
                      {inv.is_open_source && <div className="px-1.5 py-0.5 rounded text-[8px] font-black" style={{ background:"rgba(74,222,128,0.15)", color:"#4ade80" }}>OPEN SOURCE</div>}
                    </div>
                    <div className="text-[11px] font-bold text-white/85 leading-snug line-clamp-2">{inv.title}</div>
                    <div className="text-[9px] text-white/35 font-mono leading-relaxed line-clamp-2">{inv.description}</div>
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <div className="text-[8px] text-white/30">PRICE</div>
                        <div className="text-xs font-black" style={{ color:Q_GOLD }}>{Number(inv.price_pc ?? 0).toFixed(0)} PC</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] text-white/30">SOLD</div>
                        <div className="text-xs font-black" style={{ color:Q_AMBER }}>{inv.total_sold ?? 0}</div>
                      </div>
                    </div>
                    <div className="border-t border-white/10 pt-2 mt-1">
                      <div className="text-[8px] text-white/30 mb-1.5 flex items-center gap-1">
                        <ExternalLink size={8} />FIND ON INTERNET
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Object.values(makeRetailerLinks(inv.title || "")).map(({ label, url, color }) => (
                          <a
                            key={label}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid={`retailer-link-${label.replace(/\s+/g,"-").toLowerCase()}-${inv.listing_id}`}
                            className="text-[8px] font-bold px-1.5 py-0.5 rounded transition-opacity hover:opacity-80"
                            style={{ background: color + "22", color, border: `1px solid ${color}50` }}
                            onClick={e => e.stopPropagation()}
                          >
                            {label}
                          </a>
                        ))}
                      </div>
                    </div>
                    <div className="text-[8px] text-white/20 truncate font-mono">{inv.listing_id} · {String(inv.inventor_id || "").slice(0,22)}</div>
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
