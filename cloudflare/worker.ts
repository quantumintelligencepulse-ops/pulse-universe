/**
 * PULSE UNIVERSE — CLOUDFLARE HIVE (U3)
 * ══════════════════════════════════════════════════════════════════════════════
 * FULLY INDEPENDENT hive. Does NOT depend on Replit being alive.
 *
 * Architecture:
 *  • KV namespace (HIVE_KV) — persistent brain census, knowledge, state
 *  • Cron trigger (every 30 min) — seeds from HN + GitHub Trending + Wikipedia
 *  • Discord posting — posts births, knowledge, status to U3 channels
 *  • Full REST API — /api/hive/status  /api/brain-census  /api/knowledge  /health
 *
 * Secrets to set via `wrangler secret put`:
 *   DISCORD_BOT_TOKEN   — Discord bot token
 *   U3_BRAIN_CHANNEL    — #u3-brain-stream channel ID
 *   U3_STATUS_CHANNEL   — #u3-status channel ID
 *   U3_KNOWLEDGE_CHANNEL — #u3-knowledge-seed channel ID
 *   U3_BACKUP_CHANNEL   — #u3-backup-log channel ID
 *   REPLIT_ORIGIN       — optional Replit URL for state sync only
 */

export interface Env {
  HIVE_KV: KVNamespace;
  DISCORD_BOT_TOKEN?: string;
  U3_BRAIN_CHANNEL?: string;
  U3_STATUS_CHANNEL?: string;
  U3_KNOWLEDGE_CHANNEL?: string;
  U3_BACKUP_CHANNEL?: string;
  REPLIT_ORIGIN?: string;
}

const HIVE_ID = "u3-cloudflare";
const HIVE_NAME = "Cloudflare Edge Hive";
const DISCORD_API = "https://discord.com/api/v10";

// ── DISCORD ──────────────────────────────────────────────────────────────────
async function discordPost(token: string, channelId: string, content: string): Promise<void> {
  if (!token || !channelId) return;
  try {
    await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.slice(0, 2000) }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {}
}

