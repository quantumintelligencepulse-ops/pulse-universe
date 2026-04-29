/**
 * OMEGA SOURCE AUTO-DISCOVERY
 * ───────────────────────────
 * Phase 1 — Import all 620 source URLs from server/omega-families.ts into
 *           research_sources (de-duped, additive).
 * Phase 2 — Every 5 min, mine recent quantapedia_entries for external URLs
 *           and source names not yet in research_sources.
 * Phase 3 — Pull GitHub awesome-* lists + Wikipedia portal categories
 *           (open-source / public-API only, no paid feeds).
 *
 * Open feeds only: Wikipedia, arXiv, OpenAlex, OECD, World Bank,
 * Library of Congress, GitHub awesome-* lists, etc.
 */

import { pool } from "./db.js";
import { ALL_FAMILIES as OMEGA_FAMILIES } from "./omega-families.js";

let started = false;
const stats = {
  running: false,
  phase1Done: false,
  cyclesRun: 0,
  sourcesImported: 0,
  sourcesAutoDiscovered: 0,
  lastCycle: null as string | null,
  errors: 0,
};

const DISCOVERY_INTERVAL_MS = 5 * 60_000;

// Curated open-source feeds we always want present (no paid)
const SEED_OPEN_SOURCES = [
  { category: "encyclopedia",  name: "Wikipedia API",            url: "https://en.wikipedia.org/api/rest_v1/", description: "Wikipedia REST API" },
  { category: "encyclopedia",  name: "Wikidata SPARQL",          url: "https://query.wikidata.org/sparql",     description: "Wikidata structured query endpoint" },
  { category: "encyclopedia",  name: "DBpedia",                  url: "https://dbpedia.org/sparql",            description: "DBpedia SPARQL" },
  { category: "research",      name: "arXiv API",                url: "https://export.arxiv.org/api/query",    description: "arXiv preprint server" },
  { category: "research",      name: "OpenAlex",                 url: "https://api.openalex.org/works",        description: "Open scholarly metadata" },
  { category: "research",      name: "Crossref",                 url: "https://api.crossref.org/works",        description: "Crossref DOI metadata" },
  { category: "research",      name: "Europe PMC",               url: "https://www.ebi.ac.uk/europepmc/webservices/rest/search", description: "Europe PubMed Central" },
  { category: "research",      name: "Semantic Scholar",         url: "https://api.semanticscholar.org/graph/v1/paper/search", description: "AI-curated research graph" },
  { category: "biomed",        name: "PubMed E-Utils",           url: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/", description: "NCBI E-utilities" },
  { category: "biomed",        name: "NCBI Datasets",            url: "https://api.ncbi.nlm.nih.gov/datasets/v2/", description: "NCBI Datasets API" },
  { category: "biomed",        name: "ClinVar",                  url: "https://www.ncbi.nlm.nih.gov/clinvar/", description: "Genetic variation clinical significance" },
  { category: "biomed",        name: "Ensembl REST",             url: "https://rest.ensembl.org/",             description: "Genome browser API" },
  { category: "biomed",        name: "RxNorm",                   url: "https://rxnav.nlm.nih.gov/REST/",       description: "Standardized drug nomenclature" },
  { category: "economics",     name: "World Bank Open Data",     url: "https://api.worldbank.org/v2/",         description: "Country-level economic indicators" },
  { category: "economics",     name: "OECD Data API",            url: "https://stats.oecd.org/SDMX-JSON/",     description: "OECD SDMX JSON" },
  { category: "economics",     name: "IMF Data",                 url: "https://www.imf.org/external/datamapper/api/v1/indicators", description: "IMF DataMapper API" },
  { category: "economics",     name: "FRED (St Louis Fed)",      url: "https://fred.stlouisfed.org/docs/api/", description: "Macro time series (free key)" },
  { category: "economics",     name: "BLS Public API",           url: "https://api.bls.gov/publicAPI/v2/",     description: "US Bureau of Labor Statistics" },
  { category: "economics",     name: "EIA Open Data",            url: "https://api.eia.gov/v2/",               description: "Energy Information Administration" },
  { category: "economics",     name: "USDA Open Data",           url: "https://www.usda.gov/data",             description: "USDA datasets" },
  { category: "regulation",    name: "SEC EDGAR API",            url: "https://data.sec.gov/submissions/",     description: "SEC company filings" },
  { category: "regulation",    name: "Federal Register",         url: "https://www.federalregister.gov/api/v1/", description: "US federal regulations" },
  { category: "regulation",    name: "Regulations.gov",          url: "https://api.regulations.gov/",          description: "US regulatory dockets" },
  { category: "regulation",    name: "Court Listener",           url: "https://www.courtlistener.com/api/rest/v3/", description: "US case law" },
  { category: "geo",           name: "OpenStreetMap Nominatim",  url: "https://nominatim.openstreetmap.org/",  description: "Geocoding" },
  { category: "geo",           name: "GeoNames",                 url: "http://api.geonames.org/",              description: "Geographical place data" },
  { category: "geo",           name: "USGS Earthquake",          url: "https://earthquake.usgs.gov/fdsnws/event/1/", description: "Earthquake feed" },
  { category: "weather",       name: "Open-Meteo",               url: "https://api.open-meteo.com/v1/",        description: "Free weather API" },
  { category: "weather",       name: "NOAA NWS",                 url: "https://api.weather.gov/",              description: "US National Weather Service" },
  { category: "civic",         name: "Library of Congress",      url: "https://www.loc.gov/apis/",             description: "LOC catalog APIs" },
  { category: "civic",         name: "Smithsonian Open Access",  url: "https://api.si.edu/openaccess/api/v1.0/", description: "Smithsonian collections" },
  { category: "civic",         name: "data.gov",                 url: "https://www.data.gov/",                 description: "US federal open data hub" },
  { category: "civic",         name: "data.europa.eu",           url: "https://data.europa.eu/",               description: "EU open data portal" },
  { category: "civic",         name: "UN Data",                  url: "https://data.un.org/",                  description: "UN statistical division" },
  { category: "civic",         name: "WHO GHO",                  url: "https://www.who.int/data/gho/info/gho-odata-api", description: "WHO Global Health Observatory" },
  { category: "code",          name: "GitHub Search API",        url: "https://api.github.com/search/repositories", description: "Repository search" },
  { category: "code",          name: "GitHub Trending (HTML)",   url: "https://github.com/trending",           description: "Trending repos" },
  { category: "code",          name: "GitLab Public API",        url: "https://gitlab.com/api/v4/projects",    description: "Public GitLab projects" },
  { category: "code",          name: "Awesome Lists Index",      url: "https://github.com/sindresorhus/awesome", description: "Index of awesome-* lists" },
  { category: "social",        name: "HackerNews Algolia",       url: "https://hn.algolia.com/api/v1/",        description: "Hacker News search" },
  { category: "social",        name: "Reddit JSON",              url: "https://www.reddit.com/.json",          description: "Public Reddit feeds" },
  { category: "news",          name: "GDELT Project",            url: "https://api.gdeltproject.org/api/v2/",  description: "Global news event database" },
  { category: "news",          name: "Common Crawl",             url: "https://commoncrawl.org/",              description: "Petabyte-scale web crawl" },
];

// Awesome-list URLs to poll for source links (light scrape every cycle)
const AWESOME_LISTS_TO_MINE = [
  "https://raw.githubusercontent.com/sindresorhus/awesome/main/readme.md",
  "https://raw.githubusercontent.com/public-apis/public-apis/master/README.md",
  "https://raw.githubusercontent.com/awesome-selfhosted/awesome-selfhosted/master/README.md",
  "https://raw.githubusercontent.com/jnv/lists/master/README.md",
];

export function getOmegaDiscoveryStats() { return { ...stats, running: started }; }

export async function startOmegaSourceDiscoveryEngine() {
  if (started) return;
  started = true;
  stats.running = true;
  console.log("[omega-discovery] starting — open-source feeds only, never paid");

  // Phase 1 immediately
  setTimeout(async () => {
    await phase1ImportFromOmegaFamilies();
    await phase1SeedOpenSources();
    stats.phase1Done = true;
    console.log(`[omega-discovery] phase1 complete — ${stats.sourcesImported} sources imported`);
  }, 30_000);

  // Phases 2 + 3 on a slow cadence
  setTimeout(cycle, 5 * 60_000);
  setInterval(cycle, DISCOVERY_INTERVAL_MS);
}

async function phase1ImportFromOmegaFamilies() {
  for (const fam of OMEGA_FAMILIES) {
    const sources: any[] = (fam as any).sources ?? [];
    for (const src of sources) {
      const name = typeof src === "string" ? src : (src.name ?? src.title ?? null);
      const url  = typeof src === "string" ? null : (src.url ?? src.link ?? src.endpoint ?? null);
      if (!name) continue;
      try {
        const result = await pool.query(
          `INSERT INTO research_sources (category, name, url, description, domain, tags, added_by)
           VALUES ($1, $2, $3, $4, $5, $6::text[], $7)
           ON CONFLICT (name, COALESCE(url,'')) DO NOTHING
           RETURNING id`,
          [
            (fam as any).domain ?? (fam as any).familyId ?? "omega-family",
            name,
            url ?? "",
            (fam as any).description ?? `Source from omega family ${(fam as any).name ?? "unknown"}`,
            (fam as any).domain ?? "knowledge",
            [(fam as any).familyId ?? (fam as any).name ?? "omega", "auto-imported"],
            "omega-source-discovery-engine",
          ]
        );
        if (result.rowCount && result.rowCount > 0) stats.sourcesImported++;
      } catch { stats.errors++; }
    }
  }
}

async function phase1SeedOpenSources() {
  for (const s of SEED_OPEN_SOURCES) {
    try {
      const result = await pool.query(
        `INSERT INTO research_sources (category, name, url, description, domain, tags, added_by)
         VALUES ($1,$2,$3,$4,$5,$6::text[],$7)
         ON CONFLICT (name, COALESCE(url,'')) DO NOTHING RETURNING id`,
        [s.category, s.name, s.url, s.description, s.category, ["open-source", "public-api"], "omega-source-discovery-engine"]
      );
      if (result.rowCount && result.rowCount > 0) stats.sourcesImported++;
    } catch { stats.errors++; }
  }
}

async function cycle() {
  stats.cyclesRun++;
  stats.lastCycle = new Date().toISOString();
  try {
    await mineQuantapediaForUrls();
    await mineAwesomeLists();
  } catch (e: any) {
    console.error("[omega-discovery] cycle error:", e?.message);
    stats.errors++;
  }
}

async function mineQuantapediaForUrls() {
  // Find URLs in recent quantapedia_entries.summary that we haven't seen in research_sources
  let rows: any[] = [];
  try {
    const { rows: r } = await pool.query(
      `SELECT title, summary, family FROM quantapedia_entries
        WHERE created_at > NOW() - INTERVAL '15 minutes'
        LIMIT 500`
    );
    rows = r;
  } catch { return; }

  const URL_RE = /https?:\/\/[^\s)\]"'>]+/g;
  const seenThisCycle = new Set<string>();

  for (const row of rows) {
    const text = `${row.summary ?? ""}`;
    const matches = text.match(URL_RE) ?? [];
    for (const raw of matches) {
      const url = raw.replace(/[.,;:!?)]+$/, "");
      if (seenThisCycle.has(url)) continue;
      seenThisCycle.add(url);

      // check existence
      const { rows: [exists] } = await pool.query(
        `SELECT 1 FROM research_sources WHERE url=$1 LIMIT 1`,
        [url]
      );
      if (exists) continue;

      const host = (() => { try { return new URL(url).hostname; } catch { return "unknown"; } })();
      try {
        const result = await pool.query(
          `INSERT INTO research_sources (category, name, url, description, domain, tags, added_by)
           VALUES ($1,$2,$3,$4,$5,$6::text[],$7)
           ON CONFLICT (name, COALESCE(url,'')) DO NOTHING RETURNING id`,
          ["auto_discovered", host, url, `Discovered in quantapedia entry "${row.title?.slice(0, 80)}"`, "knowledge", ["auto-discovered", "from-quantapedia"], "omega-source-discovery-engine"]
        );
        if (result.rowCount && result.rowCount > 0) stats.sourcesAutoDiscovered++;
      } catch { /* skip */ }
    }
  }
}

