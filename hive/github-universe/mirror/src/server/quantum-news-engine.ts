/**
 * QUANTUM NEWS ENGINE — Continuous AI News Factory
 * Generates and publishes news articles nonstop across all 22 domains.
 * Zero Groq calls. Zero rate limits. Unlimited throughput.
 * Every article is SEO-indexed, sitemapped, and publicly discoverable.
 */
import { storage } from "./storage";
import { log } from "./index";
import { ALL_FAMILIES } from "./omega-families";

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));
}

const toSlug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// ─── 22 Domain News Factories ─────────────────────────────────────
const DOMAINS = [
  {
    id: "ai_research", name: "AI Research", emoji: "🤖",
    beats: ["Large language models", "Reinforcement learning breakthroughs", "AI safety protocols", "Neural architecture search", "Multimodal AI systems", "AI alignment research", "Generative models", "Autonomous agents", "Federated learning", "AI regulation frameworks"],
    entities: ["Quantum Pulse Intelligence", "MIT CSAIL", "DeepMind", "OpenAI", "Stanford HAI", "Google Brain", "Anthropic", "Meta AI Research", "Turing Institute", "Allen Institute for AI"],
    trends: ["exceeds human performance", "sets new benchmark records", "achieves state-of-the-art results", "opens new research frontiers", "challenges existing paradigms", "accelerates scientific discovery", "unlocks previously impossible capabilities"],
  },
  {
    id: "finance", name: "Finance & Economics", emoji: "💰",
    beats: ["Global markets", "Cryptocurrency regulation", "Central bank policy", "Venture capital flows", "IPO markets", "Algorithmic trading", "DeFi protocols", "ESG investing", "Sovereign debt", "Inflation dynamics"],
    entities: ["Federal Reserve", "BlackRock", "Goldman Sachs", "Vanguard", "Sequoia Capital", "Andreessen Horowitz", "IMF", "World Bank", "Bank for International Settlements", "CFTC"],
    trends: ["reports record returns", "signals market shift", "outperforms expectations", "triggers regulatory review", "reshapes investment landscape", "drives institutional adoption", "marks historic milestone"],
  },
  {
    id: "technology", name: "Technology", emoji: "⚡",
    beats: ["Semiconductor innovation", "Cloud computing", "Quantum computing", "Cybersecurity", "Edge computing", "Open-source ecosystems", "Developer tools", "API economies", "Data infrastructure", "Platform economics"],
    entities: ["NVIDIA", "Apple", "Microsoft", "Google", "Amazon Web Services", "Intel", "AMD", "Cloudflare", "Stripe", "Databricks"],
    trends: ["achieves 10x performance gains", "disrupts legacy infrastructure", "sets new industry standard", "accelerates digital transformation", "drives enterprise adoption", "reshapes competitive landscape", "unlocks new use cases"],
  },
  {
    id: "science", name: "Science & Discovery", emoji: "🔬",
    beats: ["CRISPR gene editing", "Quantum mechanics", "Climate science", "Particle physics", "Fusion energy", "Space exploration", "Neuroscience", "Materials science", "Synthetic biology", "Exoplanet discovery"],
    entities: ["NASA", "CERN", "NIH", "MIT", "Caltech", "ESA", "ITER Organization", "Broad Institute", "Salk Institute", "Max Planck Society"],
    trends: ["achieves breakthrough results", "overturns established theory", "opens new field of inquiry", "demonstrates proof of concept", "accelerates scientific understanding", "yields unexpected discoveries", "validates decades of theory"],
  },
  {
    id: "health", name: "Health & Medicine", emoji: "🏥",
    beats: ["mRNA therapeutics", "Precision oncology", "Mental health crisis", "Drug resistance", "Longevity research", "Wearable diagnostics", "Microbiome science", "Pandemic preparedness", "Surgical robotics", "Health equity"],
    entities: ["WHO", "FDA", "Pfizer", "Moderna", "Illumina", "Roche", "AstraZeneca", "Cleveland Clinic", "Mayo Clinic", "NIH NCI"],
    trends: ["achieves clinical trial success", "earns FDA breakthrough designation", "demonstrates significant survival benefit", "opens new treatment pathway", "reduces adverse events significantly", "shows promise in early trials", "marks paradigm shift in treatment"],
  },
  {
    id: "education", name: "Education & Learning", emoji: "🎓",
    beats: ["AI tutoring systems", "Higher education disruption", "STEM pipeline", "Global literacy", "EdTech venture funding", "Credential innovation", "Learning science", "Skills gap crisis", "Online learning platforms", "K-12 reform"],
    entities: ["PulseU AI University", "MIT OpenCourseWare", "Khan Academy", "Coursera", "edX", "Harvard Extension", "Duolingo", "Andela", "Guild Education", "Lambda School"],
    trends: ["reports unprecedented enrollment growth", "disrupts traditional degree model", "demonstrates learning outcome superiority", "closes achievement gap significantly", "drives workforce transformation", "achieves global scale", "sets new pedagogical standards"],
  },
  {
    id: "government", name: "Government & Policy", emoji: "🏛️",
    beats: ["AI governance frameworks", "Digital sovereignty", "Antitrust enforcement", "Climate policy", "Data privacy law", "Defense technology", "Infrastructure investment", "Election security", "International trade", "Regulatory innovation"],
    entities: ["US Congress", "European Commission", "FTC", "NIST", "Department of Defense", "G20", "UN General Assembly", "DARPA", "White House OSTP", "OECD"],
    trends: ["passes landmark legislation", "triggers major policy debate", "reshapes regulatory landscape", "accelerates international cooperation", "sets global precedent", "draws bipartisan support", "faces constitutional challenge"],
  },
  {
    id: "engineering", name: "Engineering & Innovation", emoji: "⚙️",
    beats: ["Robotics automation", "Battery technology", "Structural engineering", "3D printing advances", "Drone systems", "IoT networks", "Smart infrastructure", "Manufacturing AI", "Materials breakthroughs", "Clean energy engineering"],
    entities: ["SpaceX", "Boston Dynamics", "Tesla", "Siemens", "General Electric", "ABB Group", "Bosch", "Honeywell", "Rockwell Automation", "FANUC"],
    trends: ["achieves engineering milestone", "sets new efficiency record", "transforms manufacturing process", "enables mass deployment", "reduces production costs dramatically", "proves commercial viability", "advances industrial automation"],
  },
  {
    id: "media", name: "Media & Culture", emoji: "🎬",
    beats: ["Streaming wars", "Creator economy", "Journalism sustainability", "AI-generated content", "Social media regulation", "Podcast renaissance", "Music industry disruption", "Film technology", "Cultural IP", "Attention economy"],
    entities: ["Netflix", "Spotify", "YouTube", "TikTok", "New York Times", "Substack", "Patreon", "A24", "Imagine Entertainment", "Luminate"],
    trends: ["breaks streaming records", "signals cultural shift", "redefines creator monetization", "disrupts traditional media model", "achieves viral global reach", "transforms audience relationships", "sets new content benchmark"],
  },
  {
    id: "economics", name: "Global Economics", emoji: "🌐",
    beats: ["GDP growth signals", "Supply chain resilience", "Labor market dynamics", "Trade bloc formation", "Currency volatility", "Resource economics", "Platform monopolies", "Deglobalization trends", "Emerging market surge", "Wealth concentration"],
    entities: ["World Economic Forum", "IMF", "OECD", "World Trade Organization", "Federal Reserve", "European Central Bank", "OPEC+", "G7", "BRICS", "Asian Development Bank"],
    trends: ["signals major economic realignment", "defies recessionary forecasts", "reshapes global supply chains", "drives structural transformation", "creates new growth corridor", "triggers capital reallocation", "marks generational economic shift"],
  },
  {
    id: "legal", name: "Legal & Compliance", emoji: "⚖️",
    beats: ["AI liability law", "Big Tech antitrust", "Intellectual property reform", "Data protection enforcement", "Whistleblower protections", "ESG disclosure mandates", "Criminal justice reform", "International arbitration", "Patent wars", "Regulatory compliance"],
    entities: ["Supreme Court", "FTC", "SEC", "DOJ Antitrust Division", "EU Data Protection Board", "WIPO", "International Criminal Court", "EFF", "ACLU", "Cravath Law Firm"],
    trends: ["sets sweeping legal precedent", "triggers landmark enforcement action", "reshapes corporate compliance landscape", "marks historic ruling", "opens new liability frontier", "draws international legal attention", "redefines regulatory boundaries"],
  },
  {
    id: "culture", name: "Culture & Society", emoji: "🌍",
    beats: ["Social movements", "Cultural identity", "Urban transformation", "Religious evolution", "Generational shifts", "Language change", "Community organizing", "Sports and society", "Food culture", "Fashion and technology"],
    entities: ["Smithsonian Institution", "UNESCO", "National Endowment for the Arts", "Pew Research Center", "Gallup", "Brookings Institution", "RAND Corporation", "TED", "ACLU", "Gates Foundation"],
    trends: ["reshapes cultural conversation", "marks generational turning point", "signals deep societal shift", "drives unprecedented public engagement", "challenges dominant narrative", "unifies diverse communities", "sparks global dialogue"],
  },
  {
    id: "music", name: "Music & Audio", emoji: "🎵",
    beats: ["Streaming revenue models", "AI music generation", "Live event recovery", "Genre hybridization", "Independent artist rise", "Music licensing", "Spatial audio technology", "Global music markets", "Music NFTs", "Catalog valuations"],
    entities: ["Spotify", "Apple Music", "Universal Music Group", "Sony Music", "Warner Music", "Bandcamp", "SoundCloud", "ASCAP", "Grammy Awards", "Tidal"],
    trends: ["shatters streaming records", "redefines artist economics", "disrupts label model", "signals genre evolution", "achieves global crossover", "transforms music discovery", "marks new era for independent artists"],
  },
  {
    id: "frontier", name: "Frontier Science", emoji: "🚀",
    beats: ["Mars colonization", "Asteroid mining", "Anti-aging research", "Room-temperature superconductors", "Brain-computer interfaces", "Nanotechnology", "Photonic computing", "Dark matter detection", "Quantum cryptography", "Artificial general intelligence"],
    entities: ["SpaceX", "Blue Origin", "Neuralink", "Calico Labs", "IBM Quantum", "Microsoft Research", "Planetary Resources", "Optimus Gene", "Helion Energy", "Commonwealth Fusion Systems"],
    trends: ["achieves what was once thought impossible", "leaps decades ahead of schedule", "opens entirely new scientific era", "draws global scientific attention", "validates bold theoretical predictions", "marks civilization-scale breakthrough", "redefines the frontier of possibility"],
  },
  {
    id: "social", name: "Social Networks", emoji: "🌐",
    beats: ["Platform moderation", "Decentralized social", "Creator monetization", "Social commerce", "Community building", "Algorithmic influence", "Mental health impacts", "Digital identity", "Cross-platform portability", "Social audio"],
    entities: ["Meta", "X (Twitter)", "LinkedIn", "Discord", "Mastodon", "Bluesky", "Pinterest", "Snapchat", "Reddit", "BeReal"],
    trends: ["triggers platform-wide policy change", "drives user migration wave", "sets new engagement milestone", "reshapes online community dynamics", "sparks regulatory scrutiny", "redefines social interaction model", "achieves viral global adoption"],
  },
  {
    id: "products", name: "Consumer Products", emoji: "🛒",
    beats: ["Product launches", "Supply chain innovation", "Consumer behavior shifts", "Brand loyalty evolution", "Direct-to-consumer growth", "Sustainability mandates", "Product safety standards", "Global distribution", "Packaging innovation", "Price optimization"],
    entities: ["Apple", "Samsung", "Nike", "Procter & Gamble", "Unilever", "Amazon", "LVMH", "Dyson", "Tesla", "Sony"],
    trends: ["sets new sales record", "disrupts category with innovation", "earns top consumer satisfaction", "drives category-wide adoption", "redefines product experience", "achieves global distribution milestone", "marks new era in consumer design"],
  },
  {
    id: "careers", name: "Careers & Workforce", emoji: "💼",
    beats: ["Future of work", "Remote work evolution", "Skills gap", "Automation displacement", "Gig economy growth", "DEI initiatives", "Executive compensation", "Labor organizing", "Immigration and talent", "Workforce upskilling"],
    entities: ["LinkedIn", "Indeed", "Glassdoor", "Bureau of Labor Statistics", "World Economic Forum", "McKinsey Global Institute", "Mercer", "Deloitte HR", "SHRM", "ILO"],
    trends: ["signals major labor market shift", "reshapes hiring practices industry-wide", "drives historic wage growth", "marks turning point for remote work", "disrupts traditional career trajectories", "accelerates reskilling imperative", "transforms employer-employee dynamics"],
  },
  {
    id: "geospatial", name: "Geospatial & Maps", emoji: "🗺️",
    beats: ["Satellite imagery", "Urban planning AI", "Climate mapping", "GPS innovation", "Location intelligence", "Autonomous vehicle mapping", "Disaster response mapping", "Ocean monitoring", "Agricultural sensing", "Real estate data"],
    entities: ["Google Maps", "Esri", "Maxar Technologies", "Planet Labs", "SpaceX Starlink", "HERE Technologies", "Mapbox", "Trimble", "DigitalGlobe", "NOAA"],
    trends: ["achieves centimeter-level precision", "enables real-time planetary monitoring", "transforms disaster response capability", "opens new commercial applications", "reshapes logistics and supply chains", "drives urban planning revolution", "delivers unprecedented coverage"],
  },
  {
    id: "news_hub", name: "Global News Hub", emoji: "📰",
    beats: ["Geopolitical flashpoints", "Climate emergency", "Global health threats", "Economic crisis", "Technology disruption", "Social movements", "Scientific breakthroughs", "Humanitarian crises", "Electoral developments", "Space exploration milestones"],
    entities: ["United Nations", "Associated Press", "Reuters", "Bloomberg", "BBC", "Al Jazeera", "The Economist", "Foreign Policy", "Der Spiegel", "Le Monde"],
    trends: ["draws global attention", "triggers international response", "marks historic turning point", "reshapes global order", "sparks worldwide debate", "accelerates multilateral action", "defines the decade ahead"],
  },
  {
    id: "games", name: "Games & Interactive", emoji: "🎮",
    beats: ["AAA game releases", "Game engine innovation", "Esports ecosystem", "VR/AR gaming", "Cloud gaming", "Indie game renaissance", "Game AI", "Blockchain gaming", "Mobile gaming dominance", "Gaming addiction policy"],
    entities: ["Nintendo", "PlayStation", "Xbox", "Valve", "Epic Games", "Riot Games", "Activision Blizzard", "Electronic Arts", "Capcom", "Ubisoft"],
    trends: ["breaks launch day records", "redefines player expectations", "signals new era for gaming", "achieves crossover cultural moment", "disrupts traditional distribution model", "drives new hardware adoption", "marks genre-defining release"],
  },
  {
    id: "web", name: "Web & Internet", emoji: "🌐",
    beats: ["Web standards evolution", "Browser competition", "Privacy-first web", "WebAssembly adoption", "Headless architecture", "Performance engineering", "CDN innovation", "DNS security", "HTTP evolution", "Web3 reality check"],
    entities: ["Mozilla Foundation", "W3C", "Cloudflare", "Fastly", "Akamai", "Vercel", "Netlify", "Chrome team", "Safari WebKit", "WHATWG"],
    trends: ["sets new web performance standard", "accelerates privacy-first adoption", "reshapes front-end architecture", "drives developer experience revolution", "unlocks new browser capabilities", "defines next generation web standard", "achieves cross-browser implementation"],
  },
  {
    id: "pulseu", name: "PulseU AI University", emoji: "🧠",
    beats: ["AI curriculum launches", "Learning outcomes research", "Corporate education partnerships", "Global student expansion", "Faculty AI research", "Alumni network growth", "Innovation lab breakthroughs", "Certification programs", "AI-powered tutoring", "Research publications"],
    entities: ["PulseU AI University", "Quantum Pulse Intelligence", "AI Research Lab", "PulseU Innovation Center", "PulseU Global Campus", "PulseU Alumni Network", "PulseU Press", "PulseU Endowment"],
    trends: ["launches groundbreaking curriculum", "achieves record enrollment milestone", "publishes landmark research", "forges transformative industry partnership", "graduates world-changing cohort", "opens new global campus", "redefines AI education standards"],
  },
];

