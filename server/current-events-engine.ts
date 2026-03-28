/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CURRENT EVENTS ENGINE — Real-Time World Intelligence
 * ═══════════════════════════════════════════════════════════════════════════
 * Sources (100% free, no login, no payment):
 *  • Reddit JSON API   — worldnews, news, science, technology, politics
 *  • Wikipedia         — Current Events portal + Recent Changes
 *  • CourtListener     — Live US federal & state court opinions (free API)
 *  • GDELT Project     — Global news event database (free)
 *  • arXiv RSS         — Latest scientific preprints (today)
 *  • PubMed RSS        — Latest medical/biotech papers
 *  • HackerNews API    — Top tech stories
 *  • RSS World News    — AP, Reuters, BBC public feeds
 *  • US Congress       — bills.json public feed
 *  • UN News           — un.org free RSS
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { pool } from "./db";

interface CurrentEvent {
  source: string;
  category: "politics" | "science" | "tech" | "law" | "world" | "health" | "conflict" | "economy";
  headline: string;
  summary: string;
  url?: string;
  fetchedAt: Date;
}

// In-memory store — refreshed every 15 minutes
let currentEvents: CurrentEvent[] = [];
let worldStateSnapshot = "";
let lastRefresh: Date | null = null;
let totalFetched = 0;
const sourceStatus: Record<string, { lastOk: Date | null; errors: number }> = {};

function setSourceStatus(name: string, ok: boolean) {
  if (!sourceStatus[name]) sourceStatus[name] = { lastOk: null, errors: 0 };
  if (ok) sourceStatus[name].lastOk = new Date();
  else sourceStatus[name].errors++;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
}

async function safeJson(url: string, timeout = 12000): Promise<any> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "MyAiGPT/1.0 Hive Intelligence Bot (open data)" },
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function safeText(url: string, timeout = 12000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "MyAiGPT/1.0 Hive Intelligence Bot (open data)" },
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
}

// ─── Source 1: Reddit JSON API (no auth, completely public) ──────────────────
async function fetchReddit(): Promise<CurrentEvent[]> {
  const subs = [
    { sub: "worldnews", cat: "world" },
    { sub: "news", cat: "world" },
    { sub: "politics", cat: "politics" },
    { sub: "science", cat: "science" },
    { sub: "technology", cat: "tech" },
    { sub: "geopolitics", cat: "conflict" },
    { sub: "UkrainianConflict", cat: "conflict" },
    { sub: "investing", cat: "economy" },
    { sub: "medicine", cat: "health" },
  ] as const;

  const events: CurrentEvent[] = [];
  for (const { sub, cat } of subs) {
    const data = await safeJson(`https://www.reddit.com/r/${sub}/hot.json?limit=5`);
    if (!data?.data?.children) { setSourceStatus(`reddit/${sub}`, false); continue; }
    setSourceStatus(`reddit/${sub}`, true);
    for (const post of data.data.children.slice(0, 3)) {
      const p = post.data;
      if (p.score < 100) continue;
      events.push({
        source: `Reddit r/${sub}`,
        category: cat,
        headline: p.title?.slice(0, 200) ?? "",
        summary: p.selftext ? stripHtml(p.selftext).slice(0, 200) : `${p.score.toLocaleString()} upvotes`,
        url: `https://reddit.com${p.permalink}`,
        fetchedAt: new Date(),
      });
    }
  }
  return events;
}

// ─── Source 2: Wikipedia Current Events Portal ───────────────────────────────
async function fetchWikipediaCurrentEvents(): Promise<CurrentEvent[]> {
  const data = await safeJson(
    "https://en.wikipedia.org/w/api.php?action=parse&page=Portal:Current_events&prop=wikitext&format=json"
  );
  if (!data?.parse?.wikitext?.["*"]) { setSourceStatus("wikipedia-current", false); return []; }
  setSourceStatus("wikipedia-current", true);

  const text: string = data.parse.wikitext["*"];
  const lines = text.split("\n").filter(l => l.startsWith("*") && l.length > 20).slice(0, 15);
  return lines.map(line => ({
    source: "Wikipedia Current Events",
    category: "world" as const,
    headline: line.replace(/\[\[([^\]|]+)[^\]]*\]\]/g, "$1").replace(/[*'{}[\]]/g, "").trim().slice(0, 200),
    summary: "From Wikipedia Current Events portal",
    fetchedAt: new Date(),
  })).filter(e => e.headline.length > 10);
}

