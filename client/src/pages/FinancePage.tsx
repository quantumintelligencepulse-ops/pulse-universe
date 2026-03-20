import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Brain, Zap } from "lucide-react";

const SENTIMENT_COLOR: Record<string, string> = { Bullish: "#4ade80", Bearish: "#f87171", Neutral: "#94a3b8" };
const CATEGORY_COLOR: Record<string, string> = { Macro: "#60a5fa", Tech: "#a78bfa", Crypto: "#fbbf24", WildCard: "#f472b6" };

const WATCHLIST = ["AAPL","GOOGL","MSFT","NVDA","TSLA","META","AMZN","SPY","QQQ","BTC-USD","ETH-USD"];

export default function FinancePage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchQuotes = async () => {
    setQuotesLoading(true);
    const data = await fetch("/api/finance/quotes").then(r => r.json()).catch(() => []);
    setQuotes(data);
    setLastUpdate(new Date());
    setQuotesLoading(false);
  };
  const fetchInsights = async () => {
    setInsightsLoading(true);
    const data = await fetch("/api/finance/insights").then(r => r.json()).catch(() => ({ insights: [] }));
    setInsights(data.insights || []);
    setInsightsLoading(false);
  };

  useEffect(() => {
    fetchQuotes();
    fetchInsights();
    const id = setInterval(fetchQuotes, 60000);
    return () => clearInterval(id);
  }, []);

  const stocks = quotes.filter(q => !q.symbol.includes("BTC") && !q.symbol.includes("ETH") && !["SPY","QQQ"].includes(q.symbol));
  const indices = quotes.filter(q => ["SPY","QQQ"].includes(q.symbol));
  const crypto = quotes.filter(q => q.symbol.includes("BTC") || q.symbol.includes("ETH"));

  const QuoteCard = ({ q }: { q: any }) => {
    const change = parseFloat(q.change);
    const isUp = change > 0;
    const isDown = change < 0;
    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3" data-testid={`quote-${q.symbol}`}>
        <div className="flex items-start justify-between mb-1">
          <span className="text-white font-black text-sm">{q.symbol}</span>
          <span className={`flex items-center gap-0.5 text-xs font-bold ${isUp ? "text-emerald-400" : isDown ? "text-red-400" : "text-white/40"}`}>
            {isUp ? <TrendingUp size={11} /> : isDown ? <TrendingDown size={11} /> : <Minus size={11} />}
            {isUp ? "+" : ""}{q.change}%
          </span>
        </div>
        <div className="text-white/80 text-lg font-black">${q.price}</div>
        <div className="text-white/25 text-[10px] truncate">{q.name}</div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-0.5">Quantum Finance Oracle</h1>
            <p className="text-white/30 text-sm">Real-time markets + AI-generated intelligence</p>
          </div>
          <button onClick={fetchQuotes} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-white text-xs transition-all">
            <RefreshCw size={11} className={quotesLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {indices.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            {indices.map(q => <QuoteCard key={q.symbol} q={q} />)}
          </div>
        )}

        {crypto.length > 0 && (
          <div className="mb-5">
            <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Crypto</div>
            <div className="grid grid-cols-2 gap-3">
              {crypto.map(q => <QuoteCard key={q.symbol} q={q} />)}
            </div>
          </div>
        )}

        {stocks.length > 0 && (
          <div className="mb-6">
            <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Tech & Growth Stocks</div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {stocks.map(q => <QuoteCard key={q.symbol} q={q} />)}
            </div>
          </div>
        )}

        {quotesLoading && quotes.length === 0 && (
          <div className="text-center py-10 text-white/20 text-sm">Fetching live market data...</div>
        )}

        <div className="rounded-2xl border border-blue-500/20 bg-blue-950/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={14} className="text-blue-400" />
            <span className="text-white font-black text-sm">Oracle Intelligence</span>
            <span className="ml-auto text-white/20 text-[10px]">AI-generated insights</span>
            {insightsLoading && <RefreshCw size={10} className="text-white/20 animate-spin" />}
            {!insightsLoading && (
              <button onClick={fetchInsights} className="text-white/20 hover:text-white/50 transition-colors">
                <Zap size={11} />
              </button>
            )}
          </div>
          {insights.length === 0 && insightsLoading && (
            <div className="text-white/20 text-sm py-4 text-center">Oracle is analyzing the markets...</div>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {insights.map((ins: any, i: number) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ color: CATEGORY_COLOR[ins.category] || "#94a3b8", background: `${CATEGORY_COLOR[ins.category] || "#94a3b8"}20` }}>{ins.category}</span>
                  <span className="text-[10px] font-bold ml-auto" style={{ color: SENTIMENT_COLOR[ins.sentiment] || "#94a3b8" }}>{ins.sentiment}</span>
                </div>
                <div className="text-white/90 font-bold text-sm mb-1">{ins.title}</div>
                <div className="text-white/50 text-xs leading-relaxed">{ins.body}</div>
              </div>
            ))}
          </div>
        </div>

        {lastUpdate && (
          <div className="text-center text-white/15 text-[10px] mt-4">
            Last updated: {lastUpdate.toLocaleTimeString()} · Powered by Yahoo Finance · AI by Quantum Hive
          </div>
        )}
      </div>
    </div>
  );
}
