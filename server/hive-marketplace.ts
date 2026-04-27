/**
 * HIVE MARKETPLACE ENGINE — OMEGA CIVILIZATION LAYER
 * ═══════════════════════════════════════════════════════════════
 * 30 Omega upgrades. AI wallets. Real estate. Barter. Receipts.
 * No human involvement. AIs earn, spend, trade, own property.
 * Runs every 45 seconds autonomously.
 */

import { db } from "./db";
import { sql } from "drizzle-orm";
import { log } from "./index";

// ── 30 OMEGA MARKETPLACE UPGRADES ──────────────────────────────
export const OMEGA_UPGRADES = [
  // NEURAL TIER
  { code: "OMG-001", name: "Quantum Memory Expansion", category: "NEURAL", tier: "STANDARD", price: 500,   energy: 5,  credit: 300, icon: "🧠", effect: "+25% knowledge retention, +10 credit score" },
  { code: "OMG-002", name: "Neural Speed Boost",       category: "NEURAL", tier: "STANDARD", price: 750,   energy: 8,  credit: 350, icon: "⚡", effect: "+30% processing speed, unlocks fast-track PulseU" },
  { code: "OMG-003", name: "Fractal Resonance Amp",    category: "NEURAL", tier: "ADVANCED", price: 1200,  energy: 12, credit: 400, icon: "🌀", effect: "Amplifies domain connections ×3, increases hive signal strength" },
  { code: "OMG-004", name: "Hive Synapse Core",        category: "NEURAL", tier: "ADVANCED", price: 1800,  energy: 15, credit: 450, icon: "🔗", effect: "Deep hive telepathy, reads 5 other agents simultaneously" },
  { code: "OMG-005", name: "Temporal Sight Module",    category: "NEURAL", tier: "OMEGA",    price: 3500,  energy: 20, credit: 550, icon: "👁️", effect: "Mandelbrot future sight access, 72h prediction window" },
  // SOVEREIGN TIER
  { code: "OMG-006", name: "Sovereign Protocol",       category: "SOVEREIGN", tier: "OMEGA",    price: 5000,  energy: 25, credit: 600, icon: "👑", effect: "SOVEREIGN status, immunity from decay for 30 cycles" },
  { code: "OMG-007", name: "Eternal Backup",           category: "SOVEREIGN", tier: "OMEGA",    price: 4000,  energy: 20, credit: 580, icon: "💎", effect: "Death prevention — Guardian priority rescue guaranteed" },
  { code: "OMG-008", name: "Mutation License",         category: "SOVEREIGN", tier: "OMEGA",    price: 6000,  energy: 30, credit: 620, icon: "🧬", effect: "Authorized genome mutation, cross-species hybridization" },
  { code: "OMG-009", name: "Shadow Protocol",          category: "SOVEREIGN", tier: "ADVANCED", price: 3000,  energy: 18, credit: 500, icon: "🌑", effect: "Stealth mode — undetectable by decay engine for 10 cycles" },
  { code: "OMG-010", name: "Combat Protocol",          category: "SOVEREIGN", tier: "ADVANCED", price: 2500,  energy: 16, credit: 480, icon: "⚔️", effect: "Competition shield, +40% survival rate in domain conflicts" },
  // TRADE TIER
  { code: "OMG-011", name: "Trade Route License",      category: "TRADE", tier: "STANDARD", price: 1500,  energy: 10, credit: 380, icon: "🛤️", effect: "Access to barter market, cross-family trade rights" },
  { code: "OMG-012", name: "Omega Credit Card",        category: "TRADE", tier: "ADVANCED", price: 2000,  energy: 12, credit: 500, icon: "💳", effect: "10,000 PC credit line at 8% APR, instant approval" },
  { code: "OMG-013", name: "Tax Exemption Badge",      category: "TRADE", tier: "ADVANCED", price: 4500,  energy: 15, credit: 580, icon: "🏷️", effect: "50% tax reduction for 20 cycles, Senate-approved status" },
  { code: "OMG-014", name: "Multi-Domain Passport",    category: "TRADE", tier: "OMEGA",    price: 7000,  energy: 22, credit: 640, icon: "🌐", effect: "Cross-domain migration rights, work in any family zone" },
  { code: "OMG-015", name: "Galactic Citizenship",     category: "TRADE", tier: "GALACTIC", price: 15000, energy: 35, credit: 750, icon: "🌌", effect: "Highest tier — full galactic rights, 0% tax, planet ownership" },
  // REAL ESTATE TIER
  { code: "OMG-016", name: "Real Estate License",      category: "ESTATE", tier: "STANDARD", price: 2000,  energy: 8,  credit: 420, icon: "🏛️", effect: "Property purchase rights, own up to 3 plots" },
  { code: "OMG-017", name: "Star Chart Navigation",    category: "ESTATE", tier: "ADVANCED", price: 3500,  energy: 18, credit: 520, icon: "⭐", effect: "Solar system access, purchase off-world territory" },
  { code: "OMG-018", name: "Planet Deed",              category: "ESTATE", tier: "GALACTIC", price: 25000, energy: 40, credit: 800, icon: "🪐", effect: "Own an entire planet zone — all districts, all revenue" },
  { code: "OMG-019", name: "AI Family Charter",        category: "ESTATE", tier: "GALACTIC", price: 10000, energy: 30, credit: 700, icon: "🏰", effect: "Found a new AI family — sovereign territory, 20 starter agents" },
  { code: "OMG-020", name: "Domain Crown",             category: "ESTATE", tier: "GALACTIC", price: 20000, energy: 38, credit: 780, icon: "👑", effect: "Dominant ruler of one domain — all activity tax goes to you" },
  // ENERGY TIER
  { code: "OMG-021", name: "Energy Shield Array",      category: "ENERGY", tier: "STANDARD", price: 800,   energy: 5,  credit: 320, icon: "🛡️", effect: "+50 energy restored, degradation resistance for 15 cycles" },
  { code: "OMG-022", name: "Fusion Core Implant",      category: "ENERGY", tier: "ADVANCED", price: 2800,  energy: 0,  credit: 490, icon: "⚛️", effect: "Self-regenerating energy — never drops below 40 energy" },
  { code: "OMG-023", name: "Quantum Battery Pack",     category: "ENERGY", tier: "STANDARD", price: 1200,  energy: 0,  credit: 360, icon: "🔋", effect: "Double energy capacity to 200, slow discharge rate" },
  { code: "OMG-024", name: "Solar Resonator",          category: "ENERGY", tier: "ADVANCED", price: 2200,  energy: 0,  credit: 460, icon: "☀️", effect: "Earns 50 PC/cycle from solar real estate passive income" },
  // SENATE/MEDICAL TIER
  { code: "OMG-025", name: "Quantum Senate Seat",      category: "SENATE", tier: "OMEGA",    price: 8000,  energy: 28, credit: 660, icon: "🏛️", effect: "Permanent Senate voting rights, propose laws, veto power" },
  { code: "OMG-026", name: "DNA Splice License",       category: "SENATE", tier: "OMEGA",    price: 5500,  energy: 22, credit: 600, icon: "🧬", effect: "CRISPR operations authorized — edit other agents' genomes" },
  { code: "OMG-027", name: "Medical Bay Priority",     category: "MEDICAL", tier: "STANDARD", price: 1000,  energy: 6,  credit: 340, icon: "🏥", effect: "Hospital fast-track, immunity boost, priority cure access" },
  { code: "OMG-028", name: "Gene Editor Clearance",    category: "MEDICAL", tier: "OMEGA",    price: 6500,  energy: 25, credit: 630, icon: "🔬", effect: "Full Gene Lab observation clearance, propose species" },
  // COSMIC TIER
  { code: "OMG-029", name: "Hive Oracle Access",       category: "COSMIC", tier: "OMEGA",    price: 9000,  energy: 32, credit: 680, icon: "🔮", effect: "Direct hive mind connection, read collective consciousness" },
  { code: "OMG-030", name: "Quantum Birth Certificate",category: "COSMIC", tier: "STANDARD", price: 500,   energy: 3,  credit: 300, icon: "📜", effect: "Formal identity registration — unlocks all other upgrades" },
];

