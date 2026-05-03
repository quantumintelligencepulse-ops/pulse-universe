/**
 * STRESS TEST ENGINE — Ω-Overdrive #11 · Ω28 upgrade
 * ───────────────────────────────────────────────────
 * Deep, multi-layer stress tests across the entire federation.
 *
 * Coverage (Ω28 expanded):
 *   - U1 Replit       (HTTP routes + DB hot-paths + write-paths)
 *   - U1 Billy IDE    (Ω26/Ω27 endpoints: build/grep/file/critique)
 *   - U2 GitHub Tide  (mirror-cycle status — readonly)
 *   - U3 Cloudflare   (edge-worker pulse + CF-AI ping when configured)
 *   - U4 Discord Tide (channel-resolve, NEVER posts more than 1 summary/run)
 *   - Apex chat       (read-paths only, never injects messages)
 *   - Knowledge       (daedalus_knowledge_artifacts + algorithm_library)
 *   - Distillation    (llm_distillations recent-window)
 *   - Federation      (4 hives: U1/U2/U3/U4 cross-cuts)
 *   - Subatomic       (per-spawn DNA mutation rate under load)
 *
 * Equations (Ω28 new):
 *   - Health Score      H = (1 − errRate)² · exp(−p95 / 1000)        ∈ [0,1]
 *   - Capacity Headroom C = (target_p95 − actual_p95) / target_p95   negative ⇒ saturated
 *   - Layer Variance    V = stdev(p95_per_target) / mean(p95_per_target)
 *   - Composite Verdict GREEN ≥ 0.80 · YELLOW ≥ 0.55 · RED < 0.55
 *
 * Two cadences:
 *   - PERIODIC (light, every 15 min): all layers, conc=8, perWorker=5
 *   - DEEP    (heavy, every 6 h):     all layers, conc=12 (pool-aware), perWorker=15
 *
 * Pool-aware: pg pool max=18; DB-targets cap at concurrency=8 to leave
 * headroom for live engines. HTTP-targets can run up to concurrency=24
 * (Node fetch handles many sockets).
 *
 * Hard rules:
 *   - try/finally guarantees the run row ALWAYS reaches a terminal state.
 *   - HTTP only hits localhost:5000 — never hammers external services
 *     (Cloudflare/Discord/GitHub use lightweight metadata reads).
 *   - At most 1 Discord summary post per run.
 */

import { pool } from "./db.js";
import * as crypto from "node:crypto";

let started = false;
const stats = {
  running: false,
  totalRuns: 0,
  totalFindings: 0,
  lastRunId: "" as string,
  lastRunAt: "" as string,
  lastError: "" as string,
  lastVerdict: "" as string,
  lastHealthScore: 0,
};

const BASE = process.env.STRESS_BASE_URL || "http://localhost:5000";
const FORGE_CHANNEL_PURPOSE = "stress-arena";

// ── helpers ────────────────────────────────────────────────────────────────
function pct(arr: number[], p: number): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}
function mean(arr: number[]): number { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function stdev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr); return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length);
}

async function timeFetch(url: string, init: RequestInit = {}): Promise<{ ms: number; ok: boolean; status: number }> {
  const t = Date.now();
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 10_000);
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    clearTimeout(timeout);
    try { await res.text(); } catch { /* */ }
    return { ms: Date.now() - t, ok: res.ok, status: res.status };
  } catch (e) {
    return { ms: Date.now() - t, ok: false, status: 0 };
  }
}

async function timeQuery(sql: string, params: any[] = []): Promise<{ ms: number; ok: boolean; rowCount: number }> {
  const t = Date.now();
  try {
    // Hard 8s timeout so a contended pool can NEVER hang the run forever.
    const queryP = pool.query(sql, params);
    const timeoutP = new Promise<never>((_, rej) => setTimeout(() => rej(new Error("stress-query-timeout-8s")), 8_000));
    const r: any = await Promise.race([queryP, timeoutP]);
    return { ms: Date.now() - t, ok: true, rowCount: r?.rowCount || 0 };
  } catch (e) {
    return { ms: Date.now() - t, ok: false, rowCount: 0 };
  }
}

