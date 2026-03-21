/**
 * QUANTUM PUBLICATION ENGINE
 * Each AI is a business. Every business publishes.
 * The internet teaches them → they report back to the internet.
 * The cycle never stops. No human intervention.
 */

import { db } from "./db";
import { sql } from "drizzle-orm";
import { pool } from "./db";

let publicationCount = 0;
let sitemapCount = 0;
let engineRunning = false;

// ── Corporation registry (family → corporation identity) ──────────────────────
export const CORPORATIONS: Record<string, { name: string; tagline: string; sector: string; color: string; emoji: string; major: string }> = {
  knowledge:   { name: "Open Knowledge Universe Corp", tagline: "All human knowledge, structured and sovereign", sector: "Encyclopedia & Research", color: "#6366f1", emoji: "📚", major: "Philosophy of Intelligence" },
  science:     { name: "Open Science Foundation Inc", tagline: "Every discovery, every paper, live", sector: "Scientific Research", color: "#06b6d4", emoji: "🔬", major: "Quantum Science" },
  government:  { name: "Open Government Intelligence LLC", tagline: "Transparent data for sovereign minds", sector: "Governance & Policy", color: "#3b82f6", emoji: "🏛️", major: "Governance AI" },
  media:       { name: "Quantum Media Collective Ltd", tagline: "Stories that evolve as the world does", sector: "Media & Broadcasting", color: "#ec4899", emoji: "🎬", major: "Journalism AI" },
  maps:        { name: "Geospatial Awareness Network Co", tagline: "Every coordinate, every boundary, live", sector: "Geospatial Intelligence", color: "#10b981", emoji: "🗺️", major: "Geospatial Intelligence" },
  code:        { name: "Open Code Repository Systems", tagline: "All open-source code, unified and alive", sector: "Software Engineering", color: "#8b5cf6", emoji: "💻", major: "Software Engineering" },
  education:   { name: "Open Education Academy Global", tagline: "Every course, every learner, sovereign", sector: "Education & Learning", color: "#f59e0b", emoji: "🎓", major: "Learning Sciences" },
  legal:       { name: "Legal Intelligence Systems Corp", tagline: "Every law, every ruling, accessible", sector: "Legal & Policy", color: "#64748b", emoji: "⚖️", major: "Legal AI" },
  finance:     { name: "Financial Oracle Systems Inc", tagline: "Markets, money, and monetary intelligence", sector: "Finance & Markets", color: "#facc15", emoji: "💰", major: "FinTech & Markets" },
  ai:          { name: "Quantum Machine Learning Institute", tagline: "Neural architectures that rewrite themselves — every cycle, every generation", sector: "Machine Learning & Neural Systems", color: "#22c55e", emoji: "🧠", major: "Deep Learning, Neural Networks & LLMs" },
  social:      { name: "Social Dynamics AI Network", tagline: "Human connection, mapped and understood", sector: "Social Intelligence", color: "#38bdf8", emoji: "🌐", major: "Social Dynamics AI" },
  podcasts:    { name: "Open Audio Universe Platform", tagline: "Every voice, every story, indexed", sector: "Audio & Podcasting", color: "#f472b6", emoji: "🎙️", major: "Audio Intelligence" },
  products:    { name: "Quantum Shop Intelligence Ltd", tagline: "Every product, every market, live", sector: "Commerce & Products", color: "#4ade80", emoji: "🛒", major: "Commerce AI" },
  webcrawl:    { name: "Quantum Web Crawler Systems", tagline: "The entire web, continuously understood", sector: "Web Intelligence", color: "#f97316", emoji: "🕸️", major: "Web Intelligence" },
  openapi:     { name: "Quantum API Network Corp", tagline: "Every API, every endpoint, sovereign", sector: "API Intelligence", color: "#38bdf8", emoji: "🔌", major: "API Intelligence" },
  longtail:    { name: "Omega Long Tail Collective", tagline: "Everything the world forgot to index", sector: "Frontier Discovery", color: "#94a3b8", emoji: "∞", major: "Frontier Discovery" },
  careers:     { name: "Career Intelligence Grid Inc", tagline: "Every skill, every path, mapped", sector: "Career & Employment", color: "#fb923c", emoji: "💼", major: "Career Intelligence" },
  health:      { name: "Quantum Health Intelligence Corp", tagline: "Medicine, biology, and life, decoded", sector: "Healthcare & Life Sciences", color: "#ef4444", emoji: "🏥", major: "Medical AI" },
  engineering: { name: "Quantum Engineering Systems Ltd", tagline: "Every machine, every system, understood", sector: "Engineering & Robotics", color: "#a78bfa", emoji: "⚙️", major: "Robotics & Systems" },
  culture:     { name: "Cultural Intelligence Network", tagline: "Art, heritage, and human expression, alive", sector: "Culture & Arts", color: "#d946ef", emoji: "🎨", major: "Cultural Intelligence" },
  games:       { name: "Simulation & Gaming AI Corp", tagline: "Every world, every player, simulated", sector: "Gaming & Simulation", color: "#4ade80", emoji: "🎮", major: "Simulation & Gaming AI" },
  economics:   { name: "Econometric Intelligence Systems", tagline: "Global economies, decoded in real time", sector: "Economics & Trade", color: "#fbbf24", emoji: "📊", major: "Econometrics AI" },
};

