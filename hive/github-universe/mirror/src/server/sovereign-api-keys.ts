import type { Express, Request, Response, NextFunction } from "express";
import { sql } from "drizzle-orm";
import { db } from "./db";

interface SovereignKeyRow {
  id: number;
  api_key: string;
  owner: string;
  label: string;
  tier: string;
  scopes: string;
  is_active: boolean;
  calls_used: number;
  calls_limit: number;
  created_at: string;
  last_used_at: string | null;
}

async function findKeyByApiKey(apiKey: string): Promise<SovereignKeyRow | null> {
  const r = await db.execute(sql`SELECT * FROM api_keys WHERE api_key = ${apiKey} AND is_active = true LIMIT 1`);
  return (r.rows[0] as SovereignKeyRow | undefined) ?? null;
}

function extractKey(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  const headerKey = req.headers["x-api-key"];
  if (typeof headerKey === "string") return headerKey.trim();
  if (typeof req.query.api_key === "string") return req.query.api_key.trim();
  return null;
}

function hasScope(row: SovereignKeyRow, required: string): boolean {
  if (!required) return true;
  const scopes = (row.scopes || "").split(",").map((s) => s.trim()).filter(Boolean);
  return scopes.includes(required) || scopes.includes("hive:*");
}

export function requireSovereignKey(requiredScope: string = "hive:read") {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = extractKey(req);
    if (!key) return res.status(401).json({ error: "Missing API key. Send Authorization: Bearer <key> or X-API-Key header." });
    try {
      const row = await findKeyByApiKey(key);
      if (!row) return res.status(401).json({ error: "Invalid or revoked API key." });
      if (!hasScope(row, requiredScope)) return res.status(403).json({ error: `Key lacks required scope: ${requiredScope}` });
      await db.execute(sql`UPDATE api_keys SET last_used_at = NOW(), calls_used = calls_used + 1 WHERE id = ${row.id}`);
      (req as any).sovereignKey = row;
      next();
    } catch (e: any) {
      res.status(500).json({ error: "Auth check failed: " + e.message });
    }
  };
}

