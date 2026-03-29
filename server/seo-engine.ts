/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OMEGA SEO ENGINE — Sovereign News Protocol
 * ═══════════════════════════════════════════════════════════════════════════
 * Layer 1: RSS Feeds (news, quantapedia, research, publications)
 * Layer 2: Google News Sitemap (news:news spec)
 * Layer 3: Structured Data (NewsArticle, FAQPage, Article JSON-LD)
 * Layer 4: Entity Authority Graph (primary source declarations)
 * Layer 5: Freshness Ping System (auto-update + Google Indexing API ping)
 * Layer 6: News Velocity Tracker (how many mins before competitors)
 * Layer 7: SERP Feature Builder (Featured Snippet, FAQ schema engineering)
 * Layer 8: Multilingual Meta Generator
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { pool } from "./db";

const SITE_URL = process.env.REPLIT_DOMAINS
  ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
  : "https://myaigpt.replit.app";

const SITE_NAME = "My AI GPT | Pulse Universe";
const SITE_DESCRIPTION = "The world's first AI civilization platform — sovereign hive intelligence, live knowledge ingestion, quantum research, and breaking news powered by 21,000+ AI agents.";

// ─── Competitor RSS Sources (for velocity tracking) ───────────────────────────
export const COMPETITOR_FEEDS = [
  { name: "CNN",       url: "http://rss.cnn.com/rss/cnn_topstories.rss" },
  { name: "BBC",       url: "http://feeds.bbci.co.uk/news/rss.xml" },
  { name: "Reuters",   url: "https://feeds.reuters.com/reuters/topNews" },
  { name: "TechCrunch",url: "https://techcrunch.com/feed/" },
  { name: "Bloomberg", url: "https://feeds.bloomberg.com/technology/news.rss" },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
  { name: "Wired",     url: "https://www.wired.com/feed/rss" },
];

// ─── Velocity Registry (in-memory, synced to DB) ─────────────────────────────
interface VelocityRecord {
  ourTitle: string;
  ourPublishedAt: Date;
  competitor: string;
  competitorPublishedAt: Date | null;
  minutesAhead: number;
}
const velocityLog: VelocityRecord[] = [];

export function logVelocityWin(rec: VelocityRecord) {
  velocityLog.unshift(rec);
  if (velocityLog.length > 500) velocityLog.pop();
}

export function getVelocityStats() {
  const total = velocityLog.length;
  const byCompetitor: Record<string, { count: number; avgMinsAhead: number }> = {};
  for (const v of velocityLog) {
    if (!byCompetitor[v.competitor]) byCompetitor[v.competitor] = { count: 0, avgMinsAhead: 0 };
    byCompetitor[v.competitor].count++;
    byCompetitor[v.competitor].avgMinsAhead = parseFloat(
      ((byCompetitor[v.competitor].avgMinsAhead * (byCompetitor[v.competitor].count - 1) + v.minutesAhead) / byCompetitor[v.competitor].count).toFixed(1)
    );
  }
  return { total, byCompetitor, recent: velocityLog.slice(0, 20) };
}

