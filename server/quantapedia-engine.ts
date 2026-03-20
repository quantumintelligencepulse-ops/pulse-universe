import Groq from "groq-sdk";
import { storage } from "./storage";
import { log } from "./index";
import { onEntryGenerated } from "./hive-brain";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const toSlug = (q: string) =>
  q.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

const titleFromSlug = (slug: string) =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const SEED_TOPICS: { slug: string; title: string }[] = [
  { slug: "universe", title: "Universe" },
  { slug: "information", title: "Information" },
  { slug: "mathematics", title: "Mathematics" },
  { slug: "physics", title: "Physics" },
  { slug: "biology", title: "Biology" },
  { slug: "computer-science", title: "Computer Science" },
  { slug: "philosophy", title: "Philosophy" },
  { slug: "chemistry", title: "Chemistry" },
  { slug: "history", title: "History" },
  { slug: "language", title: "Language" },
  { slug: "consciousness", title: "Consciousness" },
  { slug: "artificial-intelligence", title: "Artificial Intelligence" },
  { slug: "quantum-mechanics", title: "Quantum Mechanics" },
  { slug: "evolution", title: "Evolution" },
  { slug: "democracy", title: "Democracy" },
  { slug: "economics", title: "Economics" },
  { slug: "psychology", title: "Psychology" },
  { slug: "sociology", title: "Sociology" },
  { slug: "astronomy", title: "Astronomy" },
  { slug: "neuroscience", title: "Neuroscience" },
  { slug: "genetics", title: "Genetics" },
  { slug: "ecology", title: "Ecology" },
  { slug: "calculus", title: "Calculus" },
  { slug: "thermodynamics", title: "Thermodynamics" },
  { slug: "relativity", title: "Relativity" },
  { slug: "electromagnetism", title: "Electromagnetism" },
  { slug: "machine-learning", title: "Machine Learning" },
  { slug: "dna", title: "DNA" },
  { slug: "gravity", title: "Gravity" },
  { slug: "photosynthesis", title: "Photosynthesis" },
  { slug: "civilization", title: "Civilization" },
  { slug: "ethics", title: "Ethics" },
  { slug: "logic", title: "Logic" },
  { slug: "entropy", title: "Entropy" },
  { slug: "energy", title: "Energy" },
  { slug: "time", title: "Time" },
  { slug: "space", title: "Space" },
  { slug: "matter", title: "Matter" },
  { slug: "intelligence", title: "Intelligence" },
  { slug: "knowledge", title: "Knowledge" },
  { slug: "memory", title: "Memory" },
  { slug: "freedom", title: "Freedom" },
  { slug: "justice", title: "Justice" },
  { slug: "truth", title: "Truth" },
  { slug: "love", title: "Love" },
  { slug: "creativity", title: "Creativity" },
  { slug: "culture", title: "Culture" },
  { slug: "religion", title: "Religion" },
  { slug: "mythology", title: "Mythology" },
  { slug: "art", title: "Art" },
  { slug: "music", title: "Music" },
  { slug: "literature", title: "Literature" },
];

const QP_PROMPT = (title: string) =>
  `You are QuantapediaAI — the world's most comprehensive AI knowledge engine, building the definitive knowledge substrate for humanity. Generate a complete structured knowledge entry for: "${title}"

Return ONLY a valid JSON object (no markdown, no explanation, just raw JSON) with this exact schema:
{
  "title": "canonical title",
  "type": "word|phrase|person|place|concept|event|field|organism|chemical|historical|cultural|mathematical|other",
  "pronunciation": "IPA pronunciation if applicable or empty string",
  "partOfSpeech": "noun|verb|adjective|adverb|... or empty string if not a word",
  "summary": "2-3 sentence comprehensive overview",
  "definitions": [
    {"number": 1, "text": "primary definition", "example": "usage example sentence"},
    {"number": 2, "text": "secondary definition if applicable", "example": ""}
  ],
  "etymology": "word origin and history if applicable, otherwise empty string",
  "synonyms": ["up to 8 synonyms or related terms"],
  "antonyms": ["up to 5 antonyms if applicable"],
  "relatedTerms": ["8-12 closely related concepts, terms, or topics"],
  "sections": [
    {"title": "Overview", "content": "3-4 paragraph comprehensive overview"},
    {"title": "History & Origin", "content": "historical background and development"},
    {"title": "Key Concepts", "content": "core ideas, mechanisms, or components"},
    {"title": "Applications & Significance", "content": "real-world uses and importance"},
    {"title": "Modern Context", "content": "current state, debates, and future directions"}
  ],
  "quickFacts": [
    {"label": "Category", "value": "..."},
    {"label": "Domain", "value": "..."},
    {"label": "First Known Use", "value": "..."},
    {"label": "Complexity", "value": "Beginner|Intermediate|Advanced|Expert"}
  ],
  "categories": ["3-6 category tags"],
  "seeAlso": ["6-10 related topics to explore next"]
}`;

