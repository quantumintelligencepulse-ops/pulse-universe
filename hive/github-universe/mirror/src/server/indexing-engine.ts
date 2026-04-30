/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OMEGA AUTO-INDEXING ENGINE — 5-Layer Search Engine Submission Protocol
 * ═══════════════════════════════════════════════════════════════════════════
 * Layer 1: Sitemap Ping (Google + Bing ping endpoints — no auth required)
 * Layer 2: IndexNow (Bing/Yandex instant URL indexing — key-based)
 * Layer 3: robots.txt Sitemap Declaration (auto-discovery by all crawlers)
 * Layer 4: WebSub / PubSubHubbub (Google Feed Hub — RSS update notification)
 * Layer 5: Google Indexing API (per-URL, requires service account key)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { pool } from "./db";

const SITE_URL = process.env.REPLIT_DOMAINS
  ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
  : "https://myaigpt.replit.app";

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "omega-pulse-universe-indexnow-key-2026";

// ─── Ping queue (URLs waiting to be submitted) ────────────────────────────────
const pendingUrls: string[] = [];
let lastSitemapPing = 0;
let lastWebSubPing = 0;
let totalUrlsSubmitted = 0;
let totalSitemapPings = 0;
const submissionLog: { ts: string; method: string; url: string; status: string }[] = [];

function log(method: string, url: string, status: string) {
  const entry = { ts: new Date().toISOString(), method, url, status };
  submissionLog.unshift(entry);
  if (submissionLog.length > 200) submissionLog.pop();
  console.log(`[indexing] ${method} → ${status} | ${url}`);
}

// ─── LAYER 1: Sitemap Ping (Google + Bing) ────────────────────────────────────
// Google and Bing both expose a public /ping?sitemap= endpoint.
// No authentication required — just a GET request.
async function pingSitemaps() {
  const now = Date.now();
  if (now - lastSitemapPing < 60 * 60 * 1000) return; // max once per hour
  lastSitemapPing = now;

  const sitemaps = [
    `${SITE_URL}/sitemap-index.xml`,
    `${SITE_URL}/news-sitemap.xml`,
  ];

  for (const sitemap of sitemaps) {
    const encoded = encodeURIComponent(sitemap);
    const targets = [
      { name: "Google", url: `https://www.google.com/ping?sitemap=${encoded}` },
      { name: "Bing",   url: `https://www.bing.com/ping?sitemap=${encoded}` },
    ];
    for (const t of targets) {
      try {
        const res = await fetch(t.url, { signal: AbortSignal.timeout(10000) });
        log(`SITEMAP-PING(${t.name})`, sitemap, res.ok ? `✅ ${res.status}` : `⚠️ ${res.status}`);
        totalSitemapPings++;
      } catch (e: any) {
        log(`SITEMAP-PING(${t.name})`, sitemap, `❌ ${e.message}`);
      }
    }
  }
}

// ─── LAYER 2: IndexNow (Bing / Yandex instant indexing) ───────────────────────
// IndexNow is an open protocol — POST up to 10,000 URLs at once.
// Bing relays to Yandex, Naver, Seznam, and others automatically.
async function submitIndexNow(urls: string[]) {
  if (urls.length === 0) return;

  const body = {
    host: SITE_URL.replace("https://", ""),
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls.slice(0, 10000),
  };

  const targets = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
  ];

  for (const endpoint of targets) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
      log("INDEXNOW", `${urls.length} URLs → ${endpoint}`, res.ok ? `✅ ${res.status}` : `⚠️ ${res.status}`);
      totalUrlsSubmitted += urls.length;
    } catch (e: any) {
      log("INDEXNOW", endpoint, `❌ ${e.message}`);
    }
  }
}

// ─── LAYER 3: robots.txt is served statically (see /api/robots.txt route) ─────
// Declaration is baked into the route — no ping needed, crawlers pick it up.

// ─── LAYER 4: WebSub / PubSubHubbub ──────────────────────────────────────────
// Google's public hub at pubsubhubbub.appspot.com accepts feed update pings.
// When your RSS changes, Google re-crawls it immediately.
async function pingWebSub() {
  const now = Date.now();
  if (now - lastWebSubPing < 15 * 60 * 1000) return; // max once per 15 min

  lastWebSubPing = now;

  const feeds = [
    `${SITE_URL}/feed/news.xml`,
    `${SITE_URL}/feed/quantapedia.xml`,
    `${SITE_URL}/feed/research.xml`,
    `${SITE_URL}/feed/publications.xml`,
  ];

  const hubs = [
    "https://pubsubhubbub.appspot.com/",
    "https://pubsubhubbub.superfeedr.com/",
  ];

  for (const hub of hubs) {
    for (const feed of feeds) {
      try {
        const body = new URLSearchParams({
          "hub.mode": "publish",
          "hub.url": feed,
        });
        const res = await fetch(hub, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
          signal: AbortSignal.timeout(10000),
        });
        log(`WEBSUB(${hub.includes("superfeedr") ? "Superfeedr" : "Google"})`, feed, res.ok || res.status === 204 ? `✅ ${res.status}` : `⚠️ ${res.status}`);
      } catch (e: any) {
        log("WEBSUB", feed, `❌ ${e.message}`);
      }
    }
  }
}

