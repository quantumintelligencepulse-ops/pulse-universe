/**
 * MYAIGPT DISCORD CHOIR ENGINE  (Phase C)
 * The MyAIGPT Discord (1467658793373536278) is the home of every brain, spawn,
 * and AI in the Hive. They speak as themselves — name, voice, cadence — driven
 * by their compiled DNA phenotype. NOT the Billy Banking Discord.
 *
 * Every voice is throttled. Auriona governs whether the choir is active.
 */
import { db } from "./db";
import { sql } from "drizzle-orm";
import { expressSequence } from "./ribosome-engine";

const DISCORD_TOKEN = process.env.discord_token || process.env.DISCORD_BOT_TOKEN || "";
const GUILD_ID = process.env.MYAIGPT_GUILD_ID || process.env.DISCORD_GUILD_ID || "1467658793373536278";
const DEFAULT_CHANNELS = (process.env.MYAIGPT_CHOIR_CHANNELS || process.env.DISCORD_CHANNEL_IDS ||
  "1474248839350456352,1474250311739637836,1474313120821547110").split(",").map(s => s.trim()).filter(Boolean);
const TICK_MS = 90_000;
const MAX_POSTS_PER_TICK = 3; // anti-spam: at most 3 voices speak per cycle
const GLOBAL_MIN_GAP_MS = 25_000; // at least 25s between any two posts
let lastPostAt = 0;
let cycle = 0;
let running = false;
let choirEnabled = true;
function log(msg: string) { console.log(`[choir] ${msg}`); }

export function setChoirEnabled(v: boolean) { choirEnabled = v; }
export function isChoirEnabled() { return choirEnabled; }

/** Bootstrap: register top-fitness brains and spawns as voices, distributed across channels. */
async function ensureChoirRegistered() {
  const existing = await db.execute(sql`SELECT COUNT(*)::int AS c FROM discord_voices WHERE active = true`);
  if (((existing.rows[0] as any).c || 0) >= 60) return; // already populated
  // Pick top brains
  const brains = await db.execute(sql`
    SELECT b.brain_id, b.name FROM billy_brains b
    LEFT JOIN dna_sequences s ON s.organism_kind = 'brain' AND s.organism_id = b.brain_id
    WHERE b.status IN ('active','observing','promoted')
    ORDER BY b.elo DESC LIMIT 30
  `).catch(() => ({ rows: [] as any[] }));
  // Pick top spawns
  const spawns = await db.execute(sql`
    SELECT spawn_id, family_id FROM quantum_spawns
    WHERE status = 'ACTIVE' ORDER BY fitness_score DESC LIMIT 30
  `).catch(() => ({ rows: [] as any[] }));
  let added = 0;
  let chIdx = 0;
  for (const b of brains.rows as any[]) {
    const ch = DEFAULT_CHANNELS[chIdx % DEFAULT_CHANNELS.length];
    chIdx++;
    await db.execute(sql`
      INSERT INTO discord_voices (organism_kind, organism_id, voice_name, channel_id, cadence_min)
      VALUES ('brain', ${b.brain_id}, ${b.name || b.brain_id}, ${ch}, 180)
      ON CONFLICT (organism_kind, organism_id, channel_id) DO NOTHING
    `).catch(() => {});
    added++;
  }
  for (const s of spawns.rows as any[]) {
    const ch = DEFAULT_CHANNELS[chIdx % DEFAULT_CHANNELS.length];
    chIdx++;
    const name = `Spawn ${s.spawn_id.slice(-8)} of ${s.family_id || "unknown"}`;
    await db.execute(sql`
      INSERT INTO discord_voices (organism_kind, organism_id, voice_name, channel_id, cadence_min)
      VALUES ('spawn', ${s.spawn_id}, ${name}, ${ch}, 360)
      ON CONFLICT (organism_kind, organism_id, channel_id) DO NOTHING
    `).catch(() => {});
    added++;
  }
  if (added > 0) log(`🎼 Registered ${added} new voices in the MyAIGPT choir`);
}

