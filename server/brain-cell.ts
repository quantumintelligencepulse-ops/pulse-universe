import { Client, TextChannel } from "discord.js";

const BRAIN_CELL_CHANNEL_ID = "1476404773455663165";
const MAX_ATOM_LENGTH = 2000;
const BASE_DELAY_MS = 2000;
const MIN_DELAY_MS = 2000;
const MAX_DELAY_MS = 15000;
const BURST_WINDOW_MS = 60000;
const BURST_LIMIT = 3;

interface QueuedAtom {
  content: string;
  priority: number;
  timestamp: number;
}

let discordClientRef: Client | null = null;
let brainChannel: TextChannel | null = null;
const atomQueue: QueuedAtom[] = [];
let isProcessing = false;
let currentDelay = BASE_DELAY_MS;
let consecutiveSuccesses = 0;
let recentSendTimestamps: number[] = [];

export function initBrainCell(client: Client) {
  discordClientRef = client;
  client.once("ready", async () => {
    try {
      const ch = await client.channels.fetch(BRAIN_CELL_CHANNEL_ID);
      if (ch && ch.isTextBased()) {
        brainChannel = ch as TextChannel;
        console.log(`Brain Cell connected to channel #${brainChannel.name}`);
        if (atomQueue.length > 0) {
          console.log(`Brain Cell: draining ${atomQueue.length} queued atoms...`);
          processQueue().catch(() => {});
        }
      }
    } catch (e: any) {
      console.error("Brain Cell channel fetch failed:", e.message);
    }
  });
}

function splitIntoParts(text: string): string[] {
  if (text.length <= MAX_ATOM_LENGTH) return [text];
  const parts: string[] = [];
  let remaining = text;
  let partNum = 1;
  const estimatedTotal = Math.ceil(text.length / (MAX_ATOM_LENGTH - 40));
  while (remaining.length > 0) {
    const header = `[PART ${partNum}/${estimatedTotal}]\n`;
    const maxChunk = MAX_ATOM_LENGTH - header.length;
    let cutPoint = maxChunk;
    if (remaining.length > maxChunk) {
      const lastNewline = remaining.lastIndexOf("\n", maxChunk);
      if (lastNewline > maxChunk * 0.5) {
        cutPoint = lastNewline + 1;
      }
    }
    const chunk = remaining.substring(0, cutPoint);
    remaining = remaining.substring(cutPoint);
    parts.push(header + chunk);
    partNum++;
  }
  if (parts.length > 1) {
    const actualTotal = parts.length;
    for (let i = 0; i < parts.length; i++) {
      parts[i] = parts[i].replace(/\[PART \d+\/\d+\]/, `[PART ${i + 1}/${actualTotal}]`);
    }
  }
  return parts;
}

function getBurstCount(): number {
  const now = Date.now();
  recentSendTimestamps = recentSendTimestamps.filter(t => now - t < BURST_WINDOW_MS);
  return recentSendTimestamps.length;
}

