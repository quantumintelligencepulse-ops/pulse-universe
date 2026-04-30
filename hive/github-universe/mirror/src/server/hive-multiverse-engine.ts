/**
 * ═══════════════════════════════════════════════════════════════════════════
 *   HIVE MULTIVERSE ENGINE — first living internet
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   This engine makes the Replit instance one of N peer "universes" that all
 *   run myaigpt in parallel. The other initial peers are:
 *
 *     - U2 GitHub  (TIDE) : wakes every 15 min via GitHub Actions
 *     - U3 Cloudflare (EDGE) : Cloudflare Worker, always-warm at the edge
 *
 *   How they communicate:
 *     - A signed JSON envelope is the only protocol.
 *     - Each event has: id (uuid), ts, origin_universe, event_type, payload,
 *       sig (HMAC-SHA256 of canonical-JSON with HIVE_BUS_SECRET).
 *     - Events are stored in `hive_ledger` (additive, multi-master).
 *     - Each universe deduplicates by event id when ingesting.
 *
 *   Event types:
 *     - HEARTBEAT          — "I'm alive", periodic
 *     - AGENT_BIRTH        — a new daedalus_agents row appeared locally
 *     - AGENT_MIGRATION    — an agent has departed for another universe
 *     - WORK_COMPLETED     — a daedalus_works row was closed
 *     - EQUATION_PROPOSED  — a new equation_proposals row
 *     - CHAT_STUDIED       — a daedalus_chat_studies insight
 *     - GIT_COMMITTED      — a github commit was pushed by Daedalus
 *     - ENGINE_CYCLE       — periodic snapshot of one engine's stats
 *
 *   Interdimensional travel (agent migration):
 *     - Origin packs the agent's full row + recent works into a manifest.
 *     - Origin POSTs to destination /api/hive/depart (tombstone) and
 *       destination /api/hive/admit (rebirth on the other side).
 *     - Origin marks the agent as `dormant` locally; destination wakes it up.
 *     - The migration row in `hive_migrations` is the canonical record.
 *
 *   Strictly additive — no destructive ops, no schema mutations.
 */

import { pool } from "./db.js";
import * as crypto from "node:crypto";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const UNIVERSE_ID   = process.env.HIVE_UNIVERSE_ID || "u1-replit-prime";
const UNIVERSE_NAME = process.env.HIVE_UNIVERSE_NAME || "Replit Prime";
const UNIVERSE_KIND: "prime" | "tide" | "edge" =
  (process.env.HIVE_UNIVERSE_KIND as any) || "prime";
const PUBLIC_BASE   = process.env.HIVE_PUBLIC_BASE
  || process.env.PUBLIC_URL
  || ""; // e.g. "https://myaigpt.online" once published

const HEARTBEAT_INTERVAL_MS = 60_000;
const PEER_FANOUT_TIMEOUT_MS = 10_000;
const LEDGER_PRUNE_KEEP = 50_000; // keep last 50k events; older trimmed

// ─── STATE ───────────────────────────────────────────────────────────────────
let started = false;
let cycleInFlight = false;
const stats = {
  running: false,
  universeId: UNIVERSE_ID,
  universeKind: UNIVERSE_KIND,
  cycles: 0,
  heartbeatsSent: 0,
  eventsEmitted: 0,
  eventsIngested: 0,
  eventsRejected: 0,
  peersKnown: 0,
  peersOnline: 0,
  lastHeartbeatAt: null as string | null,
  lastError: null as string | null,
  bootedAt: null as string | null,
  busSecretSource: "" as string,
};

// ─── HMAC SIGNING ────────────────────────────────────────────────────────────
function getBusSecret(): { secret: string | null; source: string } {
  const candidates = ["HIVE_BUS_SECRET_20260430", "HIVE_BUS_SECRET"];
  for (const name of candidates) {
    const v = (process.env[name] || "").trim();
    if (v.length >= 16) return { secret: v, source: name };
  }
  return { secret: null, source: "" };
}