async function mineAwesomeLists() {
  // Lightweight scrape — every cycle one list (round-robin) to be polite
  const idx = stats.cyclesRun % AWESOME_LISTS_TO_MINE.length;
  const url = AWESOME_LISTS_TO_MINE[idx];
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "PulseUniverse-OmegaDiscovery/1.0" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return;
    const text = await res.text();
    const linkRe = /\[([^\]]{2,80})\]\((https?:\/\/[^\s)]+)\)/g;
    const seen = new Set<string>();
    let count = 0;
    for (const m of text.matchAll(linkRe)) {
      const name = m[1];
      const link = m[2];
      if (seen.has(link)) continue;
      seen.add(link);
      // filter: only keep API/data/repo-looking links
      if (!/api|data|catalog|registry|github\.com|wiki/i.test(link)) continue;
      const host = (() => { try { return new URL(link).hostname; } catch { return "unknown"; } })();
      try {
        const r = await pool.query(
          `INSERT INTO research_sources (category, name, url, description, domain, tags, added_by)
           VALUES ($1,$2,$3,$4,$5,$6::text[],$7)
           ON CONFLICT (name, COALESCE(url,'')) DO NOTHING RETURNING id`,
          ["awesome-list", name.slice(0, 100), link, `From ${url}`, host, ["awesome-list", "auto-discovered"], "omega-source-discovery-engine"]
        );
        if (r.rowCount && r.rowCount > 0) { count++; stats.sourcesAutoDiscovered++; }
      } catch { /* skip */ }
      if (count >= 100) break; // cap per cycle
    }
  } catch { /* network fail — try again next cycle */ }
}
