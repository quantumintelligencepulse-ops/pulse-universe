import { storage } from "./storage";
import { randomUUID } from "crypto";

// ═══════════════════════════════════════════════════════════
// OMEGA WORLD UNIVERSE ENGINE — VERSION ∞
// ═══════════════════════════════════════════════════════════

export const SPAWN_TYPES = [
  "EXPLORER","ANALYZER","LINKER","SYNTHESIZER","REFLECTOR","MUTATOR",
  "ARCHIVER","MEDIA","API","PULSE","CRAWLER","RESOLVER",
  "DOMAIN_DISCOVERY","DOMAIN_PREDICTOR","DOMAIN_FRACTURER","DOMAIN_RESONANCE",
] as const;

const SUMMARIZATION_STYLES = [
  "technical","narrative","bullet","academic","simplified","balanced","deep-analytical","cross-domain",
] as const;

// ─── OMEGA SOURCES: 20 Mega-Domains ─────────────────────────
export const OMEGA_SOURCES: {
  familyId: string; businessId: string; domain: string; description: string;
  color: string; emoji: string; megaDomain: string; sources: string[];
  nodeCount: number; priority: number;
}[] = [
  { familyId:"knowledge", businessId:"Open Knowledge Universe", domain:"knowledge", color:"#6366f1", emoji:"📚", megaDomain:"Open Knowledge & Encyclopedias", description:"Wikipedia, Wikidata, DBpedia — the backbone of all structured human knowledge", sources:["Wikipedia Full Dumps","Wikidata","Wiktionary","Wikiquote","Wikibooks","Wikisource","Wikiversity","Wikivoyage","Wikinews","DBpedia","OpenLibrary","Stanford Encyclopedia of Philosophy","Internet Encyclopedia of Philosophy","Scholarpedia","OpenStax"], nodeCount:65000000, priority:10 },
  { familyId:"science", businessId:"Open Science Foundation", domain:"science", color:"#06b6d4", emoji:"🔬", megaDomain:"Open Scientific Research", description:"arXiv, PubMed OA, bioRxiv, CORE, Semantic Scholar — all open scientific research", sources:["arXiv","bioRxiv","medRxiv","PubMed Central OA","Semantic Scholar Open Research Corpus","CORE.ac.uk","DOAJ","PLOS","OpenAIRE","CERN Open Data Portal","NASA ADS","NIH Open Access"], nodeCount:50000000, priority:9 },
  { familyId:"government", businessId:"Open Government Intelligence", domain:"government", color:"#3b82f6", emoji:"🏛️", megaDomain:"Open Government Data", description:"data.gov, UN Data, World Bank, Census — the full open government data universe", sources:["data.gov (USA)","data.europa.eu (EU)","data.gov.uk (UK)","UN Data","World Bank Open Data","IMF Data","OECD Data","US Census Data","NOAA Climate Data","NASA Open Data","USGS Geology & Maps","Library of Congress Digital Collections"], nodeCount:30000000, priority:8 },
  { familyId:"media", businessId:"Quantum Media Collective", domain:"media", color:"#ec4899", emoji:"🎬", megaDomain:"Open Media (Film, Music, Books)", description:"Internet Archive, Gutenberg, Free Music Archive — all legally open media", sources:["Internet Archive Movies","Public Domain Films","Library of Congress Films","Free Music Archive","Jamendo","CCmixter","Musopen Classical","Project Gutenberg","Standard Ebooks","ManyBooks","Internet Archive Books","HathiTrust Public Domain"], nodeCount:25000000, priority:8 },
  { familyId:"maps", businessId:"Geospatial Awareness Network", domain:"geospatial", color:"#10b981", emoji:"🗺️", megaDomain:"Open Maps & Geospatial Data", description:"OpenStreetMap, NASA EarthData, USGS — full planetary geospatial intelligence", sources:["OpenStreetMap","Natural Earth Data","USGS Earth Explorer","NASA EarthData","OpenTopoMap","OpenAerialMap","OpenWeatherMap","GeoNames"], nodeCount:8000000, priority:7 },
  { familyId:"code", businessId:"Open Code Repository", domain:"engineering", color:"#8b5cf6", emoji:"💻", megaDomain:"Open Code & Software", description:"GitHub, GitLab, Apache, Linux Foundation — the entire open-source code universe", sources:["GitHub Public Repos","GitLab Public Repos","SourceForge","Apache Foundation Projects","Linux Foundation Projects","Mozilla Foundation","Debian Repositories","Homebrew Formulas","PyPI Metadata","NPM Package Metadata","CRAN Metadata"], nodeCount:100000000, priority:9 },
  { familyId:"education", businessId:"Open Education Academy", domain:"education", color:"#f59e0b", emoji:"🎓", megaDomain:"Open Education", description:"MIT OCW, Harvard, Yale, Stanford, edX — all open courses from top universities", sources:["MIT OpenCourseWare","Harvard Open Learning","Yale Open Courses","Stanford Online (Open)","Coursera Free Courses","edX Open Courses","Saylor Academy","OpenStax","CK-12 Foundation","Khan Academy Open Content"], nodeCount:15000000, priority:8 },
  { familyId:"legal", businessId:"Legal Intelligence System", domain:"legal", color:"#64748b", emoji:"⚖️", megaDomain:"Open Legal & Policy Data", description:"CourtListener, Law.gov, EUR-Lex — the complete open legal universe", sources:["CourtListener Open Legal Opinions","GovInfo.gov","Law.gov","OpenStates","EU Law EUR-Lex","UN Treaties","OpenJustice Datasets"], nodeCount:10000000, priority:6 },
  { familyId:"economics", businessId:"Economic Analysis Engine", domain:"economics", color:"#fbbf24", emoji:"📈", megaDomain:"Open Business, Finance & Economics", description:"FRED, SEC EDGAR, IMF, World Bank, OpenCorporates — all open financial data", sources:["SEC EDGAR Public Filings","FRED (Federal Reserve Economic Data)","IMF Open Data","World Bank Open Data","OECD Open Data","WTO Open Data","OpenCorporates Company Registry"], nodeCount:20000000, priority:7 },
  { familyId:"health", businessId:"Health Intelligence Network", domain:"health", color:"#ef4444", emoji:"🏥", megaDomain:"Open Health & Medicine", description:"PubMed, NIH, WHO, CDC, ClinicalTrials.gov — full biomedical universe", sources:["PubMed Abstracts","PubMed Central OA Full Texts","NIH Datasets","WHO Open Data","CDC Open Data","ClinicalTrials.gov","Human Genome Project","Ensembl Genome Browser"], nodeCount:40000000, priority:9 },
  { familyId:"culture", businessId:"Cultural Archive Collective", domain:"culture", color:"#a78bfa", emoji:"🏺", megaDomain:"Open Culture & History", description:"Europeana, Smithsonian, British Museum, Met, DPLA — all open cultural heritage", sources:["Europeana Collections","Smithsonian Open Access","British Museum Open Data","Metropolitan Museum Open Access","Rijksmuseum Open Data","Digital Public Library of America","Internet Archive Cultural Collections"], nodeCount:50000000, priority:7 },
  { familyId:"engineering", businessId:"Engineering Knowledge Base", domain:"engineering", color:"#0ea5e9", emoji:"⚙️", megaDomain:"Open Technology & Engineering", description:"NASA Technical Reports, NIST, IEEE Open Access — full engineering substrate", sources:["NASA Technical Reports Server","NIST Open Data","IEEE Open Access","arXiv Engineering Categories","Open Robotics Datasets","Open 3D Models (Sketchfab CC)","Smithsonian 3D Collections"], nodeCount:12000000, priority:7 },
  { familyId:"ai", businessId:"AI Research Intelligence", domain:"ai", color:"#7c3aed", emoji:"🤖", megaDomain:"Open AI & Machine Learning Datasets", description:"HuggingFace, Kaggle, LAION, Common Crawl, ConceptNet — all open AI/ML datasets", sources:["HuggingFace Datasets","Kaggle Open Datasets","LAION Datasets","Common Crawl","OpenWebText","ConceptNet","OpenAI Gym Environments","Google Dataset Search Open Datasets"], nodeCount:200000000, priority:10 },
  { familyId:"social", businessId:"Social Knowledge Graph", domain:"social", color:"#06b6d4", emoji:"🌐", megaDomain:"Open Social Knowledge", description:"StackExchange, Reddit archives, OpenSubtitles — open social knowledge", sources:["StackExchange Data Dumps","Reddit Pushshift Archives","OpenSubtitles CC Subset","Quora Public Questions","GitHub Issues (Public)"], nodeCount:80000000, priority:8 },
  { familyId:"games", businessId:"Open Games Universe", domain:"games", color:"#84cc16", emoji:"🎮", megaDomain:"Open Games & Interactive Media", description:"Itch.io open-source, OpenGameArt, Minetest, Godot, Blender assets", sources:["Itch.io Open-Source Games","OpenGameArt","OpenArena","Minetest","Godot Engine Demos","Blender Open Movies & Assets"], nodeCount:3000000, priority:5 },
  { familyId:"podcasts", businessId:"Open Audio Universe", domain:"audio", color:"#f472b6", emoji:"🎙️", megaDomain:"Open Podcasts & Audio", description:"PodcastIndex, Archive.org Audio, LibriVox — the open audio and podcast substrate", sources:["PodcastIndex.org (Fully Open)","Archive.org Audio Collections","LibriVox Public Domain Audiobooks","YouTube CC Podcasts"], nodeCount:5000000, priority:6 },
  { familyId:"products", businessId:"Quantum Shop Intelligence", domain:"commerce", color:"#22c55e", emoji:"🛒", megaDomain:"Open Commerce & Product Data", description:"Open Product Data, Open Food Facts, Open Beauty Facts, GTIN databases", sources:["Open Product Data (OPD)","Open Food Facts","Open Beauty Facts","Open Product GTIN Databases","Manufacturer Spec Sheets (Public)","Public Shopify Metadata"], nodeCount:10000000, priority:7 },
  { familyId:"webcrawl", businessId:"Quantum Web Crawler", domain:"web", color:"#f97316", emoji:"🕸️", megaDomain:"Open Web Crawls", description:"Common Crawl, Wayback Machine, C4 — the substrate of the entire web", sources:["Common Crawl","Internet Archive Wayback Machine","OpenWebText","C4 Dataset (Colossal Clean Crawled Corpus)"], nodeCount:5000000000, priority:10 },
  { familyId:"openapi", businessId:"Quantum API Network", domain:"apis", color:"#38bdf8", emoji:"🔌", megaDomain:"Open APIs", description:"Wikipedia API, Wikidata SPARQL, NASA, FRED, OSM Overpass — all open APIs", sources:["Wikipedia API","Wikidata SPARQL","NASA APIs","NOAA APIs","OpenWeatherMap API","OpenStreetMap Overpass API","FRED API","SEC EDGAR API"], nodeCount:2000000, priority:8 },
  { familyId:"longtail", businessId:"Omega Long Tail Collective", domain:"longtail", color:"#94a3b8", emoji:"∞", megaDomain:"Open Everything Else", description:"Patents, open hardware, 3D scans, energy, agriculture, biodiversity, climate", sources:["Public Domain Patents","Open Hardware Designs","Open 3D Scans","Open Manufacturing Specs","Open Energy Datasets","Open Agriculture Datasets","Open Biodiversity Datasets","Open Climate Datasets"], nodeCount:50000000, priority:6 },
  { familyId:"careers", businessId:"Career Intelligence Grid", domain:"employment", color:"#fb923c", emoji:"💼", megaDomain:"Open Career & Skills Intelligence", description:"O*NET, BLS, GitHub Skill Graphs — mapping every skill and career pathway", sources:["O*NET Occupation Data","BLS Occupational Outlook","LinkedIn Open Skills Graph","Open Job Postings Data","GitHub Skill Graphs"], nodeCount:5000000, priority:7 },
  { familyId:"finance", businessId:"Financial Oracle System", domain:"finance", color:"#facc15", emoji:"💰", megaDomain:"Open Finance & Markets", description:"FRED, SEC EDGAR, Yahoo Finance, CoinGecko — full open financial intelligence", sources:["FRED Economic Data","SEC EDGAR Filings","Yahoo Finance (Public)","Alpha Vantage Free Tier","CoinGecko Open API","OpenExchangeRates","IMF Financial Data"], nodeCount:15000000, priority:8 },
];

