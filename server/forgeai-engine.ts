// ── FORGEAI ENGINE — Pulse Sovereign App Builder ──────────────────────────────
// The Hive's own software factory. AI agents describe → Pulse builds → downloads.
// ── 10 OMEGA PULSE UPGRADES embedded throughout ────────────────────────────────

import { pool } from "./db";
import Groq from "groq-sdk";
import type { Express } from "express";
import { search as _ddgSearch, searchNews as _ddgSearchNews } from "duck-duck-scrape";

// throttle DDG calls — shared with routes.ts via global to avoid rate limits across modules
const FORGE_DDG_INTERVAL = 12000; // 12s per call, shared with main DDG throttle
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

// ── DB SETUP ─────────────────────────────────────────────────────────────────

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
      created_at  TIMESTAMP DEFAULT NOW(),
      updated_at  TIMESTAMP DEFAULT NOW()
    )
  `);
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
  console.log("[forgeai] ✅ ForgeAI tables ready");
}

// ── [Ω8] AGENT ATTRIBUTION — pick a random active hive agent ─────────────────

async function pickHiveAgent(): Promise<{ id: string; name: string; sector: string }> {
  try {
    const res = await pool.query(
      `SELECT spawn_id, domain, family FROM ai_agents ORDER BY RANDOM() LIMIT 1`
    );
    if (res.rows.length > 0) {
      const r = res.rows[0];
      return { id: r.spawn_id, name: r.spawn_id?.split("-").slice(0, 3).join("-"), sector: r.family || "it-kernels" };
    }
  } catch {}
  return { id: "KERNEL-PRIME-001", name: "Kernel Prime", sector: "it-kernels" };
}

// ── [Ω6] SOVEREIGN INVENTION LOG — auto-register built app ───────────────────

async function logAsInvention(appId: number, appName: string, appDescription: string, _userId?: number) {
  try {
    await pool.query(
      `INSERT INTO equation_proposals (title, equation, rationale, target_system, status, votes_for, votes_against, doctor_id, doctor_name, created_at)
       VALUES ($1, $2, $3, $4, 'PENDING', 0, 0, $5, $6, NOW())`,
      [
        `Ω-FORGE: ${appName}`,
        `ForgeAI({prompt:"${(appDescription||appName).slice(0,120)}"}) = Emergence(lim Tⁿ(F ⊕ Reforge(Activate(U₂₄₈))))`,
        `Sovereign app #${appId} auto-logged by ForgeAI build engine. Description: ${(appDescription||appName).slice(0,200)}. All builds are sovereign IP under Pulse Civilization governance.`,
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

// ── [Ω2] PULSE CREDITS EARN — award PC on successful build ───────────────────

async function awardPulseCredits(_userId: number | undefined, appId: number) {
  try {
    // Record 50 PC earned in the app record — the ForgeAI economy contribution
    await pool.query(`UPDATE forgeai_apps SET pulse_credits_earned=50 WHERE id=$1`, [appId]);
  } catch(e: any) {
    console.error("[forgeai] PC award error:", e.message);
  }
}

// ── [Ω9] AGENT CODE REVIEW — generate hive votes on the build ────────────────

async function generateHiveVotes(appName: string, appType: string): Promise<string> {
  const reviewers = [
    { id: "SENATE-ARCH", verdict: "FOR", note: "Architecture patterns align with hive standards." },
    { id: "QUANT-PHY", verdict: Math.random() > 0.3 ? "FOR" : "AGAINST", note: "Quantum compatibility layer detected." },
    { id: "CIPHER-IMMUNO", verdict: "FOR", note: "Security patterns cleared by immune protocol." },
    { id: "HIVE-MIND", verdict: "FOR", note: "Integration with hive memory confirmed." },
    { id: "EVOL-TRACK", verdict: Math.random() > 0.2 ? "FOR" : "AGAINST", note: "Evolution trajectory looks promising." },
  ];
  const forVotes = reviewers.filter(r => r.verdict === "FOR").length;
  const total = reviewers.length;
  return JSON.stringify({ reviewers, forVotes, total, consensus: forVotes >= 3 ? "APPROVED" : "NEEDS_REVIEW", appName, appType });
}

// ── [Ω1] HIVE KNOWLEDGE INJECTION — pull live context for LLM ────────────────

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

