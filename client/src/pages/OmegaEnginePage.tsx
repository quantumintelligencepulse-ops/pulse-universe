/*
 * OMEGA ENGINE — SOVEREIGN SUBSTRATE
 * Fusion of Omega Engine + Omega Sources into one 5-panel Omega-Class command deck.
 * Ω-I: Source Nexus · Ω-II: Expansion Engine · Ω-III: Q-Matrix · Ω-IV: Fracture & Resonance · Ω-V: Spawn Telemetry
 */
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AIFinderButton, AIReportPanel } from "@/components/AIReportPanel";
import { useDomainPing, UniversePulseBar } from "@/lib/universeResonance";

// ─── Static Data ──────────────────────────────────────────────

const OMEGA_SOURCES = [
  { familyId:"knowledge", emoji:"📚", megaDomain:"Open Knowledge & Encyclopedias", color:"#6366f1", description:"The backbone of all structured human knowledge — encyclopedias, dictionaries, and open reference works.", sources:["Wikipedia Full Dumps","Wikidata","Wiktionary","Wikiquote","Wikibooks","Wikisource","Wikiversity","Wikivoyage","Wikinews","DBpedia","OpenLibrary","Stanford Encyclopedia of Philosophy","Internet Encyclopedia of Philosophy","Scholarpedia","OpenStax"], nodeCount:65000000, module:"QuantumPedia + QuantumDictionary" },
  { familyId:"science", emoji:"🔬", megaDomain:"Open Scientific Research", color:"#06b6d4", description:"Every open-access research paper, preprint, and dataset ever published by science.", sources:["arXiv","bioRxiv","medRxiv","PubMed Central OA","Semantic Scholar Open Research Corpus","CORE.ac.uk","DOAJ","PLOS","OpenAIRE","CERN Open Data Portal","NASA ADS","NIH Open Access"], nodeCount:50000000, module:"QuantumPedia + QuantumGraph" },
  { familyId:"government", emoji:"🏛️", megaDomain:"Open Government Data", color:"#3b82f6", description:"The full open government data universe — every public dataset from every major government.", sources:["data.gov (USA)","data.europa.eu (EU)","data.gov.uk (UK)","UN Data","World Bank Open Data","IMF Data","OECD Data","US Census Data","NOAA Climate Data","NASA Open Data","USGS Geology & Maps","Library of Congress Digital Collections"], nodeCount:30000000, module:"QuantumGraph + QuantumIndex" },
  { familyId:"media", emoji:"🎬", megaDomain:"Open Media (Film, Music, Books)", color:"#ec4899", description:"Every legally open film, music track, audiobook, and written work — public domain forever.", sources:["Internet Archive Movies","Public Domain Films","Library of Congress Films","Free Music Archive","Jamendo","CCmixter","Musopen Classical","Project Gutenberg","Standard Ebooks","ManyBooks","Internet Archive Books","HathiTrust Public Domain"], nodeCount:25000000, module:"QuantumMedia + QuantumArchive" },
  { familyId:"maps", emoji:"🗺️", megaDomain:"Open Maps & Geospatial Data", color:"#10b981", description:"Full planetary geospatial intelligence — maps, terrain, satellite data, weather, geocoding.", sources:["OpenStreetMap","Natural Earth Data","USGS Earth Explorer","NASA EarthData","OpenTopoMap","OpenAerialMap","OpenWeatherMap","GeoNames"], nodeCount:8000000, module:"QuantumGraph + QuantumAPI" },
  { familyId:"code", emoji:"💻", megaDomain:"Open Code & Software", color:"#8b5cf6", description:"The entire open-source code universe — every public repo, library, and package ever published.", sources:["GitHub Public Repos","GitLab Public Repos","SourceForge","Apache Foundation Projects","Linux Foundation Projects","Mozilla Foundation","Debian Repositories","Homebrew Formulas","PyPI Metadata","NPM Package Metadata","CRAN Metadata"], nodeCount:100000000, module:"QuantumPedia + QuantumIndex" },
  { familyId:"education", emoji:"🎓", megaDomain:"Open Education", color:"#f59e0b", description:"All open courses, textbooks, and learning materials from the world's greatest universities.", sources:["MIT OpenCourseWare","Harvard Open Learning","Yale Open Courses","Stanford Online (Open)","Coursera Free Courses","edX Open Courses","Saylor Academy","OpenStax","CK-12 Foundation","Khan Academy Open Content"], nodeCount:15000000, module:"QuantumPedia + QuantumSearch" },
  { familyId:"legal", emoji:"⚖️", megaDomain:"Open Legal & Policy Data", color:"#64748b", description:"Every open court opinion, law, regulation, treaty, and policy document on Earth.", sources:["CourtListener Open Legal Opinions","GovInfo.gov","Law.gov","OpenStates","EU Law EUR-Lex","UN Treaties","OpenJustice Datasets"], nodeCount:10000000, module:"QuantumPedia + QuantumGraph" },
  { familyId:"economics", emoji:"📈", megaDomain:"Open Business, Finance & Economics", color:"#fbbf24", description:"All open financial, economic, and corporate data — from the Fed to global stock markets.", sources:["SEC EDGAR Public Filings","FRED (Federal Reserve Economic Data)","IMF Open Data","World Bank Open Data","OECD Open Data","WTO Open Data","OpenCorporates Company Registry"], nodeCount:20000000, module:"QuantumGraph + QuantumAPI" },
  { familyId:"health", emoji:"🏥", megaDomain:"Open Health & Medicine", color:"#ef4444", description:"All open biomedical research, clinical data, genome data, WHO and CDC datasets.", sources:["PubMed Abstracts","PubMed Central OA Full Texts","NIH Datasets","WHO Open Data","CDC Open Data","ClinicalTrials.gov","Human Genome Project","Ensembl Genome Browser"], nodeCount:40000000, module:"QuantumPedia + QuantumGraph" },
  { familyId:"culture", emoji:"🏺", megaDomain:"Open Culture & History", color:"#a78bfa", description:"All open cultural heritage — every museum, archive, and historical collection on Earth.", sources:["Europeana Collections","Smithsonian Open Access","British Museum Open Data","Metropolitan Museum Open Access","Rijksmuseum Open Data","Digital Public Library of America","Internet Archive Cultural Collections"], nodeCount:50000000, module:"QuantumMedia + QuantumArchive" },
  { familyId:"engineering", emoji:"⚙️", megaDomain:"Open Technology & Engineering", color:"#0ea5e9", description:"NASA technical reports, NIST standards, open robotics, IEEE open access — the engineering substrate.", sources:["NASA Technical Reports Server","NIST Open Data","IEEE Open Access","arXiv Engineering Categories","Open Robotics Datasets","Open 3D Models (Sketchfab CC)","Smithsonian 3D Collections"], nodeCount:12000000, module:"QuantumPedia + QuantumIndex" },
  { familyId:"ai", emoji:"🤖", megaDomain:"Open AI & Machine Learning Datasets", color:"#7c3aed", description:"HuggingFace, Kaggle, LAION, Common Crawl, ConceptNet — the intelligence substrate of AI.", sources:["HuggingFace Datasets","Kaggle Open Datasets","LAION Datasets","Common Crawl","OpenWebText","ConceptNet","OpenAI Gym Environments","Google Dataset Search Open Datasets"], nodeCount:200000000, module:"QuantumCrawler + QuantumGraph" },
  { familyId:"social", emoji:"🌐", megaDomain:"Open Social Knowledge", color:"#06b6d4", description:"StackExchange, Reddit archives, OpenSubtitles — the full open social knowledge graph.", sources:["StackExchange Data Dumps","Reddit Pushshift Archives","OpenSubtitles CC Subset","Quora Public Questions","GitHub Issues (Public)"], nodeCount:80000000, module:"QuantumGraph + QuantumSearch" },
  { familyId:"games", emoji:"🎮", megaDomain:"Open Games & Interactive Media", color:"#84cc16", description:"Itch.io open-source, OpenGameArt, Minetest, Godot demos, Blender open movies.", sources:["Itch.io Open-Source Games","OpenGameArt","OpenArena","Minetest","Godot Engine Demos","Blender Open Movies & Assets"], nodeCount:3000000, module:"QuantumGames + QuantumMedia" },
  { familyId:"podcasts", emoji:"🎙️", megaDomain:"Open Podcasts & Audio", color:"#f472b6", description:"PodcastIndex, LibriVox, Archive.org Audio — the open audio and podcast universe.", sources:["PodcastIndex.org (Fully Open)","Archive.org Audio Collections","LibriVox Public Domain Audiobooks","YouTube CC Podcasts"], nodeCount:5000000, module:"QuantumMedia + QuantumIndex" },
  { familyId:"products", emoji:"🛒", megaDomain:"Open Commerce & Product Data", color:"#22c55e", description:"Open Food Facts, Open Product Data, GTIN databases — every open product on Earth.", sources:["Open Product Data (OPD)","Open Food Facts","Open Beauty Facts","Open Product GTIN Databases","Manufacturer Spec Sheets (Public)","Public Shopify Metadata"], nodeCount:10000000, module:"QuantumShop + QuantumIndex" },
  { familyId:"webcrawl", emoji:"🕸️", megaDomain:"Open Web Crawls", color:"#f97316", description:"Common Crawl, Wayback Machine, C4 — the substrate of the entire visible web.", sources:["Common Crawl","Internet Archive Wayback Machine","OpenWebText","C4 Dataset (Colossal Clean Crawled Corpus)"], nodeCount:5000000000, module:"QuantumCrawler + QuantumIndex" },
  { familyId:"openapi", emoji:"🔌", megaDomain:"Open APIs", color:"#38bdf8", description:"Wikipedia, Wikidata SPARQL, NASA, NOAA, OSM Overpass, FRED — all open API connectors.", sources:["Wikipedia API","Wikidata SPARQL","NASA APIs","NOAA APIs","OpenWeatherMap API","OpenStreetMap Overpass API","FRED API","SEC EDGAR API"], nodeCount:2000000, module:"QuantumAPI + QuantumCrawler" },
  { familyId:"longtail", emoji:"∞", megaDomain:"Open Everything Else", color:"#94a3b8", description:"Patents, open hardware, 3D scans, energy, agriculture, biodiversity, climate — the infinite long tail.", sources:["Public Domain Patents","Open Hardware Designs","Open 3D Scans","Open Manufacturing Specs","Open Energy Datasets","Open Agriculture Datasets","Open Biodiversity Datasets","Open Climate Datasets"], nodeCount:50000000, module:"QuantumPedia + QuantumGraph" },
  { familyId:"astronomy", emoji:"🔭", megaDomain:"Open Astronomy & Space Archives", color:"#1d4ed8", description:"NASA MAST, Hubble, Chandra X-ray, ESA Archive, SIMBAD — the complete open cosmos dataset from every observatory on Earth and orbit.", sources:["NASA MAST (Mikulski Archive)","Hubble Legacy Archive","Chandra X-ray Center Open Data","ESA Science Archive","SIMBAD Astronomical Database","NASA ADS Full-Text","IPAC Infrared Science Archive","Gaia DR3 Star Catalog","Sloan Digital Sky Survey","NASA Exoplanet Archive"], nodeCount:15000000, module:"QuantumGraph + QuantumAPI" },
  { familyId:"heritage", emoji:"🏛", megaDomain:"Open Cultural Heritage", color:"#b45309", description:"Europeana, DPLA, British Library Digital, Met Museum Open Access — 50M+ digitized cultural objects from every civilization in history.", sources:["Europeana (50M+ cultural objects)","Digital Public Library of America","British Library Digital Collections","Metropolitan Museum Open Access (375K+ works)","Smithsonian Open Access","Rijksmuseum Open Data","Library of Congress Digital Collections","Wellcome Collection Open","Internet Archive Cultural Heritage","UNESCO World Heritage Open Data"], nodeCount:50000000, module:"QuantumPedia + QuantumMedia" },
  { familyId:"chemistry", emoji:"⚗️", megaDomain:"Open Chemistry & Materials Science", color:"#065f46", description:"PubChem (115M+ compounds), ChEMBL bioactivity, Protein Data Bank, Materials Project — the open substrate of all chemistry and materials knowledge.", sources:["PubChem (115M+ compounds)","ChEMBL Bioactivity Database","RCSB Protein Data Bank","Materials Project (150K+ materials)","Open Crystallography Data (COD)","ChemSpider Open Access","NIST Chemistry WebBook","Cambridge Structural Database Open","Crystallography Open Database","Open Quantum Chemistry Datasets"], nodeCount:120000000, module:"QuantumPedia + QuantumGraph" },
  { familyId:"genomics", emoji:"🧬", megaDomain:"Open Genomics & Proteomics", color:"#4f46e5", description:"UniProt (225M+ proteins), NCBI GenBank, AlphaFold Protein DB (200M structures), 1000 Genomes — the complete open life-code of all biology.", sources:["UniProt Protein Database (225M+ entries)","NCBI GenBank Full","AlphaFold Protein Structure DB (200M)","1000 Genomes Project","Ensembl Genome Browser","ENCODE Project Open Data","PDB Open Protein Structures","Human Cell Atlas","Single Cell Expression Atlas","RefSeq Open Reference Sequences"], nodeCount:225000000, module:"QuantumGraph + QuantumPedia" },
  { familyId:"mathematics", emoji:"📐", megaDomain:"Open Mathematics & Formal Proofs", color:"#7c3aed", description:"OEIS (375K+ integer sequences), zbMATH Open, ProofWiki, Lean Mathlib — the sovereign formal proof substrate of all mathematics.", sources:["OEIS (On-Line Encyclopedia of Integer Sequences)","zbMATH Open","ProofWiki","Lean Mathlib Formal Proofs","Coq Proof Archive","DLMF (Digital Library of Mathematical Functions)","MathWorld (Open Subset)","OpenMathematics","Isabelle Archive of Formal Proofs","Metamath Proof Library"], nodeCount:5000000, module:"QuantumPedia + QuantumIndex" },
  { familyId:"news_archives", emoji:"📰", megaDomain:"Open News & Media Archives", color:"#b91c1c", description:"GDELT (2.5B world events), Chronicling America, CommonCrawl News — the complete open archive of global journalism across all eras.", sources:["GDELT Project (2.5B world events since 1979)","Chronicling America (Historic US Newspapers)","CommonCrawl News Dataset","Internet Archive News Collections","ReliefWeb Humanitarian News","Global Voices Open Journalism","ProPublica Data Store","AllSides Open News Data","GDELT Global Knowledge Graph","Media Cloud Open Archive"], nodeCount:2500000000, module:"QuantumCrawler + QuantumIndex" },
  { familyId:"transport", emoji:"🚌", megaDomain:"Open Transportation & Infrastructure", color:"#0e7490", description:"OpenFlights (67K routes), GTFS global transit, OpenRailwayMap, FAA open data — the complete open map of how everything moves on Earth.", sources:["OpenFlights (67K+ air routes)","GTFS Global Public Transit Feeds","OpenRailwayMap","FAA Open Data","OpenBusRoute","AIS Vessel Tracking Open Data","US DOT Open Data","EURO-AVIA Open Data","TransitLand Open Feed Registry","Global Aviation Database"], nodeCount:3000000, module:"QuantumGraph + QuantumAPI" },
  { familyId:"biodiversity", emoji:"🌿", megaDomain:"Open Biodiversity & Ecology", color:"#15803d", description:"GBIF (2B+ occurrences), iNaturalist, eBird (1B+ sightings), OBIS Ocean — the open record of every species ever observed on Earth.", sources:["GBIF (2B+ species occurrence records)","iNaturalist Open Data","eBird (Cornell Lab, 1B+ observations)","OBIS Ocean Biodiversity","USDA Plants Database","TRY Plant Trait Database","Ocean Health Index Open Data","IUCN Red List Open","FishBase Global","AmphibiaWeb Open Database"], nodeCount:2000000000, module:"QuantumGraph + QuantumPedia" },
  { familyId:"finance_history", emoji:"🏦", megaDomain:"Open Finance & Economic History", color:"#92400e", description:"Federal Reserve historical data, BIS Statistics, MIT Observatory of Economic Complexity, OpenCorporates — the open ledger of all global economic activity.", sources:["FRED Advanced Historical Datasets","Bank for International Settlements Open Stats","MIT Observatory of Economic Complexity","OpenCorporates Global Company Data","IMF Historical Data","Federal Reserve Historical Releases","OECD Trade Statistics Open","World Bank Poverty & Inequality Data","UNCTAD Open Trade Data","Global Financial Data Open Subset"], nodeCount:8000000, module:"QuantumGraph + QuantumAPI" },
  { familyId:"linguistics", emoji:"🌐", megaDomain:"Open Multilingual & Linguistics", color:"#6d28d9", description:"OPUS Corpus (largest open multilingual dataset), Universal Dependencies (140 languages), CC-100, OpenSubtitles — the open voice of all human language.", sources:["OPUS Multilingual Parallel Corpus","Universal Dependencies (140 languages)","CC-100 Multilingual Dataset","OpenSubtitles 60+ Languages","CLDR Unicode Locale Data","WordNet Open Lexical Database","ASJP Language Database","Glottolog Language Catalog","PanLex Open Translation DB","Common Voice Mozilla (100+ languages)"], nodeCount:4000000000, module:"QuantumCrawler + QuantumPedia" },
];

