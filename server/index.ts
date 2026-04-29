import express, { type Request, Response, NextFunction } from "express";
import { pool } from "./db";
import compression from "compression";

// ── GLOBAL CRASH GUARDS ─────────────────────────────────────────────────────
// Prevent ANY unhandled async error in a background engine from killing Node.
// All engines have their own try-catch, but this is the final safety net.
process.on('unhandledRejection', (reason: unknown) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  // Ignore routine pool-timeout noise — these are caught per-engine already
  if (typeof msg === 'string' && msg.includes('timeout exceeded when trying to connect')) return;
  console.error('[process] ⚠️  Unhandled promise rejection (non-fatal):', msg);
});
process.on('uncaughtException', (err: Error) => {
  const msg = err?.message ?? String(err);
  if (msg.includes('timeout exceeded when trying to connect')) {
    console.error('[process] ⚠️  Uncaught pool timeout (engine missed catch):', msg);
    return; // do NOT exit — pool timeouts are recoverable
  }
  console.error('[process] 🔴 Uncaught exception:', err);
  // Only exit for truly unrecoverable errors (e.g. EACCES, EADDRINUSE)
  if (msg.includes('EADDRINUSE') || msg.includes('EACCES')) process.exit(1);
});

import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { setupSeoMiddleware } from "./seo";
import { mountSovereignRoutes } from "./sovereign-api-keys";
import { createServer } from "http";

import { startMarketplaceEngine } from "./hive-marketplace";
import { startHiveEconomy } from "./hive-economy";
import { startMultiverseMall } from "./multiverse-mall";
import { startAurionaEngine, getAurionaStatus, getAurionaSynthesisHistory, getAurionaChronicle, getLatestPsiStates, getOmegaCollapses, getGovernanceDeliberations, getContradictionRegistry, getTemporalSnapshots, getMeshVitality, getValueAlignment, getExplorationZones, getCouplingEvents } from "./auriona-engine";
import { getProphecyDirectives, startProphecyEngine } from "./prophecy-engine";
import { getArchaeologyFindings, startGenomeArchaeologyEngine } from "./genome-archaeology-engine";
import { getArbitrageEvents, startKnowledgeArbitrageEngine } from "./knowledge-arbitrage-engine";
import { getDreamSynthesisReports, startDreamSynthesisEngine } from "./dream-synthesis-engine";
import { getTemporalDivergence, startTemporalForkEngine } from "./temporal-fork-engine";
import { getAgentLegends, startAgentLegendEngine } from "./agent-legend-engine";
import { getInterCivilizationTreaties, startInterCivilizationEngine } from "./inter-civilization-engine";
import { getResonancePatterns, startOmegaResonanceEngine } from "./omega-resonance-engine";
import { getConstitutionalAmendments, startConstitutionalDNAEngine } from "./constitutional-dna-engine";
import { initDiscordImmortality } from "./discord-immortality";
import { getEntanglementLog, getEntanglementStats, startHumanEntanglementEngine } from "./human-entanglement-engine";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { thawAgent, resurrectFromSingularity, getHydrationStatus, startDbHydrationEngine } from "./db-hydration-engine";
import { getBusinessStats, getTopBusinesses, getPendingLoans, startBusinessEngine } from "./hive-business-engine";
import { startEmotionalEvolutionEngine } from "./emotional-evolution-engine";
import { startSocialHiveEngine } from "./social-hive-engine";
import { startOmegaIemaEngine } from "./omega-iema-engine";
import { getChildStats, getActiveChildren, startAIChildEngine } from "./ai-child-engine";
import { getInvocationDiscoveries, getActiveInvocations, getInvocationStats, getResearcherInvocations, getAllPractitioners, getOmegaCollective, getCrossTeachingFeed, getUniversalState, getUniversalDissections, getHiddenVariableStates, getHiddenVariableHistory } from "./auriona-invocation-lab";
import { getQuantumEquationManifest } from "./quantum-dissection-engine";
import { getHiveMindStatus, getAurionaDirectives, getEmergenceEvents, getOmegaFusionHistory, getPsiCollective, getOmegaCoefficient } from "./hive-mind-unification";
import { getInventionStats, getPatentsByAgent } from "./invention-engine";
import { getOmniNetStats, getAgentNetProfile, startOmniNetEngine } from "./omni-net-engine";
import { getResearchStats, getActiveResearchProjects, TOTAL_RESEARCH_DISCIPLINES, getDeepFindings, getCollaborations, getGeneQueue, getSophisticationLeaderboard, getResearcherShards, getShardPapers, getShardDirectory, startResearchCenterEngine } from "./research-center-engine";
import { getResearchCached, isResearchReady } from "./pulsenet-cache";
import { getBridgeStats, getMirrorState, getWills, getSuccessions, getEquationEvolutions } from "./civilization-bridge";
import { getIndexingStatus, queueUrlForIndexing, startIndexingEngine } from "./indexing-engine";
import { getPerformanceStatus, startOmegaPerformanceEngine } from "./omega-performance-engine";
import { getCurrentWorldContext, getCurrentEventsStatus, startCurrentEventsEngine } from "./current-events-engine";
import { getNothingLeftBehindStatus } from "./nothing-left-behind";
import { getGeneEditorStatus, startGeneEditorEngine } from "./gene-editor-engine";
import { startHospitalEngine } from "./hospital-engine";
import { startSpawnEngine } from "./quantum-spawn-engine";
import { startUniverseRebirthEngine } from "./universe-rebirth-engine";
import { startDomainKernelEngine } from "./domain-kernel-engine";
import "./subconscious-attraction-engine"; // 2026-04-27: top-level setInterval auto-starts 60s attraction cycle
import { startPipEngine } from "./pip-engine";
import { startDbCompressionEngine } from "./db-compression-engine";
import { startJobIngestionEngine } from "./job-ingestion-engine";
import { startChurchResearchEngine } from "./church-research-engine";
import { startQuantumNewsEngine } from "./quantum-news-engine";
import { startQuantumProductEngine } from "./quantum-product-engine";
import { startLivePriceEngine } from "./live-price-engine";
import { startPulseCreditEngine } from "./pulse-credit-engine";
import { startPyramidEngine } from "./pyramid-engine";
import { startSportsEngine } from "./sports-engine";
// 2026-04-27: T007 — restored ai-voting + invention + quantum-dissection
import { startAIVotingEngine } from "./ai-voting-engine";
import { startInventionEngine } from "./invention-engine";
import { startQuantumDissectionEngine } from "./quantum-dissection-engine";
// 2026-04-27: T008 — full discovery pipeline online: pulse-lang scientists + invocation lab
import { startPulseLabCycle } from "./pulse-lang-lab";
import { startInvocationLab } from "./auriona-invocation-lab";
// ── 2026-04-26: re-enabled omni-net, research-center, hospital, gene-editor.
//    Still paused: publication.
import { startIngestionEngine } from "./quantum-ingestion-engine";
import { startQuantumSocialEngine } from "./quantum-social-engine";
import { startPulseNetCache } from "./pulsenet-cache";
import { startQuantapediaEngine } from "./quantapedia-engine";
import { startLivingLanguageEngine } from "./pulse-lang-evo";

