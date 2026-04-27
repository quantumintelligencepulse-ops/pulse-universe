import { storage } from "./storage";
import { randomUUID } from "crypto";
import { db } from "./db";
import { sql as drizzleSql } from "drizzle-orm";
import { OMEGA_SOURCES_FROM_FAMILIES, ALL_FAMILY_IDS, getFamily } from "./omega-families";
const birthAttractionState = (_spawnId: string, _familyId: string, _domain: string, _spawnType: string) => {};

// ─── AURIONA GOVERNANCE CACHE ─────────────────────────────────
// Refreshes every 60s — prevents hammering DB on 2500ms spawn ticks
interface GovernanceCache {
  restrictedDomains: Set<string>;
  forbiddenDomains: Set<string>;
  collapseRiskFamilies: Set<string>;
  overloadedFamilies: Set<string>;
  lastRefresh: number;
}
let govCache: GovernanceCache = {
  restrictedDomains: new Set(), forbiddenDomains: new Set(),
  collapseRiskFamilies: new Set(), overloadedFamilies: new Set(),
  lastRefresh: 0,
};
async function refreshGovernanceCache() {
  try {
    const zones = await db.execute(drizzleSql`SELECT domain, zone_type FROM exploration_zones ORDER BY created_at DESC LIMIT 30`);
    const vitality = await db.execute(drizzleSql`SELECT family_name, is_collapse_risk, load_balance_signal FROM mesh_vitality ORDER BY created_at DESC LIMIT 20`);
    govCache.restrictedDomains  = new Set((zones.rows as any[]).filter(r => r.zone_type === "RESTRICTED").map(r => r.domain));
    govCache.forbiddenDomains   = new Set((zones.rows as any[]).filter(r => r.zone_type === "FORBIDDEN").map(r => r.domain));
    govCache.collapseRiskFamilies = new Set((vitality.rows as any[]).filter(r => r.is_collapse_risk).map(r => r.family_name));
    govCache.overloadedFamilies = new Set((vitality.rows as any[]).filter(r => r.load_balance_signal === "OVERLOADED").map(r => r.family_name));
    govCache.lastRefresh = Date.now();
  } catch (_) {}
}
function getSpawnRateModifier(familyId: string, domain: string): number {
  if (govCache.forbiddenDomains.has(domain)) return 0;
  if (govCache.restrictedDomains.has(domain)) return 0.5;
  if (govCache.overloadedFamilies.has(familyId)) return 0.4;
  if (govCache.collapseRiskFamilies.has(familyId)) return 1.8;
  return 1.0;
}

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