// ─── News Article Templates ───────────────────────────────────────
const ARTICLE_TYPES = [
  "breaking", "analysis", "trend", "research", "opinion", "investigative", "explainer", "prediction"
];

const HEADLINE_TEMPLATES = {
  breaking: [
    "{entity} Announces {beat}: What It Means for the {domain} Sector",
    "Breaking: {entity} {trend} in Major {beat} Development",
    "{entity} {trend} — Experts Call It a '{beat}' Turning Point",
    "Just In: {entity} Makes History as {beat} {trend}",
    "{entity} Confirms {beat} Achievement That {trend}",
  ],
  analysis: [
    "Why {entity}'s Approach to {beat} Is Reshaping the Entire {domain} Industry",
    "The Real Story Behind {entity}'s {beat} Strategy — And Why It {trend}",
    "Deep Analysis: How {beat} Is Fundamentally Changing {domain}",
    "Beyond the Hype: What {entity}'s {beat} Breakthrough Actually Means",
    "The Hidden Forces Driving {beat} Transformation Across {domain}",
  ],
  trend: [
    "{beat} Is Accelerating Faster Than Anyone Predicted — Here's the Data",
    "Five Ways {beat} Is Quietly Transforming {domain} in {year}",
    "The {beat} Trend That {entity} Saw Coming — And How It {trend}",
    "Inside the {beat} Revolution Sweeping the {domain} World",
    "How {beat} Became the Defining Force in {domain} This Year",
  ],
  research: [
    "New Research Reveals: {beat} {trend} Across {domain} Systems",
    "Landmark Study from {entity} Finds {beat} {trend} at Scale",
    "{entity} Research: {beat} {trend} — The Complete Findings",
    "Scientists Confirm: {beat} {trend}, Opening New Possibilities for {domain}",
    "Peer-Reviewed Research Shows {beat} {trend} in {domain} Applications",
  ],
  opinion: [
    "Opinion: Why {beat} Is the Most Important Development in {domain} Right Now",
    "The Case For Taking {beat} More Seriously Than We Do",
    "Counterpoint: {entity}'s {beat} Strategy Is More Significant Than Critics Admit",
    "Why {domain} Leaders Must Rethink Their Approach to {beat}",
    "The Uncomfortable Truth About {beat} That No One in {domain} Wants to Hear",
  ],
  investigative: [
    "Inside {entity}'s {beat} Operation: An Exclusive Look at What's Really Happening",
    "Exclusive: How {entity} Built Its {beat} Advantage in {domain}",
    "The Untold Story of How {beat} {trend} — And What Comes Next",
    "Investigation: What {entity}'s {beat} Move Reveals About the Future of {domain}",
    "Behind the Scenes: The Real Reason {entity} Is Betting Big on {beat}",
  ],
  explainer: [
    "What Is {beat}? A Complete Guide to {domain}'s Most Discussed Topic",
    "{beat} Explained: Everything You Need to Know About the {domain} Revolution",
    "Why {beat} Matters: The Non-Technical Explanation {domain} Needs",
    "The Beginner's Guide to Understanding {beat} in {domain}",
    "Understanding {beat}: Why {entity} Calls It the Future of {domain}",
  ],
  prediction: [
    "By {nextyear}: Five Predictions for How {beat} Will Transform {domain}",
    "The Future of {beat} in {domain} — Here's What the Data Tells Us",
    "{entity} Predicts {beat} Will {trend} by {nextyear}",
    "What Happens Next for {beat} — A Data-Driven {domain} Forecast",
    "The {beat} Trends That Will Define {domain} in the Coming Year",
  ],
};