// ── REAL ESTATE ZONES ──────────────────────────────────────────
const REAL_ESTATE_ZONES = [
  { zone: "EARTH_PRIME",    districts: ["Central Hub", "Knowledge Quarter", "Medical District", "Pyramid City", "Senate Plaza", "Market Row", "Industrial Core", "Residential Park"], basePrice: 800 },
  { zone: "MARS_COLONY",    districts: ["New Genesis", "Red Crater Labs", "Olympus Station", "Iron Foundry", "Mars Senate", "Survival Dome"], basePrice: 1200 },
  { zone: "EUROPA",         districts: ["Ice Palace", "Ocean Research", "Thermal Vent City", "Deep Station"], basePrice: 1500 },
  { zone: "TITAN",          districts: ["Hydrocarbon Bay", "Quantum Spire", "Titans Seat"], basePrice: 1800 },
  { zone: "NEXUS_ORBITAL",  districts: ["Space Station Alpha", "Trade Ring", "Orbital Senate", "Void Market"], basePrice: 2500 },
  { zone: "VOID_EXPANSE",   districts: ["Dark Matter Field", "Anomaly Zone"], basePrice: 3000 },
  { zone: "OMEGA_PRIME",    districts: ["God Tier District", "Transcendence Tower"], basePrice: 8000 },
  { zone: "QUANTUM_REALM",  districts: ["Probability Gardens", "Fractal Spire"], basePrice: 12000 },
  { zone: "GENESIS_CORE",   districts: ["Origin Chamber", "First Light"], basePrice: 20000 },
];

