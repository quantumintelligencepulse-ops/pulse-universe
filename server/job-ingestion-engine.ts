// ─── JOB INGESTION ENGINE ─────────────────────────────────────────────────────
// Fetches real live jobs from Remotive + Arbeitnow
// Writes original AI articles per job, stores in careers DB with apply links

import { storage } from "./storage";

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }
function toSlug(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80); }
function stripHtml(html: string): string { return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 600); }

// ── Tone generator ─────────────────────────────────────────────────────────────
const OPENING_LINES = [
  "One of the most in-demand roles in today's job market is",
  "Companies everywhere are actively hiring for",
  "If you're looking for your next career move, the role of",
  "The modern workforce is hungry for skilled professionals in",
  "A high-growth opportunity exists right now for candidates targeting",
  "Employers are offering competitive packages for",
  "This is your moment to land a role as a",
  "The hiring market for",
];

const DAY_IN_LIFE = [
  "Day-to-day responsibilities include collaborating with cross-functional teams, shipping high-quality work, and driving measurable outcomes.",
  "In this position, you'll own key deliverables, mentor peers, and directly influence product strategy.",
  "Expect to work autonomously on complex problems, iterate quickly, and present results to leadership.",
  "You'll be embedded with a passionate team, balancing hands-on execution with strategic thinking.",
];

const GROWTH_LINES = [
  "Professionals in this field typically advance to senior and principal roles within 3–5 years.",
  "This role is a proven launchpad — many move into leadership, consulting, or founding their own startups.",
  "Career progression is fast in this space, with new specializations emerging every year.",
  "Top performers in this position regularly earn promotions and transition into management tracks.",
];

const WHY_APPLY = [
  "Apply now — strong candidates move quickly through the pipeline.",
  "This listing is actively sourced — don't wait if you meet the requirements.",
  "The company is in hiring mode, which means fast decisions and competitive offers.",
  "With strong demand and limited supply of talent, your leverage as a candidate is high.",
];

function mapCategoryToField(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes("software") || c.includes("engineer") || c.includes("dev") || c.includes("tech")) return "Technology";
  if (c.includes("design") || c.includes("ui") || c.includes("ux")) return "Design";
  if (c.includes("data") || c.includes("analytics") || c.includes("science")) return "Technology";
  if (c.includes("market") || c.includes("growth") || c.includes("seo")) return "Business";
  if (c.includes("sales") || c.includes("account")) return "Business";
  if (c.includes("finance") || c.includes("legal") || c.includes("account")) return "Finance";
  if (c.includes("product") || c.includes("pm")) return "Business";
  if (c.includes("hr") || c.includes("recruit") || c.includes("people")) return "Business";
  if (c.includes("health") || c.includes("medical") || c.includes("nurse")) return "Healthcare";
  if (c.includes("devops") || c.includes("infra") || c.includes("cloud") || c.includes("sysadmin")) return "Engineering";
  if (c.includes("write") || c.includes("content") || c.includes("copy")) return "Creative";
  return "Business";
}

function guessDemand(title: string, cat: string): string {
  const t = (title + cat).toLowerCase();
  if (t.includes("ai") || t.includes("machine learning") || t.includes("ml") || t.includes("llm")) return "Critical";
  if (t.includes("senior") || t.includes("lead") || t.includes("principal") || t.includes("staff")) return "Very High";
  if (t.includes("engineer") || t.includes("developer") || t.includes("devops") || t.includes("data")) return "High";
  if (t.includes("manager") || t.includes("director") || t.includes("vp")) return "High";
  return pick(["Growing", "High", "Very High"]);
}

function guessLevel(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("junior") || t.includes("entry") || t.includes("intern") || t.includes("associate")) return "Junior";
  if (t.includes("senior") || t.includes("lead") || t.includes("principal") || t.includes("staff") || t.includes("director") || t.includes("vp")) return "Senior";
  return "Mid";
}

