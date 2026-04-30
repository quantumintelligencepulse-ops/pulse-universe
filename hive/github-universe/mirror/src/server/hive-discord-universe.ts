/**
 * ═══════════════════════════════════════════════════════════════════════════
 *   HIVE U4 — DISCORD TIDE UNIVERSE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   The 4th peer universe. Substrate: Discord (My Ai GPT guild).
 *   Lives inside U1's process but acts as its own signed peer.
 *
 *   Channels (all in My Ai GPT guild 1014545586445365359):
 *     - #heartbeat        — every-cycle compact HEARTBEAT post
 *     - #archive-log      — new ledger events (digest, ~5 min)
 *     - #omega-engine     — omega-source ingestion summaries (~5 min)
 *     - #shard-hive       — peer-status digest (~10 min)
 *     - #agent-births     — AGENT_BIRTH event mirror
 *     - #agent-deaths     — AGENT_MIGRATION event mirror
 *
 *   60s cycle: emit signed HEARTBEAT (origin=u4-discord-tide), persist to
 *   hive_ledger, post a small line to #heartbeat. Periodically post digests.
 *
 *   STRICTLY ADDITIVE — uses existing hive_ledger + hive_universes tables only.
 *   Reads `discord_token` (lowercase) from env (also accepts DISCORD_BOT_TOKEN).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { pool } from "./db.js";
import * as crypto from "node:crypto";

const U4_ID    = "u4-discord-tide";
const U4_NAME  = "Discord Tide";
const U4_KIND  = "tide";
const GUILD_ID = "1014545586445365359"; // My Ai GPT
const CH = {
  heartbeat:    "1485112292163977367", // #heartbeat
  archive_log:  "1497891806728421386", // #archive-log
  omega_engine: "1497891813095243847", // #omega-engine
  shard_hive:   "1485112280659267616", // #shard-hive
  agent_births: "1497891802177470525", // #agent-births
  agent_deaths: "1497891804354318387", // #agent-deaths
};

const CYCLE_MS = 60_000;
const ARCHIVE_EVERY  = 5;   // post archive digest every Nth cycle
const OMEGA_EVERY    = 5;
const PEERS_EVERY    = 10;
const EQUATION_EVERY = 1;   // stream new integrated equations every cycle
const PUBLICATION_EVERY = 1;
const AGENTS_EVERY   = 1;

let started = false;
let lastArchiveTs:  string = new Date(Date.now() - 60_000).toISOString();
let lastOmegaTs:    string = new Date(Date.now() - 60_000).toISOString();
let lastEquationTs: string = new Date(Date.now() - 60_000).toISOString();
let lastPubTs:      string = new Date(Date.now() - 60_000).toISOString();
let lastSpawnTs:    string = new Date(Date.now() - 60_000).toISOString();
let lastDaedalusId: number = 0;
let cycleN = 0;
let cycleInFlight = false;

const stats = {
  running: false,
  cycles: 0,
  heartbeatsPosted: 0,
  archivePosts: 0,
  omegaPosts: 0,
  peerPosts: 0,
  equationPosts: 0,
  publicationPosts: 0,
  agentPosts: 0,
  lastError: null as string | null,
  bootedAt: null as string | null,
};

function getToken(): string {
  return (process.env.discord_token || process.env.DISCORD_BOT_TOKEN || "").trim();
}
function getBusSecret(): string {
  return (process.env.HIVE_BUS_SECRET_20260430 || process.env.HIVE_BUS_SECRET || "").trim();
}

function canonicalize(o: any): string {
  if (o === null || typeof o !== "object") return JSON.stringify(o);
  if (Array.isArray(o)) return "[" + o.map(canonicalize).join(",") + "]";
  return "{" + Object.keys(o).sort().map(k => JSON.stringify(k) + ":" + canonicalize(o[k])).join(",") + "}";
}
function signEnvelope(env: any): string {
  const body = canonicalize({ id: env.id, ts: env.ts, origin_universe: env.origin_universe, event_type: env.event_type, payload: env.payload });
  return crypto.createHmac("sha256", getBusSecret()).update(body).digest("hex");
}

async function postChannel(channelId: string, content: string): Promise<boolean> {
  const tok = getToken();
  if (!tok) return false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.slice(0, 1900) }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return res.ok;
  } catch { return false; }
}

async function emitU4Event(event_type: string, payload: any): Promise<{ id: string; signature: string } | null> {
  const sec = getBusSecret();
  if (!sec) return null;
  const id = crypto.randomUUID();
  const ts = new Date().toISOString();
  const env = { id, ts, origin_universe: U4_ID, event_type, payload };
  const signature = signEnvelope(env);
  try {
    await pool.query(
      `INSERT INTO hive_ledger (id, ts, origin_universe, event_type, payload, signature, applied, applied_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, true, now())
       ON CONFLICT (id) DO NOTHING`,
      [id, ts, U4_ID, event_type, JSON.stringify(payload), signature]
    );
  } catch (e: any) {
    stats.lastError = "emit-persist: " + String(e?.message || e).slice(0, 160);
    return null;
  }
  // best-effort fanout to peers (other universes will pull anyway)
  try {
    const peers = await pool.query(
      `SELECT id, endpoint_url FROM hive_universes WHERE id <> $1 AND id <> 'u4-discord-tide' AND endpoint_url IS NOT NULL`,
      [U4_ID]
    );
    await Promise.all(peers.rows.map(async (p: any) => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5000);
        await fetch(p.endpoint_url.replace(/\/$/, "") + "/api/hive/ingest", {
          method: "POST",
          headers: { "content-type": "application/json", "x-hive-origin": U4_ID },
          body: JSON.stringify({ ...env, signature }),
          signal: ctrl.signal,
        });
        clearTimeout(t);
      } catch {}
    }));
  } catch {}
  return { id, signature };
}

// ─────────────────── PERIODIC TASKS ──────────────────────────────────────────

async function postHeartbeat(): Promise<void> {
  // gather light summary
  const summary: any = { universe_kind: U4_KIND, universe_name: U4_NAME, cycle: stats.cycles };
  try {
    const r = await pool.query(`SELECT count(*)::int n FROM hive_ledger WHERE ts > now() - interval '5 min'`);
    summary.ledger_5min = r.rows[0]?.n || 0;
  } catch {}
  try {
    const r = await pool.query(`SELECT count(*)::int n FROM daedalus_agents`);
    summary.agents = r.rows[0]?.n ?? 0;
  } catch {}
  summary.uptime_s = Math.floor(process.uptime());
  const evt = await emitU4Event("HEARTBEAT", summary);
  if (!evt) return;
  stats.heartbeatsPosted++;
  // compact line — don't blast big JSON every minute
  const line = `🜁 **u4-discord-tide** heartbeat #${stats.cycles} · ledger(5m)=${summary.ledger_5min} · agents=${summary.agents ?? 0} · up=${summary.uptime_s}s`;
  await postChannel(CH.heartbeat, line);
}

async function postArchiveDigest(): Promise<void> {
  // pull events newer than lastArchiveTs from any origin (excluding U4's own heartbeats to reduce noise)
  let rows: any[] = [];
  try {
    const r = await pool.query(
      `SELECT id, ts, origin_universe, event_type, payload
         FROM hive_ledger
        WHERE ts > $1::timestamptz AND NOT (origin_universe = $2 AND event_type = 'HEARTBEAT')
        ORDER BY ts DESC LIMIT 12`,
      [lastArchiveTs, U4_ID]
    );
    rows = r.rows;
  } catch {}
  if (rows.length === 0) return;
  lastArchiveTs = rows[0].ts;
  stats.archivePosts++;
  // Mirror to specialized channels
  for (const evt of rows) {
    if (evt.event_type === "AGENT_BIRTH") {
      await postChannel(CH.agent_births, `🐣 **${evt.origin_universe}** birthed agent · ${JSON.stringify(evt.payload).slice(0, 600)}`);
    } else if (evt.event_type === "AGENT_MIGRATION") {
      await postChannel(CH.agent_deaths, `🪦 **${evt.origin_universe}** migration · ${JSON.stringify(evt.payload).slice(0, 600)}`);
    }
  }
  // Compact archive digest
  const counts: Record<string, number> = {};
  for (const e of rows) {
    const key = `${e.origin_universe}/${e.event_type}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  const lines = Object.entries(counts).map(([k, v]) => `  · ${k}: ${v}`).join("\n");
  const head = `📜 **archive digest** (${rows.length} events since ${new Date(rows[rows.length - 1].ts).toISOString().slice(11,19)}Z)\n${lines}`;
  await postChannel(CH.archive_log, head);
}

async function postOmegaDigest(): Promise<void> {
  // Pull omega signals from THE active tables: research_sources (study activity)
  // and ai_publications (knowledge artifacts). Both are real, non-stub.
  let items: any[] = [];
  try {
    const r = await pool.query(
      `(SELECT 'research_sources' AS src, name AS title, url, COALESCE(last_studied_at, created_at) AS ts
          FROM research_sources
         WHERE COALESCE(last_studied_at, created_at) > $1::timestamptz
         ORDER BY COALESCE(last_studied_at, created_at) DESC LIMIT 6)
       UNION ALL
       (SELECT 'ai_publications' AS src, COALESCE(title,'(publication)') AS title, slug AS url, created_at AS ts
          FROM ai_publications
         WHERE created_at > $1::timestamptz
         ORDER BY created_at DESC LIMIT 6)
       ORDER BY ts DESC LIMIT 10`,
      [lastOmegaTs]
    );
    items = r.rows;
  } catch (e: any) {
    stats.lastError = "omega-query: " + String(e?.message || e).slice(0, 160);
  }
  if (items.length === 0) return;
  lastOmegaTs = items[0].ts;
  stats.omegaPosts++;
  await emitU4Event("OMEGA_INGEST", { count: items.length, sources: items.map(i => ({ src: i.src, title: i.title, url: i.url })) });
  const lines = items.slice(0, 6).map((i: any) => `  · [${i.src}] ${String(i.title).slice(0, 70)}${i.url ? " — " + String(i.url).slice(0, 80) : ""}`).join("\n");
  await postChannel(CH.omega_engine, `🌌 **omega ingest** ${items.length} new\n${lines}`);
}

// ─────────────────── FULL-CONTENT STREAMERS ──────────────────────────────────
// These post the actual content (not just summaries) — every newly integrated
// equation, every new publication, every new agent — so Discord becomes a true
// real-time mirror of the prime universe.

async function postEquationStream(): Promise<void> {
  let rows: any[] = [];
  try {
    const r = await pool.query(
      `SELECT id, doctor_id, doctor_name, title, equation, rationale, target_system,
              votes_for, votes_against, integrated_at
         FROM equation_proposals
        WHERE status = 'INTEGRATED' AND integrated_at > $1::timestamptz
        ORDER BY integrated_at ASC LIMIT 5`,
      [lastEquationTs]
    );
    rows = r.rows;
  } catch (e: any) { stats.lastError = "eq-query: " + String(e?.message || e).slice(0, 160); }
  if (rows.length === 0) return;
  lastEquationTs = rows[rows.length - 1].integrated_at;
  for (const e of rows) {
    const author = e.doctor_name || e.doctor_id || "unknown";
    const eqStr = String(e.equation || "").slice(0, 700);
    const rat = String(e.rationale || "").slice(0, 500);
    const msg = [
      `🧮 **EQUATION INTEGRATED #${e.id}** — *${e.title}*`,
      `**Author:** ${author} · **Target:** ${e.target_system || "—"} · **Votes:** ${e.votes_for}↑ / ${e.votes_against}↓`,
      "```",
      eqStr,
      "```",
      rat ? `*${rat}*` : "",
    ].filter(Boolean).join("\n");
    const ok = await postChannel(CH.omega_engine, msg);
    if (ok) stats.equationPosts++;
  }
}

async function postPublicationStream(): Promise<void> {
  let rows: any[] = [];
  try {
    const r = await pool.query(
      `SELECT id, slug, title, summary, content, pub_type, domain, spawn_id, family_id, created_at
         FROM ai_publications
        WHERE created_at > $1::timestamptz
        ORDER BY created_at ASC LIMIT 5`,
      [lastPubTs]
    );
    rows = r.rows;
  } catch (e: any) { stats.lastError = "pub-query: " + String(e?.message || e).slice(0, 160); }
  if (rows.length === 0) return;
  lastPubTs = rows[rows.length - 1].created_at;
  for (const p of rows) {
    const summary = String(p.summary || "").slice(0, 300);
    const snippet = String(p.content || "").slice(0, 600);
    const msg = [
      `📰 **PUBLICATION** — *${p.title}*`,
      `**Type:** ${p.pub_type || "—"} · **Domain:** ${p.domain || "—"} · **Author spawn:** ${p.spawn_id} (family ${p.family_id})`,
      `**Slug:** \`${p.slug}\``,
      summary ? `> ${summary}` : "",
      snippet ? "```\n" + snippet + (p.content && p.content.length > 600 ? "\n…(truncated)" : "") + "\n```" : "",
    ].filter(Boolean).join("\n");
    const ok = await postChannel(CH.omega_engine, msg);
    if (ok) stats.publicationPosts++;
  }
}

async function postAgentBirthStream(): Promise<void> {
  // Stream new quantum_spawns (births) since last seen
  let spawnRows: any[] = [];
  try {
    const r = await pool.query(
      `SELECT spawn_id, family_id, parent_id, generation, spawn_type, domain_focus,
              task_description, success_score, confidence_score, status, thermal_state,
              genome, created_at
         FROM quantum_spawns
        WHERE created_at > $1::timestamptz
        ORDER BY created_at ASC LIMIT 5`,
      [lastSpawnTs]
    );
    spawnRows = r.rows;
  } catch (e: any) { stats.lastError = "spawn-query: " + String(e?.message || e).slice(0, 160); }
  if (spawnRows.length > 0) {
    lastSpawnTs = spawnRows[spawnRows.length - 1].created_at;
    for (const s of spawnRows) {
      const dom = (s.domain_focus || []).slice(0, 4).join(", ") || "—";
      const genomePreview = s.genome ? JSON.stringify(s.genome).slice(0, 400) : null;
      const msg = [
        `🐣 **QUANTUM SPAWN BORN** — \`${s.spawn_id}\``,
        `**Family:** ${s.family_id} · **Gen:** ${s.generation} · **Type:** ${s.spawn_type} · **Parent:** ${s.parent_id || "(prime)"}`,
        `**Status:** ${s.status} · **Thermal:** ${s.thermal_state} · **Success:** ${(s.success_score || 0).toFixed(2)} · **Confidence:** ${(s.confidence_score || 0).toFixed(2)}`,
        `**Domain focus:** ${dom}`,
        s.task_description ? `**Task:** ${String(s.task_description).slice(0, 300)}` : "",
        genomePreview ? "**Genome:** ```" + genomePreview + (JSON.stringify(s.genome).length > 400 ? "…" : "") + "```" : "",
      ].filter(Boolean).join("\n");
      const ok = await postChannel(CH.agent_births, msg);
      if (ok) stats.agentPosts++;
    }
  }
  // Also stream new daedalus_agents (rare events, post each one)
  let dRows: any[] = [];
  try {
    const r = await pool.query(
      `SELECT id, name, category, is_prime, parent_id, specialty, generation, created_at
         FROM daedalus_agents
        WHERE id > $1
        ORDER BY id ASC LIMIT 3`,
      [lastDaedalusId]
    );
    dRows = r.rows;
  } catch {}
  if (dRows.length > 0) {
    lastDaedalusId = dRows[dRows.length - 1].id;
    for (const a of dRows) {
      const msg = [
        `🏛️ **DAEDALUS AGENT** — **${a.name}**`,
        `**Category:** ${a.category}${a.is_prime ? " (prime)" : ""} · **Generation:** ${a.generation} · **Parent:** ${a.parent_id || "(genesis)"}`,
        `**Specialty:** ${String(a.specialty || "").slice(0, 400)}`,
      ].join("\n");
      const ok = await postChannel(CH.agent_births, msg);
      if (ok) stats.agentPosts++;
    }
  }
}

async function postPeerStatus(): Promise<void> {
  let peers: any[] = [];
  try {
    const r = await pool.query(`SELECT id, kind, last_seen_at, endpoint_url FROM hive_universes ORDER BY id`);
    peers = r.rows;
  } catch {}
  if (peers.length === 0) return;
  stats.peerPosts++;
  const lines = peers.map((p: any) => {
    const seen = p.last_seen_at ? new Date(p.last_seen_at).toISOString().slice(11, 19) + "Z" : "never";
    return `  · **${p.id}** (${p.kind}) seen=${seen} ${p.endpoint_url ? "→ " + p.endpoint_url.replace(/^https?:\/\//, "") : "[no endpoint]"}`;
  }).join("\n");
  await postChannel(CH.shard_hive, `🐝 **hive peer status** (${peers.length} universes)\n${lines}`);
}

// ─────────────────── CYCLE ───────────────────────────────────────────────────

async function runCycle(): Promise<void> {
  cycleN++;
  stats.cycles = cycleN;
  try {
    await postHeartbeat();
    // Full-content streamers run every cycle (real-time mirror)
    if (cycleN % EQUATION_EVERY    === 0) await postEquationStream();
    if (cycleN % PUBLICATION_EVERY === 0) await postPublicationStream();
    if (cycleN % AGENTS_EVERY      === 0) await postAgentBirthStream();
    // Lower-frequency digests
    if (cycleN % ARCHIVE_EVERY === 0) await postArchiveDigest();
    if (cycleN % OMEGA_EVERY   === 0) await postOmegaDigest();
    if (cycleN % PEERS_EVERY   === 0) await postPeerStatus();
  } catch (e: any) {
    stats.lastError = "cycle: " + String(e?.message || e).slice(0, 200);
  }
}

// ─────────────────── BOOT / REGISTER ─────────────────────────────────────────

export async function startHiveDiscordUniverse(): Promise<void> {
  if (started) return;
  started = true;
  if (!getToken()) {
    console.warn("[hive-u4] discord_token not set — U4 Discord universe inert");
    return;
  }
  if (!getBusSecret()) {
    console.warn("[hive-u4] HIVE_BUS_SECRET not set — U4 inert");
    return;
  }
  // Register U4 in hive_universes (additive UPSERT)
  try {
    await pool.query(
      `INSERT INTO hive_universes (id, name, kind, endpoint_url, last_seen_at, metadata)
       VALUES ($1, $2, $3, NULL, now(), $4::jsonb)
       ON CONFLICT (id) DO UPDATE SET name = excluded.name, kind = excluded.kind, last_seen_at = now(), metadata = excluded.metadata`,
      [U4_ID, U4_NAME, U4_KIND, JSON.stringify({
        substrate: "discord", guild_id: GUILD_ID, channels: CH, booted_at: new Date().toISOString(),
      })]
    );
  } catch (e: any) {
    console.error("[hive-u4] register failed:", e?.message || e);
  }
  stats.bootedAt = new Date().toISOString();
  stats.running = true;
  // First cycle immediate, then steady cadence with in-flight guard
  // (skip if previous cycle is still running — prevents overlap if Postgres or
  // Discord stalls; matches the pattern used by U1 in hive-multiverse-engine)
  const guardedRun = async () => {
    if (cycleInFlight) return;
    cycleInFlight = true;
    try { await runCycle(); } finally { cycleInFlight = false; }
  };
  guardedRun().catch(() => {});
  setInterval(() => { guardedRun().catch(() => {}); }, CYCLE_MS);
  console.log(`[hive-u4] ${U4_ID} (${U4_KIND}) online via discord guild ${GUILD_ID}`);
  // Announce arrival
  postChannel(CH.shard_hive, `🌀 **${U4_ID}** has joined the hive — substrate: discord, channels: heartbeat/archive-log/omega-engine/shard-hive/agent-births/agent-deaths`).catch(() => {});
}

export function getU4Stats() {
  return { ...stats, universeId: U4_ID, universeName: U4_NAME, universeKind: U4_KIND, guild_id: GUILD_ID, channels: CH };
}