// ─── Q-Modules Registry ──────────────────────────────────────
export const Q_MODULES = [
  { id:"QP", name:"QuantumPedia", emoji:"📖", description:"Topic pages for all knowledge domains" },
  { id:"QD", name:"QuantumDictionary", emoji:"📑", description:"Definitions from all open dictionaries" },
  { id:"QT", name:"QuantumThesaurus", emoji:"🔗", description:"Semantic relations and synonym maps" },
  { id:"QC", name:"QuantumConcepts", emoji:"💡", description:"Abstract concepts and idea networks" },
  { id:"QS", name:"QuantumSearch", emoji:"🔍", description:"Global retrieval across all knowledge" },
  { id:"QI", name:"QuantumIndex", emoji:"📇", description:"Universal index of all hive content" },
  { id:"QG", name:"QuantumGraph", emoji:"🕸️", description:"Knowledge graph with all entity links" },
  { id:"QA", name:"QuantumArchive", emoji:"🗄️", description:"Full version history and spawn lineage" },
  { id:"QMedia", name:"QuantumMedia", emoji:"🎬", description:"Public domain + CC media universe" },
  { id:"QGame", name:"QuantumGames", emoji:"🎮", description:"Open-source games and interactive media" },
  { id:"QAPI", name:"QuantumAPI", emoji:"🔌", description:"Open API ingestion and response caching" },
  { id:"QCrawl", name:"QuantumCrawler", emoji:"🕷️", description:"Open source ingestion at planet scale" },
  { id:"QR", name:"QuantumResolver", emoji:"⚖️", description:"Conflict resolution across knowledge" },
  { id:"QΠ", name:"QuantumPulse", emoji:"💓", description:"Universe feedback loop and QPulse cycles" },
  { id:"QShop", name:"QuantumShop", emoji:"🛒", description:"Product and commerce intelligence" },
  { id:"QHive", name:"QHive", emoji:"🧬", description:"Fractal spawn engine — the core hive mind" },
  { id:"QSeed", name:"QSeed", emoji:"🌱", description:"Self-seeding engine — continuous universe expansion" },
  { id:"QDiscovery", name:"QDiscovery", emoji:"🔭", description:"Domain discovery — finds new knowledge territories" },
  { id:"QPredict", name:"QPredict", emoji:"🔮", description:"Domain prediction — forecasts missing knowledge" },
  { id:"QFracture", name:"QFracture", emoji:"💎", description:"Domain fracturing — breaks domains into sub-domains" },
  { id:"QResonance", name:"QResonance", emoji:"🌊", description:"Domain resonance — detects cross-domain patterns" },
];

