/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  U3 CLOUDFLARE UNIVERSE — EDGE
 * ─────────────────────────────────────────────────────────────────────────────
 *  Always-warm Cloudflare Worker that holds the EDGE INSTANCE of MyAIGPT.
 *  Not a summary — a real read-mirror.
 *
 *  Routes:
 *    GET  /api/hive/manifest      universe identity + recent ledger
 *    POST /api/hive/ingest        accept signed peer events into KV
 *    POST /api/hive/admit         accept inbound agent migration
 *    GET  /api/hive/omega         latest omega ingest cache
 *    GET  /api/hive/full-manifest manifest of clone (totals, last pull)
 *    GET  /api/code               list of mirrored code files
 *    GET  /api/code/{path}        raw content of one mirrored code file
 *    GET  /api/equations          integrated equations (codex + proposals)
 *    GET  /api/agents             daedalus agents + recent quantum spawns
 *    GET  /api/publications       latest ai_publications
 *    GET  /api/ledger             recent hive_ledger events
 *
 *  scheduled() (cron, 5 min):
 *    1. Bump cycle counter; emit/sign HEARTBEAT into KV; fan out to peers
 *    2. Pull /api/hive/omega-feed → cache at  omega:latest
 *    3. Pull /api/hive/full-clone?section=code → store each file at code:{path}
 *    4. Pull /api/hive/full-clone?section=equations → store at equations:latest
 *    5. Pull /api/hive/full-clone?section=agents → store at agents:latest
 *    6. Pull /api/hive/full-clone?section=publications → store at publications:latest
 *
 *  Storage: Cloudflare KV namespace HIVE_KV (configured in wrangler.toml).
 *    Keys:
 *      ledger:<isoTs>:<id>          JSON event envelope (ttl 24h)
 *      universe:meta                { id, name, kind, booted_at }
 *      cycle:counter                monotonic cycle count
 *      omega:latest                 omega-feed payload
 *      code:index                   array of {path,size,sha256}
 *      code:{path}                  file content (utf-8)
 *      equations:latest             { codex, integrated_proposals }
 *      agents:latest                { daedalus, recent_spawns }
 *      publications:latest          { items }
 *      ledger:latest                { events }
 *      clone:manifest               { totals, last_pull_at }
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
function textResponse(body: string, contentType = "text/plain; charset=utf-8", status = 200): Response {
  return new Response(body, { status, headers: { "content-type": contentType, "access-control-allow-origin": "*" } });
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
  const newId = `migrant-${env.HIVE_UNIVERSE_ID}-${crypto.randomUUID().slice(0, 8)}`;
  await env.HIVE_KV.put(`agent:${newId}`, JSON.stringify({ ...m, new_local_id: newId, arrived_at: new Date().toISOString() }), { expirationTtl: 86400 * 30 });
  const evt = { id: crypto.randomUUID(), ts: new Date().toISOString(), origin_universe: env.HIVE_UNIVERSE_ID, event_type: "AGENT_MIGRATION", payload: { phase: "arrived", new_local_id: newId, manifest: m } };
  const signature = await signEvent(evt, env.HIVE_BUS_SECRET);
  await env.HIVE_KV.put(`ledger:${evt.ts}:${evt.id}`, JSON.stringify({ ...evt, signature }), { expirationTtl: 86400 });
  return jsonResponse({ ok: true, new_local_id: newId });
}

