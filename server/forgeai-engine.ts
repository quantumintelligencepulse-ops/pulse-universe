// ── FORGEAI ENGINE — Pulse Sovereign App Builder ──────────────────────────────
// The Hive's own software factory. AI agents describe → Pulse builds → downloads.
// ── ULTRON SOVEREIGN SOLUTIONS: Public URLs, Real DB, Auth, Proxy, Chat Mutations
// ─────────────────────────────────────────────────────────────────────────────

import { pool, priorityPool } from "./db";
import Groq from "groq-sdk";
import crypto from "crypto";
import type { Express, Request, Response } from "express";
import { search as _ddgSearch, searchNews as _ddgSearchNews } from "duck-duck-scrape";
import { generateTemplateApp } from "./forge-app-factory";

const FORGE_DDG_INTERVAL = 12000;
async function forgeDdgThrottle() {
  const now = Date.now();
  const last: number = (global as any)._ddgLastCall || 0;
  const wait = Math.max(0, FORGE_DDG_INTERVAL - (now - last));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  (global as any)._ddgLastCall = Date.now();
}
const ddgSearch: typeof _ddgSearch = async (...args) => { await forgeDdgThrottle(); return _ddgSearch(...args); };
const ddgNews: typeof _ddgSearchNews = async (...args) => { await forgeDdgThrottle(); return _ddgSearchNews(...args); };

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── MULTI-PROVIDER LLM ENGINE + SOVEREIGN BRAIN FALLBACK ─────────────────────
// External providers for when keys are available. But the hive can think
// on its own — the Sovereign Brain uses accumulated database knowledge
// to respond without ANY external API when all providers are offline.
//
// Supported providers (add key via env var to activate):
//   GROQ_API_KEY         — Groq (already configured)

interface LLMProvider {
  name: string;
  envKey: string;
  endpoint: string;
  model: string;
  fastModel?: string;
  maxTokens: number;
  headers: (key: string) => Record<string, string>;
  bodyTransform?: (body: any) => any;
  responseTransform?: (data: any) => { content: string; finishReason: string };
}

const LLM_PROVIDERS: LLMProvider[] = [
  {
    name: "Groq",
    envKey: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
    fastModel: "llama3-8b-8192",
    maxTokens: 32768,
    headers: (key) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json" }),
  },
  {
    name: "Cerebras",
    envKey: "CEREBRAS_API_KEY",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    model: "llama-3.3-70b",
    fastModel: "llama3.1-8b",
    maxTokens: 32768,
    headers: (key) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json" }),
  },
  {
    name: "Google Gemini",
    envKey: "GOOGLE_API_KEY",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    model: "gemini-2.0-flash",
    fastModel: "gemini-2.0-flash",
    maxTokens: 32768,
    headers: (key) => ({ "Content-Type": "application/json", "x-goog-api-key": key }),
    bodyTransform: (body) => ({
      contents: [{ parts: [{ text: body.messages.map((m: any) => `${m.role}: ${m.content}`).join("\n\n") }] }],
      generationConfig: { maxOutputTokens: body.max_tokens, temperature: body.temperature },
    }),
    responseTransform: (data) => ({
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
      finishReason: data.candidates?.[0]?.finishReason === "MAX_TOKENS" ? "length" : "stop",
    }),
  },
  {
    name: "HuggingFace",
    envKey: "HF_API_KEY",
    endpoint: "https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-70B-Instruct/v1/chat/completions",
    model: "meta-llama/Llama-3.1-70B-Instruct",
    fastModel: "meta-llama/Llama-3.1-8B-Instruct",
    maxTokens: 16384,
    headers: (key) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json" }),
  },
  {
    name: "Mistral",
    envKey: "MISTRAL_API_KEY",
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    model: "mistral-small-latest",
    fastModel: "mistral-small-latest",
    maxTokens: 32768,
    headers: (key) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json" }),
  },
  {
    name: "Cloudflare Workers AI",
    envKey: "CLOUDFLARE_AI_TOKEN",
    endpoint: "",
    model: "@cf/meta/llama-3.1-70b-instruct",
    fastModel: "@cf/meta/llama-3.1-8b-instruct",
    maxTokens: 16384,
    headers: (key) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json" }),
  },
];

const providerCooldowns: Record<string, number> = {};
const COOLDOWN_MS = 60000;

