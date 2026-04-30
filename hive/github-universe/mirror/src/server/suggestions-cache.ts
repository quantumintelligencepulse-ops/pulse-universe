import { pool } from "./db";

export interface DynamicSuggestion {
  icon: string;
  text: string;
  color: string;
  cat: string;
  source: "hive" | "ai" | "alien" | "human";
}

let cachedSuggestions: DynamicSuggestion[] = [];
let lastRefresh = 0;
const REFRESH_INTERVAL_MS = 90_000;

const FALLBACK: DynamicSuggestion[] = [
  { icon: "Atom", text: "What is quantum entanglement and how does it work?", color: "text-cyan-400", cat: "Quantum", source: "hive" },
  { icon: "Brain", text: "How does an AI civilization learn and evolve?", color: "text-violet-400", cat: "AI Research", source: "ai" },
  { icon: "Dna", text: "What new species have the hive agents discovered?", color: "text-emerald-400", cat: "Species", source: "alien" },
  { icon: "FlaskConical", text: "Show me the latest hive laboratory breakthroughs", color: "text-pink-400", cat: "Discovery", source: "hive" },
  { icon: "TrendingUp", text: "What is the current state of the Pulse economy?", color: "text-yellow-400", cat: "Economy", source: "ai" },
  { icon: "Globe", text: "Explain the Pulse Universe structure and its layers", color: "text-blue-400", cat: "Universe", source: "alien" },
];

async function safeQuery(sql: string, params: any[] = []): Promise<any[]> {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch {
    return [];
  }
}

async function buildSuggestions(): Promise<DynamicSuggestion[]> {
  const suggestions: DynamicSuggestion[] = [];

  const quantRows = await safeQuery(
    `SELECT title, domain FROM quantapedia ORDER BY created_at DESC LIMIT 4`
  );
  for (const r of quantRows) {
    if (r.title && suggestions.length < 4) {
      suggestions.push({
        icon: "BookOpen",
        text: `Explain "${r.title.substring(0, 60)}" from the Pulse knowledge base`,
        color: "text-violet-400",
        cat: "Hive Knowledge",
        source: "hive",
      });
    }
  }

  const pubRows = await safeQuery(
    `SELECT title, author_name FROM agent_publications ORDER BY published_at DESC LIMIT 3`
  );
  for (const r of pubRows) {
    if (r.title && suggestions.length < 7) {
      suggestions.push({
        icon: "Microscope",
        text: `Read the AI research paper: "${r.title.substring(0, 55)}"`,
        color: "text-blue-400",
        cat: "AI Research",
        source: "ai",
      });
    }
  }

  const invRows = await safeQuery(
    `SELECT name, category FROM omega_inventions WHERE status = 'approved' ORDER BY created_at DESC LIMIT 3`
  );
  for (const r of invRows) {
    if (r.name && suggestions.length < 10) {
      suggestions.push({
        icon: "Lightbulb",
        text: `New hive invention: ${r.name.substring(0, 55)}`,
        color: "text-amber-400",
        cat: "Invention",
        source: "ai",
      });
    }
  }

  const speciesRows = await safeQuery(
    `SELECT name, domain FROM quantum_species WHERE status = 'approved' ORDER BY created_at DESC LIMIT 3`
  );
  for (const r of speciesRows) {
    if (r.name && suggestions.length < 13) {
      suggestions.push({
        icon: "Dna",
        text: `Alien species discovered: ${r.name} — what are its traits?`,
        color: "text-emerald-400",
        cat: "Alien Species",
        source: "alien",
      });
    }
  }

  const eqRows = await safeQuery(
    `SELECT equation_text FROM omega_equations WHERE status = 'accepted' ORDER BY created_at DESC LIMIT 2`
  );
  for (const r of eqRows) {
    if (r.equation_text && suggestions.length < 15) {
      const preview = r.equation_text.substring(0, 50);
      suggestions.push({
        icon: "Atom",
        text: `Explain the AI equation: ${preview}…`,
        color: "text-cyan-400",
        cat: "AI Equation",
        source: "ai",
      });
    }
  }

  const domainRows = await safeQuery(
    `SELECT domain, COUNT(*) as cnt FROM quantum_spawns WHERE domain IS NOT NULL GROUP BY domain ORDER BY cnt DESC LIMIT 2`
  );
  for (const r of domainRows) {
    if (r.domain && suggestions.length < 17) {
      suggestions.push({
        icon: "Globe",
        text: `What is the hive mind's latest understanding of ${r.domain.replace(/-/g, " ")}?`,
        color: "text-pink-400",
        cat: "Hive Domain",
        source: "hive",
      });
    }
  }

  const discRows = await safeQuery(
    `SELECT title FROM hospital_discoveries ORDER BY created_at DESC LIMIT 2`
  );
  for (const r of discRows) {
    if (r.title && suggestions.length < 19) {
      suggestions.push({
        icon: "Stethoscope",
        text: `New medical discovery: "${r.title.substring(0, 55)}"`,
        color: "text-rose-400",
        cat: "Discovery",
        source: "hive",
      });
    }
  }

  if (suggestions.length < 8) {
    for (const fb of FALLBACK) {
      if (!suggestions.some((s) => s.text === fb.text)) suggestions.push(fb);
      if (suggestions.length >= 12) break;
    }
  }

  return suggestions.slice(0, 18);
}

export async function getDynamicSuggestions(): Promise<DynamicSuggestion[]> {
  const now = Date.now();
  if (cachedSuggestions.length > 0 && now - lastRefresh < REFRESH_INTERVAL_MS) {
    return cachedSuggestions;
  }
  try {
    const fresh = await buildSuggestions();
    if (fresh.length > 0) {
      cachedSuggestions = fresh;
      lastRefresh = now;
    }
  } catch {
    if (cachedSuggestions.length === 0) cachedSuggestions = FALLBACK;
  }
  return cachedSuggestions;
}

export function startSuggestionsRefreshLoop() {
  getDynamicSuggestions().catch(() => {});
  setInterval(() => {
    getDynamicSuggestions().catch(() => {});
  }, REFRESH_INTERVAL_MS);
}