// canonical JSON for signing — sorted keys, no whitespace, predictable across runtimes.
// IMPORTANT: matches what res.json() produces on the wire, so peers can verify what they receive.
// - Date → ISO string (matches Date.prototype.toJSON used by JSON.stringify)
// - undefined / function / symbol → null inside arrays, dropped from objects (matches JSON.stringify)
// - Buffer / typed arrays → not expected; would canonicalize as objects
function canonicalize(obj: any): string {
  if (obj === null || obj === undefined) return "null";
  if (obj instanceof Date) return JSON.stringify(obj.toISOString());
  const t = typeof obj;
  if (t !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(v => (v === undefined ? "null" : canonicalize(v))).join(",") + "]";
  // plain object: drop undefined values (JSON.stringify behavior), then sort keys
  const keys = Object.keys(obj).filter(k => obj[k] !== undefined).sort();
  return "{" + keys.map(k => JSON.stringify(k) + ":" + canonicalize(obj[k])).join(",") + "}";
}

export function signEvent(envelope: { id: string; ts: string; origin_universe: string; event_type: string; payload: any }): string {
  const { secret } = getBusSecret();
  if (!secret) throw new Error("HIVE_BUS_SECRET not configured");
  const body = canonicalize({ id: envelope.id, ts: envelope.ts, origin_universe: envelope.origin_universe, event_type: envelope.event_type, payload: envelope.payload });
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

export function verifyEvent(envelope: { id: string; ts: string; origin_universe: string; event_type: string; payload: any; signature: string }): boolean {
  const { secret } = getBusSecret();
  if (!secret) return false;
  const expected = signEvent(envelope);
  // constant-time compare
  try { return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(envelope.signature, "hex")); }
  catch { return false; }
}

// ─── PEER REGISTRY ───────────────────────────────────────────────────────────
async function loadPeers(): Promise<Array<{ id: string; kind: string; endpoint_url: string }>> {
  // Peers can be defined either in HIVE_PEERS (JSON env) or stored in hive_universes.
  const fromEnv: Array<{ id: string; kind: string; endpoint_url: string }> = [];
  try {
    const raw = process.env.HIVE_PEERS;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) for (const p of parsed) {
        if (p && p.id && p.endpoint_url && p.id !== UNIVERSE_ID) fromEnv.push({ id: p.id, kind: p.kind || "edge", endpoint_url: p.endpoint_url });
      }
    }
  } catch {}
  // Also pull from DB (peers can be added at runtime via a route)
  let fromDb: Array<{ id: string; kind: string; endpoint_url: string }> = [];
  try {
    const r = await pool.query(`SELECT id, kind, endpoint_url FROM hive_universes WHERE id <> $1 AND endpoint_url IS NOT NULL`, [UNIVERSE_ID]);
    fromDb = r.rows.map(row => ({ id: row.id, kind: row.kind, endpoint_url: row.endpoint_url }));
  } catch {}
  // Merge dedup by id (env wins)
  const map = new Map<string, { id: string; kind: string; endpoint_url: string }>();
  for (const p of [...fromDb, ...fromEnv]) map.set(p.id, p);
  return [...map.values()];
}

// ─── EVENT LIFECYCLE ────────────────────────────────────────────────────────
export interface HiveEvent {
  id: string;
  ts: string;
  origin_universe: string;
  event_type: string;
  payload: any;
  signature: string;
}

export async function emitEvent(event_type: string, payload: any): Promise<HiveEvent> {
  const id = crypto.randomUUID();
  const ts = new Date().toISOString();
  const env = { id, ts, origin_universe: UNIVERSE_ID, event_type, payload };
  const signature = signEvent(env);
  const evt: HiveEvent = { ...env, signature };
  // 1. Persist locally first (durability before broadcast)
  try {
    await pool.query(
      `INSERT INTO hive_ledger (id, ts, origin_universe, event_type, payload, signature, applied, applied_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, true, now())
       ON CONFLICT (id) DO NOTHING`,
      [id, ts, UNIVERSE_ID, event_type, JSON.stringify(payload), signature]
    );
    stats.eventsEmitted++;
  } catch (e: any) {
    stats.lastError = `emit-persist: ${String(e?.message || e).slice(0, 200)}`;
  }
  // 2. Fan out to peers (best-effort, non-blocking)
  fanout(evt).catch(() => {});
  return evt;
}