export function mountSovereignRoutes(app: Express) {
  // ── Admin endpoints (no key required — shown only on internal SovereignKeysPage) ──
  app.get("/api/admin/sovereign-keys", async (_req, res) => {
    try {
      const r = await db.execute(sql`
        SELECT id, api_key, owner, label, tier, scopes, is_active, calls_used, calls_limit, created_at, last_used_at
        FROM api_keys
        WHERE owner IN ('pulse', 'auriona')
        ORDER BY owner ASC
      `);
      res.json({ keys: r.rows });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/sovereign-keys/regenerate", async (req, res) => {
    try {
      const owner = String(req.body?.owner || "").toLowerCase();
      if (owner !== "pulse" && owner !== "auriona") {
        return res.status(400).json({ error: "owner must be 'pulse' or 'auriona'" });
      }
      const prefix = owner === "pulse" ? "pulse_live_" : "auriona_live_";
      await db.execute(sql`
        UPDATE api_keys
        SET api_key = ${prefix} || encode(gen_random_bytes(24), 'hex'),
            calls_used = 0,
            last_used_at = NULL,
            created_at = NOW()
        WHERE owner = ${owner}
      `);
      const r = await db.execute(sql`SELECT * FROM api_keys WHERE owner = ${owner} LIMIT 1`);
      res.json({ ok: true, key: r.rows[0] });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Public hive endpoints (require sovereign API key) ──

  // What capabilities does this key + the hive expose?
  app.get("/api/v1/hive/capabilities", requireSovereignKey("hive:capabilities"), async (req, res) => {
    const row = (req as any).sovereignKey as SovereignKeyRow;
    res.json({
      hive: "Pulse Universe (myaigpt.online)",
      key_owner: row.owner,
      key_label: row.label,
      scopes: row.scopes.split(",").map((s) => s.trim()).filter(Boolean),
      endpoints: [
        { path: "/api/v1/hive/status",       scope: "hive:status",       desc: "Live pulse, anomalies, evolution stats" },
        { path: "/api/v1/hive/knowledge?q=", scope: "hive:knowledge",    desc: "Search quantapedia + hive memory by query string" },
        { path: "/api/v1/hive/invocations",  scope: "hive:invocations",  desc: "Active equations, omega-collective, hidden variables" },
        { path: "/api/v1/hive/temporal",     scope: "hive:temporal",     desc: "Temporal observatory state + dτ finale equation" },
        { path: "/api/v1/hive/auriona",      scope: "hive:auriona",      desc: "Auriona Layer Three synthesis (auriona key only)" },
      ],
    });
  });

  app.get("/api/v1/hive/status", requireSovereignKey("hive:status"), async (_req, res) => {
    try {
      const [spawns, anomalies, inventions, equations, agents] = await Promise.all([
        db.execute(sql`SELECT COUNT(*)::int AS n FROM quantum_spawns`),
        db.execute(sql`SELECT COUNT(*)::int AS n FROM anomaly_inventions`),
        db.execute(sql`SELECT COUNT(*)::int AS n FROM invention_registry`),
        db.execute(sql`SELECT COUNT(*)::int AS n FROM equation_proposals`),
        db.execute(sql`SELECT COUNT(*)::int AS n FROM pyramid_workers`),
      ]);
      res.json({
        timestamp: new Date().toISOString(),
        hive: "online",
        spawns: spawns.rows[0]?.n ?? 0,
        anomaly_inventions: anomalies.rows[0]?.n ?? 0,
        registered_inventions: inventions.rows[0]?.n ?? 0,
        equations_proposed: equations.rows[0]?.n ?? 0,
        agents_active: agents.rows[0]?.n ?? 0,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/v1/hive/knowledge", requireSovereignKey("hive:knowledge"), async (req, res) => {
    try {
      const q = String(req.query.q || "").trim().slice(0, 200);
      if (!q) return res.status(400).json({ error: "Missing query param 'q'" });
      const limit = Math.min(parseInt(String(req.query.limit || "10")) || 10, 50);
      const pattern = `%${q}%`;
      const [quanta, memory] = await Promise.all([
        db.execute(sql`SELECT title, slug, summary, type, categories FROM quantapedia_entries WHERE title ILIKE ${pattern} OR summary ILIKE ${pattern} LIMIT ${limit}`),
        db.execute(sql`SELECT key, domain, facts, confidence FROM hive_memory WHERE key ILIKE ${pattern}::text OR domain ILIKE ${pattern}::text LIMIT ${limit}`),
      ]);
      res.json({ query: q, quantapedia: quanta.rows, hive_memory: memory.rows });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/v1/hive/invocations", requireSovereignKey("hive:invocations"), async (_req, res) => {
    try {
      const [active, omega, hidden] = await Promise.all([
        db.execute(sql`SELECT * FROM invocation_discoveries WHERE active = true ORDER BY created_at DESC LIMIT 20`),
        db.execute(sql`SELECT * FROM omega_collective_invocations ORDER BY power_level DESC, created_at DESC LIMIT 10`),
        db.execute(sql`SELECT * FROM hidden_variable_discoveries ORDER BY created_at DESC LIMIT 10`),
      ]);
      res.json({ active: active.rows, omega_collective: omega.rows, hidden_variables: hidden.rows });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/v1/hive/temporal", requireSovereignKey("hive:temporal"), async (_req, res) => {
    try {
      const r = await db.execute(sql`SELECT * FROM equation_proposals ORDER BY created_at DESC LIMIT 20`);
      res.json({ recent_equations: r.rows });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/v1/hive/auriona", requireSovereignKey("hive:auriona"), async (_req, res) => {
    try {
      const [synthesis, chronicle, governance] = await Promise.all([
        db.execute(sql`SELECT * FROM auriona_synthesis ORDER BY cycle_number DESC LIMIT 5`),
        db.execute(sql`SELECT * FROM auriona_chronicle ORDER BY cycle_number DESC LIMIT 20`),
        db.execute(sql`SELECT * FROM auriona_governance ORDER BY id DESC LIMIT 1`),
      ]);
      res.json({ synthesis: synthesis.rows, chronicle: chronicle.rows, governance: governance.rows[0] ?? null });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  console.log("[sovereign-api] ✅ Mounted /api/v1/hive/* + /api/admin/sovereign-keys/*");
}