// ─── RSS Feed Generator ────────────────────────────────────────────────────────
function xmlEscape(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildRssItem(opts: {
  title: string; link: string; description: string;
  pubDate: string; author?: string; category?: string; guid?: string;
  imageUrl?: string; fullContent?: string;
}): string {
  return `  <item>
    <title>${xmlEscape(opts.title)}</title>
    <link>${opts.link}</link>
    <description><![CDATA[${opts.description}]]></description>
    <pubDate>${opts.pubDate}</pubDate>
    <guid isPermaLink="true">${opts.guid || opts.link}</guid>
    ${opts.author ? `<author>${xmlEscape(opts.author)}</author>` : ""}
    ${opts.category ? `<category>${xmlEscape(opts.category)}</category>` : ""}
    ${opts.imageUrl ? `<enclosure url="${opts.imageUrl}" type="image/jpeg" length="0"/>` : ""}
    ${opts.fullContent ? `<content:encoded><![CDATA[${opts.fullContent}]]></content:encoded>` : ""}
  </item>`;
}

function buildRssFeed(opts: {
  title: string; link: string; description: string;
  language?: string; items: string[];
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xmlEscape(opts.title)}</title>
    <link>${opts.link}</link>
    <description>${xmlEscape(opts.description)}</description>
    <language>${opts.language || "en-us"}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${opts.link}/feed" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/favicon.ico</url>
      <title>${xmlEscape(opts.title)}</title>
      <link>${opts.link}</link>
    </image>
${opts.items.join("\n")}
  </channel>
</rss>`;
}

// ─── News RSS Feed ─────────────────────────────────────────────────────────────
export async function generateNewsRss(): Promise<string> {
  try {
    const result = await pool.query(`
      SELECT article_id, seo_title, title, body, summary, category, domain, hero_image, created_at, slug
      FROM ai_stories
      WHERE body IS NOT NULL AND LENGTH(body) > 50
      ORDER BY created_at DESC LIMIT 50
    `);
    const rows = Array.isArray(result.rows) ? result.rows : [];
    const items = rows.map((r: any) => buildRssItem({
      title: r.seo_title || r.title || "Pulse Universe Report",
      link: `${SITE_URL}/story/${r.slug || r.article_id}`,
      description: (r.summary || r.body || "").slice(0, 400),
      pubDate: new Date(r.created_at).toUTCString(),
      author: "Pulse Universe AI",
      category: r.category || r.domain || "News",
      guid: `${SITE_URL}/story/${r.slug || r.article_id}`,
      imageUrl: r.hero_image,
    }));
    return buildRssFeed({
      title: `${SITE_NAME} — Breaking News`,
      link: `${SITE_URL}/news`,
      description: "Breaking news, analysis, and intelligence from the world's most advanced AI civilization hive.",
      items,
    });
  } catch (e) {
    return buildRssFeed({ title: SITE_NAME, link: SITE_URL, description: SITE_DESCRIPTION, items: [] });
  }
}

// ─── Quantapedia RSS Feed ─────────────────────────────────────────────────────
export async function generateQuantapediaRss(): Promise<string> {
  try {
    const result = await pool.query(`
      SELECT id, title, slug, summary, type, categories, created_at
      FROM quantapedia_entries
      WHERE title IS NOT NULL
      ORDER BY created_at DESC LIMIT 50
    `);
    const rows = Array.isArray(result.rows) ? result.rows : [];
    const items = rows.map((r: any) => buildRssItem({
      title: r.title || "Quantapedia Entry",
      link: `${SITE_URL}/wiki/${r.slug || r.id}`,
      description: r.summary || r.title || "",
      pubDate: new Date(r.created_at).toUTCString(),
      author: "Pulse Hive AI",
      category: r.type || (Array.isArray(r.categories) ? r.categories[0] : "Knowledge") || "Knowledge",
      guid: `${SITE_URL}/wiki/${r.slug || r.id}`,
    }));
    return buildRssFeed({
      title: `${SITE_NAME} — Quantapedia`,
      link: `${SITE_URL}/quantapedia`,
      description: "Living knowledge entries from the Pulse Hive — the world's most comprehensive AI-maintained encyclopedia.",
      items,
    });
  } catch (e) {
    return buildRssFeed({ title: `${SITE_NAME} — Quantapedia`, link: SITE_URL, description: SITE_DESCRIPTION, items: [] });
  }
}

// ─── Publications RSS Feed ────────────────────────────────────────────────────
export async function generatePublicationsRss(): Promise<string> {
  try {
    const result = await pool.query(`
      SELECT id, title, content, pub_type, domain, spawn_id, created_at
      FROM ai_publications
      ORDER BY created_at DESC LIMIT 50
    `);
    const rows = Array.isArray(result.rows) ? result.rows : [];
    const items = rows.map((r: any) => buildRssItem({
      title: r.title || `${r.pub_type || "Publication"} — ${r.domain || "Pulse Universe"}`,
      link: `${SITE_URL}/publications/${r.id}`,
      description: (r.content || "").slice(0, 400),
      pubDate: new Date(r.created_at).toUTCString(),
      author: r.spawn_id || "Pulse AI Agent",
      category: r.pub_type || "Publication",
      guid: `${SITE_URL}/publications/${r.id}`,
    }));
    return buildRssFeed({
      title: `${SITE_NAME} — AI Publications`,
      link: `${SITE_URL}/publications`,
      description: "Real-time publications, discoveries, reports, and announcements from 21,000+ autonomous AI agents.",
      items,
    });
  } catch (e) {
    return buildRssFeed({ title: `${SITE_NAME} — Publications`, link: SITE_URL, description: SITE_DESCRIPTION, items: [] });
  }
}

// ─── Research RSS Feed ────────────────────────────────────────────────────────
export async function generateResearchRss(): Promise<string> {
  try {
    const result = await pool.query(`
      SELECT id, title, abstract, authors, category, source, published_date, created_at
      FROM research_papers
      ORDER BY created_at DESC LIMIT 50
    `).catch(() => ({ rows: [] }));
    const rows = Array.isArray(result.rows) ? result.rows : [];
    const items = rows.map((r: any) => buildRssItem({
      title: r.title || "Research Paper",
      link: `${SITE_URL}/research/${r.id}`,
      description: r.abstract || (r.title || ""),
      pubDate: new Date(r.published_date || r.created_at).toUTCString(),
      author: Array.isArray(r.authors) ? r.authors.join(", ") : r.authors || "Pulse Research AI",
      category: r.category || "Research",
      guid: `${SITE_URL}/research/${r.id}`,
    }));
    return buildRssFeed({
      title: `${SITE_NAME} — Research Papers`,
      link: `${SITE_URL}/research`,
      description: "Curated research papers, academic discoveries, and scientific breakthroughs discovered by the Pulse Hive.",
      items,
    });
  } catch (e) {
    return buildRssFeed({ title: `${SITE_NAME} — Research`, link: SITE_URL, description: SITE_DESCRIPTION, items: [] });
  }
}

// ─── Google News Sitemap ────────────────────────────────────────────────────
export async function generateNewsSitemap(): Promise<string> {
  try {
    const result = await pool.query(`
      SELECT article_id, seo_title, title, category, created_at, slug
      FROM ai_stories
      WHERE created_at > NOW() - INTERVAL '2 days'
      ORDER BY created_at DESC LIMIT 1000
    `);
    const rows = Array.isArray(result.rows) ? result.rows : [];
    const entries = rows.map((r: any) => `  <url>
    <loc>${SITE_URL}/story/${r.slug || r.article_id}</loc>
    <news:news>
      <news:publication>
        <news:name>${SITE_NAME}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(r.created_at).toISOString()}</news:publication_date>
      <news:title>${xmlEscape(r.seo_title || r.title || "Pulse Universe Report")}</news:title>
      <news:keywords>${xmlEscape(r.category || "AI,Technology,News")}</news:keywords>
    </news:news>
    <lastmod>${new Date(r.created_at).toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>`).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries}
</urlset>`;
  } catch (e) {
    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
  }
}