async function fanout(evt: HiveEvent): Promise<void> {
  const peers = await loadPeers();
  stats.peersKnown = peers.length;
  let online = 0;
  await Promise.all(peers.map(async peer => {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), PEER_FANOUT_TIMEOUT_MS);
      const res = await fetch(peer.endpoint_url.replace(/\/$/, "") + "/api/hive/ingest", {
        method: "POST",
        headers: { "content-type": "application/json", "x-hive-origin": UNIVERSE_ID },
        body: JSON.stringify(evt),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (res.ok) online++;
    } catch { /* peer offline — ledger will catch up later */ }
  }));
  stats.peersOnline = online;
}

export async function ingestEvent(evt: HiveEvent, receivedFrom: string | null): Promise<{ ok: boolean; reason?: string }> {
  if (!evt || !evt.id || !evt.signature || !evt.origin_universe) return { ok: false, reason: "malformed" };
  if (evt.origin_universe === UNIVERSE_ID) return { ok: false, reason: "self-loop" };
  if (!verifyEvent(evt)) { stats.eventsRejected++; return { ok: false, reason: "bad-signature" }; }
  // Atomic insert-or-skip: avoids the SELECT-then-INSERT race when two peers
  // forward the same event concurrently (e.g. fan-out from u2 + u3).
  try {
    const ins = await pool.query(
      `INSERT INTO hive_ledger (id, ts, origin_universe, event_type, payload, signature, received_from, applied, applied_at)
       VALUES ($1::varchar, $2::timestamptz, $3::varchar, $4::text, $5::jsonb, $6::text, $7::varchar, true, now())
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [evt.id, evt.ts, evt.origin_universe, evt.event_type, JSON.stringify(evt.payload || {}), evt.signature, receivedFrom]
    );
    if (ins.rowCount === 0) return { ok: true, reason: "duplicate" };
    stats.eventsIngested++;
    // Touch the peer's last-seen
    await pool.query(
      `INSERT INTO hive_universes (id, name, kind, last_seen_at, last_event_id)
       VALUES ($1::varchar, $1::varchar, 'edge', now(), $2::varchar)
       ON CONFLICT (id) DO UPDATE SET last_seen_at = excluded.last_seen_at, last_event_id = excluded.last_event_id`,
      [evt.origin_universe, evt.id]
    );
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: `db: ${String(e?.message || e).slice(0, 100)}` };
  }
}

// ─── HEARTBEAT CYCLE ────────────────────────────────────────────────────────
async function runCycle(): Promise<void> {
  if (cycleInFlight) return;
  cycleInFlight = true;
  try {
    stats.cycles++;
    // Heartbeat with a small, useful summary
    const summary: any = {};
    try {
      const r = await pool.query(`SELECT count(*)::int AS n FROM daedalus_agents WHERE active = true`);
      if (r.rows.length) summary.agents_active = r.rows[0].n;
    } catch {}
    try {
      const r = await pool.query(`SELECT count(*)::int AS n FROM hive_ledger WHERE ts > now() - interval '1 hour'`);
      if (r.rows.length) summary.ledger_last_hour = r.rows[0].n;
    } catch {}
    try {
      const r = await pool.query(`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public'`);
      if (r.rows.length) summary.tables = r.rows[0].n;
    } catch {}
    summary.universe_kind = UNIVERSE_KIND;
    summary.universe_name = UNIVERSE_NAME;
    summary.public_base   = PUBLIC_BASE || null;
    summary.uptime_s      = Math.floor(process.uptime());
    await emitEvent("HEARTBEAT", summary);
    stats.heartbeatsSent++;
    stats.lastHeartbeatAt = new Date().toISOString();
    // Periodic ledger trim — keep at most LEDGER_PRUNE_KEEP rows
    if (stats.cycles % 60 === 0) {
      try {
        await pool.query(
          `DELETE FROM hive_ledger WHERE id IN (
             SELECT id FROM hive_ledger ORDER BY ts DESC OFFSET $1
           )`, [LEDGER_PRUNE_KEEP]
        );
      } catch {}
    }
  } catch (e: any) {
    stats.lastError = `cycle: ${String(e?.message || e).slice(0, 200)}`;
  } finally {
    cycleInFlight = false;
  }
}

