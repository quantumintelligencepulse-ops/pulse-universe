import { throttledBgQuery, directQuery } from "./db";
import { feedMemoryCortex } from "./hive-brain";

const DISCORD_BOT_TOKEN = process.env.discord_token || process.env.DISCORD_BOT_TOKEN || "";
const GUILD_ID = process.env.DISCORD_GUILD_ID || "1467658793373536278";
// READ-ONLY ingestion: this engine only listens. The two channels in
// discord-forbidden.ts are still readable here (humans may post there) but
// nothing this engine does writes to Discord, so no outbound guard is needed.
const CHANNEL_IDS = (process.env.DISCORD_CHANNEL_IDS || "1474313120821547110").split(",").map(s => s.trim()).filter(Boolean);

const POLL_INTERVAL_MS = 90_000;
let lastMessageIds: Record<string, string> = {};
let running = false;
let cycleCount = 0;
let totalIngested = 0;

function log(msg: string) {
  console.log(`[discord-wire] ${msg}`);
}

const TICKER_RE = /\b[A-Z]{2,5}\b/g;
const BREAKING_KEYWORDS = ["just in", "breaking", "urgent", "flash", "alert"];

const TAG_RULES: [string[], string][] = [
  [["spy", "qqq", "stock", "options", "calls", "puts", "breakout", "price-targets"], "markets"],
  [["earnings", "guidance", "downgrade", "upgrade", "analyst", "profit", "revenue", "target"], "fundamentals"],
  [["war", "sanctions", "tariff", "election", "parliament", "minister", "president", "congress", "strike on", "missile"], "geopolitics"],
  [["crypto", "bitcoin", "ethereum", "token", "rwa", "defi"], "crypto"],
  [["ai", "anthropic", "openai", "model", "neural", "machine learning"], "ai"],
  [["oil", "gas", "energy", "opec", "barrel"], "energy"],
  [["gold", "silver", "copper", "commodity", "futures"], "commodities"],
  [["fed", "ecb", "boe", "boj", "interest rate", "hike", "cut", "central bank"], "central-banks"],
  [["inflation", "cpi", "ppi", "gdp", "growth", "recession"], "macro"],
  [["partnership", "merger", "acquisition", "takeover", "offer", "bid", "buyout", "deal"], "deals"],
];

function extractTickers(text: string): string[] {
  const matches = text.match(TICKER_RE) || [];
  const stopWords = new Set(["THE", "AND", "FOR", "BUT", "NOT", "ARE", "WAS", "HAS", "HIS", "HER", "ITS", "OUR", "ALL", "NEW", "NOW", "CEO", "CFO", "GDP", "CPI", "PPI", "FED", "ECB", "BOE", "BOJ"]);
  return [...new Set(matches.filter(t => !stopWords.has(t)))].slice(0, 8);
}

function extractTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  for (const [keywords, tag] of TAG_RULES) {
    if (keywords.some(k => lower.includes(k))) tags.push(tag);
  }
  if (tags.length === 0) tags.push("general");
  return tags;
}

function isBreaking(text: string): boolean {
  const lower = text.toLowerCase();
  return BREAKING_KEYWORDS.some(k => lower.includes(k));
}

function inferRegion(text: string): string {
  const t = text.toLowerCase();
  if (["eu", "european", "germany", "france", "italy", "uk"].some(k => t.includes(k))) return "Europe";
  if (["u.s.", "united states", "america", "us "].some(k => t.includes(k))) return "United States";
  if (["china", "beijing", "shanghai"].some(k => t.includes(k))) return "China";
  if (["japan", "tokyo", "boj"].some(k => t.includes(k))) return "Japan";
  if (["middle east", "iran", "israel", "gaza", "saudi"].some(k => t.includes(k))) return "Middle East";
  return "Global";
}

function buildHeadline(raw: string, tickers: string[], tags: string[]): string {
  let base = raw.replace(/\s+/g, " ").trim();
  if (base.length > 110) base = base.slice(0, 107).trim() + "...";
  if (tickers.length) return `Equity Alert: ${tickers.slice(0, 3).join(", ")} — ${base}`;
  if (tags.includes("geopolitics")) return `Geopolitics Briefing: ${base}`;
  if (tags.includes("crypto")) return `Crypto Wire: ${base}`;
  if (tags.includes("macro") || tags.includes("central-banks")) return `Macro Watch: ${base}`;
  if (tags.includes("deals")) return `Deal Watch: ${base}`;
  return `Market Wire: ${base}`;
}

