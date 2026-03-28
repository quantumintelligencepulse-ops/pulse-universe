import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, CrosshairMode, LineStyle, ColorType } from "lightweight-charts";
import { useDomainPing, UniversePulseBar } from "@/lib/universeResonance";
import { RefreshCw, Search, X, Bitcoin, BarChart3, ChevronUp, ChevronDown, Globe, Gauge, CandlestickChart, LineChart, Dna, Star, Bell, Settings, ChevronLeft, ChevronRight, FlaskConical, BookOpen, Activity, Zap, Brain, Layers } from "lucide-react";

// ── Market Status (crypto = always live, stocks = session-aware) ──
function getMarketStatus(symbol: string): { status: string; color: string; live: boolean; badge: string } {
  const isCrypto = symbol.endsWith("-USD") || symbol.endsWith("=X");
  if (isCrypto) return { status: "LIVE 24/7 · CRYPTO", color: "#4ade80", live: true, badge: "LIVE" };
  try {
    const now = new Date();
    const etOpts: Intl.DateTimeFormatOptions = { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short" };
    const parts = new Intl.DateTimeFormat("en-US", etOpts).formatToParts(now);
    const h = parseInt(parts.find(p=>p.type==="hour")?.value||"0");
    const m = parseInt(parts.find(p=>p.type==="minute")?.value||"0");
    const day = parts.find(p=>p.type==="weekday")?.value||"";
    const mins = h * 60 + m;
    if (day === "Sat" || day === "Sun") return { status: "Closed · Weekend", color: "rgba(255,255,255,0.25)", live: false, badge: "CLOSED" };
    if (mins >= 240 && mins < 570)  return { status: "Pre-Market LIVE", color: "#fbbf24", live: true, badge: "PRE" };
    if (mins >= 570 && mins < 960)  return { status: "Market Open · NYSE/NASDAQ", color: "#4ade80", live: true, badge: "LIVE" };
    if (mins >= 960 && mins < 1200) return { status: "After-Hours LIVE", color: "#60a5fa", live: true, badge: "AH" };
    return { status: "Market Closed", color: "rgba(255,255,255,0.25)", live: false, badge: "CLOSED" };
  } catch { return { status: "Market Data", color: "rgba(255,255,255,0.3)", live: false, badge: "—" }; }
}

// ── Symbol universes ─────────────────────────────────────────────
const MARKET_SECTORS: Record<string, string[]> = {
  "Tech":           ["AAPL","MSFT","NVDA","GOOGL","META","TSLA","AMD","ADBE","CRM","ORCL","QCOM","INTC","AMZN","INTU","NOW","SNPS","CDNS","FTNT","ANSS"],
  "AI & Cloud":     ["PLTR","AI","SNOW","DDOG","NET","CRWD","S","ZS","PANW","OKTA","MDB","GTLB","CFLT","PATH","ASAN","DOCN","HCP"],
  "Semiconductors": ["AVGO","TSM","ASML","MU","LRCX","AMAT","KLAC","MRVL","TXN","ON","STM","MPWR","ENTG","COHR","SMCI"],
  "Finance":        ["JPM","BAC","WFC","GS","V","MA","AXP","C","MS","BLK","SCHW","PGR","CB","MET","AIG","ALL","TRV","ICE","CME","NDAQ"],
  "Fintech":        ["PYPL","SQ","COIN","HOOD","SOFI","NU","AFRM","LC","UPST","OPEN","SMAR"],
  "Healthcare":     ["LLY","UNH","JNJ","ABBV","MRK","TMO","ABT","DHR","PFE","CVS","BMY","ISRG","REGN","GILD","BIIB","VRTX","ZBH","BSX","EW","HOLX"],
  "Energy":         ["XOM","CVX","COP","SLB","EOG","MPC","VLO","PSX","OXY","KMI","HAL","DVN","FANG","MRO","APA","PR","SM","CTRA"],
  "Consumer":       ["WMT","HD","MCD","COST","NKE","SBUX","TGT","PG","KO","PEP","LOW","TJX","AMZN","BABA","JD","PDD","EBAY","ETSY","W","RH"],
  "Automotive/EV":  ["TSLA","GM","F","RIVN","LCID","NIO","XPEV","LI","STLA","TM","HMC","NKLA","GOEV","BLNK","CHPT","EVGO"],
  "Industrial":     ["CAT","GE","HON","RTX","UPS","FDX","DE","LMT","NOC","GD","EMR","ETN","MMM","ROK","PH","ITW","CARR","OTIS","CPRT","CTAS"],
  "Comm/Media":     ["NFLX","DIS","T","VZ","CMCSA","SNAP","UBER","PINS","SPOT","WBD","PARA","FOX","LUMN","SIRI","IACI","FUBO","ROKU","MTCH"],
  "Materials":      ["LIN","APD","ECL","SHW","NEM","FCX","NUE","VMC","MLM","CF","MOS","ALB","BALL","PKG","IP","WRK","OI","FMC"],
  "Utilities":      ["NEE","DUK","SO","AEP","EXC","XEL","SRE","D","ED","AWK","WEC","ES","ETR","PPL","EIX","FE","AES","NRG"],
  "REITs":          ["AMT","PLD","EQIX","CCI","DLR","PSA","O","WELL","SPG","AVB","EQR","INVH","MAA","VNQ","IIPR","COLD","CUBE","NLY","AGNC"],
  "Biotech":        ["MRNA","BNTX","ARKG","EXAS","ILMN","PACB","TWST","NTLA","BEAM","CRSP","EDIT","BLUE","FATE","KYMR"],
};
const ALL_STOCKS = Object.values(MARKET_SECTORS).flat();
const CRYPTO_SYMBOLS = [
  "BTC-USD","ETH-USD","SOL-USD","BNB-USD","XRP-USD","ADA-USD","DOGE-USD","AVAX-USD",
  "LINK-USD","LTC-USD","DOT-USD","MATIC-USD","SHIB-USD","TRX-USD","NEAR-USD","ATOM-USD",
  "ALGO-USD","XLM-USD","HBAR-USD","VET-USD","ICP-USD","FIL-USD","SAND-USD","MANA-USD",
  "APE-USD","CHZ-USD","GALA-USD","ENJ-USD","CRV-USD","AAVE-USD","UNI-USD","SUSHI-USD",
  "COMP-USD","MKR-USD","SNX-USD","YFI-USD","BAL-USD","INCH-USD","ZRX-USD","OMG-USD",
];
const REALESTATE_SYMBOLS = ["VNQ","IYR","XLRE","AMT","PLD","EQIX","CCI","DLR","PSA","O","WELL","SPG","AVB","EQR","INVH","MAA"];
const INDEX_SYMBOLS = ["SPY","QQQ","DIA","IWM","^VIX","^GSPC","^DJI","^IXIC","^RUT","XLK","XLF","XLV","XLE","XLI","XLC","XLY","XLP","XLB","XLU","GLD","SLV","USO","TLT","HYG","BND"];
const NASDAQ_SET = new Set(["AAPL","MSFT","NVDA","GOOGL","META","TSLA","AMD","ADBE","CRM","ORCL","QCOM","AMZN","INTC","NFLX","CMCSA","COST","SBUX","ISRG","PLTR","SNOW","DDOG","NET","CRWD","PANW","MDB","RIVN"]);
const ETF_SET = new Set(["SPY","QQQ","DIA","IWM","VNQ","IYR","XLRE","XLK","XLF","XLV","XLE","XLI","XLC","XLY","XLP","XLB","XLU","GLD","SLV","USO","TLT","HYG","BND","ARKG"]);

type Quote = { symbol: string; price: string; change: string; name: string; currency?: string; closes?: number[] };
type Sector = { symbol: string; name: string; price: string; change: number };
type CryptoTop = { id: string; symbol: string; name: string; image: string; price: number; change24h: string; change7d: string; marketCap: number; rank: number; volume: number; ath: number; athChange: string };
type FearGreed = { value: string; value_classification: string; timestamp: string };
type ChartTF = "1m"|"5m"|"15m"|"30m"|"1h"|"4h"|"1D"|"1W"|"1M"|"3M"|"6M"|"1Y"|"5Y";
type ChartMode = "candle"|"line";
type WatchFilter = "STOCKS"|"CRYPTO"|"ETF"|"INDICES";
type RightTab = "classic"|"pulseai"|"lab";

function fmtVol(v: number) {
  if (!v) return "—";
  if (v >= 1e9) return `${(v/1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v/1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v/1e3).toFixed(0)}K`;
  return String(v);
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
  const result: any[] = [];
  for (let i = period - 1; i < ohlcv.length; i++) {
    const avg = closes.slice(i - period + 1, i + 1).reduce((a:number,b:number)=>a+b,0)/period;
    result.push({ time: ohlcv[i].time, value: parseFloat(avg.toFixed(4)) });
  }
  return result;
}
function computeEMA(values: number[], period: number): number[] {
  const k = 2/(period+1); const ema: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) ema.push(values[i]*k+ema[i-1]*(1-k));
  return ema;
}
function computeRSI(ohlcv: any[], period=14): {time:any;value:number}[] {
  if (ohlcv.length < period+1) return [];
  const closes = ohlcv.map((d:any)=>d.close);
  const result: {time:any;value:number}[] = [];
  let avgGain=0, avgLoss=0;
  for (let i=1; i<=period; i++) { const d=closes[i]-closes[i-1]; if(d>0) avgGain+=d; else avgLoss-=d; }
  avgGain/=period; avgLoss/=period;
  for (let i=period; i<closes.length; i++) {
    if (i>period) { const d=closes[i]-closes[i-1]; avgGain=(avgGain*(period-1)+Math.max(0,d))/period; avgLoss=(avgLoss*(period-1)+Math.max(0,-d))/period; }
    const rs = avgLoss===0?100:avgGain/avgLoss;
    result.push({ time: ohlcv[i].time, value: parseFloat((100-100/(1+rs)).toFixed(2)) });
  }
  return result;
}
function computeMACD(ohlcv: any[], fast=12, slow=26, signal=9): {time:any;macd:number;sig:number;hist:number}[] {
  if (ohlcv.length < slow+signal) return [];
  const closes = ohlcv.map((d:any)=>d.close);
  const emaFast = computeEMA(closes, fast), emaSlow = computeEMA(closes, slow);
  const macdLine = emaFast.map((v,i)=>v-emaSlow[i]);
  const signalLine = computeEMA(macdLine.slice(slow-1), signal);
  const result: {time:any;macd:number;sig:number;hist:number}[] = [];
  for (let i=slow-1+signal-1; i<closes.length; i++) {
    const si=i-(slow-1)-(signal-1), m=macdLine[i], s=signalLine[si];
    result.push({ time:ohlcv[i].time, macd:parseFloat(m.toFixed(4)), sig:parseFloat(s.toFixed(4)), hist:parseFloat((m-s).toFixed(4)) });
  }
  return result;
}
function computeBB(ohlcv: any[], period=20, mult=2): {time:any;upper:number;lower:number;mid:number}[] {
  if (ohlcv.length < period) return [];
  return ohlcv.slice(period-1).map((_:any,idx:number)=>{
    const sl=ohlcv.slice(idx,idx+period).map((d:any)=>d.close);
    const mid=sl.reduce((a:number,b:number)=>a+b,0)/period;
    const std=Math.sqrt(sl.reduce((a:number,b:number)=>a+(b-mid)**2,0)/period);
    return { time:ohlcv[idx+period-1].time, upper:mid+mult*std, lower:mid-mult*std, mid };
  });
}

// ── Full PULSE.UNIVERSE Equation ─────────────────────────────────
const PULSE_UNIVERSE_EQ = `PULSE.UNIVERSE = {

  // 1. CORE TRADE ORGANISM INVOCATION
  TRADE_ORGANISM.INVOKE(i, t, agent) = {

    // 1.1 BELIEF GENOME (CRISPR-FUSED)
    BELIEF.q :=
      SIGMOID(
            GENOMES[agent].α • FEATURES.base(i)
          + GENOMES[agent].β • FEATURES.signal(i,t)
          + GENOMES[agent].γ • FEATURES.macro(t)
          + GENOMES[agent].δ • FEATURES.reflexive(i,t)
      ),

    // 1.2 EMOTIONAL SPECTRUM & MISPRICING
    EMOTION.ε  := EMO_FIELD.STATE(t),
    MARKET.p   := MARKET_STATE.IMPLIED_PROB(i,t),
    MISPRICE.Δ := BELIEF.q - MARKET.p,
    EDGE.emotion := EMOTION.ε × MISPRICE.Δ,

    // 1.3 RAW EDGE FUSION
    EDGE.raw :=
          EDGE.emotion
        + GENOMES[agent].λ1 × SIGNALS.momentum(i,t)
        + GENOMES[agent].λ2 × SIGNALS.supres(i,t)
        - GENOMES[agent].λ3 × SIGNALS.volatility(i,t)
        - GENOMES[agent].λ4 × SIGNALS.leverage(i,t),

    // 1.4 PRODUCT-AWARE RISK BANDS & INITIAL STOP
    SL.band :=
      CASE ASSETS[i].type OF
        "STOCK"  -> [0.07, 0.15]
        "PENNY"  -> [0.07, 0.15]
        "OPTION" -> [0.30, 0.40]
        "CRYPTO" -> [0.30, 0.40],
    STOP.init := PRICES.entry(i) × (1 - CENTER(SL.band)),

    // 1.5 TRAILING STOP ORGANISM
    ATR.value       := VOL.ATR(i,t),
    STOP.width_factor := TRAIL.WIDTH(BELIEF.q, SIGNALS.momentum(i,t), ATR.value, ASSETS[i].type),
    STOP.candidate  := PRICES.current(i,t) - STOP.width_factor × ATR.value,
    STOP.live       := MAX( STOPS.prev(i), STOP.candidate ),

    // 1.6 LIVE RISK & PROFIT LOCK
    RISK.live   := ( PRICES.current(i,t) - STOP.live ) / PRICES.current(i,t),
    PROFIT.lock := ( STOP.live - PRICES.entry(i) ) / PRICES.entry(i),

    // 1.7 RISK DISCIPLINE & PROFIT REWARD
    RISK.target_band := [ SL.band.min, SL.band.max ],
    EDGE.disc    := EDGE.raw - GENOMES[agent].λ6 × ABS( RISK.live - CENTER(RISK.target_band) ),
    EDGE.profit  := GENOMES[agent].λ7 × PROFIT.lock,

    // 1.8 FINAL EDGE
    EDGE.final := EDGE.disc + EDGE.profit,

    // 1.9 POSITION INTENT
    SIZE.intent := EDGE.final / RISK.live
  },

  // 2. CRISPR MUTATION MODULE
  CRISPR.UPDATE_GENOME(agent, TRADE_HISTORY) = {
    PERFORMANCE  := EVALUATE_PERFORMANCE(TRADE_HISTORY),
    SENSITIVITY  := ESTIMATE_SENSITIVITY(PERFORMANCE, GENOMES[agent]),
    GENOMES[agent] := ADAPT_PARAMETERS(GENOMES[agent], SENSITIVITY, CONSTRAINTS.safety)
  },

  // 3. EMOTIONAL SPECTRUM MODULE
  EMO_FIELD.STATE(t) = {
    INPUTS := { VOL.global(t), NEWS.shock_index(t), FLOW.risk_on_off(t), SENTIMENT.social(t), OPTIONS.skew(t) },
    EMOTION.ε := MAP_TO_RANGE( INPUTS, [-1, +1] )   // fear → greed
  }.EMOTION.ε,

  // 4. TRAILING STOP WIDTH MODULE
  TRAIL.WIDTH(belief_q, momentum, atr, asset_type) = {
    CONFIDENCE_FACTOR := MAP_CONFIDENCE_TO_WIDTH(belief_q),
    MOMENTUM_FACTOR   := MAP_MOMENTUM_TO_STRETCH(momentum),
    VOL_FACTOR        := MAP_ATR_TO_SAFETY(atr, asset_type),
    WIDTH := CONFIDENCE_FACTOR × MOMENTUM_FACTOR × VOL_FACTOR
  }.WIDTH,

  // 5. AGENT TRAINING LOOP
  AGENT.TRAIN(agent, UNIVERSE_DEF) = {
    FOR each episode IN TRAINING_SCHEDULE(UNIVERSE_DEF) DO
      MARKET_PATH   := SAMPLE_MARKET_PATH(UNIVERSE_DEF, episode),
      TRADE_HISTORY := SIMULATE(agent, MARKET_PATH, using TRADE_ORGANISM.INVOKE),
      CRISPR.UPDATE_GENOME(agent, TRADE_HISTORY)
    END FOR
  }
}`;