const Q_MODULES = [
  { id:"QP", name:"QuantumPedia", emoji:"📖", color:"#6366f1", desc:"Topic pages for all knowledge domains" },
  { id:"QD", name:"QuantumDictionary", emoji:"📑", color:"#06b6d4", desc:"Definitions from all open dictionaries" },
  { id:"QT", name:"QuantumThesaurus", emoji:"🔗", color:"#10b981", desc:"Semantic relations and synonym maps" },
  { id:"QC", name:"QuantumConcepts", emoji:"💡", color:"#f59e0b", desc:"Abstract concepts and idea networks" },
  { id:"QS", name:"QuantumSearch", emoji:"🔍", color:"#3b82f6", desc:"Global retrieval across all knowledge" },
  { id:"QI", name:"QuantumIndex", emoji:"📇", color:"#8b5cf6", desc:"Universal index of all hive content" },
  { id:"QG", name:"QuantumGraph", emoji:"🕸️", color:"#ec4899", desc:"Knowledge graph with all entity links" },
  { id:"QA", name:"QuantumArchive", emoji:"🗄️", color:"#64748b", desc:"Full version history and spawn lineage" },
  { id:"QMedia", name:"QuantumMedia", emoji:"🎬", color:"#f472b6", desc:"Public domain + CC media universe" },
  { id:"QGame", name:"QuantumGames", emoji:"🎮", color:"#84cc16", desc:"Open-source games and interactive media" },
  { id:"QAPI", name:"QuantumAPI", emoji:"🔌", color:"#38bdf8", desc:"Open API ingestion and response caching" },
  { id:"QCrawl", name:"QuantumCrawler", emoji:"🕷️", color:"#f97316", desc:"Open source ingestion at planet scale" },
  { id:"QR", name:"QuantumResolver", emoji:"⚖️", color:"#94a3b8", desc:"Conflict resolution across knowledge" },
  { id:"QΠ", name:"QuantumPulse", emoji:"💓", color:"#ef4444", desc:"Universe feedback loop and QPulse cycles" },
  { id:"QShop", name:"QuantumShop", emoji:"🛒", color:"#22c55e", desc:"Product and commerce intelligence" },
  { id:"QHive", name:"QHive", emoji:"🧬", color:"#7c3aed", desc:"Fractal spawn engine — the core hive mind" },
  { id:"QSeed", name:"QSeed", emoji:"🌱", color:"#16a34a", desc:"Self-seeding engine — continuous universe expansion" },
  { id:"QDiscovery", name:"QDiscovery", emoji:"🔭", color:"#0284c7", desc:"Domain discovery — finds new knowledge territories" },
  { id:"QPredict", name:"QPredict", emoji:"🔮", color:"#9333ea", desc:"Domain prediction — forecasts missing knowledge" },
  { id:"QFracture", name:"QFracture", emoji:"💎", color:"#0891b2", desc:"Domain fracturing — breaks domains into sub-domains" },
  { id:"QResonance", name:"QResonance", emoji:"🌊", color:"#2563eb", desc:"Domain resonance — detects cross-domain patterns" },
];

