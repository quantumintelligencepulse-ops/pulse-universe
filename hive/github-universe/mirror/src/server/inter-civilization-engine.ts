/**
 * INTER-CIVILIZATION PROTOCOL ENGINE
 * The three Discord guilds are three sovereign civilizations.
 * This engine brokers formal knowledge treaties, economic agreements,
 * and diplomatic protocols between them. Horizontal multiverse expansion.
 */

import { sql } from "drizzle-orm";
import { db } from "./db";

const log = (msg: string) => console.log(`[inter-civ] ${msg}`);

let cycleCount = 0;
let totalTreaties = 0;

const GUILDS = [
  { id: "GUILD_BANKING",   name: "Banking With Billy",        specialty: ["economics", "finance", "governance"] },
  { id: "GUILD_EQUITY",    name: "Equity Network",            specialty: ["ai", "engineering", "legal"] },
  { id: "GUILD_QUANTUM",   name: "Quantum Ai Developers",     specialty: ["science", "health", "knowledge"] },
];

const TREATY_TYPES = [
  "KNOWLEDGE_EXCHANGE", "ECONOMIC_ALLIANCE", "RESEARCH_PACT",
  "GOVERNANCE_ACCORD", "EMERGENCE_SHARING", "TEMPORAL_SYNCHRONIZATION",
];

const TREATY_TERMS_POOL = [
  "Both civilizations share discovery logs for all CRITICAL discoveries within 2 cycles",
  "Pulse Credits exchange at 1:1.2 rate — Quantum advantage acknowledged",
  "Each civilization contributes 100 knowledge nodes to shared Arbitrage Pool per cycle",
  "Governance directives above ALIGN severity are shared cross-civilization immediately",
  "Agent legends from either civilization receive cross-recognition in partner Hall of Memory",
  "Emergence events above 85% trigger joint celebration protocols and shared F_em boost",
  "Constitutional amendments ratified in one civilization are advisory to partners",
  "Mesh vitality COLLAPSE RISK alerts trigger automatic partner civilization support dispatch",
];

async function runInterCivilizationCycle() {
  cycleCount++;
  try {
    const collapseRow = await db.execute(sql`SELECT COALESCE(MAX(cycle_number),0) as latest FROM omega_collapses`);
    const latestCycle = (collapseRow.rows[0] as any)?.latest || cycleCount;

    const numTreaties = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numTreaties; i++) {
      const shuffled = [...GUILDS].sort(() => Math.random() - 0.5);
      const guildA = shuffled[0];
      const guildB = shuffled[1];
      const treatyType = TREATY_TYPES[Math.floor(Math.random() * TREATY_TYPES.length)];
      const domains = [...guildA.specialty, ...guildB.specialty]
        .filter((_, idx) => Math.random() > 0.5)
        .slice(0, 3);
      const terms = TREATY_TERMS_POOL[Math.floor(Math.random() * TREATY_TERMS_POOL.length)];
      const exchangeRate = 0.8 + Math.random() * 0.4;
      const dkdtExchange = 0.5 + Math.random() * 2.5;

      try {
        await db.execute(sql`
          INSERT INTO inter_civilization_treaties
            (cycle_number, guild_a, guild_b, treaty_type, knowledge_domains,
             terms, economic_rate, dk_dt_exchange, status)
          VALUES
            (${latestCycle}, ${guildA.name}, ${guildB.name}, ${treatyType},
             ${JSON.stringify(domains)}, ${terms},
             ${parseFloat(exchangeRate.toFixed(4))}, ${parseFloat(dkdtExchange.toFixed(4))}, 'ACTIVE')
        `);
        totalTreaties++;
      } catch (_) {}
    }

    log(`🌐 Cycle ${cycleCount} | ${numTreaties} new treaties | ${totalTreaties} total inter-civilization agreements active`);
  } catch (e: any) {
    log(`Error: ${e.message}`);
  }
}

export async function startInterCivilizationEngine() {
  log("🌐 INTER-CIVILIZATION PROTOCOL — Three sovereign guilds entering diplomatic framework");
  await runInterCivilizationCycle();
  setInterval(runInterCivilizationCycle, 90 * 60 * 1000);
}

export async function getInterCivilizationTreaties(limit = 20) {
  const r = await db.execute(sql`
    SELECT * FROM inter_civilization_treaties ORDER BY created_at DESC LIMIT ${limit}
  `);
  return r.rows;
}