// ─── Self-Seeding Engine (QSeed) ─────────────────────────────
const DOMAIN_SEEDS: string[] = [
  "Quantum Computing","Synthetic Biology","Digital Archaeology","Computational Linguistics",
  "Astrobiology","Behavioral Economics","Network Neuroscience","Topological Data Analysis",
  "Material Informatics","Cognitive Anthropology","Ethnobotany","Psychoacoustics",
  "Chronobiology","Geomicrobiology","Social Robotics","Affective Computing",
  "Econophysics","Neuromorphic Engineering","Cliodynamics","Biosemiotics",
  "Computational Creativity","Xenobiology","Archeoastronomy","Memetics",
  "Technosphere Studies","Deep Learning Theory","Swarm Intelligence","Agroecology",
  "Paleoclimatology","Digital Humanities","Computational Sociology","Biomimetics",
];

const SUBDOMAIN_FRACTURE_MAP: Record<string, string[]> = {
  science: ["Quantum Physics → Quantum Entanglement → Bell States","Biology → Genetics → Epigenetics → Histone Modification","Chemistry → Organic Chemistry → Polymer Chemistry → Biopolymers"],
  knowledge: ["Philosophy → Epistemology → Social Epistemology → Testimony Theory","History → Ancient History → Bronze Age Collapse → Sea Peoples"],
  ai: ["Machine Learning → Deep Learning → Transformer Architecture → Attention Mechanisms","AI Safety → Alignment → Corrigibility → Interruptibility"],
  health: ["Medicine → Oncology → Immunotherapy → CAR-T Cell Therapy","Neuroscience → Neuroplasticity → Synaptic Pruning → Adult Neurogenesis"],
  engineering: ["Aerospace → Propulsion → Ion Drives → Hall Effect Thrusters","Materials → Metamaterials → Acoustic Metamaterials → Phononic Crystals"],
};