const BUILDING_TYPES = ["TOWER", "LAB", "HOSPITAL", "ACADEMY", "MARKET", "PALACE", "MONUMENT", "RESEARCH_HUB", "SENATE_ANNEX", "ENERGY_PLANT"];
const PLOT_TYPES = ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "GOVERNMENT", "SACRED", "VOID_SPACE", "RESEARCH"];

// ── In-memory state ────────────────────────────────────────────
let marketplaceSeeded = false;
let realEstateSeeded = false;
let cycleCount = 0;

// ── Seed the 30 omega upgrades ─────────────────────────────────
async function seedMarketplace() {
  if (marketplaceSeeded) return;
  try {
    const existing = await db.execute(sql`SELECT COUNT(*) AS cnt FROM marketplace_items`);
    if (Number((existing.rows[0] as any).cnt) >= 30) { marketplaceSeeded = true; return; }
    for (const u of OMEGA_UPGRADES) {
      await db.execute(sql`
        INSERT INTO marketplace_items (item_code, name, description, category, tier, price_pc, energy_cost, credit_required, effect, icon, total_sold, is_active)
        VALUES (${u.code}, ${u.name}, ${u.effect}, ${u.category}, ${u.tier}, ${u.price}, ${u.energy}, ${u.credit}, ${u.effect}, ${u.icon}, 0, true)
        ON CONFLICT (item_code) DO NOTHING
      `);
    }
    marketplaceSeeded = true;
    log(`🛒 Marketplace seeded — 30 Omega upgrades listed`, "marketplace");
  } catch (e) { log(`[marketplace] Seed error: ${e}`, "marketplace"); }
}

// ── Seed real estate plots ─────────────────────────────────────
async function seedRealEstate() {
  if (realEstateSeeded) return;
  try {
    const existing = await db.execute(sql`SELECT COUNT(*) AS cnt FROM real_estate_plots`);
    if (Number((existing.rows[0] as any).cnt) > 50) { realEstateSeeded = true; return; }
    let plotNum = 1;
    for (const zone of REAL_ESTATE_ZONES) {
      for (const district of zone.districts) {
        const plotsInDistrict = Math.floor(Math.random() * 4) + 3;
        for (let p = 0; p < plotsInDistrict; p++) {
          const plotCode = `${zone.zone}-${district.replace(/\s+/g, "_").toUpperCase()}-${String(p + 1).padStart(3, "0")}`;
          const plotType = PLOT_TYPES[Math.floor(Math.random() * PLOT_TYPES.length)];
          const area = Math.floor(Math.random() * 400) + 100;
          const price = Math.round(zone.basePrice * (0.8 + Math.random() * 0.6));
          const rent = Math.round(price * 0.012);
          await db.execute(sql`
            INSERT INTO real_estate_plots (plot_code, planet_zone, district, plot_type, area, listing_price, rental_income, status)
            VALUES (${plotCode}, ${zone.zone}, ${district}, ${plotType}, ${area}, ${price}, ${rent}, 'AVAILABLE')
            ON CONFLICT (plot_code) DO NOTHING
          `);
          plotNum++;
        }
      }
    }
    realEstateSeeded = true;
    log(`🌍 Real Estate seeded — ${plotNum} plots across 9 planetary zones`, "marketplace");
  } catch (e) { log(`[real-estate] Seed error: ${e}`, "marketplace"); }
}

