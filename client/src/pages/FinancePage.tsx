import { useState, useEffect, useCallback, useRef } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Brain, Zap, Search, X, Building2, Bitcoin, BarChart3, Cpu, Shield, ChevronUp, ChevronDown } from "lucide-react";

// ── Symbol universes ────────────────────────────────────────────
const MARKET_SECTORS: Record<string, string[]> = {
  "Tech":        ["AAPL","MSFT","NVDA","GOOGL","META","TSLA","AMD","ADBE","CRM","ORCL","QCOM","INTC","AMZN"],
  "Finance":     ["JPM","BAC","WFC","GS","V","MA","AXP","C","MS","BLK"],
  "Healthcare":  ["LLY","UNH","JNJ","ABBV","MRK","TMO","ABT","DHR","PFE"],
  "Energy":      ["XOM","CVX","COP","SLB","EOG","MPC"],
  "Consumer":    ["WMT","HD","MCD","COST","NKE","SBUX","TGT","PG","KO","PEP"],
  "Industrial":  ["CAT","GE","HON","RTX","UPS","FDX","DE"],
  "Comm":        ["NFLX","DIS","T","VZ","CMCSA"],
};
const ALL_STOCKS = Object.values(MARKET_SECTORS).flat();
const CRYPTO_SYMBOLS = ["BTC-USD","ETH-USD","SOL-USD","BNB-USD","XRP-USD","ADA-USD","DOGE-USD","AVAX-USD","LINK-USD","LTC-USD","DOT-USD","MATIC-USD"];
const REALESTATE_SYMBOLS = ["VNQ","IYR","XLRE","AMT","PLD","EQIX","CCI","DLR","PSA","O","WELL","SPG","AVB","EQR"];
const INDEX_SYMBOLS = ["SPY","QQQ","DIA","IWM","VIX"];

type Quote = { symbol: string; price: string; change: string; name: string; currency: string; closes?: number[] };
type Sector = { symbol: string; name: string; price: string; change: number };
type Prediction = { question: string; probability: number; direction: string; category: string; timeframe: string; rationale: string };
type OracleData = { marketRegime: string; regimeConfidence: number; bullCase: any; bearCase: any; consensusSignal: string; intelligenceFeed: any[]; macroSnapshot: any };
type Tab = "markets" | "crypto" | "realestate" | "predictions" | "oracle";

// ── Sparkline SVG ───────────────────────────────────────────────
function Sparkline({ closes, positive, w = 80, h = 30 }: { closes: number[]; positive: boolean; w?: number; h?: number }) {
  if (!closes || closes.length < 2) return <div style={{ width: w, height: h }} />;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const pts = closes.map((v, i) => {
    const x = (i / (closes.length - 1)) * w;
    const y = h - ((v - min) / range) * h * 0.85 - h * 0.075;
    return `${x},${y}`;
  }).join(" ");
  const color = positive ? "#4ade80" : "#f87171";
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`url(#sg-${positive ? "g" : "r"})`} stroke="none" />
      <defs>
        <linearGradient id="sg-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="sg-r" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f87171" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Quote Card ──────────────────────────────────────────────────