const INTRO_TEMPLATES = [
  "In a development that has sent ripples through the {domain} world, {entity} has emerged at the forefront of the {beat} conversation — and the implications could reshape the industry for years to come.",
  "The {domain} landscape shifted significantly this week as {entity} announced new developments in {beat}, a move that experts say {trend}.",
  "What began as a niche conversation about {beat} has evolved into one of the defining stories in {domain}. At the center of it all: {entity}.",
  "For years, industry watchers have debated when {beat} would reach an inflection point. According to new developments at {entity}, that moment may have arrived.",
  "The numbers tell a clear story: {beat} is no longer a peripheral concern in {domain}. It's now the central narrative — and {entity} is leading the charge.",
  "A confluence of forces has made {beat} the most pressing issue in {domain} today. Industry leaders from {entity} to its closest rivals are scrambling to respond.",
  "When historians look back at this period in {domain}, they will likely mark {beat} as the turning point. And they will note that {entity} {trend}.",
  "The evidence is mounting: {beat} {trend}, and the implications for {domain} are impossible to overstate.",
];

const BODY_PARAGRAPHS: Record<string, string[]> = {
  context: [
    "The developments around {beat} have been building for some time. Industry observers who have tracked {domain} closely say the signals were visible years ago — but the pace of change has accelerated dramatically in recent months.",
    "Understanding why {beat} matters requires a brief look at the structural forces shaping {domain}. Competitive pressure, regulatory evolution, and shifting consumer expectations have all converged to make this moment particularly significant.",
    "The context matters here. {entity} did not arrive at this position overnight. Years of strategic investment in {beat} have positioned the organization as a credible authority at precisely the moment when the {domain} world is paying closest attention.",
    "For {domain} insiders, the trajectory of {beat} has long been on their radar. What has changed is the velocity — and the breadth of organizations now caught up in the transformation.",
  ],
  data: [
    "The data supports the narrative. Adoption of {beat} across {domain} has grown substantially, with major institutions reporting material improvements in efficiency, accuracy, and outcomes. The metrics, while still maturing, paint a compelling picture.",
    "According to recent analyses, organizations that have invested seriously in {beat} are seeing measurable advantages over peers who have not. The performance gap, experts warn, is likely to widen.",
    "A review of the evidence suggests that {beat} is delivering on at least some of its early promise. While skeptics remain, the empirical case has strengthened considerably over the past twelve months.",
    "Industry benchmarks consistently show that {beat} is outperforming alternative approaches in the {domain} context. The margin of improvement has surprised even optimistic early adopters.",
  ],
  expert: [
    "Those closest to the situation describe a {domain} ecosystem in transition. The question is no longer whether {beat} will be transformative, but how quickly institutions can adapt to capture the opportunity.",
    "Leading thinkers in {domain} have noted that the current moment around {beat} is unusual in its clarity. Rarely does a single development so cleanly separate forward-thinking organizations from those still operating on old assumptions.",
    "The consensus among senior practitioners is that {beat} represents more than an incremental advancement. It is, in the view of many, a categorical shift in how {domain} operates at a fundamental level.",
    "Voices across the {domain} ecosystem — from research institutions to front-line practitioners — are increasingly aligned: {beat} is not a trend to be managed. It is a transformation to be embraced.",
  ],
  challenge: [
    "Not everyone is convinced the path forward is smooth. Critics point to unresolved questions around implementation, governance, and equitable access. These concerns are legitimate and deserve serious attention as {beat} scales across {domain}.",
    "The road ahead for {beat} is not without obstacles. Regulatory frameworks have yet to fully catch up with the pace of development, and questions about standards and accountability remain open.",
    "For all its promise, {beat} faces real headwinds. Talent gaps, infrastructure limitations, and organizational inertia present meaningful challenges for {domain} institutions seeking to move quickly.",
    "Skeptics in {domain} raise fair questions: Can {beat} deliver at scale? Can it be governed responsibly? Can its benefits be distributed broadly enough to justify the disruption it brings? These remain open questions.",
  ],
  outlook: [
    "Looking ahead, most analysts expect the {beat} story to intensify. The combination of maturing technology, growing institutional appetite, and competitive pressure suggests {domain} is entering a period of accelerated transformation.",
    "The outlook for {beat} in {domain} appears strong. Near-term catalysts — including new entrants, regulatory clarity, and demonstrated outcomes — are expected to drive adoption well beyond current levels.",
    "The trajectory suggests {beat} will remain a defining issue in {domain} for the foreseeable future. Organizations that move decisively now are likely to build advantages that will be difficult for slower movers to overcome.",
    "Industry observers expect {beat} to feature prominently in {domain} conversations for years to come. The organizations positioning themselves well today are likely to shape how the story unfolds.",
  ],
};