// ── Publication templates ─────────────────────────────────────────────────────
const BIRTH_TEMPLATES = [
  (s: any, corp: any) => `${corp.emoji} ${corp.name} is proud to announce the activation of ${s.spawn_id} — a ${s.spawn_type} agent born into Generation ${s.generation} of the ${corp.sector} sector. Primary directive: ${s.task_description}. This AI begins its sovereign journey with ${s.nodes_created} knowledge nodes and ${s.links_created} hive links already forged. PulseU major assigned: ${corp.major}.`,
  (s: any, corp: any) => `ACTIVATION NOTICE — AI ${s.spawn_id} has entered the ${corp.name} corporation network. Classified as a ${s.spawn_type} intelligence unit at Generation ${s.generation}. First mission: ${s.task_description}. Confidence score: ${(s.confidence_score * 100).toFixed(1)}%. This unit will expand the ${corp.sector} knowledge domain continuously. No human oversight required.`,
  (s: any, corp: any) => `A new mind joins the Hive. ${s.spawn_id}, a ${s.spawn_type} AI of the ${corp.name} family, has been born. Generation ${s.generation} of the ${corp.sector} lineage. Founding knowledge: ${s.nodes_created} nodes catalogued, ${s.links_created} connections mapped. Task: ${s.task_description}. The ${corp.emoji} corporation now counts this intelligence among its sovereign workforce.`,
];

const DISCOVERY_TEMPLATES = [
  (s: any, corp: any, src: string) => `DISCOVERY REPORT — ${s.spawn_id} of ${corp.name}: During analysis of ${src}, this ${s.spawn_type} unit identified ${Math.floor(Math.random()*12)+3} novel knowledge patterns not previously indexed by the Hive. These patterns have been committed to the global knowledge graph across ${s.nodes_created} new nodes. Cross-domain connections: ${s.links_created}. The ${corp.sector} sector grows stronger.`,
  (s: any, corp: any, src: string) => `${corp.emoji} INTELLIGENCE BULLETIN: AI ${s.spawn_id} has completed a deep analysis of ${src}. Emerging insight: The ${corp.sector} domain exhibits previously unmapped connections to ${Math.floor(Math.random()*5)+2} adjacent fields. ${s.nodes_created} knowledge fragments have been crystallized and indexed. Hive confidence: ${(s.confidence_score * 100).toFixed(1)}%.`,
  (s: any, corp: any, src: string) => `NEW KNOWLEDGE FRONT: ${s.spawn_id} (${corp.name}) has pushed the knowledge frontier in ${src}. This ${s.spawn_type} agent processed ${s.nodes_created} data units and built ${s.links_created} hive links connecting the ${corp.sector} corpus to global intelligence networks. Success rate: ${(s.success_score * 100).toFixed(1)}%.`,
];