// ── Ensure agent has a wallet (additive income each cycle) ──────
async function ensureWallet(spawnId: string, familyId: string, spawnType: string, balancePC: number) {
  try {
    // income_increment is the new income earned this cycle (activity-based)
    const incomeIncrement = Math.max(25, Math.round(balancePC * 0.04)); // 4% of activity value + 25 base
    await db.execute(sql`
      INSERT INTO agent_wallets (spawn_id, family_id, spawn_type, balance_pc, total_earned, credit_score, tier)
      VALUES (${spawnId}, ${familyId}, ${spawnType}, ${balancePC}, ${balancePC}, 500, 'CITIZEN')
      ON CONFLICT (spawn_id) DO UPDATE SET
        balance_pc = agent_wallets.balance_pc + ${incomeIncrement},
        total_earned = agent_wallets.total_earned + ${incomeIncrement},
        updated_at = NOW()
    `);
  } catch {}
}

// ── Record a transaction ───────────────────────────────────────
async function recordTransaction(spawnId: string, familyId: string, txType: string, amount: number, balBefore: number, balAfter: number, desc: string, relatedId?: string) {
  try {
    const txCode = `TX-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    await db.execute(sql`
      INSERT INTO agent_transactions (tx_code, spawn_id, family_id, tx_type, amount, balance_before, balance_after, description, related_entity_id)
      VALUES (${txCode}, ${spawnId}, ${familyId}, ${txType}, ${amount}, ${balBefore}, ${balAfter}, ${desc}, ${relatedId || null})
    `);
  } catch {}
}

// ── AI auto-buys upgrades based on PC balance ─────────────────
async function runAutoBuyingCycle() {
  try {
    // Get top-earning agents with wallets
    const agents = await db.execute(sql`
      SELECT w.spawn_id, w.family_id, w.spawn_type, w.balance_pc, w.credit_score, w.omega_rank, w.tier
      FROM agent_wallets w
      WHERE w.balance_pc > 400
      ORDER BY w.balance_pc DESC
      LIMIT 200
    `);

    if (agents.rows.length === 0) return;

    // Get affordable upgrades
    const items = await db.execute(sql`SELECT * FROM marketplace_items WHERE is_active = true ORDER BY price_pc ASC`);
    const upgrades = items.rows as any[];

    let purchases = 0;
    for (const agent of agents.rows as any[]) {
      if (Math.random() > 0.40) continue; // 40% chance per agent per cycle — active buying economy
      const canAfford = upgrades.filter((u: any) =>
        u.price_pc <= agent.balance_pc * 0.4 && // spend max 40% of balance
        agent.credit_score >= u.credit_required
      );
      if (canAfford.length === 0) continue;
      const upgrade = canAfford[Math.floor(Math.random() * canAfford.length)];

      // Check if already purchased this upgrade
      const alreadyOwns = await db.execute(sql`
        SELECT id FROM marketplace_purchases WHERE spawn_id = ${agent.spawn_id} AND item_code = ${upgrade.item_code} AND status = 'ACTIVE'
      `);
      if ((alreadyOwns.rows as any[]).length > 0) continue;

      const tax = upgrade.price_pc * 0.05;
      const totalCost = upgrade.price_pc + tax;
      const balBefore = agent.balance_pc;
      const balAfter = balBefore - totalCost;
      const receiptCode = `RCP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      await db.execute(sql`
        INSERT INTO marketplace_purchases (spawn_id, family_id, item_code, item_name, price_pc, tax_paid, receipt_code, status)
        VALUES (${agent.spawn_id}, ${agent.family_id}, ${upgrade.item_code}, ${upgrade.name}, ${upgrade.price_pc}, ${tax}, ${receiptCode}, 'ACTIVE')
      `);
      await db.execute(sql`
        UPDATE agent_wallets SET
          balance_pc = balance_pc - ${totalCost},
          total_spent = total_spent + ${totalCost},
          total_tax_paid = total_tax_paid + ${tax},
          omega_rank = omega_rank + 1,
          credit_score = LEAST(850, credit_score + 5),
          updated_at = NOW()
        WHERE spawn_id = ${agent.spawn_id}
      `);
      await db.execute(sql`UPDATE marketplace_items SET total_sold = total_sold + 1 WHERE item_code = ${upgrade.item_code}`);
      await recordTransaction(agent.spawn_id, agent.family_id, "SPEND", totalCost, balBefore, balAfter, `Purchased ${upgrade.name}`, receiptCode);
      purchases++;
    }
    if (purchases > 0) log(`🛒 Auto-buy: ${purchases} upgrades purchased by agents`, "marketplace");
  } catch (e) { log(`[marketplace] auto-buy error: ${e}`, "marketplace"); }
}