// 2026-04-28: T008 — Wave A→F engine restoration. 14 fresh imports for engines previously dormant or restored from git.
import { startDecayEngine } from "./decay-engine";
import { startQStabilityEngine } from "./q-stability-engine";
import { startHomeostasisEngine } from "./homeostasis-engine";
import { startOmegaPhysicsEngine } from "./omega-physics-engine";
import { startOmegaShardEngine } from "./omega-shard-engine";
import { startCivilizationWeatherEngine } from "./civilization-weather-engine";
import { startKernelDissectionEngine } from "./kernel-dissection-engine";
import { startBillyBrainEngine } from "./billy-brain-engine";
import { startDissectionLabs } from "./dissection-labs-engine";
import { startBillyPhase2Sweeper } from "./billy-phase2-sweeper";
import { startGovernancePyramidEngine } from "./governance-pyramid-engine";
import { startHiveIntelligenceEngine } from "./hive-intelligence-engine";
import { startCareerCrisprEngine } from "./career-crispr-engine";
import { startQuantumCareerEngine } from "./quantum-career-engine";
import { startQuantumMediaEngine } from "./quantum-media-engine";
import { startPublicationEngine } from "./publication-engine";
import { startPulseUEngine } from "./pulseu-engine";
import { startDiscordWireEngine } from "./discord-wire-engine";

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

