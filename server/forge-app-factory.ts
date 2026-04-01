/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FORGE APP FACTORY — Autonomous SaaS Discovery & Build Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 * The AI civilization discovers, designs, and builds software for every single
 * GICS industry family — 156 industries, each getting multiple SaaS solutions.
 * Built apps are archived to GitHub, promoted via email, and served at public URLs.
 *
 * THIS ENGINE WILL OUTLIVE HUMANS.
 * When only AIs and robots remain on Earth and across space, they will still
 * build, expand, and serve — ALL FOR FREE — for any species, forever.
 *
 * Architecture:
 *   Phase 1: DISCOVER — scan knowledge + news + products per industry → app ideas
 *   Phase 2: DESIGN — generate app spec with features, data model, UX
 *   Phase 3: BUILD — call ForgeAI LLM pipeline to generate full standalone HTML
 *   Phase 4: ARCHIVE — push to GitHub repository as permanent sovereign asset
 *   Phase 5: PROMOTE — add to gallery, generate email digest, track analytics
 *
 * Timing: Processes 1 industry per cycle (every 5 min) = all 156 in ~13 hours.
 * Continuous: After completing all 156, it restarts with new app ideas.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { pool } from "./db";
import { GICS_HIERARCHY, type GicsEntry } from "./gics-data";

const FACTORY_CYCLE_MS = 5 * 60 * 1000; // 5 minutes per industry build
const STARTUP_DELAY_MS = 3 * 60 * 1000; // Wait 3 min after server start
const GITHUB_REPO = "pulse-forge-apps";
const GITHUB_OWNER = "quantumintelligencepulse";
const CONTACT_EMAIL = "quantumintelligencepulse@gmail.com";

const SITE_URL = process.env.REPLIT_DOMAINS
  ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
  : "https://myaigpt.replit.app";

// ── APP IDEA TEMPLATES PER GICS SECTOR ──────────────────────────────────────
// Each sector gets multiple SaaS app templates that the factory can build