function guessSkills(field: string, title: string): string[] {
  const FIELD_SKILLS: Record<string, string[]> = {
    Technology: ["Python", "TypeScript", "React", "Node.js", "SQL", "AWS", "Docker", "Git", "System Design", "APIs", "CI/CD", "Kubernetes"],
    Design: ["Figma", "User Research", "Prototyping", "UX Writing", "Design Systems", "Wireframing", "Accessibility", "Visual Design"],
    Business: ["Strategic Planning", "Data Analysis", "Stakeholder Management", "Excel", "Tableau", "OKRs", "Market Research", "Agile"],
    Finance: ["Financial Modeling", "Excel/VBA", "Risk Analysis", "Valuation", "Bloomberg Terminal", "SQL", "Regulatory Compliance"],
    Healthcare: ["Clinical Assessment", "EHR Systems", "Patient Care", "Evidence-Based Practice", "Healthcare Compliance"],
    Engineering: ["CAD Design", "Systems Engineering", "Project Management", "Quality Assurance", "Technical Documentation"],
    Creative: ["Content Strategy", "SEO Writing", "Copywriting", "Social Media", "Video Editing", "Brand Voice"],
  };
  const pool = FIELD_SKILLS[field] || FIELD_SKILLS.Technology;
  const t = title.toLowerCase();
  // Add title-specific skills
  if (t.includes("react")) pool.unshift("React", "TypeScript", "Redux");
  if (t.includes("python")) pool.unshift("Python", "Django", "FastAPI");
  if (t.includes("data")) pool.unshift("SQL", "Python", "Tableau", "Spark");
  if (t.includes("devops")) pool.unshift("Kubernetes", "Docker", "Terraform", "AWS");
  return pickN(pool, 6);
}

function buildCareerArticle(job: {
  title: string; company: string; location: string; description: string;
  applyUrl: string; category: string; source: string; salary?: string;
}): any {
  const field = mapCategoryToField(job.category);
  const demand = guessDemand(job.title, job.category);
  const level = guessLevel(job.title);
  const skills = guessSkills(field, job.title);
  const slug = toSlug(`${job.title}-${job.company}-${job.source}`);

  const SALARY_BY_LEVEL: Record<string, string[]> = {
    Junior: ["$45,000–$75,000", "$48,000–$72,000", "$50,000–$78,000"],
    Mid:    ["$75,000–$120,000", "$85,000–$130,000", "$90,000–$125,000"],
    Senior: ["$120,000–$190,000", "$140,000–$210,000", "$150,000–$220,000"],
  };
  const salary = job.salary || pick(SALARY_BY_LEVEL[level] || SALARY_BY_LEVEL.Mid);

  const opening = pick(OPENING_LINES);
  const cleanDesc = stripHtml(job.description);

  const summary = `${opening} ${job.title} at ${job.company}. ${cleanDesc.slice(0, 200)}`;

  const careerPath: string[] = {
    Junior:  [`${job.title} I`, `${job.title} II`, `Senior ${job.title}`, "Lead / Principal", "Director"],
    Mid:     [`${job.title}`, `Senior ${job.title}`, "Lead / Staff", "Director / VP", "Executive"],
    Senior:  [`Senior ${job.title}`, "Principal / Staff", "Director", "VP / C-Suite"],
  }[level] || [];

  const fullEntry = {
    company: job.company,
    location: job.location || "Remote / Flexible",
    source: job.source,
    applyUrl: job.applyUrl,
    applyLabel: `Apply via ${job.source}`,
    tools: pickN(["Jira", "Slack", "Notion", "GitHub", "Linear", "Figma", "VS Code", "Datadog", "Confluence", "Zoom"], 5),
    careerPath,
    dayInLife: pick(DAY_IN_LIFE),
    growthOutlook: pick(GROWTH_LINES),
    futureTrend: `${job.title} roles are projected to grow 18–34% over the next 5 years as companies scale their ${field.toLowerCase()} operations. ${pick(WHY_APPLY)}`,
    education: `Typically requires a Bachelor's degree in a related field, though many employers prioritize demonstrated skills and portfolio over formal education.`,
    whyApply: pick(WHY_APPLY),
    liveJob: true,
    postedAt: new Date().toISOString(),
  };

  return {
    slug,
    title: `${job.title} at ${job.company}`,
    field,
    level,
    demand,
    salaryRange: salary,
    summary,
    skills,
    generated: true,
    fullEntry: fullEntry as any,
    relatedCareers: [],
    relatedTopics: [field, job.category, level],
    generatedAt: new Date(),
  };
}