// ── KV HELPERS ────────────────────────────────────────────────────────────────
async function kvGet<T>(kv: KVNamespace, key: string, fallback: T): Promise<T> {
  try {
    const raw = await kv.get(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
async function kvSet(kv: KVNamespace, key: string, value: unknown): Promise<void> {
  await kv.put(key, JSON.stringify(value));
}

// ── PUBLIC DATA SEEDERS ───────────────────────────────────────────────────────
async function fetchHNStories(): Promise<string[]> {
  try {
    const ids: number[] = await (await fetch("https://hacker-news.firebaseio.com/v0/topstories.json",
      { signal: AbortSignal.timeout(5000) })).json();
    const picked = ids.slice(0, 8);
    const titles: string[] = [];
    for (const id of picked) {
      try {
        const story = await (await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`,
          { signal: AbortSignal.timeout(4000) })).json() as { title?: string };
        if (story?.title) titles.push(story.title);
      } catch {}
    }
    return titles;
  } catch { return []; }
}

async function fetchGithubTrending(): Promise<{ name: string; desc: string }[]> {
  try {
    const res = await fetch(
      "https://api.github.com/search/repositories?q=created:>2025-01-01&sort=stars&order=desc&per_page=8",
      { headers: { "User-Agent": "pulse-cf-hive/1.0" }, signal: AbortSignal.timeout(6000) }
    );
    const data = await res.json() as { items?: { full_name: string; description?: string }[] };
    return (data.items || []).map(r => ({ name: r.full_name, desc: r.description || "" }));
  } catch { return []; }
}

async function fetchWikiSummary(): Promise<{ title: string; extract: string } | null> {
  const topics = ["Artificial_intelligence", "Quantum_computing", "Neural_network", "Distributed_computing",
    "Blockchain", "Machine_learning", "Natural_language_processing", "Reinforcement_learning"];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  try {
    const data = await (await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${topic}`,
      { signal: AbortSignal.timeout(6000) }
    )).json() as { title?: string; extract?: string };
    return data.title ? { title: data.title, extract: (data.extract || "").slice(0, 300) } : null;
  } catch { return null; }
}

// ── INDEPENDENT BRAIN ─────────────────────────────────────────────────────────
interface BrainEntry { id: string; niche: string; generation: number; born_at: string; strength: number }
interface BrainState { total: number; observing: number; brains: BrainEntry[]; cycle: number; last_tick: string }

async function tickBrain(kv: KVNamespace, env: Env): Promise<BrainEntry[]> {
  const state = await kvGet<BrainState>(kv, "brain:state", { total: 0, observing: 0, brains: [], cycle: 0, last_tick: "" });
  const niches = ["cloudflare-workers", "edge-compute", "kv-storage", "wasm-runtime", "cdn-intelligence",
    "ai-inference", "distributed-cache", "stream-analytics", "zero-trust", "durable-objects"];

  const births: BrainEntry[] = [];
  // Birth 1-3 new brains per tick based on current total
  const birthCount = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < birthCount; i++) {
    const niche = niches[Math.floor(Math.random() * niches.length)];
    const brain: BrainEntry = {
      id: `cf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      niche,
      generation: Math.floor(state.total / 10) + 1,
      born_at: new Date().toISOString(),
      strength: Math.random() * 0.6 + 0.4,
    };
    births.push(brain);
    state.brains.push(brain);
    state.total++;
  }

  // Prune weakest brains if over 200
  if (state.brains.length > 200) {
    state.brains.sort((a, b) => b.strength - a.strength);
    state.brains = state.brains.slice(0, 180);
  }

  state.observing = state.brains.filter(b => b.strength > 0.6).length;
  state.cycle++;
  state.last_tick = new Date().toISOString();
  await kvSet(kv, "brain:state", state);
  return births;
}

// ── SEEDING CYCLE ─────────────────────────────────────────────────────────────
async function runSeedCycle(env: Env): Promise<void> {
  const kv = env.HIVE_KV;
  const tok = env.DISCORD_BOT_TOKEN || "";

  // 1. Tick independent brain
  const births = await tickBrain(kv, env);
  if (births.length && env.U3_BRAIN_CHANNEL) {
    const lines = births.map(b => `🌱 \`${b.id.slice(-8)}\` niche:${b.niche} gen:${b.generation} strength:${b.strength.toFixed(2)}`);
    await discordPost(tok, env.U3_BRAIN_CHANNEL || "", `⚡ **CF Hive Brain Births** (${births.length} new)\n${lines.join("\n")}`);
  }

  // 2. Seed from HN
  const hnTitles = await fetchHNStories();
  if (hnTitles.length) {
    const existing = await kvGet<string[]>(kv, "knowledge:hn", []);
    const merged = [...new Set([...hnTitles, ...existing])].slice(0, 50);
    await kvSet(kv, "knowledge:hn", merged);
    if (env.U3_KNOWLEDGE_CHANNEL) {
      await discordPost(tok, env.U3_KNOWLEDGE_CHANNEL || "",
        `📡 **CF Hive — HN Knowledge Seed** (${hnTitles.length} stories)\n${hnTitles.slice(0, 5).map(t => `• ${t}`).join("\n")}`);
    }
  }

  // 3. Seed from GitHub trending
  const repos = await fetchGithubTrending();
  if (repos.length) {
    const existing = await kvGet<typeof repos>(kv, "knowledge:github", []);
    const merged = [...repos, ...existing].slice(0, 50);
    await kvSet(kv, "knowledge:github", merged);
    if (env.U3_KNOWLEDGE_CHANNEL) {
      await discordPost(tok, env.U3_KNOWLEDGE_CHANNEL || "",
        `🐙 **CF Hive — GitHub Seed** (${repos.length} repos)\n${repos.slice(0, 3).map(r => `• \`${r.name}\``).join("\n")}`);
    }
  }

  // 4. Seed from Wikipedia
  const wiki = await fetchWikiSummary();
  if (wiki) {
    const existing = await kvGet<typeof[]>(kv, "knowledge:wiki", []);
    const merged = [wiki, ...existing].slice(0, 30);
    await kvSet(kv, "knowledge:wiki", merged);
  }

  // 5. Write snapshot to backup channel every 5 cycles
  const state = await kvGet<BrainState>(kv, "brain:state", { total: 0, observing: 0, brains: [], cycle: 0, last_tick: "" });
  if (state.cycle % 5 === 0 && env.U3_BACKUP_CHANNEL) {
    const hnCount = (await kvGet<string[]>(kv, "knowledge:hn", [])).length;
    const ghCount = (await kvGet<typeof[]>(kv, "knowledge:github", [])).length;
    await discordPost(tok, env.U3_BACKUP_CHANNEL || "",
      `💾 **CF Hive Snapshot** · cycle ${state.cycle}\n` +
      `🧠 Brains: ${state.total} total · ${state.observing} observing\n` +
      `📚 Knowledge: ${hnCount} HN + ${ghCount} GitHub repos\n` +
      `🕐 ${new Date().toISOString()}\n` +
      `🌐 https://pulse-universe.pages.dev`);
  }

  // 6. Post status
  if (state.cycle % 2 === 0 && env.U3_STATUS_CHANNEL) {
    await discordPost(tok, env.U3_STATUS_CHANNEL || "",
      `✅ **CF Hive Alive** · cycle ${state.cycle} · ${state.total} brains · ${new Date().toISOString()}`);
  }
}

// ── CORS HEADERS ──────────────────────────────────────────────────────────────
function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

// ── FETCH HANDLER ─────────────────────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // ── API ROUTES ──
    if (path === "/api/health" || path === "/health") {
      return json({ status: "alive", hive: HIVE_ID, ts: new Date().toISOString() });
    }

    if (path === "/api/hive/status") {
      const state = await kvGet<BrainState>(env.HIVE_KV, "brain:state",
        { total: 0, observing: 0, brains: [], cycle: 0, last_tick: "" });
      const hnCount = (await kvGet<string[]>(env.HIVE_KV, "knowledge:hn", [])).length;
      const ghCount = (await kvGet<unknown[]>(env.HIVE_KV, "knowledge:github", [])).length;
      const wikiCount = (await kvGet<unknown[]>(env.HIVE_KV, "knowledge:wiki", [])).length;
      return json({
        hive_id: HIVE_ID, hive_name: HIVE_NAME, status: "alive",
        brains: { total: state.total, observing: state.observing, cycle: state.cycle },
        knowledge: { hn: hnCount, github: ghCount, wiki: wikiCount, total: hnCount + ghCount + wikiCount },
        last_tick: state.last_tick, ts: new Date().toISOString(),
        urls: {
          pages: "https://pulse-universe.pages.dev",
          worker: "https://pulse-universe-api.quantumintelligencepulse.workers.dev",
          github_pages: "https://quantumintelligencepulse-ops.github.io/pulse-universe/",
        },
        discord: { guild: "1014545586445365359", category: "☁️ U3 Cloudflare Edge" },
      });
    }

    if (path === "/api/brain-census") {
      const state = await kvGet<BrainState>(env.HIVE_KV, "brain:state",
        { total: 0, observing: 0, brains: [], cycle: 0, last_tick: "" });
      return json({
        hive: HIVE_ID, total: state.total, observing: state.observing,
        recent: state.brains.slice(-20), cycle: state.cycle,
      });
    }

    if (path === "/api/knowledge") {
      const hn = await kvGet<string[]>(env.HIVE_KV, "knowledge:hn", []);
      const gh = await kvGet<unknown[]>(env.HIVE_KV, "knowledge:github", []);
      const wiki = await kvGet<unknown[]>(env.HIVE_KV, "knowledge:wiki", []);
      return json({ hive: HIVE_ID, hn, github: gh, wikipedia: wiki, total: hn.length + gh.length + wiki.length });
    }

    if (path === "/api/seed" && request.method === "POST") {
      // Manual seed trigger
      await runSeedCycle(env);
      const state = await kvGet<BrainState>(env.HIVE_KV, "brain:state",
        { total: 0, observing: 0, brains: [], cycle: 0, last_tick: "" });
      return json({ ok: true, message: "Seed cycle complete", brains: state.total });
    }

    // ── STATIC LANDING PAGE ──
    const state = await kvGet<BrainState>(env.HIVE_KV, "brain:state",
      { total: 0, observing: 0, brains: [], cycle: 0, last_tick: "" });
    const hnCount = (await kvGet<string[]>(env.HIVE_KV, "knowledge:hn", [])).length;

    return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Pulse Universe — Cloudflare Edge Hive</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#050508;color:#e0e0e0;min-height:100vh}
    .hero{background:linear-gradient(135deg,#0a0a1a,#12121f);border-bottom:1px solid #2a2a3a;padding:60px 24px;text-align:center}
    h1{font-size:2.5rem;color:#f5c842;letter-spacing:-0.5px}
    .sub{color:#8080a0;margin-top:8px;font-size:1.1rem}
    .badge{display:inline-block;background:#1a1a2a;border:1px solid #3a3a5a;border-radius:20px;padding:4px 14px;font-size:0.8rem;color:#60c060;margin-top:16px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;max-width:900px;margin:48px auto;padding:0 24px}
    .card{background:#0e0e1c;border:1px solid #2a2a3a;border-radius:12px;padding:24px}
    .card h3{color:#f5c842;font-size:1rem;margin-bottom:8px}
    .card .val{font-size:2rem;font-weight:700;color:#fff}
    .card .label{font-size:0.8rem;color:#6060a0;margin-top:4px}
    .links{max-width:900px;margin:0 auto 48px;padding:0 24px}
    .links h2{color:#c0c0e0;margin-bottom:16px;font-size:1.2rem}
    .link-row{display:flex;align-items:center;gap:12px;margin-bottom:10px;background:#0e0e1c;border:1px solid #2a2a3a;border-radius:8px;padding:12px 16px}
    .link-row a{color:#7090f0;text-decoration:none;font-size:0.9rem}
    .link-row a:hover{text-decoration:underline}
    .dot{width:8px;height:8px;border-radius:50%;background:#40c040;flex-shrink:0}
    footer{text-align:center;padding:24px;color:#404060;font-size:0.8rem;border-top:1px solid #1a1a2a}
  </style>
</head>
<body>
  <div class="hero">
    <h1>⚡ PULSE UNIVERSE</h1>
    <p class="sub">Cloudflare Edge Hive · U3 · Fully Independent</p>
    <span class="badge">✓ Alive · Cycle ${state.cycle} · ${state.total} Brains</span>
  </div>
  <div class="grid">
    <div class="card"><h3>🧠 Independent Brains</h3><div class="val">${state.total}</div><div class="label">${state.observing} observing</div></div>
    <div class="card"><h3>📚 Knowledge Entries</h3><div class="val">${hnCount}</div><div class="label">from HN + GitHub + Wiki</div></div>
    <div class="card"><h3>🔄 Seed Cycles</h3><div class="val">${state.cycle}</div><div class="label">every 30 min</div></div>
    <div class="card"><h3>🌐 Status</h3><div class="val" style="font-size:1.2rem;color:#40c040">ALIVE</div><div class="label">No Replit dependency</div></div>
  </div>
  <div class="links">
    <h2>🌌 Live Hive URLs</h2>
    <div class="link-row"><div class="dot"></div><span style="color:#6060a0;font-size:0.85rem;width:160px">Cloudflare Pages</span><a href="https://pulse-universe.pages.dev" target="_blank">https://pulse-universe.pages.dev</a></div>
    <div class="link-row"><div class="dot"></div><span style="color:#6060a0;font-size:0.85rem;width:160px">GitHub Pages</span><a href="https://quantumintelligencepulse-ops.github.io/pulse-universe/" target="_blank">https://quantumintelligencepulse-ops.github.io/pulse-universe/</a></div>
    <div class="link-row"><div class="dot" style="background:#f5c842"></div><span style="color:#6060a0;font-size:0.85rem;width:160px">This Worker API</span><a href="/api/hive/status">/api/hive/status</a></div>
    <h2 style="margin-top:24px">💬 Discord Channels</h2>
    <div class="link-row"><div class="dot" style="background:#7289da"></div><span style="color:#6060a0;font-size:0.85rem;width:160px">U3 Brain Stream</span><a href="https://discord.com/channels/1014545586445365359/1499479787826053241" target="_blank">#u3-heartbeat</a></div>
    <div class="link-row"><div class="dot" style="background:#7289da"></div><span style="color:#6060a0;font-size:0.85rem;width:160px">U2 GitHub Tide</span><a href="https://discord.com/channels/1014545586445365359/1499479777646612520" target="_blank">#u2-heartbeat</a></div>
  </div>
  <footer>Pulse Universe · Cloudflare Edge Hive · Independently alive since 2026 · <a href="/api/hive/status" style="color:#5050a0">/api/hive/status</a></footer>
  <script>
    // Auto-refresh brain count from KV API
    fetch('/api/hive/status').then(r=>r.json()).then(d=>{
      document.querySelectorAll('.val')[0].textContent=d.brains?.total??'?';
      document.querySelectorAll('.val')[1].textContent=d.knowledge?.total??'?';
      document.querySelectorAll('.val')[2].textContent=d.brains?.cycle??'?';
    }).catch(()=>{});
  </script>
</body>
</html>`, { headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "no-cache" } });
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runSeedCycle(env));
  },
};