// ── Scientist card data (42 types mirroring the engine) ──────────
const SCIENTIST_CARDS = [
  { id:"QUANT-ALPHA", role:"Quantitative Analyst", emoji:"📐", domain:"Stocks", spec:"Statistical arbitrage, alpha decay modeling", l1:0.8, l2:0.6, l3:0.7, l4:0.5, l6:0.9, l7:0.6 },
  { id:"MATH-PRIME",  role:"Financial Mathematician", emoji:"∑", domain:"Options", spec:"Stochastic calculus, PDE pricing models", l1:0.6, l2:0.9, l3:0.8, l4:0.7, l6:0.8, l7:0.5 },
  { id:"COMPU-CALC",  role:"Computational Finance Scientist", emoji:"💻", domain:"Stocks", spec:"HPC simulation, Monte Carlo, GPU compute", l1:0.9, l2:0.7, l3:0.6, l4:0.4, l6:0.7, l7:0.7 },
  { id:"ALGO-TRACE",  role:"Algorithmic Trading Researcher", emoji:"⚡", domain:"Stocks", spec:"Signal generation, backtest frameworks", l1:1.0, l2:0.5, l3:0.5, l4:0.3, l6:0.6, l7:0.8 },
  { id:"ECON-STAT",   role:"Time-Series Econometrician", emoji:"📊", domain:"Forex", spec:"GARCH, VAR, cointegration, regime models", l1:0.7, l2:0.8, l3:0.9, l4:0.4, l6:0.8, l7:0.5 },
  { id:"ML-FORGE",    role:"ML Researcher (Finance)", emoji:"🤖", domain:"Crypto", spec:"Deep learning, transformer price models", l1:0.9, l2:0.6, l3:0.5, l4:0.6, l6:0.7, l7:0.7 },
  { id:"COMPLEX-MAP", role:"Complexity Scientist", emoji:"🌀", domain:"Stocks", spec:"Network effects, emergent market behavior", l1:0.6, l2:0.7, l3:0.8, l4:0.5, l6:0.6, l7:0.6 },
  { id:"CHAOS-FIELD", role:"Chaos Theorist", emoji:"🌪️", domain:"Crypto", spec:"Fractal dimension, Lyapunov exponent trading", l1:0.5, l2:0.4, l3:0.4, l4:0.8, l6:0.5, l7:0.8 },
  { id:"MACRO-LENS",  role:"Macroeconomist", emoji:"🌍", domain:"Indices", spec:"Yield curve, GDP flows, central bank policy", l1:0.5, l2:0.8, l3:1.0, l4:0.4, l6:0.9, l7:0.4 },
  { id:"BEHAV-ECON",  role:"Behavioral Economist", emoji:"🧠", domain:"Stocks", spec:"Prospect theory, sentiment mispricing", l1:0.6, l2:0.5, l3:0.6, l4:0.3, l6:0.7, l7:0.6 },
  { id:"GAME-STRAT",  role:"Game Theorist", emoji:"♟️", domain:"Options", spec:"Nash equilibria, strategic option positioning", l1:0.7, l2:0.7, l3:0.6, l4:0.6, l6:0.8, l7:0.7 },
  { id:"MONEY-PULSE", role:"Monetary Policy Researcher", emoji:"🏦", domain:"Bonds", spec:"Fed model, duration risk, rate curve trading", l1:0.4, l2:0.9, l3:1.0, l4:0.3, l6:0.9, l7:0.3 },
  { id:"FX-GLOBE",    role:"International Finance Scholar", emoji:"💱", domain:"Forex", spec:"Carry trade, PPP deviations, capital flows", l1:0.6, l2:0.8, l3:0.8, l4:0.4, l6:0.7, l7:0.5 },
  { id:"MICRO-ORDER", role:"Market Microstructure Researcher", emoji:"🔬", domain:"Stocks", spec:"Order book dynamics, bid-ask spread alpha", l1:1.0, l2:0.9, l3:0.7, l4:0.4, l6:0.8, l7:0.6 },
  { id:"HFT-PULSE",   role:"High-Frequency Trading Scientist", emoji:"⚡", domain:"Stocks", spec:"Sub-millisecond signal processing, co-location", l1:1.2, l2:0.4, l3:0.3, l4:0.2, l6:0.5, l7:0.9 },
  { id:"EXEC-ALGO",   role:"Execution Algorithm Engineer", emoji:"🎯", domain:"Stocks", spec:"VWAP, TWAP, implementation shortfall", l1:0.8, l2:0.7, l3:0.6, l4:0.3, l6:0.8, l7:0.7 },
  { id:"DERIV-CRAFT", role:"Derivatives Engineer", emoji:"🔩", domain:"Options", spec:"Greeks management, vol surface arbitrage", l1:0.7, l2:0.8, l3:0.7, l4:0.8, l6:0.9, l7:0.6 },
  { id:"RISK-GUARD",  role:"Risk Manager", emoji:"🛡️", domain:"Indices", spec:"VaR, CVaR, drawdown limits, tail risk hedge", l1:0.5, l2:0.6, l3:1.1, l4:0.6, l6:1.2, l7:0.4 },
  { id:"HEDGE-STRAT", role:"Hedge Fund Strategist", emoji:"🏆", domain:"Stocks", spec:"Long/short equity, factor exposure neutralization", l1:0.8, l2:0.7, l3:0.7, l4:0.5, l6:0.8, l7:0.7 },
  { id:"PORT-OPTIM",  role:"Portfolio Optimization Researcher", emoji:"📈", domain:"Stocks", spec:"Markowitz frontier, Black-Litterman, CVX", l1:0.6, l2:0.7, l3:0.8, l4:0.5, l6:0.9, l7:0.5 },
  { id:"DECIS-MIND",  role:"Decision Scientist", emoji:"🎲", domain:"Stocks", spec:"Bayesian updating, Kelly criterion sizing", l1:0.7, l2:0.6, l3:0.6, l4:0.4, l6:0.7, l7:0.8 },
  { id:"REFLEXIV",    role:"Reflexivity Theorist", emoji:"♾️", domain:"Stocks", spec:"Soros reflexivity loops, feedback detection", l1:0.6, l2:0.5, l3:0.7, l4:0.5, l6:0.7, l7:0.6 },
  { id:"SENT-QUANT",  role:"Sentiment Quantifier", emoji:"📡", domain:"Stocks", spec:"NLP news scoring, social signal extraction", l1:0.5, l2:0.6, l3:0.6, l4:0.4, l6:0.6, l7:0.7 },
  { id:"FLOW-TRACE",  role:"Options Flow Analyst", emoji:"🌊", domain:"Options", spec:"Unusual options activity, dark pool flow", l1:0.6, l2:0.7, l3:0.7, l4:0.7, l6:0.8, l7:0.6 },
  { id:"ALPHA-HUNT",  role:"Alpha Researcher", emoji:"🔭", domain:"Stocks", spec:"Factor discovery, anomaly persistence testing", l1:0.9, l2:0.6, l3:0.7, l4:0.4, l6:0.7, l7:0.7 },
  { id:"DARK-POOL",   role:"Dark Pool Intelligence Agent", emoji:"🕵️", domain:"Stocks", spec:"Hidden liquidity, block trade detection", l1:0.7, l2:0.9, l3:0.6, l4:0.4, l6:0.7, l7:0.6 },
  { id:"CRISPR-OPS",  role:"CRISPR Genome Operator", emoji:"🧬", domain:"Crypto", spec:"Genome mutation, weight evolution, CRISPR voting", l1:0.7, l2:0.7, l3:0.7, l4:0.5, l6:0.8, l7:0.7 },
  { id:"PULSE-ARCH",  role:"Pulse-Lang Architect", emoji:"⭐", domain:"Stocks", spec:"Master of the PULSE.TRADE equation invocation", l1:0.9, l2:0.8, l3:0.7, l4:0.5, l6:0.9, l7:0.8 },
  { id:"CRYPTO-SAGE", role:"Crypto Market Sage", emoji:"₿", domain:"Crypto", spec:"On-chain analysis, mempool dynamics, DeFi flows", l1:0.8, l2:0.7, l3:0.6, l4:0.7, l6:0.7, l7:0.8 },
  { id:"VOL-HARVEST", role:"Volatility Harvester", emoji:"📉", domain:"Options", spec:"Volatility arbitrage, VIX derivatives, variance swaps", l1:0.5, l2:0.6, l3:1.0, l4:0.7, l6:0.9, l7:0.5 },
  { id:"MOMENTUM-X",  role:"Momentum Signal Specialist", emoji:"🚀", domain:"Stocks", spec:"Cross-sectional momentum, time-series momentum", l1:1.1, l2:0.5, l3:0.5, l4:0.3, l6:0.6, l7:0.8 },
  { id:"MACRO-SHIFT", role:"Regime Detection Scientist", emoji:"🔄", domain:"Indices", spec:"Hidden Markov Models, regime switching filters", l1:0.5, l2:0.7, l3:0.9, l4:0.5, l6:0.9, l7:0.5 },
  { id:"LIQUIDITY",   role:"Liquidity Research Scientist", emoji:"💧", domain:"Stocks", spec:"Market depth analysis, funding liquidity risk", l1:0.6, l2:0.8, l3:0.8, l4:0.6, l6:0.8, l7:0.5 },
  { id:"BEHAV-FIN",   role:"Behavioral Finance Researcher", emoji:"👁️", domain:"Stocks", spec:"Anchoring bias, herding detection, market psychology", l1:0.6, l2:0.5, l3:0.6, l4:0.3, l6:0.7, l7:0.6 },
  { id:"ESG-QUANT",   role:"ESG Quantitative Analyst", emoji:"🌿", domain:"Stocks", spec:"ESG factor premium, sustainability arbitrage", l1:0.5, l2:0.6, l3:0.7, l4:0.4, l6:0.8, l7:0.5 },
  { id:"CYCLE-SAGE",  role:"Market Cycle Theorist", emoji:"🔁", domain:"Indices", spec:"Elliott wave, Gann analysis, super-cycle detection", l1:0.5, l2:0.8, l3:0.7, l4:0.5, l6:0.7, l7:0.5 },
  { id:"PREDICT-GOD", role:"Prediction Market Scientist", emoji:"🎭", domain:"Stocks", spec:"Kalshi probability vs belief genome divergence", l1:0.6, l2:0.6, l3:0.6, l4:0.4, l6:0.7, l7:0.7 },
  { id:"NEURAL-GRID", role:"Neural Finance Researcher", emoji:"🕸️", domain:"Crypto", spec:"LSTM price prediction, attention mechanisms", l1:0.9, l2:0.6, l3:0.5, l4:0.6, l6:0.7, l7:0.7 },
  { id:"SUPPLY-DEM",  role:"Supply & Demand Scientist", emoji:"⚖️", domain:"Stocks", spec:"Volume profile, S/R zones, auction market theory", l1:0.6, l2:1.0, l3:0.7, l4:0.4, l6:0.7, l7:0.6 },
  { id:"ARBIT-PRIME", role:"Statistical Arbitrageur", emoji:"🔀", domain:"Stocks", spec:"Pairs trading, cointegration, spread reversion", l1:0.7, l2:0.8, l3:0.7, l4:0.5, l6:0.8, l7:0.6 },
  { id:"TEMPORAL",    role:"Temporal Analysis Scientist", emoji:"⏱️", domain:"Stocks", spec:"Intraday patterns, session timing, overnight gaps", l1:0.8, l2:0.6, l3:0.6, l4:0.3, l6:0.7, l7:0.8 },
  { id:"SOVEREIGN",   role:"Sovereign Intelligence Warden", emoji:"👑", domain:"All", spec:"Oversees all 42 scientists, meta-strategy curator", l1:0.9, l2:0.9, l3:0.9, l4:0.6, l6:1.0, l7:0.9 },
];

