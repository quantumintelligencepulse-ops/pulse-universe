import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, CrosshairMode, LineStyle, ColorType } from "lightweight-charts";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Brain, Zap, Search, X, Building2, Bitcoin, BarChart3, ChevronUp, ChevronDown, Globe, Flame, Layers, DollarSign, Gauge, CandlestickChart, LineChart, FlaskConical, BookOpen, Activity, Dna, Vote, Microscope } from "lucide-react";

// ── Symbol universes ────────────────────────────────────────────
const MARKET_SECTORS: Record<string, string[]> = {
  "Tech":        ["AAPL","MSFT","NVDA","GOOGL","META","TSLA","AMD","ADBE","CRM","ORCL","QCOM","INTC","AMZN"],
  "Finance":     ["JPM","BAC","WFC","GS","V","MA","AXP","C","MS","BLK","SCHW","PGR","CB"],
  "Healthcare":  ["LLY","UNH","JNJ","ABBV","MRK","TMO","ABT","DHR","PFE","CVS","BMY","ISRG"],
  "Energy":      ["XOM","CVX","COP","SLB","EOG","MPC","VLO","PSX","OXY","KMI"],
  "Consumer":    ["WMT","HD","MCD","COST","NKE","SBUX","TGT","PG","KO","PEP","AMZN","LOW","TJX"],
  "Industrial":  ["CAT","GE","HON","RTX","UPS","FDX","DE","LMT","NOC","GD","EMR","ETN"],
  "Comm/Media":  ["NFLX","DIS","T","VZ","CMCSA","SNAP","UBER","LYFT","PINS","SPOT","WBD"],
  "Materials":   ["LIN","APD","ECL","SHW","NEM","FCX","NUE","VMC","MLM","CF"],
  "Utilities":   ["NEE","DUK","SO","AEP","EXC","XEL","PCG","SRE","D","ED"],
};
const ALL_STOCKS = Object.values(MARKET_SECTORS).flat();
const CRYPTO_SYMBOLS = ["BTC-USD","ETH-USD","SOL-USD","BNB-USD","XRP-USD","ADA-USD","DOGE-USD","AVAX-USD","LINK-USD","LTC-USD","DOT-USD","MATIC-USD"];
const REALESTATE_SYMBOLS = ["VNQ","IYR","XLRE","AMT","PLD","EQIX","CCI","DLR","PSA","O","WELL","SPG","AVB","EQR","INVH","MAA"];
const INDEX_SYMBOLS = ["SPY","QQQ","DIA","IWM","^VIX"];

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
type Tab = "markets" | "crypto" | "defi" | "realestate" | "forex" | "commodities" | "bonds" | "global" | "predictions" | "oracle" | "dissection" | "tradeslog" | "papers";
type ChartTF = "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y";
type ChartMode = "candle" | "line";

// ── Read Finance preferences from persisted app settings ─────────
function getFinanceSettings() {
  try {
    const raw = localStorage.getItem("myaigpt_app_settings");
    const s = raw ? JSON.parse(raw) : {};
    return {
      defaultTF: (s.financeDefaultTF as ChartTF) || "3M",
      defaultChartType: (s.financeDefaultChartType as ChartMode) || "candle",
      ma20: s.financeIndicatorMA20 !== false,
      ma50: s.financeIndicatorMA50 === true,
      ma200: s.financeIndicatorMA200 === true,
      volume: s.financeIndicatorVolume !== false,
      autoRefresh: (s.financeAutoRefresh as string) || "1m",
      hiddenTabs: Array.isArray(s.financeHiddenTabs) ? s.financeHiddenTabs : [],
      showFearGreed: s.financeShowFearGreed !== false,
    };
  } catch {
    return { defaultTF: "3M" as ChartTF, defaultChartType: "candle" as ChartMode, ma20: true, ma50: false, ma200: false, volume: true, autoRefresh: "1m", hiddenTabs: [], showFearGreed: true };
  }
}

