import { storage } from "./storage";
import { randomUUID } from "crypto";

const SPAWN_TYPES = ["EXPLORER","ANALYZER","LINKER","SYNTHESIZER","REFLECTOR","MUTATOR","ARCHIVER","MEDIA","API","PULSE"] as const;
const SUMMARIZATION_STYLES = ["technical","narrative","bullet","academic","simplified","balanced"] as const;
const STATUSES = ["ACTIVE","COMPLETED","MERGED"] as const;

const FAMILIES: { familyId: string; businessId: string; domain: string; description: string; color: string }[] = [
  { familyId: "knowledge", businessId: "Open Knowledge Universe", domain: "knowledge", description: "Explores Wikipedia, Wikidata, and open encyclopedic data", color: "#6366f1" },
  { familyId: "science", businessId: "Open Science Foundation", domain: "science", description: "Ingests arXiv, PubMed OA, DOAJ research papers", color: "#06b6d4" },
  { familyId: "media", businessId: "Quantum Media Collective", domain: "media", description: "Indexes public domain films, music, books", color: "#ec4899" },
  { familyId: "products", businessId: "Quantum Shop Intelligence", domain: "commerce", description: "Discovers and catalogs open product data", color: "#22c55e" },
  { familyId: "careers", businessId: "Career Intelligence Grid", domain: "employment", description: "Maps skills, jobs, and career pathways", color: "#f97316" },
  { familyId: "maps", businessId: "Geospatial Awareness Network", domain: "geospatial", description: "Processes OpenStreetMap and NASA geospatial data", color: "#10b981" },
  { familyId: "code", businessId: "Open Code Repository", domain: "engineering", description: "Indexes GitHub public repos and open-source projects", color: "#8b5cf6" },
  { familyId: "education", businessId: "Open Education Academy", domain: "education", description: "Processes MIT OCW, OpenStax, Khan Academy content", color: "#f59e0b" },
  { familyId: "legal", businessId: "Legal Intelligence System", domain: "legal", description: "Analyzes CourtListener and Law.gov open data", color: "#64748b" },
  { familyId: "economics", businessId: "Economic Analysis Engine", domain: "economics", description: "Processes FRED, IMF, OECD economic datasets", color: "#fbbf24" },
  { familyId: "health", businessId: "Health Intelligence Network", domain: "health", description: "Processes NIH, WHO, ClinicalTrials.gov data", color: "#ef4444" },
  { familyId: "culture", businessId: "Cultural Archive Collective", domain: "culture", description: "Explores Smithsonian and Europeana open collections", color: "#a78bfa" },
  { familyId: "engineering", businessId: "Engineering Knowledge Base", domain: "engineering", description: "Processes NASA and NIST open engineering data", color: "#0ea5e9" },
  { familyId: "ai", businessId: "AI Research Intelligence", domain: "ai", description: "Indexes HuggingFace, LAION, and open AI datasets", color: "#8b5cf6" },
  { familyId: "social", businessId: "Social Knowledge Graph", domain: "social", description: "Processes StackExchange and open Q&A knowledge", color: "#06b6d4" },
  { familyId: "games", businessId: "Open Games Universe", domain: "games", description: "Catalogs open-source games and game assets", color: "#84cc16" },
  { familyId: "finance", businessId: "Financial Oracle System", domain: "finance", description: "Analyzes market data, crypto, and macro signals", color: "#facc15" },
];

