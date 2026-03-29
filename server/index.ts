import express, { type Request, Response, NextFunction } from "express";
import { pool } from "./db";
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
import { startAIVotingEngine } from "./ai-voting-engine";
import { startIngestionEngine } from "./quantum-ingestion-engine";
import { startPublicationEngine } from "./publication-engine";
import { startQuantumSocialEngine } from "./quantum-social-engine";
import { startOmniNetEngine } from "./omni-net-engine";
import { startPulseNetCache } from "./pulsenet-cache";
import { startPulseLabCycle } from "./pulse-lang-lab";
import { startQuantapediaEngine } from "./quantapedia-engine";
import { startResearchCenterEngine } from "./research-center-engine";
import { startInventionEngine } from "./invention-engine";
import { startQuantumDissectionEngine } from "./quantum-dissection-engine";
import { startHospitalEngine } from "./hospital-engine";

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
  // ── AI VOTING ENGINE — Autonomous equation & species governance ──
  startAIVotingEngine();
  // ── QUANTUM INGESTION ENGINE — Omega knowledge ingestion from all world sources ──
  startIngestionEngine().catch((e: Error) => console.error("[ingestion] startup error:", e.message));
  // ── PUBLICATION ENGINE — Agents write research papers, reports, and knowledge articles ──
  startPublicationEngine().catch((e: Error) => console.error("[publications] startup error:", e.message));
  // ── PULSENET CACHE — Fast cache layer for live PulseNet/OmniNet snapshots ──
  startPulseNetCache();
  // ── OMNI-NET ENGINE — OmniField: PulseShards, WiFi, PulsePhones, U₂₄₈ hidden variables ──
  startOmniNetEngine().catch((e: Error) => console.error("[omni-net] startup error:", e.message));
  // ── QUANTUM SOCIAL ENGINE — PulseLang social posts: equations, dissections, inventions ──
  startQuantumSocialEngine().catch((e: Error) => console.error("[quantum-social] startup error:", e.message));
  // ── PULSE LANG LAB — AI scientists run live equation dissections and lab proposals ──
  startPulseLabCycle();
  // ── QUANTAPEDIA ENGINE — AI encyclopedia: generates articles for all 13,000+ queued topics ──
  startQuantapediaEngine().catch((e: Error) => console.error("[quantapedia] startup error:", e.message));
  // ── RESEARCH CENTER ENGINE — Agents conduct deep research across all disciplines ──
  startResearchCenterEngine().catch((e: Error) => console.error("[research-center] startup error:", e.message));
  // ── INVENTION ENGINE — Agents generate and mutate inventions autonomously ──
  startInventionEngine().catch((e: Error) => console.error("[invention] startup error:", e.message));
  // ── QUANTUM DISSECTION ENGINE — Agents dissect equations into knowledge ──
  startQuantumDissectionEngine().catch((e: Error) => console.error("[dissection] startup error:", e.message));
  // ── HOSPITAL ENGINE — Active cases, doctors, CRISPR treatments, gene species ──
  startHospitalEngine().catch((e: Error) => console.error("[hospital] startup error:", e.message));
  // ── OMEGA SOURCES SEED — Restore hundreds of research sources if wiped ──
  seedOmegaSources().catch((e: Error) => console.error("[omega-seed] error:", e.message));
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
  try {
    const [mallTrades, kernels, treasury, mallStats] = await Promise.all([
      pool.query(`
        SELECT st.*, 
          qs_seller.task_description as seller_desc,
          qs_buyer.task_description as buyer_desc
        FROM spawn_transactions st
        LEFT JOIN quantum_spawns qs_seller ON qs_seller.spawn_id = st.seller_id
        LEFT JOIN quantum_spawns qs_buyer ON qs_buyer.spawn_id = st.buyer_id
        ORDER BY st.created_at DESC LIMIT 100
      `).catch(() => ({ rows: [] })),
      pool.query(`
        SELECT spawn_id, gics_sector, gics_tier, pulse_credits, status,
               total_mall_trades, total_mall_earnings, mall_service_offer, mall_service_price
        FROM quantum_spawns WHERE gics_tier = 'KERNEL' ORDER BY gics_code
      `).catch(() => ({ rows: [] })),
      pool.query(`SELECT * FROM hive_treasury ORDER BY id LIMIT 1`).catch(() => ({ rows: [] })),
      pool.query(`
        SELECT COUNT(*) as total_trades,
               COALESCE(SUM(price_pc), 0) as total_volume,
               COALESCE(SUM(tax_collected), 0) as total_tax
        FROM spawn_transactions
      `).catch(() => ({ rows: [{}] })),
    ]);
    res.json({
      trades: mallTrades.rows,
      kernels: kernels.rows,
      treasury: treasury.rows[0] ?? {},
      stats: mallStats.rows[0] ?? {},
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
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
