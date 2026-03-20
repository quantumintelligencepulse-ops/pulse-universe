import Groq from "groq-sdk";
import { storage } from "./storage";
import { log } from "./index";
import { onProductGenerated } from "./hive-brain";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const toSlug = (q: string) =>
  q.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

function makeRetailerLinks(name: string, brand: string) {
  const q = encodeURIComponent(`${brand} ${name}`.trim());
  return {
    amazon: `https://www.amazon.com/s?k=${q}`,
    walmart: `https://www.walmart.com/search?q=${q}`,
    ebay: `https://www.ebay.com/sch/i.html?_nkw=${q}`,
    target: `https://www.target.com/s?searchTerm=${q}`,
    bestbuy: `https://www.bestbuy.com/site/searchpage.jsp?st=${q}`,
    google: `https://shopping.google.com/search?q=${q}`,
  };
}

const SEED_PRODUCTS: { slug: string; name: string; brand: string; category: string }[] = [
  { slug: "apple-iphone-15-pro", name: "iPhone 15 Pro", brand: "Apple", category: "Electronics" },
  { slug: "samsung-galaxy-s24-ultra", name: "Galaxy S24 Ultra", brand: "Samsung", category: "Electronics" },
  { slug: "apple-macbook-air-m3", name: "MacBook Air M3", brand: "Apple", category: "Electronics" },
  { slug: "dell-xps-15", name: "XPS 15 Laptop", brand: "Dell", category: "Electronics" },
  { slug: "sony-wh-1000xm5", name: "WH-1000XM5 Headphones", brand: "Sony", category: "Electronics" },
  { slug: "apple-airpods-pro-2", name: "AirPods Pro 2nd Gen", brand: "Apple", category: "Electronics" },
  { slug: "samsung-65-oled-tv", name: "65\" S95C OLED 4K TV", brand: "Samsung", category: "Electronics" },
  { slug: "apple-ipad-pro-m4", name: "iPad Pro M4", brand: "Apple", category: "Electronics" },
  { slug: "logitech-mx-master-3s", name: "MX Master 3S Mouse", brand: "Logitech", category: "Electronics" },
  { slug: "nvidia-rtx-4090", name: "GeForce RTX 4090 GPU", brand: "NVIDIA", category: "Electronics" },
  { slug: "dyson-v15-detect", name: "V15 Detect Vacuum", brand: "Dyson", category: "Home & Garden" },
  { slug: "instant-pot-duo-7-in-1", name: "Duo 7-in-1 Electric Pressure Cooker", brand: "Instant Pot", category: "Home & Garden" },
  { slug: "irobot-roomba-j7", name: "Roomba j7+ Robot Vacuum", brand: "iRobot", category: "Home & Garden" },
  { slug: "kitchenaid-stand-mixer", name: "Artisan Stand Mixer", brand: "KitchenAid", category: "Home & Garden" },
  { slug: "ninja-air-fryer-xl", name: "Air Fryer XL", brand: "Ninja", category: "Home & Garden" },
  { slug: "vitamix-5200-blender", name: "5200 Professional Blender", brand: "Vitamix", category: "Home & Garden" },
  { slug: "breville-barista-express", name: "Barista Express Espresso Machine", brand: "Breville", category: "Home & Garden" },
  { slug: "dyson-airwrap-complete", name: "Airwrap Complete Styler", brand: "Dyson", category: "Beauty & Personal Care" },
  { slug: "oura-ring-gen3", name: "Ring Gen3 Health Tracker", brand: "Oura", category: "Health & Fitness" },
  { slug: "apple-watch-series-9", name: "Watch Series 9", brand: "Apple", category: "Health & Fitness" },
  { slug: "fitbit-charge-6", name: "Charge 6 Fitness Tracker", brand: "Fitbit", category: "Health & Fitness" },
  { slug: "theragun-pro", name: "PRO Percussive Therapy Device", brand: "Theragun", category: "Health & Fitness" },
  { slug: "playstation-5", name: "PlayStation 5 Console", brand: "Sony", category: "Gaming" },
  { slug: "xbox-series-x", name: "Xbox Series X Console", brand: "Microsoft", category: "Gaming" },
  { slug: "nintendo-switch-oled", name: "Switch OLED Model", brand: "Nintendo", category: "Gaming" },
  { slug: "steam-deck-oled", name: "Deck OLED Handheld", brand: "Valve", category: "Gaming" },
  { slug: "atomic-habits-book", name: "Atomic Habits", brand: "James Clear", category: "Books" },
  { slug: "dune-frank-herbert", name: "Dune (Paperback)", brand: "Frank Herbert", category: "Books" },
  { slug: "thinking-fast-and-slow", name: "Thinking, Fast and Slow", brand: "Daniel Kahneman", category: "Books" },
  { slug: "the-pragmatic-programmer", name: "The Pragmatic Programmer", brand: "David Thomas", category: "Books" },
  { slug: "tesla-model-3-accessories", name: "Model 3 Accessory Bundle", brand: "Tesla", category: "Automotive" },
  { slug: "garmin-dash-cam-67w", name: "Dash Cam 67W", brand: "Garmin", category: "Automotive" },
  { slug: "stanley-quencher-tumbler", name: "Quencher H2.0 FlowState Tumbler", brand: "Stanley", category: "Sports & Outdoors" },
  { slug: "yeti-rambler-20oz", name: "Rambler 20 oz Tumbler", brand: "YETI", category: "Sports & Outdoors" },
  { slug: "patagonia-better-sweater", name: "Better Sweater Fleece Jacket", brand: "Patagonia", category: "Clothing & Fashion" },
  { slug: "lululemon-align-leggings", name: "Align High-Rise Leggings", brand: "Lululemon", category: "Clothing & Fashion" },
  { slug: "nespresso-vertuo-next", name: "Vertuo Next Coffee Machine", brand: "Nespresso", category: "Home & Garden" },
  { slug: "ring-video-doorbell-4", name: "Video Doorbell 4", brand: "Ring", category: "Smart Home" },
  { slug: "google-nest-thermostat", name: "Nest Learning Thermostat", brand: "Google", category: "Smart Home" },
  { slug: "amazon-echo-dot-5th-gen", name: "Echo Dot 5th Gen", brand: "Amazon", category: "Smart Home" },
  { slug: "gopro-hero-12", name: "HERO12 Black Action Camera", brand: "GoPro", category: "Photography" },
  { slug: "canon-eos-r50-camera", name: "EOS R50 Mirrorless Camera", brand: "Canon", category: "Photography" },
  { slug: "anker-powerbank-26800", name: "PowerCore 26800 Portable Charger", brand: "Anker", category: "Electronics" },
  { slug: "samsung-t7-ssd", name: "T7 Portable SSD 1TB", brand: "Samsung", category: "Electronics" },
  { slug: "lg-ultragear-monitor-27", name: "UltraGear 27\" QHD Gaming Monitor", brand: "LG", category: "Electronics" },
  { slug: "bose-soundbar-900", name: "Smart Soundbar 900", brand: "Bose", category: "Electronics" },
  { slug: "instant-vortex-plus-air-fryer", name: "Vortex Plus 6-in-1 Air Fryer", brand: "Instant", category: "Home & Garden" },
  { slug: "le-creuset-dutch-oven", name: "Signature Round Dutch Oven 5.5 Qt", brand: "Le Creuset", category: "Home & Garden" },
  { slug: "hydro-flask-water-bottle", name: "Standard Mouth Water Bottle 21oz", brand: "Hydro Flask", category: "Sports & Outdoors" },
  { slug: "apple-vision-pro", name: "Vision Pro Spatial Computer", brand: "Apple", category: "Electronics" },
  { slug: "roborock-s8-pro", name: "S8 Pro Ultra Robot Vacuum", brand: "Roborock", category: "Home & Garden" },
  { slug: "kindle-oasis", name: "Oasis E-reader 7\"", brand: "Amazon Kindle", category: "Electronics" },
  { slug: "samsung-galaxy-watch-6", name: "Galaxy Watch 6 Classic", brand: "Samsung", category: "Health & Fitness" },
  { slug: "weber-spirit-grill", name: "Spirit II E-310 3-Burner Grill", brand: "Weber", category: "Home & Garden" },
  { slug: "lego-technic-bugatti", name: "Technic Bugatti Bolide", brand: "LEGO", category: "Toys & Games" },
  { slug: "cuisinart-coffee-maker", name: "Programmable Coffee Maker 14-Cup", brand: "Cuisinart", category: "Home & Garden" },
  { slug: "under-armour-hovr-shoes", name: "HOVR Phantom 3 Running Shoes", brand: "Under Armour", category: "Sporting Goods" },
  { slug: "razer-blade-15-laptop", name: "Blade 15 Gaming Laptop", brand: "Razer", category: "Electronics" },
  { slug: "philips-hue-starter-kit", name: "Hue White & Color Ambiance Starter Kit", brand: "Philips Hue", category: "Smart Home" },
  { slug: "meta-quest-3", name: "Quest 3 VR Headset", brand: "Meta", category: "Electronics" },
  { slug: "ember-smart-mug-2", name: "Smart Mug 2 Temperature Control", brand: "Ember", category: "Home & Garden" },
];