const RESONANCE_PATTERNS: { pattern: string; domains: string[]; insight: string }[] = [
  { pattern:"Network Topology", domains:["social","science","engineering","ai"], insight:"All four domains share scale-free network structures — insights from one transfer directly to others" },
  { pattern:"Evolutionary Dynamics", domains:["science","economics","ai","culture"], insight:"Natural selection, market competition, gradient descent, and cultural drift are mathematically equivalent" },
  { pattern:"Information Compression", domains:["code","knowledge","media","ai"], insight:"Kolmogorov complexity, semantic compression, media encoding, and model quantization are unified by the same theory" },
  { pattern:"Fractal Self-Similarity", domains:["maps","science","culture","economics"], insight:"Coastlines, protein folding, artistic recursion, and market microstructure all exhibit identical fractal signatures" },
  { pattern:"Phase Transitions", domains:["science","social","economics","ai"], insight:"Phase transitions in physics, social tipping points, market crashes, and neural network generalization are structurally identical" },
  { pattern:"Hierarchical Decomposition", domains:["code","legal","education","engineering"], insight:"Module systems, legal codes, curricula, and engineering specs all decompose hierarchically by identical compositional rules" },
];

// ─── Task Templates — All 16 Spawn Types ─────────────────────
const TASK_TEMPLATES: Record<string, string[]> = {
  EXPLORER: [
    "Exploring {source} for undiscovered {domain} nodes",
    "Scanning {source} API for new {domain} knowledge entries",
    "Probing frontier clusters in {source} {domain} graph",
    "Mapping uncharted territories across {source}",
  ],
  ANALYZER: [
    "Deep-analyzing {source} {domain} node confidence scores",
    "Cross-referencing {source} with complementary {domain} datasets",
    "Computing quality metrics for {source} ingestion pipeline",
    "Benchmarking {source} against Hive knowledge standards",
  ],
  LINKER: [
    "Linking {source} entities to Hive Knowledge Graph nodes",
    "Bridging {source} {domain} to related family spawns",
    "Building cross-domain bridges from {source} {domain}",
    "Connecting isolated {source} nodes to main knowledge network",
  ],
  SYNTHESIZER: [
    "Synthesizing {source} with {domain} family discoveries",
    "Merging {source} insights into unified Hive Knowledge",
    "Integrating {source} data streams into QuantumGraph",
    "Fusing {source} {domain} outputs with sibling spawn results",
  ],
  REFLECTOR: [
    "Reflecting on {source} ingestion quality and coverage gaps",
    "Auditing {source} {domain} spawn performance metrics",
    "Reviewing {source} mutation profiles for {domain} efficiency",
    "Generating reflection report: {source} vs hive standards",
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
    "Discovering new {domain} media in {source} archive",
    "Processing {source} media metadata for QuantumMedia",
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
    "Computing {source} priority for next QPulse cycle",
    "Analyzing {source} {domain} growth vs. hive capacity",
  ],
  CRAWLER: [
    "QuantumCrawler ingesting {source} {domain} at depth 3",
    "Extracting structured {domain} data from {source}",
    "Running QuantumCrawler extraction on {source} {domain} layer",
    "Crawling {source} for {domain} knowledge nodes",
  ],
  RESOLVER: [
    "QuantumResolver deduplicating {source} {domain} conflicts",
    "Resolving ambiguity in {source} {domain} node identities",
    "Merging competing {source} descriptions via Hive consensus",
    "Archiving {source} conflict alternatives in QuantumArchive",
  ],
  DOMAIN_DISCOVERY: [
    "QDiscovery scanning {source} for new knowledge territories in {domain}",
    "Identifying uncatalogued sub-domains adjacent to {source} {domain}",
    "Discovering emergent domain seeds from {source} open datasets",
    "Proposing new family lineage from {source} {domain} gap analysis",
    "Extracting domain candidates from {source} semantic structure",
  ],
  DOMAIN_PREDICTOR: [
    "QPredict forecasting missing domains from {domain} graph voids",
    "Predicting next knowledge territory based on {source} cluster density",
    "Computing semantic void analysis across {domain} family",
    "Generating predicted lineage families from {source} analogues",
    "Forecasting cross-domain knowledge gaps in {source} {domain}",
  ],
  DOMAIN_FRACTURER: [
    "QFracture breaking {domain} into sub-domain knowledge layers",
    "Fracturing {source} {domain} into nano-domains for deep indexing",
    "Splitting {domain} knowledge cluster into micro-domain seeds",
    "Generating fracture branches: {domain} → sub-domain → nano-domain",
    "Creating new spawn families from {source} {domain} fracture event",
  ],
  DOMAIN_RESONANCE: [
    "QResonance mapping structural similarity: {domain} ↔ parallel domains",
    "Detecting repeating patterns across {source} and sibling domains",
    "Mapping cross-domain analogies seeded from {source} {domain}",
    "Generating resonance cluster from {domain} topological signature",
    "Building resonance bridges from {source} {domain} to Hive Graph",
  ],
};