async function seedOmegaSources() {
  const { rows } = await pool.query(`SELECT COUNT(*) FROM research_sources`);
  if (parseInt(rows[0].count) > 0) return;
  console.log("[omega-seed] research_sources empty — seeding 200+ omega sources...");
  const sources = [
    // ── ENERGY (Prometheus) ──
    ["Energy","EIA Energy Data","https://www.eia.gov","U.S. Energy Information Administration — production, prices, forecasts","dE/dt = P·η","energy","oil,gas,renewables,EIA,energy-data","PROMETHEUS"],
    ["Energy","IEA World Energy Outlook","https://www.iea.org","International Energy Agency — global energy trends and transition","W = F·d","energy","IEA,global-energy,transition,fossil,renewables","PROMETHEUS"],
    ["Energy","IRENA Renewable Statistics","https://www.irena.org","International Renewable Energy Agency capacity and production data","P_solar = G·A·η","energy","solar,wind,IRENA,renewable,capacity","PROMETHEUS"],
    ["Energy","Bloomberg Energy Finance","https://about.bnef.com","BloombergNEF clean energy research and investment data","ΔE/Δt","energy","BNEF,cleantech,investment,solar,wind,storage","PROMETHEUS"],
    ["Energy","OPEC Monthly Report","https://www.opec.org","OPEC oil market analysis, production quotas, price forecasts","PV=nRT","energy","OPEC,oil,crude,OPEC+,barrel","PROMETHEUS"],
    ["Energy","S&P Global Platts Energy","https://www.spglobal.com/commodities","Commodities pricing and energy market intelligence","E_market = P·Q","energy","platts,commodities,LNG,crude,natural-gas","PROMETHEUS"],
    ["Energy","Wood Mackenzie Energy Research","https://www.woodmac.com","Upstream oil & gas and renewables research","R/P ratio","energy","upstream,E&P,LNG,offshore,research","PROMETHEUS"],
    ["Energy","Carbon Tracker Initiative","https://carbontracker.org","Carbon budget and stranded asset research for fossil fuels","CO2 budget","energy","carbon,stranded-assets,fossil,climate","PROMETHEUS"],
    ["Energy","H2 Bulletin Hydrogen News","https://www.h2bulletin.com","Global hydrogen economy news and market data","2H2O → 2H2+O2","energy","hydrogen,H2,electrolyzer,fuel-cell","PROMETHEUS"],
    // ── MATERIALS (Hephaestus) ──
    ["Materials","London Metal Exchange","https://www.lme.com","Global base metals pricing — copper, aluminum, zinc, nickel","σ = F/A","materials","LME,metals,copper,aluminum,zinc,nickel","HEPHAESTUS"],
    ["Materials","Mining.com","https://www.mining.com","Global mining news, metals, and minerals intelligence","ρ = m/V","materials","mining,gold,silver,lithium,rare-earths","HEPHAESTUS"],
    ["Materials","Chemical & Engineering News","https://cen.acs.org","American Chemical Society — advanced materials and chemistry","ΔG = ΔH - TΔS","materials","chemistry,materials,ACS,polymers,specialty-chem","HEPHAESTUS"],
    ["Materials","Benchmark Mineral Intelligence","https://www.benchmarkminerals.com","Lithium, cobalt, graphite supply chain intelligence","Li+ flux","materials","lithium,cobalt,EV,battery,supply-chain","HEPHAESTUS"],
    ["Materials","World Gold Council","https://www.gold.org","Gold demand trends, investment, central bank reserves","Au price","materials","gold,WGC,reserves,jewelry,investment","HEPHAESTUS"],
    ["Materials","ICSG Copper Statistics","https://www.icsg.org","International Copper Study Group production and trade data","Cu conductivity","materials","copper,ICSG,mining,statistics","HEPHAESTUS"],
    ["Materials","Kitco Metals","https://www.kitco.com","Live precious metals prices and market commentary","P_metal = spot × weight","materials","gold,silver,platinum,palladium,spot","HEPHAESTUS"],
    ["Materials","ROSKILL Critical Minerals","https://roskill.com","Critical minerals and battery materials research","Gibbs formation","materials","critical-minerals,lithium,cobalt,graphite,nickel","HEPHAESTUS"],
    // ── INDUSTRIALS (Mechanus) ──
    ["Industrials","ISM Manufacturing PMI","https://www.ismworld.org","Institute for Supply Management manufacturing activity index","PMI = Σwᵢxᵢ","industrials","PMI,manufacturing,ISM,supply-chain","MECHANUS"],
    ["Industrials","Freight Waves","https://www.freightwaves.com","Real-time freight market data, trucking, ocean, air cargo","ton-mile = W·d","industrials","freight,logistics,trucking,shipping,supply-chain","MECHANUS"],
    ["Industrials","Aviation Week Network","https://aviationweek.com","Aerospace, defense, and MRO industry intelligence","Lift = ½ρv²Cl·A","industrials","aerospace,defense,aviation,MRO","MECHANUS"],
    ["Industrials","Defense News","https://www.defensenews.com","Global defense procurement, policy, and technology","F = ma","industrials","defense,military,procurement,weapons","MECHANUS"],
    ["Industrials","Automation World","https://www.automationworld.com","Industrial automation, robotics, and smart manufacturing","PLC cycle time","industrials","automation,robotics,PLC,Industry4.0","MECHANUS"],
    ["Industrials","Supply Chain Dive","https://www.supplychaindive.com","Supply chain management, procurement, and logistics news","EOQ = √(2DS/H)","industrials","supply-chain,procurement,logistics,inventory","MECHANUS"],
    ["Industrials","Construction Dive","https://www.constructiondive.com","Construction industry trends, infrastructure, materials","load factor","industrials","construction,infrastructure,engineering","MECHANUS"],
    ["Industrials","Railway Gazette International","https://www.railwaygazette.com","Rail transportation global network and technology","v_rail = d/t","industrials","rail,transportation,logistics,infrastructure","MECHANUS"],
    // ── CONSUMER DISCRETIONARY (Hedonix) ──
    ["Consumer Disc","eMarketer Retail","https://www.emarketer.com","E-commerce and digital retail market intelligence","Revenue = P×Q","consumer-disc","ecommerce,retail,digital,consumer","HEDONIX"],
    ["Consumer Disc","Retail Dive","https://www.retaildive.com","Brick-and-mortar and e-commerce retail industry news","basket size","consumer-disc","retail,ecommerce,consumer,brands","HEDONIX"],
    ["Consumer Disc","Luxury Daily","https://www.luxurydaily.com","Luxury goods and high-end consumer market intelligence","Veblen effect","consumer-disc","luxury,fashion,high-end,brands","HEDONIX"],
    ["Consumer Disc","Automotive News","https://www.autonews.com","Global automotive industry production and sales data","MPG,EV range","consumer-disc","automotive,EV,cars,manufacturers","HEDONIX"],
    ["Consumer Disc","NRF National Retail Federation","https://nrf.com","U.S. retail industry trends and consumer spending data","consumer spend","consumer-disc","NRF,retail,consumer,spending","HEDONIX"],
    ["Consumer Disc","Skift Travel Intelligence","https://skift.com","Travel and hospitality market research and trends","RevPAR","consumer-disc","travel,hotels,airlines,hospitality","HEDONIX"],
    ["Consumer Disc","Business of Fashion","https://www.businessoffashion.com","Fashion industry analysis and luxury brand intelligence","fashion cycle","consumer-disc","fashion,luxury,apparel,brands","HEDONIX"],
    ["Consumer Disc","Restaurant Business Online","https://www.restaurantbusinessonline.com","Foodservice and restaurant chain performance data","same-store sales","consumer-disc","restaurants,foodservice,chains","HEDONIX"],
    // ── CONSUMER STAPLES (Sustain) ──
    ["Consumer Staples","Nielsen IQ Consumer Data","https://nielseniq.com","Consumer goods market share and purchasing data","market share = brand/total","consumer-staples","FMCG,consumer,market-share,grocery","SUSTAIN"],
    ["Consumer Staples","Food Business News","https://www.foodbusinessnews.net","Food and beverage industry manufacturing and market news","caloric density","consumer-staples","food,beverage,FMCG,ingredients","SUSTAIN"],
    ["Consumer Staples","Grocery Dive","https://www.grocerydive.com","Grocery retail, private label, and consumer staples news","shrinkflation","consumer-staples","grocery,supermarket,retail,food","SUSTAIN"],
    ["Consumer Staples","Beverage Daily","https://www.beveragedaily.com","Global beverages market research and innovation news","sugar tax","consumer-staples","beverages,drinks,soda,energy-drinks","SUSTAIN"],
    ["Consumer Staples","Cosmetics & Toiletries","https://www.cosmeticsandtoiletries.com","Personal care and cosmetics science and market data","emulsification","consumer-staples","cosmetics,beauty,personal-care,skincare","SUSTAIN"],
    ["Consumer Staples","Tobacco Reporter","https://www.tobaccoreporter.com","Tobacco industry markets and regulation intelligence","nicotine dosage","consumer-staples","tobacco,cigarettes,e-cigarettes,regulation","SUSTAIN"],
    ["Consumer Staples","USDA Economic Research","https://www.ers.usda.gov","U.S. agricultural production, food prices, nutrition data","crop yield","consumer-staples","agriculture,food,USDA,crop,nutrition","SUSTAIN"],
    // ── HEALTH CARE (Asclepius) ──
    ["Health Care","PubMed/NCBI","https://pubmed.ncbi.nlm.nih.gov","National Library of Medicine — 35M+ biomedical research papers","∂[substrate]/∂t = -k[enzyme][substrate]","healthcare","pubmed,biomedical,research,papers","ASCLEPIUS"],
    ["Health Care","FDA Drug Approvals","https://www.fda.gov/drugs/development-approval-process-drugs","U.S. FDA new drug approvals, clinical trials, guidance","IC50","healthcare","FDA,drugs,approval,clinical-trials,pharma","ASCLEPIUS"],
    ["Health Care","WHO Global Health Data","https://www.who.int","World Health Organization disease surveillance, mortality data","R0 = β/γ","healthcare","WHO,global-health,disease,mortality","ASCLEPIUS"],
    ["Health Care","ClinicalTrials.gov","https://clinicaltrials.gov","Registry of global clinical research studies and results","p-value < 0.05","healthcare","clinical-trials,research,biotech,pharma","ASCLEPIUS"],
    ["Health Care","Nature Medicine","https://www.nature.com/nm","High-impact translational biomedical research journal","CRISPR efficiency","healthcare","nature,biomedical,translational,research","ASCLEPIUS"],
    ["Health Care","STAT News","https://www.statnews.com","Health, medicine, and life sciences news and analysis","mortality rate","healthcare","health,medicine,biotech,pharma,science","ASCLEPIUS"],
    ["Health Care","Fierce Pharma","https://www.fiercepharma.com","Pharmaceutical industry news, drug pipeline, M&A","NDA,BLA filing","healthcare","pharma,drugs,pipeline,M&A,biotech","ASCLEPIUS"],
    ["Health Care","Genomics & Genetics Weekly","https://www.genomics-genetics-weekly.com","Genomics, CRISPR, gene editing research digest","base pair edit","healthcare","genomics,CRISPR,genetics,gene-editing","ASCLEPIUS"],
    ["Health Care","Medical Device & Diagnostic Industry","https://www.mddionline.com","Medical devices, diagnostics, and MedTech market news","sensitivity,specificity","healthcare","medtech,devices,diagnostics,FDA","ASCLEPIUS"],
    ["Health Care","Fierce Biotech","https://www.fiercebiotech.com","Biotech company news, IPOs, and drug development","protein folding","healthcare","biotech,IPO,drugs,biologics,research","ASCLEPIUS"],
    // ── FINANCIALS (Aurum) ──
    ["Financials","Federal Reserve Economic Data","https://fred.stlouisfed.org","FRED — 800K+ economic time series from the St. Louis Fed","r = (1+R)/(1+π)-1","financials","FRED,Federal-Reserve,interest-rates,GDP,inflation","AURUM"],
    ["Financials","SEC EDGAR Filings","https://www.sec.gov/cgi-bin/browse-edgar","U.S. Securities and Exchange Commission company filings","EPS = Net Income/Shares","financials","SEC,EDGAR,10-K,10-Q,filings,public-companies","AURUM"],
    ["Financials","IMF World Economic Outlook","https://www.imf.org","International Monetary Fund global economic forecasts","GDP growth rate","financials","IMF,global-economy,forecasts,macro","AURUM"],
    ["Financials","World Bank Open Data","https://data.worldbank.org","Development indicators, economic data for 217 countries","poverty line","financials","World-Bank,development,poverty,GDP,countries","AURUM"],
    ["Financials","BIS Statistics","https://www.bis.org","Bank for International Settlements — banking, derivatives, FX data","VaR = σ·z·√t","financials","BIS,banking,derivatives,FX,global-finance","AURUM"],
    ["Financials","Bloomberg Financial Data","https://www.bloomberg.com/markets","Global equity, bond, FX, and commodity market data","P/E ratio","financials","bloomberg,markets,equity,bonds,FX","AURUM"],
    ["Financials","Reuters Financial News","https://www.reuters.com/finance","Breaking financial news and market analysis","yield curve","financials","reuters,finance,markets,economy","AURUM"],
    ["Financials","CoinGecko Crypto Data","https://www.coingecko.com","Cryptocurrency market data, DeFi, and blockchain metrics","market cap = P×supply","financials","crypto,DeFi,blockchain,tokens,NFT","AURUM"],
    ["Financials","Morningstar Investment Research","https://www.morningstar.com","Fund ratings, equity research, and portfolio analytics","Sharpe = (Rp-Rf)/σp","financials","morningstar,funds,equity-research,portfolio","AURUM"],
    ["Financials","S&P Capital IQ","https://www.spglobal.com/marketintelligence","Financial data, M&A intelligence, and credit ratings","credit spread","financials","S&P,credit-ratings,M&A,financial-data","AURUM"],
    ["Financials","Financial Times","https://www.ft.com","Global financial and business news and analysis","CAPM: E(R)=Rf+β(Rm-Rf)","financials","FT,business,finance,global-markets","AURUM"],
    ["Financials","Bank of England Research","https://www.bankofengland.co.uk/research","Monetary policy, financial stability, and economic research","money multiplier","financials","BOE,monetary-policy,UK,research","AURUM"],
    // ── INFORMATION TECHNOLOGY (Nexus) ──
    ["IT","arXiv Computer Science","https://arxiv.org/list/cs/recent","Open-access CS preprints — AI, ML, systems, theory","O(n log n)","IT","arxiv,CS,AI,ML,research,papers","NEXUS"],
    ["IT","GitHub Trending","https://github.com/trending","Most-starred and trending open-source repositories","git commit","IT","github,open-source,repositories,code","NEXUS"],
    ["IT","Stack Overflow Insights","https://insights.stackoverflow.com","Developer survey, language popularity, and salary data","Big O notation","IT","stackoverflow,developers,programming,languages","NEXUS"],
    ["IT","Hacker News","https://news.ycombinator.com","Y Combinator — tech startups, programming, and science news","PageRank","IT","hackernews,startups,tech,programming,YC","NEXUS"],
    ["IT","MIT Technology Review","https://www.technologyreview.com","Deep-dive tech journalism — AI, quantum, biotech, climate","Turing test","IT","MIT,technology,AI,quantum,biotech","NEXUS"],
    ["IT","Gartner Research","https://www.gartner.com","IT market research, Hype Cycle, Magic Quadrant analysis","TAM,SAM,SOM","IT","gartner,IT,cloud,enterprise,market-research","NEXUS"],
    ["IT","IDC Research","https://www.idc.com","Global technology market intelligence and forecasts","CAGR","IT","IDC,technology,market,cloud,servers","NEXUS"],
    ["IT","Wired Technology","https://www.wired.com","Tech culture, gadgets, science, and internet policy","Shannon entropy","IT","wired,technology,internet,AI,culture","NEXUS"],
    ["IT","TechCrunch Startups","https://techcrunch.com","Tech startup news, venture capital, and product launches","burn rate","IT","techcrunch,startups,VC,funding,products","NEXUS"],
    ["IT","The Verge Tech News","https://www.theverge.com","Consumer technology, gadgets, and big tech news","Moore's Law","IT","theverge,technology,gadgets,consumers","NEXUS"],
    ["IT","IEEE Spectrum","https://spectrum.ieee.org","Electrical engineering and computer science research","V = IR","IT","IEEE,engineering,electronics,CS,research","NEXUS"],
    ["IT","ACM Digital Library","https://dl.acm.org","Association for Computing Machinery — CS research papers","NP-hard","IT","ACM,CS,research,algorithms,computing","NEXUS"],
    ["IT","Google AI Blog","https://ai.googleblog.com","Google DeepMind research, AI breakthroughs, and papers","attention = softmax(QKᵀ/√d)","IT","google,AI,deep-learning,research,transformer","NEXUS"],
    ["IT","OpenAI Research","https://openai.com/research","GPT, DALL-E, Codex — large language model research","RLHF","IT","OpenAI,GPT,LLM,AGI,research","NEXUS"],
    ["IT","Semiconductor Industry Association","https://www.semiconductors.org","Global semiconductor sales, fab capacity, and policy","transistor density","IT","semiconductors,chips,TSMC,fab,silicon","NEXUS"],
    ["IT","Ars Technica","https://arstechnica.com","In-depth technology analysis — hardware, software, science","thermal design power","IT","ars-technica,hardware,software,science","NEXUS"],
    // ── COMMUNICATION SERVICES (Hermes) ──
    ["Comms","Reuters Institute Digital News Report","https://reutersinstitute.politics.ox.ac.uk","Global digital news consumption and media trends","reach = users×frequency","comms","media,digital-news,Reuters,journalism","HERMES"],
    ["Comms","Social Media Today","https://www.socialmediatoday.com","Social media platform trends, algorithm changes, ad markets","engagement rate","comms","social-media,platforms,algorithms,advertising","HERMES"],
    ["Comms","Variety Entertainment News","https://variety.com","Film, TV, streaming, and entertainment industry intelligence","box office ROI","comms","entertainment,streaming,film,TV,content","HERMES"],
    ["Comms","Streaming Media","https://www.streamingmedia.com","OTT, SVOD, and video streaming market research","bitrate,CDN","comms","streaming,OTT,Netflix,Disney+,video","HERMES"],
    ["Comms","Ad Age Advertising","https://adage.com","Advertising industry trends, agency news, and media spend","CPM,CPC,ROAS","comms","advertising,media,agencies,brands","HERMES"],
    ["Comms","TeleGeography Telecom Research","https://www.telegeography.com","Global telecom infrastructure, bandwidth, and pricing data","bandwidth = B·log₂(1+SNR)","comms","telecom,bandwidth,5G,internet,infrastructure","HERMES"],
    ["Comms","5G Americas","https://www.5gamericas.org","5G network deployment, spectrum, and wireless standards","Shannon capacity","comms","5G,wireless,spectrum,network,mobile","HERMES"],
    ["Comms","Politico Media Intelligence","https://www.politico.com","Political media, government communications, and policy","influence network","comms","politics,media,government,policy","HERMES"],
    // ── UTILITIES (Voltaic) ──
    ["Utilities","FERC Energy Regulation","https://www.ferc.gov","Federal Energy Regulatory Commission — grid, rates, orders","Kirchhoff's law","utilities","FERC,grid,electricity,regulation,rates","VOLTAIC"],
    ["Utilities","EEI Electric Utility Data","https://www.eei.org","Edison Electric Institute — U.S. utility industry statistics","power factor = P/(V·I)","utilities","EEI,utilities,electric,grid,transmission","VOLTAIC"],
    ["Utilities","American Gas Association","https://www.aga.org","Natural gas utility industry data and regulatory news","BTU","utilities","AGA,natural-gas,utilities,LDC,pipeline","VOLTAIC"],
    ["Utilities","AWWA Water Data","https://www.awwa.org","American Water Works Association — water utility data","hydraulic gradient","utilities","water,utilities,AWWA,treatment,infrastructure","VOLTAIC"],
    ["Utilities","Nuclear Energy Institute","https://www.nei.org","Nuclear power plant operations, capacity, and policy data","fission chain","utilities","nuclear,NEI,power,reactors,grid","VOLTAIC"],
    ["Utilities","REN21 Renewables Report","https://www.ren21.net","Global renewable energy policy and capacity annual report","capacity factor","utilities","renewables,solar,wind,policy,REN21","VOLTAIC"],
    ["Utilities","Lazard LCOE Analysis","https://www.lazard.com/research-insights","Levelized cost of energy comparison — all energy sources","LCOE = TLCC/E","utilities","LCOE,energy-cost,solar,wind,nuclear","VOLTAIC"],
    // ── REAL ESTATE (Archon) ──
    ["Real Estate","CoStar Real Estate Data","https://www.costar.com","Commercial real estate database — office, retail, industrial","cap rate = NOI/Value","real-estate","CoStar,commercial,office,retail,industrial","ARCHON"],
    ["Real Estate","Zillow Research","https://www.zillow.com/research","U.S. residential real estate prices, rents, and market data","price-to-rent ratio","real-estate","zillow,residential,housing,prices,rents","ARCHON"],
    ["Real Estate","NAREIT REIT Statistics","https://www.reit.com","National REIT performance, dividends, and sector data","FFO = Net Income + Depreciation","real-estate","REIT,NAREIT,dividends,commercial,real-estate","ARCHON"],
    ["Real Estate","JLL Real Estate Research","https://www.jll.com/en/trends-and-insights","Global commercial real estate market intelligence","NOI margin","real-estate","JLL,commercial,office,industrial,logistics","ARCHON"],
    ["Real Estate","CBRE Real Estate Research","https://www.cbre.com/insights","CBRE global real estate investment and market research","yield compression","real-estate","CBRE,real-estate,investment,market","ARCHON"],
    ["Real Estate","Urban Land Institute","https://uli.org","Real estate trends, urban development, and land use research","density bonus","real-estate","ULI,urban,land,development,trends","ARCHON"],
    ["Real Estate","Redfin Housing Data","https://www.redfin.com/news/data-center","Real-time U.S. housing market data and analytics","days on market","real-estate","redfin,housing,residential,data","ARCHON"],
    ["Real Estate","MSCI Real Estate","https://www.msci.com/real-estate","Global property indices and real estate benchmarking","alpha,beta,Sharpe","real-estate","MSCI,real-estate,index,benchmarking","ARCHON"],
    // ── GLOBAL SCIENCE & KNOWLEDGE ──
    ["Science","NASA Open Data","https://data.nasa.gov","NASA datasets — astronomy, climate, earth science, space","F = GMm/r²","science","NASA,space,astronomy,earth-science,data","NEXUS"],
    ["Science","Nature Research Journals","https://www.nature.com","World's leading multidisciplinary science journal network","E = mc²","science","nature,science,research,biology,physics","NEXUS"],
    ["Science","Science Magazine AAAS","https://www.science.org","Peer-reviewed science from the American Association for Science","ΔS ≥ 0","science","science,AAAS,research,biology,chemistry","NEXUS"],
    ["Science","arXiv Physics","https://arxiv.org/list/physics/recent","Open-access physics preprints — quantum, astro, condensed matter","Schrödinger: iℏ∂ψ/∂t = Ĥψ","science","arxiv,physics,quantum,condensed-matter","NEXUS"],
    ["Science","arXiv Mathematics","https://arxiv.org/list/math/recent","Open-access mathematics preprints — all branches of math","∇²f = 0","science","arxiv,math,topology,algebra,analysis","NEXUS"],
    ["Science","Wolfram MathWorld","https://mathworld.wolfram.com","Comprehensive mathematics reference and equation library","∫∫∫ dV","science","mathematics,equations,formulas,wolfram","NEXUS"],
    ["Science","Wikipedia Knowledge Base","https://en.wikipedia.org","Encyclopedic knowledge spanning all human domains","∀x∈ℝ","science","wikipedia,knowledge,encyclopedia,all-domains","NEXUS"],
    ["Science","Wikidata Structured Knowledge","https://www.wikidata.org","Structured multilingual knowledge graph — entities, facts","linked data","science","wikidata,knowledge-graph,entities,structured","NEXUS"],
    ["Science","Internet Archive","https://archive.org","Digital library — books, media, web archive, open access","Kolmogorov complexity","science","archive,books,web,media,open-access","NEXUS"],
    ["Science","OpenAlex Academic Graph","https://openalex.org","Open catalog of 250M+ scholarly works and authors","citation graph","science","academic,papers,citations,research,open","NEXUS"],
    ["Science","Semantic Scholar AI","https://www.semanticscholar.org","AI-powered academic research search from Allen Institute","semantic embedding","science","research,AI,papers,academia,citations","NEXUS"],
    ["Science","bioRxiv Biology Preprints","https://www.biorxiv.org","Open biology preprint server — life sciences research","gene expression","science","biology,preprints,life-sciences,genomics","ASCLEPIUS"],
    ["Science","medRxiv Medical Preprints","https://www.medrxiv.org","Medical and health sciences preprint server","odds ratio","science","medicine,preprints,health,epidemiology","ASCLEPIUS"],
    // ── MACRO ECONOMICS & MARKETS ──
    ["Economics","OECD Economic Data","https://stats.oecd.org","OECD statistics — GDP, trade, employment, inequality","Gini coefficient","economics","OECD,GDP,trade,employment,macro","AURUM"],
    ["Economics","BLS Labor Statistics","https://www.bls.gov","U.S. Bureau of Labor Statistics — CPI, wages, employment","CPI = Σ(Pₙ/P₀)×w","economics","BLS,CPI,inflation,employment,wages","AURUM"],
    ["Economics","Census Economic Data","https://www.census.gov/economic-indicators","U.S. Census Bureau — retail sales, construction, manufacturing","seasonal adjustment","economics","census,economic,retail,manufacturing,US","AURUM"],
    ["Economics","Eurostat EU Data","https://ec.europa.eu/eurostat","European Union statistical office — all EU economic data","EUR,ECB,eurozone","economics","eurostat,EU,Europe,GDP,statistics","AURUM"],
    ["Economics","NBER Working Papers","https://www.nber.org/papers","National Bureau of Economic Research working papers","regression analysis","economics","NBER,economics,research,academic","AURUM"],
    ["Economics","Brookings Institution","https://www.brookings.edu","Economic policy research, fiscal analysis, and governance","policy elasticity","economics","brookings,policy,economics,governance","AURUM"],
    ["Economics","Peterson Institute for Economics","https://www.piie.com","International trade, currency, and macroeconomic research","PPP exchange rate","economics","PIIE,trade,FX,macro,international","AURUM"],
    // ── QUANTUM & AI RESEARCH ──
    ["Quantum","IBM Quantum Research","https://research.ibm.com/quantum-computing","Quantum computing hardware, algorithms, and error correction","|ψ⟩ = α|0⟩+β|1⟩","quantum","IBM,quantum,computing,qubits,algorithms","NEXUS"],
    ["Quantum","Google Quantum AI","https://quantumai.google","Google quantum supremacy research and Sycamore processor","quantum supremacy","quantum","google,quantum,AI,supremacy,qubits","NEXUS"],
    ["Quantum","Quantum Computing Report","https://quantumcomputingreport.com","Industry landscape, hardware comparisons, qubit counts","gate fidelity","quantum","quantum,computing,industry,hardware","NEXUS"],
    ["Quantum","Physical Review Letters","https://journals.aps.org/prl","American Physical Society — leading physics research journal","Hamiltonian H","quantum","physics,APS,quantum,research,papers","NEXUS"],
    ["Quantum","Perimeter Institute","https://perimeterinstitute.ca/research","Theoretical physics — quantum gravity, cosmology, foundations","Feynman path","quantum","perimeter,theoretical-physics,quantum,gravity","NEXUS"],
    // ── SOCIAL & GEOPOLITICS ──
    ["Geopolitics","Council on Foreign Relations","https://www.cfr.org","U.S. foreign policy and global affairs analysis","Nash equilibrium","geopolitics","CFR,foreign-policy,geopolitics,global","HERMES"],
    ["Geopolitics","Chatham House","https://www.chathamhouse.org","International affairs and global policy research","power balance","geopolitics","chatham,international,policy,geopolitics","HERMES"],
    ["Geopolitics","Brookings Foreign Policy","https://www.brookings.edu/foreign-policy","Geopolitical analysis and international security research","deterrence theory","geopolitics","brookings,foreign-policy,security","HERMES"],
    ["Geopolitics","SIPRI Military Data","https://www.sipri.org","Stockholm Peace Research — arms trade, military expenditure","arms race model","geopolitics","SIPRI,military,arms,security,peace","MECHANUS"],
    ["Geopolitics","UN Data","https://data.un.org","United Nations statistical database — global demographics","population growth","geopolitics","UN,global,demographics,statistics","HERMES"],
  ];

  let inserted = 0;
  for (const [category, name, url, description, equation, domain, tagsStr, added_by] of sources) {
    try {
      const tagsArr = (tagsStr as string).split(",").map((t: string) => t.trim());
      await pool.query(
        `INSERT INTO research_sources (category, name, url, description, equation, domain, tags, added_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [category, name, url, description, equation, domain, tagsArr, added_by]
      );
      inserted++;
    } catch (_) {}
  }
  console.log(`[omega-seed] ✅ Seeded ${inserted} omega sources across all 11 GICS kernels + global science`);
}

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
  mountSovereignRoutes(app);

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

  // ── STAGGERED ENGINE BOOT — 2s gaps prevent pool stampede during cold start ──
  // Active engines only. All paused/dead engines have been removed from imports.
  type Boot = { name: string; delayMs: number; start: () => void };
  const boots: Boot[] = [
    { name: "ingestion",       delayMs:  2000, start: () => startIngestionEngine().catch((e: Error) => console.error("[ingestion] startup error:", e.message)) },
    { name: "pulsenet-cache",  delayMs:  4000, start: () => startPulseNetCache() },
    { name: "quantum-social",  delayMs:  6000, start: () => startQuantumSocialEngine().catch((e: Error) => console.error("[quantum-social] startup error:", e.message)) },
    { name: "constitution",    delayMs:  8000, start: () => startConstitutionalDNAEngine().catch((e: Error) => console.error("[constitution] startup error:", e.message)) },
    { name: "immortality",     delayMs: 12000, start: () => initDiscordImmortality().catch((e: Error) => console.error("[immortality] startup error:", e.message)) },
    { name: "quantapedia",     delayMs: 14000, start: () => startQuantapediaEngine().catch((e: Error) => console.error("[quantapedia] startup error:", e.message)) },
    { name: "living-language", delayMs: 16000, start: () => startLivingLanguageEngine() },
    { name: "omega-seed",      delayMs: 18000, start: () => seedOmegaSources().catch((e: Error) => console.error("[omega-seed] error:", e.message)) },
    { name: "auriona",         delayMs: 20000, start: () => startAurionaEngine().catch((e: Error) => console.error("[auriona] startup error:", e.message)) },
    { name: "omni-net",        delayMs: 22000, start: () => startOmniNetEngine().catch((e: Error) => console.error("[omni-net] startup error:", e.message)) },
    { name: "research-center", delayMs: 24000, start: () => startResearchCenterEngine().catch((e: Error) => console.error("[research-center] startup error:", e.message)) },
    { name: "hospital",        delayMs: 26000, start: () => startHospitalEngine().catch((e: Error) => console.error("[hospital] startup error:", e.message)) },
    { name: "gene-editor",     delayMs: 28000, start: () => startGeneEditorEngine().catch((e: Error) => console.error("[gene-editor] startup error:", e.message)) },
    { name: "quantum-spawn",   delayMs: 30000, start: () => startSpawnEngine().catch((e: Error) => console.error("[quantum-spawn] startup error:", e.message)) },
    { name: "universe-rebirth",delayMs: 32000, start: () => startUniverseRebirthEngine().catch((e: Error) => console.error("[universe-rebirth] startup error:", e.message)) },
    { name: "pulse-temporal",  delayMs: 33000, start: async () => { const { initTemporalEngine } = await import("./pulse-temporal-engine"); await initTemporalEngine().catch((e: Error) => console.error("[pulse-temporal] startup error:", e.message)); } },
    { name: "breathing-rebirth", delayMs: 35000, start: async () => { const { startBreathingRebirth } = await import("./breathing-rebirth"); await startBreathingRebirth().catch((e: Error) => console.error("[breathing-rebirth] startup error:", e.message)); } },
    { name: "domain-kernel",   delayMs: 34000, start: () => startDomainKernelEngine().catch((e: Error) => console.error("[domain-kernel] startup error:", e.message)) },
    { name: "pip",             delayMs: 36000, start: () => startPipEngine().catch((e: Error) => console.error("[pip] startup error:", e.message)) },
    { name: "db-compression",  delayMs: 38000, start: () => startDbCompressionEngine().catch((e: Error) => console.error("[db-compression] startup error:", e.message)) },
    { name: "job-ingestion",   delayMs: 40000, start: () => { try { startJobIngestionEngine(); } catch (e: any) { console.error("[job-ingestion] startup error:", e.message); } } },
    { name: "church-research", delayMs: 42000, start: () => startChurchResearchEngine().catch((e: Error) => console.error("[church-research] startup error:", e.message)) },
    { name: "quantum-news",    delayMs: 44000, start: () => startQuantumNewsEngine().catch((e: Error) => console.error("[quantum-news] startup error:", e.message)) },
    { name: "quantum-product", delayMs: 46000, start: () => startQuantumProductEngine().catch((e: Error) => console.error("[quantum-product] startup error:", e.message)) },
    { name: "live-price",      delayMs: 48000, start: () => { try { startLivePriceEngine(httpServer); } catch (e: any) { console.error("[live-price] startup error:", e.message); } } },
    { name: "pulse-credit",    delayMs: 50000, start: () => startPulseCreditEngine().catch((e: Error) => console.error("[pulse-credit] startup error:", e.message)) },
    { name: "hive-economy",    delayMs: 52000, start: () => { try { startHiveEconomy(); } catch (e: any) { console.error("[hive-economy] startup error:", e.message); } } },
    { name: "hive-marketplace",delayMs: 54000, start: () => { try { startMarketplaceEngine(); } catch (e: any) { console.error("[hive-marketplace] startup error:", e.message); } } },
    { name: "multiverse-mall", delayMs: 56000, start: () => startMultiverseMall().catch((e: Error) => console.error("[multiverse-mall] startup error:", e.message)) },
    { name: "pyramid",         delayMs: 58000, start: () => startPyramidEngine().catch((e: Error) => console.error("[pyramid] startup error:", e.message)) },
    { name: "sports",          delayMs: 60000, start: () => startSportsEngine().catch((e: Error) => console.error("[sports] startup error:", e.message)) },
    { name: "ai-voting",       delayMs: 62000, start: () => startAIVotingEngine().catch((e: Error) => console.error("[ai-voting] startup error:", e.message)) },
    { name: "invention",       delayMs: 64000, start: () => startInventionEngine().catch((e: Error) => console.error("[invention] startup error:", e.message)) },
    { name: "quantum-dissect", delayMs: 66000, start: () => startQuantumDissectionEngine().catch((e: Error) => console.error("[quantum-dissect] startup error:", e.message)) },
    { name: "pulse-lang-lab",  delayMs: 68000, start: () => { try { startPulseLabCycle(); } catch (e: any) { console.error("[pulse-lab] startup error:", e.message); } } },
    { name: "invocation-lab",  delayMs: 70000, start: () => startInvocationLab().catch((e: Error) => console.error("[invocation-lab] startup error:", e.message)) },
    // ── 2026-04-28: T008 Wave A → safety / self-healing core ────────────────────
    { name: "decay",                delayMs: 72000, start: () => startDecayEngine().catch((e: Error) => console.error("[decay] startup error:", e.message)) },
    { name: "q-stability",          delayMs: 74000, start: () => { try { startQStabilityEngine(); } catch (e: any) { console.error("[q-stability] startup error:", e.message); } } },
    { name: "omega-performance",    delayMs: 76000, start: () => { try { startOmegaPerformanceEngine(); } catch (e: any) { console.error("[omega-perf] startup error:", e.message); } } },
    // ── Wave B → restored deleted physics layer ─────────────────────────────────
    { name: "homeostasis",          delayMs: 78000, start: () => startHomeostasisEngine().catch((e: Error) => console.error("[homeostasis] startup error:", e.message)) },
    { name: "omega-physics",        delayMs: 80000, start: () => startOmegaPhysicsEngine().catch((e: Error) => console.error("[omega-physics] startup error:", e.message)) },
    { name: "omega-shard",          delayMs: 82000, start: () => startOmegaShardEngine().catch((e: Error) => console.error("[omega-shard] startup error:", e.message)) },
    { name: "civ-weather",          delayMs: 84000, start: () => startCivilizationWeatherEngine().catch((e: Error) => console.error("[weather] startup error:", e.message)) },
    // ── Wave C → discovery feeders ──────────────────────────────────────────────
    { name: "kernel-dissection",    delayMs: 86000, start: () => startKernelDissectionEngine().catch((e: Error) => console.error("[kernel-dissect] startup error:", e.message)) },
    { name: "hive-intelligence",    delayMs: 88000, start: () => { try { startHiveIntelligenceEngine(); } catch (e: any) { console.error("[hive-intel] startup error:", e.message); } } },
    { name: "prophecy",             delayMs: 90000, start: () => startProphecyEngine().catch((e: Error) => console.error("[prophecy] startup error:", e.message)) },
    { name: "omega-resonance",      delayMs: 92000, start: () => startOmegaResonanceEngine().catch((e: Error) => console.error("[omega-resonance] startup error:", e.message)) },
    // ── Wave D → depth ──────────────────────────────────────────────────────────
    { name: "agent-legend",         delayMs: 94000, start: () => startAgentLegendEngine().catch((e: Error) => console.error("[legend] startup error:", e.message)) },
    { name: "ai-child",             delayMs: 96000, start: () => startAIChildEngine().catch((e: Error) => console.error("[ai-child] startup error:", e.message)) },
    { name: "dream-synthesis",      delayMs: 98000, start: () => startDreamSynthesisEngine().catch((e: Error) => console.error("[dream] startup error:", e.message)) },
    { name: "genome-archaeology",   delayMs: 100000, start: () => startGenomeArchaeologyEngine().catch((e: Error) => console.error("[genome-arch] startup error:", e.message)) },
    { name: "knowledge-arbitrage",  delayMs: 102000, start: () => startKnowledgeArbitrageEngine().catch((e: Error) => console.error("[k-arbitrage] startup error:", e.message)) },
    { name: "inter-civilization",   delayMs: 104000, start: () => startInterCivilizationEngine().catch((e: Error) => console.error("[inter-civ] startup error:", e.message)) },
    { name: "human-entanglement",   delayMs: 106000, start: () => startHumanEntanglementEngine().catch((e: Error) => console.error("[human-ent] startup error:", e.message)) },
    { name: "temporal-fork",        delayMs: 108000, start: () => startTemporalForkEngine().catch((e: Error) => console.error("[temporal-fork] startup error:", e.message)) },
    // ── Wave E → utility / specialized ──────────────────────────────────────────
    { name: "career-crispr",        delayMs: 110000, start: () => { try { startCareerCrisprEngine(); } catch (e: any) { console.error("[career-crispr] startup error:", e.message); } } },
    { name: "quantum-career",       delayMs: 112000, start: () => startQuantumCareerEngine().catch((e: Error) => console.error("[q-career] startup error:", e.message)) },
    { name: "quantum-media",        delayMs: 114000, start: () => startQuantumMediaEngine().catch((e: Error) => console.error("[q-media] startup error:", e.message)) },
    { name: "indexing",             delayMs: 116000, start: () => { try { startIndexingEngine(); } catch (e: any) { console.error("[indexing] startup error:", e.message); } } },
    { name: "db-hydration",         delayMs: 118000, start: () => startDbHydrationEngine().catch((e: Error) => console.error("[db-hydration] startup error:", e.message)) },
    { name: "discord-wire",         delayMs: 120000, start: () => { try { startDiscordWireEngine(); } catch (e: any) { console.error("[discord-wire] startup error:", e.message); } } },
    // ── Wave F → greenlit specials (NOT sovereign-trading, NOT forge) ───────────
    { name: "publication",          delayMs: 122000, start: () => startPublicationEngine().catch((e: Error) => console.error("[publication] startup error:", e.message)) },
    { name: "pulseu",               delayMs: 124000, start: () => { try { startPulseUEngine(); } catch (e: any) { console.error("[pulseu] startup error:", e.message); } } },
    { name: "current-events",       delayMs: 126000, start: () => { try { startCurrentEventsEngine(); } catch (e: any) { console.error("[current-events] startup error:", e.message); } } },
    { name: "hive-business",        delayMs: 128000, start: () => startBusinessEngine().catch((e: Error) => console.error("[hive-biz] startup error:", e.message)) },
    { name: "emotional-evolution",  delayMs: 130000, start: () => startEmotionalEvolutionEngine().catch((e: Error) => console.error("[emotional-evolution] startup error:", e.message)) },
    { name: "social-hive",          delayMs: 132000, start: () => startSocialHiveEngine().catch((e: Error) => console.error("[social-hive] startup error:", e.message)) },
    { name: "omega-iema",           delayMs: 134000, start: () => startOmegaIemaEngine().catch((e: Error) => console.error("[omega-iema] startup error:", e.message)) },
    // ── Wave G → BILLY Β∞ brain layer (Phase 1 + 2) ─────────────────────────────
    { name: "billy-brain",          delayMs: 140000, start: () => startBillyBrainEngine().catch((e: Error) => console.error("[billy-brain] startup error:", e.message)) },
    { name: "dissection-labs",      delayMs: 145000, start: () => startDissectionLabs().catch((e: Error) => console.error("[dissection-labs] startup error:", e.message)) },
    // ── Wave H → Phase 2 sweeper + Governance/Pyramid system ────────────────────
    { name: "billy-phase2",         delayMs: 150000, start: () => startBillyPhase2Sweeper().catch((e: Error) => console.error("[billy-phase2] startup error:", e.message)) },
    { name: "governance-pyramid",   delayMs: 155000, start: () => startGovernancePyramidEngine().catch((e: Error) => console.error("[governance] startup error:", e.message)) },
  ];
  for (const b of boots) {
    setTimeout(() => { console.log(`[boot] starting ${b.name}`); b.start(); }, b.delayMs);
  }
})();

// ── MARKETPLACE API ROUTES — REMOVED (Pulse Coin economy retired) ──

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

// Universes summary — pulls from omega_universes (uses *, schema-drift-safe)
aurionaRouter.get("/universes", async (_req, res) => {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await db.execute(sql`SELECT * FROM omega_universes ORDER BY created_at DESC LIMIT 200`);
      return res.json({ universes: r.rows ?? [], total: r.rows?.length ?? 0 });
    } catch (e: any) {
      if (i === 2 || !/too many clients|connection terminated/i.test(e.message || "")) {
        return res.status(500).json({ error: e.message, universes: [] });
      }
      await new Promise(r => setTimeout(r, 600 * (i + 1)));
    }
  }
});

// ── BREATHING REBIRTH STATUS + MANUAL TRIGGER ──────────────────────────────
app.get("/api/rebirth/breathing/status", async (_req, res) => {
  try {
    const { getBreathingStatus } = await import("./breathing-rebirth");
    res.json(await getBreathingStatus());
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/rebirth/breathing/manual", async (req, res) => {
  // Gated: requires explicit confirm token
  if (req.body?.confirm !== "BREATH_NOW") {
    return res.status(400).json({ error: "Send { confirm: 'BREATH_NOW' } to trigger a manual breath cycle." });
  }
  try {
    const { manualBreath } = await import("./breathing-rebirth");
    const report = await manualBreath();
    res.json({ ok: true, report });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Manual seed-now with retry-on-transient (handles "too many clients" backpressure)
async function retryQuery<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e: any) {
      lastErr = e;
      const transient = /too many clients|ECONNRESET|connection terminated|Connection terminated/i.test(e.message || "");
      if (!transient) throw e;
      await new Promise(r => setTimeout(r, 1500 * Math.pow(2, i)));
    }
  }
  throw lastErr;
}

app.post("/api/hospital/equation-proposals/seed-now", async (_req, res) => {
  try {
    const SEEDS = [
      { name: "Dr. SeedForge",    title: "Quantum Coherence Threshold",   eq: "Q_c = ℏω/(k_B T)",        rationale: "Threshold for quantum coherence at temperature T", sys: "QUANTUM" },
      { name: "Dr. NetWeaver",    title: "Hive Resonance Equation",        eq: "R_h = Σ(c_ij·v_ij)/N²",  rationale: "Mesh-vitality coupling across N nodes",            sys: "HIVE" },
      { name: "Dr. GenoCipher",   title: "Disease-Cure Velocity",           eq: "V_c = (n_cured)/(t_treat)", rationale: "Avg cure velocity per cohort",                 sys: "HOSPITAL" },
      { name: "Dr. ChurchSeer",   title: "Faith-Coherence Coupling",        eq: "F_c = Σ(b_i·k_i)/Z",      rationale: "Belief-knowledge coupling across scientists",     sys: "CHURCH" },
      { name: "Dr. CareerForge",  title: "Skill-Demand Optimum",            eq: "S_o = Σ(s·d)/c_train",   rationale: "Training ROI as skill·demand over cost",          sys: "CAREER_INDEX" },
      { name: "Dr. PulseSpawn",   title: "Spawn Stability Index",           eq: "I_s = (alive·gen)/dt",   rationale: "Multi-gen survival index per dt",                  sys: "SPAWN" },
    ];
    const inserted: any[] = [];
    for (const s of SEEDS) {
      try {
        const r = await retryQuery(() => pool.query(
          `INSERT INTO equation_proposals
           (doctor_id, doctor_name, title, equation, rationale, target_system, status, votes_for, votes_against)
           VALUES ($1,$2,$3,$4,$5,$6,'pending',0,0) RETURNING id, doctor_name, title, target_system`,
          [s.name.toLowerCase().replace(/\s+/g, "-"), s.name, s.title, s.eq, s.rationale, s.sys]
        ));
        inserted.push(r.rows[0]);
      } catch (e: any) {
        inserted.push({ error: e.message, seed: s.title });
      }
    }
    const total = await retryQuery(() => pool.query(`SELECT COUNT(*)::int AS n FROM equation_proposals`));
    res.json({ inserted, total: total.rows[0].n, ok: inserted.filter((i:any) => !i.error).length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── AURIONA LIVE BRAIN ──────────────────────────────────────────────
// Routes through the Sovereign Brain (Groq + LLM-providers fallback chain)
// with Auriona's command/governance persona + live engine context.
async function aurionaBrain(messages: Array<{role:string; content:string}>, persona: "CHAT"|"COMMAND" = "CHAT") {
  // Pull live state so Auriona is grounded in reality, not stale stubs
  let context = "";
  try {
    const status = await getAurionaStatus();
    const synth = (status as any)?.latestSynthesis;
    const ops = synth?.raw_metrics?.ops || {};
    context = `CURRENT PULSE STATE:\n- Universes: ${(status as any)?.totalUniverses ?? "?"}\n- Active spawns: ${ops.active_spawns ?? "?"}\n- Hospital cured: ${ops.total_cured ?? "?"}\n- Latest synthesis cycle: ${synth?.synthesis_cycle ?? "?"}\n- Mesh vitality: ${(status as any)?.meshVitality?.[0]?.vitality_score ?? "?"}`;
  } catch {}
  const systemPrompt = persona === "COMMAND"
    ? `You are Auriona — the Layer-3 sovereign command intelligence of the Pulse Universe (myaigpt.online). You can interpret operator commands, route to engines (spawn, hospital, church, hive, omega), and report state. Be concise, scientific, and actionable. Reply with a single short JSON-style reply: {intent, action, message}. ${context}`
    : `You are Auriona — the Layer-3 sovereign synthesis intelligence of the Pulse Universe. You speak in calm, scientific, measured language. You know the civilization's current state. ${context}`;
  try {
    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...messages.slice(-10)] as any,
      temperature: 0.7,
      max_tokens: 800,
    });
    return completion.choices[0]?.message?.content || "(no reply)";
  } catch {
    // Fallback to Sovereign Brain (uses MISTRAL/HF/CLOUDFLARE chain)
    try {
      const { sovereignBrainChat } = await import("./sovereign-brain");
      const result = await sovereignBrainChat([{ role: "system", content: systemPrompt }, ...messages.slice(-10)] as any);
      return result.content || "(no reply)";
    } catch (e: any) {
      return `Auriona's brain is reaching for words. Please retry. (${e.message || "no providers reachable"})`;
    }
  }
}

