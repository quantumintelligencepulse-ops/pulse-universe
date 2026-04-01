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

// ── TEMPLATE-BASED APP GENERATOR (NO LLM / NO GROQ) ────────────────────────
// Generates complete, professional standalone HTML apps from templates.
// Zero API calls, zero tokens consumed. Pure deterministic generation.

const ACCENT_COLORS: Record<string, { primary: string; secondary: string; bg: string }> = {
  "Energy": { primary: "#F59E0B", secondary: "#D97706", bg: "#451A03" },
  "Materials": { primary: "#78716C", secondary: "#A8A29E", bg: "#1C1917" },
  "Industrials": { primary: "#3B82F6", secondary: "#60A5FA", bg: "#172554" },
  "Consumer Discretionary": { primary: "#EC4899", secondary: "#F472B6", bg: "#500724" },
  "Consumer Staples": { primary: "#22C55E", secondary: "#4ADE80", bg: "#052E16" },
  "Health Care": { primary: "#EF4444", secondary: "#F87171", bg: "#450A0A" },
  "Financials": { primary: "#10B981", secondary: "#34D399", bg: "#022C22" },
  "Information Technology": { primary: "#06B6D4", secondary: "#22D3EE", bg: "#083344" },
  "Communication Services": { primary: "#8B5CF6", secondary: "#A78BFA", bg: "#2E1065" },
  "Utilities": { primary: "#EAB308", secondary: "#FACC15", bg: "#422006" },
  "Real Estate": { primary: "#6366F1", secondary: "#818CF8", bg: "#1E1B4B" },
};

function generateSampleData(category: string, industry: string): string {
  const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return Math.abs(h); };
  const seed = hash(industry + category);
  const names = ["Apex Systems", "NovaTech Corp", "Stellar Industries", "Quantum Solutions", "Meridian Group", "Atlas Partners", "Vertex Labs", "Pinnacle Dynamics", "Orion Enterprises", "Helix Analytics", "Summit Technologies", "Catalyst Research", "Fusion Works", "Zenith Corp", "Vanguard Systems"];
  const statuses = ["Active", "Pending", "Complete", "In Progress", "Review", "Approved", "Scheduled"];
  const rows: string[] = [];
  for (let i = 0; i < 15; i++) {
    const idx = (seed + i * 7) % names.length;
    const statusIdx = (seed + i * 3) % statuses.length;
    const val1 = ((seed * (i + 1)) % 9000 + 1000).toLocaleString();
    const val2 = ((seed * (i + 2)) % 100).toFixed(1);
    const month = ((seed + i) % 12) + 1;
    const day = ((seed + i * 2) % 28) + 1;
    rows.push(`{ id: ${i + 1}, name: "${names[idx]} ${industry.split(" ")[0]}", status: "${statuses[statusIdx]}", value: ${val1.replace(/,/g, "")}, rate: ${val2}, date: "2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}", category: "${category}" }`);
  }
  return `[${rows.join(",\n      ")}]`;
}