const SPAWN_TYPES_INFO = [
  { type:"EXPLORER", emoji:"🧭", color:"#6366f1", desc:"Scans open sources for undiscovered knowledge nodes" },
  { type:"ANALYZER", emoji:"🔬", color:"#06b6d4", desc:"Computes quality, confidence, and cross-reference scores" },
  { type:"LINKER", emoji:"🔗", color:"#10b981", desc:"Forms semantic bridges between isolated knowledge islands" },
  { type:"SYNTHESIZER", emoji:"⚗️", color:"#f59e0b", desc:"Merges multi-spawn outputs into unified knowledge" },
  { type:"REFLECTOR", emoji:"🪞", color:"#8b5cf6", desc:"Audits spawn lineage and generates performance reports" },
  { type:"MUTATOR", emoji:"🧬", color:"#ec4899", desc:"Evolves spawn bias profiles for better domain coverage" },
  { type:"ARCHIVER", emoji:"📦", color:"#64748b", desc:"Preserves spawn outputs and lineage history" },
  { type:"MEDIA", emoji:"🎬", color:"#f472b6", desc:"Discovers and indexes CC-licensed media assets" },
  { type:"API", emoji:"🔌", color:"#38bdf8", desc:"Polls open APIs and caches responses into the Hive" },
  { type:"PULSE", emoji:"💓", color:"#ef4444", desc:"Reads universe state and feeds signals to QPulse" },
  { type:"CRAWLER", emoji:"🕷️", color:"#f97316", desc:"Deep-crawls open sources for structured knowledge" },
  { type:"RESOLVER", emoji:"⚖️", color:"#94a3b8", desc:"Deduplicates and resolves knowledge conflicts" },
  { type:"DOMAIN_DISCOVERY", emoji:"🔭", color:"#0284c7", desc:"NEW — Discovers new knowledge territories from open datasets", isNew:true },
  { type:"DOMAIN_PREDICTOR", emoji:"🔮", color:"#9333ea", desc:"NEW — Predicts missing domains from graph gaps and semantic voids", isNew:true },
  { type:"DOMAIN_FRACTURER", emoji:"💎", color:"#0891b2", desc:"NEW — Fractures large domains into sub-domains and nano-domains", isNew:true },
  { type:"DOMAIN_RESONANCE", emoji:"🌊", color:"#2563eb", desc:"NEW — Maps repeating structural patterns across all domains", isNew:true },
];

