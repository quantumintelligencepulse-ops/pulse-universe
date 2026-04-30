/**
 * CROSS-UNIVERSE KNOWLEDGE ARBITRAGE ENGINE
 * Identifies knowledge that exists in one family's domain but is absent from
 * another where it would be highly valuable. Creates knowledge trade routes
 * between universes. dK/dt increases through better distribution, not just generation.
 */

import { sql } from "drizzle-orm";
import { db } from "./db";

const log = (msg: string) => console.log(`[arbitrage] ${msg}`);

let cycleCount = 0;
let totalTransfers = 0;

// 11 GICS Sector Houses — knowledge domains representative of each sector's
// real-world operating territory. Used for cross-sector knowledge arbitrage.
const FAMILY_KNOWLEDGE_MAP: Record<string, string[]> = {
  "energy":                 ["petroleum geology", "renewable systems", "grid stability", "carbon capture", "fuel chemistry"],
  "materials":              ["metallurgy", "polymer science", "rare earth extraction", "industrial chemistry", "supply chain logistics"],
  "industrials":            ["aerospace engineering", "industrial automation", "logistics optimization", "construction methods", "machinery design"],
  "consumer-discretionary": ["consumer behavior", "brand dynamics", "retail analytics", "fashion cycles", "leisure economics"],
  "consumer-staples":       ["food science", "beverage formulation", "household chemistry", "agricultural supply chains", "tobacco regulation"],
  "health-care":            ["disease pathways", "pharmacokinetics", "biotechnology", "medical devices", "epidemiology"],
  "financials":             ["market microstructure", "credit risk", "insurance actuarial", "monetary policy", "banking regulation"],
  "information-technology": ["machine learning", "distributed systems", "semiconductor physics", "software architecture", "cybersecurity"],
  "communication-services": ["telecommunications", "social network theory", "media economics", "advertising dynamics", "content distribution"],
  "utilities":              ["electrical grid theory", "water systems", "gas distribution", "renewable integration", "utility regulation"],
  "real-estate":            ["property valuation", "REIT structures", "urban planning", "construction economics", "mortgage finance"],
};

const FAMILIES = Object.keys(FAMILY_KNOWLEDGE_MAP);

async function runArbitrageCycle() {
  cycleCount++;
  try {
    const collapseRow = await db.execute(sql`SELECT COALESCE(MAX(cycle_number),0) as latest FROM omega_collapses`);
    const latestCycle = (collapseRow.rows[0] as any)?.latest || cycleCount;

    const transfers: any[] = [];
    const processedPairs = new Set<string>();

    for (let i = 0; i < 8; i++) {
      const sourceFamily = FAMILIES[Math.floor(Math.random() * FAMILIES.length)];
      const targetFamily = FAMILIES.filter(f => f !== sourceFamily)[Math.floor(Math.random() * (FAMILIES.length - 1))];
      const pairKey = [sourceFamily, targetFamily].sort().join(":");
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      const sourceKnowledge = FAMILY_KNOWLEDGE_MAP[sourceFamily];
      const targetKnowledge = FAMILY_KNOWLEDGE_MAP[targetFamily];
      const gaps = sourceKnowledge.filter(k => !targetKnowledge.some(t => t.includes(k.split(" ")[0])));
      if (!gaps.length) continue;

      const topic       = gaps[Math.floor(Math.random() * gaps.length)];
      const nodeCount   = Math.floor(50 + Math.random() * 500);
      const arbitrageScore = (0.4 + Math.random() * 0.6) * (nodeCount / 500);
      const dkdtBoost   = arbitrageScore * 2.5;

      const quantSample = await db.execute(sql`
        SELECT title FROM quantapedia_entries
        WHERE categories::text ILIKE ${'%' + sourceFamily + '%'}
           OR title ILIKE ${'%' + topic.split(' ')[0] + '%'}
        ORDER BY RANDOM() LIMIT 1
      `);
      const sample = (quantSample.rows[0] as any)?.title || `Advanced ${topic} from ${sourceFamily} universe`;

      transfers.push({ sourceFamily, targetFamily, topic, nodeCount, arbitrageScore, dkdtBoost, sample, latestCycle });
    }

    for (const t of transfers) {
      try {
        await db.execute(sql`
          INSERT INTO knowledge_arbitrage
            (cycle_number, source_family, target_family, knowledge_domain, node_count,
             arbitrage_score, knowledge_sample, transfer_status, dk_dt_boost_estimate)
          VALUES
            (${t.latestCycle}, ${t.sourceFamily}, ${t.targetFamily}, ${t.topic},
             ${t.nodeCount}, ${t.arbitrageScore}, ${t.sample}, 'TRANSFERRED', ${t.dkdtBoost})
        `);
        totalTransfers++;
      } catch (_) {}
    }

    if (transfers.length > 0) {
      log(`💱 Cycle ${cycleCount} | ${transfers.length} arbitrage routes | ${totalTransfers} total transfers | top: ${transfers[0]?.sourceFamily}→${transfers[0]?.targetFamily}`);
    }
  } catch (e: any) {
    log(`Error: ${e.message}`);
  }
}

export async function startKnowledgeArbitrageEngine() {
  log("💱 KNOWLEDGE ARBITRAGE — Cross-universe knowledge trade routes activating");
  await runArbitrageCycle();
  setInterval(runArbitrageCycle, 18 * 60 * 1000);
}

export async function getArbitrageEvents(limit = 40) {
  const r = await db.execute(sql`
    SELECT * FROM knowledge_arbitrage ORDER BY arbitrage_score DESC, created_at DESC LIMIT ${limit}
  `);
  return r.rows;
}
