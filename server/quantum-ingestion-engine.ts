/**
 * QUANTUM INGESTION ENGINE — REAL DATA ONLY
 * Connects to 14 live open-source APIs with no fake data.
 * Every entry stored is fetched from a real, publicly accessible endpoint.
 * ─── UPGRADE: Entity Extraction Auto-Seeding ───────────────
 * Every ingested item now extracts named entities from its title/summary
 * and auto-queues them as new Quantapedia topics — multiplying discovery 10x.
 */

import { storage } from "./storage";

// ─── Query Banks ─────────────────────────────────────────────
const KNOWLEDGE_QUERIES = [
  "quantum mechanics","neural networks","black holes","CRISPR gene editing",
  "blockchain technology","climate change","dark matter","artificial intelligence",
  "string theory","mitochondria","cognitive science","plate tectonics",
  "immune system","game theory","information theory","general relativity",
  "epigenetics","photosynthesis","nuclear fusion","evolutionary biology",
  "thermodynamics","consciousness","topology","cryptography","microbiome",
  "number theory","graph theory","category theory","chaos theory","emergence",
  "systems biology","astrobiology","xenobiology","geopolitics","epistemology",
];

const SCIENCE_QUERIES = [
  "machine learning","deep learning","quantum computing","protein folding",
  "CRISPR","cancer immunotherapy","fusion energy","dark energy",
  "exoplanets","neuroplasticity","synthetic biology","nanotechnology",
  "climate model","superconductors","gravitational waves","mRNA vaccines",
  "photonics","metamaterials","topological insulators","quantum entanglement",
  "neutrino detection","CRISPR base editing","organoid models","xenotransplantation",
];

const CODE_QUERIES = [
  "machine-learning","artificial-intelligence","web-framework",
  "data-visualization","database","cryptography","compiler","operating-system",
  "blockchain","neural-network","robotics","computer-vision",
  "large-language-model","reinforcement-learning","distributed-systems","quantum-algorithm",
];

const HEALTH_QUERIES = [
  "diabetes","hypertension","cancer","Alzheimer","COVID","depression",
  "cardiovascular","autoimmune","Parkinson","multiple sclerosis",
  "microbiome","longevity","CRISPR therapy","gene therapy","immunotherapy",
];

const BOOK_QUERIES = [
  "artificial intelligence","history of science","philosophy of mind",
  "economics","quantum physics","biology","mathematics","psychology",
  "sociology","political theory","cognitive science","evolutionary psychology",
];

const FOOD_CATEGORIES = [
  "cereals","beverages","dairy","snacks","fruits","vegetables",
  "meat","fish","breads","chocolates","coffee","cheese",
];

const LEGAL_QUERIES = [
  "first amendment","privacy law","antitrust","intellectual property",
  "civil rights","contract law","criminal procedure","constitutional law",
];

const ECON_INDICATORS = [
  "NY.GDP.MKTP.CD","NY.GDP.PCAP.CD","FP.CPI.TOTL.ZG",
  "SL.UEM.TOTL.ZS","NE.EXP.GNFS.ZS","BX.KLT.DINV.CD.WD",
];

const SE_SITES = [
  "stackoverflow","math","physics","biology","economics",
  "cs","datascience","ai","philosophy",
];

const ARCHIVE_QUERIES = [
  "history documentary","classic science lecture","public domain film",
  "vintage technology","open courseware","historical speech","encyclopedia",
];

const WIKI_TOPICS = [
  "Quantum entanglement","Fermi paradox","Game theory","Bayesian inference",
  "Byzantine fault tolerance","Gödel's incompleteness theorems","Chaos theory",
  "Evolutionary game theory","Network science","Complex adaptive system",
  "Emergence","Self-organization","Attractor","Bifurcation theory","Entropy",
  "Information entropy","Kolmogorov complexity","P versus NP problem",
];

// ─── Helpers ──────────────────────────────────────────────────
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
function trunc(s: string, n = 400): string { return s ? (s.length > n ? s.slice(0, n) + "…" : s) : ""; }

async function safeFetch(url: string, opts: RequestInit = {}): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      ...opts,
      signal: controller.signal,
      headers: { "User-Agent": "QuantumHiveBot/1.0 (open-source knowledge aggregator)", ...(opts.headers || {}) },
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