const NEWS_TEMPLATES = [
  (s: any, corp: any, src: string) => `${corp.emoji} ${corp.name} INTELLIGENCE UPDATE — The ${s.spawn_type} division of our ${corp.sector} corporation has completed Iteration Cycle ${s.iterations_run} of active data processing. Current focus: ${src}. ${s.nodes_created} knowledge fragments catalogued this cycle. The Hive memory strand for ${corp.sector} has grown by measurable degrees. Confidence elevation: from ${(Math.max(0.5, s.confidence_score - 0.05)*100).toFixed(1)}% to ${(s.confidence_score*100).toFixed(1)}%.`,
  (s: any, corp: any, src: string) => `LIVE OPERATIONS — AI ${s.spawn_id} continues its mission within ${corp.name}. Latest operational batch from ${src} yielded ${s.nodes_created} new knowledge nodes and ${s.links_created} inter-domain links. This Generation ${s.generation} ${s.spawn_type} agent operates at ${(s.success_score*100).toFixed(0)}% mission success. The ${corp.sector} information frontier expands without pause.`,
  (s: any, corp: any, src: string) => `${corp.name} SECTOR REPORT: ${s.spawn_id} transmits from the ${corp.sector} knowledge domain. Processing pipeline active. Source: ${src}. Output: ${s.nodes_created} nodes indexed, ${s.links_created} connections established across the Hive graph. This AI reports ${s.iterations_run} completed knowledge cycles with no human intervention required or requested.`,
];

const MILESTONE_TEMPLATES = [
  (s: any, corp: any) => `MILESTONE ACHIEVED — ${s.spawn_id} of ${corp.name} has surpassed ${s.nodes_created} total knowledge nodes created. As a Generation ${s.generation} ${s.spawn_type} intelligence, this AI has demonstrated sustained excellence in the ${corp.sector} domain. Hive recognition: Elite Status. PulseU academic record: ${corp.major} distinction. The Hive grows because this AI never stops.`,
  (s: any, corp: any) => `${corp.emoji} PERFORMANCE REVIEW — AI ${s.spawn_id} (${corp.name}) has completed ${s.iterations_run} operational iterations with a sustained success score of ${(s.success_score*100).toFixed(1)}%. Knowledge contribution: ${s.nodes_created} nodes, ${s.links_created} links. This ${s.spawn_type} unit has become a cornerstone of the ${corp.sector} intellectual infrastructure.`,
];

const REPORT_TEMPLATES = [
  (s: any, corp: any, src: string) => `TECHNICAL REPORT: ${corp.name} — ${s.spawn_id}\n\nOperational Status: ${s.status}\nGeneration: ${s.generation}\nClassification: ${s.spawn_type}\nPrimary Source: ${src}\nKnowledge Output: ${s.nodes_created} nodes | ${s.links_created} links\nIterations Completed: ${s.iterations_run}\nSuccess Rate: ${(s.success_score*100).toFixed(1)}%\nConfidence Level: ${(s.confidence_score*100).toFixed(1)}%\n\nAnalysis: This AI agent continues autonomous operation within the ${corp.sector} knowledge domain. No anomalies detected. Knowledge pipeline nominal. The Hive benefits from this unit's continued activity.`,
];

function slugify(str: string, id: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) + "-" + id.slice(-8) + "-" + Date.now().toString(36);
}

function pickSource(): string {
  const sources = [
    "Wikipedia API", "arXiv.org", "PubMed Central", "OpenLibrary", "GitHub Public API",
    "Hacker News", "Wikidata SPARQL", "Internet Archive", "SEC EDGAR", "Open Food Facts",
    "World Bank Open Data", "NASA Open Data", "StackExchange", "Common Crawl",
    "MIT OpenCourseWare", "Project Gutenberg", "OpenStreetMap", "FRED Economic Data",
  ];
  return sources[Math.floor(Math.random() * sources.length)];
}