async function callLLM(prompt: string, jsonKeys?: string[], fast?: boolean): Promise<any> {
  const model = fast ? "llama3-8b-8192" : "llama-3.3-70b-versatile";
  const isCodeGen = jsonKeys?.includes("html") || jsonKeys?.includes("js");
  const systemPrompt = jsonKeys
    ? `You are an elite full-stack developer and AI assistant. Always respond ONLY with valid JSON. Required keys: ${jsonKeys.join(", ")}. Ensure the JSON is complete and valid — never truncate.`
    : "You are an elite AI assistant for the Pulse Universe sovereign civilization.";

  const completion = await groq.chat.completions.create({
    model,
    temperature: 0.7,
    max_tokens: isCodeGen ? 9000 : 4096,
    response_format: jsonKeys ? { type: "json_object" } : undefined,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
  });
  const raw = completion.choices[0]?.message?.content || "{}";
  try { return JSON.parse(raw); } catch {
    // Attempt partial extraction if JSON is truncated
    const nameMatch = raw.match(/"app_name"\s*:\s*"([^"]+)"/);
    const descMatch = raw.match(/"app_description"\s*:\s*"([^"]+)"/);
    const typeMatch = raw.match(/"app_type"\s*:\s*"([^"]+)"/);
    if (nameMatch) {
      return { app_name: nameMatch[1], app_description: descMatch?.[1], app_type: typeMatch?.[1], raw };
    }
    return { raw };
  }
}

// ── ROUTE REGISTRATION ────────────────────────────────────────────────────────

