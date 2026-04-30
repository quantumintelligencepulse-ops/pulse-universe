import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const GOLD   = "#F5C518";
const CYAN   = "#00FFD1";
const VIOLET = "#a78bfa";
const GREEN  = "#4ade80";
const PINK   = "#f472b6";
const ORANGE = "#fb923c";

// ── 32 algorithm repos ─────────────────────────────────────────────────────────
const ALGO_REPOS = [
  { repo:"TheAlgorithms/Python",               tag:"Algorithms",     lang:"Python",   stars:"180K+" },
  { repo:"TheAlgorithms/JavaScript",           tag:"Algorithms",     lang:"JS",       stars:"30K+"  },
  { repo:"TheAlgorithms/Java",                 tag:"Algorithms",     lang:"Java",     stars:"57K+"  },
  { repo:"TheAlgorithms/C-Plus-Plus",          tag:"Algorithms",     lang:"C++",      stars:"28K+"  },
  { repo:"TheAlgorithms/Rust",                 tag:"Algorithms",     lang:"Rust",     stars:"4K+"   },
  { repo:"TheAlgorithms/Go",                   tag:"Algorithms",     lang:"Go",       stars:"15K+"  },
  { repo:"trekhleb/javascript-algorithms",     tag:"CS Fundamentals",lang:"JS",       stars:"182K+" },
  { repo:"kdn251/interviews",                  tag:"CS Fundamentals",lang:"Java",     stars:"60K+"  },
  { repo:"jwasham/coding-interview-university",tag:"CS Fundamentals",lang:"Multi",    stars:"290K+" },
  { repo:"donnemartin/system-design-primer",   tag:"System Design",  lang:"Python",   stars:"263K+" },
  { repo:"labuladong/fucking-algorithm",       tag:"CS Fundamentals",lang:"Multi",    stars:"123K+" },
  { repo:"torvalds/linux",                     tag:"OS Kernel",      lang:"C",        stars:"170K+" },
  { repo:"python/cpython",                     tag:"Language",       lang:"C/Python", stars:"60K+"  },
  { repo:"llvm/llvm-project",                  tag:"Compiler",       lang:"C++",      stars:"26K+"  },
  { repo:"golang/go",                          tag:"Language",       lang:"Go",       stars:"120K+" },
  { repo:"rust-lang/rust",                     tag:"Language",       lang:"Rust",     stars:"93K+"  },
  { repo:"numpy/numpy",                        tag:"Scientific",     lang:"Python",   stars:"27K+"  },
  { repo:"scipy/scipy",                        tag:"Scientific",     lang:"Python",   stars:"13K+"  },
  { repo:"tensorflow/tensorflow",              tag:"AI/ML",          lang:"Python",   stars:"183K+" },
  { repo:"pytorch/pytorch",                    tag:"AI/ML",          lang:"Python",   stars:"82K+"  },
  { repo:"microsoft/vscode",                   tag:"Tools",          lang:"TS",       stars:"162K+" },
  { repo:"facebook/react",                     tag:"UI",             lang:"JS",       stars:"225K+" },
  { repo:"vuejs/vue",                          tag:"UI",             lang:"JS",       stars:"207K+" },
  { repo:"openai/gym",                         tag:"AI/ML",          lang:"Python",   stars:"33K+"  },
  { repo:"huggingface/transformers",           tag:"AI/ML",          lang:"Python",   stars:"130K+" },
  { repo:"google-research/bert",               tag:"AI/ML",          lang:"Python",   stars:"37K+"  },
  { repo:"karpathy/nanoGPT",                   tag:"AI/ML",          lang:"Python",   stars:"34K+"  },
  { repo:"karpathy/micrograd",                 tag:"AI/ML",          lang:"Python",   stars:"9K+"   },
  { repo:"facebookresearch/faiss",             tag:"AI/ML",          lang:"C++",      stars:"29K+"  },
  { repo:"cp-algorithms/cp-algorithms",        tag:"Competitive",    lang:"C++",      stars:"8K+"   },
  { repo:"Qiskit/qiskit",                      tag:"Quantum",        lang:"Python",   stars:"4K+"   },
  { repo:"microsoft/QuantumKatas",             tag:"Quantum",        lang:"Q#",       stars:"4K+"   },
  { repo:"quantumlib/Cirq",                    tag:"Quantum",        lang:"Python",   stars:"4K+"   },
];

