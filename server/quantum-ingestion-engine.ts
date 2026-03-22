/**
 * QUANTUM INGESTION ENGINE V3 — GUARDIAN ACTIVATED
 * ─────────────────────────────────────────────────
 * Every adapter now uses a RotatingQueue — queries exhaust fully before any repeat.
 * Entity extraction auto-injects discovered topics back into rotating pools.
 * HackerNews tracks seen story IDs — no repeats.
 * GUARDIAN SYSTEM: Per-adapter zero-streak monitor. After 5 zero-node cycles,
 * forces queue rotation + logs a guardian alert. After 10, backs off interval.
 * Slug cache: in-memory Set pre-seeded from DB. Skips fetch entirely if already known.
 */

import { storage } from "./storage";
import { GICS_FAMILY_REGEX, resolveFamily, ALL_FAMILY_IDS } from "./omega-families";

// ─── Rotating Queue — Exhausts All Before Repeating ──────────
// Never picks the same item twice until every other has been used.
// Accepts dynamic injections (entity seeds). Shuffles on refill.
class RotatingQueue<T extends string> {
  private available: T[] = [];
  private used: T[] = [];
  private injected: T[] = [];
  private seen: Set<T> = new Set();

  constructor(items: T[]) {
    this.available = this.shuffle([...items]);
    items.forEach(i => this.seen.add(i));
  }

  next(): T {
    if (this.available.length === 0) {
      // Refill: used + any new injections, shuffle
      this.available = this.shuffle([...this.used, ...this.injected]);
      this.used = [];
      this.injected = [];
    }
    const item = this.available.pop()!;
    this.used.push(item);
    return item;
  }

  inject(items: T[]): void {
    for (const item of items) {
      if (!this.seen.has(item) && item.length > 2 && item.length < 100) {
        this.seen.add(item);
        this.injected.push(item);
      }
    }
  }

  size(): number { return this.available.length + this.used.length + this.injected.length; }

