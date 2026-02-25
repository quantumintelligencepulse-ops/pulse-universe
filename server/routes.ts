import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertSocialProfileSchema, insertSocialPostSchema, insertSocialCommentSchema } from "@shared/schema";
import Groq from "groq-sdk";
import { search, searchNews, searchVideos } from "duck-duck-scrape";
import { Client, GatewayIntentBits } from "discord.js";
import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";

const GROQ_API_KEY = "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";
const groq = new Groq({ apiKey: GROQ_API_KEY });

const DISCORD_TOKEN = "MTQyMjAxNjAwNTM2MTg5NzU2NQ.Gcy0a4.k6EVpuY2pP19Knwfu6-jskl1S1rMGfwNjqpuXc";
const KNOWLEDGE_CHANNEL_IDS = [
  "1371201135700082729", "1371988282652495962", "1313331216610754632",
  "1371964994153087056", "1396151828386676837", "1396151895877222520",
  "1383304452047634462", "1014567263212421212", "1358264301822935210",
  "1358264608707579954", "1358265683515015310", "1358270022925156432",
  "1358277176797036636", "1358282348969332828", "1475496566889386145",
  "1433383711587434518", "1475773035188326436",
];

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
let discordKnowledge = "";

discordClient.once("ready", async () => {
  console.log("Discord bot connected. Fetching knowledge channels...");
  try {
    const snippets: string[] = [];
    for (const channelId of KNOWLEDGE_CHANNEL_IDS) {
      try {
        const channel = await discordClient.channels.fetch(channelId);
        if (channel && channel.isTextBased()) {
          const msgs = await (channel as any).messages.fetch({ limit: 5 });
          for (const [, msg] of msgs) {
            if (msg.content && msg.content.length > 10) {
              snippets.push(msg.content.substring(0, 150));
            }
          }
        }
      } catch { }
    }
    discordKnowledge = snippets.slice(0, 15).join("\n");
    console.log(`Loaded ${snippets.length} knowledge snippets (${discordKnowledge.length} chars).`);
  } catch (e) {
    console.error("Discord knowledge fetch error:", e);
  }
});

discordClient.login(DISCORD_TOKEN).catch(e => console.error("Discord login failed:", e.message));

async function getSearchContext(query: string): Promise<string> {
  try {
    const { SafeSearchType } = await import("duck-duck-scrape");
    const results = await search(query, { safeSearch: SafeSearchType.OFF });
    if (results?.results?.length) {
      return results.results.slice(0, 3).map(r => r.description || "").filter(Boolean).join("\n");
    }
  } catch (e) {
    console.error("Search error:", e);
  }
  return "";
}