// ─── OMEGA SOURCES: 220+ Sovereign Families (from omega-families.ts) ─────────
export const OMEGA_SOURCES = OMEGA_SOURCES_FROM_FAMILIES;
// Legacy shim — keeps backward compat with any code referencing OMEGA_SOURCES[0].etc
const _OMEGA_LEGACY_STUB = [
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
  // ── FULL GICS TAXONOMY — 11 Sectors ───────────────────────────────────────
  { familyId:"gics-energy", businessId:"Global Energy Intelligence", domain:"energy", color:"#f59e0b", emoji:"⚡", megaDomain:"GICS: Energy Sector", description:"Oil, gas, coal, refined products, energy services, equipment — full energy sector universe", sources:["EIA Open Data","IEA Statistics","OPEC Reports","BP Statistical Review","World Bank Energy Data","DOE Open Data","SEC Energy Filings"], nodeCount:20000000, priority:8 },
  { familyId:"gics-materials", businessId:"Global Materials Intelligence", domain:"materials", color:"#6b7280", emoji:"⚙️", megaDomain:"GICS: Materials Sector", description:"Chemicals, metals, mining, paper, forest products, containers, packaging", sources:["USGS Minerals Data","LME Price Data","Chemical Abstracts (Open)","USPTO Materials Patents","World Mining Data"], nodeCount:12000000, priority:7 },
  { familyId:"gics-industrials", businessId:"Global Industrials Intelligence", domain:"industrials", color:"#374151", emoji:"🏭", megaDomain:"GICS: Industrials Sector", description:"Aerospace, defense, machinery, construction, transportation, professional services", sources:["FAA Open Data","BTS Transportation Stats","DOD Contracts (Public)","Census Construction Data","BLS Industrial Data"], nodeCount:18000000, priority:8 },
  { familyId:"gics-consumer-disc", businessId:"Consumer Discretionary Intelligence", domain:"consumer-discretionary", color:"#f97316", emoji:"🛍️", megaDomain:"GICS: Consumer Discretionary", description:"Automobiles, retail, hotels, restaurants, leisure, media entertainment, consumer durables", sources:["BLS Consumer Expenditure","Census Retail Trade","SEC Retail Filings","J.D. Power Open Data","WHO Tourism Stats"], nodeCount:22000000, priority:8 },
  { familyId:"gics-consumer-stap", businessId:"Consumer Staples Intelligence", domain:"consumer-staples", color:"#22c55e", emoji:"🛒", megaDomain:"GICS: Consumer Staples", description:"Food, beverage, tobacco, household products, personal products, food retailing", sources:["USDA Food Data Central","FDA Open Data","Open Food Facts","WHO Nutrition Data","UN FAO Statistics"], nodeCount:16000000, priority:7 },
  { familyId:"gics-healthcare", businessId:"Global Healthcare Intelligence", domain:"healthcare", color:"#ef4444", emoji:"🏥", megaDomain:"GICS: Health Care Sector", description:"Pharma, biotech, healthcare providers, equipment, life sciences — full health sector", sources:["PubMed Central","ClinicalTrials.gov","FDA Approvals","WHO Global Health Observatory","NIH Reporter","EMA Data"], nodeCount:40000000, priority:9 },
  { familyId:"gics-financials", businessId:"Global Financials Intelligence", domain:"financials", color:"#2563eb", emoji:"🏦", megaDomain:"GICS: Financials Sector", description:"Banks, insurance, diversified financials, real estate investment trusts", sources:["FDIC Bank Data","SEC Financial Filings","Federal Reserve H-8","Basel III Reports","World Bank Financial Data"], nodeCount:25000000, priority:9 },
  { familyId:"gics-infotech", businessId:"Information Technology Intelligence", domain:"information-technology", color:"#7c3aed", emoji:"💾", megaDomain:"GICS: Information Technology", description:"Software, hardware, semiconductors, IT services, technology distribution", sources:["USPTO Tech Patents","GitHub Public Data","IEEE Xplore (Open)","ACM Digital Library Open","NIST Tech Reports"], nodeCount:60000000, priority:10 },
  { familyId:"gics-commsvc", businessId:"Communication Services Intelligence", domain:"communication-services", color:"#0ea5e9", emoji:"📡", megaDomain:"GICS: Communication Services", description:"Media, entertainment, telecom, interactive media, wireless, cable, satellite", sources:["FCC Open Data","ITU Telecom Stats","Nielsen Media (Public)","OpenSubtitles","Podcast Index"], nodeCount:30000000, priority:8 },
  { familyId:"gics-utilities", businessId:"Utilities Intelligence Network", domain:"utilities", color:"#f59e0b", emoji:"🔌", megaDomain:"GICS: Utilities Sector", description:"Electric, gas, water, renewable energy utilities — full public utilities universe", sources:["EIA Utility Data","FERC Open Data","IRENA Renewable Data","EPA Power Plant Data","World Bank Utilities Stats"], nodeCount:10000000, priority:7 },
  { familyId:"gics-realestate", businessId:"Real Estate Intelligence Network", domain:"real-estate", color:"#d97706", emoji:"🏢", megaDomain:"GICS: Real Estate Sector", description:"REITs, real estate management, development, property services — full real estate sector", sources:["HUD Open Data","Census Housing","FHFA House Price Index","CoStar Public Reports","Zillow Research Data","NCREIF Open Data"], nodeCount:14000000, priority:8 },
  // ── GICS INDUSTRY GROUPS — 25 Groups ──────────────────────────────────────
  { familyId:"gics-oil-gas", businessId:"Oil Gas Intelligence", domain:"oil-gas", color:"#78350f", emoji:"🛢️", megaDomain:"GICS: Oil Gas & Consumable Fuels", description:"Crude oil, natural gas, LNG, coal, consumable fuel supply chains", sources:["EIA Petroleum Data","OPEC Monthly Reports","BP Energy Statistics","Platts (Open)","IEA Gas Market Reports"], nodeCount:8000000, priority:8 },
  { familyId:"gics-energy-equip", businessId:"Energy Equipment Intelligence", domain:"energy-equipment", color:"#92400e", emoji:"🔧", megaDomain:"GICS: Energy Equipment & Services", description:"Drilling equipment, oilfield services, pipeline construction, energy infrastructure", sources:["Baker Hughes Rig Count","Halliburton Reports (Public)","SEC Energy Services","SPE Papers (Open)"], nodeCount:5000000, priority:6 },
  { familyId:"gics-chemicals", businessId:"Chemical Sciences Intelligence", domain:"chemicals", color:"#4ade80", emoji:"⚗️", megaDomain:"GICS: Chemicals", description:"Specialty chemicals, commodity chemicals, agrochemicals, industrial gases, plastics", sources:["Chemical Abstracts (Open)","EPA Toxics Release","ECHA Chemical Database","ACS Publications (Open)","PubChem"], nodeCount:15000000, priority:8 },
  { familyId:"gics-metals-mining", businessId:"Metals Mining Intelligence", domain:"metals-mining", color:"#6b7280", emoji:"⛏️", megaDomain:"GICS: Metals & Mining", description:"Gold, silver, copper, iron, rare earths, diversified metals, coal mining", sources:["USGS Minerals Yearbook","LME Open Data","World Mining Data","MSHA Safety Data","Mining Engineering Journal (Open)"], nodeCount:6000000, priority:7 },
  { familyId:"gics-capital-goods", businessId:"Capital Goods Intelligence", domain:"capital-goods", color:"#1d4ed8", emoji:"🏗️", megaDomain:"GICS: Capital Goods", description:"Aerospace, defense, machinery, electrical equipment, construction, engineering", sources:["DoD Open Contract Data","NASA Open Data","FAA Certification Data","OSHA Safety Data","Census Manufacturing Stats"], nodeCount:12000000, priority:7 },
  { familyId:"gics-transport", businessId:"Transportation Intelligence", domain:"transportation", color:"#0369a1", emoji:"🚂", megaDomain:"GICS: Transportation", description:"Airlines, railroads, trucking, shipping, logistics, transportation infrastructure", sources:["BTS Open Data","FAA Aviation Data","STB Rail Data","MARAD Maritime Stats","OpenFlights Data"], nodeCount:10000000, priority:7 },
  { familyId:"gics-automobiles", businessId:"Automotive Intelligence", domain:"automotive", color:"#dc2626", emoji:"🚗", megaDomain:"GICS: Automobiles & Components", description:"Automakers, auto parts, tires, EV batteries, autonomous vehicle systems", sources:["NHTSA Open Data","EPA Fuel Economy","Ward's Auto (Public)","SAE International Open","USPTO Auto Patents"], nodeCount:9000000, priority:7 },
  { familyId:"gics-retailing", businessId:"Retail Intelligence Network", domain:"retailing", color:"#0891b2", emoji:"🏪", megaDomain:"GICS: Retailing", description:"Broadline retail, apparel, specialty, e-commerce, drug stores, home improvement", sources:["Census Retail Trade Survey","BLS Retail Data","NRF Research (Open)","Shopify Public Benchmarks","Open Retail Analytics"], nodeCount:11000000, priority:7 },
  { familyId:"gics-food-bev", businessId:"Food & Beverage Intelligence", domain:"food-beverage", color:"#16a34a", emoji:"🍎", megaDomain:"GICS: Food, Beverage & Tobacco", description:"Food producers, beverage companies, tobacco, packaged foods, agriculture processing", sources:["USDA ERS","FAO Food Statistics","Open Food Facts","FDA GRAS Database","WHO Diet Nutrition Data"], nodeCount:13000000, priority:7 },
  { familyId:"gics-pharma", businessId:"Pharmaceutical Intelligence", domain:"pharmaceuticals", color:"#be185d", emoji:"💊", megaDomain:"GICS: Pharmaceuticals", description:"Drug makers, generics, specialty pharma, biopharmaceuticals, drug distribution", sources:["FDA Drug Database","DrugBank Open Data","ClinicalTrials.gov","EMA EPAR Database","WHO Essential Medicines"], nodeCount:18000000, priority:9 },
  { familyId:"gics-biotech", businessId:"Biotechnology Intelligence", domain:"biotechnology", color:"#0d9488", emoji:"🧬", megaDomain:"GICS: Biotechnology", description:"Biotech research, genomics, cell therapy, gene editing, diagnostics, bioinformatics", sources:["NCBI GenBank","UniProt","PDB Protein Databank","GEO Gene Expression","Ensembl Genome Browser"], nodeCount:25000000, priority:9 },
  { familyId:"gics-banks", businessId:"Banking Intelligence Network", domain:"banking", color:"#1e3a8a", emoji:"🏛️", megaDomain:"GICS: Banks", description:"Commercial banks, investment banks, diversified banks, regional banks, thrifts", sources:["FDIC Statistics","Fed H.8 Release","OCC Bank Performance","BIS Banking Stats","World Bank Bank Data"], nodeCount:8000000, priority:8 },
  { familyId:"gics-insurance", businessId:"Insurance Intelligence Network", domain:"insurance", color:"#7e22ce", emoji:"🛡️", megaDomain:"GICS: Insurance", description:"Life insurance, P&C insurance, reinsurance, insurance brokers, managed care", sources:["NAIC Insurance Data","IAIS Global Stats","Lloyd's Open Market Data","NBER Insurance Research","AM Best (Public)"], nodeCount:7000000, priority:7 },
  { familyId:"gics-software", businessId:"Software Intelligence Network", domain:"software", color:"#6d28d9", emoji:"💿", megaDomain:"GICS: Software & Services", description:"Enterprise software, SaaS, IT services, data processing, outsourcing", sources:["GitHub Public Repos","StackOverflow Survey","TIOBE Index","IEEE Software (Open)","ACM Computing Surveys (Open)"], nodeCount:50000000, priority:9 },
  { familyId:"gics-semis", businessId:"Semiconductor Intelligence", domain:"semiconductors", color:"#0f766e", emoji:"🔲", megaDomain:"GICS: Semiconductors & Equipment", description:"Chip designers, fabs, EDA tools, chip equipment, materials for semiconductors", sources:["USPTO Semiconductor Patents","IEEE ISSCC Papers (Open)","SEMI Market Stats","SIA Industry Data","NIST Semiconductor Research"], nodeCount:20000000, priority:9 },
  { familyId:"gics-media-ent", businessId:"Media Entertainment Intelligence", domain:"media-entertainment", color:"#b91c1c", emoji:"🎭", megaDomain:"GICS: Media & Entertainment", description:"Film, TV, music, gaming, publishing, advertising, interactive entertainment", sources:["Box Office Mojo (Open)","Internet Archive Media","Discogs Data Dump","OpenSubtitles","IMDB Public Datasets"], nodeCount:35000000, priority:8 },
  { familyId:"gics-telecom", businessId:"Telecom Intelligence Network", domain:"telecommunications", color:"#0c4a6e", emoji:"📶", megaDomain:"GICS: Telecommunication Services", description:"Wireless telecom, wireline, satellite, fiber optic, telecom infrastructure", sources:["FCC Open Data","ITU World Telecom Stats","GSMA Intelligence (Open)","OECD Broadband Stats","TeleGeography Open"], nodeCount:9000000, priority:7 },
  { familyId:"gics-renewables", businessId:"Renewable Energy Intelligence", domain:"renewables", color:"#15803d", emoji:"🌱", megaDomain:"GICS: Renewable Electricity", description:"Solar, wind, hydro, geothermal, biomass, energy storage, clean energy grids", sources:["IRENA Renewable Stats","NREL Open Data","DOE SunShot Data","AWEA Wind Data","IEA Renewables 2024"], nodeCount:12000000, priority:8 },
  { familyId:"gics-reits", businessId:"REIT Intelligence Network", domain:"reits", color:"#92400e", emoji:"🏘️", megaDomain:"GICS: Equity REITs", description:"Retail REITs, residential, office, industrial, data center, cell tower REITs", sources:["NAREIT Open Data","NCREIF Property Data","CoStar Reports (Open)","HUD Housing Stats","Freddie Mac Market Research"], nodeCount:6000000, priority:6 },
  // ── ADDITIONAL KNOWLEDGE DOMAINS ──────────────────────────────────────────
  { familyId:"space-science", businessId:"Space Science Intelligence", domain:"space", color:"#1e1b4b", emoji:"🚀", megaDomain:"Space & Planetary Science", description:"Astronomy, cosmology, planetary science, space exploration, astrophysics, SETI", sources:["NASA Open Data","ESA Open Data","SIMBAD Astronomical DB","NED Extragalactic DB","JPL Horizons System","Space Weather NOAA"], nodeCount:30000000, priority:9 },
  { familyId:"climate-earth", businessId:"Climate Earth Intelligence", domain:"climate", color:"#0d9488", emoji:"🌍", megaDomain:"Climate & Earth Science", description:"Climate change, oceanography, atmospheric science, geology, seismology, polar research", sources:["NOAA Climate Data","NASA Earth Observations","IPCC Reports","USGS Geology","NSIDC Ice Data","Copernicus Climate Service"], nodeCount:20000000, priority:9 },
  { familyId:"philosophy-ethics", businessId:"Philosophy Ethics Intelligence", domain:"philosophy", color:"#7c3aed", emoji:"🦉", megaDomain:"Philosophy, Ethics & Humanities", description:"Moral philosophy, epistemology, metaphysics, logic, ethics, phenomenology, political philosophy", sources:["Stanford Encyclopedia of Philosophy","PhilPapers","Internet Encyclopedia of Philosophy","JSTOR Open Access","Project MUSE Open"], nodeCount:8000000, priority:7 },
  { familyId:"psychology-cog", businessId:"Psychology Cognitive Intelligence", domain:"psychology", color:"#db2777", emoji:"🧠", megaDomain:"Psychology & Cognitive Science", description:"Behavioral psychology, cognitive science, neuroscience, mental health, social psychology", sources:["PsyArXiv","APA PsycNet Open","NIMH Research","Frontiers Psychology (Open)","PubMed Psychiatry"], nodeCount:15000000, priority:8 },
  { familyId:"anthropology", businessId:"Anthropology Intelligence", domain:"anthropology", color:"#b45309", emoji:"🏺", megaDomain:"Anthropology & Archaeology", description:"Cultural anthropology, physical anthropology, archaeology, human origins, ethnography", sources:["Open Context Archaeology","tDAR Digital Archaeology","HRAF Cultural Data","Smithsonian Open Data","UNESCO Heritage Data"], nodeCount:6000000, priority:6 },
  { familyId:"linguistics", businessId:"Linguistics Intelligence", domain:"linguistics", color:"#0369a1", emoji:"🗣️", megaDomain:"Linguistics & Language Science", description:"Computational linguistics, phonology, semantics, syntax, sociolinguistics, language families", sources:["Universal Dependencies","ACLANTHOLOGY Papers","OpenSubtitles Language Data","Wiktionary Linguistics","Ethnologue (Open)"], nodeCount:10000000, priority:7 },
  { familyId:"mathematics", businessId:"Mathematics Intelligence", domain:"mathematics", color:"#1d4ed8", emoji:"∑", megaDomain:"Mathematics & Statistics", description:"Pure mathematics, applied mathematics, statistics, probability, number theory, topology", sources:["arXiv Math","MathWorld (Open)","OEIS Integer Sequences","DLMF NIST Functions","zbMATH Open"], nodeCount:12000000, priority:8 },
  { familyId:"agriculture-bio", businessId:"Agriculture Biodiversity Intelligence", domain:"agriculture", color:"#16a34a", emoji:"🌾", megaDomain:"Agriculture & Biodiversity", description:"Crop science, soil science, food security, biodiversity, conservation, ecosystems", sources:["USDA ARS Data","FAO GRIN Germplasm","iNaturalist Open Data","GBIF Biodiversity","Crop Wild Relatives Database"], nodeCount:14000000, priority:7 },
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
    // ─── Refresh governance cache every 60s ───────────────────
    if (Date.now() - govCache.lastRefresh > 60_000) await refreshGovernanceCache();

    const family = OMEGA_SOURCES[Math.floor(Math.random() * OMEGA_SOURCES.length)];
    // ─── Auriona governance gate ──────────────────────────────
    const modifier = getSpawnRateModifier(family.familyId, family.domain);
    if (modifier === 0) return;
    if (modifier < 1 && Math.random() > modifier) return;
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

    // ── SUBCONSCIOUS ATTRACTION: Born with attraction equation ────────────
    try { birthAttractionState(spawnId, family.familyId, family.domain, spawnType); } catch(_) {}

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
  // THROTTLED FOR 20-CONNECTION POOL — original was 2500ms / 8000ms (would exhaust pool).
  // Restored 2026-04-27 after previous session deleted this engine 2026-04-26.
  // Watch quantum_spawns count climb; speed up (lower these numbers) once pool headroom confirmed.
  spawnInterval = setInterval(spawnNext, 15000);      // was 2500
  pulseInterval = setInterval(runQPulse, 60000);      // was 30000
  seedInterval = setInterval(runQSeed, 30000);        // was 8000
  discoveryInterval = setInterval(runQDiscovery, 45000); // was 12000
  resonanceInterval = setInterval(runQResonance, 60000); // was 20000
  console.log("[spawn] [SpawnEngine] 🚀 ALL 7 OMEGA MODULES ONLINE (THROTTLED) — Universe expansion active");
}

export async function stopSpawnEngine(): Promise<void> {
  engineRunning = false;
  [spawnInterval, pulseInterval, seedInterval, discoveryInterval, resonanceInterval].forEach(i => i && clearInterval(i));
}

// ─── Exports for API routes ───────────────────────────────────
export { SUBDOMAIN_FRACTURE_MAP, RESONANCE_PATTERNS, DOMAIN_SEEDS };