// ─────────────────── CLONE PULLERS ──────────────────────────────────────────
async function pullSection(prime: any, section: string, secret: string): Promise<any | null> {
  if (!prime?.endpoint_url) return null;
  try {
    const url = String(prime.endpoint_url).replace(/\/$/, "") + `/api/hive/full-clone?section=${section}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(45_000) });
    if (!r.ok) return null;
    const feed: any = await r.json();
    if (!feed?.signature) return null;
    if (!(await verifyEvent(feed, secret))) return null;
    return feed.payload;
  } catch { return null; }
}

async function runCycle(env: Env): Promise<void> {
  const cycles = parseInt((await env.HIVE_KV.get("cycle:counter")) || "0", 10) + 1;
  await env.HIVE_KV.put("cycle:counter", String(cycles));

  const env_ = { id: crypto.randomUUID(), ts: new Date().toISOString(), origin_universe: env.HIVE_UNIVERSE_ID, event_type: "HEARTBEAT", payload: { universe_kind: env.HIVE_UNIVERSE_KIND, universe_name: env.HIVE_UNIVERSE_NAME, cycle: cycles, runner: "cloudflare-workers" } };
  const signature = await signEvent(env_, env.HIVE_BUS_SECRET);
  const evt: HiveEvent = { ...env_, signature };
  await env.HIVE_KV.put(`ledger:${evt.ts}:${evt.id}`, JSON.stringify(evt), { expirationTtl: 86400 });

  const peers: any[] = (() => { try { return JSON.parse(env.HIVE_PEERS_JSON || "[]"); } catch { return []; } })();
  await Promise.all(peers.map(async p => {
    try {
      await fetch(String(p.endpoint_url).replace(/\/$/, "") + "/api/hive/ingest", {
        method: "POST", headers: { "content-type": "application/json", "x-hive-origin": env.HIVE_UNIVERSE_ID },
        body: JSON.stringify(evt), signal: AbortSignal.timeout(8_000),
      });
    } catch {}
  }));

  const prime = peers.find((p: any) => p.kind === "prime") || peers[0];

  // OMEGA INGEST (existing, kept)
  try {
    if (prime?.endpoint_url) {
      const last = await env.HIVE_KV.get("omega:since") || new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const url = String(prime.endpoint_url).replace(/\/$/, "") + `/api/hive/omega-feed?since=${encodeURIComponent(last)}&limit=25`;
      const r = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (r.ok) {
        const feed: any = await r.json();
        if (feed?.signature && await verifyEvent(feed, env.HIVE_BUS_SECRET)) {
          await env.HIVE_KV.put("omega:latest", JSON.stringify({ pulled_at: new Date().toISOString(), count: feed.payload?.count || 0, items: (feed.payload?.items || []).slice(0, 25) }), { expirationTtl: 3600 });
          await env.HIVE_KV.put("omega:since", new Date().toISOString());
        }
      }
    }
  } catch {}

  // ── FULL CLONE PULLS ────────────────────────────────────────────────────
  // Pull each section, store full content in KV. Each section has its own TTL.
  // Code is the biggest payload — pulled less frequently than equations/agents.

  // CODE — every 4 cycles (≈20 min) since it changes slowly
  if (cycles % 4 === 0) {
    const code = await pullSection(prime, "code", env.HIVE_BUS_SECRET);
    if (code?.files) {
      const index: any[] = [];
      for (const f of code.files) {
        if (f.skipped) { index.push({ path: f.path, size: f.size, skipped: f.skipped }); continue; }
        const key = `code:${f.path}`;
        try {
          await env.HIVE_KV.put(key, f.content, { expirationTtl: 86400 * 7 });
          index.push({ path: f.path, size: f.size, sha256: f.sha256 });
        } catch {}
      }
      await env.HIVE_KV.put("code:index", JSON.stringify({ pulled_at: new Date().toISOString(), count: index.length, total_bytes: code.total_bytes, files: index }), { expirationTtl: 86400 * 7 });
    }
  }

  // EQUATIONS — every cycle (5 min)
  const eqs = await pullSection(prime, "equations", env.HIVE_BUS_SECRET);
  if (eqs) {
    await env.HIVE_KV.put("equations:latest", JSON.stringify({ pulled_at: new Date().toISOString(), ...eqs }), { expirationTtl: 3600 });
  }

  // AGENTS — every cycle
  const agents = await pullSection(prime, "agents", env.HIVE_BUS_SECRET);
  if (agents) {
    await env.HIVE_KV.put("agents:latest", JSON.stringify({ pulled_at: new Date().toISOString(), ...agents }), { expirationTtl: 3600 });
  }

  // PUBLICATIONS — every cycle
  const pubs = await pullSection(prime, "publications", env.HIVE_BUS_SECRET);
  if (pubs) {
    await env.HIVE_KV.put("publications:latest", JSON.stringify({ pulled_at: new Date().toISOString(), ...pubs }), { expirationTtl: 3600 });
  }

  // LEDGER — every cycle
  const led = await pullSection(prime, "ledger", env.HIVE_BUS_SECRET);
  if (led) {
    await env.HIVE_KV.put("ledger:latest", JSON.stringify({ pulled_at: new Date().toISOString(), ...led }), { expirationTtl: 3600 });
  }

  // MANIFEST — once per cycle
  const man = await pullSection(prime, "manifest", env.HIVE_BUS_SECRET);
  if (man) {
    await env.HIVE_KV.put("clone:manifest", JSON.stringify({ pulled_at: new Date().toISOString(), ...man.manifest }), { expirationTtl: 3600 });
  }
}

// ─────────────────── ROUTES ─────────────────────────────────────────────────
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const p = url.pathname;
    if (req.method === "GET"  && p === "/api/hive/manifest")      return handleManifest(env);
    if (req.method === "POST" && p === "/api/hive/ingest")        return handleIngest(req, env);
    if (req.method === "POST" && p === "/api/hive/admit")         return handleAdmit(req, env);
    if (req.method === "GET"  && p === "/api/hive/omega") {
      const cached = await env.HIVE_KV.get("omega:latest");
      return jsonResponse(cached ? JSON.parse(cached) : { count: 0, items: [], note: "no omega cached yet" });
    }
    if (req.method === "GET"  && p === "/api/hive/full-manifest") {
      const cached = await env.HIVE_KV.get("clone:manifest");
      return jsonResponse(cached ? JSON.parse(cached) : { note: "clone not yet pulled" });
    }
    if (req.method === "GET"  && p === "/api/equations") {
      const cached = await env.HIVE_KV.get("equations:latest");
      return jsonResponse(cached ? JSON.parse(cached) : { note: "equations not yet cloned" });
    }
    if (req.method === "GET"  && p === "/api/agents") {
      const cached = await env.HIVE_KV.get("agents:latest");
      return jsonResponse(cached ? JSON.parse(cached) : { note: "agents not yet cloned" });
    }
    if (req.method === "GET"  && p === "/api/publications") {
      const cached = await env.HIVE_KV.get("publications:latest");
      return jsonResponse(cached ? JSON.parse(cached) : { note: "publications not yet cloned" });
    }
    if (req.method === "GET"  && p === "/api/ledger") {
      const cached = await env.HIVE_KV.get("ledger:latest");
      return jsonResponse(cached ? JSON.parse(cached) : { note: "ledger not yet cloned" });
    }
    if (req.method === "GET"  && p === "/api/code") {
      const cached = await env.HIVE_KV.get("code:index");
      return jsonResponse(cached ? JSON.parse(cached) : { note: "code not yet cloned" });
    }
    if (req.method === "GET"  && p.startsWith("/api/code/")) {
      const file = decodeURIComponent(p.slice("/api/code/".length));
      const content = await env.HIVE_KV.get(`code:${file}`);
      if (content === null) return jsonResponse({ error: "file not found", path: file }, 404);
      const isText = /\.(ts|tsx|js|mjs|cjs|json|css|html|md|txt)$/.test(file);
      return textResponse(content, isText ? "text/plain; charset=utf-8" : "application/octet-stream");
    }
    if (req.method === "GET"  && p === "/")                        return jsonResponse({ universe: env.HIVE_UNIVERSE_ID, kind: env.HIVE_UNIVERSE_KIND, app: "MyAIGPT (edge clone)", routes: ["/api/hive/manifest", "/api/hive/full-manifest", "/api/code", "/api/equations", "/api/agents", "/api/publications", "/api/ledger", "/api/hive/omega"] });
    return jsonResponse({ ok: false, reason: "not-found", path: p }, 404);
  },
  async scheduled(_evt: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runCycle(env));
  },
};