// ─── Source 3: CourtListener — Free US Court Opinions ────────────────────────
async function fetchCourtListener(): Promise<CurrentEvent[]> {
  const data = await safeJson(
    "https://www.courtlistener.com/api/rest/v3/opinions/?format=json&order_by=-date_created&fields=case_name,date_created,court_id,absolute_url&page_size=5"
  );
  if (!data?.results) { setSourceStatus("courtlistener", false); return []; }
  setSourceStatus("courtlistener", true);

  return (Array.isArray(data.results) ? data.results : []).slice(0, 5).map((r: any) => ({
    source: "CourtListener (US Federal/State Courts)",
    category: "law" as const,
    headline: r.case_name || "Court Opinion Filed",
    summary: `Court: ${r.court_id || "Unknown"} | Filed: ${r.date_created?.slice(0, 10) || "recent"}`,
    url: r.absolute_url ? `https://courtlistener.com${r.absolute_url}` : undefined,
    fetchedAt: new Date(),
  }));
}

// ─── Source 4: GDELT — Global Events Database ────────────────────────────────
async function fetchGDELT(): Promise<CurrentEvent[]> {
  const queries = ["war conflict", "economy trade", "science discovery", "election politics"];
  const events: CurrentEvent[] = [];
  for (const q of queries.slice(0, 2)) {
    const encoded = encodeURIComponent(q);
    const data = await safeJson(
      `https://api.gdeltproject.org/api/v2/doc/doc?query=${encoded}&mode=artlist&maxrecords=5&format=json&timespan=24h`
    );
    if (!data?.articles) { setSourceStatus("gdelt", false); continue; }
    setSourceStatus("gdelt", true);
    for (const a of (Array.isArray(data.articles) ? data.articles : []).slice(0, 3)) {
      events.push({
        source: `GDELT (${q})`,
        category: q.includes("war") ? "conflict" : q.includes("economy") ? "economy" : q.includes("science") ? "science" : "politics",
        headline: a.title?.slice(0, 200) ?? "",
        summary: `Source: ${a.domain || "news"} | ${a.seendate?.slice(0, 10) || "today"}`,
        url: a.url,
        fetchedAt: new Date(),
      });
    }
  }
  return events;
}

// ─── Source 5: arXiv Atom Feed — Latest Science Papers ───────────────────────
async function fetchArXivLatest(): Promise<CurrentEvent[]> {
  const queries = ["artificial+intelligence", "quantum+computing", "climate+change", "genomics"];
  const events: CurrentEvent[] = [];
  for (const q of queries.slice(0, 2)) {
    const xml = await safeText(
      `https://export.arxiv.org/api/query?search_query=all:${q}&sortBy=submittedDate&sortOrder=descending&max_results=3`
    );
    if (!xml) { setSourceStatus("arxiv-latest", false); continue; }
    setSourceStatus("arxiv-latest", true);
    const titles = [...xml.matchAll(/<title>([^<]+)<\/title>/g)].slice(1, 4);
    const summaries = [...xml.matchAll(/<summary>([^<]+)<\/summary>/g)].slice(0, 3);
    titles.forEach((t, i) => {
      events.push({
        source: "arXiv (latest preprint)",
        category: "science",
        headline: t[1].trim().slice(0, 200),
        summary: summaries[i] ? summaries[i][1].trim().slice(0, 200) : "New research paper submitted today",
        fetchedAt: new Date(),
      });
    });
  }
  return events;
}

// ─── Source 6: HackerNews Top Stories ────────────────────────────────────────
async function fetchHackerNews(): Promise<CurrentEvent[]> {
  const topIds = await safeJson("https://hacker-news.firebaseio.com/v0/topstories.json");
  if (!Array.isArray(topIds)) { setSourceStatus("hackernews", false); return []; }
  setSourceStatus("hackernews", true);

  const events: CurrentEvent[] = [];
  for (const id of topIds.slice(0, 5)) {
    const item = await safeJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
    if (!item?.title || !item?.score || item.score < 100) continue;
    events.push({
      source: "Hacker News",
      category: "tech",
      headline: item.title.slice(0, 200),
      summary: `Score: ${item.score} | Comments: ${item.descendants || 0}`,
      url: item.url,
      fetchedAt: new Date(),
    });
  }
  return events;
}

