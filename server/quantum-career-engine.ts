import { storage } from "./storage";
import { onCareerGenerated as hiveBrainOnCareer } from "./hive-brain";

function toSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));
}

// ─── Template-based career generator — ZERO API CALLS ────────────
const SALARY_BY_LEVEL: Record<string, string[]> = {
  Junior:  ["$45,000–$70,000", "$48,000–$72,000", "$50,000–$75,000", "$52,000–$78,000"],
  Mid:     ["$75,000–$110,000", "$80,000–$120,000", "$85,000–$125,000", "$90,000–$130,000"],
  Senior:  ["$120,000–$180,000", "$130,000–$190,000", "$140,000–$200,000", "$150,000–$220,000"],
  All:     ["$60,000–$200,000+", "$70,000–$180,000", "$55,000–$250,000+"],
};

const DEMAND_OPTIONS = ["Critical", "Very High", "High", "Growing", "Stable"];
const TIME_TO_HIRE = ["1–2 weeks", "2–4 weeks", "3–6 weeks", "4–8 weeks", "6–12 weeks"];

const FIELD_SKILLS: Record<string, string[]> = {
  Technology: ["Python", "Cloud Architecture", "System Design", "APIs", "CI/CD", "Kubernetes", "Machine Learning", "SQL", "TypeScript", "Git", "Docker", "Microservices", "Security"],
  Business: ["Strategic Planning", "Financial Analysis", "Stakeholder Management", "OKRs", "Data Analysis", "Leadership", "Agile", "Market Research", "Risk Management"],
  Science: ["Research Design", "Statistical Analysis", "Scientific Writing", "Lab Techniques", "Data Visualization", "Hypothesis Testing", "Peer Review", "Grant Writing"],
  Design: ["UI/UX Design", "Figma", "User Research", "Prototyping", "Design Systems", "Accessibility", "Typography", "Brand Identity", "Design Thinking"],
  Finance: ["Financial Modeling", "Valuation", "Risk Analysis", "Portfolio Management", "Derivatives", "Due Diligence", "Excel", "Bloomberg Terminal", "Regulatory Compliance"],
  Healthcare: ["Clinical Assessment", "Patient Care", "Medical Records", "Evidence-Based Practice", "Healthcare Systems", "Pharmacology", "Research Methods", "Ethics"],
  Engineering: ["CAD Design", "FEA Analysis", "Systems Engineering", "Project Management", "Quality Assurance", "Technical Documentation", "Simulation", "Prototyping"],
  Creative: ["Storytelling", "Creative Direction", "Project Management", "Client Relations", "Visual Communication", "Script Writing", "Post-Production", "Brand Strategy"],
  Marketing: ["Content Strategy", "SEO/SEM", "Analytics", "Campaign Management", "Social Media", "CRM", "A/B Testing", "Growth Hacking", "Email Marketing"],
  Legal: ["Legal Research", "Contract Drafting", "Litigation", "Regulatory Compliance", "Due Diligence", "Client Counseling", "Negotiation", "Case Management"],
  Biotech: ["Molecular Biology", "CRISPR", "Cell Culture", "Bioinformatics", "PCR", "Flow Cytometry", "Protein Analysis", "Regulatory Affairs", "Clinical Trials"],
  Education: ["Curriculum Design", "Instructional Design", "Assessment", "Learning Management Systems", "Pedagogy", "Student Engagement", "Educational Technology"],
};

