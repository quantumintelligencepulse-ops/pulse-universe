import { storage } from "./storage";
import { onMediaGenerated as hiveBrainOnMedia } from "./hive-brain";

function toSlug(name: string, creator: string = ""): string {
  const combined = creator ? `${name}-${creator}` : name;
  return combined.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));
}

const RATINGS = ["7.2","7.5","7.8","8.0","8.1","8.3","8.5","8.7","8.9","9.0","9.1","9.2","9.3"];
const YEARS_FILM = ["1994","1999","2000","2003","2005","2008","2010","2012","2014","2016","2017","2018","2019","2020","2021","2022","2023","2024"];
const YEARS_SHOW = ["2010","2012","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023","2024"];
const YEARS_MUSIC = ["1975","1980","1985","1990","1995","2000","2003","2005","2008","2010","2012","2014","2016","2018","2020","2022","2024"];

const WHERE_TO_WATCH_BY_TYPE: Record<string, string[]> = {
  film: ["Netflix","Amazon Prime","HBO Max","Disney+","Apple TV+","Hulu","Theaters","Peacock"],
  show: ["Netflix","HBO Max","Amazon Prime","Apple TV+","Hulu","Disney+","Peacock"],
  documentary: ["Netflix","HBO Max","Amazon Prime","YouTube","Apple TV+","PBS"],
  anime: ["Crunchyroll","Funimation","Netflix","Hulu","Amazon Prime","HiDive"],
  book: ["Amazon","Kindle","Audible","Local library","Barnes & Noble","Apple Books","Scribd"],
  album: ["Spotify","Apple Music","YouTube Music","Tidal","Amazon Music","Bandcamp"],
  podcast: ["Spotify","Apple Podcasts","Google Podcasts","Pocket Casts","Overcast"],
  game: ["Steam","Epic Games","PlayStation Store","Xbox Game Pass","Nintendo eShop","GOG"],
  course: ["Coursera","Udemy","edX","YouTube","Skillshare","MasterClass"],
};

const FILM_DIRECTORS = ["Christopher Nolan","Denis Villeneuve","Martin Scorsese","David Fincher","Quentin Tarantino","Alfonso Cuarón","Ridley Scott","Steven Spielberg","James Cameron","Paul Thomas Anderson","Wes Anderson","Darren Aronofsky","Guillermo del Toro","Bong Joon-ho","Park Chan-wook","Wong Kar-wai","Akira Kurosawa","Stanley Kubrick","Francis Ford Coppola","Jordan Peele","Ava DuVernay","Greta Gerwig","Barry Jenkins","Sofia Coppola","Kathryn Bigelow"];
const SHOW_CREATORS = ["David Chase","Vince Gilligan","David Simon","Matthew Weiner","Shonda Rhimes","Ryan Murphy","Steven Moffat","J.J. Abrams","Chuck Lorre","Greg Daniels","Aaron Sorkin","David Milch","Kurt Sutter","Tom Fontana","Chris Carter","Craig Mazin","Jesse Armstrong","Charlie Brooker","Damon Lindelof","David Lynch"];
const MUSICIANS = ["Kendrick Lamar","Taylor Swift","Beyoncé","Frank Ocean","Kanye West","Radiohead","The Beatles","Pink Floyd","Led Zeppelin","David Bowie","Prince","Michael Jackson","Bob Dylan","Joni Mitchell","Miles Davis","John Coltrane","Daft Punk","Aphex Twin","Tyler the Creator","SZA","Billie Eilish","Lana Del Rey","Arctic Monkeys","LCD Soundsystem","Nirvana","Nas","Eminem","Jay-Z","Kate Bush","My Bloody Valentine"];
const AUTHORS = ["Toni Morrison","James Baldwin","Gabriel García Márquez","Fyodor Dostoevsky","Leo Tolstoy","Jorge Luis Borges","Haruki Murakami","Cormac McCarthy","Don DeLillo","David Foster Wallace","Thomas Pynchon","Ursula K. Le Guin","Philip K. Dick","Isaac Asimov","Frank Herbert","George Orwell","Aldous Huxley","Virginia Woolf","Franz Kafka","Albert Camus","Chinua Achebe","Chimamanda Ngozi Adichie","Kazuo Ishiguro","Salman Rushdie","Yuval Noah Harari","Daniel Kahneman"];
const GAME_DEVS = ["Naughty Dog","CD Projekt RED","Rockstar Games","Valve","Nintendo","FromSoftware","Bethesda Game Studios","Blizzard Entertainment","Riot Games","Epic Games","Insomniac Games","Bungie","Kojima Productions","Supergiant Games","Playdead","Thatgamecompany","ZA/UM","Team Cherry","Maddy Thorson","Arkane Studios"];