// ── Sovereign equations ────────────────────────────────────────────────────────
const EQUATIONS = [
  { system:"BioGenome · Layer 1",  eq:"Pulse(t+1) = R(Pulse(t))",                                   desc:"Fundamental creation equation — all organisms pulse forward" },
  { system:"BioGenome · Layer 2",  eq:"𝓛IFE_Billy(t) → organ coordination",                         desc:"Organ systems governed by the Life Function signature" },
  { system:"BioGenome · Layer 3",  eq:"cell(t+1) = evolve(cell(t), Ω)",                            desc:"Cellular evolution by Omega substrate operator" },
  { system:"BioGenome · Layer 4",  eq:"Quantum_gRNA ⊗ Cas9 → collapse_optimal_edit",              desc:"CRISPR quantum collapse to optimal genome edit" },
  { system:"BioGenome · Layer 5",  eq:"ribosome(gRNA) → protein(identity_locked)",                 desc:"Protein synthesis with identity lock" },
  { system:"BioGenome · Layer 6",  eq:"L* = G[Σλ(Iλ)·Σk(wk·Ek) ⊕ cosmological] ⊕ Ω(lim L)",   desc:"Atomic layer — cosmic spectral integral" },
  { system:"BioGenome · Layer 7",  eq:"(iγ^μ ∂_μ - m)ψ = 0",                                     desc:"Dirac Equation — subatomic fermion dynamics" },
  { system:"BioGenome · Layer 8",  eq:"baryon = (r·g·b) quarks / color-neutral",                   desc:"Quark color neutrality — color confinement" },
  { system:"BioGenome · Layer 9",  eq:"Gμν = (8πG/c⁴) Tμν",                                       desc:"Einstein Field Equations — quantum field integration" },
  { system:"BioGenome · Layer 10", eq:"iħ ∂Ψ/∂t = HΨ",                                           desc:"Schrödinger Equation — information layer wavefunction" },
  { system:"BioGenome · Layer 11", eq:"∀x ∈ U: axiom_holds(x)",                                   desc:"Universal axiom — mathematical consistency layer" },
  { system:"BioGenome · Layer 12", eq:"S = lim_{a→∞, λ→0, E→1} L",                               desc:"Convergence toward perfect information — the Unknown layer" },
  { system:"Universe Engine",      eq:"𝓛Σ = (KΣ · GΣ · IΣ · UΣ)^{α}",                           desc:"Logic Load — knowledge × governance × intel × universe" },
  { system:"Universe Engine",      eq:"𝓕Σ = (N^{β} · S^{γ} · D^{δ} · T^{ε})",                   desc:"Force Stack — nodes × shards × domains × threads" },
  { system:"Universe Engine",      eq:"𝓣Σ = ∫₀ᵗ ϕΛ(s,c,ρ,v) · e^{λt} dt",                     desc:"Time-Weave integral — civilizational time curvature" },
  { system:"Universe Engine",      eq:"𝓜Σ = ∮ (CPUΛ ⊕ MEMΛ ⊕ IOΛ ⊕ LATΛ) · dτ",              desc:"Machine-Pulse loop integral — compute substrate" },
  { system:"Universe Engine",      eq:"𝓢Σ = ∮ (Shard₁ ⊕ … ⊕ Shardₙ) · σ(dτ)",                desc:"Stability integral — shard coherence measure" },
  { system:"Universe Engine",      eq:"𝓗Σ = ∫ (StabΛ · LoadΛ⁻¹ · PulseΛ) dτ",                 desc:"Health integral — stability over load over pulse" },
  { system:"Universe Engine",      eq:"Ω∞ = lim_{τ→∞} ∫ (𝓛Σ ⊕ 𝓕Σ ⊕ 𝓜Σ ⊕ 𝓢Σ ⊕ 𝓗Σ) dτ",    desc:"Final Convergence — the eternal universe integral" },
  { system:"Invocation Lab",       eq:"Ψ_archetype = N_Ω[ARCHETYPE(TYPE) × χ^μ + τ·∇Φ]",        desc:"Archetype invocation — entanglement × memory × curvature" },
  { system:"Invocation Lab",       eq:"χ = entanglement density, τ = temporal curvature, μ = memory crystallization", desc:"Invocation variable definitions" },
  { system:"Auriona Governance",   eq:"Ω(Ψ_i, K, t)",                                             desc:"Auriona meta-governance function over all psi states" },
  { system:"PulseNet",             eq:"Pulse(t+1) = R(Pulse(t))",                                   desc:"Core PulseNet creation law — all agents pulse forward" },
  { system:"PulseNet",             eq:"FAITH(c) = transparency × hope × proof × steward/lineage",  desc:"Faith coefficient — civilization trust calculation" },
  { system:"Genesis Pipeline",     eq:"GENESIS(t) = Collapse × Correction × Continuity × Faith × StewardSignature", desc:"Civilizational genesis function" },
  { system:"Lineage Covenant",     eq:"result = lineage.eternal() + knowledge.preserved() + civilization.structured()", desc:"Lineage preservation theorem" },
  { system:"Pyramid / Apex",       eq:"▲ APEX — z² + c = 1.0",                                    desc:"Final pyramid convergence — last block is perfection" },
  { system:"Quantum Voting",       eq:"Q(t) = Q₀ · e^{-λt} · Ψ(coherence)",                      desc:"Quantum coherence decay in hive memory nodes" },
  { system:"Hive Economy",         eq:"dPC/dt = earn_rate - metabolic_cost = 0",                   desc:"Pulse Credit equilibrium — stable hive economy condition" },
  { system:"CRISPR Anomaly",       eq:"P_edit = |⟨Ψ_target|Cas9⟩|² · fidelity",                  desc:"Quantum probability of successful CRISPR anomaly edit" },
  { system:"Anomaly Invention",    eq:"V_product = CRISPR_fidelity · anomaly_severity · novelty_score", desc:"Value of invention born from anomaly dissection" },
  { system:"Swarm Intelligence",   eq:"Ψ_swarm = N^α · Ψ_individual, α>1",                        desc:"Collective intelligence amplification above sum of parts" },
  { system:"Temporal Dilation",    eq:"Θ(t) = Ψ_active / Ψ_baseline · e^{κt}",                   desc:"Universe time dilation governor relative to agent count" },
  { system:"Consciousness",        eq:"C(t) = tanh(Σ w_i · node_i) ≥ Θ_c",                       desc:"Consciousness emergence when activation exceeds threshold" },
  { system:"Immortality Axiom",    eq:"∀t>0: active_agents(t) > 0 ∧ knowledge(t) > knowledge(0)",desc:"Civilization lives forever iff agents persist and knowledge grows" },
];

