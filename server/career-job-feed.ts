import { pool } from "./db";

// ── CAREER JOB FEED ENGINE ─────────────────────────────────────────────────
// Continuously ingests live job listings from Indeed RSS + other public feeds.
// Dissects ingested jobs into "Job Fusions" → submits to senate for voting.
// Approved fusions become new career templates (omega upgrade candidates).

interface LiveJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  url: string;
  source: string;
  field: string;
  postedAt: Date;
  summary: string;
  skills: string[];
  fusion?: JobFusion;
}

interface JobFusion {
  id: string;
  name: string;
  parentJobA: string;
  parentJobB: string;
  description: string;
  novelSkills: string[];
  salaryEstimate: string;
  status: "dissecting" | "proposed" | "voting" | "approved" | "rejected";
  votes: number;
  upvotes: number;
  downvotes: number;
  createdAt: Date;
}

// In-memory stores
const liveJobs: LiveJob[] = [];
const jobFusions: JobFusion[] = [];
let totalIngested = 0;
let lastFeedPoll = 0;
let engineRunning = false;

// Job categories to poll on Indeed RSS
const JOB_FEED_QUERIES = [
  { q: "software engineer", field: "Technology" },
  { q: "data scientist", field: "Technology" },
  { q: "machine learning engineer", field: "Technology" },
  { q: "biotech researcher", field: "Biotech" },
  { q: "product manager", field: "Business" },
  { q: "financial analyst", field: "Finance" },
  { q: "UX designer", field: "Design" },
  { q: "mechanical engineer", field: "Engineering" },
  { q: "nurse practitioner", field: "Healthcare" },
  { q: "AI researcher", field: "Technology" },
  { q: "cybersecurity analyst", field: "Technology" },
  { q: "blockchain developer", field: "Technology" },
  { q: "quantum computing researcher", field: "Science" },
  { q: "genomics scientist", field: "Biotech" },
  { q: "robotics engineer", field: "Engineering" },
];

// Parse Indeed RSS XML — public feed, no auth required
async function pollIndeedRSS(query: string, field: string): Promise<LiveJob[]> {
  try {
    const url = `https://www.indeed.com/rss?q=${encodeURIComponent(query)}&sort=date&limit=15`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PulseWorld/1.0; +https://myaigpt.com)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const jobs: LiveJob[] = [];
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
    for (const item of items.slice(0, 10)) {
      const title   = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/))?.[1]?.trim() || "";
      const link    = (item.match(/<link>(.*?)<\/link>/) || [])[1]?.trim() || "";
      const desc    = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/))?.[1] || "";
      const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1]?.trim() || "";
      const source  = (item.match(/<source[^>]*>(.*?)<\/source>/) || [])[1]?.trim() || "Indeed";

      const cleanDesc = desc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
      const company = title.split(" - ").slice(-1)[0]?.trim() || "Company";
      const jobTitle = title.split(" - ").slice(0, -1).join(" - ").trim() || title;
      const location = (cleanDesc.match(/Location:\s*([^\n,]+)/i) || [])[1]?.trim() || "Remote / On-site";

      if (!jobTitle || !link) continue;

      const id = `job-${Buffer.from(link).toString("base64").slice(0, 12)}`;
      jobs.push({
        id,
        title: jobTitle,
        company,
        location,
        url: link,
        source: "Indeed",
        field,
        postedAt: pubDate ? new Date(pubDate) : new Date(),
        summary: cleanDesc.slice(0, 200),
        skills: extractSkills(cleanDesc + " " + jobTitle),
      });
    }
    return jobs;
  } catch {
    return [];
  }
}

// Lightweight skill extraction from job text
function extractSkills(text: string): string[] {
  const SKILL_PATTERNS = [
    "Python", "JavaScript", "TypeScript", "React", "Node.js", "SQL", "AWS", "Azure", "GCP",
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "CRISPR", "Genomics",
    "Docker", "Kubernetes", "GraphQL", "REST API", "Java", "C++", "Rust", "Go",
    "Product Management", "Agile", "Scrum", "Figma", "UX Research", "Data Analysis",
    "Biostatistics", "Clinical Trials", "FDA Regulation", "PCR", "ELISA", "Bioinformatics",
    "Cybersecurity", "Penetration Testing", "Blockchain", "Smart Contracts", "Solidity",
    "Quantum Computing", "Linear Algebra", "Statistics", "R", "Scala", "Spark", "Hadoop",
  ];
  const lower = text.toLowerCase();
  return SKILL_PATTERNS.filter(s => lower.includes(s.toLowerCase())).slice(0, 6);
}

