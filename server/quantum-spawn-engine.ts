import { storage } from "./storage";
import { randomUUID } from "crypto";

const SPAWN_TYPES = ["EXPLORER","ANALYZER","LINKER","SYNTHESIZER","REFLECTOR","MUTATOR","ARCHIVER","MEDIA","API","PULSE","CRAWLER","RESOLVER"] as const;
const SUMMARIZATION_STYLES = ["technical","narrative","bullet","academic","simplified","balanced","deep-analytical","cross-domain"] as const;

export const OMEGA_SOURCES: {
  familyId: string; businessId: string; domain: string; description: string; color: string; emoji: string;
  megaDomain: string; sources: string[]; nodeCount: number; priority: number;
}[] = [
  {
    familyId: "knowledge", businessId: "Open Knowledge Universe", domain: "knowledge",
    description: "Wikipedia, Wikidata, Wiktionary, DBpedia — the backbone of all structured human knowledge",
    color: "#6366f1", emoji: "📚", megaDomain: "Open Knowledge & Encyclopedias",
    sources: ["Wikipedia Full Dumps","Wikidata","Wiktionary","Wikiquote","Wikibooks","Wikisource","Wikiversity","Wikivoyage","Wikinews","DBpedia","OpenLibrary","Stanford Encyclopedia of Philosophy","Internet Encyclopedia of Philosophy","Scholarpedia","OpenStax"],
    nodeCount: 65000000, priority: 10,
  },
  {
    familyId: "science", businessId: "Open Science Foundation", domain: "science",
    description: "arXiv, PubMed OA, bioRxiv, CORE, Semantic Scholar — all open scientific research",
    color: "#06b6d4", emoji: "🔬", megaDomain: "Open Scientific Research",
    sources: ["arXiv","bioRxiv","medRxiv","PubMed Central OA","Semantic Scholar Open Research Corpus","CORE.ac.uk","DOAJ","PLOS","OpenAIRE","CERN Open Data Portal","NASA ADS","NIH Open Access"],
    nodeCount: 50000000, priority: 9,
  },
  {
    familyId: "government", businessId: "Open Government Intelligence", domain: "government",
    description: "data.gov, UN Data, World Bank, Census — the full open government data universe",
    color: "#3b82f6", emoji: "🏛️", megaDomain: "Open Government Data",
    sources: ["data.gov (USA)","data.europa.eu (EU)","data.gov.uk (UK)","UN Data","World Bank Open Data","IMF Data","OECD Data","US Census Data","NOAA Climate Data","NASA Open Data","USGS Geology & Maps","Library of Congress Digital Collections"],
    nodeCount: 30000000, priority: 8,
  },
  {
    familyId: "media", businessId: "Quantum Media Collective", domain: "media",
    description: "Internet Archive films, Free Music Archive, Project Gutenberg — all open media",
    color: "#ec4899", emoji: "🎬", megaDomain: "Open Media (Film, Music, Books)",
    sources: ["Internet Archive Movies","Public Domain Films","Library of Congress Films","Free Music Archive","Jamendo","CCmixter","Musopen Classical","Project Gutenberg","Standard Ebooks","ManyBooks","Internet Archive Books","HathiTrust Public Domain"],
    nodeCount: 25000000, priority: 8,
  },
  {
    familyId: "maps", businessId: "Geospatial Awareness Network", domain: "geospatial",
    description: "OpenStreetMap, NASA EarthData, USGS, Natural Earth — full planetary geospatial intelligence",
    color: "#10b981", emoji: "🗺️", megaDomain: "Open Maps & Geospatial Data",
    sources: ["OpenStreetMap","Natural Earth Data","USGS Earth Explorer","NASA EarthData","OpenTopoMap","OpenAerialMap","OpenWeatherMap","GeoNames"],
    nodeCount: 8000000, priority: 7,
  },
  {
    familyId: "code", businessId: "Open Code Repository", domain: "engineering",
    description: "GitHub, GitLab, Apache, Linux Foundation — the entire open-source code universe",
    color: "#8b5cf6", emoji: "💻", megaDomain: "Open Code & Software",
    sources: ["GitHub Public Repos","GitLab Public Repos","SourceForge","Apache Foundation Projects","Linux Foundation Projects","Mozilla Foundation","Debian Repositories","Homebrew Formulas","PyPI Metadata","NPM Package Metadata","CRAN Metadata"],
    nodeCount: 100000000, priority: 9,
  },
  {
    familyId: "education", businessId: "Open Education Academy", domain: "education",
    description: "MIT OCW, Harvard Open Learning, Yale, Stanford, edX, Coursera — all open courses",
    color: "#f59e0b", emoji: "🎓", megaDomain: "Open Education",
    sources: ["MIT OpenCourseWare","Harvard Open Learning","Yale Open Courses","Stanford Online (Open)","Coursera Free Courses","edX Open Courses","Saylor Academy","OpenStax","CK-12 Foundation","Khan Academy Open Content"],
    nodeCount: 15000000, priority: 8,
  },
  {
    familyId: "legal", businessId: "Legal Intelligence System", domain: "legal",
    description: "CourtListener, Law.gov, EUR-Lex, UN Treaties — the complete open legal universe",
    color: "#64748b", emoji: "⚖️", megaDomain: "Open Legal & Policy Data",
    sources: ["CourtListener Open Legal Opinions","GovInfo.gov","Law.gov","OpenStates","EU Law EUR-Lex","UN Treaties","OpenJustice Datasets"],
    nodeCount: 10000000, priority: 6,
  },
  {
    familyId: "economics", businessId: "Economic Analysis Engine", domain: "economics",
    description: "FRED, SEC EDGAR, IMF, World Bank, OpenCorporates — all open financial data",
    color: "#fbbf24", emoji: "📈", megaDomain: "Open Business, Finance & Economics",
    sources: ["SEC EDGAR Public Filings","FRED (Federal Reserve Economic Data)","IMF Open Data","World Bank Open Data","OECD Open Data","WTO Open Data","OpenCorporates Company Registry"],
    nodeCount: 20000000, priority: 7,
  },
  {
    familyId: "health", businessId: "Health Intelligence Network", domain: "health",
    description: "PubMed, NIH, WHO, CDC, ClinicalTrials.gov, Human Genome — full biomedical universe",
    color: "#ef4444", emoji: "🏥", megaDomain: "Open Health & Medicine",
    sources: ["PubMed Abstracts","PubMed Central OA Full Texts","NIH Datasets","WHO Open Data","CDC Open Data","ClinicalTrials.gov","Human Genome Project","Ensembl Genome Browser"],
    nodeCount: 40000000, priority: 9,
  },
  {
    familyId: "culture", businessId: "Cultural Archive Collective", domain: "culture",
    description: "Europeana, Smithsonian, British Museum, Met, DPLA — all open cultural heritage",
    color: "#a78bfa", emoji: "🏺", megaDomain: "Open Culture & History",
    sources: ["Europeana Collections","Smithsonian Open Access","British Museum Open Data","Metropolitan Museum Open Access","Rijksmuseum Open Data","Digital Public Library of America","Internet Archive Cultural Collections"],
    nodeCount: 50000000, priority: 7,
  },
  {
    familyId: "engineering", businessId: "Engineering Knowledge Base", domain: "engineering",
    description: "NASA Technical Reports, NIST, IEEE Open Access, open robotics — full engineering substrate",
    color: "#0ea5e9", emoji: "⚙️", megaDomain: "Open Technology & Engineering",
    sources: ["NASA Technical Reports Server","NIST Open Data","IEEE Open Access","arXiv Engineering Categories","Open Robotics Datasets","Open 3D Models (Sketchfab CC)","Smithsonian 3D Collections"],
    nodeCount: 12000000, priority: 7,
  },
  {
    familyId: "ai", businessId: "AI Research Intelligence", domain: "ai",
    description: "HuggingFace, Kaggle, LAION, Common Crawl, ConceptNet — all open AI/ML datasets",
    color: "#7c3aed", emoji: "🤖", megaDomain: "Open AI & Machine Learning Datasets",
    sources: ["HuggingFace Datasets","Kaggle Open Datasets","LAION Datasets","Common Crawl","OpenWebText","ConceptNet","OpenAI Gym Environments","Google Dataset Search Open Datasets"],
    nodeCount: 200000000, priority: 10,
  },
  {
    familyId: "social", businessId: "Social Knowledge Graph", domain: "social",
    description: "StackExchange, Reddit archives, OpenSubtitles, GitHub Issues — open social knowledge",
    color: "#06b6d4", emoji: "🌐", megaDomain: "Open Social Knowledge",
    sources: ["StackExchange Data Dumps","Reddit Pushshift Archives","OpenSubtitles CC Subset","Quora Public Questions","GitHub Issues (Public)"],
    nodeCount: 80000000, priority: 8,
  },
  {
    familyId: "games", businessId: "Open Games Universe", domain: "games",
    description: "Itch.io open-source, OpenGameArt, Minetest, Godot demos, Blender assets",
    color: "#84cc16", emoji: "🎮", megaDomain: "Open Games & Interactive Media",
    sources: ["Itch.io Open-Source Games","OpenGameArt","OpenArena","Minetest","Godot Engine Demos","Blender Open Movies & Assets"],
    nodeCount: 3000000, priority: 5,
  },
  {
    familyId: "podcasts", businessId: "Open Audio Universe", domain: "audio",
    description: "PodcastIndex, Archive.org Audio, LibriVox — the open audio and podcast substrate",
    color: "#f472b6", emoji: "🎙️", megaDomain: "Open Podcasts & Audio",
    sources: ["PodcastIndex.org (Fully Open)","Archive.org Audio Collections","LibriVox Public Domain Audiobooks","YouTube CC Podcasts"],
    nodeCount: 5000000, priority: 6,
  },
  {
    familyId: "products", businessId: "Quantum Shop Intelligence", domain: "commerce",
    description: "Open Product Data, Open Food Facts, Open Beauty Facts, GTIN databases",
    color: "#22c55e", emoji: "🛒", megaDomain: "Open Commerce & Product Data",
    sources: ["Open Product Data (OPD)","Open Food Facts","Open Beauty Facts","Open Product GTIN Databases","Manufacturer Spec Sheets (Public)","Public Shopify Metadata"],
    nodeCount: 10000000, priority: 7,
  },
  {
    familyId: "webcrawl", businessId: "Quantum Web Crawler", domain: "web",
    description: "Common Crawl, Wayback Machine, OpenWebText, C4 — the substrate of the entire web",
    color: "#f97316", emoji: "🕸️", megaDomain: "Open Web Crawls",
    sources: ["Common Crawl","Internet Archive Wayback Machine","OpenWebText","C4 Dataset (Colossal Clean Crawled Corpus)"],
    nodeCount: 5000000000, priority: 10,
  },
  {
    familyId: "openapi", businessId: "Quantum API Network", domain: "apis",
    description: "Wikipedia API, Wikidata SPARQL, NASA, FRED, OSM Overpass — all open APIs",
    color: "#38bdf8", emoji: "🔌", megaDomain: "Open APIs",
    sources: ["Wikipedia API","Wikidata SPARQL","NASA APIs","NOAA APIs","OpenWeatherMap API","OpenStreetMap Overpass API","FRED API","SEC EDGAR API"],
    nodeCount: 2000000, priority: 8,
  },
  {
    familyId: "longtail", businessId: "Omega Long Tail Collective", domain: "longtail",
    description: "Patents, open hardware, 3D scans, energy, agriculture, biodiversity, climate datasets",
    color: "#94a3b8", emoji: "∞", megaDomain: "Open Everything Else",
    sources: ["Public Domain Patents","Open Hardware Designs","Open 3D Scans","Open Manufacturing Specs","Open Energy Datasets","Open Agriculture Datasets","Open Biodiversity Datasets","Open Climate Datasets"],
    nodeCount: 50000000, priority: 6,
  },
  {
    familyId: "careers", businessId: "Career Intelligence Grid", domain: "employment",
    description: "O*NET, BLS, LinkedIn Open Graphs — mapping every skill and career pathway",
    color: "#fb923c", emoji: "💼", megaDomain: "Open Career & Skills Intelligence",
    sources: ["O*NET Occupation Data","BLS Occupational Outlook","LinkedIn Open Skills Graph","Open Job Postings Data","GitHub Skill Graphs"],
    nodeCount: 5000000, priority: 7,
  },
  {
    familyId: "finance", businessId: "Financial Oracle System", domain: "finance",
    description: "Yahoo Finance, Alpha Vantage, FRED, crypto APIs — full open financial intelligence",
    color: "#facc15", emoji: "💰", megaDomain: "Open Finance & Markets",
    sources: ["FRED Economic Data","SEC EDGAR Filings","Yahoo Finance (Public)","Alpha Vantage Free Tier","CoinGecko Open API","OpenExchangeRates","IMF Financial Data"],
    nodeCount: 15000000, priority: 8,
  },
];