function QuoteCard({ q, onSelect, selected }: { q: Quote; onSelect?: () => void; selected?: boolean }) {
  const chg = parseFloat(q.change);
  const up = chg > 0, down = chg < 0;
  const color = up ? "#4ade80" : down ? "#f87171" : "#94a3b8";
  return (
    <div
      onClick={onSelect}
      data-testid={`quote-${q.symbol}`}
      style={{
        borderRadius: 12, border: selected ? `1px solid ${color}40` : "1px solid rgba(255,255,255,0.07)",
        background: selected ? `${color}08` : "rgba(255,255,255,0.015)",
        padding: "10px 12px", cursor: onSelect ? "pointer" : "default",
        transition: "all 0.15s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 12, letterSpacing: "0.03em" }}>{q.symbol.replace("-USD","")}</span>
        <span style={{ color, fontWeight: 800, fontSize: 11, display: "flex", alignItems: "center", gap: 2 }}>
          {up ? <ChevronUp size={10} /> : down ? <ChevronDown size={10} /> : <Minus size={10} />}
          {up ? "+" : ""}{q.change}%
        </span>
      </div>
      <div style={{ color: "#fff", fontWeight: 900, fontSize: 15, marginBottom: 2 }}>
        {q.currency === "USD" || !q.currency ? "$" : ""}{q.price}
      </div>
      {q.closes && q.closes.length > 1 && <Sparkline closes={q.closes} positive={up || (!down)} />}
      <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{q.name}</div>
    </div>
  );
}

// ── Sector Bar ──────────────────────────────────────────────────
function SectorBar({ sectors }: { sectors: Sector[] }) {
  if (!sectors.length) return null;
  const sorted = [...sectors].sort((a, b) => b.change - a.change);
  const max = Math.max(...sorted.map(s => Math.abs(s.change)), 0.5);
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
      {sorted.map(s => {
        const pct = (Math.abs(s.change) / max) * 100;
        const up = s.change >= 0;
        const color = up ? "#4ade80" : "#f87171";
        return (
          <div key={s.symbol} data-testid={`sector-${s.symbol}`} style={{ flex: "1 1 80px", minWidth: 75, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "8px 10px", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, marginBottom: 3 }}>{s.name}</div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginBottom: 4 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.8s ease" }} />
            </div>
            <div style={{ color, fontWeight: 800, fontSize: 11 }}>{up ? "+" : ""}{s.change.toFixed(2)}%</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Probability Gauge ───────────────────────────────────────────
function ProbGauge({ pct, color }: { pct: number; color: string }) {
  const r = 20, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={52} height={52} style={{ flexShrink: 0 }}>
      <circle cx={26} cy={26} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
      <circle cx={26} cy={26} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x={26} y={30} textAnchor="middle" fontSize={10} fontWeight={900} fill={color}>{pct}%</text>
    </svg>
  );
}

// ── Prediction Card ─────────────────────────────────────────────
function PredictionCard({ p }: { p: Prediction }) {
  const color = p.probability >= 60 ? "#4ade80" : p.probability <= 40 ? "#f87171" : "#fbbf24";
  const catColors: Record<string, string> = { Macro: "#60a5fa", Stocks: "#a78bfa", Crypto: "#fbbf24", "Real Estate": "#34d399", Politics: "#f472b6", Tech: "#818cf8" };
  return (
    <div data-testid={`prediction-${p.question.slice(0,20).replace(/\s/g,"-")}`} style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
      <ProbGauge pct={p.probability} color={color} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: `${catColors[p.category] || "#94a3b8"}20`, color: catColors[p.category] || "#94a3b8" }}>{p.category}</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>{p.timeframe}</span>
        </div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, lineHeight: 1.4, marginBottom: 5 }}>{p.question}</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, lineHeight: 1.5 }}>{p.rationale}</div>
      </div>
    </div>
  );
}

// ── Command Palette ─────────────────────────────────────────────
function CommandPalette({ quotes, onClose, onNavigate }: { quotes: Quote[]; onClose: () => void; onNavigate: (sym: string) => void }) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const matches = q.length < 1 ? quotes.slice(0, 8) : quotes.filter(x => x.symbol.includes(q.toUpperCase()) || x.name?.toLowerCase().includes(q.toLowerCase())).slice(0, 10);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 560, borderRadius: 16, border: "1px solid rgba(255,255,255,0.15)", background: "#0a0014", boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Search size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Search ticker, company…"
            data-testid="command-palette-input"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 15, fontWeight: 600 }} />
          <button onClick={onClose} data-testid="command-palette-close"><X size={14} style={{ color: "rgba(255,255,255,0.3)" }} /></button>
        </div>
        <div style={{ maxHeight: 340, overflowY: "auto" }}>
          {matches.map(m => {
            const chg = parseFloat(m.change); const up = chg > 0;
            return (
              <div key={m.symbol} onClick={() => { onNavigate(m.symbol); onClose(); }} data-testid={`palette-result-${m.symbol}`}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 13, minWidth: 60 }}>{m.symbol.replace("-USD","")}</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, flex: 1 }}>{m.name}</span>
                <span style={{ color: up ? "#4ade80" : "#f87171", fontWeight: 700, fontSize: 12 }}>{up ? "+" : ""}{m.change}%</span>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>${m.price}</span>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "8px 16px", color: "rgba(255,255,255,0.15)", fontSize: 10 }}>⌘K · ESC to close</div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────
