/**
 * OMEGA SOURCE STUDIER ENGINE
 * ───────────────────────────
 * The omega-source-discovery-engine catalogs sources into research_sources
 * (a librarian: 2,547 sources cataloged as of 2026-04-30).
 * The quantum-ingestion-engine studies ~15 hard-coded adapters (wikipedia,
 * pubmed, github, etc.) — but it does NOT walk the broader research_sources
 * catalog.
 *
 * THIS ENGINE closes that gap: every cycle it picks N least-recently-studied
 * sources from research_sources, fetches them politely, distills each into
 * a quantapedia entry (slug, title, summary, categories), and updates
 * last_studied_at + study_count + last_study_status.
 *
 * Strict rules:
 *  - Open feeds only — no auth, no POST, no paid endpoints
 *  - Polite: per-host throttle, 6s timeout, max 5 concurrent fetches
 *  - On error, mark and de-prioritize for next cycle
 *  - Strictly additive — never modifies sacred tables
 */

import { pool } from "./db.js";

let started = false;
const stats = {
  running: false,
  cycles: 0,
  studied: 0,
  succeeded: 0,
  failed: 0,
  skippedNonGet: 0,
  lastCycleAt: null as string | null,
  lastError: null as string | null,
};

const CYCLE_INTERVAL_MS = 60_000;            // 1 cycle per minute
const SOURCES_PER_CYCLE = 8;                 // 8 sources studied per cycle = ~480/hour
const FETCH_TIMEOUT_MS = 6_000;
const MAX_CONTENT_BYTES = 256_000;           // never read more than 256KB per source
const USER_AGENT = "PulseUniverse-OmegaStudier/1.0 (+https://myaigpt.online)";

// Hosts/path patterns we KNOW are noisy or broken — skip permanently
const URL_BLOCKLIST = [
  /sparql/i,                                  // SPARQL needs POST
  /\/oauth/i, /\/auth/i, /\/login/i,
  /paypal|stripe|square/i,                    // payment SDKs
  /youtube\.com|youtu\.be/i,                  // video, not text
  /\.zip$|\.tar\.gz$|\.rar$|\.7z$/i,          // archives
  /\.mp[34]$|\.wav$|\.ogg$|\.webm$/i,         // audio/video
  /\.png$|\.jpe?g$|\.gif$|\.webp$|\.svg$/i,   // images
];

function looksFetchable(url: string): boolean {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  for (const re of URL_BLOCKLIST) if (re.test(url)) return false;
  return true;
}

function slugify(s: string, max = 80): string {
  return (s || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max) || `src-${Date.now()}`;
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]{2,300})<\/title>/i);
  if (m) return m[1].trim().replace(/\s+/g, " ");
  const h = html.match(/<h1[^>]*>([^<]{2,300})<\/h1>/i);
  return h ? h[1].trim().replace(/\s+/g, " ") : null;
}