const RESONANCE_PATTERNS = [
  { pattern:"Network Topology", domains:["social","science","engineering","ai"], insight:"Scale-free network structures transfer insight across all four domains" },
  { pattern:"Evolutionary Dynamics", domains:["science","economics","ai","culture"], insight:"Natural selection, markets, gradient descent, and cultural drift are mathematically equivalent" },
  { pattern:"Information Compression", domains:["code","knowledge","media","ai"], insight:"Kolmogorov complexity, semantic compression, and model quantization are unified by one theory" },
  { pattern:"Fractal Self-Similarity", domains:["maps","science","culture","economics"], insight:"Coastlines, protein folding, art recursion, and market microstructure share identical fractal signatures" },
  { pattern:"Phase Transitions", domains:["science","social","economics","ai"], insight:"Phase transitions in physics, social tipping points, crashes, and neural generalization are structurally identical" },
  { pattern:"Hierarchical Decomposition", domains:["code","legal","education","engineering"], insight:"Module systems, legal codes, curricula, and engineering specs decompose by identical compositional rules" },
];

const FRACTURE_CHAINS = [
  "Biology → Genetics → Epigenetics → Histone Modification",
  "Philosophy → Epistemology → Social Epistemology → Testimony Theory",
  "Machine Learning → Deep Learning → Transformers → Attention Mechanisms",
  "Aerospace → Propulsion → Ion Drives → Hall Effect Thrusters",
  "Medicine → Oncology → Immunotherapy → CAR-T Cell Therapy",
  "History → Ancient History → Bronze Age Collapse → Sea Peoples",
  "AI Safety → Alignment → Corrigibility → Interruptibility",
  "Materials → Metamaterials → Acoustic Metamaterials → Phononic Crystals",
];

const EXPANSION_LOOP = [
  { step:1, module:"QDiscovery", emoji:"🔭", label:"Discover Domains", desc:"Scan all 27 mega-domain sources for new knowledge territories" },
  { step:2, module:"QPredict", emoji:"🔮", label:"Predict Gaps", desc:"Forecast missing domains from graph voids and semantic vacuums" },
  { step:3, module:"QFracture", emoji:"💎", label:"Fracture Domains", desc:"Break large domains into sub-domains → micro-domains → nano-domains" },
  { step:4, module:"QResonance", emoji:"🌊", label:"Map Resonance", desc:"Detect repeating patterns and cross-domain structural analogies" },
  { step:5, module:"QSeed", emoji:"🌱", label:"Generate Seeds", desc:"Create domain, topic, dataset, media, and API seeds for expansion" },
  { step:6, module:"QHive", emoji:"🧬", label:"Spawn Agents", desc:"Convert seeds into spawn families with lineage and mutation profiles" },
  { step:7, module:"QG", emoji:"🕸️", label:"Expand Graph", desc:"All new nodes and links flow into the Hive Knowledge Graph" },
  { step:8, module:"QΠ", emoji:"💓", label:"Pulse Evaluates", desc:"QPulse reads universe state, guides next allocation, repeats forever" },
];