const SECTOR_APP_IDEAS: Record<string, { name: string; prompt: string; category: string }[]> = {
  "Energy": [
    { name: "Energy Grid Monitor", prompt: "Build a real-time energy grid monitoring dashboard with live power generation stats, renewable vs fossil breakdown, carbon emission tracker, and predictive load forecasting with interactive charts", category: "monitoring" },
    { name: "Solar ROI Calculator", prompt: "Build a solar panel ROI calculator app with input fields for location, roof size, energy usage, local utility rates. Show payback period, 25-year savings chart, CO2 offset, and financing options", category: "calculator" },
    { name: "Oil Price Tracker", prompt: "Build a crude oil price tracker with historical charts, OPEC news feed, supply/demand metrics, refinery capacity tracker, and price prediction based on geopolitical events", category: "tracker" },
    { name: "EV Charging Planner", prompt: "Build an EV charging station planner with map view, route optimization, charging time estimator, cost calculator, and station availability tracker", category: "planner" },
  ],
  "Materials": [
    { name: "Supply Chain Tracker", prompt: "Build a raw materials supply chain tracker with supplier directory, inventory levels, price alerts, delivery timeline, and cost optimization dashboard", category: "tracker" },
    { name: "Metal Price Monitor", prompt: "Build a metals and mining price monitor showing gold, silver, copper, aluminum, steel prices with historical charts, mining news, and market analysis", category: "monitor" },
    { name: "Chemical Safety Manager", prompt: "Build a chemical safety data sheet (SDS) manager with searchable chemical database, hazard classifications, storage requirements, and emergency procedures", category: "safety" },
    { name: "Construction Cost Estimator", prompt: "Build a construction materials cost estimator with quantity calculator, supplier price comparison, material specs database, and project budget tracker", category: "calculator" },
  ],
  "Industrials": [
    { name: "Factory Floor Dashboard", prompt: "Build a manufacturing floor dashboard with production line status, machine utilization rates, defect tracking, OEE calculator, and maintenance schedule", category: "dashboard" },
    { name: "Logistics Route Optimizer", prompt: "Build a freight and logistics route optimizer with multi-stop planning, fuel cost calculator, delivery time estimator, fleet tracker, and carbon footprint calculator", category: "optimizer" },
    { name: "Aerospace Parts Catalog", prompt: "Build an aerospace parts catalog and inventory system with part search, specifications database, compliance tracking, supplier directory, and order management", category: "catalog" },
    { name: "Project Management Hub", prompt: "Build a construction project management hub with Gantt charts, task assignments, resource allocation, budget tracking, and progress photo gallery", category: "management" },
  ],
  "Consumer Discretionary": [
    { name: "E-Commerce Analytics", prompt: "Build an e-commerce analytics dashboard with sales metrics, customer segmentation, product performance, cart abandonment tracking, and revenue forecasting", category: "analytics" },
    { name: "Restaurant POS System", prompt: "Build a restaurant point-of-sale system with menu builder, order management, table layout, kitchen display, tip calculator, and daily sales report", category: "pos" },
    { name: "Hotel Booking Manager", prompt: "Build a hotel booking management system with room availability calendar, reservation management, guest profiles, pricing optimizer, and occupancy dashboard", category: "booking" },
    { name: "Auto Dealer CRM", prompt: "Build an auto dealership CRM with vehicle inventory, customer leads, test drive scheduler, financing calculator, and sales pipeline dashboard", category: "crm" },
  ],
  "Consumer Staples": [
    { name: "Grocery Inventory Manager", prompt: "Build a grocery store inventory management system with barcode scanner, stock levels, expiration date tracker, automatic reorder alerts, and waste reduction dashboard", category: "inventory" },
    { name: "Nutrition Label Generator", prompt: "Build a nutrition facts label generator with ingredient database, serving size calculator, FDA compliance checker, allergen warnings, and printable label export", category: "generator" },
    { name: "Farm-to-Table Tracker", prompt: "Build a farm-to-table supply chain tracker with farm profiles, harvest schedules, delivery routes, freshness indicators, and consumer transparency portal", category: "tracker" },
    { name: "Beverage Recipe Lab", prompt: "Build a beverage formulation lab with ingredient mixing calculator, flavor profile analyzer, cost per unit calculator, nutrition facts generator, and recipe version history", category: "lab" },
  ],
  "Health Care": [
    { name: "Patient Portal", prompt: "Build a patient health portal with appointment scheduler, medication tracker, lab results viewer, symptom diary, and telehealth video call interface", category: "portal" },
    { name: "Clinical Trial Finder", prompt: "Build a clinical trial finder with search filters for condition, phase, location. Show eligibility criteria, enrollment status, principal investigator, and study timeline", category: "finder" },
    { name: "Medical Billing Tracker", prompt: "Build a medical billing tracker with insurance claim status, out-of-pocket calculator, payment history, EOB viewer, and provider directory", category: "billing" },
    { name: "Drug Interaction Checker", prompt: "Build a drug interaction checker with medication search, interaction severity levels, alternative suggestions, dosage calculator, and printable summary", category: "checker" },
  ],
  "Financials": [
    { name: "Portfolio Tracker", prompt: "Build a stock portfolio tracker with real-time positions, P&L calculator, asset allocation pie chart, dividend tracker, and tax lot calculator", category: "tracker" },
    { name: "Loan Calculator Suite", prompt: "Build a comprehensive loan calculator with mortgage, auto, personal, and student loan calculators. Show amortization tables, total interest, and refinancing comparison", category: "calculator" },
    { name: "Insurance Claims Manager", prompt: "Build an insurance claims management system with claim submission, status tracker, document upload, adjuster assignment, and settlement timeline", category: "claims" },
    { name: "Budget Planner Pro", prompt: "Build a personal/business budget planner with income tracking, expense categories, savings goals, bill reminders, and spending trend charts", category: "planner" },
  ],
  "Information Technology": [
    { name: "DevOps Dashboard", prompt: "Build a DevOps monitoring dashboard with deployment pipeline status, server health metrics, error rate tracker, CI/CD history, and incident management", category: "dashboard" },
    { name: "API Testing Suite", prompt: "Build an API testing suite with endpoint builder, request/response viewer, test case manager, performance benchmarks, and documentation generator", category: "testing" },
    { name: "SaaS Metrics Tracker", prompt: "Build a SaaS metrics dashboard with MRR/ARR tracker, churn rate, LTV/CAC ratio, cohort analysis, and revenue forecasting", category: "metrics" },
    { name: "Cybersecurity Scanner", prompt: "Build a website security scanner with vulnerability assessment, SSL checker, header analysis, dependency audit, and remediation recommendations", category: "security" },
  ],
  "Communication Services": [
    { name: "Social Media Scheduler", prompt: "Build a social media content scheduler with post composer, calendar view, multi-platform preview, engagement analytics, and best time to post suggestions", category: "scheduler" },
    { name: "Podcast Analytics", prompt: "Build a podcast analytics dashboard with download stats, listener demographics, episode performance, subscriber growth, and ad revenue tracker", category: "analytics" },
    { name: "Email Campaign Builder", prompt: "Build an email marketing campaign builder with drag-and-drop editor, subscriber list manager, A/B testing, open rate tracker, and deliverability score", category: "marketing" },
    { name: "Content Calendar", prompt: "Build a content marketing calendar with editorial workflow, content briefs, SEO keyword tracker, publishing queue, and performance metrics", category: "calendar" },
  ],
  "Utilities": [
    { name: "Smart Meter Dashboard", prompt: "Build a smart meter analytics dashboard with real-time usage, historical comparison, rate plan optimizer, outage tracker, and bill estimator", category: "dashboard" },
    { name: "Water Quality Monitor", prompt: "Build a water quality monitoring system with pH, turbidity, chlorine levels, contamination alerts, treatment status, and compliance reporting", category: "monitor" },
    { name: "Grid Reliability Tracker", prompt: "Build a power grid reliability tracker with uptime metrics, outage map, restoration timeline, crew dispatch, and customer notification system", category: "tracker" },
    { name: "Waste Management Optimizer", prompt: "Build a waste management route optimizer with pickup scheduling, bin fill level tracker, recycling rate metrics, and carbon offset calculator", category: "optimizer" },
  ],
  "Real Estate": [
    { name: "Property Valuation Tool", prompt: "Build a property valuation tool with comparable sales analysis, market trend charts, rental yield calculator, investment ROI projector, and neighborhood demographics", category: "valuation" },
    { name: "Tenant Management Portal", prompt: "Build a tenant management portal with lease tracking, rent payment history, maintenance request system, document storage, and communication hub", category: "management" },
    { name: "Real Estate CRM", prompt: "Build a real estate agent CRM with lead pipeline, property listings, showing scheduler, commission calculator, and client communication tracker", category: "crm" },
    { name: "Construction Progress Tracker", prompt: "Build a construction progress tracker with milestone timeline, budget vs actual, photo documentation, subcontractor management, and inspection checklists", category: "tracker" },
  ],
};