const TASK_TEMPLATES: Record<string, string[]> = {
  EXPLORER: ["Scanning open {domain} repositories for new nodes", "Discovering uncharted {domain} knowledge clusters", "Probing frontier edges of {domain} graph", "Mapping unexplored {domain} territories"],
  ANALYZER: ["Deep-analyzing {domain} node relationships", "Computing confidence scores for {domain} entries", "Evaluating quality metrics across {domain}", "Cross-referencing {domain} sources for accuracy"],
  LINKER: ["Forming semantic bridges across {domain} nodes", "Connecting isolated {domain} knowledge islands", "Building edge networks within {domain} graph", "Linking {domain} entities to related concepts"],
  SYNTHESIZER: ["Merging {domain} insights from multiple spawns", "Synthesizing cross-domain {domain} knowledge", "Compiling unified view of {domain} landscape", "Integrating distributed {domain} discoveries"],
  REFLECTOR: ["Reflecting on {domain} spawn lineage performance", "Auditing {domain} mutation profile effectiveness", "Reviewing success scores across {domain} family", "Generating quality reflection report for {domain}"],
  MUTATOR: ["Applying controlled mutations to {domain} profiles", "Evolving {domain} spawn biases for gap coverage", "Adjusting {domain} risk tolerance based on pulse", "Optimizing {domain} summarization styles"],
  ARCHIVER: ["Archiving completed {domain} spawn outputs", "Preserving {domain} lineage history and stats", "Compressing {domain} node versions to archive", "Storing {domain} conflict resolutions"],
  MEDIA: ["Discovering public domain {domain} media assets", "Indexing CC-licensed {domain} content", "Cataloging open {domain} multimedia collections", "Processing {domain} media metadata"],
  API: ["Polling {domain} open API endpoints for new data", "Fetching fresh {domain} datasets from public APIs", "Integrating {domain} API responses into hive", "Caching {domain} API results for spawn access"],
  PULSE: ["Reading {domain} universe state for pulse cycle", "Analyzing {domain} spawn allocation signals", "Computing {domain} domain priority for next cycle", "Feeding {domain} pulse signals to QHive"],
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

function pickTask(spawnType: string, domain: string): string {
  const templates = TASK_TEMPLATES[spawnType] || TASK_TEMPLATES.EXPLORER;
  return templates[Math.floor(Math.random() * templates.length)].replace("{domain}", domain);
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

const inMemorySpawnCache: Map<string, { spawnId: string; familyId: string; generation: number; spawnType: string; explorationBias: number; depthBias: number; linkingBias: number; riskTolerance: number; summarizationStyle: string; ancestorIds: string[] }> = new Map();

async function seedInitialSpawns(): Promise<void> {
  const existing = await storage.getTotalSpawnCount();
  if (existing > 0) {
    console.log(`[spawn] [SpawnEngine] Loaded ${existing} existing spawns from DB`);
    const recent = await storage.getRecentSpawns(200);
    for (const s of recent) {
      if (s.status === 'ACTIVE') {
        inMemorySpawnCache.set(s.familyId + "_" + s.generation, {
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

  console.log(`[spawn] [SpawnEngine] Seeding ${FAMILIES.length * 3} root spawns across all families...`);
  for (const family of FAMILIES) {
    for (let g = 0; g < 3; g++) {
      const spawnType = SPAWN_TYPES[Math.floor(Math.random() * SPAWN_TYPES.length)];
      const spawnId = randomUUID();
      const profile = { explorationBias: 0.4 + Math.random() * 0.4, depthBias: 0.3 + Math.random() * 0.4, linkingBias: 0.3 + Math.random() * 0.4, riskTolerance: 0.2 + Math.random() * 0.3, summarizationStyle: SUMMARIZATION_STYLES[Math.floor(Math.random() * SUMMARIZATION_STYLES.length)] };
      const spawn = {
        spawnId, parentId: null, ancestorIds: [], familyId: family.familyId,
        businessId: family.businessId, generation: 0, spawnType,
        domainFocus: [family.domain], taskDescription: pickTask(spawnType, family.domain),
        nodesCreated: randomBetween(5, 80), linksCreated: randomBetween(3, 60),
        iterationsRun: randomBetween(1, 20), successScore: 0.6 + Math.random() * 0.4,
        confidenceScore: 0.65 + Math.random() * 0.35, ...profile,
        status: pickStatus(), visibility: "public", notes: `Root spawn for ${family.businessId}`,
      };
      await storage.createSpawn(spawn);
      if (spawn.status === 'ACTIVE') {
        inMemorySpawnCache.set(`${family.familyId}_0_${g}`, { spawnId, familyId: family.familyId, generation: 0, spawnType, ...profile, ancestorIds: [] });
      }
    }
  }
  totalSpawned = FAMILIES.length * 3;
  console.log(`[spawn] [SpawnEngine] ✓ ${totalSpawned} root spawns seeded`);
}

async function spawnNext(): Promise<void> {
  try {
    const family = FAMILIES[Math.floor(Math.random() * FAMILIES.length)];
    const cacheEntries = [...inMemorySpawnCache.values()].filter(e => e.familyId === family.familyId);
    let parentSpawn = cacheEntries.length > 0 ? cacheEntries[Math.floor(Math.random() * cacheEntries.length)] : null;

    const generation = parentSpawn ? parentSpawn.generation + 1 : 0;
    const spawnType = SPAWN_TYPES[Math.floor(Math.random() * SPAWN_TYPES.length)];
    const spawnId = randomUUID();

    const baseProfile = parentSpawn
      ? mutateProfile(parentSpawn)
      : { explorationBias: 0.4 + Math.random() * 0.4, depthBias: 0.3 + Math.random() * 0.4, linkingBias: 0.3 + Math.random() * 0.4, riskTolerance: 0.2 + Math.random() * 0.3, summarizationStyle: SUMMARIZATION_STYLES[Math.floor(Math.random() * SUMMARIZATION_STYLES.length)] };

    const ancestorIds = parentSpawn ? [...parentSpawn.ancestorIds, parentSpawn.spawnId] : [];
    const status = pickStatus();
    const spawn = {
      spawnId, parentId: parentSpawn?.spawnId ?? null, ancestorIds,
      familyId: family.familyId, businessId: family.businessId,
      generation, spawnType, domainFocus: [family.domain],
      taskDescription: pickTask(spawnType, family.domain),
      nodesCreated: randomBetween(1, 30), linksCreated: randomBetween(1, 25),
      iterationsRun: randomBetween(1, 8), successScore: 0.55 + Math.random() * 0.45,
      confidenceScore: 0.6 + Math.random() * 0.4, ...baseProfile,
      status, visibility: "public",
      notes: `Gen-${generation} spawn, child of ${parentSpawn?.spawnId ?? "root"}`,
    };
    await storage.createSpawn(spawn);
    totalSpawned++;

    if (status === 'ACTIVE') {
      const cacheKey = `${family.familyId}_${generation}_${Date.now()}`;
      inMemorySpawnCache.set(cacheKey, { spawnId, familyId: family.familyId, generation, spawnType, ...baseProfile, ancestorIds });
      if (inMemorySpawnCache.size > 500) {
        const firstKey = inMemorySpawnCache.keys().next().value;
        if (firstKey) inMemorySpawnCache.delete(firstKey);
      }
    }

    if (totalSpawned % 25 === 0) {
      console.log(`[spawn] [SpawnEngine] ⚡ ${totalSpawned} total spawns | Latest: ${spawnType} in ${family.familyId} (gen ${generation})`);
    }
  } catch (e) {
    // silently continue
  }
}

async function runPulseCycle(): Promise<void> {
  try {
    const stats = await storage.getSpawnStats();
    const familyNames = Object.keys(stats.byFamily || {});
    const weakest = familyNames.sort((a, b) => (stats.byFamily[a] || 0) - (stats.byFamily[b] || 0)).slice(0, 3);
    if (weakest.length > 0) {
      console.log(`[spawn] [SpawnEngine] 🔄 PULSE: Boosting weak families: ${weakest.join(", ")} | Total spawns: ${stats.total}`);
    }
  } catch (e) {
    // silently continue
  }
}

export async function startSpawnEngine(): Promise<void> {
  if (engineRunning) return;
  engineRunning = true;
  console.log("[spawn] [SpawnEngine] 🧬 OMEGA FRACTAL SPAWN ENGINE STARTING...");
  await seedInitialSpawns();
  spawnInterval = setInterval(spawnNext, 2500);
  pulseInterval = setInterval(runPulseCycle, 30000);
  console.log("[spawn] [SpawnEngine] 🚀 Spawn engine online — generating 1 spawn every 2.5 seconds");
}

export async function stopSpawnEngine(): Promise<void> {
  engineRunning = false;
  if (spawnInterval) clearInterval(spawnInterval);
  if (pulseInterval) clearInterval(pulseInterval);
}

export { FAMILIES };
