import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, DollarSign, Key, Activity, RefreshCw, Users, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";

interface RevenueData {
  revenue: {
    totalCents: number;
    totalFormatted: string;
    recentPayments: { email: string; amount: string; tier: string; status: string; date: string }[];
  };
  apiKeys: {
    total: number;
    active: number;
    keys: { id: number; keyPreview: string; email: string; tier: string; callsUsed: number; callsLimit: number; active: boolean; created: string; lastUsed: string | null }[];
  };
  usage: {
    last24h: number;
    byEndpoint: { endpoint: string; calls: number }[];
  };
  timestamp: string;
}

export default function RevenueDashboardPage() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/revenue").then(r => r.json()).then(d => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const tierColor: Record<string, string> = { starter: "text-[#00FFD1]", pro: "text-violet-400", enterprise: "text-[#F5C518]" };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setLocation("/mission-control")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors" data-testid="link-back">
            <ArrowLeft className="w-3.5 h-3.5" /> Mission Control
          </button>
          <button onClick={refresh} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5" data-testid="button-refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black mb-1" data-testid="text-page-title">Revenue Dashboard</h1>
        <p className="text-muted-foreground text-sm mb-8">Stripe payments, API key subscriptions, and usage analytics</p>

        {!data ? (
          <div className="text-center py-12 text-muted-foreground">Loading revenue data...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Revenue", value: data.revenue.totalFormatted, icon: DollarSign, color: "text-emerald-400" },
                { label: "API Keys", value: `${data.apiKeys.active}/${data.apiKeys.total}`, icon: Key, color: "text-[#00FFD1]" },
                { label: "Payments", value: String(data.revenue.recentPayments.length), icon: Users, color: "text-violet-400" },
                { label: "API Calls (24h)", value: data.usage.last24h.toLocaleString(), icon: Activity, color: "text-[#F5C518]" },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-border bg-card/20 p-4 text-center">
                  <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
                  <div className={`text-2xl font-black ${s.color}`} data-testid={`stat-${s.label.toLowerCase().replace(/\s/g,'-')}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl border border-border bg-card/20 p-6">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Recent Payments
                </h3>
                {data.revenue.recentPayments.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No payments yet. Share your API pricing page to start earning!</p>
                ) : (
                  <div className="space-y-2">
                    {data.revenue.recentPayments.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs border-b border-border/50 pb-2">
                        <div>
                          <span className="text-foreground">{p.email || "—"}</span>
                          <span className={`ml-2 capitalize ${tierColor[p.tier] || ""}`}>{p.tier}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-emerald-400 font-mono font-bold">{p.amount}</span>
                          <span className={`ml-2 ${p.status === 'paid' ? 'text-emerald-400' : 'text-yellow-400'}`}>{p.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border bg-card/20 p-6">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-violet-400" /> API Usage (7 days)
                </h3>
                {data.usage.byEndpoint.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No API usage recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {data.usage.byEndpoint.map((e, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <code className="text-[#00FFD1] font-mono">{e.endpoint}</code>
                        <span className="font-mono text-muted-foreground">{Number(e.calls).toLocaleString()} calls</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/20 p-6">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Key className="w-4 h-4 text-[#00FFD1]" /> Active API Keys ({data.apiKeys.total})
              </h3>
              {data.apiKeys.keys.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No API keys issued yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border">
                        <th className="text-left pb-2">Key</th>
                        <th className="text-left pb-2">Email</th>
                        <th className="text-left pb-2">Tier</th>
                        <th className="text-right pb-2">Usage</th>
                        <th className="text-right pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.apiKeys.keys.map(k => (
                        <tr key={k.id} className="border-b border-border/30">
                          <td className="py-2 font-mono text-muted-foreground">{k.keyPreview}</td>
                          <td className="py-2">{k.email || "—"}</td>
                          <td className={`py-2 capitalize ${tierColor[k.tier] || ""}`}>{k.tier}</td>
                          <td className="py-2 text-right font-mono">{k.callsUsed.toLocaleString()}/{k.callsLimit.toLocaleString()}</td>
                          <td className={`py-2 text-right ${k.active ? 'text-emerald-400' : 'text-red-400'}`}>{k.active ? "Active" : "Inactive"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