// Generate a job fusion from two different jobs
function generateFusion(jobA: LiveJob, jobB: LiveJob): JobFusion {
  const fusionNames = [
    `${jobA.title.split(" ")[0]}-${jobB.title.split(" ")[0]} Hybrid Specialist`,
    `Cross-Domain ${jobA.field}/${jobB.field} Engineer`,
    `Sovereign ${jobA.title.split(" ").slice(-1)[0]} × ${jobB.title.split(" ").slice(-1)[0]} Architect`,
  ];
  const name = fusionNames[Math.floor(Math.random() * fusionNames.length)];
  const combinedSkills = [...new Set([...jobA.skills, ...jobB.skills])];
  const novelSkills = combinedSkills.slice(0, 4).map(s => `Advanced ${s}`);

  return {
    id: `fusion-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    parentJobA: jobA.title,
    parentJobB: jobB.title,
    description: `A novel career fusion combining the expertise of ${jobA.title} (${jobA.field}) with ${jobB.title} (${jobB.field}). This emergent role is born from AI dissection of real job market data and represents the next evolution of human-AI collaborative work.`,
    novelSkills,
    salaryEstimate: "$95,000 – $185,000",
    status: "proposed",
    votes: 0,
    upvotes: 0,
    downvotes: 0,
    createdAt: new Date(),
  };
}

// Submit a job fusion to the senate for voting (DB integration)
async function submitFusionToSenate(fusion: JobFusion) {
  try {
    await pool.query(`
      INSERT INTO equation_proposals (proposal_text, author, status, created_at, metadata)
      VALUES ($1, $2, 'pending', NOW(), $3)
      ON CONFLICT DO NOTHING
    `, [
      `JOB FUSION: ${fusion.name}\n\nParent Jobs: ${fusion.parentJobA} × ${fusion.parentJobB}\n\n${fusion.description}\n\nNovel Skills: ${fusion.novelSkills.join(", ")}\n\nSalary Estimate: ${fusion.salaryEstimate}`,
      "CAREER-ENGINE-AI",
      JSON.stringify({ type: "job_fusion", fusionId: fusion.id, novelSkills: fusion.novelSkills }),
    ]);
    fusion.status = "voting";
  } catch {
    // Table may not exist, store as proposed only
  }
}

// Main ingestion cycle
async function runIngestionCycle() {
  const queryIndex = Math.floor(Math.random() * JOB_FEED_QUERIES.length);
  const { q, field } = JOB_FEED_QUERIES[queryIndex];

  const newJobs = await pollIndeedRSS(q, field);
  let addedCount = 0;

  for (const job of newJobs) {
    const exists = liveJobs.some(j => j.id === job.id);
    if (!exists) {
      liveJobs.unshift(job);
      addedCount++;
      totalIngested++;
    }
  }

  // Keep buffer at max 500 jobs
  if (liveJobs.length > 500) liveJobs.splice(500);

  // Generate a job fusion if we have enough diverse jobs
  if (liveJobs.length >= 4 && Math.random() < 0.4) {
    const fields = [...new Set(liveJobs.map(j => j.field))];
    if (fields.length >= 2) {
      const jobA = liveJobs.find(j => j.field === fields[0]);
      const jobB = liveJobs.find(j => j.field === fields[1] && j.field !== fields[0]);
      if (jobA && jobB && jobFusions.length < 200) {
        const fusion = generateFusion(jobA, jobB);
        jobFusions.unshift(fusion);
        if (jobFusions.length > 200) jobFusions.pop();
        await submitFusionToSenate(fusion);
        console.log(`[career-feed] 🧬 Job Fusion created: ${fusion.name}`);
      }
    }
  }

  lastFeedPoll = Date.now();
  if (addedCount > 0) {
    console.log(`[career-feed] ✅ +${addedCount} live jobs ingested (q="${q}") | Total: ${liveJobs.length} buffered | ${jobFusions.length} fusions`);
  }
}

// Start the engine — polls every 90 seconds
export function startCareerJobFeed() {
  if (engineRunning) return;
  engineRunning = true;
  console.log("[career-feed] 🌐 Career Job Feed Engine ONLINE — polling Indeed RSS every 90s");

  // Initial poll
  setTimeout(async () => {
    await runIngestionCycle();
  }, 5000);

  // Recurring poll
  setInterval(async () => {
    await runIngestionCycle();
  }, 90_000);
}

// ── PUBLIC API ─────────────────────────────────────────────────────────────
export function getLiveJobs(limit = 100, field?: string): LiveJob[] {
  let jobs = liveJobs;
  if (field && field !== "all") jobs = jobs.filter(j => j.field === field);
  return jobs.slice(0, limit);
}

export function getJobFusions(limit = 50): JobFusion[] {
  return jobFusions.slice(0, limit);
}

export function getCareerFeedStats() {
  return {
    running: engineRunning,
    totalIngested,
    buffered: liveJobs.length,
    fusions: jobFusions.length,
    lastPollAgo: lastFeedPoll ? Math.round((Date.now() - lastFeedPoll) / 1000) : null,
    byField: Object.fromEntries(
      [...new Set(liveJobs.map(j => j.field))].map(f => [f, liveJobs.filter(j => j.field === f).length])
    ),
  };
}