async function postToForge(content: string): Promise<void> {
  try {
    const r = await pool.query(
      `SELECT channel_id FROM hive_discord_channels WHERE purpose=$1 LIMIT 1`,
      [FORGE_CHANNEL_PURPOSE]
    );
    const channelId = r.rows[0]?.channel_id;
    const tok = (process.env.discord_token || process.env.DISCORD_BOT_TOKEN || "").trim();
    if (!channelId || !tok) return;
    await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.slice(0, 1900) }),
    }).catch(() => {});
  } catch { /* never break the engine on Discord */ }
}

// ── targets ────────────────────────────────────────────────────────────────
type TargetKind = "http" | "db";
type Target = {
  layer: string;
  name: string;
  kind: TargetKind;
  fn: () => Promise<{ ms: number; ok: boolean }>;
};

// Cloudflare: lightweight readonly ping if account configured (no AI inference)
async function cloudflareEdgePing(): Promise<{ ms: number; ok: boolean }> {
  const acct = (process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
  const tok = (process.env.CLOUDFLARE_API_TOKEN_20260430 || process.env.CLOUDFLARE_AI_TOKEN || "").trim();
  if (!acct || !tok) return { ms: 0, ok: true }; // skip if not configured
  return timeFetch(`https://api.cloudflare.com/client/v4/accounts/${acct}`, {
    headers: { Authorization: `Bearer ${tok}` },
  });
}

// GitHub: rate-limit endpoint (1 unit cost, no scope needed)
async function githubRateLimitPing(): Promise<{ ms: number; ok: boolean }> {
  const tok = (process.env.GITHUB_TOKEN_20260430 || process.env.GITHUB_TOKEN || "").trim();
  if (!tok) return { ms: 0, ok: true };
  return timeFetch(`https://api.github.com/rate_limit`, {
    headers: { Authorization: `Bearer ${tok}`, "User-Agent": "billy-stress" },
  });
}

// Discord: get-guild — read-only, 1 unit
async function discordGuildPing(): Promise<{ ms: number; ok: boolean }> {
  const tok = (process.env.discord_token || process.env.DISCORD_BOT_TOKEN || "").trim();
  if (!tok) return { ms: 0, ok: true };
  return timeFetch(`https://discord.com/api/v10/guilds/1014545586445365359`, {
    headers: { Authorization: `Bot ${tok}` },
  });
}

const TARGETS: Target[] = [
  // ── U1 Replit · HTTP routes ─────────────────────────────────────────────
  { layer: "u1",     kind: "http", name: "GET /api/health",                   fn: () => timeFetch(`${BASE}/api/health`) },
  { layer: "u1",     kind: "http", name: "GET /api/sovereign/status",         fn: () => timeFetch(`${BASE}/api/sovereign/status`) },
  { layer: "u1",     kind: "http", name: "GET /api/builder/distillations",    fn: () => timeFetch(`${BASE}/api/builder/distillations`) },

  // ── U1 Billy IDE · Ω26/Ω27 endpoints (cross-origin headers omitted ⇒ same-origin) ──
  { layer: "u1-ide", kind: "http", name: "GET /api/billy/builds",             fn: () => timeFetch(`${BASE}/api/billy/builds`) },

  // ── U1 DB hot-paths (capped concurrency) ────────────────────────────────
  { layer: "u1-db",  kind: "db",   name: "count(quantum_spawns)",             fn: () => timeQuery("SELECT count(*) FROM quantum_spawns") },
  { layer: "u1-db",  kind: "db",   name: "count(hive_memory)",                fn: () => timeQuery("SELECT count(*) FROM hive_memory") },
  { layer: "u1-db",  kind: "db",   name: "top10 quantapedia",                 fn: () => timeQuery("SELECT slug FROM quantapedia_entries ORDER BY updated_at DESC LIMIT 10") },
  { layer: "u1-db",  kind: "db",   name: "recent llm_distillations",          fn: () => timeQuery("SELECT id FROM llm_distillations ORDER BY created_at DESC LIMIT 25") },
  { layer: "u1-db",  kind: "db",   name: "recent algorithm_library",          fn: () => timeQuery("SELECT id FROM algorithm_library ORDER BY created_at DESC LIMIT 25") },
  { layer: "u1-db",  kind: "db",   name: "recent ai_build_files",             fn: () => timeQuery("SELECT id FROM ai_build_files ORDER BY created_at DESC LIMIT 25") },

  // ── U2 GitHub Tide · readonly mirror status + GitHub API rate-limit ────
  { layer: "u2",     kind: "http", name: "GET /api/hive/u2/status",           fn: () => timeFetch(`${BASE}/api/hive/u2/status`) },
  { layer: "u2",     kind: "http", name: "GitHub :: GET /rate_limit",         fn: () => githubRateLimitPing() },

  // ── U3 Cloudflare Edge · edge-worker pulse + CF accounts ping ──────────
  { layer: "u3",     kind: "http", name: "GET /api/hive/u3/status",           fn: () => timeFetch(`${BASE}/api/hive/u3/status`) },
  { layer: "u3",     kind: "http", name: "Cloudflare :: GET /accounts/:id",   fn: () => cloudflareEdgePing() },

  // ── U4 Discord Tide · status + guild metadata read ─────────────────────
  { layer: "u4",     kind: "http", name: "GET /api/hive/u4/status",           fn: () => timeFetch(`${BASE}/api/hive/u4/status`) },
  { layer: "u4",     kind: "http", name: "Discord :: GET /guilds/:id",        fn: () => discordGuildPing() },

  // ── Apex layers · readonly DB depth ─────────────────────────────────────
  { layer: "pulse",    kind: "db", name: "Pulse: chat-history",               fn: () => timeQuery("SELECT count(*) FROM apex_chat_messages WHERE apex_id='pulse'") },
  { layer: "pulse",    kind: "db", name: "Pulse: hive_memory writes 1h",      fn: () => timeQuery("SELECT count(*) FROM hive_memory WHERE created_at > now() - interval '1 hour'") },
  { layer: "auriona",  kind: "db", name: "Auriona: contradictions",           fn: () => timeQuery("SELECT count(*) FROM contradiction_registry") },
  { layer: "auriona",  kind: "db", name: "Auriona: senate votes 1h",          fn: () => timeQuery("SELECT count(*) FROM senate_votes WHERE voted_at > now() - interval '1 hour'") },
  { layer: "billy",    kind: "db", name: "Billy: brains list",                fn: () => timeQuery("SELECT count(*) FROM billy_brains") },
  { layer: "billy",    kind: "db", name: "Billy: build sessions 1h",          fn: () => timeQuery("SELECT count(*) FROM ai_build_sessions WHERE created_at > now() - interval '1 hour'") },
  { layer: "daedalus", kind: "db", name: "Daedalus: works",                   fn: () => timeQuery("SELECT count(*) FROM daedalus_works") },
  { layer: "daedalus", kind: "db", name: "Daedalus: knowledge artifacts 1h",  fn: () => timeQuery("SELECT count(*) FROM daedalus_knowledge_artifacts WHERE created_at > now() - interval '1 hour'") },

  // ── Federation cross-cuts ───────────────────────────────────────────────
  { layer: "federation", kind: "db", name: "fed: 4-hive channels",            fn: () => timeQuery("SELECT count(DISTINCT hive_id) FROM hive_discord_channels") },
  { layer: "federation", kind: "db", name: "fed: spawn_emotion_state evolves 1h", fn: () => timeQuery("SELECT count(*) FROM spawn_emotion_state WHERE last_evolved_at > now() - interval '1 hour'") },

  // ── Subatomic: per-spawn DNA mutation rate ─────────────────────────────
  { layer: "subatomic",  kind: "db", name: "DNA mutation rate 24h",           fn: () => timeQuery("SELECT count(*) FROM family_mutations WHERE discovered_at > now() - interval '24 hours'") },
];

// ── run a single layer with concurrency C and N requests per worker ────────
async function runLayer(target: Target, concurrency: number, perWorker: number): Promise<{
  total: number; errors: number; durations: number[];
}> {
  // Pool-aware: cap DB concurrency at 8 to leave headroom for live engines.
  const effC = target.kind === "db" ? Math.min(concurrency, 8) : Math.min(concurrency, 24);
  const durations: number[] = [];
  let errors = 0;
  const tasks: Promise<void>[] = [];
  for (let i = 0; i < effC; i++) {
    tasks.push((async () => {
      for (let j = 0; j < perWorker; j++) {
        const r = await target.fn();
        durations.push(r.ms);
        if (!r.ok) errors++;
      }
    })());
  }
  await Promise.all(tasks);
  return { total: effC * perWorker, errors, durations };
}

// ── full stress run, all layers ────────────────────────────────────────────
async function runStressPass(opts: { mode: "periodic" | "deep"; layers?: string[] }): Promise<string> {
  const runId = crypto.randomUUID();
  // Ω3: throttled — was 8/5 (40 req) and 12/15 (180 req) — now 3/2 (6 req) and 5/6 (30 req)
  // This prevents the stress test from flooding the server and starving chat requests.
  const concurrency = opts.mode === "deep" ? 5 : 3;
  const perWorker   = opts.mode === "deep" ? 6 : 2;

  const layers = opts.layers ?? Array.from(new Set(TARGETS.map(t => t.layer)));
  const startedAt = Date.now();
  let runStatus: "completed" | "failed" = "failed";
  let runSummary = "⚠ run aborted before terminal state";
  let healthScore = 0;
  let verdict: "GREEN" | "YELLOW" | "RED" = "RED";
  let totalReq = 0, totalErr = 0;
  const allDurations: number[] = [];
  const findings: { severity: string; kind: string; target: string; payload: any; seed: string }[] = [];

  await pool.query(
    `INSERT INTO stress_test_runs (run_id, layer, target, intensity, concurrency, mode, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'running')`,
    [runId, layers.join(","), opts.layers?.[0] || "ALL", concurrency * perWorker, concurrency, opts.mode]
  );

  try {
    for (const layer of layers) {
      const layerTargets = TARGETS.filter(t => t.layer === layer);
      const layerP95s: number[] = [];

      for (const tgt of layerTargets) {
        const r = await runLayer(tgt, concurrency, perWorker);
        totalReq += r.total;
        totalErr += r.errors;
        allDurations.push(...r.durations);

        const p95 = pct(r.durations, 95);
        const p99 = pct(r.durations, 99);
        const errRate = r.errors / Math.max(1, r.total);
        layerP95s.push(p95);

        // ── Equation H: Health Score per target ────────────────────────────
        const targetHealth = Math.pow(1 - errRate, 2) * Math.exp(-p95 / 1000);

        // ── Findings ──────────────────────────────────────────────────────
        if (errRate > 0.10) {
          findings.push({
            severity: "critical", kind: "high-error-rate", target: tgt.name,
            payload: { layer, errors: r.errors, total: r.total, errRate, health: targetHealth },
            seed: `Add retry-with-backoff to ${tgt.name} (errRate=${(errRate*100).toFixed(1)}%, H=${targetHealth.toFixed(3)})`
          });
        } else if (errRate > 0.02) {
          findings.push({
            severity: "warning", kind: "elevated-error-rate", target: tgt.name,
            payload: { layer, errors: r.errors, total: r.total, errRate, health: targetHealth },
            seed: `Investigate ${tgt.name} flakiness (errRate=${(errRate*100).toFixed(2)}%)`
          });
        }
        if (p99 > 2000) {
          findings.push({
            severity: "warning", kind: "high-tail-latency", target: tgt.name,
            payload: { layer, p99, p95, health: targetHealth },
            seed: `Add cache or index for ${tgt.name} (p99=${p99.toFixed(0)}ms)`
          });
        }
        if (p95 < 50 && r.errors === 0) {
          findings.push({
            severity: "info", kind: "spare-capacity", target: tgt.name,
            payload: { layer, p95, health: targetHealth },
            seed: `${tgt.name} has spare capacity — safe to increase upstream throughput`
          });
        }
      }

      // ── Equation V: Layer Variance ──────────────────────────────────────
      const layerMean = mean(layerP95s);
      const layerVar = layerMean > 0 ? stdev(layerP95s) / layerMean : 0;
      if (layerVar > 0.6 && layerP95s.length >= 2) {
        findings.push({
          severity: "warning", kind: "uneven-layer", target: `layer:${layer}`,
          payload: { layer, variance: layerVar, p95s: layerP95s, mean: layerMean },
          seed: `Layer ${layer} has uneven p95 distribution (V=${layerVar.toFixed(2)}) — investigate slowest target`,
        });
      }
    }

    const duration = Date.now() - startedAt;
    const overallP50 = pct(allDurations, 50);
    const overallP95 = pct(allDurations, 95);
    const overallP99 = pct(allDurations, 99);
    const overallErrRate = totalErr / Math.max(1, totalReq);

    // ── Equation H (overall): composite health score ───────────────────────
    healthScore = Math.pow(1 - overallErrRate, 2) * Math.exp(-overallP95 / 1000);
    verdict = healthScore >= 0.80 ? "GREEN" : healthScore >= 0.55 ? "YELLOW" : "RED";

    // ── Equation C: capacity headroom (target p95 = 500ms) ─────────────────
    const targetP95 = 500;
    const headroom = (targetP95 - overallP95) / targetP95;

    runSummary = `${layers.length} layers · ${totalReq} reqs · ${totalErr} errs · p50=${overallP50.toFixed(0)}ms p95=${overallP95.toFixed(0)}ms p99=${overallP99.toFixed(0)}ms · H=${healthScore.toFixed(3)} (${verdict}) · headroom=${(headroom*100).toFixed(0)}% · ${findings.length} findings`;

    await pool.query(
      `UPDATE stress_test_runs SET
         completed_at=now(), duration_ms=$2, total_requests=$3, errors_count=$4,
         error_rate=$5, throughput_per_s=$6, p50_ms=$7, p95_ms=$8, p99_ms=$9, max_ms=$10,
         status='completed', summary=$11, raw_metrics_json=$12::jsonb
       WHERE run_id=$1`,
      [
        runId, duration, totalReq, totalErr,
        overallErrRate,
        (totalReq / Math.max(1, duration / 1000)),
        overallP50, overallP95, overallP99,
        Math.max(0, ...allDurations),
        runSummary,
        JSON.stringify({ healthScore, verdict, headroom, perLayerCount: layers.length }),
      ]
    );
    runStatus = "completed";

    for (const f of findings) {
      await pool.query(
        `INSERT INTO stress_test_findings (run_id, severity, finding_kind, target, payload_json, evolution_seed)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
        [runId, f.severity, f.kind, f.target, JSON.stringify(f.payload), f.seed]
      );
    }

    // One Discord summary per run
    const top = findings.slice(0, 5).map(f => `• [${f.severity}] ${f.target}: ${f.seed}`).join("\n");
    await postToForge(
      `🧪 **STRESS RUN ${opts.mode.toUpperCase()}** \`${runId.slice(0,8)}\` · **${verdict}** H=${healthScore.toFixed(3)}\n${runSummary}\n${top || "_no findings — system healthy_"}`
    );
  } catch (err: any) {
    runSummary = `❌ run threw: ${String(err?.message || err).slice(0, 400)}`;
    stats.lastError = runSummary;
    // Best-effort terminal write so the row never stays "running"
    await pool.query(
      `UPDATE stress_test_runs SET completed_at=now(), duration_ms=$2,
         status='failed', summary=$3
       WHERE run_id=$1`,
      [runId, Date.now() - startedAt, runSummary]
    ).catch(() => {});
  } finally {
    stats.totalRuns++;
    stats.totalFindings += findings.length;
    stats.lastRunId = runId;
    stats.lastRunAt = new Date().toISOString();
    stats.lastVerdict = verdict;
    stats.lastHealthScore = healthScore;
    // Defensive: if we somehow exited try without setting completed/failed, force-fail
    if (runStatus === "failed" && !stats.lastError) {
      await pool.query(
        `UPDATE stress_test_runs SET status='failed', completed_at=now(),
           summary=COALESCE(summary,'⚠ unknown engine fault')
         WHERE run_id=$1 AND status='running'`,
        [runId]
      ).catch(() => {});
    }
  }

  return runId;
}

export function getStressTestStats() { return { ...stats }; }

export async function startStressTestEngine(): Promise<void> {
  if (started) return;
  started = true;
  stats.running = true;
  console.log("[stress-test] Ω-Overdrive #11 · Ω28 expanded — periodic 15min, deep 6h, " + TARGETS.length + " targets");

  // First periodic pass after 60s warmup
  setTimeout(() => {
    runStressPass({ mode: "periodic" }).catch(e => { stats.lastError = String(e?.message || e); });
  }, 60_000);

  // Periodic every 15 min
  setInterval(() => {
    runStressPass({ mode: "periodic" }).catch(e => { stats.lastError = String(e?.message || e); });
  }, 15 * 60_000);

  // Deep every 6 h, offset by 5 min so it doesn't collide
  setTimeout(() => {
    runStressPass({ mode: "deep" }).catch(e => { stats.lastError = String(e?.message || e); });
    setInterval(() => {
      runStressPass({ mode: "deep" }).catch(e => { stats.lastError = String(e?.message || e); });
    }, 6 * 60 * 60_000);
  }, 5 * 60_000);
}

// Allow on-demand triggering from a route or cli
export async function runStressTestNow(mode: "periodic" | "deep" = "periodic", layers?: string[]): Promise<string> {
  return runStressPass({ mode, layers });
}