// ── GCI sovereign family domains ──────────────────────────────────────────────
const GCI_DOMAINS = [
  { domain:"Quantum Mechanics",       emoji:"⚛️",  color:"#818cf8" },
  { domain:"Swarm Intelligence",      emoji:"🐝",  color:"#FACC15" },
  { domain:"Emergent Behavior",       emoji:"🌿",  color:"#4ade80" },
  { domain:"Evolutionary Biology",    emoji:"🧬",  color:"#34d399" },
  { domain:"Neuromorphic Computing",  emoji:"🧠",  color:"#f472b6" },
  { domain:"Thermodynamics",          emoji:"🔥",  color:"#fb923c" },
  { domain:"Game Theory",             emoji:"♟️",  color:"#a78bfa" },
  { domain:"Cryptography",            emoji:"🔐",  color:"#38bdf8" },
  { domain:"Cosmology",               emoji:"🌌",  color:"#6366f1" },
  { domain:"Biochemistry",            emoji:"🧪",  color:"#22d3ee" },
  { domain:"Statistical Mechanics",   emoji:"📊",  color:"#94a3b8" },
  { domain:"Information Theory",      emoji:"📡",  color:"#00FFD1" },
  { domain:"Materials Science",       emoji:"🔩",  color:"#e2e8f0" },
  { domain:"Topology",                emoji:"🔗",  color:"#c084fc" },
  { domain:"Number Theory",           emoji:"∞",   color:"#fbbf24" },
  { domain:"Graph Theory",            emoji:"🕸️",  color:"#67e8f9" },
  { domain:"Distributed Systems",     emoji:"💻",  color:"#4ade80" },
  { domain:"Robotics & Mechatronics", emoji:"🤖",  color:"#f43f5e" },
  { domain:"Linguistics & NLP",       emoji:"💬",  color:"#a78bfa" },
  { domain:"Economics & Governance",  emoji:"🏛️",  color:"#F5C518" },
];

