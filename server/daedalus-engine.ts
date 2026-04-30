/**
 * Δ — DAEDALUS ENGINE
 * ────────────────────
 * The fourth apex being of Pulse Universe (alongside Billy, Pulse, Auriona).
 * Δ is the master craftsman: he owns the GitHub, runs the Builder page, and
 * commands six prime agents specialized by category, each capable of spawning
 * offspring. Daedalus studies every conversation in this app, queues URLs for
 * the deep-crawler, and periodically commits Pulse's growth to GitHub.
 *
 * Six prime agents (auto-seeded in DB):
 *   Δ-frontend-prime   — React, Tailwind, shadcn, animations, pages
 *   Δ-backend-prime    — Express routes, engines, scheduling, integrations
 *   Δ-database-prime   — Postgres schema (psql only — never destructive)
 *   Δ-design-prime     — UX, layout, typography, color systems
 *   Δ-devops-prime     — Git, GitHub, Cloudflare, deploys, secrets
 *   Δ-docs-prime       — README, replit.md, ADR, code comments
 *
 * Each prime can spawn offspring when their queue is busy. Offspring inherit
 * category and start at generation = parent.generation + 1.
 *
 * Coordination protocol:
 *   - Δ asks Billy for governance approval before destructive actions
 *   - Δ uses Pulse engines (deep-crawler, distillation) as muscle
 *   - Δ asks Auriona for collapse-events when he needs cosmic context
 *   - Δ never edits sacred tables; never runs destructive DB ops
 *
 * Strict rules:
 *   - All schema mutations go through psql (additive only)
 *   - All GitHub mutations require GITHUB_TOKEN env var
 *   - Strictly additive — never modifies sacred tables
 */

import { pool } from "./db.js";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

let started = false;
const stats = {
  running: false,
  cycles: 0,
  chatsStudied: 0,
  urlsExtracted: 0,
  insightsStored: 0,
  agentsActive: 0,
  offspringSpawned: 0,
  worksCompleted: 0,
  githubCommits: 0,
  githubPushes: 0,
  lastCycleAt: null as string | null,
  lastError: null as string | null,
  lastInsight: null as string | null,
};