let engineRunning = false;
let totalGenerated = 0;
let engineStartTime: Date | null = null;

export function getEngineStatus() {
  return {
    running: engineRunning,
    totalGenerated,
    startTime: engineStartTime?.toISOString() || null,
    uptime: engineStartTime ? Math.floor((Date.now() - engineStartTime.getTime()) / 1000) : 0,
  };
}

async function generateEntry(slug: string, title: string): Promise<any | null> {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: QP_PROMPT(title) }],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content || "";
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else return null;
    }

    return parsed;
  } catch (err: any) {
    if (err?.status === 429) {
      log(`[QuantapediaEngine] Rate limited — backing off 30s`, "quantapedia");
      await sleep(30000);
    }
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractDiscoveredTopics(entry: any): { slug: string; title: string }[] {
  const all: string[] = [
    ...(entry.relatedTerms || []),
    ...(entry.seeAlso || []),
    ...(entry.synonyms || []).slice(0, 4),
  ];
  return all
    .filter((t) => t && typeof t === "string" && t.length > 2 && t.length < 80)
    .map((t) => ({ slug: toSlug(t), title: t }))
    .filter((t) => t.slug.length > 2);
}

async function seedInitialTopics() {
  try {
    await storage.queueQuantapediaTopics(SEED_TOPICS);
    log(`[QuantapediaEngine] Seeded ${SEED_TOPICS.length} initial topics`, "quantapedia");
  } catch (e) {
    log(`[QuantapediaEngine] Seed error: ${e}`, "quantapedia");
  }
}

export async function startQuantapediaEngine() {
  if (engineRunning) return;
  engineRunning = true;
  engineStartTime = new Date();

  log("[QuantapediaEngine] 🧠 AUTONOMOUS KNOWLEDGE ENGINE STARTING...", "quantapedia");

  await seedInitialTopics();

  const INTERVAL_MS = 4000;

  const tick = async () => {
    if (!engineRunning) return;

    try {
      const stats = await storage.getQuantapediaStats();
      const [next] = await storage.getUngeneratedQuantapediaTopics(1);

      if (!next) {
        setTimeout(tick, 15000);
        return;
      }

      log(
        `[QuantapediaEngine] ⚡ Generating: "${next.title}" | DB: ${stats.generated}/${stats.total}`,
        "quantapedia"
      );

      const entry = await generateEntry(next.slug, next.title);

      if (entry && entry.title) {
        const discovered = extractDiscoveredTopics(entry);
        await storage.storeFullQuantapediaEntry(
          next.slug,
          entry.title || next.title,
          entry.type || "concept",
          entry.summary || "",
          entry.categories || [],
          entry.relatedTerms || [],
          entry
        );

        onEntryGenerated(next.slug, entry.title || next.title, entry).catch(() => {});

        if (discovered.length) {
          await storage.queueQuantapediaTopics(discovered);
          log(
            `[QuantapediaEngine] ✓ "${next.title}" done — queued ${discovered.length} new topics`,
            "quantapedia"
          );
        }

        totalGenerated++;
      } else {
        log(`[QuantapediaEngine] ✗ Failed to parse entry for "${next.title}"`, "quantapedia");
        await db_markFailed(next.slug);
      }
    } catch (err) {
      log(`[QuantapediaEngine] Error in tick: ${err}`, "quantapedia");
    }

    setTimeout(tick, INTERVAL_MS);
  };

  setTimeout(tick, 5000);
  log("[QuantapediaEngine] 🚀 Engine online — generating 1 entry every 4 seconds", "quantapedia");
}

async function db_markFailed(slug: string) {
  try {
    await storage.storeFullQuantapediaEntry(slug, titleFromSlug(slug), "concept", "", [], [], null);
  } catch {}
}
