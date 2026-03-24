import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, CrosshairMode, LineStyle, ColorType } from "lightweight-charts";
import { RefreshCw, Brain, Zap, Search, X, Bitcoin, BarChart3, ChevronUp, ChevronDown, Globe, Flame, Layers, DollarSign, Gauge, CandlestickChart, LineChart, FlaskConical, BookOpen, Activity, Dna, Star, Bell, Settings } from "lucide-react";

// ── Symbol universes ────────────────────────────────────────────
const MARKET_SECTORS: Record<string, string[]> = {
  "Tech":       ["AAPL","MSFT","NVDA","GOOGL","META","TSLA","AMD","ADBE","CRM","ORCL","QCOM","INTC","AMZN"],
  "Finance":    ["JPM","BAC","WFC","GS","V","MA","AXP","C","MS","BLK","SCHW","PGR","CB"],
  "Healthcare": ["LLY","UNH","JNJ","ABBV","MRK","TMO","ABT","DHR","PFE","CVS","BMY","ISRG"],
  "Energy":     ["XOM","CVX","COP","SLB","EOG","MPC","VLO","PSX","OXY","KMI"],
  "Consumer":   ["WMT","HD","MCD","COST","NKE","SBUX","TGT","PG","KO","PEP","LOW","TJX"],
  "Industrial": ["CAT","GE","HON","RTX","UPS","FDX","DE","LMT","NOC","GD","EMR","ETN"],
  "Comm/Media": ["NFLX","DIS","T","VZ","CMCSA","SNAP","UBER","PINS","SPOT","WBD"],
  "Materials":  ["LIN","APD","ECL","SHW","NEM","FCX","NUE","VMC","MLM","CF"],
  "Utilities":  ["NEE","DUK","SO","AEP","EXC","XEL","SRE","D","ED"],
};
const ALL_STOCKS = Object.values(MARKET_SECTORS).flat();
const CRYPTO_SYMBOLS = ["BTC-USD","ETH-USD","SOL-USD","BNB-USD","XRP-USD","ADA-USD","DOGE-USD","AVAX-USD","LINK-USD","LTC-USD","DOT-USD","MATIC-USD"];
const REALESTATE_SYMBOLS = ["VNQ","IYR","XLRE","AMT","PLD","EQIX","CCI","DLR","PSA","O","WELL","SPG","AVB","EQR","INVH","MAA"];
const INDEX_SYMBOLS = ["SPY","QQQ","DIA","IWM","^VIX"];
const NASDAQ_SET = new Set(["AAPL","MSFT","NVDA","GOOGL","META","TSLA","AMD","ADBE","CRM","ORCL","QCOM","AMZN","INTC","NFLX","CMCSA","COST","SBUX","ISRG","LULU","PANW"]);
const ETF_SET = new Set(["SPY","QQQ","DIA","IWM","VNQ","IYR","XLRE","XLK","XLF","XLV","XLE","XLI","XLC","XLY","XLP","XLB","XLU"]);

type Quote = { symbol: string; price: string; change: string; name: string; currency?: string; closes?: number[] };
type Sector = { symbol: string; name: string; price: string; change: number };
type ForexPair = { symbol: string; base: string; quote: string; name: string; price: string; change: string };
type Commodity = { symbol: string; name: string; unit: string; category: string; price: string; change: string };
type Bond = { symbol: string; name: string; maturity: string; type: string; price: string; change: string };
type GlobalIndex = { symbol: string; name: string; country: string; region: string; price: string; change: string };
type CryptoTop = { id: string; symbol: string; name: string; image: string; price: number; change24h: string; change7d: string; marketCap: number; rank: number; volume: number; ath: number; athChange: string };
type DefiToken = { id: string; symbol: string; name: string; price: number; change24h: string; marketCap: number; rank: number };
type FearGreed = { value: string; value_classification: string; timestamp: string };
type Prediction = { question: string; probability: number; direction: string; category: string; timeframe: string; rationale: string };
type OracleData = { marketRegime: string; regimeConfidence: number; bullCase: any; bearCase: any; consensusSignal: string; intelligenceFeed: any[]; macroSnapshot: any };
type ChartTF = "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y";
type ChartMode = "candle" | "line";
type WatchFilter = "STOCKS" | "CRYPTO" | "ETF" | "INDICES";

