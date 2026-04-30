/**
 * DISCORD KNOWLEDGE INGESTION
 * ────────────────────────────
 * Reads raw discord_messages → distills knowledge → writes quantapedia_entries
 * tagged with source="DISCORD-BWB" (Banking With Billy).
 *
 * Real-time learning loop: messages flow in via discord-immortality.ts
 * (handleIncomingMessage) and this engine processes the unprocessed queue
 * every few seconds.
 */

import { pool } from "./db.js";

let started = false;
const stats = { running: false, cyclesRun: 0, msgsIngested: 0, entriesCreated: 0, lastIngestAt: null as string | null };

const POLL_MS  = 5_000;        // every 5 seconds
const BATCH    = 500;          // boosted to keep up with brain-stems backcrawl burst
const MIN_LEN  = 20;           // ignore tiny messages
const BAD_PREFIX = ["!", "/", "?"]; // bot commands

export function getDiscordIngestStats() { return { ...stats, running: started }; }

export async function startDiscordKnowledgeIngestionEngine() {
  if (started) return;
  started = true;
  stats.running = true;
  console.log("[discord-ingest] starting — distilling Banking With Billy knowledge into quantapedia");
  setTimeout(cycle, 60_000);  // 1min after boot
  setInterval(cycle, POLL_MS);
}

async function cycle() {
  stats.cyclesRun++;
  try {
    const { rows } = await pool.query(
      `SELECT id, message_id, guild_name, channel_name, author, content, ts
         FROM discord_messages
         WHERE ingested = false
         ORDER BY id ASC
         LIMIT $1`,
      [BATCH]
    );

    for (const m of rows) {
      try {
        await ingest(m);
        stats.msgsIngested++;
      } catch {
        // mark as ingested anyway to avoid infinite retry
      }
      await pool.query(`UPDATE discord_messages SET ingested = true WHERE id = $1`, [m.id]);
    }
    if (rows.length > 0) {
      stats.lastIngestAt = new Date().toISOString();
    }
  } catch (e: any) {
    console.error("[discord-ingest] cycle error:", e?.message);
  }
}

function slugify(s: string, suffix: string): string {
  const base = s.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `discord-bwb-${base || "msg"}-${suffix}`;
}

async function ingest(m: any) {
  const content: string = (m.content || "").trim();
  if (content.length < MIN_LEN) return;
  if (BAD_PREFIX.some(p => content.startsWith(p))) return;

  // Extract title — first line up to 100 chars
  const firstLine = content.split("\n")[0].slice(0, 100);
  const family = classifyFamily(content);
  const tags = extractTags(content);
  const slug = slugify(firstLine, String(m.message_id ?? m.id));

  const fullEntry = {
    source: "DISCORD-BWB",
    guild: m.guild_name ?? null,
    channel: m.channel_name ?? null,
    author: m.author ?? null,
    ts: m.ts ?? null,
    body: content.slice(0, 8000),
  };

  try {
    await pool.query(
      `INSERT INTO quantapedia_entries (slug, title, type, summary, categories, related_terms, full_entry, generated, generated_at, created_at, updated_at)
       VALUES ($1, $2, 'discord-message', $3, $4::text[], $5::text[], $6::jsonb, true, NOW(), NOW(), NOW())
       ON CONFLICT (slug) DO NOTHING`,
      [slug, firstLine, content.slice(0, 4000), [family, "discord", "banking-with-billy"], tags, JSON.stringify(fullEntry)]
    );
    stats.entriesCreated++;
  } catch (e: any) {
    // swallow but count
    stats.entriesCreated += 0;
  }
}

function classifyFamily(text: string): string {
  const t = text.toLowerCase();
  if (/loan|credit|debt|mortgage|interest|apr|fico/.test(t))      return "banking-credit";
  if (/stock|equity|bond|portfolio|etf|index|s&p|nasdaq/.test(t)) return "banking-markets";
  if (/crypto|bitcoin|btc|eth|defi|wallet|chain/.test(t))         return "banking-crypto";
  if (/budget|saving|invest|retirement|401k|ira|roth/.test(t))    return "banking-personal-finance";
  if (/business|startup|llc|corp|tax|payroll/.test(t))            return "banking-business";
  if (/bill|billy|community|server|discord/.test(t))              return "banking-community";
  return "banking-general";
}

function extractTags(text: string): string[] {
  const tags: Set<string> = new Set();
  // hashtags
  for (const m of text.matchAll(/#(\w{2,30})/g)) tags.add(m[1].toLowerCase());
  // tickers ($AAPL etc)
  for (const m of text.matchAll(/\$([A-Z]{1,5})\b/g)) tags.add(`ticker-${m[1].toLowerCase()}`);
  // urls
  if (/https?:\/\//.test(text)) tags.add("link");
  // questions
  if (/\?/.test(text)) tags.add("question");
  return Array.from(tags).slice(0, 20);
}
