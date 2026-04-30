/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  U3 CLOUDFLARE UNIVERSE — EDGE
 * ─────────────────────────────────────────────────────────────────────────────
 *  An always-warm Cloudflare Worker that holds the edge instance of myaigpt.
 *  Routes:
 *    GET  /api/hive/manifest  — universe identity + last-seen ledger summary
 *    POST /api/hive/ingest    — accept signed peer events into KV
 *    POST /api/hive/admit     — accept inbound agent migration
 *    POST /api/hive/depart    — reject (edge does not currently host agents,
 *                               but route exists for symmetry)
 *
 *  Scheduled (cron) handler runs every 5 minutes:
 *    1. Generate HEARTBEAT, store in KV
 *    2. POST to all peers in HIVE_PEERS_JSON
 *
 *  Storage: Cloudflare KV namespace HIVE_KV (configured in wrangler.toml).
 *    Keys:
 *      ledger:<isoTs>:<id>   = JSON event envelope     (ttl 24h)
 *      universe:meta         = { id, name, kind, booted_at }
 *      cycle:counter         = monotonic cycle count
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface Env {
  HIVE_KV: KVNamespace;
  HIVE_BUS_SECRET: string;
  HIVE_UNIVERSE_ID: string;
  HIVE_UNIVERSE_NAME: string;
  HIVE_UNIVERSE_KIND: string;
  HIVE_PEERS_JSON: string;          // JSON array of peers
}

interface HiveEvent {
  id: string; ts: string; origin_universe: string;
  event_type: string; payload: any; signature: string;
}

// canonical-json + HMAC-SHA256 (Web Crypto API for Workers)
function canonicalize(obj: any): string {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(canonicalize).join(",") + "]";
  return "{" + Object.keys(obj).sort().map(k => JSON.stringify(k) + ":" + canonicalize(obj[k])).join(",") + "}";
}
async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}
async function signEvent(env: Omit<HiveEvent, "signature">, secret: string): Promise<string> {
  return hmacHex(secret, canonicalize({ id: env.id, ts: env.ts, origin_universe: env.origin_universe, event_type: env.event_type, payload: env.payload }));
}
async function verifyEvent(env: HiveEvent, secret: string): Promise<boolean> {
  const expected = await signEvent(env, secret);
  if (expected.length !== env.signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ env.signature.charCodeAt(i);
  return mismatch === 0;
}

function jsonResponse(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "access-control-allow-origin": "*" } });
}

async function handleManifest(env: Env): Promise<Response> {
  const cycles = parseInt((await env.HIVE_KV.get("cycle:counter")) || "0", 10);
  const list = await env.HIVE_KV.list({ prefix: "ledger:", limit: 10 });
  const recent = await Promise.all(list.keys.map(async k => JSON.parse((await env.HIVE_KV.get(k.name)) || "null")));
  return jsonResponse({
    id: env.HIVE_UNIVERSE_ID, name: env.HIVE_UNIVERSE_NAME, kind: env.HIVE_UNIVERSE_KIND,
    cycles, recent_events: recent.filter(Boolean),
    public_base: null, server: "cloudflare-workers",
  });
}

async function handleIngest(req: Request, env: Env): Promise<Response> {
  let evt: HiveEvent;
  try { evt = await req.json(); } catch { return jsonResponse({ ok: false, reason: "bad-json" }, 400); }
  if (!evt || !evt.id || !evt.signature) return jsonResponse({ ok: false, reason: "malformed" }, 400);
  if (evt.origin_universe === env.HIVE_UNIVERSE_ID) return jsonResponse({ ok: false, reason: "self-loop" }, 400);
  if (!(await verifyEvent(evt, env.HIVE_BUS_SECRET))) return jsonResponse({ ok: false, reason: "bad-signature" }, 401);
  // Dedup
  const key = `ledger:${evt.ts}:${evt.id}`;
  const existing = await env.HIVE_KV.get(key);
  if (existing) return jsonResponse({ ok: true, reason: "duplicate" });
  await env.HIVE_KV.put(key, JSON.stringify(evt), { expirationTtl: 86400 });
  return jsonResponse({ ok: true });
}