const FILM_GENRES = ["Sci-Fi Thriller","Action","Crime Drama","Psychological Thriller","Epic Drama","Science Fiction","Noir","Historical Drama","Horror","Comedy Drama","Fantasy","War Film","Biopic","Mystery"];
const SHOW_GENRES = ["Drama","Crime","Sci-Fi","Fantasy","Comedy","Thriller","Documentary Series","Limited Series","Animation","Anthology","Political Drama","Medical Drama"];
const MUSIC_GENRES = ["Hip-Hop","Alternative Rock","Electronic","R&B","Jazz","Classical","Pop","Soul","Folk","Ambient","Experimental","Punk","Metal","Country","Blues","Neo-Soul","Indie Pop","Synthwave","Shoegaze","Art Rock"];
const BOOK_GENRES = ["Literary Fiction","Science Fiction","Philosophy","Biography","History","Business","Self-Help","Mystery","Fantasy","Historical Fiction","Politics","Science","Psychology","Economics","Memoir"];
const GAME_GENRES = ["Action RPG","Open World","Strategy","First-Person Shooter","Puzzle","Adventure","Simulation","Horror","Fighting","Roguelike","Metroidvania","Narrative","Survival"];

function getCreator(type: string): string {
  if (type === "film" || type === "documentary") return pick(FILM_DIRECTORS);
  if (type === "show" || type === "anime") return pick(SHOW_CREATORS);
  if (type === "album" || type === "podcast") return pick(MUSICIANS);
  if (type === "book") return pick(AUTHORS);
  if (type === "game") return pick(GAME_DEVS);
  return pick(FILM_DIRECTORS);
}

function getGenre(type: string): string {
  if (type === "show") return pick(SHOW_GENRES);
  if (type === "album") return pick(MUSIC_GENRES);
  if (type === "book") return pick(BOOK_GENRES);
  if (type === "game") return pick(GAME_GENRES);
  if (type === "documentary") return "Documentary";
  if (type === "anime") return pick(["Action","Fantasy","Sci-Fi","Romance","Psychological"]);
  return pick(FILM_GENRES);
}

const SUMMARIES: Record<string, (name: string, creator: string, genre: string) => string> = {
  film: (n, c, g) => pick([
    `${n} is a landmark ${g} film by ${c}, celebrated for its narrative depth and visual craft. A defining work of contemporary cinema.`,
    `Directed by ${c}, ${n} reimagines ${g} with extraordinary ambition. Critics and audiences alike call it essential viewing.`,
    `${n} represents ${c}'s artistic peak — a ${g} masterwork that challenges, moves, and rewards attentive viewers.`,
    `A genre-defining ${g} experience from ${c}. ${n} sets new standards for cinematic storytelling.`,
  ]),
  show: (n, c, g) => pick([
    `${n} is a critically acclaimed ${g} series by ${c}, praised for complex characters and bold narrative ambition.`,
    `From ${c}, ${n} elevates ${g} television with sophisticated writing. Its influence on the medium is undeniable.`,
    `${n} broke new ground in ${g} television. ${c}'s vision and the cast's performances set new standards.`,
  ]),
  album: (n, c, g) => pick([
    `${n} by ${c} is a defining ${g} record, blending intricate production with deeply personal artistry.`,
    `When ${c} released ${n}, it marked a pivotal moment in ${g} history — fearless, emotional, legendary.`,
    `${n} stands as one of ${c}'s most ambitious works. Its cultural resonance ensures an enduring legacy.`,
  ]),
  book: (n, c, g) => pick([
    `${n} by ${c} is a landmark ${g} work exploring the deepest questions of human existence with extraordinary clarity.`,
    `Considered ${c}'s masterpiece, ${n} combines intellectual rigor with literary beauty in the ${g} tradition.`,
    `${n} represents ${g} at its most ambitious. ${c}'s prose makes complex ideas accessible and profound.`,
  ]),
  game: (n, c, g) => pick([
    `${n} by ${c} is a groundbreaking ${g} experience that redefined what games can achieve as art and narrative.`,
    `${c}'s ${n} set new standards for ${g} design — an expansive, realized world that remains a generational achievement.`,
    `${n} raised the bar for the entire ${g} genre. ${c}'s craft across mechanics and narrative produced something timeless.`,
  ]),
  documentary: (n, c, g) => pick([
    `${n} directed by ${c} is an essential ${g} documentary that challenges viewers to rethink what they know.`,
    `${c}'s ${n} is the definitive documentary on its subject, blending rigorous research with compelling storytelling.`,
  ]),
  anime: (n, c, g) => pick([
    `${n} from ${c} is a landmark ${g} anime that redefined the medium's possibilities through stunning visuals and storytelling.`,
    `${c}'s ${n} stands as one of the greatest ${g} anime ever made — emotionally resonant and technically masterful.`,
  ]),
};