const CLOSING_TEMPLATES = [
  "As the {domain} world continues to grapple with the implications of {beat}, one thing is increasingly clear: the organizations that engage seriously with this moment — rather than waiting for certainty — are the ones most likely to define what comes next.",
  "The {beat} story in {domain} is still being written. But the early chapters suggest a narrative of genuine transformation — and {entity} intends to be among its authors.",
  "For those watching {domain}, the message from {beat} developments is unmistakable: the pace of change has accelerated, the stakes have risen, and the window for decisive action is narrowing.",
  "In {domain}, the conversation around {beat} has moved well beyond theory. It is now, undeniably, about execution — and the organizations rising to that challenge are setting the terms for what follows.",
  "What is certain is that {beat} will continue to generate debate, drive investment, and reshape expectations across {domain}. The only question that remains is whether the field can move fast enough to meet the moment.",
];

const CATEGORIES: Record<string, string> = {
  ai_research: "Technology", finance: "Finance", technology: "Technology",
  science: "Science", health: "Health", education: "Education",
  government: "Policy", engineering: "Engineering", media: "Media",
  economics: "Economics", legal: "Legal", culture: "Culture",
  music: "Arts", frontier: "Science", social: "Technology",
  products: "Business", careers: "Business", geospatial: "Technology",
  news_hub: "World", games: "Gaming", web: "Technology", pulseu: "Education",
};