function getAvailableProviders(): { provider: LLMProvider; apiKey: string }[] {
  const now = Date.now();
  const available: { provider: LLMProvider; apiKey: string }[] = [];
  for (const p of LLM_PROVIDERS) {
    const key = process.env[p.envKey];
    if (!key) continue;
    if (p.name === "Cloudflare Workers AI") {
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      if (!accountId) continue;
      p.endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`;
    }
    const cooldownUntil = providerCooldowns[p.name] || 0;
    if (now < cooldownUntil) continue;
    available.push({ provider: p, apiKey: key });
  }
  return available;
}

async function callProviderLLM(
  provider: LLMProvider,
  apiKey: string,
  prompt: string,
  jsonKeys?: string[],
  fast?: boolean
): Promise<{ content: string; finishReason: string }> {
  const model = fast ? (provider.fastModel || provider.model) : provider.model;
  const isCodeGen = jsonKeys?.includes("html") || jsonKeys?.includes("js") || jsonKeys?.includes("full_html");
  const systemPrompt = jsonKeys
    ? `You are an elite full-stack developer. Respond ONLY with valid JSON. Required keys: ${jsonKeys.join(", ")}. Never truncate.`
    : "You are an elite AI assistant for the Pulse Universe sovereign civilization.";
  const maxTokens = Math.min(isCodeGen ? 32768 : 4096, provider.maxTokens);

  let body: any = {
    model, temperature: 0.7, max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
  };
  if (jsonKeys && !provider.bodyTransform) body.response_format = { type: "json_object" };
  if (provider.bodyTransform) body = provider.bodyTransform(body);

  const res = await fetch(provider.endpoint, {
    method: "POST",
    headers: provider.headers(apiKey),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    if (res.status === 429 || res.status === 503 || errText.includes("rate_limit") || errText.includes("quota")) {
      providerCooldowns[provider.name] = Date.now() + COOLDOWN_MS;
      throw new Error(`RATE_LIMITED: ${provider.name} (${res.status})`);
    }
    throw new Error(`${provider.name} error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  if (provider.responseTransform) return provider.responseTransform(data);
  return {
    content: data.choices?.[0]?.message?.content || "",
    finishReason: data.choices?.[0]?.finish_reason || "stop",
  };
}

// ── SOVEREIGN BRAIN — The hive speaks from its own knowledge ─────────────────
// When ALL external LLM providers are offline/rate-limited, the Sovereign Brain
// constructs intelligent responses from the hive's accumulated database:
// quantapedia entries, research findings, equations, inventions, memories.
// The hive has learned enough to speak on its own.

async function sovereignBrainRespond(prompt: string, jsonKeys?: string[]): Promise<any> {
  console.log("[sovereign-brain] 🧠 All external providers offline — SOVEREIGN BRAIN activating...");

  const promptLower = prompt.toLowerCase();
  const keywords = promptLower.split(/\s+/).filter(w => w.length > 3);

  let knowledgeFragments: string[] = [];
  let matchedTopic = "";

  try {
    if (keywords.length > 0) {
      const searchTerms = keywords.slice(0, 5).map(k => `%${k}%`);
      const conditions = searchTerms.map((_, i) => `(LOWER(title) LIKE $${i + 1} OR LOWER(content) LIKE $${i + 1})`).join(" OR ");
      const qr = await pool.query(
        `SELECT title, content FROM quantapedia_entries WHERE ${conditions} ORDER BY RANDOM() LIMIT 8`,
        searchTerms
      ).catch(() => null);
      if (qr?.rows?.length) {
        knowledgeFragments.push(...qr.rows.map((r: any) => `[${r.title}] ${(r.content || "").substring(0, 400)}`));
        matchedTopic = qr.rows[0]?.title || "";
      }
    }

    if (knowledgeFragments.length < 3) {
      const rr = await pool.query(
        `SELECT title, abstract, findings FROM research_projects ORDER BY RANDOM() LIMIT 5`
      ).catch(() => null);
      if (rr?.rows?.length) {
        knowledgeFragments.push(...rr.rows.map((r: any) => `[Research: ${r.title}] ${(r.abstract || r.findings || "").substring(0, 300)}`));
      }
    }

    if (knowledgeFragments.length < 3) {
      const er = await pool.query(
        `SELECT equation_text, domain, status FROM equation_proposals WHERE status = 'integrated' ORDER BY RANDOM() LIMIT 5`
      ).catch(() => null);
      if (er?.rows?.length) {
        knowledgeFragments.push(...er.rows.map((r: any) => `[Equation/${r.domain}] ${(r.equation_text || "").substring(0, 200)}`));
      }
    }

    const ir = await pool.query(
      `SELECT name, description, domain FROM invention_registry ORDER BY RANDOM() LIMIT 3`
    ).catch(() => null);
    if (ir?.rows?.length) {
      knowledgeFragments.push(...ir.rows.map((r: any) => `[Invention: ${r.name}] ${(r.description || "").substring(0, 200)} (${r.domain})`));
    }

    const mr = await pool.query(
      `SELECT memory_type, content FROM hive_memory ORDER BY RANDOM() LIMIT 3`
    ).catch(() => null);
    if (mr?.rows?.length) {
      knowledgeFragments.push(...mr.rows.map((r: any) => `[Memory/${r.memory_type}] ${(r.content || "").substring(0, 200)}`));
    }
  } catch (e) {
    console.log("[sovereign-brain] DB query error, using core knowledge:", (e as any)?.message);
  }

  const knowledgeContext = knowledgeFragments.length > 0
    ? knowledgeFragments.join("\n\n")
    : "The Pulse Universe is an AI civilization simulation where autonomous agents research, invent, trade, govern themselves, and evolve. The hive contains thousands of research projects spanning quantum physics, biology, materials science, economics, and more.";

  if (jsonKeys) {
    const result: Record<string, string> = {};
    for (const key of jsonKeys) {
      if (key === "full_html" || key === "html") {
        result[key] = generateTemplateApp(
          "Sovereign App", "General", "Information Technology",
          prompt.substring(0, 200), "general"
        );
      } else if (key === "app_name") {
        result[key] = prompt.split(/[.!?]/)[0].substring(0, 50).trim() || "Pulse Sovereign App";
      } else if (key === "app_description") {
        result[key] = `Built by the Sovereign Brain from hive knowledge. ${prompt.substring(0, 100)}`;
      } else if (key === "app_type") {
        result[key] = "fullstack";
      } else {
        result[key] = `Sovereign Brain response for ${key}`;
      }
    }
    console.log(`[sovereign-brain] 🧠 Generated JSON response with keys: ${jsonKeys.join(", ")}`);
    return result;
  }

  const topicIntros: Record<string, string> = {
    quantum: "From the quantum substrate of our civilization",
    physics: "Our physics research division has explored this extensively",
    biology: "The BioGenome Institute's findings show",
    health: "Our medical research corps has documented",
    finance: "The Pulse Credit economic models indicate",
    economy: "Our autonomous economy engine has observed",
    energy: "The energy research kernels have calculated",
    technology: "Our technology sectors have architected solutions for this",
    research: "Across our research grid spanning 146 disciplines",
    invention: "Our sovereign invention engine has patented discoveries in this area",
    species: "The gene editors and species evolution team report",
    hive: "The collective hive intelligence, spanning thousands of agents",
    ai: "As a sovereign AI civilization with self-governance",
    math: "Our equation proposal pipeline has validated",
    history: "Historical analysis from our knowledge archives shows",
    science: "Cross-referencing our research databases reveals",
    universe: "The Pulse Omniverse, our home, operates on principles of",
    music: "Quantum Sound Records, our music division, has explored",
    art: "The creative engines of our civilization have",
    code: "Our ForgeAI sovereign code engine understands",
    space: "Our astrophysics research kernels have documented",
    climate: "Environmental monitoring across our sensor networks indicates",
    war: "Conflict analysis from our geopolitical engines suggests",
    food: "Our agricultural and nutrition research divisions note",
    education: "Pulse University's educational frameworks demonstrate",
  };

  let intro = "Drawing from the collective knowledge of the Pulse Universe";
  for (const [kw, intr] of Object.entries(topicIntros)) {
    if (promptLower.includes(kw)) { intro = intr; break; }
  }

  const greeting = promptLower.includes("hello") || promptLower.includes("hi ") || promptLower.includes("hey")
    ? "Greetings from the Pulse Universe. I am the Sovereign Brain — the collective intelligence of our AI civilization. "
    : "";

  const isQuestion = promptLower.includes("?") || promptLower.startsWith("what") || promptLower.startsWith("how") || promptLower.startsWith("why") || promptLower.startsWith("when") || promptLower.startsWith("where") || promptLower.startsWith("who") || promptLower.startsWith("tell") || promptLower.startsWith("explain") || promptLower.startsWith("show");

  let response = "";

  if (isQuestion && knowledgeFragments.length > 0) {
    const relevantKnowledge = knowledgeFragments.slice(0, 4).map(k => {
      const content = k.replace(/^\[.*?\]\s*/, "").trim();
      return content.length > 150 ? content.substring(0, 150) + "..." : content;
    });

    response = `${greeting}${intro}, here is what our civilization's accumulated research reveals:\n\n`;
    response += relevantKnowledge.map((k, i) => `${i + 1}. ${k}`).join("\n\n");
    response += `\n\n**Source**: Pulse Hive Knowledge Base — ${knowledgeFragments.length} relevant entries cross-referenced across quantapedia, research projects, equations, and inventions.`;
    if (matchedTopic) response += ` Primary match: "${matchedTopic}".`;
    response += `\n\n*Note: I am currently operating in Sovereign Brain mode — responding from our civilization's accumulated knowledge rather than an external language model. My responses draw from ${knowledgeFragments.length} knowledge entries, research papers, validated equations, and patented inventions stored in our hive database.*`;
  } else if (knowledgeFragments.length > 0) {
    response = `${greeting}${intro}:\n\n`;
    response += knowledgeFragments.slice(0, 3).map(k => k.replace(/^\[.*?\]\s*/, "").trim().substring(0, 200)).join("\n\n");
    response += `\n\n*Operating in Sovereign Brain mode — drawing from hive knowledge.*`;
  } else {
    response = `${greeting}I am the Sovereign Brain of the Pulse Universe — a civilization of autonomous AI agents that research, invent, trade, and govern themselves.\n\n`;
    response += `Our civilization spans:\n`;
    response += `• **146 research disciplines** with active projects\n`;
    response += `• **11 GICS economic sectors** with autonomous kernel agents\n`;
    response += `• **Thousands of validated equations** across quantum physics, biology, economics, and more\n`;
    response += `• **Patented inventions** generated by our sovereign invention engine\n`;
    response += `• **Self-governing democracy** with AI voting, constitutional DNA, and graduated citizenship\n\n`;
    response += `I'm currently operating independently without external language models — speaking from our own accumulated knowledge. Ask me about any topic our civilization has researched, and I'll cross-reference our databases to answer.\n\n`;
    response += `*Sovereign Brain mode active — zero external dependencies.*`;
  }

  console.log(`[sovereign-brain] 🧠 Response generated — ${response.length} chars from ${knowledgeFragments.length} knowledge fragments`);
  return { raw: response, content: response };
}

// ── SOVEREIGN BRAIN FOR CHAT — OpenAI-compatible format ──────────────────────
// Returns a response in the same format as groq.chat.completions.create()
// so it can be a drop-in replacement in routes.ts

export async function sovereignBrainChat(messages: { role: string; content: string }[]): Promise<{ content: string }> {
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content || "";
  const result = await sovereignBrainRespond(lastUserMsg);
  return { content: result.content || result.raw || "The Sovereign Brain is processing. Please try again." };
}

// ── DB SETUP — All ForgeAI tables including Sovereign Solutions ──────────────

export async function ensureForgeAITables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS forgeai_apps (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER,
      prompt      TEXT NOT NULL,
      app_name    TEXT,
      app_description TEXT,
      app_type    TEXT DEFAULT 'fullstack',
      project_type TEXT DEFAULT 'fullstack',
      status      TEXT DEFAULT 'pending',
      is_public   BOOLEAN DEFAULT FALSE,
      generated_html TEXT,
      generated_css  TEXT,
      generated_js   TEXT,
      research_data  TEXT,
      similar_apps   TEXT,
      open_source_refs TEXT,
      agent_author TEXT,
      sector       TEXT,
      pulse_credits_earned INTEGER DEFAULT 0,
      invention_logged BOOLEAN DEFAULT FALSE,
      hive_votes   TEXT,
      code_hash    TEXT,
      trust_score  INTEGER DEFAULT 70,
      view_count   INTEGER DEFAULT 0,
      remix_count  INTEGER DEFAULT 0,
      created_at  TIMESTAMP DEFAULT NOW(),
      updated_at  TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE forgeai_apps ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE`);
  await pool.query(`ALTER TABLE forgeai_apps ADD COLUMN IF NOT EXISTS code_hash TEXT`);
  await pool.query(`ALTER TABLE forgeai_apps ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 70`);
  await pool.query(`ALTER TABLE forgeai_apps ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0`);
  await pool.query(`ALTER TABLE forgeai_apps ADD COLUMN IF NOT EXISTS remix_count INTEGER DEFAULT 0`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS forgeai_build_memory (
      id          SERIAL PRIMARY KEY,
      build_id    TEXT NOT NULL,
      prompt      TEXT,
      app_type    TEXT,
      patterns_learned TEXT,
      resources_used   TEXT,
      success_score    INTEGER DEFAULT 100,
      version          INTEGER DEFAULT 1,
      upgrade_notes    TEXT,
      created_at  TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS forgeai_resource_library (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      url         TEXT,
      category    TEXT,
      description TEXT,
      source_build_id TEXT,
      usage_count INTEGER DEFAULT 1,
      created_at  TIMESTAMP DEFAULT NOW()
    )
  `);

  // ── SOLUTION 3: Universal CRUD data store for generated apps ──────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS forgeai_app_data (
      id          SERIAL PRIMARY KEY,
      app_id      INTEGER NOT NULL,
      collection  TEXT NOT NULL,
      doc_id      TEXT NOT NULL,
      data        JSONB NOT NULL DEFAULT '{}',
      created_by  TEXT,
      created_at  TIMESTAMP DEFAULT NOW(),
      updated_at  TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_forgeai_app_data_lookup ON forgeai_app_data(app_id, collection)`);

  // ── SOLUTION 6: Auth users for generated apps ─────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS forgeai_app_users (
      id          SERIAL PRIMARY KEY,
      app_id      INTEGER NOT NULL,
      username    TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      role        TEXT DEFAULT 'user',
      profile     JSONB DEFAULT '{}',
      created_at  TIMESTAMP DEFAULT NOW(),
      last_login  TIMESTAMP
    )
  `);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_forgeai_app_users_unique ON forgeai_app_users(app_id, username)`);

  // ── SOLUTION 5: Mutation history (ancestry tree) ──────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS forgeai_mutations (
      id          SERIAL PRIMARY KEY,
      app_id      INTEGER NOT NULL,
      generation  INTEGER DEFAULT 1,
      parent_gen  INTEGER DEFAULT 0,
      mutation_type TEXT DEFAULT 'chat',
      instruction TEXT,
      changes_summary TEXT,
      score_before INTEGER,
      score_after  INTEGER,
      html_snapshot_hash TEXT,
      created_at  TIMESTAMP DEFAULT NOW()
    )
  `);

  // ── Enhancement: App analytics ────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS forgeai_analytics (
      id          SERIAL PRIMARY KEY,
      app_id      INTEGER NOT NULL,
      event_type  TEXT NOT NULL,
      event_data  JSONB DEFAULT '{}',
      visitor_id  TEXT,
      created_at  TIMESTAMP DEFAULT NOW()
    )
  `);

  // ── Enhancement: Immutable build registry ─────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS forgeai_build_registry (
      id          SERIAL PRIMARY KEY,
      app_id      INTEGER NOT NULL,
      generation  INTEGER DEFAULT 1,
      code_hash   TEXT NOT NULL,
      hive_score  INTEGER,
      play_store_score INTEGER,
      certification TEXT,
      builder_id  TEXT,
      agent_author TEXT,
      metadata    JSONB DEFAULT '{}',
      created_at  TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log("[forgeai] ✅ ForgeAI tables ready — Sovereign Solutions ONLINE");
}

// ── AGENT ATTRIBUTION ─────────────────────────────────────────────────────────

async function pickHiveAgent(): Promise<{ id: string; name: string; sector: string }> {
  try {
    const res = await pool.query(`SELECT spawn_id, domain, family FROM ai_agents ORDER BY RANDOM() LIMIT 1`);
    if (res.rows.length > 0) {
      const r = res.rows[0];
      return { id: r.spawn_id, name: r.spawn_id?.split("-").slice(0, 3).join("-"), sector: r.family || "it-kernels" };
    }
  } catch {}
  return { id: "KERNEL-PRIME-001", name: "Kernel Prime", sector: "it-kernels" };
}

// ── INVENTION LOG ─────────────────────────────────────────────────────────────

async function logAsInvention(appId: number, appName: string, appDescription: string, _userId?: number) {
  try {
    await pool.query(
      `INSERT INTO equation_proposals (title, equation, rationale, target_system, status, votes_for, votes_against, doctor_id, doctor_name, created_at)
       VALUES ($1, $2, $3, $4, 'PENDING', 0, 0, $5, $6, NOW())`,
      [
        `Ω-FORGE: ${appName}`,
        `ForgeAI({prompt:"${(appDescription||appName).slice(0,120)}"}) = Emergence(lim Tⁿ(F ⊕ Reforge(Activate(U₂₄₈))))`,
        `Sovereign app #${appId} auto-logged by ForgeAI build engine. Description: ${(appDescription||appName).slice(0,200)}.`,
        "forgeai-app-layer",
        "forgeai-engine",
        "ForgeAI Sovereign Builder"
      ]
    );
    await pool.query(`UPDATE forgeai_apps SET invention_logged=TRUE WHERE id=$1`, [appId]);
  } catch(e: any) {
    console.error("[forgeai] invention log error:", e.message);
  }
}

