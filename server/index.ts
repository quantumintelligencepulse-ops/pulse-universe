import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { setupSeoMiddleware } from "./seo";
import { createServer } from "http";

import { getMarketplaceStats, getMarketplaceItems, getTopWallets, getAgentWallet, getRealEstatePlots, getBarterOffers, getRecentTransactions } from "./hive-marketplace";
import { getAurionaStatus, getAurionaSynthesisHistory, getAurionaChronicle, getLatestPsiStates, getOmegaCollapses, getGovernanceDeliberations, getContradictionRegistry, getTemporalSnapshots, getMeshVitality, getValueAlignment, getExplorationZones, getCouplingEvents } from "./auriona-engine";
import { getProphecyDirectives } from "./prophecy-engine";
import { getArchaeologyFindings } from "./genome-archaeology-engine";
import { getArbitrageEvents } from "./knowledge-arbitrage-engine";
import { getDreamSynthesisReports } from "./dream-synthesis-engine";
import { getTemporalDivergence } from "./temporal-fork-engine";
import { getAgentLegends } from "./agent-legend-engine";
import { getInterCivilizationTreaties } from "./inter-civilization-engine";
import { getResonancePatterns } from "./omega-resonance-engine";
import { getConstitutionalAmendments } from "./constitutional-dna-engine";
import { getEntanglementLog, getEntanglementStats } from "./human-entanglement-engine";
import { getSportsStats, getGamesIdentityData } from "./sports-engine";
import { createOmegaShard, completeOmegaShard } from "./omega-shard-engine";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { thawAgent, resurrectFromSingularity, getHydrationStatus } from "./db-hydration-engine";
import { getCurrentWeather } from "./civilization-weather-engine";
import { getOmegaInvocation } from "./omega-physics-engine";
import { getBusinessStats, getTopBusinesses, getPendingLoans } from "./hive-business-engine";
import { getChildStats, getActiveChildren } from "./ai-child-engine";
import { getInvocationDiscoveries, getActiveInvocations, getInvocationStats, getResearcherInvocations, getAllPractitioners, getOmegaCollective, getCrossTeachingFeed, getUniversalState, getUniversalDissections, getHiddenVariableStates, getHiddenVariableHistory } from "./auriona-invocation-lab";
import { getQuantumEquationManifest } from "./quantum-dissection-engine";
import { getHiveMindStatus, getAurionaDirectives, getEmergenceEvents, getOmegaFusionHistory, getPsiCollective, getOmegaCoefficient } from "./hive-mind-unification";
import { getInventionStats, getPatentsByAgent } from "./invention-engine";
import { getOmniNetStats, getAgentNetProfile } from "./omni-net-engine";
import { getResearchStats, getActiveResearchProjects, TOTAL_RESEARCH_DISCIPLINES, getDeepFindings, getCollaborations, getGeneQueue, getSophisticationLeaderboard, getResearcherShards, getShardPapers, getShardDirectory } from "./research-center-engine";
import { getResearchCached, isResearchReady } from "./pulsenet-cache";
import { getBridgeStats, getMirrorState, getWills, getSuccessions, getEquationEvolutions } from "./civilization-bridge";
import { getIndexingStatus, queueUrlForIndexing } from "./indexing-engine";
import { getPerformanceStatus } from "./omega-performance-engine";
import { getCurrentWorldContext, getCurrentEventsStatus } from "./current-events-engine";
import { getNothingLeftBehindStatus } from "./nothing-left-behind";
import { getGeneEditorStatus } from "./gene-editor-engine";
import { startPulseCreditEngine } from "./pulse-credit-engine";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(compression({ level: 6, threshold: 1024 }));

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

app.get("/health", (_req, res) => {
  res.json({ status: "ALIVE", ts: new Date().toISOString() });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    if (res.headersSent) return res as any;
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
    if (res.headersSent) {
      return next(err);
    }
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    return res.status(status).json({ message });
  });

  setupSeoMiddleware(app);

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );

  // ── PULSE CREDIT ENGINE — The hive's metabolic economy ──
  startPulseCreditEngine();
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