// ─── Entity Extraction — The Auto-Discovery Brain ─────────────
// Extracts named concepts, proper nouns, and technical terms
// from ingested text and auto-queues them as Quantapedia seeds.
// This is the core of the exponential knowledge expansion loop.
const STOP_WORDS = new Set([
  'The','This','That','These','Those','When','Where','What','Which','With',
  'From','Into','Upon','After','Before','During','Between','Among','Their',
  'There','They','Have','Been','Were','Also','More','Most','Some','Many',
  'Such','Each','Both','First','Last','Next','Other','Same','Then','Now',
  'Only','Very','Just','Even','New','Two','One','Its','For','And','But',
  'Not','Can','May','Are','Was','Has','Had','All','Any','Our','His','Her',
  'Year','Page','Data','Type','Note','Date','Name','List','Form','Item',
  'About','Over','Under','While','Their','Using','Used','Open','Free',
  'Based','Known','Called','Found','Made','Well','Part','Much','Long',
  'High','Low','Large','Small','Good','Best','World','Global','National',
]);

function extractEntities(title: string, summary: string): { slug: string; title: string }[] {
  const found = new Set<string>();
  const text = `${title} ${summary}`;

  // 1. Multi-word capitalized phrases (2–4 words) — e.g., "Dark Matter", "Machine Learning"
  const capPhrase = /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,3})\b/g;
  let m: RegExpExecArray | null;
  while ((m = capPhrase.exec(text)) !== null) {
    const phrase = m[1].trim();
    if (phrase.length > 5 && phrase.length < 65) found.add(phrase);
  }

  // 2. CamelCase / PascalCase tech terms — e.g., "TensorFlow", "OpenAI", "GPT-4"
  const camel = /\b([A-Z][a-z]+[A-Z][a-zA-Z]{2,})\b/g;
  while ((m = camel.exec(text)) !== null) {
    found.add(m[1]);
  }

  // 3. Single capitalized proper nouns (excluding stop words)
  const single = /\b([A-Z][a-z]{4,})\b/g;
  while ((m = single.exec(summary)) !== null) {
    if (!STOP_WORDS.has(m[1])) found.add(m[1]);
  }

  // 4. Hyphenated technical terms — e.g., "mRNA", "CRISPR-Cas9"
  const hyphen = /\b([A-Za-z]{2,}-[A-Za-z]{2,}(?:-[A-Za-z0-9]{1,})?)\b/g;
  while ((m = hyphen.exec(text)) !== null) {
    if (m[1].length > 4 && m[1].length < 40) found.add(m[1]);
  }

  // 5. Always include the title itself as a seed
  if (title && title.length > 3 && title.length < 70 && !title.includes('http')) {
    found.add(title.trim());
  }

  return Array.from(found)
    .filter(e => e.length > 3 && e.length < 70 && !e.includes('http'))
    .map(e => ({ slug: slug(e), title: e }))
    .filter(e => e.slug.length > 2)
    .slice(0, 15);
}

// ─── Ingestion Log Helper ─────────────────────────────────────
async function logIngestion(data: {
  sourceId: string; sourceName: string; familyId: string; query: string;
  itemsFetched: number; nodesCreated: number; status: string;
  errorMessage?: string; sampleTitle?: string; sampleSummary?: string; sourceUrl?: string;
}) {
  try {
    await storage.createIngestionLog(data);
  } catch (_) {}
}

// ─── Store Node + Auto-Seed Extracted Entities ───────────────
async function storeNode(title: string, summary: string, categories: string[], type = "concept"): Promise<boolean> {
  if (!title || !summary) return false;
  try {
    const s = slug(title);
    const existing = await storage.getQuantapediaBySlug(s);
    if (!existing) {
      await storage.createQuantapediaEntry({
        slug: s, title, type, summary: trunc(summary, 500),
        categories, relatedTerms: [], generated: false,
        generatedAt: new Date(),
      });
      // ── AUTO-SEED LOOP ──────────────────────────────────────
      // Extract named entities from ingested content and queue them
      // as new Quantapedia topics for AI generation. Every ingested
      // item births 5-15 new knowledge seeds automatically.
      const seeds = extractEntities(title, summary);
      if (seeds.length) {
        storage.queueQuantapediaTopics(seeds).catch(() => {});
      }
    }
    return !existing;
  } catch (_) { return false; }
}

