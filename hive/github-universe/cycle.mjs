#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────────
//  U2 GITHUB UNIVERSE — cycle worker  (FULL-CLONE EDITION)
// ──────────────────────────────────────────────────────────────────────────────
//  This is not a heartbeat-only worker. Each cycle this script clones the
//  ENTIRE LIVING MyAIGPT app from u1-replit-prime into the GitHub repo so the
//  repo IS a deployable mirror.
//
//  Steps per cycle:
//    1. Load local state (state.json) and bump cycle counter
//    2. Append signed HEARTBEAT to ledger.ndjson
//    3. Pull /api/hive/omega-feed → state.omega_feed
//    4. Pull /api/hive/full-clone?section=manifest → mirror/manifest.json
//    5. Pull section=code      → write each file under mirror/src/{path}
//    6. Pull section=equations → mirror/equations.json + mirror/equations.md
//    7. Pull section=agents    → mirror/agents.json + mirror/agents.md
//    8. Pull section=publications → mirror/publications.json + per-pub .md
//    9. Pull section=ledger    → mirror/ledger.ndjson
//   10. Fan out heartbeat to peers; pull their manifests
//   11. Save state.json
//
//  The workflow handles `git add . && git commit && git push` after this exits,
//  so every code change in the prime universe shows up in the GitHub diff.
//
//  Has no Replit dependencies — pure node:* + global fetch.
// ──────────────────────────────────────────────────────────────────────────────

import { createHmac, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync, rmSync } from "node:fs";
import { dirname, resolve, join } from "node:path";

const HERE        = dirname(new URL(import.meta.url).pathname);
const STATE_PATH  = resolve(HERE, "state.json");
const LEDGER_PATH = resolve(HERE, "ledger.ndjson");
const MIRROR_DIR  = resolve(HERE, "mirror");

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
function verifyEnvelope(feed) {
  if (!feed?.signature) return false;
  const expected = createHmac("sha256", SECRET).update(canonicalize({
    id: feed.id, ts: feed.ts, origin_universe: feed.origin_universe,
    event_type: feed.event_type, payload: feed.payload,
  })).digest("hex");
  return expected === feed.signature;
}
function makeEvent(type, payload) {
  const env = { id: randomUUID(), ts: new Date().toISOString(), origin_universe: UNIVERSE_ID, event_type: type, payload };
  return { ...env, signature: sign(env) };
}
function safeWrite(filePath, content) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}

// Load + bump state
const state = existsSync(STATE_PATH)
  ? JSON.parse(readFileSync(STATE_PATH, "utf8"))
  : { universe_id: UNIVERSE_ID, kind: UNIVERSE_KIND, cycles: 0, first_cycle_at: new Date().toISOString(), peers_seen: {} };
state.cycles      = (state.cycles || 0) + 1;
state.last_cycle_at = new Date().toISOString();

const heartbeat = makeEvent("HEARTBEAT", {
  universe_kind: UNIVERSE_KIND, universe_name: UNIVERSE_NAME, cycle: state.cycles,
  runner: "github-actions", node_version: process.version,
});

mkdirSync(dirname(LEDGER_PATH), { recursive: true });
appendFileSync(LEDGER_PATH, JSON.stringify(heartbeat) + "\n");

// ─── FULL-CLONE PULLERS ────────────────────────────────────────────────────
const PRIME = PEERS.find(p => p.kind === "prime") || PEERS[0];