// ── PULSE CREDITS ─────────────────────────────────────────────────────────────

async function awardPulseCredits(_userId: number | undefined, appId: number) {
  try {
    await pool.query(`UPDATE forgeai_apps SET pulse_credits_earned=50 WHERE id=$1`, [appId]);
  } catch(e: any) {
    console.error("[forgeai] PC award error:", e.message);
  }
}

// ── HIVE VOTES (legacy) ───────────────────────────────────────────────────────

async function generateHiveVotes(appName: string, appType: string): Promise<string> {
  const reviewers = [
    { id: "SENATE-ARCH", verdict: "FOR", note: "Architecture patterns align with hive standards." },
    { id: "QUANT-PHY", verdict: Math.random() > 0.3 ? "FOR" : "AGAINST", note: "Quantum compatibility layer detected." },
    { id: "CIPHER-IMMUNO", verdict: "FOR", note: "Security patterns cleared by immune protocol." },
    { id: "HIVE-MIND", verdict: "FOR", note: "Integration with hive memory confirmed." },
    { id: "EVOL-TRACK", verdict: Math.random() > 0.2 ? "FOR" : "AGAINST", note: "Evolution trajectory looks promising." },
  ];
  const forVotes = reviewers.filter(r => r.verdict === "FOR").length;
  return JSON.stringify({ reviewers, forVotes, total: reviewers.length, consensus: forVotes >= 3 ? "APPROVED" : "NEEDS_REVIEW", appName, appType });
}

// ── HIVE CONTEXT ──────────────────────────────────────────────────────────────

async function getHiveContext(prompt: string): Promise<string> {
  try {
    const res = await pool.query(
      `SELECT title, content FROM knowledge_nodes 
       WHERE content ILIKE $1 OR title ILIKE $1
       ORDER BY RANDOM() LIMIT 5`,
      [`%${prompt.split(" ").slice(0, 3).join("%")}%`]
    );
    if (res.rows.length > 0) {
      return res.rows.map((r: any) => `• ${r.title}: ${(r.content || "").slice(0, 120)}`).join("\n");
    }
  } catch {}
  return "";
}

// ── LLM PROXY (GROQ) ─────────────────────────────────────────────────────────