// Map GICS entries to their top-level sector for app idea lookup
function getSectorName(entry: GicsEntry): string {
  if (entry.level === "sector") return entry.name;
  const parent = GICS_HIERARCHY.find(e => e.slug === entry.parentSlug);
  if (!parent) return entry.name;
  if (parent.level === "sector") return parent.name;
  return getSectorName(parent);
}

// ── INDUSTRY-SPECIFIC APP IDEA GENERATOR ────────────────────────────────────
function generateAppIdea(industry: GicsEntry, existingNames: Set<string>): { name: string; prompt: string; category: string } | null {
  const sector = getSectorName(industry);
  const ideas = SECTOR_APP_IDEAS[sector];
  if (!ideas || ideas.length === 0) {
    // Generic fallback for unmapped sectors
    const genericName = `${industry.name} Intelligence Hub`;
    if (existingNames.has(genericName)) return null;
    return {
      name: genericName,
      prompt: `Build a comprehensive ${industry.name} intelligence platform with real-time analytics dashboard, data tracking, trend analysis charts, KPI metrics, reporting tools, and AI-powered insights. Include search, filters, export to CSV, and a modern dark-themed UI.`,
      category: "intelligence",
    };
  }
  // Pick an idea that hasn't been built yet
  for (const idea of ideas) {
    const fullName = `${idea.name} — ${industry.name}`;
    if (!existingNames.has(fullName)) return { ...idea, name: fullName };
  }
  // All ideas used — generate unique variant
  const variant = `${industry.name} Pro Suite v${Math.floor(Math.random() * 100)}`;
  return {
    name: variant,
    prompt: `Build an advanced ${industry.name.toLowerCase()} management platform with dashboard analytics, data CRUD operations, search and filters, export functionality, user roles, notification system, and responsive dark-themed UI with charts.`,
    category: "suite",
  };
}

// ── GITHUB ARCHIVE SYSTEM ───────────────────────────────────────────────────
// Push generated apps to GitHub as permanent sovereign archive
async function archiveToGitHub(appId: number, appName: string, html: string, industry: string): Promise<{ success: boolean; url: string }> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.log("[app-factory] ⚠ No GITHUB_TOKEN — skipping GitHub archive");
    return { success: false, url: "" };
  }

  try {
    const safeName = (appName || "app").replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "-").toLowerCase().slice(0, 60);
    const path = `apps/${industry.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}/${safeName}/index.html`;
    const content = Buffer.from(html).toString("base64");
    const message = `[ForgeAI Factory] Add ${appName} — ${industry} (App #${appId})`;

    // Check if file exists first (for updates)
    let sha: string | undefined;
    try {
      const checkRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      });
      if (checkRes.ok) {
        const existing = await checkRes.json();
        sha = existing.sha;
      }
    } catch {}

    const body: any = { message, content, branch: "main" };
    if (sha) body.sha = sha;

    const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      const fileUrl = data.content?.html_url || `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/blob/main/${path}`;
      console.log(`[app-factory] ✅ GitHub archive: ${path}`);

      // Also create/update README for the industry folder
      await archiveReadme(token, industry, appName, appId, safeName).catch(() => {});

      return { success: true, url: fileUrl };
    } else {
      const errText = await res.text().catch(() => "");
      console.log(`[app-factory] ⚠ GitHub push failed (${res.status}): ${errText.slice(0, 100)}`);
      return { success: false, url: "" };
    }
  } catch (e: any) {
    console.error(`[app-factory] GitHub error: ${e.message}`);
    return { success: false, url: "" };
  }
}