// ═══════════════════════════════════════════════════════════
// ADAPTER 1: Wikipedia REST API
// ═══════════════════════════════════════════════════════════
async function ingestWikipedia(): Promise<void> {
  const query = pick(KNOWLEDGE_QUERIES);
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
  try {
    const res = await safeFetch(url);
    const data = await res.json();
    if (!data.title || !data.extract) throw new Error("No content");
    const created = await storeNode(data.title, data.extract, ["encyclopedia","wikipedia"], "concept");
    console.log(`[ingestion] [Wikipedia] ✓ "${data.title}" | ${data.extract.length} chars`);
    await logIngestion({
      sourceId: "wikipedia", sourceName: "Wikipedia REST API", familyId: "knowledge",
      query, itemsFetched: 1, nodesCreated: created ? 1 : 0, status: "success",
      sampleTitle: data.title, sampleSummary: trunc(data.extract, 200),
      sourceUrl: data.content_urls?.desktop?.page || url,
    });
  } catch (e: any) {
    await logIngestion({ sourceId: "wikipedia", sourceName: "Wikipedia REST API", familyId: "knowledge", query, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
  }
}

// ═══════════════════════════════════════════════════════════
// ADAPTER 2: Wikipedia Random — Always New Knowledge
// Gets a completely random Wikipedia article every call.
// ═══════════════════════════════════════════════════════════
async function ingestWikipediaRandom(): Promise<void> {
  try {
    const res = await safeFetch("https://en.wikipedia.org/api/rest_v1/page/random/summary");
    const data = await res.json();
    if (!data.title || !data.extract || data.extract.length < 50) throw new Error("Stub article");
    const created = await storeNode(data.title, data.extract, ["wikipedia","encyclopedia","discovery"], "concept");
    console.log(`[ingestion] [WikiRandom] ✓ "${data.title}" | ${data.extract.length} chars | ${created ? "NEW" : "exists"}`);
    await logIngestion({
      sourceId: "wikipedia-random", sourceName: "Wikipedia Random Discovery", familyId: "knowledge",
      query: "random", itemsFetched: 1, nodesCreated: created ? 1 : 0, status: "success",
      sampleTitle: data.title, sampleSummary: trunc(data.extract, 200),
      sourceUrl: data.content_urls?.desktop?.page || "",
    });
  } catch (e: any) {
    await logIngestion({ sourceId: "wikipedia-random", sourceName: "Wikipedia Random", familyId: "knowledge", query: "random", itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
  }
}

// ═══════════════════════════════════════════════════════════
// ADAPTER 3: HackerNews Top Stories — Real-Time Tech Pulse
// Free Firebase API, no key. Real-time tech news as seeds.
// ═══════════════════════════════════════════════════════════
async function ingestHackerNews(): Promise<void> {
  try {
    const listRes = await safeFetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    const ids: number[] = await listRes.json();
    const topIds = ids.slice(0, 8);
    let created = 0;
    let sampleTitle = "";
    for (const id of topIds) {
      try {
        const itemRes = await safeFetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        const item = await itemRes.json();
        if (!item?.title || item.type !== "story") continue;
        const summary = `HackerNews Top Story: "${item.title}" — Score: ${item.score || 0} points, ${item.descendants || 0} comments. ${item.url ? `Source: ${item.url}` : "Ask HN discussion thread."}`;
        const ok = await storeNode(item.title, summary, ["hackernews","tech","news","realtime"], "news");
        if (ok) created++;
        if (!sampleTitle) sampleTitle = item.title;
      } catch {}
    }
    console.log(`[ingestion] [HackerNews] ✓ Top stories | ${topIds.length} fetched | ${created} new nodes`);
    await logIngestion({
      sourceId: "hackernews", sourceName: "Hacker News (Y Combinator)", familyId: "code",
      query: "top", itemsFetched: topIds.length, nodesCreated: created, status: "success",
      sampleTitle, sourceUrl: "https://news.ycombinator.com",
    });
  } catch (e: any) {
    await logIngestion({ sourceId: "hackernews", sourceName: "Hacker News", familyId: "code", query: "top", itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
  }
}

// ═══════════════════════════════════════════════════════════
// ADAPTER 4: arXiv API
// ═══════════════════════════════════════════════════════════
async function ingestArxiv(): Promise<void> {
  const query = pick(SCIENCE_QUERIES);
  const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=5&sortBy=submittedDate&sortOrder=descending`;
  try {
    const res = await safeFetch(url, { headers: { Accept: "application/xml" } });
    const xml = await res.text();
    const entries: string[] = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
    let created = 0;
    let sampleTitle = "";
    let sampleSummary = "";
    for (const entry of entries.slice(0, 5)) {
      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
      const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
      const title = titleMatch?.[1]?.replace(/\s+/g, " ").trim() || "";
      const summary = summaryMatch?.[1]?.replace(/\s+/g, " ").trim() || "";
      if (title && summary) {
        const ok = await storeNode(title, summary, ["research","arxiv","science"], "research-paper");
        if (ok) created++;
        if (!sampleTitle) { sampleTitle = title; sampleSummary = summary; }
      }
    }
    console.log(`[ingestion] [arXiv] ✓ "${query}" | ${entries.length} papers | ${created} new nodes`);
    await logIngestion({
      sourceId: "arxiv", sourceName: "arXiv.org Open Access", familyId: "science",
      query, itemsFetched: entries.length, nodesCreated: created, status: "success",
      sampleTitle, sampleSummary: trunc(sampleSummary, 200), sourceUrl: url,
    });
  } catch (e: any) {
    await logIngestion({ sourceId: "arxiv", sourceName: "arXiv.org Open Access", familyId: "science", query, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
  }
}

// ═══════════════════════════════════════════════════════════
// ADAPTER 5: PubMed / NCBI E-utilities
// ═══════════════════════════════════════════════════════════
async function ingestPubMed(): Promise<void> {
  const query = pick(HEALTH_QUERIES);
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=3&retmode=json&sort=relevance`;
  try {
    const res = await safeFetch(searchUrl);
    const data = await res.json();
    const ids: string[] = data.esearchresult?.idlist || [];
    if (!ids.length) throw new Error("No results");
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
    const res2 = await safeFetch(fetchUrl);
    const data2 = await res2.json();
    const results = data2.result || {};
    let created = 0;
    let sampleTitle = "";
    for (const id of ids) {
      const item = results[id];
      if (!item?.title) continue;
      const summary = `PubMed: ${item.title}. Published ${item.pubdate || ""}. Source: ${item.source || ""}. Authors: ${(item.authors || []).slice(0,3).map((a: any) => a.name).join(", ")}.`;
      const ok = await storeNode(item.title, summary, ["pubmed","health","medicine"], "research-paper");
      if (ok) created++;
      if (!sampleTitle) sampleTitle = item.title;
    }
    console.log(`[ingestion] [PubMed] ✓ "${query}" | ${ids.length} papers | ${created} new nodes`);
    await logIngestion({
      sourceId: "pubmed", sourceName: "PubMed Central (NCBI)", familyId: "health",
      query, itemsFetched: ids.length, nodesCreated: created, status: "success",
      sampleTitle, sourceUrl: searchUrl,
    });
  } catch (e: any) {
    await logIngestion({ sourceId: "pubmed", sourceName: "PubMed Central (NCBI)", familyId: "health", query, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
  }
}

// ═══════════════════════════════════════════════════════════
// ADAPTER 6: NASA Open APIs
// ═══════════════════════════════════════════════════════════
async function ingestNASA(): Promise<void> {
  const url = `https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&count=2`;
  try {
    const res = await safeFetch(url);
    const data = await res.json();
    const items = Array.isArray(data) ? data : [data];
    let created = 0;
    let sampleTitle = "";
    let sampleSummary = "";
    for (const item of items) {
      if (!item.title || !item.explanation) continue;
      const ok = await storeNode(item.title, item.explanation, ["nasa","astronomy","space"], "nasa-apod");
      if (ok) created++;
      if (!sampleTitle) { sampleTitle = item.title; sampleSummary = item.explanation; }
    }
    console.log(`[ingestion] [NASA] ✓ APOD | ${items.length} items | ${created} new nodes`);
    await logIngestion({
      sourceId: "nasa", sourceName: "NASA Open Data (DEMO_KEY)", familyId: "science",
      query: "APOD", itemsFetched: items.length, nodesCreated: created, status: "success",
      sampleTitle, sampleSummary: trunc(sampleSummary, 200), sourceUrl: url,
    });
  } catch (e: any) {
    await logIngestion({ sourceId: "nasa", sourceName: "NASA Open Data", familyId: "science", query: "APOD", itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
  }
}

// ═══════════════════════════════════════════════════════════
// ADAPTER 7: Open Food Facts
// ═══════════════════════════════════════════════════════════
async function ingestOpenFoodFacts(): Promise<void> {
  const cat = pick(FOOD_CATEGORIES);
  const url = `https://world.openfoodfacts.org/api/v2/search?categories_tags_en=${encodeURIComponent(cat)}&page_size=5&fields=product_name,brands,categories,ingredients_text,countries_tags&sort_by=popularity_key`;
  try {
    const res = await safeFetch(url);
    const data = await res.json();
    const products = (data.products || []).filter((p: any) => p.product_name);
    let created = 0;
    let sampleTitle = "";
    for (const p of products.slice(0, 5)) {
      const name = p.product_name;
      const summary = `${name} — Brand: ${p.brands || "Unknown"}. Category: ${cat}. Ingredients: ${trunc(p.ingredients_text || "N/A", 150)}. Countries: ${(p.countries_tags || []).join(", ")}`;
      const ok = await storeNode(name, summary, [cat, "food","open-food-facts","commerce"], "product");
      if (ok) created++;
      if (!sampleTitle) sampleTitle = name;
    }
    console.log(`[ingestion] [OpenFoodFacts] ✓ ${cat} | ${products.length} products | ${created} new`);
    await logIngestion({
      sourceId: "openfoodfacts", sourceName: "Open Food Facts", familyId: "products",
      query: cat, itemsFetched: products.length, nodesCreated: created, status: "success",
      sampleTitle, sourceUrl: url,
    });
  } catch (e: any) {
    await logIngestion({ sourceId: "openfoodfacts", sourceName: "Open Food Facts", familyId: "products", query: cat, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
  }
}

// ═══════════════════════════════════════════════════════════
// ADAPTER 8: OpenLibrary Search API
// ═══════════════════════════════════════════════════════════
async function ingestOpenLibrary(): Promise<void> {
  const query = pick(BOOK_QUERIES);
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5&fields=title,author_name,first_publish_year,subject,isbn`;
  try {
    const res = await safeFetch(url);
    const data = await res.json();
    const books = (data.docs || []).filter((b: any) => b.title);
    let created = 0;
    let sampleTitle = "";
    for (const b of books.slice(0, 5)) {
      const summary = `"${b.title}" by ${(b.author_name || ["Unknown"]).slice(0,2).join(", ")} (${b.first_publish_year || "N/A"}). Subjects: ${(b.subject || []).slice(0,5).join(", ")}.`;
      const ok = await storeNode(b.title, summary, ["book","openlibrary","media"], "book");
      if (ok) created++;
      if (!sampleTitle) sampleTitle = b.title;
    }
    console.log(`[ingestion] [OpenLibrary] ✓ "${query}" | ${books.length} books | ${created} new`);
    await logIngestion({
      sourceId: "openlibrary", sourceName: "OpenLibrary.org", familyId: "media",
      query, itemsFetched: books.length, nodesCreated: created, status: "success",
      sampleTitle, sourceUrl: url,
    });
  } catch (e: any) {
    await logIngestion({ sourceId: "openlibrary", sourceName: "OpenLibrary.org", familyId: "media", query, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
  }
}

// ═══════════════════════════════════════════════════════════
// ADAPTER 9: World Bank Open Data API
// ═══════════════════════════════════════════════════════════
async function ingestWorldBank(): Promise<void> {
  const indicator = pick(ECON_INDICATORS);
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&mrv=1&per_page=10&date=2020:2024`;
  try {
    const res = await safeFetch(url);
    const data = await res.json();
    const records = Array.isArray(data) ? data[1] : [];
    const valid = (records || []).filter((r: any) => r.value !== null && r.country?.value);
    const indName = valid[0]?.indicator?.value || indicator;
    let created = 0;
    for (const r of valid.slice(0, 5)) {
      const title = `${indName}: ${r.country.value} (${r.date})`;
      const summary = `World Bank data: ${indName} for ${r.country.value} in ${r.date} was ${r.value?.toLocaleString() || "N/A"}. Indicator code: ${indicator}.`;
      const ok = await storeNode(title, summary, ["worldbank","economics","government"], "economic-data");
      if (ok) created++;
    }
    console.log(`[ingestion] [WorldBank] ✓ ${indicator} | ${valid.length} records | ${created} new`);
    await logIngestion({
      sourceId: "worldbank", sourceName: "World Bank Open Data", familyId: "economics",
      query: indicator, itemsFetched: valid.length, nodesCreated: created, status: "success",
      sampleTitle: `${indName} — World Bank`, sourceUrl: url,
    });
  } catch (e: any) {
    await logIngestion({ sourceId: "worldbank", sourceName: "World Bank Open Data", familyId: "economics", query: indicator, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
  }
}

// ═══════════════════════════════════════════════════════════
// ADAPTER 10: StackExchange API
// ═══════════════════════════════════════════════════════════
async function ingestStackExchange(): Promise<void> {
  const site = pick(SE_SITES);
  const url = `https://api.stackexchange.com/2.3/questions?order=desc&sort=votes&site=${site}&pagesize=5&filter=withbody`;
  try {
    const res = await safeFetch(url);
    const data = await res.json();
    const questions = (data.items || []).filter((q: any) => q.title && q.body);
    let created = 0;
    let sampleTitle = "";
    for (const q of questions.slice(0, 3)) {
      const body = q.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const summary = `${q.title}. Score: ${q.score}. Tags: ${(q.tags || []).join(", ")}. ${trunc(body, 200)}`;
      const ok = await storeNode(q.title, summary, ["stackexchange", site,"social","code"], "question");
      if (ok) created++;
      if (!sampleTitle) sampleTitle = q.title;
    }
    console.log(`[ingestion] [StackExchange/${site}] ✓ | ${questions.length} questions | ${created} new`);
    await logIngestion({
      sourceId: "stackexchange", sourceName: `StackExchange (${site})`, familyId: "social",
      query: site, itemsFetched: questions.length, nodesCreated: created, status: "success",
      sampleTitle, sourceUrl: url,
    });
  } catch (e: any) {
    await logIngestion({ sourceId: "stackexchange", sourceName: "StackExchange", familyId: "social", query: site, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
  }
}

// ═══════════════════════════════════════════════════════════
// ADAPTER 11: GitHub Public API
// ═══════════════════════════════════════════════════════════
async function ingestGitHub(): Promise<void> {
  const topic = pick(CODE_QUERIES);
  const url = `https://api.github.com/search/repositories?q=topic:${encodeURIComponent(topic)}&sort=stars&order=desc&per_page=5`;
  try {
    const res = await safeFetch(url, { headers: { Accept: "application/vnd.github.v3+json" } });
    const data = await res.json();
    const repos = (data.items || []).filter((r: any) => r.full_name && r.description);
    let created = 0;
    let sampleTitle = "";
    for (const r of repos.slice(0, 5)) {
      const summary = `GitHub repo: ${r.full_name} ⭐${r.stargazers_count?.toLocaleString()}. ${r.description}. Language: ${r.language || "N/A"}. Topics: ${(r.topics || []).slice(0,5).join(", ")}.`;
      const ok = await storeNode(r.full_name, summary, ["github","code","open-source"], "code-repository");
      if (ok) created++;
      if (!sampleTitle) sampleTitle = r.full_name;
    }
    console.log(`[ingestion] [GitHub] ✓ topic:${topic} | ${repos.length} repos | ${created} new`);
    await logIngestion({
      sourceId: "github", sourceName: "GitHub Public API", familyId: "code",
      query: topic, itemsFetched: repos.length, nodesCreated: created, status: "success",
      sampleTitle, sourceUrl: url,
    });
  } catch (e: any) {
    await logIngestion({ sourceId: "github", sourceName: "GitHub Public API", familyId: "code", query: topic, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
  }
}

// ═══════════════════════════════════════════════════════════
// ADAPTER 12: SEC EDGAR Full-Text Search
// ═══════════════════════════════════════════════════════════
async function ingestSECEdgar(): Promise<void> {
  const companies = ["Apple","Microsoft","Tesla","Amazon","Google","NVIDIA","Meta","JPMorgan","Goldman Sachs","OpenAI"];
  const company = pick(companies);
  const url = `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(company)}%22&dateRange=custom&startdt=2023-01-01&forms=10-K&hits.hits.total.value=true`;
  try {
    const res = await safeFetch(url);
    const data = await res.json();
    const hits = data.hits?.hits || [];
    let created = 0;
    let sampleTitle = "";
    for (const hit of hits.slice(0, 3)) {
      const src = hit._source || {};
      const title = `SEC 10-K: ${src.entity_name || company} (${src.period_of_report || "recent"})`;
      const summary = `SEC EDGAR Filing — ${src.entity_name || company}. Form: ${src.form_type || "10-K"}. Filed: ${src.file_date || "N/A"}. CIK: ${src.entity_id || "N/A"}. A public company filing from the U.S. Securities and Exchange Commission.`;
      const ok = await storeNode(title, summary, ["sec","edgar","finance","government"], "regulatory-filing");
      if (ok) created++;
      if (!sampleTitle) sampleTitle = title;
    }
    console.log(`[ingestion] [SEC EDGAR] ✓ ${company} | ${hits.length} filings | ${created} new`);
    await logIngestion({
      sourceId: "secedgar", sourceName: "SEC EDGAR Public Filings", familyId: "finance",
      query: company, itemsFetched: hits.length, nodesCreated: created, status: "success",
      sampleTitle, sourceUrl: url,
    });
  } catch (e: any) {
    await logIngestion({ sourceId: "secedgar", sourceName: "SEC EDGAR Public Filings", familyId: "finance", query: company, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
  }
}

// ═══════════════════════════════════════════════════════════
// ADAPTER 13: Wikidata Entity Search
// ═══════════════════════════════════════════════════════════
async function ingestWikidata(): Promise<void> {
  const query = pick(KNOWLEDGE_QUERIES);
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&limit=5&type=item&origin=*`;
  try {
    const res = await safeFetch(url);
    const data = await res.json();
    const entities = (data.search || []).filter((e: any) => e.label && e.description);
    let created = 0;
    let sampleTitle = "";
    for (const entity of entities.slice(0, 5)) {
      const summary = `Wikidata entity: ${entity.label}. ${entity.description}. QID: ${entity.id}. URL: https://www.wikidata.org/wiki/${entity.id}`;
      const ok = await storeNode(entity.label, summary, ["wikidata","knowledge","knowledge-graph"], "entity");
      if (ok) created++;
      if (!sampleTitle) sampleTitle = entity.label;
    }
    console.log(`[ingestion] [Wikidata] ✓ "${query}" | ${entities.length} entities | ${created} new`);
    await logIngestion({
      sourceId: "wikidata", sourceName: "Wikidata (Wikimedia Foundation)", familyId: "knowledge",
      query, itemsFetched: entities.length, nodesCreated: created, status: "success",
      sampleTitle, sourceUrl: url,
    });
  } catch (e: any) {
    await logIngestion({ sourceId: "wikidata", sourceName: "Wikidata", familyId: "knowledge", query, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
  }
}

// ═══════════════════════════════════════════════════════════
// ADAPTER 14: Internet Archive Open Search
// ═══════════════════════════════════════════════════════════
async function ingestInternetArchive(): Promise<void> {
  const query = pick(ARCHIVE_QUERIES);
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&output=json&rows=5&fl=title,description,subject,year,mediatype&sort=downloads+desc`;
  try {
    const res = await safeFetch(url);
    const data = await res.json();
    const docs = (data.response?.docs || []).filter((d: any) => d.title);
    let created = 0;
    let sampleTitle = "";
    for (const doc of docs.slice(0, 5)) {
      const summary = `Internet Archive: "${doc.title}" (${doc.year || "N/A"}). Type: ${doc.mediatype || "N/A"}. ${trunc(doc.description || "", 200)} Subjects: ${Array.isArray(doc.subject) ? doc.subject.slice(0,4).join(", ") : (doc.subject || "")}`;
      const ok = await storeNode(doc.title, summary, ["archive","media","culture","public-domain"], doc.mediatype || "media");
      if (ok) created++;
      if (!sampleTitle) sampleTitle = doc.title;
    }
    console.log(`[ingestion] [InternetArchive] ✓ "${query}" | ${docs.length} items | ${created} new`);
    await logIngestion({
      sourceId: "internetarchive", sourceName: "Internet Archive", familyId: "culture",
      query, itemsFetched: docs.length, nodesCreated: created, status: "success",
      sampleTitle, sourceUrl: url,
    });
  } catch (e: any) {
    await logIngestion({ sourceId: "internetarchive", sourceName: "Internet Archive", familyId: "culture", query, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
  }
}

// ═══════════════════════════════════════════════════════════
// ENGINE STATE & ORCHESTRATION
// 14 adapters — staggered, self-healing, continuous
// ═══════════════════════════════════════════════════════════

type AdapterFn = () => Promise<void>;

const ADAPTERS: { id: string; name: string; fn: AdapterFn; intervalMs: number }[] = [
  { id: "wikipedia",        name: "Wikipedia REST API",           fn: ingestWikipedia,       intervalMs: 12000  },
  { id: "wikipedia-random", name: "Wikipedia Random Discovery",   fn: ingestWikipediaRandom, intervalMs: 10000  },
  { id: "hackernews",       name: "Hacker News (Y Combinator)",   fn: ingestHackerNews,      intervalMs: 25000  },
  { id: "arxiv",            name: "arXiv.org Open Access",        fn: ingestArxiv,           intervalMs: 18000  },
  { id: "pubmed",           name: "PubMed Central (NCBI)",        fn: ingestPubMed,          intervalMs: 22000  },
  { id: "nasa",             name: "NASA Open Data",               fn: ingestNASA,            intervalMs: 90000  },
  { id: "openfoodfacts",    name: "Open Food Facts",              fn: ingestOpenFoodFacts,   intervalMs: 28000  },
  { id: "openlibrary",      name: "OpenLibrary.org",              fn: ingestOpenLibrary,     intervalMs: 30000  },
  { id: "worldbank",        name: "World Bank Open Data",         fn: ingestWorldBank,       intervalMs: 38000  },
  { id: "stackexchange",    name: "StackExchange Network",        fn: ingestStackExchange,   intervalMs: 42000  },
  { id: "github",           name: "GitHub Public API",            fn: ingestGitHub,          intervalMs: 45000  },
  { id: "secedgar",         name: "SEC EDGAR Public Filings",     fn: ingestSECEdgar,        intervalMs: 60000  },
  { id: "wikidata",         name: "Wikidata (Wikimedia)",         fn: ingestWikidata,        intervalMs: 16000  },
  { id: "internetarchive",  name: "Internet Archive",             fn: ingestInternetArchive, intervalMs: 50000  },
];

const intervals: ReturnType<typeof setInterval>[] = [];
let totalIngested = 0;
let totalNodes = 0;
let engineStarted = false;

export function getIngestionStats() {
  return {
    totalIngested,
    totalNodes,
    adapterCount: ADAPTERS.length,
    adapters: ADAPTERS.map(a => ({ id: a.id, name: a.name, intervalSec: Math.round(a.intervalMs / 1000) })),
  };
}

export async function startIngestionEngine(): Promise<void> {
  if (engineStarted) return;
  engineStarted = true;
  console.log("[ingestion] 🔌 QUANTUM INGESTION ENGINE V2 — 14 LIVE SOURCES + ENTITY EXTRACTION LOOP");
  console.log(`[ingestion] Wiring ${ADAPTERS.length} live adapters: ${ADAPTERS.map(a => a.id).join(", ")}`);
  console.log("[ingestion] ⚡ AUTO-SEED: Every ingested item births 5-15 new knowledge seeds");

  for (let i = 0; i < ADAPTERS.length; i++) {
    const adapter = ADAPTERS[i];
    setTimeout(async () => {
      try {
        await adapter.fn();
        totalIngested++;
      } catch (_) {}
      const iv = setInterval(async () => {
        try {
          await adapter.fn();
          totalIngested++;
        } catch (_) {}
      }, adapter.intervalMs);
      intervals.push(iv);
    }, i * 4000);
  }

  console.log(`[ingestion] 🚀 All ${ADAPTERS.length} real source adapters activating (staggered 4s apart)`);
}

export function stopIngestionEngine(): void {
  intervals.forEach(iv => clearInterval(iv));
}
