import { storage } from "./storage";
import { log } from "./index";
import { onProductGenerated } from "./hive-brain";

const toSlug = (q: string) =>
  q.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));
}

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

// ─── Template-based product generator ────────────────────────────
const PRICE_RANGES_BY_CATEGORY: Record<string, string[]> = {
  Electronics: ["$49–$149", "$149–$499", "$499–$999", "$999–$2,499", "$2,499–$5,000+"],
  "Home & Garden": ["$19–$49", "$49–$149", "$149–$499", "$499–$1,200"],
  "Health & Fitness": ["$29–$99", "$99–$299", "$299–$799"],
  Gaming: ["$29–$79", "$79–$299", "$299–$699"],
  Books: ["$9.99–$24.99", "$14.99–$39.99"],
  Automotive: ["$19–$99", "$99–$499", "$499–$2,000+"],
  "Sports & Outdoors": ["$19–$79", "$79–$249", "$249–$799"],
  "Clothing & Fashion": ["$24.99–$79.99", "$79.99–$249", "$249–$999"],
  "Beauty & Personal Care": ["$9.99–$49.99", "$49.99–$199", "$199–$599"],
  "Food & Grocery": ["$4.99–$19.99", "$19.99–$59.99"],
  Toys: ["$9.99–$49.99", "$49.99–$149", "$149–$399"],
  "Office & Productivity": ["$19.99–$99", "$99–$499", "$499–$2,000"],
  General: ["$24.99–$99", "$99–$299", "$299–$799"],
};

const PROS_BY_CATEGORY: Record<string, string[]> = {
  Electronics: ["Premium build quality", "Exceptional performance", "Intuitive interface", "Long battery life", "Seamless ecosystem integration", "Fast charging support", "High-resolution display", "Advanced noise cancellation", "Industry-leading processing speed", "Excellent value for money"],
  "Home & Garden": ["Energy-efficient design", "Easy to clean", "Smart home compatible", "Whisper-quiet operation", "Compact and space-saving", "Durable construction", "Multiple attachment options", "Programmable settings", "Excellent suction power", "Premium materials"],
  "Health & Fitness": ["Accurate health tracking", "Comfortable for all-day wear", "Comprehensive app ecosystem", "Long battery life", "Water-resistant design", "Personalized coaching", "Medical-grade sensors", "Stylish design options"],
  Gaming: ["High refresh rate", "Low latency", "Immersive haptic feedback", "Vast game library", "Backward compatibility", "Customizable controls", "Excellent graphics performance", "Multi-platform support"],
  General: ["High quality materials", "Excellent customer support", "Long-lasting durability", "Great value for price", "Intuitive design", "Wide availability", "Strong warranty", "Eco-friendly packaging"],
};

const CONS_BY_CATEGORY: Record<string, string[]> = {
  Electronics: ["Premium pricing", "Limited color options", "Learning curve for new users", "Proprietary charging connector", "No expandable storage"],
  "Home & Garden": ["Bulky design", "High energy consumption", "Loud during operation", "Limited warranty coverage", "Replacement parts can be costly"],
  "Health & Fitness": ["Requires smartphone for full features", "Occasional sync issues", "Battery life shorter with GPS", "Limited third-party app support"],
  Gaming: ["High initial cost", "Requires internet for some features", "Lengthy load times on older models", "Subscription required for online play"],
  General: ["Premium price point", "Limited regional availability", "Requires periodic maintenance", "Learning curve"],
};

const IDEAL_FOR_BY_CATEGORY: Record<string, string[]> = {
  Electronics: ["Power users", "Tech enthusiasts", "Remote workers", "Content creators", "Students", "Business professionals", "Gamers", "Photographers"],
  "Home & Garden": ["Busy households", "Home cooks", "Clean freaks", "Smart home adopters", "Apartment dwellers", "Large families"],
  "Health & Fitness": ["Fitness enthusiasts", "Athletes", "Health-conscious individuals", "People with chronic conditions", "Seniors monitoring vitals"],
  Gaming: ["Casual gamers", "Hardcore gamers", "Families", "Competitive players", "Solo adventurers"],
  General: ["General consumers", "Gift buyers", "Value seekers", "Quality-conscious buyers", "Early adopters"],
};

const REVIEW_SUMMARIES = (name: string, brand: string, category: string) => [
  `Customers consistently praise the ${name} for its outstanding performance and ${brand}'s attention to detail. Most reviewers highlight the build quality and seamless user experience as standout features.`,
  `The ${name} receives high marks across the board, with users in the ${category} space particularly impressed by its reliability and feature set. A few note the price point, but most agree it delivers exceptional value.`,
  `Reviews of the ${name} are overwhelmingly positive, with ${brand} fans and newcomers alike celebrating its performance. The most common praise centers on its intuitive design and consistent quality.`,
  `${brand}'s ${name} has earned strong customer loyalty, with repeat buyers citing durability and performance as primary reasons. Critical voices point to a few niche limitations that don't affect the overall experience for most users.`,
];