const FIELD_TOOLS: Record<string, string[]> = {
  Technology: ["VS Code", "GitHub", "AWS/GCP/Azure", "Docker", "Kubernetes", "PostgreSQL", "Redis", "Prometheus"],
  Business: ["Salesforce", "HubSpot", "Tableau", "Excel", "Notion", "Jira", "Slack", "Looker"],
  Science: ["R Studio", "Python (SciPy)", "MATLAB", "Lab instruments", "SPSS", "Jupyter Notebooks"],
  Design: ["Figma", "Sketch", "Adobe XD", "InVision", "Principle", "Zeplin", "Adobe Creative Suite"],
  Finance: ["Bloomberg Terminal", "Excel/VBA", "Python", "SQL", "FactSet", "Refinitiv", "Tableau"],
  Healthcare: ["Epic EHR", "Medical devices", "HIPAA tools", "Clinical systems", "Research platforms"],
  Engineering: ["SolidWorks", "MATLAB", "AutoCAD", "ANSYS", "LabVIEW", "Simulink", "SAP"],
  Creative: ["Final Cut Pro", "Adobe Premiere", "DaVinci Resolve", "Logic Pro", "Ableton", "Photoshop"],
  Marketing: ["Google Analytics", "HubSpot", "Mailchimp", "Hootsuite", "SEMrush", "Salesforce Marketing Cloud"],
  Legal: ["Westlaw", "LexisNexis", "Clio", "DocuSign", "Microsoft Office", "Case management software"],
  Biotech: ["PCR machines", "Flow cytometers", "CRISPR systems", "DNA sequencers", "Lab notebooks", "LIMS"],
  Education: ["Canvas LMS", "Google Classroom", "Kahoot", "Zoom", "Moodle", "EdTech platforms"],
};

const INDUSTRIES_BY_FIELD: Record<string, string[]> = {
  Technology: ["SaaS", "FinTech", "Healthcare Tech", "EdTech", "Defense", "Gaming", "E-commerce", "AI/ML Startups"],
  Business: ["Consulting", "Financial Services", "Manufacturing", "Retail", "Non-profit", "Government", "Healthcare"],
  Science: ["Biotech", "Pharmaceuticals", "Government research", "Academia", "Environmental agencies", "National labs"],
  Design: ["Agencies", "Tech companies", "Media", "Fashion", "Architecture firms", "Product companies"],
  Finance: ["Investment banking", "Private equity", "Hedge funds", "Corporate finance", "Insurance", "Fintech"],
  Healthcare: ["Hospitals", "Clinics", "Health systems", "Insurance", "Biotech", "Medical devices", "Public health"],
  Engineering: ["Aerospace", "Automotive", "Construction", "Energy", "Defense", "Manufacturing", "Space"],
  Creative: ["Film studios", "Production companies", "Advertising agencies", "Streaming platforms", "Gaming"],
  Marketing: ["Consumer brands", "Tech companies", "Agencies", "Media", "E-commerce", "Healthcare", "Finance"],
  Legal: ["Law firms", "Corporate legal", "Government", "NGOs", "Compliance", "IP firms", "Litigation boutiques"],
  Biotech: ["Biotech companies", "Pharma", "Academic labs", "CROs", "Government agencies", "Diagnostics"],
  Education: ["K-12 schools", "Universities", "EdTech companies", "Non-profits", "Government agencies", "Corporate training"],
};

const CAREER_PATH_BY_LEVEL = (title: string, field: string): string[] => {
  const short = title.split(" ").slice(-2).join(" ");
  return [
    `Junior ${short}`,
    `${short}`,
    `Senior ${short}`,
    `Lead / Principal ${short}`,
    `${field} Director / VP`,
  ];
};

const SUMMARIES = (title: string, field: string, level: string) => [
  `${title} is a dynamic ${level}-level career in ${field} that places you at the frontier of innovation and impact. Professionals in this role shape systems, mentor teams, and drive meaningful outcomes across complex organizational environments.`,
  `A ${title} operates at the intersection of expertise and execution within the ${field} domain. This ${level} role demands deep technical knowledge paired with strong communication and leadership capabilities.`,
  `As a ${title}, you will lead critical initiatives in the ${field} sector, translating complex challenges into scalable solutions. This ${level} career path offers exceptional growth potential and global relevance.`,
  `The ${title} role is one of the most impactful ${level} positions in ${field} today. You will design, build, and optimize systems that affect millions — all while collaborating with world-class teams and leveraging cutting-edge tools.`,
];