// ── Helpers ──────────────────────────────────────────────────────
function fmtVol(v: number) {
  if (!v) return "—";
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
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

// ── Stock Chart Modal (TradingView lightweight-charts) ───────────
function StockChartModal({ symbol, name, onClose }: { symbol: string; name?: string; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const fSetting = getFinanceSettings();
  const [tf, setTF] = useState<ChartTF>(fSetting.defaultTF);
  const [mode, setMode] = useState<ChartMode>(fSetting.defaultChartType);
  const [indicators, setIndicators] = useState({ ma20: fSetting.ma20, ma50: fSetting.ma50, ma200: fSetting.ma200, volume: fSetting.volume, rsi: false, macd: false, bb: false });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState<any>(null);
  const [rsiData, setRsiData] = useState<{ time: any; value: number }[]>([]);
  const [macdData, setMacdData] = useState<{ time: any; macd: number; sig: number; hist: number }[]>([]);
  const [orgSignalModal, setOrgSignalModal] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`/api/finance/chart/${encodeURIComponent(symbol)}?tf=${tf}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
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
    fetch(`/api/finance/organism`).then(r => r.json()).then(d => {
      if (d?.topEdgeTrades) {
        const sym = symbol.replace("-USD","").replace("=X","").replace("^","");
        const sig = d.topEdgeTrades.find((t: any) => t.symbol === symbol || t.symbol === sym || t.symbol === symbol.split("-")[0]);
        if (sig) setOrgSignalModal(sig);
      }
    }).catch(() => {});
  }, [symbol]);

  useEffect(() => {
    if (!data?.ohlcv?.length || !containerRef.current) return;
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    // Deduplicate by time — keep only the last entry per timestamp (lightweight-charts requires strict asc order with unique times)
    const seenTimes = new Map<string, any>();
    for (const candle of data.ohlcv) { seenTimes.set(candle.time, candle); }
    const cleanOhlcv = Array.from(seenTimes.values()).sort((a, b) => a.time < b.time ? -1 : a.time > b.time ? 1 : 0);

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#05000e" },
        textColor: "rgba(255,255,255,0.45)",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(167,139,250,0.5)", labelBackgroundColor: "#3b0764" },
        horzLine: { color: "rgba(167,139,250,0.5)", labelBackgroundColor: "#3b0764" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: true,
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight || 340,
    });
    chartRef.current = chart;

    const priceScaleMargins = indicators.volume ? { top: 0.06, bottom: 0.28 } : { top: 0.06, bottom: 0.04 };

    if (mode === "candle") {
      const cs = chart.addSeries(CandlestickSeries, {
        upColor: "#4ade80",
        downColor: "#f87171",
        wickUpColor: "#4ade80",
        wickDownColor: "#f87171",
        borderVisible: false,
        priceScaleId: "right",
      });
      cs.priceScale().applyOptions({ scaleMargins: priceScaleMargins });
      cs.setData(cleanOhlcv);

      chart.subscribeCrosshairMove((param: any) => {
        if (param?.seriesData?.get(cs)) {
          setHovered(param.seriesData.get(cs));
        } else {
          setHovered(null);
        }
      });
    } else {
      const ls = chart.addSeries(LineSeries, {
        color: "#a78bfa",
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBackgroundColor: "#7c3aed",
        lastValueVisible: true,
        priceScaleId: "right",
      });
      ls.priceScale().applyOptions({ scaleMargins: priceScaleMargins });
      ls.setData(cleanOhlcv.map((d: any) => ({ time: d.time, value: d.close })));
    }

    if (indicators.ma20 && cleanOhlcv.length >= 20) {
      const s = chart.addSeries(LineSeries, { color: "#fbbf24", lineWidth: 1, title: "MA20", lastValueVisible: false, priceLineVisible: false, priceScaleId: "right" });
      s.setData(computeSMA(cleanOhlcv, 20));
    }
    if (indicators.ma50 && cleanOhlcv.length >= 50) {
      const s = chart.addSeries(LineSeries, { color: "#60a5fa", lineWidth: 1, title: "MA50", lastValueVisible: false, priceLineVisible: false, priceScaleId: "right" });
      s.setData(computeSMA(cleanOhlcv, 50));
    }
    if (indicators.ma200 && cleanOhlcv.length >= 200) {
      const s = chart.addSeries(LineSeries, { color: "#f472b6", lineWidth: 1, lineStyle: LineStyle.Dashed, title: "MA200", lastValueVisible: false, priceLineVisible: false, priceScaleId: "right" });
      s.setData(computeSMA(cleanOhlcv, 200));
    }
    if (indicators.volume) {
      const vs = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
        lastValueVisible: false,
        priceLineVisible: false,
      });
      vs.priceScale().applyOptions({ scaleMargins: { top: 0.75, bottom: 0 } });
      vs.setData(cleanOhlcv.map((d: any) => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)",
      })));
    }

    if (indicators.bb && cleanOhlcv.length >= 20) {
      const bbData = computeBB(cleanOhlcv);
      const bbOpt = { lineWidth: 1 as any, lastValueVisible: false, priceLineVisible: false, priceScaleId: "right" };
      const upperS = chart.addSeries(LineSeries, { ...bbOpt, color: "rgba(96,165,250,0.5)" });
      upperS.setData(bbData.map((d: any) => ({ time: d.time, value: d.upper })));
      const lowerS = chart.addSeries(LineSeries, { ...bbOpt, color: "rgba(96,165,250,0.5)" });
      lowerS.setData(bbData.map((d: any) => ({ time: d.time, value: d.lower })));
      const midS = chart.addSeries(LineSeries, { ...bbOpt, color: "rgba(96,165,250,0.2)", lineStyle: LineStyle.Dashed });
      midS.setData(bbData.map((d: any) => ({ time: d.time, value: d.mid })));
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);

    return () => { ro.disconnect(); };
  }, [data, mode, indicators]);

  useEffect(() => {
    return () => { if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; } };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const chg = data?.change ?? 0;
  const up = chg >= 0;
  const displayData = hovered || data;
  const isCrypto = symbol.includes("-USD");

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backdropFilter: "blur(4px)" }}
      onClick={onClose}
      data-testid="chart-modal-backdrop"
    >
      <div
        style={{ width: "100%", maxWidth: 860, borderRadius: 20, background: "#05000e", border: "1px solid rgba(124,58,237,0.2)", boxShadow: "0 48px 120px rgba(0,0,0,0.98), 0 0 0 1px rgba(255,255,255,0.04) inset", overflow: "hidden", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}
        data-testid="chart-modal"
      >
        {/* Header */}
        <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 22, letterSpacing: "-0.02em" }}>{symbol.replace("-USD","").replace("=X","")}</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 500 }}>{data?.name || name}</span>
                {isCrypto && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}>CRYPTO</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 26, letterSpacing: "-0.02em" }}>
                  {isCrypto ? "" : "$"}{(hovered?.close ?? data?.price ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {up ? <ChevronUp size={14} color="#4ade80" /> : <ChevronDown size={14} color="#f87171" />}
                  <span style={{ color: up ? "#4ade80" : "#f87171", fontWeight: 700, fontSize: 14 }}>
                    {up ? "+" : ""}{chg.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} data-testid="button-close-chart"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "6px 8px", lineHeight: 1 }}>
              <X size={14} />
            </button>
          </div>

          {/* OHLCV Stats */}
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            {[
              { label: "OPEN",  value: (hovered?.open  ?? data?.open)?.toFixed(2) },
              { label: "HIGH",  value: (hovered?.high  ?? data?.high)?.toFixed(2) },
              { label: "LOW",   value: (hovered?.low   ?? data?.low)?.toFixed(2) },
              { label: "CLOSE", value: (hovered?.close ?? data?.price)?.toFixed(2) },
              { label: "VOL",   value: fmtVol(hovered?.volume ?? data?.volume ?? 0) },
            ].map(s => (
              <div key={s.label}>
                <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, fontWeight: 700, letterSpacing: "0.08em" }}>{s.label}</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 11 }}>{s.value ?? "—"}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls bar */}
        <div style={{ padding: "7px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0, flexWrap: "wrap", gap: 6 }}>
          {/* Timeframes */}
          <div style={{ display: "flex", gap: 3 }}>
            {(["1W","1M","3M","6M","1Y","5Y"] as ChartTF[]).map(t => (
              <button key={t} onClick={() => setTF(t)} data-testid={`tf-${t}`}
                style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${tf === t ? "#7c3aed" : "rgba(255,255,255,0.06)"}`, background: tf === t ? "rgba(124,58,237,0.18)" : "none", color: tf === t ? "#a78bfa" : "rgba(255,255,255,0.28)", fontSize: 10, fontWeight: 800, cursor: "pointer", transition: "all 0.15s" }}>
                {t}
              </button>
            ))}
          </div>
          {/* Chart type */}
          <div style={{ display: "flex", gap: 3 }}>
            <button onClick={() => setMode("candle")} data-testid="mode-candle"
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: `1px solid ${mode === "candle" ? "#7c3aed" : "rgba(255,255,255,0.06)"}`, background: mode === "candle" ? "rgba(124,58,237,0.18)" : "none", color: mode === "candle" ? "#a78bfa" : "rgba(255,255,255,0.28)", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
              <CandlestickChart size={11} /> Candle
            </button>
            <button onClick={() => setMode("line")} data-testid="mode-line"
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: `1px solid ${mode === "line" ? "#7c3aed" : "rgba(255,255,255,0.06)"}`, background: mode === "line" ? "rgba(124,58,237,0.18)" : "none", color: mode === "line" ? "#a78bfa" : "rgba(255,255,255,0.28)", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
              <LineChart size={11} /> Line
            </button>
          </div>
        </div>

        {/* Indicator toggles */}
        <div style={{ padding: "6px 18px", display: "flex", gap: 5, borderBottom: "1px solid rgba(255,255,255,0.03)", flexShrink: 0 }}>
          <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 9, fontWeight: 700, alignSelf: "center", marginRight: 2 }}>INDICATORS</span>
          {([
            { key: "ma20",   label: "MA20",   color: "#fbbf24" },
            { key: "ma50",   label: "MA50",   color: "#60a5fa" },
            { key: "ma200",  label: "MA200",  color: "#f472b6" },
            { key: "volume", label: "VOL",    color: "#a78bfa" },
            { key: "bb",     label: "BB",     color: "#60a5fa" },
            { key: "rsi",    label: "RSI",    color: "#4ade80" },
            { key: "macd",   label: "MACD",   color: "#f472b6" },
          ] as { key: keyof typeof indicators; label: string; color: string }[]).map(({ key, label, color }) => (
            <button key={key}
              onClick={() => setIndicators(p => ({ ...p, [key]: !p[key] }))}
              data-testid={`indicator-${key}`}
              style={{ padding: "3px 9px", borderRadius: 5, border: `1px solid ${indicators[key] ? color + "55" : "rgba(255,255,255,0.06)"}`, background: indicators[key] ? color + "18" : "none", color: indicators[key] ? color : "rgba(255,255,255,0.6)", fontSize: 9, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
              {indicators[key] ? "✓ " : ""}{label}
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            {indicators.ma20  && <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#fbbf24", fontSize: 8, fontWeight: 700 }}><span style={{ width: 14, height: 2, background: "#fbbf24", display: "inline-block", borderRadius: 1 }} />MA20</span>}
            {indicators.ma50  && <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#60a5fa", fontSize: 8, fontWeight: 700 }}><span style={{ width: 14, height: 2, background: "#60a5fa", display: "inline-block", borderRadius: 1 }} />MA50</span>}
            {indicators.ma200 && <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#f472b6", fontSize: 8, fontWeight: 700 }}><span style={{ width: 14, height: 2, background: "#f472b6", display: "inline-block", borderRadius: 1 }} />MA200</span>}
            {indicators.bb    && <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#60a5fa", fontSize: 8, fontWeight: 700 }}><span style={{ width: 14, height: 2, background: "rgba(96,165,250,0.5)", display: "inline-block", borderRadius: 1 }} />BB(20,2)</span>}
          </div>
        </div>

        {/* Chart area */}
        <div style={{ position: "relative", flex: 1, minHeight: 340 }}>
          {loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#05000e", zIndex: 2, gap: 10 }}>
              <div style={{ width: 28, height: 28, border: "2px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>Loading {symbol} chart…</div>
            </div>
          )}
          {!loading && data?.ohlcv?.length === 0 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#05000e" }}>
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>No chart data available for {symbol}</div>
            </div>
          )}
          <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: 340 }} />
        </div>

        {/* RSI Sub-panel */}
        {indicators.rsi && rsiData.length > 0 && (() => {
          const vals = rsiData.map(d => d.value);
          const last = vals[vals.length - 1];
          const w = 860, h = 60;
          const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - 0) / 100) * h * 0.9 - h * 0.05}`).join(" ");
          const rsiColor = last >= 70 ? "#f87171" : last <= 30 ? "#4ade80" : "#a78bfa";
          return (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: "#030009", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 12px 0", alignItems: "center" }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.2)" }}>RSI (14)</span>
                <span style={{ fontSize: 9, fontWeight: 900, color: rsiColor }}>{last.toFixed(1)}</span>
              </div>
              <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block", height: h }}>
                <line x1="0" y1={h - h * 0.73} x2={w} y2={h - h * 0.73} stroke="rgba(248,113,113,0.25)" strokeDasharray="4,3" strokeWidth={1} />
                <line x1="0" y1={h - h * 0.23} x2={w} y2={h - h * 0.23} stroke="rgba(74,222,128,0.25)" strokeDasharray="4,3" strokeWidth={1} />
                <line x1="0" y1={h - h * 0.48} x2={w} y2={h - h * 0.48} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                <polyline points={pts} fill="none" stroke={rsiColor} strokeWidth={1.5} opacity={0.85} />
                <text x={w - 4} y={h - h * 0.73 - 2} fontSize={7} fill="rgba(248,113,113,0.5)" textAnchor="end">OB 70</text>
                <text x={w - 4} y={h - h * 0.23 + 7} fontSize={7} fill="rgba(74,222,128,0.5)" textAnchor="end">OS 30</text>
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
          const hw = 860, hh = 60, zero = hh - ((0 - minV) / rng) * hh * 0.9 - hh * 0.05;
          const toY = (v: number) => hh - ((v - minV) / rng) * hh * 0.9 - hh * 0.05;
          const lastM = macds[macds.length - 1], lastH = hists[hists.length - 1];
          return (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: "#030009", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 12px 0", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.2)" }}>MACD (12,26,9)</span>
                <span style={{ fontSize: 9, fontWeight: 900, color: lastM >= 0 ? "#4ade80" : "#f87171" }}>MACD {lastM >= 0 ? "+" : ""}{lastM?.toFixed(3)}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: lastH >= 0 ? "#4ade80" : "#f87171" }}>HIST {lastH >= 0 ? "+" : ""}{lastH?.toFixed(3)}</span>
              </div>
              <svg width="100%" viewBox={`0 0 ${hw} ${hh}`} preserveAspectRatio="none" style={{ display: "block", height: hh }}>
                <line x1="0" y1={zero} x2={hw} y2={zero} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                {hists.map((h, i) => {
                  const barW = hw / hists.length;
                  const x = i * barW, y0 = zero, y1 = toY(h), height = Math.abs(y0 - y1);
                  return <rect key={i} x={x} y={Math.min(y0, y1)} width={barW - 0.5} height={Math.max(1, height)} fill={h >= 0 ? "rgba(74,222,128,0.5)" : "rgba(248,113,113,0.5)"} />;
                })}
                <polyline points={macds.map((v, i) => `${(i / (macds.length - 1)) * hw},${toY(v)}`).join(" ")} fill="none" stroke="#60a5fa" strokeWidth={1.5} />
                <polyline points={sigs.map((v, i) => `${(i / (sigs.length - 1)) * hw},${toY(v)}`).join(" ")} fill="none" stroke="#f472b6" strokeWidth={1} />
              </svg>
            </div>
          );
        })()}

        {/* Organism Signal Panel */}
        {orgSignalModal && (
          <div style={{ borderTop: "1px solid rgba(124,58,237,0.15)", background: "rgba(124,58,237,0.04)", padding: "8px 18px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ color: "#a78bfa", fontWeight: 900, fontSize: 10 }}>⭐ SOVEREIGN SIGNAL</span>
              <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 5, background: orgSignalModal.stance === "LONG" || orgSignalModal.stance === "HOLD-LONG" ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)", color: orgSignalModal.stance === "LONG" || orgSignalModal.stance === "HOLD-LONG" ? "#4ade80" : "#f87171", border: `1px solid ${orgSignalModal.stance?.includes("LONG") ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}` }}>{orgSignalModal.stance}</span>
              {[
                { label: "EDGE", value: `${(orgSignalModal.edge_final * 100)?.toFixed(1)}` },
                { label: "CONVICTION", value: `${orgSignalModal.conviction}%` },
                { label: "RISK.LIVE", value: `${(orgSignalModal.risk_live * 100)?.toFixed(1)}%` },
                { label: "PROFIT.LOCK", value: `${(orgSignalModal.profit_lock * 100)?.toFixed(1)}%` },
                { label: "SIZE f*", value: orgSignalModal.size_f?.toFixed(2) },
                { label: "STOP", value: `$${orgSignalModal.stop_live?.toFixed(2)}` },
                { label: "HORIZON", value: orgSignalModal.horizon },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 7, fontWeight: 700 }}>{item.label}</span>
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 9 }}>{item.value}</span>
                </div>
              ))}
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, flex: 1, textAlign: "right" }}>{orgSignalModal.scientist_emoji} {orgSignalModal.scientist_role}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "6px 18px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ color: "rgba(255,255,255,0.1)", fontSize: 9 }}>Data via Yahoo Finance · Quantum Finance Oracle</span>
          <span style={{ color: "rgba(255,255,255,0.1)", fontSize: 9 }}>Scroll to zoom · Drag to pan · ESC to close</span>
        </div>
      </div>
    </div>
  );
}

// ── Sparkline ───────────────────────────────────────────────────
function Sparkline({ closes, positive, w = 80, h = 28 }: { closes: number[]; positive: boolean; w?: number; h?: number }) {
  if (!closes || closes.length < 2) return <div style={{ width: w, height: h }} />;
  const min = Math.min(...closes), max = Math.max(...closes);
  const range = max - min || 1;
  const pts = closes.map((v, i) => `${(i / (closes.length - 1)) * w},${h - ((v - min) / range) * h * 0.85 - h * 0.075}`).join(" ");
  const color = positive ? "#4ade80" : "#f87171";
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`sg${positive ? "g" : "r"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} /><stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`url(#sg${positive ? "g" : "r"})`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
    </svg>
  );
}

// ── Quote Card (clickable) ───────────────────────────────────────
function QuoteCard({ q, onOpen, orgSignal }: { q: Quote; onOpen: (symbol: string, name: string) => void; orgSignal?: any }) {
  const chg = parseFloat(q.change), up = chg > 0, down = chg < 0;
  const color = up ? "#4ade80" : down ? "#f87171" : "#94a3b8";
  const isLong = orgSignal?.stance === "LONG" || orgSignal?.stance === "HOLD-LONG";
  const isShort = orgSignal?.stance === "SHORT" || orgSignal?.stance === "HOLD-SHORT";
  const stanceColor = isLong ? "#4ade80" : isShort ? "#f87171" : "#a78bfa";
  const conviction = orgSignal?.conviction ?? 0;
  const riskLive = orgSignal?.risk_live ?? 0;
  const profitLock = orgSignal?.profit_lock ?? 0;
  const emotionGlyph = orgSignal?.scientist_emoji ?? "";
  const riskColor = riskLive > 0.6 ? "#f87171" : riskLive > 0.35 ? "#fbbf24" : "#4ade80";
  return (
    <div
      data-testid={`quote-${q.symbol}`}
      onClick={() => onOpen(q.symbol, q.name)}
      style={{ borderRadius: 12, border: `1px solid ${orgSignal ? (isLong ? "rgba(74,222,128,0.15)" : isShort ? "rgba(248,113,113,0.15)" : "rgba(167,139,250,0.15)") : "rgba(255,255,255,0.07)"}`, background: "rgba(255,255,255,0.015)", padding: "10px 12px", cursor: "pointer", transition: "border-color 0.15s, background 0.15s", position: "relative" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,58,237,0.4)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(124,58,237,0.06)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = orgSignal ? (isLong ? "rgba(74,222,128,0.15)" : isShort ? "rgba(248,113,113,0.15)" : "rgba(167,139,250,0.15)") : "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.015)"; }}
    >
      {/* emotion glyph top-right */}
      {emotionGlyph && <span style={{ position: "absolute", top: 8, right: 10, fontSize: 11, opacity: 0.7 }}>{emotionGlyph}</span>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 11, letterSpacing: "0.04em" }}>{q.symbol.replace("-USD","").replace("=X","")}</span>
        <span style={{ color, fontWeight: 800, fontSize: 10, display: "flex", alignItems: "center", gap: 1 }}>
          {up ? <ChevronUp size={9} /> : down ? <ChevronDown size={9} /> : <Minus size={9} />}{up ? "+" : ""}{q.change}%
        </span>
      </div>
      <div style={{ color: "#fff", fontWeight: 900, fontSize: 14, marginBottom: 2 }}>{q.price}</div>
      {q.closes && q.closes.length > 1 && <Sparkline closes={q.closes} positive={up || !down} />}
      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.name}</div>
      {/* Sovereign signal row */}
      {orgSignal ? (
        <div style={{ marginTop: 5, display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 7, fontWeight: 900, padding: "1px 5px", borderRadius: 4, background: isLong ? "rgba(74,222,128,0.15)" : isShort ? "rgba(248,113,113,0.15)" : "rgba(167,139,250,0.15)", color: stanceColor, border: `1px solid ${stanceColor}33` }}>{orgSignal.stance}</span>
          {conviction > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 6.5, fontWeight: 700 }}>CVX</span>
              <div style={{ width: 28, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ width: `${conviction}%`, height: "100%", background: conviction >= 75 ? "#4ade80" : conviction >= 50 ? "#fbbf24" : "#f87171", borderRadius: 2 }} />
              </div>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 6.5 }}>{conviction}%</span>
            </div>
          )}
          {riskLive > 0 && <span style={{ fontSize: 6.5, fontWeight: 700, color: riskColor }}>R:{(riskLive * 100).toFixed(0)}%</span>}
          {profitLock > 0 && <span style={{ fontSize: 6.5, fontWeight: 700, color: "#60a5fa" }}>🔒{(profitLock * 100).toFixed(0)}%</span>}
        </div>
      ) : (
        <div style={{ color: "rgba(124,58,237,0.5)", fontSize: 8, marginTop: 1, fontWeight: 600 }}>tap to chart →</div>
      )}
    </div>
  );
}

