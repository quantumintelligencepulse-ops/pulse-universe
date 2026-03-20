import Groq from "groq-sdk";
import { storage } from "./storage";
import { onCareerGenerated as hiveBrainOnCareer } from "./hive-brain";
import { CAREER_ENGINE_IDENTITY } from "./transcendence";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CAREER_SEEDS = [
  { title: "AI/ML Engineer", field: "Technology", level: "Senior" },
  { title: "Data Scientist", field: "Technology", level: "Mid" },
  { title: "Full Stack Developer", field: "Technology", level: "Mid" },
  { title: "Cloud Architect", field: "Technology", level: "Senior" },
  { title: "Cybersecurity Analyst", field: "Technology", level: "Mid" },
  { title: "DevOps Engineer", field: "Technology", level: "Mid" },
  { title: "Product Manager", field: "Business", level: "Senior" },
  { title: "UX Designer", field: "Design", level: "Mid" },
  { title: "Blockchain Developer", field: "Technology", level: "Senior" },
  { title: "Quantum Computing Researcher", field: "Science", level: "Senior" },
  { title: "Robotics Engineer", field: "Engineering", level: "Senior" },
  { title: "Biomedical Engineer", field: "Healthcare", level: "Mid" },
  { title: "Neuroscientist", field: "Science", level: "Senior" },
  { title: "Financial Analyst", field: "Finance", level: "Mid" },
  { title: "Investment Banker", field: "Finance", level: "Senior" },
  { title: "Venture Capitalist", field: "Finance", level: "Senior" },
  { title: "Environmental Scientist", field: "Science", level: "Mid" },
  { title: "Space Systems Engineer", field: "Engineering", level: "Senior" },
  { title: "Nanotechnology Researcher", field: "Science", level: "Senior" },
  { title: "Genetic Engineer", field: "Biotech", level: "Senior" },
  { title: "Ethical AI Researcher", field: "Technology", level: "Senior" },
  { title: "Digital Marketing Manager", field: "Marketing", level: "Mid" },
  { title: "Content Strategist", field: "Marketing", level: "Mid" },
  { title: "Growth Hacker", field: "Business", level: "Mid" },
  { title: "Entrepreneur / Startup Founder", field: "Business", level: "All" },
  { title: "Architect", field: "Design", level: "Senior" },
  { title: "Urban Planner", field: "Design", level: "Mid" },
  { title: "Clinical Psychologist", field: "Healthcare", level: "Senior" },
  { title: "Healthcare Administrator", field: "Healthcare", level: "Senior" },
  { title: "Aerospace Engineer", field: "Engineering", level: "Senior" },
  { title: "Nuclear Engineer", field: "Engineering", level: "Senior" },
  { title: "Materials Scientist", field: "Science", level: "Senior" },
  { title: "Supply Chain Manager", field: "Business", level: "Senior" },
  { title: "Operations Research Analyst", field: "Business", level: "Mid" },
  { title: "Patent Attorney", field: "Legal", level: "Senior" },
  { title: "Forensic Accountant", field: "Finance", level: "Senior" },
  { title: "Film Director", field: "Creative", level: "All" },
  { title: "Game Developer", field: "Technology", level: "Mid" },
  { title: "AR/VR Developer", field: "Technology", level: "Mid" },
  { title: "Prompt Engineer", field: "Technology", level: "Mid" },
  { title: "Bioinformatician", field: "Biotech", level: "Senior" },
  { title: "Astrophysicist", field: "Science", level: "Senior" },
  { title: "Social Media Manager", field: "Marketing", level: "Junior" },
  { title: "Data Engineer", field: "Technology", level: "Mid" },
  { title: "API Developer", field: "Technology", level: "Mid" },
  { title: "Machine Learning Researcher", field: "Technology", level: "Senior" },
  { title: "Systems Administrator", field: "Technology", level: "Mid" },
  { title: "Technical Writer", field: "Technology", level: "Mid" },
  { title: "UI Engineer", field: "Technology", level: "Mid" },
  { title: "Economist", field: "Finance", level: "Senior" },
];

function toSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

let running = false;
let totalGenerated = 0;
let startTime: Date;
const queue: Array<{ title: string; field: string; level: string }> = [];
const DEMAND_LEVELS = ["Critical", "Very High", "High", "Growing", "Stable"];