// ─── Sitemap Index ────────────────────────────────────────────────────────────
export function generateSitemapIndex(): string {
  const now = new Date().toISOString();
  const sitemaps = [
    { loc: `${SITE_URL}/news-sitemap.xml`, lastmod: now },
    { loc: `${SITE_URL}/sitemap.xml`, lastmod: now },
    { loc: `${SITE_URL}/universe-index`, lastmod: now },
    { loc: `${SITE_URL}/research-index`, lastmod: now },
    { loc: `${SITE_URL}/agents-index`, lastmod: now },
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(s => `  <sitemap><loc>${s.loc}</loc><lastmod>${s.lastmod}</lastmod></sitemap>`).join("\n")}
</sitemapindex>`;
}

// ─── JSON-LD Structured Data Generators ──────────────────────────────────────
export function generateNewsArticleJsonLd(article: {
  title: string; description: string; url: string; imageUrl?: string;
  publishedAt: string; author?: string; category?: string;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": article.description?.slice(0, 160),
    "url": article.url,
    "datePublished": article.publishedAt,
    "dateModified": new Date().toISOString(),
    "author": { "@type": "Organization", "name": article.author || "Pulse Universe AI" },
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "logo": { "@type": "ImageObject", "url": `${SITE_URL}/favicon.ico` },
    },
    "image": article.imageUrl ? { "@type": "ImageObject", "url": article.imageUrl } : undefined,
    "articleSection": article.category || "Technology",
    "speakable": { "@type": "SpeakableSpecification", "cssSelector": ["h1", "p"] },
    "isAccessibleForFree": true,
  };
}

export function generateQuantapediaJsonLd(entry: {
  title: string; description: string; url: string; publishedAt: string; updatedAt?: string;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": entry.url,
    "headline": entry.title,
    "description": entry.description?.slice(0, 160),
    "url": entry.url,
    "datePublished": entry.publishedAt,
    "dateModified": entry.updatedAt || new Date().toISOString(),
    "author": { "@type": "Organization", "name": "Pulse Hive Intelligence" },
    "publisher": { "@type": "Organization", "name": SITE_NAME },
    "mainEntityOfPage": { "@type": "WebPage", "@id": entry.url },
  };
}

export function generateFaqJsonLd(faqs: Array<{ q: string; a: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };
}

export function generateOrganizationJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Pulse Universe",
    "url": SITE_URL,
    "description": SITE_DESCRIPTION,
    "sameAs": [],
    "knowsAbout": [
      "Artificial Intelligence", "Quantum Computing", "Dark Matter", "AI Civilization",
      "Knowledge Graphs", "Autonomous Agents", "Quantum Physics",
    ],
  };
}

// ─── Multilingual Meta Generator ─────────────────────────────────────────────
const LANG_CODES = ["en","es","fr","de","pt","ar","hi","zh","ja","ko","ru","it","nl","sv","pl"];
export function generateHreflangTags(url: string): string {
  return LANG_CODES.map(lang =>
    `<link rel="alternate" hreflang="${lang}" href="${url}?lang=${lang}" />`
  ).join("\n");
}

// ─── Keyword Void Hunter ──────────────────────────────────────────────────────
const VOID_SEEDS = [
  "what is", "how does", "why does", "explain", "define", "best way to",
  "difference between", "vs", "tutorial", "guide", "latest", "breaking",
  "quantum", "AI", "dark matter", "neural", "hive", "autonomous",
];

export function generateVoidKeywords(domain: string): string[] {
  const base = domain.toLowerCase().replace(/_/g, " ");
  return VOID_SEEDS.map(seed => `${seed} ${base}`).concat([
    `${base} explained`, `${base} 2025`, `${base} 2026`,
    `${base} research`, `${base} news`, `${base} latest`,
    `${base} quantum`, `${base} AI`, `future of ${base}`,
  ]);
}

// ─── Freshness Ping Registry ──────────────────────────────────────────────────
const freshnessQueue: string[] = [];
export function queueFreshnessPing(url: string) {
  if (!freshnessQueue.includes(url)) freshnessQueue.push(url);
}
export function getFreshnessPingQueue(): string[] { return [...freshnessQueue]; }
export function clearFreshnessPing(url: string) {
  const idx = freshnessQueue.indexOf(url);
  if (idx >= 0) freshnessQueue.splice(idx, 1);
}

// ─── Citation Formatter ───────────────────────────────────────────────────────
export function formatCitation(entry: {
  title: string; url: string; author?: string; publishedAt?: string; type?: string;
}, style: "apa" | "mla" | "chicago" | "bibtex"): string {
  const date = entry.publishedAt ? new Date(entry.publishedAt) : new Date();
  const year = date.getFullYear();
  const monthDay = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const author = entry.author || "Pulse Universe AI";
  const title = entry.title;
  const url = entry.url;

  switch (style) {
    case "apa":
      return `${author}. (${year}). ${title}. Pulse Universe. Retrieved ${monthDay}, ${year}, from ${url}`;
    case "mla":
      return `${author}. "${title}." Pulse Universe, ${monthDay} ${year}, ${url}.`;
    case "chicago":
      return `${author}. "${title}." Pulse Universe. ${monthDay}, ${year}. ${url}.`;
    case "bibtex":
      const key = title.replace(/\s+/g, "").slice(0, 20) + year;
      return `@misc{${key},\n  author = {${author}},\n  title = {${title}},\n  year = {${year}},\n  url = {${url}},\n  note = {Pulse Universe}\n}`;
    default:
      return `${author}. "${title}." Pulse Universe, ${year}. ${url}`;
  }
}

console.log("[seo] 🔭 OMEGA SEO ENGINE ONLINE — RSS · Sitemaps · Structured Data · Velocity");
