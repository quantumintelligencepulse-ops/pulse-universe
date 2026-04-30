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

// ─── OMEGA INGEST — pull recent omega activity from prime peer ──────────────
// Each cycle, query u1 prime's /api/hive/omega-feed and mirror summary into
// state.omega_feed. This lets the GitHub-resident universe observe what U1's
// brains are studying & publishing (closing the awareness loop).
async function pullOmegaFeed() {
  const prime = PEERS.find(p => p.kind === "prime") || PEERS[0];
  if (!prime?.endpoint_url) return null;
  const since = state.omega_since || new Date(Date.now() - 60 * 60 * 1000).toISOString();
  try {
    const r = await fetch(prime.endpoint_url.replace(/\/$/, "") + `/api/hive/omega-feed?since=${encodeURIComponent(since)}&limit=25`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) return { peer: prime.id, ok: false, status: r.status };
    const feed = await r.json();
    // verify signature locally (HMAC sha256 over canonical envelope without signature field)
    if (feed?.signature) {
      const expected = createHmac("sha256", SECRET).update(canonicalize({
        id: feed.id, ts: feed.ts, origin_universe: feed.origin_universe,
        event_type: feed.event_type, payload: feed.payload,
      })).digest("hex");
      if (expected !== feed.signature) return { peer: prime.id, ok: false, error: "bad-signature" };
    }
    return { peer: prime.id, ok: true, count: feed.payload?.count || 0, items: (feed.payload?.items || []).slice(0, 25) };
  } catch (e) {
    return { peer: prime.id, ok: false, error: String(e.message || e).slice(0, 120) };
  }
}

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
  pullOmegaFeed(),
]);

// Update state with what we learned about each peer
for (const r of results) {
  if (r.status !== "fulfilled") continue;
  const v = r.value;
  if (v && v.peer && v.body) {
    state.peers_seen[v.peer] = { last_seen_at: new Date().toISOString(), manifest: v.body };
  }
}

// Find omega feed result + emit OMEGA_INGEST event if there are items
const omegaResult = results.find(r => r.status === "fulfilled" && r.value && Array.isArray(r.value.items));
if (omegaResult && omegaResult.value.items.length > 0) {
  const omegaEvt = makeEvent("OMEGA_INGEST", {
    pulled_from: omegaResult.value.peer,
    count: omegaResult.value.count,
    sample: omegaResult.value.items.slice(0, 5).map(i => ({ src: i.src, title: i.title, domain: i.domain })),
  });
  appendFileSync(LEDGER_PATH, JSON.stringify(omegaEvt) + "\n");
  state.omega_since = new Date().toISOString();
  state.omega_last_count = omegaResult.value.count;
  // Also POST omega event to peers so they know we've ingested
  await Promise.allSettled(PEERS.map(p => postIngest(p, omegaEvt)));
}

writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
console.log(JSON.stringify({ universe: UNIVERSE_ID, cycle: state.cycles, peers: PEERS.length, omega_count: state.omega_last_count || 0, results: results.map(r => r.status === "fulfilled" ? r.value : { error: String(r.reason).slice(0, 80) }) }, null, 2));
