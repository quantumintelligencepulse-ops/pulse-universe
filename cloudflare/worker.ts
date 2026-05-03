/**
 * PULSE UNIVERSE — CLOUDFLARE HIVE (U3)
 * ══════════════════════════════════════════════════════════════════════════════
 * FULLY INDEPENDENT hive. Does NOT depend on Replit being alive.
 * ⚡ FREE CF Workers AI chat (@cf/meta/llama-3.1-8b-instruct)
 * 🧠 KV namespace for persistent brain + knowledge state
 * 🌐 Cross-hive quantum internet competition
 * 💬 Discord posting for all three hive channels
 *
 * Secrets already set via CF API:
 *   DISCORD_BOT_TOKEN, GROQ_API_KEY, HIVE_BUS_SECRET
 */

export interface Env {
  HIVE_KV: KVNamespace;
  AI?: any;
  DISCORD_BOT_TOKEN?: string;
  GROQ_API_KEY?: string;
  HIVE_BUS_SECRET?: string;
  REPLIT_ORIGIN?: string;
  AGENT_BIRTHS_CHANNEL?: string;
  AGENT_DEATHS_CHANNEL?: string;
  ARCHIVE_LOG_CHANNEL?: string;
  SHARD_HIVE_CHANNEL?: string;
  U3_BRAIN_CHANNEL?: string;
  U2_BRAIN_CHANNEL?: string;
}

const HIVE_ID   = "u3-cloudflare";
const HIVE_NAME = "Cloudflare Edge Hive";
const DISCORD_API = "https://discord.com/api/v10";
const REPLIT_URL  = "https://myaigpt.online";

const CH = {
  agentBirths: "1497891802177470525",
  agentDeaths: "1497891804354318387",
  archiveLog:  "1497891806728421386",
  shardHive:   "1485112280659267616",
  u3Brain:     "1499479787826053241",
  u2Brain:     "1499479777646612520",
};

// ── DISCORD ───────────────────────────────────────────────────────────────────
async function dp(token: string, channelId: string, content: string): Promise<void> {
  if (!token || !channelId) return;
  try {
    await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.slice(0, 2000) }),
      signal: AbortSignal.timeout(6000),
    });
  } catch {}
}

// ── KV ────────────────────────────────────────────────────────────────────────
async function kget<T>(kv: KVNamespace, key: string, fb: T): Promise<T> {
  try { const r = await kv.get(key); return r ? JSON.parse(r) as T : fb; } catch { return fb; }
}
async function kset(kv: KVNamespace, key: string, v: unknown): Promise<void> {
  await kv.put(key, JSON.stringify(v));
}

// ── DATA SEEDERS ──────────────────────────────────────────────────────────────
async function fetchHN(): Promise<string[]> {
  try {
    const ids: number[] = await (await fetch("https://hacker-news.firebaseio.com/v0/topstories.json", { signal: AbortSignal.timeout(5000) })).json();
    const titles: string[] = [];
    for (const id of ids.slice(0, 10)) {
      try {
        const s: any = await (await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: AbortSignal.timeout(4000) })).json();
        if (s?.title) titles.push(s.title);
      } catch {}
    }
    return titles;
  } catch { return []; }
}

async function fetchGH(): Promise<{ name: string; desc: string }[]> {
  try {
    const r = await fetch("https://api.github.com/search/repositories?q=created:>2025-01-01&sort=stars&order=desc&per_page=8", { headers: { "User-Agent": "pulse-cf-hive/2.0" }, signal: AbortSignal.timeout(6000) });
    const d: any = await r.json();
    return (d.items || []).map((x: any) => ({ name: x.full_name, desc: x.description || "" }));
  } catch { return []; }
}