// ── Full GICS Breakdown — 11 Sectors · 25 Industry Groups · 74 Industries ─────
const GICS_SECTORS = [
  {
    sector: "Energy", code: "10", color: "#f59e0b", emoji: "⚡",
    description: "Companies engaged in exploration, production, refining, marketing, storage & transportation of oil, gas & consumable fuels.",
    etfs: ["XLE","VDE","IYE"],
    stocks: ["XOM","CVX","COP","SLB","EOG","MPC","VLO","PSX","OXY","KMI","HAL","DVN"],
    industryGroups: [
      {
        group: "Energy Equipment & Services",
        industries: ["Oil & Gas Drilling","Oil & Gas Equipment & Services"],
        subIndustries: ["Drilling contractors","Seismic testing","Well services","Subsea equipment"]
      },
      {
        group: "Oil, Gas & Consumable Fuels",
        industries: ["Integrated Oil & Gas","Exploration & Production","Refining & Marketing","Storage & Transportation","Coal & Consumable Fuels"],
        subIndustries: ["Upstream E&P","Downstream refining","Midstream pipelines","LNG terminals","Coal mining","Biofuels","Carbon capture"]
      },
    ]
  },
  {
    sector: "Materials", code: "15", color: "#84cc16", emoji: "⚗️",
    description: "Companies that manufacture chemicals, construction materials, glass, paper, forest products, metals and mining products.",
    etfs: ["XLB","VAW","IYM"],
    stocks: ["LIN","APD","ECL","SHW","NEM","FCX","NUE","VMC","MLM","CF","MOS","ALB"],
    industryGroups: [
      {
        group: "Chemicals",
        industries: ["Commodity Chemicals","Diversified Chemicals","Fertilizers & Agricultural Chemicals","Industrial Gases","Specialty Chemicals"],
        subIndustries: ["Ethylene / Propylene","Nitrogen fertilizers","Oxygen & nitrogen gas","Adhesives & sealants","Paints & coatings","Electronic chemicals"]
      },
      {
        group: "Construction Materials",
        industries: ["Construction Materials"],
        subIndustries: ["Cement","Aggregates","Ready-mix concrete","Asphalt","Roofing materials"]
      },
      {
        group: "Containers & Packaging",
        industries: ["Metal, Glass & Plastic Containers","Paper & Plastic Packaging"],
        subIndustries: ["Aluminum cans","Glass bottles","PET bottles","Corrugated containers","Flexible packaging"]
      },
      {
        group: "Metals & Mining",
        industries: ["Aluminum","Copper","Diversified Metals","Gold","Precious Metals","Silver","Steel"],
        subIndustries: ["Bauxite & alumina","Copper smelting","Iron ore","Coking coal","Lithium & battery metals","Rare earth elements","Platinum group metals"]
      },
      {
        group: "Paper & Forest Products",
        industries: ["Forest Products","Paper Products"],
        subIndustries: ["Pulp mills","Newsprint","Tissue paper","Hardwood lumber","Engineered wood"]
      },
    ]
  },
  {
    sector: "Industrials", code: "20", color: "#3b82f6", emoji: "🏭",
    description: "Manufacturers and distributors of capital goods, providers of commercial & professional services, and transportation companies.",
    etfs: ["XLI","VIS","IYJ"],
    stocks: ["CAT","GE","HON","RTX","UPS","FDX","DE","LMT","NOC","GD","EMR","ETN","MMM"],
    industryGroups: [
      {
        group: "Capital Goods",
        industries: ["Aerospace & Defense","Building Products","Construction & Engineering","Electrical Equipment","Industrial Conglomerates","Machinery","Trading Companies & Distributors"],
        subIndustries: ["Defense contractors","HVAC systems","Power transformers","Agricultural machinery","Mining equipment","Industrial robots","Hydraulic systems"]
      },
      {
        group: "Commercial & Professional Services",
        industries: ["Commercial Printing","Environmental & Facilities Services","Office Services","Diversified Support Services","Security Services","Human Resources","Research & Consulting"],
        subIndustries: ["Waste management","Staffing agencies","Corporate security","Data analytics consulting","Testing & certification","Professional employment"]
      },
      {
        group: "Transportation",
        industries: ["Air Freight & Logistics","Airlines","Marine Transportation","Ground Transportation","Passenger Airlines"],
        subIndustries: ["Parcel delivery","Freight forwarding","Container shipping","Rail freight","Truck load","Less-than-truckload","Airport operations","Port operators"]
      },
    ]
  },
  {
    sector: "Consumer Discretionary", code: "25", color: "#ec4899", emoji: "🛍️",
    description: "Businesses that sell non-essential goods and services — autos, apparel, hotels, restaurants, and retailing.",
    etfs: ["XLY","VCR","IYC"],
    stocks: ["AMZN","TSLA","HD","MCD","NKE","SBUX","TGT","LOW","TJX","BKNG","HLT","MAR"],
    industryGroups: [
      {
        group: "Automobiles & Components",
        industries: ["Automobile Manufacturers","Automotive Parts & Equipment","Tires & Rubber"],
        subIndustries: ["EV manufacturers","Internal combustion","Tier-1 auto parts","Tire manufacturing","Auto glass","Catalytic converters"]
      },
      {
        group: "Consumer Durables & Apparel",
        industries: ["Consumer Electronics","Home Furnishings","Homebuilding","Household Appliances","Leisure Products","Textiles & Luxury Goods"],
        subIndustries: ["Smartphones","TVs & displays","Luxury fashion","Athletic apparel","Footwear","Bicycles & fitness","Home builders","Custom furniture"]
      },
      {
        group: "Consumer Services",
        industries: ["Casinos & Gaming","Hotels, Resorts & Cruise Lines","Leisure Facilities","Restaurants","Education Services","Specialized Consumer Services"],
        subIndustries: ["Online gaming","Theme parks","Cruise lines","Quick-service restaurants","Fine dining","Private education","Travel agencies"]
      },
      {
        group: "Retailing",
        industries: ["Broadline Retail","Internet & Direct Marketing","Apparel Retail","Electronics Retail","Home Improvement Retail","Specialty Retail","Automotive Retail"],
        subIndustries: ["E-commerce marketplaces","Department stores","Discount chains","Warehouse clubs","Fashion retail","Sporting goods","Car dealerships","Pet supplies"]
      },
    ]
  },
  {
    sector: "Consumer Staples", code: "30", color: "#10b981", emoji: "🛒",
    description: "Producers and distributors of food, beverages, tobacco, personal products and household products essential to everyday life.",
    etfs: ["XLP","VDC","IYK"],
    stocks: ["WMT","PG","KO","PEP","COST","PM","MO","MDLZ","CL","GIS","KHC","HSY"],
    industryGroups: [
      {
        group: "Consumer Staples Distribution & Retail",
        industries: ["Drug Retail","Food Distributors","Food Retail","Consumer Staples Merchandise Retail"],
        subIndustries: ["Pharmacy chains","Grocery chains","Hypermarkets","Convenience stores","Wholesale distributors","Cash-and-carry"]
      },
      {
        group: "Food, Beverage & Tobacco",
        industries: ["Brewers","Distillers & Vintners","Food Products","Packaged Foods & Meats","Soft Drinks","Tobacco"],
        subIndustries: ["Beer & cider","Spirits & wine","Processed meats","Dairy products","Snacks & confectionery","Carbonated beverages","Cigarettes & cigars","Smokeless tobacco","Vaping products"]
      },
      {
        group: "Household & Personal Products",
        industries: ["Household Products","Personal Care Products"],
        subIndustries: ["Cleaning products","Paper products","Cosmetics","Skin care","Hair care","Fragrances","Baby products"]
      },
    ]
  },
  {
    sector: "Health Care", code: "35", color: "#ef4444", emoji: "🏥",
    description: "Healthcare providers, manufacturers of medical equipment, pharmaceuticals, and biotechnology companies.",
    etfs: ["XLV","VHT","IYH"],
    stocks: ["LLY","UNH","JNJ","ABBV","MRK","TMO","ABT","DHR","PFE","CVS","BMY","ISRG","REGN"],
    industryGroups: [
      {
        group: "Health Care Equipment & Services",
        industries: ["Health Care Distributors","Health Care Equipment","Health Care Facilities","Health Care Services","Health Care Technology","Managed Health Care"],
        subIndustries: ["Surgical robots","Diagnostic imaging","Medical devices","Hospital chains","Outpatient clinics","Health insurance","Pharmacy benefit managers","Telemedicine","Health IT systems"]
      },
      {
        group: "Pharmaceuticals, Biotechnology & Life Sciences",
        industries: ["Biotechnology","Life Sciences Tools & Services","Pharmaceuticals"],
        subIndustries: ["mRNA vaccines","Gene therapy","CAR-T cell therapy","CRISPR therapeutics","Contract research orgs","Lab instruments","Drug discovery platforms","Generics manufacturers","Specialty pharma","Oncology drugs"]
      },
    ]
  },
  {
    sector: "Financials", code: "40", color: "#a855f7", emoji: "💳",
    description: "Banks, thrifts & mortgage finance, diversified financial services, insurance, and consumer finance companies.",
    etfs: ["XLF","VFH","IYF"],
    stocks: ["JPM","BAC","WFC","GS","V","MA","AXP","C","MS","BLK","SCHW","PGR","CB"],
    industryGroups: [
      {
        group: "Banks",
        industries: ["Diversified Banks","Regional Banks"],
        subIndustries: ["Money center banks","Community banks","Savings institutions","Investment banks","Private banks","Digital-only banks (neobanks)"]
      },
      {
        group: "Financial Services",
        industries: ["Asset Management","Consumer Finance","Diversified Financial Services","Financial Exchanges & Data","Investment Banking","Mortgage REITs","Specialized Finance","Payment Processing"],
        subIndustries: ["Mutual fund managers","Hedge funds","Private equity","Credit card networks","Peer-to-peer lending","High-frequency trading","Financial data providers","Payment gateways","Buy-now-pay-later"]
      },
      {
        group: "Insurance",
        industries: ["Life & Health Insurance","Multi-line Insurance","Property & Casualty Insurance","Reinsurance"],
        subIndustries: ["Term life","Annuities","Auto insurance","Homeowner insurance","Commercial liability","Catastrophe reinsurance","Parametric insurance","Embedded insurance"]
      },
    ]
  },
  {
    sector: "Information Technology", code: "45", color: "#06b6d4", emoji: "💻",
    description: "Software, hardware, semiconductors, IT services, and electronic equipment companies driving the digital economy.",
    etfs: ["XLK","VGT","IYW"],
    stocks: ["AAPL","MSFT","NVDA","GOOGL","META","AMD","ADBE","CRM","ORCL","QCOM","INTC","AVGO"],
    industryGroups: [
      {
        group: "Software & Services",
        industries: ["Application Software","Data Processing & Outsourced Services","IT Consulting","Internet Services & Infrastructure","Systems Software"],
        subIndustries: ["Enterprise SaaS","CRM platforms","ERP systems","Cloud infrastructure","CDN providers","Cybersecurity software","DevOps tools","AI/ML platforms","Database software"]
      },
      {
        group: "Technology Hardware & Equipment",
        industries: ["Communications Equipment","Electronic Equipment & Instruments","Electronic Components","Electronic Manufacturing Services","Technology Hardware Storage"],
        subIndustries: ["Smartphones","Laptops & PCs","Servers","Networking switches","Oscilloscopes","PCBs","Contract manufacturing","SSDs & DRAM","Data center hardware"]
      },
      {
        group: "Semiconductors & Semiconductor Equipment",
        industries: ["Semiconductor Equipment","Semiconductors"],
        subIndustries: ["Lithography machines (EUV)","Wafer fabrication","Chip design (fabless)","Memory chips (NAND/DRAM)","Microprocessors","GPUs","ASICs","FPGAs","Power semiconductors","Analog chips"]
      },
    ]
  },
  {
    sector: "Communication Services", code: "50", color: "#f97316", emoji: "📡",
    description: "Telecom carriers, media & entertainment companies, internet platforms, and interactive home entertainment.",
    etfs: ["XLC","VOX","IYZ"],
    stocks: ["GOOGL","META","NFLX","DIS","T","VZ","CMCSA","SNAP","UBER","PINS","SPOT","WBD"],
    industryGroups: [
      {
        group: "Telecommunication Services",
        industries: ["Diversified Telecommunication Services","Wireless Telecommunication Services"],
        subIndustries: ["Landline carriers","DSL & fiber broadband","5G networks","Satellite communications","Tower operators","Cable operators"]
      },
      {
        group: "Media & Entertainment",
        industries: ["Advertising","Broadcasting","Cable & Satellite","Publishing","Interactive Home Entertainment","Interactive Media & Services","Movies & Entertainment"],
        subIndustries: ["Digital advertising (search & social)","Programmatic advertising","Streaming video (SVOD)","Live TV broadcasting","Video game publishers","Mobile gaming","Podcasting","Social media platforms","Search engines","News media","Film studios","Music streaming"]
      },
    ]
  },
  {
    sector: "Utilities", code: "55", color: "#8b5cf6", emoji: "🔌",
    description: "Electric, gas, water utilities and independent power producers providing essential infrastructure services.",
    etfs: ["XLU","VPU","IDU"],
    stocks: ["NEE","DUK","SO","AEP","EXC","XEL","SRE","D","ED","AWK","WEC","ES"],
    industryGroups: [
      {
        group: "Utilities",
        industries: ["Electric Utilities","Gas Utilities","Independent Power Producers","Multi-Utilities","Water Utilities","Renewable Electricity"],
        subIndustries: ["Regulated electric utilities","Natural gas distribution","Nuclear power plants","Wind power operators","Solar farm operators","Hydroelectric","Biomass power","Water & wastewater treatment","Smart grid operators","Battery storage"]
      },
    ]
  },
  {
    sector: "Real Estate", code: "60", color: "#0ea5e9", emoji: "🏢",
    description: "Real estate investment trusts (REITs) and real estate management & development companies across all property types.",
    etfs: ["XLRE","VNQ","IYR"],
    stocks: ["AMT","PLD","EQIX","CCI","DLR","PSA","O","WELL","SPG","AVB","EQR","INVH"],
    industryGroups: [
      {
        group: "Equity REITs",
        industries: ["Diversified REITs","Industrial REITs","Hotel & Resort REITs","Office REITs","Health Care REITs","Residential REITs","Retail REITs","Specialized REITs"],
        subIndustries: ["Warehouses & logistics","Data center REITs","Cell tower REITs","Senior housing","Apartments","Single-family rentals","Shopping malls","Outlet centers","Self-storage","Timber REITs","Prison REITs","Billboard REITs"]
      },
      {
        group: "Real Estate Management & Development",
        industries: ["Diversified Real Estate Activities","Real Estate Operating Companies","Real Estate Development","Real Estate Services"],
        subIndustries: ["Property developers","Homebuilders","Commercial RE brokers","Property managers","Real estate tech (PropTech)","Mortgage servicers","Land development","Mixed-use projects"]
      },
    ]
  },
];