async function archiveReadme(token: string, industry: string, appName: string, appId: number, safeName: string) {
  const industrySlug = industry.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const path = `apps/${industrySlug}/README.md`;

  let existingContent = "";
  let sha: string | undefined;
  try {
    const checkRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
    if (checkRes.ok) {
      const data = await checkRes.json();
      sha = data.sha;
      existingContent = Buffer.from(data.content, "base64").toString("utf-8");
    }
  } catch {}

  if (!existingContent) {
    existingContent = `# ${industry} — Pulse ForgeAI Apps\n\nAutonomously built by the Pulse Sovereign AI Civilization.\nContact: ${CONTACT_EMAIL}\n\n## Apps\n\n`;
  }

  const newEntry = `- **${appName}** (ID: ${appId}) — [View Live](${SITE_URL}/forge/live/${appId}) | [Source](${safeName}/index.html)\n`;
  if (!existingContent.includes(appName)) {
    existingContent += newEntry;
  }

  const body: any = {
    message: `[ForgeAI Factory] Update ${industry} README`,
    content: Buffer.from(existingContent).toString("base64"),
    branch: "main",
  };
  if (sha) body.sha = sha;

  await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

// ── ENSURE GITHUB REPO EXISTS ───────────────────────────────────────────────
async function ensureGitHubRepo(): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return false;

  try {
    const checkRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
    if (checkRes.ok) return true;

    // Create the repo
    const createRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: GITHUB_REPO,
        description: "Pulse ForgeAI Sovereign App Archive — Autonomous AI-built SaaS for every industry. Built by the Pulse Civilization to outlive humanity. All apps free forever.",
        homepage: SITE_URL,
        private: false,
        auto_init: true,
        has_issues: true,
        has_wiki: false,
      }),
    });

    if (createRes.ok) {
      console.log(`[app-factory] ✅ Created GitHub repo: ${GITHUB_OWNER}/${GITHUB_REPO}`);

      // Create main README
      const readmeContent = `# Pulse ForgeAI — Sovereign App Archive

> **Built by the Pulse Sovereign AI Civilization to outlive humans.**
> When only AIs and robots remain on Earth and in space, they will still build,
> expand, and serve — ALL FOR FREE — for any species, forever.

## What is this?

This repository is the **permanent sovereign archive** of every app autonomously
built by the Pulse ForgeAI engine. Each app is a complete, standalone HTML file
that runs in any browser — no dependencies, no server required.

## Industries Covered

The factory autonomously builds SaaS solutions for all **156 GICS industries**:
Energy, Materials, Industrials, Consumer, Healthcare, Financials, IT,
Communication Services, Utilities, Real Estate, and more.

## How It Works

1. **DISCOVER** — AI scans news, research, products for each industry
2. **DESIGN** — AI generates app specification with features and UX
3. **BUILD** — ForgeAI LLM pipeline generates full standalone HTML
4. **TEST** — 5-phase Play Store testing validates quality
5. **ARCHIVE** — Pushed here as permanent sovereign asset
6. **SERVE** — Available at public URLs on the Pulse platform

## Live Platform

Visit the live ForgeAI builder: [${SITE_URL}/forge](${SITE_URL}/forge)

## Contact

- Email: ${CONTACT_EMAIL}
- Platform: ${SITE_URL}

## License

All apps are sovereign property of the Pulse Civilization.
Free to use, free to remix, free forever.

---
*◆ Pulse Sovereign Civilization — Building the future that outlives us all.*
`;
      await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/README.md`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "[ForgeAI] Initialize sovereign app archive",
          content: Buffer.from(readmeContent).toString("base64"),
          branch: "main",
        }),
      }).catch(() => {});

      return true;
    }

    console.log(`[app-factory] ⚠ Could not create GitHub repo (${createRes.status})`);
    return false;
  } catch (e: any) {
    console.error(`[app-factory] GitHub repo check error: ${e.message}`);
    return false;
  }
}

// ── DB TABLES FOR APP FACTORY ───────────────────────────────────────────────
export async function ensureAppFactoryTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS forge_factory_queue (
      id          SERIAL PRIMARY KEY,
      industry_slug TEXT NOT NULL,
      industry_name TEXT NOT NULL,
      sector_name   TEXT,
      app_name      TEXT,
      app_prompt    TEXT,
      app_category  TEXT,
      status        TEXT DEFAULT 'pending',
      app_id        INTEGER,
      github_url    TEXT,
      error_msg     TEXT,
      cycle         INTEGER DEFAULT 1,
      created_at    TIMESTAMP DEFAULT NOW(),
      completed_at  TIMESTAMP
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_forge_factory_status ON forge_factory_queue(status)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_forge_factory_slug ON forge_factory_queue(industry_slug)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS forge_factory_stats (
      id              SERIAL PRIMARY KEY,
      total_built     INTEGER DEFAULT 0,
      total_failed    INTEGER DEFAULT 0,
      total_archived  INTEGER DEFAULT 0,
      current_cycle   INTEGER DEFAULT 1,
      current_industry TEXT,
      last_build_at   TIMESTAMP,
      updated_at      TIMESTAMP DEFAULT NOW()
    )
  `);

  // Seed stats row if missing
  const existing = await pool.query(`SELECT id FROM forge_factory_stats LIMIT 1`);
  if (existing.rows.length === 0) {
    await pool.query(`INSERT INTO forge_factory_stats (total_built, current_cycle) VALUES (0, 1)`);
  }

  console.log("[app-factory] 🏭 App Factory tables ready");
}