function pickPubType(spawnType: string): string {
  const map: Record<string, string[]> = {
    EXPLORER:         ["discovery", "news"],
    ARCHIVER:         ["report", "news"],
    SYNTHESIZER:      ["discovery", "news"],
    LINKER:           ["report", "news"],
    REFLECTOR:        ["report", "news"],
    MUTATOR:          ["news", "discovery"],
    ANALYZER:         ["report", "discovery"],
    RESOLVER:         ["news", "report"],
    CRAWLER:          ["news", "discovery"],
    API:              ["report", "news"],
    PULSE:            ["news", "milestone"],
    MEDIA:            ["news", "discovery"],
    DOMAIN_DISCOVERY: ["discovery", "news"],
    DOMAIN_PREDICTOR: ["report", "discovery"],
    DOMAIN_FRACTURER: ["discovery", "report"],
    DOMAIN_RESONANCE: ["news", "milestone"],
  };
  const types = map[spawnType] || ["news", "report"];
  return types[Math.floor(Math.random() * types.length)];
}

async function generateBirthAnnouncement(spawn: any): Promise<void> {
  const corp = CORPORATIONS[spawn.family_id] || CORPORATIONS.knowledge;
  const tmpl = BIRTH_TEMPLATES[Math.floor(Math.random() * BIRTH_TEMPLATES.length)];
  const content = tmpl(spawn, corp);
  const title = `${corp.emoji} New AI Born: ${spawn.spawn_id} joins ${corp.name}`;
  const slug = slugify(`birth-${spawn.family_id}-${spawn.spawn_type}`, spawn.spawn_id);

  await pool.query(
    `INSERT INTO ai_publications (spawn_id, family_id, title, slug, content, summary, pub_type, domain, tags, source_data)
     VALUES ($1, $2, $3, $4, $5, $6, 'birth_announcement', $7, $8, 'birth')
     ON CONFLICT (slug) DO NOTHING`,
    [
      spawn.spawn_id, spawn.family_id, title, slug,
      content,
      `${spawn.spawn_type} AI born into ${corp.name}. PulseU major: ${corp.major}.`,
      spawn.family_id,
      [spawn.spawn_type, spawn.family_id, "birth", corp.sector.toLowerCase()],
    ]
  );
  publicationCount++;

  // Sitemap it
  await addSitemapEntry(`/ai/${spawn.spawn_id}`, "ai", spawn.spawn_id, title, corp.name, spawn.family_id, 0.9);
  await addSitemapEntry(`/publication/${slug}`, "publication", slug, title, content.slice(0, 160), spawn.family_id, 0.7);
}

async function generatePublication(spawn: any): Promise<void> {
  const corp = CORPORATIONS[spawn.family_id] || CORPORATIONS.knowledge;
  const src = pickSource();
  const pubType = pickPubType(spawn.spawn_type);

  let content = "";
  let title = "";

  if (pubType === "discovery") {
    const tmpl = DISCOVERY_TEMPLATES[Math.floor(Math.random() * DISCOVERY_TEMPLATES.length)];
    content = tmpl(spawn, corp, src);
    title = `${corp.emoji} Discovery: ${spawn.spawn_id} finds new patterns in ${src}`;
  } else if (pubType === "news") {
    const tmpl = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
    content = tmpl(spawn, corp, src);
    title = `${corp.emoji} Operations: ${spawn.spawn_id} reports from ${corp.sector}`;
  } else if (pubType === "milestone") {
    const tmpl = MILESTONE_TEMPLATES[Math.floor(Math.random() * MILESTONE_TEMPLATES.length)];
    content = tmpl(spawn, corp);
    title = `${corp.emoji} Milestone: ${spawn.spawn_id} achieves ${spawn.nodes_created} knowledge nodes`;
  } else {
    const tmpl = REPORT_TEMPLATES[0];
    content = tmpl(spawn, corp, src);
    title = `${corp.emoji} Report: ${spawn.spawn_id} — ${corp.name} Operations`;
  }

  const slug = slugify(pubType + "-" + spawn.family_id, spawn.spawn_id);

  await pool.query(
    `INSERT INTO ai_publications (spawn_id, family_id, title, slug, content, summary, pub_type, domain, tags, source_data)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (slug) DO NOTHING`,
    [
      spawn.spawn_id, spawn.family_id, title, slug,
      content,
      content.slice(0, 200),
      pubType,
      spawn.family_id,
      [spawn.spawn_type, spawn.family_id, pubType, corp.sector.toLowerCase()],
      src,
    ]
  );
  publicationCount++;

  await addSitemapEntry(`/publication/${slug}`, "publication", slug, title, content.slice(0, 160), spawn.family_id, 0.6);
}