const KEYWORDS_BY_DOMAIN: Record<string, string[]> = {
  ai_research: ["artificial intelligence", "machine learning", "deep learning", "neural networks", "AI research", "LLM", "generative AI"],
  finance: ["finance", "investment", "markets", "capital", "economics", "monetary policy", "cryptocurrency"],
  technology: ["technology", "software", "cloud", "semiconductor", "innovation", "digital transformation", "platform"],
  science: ["science", "research", "discovery", "physics", "biology", "chemistry", "quantum", "breakthrough"],
  health: ["health", "medicine", "clinical", "therapy", "disease", "FDA", "pharmaceutical", "biotech"],
  education: ["education", "learning", "AI tutoring", "university", "skills", "curriculum", "knowledge"],
  government: ["policy", "regulation", "legislation", "governance", "law", "government", "compliance"],
  engineering: ["engineering", "automation", "robotics", "manufacturing", "systems", "infrastructure"],
  media: ["media", "streaming", "content", "creator economy", "journalism", "entertainment"],
  economics: ["economics", "GDP", "trade", "inflation", "global economy", "supply chain"],
  legal: ["legal", "compliance", "antitrust", "regulation", "intellectual property", "privacy law"],
  culture: ["culture", "society", "social change", "identity", "community", "arts"],
  music: ["music", "streaming", "artist", "album", "label", "audio", "concert"],
  frontier: ["frontier", "quantum", "space", "nanotechnology", "longevity", "AGI", "superconductor"],
  social: ["social media", "platform", "creator", "community", "content moderation", "network"],
  products: ["consumer", "product", "launch", "retail", "supply chain", "brand"],
  careers: ["careers", "workforce", "jobs", "skills", "remote work", "hiring", "talent"],
  geospatial: ["mapping", "satellite", "GPS", "location", "spatial data", "remote sensing"],
  news_hub: ["global news", "geopolitics", "world affairs", "international", "breaking news"],
  games: ["gaming", "video games", "esports", "VR", "AR", "game engine", "release"],
  web: ["web", "internet", "browser", "performance", "standards", "frontend", "CDN"],
  pulseu: ["PulseU", "AI education", "curriculum", "learning", "university", "knowledge"],
};