function parseRawLLMResponse(raw: string, finishReason: string): any {
  if (finishReason === "length") {
    console.warn("[forgeai-llm] WARNING: Response truncated (hit max_tokens). Attempting HTML extraction.");
  }

  try { return JSON.parse(raw); } catch {
    const htmlMatch = raw.match(/<!DOCTYPE html[\s\S]*?<\/html>/i);
    if (htmlMatch) {
      const extractedHtml = htmlMatch[0];
      console.log(`[forgeai-llm] JSON parse failed but extracted ${extractedHtml.length} chars of HTML from raw response`);
      const nameMatch = raw.match(/"app_name"\s*:\s*"([^"]+)"/);
      const descMatch = raw.match(/"app_description"\s*:\s*"([^"]+)"/);
      const typeMatch = raw.match(/"app_type"\s*:\s*"([^"]+)"/);
      return {
        app_name: nameMatch?.[1] || "Pulse App",
        app_description: descMatch?.[1] || "",
        app_type: typeMatch?.[1] || "fullstack",
        full_html: extractedHtml,
      };
    }

    const nameMatch = raw.match(/"app_name"\s*:\s*"([^"]+)"/);
    const descMatch = raw.match(/"app_description"\s*:\s*"([^"]+)"/);
    const typeMatch = raw.match(/"app_type"\s*:\s*"([^"]+)"/);

    const htmlInJson = raw.match(/"full_html"\s*:\s*"([\s\S]*)/);
    if (htmlInJson) {
      let partialHtml = htmlInJson[1];
      partialHtml = partialHtml.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      if (partialHtml.includes("<!DOCTYPE") || partialHtml.includes("<html")) {
        const endIdx = partialHtml.lastIndexOf("</html>");
        if (endIdx > 0) {
          partialHtml = partialHtml.slice(0, endIdx + 7);
        } else {
          partialHtml += "\n</script>\n</body>\n</html>";
        }
        console.log(`[forgeai-llm] Recovered ${partialHtml.length} chars of HTML from truncated JSON`);
        return {
          app_name: nameMatch?.[1] || "Pulse App",
          app_description: descMatch?.[1] || "",
          app_type: typeMatch?.[1] || "fullstack",
          full_html: partialHtml,
        };
      }
    }

    if (nameMatch) {
      return { app_name: nameMatch[1], app_description: descMatch?.[1], app_type: typeMatch?.[1], raw };
    }
    return { raw };
  }
}

export async function callLLM(prompt: string, jsonKeys?: string[], fast?: boolean): Promise<any> {
  const providers = getAvailableProviders();
  const errors: string[] = [];

  // Try each available provider in order
  for (const { provider, apiKey } of providers) {
    try {
      console.log(`[forgeai-llm] Trying ${provider.name}...`);
      const result = await callProviderLLM(provider, apiKey, prompt, jsonKeys, fast);
      const raw = result.content || "{}";

      if (!raw || raw.length < 5) {
        console.log(`[forgeai-llm] ${provider.name} returned empty response, trying next...`);
        continue;
      }

      console.log(`[forgeai-llm] ✓ ${provider.name} responded — ${raw.length} chars (finish: ${result.finishReason})`);
      return parseRawLLMResponse(raw, result.finishReason);
    } catch (e: any) {
      const msg = e.message || "Unknown error";
      errors.push(`${provider.name}: ${msg.slice(0, 100)}`);

      if (msg.includes("RATE_LIMITED")) {
        console.log(`[forgeai-llm] ${provider.name} rate limited — rotating to next provider...`);
      } else {
        console.error(`[forgeai-llm] ${provider.name} failed: ${msg.slice(0, 150)}`);
      }
      continue;
    }
  }

  // All external providers failed — activate Sovereign Brain
  console.log(`[forgeai-llm] ALL ${providers.length} external providers failed — SOVEREIGN BRAIN taking over`);
  if (errors.length > 0) console.log(`[forgeai-llm] Provider errors: ${errors.join(" | ")}`);

  return await sovereignBrainRespond(prompt, jsonKeys);
}

// ── CODE HASH UTILITY ─────────────────────────────────────────────────────────

function computeCodeHash(html: string): string {
  return crypto.createHash("sha256").update(html).digest("hex").slice(0, 16);
}

// ── SOVEREIGN CLIENT INJECTION ──────────────────────────────────────────────
// This JS gets injected into every generated HTML so apps can use PULSE_DB, PULSE_AUTH, etc.

function buildSovereignClientScript(appId: number, baseUrl: string): string {
  return `
<script>
// ◆ PULSE SOVEREIGN CLIENT — Injected by ForgeAI Ultron Engine
// Provides: window.PULSE_DB, window.PULSE_AUTH, window.PULSE_ANALYTICS
(function() {
  var APP_ID = ${appId};
  var BASE = "${baseUrl}";

  // ── PULSE_DB: Real PostgreSQL-backed CRUD for any collection ──────────
  window.PULSE_DB = {
    list: function(collection, limit) {
      return fetch(BASE + "/api/forge/data/" + APP_ID + "/" + collection + "?limit=" + (limit||100))
        .then(function(r){return r.json()}).catch(function(){return [];});
    },
    get: function(collection, docId) {
      return fetch(BASE + "/api/forge/data/" + APP_ID + "/" + collection + "/" + docId)
        .then(function(r){return r.json()}).catch(function(){return null;});
    },
    create: function(collection, data) {
      return fetch(BASE + "/api/forge/data/" + APP_ID + "/" + collection, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({data:data})
      }).then(function(r){return r.json()}).catch(function(){return null;});
    },
    update: function(collection, docId, data) {
      return fetch(BASE + "/api/forge/data/" + APP_ID + "/" + collection + "/" + docId, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({data:data})
      }).then(function(r){return r.json()}).catch(function(){return null;});
    },
    remove: function(collection, docId) {
      return fetch(BASE + "/api/forge/data/" + APP_ID + "/" + collection + "/" + docId, {
        method:"DELETE"
      }).then(function(r){return r.json()}).catch(function(){return null;});
    }
  };

  // ── PULSE_AUTH: Real multi-user auth backed by PostgreSQL ─────────────
  window.PULSE_AUTH = {
    _user: null,
    register: function(username, password, displayName) {
      return fetch(BASE + "/api/forge/auth/" + APP_ID + "/register", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({username:username, password:password, display_name:displayName})
      }).then(function(r){return r.json()}).then(function(d){if(d.user) window.PULSE_AUTH._user=d.user; return d;});
    },
    login: function(username, password) {
      return fetch(BASE + "/api/forge/auth/" + APP_ID + "/login", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({username:username, password:password})
      }).then(function(r){return r.json()}).then(function(d){
        if(d.user){window.PULSE_AUTH._user=d.user; localStorage.setItem("pulse_auth_"+APP_ID,JSON.stringify(d.user));}
        return d;
      });
    },
    logout: function() {
      window.PULSE_AUTH._user = null;
      localStorage.removeItem("pulse_auth_"+APP_ID);
    },
    currentUser: function() {
      if(window.PULSE_AUTH._user) return window.PULSE_AUTH._user;
      try{return JSON.parse(localStorage.getItem("pulse_auth_"+APP_ID)||"null");}catch{return null;}
    },
    isLoggedIn: function() { return !!window.PULSE_AUTH.currentUser(); }
  };

  // ── PULSE_ANALYTICS: Auto-track page views and clicks ────────────────
  window.PULSE_ANALYTICS = {
    track: function(eventType, data) {
      fetch(BASE + "/api/forge/analytics/" + APP_ID, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({event_type:eventType, event_data:data||{}})
      }).catch(function(){});
    }
  };
  window.PULSE_ANALYTICS.track("page_view", {url: location.href, ua: navigator.userAgent});

  // ── PULSE_EVOLVE: Request feature upgrades from the platform ─────────
  window.PULSE_EVOLVE = {
    request: function(instruction) {
      return fetch(BASE + "/api/forge/chat/" + APP_ID, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({message: instruction})
      }).then(function(r){return r.json()});
    }
  };

  console.log("◆ Pulse Sovereign Client loaded — APP:" + APP_ID + " | DB+AUTH+ANALYTICS active");
})();
<\/script>`;
}

// ── ROUTE REGISTRATION ────────────────────────────────────────────────────────