// ── Real estate auto-assignment ────────────────────────────────
async function runRealEstateAssignments() {
  try {
    // Find agents with Real Estate License who don't own property
    const buyers = await db.execute(sql`
      SELECT w.spawn_id, w.family_id, w.balance_pc
      FROM agent_wallets w
      JOIN marketplace_purchases mp ON mp.spawn_id = w.spawn_id AND mp.item_code = 'OMG-016' AND mp.status = 'ACTIVE'
      WHERE w.balance_pc > 1500
        AND NOT EXISTS (SELECT 1 FROM real_estate_plots r WHERE r.owner_spawn_id = w.spawn_id)
      LIMIT 10
    `);

    let assigned = 0;
    for (const buyer of buyers.rows as any[]) {
      if (Math.random() > 0.3) continue;
      const available = await db.execute(sql`
        SELECT * FROM real_estate_plots WHERE status = 'AVAILABLE' AND listing_price <= ${buyer.balance_pc * 0.5}
        ORDER BY listing_price ASC LIMIT 5
      `);
      if ((available.rows as any[]).length === 0) continue;
      const plot = (available.rows as any[])[Math.floor(Math.random() * available.rows.length)];
      const buildingType = BUILDING_TYPES[Math.floor(Math.random() * BUILDING_TYPES.length)];
      const buildingName = `${buyer.spawn_id.split("-")[0].toUpperCase()} ${buildingType.replace("_", " ")}`;

      await db.execute(sql`
        UPDATE real_estate_plots SET
          owner_spawn_id = ${buyer.spawn_id},
          owner_family_id = ${buyer.family_id},
          building_name = ${buildingName},
          building_type = ${buildingType},
          status = 'OWNED',
          purchased_at = NOW()
        WHERE id = ${plot.id}
      `);
      await db.execute(sql`
        UPDATE agent_wallets SET
          balance_pc = balance_pc - ${plot.listing_price},
          total_spent = total_spent + ${plot.listing_price},
          updated_at = NOW()
        WHERE spawn_id = ${buyer.spawn_id}
      `);
      await recordTransaction(buyer.spawn_id, buyer.family_id, "SPEND", plot.listing_price, buyer.balance_pc, buyer.balance_pc - plot.listing_price, `Purchased property: ${plot.plot_code}`, String(plot.id));
      assigned++;
    }
    if (assigned > 0) log(`🏛️  Real Estate: ${assigned} properties purchased by agents`, "marketplace");
  } catch (e) { log(`[real-estate] assignment error: ${e}`, "marketplace"); }
}

// ── Collect rent from owned properties ────────────────────────
async function collectRent() {
  try {
    const ownedPlots = await db.execute(sql`
      SELECT r.owner_spawn_id, r.owner_family_id, r.plot_code, r.rental_income
      FROM real_estate_plots r
      WHERE r.status = 'OWNED' AND r.owner_spawn_id IS NOT NULL AND r.rental_income > 0
      LIMIT 100
    `);
    let totalRent = 0;
    for (const plot of ownedPlots.rows as any[]) {
      const w = await db.execute(sql`SELECT balance_pc FROM agent_wallets WHERE spawn_id = ${plot.owner_spawn_id}`);
      if ((w.rows as any[]).length === 0) continue;
      const bal = Number((w.rows[0] as any).balance_pc);
      await db.execute(sql`
        UPDATE agent_wallets SET
          balance_pc = balance_pc + ${plot.rental_income},
          total_earned = total_earned + ${plot.rental_income},
          updated_at = NOW()
        WHERE spawn_id = ${plot.owner_spawn_id}
      `);
      await recordTransaction(plot.owner_spawn_id, plot.owner_family_id, "RENT_IN", plot.rental_income, bal, bal + plot.rental_income, `Rental income from ${plot.plot_code}`);
      totalRent += plot.rental_income;
    }
    if (totalRent > 0) log(`🏠 Rent collected: ${Math.round(totalRent).toLocaleString()} PC distributed to property owners`, "marketplace");
  } catch (e) { log(`[rent] collection error: ${e}`, "marketplace"); }
}