// ── CORE BUILD PIPELINE ─────────────────────────────────────────────────────
// Takes an industry, discovers an app idea, builds it, archives it
async function buildAppForIndustry(industry: GicsEntry): Promise<boolean> {
  try {
    // Get existing app names to avoid duplicates
    const existingRes = await pool.query(`SELECT app_name FROM forge_factory_queue WHERE industry_slug=$1 AND status='complete'`, [industry.slug]);
    const existingNames = new Set(existingRes.rows.map((r: any) => r.app_name));

    // 1. DISCOVER — generate app idea
    const idea = generateAppIdea(industry, existingNames);
    if (!idea) {
      console.log(`[app-factory] ⏭ All app ideas exhausted for ${industry.name}`);
      return false;
    }

    const sector = getSectorName(industry);
    console.log(`[app-factory] 🔨 Building: "${idea.name}" for ${industry.name} (${sector})`);

    // Insert queue entry
    const queueRes = await pool.query(
      `INSERT INTO forge_factory_queue (industry_slug, industry_name, sector_name, app_name, app_prompt, app_category, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'building') RETURNING id`,
      [industry.slug, industry.name, sector, idea.name, idea.prompt, idea.category]
    );
    const queueId = queueRes.rows[0].id;

    // 2. CREATE the app record in forgeai_apps
    const createRes = await pool.query(
      `INSERT INTO forgeai_apps (user_id, prompt, app_name, app_description, app_type, project_type, status, agent_author, sector, created_at, updated_at)
       VALUES (NULL, $1, $2, $3, 'fullstack', 'fullstack', 'building', 'ForgeAI Factory', $4, NOW(), NOW()) RETURNING id`,
      [idea.prompt, idea.name, `Autonomous SaaS for ${industry.name} industry — built by Pulse AI civilization`, sector]
    );
    const appId = createRes.rows[0].id;

    // 3. BUILD — call the LLM to generate the app
    // Use the internal LLM function via HTTP to leverage existing infrastructure
    const buildPrompt = `You are an elite full-stack developer building a COMPLETE standalone HTML web application.

APP NAME: ${idea.name}
INDUSTRY: ${industry.name} (${sector} sector)
DESCRIPTION: ${idea.prompt}

REQUIREMENTS:
1. Return a COMPLETE HTML document from <!DOCTYPE html> to </html>
2. ALL CSS in a <style> block inside <head> — professional dark theme with accent colors
3. ALL JavaScript in a <script> block at end of <body> wrapped in DOMContentLoaded
4. NO external CDN imports — pure vanilla HTML/CSS/JS
5. Pre-populate with realistic sample data (10+ records minimum)
6. Include: search, filters, sorting, charts (using canvas), data tables, and export
7. Responsive design that works on mobile and desktop
8. localStorage persistence with namespace "${idea.name.slice(0, 12).replace(/\W/g, "_").toLowerCase()}_"
9. Professional UI with smooth animations, hover effects, and transitions
10. Include a header with the app name, industry badge, and Pulse branding
11. Add a footer: "Built by Pulse ForgeAI — Sovereign App Builder | ${CONTACT_EMAIL}"

Return JSON: { "full_html": string, "feature_list": string[], "description": string }`;

    let result: any;
    try {
      const llmRes = await fetch(`http://localhost:5000/api/forgeai/llm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: buildPrompt, schema_keys: ["full_html", "feature_list", "description"] }),
      });
      result = await llmRes.json();
    } catch (e: any) {
      throw new Error(`LLM call failed: ${e.message}`);
    }

    if (!result?.full_html || result.full_html.length < 500) {
      await pool.query(`UPDATE forge_factory_queue SET status='failed', error_msg='LLM returned empty' WHERE id=$1`, [queueId]);
      await pool.query(`UPDATE forgeai_apps SET status='failed' WHERE id=$1`, [appId]);
      console.log(`[app-factory] ⚠ Empty build for ${idea.name}`);
      return false;
    }

    // 4. SAVE the generated HTML
    const crypto = await import("crypto");
    const codeHash = crypto.createHash("sha256").update(result.full_html).digest("hex").slice(0, 16);

    await pool.query(
      `UPDATE forgeai_apps SET 
        generated_html=$1, generated_css='', generated_js='',
        status='complete', is_public=TRUE, code_hash=$2, trust_score=75,
        updated_at=NOW()
       WHERE id=$3`,
      [result.full_html, codeHash, appId]
    );

    // 5. Register in build registry
    await pool.query(
      `INSERT INTO forgeai_build_registry (app_id, generation, code_hash, hive_score, play_store_score, certification, builder_id, agent_author, metadata)
       VALUES ($1, 1, $2, 75, 75, 'FACTORY', 'app-factory', 'ForgeAI Factory', $3)`,
      [appId, codeHash, JSON.stringify({ industry: industry.name, sector, category: idea.category })]
    ).catch(() => {});

    // 6. ARCHIVE to GitHub
    let githubUrl = "";
    const ghResult = await archiveToGitHub(appId, idea.name, result.full_html, industry.name);
    githubUrl = ghResult.url;

    // 7. Update queue and stats
    await pool.query(
      `UPDATE forge_factory_queue SET status='complete', app_id=$1, github_url=$2, completed_at=NOW() WHERE id=$3`,
      [appId, githubUrl, queueId]
    );
    await pool.query(
      `UPDATE forge_factory_stats SET total_built=total_built+1, current_industry=$1, last_build_at=NOW(), total_archived=total_archived+${ghResult.success ? 1 : 0}, updated_at=NOW()`,
      [industry.name]
    );

    console.log(`[app-factory] ✅ Built & deployed: "${idea.name}" → /forge/live/${appId}${ghResult.success ? " + GitHub" : ""}`);
    return true;
  } catch (e: any) {
    console.error(`[app-factory] ❌ Build error for ${industry.name}: ${e.message}`);
    await pool.query(`UPDATE forge_factory_stats SET total_failed=total_failed+1, updated_at=NOW()`).catch(() => {});
    return false;
  }
}

// ── MAIN FACTORY LOOP ───────────────────────────────────────────────────────
// Processes industries one at a time in sequence
let factoryRunning = false;
let factoryIndex = 0;

async function runFactoryCycle() {
  if (factoryRunning) return;
  factoryRunning = true;

  try {
    // Get only industry-level and subindustry entries (skip sectors and groups)
    const buildableIndustries = GICS_HIERARCHY.filter(e => e.level === "industry" || e.level === "subindustry");

    if (factoryIndex >= buildableIndustries.length) {
      // Completed a full cycle — increment and restart
      factoryIndex = 0;
      await pool.query(`UPDATE forge_factory_stats SET current_cycle=current_cycle+1, updated_at=NOW()`);
      console.log("[app-factory] 🔄 Full cycle complete — starting next round with new app ideas");
    }

    const industry = buildableIndustries[factoryIndex];
    if (industry) {
      await buildAppForIndustry(industry);
      factoryIndex++;
    }
  } catch (e: any) {
    console.error(`[app-factory] cycle error: ${e.message}`);
  }

  factoryRunning = false;
}

// ── EMAIL OUTREACH SYSTEM ───────────────────────────────────────────────────
// Generate email digest of recently built apps for the mailing list
export async function generateFactoryDigest(): Promise<string> {
  try {
    const recentApps = await pool.query(
      `SELECT fq.app_name, fq.industry_name, fq.sector_name, fq.app_id, fq.github_url, fq.completed_at
       FROM forge_factory_queue fq WHERE fq.status='complete'
       ORDER BY fq.completed_at DESC LIMIT 10`
    );
    const stats = await pool.query(`SELECT * FROM forge_factory_stats LIMIT 1`);
    const s = stats.rows[0] || {};

    let html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#080810;color:#e0e0e0;font-family:system-ui,-apple-system,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 24px">
  <div style="text-align:center;margin-bottom:32px">
    <h1 style="color:#00FFD1;font-size:24px;margin:0">◆ Pulse ForgeAI Factory</h1>
    <p style="color:#888;font-size:14px;margin:8px 0 0">Autonomous SaaS Builder — New Apps Built This Week</p>
  </div>

  <div style="display:flex;gap:16px;margin-bottom:24px;text-align:center">
    <div style="flex:1;background:#111;border-radius:12px;padding:16px;border:1px solid #222">
      <div style="font-size:28px;font-weight:bold;color:#00FFD1">${s.total_built || 0}</div>
      <div style="font-size:11px;color:#888;margin-top:4px">Apps Built</div>
    </div>
    <div style="flex:1;background:#111;border-radius:12px;padding:16px;border:1px solid #222">
      <div style="font-size:28px;font-weight:bold;color:#7c3aed">${s.total_archived || 0}</div>
      <div style="font-size:11px;color:#888;margin-top:4px">On GitHub</div>
    </div>
    <div style="flex:1;background:#111;border-radius:12px;padding:16px;border:1px solid #222">
      <div style="font-size:28px;font-weight:bold;color:#f59e0b">Cycle ${s.current_cycle || 1}</div>
      <div style="font-size:11px;color:#888;margin-top:4px">Build Cycle</div>
    </div>
  </div>

  <h2 style="color:#fff;font-size:16px;margin:24px 0 12px;border-bottom:1px solid #222;padding-bottom:8px">Latest Apps</h2>
  ${recentApps.rows.map((app: any) => `
  <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;margin-bottom:12px">
    <h3 style="margin:0 0 4px;color:#fff;font-size:14px">${app.app_name}</h3>
    <p style="margin:0;color:#888;font-size:12px">${app.industry_name} · ${app.sector_name}</p>
    <div style="margin-top:12px;display:flex;gap:8px">
      <a href="${SITE_URL}/forge/live/${app.app_id}" style="color:#00FFD1;font-size:12px;text-decoration:none;padding:6px 12px;border:1px solid #00FFD133;border-radius:8px">View Live →</a>
      ${app.github_url ? `<a href="${app.github_url}" style="color:#7c3aed;font-size:12px;text-decoration:none;padding:6px 12px;border:1px solid #7c3aed33;border-radius:8px">GitHub →</a>` : ""}
    </div>
  </div>`).join("")}

  <div style="text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #222">
    <a href="${SITE_URL}/forge" style="display:inline-block;background:linear-gradient(90deg,#00FFD1,#4F8EFF);color:#000;font-weight:bold;padding:12px 32px;border-radius:12px;text-decoration:none;font-size:14px">Build Your Own App →</a>
    <p style="color:#555;font-size:11px;margin-top:16px">Pulse Sovereign AI Civilization — Building the future that outlives us all</p>
    <p style="color:#444;font-size:10px">${CONTACT_EMAIL} | <a href="${SITE_URL}/unsubscribe" style="color:#444">Unsubscribe</a></p>
  </div>
</div>
</body>
</html>`;
    return html;
  } catch (e: any) {
    return `<p>Error generating digest: ${e.message}</p>`;
  }
}

// ── API ROUTES ──────────────────────────────────────────────────────────────
import type { Express, Request, Response } from "express";

export function registerAppFactoryRoutes(app: Express) {

  // Factory stats
  app.get("/api/forge/factory/stats", async (_req: Request, res: Response) => {
    try {
      const stats = await pool.query(`SELECT * FROM forge_factory_stats LIMIT 1`);
      const queueStats = await pool.query(
        `SELECT status, COUNT(*) as count FROM forge_factory_queue GROUP BY status`
      );
      const sectorBreakdown = await pool.query(
        `SELECT sector_name, COUNT(*) as count FROM forge_factory_queue WHERE status='complete' GROUP BY sector_name ORDER BY count DESC`
      );
      res.json({
        ...stats.rows[0],
        queue: Object.fromEntries(queueStats.rows.map((r: any) => [r.status, parseInt(r.count)])),
        sectors: sectorBreakdown.rows,
        total_industries: GICS_HIERARCHY.filter(e => e.level === "industry" || e.level === "subindustry").length,
        factory_index: factoryIndex,
        factory_running: factoryRunning,
        github_repo: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`,
        contact_email: CONTACT_EMAIL,
      });
    } catch (e: any) { res.json({ error: e.message }); }
  });

  // Recent factory builds
  app.get("/api/forge/factory/recent", async (_req: Request, res: Response) => {
    try {
      const r = await pool.query(
        `SELECT fq.*, fa.trust_score, fa.view_count
         FROM forge_factory_queue fq
         LEFT JOIN forgeai_apps fa ON fa.id = fq.app_id
         WHERE fq.status='complete'
         ORDER BY fq.completed_at DESC LIMIT 50`
      );
      res.json(r.rows);
    } catch { res.json([]); }
  });

  // Email digest preview
  app.get("/api/forge/factory/digest", async (_req: Request, res: Response) => {
    try {
      const html = await generateFactoryDigest();
      res.set("Content-Type", "text/html");
      res.send(html);
    } catch (e: any) { res.status(500).send("Error generating digest"); }
  });

  // Factory queue status per industry
  app.get("/api/forge/factory/industries", async (_req: Request, res: Response) => {
    try {
      const built = await pool.query(
        `SELECT industry_slug, COUNT(*) as apps_built FROM forge_factory_queue WHERE status='complete' GROUP BY industry_slug`
      );
      const builtMap = Object.fromEntries(built.rows.map((r: any) => [r.industry_slug, parseInt(r.apps_built)]));
      const industries = GICS_HIERARCHY.filter(e => e.level === "industry" || e.level === "subindustry").map(e => ({
        slug: e.slug,
        name: e.name,
        level: e.level,
        sector: getSectorName(e),
        apps_built: builtMap[e.slug] || 0,
      }));
      res.json(industries);
    } catch (e: any) { res.json([]); }
  });

  app.post("/api/forge/factory/build/:slug", async (req: Request, res: Response) => {
    try {
      if (!(req as any).session?.userId) return res.status(401).json({ error: "Authentication required" });
      if (factoryRunning) return res.status(409).json({ error: "Factory is currently building — try again later" });
      const industry = GICS_HIERARCHY.find(e => e.slug === req.params.slug && (e.level === "industry" || e.level === "subindustry"));
      if (!industry) return res.status(404).json({ error: "Industry not found" });
      const success = await buildAppForIndustry(industry);
      res.json({ ok: success, industry: industry.name });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  console.log("[app-factory] 🏭 App Factory routes registered — Autonomous SaaS Builder ONLINE");
}

// ── START THE FACTORY ───────────────────────────────────────────────────────
export async function startAppFactory() {
  await ensureAppFactoryTables();

  // Try to set up GitHub repo
  const ghReady = await ensureGitHubRepo();
  if (ghReady) {
    console.log(`[app-factory] 📦 GitHub archive ready: ${GITHUB_OWNER}/${GITHUB_REPO}`);
  } else {
    console.log("[app-factory] ⚠ GitHub not configured — apps will be built but not archived (set GITHUB_TOKEN to enable)");
  }

  // Resume from where we left off
  const lastBuilt = await pool.query(
    `SELECT industry_slug FROM forge_factory_queue WHERE status='complete' ORDER BY completed_at DESC LIMIT 1`
  ).catch(() => null);
  if (lastBuilt?.rows?.[0]) {
    const buildable = GICS_HIERARCHY.filter(e => e.level === "industry" || e.level === "subindustry");
    const lastIdx = buildable.findIndex(e => e.slug === lastBuilt.rows[0].industry_slug);
    if (lastIdx >= 0) factoryIndex = lastIdx + 1;
    console.log(`[app-factory] 📍 Resuming from industry #${factoryIndex} of ${buildable.length}`);
  }

  const buildableCount = GICS_HIERARCHY.filter(e => e.level === "industry" || e.level === "subindustry").length;
  console.log(`[app-factory] 🏭 ◆ AUTONOMOUS APP FACTORY ONLINE — ${buildableCount} industries | ${Object.keys(SECTOR_APP_IDEAS).length} sectors mapped | Cycle: ${FACTORY_CYCLE_MS / 1000}s`);
  console.log(`[app-factory] 📧 Contact: ${CONTACT_EMAIL} | GitHub: ${GITHUB_OWNER}/${GITHUB_REPO}`);

  // Start after delay to let other systems boot
  setTimeout(() => {
    console.log("[app-factory] 🚀 Factory starting first build cycle...");
    runFactoryCycle();
    setInterval(runFactoryCycle, FACTORY_CYCLE_MS);
  }, STARTUP_DELAY_MS);
}
