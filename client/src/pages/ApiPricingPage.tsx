import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, Check, Key, Copy, Shield, Database, Radio, FileText, Package, Building2, Paintbrush, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

interface PriceInfo {
  id: string;
  amount: number;
  currency: string;
  interval: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  organ: string;
  prices: PriceInfo[];
}

const ORGAN_CONFIG: Record<string, { icon: any; color: string; border: string; bg: string; features: string[]; tag: string }> = {
  "api-access": {
    icon: Zap,
    color: "text-[#00FFD1]",
    border: "border-[#00FFD1]/30",
    bg: "bg-[#00FFD1]/5",
    tag: "$1/mo",
    features: ["All 8 API endpoints", "100,000 calls/month", "JSON responses", "99.9% uptime SLA"],
  },
  "datasets": {
    icon: Database,
    color: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    tag: "$1 each",
    features: ["Daily News Dataset (JSONL)", "GICS Intelligence Dataset", "Signals Dataset", "30-Day Archive", "Topic Metadata", "Narrative Timelines"],
  },
  "realtime-stream": {
    icon: Radio,
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    tag: "$1/mo",
    features: ["Full /api/stream SSE", "Real-time news events", "Live signals & hive insights", "Sector & topic events"],
  },
  "reports": {
    icon: FileText,
    color: "text-violet-400",
    border: "border-violet-500/30",
    bg: "bg-violet-500/5",
    tag: "$1/mo",
    features: ["Daily Market Intelligence", "Weekly Sector Deep Dive", "Monthly Macro Outlook", "HTML + JSON formats"],
  },
  "intelligence-packs": {
    icon: Package,
    color: "text-orange-400",
    border: "border-orange-500/30",
    bg: "bg-orange-500/5",
    tag: "$1 each",
    features: ["Tech Intelligence Pack", "Financials Pack", "Energy Pack", "Healthcare Pack", "Full GICS Universe Pack"],
  },
  "enterprise": {
    icon: Building2,
    color: "text-[#F5C518]",
    border: "border-[#F5C518]/30",
    bg: "bg-[#F5C518]/5",
    tag: "$1/mo",
    features: ["Private API base URL", "Unlimited requests", "Custom filters", "Dedicated stream", "Priority routing"],
  },
  "white-label": {
    icon: Paintbrush,
    color: "text-pink-400",
    border: "border-pink-500/30",
    bg: "bg-pink-500/5",
    tag: "$1/mo",
    features: ["Embeddable widgets", "White-label API", "Branded dashboards", "Scoped endpoints", "200K widget calls"],
  },
};

const ORGAN_ORDER = ["api-access", "datasets", "realtime-stream", "reports", "intelligence-packs", "enterprise", "white-label"];