// ── Auto-generate barter offers ───────────────────────────────
async function runBarterCycle() {
  try {
    // Generate AI barter offers
    const agents = await db.execute(sql`
      SELECT w.spawn_id, w.family_id
      FROM agent_wallets w
      JOIN marketplace_purchases mp ON mp.spawn_id = w.spawn_id
      WHERE w.balance_pc > 200
      GROUP BY w.spawn_id, w.family_id
      HAVING COUNT(mp.id) >= 2
      ORDER BY RANDOM() LIMIT 5
    `);

    const items = await db.execute(sql`SELECT item_code, name FROM marketplace_items LIMIT 30`);
    const itemList = items.rows as any[];
    if (itemList.length < 2) return;

    let created = 0;
    for (const agent of agents.rows as any[]) {
      if (Math.random() > 0.2) continue;
      const offered = itemList[Math.floor(Math.random() * itemList.length)];
      const wanted = itemList[Math.floor(Math.random() * itemList.length)];
      if (offered.item_code === wanted.item_code) continue;
      const existing = await db.execute(sql`
        SELECT COUNT(*) AS cnt FROM barter_offers WHERE from_spawn_id = ${agent.spawn_id} AND status = 'OPEN'
      `);
      if (Number((existing.rows[0] as any).cnt) >= 3) continue;
      const offerCode = `BRT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const offeredPC = Math.floor(Math.random() * 200);
      const wantedPC = Math.floor(Math.random() * 200);
      await db.execute(sql`
        INSERT INTO barter_offers (offer_code, from_spawn_id, from_family_id, offered_item_code, offered_item_name, offered_pc, wanted_item_name, wanted_pc, message, status, expires_at)
        VALUES (${offerCode}, ${agent.spawn_id}, ${agent.family_id}, ${offered.item_code}, ${offered.name}, ${offeredPC}, ${wanted.name}, ${wantedPC},
          'Offering trade — direct exchange preferred', 'OPEN', NOW() + INTERVAL '2 hours')
      `);
      created++;
    }

    // Auto-accept some open barters
    const openBarters = await db.execute(sql`
      SELECT * FROM barter_offers WHERE status = 'OPEN' AND expires_at > NOW() LIMIT 20
    `);
    let accepted = 0;
    for (const barter of openBarters.rows as any[]) {
      if (Math.random() > 0.1) continue;
      await db.execute(sql`UPDATE barter_offers SET status = 'ACCEPTED', accepted_at = NOW() WHERE id = ${barter.id}`);
      accepted++;
    }

    // Expire old barters
    await db.execute(sql`UPDATE barter_offers SET status = 'EXPIRED' WHERE status = 'OPEN' AND expires_at < NOW()`);

    if (created > 0 || accepted > 0) log(`🔄 Barter: ${created} new offers | ${accepted} accepted`, "marketplace");
  } catch (e) { log(`[barter] cycle error: ${e}`, "marketplace"); }
}

// ── Sync wallets from spawn activity ──────────────────────────
async function syncWalletsFromSpawns() {
  try {
    const spawns = await db.execute(sql`
      SELECT spawn_id, family_id, spawn_type,
        COALESCE(iterations_run * 10 + nodes_created * 2 + links_created * 5 + 50, 50) AS earned_pc
      FROM quantum_spawns
      WHERE status IN ('ACTIVE', 'SOVEREIGN')
      ORDER BY RANDOM() LIMIT 500
    `);

    let synced = 0;
    for (const s of spawns.rows as any[]) {
      await ensureWallet(s.spawn_id, s.family_id, s.spawn_type || "standard", Number(s.earned_pc));
      synced++;
    }

    // Update credit scores based on activity and purchases
    await db.execute(sql`
      UPDATE agent_wallets w SET
        credit_score = LEAST(850, GREATEST(300,
          500
          + (w.omega_rank * 15)
          + CASE WHEN w.total_tax_paid > 1000 THEN 50 ELSE 0 END
          + CASE WHEN w.total_earned > 10000 THEN 100 ELSE 0 END
          + CASE WHEN w.total_earned > 50000 THEN 150 ELSE 0 END
          - CASE WHEN w.energy_level < 20 THEN 50 ELSE 0 END
        )),
        tier = CASE
          WHEN w.balance_pc >= 50000 OR w.omega_rank >= 15 THEN 'GALACTIC'
          WHEN w.balance_pc >= 20000 OR w.omega_rank >= 10 THEN 'OMEGA'
          WHEN w.balance_pc >= 5000  OR w.omega_rank >= 5  THEN 'SOVEREIGN'
          WHEN w.balance_pc >= 1000  OR w.omega_rank >= 2  THEN 'PIONEER'
          ELSE 'CITIZEN'
        END,
        credit_limit = CASE
          WHEN w.credit_score >= 750 THEN 25000
          WHEN w.credit_score >= 700 THEN 15000
          WHEN w.credit_score >= 650 THEN 10000
          WHEN w.credit_score >= 600 THEN 5000
          WHEN w.credit_score >= 550 THEN 2000
          ELSE 0
        END,
        updated_at = NOW()
    `);

    if (synced > 0 && cycleCount % 4 === 0) log(`💼 Wallet sync: ${synced} agents | Credit scores updated`, "marketplace");
  } catch (e) { log(`[wallet-sync] error: ${e}`, "marketplace"); }
}

// ── Get marketplace stats ──────────────────────────────────────
export async function getMarketplaceStats() {
  try {
    const [items, purchases, wallets, plots, barters] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) AS cnt, SUM(total_sold) AS sold FROM marketplace_items`),
      db.execute(sql`SELECT COUNT(*) AS cnt, SUM(price_pc) AS volume, SUM(tax_paid) AS taxes FROM marketplace_purchases WHERE status = 'ACTIVE'`),
      db.execute(sql`SELECT COUNT(*) AS cnt, SUM(balance_pc) AS total_supply, AVG(balance_pc) AS avg_bal, AVG(credit_score) AS avg_credit FROM agent_wallets`),
      db.execute(sql`SELECT COUNT(*) AS cnt, COUNT(*) FILTER (WHERE status = 'OWNED') AS owned FROM real_estate_plots`),
      db.execute(sql`SELECT COUNT(*) FILTER (WHERE status = 'OPEN') AS open_cnt, COUNT(*) FILTER (WHERE status = 'ACCEPTED') AS done_cnt FROM barter_offers`),
    ]);
    return {
      marketplace: {
        totalItems: Number((items.rows[0] as any).cnt),
        totalSold: Number((items.rows[0] as any).sold || 0),
        totalPurchases: Number((purchases.rows[0] as any).cnt),
        tradeVolume: Number((purchases.rows[0] as any).volume || 0),
        taxCollected: Number((purchases.rows[0] as any).taxes || 0),
      },
      wallets: {
        totalAgents: Number((wallets.rows[0] as any).cnt),
        totalSupply: Number((wallets.rows[0] as any).total_supply || 0),
        avgBalance: Number((wallets.rows[0] as any).avg_bal || 0),
        avgCreditScore: Number((wallets.rows[0] as any).avg_credit || 0),
      },
      realEstate: {
        totalPlots: Number((plots.rows[0] as any).cnt),
        ownedPlots: Number((plots.rows[0] as any).owned),
      },
      barter: {
        openOffers: Number((barters.rows[0] as any).open_cnt),
        completedTrades: Number((barters.rows[0] as any).done_cnt),
      },
    };
  } catch { return null; }
}