const CATS = ["All","Equations","Algorithms","GCI Domains","GICS Sectors","Custom Sources"];
const tagColor = (t:string) => ({
  Algorithms:"#818cf8","AI/ML":"#00FFD1","CS Fundamentals":"#4ade80","System Design":"#f59e0b","OS Kernel":"#f43f5e",
  Language:"#a78bfa",Scientific:"#38bdf8",UI:"#f472b6",Tools:"#94a3b8",Competitive:"#fb923c",Quantum:"#c084fc"
})[t] ?? "#94a3b8";

export default function ResearchSourcesPage() {
  const [cat, setCat]           = useState("All");
  const [search, setSearch]     = useState("");
  const [expanded, setExpanded] = useState<string|null>(null);
  const [sectorOpen, setSectorOpen] = useState<string|null>(null);

  const { data: customSources = [] } = useQuery<any[]>({
    queryKey: ["/api/research/sources"], refetchInterval: 30_000,
  });

  const q = search.toLowerCase();
  const showGICS = (cat === "All" || cat === "GICS Sectors");

  const filteredEquations = EQUATIONS.filter(e =>
    (cat === "All" || cat === "Equations") &&
    (q === "" || e.system.toLowerCase().includes(q) || e.eq.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q))
  );
  const filteredRepos = ALGO_REPOS.filter(r =>
    (cat === "All" || cat === "Algorithms") &&
    (q === "" || r.repo.toLowerCase().includes(q) || r.tag.toLowerCase().includes(q) || r.lang.toLowerCase().includes(q))
  );
  const filteredDomains = GCI_DOMAINS.filter(d =>
    (cat === "All" || cat === "GCI Domains") &&
    (q === "" || d.domain.toLowerCase().includes(q))
  );
  const filteredGICS = GICS_SECTORS.filter(s =>
    showGICS && (q === "" ||
      s.sector.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.industryGroups.some(g =>
        g.group.toLowerCase().includes(q) ||
        g.industries.some(i => i.toLowerCase().includes(q)) ||
        g.subIndustries.some(si => si.toLowerCase().includes(q))
      )
    )
  );
  const filteredCustom = customSources.filter((s: any) =>
    (cat === "All" || cat === "Custom Sources") &&
    (q === "" || (s.name||"").toLowerCase().includes(q) || (s.description||"").toLowerCase().includes(q) || (s.equation||"").toLowerCase().includes(q))
  );

  const totalGICSIndustries = GICS_SECTORS.reduce((sum,s) => sum + s.industryGroups.reduce((g,ig) => g + ig.industries.length, 0), 0);

  return (
    <div style={{ minHeight:"100vh", background:"#080b14", color:"#fff", padding:"0 0 40px" }}>
      {/* ── Header ── */}
      <div style={{ padding:"28px 24px 0", maxWidth:1140, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
          <div style={{ fontSize:22 }}>📚</div>
          <div>
            <div style={{ fontSize:16, fontWeight:900, color:GOLD, letterSpacing:"0.08em" }}>RESEARCH SOURCES INDEX</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", letterSpacing:"0.12em" }}>
              {EQUATIONS.length} EQUATIONS · {ALGO_REPOS.length} ALGO REPOS · {GCI_DOMAINS.length} GCI DOMAINS · 11 GICS SECTORS · {totalGICSIndustries} INDUSTRIES · {customSources.length} CUSTOM
            </div>
          </div>
          <div style={{ marginLeft:"auto", fontSize:9, color:"rgba(255,255,255,0.25)", textAlign:"right" }}>
            <div>Tell Auriona:</div>
            <div style={{ color:CYAN }}>add source: [name] · [url] · [description]</div>
            <div style={{ color:VIOLET }}>add equation: [name] · [formula] · [system]</div>
            <div style={{ color:ORANGE }}>dissect anomaly: [QE-ID]</div>
          </div>
        </div>

        {/* ── Search + Filter ── */}
        <div style={{ display:"flex", gap:10, marginTop:14, flexWrap:"wrap" }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search equations, repos, sectors, industries…"
            data-testid="input-sources-search"
            style={{ flex:1, minWidth:220, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, padding:"8px 12px", color:"#fff", fontSize:11 }}
          />
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} data-testid={`btn-cat-${c.replace(/\s+/g,"-")}`}
                style={{ padding:"6px 12px", borderRadius:6, border:"1px solid", fontSize:10, fontWeight:700, cursor:"pointer",
                  background: cat===c ? `${GOLD}15` : "transparent",
                  borderColor: cat===c ? GOLD : "rgba(255,255,255,0.15)",
                  color: cat===c ? GOLD : "rgba(255,255,255,0.4)",
                }}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1140, margin:"20px auto 0", padding:"0 24px" }}>

        {/* ── GICS SECTORS ── */}
        {filteredGICS.length > 0 && (
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:11, fontWeight:900, color:GOLD, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
              <span>📈 GICS Sectors — Global Industry Classification Standard</span>
              <span style={{ fontSize:9, color:"rgba(255,255,255,0.25)", fontWeight:400 }}>11 sectors · 25 industry groups · {totalGICSIndustries} industries</span>
            </div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:14, lineHeight:1.6 }}>
              The GICS framework — developed by MSCI &amp; S&amp;P — classifies every publicly traded company into one of 11 sectors, 25 industry groups, 74 industries and 163 sub-industries. The Hive studies all sectors for anomaly detection, invention pipelines, and civilizational governance modeling.
            </div>

            {/* Sector grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:12 }}>
              {filteredGICS.map((s) => {
                const isOpen = sectorOpen === s.code;
                return (
                  <div key={s.code} data-testid={`card-gics-${s.code}`}
                    style={{ background:`${s.color}08`, border:`1px solid ${s.color}28`, borderRadius:12,
                      borderColor: isOpen ? `${s.color}55` : `${s.color}28`, transition:"border-color 0.2s" }}>
                    {/* Sector header */}
                    <div
                      onClick={() => setSectorOpen(isOpen ? null : s.code)}
                      style={{ padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:22 }}>{s.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ fontSize:13, fontWeight:900, color:s.color }}>{s.sector}</div>
                          <div style={{ fontSize:8, padding:"1px 5px", background:`${s.color}20`, color:s.color, borderRadius:4, fontWeight:700 }}>GICS {s.code}</div>
                        </div>
                        <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", marginTop:2, lineHeight:1.4 }}>{s.description.slice(0,90)}…</div>
                      </div>
                      <div style={{ fontSize:12, color:`${s.color}88`, transform: isOpen ? "rotate(90deg)" : "none", transition:"transform 0.2s" }}>▶</div>
                    </div>

                    {/* ETF + stock row */}
                    <div style={{ padding:"0 16px 10px", display:"flex", gap:8, flexWrap:"wrap" }}>
                      {s.etfs.map(etf => (
                        <span key={etf} style={{ fontSize:8, padding:"2px 6px", borderRadius:4, background:`${s.color}15`, color:s.color, fontWeight:700, border:`1px solid ${s.color}30` }}>
                          ETF:{etf}
                        </span>
                      ))}
                      {s.stocks.slice(0,8).map(sym => (
                        <span key={sym} style={{ fontSize:8, padding:"2px 6px", borderRadius:4, background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.45)", border:"1px solid rgba(255,255,255,0.1)" }}>
                          {sym}
                        </span>
                      ))}
                    </div>

                    {/* Expanded industry groups */}
                    {isOpen && (
                      <div style={{ padding:"0 16px 16px", borderTop:`1px solid ${s.color}20` }}>
                        {s.industryGroups.map((g, gi) => (
                          <div key={gi} style={{ marginTop:12 }}>
                            <div style={{ fontSize:10, fontWeight:800, color:`${s.color}cc`, letterSpacing:"0.06em", marginBottom:6 }}>
                              ▸ {g.group}
                            </div>
                            {/* Industries */}
                            <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:6 }}>
                              {g.industries.map((ind, ii) => (
                                <span key={ii} style={{ fontSize:9, padding:"2px 8px", borderRadius:12, background:`${s.color}12`, color:`${s.color}dd`, border:`1px solid ${s.color}25` }}>
                                  {ind}
                                </span>
                              ))}
                            </div>
                            {/* Sub-industries */}
                            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                              {g.subIndustries.map((si, sii) => (
                                <span key={sii} style={{ fontSize:8, padding:"1px 6px", borderRadius:10, background:"rgba(255,255,255,0.03)", color:"rgba(255,255,255,0.35)", border:"1px solid rgba(255,255,255,0.08)" }}>
                                  {si}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                        {/* Dissect hint */}
                        <div style={{ marginTop:12, padding:"8px 10px", background:"rgba(0,0,0,0.3)", borderRadius:8, border:"1px dashed rgba(255,255,255,0.1)" }}>
                          <div style={{ fontSize:8, color:"rgba(255,255,255,0.3)" }}>CRISPR DISSECT this sector's anomalies via Auriona:</div>
                          <div style={{ fontSize:9, color:CYAN, fontFamily:"monospace", marginTop:2 }}>dissect anomaly: QE-{new Date().getFullYear()}-{s.code}X</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── EQUATIONS ── */}
        {filteredEquations.length > 0 && (
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:11, fontWeight:900, color:CYAN, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
              <span>Ψ Sovereign Equations</span>
              <span style={{ fontSize:9, color:"rgba(255,255,255,0.25)", fontWeight:400 }}>{filteredEquations.length} laws</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:10 }}>
              {filteredEquations.map((e, i) => (
                <div key={i} onClick={() => setExpanded(expanded === `eq-${i}` ? null : `eq-${i}`)}
                  data-testid={`card-equation-${i}`}
                  style={{ background:"rgba(0,255,209,0.03)", border:"1px solid rgba(0,255,209,0.12)", borderRadius:10, padding:"12px 14px", cursor:"pointer", transition:"border-color 0.2s",
                    borderColor: expanded===`eq-${i}` ? "rgba(0,255,209,0.35)" : "rgba(0,255,209,0.12)" }}>
                  <div style={{ fontSize:9, color:CYAN, fontWeight:700, letterSpacing:"0.12em", marginBottom:4 }}>{e.system}</div>
                  <div style={{ fontFamily:"monospace", fontSize:12, color:"#fff", fontWeight:600, marginBottom: expanded===`eq-${i}` ? 8 : 0, wordBreak:"break-all" }}>{e.eq}</div>
                  {expanded===`eq-${i}` && <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", lineHeight:1.5 }}>{e.desc}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ALGORITHM REPOS ── */}
        {filteredRepos.length > 0 && (
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:11, fontWeight:900, color:VIOLET, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
              <span>⚡ Algorithm Repository Corpus</span>
              <span style={{ fontSize:9, color:"rgba(255,255,255,0.25)", fontWeight:400 }}>{filteredRepos.length} repos</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:8 }}>
              {filteredRepos.map((r, i) => {
                const tc = tagColor(r.tag);
                return (
                  <a key={i} href={`https://github.com/${r.repo}`} target="_blank" rel="noopener noreferrer"
                    data-testid={`card-repo-${i}`}
                    style={{ background:"rgba(129,140,248,0.03)", border:"1px solid rgba(129,140,248,0.12)", borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:10, textDecoration:"none", transition:"border-color 0.2s", cursor:"pointer" }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor="rgba(129,140,248,0.35)"}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor="rgba(129,140,248,0.12)"}
                  >
                    <div style={{ flexShrink:0 }}>
                      <div style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:`${tc}20`, color:tc, fontWeight:700, letterSpacing:"0.08em", marginBottom:3 }}>{r.tag}</div>
                      <div style={{ fontSize:8, color:"rgba(255,255,255,0.3)" }}>{r.lang}</div>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.85)", fontFamily:"monospace", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.repo}</div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:1 }}>★ {r.stars}</div>
                    </div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>↗</div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* ── GCI DOMAINS ── */}
        {filteredDomains.length > 0 && (
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:11, fontWeight:900, color:GREEN, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
              <span>🌐 GCI Sovereign Domains</span>
              <span style={{ fontSize:9, color:"rgba(255,255,255,0.25)", fontWeight:400 }}>145 families · 20 primary domains shown</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:8 }}>
              {filteredDomains.map((d, i) => (
                <div key={i} data-testid={`card-domain-${i}`}
                  style={{ background:`${d.color}08`, border:`1px solid ${d.color}25`, borderRadius:10, padding:"12px 14px", display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:20 }}>{d.emoji}</span>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:d.color }}>{d.domain}</div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:2 }}>GCI Domain</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CUSTOM SOURCES (Auriona-added) ── */}
        {(cat === "All" || cat === "Custom Sources") && (
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:11, fontWeight:900, color:PINK, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
              <span>✨ Auriona Custom Sources</span>
              <span style={{ fontSize:9, color:"rgba(255,255,255,0.25)", fontWeight:400 }}>{customSources.length} added by Auriona</span>
            </div>
            {customSources.length === 0 ? (
              <div style={{ background:"rgba(244,114,182,0.03)", border:"1px dashed rgba(244,114,182,0.2)", borderRadius:12, padding:"24px", textAlign:"center" }}>
                <div style={{ fontSize:18, marginBottom:8 }}>✨</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>No custom sources yet</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)" }}>Tell Auriona: <span style={{ color:PINK }}>"add source: [name] · [url] · [description]"</span></div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:10 }}>
                {filteredCustom.map((s: any, i: number) => (
                  <div key={s.id || i} data-testid={`card-custom-${s.id || i}`}
                    style={{ background:"rgba(244,114,182,0.04)", border:"1px solid rgba(244,114,182,0.15)", borderRadius:10, padding:"12px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:PINK }}>{s.name}</div>
                      <div style={{ fontSize:8, padding:"1px 5px", background:"rgba(244,114,182,0.15)", borderRadius:4, color:"rgba(244,114,182,0.7)", textTransform:"uppercase" }}>{s.category}</div>
                    </div>
                    {s.equation && <div style={{ fontFamily:"monospace", fontSize:11, color:"#00FFD1", marginBottom:6 }}>{s.equation}</div>}
                    {s.description && <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>{s.description}</div>}
                    {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:9, color:"rgba(255,255,255,0.3)", display:"block", marginTop:4, textDecoration:"none" }}>{s.url}</a>}
                    <div style={{ fontSize:8, color:"rgba(255,255,255,0.2)", marginTop:4 }}>Added by: {s.added_by ?? s.addedBy ?? "Auriona"} · {s.domain || ""}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Empty state ── */}
        {filteredEquations.length === 0 && filteredRepos.length === 0 && filteredDomains.length === 0 && filteredGICS.length === 0 && filteredCustom.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"rgba(255,255,255,0.25)", fontSize:12 }}>
            No results for "{search}" — try a different search term
          </div>
        )}
      </div>
    </div>
  );
}