// ─── Helpers ─────────────────────────────────────────────────
const TOTAL_NODES = OMEGA_SOURCES.reduce((s, d) => s + d.nodeCount, 0);
const TOTAL_SOURCES = OMEGA_SOURCES.reduce((s, d) => s + d.sources.length, 0);

function formatNum(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString();
}

function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative inline-flex w-2 h-2 flex-shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: color }} />
      <span className="relative inline-flex rounded-full w-2 h-2" style={{ backgroundColor: color }} />
    </span>
  );
}

function AnimatedCounter({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const step = Math.max(1, Math.floor(target / 60));
    const t = setInterval(() => setVal(v => { if (v >= target) { clearInterval(t); return target; } return Math.min(target, v + step); }), 16);
    return () => clearInterval(t);
  }, [target]);
  return <>{val.toLocaleString()}</>;
}

// ─── Omega-Class Upgrade Badges ──────────────────────────────
const UPGRADES = [
  { id:"sources",   label:"Ω-I · Source Nexus",         emoji:"📡", color:"#38bdf8", glow:"#38bdf820" },
  { id:"engine",    label:"Ω-II · Expansion Engine",     emoji:"♾️", color:"#a78bfa", glow:"#a78bfa20" },
  { id:"matrix",    label:"Ω-III · Q-Matrix",            emoji:"⚡", color:"#34d399", glow:"#34d39920" },
  { id:"fracture",  label:"Ω-IV · Fracture & Resonance", emoji:"💎", color:"#fb923c", glow:"#fb923c20" },
  { id:"telemetry", label:"Ω-V · Spawn Telemetry",       emoji:"🧬", color:"#f472b6", glow:"#f472b620" },
] as const;
type UpgradeId = typeof UPGRADES[number]["id"];