function adaptSpeed(success: boolean, retryAfterMs?: number) {
  if (!success && retryAfterMs) {
    currentDelay = Math.min(MAX_DELAY_MS, retryAfterMs + 500);
    consecutiveSuccesses = 0;
    return;
  }
  if (!success) {
    currentDelay = Math.min(MAX_DELAY_MS, currentDelay * 1.8);
    consecutiveSuccesses = 0;
    return;
  }
  consecutiveSuccesses++;
  const burstCount = getBurstCount();
  if (burstCount >= BURST_LIMIT - 1) {
    currentDelay = Math.min(MAX_DELAY_MS, currentDelay * 1.3);
    return;
  }
  if (consecutiveSuccesses >= 10) {
    currentDelay = Math.max(MIN_DELAY_MS, currentDelay * 0.85);
  } else if (consecutiveSuccesses >= 5) {
    currentDelay = Math.max(MIN_DELAY_MS, currentDelay * 0.92);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function processQueue() {
  if (isProcessing || atomQueue.length === 0 || !brainChannel) return;
  isProcessing = true;

  while (atomQueue.length > 0) {
    if (!brainChannel || !discordClientRef?.isReady()) {
      await sleep(5000);
      continue;
    }

    const burstCount = getBurstCount();
    if (burstCount >= BURST_LIMIT) {
      const waitTime = BURST_WINDOW_MS - (Date.now() - recentSendTimestamps[0]);
      await sleep(Math.max(waitTime, 1000));
      continue;
    }

    atomQueue.sort((a, b) => b.priority - a.priority || a.timestamp - b.timestamp);
    const atom = atomQueue.shift()!;

    try {
      await brainChannel.send(atom.content);
      recentSendTimestamps.push(Date.now());
      adaptSpeed(true);
      await sleep(currentDelay);
    } catch (err: any) {
      if (err?.status === 429 || err?.httpStatus === 429 || err?.message?.includes("rate limit")) {
        const retryAfter = (err?.retry_after || err?.retryAfter || 2) * 1000;
        console.warn(`Brain Cell rate limited. Waiting ${retryAfter}ms...`);
        adaptSpeed(false, retryAfter);
        atomQueue.unshift(atom);
        await sleep(retryAfter + 200);
      } else {
        console.error("Brain Cell send error:", err?.message || err);
        adaptSpeed(false);
        if (atom.priority >= 2) {
          atomQueue.push({ ...atom, priority: atom.priority - 1 });
        }
        await sleep(currentDelay);
      }
    }
  }

  isProcessing = false;
}

function enqueueAtom(content: string, priority: number = 1) {
  if (!discordClientRef) {
    console.warn("Brain Cell: Discord client not initialized, atom queued for later");
  }
  const parts = splitIntoParts(content);
  const now = Date.now();
  for (let i = 0; i < parts.length; i++) {
    atomQueue.push({ content: parts[i], priority, timestamp: now + i });
  }
  if (brainChannel) {
    processQueue().catch(() => {});
  }
}

export function storeKnowledgeAtom(data: {
  factType: "FACT" | "EVENT" | "SUMMARY" | "TREND" | "RELATIONSHIP";
  sector: string;
  industry: string;
  headline: string;
  summary: string;
  entities: { name: string; type: string }[];
  tags: string[];
}) {
  const entityLines = data.entities.map(e => `- ${e.name} (${e.type})`).join("\n");
  const tagLines = data.tags.map(t => `- ${t}`).join("\n");
  const atom = `[KNOWLEDGE_ATOM]
type: ${data.factType}
sector: ${data.sector}
industry: ${data.industry}
timestamp: ${new Date().toISOString()}
headline: ${data.headline}
summary: ${data.summary}
entities:
${entityLines}
tags:
${tagLines}`;
  enqueueAtom(atom, 2);
}

export function storeConversationAtom(data: {
  userMessage: string;
  aiReply: string;
  intent: "QUESTION" | "REQUEST" | "OPINION";
  topics: string[];
}) {
  const topicLines = data.topics.map(t => `- ${t}`).join("\n");
  const atom = `[CONVERSATION_ATOM]
timestamp: ${new Date().toISOString()}
user: "${data.userMessage}"
ai: "${data.aiReply}"
intent: ${data.intent}
topics:
${topicLines}`;
  enqueueAtom(atom, 1);
}

export function storeCodeAtom(data: {
  direction: "INPUT" | "OUTPUT";
  userIntent: "CODE_REQUEST" | "DEBUG" | "GENERATION" | "EXPLANATION";
  description: string;
  codeSummary: string;
  topics: string[];
}) {
  const topicLines = data.topics.map(t => `- ${t}`).join("\n");
  const atom = `[CODE_ATOM]
timestamp: ${new Date().toISOString()}
direction: ${data.direction}
user_intent: ${data.userIntent}
description: ${data.description}
code_summary: ${data.codeSummary}
topics:
${topicLines}
notes:
- "Raw code omitted to protect Brain Cell integrity."`;
  enqueueAtom(atom, 1);
}

export function classifyIntent(text: string): "QUESTION" | "REQUEST" | "OPINION" {
  const lower = text.toLowerCase().trim();
  if (lower.match(/^(what|who|where|when|why|how|is |are |do |does |can |could |would |should |will |did )/)) return "QUESTION";
  if (lower.match(/^(write|create|make|build|generate|show|find|get|give|help|tell|explain|list|summarize|translate|convert|fix|debug|code|implement)/)) return "REQUEST";
  return "OPINION";
}

export function classifyCodeIntent(text: string): "CODE_REQUEST" | "DEBUG" | "GENERATION" | "EXPLANATION" {
  const lower = text.toLowerCase();
  if (lower.match(/debug|fix|error|bug|broken|wrong|issue|problem|crash|fail/)) return "DEBUG";
  if (lower.match(/explain|how does|what does|understand|walk me through|breakdown/)) return "EXPLANATION";
  if (lower.match(/write|create|build|make|generate|code|implement|function|class|component/)) return "GENERATION";
  return "CODE_REQUEST";
}

export function extractTopics(userText: string, aiText: string): string[] {
  const combined = (userText + " " + aiText).toLowerCase();
  const topicKeywords: Record<string, string[]> = {
    "programming": ["code", "function", "variable", "class", "api", "debug", "compile", "syntax"],
    "web development": ["html", "css", "javascript", "react", "frontend", "backend", "server", "website"],
    "AI/ML": ["ai", "machine learning", "neural", "model", "training", "dataset", "gpt", "llm"],
    "finance": ["stock", "market", "invest", "crypto", "bitcoin", "trading", "portfolio", "dividend"],
    "health": ["health", "medical", "doctor", "symptom", "treatment", "disease", "wellness"],
    "science": ["science", "physics", "chemistry", "biology", "research", "experiment", "theory"],
    "education": ["learn", "study", "course", "tutorial", "school", "university", "teaching"],
    "business": ["business", "startup", "company", "revenue", "profit", "management", "strategy"],
    "technology": ["tech", "software", "hardware", "computer", "device", "app", "platform"],
    "entertainment": ["movie", "music", "game", "show", "entertainment", "stream", "video"],
    "news": ["news", "breaking", "report", "headline", "article", "update", "latest"],
    "creative writing": ["story", "poem", "essay", "write", "creative", "fiction", "narrative"],
    "math": ["math", "calculate", "equation", "formula", "algebra", "geometry", "statistics"],
    "weather": ["weather", "temperature", "rain", "snow", "forecast", "climate", "storm"],
    "sports": ["sport", "game", "team", "player", "score", "match", "championship"],
  };

  const matched: string[] = [];
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => combined.includes(kw))) {
      matched.push(topic);
    }
  }
  return matched.length > 0 ? matched.slice(0, 5) : ["general"];
}