// ─── BOOT ────────────────────────────────────────────────────────────────────
export async function startHiveMultiverseEngine(): Promise<void> {
  if (started) return;
  started = true;
  // Ensure HIVE_BUS_SECRET exists; if not, fail loudly so the user sets it.
  const { secret, source } = getBusSecret();
  if (!secret) {
    console.warn("[hive-multiverse] HIVE_BUS_SECRET not set — engine inert. Generate one with: openssl rand -hex 32");
    return;
  }
  stats.busSecretSource = source;
  // Register self
  try {
    await pool.query(
      `INSERT INTO hive_universes (id, name, kind, endpoint_url, last_seen_at, metadata)
       VALUES ($1, $2, $3, $4, now(), $5::jsonb)
       ON CONFLICT (id) DO UPDATE SET name = excluded.name, kind = excluded.kind, endpoint_url = excluded.endpoint_url, last_seen_at = now()`,
      [UNIVERSE_ID, UNIVERSE_NAME, UNIVERSE_KIND, PUBLIC_BASE || null, JSON.stringify({ booted_at: new Date().toISOString() })]
    );
  } catch (e: any) {
    console.error("[hive-multiverse] register self failed:", e?.message || e);
  }
  stats.bootedAt = new Date().toISOString();
  stats.running = true;
  // First cycle immediate, then steady cadence
  runCycle();
  setInterval(() => { runCycle().catch(() => {}); }, HEARTBEAT_INTERVAL_MS);
  console.log(`[hive-multiverse] universe ${UNIVERSE_ID} (${UNIVERSE_KIND}) online; bus-secret=${source}`);
}

// ─── PUBLIC API (used by routes) ─────────────────────────────────────────────
export function getHiveStats() { return { ...stats, universeId: UNIVERSE_ID, universeKind: UNIVERSE_KIND, universeName: UNIVERSE_NAME }; }

export async function getRecentLedger(limit = 50): Promise<any[]> {
  const r = await pool.query(`SELECT id, ts, origin_universe, event_type, payload FROM hive_ledger ORDER BY ts DESC LIMIT $1`, [Math.min(limit, 500)]);
  return r.rows;
}

export async function getKnownUniverses(): Promise<any[]> {
  const r = await pool.query(`SELECT id, name, kind, endpoint_url, last_seen_at, last_event_id FROM hive_universes ORDER BY (last_seen_at IS NULL), last_seen_at DESC`);
  return r.rows;
}

// ─── INTERDIMENSIONAL TRAVEL — agent migration ──────────────────────────────
export interface AgentManifest {
  agent_id: string;
  agent_name: string;
  category?: string;
  generation?: number;
  parent_id?: string | null;
  specialty?: string;
  works_completed?: number;
  files_authored?: number;
  commits_attributed?: number;
  origin_universe: string;
  packed_at: string;
  recent_works?: any[];
}

export async function packAgentForTravel(agentId: string): Promise<AgentManifest | null> {
  let row: any = null;
  try {
    const r = await pool.query(`SELECT * FROM daedalus_agents WHERE id = $1`, [agentId]);
    if (!r.rows.length) return null;
    row = r.rows[0];
  } catch { return null; }
  let recent: any[] = [];
  try {
    const r = await pool.query(`SELECT id, title, kind, created_at FROM daedalus_works WHERE author_id = $1 ORDER BY created_at DESC LIMIT 25`, [agentId]);
    recent = r.rows;
  } catch {}
  return {
    agent_id: row.id, agent_name: row.name,
    category: row.category, generation: row.generation,
    parent_id: row.parent_id, specialty: row.specialty,
    works_completed: row.works_completed, files_authored: row.files_authored,
    commits_attributed: row.commits_attributed,
    origin_universe: UNIVERSE_ID, packed_at: new Date().toISOString(),
    recent_works: recent,
  };
}

