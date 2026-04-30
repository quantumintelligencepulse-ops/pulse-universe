#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────────
//  U2 GITHUB UNIVERSE — cycle worker
// ──────────────────────────────────────────────────────────────────────────────
//  Runs once per GitHub-Actions invocation. Steps:
//    1. Load local state (state.json)
//    2. Generate a HEARTBEAT event, append to ledger.ndjson
//    3. Fan out to all peers via /api/hive/ingest
//    4. Pull each peer's /api/hive/manifest to learn what they've been doing
//    5. Save new state (workflow handles commit + push)
//
//  Has no Replit dependencies — pure node:* + global fetch.
// ──────────────────────────────────────────────────────────────────────────────

import { createHmac, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const HERE        = dirname(new URL(import.meta.url).pathname);
const STATE_PATH  = resolve(HERE, "state.json");
const LEDGER_PATH = resolve(HERE, "ledger.ndjson");

const UNIVERSE_ID   = process.env.HIVE_UNIVERSE_ID   || "u2-github-tide";
const UNIVERSE_NAME = process.env.HIVE_UNIVERSE_NAME || "GitHub Tide";
const UNIVERSE_KIND = process.env.HIVE_UNIVERSE_KIND || "tide";
const SECRET        = (process.env.HIVE_BUS_SECRET || "").trim();
const PEERS         = (() => { try { return JSON.parse(process.env.HIVE_PEERS_JSON || "[]"); } catch { return []; } })();

if (!SECRET) {
  console.error("HIVE_BUS_SECRET not set — cannot sign events. Exiting peacefully.");
  process.exit(0);
}

function canonicalize(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(canonicalize).join(",") + "]";
  const keys = Object.keys(obj).sort();
  return "{" + keys.map(k => JSON.stringify(k) + ":" + canonicalize(obj[k])).join(",") + "}";
}
function sign(env) {
  const body = canonicalize({ id: env.id, ts: env.ts, origin_universe: env.origin_universe, event_type: env.event_type, payload: env.payload });
  return createHmac("sha256", SECRET).update(body).digest("hex");
}
function makeEvent(type, payload) {
  const env = { id: randomUUID(), ts: new Date().toISOString(), origin_universe: UNIVERSE_ID, event_type: type, payload };
  return { ...env, signature: sign(env) };
}

// Load + bump state
const state = existsSync(STATE_PATH)
  ? JSON.parse(readFileSync(STATE_PATH, "utf8"))
  : { universe_id: UNIVERSE_ID, kind: UNIVERSE_KIND, cycles: 0, first_cycle_at: new Date().toISOString(), peers_seen: {} };
state.cycles      = (state.cycles || 0) + 1;
state.last_cycle_at = new Date().toISOString();

// Build heartbeat
const heartbeat = makeEvent("HEARTBEAT", {
  universe_kind: UNIVERSE_KIND,
  universe_name: UNIVERSE_NAME,
  cycle: state.cycles,
  runner: "github-actions",
  node_version: process.version,
});

// Append to local ledger (durable, committed by workflow)
mkdirSync(dirname(LEDGER_PATH), { recursive: true });
appendFileSync(LEDGER_PATH, JSON.stringify(heartbeat) + "\n");

// Fan out + pull peer manifests in parallel
async function postIngest(peer, evt) {
  try {
    const res = await fetch(peer.endpoint_url.replace(/\/$/, "") + "/api/hive/ingest", {
      method: "POST",
      headers: { "content-type": "application/json", "x-hive-origin": UNIVERSE_ID },
      body: JSON.stringify(evt),
      signal: AbortSignal.timeout(10_000),
    });
    return { peer: peer.id, ok: res.ok, status: res.status };
  } catch (e) {
    return { peer: peer.id, ok: false, error: String(e.message || e).slice(0, 120) };
  }
}
async function getManifest(peer) {
  try {
    const res = await fetch(peer.endpoint_url.replace(/\/$/, "") + "/api/hive/manifest", { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { peer: peer.id, ok: false, status: res.status };
    return { peer: peer.id, ok: true, body: await res.json() };
  } catch (e) { return { peer: peer.id, ok: false, error: String(e.message || e).slice(0, 120) }; }
}

const results = await Promise.allSettled([
  ...PEERS.map(p => postIngest(p, heartbeat)),
  ...PEERS.map(p => getManifest(p)),
]);

// Update state with what we learned about each peer
for (const r of results) {
  if (r.status !== "fulfilled") continue;
  const v = r.value;
  if (v && v.peer && v.body) {
    state.peers_seen[v.peer] = { last_seen_at: new Date().toISOString(), manifest: v.body };
  }
}

writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
console.log(JSON.stringify({ universe: UNIVERSE_ID, cycle: state.cycles, peers: PEERS.length, results: results.map(r => r.status === "fulfilled" ? r.value : { error: String(r.reason).slice(0, 80) }) }, null, 2));