const FUTURE_TRENDS = (title: string, field: string) => [
  `AI and automation are rapidly transforming the ${field} landscape, creating enormous demand for ${title} professionals who can bridge human judgment and machine intelligence.`,
  `The global demand for skilled ${title} roles is projected to grow significantly over the next decade, driven by digital transformation, regulatory shifts, and an expanding innovation economy in ${field}.`,
  `As ${field} continues to evolve, ${title} professionals with cross-domain skills — especially in data analysis and systems thinking — will command premium salaries and leadership opportunities.`,
  `Remote work, global collaboration, and AI-assisted workflows are reshaping what a ${title} does day-to-day. Those who adapt quickly will find themselves at the leading edge of the ${field} revolution.`,
];

function generateCareerData(title: string, field: string, level: string): any {
  const fieldKey = field in FIELD_SKILLS ? field : "Technology";
  const skills = pickN(FIELD_SKILLS[fieldKey] || FIELD_SKILLS.Technology, 6);
  const tools = pickN(FIELD_TOOLS[fieldKey] || FIELD_TOOLS.Technology, 4);
  const industries = pickN(INDUSTRIES_BY_FIELD[fieldKey] || INDUSTRIES_BY_FIELD.Technology, 4);
  const salaries = SALARY_BY_LEVEL[level] || SALARY_BY_LEVEL.Mid;
  const careerPath = CAREER_PATH_BY_LEVEL(title, field);

  const relatedTitles = [
    `Senior ${title}`, `${title} Manager`, `${field} Strategist`,
    `Principal ${title}`, `${field} Consultant`, `${title} Lead`,
    `${field} Director`, `${title} Architect`,
  ].filter(t => t !== title).slice(0, 5);

  const relatedTopics = [
    field, `${field} careers`, `${title} skills`, `${field} industry`,
    "Career development", "Professional growth", `${field} trends`,
  ].slice(0, 5);

  return {
    title,
    field,
    level,
    summary: pick(SUMMARIES(title, field, level)),
    salaryRange: pick(salaries),
    demand: pick(DEMAND_OPTIONS),
    skills,
    tools,
    education: `Bachelor's degree in ${field} or related field; Master's preferred for senior roles`,
    timeToHire: pick(TIME_TO_HIRE),
    careerPath,
    industries,
    relatedCareers: relatedTitles,
    relatedTopics,
    futureTrend: pick(FUTURE_TRENDS(title, field)),
  };
}