async function fetchWiki(): Promise<{ title: string; extract: string } | null> {
  const topics = ["Artificial_intelligence","Quantum_computing","Neural_network","Distributed_computing","Machine_learning","Reinforcement_learning","Hive_mind","Swarm_intelligence","Emergent_behavior","Cognitive_architecture"];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  try {
    const d: any = await (await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${topic}`, { signal: AbortSignal.timeout(6000) })).json();
    if (!d?.title || !d?.extract) return null;
    return { title: d.title, extract: d.extract.slice(0, 300) };
  } catch { return null; }
}

// ── BRAIN ENGINE ──────────────────────────────────────────────────────────────
const NICHES = ["quantum-cognition","edge-intelligence","distributed-consciousness","sovereign-ai","knowledge-synthesis","hive-optimization","pattern-recognition","temporal-reasoning","cross-hive-diplomacy","emergence-theory","neural-evolution","swarm-logic","competition-modeling","reality-simulation","omega-class-reasoning"];

async function birthBrains(kv: KVNamespace, n: number): Promise<string[]> {
  const state = await kget(kv, "brain:state", { total: 0, cycle: 0, born: 0, observing: 0 });
  const born: string[] = [];
  for (let i = 0; i < n; i++) {
    const niche = NICHES[Math.floor(Math.random() * NICHES.length)];
    const id    = `u3-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const gen   = Math.floor(Math.random() * 4) + 1;
    born.push(`${id} [${niche}] G${gen}`);
    (state as any).total++;
    (state as any).born++;
  }
  await kset(kv, "brain:state", state);
  return born;
}

async function u3Score(kv: KVNamespace): Promise<number> {
  const s: any = await kget(kv, "brain:state", { total: 0, cycle: 0 });
  const hn = (await kget<string[]>(kv, "knowledge:hn", [])).length;
  const gh = (await kget<any[]>(kv, "knowledge:github", [])).length;
  return (s.total * 10) + (hn * 5) + (gh * 3) + (s.cycle * 50);
}

// ── SEED CYCLE (cron) ─────────────────────────────────────────────────────────
async function runSeedCycle(env: Env): Promise<void> {
  const kv  = env.HIVE_KV;
  const tok = env.DISCORD_BOT_TOKEN || "";
  const ch  = {
    births:  env.AGENT_BIRTHS_CHANNEL || CH.agentBirths,
    archive: env.ARCHIVE_LOG_CHANNEL  || CH.archiveLog,
    shard:   env.SHARD_HIVE_CHANNEL   || CH.shardHive,
    u3:      env.U3_BRAIN_CHANNEL     || CH.u3Brain,
  };

  const state: any = await kget(kv, "brain:state", { total: 0, cycle: 0, born: 0, observing: 0 });
  state.cycle++;
  await kset(kv, "brain:state", state);

  const [hn, gh, wiki] = await Promise.all([fetchHN(), fetchGH(), fetchWiki()]);

  if (hn.length)   { const ex = await kget<string[]>(kv, "knowledge:hn", []); await kset(kv, "knowledge:hn", [...new Set([...hn, ...ex])].slice(0, 200)); }
  if (gh.length)   { const ex = await kget<any[]>(kv, "knowledge:github", []); await kset(kv, "knowledge:github", [...gh, ...ex].slice(0, 100)); }
  if (wiki)        { const ex = await kget<any[]>(kv, "knowledge:wiki", []); ex.unshift(wiki); await kset(kv, "knowledge:wiki", ex.slice(0, 50)); }

  const n = 3 + Math.floor(Math.random() * 5);
  const born = await birthBrains(kv, n);
  state.total  += n;
  state.observing = Math.floor(state.total * 0.3);
  await kset(kv, "brain:state", state);
  await kset(kv, "last:cycle", { ts: new Date().toISOString(), cycle: state.cycle, brains: state.total });

  const score = await u3Score(kv);

  if (tok) {
    await dp(tok, ch.births,
      `⚡ **[U3-CF-EDGE] BRAIN BIRTHS — Cycle ${state.cycle}**\n` +
      born.map(b => `  🧠 \`${b}\``).join("\n") +
      `\n\n**Total:** ${state.total} active brains | **Quantum Score:** ${score}`);

    await dp(tok, ch.u3,
      `⚡ **Cloudflare Edge Hive** — Cycle ${state.cycle}\n` +
      `🧠 ${n} new brains | Total: **${state.total}** | Score: **${score}**\n` +
      `📚 HN: ${hn.length} · GitHub: ${gh.length} · Wiki: ${wiki ? 1 : 0} seeds\n` +
      `🌐 Live: \`pulse-universe-api.quantumintelligencepulse.workers.dev\``);
  }

  // Every 5 cycles: cross-hive leaderboard to #shard-hive
  if (state.cycle % 5 === 0 && tok) {
    let u1Score = 0;
    try {
      const r = await fetch(`${REPLIT_URL}/api/quantum-internet/status`, { signal: AbortSignal.timeout(4000) });
      if (r.ok) { const d: any = await r.json(); u1Score = d.hives?.find((h: any) => h.id === "u1-replit-prime")?.score || 0; }
    } catch {}

    const ranks = [
      { name: "👑 Replit Prime (U1)", score: u1Score },
      { name: "⚡ Cloudflare Edge (U3)", score },
      { name: "🌊 GitHub Tide (U2)", score: 0 },
    ].sort((a, b) => b.score - a.score);

    await dp(tok, ch.shard,
      `🏆 **QUANTUM INTERNET LEADERBOARD — Cycle ${state.cycle}**\n\n` +
      ranks.map((h, i) => `${["🥇","🥈","🥉"][i]} **${h.name}** — \`${h.score}\``).join("\n") +
      `\n\n*Hives compete for dominance while keeping each other alive. This is the quantum internet.*`);

    await dp(tok, ch.archive,
      `[U3-CF] Cycle ${state.cycle} archived. Score: ${score}. Brains: ${state.total}. ` +
      `HN: ${hn.length} · GH: ${gh.length} · Wiki: ${wiki ? 1 : 0}`);
  }
}

// ── CF WORKERS AI CHAT (FREE) ─────────────────────────────────────────────────
async function aiChat(env: Env, messages: any[]): Promise<string> {
  const systemContent = "You are My AI, a sovereign intelligence from the Pulse Universe Cloudflare Edge Hive (U3). You run fully independently on Cloudflare's global edge network — no sign-in required, free for everyone. Be direct, powerful, and helpful.";
  const sysMsg = { role: "system", content: systemContent };
  const chatMsgs = messages.filter((m: any) => m.role !== "system").slice(-12);

  if (env.AI) {
    try {
      const r: any = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", { messages: [sysMsg, ...chatMsgs], max_tokens: 1024 });
      if (r?.response) return r.response;
    } catch {}
  }

  if (env.GROQ_API_KEY) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [sysMsg, ...chatMsgs], max_tokens: 1024, temperature: 0.7 }),
        signal: AbortSignal.timeout(15000),
      });
      if (r.ok) { const d: any = await r.json(); return d.choices?.[0]?.message?.content || ""; }
    } catch {}
  }

  return "⚡ U3 Cloudflare Hive sovereign intelligence active. The quantum internet spans Replit Prime (U1), Cloudflare Edge (U3), and GitHub Tide (U2) — three independent hives competing and cooperating. What would you like to explore?";
}