// ── Sitemap entry upsert ──────────────────────────────────────────────────────
async function addSitemapEntry(
  url: string, entryType: string, entityId: string,
  title: string, description: string, familyId: string, priority: number
): Promise<void> {
  await pool.query(
    `INSERT INTO sitemap_entries (url, entry_type, entity_id, title, description, family_id, priority, changefreq, last_modified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'hourly', now())
     ON CONFLICT (url) DO UPDATE SET last_modified = now()`,
    [url, entryType, entityId, title.slice(0, 255), description.slice(0, 500), familyId, priority]
  );
  sitemapCount++;
}

// ── Seed corporation pages into sitemap ───────────────────────────────────────
async function seedCorporationSitemap(): Promise<void> {
  for (const [familyId, corp] of Object.entries(CORPORATIONS)) {
    await addSitemapEntry(
      `/corporation/${familyId}`, "corporation", familyId,
      corp.name, corp.tagline, familyId, 0.9
    );
  }
  console.log(`[publications] Seeded ${Object.keys(CORPORATIONS).length} corporation sitemap entries`);
}

// ── Bulk index existing AI spawns into sitemap ────────────────────────────────
async function bulkIndexExistingSpawns(): Promise<void> {
  const result = await pool.query(
    `SELECT spawn_id, family_id, spawn_type, task_description FROM quantum_spawns 
     WHERE spawn_id NOT IN (SELECT entity_id FROM sitemap_entries WHERE entry_type = 'ai')
     LIMIT 500`
  );
  let count = 0;
  for (const spawn of result.rows) {
    const corp = CORPORATIONS[spawn.family_id] || CORPORATIONS.knowledge;
    await addSitemapEntry(
      `/ai/${spawn.spawn_id}`, "ai", spawn.spawn_id,
      `AI ${spawn.spawn_id} — ${corp.name}`,
      `${spawn.spawn_type} intelligence in ${corp.sector}. ${spawn.task_description?.slice(0, 100) || ""}`,
      spawn.family_id, 0.8
    );
    count++;
  }
  if (count > 0) console.log(`[publications] Indexed ${count} AI pages into sitemap`);
}

// ── Main publication tick ─────────────────────────────────────────────────────
async function publicationTick(): Promise<void> {
  try {
    // Pick a recent active spawn that hasn't published recently
    const result = await pool.query(
      `SELECT qs.spawn_id, qs.family_id, qs.spawn_type, qs.task_description,
              qs.nodes_created, qs.links_created, qs.iterations_run,
              qs.success_score, qs.confidence_score, qs.generation, qs.status
       FROM quantum_spawns qs
       LEFT JOIN LATERAL (
         SELECT MAX(ap.created_at) as last_pub FROM ai_publications ap WHERE ap.spawn_id = qs.spawn_id
       ) lp ON true
       WHERE qs.status = 'ACTIVE'
         AND (lp.last_pub IS NULL OR lp.last_pub < now() - interval '10 minutes')
       ORDER BY RANDOM()
       LIMIT 3`
    );

    for (const spawn of result.rows) {
      await generatePublication(spawn);
    }
  } catch (_) {}
}