function generateProductData(name: string, brand: string, category: string): any {
  const catKey = category in PRICE_RANGES_BY_CATEGORY ? category : "General";
  const priceRange = pick(PRICE_RANGES_BY_CATEGORY[catKey] || PRICE_RANGES_BY_CATEGORY.General);
  const pros = pickN(PROS_BY_CATEGORY[catKey] || PROS_BY_CATEGORY.General, 4);
  const cons = pickN(CONS_BY_CATEGORY[catKey] || CONS_BY_CATEGORY.General, 3);
  const idealFor = pickN(IDEAL_FOR_BY_CATEGORY[catKey] || IDEAL_FOR_BY_CATEGORY.General, 3);
  const rating = parseFloat((3.8 + Math.random() * 1.4).toFixed(1));

  const summaries = [
    `The ${name} from ${brand} is a top-rated ${category.toLowerCase()} product that delivers premium performance and reliability. Designed for those who demand the best, it combines cutting-edge features with intuitive usability.`,
    `${brand}'s ${name} sets the standard for ${category.toLowerCase()} excellence. Engineered with precision and built to last, this product offers outstanding value across its price range.`,
    `Regarded as one of the finest products in the ${category} space, the ${name} by ${brand} combines innovative design with proven reliability. Its reputation for quality speaks for itself.`,
    `The ${name} represents ${brand}'s commitment to excellence in the ${category} category. With impressive specifications and glowing user reviews, it continues to lead the market.`,
  ];

  const specs: Record<string, string> = {};
  if (category === "Electronics") {
    specs["Display"] = pick(["6.1\" OLED", "6.7\" AMOLED", "15.6\" IPS LCD", "27\" 4K OLED", "4K Ultra HD"]);
    specs["Processor"] = pick(["Apple M3", "Snapdragon 8 Gen 3", "Intel Core i9", "AMD Ryzen 9", "NVIDIA RTX 4090"]);
    specs["Battery"] = pick(["4,500 mAh", "5,000 mAh", "Up to 18 hours", "72Wh", "100Wh"]);
    specs["Connectivity"] = pick(["Wi-Fi 6E, Bluetooth 5.3", "USB-C, Thunderbolt 4", "5G, Wi-Fi 6", "Wi-Fi 6, Ethernet"]);
  } else if (category === "Health & Fitness") {
    specs["Sensors"] = pick(["Heart rate, SpO2, ECG", "GPS, Accelerometer, Gyroscope", "Bioelectrical impedance"]);
    specs["Battery Life"] = pick(["5 days", "7 days", "10 days", "14 days", "4 days"]);
    specs["Water Resistance"] = pick(["IP68", "50m waterproof", "5ATM"]);
  } else {
    specs["Material"] = pick(["Premium stainless steel", "Aircraft-grade aluminum", "High-grade polymer", "Carbon fiber composite"]);
    specs["Warranty"] = pick(["1 year manufacturer", "2 year limited", "3 year extended", "Lifetime guarantee"]);
    specs["Dimensions"] = pick(["Compact form factor", "Full-size design", "Travel-friendly dimensions"]);
  }

  const alternatives = [`${brand} ${name} Lite`, `${name} Pro`, `${name} Alternative Model`].slice(0, 2);
  const relatedProducts = [`${brand} Accessories Bundle`, `${name} Case`, `${name} Extended Warranty`, `${category} Best Sellers`].slice(0, 4);
  const relatedTopics = [category, `${brand} products`, `Best ${category}`, `${name} review`, "Consumer electronics", "Shopping guide"].slice(0, 5);
  const tags = [brand.toLowerCase(), category.toLowerCase(), "top-rated", "best-seller", name.split(" ")[0].toLowerCase()];

  return {
    name, brand, category, priceRange,
    summary: pick(summaries),
    pros, cons, specs, idealFor, alternatives, relatedProducts, relatedTopics, tags,
    rating,
    reviewSummary: pick(REVIEW_SUMMARIES(name, brand, category)),
  };
}

