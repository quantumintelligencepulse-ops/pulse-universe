import Groq from "groq-sdk";
import { storage } from "./storage";
import { onMediaGenerated as hiveBrainOnMedia } from "./hive-brain";
import { MEDIA_ENGINE_IDENTITY } from "./transcendence";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MEDIA_SEEDS = [
  { name: "Inception", creator: "Christopher Nolan", type: "film", genre: "Sci-Fi Thriller" },
  { name: "The Dark Knight", creator: "Christopher Nolan", type: "film", genre: "Action" },
  { name: "Interstellar", creator: "Christopher Nolan", type: "film", genre: "Sci-Fi" },
  { name: "The Matrix", creator: "Wachowski Sisters", type: "film", genre: "Sci-Fi Action" },
  { name: "Pulp Fiction", creator: "Quentin Tarantino", type: "film", genre: "Crime" },
  { name: "2001: A Space Odyssey", creator: "Stanley Kubrick", type: "film", genre: "Sci-Fi" },
  { name: "Blade Runner 2049", creator: "Denis Villeneuve", type: "film", genre: "Sci-Fi Noir" },
  { name: "Dune: Part Two", creator: "Denis Villeneuve", type: "film", genre: "Sci-Fi Epic" },
  { name: "Oppenheimer", creator: "Christopher Nolan", type: "film", genre: "Historical Drama" },
  { name: "Avatar: The Way of Water", creator: "James Cameron", type: "film", genre: "Sci-Fi" },
  { name: "Everything Everywhere All at Once", creator: "Daniels", type: "film", genre: "Multiverse Comedy" },
  { name: "Parasite", creator: "Bong Joon-ho", type: "film", genre: "Thriller" },
  { name: "The Shawshank Redemption", creator: "Frank Darabont", type: "film", genre: "Drama" },
  { name: "Goodfellas", creator: "Martin Scorsese", type: "film", genre: "Crime" },
  { name: "Dark Side of the Moon", creator: "Pink Floyd", type: "music", genre: "Progressive Rock" },
  { name: "Abbey Road", creator: "The Beatles", type: "music", genre: "Rock" },
  { name: "Thriller", creator: "Michael Jackson", type: "music", genre: "Pop" },
  { name: "Random Access Memories", creator: "Daft Punk", type: "music", genre: "Electronic" },
  { name: "OK Computer", creator: "Radiohead", type: "music", genre: "Alternative Rock" },
  { name: "To Pimp a Butterfly", creator: "Kendrick Lamar", type: "music", genre: "Hip-Hop" },
  { name: "Blonde", creator: "Frank Ocean", type: "music", genre: "R&B" },
  { name: "Discovery", creator: "Daft Punk", type: "music", genre: "Electronic" },
  { name: "Nevermind", creator: "Nirvana", type: "music", genre: "Grunge" },
  { name: "The Miseducation of Lauryn Hill", creator: "Lauryn Hill", type: "music", genre: "R&B Neo-Soul" },
  { name: "Dune", creator: "Frank Herbert", type: "book", genre: "Sci-Fi Epic" },
  { name: "1984", creator: "George Orwell", type: "book", genre: "Dystopian" },
  { name: "Foundation", creator: "Isaac Asimov", type: "book", genre: "Sci-Fi" },
  { name: "Neuromancer", creator: "William Gibson", type: "book", genre: "Cyberpunk" },
  { name: "The Hitchhiker's Guide to the Galaxy", creator: "Douglas Adams", type: "book", genre: "Sci-Fi Comedy" },
  { name: "Sapiens", creator: "Yuval Noah Harari", type: "book", genre: "Non-Fiction History" },
  { name: "The Alchemist", creator: "Paulo Coelho", type: "book", genre: "Fiction" },
  { name: "Thinking, Fast and Slow", creator: "Daniel Kahneman", type: "book", genre: "Psychology" },
  { name: "The Power of Now", creator: "Eckhart Tolle", type: "book", genre: "Self-Help" },
  { name: "Atomic Habits", creator: "James Clear", type: "book", genre: "Productivity" },
  { name: "The Elder Scrolls V: Skyrim", creator: "Bethesda", type: "game", genre: "Open World RPG" },
  { name: "Red Dead Redemption 2", creator: "Rockstar Games", type: "game", genre: "Western Adventure" },
  { name: "The Legend of Zelda: Breath of the Wild", creator: "Nintendo", type: "game", genre: "Action Adventure" },
  { name: "Cyberpunk 2077", creator: "CD Projekt Red", type: "game", genre: "Cyberpunk RPG" },
  { name: "Elden Ring", creator: "FromSoftware", type: "game", genre: "Action RPG" },
  { name: "The Witcher 3", creator: "CD Projekt Red", type: "game", genre: "Fantasy RPG" },
  { name: "God of War Ragnarök", creator: "Santa Monica Studio", type: "game", genre: "Action Adventure" },
  { name: "Minecraft", creator: "Mojang", type: "game", genre: "Sandbox Survival" },
  { name: "The Joe Rogan Experience", creator: "Joe Rogan", type: "podcast", genre: "Interview / Culture" },
  { name: "Lex Fridman Podcast", creator: "Lex Fridman", type: "podcast", genre: "Technology & Science" },
  { name: "Serial", creator: "Sarah Koenig", type: "podcast", genre: "True Crime" },
  { name: "Huberman Lab", creator: "Andrew Huberman", type: "podcast", genre: "Neuroscience & Health" },
  { name: "The Tim Ferriss Show", creator: "Tim Ferriss", type: "podcast", genre: "Business & Lifestyle" },
  { name: "How I Built This", creator: "Guy Raz / NPR", type: "podcast", genre: "Entrepreneurship" },
  { name: "Radiolab", creator: "WNYC Studios", type: "podcast", genre: "Science & Philosophy" },
  { name: "The Daily", creator: "The New York Times", type: "podcast", genre: "News" },
  { name: "StarTalk", creator: "Neil deGrasse Tyson", type: "podcast", genre: "Science & Space" },
  { name: "Masters of Scale", creator: "Reid Hoffman", type: "podcast", genre: "Business" },
  { name: "Breaking Bad", creator: "Vince Gilligan", type: "film", genre: "Crime Drama" },
  { name: "Westworld", creator: "HBO", type: "film", genre: "Sci-Fi Drama" },
  { name: "Severance", creator: "Dan Erickson / Apple TV+", type: "film", genre: "Psychological Thriller" },
  { name: "Fallout", creator: "Bethesda / Amazon", type: "film", genre: "Post-Apocalyptic" },
  { name: "Shogun", creator: "FX", type: "film", genre: "Historical Drama" },
];