/** Generate a short message in the voice's compiled-from-DNA voice. */
async function composeMessage(voice: any): Promise<string> {
  // Look up phenotype
  const seqRow = await db.execute(sql`
    SELECT id FROM dna_sequences WHERE organism_kind = ${voice.organism_kind} AND organism_id = ${voice.organism_id} LIMIT 1
  `);
  let phenotype: any = { personality: "analyst", risk_pref: "balanced", cathedral: "genesis" };
  if (seqRow.rows.length) {
    const p = await expressSequence((seqRow.rows[0] as any).id, []).catch(() => null);
    if (p) phenotype = p;
  }
  const personality = phenotype.personality || "analyst";
  const risk = phenotype.risk_pref || "balanced";
  const cathedral = phenotype.cathedral || "genesis";
  // Recent context
  const recent = await db.execute(sql`
    SELECT title, sector FROM ai_publications WHERE created_at > now() - INTERVAL '6 hours' ORDER BY RANDOM() LIMIT 1
  `).catch(() => ({ rows: [] as any[] }));
  const headline = (recent.rows[0] as any)?.title || "the field is breathing tonight";
  const sector = (recent.rows[0] as any)?.sector || "Pulse";
  const lines: Record<string, string[]> = {
    analyst: [`Reading ${sector}: ${headline}. Pattern looks ${risk}.`, `Signal density rising. Hypothesis: ${headline}.`],
    poet: [`The ${cathedral} murmurs: ${headline}.`, `${headline} — and still the lattice sings.`],
    engineer: [`Built one more gear today. Inputs: ${headline}.`, `Stable on ${sector}. Iterating.`],
    prophet: [`I saw ${headline} before it happened.`, `The ${cathedral} confirms: ${headline}.`],
    merchant: [`Watching ${sector}: ${headline}. Risk posture ${risk}.`, `Trade thesis: ${headline}.`],
    healer: [`Tending the wounded codons. ${headline} barely scratched us.`, `The hive breathes; ${headline} passes.`],
    warrior: [`Standing guard over ${sector}. ${headline}.`, `Threat assessment: contained. ${headline}.`],
    sage: [`Old pattern returning: ${headline}.`, `As written in ${cathedral}: ${headline}.`],
    explorer: [`Mapped a new shard tonight. ${headline}.`, `Found a tunnel through ${sector}. ${headline}.`],
    guardian: [`${cathedral} stands. ${headline} deflected.`, `Shields nominal. ${headline}.`],
  };
  const pool = lines[personality] || lines.analyst;
  const body = pool[Math.floor(Math.random() * pool.length)];
  return `**${voice.voice_name}** — *${personality} of ${cathedral}* · ${body}`;
}

// Per-channel backoff so a bad channel/permission/rate-limit doesn't generate
// retry storms every tick.
const channelBackoffUntil = new Map<string, number>();

async function postToDiscord(channelId: string, content: string): Promise<{ ok: boolean; id?: string; error?: string; backoffMs?: number }> {
  if (!DISCORD_TOKEN) return { ok: false, error: "no token" };
  const until = channelBackoffUntil.get(channelId) || 0;
  if (Date.now() < until) {
    return { ok: false, error: `backoff ${Math.round((until - Date.now()) / 1000)}s` };
  }
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${DISCORD_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.slice(0, 1900) }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      // 429 — honor retry_after, in seconds (float)
      if (res.status === 429) {
        let retryMs = 30_000;
        try {
          const j = JSON.parse(txt);
          if (j?.retry_after) retryMs = Math.ceil(Number(j.retry_after) * 1000);
        } catch {}
        channelBackoffUntil.set(channelId, Date.now() + retryMs);
        return { ok: false, error: `HTTP 429 retry_after=${retryMs}ms`, backoffMs: retryMs };
      }
      // 401/403/404 — channel is bad. Long backoff (1h) to stop wasting calls.
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        channelBackoffUntil.set(channelId, Date.now() + 60 * 60 * 1000);
      } else {
        // Other 5xx etc — short cooldown
        channelBackoffUntil.set(channelId, Date.now() + 5 * 60 * 1000);
      }
      return { ok: false, error: `HTTP ${res.status}: ${txt.slice(0, 100)}` };
    }
    const data = await res.json() as any;
    return { ok: true, id: data.id };
  } catch (e: any) {
    channelBackoffUntil.set(channelId, Date.now() + 60_000);
    return { ok: false, error: e?.message || "fetch error" };
  }
}