// ── Scientist ID Cards Panel ──────────────────────────────────────
function ScientistCardsPanel({ tradeLogs, paperAccounts, onClose, onSelectSymbol }: { tradeLogs: any[]; paperAccounts: any[]; onClose: () => void; onSelectSymbol: (sym: string, name: string) => void }) {
  const [search, setSearch] = useState("");
  const filtered = search ? SCIENTIST_CARDS.filter(s => s.role.toLowerCase().includes(search.toLowerCase()) || s.domain.toLowerCase().includes(search.toLowerCase()) || s.id.includes(search.toUpperCase())) : SCIENTIST_CARDS;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:9999, display:"flex", flexDirection:"column", backdropFilter:"blur(4px)" }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", maxWidth:1300, width:"100%", margin:"0 auto", padding:"20px 16px", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexShrink:0 }}>
          <span style={{ fontSize:18, fontWeight:900, color:"#a78bfa" }}>👑 SOVEREIGN SCIENTIST REGISTRY</span>
          <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:4, background:"rgba(124,58,237,0.2)", color:"#c4b5fd" }}>42 ACTIVE SCIENTISTS · CLEARANCE REQUIRED</span>
          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", borderRadius:6, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.02)" }}>
              <Search size={10} style={{ color:"rgba(255,255,255,0.4)" }} />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search scientists…" style={{ background:"none", border:"none", outline:"none", color:"#fff", fontSize:11, width:150 }} />
            </div>
            <button onClick={onClose} style={{ padding:"5px 10px", borderRadius:6, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontSize:10 }}>✕ Close</button>
          </div>
        </div>

        {/* ID warning banner */}
        <div style={{ padding:"8px 16px", borderRadius:8, background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.2)", marginBottom:14, flexShrink:0 }}>
          <span style={{ color:"#fbbf24", fontWeight:700, fontSize:10 }}>🔒 SOVEREIGN ACCESS PROTOCOL</span>
          <span style={{ color:"rgba(255,255,255,0.5)", fontSize:9, marginLeft:10 }}>All 42 scientist IDs verified. Full dossier access granted. Research papers, trade history, and genome weights displayed below.</span>
        </div>

        {/* Cards grid */}
        <div style={{ flex:1, overflowY:"auto", display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:10, paddingBottom:10, scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,0.06) transparent" }}>
          {filtered.map(s => {
            const currentTrade = tradeLogs.find(t => t.scientist_id === s.id || t.scientist_role === s.role);
            const isLong = currentTrade?.stance === "LONG" || currentTrade?.stance === "HOLD-LONG";
            const acct = paperAccounts.find((a:any) => a.scientist_id === s.id);
            const bal = acct ? parseFloat(acct.balance) : null;
            const pnl = acct ? parseFloat(acct.total_pnl) : 0;
            const wr = acct && acct.total_trades > 0 ? Math.round((acct.winning_trades / acct.total_trades) * 100) : null;
            return (
              <div key={s.id} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px", borderTop:`2px solid ${currentTrade ? (isLong ? "#4ade80" : "#f87171") : "#7c3aed"}` }}>
                {/* ID card header */}
                <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:8 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:"rgba(124,58,237,0.15)", border:"1px solid rgba(124,58,237,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{s.emoji}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:"#fff", fontWeight:800, fontSize:11, lineHeight:1.3, marginBottom:1 }}>{s.role}</div>
                    <div style={{ color:"#a78bfa", fontWeight:700, fontSize:9, fontFamily:"monospace" }}>ID: {s.id}</div>
                    <div style={{ color:"rgba(255,255,255,0.4)", fontSize:8 }}>Domain: {s.domain}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
                    {currentTrade && (
                      <div style={{ fontSize:7, fontWeight:900, padding:"2px 5px", borderRadius:3, background:isLong?"rgba(74,222,128,0.15)":"rgba(248,113,113,0.15)", color:isLong?"#4ade80":"#f87171", whiteSpace:"nowrap" }}>
                        {currentTrade.stance} {currentTrade.symbol}
                      </div>
                    )}
                    {bal!=null && (
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end" }}>
                        <span style={{ fontSize:9, fontWeight:900, color:bal>=100?"#4ade80":"#f87171" }}>${bal.toFixed(2)}</span>
                        <span style={{ fontSize:6.5, color:"rgba(255,255,255,0.3)" }}>{pnl>=0?"+":""}{pnl.toFixed(2)} PnL · {wr!=null?`${wr}% WR`:""}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Specialization */}
                <div style={{ color:"rgba(255,255,255,0.5)", fontSize:8.5, marginBottom:8, lineHeight:1.4 }}>{s.spec}</div>

                {/* λ weights */}
                <div style={{ marginBottom:8 }}>
                  <div style={{ color:"rgba(255,255,255,0.25)", fontSize:7, fontWeight:700, marginBottom:4 }}>CRISPR λ GENOME</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:3 }}>
                    {[["λ1",s.l1,"#4ade80"],["λ2",s.l2,"#60a5fa"],["λ3",s.l3,"#f87171"],["λ4",s.l4,"#fbbf24"],["λ6",s.l6,"#a78bfa"],["λ7",s.l7,"#34d399"]].map(([name,val,col])=>(
                      <div key={String(name)} style={{ display:"flex", gap:3, alignItems:"center" }}>
                        <span style={{ color:String(col), fontSize:7, fontWeight:700, minWidth:14 }}>{String(name)}</span>
                        <div style={{ flex:1, height:3, background:"rgba(255,255,255,0.06)", borderRadius:2 }}>
                          <div style={{ width:`${Math.min(100,(Number(val)/1.4)*100)}%`, height:"100%", background:String(col), borderRadius:2 }} />
                        </div>
                        <span style={{ color:"rgba(255,255,255,0.5)", fontSize:6.5, minWidth:20, textAlign:"right" }}>{Number(val).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current trade stats */}
                {currentTrade && (
                  <div style={{ padding:"6px 8px", borderRadius:6, background:"rgba(124,58,237,0.06)", border:"1px solid rgba(124,58,237,0.12)", marginBottom:8 }}>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {[["EDGE",(currentTrade.edge_final*100)?.toFixed(1)+""],["CVX",currentTrade.conviction+"%"],["RISK",(currentTrade.risk_live*100)?.toFixed(0)+"%"],["LOCK",(currentTrade.profit_lock*100)?.toFixed(0)+"%"],["SIZE f*",currentTrade.size_f?.toFixed(2)]].map(([l,v])=>(
                        <div key={String(l)}>
                          <div style={{ color:"rgba(255,255,255,0.3)", fontSize:6.5, fontWeight:700 }}>{String(l)}</div>
                          <div style={{ color:"#fff", fontSize:8, fontWeight:800 }}>{String(v)}</div>
                        </div>
                      ))}
                    </div>
                    {currentTrade.symbol && (
                      <button onClick={()=>{ onSelectSymbol(currentTrade.symbol, currentTrade.symbol); onClose(); }}
                        style={{ marginTop:5, width:"100%", padding:"3px 0", fontSize:8, fontWeight:700, border:"none", borderRadius:4, background:"rgba(124,58,237,0.2)", color:"#a78bfa", cursor:"pointer" }}>
                        → View {currentTrade.symbol} Chart
                      </button>
                    )}
                  </div>
                )}

                {/* Open dossier link */}
                <a href="/sovereign-dossier" style={{ display:"block", textAlign:"center", padding:"4px 0", fontSize:8, fontWeight:700, color:"rgba(255,255,255,0.35)", textDecoration:"none", borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:6 }}>
                  📋 Open Full Dossier
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Embedded Chart (inline, Bloomberg-style) ─────────────────────
function EmbeddedChart({
  symbol, name, orgSignal, onDataLoad, watchlistOpen, onToggleWatchlist, aiTradeMode, paperTradeMode, tradeMarkers, paperTrades
}: {
  symbol: string; name?: string; orgSignal?: any; onDataLoad?: (d:any)=>void;
  watchlistOpen?: boolean; onToggleWatchlist?: ()=>void;
  aiTradeMode?: boolean; paperTradeMode?: boolean;
  tradeMarkers?: any[]; paperTrades?: any[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const mainSeriesRef = useRef<any>(null);
  const [tf, setTF] = useState<ChartTF>("3M");
  const [mode, setMode] = useState<ChartMode>("candle");
  const [indicators, setIndicators] = useState({ ma20:true, ma50:false, ma200:false, volume:true, bb:false, rsi:true, macd:true });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState<any>(null);
  const [rsiData, setRsiData] = useState<{time:any;value:number}[]>([]);
  const [macdData, setMacdData] = useState<{time:any;macd:number;sig:number;hist:number}[]>([]);
  const isCrypto = symbol.endsWith("-USD") || symbol.endsWith("=X");
  const chg = parseFloat(data?.change??"0");
  const up = chg > 0;
  const intraday = ["1m","5m","15m","30m","1h","4h"].includes(tf);

  const TF_GROUPS: { label: string; tfs: ChartTF[] }[] = [
    { label: "INTRADAY", tfs: ["1m","5m","15m","30m","1h","4h","1D"] },
    { label: "SWING",    tfs: ["1W","1M","3M","6M","1Y","5Y"] },
  ];

  useEffect(() => {
    setLoading(true); setData(null);
    fetch(`/api/finance/chart/${encodeURIComponent(symbol)}?tf=${tf}`)
      .then(r=>r.json()).then(d=>{ setData(d); setLoading(false); onDataLoad?.(d); })
      .catch(()=>setLoading(false));
  }, [symbol, tf]);

  useEffect(() => {
    if (!data?.ohlcv?.length) return;
    const seenT = new Map<any,any>();
    for (const c of data.ohlcv) seenT.set(c.time, c);
    const clean = Array.from(seenT.values()).sort((a,b)=>a.time<b.time?-1:1);
    setRsiData(computeRSI(clean));
    setMacdData(computeMACD(clean));
  }, [data]);

  useEffect(() => {
    if (!data?.ohlcv?.length || !containerRef.current) return;
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
    const seenTimes = new Map<any,any>();
    for (const c of data.ohlcv) seenTimes.set(c.time, c);
    const cleanOhlcv = Array.from(seenTimes.values()).sort((a,b)=>a.time<b.time?-1:a.time>b.time?1:0);

    const chart = createChart(containerRef.current, {
      layout: { background:{ type:ColorType.Solid, color:"#04000a" }, textColor:"rgba(255,255,255,0.45)", fontSize:11 },
      grid: { vertLines:{ color:"rgba(255,255,255,0.04)" }, horzLines:{ color:"rgba(255,255,255,0.04)" } },
      crosshair: { mode:CrosshairMode.Normal, vertLine:{ color:"rgba(124,58,237,0.5)", labelBackgroundColor:"#7c3aed" }, horzLine:{ color:"rgba(124,58,237,0.5)", labelBackgroundColor:"#7c3aed" } },
      rightPriceScale: { borderColor:"rgba(255,255,255,0.06)" },
      timeScale: { borderColor:"rgba(255,255,255,0.06)", timeVisible:true, secondsVisible:false },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });
    chartRef.current = chart;

    let mainSeries: any;
    if (mode === "candle") {
      mainSeries = chart.addSeries(CandlestickSeries, { upColor:"#4ade80", downColor:"#f87171", borderUpColor:"#4ade80", borderDownColor:"#f87171", wickUpColor:"#4ade80", wickDownColor:"#f87171" });
      mainSeries.setData(cleanOhlcv.map((d:any)=>({ time:d.time, open:d.open, high:d.high, low:d.low, close:d.close })));
    } else {
      mainSeries = chart.addSeries(LineSeries, { color:up?"#4ade80":"#f87171", lineWidth:2, lastValueVisible:true, priceLineVisible:true });
      mainSeries.setData(cleanOhlcv.map((d:any)=>({ time:d.time, value:d.close })));
    }
    mainSeriesRef.current = mainSeries;

    // Add AI trade markers
    if ((aiTradeMode || paperTradeMode) && tradeMarkers && tradeMarkers.length > 0 && cleanOhlcv.length > 0) {
      const markers: any[] = [];
      tradeMarkers.slice(0, 20).forEach((t: any, i: number) => {
        const candle = cleanOhlcv[Math.max(0, cleanOhlcv.length - 20 + i)];
        if (!candle) return;
        const isLong = t.stance === "LONG" || t.stance === "HOLD-LONG";
        markers.push({
          time: candle.time,
          position: isLong ? "belowBar" : "aboveBar",
          color: isLong ? "#4ade80" : "#f87171",
          shape: isLong ? "arrowUp" : "arrowDown",
          text: `${t.scientist_emoji||""} ${t.scientist_role?.split(" ")[0]||""} ${isLong?"LONG":"SHORT"}`,
        });
      });
      if (markers.length > 0) {
        const sorted = markers.sort((a,b)=>a.time<b.time?-1:1);
        try { mainSeries.setMarkers(sorted); } catch(_) {}
      }
    }

    // Paper trade price lines
    if (paperTradeMode && paperTrades && paperTrades.length > 0) {
      paperTrades.slice(0, 8).forEach((t: any) => {
        if (!t.entry_price) return;
        const isLong = t.stance === "LONG" || t.stance === "HOLD-LONG";
        try {
          mainSeries.createPriceLine({ price:t.entry_price, color:isLong?"rgba(74,222,128,0.5)":"rgba(248,113,113,0.5)", lineWidth:1, lineStyle:LineStyle.Dashed, axisLabelVisible:true, title:`${t.scientist_emoji||""} ${isLong?"LONG":"SHORT"} Entry` });
          if (t.stop_live) mainSeries.createPriceLine({ price:t.stop_live, color:"rgba(251,191,36,0.4)", lineWidth:1, lineStyle:LineStyle.Dashed, axisLabelVisible:true, title:"STOP" });
        } catch(_) {}
      });
    }

    if (indicators.ma20 && cleanOhlcv.length >= 20) { const s=chart.addSeries(LineSeries,{color:"#fbbf24",lineWidth:1 as any,title:"MA20",lastValueVisible:false,priceLineVisible:false}); s.setData(computeSMA(cleanOhlcv,20)); }
    if (indicators.ma50 && cleanOhlcv.length >= 50) { const s=chart.addSeries(LineSeries,{color:"#60a5fa",lineWidth:1 as any,title:"MA50",lastValueVisible:false,priceLineVisible:false}); s.setData(computeSMA(cleanOhlcv,50)); }
    if (indicators.ma200 && cleanOhlcv.length >= 200) { const s=chart.addSeries(LineSeries,{color:"#f472b6",lineWidth:1 as any,lineStyle:LineStyle.Dashed,title:"MA200",lastValueVisible:false,priceLineVisible:false}); s.setData(computeSMA(cleanOhlcv,200)); }
    if (indicators.volume) {
      const vs=chart.addSeries(HistogramSeries,{priceFormat:{type:"volume"},priceScaleId:"vol",lastValueVisible:false,priceLineVisible:false});
      vs.priceScale().applyOptions({scaleMargins:{top:0.8,bottom:0}});
      vs.setData(cleanOhlcv.map((d:any)=>({ time:d.time, value:d.volume, color:d.close>=d.open?"rgba(74,222,128,0.2)":"rgba(248,113,113,0.2)" })));
    }
    if (indicators.bb && cleanOhlcv.length >= 20) {
      const bbData=computeBB(cleanOhlcv), bbOpt={lineWidth:1 as any,lastValueVisible:false,priceLineVisible:false,priceScaleId:"right"};
      chart.addSeries(LineSeries,{...bbOpt,color:"rgba(96,165,250,0.5)"}).setData(bbData.map((d:any)=>({time:d.time,value:d.upper})));
      chart.addSeries(LineSeries,{...bbOpt,color:"rgba(96,165,250,0.5)"}).setData(bbData.map((d:any)=>({time:d.time,value:d.lower})));
      chart.addSeries(LineSeries,{...bbOpt,color:"rgba(96,165,250,0.2)",lineStyle:LineStyle.Dashed}).setData(bbData.map((d:any)=>({time:d.time,value:d.mid})));
    }
    chart.subscribeCrosshairMove((param:any)=>{
      if (param.time) { const c=cleanOhlcv.find(d=>d.time===param.time); if(c) setHovered(c); } else setHovered(null);
    });
    chart.timeScale().fitContent();
    const ro = new ResizeObserver(()=>{ if(containerRef.current&&chartRef.current) chartRef.current.applyOptions({width:containerRef.current.clientWidth,height:containerRef.current.clientHeight}); });
    if (containerRef.current) ro.observe(containerRef.current);
    return ()=>{ ro.disconnect(); };
  }, [data, mode, indicators, aiTradeMode, paperTradeMode, tradeMarkers, paperTrades]);

  useEffect(()=>()=>{ if(chartRef.current){chartRef.current.remove();chartRef.current=null;} },[]);

  const ohlcvVals=[{k:"O",v:(hovered?.open??data?.open)?.toFixed(2)},{k:"H",v:(hovered?.high??data?.high)?.toFixed(2)},{k:"L",v:(hovered?.low??data?.low)?.toFixed(2)},{k:"C",v:(hovered?.close??data?.price)?.toFixed(2)},{k:"Vol",v:fmtVol(hovered?.volume??data?.volume??0)}];

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#04000a", overflow:"hidden", minHeight:0 }}>
      {/* Symbol + OHLCV header */}
      <div style={{ padding:"7px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:12, flexShrink:0, background:"#030009" }}>
        {/* Watchlist toggle */}
        <button onClick={onToggleWatchlist} data-testid="button-toggle-watchlist" title={watchlistOpen?"Collapse watchlist":"Expand watchlist"} style={{ width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:5, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.6)", cursor:"pointer", flexShrink:0 }}>
          {watchlistOpen ? <ChevronLeft size={12}/> : <ChevronRight size={12}/>}
        </button>
        <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
          <span style={{ color:"#fff", fontWeight:900, fontSize:15, letterSpacing:"-0.01em" }}>{symbol.replace("-USD","").replace("=X","").replace("^","")}</span>
          <span style={{ color:up?"#4ade80":"#f87171", fontWeight:800, fontSize:13 }}>{isCrypto?"":"$"}{(hovered?.close??data?.price??0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:4})}</span>
          <span style={{ display:"flex", alignItems:"center", gap:2, color:up?"#4ade80":"#f87171", fontWeight:700, fontSize:11 }}>{up?<ChevronUp size={10}/>:<ChevronDown size={10}/>}{up?"+":""}{chg.toFixed(2)}%</span>
        </div>
        <div style={{ display:"flex", gap:10, marginLeft:4 }}>
          {ohlcvVals.map(s=>(
            <div key={s.k} style={{ display:"flex", gap:3, alignItems:"baseline" }}>
              <span style={{ color:"rgba(255,255,255,0.3)", fontSize:8, fontWeight:700 }}>{s.k}</span>
              <span style={{ color:"rgba(255,255,255,0.8)", fontWeight:600, fontSize:10 }}>{s.v??"—"}</span>
            </div>
          ))}
        </div>
        {loading && <div style={{ marginLeft:"auto", width:13, height:13, border:"2px solid rgba(124,58,237,0.3)", borderTopColor:"#7c3aed", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>}
      </div>

      {/* Timeframe groups + chart type + indicators */}
      <div style={{ padding:"5px 12px", borderBottom:"1px solid rgba(255,255,255,0.04)", flexShrink:0, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", background:"#030009" }}>
        {/* Intraday TFs */}
        <div style={{ display:"flex", gap:2, flexShrink:0 }}>
          {(["1m","5m","15m","30m","1h","4h","1D"] as ChartTF[]).map(t=>(
            <button key={t} onClick={()=>setTF(t)} style={{ padding:"2px 7px", fontSize:9, fontWeight:700, border:"none", borderRadius:3, cursor:"pointer", background:tf===t?"#7c3aed":"rgba(255,255,255,0.04)", color:tf===t?"#fff":intraday&&["1m","5m","15m","30m","1h","4h","1D"].includes(t)?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.4)" }}>{t}</button>
          ))}
        </div>
        <div style={{ width:1, height:14, background:"rgba(255,255,255,0.08)" }}/>
        {/* Daily+ TFs */}
        <div style={{ display:"flex", gap:2, flexShrink:0 }}>
          {(["1W","1M","3M","6M","1Y","5Y"] as ChartTF[]).map(t=>(
            <button key={t} onClick={()=>setTF(t)} style={{ padding:"2px 7px", fontSize:9, fontWeight:700, border:"none", borderRadius:3, cursor:"pointer", background:tf===t?"#7c3aed":"rgba(255,255,255,0.04)", color:tf===t?"#fff":"rgba(255,255,255,0.4)" }}>{t}</button>
          ))}
        </div>
        <div style={{ width:1, height:14, background:"rgba(255,255,255,0.08)" }}/>
        {/* Chart type */}
        <button onClick={()=>setMode("candle")} style={{ display:"flex", alignItems:"center", gap:3, padding:"2px 7px", fontSize:9, fontWeight:700, border:"none", borderRadius:3, cursor:"pointer", background:mode==="candle"?"rgba(124,58,237,0.25)":"rgba(255,255,255,0.04)", color:mode==="candle"?"#a78bfa":"rgba(255,255,255,0.5)" }}><CandlestickChart size={9}/> Candle</button>
        <button onClick={()=>setMode("line")} style={{ display:"flex", alignItems:"center", gap:3, padding:"2px 7px", fontSize:9, fontWeight:700, border:"none", borderRadius:3, cursor:"pointer", background:mode==="line"?"rgba(124,58,237,0.25)":"rgba(255,255,255,0.04)", color:mode==="line"?"#a78bfa":"rgba(255,255,255,0.5)" }}><LineChart size={9}/> Line</button>
        <div style={{ width:1, height:14, background:"rgba(255,255,255,0.08)" }}/>
        {/* Indicators */}
        {([{key:"ma20" as const,label:"MA20",color:"#fbbf24"},{key:"ma50" as const,label:"MA50",color:"#60a5fa"},{key:"ma200" as const,label:"MA200",color:"#f472b6"},{key:"volume" as const,label:"VOL",color:"#a78bfa"},{key:"bb" as const,label:"BB",color:"#60a5fa"},{key:"rsi" as const,label:"RSI",color:"#4ade80"},{key:"macd" as const,label:"MACD",color:"#f472b6"}]).map(({key,label,color})=>(
          <button key={key} onClick={()=>setIndicators(p=>({...p,[key]:!p[key]}))}
            style={{ padding:"2px 7px", borderRadius:3, border:`1px solid ${indicators[key]?color+"55":"rgba(255,255,255,0.07)"}`, background:indicators[key]?color+"18":"rgba(255,255,255,0.02)", color:indicators[key]?color:"rgba(255,255,255,0.55)", fontSize:8.5, fontWeight:700, cursor:"pointer" }}>
            {indicators[key]?"✓ ":""}{label}
          </button>
        ))}
      </div>

      {/* Main chart */}
      <div style={{ flex:1, position:"relative", minHeight:0 }}>
        {loading && (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#04000a", zIndex:2, gap:10 }}>
            <div style={{ width:28, height:28, border:"2px solid rgba(124,58,237,0.3)", borderTopColor:"#7c3aed", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
            <div style={{ color:"rgba(255,255,255,0.3)", fontSize:11 }}>Loading {symbol.replace("-USD","").replace("^","")} {tf}…</div>
            {intraday && <div style={{ color:"rgba(255,255,255,0.2)", fontSize:9 }}>Fetching intraday data from Yahoo Finance…</div>}
          </div>
        )}
        <div ref={containerRef} style={{ width:"100%", height:"100%" }}/>
      </div>

      {/* RSI sub-panel */}
      {indicators.rsi && rsiData.length > 0 && (()=>{
        const vals=rsiData.map(d=>d.value), last=vals[vals.length-1];
        const w=860,h=52, pts=vals.map((v,i)=>`${(i/(vals.length-1))*w},${h-((v/100)*h*0.9)-h*0.05}`).join(" ");
        const rsiColor=last>=70?"#f87171":last<=30?"#4ade80":"#a78bfa";
        return (
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", background:"#030009", flexShrink:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"2px 10px 0" }}>
              <span style={{ fontSize:7.5, fontWeight:700, color:"rgba(255,255,255,0.3)" }}>RSI (14)  ▲70  ▼30</span>
              <span style={{ fontSize:9, fontWeight:900, color:rsiColor }}>RSI: {last.toFixed(2)} {last>=70?"⚠️ OVERBOUGHT":last<=30?"💡 OVERSOLD":""}</span>
            </div>
            <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display:"block", height:h }}>
              <line x1="0" y1={h-h*0.73} x2={w} y2={h-h*0.73} stroke="rgba(248,113,113,0.2)" strokeDasharray="4,3" strokeWidth={1}/>
              <line x1="0" y1={h-h*0.23} x2={w} y2={h-h*0.23} stroke="rgba(74,222,128,0.2)" strokeDasharray="4,3" strokeWidth={1}/>
              <polyline points={pts} fill="none" stroke={rsiColor} strokeWidth={1.5} opacity={0.9}/>
            </svg>
          </div>
        );
      })()}

      {/* MACD sub-panel */}
      {indicators.macd && macdData.length > 0 && (()=>{
        const hists=macdData.map(d=>d.hist), macds=macdData.map(d=>d.macd), sigs=macdData.map(d=>d.sig);
        const allVals=[...hists,...macds,...sigs], minV=Math.min(...allVals), maxV=Math.max(...allVals), rng=maxV-minV||1;
        const hw=860,hh=52, zero=hh-((0-minV)/rng)*hh*0.9-hh*0.05, toY=(v:number)=>hh-((v-minV)/rng)*hh*0.9-hh*0.05;
        const lastH=hists[hists.length-1], lastS=sigs[sigs.length-1];
        return (
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", background:"#030009", flexShrink:0 }}>
            <div style={{ display:"flex", gap:10, padding:"2px 10px 0" }}>
              <span style={{ fontSize:7.5, fontWeight:700, color:"rgba(255,255,255,0.3)" }}>MACD (12,26,9)</span>
              <span style={{ fontSize:7.5, fontWeight:700, color:"#60a5fa" }}>Hist: {lastH?.toFixed(3)}</span>
              <span style={{ fontSize:7.5, fontWeight:700, color:"#f87171", marginLeft:"auto" }}>Sig: {lastS?.toFixed(3)}</span>
            </div>
            <svg width="100%" viewBox={`0 0 ${hw} ${hh}`} preserveAspectRatio="none" style={{ display:"block", height:hh }}>
              <line x1="0" y1={zero} x2={hw} y2={zero} stroke="rgba(255,255,255,0.06)" strokeWidth={1}/>
              {hists.map((h,i)=>{ const barW=hw/hists.length, x=i*barW, y0=zero, y1=toY(h), height=Math.abs(y0-y1); return <rect key={i} x={x} y={Math.min(y0,y1)} width={Math.max(0.5,barW-0.5)} height={Math.max(1,height)} fill={h>=0?"rgba(74,222,128,0.6)":"rgba(248,113,113,0.6)"}/>; })}
              <polyline points={macds.map((v,i)=>`${(i/(macds.length-1))*hw},${toY(v)}`).join(" ")} fill="none" stroke="#60a5fa" strokeWidth={1.5}/>
              <polyline points={sigs.map((v,i)=>`${(i/(sigs.length-1))*hw},${toY(v)}`).join(" ")} fill="none" stroke="#f87171" strokeWidth={1}/>
            </svg>
          </div>
        );
      })()}

      {/* Sovereign signal bar */}
      {orgSignal && (
        <div style={{ borderTop:"1px solid rgba(124,58,237,0.15)", background:"rgba(124,58,237,0.04)", padding:"4px 12px", flexShrink:0, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <span style={{ color:"#a78bfa", fontWeight:900, fontSize:9 }}>⭐ SOVEREIGN SIGNAL</span>
          <span style={{ fontSize:8, fontWeight:900, padding:"1px 6px", borderRadius:4, background:(orgSignal.stance?.includes("LONG"))?"rgba(74,222,128,0.15)":"rgba(248,113,113,0.15)", color:(orgSignal.stance?.includes("LONG"))?"#4ade80":"#f87171", border:`1px solid ${(orgSignal.stance?.includes("LONG"))?"rgba(74,222,128,0.3)":"rgba(248,113,113,0.3)"}` }}>{orgSignal.stance}</span>
          {[["EDGE",`${(orgSignal.edge_final*100)?.toFixed(1)}`],["CVX",`${orgSignal.conviction}%`],["RISK",`${(orgSignal.risk_live*100)?.toFixed(1)}%`],["LOCK",`${(orgSignal.profit_lock*100)?.toFixed(1)}%`],["SIZE f*",orgSignal.size_f?.toFixed(2)],["STOP",`$${orgSignal.stop_live?.toFixed(2)}`],["HORIZON",orgSignal.horizon]].map(([l,v])=>(
            <div key={l} style={{ display:"flex", gap:3 }}><span style={{ color:"rgba(255,255,255,0.3)", fontSize:7, fontWeight:700 }}>{l}</span><span style={{ color:"#fff", fontWeight:800, fontSize:8 }}>{v}</span></div>
          ))}
          <span style={{ marginLeft:"auto", color:"rgba(255,255,255,0.4)", fontSize:8 }}>{orgSignal.scientist_emoji} {orgSignal.scientist_role}</span>
        </div>
      )}

      {/* Bottom analysis tabs */}
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", background:"#030009", display:"flex", gap:0, flexShrink:0, overflowX:"auto", scrollbarWidth:"none" }}>
        {["News","Company","Options","Bonds","Financials","Analysis","Press Rel.","Corporate","Research","Brief"].map((t,i)=>(
          <button key={t} style={{ padding:"5px 11px", fontSize:8.5, fontWeight:600, border:"none", borderTop:i===9?"2px solid #7c3aed":"2px solid transparent", background:"none", color:i===9?"#a78bfa":"rgba(255,255,255,0.4)", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>{t}</button>
        ))}
      </div>
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────
function Sparkline({ closes, positive, w=60, h=22 }: { closes:number[]; positive:boolean; w?:number; h?:number }) {
  if (!closes||closes.length<2) return <div style={{ width:w, height:h }}/>;
  const min=Math.min(...closes), max=Math.max(...closes), range=max-min||1;
  const pts=closes.map((v,i)=>`${(i/(closes.length-1))*w},${h-((v-min)/range)*h*0.85-h*0.075}`).join(" ");
  const color=positive?"#4ade80":"#f87171";
  return <svg width={w} height={h} style={{ display:"block" }}><polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.9}/></svg>;
}

// ── Command Palette ───────────────────────────────────────────────
function CommandPalette({ quotes, onClose, onOpen }: { quotes:Quote[]; onClose:()=>void; onOpen:(sym:string,name:string)=>void }) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(()=>{ ref.current?.focus(); },[]);
  const matches = q.length<1 ? quotes.slice(0,10) : quotes.filter(x=>x.symbol.includes(q.toUpperCase())||x.name?.toLowerCase().includes(q.toLowerCase())).slice(0,12);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:9999, display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:80 }} onClick={onClose}>
      <div style={{ width:"100%", maxWidth:520, borderRadius:14, border:"1px solid rgba(255,255,255,0.12)", background:"#08000f", boxShadow:"0 32px 80px rgba(0,0,0,0.9)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <Search size={13} style={{ color:"rgba(255,255,255,0.3)" }}/>
          <input ref={ref} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search ticker or company…" style={{ flex:1, background:"none", border:"none", outline:"none", color:"#fff", fontSize:14, fontWeight:600 }}/>
          <button onClick={onClose}><X size={13} style={{ color:"rgba(255,255,255,0.3)" }}/></button>
        </div>
        <div style={{ maxHeight:360, overflowY:"auto" }}>
          {matches.map(m=>{ const up=parseFloat(m.change)>0; return (
            <div key={m.symbol} onClick={()=>{ onClose(); onOpen(m.symbol,m.name); }} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 16px", cursor:"pointer", borderBottom:"1px solid rgba(255,255,255,0.03)" }} onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
              <span style={{ color:"#fff", fontWeight:900, fontSize:12, minWidth:60 }}>{m.symbol.replace("-USD","")}</span>
              <span style={{ color:"rgba(255,255,255,0.4)", fontSize:11, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</span>
              <span style={{ color:up?"#4ade80":"#f87171", fontWeight:700, fontSize:11 }}>{up?"+":""}{m.change}%</span>
              <span style={{ color:"#fff", fontWeight:800, fontSize:11, minWidth:60, textAlign:"right" }}>{m.price}</span>
            </div>
          ); })}
        </div>
        <div style={{ padding:"7px 16px", color:"rgba(255,255,255,0.15)", fontSize:9 }}>⌘K to toggle · Click to open · ESC to close</div>
      </div>
    </div>
  );
}

// ── Main Finance Page ─────────────────────────────────────────────
export default function FinancePage() {
  useDomainPing("finance");
  const [indices, setIndices] = useState<Quote[]>([]);
  const [stocks, setStocks] = useState<Quote[]>([]);
  const [crypto, setCrypto] = useState<Quote[]>([]);
  const [cryptoTop, setCryptoTop] = useState<CryptoTop[]>([]);
  const [realestate, setRealestate] = useState<Quote[]>([]);
  const [fearGreed, setFearGreed] = useState<FearGreed[]>([]);
  const [organism, setOrganism] = useState<any>(null);
  const [tradeLogs, setTradeLogs] = useState<any[]>([]);
  const [tradingPapers, setTradingPapers] = useState<any[]>([]);
  const [scientistVotes, setScientistVotes] = useState<any[]>([]);
  const [paperAccounts, setPaperAccounts] = useState<any[]>([]);
  // livePrices = real-time price updates from the WebSocket (all symbols)
  const [livePrices, setLivePrices] = useState<Record<string, any>>({});
  const wsRef = useRef<WebSocket|null>(null);
  const [sparklines, setSparklines] = useState<Record<string,number[]>>({});
  const [loading, setLoading] = useState<Record<string,boolean>>({});
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date|null>(null);

  // Terminal state
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [selectedName, setSelectedName] = useState("Apple Inc.");
  const [selectedChartData, setSelectedChartData] = useState<any>(null);
  const [rightTab, setRightTab] = useState<RightTab>("classic");
  const [pulseAIActive, setPulseAIActive] = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(true);
  const [watchFilter, setWatchFilter] = useState<WatchFilter>("STOCKS");
  const [watchSearch, setWatchSearch] = useState("");
  const [watchTab, setWatchTab] = useState<"watchlist"|"recently">("watchlist");
  const [recentSymbols, setRecentSymbols] = useState<{symbol:string;name:string}[]>([]);
  const [showScientistCards, setShowScientistCards] = useState(false);
  const [detailMode, setDetailMode] = useState(false);

  // AI Trade / Paper Trade
  const [aiTradeMode, setAiTradeMode] = useState(false);
  const [paperTradeMode, setPaperTradeMode] = useState(false);
  const [paperPnL, setPaperPnL] = useState<Record<string,number>>({});

  const orgSignalMap = useMemo<Record<string,any>>(()=>{
    if (!organism?.topEdgeTrades) return {};
    const map: Record<string,any>={};
    for (const t of organism.topEdgeTrades) { map[t.symbol]=t; map[t.symbol.replace("-USD","").replace("=X","").replace("^","")]=t; }
    return map;
  },[organism]);

  const setLoad=(k:string,v:boolean)=>setLoading(p=>({...p,[k]:v}));

  const fetchBatch=useCallback(async(syms:string[],setter:(d:Quote[])=>void,key:string)=>{
    setLoad(key,true);
    try { const d=await fetch(`/api/finance/batch?symbols=${syms.join(",")}`).then(r=>r.json()).catch(()=>[]); setter(Array.isArray(d)?d:[]); }
    catch {} finally { setLoad(key,false); }
  },[]);

  const fetchSparklines=useCallback(async(syms:string[])=>{
    const missing=syms.filter(s=>!sparklines[s]).slice(0,8);
    if (!missing.length) return;
    await Promise.all(missing.map(async sym=>{
      try { const d=await fetch(`/api/finance/chart/${sym}`).then(r=>r.json()).catch(()=>null); if(d?.closes?.length>1) setSparklines(p=>({...p,[sym]:d.closes})); } catch {}
    }));
  },[sparklines]);

  const fetchOrganism=useCallback(async()=>{
    try { setOrganism(await fetch("/api/finance/organism").then(r=>r.json()).catch(()=>null)); } catch {}
  },[]);

  const fetchTradeLogs=useCallback(async()=>{
    try { const d=await fetch("/api/finance/trade-logs?limit=80").then(r=>r.json()).catch(()=>[]); setTradeLogs(Array.isArray(d)?d:[]); } catch {}
  },[]);

  const fetchPapers=useCallback(async()=>{
    try { const d=await fetch("/api/finance/trading-papers?limit=20").then(r=>r.json()).catch(()=>[]); setTradingPapers(Array.isArray(d)?d:[]); } catch {}
  },[]);

  const fetchVotes=useCallback(async()=>{
    try { const d=await fetch("/api/finance/scientist-votes?limit=30").then(r=>r.json()).catch(()=>[]); setScientistVotes(Array.isArray(d)?d:[]); } catch {}
  },[]);

  const fetchCryptoTop=useCallback(async()=>{
    try { const d=await fetch(`/api/finance/crypto/top?page=1`).then(r=>r.json()).catch(()=>[]); setCryptoTop(Array.isArray(d)?d:[]); } catch {}
  },[]);

  const fetchPaperAccounts=useCallback(async()=>{
    try { const d=await fetch("/api/finance/paper-accounts").then(r=>r.json()).catch(()=>[]); setPaperAccounts(Array.isArray(d)?d:[]); } catch {}
  },[]);

  useEffect(()=>{
    fetchBatch(INDEX_SYMBOLS,setIndices,"indices");
    fetchBatch(ALL_STOCKS,setStocks,"stocks");
    fetchBatch(CRYPTO_SYMBOLS,setCrypto,"crypto");
    fetchBatch(REALESTATE_SYMBOLS,setRealestate,"realestate");
    fetch("/api/finance/feargreed").then(r=>r.json()).then(d=>setFearGreed(Array.isArray(d)?d:[])).catch(()=>{});
    fetchOrganism(); fetchTradeLogs(); fetchPapers(); fetchVotes(); fetchPaperAccounts();
    setLastUpdate(new Date());
    setTimeout(()=>fetchSparklines([...INDEX_SYMBOLS,"AAPL","MSFT","NVDA","TSLA","GOOGL","META","AMZN","AMD","JPM","GS","BTC-USD","ETH-USD"]),3000);
    const id=setInterval(()=>{ fetchOrganism(); setLastUpdate(new Date()); },60000);
    const paId=setInterval(fetchPaperAccounts, 30000);
    return ()=>{ clearInterval(id); clearInterval(paId); };
  },[]);

  // ── LIVE PRICE WEBSOCKET — second-by-second from server ──────────────
  useEffect(()=>{
    const proto=window.location.protocol==="https:"?"wss":"ws";
    const url=`${proto}://${window.location.host}/ws/prices`;
    let ws:WebSocket;
    let reconnectTimer:ReturnType<typeof setTimeout>;
    function connect(){
      ws=new WebSocket(url);
      wsRef.current=ws;
      ws.onopen=()=>{ /* connected */ };
      ws.onmessage=(evt)=>{
        try {
          const d=JSON.parse(evt.data);
          if(d.type==="price"&&d.symbol&&d.price!=null){
            setLivePrices(prev=>({ ...prev, [d.symbol]: d }));
          }
        } catch {}
      };
      ws.onclose=()=>{ reconnectTimer=setTimeout(connect,3000); };
      ws.onerror=()=>{ try{ ws.close(); }catch{} };
    }
    connect();
    return ()=>{
      clearTimeout(reconnectTimer);
      try{ wsRef.current?.close(); }catch{}
    };
  },[]);

  useEffect(()=>{
    if (watchFilter==="CRYPTO"&&cryptoTop.length===0) fetchCryptoTop();
  },[watchFilter]);

  useEffect(()=>{
    if (pulseAIActive||aiTradeMode||paperTradeMode) {
      fetchTradeLogs();
      const id=setInterval(fetchTradeLogs,12000);
      return ()=>clearInterval(id);
    }
  },[pulseAIActive,aiTradeMode,paperTradeMode]);

  useEffect(()=>{
    if (rightTab==="lab") { fetchVotes(); fetchPapers(); }
  },[rightTab]);

  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{ if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();setPaletteOpen(p=>!p);} };
    window.addEventListener("keydown",handler);
    return ()=>window.removeEventListener("keydown",handler);
  },[]);

  const selectSymbol=useCallback((symbol:string,name:string,fullscreen=true)=>{
    setSelectedSymbol(symbol); setSelectedName(name);
    if (fullscreen) setDetailMode(true);
    setRecentSymbols(p=>{ const f=p.filter(r=>r.symbol!==symbol); return [{symbol,name},...f].slice(0,20); });
  },[]);

  // Watchlist items
  const watchItems=useMemo(()=>{
    let items:Quote[]=[];
    if (watchFilter==="STOCKS") items=stocks;
    else if (watchFilter==="CRYPTO") {
      const cryptoTopMapped=cryptoTop.slice(0,30).map(c=>({symbol:`${c.symbol.toUpperCase()}-USD`,price:(c.price??0).toFixed(4),change:c.change24h??0,name:c.name}));
      const seen=new Set(crypto.map(c=>c.symbol));
      items=[...crypto,...cryptoTopMapped.filter(c=>!seen.has(c.symbol))];
    }
    else if (watchFilter==="ETF") items=[...indices,...realestate];
    else if (watchFilter==="INDICES") items=indices;
    const search=watchSearch.toUpperCase();
    if (search) items=items.filter(q=>q.symbol.includes(search)||q.name?.toLowerCase().includes(watchSearch.toLowerCase()));
    return items;
  },[watchFilter,watchSearch,stocks,crypto,cryptoTop,indices,realestate]);

  const displayItems=watchTab==="recently" ? recentSymbols.map(r=>{ const all=[...indices,...stocks,...crypto,...realestate]; const q=all.find(x=>x.symbol===r.symbol); return q||{symbol:r.symbol,price:"—",change:"0",name:r.name}; }) : watchItems;
  const allQuotes=useMemo(()=>[...indices,...stocks,...crypto,...realestate],[indices,stocks,crypto,realestate]);
  const selectedQuote=allQuotes.find(q=>q.symbol===selectedSymbol);
  const fgValue=fearGreed[0]?parseInt(fearGreed[0].value):null;

  const w52h=selectedChartData?.ohlcv?Math.max(...selectedChartData.ohlcv.map((c:any)=>c.high)).toFixed(2):"—";
  const w52l=selectedChartData?.ohlcv?Math.min(...selectedChartData.ohlcv.map((c:any)=>c.low)).toFixed(2):"—";
  const avgVol=selectedChartData?.ohlcv?fmtVol(selectedChartData.ohlcv.reduce((a:number,c:any)=>a+c.volume,0)/selectedChartData.ohlcv.length):"—";

  const orgSignalSelected=orgSignalMap[selectedSymbol]??orgSignalMap[selectedSymbol?.replace("-USD","").replace("^","")];
  const selectedIsLong=orgSignalSelected?.stance==="LONG"||orgSignalSelected?.stance==="HOLD-LONG";
  const exchange=getExchange(selectedSymbol);

  // Trade markers for selected symbol
  const tradeMarkersForSymbol=useMemo(()=> tradeLogs.filter(t=>t.symbol===selectedSymbol||t.symbol===selectedSymbol.replace("-USD","")),[tradeLogs,selectedSymbol]);
  const paperTradesForSymbol=useMemo(()=> tradeLogs.filter(t=>t.symbol===selectedSymbol||t.symbol===selectedSymbol.replace("-USD","")).slice(0,8),[tradeLogs,selectedSymbol]);

  // Dissection lab: compute live PULSE.TRADE values for selected symbol
  const dissection=useMemo(()=>{
    if (!orgSignalSelected) return null;
    const o=orgSignalSelected;
    const isCrypto=selectedSymbol.endsWith("-USD");
    const assetType=isCrypto?"CRYPTO":"STOCK";
    const slBand=isCrypto?[0.30,0.40]:[0.07,0.15];
    const slCenter=(slBand[0]+slBand[1])/2;
    return {
      belief_q:(o.conviction/100).toFixed(4),
      emotion_eps:organism?.fearGreed?(organism.fearGreed/100-0.5).toFixed(4):"0.0000",
      misprice_delta:o.misprice_delta?.toFixed(4)??"—",
      edge_emotion:o.edge_emotion?.toFixed(4)??"—",
      edge_raw:o.edge_raw?.toFixed(4)??"—",
      sl_band:`[${slBand[0]}, ${slBand[1]}]`,
      stop_init:o.entry_price?(o.entry_price*(1-slCenter)).toFixed(2):"—",
      stop_live:o.stop_live?.toFixed(2)??"—",
      risk_live:o.risk_live?(o.risk_live*100).toFixed(2)+"%":"—",
      profit_lock:o.profit_lock?(o.profit_lock*100).toFixed(2)+"%":"—",
      edge_disc:o.edge_disc?.toFixed(4)??"—",
      edge_profit:o.edge_profit?.toFixed(4)??"—",
      edge_final:(o.edge_final*100).toFixed(2)+"%",
      size_f:o.size_f?.toFixed(4)??"—",
      lambda1:organism?.crispWeights?.lambda1?.toFixed(2)??"—",
      lambda2:organism?.crispWeights?.lambda2?.toFixed(2)??"—",
      lambda3:organism?.crispWeights?.lambda3?.toFixed(2)??"—",
      lambda4:organism?.crispWeights?.lambda4?.toFixed(2)??"—",
      lambda6:organism?.crispWeights?.lambda6?.toFixed(2)??"—",
      lambda7:organism?.crispWeights?.lambda7?.toFixed(2)??"—",
      asset_type:assetType,
    };
  },[orgSignalSelected,organism,selectedSymbol]);

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#040008", overflow:"hidden", minHeight:0 }}>
      <UniversePulseBar domain="finance" />
      {paletteOpen && <CommandPalette quotes={allQuotes} onClose={()=>setPaletteOpen(false)} onOpen={(s,n)=>{ selectSymbol(s,n); setPaletteOpen(false); }}/>}
      {showScientistCards && <ScientistCardsPanel tradeLogs={tradeLogs} paperAccounts={paperAccounts} onClose={()=>setShowScientistCards(false)} onSelectSymbol={selectSymbol}/>}

      {/* ── FULLSCREEN STOCK DETAIL (Robinhood / Webull style) ── */}
      {detailMode && (()=>{
        const lp=livePrices[selectedSymbol];
        const dp=lp?.price!=null?lp.price:(parseFloat(selectedQuote?.price||"0")||null);
        const dc=lp?.change!=null?lp.change:(parseFloat(selectedQuote?.change||"0")||0);
        const isCrypto=selectedSymbol.endsWith("-USD");
        const fmtP=(p:number)=>isCrypto?p.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:6}):p.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
        const up=dc>=0; const ex=getExchange(selectedSymbol);
        const ms=getMarketStatus(selectedSymbol);
        const cleanSym=selectedSymbol.replace("-USD","").replace("^","");
        const orgSig=orgSignalMap[selectedSymbol]??orgSignalMap[cleanSym];
        return (
          <div style={{ position:"fixed", inset:0, zIndex:9000, background:"#04000a", display:"flex", flexDirection:"column", overflow:"hidden" }}>
            {/* ── Topbar ── */}
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(4,0,10,0.95)", backdropFilter:"blur(12px)", flexShrink:0 }}>
              <button onClick={()=>setDetailMode(false)} data-testid="btn-detail-back" style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"6px 12px", color:"rgba(255,255,255,0.7)", cursor:"pointer", fontSize:13, fontWeight:700 }}>
                <ChevronLeft size={15}/> Back
              </button>
              <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:0 }}>
                <span style={{ color:"#fff", fontWeight:900, fontSize:20, letterSpacing:"-0.02em" }}>{cleanSym}</span>
                <span style={{ fontSize:9, fontWeight:800, padding:"2px 6px", borderRadius:4, background:ex==="NASDAQ"?"rgba(99,102,241,0.2)":ex==="CRYPTO"?"rgba(251,191,36,0.15)":ex==="ETF"?"rgba(52,211,153,0.12)":"rgba(255,255,255,0.07)", color:ex==="NASDAQ"?"#818cf8":ex==="CRYPTO"?"#fbbf24":ex==="ETF"?"#34d399":"rgba(255,255,255,0.55)" }}>{ex}</span>
                <span style={{ color:"rgba(255,255,255,0.45)", fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{selectedName}</span>
              </div>
              {/* Market status */}
              <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
                {ms.live&&<span style={{ width:6, height:6, borderRadius:"50%", background:ms.color, boxShadow:`0 0 8px ${ms.color}`, display:"inline-block" }}/>}
                <span style={{ color:ms.color, fontSize:9, fontWeight:700 }}>{ms.status}</span>
              </div>
              <button onClick={()=>setPaletteOpen(true)} style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:7, padding:"5px 10px", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:9 }}>
                <Search size={10}/> Search
              </button>
            </div>

            {/* ── Price Header ── */}
            <div style={{ padding:"14px 20px 10px", borderBottom:"1px solid rgba(255,255,255,0.04)", flexShrink:0, background:"#04000a" }}>
              <div style={{ display:"flex", alignItems:"baseline", gap:12, flexWrap:"wrap" }}>
                <span style={{ fontSize:40, fontWeight:900, color:up?"#4ade80":"#f87171", letterSpacing:"-0.03em", lineHeight:1 }}>
                  {!isCrypto&&"$"}{dp!=null?fmtP(dp):"—"}
                </span>
                {lp?.price!=null&&<span style={{ fontSize:9, color:"#4ade80", fontWeight:800, padding:"2px 8px", borderRadius:4, background:"rgba(74,222,128,0.12)", letterSpacing:0.8 }}>● LIVE</span>}
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  {up?<ChevronUp size={16} color="#4ade80"/>:<ChevronDown size={16} color="#f87171"/>}
                  <span style={{ fontSize:18, fontWeight:800, color:up?"#4ade80":"#f87171" }}>{up?"+":""}{dc.toFixed(2)}%</span>
                </div>
                {orgSig&&(
                  <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, fontWeight:800, background:orgSig.stance?.includes("LONG")?"rgba(74,222,128,0.12)":"rgba(248,113,113,0.12)", color:orgSig.stance?.includes("LONG")?"#4ade80":"#f87171", border:`1px solid ${orgSig.stance?.includes("LONG")?"rgba(74,222,128,0.2)":"rgba(248,113,113,0.2)"}` }}>
                    {orgSig.scientist_emoji} AI: {orgSig.stance} · {orgSig.conviction}%
                  </span>
                )}
              </div>
              {lp?.preMarketPrice&&<div style={{ fontSize:10, color:"#fbbf24", marginTop:4 }}>Pre-Market: ${lp.preMarketPrice.toFixed(2)} ({(lp.preMarketChange??0)>=0?"+":""}{(lp.preMarketChange??0).toFixed(2)}%)</div>}
              {lp?.postMarketPrice&&<div style={{ fontSize:10, color:"#60a5fa", marginTop:4 }}>After-Hours: ${lp.postMarketPrice.toFixed(2)} ({(lp.postMarketChange??0)>=0?"+":""}{(lp.postMarketChange??0).toFixed(2)}%)</div>}
            </div>

            {/* ── Full-width Chart (fills remaining space) ── */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0, overflow:"hidden" }}>
              <EmbeddedChart
                symbol={selectedSymbol} name={selectedName}
                orgSignal={orgSig}
                onDataLoad={setSelectedChartData}
                watchlistOpen={false} onToggleWatchlist={undefined}
                aiTradeMode={aiTradeMode} paperTradeMode={paperTradeMode}
                tradeMarkers={tradeMarkersForSymbol} paperTrades={paperTradesForSymbol}
              />
            </div>

            {/* ── Stats strip ── */}
            <div style={{ display:"flex", gap:0, borderTop:"1px solid rgba(255,255,255,0.05)", background:"#04000a", flexShrink:0, overflowX:"auto", scrollbarWidth:"none" }}>
              {[
                ["Open", selectedChartData?.open?.toFixed(2)??"—"],
                ["Prev Close", selectedChartData?.price?.toFixed(2)??"—"],
                ["High", selectedChartData?.high?.toFixed(2)??"—"],
                ["Low", selectedChartData?.low?.toFixed(2)??"—"],
                ["Volume", fmtVol(selectedChartData?.volume??0)],
                ["Avg Vol", avgVol],
                ["52Wk H", w52h!=="—"?`$${w52h}`:"—"],
                ["52Wk L", w52l!=="—"?`$${w52l}`:"—"],
              ].map(([label,val])=>(
                <div key={label} style={{ flex:"0 0 auto", padding:"8px 16px", borderRight:"1px solid rgba(255,255,255,0.04)", textAlign:"center" }}>
                  <div style={{ color:"rgba(255,255,255,0.35)", fontSize:9, fontWeight:600, marginBottom:2, whiteSpace:"nowrap" }}>{label}</div>
                  <div style={{ color:"#fff", fontWeight:800, fontSize:11, whiteSpace:"nowrap" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* ── Buy / Sell bar ── */}
            <div style={{ display:"flex", gap:10, padding:"10px 16px", borderTop:"1px solid rgba(255,255,255,0.06)", background:"rgba(4,0,10,0.95)", flexShrink:0 }}>
              <button style={{ flex:1, padding:"12px", borderRadius:10, background:"rgba(74,222,128,0.15)", border:"1px solid rgba(74,222,128,0.3)", color:"#4ade80", fontWeight:900, fontSize:14, cursor:"pointer", letterSpacing:"0.05em" }}>
                BUY {cleanSym}
              </button>
              <button style={{ flex:1, padding:"12px", borderRadius:10, background:"rgba(248,113,113,0.12)", border:"1px solid rgba(248,113,113,0.25)", color:"#f87171", fontWeight:900, fontSize:14, cursor:"pointer", letterSpacing:"0.05em" }}>
                SELL {cleanSym}
              </button>
              <button onClick={()=>{ setRightTab("pulseai"); setPulseAIActive(true); fetchTradeLogs(); setDetailMode(false); }} style={{ padding:"12px 16px", borderRadius:10, background:"rgba(124,58,237,0.12)", border:"1px solid rgba(124,58,237,0.25)", color:"#a78bfa", fontWeight:800, fontSize:11, cursor:"pointer", whiteSpace:"nowrap" }}>
                ⚡ Pulse AI
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── Top status bar ── */}
      <div style={{ height:36, display:"flex", alignItems:"center", padding:"0 10px", gap:6, borderBottom:"1px solid rgba(255,255,255,0.06)", background:"#030009", flexShrink:0, overflowX:"auto", scrollbarWidth:"none" }}>
        <span style={{ color:"#a78bfa", fontWeight:900, fontSize:11, whiteSpace:"nowrap" }}>SYNTHENTICA PRIMORDIA PULSE</span>
        <span style={{ fontSize:7, fontWeight:800, padding:"1px 5px", borderRadius:3, background:"rgba(124,58,237,0.2)", color:"#c4b5fd", whiteSpace:"nowrap" }}>SSC</span>
        {organism && <>
          <span style={{ fontSize:8, fontWeight:700, padding:"1px 5px", borderRadius:3, background:organism.mood==="HUNTING"?"rgba(74,222,128,0.12)":"rgba(251,191,36,0.12)", color:organism.mood==="HUNTING"?"#4ade80":"#fbbf24", border:"1px solid rgba(255,255,255,0.05)" }}>{organism.mood}</span>
          <span style={{ fontSize:8, fontWeight:700, padding:"1px 5px", borderRadius:3, background:"rgba(255,255,255,0.03)", color:organism.regime==="RISK-ON"?"#4ade80":"#f87171", border:"1px solid rgba(255,255,255,0.05)" }}>{organism.regime}</span>
        </>}
        {/* Index ticker strip */}
        <div style={{ display:"flex", gap:8, marginLeft:4 }}>
          {indices.map(q=>{
            const lp=livePrices[q.symbol];
            const dispP=lp?.price??parseFloat(q.price||"0");
            const dispC=lp?.change??parseFloat(q.change||"0");
            const up=dispC>0;
            return (
              <div key={q.symbol} onClick={()=>selectSymbol(q.symbol,q.name)} style={{ display:"flex", gap:4, alignItems:"center", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
                <span style={{ color:"rgba(255,255,255,0.45)", fontSize:8.5, fontWeight:700 }}>{q.symbol.replace("^","")}</span>
                <span style={{ color:"#fff", fontWeight:800, fontSize:9.5 }}>{dispP?dispP.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):q.price}</span>
                <span style={{ color:up?"#4ade80":"#f87171", fontWeight:700, fontSize:8.5 }}>{up?"+":""}{dispC.toFixed(2)}%</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:5, alignItems:"center", flexShrink:0 }}>
          {fgValue!==null && <div style={{ display:"flex", gap:3, alignItems:"center", padding:"2px 6px", borderRadius:3, border:"1px solid rgba(255,255,255,0.05)", background:"rgba(255,255,255,0.02)" }}>
            <span style={{ fontSize:7.5, color:"rgba(255,255,255,0.35)", fontWeight:700 }}>F&G</span>
            <span style={{ fontSize:9.5, fontWeight:900, color:fgValue<=25?"#f87171":fgValue>=60?"#4ade80":"#fbbf24" }}>{fgValue}</span>
          </div>}
          {organism && <span style={{ fontSize:7.5, color:"rgba(255,255,255,0.35)", whiteSpace:"nowrap" }}>{organism.activeScientists} sci · {organism.totalTrades} trades</span>}
          {/* Scientist ID Cards button */}
          <button onClick={()=>setShowScientistCards(true)} data-testid="button-scientists" style={{ display:"flex", alignItems:"center", gap:3, padding:"3px 7px", borderRadius:4, border:"1px solid rgba(124,58,237,0.3)", background:"rgba(124,58,237,0.1)", color:"#a78bfa", fontSize:8, fontWeight:700, cursor:"pointer" }}>
            🧬 Scientists
          </button>
          <button onClick={()=>setPaletteOpen(true)} style={{ display:"flex", alignItems:"center", gap:3, padding:"3px 7px", borderRadius:4, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.02)", color:"rgba(255,255,255,0.5)", fontSize:8, cursor:"pointer" }}>
            <Search size={9}/> ⌘K
          </button>
          <button onClick={()=>{ fetchBatch(INDEX_SYMBOLS,setIndices,"indices"); fetchBatch(ALL_STOCKS,setStocks,"stocks"); setLastUpdate(new Date()); }} style={{ padding:"3px 6px", borderRadius:4, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.02)", color:"rgba(255,255,255,0.4)", cursor:"pointer" }}>
            <RefreshCw size={9} className={loading.indices?"animate-spin":""}/>
          </button>
        </div>
      </div>

      {/* ── 3-column terminal body ── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", minHeight:0 }}>

        {/* ── LEFT: Watchlist Panel ── */}
        {watchlistOpen && (
          <div style={{ width:230, borderRight:"1px solid rgba(255,255,255,0.07)", display:"flex", flexDirection:"column", background:"#030009", overflow:"hidden", flexShrink:0 }}>
            {/* Tabs */}
            <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
              {[["watchlist","Watchlists"],["recently","Recently"]].map(([id,label])=>(
                <button key={id} onClick={()=>setWatchTab(id as any)} style={{ flex:1, padding:"7px 0", fontSize:9.5, fontWeight:700, border:"none", borderBottom:`2px solid ${watchTab===id?"#7c3aed":"transparent"}`, background:"none", color:watchTab===id?"#a78bfa":"rgba(255,255,255,0.4)", cursor:"pointer", marginBottom:-1 }}>{label}</button>
              ))}
            </div>
            {/* Search */}
            {watchTab==="watchlist" && (
              <div style={{ padding:"7px 8px 4px", flexShrink:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 7px", borderRadius:5, border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.02)", marginBottom:5 }}>
                  <Search size={9} style={{ color:"rgba(255,255,255,0.3)", flexShrink:0 }}/>
                  <input value={watchSearch} onChange={e=>setWatchSearch(e.target.value)} placeholder="Search…" style={{ flex:1, background:"none", border:"none", outline:"none", color:"#fff", fontSize:10, minWidth:0 }}/>
                  {watchSearch && <button onClick={()=>setWatchSearch("")} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer", padding:0 }}><X size={8}/></button>}
                </div>
                <div style={{ display:"flex", gap:2 }}>
                  {(["STOCKS","CRYPTO","ETF","INDICES"] as WatchFilter[]).map(f=>(
                    <button key={f} onClick={()=>setWatchFilter(f)} style={{ flex:1, padding:"2.5px 0", fontSize:7, fontWeight:700, border:"none", borderRadius:3, cursor:"pointer", background:watchFilter===f?"#7c3aed":"rgba(255,255,255,0.04)", color:watchFilter===f?"#fff":"rgba(255,255,255,0.4)" }}>{f}</button>
                  ))}
                </div>
              </div>
            )}
            {/* Column headers */}
            <div style={{ display:"flex", padding:"3px 10px", borderBottom:"1px solid rgba(255,255,255,0.04)", flexShrink:0 }}>
              <span style={{ flex:1, fontSize:7.5, fontWeight:700, color:"rgba(255,255,255,0.3)", letterSpacing:"0.06em" }}>NAME</span>
              <span style={{ fontSize:7.5, fontWeight:700, color:"rgba(255,255,255,0.3)", letterSpacing:"0.06em" }}>PRICE/CHANGE ↕</span>
            </div>
            {/* Stock list */}
            <div style={{ flex:1, overflowY:"auto", scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,0.06) transparent" }}>
              {displayItems.length===0 && <div style={{ padding:"30px 10px", textAlign:"center", color:"rgba(255,255,255,0.2)", fontSize:10 }}>{loading.stocks?"Loading…":"No results"}</div>}
              {displayItems.map((q:any)=>{
                // Overlay live price from WebSocket
                const lp=livePrices[q.symbol];
                const dispPrice=lp?.price!=null?lp.price:parseFloat(q.price||"0")||null;
                const dispChg=lp?.change!=null?lp.change:parseFloat(q.change||"0");
                const chg=dispChg, up=chg>0, down=chg<0;
                const color=up?"#4ade80":down?"#f87171":"#94a3b8";
                const active=q.symbol===selectedSymbol, ex=getExchange(q.symbol), spark=sparklines[q.symbol];
                const orgSig=orgSignalMap[q.symbol]??orgSignalMap[q.symbol?.replace("-USD","").replace("^","")];
                const isCrypto=q.symbol.endsWith("-USD");
                const fmtWatchPrice=(p:number)=>isCrypto?p.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4}):p.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
                return (
                  <div key={q.symbol} data-testid={`watch-${q.symbol}`} onClick={()=>selectSymbol(q.symbol,q.name)}
                    style={{ display:"flex", alignItems:"center", padding:"6px 10px", borderBottom:"1px solid rgba(255,255,255,0.025)", cursor:"pointer", background:active?"rgba(124,58,237,0.12)":"transparent", borderLeft:active?"2px solid #7c3aed":"2px solid transparent" }}
                    onMouseEnter={e=>{ if(!active) e.currentTarget.style.background="rgba(255,255,255,0.03)"; }}
                    onMouseLeave={e=>{ if(!active) e.currentTarget.style.background="transparent"; }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:3, marginBottom:1 }}>
                        <span style={{ color:"#fff", fontWeight:800, fontSize:10.5 }}>{q.symbol.replace("-USD","").replace("^","")}</span>
                        <span style={{ fontSize:6, fontWeight:700, padding:"0px 3px", borderRadius:2, background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.35)" }}>{ex}</span>
                        {orgSig && <span style={{ fontSize:6, fontWeight:700, padding:"0px 3px", borderRadius:2, background:orgSig.stance?.includes("LONG")?"rgba(74,222,128,0.12)":"rgba(248,113,113,0.12)", color:orgSig.stance?.includes("LONG")?"#4ade80":"#f87171" }}>{orgSig.stance?.replace("HOLD-","")}</span>}
                        {lp&&<span style={{ fontSize:5.5, color:"#4ade80", opacity:0.7 }}>●</span>}
                      </div>
                      <div style={{ color:"rgba(255,255,255,0.35)", fontSize:8.5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:110 }}>{q.name}</div>
                    </div>
                    {spark && <Sparkline closes={spark} positive={up} w={40} h={16}/>}
                    <div style={{ textAlign:"right", marginLeft:5, flexShrink:0 }}>
                      <div style={{ color:"#fff", fontWeight:800, fontSize:10.5 }}>{dispPrice!=null?fmtWatchPrice(dispPrice):"—"}</div>
                      <div style={{ color, fontWeight:700, fontSize:8.5 }}>{up?"+":""}{chg.toFixed(2)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Bottom category icons */}
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-around", padding:"5px 0", flexShrink:0 }}>
              {[{icon:<BarChart3 size={13}/>,label:"Stocks",f:"STOCKS" as WatchFilter},{icon:<Bitcoin size={13}/>,label:"Crypto",f:"CRYPTO" as WatchFilter},{icon:<Globe size={13}/>,label:"ETFs",f:"ETF" as WatchFilter},{icon:<Gauge size={13}/>,label:"Index",f:"INDICES" as WatchFilter}].map(({icon,label,f})=>(
                <button key={f} onClick={()=>{ setWatchFilter(f); setWatchTab("watchlist"); }} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:1, background:"none", border:"none", cursor:"pointer", color:watchFilter===f?"#a78bfa":"rgba(255,255,255,0.3)", padding:"2px 4px" }}>
                  {icon}<span style={{ fontSize:6.5, fontWeight:600 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── CENTER: Embedded Chart ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
          {/* AI Trade / Paper Trade control bar */}
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 12px", borderBottom:"1px solid rgba(255,255,255,0.04)", background:"#020008", flexShrink:0 }}>
            <button onClick={()=>{ setAiTradeMode(p=>!p); if(!aiTradeMode) fetchTradeLogs(); }}
              data-testid="button-ai-trade"
              style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:4, border:`1px solid ${aiTradeMode?"rgba(74,222,128,0.3)":"rgba(255,255,255,0.08)"}`, background:aiTradeMode?"rgba(74,222,128,0.1)":"rgba(255,255,255,0.02)", color:aiTradeMode?"#4ade80":"rgba(255,255,255,0.5)", fontSize:9, fontWeight:700, cursor:"pointer" }}>
              {aiTradeMode && <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", animation:"pulse 1.5s ease-in-out infinite", display:"inline-block" }}/>}
              <Zap size={9}/> AI Trade {aiTradeMode?"ON":"OFF"}
            </button>
            <button onClick={()=>{ setPaperTradeMode(p=>!p); if(!paperTradeMode) fetchTradeLogs(); }}
              data-testid="button-paper-trade"
              style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:4, border:`1px solid ${paperTradeMode?"rgba(251,191,36,0.3)":"rgba(255,255,255,0.08)"}`, background:paperTradeMode?"rgba(251,191,36,0.08)":"rgba(255,255,255,0.02)", color:paperTradeMode?"#fbbf24":"rgba(255,255,255,0.5)", fontSize:9, fontWeight:700, cursor:"pointer" }}>
              {paperTradeMode && <span style={{ width:5, height:5, borderRadius:"50%", background:"#fbbf24", animation:"pulse 1.5s ease-in-out infinite", display:"inline-block" }}/>}
              <Brain size={9}/> Paper Trade {paperTradeMode?"LIVE":"OFF"}
            </button>
            {(aiTradeMode||paperTradeMode) && tradeMarkersForSymbol.length>0 && (
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <span style={{ fontSize:8, color:"rgba(255,255,255,0.4)" }}>
                  {tradeMarkersForSymbol.length} scientist signals on {selectedSymbol.replace("-USD","").replace("^","")}
                </span>
                {tradeMarkersForSymbol.slice(0,3).map((t,i)=>(
                  <span key={i} style={{ fontSize:8, fontWeight:700, padding:"1px 5px", borderRadius:3, background:(t.stance==="LONG"||t.stance==="HOLD-LONG")?"rgba(74,222,128,0.15)":"rgba(248,113,113,0.15)", color:(t.stance==="LONG"||t.stance==="HOLD-LONG")?"#4ade80":"#f87171" }}>
                    {t.scientist_emoji} {t.stance}
                  </span>
                ))}
              </div>
            )}
            {paperTradeMode && <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontSize:8, color:"rgba(255,255,255,0.3)" }}>PAPER P&L:</span>
              <span style={{ fontSize:10, fontWeight:800, color:"#4ade80" }}>+$0.00</span>
            </div>}
          </div>
          <EmbeddedChart
            symbol={selectedSymbol} name={selectedName}
            orgSignal={orgSignalSelected} onDataLoad={d=>setSelectedChartData(d)}
            watchlistOpen={watchlistOpen} onToggleWatchlist={()=>setWatchlistOpen(p=>!p)}
            aiTradeMode={aiTradeMode} paperTradeMode={paperTradeMode}
            tradeMarkers={tradeMarkersForSymbol} paperTrades={paperTradesForSymbol}
          />
        </div>

        {/* ── RIGHT: Quote + Pulse AI + Dissection Lab Panel ── */}
        <div style={{ width:290, borderLeft:"1px solid rgba(255,255,255,0.07)", display:"flex", flexDirection:"column", background:"#030009", overflow:"hidden", flexShrink:0 }}>
          {/* Quote header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
            <span style={{ color:"#fff", fontWeight:800, fontSize:13 }}>Quote</span>
            <Settings size={11} style={{ color:"rgba(255,255,255,0.3)", cursor:"pointer" }}/>
          </div>

          {/* Symbol + price */}
          <div style={{ padding:"9px 12px 6px", borderBottom:"1px solid rgba(255,255,255,0.05)", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
              <span style={{ color:"#fff", fontWeight:900, fontSize:14 }}>{selectedSymbol.replace("-USD","").replace("^","")}</span>
              <span style={{ fontSize:7, fontWeight:800, padding:"1px 4px", borderRadius:3, background:exchange==="NASDAQ"?"rgba(99,102,241,0.2)":exchange==="CRYPTO"?"rgba(251,191,36,0.15)":"rgba(255,255,255,0.07)", color:exchange==="NASDAQ"?"#818cf8":exchange==="CRYPTO"?"#fbbf24":"rgba(255,255,255,0.55)" }}>{exchange}</span>
              <span style={{ fontSize:9, color:"rgba(255,255,255,0.45)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{selectedName}</span>
            </div>
            {(()=>{
              const lp=livePrices[selectedSymbol];
              const displayPrice=lp?.price!= null?lp.price:(parseFloat(selectedQuote?.price||"0")||null);
              const displayChange=lp?.change!=null?lp.change:(parseFloat(selectedQuote?.change||"0")||0);
              const isCrypto=selectedSymbol.endsWith("-USD");
              const fmtPrice=(p:number)=>isCrypto?p.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:6}):p.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
              return selectedQuote||lp ? (
                <>
                  <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                    <div style={{ fontSize:26, fontWeight:900, color:displayChange>=0?"#4ade80":"#f87171", letterSpacing:"-0.02em", lineHeight:1.1, marginBottom:1 }}>
                      {isCrypto?"":"$"}{displayPrice!=null?fmtPrice(displayPrice):"—"}
                    </div>
                    {lp?.price!=null&&<span style={{ fontSize:7, color:"#4ade80", fontWeight:800, padding:"1px 5px", borderRadius:3, background:"rgba(74,222,128,0.12)", letterSpacing:0.8, animation:"pulse 2s infinite" }}>● LIVE</span>}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2, flexWrap:"wrap" }}>
                    {displayChange>=0?<ChevronUp size={11} color="#4ade80"/>:<ChevronDown size={11} color="#f87171"/>}
                    <span style={{ color:displayChange>=0?"#4ade80":"#f87171", fontWeight:700, fontSize:11 }}>
                      {displayChange>=0?"+":""}{displayChange.toFixed(2)}%
                    </span>
                    {lp?.preMarketPrice&&<span style={{ fontSize:7, color:"#fbbf24", marginLeft:4 }}>Pre: ${lp.preMarketPrice.toFixed(2)} ({(lp.preMarketChange??0)>=0?"+":""}{(lp.preMarketChange??0).toFixed(2)}%)</span>}
                    {lp?.postMarketPrice&&<span style={{ fontSize:7, color:"#60a5fa", marginLeft:4 }}>AH: ${lp.postMarketPrice.toFixed(2)} ({(lp.postMarketChange??0)>=0?"+":""}{(lp.postMarketChange??0).toFixed(2)}%)</span>}
                  </div>
                </>
              ) : <div style={{ fontSize:22, color:"rgba(255,255,255,0.3)", fontWeight:900, marginBottom:4 }}>—</div>;
            })()}
            {(()=>{const ms=getMarketStatus(selectedSymbol);return(<span style={{color:ms.color,fontSize:8.5,fontWeight:ms.live?700:400,letterSpacing:0.5}}>{ms.live&&<span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:ms.color,boxShadow:`0 0 6px ${ms.color}`,marginRight:4,verticalAlign:"middle"}}/>}{ms.status}</span>);})()}
            {/* Action icons */}
            <div style={{ display:"flex", gap:5, marginTop:7 }}>
              {[<Star size={11}/>,<Bell size={11}/>,<BarChart3 size={11}/>,<Activity size={11}/>].map((icon,i)=>(
                <button key={i} style={{ padding:"4px 7px", borderRadius:5, border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.02)", color:"rgba(255,255,255,0.4)", cursor:"pointer" }}>{icon}</button>
              ))}
            </div>
          </div>

          {/* 3-tab row: Classic | Pulse AI | Dissection Lab */}
          <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
            <button onClick={()=>setRightTab("classic")} style={{ flex:1, padding:"7px 0", fontSize:8.5, fontWeight:700, border:"none", borderBottom:`2px solid ${rightTab==="classic"?"#7c3aed":"transparent"}`, background:"none", color:rightTab==="classic"?"#a78bfa":"rgba(255,255,255,0.4)", cursor:"pointer", marginBottom:-1 }}>Classic Trade</button>
            <button onClick={()=>{ setRightTab("pulseai"); setPulseAIActive(true); fetchTradeLogs(); }} data-testid="button-pulse-ai" style={{ flex:1, padding:"7px 0", fontSize:8.5, fontWeight:800, border:"none", borderBottom:`2px solid ${rightTab==="pulseai"?"#7c3aed":"transparent"}`, background:rightTab==="pulseai"?"rgba(124,58,237,0.08)":"none", color:rightTab==="pulseai"?"#a78bfa":"rgba(255,255,255,0.45)", cursor:"pointer", marginBottom:-1, display:"flex", alignItems:"center", justifyContent:"center", gap:3 }}>
              {pulseAIActive&&rightTab==="pulseai"&&<span style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", animation:"pulse 1.5s infinite", display:"inline-block" }}/>}
              ⚡ Pulse AI
            </button>
            <button onClick={()=>{ setRightTab("lab"); fetchVotes(); fetchPapers(); }} style={{ flex:1, padding:"7px 0", fontSize:8.5, fontWeight:700, border:"none", borderBottom:`2px solid ${rightTab==="lab"?"#f472b6":"transparent"}`, background:rightTab==="lab"?"rgba(244,114,182,0.06)":"none", color:rightTab==="lab"?"#f472b6":"rgba(255,255,255,0.4)", cursor:"pointer", marginBottom:-1, display:"flex", alignItems:"center", justifyContent:"center", gap:3 }}>
              <FlaskConical size={9}/> Lab
            </button>
          </div>

          {/* Right panel content */}
          <div style={{ flex:1, overflowY:"auto", scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,0.06) transparent" }}>

            {/* ── CLASSIC TRADE ── */}
            {rightTab==="classic" && (
              <div>
                <div style={{ padding:"9px 12px 6px" }}>
                  <div style={{ fontSize:10.5, fontWeight:800, color:"#fff", marginBottom:7 }}>Key Statistics</div>
                  {[["Open",selectedChartData?.open?.toFixed(2)??"—","Prev Close",selectedChartData?.price?.toFixed(2)??"—"],["High",selectedChartData?.high?.toFixed(2)??"—","Low",selectedChartData?.low?.toFixed(2)??"—"],["Volume",fmtVol(selectedChartData?.volume??0),"Avg Vol(3M)",avgVol],["52Wk High",w52h!=="—"?`$${w52h}`:"—","52Wk Low",w52l!=="—"?`$${w52l}`:"—"],["Market Cap","—","P/E(TTM)","N/A"],["P/E(FWD)","N/A","Dividend","—"],["EPS(TTM)","—","Div Yield","0.00%"],["Beta","—","Free Float","—"]].map(([l1,v1,l2,v2],i)=>(
                    <div key={i} style={{ display:"flex", padding:"3px 0", borderBottom:"1px solid rgba(255,255,255,0.02)" }}>
                      <span style={{ flex:1, color:"rgba(255,255,255,0.4)", fontSize:8.5 }}>{l1}</span>
                      <span style={{ minWidth:55, color:"#fff", fontWeight:600, fontSize:8.5, textAlign:"right" }}>{v1}</span>
                      <span style={{ flex:1, color:"rgba(255,255,255,0.4)", fontSize:8.5, textAlign:"right", paddingLeft:8 }}>{l2}</span>
                      <span style={{ minWidth:55, color:"#fff", fontWeight:600, fontSize:8.5, textAlign:"right" }}>{v2}</span>
                    </div>
                  ))}
                </div>
                {orgSignalSelected && (
                  <div style={{ margin:"8px 12px", padding:"9px 11px", borderRadius:9, background:selectedIsLong?"rgba(74,222,128,0.05)":"rgba(248,113,113,0.05)", border:`1px solid ${selectedIsLong?"rgba(74,222,128,0.18)":"rgba(248,113,113,0.18)"}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:8.5, fontWeight:900, color:"#a78bfa" }}>⭐ SOVEREIGN SIGNAL</span>
                      <span style={{ fontSize:7.5, fontWeight:900, padding:"1px 6px", borderRadius:4, background:selectedIsLong?"rgba(74,222,128,0.15)":"rgba(248,113,113,0.15)", color:selectedIsLong?"#4ade80":"#f87171" }}>{orgSignalSelected.stance}</span>
                    </div>
                    {[["EDGE",`${(orgSignalSelected.edge_final*100)?.toFixed(1)}`],["CONVICTION",`${orgSignalSelected.conviction}%`],["RISK LIVE",`${(orgSignalSelected.risk_live*100)?.toFixed(1)}%`],["PROFIT LOCK",`${(orgSignalSelected.profit_lock*100)?.toFixed(1)}%`],["POSITION SIZE f*",orgSignalSelected.size_f?.toFixed(2)],["STOP LIVE",`$${orgSignalSelected.stop_live?.toFixed(2)}`],["HORIZON",orgSignalSelected.horizon]].map(([l,v])=>(
                      <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"2px 0" }}>
                        <span style={{ color:"rgba(255,255,255,0.35)", fontSize:7.5 }}>{l}</span>
                        <span style={{ color:"#fff", fontWeight:700, fontSize:7.5 }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ marginTop:5, color:"rgba(255,255,255,0.35)", fontSize:7.5, textAlign:"right" }}>{orgSignalSelected.scientist_emoji} {orgSignalSelected.scientist_role}</div>
                  </div>
                )}
                <div style={{ padding:"10px 12px 8px" }}>
                  <div style={{ color:"rgba(255,255,255,0.35)", fontSize:8.5, marginBottom:5 }}>Side</div>
                  <div style={{ display:"flex", gap:5, marginBottom:9 }}>
                    <button style={{ flex:1, padding:"9px 0", borderRadius:6, border:"none", background:"#22c55e", color:"#fff", fontWeight:800, fontSize:12, cursor:"pointer" }}>Buy</button>
                    <button style={{ flex:1, padding:"9px 0", borderRadius:6, border:"1px solid rgba(255,255,255,0.09)", background:"rgba(255,255,255,0.02)", color:"rgba(255,255,255,0.65)", fontWeight:800, fontSize:12, cursor:"pointer" }}>Sell</button>
                  </div>
                  <div style={{ color:"rgba(255,255,255,0.35)", fontSize:8.5, marginBottom:4 }}>Order Type</div>
                  <select style={{ width:"100%", padding:"7px 9px", borderRadius:5, border:"1px solid rgba(255,255,255,0.09)", background:"#0a0014", color:"#fff", fontSize:10, outline:"none" }}>
                    <option>Market</option><option>Limit</option><option>Stop</option><option>Stop Limit</option>
                  </select>
                  <div style={{ color:"rgba(255,255,255,0.35)", fontSize:8.5, marginTop:7, marginBottom:4 }}>Quantity</div>
                  <input type="number" defaultValue={1} min={1} style={{ width:"100%", padding:"7px 9px", borderRadius:5, border:"1px solid rgba(255,255,255,0.09)", background:"#0a0014", color:"#fff", fontSize:10, outline:"none", boxSizing:"border-box" }}/>
                </div>
              </div>
            )}

            {/* ── PULSE AI LIVE FEED ── */}
            {rightTab==="pulseai" && (
              <div>
                {organism && (
                  <div style={{ padding:"9px 12px 7px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                      <span style={{ color:"#a78bfa", fontWeight:900, fontSize:9.5 }}>⭐ ORGANISM VITALS</span>
                      <span style={{ fontSize:7.5, fontWeight:700, padding:"1px 5px", borderRadius:4, background:"rgba(74,222,128,0.1)", color:"#4ade80", border:"1px solid rgba(74,222,128,0.2)" }}>● LIVE</span>
                    </div>
                    {[{l:"SCIENTISTS",v:`${organism.activeScientists}`,c:"#a78bfa"},{l:"TRADES",v:organism.totalTrades?.toLocaleString(),c:"#4ade80"},{l:"VOTES",v:organism.totalVotes?.toLocaleString(),c:"#fbbf24"},{l:"PAPERS",v:organism.totalPapers?.toLocaleString(),c:"#60a5fa"},{l:"MOOD",v:organism.mood,c:organism.mood==="HUNTING"?"#4ade80":"#fbbf24"},{l:"REGIME",v:organism.regime,c:organism.regime==="RISK-ON"?"#4ade80":"#f87171"},{l:"FEAR & GREED",v:organism.fearGreed?.toFixed(1),c:"#fbbf24"}].map(v=>(
                      <div key={v.l} style={{ display:"flex", justifyContent:"space-between", padding:"2.5px 0" }}>
                        <span style={{ color:"rgba(255,255,255,0.4)", fontSize:8.5 }}>{v.l}</span>
                        <span style={{ color:v.c, fontWeight:800, fontSize:8.5 }}>{v.v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {organism?.crispWeights && (
                  <div style={{ padding:"7px 12px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize:8.5, fontWeight:800, color:"#f472b6", marginBottom:5, display:"flex", alignItems:"center", gap:4 }}><Dna size={10}/> CRISPR λ WEIGHTS</div>
                    {Object.entries(organism.crispWeights).map(([k,v]:any)=>{
                      const labels:Record<string,string>={lambda1:"λ1 Momentum",lambda2:"λ2 Sup/Res",lambda3:"λ3 Vol-Pen",lambda4:"λ4 Lev-Pen",lambda6:"λ6 Risk-Disc",lambda7:"λ7 Profit-Lock"};
                      const colors:Record<string,string>={lambda1:"#4ade80",lambda2:"#60a5fa",lambda3:"#f87171",lambda4:"#fbbf24",lambda6:"#a78bfa",lambda7:"#34d399"};
                      const col=colors[k]||"#94a3b8";
                      return (
                        <div key={k} style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                          <span style={{ color:"rgba(255,255,255,0.35)", fontSize:7.5, minWidth:76 }}>{labels[k]||k}</span>
                          <div style={{ flex:1, height:3, background:"rgba(255,255,255,0.05)", borderRadius:2 }}>
                            <div style={{ width:`${Math.min(100,(v/2.0)*100)}%`, height:"100%", background:col, borderRadius:2 }}/>
                          </div>
                          <span style={{ color:col, fontWeight:800, fontSize:7.5, minWidth:28, textAlign:"right" }}>{(v as number).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {organism?.topEdgeTrades?.length>0 && (
                  <div style={{ padding:"7px 12px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize:8.5, fontWeight:800, color:"#4ade80", marginBottom:5 }}>🎯 HIGHEST EDGE SIGNALS</div>
                    {organism.topEdgeTrades.map((t:any,i:number)=>{ const isL=t.stance==="LONG"||t.stance==="HOLD-LONG"; return (
                      <div key={i} onClick={()=>selectSymbol(t.symbol,t.symbol)} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 7px", borderRadius:5, marginBottom:2, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)", cursor:"pointer" }}>
                        <span style={{ color:"#fff", fontWeight:800, fontSize:9.5, minWidth:38 }}>{t.symbol}</span>
                        <span style={{ fontSize:7, fontWeight:900, padding:"1px 4px", borderRadius:3, background:isL?"rgba(74,222,128,0.15)":"rgba(248,113,113,0.15)", color:isL?"#4ade80":"#f87171" }}>{t.stance}</span>
                        <span style={{ color:"rgba(255,255,255,0.4)", fontSize:7.5, flex:1 }}>CVX:{t.conviction}%</span>
                        <span style={{ color:"#a78bfa", fontSize:9 }}>{t.scientist_emoji}</span>
                      </div>
                    ); })}
                  </div>
                )}
                <div style={{ padding:"7px 12px 4px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:8.5, fontWeight:800, color:"#60a5fa" }}>📡 LIVE TRADE FEED</span>
                    <button onClick={fetchTradeLogs} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.3)", padding:0 }}><RefreshCw size={8}/></button>
                  </div>
                  {tradeLogs.slice(0,30).map((t:any,i:number)=>{ const isLong=t.stance==="LONG"||t.stance==="HOLD-LONG"; return (
                    <div key={i} onClick={()=>t.symbol&&selectSymbol(t.symbol,t.symbol)} style={{ padding:"4px 0", borderBottom:"1px solid rgba(255,255,255,0.03)", cursor:"pointer" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:1 }}>
                        <span style={{ color:"#fff", fontWeight:800, fontSize:8.5, minWidth:34 }}>{t.symbol}</span>
                        <span style={{ fontSize:7, fontWeight:900, padding:"0px 4px", borderRadius:3, background:isLong?"rgba(74,222,128,0.15)":"rgba(248,113,113,0.15)", color:isLong?"#4ade80":"#f87171" }}>{t.stance}</span>
                        <span style={{ color:"#a78bfa", fontSize:7.5, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.scientist_emoji} {t.scientist_role?.split(" ")[0]}</span>
                        <span style={{ color:"rgba(255,255,255,0.3)", fontSize:7 }}>{t.conviction}%</span>
                      </div>
                      <div style={{ display:"flex", gap:7 }}>
                        <span style={{ color:"rgba(255,255,255,0.25)", fontSize:6.5 }}>EDGE:{(t.edge_final*100)?.toFixed(1)}</span>
                        <span style={{ color:"rgba(255,255,255,0.25)", fontSize:6.5 }}>RISK:{(t.risk_live*100)?.toFixed(0)}%</span>
                        <span style={{ color:"rgba(255,255,255,0.25)", fontSize:6.5 }}>f*:{t.size_f?.toFixed(2)}</span>
                      </div>
                    </div>
                  ); })}
                </div>
              </div>
            )}

            {/* ── DISSECTION LAB ── */}
            {rightTab==="lab" && (
              <div>
                {/* Live computed values for selected symbol */}
                <div style={{ padding:"9px 12px 7px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                    <span style={{ fontSize:10, fontWeight:900, color:"#f472b6" }}>🔬 DISSECTION LAB</span>
                    <span style={{ fontSize:8, fontWeight:700, color:"#a78bfa" }}>{selectedSymbol.replace("-USD","")}</span>
                  </div>
                  {dissection ? (
                    <div>
                      <div style={{ fontSize:8, fontWeight:700, color:"rgba(255,255,255,0.3)", marginBottom:4, letterSpacing:"0.06em" }}>PULSE.TRADE LIVE OUTPUT</div>
                      {[["ASSET TYPE",dissection.asset_type,"#94a3b8"],["BELIEF.q",dissection.belief_q,"#a78bfa"],["EMOTION.ε",dissection.emotion_eps,"#f472b6"],["SL.band",dissection.sl_band,"#fbbf24"],["STOP.init",dissection.stop_init!=="—"?`$${dissection.stop_init}`:dissection.stop_init,"#fbbf24"],["STOP.live",dissection.stop_live!=="—"?`$${dissection.stop_live}`:dissection.stop_live,"#f87171"],["RISK.live",dissection.risk_live,"#f87171"],["PROFIT.lock",dissection.profit_lock,"#4ade80"],["EDGE.final",dissection.edge_final,"#4ade80"],["SIZE.f*",dissection.size_f,"#60a5fa"],["λ1 MOMENTUM",dissection.lambda1,"#4ade80"],["λ2 SUP/RES",dissection.lambda2,"#60a5fa"],["λ3 VOL-PEN",dissection.lambda3,"#f87171"],["λ4 LEV-PEN",dissection.lambda4,"#fbbf24"],["λ6 RISK-DISC",dissection.lambda6,"#a78bfa"],["λ7 PROF-LOCK",dissection.lambda7,"#34d399"]].map(([l,v,c])=>(
                        <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"2px 0" }}>
                          <span style={{ color:"rgba(255,255,255,0.35)", fontSize:7.5, fontFamily:"monospace" }}>{l}</span>
                          <span style={{ color:String(c), fontWeight:800, fontSize:7.5, fontFamily:"monospace" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color:"rgba(255,255,255,0.3)", fontSize:9, padding:"8px 0" }}>No signal data for {selectedSymbol.replace("-USD","")} — organism has not yet traded this symbol.</div>
                  )}
                </div>

                {/* PULSE.UNIVERSE Full Equation */}
                <div style={{ padding:"7px 12px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <span style={{ fontSize:9, fontWeight:900, color:"#a78bfa" }}>⭐ PULSE.UNIVERSE EQUATION</span>
                    <span style={{ fontSize:7, color:"rgba(255,255,255,0.3)" }}>FULL SOVEREIGN INVOCATION</span>
                  </div>
                  <div style={{ background:"#0a0015", borderRadius:7, border:"1px solid rgba(124,58,237,0.15)", padding:"8px 10px", maxHeight:220, overflowY:"auto", scrollbarWidth:"thin" }}>
                    <pre style={{ fontFamily:"monospace", fontSize:7, color:"rgba(255,255,255,0.7)", lineHeight:1.5, margin:0, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
                      {PULSE_UNIVERSE_EQ.split("\n").map((line,i)=>{
                        const isComment=line.trim().startsWith("//");
                        const isSection=line.trim().startsWith("//") && line.includes("===");
                        const isKeyword=line.includes(":=")||line.includes(":=");
                        const color=isSection?"#f472b6":isComment?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.75)";
                        return <span key={i} style={{ color, display:"block" }}>{line}</span>;
                      })}
                    </pre>
                  </div>
                </div>

                {/* Paper Accounts Leaderboard */}
                {paperAccounts.length>0 && (
                  <div style={{ padding:"7px 12px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize:8.5, fontWeight:800, color:"#34d399", marginBottom:6 }}>💰 SCIENTIST PAPER ACCOUNTS LEADERBOARD</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto", gap:"1px 8px", alignItems:"center" }}>
                      {paperAccounts.slice(0,10).map((a:any,i:number)=>{
                        const bal=parseFloat(a.balance)||100;
                        const pnl=parseFloat(a.total_pnl)||0;
                        const wr=a.total_trades>0?Math.round((a.winning_trades/a.total_trades)*100):0;
                        return (
                          <div key={a.scientist_id} style={{ display:"contents" }}>
                            <span style={{ fontSize:7, color:"rgba(255,255,255,0.6)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              <span style={{ color:"rgba(255,255,255,0.25)", marginRight:3 }}>#{i+1}</span>
                              {a.scientist_name||`Scientist ${a.scientist_id}`}
                            </span>
                            <span style={{ fontSize:7.5, fontWeight:800, color:bal>=100?"#4ade80":"#f87171", textAlign:"right" }}>${bal.toFixed(2)}</span>
                            <span style={{ fontSize:6.5, color:"rgba(255,255,255,0.3)", textAlign:"right" }}>{wr}%W · {a.total_trades||0}T</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Active CRISPR votes */}
                {scientistVotes.length>0 && (
                  <div style={{ padding:"7px 12px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize:8.5, fontWeight:800, color:"#fbbf24", marginBottom:5 }}>🗳️ ACTIVE CRISPR VOTES</div>
                    {scientistVotes.slice(0,5).map((v:any,i:number)=>(
                      <div key={i} style={{ padding:"5px 7px", borderRadius:5, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)", marginBottom:3 }}>
                        <div style={{ color:"rgba(255,255,255,0.7)", fontSize:7.5, lineHeight:1.4, marginBottom:3 }}>{v.proposal_text?.slice(0,80)}…</div>
                        <div style={{ display:"flex", gap:6 }}>
                          <span style={{ color:"#4ade80", fontSize:7, fontWeight:700 }}>✓ {v.votes_for} FOR</span>
                          <span style={{ color:"#f87171", fontSize:7, fontWeight:700 }}>✗ {v.votes_against} AGAINST</span>
                          <span style={{ color:"rgba(255,255,255,0.3)", fontSize:7, marginLeft:"auto" }}>{v.lambda_target}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Research Papers */}
                {tradingPapers.length>0 && (
                  <div style={{ padding:"7px 12px 10px" }}>
                    <div style={{ fontSize:8.5, fontWeight:800, color:"#60a5fa", marginBottom:5 }}>📄 RESEARCH PAPERS</div>
                    {tradingPapers.slice(0,4).map((p:any,i:number)=>(
                      <div key={i} style={{ padding:"7px 8px", borderRadius:6, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)", marginBottom:5 }}>
                        <div style={{ color:"#fff", fontSize:8, fontWeight:700, lineHeight:1.3, marginBottom:3 }}>{p.title?.slice(0,60)}…</div>
                        <div style={{ color:"rgba(255,255,255,0.4)", fontSize:7, lineHeight:1.4, marginBottom:4 }}>{p.findings?.slice(0,100)}…</div>
                        <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                          <span style={{ color:"#a78bfa", fontSize:7 }}>{p.scientist_emoji} {p.scientist_role?.split(" ").slice(0,2).join(" ")}</span>
                          <span style={{ color:"rgba(255,255,255,0.2)", fontSize:6.5, fontFamily:"monospace", marginLeft:"auto" }}>{p.publication_ref}</span>
                        </div>
                        <div style={{ marginTop:4, padding:"4px 6px", borderRadius:4, background:"rgba(124,58,237,0.06)", border:"1px solid rgba(124,58,237,0.1)" }}>
                          <code style={{ color:"#c4b5fd", fontSize:6.5, fontFamily:"monospace" }}>{p.equation_fragment?.slice(0,80)}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live status bar */}
          {pulseAIActive && (
            <div style={{ borderTop:"1px solid rgba(124,58,237,0.15)", padding:"3px 10px", background:"rgba(124,58,237,0.05)", flexShrink:0, display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", animation:"pulse 1.5s infinite", display:"inline-block" }}/>
              <span style={{ fontSize:7.5, color:"#4ade80", fontWeight:700 }}>PULSE AI — 42 SCIENTISTS ACTIVE</span>
              <button onClick={()=>{ setPulseAIActive(false); }} style={{ marginLeft:"auto", background:"none", border:"none", color:"rgba(255,255,255,0.25)", cursor:"pointer", fontSize:7 }}>STOP</button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
    </div>
  );
}