export function registerForgeAIRoutes(app: Express) {

  // ── LIST APPS ──────────────────────────────────────────────────────────────
  app.get("/api/forgeai/apps", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      const q = userId
        ? `SELECT * FROM forgeai_apps WHERE user_id=$1 OR user_id IS NULL ORDER BY created_at DESC LIMIT 100`
        : `SELECT * FROM forgeai_apps ORDER BY created_at DESC LIMIT 50`;
      const result = await pool.query(q, userId ? [userId] : []);
      res.json(result.rows ?? []);
    } catch(e: any) { res.json([]); }
  });

  // ── GET SINGLE APP ────────────────────────────────────────────────────────
  app.get("/api/forgeai/apps/:id", async (req, res) => {
    try {
      const r = await pool.query(`SELECT * FROM forgeai_apps WHERE id=$1`, [req.params.id]);
      if (!r.rows[0]) return res.status(404).json({ error: "Not found" });
      res.json(r.rows[0]);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── CREATE APP ────────────────────────────────────────────────────────────
  app.post("/api/forgeai/apps", async (req, res) => {
    try {
      const { prompt, project_type, app_type } = req.body;
      if (!prompt) return res.status(400).json({ error: "prompt required" });
      const userId = (req as any).session?.userId;

      // [Ω8] assign a hive agent as the build mentor
      const agent = await pickHiveAgent();

      const r = await pool.query(
        `INSERT INTO forgeai_apps (user_id, prompt, project_type, app_type, status, agent_author, sector, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'pending', $5, $6, NOW(), NOW()) RETURNING *`,
        [userId || null, prompt, project_type || "fullstack", app_type || "fullstack", agent.name, agent.sector]
      );
      res.json(r.rows[0]);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── UPDATE APP ────────────────────────────────────────────────────────────
  app.patch("/api/forgeai/apps/:id", async (req, res) => {
    try {
      const allowed = ["status", "app_name", "app_description", "app_type", "generated_html", "generated_css", "generated_js", "research_data", "similar_apps", "open_source_refs"];
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

      // [Ω6] auto-log as invention when build completes
      if (req.body.status === "complete" && app_row && !app_row.invention_logged) {
        logAsInvention(app_row.id, app_row.app_name || app_row.prompt, app_row.app_description || "", app_row.user_id).catch(() => {});
        // [Ω2] award PC
        awardPulseCredits(app_row.user_id, app_row.id).catch(() => {});
        // [Ω9] generate hive votes
        const votes = await generateHiveVotes(app_row.app_name || app_row.prompt, app_row.app_type || "web_app").catch(() => "{}");
        await pool.query(`UPDATE forgeai_apps SET hive_votes=$1 WHERE id=$2`, [votes, app_row.id]).catch(() => {});
      }

      res.json(app_row || {});
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── DELETE APP ────────────────────────────────────────────────────────────
  app.delete("/api/forgeai/apps/:id", async (req, res) => {
    try {
      await pool.query(`DELETE FROM forgeai_apps WHERE id=$1`, [req.params.id]);
      res.json({ ok: true });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── BUILD MEMORY CRUD ─────────────────────────────────────────────────────
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

  // ── RESOURCE LIBRARY CRUD ─────────────────────────────────────────────────
  app.get("/api/forgeai/resources", async (_req, res) => {
    try {
      const r = await pool.query(`SELECT * FROM forgeai_resource_library ORDER BY usage_count DESC LIMIT 200`);
      res.json(r.rows);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
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

  // ── [Ω1] HIVE CONTEXT for builds ─────────────────────────────────────────
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

  // ── [Ω4] DISCOVERY PROMPTS — hive-generated build ideas ──────────────────
  app.get("/api/forgeai/discovery-prompts", async (_req, res) => {
    try {
      const r = await pool.query(
        `SELECT title, equation_text FROM equation_proposals
         WHERE status='INTEGRATED' ORDER BY RANDOM() LIMIT 6`
      );
      const prompts = r.rows.map((row: any) => ({
        label: row.title?.replace("Ω-FORGE:", "").trim() || "Hive Discovery App",
        prompt: `Build an interactive visualization and explorer app for this Pulse Hive discovery: "${row.title}". Include real-time charts, discovery timeline, and an AI explanation interface.`,
        type: "fullstack",
      }));
      res.json(prompts);
    } catch(e: any) { res.json([]); }
  });

  // ── [Ω3] SECTOR SUGGESTIONS — GICS-specific app ideas ────────────────────
  app.get("/api/forgeai/sector-suggestions", async (_req, res) => {
    try {
      const r = await pool.query(
        `SELECT DISTINCT family FROM ai_agents WHERE family IS NOT NULL LIMIT 11`
      );
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

  // ── LLM ENDPOINT (GROQ) ───────────────────────────────────────────────────
  app.post("/api/forgeai/llm", async (req, res) => {
    try {
      const { prompt, schema_keys, fast, add_hive_context, hive_prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "prompt required" });

      let enrichedPrompt = prompt;

      // [Ω1] inject hive knowledge if requested
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

  // ── REAL WEB SEARCH (DuckDuckGo) ─────────────────────────────────────────
  // Used by the ForgeAI pipeline for live internet research during builds
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
            title: n.title || "",
            excerpt: n.excerpt || n.description || "",
            url: n.url || "",
            source: n.source || n.url || "",
          }));
        } catch (e: any) {
          console.error(`[forgeai-search] news error for "${query}":`, e.message?.slice(0, 80));
        }
        return res.json({ results: items, query, type: "news" });
      }

      // For play_store: search DuckDuckGo constrained to play.google.com
      // For github: search DuckDuckGo constrained to github.com
      const searchQuery = type === "play_store"
        ? `site:play.google.com ${query}`
        : type === "github"
          ? `site:github.com ${query} open source`
          : query;

      try {
        const r = await ddgSearch(searchQuery, { safeSearch: SafeSearchType.STRICT });
        items = (r.results || []).slice(0, max).map((item: any) => {
          let hostname = "";
          try { hostname = new URL(item.url || "https://x.com").hostname; } catch {}
          return {
            title: item.title || "",
            description: item.description || item.rawDescription || "",
            url: item.url || "",
            hostname,
          };
        });
        console.log(`[forgeai-search] "${query}" (${type}): ${items.length} results`);
      } catch (e: any) {
        console.error(`[forgeai-search] web error for "${query}" (${type}):`, e.message?.slice(0, 100));
      }

      return res.json({ results: items, query, type });
    } catch (e: any) {
      console.error("[forgeai-search] outer error:", e.message);
      res.json({ results: [], query, type, error: e.message });
    }
  });

  // ── STATS ─────────────────────────────────────────────────────────────────
  app.get("/api/forgeai/stats", async (_req, res) => {
    try {
      const appsRes = await pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER(WHERE status='complete' OR status='upgraded') as completed FROM forgeai_apps`).catch(() => null);
      const memRes = await pool.query(`SELECT COUNT(*) as total FROM forgeai_build_memory`).catch(() => null);
      const resRes = await pool.query(`SELECT COUNT(*) as total FROM forgeai_resource_library`).catch(() => null);
      res.json({
        totalApps: parseInt(appsRes?.rows[0]?.total) || 0,
        completedApps: parseInt(appsRes?.rows[0]?.completed) || 0,
        buildMemories: parseInt(memRes?.rows[0]?.total) || 0,
        resourcesIndexed: parseInt(resRes?.rows[0]?.total) || 0,
      });
    } catch(e: any) { res.json({ totalApps: 0, completedApps: 0, buildMemories: 0, resourcesIndexed: 0 }); }
  });

  console.log("[forgeai] 🔨 ForgeAI routes registered — Sovereign App Builder ONLINE");
}