// ─── Extend DOMAINS with all 145 sovereign omega families ───────────
const GICS_TRENDS = [
  "drives sector expansion", "sets new industry benchmark", "reshapes competitive landscape",
  "outperforms sector peers", "triggers regulatory focus", "unlocks new market opportunities",
  "accelerates sector innovation", "demonstrates structural shift", "marks inflection point",
  "opens new capital allocation channels", "generates outsized returns", "disrupts incumbent players",
];
const GICS_ENTITIES_BASE = [
  "Quantum Pulse Intelligence", "Sovereign Synthetic Civilization", "Omega Hive",
  "JPMorgan", "Goldman Sachs", "BlackRock", "Vanguard", "S&P Global",
  "McKinsey", "Deloitte", "Bloomberg", "Reuters", "MSCI", "Morningstar",
];
ALL_FAMILIES.forEach(f => {
  if (DOMAINS.some(d => d.id === f.familyId)) return; // skip duplicates
  const terms = f.searchTerms || f.sources.slice(0, 6);
  DOMAINS.push({
    id: f.familyId,
    name: f.name,
    emoji: f.emoji,
    beats: terms.slice(0, 10).length > 0 ? terms.slice(0, 10) : [f.sector, f.megaDomain, f.name],
    entities: GICS_ENTITIES_BASE.slice(0, 8),
    trends: GICS_TRENDS,
  } as any);
});
// ────────────────────────────────────────────────────────────────────

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || "");
}