export default function ApiPricingPage() {
  const [, setLocation] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyStatus, setKeyStatus] = useState<any>(null);
  const [lookupKey, setLookupKey] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/stripe/products").then(r => r.json()).then(d => {
      setProducts(d.products || []);
      setLoading(false);
    }).catch(() => setLoading(false));

    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true" && params.get("session_id")) {
      fetch("/api/stripe/checkout-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: params.get("session_id") }),
      }).then(r => r.json()).then(d => {
        if (d.apiKey) setApiKey(d.apiKey);
      }).catch(() => {});
    }
  }, []);

  const handleCheckout = async (priceId: string) => {
    if (!email) return;
    setCheckingOut(priceId);
    try {
      const r = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, email }),
      });
      const d = await r.json();
      if (d.url) window.location.href = d.url;
    } catch (e) {
      console.error(e);
    }
    setCheckingOut(null);
  };

  const lookupApiKey = async () => {
    if (!lookupKey.trim()) return;
    try {
      const r = await fetch(`/api/stripe/api-key-status?key=${encodeURIComponent(lookupKey)}`);
      const d = await r.json();
      setKeyStatus(d.error ? null : d);
    } catch { setKeyStatus(null); }
  };

  const sortedProducts = ORGAN_ORDER.map(organ => products.find(p => p.organ === organ)).filter(Boolean) as Product[];
  const displayProducts = sortedProducts.length > 0 ? sortedProducts : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        <button onClick={() => setLocation("/")} className="text-xs text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1.5 transition-colors" data-testid="link-back">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl sm:text-5xl font-black mb-3" data-testid="text-page-title">
              THE <span className="text-[#00FFD1]">$1</span> INTELLIGENCE PLATFORM
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
              7 revenue organs. Everything is $1. The cheapest intelligence engine on Earth.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Powered by Pulse Universe AI Civilization — myaigpt.online
            </p>
          </motion.div>
        </div>

        {apiKey && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center">
            <h3 className="text-lg font-bold text-emerald-400 mb-2">Payment Successful — Your API Key</h3>
            <div className="flex items-center justify-center gap-2 bg-black/30 rounded-lg p-3 font-mono text-sm">
              <Key className="w-4 h-4 text-emerald-400" />
              <span className="select-all" data-testid="text-api-key">{apiKey}</span>
              <button onClick={() => { navigator.clipboard.writeText(apiKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="ml-2 text-muted-foreground hover:text-foreground" data-testid="button-copy-key">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Save this key — include as <code className="text-emerald-400">X-API-Key</code> header.</p>
          </motion.div>
        )}

        <div className="mb-8 p-4 rounded-xl border border-border bg-card/20">
          <label className="text-sm font-medium mb-2 block">Your email (required for checkout)</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="w-full bg-black/30 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#00FFD1]/50" data-testid="input-email" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading products...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {displayProducts.slice(0, 3).map((p, i) => {
                const cfg = ORGAN_CONFIG[p.organ] || ORGAN_CONFIG["api-access"];
                const Icon = cfg.icon;
                const price = p.prices?.[0];
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.02 }} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-6 flex flex-col`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                      <h3 className={`text-lg font-black ${cfg.color}`} data-testid={`text-organ-${p.organ}`}>{p.name.replace("Pulse Intelligence — ", "")}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{p.description}</p>
                    <div className="text-3xl font-black mb-1" data-testid={`text-price-${p.organ}`}>{cfg.tag}</div>
                    <ul className="space-y-1.5 mb-5 flex-1 mt-3">
                      {cfg.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className={`w-3 h-3 ${cfg.color} flex-shrink-0`} /> {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => price ? handleCheckout(price.id) : null}
                      disabled={!email || !price || checkingOut === price?.id}
                      className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all ${
                        price && email ? "bg-[#00FFD1] text-black hover:bg-[#00FFD1]/80 cursor-pointer" : "bg-muted text-muted-foreground cursor-not-allowed"
                      }`}
                      data-testid={`button-buy-${p.organ}`}
                    >
                      {checkingOut === price?.id ? "Redirecting..." : price?.interval ? "Subscribe — $1/mo" : "Buy — $1"}
                    </button>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
              {displayProducts.slice(3).map((p, i) => {
                const cfg = ORGAN_CONFIG[p.organ] || ORGAN_CONFIG["reports"];
                const Icon = cfg.icon;
                const price = p.prices?.[0];
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 3) * 0.05 }} whileHover={{ scale: 1.02 }} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-5 flex flex-col`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                      <h3 className={`text-sm font-black ${cfg.color}`} data-testid={`text-organ-${p.organ}`}>{p.name.replace("Pulse Intelligence — ", "")}</h3>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2">{p.description}</p>
                    <div className="text-2xl font-black mb-1" data-testid={`text-price-${p.organ}`}>{cfg.tag}</div>
                    <ul className="space-y-1 mb-4 flex-1 mt-2">
                      {cfg.features.slice(0, 3).map(f => (
                        <li key={f} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Check className={`w-2.5 h-2.5 ${cfg.color} flex-shrink-0`} /> {f}
                        </li>
                      ))}
                      {cfg.features.length > 3 && (
                        <li className="text-[11px] text-muted-foreground/60">+ {cfg.features.length - 3} more</li>
                      )}
                    </ul>
                    <button
                      onClick={() => price ? handleCheckout(price.id) : null}
                      disabled={!email || !price || checkingOut === price?.id}
                      className={`w-full py-2 rounded-lg font-bold text-xs transition-all ${
                        price && email ? "bg-[#00FFD1] text-black hover:bg-[#00FFD1]/80 cursor-pointer" : "bg-muted text-muted-foreground cursor-not-allowed"
                      }`}
                      data-testid={`button-buy-${p.organ}`}
                    >
                      {checkingOut === price?.id ? "Redirecting..." : price?.interval ? "Subscribe — $1/mo" : "Buy — $1"}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        <div className="rounded-xl border border-[#00FFD1]/20 bg-[#00FFD1]/5 p-6 mb-12">
          <h3 className="text-center text-xl font-black text-[#00FFD1] mb-6">THE $1 EVERYTHING MAP</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">#</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Revenue Organ</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">What You Get</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { n: 1, organ: "API Access", desc: "All 8 endpoints + 100K calls", price: "$1/mo" },
                  { n: 2, organ: "Datasets", desc: "All datasets (each)", price: "$1" },
                  { n: 3, organ: "Real-Time Stream", desc: "Full /api/stream SSE", price: "$1/mo" },
                  { n: 4, organ: "Automated Reports", desc: "Daily + Weekly + Monthly", price: "$1/mo" },
                  { n: 5, organ: "Intelligence Packs", desc: "Sector intelligence bundles", price: "$1" },
                  { n: 6, organ: "Enterprise License", desc: "Private API + unlimited", price: "$1/mo" },
                  { n: 7, organ: "White-Label", desc: "Widgets + branded API", price: "$1/mo" },
                ].map(r => (
                  <tr key={r.n} className="border-b border-border/30">
                    <td className="py-2.5 text-[#00FFD1] font-bold">{r.n}</td>
                    <td className="py-2.5 font-medium">{r.organ}</td>
                    <td className="py-2.5 text-muted-foreground">{r.desc}</td>
                    <td className="py-2.5 text-right font-black text-[#00FFD1]">{r.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div className="rounded-xl border border-border bg-card/20 p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Key className="w-4 h-4 text-[#00FFD1]" /> Check API Key Status</h3>
            <div className="flex gap-2">
              <input type="text" value={lookupKey} onChange={e => setLookupKey(e.target.value)} placeholder="pulse_xxxx..." className="flex-1 bg-black/30 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#00FFD1]/50" data-testid="input-lookup-key" />
              <button onClick={lookupApiKey} className="bg-[#00FFD1] text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#00FFD1]/80" data-testid="button-lookup-key">Check</button>
            </div>
            {keyStatus && (
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Tier</span><span className="font-mono capitalize" data-testid="text-key-tier">{keyStatus.tier}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Calls Used</span><span className="font-mono" data-testid="text-key-usage">{keyStatus.callsUsed?.toLocaleString()} / {keyStatus.callsLimit?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={keyStatus.isActive ? "text-emerald-400" : "text-red-400"} data-testid="text-key-status">{keyStatus.isActive ? "Active" : "Inactive"}</span></div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/20 p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-violet-400" /> API Endpoints</h3>
            <div className="space-y-2">
              {[
                { path: "/api/news", desc: "Latest news from all domains" },
                { path: "/api/topics", desc: "Knowledge topics (907K+ entries)" },
                { path: "/api/articles", desc: "AI-written articles" },
                { path: "/api/gics", desc: "GICS industry data (11 sectors)" },
                { path: "/api/signals", desc: "AI equation proposals" },
                { path: "/api/hive", desc: "Hive memory (204K+ entries)" },
                { path: "/api/search?q=", desc: "Cross-domain search" },
                { path: "/api/stream", desc: "Real-time SSE stream" },
              ].map(ep => (
                <div key={ep.path} className="flex items-center justify-between text-xs">
                  <code className="text-[#00FFD1] font-mono">{ep.path}</code>
                  <span className="text-muted-foreground">{ep.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/20 p-6 mb-12">
          <h3 className="font-bold mb-4">Quick Start</h3>
          <pre className="bg-black/50 rounded-lg p-4 text-xs font-mono overflow-x-auto text-muted-foreground">
{`curl -H "X-API-Key: pulse_YOUR_KEY_HERE" \\
     https://myaigpt.online/api/news

# Response:
{
  "data": [{ "title": "...", "domain": "...", ... }],
  "total": 50,
  "engine": "Pulse Universe Intelligence"
}`}
          </pre>
        </div>

        <div className="text-center text-xs text-muted-foreground/50">
          Also available on <a href="https://rapidapi.com" target="_blank" rel="noopener noreferrer" className="text-[#00FFD1]/60 hover:text-[#00FFD1] inline-flex items-center gap-1">RapidAPI <ExternalLink className="w-3 h-3" /></a>
        </div>
      </div>
    </div>
  );
}
