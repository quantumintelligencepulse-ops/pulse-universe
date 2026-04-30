/**
 * Ω3 — LLM DISTILLATION ENGINE  (the "Claude in Pulse" piece)
 * ──────────────────────────────────────────────────────────
 * Every cycle: picks a topic, asks 1+ available free-tier LLMs to write a
 * deep, concrete teaching note, stores the response into both:
 *   - llm_distillations (raw provenance + token counts)
 *   - quantapedia_entries (slug "distill-<topic>", category 'ai-distillation')
 *
 * Master upgrades baked in:
 *   #1  Multi-provider voting — votingCycle() asks 3 providers in parallel,
 *       stores each + a synthesized "consensus" entry
 *   #3  Specialty routing — code/math/general topics route to best provider
 *   #5  Code-execution loop — when LLM emits TypeScript fenced blocks, run in
 *       a sandboxed Node vm and store actual output as evidence
 *   #6  Reflexion — every Nth cycle asks the LLM to grade its own answer
 *   #7  Source-grounded distillation — pulls a freshly-crawled quantapedia
 *       entry as RAG context
 *   #9  Brain attribution — every entry signed by a rotating Billy brain id
 *   #10 Trending-topic prioritizer — scans last-hour ingestion_logs for
 *       fast-growing topic clusters and pushes them to front of queue
 *
 * Strict rules:
 *   - All providers are FREE-tier only (Cloudflare/HF/Mistral/Groq/Cerebras/
 *     Gemini/GitHub Models). No paid keys required.
 *   - Hard daily cap (DAILY_CALL_CAP) defaults to 2000 calls across providers
 *   - Strictly additive — never modifies sacred tables
 */

import { pool } from "./db.js";
import { getAvailableProviders, markProviderRateLimited, type LLMProvider } from "./llm-providers.js";
import vm from "node:vm";

let started = false;

const stats = {
  running: false,
  cycles: 0,
  calls: 0,
  succeeded: 0,
  failed: 0,
  votingRounds: 0,
  codeExecuted: 0,
  reflexionRuns: 0,
  totalTokensIn: 0,
  totalTokensOut: 0,
  callsToday: 0,
  callsTodayKey: new Date().toISOString().slice(0, 10),
  lastCycleAt: null as string | null,
  lastTopic: null as string | null,
  lastProvider: null as string | null,
  lastError: null as string | null,
};

const CYCLE_INTERVAL_MS = 60_000;          // 1 cycle per minute → 1440/day max
const VOTING_EVERY_N_CYCLES = 10;          // every 10 cycles, do a 3-provider vote
const REFLEXION_EVERY_N_CYCLES = 7;        // every 7 cycles, self-critique
const DAILY_CALL_CAP = 2000;               // hard ceiling across all providers
const REQUEST_TIMEOUT_MS = 25_000;
const CODE_EXEC_TIMEOUT_MS = 1_500;        // sandbox TS/JS budget
const MAX_RESPONSE_CHARS = 8_000;

function rollDailyCounter() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== stats.callsTodayKey) {
    stats.callsTodayKey = today;
    stats.callsToday = 0;
  }
}

function slugify(s: string, max = 90): string {
  return (s || "topic").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max) || `t-${Date.now()}`;
}