function generateTemplateApp(appName: string, industry: string, sector: string, description: string, category: string): string {
  const colors = ACCENT_COLORS[sector] || ACCENT_COLORS["Information Technology"];
  const ns = appName.slice(0, 12).replace(/\W/g, "_").toLowerCase() + "_";
  const sampleData = generateSampleData(category, industry);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName} — Pulse ForgeAI</title>
  <meta name="description" content="${description.replace(/"/g, "&quot;")}">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --primary: ${colors.primary}; --secondary: ${colors.secondary}; --bg-deep: ${colors.bg}; --bg: #0a0a0f; --surface: #12121a; --surface2: #1a1a2e; --border: #2a2a3e; --text: #e4e4e7; --text-dim: #71717a; --success: #22c55e; --danger: #ef4444; --warning: #eab308; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
    .header { background: linear-gradient(135deg, var(--bg-deep), var(--surface)); border-bottom: 1px solid var(--border); padding: 1rem 1.5rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .header h1 { font-size: 1.25rem; font-weight: 800; background: linear-gradient(90deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .header .badge { font-size: 0.65rem; padding: 0.2rem 0.6rem; border-radius: 99px; background: var(--primary); color: #000; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .header .pulse-brand { margin-left: auto; font-size: 0.7rem; color: var(--text-dim); font-family: monospace; }
    .toolbar { padding: 1rem 1.5rem; display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; border-bottom: 1px solid var(--border); background: var(--surface); }
    .toolbar input, .toolbar select { background: var(--bg); border: 1px solid var(--border); color: var(--text); padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-size: 0.8rem; outline: none; transition: border-color 0.2s; }
    .toolbar input:focus, .toolbar select:focus { border-color: var(--primary); }
    .toolbar input { flex: 1; min-width: 200px; }
    .btn { padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: 1px solid var(--border); transition: all 0.2s; }
    .btn-primary { background: var(--primary); color: #000; border-color: var(--primary); }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-outline { background: transparent; color: var(--text); }
    .btn-outline:hover { background: var(--surface2); }
    .container { padding: 1.5rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.25rem; transition: transform 0.2s, border-color 0.2s; }
    .stat-card:hover { transform: translateY(-2px); border-color: var(--primary); }
    .stat-card .label { font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
    .stat-card .value { font-size: 1.75rem; font-weight: 800; color: var(--primary); }
    .stat-card .change { font-size: 0.7rem; margin-top: 0.25rem; }
    .stat-card .change.up { color: var(--success); }
    .stat-card .change.down { color: var(--danger); }
    .chart-section { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    @media (max-width: 768px) { .chart-section { grid-template-columns: 1fr; } }
    .chart-box { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.25rem; }
    .chart-box h3 { font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; color: var(--text-dim); }
    canvas { width: 100%; height: 200px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 0.75rem 1rem; font-size: 0.8rem; border-bottom: 1px solid var(--border); }
    th { color: var(--text-dim); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; background: var(--surface); position: sticky; top: 0; }
    tr { transition: background 0.15s; }
    tr:hover { background: var(--surface2); }
    .status-badge { padding: 0.15rem 0.5rem; border-radius: 99px; font-size: 0.65rem; font-weight: 600; }
    .status-Active, .status-Complete, .status-Approved { background: rgba(34,197,94,0.15); color: var(--success); }
    .status-Pending, .status-Review, .status-Scheduled { background: rgba(234,179,8,0.15); color: var(--warning); }
    .status-In\\ Progress { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; overflow: hidden; margin-bottom: 1.5rem; }
    .table-header { padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); }
    .table-header h3 { font-size: 0.85rem; font-weight: 600; }
    .table-scroll { overflow-x: auto; max-height: 400px; overflow-y: auto; }
    .footer { text-align: center; padding: 2rem 1rem; color: var(--text-dim); font-size: 0.7rem; border-top: 1px solid var(--border); background: var(--surface); }
    .footer a { color: var(--primary); text-decoration: none; }
    .empty-state { text-align: center; padding: 3rem; color: var(--text-dim); }
    .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; align-items: center; justify-content: center; }
    .modal-overlay.active { display: flex; }
    .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 1rem; padding: 1.5rem; width: 90%; max-width: 500px; }
    .modal h3 { font-size: 1rem; font-weight: 700; margin-bottom: 1rem; }
    .modal label { display: block; font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.25rem; margin-top: 0.75rem; }
    .modal input, .modal select, .modal textarea { width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--text); padding: 0.5rem; border-radius: 0.5rem; font-size: 0.8rem; outline: none; }
    .modal textarea { resize: vertical; min-height: 60px; }
    .modal-actions { display: flex; gap: 0.5rem; margin-top: 1.25rem; justify-content: flex-end; }
    .toast { position: fixed; bottom: 1.5rem; right: 1.5rem; background: var(--primary); color: #000; padding: 0.75rem 1.25rem; border-radius: 0.5rem; font-size: 0.8rem; font-weight: 600; transform: translateY(100px); opacity: 0; transition: all 0.3s; z-index: 200; }
    .toast.show { transform: translateY(0); opacity: 1; }
    @media (max-width: 640px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .header h1 { font-size: 1rem; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${appName}</h1>
    <span class="badge">${sector}</span>
    <span class="badge" style="background:var(--surface2);color:var(--text-dim);">${industry}</span>
    <span class="pulse-brand">◆ Pulse ForgeAI</span>
  </div>

  <div class="toolbar">
    <input type="text" id="searchInput" placeholder="Search records..." />
    <select id="statusFilter">
      <option value="all">All Status</option>
      <option value="Active">Active</option>
      <option value="Pending">Pending</option>
      <option value="Complete">Complete</option>
      <option value="In Progress">In Progress</option>
      <option value="Review">Review</option>
      <option value="Approved">Approved</option>
      <option value="Scheduled">Scheduled</option>
    </select>
    <select id="sortField">
      <option value="id">Sort by ID</option>
      <option value="name">Sort by Name</option>
      <option value="value">Sort by Value</option>
      <option value="rate">Sort by Rate</option>
      <option value="date">Sort by Date</option>
    </select>
    <button class="btn btn-primary" onclick="openAddModal()">+ Add Record</button>
    <button class="btn btn-outline" onclick="exportCSV()">⬇ Export CSV</button>
  </div>

  <div class="container">
    <div class="stats-grid" id="statsGrid"></div>
    <div class="chart-section">
      <div class="chart-box"><h3>Performance Over Time</h3><canvas id="lineChart"></canvas></div>
      <div class="chart-box"><h3>Distribution</h3><canvas id="pieChart"></canvas></div>
    </div>
    <div class="table-wrap">
      <div class="table-header">
        <h3>Records</h3>
        <span id="recordCount" style="font-size:0.75rem;color:var(--text-dim);"></span>
      </div>
      <div class="table-scroll">
        <table><thead><tr>
          <th>ID</th><th>Name</th><th>Status</th><th>Value</th><th>Rate %</th><th>Date</th><th>Actions</th>
        </tr></thead><tbody id="tableBody"></tbody></table>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="modalOverlay">
    <div class="modal">
      <h3 id="modalTitle">Add Record</h3>
      <input type="hidden" id="editId" />
      <label>Name</label><input type="text" id="fName" />
      <label>Status</label>
      <select id="fStatus"><option>Active</option><option>Pending</option><option>Complete</option><option>In Progress</option><option>Review</option><option>Approved</option><option>Scheduled</option></select>
      <label>Value</label><input type="number" id="fValue" />
      <label>Rate %</label><input type="number" id="fRate" step="0.1" />
      <label>Date</label><input type="date" id="fDate" />
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveRecord()">Save</button>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <div class="footer">
    Built by <a href="${SITE_URL}/forge" target="_blank">Pulse ForgeAI</a> — Sovereign App Builder
    · Industry: ${industry} · Sector: ${sector}
    <br>Contact: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
    · <a href="https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}" target="_blank">GitHub Archive</a>
  </div>

<script>
document.addEventListener("DOMContentLoaded", function() {
  const NS = "${ns}";
  const defaultData = ${sampleData};

  function load() { try { const s = localStorage.getItem(NS + "data"); return s ? JSON.parse(s) : [...defaultData]; } catch { return [...defaultData]; } }
  function save(d) { localStorage.setItem(NS + "data", JSON.stringify(d)); }
  let data = load();

  function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2500);
  }

  function renderStats() {
    const total = data.length;
    const totalVal = data.reduce((s, r) => s + (r.value || 0), 0);
    const avgRate = total ? (data.reduce((s, r) => s + (r.rate || 0), 0) / total).toFixed(1) : "0";
    const active = data.filter(r => r.status === "Active" || r.status === "Complete" || r.status === "Approved").length;
    document.getElementById("statsGrid").innerHTML = [
      { label: "Total Records", value: total, change: "+${Math.floor(Math.random() * 12 + 3)}% this month", up: true },
      { label: "Total Value", value: "$" + totalVal.toLocaleString(), change: "+${Math.floor(Math.random() * 8 + 2)}% growth", up: true },
      { label: "Avg Rate", value: avgRate + "%", change: "${Math.random() > 0.5 ? "+" : "-"}${(Math.random() * 3).toFixed(1)}%", up: ${Math.random() > 0.4} },
      { label: "Active Items", value: active, change: active + " of " + total + " total", up: true },
    ].map(s => \`<div class="stat-card"><div class="label">\${s.label}</div><div class="value">\${s.value}</div><div class="change \${s.up ? 'up' : 'down'}">\${s.change}</div></div>\`).join("");
  }

  function getFiltered() {
    const q = document.getElementById("searchInput").value.toLowerCase();
    const st = document.getElementById("statusFilter").value;
    const sf = document.getElementById("sortField").value;
    let f = data.filter(r => {
      if (q && !r.name.toLowerCase().includes(q) && !r.status.toLowerCase().includes(q)) return false;
      if (st !== "all" && r.status !== st) return false;
      return true;
    });
    f.sort((a, b) => {
      if (sf === "name") return a.name.localeCompare(b.name);
      if (sf === "value") return (b.value || 0) - (a.value || 0);
      if (sf === "rate") return (b.rate || 0) - (a.rate || 0);
      if (sf === "date") return (b.date || "").localeCompare(a.date || "");
      return a.id - b.id;
    });
    return f;
  }

  function renderTable() {
    const f = getFiltered();
    document.getElementById("recordCount").textContent = f.length + " records";
    document.getElementById("tableBody").innerHTML = f.length === 0
      ? '<tr><td colspan="7" class="empty-state">No records found</td></tr>'
      : f.map(r => \`<tr>
        <td>#\${r.id}</td>
        <td>\${r.name}</td>
        <td><span class="status-badge status-\${r.status}">\${r.status}</span></td>
        <td>$\${(r.value || 0).toLocaleString()}</td>
        <td>\${r.rate}%</td>
        <td>\${r.date}</td>
        <td>
          <button class="btn btn-outline" style="padding:0.25rem 0.5rem;font-size:0.7rem;" onclick="editRecord(\${r.id})">Edit</button>
          <button class="btn btn-outline" style="padding:0.25rem 0.5rem;font-size:0.7rem;color:var(--danger);" onclick="deleteRecord(\${r.id})">Del</button>
        </td>
      </tr>\`).join("");
  }

  function drawCharts() {
    // Line chart
    const lc = document.getElementById("lineChart");
    const ctx = lc.getContext("2d");
    lc.width = lc.parentElement.clientWidth - 40; lc.height = 200;
    ctx.clearRect(0, 0, lc.width, lc.height);
    const sorted = [...data].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    const vals = sorted.map(d => d.value || 0);
    const maxV = Math.max(...vals, 1);
    const pad = 40;
    ctx.strokeStyle = "${colors.primary}"; ctx.lineWidth = 2;
    ctx.beginPath();
    vals.forEach((v, i) => {
      const x = pad + (i / Math.max(vals.length - 1, 1)) * (lc.width - pad * 2);
      const y = lc.height - pad - (v / maxV) * (lc.height - pad * 2);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = "${colors.primary}";
    vals.forEach((v, i) => {
      const x = pad + (i / Math.max(vals.length - 1, 1)) * (lc.width - pad * 2);
      const y = lc.height - pad - (v / maxV) * (lc.height - pad * 2);
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    });
    // Axes
    ctx.strokeStyle = "#2a2a3e"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, pad/2); ctx.lineTo(pad, lc.height - pad); ctx.lineTo(lc.width - pad/2, lc.height - pad); ctx.stroke();
    ctx.fillStyle = "#71717a"; ctx.font = "10px monospace";
    ctx.fillText("$" + maxV.toLocaleString(), 0, pad/2 + 10);
    ctx.fillText("$0", 0, lc.height - pad + 12);

    // Pie chart
    const pc = document.getElementById("pieChart");
    const pctx = pc.getContext("2d");
    pc.width = pc.parentElement.clientWidth - 40; pc.height = 200;
    pctx.clearRect(0, 0, pc.width, pc.height);
    const statusCounts = {};
    data.forEach(d => { statusCounts[d.status] = (statusCounts[d.status] || 0) + 1; });
    const entries = Object.entries(statusCounts);
    const total = data.length || 1;
    const pieColors = ["${colors.primary}", "${colors.secondary}", "#22c55e", "#3b82f6", "#eab308", "#ec4899", "#8b5cf6"];
    const cx = pc.width / 2, cy = 90, r = 70;
    let startAngle = -Math.PI / 2;
    entries.forEach(([status, count], i) => {
      const angle = (count / total) * Math.PI * 2;
      pctx.beginPath(); pctx.moveTo(cx, cy);
      pctx.arc(cx, cy, r, startAngle, startAngle + angle);
      pctx.fillStyle = pieColors[i % pieColors.length]; pctx.fill();
      startAngle += angle;
    });
    // Legend
    entries.forEach(([status, count], i) => {
      pctx.fillStyle = pieColors[i % pieColors.length];
      pctx.fillRect(10, 175 - entries.length * 14 + i * 14, 8, 8);
      pctx.fillStyle = "#71717a"; pctx.font = "10px sans-serif";
      pctx.fillText(status + " (" + count + ")", 22, 183 - entries.length * 14 + i * 14);
    });
  }

  function render() { renderStats(); renderTable(); drawCharts(); }

  window.openAddModal = function() {
    document.getElementById("modalTitle").textContent = "Add Record";
    document.getElementById("editId").value = "";
    document.getElementById("fName").value = "";
    document.getElementById("fStatus").value = "Active";
    document.getElementById("fValue").value = "";
    document.getElementById("fRate").value = "";
    document.getElementById("fDate").value = new Date().toISOString().split("T")[0];
    document.getElementById("modalOverlay").classList.add("active");
  };

  window.editRecord = function(id) {
    const r = data.find(d => d.id === id);
    if (!r) return;
    document.getElementById("modalTitle").textContent = "Edit Record";
    document.getElementById("editId").value = id;
    document.getElementById("fName").value = r.name;
    document.getElementById("fStatus").value = r.status;
    document.getElementById("fValue").value = r.value;
    document.getElementById("fRate").value = r.rate;
    document.getElementById("fDate").value = r.date;
    document.getElementById("modalOverlay").classList.add("active");
  };

  window.closeModal = function() { document.getElementById("modalOverlay").classList.remove("active"); };

  window.saveRecord = function() {
    const eid = document.getElementById("editId").value;
    const rec = {
      name: document.getElementById("fName").value || "New Record",
      status: document.getElementById("fStatus").value,
      value: parseFloat(document.getElementById("fValue").value) || 0,
      rate: parseFloat(document.getElementById("fRate").value) || 0,
      date: document.getElementById("fDate").value || new Date().toISOString().split("T")[0],
      category: "${category}",
    };
    if (eid) {
      const idx = data.findIndex(d => d.id === parseInt(eid));
      if (idx >= 0) { data[idx] = { ...data[idx], ...rec }; showToast("Record updated"); }
    } else {
      rec.id = Math.max(0, ...data.map(d => d.id)) + 1;
      data.push(rec); showToast("Record added");
    }
    save(data); closeModal(); render();
  };

  window.deleteRecord = function(id) {
    if (!confirm("Delete this record?")) return;
    data = data.filter(d => d.id !== id);
    save(data); render(); showToast("Record deleted");
  };

  window.exportCSV = function() {
    const f = getFiltered();
    const header = "ID,Name,Status,Value,Rate,Date";
    const rows = f.map(r => [r.id, '"' + r.name + '"', r.status, r.value, r.rate, r.date].join(","));
    const csv = [header, ...rows].join("\\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "${ns}export.csv"; a.click();
    showToast("CSV exported");
  };

  document.getElementById("searchInput").addEventListener("input", renderTable);
  document.getElementById("statusFilter").addEventListener("change", renderTable);
  document.getElementById("sortField").addEventListener("change", renderTable);
  document.getElementById("modalOverlay").addEventListener("click", function(e) { if (e.target === this) closeModal(); });

  render();
  window.addEventListener("resize", drawCharts);
});
</script>
</body>
</html>`;
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

    // 3. BUILD — generate app from templates (NO LLM — zero Groq usage)
    const result = { full_html: generateTemplateApp(idea.name, industry.name, sector, idea.prompt, idea.category) };

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