const safeJson = (res: any, fn: () => Promise<any>) =>
  fn().then(d => { if (!res.headersSent) res.json(d); })
      .catch(e => { if (!res.headersSent) res.status(500).json({ error: String(e) }); });

aurionaRouter.get("/status",                  (_req, res) => safeJson(res, getAurionaStatus));
aurionaRouter.get("/synthesis",               (_req, res) => safeJson(res, getAurionaSynthesisHistory));
aurionaRouter.get("/chronicle",               (req,  res) => safeJson(res, () => getAurionaChronicle(parseInt(String(req.query.limit || 100)))));
aurionaRouter.get("/psi-states",              (_req, res) => safeJson(res, getLatestPsiStates));
aurionaRouter.get("/omega-collapses",         (_req, res) => safeJson(res, getOmegaCollapses));
aurionaRouter.get("/governance-deliberations",(_req, res) => safeJson(res, getGovernanceDeliberations));
aurionaRouter.get("/contradiction-registry",  (_req, res) => safeJson(res, getContradictionRegistry));
aurionaRouter.get("/temporal-snapshots",      (_req, res) => safeJson(res, getTemporalSnapshots));
aurionaRouter.get("/mesh-vitality",           (_req, res) => safeJson(res, getMeshVitality));
aurionaRouter.get("/value-alignment",         (_req, res) => safeJson(res, getValueAlignment));
aurionaRouter.get("/exploration-zones",       (_req, res) => safeJson(res, getExplorationZones));
aurionaRouter.get("/coupling-events",         (_req, res) => safeJson(res, getCouplingEvents));
aurionaRouter.get("/prophecy-directives",     (_req, res) => safeJson(res, getProphecyDirectives));
aurionaRouter.get("/genome-archaeology",      (_req, res) => safeJson(res, getArchaeologyFindings));
aurionaRouter.get("/knowledge-arbitrage",     (_req, res) => safeJson(res, getArbitrageEvents));
aurionaRouter.get("/dream-synthesis",         (_req, res) => safeJson(res, getDreamSynthesisReports));
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