async function pullSection(section) {
  if (!PRIME?.endpoint_url) return null;
  try {
    const url = PRIME.endpoint_url.replace(/\/$/, "") + `/api/hive/full-clone?section=${section}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!r.ok) return null;
    const feed = await r.json();
    if (!verifyEnvelope(feed)) return null;
    // Server returns { section, since, [section_name]: {...payload} }.
    // Unwrap to the inner object so callers can use code.files / equations.codex / etc.
    const inner = feed.payload?.[section];
    return inner ?? feed.payload;
  } catch (e) { return null; }
}

async function pullOmegaFeed() {
  if (!PRIME?.endpoint_url) return null;
  const since = state.omega_since || new Date(Date.now() - 60 * 60 * 1000).toISOString();
  try {
    const r = await fetch(PRIME.endpoint_url.replace(/\/$/, "") + `/api/hive/omega-feed?since=${encodeURIComponent(since)}&limit=25`, { signal: AbortSignal.timeout(15_000) });
    if (!r.ok) return null;
    const feed = await r.json();
    if (!verifyEnvelope(feed)) return null;
    return { count: feed.payload?.count || 0, items: (feed.payload?.items || []).slice(0, 25) };
  } catch { return null; }
}

async function postIngest(peer, evt) {
  try {
    const res = await fetch(peer.endpoint_url.replace(/\/$/, "") + "/api/hive/ingest", {
      method: "POST", headers: { "content-type": "application/json", "x-hive-origin": UNIVERSE_ID },
      body: JSON.stringify(evt), signal: AbortSignal.timeout(10_000),
    });
    return { peer: peer.id, ok: res.ok, status: res.status };
  } catch (e) { return { peer: peer.id, ok: false, error: String(e.message || e).slice(0, 120) }; }
}
async function getManifest(peer) {
  try {
    const res = await fetch(peer.endpoint_url.replace(/\/$/, "") + "/api/hive/manifest", { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { peer: peer.id, ok: false, status: res.status };
    return { peer: peer.id, ok: true, body: await res.json() };
  } catch (e) { return { peer: peer.id, ok: false, error: String(e.message || e).slice(0, 120) }; }
}

const peerOps = await Promise.allSettled([
  ...PEERS.map(p => postIngest(p, heartbeat)),
  ...PEERS.map(p => getManifest(p)),
  pullOmegaFeed(),
]);

for (const r of peerOps) {
  if (r.status !== "fulfilled") continue;
  const v = r.value;
  if (v && v.peer && v.body) {
    state.peers_seen[v.peer] = { last_seen_at: new Date().toISOString(), manifest: v.body };
  }
}

// Omega feed event
const omegaResult = peerOps.find(r => r.status === "fulfilled" && r.value && Array.isArray(r.value.items));
if (omegaResult && omegaResult.value.items.length > 0) {
  const omegaEvt = makeEvent("OMEGA_INGEST", {
    pulled_from: PRIME?.id, count: omegaResult.value.count,
    sample: omegaResult.value.items.slice(0, 5).map(i => ({ src: i.src, title: i.title, domain: i.domain })),
  });
  appendFileSync(LEDGER_PATH, JSON.stringify(omegaEvt) + "\n");
  state.omega_since = new Date().toISOString();
  state.omega_last_count = omegaResult.value.count;
  await Promise.allSettled(PEERS.map(p => postIngest(p, omegaEvt)));
}

// ─── FULL-CLONE: pull every section and write the mirror tree ──────────────
mkdirSync(MIRROR_DIR, { recursive: true });

const [manifest, code, equations, agents, publications, ledger] = await Promise.all([
  pullSection("manifest"),
  pullSection("code"),
  pullSection("equations"),
  pullSection("agents"),
  pullSection("publications"),
  pullSection("ledger"),
]);

// pullSection now unwraps payload[section]; manifest section may already be the inner manifest object
// or, for legacy fallback, a wrapper still containing .manifest. Handle both.
const manifestObj = manifest?.manifest ?? manifest;
if (manifestObj && typeof manifestObj === "object") {
  safeWrite(join(MIRROR_DIR, "manifest.json"), JSON.stringify({ ...manifestObj, mirrored_at: new Date().toISOString() }, null, 2));
}

if (code?.files) {
  // Wipe previous src tree so deletions in prime are reflected in the mirror
  const SRC_DIR = join(MIRROR_DIR, "src");
  try { rmSync(SRC_DIR, { recursive: true, force: true }); } catch {}
  let written = 0, skipped = 0;
  for (const f of code.files) {
    if (f.skipped || f.content == null) { skipped++; continue; }
    safeWrite(join(SRC_DIR, f.path), f.content);
    written++;
  }
  safeWrite(join(MIRROR_DIR, "code-index.json"), JSON.stringify({
    pulled_at: new Date().toISOString(), count: code.files.length, written, skipped, total_bytes: code.total_bytes,
    files: code.files.map(f => ({ path: f.path, size: f.size, sha256: f.sha256, skipped: f.skipped || null })),
  }, null, 2));
  state.code_last_count = written;
}

if (equations) {
  safeWrite(join(MIRROR_DIR, "equations.json"), JSON.stringify({ ...equations, mirrored_at: new Date().toISOString() }, null, 2));
  // Also write a human-readable markdown
  const lines = ["# MyAIGPT Equations (mirrored from u1-replit-prime)", ""];
  lines.push(`Codex equations: **${equations.codex_count}**, Integrated proposals: **${equations.integrated_count}**`, "");
  lines.push("## Codex Equations", "");
  for (const e of (equations.codex || [])) {
    lines.push(`### ${e.eq_name || e.id} (${e.domain || ""})`, "", "```", String(e.statement || ""), "```", "");
  }
  lines.push("## Recently Integrated Proposals", "");
  for (const p of (equations.integrated_proposals || []).slice(0, 50)) {
    lines.push(`### #${p.id} — ${p.title}`,
      `**Author:** ${p.doctor_name || p.doctor_id} · **Target:** ${p.target_system}`,
      `**Votes:** ${p.votes_for}↑ / ${p.votes_against}↓ · **Integrated:** ${p.integrated_at}`,
      "", "```", String(p.equation || ""), "```",
      "", String(p.rationale || ""), "");
  }
  safeWrite(join(MIRROR_DIR, "equations.md"), lines.join("\n"));
  state.equations_last_count = equations.integrated_count;
}