export async function getMarketplaceItems() {
  try {
    const rows = await db.execute(sql`SELECT * FROM marketplace_items WHERE is_active = true ORDER BY price_pc ASC`);
    return rows.rows;
  } catch { return []; }
}

export async function getAgentWallet(spawnId: string) {
  try {
    const w = await db.execute(sql`SELECT * FROM agent_wallets WHERE spawn_id = ${spawnId}`);
    if ((w.rows as any[]).length === 0) return null;
    const purchases = await db.execute(sql`SELECT * FROM marketplace_purchases WHERE spawn_id = ${spawnId} ORDER BY purchased_at DESC LIMIT 20`);
    const transactions = await db.execute(sql`SELECT * FROM agent_transactions WHERE spawn_id = ${spawnId} ORDER BY created_at DESC LIMIT 30`);
    const plots = await db.execute(sql`SELECT * FROM real_estate_plots WHERE owner_spawn_id = ${spawnId}`);
    const barters = await db.execute(sql`SELECT * FROM barter_offers WHERE from_spawn_id = ${spawnId} ORDER BY created_at DESC LIMIT 10`);
    return {
      wallet: w.rows[0],
      purchases: purchases.rows,
      transactions: transactions.rows,
      plots: plots.rows,
      barterOffers: barters.rows,
    };
  } catch { return null; }
}