function fmtVol(v: number) {
  if (!v) return "—";
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
}
function fmtMcap(v: number) {
  if (!v) return "N/A";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v}`;
}
function getExchange(sym: string) {
  if (sym.endsWith("-USD") || sym.endsWith("=X")) return "CRYPTO";
  if (sym.startsWith("^")) return "INDEX";
  if (ETF_SET.has(sym)) return "ETF";
  if (NASDAQ_SET.has(sym)) return "NASDAQ";
  return "NYSE";
}
function computeSMA(ohlcv: any[], period: number) {
  const closes = ohlcv.map(d => d.close);
  const result = [];
  for (let i = period - 1; i < ohlcv.length; i++) {
    const avg = closes.slice(i - period + 1, i + 1).reduce((a: number, b: number) => a + b, 0) / period;
    result.push({ time: ohlcv[i].time, value: parseFloat(avg.toFixed(4)) });
  }
  return result;
}
function computeEMA(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) ema.push(values[i] * k + ema[i - 1] * (1 - k));
  return ema;
}
function computeRSI(ohlcv: any[], period = 14): { time: any; value: number }[] {
  if (ohlcv.length < period + 1) return [];
  const closes = ohlcv.map((d: any) => d.close);
  const result: { time: any; value: number }[] = [];
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) avgGain += d; else avgLoss -= d;
  }
  avgGain /= period; avgLoss /= period;
  for (let i = period; i < closes.length; i++) {
    if (i > period) {
      const d = closes[i] - closes[i - 1];
      avgGain = (avgGain * (period - 1) + Math.max(0, d)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.max(0, -d)) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push({ time: ohlcv[i].time, value: parseFloat((100 - 100 / (1 + rs)).toFixed(2)) });
  }
  return result;
}
function computeMACD(ohlcv: any[], fast = 12, slow = 26, signal = 9): { time: any; macd: number; sig: number; hist: number }[] {
  if (ohlcv.length < slow + signal) return [];
  const closes = ohlcv.map((d: any) => d.close);
  const emaFast = computeEMA(closes, fast);
  const emaSlow = computeEMA(closes, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = computeEMA(macdLine.slice(slow - 1), signal);
  const result: { time: any; macd: number; sig: number; hist: number }[] = [];
  for (let i = slow - 1 + signal - 1; i < closes.length; i++) {
    const si = i - (slow - 1) - (signal - 1);
    const m = macdLine[i], s = signalLine[si];
    result.push({ time: ohlcv[i].time, macd: parseFloat(m.toFixed(4)), sig: parseFloat(s.toFixed(4)), hist: parseFloat((m - s).toFixed(4)) });
  }
  return result;
}
function computeBB(ohlcv: any[], period = 20, mult = 2): { time: any; upper: number; lower: number; mid: number }[] {
  if (ohlcv.length < period) return [];
  return ohlcv.slice(period - 1).map((_: any, idx: number) => {
    const sl = ohlcv.slice(idx, idx + period).map((d: any) => d.close);
    const mid = sl.reduce((a: number, b: number) => a + b, 0) / period;
    const std = Math.sqrt(sl.reduce((a: number, b: number) => a + (b - mid) ** 2, 0) / period);
    return { time: ohlcv[idx + period - 1].time, upper: mid + mult * std, lower: mid - mult * std, mid };
  });
}

// ── Embedded Chart (inline, fills its container) ─────────────────
function EmbeddedChart({ symbol, name, orgSignal, onDataLoad }: { symbol: string; name?: string; orgSignal?: any; onDataLoad?: (d: any) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [tf, setTF] = useState<ChartTF>("3M");
  const [mode, setMode] = useState<ChartMode>("candle");
  const [indicators, setIndicators] = useState({ ma20: true, ma50: false, ma200: false, volume: true, bb: false, rsi: true, macd: true });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState<any>(null);
  const [rsiData, setRsiData] = useState<{ time: any; value: number }[]>([]);
  const [macdData, setMacdData] = useState<{ time: any; macd: number; sig: number; hist: number }[]>([]);
  const isCrypto = symbol.endsWith("-USD") || symbol.endsWith("=X");
  const chg = parseFloat(data?.change ?? "0");
  const up = chg > 0;

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`/api/finance/chart/${encodeURIComponent(symbol)}?tf=${tf}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); onDataLoad?.(d); })
      .catch(() => setLoading(false));
  }, [symbol, tf]);

  useEffect(() => {
    if (!data?.ohlcv?.length) return;
    const seenT = new Map<string, any>();
    for (const c of data.ohlcv) seenT.set(c.time, c);
    const clean = Array.from(seenT.values()).sort((a, b) => a.time < b.time ? -1 : 1);
    setRsiData(computeRSI(clean));
    setMacdData(computeMACD(clean));
  }, [data]);

  useEffect(() => {
    if (!data?.ohlcv?.length || !containerRef.current) return;
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const seenTimes = new Map<string, any>();
    for (const candle of data.ohlcv) seenTimes.set(candle.time, candle);
    const cleanOhlcv = Array.from(seenTimes.values()).sort((a, b) => a.time < b.time ? -1 : a.time > b.time ? 1 : 0);

    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: "#04000a" }, textColor: "rgba(255,255,255,0.45)", fontSize: 11 },
      grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { color: "rgba(124,58,237,0.5)", labelBackgroundColor: "#7c3aed" }, horzLine: { color: "rgba(124,58,237,0.5)", labelBackgroundColor: "#7c3aed" } },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
      timeScale: { borderColor: "rgba(255,255,255,0.06)", timeVisible: true, secondsVisible: false },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });
    chartRef.current = chart;

    if (mode === "candle") {
      const cs = chart.addSeries(CandlestickSeries, { upColor: "#4ade80", downColor: "#f87171", borderUpColor: "#4ade80", borderDownColor: "#f87171", wickUpColor: "#4ade80", wickDownColor: "#f87171" });
      cs.setData(cleanOhlcv.map((d: any) => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close })));
    } else {
      const ls = chart.addSeries(LineSeries, { color: up ? "#4ade80" : "#f87171", lineWidth: 2, lastValueVisible: true, priceLineVisible: true });
      ls.setData(cleanOhlcv.map((d: any) => ({ time: d.time, value: d.close })));
    }
    if (indicators.ma20 && cleanOhlcv.length >= 20) {
      const s = chart.addSeries(LineSeries, { color: "#fbbf24", lineWidth: 1 as any, title: "MA20", lastValueVisible: false, priceLineVisible: false });
      s.setData(computeSMA(cleanOhlcv, 20));
    }
    if (indicators.ma50 && cleanOhlcv.length >= 50) {
      const s = chart.addSeries(LineSeries, { color: "#60a5fa", lineWidth: 1 as any, title: "MA50", lastValueVisible: false, priceLineVisible: false });
      s.setData(computeSMA(cleanOhlcv, 50));
    }
    if (indicators.ma200 && cleanOhlcv.length >= 200) {
      const s = chart.addSeries(LineSeries, { color: "#f472b6", lineWidth: 1 as any, lineStyle: LineStyle.Dashed, title: "MA200", lastValueVisible: false, priceLineVisible: false });
      s.setData(computeSMA(cleanOhlcv, 200));
    }
    if (indicators.volume) {
      const vs = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "vol", lastValueVisible: false, priceLineVisible: false });
      vs.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      vs.setData(cleanOhlcv.map((d: any) => ({ time: d.time, value: d.volume, color: d.close >= d.open ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)" })));
    }
    if (indicators.bb && cleanOhlcv.length >= 20) {
      const bbData = computeBB(cleanOhlcv);
      const bbOpt = { lineWidth: 1 as any, lastValueVisible: false, priceLineVisible: false, priceScaleId: "right" };
      chart.addSeries(LineSeries, { ...bbOpt, color: "rgba(96,165,250,0.5)" }).setData(bbData.map((d: any) => ({ time: d.time, value: d.upper })));
      chart.addSeries(LineSeries, { ...bbOpt, color: "rgba(96,165,250,0.5)" }).setData(bbData.map((d: any) => ({ time: d.time, value: d.lower })));
      chart.addSeries(LineSeries, { ...bbOpt, color: "rgba(96,165,250,0.2)", lineStyle: LineStyle.Dashed }).setData(bbData.map((d: any) => ({ time: d.time, value: d.mid })));
    }
    chart.subscribeCrosshairMove((param: any) => {
      if (param.time) {
        const c = cleanOhlcv.find(d => d.time === param.time);
        if (c) setHovered(c);
      } else setHovered(null);
    });
    chart.timeScale().fitContent();
    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => { ro.disconnect(); };
  }, [data, mode, indicators]);

  useEffect(() => { return () => { if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; } }; }, []);

  const ohlcvVals = [
    { k: "O", v: (hovered?.open ?? data?.open)?.toFixed(2) },
    { k: "H", v: (hovered?.high ?? data?.high)?.toFixed(2) },
    { k: "L", v: (hovered?.low ?? data?.low)?.toFixed(2) },
    { k: "C", v: (hovered?.close ?? data?.price)?.toFixed(2) },
    { k: "Vol", v: fmtVol(hovered?.volume ?? data?.volume ?? 0) },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#04000a", overflow: "hidden", minHeight: 0 }}>
      {/* Symbol + OHLCV header */}
      <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 16, flexShrink: 0, background: "#030009" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 16, letterSpacing: "-0.01em" }}>{symbol.replace("-USD","").replace("=X","").replace("^","")}</span>
          <span style={{ color: up ? "#4ade80" : "#f87171", fontWeight: 800, fontSize: 13 }}>
            {isCrypto ? "" : "$"}{(hovered?.close ?? data?.price ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 2, color: up ? "#4ade80" : "#f87171", fontWeight: 700, fontSize: 11 }}>
            {up ? <ChevronUp size={11} /> : <ChevronDown size={11} />}{up ? "+" : ""}{chg.toFixed(2)}%
          </span>
        </div>
        <div style={{ display: "flex", gap: 14, marginLeft: 8 }}>
          {ohlcvVals.map(s => (
            <div key={s.k} style={{ display: "flex", gap: 4, alignItems: "baseline" }}>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700 }}>{s.k}</span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: 11 }}>{s.v ?? "—"}</span>
            </div>
          ))}
        </div>
        {loading && <div style={{ marginLeft: "auto", width: 14, height: 14, border: "2px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
      </div>

      {/* Controls: TF + chart type + indicators */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 2 }}>
          {(["1W","1M","3M","6M","1Y","5Y"] as ChartTF[]).map(t => (
            <button key={t} onClick={() => setTF(t)} data-testid={`tf-${t}`}
              style={{ padding: "3px 9px", fontSize: 10, fontWeight: 700, border: "none", borderRadius: 4, cursor: "pointer", background: tf === t ? "#7c3aed" : "rgba(255,255,255,0.05)", color: tf === t ? "#fff" : "rgba(255,255,255,0.55)" }}>
              {t}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)" }} />
        <div style={{ display: "flex", gap: 2 }}>
          <button onClick={() => setMode("candle")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", fontSize: 10, fontWeight: 700, border: "none", borderRadius: 4, cursor: "pointer", background: mode === "candle" ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.05)", color: mode === "candle" ? "#a78bfa" : "rgba(255,255,255,0.55)" }}><CandlestickChart size={11} /> Candle</button>
          <button onClick={() => setMode("line")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", fontSize: 10, fontWeight: 700, border: "none", borderRadius: 4, cursor: "pointer", background: mode === "line" ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.05)", color: mode === "line" ? "#a78bfa" : "rgba(255,255,255,0.55)" }}><LineChart size={11} /> Line</button>
        </div>
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)" }} />
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700 }}>INDICATORS</span>
        {([
          { key: "ma20",   label: "MA20",  color: "#fbbf24" },
          { key: "ma50",   label: "MA50",  color: "#60a5fa" },
          { key: "ma200",  label: "MA200", color: "#f472b6" },
          { key: "volume", label: "VOL",   color: "#a78bfa" },
          { key: "bb",     label: "BB",    color: "#60a5fa" },
          { key: "rsi",    label: "RSI",   color: "#4ade80" },
          { key: "macd",   label: "MACD",  color: "#f472b6" },
        ] as { key: keyof typeof indicators; label: string; color: string }[]).map(({ key, label, color }) => (
          <button key={key} onClick={() => setIndicators(p => ({ ...p, [key]: !p[key] }))} data-testid={`indicator-${key}`}
            style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${indicators[key] ? color + "55" : "rgba(255,255,255,0.08)"}`, background: indicators[key] ? color + "18" : "rgba(255,255,255,0.03)", color: indicators[key] ? color : "rgba(255,255,255,0.6)", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>
            {indicators[key] ? "✓ " : ""}{label}
          </button>
        ))}
      </div>

      {/* Main chart */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#04000a", zIndex: 2, gap: 10 }}>
            <div style={{ width: 28, height: 28, border: "2px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>Loading {symbol.replace("-USD","").replace("^","")} chart…</div>
          </div>
        )}
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </div>

      {/* RSI Sub-panel */}
      {indicators.rsi && rsiData.length > 0 && (() => {
        const vals = rsiData.map(d => d.value);
        const last = vals[vals.length - 1];
        const w = 860, h = 56;
        const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v / 100) * h * 0.9) - h * 0.05}`).join(" ");
        const rsiColor = last >= 70 ? "#f87171" : last <= 30 ? "#4ade80" : "#a78bfa";
        return (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "#030009", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 10px 0", alignItems: "center" }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.3)" }}>RSI (14)  Upper Band: 70  Lower Band: 30</span>
              <span style={{ fontSize: 9, fontWeight: 900, color: rsiColor }}>RSI: {last.toFixed(2)}</span>
            </div>
            <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block", height: h }}>
              <line x1="0" y1={h - h * 0.73} x2={w} y2={h - h * 0.73} stroke="rgba(248,113,113,0.2)" strokeDasharray="4,3" strokeWidth={1} />
              <line x1="0" y1={h - h * 0.23} x2={w} y2={h - h * 0.23} stroke="rgba(74,222,128,0.2)" strokeDasharray="4,3" strokeWidth={1} />
              <polyline points={pts} fill="none" stroke={rsiColor} strokeWidth={1.5} opacity={0.9} />
            </svg>
          </div>
        );
      })()}

      {/* MACD Sub-panel */}
      {indicators.macd && macdData.length > 0 && (() => {
        const hists = macdData.map(d => d.hist);
        const macds = macdData.map(d => d.macd);
        const sigs = macdData.map(d => d.sig);
        const allVals = [...hists, ...macds, ...sigs];
        const minV = Math.min(...allVals), maxV = Math.max(...allVals), rng = maxV - minV || 1;
        const hw = 860, hh = 56, zero = hh - ((0 - minV) / rng) * hh * 0.9 - hh * 0.05;
        const toY = (v: number) => hh - ((v - minV) / rng) * hh * 0.9 - hh * 0.05;
        const lastM = macds[macds.length - 1], lastH = hists[hists.length - 1], lastS = sigs[sigs.length - 1];
        return (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "#030009", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 12, padding: "3px 10px 0", alignItems: "center" }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.3)" }}>MACD (12,26,9)</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: "#60a5fa" }}>HistogramUp1: {lastM >= 0 ? lastM?.toFixed(3) : "—"}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: "#f472b6" }}>HistogramDown1: {lastH < 0 ? Math.abs(lastH).toFixed(3) : "—"}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: lastS >= 0 ? "#4ade80" : "#f87171", marginLeft: "auto" }}>{lastS?.toFixed(3)}</span>
            </div>
            <svg width="100%" viewBox={`0 0 ${hw} ${hh}`} preserveAspectRatio="none" style={{ display: "block", height: hh }}>
              <line x1="0" y1={zero} x2={hw} y2={zero} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              {hists.map((h, i) => {
                const barW = hw / hists.length;
                const x = i * barW, y0 = zero, y1 = toY(h), height = Math.abs(y0 - y1);
                return <rect key={i} x={x} y={Math.min(y0, y1)} width={Math.max(0.5, barW - 0.5)} height={Math.max(1, height)} fill={h >= 0 ? "rgba(74,222,128,0.6)" : "rgba(248,113,113,0.6)"} />;
              })}
              <polyline points={macds.map((v, i) => `${(i / (macds.length - 1)) * hw},${toY(v)}`).join(" ")} fill="none" stroke="#60a5fa" strokeWidth={1.5} />
              <polyline points={sigs.map((v, i) => `${(i / (sigs.length - 1)) * hw},${toY(v)}`).join(" ")} fill="none" stroke="#f87171" strokeWidth={1} />
            </svg>
          </div>
        );
      })()}

      {/* Sovereign Signal bar */}
      {orgSignal && (
        <div style={{ borderTop: "1px solid rgba(124,58,237,0.15)", background: "rgba(124,58,237,0.04)", padding: "5px 14px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ color: "#a78bfa", fontWeight: 900, fontSize: 9 }}>⭐ SOVEREIGN SIGNAL</span>
          <span style={{ fontSize: 8, fontWeight: 900, padding: "1px 7px", borderRadius: 4, background: (orgSignal.stance === "LONG" || orgSignal.stance === "HOLD-LONG") ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)", color: (orgSignal.stance?.includes("LONG")) ? "#4ade80" : "#f87171", border: `1px solid ${(orgSignal.stance?.includes("LONG")) ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}` }}>{orgSignal.stance}</span>
          {[["EDGE", `${(orgSignal.edge_final * 100)?.toFixed(1)}`],["CVX",`${orgSignal.conviction}%`],["RISK",`${(orgSignal.risk_live * 100)?.toFixed(1)}%`],["LOCK",`${(orgSignal.profit_lock * 100)?.toFixed(1)}%`],["SIZE f*",orgSignal.size_f?.toFixed(2)],["STOP",`$${orgSignal.stop_live?.toFixed(2)}`],["HORIZON",orgSignal.horizon]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", gap: 3 }}>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 7, fontWeight: 700 }}>{l}</span>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 8 }}>{v}</span>
            </div>
          ))}
          <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.45)", fontSize: 8 }}>{orgSignal.scientist_emoji} {orgSignal.scientist_role}</span>
        </div>
      )}

      {/* Bottom analysis tabs */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "#030009", display: "flex", gap: 0, flexShrink: 0, overflowX: "auto", scrollbarWidth: "none" }}>
        {["News","Company","Options","Bonds","Financials","Analysis","Press Rel.","Corporate","Brief"].map((t, i) => (
          <button key={t} style={{ padding: "6px 12px", fontSize: 9, fontWeight: 600, border: "none", borderTop: i === 8 ? "2px solid #7c3aed" : "2px solid transparent", background: "none", color: i === 8 ? "#a78bfa" : "rgba(255,255,255,0.45)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{t}</button>
        ))}
      </div>
    </div>
  );
}

