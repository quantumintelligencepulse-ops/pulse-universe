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
import { startAurionaEngine, getAurionaStatus, getAurionaSynthesisHistory, getAurionaChronicle, getLatestPsiStates, getOmegaCollapses, getGovernanceDeliberations, getContradictionRegistry, getTemporalSnapshots, getMeshVitality, getValueAlignment, getExplorationZones, getCouplingEvents } from "./auriona-engine";
import { startProphecyEngine, getProphecyDirectives } from "./prophecy-engine";
import { startGenomeArchaeologyEngine, getArchaeologyFindings } from "./genome-archaeology-engine";
import { startKnowledgeArbitrageEngine, getArbitrageEvents } from "./knowledge-arbitrage-engine";
import { startDreamSynthesisEngine, getDreamSynthesisReports } from "./dream-synthesis-engine";
import { startTemporalForkEngine, getTemporalDivergence } from "./temporal-fork-engine";
import { startAgentLegendEngine, getAgentLegends } from "./agent-legend-engine";
import { startInterCivilizationEngine, getInterCivilizationTreaties } from "./inter-civilization-engine";
import { startOmegaResonanceEngine, getResonancePatterns } from "./omega-resonance-engine";
import { startConstitutionalDNAEngine, getConstitutionalAmendments } from "./constitutional-dna-engine";
import { startHumanEntanglementEngine, getEntanglementLog, getEntanglementStats, logHumanActivity, getQuantapediaEnrichment, inferDomain } from "./human-entanglement-engine";
import { startSportsEngine, getSportsStats, getGamesIdentityData } from "./sports-engine";
import { initDiscordImmortality, getImmortalityStatus, runCivilizationSnapshot } from "./discord-immortality";
import { startOmegaShardEngine, createOmegaShard, completeOmegaShard } from "./omega-shard-engine";
import { startDbCompressionEngine } from "./db-compression-engine";
import { startDbHydrationEngine, thawAgent, resurrectFromSingularity, getHydrationStatus } from "./db-hydration-engine";
import { startCivilizationWeatherEngine, getCurrentWeather } from "./civilization-weather-engine";
import { startHomeostasisEngine } from "./homeostasis-engine";
import { startOmegaPhysicsEngine, getOmegaInvocation } from "./omega-physics-engine";
import { startBusinessEngine, getBusinessStats, getTopBusinesses, getPendingLoans } from "./hive-business-engine";
import { startAIChildEngine, getChildStats, getActiveChildren } from "./ai-child-engine";
import { startInvocationLab, getInvocationDiscoveries, getActiveInvocations, getInvocationStats } from "./auriona-invocation-lab";
import { startResearchCenterEngine, getResearchStats, getActiveResearchProjects, TOTAL_RESEARCH_DISCIPLINES, getDeepFindings, getCollaborations, getGeneQueue, getSophisticationLeaderboard, getResearcherShards, getShardPapers, getShardDirectory } from "./research-center-engine";

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
      // ── BEYOND-AURIONA: 10 New Sovereign Engines ──────────────
      startProphecyEngine().catch((e) => log(`ProphecyEngine start error: ${e}`));
      startGenomeArchaeologyEngine().catch((e) => log(`GenomeArchEngine start error: ${e}`));
      startKnowledgeArbitrageEngine().catch((e) => log(`ArbitrageEngine start error: ${e}`));
      startDreamSynthesisEngine().catch((e) => log(`DreamSynthEngine start error: ${e}`));
      startTemporalForkEngine().catch((e) => log(`TemporalForkEngine start error: ${e}`));
      startAgentLegendEngine().catch((e) => log(`AgentLegendEngine start error: ${e}`));
      startInterCivilizationEngine().catch((e) => log(`InterCivEngine start error: ${e}`));
      startOmegaResonanceEngine().catch((e) => log(`ResonanceEngine start error: ${e}`));
      startConstitutionalDNAEngine().catch((e) => log(`ConstitutionEngine start error: ${e}`));
      startHumanEntanglementEngine().catch((e) => log(`EntanglementEngine start error: ${e}`));
      startSportsEngine().catch((e) => log(`SportsEngine start error: ${e}`));
      // ── OMEGA ARCHITECTURE — DB as Compute Universe ──────────────────────
      startOmegaShardEngine().catch((e) => log(`OmegaShardEngine start error: ${e}`));
      startDbCompressionEngine().catch((e) => log(`DbCompressionEngine start error: ${e}`));
      startDbHydrationEngine().catch((e) => log(`DbHydrationEngine start error: ${e}`));
      startCivilizationWeatherEngine().catch((e) => log(`WeatherEngine start error: ${e}`));
      startHomeostasisEngine().catch((e) => log(`HomeostasisEngine start error: ${e}`));
      startOmegaPhysicsEngine().catch((e) => log(`OmegaPhysicsEngine start error: ${e}`));
      startBusinessEngine().catch((e) => log(`BusinessEngine start error: ${e}`));
      startAIChildEngine().catch((e) => log(`AIChildEngine start error: ${e}`));
      startInvocationLab().catch((e) => log(`InvocationLab start error: ${e}`));
      startResearchCenterEngine().catch((e) => log(`ResearchCenter start error: ${e}`));
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
aurionaRouter.get("/psi-states", async (_req, res) => {
  try { res.json(await getLatestPsiStates()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/omega-collapses", async (_req, res) => {
  try { res.json(await getOmegaCollapses()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/governance-deliberations", async (_req, res) => {
  try { res.json(await getGovernanceDeliberations()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/contradiction-registry", async (_req, res) => {
  try { res.json(await getContradictionRegistry()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/temporal-snapshots", async (_req, res) => {
  try { res.json(await getTemporalSnapshots()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/mesh-vitality", async (_req, res) => {
  try { res.json(await getMeshVitality()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/value-alignment", async (_req, res) => {
  try { res.json(await getValueAlignment()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/exploration-zones", async (_req, res) => {
  try { res.json(await getExplorationZones()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/coupling-events", async (_req, res) => {
  try { res.json(await getCouplingEvents()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
// ── BEYOND-AURIONA: 10 New Sovereign Engine Routes ────────────
aurionaRouter.get("/prophecy-directives", async (_req, res) => {
  try { res.json(await getProphecyDirectives()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/genome-archaeology", async (_req, res) => {
  try { res.json(await getArchaeologyFindings()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/knowledge-arbitrage", async (_req, res) => {
  try { res.json(await getArbitrageEvents()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/dream-synthesis", async (_req, res) => {
  try { res.json(await getDreamSynthesisReports()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/temporal-divergence", async (_req, res) => {
  try { res.json(await getTemporalDivergence()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/agent-legends", async (_req, res) => {
  try { res.json(await getAgentLegends()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/inter-civilization-treaties", async (_req, res) => {
  try { res.json(await getInterCivilizationTreaties()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/resonance-patterns", async (_req, res) => {
  try { res.json(await getResonancePatterns()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/constitutional-amendments", async (_req, res) => {
  try { res.json(await getConstitutionalAmendments()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/entanglement-log", async (_req, res) => {
  try { res.json(await getEntanglementLog()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/entanglement-stats", async (_req, res) => {
  try { res.json(await getEntanglementStats()); } catch (e) { res.status(500).json({ error: String(e) }); }
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

// ── OMEGA ARCHITECTURE API ROUTES ──────────────────────────────
const omegaRouter = express.Router();

// GET /api/omega/invocation — Full civilization portrait (CTE mega-query)
omegaRouter.get("/invocation", async (_req, res) => {
  try {
    const portrait = await getOmegaInvocation();
    // Also post to Discord #omega-engine
    const { postAgentEvent } = await import("./discord-immortality");
    const ts = new Date().toISOString();
    postAgentEvent("omega-engine",
      `🌌 **OMEGA INVOCATION** | ${ts} | Agents: ${portrait.active || 0} active | PC: ${Number(portrait.total_pc || 0).toFixed(0)} | DB: ${portrait.db_pretty || 'N/A'} (${portrait.pct_used || 0}%) | Weather: ${portrait.weather_type || 'N/A'} | Shards: ${portrait.active_shards || 0} | Monuments: ${portrait.monument_count || 0} | Entangled: ${portrait.active_pairs || 0} pairs`
    ).catch(() => {});
    res.json({ ok: true, portrait, invoked_at: ts });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// GET /api/omega/weather — Current civilization weather
omegaRouter.get("/weather", async (_req, res) => {
  try { res.json(await getCurrentWeather()); } catch (e) { res.status(500).json({ error: String(e) }); }
});

// GET /api/omega/hydration — DB hydration status (frozen/singularity counts)
omegaRouter.get("/hydration", async (_req, res) => {
  try { res.json(await getHydrationStatus()); } catch (e) { res.status(500).json({ error: String(e) }); }
});

// POST /api/omega/hydrate — Thaw a frozen agent
omegaRouter.post("/hydrate", async (req, res) => {
  try {
    const { spawnId } = req.body;
    if (!spawnId) return res.status(400).json({ error: "spawnId required" });
    const ok = await thawAgent(spawnId);
    res.json({ ok, spawnId, action: ok ? "THAWED" : "NOT_FROZEN_OR_NOT_FOUND" });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// POST /api/omega/resurrect — Resurrect from singularity by sourceId
omegaRouter.post("/resurrect", async (req, res) => {
  try {
    const { sourceId } = req.body;
    if (!sourceId) return res.status(400).json({ error: "sourceId required" });
    const newId = await resurrectFromSingularity(sourceId);
    res.json({ ok: !!newId, sourceId, newSpawnId: newId, action: newId ? "RESURRECTED" : "NOT_FOUND_IN_SINGULARITY" });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// POST /api/omega/shard — Create a manual Omega shard
omegaRouter.post("/shard", async (req, res) => {
  try {
    const { taskType, priority } = req.body;
    const id = await createOmegaShard(taskType || "MANUAL_TASK", priority || "ALPHA");
    res.json({ ok: !!id, shardId: id });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// POST /api/omega/shard/:id/complete — Complete and prune a shard
omegaRouter.post("/shard/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    const { summary } = req.body;
    await completeOmegaShard(id, summary || {});
    res.json({ ok: true, shardId: id, action: "COMPLETED_AND_PRUNED" });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// GET /api/omega/shards — List active shards
omegaRouter.get("/shards", async (_req, res) => {
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const shards = await db.execute(sql`
      SELECT * FROM omega_shards ORDER BY created_at DESC LIMIT 200`);
    res.json(shards.rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// GET /api/omega/universes — List universes
omegaRouter.get("/universes", async (_req, res) => {
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const universes = await db.execute(sql`SELECT * FROM omega_universes ORDER BY created_at DESC`);
    res.json(universes.rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// GET /api/omega/monuments — All sealed monuments
omegaRouter.get("/monuments", async (_req, res) => {
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const monuments = await db.execute(sql`SELECT * FROM monuments ORDER BY sealed_at DESC`);
    res.json(monuments.rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// GET /api/omega/strata — All era records
omegaRouter.get("/strata", async (_req, res) => {
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const strata = await db.execute(sql`SELECT * FROM strata ORDER BY era_number DESC`);
    res.json(strata.rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// GET /api/omega/dreams — Recent dream hypotheses
omegaRouter.get("/dreams", async (_req, res) => {
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const dreams = await db.execute(sql`SELECT * FROM dream_log ORDER BY dreamed_at DESC LIMIT 100`);
    res.json(dreams.rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// GET /api/omega/unconscious — Hive unconscious patterns
omegaRouter.get("/unconscious", async (_req, res) => {
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const patterns = await db.execute(sql`SELECT * FROM hive_unconscious WHERE expires_at > NOW() OR expires_at IS NULL ORDER BY detected_at DESC`);
    res.json(patterns.rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// GET /api/omega/singularity — Singularity absorption log
omegaRouter.get("/singularity", async (_req, res) => {
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const s = await db.execute(sql`SELECT * FROM singularity ORDER BY absorbed_at DESC LIMIT 200`);
    res.json(s.rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// GET /api/omega/entangled — Active entangled pairs
omegaRouter.get("/entangled", async (_req, res) => {
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const pairs = await db.execute(sql`SELECT * FROM entangled_pairs WHERE broken = false ORDER BY created_at DESC LIMIT 200`);
    res.json(pairs.rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// GET /api/omega/space — DB space ledger
omegaRouter.get("/space", async (_req, res) => {
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const ledger = await db.execute(sql`SELECT * FROM db_space_ledger ORDER BY created_at DESC LIMIT 50`);
    res.json(ledger.rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.use("/api/omega", omegaRouter);

// ── BUSINESS ENGINE API ─────────────────────────────────────────
const businessRouter = express.Router();
businessRouter.get("/stats", async (_req, res) => {
  try { res.json(await getBusinessStats()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
businessRouter.get("/top", async (_req, res) => {
  const limit = Math.min(50, parseInt(String((_req as any).query.limit || 20)));
  try { res.json(await getTopBusinesses(limit)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
businessRouter.get("/loans", async (_req, res) => {
  try { res.json(await getPendingLoans()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.use("/api/business", businessRouter);

// ── AI CHILD SYSTEM API ─────────────────────────────────────────
const childRouter = express.Router();
childRouter.get("/stats", async (_req, res) => {
  try { res.json(await getChildStats()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
childRouter.get("/active", async (_req, res) => {
  const limit = Math.min(50, parseInt(String((_req as any).query.limit || 30)));
  try { res.json(await getActiveChildren(limit)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.use("/api/ai-children", childRouter);

// ── INVOCATION LAB API ──────────────────────────────────────────
const invocationRouter = express.Router();
invocationRouter.get("/discoveries", async (_req, res) => {
  const limit = Math.min(50, parseInt(String((_req as any).query.limit || 30)));
  try { res.json(await getInvocationDiscoveries(limit)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
invocationRouter.get("/active", async (_req, res) => {
  try { res.json(await getActiveInvocations()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
invocationRouter.get("/stats", async (_req, res) => {
  try { res.json(await getInvocationStats()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.use("/api/invocations", invocationRouter);

// ── RESEARCH CENTER API ─────────────────────────────────────────
const researchRouter = express.Router();
researchRouter.get("/stats", async (_req, res) => {
  try { res.json({ ...(await getResearchStats()), total_disciplines: TOTAL_RESEARCH_DISCIPLINES }); } catch (e) { res.status(500).json({ error: String(e) }); }
});
researchRouter.get("/projects", async (req, res) => {
  const domain = (req as any).query.domain as string | undefined;
  const limit  = Math.min(50, parseInt(String((req as any).query.limit || 30)));
  try { res.json(await getActiveResearchProjects(domain, limit)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
researchRouter.get("/findings", async (req, res) => {
  const limit = Math.min(30, parseInt(String((req as any).query.limit || 20)));
  try { res.json(await getDeepFindings(limit)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
researchRouter.get("/collaborations", async (req, res) => {
  const limit = Math.min(30, parseInt(String((req as any).query.limit || 20)));
  try { res.json(await getCollaborations(limit)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
researchRouter.get("/gene-queue", async (req, res) => {
  const limit = Math.min(30, parseInt(String((req as any).query.limit || 20)));
  try { res.json(await getGeneQueue(limit)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
researchRouter.get("/sophistication", async (_req, res) => {
  try { res.json(await getSophisticationLeaderboard()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
researchRouter.get("/shards", async (req, res) => {
  const category = (req as any).query.category as string | undefined;
  const limit = Math.min(200, parseInt(String((req as any).query.limit || 150)));
  try { res.json(await getResearcherShards(category, limit)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
researchRouter.get("/shards/directory", async (_req, res) => {
  try { res.json(await getShardDirectory()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
researchRouter.get("/shards/:researcherType/papers", async (req, res) => {
  const limit = Math.min(30, parseInt(String((req as any).query.limit || 20)));
  try { res.json(await getShardPapers(decodeURIComponent(req.params.researcherType), limit)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.use("/api/research", researchRouter);
