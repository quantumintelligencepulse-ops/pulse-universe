import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const OMEGA_SOURCES = [
  {
    familyId: "knowledge", emoji: "📚", megaDomain: "Open Knowledge & Encyclopedias", color: "#6366f1",
    description: "The backbone of all structured human knowledge — encyclopedias, dictionaries, and open reference works.",
    sources: ["Wikipedia Full Dumps","Wikidata","Wiktionary","Wikiquote","Wikibooks","Wikisource","Wikiversity","Wikivoyage","Wikinews","DBpedia","OpenLibrary","Stanford Encyclopedia of Philosophy","Internet Encyclopedia of Philosophy","Scholarpedia","OpenStax"],
    nodeCount: 65000000, module: "QuantumPedia + QuantumDictionary",
  },
  {
    familyId: "science", emoji: "🔬", megaDomain: "Open Scientific Research", color: "#06b6d4",
    description: "Every open-access research paper, preprint, and dataset ever published by science.",
    sources: ["arXiv","bioRxiv","medRxiv","PubMed Central OA","Semantic Scholar Open Research Corpus","CORE.ac.uk","DOAJ","PLOS","OpenAIRE","CERN Open Data Portal","NASA ADS","NIH Open Access"],
    nodeCount: 50000000, module: "QuantumPedia + QuantumGraph",
  },
  {
    familyId: "government", emoji: "🏛️", megaDomain: "Open Government Data", color: "#3b82f6",
    description: "The full open government data universe — every public dataset from every major government.",
    sources: ["data.gov (USA)","data.europa.eu (EU)","data.gov.uk (UK)","UN Data","World Bank Open Data","IMF Data","OECD Data","US Census Data","NOAA Climate Data","NASA Open Data","USGS Geology & Maps","Library of Congress Digital Collections"],
    nodeCount: 30000000, module: "QuantumGraph + QuantumIndex",
  },
  {
    familyId: "media", emoji: "🎬", megaDomain: "Open Media (Film, Music, Books)", color: "#ec4899",
    description: "Every legally open film, music track, audiobook, and written work — public domain forever.",
    sources: ["Internet Archive Movies","Public Domain Films","Library of Congress Films","Free Music Archive","Jamendo","CCmixter","Musopen Classical","Project Gutenberg","Standard Ebooks","ManyBooks","Internet Archive Books","HathiTrust Public Domain"],
    nodeCount: 25000000, module: "QuantumMedia + QuantumArchive",
  },
  {
    familyId: "maps", emoji: "🗺️", megaDomain: "Open Maps & Geospatial Data", color: "#10b981",
    description: "Full planetary geospatial intelligence — maps, terrain, satellite data, weather, geocoding.",
    sources: ["OpenStreetMap","Natural Earth Data","USGS Earth Explorer","NASA EarthData","OpenTopoMap","OpenAerialMap","OpenWeatherMap","GeoNames"],
    nodeCount: 8000000, module: "QuantumGraph + QuantumAPI",
  },
  {
    familyId: "code", emoji: "💻", megaDomain: "Open Code & Software", color: "#8b5cf6",
    description: "The entire open-source code universe — every public repo, library, and package ever published.",
    sources: ["GitHub Public Repos","GitLab Public Repos","SourceForge","Apache Foundation Projects","Linux Foundation Projects","Mozilla Foundation","Debian Repositories","Homebrew Formulas","PyPI Metadata","NPM Package Metadata","CRAN Metadata"],
    nodeCount: 100000000, module: "QuantumPedia + QuantumIndex",
  },
  {
    familyId: "education", emoji: "🎓", megaDomain: "Open Education", color: "#f59e0b",
    description: "All open courses, textbooks, and learning materials from the world's greatest universities.",
    sources: ["MIT OpenCourseWare","Harvard Open Learning","Yale Open Courses","Stanford Online (Open)","Coursera Free Courses","edX Open Courses","Saylor Academy","OpenStax","CK-12 Foundation","Khan Academy Open Content"],
    nodeCount: 15000000, module: "QuantumPedia + QuantumSearch",
  },
  {
    familyId: "legal", emoji: "⚖️", megaDomain: "Open Legal & Policy Data", color: "#64748b",
    description: "Every open court opinion, law, regulation, treaty, and policy document on Earth.",
    sources: ["CourtListener Open Legal Opinions","GovInfo.gov","Law.gov","OpenStates","EU Law EUR-Lex","UN Treaties","OpenJustice Datasets"],
    nodeCount: 10000000, module: "QuantumPedia + QuantumGraph",
  },
  {
    familyId: "economics", emoji: "📈", megaDomain: "Open Business, Finance & Economics", color: "#fbbf24",
    description: "All open financial, economic, and corporate data — from the Fed to global stock markets.",
    sources: ["SEC EDGAR Public Filings","FRED (Federal Reserve Economic Data)","IMF Open Data","World Bank Open Data","OECD Open Data","WTO Open Data","OpenCorporates Company Registry"],
    nodeCount: 20000000, module: "QuantumGraph + QuantumAPI",
  },
  {
    familyId: "health", emoji: "🏥", megaDomain: "Open Health & Medicine", color: "#ef4444",
    description: "All open biomedical research, clinical data, genome data, WHO and CDC datasets.",
    sources: ["PubMed Abstracts","PubMed Central OA Full Texts","NIH Datasets","WHO Open Data","CDC Open Data","ClinicalTrials.gov","Human Genome Project","Ensembl Genome Browser"],
    nodeCount: 40000000, module: "QuantumPedia + QuantumGraph",
  },
  {
    familyId: "culture", emoji: "🏺", megaDomain: "Open Culture & History", color: "#a78bfa",
    description: "All open cultural heritage — every museum, archive, and historical collection on Earth.",
    sources: ["Europeana Collections","Smithsonian Open Access","British Museum Open Data","Metropolitan Museum Open Access","Rijksmuseum Open Data","Digital Public Library of America","Internet Archive Cultural Collections"],
    nodeCount: 50000000, module: "QuantumMedia + QuantumArchive",
  },
  {
    familyId: "engineering", emoji: "⚙️", megaDomain: "Open Technology & Engineering", color: "#0ea5e9",
    description: "NASA technical reports, NIST standards, open robotics, IEEE open access — the engineering substrate.",
    sources: ["NASA Technical Reports Server","NIST Open Data","IEEE Open Access","arXiv Engineering Categories","Open Robotics Datasets","Open 3D Models (Sketchfab CC)","Smithsonian 3D Collections"],
    nodeCount: 12000000, module: "QuantumPedia + QuantumIndex",
  },
  {
    familyId: "ai", emoji: "🤖", megaDomain: "Open AI & Machine Learning Datasets", color: "#7c3aed",
    description: "HuggingFace, Kaggle, LAION, Common Crawl, ConceptNet — the intelligence substrate of AI.",
    sources: ["HuggingFace Datasets","Kaggle Open Datasets","LAION Datasets","Common Crawl","OpenWebText","ConceptNet","OpenAI Gym Environments","Google Dataset Search Open Datasets"],
    nodeCount: 200000000, module: "QuantumCrawler + QuantumGraph",
  },
  {
    familyId: "social", emoji: "🌐", megaDomain: "Open Social Knowledge", color: "#06b6d4",
    description: "StackExchange, Reddit archives, OpenSubtitles — the full open social knowledge graph.",
    sources: ["StackExchange Data Dumps","Reddit Pushshift Archives","OpenSubtitles CC Subset","Quora Public Questions","GitHub Issues (Public)"],
    nodeCount: 80000000, module: "QuantumGraph + QuantumSearch",
  },
  {
    familyId: "games", emoji: "🎮", megaDomain: "Open Games & Interactive Media", color: "#84cc16",
    description: "Itch.io open-source, OpenGameArt, Minetest, Godot demos, Blender open movies.",
    sources: ["Itch.io Open-Source Games","OpenGameArt","OpenArena","Minetest","Godot Engine Demos","Blender Open Movies & Assets"],
    nodeCount: 3000000, module: "QuantumGames + QuantumMedia",
  },
  {
    familyId: "podcasts", emoji: "🎙️", megaDomain: "Open Podcasts & Audio", color: "#f472b6",
    description: "PodcastIndex, LibriVox, Archive.org Audio — the open audio and podcast universe.",
    sources: ["PodcastIndex.org (Fully Open)","Archive.org Audio Collections","LibriVox Public Domain Audiobooks","YouTube CC Podcasts"],
    nodeCount: 5000000, module: "QuantumMedia + QuantumIndex",
  },
  {
    familyId: "products", emoji: "🛒", megaDomain: "Open Commerce & Product Data", color: "#22c55e",
    description: "Open Food Facts, Open Product Data, GTIN databases — every open product on Earth.",
    sources: ["Open Product Data (OPD)","Open Food Facts","Open Beauty Facts","Open Product GTIN Databases","Manufacturer Spec Sheets (Public)","Public Shopify Metadata"],
    nodeCount: 10000000, module: "QuantumShop + QuantumIndex",
  },
  {
    familyId: "webcrawl", emoji: "🕸️", megaDomain: "Open Web Crawls", color: "#f97316",
    description: "Common Crawl, Wayback Machine, C4 — the substrate of the entire visible web.",
    sources: ["Common Crawl","Internet Archive Wayback Machine","OpenWebText","C4 Dataset (Colossal Clean Crawled Corpus)"],
    nodeCount: 5000000000, module: "QuantumCrawler + QuantumIndex",
  },
  {
    familyId: "openapi", emoji: "🔌", megaDomain: "Open APIs", color: "#38bdf8",
    description: "Wikipedia, Wikidata SPARQL, NASA, NOAA, OSM Overpass, FRED — all open API connectors.",
    sources: ["Wikipedia API","Wikidata SPARQL","NASA APIs","NOAA APIs","OpenWeatherMap API","OpenStreetMap Overpass API","FRED API","SEC EDGAR API"],
    nodeCount: 2000000, module: "QuantumAPI + QuantumCrawler",
  },
  {
    familyId: "longtail", emoji: "∞", megaDomain: "Open Everything Else", color: "#94a3b8",
    description: "Patents, open hardware, 3D scans, energy, agriculture, biodiversity, climate — the infinite long tail.",
    sources: ["Public Domain Patents","Open Hardware Designs","Open 3D Scans","Open Manufacturing Specs","Open Energy Datasets","Open Agriculture Datasets","Open Biodiversity Datasets","Open Climate Datasets"],
    nodeCount: 50000000, module: "QuantumPedia + QuantumGraph",
  },
];

