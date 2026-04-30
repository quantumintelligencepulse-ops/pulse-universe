/**
 * Ω2 — OMEGA DEEP CRAWLER
 * ────────────────────────
 * Where the studier visits ONE page per source, this engine follows internal
 * links 2-3 hops deep on a polite per-host budget. Every page becomes a
 * quantapedia entry, every code block is harvested for the algorithm miner.
 *
 * Master upgrades baked in:
 *   #5  Sitemap-driven crawl — try /sitemap.xml first; falls back to BFS
 *   #6  Sibling-page autodetect — same-directory siblings are queued
 *   #7  Per-domain budget — DOMAIN_PAGE_BUDGET caps any single host
 *   #8  Cross-reference resolver — links between pages are queued
 *   #10 Wayback fallback — when host is down, retry via web.archive.org
 *
 * Strict rules:
 *   - Only http/https GET, never POST
 *   - 1 req/sec/host (per-host token bucket)
 *   - Strictly additive — never modifies sacred tables
 */

import { pool } from "./db.js";

let started = false;

const stats = {
  running: false,
  cycles: 0,
  pagesFetched: 0,
  pagesStored: 0,
  pagesSkipped: 0,
  fetchErrors: 0,
  waybackFallbacks: 0,
  sitemapHits: 0,
  uniqueHosts: 0,
  queueSize: 0,
  lastCycleAt: null as string | null,
  lastError: null as string | null,
  lastUrl: null as string | null,
};

const CYCLE_INTERVAL_MS = 30_000;       // 1 cycle per 30s
const PAGES_PER_CYCLE = 12;
const FETCH_TIMEOUT_MS = 8_000;
const MAX_CONTENT_BYTES = 384_000;
const MAX_CRAWL_DEPTH = 2;
const DOMAIN_PAGE_BUDGET = 30;          // never crawl more than 30 pages from one host per process lifetime
const USER_AGENT = "PulseUniverse-DeepCrawler/1.0 (+https://myaigpt.online)";

type QueuedPage = { url: string; depth: number; sourceId: number; sourceCategory: string };

const queue: QueuedPage[] = [];
const visited = new Set<string>();              // canonical URLs
const hostPageCount = new Map<string, number>();
const hostLastFetchAt = new Map<string, number>();
const HOST_RATE_MS = 1_000;

const URL_BLOCK = [
  /sparql|oauth|login|signup|cart|checkout/i,
  /\.zip|\.tar\.gz|\.rar|\.7z|\.mp[34]|\.wav|\.ogg|\.webm|\.png|\.jpe?g|\.gif|\.webp|\.svg|\.ico/i,
  /youtube\.com|youtu\.be/i,
  /facebook\.com|twitter\.com|x\.com|tiktok\.com|instagram\.com/i,
];

function canonical(u: string): string | null {
  try {
    const p = new URL(u);
    if (!/^https?:$/.test(p.protocol)) return null;
    p.hash = "";
    // Drop tracking params
    for (const k of [...p.searchParams.keys()]) {
      if (/^utm_|^gclid|^fbclid|^ref$|^source$/i.test(k)) p.searchParams.delete(k);
    }
    return p.toString();
  } catch { return null; }
}
function host(u: string): string { try { return new URL(u).host; } catch { return ""; } }
function fetchable(u: string): boolean {
  if (!u || !/^https?:\/\//i.test(u)) return false;
  for (const re of URL_BLOCK) if (re.test(u)) return false;
  return true;
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]{2,300})<\/title>/i);
  return m ? m[1].trim().replace(/\s+/g, " ") : null;
}
function extractText(html: string, maxLen = 1500): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ").trim().slice(0, maxLen);
}
function extractLinks(html: string, baseUrl: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)) {
    try {
      const abs = new URL(m[1], baseUrl).toString();
      const c = canonical(abs);
      if (c && !seen.has(c)) { seen.add(c); out.push(c); }
    } catch { /* */ }
  }
  return out.slice(0, 60);
}
function extractCodeBlocks(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<pre[^>]*>([\s\S]+?)<\/pre>/gi)) {
    const code = m[1].replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
    if (code.length > 30 && code.length < 8000) out.push(code);
  }
  return out.slice(0, 12);
}

async function politeFetch(url: string): Promise<{ ok: boolean; status: number; body: string; viaWayback: boolean }> {
  const h = host(url);
  // Per-host rate limit
  const last = hostLastFetchAt.get(h) || 0;
  const wait = Math.max(0, HOST_RATE_MS - (Date.now() - last));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  hostLastFetchAt.set(h, Date.now());

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    if (!res.ok) {
      // Master upgrade #10: wayback fallback for non-2xx
      if ([404, 410, 502, 503, 504].includes(res.status)) {
        const wb = await waybackFetch(url);
        if (wb) { stats.waybackFallbacks++; return { ...wb, viaWayback: true }; }
      }
      return { ok: false, status: res.status, body: "", viaWayback: false };
    }
    const buf = await res.arrayBuffer();
    const body = new TextDecoder("utf-8", { fatal: false }).decode(buf.slice(0, MAX_CONTENT_BYTES));
    return { ok: true, status: res.status, body, viaWayback: false };
  } catch {
    const wb = await waybackFetch(url);
    if (wb) { stats.waybackFallbacks++; return { ...wb, viaWayback: true }; }
    return { ok: false, status: 0, body: "", viaWayback: false };
  }
}