async function generateCareerEntry(item: { title: string; field: string; level: string }): Promise<void> {
  const slug = toSlug(item.title);
  const existing = await storage.getCareer(slug);
  if (existing?.generated) return;
  if (!existing) {
    await storage.upsertCareer({ slug, title: item.title, field: item.field, level: item.level, generated: false });
  }
  const prompt = `${CAREER_ENGINE_IDENTITY}

Generate a comprehensive career profile for "${item.title}" in the ${item.field} field (${item.level} level).

Return ONLY valid JSON (no markdown), exactly this structure:
{
  "title": "${item.title}",
  "field": "${item.field}",
  "level": "${item.level}",
  "summary": "2-3 sentence compelling description of this career path",
  "salaryRange": "$75,000–$150,000",
  "demand": "High",
  "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6"],
  "tools": ["Tool 1", "Tool 2", "Tool 3"],
  "education": "Bachelor's in Computer Science or related",
  "timeToHire": "2-4 weeks",
  "careerPath": ["Junior role", "Mid role", "Senior role", "Principal/Director"],
  "industries": ["Industry 1", "Industry 2", "Industry 3"],
  "relatedCareers": ["Related Role 1", "Related Role 2", "Related Role 3", "Related Role 4"],
  "relatedTopics": ["topic 1", "topic 2", "topic 3"],
  "futureTrend": "Brief prediction about this career's future in 1-2 sentences"
}`;

  const resp = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 650,
    temperature: 0.6,
  });
  const raw = resp.choices[0]?.message?.content || "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON");
  const data = JSON.parse(match[0]);

  await storage.upsertCareer({
    slug, title: data.title, field: data.field, level: data.level,
    skills: data.skills || [], salaryRange: data.salaryRange || "",
    demand: data.demand || "High", summary: data.summary || "",
    relatedCareers: data.relatedCareers || [], relatedTopics: data.relatedTopics || [],
    fullEntry: data, generated: true, generatedAt: new Date(),
  });
  await storage.addPulseEvent("career", data.title, slug, data.field);

  for (const related of (data.relatedCareers || []).slice(0, 3)) {
    const rSlug = toSlug(related);
    const exists = await storage.getCareer(rSlug).catch(() => null);
    if (!exists) {
      queue.push({ title: related, field: data.field, level: "Mid" });
    }
  }
  totalGenerated++;
  hiveBrainOnCareer(slug, data).catch(() => {});
}

async function runLoop() {
  while (running) {
    const next = queue.shift();
    if (next) {
      const stats = await storage.getCareerStats().catch(() => ({ total: 0, generated: 0, queued: 0 }));
      console.log(`[career] [CareerEngine] ⚡ Generating: "${next.title}" | DB: ${stats.generated}/${stats.total}`);
      try {
        await generateCareerEntry(next);
        console.log(`[career] [CareerEngine] ✓ "${next.title}" done`);
      } catch (e: any) {
        if (e?.status === 429) {
          console.log(`[career] [CareerEngine] Rate limited — backing off 25s`);
          await new Promise(r => setTimeout(r, 25000));
        } else {
          console.log(`[career] [CareerEngine] ✗ Failed: "${next.title}"`);
        }
      }
      await new Promise(r => setTimeout(r, 8000));
    } else {
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

export async function startQuantumCareerEngine() {
  if (running) return;
  running = true;
  startTime = new Date();
  console.log("[career] [CareerEngine] 🎯 QUANTUM CAREER ENGINE STARTING...");
  for (const seed of CAREER_SEEDS) {
    const slug = toSlug(seed.title);
    const ex = await storage.getCareer(slug).catch(() => null);
    if (!ex) queue.push(seed);
    else if (!ex.generated) queue.push(seed);
  }
  console.log(`[career] [CareerEngine] Seeded ${CAREER_SEEDS.length} initial careers`);
  console.log(`[career] [CareerEngine] 🚀 Career engine online — generating 1 entry every 8 seconds`);
  runLoop();
}

export function getCareerEngineStatus() {
  return { running, totalGenerated, startTime: startTime?.toISOString(), queueSize: queue.length };
}