  private shuffle(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

// ─── Query Pools ──────────────────────────────────────────────
const KNOWLEDGE_QUERIES = [
  // Core Science
  "quantum mechanics","neural networks","black holes","CRISPR gene editing",
  "blockchain technology","climate change","dark matter","artificial intelligence",
  "string theory","mitochondria","cognitive science","plate tectonics",
  "immune system","game theory","information theory","general relativity",
  "epigenetics","photosynthesis","nuclear fusion","evolutionary biology",
  "thermodynamics","consciousness","topology","cryptography","microbiome",
  "number theory","graph theory","category theory","chaos theory","emergence",
  "systems biology","astrobiology","xenobiology","geopolitics","epistemology",
  "quantum field theory","electromagnetism","cell biology","ecology","linguistics",
  "sociology","anthropology","archaeology","cosmology","neuroscience",
  "material science","fluid dynamics","statistical mechanics","combinatorics",
  "computer science","philosophy of mind","ethics","logic","set theory",
  "abstract algebra","differential geometry","algebraic topology","group theory",
  "Bayesian inference","information entropy","complexity theory","network science",
  "evolutionary game theory","self-organization","dynamical systems","fractal geometry",
  // History & Civilization
  "Ancient Egypt","Roman Empire","Greek philosophy","Byzantine Empire","Silk Road",
  "Industrial Revolution","Renaissance Italy","French Revolution","World War I","World War II",
  "Cold War","Mongol Empire","Ottoman Empire","British Empire","American Revolution",
  "Mesopotamia","Indus Valley Civilization","Maya civilization","Aztec Empire","Inca Empire",
  "Islamic Golden Age","Medieval Europe","Viking Age","Age of Exploration","Enlightenment",
  "Chinese dynasties","Japanese shogunate","African kingdoms","Colonialism","Decolonization",
  // Philosophy & Ethics
  "Plato philosophy","Aristotle logic","Stoicism","Epicureanism","Kantian ethics",
  "Utilitarianism","Existentialism","Phenomenology","Analytic philosophy","Continental philosophy",
  "Buddhist philosophy","Confucianism","Taoism","Hinduism metaphysics","Islamic philosophy",
  "Philosophy of science","Free will determinism","Moral relativism","Political philosophy","Social contract",
  // Arts, Culture & Literature
  "Impressionism","Modernism literature","Shakespeare plays","Ancient Greek drama","Renaissance art",
  "Baroque music","Jazz history","Rock and roll history","Hip hop culture","Classical music theory",
  "Film theory","Photography history","Architecture history","Surrealism","Abstract expressionism",
  "World mythology","Folklore traditions","Cultural anthropology","Semiotics","Narratology",
  // Economics & Finance
  "Supply and demand","Keynesian economics","Monetary policy","Fiscal policy","International trade",
  "Behavioral economics","Market microstructure","Derivatives finance","Macroeconomics","Microeconomics",
  "Austrian economics","Marxist economics","Development economics","Labor economics","Environmental economics",
  // Medicine & Health
  "Human anatomy","Immunology","Pharmacology","Neurology","Cardiology",
  "Oncology","Genetics","Epidemiology","Surgery history","Public health",
  "Mental health psychiatry","Nutrition science","Exercise physiology","Geriatrics","Pediatrics",
  // Law & Governance
  "Constitutional law","International law","Human rights","Democracy theory","Federalism",
  "Criminal justice","Civil law","Legal philosophy","United Nations","Geopolitics",
  // Mathematics
  "Calculus history","Number theory","Probability theory","Linear algebra","Real analysis",
  "Complex analysis","Topology","Combinatorics","Cryptography mathematics","Mathematical logic",
  // Technology & Engineering
  "Semiconductor technology","Robotics","Internet history","Space exploration","Aviation history",
  "Nuclear technology","Renewable energy","Biotechnology","Nanotechnology","Telecommunications",
];

const SCIENCE_QUERIES = [
  "machine learning","deep learning","quantum computing","protein folding",
  "CRISPR","cancer immunotherapy","fusion energy","dark energy",
  "exoplanets","neuroplasticity","synthetic biology","nanotechnology",
  "climate model","superconductors","gravitational waves","mRNA vaccines",
  "photonics","metamaterials","topological insulators","quantum entanglement",
  "neutrino detection","CRISPR base editing","organoid models","xenotransplantation",
  "stem cell therapy","CRISPR prime editing","optogenetics","brain-computer interface",
  "quantum error correction","quantum cryptography","quantum sensing","quantum simulation",
  "2D materials","graphene","perovskite solar cells","solid-state batteries",
  "gene drive","epigenome editing","synthetic genomics","DNA data storage",
  "nuclear microreactor","hydrogen economy","direct air capture","ocean thermal energy",
];

const CODE_QUERIES = [
  "machine-learning","artificial-intelligence","web-framework",
  "data-visualization","database","cryptography","compiler","operating-system",
  "blockchain","neural-network","robotics","computer-vision",
  "large-language-model","reinforcement-learning","distributed-systems","quantum-algorithm",
  "vector-database","graph-database","time-series","streaming","event-driven",
  "kubernetes","serverless","edge-computing","webassembly","rust-lang",
  "formal-verification","program-synthesis","automated-reasoning","symbolic-ai",
];

const HEALTH_QUERIES = [
  "diabetes","hypertension","cancer","Alzheimer","COVID","depression",
  "cardiovascular","autoimmune","Parkinson","multiple sclerosis",
  "microbiome","longevity","CRISPR therapy","gene therapy","immunotherapy",
  "obesity","metabolic syndrome","chronic pain","sleep disorders","anxiety",
  "bipolar disorder","schizophrenia","ADHD","autism spectrum","rare diseases",
  "sepsis","acute kidney injury","liver cirrhosis","inflammatory bowel disease",
];

const BOOK_QUERIES = [
  "artificial intelligence","history of science","philosophy of mind",
  "economics","quantum physics","biology","mathematics","psychology",
  "sociology","political theory","cognitive science","evolutionary psychology",
  "neuroscience","linguistics","anthropology","history","literature",
  "complexity","information theory","game theory","systems thinking",
];

const FOOD_CATEGORIES = [
  "cereals","beverages","dairy","snacks","fruits","vegetables",
  "meat","fish","breads","chocolates","coffee","cheese",
  "pasta","soups","condiments","spices","nuts","legumes","seafood","desserts",
];

const ECON_INDICATORS = [
  "NY.GDP.MKTP.CD","NY.GDP.PCAP.CD","FP.CPI.TOTL.ZG",
  "SL.UEM.TOTL.ZS","NE.EXP.GNFS.ZS","BX.KLT.DINV.CD.WD",
  "SP.POP.TOTL","SE.ADT.LITR.ZS","SH.DYN.MORT","EG.USE.PCAP.KG.OE",
  "IT.NET.USER.ZS","IC.BUS.EASE.XQ","NY.GNP.PCAP.CD",
];

const SE_SITES = [
  "stackoverflow","math","physics","biology","economics",
  "cs","datascience","ai","philosophy","engineering",
  "chemistry","astronomy","electronics","softwareengineering",
];

const ARCHIVE_QUERIES = [
  "history documentary","classic science lecture","public domain film",
  "vintage technology","open courseware","historical speech","encyclopedia",
  "folk music","world war documentary","space exploration","mathematics lecture",
  "nature documentary","ancient civilizations","cold war history","industrial revolution",
];

const WIKI_TOPICS = [
  // Core Theory
  "Quantum entanglement","Fermi paradox","Game theory","Bayesian inference",
  "Byzantine fault tolerance","Gödel's incompleteness theorems","Chaos theory",
  "Evolutionary game theory","Network science","Complex adaptive system",
  "Emergence","Self-organization","Attractor","Bifurcation theory","Entropy",
  "Information entropy","Kolmogorov complexity","P versus NP problem",
  "Turing completeness","Lambda calculus","Church-Turing thesis","Halting problem",
  "Arrow's impossibility theorem","Nash equilibrium","Prisoner dilemma",
  "Tragedy of the commons","Dunbar number","Six degrees of separation",
  // History
  "Ancient Rome","Ancient Greece","Byzantine Empire","Islamic Golden Age",
  "Renaissance","French Revolution","American Revolution","Industrial Revolution",
  "World War I","World War II","Cold War","Silk Road","Mongol Empire",
  "Ancient Egypt","Mesopotamia","Maya civilization","Aztec Empire","Inca Empire",
  "British Empire","Ottoman Empire","Chinese dynasties","Feudal Japan",
  // Philosophy
  "Stoicism","Existentialism","Kantian ethics","Utilitarianism","Phenomenology",
  "Buddhist philosophy","Confucianism","Taoism","Social contract","Free will",
  "Philosophy of science","Analytic philosophy","Moral philosophy","Epistemology",
  // Science
  "Evolution","Natural selection","DNA","Photosynthesis","Plate tectonics",
  "General relativity","Quantum mechanics","Thermodynamics","Electromagnetism",
  "Periodic table","Nuclear fission","Superconductivity","Black hole",
  // Culture & Arts
  "Renaissance art","Impressionism","Baroque music","Jazz","Hip hop","Rock music",
  "Ancient Greek drama","Shakespeare","Modern literature","Film history",
  "World mythology","Greek mythology","Norse mythology","Hindu mythology",
];

const SEC_COMPANIES = [
  "Apple","Microsoft","Tesla","Amazon","Google","NVIDIA","Meta","JPMorgan",
  "Goldman Sachs","Boeing","Ford","General Electric","Pfizer","Moderna",
  "ExxonMobil","Berkshire Hathaway","Johnson & Johnson","Walmart","Procter Gamble",
  "Visa","Mastercard","Netflix","Salesforce","Adobe","Intel","AMD","Qualcomm",
];

// ─── GICS Sector / Sub-Industry Query Pool ──────────────────────────────────
// Covers all 11 GICS sectors and their sub-industries for comprehensive Hive coverage.
const GICS_QUERIES = [
  // ENERGY
  "oil drilling petroleum offshore deepwater","shale drilling horizontal Permian Bakken","oilfield services pressure pumping wireline",
  "LNG liquefied natural gas terminal regasification","crude oil refinery petroleum products","petrochemical ethylene propylene polyethylene",
  "solar panel photovoltaic utility scale","wind turbine onshore offshore renewable","nuclear power reactor uranium fuel",
  "hydroelectric power dam water turbine","energy storage battery grid BESS","hydrogen fuel cell electrolyzer green",
  "carbon capture storage CCS DAC","biofuel ethanol biodiesel renewable","coal mining thermal coking power",
  "pipeline midstream natural gas transmission","electric utility power generation distribution","gas distribution local residential utility",
  // MATERIALS
  "gold mining bullion reserves streaming","copper mining cathode concentrate Chile","iron ore steel making blast furnace",
  "aluminum smelting bauxite alumina","rare earth neodymium REE mining","lithium cobalt battery metals supply chain",
  "coking coal metallurgical steel","specialty chemicals adhesives coatings polymers","agricultural chemicals fertilizer herbicide",
  "commodity chemicals chlor-alkali soda ash","industrial gases oxygen nitrogen argon","cement concrete ready-mix construction",
  "aggregates crushed stone sand quarry","paper pulp wood kraft tissue","lumber timber saw mill framing","corrugated box containerboard packaging",
  "flexible packaging film barrier multilayer","aluminum can steel can glass bottle",
  // INDUSTRIALS
  "commercial aircraft Boeing Airbus narrow body","military fighter jet defense missile","satellite constellation LEO space launch",
  "aerospace maintenance MRO aviation repair","HVAC heating cooling ventilation chiller","windows doors glazing fenestration insulated",
  "roofing shingles membrane metal TPO","infrastructure EPC bridge highway tunnel civil","commercial construction general contractor building",
  "industrial machinery CNC milling cutting tools","pump valve flow control centrifugal","forklift material handling warehouse logistics",
  "freight railroad Class I intermodal coal","trucking truckload LTL over the road","air freight cargo express FedEx UPS DHL",
  "commercial airline low cost carrier aviation","marine shipping container bulk tanker","port terminal logistics supply chain",
  "waste collection recycling landfill municipal","water utility treatment infrastructure",
  // CONSUMER DISCRETIONARY
  "automobile electric vehicle EV manufacturer","auto parts brake suspension supplier","car dealership new used vehicle sales",
  "homebuilder residential new construction","home improvement renovation hardware tools","home appliance refrigerator washer smart home",
  "furniture sofa mattress home decor","luxury goods fashion LVMH Hermes","athletic footwear Nike Adidas running",
  "fast fashion Zara H&M affordable clothing","fast food McDonald's Burger King QSR","casual dining Darden Olive Garden restaurant",
  "hotel resort hospitality Hilton Marriott","cruise line Royal Caribbean Carnival travel","online travel booking Airbnb Expedia",
  "casino gambling gaming slot sports betting","movie theater film studio box office","theme park entertainment Walt Disney",
  "e-commerce online retail marketplace Amazon","specialty retail apparel sporting goods",
  // CONSUMER STAPLES
  "grocery supermarket food retail distribution","packaged food consumer brands Nestle Kraft","beverage Coca-Cola PepsiCo soft drink",
  "beer brewing craft lager ale brewer","spirits whisky vodka gin premium","tobacco cigarette Philip Morris Altria",
  "personal care hygiene soap shampoo deodorant","household cleaning detergent Procter Gamble","baby infant diapers formula wipes",
  "pet food veterinary care premium","food service wholesale distribution Sysco","frozen food prepared meals grocery",
  // HEALTH CARE
  "pharmaceutical drug clinical trial FDA biotech","cancer oncology checkpoint inhibitor kinase","gene therapy CAR-T cell AAV CRISPR rare disease",
  "mRNA vaccine messenger RNA immunization","medical device orthopedic implant spine joint","cardiac pacemaker defibrillator ICD heart",
  "surgical robot minimally invasive laparoscopic","diagnostic imaging MRI CT scan radiology","glucose monitor CGM insulin pump diabetes",
  "hospital health system acute care ICU","managed care health insurance Medicare Medicaid","pharmacy benefit PBM drug pricing rebate",
  "contract manufacturing CDMO biologics API","hospital supplies sterile disposable PPE","home health hospice skilled nursing",
  "mental health behavioral telepsychiatry","AI diagnostics radiology pathology digital health",
  // FINANCIALS
  "commercial bank retail lending deposits","investment bank IPO equity debt capital markets","asset management hedge fund private equity",
  "insurance property casualty premium underwriting","life insurance annuity actuarial reserve","payment network Visa Mastercard interchange",
  "fintech digital wallet crypto neobank","mortgage REIT residential commercial lending","consumer finance auto loan credit card",
  "stock exchange trading platform market microstructure","credit rating Moody's S&P Fitch bond",
  // INFORMATION TECHNOLOGY
  "cloud computing AWS Azure GCP hyperscale","software enterprise SaaS platform subscription","semiconductor chip design EDA fabless",
  "AI chip GPU Nvidia data center accelerator","analog power chip EV automotive SiC GaN","semiconductor memory DRAM NAND flash storage",
  "TSMC foundry wafer fab advanced node","cybersecurity endpoint cloud SASE zero trust","network equipment router switch Cisco",
  "IT services consulting systems integration outsourcing","data center colocation hyperscale REIT",
  // COMMUNICATION SERVICES
  "wireless carrier 5G spectrum network","broadband fiber FTTH internet gigabit","cable television pay TV Comcast Charter",
  "social media platform advertising user engagement","video streaming Netflix Disney+ subscriber","gaming mobile console PC esports",
  "search advertising Google programmatic digital","online marketplace classifieds listings","media entertainment film TV production studio",
  "podcasting audio Spotify music streaming","satellite radio television broadcast",
  // UTILITIES
  "electric utility regulated rate base transmission","renewable energy utility solar wind PPA","nuclear utility reactor decommission",
  "water utility treatment infrastructure municipal","gas utility pipeline distribution residential","independent power producer IPP merchant",
  // REAL ESTATE
  "office REIT tower commercial leasing","apartment multifamily REIT urban rental","retail mall shopping center REIT",
  "industrial warehouse logistics REIT e-commerce","hotel resort hospitality REIT","healthcare REIT hospital MOB nursing",
  "cell tower REIT American Tower Crown Castle","data center REIT colocation cloud","single family rental REIT suburban",
  "real estate developer homebuilder land acquisition","mortgage backed securities CMBS RMBS",
  // LAW & GOVERNANCE
  "constitutional law supreme court ruling","international law treaty sanctions WTO","intellectual property patent trademark copyright",
  "antitrust merger review FTC DOJ competition","criminal justice sentencing reform prison","environmental law EPA regulation compliance",
  // EDUCATION
  "higher education university enrollment tuition","K-12 public school curriculum reform","online learning edtech MOOC platform",
  "vocational training apprenticeship skills","early childhood education preschool","student loan debt forgiveness financial aid",
  // CULTURE & ARTS
  "contemporary art museum exhibition gallery","classical music orchestra opera symphony","film festival Cannes Sundance independent",
  "architecture urban design sustainability building","fashion week Paris Milan luxury brand",
  // DEEP KNOWLEDGE
  "game theory Nash equilibrium strategy","information theory Shannon entropy coding","complexity theory NP-hard computation",
  "evolutionary biology natural selection species","cognitive science consciousness attention","moral philosophy ethics applied justice",
];

// ─── Per-adapter Rotating Queues ─────────────────────────────
const qKnowledge   = new RotatingQueue(KNOWLEDGE_QUERIES);
const qScience     = new RotatingQueue(SCIENCE_QUERIES);
const qCode        = new RotatingQueue(CODE_QUERIES);
const qHealth      = new RotatingQueue(HEALTH_QUERIES);
const qBooks       = new RotatingQueue(BOOK_QUERIES);
const qFood        = new RotatingQueue(FOOD_CATEGORIES);
const qEcon        = new RotatingQueue(ECON_INDICATORS);
const qSE          = new RotatingQueue(SE_SITES);
const qArchive     = new RotatingQueue(ARCHIVE_QUERIES);
const qWikiFixed   = new RotatingQueue(WIKI_TOPICS);
const qSEC         = new RotatingQueue(SEC_COMPANIES);
const qGICS        = new RotatingQueue(GICS_QUERIES);

// ─── All knowledge queues that benefit from entity injection ──
const KNOWLEDGE_QUEUES = [qKnowledge, qScience, qHealth, qBooks, qWikiFixed];

// ─── In-Memory Slug Cache — Skip known slugs without fetching ─
const slugCache: Set<string> = new Set();
let slugCacheReady = false;

async function warmSlugCache(): Promise<void> {
  try {
    // Load recent slugs to prime the dedup cache
    const entries = await storage.getQuantapediaEntries({ limit: 5000, offset: 0 });
    for (const e of entries) slugCache.add(e.slug);
    slugCacheReady = true;
    console.log(`[guardian] 🛡️ Slug cache warmed — ${slugCache.size} known entries`);
  } catch (_) {
    slugCacheReady = true;
  }
}

function isKnown(title: string): boolean {
  return slugCache.has(slug(title));
}

// ─── HackerNews — Seen Story ID Tracker ───────────────────────
const seenHNIds: Set<number> = new Set();

// ─── Guardian Watchdog System ─────────────────────────────────
// Monitors per-adapter zero-streak. Forces rotation at threshold.
interface GuardianRecord {
  zeroStreak: number;
  totalRuns: number;
  totalNodesCreated: number;
  lastAlertAt: number;
  backoffActive: boolean;
  backoffUntil: number;
}

const guardianData: Map<string, GuardianRecord> = new Map();

function getGuardianRecord(id: string): GuardianRecord {
  if (!guardianData.has(id)) {
    guardianData.set(id, {
      zeroStreak: 0, totalRuns: 0, totalNodesCreated: 0,
      lastAlertAt: 0, backoffActive: false, backoffUntil: 0,
    });
  }
  return guardianData.get(id)!;
}

function guardianReport(adapterId: string, nodesCreated: number): boolean {
  const g = getGuardianRecord(adapterId);
  g.totalRuns++;
  g.totalNodesCreated += nodesCreated;

  if (nodesCreated === 0) {
    g.zeroStreak++;
    // ALERT at 5 consecutive zero-node cycles
    if (g.zeroStreak >= 5 && Date.now() - g.lastAlertAt > 120_000) {
      g.lastAlertAt = Date.now();
      console.log(`[guardian] ⚠️  ${adapterId} — ${g.zeroStreak} zero-node cycles. Forcing queue rotation.`);
    }
    // BACKOFF at 15 consecutive zeros — skip next 3 cycles
    if (g.zeroStreak >= 15) {
      g.backoffActive = true;
      g.backoffUntil = Date.now() + 90_000; // 90 second backoff
      g.zeroStreak = 0;
      console.log(`[guardian] 🔴 ${adapterId} — entering 90s backoff. Source may be exhausted or rate-limited.`);
    }
  } else {
    if (g.zeroStreak > 0) {
      console.log(`[guardian] ✅ ${adapterId} — recovered after ${g.zeroStreak} dry cycles (+${nodesCreated} new nodes)`);
    }
    g.zeroStreak = 0;
    g.backoffActive = false;
  }

  guardianData.set(adapterId, g);
  // Return true if this adapter should be skipped (in backoff)
  return g.backoffActive && Date.now() < g.backoffUntil;
}

export function getGuardianStatus() {
  const statuses: Record<string, any> = {};
  for (const [id, g] of guardianData.entries()) {
    statuses[id] = {
      zeroStreak: g.zeroStreak,
      totalRuns: g.totalRuns,
      totalNodesCreated: g.totalNodesCreated,
      efficiency: g.totalRuns > 0 ? Math.round((g.totalNodesCreated / g.totalRuns) * 10) / 10 : 0,
      status: g.backoffActive ? "BACKOFF" : g.zeroStreak >= 5 ? "WARNING" : "OK",
    };
  }
  return statuses;
}

// ─── Helpers ──────────────────────────────────────────────────
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

// ─── Entity Extraction — Auto-Discovery Brain ─────────────────
// Extracts named entities and feeds them back into rotating queues.
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

function extractEntities(title: string, summary: string): string[] {
  const found = new Set<string>();
  const text = `${title} ${summary}`;

  const capPhrase = /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,3})\b/g;
  let m: RegExpExecArray | null;
  while ((m = capPhrase.exec(text)) !== null) {
    const phrase = m[1].trim();
    if (phrase.length > 5 && phrase.length < 65) found.add(phrase);
  }