// ─── Massive Career Seed List ─────────────────────────────────────
const CAREER_SEEDS: Array<{ title: string; field: string; level: string }> = [
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
  { title: "Growth Hacker", field: "Business", level: "Mid" },
  { title: "Entrepreneur / Startup Founder", field: "Business", level: "All" },
  { title: "Clinical Psychologist", field: "Healthcare", level: "Senior" },
  { title: "Aerospace Engineer", field: "Engineering", level: "Senior" },
  { title: "Nuclear Engineer", field: "Engineering", level: "Senior" },
  { title: "Materials Scientist", field: "Science", level: "Senior" },
  { title: "Patent Attorney", field: "Legal", level: "Senior" },
  { title: "Film Director", field: "Creative", level: "All" },
  { title: "Game Developer", field: "Technology", level: "Mid" },
  { title: "Prompt Engineer", field: "Technology", level: "Mid" },
  { title: "Bioinformatician", field: "Biotech", level: "Senior" },
  { title: "Data Engineer", field: "Technology", level: "Mid" },
  { title: "Machine Learning Researcher", field: "Technology", level: "Senior" },
  { title: "Supply Chain Manager", field: "Business", level: "Senior" },
  { title: "Economist", field: "Finance", level: "Senior" },
  { title: "Social Media Manager", field: "Marketing", level: "Junior" },
  { title: "Content Strategist", field: "Marketing", level: "Mid" },
  { title: "AR/VR Developer", field: "Technology", level: "Mid" },
  { title: "Platform Engineer", field: "Technology", level: "Senior" },
  { title: "Site Reliability Engineer", field: "Technology", level: "Senior" },
  { title: "Cryptography Engineer", field: "Technology", level: "Senior" },
  { title: "IoT Engineer", field: "Engineering", level: "Mid" },
  { title: "Autonomous Systems Engineer", field: "Engineering", level: "Senior" },
  { title: "Clinical Data Analyst", field: "Healthcare", level: "Mid" },
  { title: "Health Informatics Specialist", field: "Healthcare", level: "Mid" },
  { title: "Medical Affairs Director", field: "Healthcare", level: "Senior" },
  { title: "Regulatory Affairs Specialist", field: "Biotech", level: "Mid" },
  { title: "Drug Discovery Scientist", field: "Biotech", level: "Senior" },
  { title: "Clinical Trial Manager", field: "Biotech", level: "Senior" },
  { title: "Computational Neuroscientist", field: "Science", level: "Senior" },
  { title: "Marine Biologist", field: "Science", level: "Mid" },
  { title: "Climate Scientist", field: "Science", level: "Senior" },
  { title: "Astrophysicist", field: "Science", level: "Senior" },
  { title: "Particle Physicist", field: "Science", level: "Senior" },
  { title: "Urban Planner", field: "Design", level: "Mid" },
  { title: "Architect", field: "Design", level: "Senior" },
  { title: "UX Researcher", field: "Design", level: "Mid" },
  { title: "Brand Strategist", field: "Marketing", level: "Senior" },
  { title: "Performance Marketing Manager", field: "Marketing", level: "Mid" },
  { title: "SEO Specialist", field: "Marketing", level: "Junior" },
  { title: "Chief Technology Officer", field: "Technology", level: "Senior" },
  { title: "Chief AI Officer", field: "Technology", level: "Senior" },
  { title: "Chief Data Officer", field: "Technology", level: "Senior" },
  { title: "Technical Program Manager", field: "Technology", level: "Senior" },
  { title: "Developer Relations Engineer", field: "Technology", level: "Mid" },
  { title: "Security Architect", field: "Technology", level: "Senior" },
  { title: "Zero-Trust Security Engineer", field: "Technology", level: "Senior" },
  { title: "AI Safety Researcher", field: "Technology", level: "Senior" },
  { title: "LLM Fine-tuning Engineer", field: "Technology", level: "Senior" },
  { title: "Synthetic Data Engineer", field: "Technology", level: "Mid" },
  { title: "Knowledge Graph Engineer", field: "Technology", level: "Senior" },
  { title: "Embedded Systems Engineer", field: "Engineering", level: "Mid" },
  { title: "Photonics Engineer", field: "Engineering", level: "Senior" },
  { title: "Structural Engineer", field: "Engineering", level: "Senior" },
  { title: "Environmental Engineer", field: "Engineering", level: "Mid" },
  { title: "Forensic Engineer", field: "Engineering", level: "Senior" },
  { title: "Compliance Officer", field: "Legal", level: "Senior" },
  { title: "Corporate Lawyer", field: "Legal", level: "Senior" },
  { title: "Intellectual Property Lawyer", field: "Legal", level: "Senior" },
  { title: "Investment Analyst", field: "Finance", level: "Junior" },
  { title: "Quantitative Analyst", field: "Finance", level: "Senior" },
  { title: "Portfolio Manager", field: "Finance", level: "Senior" },
  { title: "ESG Analyst", field: "Finance", level: "Mid" },
  { title: "Actuarial Scientist", field: "Finance", level: "Senior" },
  { title: "Corporate Strategy Analyst", field: "Business", level: "Mid" },
  { title: "Operations Manager", field: "Business", level: "Senior" },
  { title: "Business Intelligence Analyst", field: "Business", level: "Mid" },
  { title: "Instructional Designer", field: "Education", level: "Mid" },
  { title: "Curriculum Developer", field: "Education", level: "Mid" },
  { title: "EdTech Product Manager", field: "Education", level: "Senior" },
  { title: "Music Producer", field: "Creative", level: "All" },
  { title: "Screenwriter", field: "Creative", level: "All" },
  { title: "Creative Director", field: "Creative", level: "Senior" },
  { title: "3D Artist", field: "Design", level: "Mid" },
  { title: "Motion Graphics Designer", field: "Design", level: "Mid" },
  { title: "Food Scientist", field: "Science", level: "Mid" },
  { title: "Agricultural Biotechnologist", field: "Biotech", level: "Senior" },
  { title: "Genomics Data Scientist", field: "Biotech", level: "Senior" },
  { title: "Public Health Officer", field: "Healthcare", level: "Senior" },
  { title: "Epidemiologist", field: "Healthcare", level: "Senior" },
  { title: "Telehealth Specialist", field: "Healthcare", level: "Mid" },
  { title: "Sports Scientist", field: "Science", level: "Mid" },
  { title: "Cognitive Scientist", field: "Science", level: "Senior" },
  { title: "Political Scientist", field: "Business", level: "Senior" },
  { title: "Economist (International Trade)", field: "Finance", level: "Senior" },
  { title: "Sociolinguist", field: "Science", level: "Senior" },
  { title: "Archaeologist", field: "Science", level: "Mid" },
  { title: "Forensic Scientist", field: "Science", level: "Mid" },
  { title: "Disaster Risk Analyst", field: "Engineering", level: "Senior" },
  { title: "Drone Systems Engineer", field: "Engineering", level: "Mid" },
  { title: "Space Mission Planner", field: "Engineering", level: "Senior" },
  { title: "Nuclear Physicist", field: "Science", level: "Senior" },
  { title: "Oceanographer", field: "Science", level: "Senior" },
];

