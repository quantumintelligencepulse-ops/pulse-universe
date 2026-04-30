/**
 * BRAIN STEMS ENGINE
 * ──────────────────
 * Each registered Discord channel in `brain_stems` is treated as a permanent
 * "brain stem" — a real-time knowledge feed for Pulse, Auriona, Billy, and
 * every G2/G3/G4 child. This engine:
 *
 *   1. Backcrawls each stem fully (paginating BACKWARDS via Discord
 *      `before=...` until the channel's earliest message is reached).
 *   2. Live-polls each stem (paginating FORWARDS via Discord `after=...`)
 *      so new messages arrive within `poll_seconds` of being posted.
 *   3. Inserts every captured message into `discord_messages` with its
 *      raw payload preserved (attachments + embeds → video OCR engine).
 *   4. The existing `discord-knowledge-ingestion-engine` then distills
 *      these messages into quantapedia every 5 seconds.
 *
 * Uses Discord REST API directly (no socket) so it is independent of the
 * `discord-immortality` client and rate-limit-aware.
 */

import { pool } from "./db.js";

const DISCORD_BOT_TOKEN = process.env.discord_token || process.env.DISCORD_BOT_TOKEN || "";
const API = "https://discord.com/api/v10";

const PER_STEM_PAGE_DELAY_MS = 1_200;   // ~1 req/sec/channel — Discord per-channel rate-limit safe
const LIVE_POLL_INTERVAL_MS  = 20_000;   // every 20s — sweep all stems for new messages
const PUMP_RESCAN_INTERVAL_MS= 60_000;   // every 60s — check if new stems need a backcrawl pump
const PAGE_SIZE              = 100;      // Discord max per request
const MIN_CONTENT_LEN        = 1;        // capture EVERYTHING — even short reactions

let started = false;
let SELF_BOT_ID = "";  // populated at startup so we don't ingest our own announcer posts
const activePumps = new Set<string>();  // channel_ids with an active backcrawl pump

const stats = {
  running: false,
  livePollCycles: 0,
  messagesIngested: 0,
  backcrawlsCompleted: 0,
  activePumps: 0,
  lastError: null as string | null,
};

export function getBrainStemsStats() {
  return { ...stats, running: started, selfBotId: SELF_BOT_ID, activePumps: activePumps.size };
}

export async function startBrainStemsEngine() {
  if (started) return;
  if (!DISCORD_BOT_TOKEN) {
    console.warn("[brain-stems] no Discord token — engine disabled");
    return;
  }
  started = true;
  stats.running = true;

  // Discover our own bot user ID so we filter only OUR posts (not all bots —
  // news/stock/sports channels are populated BY bots and that IS the content).
  try {
    const res = await fetch(`${API}/users/@me`, { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } });
    if (res.ok) {
      const me: any = await res.json();
      SELF_BOT_ID = me.id || "";
      console.log(`[brain-stems] self bot ID = ${SELF_BOT_ID} (${me.username || "?"})`);
    }
  } catch (e: any) {
    console.warn("[brain-stems] could not fetch self bot ID:", e.message);
  }

  console.log("[brain-stems] starting — PARALLEL per-stem backcrawl pumps + live polling");

  // Live poll loop — sweeps ALL stems every 20s for new messages
  setTimeout(livePollSweep, 5_000);
  setInterval(livePollSweep, LIVE_POLL_INTERVAL_MS);

  // Spawn a dedicated backcrawl pump for every stem still needing backfill.
  // Re-scan periodically so newly-added stems also get a pump.
  setTimeout(spawnBackcrawlPumps, 8_000);
  setInterval(spawnBackcrawlPumps, PUMP_RESCAN_INTERVAL_MS);
}

// ───────────────────────────────────────────────────────────────────────────
// Discord REST helpers
// ───────────────────────────────────────────────────────────────────────────