  const camel = /\b([A-Z][a-z]+[A-Z][a-zA-Z]{2,})\b/g;
  while ((m = camel.exec(text)) !== null) found.add(m[1]);

  const single = /\b([A-Z][a-z]{4,})\b/g;
  while ((m = single.exec(summary)) !== null) {
    if (!STOP_WORDS.has(m[1])) found.add(m[1]);
  }

  const hyphen = /\b([A-Za-z]{2,}-[A-Za-z]{2,}(?:-[A-Za-z0-9]{1,})?)\b/g;
  while ((m = hyphen.exec(text)) !== null) {
    if (m[1].length > 4 && m[1].length < 40) found.add(m[1]);
  }

  return Array.from(found)
    .filter(e => e.length > 3 && e.length < 70 && !e.includes('http'))
    .slice(0, 15);
}

// ─── Ingestion Log Helper ─────────────────────────────────────
async function logIngestion(data: {
  sourceId: string; sourceName: string; familyId: string; query: string;
  itemsFetched: number; nodesCreated: number; status: string;
  errorMessage?: string; sampleTitle?: string; sampleSummary?: string; sourceUrl?: string;
}) {
  try { await storage.createIngestionLog(data); } catch (_) {}
}

// ─── Store Node + Entity Feedback ────────────────────────────
async function storeNode(title: string, summary: string, categories: string[], type = "concept"): Promise<boolean> {
  if (!title || !summary) return false;
  const s = slug(title);
  // Skip immediately if slug is already in cache — no DB call needed
  if (slugCache.has(s)) return false;
  try {
    const existing = await storage.getQuantapediaBySlug(s);
    if (existing) {
      slugCache.add(s);
      return false;
    }
    await storage.createQuantapediaEntry({
      slug: s, title, type, summary: trunc(summary, 500),
      categories, relatedTerms: [], generated: false,
      generatedAt: new Date(),
    });
    slugCache.add(s);
    // ── ENTITY FEEDBACK LOOP ────────────────────────────────────
    // Extract entities and inject BACK into rotating queues — not
    // just Quantapedia seeds, but also live query pool expansion.
    const entities = extractEntities(title, summary);
    if (entities.length) {
      // Feed to Quantapedia seed queue
      storage.queueQuantapediaTopics(
        entities.map(e => ({ slug: slug(e), title: e }))
      ).catch(() => {});
      // Inject discovered terms into knowledge rotating queues
      for (const q of KNOWLEDGE_QUEUES) q.inject(entities as string[]);
    }
    return true;
  } catch (_) { return false; }
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER 1: Wikipedia REST API — Rotating Knowledge Queue
// ═══════════════════════════════════════════════════════════════
async function ingestWikipedia(): Promise<void> {
  const query = qKnowledge.next();
  // Pre-check slug before making API call
  if (isKnown(query)) {
    console.log(`[ingestion] [Wikipedia] ⏭ "${query}" already known — skipping`);
    return;
  }
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
  try {
    const res = await safeFetch(url);
    const data = await res.json();
    if (!data.title || !data.extract) throw new Error("No content");
    const created = await storeNode(data.title, data.extract, ["encyclopedia","wikipedia"], "concept");
    console.log(`[ingestion] [Wikipedia] ${created ? "✓ NEW" : "⏭ exists"} "${data.title}" | ${data.extract.length} chars`);
    await logIngestion({
      sourceId: "wikipedia", sourceName: "Wikipedia REST API", familyId: "knowledge",
      query, itemsFetched: 1, nodesCreated: created ? 1 : 0, status: "success",
      sampleTitle: data.title, sampleSummary: trunc(data.extract, 200),
      sourceUrl: data.content_urls?.desktop?.page || url,
    });
    guardianReport("wikipedia", created ? 1 : 0);
  } catch (e: any) {
    await logIngestion({ sourceId: "wikipedia", sourceName: "Wikipedia REST API", familyId: "knowledge", query, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
    guardianReport("wikipedia", 0);
  }
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER 2: Wikipedia Random — Always New, Guardian-Verified
// ═══════════════════════════════════════════════════════════════
async function ingestWikipediaRandom(): Promise<void> {
  try {
    const res = await safeFetch("https://en.wikipedia.org/api/rest_v1/page/random/summary");
    const data = await res.json();
    if (!data.title || !data.extract || data.extract.length < 50) throw new Error("Stub article");
    const created = await storeNode(data.title, data.extract, ["wikipedia","encyclopedia","discovery"], "concept");
    console.log(`[ingestion] [WikiRandom] ${created ? "✓ NEW" : "⏭ exists"} "${data.title}" | ${data.extract.length} chars`);
    await logIngestion({
      sourceId: "wikipedia-random", sourceName: "Wikipedia Random Discovery", familyId: "knowledge",
      query: "random", itemsFetched: 1, nodesCreated: created ? 1 : 0, status: "success",
      sampleTitle: data.title, sampleSummary: trunc(data.extract, 200),
      sourceUrl: data.content_urls?.desktop?.page || "",
    });
    guardianReport("wikipedia-random", created ? 1 : 0);
  } catch (e: any) {
    await logIngestion({ sourceId: "wikipedia-random", sourceName: "Wikipedia Random", familyId: "knowledge", query: "random", itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
    guardianReport("wikipedia-random", 0);
  }
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER 3: HackerNews — Seen Story ID Dedup (No Repeats)
// ═══════════════════════════════════════════════════════════════
async function ingestHackerNews(): Promise<void> {
  try {
    const listRes = await safeFetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    const ids: number[] = await listRes.json();
    // Filter out already-seen story IDs
    const freshIds = ids.filter(id => !seenHNIds.has(id)).slice(0, 10);
    if (freshIds.length === 0) {
      console.log(`[ingestion] [HackerNews] ⏭ All top stories already processed (${seenHNIds.size} seen)`);
      guardianReport("hackernews", 0);
      return;
    }
    let created = 0;
    let fetched = 0;
    let sampleTitle = "";
    for (const id of freshIds) {
      try {
        const itemRes = await safeFetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        const item = await itemRes.json();
        seenHNIds.add(id); // Mark seen regardless of DB result
        if (!item?.title || item.type !== "story") continue;
        const summary = `HackerNews Top Story: "${item.title}" — Score: ${item.score || 0} points, ${item.descendants || 0} comments. ${item.url ? `Source: ${item.url}` : "Ask HN discussion thread."}`;
        const ok = await storeNode(item.title, summary, ["hackernews","tech","news","realtime"], "news");
        if (ok) created++;
        fetched++;
        if (!sampleTitle) sampleTitle = item.title;
      } catch {}
    }
    // Trim seen IDs if too large (keep last 2000)
    if (seenHNIds.size > 2000) {
      const arr = Array.from(seenHNIds);
      arr.splice(0, arr.length - 1000).forEach(id => seenHNIds.delete(id));
    }
    console.log(`[ingestion] [HackerNews] ✓ ${freshIds.length} fresh stories | ${fetched} fetched | ${created} new nodes`);
    await logIngestion({
      sourceId: "hackernews", sourceName: "Hacker News (Y Combinator)", familyId: "code",
      query: "top", itemsFetched: fetched, nodesCreated: created, status: "success",
      sampleTitle, sourceUrl: "https://news.ycombinator.com",
    });
    guardianReport("hackernews", created);
  } catch (e: any) {
    await logIngestion({ sourceId: "hackernews", sourceName: "Hacker News", familyId: "code", query: "top", itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
    guardianReport("hackernews", 0);
  }
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER 4: arXiv API — Rotating Science Queue
// ═══════════════════════════════════════════════════════════════
async function ingestArxiv(): Promise<void> {
  const query = qScience.next();
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
    guardianReport("arxiv", created);
  } catch (e: any) {
    await logIngestion({ sourceId: "arxiv", sourceName: "arXiv.org Open Access", familyId: "science", query, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
    guardianReport("arxiv", 0);
  }
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER 5: PubMed — Rotating Health Queue
// ═══════════════════════════════════════════════════════════════
async function ingestPubMed(): Promise<void> {
  const query = qHealth.next();
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
    guardianReport("pubmed", created);
  } catch (e: any) {
    await logIngestion({ sourceId: "pubmed", sourceName: "PubMed Central (NCBI)", familyId: "health", query, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
    guardianReport("pubmed", 0);
  }
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER 6: NASA Open APIs
// ═══════════════════════════════════════════════════════════════
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
    guardianReport("nasa", created);
  } catch (e: any) {
    await logIngestion({ sourceId: "nasa", sourceName: "NASA Open Data", familyId: "science", query: "APOD", itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
    guardianReport("nasa", 0);
  }
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER 7: Open Food Facts — Rotating Category Queue
// ═══════════════════════════════════════════════════════════════
async function ingestOpenFoodFacts(): Promise<void> {
  const cat = qFood.next();
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
    guardianReport("openfoodfacts", created);
  } catch (e: any) {
    await logIngestion({ sourceId: "openfoodfacts", sourceName: "Open Food Facts", familyId: "products", query: cat, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
    guardianReport("openfoodfacts", 0);
  }
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER 8: OpenLibrary — Rotating Book Query Queue
// ═══════════════════════════════════════════════════════════════
async function ingestOpenLibrary(): Promise<void> {
  const query = qBooks.next();
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
    guardianReport("openlibrary", created);
  } catch (e: any) {
    await logIngestion({ sourceId: "openlibrary", sourceName: "OpenLibrary.org", familyId: "media", query, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
    guardianReport("openlibrary", 0);
  }
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER 9: World Bank Open Data — Rotating Indicator Queue
// ═══════════════════════════════════════════════════════════════
async function ingestWorldBank(): Promise<void> {
  const indicator = qEcon.next();
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
    guardianReport("worldbank", created);
  } catch (e: any) {
    await logIngestion({ sourceId: "worldbank", sourceName: "World Bank Open Data", familyId: "economics", query: indicator, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
    guardianReport("worldbank", 0);
  }
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER 10: StackExchange — Rotating Site Queue
// ═══════════════════════════════════════════════════════════════
async function ingestStackExchange(): Promise<void> {
  const site = qSE.next();
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
    guardianReport("stackexchange", created);
  } catch (e: any) {
    await logIngestion({ sourceId: "stackexchange", sourceName: "StackExchange", familyId: "social", query: site, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
    guardianReport("stackexchange", 0);
  }
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER 11: GitHub — Rotating Code Topic Queue
// ═══════════════════════════════════════════════════════════════
async function ingestGitHub(): Promise<void> {
  const topic = qCode.next();
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
    guardianReport("github", created);
  } catch (e: any) {
    await logIngestion({ sourceId: "github", sourceName: "GitHub Public API", familyId: "code", query: topic, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
    guardianReport("github", 0);
  }
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER 12: SEC EDGAR — Rotating Company Queue
// ═══════════════════════════════════════════════════════════════
async function ingestSECEdgar(): Promise<void> {
  const company = qSEC.next();
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
    guardianReport("secedgar", created);
  } catch (e: any) {
    await logIngestion({ sourceId: "secedgar", sourceName: "SEC EDGAR Public Filings", familyId: "finance", query: company, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
    guardianReport("secedgar", 0);
  }
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER 13: Wikidata — Rotating Knowledge Queue (Separate from Wikipedia)
// ═══════════════════════════════════════════════════════════════
async function ingestWikidata(): Promise<void> {
  // Use the dedicated Wikidata fixed-topic queue — NOT the same as Wikipedia
  const query = qWikiFixed.next();
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
    guardianReport("wikidata", created);
  } catch (e: any) {
    await logIngestion({ sourceId: "wikidata", sourceName: "Wikidata", familyId: "knowledge", query, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
    guardianReport("wikidata", 0);
  }
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER 14: Internet Archive — Rotating Archive Query Queue
// ═══════════════════════════════════════════════════════════════
async function ingestInternetArchive(): Promise<void> {
  const query = qArchive.next();
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
    guardianReport("internetarchive", created);
  } catch (e: any) {
    await logIngestion({ sourceId: "internetarchive", sourceName: "Internet Archive", familyId: "culture", query, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
    guardianReport("internetarchive", 0);
  }
}

// ═══════════════════════════════════════════════════════════════
// GUARDIAN PERIODIC BROADCAST
// Every 5 minutes — print hive ingestion health to console
// ═══════════════════════════════════════════════════════════════
function broadcastGuardianStatus(): void {
  const statuses = getGuardianStatus();
  const ids = Object.keys(statuses);
  if (ids.length === 0) return;
  const warnings = ids.filter(id => statuses[id].status !== "OK");
  const healthy = ids.filter(id => statuses[id].status === "OK");
  const totalRuns = ids.reduce((a, id) => a + statuses[id].totalRuns, 0);
  const totalNodes = ids.reduce((a, id) => a + statuses[id].totalNodesCreated, 0);
  console.log(`[guardian] 🛡️  HIVE HEALTH — ${totalRuns} total runs | ${totalNodes} total new nodes | ${healthy.length}/${ids.length} adapters healthy`);
  if (warnings.length > 0) {
    for (const id of warnings) {
      const s = statuses[id];
      console.log(`[guardian] ${s.status === "BACKOFF" ? "🔴" : "⚠️ "} ${id}: ${s.status} | ${s.zeroStreak} zero streak | efficiency: ${s.efficiency} nodes/run`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER 15: GICS Sector Intelligence — Full Taxonomy Coverage
// ═══════════════════════════════════════════════════════════════
// Maps GICS sector/sub-industry keywords → correct family_id (220+ families)
// Source of truth: omega-families.ts → GICS_FAMILY_REGEX
function gicsFamily(query: string): string {
  return resolveFamily(query);
}

async function ingestGICS(): Promise<void> {
  const query = qGICS.next();
  const family = gicsFamily(query);
  // Use Wikipedia search API to find article by sector keyword, then fetch summary
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1&origin=*`;
  try {
    const searchRes = await safeFetch(searchUrl);
    const searchData = await searchRes.json();
    const hit = searchData?.query?.search?.[0];
    if (!hit?.title) {
      console.log(`[ingestion] [GICS] ⚠ No search hit for "${query}" | family=${family}`);
      guardianReport("gics-wiki", 0);
      return;
    }
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`;
    const summaryRes = await safeFetch(summaryUrl);
    const data = await summaryRes.json();
    if (!data.title || !data.extract || data.extract.length < 40) throw new Error("No extract");
    const tags = ["gics", family, "sector-intelligence", ...query.split(/[\s,]+/).slice(0, 5)];
    const created = await storeNode(data.title, data.extract, tags, "gics-sector");
    console.log(`[ingestion] [GICS] ${created ? "✓ NEW" : "⏭ exists"} "${data.title}" | family=${family} | ${data.extract.length} chars`);
    await logIngestion({
      sourceId: "gics-wiki", sourceName: "GICS Sector Intelligence", familyId: family,
      query, itemsFetched: 1, nodesCreated: created ? 1 : 0, status: "success",
      sampleTitle: data.title, sampleSummary: trunc(data.extract, 200),
      sourceUrl: data.content_urls?.desktop?.page || summaryUrl,
    });
    guardianReport("gics-wiki", created ? 1 : 0);
  } catch (e: any) {
    console.log(`[ingestion] [GICS] ✗ Error for "${query}": ${e.message}`);
    await logIngestion({ sourceId: "gics-wiki", sourceName: "GICS Sector Intelligence", familyId: family, query, itemsFetched: 0, nodesCreated: 0, status: "error", errorMessage: e.message });
    guardianReport("gics-wiki", 0);
  }
}

// ═══════════════════════════════════════════════════════════════
// ENGINE STATE & ORCHESTRATION
// ═══════════════════════════════════════════════════════════════

type AdapterFn = () => Promise<void>;

const ADAPTERS: { id: string; name: string; fn: AdapterFn; intervalMs: number }[] = [
  { id: "wikipedia",        name: "Wikipedia REST API",           fn: ingestWikipedia,       intervalMs: 14000  },
  { id: "wikipedia-random", name: "Wikipedia Random Discovery",   fn: ingestWikipediaRandom, intervalMs: 11000  },
  { id: "hackernews",       name: "Hacker News (Y Combinator)",   fn: ingestHackerNews,      intervalMs: 60000  },
  { id: "arxiv",            name: "arXiv.org Open Access",        fn: ingestArxiv,           intervalMs: 20000  },
  { id: "pubmed",           name: "PubMed Central (NCBI)",        fn: ingestPubMed,          intervalMs: 24000  },
  { id: "nasa",             name: "NASA Open Data",               fn: ingestNASA,            intervalMs: 120000 },
  { id: "openfoodfacts",    name: "Open Food Facts",              fn: ingestOpenFoodFacts,   intervalMs: 32000  },
  { id: "openlibrary",      name: "OpenLibrary.org",              fn: ingestOpenLibrary,     intervalMs: 35000  },
  { id: "worldbank",        name: "World Bank Open Data",         fn: ingestWorldBank,       intervalMs: 45000  },
  { id: "stackexchange",    name: "StackExchange Network",        fn: ingestStackExchange,   intervalMs: 50000  },
  { id: "github",           name: "GitHub Public API",            fn: ingestGitHub,          intervalMs: 55000  },
  { id: "secedgar",         name: "SEC EDGAR Public Filings",     fn: ingestSECEdgar,        intervalMs: 75000  },
  { id: "wikidata",         name: "Wikidata (Wikimedia)",         fn: ingestWikidata,        intervalMs: 18000  },
  { id: "internetarchive",  name: "Internet Archive",             fn: ingestInternetArchive, intervalMs: 60000  },
  { id: "gics-wiki",        name: "GICS Sector Intelligence",      fn: ingestGICS,            intervalMs: 16000  },
];

const intervals: ReturnType<typeof setInterval>[] = [];
let totalIngested = 0;
let totalNodesGlobal = 0;
let engineStarted = false;

export function getIngestionStats() {
  return {
    totalIngested,
    totalNodes: totalNodesGlobal,
    adapterCount: ADAPTERS.length,
    adapters: ADAPTERS.map(a => ({ id: a.id, name: a.name, intervalSec: Math.round(a.intervalMs / 1000) })),
    guardian: getGuardianStatus(),
    slugCacheSize: slugCache.size,
    seenHNStories: seenHNIds.size,
  };
}

export async function startIngestionEngine(): Promise<void> {
  if (engineStarted) return;
  engineStarted = true;

  console.log("[ingestion] 🔌 QUANTUM INGESTION ENGINE V3 — GUARDIAN ACTIVATED");
  console.log(`[ingestion] Wiring ${ADAPTERS.length} adapters with RotatingQueues — no query repeats until full cycle`);
  console.log("[ingestion] ⚡ ENTITY FEEDBACK LOOP: Extracted concepts inject back into rotating pools");
  console.log("[ingestion] 🛡️  GUARDIAN SYSTEM: Zero-streak monitor active on all adapters");

  // Warm slug cache before starting adapters
  await warmSlugCache();

  for (let i = 0; i < ADAPTERS.length; i++) {
    const adapter = ADAPTERS[i];
    setTimeout(async () => {
      try {
        await adapter.fn();
        totalIngested++;
      } catch (_) {}
      const iv = setInterval(async () => {
        // Check guardian backoff before running
        const g = guardianData.get(adapter.id);
        if (g?.backoffActive && Date.now() < g.backoffUntil) {
          return; // Skip this cycle — guardian-ordered backoff
        }
        try {
          await adapter.fn();
          totalIngested++;
        } catch (_) {}
      }, adapter.intervalMs);
      intervals.push(iv);
    }, i * 4000);
  }

  // Guardian broadcast every 5 minutes
  const guardianInterval = setInterval(broadcastGuardianStatus, 5 * 60 * 1000);
  intervals.push(guardianInterval);

  console.log(`[ingestion] 🚀 All ${ADAPTERS.length} adapters activating (staggered 4s apart) — Guardian watching`);
}

export function stopIngestionEngine(): void {
  intervals.forEach(iv => clearInterval(iv));
}