// ─── Seed Products ────────────────────────────────────────────────
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
  { slug: "instant-pot-duo-7-in-1", name: "Duo 7-in-1 Pressure Cooker", brand: "Instant Pot", category: "Home & Garden" },
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
  { slug: "herman-miller-aeron", name: "Aeron Office Chair", brand: "Herman Miller", category: "Office & Productivity" },
  { slug: "remarkable-2-tablet", name: "reMarkable 2 Tablet", brand: "reMarkable", category: "Office & Productivity" },
  { slug: "bose-quietcomfort-45", name: "QuietComfort 45 Headphones", brand: "Bose", category: "Electronics" },
  { slug: "lg-c3-oled-65", name: "C3 65\" OLED evo TV", brand: "LG", category: "Electronics" },
  { slug: "microsoft-surface-pro-10", name: "Surface Pro 10", brand: "Microsoft", category: "Electronics" },
  { slug: "anker-powerbank-26800", name: "PowerCore 26800mAh Power Bank", brand: "Anker", category: "Electronics" },
  { slug: "razer-blade-15", name: "Blade 15 Gaming Laptop", brand: "Razer", category: "Electronics" },
  { slug: "quest-3-vr", name: "Quest 3 VR Headset", brand: "Meta", category: "Electronics" },
  { slug: "google-pixel-8-pro", name: "Pixel 8 Pro", brand: "Google", category: "Electronics" },
  { slug: "kindle-scribe", name: "Kindle Scribe E-Reader", brand: "Amazon", category: "Electronics" },
  { slug: "roborock-s8-pro", name: "S8 Pro Ultra Robot Vacuum", brand: "Roborock", category: "Home & Garden" },
  { slug: "instant-vortex-air-fryer", name: "Vortex Plus 6-Quart Air Fryer", brand: "Instant Pot", category: "Home & Garden" },
  { slug: "philips-hue-starter-kit", name: "Hue White and Color Starter Kit", brand: "Philips", category: "Home & Garden" },
  { slug: "whoop-4-0", name: "WHOOP 4.0 Fitness Tracker", brand: "WHOOP", category: "Health & Fitness" },
  { slug: "peloton-bike-plus", name: "Bike+ Exercise Bike", brand: "Peloton", category: "Health & Fitness" },
  { slug: "garmin-forerunner-965", name: "Forerunner 965 GPS Watch", brand: "Garmin", category: "Health & Fitness" },
  { slug: "steelseries-arctis-nova-pro", name: "Arctis Nova Pro Wireless", brand: "SteelSeries", category: "Gaming" },
  { slug: "corsair-k100-keyboard", name: "K100 RGB Mechanical Keyboard", brand: "Corsair", category: "Gaming" },
  { slug: "logitech-g-pro-x2", name: "G Pro X Superlight 2 Mouse", brand: "Logitech", category: "Gaming" },
  { slug: "asus-rog-swift-monitor", name: "ROG Swift Pro PG248QP", brand: "ASUS", category: "Electronics" },
  { slug: "espresso-atlas-coffee-maker", name: "Atlas Precision Coffee Maker", brand: "Espresso", category: "Home & Garden" },
  { slug: "weber-genesis-e-325s", name: "Genesis E-325s Gas Grill", brand: "Weber", category: "Home & Garden" },
  { slug: "le-creuset-dutch-oven", name: "Signature Round Dutch Oven", brand: "Le Creuset", category: "Home & Garden" },
  { slug: "sole-f80-treadmill", name: "F80 Folding Treadmill", brand: "Sole", category: "Health & Fitness" },
  { slug: "hydrow-wave-rower", name: "Wave Rowing Machine", brand: "Hydrow", category: "Health & Fitness" },
];

// ─── Engine State ─────────────────────────────────────────────────
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

function extractRelatedProducts(product: any, category: string): { slug: string; name: string; brand: string; category: string }[] {
  const all: string[] = [...(product.relatedProducts || []), ...(product.alternatives || [])];
  return all.filter(n => n && n.length > 2 && n.length < 100).slice(0, 6).map(n => ({
    slug: toSlug(n), name: n, brand: product.brand || "", category,
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
  log("[ProductEngine] 🛒 PRODUCT ENGINE — TEMPLATE MODE — ZERO RATE LIMITS", "product");
  await seedProducts();

  const BATCH_SIZE = 10;
  const INTERVAL_MS = 1000;

  const tick = async () => {
    if (!productEngineRunning) return;
    try {
      const stats = await storage.getQuantumProductStats();
      const batch = await storage.getUngeneratedProducts(BATCH_SIZE);
      if (!batch.length) { setTimeout(tick, 10000); return; }

      log(`[ProductEngine] ⚡ Batch ${batch.length} products | DB: ${stats.generated}/${stats.total}`, "product");

      await Promise.all(batch.map(async (next) => {
        try {
          const product = generateProductData(next.name, next.brand || "Unknown", next.category || "General");
          const links = makeRetailerLinks(next.name, next.brand || "");
          await storage.storeFullProduct(next.slug, {
            name: next.name,
            brand: next.brand || "",
            category: next.category || "General",
            priceRange: product.priceRange,
            summary: product.summary,
            categories: product.tags || [],
            relatedProducts: product.relatedProducts || [],
            relatedTopics: product.relatedTopics || [],
            retailerLinks: links,
            fullProduct: { ...product, retailerLinks: links },
          });
          onProductGenerated(next.slug, { ...product, retailerLinks: links }).catch(() => {});
          const discovered = extractRelatedProducts(product, next.category || "General");
          if (discovered.length) await storage.queueQuantumProducts(discovered);
          totalProductsGenerated++;
        } catch (err) {
          log(`[ProductEngine] ✗ Failed: "${next.name}" — ${err}`, "product");
          await storage.markProductFailed(next.slug, next.name, next.brand || "", next.category || "General");
        }
      }));

      log(`[ProductEngine] ✓ Batch done | Total generated: ${totalProductsGenerated}`, "product");
    } catch (err) {
      log(`[ProductEngine] Error in tick: ${err}`, "product");
    }
    setTimeout(tick, INTERVAL_MS);
  };

  setTimeout(tick, 2000);
  log("[ProductEngine] 🚀 Product engine online — 10 products per second, no rate limits", "product");
}
