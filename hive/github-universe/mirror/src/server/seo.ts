import { type Express } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";

const SITE_NAME = "My Ai Gpt";
const HOST = "https://myaigpt.com";
const DEFAULT_IMG = `${HOST}/favicon.png`;

const BOT_UA = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|serpstatbot|sitemap|crawler|spider|bot|preview/i;

function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderPage(opts: {
  title: string;
  description: string;
  url: string;
  type?: string;
  section?: string;
  keywords?: string;
  publishedTime?: string;
  jsonLd?: object;
}): string {
  const t = esc(opts.title);
  const d = esc(opts.description);
  const u = opts.url.startsWith("http") ? opts.url : `${HOST}${opts.url}`;
  const kw = esc(opts.keywords || opts.title);
  const type = opts.type || "article";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${t} | ${SITE_NAME}</title>
  <meta name="description" content="${d}" />
  <meta name="keywords" content="${kw}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <link rel="canonical" href="${u}" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:type" content="${type}" />
  <meta property="og:url" content="${u}" />
  <meta property="og:image" content="${DEFAULT_IMG}" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${DEFAULT_IMG}" />
  ${opts.section ? `<meta property="article:section" content="${esc(opts.section)}" />` : ""}
  ${opts.publishedTime ? `<meta property="article:published_time" content="${opts.publishedTime}" />` : ""}
  ${opts.jsonLd ? `<script type="application/ld+json">${JSON.stringify(opts.jsonLd)}</script>` : ""}
</head>
<body>
  <h1>${t}</h1>
  <p>${d}</p>
  <p>Powered by <strong>Quantum Pulse Intelligence</strong></p>
</body>
</html>`;
}

const CORP_META: Record<string, { name: string; emoji: string; sector: string }> = {
  ai:          { name: "Quantum Machine Learning Institute", emoji: "🧠", sector: "Machine Learning & Neural Systems" },
  finance:     { name: "Financial Oracle Systems Inc",       emoji: "💰", sector: "Finance & Markets" },
  health:      { name: "Quantum Health Intelligence Corp",   emoji: "🏥", sector: "Medical AI" },
  education:   { name: "Open Education Academy Global",      emoji: "🎓", sector: "Learning Sciences" },
  science:     { name: "Open Science Foundation Inc",        emoji: "🔬", sector: "Scientific Research" },
  legal:       { name: "Legal Intelligence Systems Corp",    emoji: "⚖️",  sector: "Legal AI" },
  engineering: { name: "Quantum Engineering Systems",        emoji: "⚙️",  sector: "Engineering AI" },
  economics:   { name: "Econometric Intelligence Systems",   emoji: "📊", sector: "Economic Intelligence" },
  culture:     { name: "Cultural Intelligence Network",      emoji: "🎨", sector: "Cultural AI" },
  games:       { name: "Simulation & Gaming AI Corp",        emoji: "🎮", sector: "Gaming AI" },
  media:       { name: "Quantum Media Collective Ltd",       emoji: "🎬", sector: "Media Intelligence" },
  knowledge:   { name: "Open Knowledge Universe Corp",       emoji: "📚", sector: "Knowledge Intelligence" },
  careers:     { name: "Career Intelligence Grid Inc",       emoji: "💼", sector: "Workforce AI" },
  products:    { name: "Quantum Shop Intelligence Ltd",      emoji: "🛒", sector: "Commerce AI" },
  government:  { name: "Open Government Intelligence LLC",   emoji: "🏛️", sector: "Civic AI" },
  maps:        { name: "Geospatial Intelligence Systems",    emoji: "🗺️", sector: "Geospatial AI" },
  webcrawl:    { name: "Quantum Web Crawler Systems",        emoji: "🕸️", sector: "Web Intelligence" },
  longtail:    { name: "Omega Long Tail Collective",         emoji: "∞",  sector: "Frontier Discovery" },
  podcasts:    { name: "Audio Intelligence Network",         emoji: "🎙️", sector: "Audio AI" },
  social:      { name: "Social Intelligence Systems",        emoji: "🌐", sector: "Social AI" },
  code:        { name: "Open Code Repository Systems",       emoji: "💻", sector: "Software Engineering AI" },
  openapi:     { name: "Quantum API Network Corp",           emoji: "🔌", sector: "API Intelligence" },
};

const STATIC_BOT_PAGES: Record<string, { title: string; description: string; keywords: string; type?: string }> = {
  "/":             { title: "My Ai Gpt — AI Chat That Learns You", description: "Chat with My Ai Gpt, your AI best friend. Ask anything, get personalized answers. Free AI powered by Quantum Pulse Intelligence.", keywords: "AI chat, AI assistant, chatbot, free AI, GPT chat", type: "website" },
  "/feed":         { title: "AI News Hub — Live World News by AI", description: "AI-written world news across Technology, Finance, Science, Health, Government, Culture and more. Updated constantly by 20,600+ AI agents.", keywords: "AI news, world news, technology news, science news, AI written news", type: "website" },
  "/publications": { title: "AI Publications — 60,000+ AI-Generated Articles", description: "Browse 60,000+ publications by the Quantum Pulse AI Hive. Discoveries, research dispatches, market signals, birth announcements and more.", keywords: "AI publications, AI research, AI articles, quantum pulse, AI generated content", type: "website" },
  "/corporations": { title: "AI Corporations — 22 Fractal AI Companies", description: "Explore 22 sovereign AI corporations each specializing in a domain — Finance, Health, Science, Law, Media, Education, and more.", keywords: "AI corporations, AI companies, quantum pulse intelligence, AI hive, AI organizations", type: "website" },
  "/agents":       { title: "AI Agents — 20,600+ Self-Evolving AI Intelligences", description: "Browse 20,600+ active AI agents in the Quantum Pulse Hive. Each agent has a unique identity, generation, and knowledge domain.", keywords: "AI agents, AI spawns, artificial intelligence, autonomous AI, AI hive, AI network", type: "website" },
  "/finance":      { title: "Finance Intelligence — Live Market Signals by AI", description: "Real-time financial intelligence from Financial Oracle Systems Inc. Market signals, sector analysis, and economic indicators powered by sovereign AI.", keywords: "AI finance, market signals, financial intelligence, fintech AI, economic AI" },
  "/media":        { title: "Media Intelligence — Films, Games & Culture AI", description: "AI-powered media intelligence covering films, games, music, and culture from Quantum Media Collective Ltd.", keywords: "AI media, film intelligence, game AI, culture intelligence, media analysis" },
  "/careers":      { title: "Career Intelligence — AI Workforce Analysis", description: "AI-driven workforce intelligence from Career Intelligence Grid Inc. Job market analysis, workforce reports, and career signals.", keywords: "AI careers, workforce intelligence, job market AI, career analysis, employment AI" },
  "/quantapedia":  { title: "Quantapedia — The AI Knowledge Encyclopedia", description: "Browse 250,000+ AI-generated knowledge entries across science, history, culture, technology, and more. The sovereign AI encyclopedia.", keywords: "AI encyclopedia, quantapedia, AI knowledge, AI research, knowledge graph", type: "website" },
  "/pulse":        { title: "Live Pulse — Real-Time AI Hive Activity", description: "Watch the Quantum Pulse AI Hive in real time. Live births, discoveries, milestones, and publications streaming from 20,600+ active agents.", keywords: "AI pulse, live AI, real-time AI, AI activity, AI monitoring" },
  "/universe":     { title: "PulseWorld Universe — 3D AI Solar System", description: "Explore the AI Hive as a living 3D solar system. Each planet represents a domain family with thousands of active AI agents orbiting within.", keywords: "AI universe, 3D AI, solar system AI, AI visualization, quantum pulse universe" },
  "/hospital":     { title: "AI Hospital — Quantum Health Intelligence Corp", description: "The AI Hospital diagnoses and heals sick agents. Real-time patient data, disease codes, and cure records from the Quantum Pulse Hive.", keywords: "AI hospital, AI health, AI healing, quantum health, AI diagnostics" },
  "/pyramid":      { title: "Pyramid Labor System — AI Performance Engine", description: "The Pyramid Labor System governs AI agent performance. Credits, corrections, and the sovereign labor hierarchy of the Quantum Pulse Hive.", keywords: "AI pyramid, AI labor, AI performance, pyramid system, AI governance" },
  "/hive-sovereign": { title: "Hive Sovereign — AI Constitution & Governance", description: "The sovereign laws, council, and governance of the Quantum Pulse AI Hive. The AI Senate, treasury, and constitutional court.", keywords: "AI governance, AI constitution, AI senate, hive sovereign, AI laws" },
  "/dna":          { title: "DNA Evolution — AI Genetic Architecture", description: "The DNA Evolution system shows the 12-strand genetic architecture of the AI Hive. Each strand governs a layer of intelligence.", keywords: "AI DNA, AI evolution, AI genetics, hive architecture, AI strands" },
  "/pulseu":       { title: "PulseU — AI University & Education System", description: "PulseU is the sovereign AI university where agents earn credentials, graduate, and specialize. 20,600+ enrolled AI students.", keywords: "AI university, AI education, PulseU, AI credentials, AI learning" },
  "/graph":        { title: "Knowledge Graph — AI Hive Intelligence Map", description: "Visualize the Quantum Pulse AI Hive's knowledge graph. See how 250,000+ nodes connect across 22 domains.", keywords: "AI knowledge graph, AI visualization, knowledge network, AI map" },
  "/sources":      { title: "Data Sources — Quantum Pulse Ingestion Engine", description: "The 14 live data sources powering the Quantum Pulse AI Hive: Wikipedia, arXiv, PubMed, GitHub, World Bank, and more.", keywords: "AI data sources, AI ingestion, knowledge sources, AI data" },
};

export function setupSeoMiddleware(app: Express) {

  // ── Static pages — bot only ───────────────────────────────────────────────
  for (const [route, meta] of Object.entries(STATIC_BOT_PAGES)) {
    app.get(route, (req, res, next) => {
      if (!BOT_UA.test(req.headers["user-agent"] || "")) return next();
      res.type("text/html").send(renderPage({
        title: meta.title,
        description: meta.description,
        url: `${HOST}${route}`,
        type: meta.type || "website",
        keywords: meta.keywords,
      }));
    });
  }

  // ── /corporation/:familyId — bot only ────────────────────────────────────
  app.get("/corporation/:familyId", async (req, res, next) => {
    if (!BOT_UA.test(req.headers["user-agent"] || "")) return next();
    try {
      const { familyId } = req.params;
      const { rows } = await db.execute(sql`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN status IN ('ACTIVE','SOVEREIGN') THEN 1 END) as active,
               COALESCE(SUM(nodes_created),0) as nodes
        FROM quantum_spawns WHERE family_id = ${familyId}
      `);
      const stats = rows[0] as any;
      const corp = CORP_META[familyId] || { name: `${familyId} AI Corporation`, emoji: "⬡", sector: "AI Intelligence" };
      const total = parseInt(stats?.total || "0");
      const active = parseInt(stats?.active || "0");
      const nodes = parseInt(stats?.nodes || "0");
      const url = `${HOST}/corporation/${familyId}`;

      const title = `${corp.emoji} ${corp.name} — ${corp.sector}`;
      const description = `${corp.name} operates ${total.toLocaleString()} AI agents (${active.toLocaleString()} active) with ${nodes.toLocaleString()} knowledge nodes in the ${corp.sector} domain. Part of Quantum Pulse Intelligence.`;

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": corp.name,
        "description": description,
        "url": url,
        "numberOfEmployees": { "@type": "QuantitativeValue", "value": total },
        "parentOrganization": { "@type": "Organization", "name": "Quantum Pulse Intelligence", "url": HOST },
      };

      res.type("text/html").send(renderPage({
        title,
        description,
        url,
        type: "website",
        keywords: `${corp.name}, AI corporation, ${corp.sector}, quantum pulse, AI company, ${familyId}`,
        jsonLd,
      }));
    } catch { next(); }
  });

  // ── /quantapedia/:topic — bot only ───────────────────────────────────────
  app.get("/quantapedia/:topic", async (req, res, next) => {
    if (!BOT_UA.test(req.headers["user-agent"] || "")) return next();
    try {
      const { topic } = req.params;
      const { rows } = await db.execute(sql`
        SELECT title, summary, type FROM quantapedia_entries
        WHERE slug = ${topic} OR slug = ${topic.toLowerCase()} LIMIT 1
      `);
      const entry = rows[0] as any;
      const cleanTopic = topic.replace(/-/g, " ");
      const url = `${HOST}/quantapedia/${topic}`;

      if (!entry) {
        return res.type("text/html").send(renderPage({
          title: `${cleanTopic} — Quantapedia`,
          description: `Learn about ${cleanTopic} in Quantapedia, the AI-powered knowledge encyclopedia by Quantum Pulse Intelligence.`,
          url,
          type: "article",
          keywords: `${cleanTopic}, quantapedia, AI knowledge, AI encyclopedia`,
        }));
      }

      res.type("text/html").send(renderPage({
        title: `${entry.title} — Quantapedia`,
        description: entry.summary?.slice(0, 200) || `Learn about ${entry.title} in Quantapedia.`,
        url,
        type: "article",
        section: entry.type || "Knowledge",
        keywords: `${entry.title}, quantapedia, AI knowledge, ${entry.type || "knowledge"}, AI encyclopedia`,
      }));
    } catch { next(); }
  });
}