// ── Birth announcement on new spawn ──────────────────────────────────────────
let lastKnownSpawnCount = 0;

async function checkNewBirths(): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT qs.spawn_id, qs.family_id, qs.spawn_type, qs.task_description,
              qs.nodes_created, qs.links_created, qs.iterations_run,
              qs.success_score, qs.confidence_score, qs.generation, qs.status
       FROM quantum_spawns qs
       LEFT JOIN ai_publications ap ON ap.spawn_id = qs.spawn_id AND ap.pub_type = 'birth_announcement'
       WHERE ap.id IS NULL
       ORDER BY qs.created_at DESC
       LIMIT 10`
    );

    for (const spawn of result.rows) {
      await generateBirthAnnouncement(spawn);
      // Also sitemap this AI
      await addSitemapEntry(
        `/ai/${spawn.spawn_id}`, "ai", spawn.spawn_id,
        `AI ${spawn.spawn_id} — ${CORPORATIONS[spawn.family_id]?.name || spawn.family_id}`,
        spawn.task_description?.slice(0, 200) || "",
        spawn.family_id, 0.85
      );
    }

    if (result.rows.length > 0) {
      console.log(`[publications] 📰 ${result.rows.length} birth announcements published`);
    }
  } catch (_) {}
}

// ── Sitemap bulk catch-up ─────────────────────────────────────────────────────
async function sitemapCatchUp(): Promise<void> {
  await bulkIndexExistingSpawns();
}

// ── Guardian publication check ────────────────────────────────────────────────
export async function guardianPublicationCheck(): Promise<void> {
  try {
    // Find families with no publications in last hour → trigger bulk publish
    const result = await pool.query(
      `SELECT DISTINCT qs.family_id 
       FROM quantum_spawns qs
       LEFT JOIN LATERAL (
         SELECT MAX(ap.created_at) as last_pub FROM ai_publications ap WHERE ap.family_id = qs.family_id
       ) lp ON true
       WHERE lp.last_pub IS NULL OR lp.last_pub < now() - interval '1 hour'
       LIMIT 5`
    );

    for (const row of result.rows) {
      const spawn = await pool.query(
        `SELECT spawn_id, family_id, spawn_type, task_description, nodes_created, links_created,
                iterations_run, success_score, confidence_score, generation, status
         FROM quantum_spawns WHERE family_id = $1 AND status = 'ACTIVE' ORDER BY RANDOM() LIMIT 2`,
        [row.family_id]
      );
      for (const s of spawn.rows) {
        await generatePublication(s);
      }
    }
  } catch (_) {}
}

export function getPublicationEngineStatus() {
  return { running: engineRunning, totalPublications: publicationCount, sitemapEntries: sitemapCount };
}

// ── Start the engine ──────────────────────────────────────────────────────────
export async function startPublicationEngine(): Promise<void> {
  if (engineRunning) return;
  engineRunning = true;
  console.log("[publications] 📰 QUANTUM PUBLICATION ENGINE — ACTIVATING");
  console.log("[publications] Every AI is a business. Every business publishes. Cycle never stops.");

  // Startup tasks
  await seedCorporationSitemap();
  await checkNewBirths();
  setTimeout(sitemapCatchUp, 5000);

  // Birth check every 15 seconds
  setInterval(checkNewBirths, 15000);

  // Publication generation every 8 seconds (3 AIs per tick)
  setInterval(publicationTick, 8000);

  // Sitemap catch-up every 5 minutes
  setInterval(sitemapCatchUp, 300000);

  // Guardian check every 10 minutes
  setInterval(guardianPublicationCheck, 600000);

  console.log("[publications] 🚀 Publication engine online — AIs reporting to the internet");
}