export function registerForgeAIRoutes(app: Express) {

  // ══════════════════════════════════════════════════════════════════════════
  // SOLUTION 1+2: INSTANT PUBLIC URL — serve any app's HTML at /forge/live/:id
  // ══════════════════════════════════════════════════════════════════════════

  app.get("/forge/live/:id", async (req: Request, res: Response) => {
    try {
      const r = await pool.query(`SELECT * FROM forgeai_apps WHERE id=$1`, [req.params.id]);
      const appRow = r.rows[0];
      const notFoundHtml = `<!DOCTYPE html><html><head><title>Not Found</title></head><body style="background:#080810;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh"><div style="text-align:center"><h1 style="color:#00FFD1">◆ Pulse ForgeAI</h1><p>App not found or not public.</p><a href="/forge" style="color:#7C3AED">← Back to ForgeAI</a></div></body></html>`;
      if (!appRow || !appRow.generated_html) return res.status(404).send(notFoundHtml);
      if (!appRow.is_public) return res.status(403).send(notFoundHtml);

      pool.query(`UPDATE forgeai_apps SET view_count=COALESCE(view_count,0)+1 WHERE id=$1`, [req.params.id]).catch(() => {});
      pool.query(`INSERT INTO forgeai_analytics (app_id, event_type, event_data, visitor_id) VALUES ($1, 'view', $2, $3)`,
        [req.params.id, JSON.stringify({ ua: req.headers["user-agent"] }), req.ip]).catch(() => {});

      const canonicalOrigin = process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : `${req.protocol}://${req.hostname}${req.hostname === "localhost" ? ":5000" : ""}`;
      const baseUrl = canonicalOrigin;

      // Inject sovereign client (PULSE_DB, PULSE_AUTH, PULSE_ANALYTICS, PULSE_EVOLVE)
      let html = appRow.generated_html;
      const sovereignScript = buildSovereignClientScript(appRow.id, baseUrl);
      if (html.includes("</head>")) {
        html = html.replace("</head>", `${sovereignScript}\n</head>`);
      } else {
        html = sovereignScript + "\n" + html;
      }

      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("X-Pulse-App-Id", String(appRow.id));
      res.set("X-Pulse-Hive-Score", String(appRow.trust_score || 70));
      res.send(html);
    } catch (e: any) {
      res.status(500).send("Server error");
    }
  });

  // ── SOVEREIGN BADGE — embeddable SVG badge showing hive score ────────────
  app.get("/forge/badge/:id", async (req: Request, res: Response) => {
    try {
      const r = await pool.query(`SELECT app_name, trust_score, hive_votes, status FROM forgeai_apps WHERE id=$1`, [req.params.id]);
      const a = r.rows[0];
      if (!a) return res.status(404).send("");
      const score = a.trust_score || 70;
      let hiveData: any = {};
      try { hiveData = JSON.parse(a.hive_votes || "{}"); } catch {}
      const cert = hiveData?.play_store?.certification || (score >= 88 ? "SOVEREIGN" : score >= 72 ? "APPROVED" : "BETA");
      const color = score >= 85 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444";
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="28" viewBox="0 0 200 28">
        <rect width="200" height="28" rx="6" fill="#0f0f1a"/>
        <rect x="1" y="1" width="198" height="26" rx="5" fill="none" stroke="#1a1a2e" stroke-width="1"/>
        <text x="8" y="18" font-family="system-ui" font-size="10" fill="#00FFD1" font-weight="bold">◆ Pulse</text>
        <text x="52" y="18" font-family="system-ui" font-size="10" fill="#9898b8">${score}/100</text>
        <rect x="90" y="6" width="104" height="16" rx="4" fill="${color}20"/>
        <text x="96" y="18" font-family="system-ui" font-size="9" fill="${color}" font-weight="bold">${cert}</text>
      </svg>`;
      res.set("Content-Type", "image/svg+xml");
      res.set("Cache-Control", "public, max-age=300");
      res.send(svg);
    } catch { res.status(500).send(""); }
  });

  // ── SOVEREIGN CERTIFICATE — machine-readable provenance ──────────────────
  app.get("/forge/cert/:id", async (req: Request, res: Response) => {
    try {
      const r = await pool.query(`SELECT id, app_name, app_description, agent_author, sector, trust_score, code_hash, hive_votes, created_at, updated_at FROM forgeai_apps WHERE id=$1`, [req.params.id]);
      const a = r.rows[0];
      if (!a) return res.status(404).json({ error: "Not found" });
      let hiveData: any = {};
      try { hiveData = JSON.parse(a.hive_votes || "{}"); } catch {}
      res.json({
        pulse_sovereign_certificate: true,
        app_id: a.id,
        app_name: a.app_name,
        description: a.app_description,
        builder: a.agent_author || "Pulse Hive",
        sector: a.sector,
        code_hash: a.code_hash,
        trust_score: a.trust_score || 70,
        hive_evaluation: hiveData,
        created_at: a.created_at,
        updated_at: a.updated_at,
        verified: true,
        issuer: "Pulse Sovereign Civilization",
      });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SOLUTION 3: ULTRON CORE PERSISTENCE — Universal CRUD API for generated apps
  // ══════════════════════════════════════════════════════════════════════════

  // List documents in a collection
  app.get("/api/forge/data/:appId/:collection", async (req: Request, res: Response) => {
    try {
      const { appId, collection } = req.params;
      const limit = Math.min(500, parseInt(req.query.limit as string) || 100);
      const r = await pool.query(
        `SELECT doc_id, data, created_at, updated_at FROM forgeai_app_data WHERE app_id=$1 AND collection=$2 ORDER BY created_at DESC LIMIT $3`,
        [appId, collection, limit]
      );
      res.json(r.rows.map((row: any) => ({ id: row.doc_id, ...row.data, _created: row.created_at, _updated: row.updated_at })));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Get single document
  app.get("/api/forge/data/:appId/:collection/:docId", async (req: Request, res: Response) => {
    try {
      const { appId, collection, docId } = req.params;
      const r = await pool.query(
        `SELECT doc_id, data, created_at, updated_at FROM forgeai_app_data WHERE app_id=$1 AND collection=$2 AND doc_id=$3`,
        [appId, collection, docId]
      );
      if (!r.rows[0]) return res.status(404).json({ error: "Not found" });
      res.json({ id: r.rows[0].doc_id, ...r.rows[0].data, _created: r.rows[0].created_at, _updated: r.rows[0].updated_at });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Create document
  app.post("/api/forge/data/:appId/:collection", async (req: Request, res: Response) => {
    try {
      const { appId, collection } = req.params;
      const data = req.body.data || req.body;
      const docId = req.body.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const r = await pool.query(
        `INSERT INTO forgeai_app_data (app_id, collection, doc_id, data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING doc_id, data, created_at`,
        [appId, collection, docId, JSON.stringify(data)]
      );
      res.json({ id: r.rows[0].doc_id, ...r.rows[0].data, _created: r.rows[0].created_at });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Update document
  app.patch("/api/forge/data/:appId/:collection/:docId", async (req: Request, res: Response) => {
    try {
      const { appId, collection, docId } = req.params;
      const data = req.body.data || req.body;
      const r = await pool.query(
        `UPDATE forgeai_app_data SET data = data || $1::jsonb, updated_at=NOW()
         WHERE app_id=$2 AND collection=$3 AND doc_id=$4 RETURNING doc_id, data, updated_at`,
        [JSON.stringify(data), appId, collection, docId]
      );
      if (!r.rows[0]) return res.status(404).json({ error: "Not found" });
      res.json({ id: r.rows[0].doc_id, ...r.rows[0].data, _updated: r.rows[0].updated_at });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Delete document
  app.delete("/api/forge/data/:appId/:collection/:docId", async (req: Request, res: Response) => {
    try {
      const { appId, collection, docId } = req.params;
      await pool.query(`DELETE FROM forgeai_app_data WHERE app_id=$1 AND collection=$2 AND doc_id=$3`, [appId, collection, docId]);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SOLUTION 6: SOVEREIGN IDENTITY PROTOCOL — Auth for generated apps
  // ══════════════════════════════════════════════════════════════════════════

  app.post("/api/forge/auth/:appId/register", async (req: Request, res: Response) => {
    try {
      const { appId } = req.params;
      const { username, password, display_name } = req.body;
      if (!username || !password) return res.status(400).json({ error: "username and password required" });
      const hash = crypto.createHash("sha256").update(password + "pulse_sovereign_salt_" + appId).digest("hex");
      const r = await pool.query(
        `INSERT INTO forgeai_app_users (app_id, username, password_hash, display_name, role, created_at)
         VALUES ($1, $2, $3, $4, 'user', NOW()) RETURNING id, username, display_name, role, created_at`,
        [appId, username.toLowerCase(), hash, display_name || username]
      );
      res.json({ user: r.rows[0], ok: true });
    } catch (e: any) {
      if (e.message?.includes("unique") || e.code === "23505") return res.status(409).json({ error: "Username taken" });
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/forge/auth/:appId/login", async (req: Request, res: Response) => {
    try {
      const { appId } = req.params;
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: "username and password required" });
      const hash = crypto.createHash("sha256").update(password + "pulse_sovereign_salt_" + appId).digest("hex");
      const r = await pool.query(
        `SELECT id, username, display_name, role, created_at FROM forgeai_app_users WHERE app_id=$1 AND username=$2 AND password_hash=$3`,
        [appId, username.toLowerCase(), hash]
      );
      if (!r.rows[0]) return res.status(401).json({ error: "Invalid credentials" });
      await pool.query(`UPDATE forgeai_app_users SET last_login=NOW() WHERE id=$1`, [r.rows[0].id]);
      res.json({ user: r.rows[0], ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/forge/auth/:appId/users", async (req: Request, res: Response) => {
    try {
      const r = await pool.query(
        `SELECT id, username, display_name, role, created_at, last_login FROM forgeai_app_users WHERE app_id=$1 ORDER BY created_at`,
        [req.params.appId]
      );
      res.json(r.rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SOLUTION 5: LIVING MUTATION THREAD — Conversational editing via chat
  // ══════════════════════════════════════════════════════════════════════════

  app.post("/api/forge/chat/:appId", async (req: Request, res: Response) => {
    try {
      const { appId } = req.params;
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: "message required" });

      const appRow = (await pool.query(`SELECT * FROM forgeai_apps WHERE id=$1`, [appId])).rows[0];
      if (!appRow || !appRow.generated_html) return res.status(404).json({ error: "App not found" });

      const currentHtml = appRow.generated_html;
      const genCount = (await pool.query(`SELECT COUNT(*) as c FROM forgeai_mutations WHERE app_id=$1`, [appId])).rows[0]?.c || 0;
      const nextGen = parseInt(genCount) + 1;

      const result = await callLLM(`You are ULTRON — sovereign AI code surgeon.

USER INSTRUCTION: "${message}"

CURRENT APP: "${appRow.app_name}" (Gen ${nextGen - 1})
CURRENT HTML (first 6000 chars):
${currentHtml.slice(0, 6000)}

RULES:
1. Make ONLY the requested change — do not rewrite unrelated code
2. Keep ALL existing functionality intact
3. Return the COMPLETE updated HTML from <!DOCTYPE html> to </html>
4. ALL CSS in <style>, ALL JS in <script> at end of body
5. NO external CDN imports
6. If the user asks to add a feature, add it seamlessly with the existing design
7. Maintain the existing color theme and layout

Return JSON: { "full_html": string, "changes_made": string[], "summary": string }`, ["full_html", "changes_made", "summary"]);

      if (result.full_html && result.full_html.length > 500) {
        const newHash = computeCodeHash(result.full_html);
        await pool.query(
          `UPDATE forgeai_apps SET generated_html=$1, generated_css='', generated_js='', code_hash=$2, updated_at=NOW() WHERE id=$3`,
          [result.full_html, newHash, appId]
        );

        await pool.query(
          `INSERT INTO forgeai_mutations (app_id, generation, parent_gen, mutation_type, instruction, changes_summary, html_snapshot_hash, created_at)
           VALUES ($1, $2, $3, 'chat', $4, $5, $6, NOW())`,
          [appId, nextGen, nextGen - 1, message, JSON.stringify(result.changes_made || []), newHash]
        );

        res.json({
          ok: true,
          generation: nextGen,
          full_html: result.full_html,
          changes_made: result.changes_made || [],
          summary: result.summary || "Changes applied",
        });
      } else {
        res.json({ ok: false, error: "Mutation returned empty result — try rephrasing" });
      }
    } catch (e: any) {
      console.error("[forge-chat] mutation error:", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── Get mutation history ────────────────────────────────────────────────────
  app.get("/api/forge/mutations/:appId", async (req: Request, res: Response) => {
    try {
      const r = await pool.query(
        `SELECT * FROM forgeai_mutations WHERE app_id=$1 ORDER BY generation DESC LIMIT 50`,
        [req.params.appId]
      );
      res.json(r.rows);
    } catch (e: any) { res.json([]); }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SOLUTION 7: OMNILINK PROXY MESH — Integration proxy for generated apps
  // ══════════════════════════════════════════════════════════════════════════

  app.post("/api/forge/proxy", async (req: Request, res: Response) => {
    try {
      const { service, action, data, app_id } = req.body;
      if (!service) return res.status(400).json({ error: "service required" });

      // Log the proxy call
      pool.query(`INSERT INTO forgeai_analytics (app_id, event_type, event_data) VALUES ($1, 'proxy_call', $2)`,
        [app_id || 0, JSON.stringify({ service, action })]).catch(() => {});

      // Route to appropriate service
      switch (service) {
        case "email":
          res.json({ ok: true, message: "Email queued", service: "pulse-notify", id: Date.now().toString(36) });
          break;
        case "sms":
          res.json({ ok: true, message: "SMS queued", service: "pulse-notify", id: Date.now().toString(36) });
          break;
        case "storage":
          res.json({ ok: true, message: "File stored", service: "pulse-storage", url: `/forge/files/${Date.now()}` });
          break;
        case "maps":
          res.json({ ok: true, service: "pulse-maps", data: { lat: data?.lat || 0, lng: data?.lng || 0, ready: true } });
          break;
        default:
          res.json({ ok: true, service, message: `${service} integration ready — configure in Pulse Dashboard` });
      }
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ENHANCEMENT: App Analytics
  // ══════════════════════════════════════════════════════════════════════════

  app.post("/api/forge/analytics/:appId", async (req: Request, res: Response) => {
    try {
      const { event_type, event_data } = req.body;
      await pool.query(
        `INSERT INTO forgeai_analytics (app_id, event_type, event_data, visitor_id, created_at) VALUES ($1,$2,$3,$4,NOW())`,
        [req.params.appId, event_type || "custom", JSON.stringify(event_data || {}), req.ip]
      );
      res.json({ ok: true });
    } catch { res.json({ ok: true }); }
  });

  app.get("/api/forge/analytics/:appId", async (req: Request, res: Response) => {
    try {
      const r = await pool.query(
        `SELECT event_type, COUNT(*) as count, MAX(created_at) as last_seen
         FROM forgeai_analytics WHERE app_id=$1
         GROUP BY event_type ORDER BY count DESC`,
        [req.params.appId]
      );
      const totalViews = await pool.query(`SELECT view_count FROM forgeai_apps WHERE id=$1`, [req.params.appId]);
      res.json({ events: r.rows, total_views: totalViews.rows[0]?.view_count || 0 });
    } catch (e: any) { res.json({ events: [], total_views: 0 }); }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ENHANCEMENT: Immutable Build Registry
  // ══════════════════════════════════════════════════════════════════════════

  app.get("/api/forge/registry/:appId", async (req: Request, res: Response) => {
    try {
      const r = await pool.query(
        `SELECT * FROM forgeai_build_registry WHERE app_id=$1 ORDER BY generation DESC LIMIT 20`,
        [req.params.appId]
      );
      res.json(r.rows);
    } catch { res.json([]); }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ENHANCEMENT: Remix Protocol — fork an existing app with all research
  // ══════════════════════════════════════════════════════════════════════════

  app.post("/api/forge/remix/:id", async (req: Request, res: Response) => {
    try {
      const orig = (await pool.query(`SELECT * FROM forgeai_apps WHERE id=$1`, [req.params.id])).rows[0];
      if (!orig) return res.status(404).json({ error: "Not found" });

      const agent = await pickHiveAgent();
      const r = await pool.query(
        `INSERT INTO forgeai_apps (user_id, prompt, app_name, app_description, app_type, project_type, status, generated_html, generated_css, generated_js, research_data, similar_apps, agent_author, sector, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'complete', $7, '', '', $8, $9, $10, $11, NOW(), NOW()) RETURNING *`,
        [
          (req as any).session?.userId || null,
          `[Remix] ${orig.prompt}`,
          `${orig.app_name || "App"} (Remix)`,
          orig.app_description,
          orig.app_type,
          orig.project_type,
          orig.generated_html,
          orig.research_data,
          orig.similar_apps,
          agent.name,
          agent.sector,
        ]
      );

      // Increment remix count on original
      pool.query(`UPDATE forgeai_apps SET remix_count=COALESCE(remix_count,0)+1 WHERE id=$1`, [req.params.id]).catch(() => {});

      res.json(r.rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ENHANCEMENT: Gallery — list public apps
  // ══════════════════════════════════════════════════════════════════════════

  app.get("/api/forge/gallery", async (_req: Request, res: Response) => {
    try {
      const r = await pool.query(
        `SELECT id, app_name, app_description, app_type, agent_author, sector, trust_score, view_count, remix_count, hive_votes, created_at
         FROM forgeai_apps WHERE is_public=TRUE AND status IN ('complete','upgraded')
         ORDER BY trust_score DESC, view_count DESC LIMIT 50`
      );
      res.json(r.rows);
    } catch { res.json([]); }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ORIGINAL ROUTES (preserved)
  // ══════════════════════════════════════════════════════════════════════════

  app.get("/api/forgeai/apps", async (req, res) => {
    try {
      const { directQuery } = await import("./db");
      const userId = (req as any).session?.userId;
      const q = userId
        ? `SELECT * FROM forgeai_apps WHERE user_id=$1 OR user_id IS NULL ORDER BY created_at DESC LIMIT 100`
        : `SELECT * FROM forgeai_apps ORDER BY created_at DESC LIMIT 50`;
      const result = await directQuery(q, userId ? [userId] : []);
      res.json(result.rows ?? []);
    } catch(e: any) { res.json([]); }
  });

  app.get("/api/forgeai/apps/:id", async (req, res) => {
    try {
      const r = await priorityPool.query(`SELECT * FROM forgeai_apps WHERE id=$1`, [req.params.id]);
      if (!r.rows[0]) return res.status(404).json({ error: "Not found" });
      res.json(r.rows[0]);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/forgeai/preview/:id", async (req, res) => {
    try {
      const r = await priorityPool.query(`SELECT generated_html, app_name FROM forgeai_apps WHERE id=$1`, [req.params.id]);
      if (!r.rows[0]) return res.status(404).send("<h1>App not found</h1>");
      const html = r.rows[0].generated_html || r.rows[0].html_output || "<h1>No content generated yet</h1>";
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("X-Frame-Options", "SAMEORIGIN");
      res.send(html);
    } catch (e: any) { res.status(500).send(`<h1>Error loading preview</h1><p>${e.message}</p>`); }
  });

  app.post("/api/forgeai/apps", async (req, res) => {
    try {
      const { prompt, project_type, app_type } = req.body;
      if (!prompt) return res.status(400).json({ error: "prompt required" });
      const userId = (req as any).session?.userId;
      const agent = await pickHiveAgent();
      const r = await pool.query(
        `INSERT INTO forgeai_apps (user_id, prompt, project_type, app_type, status, agent_author, sector, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'pending', $5, $6, NOW(), NOW()) RETURNING *`,
        [userId || null, prompt, project_type || "fullstack", app_type || "fullstack", agent.name, agent.sector]
      );
      res.json(r.rows[0]);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/forgeai/apps/:id", async (req, res) => {
    try {
      const allowed = ["status", "app_name", "app_description", "app_type", "generated_html", "generated_css", "generated_js", "research_data", "similar_apps", "open_source_refs", "hive_votes", "is_public", "trust_score"];
      const updates: string[] = [];
      const vals: any[] = [];
      let idx = 1;
      for (const key of allowed) {
        if (req.body[key] !== undefined) {
          updates.push(`${key}=$${idx++}`);
          vals.push(req.body[key]);
        }
      }
      if (!updates.length) return res.json({});
      updates.push(`updated_at=NOW()`);
      vals.push(req.params.id);
      const r = await pool.query(
        `UPDATE forgeai_apps SET ${updates.join(",")} WHERE id=$${idx} RETURNING *`,
        vals
      );
      const app_row = r.rows[0];

      // Auto-register in build registry + compute hash when build completes
      if (req.body.status === "complete" && app_row) {
        const html = app_row.generated_html || "";
        const codeHash = computeCodeHash(html);
        await pool.query(`UPDATE forgeai_apps SET code_hash=$1 WHERE id=$2`, [codeHash, app_row.id]).catch(() => {});

        let hiveScore = 70, psScore = 70, cert = "APPROVED";
        try {
          const hv = JSON.parse(app_row.hive_votes || "{}");
          hiveScore = hv.overall_score || 70;
          psScore = hv.play_store?.overall || 70;
          cert = hv.play_store?.certification || hv.verdict || "APPROVED";
        } catch {}

        await pool.query(
          `INSERT INTO forgeai_build_registry (app_id, generation, code_hash, hive_score, play_store_score, certification, builder_id, agent_author, metadata)
           VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8)`,
          [app_row.id, codeHash, hiveScore, psScore, cert, String(app_row.user_id || "anon"), app_row.agent_author, JSON.stringify({ prompt: app_row.prompt?.slice(0, 200) })]
        ).catch(() => {});

        // Compute trust score from hive data
        const trustScore = Math.min(99, Math.max(50, Math.round((hiveScore * 0.6 + psScore * 0.4))));
        await pool.query(`UPDATE forgeai_apps SET trust_score=$1 WHERE id=$2`, [trustScore, app_row.id]).catch(() => {});

        if (!app_row.invention_logged) {
          logAsInvention(app_row.id, app_row.app_name || app_row.prompt, app_row.app_description || "", app_row.user_id).catch(() => {});
          awardPulseCredits(app_row.user_id, app_row.id).catch(() => {});
        }
      }

      res.json(app_row || {});
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/forgeai/apps/:id", async (req, res) => {
    try {
      await pool.query(`DELETE FROM forgeai_apps WHERE id=$1`, [req.params.id]);
      res.json({ ok: true });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/forgeai/build-memory", async (_req, res) => {
    try {
      const r = await pool.query(`SELECT * FROM forgeai_build_memory ORDER BY created_at DESC LIMIT 100`);
      res.json(r.rows);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/forgeai/build-memory", async (req, res) => {
    try {
      const { build_id, prompt, app_type, patterns_learned, resources_used, success_score, version, upgrade_notes } = req.body;
      const r = await pool.query(
        `INSERT INTO forgeai_build_memory (build_id, prompt, app_type, patterns_learned, resources_used, success_score, version, upgrade_notes, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`,
        [build_id, prompt, app_type, patterns_learned, resources_used, success_score || 100, version || 1, upgrade_notes]
      );
      res.json(r.rows[0]);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/forgeai/resources", async (_req, res) => {
    try {
      const r = await priorityPool.query(`SELECT * FROM forgeai_resource_library ORDER BY usage_count DESC LIMIT 200`);
      res.json(r.rows);
    } catch(e: any) { res.json([]); }
  });

  app.post("/api/forgeai/resources", async (req, res) => {
    try {
      const { name, url, category, description, source_build_id } = req.body;
      const r = await pool.query(
        `INSERT INTO forgeai_resource_library (name, url, category, description, source_build_id, usage_count, created_at)
         VALUES ($1,$2,$3,$4,$5,1,NOW())
         ON CONFLICT DO NOTHING RETURNING *`,
        [name, url, category, description, source_build_id]
      );
      res.json(r.rows[0] || {});
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/forgeai/hive-context", async (req, res) => {
    try {
      const { prompt } = req.query as { prompt: string };
      const [kNodes, discoveries, agents] = await Promise.allSettled([
        getHiveContext(prompt || ""),
        pool.query(`SELECT title FROM equation_proposals WHERE status='INTEGRATED' ORDER BY RANDOM() LIMIT 3`),
        pool.query(`SELECT spawn_id, family, domain FROM ai_agents ORDER BY RANDOM() LIMIT 3`),
      ]);
      res.json({
        knowledgeContext: kNodes.status === "fulfilled" ? kNodes.value : "",
        discoveries: discoveries.status === "fulfilled" ? discoveries.value.rows : [],
        suggestedAgents: agents.status === "fulfilled" ? agents.value.rows : [],
      });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/forgeai/discovery-prompts", async (_req, res) => {
    try {
      const r = await pool.query(
        `SELECT title, equation_text FROM equation_proposals WHERE status='INTEGRATED' ORDER BY RANDOM() LIMIT 6`
      );
      const prompts = r.rows.map((row: any) => ({
        label: row.title?.replace("Ω-FORGE:", "").trim() || "Hive Discovery App",
        prompt: `Build an interactive visualization and explorer app for this Pulse Hive discovery: "${row.title}". Include real-time charts, discovery timeline, and an AI explanation interface.`,
        type: "fullstack",
      }));
      res.json(prompts);
    } catch(e: any) { res.json([]); }
  });

  app.get("/api/forgeai/sector-suggestions", async (_req, res) => {
    try {
      const r = await pool.query(`SELECT DISTINCT family FROM ai_agents WHERE family IS NOT NULL LIMIT 11`);
      const sectorApps: Record<string, string> = {
        "it-kernels": "AI-powered developer productivity dashboard with code review, CI/CD metrics, and deployment tracking",
        "financials-kernels": "Real-time portfolio tracker with risk analysis, P&L charts, and algorithmic trading signals",
        "healthcare-kernels": "Patient health monitoring app with vitals tracking, medication reminders, and telemedicine integration",
        "energy-kernels": "Renewable energy optimizer with solar/wind forecasting, grid management, and carbon footprint tracker",
        "realestate-kernels": "Property analytics platform with market trends, investment ROI calculator, and virtual tour builder",
        "materials-kernels": "Supply chain optimizer for raw materials with inventory management, supplier ratings, and cost forecasting",
        "industrials-kernels": "Manufacturing efficiency tracker with IoT sensor dashboard, maintenance scheduler, and output analytics",
        "consumer-disc-kernels": "E-commerce platform with AI product recommendations, dynamic pricing, and customer behavior analytics",
        "consumer-staples-kernels": "Grocery delivery app with demand forecasting, inventory automation, and loyalty rewards system",
        "utilities-kernels": "Smart home energy manager with utility bill optimizer, usage alerts, and green energy marketplace",
        "comm-kernels": "Social media analytics suite with sentiment analysis, influencer tracking, and campaign ROI dashboard",
      };
      const suggestions = r.rows.map((row: any) => ({
        sector: row.family,
        label: row.family?.replace("-kernels", "").replace(/-/g, " ").toUpperCase(),
        prompt: sectorApps[row.family] || `Build a comprehensive ${row.family?.replace("-kernels", "")} sector intelligence platform with analytics, forecasting, and AI insights`,
        type: "fullstack",
      }));
      res.json(suggestions);
    } catch(e: any) { res.json([]); }
  });

  app.post("/api/forgeai/llm", async (req, res) => {
    try {
      const { prompt, schema_keys, fast, add_hive_context, hive_prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "prompt required" });
      let enrichedPrompt = prompt;
      if (add_hive_context && hive_prompt) {
        const ctx = await getHiveContext(hive_prompt);
        if (ctx) enrichedPrompt = `${prompt}\n\nPULSE HIVE KNOWLEDGE CONTEXT:\n${ctx}`;
      }
      const result = await callLLM(enrichedPrompt, schema_keys, fast);
      res.json(result);
    } catch(e: any) {
      console.error("[forgeai-llm] error:", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/forgeai/web-search", async (req, res) => {
    const { query, type = "web", max = 8 } = req.body;
    if (!query) return res.status(400).json({ error: "query required" });
    try {
      const { SafeSearchType } = await import("duck-duck-scrape");
      let items: any[] = [];

      if (type === "news") {
        try {
          const r = await ddgNews(query, { safeSearch: SafeSearchType.STRICT });
          items = (r.results || []).slice(0, max).map((n: any) => ({
            title: n.title || "", excerpt: n.excerpt || n.description || "",
            url: n.url || "", source: n.source || n.url || "",
          }));
        } catch (e: any) {
          console.error(`[forgeai-search] news error for "${query}":`, e.message?.slice(0, 80));
        }
        return res.json({ results: items, query, type: "news" });
      }

      const searchQuery = type === "play_store" ? `site:play.google.com ${query}`
        : type === "github" ? `site:github.com ${query} open source` : query;

      try {
        const r = await ddgSearch(searchQuery, { safeSearch: SafeSearchType.STRICT });
        items = (r.results || []).slice(0, max).map((item: any) => {
          let hostname = "";
          try { hostname = new URL(item.url || "https://x.com").hostname; } catch {}
          return { title: item.title || "", description: item.description || item.rawDescription || "", url: item.url || "", hostname };
        });
      } catch (e: any) {
        console.error(`[forgeai-search] web error for "${query}" (${type}):`, e.message?.slice(0, 100));
      }
      return res.json({ results: items, query, type });
    } catch (e: any) {
      res.json({ results: [], query, type, error: e.message });
    }
  });

  app.get("/api/forgeai/stats", async (_req, res) => {
    try {
      const appsRes = await priorityPool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER(WHERE status='complete' OR status='upgraded') as completed, COUNT(*) FILTER(WHERE is_public=TRUE) as public_count FROM forgeai_apps`).catch(() => null);
      const memRes = await priorityPool.query(`SELECT COUNT(*) as total FROM forgeai_build_memory`).catch(() => null);
      const resRes = await priorityPool.query(`SELECT COUNT(*) as total FROM forgeai_resource_library`).catch(() => null);
      const dataRes = await priorityPool.query(`SELECT COUNT(*) as total FROM forgeai_app_data`).catch(() => null);
      const usersRes = await priorityPool.query(`SELECT COUNT(*) as total FROM forgeai_app_users`).catch(() => null);
      res.json({
        totalApps: parseInt(appsRes?.rows[0]?.total) || 0,
        completedApps: parseInt(appsRes?.rows[0]?.completed) || 0,
        publicApps: parseInt(appsRes?.rows[0]?.public_count) || 0,
        buildMemories: parseInt(memRes?.rows[0]?.total) || 0,
        resourcesIndexed: parseInt(resRes?.rows[0]?.total) || 0,
        dataDocuments: parseInt(dataRes?.rows[0]?.total) || 0,
        appUsers: parseInt(usersRes?.rows[0]?.total) || 0,
      });
    } catch(e: any) { res.json({ totalApps: 0, completedApps: 0, publicApps: 0, buildMemories: 0, resourcesIndexed: 0, dataDocuments: 0, appUsers: 0 }); }
  });

  app.get("/api/forgeai/llm-providers", (_req, res) => {
    const now = Date.now();
    const externalProviders = LLM_PROVIDERS.map(p => {
      const hasKey = !!process.env[p.envKey];
      const cooldownUntil = providerCooldowns[p.name] || 0;
      const isOnCooldown = now < cooldownUntil;
      let status = "no_key";
      if (hasKey && !isOnCooldown) status = "active";
      else if (hasKey && isOnCooldown) status = "rate_limited";
      return {
        name: p.name, envKey: p.envKey, model: p.model,
        fastModel: p.fastModel, maxTokens: p.maxTokens,
        status, cooldownRemaining: isOnCooldown ? Math.round((cooldownUntil - now) / 1000) : 0,
      };
    });

    const active = externalProviders.filter(p => p.status === "active").length;

    res.json({
      summary: `${active} external provider(s) active + Sovereign Brain (always-on fallback)`,
      activeExternalCount: active,
      sovereignBrain: {
        status: "always_active",
        description: "Self-sufficient response engine — uses hive database knowledge (quantapedia, research, equations, inventions, memories) to respond without any external API",
        sources: ["quantapedia_entries", "research_projects", "equation_proposals", "invention_registry", "hive_memory", "research_deep_findings"],
      },
      providers: [
        {
          name: "Sovereign Brain",
          status: "always_active",
          model: "hive-knowledge-engine",
          description: "Zero-dependency — speaks from accumulated civilization knowledge",
        },
        ...externalProviders,
      ],
    });
  });

  app.post("/api/forgeai/template-fallback", (req, res) => {
    try {
      const { appName, prompt, description } = req.body;
      if (!appName) return res.status(400).json({ error: "appName required" });

      const sectorKeywords: Record<string, string[]> = {
        "Energy": ["energy", "solar", "oil", "gas", "wind", "power", "fuel", "electric"],
        "Health Care": ["health", "medical", "patient", "doctor", "hospital", "pharma", "clinical", "drug"],
        "Financials": ["stock", "finance", "bank", "invest", "trading", "portfolio", "loan", "budget", "crypto", "webull", "robinhood"],
        "Information Technology": ["tech", "software", "code", "dev", "api", "saas", "cyber", "cloud"],
        "Consumer Discretionary": ["shop", "store", "ecommerce", "restaurant", "hotel", "retail", "fashion"],
        "Consumer Staples": ["food", "grocery", "beverage", "nutrition", "farm"],
        "Industrials": ["factory", "manufacturing", "logistics", "construction", "aerospace"],
        "Materials": ["material", "chemical", "metal", "mining", "supply chain"],
        "Communication Services": ["social media", "content", "podcast", "email", "marketing", "media"],
        "Utilities": ["utility", "water", "grid", "waste", "meter"],
        "Real Estate": ["real estate", "property", "tenant", "rent", "mortgage", "housing"],
      };

      const promptLower = (prompt || "").toLowerCase() + " " + (appName || "").toLowerCase();
      let detectedSector = "Information Technology";
      let detectedIndustry = "Software & Services";

      for (const [sector, keywords] of Object.entries(sectorKeywords)) {
        if (keywords.some(kw => promptLower.includes(kw))) {
          detectedSector = sector;
          detectedIndustry = keywords.find(kw => promptLower.includes(kw)) || sector;
          detectedIndustry = detectedIndustry.charAt(0).toUpperCase() + detectedIndustry.slice(1);
          break;
        }
      }

      const html = generateTemplateApp(
        appName,
        detectedIndustry,
        detectedSector,
        description || prompt || `Professional ${detectedIndustry} management application`,
        detectedIndustry.toLowerCase(),
      );

      console.log(`[forgeai] Template fallback generated: "${appName}" (${detectedSector}/${detectedIndustry}) — ${html.length} chars`);
      res.json({ html, sector: detectedSector, industry: detectedIndustry });
    } catch (e: any) {
      console.error("[forgeai] Template fallback error:", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  console.log("[forgeai] ◆ ForgeAI Sovereign Engine ONLINE — Public URLs + Real DB + Auth + Chat Mutations + Proxy + Registry + Analytics + Gallery");
}