function generateMediaData(name: string, creator: string, type: string, genre: string): any {
  const year = type === "album" ? pick(YEARS_MUSIC) : type === "show" ? pick(YEARS_SHOW) : pick(YEARS_FILM);
  const summaryFn = SUMMARIES[type] || SUMMARIES.film;
  const summary = summaryFn(name, creator, genre);
  const whereToWatch = pickN(WHERE_TO_WATCH_BY_TYPE[type] || WHERE_TO_WATCH_BY_TYPE.film, 4);
  const rating = parseFloat(pick(RATINGS));
  const relatedMedia = [`Best ${genre} ${type}s`, `${creator}'s Other Works`, `Essential ${genre}`, `${year}s ${type} Collection`].slice(0, 4);
  const relatedTopics = [genre, `${type} industry`, creator, "Entertainment", "Art", `${genre} history`].slice(0, 5);
  return { name, creator, type, genre, year, summary, rating, whereToWatch, relatedMedia, relatedTopics };
}

const MEDIA_SEEDS: Array<{ name: string; creator: string; type: string; genre: string }> = [
  { name: "Inception", creator: "Christopher Nolan", type: "film", genre: "Sci-Fi Thriller" },
  { name: "The Dark Knight", creator: "Christopher Nolan", type: "film", genre: "Action" },
  { name: "Interstellar", creator: "Christopher Nolan", type: "film", genre: "Sci-Fi" },
  { name: "The Matrix", creator: "Wachowski Sisters", type: "film", genre: "Sci-Fi Action" },
  { name: "Pulp Fiction", creator: "Quentin Tarantino", type: "film", genre: "Crime" },
  { name: "2001: A Space Odyssey", creator: "Stanley Kubrick", type: "film", genre: "Sci-Fi" },
  { name: "Blade Runner 2049", creator: "Denis Villeneuve", type: "film", genre: "Sci-Fi Noir" },
  { name: "Arrival", creator: "Denis Villeneuve", type: "film", genre: "Sci-Fi Drama" },
  { name: "Breaking Bad", creator: "Vince Gilligan", type: "show", genre: "Crime Drama" },
  { name: "The Sopranos", creator: "David Chase", type: "show", genre: "Crime Drama" },
  { name: "The Wire", creator: "David Simon", type: "show", genre: "Crime Drama" },
  { name: "Chernobyl", creator: "Craig Mazin", type: "show", genre: "Historical Drama" },
  { name: "Black Mirror", creator: "Charlie Brooker", type: "show", genre: "Sci-Fi Anthology" },
  { name: "Succession", creator: "Jesse Armstrong", type: "show", genre: "Drama" },
  { name: "True Detective Season 1", creator: "Nic Pizzolatto", type: "show", genre: "Crime Drama" },
  { name: "Mad Men", creator: "Matthew Weiner", type: "show", genre: "Period Drama" },
  { name: "Game of Thrones", creator: "David Benioff", type: "show", genre: "Fantasy" },
  { name: "Twin Peaks", creator: "David Lynch", type: "show", genre: "Mystery" },
  { name: "To Pimp a Butterfly", creator: "Kendrick Lamar", type: "album", genre: "Hip-Hop" },
  { name: "DAMN.", creator: "Kendrick Lamar", type: "album", genre: "Hip-Hop" },
  { name: "OK Computer", creator: "Radiohead", type: "album", genre: "Alternative Rock" },
  { name: "Kid A", creator: "Radiohead", type: "album", genre: "Art Rock" },
  { name: "Kind of Blue", creator: "Miles Davis", type: "album", genre: "Jazz" },
  { name: "The Dark Side of the Moon", creator: "Pink Floyd", type: "album", genre: "Progressive Rock" },
  { name: "Sgt. Pepper's", creator: "The Beatles", type: "album", genre: "Psychedelic Rock" },
  { name: "Blonde", creator: "Frank Ocean", type: "album", genre: "R&B" },
  { name: "My Beautiful Dark Twisted Fantasy", creator: "Kanye West", type: "album", genre: "Hip-Hop" },
  { name: "Lemonade", creator: "Beyoncé", type: "album", genre: "Pop R&B" },
  { name: "Nevermind", creator: "Nirvana", type: "album", genre: "Grunge" },
  { name: "Hounds of Love", creator: "Kate Bush", type: "album", genre: "Art Pop" },
  { name: "Loveless", creator: "My Bloody Valentine", type: "album", genre: "Shoegaze" },
  { name: "Illmatic", creator: "Nas", type: "album", genre: "Hip-Hop" },
  { name: "The College Dropout", creator: "Kanye West", type: "album", genre: "Hip-Hop" },
  { name: "1984", creator: "George Orwell", type: "book", genre: "Dystopian Fiction" },
  { name: "Dune", creator: "Frank Herbert", type: "book", genre: "Science Fiction" },
  { name: "Crime and Punishment", creator: "Fyodor Dostoevsky", type: "book", genre: "Literary Fiction" },
  { name: "Thinking, Fast and Slow", creator: "Daniel Kahneman", type: "book", genre: "Psychology" },
  { name: "Sapiens", creator: "Yuval Noah Harari", type: "book", genre: "History" },
  { name: "One Hundred Years of Solitude", creator: "Gabriel García Márquez", type: "book", genre: "Magic Realism" },
  { name: "The Brothers Karamazov", creator: "Fyodor Dostoevsky", type: "book", genre: "Literary Fiction" },
  { name: "Infinite Jest", creator: "David Foster Wallace", type: "book", genre: "Literary Fiction" },
  { name: "Neuromancer", creator: "William Gibson", type: "book", genre: "Cyberpunk" },
  { name: "The Left Hand of Darkness", creator: "Ursula K. Le Guin", type: "book", genre: "Sci-Fi" },
  { name: "Brave New World", creator: "Aldous Huxley", type: "book", genre: "Dystopian Fiction" },
  { name: "The Hitchhiker's Guide to the Galaxy", creator: "Douglas Adams", type: "book", genre: "Sci-Fi Comedy" },
  { name: "The Legend of Zelda: Breath of the Wild", creator: "Nintendo", type: "game", genre: "Open World" },
  { name: "The Last of Us", creator: "Naughty Dog", type: "game", genre: "Action Adventure" },
  { name: "Red Dead Redemption 2", creator: "Rockstar Games", type: "game", genre: "Open World" },
  { name: "Elden Ring", creator: "FromSoftware", type: "game", genre: "Action RPG" },
  { name: "Portal 2", creator: "Valve", type: "game", genre: "Puzzle" },
  { name: "Hollow Knight", creator: "Team Cherry", type: "game", genre: "Metroidvania" },
  { name: "Celeste", creator: "Maddy Thorson", type: "game", genre: "Platformer" },
  { name: "Disco Elysium", creator: "ZA/UM", type: "game", genre: "RPG" },
  { name: "Hades", creator: "Supergiant Games", type: "game", genre: "Roguelike" },
  { name: "Inside", creator: "Playdead", type: "game", genre: "Puzzle" },
  { name: "The Social Dilemma", creator: "Jeff Orlowski", type: "documentary", genre: "Technology" },
  { name: "Free Solo", creator: "Jimmy Chin", type: "documentary", genre: "Sports" },
  { name: "Planet Earth II", creator: "David Attenborough", type: "documentary", genre: "Nature" },
  { name: "Won't You Be My Neighbor?", creator: "Morgan Neville", type: "documentary", genre: "Biography" },
  { name: "Seaspiracy", creator: "Ali Tabrizi", type: "documentary", genre: "Environment" },
  { name: "Fullmetal Alchemist: Brotherhood", creator: "Bones Studio", type: "anime", genre: "Action Fantasy" },
  { name: "Attack on Titan", creator: "MAPPA", type: "anime", genre: "Action Drama" },
  { name: "Neon Genesis Evangelion", creator: "Gainax", type: "anime", genre: "Psychological" },
  { name: "Akira", creator: "Katsuhiro Otomo", type: "anime", genre: "Cyberpunk" },
  { name: "Cowboy Bebop", creator: "Sunrise", type: "anime", genre: "Space Western" },
  { name: "Death Note", creator: "Madhouse", type: "anime", genre: "Psychological Thriller" },
  { name: "Spirited Away", creator: "Studio Ghibli", type: "film", genre: "Fantasy Animation" },
  { name: "Parasite", creator: "Bong Joon-ho", type: "film", genre: "Thriller" },
  { name: "The Godfather", creator: "Francis Ford Coppola", type: "film", genre: "Crime Drama" },
  { name: "Schindler's List", creator: "Steven Spielberg", type: "film", genre: "Historical Drama" },
  { name: "No Country for Old Men", creator: "Coen Brothers", type: "film", genre: "Thriller" },
  { name: "There Will Be Blood", creator: "Paul Thomas Anderson", type: "film", genre: "Drama" },
  { name: "Children of Men", creator: "Alfonso Cuarón", type: "film", genre: "Sci-Fi Drama" },
  { name: "The Grand Budapest Hotel", creator: "Wes Anderson", type: "film", genre: "Comedy Drama" },
  { name: "The Shining", creator: "Stanley Kubrick", type: "film", genre: "Horror" },
  { name: "Oldboy", creator: "Park Chan-wook", type: "film", genre: "Thriller" },
  { name: "In the Mood for Love", creator: "Wong Kar-wai", type: "film", genre: "Romance Drama" },
];

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
  const data = generateMediaData(item.name, item.creator, item.type, item.genre);
  await storage.upsertMedia({
    slug, name: data.name, creator: data.creator, type: data.type, genre: data.genre,
    year: data.year, summary: data.summary, rating: data.rating,
    whereToWatch: data.whereToWatch, relatedMedia: data.relatedMedia,
    relatedTopics: data.relatedTopics, fullEntry: data, generated: true, generatedAt: new Date(),
  });
  await storage.addPulseEvent("media", `${data.name} by ${data.creator}`, slug, data.type);
  for (const related of (data.relatedMedia || []).slice(0, 2)) {
    const rCreator = getCreator(item.type);
    const rGenre = getGenre(item.type);
    const rSlug = toSlug(related, rCreator);
    const exists = await storage.getMedia(rSlug).catch(() => null);
    if (!exists) queue.push({ name: related, creator: rCreator, type: item.type, genre: rGenre });
  }
  totalGenerated++;
  hiveBrainOnMedia(slug, data).catch(() => {});
}