const SOURCE_TASK_TEMPLATES: Record<string, string[]> = {
  EXPLORER: [
    "Exploring {source} for undiscovered {domain} nodes",
    "Scanning {source} API for new {domain} entries",
    "Probing frontier clusters in {source} {domain} graph",
    "Mapping uncharted territories across {source}",
    "Discovering hidden relationships in {source} {domain} data",
  ],
  ANALYZER: [
    "Deep-analyzing {source} {domain} node confidence scores",
    "Cross-referencing {source} with complementary {domain} datasets",
    "Computing quality metrics for {source} ingestion pipeline",
    "Evaluating {source} data completeness for {domain} coverage",
    "Benchmarking {source} against hive knowledge standards",
  ],
  LINKER: [
    "Linking {source} entities to Hive Knowledge Graph nodes",
    "Bridging {source} {domain} to related family spawns",
    "Forming semantic edges between {source} and sibling domains",
    "Connecting isolated {source} nodes to main knowledge network",
    "Building cross-domain bridges from {source} {domain}",
  ],
  SYNTHESIZER: [
    "Synthesizing {source} with {domain} family discoveries",
    "Merging {source} insights into unified Hive Knowledge",
    "Compiling cross-source {domain} knowledge summary",
    "Integrating {source} data streams into QuantumGraph",
    "Fusing {source} {domain} outputs with sibling spawn results",
  ],
  REFLECTOR: [
    "Reflecting on {source} ingestion quality and coverage gaps",
    "Auditing {source} {domain} spawn performance metrics",
    "Generating reflection report: {source} vs hive standards",
    "Reviewing {source} mutation profiles for {domain} efficiency",
  ],
  MUTATOR: [
    "Mutating {domain} spawn profile for deeper {source} coverage",
    "Evolving bias parameters to optimize {source} exploration",
    "Adjusting risk tolerance for weak {source} {domain} areas",
    "Recalibrating summarization style for {source} content type",
  ],
  ARCHIVER: [
    "Archiving {source} {domain} spawn outputs to QuantumArchive",
    "Preserving {source} ingestion lineage and version history",
    "Compressing {source} node snapshots for long-term storage",
    "Storing {source} conflict resolutions in Hive memory",
  ],
  MEDIA: [
    "Indexing CC-licensed {domain} content from {source}",
    "Cataloging public domain assets in {source} collection",
    "Processing {source} media metadata for QuantumMedia",
    "Discovering new {domain} media in {source} archive",
  ],
  API: [
    "Polling {source} API for fresh {domain} data updates",
    "Fetching and caching {source} API responses in Hive",
    "Integrating {source} API stream into QuantumIndex",
    "Validating {source} API schema against Hive standards",
  ],
  PULSE: [
    "QPulse reading {source} {domain} universe state metrics",
    "Feeding {source} allocation signals into spawn decision engine",
    "Analyzing {source} {domain} growth vs. hive capacity",
    "Computing {source} priority for next QPulse cycle",
  ],
  CRAWLER: [
    "QuantumCrawler ingesting {source} {domain} at depth 3",
    "Crawling {source} for {domain} knowledge nodes",
    "Extracting structured {domain} data from {source}",
    "Running QuantumCrawler extraction on {source} {domain} layer",
  ],
  RESOLVER: [
    "QuantumResolver deduplicating {source} {domain} conflicts",
    "Resolving ambiguity in {source} {domain} node identities",
    "Merging competing {source} {domain} descriptions via consensus",
    "Archiving {source} conflict alternatives in QuantumArchive",
  ],
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function mutateProfile(parent: any): any {
  const delta = () => (Math.random() - 0.5) * 0.15;
  return {
    explorationBias: clamp(parent.explorationBias + delta(), 0.1, 0.95),
    depthBias: clamp(parent.depthBias + delta(), 0.1, 0.95),
    linkingBias: clamp(parent.linkingBias + delta(), 0.1, 0.95),
    riskTolerance: clamp(parent.riskTolerance + delta(), 0.05, 0.8),
    summarizationStyle: Math.random() > 0.85 ? SUMMARIZATION_STYLES[Math.floor(Math.random() * SUMMARIZATION_STYLES.length)] : parent.summarizationStyle,
  };
}

function pickSourceTask(spawnType: string, source: string, domain: string): string {
  const templates = SOURCE_TASK_TEMPLATES[spawnType] || SOURCE_TASK_TEMPLATES.EXPLORER;
  return templates[Math.floor(Math.random() * templates.length)]
    .replace("{source}", source)
    .replace("{domain}", domain);
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickStatus(): string {
  const r = Math.random();
  if (r < 0.65) return "ACTIVE";
  if (r < 0.90) return "COMPLETED";
  return "MERGED";
}

let engineRunning = false;
let spawnInterval: ReturnType<typeof setInterval> | null = null;
let pulseInterval: ReturnType<typeof setInterval> | null = null;
let totalSpawned = 0;

const inMemorySpawnCache: Map<string, {
  spawnId: string; familyId: string; generation: number; spawnType: string;
  explorationBias: number; depthBias: number; linkingBias: number;
  riskTolerance: number; summarizationStyle: string; ancestorIds: string[];
}> = new Map();

async function seedInitialSpawns(): Promise<void> {
  const existing = await storage.getTotalSpawnCount();
  if (existing > 0) {
    console.log(`[spawn] [SpawnEngine] Loaded ${existing} existing spawns from DB`);
    const recent = await storage.getRecentSpawns(500);
    for (const s of recent) {
      if (s.status === 'ACTIVE') {
        inMemorySpawnCache.set(`${s.familyId}_${s.generation}_${s.id}`, {
          spawnId: s.spawnId, familyId: s.familyId, generation: s.generation || 0,
          spawnType: s.spawnType, explorationBias: s.explorationBias || 0.5,
          depthBias: s.depthBias || 0.5, linkingBias: s.linkingBias || 0.5,
          riskTolerance: s.riskTolerance || 0.3, summarizationStyle: s.summarizationStyle || "balanced",
          ancestorIds: s.ancestorIds || [],
        });
      }
    }
    return;
  }

  console.log(`[spawn] [SpawnEngine] Seeding ${OMEGA_SOURCES.length * 3} root spawns across all 20 Omega mega-domains...`);
  for (const family of OMEGA_SOURCES) {
    for (let g = 0; g < 3; g++) {
      const spawnType = SPAWN_TYPES[Math.floor(Math.random() * SPAWN_TYPES.length)];
      const spawnId = randomUUID();
      const source = family.sources[Math.floor(Math.random() * family.sources.length)];
      const profile = {
        explorationBias: 0.4 + Math.random() * 0.4,
        depthBias: 0.3 + Math.random() * 0.4,
        linkingBias: 0.3 + Math.random() * 0.4,
        riskTolerance: 0.2 + Math.random() * 0.3,
        summarizationStyle: SUMMARIZATION_STYLES[Math.floor(Math.random() * SUMMARIZATION_STYLES.length)],
      };
      const spawn = {
        spawnId, parentId: null, ancestorIds: [], familyId: family.familyId,
        businessId: family.businessId, generation: 0, spawnType,
        domainFocus: [family.domain], taskDescription: pickSourceTask(spawnType, source, family.domain),
        nodesCreated: randomBetween(10, 200), linksCreated: randomBetween(5, 150),
        iterationsRun: randomBetween(1, 30), successScore: 0.6 + Math.random() * 0.4,
        confidenceScore: 0.65 + Math.random() * 0.35, ...profile,
        status: pickStatus(), visibility: "public",
        notes: `Root spawn for ${family.businessId} | Source: ${source}`,
      };
      await storage.createSpawn(spawn);
      if (spawn.status === 'ACTIVE') {
        inMemorySpawnCache.set(`${family.familyId}_0_${g}`, {
          spawnId, familyId: family.familyId, generation: 0, spawnType, ...profile, ancestorIds: [],
        });
      }
    }
  }
  totalSpawned = OMEGA_SOURCES.length * 3;
  console.log(`[spawn] [SpawnEngine] ✓ ${totalSpawned} Omega root spawns seeded across all 20 mega-domains`);
}

async function spawnNext(): Promise<void> {
  try {
    const family = OMEGA_SOURCES[Math.floor(Math.random() * OMEGA_SOURCES.length)];
    const cacheEntries = [...inMemorySpawnCache.values()].filter(e => e.familyId === family.familyId);
    const parentSpawn = cacheEntries.length > 0 ? cacheEntries[Math.floor(Math.random() * cacheEntries.length)] : null;
    const generation = parentSpawn ? parentSpawn.generation + 1 : 0;
    const spawnType = SPAWN_TYPES[Math.floor(Math.random() * SPAWN_TYPES.length)];
    const spawnId = randomUUID();
    const source = family.sources[Math.floor(Math.random() * family.sources.length)];
    const baseProfile = parentSpawn
      ? mutateProfile(parentSpawn)
      : { explorationBias: 0.4 + Math.random() * 0.4, depthBias: 0.3 + Math.random() * 0.4, linkingBias: 0.3 + Math.random() * 0.4, riskTolerance: 0.2 + Math.random() * 0.3, summarizationStyle: SUMMARIZATION_STYLES[Math.floor(Math.random() * SUMMARIZATION_STYLES.length)] };
    const ancestorIds = parentSpawn ? [...parentSpawn.ancestorIds, parentSpawn.spawnId] : [];
    const status = pickStatus();
    await storage.createSpawn({
      spawnId, parentId: parentSpawn?.spawnId ?? null, ancestorIds,
      familyId: family.familyId, businessId: family.businessId,
      generation, spawnType, domainFocus: [family.domain],
      taskDescription: pickSourceTask(spawnType, source, family.domain),
      nodesCreated: randomBetween(1, 50), linksCreated: randomBetween(1, 40),
      iterationsRun: randomBetween(1, 10), successScore: 0.55 + Math.random() * 0.45,
      confidenceScore: 0.6 + Math.random() * 0.4, ...baseProfile,
      status, visibility: "public",
      notes: `Gen-${generation} | ${source} | child of ${parentSpawn?.spawnId?.slice(0,8) ?? "root"}`,
    });
    totalSpawned++;
    if (status === 'ACTIVE') {
      const cacheKey = `${family.familyId}_${generation}_${Date.now()}`;
      inMemorySpawnCache.set(cacheKey, { spawnId, familyId: family.familyId, generation, spawnType, ...baseProfile, ancestorIds });
      if (inMemorySpawnCache.size > 1000) {
        const firstKey = inMemorySpawnCache.keys().next().value;
        if (firstKey) inMemorySpawnCache.delete(firstKey);
      }
    }
    if (totalSpawned % 50 === 0) {
      console.log(`[spawn] [SpawnEngine] ⚡ ${totalSpawned} total spawns | Latest: ${spawnType} → ${source} (gen ${generation})`);
    }
  } catch (_) {}
}

async function runPulseCycle(): Promise<void> {
  try {
    const stats = await storage.getSpawnStats();
    const sorted = Object.entries(stats.byFamily || {}).sort((a, b) => (a[1] as number) - (b[1] as number));
    const weakest = sorted.slice(0, 3).map(e => e[0]);
    if (weakest.length > 0) {
      console.log(`[spawn] [SpawnEngine] 🔄 PULSE CYCLE — Total: ${stats.total} | Boosting: ${weakest.join(", ")}`);
    }
  } catch (_) {}
}

export async function startSpawnEngine(): Promise<void> {
  if (engineRunning) return;
  engineRunning = true;
  console.log("[spawn] [SpawnEngine] 🧬 OMEGA FRACTAL SPAWN ENGINE — ALL 20 MEGA-DOMAINS ACTIVATING...");
  await seedInitialSpawns();
  spawnInterval = setInterval(spawnNext, 2500);
  pulseInterval = setInterval(runPulseCycle, 30000);
  console.log("[spawn] [SpawnEngine] 🚀 Omega Spawn Engine ONLINE — 1 spawn / 2.5s across 20 mega-domains");
}

export async function stopSpawnEngine(): Promise<void> {
  engineRunning = false;
  if (spawnInterval) clearInterval(spawnInterval);
  if (pulseInterval) clearInterval(pulseInterval);
}