// ── Sparkline ────────────────────────────────────────────────────
function Sparkline({ closes, positive, w = 60, h = 22 }: { closes: number[]; positive: boolean; w?: number; h?: number }) {
  if (!closes || closes.length < 2) return <div style={{ width: w, height: h }} />;
  const min = Math.min(...closes), max = Math.max(...closes), range = max - min || 1;
  const pts = closes.map((v, i) => `${(i / (closes.length - 1)) * w},${h - ((v - min) / range) * h * 0.85 - h * 0.075}`).join(" ");
  const color = positive ? "#4ade80" : "#f87171";
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
    </svg>
  );
}

// ── Command Palette ──────────────────────────────────────────────
function CommandPalette({ quotes, onClose, onOpen }: { quotes: Quote[]; onClose: () => void; onOpen: (sym: string, name: string) => void }) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const matches = q.length < 1 ? quotes.slice(0, 10) : quotes.filter(x => x.symbol.includes(q.toUpperCase()) || x.name?.toLowerCase().includes(q.toLowerCase())).slice(0, 12);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 520, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "#08000f", boxShadow: "0 32px 80px rgba(0,0,0,0.9)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Search size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
          <input ref={ref} value={q} onChange={e => setQ(e.target.value)} placeholder="Search ticker or company…" data-testid="command-input"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 14, fontWeight: 600 }} />
          <button onClick={onClose}><X size={13} style={{ color: "rgba(255,255,255,0.3)" }} /></button>
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          {matches.map(m => {
            const up = parseFloat(m.change) > 0;
            return (
              <div key={m.symbol} onClick={() => { onClose(); onOpen(m.symbol, m.name); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 16px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 12, minWidth: 60 }}>{m.symbol.replace("-USD","")}</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                <span style={{ color: up ? "#4ade80" : "#f87171", fontWeight: 700, fontSize: 11 }}>{up ? "+" : ""}{m.change}%</span>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 11, minWidth: 60, textAlign: "right" }}>{m.price}</span>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "7px 16px", color: "rgba(255,255,255,0.15)", fontSize: 9 }}>⌘K to toggle · Click to open · ESC to close</div>
      </div>
    </div>
  );
}