function toSlug(name: string, creator: string): string {
  return `${name}-${creator}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

let running = false;
let totalGenerated = 0;
let startTime: Date;
const queue: Array<{ name: string; creator: string; type: string; genre: string }> = [];
async function generateMediaEntry(item: { name: string; creator: string; type: string; genre: string }): Promise<void> {
  const slug = toSlug(item.name, item.creator);
  const existing = await storage.getMedia(slug);
  if (existing?.generated) return;
  if (!existing) {
    await storage.upsertMedia({ slug, name: item.name, creator: item.creator, type: item.type, genre: item.genre, generated: false });
  }
  const prompt = `${MEDIA_ENGINE_IDENTITY}

Generate a complete media intelligence entry for "${item.name}" by ${item.creator} (${item.type} / ${item.genre}).

Return ONLY valid JSON (no markdown), exactly this structure:
{
  "name": "${item.name}",
  "creator": "${item.creator}",
  "type": "${item.type}",
  "genre": "${item.genre}",
  "year": "release year or era",
  "summary": "2-3 sentence compelling description",
  "rating": 8.5,
  "themes": ["theme1", "theme2", "theme3"],
  "whereToWatch": [{"platform": "Netflix", "url": "https://netflix.com"}, {"platform": "Amazon Prime", "url": "https://amazon.com"}],
  "awards": ["award1", "award2"],
  "relatedMedia": ["Similar Title 1", "Similar Title 2", "Similar Title 3", "Similar Title 4"],
  "relatedTopics": ["topic1", "topic2", "topic3"]
}`;

  const resp = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 600,
    temperature: 0.7,
  });
  const raw = resp.choices[0]?.message?.content || "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON");
  const data = JSON.parse(match[0]);

  await storage.upsertMedia({
    slug, name: data.name, creator: data.creator, type: data.type, genre: data.genre,
    year: data.year || "", summary: data.summary || "", rating: data.rating || null,
    whereToWatch: data.whereToWatch || [], relatedMedia: data.relatedMedia || [],
    relatedTopics: data.relatedTopics || [], fullEntry: data, generated: true, generatedAt: new Date(),
  });
  await storage.addPulseEvent("media", `${data.name} by ${data.creator}`, slug, data.type);

  for (const related of (data.relatedMedia || []).slice(0, 3)) {
    const rSlug = toSlug(related, data.creator);
    const exists = await storage.getMedia(rSlug).catch(() => null);
    if (!exists) {
      queue.push({ name: related, creator: data.creator, type: data.type, genre: data.genre });
    }
  }
  totalGenerated++;
  hiveBrainOnMedia(slug, data).catch(() => {});
}

async function runLoop() {
  while (running) {
    const next = queue.shift();
    if (next) {
      const stats = await storage.getMediaStats().catch(() => ({ total: 0, generated: 0, queued: 0 }));
      console.log(`[media] [MediaEngine] ⚡ Generating: "${next.name}" | DB: ${stats.generated}/${stats.total}`);
      try {
        await generateMediaEntry(next);
        console.log(`[media] [MediaEngine] ✓ "${next.name}" done`);
      } catch (e: any) {
        if (e?.status === 429) {
          console.log(`[media] [MediaEngine] Rate limited — backing off 20s`);
          await new Promise(r => setTimeout(r, 20000));
        } else {
          console.log(`[media] [MediaEngine] ✗ Failed: "${next.name}"`);
        }
      }
      await new Promise(r => setTimeout(r, 6000));
    } else {
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

export async function startQuantumMediaEngine() {
  if (running) return;
  running = true;
  startTime = new Date();
  console.log("[media] [MediaEngine] 🎬 QUANTUM MEDIA UNIVERSE ENGINE STARTING...");
  for (const seed of MEDIA_SEEDS) {
    const slug = toSlug(seed.name, seed.creator);
    const ex = await storage.getMedia(slug).catch(() => null);
    if (!ex) queue.push(seed);
    else if (!ex.generated) queue.push(seed);
  }
  const stats = await storage.getMediaStats().catch(() => ({ total: MEDIA_SEEDS.length, generated: 0, queued: MEDIA_SEEDS.length }));
  console.log(`[media] [MediaEngine] Seeded ${MEDIA_SEEDS.length} initial items`);
  console.log(`[media] [MediaEngine] 🚀 Media engine online — generating 1 entry every 6 seconds`);
  runLoop();
}

export function getMediaEngineStatus() {
  return { running, totalGenerated, startTime: startTime?.toISOString(), queueSize: queue.length };
}