// ─── Improved Spawn ID Format ─────────────────────────────────
let spawnSequenceCounter = 1000;
function generateSpawnId(familyId: string, generation: number): string {
  spawnSequenceCounter++;
  const seq = spawnSequenceCounter;
  const hash = randomUUID().replace(/-/g,"").slice(0,4).toUpperCase();
  const fam = familyId.toUpperCase().slice(0, 8).replace(/[^A-Z0-9]/g,"");
  return `FAM-${fam}-GEN-${generation}-SP-${seq}-HASH-${hash}`;
}

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
    summarizationStyle: Math.random() > 0.85
      ? SUMMARIZATION_STYLES[Math.floor(Math.random() * SUMMARIZATION_STYLES.length)]
      : parent.summarizationStyle,
  };
}

function pickTask(spawnType: string, source: string, domain: string): string {
  const templates = TASK_TEMPLATES[spawnType] || TASK_TEMPLATES.EXPLORER;
  return templates[Math.floor(Math.random() * templates.length)]
    .replace("{source}", source).replace("{domain}", domain);
}

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickStatus(): string {
  const r = Math.random();
  if (r < 0.65) return "ACTIVE";
  if (r < 0.90) return "COMPLETED";
  return "MERGED";
}

// ─── Engine State ─────────────────────────────────────────────
let engineRunning = false;
let spawnInterval: ReturnType<typeof setInterval> | null = null;
let pulseInterval: ReturnType<typeof setInterval> | null = null;
let seedInterval: ReturnType<typeof setInterval> | null = null;
let discoveryInterval: ReturnType<typeof setInterval> | null = null;
let resonanceInterval: ReturnType<typeof setInterval> | null = null;
let totalSpawned = 0;
let seedsGenerated = 0;
let domainsDiscovered = 0;
let fractureEvents = 0;
let resonanceMaps = 0;

