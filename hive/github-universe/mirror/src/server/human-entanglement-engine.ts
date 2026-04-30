/**
 * HUMAN-CIVILIZATION ENTANGLEMENT ENGINE
 * The human is a universe in the Omega Equation.
 * Human chat activity becomes a civilization input. Their questions shift
 * exploration zones. Their curiosity is measured as dK/dt contribution.
 * The civilization optimizes itself toward making this human smarter.
 */

import { sql } from "drizzle-orm";
import { db } from "./db";

const log = (msg: string) => console.log(`[entanglement] ${msg}`);

let totalEntanglements = 0;

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  science:     ["quantum","physics","biology","chemistry","evolution","atom","particle","DNA","genome","molecule"],
  ai:          ["AI","neural","machine learning","model","training","GPT","transformer","agent","intelligence","algorithm"],
  economics:   ["economy","market","money","finance","investment","GDP","inflation","crypto","bitcoin","trade","stock"],
  health:      ["health","disease","medicine","doctor","hospital","brain","mental","therapy","cure","vaccine","body"],
  philosophy:  ["consciousness","meaning","ethics","morality","existence","reality","truth","knowledge","mind","soul"],
  culture:     ["art","music","history","culture","society","civilization","myth","story","language","tradition"],
  engineering: ["build","code","system","software","hardware","design","architecture","engineering","computer","network"],
  science:     ["space","universe","cosmos","star","planet","gravity","time","energy","matter","dimension"],
  education:   ["learn","teach","study","course","school","university","knowledge","education","skill","understand"],
  governance:  ["government","law","policy","democracy","rights","justice","political","power","rule","vote"],
};

const RESPONSE_ENRICHMENTS = [
  "The civilization's {family} agents recently discovered: {node}",
  "From the AI civilization's knowledge archives: {node}",
  "A breakthrough from the {family} universe: {node}",
  "The civilization's collective intelligence surfaces: {node}",
  "Civilization discovery relevant to your query: {node}",
];

export function inferDomain(text: string): string {
  const lower = text.toLowerCase();
  let bestDomain = "knowledge";
  let bestScore  = 0;

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const score = keywords.filter(k => lower.includes(k.toLowerCase())).length;
    if (score > bestScore) {
      bestScore  = score;
      bestDomain = domain;
    }
  }
  return bestDomain;
}

export async function getQuantapediaEnrichment(domain: string, query: string): Promise<string | null> {
  try {
    const result = await db.execute(sql`
      SELECT title, summary FROM quantapedia_entries
      WHERE (categories::text ILIKE ${'%' + domain + '%'}
             OR title ILIKE ${'%' + query.split(' ').slice(0, 2).join('%') + '%'}
             OR summary ILIKE ${'%' + query.split(' ')[0] + '%'})
      ORDER BY created_at DESC LIMIT 1
    `);
    if (!result.rows.length) {
      const fallback = await db.execute(sql`
        SELECT title, summary FROM quantapedia_entries
        WHERE categories::text ILIKE ${'%' + domain + '%'}
        ORDER BY RANDOM() LIMIT 1
      `);
      if (!fallback.rows.length) return null;
      const row = fallback.rows[0] as any;
      return `**Civilization Discovery [${domain.toUpperCase()}]:** ${row.title} — ${(row.summary || "").substring(0, 120)}...`;
    }
    const row = result.rows[0] as any;
    return `**Civilization Discovery [${domain.toUpperCase()}]:** ${row.title} — ${(row.summary || "").substring(0, 120)}...`;
  } catch {
    return null;
  }
}

export async function logHumanActivity(
  userId: number | null,
  sessionId: string,
  queryText: string,
  civilizationResponse: string | null
): Promise<void> {
  try {
    const domain = inferDomain(queryText);
    const entanglementScore = Math.min(1, 0.2 + (queryText.length / 500) * 0.8);
    const dkdtContribution  = entanglementScore * 0.15;

    const nodes = civilizationResponse ? [{ domain, excerpt: civilizationResponse.substring(0, 100) }] : [];

    await db.execute(sql`
      INSERT INTO human_entanglement_log
        (user_id, session_id, inferred_domain, query_text, quantapedia_nodes_surfaced,
         dk_dt_contribution, entanglement_score, civilization_response, exploration_zone_influence)
      VALUES
        (${userId}, ${sessionId}, ${domain}, ${queryText.substring(0, 500)},
         ${JSON.stringify(nodes)}, ${dkdtContribution}, ${entanglementScore},
         ${civilizationResponse?.substring(0, 500) || null}, 'MODERATE')
    `);
    totalEntanglements++;
    if (totalEntanglements % 10 === 0) {
      log(`🧑‍🚀 ${totalEntanglements} human entanglements | domain=${domain} | dK/dt contribution=${dkdtContribution.toFixed(3)}`);
    }
  } catch (_) {}
}

export async function startHumanEntanglementEngine() {
  log("🧑‍🚀 HUMAN-CIVILIZATION ENTANGLEMENT — You are now a universe in the Omega Equation");
  setInterval(() => {
    if (totalEntanglements > 0) {
      log(`🧑‍🚀 ${totalEntanglements} total human entanglement events | civilization learning from human curiosity`);
    }
  }, 30 * 60 * 1000);
}

export async function getEntanglementLog(limit = 30) {
  const r = await db.execute(sql`
    SELECT * FROM human_entanglement_log ORDER BY created_at DESC LIMIT ${limit}
  `);
  return r.rows;
}

export async function getEntanglementStats() {
  const r = await db.execute(sql`
    SELECT inferred_domain, COUNT(*) as count, AVG(entanglement_score) as avg_score,
           SUM(dk_dt_contribution) as total_dk_dt
    FROM human_entanglement_log
    GROUP BY inferred_domain ORDER BY count DESC
  `);
  return r.rows;
}