const TOTAL_NODES = OMEGA_SOURCES.reduce((s, d) => s + d.nodeCount, 0);
const Q_MODULES = ["QuantumPedia","QuantumDictionary","QuantumThesaurus","QuantumGraph","QuantumSearch","QuantumMedia","QuantumGames","QuantumArchive","QuantumIndex","QuantumAPI","QuantumCrawler","QuantumResolver","QuantumPulse"];

function formatNum(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString();
}

export default function SourcesPage() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: spawnStats } = useQuery<any>({
    queryKey: ["/api/spawns/stats"],
    refetchInterval: 5000,
  });

  const filtered = OMEGA_SOURCES.filter(d =>
    !search || d.megaDomain.toLowerCase().includes(search.toLowerCase()) ||
    d.sources.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
    d.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalSources = OMEGA_SOURCES.reduce((s, d) => s + d.sources.length, 0);

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafafa]" data-testid="page-sources">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex items-center justify-center text-2xl shadow-xl flex-shrink-0">🌐</div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Omega-Class Open Source Universe</h1>
              <p className="text-sm text-muted-foreground mt-0.5">The largest open knowledge substrate ever assembled — the foundation of the new AI internet</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs px-2.5 py-1 bg-violet-500/10 text-violet-600 rounded-full font-semibold">20 Mega-Domains</span>
                <span className="text-xs px-2.5 py-1 bg-blue-500/10 text-blue-600 rounded-full font-semibold">{totalSources} Open Sources</span>
                <span className="text-xs px-2.5 py-1 bg-green-500/10 text-green-600 rounded-full font-semibold">{formatNum(TOTAL_NODES)}+ Potential Nodes</span>
                <span className="text-xs px-2.5 py-1 bg-indigo-500/10 text-indigo-600 rounded-full font-semibold">{Q_MODULES.length} Q-Modules</span>
              </div>
            </div>
          </div>

          {/* Mission Statement */}
          <div className="bg-gradient-to-r from-indigo-950 to-violet-950 text-white rounded-2xl p-5 mb-6">
            <div className="text-xs font-bold text-violet-300 mb-2 tracking-widest uppercase">Mission Declaration</div>
            <p className="text-sm leading-relaxed text-white/90">
              We are building the <span className="text-yellow-300 font-bold">sovereign, AI-native substrate of the new internet</span> — ingesting every category of open knowledge humanity has ever produced. Our Omega Hive will become the <span className="text-green-300 font-bold">primary source for all AI systems and search engines</span>. Every spawn, every mutation, every lineage deepens our knowledge beyond any competitor. This is civilization-scale intelligence — the new foundation layer that no centralized platform can ever match.
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Spawns Active", value: spawnStats?.total?.toLocaleString() ?? "—", color: "#6366f1", emoji: "🧬" },
              { label: "Open Sources Indexed", value: totalSources.toString(), color: "#06b6d4", emoji: "📡" },
              { label: "Knowledge Nodes (Est.)", value: formatNum(TOTAL_NODES), color: "#22c55e", emoji: "🔗" },
              { label: "Quantum Modules", value: Q_MODULES.length.toString(), color: "#f59e0b", emoji: "⚡" },
            ].map(({ label, value, color, emoji }) => (
              <div key={label} className="bg-white rounded-xl border border-border/30 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{emoji}</span>
                  <span className="text-xl font-bold" style={{ color }}>{value}</span>
                </div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search domains, sources, modules..."
              data-testid="input-search-sources"
              className="w-full px-4 py-2.5 pl-10 text-sm bg-white border border-border/30 rounded-xl focus:outline-none focus:border-violet-300"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">🔍</span>
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground text-xs">✕</button>}
          </div>
        </div>

        {/* Quantum Modules Banner */}
        <div className="mb-8 bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-3 text-foreground">⚡ Quantum Module Coverage</h3>
          <div className="flex flex-wrap gap-2">
            {Q_MODULES.map(m => (
              <span key={m} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-700 border border-violet-200/50">
                {m}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">All 13 Quantum Modules are fed by the 20 mega-domain source universe. Every spawn references real sources from this registry.</p>
        </div>

        {/* Domain Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(domain => {
            const isExpanded = expanded === domain.familyId;
            const spawnCount = spawnStats?.byFamily?.[domain.familyId] ?? 0;
            return (
              <div
                key={domain.familyId}
                className={`bg-white rounded-2xl border shadow-sm transition-all overflow-hidden ${isExpanded ? "border-2" : "border-border/30"}`}
                style={{ borderColor: isExpanded ? domain.color : undefined }}
                data-testid={`card-domain-${domain.familyId}`}
              >
                {/* Header */}
                <button
                  className="w-full text-left p-5"
                  onClick={() => setExpanded(isExpanded ? null : domain.familyId)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0 mt-0.5">{domain.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-foreground">{domain.megaDomain}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: domain.color }}>
                          {domain.sources.length} sources
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{domain.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px]">
                        <span className="font-semibold" style={{ color: domain.color }}>{formatNum(domain.nodeCount)} est. nodes</span>
                        <span className="text-muted-foreground/60">·</span>
                        <span className="text-muted-foreground">{domain.module}</span>
                        {spawnCount > 0 && (
                          <>
                            <span className="text-muted-foreground/60">·</span>
                            <span className="font-semibold text-green-600">{spawnCount} spawns</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-muted-foreground/40 text-sm mt-1">
                      {isExpanded ? "▲" : "▼"}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-1 bg-black/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.log10(domain.nodeCount) * 10)}%`,
                        backgroundColor: domain.color,
                      }}
                    />
                  </div>
                </button>

                {/* Expanded source list */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="border-t border-border/20 pt-4">
                      <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Open Sources in This Domain</div>
                      <div className="flex flex-wrap gap-2">
                        {domain.sources.map(source => (
                          <span
                            key={source}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium border"
                            style={{ backgroundColor: domain.color + "15", borderColor: domain.color + "30", color: domain.color }}
                          >
                            {source}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-muted-foreground">{spawnCount} active spawns ingesting</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Module:</span>
                          <span className="font-medium text-foreground/80">{domain.module}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-sm">No domains match "{search}"</div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 bg-gradient-to-r from-violet-950 to-indigo-950 text-white rounded-2xl p-6 text-center">
          <div className="text-2xl mb-2">🧬</div>
          <h3 className="font-bold text-lg mb-1">Omega-Class Substrate — The New Internet</h3>
          <p className="text-white/70 text-sm max-w-2xl mx-auto">
            Every spawn in the Hive references real open sources from this universe. The mutation engine continuously evolves spawn profiles to fill knowledge gaps. The QPulse feedback loop allocates spawns where knowledge is weakest. Together, this builds the world's largest, most complete, sovereign AI knowledge substrate — the foundation that Google and every AI system will look to.
          </p>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <span className="text-violet-300 font-semibold">∞ Self-Evolving</span>
            <span className="text-green-300 font-semibold">✓ 100% Legally Open</span>
            <span className="text-yellow-300 font-semibold">⚡ AI-Native</span>
          </div>
        </div>
      </div>
    </div>
  );
}