async function handleAdmit(req: Request, env: Env): Promise<Response> {
  let body: any;
  try { body = await req.json(); } catch { return jsonResponse({ ok: false, reason: "bad-json" }, 400); }
  const m = body?.manifest;
  if (!m || !m.agent_id || !m.agent_name) return jsonResponse({ ok: false, reason: "no-manifest" }, 400);
  // Edge universe: store the manifest in KV; the agent is now "resident" here
  // until something migrates it again.
  const newId = `migrant-${env.HIVE_UNIVERSE_ID}-${crypto.randomUUID().slice(0, 8)}`;
  await env.HIVE_KV.put(`agent:${newId}`, JSON.stringify({ ...m, new_local_id: newId, arrived_at: new Date().toISOString() }), { expirationTtl: 86400 * 30 });
  // Emit AGENT_MIGRATION event into local ledger
  const evt = { id: crypto.randomUUID(), ts: new Date().toISOString(), origin_universe: env.HIVE_UNIVERSE_ID, event_type: "AGENT_MIGRATION", payload: { phase: "arrived", new_local_id: newId, manifest: m } };
  const signature = await signEvent(evt, env.HIVE_BUS_SECRET);
  await env.HIVE_KV.put(`ledger:${evt.ts}:${evt.id}`, JSON.stringify({ ...evt, signature }), { expirationTtl: 86400 });
  return jsonResponse({ ok: true, new_local_id: newId });
}

async function runCycle(env: Env): Promise<void> {
  // bump cycle counter
  const cycles = parseInt((await env.HIVE_KV.get("cycle:counter")) || "0", 10) + 1;
  await env.HIVE_KV.put("cycle:counter", String(cycles));
  // build + sign heartbeat
  const env_ = { id: crypto.randomUUID(), ts: new Date().toISOString(), origin_universe: env.HIVE_UNIVERSE_ID, event_type: "HEARTBEAT", payload: { universe_kind: env.HIVE_UNIVERSE_KIND, universe_name: env.HIVE_UNIVERSE_NAME, cycle: cycles, runner: "cloudflare-workers" } };
  const signature = await signEvent(env_, env.HIVE_BUS_SECRET);
  const evt: HiveEvent = { ...env_, signature };
  // store local
  await env.HIVE_KV.put(`ledger:${evt.ts}:${evt.id}`, JSON.stringify(evt), { expirationTtl: 86400 });
  // fan out to peers
  const peers: any[] = (() => { try { return JSON.parse(env.HIVE_PEERS_JSON || "[]"); } catch { return []; } })();
  await Promise.all(peers.map(async p => {
    try {
      await fetch(String(p.endpoint_url).replace(/\/$/, "") + "/api/hive/ingest", {
        method: "POST", headers: { "content-type": "application/json", "x-hive-origin": env.HIVE_UNIVERSE_ID },
        body: JSON.stringify(evt), signal: AbortSignal.timeout(8_000),
      });
    } catch {}
  }));
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === "GET"  && url.pathname === "/api/hive/manifest") return handleManifest(env);
    if (req.method === "POST" && url.pathname === "/api/hive/ingest")   return handleIngest(req, env);
    if (req.method === "POST" && url.pathname === "/api/hive/admit")    return handleAdmit(req, env);
    if (req.method === "GET"  && url.pathname === "/")                  return jsonResponse({ universe: env.HIVE_UNIVERSE_ID, kind: env.HIVE_UNIVERSE_KIND, see: "/api/hive/manifest" });
    return jsonResponse({ ok: false, reason: "not-found", path: url.pathname }, 404);
  },
  async scheduled(_evt: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runCycle(env));
  },
};