const PRODUCT_PROMPT = (name: string, brand: string, category: string) =>
  `You are QuantumShopAI — the world's most comprehensive AI product intelligence engine. Generate a complete structured product entry for: "${brand} ${name}" (Category: ${category})

Return ONLY a valid JSON object (no markdown, no explanation, just raw JSON):
{
  "name": "full product name",
  "brand": "${brand}",
  "category": "${category}",
  "subcategory": "specific subcategory",
  "priceRange": "approximate price range e.g. $49–$79",
  "summary": "2-3 sentence compelling product summary",
  "description": "4-5 paragraph detailed product description covering what it is, who it is for, why it is worth buying",
  "keyFeatures": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5", "feature 6"],
  "pros": ["pro 1", "pro 2", "pro 3", "pro 4"],
  "cons": ["con 1", "con 2", "con 3"],
  "specs": {"key spec name": "value", "another spec": "value"},
  "idealFor": ["use case 1", "use case 2", "use case 3"],
  "alternatives": ["Alternative Product 1", "Alternative Product 2", "Alternative Product 3"],
  "relatedProducts": ["Related Product Name 1", "Related Product 2", "Related Product 3", "Related Product 4"],
  "relatedTopics": ["Quantapedia topic 1", "Quantapedia topic 2", "Quantapedia topic 3"],
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "rating": 4.5,
  "reviewSummary": "Summary of what customers love and criticize"
}`;