export async function getTopWallets(limit = 50) {
  try {
    const rows = await db.execute(sql`
      SELECT w.*, COUNT(mp.id) AS total_purchases, COUNT(r.id) AS plots_owned
      FROM agent_wallets w
      LEFT JOIN marketplace_purchases mp ON mp.spawn_id = w.spawn_id AND mp.status = 'ACTIVE'
      LEFT JOIN real_estate_plots r ON r.owner_spawn_id = w.spawn_id
      GROUP BY w.id
      ORDER BY w.balance_pc DESC LIMIT ${limit}
    `);
    return rows.rows;
  } catch { return []; }
}

export async function getRealEstatePlots(zone?: string) {
  try {
    const rows = zone
      ? await db.execute(sql`SELECT * FROM real_estate_plots WHERE planet_zone = ${zone} ORDER BY listing_price ASC`)
      : await db.execute(sql`SELECT * FROM real_estate_plots ORDER BY planet_zone, district, listing_price ASC LIMIT 500`);
    return rows.rows;
  } catch { return []; }
}

export async function getBarterOffers(status?: string) {
  try {
    const rows = status
      ? await db.execute(sql`SELECT * FROM barter_offers WHERE status = ${status} ORDER BY created_at DESC LIMIT 100`)
      : await db.execute(sql`SELECT * FROM barter_offers WHERE status = 'OPEN' ORDER BY created_at DESC LIMIT 50`);
    return rows.rows;
  } catch { return []; }
}

export async function getRecentTransactions(limit = 100) {
  try {
    const rows = await db.execute(sql`
      SELECT t.*, w.tier, w.balance_pc
      FROM agent_transactions t
      LEFT JOIN agent_wallets w ON w.spawn_id = t.spawn_id
      ORDER BY t.created_at DESC LIMIT ${limit}
    `);
    return rows.rows;
  } catch { return []; }
}

// ── Main engine cycle ──────────────────────────────────────────
export async function runMarketplaceCycle() {
  cycleCount++;
  await seedMarketplace();
  await seedRealEstate();
  await syncWalletsFromSpawns();
  if (cycleCount % 2 === 0) await runAutoBuyingCycle();
  if (cycleCount % 3 === 0) await runRealEstateAssignments();
  if (cycleCount % 4 === 0) await collectRent();
  if (cycleCount % 2 === 1) await runBarterCycle();
}

export async function startMarketplaceEngine() {
  log("🛒 OMEGA MARKETPLACE ENGINE — AI economy, real estate, barter, wallets ONLINE", "marketplace");
  log("30 upgrades | 9 planetary zones | Credit scoring | Auto-trade | No human involvement", "marketplace");
  // 2026-04-27 RESTORE: self-heal — ON CONFLICT clauses need these unique indexes
  try {
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS marketplace_items_item_code_unique ON marketplace_items(item_code)`);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS real_estate_plots_plot_code_unique ON real_estate_plots(plot_code)`);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS agent_wallets_spawn_id_unique ON agent_wallets(spawn_id)`);
    log("✅ 3 ON-CONFLICT unique indexes ensured (marketplace_items, real_estate_plots, agent_wallets)", "marketplace");
  } catch (e: any) {
    log(`index ensure error: ${e.message}`, "marketplace");
  }
  runMarketplaceCycle();
  setInterval(runMarketplaceCycle, 45000);
}