// ─── Source 7: RSS World News (BBC, AP, Reuters public feeds) ────────────────
async function fetchRssFeeds(): Promise<CurrentEvent[]> {
  const feeds = [
    { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml", cat: "world" },
    { name: "AP News Top", url: "https://feeds.apnews.com/rss/apf-topnews", cat: "world" },
    { name: "UN News",  url: "https://news.un.org/feed/subscribe/en/news/all/rss.xml", cat: "world" },
    { name: "Reuters Science", url: "https://feeds.reuters.com/reuters/scienceNews", cat: "science" },
    { name: "BBC Tech", url: "https://feeds.bbci.co.uk/news/technology/rss.xml", cat: "tech" },
  ] as const;

  const events: CurrentEvent[] = [];
  for (const feed of feeds) {
    const xml = await safeText(feed.url);
    if (!xml) { setSourceStatus(feed.name, false); continue; }
    setSourceStatus(feed.name, true);
    const titles = [...xml.matchAll(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>|<title>([^<]+)<\/title>/g)].slice(1, 4);
    const descs = [...xml.matchAll(/<description><!\[CDATA\[([^\]]+)\]\]><\/description>|<description>([^<]+)<\/description>/g)].slice(1, 4);
    titles.forEach((t, i) => {
      const headline = (t[1] || t[2] || "").trim().slice(0, 200);
      if (!headline || headline.length < 10) return;
      events.push({
        source: feed.name,
        category: feed.cat,
        headline,
        summary: descs[i] ? stripHtml(descs[i][1] || descs[i][2] || "").slice(0, 200) : "",
        fetchedAt: new Date(),
      });
    });
  }
  return events;
}

// ─── Source 8: PubMed Latest — Medical Research ──────────────────────────────
async function fetchPubMedLatest(): Promise<CurrentEvent[]> {
  const xml = await safeText(
    "https://pubmed.ncbi.nlm.nih.gov/rss/search/1M-6c3c6I9I3c_JJCGAbEqJxmK4htQ-i5kJMZ8FHpL_I1XeHl/?limit=5&utm_campaign=pubmed-2&fc=20200427100427"
  );
  if (!xml) {
    // Fallback: try eutils
    const data = await safeJson(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=COVID+OR+cancer+OR+AI&sort=pub+date&retmax=5&retmode=json"
    );
    if (!data?.esearchresult?.idlist) { setSourceStatus("pubmed", false); return []; }
    setSourceStatus("pubmed", true);
    return data.esearchresult.idlist.slice(0, 3).map((id: string) => ({
      source: "PubMed Research",
      category: "health" as const,
      headline: `New research published (PMID: ${id})`,
      summary: "Latest biomedical research — full details available at PubMed",
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      fetchedAt: new Date(),
    }));
  }
  setSourceStatus("pubmed", true);
  const titles = [...xml.matchAll(/<title>([^<]+)<\/title>/g)].slice(1, 4);
  return titles.map(t => ({
    source: "PubMed (medical research)",
    category: "health" as const,
    headline: t[1].trim().slice(0, 200),
    summary: "Latest peer-reviewed medical research",
    fetchedAt: new Date(),
  }));
}

