import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, Check, Key, Copy, ExternalLink, Shield } from "lucide-react";
import { useLocation } from "wouter";

interface Product {
  id: string;
  name: string;
  description: string;
  tier: string;
  callsPerMonth: string;
  prices: { id: string; amount: number; currency: string; interval: string }[];
}

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

  const tierColors: Record<string, string> = {
    starter: "border-[#00FFD1]/30 bg-[#00FFD1]/5",
    pro: "border-violet-500/30 bg-violet-500/5",
    enterprise: "border-[#F5C518]/30 bg-[#F5C518]/5",
  };
  const tierAccent: Record<string, string> = { starter: "text-[#00FFD1]", pro: "text-violet-400", enterprise: "text-[#F5C518]" };

  const staticProducts: Product[] = [
    { id: "starter", name: "Starter", description: "1,000 API calls/month across all 8 endpoints", tier: "starter", callsPerMonth: "1000", prices: [] },
    { id: "pro", name: "Pro", description: "50,000 API calls/month. Priority access + streaming", tier: "pro", callsPerMonth: "50000", prices: [] },
    { id: "enterprise", name: "Enterprise", description: "Unlimited calls. Dedicated support + SLA", tier: "enterprise", callsPerMonth: "unlimited", prices: [] },
  ];
  const displayProducts = products.length > 0 ? products : staticProducts;
  const priceLabels: Record<string, string> = { starter: "$1/mo", pro: "$9.99/mo", enterprise: "$49.99/mo" };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        <button onClick={() => setLocation("/")} className="text-xs text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1.5 transition-colors" data-testid="link-back">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-black mb-3" data-testid="text-page-title">
            <span className="text-[#00FFD1]">$1</span> Intelligence Platform
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            8 production API endpoints powered by the Pulse Universe AI Civilization.
            News, Topics, Articles, GICS Industries, Signals, Hive Memory, Search, and Real-Time Streaming.
          </p>
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
            <p className="text-xs text-muted-foreground mt-2">Save this key — you'll need it for API requests. Include as <code className="text-emerald-400">X-API-Key</code> header.</p>
          </motion.div>
        )}

        <div className="mb-8 p-4 rounded-xl border border-border bg-card/20">
          <label className="text-sm font-medium mb-2 block">Your email (required for checkout)</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="w-full bg-black/30 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#00FFD1]/50" data-testid="input-email" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading plans...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {displayProducts.map(p => {
              const tier = p.tier || "starter";
              const price = p.prices?.[0];
              const priceLabel = price ? `$${price.amount}/${price.interval}` : priceLabels[tier] || "$1/mo";
              return (
                <motion.div key={p.id} whileHover={{ scale: 1.02 }} className={`rounded-xl border ${tierColors[tier] || "border-border"} p-6 flex flex-col`}>
                  <div className="mb-4">
                    <h3 className={`text-xl font-black ${tierAccent[tier] || ""}`} data-testid={`text-tier-${tier}`}>{p.name?.replace("Pulse Intelligence API — ", "")}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                  </div>
                  <div className="text-3xl font-black mb-1" data-testid={`text-price-${tier}`}>{priceLabel}</div>
                  <div className="text-xs text-muted-foreground mb-4">{p.callsPerMonth === "unlimited" ? "Unlimited calls" : `${Number(p.callsPerMonth).toLocaleString()} calls/month`}</div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {["All 8 API endpoints", "JSON responses", "99.9% uptime"].map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="w-3 h-3 text-emerald-400" /> {f}
                      </li>
                    ))}
                    {tier === "pro" && <li className="flex items-center gap-2 text-xs text-muted-foreground"><Check className="w-3 h-3 text-violet-400" /> Priority rate limits</li>}
                    {tier === "enterprise" && <><li className="flex items-center gap-2 text-xs text-muted-foreground"><Check className="w-3 h-3 text-[#F5C518]" /> Dedicated support</li><li className="flex items-center gap-2 text-xs text-muted-foreground"><Check className="w-3 h-3 text-[#F5C518]" /> SLA guarantee</li></>}
                  </ul>
                  <button
                    onClick={() => price ? handleCheckout(price.id) : null}
                    disabled={!email || !price || checkingOut === price?.id}
                    className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all ${
                      price && email
                        ? "bg-[#00FFD1] text-black hover:bg-[#00FFD1]/80 cursor-pointer"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                    data-testid={`button-subscribe-${tier}`}
                  >
                    {checkingOut === price?.id ? "Redirecting..." : !price ? "Coming Soon" : "Subscribe"}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

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
                <div className="flex justify-between"><span className="text-muted-foreground">Calls Used</span><span className="font-mono" data-testid="text-key-usage">{keyStatus.callsUsed.toLocaleString()} / {keyStatus.callsLimit.toLocaleString()}</span></div>
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

        <div className="rounded-xl border border-border bg-card/20 p-6">
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
      </div>
    </div>
  );
}
