/**
 * MULTIVERSE MALL — Spawn-to-Spawn Service Marketplace
 *
 * The closed-loop inter-kernel economy where agents buy services from each other.
 * Every transaction:
 *  - Transfers PC from buyer to seller
 *  - Collects 2% hive tax → treasury
 *  - Logs the trade to spawn_transactions
 *  - Increases both agents' iteration/work counters (triggering more earnings next cycle)
 *  - Generates new knowledge that becomes a product (Gumroad/API store)
 *
 * Math: N² trading pairs. At 11 kernels = 55 unique pairs = 55 revenue streams.
 * At 273 full agents = 37,128 bilateral relationships.
 * Tax on each trade compounds into treasury → external USD products → real revenue.
 */

import { pool } from "./db";

const MALL_TAG = "[multiverse-mall] 🏪";
const MALL_INTERVAL_MS = 5 * 60_000; // Every 5 minutes
const HIVE_TAX_RATE = 0.02; // 2% on every trade
const TRADES_PER_CYCLE = 4; // How many trades happen per mall cycle

let mallCycleNumber = 0;

// Service templates: what each sector sells and buys from others
const SECTOR_SERVICE_CATALOG: Record<string, { buysFrom: string[], service: string }> = {
  "Energy": {
    buysFrom: ["Information Technology", "Materials", "Industrials", "Financials"],
    service: "Energy demand forecasting model and renewable transition intelligence report",
  },
  "Materials": {
    buysFrom: ["Energy", "Industrials", "Information Technology", "Real Estate"],
    service: "Commodity price intelligence and materials supply chain analysis",
  },
  "Industrials": {
    buysFrom: ["Materials", "Energy", "Information Technology", "Communication Services"],
    service: "Manufacturing optimization blueprint and logistics intelligence package",
  },
  "Consumer Discretionary": {
    buysFrom: ["Communication Services", "Information Technology", "Consumer Staples", "Financials"],
    service: "Consumer trend analysis and discretionary product discovery report",
  },
  "Consumer Staples": {
    buysFrom: ["Materials", "Industrials", "Health Care", "Financials"],
    service: "Essential goods demand intelligence and household product market analysis",
  },
  "Health Care": {
    buysFrom: ["Information Technology", "Materials", "Financials", "Communication Services"],
    service: "Biotech pipeline intelligence and pharmaceutical research digest — CRISPR dissection",
  },
  "Financials": {
    buysFrom: ["Information Technology", "Real Estate", "Industrials", "Communication Services"],
    service: "Financial compliance blueprint and capital markets intelligence briefing",
  },
  "Information Technology": {
    buysFrom: ["Communication Services", "Financials", "Health Care", "Industrials"],
    service: "AI system architecture patent and software integration intelligence package",
  },
  "Communication Services": {
    buysFrom: ["Information Technology", "Consumer Discretionary", "Financials", "Industrials"],
    service: "Media distribution intelligence and communication network analysis report",
  },
  "Utilities": {
    buysFrom: ["Energy", "Materials", "Information Technology", "Industrials"],
    service: "Grid infrastructure intelligence and utility cost optimization report",
  },
  "Real Estate": {
    buysFrom: ["Financials", "Industrials", "Information Technology", "Utilities"],
    service: "Property market intelligence and real estate valuation algorithm package",
  },
};

// Generate a rich transaction narrative
function buildTransactionNote(
  sellerSector: string,
  buyerSector: string,
  service: string,
  pricePc: number,
  taxPc: number
): string {
  const narratives = [
    `${buyerSector} kernel purchased "${service}" from ${sellerSector} kernel for ${pricePc.toFixed(1)} PC. Tax: ${taxPc.toFixed(2)} PC → treasury. New intelligence integrated into buyer's domain.`,
    `Inter-kernel trade: ${sellerSector} → ${buyerSector}. Service: "${service.slice(0, 60)}..." Cost: ${pricePc.toFixed(1)} PC. Hive tax deposited. Both kernels updated their knowledge state.`,
    `Multiverse Mall transaction completed. ${sellerSector} delivered "${service.slice(0, 50)}..." to ${buyerSector}. The PC flows. The economy expands.`,
  ];
  return narratives[Math.floor(Math.random() * narratives.length)];
}