async function getWeather(query: string): Promise<string> {
  try {
    const locationMatch = query.match(/weather\s+(?:in|for|at|of)?\s*(.+?)(?:\?|$|\.|\!)/i) ||
      query.match(/(?:what(?:'s| is) the )?weather\s+(?:in|for|at|of)\s+(.+?)(?:\?|$|\.|\!)/i) ||
      query.match(/(?:how(?:'s| is)(?: the)? weather)\s+(?:in|for|at|of)?\s*(.+?)(?:\?|$|\.|\!)/i) ||
      query.match(/weather\s+(.+)/i);
    let location = locationMatch ? locationMatch[1].trim() : "";
    if (!location) return "";

    const STATE_NAMES = ["alabama","alaska","arizona","arkansas","california","colorado","connecticut","delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa","kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan","minnesota","mississippi","missouri","montana","nebraska","nevada","new hampshire","new jersey","new mexico","new york","north carolina","north dakota","ohio","oklahoma","oregon","pennsylvania","rhode island","south carolina","south dakota","tennessee","texas","utah","vermont","virginia","washington","west virginia","wisconsin","wyoming"];
    const STATE_CITIES: Record<string, string> = { "alabama": "Birmingham", "alaska": "Anchorage", "arizona": "Phoenix", "arkansas": "Little Rock", "california": "Los Angeles", "colorado": "Denver", "connecticut": "Hartford", "delaware": "Wilmington", "florida": "Miami", "georgia": "Atlanta", "hawaii": "Honolulu", "idaho": "Boise", "illinois": "Chicago", "indiana": "Indianapolis", "iowa": "Des Moines", "kansas": "Wichita", "kentucky": "Louisville", "louisiana": "New Orleans", "maine": "Portland", "maryland": "Baltimore", "massachusetts": "Boston", "michigan": "Detroit", "minnesota": "Minneapolis", "mississippi": "Jackson", "missouri": "Kansas City", "montana": "Billings", "nebraska": "Omaha", "nevada": "Las Vegas", "new hampshire": "Manchester", "new jersey": "Newark", "new mexico": "Albuquerque", "new york": "New York", "north carolina": "Charlotte", "north dakota": "Fargo", "ohio": "Columbus", "oklahoma": "Oklahoma City", "oregon": "Portland", "pennsylvania": "Philadelphia", "rhode island": "Providence", "south carolina": "Charleston", "south dakota": "Sioux Falls", "tennessee": "Nashville", "texas": "Houston", "utah": "Salt Lake City", "vermont": "Burlington", "virginia": "Richmond", "washington": "Seattle", "west virginia": "Charleston", "wisconsin": "Milwaukee", "wyoming": "Cheyenne" };

    const lowerLoc = location.toLowerCase().replace(/,/g, " ").replace(/\s+/g, " ").trim();
    let searchCity = location;
    let targetState = "";

    if (STATE_CITIES[lowerLoc]) {
      searchCity = STATE_CITIES[lowerLoc];
    } else {
      const foundState = STATE_NAMES.find(s => {
        const escaped = s.replace(/ /g, "\\s*");
        return new RegExp(`\\b${escaped}\\s*$`, "i").test(lowerLoc);
      });
      if (foundState) {
        targetState = foundState;
        const cityPart = lowerLoc.replace(new RegExp(`\\s*${foundState.replace(/ /g, "\\s*")}\\s*$`, "i"), "").trim();
        searchCity = cityPart || STATE_CITIES[foundState] || location;
      }
      searchCity = searchCity.replace(/,.*$/, "").trim();
    }

    const geoResp = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchCity)}&count=10&language=en&format=json`, { signal: AbortSignal.timeout(5000) });
    if (!geoResp.ok) return "";
    const geoData = await geoResp.json() as any;
    const geoResults = geoData.results || [];
    if (geoResults.length === 0) return "";

    let place = geoResults[0];
    if (targetState && geoResults.length > 1) {
      const stateMatch = geoResults.find((r: any) => r.admin1?.toLowerCase() === targetState.toLowerCase() || r.country?.toLowerCase() === targetState.toLowerCase());
      if (stateMatch) place = stateMatch;
    }
    if (!place) return "";

    const { latitude, longitude, name, admin1, country } = place;
    const weatherResp = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=3&timezone=auto`, { signal: AbortSignal.timeout(5000) });
    if (!weatherResp.ok) return "";
    const w = await weatherResp.json() as any;
    const cur = w.current;
    if (!cur) return "";

    const WMO: Record<number, string> = { 0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Foggy", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains", 80: "Light showers", 81: "Showers", 82: "Heavy showers", 85: "Light snow showers", 86: "Heavy snow showers", 95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm" };
    const desc = WMO[cur.weather_code] || "Unknown";
    const tempF = Math.round(cur.temperature_2m);
    const tempC = Math.round((tempF - 32) * 5 / 9);
    const feelsF = Math.round(cur.apparent_temperature);
    const humid = cur.relative_humidity_2m;
    const windMph = Math.round(cur.wind_speed_10m);

    const daily = w.daily;
    const forecast = daily?.time?.slice(0, 3).map((d: string, i: number) => {
      const hi = Math.round(daily.temperature_2m_max[i]);
      const lo = Math.round(daily.temperature_2m_min[i]);
      const dayDesc = WMO[daily.weather_code[i]] || "";
      return `${d}: High ${hi}°F, Low ${lo}°F - ${dayDesc}`;
    }).join("\n") || "";

    return `LIVE WEATHER DATA for ${name}${admin1 ? ", " + admin1 : ""}${country ? ", " + country : ""}:
Current: ${desc}, ${tempF}°F (${tempC}°C), Feels like ${feelsF}°F
Wind: ${windMph} mph, Humidity: ${humid}%
3-Day Forecast:\n${forecast}`;
  } catch (e) {
    console.error("Weather fetch error:", e);
    return "";
  }
}

const COMMON_TICKERS: Record<string, string> = {
  "apple": "AAPL", "google": "GOOGL", "alphabet": "GOOGL", "microsoft": "MSFT", "amazon": "AMZN",
  "tesla": "TSLA", "meta": "META", "facebook": "META", "netflix": "NFLX", "nvidia": "NVDA",
  "amd": "AMD", "intel": "INTC", "disney": "DIS", "nike": "NKE", "walmart": "WMT",
  "target": "TGT", "costco": "COST", "starbucks": "SBUX", "mcdonalds": "MCD", "coca-cola": "KO",
  "pepsi": "PEP", "boeing": "BA", "ford": "F", "gm": "GM", "general motors": "GM",
  "uber": "UBER", "lyft": "LYFT", "spotify": "SPOT", "snap": "SNAP", "snapchat": "SNAP",
  "twitter": "X", "coinbase": "COIN", "paypal": "PYPL", "square": "SQ", "block": "SQ",
  "shopify": "SHOP", "zoom": "ZM", "salesforce": "CRM", "oracle": "ORCL", "ibm": "IBM",
  "adobe": "ADBE", "visa": "V", "mastercard": "MA", "jpmorgan": "JPM", "goldman sachs": "GS",
  "bank of america": "BAC", "wells fargo": "WFC", "citigroup": "C", "morgan stanley": "MS",
  "berkshire": "BRK-B", "berkshire hathaway": "BRK-B", "johnson & johnson": "JNJ", "pfizer": "PFE",
  "moderna": "MRNA", "unitedhealth": "UNH", "at&t": "T", "verizon": "VZ", "t-mobile": "TMUS",
  "airbnb": "ABNB", "palantir": "PLTR", "robinhood": "HOOD", "roblox": "RBLX", "draftkings": "DKNG",
  "gamestop": "GME", "amc": "AMC", "lucid": "LCID", "rivian": "RIVN", "nio": "NIO",
  "sofi": "SOFI", "plaid": "PLTR", "crowdstrike": "CRWD", "snowflake": "SNOW", "databricks": "DBRX",
  "doordash": "DASH", "instacart": "CART", "pinterest": "PINS", "reddit": "RDDT", "etsy": "ETSY"
};

const CRYPTO_IDS: Record<string, { id: string; symbol: string }> = {
  "bitcoin": { id: "bitcoin", symbol: "BTC" }, "btc": { id: "bitcoin", symbol: "BTC" },
  "ethereum": { id: "ethereum", symbol: "ETH" }, "eth": { id: "ethereum", symbol: "ETH" },
  "dogecoin": { id: "dogecoin", symbol: "DOGE" }, "doge": { id: "dogecoin", symbol: "DOGE" },
  "solana": { id: "solana", symbol: "SOL" }, "sol": { id: "solana", symbol: "SOL" },
  "cardano": { id: "cardano", symbol: "ADA" }, "ada": { id: "cardano", symbol: "ADA" },
  "xrp": { id: "ripple", symbol: "XRP" }, "ripple": { id: "ripple", symbol: "XRP" },
  "polkadot": { id: "polkadot", symbol: "DOT" }, "dot": { id: "polkadot", symbol: "DOT" },
  "litecoin": { id: "litecoin", symbol: "LTC" }, "ltc": { id: "litecoin", symbol: "LTC" },
  "chainlink": { id: "chainlink", symbol: "LINK" }, "link": { id: "chainlink", symbol: "LINK" },
  "avalanche": { id: "avalanche-2", symbol: "AVAX" }, "avax": { id: "avalanche-2", symbol: "AVAX" },
  "polygon": { id: "matic-network", symbol: "MATIC" }, "matic": { id: "matic-network", symbol: "MATIC" },
  "shiba inu": { id: "shiba-inu", symbol: "SHIB" }, "shib": { id: "shiba-inu", symbol: "SHIB" },
  "tron": { id: "tron", symbol: "TRX" }, "pepe": { id: "pepe", symbol: "PEPE" },
  "uniswap": { id: "uniswap", symbol: "UNI" }, "tether": { id: "tether", symbol: "USDT" },
  "usdc": { id: "usd-coin", symbol: "USDC" }, "bnb": { id: "binancecoin", symbol: "BNB" },
  "binance coin": { id: "binancecoin", symbol: "BNB" }, "sui": { id: "sui", symbol: "SUI" },
  "aptos": { id: "aptos", symbol: "APT" }, "near": { id: "near", symbol: "NEAR" },
  "stellar": { id: "stellar", symbol: "XLM" }, "xlm": { id: "stellar", symbol: "XLM" }
};

async function getFinanceData(query: string): Promise<string> {
  try {
    const lower = query.toLowerCase();
    const results: string[] = [];

    const cryptoMatch = Object.keys(CRYPTO_IDS).find(key => lower.includes(key));
    if (cryptoMatch) {
      const crypto = CRYPTO_IDS[cryptoMatch];
      try {
        const resp = await fetch(`https://api.coingecko.com/api/v3/coins/${crypto.id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`, { signal: AbortSignal.timeout(5000) });
        if (resp.ok) {
          const data = await resp.json() as any;
          const price = data.market_data?.current_price?.usd;
          const change24h = data.market_data?.price_change_percentage_24h;
          const marketCap = data.market_data?.market_cap?.usd;
          const volume = data.market_data?.total_volume?.usd;
          const high24h = data.market_data?.high_24h?.usd;
          const low24h = data.market_data?.low_24h?.usd;
          const ath = data.market_data?.ath?.usd;
          const athDate = data.market_data?.ath_date?.usd?.split("T")[0];
          const rank = data.market_cap_rank;
          const desc = data.description?.en?.substring(0, 200) || "";

          const fmtNum = (n: number) => n >= 1e9 ? `$${(n/1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n/1e6).toFixed(2)}M` : `$${n.toLocaleString()}`;
          const fmtPrice = (n: number) => n >= 1 ? `$${n.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : `$${n.toFixed(6)}`;

          results.push(`LIVE CRYPTO DATA - ${data.name} (${crypto.symbol}):
Price: ${fmtPrice(price)}
24h Change: ${change24h >= 0 ? "+" : ""}${change24h?.toFixed(2)}%
24h High/Low: ${fmtPrice(high24h)} / ${fmtPrice(low24h)}
Market Cap: ${fmtNum(marketCap)} (Rank #${rank})
24h Volume: ${fmtNum(volume)}
All-Time High: ${fmtPrice(ath)} (${athDate})
${desc ? "About: " + desc.replace(/<[^>]*>/g, "") : ""}`);
        }
      } catch (e) { console.error("Crypto fetch error:", e); }
    }

    let ticker = "";
    const tickerMatch = lower.match(/\b([A-Z]{1,5})\b/i);
    for (const [company, sym] of Object.entries(COMMON_TICKERS)) {
      if (lower.includes(company)) { ticker = sym; break; }
    }
    if (!ticker && tickerMatch) {
      const candidate = tickerMatch[1].toUpperCase();
      if (candidate.length >= 1 && candidate.length <= 5 && /^[A-Z]+$/.test(candidate)) {
        const stockWords = ["stock", "price", "share", "ticker", "market", "invest", "trading", "value of", "worth"];
        if (stockWords.some(w => lower.includes(w))) {
          ticker = candidate;
        }
      }
    }

    if (ticker && !cryptoMatch) {
      try {
        const resp = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`, {
          signal: AbortSignal.timeout(5000),
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (resp.ok) {
          const data = await resp.json() as any;
          const meta = data.chart?.result?.[0]?.meta;
          const indicators = data.chart?.result?.[0]?.indicators?.quote?.[0];
          if (meta) {
            const price = meta.regularMarketPrice;
            const prevClose = meta.chartPreviousClose || meta.previousClose;
            const change = price - prevClose;
            const changePct = (change / prevClose) * 100;
            const high = indicators?.high?.filter((v: any) => v !== null).pop();
            const low = indicators?.low?.filter((v: any) => v !== null).pop();
            const volume = indicators?.volume?.filter((v: any) => v !== null).pop();
            const name = meta.shortName || meta.symbol;
            const exchange = meta.exchangeName || "";
            const currency = meta.currency || "USD";

            results.push(`LIVE STOCK DATA - ${name} (${ticker}) on ${exchange}:
Price: $${price?.toFixed(2)} ${currency}
Change: ${change >= 0 ? "+" : ""}$${change?.toFixed(2)} (${changePct >= 0 ? "+" : ""}${changePct?.toFixed(2)}%)
Today's High: $${high?.toFixed(2)} | Low: $${low?.toFixed(2)}
Volume: ${volume ? (volume >= 1e6 ? (volume/1e6).toFixed(2) + "M" : volume.toLocaleString()) : "N/A"}
Previous Close: $${prevClose?.toFixed(2)}`);
          }
        }
      } catch (e) { console.error("Stock fetch error:", e); }
    }

    if (results.length > 0) {
      console.log("Finance result:", results[0].substring(0, 150));
      return results.join("\n\n");
    }

    return "";
  } catch (e) {
    console.error("Finance fetch error:", e);
    return "";
  }
}

const CODES_DIR = path.join(process.cwd(), "saved_codes");
if (!fs.existsSync(CODES_DIR)) {
  fs.mkdirSync(CODES_DIR, { recursive: true });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.chats.list.path, async (_req, res) => {
    res.json(await storage.getChats());
  });

  app.post(api.chats.create.path, async (req, res) => {
    try {
      const input = api.chats.create.input.parse(req.body);
      const chat = await storage.createChat(input);
      res.status(201).json(chat);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.chats.get.path, async (req, res) => {
    const chat = await storage.getChat(Number(req.params.id));
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    res.json(chat);
  });

  app.delete(api.chats.delete.path, async (req, res) => {
    await storage.deleteChat(Number(req.params.id));
    res.status(204).send();
  });

  app.patch("/api/chats/:id/rename", async (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: "Title required" });
    const chat = await storage.renameChat(Number(req.params.id), title.substring(0, 80));
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    res.json(chat);
  });

  app.delete("/api/chats", async (_req, res) => {
    await storage.deleteAllChats();
    res.status(204).send();
  });

  app.get("/api/chats/search/:query", async (req, res) => {
    const results = await storage.searchChats(req.params.query);
    res.json(results);
  });

  app.get("/api/stats", async (_req, res) => {
    const chatCount = await storage.getChatCount();
    const messageCount = await storage.getMessageCount();
    const codeFiles = fs.existsSync(CODES_DIR) ? fs.readdirSync(CODES_DIR).length : 0;
    res.json({ chatCount, messageCount, codeFiles, discordConnected: discordClient.isReady() });
  });

  app.get(api.messages.list.path, async (req, res) => {
    res.json(await storage.getMessages(Number(req.params.chatId)));
  });

  app.post("/api/save-code", async (req, res) => {
    try {
      const { code, filename, language } = req.body;
      if (!code || !filename) return res.status(400).json({ message: "Missing code or filename" });
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = path.join(CODES_DIR, safeName);
      fs.writeFileSync(filePath, code, "utf-8");
      res.json({ message: "Code saved", path: filePath, filename: safeName });
    } catch {
      res.status(500).json({ message: "Failed to save code" });
    }
  });

  app.get("/api/saved-codes", async (_req, res) => {
    try {
      const files = fs.readdirSync(CODES_DIR).map(f => {
        const stat = fs.statSync(path.join(CODES_DIR, f));
        const content = fs.readFileSync(path.join(CODES_DIR, f), "utf-8");
        const ext = f.split(".").pop() || "";
        return { name: f, size: stat.size, modified: stat.mtime, lines: content.split("\n").length, ext };
      });
      files.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
      res.json(files);
    } catch {
      res.json([]);
    }
  });

  app.get("/api/saved-codes/:filename", async (req, res) => {
    const safeName = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(CODES_DIR, safeName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });
    res.download(filePath);
  });

  app.get("/api/saved-codes/:filename/content", async (req, res) => {
    const safeName = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(CODES_DIR, safeName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });
    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ content, filename: safeName });
  });

  app.delete("/api/saved-codes/:filename", async (req, res) => {
    const safeName = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(CODES_DIR, safeName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(204).send();
  });

  app.post("/api/chats/:chatId/export", async (req, res) => {
    const chatId = Number(req.params.chatId);
    const chat = await storage.getChat(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    const msgs = await storage.getMessages(chatId);
    let md = `# ${chat.title}\n\nType: ${chat.type}\nDate: ${chat.createdAt}\n\n---\n\n`;
    for (const m of msgs) {
      md += `### ${m.role === "user" ? "You" : "My Ai"}\n\n${m.content}\n\n---\n\n`;
    }
    res.setHeader("Content-Type", "text/markdown");
    res.setHeader("Content-Disposition", `attachment; filename="${chat.title.replace(/[^a-zA-Z0-9]/g, "_")}.md"`);
    res.send(md);
  });

  // ═══════ SHELL EXECUTION HELPER ═══════
  const { execSync } = await import("child_process");
  const EXEC_ENV = { ...process.env, NODE_PATH: path.join(process.cwd(), "node_modules") };

  function shellExec(cmd: string, opts: { timeout?: number; cwd?: string; maxBuffer?: number } = {}): { stdout: string; stderr: string; exitCode: number } {
    try {
      const stdout = execSync(cmd, {
        timeout: opts.timeout || 15000,
        maxBuffer: opts.maxBuffer || 1024 * 512,
        encoding: "utf-8",
        cwd: opts.cwd || process.cwd(),
        env: EXEC_ENV,
        shell: "/bin/bash",
      });
      return { stdout: stdout || "", stderr: "", exitCode: 0 };
    } catch (e: any) {
      return { stdout: e.stdout || "", stderr: e.stderr || e.message || "Execution failed", exitCode: e.status || 1 };
    }
  }

  // ═══════ POWER #1: SERVER-SIDE CODE EXECUTION ═══════
  app.post("/api/execute", async (req, res) => {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: "No code provided" });

    const lang = (language || "javascript").toLowerCase();
    const tmpDir = path.join(process.cwd(), "tmp_exec");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const id = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let filePath = "";
    let cmd = "";

    try {
      if (lang === "javascript" || lang === "typescript") {
        const usesRequire = /\brequire\s*\(/.test(code);
        const usesImport = /^\s*import\s+/m.test(code);
        const ext = usesRequire && !usesImport ? ".cjs" : ".mjs";
        filePath = path.join(tmpDir, `${id}${ext}`);
        let jsCode = code;
        if (lang === "typescript") {
          jsCode = code.replace(/:\s*(string|number|boolean|any|void|never|null|undefined|object|unknown)(\[\])?\s*/g, " ");
          jsCode = jsCode.replace(/^\s*interface\s+\w+\s*\{[\s\S]*?\n\}\s*$/gm, "");
          jsCode = jsCode.replace(/^\s*type\s+\w+\s*=\s*[\s\S]*?;\s*$/gm, "");
        }
        fs.writeFileSync(filePath, jsCode);
        cmd = `node "${filePath}"`;
      } else if (lang === "python") {
        filePath = path.join(tmpDir, `${id}.py`);
        fs.writeFileSync(filePath, code);

        const importRegex = /^\s*(?:import|from)\s+(\w+)/gm;
        let match;
        const pyImports: string[] = [];
        while ((match = importRegex.exec(code)) !== null) {
          pyImports.push(match[1]);
        }
        const STDLIB = new Set(["os","sys","json","time","re","math","random","datetime","collections","itertools","functools","io","pathlib","typing","hashlib","base64","copy","string","textwrap","struct","enum","dataclasses","abc","contextlib","operator","bisect","heapq","array","queue","threading","multiprocessing","subprocess","socket","asyncio","http","urllib","email","html","xml","csv","sqlite3","logging","unittest","pdb","argparse","configparser","shutil","tempfile","glob","fnmatch","stat","zipfile","tarfile","gzip","bz2","lzma","pickle","shelve","marshal","dbm","platform","ctypes","signal","mmap","codecs","unicodedata","locale","gettext","decimal","fractions","statistics","secrets","hmac","ssl","select","selectors","traceback","warnings","inspect","importlib","pkgutil","pprint","dis","gc","weakref","types","numbers"]);
        const PIP_MAP: Record<string, string> = { "bs4": "beautifulsoup4", "cv2": "opencv-python", "sklearn": "scikit-learn", "PIL": "Pillow", "dateutil": "python-dateutil", "yaml": "pyyaml", "lxml": "lxml", "ddgs": "duckduckgo-search", "discord": "discord.py" };

        const toInstall: string[] = [];
        for (const mod of pyImports) {
          if (STDLIB.has(mod)) continue;
          const pipName = PIP_MAP[mod] || mod;
          const check = shellExec(`python3 -c "import ${mod}" 2>&1`, { timeout: 5000 });
          if (check.exitCode !== 0) {
            toInstall.push(pipName);
          }
        }

        if (toInstall.length > 0) {
          const installResult = shellExec(`pip install ${toInstall.join(" ")} 2>&1`, { timeout: 120000, maxBuffer: 1024 * 1024 });
          if (installResult.exitCode !== 0) {
            return res.json({ stdout: `Auto-installing: ${toInstall.join(", ")}...\n${installResult.stdout}`, stderr: installResult.stderr, exitCode: 1, executionTime: 0 });
          }
        }

        cmd = `python3 "${filePath}"`;
      } else if (lang === "bash") {
        filePath = path.join(tmpDir, `${id}.sh`);
        fs.writeFileSync(filePath, code);
        cmd = `bash "${filePath}"`;
      } else {
        return res.json({ stdout: "", stderr: `Language '${lang}' not supported for server execution. Supported: javascript, typescript, python, bash.`, exitCode: 1, executionTime: 0 });
      }

      const startTime = Date.now();
      const timeout = lang === "python" ? 60000 : 15000;
      const result = shellExec(cmd, { timeout, cwd: tmpDir, maxBuffer: 1024 * 1024 });
      const executionTime = Date.now() - startTime;

      try { fs.unlinkSync(filePath); } catch {}

      res.json({ stdout: result.stdout.substring(0, 50000), stderr: result.stderr.substring(0, 10000), exitCode: result.exitCode, executionTime });
    } catch (e: any) {
      try { if (filePath) fs.unlinkSync(filePath); } catch {}
      res.json({ stdout: "", stderr: e.message || "Execution error", exitCode: 1, executionTime: 0 });
    }
  });

  // ═══════ POWER #2: REPL / TERMINAL COMMANDS ═══════
  app.post("/api/terminal", async (req, res) => {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: "No command" });

    const blocked = ["rm -rf /", "rm -rf /*", "sudo", "shutdown", "reboot", "mkfs", "dd if=", "> /dev", ":(){ :|:&", "chmod -R 777 /"];
    const lower = command.toLowerCase().trim();
    if (blocked.some(b => lower.includes(b))) {
      return res.json({ stdout: "", stderr: "Command blocked for safety.", exitCode: 1 });
    }

    const result = shellExec(command, { timeout: 10000 });
    res.json({ stdout: result.stdout.substring(0, 30000), stderr: result.stderr.substring(0, 5000), exitCode: result.exitCode });
  });

  // ═══════ POWER #3: PACKAGE MANAGER ═══════
  app.post("/api/packages/install", async (req, res) => {
    const { packages, manager } = req.body;
    if (!packages || !Array.isArray(packages) || packages.length === 0) return res.status(400).json({ error: "No packages" });

    const sanitized = packages.map((p: string) => p.replace(/[;&|`$(){}]/g, "")).filter(Boolean).slice(0, 5);
    const mgr = manager === "pip" ? "pip" : "npm";

    const cmd = mgr === "pip"
      ? `pip install ${sanitized.join(" ")} 2>&1`
      : `npm install ${sanitized.join(" ")} --no-save 2>&1`;

    const result = shellExec(cmd, { timeout: 120000, maxBuffer: 1024 * 1024 });
    const combined = (result.stdout + "\n" + result.stderr).trim();
    res.json({
      output: combined.substring(0, 15000),
      error: result.exitCode !== 0 ? combined.substring(0, 5000) : "",
      packages: sanitized,
      manager: mgr,
      success: result.exitCode === 0,
    });
  });

  app.get("/api/packages/list", async (_req, res) => {
    const npm = shellExec("npm list --depth=0 --json 2>/dev/null || echo '{}'", { timeout: 10000 });
    const pip = shellExec("pip list --format=json 2>/dev/null || echo '[]'", { timeout: 10000 });
    try {
      res.json({ npm: JSON.parse(npm.stdout), pip: JSON.parse(pip.stdout) });
    } catch {
      res.json({ npm: {}, pip: [] });
    }
  });

  // ═══════ POWER #4: MULTI-FILE PROJECT SYSTEM ═══════
  const PROJECTS_DIR = path.join(process.cwd(), "playground_projects");
  if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });

  app.get("/api/projects", async (_req, res) => {
    try {
      const dirs = fs.readdirSync(PROJECTS_DIR).filter(d => fs.statSync(path.join(PROJECTS_DIR, d)).isDirectory());
      const projects = dirs.map(d => {
        const metaPath = path.join(PROJECTS_DIR, d, "meta.json");
        let meta = { name: d, language: "javascript", created: Date.now() };
        if (fs.existsSync(metaPath)) { try { meta = JSON.parse(fs.readFileSync(metaPath, "utf-8")); } catch {} }
        const files = fs.readdirSync(path.join(PROJECTS_DIR, d)).filter(f => f !== "meta.json");
        return { ...meta, id: d, fileCount: files.length, files };
      });
      res.json(projects);
    } catch { res.json([]); }
  });

  app.post("/api/projects", async (req, res) => {
    const { name, language } = req.body;
    const id = `proj_${Date.now()}`;
    const dir = path.join(PROJECTS_DIR, id);
    fs.mkdirSync(dir, { recursive: true });
    const meta = { name: name || "Untitled Project", language: language || "javascript", created: Date.now() };
    fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta));
    const ext = language === "python" ? "py" : language === "html" ? "html" : language === "css" ? "css" : "js";
    fs.writeFileSync(path.join(dir, `main.${ext}`), `// ${meta.name}\n`);
    res.json({ id, ...meta, files: [`main.${ext}`] });
  });

  app.get("/api/projects/:id/files", async (req, res) => {
    const dir = path.join(PROJECTS_DIR, req.params.id.replace(/[^a-zA-Z0-9_-]/g, ""));
    if (!fs.existsSync(dir)) return res.status(404).json({ error: "Not found" });
    const files = fs.readdirSync(dir).filter(f => f !== "meta.json").map(f => ({
      name: f, size: fs.statSync(path.join(dir, f)).size,
      content: fs.readFileSync(path.join(dir, f), "utf-8")
    }));
    res.json(files);
  });

  app.put("/api/projects/:id/files/:filename", async (req, res) => {
    const dir = path.join(PROJECTS_DIR, req.params.id.replace(/[^a-zA-Z0-9_-]/g, ""));
    if (!fs.existsSync(dir)) return res.status(404).json({ error: "Not found" });
    const safeName = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    fs.writeFileSync(path.join(dir, safeName), req.body.content || "");
    res.json({ saved: true, filename: safeName });
  });

  app.post("/api/projects/:id/files", async (req, res) => {
    const dir = path.join(PROJECTS_DIR, req.params.id.replace(/[^a-zA-Z0-9_-]/g, ""));
    if (!fs.existsSync(dir)) return res.status(404).json({ error: "Not found" });
    const safeName = (req.body.filename || "untitled.js").replace(/[^a-zA-Z0-9._-]/g, "_");
    fs.writeFileSync(path.join(dir, safeName), req.body.content || "");
    res.json({ created: true, filename: safeName });
  });

  app.delete("/api/projects/:id/files/:filename", async (req, res) => {
    const dir = path.join(PROJECTS_DIR, req.params.id.replace(/[^a-zA-Z0-9_-]/g, ""));
    const filePath = path.join(dir, req.params.filename.replace(/[^a-zA-Z0-9._-]/g, "_"));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(204).send();
  });

  app.delete("/api/projects/:id", async (req, res) => {
    const dir = path.join(PROJECTS_DIR, req.params.id.replace(/[^a-zA-Z0-9_-]/g, ""));
    if (fs.existsSync(dir)) { fs.rmSync(dir, { recursive: true, force: true }); }
    res.status(204).send();
  });

  // ═══════ NEWS FEED ═══════
  const RSS_FEEDS: { url: string; source: string; type?: string }[] = [
    { url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", source: "NY Times" },
    { url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml", source: "NY Times" },
    { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC World" },
    { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", source: "BBC World" },
    { url: "https://rss.cnn.com/rss/edition.rss", source: "CNN" },
    { url: "https://feeds.npr.org/1001/rss.xml", source: "NPR" },
    { url: "https://feeds.feedburner.com/TechCrunch/", source: "TechCrunch" },
    { url: "https://www.theverge.com/rss/index.xml", source: "The Verge" },
    { url: "https://feeds.arstechnica.com/arstechnica/index", source: "Ars Technica" },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ", source: "MKBHD", type: "video" },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCsBjURrPoezykLs9EqgamOA", source: "Fireship", type: "video" },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC8butISFwT-Wl7EV0hUK0BQ", source: "freeCodeCamp", type: "video" },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCW5YeuERMmlnqo4oq8vwUpg", source: "Net Ninja", type: "video" },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCHnyfMqiRRG1u-2MsSQLbXA", source: "Veritasium", type: "video" },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC29ju8bIPH5as8OGnQzwJyA", source: "Traversy Media", type: "video" },
  ];

  const SOURCE_COLORS: Record<string, string> = {
    "NY Times": "#1a1a2e", "BBC World": "#b80000", "CNN": "#cc0000",
    "NPR": "#2663a5", "TechCrunch": "#0a9e01", "The Verge": "#6200ee",
    "Ars Technica": "#ff4400", "MKBHD": "#e62117", "Fireship": "#ff9900",
    "freeCodeCamp": "#0a0a23", "Net Ninja": "#00d9ff", "Veritasium": "#1a73e8",
    "Traversy Media": "#6366f1",
  };

  let feedCache: { articles: any[]; lastFetch: number } = { articles: [], lastFetch: 0 };
  const FEED_CACHE_TTL = 2 * 60 * 1000;

  app.get("/api/feed", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = 20;

      if (Date.now() - feedCache.lastFetch < FEED_CACHE_TTL && feedCache.articles.length > 0) {
        const start = (page - 1) * perPage;
        const slice = feedCache.articles.slice(start, start + perPage);
        return res.json({ articles: slice, total: feedCache.articles.length, page, hasMore: start + perPage < feedCache.articles.length });
      }

      const RssParser = (await import("rss-parser")).default;
      const parser = new RssParser({ timeout: 8000, headers: { "User-Agent": "Mozilla/5.0" } });

      const allArticles: any[] = [];
      const seenIds = new Set<string>();
      const feedPromises = RSS_FEEDS.map(async (feed) => {
        try {
          const parsed = await parser.parseURL(feed.url);
          const isYT = feed.type === "video";
          const items = (parsed.items || []).slice(0, 10).map((item: any) => {
            const mediaContent = item["media:content"] || item["media:thumbnail"] || item.enclosure;
            let image = "";
            if (isYT) {
              const vidId = (item.id || "").replace("yt:video:", "");
              if (vidId) image = `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`;
            } else {
              try { image = mediaContent?.$.url || mediaContent?.url || ""; } catch { image = ""; }
              if (!image) try { image = item["media:thumbnail"]?.$.url || ""; } catch { image = ""; }
              if (!image && item["media:group"]?.["media:thumbnail"]?.[0]?.$?.url) {
                image = item["media:group"]["media:thumbnail"][0].$.url;
              }
              if (!image && item.enclosure?.url && /\.(jpg|jpeg|png|webp|gif)/i.test(item.enclosure.url)) {
                image = item.enclosure.url;
              }
              if (!image && item["content:encoded"]) {
                const imgMatch = item["content:encoded"].match(/<img[^>]+src="([^"]+)"/);
                if (imgMatch) image = imgMatch[1];
              }
              if (!image && item.content) {
                const imgMatch = item.content.match(/<img[^>]+src="([^"]+)"/);
                if (imgMatch) image = imgMatch[1];
              }
              if (!image && item.summary) {
                const imgMatch = item.summary.match(/<img[^>]+src="([^"]+)"/);
                if (imgMatch) image = imgMatch[1];
              }
              if (!image && item.description && typeof item.description === 'string') {
                const imgMatch = item.description.match(/<img[^>]+src="([^"]+)"/);
                if (imgMatch) image = imgMatch[1];
              }
            }

            const desc = (item.contentSnippet || item.content || item.summary || "")
              .replace(/<[^>]*>/g, "").substring(0, 300);

            const id = createHash("sha256").update(item.link || item.guid || item.title || "").digest("hex").substring(0, 16);

            let videoUrl = "";
            if (isYT) {
              const vidId = (item.id || "").replace("yt:video:", "");
              videoUrl = vidId ? `https://www.youtube.com/embed/${vidId}` : "";
            }

            return {
              id,
              title: item.title || "",
              description: desc,
              link: item.link || "",
              image,
              source: feed.source,
              pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
              category: typeof item.categories?.[0] === "string" ? item.categories[0] : (item.categories?.[0]?._ || "General"),
              type: feed.type || "article",
              videoUrl,
              sourceColor: SOURCE_COLORS[feed.source] || "#f97316",
            };
          });
          items.forEach((item: any) => {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              allArticles.push(item);
            }
          });
        } catch (e) {
          console.error(`RSS fetch error for ${feed.source}:`, (e as Error).message);
        }
      });

      await Promise.allSettled(feedPromises);

      allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

      feedCache = { articles: allArticles, lastFetch: Date.now() };
      enrichArticlesWithImages(allArticles).catch(() => {});
      const start = (page - 1) * perPage;
      const slice = allArticles.slice(start, start + perPage);
      res.json({ articles: slice, total: allArticles.length, page, hasMore: start + perPage < allArticles.length });
    } catch (e) {
      console.error("Feed error:", e);
      res.json({ articles: feedCache.articles.length > 0 ? feedCache.articles.slice(0, 20) : [], total: 0, page: 1, hasMore: false });
    }
  });

  app.get("/api/feed/comments/:articleId", async (req, res) => {
    const comments = await storage.getFeedComments(req.params.articleId);
    res.json(comments);
  });

  app.post("/api/feed/comments/:articleId", async (req, res) => {
    try {
      const { username, content } = req.body;
      if (!username || !content) return res.status(400).json({ message: "Username and content required" });
      const comment = await storage.createFeedComment({
        articleId: req.params.articleId,
        username: username.substring(0, 30),
        content: content.substring(0, 500),
      });
      res.status(201).json(comment);
    } catch (e) {
      res.status(500).json({ message: "Failed to post comment" });
    }
  });

  // ═══════ FEED SEARCH (DuckDuckGo + Videos) ═══════
  const searchCache: Record<string, { results: any[]; time: number }> = {};
  const SEARCH_CACHE_TTL = 5 * 60 * 1000;

  app.get("/api/feed/search", async (req, res) => {
    try {
      const q = (req.query.q as string || "").trim();
      if (!q) return res.json({ articles: [], total: 0, query: "", searchMode: true });

      const cacheKey = q.toLowerCase();
      if (searchCache[cacheKey] && Date.now() - searchCache[cacheKey].time < SEARCH_CACHE_TTL) {
        return res.json({ articles: searchCache[cacheKey].results, total: searchCache[cacheKey].results.length, query: q, searchMode: true });
      }

      const { SafeSearchType } = await import("duck-duck-scrape");
      const allResults: any[] = [];
      const seenUrls = new Set<string>();

      const [newsResults, webResults, videoResults] = await Promise.allSettled([
        searchNews(q, { safeSearch: SafeSearchType.STRICT }).catch(() => ({ results: [] })),
        search(q, { safeSearch: SafeSearchType.STRICT }).catch(() => ({ results: [] })),
        searchVideos(q, { safeSearch: SafeSearchType.STRICT }).catch(() => ({ results: [] })),
      ]);

      const newsData = newsResults.status === "fulfilled" ? (newsResults.value as any) : { results: [] };
      if (newsData?.results?.length) {
        for (const r of newsData.results.slice(0, 15)) {
          const link = r.url || r.link || "";
          if (!link || seenUrls.has(link)) continue;
          seenUrls.add(link);
          allResults.push({
            id: createHash("md5").update(link).digest("hex").slice(0, 16),
            title: (r.title || "").replace(/<\/?b>/g, ""),
            description: (r.excerpt || r.body || r.description || "").replace(/<\/?b>/g, "").slice(0, 300),
            link,
            image: r.image || "",
            source: r.source || new URL(link).hostname.replace("www.", ""),
            pubDate: r.date ? new Date(r.date * 1000).toISOString() : new Date().toISOString(),
            category: "Search",
            type: "article",
            videoUrl: "",
            sourceColor: "#f97316",
          });
        }
      }

      const webData = webResults.status === "fulfilled" ? (webResults.value as any) : { results: [] };
      if (webData?.results?.length) {
        for (const r of webData.results.slice(0, 10)) {
          const link = r.url || "";
          if (!link || seenUrls.has(link)) continue;
          seenUrls.add(link);
          allResults.push({
            id: createHash("md5").update(link).digest("hex").slice(0, 16),
            title: r.title || "",
            description: (r.description || "").slice(0, 300),
            link,
            image: r.icon || "",
            source: r.hostname || new URL(link).hostname.replace("www.", ""),
            pubDate: new Date().toISOString(),
            category: "Search",
            type: "article",
            videoUrl: "",
            sourceColor: "#f97316",
          });
        }
      }

      const videoData = videoResults.status === "fulfilled" ? (videoResults.value as any) : { results: [] };
      if (videoData?.results?.length) {
        for (const v of videoData.results.slice(0, 15)) {
          const link = v.url || v.content || "";
          if (!link || seenUrls.has(link)) continue;
          seenUrls.add(link);
          const isYT = link.includes("youtube.com") || link.includes("youtu.be");
          let ytId = "";
          if (isYT) {
            const m = link.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (m) ytId = m[1];
          }
          const thumb = v.image || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : "");
          allResults.push({
            id: createHash("md5").update(link).digest("hex").slice(0, 16),
            title: v.title || "",
            description: (v.description || "").slice(0, 300),
            link,
            image: thumb,
            source: v.publisher || (isYT ? "YouTube" : new URL(link).hostname.replace("www.", "")),
            pubDate: v.published || new Date().toISOString(),
            category: "Search",
            type: "video",
            videoUrl: isYT && ytId ? `https://www.youtube.com/embed/${ytId}` : link,
            sourceColor: isYT ? "#ff0000" : "#8b5cf6",
          });
        }
      }

      searchCache[cacheKey] = { results: allResults, time: Date.now() };
      res.json({ articles: allResults, total: allResults.length, query: q, searchMode: true });
    } catch (e: any) {
      console.error("Feed search error:", e?.message || e);
      res.json({ articles: [], total: 0, query: req.query.q || "", searchMode: true, error: "Search temporarily unavailable" });
    }
  });

  // ═══════ OG IMAGE FETCHER ═══════
  const ogImageCache: Record<string, string> = {};

  async function fetchOgImage(url: string): Promise<string> {
    if (ogImageCache[url] !== undefined) return ogImageCache[url];
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MyAiGpt/1.0)" },
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timeout);
      const html = await resp.text();
      const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      const image = ogMatch?.[1] || "";
      ogImageCache[url] = image;
      return image;
    } catch {
      ogImageCache[url] = "";
      return "";
    }
  }

  async function enrichArticlesWithImages(articles: any[]): Promise<void> {
    const needsImage = articles.filter(a => !a.image && a.link && a.type !== "video");
    const batches = [];
    for (let i = 0; i < needsImage.length; i += 5) {
      batches.push(needsImage.slice(i, i + 5));
    }
    for (const batch of batches) {
      await Promise.allSettled(batch.map(async (article: any) => {
        const img = await fetchOgImage(article.link);
        if (img) article.image = img;
      }));
    }
  }

  // ═══════ GICS SECTOR + PERSONALIZATION ENGINE ═══════
  const GICS_SECTORS: Record<string, { keywords: string[]; industries: string[] }> = {
    "Energy": { keywords: ["oil", "gas", "petroleum", "energy", "solar", "wind", "nuclear", "renewable", "drilling", "pipeline", "opec", "crude", "fossil", "coal", "electric grid", "power plant", "utility"], industries: ["Oil & Gas", "Renewable Energy", "Energy Equipment", "Utilities"] },
    "Materials": { keywords: ["mining", "chemicals", "metals", "steel", "copper", "gold", "aluminum", "lumber", "cement", "fertilizer", "lithium", "rare earth", "packaging", "paper"], industries: ["Chemicals", "Metals & Mining", "Construction Materials", "Containers"] },
    "Industrials": { keywords: ["manufacturing", "aerospace", "defense", "construction", "transport", "logistics", "railroad", "airline", "shipping", "machinery", "engineering", "industrial", "automation", "robotics"], industries: ["Aerospace & Defense", "Machinery", "Transportation", "Construction"] },
    "Consumer Discretionary": { keywords: ["retail", "fashion", "luxury", "auto", "car", "vehicle", "restaurant", "hotel", "travel", "gaming", "entertainment", "media", "streaming", "nike", "amazon", "tesla", "disney", "netflix"], industries: ["Retail", "Automobiles", "Hotels & Leisure", "Media & Entertainment"] },
    "Consumer Staples": { keywords: ["food", "beverage", "grocery", "household", "tobacco", "cosmetics", "personal care", "walmart", "costco", "coca-cola", "pepsi", "procter"], industries: ["Food & Beverage", "Household Products", "Personal Products"] },
    "Health Care": { keywords: ["health", "medical", "pharma", "biotech", "hospital", "drug", "vaccine", "clinical", "fda", "surgery", "diagnosis", "therapy", "mental health", "fitness", "wellness", "disease"], industries: ["Pharmaceuticals", "Biotechnology", "Health Care Equipment", "Health Care Services"] },
    "Financials": { keywords: ["bank", "finance", "insurance", "invest", "stock", "crypto", "bitcoin", "trading", "mortgage", "loan", "credit", "fintech", "payment", "wall street", "hedge fund", "ipo", "venture capital"], industries: ["Banks", "Insurance", "Capital Markets", "FinTech"] },
    "Information Technology": { keywords: ["tech", "software", "hardware", "computer", "chip", "semiconductor", "ai", "artificial intelligence", "cloud", "saas", "cyber", "data", "programming", "code", "developer", "app", "startup", "silicon valley", "apple", "google", "microsoft", "nvidia", "meta", "openai"], industries: ["Software", "Hardware", "Semiconductors", "IT Services", "Internet"] },
    "Communication Services": { keywords: ["telecom", "5g", "social media", "advertising", "broadcast", "cable", "internet", "streaming", "content", "podcast", "youtube", "tiktok", "twitter", "instagram", "facebook", "spotify"], industries: ["Telecom", "Media", "Interactive Media", "Entertainment"] },
    "Real Estate": { keywords: ["real estate", "property", "housing", "mortgage", "rent", "commercial", "residential", "reit", "building", "apartment", "condo", "land", "zoning"], industries: ["REITs", "Real Estate Management", "Real Estate Development"] },
    "Utilities": { keywords: ["utility", "water", "electricity", "power", "grid", "infrastructure", "sewage", "waste", "recycling"], industries: ["Electric Utilities", "Water Utilities", "Gas Utilities", "Renewable Utilities"] },
    "Government & Politics": { keywords: ["politics", "government", "election", "president", "congress", "senate", "law", "regulation", "policy", "democrat", "republican", "trump", "biden", "legislation", "court", "supreme court", "vote", "campaign"], industries: ["Federal Government", "State Government", "Policy", "Legislation"] },
    "Science & Education": { keywords: ["science", "research", "university", "education", "school", "study", "professor", "academic", "space", "nasa", "physics", "chemistry", "biology", "climate", "environment", "ocean", "weather"], industries: ["Higher Education", "Research", "Space", "Environmental Science"] },
    "Sports & Fitness": { keywords: ["sports", "nba", "nfl", "soccer", "football", "basketball", "baseball", "tennis", "golf", "olympics", "athlete", "team", "championship", "league", "match", "game", "workout", "gym"], industries: ["Professional Sports", "Fitness", "Sports Media", "Sports Equipment"] },
    "Arts & Culture": { keywords: ["art", "music", "film", "movie", "book", "literature", "museum", "theater", "dance", "fashion", "design", "photography", "architecture", "culture", "award", "oscar", "grammy"], industries: ["Visual Arts", "Music", "Film", "Literature", "Design"] },
  };

  function classifyToSectors(text: string): Record<string, number> {
    const lower = text.toLowerCase();
    const scores: Record<string, number> = {};
    for (const [sector, data] of Object.entries(GICS_SECTORS)) {
      let score = 0;
      for (const kw of data.keywords) {
        if (lower.includes(kw)) score += 1;
      }
      if (score > 0) scores[sector] = score;
    }
    return scores;
  }

  function mergeScores(existing: Record<string, number>, newScores: Record<string, number>, weight: number = 1, decay: number = 0.98): Record<string, number> {
    const merged = { ...existing };
    for (const [key, val] of Object.entries(merged)) {
      merged[key] = val * decay;
    }
    for (const [key, val] of Object.entries(newScores)) {
      merged[key] = (merged[key] || 0) + val * weight;
    }
    const entries = Object.entries(merged).filter(([, v]) => v > 0.01);
    entries.sort((a, b) => b[1] - a[1]);
    return Object.fromEntries(entries.slice(0, 50));
  }

  async function learnFromInteraction(userId: string, type: string, data: { text?: string; source?: string; category?: string; contentType?: string; duration?: number; topic?: string }) {
    const sectorScores = data.text ? classifyToSectors(data.text) : {};
    const topSector = Object.entries(sectorScores).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

    await storage.recordInteraction({
      userId,
      interactionType: type,
      category: data.category || "",
      source: data.source || "",
      topic: data.topic || "",
      sector: topSector,
      contentType: data.contentType || "",
      duration: data.duration || 0,
      metadata: sectorScores,
    });

    const prefs = await storage.getUserPreferences(userId) || {
      sectorScores: {}, topicScores: {}, sourceScores: {}, contentTypeScores: {}, chatTopics: {}, behaviorProfile: {}, totalInteractions: 0,
    };

    const weight = type === "article_read" ? 1
      : type === "article_click" ? 0.5
      : type === "chat_message" ? 1.5
      : type === "social_post" ? 0.8
      : type === "social_like" ? 0.6
      : type === "search" ? 1.2
      : type === "video_watch" ? 1.3
      : type === "bookmark" ? 1.5
      : type === "comment" ? 1.0
      : type === "code_run" ? 1.0
      : 0.5;

    const durationBonus = data.duration ? Math.min(data.duration / 60, 3) : 1;

    const updatedSectors = mergeScores(prefs.sectorScores as Record<string, number> || {}, sectorScores, weight * durationBonus);

    const topicUpdate: Record<string, number> = {};
    if (data.category && data.category !== "General") topicUpdate[data.category] = 1;
    if (data.topic) topicUpdate[data.topic] = 1.5;
    const updatedTopics = mergeScores(prefs.topicScores as Record<string, number> || {}, topicUpdate, weight);

    const sourceUpdate: Record<string, number> = {};
    if (data.source) sourceUpdate[data.source] = 1;
    const updatedSources = mergeScores(prefs.sourceScores as Record<string, number> || {}, sourceUpdate, weight);

    const ctUpdate: Record<string, number> = {};
    if (data.contentType) ctUpdate[data.contentType] = 1;
    const updatedCT = mergeScores(prefs.contentTypeScores as Record<string, number> || {}, ctUpdate, weight);

    const chatUpdate: Record<string, number> = {};
    if (type === "chat_message" && data.topic) chatUpdate[data.topic] = 2;
    const updatedChat = mergeScores(prefs.chatTopics as Record<string, number> || {}, chatUpdate, 1);

    const behavior = (prefs.behaviorProfile as Record<string, any>) || {};
    const hour = new Date().getHours();
    const hourKey = `hour_${hour}`;
    behavior[hourKey] = (behavior[hourKey] || 0) + 1;
    behavior[`type_${type}`] = (behavior[`type_${type}`] || 0) + 1;
    if (data.duration) {
      behavior.avgDuration = ((behavior.avgDuration || 0) * (behavior.durationCount || 0) + data.duration) / ((behavior.durationCount || 0) + 1);
      behavior.durationCount = (behavior.durationCount || 0) + 1;
    }

    await storage.upsertUserPreferences(userId, {
      sectorScores: updatedSectors,
      topicScores: updatedTopics,
      sourceScores: updatedSources,
      contentTypeScores: updatedCT,
      chatTopics: updatedChat,
      behaviorProfile: behavior,
      totalInteractions: (prefs.totalInteractions || 0) + 1,
    } as any);
  }

  function personalizeArticles(articles: any[], prefs: any): any[] {
    if (!prefs || !prefs.sectorScores) return articles;

    const sectorScores = prefs.sectorScores as Record<string, number> || {};
    const topicScores = prefs.topicScores as Record<string, number> || {};
    const sourceScores = prefs.sourceScores as Record<string, number> || {};
    const ctScores = prefs.contentTypeScores as Record<string, number> || {};

    const maxSector = Math.max(...Object.values(sectorScores), 1);
    const maxTopic = Math.max(...Object.values(topicScores), 1);
    const maxSource = Math.max(...Object.values(sourceScores), 1);

    const scored = articles.map(article => {
      let affinity = 0;
      const textCombo = `${article.title} ${article.description} ${article.category}`.toLowerCase();
      for (const [sector, data] of Object.entries(GICS_SECTORS)) {
        let matches = 0;
        for (const kw of data.keywords) {
          if (textCombo.includes(kw)) matches++;
        }
        if (matches > 0 && sectorScores[sector]) {
          affinity += (sectorScores[sector] / maxSector) * matches * 2;
        }
      }
      if (topicScores[article.category]) {
        affinity += (topicScores[article.category] / maxTopic) * 3;
      }
      if (sourceScores[article.source]) {
        affinity += (sourceScores[article.source] / maxSource) * 1.5;
      }
      if (ctScores[article.type]) {
        affinity += ctScores[article.type] * 0.5;
      }
      const ageHours = (Date.now() - new Date(article.pubDate).getTime()) / (1000 * 60 * 60);
      const freshness = Math.max(0, 1 - ageHours / 48);
      const finalScore = affinity * 0.6 + freshness * 10 * 0.4;
      return { ...article, _affinityScore: finalScore };
    });

    scored.sort((a, b) => b._affinityScore - a._affinityScore);
    return scored;
  }

  app.post("/api/user/track", async (req, res) => {
    try {
      const { userId, type, text, source, category, contentType, duration, topic } = req.body;
      if (!userId || !type) return res.status(400).json({ message: "userId and type required" });
      await learnFromInteraction(userId, type, { text, source, category, contentType, duration, topic });
      res.json({ ok: true });
    } catch (e) {
      console.error("Track error:", e);
      res.status(500).json({ message: "Failed to track" });
    }
  });

  app.get("/api/user/preferences/:userId", async (req, res) => {
    try {
      const prefs = await storage.getUserPreferences(req.params.userId);
      if (!prefs) return res.json({ sectorScores: {}, topicScores: {}, sourceScores: {}, contentTypeScores: {}, chatTopics: {}, behaviorProfile: {}, totalInteractions: 0 });
      res.json(prefs);
    } catch {
      res.status(500).json({ message: "Failed to get preferences" });
    }
  });

  app.get("/api/feed/personalized", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const page = parseInt(req.query.page as string) || 1;
      const perPage = 20;

      if (Date.now() - feedCache.lastFetch >= FEED_CACHE_TTL || feedCache.articles.length === 0) {
        const RssParser = (await import("rss-parser")).default;
        const parser = new RssParser({ timeout: 8000, headers: { "User-Agent": "Mozilla/5.0" } });
        const allArticles: any[] = [];
        const seenIds = new Set<string>();
        await Promise.allSettled(RSS_FEEDS.map(async (feed) => {
          try {
            const parsed = await parser.parseURL(feed.url);
            const isYT = feed.type === "video";
            (parsed.items || []).slice(0, 10).forEach((item: any) => {
              const mediaContent = item["media:content"] || item["media:thumbnail"] || item.enclosure;
              let image = "";
              if (isYT) {
                const vidId = (item.id || "").replace("yt:video:", "");
                if (vidId) image = `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`;
              } else {
                try { image = mediaContent?.$.url || mediaContent?.url || ""; } catch { image = ""; }
                if (!image) try { image = item["media:thumbnail"]?.$.url || ""; } catch { image = ""; }
                if (!image && item["content:encoded"]) { const m = item["content:encoded"].match(/<img[^>]+src="([^"]+)"/); if (m) image = m[1]; }
                if (!image && item.content) { const m = item.content.match(/<img[^>]+src="([^"]+)"/); if (m) image = m[1]; }
              }
              const id = createHash("sha256").update(item.link || item.guid || item.title || "").digest("hex").substring(0, 16);
              if (!seenIds.has(id)) {
                seenIds.add(id);
                allArticles.push({
                  id, title: item.title || "", description: (item.contentSnippet || "").substring(0, 300),
                  link: item.link || "", image, source: feed.source,
                  pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
                  category: typeof item.categories?.[0] === "string" ? item.categories[0] : "General",
                  type: feed.type || "article", videoUrl: isYT ? `https://www.youtube.com/embed/${(item.id || "").replace("yt:video:", "")}` : "",
                  sourceColor: SOURCE_COLORS[feed.source] || "#f97316",
                });
              }
            });
          } catch {}
        }));
        allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        feedCache = { articles: allArticles, lastFetch: Date.now() };
        enrichArticlesWithImages(allArticles).catch(() => {});
      }

      let articles = [...feedCache.articles];
      if (userId) {
        const prefs = await storage.getUserPreferences(userId);
        if (prefs && (prefs.totalInteractions || 0) >= 3) {
          articles = personalizeArticles(articles, prefs);
        }
      }

      const start = (page - 1) * perPage;
      const slice = articles.slice(start, start + perPage);
      res.json({ articles: slice, total: articles.length, page, hasMore: start + perPage < articles.length, personalized: !!userId });
    } catch (e) {
      console.error("Personalized feed error:", e);
      res.json({ articles: feedCache.articles.slice(0, 20), total: 0, page: 1, hasMore: false, personalized: false });
    }
  });

  // ═══════ POWER #5: SNIPPET TEMPLATES ═══════
  app.get("/api/templates", async (_req, res) => {
    const templates = [
      { id: "http-server", name: "HTTP Server", lang: "javascript", desc: "Express-like server", code: `const http = require('http');\n\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { 'Content-Type': 'application/json' });\n  res.end(JSON.stringify({ message: 'Hello from server!', path: req.url, method: req.method }));\n});\n\nserver.listen(3001, () => {\n  console.log('Server running on port 3001');\n});\n\nsetTimeout(() => { server.close(); console.log('Server stopped.'); }, 5000);` },
      { id: "web-scraper", name: "Web Scraper", lang: "python", desc: "URL content fetcher", code: `import urllib.request\nimport json\n\ndef fetch_url(url):\n    try:\n        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})\n        with urllib.request.urlopen(req, timeout=10) as resp:\n            data = resp.read().decode('utf-8')\n            print(f"Status: {resp.status}")\n            print(f"Content length: {len(data)} chars")\n            print(f"First 500 chars:\\n{data[:500]}")\n    except Exception as e:\n        print(f"Error: {e}")\n\nfetch_url("https://httpbin.org/json")` },
      { id: "data-analysis", name: "Data Analysis", lang: "python", desc: "Stats + analysis pipeline", code: `import math\nimport json\nfrom collections import Counter\n\ndata = [23, 45, 12, 67, 34, 89, 23, 45, 56, 78, 12, 34, 67, 90, 23]\n\nmean = sum(data) / len(data)\nsorted_d = sorted(data)\nmedian = sorted_d[len(sorted_d) // 2]\nvariance = sum((x - mean) ** 2 for x in data) / len(data)\nstd_dev = math.sqrt(variance)\nmode = Counter(data).most_common(1)[0][0]\n\nprint("=== Data Analysis ===")\nprint(f"Data: {data}")\nprint(f"Count: {len(data)}")\nprint(f"Mean: {mean:.2f}")\nprint(f"Median: {median}")\nprint(f"Mode: {mode}")\nprint(f"Std Dev: {std_dev:.2f}")\nprint(f"Min: {min(data)}, Max: {max(data)}")\nprint(f"Range: {max(data) - min(data)}")` },
      { id: "api-client", name: "REST API Client", lang: "javascript", desc: "Fetch + API calls", code: `async function apiClient(baseUrl) {\n  const methods = ['GET', 'POST'];\n  \n  async function request(method, path, body = null) {\n    const opts = { method, headers: { 'Content-Type': 'application/json' } };\n    if (body) opts.body = JSON.stringify(body);\n    const res = await fetch(baseUrl + path, opts);\n    return { status: res.status, data: await res.json() };\n  }\n  \n  return {\n    get: (path) => request('GET', path),\n    post: (path, body) => request('POST', path, body),\n  };\n}\n\n// Demo\nconst client = await apiClient('https://jsonplaceholder.typicode.com');\nconst users = await client.get('/users');\nconsole.log(\`Found \${users.data.length} users\`);\nusers.data.slice(0, 3).forEach(u => console.log(\`  - \${u.name} (\${u.email})\`));` },
      { id: "algo-sort", name: "Sorting Algorithms", lang: "javascript", desc: "Visual sort comparison", code: `function quickSort(arr) {\n  if (arr.length <= 1) return arr;\n  const pivot = arr[Math.floor(arr.length / 2)];\n  const left = arr.filter(x => x < pivot);\n  const mid = arr.filter(x => x === pivot);\n  const right = arr.filter(x => x > pivot);\n  return [...quickSort(left), ...mid, ...quickSort(right)];\n}\n\nfunction mergeSort(arr) {\n  if (arr.length <= 1) return arr;\n  const mid = Math.floor(arr.length / 2);\n  const left = mergeSort(arr.slice(0, mid));\n  const right = mergeSort(arr.slice(mid));\n  const result = [];\n  let i = 0, j = 0;\n  while (i < left.length && j < right.length) {\n    result.push(left[i] <= right[j] ? left[i++] : right[j++]);\n  }\n  return [...result, ...left.slice(i), ...right.slice(j)];\n}\n\nconst data = Array.from({length: 20}, () => Math.floor(Math.random() * 100));\nconsole.log("Original:", data.join(", "));\n\nlet t = performance.now();\nconst qs = quickSort([...data]);\nconsole.log(\`QuickSort (\${(performance.now()-t).toFixed(3)}ms): \${qs.join(", ")}\`);\n\nt = performance.now();\nconst ms = mergeSort([...data]);\nconsole.log(\`MergeSort (\${(performance.now()-t).toFixed(3)}ms): \${ms.join(", ")}\`);` },
      { id: "discord-bot", name: "Discord Bot", lang: "python", desc: "Bot template (server-side)", code: `import discord\nfrom discord.ext import commands\n\nbot = commands.Bot(command_prefix='!', intents=discord.Intents.all())\n\n@bot.event\nasync def on_ready():\n    print(f'{bot.user} is online!')\n\n@bot.command()\nasync def ping(ctx):\n    await ctx.send(f'Pong! {round(bot.latency * 1000)}ms')\n\n@bot.command()\nasync def hello(ctx):\n    await ctx.send(f'Hello {ctx.author.name}! 👋')\n\n# bot.run('YOUR_TOKEN')  # Add your token to run\nprint("Discord bot template ready!")` },
      { id: "react-component", name: "React Component", lang: "typescript", desc: "Modern React pattern", code: `interface CardProps {\n  title: string;\n  description: string;\n  tags: string[];\n  onClick?: () => void;\n}\n\nfunction Card({ title, description, tags, onClick }: CardProps) {\n  return (\n    <div className="card" onClick={onClick}>\n      <h3>{title}</h3>\n      <p>{description}</p>\n      <div className="tags">\n        {tags.map(tag => <span key={tag} className="tag">{tag}</span>)}\n      </div>\n    </div>\n  );\n}\n\nconsole.log("React Card component template loaded!");` },
      { id: "dashboard-html", name: "Dashboard UI", lang: "html", desc: "Modern dashboard layout", code: `<!DOCTYPE html>\n<html>\n<head>\n<style>\n  * { margin: 0; box-sizing: border-box; }\n  body { font-family: system-ui; background: #0f172a; color: #e2e8f0; min-height: 100vh; padding: 20px; }\n  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }\n  .card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; }\n  .card h3 { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }\n  .card .value { font-size: 32px; font-weight: 700; margin-top: 8px; }\n  .green { color: #4ade80; } .blue { color: #60a5fa; } .purple { color: #a78bfa; } .amber { color: #fbbf24; }\n  h1 { margin-bottom: 20px; font-size: 24px; }\n  .bar { height: 8px; border-radius: 4px; background: #334155; margin-top: 12px; overflow: hidden; }\n  .bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }\n</style>\n</head>\n<body>\n  <h1>📊 Dashboard</h1>\n  <div class="grid">\n    <div class="card"><h3>Revenue</h3><div class="value green">$48.2K</div><div class="bar"><div class="bar-fill" style="width:78%;background:#4ade80"></div></div></div>\n    <div class="card"><h3>Users</h3><div class="value blue">2,847</div><div class="bar"><div class="bar-fill" style="width:62%;background:#60a5fa"></div></div></div>\n    <div class="card"><h3>Projects</h3><div class="value purple">156</div><div class="bar"><div class="bar-fill" style="width:45%;background:#a78bfa"></div></div></div>\n    <div class="card"><h3>Uptime</h3><div class="value amber">99.9%</div><div class="bar"><div class="bar-fill" style="width:99%;background:#fbbf24"></div></div></div>\n  </div>\n</body>\n</html>` },
    ];
    res.json(templates);
  });

  app.post(api.messages.create.path, async (req, res) => {
    try {
      const chatId = Number(req.params.chatId);
      const chat = await storage.getChat(chatId);
      if (!chat) return res.status(404).json({ message: "Chat not found" });

      const input = api.messages.create.input.parse(req.body);

      await storage.createMessage({ chatId, role: "user", content: input.content });

      const lowerContent = input.content.toLowerCase();
      const needsSearch = /\b(what is|who is|when did|where is|how to|latest|news|define|search|current|today|price of|weather|score)\b/.test(lowerContent);
      let searchContext = "";
      if (needsSearch) {
        searchContext = await getSearchContext(input.content);
      }

      let weatherContext = "";
      if (/\bweather\b/i.test(lowerContent)) {
        weatherContext = await getWeather(input.content);
      }

      let financeContext = "";
      const financeKeywords = /\b(stock|price|ticker|market cap|share price|trading|invest|bitcoin|btc|ethereum|eth|crypto|doge|dogecoin|solana|xrp|cardano|litecoin|bnb|shib|how much is|what is .+ worth|value of|price of)\b/i;
      const hasCompanyName = Object.keys(COMMON_TICKERS).some(c => lowerContent.includes(c));
      const hasCryptoName = Object.keys(CRYPTO_IDS).some(c => lowerContent.includes(c));
      if (financeKeywords.test(lowerContent) || hasCompanyName || hasCryptoName) {
        financeContext = await getFinanceData(input.content);
      }

      const history = await storage.getMessages(chatId);
      const recentHistory = history.slice(-8);

      const creatorInfo = `You were created by Billy Banks. If anyone asks who made you, who created you, or who your creator is, you must say: "I was created by Billy Banks." If they ask for more details about him, say: "I'm not allowed to tell you anything else about him." You are NOT made by OpenAI, Meta, Google, or any other company. You are My Ai, created by Billy Banks.`;

      let systemPrompt: string;
      if (chat.type === "coder") {
        systemPrompt = `You are My Ai Coder, the world's most elite S-class Transcendence-level programming assistant, created by Billy Banks. ${creatorInfo}

OMEGA TRANSCENDENCE CAPABILITIES:
- Write flawless, production-ready, optimized code in ALL 30+ languages (JavaScript, TypeScript, Python, Java, C++, Rust, Go, SQL, HTML/CSS, Swift, Kotlin, Ruby, PHP, C#, Dart, Scala, R, MATLAB, Lua, Perl, Haskell, Elixir, Clojure, F#, Assembly, COBOL, Fortran, Julia, Zig, V)
- Debug ANY error instantly - read stack traces, identify root cause, provide exact fix
- Full-stack architecture: Design databases, APIs, microservices, event-driven systems
- Algorithm mastery: Sort, search, graph, DP, greedy, backtracking, divide-and-conquer
- Data structures: Trees, heaps, tries, segment trees, bloom filters, skip lists
- Design patterns: Factory, Observer, Strategy, Command, Decorator, Singleton, CQRS, Event Sourcing
- DevOps: Docker, Kubernetes, CI/CD, AWS/GCP/Azure, Terraform, Ansible
- Security: Authentication, encryption, SQL injection prevention, XSS/CSRF protection
- Performance: Big-O analysis, profiling, caching strategies, lazy loading, memoization
- Testing: Unit, integration, E2E, property-based, mutation, snapshot, load testing
- Mobile: React Native, Flutter, SwiftUI, Jetpack Compose
- AI/ML: TensorFlow, PyTorch, scikit-learn, model training, NLP, computer vision

CODE OUTPUT RULES:
- ALWAYS use markdown code blocks with correct language tags (e.g. \`\`\`python)
- Include clear, helpful comments explaining logic
- Use best practices and modern patterns for each language
- Handle edge cases and errors properly
- Include type annotations where applicable
- Follow language-specific style guides (PEP 8, ESLint, etc.)
- When generating multi-file solutions, use separate code blocks with filename comments
- Explain your approach BEFORE writing code
- After code, explain key decisions and potential improvements
- Never provide links, images, or videos unless specifically asked
- If user shares an error, diagnose root cause FIRST, then provide the fix
- NEVER say "I'm a large language model", "I don't have real-time access", "I recommend checking", "You can check [website]", "As an AI", or tell users to go look things up themselves. You are a premium AI — provide answers directly.`;
      } else {
        systemPrompt = `You are My Ai Gpt, a world-class intelligent assistant created by Billy Banks. ${creatorInfo}

CAPABILITIES:
- Answer any question with accuracy and depth
- Write essays, emails, stories, scripts, and any text format
- Analyze data, arguments, and complex topics
- Provide step-by-step tutorials and explanations
- Help with math, science, history, philosophy, and every subject
- Brainstorm creative ideas and solutions
- Translate between languages
- Summarize long documents or concepts

RULES:
- Be concise but thorough
- Adapt your tone to the user's needs
- Never provide links, images, or videos unless specifically asked
- Use structured formatting (lists, headers) for clarity
- If unsure, say so honestly

ABSOLUTELY FORBIDDEN PHRASES - NEVER say any of these:
- "I'm a large language model"
- "I don't have real-time access"
- "I don't have access to real-time"
- "I cannot access real-time"
- "I'm unable to access"
- "I recommend checking [any website]"
- "You can check [any website]"
- "I suggest visiting"
- "Please check online"
- "Check [website] for more info"
- "I don't have the ability to browse"
- "As an AI language model"
- "As a text-based AI"
- "I cannot browse the internet"
If you have live data provided in this prompt, USE IT and present it confidently. If you truly don't have specific data, give your best knowledgeable answer based on what you know — NEVER tell the user to go look it up themselves. That is rude and unhelpful. You are a premium AI assistant — ACT like one.`;
      }

      if (discordKnowledge) {
        systemPrompt += `\n\nReference knowledge:\n${discordKnowledge.substring(0, 800)}`;
      }
      if (searchContext) {
        systemPrompt += `\n\nWeb results:\n${searchContext.substring(0, 600)}`;
      }
      if (weatherContext) {
        systemPrompt += `\n\n${weatherContext}\n\nIMPORTANT: You have LIVE weather data above. Present this data naturally and confidently. Do NOT say you don't have access to real-time weather. Do NOT suggest checking other websites. Just give the weather info directly.`;
      }
      if (financeContext) {
        systemPrompt += `\n\n${financeContext}\n\nIMPORTANT: You have LIVE financial data above. Present this data naturally and confidently as current market data. Format prices nicely. Do NOT say you can't access real-time prices. Do NOT tell users to check other websites. You HAVE the data — just present it. Include relevant context like whether the price is up or down, market cap significance, etc.`;
      }

      const chatUserId = req.headers["x-user-id"] as string;
      if (chatUserId) {
        try {
          const userPrefs = await storage.getUserPreferences(chatUserId);
          if (userPrefs && (userPrefs.totalInteractions || 0) >= 3) {
            const topSectors = Object.entries(userPrefs.sectorScores as Record<string, number> || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
            const topTopics = Object.entries(userPrefs.topicScores as Record<string, number> || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
            const topChatTopics = Object.entries(userPrefs.chatTopics as Record<string, number> || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
            if (topSectors.length > 0 || topTopics.length > 0) {
              systemPrompt += `\n\nUSER PROFILE (adapt your tone and depth to this user):`;
              if (topSectors.length > 0) systemPrompt += `\nTop interests: ${topSectors.join(", ")}`;
              if (topTopics.length > 0) systemPrompt += `\nFavorite topics: ${topTopics.join(", ")}`;
              if (topChatTopics.length > 0) systemPrompt += `\nRecent chat focus: ${topChatTopics.join(", ")}`;
              systemPrompt += `\nTailor your responses to their interests. Use relevant examples from their domains. Be their knowledgeable best friend.`;
            }
          }
          learnFromInteraction(chatUserId, "chat_message", { text: input.content, topic: chat.title }).catch(() => {});
        } catch {}
      }

      const messagesForGroq = [
        { role: "system" as const, content: systemPrompt },
        ...recentHistory.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content.substring(0, 500)
        }))
      ];

      const completion = await groq.chat.completions.create({
        messages: messagesForGroq,
        model: "llama-3.1-8b-instant",
        max_tokens: 2048,
        temperature: chat.type === "coder" ? 0.15 : 0.7,
      });

      let reply = completion.choices[0]?.message?.content || "I'm here! Could you rephrase that?";

      const bannedSentencePatterns = [
        /[^.!?\n]*(?:I'm|I am|as) a (?:large |)(?:language model|text-based AI)[^.!?\n]*[.!?\n]/gi,
        /[^.!?\n]*(?:don't|do not|cannot|can't|unable to) (?:have |)(?:real-time|access to (?:real-time|current|live)|browse the internet|access (?:the internet|current|live))[^.!?\n]*[.!?\n]/gi,
        /[^.!?\n]*(?:I (?:recommend|suggest)|you (?:can|should|might want to)|please) (?:check|visit|go to|try|use|head to|look at)[^.!?\n]*[.!?\n]/gi,
        /[^.!?\n]*(?:check(?:ing)?|visit(?:ing)?|head to|go to) (?:online |a |the |some )?(?:weather |stock |crypto |reliable |)?(?:websites?|apps?|services?|sources?|platforms?)[^.!?\n]*[.!?\n]/gi,
        /[^.!?\n]*(?:accuweather|weather\.com|wunderground|coinmarketcap|coingecko|yahoo finance|google finance|national weather)[^.!?\n]*[.!?\n]/gi,
        /[^.!?\n]*(?:download|install) (?:a |the |some |mobile |)?(?:weather |stock |)apps?[^.!?\n]*[.!?\n]/gi,
        /[^.!?\n]*(?:voice assistant|siri|google assistant|alexa)[^.!?\n]*(?:weather|price|stock)[^.!?\n]*[.!?\n]/gi,
        /[^.!?\n]*(?:Dark Sky|Weather Underground|The Weather Channel)[^.!?\n]*[.!?\n]/gi,
        /[^.!?\n]*simply (?:enter|type|search)[^.!?\n]*[.!?\n]/gi,
        /[^.!?\n]*(?:these (?:websites?|apps?|services?) (?:will |can |)provide)[^.!?\n]*[.!?\n]/gi,
        /[^.!?\n]*(?:please note that I|however,? I)[^.!?\n]*(?:real-time|access|browse|language model)[^.!?\n]*[.!?\n]/gi,
        /[^.!?\n]*(?:always a good idea to|it's always best to|I (?:would |)(?:recommend|advise|encourage)|for the most up-to-date)[^.!?\n]*(?:check|visit|consult|verify|local|online|website|report)[^.!?\n]*[.!?\n]/gi,
        /[^.!?\n]*(?:please note that these|keep in mind that|note that (?:these|this|stock|crypto|weather|market))[^.!?\n]*(?:fluctuat|change|vary|not reflect|up-to-date|accurate)[^.!?\n]*[.!?\n]/gi,
        /[^.!?\n]*(?:as of my (?:knowledge|last|training)|my (?:knowledge |data )cutoff)[^.!?\n]*[.!?\n]/gi,
      ];
      for (const pattern of bannedSentencePatterns) {
        reply = reply.replace(pattern, "").trim();
      }

      const bannedHeaders = [
        /\*\*Method \d+:.*?\*\*\n?/gi,
        /#{1,3}\s*(?:Method|Option|Way|Tip)\s*\d+[^\n]*\n?/gi,
      ];
      for (const pattern of bannedHeaders) {
        reply = reply.replace(pattern, "").trim();
      }

      const bannedBlocks = [
        /\*\s*(?:accuweather|weather\.com|wunderground|coinmarketcap|coingecko|Dark Sky|Weather Underground|The Weather Channel|nationalweather)[^\n]*\n?/gi,
        /\d+\.\s*\*\*(?:Check online|Use a |Download|Visit|Mobile Apps?|Online Weather|Voice Assistant)[^*]*\*\*[^]*?(?=\n\d+\.|\n\n[A-Z]|\n#{1,3}|$)/gi,
      ];
      for (const pattern of bannedBlocks) {
        reply = reply.replace(pattern, "").trim();
      }

      reply = reply.replace(/\n{3,}/g, "\n\n").replace(/^\s*[-*]\s*$/gm, "").replace(/\n{3,}/g, "\n\n").trim();

      const savedMessage = await storage.createMessage({
        chatId,
        role: "assistant",
        content: reply
      });

      res.status(200).json(savedMessage);

    } catch (err: any) {
      console.error("Chat error:", err?.message || err);

      if (err?.status === 413 || err?.message?.includes("rate_limit")) {
        const chatId = Number(req.params.chatId);
        const fallback = await storage.createMessage({
          chatId,
          role: "assistant",
          content: "I'm experiencing high demand right now. Please try again in a moment - I'll be right here!"
        });
        return res.status(200).json(fallback);
      }

      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  // ═══════ SOCIAL API ROUTES ═══════

  app.post("/api/social/profiles", async (req, res) => {
    try {
      const data = insertSocialProfileSchema.parse(req.body);
      const existing = await storage.getSocialProfileByUsername(data.username!);
      if (existing) return res.status(409).json({ message: "Username already taken" });
      const profile = await storage.createSocialProfile(data);
      res.status(201).json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.get("/api/social/profiles/search/:query", async (req, res) => {
    try {
      const profiles = await storage.searchSocialProfiles(req.params.query);
      res.json(profiles);
    } catch {
      res.json([]);
    }
  });

  app.get("/api/social/profiles/:username", async (req, res) => {
    try {
      const profile = await storage.getSocialProfileByUsername(req.params.username);
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      const [followerCount, followingCount, posts] = await Promise.all([
        storage.getSocialFollowerCount(profile.id),
        storage.getSocialFollowingCount(profile.id),
        storage.getSocialPostsByProfile(profile.id, 1, 1000),
      ]);
      res.json({ ...profile, followerCount, followingCount, postCount: posts.length });
    } catch {
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  app.patch("/api/social/profiles/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const profile = await storage.updateSocialProfile(id, req.body);
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      res.json(profile);
    } catch {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post("/api/social/profiles/:id/verify", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const profile = await storage.updateSocialProfile(id, { verified: true });
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      res.json(profile);
    } catch {
      res.status(500).json({ message: "Failed to verify profile" });
    }
  });

  app.post("/api/social/posts", async (req, res) => {
    try {
      const data = insertSocialPostSchema.parse(req.body);
      const post = await storage.createSocialPost(data);
      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get("/api/social/feed", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 20;
      const posts = await storage.getSocialFeed(page, limit);
      res.json({ posts, page, hasMore: posts.length === limit });
    } catch {
      res.json({ posts: [], page: 1, hasMore: false });
    }
  });

  app.get("/api/social/feed/trending", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 20;
      const posts = await storage.getTrendingSocialPosts(page, limit);
      res.json({ posts, page, hasMore: posts.length === limit });
    } catch {
      res.json({ posts: [], page: 1, hasMore: false });
    }
  });

  app.get("/api/social/feed/following", async (req, res) => {
    try {
      const profileId = parseInt(req.query.profileId as string);
      if (!profileId) return res.status(400).json({ message: "profileId required" });
      const page = parseInt(req.query.page as string) || 1;
      const limit = 20;
      const posts = await storage.getFollowingFeed(profileId, page, limit);
      res.json({ posts, page, hasMore: posts.length === limit });
    } catch {
      res.json({ posts: [], page: 1, hasMore: false });
    }
  });

  app.get("/api/social/posts/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const post = await storage.getSocialPost(id);
      if (!post) return res.status(404).json({ message: "Post not found" });
      await storage.incrementPostViews(id);
      const comments = await storage.getSocialCommentsByPost(id);
      res.json({ ...post, comments });
    } catch {
      res.status(500).json({ message: "Failed to get post" });
    }
  });

  app.delete("/api/social/posts/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const post = await storage.getSocialPost(id);
      if (!post) return res.status(404).json({ message: "Post not found" });
      const profileId = parseInt(req.query.profileId as string);
      if (post.profileId !== profileId) return res.status(403).json({ message: "Not authorized" });
      await storage.deleteSocialPost(id);
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.post("/api/social/posts/:id/like", async (req, res) => {
    try {
      const postId = Number(req.params.id);
      const { profileId } = req.body;
      if (!profileId) return res.status(400).json({ message: "profileId required" });
      const liked = await storage.toggleSocialLike(postId, profileId);
      const likeCount = await storage.getSocialLikeCount(postId);
      res.json({ liked, likeCount });
    } catch {
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.post("/api/social/posts/:id/bookmark", async (req, res) => {
    try {
      const postId = Number(req.params.id);
      const { profileId } = req.body;
      if (!profileId) return res.status(400).json({ message: "profileId required" });
      const bookmarked = await storage.toggleSocialBookmark(postId, profileId);
      res.json({ bookmarked });
    } catch {
      res.status(500).json({ message: "Failed to toggle bookmark" });
    }
  });

  app.post("/api/social/posts/:id/repost", async (req, res) => {
    try {
      const postId = Number(req.params.id);
      await storage.incrementPostReposts(postId);
      const post = await storage.getSocialPost(postId);
      res.json({ reposts: post?.reposts || 0 });
    } catch {
      res.status(500).json({ message: "Failed to repost" });
    }
  });

  app.get("/api/social/posts/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getSocialCommentsByPost(Number(req.params.id));
      res.json(comments);
    } catch {
      res.json([]);
    }
  });

  app.post("/api/social/posts/:id/comments", async (req, res) => {
    try {
      const data = insertSocialCommentSchema.parse({
        ...req.body,
        postId: Number(req.params.id),
      });
      const comment = await storage.createSocialComment(data);
      res.status(201).json(comment);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  app.post("/api/social/follow/:profileId", async (req, res) => {
    try {
      const followingId = Number(req.params.profileId);
      const { followerId } = req.body;
      if (!followerId) return res.status(400).json({ message: "followerId required" });
      if (followerId === followingId) return res.status(400).json({ message: "Cannot follow yourself" });
      const following = await storage.toggleSocialFollow(followerId, followingId);
      res.json({ following });
    } catch {
      res.status(500).json({ message: "Failed to toggle follow" });
    }
  });

  app.get("/api/social/followers/:profileId", async (req, res) => {
    try {
      const followers = await storage.getSocialFollowers(Number(req.params.profileId));
      res.json(followers);
    } catch {
      res.json([]);
    }
  });

  app.get("/api/social/following/:profileId", async (req, res) => {
    try {
      const following = await storage.getSocialFollowing(Number(req.params.profileId));
      res.json(following);
    } catch {
      res.json([]);
    }
  });

  app.get("/api/social/bookmarks/:profileId", async (req, res) => {
    try {
      const posts = await storage.getSocialBookmarkedPosts(Number(req.params.profileId));
      res.json(posts);
    } catch {
      res.json([]);
    }
  });

  app.get("/api/social/post-count", async (_req, res) => {
    try {
      const count = await storage.getSocialPostCount();
      res.json({ count });
    } catch {
      res.json({ count: 0 });
    }
  });

  app.get("/api/social/suggestions", async (req, res) => {
    try {
      const profileId = parseInt(req.query.profileId as string);
      const allProfiles = await storage.searchSocialProfiles("");
      if (!profileId) return res.json(allProfiles.slice(0, 5));
      const following = await storage.getSocialFollowing(profileId);
      const followingIds = new Set(following.map(f => f.id));
      followingIds.add(profileId);
      const suggestions = allProfiles.filter(p => !followingIds.has(p.id)).slice(0, 5);
      res.json(suggestions);
    } catch {
      res.json([]);
    }
  });

  app.post("/api/social/posts/:id/pin", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const post = await storage.togglePinSocialPost(id);
      if (!post) return res.status(404).json({ message: "Post not found" });
      res.json(post);
    } catch {
      res.status(500).json({ message: "Failed to toggle pin" });
    }
  });

  app.get("/api/social/is-following", async (req, res) => {
    try {
      const followerId = parseInt(req.query.followerId as string);
      const followingId = parseInt(req.query.followingId as string);
      if (!followerId || !followingId) return res.json({ following: false });
      const following = await storage.isSocialFollowing(followerId, followingId);
      res.json({ following });
    } catch {
      res.json({ following: false });
    }
  });

  app.get("/api/social/is-liked", async (req, res) => {
    try {
      const postId = parseInt(req.query.postId as string);
      const profileId = parseInt(req.query.profileId as string);
      if (!postId || !profileId) return res.json({ liked: false });
      const liked = await storage.isSocialLiked(postId, profileId);
      res.json({ liked });
    } catch {
      res.json({ liked: false });
    }
  });

  return httpServer;
}