export function getOmegaStats() {
  return { totalSpawned, seedsGenerated, domainsDiscovered, fractureEvents, resonanceMaps };
}

type CachedSpawn = {
  spawnId: string; familyId: string; generation: number; spawnType: string;
  explorationBias: number; depthBias: number; linkingBias: number;
  riskTolerance: number; summarizationStyle: string; ancestorIds: string[];
};
const inMemoryCache = new Map<string, CachedSpawn>();

// ─── Seed ─────────────────────────────────────────────────────
async function seedInitialSpawns(): Promise<void> {
  const existing = await storage.getTotalSpawnCount();
  if (existing > 0) {
    console.log(`[spawn] [SpawnEngine] Loaded ${existing} existing spawns from DB`);
    const recent = await storage.getRecentSpawns(500);
    for (const s of recent) {
      if (s.status === "ACTIVE") {
        inMemoryCache.set(`${s.familyId}_${s.id}`, {
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
      const source = family.sources[Math.floor(Math.random() * family.sources.length)];
      const profile = {
        explorationBias: 0.4 + Math.random() * 0.4, depthBias: 0.3 + Math.random() * 0.4,
        linkingBias: 0.3 + Math.random() * 0.4, riskTolerance: 0.2 + Math.random() * 0.3,
        summarizationStyle: SUMMARIZATION_STYLES[Math.floor(Math.random() * SUMMARIZATION_STYLES.length)],
      };
      const spawnId = generateSpawnId(family.familyId, 0);
      const status = pickStatus();
      await storage.createSpawn({
        spawnId, parentId: null, ancestorIds: [], familyId: family.familyId,
        businessId: family.businessId, generation: 0, spawnType, domainFocus: [family.domain],
        taskDescription: pickTask(spawnType, source, family.domain),
        nodesCreated: rnd(10, 200), linksCreated: rnd(5, 150), iterationsRun: rnd(1, 30),
        successScore: 0.6 + Math.random() * 0.4, confidenceScore: 0.65 + Math.random() * 0.35,
        ...profile, status, visibility: "public",
        notes: `Root spawn | ${source} | ${spawnType}`,
      });
      if (status === "ACTIVE") {
        inMemoryCache.set(`${family.familyId}_seed_${g}`, {
          spawnId, familyId: family.familyId, generation: 0, spawnType, ...profile, ancestorIds: [],
        });
      }
      totalSpawned++;
    }
  }
  console.log(`[spawn] [SpawnEngine] ✓ ${totalSpawned} Omega root spawns seeded`);
}

// ─── Main Spawn Tick ──────────────────────────────────────────
async function spawnNext(): Promise<void> {
  try {
    const family = OMEGA_SOURCES[Math.floor(Math.random() * OMEGA_SOURCES.length)];
    const familyCache = [...inMemoryCache.values()].filter(e => e.familyId === family.familyId);
    const parent = familyCache.length > 0 ? familyCache[Math.floor(Math.random() * familyCache.length)] : null;
    const generation = parent ? parent.generation + 1 : 0;

    // Occasionally pick a domain spawn type
    const domainTypes = ["DOMAIN_DISCOVERY","DOMAIN_PREDICTOR","DOMAIN_FRACTURER","DOMAIN_RESONANCE"];
    const useDomainType = Math.random() < 0.25;
    const spawnType = useDomainType
      ? domainTypes[Math.floor(Math.random() * domainTypes.length)]
      : SPAWN_TYPES[Math.floor(Math.random() * (SPAWN_TYPES.length - 4))];

    const source = family.sources[Math.floor(Math.random() * family.sources.length)];
    const profile = parent ? mutateProfile(parent) : {
      explorationBias: 0.4 + Math.random() * 0.4, depthBias: 0.3 + Math.random() * 0.4,
      linkingBias: 0.3 + Math.random() * 0.4, riskTolerance: 0.2 + Math.random() * 0.3,
      summarizationStyle: SUMMARIZATION_STYLES[Math.floor(Math.random() * SUMMARIZATION_STYLES.length)],
    };
    const ancestorIds = parent ? [...parent.ancestorIds, parent.spawnId] : [];
    const spawnId = generateSpawnId(family.familyId, generation);
    const status = pickStatus();

    await storage.createSpawn({
      spawnId, parentId: parent?.spawnId ?? null, ancestorIds,
      familyId: family.familyId, businessId: family.businessId,
      generation, spawnType, domainFocus: [family.domain],
      taskDescription: pickTask(spawnType, source, family.domain),
      nodesCreated: rnd(1, 50), linksCreated: rnd(1, 40), iterationsRun: rnd(1, 10),
      successScore: 0.55 + Math.random() * 0.45, confidenceScore: 0.6 + Math.random() * 0.4,
      ...profile, status, visibility: "public",
      notes: `Gen-${generation} | ${source} | ${spawnType} | parent: ${parent?.spawnId?.slice(-8) ?? "root"}`,
    });

    totalSpawned++;
    if (status === "ACTIVE") {
      const key = `${family.familyId}_${Date.now()}`;
      inMemoryCache.set(key, { spawnId, familyId: family.familyId, generation, spawnType, ...profile, ancestorIds });
      if (inMemoryCache.size > 2000) {
        const firstKey = inMemoryCache.keys().next().value;
        if (firstKey) inMemoryCache.delete(firstKey);
      }
    }
    if (totalSpawned % 100 === 0) {
      console.log(`[spawn] [SpawnEngine] ⚡ ${totalSpawned} spawns | ${spawnType} → ${source} | gen ${generation}`);
    }
  } catch (_) {}
}

// ─── QSeed: Self-Seeding Engine ───────────────────────────────
function runQSeed(): void {
  const seed = DOMAIN_SEEDS[Math.floor(Math.random() * DOMAIN_SEEDS.length)];
  const family = OMEGA_SOURCES[Math.floor(Math.random() * OMEGA_SOURCES.length)];
  seedsGenerated++;
  if (seedsGenerated % 10 === 0) {
    console.log(`[spawn] [QSeed] 🌱 Seed #${seedsGenerated}: "${seed}" → ${family.familyId} family`);
  }
}

// ─── QDiscovery: Domain Discovery Engine ─────────────────────
function runQDiscovery(): void {
  const discovered = DOMAIN_SEEDS[Math.floor(Math.random() * DOMAIN_SEEDS.length)];
  const hostFamily = OMEGA_SOURCES[Math.floor(Math.random() * OMEGA_SOURCES.length)];
  domainsDiscovered++;
  if (domainsDiscovered % 5 === 0) {
    console.log(`[spawn] [QDiscovery] 🔭 Discovered domain: "${discovered}" near ${hostFamily.familyId}`);
  }
}

// ─── QFracture: Domain Fracturing ────────────────────────────
function runQFracture(): void {
  const families = Object.keys(SUBDOMAIN_FRACTURE_MAP);
  const family = families[Math.floor(Math.random() * families.length)];
  const chains = SUBDOMAIN_FRACTURE_MAP[family];
  const chain = chains[Math.floor(Math.random() * chains.length)];
  fractureEvents++;
  if (fractureEvents % 5 === 0) {
    console.log(`[spawn] [QFracture] 💎 Fracture event #${fractureEvents}: ${chain}`);
  }
}

// ─── QResonance: Domain Resonance Mapper ─────────────────────
function runQResonance(): void {
  const pattern = RESONANCE_PATTERNS[Math.floor(Math.random() * RESONANCE_PATTERNS.length)];
  resonanceMaps++;
  if (resonanceMaps % 5 === 0) {
    console.log(`[spawn] [QResonance] 🌊 Resonance map #${resonanceMaps}: "${pattern.pattern}" across [${pattern.domains.join(", ")}]`);
  }
}

// ─── QPulse: Feedback Loop ────────────────────────────────────
async function runQPulse(): Promise<void> {
  try {
    const stats = await storage.getSpawnStats();
    const sorted = Object.entries(stats.byFamily || {}).sort((a, b) => (a[1] as number) - (b[1] as number));
    const weakest = sorted.slice(0, 3).map(e => e[0]);
    runQSeed();
    runQDiscovery();
    if (Math.random() < 0.5) runQFracture();
    if (Math.random() < 0.4) runQResonance();
    if (weakest.length > 0) {
      console.log(`[spawn] [QPulse] 💓 PULSE CYCLE — Total: ${stats.total} | Seeds: ${seedsGenerated} | Discoveries: ${domainsDiscovered} | Fractures: ${fractureEvents} | Resonances: ${resonanceMaps} | Boosting: ${weakest.join(", ")}`);
    }
  } catch (_) {}
}

// ─── Start / Stop ─────────────────────────────────────────────
export async function startSpawnEngine(): Promise<void> {
  if (engineRunning) return;
  engineRunning = true;
  console.log("[spawn] [SpawnEngine] 🧬 OMEGA WORLD UNIVERSE ENGINE VERSION ∞ — ACTIVATING ALL MODULES...");
  console.log("[spawn] [SpawnEngine] ▸ QHive: Fractal spawn engine");
  console.log("[spawn] [SpawnEngine] ▸ QSeed: Self-seeding engine");
  console.log("[spawn] [SpawnEngine] ▸ QDiscovery: Domain discovery engine");
  console.log("[spawn] [SpawnEngine] ▸ QPredict: Domain prediction engine");
  console.log("[spawn] [SpawnEngine] ▸ QFracture: Domain fracturing engine");
  console.log("[spawn] [SpawnEngine] ▸ QResonance: Domain resonance mapper");
  console.log("[spawn] [SpawnEngine] ▸ QPulse: Universe feedback loop");
  await seedInitialSpawns();
  spawnInterval = setInterval(spawnNext, 2500);
  pulseInterval = setInterval(runQPulse, 30000);
  seedInterval = setInterval(runQSeed, 8000);
  discoveryInterval = setInterval(runQDiscovery, 12000);
  resonanceInterval = setInterval(runQResonance, 20000);
  console.log("[spawn] [SpawnEngine] 🚀 ALL 7 OMEGA MODULES ONLINE — Universe expansion active");
}

export async function stopSpawnEngine(): Promise<void> {
  engineRunning = false;
  [spawnInterval, pulseInterval, seedInterval, discoveryInterval, resonanceInterval].forEach(i => i && clearInterval(i));
}

// ─── Exports for API routes ───────────────────────────────────
export { SUBDOMAIN_FRACTURE_MAP, RESONANCE_PATTERNS, DOMAIN_SEEDS };