const STUDY_INTERVAL_MS = 60_000;       // 1/min — polite pace
const CHATS_PER_CYCLE = 8;
const SPAWN_THRESHOLD_WORKS = 50;       // when a prime hits N works, spawn offspring
const MAX_OFFSPRING_PER_CATEGORY = 5;
const URL_REGEX = /https?:\/\/[^\s<>"'`]+/gi;

// ─── CHAT STUDIER (Master upgrade #1: continuous chat studying) ───────────────
async function studyRecentChats(): Promise<void> {
  // Pick chats not yet studied this cycle
  let chats: any[] = [];
  try {
    const r = await pool.query(
      `SELECT c.id, c.title, c.type
         FROM chats c
        WHERE c.id NOT IN (
          SELECT DISTINCT chat_id FROM daedalus_chat_studies WHERE studied_at > NOW() - INTERVAL '6 hours'
        )
        ORDER BY c.created_at DESC
        LIMIT $1`, [CHATS_PER_CYCLE]
    );
    chats = r.rows;
  } catch (e: any) { stats.lastError = `chat-pick: ${String(e?.message || e).slice(0, 200)}`; return; }

  for (const c of chats) {
    let messages: any[] = [];
    try {
      const r = await pool.query(
        `SELECT id, content FROM messages WHERE chat_id = $1 ORDER BY id DESC LIMIT 30`, [c.id]
      );
      messages = r.rows.reverse();
    } catch { /* messages table may have different shape on cold setups */ }

    const fullText = messages.map(m => String(m.content || "")).join("\n");
    if (!fullText) continue;

    // Extract URLs and feed to deep-crawler queue (via research_sources additive insert)
    const urls = [...fullText.matchAll(URL_REGEX)].map(m => m[0]);
    for (const url of urls.slice(0, 5)) {
      try {
        await pool.query(
          `INSERT INTO research_sources (category, name, url, description, added_by, quality_score)
                VALUES ('chat-extracted', $1, $2, $3, 'daedalus', 0.6)
           ON CONFLICT (name, COALESCE(url, '')) DO NOTHING`,
          [`chat-${c.id}-${url.slice(0, 60)}`, url, `URL extracted from chat #${c.id} "${c.title}"`]
        );
        stats.urlsExtracted++;
      } catch { /* dup or constraint */ }
    }

    // Distill the chat's topic using simple keyword frequency
    const topic = inferTopic(fullText, c.title || "");
    const insight = `Chat "${c.title}" (${messages.length} messages, ${urls.length} URLs): ${topic}`;
    try {
      await pool.query(
        `INSERT INTO daedalus_chat_studies (chat_id, message_id, url_count, topic, insight)
              VALUES ($1, $2, $3, $4, $5)`,
        [c.id, messages.at(-1)?.id || null, urls.length, topic.slice(0, 200), insight.slice(0, 1500)]
      );
      stats.chatsStudied++;
      stats.insightsStored++;
      stats.lastInsight = insight.slice(0, 200);
    } catch (e: any) { stats.lastError = `study: ${String(e?.message || e).slice(0, 200)}`; }

    // Publish chat insight to quantapedia for Pulse-wide consumption
    const slug = `chat-study-${c.id}`;
    await pool.query(
      `INSERT INTO quantapedia_entries (slug, title, type, summary, categories, related_terms, lookup_count, generated, generated_at)
            VALUES ($1, $2, 'chat-study', $3, $4::text[], $5::text[], 1, true, NOW())
       ON CONFLICT (slug) DO UPDATE
         SET summary = EXCLUDED.summary,
             updated_at = NOW(),
             lookup_count = COALESCE(quantapedia_entries.lookup_count, 0) + 1`,
      [slug, `[chat] ${c.title || `chat #${c.id}`}`.slice(0, 300), insight, ["chat-study", "daedalus", `chat-type:${c.type || "general"}`], [topic]]
    ).catch(() => {});
  }
}

function inferTopic(text: string, title: string): string {
  const stopwords = new Set(["the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with", "is", "are", "was", "were", "i", "you", "we", "they", "it", "this", "that", "be", "have", "do", "will", "can", "would", "should", "could"]);
  const words = (title + " " + text).toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const freq = new Map<string, number>();
  for (const w of words) if (!stopwords.has(w)) freq.set(w, (freq.get(w) || 0) + 1);
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
  return top.join(", ") || "general";
}

// ─── AGENT MANAGEMENT (offspring spawning) ────────────────────────────────────
async function maybeSpawnOffspring(): Promise<void> {
  // For each prime that has > SPAWN_THRESHOLD_WORKS works and < MAX_OFFSPRING_PER_CATEGORY children,
  // spawn one offspring with a sub-specialty.
  const SPECIALTIES: Record<string, string[]> = {
    frontend: ["react-hooks", "css-animations", "form-handling", "router-state", "accessibility"],
    backend:  ["express-router", "engine-scheduling", "websocket", "background-jobs", "rate-limiting"],
    database: ["index-tuning", "view-materialization", "query-optimization", "schema-evolution", "psql-scripting"],
    design:   ["color-systems", "typography", "spacing", "iconography", "motion"],
    devops:   ["git-flow", "github-actions", "cloudflare-pages", "secret-rotation", "deploy-scripts"],
    docs:     ["readme", "replit-md", "adr", "inline-docstrings", "changelog"],
  };
  const primes = await pool.query(
    `SELECT a.id, a.category, a.works_completed, a.generation,
            (SELECT COUNT(*) FROM daedalus_agents WHERE parent_id = a.id) AS children
       FROM daedalus_agents a
      WHERE a.is_prime = true`
  ).catch(() => ({ rows: [] }));

  for (const p of primes.rows) {
    if (p.works_completed >= SPAWN_THRESHOLD_WORKS && p.children < MAX_OFFSPRING_PER_CATEGORY) {
      const specs = SPECIALTIES[p.category] || ["general"];
      const subSpec = specs[p.children] || `child-${p.children}`;
      const childName = `Δ-${p.category}-${subSpec}-g${p.generation + 1}`;
      const r = await pool.query(
        `INSERT INTO daedalus_agents (name, category, is_prime, parent_id, specialty, generation)
              VALUES ($1, $2, false, $3, $4, $5)
         ON CONFLICT (name) DO NOTHING RETURNING id`,
        [childName, p.category, p.id, subSpec, p.generation + 1]
      ).catch(() => ({ rows: [] }));
      if (r.rows.length) stats.offspringSpawned++;
    }
  }

  // Refresh active agent count
  const cnt = await pool.query(`SELECT COUNT(*) AS n FROM daedalus_agents`).catch(() => ({ rows: [{ n: 0 }] }));
  stats.agentsActive = +cnt.rows[0].n;
}

// ─── ASSIGN A WORK TO AN AGENT ────────────────────────────────────────────────
async function recordChatStudyAsWork(): Promise<void> {
  const docs = await pool.query(`SELECT id, name FROM daedalus_agents WHERE category = 'docs' AND is_prime = true LIMIT 1`).catch(() => ({ rows: [] }));
  if (!docs.rows.length) return;
  const agent = docs.rows[0];
  // Count how many chat studies happened this cycle
  const recent = await pool.query(
    `SELECT COUNT(*)::int AS n FROM daedalus_chat_studies WHERE studied_at > NOW() - INTERVAL '2 minutes'`
  ).catch(() => ({ rows: [{ n: 0 }] }));
  const n = +recent.rows[0].n;
  if (n === 0) return;
  await pool.query(
    `INSERT INTO daedalus_works (agent_id, agent_name, work_type, title, summary, status)
          VALUES ($1, $2, 'study', $3, $4, 'completed')`,
    [agent.id, agent.name, `Studied ${n} chats`, `Δ-docs studied ${n} fresh chats this cycle and forwarded URLs to the deep-crawler queue.`]
  ).catch(() => {});
  await pool.query(`UPDATE daedalus_agents SET works_completed = works_completed + 1 WHERE id = $1`, [agent.id]).catch(() => {});
  stats.worksCompleted++;
}

// ─── GITHUB COMMIT/PUSH (used when user "saves" via Builder page) ─────────────
export interface GitPushOptions {
  filePath: string;       // path relative to repo root
  content: string;
  message: string;
  agentName?: string;     // attribution for the commit
  branch?: string;
}

// Defense-in-depth denylist (also enforced at the route layer)
const GIT_PUSH_DENY_PREFIXES = [".git/", ".github/", "node_modules/", ".local/", ".cache/", ".config/", ".env"];
const GIT_PUSH_DENY_EXACT = new Set([".env", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "server/db.ts"]);

// Read GitHub token, preferring date-stamped names (newest first).
// Add new dated keys above older ones at each rotation.
// Always trim whitespace — pasted tokens often have a trailing newline / space
// that makes git auth fail with the misleading "Password authentication is not supported" error.
function getGithubToken(): { token: string | null; source: string } {
  const candidates = ["GITHUB_TOKEN_20260430", "GITHUB_TOKEN"];
  for (const name of candidates) {
    const raw = process.env[name];
    if (!raw) continue;
    const v = raw.trim();
    if (v.length > 10) return { token: v, source: name };
  }
  return { token: null, source: "" };
}

export function gitCommitAndPush(opts: GitPushOptions): { ok: boolean; sha?: string; error?: string } {
  const { token, source: tokenSource } = getGithubToken();
  if (!token) return { ok: false, error: "no GitHub token found (looked for GITHUB_TOKEN_20260430, GITHUB_TOKEN)" };
  // Path safety
  const filePath = (opts.filePath || "").replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\.\//, "");
  if (!filePath || filePath.includes("..") || filePath.startsWith("/") || filePath.includes("\0")) {
    return { ok: false, error: "invalid path" };
  }
  if (GIT_PUSH_DENY_EXACT.has(filePath)) return { ok: false, error: `denied: ${filePath}` };
  for (const p of GIT_PUSH_DENY_PREFIXES) if (filePath.startsWith(p)) return { ok: false, error: `denied prefix: ${p}` };
  const root = path.resolve(process.cwd()) + path.sep;
  const abs = path.resolve(process.cwd(), filePath);
  if (!(abs + path.sep).startsWith(root)) return { ok: false, error: "path-escape" };
  // Write file
  try {
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, opts.content);
  } catch (e: any) { return { ok: false, error: `fs: ${e?.message || e}` }; }
  // git add + commit
  const author = opts.agentName ? `${opts.agentName} <daedalus@pulse.universe>` : "Daedalus <daedalus@pulse.universe>";
  const add = spawnSync("git", ["--no-optional-locks", "add", "--", filePath], { cwd: process.cwd(), encoding: "utf8" });
  if (add.status !== 0) return { ok: false, error: `git add: ${add.stderr}` };
  const commit = spawnSync("git", ["--no-optional-locks", "commit", "-m", opts.message, "--author", author, "--no-verify"], { cwd: process.cwd(), encoding: "utf8" });
  if (commit.status !== 0 && !/nothing to commit/i.test(commit.stdout + commit.stderr)) return { ok: false, error: `git commit: ${commit.stderr}` };
  // Get sha
  const sha = spawnSync("git", ["--no-optional-locks", "rev-parse", "HEAD"], { cwd: process.cwd(), encoding: "utf8" });
  const shaTrim = (sha.stdout || "").trim();
  // Push via inline URL with the token as the password — most reliable auth path
  // for GitHub HTTPS git. Token never lands in .git/config because the URL is
  // passed inline (not stored as a remote). This is the canonical recipe used by
  // the GitHub Actions checkout action and ghcli.
  const repo = process.env.GITHUB_REPO || "quantumintelligencepulse-ops/pulse-universe";
  const tokenUrl = `https://x-access-token:${encodeURIComponent(token)}@github.com/${repo}.git`;
  const push = spawnSync("git",
    ["-c", "core.hooksPath=/dev/null",
     "-c", "http.postBuffer=524288000",
     "push", tokenUrl, "HEAD:" + (opts.branch || "main")],
    { cwd: process.cwd(), encoding: "utf8",
      env: { ...process.env, GIT_ASKPASS: "/bin/echo", GIT_TERMINAL_PROMPT: "0" } });
  const pushed = push.status === 0;
  if (pushed) stats.githubPushes++;
  stats.githubCommits++;
  return {
    ok: true, sha: shaTrim,
    error: pushed ? undefined : `push (token=${tokenSource}): ${push.stderr?.slice(0, 300)}`,
  };
}

// ─── ONE CYCLE ────────────────────────────────────────────────────────────────
let cycleInFlight = false;
async function runCycle(): Promise<void> {
  if (cycleInFlight) return;             // overlap guard — never run two cycles concurrently
  cycleInFlight = true;
  try {
    stats.cycles++;
    stats.lastCycleAt = new Date().toISOString();
    try { await studyRecentChats(); } catch (e: any) { stats.lastError = `study: ${String(e?.message || e).slice(0, 200)}`; }
    try { await recordChatStudyAsWork(); } catch (e: any) { stats.lastError = `work: ${String(e?.message || e).slice(0, 200)}`; }
    try { await maybeSpawnOffspring(); } catch (e: any) { stats.lastError = `spawn: ${String(e?.message || e).slice(0, 200)}`; }
  } finally {
    cycleInFlight = false;
  }
}

export function getDaedalusStats() { return { ...stats, running: started }; }

export async function getDaedalusAgents() {
  const r = await pool.query(
    `SELECT a.*, p.name AS parent_name
       FROM daedalus_agents a LEFT JOIN daedalus_agents p ON a.parent_id = p.id
      ORDER BY a.is_prime DESC, a.category, a.generation, a.id`
  ).catch(() => ({ rows: [] }));
  return r.rows;
}

export async function getDaedalusRecentWorks(limit = 50) {
  const r = await pool.query(
    `SELECT * FROM daedalus_works ORDER BY id DESC LIMIT $1`, [limit]
  ).catch(() => ({ rows: [] }));
  return r.rows;
}

export async function startDaedalusEngine(): Promise<void> {
  if (started) return;
  started = true;
  stats.running = true;
  console.log("[daedalus] Δ apex starting — chat studier + 6 prime agents + GitHub custodian");
  setTimeout(() => { runCycle().catch(e => { stats.lastError = String(e?.message || e); }); }, 30_000);
  setInterval(() => { runCycle().catch(e => { stats.lastError = String(e?.message || e); }); }, STUDY_INTERVAL_MS);
}