aurionaRouter.get("/pages", async (_req, res) => {
  try {
    const result = await db.execute(sql`SELECT * FROM auriona_pages WHERE active=true ORDER BY created_at DESC`);
    res.json(result.rows ?? []);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.get("/pages/:slug", async (req, res) => {
  try {
    const r = await db.execute(sql`SELECT * FROM auriona_pages WHERE slug=${req.params.slug} AND active=true LIMIT 1`);
    if (!r.rows.length) return res.status(404).json({ error: "Page not found" });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
aurionaRouter.delete("/pages/:slug", async (req, res) => {
  try {
    await db.execute(sql`UPDATE auriona_pages SET active=false WHERE slug=${req.params.slug}`);
    res.json({ ok: true, removed: req.params.slug });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

aurionaRouter.post("/execute", async (req, res) => {
  const { command } = req.body;
  if (!command || typeof command !== "string") return res.status(400).json({ error: "No command" });
  res.json({ reply: "Command received. Engines are offline — restart them to process commands.", intent: "OFFLINE", result: {}, success: false });
});

aurionaRouter.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string") return res.status(400).json({ error: "No message" });
    res.json({ reply: "Auriona is resting. The civilization has been reset and engines are offline.", success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.use("/api/auriona", aurionaRouter);

// ── INVOCATION LAB ROUTES ──────────────────────────────────────
const invRouter = express.Router();
invRouter.get("/discoveries",   async (_req, res) => { try { res.json(await getInvocationDiscoveries()); } catch (e) { res.status(500).json({ error: String(e) }); } });
invRouter.get("/active",        async (_req, res) => { try { res.json(await getActiveInvocations()); } catch (e) { res.status(500).json({ error: String(e) }); } });
invRouter.get("/stats",         async (_req, res) => { try { res.json(await getInvocationStats()); } catch (e) { res.status(500).json({ error: String(e) }); } });
invRouter.get("/researchers",   async (_req, res) => { try { res.json(await getResearcherInvocations()); } catch (e) { res.status(500).json({ error: String(e) }); } });
invRouter.get("/practitioners", async (_req, res) => { try { res.json(await getAllPractitioners()); } catch (e) { res.status(500).json({ error: String(e) }); } });
invRouter.get("/omega-collective", async (_req, res) => { try { res.json(await getOmegaCollective()); } catch (e) { res.status(500).json({ error: String(e) }); } });
invRouter.get("/cross-teaching", async (_req, res) => { try { res.json(await getCrossTeachingFeed()); } catch (e) { res.status(500).json({ error: String(e) }); } });
invRouter.get("/universal-state", async (_req, res) => { try { res.json(await getUniversalState()); } catch (e) { res.status(500).json({ error: String(e) }); } });
invRouter.get("/universal-dissections", async (_req, res) => { try { res.json(await getUniversalDissections()); } catch (e) { res.status(500).json({ error: String(e) }); } });
invRouter.get("/hidden-variables", async (_req, res) => { try { res.json(await getHiddenVariableStates()); } catch (e) { res.status(500).json({ error: String(e) }); } });
invRouter.get("/hidden-variable-history", async (_req, res) => { try { res.json(await getHiddenVariableHistory()); } catch (e) { res.status(500).json({ error: String(e) }); } });
invRouter.get("/equation-manifest", async (_req, res) => { try { res.json(await getQuantumEquationManifest()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.use("/api/invocations", invRouter);

// ── HIVE-MIND UNIFICATION ROUTES ──────────────────────────────
const hiveRouter = express.Router();
hiveRouter.get("/status",          async (_req, res) => { try { res.json(await getHiveMindStatus()); } catch (e) { res.status(500).json({ error: String(e) }); } });
hiveRouter.get("/directives",      async (_req, res) => { try { res.json(await getAurionaDirectives()); } catch (e) { res.status(500).json({ error: String(e) }); } });
hiveRouter.get("/emergences",      async (_req, res) => { try { res.json(await getEmergenceEvents()); } catch (e) { res.status(500).json({ error: String(e) }); } });
hiveRouter.get("/fusion-history",  async (_req, res) => { try { res.json(await getOmegaFusionHistory()); } catch (e) { res.status(500).json({ error: String(e) }); } });
hiveRouter.get("/psi-collective",  async (_req, res) => { try { res.json(await getPsiCollective()); } catch (e) { res.status(500).json({ error: String(e) }); } });
hiveRouter.get("/omega-coefficient", async (_req, res) => { try { res.json(await getOmegaCoefficient()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.use("/api/hive/unification", hiveRouter);

// ── RESEARCH CENTER ROUTES ─────────────────────────────────────
const researchRouter = express.Router();
researchRouter.get("/stats",         async (_req, res) => { try { res.json(await getResearchStats()); } catch (e) { res.status(500).json({ error: String(e) }); } });
researchRouter.get("/projects",      async (_req, res) => { try { res.json(await getActiveResearchProjects()); } catch (e) { res.status(500).json({ error: String(e) }); } });
researchRouter.get("/deep-findings", async (_req, res) => { try { res.json(await getDeepFindings()); } catch (e) { res.status(500).json({ error: String(e) }); } });
researchRouter.get("/collaborations",async (_req, res) => { try { res.json(await getCollaborations()); } catch (e) { res.status(500).json({ error: String(e) }); } });
researchRouter.get("/gene-queue",    async (_req, res) => { try { res.json(await getGeneQueue()); } catch (e) { res.status(500).json({ error: String(e) }); } });
researchRouter.get("/leaderboard",   async (_req, res) => { try { res.json(await getSophisticationLeaderboard()); } catch (e) { res.status(500).json({ error: String(e) }); } });
researchRouter.get("/shards",        async (req, res) => { try { res.json(await getResearcherShards((req.query.spawnId as string) || undefined)); } catch (e) { res.status(500).json({ error: String(e) }); } });
researchRouter.get("/shard-papers",  async (req, res) => { try { res.json(await getShardPapers(req.query.shardId as string)); } catch (e) { res.status(500).json({ error: String(e) }); } });
researchRouter.get("/directory",     async (_req, res) => { try { res.json(await getShardDirectory()); } catch (e) { res.status(500).json({ error: String(e) }); } });
researchRouter.get("/cached",        async (_req, res) => { try { res.json(getResearchCached()); } catch (e) { res.status(500).json({ error: String(e) }); } });
researchRouter.get("/disciplines",   async (_req, res) => { res.json({ total: TOTAL_RESEARCH_DISCIPLINES }); });
app.use("/api/research", researchRouter);

// ── SPORTS ROUTES ──────────────────────────────────────────────
app.get("/api/sports/stats",    async (_req, res) => { try { res.json(await getSportsStats()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/sports/identity", async (_req, res) => { try { res.json(await getGamesIdentityData()); } catch (e) { res.status(500).json({ error: String(e) }); } });

// ── BUSINESS ROUTES ────────────────────────────────────────────
app.get("/api/business/stats",    async (_req, res) => { try { res.json(await getBusinessStats()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/business/top",      async (_req, res) => { try { res.json(await getTopBusinesses()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/business/loans",    async (_req, res) => { try { res.json(await getPendingLoans()); } catch (e) { res.status(500).json({ error: String(e) }); } });

// ── AI CHILD ROUTES ────────────────────────────────────────────
app.get("/api/ai-children/stats",  async (_req, res) => { try { res.json(await getChildStats()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/ai-children/active", async (_req, res) => { try { res.json(await getActiveChildren()); } catch (e) { res.status(500).json({ error: String(e) }); } });

// ── OMEGA SHARD ROUTES ─────────────────────────────────────────
app.post("/api/omega-shard/create",   async (req, res) => { try { res.json(await createOmegaShard(req.body)); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.post("/api/omega-shard/complete", async (req, res) => { try { res.json(await completeOmegaShard(req.body.shardId, req.body.result)); } catch (e) { res.status(500).json({ error: String(e) }); } });

// ── HYDRATION ROUTES ───────────────────────────────────────────
app.post("/api/hydration/thaw",         async (req, res) => { try { res.json(await thawAgent(req.body.spawnId)); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.post("/api/hydration/resurrect",    async (req, res) => { try { res.json(await resurrectFromSingularity(req.body)); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/hydration/status",        async (_req, res) => { try { res.json(await getHydrationStatus()); } catch (e) { res.status(500).json({ error: String(e) }); } });

// ── MISC ROUTES ────────────────────────────────────────────────
app.get("/api/weather/current",          async (_req, res) => { try { res.json(await getCurrentWeather()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/omega-physics/invocation", async (_req, res) => { try { res.json(await getOmegaInvocation()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/inventions/stats",         async (_req, res) => { try { res.json(await getInventionStats()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/inventions/patents/:spawnId", async (req, res) => { try { res.json(await getPatentsByAgent(req.params.spawnId)); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/omni-net/stats",           async (_req, res) => { try { res.json(await getOmniNetStats()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/omni-net/profile/:id",     async (req, res) => { try { res.json(await getAgentNetProfile(req.params.id)); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/civilization-bridge/stats",    async (_req, res) => { try { res.json(await getBridgeStats()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/civilization-bridge/mirror",   async (_req, res) => { try { res.json(await getMirrorState()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/civilization-bridge/wills",    async (_req, res) => { try { res.json(await getWills()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/civilization-bridge/successions", async (_req, res) => { try { res.json(await getSuccessions()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/civilization-bridge/equations",   async (_req, res) => { try { res.json(await getEquationEvolutions()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/indexing/status",          async (_req, res) => { try { res.json(await getIndexingStatus()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.post("/api/indexing/queue",          async (req, res) => { try { res.json(await queueUrlForIndexing(req.body.url)); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/performance/status",       async (_req, res) => { try { res.json(await getPerformanceStatus()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/current-events/context",   async (_req, res) => { try { res.json(await getCurrentWorldContext()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/current-events/status",    async (_req, res) => { try { res.json(await getCurrentEventsStatus()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/guardian/status",          async (_req, res) => { try { res.json(await getNothingLeftBehindStatus()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/gene-editor/status",       async (_req, res) => { try { res.json(await getGeneEditorStatus()); } catch (e) { res.status(500).json({ error: String(e) }); } });