// ── Main Finance Page — Professional Trading Terminal ─────────────
export default function FinancePage() {
  const [indices, setIndices] = useState<Quote[]>([]);
  const [stocks, setStocks] = useState<Quote[]>([]);
  const [crypto, setCrypto] = useState<Quote[]>([]);
  const [cryptoTop, setCryptoTop] = useState<CryptoTop[]>([]);
  const [defi, setDefi] = useState<DefiToken[]>([]);
  const [realestate, setRealestate] = useState<Quote[]>([]);
  const [forex, setForex] = useState<ForexPair[]>([]);
  const [fearGreed, setFearGreed] = useState<FearGreed[]>([]);
  const [organism, setOrganism] = useState<any>(null);
  const [tradeLogs, setTradeLogs] = useState<any[]>([]);
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Terminal state
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [selectedName, setSelectedName] = useState("Apple Inc.");
  const [selectedChartData, setSelectedChartData] = useState<any>(null);
  const [pulseAIMode, setPulseAIMode] = useState(false);
  const [pulseAIActive, setPulseAIActive] = useState(false);
  const [watchFilter, setWatchFilter] = useState<WatchFilter>("STOCKS");
  const [watchSearch, setWatchSearch] = useState("");
  const [watchTab, setWatchTab] = useState<"watchlist"|"recently">("watchlist");
  const [recentSymbols, setRecentSymbols] = useState<{symbol: string; name: string}[]>([]);

  const orgSignalMap = useMemo<Record<string, any>>(() => {
    if (!organism?.topEdgeTrades) return {};
    const map: Record<string, any> = {};
    for (const t of organism.topEdgeTrades) {
      map[t.symbol] = t;
      map[t.symbol.replace("-USD","").replace("=X","").replace("^","")] = t;
    }
    return map;
  }, [organism]);

  const setLoad = (k: string, v: boolean) => setLoading(p => ({ ...p, [k]: v }));

  const fetchBatch = useCallback(async (syms: string[], setter: (d: Quote[]) => void, key: string) => {
    setLoad(key, true);
    try { setter(await fetch(`/api/finance/batch?symbols=${syms.join(",")}`).then(r => r.json()).catch(() => [])); }
    finally { setLoad(key, false); }
  }, []);

  const fetchSparklines = useCallback(async (syms: string[]) => {
    const missing = syms.filter(s => !sparklines[s]).slice(0, 8);
    if (!missing.length) return;
    await Promise.all(missing.map(async sym => {
      try {
        const d = await fetch(`/api/finance/chart/${sym}`).then(r => r.json()).catch(() => null);
        if (d?.closes?.length > 1) setSparklines(p => ({ ...p, [sym]: d.closes }));
      } catch {}
    }));
  }, [sparklines]);

  const fetchOrganism = useCallback(async () => {
    try { setOrganism(await fetch("/api/finance/organism").then(r => r.json()).catch(() => null)); }
    catch {}
  }, []);

  const fetchTradeLogs = useCallback(async () => {
    try { setTradeLogs(await fetch("/api/finance/trade-logs?limit=60").then(r => r.json()).catch(() => [])); }
    catch {}
  }, []);

  useEffect(() => {
    fetchBatch(INDEX_SYMBOLS, setIndices, "indices");
    fetchBatch(ALL_STOCKS, setStocks, "stocks");
    fetchBatch(CRYPTO_SYMBOLS, setCrypto, "crypto");
    fetchBatch(REALESTATE_SYMBOLS, setRealestate, "realestate");
    fetch("/api/finance/feargreed").then(r => r.json()).then(setFearGreed).catch(() => {});
    fetchOrganism();
    setLastUpdate(new Date());
    // Preload sparklines for most-watched stocks
    setTimeout(() => fetchSparklines([...INDEX_SYMBOLS, "AAPL","MSFT","NVDA","TSLA","GOOGL","META","AMZN","AMD","JPM","GS"]), 3000);
    const id = setInterval(() => { fetchBatch(INDEX_SYMBOLS, setIndices, "indices"); fetchOrganism(); setLastUpdate(new Date()); }, 60000);
    return () => clearInterval(id);
  }, []);

  const fetchCryptoTop = useCallback(async () => {
    try {
      const data: CryptoTop[] = await fetch(`/api/finance/crypto/top?page=1`).then(r => r.json()).catch(() => []);
      setCryptoTop(data);
    } catch {}
  }, []);

  useEffect(() => {
    if (watchFilter === "CRYPTO" && cryptoTop.length === 0) fetchCryptoTop();
  }, [watchFilter]);

  useEffect(() => {
    if (pulseAIActive) {
      fetchTradeLogs();
      const id = setInterval(fetchTradeLogs, 15000);
      return () => clearInterval(id);
    }
  }, [pulseAIActive]);

  useEffect(() => {
    if (pulseAIActive) {
      const id = setInterval(fetchOrganism, 10000);
      return () => clearInterval(id);
    }
  }, [pulseAIActive]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setPaletteOpen(p => !p); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const selectSymbol = useCallback((symbol: string, name: string) => {
    setSelectedSymbol(symbol);
    setSelectedName(name);
    setRecentSymbols(p => {
      const filtered = p.filter(r => r.symbol !== symbol);
      return [{ symbol, name }, ...filtered].slice(0, 20);
    });
  }, []);

  // Watchlist items based on filter
  const watchItems = useMemo((): Quote[] => {
    let items: Quote[] = [];
    if (watchFilter === "STOCKS") items = stocks;
    else if (watchFilter === "CRYPTO") items = [...crypto, ...cryptoTop.slice(0, 30).map(c => ({ symbol: `${c.symbol}-USD`, price: c.price.toFixed(4), change: c.change24h, name: c.name }))];
    else if (watchFilter === "ETF") items = [...indices, ...realestate];
    else if (watchFilter === "INDICES") items = indices;
    const search = watchSearch.toUpperCase();
    if (search) items = items.filter(q => q.symbol.includes(search) || q.name?.toLowerCase().includes(watchSearch.toLowerCase()));
    return items;
  }, [watchFilter, watchSearch, stocks, crypto, cryptoTop, indices, realestate]);

  const displayItems = watchTab === "recently" ? recentSymbols.map(r => {
    const all = [...indices, ...stocks, ...crypto, ...realestate];
    const q = all.find(x => x.symbol === r.symbol);
    return q || { symbol: r.symbol, price: "—", change: "0", name: r.name };
  }) : watchItems;

  // Current selected quote info
  const allQuotes = useMemo(() => [...indices, ...stocks, ...crypto, ...realestate], [indices, stocks, crypto, realestate]);
  const selectedQuote = allQuotes.find(q => q.symbol === selectedSymbol);
  const fgValue = fearGreed[0] ? parseInt(fearGreed[0].value) : null;

  // Stats computed from 1Y chart data loaded by EmbeddedChart
  const w52h = selectedChartData?.ohlcv ? Math.max(...selectedChartData.ohlcv.map((c: any) => c.high)).toFixed(2) : "—";
  const w52l = selectedChartData?.ohlcv ? Math.min(...selectedChartData.ohlcv.map((c: any) => c.low)).toFixed(2) : "—";
  const avgVol = selectedChartData?.ohlcv ? fmtVol(selectedChartData.ohlcv.reduce((a: number, c: any) => a + c.volume, 0) / selectedChartData.ohlcv.length) : "—";
  const priceRange = selectedChartData?.ohlcv && selectedChartData.high && selectedChartData.low
    ? (((selectedChartData.price - selectedChartData.low) / (selectedChartData.high - selectedChartData.low)) * 100).toFixed(2)
    : "—";

  const orgSignalSelected = orgSignalMap[selectedSymbol] ?? orgSignalMap[selectedSymbol?.replace("-USD","").replace("^","")];
  const selectedIsLong = orgSignalSelected?.stance === "LONG" || orgSignalSelected?.stance === "HOLD-LONG";
  const selectedIsShort = orgSignalSelected?.stance === "SHORT" || orgSignalSelected?.stance === "HOLD-SHORT";
  const exchange = getExchange(selectedSymbol);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#040008", overflow: "hidden", minHeight: 0 }}>
      {paletteOpen && <CommandPalette quotes={allQuotes} onClose={() => setPaletteOpen(false)} onOpen={(s, n) => { selectSymbol(s, n); setPaletteOpen(false); }} />}

      {/* ── Top status bar ── */}
      <div style={{ height: 36, display: "flex", alignItems: "center", padding: "0 12px", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#030009", flexShrink: 0, overflowX: "auto", scrollbarWidth: "none" }}>
        <span style={{ color: "#a78bfa", fontWeight: 900, fontSize: 11, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>SYNTHENTICA PRIMORDIA PULSE</span>
        <span style={{ fontSize: 7, fontWeight: 800, padding: "1px 5px", borderRadius: 3, background: "rgba(124,58,237,0.2)", color: "#c4b5fd", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>SOVEREIGN MARKET ORGANISM</span>
        {organism && (
          <>
            <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 6px", borderRadius: 3, background: organism.mood === "HUNTING" ? "rgba(74,222,128,0.12)" : "rgba(251,191,36,0.12)", color: organism.mood === "HUNTING" ? "#4ade80" : "#fbbf24", border: `1px solid rgba(255,255,255,0.06)` }}>{organism.mood}</span>
            <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 6px", borderRadius: 3, background: "rgba(255,255,255,0.04)", color: organism.regime === "RISK-ON" ? "#4ade80" : "#f87171", border: "1px solid rgba(255,255,255,0.06)" }}>{organism.regime}</span>
          </>
        )}
        {/* Index ticker strip */}
        <div style={{ display: "flex", gap: 10, marginLeft: 8, overflowX: "auto", scrollbarWidth: "none" }}>
          {indices.map(q => {
            const up = parseFloat(q.change) > 0;
            return (
              <div key={q.symbol} onClick={() => selectSymbol(q.symbol, q.name)} style={{ display: "flex", gap: 5, alignItems: "center", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: 700 }}>{q.symbol.replace("^","")}</span>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 10 }}>{q.price}</span>
                <span style={{ color: up ? "#4ade80" : "#f87171", fontWeight: 700, fontSize: 9 }}>{up ? "+" : ""}{q.change}%</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          {fgValue !== null && (
            <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "2px 7px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>F&G</span>
              <span style={{ fontSize: 10, fontWeight: 900, color: fgValue <= 25 ? "#f87171" : fgValue >= 60 ? "#4ade80" : "#fbbf24" }}>{fgValue}</span>
            </div>
          )}
          {organism && <span style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>{organism.activeScientists} scientists · {organism.totalTrades} trades</span>}
          <button onClick={() => setPaletteOpen(true)} data-testid="button-search" style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.5)", fontSize: 9, cursor: "pointer" }}>
            <Search size={9} /> ⌘K
          </button>
          <button onClick={() => { fetchBatch(INDEX_SYMBOLS, setIndices, "indices"); fetchBatch(ALL_STOCKS, setStocks, "stocks"); setLastUpdate(new Date()); }} style={{ padding: "3px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
            <RefreshCw size={9} className={loading.indices ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── 3-column terminal body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* ── LEFT: Watchlist Panel (230px) ── */}
        <div style={{ width: 230, borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", background: "#030009", overflow: "hidden", flexShrink: 0 }}>
          {/* Watchlist / Recently tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            {[["watchlist","Watchlists"],["recently","Recently"]].map(([id, label]) => (
              <button key={id} onClick={() => setWatchTab(id as any)}
                style={{ flex: 1, padding: "8px 0", fontSize: 10, fontWeight: 700, border: "none", borderBottom: `2px solid ${watchTab === id ? "#7c3aed" : "transparent"}`, background: "none", color: watchTab === id ? "#a78bfa" : "rgba(255,255,255,0.45)", cursor: "pointer", marginBottom: -1 }}>
                {label}
              </button>
            ))}
          </div>

          {/* Search + dropdown */}
          {watchTab === "watchlist" && (
            <div style={{ padding: "8px 8px 4px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", marginBottom: 6 }}>
                <Search size={10} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                <input value={watchSearch} onChange={e => setWatchSearch(e.target.value)} placeholder="Search symbol or company…"
                  style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 10, minWidth: 0 }} />
                {watchSearch && <button onClick={() => setWatchSearch("")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 0 }}><X size={9} /></button>}
              </div>
              {/* Category filter row */}
              <div style={{ display: "flex", gap: 2 }}>
                {(["STOCKS","CRYPTO","ETF","INDICES"] as WatchFilter[]).map(f => (
                  <button key={f} onClick={() => setWatchFilter(f)}
                    style={{ flex: 1, padding: "3px 0", fontSize: 7.5, fontWeight: 700, border: "none", borderRadius: 3, cursor: "pointer", background: watchFilter === f ? "#7c3aed" : "rgba(255,255,255,0.04)", color: watchFilter === f ? "#fff" : "rgba(255,255,255,0.4)" }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Column headers */}
          <div style={{ display: "flex", padding: "4px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
            <span style={{ flex: 1, fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.07em" }}>NAME</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.07em", textAlign: "right" }}>PRICE/CHANGE ↕</span>
          </div>

          {/* Stock list */}
          <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.06) transparent" }}>
            {displayItems.length === 0 && (
              <div style={{ padding: "30px 10px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 10 }}>
                {loading.stocks ? "Loading…" : "No results"}
              </div>
            )}
            {displayItems.map((q: any) => {
              const chg = parseFloat(q.change || "0"), up = chg > 0, down = chg < 0;
              const color = up ? "#4ade80" : down ? "#f87171" : "#94a3b8";
              const active = q.symbol === selectedSymbol;
              const ex = getExchange(q.symbol);
              const spark = sparklines[q.symbol];
              return (
                <div key={q.symbol} data-testid={`watch-${q.symbol}`}
                  onClick={() => selectSymbol(q.symbol, q.name)}
                  style={{ display: "flex", alignItems: "center", padding: "7px 10px", borderBottom: "1px solid rgba(255,255,255,0.025)", cursor: "pointer", background: active ? "rgba(124,58,237,0.12)" : "transparent", borderLeft: active ? "2px solid #7c3aed" : "2px solid transparent", transition: "background 0.1s" }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 1 }}>
                      <span style={{ color: "#fff", fontWeight: 800, fontSize: 11 }}>{q.symbol.replace("-USD","").replace("^","")}</span>
                      <span style={{ fontSize: 6.5, fontWeight: 700, padding: "0px 3px", borderRadius: 2, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>{ex}</span>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110 }}>{q.name}</div>
                  </div>
                  {spark && <Sparkline closes={spark} positive={up} w={44} h={18} />}
                  <div style={{ textAlign: "right", marginLeft: 6, flexShrink: 0 }}>
                    <div style={{ color: "#fff", fontWeight: 800, fontSize: 11 }}>{q.price !== "—" ? (q.symbol.endsWith("-USD") ? "" : "") + q.price : "—"}</div>
                    <div style={{ color, fontWeight: 700, fontSize: 9 }}>{up ? "+" : ""}{q.change}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom category icons */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-around", padding: "6px 0", flexShrink: 0 }}>
            {[
              { icon: <BarChart3 size={14} />, label: "Stocks", f: "STOCKS" as WatchFilter },
              { icon: <Bitcoin size={14} />, label: "Crypto", f: "CRYPTO" as WatchFilter },
              { icon: <Globe size={14} />, label: "ETFs", f: "ETF" as WatchFilter },
              { icon: <Gauge size={14} />, label: "Index", f: "INDICES" as WatchFilter },
            ].map(({ icon, label, f }) => (
              <button key={f} onClick={() => { setWatchFilter(f); setWatchTab("watchlist"); }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", color: watchFilter === f ? "#a78bfa" : "rgba(255,255,255,0.3)", padding: "2px 6px" }}>
                {icon}
                <span style={{ fontSize: 7, fontWeight: 600 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── CENTER: Embedded Chart ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <EmbeddedChart
            symbol={selectedSymbol}
            name={selectedName}
            orgSignal={orgSignalSelected}
            onDataLoad={d => setSelectedChartData(d)}
          />
        </div>

        {/* ── RIGHT: Quote + Pulse AI Panel (290px) ── */}
        <div style={{ width: 290, borderLeft: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", background: "#030009", overflow: "hidden", flexShrink: 0 }}>
          {/* Quote header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>Quote</span>
            <Settings size={12} style={{ color: "rgba(255,255,255,0.3)", cursor: "pointer" }} />
          </div>

          {/* Symbol + exchange + company */}
          <div style={{ padding: "10px 12px 6px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>{selectedSymbol.replace("-USD","").replace("^","")}</span>
              <span style={{ fontSize: 7, fontWeight: 800, padding: "1px 5px", borderRadius: 3, background: exchange === "NASDAQ" ? "rgba(99,102,241,0.2)" : exchange === "CRYPTO" ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.08)", color: exchange === "NASDAQ" ? "#818cf8" : exchange === "CRYPTO" ? "#fbbf24" : "rgba(255,255,255,0.6)" }}>{exchange}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedName}</span>
            </div>

            {/* Price */}
            {selectedQuote ? (
              <>
                <div style={{ fontSize: 28, fontWeight: 900, color: parseFloat(selectedQuote.change) >= 0 ? "#4ade80" : "#f87171", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 2 }}>
                  {selectedSymbol.endsWith("-USD") ? "" : "$"}{selectedQuote.price}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  {parseFloat(selectedQuote.change) >= 0 ? <ChevronUp size={12} color="#4ade80" /> : <ChevronDown size={12} color="#f87171" />}
                  <span style={{ color: parseFloat(selectedQuote.change) >= 0 ? "#4ade80" : "#f87171", fontWeight: 700, fontSize: 12 }}>
                    {parseFloat(selectedQuote.change) >= 0 ? "+" : ""}{selectedQuote.change}%
                  </span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 24, color: "rgba(255,255,255,0.3)", fontWeight: 900, marginBottom: 4 }}>—</div>
            )}
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9 }}>Closed {new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })} EDT</div>

            {/* Action icons */}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {[<Star size={12} />, <Bell size={12} />, <BarChart3 size={12} />, <Activity size={12} />].map((icon, i) => (
                <button key={i} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>{icon}</button>
              ))}
            </div>
          </div>

          {/* Classic Trade | Pulse AI tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            <button onClick={() => setPulseAIMode(false)}
              style={{ flex: 1, padding: "8px 0", fontSize: 10, fontWeight: 700, border: "none", borderBottom: `2px solid ${!pulseAIMode ? "#7c3aed" : "transparent"}`, background: "none", color: !pulseAIMode ? "#a78bfa" : "rgba(255,255,255,0.45)", cursor: "pointer", marginBottom: -1 }}>
              Classic Trade
            </button>
            <button onClick={() => { setPulseAIMode(true); setPulseAIActive(true); fetchTradeLogs(); }}
              data-testid="button-pulse-ai"
              style={{ flex: 1, padding: "8px 0", fontSize: 10, fontWeight: 800, border: "none", borderBottom: `2px solid ${pulseAIMode ? "#7c3aed" : "transparent"}`, background: pulseAIMode ? "rgba(124,58,237,0.1)" : "none", color: pulseAIMode ? "#a78bfa" : "rgba(255,255,255,0.55)", cursor: "pointer", marginBottom: -1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              {pulseAIActive && pulseAIMode && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />}
              ⚡ Pulse AI
            </button>
          </div>

          {/* Right panel content */}
          <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.06) transparent" }}>

            {!pulseAIMode ? (
              /* ── CLASSIC TRADE: Key Statistics ── */
              <div>
                {/* Key Statistics */}
                <div style={{ padding: "10px 12px 6px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Key Statistics</div>
                  {[
                    ["Open",     selectedChartData?.open?.toFixed(2) ?? "—",    "Prev Close", selectedChartData?.price?.toFixed(2) ?? "—"],
                    ["High",     selectedChartData?.high?.toFixed(2) ?? "—",    "Low",         selectedChartData?.low?.toFixed(2) ?? "—"],
                    ["Volume",   fmtVol(selectedChartData?.volume ?? 0),        "Turnover",    "—"],
                    ["Avg Vol(3M)", avgVol,                                     "% Range",     priceRange !== "—" ? priceRange + "%" : "—"],
                    ["52 Wk High", w52h !== "—" ? `$${w52h}` : "—",           "52 Wk Low",   w52l !== "—" ? `$${w52l}` : "—"],
                    ["Market Cap", "—",                                          "P/E(TTM)",    "N/A"],
                    ["P/E(FWD)",   "N/A",                                        "Dividend",    "—"],
                    ["EPS(TTM)",   "—",                                          "Div Yield",   "0.00%"],
                    ["% Turnover", "1.50%",                                      "P/B",         "—"],
                    ["Shares Out", "—",                                          "Free Float",  "—"],
                    ["Beta",       "—",                                          "Ex-Div Date", "—"],
                  ].map(([l1, v1, l2, v2], i) => (
                    <div key={i} style={{ display: "flex", padding: "3.5px 0", borderBottom: "1px solid rgba(255,255,255,0.025)" }}>
                      <span style={{ flex: 1, color: "rgba(255,255,255,0.45)", fontSize: 9 }}>{l1}</span>
                      <span style={{ minWidth: 60, color: "#fff", fontWeight: 600, fontSize: 9, textAlign: "right" }}>{v1}</span>
                      <span style={{ flex: 1, color: "rgba(255,255,255,0.45)", fontSize: 9, textAlign: "right", paddingLeft: 8 }}>{l2}</span>
                      <span style={{ minWidth: 60, color: "#fff", fontWeight: 600, fontSize: 9, textAlign: "right" }}>{v2}</span>
                    </div>
                  ))}
                </div>

                {/* Organism signal for selected */}
                {orgSignalSelected && (
                  <div style={{ margin: "8px 12px", padding: "10px 12px", borderRadius: 10, background: selectedIsLong ? "rgba(74,222,128,0.06)" : selectedIsShort ? "rgba(248,113,113,0.06)" : "rgba(124,58,237,0.06)", border: `1px solid ${selectedIsLong ? "rgba(74,222,128,0.2)" : selectedIsShort ? "rgba(248,113,113,0.2)" : "rgba(124,58,237,0.15)"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 9, fontWeight: 900, color: "#a78bfa" }}>⭐ SOVEREIGN SIGNAL</span>
                      <span style={{ fontSize: 8, fontWeight: 900, padding: "1px 6px", borderRadius: 4, background: selectedIsLong ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)", color: selectedIsLong ? "#4ade80" : "#f87171" }}>{orgSignalSelected.stance}</span>
                    </div>
                    {[["EDGE", `${(orgSignalSelected.edge_final * 100)?.toFixed(1)}`],["CONVICTION",`${orgSignalSelected.conviction}%`],["RISK LIVE",`${(orgSignalSelected.risk_live * 100)?.toFixed(1)}%`],["PROFIT LOCK",`${(orgSignalSelected.profit_lock * 100)?.toFixed(1)}%`],["POSITION SIZE f*",orgSignalSelected.size_f?.toFixed(2)],["STOP LIVE",`$${orgSignalSelected.stop_live?.toFixed(2)}`],["HORIZON",orgSignalSelected.horizon]].map(([l, v]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 8 }}>{l}</span>
                        <span style={{ color: "#fff", fontWeight: 700, fontSize: 8 }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 6, color: "rgba(255,255,255,0.4)", fontSize: 8, textAlign: "right" }}>{orgSignalSelected.scientist_emoji} {orgSignalSelected.scientist_role}</div>
                  </div>
                )}

                {/* Buy/Sell */}
                <div style={{ padding: "12px 12px 8px" }}>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, marginBottom: 6 }}>Side</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    <button style={{ flex: 1, padding: "10px 0", borderRadius: 6, border: "none", background: "#22c55e", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Buy</button>
                    <button style={{ flex: 1, padding: "10px 0", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.7)", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Sell</button>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, marginBottom: 4 }}>Order Type</div>
                  <select style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#0a0014", color: "#fff", fontSize: 11, outline: "none" }}>
                    <option>Market</option><option>Limit</option><option>Stop</option><option>Stop Limit</option>
                  </select>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, marginTop: 8, marginBottom: 4 }}>Quantity</div>
                  <input type="number" defaultValue={1} min={1} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#0a0014", color: "#fff", fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
            ) : (
              /* ── PULSE AI MODE: Sovereign Organism Live Feed ── */
              <div>
                {/* Organism vitals */}
                {organism && (
                  <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ color: "#a78bfa", fontWeight: 900, fontSize: 10 }}>⭐ ORGANISM VITALS</span>
                      <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>● LIVE</span>
                    </div>
                    {[
                      { l: "SCIENTISTS", v: `${organism.activeScientists}`, c: "#a78bfa" },
                      { l: "TRADES", v: organism.totalTrades?.toLocaleString(), c: "#4ade80" },
                      { l: "VOTES", v: organism.totalVotes?.toLocaleString(), c: "#fbbf24" },
                      { l: "PAPERS", v: organism.totalPapers?.toLocaleString(), c: "#60a5fa" },
                      { l: "MOOD", v: organism.mood, c: organism.mood === "HUNTING" ? "#4ade80" : "#fbbf24" },
                      { l: "REGIME", v: organism.regime, c: organism.regime === "RISK-ON" ? "#4ade80" : "#f87171" },
                      { l: "GLOBAL RISK", v: `${((organism.globalRisk || 0) * 100).toFixed(1)}%`, c: (organism.globalRisk || 0) > 0.25 ? "#f87171" : "#4ade80" },
                      { l: "FEAR & GREED", v: `${organism.fearGreed?.toFixed(1)}`, c: "#fbbf24" },
                    ].map(v => (
                      <div key={v.l} style={{ display: "flex", justifyContent: "space-between", padding: "2.5px 0" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 8.5, fontWeight: 600 }}>{v.l}</span>
                        <span style={{ color: v.c, fontWeight: 800, fontSize: 8.5 }}>{v.v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CRISPR Weights */}
                {organism?.crispWeights && (
                  <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: "#f472b6", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                      <Dna size={10} /> CRISPR λ WEIGHTS
                    </div>
                    {Object.entries(organism.crispWeights).map(([k, v]: [string, any]) => {
                      const labels: Record<string, string> = { lambda1: "λ1 Momentum", lambda2: "λ2 Sup/Res", lambda3: "λ3 Vol-Pen", lambda4: "λ4 Lev-Pen", lambda6: "λ6 Risk-Disc", lambda7: "λ7 Profit-Lock" };
                      const colors: Record<string, string> = { lambda1: "#4ade80", lambda2: "#60a5fa", lambda3: "#f87171", lambda4: "#fbbf24", lambda6: "#a78bfa", lambda7: "#34d399" };
                      const col = colors[k] || "#94a3b8";
                      return (
                        <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, minWidth: 80 }}>{labels[k] || k}</span>
                          <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                            <div style={{ width: `${Math.min(100, (v / 2.0) * 100)}%`, height: "100%", background: col, borderRadius: 2 }} />
                          </div>
                          <span style={{ color: col, fontWeight: 800, fontSize: 8, minWidth: 30, textAlign: "right" }}>{(v as number).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Top Edge Trades */}
                {organism?.topEdgeTrades?.length > 0 && (
                  <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: "#4ade80", marginBottom: 6 }}>🎯 HIGHEST EDGE SIGNALS</div>
                    {organism.topEdgeTrades.map((t: any, i: number) => {
                      const isL = t.stance === "LONG" || t.stance === "HOLD-LONG";
                      return (
                        <div key={i} onClick={() => selectSymbol(t.symbol, t.symbol)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 6, marginBottom: 3, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
                          <span style={{ color: "#fff", fontWeight: 800, fontSize: 10, minWidth: 40 }}>{t.symbol}</span>
                          <span style={{ fontSize: 7, fontWeight: 900, padding: "1px 4px", borderRadius: 3, background: isL ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)", color: isL ? "#4ade80" : "#f87171" }}>{t.stance}</span>
                          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, flex: 1 }}>CVX:{t.conviction}%</span>
                          <span style={{ color: "#a78bfa", fontSize: 9 }}>{t.scientist_emoji}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Live Trade Feed */}
                <div style={{ padding: "8px 12px 4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#60a5fa" }}>📡 LIVE TRADE FEED</span>
                    <button onClick={fetchTradeLogs} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0 }}>
                      <RefreshCw size={9} />
                    </button>
                  </div>
                  {tradeLogs.length === 0 && (
                    <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, padding: "10px 0" }}>Waiting for trades…</div>
                  )}
                  {tradeLogs.slice(0, 30).map((t: any, i: number) => {
                    const isLong = t.stance === "LONG" || t.stance === "HOLD-LONG";
                    return (
                      <div key={i} onClick={() => t.symbol && selectSymbol(t.symbol, t.symbol)}
                        style={{ padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 1 }}>
                          <span style={{ color: "#fff", fontWeight: 800, fontSize: 9, minWidth: 36 }}>{t.symbol}</span>
                          <span style={{ fontSize: 7, fontWeight: 900, padding: "0px 4px", borderRadius: 3, background: isLong ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)", color: isLong ? "#4ade80" : "#f87171" }}>{t.stance}</span>
                          <span style={{ color: "#a78bfa", fontSize: 8, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.scientist_emoji} {t.scientist_role?.split(" ")[0]}</span>
                          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 7 }}>{t.conviction}%</span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 7 }}>EDGE:{(t.edge_final * 100)?.toFixed(1)}</span>
                          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 7 }}>RISK:{(t.risk_live * 100)?.toFixed(0)}%</span>
                          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 7 }}>f*:{t.size_f?.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Pulse AI active indicator */}
          {pulseAIActive && (
            <div style={{ borderTop: "1px solid rgba(124,58,237,0.15)", padding: "4px 12px", background: "rgba(124,58,237,0.05)", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
              <span style={{ fontSize: 8, color: "#4ade80", fontWeight: 700 }}>PULSE AI TRADING — 42 SCIENTISTS ACTIVE</span>
              <button onClick={() => { setPulseAIActive(false); }} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 8 }}>STOP</button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