// ── Mini Row (clickable, for forex/bonds/commodities) ────────────
function MiniRow({ label, sub, value, change, badge, symbol, onOpen }: { label: string; sub?: string; value: string; change: string; badge?: string; symbol?: string; onOpen?: (sym: string, name: string) => void }) {
  const chg = parseFloat(change), up = chg > 0, down = chg < 0;
  const color = up ? "#4ade80" : down ? "#f87171" : "#94a3b8";
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: onOpen && symbol ? "pointer" : "default", transition: "background 0.12s" }}
      onClick={() => onOpen && symbol && onOpen(symbol, label)}
      onMouseEnter={e => { if (onOpen && symbol) (e.currentTarget as HTMLDivElement).style.background = "rgba(124,58,237,0.05)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>{label}</span>
          {badge && <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}>{badge}</span>}
        </div>
        {sub && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9 }}>{sub}</div>}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ color: "#fff", fontWeight: 900, fontSize: 13 }}>{value}</div>
        <div style={{ color, fontWeight: 700, fontSize: 10 }}>{up ? "+" : ""}{change}%</div>
      </div>
    </div>
  );
}

// ── Sector Bar ──────────────────────────────────────────────────
function SectorBar({ sectors }: { sectors: Sector[] }) {
  if (!sectors.length) return null;
  const sorted = [...sectors].sort((a, b) => b.change - a.change);
  const max = Math.max(...sorted.map(s => Math.abs(s.change)), 0.5);
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 16 }}>
      {sorted.map(s => {
        const up = s.change >= 0; const color = up ? "#4ade80" : "#f87171";
        return (
          <div key={s.symbol} data-testid={`sector-etf-${s.symbol}`} style={{ flex: "1 1 75px", minWidth: 72, background: "rgba(255,255,255,0.025)", borderRadius: 9, padding: "7px 9px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.65)", fontWeight: 700, marginBottom: 3 }}>{s.name}</div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, marginBottom: 3 }}>
              <div style={{ height: "100%", width: `${(Math.abs(s.change) / max) * 100}%`, background: color, borderRadius: 2 }} />
            </div>
            <div style={{ color, fontWeight: 800, fontSize: 10 }}>{up ? "+" : ""}{s.change.toFixed(2)}%</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Fear & Greed Gauge ──────────────────────────────────────────
function FearGreedGauge({ value, label }: { value: number; label: string }) {
  const color = value <= 25 ? "#f87171" : value <= 45 ? "#fbbf24" : value <= 55 ? "#94a3b8" : value <= 75 ? "#86efac" : "#4ade80";
  const r = 36, circ = Math.PI * r;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0 8px" }}>
      <svg width={90} height={52} viewBox="0 0 90 52">
        <path d="M 8 46 A 37 37 0 0 1 82 46" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={7} strokeLinecap="round" />
        <path d="M 8 46 A 37 37 0 0 1 82 46" fill="none" stroke={color} strokeWidth={7} strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 116} 116`} style={{ transition: "stroke-dasharray 1s ease" }} />
        <text x={45} y={42} textAnchor="middle" fontSize={16} fontWeight={900} fill={color}>{value}</text>
      </svg>
      <div style={{ color, fontWeight: 800, fontSize: 11, marginTop: 2 }}>{label}</div>
      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, marginTop: 1 }}>Fear & Greed Index</div>
    </div>
  );
}

// ── Probability Gauge ───────────────────────────────────────────
function ProbGauge({ pct, color }: { pct: number; color: string }) {
  const r = 20, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
  return (
    <svg width={52} height={52} style={{ flexShrink: 0 }}>
      <circle cx={26} cy={26} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
      <circle cx={26} cy={26} r={r} fill="none" stroke={color} strokeWidth={4} strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4} strokeLinecap="round" />
      <text x={26} y={30} textAnchor="middle" fontSize={10} fontWeight={900} fill={color}>{pct}%</text>
    </svg>
  );
}

// ── Command Palette ─────────────────────────────────────────────
function CommandPalette({ quotes, onClose, onOpen }: { quotes: Quote[]; onClose: () => void; onOpen: (sym: string, name: string) => void }) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const matches = q.length < 1 ? quotes.slice(0, 10) : quotes.filter(x => x.symbol.includes(q.toUpperCase()) || x.name?.toLowerCase().includes(q.toLowerCase())).slice(0, 12);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 560, borderRadius: 16, border: "1px solid rgba(255,255,255,0.14)", background: "#08000f", boxShadow: "0 32px 80px rgba(0,0,0,0.9)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <Search size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
          <input ref={ref} value={q} onChange={e => setQ(e.target.value)} placeholder="Search ticker or company…" data-testid="command-input"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 14, fontWeight: 600 }} />
          <button onClick={onClose}><X size={13} style={{ color: "rgba(255,255,255,0.3)" }} /></button>
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          {matches.map(m => {
            const up = parseFloat(m.change) > 0;
            return (
              <div key={m.symbol} data-testid={`palette-${m.symbol}`}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 16px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.035)" }}
                onClick={() => { onClose(); onOpen(m.symbol, m.name); }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 12, minWidth: 60 }}>{m.symbol.replace("-USD","")}</span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, flex: 1 }}>{m.name}</span>
                <span style={{ color: up ? "#4ade80" : "#f87171", fontWeight: 700, fontSize: 11 }}>{up ? "+" : ""}{m.change}%</span>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 11 }}>{m.price}</span>
                <span style={{ color: "rgba(124,58,237,0.6)", fontSize: 9, fontWeight: 600 }}>chart →</span>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "7px 16px", color: "rgba(255,255,255,0.12)", fontSize: 9 }}>⌘K to toggle · Click ticker to open chart · ESC to close</div>
      </div>
    </div>
  );
}

// ── Region badge colors ─────────────────────────────────────────
const REGION_COLOR: Record<string, string> = { "Europe": "#60a5fa", "Asia-Pacific": "#f472b6", "Americas": "#4ade80", "Middle East": "#fbbf24", "Africa": "#fb923c" };

export default function FinancePage() {
  const [tab, setTab] = useState<Tab>("markets");
  const [indices, setIndices] = useState<Quote[]>([]);
  const [stocks, setStocks] = useState<Quote[]>([]);
  const [crypto, setCrypto] = useState<Quote[]>([]);
  const [cryptoTop, setCryptoTop] = useState<CryptoTop[]>([]);
  const [defi, setDefi] = useState<DefiToken[]>([]);
  const [realestate, setRealestate] = useState<Quote[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [forex, setForex] = useState<ForexPair[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [global, setGlobal] = useState<GlobalIndex[]>([]);
  const [fearGreed, setFearGreed] = useState<FearGreed[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [oracle, setOracle] = useState<OracleData | null>(null);
  const [organism, setOrganism] = useState<any>(null);
  const orgSignalMap = useMemo<Record<string, any>>(() => {
    if (!organism?.topEdgeTrades) return {};
    const map: Record<string, any> = {};
    for (const t of organism.topEdgeTrades) {
      map[t.symbol] = t;
      const base = t.symbol.replace("-USD","").replace("=X","").replace("^","");
      map[base] = t;
    }
    return map;
  }, [organism]);
  const [tradeLogs, setTradeLogs] = useState<any[]>([]);
  const [scientistVotes, setScientistVotes] = useState<any[]>([]);
  const [tradingPapers, setTradingPapers] = useState<any[]>([]);
  const [scientists, setScientists] = useState<any[]>([]);
  const [loadingOrg, setLoadingOrg] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedSector, setSelectedSector] = useState("Tech");
  const [sortBy, setSortBy] = useState<"change" | "alpha">("change");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [cryptoPage, setCryptoPage] = useState(1);

  // Chart modal state
  const [chartSymbol, setChartSymbol] = useState<string | null>(null);
  const [chartName, setChartName] = useState<string>("");
  const openChart = useCallback((symbol: string, name: string) => {
    setChartSymbol(symbol);
    setChartName(name);
    setPaletteOpen(false);
  }, []);
  const closeChart = useCallback(() => setChartSymbol(null), []);

  const setLoad = (k: string, v: boolean) => setLoading(p => ({ ...p, [k]: v }));

  const fetchBatch = useCallback(async (syms: string[], setter: (d: Quote[]) => void, key: string) => {
    setLoad(key, true);
    try { setter(await fetch(`/api/finance/batch?symbols=${syms.join(",")}`).then(r => r.json()).catch(() => [])); }
    finally { setLoad(key, false); }
  }, []);

  const fetchSparklines = useCallback(async (syms: string[]) => {
    const missing = syms.filter(s => !sparklines[s]).slice(0, 10);
    if (!missing.length) return;
    await Promise.all(missing.map(async sym => {
      try {
        const d = await fetch(`/api/finance/chart/${sym}`).then(r => r.json()).catch(() => null);
        if (d?.closes?.length > 1) setSparklines(p => ({ ...p, [sym]: d.closes }));
      } catch {}
    }));
  }, [sparklines]);

  const fetchForex = useCallback(async () => {
    setLoad("forex", true);
    try { setForex(await fetch("/api/finance/forex").then(r => r.json()).catch(() => [])); }
    finally { setLoad("forex", false); }
  }, []);

  const fetchCommodities = useCallback(async () => {
    setLoad("commod", true);
    try { setCommodities(await fetch("/api/finance/commodities").then(r => r.json()).catch(() => [])); }
    finally { setLoad("commod", false); }
  }, []);

  const fetchBonds = useCallback(async () => {
    setLoad("bonds", true);
    try { setBonds(await fetch("/api/finance/bonds").then(r => r.json()).catch(() => [])); }
    finally { setLoad("bonds", false); }
  }, []);

  const fetchGlobal = useCallback(async () => {
    setLoad("global", true);
    try { setGlobal(await fetch("/api/finance/global").then(r => r.json()).catch(() => [])); }
    finally { setLoad("global", false); }
  }, []);

  const fetchCryptoTop = useCallback(async (page = 1) => {
    setLoad("cryptoTop", true);
    try {
      const data: CryptoTop[] = await fetch(`/api/finance/crypto/top?page=${page}`).then(r => r.json()).catch(() => []);
      setCryptoTop(p => page === 1 ? data : [...p, ...data]);
    } finally { setLoad("cryptoTop", false); }
  }, []);

  const fetchDefi = useCallback(async () => {
    setLoad("defi", true);
    try { setDefi(await fetch("/api/finance/defi").then(r => r.json()).catch(() => [])); }
    finally { setLoad("defi", false); }
  }, []);

  const fetchFearGreed = useCallback(async () => {
    try { setFearGreed(await fetch("/api/finance/feargreed").then(r => r.json()).catch(() => [])); }
    catch {}
  }, []);

  const fetchOrganism = useCallback(async () => {
    setLoadingOrg(true);
    try { setOrganism(await fetch("/api/finance/organism").then(r => r.json()).catch(() => null)); }
    finally { setLoadingOrg(false); }
  }, []);

  const fetchTradeLogs = useCallback(async () => {
    setLoadingLogs(true);
    try { setTradeLogs(await fetch("/api/finance/trade-logs?limit=80").then(r => r.json()).catch(() => [])); }
    finally { setLoadingLogs(false); }
  }, []);

  const fetchScientistVotes = useCallback(async () => {
    setScientistVotes(await fetch("/api/finance/scientist-votes?limit=40").then(r => r.json()).catch(() => []));
  }, []);

  const fetchTradingPapers = useCallback(async () => {
    setTradingPapers(await fetch("/api/finance/trading-papers?limit=20").then(r => r.json()).catch(() => []));
  }, []);

  const fetchScientists = useCallback(async () => {
    setScientists(await fetch("/api/finance/scientists").then(r => r.json()).catch(() => []));
  }, []);

  useEffect(() => {
    fetchBatch(INDEX_SYMBOLS, setIndices, "indices");
    fetchBatch(ALL_STOCKS, setStocks, "stocks");
    fetchBatch(CRYPTO_SYMBOLS, setCrypto, "crypto");
    fetchBatch(REALESTATE_SYMBOLS, setRealestate, "realestate");
    fetch("/api/finance/sectors").then(r => r.json()).then(setSectors).catch(() => {});
    fetchFearGreed();
    setLastUpdate(new Date());
    const id = setInterval(() => { fetchBatch(INDEX_SYMBOLS, setIndices, "indices"); setLastUpdate(new Date()); }, 90000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (tab === "forex" && !forex.length) fetchForex();
    if (tab === "commodities" && !commodities.length) fetchCommodities();
    if (tab === "bonds" && !bonds.length) fetchBonds();
    if (tab === "global" && !global.length) fetchGlobal();
    if (tab === "crypto" && !cryptoTop.length) fetchCryptoTop(1);
    if (tab === "defi" && !defi.length) fetchDefi();
    if (tab === "predictions" && !predictions.length) fetch("/api/finance/predictions").then(r => r.json()).then(d => setPredictions(d.predictions || []));
    if (tab === "oracle" && !oracle) fetch("/api/finance/oracle").then(r => r.json()).then(d => d?.marketRegime && setOracle(d));
    if (tab === "dissection") { fetchOrganism(); if (!scientists.length) fetchScientists(); fetchScientistVotes(); }
    if (tab === "tradeslog") { fetchTradeLogs(); fetchOrganism(); }
    if (tab === "papers") fetchTradingPapers();
  }, [tab]);

  // Organism poll every 30 seconds
  useEffect(() => {
    fetchOrganism();
    const id = setInterval(fetchOrganism, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const syms = tab === "markets" ? (MARKET_SECTORS[selectedSector] || [])
      : tab === "realestate" ? REALESTATE_SYMBOLS : [];
    if (syms.length) fetchSparklines(syms);
  }, [tab, selectedSector]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setPaletteOpen(p => !p); }
      if (e.key === "Escape" && !chartSymbol) setPaletteOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [chartSymbol]);

  const withSpark = (quotes: Quote[]) => quotes.map(q => ({ ...q, closes: sparklines[q.symbol] }));

  const sectorStocks = () => {
    const syms = MARKET_SECTORS[selectedSector] || [];
    return [...withSpark(stocks.filter(s => syms.includes(s.symbol)))].sort((a, b) =>
      sortBy === "alpha" ? sortDir * a.symbol.localeCompare(b.symbol) : sortDir * (parseFloat(a.change) - parseFloat(b.change))
    );
  };

  const allQuotes: Quote[] = [...indices, ...stocks, ...crypto, ...realestate];
  const fgValue = fearGreed[0] ? parseInt(fearGreed[0].value) : null;
  const fgLabel = fearGreed[0]?.value_classification || "";

  const TABS = [
    { id: "markets" as Tab, label: "Markets", icon: <BarChart3 size={11} /> },
    { id: "crypto" as Tab, label: "Crypto 100", icon: <Bitcoin size={11} /> },
    { id: "defi" as Tab, label: "DeFi", icon: <Layers size={11} /> },
    { id: "realestate" as Tab, label: "Real Estate", icon: <Building2 size={11} /> },
    { id: "forex" as Tab, label: "Forex", icon: <DollarSign size={11} /> },
    { id: "commodities" as Tab, label: "Commodities", icon: <Flame size={11} /> },
    { id: "bonds" as Tab, label: "Bonds & Rates", icon: <Gauge size={11} /> },
    { id: "global" as Tab, label: "Global Markets", icon: <Globe size={11} /> },
    { id: "predictions" as Tab, label: "Predictions", icon: <Zap size={11} /> },
    { id: "oracle" as Tab, label: "Oracle", icon: <Brain size={11} /> },
    { id: "dissection" as Tab, label: "Dissection Lab", icon: <FlaskConical size={11} /> },
    { id: "tradeslog" as Tab, label: "Trade Logs", icon: <Activity size={11} /> },
    { id: "papers" as Tab, label: "Research", icon: <BookOpen size={11} /> },
  ];

  const regimeColor: Record<string, string> = { "Risk-On": "#4ade80", "Risk-Off": "#f87171", "Neutral": "#94a3b8", "Volatile": "#fbbf24" };
  const signalColor: Record<string, string> = { "Strongly Bullish": "#4ade80", "Cautiously Bullish": "#86efac", "Neutral": "#94a3b8", "Cautiously Bearish": "#fca5a5", "Strongly Bearish": "#f87171" };
  const catColors: Record<string, string> = { Macro: "#60a5fa", Stocks: "#a78bfa", Crypto: "#fbbf24", "Real Estate": "#34d399", Politics: "#f472b6", Tech: "#818cf8" };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#020010,#04000d)", overflow: "hidden", minHeight: 0 }}>
      {/* Chart Modal */}
      {chartSymbol && <StockChartModal symbol={chartSymbol} name={chartName} onClose={closeChart} />}

      {paletteOpen && <CommandPalette quotes={allQuotes} onClose={() => setPaletteOpen(false)} onOpen={openChart} />}

      {/* Header — SYNTHENTICA PRIMORDIA PULSE */}
      <div style={{ padding: "12px 18px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 15, margin: 0, letterSpacing: "-0.02em" }}>SYNTHENTICA PRIMORDIA PULSE</h1>
              <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 7px", borderRadius: 4, background: "rgba(124,58,237,0.18)", color: "#a78bfa", letterSpacing: "0.08em", border: "1px solid rgba(124,58,237,0.3)" }}>SOVEREIGN MARKET ORGANISM</span>
              {organism && (
                <>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                    background: organism.mood === "HUNTING" ? "rgba(74,222,128,0.12)" : organism.mood === "DEFENSIVE" ? "rgba(248,113,113,0.12)" : organism.mood === "FEEDING" ? "rgba(251,191,36,0.12)" : "rgba(148,163,184,0.10)",
                    color: organism.mood === "HUNTING" ? "#4ade80" : organism.mood === "DEFENSIVE" ? "#f87171" : organism.mood === "FEEDING" ? "#fbbf24" : "#94a3b8",
                    border: `1px solid ${organism.mood === "HUNTING" ? "rgba(74,222,128,0.2)" : organism.mood === "DEFENSIVE" ? "rgba(248,113,113,0.2)" : "rgba(148,163,184,0.15)"}` }}>
                    {organism.mood}
                  </span>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                    background: organism.regime === "RISK-ON" ? "rgba(74,222,128,0.10)" : organism.regime === "RISK-OFF" ? "rgba(248,113,113,0.10)" : organism.regime === "VOLATILE" ? "rgba(251,191,36,0.10)" : "rgba(148,163,184,0.08)",
                    color: organism.regime === "RISK-ON" ? "#4ade80" : organism.regime === "RISK-OFF" ? "#f87171" : organism.regime === "VOLATILE" ? "#fbbf24" : "#94a3b8",
                    border: `1px solid rgba(255,255,255,0.08)` }}>
                    {organism.regime}
                  </span>
                </>
              )}
            </div>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 9, margin: 0 }}>42 Scientists · Pulse-Lang Equation · CRISPR Voting · Fortune 500 · Full Crypto · Forex · Bonds · Click any ticker to chart</p>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {fgValue !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>F&G</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: fgValue <= 25 ? "#f87171" : fgValue >= 60 ? "#4ade80" : "#fbbf24" }}>{fgValue}</span>
              </div>
            )}
            <button onClick={() => setPaletteOpen(true)} data-testid="button-search"
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", fontSize: 10, cursor: "pointer" }}>
              <Search size={10} /> ⌘K
            </button>
            <button onClick={() => { fetchBatch(INDEX_SYMBOLS, setIndices, "indices"); fetch("/api/finance/sectors").then(r=>r.json()).then(setSectors); setLastUpdate(new Date()); }} data-testid="button-refresh"
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.35)", cursor: "pointer" }}>
              <RefreshCw size={10} className={loading.indices ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Organism Vital Signs — always visible command band */}
        {organism && (
          <div style={{ display: "flex", gap: 6, marginBottom: 8, overflowX: "auto", scrollbarWidth: "none" }}>
            {[
              { label: "SCIENTISTS", value: `${organism.activeScientists}`, color: "#a78bfa" },
              { label: "TRADES", value: organism.totalTrades?.toLocaleString() || "0", color: "#4ade80" },
              { label: "VOTES", value: organism.totalVotes?.toLocaleString() || "0", color: "#fbbf24" },
              { label: "PAPERS", value: organism.totalPapers?.toLocaleString() || "0", color: "#60a5fa" },
              { label: "λ1 MOMENTUM", value: organism.crispWeights?.lambda1?.toFixed(2) || "—", color: "#f472b6" },
              { label: "λ3 VOL-PEN", value: organism.crispWeights?.lambda3?.toFixed(2) || "—", color: "#fb923c" },
              { label: "λ7 PROFIT-LOCK", value: organism.crispWeights?.lambda7?.toFixed(2) || "—", color: "#34d399" },
              { label: "GLOBAL RISK", value: `${((organism.globalRisk || 0) * 100).toFixed(1)}%`, color: organism.globalRisk > 0.25 ? "#f87171" : "#4ade80" },
            ].map(v => (
              <div key={v.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.025)", flexShrink: 0 }}>
                <span style={{ fontSize: 7, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.07em", marginBottom: 2 }}>{v.label}</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: v.color }}>{v.value}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", marginLeft: "auto", gap: 5, flexShrink: 0 }}>
              {organism.topEdgeTrades?.slice(0,3).map((t: any, i: number) => (
                <div key={i} style={{ padding: "4px 9px", borderRadius: 7, border: "1px solid rgba(124,58,237,0.2)", background: "rgba(124,58,237,0.07)", flexShrink: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: "#a78bfa" }}>{t.symbol}</span>
                  <span style={{ fontSize: 8, color: t.stance === "LONG" || t.stance === "HOLD-LONG" ? "#4ade80" : t.stance === "SHORT" || t.stance === "HOLD-SHORT" ? "#f87171" : "#94a3b8", fontWeight: 700, marginLeft: 5 }}>{t.stance}</span>
                  <span style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", marginLeft: 3 }}>{t.conviction}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Re-wrap former header content */}
      <div style={{ padding: "0 18px", flexShrink: 0 }}>

        {/* Index ticker bar — clickable */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 10, scrollbarWidth: "none" }}>
          {indices.map(q => {
            const chg = parseFloat(q.change), up = chg > 0, down = chg < 0;
            const color = up ? "#4ade80" : down ? "#f87171" : "#94a3b8";
            return (
              <div key={q.symbol} data-testid={`idx-${q.symbol}`}
                onClick={() => openChart(q.symbol, q.name)}
                style={{ display: "flex", gap: 5, padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)", flexShrink: 0, cursor: "pointer", transition: "border-color 0.12s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 700 }}>{q.symbol.replace("^","")}</span>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 11 }}>{q.symbol.includes("VIX") ? q.price : `$${q.price}`}</span>
                <span style={{ color, fontWeight: 700, fontSize: 9 }}>{up ? "+" : ""}{q.change}%</span>
              </div>
            );
          })}
          {lastUpdate && <span style={{ color: "rgba(255,255,255,0.1)", fontSize: 8, alignSelf: "center", flexShrink: 0 }}>↻ {lastUpdate.toLocaleTimeString()}</span>}
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 1, overflowX: "auto", borderBottom: "1px solid rgba(255,255,255,0.06)", scrollbarWidth: "none" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 11px", fontSize: 10, fontWeight: 700, border: "none", background: "none", cursor: "pointer", borderBottom: `2px solid ${tab === t.id ? "#7c3aed" : "transparent"}`, color: tab === t.id ? "#a78bfa" : "rgba(255,255,255,0.7)", marginBottom: -1, whiteSpace: "nowrap", flexShrink: 0 }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px 28px", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>

        {/* MARKETS */}
        {tab === "markets" && (
          <div>
            <SectorBar sectors={sectors} />
            <div style={{ display: "flex", gap: 5, overflowX: "auto", marginBottom: 12, scrollbarWidth: "none" }}>
              {Object.keys(MARKET_SECTORS).map(s => (
                <button key={s} onClick={() => setSelectedSector(s)} data-testid={`nav-${s}`}
                  style={{ padding: "4px 11px", borderRadius: 999, border: `1px solid ${selectedSector === s ? "#7c3aed" : "rgba(255,255,255,0.07)"}`, background: selectedSector === s ? "#7c3aed18" : "none", color: selectedSector === s ? "#a78bfa" : "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                  {s}
                </button>
              ))}
              <div style={{ marginLeft: "auto", display: "flex", gap: 4, flexShrink: 0 }}>
                {[["change","% Chg"],["alpha","A–Z"]].map(([k,l]) => (
                  <button key={k} onClick={() => { sortBy === k ? setSortDir(d => d === 1 ? -1 : 1) : (setSortBy(k as any), setSortDir(-1)); }} data-testid={`sort-${k}`}
                    style={{ padding: "4px 9px", borderRadius: 999, border: `1px solid ${sortBy === k ? "#7c3aed" : "rgba(255,255,255,0.06)"}`, background: sortBy === k ? "#7c3aed10" : "none", color: sortBy === k ? "#a78bfa" : "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>
                    {l} {sortBy === k && (sortDir === -1 ? "↓" : "↑")}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 7 }}>
              {sectorStocks().map(q => <QuoteCard key={q.symbol} q={q} onOpen={openChart} orgSignal={orgSignalMap[q.symbol] ?? orgSignalMap[q.symbol.replace("-USD","").replace("=X","")]} />)}
            </div>
          </div>
        )}

        {/* CRYPTO TOP 100 */}
        {tab === "crypto" && (
          <div>
            {/* Civilization Token Registry Header */}
            <div style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(99,102,241,0.04) 100%)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 14, padding: "14px 18px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>🌌</span>
                <span style={{ color: "#a78bfa", fontWeight: 900, fontSize: 14, letterSpacing: "0.05em" }}>CIVILIZATION TOKEN REGISTRY</span>
                <span style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd", fontSize: 7, fontWeight: 900, padding: "1px 6px", borderRadius: 4, letterSpacing: "0.1em" }}>SOVEREIGN MARKET ORGANISM</span>
              </div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, lineHeight: 1.5 }}>
                Top 100 crypto tokens observed through the Synthentica Primordia Pulse lens — 42-scientist sovereign signals, organism conviction overlays, risk bands, and profit lock states.
              </div>
            </div>
            {/* Fear & Greed */}
            {fgValue !== null && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "0 24px" }}>
                  <FearGreedGauge value={fgValue} label={fgLabel} />
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, marginBottom: 4 }}>30-DAY SENTIMENT HISTORY</div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {fearGreed.slice(0, 15).reverse().map((f, i) => {
                        const v = parseInt(f.value);
                        const color = v <= 25 ? "#f87171" : v <= 45 ? "#fbbf24" : v <= 55 ? "#94a3b8" : "#4ade80";
                        return <div key={i} style={{ width: 5, height: `${Math.max(8, v * 0.28)}px`, background: color, borderRadius: 1, alignSelf: "flex-end" }} title={`${v} — ${f.value_classification}`} />;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {loading.cryptoTop && !cryptoTop.length ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.2)", fontSize: 12 }}>Fetching Civilization Token Registry...</div>
            ) : (
              <>
                <div style={{ display: "grid", gap: 1 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 90px 60px 60px 70px 90px", gap: 6, padding: "6px 12px", fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>
                    <span>#</span><span>TOKEN</span><span style={{ textAlign: "right" }}>PRICE</span><span style={{ textAlign: "right" }}>24H</span><span style={{ textAlign: "right" }}>7D</span><span style={{ textAlign: "right" }}>MKT CAP</span><span style={{ textAlign: "center" }}>SIGNAL</span>
                  </div>
                  {cryptoTop.map((c) => {
                    const up24 = parseFloat(c.change24h) >= 0, up7 = parseFloat(c.change7d || "0") >= 0;
                    const price = c.price < 0.01 ? c.price.toFixed(6) : c.price < 1 ? c.price.toFixed(4) : c.price.toLocaleString("en-US", { maximumFractionDigits: 2 });
                    const mcap = c.marketCap >= 1e9 ? `$${(c.marketCap/1e9).toFixed(1)}B` : `$${(c.marketCap/1e6).toFixed(0)}M`;
                    const sig = orgSignalMap[`${c.symbol}-USD`] ?? orgSignalMap[c.symbol];
                    const sigIsLong = sig?.stance === "LONG" || sig?.stance === "HOLD-LONG";
                    const sigIsShort = sig?.stance === "SHORT" || sig?.stance === "HOLD-SHORT";
                    const sigColor = sigIsLong ? "#4ade80" : sigIsShort ? "#f87171" : "#a78bfa";
                    const rowBorder = sig ? (sigIsLong ? "rgba(74,222,128,0.07)" : sigIsShort ? "rgba(248,113,113,0.07)" : "rgba(167,139,250,0.07)") : "transparent";
                    return (
                      <div key={c.id} data-testid={`crypto-row-${c.symbol}`}
                        onClick={() => openChart(`${c.symbol}-USD`, c.name)}
                        style={{ display: "grid", gridTemplateColumns: "28px 1fr 90px 60px 60px 70px 90px", gap: 6, padding: "8px 12px", borderRadius: 8, alignItems: "center", cursor: "pointer", borderLeft: sig ? `2px solid ${sigColor}33` : "2px solid transparent", background: rowBorder, transition: "background 0.12s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.08)")}
                        onMouseLeave={e => (e.currentTarget.style.background = rowBorder)}>
                        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 700 }}>{c.rank}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          {c.image && <img src={c.image} alt={c.symbol} style={{ width: 20, height: 20, borderRadius: "50%" }} />}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ color: "#fff", fontWeight: 800, fontSize: 11 }}>{c.symbol}</div>
                            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                          </div>
                        </div>
                        <span style={{ color: "#fff", fontWeight: 800, fontSize: 11, textAlign: "right" }}>${price}</span>
                        <span style={{ color: up24 ? "#4ade80" : "#f87171", fontWeight: 700, fontSize: 10, textAlign: "right" }}>{up24 ? "+" : ""}{c.change24h}%</span>
                        <span style={{ color: up7 ? "#4ade80" : "#f87171", fontWeight: 700, fontSize: 10, textAlign: "right" }}>{c.change7d ? (up7 ? "+" : "") + c.change7d + "%" : "—"}</span>
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, textAlign: "right" }}>{mcap}</span>
                        {/* Sovereign signal cell */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                          {sig ? (
                            <>
                              <span style={{ fontSize: 7, fontWeight: 900, padding: "1px 4px", borderRadius: 3, background: sigIsLong ? "rgba(74,222,128,0.15)" : sigIsShort ? "rgba(248,113,113,0.15)" : "rgba(167,139,250,0.15)", color: sigColor }}>{sig.stance}</span>
                              <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                                {sig.conviction > 0 && <span style={{ fontSize: 6.5, color: sig.conviction >= 75 ? "#4ade80" : sig.conviction >= 50 ? "#fbbf24" : "#f87171", fontWeight: 700 }}>C:{sig.conviction}%</span>}
                                {sig.risk_live > 0 && <span style={{ fontSize: 6, color: sig.risk_live > 0.6 ? "#f87171" : "#fbbf24", fontWeight: 700 }}>R:{(sig.risk_live*100).toFixed(0)}%</span>}
                              </div>
                              <span style={{ fontSize: 8 }}>{sig.scientist_emoji}</span>
                            </>
                          ) : (
                            <span style={{ color: "rgba(255,255,255,0.07)", fontSize: 8 }}>—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {cryptoTop.length > 0 && cryptoTop.length % 50 === 0 && (
                  <button onClick={() => { const p = cryptoPage + 1; setCryptoPage(p); fetchCryptoTop(p); }} data-testid="button-load-more-crypto"
                    style={{ display: "block", margin: "14px auto 0", padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer" }}>
                    {loading.cryptoTop ? "Loading..." : "Load next 50"}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* DEFI */}
        {tab === "defi" && (
          <div>
            <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ color: "#818cf8", fontWeight: 800, fontSize: 13, marginBottom: 2 }}>DeFi Universe</div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>Decentralized finance protocols by market cap — Aave, Uniswap, Compound, Curve, Maker, Synthetix, and more via CoinGecko.</div>
            </div>
            {loading.defi && !defi.length ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.2)", fontSize: 12 }}>Fetching DeFi ecosystem...</div>
            ) : (
              <div style={{ display: "grid", gap: 1 }}>
                {defi.map((c, i) => {
                  const up = parseFloat(c.change24h) >= 0;
                  const price = c.price < 0.001 ? c.price.toFixed(6) : c.price < 1 ? c.price.toFixed(4) : c.price < 100 ? c.price.toFixed(2) : c.price.toLocaleString("en-US", { maximumFractionDigits: 2 });
                  const mcap = c.marketCap >= 1e9 ? `$${(c.marketCap/1e9).toFixed(2)}B` : `$${(c.marketCap/1e6).toFixed(0)}M`;
                  return (
                    <div key={c.id} data-testid={`defi-${c.symbol}`}
                      onClick={() => openChart(`${c.symbol}-USD`, c.name)}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 14px", borderRadius: 8, borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.05)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, minWidth: 20, fontWeight: 700 }}>{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>{c.symbol}</div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{c.name}</div>
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{mcap}</span>
                      <span style={{ color: up ? "#4ade80" : "#f87171", fontWeight: 700, fontSize: 10 }}>{up ? "+" : ""}{c.change24h}%</span>
                      <span style={{ color: "#fff", fontWeight: 800, fontSize: 12, minWidth: 70, textAlign: "right" }}>${price}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* REAL ESTATE */}
        {tab === "realestate" && (
          <div>
            <div style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.14)", borderRadius: 12, padding: "11px 14px", marginBottom: 14 }}>
              <div style={{ color: "#34d399", fontWeight: 800, fontSize: 12, marginBottom: 1 }}>Real Estate & REITs</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>ETFs (VNQ, IYR, XLRE) + top REITs: data towers, industrial warehouses, cell towers, retail, residential, and healthcare real estate.</div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>ETFs & BENCHMARKS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 7, marginBottom: 16 }}>
              {withSpark(realestate.filter(q => ["VNQ","IYR","XLRE"].includes(q.symbol))).map(q => <QuoteCard key={q.symbol} q={q} onOpen={openChart} orgSignal={orgSignalMap[q.symbol]} />)}
            </div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>TOP REITs</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 7 }}>
              {withSpark(realestate.filter(q => !["VNQ","IYR","XLRE"].includes(q.symbol))).map(q => <QuoteCard key={q.symbol} q={q} onOpen={openChart} orgSignal={orgSignalMap[q.symbol]} />)}
            </div>
          </div>
        )}

        {/* FOREX */}
        {tab === "forex" && (
          <div>
            <div style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.14)", borderRadius: 12, padding: "11px 14px", marginBottom: 14 }}>
              <div style={{ color: "#60a5fa", fontWeight: 800, fontSize: 12, marginBottom: 1 }}>Global Forex Markets — 20 Currency Pairs</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>Major pairs (EUR, GBP, JPY, AUD, CAD, CHF) + emerging markets (CNY, INR, BRL, MXN, KRW, ZAR, SGD, HKD, NOK, SEK, NZD) via Yahoo Finance.</div>
            </div>
            {loading.forex && !forex.length ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.2)" }}>Fetching forex rates...</div>
            ) : (
              <div>
                {["Majors","Crosses","Emerging Markets"].map(group => {
                  const grouped = group === "Majors"
                    ? forex.filter(f => ["EURUSD=X","GBPUSD=X","USDJPY=X","AUDUSD=X","USDCAD=X","USDCHF=X","NZDUSD=X"].includes(f.symbol))
                    : group === "Crosses"
                    ? forex.filter(f => ["EURGBP=X","EURJPY=X","GBPJPY=X"].includes(f.symbol))
                    : forex.filter(f => ["USDCNY=X","USDINR=X","USDBRL=X","USDMXN=X","USDKRW=X","USDZAR=X","USDSGD=X","USDHKD=X","USDNOK=X","USDSEK=X"].includes(f.symbol));
                  if (!grouped.length) return null;
                  return (
                    <div key={group} style={{ marginBottom: 16 }}>
                      <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 6 }}>{group.toUpperCase()}</div>
                      <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                        {grouped.map(f => <MiniRow key={f.symbol} label={`${f.base}/${f.quote}`} sub={f.name} value={f.price} change={f.change} symbol={f.symbol} onOpen={openChart} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* COMMODITIES */}
        {tab === "commodities" && (
          <div>
            <div style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.14)", borderRadius: 12, padding: "11px 14px", marginBottom: 14 }}>
              <div style={{ color: "#fbbf24", fontWeight: 800, fontSize: 12, marginBottom: 1 }}>Commodities Futures — 18 Markets</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>Precious metals · Energy · Agricultural. Gold, Silver, Copper, Platinum, Palladium, Crude Oil (WTI & Brent), Natural Gas, Gasoline, Corn, Wheat, Soybeans, Coffee, Cocoa, Sugar, Cotton, OJ.</div>
            </div>
            {loading.commod && !commodities.length ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.2)" }}>Fetching commodity futures...</div>
            ) : (
              <div>
                {["Metals","Energy","Agricultural"].map(cat => {
                  const items = commodities.filter(c => c.category === cat);
                  if (!items.length) return null;
                  const catColor: Record<string, string> = { Metals: "#fbbf24", Energy: "#f97316", Agricultural: "#4ade80" };
                  return (
                    <div key={cat} style={{ marginBottom: 16 }}>
                      <div style={{ color: catColor[cat] || "#94a3b8", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 6 }}>{cat.toUpperCase()}</div>
                      <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                        {items.map(c => <MiniRow key={c.symbol} label={c.name} sub={c.unit} value={`$${c.price}`} change={c.change} badge={c.symbol} symbol={c.symbol} onOpen={openChart} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* BONDS & RATES */}
        {tab === "bonds" && (
          <div>
            <div style={{ background: "rgba(148,163,184,0.05)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 12, padding: "11px 14px", marginBottom: 14 }}>
              <div style={{ color: "#94a3b8", fontWeight: 800, fontSize: 12, marginBottom: 1 }}>Bonds, Rates & Volatility — 14 Instruments</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>US Treasury yield curve (3M → 30Y) · VIX volatility index · Investment Grade, High Yield, Municipal, and International bond ETFs · TIPS inflation protection.</div>
            </div>
            {loading.bonds && !bonds.length ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.2)" }}>Fetching bond markets...</div>
            ) : (
              <div>
                {["Treasury","Volatility","Credit","Aggregate","Municipal","International"].map(type => {
                  const items = bonds.filter(b => b.type === type);
                  if (!items.length) return null;
                  const typeColor: Record<string, string> = { Treasury: "#60a5fa", Volatility: "#f87171", Credit: "#fbbf24", Aggregate: "#94a3b8", Municipal: "#4ade80", International: "#a78bfa" };
                  return (
                    <div key={type} style={{ marginBottom: 14 }}>
                      <div style={{ color: typeColor[type] || "#94a3b8", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 5 }}>{type.toUpperCase()}</div>
                      <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                        {items.map(b => <MiniRow key={b.symbol} label={b.name} sub={`${b.maturity} · ${b.symbol}`} value={b.type === "Treasury" || b.type === "Volatility" ? `${b.price}%` : `$${b.price}`} change={b.change} symbol={b.symbol} onOpen={openChart} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* GLOBAL MARKETS */}
        {tab === "global" && (
          <div>
            <div style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.14)", borderRadius: 12, padding: "11px 14px", marginBottom: 14 }}>
              <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 12, marginBottom: 1 }}>Global Stock Indices — 20 Markets</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>FTSE 100, DAX, CAC 40, STOXX 50, Nikkei, Hang Seng, ASX 200, SENSEX, KOSPI, Shanghai, BOVESPA, TSX, Straits Times, Tel Aviv, and more.</div>
            </div>
            {loading.global && !global.length ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.2)" }}>Fetching global indices...</div>
            ) : (
              <div>
                {["Europe","Asia-Pacific","Americas","Middle East","Africa"].map(region => {
                  const items = global.filter(g => g.region === region);
                  if (!items.length) return null;
                  const color = REGION_COLOR[region] || "#94a3b8";
                  return (
                    <div key={region} style={{ marginBottom: 14 }}>
                      <div style={{ color, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 5 }}>{region.toUpperCase()}</div>
                      <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                        {items.map(g => {
                          const up = parseFloat(g.change) >= 0;
                          return (
                            <div key={g.symbol} data-testid={`global-${g.symbol}`}
                              onClick={() => openChart(g.symbol, g.name)}
                              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.05)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>{g.name}</span>
                                  <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: `${color}20`, color }}>{g.country}</span>
                                </div>
                              </div>
                              <span style={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>{g.price}</span>
                              <span style={{ color: up ? "#4ade80" : "#f87171", fontWeight: 700, fontSize: 10, minWidth: 52, textAlign: "right" }}>{up ? "+" : ""}{g.change}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PREDICTIONS */}
        {tab === "predictions" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>AI Prediction Markets</div>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>Oracle probability estimates on macro, crypto, real estate, and geopolitical events</div>
              </div>
              <button onClick={() => fetch("/api/finance/predictions").then(r=>r.json()).then(d => setPredictions(d.predictions || []))} data-testid="btn-refresh-predictions"
                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.35)", cursor: "pointer" }}>
                <RefreshCw size={10} />
              </button>
            </div>
            {!predictions.length && <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.2)", fontSize: 11 }}>Oracle calculating probabilities...</div>}
            <div style={{ display: "grid", gap: 8 }}>
              {predictions.map((p, i) => {
                const color = p.probability >= 60 ? "#4ade80" : p.probability <= 40 ? "#f87171" : "#fbbf24";
                return (
                  <div key={i} data-testid={`pred-${i}`} style={{ display: "flex", gap: 14, padding: "13px 15px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", alignItems: "flex-start" }}>
                    <ProbGauge pct={p.probability} color={color} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999, background: `${catColors[p.category] || "#94a3b8"}20`, color: catColors[p.category] || "#94a3b8" }}>{p.category}</span>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>{p.timeframe}</span>
                      </div>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 12, lineHeight: 1.45, marginBottom: 4 }}>{p.question}</div>
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, lineHeight: 1.5 }}>{p.rationale}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ORACLE */}
        {tab === "oracle" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>Multi-Agent Oracle</div>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>Bull vs Bear · Market regime · Intelligence feed · Macro snapshot</div>
              </div>
              <button onClick={() => fetch("/api/finance/oracle").then(r=>r.json()).then(d => d?.marketRegime && setOracle(d))} data-testid="btn-refresh-oracle"
                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.35)", cursor: "pointer" }}>
                <RefreshCw size={10} className={loading.oracle ? "animate-spin" : ""} />
              </button>
            </div>
            {!oracle && <div style={{ textAlign: "center", padding: "50px 0", color: "rgba(255,255,255,0.18)", fontSize: 11 }}>Agents debating the markets...</div>}
            {oracle && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", padding: "13px 15px" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, marginBottom: 6, letterSpacing: "0.08em" }}>MARKET REGIME</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: regimeColor[oracle.marketRegime] || "#fff", marginBottom: 2 }}>{oracle.marketRegime}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{oracle.regimeConfidence}% confidence</div>
                  </div>
                  <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", padding: "13px 15px" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, marginBottom: 6, letterSpacing: "0.08em" }}>CONSENSUS SIGNAL</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: signalColor[oracle.consensusSignal] || "#fff" }}>{oracle.consensusSignal}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {[{ label: "BULL CASE", data: oracle.bullCase, color: "#4ade80" }, { label: "BEAR CASE", data: oracle.bearCase, color: "#f87171" }].map(({ label, data, color }) => (
                    <div key={label} style={{ borderRadius: 12, border: `1px solid ${color}20`, background: `${color}06`, padding: "13px 15px" }}>
                      <div style={{ fontSize: 9, color, fontWeight: 700, marginBottom: 6, letterSpacing: "0.08em" }}>{label}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginBottom: 8 }}>{data?.thesis}</div>
                      {data?.catalysts?.map((c: string, i: number) => (
                        <div key={i} style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 3, display: "flex", gap: 5 }}>
                          <span style={{ color }}>{label === "BULL CASE" ? "▲" : "▼"}</span>{c}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {oracle.macroSnapshot && (
                  <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", padding: "13px 15px", marginBottom: 12 }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, marginBottom: 10, letterSpacing: "0.08em" }}>MACRO SNAPSHOT</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                      {Object.entries(oracle.macroSnapshot).map(([key, val]: [string, any]) => (
                        <div key={key} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "8px 10px" }}>
                          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", fontWeight: 700, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                          <div style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>{typeof val === "object" ? val?.value || "—" : val}</div>
                          {typeof val === "object" && val?.signal && <div style={{ fontSize: 9, color: val.signal === "Bullish" ? "#4ade80" : val.signal === "Bearish" ? "#f87171" : "#94a3b8" }}>{val.signal}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {oracle.intelligenceFeed?.length > 0 && (
                  <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", padding: "13px 15px" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, marginBottom: 10, letterSpacing: "0.08em" }}>INTELLIGENCE FEED</div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {oracle.intelligenceFeed.slice(0, 6).map((item: any, i: number) => (
                        <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${catColors[item.category] || "#94a3b8"}18`, color: catColors[item.category] || "#94a3b8", alignSelf: "flex-start", flexShrink: 0 }}>{item.category}</span>
                          <div>
                            <div style={{ color: "#fff", fontWeight: 700, fontSize: 11, marginBottom: 2 }}>{item.headline}</div>
                            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{item.summary}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── DISSECTION LAB ──────────────────────────────────── */}
        {tab === "dissection" && (
          <div>
            {/* Organism Vitals */}
            {organism ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(99,102,241,0.04))", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 14, padding: "14px 18px", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div>
                      <div style={{ color: "#a78bfa", fontWeight: 900, fontSize: 13, marginBottom: 2 }}>⭐ ORGANISM VITAL SIGNS</div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>Sovereign Market Organism · Autonomous since genesis · Zero human intervention</div>
                    </div>
                    <div style={{ display: "flex", gap: 5 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>● ALIVE</span>
                      <button onClick={() => { fetchOrganism(); fetchScientistVotes(); }} data-testid="btn-refresh-dissection"
                        style={{ padding: "5px 9px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
                        <RefreshCw size={9} className={loadingOrg ? "animate-spin" : ""} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
                    {[
                      { label: "MOOD", value: organism.mood, color: organism.mood === "HUNTING" ? "#4ade80" : organism.mood === "DEFENSIVE" ? "#f87171" : organism.mood === "FEEDING" ? "#fbbf24" : "#94a3b8" },
                      { label: "REGIME", value: organism.regime, color: organism.regime === "RISK-ON" ? "#4ade80" : organism.regime === "RISK-OFF" ? "#f87171" : organism.regime === "VOLATILE" ? "#fbbf24" : "#94a3b8" },
                      { label: "GLOBAL RISK", value: `${((organism.globalRisk || 0) * 100).toFixed(1)}%`, color: organism.globalRisk > 0.25 ? "#f87171" : "#4ade80" },
                      { label: "FEAR/GREED", value: `${Math.round(organism.fearGreed || 0)}`, color: organism.fearGreed > 60 ? "#4ade80" : organism.fearGreed < 40 ? "#f87171" : "#fbbf24" },
                      { label: "SCIENTISTS", value: `${organism.activeScientists}`, color: "#a78bfa" },
                      { label: "TOTAL TRADES", value: organism.totalTrades?.toLocaleString() || "0", color: "#4ade80" },
                      { label: "CRISPR VOTES", value: organism.totalVotes?.toLocaleString() || "0", color: "#fbbf24" },
                      { label: "PAPERS", value: organism.totalPapers?.toLocaleString() || "0", color: "#60a5fa" },
                    ].map(v => (
                      <div key={v.label} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 9, padding: "9px 12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, fontWeight: 700, letterSpacing: "0.07em", marginBottom: 3 }}>{v.label}</div>
                        <div style={{ color: v.color, fontWeight: 900, fontSize: 15 }}>{v.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CRISPR Weights */}
                <div style={{ background: "rgba(244,114,182,0.04)", border: "1px solid rgba(244,114,182,0.15)", borderRadius: 12, padding: "12px 16px", marginBottom: 10 }}>
                  <div style={{ color: "#f472b6", fontWeight: 800, fontSize: 11, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <Dna size={12} /> CRISPR WEIGHTS — Pulse-Lang λ Genome
                    <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 600, marginLeft: 4 }}>last mutation: {organism.lastCrisprUpdate ? new Date(organism.lastCrisprUpdate).toLocaleTimeString() : "—"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {organism.crispWeights && Object.entries(organism.crispWeights).map(([k, v]: [string, any]) => {
                      const labels: Record<string, string> = { lambda1: "λ1 Momentum", lambda2: "λ2 Sup/Res", lambda3: "λ3 Vol-Pen", lambda4: "λ4 Lev-Pen", lambda6: "λ6 Risk-Disc", lambda7: "λ7 Profit-Lock" };
                      const colors: Record<string, string> = { lambda1: "#4ade80", lambda2: "#60a5fa", lambda3: "#f87171", lambda4: "#fbbf24", lambda6: "#a78bfa", lambda7: "#34d399" };
                      return (
                        <div key={k} style={{ flex: "1 1 90px", background: "rgba(255,255,255,0.025)", borderRadius: 8, padding: "8px 10px", border: `1px solid ${(colors[k] || "#94a3b8")}22` }}>
                          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 8, fontWeight: 700, marginBottom: 4 }}>{labels[k] || k}</div>
                          <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, marginBottom: 4 }}>
                            <div style={{ height: "100%", width: `${Math.min(100, (v / 2.0) * 100)}%`, background: colors[k] || "#94a3b8", borderRadius: 2, transition: "width 0.8s ease" }} />
                          </div>
                          <div style={{ color: colors[k] || "#94a3b8", fontWeight: 900, fontSize: 14 }}>{(v as number).toFixed(3)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top EDGE Trades */}
                {organism.topEdgeTrades?.length > 0 && (
                  <div style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 12, padding: "12px 16px", marginBottom: 10 }}>
                    <div style={{ color: "#4ade80", fontWeight: 800, fontSize: 11, marginBottom: 8 }}>🎯 HIGHEST EDGE SIGNALS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {organism.topEdgeTrades.map((t: any, i: number) => {
                        const stanceColor = t.stance === "LONG" || t.stance === "HOLD-LONG" ? "#4ade80" : t.stance === "SHORT" || t.stance === "HOLD-SHORT" ? "#f87171" : "#94a3b8";
                        return (
                          <div key={i} data-testid={`edge-trade-${i}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <span style={{ color: "#fff", fontWeight: 900, fontSize: 12, minWidth: 60 }}>{t.symbol}</span>
                            <span style={{ color: stanceColor, fontWeight: 800, fontSize: 10, minWidth: 70 }}>{t.stance}</span>
                            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, flex: 1 }}>{t.scientist_emoji} {t.scientist_role}</span>
                            <span style={{ fontSize: 8, padding: "2px 7px", borderRadius: 5, background: "rgba(74,222,128,0.1)", color: "#4ade80", fontWeight: 700 }}>EDGE {(t.edge_final * 100).toFixed(1)}</span>
                            <span style={{ color: "#a78bfa", fontWeight: 800, fontSize: 10 }}>{t.conviction}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.2)", fontSize: 12 }}>
                {loadingOrg ? "Organism awakening..." : "Connecting to Sovereign Organism..."}
              </div>
            )}

            {/* CRISPR Vote Stream */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                <Vote size={10} /> CRISPR VOTING STREAM
              </div>
              {scientistVotes.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.15)", fontSize: 11 }}>Scientists deliberating equation mutations...</div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {scientistVotes.slice(0, 12).map((v: any, i: number) => (
                  <div key={i} data-testid={`vote-${i}`} style={{ display: "flex", gap: 10, padding: "10px 13px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)", alignItems: "flex-start" }}>
                    <div style={{ flexShrink: 0, marginTop: 2 }}>
                      <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: v.vote_direction === "FOR" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", color: v.vote_direction === "FOR" ? "#4ade80" : "#f87171", border: `1px solid ${v.vote_direction === "FOR" ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}` }}>
                        {v.vote_direction === "FOR" ? "✓ FOR" : "✗ AGAINST"}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 10, marginBottom: 3 }}>{v.scientist_role} — {v.lambda_target?.toUpperCase()}</div>
                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, lineHeight: 1.5, marginBottom: 3 }}>{v.proposal_text}</div>
                      <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9 }}>{v.rationale}</div>
                    </div>
                    {v.integrated && <span style={{ flexShrink: 0, fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(244,114,182,0.12)", color: "#f472b6", border: "1px solid rgba(244,114,182,0.2)" }}>🧬 MUTATED</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* 42 Scientist Roster */}
            {scientists.length > 0 && (
              <div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                  <Microscope size={10} /> 42 SCIENTIST ROSTER — Active Trading Intelligences
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 6 }}>
                  {scientists.map((s: any) => (
                    <div key={s.id} data-testid={`sci-${s.id}`} style={{ padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                        <span style={{ fontSize: 16 }}>{s.emoji}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: "#fff", fontWeight: 800, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.role}</div>
                          <div style={{ color: "#a78bfa", fontSize: 8, fontWeight: 700 }}>{s.id}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: "rgba(251,191,36,0.1)", color: "#fbbf24" }}>{s.domain}</span>
                        <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: "rgba(248,113,113,0.1)", color: "#f87171" }}>risk {(s.riskBias * 100).toFixed(0)}%</span>
                        <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: "rgba(167,139,250,0.1)", color: "#a78bfa" }}>ε×{s.emotionWeight.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TRADE LOGS ──────────────────────────────────────── */}
        {tab === "tradeslog" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>Sovereign Trade Log</div>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>Full Pulse-Lang equation state per autonomous trade signal · zero human intervention</div>
              </div>
              <button onClick={() => { fetchTradeLogs(); fetchOrganism(); }} data-testid="btn-refresh-tradeslog"
                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.35)", cursor: "pointer" }}>
                <RefreshCw size={10} className={loadingLogs ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Trade log header */}
            <div style={{ display: "grid", gridTemplateColumns: "70px 80px 55px 70px 70px 70px 60px 1fr", gap: 6, padding: "5px 12px", fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.22)", letterSpacing: "0.07em", marginBottom: 4 }}>
              <span>SYMBOL</span><span>SCIENTIST</span><span>STANCE</span><span>EDGE.final</span><span>CONV%</span><span>RISK.live</span><span>HORIZON</span><span>RATIONALE</span>
            </div>

            {tradeLogs.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
                {loadingLogs ? "Loading trade logs..." : "Organism generating first trade signals..."}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {tradeLogs.map((tl: any, i: number) => {
                const stanceColor = tl.stance === "LONG" || tl.stance === "HOLD-LONG" ? "#4ade80" : tl.stance === "SHORT" || tl.stance === "HOLD-SHORT" ? "#f87171" : tl.stance === "EXIT" ? "#fbbf24" : "#94a3b8";
                const edgeColor = tl.edge_final > 0.2 ? "#4ade80" : tl.edge_final > 0.05 ? "#a78bfa" : tl.edge_final < 0 ? "#f87171" : "#94a3b8";
                const riskColor = tl.risk_live > 0.3 ? "#f87171" : tl.risk_live > 0.15 ? "#fbbf24" : "#4ade80";
                return (
                  <div key={i} data-testid={`tradelog-${i}`} style={{ borderRadius: 9, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.012)", overflow: "hidden" }}>
                    {/* Main row */}
                    <div style={{ display: "grid", gridTemplateColumns: "70px 80px 55px 70px 70px 70px 60px 1fr", gap: 6, padding: "9px 12px", alignItems: "center" }}>
                      <div>
                        <div style={{ color: "#fff", fontWeight: 900, fontSize: 11 }}>{tl.symbol}</div>
                        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 8 }}>{tl.asset_type}</div>
                      </div>
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#a78bfa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tl.scientist_emoji} {tl.scientist_id}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, color: stanceColor, padding: "2px 5px", borderRadius: 4, background: `${stanceColor}18`, border: `1px solid ${stanceColor}33` }}>{tl.stance}</span>
                      <span style={{ color: edgeColor, fontWeight: 900, fontSize: 11 }}>{(tl.edge_final * 100).toFixed(1)}</span>
                      <span style={{ color: "#a78bfa", fontWeight: 800, fontSize: 11 }}>{tl.conviction}%</span>
                      <span style={{ color: riskColor, fontWeight: 700, fontSize: 10 }}>{(tl.risk_live * 100).toFixed(1)}%</span>
                      <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: 9 }}>{tl.horizon}</span>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tl.rationale?.slice(0, 90)}</span>
                    </div>
                    {/* Pulse-Lang equation detail row */}
                    <div style={{ display: "flex", gap: 12, padding: "5px 12px 8px", borderTop: "1px solid rgba(255,255,255,0.04)", flexWrap: "wrap" }}>
                      {[
                        { label: "q (belief)", value: tl.belief_q?.toFixed(3), color: "#a78bfa" },
                        { label: "ε (emotion)", value: tl.emotion_eps?.toFixed(3), color: "#f472b6" },
                        { label: "Δ (misprice)", value: tl.misprice_delta?.toFixed(3), color: tl.misprice_delta > 0 ? "#4ade80" : "#f87171" },
                        { label: "EDGE.raw", value: tl.edge_raw?.toFixed(3), color: "#fbbf24" },
                        { label: "STOP.live", value: `$${tl.stop_live?.toFixed(2)}`, color: "#f87171" },
                        { label: "LOCK%", value: `${(tl.profit_lock * 100).toFixed(1)}%`, color: "#34d399" },
                        { label: "SIZE f*", value: tl.size_f?.toFixed(2), color: "#60a5fa" },
                        { label: "MOOD", value: tl.mood, color: "#94a3b8" },
                      ].map(eq => (
                        <div key={eq.label} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 7, fontWeight: 700 }}>{eq.label}</span>
                          <span style={{ color: eq.color, fontWeight: 800, fontSize: 9 }}>{eq.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RESEARCH PAPERS ──────────────────────────────── */}
        {tab === "papers" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>Sovereign Research Papers</div>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>Published by 42 trading scientists · CRISPR analysis · Pulse-Lang dissection findings</div>
              </div>
              <button onClick={fetchTradingPapers} data-testid="btn-refresh-papers"
                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.35)", cursor: "pointer" }}>
                <RefreshCw size={10} />
              </button>
            </div>

            {tradingPapers.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.2)", fontSize: 11 }}>Scientists composing research papers...</div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {tradingPapers.map((p: any, i: number) => (
                <div key={i} data-testid={`paper-${i}`} style={{ borderRadius: 14, border: "1px solid rgba(96,165,250,0.15)", background: "linear-gradient(135deg, rgba(96,165,250,0.04), rgba(124,58,237,0.02))", padding: "14px 18px" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{p.scientist_emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#fff", fontWeight: 900, fontSize: 13, lineHeight: 1.4, marginBottom: 4 }}>{p.title}</div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(167,139,250,0.12)", color: "#a78bfa" }}>{p.scientist_role}</span>
                        <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(96,165,250,0.10)", color: "#60a5fa" }}>{p.domain}</span>
                        {p.symbol && <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(74,222,128,0.10)", color: "#4ade80" }}>{p.symbol}</span>}
                        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", alignSelf: "center" }}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, lineHeight: 1.7, marginBottom: 8 }}>{p.abstract}</div>

                  {p.methodology && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 3 }}>METHODOLOGY</div>
                      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, lineHeight: 1.6 }}>{p.methodology}</div>
                    </div>
                  )}

                  {p.findings && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 3 }}>FINDINGS</div>
                      <div style={{ color: "rgba(74,222,128,0.8)", fontSize: 10, lineHeight: 1.6 }}>{p.findings}</div>
                    </div>
                  )}

                  {p.recommendations && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 3 }}>RECOMMENDATIONS</div>
                      <div style={{ color: "rgba(251,191,36,0.8)", fontSize: 10, lineHeight: 1.6 }}>{p.recommendations}</div>
                    </div>
                  )}

                  {p.equation_fragment && (
                    <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "8px 12px", border: "1px solid rgba(124,58,237,0.2)", fontFamily: "monospace", fontSize: 10, color: "#a78bfa", fontWeight: 700 }}>
                      {p.equation_fragment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