async function runLoop() {
  while (running) {
    const batch = queue.splice(0, 10);
    if (batch.length > 0) {
      const stats = await storage.getMediaStats().catch(() => ({ total: 0, generated: 0, queued: 0 }));
      console.log(`[media] [MediaEngine] ⚡ Batch ${batch.length} | DB: ${stats.generated}/${stats.total}`);
      await Promise.all(batch.map(item => generateMediaEntry(item).catch(() => {})));
      console.log(`[media] [MediaEngine] ✓ Done | Total: ${totalGenerated}`);
      await new Promise(r => setTimeout(r, 500));
    } else {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

export async function startQuantumMediaEngine() {
  if (running) return;
  running = true;
  startTime = new Date();
  console.log("[media] [MediaEngine] 🎬 MEDIA ENGINE — TEMPLATE MODE — ZERO RATE LIMITS");
  for (const seed of MEDIA_SEEDS) {
    const slug = toSlug(seed.name, seed.creator);
    const ex = await storage.getMedia(slug).catch(() => null);
    if (!ex || !ex.generated) queue.push(seed);
  }
  console.log(`[media] [MediaEngine] Seeded ${queue.length} entries to generate`);
  runLoop();
}

export function getMediaEngineStatus() {
  return { running, totalGenerated, startTime: startTime?.toISOString(), queueSize: queue.length };
}