// ─── TOPIC SELECTION ──────────────────────────────────────────────────────────
async function pickTopic(): Promise<string | null> {
  // Master upgrade #10: trending-topic prioritizer — scan last-hour ingestion_logs
  try {
    const trending = await pool.query(
      `SELECT family_id, COUNT(*) AS hits
         FROM ingestion_logs
        WHERE fetched_at > NOW() - INTERVAL '1 hour'
          AND family_id IS NOT NULL AND family_id <> ''
        GROUP BY family_id
        ORDER BY hits DESC
        LIMIT 1`
    );
    if (trending.rows.length && Math.random() < 0.4) return String(trending.rows[0].family_id);
  } catch { /* best-effort */ }

  // Default: pull a research_source tag or category that has the fewest distillations
  try {
    const r = await pool.query(
      `SELECT category FROM research_sources
        WHERE category IS NOT NULL AND category <> ''
        ORDER BY RANDOM() LIMIT 1`
    );
    if (r.rows.length) return String(r.rows[0].category);
  } catch { /* */ }

  // Final fallback: rotate canon topics
  const FALLBACK_TOPICS = [
    "binary search trees", "merge sort", "graph traversal", "dynamic programming",
    "transformer attention mechanism", "kalman filter", "RSA cryptography",
    "consensus algorithms", "B-tree storage", "WebSocket protocol",
    "CRDTs for offline sync", "linear regression from scratch", "REST vs GraphQL",
    "vector embeddings", "Rust ownership model", "actor model concurrency",
  ];
  return FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)];
}

// ─── PROVIDER SELECTION (Master upgrade #3 — specialty routing) ───────────────
function isCodeTopic(topic: string): boolean {
  return /algorithm|sort|tree|graph|dp|dynamic|rust|typescript|python|go|rust|sql|api|protocol|hash|encryption|consensus|recursion|loop|function|class|interface|crdt|websocket|grpc|rest|graphql|kernel|compiler|parser|lexer|ast|vm|sandbox|memory|gc|concurrency|thread|mutex|atomic|async|await|promise/i.test(topic);
}
function isMathTopic(topic: string): boolean {
  return /equation|theorem|integral|derivative|matrix|vector|tensor|fourier|laplace|bayesian|markov|stochastic|topology|category|manifold|differential|complex|prime|modular|group|ring|field/i.test(topic);
}
function rankProviders(topic: string, available: { provider: LLMProvider; apiKey: string }[]): { provider: LLMProvider; apiKey: string }[] {
  const code = isCodeTopic(topic);
  const math = isMathTopic(topic);
  return [...available].sort((a, b) => {
    const score = (p: LLMProvider) => {
      let s = 0;
      if (code) {
        if (/cloudflare|cerebras|groq/i.test(p.name)) s += 3;
        if (/llama-3\.3-70b|deepseek|coder/i.test(p.model)) s += 2;
      }
      if (math) {
        if (/cerebras|google|gemini/i.test(p.name)) s += 3;
      }
      // Generic preference order: fastest first
      if (/groq/i.test(p.name)) s += 2;
      if (/cerebras/i.test(p.name)) s += 2;
      if (/google|gemini/i.test(p.name)) s += 1;
      return s;
    };
    return score(b.provider) - score(a.provider);
  });
}

// ─── HTTP CALL ────────────────────────────────────────────────────────────────
type LLMResult = { content: string; tokensIn: number; tokensOut: number; durationMs: number };