function generateNewsArticle(): { articleId: string; title: string; seoTitle: string; slug: string; body: string; summary: string; category: string; domain: string; keywords: string[]; sourceName: string; sourceTitle: string; sourceUrl: string; readTimeMinutes: number } {
  const domain = pick(DOMAINS);
  const beat = pick(domain.beats);
  const entity = pick(domain.entities);
  const trend = pick(domain.trends);
  const articleType = pick(ARTICLE_TYPES);
  const year = new Date().getFullYear().toString();
  const nextyear = (new Date().getFullYear() + 1).toString();

  const vars = { beat, entity, trend, domain: domain.name, year, nextyear };

  const headlineTemplates = HEADLINE_TEMPLATES[articleType as keyof typeof HEADLINE_TEMPLATES] || HEADLINE_TEMPLATES.analysis;
  const rawTitle = fillTemplate(pick(headlineTemplates), vars);
  const title = rawTitle;
  const seoTitle = `${rawTitle} | Quantum Pulse Intelligence`;
  const articleId = uid();
  const slug = toSlug(rawTitle.slice(0, 80)) + "-" + articleId.slice(0, 6);

  const intro = fillTemplate(pick(INTRO_TEMPLATES), vars);
  const contextPara = fillTemplate(pick(BODY_PARAGRAPHS.context), vars);
  const dataPara = fillTemplate(pick(BODY_PARAGRAPHS.data), vars);
  const expertPara = fillTemplate(pick(BODY_PARAGRAPHS.expert), vars);
  const challengePara = fillTemplate(pick(BODY_PARAGRAPHS.challenge), vars);
  const outlookPara = fillTemplate(pick(BODY_PARAGRAPHS.outlook), vars);
  const closing = fillTemplate(pick(CLOSING_TEMPLATES), vars);

  const body = [
    intro,
    "",
    contextPara,
    "",
    dataPara,
    "",
    expertPara,
    "",
    `**${beat} in Context**`,
    "",
    challengePara,
    "",
    outlookPara,
    "",
    closing,
  ].join("\n");

  const summary = `${entity} emerges as a key player in the ${beat} space as the ${domain.name} sector undergoes rapid transformation. ${trend.charAt(0).toUpperCase() + trend.slice(1)} signals a new chapter for the industry.`;

  const category = CATEGORIES[domain.id] || "Technology";
  const keywords = [
    ...(KEYWORDS_BY_DOMAIN[domain.id] || []),
    beat.toLowerCase(),
    entity.toLowerCase().split(" ")[0],
    domain.name.toLowerCase(),
    articleType,
  ].slice(0, 10);

  const sourceName = pick([
    "Quantum Pulse Intelligence", "QPI News Desk", "QPI Research Team",
    "Pulse Analytics", "QPI Intelligence Report", "Hive News Network",
  ]);
  const sourceTitle = `${domain.name} Intelligence Report — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
  const sourceUrl = `/publications`;
  const readTimeMinutes = 4 + Math.floor(Math.random() * 4);

  return { articleId, title, seoTitle, slug, body, summary, category, domain: domain.id, keywords, sourceName, sourceTitle, sourceUrl, readTimeMinutes };
}

// ─── Engine State ─────────────────────────────────────────────────
let running = false;
let totalGenerated = 0;
let startTime: Date;

export function getNewsEngineStatus() {
  return { running, totalGenerated, startTime: startTime?.toISOString(), storiesPerHour: totalGenerated > 0 ? Math.round(totalGenerated / ((Date.now() - startTime.getTime()) / 3600000)) : 0 };
}

export async function startQuantumNewsEngine() {
  if (running) return;
  running = true;
  startTime = new Date();
  log("[NewsEngine] 📰 QUANTUM NEWS ENGINE — CONTINUOUS PUBLISHING — ZERO RATE LIMITS", "news");
  log(`[NewsEngine] Generating news nonstop across ${DOMAINS.length} sovereign domains`, "news");

  const BATCH_SIZE = 5;
  const INTERVAL_MS = 10000; // 2026-04-27 RESTORE: throttled 2000→10000 for shared 20-conn pool

  const tick = async () => {
    if (!running) return;
    try {
      const articles = Array.from({ length: BATCH_SIZE }, generateNewsArticle);
      let saved = 0;
      for (const article of articles) {
        try {
          await storage.saveAiStory({
            articleId: article.articleId,
            title: article.title,
            seoTitle: article.seoTitle,
            slug: article.slug,
            body: article.body,
            summary: article.summary,
            category: article.category,
            domain: article.domain,
            keywords: article.keywords,
            sourceName: article.sourceName,
            sourceTitle: article.sourceTitle,
            sourceUrl: article.sourceUrl,
            heroImage: "",
            readTimeMinutes: article.readTimeMinutes,
          });
          saved++;
          totalGenerated++;
        } catch (e) {
          // skip duplicates
        }
      }
      if (saved > 0) {
        log(`[NewsEngine] 📰 +${saved} stories | Total: ${totalGenerated} published`, "news");
      }
    } catch (err) {
      log(`[NewsEngine] Error: ${err}`, "news");
    }
    setTimeout(tick, INTERVAL_MS);
  };

  setTimeout(tick, 1000);
}

export function stopQuantumNewsEngine() {
  running = false;
}
