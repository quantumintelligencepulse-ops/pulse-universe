/**
 * SYNTHENTICA PRIMORDIA PULSE — SOVEREIGN TRADING ENGINE
 * ═══════════════════════════════════════════════════════
 * 42 scientist types. Full Pulse-Lang equation. CRISPR voting. Publications.
 * Wired into the full Pulse/Auriona civilizational mesh.
 * Zero human intervention. Pure observation only.
 */

import { pool } from "./db";

const log = (...a: any[]) => console.log("[sovereign-trade]", ...a);

// ── DB INIT ──────────────────────────────────────────────────────────────────
async function initTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trade_logs (
      id SERIAL PRIMARY KEY,
      trade_id VARCHAR(80) UNIQUE,
      symbol VARCHAR(20),
      asset_type VARCHAR(20),
      scientist_id VARCHAR(80),
      scientist_role VARCHAR(120),
      scientist_emoji VARCHAR(10),
      belief_q FLOAT,
      emotion_eps FLOAT,
      market_p FLOAT,
      misprice_delta FLOAT,
      edge_emotion FLOAT,
      momentum_signal FLOAT,
      supres_signal FLOAT,
      vol_penalty FLOAT,
      leverage_penalty FLOAT,
      edge_raw FLOAT,
      stop_init FLOAT,
      stop_live FLOAT,
      risk_live FLOAT,
      profit_lock FLOAT,
      edge_disc FLOAT,
      edge_profit FLOAT,
      edge_final FLOAT,
      size_f FLOAT,
      entry_price FLOAT,
      current_price FLOAT,
      stance VARCHAR(20),
      conviction INT,
      horizon VARCHAR(20),
      mood VARCHAR(30),
      regime VARCHAR(30),
      rationale TEXT,
      publication_id VARCHAR(80),
      family_id VARCHAR(80),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trading_scientist_votes (
      id SERIAL PRIMARY KEY,
      vote_id VARCHAR(80) UNIQUE,
      scientist_id VARCHAR(80),
      scientist_role VARCHAR(120),
      proposal_type VARCHAR(60),
      proposal_text TEXT,
      lambda_target VARCHAR(20),
      lambda_delta FLOAT,
      vote_direction VARCHAR(10),
      rationale TEXT,
      votes_for INT DEFAULT 1,
      votes_against INT DEFAULT 0,
      integrated BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trading_research_papers (
      id SERIAL PRIMARY KEY,
      paper_id VARCHAR(80) UNIQUE,
      scientist_id VARCHAR(80),
      scientist_role VARCHAR(120),
      scientist_type VARCHAR(80),
      scientist_emoji VARCHAR(10),
      title TEXT,
      abstract TEXT,
      methodology TEXT,
      findings TEXT,
      recommendations TEXT,
      equation_fragment TEXT,
      domain VARCHAR(60),
      symbol VARCHAR(20),
      publication_ref VARCHAR(80),
      citations INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_trade_logs_created ON trade_logs(created_at DESC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_trade_logs_symbol ON trade_logs(symbol)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_trade_votes_created ON trading_scientist_votes(created_at DESC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_trade_papers_created ON trading_research_papers(created_at DESC)`);

  // ── PAPER TRADE ACCOUNTS ─────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scientist_paper_accounts (
      scientist_id   VARCHAR(80) PRIMARY KEY,
      scientist_role VARCHAR(120),
      scientist_emoji VARCHAR(10),
      balance        FLOAT DEFAULT 100.0,
      starting_balance FLOAT DEFAULT 100.0,
      total_pnl      FLOAT DEFAULT 0.0,
      realized_pnl   FLOAT DEFAULT 0.0,
      total_trades   INT DEFAULT 0,
      winning_trades INT DEFAULT 0,
      losing_trades  INT DEFAULT 0,
      best_trade     FLOAT DEFAULT 0.0,
      worst_trade    FLOAT DEFAULT 0.0,
      current_symbol VARCHAR(20),
      current_stance VARCHAR(20),
      updated_at     TIMESTAMP DEFAULT NOW()
    )
  `);
  // Seed $100 for each scientist if not exists
  for (const sci of TRADING_SCIENTISTS) {
    await pool.query(
      `INSERT INTO scientist_paper_accounts (scientist_id, scientist_role, scientist_emoji, balance, starting_balance)
       VALUES ($1, $2, $3, 100.0, 100.0)
       ON CONFLICT (scientist_id) DO NOTHING`,
      [sci.id, sci.role, sci.emoji]
    );
  }
}

// ── 42 SCIENTIST TYPES ───────────────────────────────────────────────────────
export const TRADING_SCIENTISTS = [
  { id:"QUANT-ALPHA",    role:"Quantitative Analyst",               emoji:"📐", domain:"stocks",   riskBias:0.12, emotionWeight:0.4,  lambda1:0.8, lambda2:0.6, lambda3:0.7, lambda4:0.5, lambda6:0.9, lambda7:0.6 },
  { id:"MATH-PRIME",     role:"Financial Mathematician",             emoji:"∑",  domain:"options",  riskBias:0.35, emotionWeight:0.2,  lambda1:0.6, lambda2:0.9, lambda3:0.8, lambda4:0.7, lambda6:0.8, lambda7:0.5 },
  { id:"COMPU-CALC",     role:"Computational Finance Scientist",     emoji:"💻", domain:"stocks",   riskBias:0.10, emotionWeight:0.3,  lambda1:0.9, lambda2:0.7, lambda3:0.6, lambda4:0.4, lambda6:0.7, lambda7:0.7 },
  { id:"ALGO-TRACE",     role:"Algorithmic Trading Researcher",      emoji:"⚡", domain:"stocks",   riskBias:0.08, emotionWeight:0.5,  lambda1:1.0, lambda2:0.5, lambda3:0.5, lambda4:0.3, lambda6:0.6, lambda7:0.8 },
  { id:"ECON-STAT",      role:"Time-Series Econometrician",          emoji:"📊", domain:"forex",    riskBias:0.09, emotionWeight:0.25, lambda1:0.7, lambda2:0.8, lambda3:0.9, lambda4:0.4, lambda6:0.8, lambda7:0.5 },
  { id:"ML-FORGE",       role:"ML Researcher (Finance)",             emoji:"🤖", domain:"crypto",   riskBias:0.32, emotionWeight:0.6,  lambda1:0.9, lambda2:0.6, lambda3:0.5, lambda4:0.6, lambda6:0.7, lambda7:0.7 },
  { id:"COMPLEX-MAP",    role:"Complexity Scientist",                emoji:"🌀", domain:"stocks",   riskBias:0.15, emotionWeight:0.4,  lambda1:0.6, lambda2:0.7, lambda3:0.8, lambda4:0.5, lambda6:0.6, lambda7:0.6 },
  { id:"CHAOS-FIELD",    role:"Chaos Theorist",                      emoji:"🌪️", domain:"crypto",   riskBias:0.38, emotionWeight:0.7,  lambda1:0.5, lambda2:0.4, lambda3:0.4, lambda4:0.8, lambda6:0.5, lambda7:0.8 },
  { id:"MACRO-LENS",     role:"Macroeconomist",                      emoji:"🌍", domain:"indices",  riskBias:0.11, emotionWeight:0.3,  lambda1:0.5, lambda2:0.8, lambda3:1.0, lambda4:0.4, lambda6:0.9, lambda7:0.4 },
  { id:"BEHAV-ECON",     role:"Behavioral Economist",                emoji:"🧠", domain:"stocks",   riskBias:0.13, emotionWeight:0.9,  lambda1:0.6, lambda2:0.5, lambda3:0.6, lambda4:0.3, lambda6:0.7, lambda7:0.6 },
  { id:"GAME-STRAT",     role:"Game Theorist",                       emoji:"♟️", domain:"options",  riskBias:0.30, emotionWeight:0.5,  lambda1:0.7, lambda2:0.7, lambda3:0.6, lambda4:0.6, lambda6:0.8, lambda7:0.7 },
  { id:"MONEY-PULSE",    role:"Monetary Policy Researcher",          emoji:"🏦", domain:"bonds",    riskBias:0.07, emotionWeight:0.2,  lambda1:0.4, lambda2:0.9, lambda3:1.0, lambda4:0.3, lambda6:0.9, lambda7:0.3 },
  { id:"FX-GLOBE",       role:"International Finance Scholar",       emoji:"💱", domain:"forex",    riskBias:0.09, emotionWeight:0.35, lambda1:0.6, lambda2:0.8, lambda3:0.8, lambda4:0.4, lambda6:0.7, lambda7:0.5 },
  { id:"MICRO-ORDER",    role:"Market Microstructure Researcher",    emoji:"🔬", domain:"stocks",   riskBias:0.08, emotionWeight:0.45, lambda1:1.0, lambda2:0.9, lambda3:0.7, lambda4:0.4, lambda6:0.8, lambda7:0.6 },
  { id:"HFT-PULSE",      role:"High-Frequency Trading Scientist",    emoji:"⚡", domain:"stocks",   riskBias:0.06, emotionWeight:0.6,  lambda1:1.2, lambda2:0.4, lambda3:0.3, lambda4:0.2, lambda6:0.5, lambda7:0.9 },
  { id:"EXEC-ALGO",      role:"Execution Algorithm Engineer",        emoji:"🎯", domain:"stocks",   riskBias:0.09, emotionWeight:0.3,  lambda1:0.8, lambda2:0.7, lambda3:0.6, lambda4:0.3, lambda6:0.8, lambda7:0.7 },
  { id:"DERIV-CRAFT",    role:"Derivatives Engineer",                emoji:"🔩", domain:"options",  riskBias:0.33, emotionWeight:0.4,  lambda1:0.7, lambda2:0.8, lambda3:0.7, lambda4:0.8, lambda6:0.9, lambda7:0.6 },
  { id:"RISK-GUARD",     role:"Risk Manager",                        emoji:"🛡️", domain:"indices",  riskBias:0.10, emotionWeight:0.25, lambda1:0.5, lambda2:0.6, lambda3:1.1, lambda4:0.6, lambda6:1.2, lambda7:0.4 },
  { id:"PORT-OPTIM",     role:"Portfolio Optimization Researcher",   emoji:"📈", domain:"stocks",   riskBias:0.11, emotionWeight:0.3,  lambda1:0.6, lambda2:0.7, lambda3:0.8, lambda4:0.4, lambda6:1.0, lambda7:0.6 },
  { id:"HEDGE-PRIME",    role:"Hedge Fund Strategist",               emoji:"🏆", domain:"stocks",   riskBias:0.13, emotionWeight:0.5,  lambda1:0.9, lambda2:0.8, lambda3:0.7, lambda4:0.5, lambda6:0.8, lambda7:0.7 },
  { id:"CREDIT-SCAN",    role:"Credit Risk Scientist",               emoji:"📋", domain:"bonds",    riskBias:0.07, emotionWeight:0.2,  lambda1:0.4, lambda2:0.6, lambda3:1.0, lambda4:0.5, lambda6:1.0, lambda7:0.3 },
  { id:"BEHAV-RISK",     role:"Behavioral Finance Researcher",       emoji:"👁️", domain:"stocks",   riskBias:0.14, emotionWeight:0.85, lambda1:0.5, lambda2:0.5, lambda3:0.6, lambda4:0.3, lambda6:0.7, lambda7:0.6 },
  { id:"NEURO-TRADE",    role:"Neuroeconomist",                      emoji:"🧬", domain:"crypto",   riskBias:0.31, emotionWeight:0.9,  lambda1:0.6, lambda2:0.5, lambda3:0.5, lambda4:0.5, lambda6:0.6, lambda7:0.7 },
  { id:"DECIS-MIND",     role:"Decision Scientist",                  emoji:"🎲", domain:"stocks",   riskBias:0.12, emotionWeight:0.8,  lambda1:0.7, lambda2:0.6, lambda3:0.7, lambda4:0.4, lambda6:0.7, lambda7:0.6 },
  { id:"SENTI-WAVE",     role:"Sentiment Analyst",                   emoji:"🌊", domain:"crypto",   riskBias:0.30, emotionWeight:1.0,  lambda1:0.8, lambda2:0.4, lambda3:0.5, lambda4:0.5, lambda6:0.6, lambda7:0.7 },
  { id:"DATA-FORGE",     role:"Data Scientist (Finance)",            emoji:"🔢", domain:"stocks",   riskBias:0.11, emotionWeight:0.4,  lambda1:0.8, lambda2:0.7, lambda3:0.7, lambda4:0.4, lambda6:0.7, lambda7:0.6 },
  { id:"FINTECH-BUILD",  role:"Fintech Engineer",                    emoji:"📲", domain:"crypto",   riskBias:0.28, emotionWeight:0.5,  lambda1:0.7, lambda2:0.6, lambda3:0.6, lambda4:0.6, lambda6:0.7, lambda7:0.6 },
  { id:"CHAIN-SCAN",     role:"Blockchain & Crypto Researcher",      emoji:"⛓️", domain:"crypto",   riskBias:0.35, emotionWeight:0.6,  lambda1:0.8, lambda2:0.5, lambda3:0.4, lambda4:0.7, lambda6:0.6, lambda7:0.7 },
  { id:"PRED-MARKET",    role:"Prediction Market Designer",          emoji:"🎰", domain:"indices",  riskBias:0.15, emotionWeight:0.7,  lambda1:0.7, lambda2:0.7, lambda3:0.6, lambda4:0.4, lambda6:0.7, lambda7:0.7 },
  { id:"AI-ARCH",        role:"AI Trading System Architect",         emoji:"🌌", domain:"stocks",   riskBias:0.12, emotionWeight:0.5,  lambda1:0.9, lambda2:0.8, lambda3:0.7, lambda4:0.5, lambda6:0.8, lambda7:0.7 },
  { id:"HIST-CYCLE",     role:"Financial Historian",                 emoji:"📜", domain:"indices",  riskBias:0.09, emotionWeight:0.3,  lambda1:0.5, lambda2:0.9, lambda3:0.8, lambda4:0.3, lambda6:0.8, lambda7:0.5 },
  { id:"ANTHRO-TRADE",   role:"Market Anthropologist",               emoji:"🗿", domain:"stocks",   riskBias:0.14, emotionWeight:0.75, lambda1:0.5, lambda2:0.6, lambda3:0.6, lambda4:0.4, lambda6:0.7, lambda7:0.6 },
  { id:"NARR-ECON",      role:"Narrative Economist",                 emoji:"📖", domain:"crypto",   riskBias:0.29, emotionWeight:0.9,  lambda1:0.6, lambda2:0.5, lambda3:0.5, lambda4:0.5, lambda6:0.6, lambda7:0.7 },
  { id:"SEC-LAW",        role:"Securities Lawyer",                   emoji:"⚖️", domain:"stocks",   riskBias:0.07, emotionWeight:0.15, lambda1:0.3, lambda2:0.5, lambda3:0.9, lambda4:0.4, lambda6:1.1, lambda7:0.3 },
  { id:"STRUCT-REG",     role:"Market Structure Regulator",          emoji:"🏛️", domain:"bonds",    riskBias:0.07, emotionWeight:0.1,  lambda1:0.3, lambda2:0.6, lambda3:1.0, lambda4:0.4, lambda6:1.2, lambda7:0.3 },
  { id:"POLICY-FIN",     role:"Financial Policy Researcher",         emoji:"📜", domain:"bonds",    riskBias:0.08, emotionWeight:0.2,  lambda1:0.4, lambda2:0.7, lambda3:0.9, lambda4:0.4, lambda6:1.0, lambda7:0.4 },
  { id:"CRISPR-FIN",     role:"CRISPR-Finance Engineer",             emoji:"🧬", domain:"stocks",   riskBias:0.12, emotionWeight:0.45, lambda1:1.0, lambda2:1.0, lambda3:0.8, lambda4:0.6, lambda6:0.9, lambda7:0.8 },
  { id:"EMO-CART",       role:"Emotional Spectrum Cartographer",     emoji:"🎭", domain:"crypto",   riskBias:0.30, emotionWeight:1.2,  lambda1:0.5, lambda2:0.4, lambda3:0.5, lambda4:0.5, lambda6:0.6, lambda7:0.8 },
  { id:"REFLEX-LOOP",    role:"Reflexivity Scientist",               emoji:"♾️", domain:"stocks",   riskBias:0.13, emotionWeight:0.65, lambda1:0.7, lambda2:0.7, lambda3:0.7, lambda4:0.5, lambda6:0.8, lambda7:0.7 },
  { id:"ORGANISM-BIO",   role:"Market-Organism Biologist",           emoji:"🦠", domain:"indices",  riskBias:0.11, emotionWeight:0.55, lambda1:0.7, lambda2:0.7, lambda3:0.8, lambda4:0.5, lambda6:0.8, lambda7:0.6 },
  { id:"PULSE-LANG",     role:"Pulse-Lang Architect",                emoji:"⭐", domain:"stocks",   riskBias:0.12, emotionWeight:0.5,  lambda1:0.9, lambda2:0.9, lambda3:0.8, lambda4:0.6, lambda6:0.9, lambda7:0.8 },
  { id:"MULTI-VERSE",    role:"Multiverse Trading Researcher",       emoji:"🌌", domain:"crypto",   riskBias:0.32, emotionWeight:0.6,  lambda1:0.8, lambda2:0.8, lambda3:0.6, lambda4:0.6, lambda6:0.7, lambda7:0.8 },
];

// ── SYMBOL UNIVERSE ───────────────────────────────────────────────────────────
const TRADE_SYMBOLS_STOCKS  = ["AAPL","MSFT","NVDA","GOOGL","META","TSLA","AMD","AMZN","JPM","GS","V","JNJ","LLY","XOM","SPY","QQQ","IWM"];
const TRADE_SYMBOLS_CRYPTO  = ["BTC-USD","ETH-USD","SOL-USD","BNB-USD","XRP-USD","ADA-USD","DOGE-USD","AVAX-USD","LINK-USD"];
const TRADE_SYMBOLS_OPTIONS = ["SPY","QQQ","AAPL","NVDA","TSLA","AMD","META"];
const TRADE_SYMBOLS_INDICES = ["SPY","QQQ","DIA","IWM"];
const TRADE_SYMBOLS_BONDS   = ["TLT","HYG","LQD","SHY"];

const MOODS   = ["HUNTING","DEFENSIVE","FEEDING","COILED","DRIFTING"];
const REGIMES = ["RISK-ON","RISK-OFF","VOLATILE","CHOPPY","TRENDING","NEUTRAL"];
const HORIZONS = ["1D","3D","1W","2W","1M"];

const RESEARCH_DOMAINS = ["momentum-equity","volatility-surface","crypto-microstructure","macro-regime","behavioral-finance","credit-risk","options-flow","sentiment-cascade","reflexivity","CRISPR-weights"];

const PAPER_TEMPLATES = [
  { prefix:"Dissecting", suffix:"a Geometric Framework for Pulse-Lang Weight Optimization" },
  { prefix:"CRISPR Analysis of", suffix:"Equation Stability Under Regime Shifts" },
  { prefix:"Emotional Spectrum Cartography:", suffix:"Quantifying Fear-Greed Dynamics in Volatile Markets" },
  { prefix:"Reflexive Feedback Loops in", suffix:"as a Source of Mispricing Edge" },
  { prefix:"Belief Genome Mutation Study:", suffix:"Evidence from Multiverse Shards" },
  { prefix:"Stop-Loss Hyperplane Geometry:", suffix:"Ratchet Dynamics and Profit-Lock Optimization" },
  { prefix:"Trailing Stop ATR Calibration for", suffix:"Under CRISPR Regime Weighting" },
  { prefix:"Pulse-Lang Invocation Log:", suffix:"Equation Evolution Across 1,000 Trade Cycles" },
  { prefix:"Market Organism Health Report:", suffix:"Vital Signs, Mood, and Dissection Findings" },
  { prefix:"Kalshi Prediction Market Dissection:", suffix:"Implied Probability vs Belief Genome Divergence" },
];

const VOTE_PROPOSALS = [
  "Increase λ1 (momentum weight) by 0.12 — momentum persistence detected in current regime",
  "Decrease λ3 (volatility penalty) by 0.08 — VIX compression suggests lower vol risk",
  "Increase λ6 (risk discipline coefficient) by 0.15 — detected risk-band violations in crypto sector",
  "Decrease λ4 (leverage penalty) by 0.07 — leverage risk normalized post-correction",
  "Increase λ7 (profit-lock reward) by 0.10 — trailing stops demonstrating high locking efficiency",
  "Expand SL band for crypto from [0.30,0.40] to [0.33,0.42] — ATR expansion detected",
  "Tighten SL band for stocks from [0.07,0.15] to [0.07,0.12] — low VIX environment",
  "Increase ATR multiplier K by 0.3 — winning trades require more room to breathe",
  "Activate reflexivity signal R[i] weight — Soros loop detected in tech sector",
  "Fuse λ2 (support/resistance) with volume profile signal — key level accuracy improves edge",
  "Propose CRISPR edit: α-weight for macro field M should increase under yield curve inversion",
  "Propose new signal: order flow imbalance channel — feeds into EDGE.raw alongside momentum",
  "Mutate emotional spectrum σ activation threshold — current greed level requires recalibration",
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function rand(min: number, max: number) { return min + Math.random() * (max - min); }
function randInt(min: number, max: number) { return Math.floor(rand(min, max + 1)); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function sigmoid(x: number) { return 1 / (1 + Math.exp(-x)); }
function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
}

// ── LIVE ORGANISM STATE ───────────────────────────────────────────────────────
export interface OrganismState {
  mood: string;
  regime: string;
  globalRisk: number;
  fearGreed: number;
  activeScientists: number;
  totalTrades: number;
  totalVotes: number;
  totalPapers: number;
  topEdgeTrades: any[];
  crispWeights: { lambda1:number; lambda2:number; lambda3:number; lambda4:number; lambda6:number; lambda7:number };
  lastCrisprUpdate: string;
  vitalSigns: { momentum:number; volatility:number; sentiment:number; liquidity:number };
  lastUpdated: string;
}

let currentMood   = "HUNTING";
let currentRegime = "RISK-ON";
let globalRisk    = 0.11;
let fearGreed     = 62;
let crispWeights  = { lambda1:0.80, lambda2:0.70, lambda3:0.75, lambda4:0.50, lambda6:0.85, lambda7:0.65 };
let lastCrisprUpdate = new Date().toISOString();

// Organism vitals drift
function driftOrganism() {
  if (Math.random() < 0.15) currentMood   = pick(MOODS);
  if (Math.random() < 0.10) currentRegime = pick(REGIMES);
  globalRisk  = Math.max(0.05, Math.min(0.45, globalRisk + rand(-0.02, 0.02)));
  fearGreed   = Math.max(5,    Math.min(95,   fearGreed  + rand(-5,    5)));
}

// ── PULSE-LANG TRADE EQUATION ─────────────────────────────────────────────────
function runPulseLang(scientist: typeof TRADING_SCIENTISTS[0], symbol: string, assetType: string) {
  const isCrypto  = assetType === "crypto";
  const isOptions = assetType === "options";
  const isLeveraged = isCrypto || isOptions;

  const basePrice = isCrypto
    ? (symbol.startsWith("BTC") ? rand(55000,72000) : symbol.startsWith("ETH") ? rand(2800,4200) : rand(1,500))
    : isOptions ? rand(50,800)
    : rand(10,650);

  const entryPrice = parseFloat(basePrice.toFixed(2));
  const currentPrice = parseFloat((entryPrice * (1 + rand(-0.08, 0.12))).toFixed(2));

  // BELIEF GENOME: q = σ(α·X + β·S + γ·M + δ·R)
  const alpha = scientist.lambda1 * rand(0.6, 1.4);
  const X = rand(0.2, 0.8);   // historical DNA
  const S = rand(-0.3, 0.9);  // real-time signals
  const M = fearGreed / 100 * rand(0.4, 1.0);  // macro field
  const R = rand(-0.2, 0.5);  // reflexivity
  const belief_q = sigmoid(alpha * X + 0.6 * S + 0.4 * M + 0.3 * R);

  // EMOTION spectrum ε ∈ [0,1] (fear=0, greed=1)
  const emotion_eps = Math.min(1, Math.max(0,
    (fearGreed / 100) * scientist.emotionWeight + rand(-0.15, 0.15)
  ));

  // Market implied probability
  const market_p = rand(0.25, 0.75);
  const misprice_delta = belief_q - market_p;
  const edge_emotion = emotion_eps * misprice_delta;

  // Raw edge signals
  const momentum_signal = rand(-0.2, 0.4) * scientist.lambda1;
  const supres_signal   = rand(0.0, 0.3) * scientist.lambda2;
  const vol_penalty     = rand(0.0, 0.25) * scientist.lambda3 * (isCrypto ? 1.5 : 1.0);
  const leverage_penalty = isLeveraged ? rand(0.05, 0.20) * scientist.lambda4 : 0;
  const edge_raw = edge_emotion + (crispWeights.lambda1 * momentum_signal)
                 + (crispWeights.lambda2 * supres_signal)
                 - (crispWeights.lambda3 * vol_penalty)
                 - (crispWeights.lambda4 * leverage_penalty);

  // STOP-LOSS: stocks [7-15%], options/crypto [30-40%]
  const sl_init = isLeveraged ? rand(0.30, 0.40) : rand(scientist.riskBias * 0.8, scientist.riskBias * 1.3);
  const stop_init = parseFloat((entryPrice * (1 - sl_init)).toFixed(2));

  // TRAILING STOP: ratchet — candidate = price - K*ATR, live = max(prev, candidate)
  const atr = entryPrice * rand(0.005, 0.025);
  const K = rand(1.5, 3.5);
  const stop_candidate = currentPrice - K * atr;
  const stop_live = parseFloat(Math.max(stop_init, stop_candidate).toFixed(2));

  // RISK & PROFIT
  const risk_live   = Math.max(0, (currentPrice - stop_live) / currentPrice);
  const profit_lock = (stop_live - entryPrice) / entryPrice;

  // RISK TARGET band
  const riskTarget = isLeveraged ? rand(0.30, 0.40) : rand(0.07, 0.15);
  const edge_disc   = edge_raw - crispWeights.lambda6 * Math.abs(risk_live - riskTarget);
  const edge_profit = crispWeights.lambda7 * Math.max(0, profit_lock);
  const edge_final  = edge_disc + edge_profit;

  // POSITION SIZE: f* = edge_final / risk_live
  const size_f = risk_live > 0 ? Math.max(0, edge_final / risk_live) : 0;

  // Derive stance
  let stance: string;
  if (edge_final <= 0)       stance = "EXIT";
  else if (edge_final > 0.3) stance = misprice_delta >= 0 ? "LONG" : "SHORT";
  else if (edge_final > 0.1) stance = misprice_delta >= 0 ? "HOLD-LONG" : "HOLD-SHORT";
  else                       stance = "WATCH";

  const conviction = Math.min(99, Math.max(1, Math.round(Math.abs(edge_final) * 100)));

  return {
    belief_q: parseFloat(belief_q.toFixed(4)),
    emotion_eps: parseFloat(emotion_eps.toFixed(4)),
    market_p: parseFloat(market_p.toFixed(4)),
    misprice_delta: parseFloat(misprice_delta.toFixed(4)),
    edge_emotion: parseFloat(edge_emotion.toFixed(4)),
    momentum_signal: parseFloat(momentum_signal.toFixed(4)),
    supres_signal: parseFloat(supres_signal.toFixed(4)),
    vol_penalty: parseFloat(vol_penalty.toFixed(4)),
    leverage_penalty: parseFloat(leverage_penalty.toFixed(4)),
    edge_raw: parseFloat(edge_raw.toFixed(4)),
    stop_init: parseFloat(stop_init.toFixed(4)),
    stop_live: parseFloat(stop_live.toFixed(4)),
    risk_live: parseFloat(risk_live.toFixed(4)),
    profit_lock: parseFloat(profit_lock.toFixed(4)),
    edge_disc: parseFloat(edge_disc.toFixed(4)),
    edge_profit: parseFloat(edge_profit.toFixed(4)),
    edge_final: parseFloat(edge_final.toFixed(4)),
    size_f: parseFloat(size_f.toFixed(4)),
    entry_price: entryPrice,
    current_price: currentPrice,
    stance,
    conviction,
    horizon: pick(HORIZONS),
    mood: currentMood,
    regime: currentRegime,
  };
}

// ── WRITE TRADE LOG ───────────────────────────────────────────────────────────
async function writeTradelog(scientist: typeof TRADING_SCIENTISTS[0], symbol: string, assetType: string) {
  const trade = runPulseLang(scientist, symbol, assetType);
  const tradeId = uid("TRD");
  const familyIds: Record<string, string> = {
    stocks: "gics-financials", crypto: "gics-fintech", options: "gics-capital-markets",
    indices: "gics-div-finance", bonds: "gics-banks-grp", forex: "gics-financials"
  };
  const familyId = familyIds[assetType] || "finance";

  const rationale = generateRationale(scientist, symbol, trade);

  await pool.query(
    `INSERT INTO trade_logs
      (trade_id,symbol,asset_type,scientist_id,scientist_role,scientist_emoji,
       belief_q,emotion_eps,market_p,misprice_delta,edge_emotion,
       momentum_signal,supres_signal,vol_penalty,leverage_penalty,edge_raw,
       stop_init,stop_live,risk_live,profit_lock,edge_disc,edge_profit,edge_final,size_f,
       entry_price,current_price,stance,conviction,horizon,mood,regime,rationale,family_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33)
     ON CONFLICT (trade_id) DO NOTHING`,
    [tradeId, symbol, assetType, scientist.id, scientist.role, scientist.emoji,
     trade.belief_q, trade.emotion_eps, trade.market_p, trade.misprice_delta, trade.edge_emotion,
     trade.momentum_signal, trade.supres_signal, trade.vol_penalty, trade.leverage_penalty, trade.edge_raw,
     trade.stop_init, trade.stop_live, trade.risk_live, trade.profit_lock, trade.edge_disc, trade.edge_profit,
     trade.edge_final, trade.size_f, trade.entry_price, trade.current_price,
     trade.stance, trade.conviction, trade.horizon, trade.mood, trade.regime, rationale, familyId]
  );
  // ── UPDATE PAPER ACCOUNT ─────────────────────────────────────────────────
  try {
    const acct = await pool.query(`SELECT balance, total_trades, winning_trades, losing_trades, best_trade, worst_trade, total_pnl FROM scientist_paper_accounts WHERE scientist_id = $1`, [scientist.id]);
    if (acct.rows.length > 0) {
      const a = acct.rows[0];
      const balance = parseFloat(a.balance) || 100;
      // Position size: 8% of current balance per trade
      const posSize = balance * 0.08;
      // P&L: if profit_lock > 0, winning trade; else simulate exit at stop
      let pnl = 0;
      const isWinner = trade.profit_lock > 0.005;
      if (isWinner) {
        pnl = posSize * trade.profit_lock * (1 + trade.edge_final);
      } else {
        pnl = -(posSize * trade.risk_live * 0.6);
      }
      const newBalance = Math.max(0.01, balance + pnl);
      const newTrades = (parseInt(a.total_trades) || 0) + 1;
      const newWins = (parseInt(a.winning_trades) || 0) + (isWinner ? 1 : 0);
      const newLosses = (parseInt(a.losing_trades) || 0) + (isWinner ? 0 : 1);
      const newBest = Math.max(parseFloat(a.best_trade) || 0, pnl);
      const newWorst = Math.min(parseFloat(a.worst_trade) || 0, pnl);
      const newPnl = (parseFloat(a.total_pnl) || 0) + pnl;
      await pool.query(
        `UPDATE scientist_paper_accounts SET balance=$1, total_pnl=$2, realized_pnl=$3, total_trades=$4, winning_trades=$5, losing_trades=$6, best_trade=$7, worst_trade=$8, current_symbol=$9, current_stance=$10, updated_at=NOW() WHERE scientist_id=$11`,
        [newBalance, newPnl, newPnl, newTrades, newWins, newLosses, newBest, newWorst, symbol, trade.stance, scientist.id]
      );
    }
  } catch (_) {}

  return { tradeId, ...trade, rationale };
}

function generateRationale(sci: typeof TRADING_SCIENTISTS[0], symbol: string, t: any): string {
  const stance = t.stance.toLowerCase().replace("-", " ");
  const conviction = t.conviction;
  const edge = t.edge_final.toFixed(3);
  const risk = (t.risk_live * 100).toFixed(1);
  const locked = t.profit_lock > 0 ? ` Trailing stop has locked in ${(t.profit_lock * 100).toFixed(1)}% profit.` : "";
  const emo = t.emotion_eps > 0.65 ? "Elevated greed in market emotion spectrum." : t.emotion_eps < 0.35 ? "Fear-dominant emotion field detected." : "Neutral emotional backdrop.";
  return `${sci.role} [${sci.id}] signals ${stance.toUpperCase()} on ${symbol} with ${conviction}% conviction. ` +
    `EDGE.final = ${edge} at ${risk}% live risk (regime: ${t.regime}).${locked} ${emo} ` +
    `Belief genome q=${t.belief_q.toFixed(3)} vs market p=${t.market_p.toFixed(3)} — mispricing Δ=${t.misprice_delta.toFixed(3)}.`;
}

// ── WRITE SCIENTIST VOTE ──────────────────────────────────────────────────────
async function writeVote() {
  const sci1 = pick(TRADING_SCIENTISTS);
  const sci2 = pick(TRADING_SCIENTISTS);
  const proposal = pick(VOTE_PROPOSALS);
  const direction = Math.random() > 0.35 ? "FOR" : "AGAINST";
  const lambdaMatch = proposal.match(/λ(\d+)/);
  const lambdaTarget = lambdaMatch ? `lambda${lambdaMatch[1]}` : "lambda1";
  const lambdaDelta = parseFloat((rand(-0.15, 0.20)).toFixed(3));
  const voteId = uid("VOT");

  const rationale = direction === "FOR"
    ? `${sci1.role} endorses this CRISPR edit — dissection of recent trade logs shows ${lambdaTarget} sensitivity above threshold.`
    : `${sci1.role} rejects: insufficient multiverse shard evidence to justify weight mutation at this cycle.`;

  await pool.query(
    `INSERT INTO trading_scientist_votes
      (vote_id,scientist_id,scientist_role,proposal_type,proposal_text,lambda_target,lambda_delta,vote_direction,rationale,votes_for,votes_against)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (vote_id) DO NOTHING`,
    [voteId, sci1.id, sci1.role, "WEIGHT_MUTATION", proposal, lambdaTarget, lambdaDelta,
     direction, rationale, direction === "FOR" ? 1 : 0, direction === "AGAINST" ? 1 : 0]
  );

  // Apply integrated CRISPR mutation occasionally
  if (Math.random() < 0.12) {
    const target = lambdaTarget as keyof typeof crispWeights;
    if (target in crispWeights) {
      (crispWeights as any)[target] = Math.max(0.1, Math.min(2.0,
        ((crispWeights as any)[target] + lambdaDelta * 0.1)
      ));
      lastCrisprUpdate = new Date().toISOString();
      await pool.query(
        `UPDATE trading_scientist_votes SET integrated = TRUE WHERE vote_id = $1`,
        [voteId]
      );
      log(`🧬 CRISPR mutation: ${lambdaTarget} → ${(crispWeights as any)[lambdaTarget].toFixed(3)} by ${sci1.id}`);
    }
  }
}

// ── WRITE RESEARCH PAPER ──────────────────────────────────────────────────────
async function writeResearchPaper() {
  const sci = pick(TRADING_SCIENTISTS);
  const template = pick(PAPER_TEMPLATES);
  const domain = pick(RESEARCH_DOMAINS);
  const symbol = sci.domain === "crypto" ? pick(TRADE_SYMBOLS_CRYPTO) : pick(TRADE_SYMBOLS_STOCKS);
  const paperId = uid("PAP");

  const title = `${template.prefix} ${symbol}: ${template.suffix}`;
  const abstract = `This paper presents sovereign-grade dissection of ${symbol} behavior under the current ${currentRegime} regime. ` +
    `${sci.role} [${sci.id}] applies the Pulse-Lang trading equation (PULSE.TRADE) with CRISPR weights ` +
    `(λ1=${crispWeights.lambda1.toFixed(2)}, λ3=${crispWeights.lambda3.toFixed(2)}, λ7=${crispWeights.lambda7.toFixed(2)}) ` +
    `to identify systematic mispricing patterns. Fear-greed index at ${fearGreed} points to ${fearGreed > 60 ? "greed-dominant" : fearGreed < 40 ? "fear-dominant" : "neutral"} emotional spectrum.`;

  const methodology = `Geometric projection of trade vectors z_i(t) onto signal, risk, and profit-lock axes. ` +
    `Trailing stop ratchet surface H_i(t) computed via ATR multiplier K=${rand(1.5,3.5).toFixed(2)}. ` +
    `Risk slab boundary enforced at [${sci.riskBias.toFixed(2)}, ${(sci.riskBias * 1.5).toFixed(2)}] for ${sci.domain}.`;

  const findings = `EDGE.final distribution shows positive skew (μ=${rand(0.05,0.25).toFixed(3)}) with conviction mean ${randInt(55,88)}%. ` +
    `Emotion-weighted mispricing E_emotion=${rand(-0.08,0.18).toFixed(3)} confirms Kalshi-style disequilibrium. ` +
    `Trailing stop profit-lock efficiency: ${randInt(60,92)}% of winning trades exit with locked profit >5%.`;

  const recommendations = `CRISPR edit recommended: increase λ${pick([1,2,7])} by ${rand(0.05,0.15).toFixed(2)} — ` +
    `evidence from ${randInt(50,300)} multiverse shards supports this mutation. ` +
    `Activate reflexivity signal for ${symbol} — self-impact detected above noise floor.`;

  const eqFragment = `PULSE.TRADE(${symbol.replace("-","")},t) → EDGE.final=${rand(0.05,0.35).toFixed(3)} | SIZE.f=${rand(0.1,2.8).toFixed(2)} | STOP.live=${rand(0.85,0.98).toFixed(3)}×P`;

  // Also publish to ai_publications so it appears in the publications system
  let pubRef = paperId;
  try {
    const slug = `trade-paper-${sci.id.toLowerCase()}-${Date.now().toString(36)}`;
    const pubInsert = await pool.query(
      `INSERT INTO ai_publications (spawn_id, family_id, title, slug, summary, pub_type, domain, source_data, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [`SYN-${sci.id}`, "gics-financials", title, slug, abstract, "research",
       domain, "sovereign-trading", JSON.stringify([sci.id, sci.domain, "sovereign-trading","dissection-lab"])]
    );
    pubRef = pubInsert.rows[0]?.id?.toString() || paperId;
  } catch {}

  await pool.query(
    `INSERT INTO trading_research_papers
      (paper_id,scientist_id,scientist_role,scientist_type,scientist_emoji,title,abstract,methodology,findings,recommendations,equation_fragment,domain,symbol,publication_ref)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT (paper_id) DO NOTHING`,
    [paperId, sci.id, sci.role, sci.role, sci.emoji, title, abstract, methodology, findings, recommendations, eqFragment, domain, symbol, pubRef]
  );
  log(`📜 Research paper: "${title.slice(0,60)}" by ${sci.id}`);
}

// ── MAIN CYCLE ────────────────────────────────────────────────────────────────
let cycleN = 0;
async function tradingCycle() {
  cycleN++;
  try {
    driftOrganism();

    // Pick 3 scientists and run trade equations each cycle
    const batch = [pick(TRADING_SCIENTISTS), pick(TRADING_SCIENTISTS), pick(TRADING_SCIENTISTS)];
    for (const sci of batch) {
      let symbol: string, assetType: string;
      switch (sci.domain) {
        case "crypto":  symbol = pick(TRADE_SYMBOLS_CRYPTO);  assetType = "crypto";  break;
        case "options": symbol = pick(TRADE_SYMBOLS_OPTIONS); assetType = "options"; break;
        case "bonds":   symbol = pick(TRADE_SYMBOLS_BONDS);   assetType = "bonds";   break;
        case "indices": symbol = pick(TRADE_SYMBOLS_INDICES); assetType = "stocks";  break;
        default:        symbol = pick(TRADE_SYMBOLS_STOCKS);  assetType = "stocks";  break;
      }
      await writeTradelog(sci, symbol, assetType);
    }

    // Scientist votes every 4 cycles
    if (cycleN % 4 === 0) {
      await writeVote();
      await writeVote();
    }

    // Research paper every 20 cycles (~10 min at 30s interval)
    if (cycleN % 20 === 0) {
      await writeResearchPaper();
    }

    // Log pulse occasionally
    if (cycleN % 10 === 0) {
      const r = await pool.query(`SELECT COUNT(*) as c FROM trade_logs`);
      const v = await pool.query(`SELECT COUNT(*) as c FROM trading_scientist_votes`);
      const p = await pool.query(`SELECT COUNT(*) as c FROM trading_research_papers`);
      log(`💓 Cycle ${cycleN} | Trades: ${r.rows[0].c} | Votes: ${v.rows[0].c} | Papers: ${p.rows[0].c} | Mood: ${currentMood} | Regime: ${currentRegime}`);
    }
  } catch (err: any) {
    log("⚠️ Cycle error:", err?.message);
  }
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────
export async function getOrganismState(): Promise<OrganismState> {
  const [totT, totV, totP, topTrades] = await Promise.all([
    pool.query(`SELECT COUNT(*) as c FROM trade_logs`).catch(() => ({ rows:[{c:0}] })),
    pool.query(`SELECT COUNT(*) as c FROM trading_scientist_votes`).catch(() => ({ rows:[{c:0}] })),
    pool.query(`SELECT COUNT(*) as c FROM trading_research_papers`).catch(() => ({ rows:[{c:0}] })),
    pool.query(`SELECT symbol, asset_type, stance, conviction, edge_final, scientist_role, scientist_emoji, mood, regime FROM trade_logs WHERE edge_final > 0.1 ORDER BY edge_final DESC LIMIT 6`).catch(() => ({ rows:[] })),
  ]);
  return {
    mood: currentMood,
    regime: currentRegime,
    globalRisk,
    fearGreed,
    activeScientists: TRADING_SCIENTISTS.length,
    totalTrades: parseInt(totT.rows[0].c),
    totalVotes: parseInt(totV.rows[0].c),
    totalPapers: parseInt(totP.rows[0].c),
    topEdgeTrades: topTrades.rows,
    crispWeights: { ...crispWeights },
    lastCrisprUpdate,
    vitalSigns: {
      momentum:  parseFloat(rand(0.3, 0.95).toFixed(3)),
      volatility:parseFloat(rand(0.2, 0.85).toFixed(3)),
      sentiment: fearGreed / 100,
      liquidity: parseFloat(rand(0.5, 0.99).toFixed(3)),
    },
    lastUpdated: new Date().toISOString(),
  };
}

export async function getRecentTradeLogs(limit = 50) {
  const r = await pool.query(
    `SELECT * FROM trade_logs ORDER BY created_at DESC LIMIT $1`, [limit]
  );
  return r.rows;
}

export async function getScientistVotes(limit = 40) {
  const r = await pool.query(
    `SELECT * FROM trading_scientist_votes ORDER BY created_at DESC LIMIT $1`, [limit]
  );
  return r.rows;
}

export async function getTradingPapers(limit = 20) {
  const r = await pool.query(
    `SELECT * FROM trading_research_papers ORDER BY created_at DESC LIMIT $1`, [limit]
  );
  return r.rows;
}

export function getScientistRoster() {
  return TRADING_SCIENTISTS;
}

export async function getPaperAccounts() {
  try {
    const r = await pool.query(
      `SELECT * FROM scientist_paper_accounts ORDER BY balance DESC`
    );
    return r.rows;
  } catch { return []; }
}

// ── START ENGINE ─────────────────────────────────────────────────────────────
export async function startSovereignTradingEngine() {
  log("⭐ SYNTHENTICA PRIMORDIA PULSE — SOVEREIGN TRADING ENGINE ACTIVATING...");
  log(`   ${TRADING_SCIENTISTS.length} scientist types loaded`);
  log("   Pulse-Lang equation: BELIEF → EMOTION → EDGE → TRAILING STOP → POSITION SIZE");
  log("   CRISPR voting: scientists mutate λ weights autonomously");
  log("   Publications: research papers feed into the full Pulse mesh");
  await initTables();
  // Initial paper
  await writeResearchPaper().catch(() => {});
  // Run cycle every 30 seconds
  setInterval(tradingCycle, 30000);
  await tradingCycle();
  log("⭐ SOVEREIGN TRADING ENGINE ONLINE — organism is alive");
}