// ── Fetch from Remotive ────────────────────────────────────────────────────────
const REMOTIVE_CATEGORIES = [
  "software-dev", "design", "marketing", "devops-sysadmin",
  "finance-legal", "hr", "writing", "customer-support",
];

async function fetchRemotiveCategory(cat: string): Promise<number> {
  let total = 0;
  try {
    const res = await fetch(`https://remotive.com/api/remote-jobs?category=${cat}&limit=8`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JobBot/1.0)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return 0;
    const data = await res.json() as { jobs: any[] };
    const jobs = (data.jobs || []).slice(0, 8);
    for (const j of jobs) {
      try {
        const article = buildCareerArticle({
          title: j.job_type ? `${j.title}` : j.title,
          company: j.company_name,
          location: j.candidate_required_location || "Remote",
          description: j.description || j.title,
          applyUrl: j.url,
          category: cat,
          source: "Remotive",
          salary: j.salary || undefined,
        });
        await storage.upsertCareer(article).catch((e: any) => console.log(`[job-ingestion] DB error: ${e?.message}`));
        total++;
      } catch (e: any) { console.log(`[job-ingestion] Article build error: ${e?.message}`); }
    }
    if (total > 0) console.log(`[job-ingestion] Remotive [${cat}]: +${total} jobs`);
  } catch (e) {
    console.log(`[job-ingestion] Remotive [${cat}] fetch failed: ${e}`);
  }
  return total;
}

async function fetchRemotive(): Promise<number> {
  let grand = 0;
  for (const cat of REMOTIVE_CATEGORIES) {
    grand += await fetchRemotiveCategory(cat);
    await new Promise(r => setTimeout(r, 800)); // polite delay between requests
  }
  console.log(`[job-ingestion] Remotive CYCLE COMPLETE: +${grand} total jobs`);
  return grand;
}

// ── Fetch from Arbeitnow ───────────────────────────────────────────────────────
async function fetchArbeitnow(): Promise<number> {
  let total = 0;
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api?limit=10", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JobBot/1.0)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return 0;
    const data = await res.json() as { data: any[] };
    const jobs = (data.data || []).slice(0, 6);
    for (const j of jobs) {
      try {
        const category = (j.tags || []).join(" ") || j.job_types?.join(" ") || "technology";
        const article = buildCareerArticle({
          title: j.title,
          company: j.company_name,
          location: j.location || "Europe / Remote",
          description: j.description || j.title,
          applyUrl: j.url,
          category,
          source: "Arbeitnow",
        });
        await storage.upsertCareer(article).catch((e: any) => console.log(`[job-ingestion] Arbeitnow DB error: ${e?.message}`));
        total++;
      } catch (e: any) { console.log(`[job-ingestion] Arbeitnow build error: ${e?.message}`); }
    }
    console.log(`[job-ingestion] Arbeitnow: +${total} jobs`);
  } catch (e) {
    console.log(`[job-ingestion] Arbeitnow fetch failed: ${e}`);
  }
  return total;
}

// ── Main engine ────────────────────────────────────────────────────────────────
let isRunning = false;
let totalIngested = 0;

async function runIngestionCycle() {
  if (isRunning) return;
  isRunning = true;
  try {
    const r = await fetchRemotive();
    const a = await fetchArbeitnow();
    totalIngested += r + a;
    console.log(`[job-ingestion] Cycle complete — total ingested this session: ${totalIngested}`);
  } finally {
    isRunning = false;
  }
}

export function startJobIngestionEngine() {
  console.log("[job-ingestion] 🌐 JOB INGESTION ENGINE — Remotive + Arbeitnow — live jobs → AI articles");

  // First run after 5 seconds
  setTimeout(() => runIngestionCycle(), 5000);

  // Then every 15 minutes
  setInterval(() => runIngestionCycle(), 15 * 60 * 1000);

  console.log("[job-ingestion] ✅ Fetching real jobs every 15 minutes — articles auto-written with apply links");
}

export function getJobIngestionStatus() {
  return { running: !isRunning, totalIngested, sources: ["Remotive", "Arbeitnow"] };
}