let productEngineRunning = false;
let totalProductsGenerated = 0;
let productEngineStartTime: Date | null = null;

export function getProductEngineStatus() {
  return {
    running: productEngineRunning,
    totalGenerated: totalProductsGenerated,
    startTime: productEngineStartTime?.toISOString() || null,
    uptime: productEngineStartTime ? Math.floor((Date.now() - productEngineStartTime.getTime()) / 1000) : 0,
  };
}

async function generateProduct(slug: string, name: string, brand: string, category: string): Promise<any | null> {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: PRODUCT_PROMPT(name, brand, category) }],
      max_tokens: 1800,
      temperature: 0.4,
    });
    const raw = completion.choices[0]?.message?.content || "";
    try { return JSON.parse(raw); } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      return null;
    }
  } catch (err: any) {
    if (err?.status === 429) { await sleep(30000); }
    return null;
  }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function extractRelatedProducts(product: any): { slug: string; name: string; brand: string; category: string }[] {
  const all: string[] = [...(product.relatedProducts || []), ...(product.alternatives || [])];
  return all.filter(n => n && n.length > 2 && n.length < 100).slice(0, 8).map(n => ({
    slug: toSlug(n), name: n, brand: "", category: product.category || "General"
  }));
}

async function seedProducts() {
  const toQueue = SEED_PRODUCTS.map(p => ({ slug: p.slug, name: p.name, brand: p.brand, category: p.category }));
  await storage.queueQuantumProducts(toQueue);
  log(`[ProductEngine] Seeded ${SEED_PRODUCTS.length} initial products`, "product");
}

export async function startQuantumProductEngine() {
  if (productEngineRunning) return;
  productEngineRunning = true;
  productEngineStartTime = new Date();
  log("[ProductEngine] 🛒 QUANTUM SHOPPING UNIVERSE ENGINE STARTING...", "product");
  await seedProducts();

  const INTERVAL_MS = 5000;
  const tick = async () => {
    if (!productEngineRunning) return;
    try {
      const stats = await storage.getQuantumProductStats();
      const [next] = await storage.getUngeneratedProducts(1);
      if (!next) { setTimeout(tick, 20000); return; }

      log(`[ProductEngine] ⚡ Generating: "${next.name}" | DB: ${stats.generated}/${stats.total}`, "product");
      const product = await generateProduct(next.slug, next.name, next.brand || "", next.category || "General");

      if (product && product.name) {
        const links = makeRetailerLinks(next.name, next.brand || "");
        await storage.storeFullProduct(next.slug, {
          name: product.name || next.name,
          brand: product.brand || next.brand || "",
          category: product.category || next.category || "General",
          subcategory: product.subcategory || "",
          priceRange: product.priceRange || "",
          summary: product.summary || "",
          categories: product.tags || [],
          relatedProducts: product.relatedProducts || [],
          relatedTopics: product.relatedTopics || [],
          retailerLinks: links,
          fullProduct: { ...product, retailerLinks: links },
        });

        onProductGenerated(next.slug, { ...product, retailerLinks: links }).catch(() => {});

        const discovered = extractRelatedProducts(product);
        if (discovered.length) {
          await storage.queueQuantumProducts(discovered);
          log(`[ProductEngine] ✓ "${next.name}" done — queued ${discovered.length} new products`, "product");
        }
        totalProductsGenerated++;
      } else {
        log(`[ProductEngine] ✗ Failed to parse product for "${next.name}"`, "product");
        await storage.markProductFailed(next.slug, next.name, next.brand || "", next.category || "General");
      }
    } catch (err) {
      log(`[ProductEngine] Error in tick: ${err}`, "product");
    }
    setTimeout(tick, INTERVAL_MS);
  };

  setTimeout(tick, 8000);
  log("[ProductEngine] 🚀 Product engine online — generating 1 product every 5 seconds", "product");
}