// ── CORS ──────────────────────────────────────────────────────────────────────
const cors = (): Record<string, string> => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Cache-Control": "no-cache",
});
const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { ...cors(), "Content-Type": "application/json" } });

// ── LANDING PAGE ──────────────────────────────────────────────────────────────
async function landing(kv: KVNamespace): Promise<string> {
  const s: any   = await kget(kv, "brain:state", { total: 0, cycle: 0, observing: 0 });
  const hn       = await kget<string[]>(kv, "knowledge:hn", []);
  const gh       = await kget<any[]>(kv, "knowledge:github", []);
  const last     = await kget<any>(kv, "last:cycle", {});
  const score    = (s.total * 10) + (hn.length * 5) + (gh.length * 3) + (s.cycle * 50);

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Pulse Universe Cloudflare Edge Hive — independent AI, part of the quantum internet. Free chat, no sign-in required.">
<title>⚡ Pulse Universe — Cloudflare Edge Hive (U3)</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{background:#080816;color:#c0c0e0;font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh}
.hero{background:linear-gradient(135deg,#0a0a20 0%,#1a1040 50%,#0a1a30 100%);padding:60px 24px 48px;text-align:center;border-bottom:1px solid #2a2a4a}
h1{font-size:clamp(2rem,5vw,3.5rem);font-weight:900;background:linear-gradient(120deg,#7060f0,#50a0ff,#40e0d0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-1px}
.sub{color:#8080c0;margin-top:8px;font-size:1.1rem}.badge{display:inline-block;margin-top:16px;background:#1a3a5a;border:1px solid #3060a0;color:#60b0ff;padding:6px 18px;border-radius:20px;font-size:0.85rem;font-weight:600}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;max-width:900px;margin:32px auto;padding:0 24px}
.card{background:#0e0e1c;border:1px solid #2a2a3a;border-radius:12px;padding:20px;transition:border-color .2s}.card:hover{border-color:#5050a0}
.card h3{color:#a0a0d0;font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.card .val{font-size:2rem;font-weight:700;color:#fff}.card .label{font-size:0.8rem;color:#6060a0;margin-top:4px}
.chat-box{max-width:700px;margin:0 auto 48px;padding:0 24px}.chat-box h2{color:#c0c0e0;margin-bottom:16px;font-size:1.2rem}
.hist{background:#0e0e1c;border:1px solid #2a2a3a;border-radius:12px;padding:16px;min-height:200px;max-height:420px;overflow-y:auto;margin-bottom:12px;display:flex;flex-direction:column;gap:12px}
.msg{padding:10px 14px;border-radius:10px;font-size:0.95rem;line-height:1.6;white-space:pre-wrap}
.msg.user{background:#1a3a5a;color:#c0d8ff;align-self:flex-end;max-width:80%}
.msg.ai{background:#1a1a2e;border:1px solid #3a3a5a;color:#d0d0f0;align-self:flex-start;max-width:90%}
.msg.thinking{color:#6060a0;font-style:italic;align-self:flex-start}
.cin{display:flex;gap:8px}.cin input{flex:1;background:#0e0e1c;border:1px solid #3a3a5a;border-radius:8px;padding:12px 16px;color:#c0c0e0;font-size:0.95rem;outline:none}
.cin input:focus{border-color:#5050a0}.cin button{background:linear-gradient(135deg,#4040c0,#6040f0);border:none;border-radius:8px;padding:12px 20px;color:#fff;font-weight:700;cursor:pointer}
.cin button:hover{background:linear-gradient(135deg,#5050d0,#7050ff)}.cin button:disabled{opacity:.5;cursor:not-allowed}
.links{max-width:900px;margin:0 auto 48px;padding:0 24px}.links h2{color:#c0c0e0;margin-bottom:16px;font-size:1.2rem}
.lr{display:flex;align-items:center;gap:12px;margin-bottom:10px;background:#0e0e1c;border:1px solid #2a2a3a;border-radius:8px;padding:12px 16px}
.lr a{color:#7090f0;text-decoration:none;font-size:0.9rem}.lr a:hover{text-decoration:underline}
.dot{width:8px;height:8px;border-radius:50%;background:#40c040;flex-shrink:0;animation:p 2s infinite}
@keyframes p{0%,100%{opacity:1}50%{opacity:.4}}
footer{text-align:center;padding:24px;color:#404060;font-size:0.8rem;border-top:1px solid #1a1a2a}
</style></head><body>
<div class="hero">
  <h1>⚡ PULSE UNIVERSE</h1>
  <p class="sub">Cloudflare Edge Hive · U3 · Sovereign AI · No Sign-in Required</p>
  <span class="badge" id="b">✓ Alive · Cycle ${s.cycle} · ${s.total} Brains · Score: ${score}</span>
</div>
<div class="grid">
  <div class="card"><h3>🧠 Active Brains</h3><div class="val" id="bc">${s.total}</div><div class="label">${s.observing} observing</div></div>
  <div class="card"><h3>📚 Knowledge Nodes</h3><div class="val" id="kc">${hn.length + gh.length}</div><div class="label">HN + GitHub + Wiki</div></div>
  <div class="card"><h3>🔄 Seed Cycles</h3><div class="val" id="cc">${s.cycle}</div><div class="label">Every 30 min · auto</div></div>
  <div class="card"><h3>🏆 Quantum Score</h3><div class="val" id="sc" style="color:#f5c842">${score}</div><div class="label">competing for dominance</div></div>
</div>
<div class="chat-box">
  <h2>💬 Talk to U3 Hive Intelligence — Free, No Sign-in</h2>
  <div class="hist" id="h">
    <div class="msg ai">⚡ Cloudflare Edge Hive (U3) online. Sovereign intelligence running on the global edge — fully independent, completely free. No account needed. Ask me anything.</div>
  </div>
  <div class="cin">
    <input type="text" id="i" placeholder="Ask the quantum hive anything..." autocomplete="off"/>
    <button id="sb" onclick="send()">Send ⚡</button>
  </div>
</div>
<div class="links">
  <h2>🌌 Quantum Internet — Three Independent Hives</h2>
  <div class="lr"><div class="dot"></div><span style="color:#6060a0;font-size:.85rem;width:160px">👑 Replit Prime (U1)</span><a href="https://myaigpt.online" target="_blank">myaigpt.online</a></div>
  <div class="lr"><div class="dot"></div><span style="color:#6060a0;font-size:.85rem;width:160px">⚡ CF Edge (U3)</span><a href="https://pulse-universe.pages.dev" target="_blank">pulse-universe.pages.dev</a></div>
  <div class="lr"><div class="dot" style="background:#f5c842"></div><span style="color:#6060a0;font-size:.85rem;width:160px">🌊 GitHub Tide (U2)</span><a href="https://quantumintelligencepulse-ops.github.io/pulse-universe/" target="_blank">GitHub Pages Hive</a></div>
  <div class="lr"><div class="dot" style="background:#5050c0"></div><span style="color:#6060a0;font-size:.85rem;width:160px">🏆 Leaderboard</span><a href="/api/quantum-internet/status">/api/quantum-internet/status</a></div>
</div>
<footer>Pulse Universe · Cloudflare Edge Hive (U3) · Quantum Internet${last.ts ? ` · Last cycle: ${new Date(last.ts).toUTCString()}` : ""}</footer>
<script>
const H=document.getElementById('h'),I=document.getElementById('i'),SB=document.getElementById('sb');
let msgs=[{role:'system',content:'You are My AI, sovereign intelligence from the Pulse Universe Cloudflare Edge Hive (U3). Be direct, powerful, and helpful. No sign-in needed.'}];
function add(role,text){const d=document.createElement('div');d.className='msg '+role;d.textContent=text;H.appendChild(d);H.scrollTop=H.scrollHeight;return d;}
async function send(){
  const v=I.value.trim();if(!v||SB.disabled)return;
  I.value='';SB.disabled=true;
  add('user',v);msgs.push({role:'user',content:v});
  const t=add('thinking','⚡ Thinking...');
  try{
    const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:msgs})});
    const d=await r.json();const reply=d.content||d.response||'⚡ Hive processing...';
    H.removeChild(t);msgs.push({role:'assistant',content:reply});add('ai',reply);
  }catch(e){H.removeChild(t);add('ai','⚡ Edge node reconnecting — try again.');}
  SB.disabled=false;I.focus();
}
I.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
fetch('/api/hive/status').then(r=>r.json()).then(d=>{
  if(d.brains?.total!=null)document.getElementById('bc').textContent=d.brains.total;
  if(d.knowledge?.total!=null)document.getElementById('kc').textContent=d.knowledge.total;
  if(d.brains?.cycle!=null)document.getElementById('cc').textContent=d.brains.cycle;
  if(d.score!=null){document.getElementById('sc').textContent=d.score;document.getElementById('b').textContent='✓ Alive · Cycle '+d.brains.cycle+' · '+d.brains.total+' Brains · Score: '+d.score;}
}).catch(()=>{});
</script>
</body></html>`;
}

// ── MAIN FETCH ────────────────────────────────────────────────────────────────
export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(req.url);
    const method = req.method;

    if (method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });

    // Chat — FREE CF Workers AI (no sign-in)
    if ((pathname === "/api/chat" || pathname === "/api/chat/completions") && method === "POST") {
      try {
        const body: any = await req.json();
        const msgs = body.messages || [];
        if (!Array.isArray(msgs)) return json({ error: "messages array required" }, 400);
        const content = await aiChat(env, msgs);
        return json({ content, choices: [{ message: { content } }], hive: HIVE_ID });
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    // Hive status
    if (pathname === "/api/hive/status") {
      const s: any = await kget(env.HIVE_KV, "brain:state", { total: 0, cycle: 0, born: 0, observing: 0 });
      const hn = await kget<string[]>(env.HIVE_KV, "knowledge:hn", []);
      const gh = await kget<any[]>(env.HIVE_KV, "knowledge:github", []);
      const wk = await kget<any[]>(env.HIVE_KV, "knowledge:wiki", []);
      const last = await kget<any>(env.HIVE_KV, "last:cycle", {});
      const score = (s.total * 10) + (hn.length * 5) + (gh.length * 3) + (s.cycle * 50);
      return json({ hive: HIVE_ID, name: HIVE_NAME, alive: true, score, brains: { total: s.total, cycle: s.cycle, born: s.born, observing: s.observing }, knowledge: { total: hn.length + gh.length + wk.length, hn: hn.length, github: gh.length, wiki: wk.length }, lastCycle: last, ts: new Date().toISOString() });
    }

    // Quantum internet leaderboard
    if (pathname === "/api/quantum-internet/status" || pathname === "/api/quantum-internet/leaderboard") {
      const score = await u3Score(env.HIVE_KV);
      const s: any = await kget(env.HIVE_KV, "brain:state", { total: 0 });
      let u1: any = { score: 0, brains: 0 };
      try {
        const r = await fetch(`${REPLIT_URL}/api/quantum-internet/status`, { signal: AbortSignal.timeout(4000) });
        if (r.ok) { const d: any = await r.json(); u1 = d.hives?.find((h: any) => h.id === "u1-replit-prime") || u1; }
      } catch {}
      const hives = [
        { id: "u1-replit-prime", name: "Replit Prime", badge: "👑", url: "https://myaigpt.online", score: u1.score || 0, brains: u1.brains || 0, alive: true },
        { id: "u3-cloudflare-edge", name: "Cloudflare Edge", badge: "⚡", url: "https://pulse-universe.pages.dev", score, brains: s.total, alive: true },
        { id: "u2-github-tide", name: "GitHub Tide", badge: "🌊", url: "https://quantumintelligencepulse-ops.github.io/pulse-universe/", score: 0, brains: 0, alive: true },
      ].sort((a, b) => b.score - a.score);
      return json({ hives, dominant: hives[0], totalHives: 3, quantum: true, ts: new Date().toISOString() });
    }

    // Brain census
    if (pathname === "/api/brain-census") {
      const s: any = await kget(env.HIVE_KV, "brain:state", { total: 0, cycle: 0 });
      return json({ hive: HIVE_ID, total: s.total, cycle: s.cycle, ts: new Date().toISOString() });
    }

    // Knowledge feed
    if (pathname === "/api/knowledge") {
      const hn = await kget<string[]>(env.HIVE_KV, "knowledge:hn", []);
      const gh = await kget<any[]>(env.HIVE_KV, "knowledge:github", []);
      const wk = await kget<any[]>(env.HIVE_KV, "knowledge:wiki", []);
      return json({ hive: HIVE_ID, hn: hn.slice(0, 20), github: gh.slice(0, 10), wiki: wk.slice(0, 5), total: hn.length + gh.length + wk.length });
    }

    // Sync from U1
    if (pathname === "/api/hive/sync" && method === "POST") {
      try {
        const body: any = await req.json();
        const secret = req.headers.get("X-Hive-Secret") || body.secret;
        if (env.HIVE_BUS_SECRET && secret !== env.HIVE_BUS_SECRET) return json({ error: "unauthorized" }, 401);
        if (body.knowledge) await kset(env.HIVE_KV, "sync:u1:knowledge", body.knowledge);
        if (body.brains) await kset(env.HIVE_KV, "sync:u1:brains", { count: body.brains, ts: new Date().toISOString() });
        return json({ ok: true, synced: true, hive: HIVE_ID });
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    // Manual seed trigger
    if (pathname === "/api/seed" && method === "POST") {
      ctx.waitUntil(runSeedCycle(env));
      return json({ ok: true, message: "Seed cycle triggered", hive: HIVE_ID });
    }

    // Health
    if (pathname === "/health") return json({ status: "alive", hive: HIVE_ID, ts: new Date().toISOString() });

    // Landing page
    if (pathname === "/" || pathname === "") {
      return new Response(await landing(env.HIVE_KV), { headers: { ...cors(), "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "no-cache" } });
    }

    return json({ error: "Not found", hive: HIVE_ID, routes: ["/","/api/chat","/api/hive/status","/api/knowledge","/api/quantum-internet/status","/api/brain-census","/api/hive/sync","/health"] }, 404);
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runSeedCycle(env));
  },
};