async function fetchChannelMessages(channelId: string, after?: string): Promise<any[]> {
  if (!DISCORD_BOT_TOKEN) return [];
  const params = new URLSearchParams({ limit: "50" });
  if (after) params.set("after", after);

  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?${params}`, {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
    });
    if (!res.ok) {
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        const retryAfter = (data as any).retry_after || 5;
        log(`Rate limited, waiting ${retryAfter}s`);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        return [];
      }
      log(`HTTP ${res.status} fetching channel ${channelId}`);
      return [];
    }
    return await res.json() as any[];
  } catch (e: any) {
    log(`Fetch error: ${e.message}`);
    return [];
  }
}

async function ingestMessage(msg: any, channelId: string): Promise<boolean> {
  const content = msg.content?.trim();
  if (!content || content.length < 20) return false;

  const tickers = extractTickers(content);
  const tags = extractTags(content);
  const region = inferRegion(content);
  const breaking = isBreaking(content);
  const headline = buildHeadline(content, tickers, tags);
  const timestamp = msg.timestamp || new Date().toISOString();

  const domain = tags[0] === "general" ? "market-intelligence" : tags[0];

  const facts = [
    headline,
    `Region: ${region}`,
    `Source: Equity Network Discord Wire`,
    breaking ? "BREAKING NEWS — High-priority signal" : "",
    tickers.length ? `Tickers in focus: ${tickers.join(", ")}` : "",
    `Raw signal: ${content.slice(0, 200)}`,
  ].filter(Boolean);

  const patterns = [
    ...tags.map(t => `market-intelligence → ${t}`),
    ...tickers.map(t => `ticker → ${t}`),
    `wire → ${region}`,
    `discord-wire → ${channelId}`,
  ];

  // Fire-and-forget: memory cortex uses main pool which can be saturated;
  // never let it block or kill the wire ingestion.
  feedMemoryCortex(domain, headline.slice(0, 80), facts, patterns).catch(() => {});

  try {
    await throttledBgQuery(() => directQuery(
      `INSERT INTO revenue_articles (title, slug, body, category, tags, source, agent_author)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING`,
      [
        headline,
        `discord-wire-${msg.id}`,
        content.slice(0, 500),
        domain,
        tags,
        "Equity Network Discord Wire",
        msg.author?.username || "Equity Wire AI",
      ]
    ));
  } catch {}

  return true;
}

async function pollCycle() {
  let newMessages = 0;

  for (const channelId of CHANNEL_IDS) {
    const after = lastMessageIds[channelId];
    const messages = await fetchChannelMessages(channelId, after);

    if (!messages.length) continue;

    const sorted = messages.sort((a: any, b: any) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (const msg of sorted) {
      const ingested = await ingestMessage(msg, channelId);
      if (ingested) newMessages++;
      lastMessageIds[channelId] = msg.id;
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  cycleCount++;
  totalIngested += newMessages;

  if (newMessages > 0) {
    log(`Cycle ${cycleCount} | +${newMessages} new signals ingested | Total: ${totalIngested}`);
  } else if (cycleCount % 10 === 0) {
    log(`Cycle ${cycleCount} | No new signals | Total: ${totalIngested}`);
  }
}

export function startDiscordWireEngine() {
  if (!DISCORD_BOT_TOKEN) {
    log("⚠ DISCORD_BOT_TOKEN not set — Discord Wire Engine disabled");
    return;
  }

  log(`✅ Discord Wire Engine ONLINE — polling ${CHANNEL_IDS.length} channels every ${POLL_INTERVAL_MS / 1000}s`);
  running = true;

  setTimeout(async () => {
    while (running) {
      try {
        await pollCycle();
      } catch (e: any) {
        log(`Cycle error: ${e.message}`);
      }
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    }
  }, 15_000);
}

export function stopDiscordWireEngine() {
  running = false;
  log("Discord Wire Engine stopped");
}

export function getDiscordWireStats() {
  return {
    running,
    cycleCount,
    totalIngested,
    channels: CHANNEL_IDS.length,
    pollIntervalMs: POLL_INTERVAL_MS,
    lastMessageIds,
  };
}