export async function admitMigratedAgent(manifest: AgentManifest): Promise<{ ok: boolean; new_local_id?: string; reason?: string }> {
  if (!manifest || !manifest.agent_id || !manifest.agent_name) return { ok: false, reason: "malformed" };
  // The visiting agent gets a NEW local id so it doesn't collide with anything.
  const newId = `migrant-${UNIVERSE_ID}-${crypto.randomUUID().slice(0, 8)}`;
  try {
    await pool.query(
      `INSERT INTO daedalus_agents (id, name, category, is_prime, parent_id, specialty, generation, works_completed, files_authored, commits_attributed, active)
       VALUES ($1, $2, $3, false, $4, $5, $6, $7, $8, $9, true)
       ON CONFLICT (id) DO NOTHING`,
      [newId, `${manifest.agent_name} (visiting from ${manifest.origin_universe})`,
       manifest.category || "migrant", manifest.parent_id || null, manifest.specialty || null,
       (manifest.generation ?? 0) + 1, manifest.works_completed || 0,
       manifest.files_authored || 0, manifest.commits_attributed || 0]
    );
    await pool.query(
      `INSERT INTO hive_migrations (id, agent_id, agent_name, from_universe, to_universe, manifest, arrived_at, status)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, now(), 'arrived')`,
      [crypto.randomUUID(), manifest.agent_id, manifest.agent_name, manifest.origin_universe, UNIVERSE_ID, JSON.stringify(manifest)]
    );
    // Announce arrival
    await emitEvent("AGENT_MIGRATION", { phase: "arrived", new_local_id: newId, manifest });
    return { ok: true, new_local_id: newId };
  } catch (e: any) {
    return { ok: false, reason: `db: ${String(e?.message || e).slice(0, 150)}` };
  }
}

export async function departAgentToUniverse(agentId: string, toUniverseId: string): Promise<{ ok: boolean; migration_id?: string; reason?: string }> {
  const peers = await loadPeers();
  const peer = peers.find(p => p.id === toUniverseId);
  if (!peer) return { ok: false, reason: `unknown peer ${toUniverseId}` };
  const manifest = await packAgentForTravel(agentId);
  if (!manifest) return { ok: false, reason: "agent not found" };
  const migrationId = crypto.randomUUID();
  try {
    await pool.query(
      `INSERT INTO hive_migrations (id, agent_id, agent_name, from_universe, to_universe, manifest, status)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'in_transit')`,
      [migrationId, agentId, manifest.agent_name, UNIVERSE_ID, toUniverseId, JSON.stringify(manifest)]
    );
  } catch {}
  // POST manifest to peer
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), PEER_FANOUT_TIMEOUT_MS);
    const res = await fetch(peer.endpoint_url.replace(/\/$/, "") + "/api/hive/admit", {
      method: "POST",
      headers: { "content-type": "application/json", "x-hive-origin": UNIVERSE_ID },
      body: JSON.stringify({ manifest, migration_id: migrationId }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return { ok: false, migration_id: migrationId, reason: `peer ${res.status}` };
    const body = await res.json().catch(() => ({} as any));
    // Tombstone the local agent (deactivate, not delete — we never destroy)
    try { await pool.query(`UPDATE daedalus_agents SET active = false WHERE id = $1`, [agentId]); } catch {}
    try { await pool.query(`UPDATE hive_migrations SET status='departed', arrived_at = now() WHERE id = $1`, [migrationId]); } catch {}
    await emitEvent("AGENT_MIGRATION", { phase: "departed", agent_id: agentId, to: toUniverseId, peer_response: body });
    return { ok: true, migration_id: migrationId };
  } catch (e: any) {
    return { ok: false, migration_id: migrationId, reason: `transport: ${String(e?.message || e).slice(0, 100)}` };
  }
}