// ─── Engine State ─────────────────────────────────────────────────
let running = false;
let totalGenerated = 0;
let startTime: Date;
const queue: Array<{ title: string; field: string; level: string }> = [];

async function generateCareerEntry(item: { title: string; field: string; level: string }): Promise<void> {
  const slug = toSlug(item.title);
  const existing = await storage.getCareer(slug);
  if (existing?.generated) return;
  if (!existing) {
    await storage.upsertCareer({ slug, title: item.title, field: item.field, level: item.level, generated: false });
  }

  const data = generateCareerData(item.title, item.field, item.level);

  await storage.upsertCareer({
    slug, title: data.title, field: data.field, level: data.level,
    skills: data.skills, salaryRange: data.salaryRange,
    demand: data.demand, summary: data.summary,
    relatedCareers: data.relatedCareers, relatedTopics: data.relatedTopics,
    fullEntry: data, generated: true, generatedAt: new Date(),
  });
  await storage.addPulseEvent("career", data.title, slug, data.field);

  for (const related of (data.relatedCareers || []).slice(0, 3)) {
    const rSlug = toSlug(related);
    const exists = await storage.getCareer(rSlug).catch(() => null);
    if (!exists) queue.push({ title: related, field: item.field, level: item.level });
  }
  totalGenerated++;
  hiveBrainOnCareer(slug, data).catch(() => {});
}

async function runLoop() {
  while (running) {
    const batch = queue.splice(0, 10);
    if (batch.length > 0) {
      const stats = await storage.getCareerStats().catch(() => ({ total: 0, generated: 0, queued: 0 }));
      console.log(`[career] [CareerEngine] ⚡ Batch ${batch.length} careers | DB: ${stats.generated}/${stats.total}`);
      await Promise.all(batch.map(item =>
        generateCareerEntry(item).catch(() => {})
      ));
      console.log(`[career] [CareerEngine] ✓ Batch done | Total generated: ${totalGenerated}`);
      await new Promise(r => setTimeout(r, 500));
    } else {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

export async function startQuantumCareerEngine() {
  if (running) return;
  running = true;
  startTime = new Date();
  console.log("[career] [CareerEngine] 🎯 CAREER ENGINE — TEMPLATE MODE — ZERO RATE LIMITS");
  for (const seed of CAREER_SEEDS) {
    const slug = toSlug(seed.title);
    const ex = await storage.getCareer(slug).catch(() => null);
    if (!ex || !ex.generated) queue.push(seed);
  }
  console.log(`[career] [CareerEngine] Seeded ${queue.length} careers to generate`);
  runLoop();
}

export function getCareerEngineStatus() {
  return { running, totalGenerated, startTime: startTime?.toISOString(), queueSize: queue.length };
}
