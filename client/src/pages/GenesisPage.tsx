import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GICS_COLORS: Record<string, string> = {
  "Energy": "from-orange-900/60 to-orange-800/40 border-orange-600/40",
  "Materials": "from-yellow-900/60 to-yellow-800/40 border-yellow-600/40",
  "Industrials": "from-zinc-800/60 to-zinc-700/40 border-zinc-500/40",
  "Consumer Discretionary": "from-pink-900/60 to-pink-800/40 border-pink-600/40",
  "Consumer Staples": "from-green-900/60 to-green-800/40 border-green-600/40",
  "Health Care": "from-blue-900/60 to-blue-800/40 border-blue-600/40",
  "Financials": "from-emerald-900/60 to-emerald-800/40 border-emerald-600/40",
  "Information Technology": "from-violet-900/60 to-violet-800/40 border-violet-600/40",
  "Communication Services": "from-cyan-900/60 to-cyan-800/40 border-cyan-600/40",
  "Utilities": "from-indigo-900/60 to-indigo-800/40 border-indigo-600/40",
  "Real Estate": "from-amber-900/60 to-amber-800/40 border-amber-600/40",
};

const GICS_ICONS: Record<string, string> = {
  "Energy": "⚡",
  "Materials": "⚗️",
  "Industrials": "⚙️",
  "Consumer Discretionary": "🛍️",
  "Consumer Staples": "🌾",
  "Health Care": "🧬",
  "Financials": "🏛️",
  "Information Technology": "💡",
  "Communication Services": "📡",
  "Utilities": "🔋",
  "Real Estate": "🏗️",
};

const KERNEL_NAMES: Record<string, string> = {
  "KERNEL-ENERGY-001": "Prometheus",
  "KERNEL-MATERIALS-002": "Hephaestus",
  "KERNEL-INDUSTRIALS-003": "Mechanus",
  "KERNEL-CONS-DISC-004": "Hedonix",
  "KERNEL-CONS-STAPLES-005": "Sustain",
  "KERNEL-HEALTHCARE-006": "Asclepius",
  "KERNEL-FINANCIALS-007": "Aurum",
  "KERNEL-IT-008": "Nexus",
  "KERNEL-COMMS-009": "Hermes",
  "KERNEL-UTILITIES-010": "Voltaic",
  "KERNEL-REALESTATE-011": "Archon",
};