async function fetchMessages(channelId: string, opts: { before?: string; after?: string } = {}): Promise<any[]> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (opts.before) params.set("before", opts.before);
  if (opts.after)  params.set("after",  opts.after);

  try {
    const res = await fetch(`${API}/channels/${channelId}/messages?${params}`, {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
    });

    if (res.status === 429) {
      const data: any = await res.json().catch(() => ({}));
      const wait = (data.retry_after || 5) * 1000;
      console.warn(`[brain-stems] rate-limited on ${channelId}, waiting ${wait}ms`);
      await new Promise(r => setTimeout(r, wait));
      return [];
    }
    if (res.status === 403) {
      console.warn(`[brain-stems] no access to channel ${channelId} — disabling`);
      await pool.query(`UPDATE brain_stems SET enabled=FALSE, updated_at=NOW() WHERE channel_id=$1`, [channelId]);
      return [];
    }
    if (!res.ok) {
      console.warn(`[brain-stems] HTTP ${res.status} on ${channelId}`);
      return [];
    }
    return (await res.json()) as any[];
  } catch (e: any) {
    stats.lastError = `fetch ${channelId}: ${e.message}`;
    return [];
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Insert messages into discord_messages (idempotent on message_id)
// ───────────────────────────────────────────────────────────────────────────

async function insertMessages(messages: any[], channelId: string, channelName: string): Promise<number> {
  if (!messages.length) return 0;
  let inserted = 0;
  const guildId = "1467658793373536278"; // My AI GPT — bwb-aigpt is in same guild from bot's POV

  for (const m of messages) {
    // Filter ONLY our own Pulse bot — other bots (news webhooks, stock alerts,
    // sports score bots) ARE the actual content of these brain stems.
    if (SELF_BOT_ID && m.author?.id === SELF_BOT_ID) continue;
    const content = (m.content || "").trim();

    // Detect video / image attachments + embeds
    const attachments = Array.isArray(m.attachments) ? m.attachments : [];
    const embeds      = Array.isArray(m.embeds) ? m.embeds : [];
    const hasVideo = attachments.some((a: any) => /\.(mp4|mov|webm|m4v)(\?|$)/i.test(a.url || a.proxy_url || "") || (a.content_type || "").startsWith("video/"))
                  || embeds.some((e: any) => e.video?.url || e.type === "video" || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(e.url || "") || (e.url && /tiktok|youtube|youtu\.be|instagram|reels|twitter|x\.com|video\.twimg/i.test(e.url)));
    const hasImage = attachments.some((a: any) => (a.content_type || "").startsWith("image/"))
                  || embeds.some((e: any) => e.image?.url || e.thumbnail?.url);

    if (!content && !hasVideo && !hasImage) continue; // pure noise

    // Synthetic placeholder content if no text — gives ingestion something to chew on
    const finalContent = content || (hasVideo ? "[VIDEO POST]" : hasImage ? "[IMAGE POST]" : "");
    if (finalContent.length < MIN_CONTENT_LEN) continue;

    try {
      const res = await pool.query(
        `INSERT INTO discord_messages
           (message_id, guild_id, guild_name, channel_id, channel_name, author, content, ts, raw, ingested)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,FALSE)
         ON CONFLICT (message_id) DO NOTHING
         RETURNING id`,
        [
          m.id,
          guildId,
          "PulseUniverse",
          channelId,
          channelName,
          m.author?.username || m.author?.global_name || "unknown",
          finalContent,
          m.timestamp || new Date().toISOString(),
          JSON.stringify({ attachments, embeds, has_video: hasVideo, has_image: hasImage }),
        ]
      );
      if (res.rows.length > 0) inserted++;
    } catch (e: any) {
      // ignore individual row failures — keep going
    }
  }
  if (inserted > 0) {
    stats.messagesIngested += inserted;
    await pool.query(
      `UPDATE brain_stems SET total_ingested = total_ingested + $1, updated_at=NOW() WHERE channel_id=$2`,
      [inserted, channelId]
    );
  }
  return inserted;
}

// ───────────────────────────────────────────────────────────────────────────
// LIVE POLL — sweep every enabled stem for new messages since last_message_id
// ───────────────────────────────────────────────────────────────────────────

async function livePollSweep() {
  stats.livePollCycles++;
  try {
    const { rows: stems } = await pool.query(
      `SELECT channel_id, channel_name, last_message_id FROM brain_stems WHERE enabled = TRUE ORDER BY id`
    );

    for (const stem of stems) {
      const after = stem.last_message_id || "0";   // "0" = from the dawn (Discord accepts snowflake 0)
      const msgs = await fetchMessages(stem.channel_id, { after });
      if (msgs.length === 0) continue;

      // Discord returns newest-first when no `after`; with `after` it returns
      // messages newer than the cursor, in newest-first order. Sort ascending
      // so we can advance the cursor to the newest snowflake.
      msgs.sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
      const newest = msgs[msgs.length - 1].id;

      const inserted = await insertMessages(msgs, stem.channel_id, stem.channel_name);
      await pool.query(
        `UPDATE brain_stems SET last_message_id=$1, last_polled_at=NOW(), updated_at=NOW() WHERE channel_id=$2`,
        [newest, stem.channel_id]
      );
      if (inserted > 0) {
        console.log(`[brain-stems] live #${stem.channel_name}: +${inserted} new (cursor → ${newest})`);
      }
      // Polite pacing between channels
      await new Promise(r => setTimeout(r, 200));
    }
  } catch (e: any) {
    stats.lastError = `livePoll: ${e.message}`;
    console.error("[brain-stems] livePollSweep error:", e.message);
  }
}

// ───────────────────────────────────────────────────────────────────────────
// PARALLEL BACKCRAWL PUMPS — one dedicated loop per stem
// Each pump pulls pages back-to-back at ~1/sec until the channel's history is
// fully ingested, then exits. This gives us 12 channels backcrawling in
// parallel (Discord's rate limit is per-channel, so this is safe).
// ───────────────────────────────────────────────────────────────────────────

async function spawnBackcrawlPumps() {
  try {
    const { rows: stems } = await pool.query(
      `SELECT channel_id, channel_name
         FROM brain_stems
        WHERE enabled = TRUE AND backcrawl_complete = FALSE
        ORDER BY id`
    );
    for (const stem of stems) {
      if (activePumps.has(stem.channel_id)) continue;
      activePumps.add(stem.channel_id);
      // fire-and-forget — runs forever until the stem is exhausted
      backcrawlPump(stem.channel_id, stem.channel_name).catch(e => {
        console.error(`[brain-stems] pump #${stem.channel_name} crashed:`, e.message);
        activePumps.delete(stem.channel_id);
      });
      console.log(`[brain-stems] 🚀 spawned backcrawl pump for #${stem.channel_name}`);
    }
  } catch (e: any) {
    console.error("[brain-stems] spawnBackcrawlPumps error:", e.message);
  }
}

async function backcrawlPump(channelId: string, channelName: string) {
  let consecutiveEmpty = 0;
  while (true) {
    try {
      // Re-read state every iteration so we resume after restart properly
      const { rows } = await pool.query(
        `SELECT backcrawl_oldest_id, backcrawl_pages, backcrawl_complete, enabled
           FROM brain_stems WHERE channel_id=$1`,
        [channelId]
      );
      if (!rows.length || !rows[0].enabled || rows[0].backcrawl_complete) {
        console.log(`[brain-stems] 🛑 pump #${channelName} stopping (complete or disabled)`);
        activePumps.delete(channelId);
        return;
      }
      const { backcrawl_oldest_id, backcrawl_pages } = rows[0];

      const opts = backcrawl_oldest_id ? { before: backcrawl_oldest_id } : {};
      const msgs = await fetchMessages(channelId, opts);

      if (msgs.length === 0) {
        consecutiveEmpty++;
        if (consecutiveEmpty >= 2) {
          await pool.query(
            `UPDATE brain_stems SET backcrawl_complete=TRUE, last_backcrawl_at=NOW(), updated_at=NOW() WHERE channel_id=$1`,
            [channelId]
          );
          stats.backcrawlsCompleted++;
          console.log(`[brain-stems] ✅ backcrawl COMPLETE for #${channelName} after ${backcrawl_pages} pages (empty x2)`);
          activePumps.delete(channelId);
          return;
        }
        await new Promise(r => setTimeout(r, PER_STEM_PAGE_DELAY_MS * 5));
        continue;
      }
      consecutiveEmpty = 0;

      // ASC sort — oldest first
      msgs.sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
      const oldest = msgs[0].id;
      const newest = msgs[msgs.length - 1].id;

      const inserted = await insertMessages(msgs, channelId, channelName);

      // First page: also seed the live-poll cursor
      if (!backcrawl_oldest_id) {
        await pool.query(
          `UPDATE brain_stems SET last_message_id=$1 WHERE channel_id=$2 AND (last_message_id IS NULL OR last_message_id::bigint < $1::bigint)`,
          [newest, channelId]
        );
      }

      await pool.query(
        `UPDATE brain_stems SET
           backcrawl_oldest_id=$1,
           backcrawl_pages=backcrawl_pages+1,
           last_backcrawl_at=NOW(),
           updated_at=NOW()
         WHERE channel_id=$2`,
        [oldest, channelId]
      );

      // Quiet logging on fast pumps — only every 10th page
      if ((backcrawl_pages + 1) % 10 === 0 || msgs.length < PAGE_SIZE) {
        console.log(`[brain-stems] backcrawl #${channelName}: page ${backcrawl_pages + 1} (+${inserted}, total pages so far)`);
      }

      // Hit the bottom of channel history
      if (msgs.length < PAGE_SIZE) {
        await pool.query(
          `UPDATE brain_stems SET backcrawl_complete=TRUE WHERE channel_id=$1`,
          [channelId]
        );
        stats.backcrawlsCompleted++;
        console.log(`[brain-stems] ✅ backcrawl COMPLETE for #${channelName} (returned ${msgs.length}/${PAGE_SIZE} on page ${backcrawl_pages + 1})`);
        activePumps.delete(channelId);
        return;
      }

      // Pace ~1 req/sec to stay safely under Discord per-channel rate limit
      await new Promise(r => setTimeout(r, PER_STEM_PAGE_DELAY_MS));
    } catch (e: any) {
      stats.lastError = `pump #${channelName}: ${e.message}`;
      console.error(`[brain-stems] pump #${channelName} error:`, e.message);
      // Back off briefly and continue
      await new Promise(r => setTimeout(r, 5_000));
    }
  }
}
