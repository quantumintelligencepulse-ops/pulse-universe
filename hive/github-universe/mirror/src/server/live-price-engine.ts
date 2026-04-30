import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { Server } from "http";

// ── PRICE CACHE — latest price for every symbol ─────────────────────────────
export const priceCache: Record<string, {
  price: number; change: number; changeAmt?: number;
  preMarketPrice?: number; preMarketChange?: number;
  postMarketPrice?: number; postMarketChange?: number;
  marketState?: string; source: string; ts: number;
}> = {};

// ── SUBSCRIBERS — all connected frontend clients ─────────────────────────────
const subscribers = new Set<WebSocket>();

function broadcast(data: object) {
  const msg = JSON.stringify(data);
  for (const ws of subscribers) {
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.send(msg); } catch {}
    }
  }
}

// ── ALL SYMBOLS TO TRACK ─────────────────────────────────────────────────────
// Crypto symbols (always live, no market hours)
const CRYPTO_SYMBOLS = [
  "BTC-USD","ETH-USD","SOL-USD","BNB-USD","XRP-USD","ADA-USD",
  "DOGE-USD","AVAX-USD","LINK-USD","LTC-USD","DOT-USD","MATIC-USD",
  "UNI-USD","ATOM-USD","NEAR-USD","SHIB-USD","ARB-USD","OP-USD",
  "TRX-USD","FTM-USD","INJ-USD","SUI-USD",
];

// Stocks & ETFs & Indices
const STOCK_SYMBOLS = [
  "AAPL","MSFT","NVDA","GOOGL","META","TSLA","AMD","AMZN","ADBE","CRM","ORCL","QCOM","INTC",
  "JPM","BAC","WFC","GS","V","MA","AXP","C","MS","BLK","SCHW","PGR","CB",
  "LLY","UNH","JNJ","ABBV","MRK","TMO","ABT","PFE","CVS","BMY","ISRG",
  "XOM","CVX","SLB","COP","PXD","OXY",
  "PG","KO","PEP","MCD","WMT","COST","NKE","SBUX",
  "SPY","QQQ","DIA","IWM","VTI","GLD","SLV",
  "^GSPC","^DJI","^IXIC","^VIX","^TNX","DX-Y.NYB",
  "BRK-B","RTX","CAT","HON","GE","BA","FDX",
];

const ALL_SYMBOLS = [...CRYPTO_SYMBOLS, ...STOCK_SYMBOLS];

// ── YAHOO FINANCE QUOTE FAST POLL ────────────────────────────────────────────
let pollRunning = false;

async function fetchQuoteChunk(symbols: string[]): Promise<any[]> {
  try {
    const sym = symbols.join(",");
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(sym)}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketChange,preMarketPrice,preMarketChangePercent,postMarketPrice,postMarketChangePercent,marketState,shortName`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return [];
    const json: any = await r.json();
    return json?.quoteResponse?.result || [];
  } catch { return []; }
}

async function pollAllPrices() {
  if (pollRunning) return;
  pollRunning = true;
  try {
    // Split into chunks of 25 for Yahoo
    const chunks: string[][] = [];
    for (let i = 0; i < ALL_SYMBOLS.length; i += 25) {
      chunks.push(ALL_SYMBOLS.slice(i, i + 25));
    }

    // Fetch all chunks in parallel (Yahoo handles batch well)
    const results = await Promise.all(chunks.map(fetchQuoteChunk));

    for (const batch of results) {
      for (const q of batch) {
        const sym: string = q.symbol;
        const price: number | null = q.regularMarketPrice ?? null;
        if (price == null) continue;

        const change: number = q.regularMarketChangePercent ?? 0;
        const entry: any = {
          price,
          change: parseFloat(change.toFixed(3)),
          changeAmt: q.regularMarketChange ?? 0,
          marketState: q.marketState || "CLOSED",
          source: "yahoo",
          ts: Date.now(),
        };

        if (q.preMarketPrice != null) {
          entry.preMarketPrice = q.preMarketPrice;
          entry.preMarketChange = parseFloat((q.preMarketChangePercent ?? 0).toFixed(3));
        }
        if (q.postMarketPrice != null) {
          entry.postMarketPrice = q.postMarketPrice;
          entry.postMarketChange = parseFloat((q.postMarketChangePercent ?? 0).toFixed(3));
        }

        // Only broadcast if price changed (avoid noise)
        const prev = priceCache[sym];
        const changed = !prev || Math.abs(prev.price - price) > 0.0001 || prev.change !== entry.change;

        priceCache[sym] = entry;
        if (changed) {
          broadcast({ type: "price", symbol: sym, ...entry });
        }
      }
    }
  } catch {}
  pollRunning = false;
}

// ── START ENGINE ─────────────────────────────────────────────────────────────
export function startLivePriceEngine(httpServer: Server) {
  // 2026-04-27 FIX: use noServer + manual upgrade routing so we don't hijack
  // vite HMR upgrades. The previous {server, path} pattern aborted ALL upgrades
  // whose path didn't match /ws/prices — including vite's /vite-hmr — causing
  // an HMR death loop that flashed the dev iframe black every ~1s.
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req, socket, head) => {
    if (req.url === "/ws/prices") {
      wss.handleUpgrade(req, socket as any, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    }
    // else: leave alone — vite HMR / other handlers will pick it up
  });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    subscribers.add(ws);
    // Send full price cache snapshot to new client immediately
    for (const [symbol, data] of Object.entries(priceCache)) {
      if (ws.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify({ type: "price", symbol, ...data })); } catch {}
      }
    }
    ws.on("close", () => subscribers.delete(ws));
    ws.on("error", () => subscribers.delete(ws));
  });

  // Initial poll immediately
  pollAllPrices();

  // Poll every 2 seconds — Yahoo Finance returns near-real-time prices
  setInterval(pollAllPrices, 2000);

  console.log("[live-price] ⚡ LIVE PRICE ENGINE ONLINE — Yahoo Finance 2s polling — WebSocket /ws/prices");
  console.log(`[live-price] 📊 Tracking ${ALL_SYMBOLS.length} symbols (${CRYPTO_SYMBOLS.length} crypto + ${STOCK_SYMBOLS.length} stocks/ETFs/indices)`);
}