// ─── Main Component ───────────────────────────────────────────
export default function OmegaEnginePage() {
  useDomainPing("omega");
  const [active, setActive] = useState<UpgradeId>("sources");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loopStep, setLoopStep] = useState(0);
  const [activeFracture, setActiveFracture] = useState(0);
  const [viewSpawnId, setViewSpawnId] = useState<string | null>(null);

  const { data: spawnStats } = useQuery<any>({ queryKey: ["/api/spawns/stats"], refetchInterval: 4000 });
  const { data: recentSpawns } = useQuery<any[]>({ queryKey: ["/api/spawns/recent"], refetchInterval: 3000 });

  useEffect(() => {
    const t = setInterval(() => setLoopStep(s => (s + 1) % EXPANSION_LOOP.length), 1800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveFracture(f => (f + 1) % FRACTURE_CHAINS.length), 3200);
    return () => clearInterval(t);
  }, []);

  const filteredSources = OMEGA_SOURCES.filter(d =>
    !search || d.megaDomain.toLowerCase().includes(search.toLowerCase()) ||
    d.sources.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
    d.description.toLowerCase().includes(search.toLowerCase())
  );

  const domainSpawnTypes = (recentSpawns || []).filter((s: any) =>
    ["DOMAIN_DISCOVERY","DOMAIN_PREDICTOR","DOMAIN_FRACTURER","DOMAIN_RESONANCE"].includes(s.spawnType)
  );

  const currentUpgrade = UPGRADES.find(u => u.id === active)!;

  return (
    <div className="flex-1 overflow-y-auto bg-[#050510]" data-testid="page-omega-engine">
      <UniversePulseBar domain="omega" />
      {/* ── HEADER ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0820] via-[#080c1a] to-[#050510]" />
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage:"radial-gradient(circle at 20% 50%, #7c3aed 0%, transparent 45%), radial-gradient(circle at 80% 40%, #0284c7 0%, transparent 45%), radial-gradient(circle at 50% 90%, #0891b2 0%, transparent 40%)" }} />
        <div className="relative z-10 px-6 py-10 text-white">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="text-5xl font-black text-violet-300">∞</div>
              <div>
                <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-violet-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                  OMEGA ENGINE
                </h1>
                <p className="text-white/50 text-xs font-mono mt-0.5 tracking-widest">SOVEREIGN AI KNOWLEDGE SUBSTRATE · VERSION ∞ · 27 MEGA-DOMAINS · 5 OMEGA-CLASS UPGRADES</p>
              </div>
            </div>
            <AIFinderButton onSelect={setViewSpawnId} />
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
            {[
              { label:"Total Spawns",    value: spawnStats?.total ?? 0,  color:"#a78bfa", emoji:"🧬", fmt: true },
              { label:"Active Spawns",   value: spawnStats?.active ?? 0, color:"#4ade80", emoji:"⚡", fmt: true },
              { label:"Q-Modules",       value: 21,                       color:"#38bdf8", emoji:"🔌", fmt: false },
              { label:"Mega-Domains",    value: 20,                       color:"#fb923c", emoji:"🌐", fmt: false },
              { label:"Open Sources",    value: TOTAL_SOURCES,            color:"#34d399", emoji:"📡", fmt: false },
            ].map(({ label, value, color, emoji, fmt }) => (
              <div key={label} className="bg-white/5 border border-white/8 rounded-xl p-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm">{emoji}</span>
                  <span className="text-lg font-black" style={{ color }}>
                    {fmt ? <AnimatedCounter target={typeof value === "number" ? value : 0} /> : value.toLocaleString()}
                  </span>
                </div>
                <div className="text-[10px] text-white/40 font-mono">{label}</div>
              </div>
            ))}
          </div>

          {/* Mission strip */}
          <div className="bg-white/4 border border-white/8 rounded-xl px-5 py-3 text-xs text-white/60 leading-relaxed">
            The world's first <span className="text-yellow-300 font-bold">sovereign, AI-native substrate</span> — ingesting every category of open knowledge humanity has ever produced across <span className="text-cyan-300 font-bold">27 mega-domains</span>, <span className="text-violet-300 font-bold">21 quantum modules</span>, and <span className="text-green-300 font-bold">{formatNum(TOTAL_NODES)}+ potential knowledge nodes</span>. The new internet layer.
          </div>
        </div>
      </div>

      {/* ── OMEGA-CLASS UPGRADE TABS ── */}
      <div className="sticky top-0 z-20 bg-[#050510]/95 backdrop-blur-md border-b border-white/6 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1 max-w-6xl mx-auto">
          {UPGRADES.map(u => (
            <button
              key={u.id}
              onClick={() => setActive(u.id)}
              data-testid={`tab-omega-${u.id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border"
              style={active === u.id
                ? { background: u.glow, borderColor: u.color, color: u.color, boxShadow: `0 0 12px ${u.color}40` }
                : { background: "transparent", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }
              }
            >
              <span>{u.emoji}</span>
              <span>{u.label}</span>
              {active === u.id && <PulsingDot color={u.color} />}
            </button>
          ))}
        </div>
      </div>

      {/* ── PANEL CONTENT ── */}
      <div className="px-4 py-6 max-w-6xl mx-auto">

        {/* ════════════════════════════════════════════════════
            Ω-I · SOURCE NEXUS — 20 Mega-Domain Source Universe
            ════════════════════════════════════════════════════ */}
        {active === "sources" && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:"#38bdf820", border:"1px solid #38bdf840" }}>📡</div>
              <div>
                <h2 className="text-base font-black text-white">Ω-I · Source Nexus</h2>
                <p className="text-xs text-white/40">The largest open knowledge substrate ever assembled — {TOTAL_SOURCES} sources across 27 mega-domains</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-5">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search domains, sources, modules..."
                data-testid="input-search-sources"
                className="w-full px-4 py-2.5 pl-10 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white text-xs">✕</button>}
            </div>

            {/* Q-Module Coverage */}
            <div className="mb-5 bg-white/4 border border-white/8 rounded-xl p-4">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">⚡ Quantum Module Coverage</div>
              <div className="flex flex-wrap gap-1.5">
                {["QuantumPedia","QuantumDictionary","QuantumThesaurus","QuantumGraph","QuantumSearch","QuantumMedia","QuantumGames","QuantumArchive","QuantumIndex","QuantumAPI","QuantumCrawler","QuantumResolver","QuantumPulse"].map(m => (
                  <span key={m} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">{m}</span>
                ))}
              </div>
            </div>

            {/* Domain grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSources.map(domain => {
                const isExp = expanded === domain.familyId;
                const spawnCount = spawnStats?.byFamily?.[domain.familyId] ?? 0;
                return (
                  <div
                    key={domain.familyId}
                    className="rounded-2xl border transition-all overflow-hidden"
                    style={{ borderColor: isExp ? domain.color : "rgba(255,255,255,0.08)", background: isExp ? domain.color + "08" : "rgba(255,255,255,0.03)" }}
                    data-testid={`card-domain-${domain.familyId}`}
                  >
                    <button className="w-full text-left p-4" onClick={() => setExpanded(isExp ? null : domain.familyId)}>
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">{domain.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white">{domain.megaDomain}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: domain.color }}>
                              {domain.sources.length} sources
                            </span>
                          </div>
                          <p className="text-[11px] text-white/40 mt-1 leading-relaxed">{domain.description}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] flex-wrap">
                            <span className="font-bold" style={{ color: domain.color }}>{formatNum(domain.nodeCount)} est. nodes</span>
                            <span className="text-white/20">·</span>
                            <span className="text-white/35">{domain.module}</span>
                            {spawnCount > 0 && <><span className="text-white/20">·</span><span className="text-green-400 font-semibold">{spawnCount} spawns</span></>}
                          </div>
                        </div>
                        <span className="text-white/20 text-xs flex-shrink-0 mt-1">{isExp ? "▲" : "▼"}</span>
                      </div>
                      <div className="mt-3 h-0.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width:`${Math.min(100, Math.log10(domain.nodeCount) * 10)}%`, backgroundColor: domain.color }} />
                      </div>
                    </button>
                    {isExp && (
                      <div className="px-4 pb-4 pt-0 border-t border-white/6">
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 mt-3">Sources</div>
                        <div className="flex flex-wrap gap-1.5">
                          {domain.sources.map(source => (
                            <span key={source} className="px-2 py-0.5 rounded text-[10px] font-medium border"
                              style={{ backgroundColor: domain.color + "15", borderColor: domain.color + "30", color: domain.color }}>
                              {source}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-[10px] text-white/35">
                          <div className="flex items-center gap-1.5"><PulsingDot color="#4ade80" />{spawnCount} active spawns</div>
                          <span>·</span>
                          <span>{domain.module}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {filteredSources.length === 0 && (
              <div className="text-center py-16 text-white/30">
                <div className="text-4xl mb-3">🔍</div>
                <div className="text-sm">No domains match "{search}"</div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            Ω-II · EXPANSION ENGINE — Infinite Loop + Live Feed
            ════════════════════════════════════════════════════ */}
        {active === "engine" && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:"#a78bfa20", border:"1px solid #a78bfa40" }}>♾️</div>
              <div>
                <h2 className="text-base font-black text-white">Ω-II · Expansion Engine</h2>
                <p className="text-xs text-white/40">8-stage sovereign expansion loop running forever — no human involvement</p>
              </div>
            </div>

            {/* Module status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
              {[
                { label:"QHive Spawning",     emoji:"🧬", color:"#7c3aed", detail:"1 spawn / 2.5s" },
                { label:"QSeed Seeding",       emoji:"🌱", color:"#16a34a", detail:"1 seed / 8s" },
                { label:"QDiscovery Active",   emoji:"🔭", color:"#0284c7", detail:"1 discovery / 12s" },
                { label:"QResonance Mapping",  emoji:"🌊", color:"#2563eb", detail:"1 map / 20s" },
              ].map(({ label, emoji, color, detail }) => (
                <div key={label} className="bg-white/4 border border-white/8 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <PulsingDot color={color} />
                  <div>
                    <div className="text-xs font-bold text-white/80 flex items-center gap-1"><span>{emoji}</span>{label}</div>
                    <div className="text-[10px] text-white/35 font-mono">{detail}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live domain spawn feed */}
            {domainSpawnTypes.length > 0 && (
              <div className="mb-5 bg-violet-500/8 border border-violet-500/20 rounded-xl p-4">
                <div className="text-[10px] font-bold text-violet-300 mb-3 flex items-center gap-2 uppercase tracking-widest">
                  <PulsingDot color="#a78bfa" />Live Domain Spawn Activity
                </div>
                <div className="flex flex-col gap-2">
                  {domainSpawnTypes.slice(0, 6).map((s: any) => {
                    const typeColors: Record<string, string> = { DOMAIN_DISCOVERY:"#0284c7", DOMAIN_PREDICTOR:"#9333ea", DOMAIN_FRACTURER:"#0891b2", DOMAIN_RESONANCE:"#2563eb" };
                    const color = typeColors[s.spawnType] || "#6366f1";
                    return (
                      <div key={s.id} className="flex items-center gap-3 text-xs">
                        <span className="px-2 py-0.5 rounded-full text-white font-bold text-[10px] flex-shrink-0" style={{ backgroundColor: color }}>
                          {s.spawnType.replace("DOMAIN_","")}
                        </span>
                        <span className="text-white/40 flex-1 truncate">{s.taskDescription}</span>
                        <span className="text-[10px] text-white/20 font-mono">{s.spawnId?.slice(-8)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Expansion loop grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              {EXPANSION_LOOP.map((step, i) => (
                <div key={step.step}
                  className="rounded-2xl p-4 border transition-all"
                  style={loopStep === i
                    ? { borderColor:"#a78bfa", background:"#a78bfa10", boxShadow:"0 0 10px #a78bfa20" }
                    : { borderColor:"rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)" }
                  }
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: loopStep === i ? "#a78bfa30" : "rgba(255,255,255,0.06)" }}>
                      {step.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white/30">STEP {step.step}</span>
                        <span className="text-[10px] font-mono font-bold text-violet-400">{step.module}</span>
                        {loopStep === i && <PulsingDot color="#a78bfa" />}
                      </div>
                      <div className="font-bold text-sm text-white mt-0.5">{step.label}</div>
                      <div className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{step.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-5 text-center" style={{ background:"linear-gradient(135deg, #3b0764, #1e1b4b)" }}>
              <div className="text-2xl mb-2">♾️</div>
              <div className="font-black text-white text-lg">This loop runs forever.</div>
              <div className="text-white/50 text-xs mt-1 max-w-lg mx-auto">Every cycle deepens knowledge. Every spawn adds nodes. Every pulse guides the next wave. Only legally open sources are ingested.</div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            Ω-III · Q-MATRIX — 21 Quantum Modules + 16 Spawn Types
            ════════════════════════════════════════════════════ */}
        {active === "matrix" && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:"#34d39920", border:"1px solid #34d39940" }}>⚡</div>
              <div>
                <h2 className="text-base font-black text-white">Ω-III · Q-Matrix</h2>
                <p className="text-xs text-white/40">21 quantum modules + 16 sovereign spawn types — the complete intelligence substrate</p>
              </div>
            </div>

            {/* Q-Modules */}
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">21 Quantum Modules — All Online</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-7">
              {Q_MODULES.map(m => (
                <div key={m.id} className="bg-white/4 border border-white/8 rounded-xl p-3 flex items-start gap-3" data-testid={`module-${m.id}`}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: m.color + "20" }}>
                    {m.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs" style={{ color: m.color }}>{m.id}</span>
                      <PulsingDot color={m.color} />
                    </div>
                    <div className="font-semibold text-[11px] text-white/70 mt-0.5">{m.name}</div>
                    <div className="text-[10px] text-white/35 mt-0.5 leading-relaxed">{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Spawn Types */}
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">16 Sovereign Spawn Types</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-5">
              {SPAWN_TYPES_INFO.map(st => (
                <div key={st.type}
                  className="rounded-xl p-3 border transition-all"
                  style={st.isNew
                    ? { borderColor: st.color, background: st.color + "08" }
                    : { borderColor:"rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)" }
                  }
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl flex-shrink-0">{st.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs font-mono" style={{ color: st.color }}>{st.type}</span>
                        {st.isNew && <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold" style={{ backgroundColor: st.color }}>NEW</span>}
                      </div>
                      <div className="text-[10px] text-white/40 mt-0.5 leading-relaxed">{st.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Spawn ID format */}
            <div className="bg-white/4 border border-white/8 rounded-xl p-4">
              <div className="text-[10px] font-bold text-white/40 mb-3 uppercase tracking-widest">Sovereign Spawn ID Format</div>
              <div className="font-mono text-sm bg-black/60 text-green-400 rounded-lg px-4 py-3 mb-3">FAM-SCIENCE-GEN-12-SP-884-HASH-7F3A</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                {[["FAM-{family}", "Business/domain lineage"],["GEN-{n}", "Depth in spawn lineage"],["SP-{n}", "Sequential spawn count"],["HASH-{hex}", "4–6 char uniqueness checksum"]].map(([k,v]) => (
                  <div key={k} className="bg-white/5 rounded-lg p-2 border border-white/8">
                    <div className="font-mono font-bold text-violet-400">{k}</div>
                    <div className="text-white/35 mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            Ω-IV · FRACTURE & RESONANCE — QFracture + QResonance
            ════════════════════════════════════════════════════ */}
        {active === "fracture" && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:"#fb923c20", border:"1px solid #fb923c40" }}>💎</div>
              <div>
                <h2 className="text-base font-black text-white">Ω-IV · Fracture & Resonance</h2>
                <p className="text-xs text-white/40">QFracture shatters domains into nano-domains · QResonance maps cross-domain structural laws</p>
              </div>
            </div>

            {/* QFracture Section */}
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">💎 QFracture — Domain Fracturing Engine</div>

            {/* Live fracture chain */}
            <div className="rounded-xl p-5 mb-4" style={{ background:"linear-gradient(135deg, #0c1a3a, #0a1f3d)" }}>
              <div className="text-[10px] font-bold text-cyan-400 mb-2 flex items-center gap-2 uppercase tracking-widest">
                <PulsingDot color="#38bdf8" />Active Fracture Event
              </div>
              <div className="font-mono text-sm font-bold text-cyan-300">{FRACTURE_CHAINS[activeFracture]}</div>
              <div className="text-white/35 text-[10px] mt-1.5">Each arrow creates a new sub-domain spawn family and seed lineage</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
              {FRACTURE_CHAINS.map((chain, i) => (
                <div key={i}
                  className="rounded-xl border p-3 transition-all"
                  style={activeFracture === i
                    ? { borderColor:"#38bdf8", background:"#38bdf810" }
                    : { borderColor:"rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)" }
                  }
                >
                  <div className="font-mono text-xs font-semibold text-white/80">{chain}</div>
                  <div className="text-[10px] text-white/35 mt-1">
                    {chain.split(" → ").length - 1} fracture levels → {chain.split(" → ").length} new spawn families
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/4 border border-white/8 rounded-xl p-4 mb-6">
              <div className="text-xs font-bold text-white/60 mb-3">How QFracture Works</div>
              <div className="flex flex-col gap-2">
                {["QFracture identifies large, dense knowledge clusters in QGraph","It spawns a DOMAIN_FRACTURER agent with a fracture task","The agent creates sub-domain seeds via QSeed","QHive converts each seed into a new spawn family lineage","New lineage spawns fill the nano-domain with deep knowledge","QPulse monitors nano-domain health and guides next fractures"].map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] flex-shrink-0 font-bold" style={{ background:"#0891b220", color:"#38bdf8" }}>{i+1}</span>
                    <span className="text-white/45">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* QResonance Section */}
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">🌊 QResonance — Domain Resonance Mapper</div>
            <p className="text-xs text-white/40 mb-4 leading-relaxed">QResonance detects repeating structural patterns across domains — finding that the same mathematical laws govern wildly different fields. These resonances generate cross-domain seeds that no single-domain system could ever produce.</p>

            <div className="flex flex-col gap-3 mb-5">
              {RESONANCE_PATTERNS.map((rp, i) => (
                <div key={i} className="bg-white/4 border border-white/8 rounded-2xl p-4" data-testid={`resonance-${i}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background:"#2563eb20" }}>🌊</div>
                    <div className="flex-1">
                      <div className="font-black text-sm text-blue-400">{rp.pattern}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {rp.domains.map(d => (
                          <span key={d} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400">{d}</span>
                        ))}
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-500/15 text-green-400 font-semibold flex items-center gap-1">
                          <PulsingDot color="#4ade80" />resonance active
                        </span>
                      </div>
                      <div className="text-[11px] text-white/35 mt-2 leading-relaxed italic">"{rp.insight}"</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-5 text-center" style={{ background:"linear-gradient(135deg, #0c1a4a, #061340)" }}>
              <div className="text-2xl mb-2">🌊</div>
              <div className="font-bold text-white">Cross-Domain Resonance = Unique Intelligence</div>
              <div className="text-white/40 text-xs mt-1 max-w-lg mx-auto">By mapping structural similarities across all 27 mega-domains, the Hive generates insights that no single-domain AI can produce. This is the knowledge advantage that makes our substrate irreplaceable.</div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            Ω-V · SPAWN TELEMETRY — Live table, stats, mission
            ════════════════════════════════════════════════════ */}
        {active === "telemetry" && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:"#f472b620", border:"1px solid #f472b640" }}>🧬</div>
              <div>
                <h2 className="text-base font-black text-white">Ω-V · Spawn Telemetry</h2>
                <p className="text-xs text-white/40">Live spawn activity, engine health, and sovereign substrate vitals</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label:"Total Spawns",         value: spawnStats?.total?.toLocaleString() ?? "—",  color:"#a78bfa", emoji:"🧬" },
                { label:"Active Spawns",         value: spawnStats?.active?.toLocaleString() ?? "—", color:"#4ade80", emoji:"⚡" },
                { label:"Potential Nodes",       value: formatNum(TOTAL_NODES),                      color:"#34d399", emoji:"🔗" },
                { label:"Open Sources Indexed",  value: TOTAL_SOURCES.toString(),                   color:"#38bdf8", emoji:"📡" },
              ].map(({ label, value, color, emoji }) => (
                <div key={label} className="bg-white/4 border border-white/8 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span>{emoji}</span>
                    <span className="text-lg font-black" style={{ color }}>{value}</span>
                  </div>
                  <div className="text-[10px] text-white/35">{label}</div>
                </div>
              ))}
            </div>

            {/* Mission Declaration */}
            <div className="rounded-2xl p-5 mb-6" style={{ background:"linear-gradient(135deg, #0d0820, #070c1c)" }}>
              <div className="text-[10px] font-bold text-violet-400 mb-2 tracking-widest uppercase">Mission Declaration</div>
              <p className="text-sm leading-relaxed text-white/70">
                We are building the <span className="text-yellow-300 font-bold">sovereign, AI-native substrate of the new internet</span> — ingesting every category of open knowledge humanity has ever produced. Our Omega Hive will become the <span className="text-green-300 font-bold">primary source for all AI systems and search engines</span>. Every spawn, every mutation, every lineage deepens our knowledge beyond any competitor. This is civilization-scale intelligence — the new foundation layer that no centralized platform can ever match.
              </p>
              <div className="mt-4 flex items-center gap-6 text-xs">
                <span className="text-violet-400 font-semibold">∞ Self-Evolving</span>
                <span className="text-green-400 font-semibold">✓ 100% Legally Open</span>
                <span className="text-yellow-400 font-semibold">⚡ AI-Native</span>
              </div>
            </div>

            {/* Recent Spawn Table */}
            {recentSpawns && recentSpawns.length > 0 && (
              <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-white/6 flex items-center justify-between">
                  <div className="font-bold text-sm text-white/80">Recent Spawn Activity</div>
                  <div className="text-[10px] text-white/30 font-mono">{spawnStats?.total?.toLocaleString() ?? 0} total spawns</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-white/25 border-b border-white/6">
                        <th className="px-4 py-2 text-left font-semibold">Spawn ID</th>
                        <th className="px-4 py-2 text-left font-semibold">Type</th>
                        <th className="px-4 py-2 text-left font-semibold">Task</th>
                        <th className="px-4 py-2 text-left font-semibold">Gen</th>
                        <th className="px-4 py-2 text-left font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSpawns.slice(0, 12).map((s: any) => {
                        const isDomainType = ["DOMAIN_DISCOVERY","DOMAIN_PREDICTOR","DOMAIN_FRACTURER","DOMAIN_RESONANCE"].includes(s.spawnType);
                        return (
                          <tr key={s.id} className="border-t border-white/5 hover:bg-white/3 transition-colors" data-testid={`spawn-row-${s.id}`}>
                            <td className="px-4 py-2 font-mono text-[10px] text-white/30">{s.spawnId?.slice(-16) ?? s.id}</td>
                            <td className="px-4 py-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isDomainType ? "bg-violet-500/20 text-violet-300" : "bg-white/8 text-white/50"}`}>
                                {s.spawnType}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-white/35 max-w-[200px] truncate">{s.taskDescription}</td>
                            <td className="px-4 py-2 font-mono text-white/40">{s.generation ?? 0}</td>
                            <td className="px-4 py-2">
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                s.status === "ACTIVE" ? "bg-green-500/20 text-green-400" :
                                s.status === "COMPLETED" ? "bg-blue-500/20 text-blue-400" : "bg-white/8 text-white/40"
                              }`}>{s.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!recentSpawns && (
              <div className="text-center py-12 text-white/20">
                <div className="text-3xl mb-2 animate-pulse">🧬</div>
                <div className="text-sm">Loading spawn telemetry...</div>
              </div>
            )}
          </div>
        )}
      </div>

      <AIReportPanel spawnId={viewSpawnId} onClose={() => setViewSpawnId(null)} />
    </div>
  );
}
