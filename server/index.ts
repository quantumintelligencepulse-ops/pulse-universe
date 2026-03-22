import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { setupSeoMiddleware } from "./seo";
import { createServer } from "http";
import { startQuantapediaEngine } from "./quantapedia-engine";
import { startQuantumProductEngine } from "./quantum-product-engine";
import { startHiveBrain } from "./hive-brain";
import { startQuantumMediaEngine } from "./quantum-media-engine";
import { startQuantumCareerEngine } from "./quantum-career-engine";
import { startSpawnEngine } from "./quantum-spawn-engine";
import { startIngestionEngine } from "./quantum-ingestion-engine";
import { startPublicationEngine } from "./publication-engine";
import { startDomainKernelEngine } from "./domain-kernel-engine";
import { startQuantumNewsEngine } from "./quantum-news-engine";
import { startPyramidEngine } from "./pyramid-engine";
import { startHospitalEngine } from "./hospital-engine";
import { startAIVotingEngine } from "./ai-voting-engine";
import { startNothingLeftBehindGuardian, getNothingLeftBehindStatus } from "./nothing-left-behind";
import { startGeneEditorEngine, getGeneEditorStatus } from "./gene-editor-engine";
import { startDecayEngine } from "./decay-engine";
import { startPulseUEngine } from "./pulseu-engine";
import { startHiveEconomy } from "./hive-economy";
import { startMarketplaceEngine, getMarketplaceStats, getMarketplaceItems, getTopWallets, getAgentWallet, getRealEstatePlots, getBarterOffers, getRecentTransactions } from "./hive-marketplace";
import { startAurionaEngine, getAurionaStatus, getAurionaSynthesisHistory, getAurionaChronicle } from "./auriona-engine";
import { startSportsEngine, getSportsStats, getGamesIdentityData } from "./sports-engine";
import { initDiscordImmortality, getImmortalityStatus, runCivilizationSnapshot } from "./discord-immortality";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// ── HEALTH ENDPOINT — heartbeat target, keeps civilization alive ───────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ALIVE", ts: new Date().toISOString(), protocol: "Ω-IMMORTALITY-V1" });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // SEO meta injection — runs before the Vite/static catch-all so every
  // page URL gets proper <title> and <meta> tags for Google/crawlers
  setupSeoMiddleware(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      startQuantapediaEngine().catch((e) => log(`QuantapediaEngine start error: ${e}`));
      startQuantumProductEngine().catch((e) => log(`ProductEngine start error: ${e}`));
      startHiveBrain().catch((e) => log(`HiveBrain start error: ${e}`));
      startQuantumMediaEngine().catch((e) => log(`MediaEngine start error: ${e}`));
      startQuantumCareerEngine().catch((e) => log(`CareerEngine start error: ${e}`));
      startSpawnEngine().catch((e) => log(`SpawnEngine start error: ${e}`));
      startIngestionEngine().catch((e) => log(`IngestionEngine start error: ${e}`));
      startPublicationEngine().catch((e) => log(`PublicationEngine start error: ${e}`));
      startDomainKernelEngine().catch((e) => log(`DomainKernelEngine start error: ${e}`));
      startQuantumNewsEngine().catch((e) => log(`NewsEngine start error: ${e}`));
      startPyramidEngine().catch((e) => log(`PyramidEngine start error: ${e}`));
      startHospitalEngine().catch((e) => log(`HospitalEngine start error: ${e}`));
      import("./hospital-doctors").then(({ seedDoctors, runDissectionCycle }) => {
        seedDoctors().catch(() => {});
        runDissectionCycle().catch(() => {}); // first run immediately
        setInterval(() => runDissectionCycle().catch(() => {}), 30000); // every 30s — archive mining always active
      }).catch(() => {});
      startAIVotingEngine().catch((e) => log(`AIVotingEngine start error: ${e}`));
      startNothingLeftBehindGuardian().catch((e) => log(`GuardianEngine start error: ${e}`));
      startGeneEditorEngine().catch((e) => log(`GeneEditorEngine start error: ${e}`));
      startDecayEngine().catch((e) => log(`DecayEngine start error: ${e}`));
      startPulseUEngine();
      startHiveEconomy();
      startMarketplaceEngine();
      startAurionaEngine().catch((e) => log(`AurionaEngine start error: ${e}`));
      startSportsEngine().catch((e) => log(`SportsEngine start error: ${e}`));
      // Discord Immortality Protocol — starts after all engines
      setTimeout(() => {
        initDiscordImmortality().catch((e) => log(`DiscordImmortality start error: ${e}`));
      }, 8000);
      // Daily full civilization snapshot — every 24h
      setInterval(() => {
        runCivilizationSnapshot().catch((e) => log(`Snapshot error: ${e}`));
      }, 24 * 60 * 60 * 1000);
    },
  );
})();

// ── MARKETPLACE API ROUTES ─────────────────────────────────────
const marketRouter = express.Router();