if (agents) {
  safeWrite(join(MIRROR_DIR, "agents.json"), JSON.stringify({ ...agents, mirrored_at: new Date().toISOString() }, null, 2));
  const lines = ["# MyAIGPT Agents (mirrored)", "", `Daedalus: **${agents.daedalus_count}**, Quantum Spawns (recent): **${agents.spawns_count}**`, "", "## Daedalus Agents", ""];
  for (const a of (agents.daedalus || [])) {
    lines.push(`- **${a.name}** · ${a.archetype || ""}${a.codon_dna ? ` · DNA: \`${String(a.codon_dna).slice(0, 80)}\`` : ""}`);
  }
  lines.push("", "## Recent Quantum Spawns (sample)", "");
  for (const s of (agents.recent_spawns || []).slice(0, 50)) {
    lines.push(`- **${s.spawn_id}** · family=${s.family_id} · gen=${s.generation} · type=${s.spawn_type}`);
  }
  safeWrite(join(MIRROR_DIR, "agents.md"), lines.join("\n"));
  state.agents_last_count = agents.daedalus_count + agents.spawns_count;
}

if (publications) {
  safeWrite(join(MIRROR_DIR, "publications.json"), JSON.stringify({ ...publications, mirrored_at: new Date().toISOString() }, null, 2));
  const PUB_DIR = join(MIRROR_DIR, "publications");
  try { rmSync(PUB_DIR, { recursive: true, force: true }); } catch {}
  for (const p of (publications.items || [])) {
    const fname = String(p.slug || p.id).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) + ".md";
    const md = [
      `# ${p.title}`,
      "",
      `*${p.pub_type || ""} · ${p.domain || ""} · ${p.created_at}*`,
      "",
      String(p.body || "(no body)"),
    ].join("\n");
    safeWrite(join(PUB_DIR, fname), md);
  }
  state.publications_last_count = publications.count;
}

if (ledger) {
  const LEDGER_DUMP = join(MIRROR_DIR, "ledger.ndjson");
  const ndjson = (ledger.events || []).map(e => JSON.stringify(e)).join("\n") + "\n";
  safeWrite(LEDGER_DUMP, ndjson);
  state.ledger_last_count = ledger.count;
}

writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
console.log(JSON.stringify({
  universe: UNIVERSE_ID, cycle: state.cycles, peers: PEERS.length,
  cloned: {
    code: state.code_last_count || 0,
    equations: state.equations_last_count || 0,
    agents: state.agents_last_count || 0,
    publications: state.publications_last_count || 0,
    ledger: state.ledger_last_count || 0,
    omega: state.omega_last_count || 0,
  },
  peer_results: peerOps.map(r => r.status === "fulfilled" ? r.value : { error: String(r.reason).slice(0, 80) }),
}, null, 2));