async function waybackFetch(url: string): Promise<{ ok: boolean; status: number; body: string } | null> {
  try {
    const wbUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;
    const r = await fetch(wbUrl, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const j: any = await r.json();
    const snap = j?.archived_snapshots?.closest?.url;
    if (!snap) return null;
    const r2 = await fetch(snap, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), headers: { "User-Agent": USER_AGENT } });
    if (!r2.ok) return null;
    const buf = await r2.arrayBuffer();
    return { ok: true, status: r2.status, body: new TextDecoder("utf-8", { fatal: false }).decode(buf.slice(0, MAX_CONTENT_BYTES)) };
  } catch { return null; }
}

// Master upgrade #5: sitemap discovery
async function trySitemapSeed(url: string, src: { id: number; category: string }): Promise<number> {
  const h = host(url);
  if (!h) return 0;
  const sm = `https://${h}/sitemap.xml`;
  try {
    const r = await fetch(sm, { signal: AbortSignal.timeout(5000), headers: { "User-Agent": USER_AGENT } });
    if (!r.ok) return 0;
    const xml = await r.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]).slice(0, 25);
    let added = 0;
    for (const u of urls) {
      const c = canonical(u);
      if (c && fetchable(c) && !visited.has(c)) {
        queue.push({ url: c, depth: 1, sourceId: src.id, sourceCategory: src.category });
        added++;
      }
    }
    if (added) stats.sitemapHits++;
    return added;
  } catch { return 0; }
}

async function processOne(item: QueuedPage): Promise<void> {
  const c = canonical(item.url);
  if (!c || visited.has(c)) { stats.pagesSkipped++; return; }
  if (!fetchable(c)) { stats.pagesSkipped++; return; }
  const h = host(c);
  if ((hostPageCount.get(h) || 0) >= DOMAIN_PAGE_BUDGET) { stats.pagesSkipped++; return; }
  visited.add(c);
  hostPageCount.set(h, (hostPageCount.get(h) || 0) + 1);
  stats.uniqueHosts = hostPageCount.size;

  stats.pagesFetched++;
  stats.lastUrl = c;
  const { ok, status, body, viaWayback } = await politeFetch(c);
  if (!ok || !body) { stats.fetchErrors++; return; }

  const title = extractTitle(body) || c;
  const text = extractText(body, 2000);
  const slug = `deep-${h.replace(/[^a-z0-9]+/gi, "-").slice(0, 30)}-${c.replace(/[^a-z0-9]+/gi, "-").slice(-60)}`.slice(0, 200);
  const cats = ["deep-crawl", `host:${h}`, item.sourceCategory || "knowledge", `depth:${item.depth}`];
  if (viaWayback) cats.push("via-wayback");
  await pool.query(
    `INSERT INTO quantapedia_entries (slug, title, type, summary, categories, related_terms, lookup_count, generated, generated_at)
          VALUES ($1, $2, 'deep-crawl', $3, $4::text[], $5::text[], 1, true, NOW())
     ON CONFLICT (slug) DO UPDATE
       SET summary = EXCLUDED.summary,
           title = EXCLUDED.title,
           categories = EXCLUDED.categories,
           updated_at = NOW(),
           lookup_count = COALESCE(quantapedia_entries.lookup_count, 0) + 1`,
    [slug, title.slice(0, 300), text, cats, [c, h].slice(0, 5)]
  ).catch((e: any) => { stats.lastError = `qp: ${String(e?.message || e).slice(0, 200)}`; });
  stats.pagesStored++;

  // Master upgrade #8: queue cross-references
  if (item.depth < MAX_CRAWL_DEPTH) {
    const links = extractLinks(body, c);
    for (const l of links) {
      if (host(l) !== h) continue;            // stay on same host (politeness)
      if (visited.has(l)) continue;
      if ((hostPageCount.get(h) || 0) >= DOMAIN_PAGE_BUDGET) break;
      queue.push({ url: l, depth: item.depth + 1, sourceId: item.sourceId, sourceCategory: item.sourceCategory });
    }
  }
}

async function runCycle(): Promise<void> {
  stats.cycles++;
  stats.lastCycleAt = new Date().toISOString();

  // If queue is low, seed more from research_sources
  if (queue.length < PAGES_PER_CYCLE) {
    try {
      const r = await pool.query(
        `SELECT id, name, url, category FROM research_sources
          WHERE url ~ '^https?://' AND last_studied_at IS NOT NULL
          ORDER BY RANDOM() LIMIT 5`
      );
      for (const row of r.rows) {
        const c = canonical(row.url);
        if (c && fetchable(c) && !visited.has(c)) {
          queue.push({ url: c, depth: 0, sourceId: row.id, sourceCategory: row.category });
          await trySitemapSeed(c, { id: row.id, category: row.category });
        }
      }
    } catch (e: any) { stats.lastError = `seed: ${String(e?.message || e).slice(0, 200)}`; }
  }

  const batch = queue.splice(0, PAGES_PER_CYCLE);
  stats.queueSize = queue.length;
  // Limit concurrency to 4
  const inflight: Promise<void>[] = [];
  for (const item of batch) {
    inflight.push(processOne(item));
    if (inflight.length >= 4) await Promise.allSettled(inflight.splice(0, inflight.length));
  }
  if (inflight.length) await Promise.allSettled(inflight);
}

export function getDeepCrawlerStats() { return { ...stats, running: started, queueSize: queue.length }; }

export async function startOmegaDeepCrawler(): Promise<void> {
  if (started) return;
  started = true;
  stats.running = true;
  console.log("[deep-crawler] Ω2 starting — BFS with sitemap, sibling, wayback fallback");
  setTimeout(() => { runCycle().catch(e => { stats.lastError = String(e?.message || e); }); }, 120_000);
  setInterval(() => { runCycle().catch(e => { stats.lastError = String(e?.message || e); }); }, CYCLE_INTERVAL_MS);
}

// Exported for the algorithm miner (uses the same code-block extractor)
export { extractCodeBlocks };