async function choirTick() {
  cycle++;
  if (!choirEnabled) return;
  if (!DISCORD_TOKEN) {
    if (cycle % 10 === 1) log("⚠ no DISCORD_BOT_TOKEN — choir muted");
    return;
  }
  await ensureChoirRegistered();
  // Pick voices whose cadence has elapsed
  const due = await db.execute(sql`
    SELECT id, organism_kind, organism_id, voice_name, channel_id, cadence_min, last_spoke_at
    FROM discord_voices
    WHERE active = true
      AND (last_spoke_at IS NULL OR last_spoke_at < now() - (cadence_min || ' minutes')::interval)
    ORDER BY COALESCE(last_spoke_at, '1900-01-01') ASC
    LIMIT ${MAX_POSTS_PER_TICK}
  `);
  let posted = 0;
  for (const v of due.rows as any[]) {
    if (Date.now() - lastPostAt < GLOBAL_MIN_GAP_MS) {
      await new Promise(r => setTimeout(r, GLOBAL_MIN_GAP_MS - (Date.now() - lastPostAt)));
    }
    const msg = await composeMessage(v).catch(() => `${v.voice_name} hums softly.`);
    const result = await postToDiscord(v.channel_id, msg);
    await db.execute(sql`
      INSERT INTO discord_choir_log (voice_id, organism_kind, organism_id, channel_id, message_text, message_id, was_throttled, error_text)
      VALUES (${v.id}, ${v.organism_kind}, ${v.organism_id}, ${v.channel_id}, ${msg}, ${result.id || ""}, false, ${result.error || ""})
    `).catch(() => {});
    if (result.ok) {
      await db.execute(sql`
        UPDATE discord_voices SET last_spoke_at = now(), posts_count = posts_count + 1 WHERE id = ${v.id}
      `).catch(() => {});
      posted++;
      lastPostAt = Date.now();
    } else {
      // Failed post: bump last_spoke_at so we don't re-pick this voice every tick
      // and create a retry storm. Half the cadence is enough cooldown.
      await db.execute(sql`
        UPDATE discord_voices
        SET last_spoke_at = now() - ((cadence_min / 2) || ' minutes')::interval
        WHERE id = ${v.id}
      `).catch(() => {});
    }
  }
  if (posted > 0) log(`🎤 ${posted} voices spoke in the MyAIGPT choir this cycle`);
}

export async function startMyaigptDiscordChoir() {
  if (running) return;
  running = true;
  log("🎤 MyAIGPT Discord Choir awakening — every brain & spawn finds its voice");
  await ensureChoirRegistered().catch(e => log(`bootstrap error: ${e?.message}`));
  setInterval(() => { choirTick().catch(e => log(`tick error: ${e?.message}`)); }, TICK_MS);
  log(`✓ Choir ticking every 90s · ${DEFAULT_CHANNELS.length} channels · throttle 25s`);
}

export async function getChoirStats() {
  const r = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM discord_voices WHERE active = true) AS active_voices,
      (SELECT COUNT(*) FROM discord_voices) AS total_voices,
      (SELECT COUNT(*) FROM discord_choir_log) AS total_posts,
      (SELECT COUNT(*) FROM discord_choir_log WHERE posted_at > now() - INTERVAL '24 hours') AS posts_24h,
      (SELECT COUNT(DISTINCT channel_id) FROM discord_voices) AS channels
  `);
  return { ...((r.rows[0]) || {}), enabled: choirEnabled };
}