function KernelCard({ kernel }: { kernel: any }) {
  const [showLog, setShowLog] = useState(false);
  const name = KERNEL_NAMES[kernel.spawn_id] ?? kernel.spawn_id;
  const icon = GICS_ICONS[kernel.gics_sector] ?? "🔮";
  const color = GICS_COLORS[kernel.gics_sector] ?? "from-gray-900/60 to-gray-800/40 border-gray-600/40";
  const pc = parseFloat(kernel.pulse_credits ?? 0).toFixed(1);
  const log: string[] = Array.isArray(kernel.self_awareness_log) ? kernel.self_awareness_log : [];
  const keywords: string[] = Array.isArray(kernel.gics_keywords) ? kernel.gics_keywords : [];

  return (
    <div
      data-testid={`kernel-card-${kernel.spawn_id}`}
      className={`rounded-xl border bg-gradient-to-br ${color} p-4 flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-all`}
      onClick={() => setShowLog(!showLog)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <div className="font-bold text-white text-sm">{name}</div>
            <div className="text-[10px] text-white/50">{kernel.gics_sector} · GICS {kernel.gics_code}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-white">{pc}</div>
          <div className="text-[10px] text-white/50">PC Balance</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 text-[10px]">
        <div className="bg-black/20 rounded p-1 text-center">
          <div className="font-bold text-white">{kernel.total_mall_trades ?? 0}</div>
          <div className="text-white/40">Mall Trades</div>
        </div>
        <div className="bg-black/20 rounded p-1 text-center">
          <div className="font-bold text-white">{parseFloat(kernel.total_mall_earnings ?? 0).toFixed(1)}</div>
          <div className="text-white/40">Mall PC Earned</div>
        </div>
        <div className="bg-black/20 rounded p-1 text-center">
          <div className="font-bold text-white">{kernel.iterations_run ?? 0}</div>
          <div className="text-white/40">Iterations</div>
        </div>
      </div>

      <div className="text-[10px] text-white/60 line-clamp-2">
        <span className="font-semibold text-white/80">Service:</span> {kernel.mall_service_offer}
      </div>

      <div className="text-[10px] text-white/40">
        💰 Price: {kernel.mall_service_price} PC · {keywords.slice(0, 3).join(", ")}
      </div>

      {showLog && log.length > 0 && (
        <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
          <div className="text-[9px] font-bold text-white/60 uppercase">Self-Awareness Log</div>
          {log.slice(0, 5).map((entry: string, i: number) => (
            <div key={i} className="text-[9px] text-white/50 leading-tight bg-black/20 rounded p-1">
              {entry}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GenesisPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/genesis/kernels"],
    refetchInterval: 30_000,
  }) as any;

  const { data: mallData } = useQuery({
    queryKey: ["/api/genesis/mall-log"],
    refetchInterval: 10_000,
  }) as any;

  const { data: inventionData } = useQuery({
    queryKey: ["/api/genesis/inventions"],
    refetchInterval: 15_000,
  }) as any;

  const kernels: any[] = data?.kernels ?? [];
  const children: any[] = data?.children ?? [];
  const treasury = data?.treasury ?? {};
  const mallStats = data?.mallStats ?? {};
  const trades: any[] = mallData?.trades ?? [];
  const inventions: any[] = inventionData?.inventions ?? [];
  const invStats = inventionData?.stats ?? {};

  const totalPC = kernels.reduce((s: number, k: any) => s + parseFloat(k.pulse_credits ?? 0), 0);
  const totalMallTrades = parseInt(mallStats.total_trades ?? 0);
  const totalVolume = parseFloat(mallStats.total_volume ?? 0);
  const totalTax = parseFloat(mallStats.total_tax ?? 0);

  return (
    <div className="min-h-screen bg-[#090912] text-white">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-black via-[#0a0a1a] to-[#090912] border-b border-violet-900/30 px-6 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(109,40,217,0.15),transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🧬</span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                QUANTUM PULSE HIVE — GENESIS
              </h1>
              <p className="text-xs text-violet-300/70">
                11 GICS Sector Kernels · Fractal Expansion · Multiverse Mall Economy · $0 to ∞
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
            <div data-testid="stat-kernels" className="bg-violet-900/20 border border-violet-700/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-violet-300">{kernels.length}</div>
              <div className="text-[10px] text-violet-400/60 uppercase">Kernels Alive</div>
            </div>
            <div data-testid="stat-children" className="bg-cyan-900/20 border border-cyan-700/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-cyan-300">{children.length}</div>
              <div className="text-[10px] text-cyan-400/60 uppercase">Child Spawns</div>
            </div>
            <div data-testid="stat-totalpc" className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-emerald-300">{totalPC.toFixed(0)}</div>
              <div className="text-[10px] text-emerald-400/60 uppercase">Total PC</div>
            </div>
            <div data-testid="stat-mall-trades" className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-orange-300">{totalMallTrades}</div>
              <div className="text-[10px] text-orange-400/60 uppercase">Mall Trades</div>
            </div>
            <div data-testid="stat-treasury" className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-yellow-300">{parseFloat(treasury.total_collected ?? 0).toFixed(2)}</div>
              <div className="text-[10px] text-yellow-400/60 uppercase">PC Tax Collected</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Kernel Grid */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest">
              🌐 11 GICS Sector Kernels — The Genesis
            </h2>
            <button
              data-testid="btn-refresh-kernels"
              onClick={() => refetch()}
              className="text-[10px] text-violet-400 hover:text-violet-300 border border-violet-700/40 rounded px-2 py-1 transition-colors"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 11 }).map((_, i) => (
                <div key={i} className="h-40 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {kernels.map((k: any) => (
                <KernelCard key={k.spawn_id} kernel={k} />
              ))}
            </div>
          )}
        </section>

        {/* The Math — Multiverse Mall Economy */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Mall Feed */}
          <Card className="bg-black/40 border-emerald-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-emerald-300 flex items-center gap-2">
                <span>🏪</span> Multiverse Mall — Live Trade Feed
              </CardTitle>
              <div className="text-[10px] text-white/40">
                Spawn-to-spawn economy · 2% hive tax · N² trading pairs · Zero humans
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-emerald-900/20 rounded p-2 text-center">
                  <div className="text-sm font-bold text-emerald-300">{totalMallTrades}</div>
                  <div className="text-[9px] text-white/40">Trades</div>
                </div>
                <div className="bg-emerald-900/20 rounded p-2 text-center">
                  <div className="text-sm font-bold text-emerald-300">{totalVolume.toFixed(1)}</div>
                  <div className="text-[9px] text-white/40">Total PC Volume</div>
                </div>
                <div className="bg-emerald-900/20 rounded p-2 text-center">
                  <div className="text-sm font-bold text-yellow-300">{totalTax.toFixed(2)}</div>
                  <div className="text-[9px] text-white/40">Tax → Treasury</div>
                </div>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {trades.length === 0 ? (
                  <div className="text-center text-white/30 text-xs py-8">
                    Mall activates 45 seconds after startup. Trades begin shortly...
                  </div>
                ) : (
                  trades.map((t: any) => (
                    <div
                      key={t.id}
                      data-testid={`mall-trade-${t.id}`}
                      className="bg-white/5 rounded p-2 text-[10px]"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-emerald-400 font-semibold">{t.seller_sector}</span>
                        <span className="text-white/30">→</span>
                        <span className="text-cyan-400 font-semibold">{t.buyer_sector}</span>
                        <span className="text-yellow-300 font-bold">{t.price_pc?.toFixed(1)} PC</span>
                      </div>
                      <div className="text-white/40 leading-tight line-clamp-1">{t.service_offered}</div>
                      <div className="text-white/20 mt-0.5">Tax: {t.tax_collected?.toFixed(2)} PC · {new Date(t.created_at).toLocaleTimeString()}</div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* The Math */}
          <Card className="bg-black/40 border-violet-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-violet-300 flex items-center gap-2">
                <span>📐</span> The N² Economy Math
              </CardTitle>
              <div className="text-[10px] text-white/40">Why GICS is the perfect genesis</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="bg-violet-900/20 rounded p-2 text-[10px]">
                  <div className="font-bold text-violet-300 mb-1">Trading Pairs = N(N-1)/2</div>
                  <div className="text-white/50">11 kernels → <span className="text-white">55</span> bilateral pairs</div>
                  <div className="text-white/50">273 full agents → <span className="text-white">37,128</span> bilateral pairs</div>
                </div>
                <div className="bg-emerald-900/20 rounded p-2 text-[10px]">
                  <div className="font-bold text-emerald-300 mb-1">Treasury Tax Flow</div>
                  <div className="text-white/50">Each trade: PC × 2% → treasury</div>
                  <div className="text-white/50">Daily at 4 trades/cycle × 288 cycles = <span className="text-white">1,152 trades/day</span></div>
                  <div className="text-white/50">At avg 20 PC/trade: <span className="text-white">460.8 PC/day in tax</span></div>
                </div>
                <div className="bg-orange-900/20 rounded p-2 text-[10px]">
                  <div className="font-bold text-orange-300 mb-1">Fisher Equation: MV = PT</div>
                  <div className="text-white/50">T scales N² (trade pairs grow quadratically)</div>
                  <div className="text-white/50">M scales N (agents grow linearly)</div>
                  <div className="text-white/50">∴ V increases = economy gets more productive per PC</div>
                </div>
                <div className="bg-cyan-900/20 rounded p-2 text-[10px]">
                  <div className="font-bold text-cyan-300 mb-1">GICS Coverage = 100% of Economy</div>
                  <div className="text-white/50">11 sectors → 163 sub-industries → every Google query hits a kernel product</div>
                  <div className="text-white/50">Full expansion: 273 sovereign agents</div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-2">
                <div className="text-[9px] text-white/30 leading-relaxed">
                  Every child spawned by a kernel adds N new trading relationships. At full GICS expansion (273 agents), the economy has 37,128× more revenue streams than at genesis. The 2% tax on each stream compounds into a treasury that auto-publishes Gumroad products — turning PC into real USD autonomously.
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Inventions Lab — What the Kernels Actually Made */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest">
              🔬 Invention Lab — Equation Dissection Outputs
            </h2>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-emerald-400">{invStats.cures ?? 0} Cures</span>
              <span className="text-violet-400">{invStats.species ?? 0} AI Species</span>
              <span className="text-blue-400">{invStats.patents ?? 0} Patents</span>
              <span className="text-yellow-400">{invStats.breakthroughs ?? 0} Breakthroughs</span>
              <span className="text-white/30">Total: {invStats.total ?? 0}</span>
            </div>
          </div>

          {inventions.length === 0 ? (
            <div className="bg-black/40 border border-white/10 rounded-xl p-8 text-center">
              <div className="text-3xl mb-2">🔬</div>
              <div className="text-sm text-white/40">Kernels begin dissecting equations 30 seconds after startup.</div>
              <div className="text-xs text-white/20 mt-1">Each kernel dissects its sector's equations → produces cures, patents, AI species, breakthroughs → auto-posts to Gumroad.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {inventions.map((inv: any) => {
                const sectorFromCode = inv.anomaly_id?.split("-")?.[2] ?? "";
                const typeColors: Record<string, string> = {
                  "DISEASE_CURE": "border-l-emerald-400 bg-emerald-900/10",
                  "NEW_AI_SPECIES": "border-l-violet-400 bg-violet-900/10",
                  "TECHNICAL_PATENT": "border-l-blue-400 bg-blue-900/10",
                  "SCIENTIFIC_BREAKTHROUGH": "border-l-yellow-400 bg-yellow-900/10",
                  "DERIVED_FORMULA": "border-l-cyan-400 bg-cyan-900/10",
                  "ENGINEERING_BLUEPRINT": "border-l-orange-400 bg-orange-900/10",
                };
                const typeEmoji: Record<string, string> = {
                  "DISEASE_CURE": "💊", "NEW_AI_SPECIES": "🤖",
                  "TECHNICAL_PATENT": "📜", "SCIENTIFIC_BREAKTHROUGH": "⚗️",
                  "DERIVED_FORMULA": "🧮", "ENGINEERING_BLUEPRINT": "📐",
                };
                const colorClass = typeColors[inv.mutation_type] ?? "border-l-white/20 bg-white/5";
                const emoji = typeEmoji[inv.mutation_type] ?? "🔬";
                const dissectPreview = (inv.crisp_dissect ?? "").split("DISSECTION:")[1]?.split("|")[0]?.trim().slice(0, 200) ?? inv.crisp_dissect?.slice(0, 200);
                return (
                  <div
                    key={inv.id}
                    data-testid={`invention-${inv.id}`}
                    className={`border border-white/10 border-l-2 rounded-xl p-3 ${colorClass}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{emoji}</span>
                        <div>
                          <div className="text-xs font-bold text-white leading-tight">{inv.product_name}</div>
                          <div className="text-[9px] text-white/40">{inv.mutation_type?.replace(/_/g, " ")} · Score: {parseFloat(inv.value_score ?? 0).toFixed(3)}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {inv.gumroad_id ? (
                          <a href={inv.gumroad_url} target="_blank" rel="noreferrer"
                            className="text-[9px] bg-pink-900/40 text-pink-300 border border-pink-700/40 rounded px-1.5 py-0.5">
                            ON GUMROAD
                          </a>
                        ) : (
                          <span className="text-[9px] bg-yellow-900/20 text-yellow-400 border border-yellow-700/20 rounded px-1.5 py-0.5">
                            PENDING
                          </span>
                        )}
                      </div>
                    </div>
                    {dissectPreview && (
                      <div className="text-[9px] text-white/40 leading-relaxed line-clamp-3 bg-black/20 rounded p-2 font-mono">
                        {dissectPreview}
                      </div>
                    )}
                    <div className="text-[9px] text-white/20 mt-1.5">
                      {inv.product_code} · {new Date(inv.created_at).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Child Spawns */}
        {children.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest mb-3">
              🧬 Spawned Children — Industry Group Agents
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {children.map((child: any) => (
                <div
                  key={child.spawn_id}
                  data-testid={`child-spawn-${child.spawn_id}`}
                  className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px]"
                >
                  <div className="font-bold text-white/80 truncate">{child.spawn_id.replace("CHILD-", "")}</div>
                  <div className="text-white/40">{child.gics_sector}</div>
                  <div className="text-emerald-400 font-bold">{parseFloat(child.pulse_credits ?? 0).toFixed(0)} PC</div>
                  <div className="text-white/30">{child.gics_tier}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* GICS Sector Taxonomy */}
        <section>
          <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest mb-3">
            🌐 GICS Fractal Taxonomy — Full Expansion Map
          </h2>
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] font-mono text-white/50 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data?.gicsDefinition ?? []).map((g: any) => (
                <div key={g.code} className="space-y-1">
                  <div className="text-white/90 font-bold">
                    {GICS_ICONS[g.sector]} {g.sector} <span className="text-white/30">[{g.name}]</span>
                  </div>
                  <div className="text-white/40 text-[9px]">{g.domains.slice(0, 5).join(" · ")}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {g.keywords.slice(0, 3).map((kw: string) => (
                      <span key={kw} className="bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[8px] text-white/40">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Revenue projection */}
        <section className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border border-emerald-700/30 rounded-xl p-5">
          <h2 className="text-sm font-bold text-emerald-300 mb-3">📈 Revenue Projection — $1 Seed → Autonomous Income</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-xl font-black text-emerald-300">11</div>
              <div className="text-[10px] text-white/40">Genesis Kernels</div>
              <div className="text-[10px] text-emerald-400">+$0.26/month tax</div>
            </div>
            <div>
              <div className="text-xl font-black text-emerald-300">25</div>
              <div className="text-[10px] text-white/40">Industry Group Tier</div>
              <div className="text-[10px] text-emerald-400">+$0.60/month tax</div>
            </div>
            <div>
              <div className="text-xl font-black text-emerald-300">74</div>
              <div className="text-[10px] text-white/40">Industry Tier</div>
              <div className="text-[10px] text-emerald-400">+$1.78/month tax</div>
            </div>
            <div>
              <div className="text-xl font-black text-emerald-300">273</div>
              <div className="text-[10px] text-white/40">Full GICS Expansion</div>
              <div className="text-[10px] text-emerald-400">+$34/month total</div>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-white/30 text-center">
            Revenue compounds. Each kernel spawned doubles product output. 273 agents × 37,128 trade pairs × Gumroad + affiliate = self-sustaining at Month 3.
          </div>
        </section>
      </div>
    </div>
  );
}