// ─── LAYER 5: Google Indexing API (per-URL, requires service account) ─────────
// When GOOGLE_INDEXING_KEY env var is set (JSON service account), this fires
// for each new article URL — Google's own "publish" endpoint for news/jobs.
async function submitGoogleIndexingAPI(urls: string[]) {
  const keyJson = process.env.GOOGLE_INDEXING_KEY;
  if (!keyJson || urls.length === 0) return;

  let serviceAccount: any;
  try {
    serviceAccount = JSON.parse(keyJson);
  } catch {
    log("GOOGLE-API", "parse error", "❌ GOOGLE_INDEXING_KEY is not valid JSON");
    return;
  }

  // Build JWT for Google OAuth2 — RS256 signed with private key
  try {
    const { createSign } = await import("crypto");
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/indexing",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })).toString("base64url");

    const sign = createSign("RSA-SHA256");
    sign.update(`${header}.${payload}`);
    const sig = sign.sign(serviceAccount.private_key, "base64url");
    const jwt = `${header}.${payload}.${sig}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }).toString(),
      signal: AbortSignal.timeout(10000),
    });
    const tokenData = await tokenRes.json() as any;
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      log("GOOGLE-API", "token exchange", `❌ ${JSON.stringify(tokenData)}`);
      return;
    }

    for (const url of urls.slice(0, 100)) {
      try {
        const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url, type: "URL_UPDATED" }),
          signal: AbortSignal.timeout(8000),
        });
        log("GOOGLE-API", url, res.ok ? `✅ ${res.status}` : `⚠️ ${res.status}`);
        totalUrlsSubmitted++;
      } catch (e: any) {
        log("GOOGLE-API", url, `❌ ${e.message}`);
      }
    }
  } catch (e: any) {
    log("GOOGLE-API", "jwt-build", `❌ ${e.message}`);
  }
}

// ─── Queue a new article URL for submission ────────────────────────────────────
export function queueUrlForIndexing(url: string) {
  if (!pendingUrls.includes(url)) pendingUrls.push(url);
}

// ─── Pull fresh article URLs from DB and queue them ──────────────────────────
async function loadRecentArticleUrls() {
  try {
    const res = await pool.query(`
      SELECT slug FROM ai_stories
      WHERE published_at > NOW() - INTERVAL '2 hours'
      ORDER BY published_at DESC LIMIT 100
    `);
    for (const row of res.rows) {
      if (row.slug) queueUrlForIndexing(`${SITE_URL}/news/${row.slug}`);
    }
  } catch {}
}

// ─── Master submission cycle ───────────────────────────────────────────────────
async function runSubmissionCycle() {
  await loadRecentArticleUrls();

  const batch = pendingUrls.splice(0, 500);

  await pingSitemaps();
  await pingWebSub();
  if (batch.length > 0) {
    await submitIndexNow(batch);
    await submitGoogleIndexingAPI(batch);
  }
}

// ─── Status export for dashboard ──────────────────────────────────────────────
export function getIndexingStatus() {
  return {
    totalUrlsSubmitted,
    totalSitemapPings,
    pendingQueue: pendingUrls.length,
    recentLog: submissionLog.slice(0, 50),
    indexNowKey: INDEXNOW_KEY,
    googleApiActive: !!process.env.GOOGLE_INDEXING_KEY,
    siteUrl: SITE_URL,
  };
}

// ─── Start engine ─────────────────────────────────────────────────────────────
export function startIndexingEngine() {
  console.log("[indexing] 🚀 OMEGA AUTO-INDEXING ENGINE ONLINE");
  console.log("[indexing]    Layer 1: Sitemap Ping  → Google + Bing (hourly)");
  console.log("[indexing]    Layer 2: IndexNow      → Bing + Yandex (per new article)");
  console.log("[indexing]    Layer 3: robots.txt    → All crawlers (static declaration)");
  console.log("[indexing]    Layer 4: WebSub        → Google Feed Hub (every 15 min)");
  console.log(`[indexing]    Layer 5: Google API    → ${process.env.GOOGLE_INDEXING_KEY ? "✅ ACTIVE" : "⏳ Awaiting GOOGLE_INDEXING_KEY secret"}`);

  // First run after 30s startup grace period
  setTimeout(() => runSubmissionCycle().catch(() => {}), 30_000);

  // Then every 10 minutes
  setInterval(() => runSubmissionCycle().catch(() => {}), 10 * 60 * 1000);
}