export default function FinancePage() {
  const [tab, setTab] = useState<Tab>("markets");
  const [indices, setIndices] = useState<Quote[]>([]);
  const [stocks, setStocks] = useState<Quote[]>([]);
  const [crypto, setCrypto] = useState<Quote[]>([]);
  const [realestate, setRealestate] = useState<Quote[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [oracle, setOracle] = useState<OracleData | null>(null);
  const [selectedSector, setSelectedSector] = useState("Tech");
  const [sortBy, setSortBy] = useState<"change" | "alpha">("change");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});

  const setLoad = (k: string, v: boolean) => setLoading(p => ({ ...p, [k]: v }));

  // Fetch batch quotes
  const fetchBatch = useCallback(async (syms: string[], setter: (d: Quote[]) => void, key: string) => {
    setLoad(key, true);
    try {
      const data: Quote[] = await fetch(`/api/finance/batch?symbols=${syms.join(",")}`).then(r => r.json()).catch(() => []);
      setter(data);
    } finally { setLoad(key, false); }
  }, []);

  // Fetch sparklines for visible symbols
  const fetchSparklines = useCallback(async (syms: string[]) => {
    const missing = syms.filter(s => !sparklines[s]);
    if (!missing.length) return;
    await Promise.all(missing.slice(0, 12).map(async sym => {
      try {
        const d = await fetch(`/api/finance/chart/${sym}`).then(r => r.json()).catch(() => null);
        if (d?.closes?.length > 1) setSparklines(p => ({ ...p, [sym]: d.closes }));
      } catch {}
    }));
  }, [sparklines]);

  // Fetch sectors
  const fetchSectors = useCallback(async () => {
    setLoad("sectors", true);
    try { setSectors(await fetch("/api/finance/sectors").then(r => r.json()).catch(() => [])); }
    finally { setLoad("sectors", false); }
  }, []);

  // Fetch predictions
  const fetchPredictions = useCallback(async () => {
    setLoad("predictions", true);
    try {
      const d = await fetch("/api/finance/predictions").then(r => r.json()).catch(() => ({ predictions: [] }));
      setPredictions(d.predictions || []);
    } finally { setLoad("predictions", false); }
  }, []);

  // Fetch oracle
  const fetchOracle = useCallback(async () => {
    setLoad("oracle", true);
    try {
      const d = await fetch("/api/finance/oracle").then(r => r.json()).catch(() => null);
      if (d && d.marketRegime) setOracle(d);
    } finally { setLoad("oracle", false); }
  }, []);

  // Initial loads
  useEffect(() => {
    fetchBatch(INDEX_SYMBOLS, setIndices, "indices");
    fetchBatch(ALL_STOCKS, setStocks, "stocks");
    fetchBatch(CRYPTO_SYMBOLS, setCrypto, "crypto");
    fetchBatch(REALESTATE_SYMBOLS, setRealestate, "realestate");
    fetchSectors();
    setLastUpdate(new Date());
    const id = setInterval(() => {
      fetchBatch(INDEX_SYMBOLS, setIndices, "indices");
      setLastUpdate(new Date());
    }, 60000);
    return () => clearInterval(id);
  }, []);

  // Lazy load tab data
  useEffect(() => {
    if (tab === "predictions" && !predictions.length) fetchPredictions();
    if (tab === "oracle" && !oracle) fetchOracle();
  }, [tab]);

  // Sparklines on tab/sector change
  useEffect(() => {
    const syms = tab === "markets" ? (MARKET_SECTORS[selectedSector] || [])
      : tab === "crypto" ? CRYPTO_SYMBOLS
      : tab === "realestate" ? REALESTATE_SYMBOLS : [];
    if (syms.length) fetchSparklines(syms);
  }, [tab, selectedSector]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setPaletteOpen(p => !p); } if (e.key === "Escape") setPaletteOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Attach sparklines to quotes
  const withSparklines = (quotes: Quote[]) => quotes.map(q => ({ ...q, closes: sparklines[q.symbol] }));

  // Sorted stock list for current sector
  const sectorStocks = () => {
    const syms = MARKET_SECTORS[selectedSector] || [];
    const filtered = withSparklines(stocks.filter(s => syms.includes(s.symbol)));
    return [...filtered].sort((a, b) => {
      if (sortBy === "alpha") return sortDir * a.symbol.localeCompare(b.symbol);
      return sortDir * (parseFloat(a.change) - parseFloat(b.change));
    });
  };

  const regimeColor: Record<string, string> = { "Risk-On": "#4ade80", "Risk-Off": "#f87171", "Neutral": "#94a3b8", "Volatile": "#fbbf24" };
  const signalColor: Record<string, string> = { "Strongly Bullish": "#4ade80", "Cautiously Bullish": "#86efac", "Neutral": "#94a3b8", "Cautiously Bearish": "#fca5a5", "Strongly Bearish": "#f87171" };

  const tabs = [
    { id: "markets" as Tab, label: "Markets", icon: <BarChart3 size={12} /> },
    { id: "crypto" as Tab, label: "Crypto", icon: <Bitcoin size={12} /> },
    { id: "realestate" as Tab, label: "Real Estate", icon: <Building2 size={12} /> },
    { id: "predictions" as Tab, label: "Predictions", icon: <Zap size={12} /> },
    { id: "oracle" as Tab, label: "Oracle", icon: <Brain size={12} /> },
  ];

  const allQuotes = [...indices, ...stocks, ...crypto, ...realestate];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#02000f,#05000f)", overflow: "hidden", minHeight: 0 }}>
      {paletteOpen && <CommandPalette quotes={allQuotes} onClose={() => setPaletteOpen(false)} onNavigate={sym => { /* jump to quote */ }} />}

      {/* ── Header ── */}
      <div style={{ padding: "14px 20px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 20, margin: 0, letterSpacing: "-0.02em" }}>Quantum Finance Oracle</h1>
              {oracle && <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: `${regimeColor[oracle.marketRegime] || "#94a3b8"}20`, color: regimeColor[oracle.marketRegime] || "#94a3b8" }}>{oracle.marketRegime}</span>}
            </div>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, margin: 0 }}>Fortune 500 · Crypto · Real Estate · Prediction Markets · AI Oracle</p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setPaletteOpen(true)} data-testid="button-command-palette"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: "pointer" }}>
              <Search size={11} /> Search <kbd style={{ fontSize: 9, opacity: 0.5, marginLeft: 2 }}>⌘K</kbd>
            </button>
            <button onClick={() => { fetchBatch(INDEX_SYMBOLS, setIndices, "indices"); fetchSectors(); setLastUpdate(new Date()); }}
              data-testid="button-refresh"
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 11px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer" }}>
              <RefreshCw size={10} className={loading.indices ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ── Indices Ticker ── */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
          {indices.map(q => {
            const chg = parseFloat(q.change); const up = chg > 0; const down = chg < 0;
            const color = up ? "#4ade80" : down ? "#f87171" : "#94a3b8";
            return (
              <div key={q.symbol} data-testid={`index-${q.symbol}`} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", flexShrink: 0, whiteSpace: "nowrap" }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700 }}>{q.symbol}</span>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 12 }}>${q.price}</span>
                <span style={{ color, fontWeight: 700, fontSize: 10 }}>{up ? "+" : ""}{q.change}%</span>
              </div>
            );
          })}
          {lastUpdate && <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 9, alignSelf: "center", flexShrink: 0 }}>↻ {lastUpdate.toLocaleTimeString()}</span>}
        </div>

        {/* ── Tab Bar ── */}
        <div style={{ display: "flex", gap: 2, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", fontSize: 11, fontWeight: 700, border: "none", background: "none", cursor: "pointer", borderBottom: `2px solid ${tab === t.id ? "#7c3aed" : "transparent"}`, color: tab === t.id ? "#a78bfa" : "rgba(255,255,255,0.35)", transition: "all 0.15s", marginBottom: -1 }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 24px", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>

        {/* MARKETS */}
        {tab === "markets" && (
          <div>
            <SectorBar sectors={sectors} />
            {/* Sector nav */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, scrollbarWidth: "none" }}>
              {Object.keys(MARKET_SECTORS).map(s => (
                <button key={s} onClick={() => setSelectedSector(s)} data-testid={`sector-nav-${s}`}
                  style={{ padding: "5px 12px", borderRadius: 999, border: `1px solid ${selectedSector === s ? "#7c3aed" : "rgba(255,255,255,0.08)"}`, background: selectedSector === s ? "#7c3aed20" : "rgba(255,255,255,0.02)", color: selectedSector === s ? "#a78bfa" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>
                  {s}
                </button>
              ))}
              {/* Sort controls */}
              <div style={{ marginLeft: "auto", display: "flex", gap: 4, flexShrink: 0 }}>
                {[["change", "% Change"], ["alpha", "A-Z"]].map(([k, label]) => (
                  <button key={k} onClick={() => { if (sortBy === k) setSortDir(d => d === 1 ? -1 : 1); else { setSortBy(k as any); setSortDir(-1); } }}
                    data-testid={`sort-${k}`}
                    style={{ padding: "5px 10px", borderRadius: 999, border: `1px solid ${sortBy === k ? "#7c3aed" : "rgba(255,255,255,0.06)"}`, background: sortBy === k ? "#7c3aed15" : "none", color: sortBy === k ? "#a78bfa" : "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                    {label} {sortBy === k && (sortDir === -1 ? "↓" : "↑")}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(135px, 1fr))", gap: 8 }}>
              {sectorStocks().map(q => <QuoteCard key={q.symbol} q={q} />)}
              {loading.stocks && stocks.length === 0 && Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)", height: 90, animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          </div>
        )}

        {/* CRYPTO */}
        {tab === "crypto" && (
          <div>
            <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
              {/* BTC + ETH big cards */}
              {withSparklines(crypto.filter(q => ["BTC-USD","ETH-USD"].includes(q.symbol))).map(q => {
                const chg = parseFloat(q.change); const up = chg > 0;
                const color = up ? "#4ade80" : "#f87171";
                return (
                  <div key={q.symbol} data-testid={`crypto-hero-${q.symbol}`} style={{ borderRadius: 14, border: `1px solid ${color}25`, background: `${color}06`, padding: "18px 20px", display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>{q.symbol.replace("-USD","")}</span>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{q.name}</span>
                      </div>
                      <div style={{ color: "#fff", fontWeight: 900, fontSize: 28 }}>${parseFloat(q.price).toLocaleString()}</div>
                      <div style={{ color, fontWeight: 800, fontSize: 14, marginTop: 2 }}>{up ? "+" : ""}{q.change}% today</div>
                    </div>
                    {q.closes && <Sparkline closes={q.closes} positive={up} w={160} h={50} />}
                  </div>
                );
              })}
            </div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>ALTCOINS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
              {withSparklines(crypto.filter(q => !["BTC-USD","ETH-USD"].includes(q.symbol))).map(q => <QuoteCard key={q.symbol} q={q} />)}
            </div>
          </div>
        )}

        {/* REAL ESTATE */}
        {tab === "realestate" && (
          <div>
            <div style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: 12, padding: "12px 16px", marginBottom: 18, display: "flex", gap: 12, alignItems: "center" }}>
              <Building2 size={18} style={{ color: "#34d399", flexShrink: 0 }} />
              <div>
                <div style={{ color: "#34d399", fontWeight: 800, fontSize: 13, marginBottom: 2 }}>Real Estate Intelligence</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>REITs, real estate ETFs, and property market indices tracked by the Oracle. Includes commercial, residential, and industrial real estate.</div>
              </div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>ETFs & INDICES</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, marginBottom: 18 }}>
              {withSparklines(realestate.filter(q => ["VNQ","IYR","XLRE"].includes(q.symbol))).map(q => <QuoteCard key={q.symbol} q={q} />)}
            </div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>TOP REITs</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
              {withSparklines(realestate.filter(q => !["VNQ","IYR","XLRE"].includes(q.symbol))).map(q => <QuoteCard key={q.symbol} q={q} />)}
            </div>
          </div>
        )}

        {/* PREDICTIONS */}
        {tab === "predictions" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 15, marginBottom: 2 }}>AI Prediction Markets</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>Oracle-estimated probability on key macro, market, and crypto events</div>
              </div>
              <button onClick={fetchPredictions} data-testid="button-refresh-predictions"
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer" }}>
                <RefreshCw size={10} className={loading.predictions ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
            {loading.predictions && !predictions.length && (
              <div style={{ display: "flex", gap: 10, padding: "40px 0", justifyContent: "center", alignItems: "center", color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
                <Zap size={14} style={{ animation: "pulse 1s infinite" }} /> Oracle is calculating probabilities...
              </div>
            )}
            <div style={{ display: "grid", gap: 10 }}>
              {predictions.map((p, i) => <PredictionCard key={i} p={p} />)}
            </div>
          </div>
        )}

        {/* ORACLE */}
        {tab === "oracle" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>Multi-Agent Oracle Intelligence</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>Bull vs Bear debate + real-time market intelligence feed</div>
              </div>
              <button onClick={fetchOracle} data-testid="button-refresh-oracle"
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer" }}>
                <RefreshCw size={10} className={loading.oracle ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
            {loading.oracle && !oracle && (
              <div style={{ padding: "50px 0", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 12 }}>
                <Brain size={20} style={{ margin: "0 auto 8px", display: "block", opacity: 0.3 }} />
                Oracle agents are debating the markets...
              </div>
            )}
            {oracle && (
              <div>
                {/* Regime + Signal */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "14px 16px" }}>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>MARKET REGIME</div>
                    <div style={{ color: regimeColor[oracle.marketRegime] || "#94a3b8", fontWeight: 900, fontSize: 18 }}>{oracle.marketRegime}</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 2 }}>Confidence: {oracle.regimeConfidence}%</div>
                  </div>
                  <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "14px 16px" }}>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>CONSENSUS SIGNAL</div>
                    <div style={{ color: signalColor[oracle.consensusSignal] || "#94a3b8", fontWeight: 900, fontSize: 15 }}>{oracle.consensusSignal}</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 2 }}>Hive agreement</div>
                  </div>
                </div>

                {/* Bull vs Bear */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  {[
                    { data: oracle.bullCase, color: "#4ade80", label: "BULL CASE", icon: <TrendingUp size={12} /> },
                    { data: oracle.bearCase, color: "#f87171", label: "BEAR CASE", icon: <TrendingDown size={12} /> },
                  ].map(({ data, color, label, icon }) => data && (
                    <div key={label} style={{ borderRadius: 12, border: `1px solid ${color}25`, background: `${color}05`, padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <span style={{ color, display: "flex", alignItems: "center" }}>{icon}</span>
                        <span style={{ color, fontSize: 9, fontWeight: 800, letterSpacing: "0.1em" }}>{label}</span>
                        <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.3)", fontSize: 9 }}>{data.confidence}% conf.</span>
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 700, marginBottom: 4 }}>{data.agent}</div>
                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, lineHeight: 1.6 }}>{data.verdict}</div>
                      <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                        {data.topPick && <span>Top pick: <span style={{ color }}>{data.topPick}</span></span>}
                        {data.topRisk && <span>Top risk: <span style={{ color }}>{data.topRisk}</span></span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Macro snapshot */}
                {oracle.macroSnapshot && (
                  <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", padding: "12px 16px", marginBottom: 14 }}>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>MACRO SNAPSHOT</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                      {Object.entries(oracle.macroSnapshot).map(([k, v]) => (
                        <div key={k}>
                          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{String(v)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Intelligence Feed */}
                {oracle.intelligenceFeed?.length > 0 && (
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>INTELLIGENCE FEED</div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {oracle.intelligenceFeed.map((item: any, i: number) => {
                        const sentColor: Record<string, string> = { Bullish: "#4ade80", Bearish: "#f87171", Neutral: "#94a3b8" };
                        const impColor: Record<string, string> = { High: "#f87171", Medium: "#fbbf24", Low: "#94a3b8" };
                        return (
                          <div key={i} data-testid={`feed-item-${i}`} style={{ display: "flex", gap: 12, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)", alignItems: "flex-start" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3, flexShrink: 0, alignItems: "center", paddingTop: 2 }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: sentColor[item.sentiment] || "#94a3b8", display: "block" }} />
                              <span style={{ fontSize: 8, color: impColor[item.impact] || "#94a3b8", fontWeight: 700 }}>{item.impact}</span>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, lineHeight: 1.5, marginBottom: 4 }}>{item.headline}</div>
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                {(item.assets || []).map((a: string) => (
                                  <span key={a} style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}>{a}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}