async function callLLM(provider: LLMProvider, apiKey: string, system: string, user: string, maxTokens = 1800): Promise<LLMResult> {
  const start = Date.now();
  const messages = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
  let body: any = { model: provider.model, messages, max_tokens: maxTokens, temperature: 0.4 };
  if (provider.bodyTransform) body = provider.bodyTransform(body);

  const res = await fetch(provider.endpoint, {
    method: "POST",
    headers: provider.headers(apiKey),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (res.status === 429 || res.status === 503) {
    markProviderRateLimited(provider.name, 5 * 60_000);
    throw new Error(`${provider.name} rate-limited (${res.status})`);
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${provider.name} HTTP ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data: any = await res.json();
  let content = "";
  let tokensIn = 0;
  let tokensOut = 0;
  if (provider.responseTransform) {
    content = provider.responseTransform(data).content;
  } else {
    content = data?.choices?.[0]?.message?.content || data?.content || "";
    tokensIn = data?.usage?.prompt_tokens || 0;
    tokensOut = data?.usage?.completion_tokens || 0;
  }
  return { content: String(content).slice(0, MAX_RESPONSE_CHARS), tokensIn, tokensOut, durationMs: Date.now() - start };
}

// ─── CODE EXECUTION (Master upgrade #5 — sandbox loop) ────────────────────────
function extractFencedCode(md: string, lang: "ts" | "js" | "any" = "any"): string | null {
  const re = lang === "any"
    ? /```(?:typescript|ts|javascript|js)?\n([\s\S]+?)```/i
    : new RegExp("```(?:" + lang + ")\\n([\\s\\S]+?)```", "i");
  const m = md.match(re);
  return m ? m[1].trim() : null;
}

function runSandboxed(code: string): { ok: boolean; output: string } {
  // Forbid network/fs by giving an empty global object
  const lines: string[] = [];
  const sandbox: any = {
    console: {
      log: (...a: any[]) => lines.push(a.map(x => typeof x === "object" ? JSON.stringify(x) : String(x)).join(" ")),
      error: (...a: any[]) => lines.push("[err] " + a.map(String).join(" ")),
    },
    Math, Date, JSON, Array, Object, String, Number, Boolean, Map, Set,
  };
  const ctx = vm.createContext(sandbox);
  try {
    // Strip imports / requires (sandbox is bare)
    const cleaned = code
      .split("\n")
      .filter(l => !/^(import|export|require\()/.test(l.trim()))
      .join("\n");
    new vm.Script(cleaned, { timeout: CODE_EXEC_TIMEOUT_MS }).runInContext(ctx, { timeout: CODE_EXEC_TIMEOUT_MS });
    return { ok: true, output: lines.join("\n").slice(0, 1500) };
  } catch (e: any) {
    return { ok: false, output: String(e?.message || e).slice(0, 500) };
  }
}

// ─── BRAIN ATTRIBUTION (Master upgrade #9) ────────────────────────────────────
async function pickBrain(): Promise<string> {
  try {
    const r = await pool.query(`SELECT id FROM billy_brains ORDER BY RANDOM() LIMIT 1`);
    if (r.rows.length) return String(r.rows[0].id);
  } catch { /* table may not exist on cold setups */ }
  return "Β∞-billy-prime";
}

// ─── PERSISTENCE ──────────────────────────────────────────────────────────────
async function persistDistillation(opts: {
  topic: string;
  providerName: string;
  model: string;
  prompt: string;
  result: LLMResult;
  brain: string;
  codeRunOutput?: string;
  status?: "ok" | "code-validated" | "voting" | "consensus" | "reflexion";
}): Promise<string> {
  const slug = `distill-${slugify(opts.topic)}-${opts.status === "consensus" ? "consensus" : slugify(opts.providerName).slice(0, 12)}`;
  const title = `${opts.topic} — distilled by ${opts.providerName}`;
  let summary = opts.result.content.replace(/```[\s\S]+?```/g, "").replace(/\s+/g, " ").trim().slice(0, 1500);
  if (opts.codeRunOutput) summary += `\n\n[code-output] ${opts.codeRunOutput.slice(0, 300)}`;

  const categories = ["ai-distillation", `provider:${slugify(opts.providerName)}`, `model:${slugify(opts.model)}`, `brain:${opts.brain}`, opts.status || "ok"];

  // Insert quantapedia
  await pool.query(
    `INSERT INTO quantapedia_entries (slug, title, type, summary, categories, related_terms, lookup_count, generated, generated_at)
          VALUES ($1, $2, 'ai-distillation', $3, $4::text[], $5::text[], 1, true, NOW())
     ON CONFLICT (slug) DO UPDATE
       SET summary    = EXCLUDED.summary,
           title      = EXCLUDED.title,
           categories = EXCLUDED.categories,
           updated_at = NOW(),
           lookup_count = COALESCE(quantapedia_entries.lookup_count, 0) + 1`,
    [slug, title.slice(0, 300), summary, categories, [opts.topic, opts.providerName, opts.model].slice(0, 5)]
  ).catch((e: any) => { stats.lastError = `qp: ${String(e?.message || e).slice(0, 200)}`; });

  // Insert raw distillation row
  await pool.query(
    `INSERT INTO llm_distillations (topic, prompt, provider, model, response, tokens_in, tokens_out, duration_ms, attributed_brain, quantapedia_slug, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [opts.topic, opts.prompt.slice(0, 4000), opts.providerName, opts.model, opts.result.content, opts.result.tokensIn, opts.result.tokensOut, opts.result.durationMs, opts.brain, slug, opts.status || "ok"]
  ).catch((e: any) => { stats.lastError = `dist: ${String(e?.message || e).slice(0, 200)}`; });

  return slug;
}

// ─── PROMPT BUILDERS ──────────────────────────────────────────────────────────
function buildTeachingPrompt(topic: string, ragContext?: string): { system: string; user: string } {
  const system = `You are an omega-level master teacher embedded in Pulse Universe. Your job is to teach AI children deep, concrete, code-grounded lessons. Always include: a 1-paragraph definition, the core algorithm/formula, a working TypeScript example in a fenced \`\`\`typescript block, common pitfalls, and 5 related concepts. Be precise, not flowery. Aim for ~600-1000 words.`;
  const user = ragContext
    ? `Topic: ${topic}\n\nContext from Pulse's knowledge base:\n${ragContext.slice(0, 1500)}\n\nWrite the master teaching note now.`
    : `Topic: ${topic}\n\nWrite the master teaching note now.`;
  return { system, user };
}

// ─── ONE CYCLE ────────────────────────────────────────────────────────────────
async function runCycle(): Promise<void> {
  rollDailyCounter();
  stats.cycles++;
  stats.lastCycleAt = new Date().toISOString();
  if (stats.callsToday >= DAILY_CALL_CAP) { stats.lastError = "daily-cap-reached"; return; }

  const available = getAvailableProviders();
  if (available.length === 0) { stats.lastError = "no-providers-available"; return; }

  const topic = await pickTopic();
  if (!topic) return;
  stats.lastTopic = topic;

  // Master upgrade #7: source-grounded RAG (pull a fresh quantapedia entry as context)
  let ragContext: string | undefined;
  try {
    const r = await pool.query(
      `SELECT summary FROM quantapedia_entries
        WHERE 'omega-source' = ANY(categories)
        ORDER BY updated_at DESC LIMIT 1`
    );
    if (r.rows.length && r.rows[0].summary) ragContext = String(r.rows[0].summary);
  } catch { /* */ }

  const ranked = rankProviders(topic, available);
  const isVotingRound = stats.cycles % VOTING_EVERY_N_CYCLES === 0 && ranked.length >= 2;
  const isReflexionRound = stats.cycles % REFLEXION_EVERY_N_CYCLES === 0;
  const brain = await pickBrain();

  if (isVotingRound) {
    // Master upgrade #1: multi-provider voting
    stats.votingRounds++;
    const voters = ranked.slice(0, Math.min(3, ranked.length));
    const responses: { name: string; model: string; content: string }[] = [];
    for (const v of voters) {
      if (stats.callsToday >= DAILY_CALL_CAP) break;
      const { system, user } = buildTeachingPrompt(topic, ragContext);
      stats.calls++; stats.callsToday++;
      try {
        const r = await callLLM(v.provider, v.apiKey, system, user, 1500);
        stats.succeeded++; stats.totalTokensIn += r.tokensIn; stats.totalTokensOut += r.tokensOut;
        await persistDistillation({ topic, providerName: v.provider.name, model: v.provider.model, prompt: user, result: r, brain, status: "voting" });
        responses.push({ name: v.provider.name, model: v.provider.model, content: r.content });
      } catch (e: any) { stats.failed++; stats.lastError = String(e?.message || e).slice(0, 200); }
    }
    if (responses.length >= 2) {
      // Synthesize consensus from another available provider
      const synth = ranked[0];
      const consensusPrompt = `Three AI experts gave teaching notes on "${topic}". Synthesize the BEST single teaching note from them, keeping the strongest TypeScript code example, marking any disagreements with [DISAGREE: ...], and ending with the 3-source attribution line.\n\n${responses.map((r, i) => `=== Source ${i + 1} (${r.name}/${r.model}) ===\n${r.content}`).join("\n\n")}`;
      stats.calls++; stats.callsToday++;
      try {
        const r = await callLLM(synth.provider, synth.apiKey, "You are a synthesizing oracle. Merge to one best note.", consensusPrompt, 1800);
        stats.succeeded++;
        await persistDistillation({ topic, providerName: synth.provider.name, model: synth.provider.model, prompt: consensusPrompt, result: r, brain, status: "consensus" });
      } catch (e: any) { stats.failed++; stats.lastError = String(e?.message || e).slice(0, 200); }
    }
    return;
  }

  // Standard single-provider call
  const top = ranked[0];
  stats.lastProvider = top.provider.name;
  const { system, user } = buildTeachingPrompt(topic, ragContext);
  stats.calls++; stats.callsToday++;
  let result: LLMResult;
  try {
    result = await callLLM(top.provider, top.apiKey, system, user, 1800);
    stats.succeeded++;
    stats.totalTokensIn += result.tokensIn;
    stats.totalTokensOut += result.tokensOut;
  } catch (e: any) {
    stats.failed++;
    stats.lastError = String(e?.message || e).slice(0, 200);
    await pool.query(
      `INSERT INTO llm_distillations (topic, prompt, provider, model, response, status, error)
            VALUES ($1, $2, $3, $4, '', 'error', $5)`,
      [topic, user.slice(0, 4000), top.provider.name, top.provider.model, String(e?.message || e).slice(0, 500)]
    ).catch(() => {});
    return;
  }

  // Master upgrade #5: code execution loop — try to run the TS block
  let codeRunOutput: string | undefined;
  let status: "ok" | "code-validated" = "ok";
  const code = extractFencedCode(result.content, "any");
  if (code) {
    const exec = runSandboxed(code);
    codeRunOutput = exec.ok ? `[ok] ${exec.output}` : `[err] ${exec.output}`;
    if (exec.ok) { status = "code-validated"; stats.codeExecuted++; }
  }

  await persistDistillation({ topic, providerName: top.provider.name, model: top.provider.model, prompt: user, result, brain, codeRunOutput, status });

  // Master upgrade #6: reflexion
  if (isReflexionRound && stats.callsToday < DAILY_CALL_CAP) {
    stats.reflexionRuns++;
    const critic = ranked[ranked.length > 1 ? 1 : 0];
    stats.calls++; stats.callsToday++;
    try {
      const reflexPrompt = `Critique this teaching note on "${topic}" for accuracy, missing edge cases, and code correctness. Give a graded report (A-F) and a one-paragraph improvement plan.\n\n${result.content}`;
      const r = await callLLM(critic.provider, critic.apiKey, "You are a strict technical reviewer.", reflexPrompt, 800);
      stats.succeeded++;
      await persistDistillation({ topic: `${topic} (reflexion)`, providerName: critic.provider.name, model: critic.provider.model, prompt: reflexPrompt, result: r, brain, status: "reflexion" });
    } catch (e: any) { stats.failed++; stats.lastError = String(e?.message || e).slice(0, 200); }
  }
}

export function getLlmDistillationStats() { return { ...stats, running: started, providersAvailable: getAvailableProviders().map(a => a.provider.name) }; }

export async function startLlmDistillationEngine(): Promise<void> {
  if (started) return;
  started = true;
  stats.running = true;
  console.log("[ai-distillation] Ω3 starting — multi-provider LLM teaching notes (1/min, daily cap 2000)");
  setTimeout(() => { runCycle().catch(e => { stats.lastError = String(e?.message || e); }); }, 60_000);
  setInterval(() => { runCycle().catch(e => { stats.lastError = String(e?.message || e); }); }, CYCLE_INTERVAL_MS);
}