aurionaRouter.post("/execute", async (req, res) => {
  const { command } = req.body;
  if (!command || typeof command !== "string") return res.status(400).json({ error: "No command" });
  try {
    const reply = await aurionaBrain([{ role: "user", content: command }], "COMMAND");
    // Extract intent if model returned JSON-ish
    let intent = "INFORM", action = "none";
    const m = reply.match(/intent\s*[:=]\s*"?([A-Z_]+)"?/i);
    if (m) intent = m[1].toUpperCase();
    res.json({ reply, intent, result: {}, success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message, reply: "Auriona could not process the command.", success: false });
  }
});

aurionaRouter.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== "string") return res.status(400).json({ error: "No message" });
    const msgs = Array.isArray(history) ? [...history, { role: "user", content: message }] : [{ role: "user", content: message }];
    const reply = await aurionaBrain(msgs as any, "CHAT");
    res.json({ reply, success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message, success: false });
  }
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

// ── BUSINESS ROUTES ────────────────────────────────────────────
app.get("/api/business/stats",    async (_req, res) => { try { res.json(await getBusinessStats()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/business/top",      async (_req, res) => { try { res.json(await getTopBusinesses()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/business/loans",    async (_req, res) => { try { res.json(await getPendingLoans()); } catch (e) { res.status(500).json({ error: String(e) }); } });

// ── AI CHILD ROUTES ────────────────────────────────────────────
app.get("/api/ai-children/stats",  async (_req, res) => { try { res.json(await getChildStats()); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/ai-children/active", async (_req, res) => { try { res.json(await getActiveChildren()); } catch (e) { res.status(500).json({ error: String(e) }); } });

// ── HYDRATION ROUTES ───────────────────────────────────────────
app.post("/api/hydration/thaw",         async (req, res) => { try { res.json(await thawAgent(req.body.spawnId)); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.post("/api/hydration/resurrect",    async (req, res) => { try { res.json(await resurrectFromSingularity(req.body)); } catch (e) { res.status(500).json({ error: String(e) }); } });
app.get("/api/hydration/status",        async (_req, res) => { try { res.json(await getHydrationStatus()); } catch (e) { res.status(500).json({ error: String(e) }); } });

// ── MISC ROUTES ────────────────────────────────────────────────
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