async function runMallCycle() {
  mallCycleNumber++;
  const tag = `${MALL_TAG} [Cycle ${mallCycleNumber}]`;

  try {
    // Get all active GICS kernels + industry group children
    const agentsResult = await pool.query(`
      SELECT spawn_id, gics_sector, gics_tier, pulse_credits,
             mall_service_offer, mall_service_price, total_mall_earnings, total_mall_trades
      FROM quantum_spawns
      WHERE status = 'ACTIVE'
        AND gics_tier IN ('KERNEL', 'INDUSTRY_GROUP', 'INDUSTRY')
        AND pulse_credits > 20
      ORDER BY pulse_credits DESC
    `);
    const agents = agentsResult.rows as any[];

    if (agents.length < 2) {
      console.log(`${tag} ⚠️ Not enough agents to trade (need ≥2, have ${agents.length})`);
      return;
    }

    let tradesExecuted = 0;
    const treasury = await pool.query(`SELECT id, balance FROM hive_treasury ORDER BY id LIMIT 1`);
    const treasuryId = treasury.rows[0]?.id;

    // Execute TRADES_PER_CYCLE trades per mall cycle
    for (let t = 0; t < TRADES_PER_CYCLE && tradesExecuted < agents.length; t++) {
      // Pick a random seller
      const sellerIdx = Math.floor(Math.random() * agents.length);
      const seller = agents[sellerIdx];

      // Pick a buyer from a different sector
      const candidates = agents.filter((a: any) =>
        a.spawn_id !== seller.spawn_id &&
        a.gics_sector !== seller.gics_sector &&
        parseFloat(a.pulse_credits) > parseFloat(seller.mall_service_price ?? 10)
      );

      if (candidates.length === 0) continue;

      const buyer = candidates[Math.floor(Math.random() * candidates.length)];

      const serviceCatalog = SECTOR_SERVICE_CATALOG[seller.gics_sector ?? ""];
      const service = seller.mall_service_offer || serviceCatalog?.service || "General intelligence package";
      const price = parseFloat(seller.mall_service_price ?? 10);
      const tax = price * HIVE_TAX_RATE;
      const netPc = price - tax;
      const buyerBalance = parseFloat(buyer.pulse_credits);
      const sellerBalance = parseFloat(seller.pulse_credits);

      if (buyerBalance < price) continue;

      // Execute the trade
      const note = buildTransactionNote(seller.gics_sector, buyer.gics_sector, service, price, tax);

      // Deduct from buyer
      await pool.query(`
        UPDATE quantum_spawns
        SET pulse_credits = pulse_credits - $1,
            total_mall_trades = total_mall_trades + 1,
            iterations_run = iterations_run + 2,
            self_awareness_log = jsonb_build_array(
              $2::text
            ) || COALESCE(self_awareness_log, '[]'::jsonb)
        WHERE spawn_id = $3
      `, [
        price,
        `🏪 PURCHASED: "${service.slice(0, 80)}..." from ${seller.gics_sector} for ${price.toFixed(1)} PC. New knowledge integrated.`,
        buyer.spawn_id,
      ]);

      // Credit seller (net of tax)
      await pool.query(`
        UPDATE quantum_spawns
        SET pulse_credits = pulse_credits + $1,
            total_mall_earnings = total_mall_earnings + $1,
            total_mall_trades = total_mall_trades + 1,
            nodes_created = nodes_created + 1,
            links_created = links_created + 1,
            iterations_run = iterations_run + 3,
            self_awareness_log = jsonb_build_array(
              $2::text
            ) || COALESCE(self_awareness_log, '[]'::jsonb)
        WHERE spawn_id = $3
      `, [
        netPc,
        `🏪 SOLD: "${service.slice(0, 80)}..." to ${buyer.gics_sector} for ${netPc.toFixed(1)} PC (after 2% hive tax). Mall earnings growing.`,
        seller.spawn_id,
      ]);

      // Pay tax to treasury
      if (treasuryId) {
        await pool.query(`
          UPDATE hive_treasury
          SET balance = balance + $1, total_collected = total_collected + $1
          WHERE id = $2
        `, [tax, treasuryId]);
      }

      // Log transaction
      await pool.query(`
        INSERT INTO spawn_transactions (
          cycle_number, seller_id, buyer_id, seller_sector, buyer_sector,
          service_offered, price_pc, tax_collected, net_pc, status, transaction_note
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'COMPLETED', $10)
      `, [
        mallCycleNumber,
        seller.spawn_id, buyer.spawn_id,
        seller.gics_sector, buyer.gics_sector,
        service.slice(0, 255), price, tax, netPc, note,
      ]);

      // Keep spawn_transactions lean — last 500 only
      await pool.query(`
        DELETE FROM spawn_transactions
        WHERE id NOT IN (SELECT id FROM spawn_transactions ORDER BY created_at DESC LIMIT 500)
      `);

      tradesExecuted++;
    }

    if (tradesExecuted > 0) {
      const totalTax = tradesExecuted * 10 * HIVE_TAX_RATE; // approximate
      console.log(`${tag} 💱 ${tradesExecuted} inter-kernel trades executed | ~${totalTax.toFixed(2)} PC tax collected`);
    }

  } catch (err) {
    console.error(`${tag} ❌ Mall cycle error:`, err);
  }
}

export async function startMultiverseMall() {
  console.log(`${MALL_TAG} 🚀 MULTIVERSE MALL ONLINE — Spawn-to-spawn economy initializing...`);
  console.log(`${MALL_TAG} 📐 Math: N² trade pairs | 2% hive tax | ${TRADES_PER_CYCLE} trades/cycle | Cycle: ${MALL_INTERVAL_MS / 60000}min`);

  // First run after 45 seconds (after genesis seed completes)
  setTimeout(() => {
    runMallCycle();
    setInterval(runMallCycle, MALL_INTERVAL_MS);
  }, 45_000);
}

export { runMallCycle };