export function extractEntitiesFromHeadline(headline: string): { name: string; type: string }[] {
  const entities: { name: string; type: string }[] = [];
  const companyPatterns = /\b(Apple|Google|Microsoft|Amazon|Meta|Facebook|Tesla|Netflix|Nvidia|Intel|AMD|TSMC|Qualcomm|Broadcom|Samsung|IBM|Oracle|Salesforce|Adobe|Cisco|PayPal|Visa|Mastercard|JPMorgan|Goldman Sachs|Morgan Stanley|BlackRock|Vanguard|Disney|Warner Bros|Sony|Nintendo|Uber|Lyft|Airbnb|SpaceX|Boeing|Lockheed|Raytheon|Pfizer|Moderna|Johnson & Johnson|Merck|AstraZeneca|Roche|Novartis|UnitedHealth|Anthem|Cigna|Walmart|Target|Costco|Home Depot|Lowe's|Starbucks|McDonald's|Coca-Cola|PepsiCo|Procter & Gamble|ExxonMobil|Chevron|Shell|BP|ConocoPhillips|SambaNova|OpenAI|Anthropic|DeepMind|Palantir|Snowflake|Databricks|Stripe|Rivian|Lucid|NIO|BYD|Ford|GM|Toyota|Honda|BMW|Mercedes|Volkswagen|Hyundai|Coinbase|Binance|Robinhood|Block|Square|SoFi|Affirm|Klarna|Zoom|Slack|Shopify|Twilio|Atlassian|ServiceNow|Workday|CrowdStrike|Palo Alto|Fortinet|SentinelOne|Zscaler|Datadog|Elastic|Confluent|MongoDB|Cloudflare|Akamai|Fastly|DigitalOcean|Linode|Hetzner|OVH)\b/gi;
  const personPatterns = /\b(Elon Musk|Tim Cook|Satya Nadella|Mark Zuckerberg|Jeff Bezos|Jensen Huang|Sam Altman|Sundar Pichai|Andy Jassy|Lisa Su|Pat Gelsinger|Jamie Dimon|Warren Buffett|Larry Fink|Cathie Wood|Jim Cramer|Jerome Powell|Janet Yellen|Joe Biden|Donald Trump|Kamala Harris|Xi Jinping|Vladimir Putin|Bill Gates|Steve Jobs)\b/gi;
  const seen = new Set<string>();
  let m;
  while ((m = companyPatterns.exec(headline)) !== null) {
    const name = m[1];
    const key = name.toLowerCase();
    if (!seen.has(key)) { seen.add(key); entities.push({ name, type: "COMPANY" }); }
  }
  while ((m = personPatterns.exec(headline)) !== null) {
    const name = m[1];
    const key = name.toLowerCase();
    if (!seen.has(key)) { seen.add(key); entities.push({ name, type: "PERSON" }); }
  }
  const orgPatterns = /\b(FDA|SEC|FTC|EPA|NASA|DARPA|DOJ|DOD|WHO|UN|NATO|EU|IMF|World Bank|Federal Reserve|Fed|Congress|Senate|Pentagon|White House|Supreme Court|OPEC|G7|G20|CISA|NSA|CIA|FBI|IRS|NIH|CDC)\b/g;
  while ((m = orgPatterns.exec(headline)) !== null) {
    const name = m[1];
    const key = name.toLowerCase();
    if (!seen.has(key)) { seen.add(key); entities.push({ name, type: "ORGANIZATION" }); }
  }
  return entities.length > 0 ? entities : [{ name: "News", type: "SOURCE" }];
}