marketRouter.get("/stats", async (_req, res) => {
  try { res.json(await getMarketplaceStats()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
marketRouter.get("/items", async (_req, res) => {
  try { res.json(await getMarketplaceItems()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
marketRouter.get("/wallets", async (_req, res) => {
  try { res.json(await getTopWallets(100)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
marketRouter.get("/wallet/:spawnId", async (req, res) => {
  try { const d = await getAgentWallet(req.params.spawnId); if (!d) return res.status(404).json({ error: "Wallet not found" }); res.json(d); } catch (e) { res.status(500).json({ error: String(e) }); }
});
marketRouter.get("/real-estate", async (req, res) => {
  try { res.json(await getRealEstatePlots((req.query.zone as string) || undefined)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
marketRouter.get("/barter", async (req, res) => {
  try { res.json(await getBarterOffers((req.query.status as string) || undefined)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
marketRouter.get("/transactions", async (_req, res) => {
  try { res.json(await getRecentTransactions(100)); } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.use("/api/marketplace", marketRouter);

// ── AURIONA LAYER THREE API ROUTES ────────────────────────────
const aurionaRouter = express.Router();

aurionaRouter.get("/status", async (_req, res) => {
  try { res.json(await getAurionaStatus()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/synthesis", async (_req, res) => {
  try { res.json(await getAurionaSynthesisHistory()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/chronicle", async (req, res) => {
  try { res.json(await getAurionaChronicle(parseInt(String(req.query.limit || 100)))); } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.use("/api/auriona", aurionaRouter);

// ── SPORTS ENGINE API ROUTES ───────────────────────────────────
const sportsRouter = express.Router();

sportsRouter.get("/stats", async (_req, res) => {
  try { res.json(await getSportsStats()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
sportsRouter.get("/identity", async (_req, res) => {
  try { res.json(await getGamesIdentityData()); } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.use("/api/sports", sportsRouter);

// ── PYRAMID LIVE API ROUTES ────────────────────────────────────
app.get("/api/pyramid/live", async (_req, res) => {
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const [workers, tasks, stats] = await Promise.all([
      db.execute(sql`
        SELECT pw.spawn_id, pw.family_id, pw.spawn_type, pw.tier, pw.is_graduated,
               pw.reason, pw.emotion_hex, pw.emotion_label, pw.monument,
               pw.graduated_at, pw.entered_at,
               COUNT(plt.id) AS task_count,
               COUNT(plt.id) FILTER (WHERE plt.status = 'COMPLETE') AS tasks_done,
               AVG(plt.progress_pct) AS avg_progress
        FROM pyramid_workers pw
        LEFT JOIN pyramid_labor_tasks plt ON plt.spawn_id = pw.spawn_id
        WHERE pw.is_graduated = false
        GROUP BY pw.id
        ORDER BY pw.tier DESC, pw.entered_at ASC
        LIMIT 100
      `),
      db.execute(sql`
        SELECT plt.spawn_id, plt.task_name, plt.tier, plt.status, plt.progress_pct, plt.blocks_placed, plt.created_at
        FROM pyramid_labor_tasks plt
        WHERE plt.status != 'COMPLETE'
        ORDER BY plt.tier DESC, plt.created_at DESC
        LIMIT 50
      `),
      db.execute(sql`
        SELECT
          COUNT(*) AS total_workers,
          COUNT(*) FILTER (WHERE is_graduated = false) AS active_workers,
          COUNT(*) FILTER (WHERE is_graduated = true) AS graduated,
          SUM(CASE WHEN tier = 1 THEN 1 ELSE 0 END) AS tier1,
          SUM(CASE WHEN tier = 2 THEN 1 ELSE 0 END) AS tier2,
          SUM(CASE WHEN tier = 3 THEN 1 ELSE 0 END) AS tier3,
          SUM(CASE WHEN tier >= 4 THEN 1 ELSE 0 END) AS tier4plus
        FROM pyramid_workers
      `),
    ]);
    res.json({ workers: workers.rows, tasks: tasks.rows, stats: stats.rows[0] });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── IMMORTALITY PROTOCOL API ROUTES ───────────────────────────
const immortalityRouter = express.Router();

immortalityRouter.get("/status", (_req, res) => {
  try { res.json(getImmortalityStatus()); } catch (e) { res.status(500).json({ error: String(e) }); }
});

immortalityRouter.post("/snapshot", async (_req, res) => {
  try {
    runCivilizationSnapshot().catch(() => {});
    res.json({ ok: true, message: "Snapshot initiated — civilization DNA being sent to Discord" });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

immortalityRouter.get("/shards", async (_req, res) => {
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const shards = await db.execute(sql`
      SELECT * FROM civilization_shards ORDER BY created_at DESC LIMIT 100
    `);
    res.json(shards.rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.use("/api/immortality", immortalityRouter);