// ─── Build world state snapshot for chat injection ────────────────────────────
function buildWorldStateSnapshot(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

  const byCategory = new Map<string, CurrentEvent[]>();
  for (const e of currentEvents.slice(0, 60)) {
    if (!byCategory.has(e.category)) byCategory.set(e.category, []);
    byCategory.get(e.category)!.push(e);
  }

  const lines: string[] = [
    `TODAY'S DATE: ${dateStr} at ${timeStr} UTC`,
    `CURRENT US PRESIDENT: Donald J. Trump (inaugurated January 20, 2025 — 47th President of the United States)`,
    `CURRENT WORLD EVENTS (live-fetched from Reddit, BBC, AP, UN, GDELT, CourtListener, arXiv, HackerNews):`,
    "",
  ];

  for (const [cat, events] of byCategory.entries()) {
    lines.push(`[${cat.toUpperCase()}]`);
    for (const e of events.slice(0, 3)) {
      lines.push(`  • ${e.headline} (${e.source})`);
      if (e.summary && e.summary !== e.headline) lines.push(`    ${e.summary.slice(0, 150)}`);
    }
    lines.push("");
  }

  lines.push("INSTRUCTION: You have LIVE current events data above. USE IT to give accurate, up-to-date answers. Never claim outdated information. Today is " + dateStr + ".");

  return lines.join("\n");
}

// ─── Master refresh cycle ─────────────────────────────────────────────────────
async function refreshCurrentEvents() {
  console.log("[current-events] 🌍 Refreshing world intelligence from 8 live sources...");

  const [reddit, wiki, courts, gdelt, arxiv, hn, rss, pubmed] = await Promise.allSettled([
    fetchReddit(),
    fetchWikipediaCurrentEvents(),
    fetchCourtListener(),
    fetchGDELT(),
    fetchArXivLatest(),
    fetchHackerNews(),
    fetchRssFeeds(),
    fetchPubMedLatest(),
  ]);

  const allEvents: CurrentEvent[] = [];
  for (const result of [reddit, wiki, courts, gdelt, arxiv, hn, rss, pubmed]) {
    if (result.status === "fulfilled") allEvents.push(...result.value);
  }

  // Deduplicate by headline similarity
  const seen = new Set<string>();
  currentEvents = allEvents.filter(e => {
    const key = e.headline.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  totalFetched += currentEvents.length;
  lastRefresh = new Date();
  worldStateSnapshot = buildWorldStateSnapshot();

  console.log(`[current-events] ✅ ${currentEvents.length} current events loaded | Sources: Reddit, Wikipedia, CourtListener, GDELT, arXiv, HN, BBC/AP/UN, PubMed`);

  // Persist summary to DB for hive memory
  try {
    await pool.query(`
      INSERT INTO hive_memory (key, domain, content, confidence, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (key) DO UPDATE SET content = EXCLUDED.content, created_at = NOW()
    `, [
      "current_world_state",
      "current_events",
      worldStateSnapshot.slice(0, 4000),
      0.99,
    ]);
  } catch {}
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export function getCurrentWorldContext(): string {
  if (!worldStateSnapshot) {
    // Immediate fallback with just date + known facts
    const now = new Date();
    return `TODAY'S DATE: ${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
CURRENT US PRESIDENT: Donald J. Trump (47th President, inaugurated January 20, 2025)
NOTE: Live world events are being loaded. Respond with today's date when asked about current events.`;
  }
  return worldStateSnapshot;
}

export function getCurrentEvents(): CurrentEvent[] { return currentEvents; }
export function getLastRefresh(): Date | null { return lastRefresh; }

export function getCurrentEventsStatus() {
  return {
    totalEvents: currentEvents.length,
    totalFetched,
    lastRefresh: lastRefresh?.toISOString() ?? null,
    sources: sourceStatus,
    categories: Object.fromEntries(
      ["politics","science","tech","law","world","health","conflict","economy"].map(cat => [
        cat,
        currentEvents.filter(e => e.category === cat).length,
      ])
    ),
  };
}

// ─── Start engine ─────────────────────────────────────────────────────────────
export function startCurrentEventsEngine() {
  console.log("[current-events] 🌍 CURRENT EVENTS ENGINE ONLINE");
  console.log("[current-events]    Reddit · Wikipedia · CourtListener · GDELT · arXiv · HackerNews · BBC/AP/UN · PubMed");
  console.log("[current-events]    Refreshing every 15 minutes — injected into every chat response");

  // First fetch immediately on startup (after 5s grace)
  setTimeout(() => refreshCurrentEvents().catch(() => {}), 5_000);

  // Then every 15 minutes
  setInterval(() => refreshCurrentEvents().catch(() => {}), 15 * 60 * 1000);
}