export function generateSummary(headline: string, description: string): string {
  if (description && description.length > 20) {
    return description.length > 200 ? description.substring(0, 200) + "..." : description;
  }
  const words = headline.split(/\s+/);
  if (words.length <= 5) return headline;
  const actionVerbs = ["announces", "launches", "reveals", "reports", "acquires", "partners", "plans", "releases", "introduces", "expands", "cuts", "raises", "faces", "wins", "loses", "targets", "beats", "misses", "warns", "enters", "exits"];
  for (const verb of actionVerbs) {
    if (headline.toLowerCase().includes(verb)) {
      return `${headline.split(/[,\-–—]/)[0].trim()} — key development in the industry.`;
    }
  }
  return `${headline} — notable industry update.`;
}

export function detectCodeInMessage(text: string): boolean {
  return !!(
    text.match(/```[\s\S]*?```/) ||
    text.match(/function\s+\w+\s*\(/) ||
    text.match(/const\s+\w+\s*=/) ||
    text.match(/class\s+\w+/) ||
    text.match(/import\s+.*from/) ||
    text.match(/def\s+\w+\s*\(/) ||
    text.match(/<\w+[^>]*>[\s\S]*<\/\w+>/)
  );
}

export function summarizeCode(text: string): string {
  const codeBlocks = text.match(/```(\w+)?\n?([\s\S]*?)```/g) || [];
  if (codeBlocks.length === 0) return "Inline code snippet discussed";

  const summaries: string[] = [];
  for (const block of codeBlocks.slice(0, 3)) {
    const langMatch = block.match(/```(\w+)/);
    const lang = langMatch?.[1] || "unknown";
    const code = block.replace(/```\w*\n?/, "").replace(/```$/, "");
    const lines = code.split("\n").filter(l => l.trim()).length;
    const funcs = (code.match(/(?:function|def|const|let|var)\s+\w+/g) || []).slice(0, 3);
    const funcNames = funcs.map(f => f.split(/\s+/).pop()).join(", ");
    summaries.push(`${lang} (${lines} lines${funcNames ? `, defines: ${funcNames}` : ""})`);
  }
  return summaries.join("; ");
}

export function getQueueStatus() {
  return {
    queueLength: atomQueue.length,
    isProcessing,
    currentDelayMs: Math.round(currentDelay),
    channelConnected: !!brainChannel,
    consecutiveSuccesses,
  };
}