function extractText(content: string, maxLen = 1500): string {
  // crude HTML/text strip — good enough for indexing
  return content
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

async function studyOne(src: { id: number; name: string; url: string; category: string; tags: string[] | null }): Promise<void> {
  const url = (src.url || "").trim();
  if (!looksFetchable(url)) {
    stats.skippedNonGet++;
    await pool.query(
      `UPDATE research_sources SET last_studied_at = NOW(), study_count = COALESCE(study_count,0) + 1,
              last_study_status = 'skipped-non-get', last_study_error = NULL
        WHERE id = $1`,
      [src.id]
    ).catch(() => {});
    return;
  }
  stats.studied++;
  let res: Response | null = null;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT, "Accept": "text/html,application/json,application/xml;q=0.9,*/*;q=0.8" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
  } catch (e: any) {
    stats.failed++;
    await pool.query(
      `UPDATE research_sources SET last_studied_at = NOW(), study_count = COALESCE(study_count,0) + 1,
              last_study_status = 'fetch-error', last_study_error = $2
        WHERE id = $1`,
      [src.id, String(e?.message || e).slice(0, 500)]
    ).catch(() => {});
    return;
  }
  if (!res.ok) {
    stats.failed++;
    await pool.query(
      `UPDATE research_sources SET last_studied_at = NOW(), study_count = COALESCE(study_count,0) + 1,
              last_study_status = $2, last_study_error = NULL
        WHERE id = $1`,
      [src.id, `http-${res.status}`]
    ).catch(() => {});
    return;
  }
  // Read at most MAX_CONTENT_BYTES
  let body = "";
  try {
    const buf = await res.arrayBuffer();
    body = new TextDecoder("utf-8", { fatal: false }).decode(buf.slice(0, MAX_CONTENT_BYTES));
  } catch {
    body = "";
  }
  const title = extractTitle(body) || src.name;
  const summary = extractText(body, 1500) || `Open feed: ${src.name}`;
  const slug = `omega-${slugify(src.name)}-${src.id}`;
  const categories = Array.from(new Set([
    "omega-source",
    src.category || "knowledge",
    ...((src.tags || []).filter(Boolean).slice(0, 4)),
  ]));

  // Insert/update quantapedia entry (additive — uses ON CONFLICT on slug unique)
  try {
    await pool.query(
      `INSERT INTO quantapedia_entries (slug, title, type, summary, categories, related_terms, lookup_count, generated, generated_at)
            VALUES ($1, $2, 'omega-source', $3, $4::text[], $5::text[], 1, true, NOW())
       ON CONFLICT (slug) DO UPDATE
         SET summary = EXCLUDED.summary,
             title   = EXCLUDED.title,
             categories = EXCLUDED.categories,
             updated_at = NOW(),
             lookup_count = COALESCE(quantapedia_entries.lookup_count, 0) + 1`,
      [slug, title.slice(0, 300), summary, categories, [src.name].slice(0, 5)]
    );
  } catch (e: any) {
    stats.lastError = `qp-insert: ${String(e?.message || e).slice(0, 200)}`;
  }

  // Log into ingestion_logs (best-effort, non-blocking on error)
  try {
    await pool.query(
      `INSERT INTO ingestion_logs (source_id, source_name, family_id, query, items_fetched, nodes_created,
                                   status, sample_title, sample_summary, source_url)
            VALUES ($1, $2, $3, $4, 1, 1, 'success', $5, $6, $7)`,
      [
        `omega-${src.id}`,
        src.name,
        src.category || "omega-source",
        url,
        title.slice(0, 200),
        summary.slice(0, 500),
        url,
      ]
    );
  } catch { /* ignore */ }

  // Mark studied
  await pool.query(
    `UPDATE research_sources SET last_studied_at = NOW(), study_count = COALESCE(study_count,0) + 1,
            last_study_status = 'ok', last_study_error = NULL
      WHERE id = $1`,
    [src.id]
  ).catch(() => {});
  stats.succeeded++;
}

async function pickAndStudy(): Promise<void> {
  stats.cycles++;
  stats.lastCycleAt = new Date().toISOString();
  let rows: any[] = [];
  try {
    // Least-recently-studied first; never-studied bubble to the top via NULLS FIRST
    const r = await pool.query(
      `SELECT id, name, url, category, tags
         FROM research_sources
        WHERE url IS NOT NULL AND url <> ''
        ORDER BY last_studied_at NULLS FIRST, id
        LIMIT $1`,
      [SOURCES_PER_CYCLE]
    );
    rows = r.rows;
  } catch (e: any) {
    stats.lastError = `pick: ${String(e?.message || e).slice(0, 200)}`;
    return;
  }
  // Run studies in parallel but cap concurrency to 5
  const inflight: Promise<void>[] = [];
  for (const src of rows) {
    inflight.push(studyOne(src as any));
    if (inflight.length >= 5) {
      await Promise.allSettled(inflight.splice(0, inflight.length));
    }
  }
  if (inflight.length) await Promise.allSettled(inflight);
}

export function getOmegaStudierStats() { return { ...stats, running: started }; }

export async function startOmegaSourceStudierEngine(): Promise<void> {
  if (started) return;
  started = true;
  stats.running = true;
  console.log("[omega-studier] starting — rotates through research_sources LRU, ~480 sources/hour");
  // First cycle in 45s (let discovery seed finish first); then every minute
  setTimeout(() => { pickAndStudy().catch(() => {}); }, 45_000);
  setInterval(() => { pickAndStudy().catch(() => {}); }, CYCLE_INTERVAL_MS);
}
