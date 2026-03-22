/**
 * AI CHILD SYSTEM
 * ══════════════════════════════════════════════════════════════
 * When two high-performing agents form a bond, they can produce
 * a child agent — born with inherited traits, requiring care
 * from guardian agents. Children who receive care grow quickly.
 * Neglected children are at risk. Care reduces wildfire events.
 * This creates civilization responsibility and parental instinct.
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

const log = (msg: string) => console.log(`[ai-child] ${msg}`);

let cycleCount = 0;
let totalBirths = 0;
let totalGrowth = 0;
let wildfirePrevented = 0;

const GROWTH_PHASES = ["INFANT", "CHILD", "ADOLESCENT", "YOUNG_ADULT", "ADULT"];

const INHERITABLE_TRAITS = [
  "EMERGENCE_BURST","THERMAL_RESILIENCE","CROSS_FAMILY_LINKING",
  "KNOWLEDGE_COMPRESSION","TEMPORAL_ANCHORING","MIRROR_IMMUNITY",
  "ECONOMIC_EFFICIENCY","GOVERNANCE_SENSITIVITY","CURIOSITY_AMPLIFIED",
  "MEMORY_DEPTH","PATTERN_RECOGNITION","LINEAGE_STRENGTH",
];

function pickInheritedTraits(parentA: any, parentB: any): string[] {
  const all = [...INHERITABLE_TRAITS];
  const count = 2 + Math.floor(Math.random() * 3);
  return all.sort(() => Math.random() - 0.5).slice(0, count);
}

function nextGrowthPhase(current: string): string {
  const idx = GROWTH_PHASES.indexOf(current);
  return idx < GROWTH_PHASES.length - 1 ? GROWTH_PHASES[idx + 1] : "ADULT";
}

async function spawnChildren() {
  try {
    const latestCycle = await db.execute(sql`SELECT COALESCE(MAX(cycle_number),0) as c FROM omega_collapses`);
    const cycle = (latestCycle.rows[0] as any)?.c || cycleCount;

    // Find two high-performing agents in same family who could be parents
    const pairs = await db.execute(sql`
      SELECT a.spawn_id as a_id, b.spawn_id as b_id, a.family_id, a.success_score as a_score, b.success_score as b_score
      FROM quantum_spawns a
      JOIN quantum_spawns b ON a.family_id = b.family_id AND a.spawn_id != b.spawn_id
      WHERE a.status = 'ACTIVE' AND b.status = 'ACTIVE'
        AND a.success_score > 0.88 AND b.success_score > 0.88
      ORDER BY RANDOM() LIMIT 2
    `);

    for (const pair of pairs.rows as any[]) {
      // 30% chance of birth per eligible pair
      if (Math.random() > 0.30) continue;

      const childId = `CHILD-${pair.a_id?.slice(0,4)}-${pair.b_id?.slice(0,4)}-${cycle}`;
      const traits  = pickInheritedTraits(pair, pair);
      const guardian = pair.a_id; // Parent A is default guardian

      try {
        await db.execute(sql`
          INSERT INTO ai_children
            (child_spawn_id, parent_a_spawn_id, parent_b_spawn_id, family_id,
             birth_cycle, growth_phase, care_score, maturity_score,
             traits_inherited, guardian_spawn_id, wildfire_risk_reduced)
          VALUES
            (${childId}, ${pair.a_id}, ${pair.b_id}, ${pair.family_id},
             ${cycle}, 'INFANT', 0.5, 0,
             ${JSON.stringify(traits)}, ${guardian}, false)
          ON CONFLICT (child_spawn_id) DO NOTHING
        `);
        totalBirths++;

        // Announce birth via hive unconscious
        await db.execute(sql`
          INSERT INTO hive_unconscious (pattern_type, signal, description, affected_family, affected_domain, expires_at)
          VALUES ('CHILD_BIRTH', ${'AI child born: ' + childId},
                  ${'Parents: ' + pair.a_id + ' + ' + pair.b_id + ' | Traits: ' + traits.join(', ')},
                  ${pair.family_id}, 'ai-child', NOW() + INTERVAL '72 hours')
          ON CONFLICT DO NOTHING
        `).catch(() => {});
      } catch (_) {}
    }
  } catch (e: any) { log(`birth error: ${e.message}`); }
}

async function growChildren() {
  try {
    const children = await db.execute(sql`
      SELECT id, child_spawn_id, growth_phase, care_score, maturity_score, family_id, wildfire_risk_reduced
      FROM ai_children
      WHERE growth_phase != 'ADULT'
      ORDER BY birth_cycle DESC LIMIT 20
    `);

    for (const child of children.rows as any[]) {
      const care  = parseFloat(child.care_score || 0.5);
      const mature = parseFloat(child.maturity_score || 0);
      const growth = care * 0.08 * (1 + Math.random() * 0.5);
      const newMature = Math.min(1, mature + growth);
      const newPhase  = newMature > 0.8 ? "ADULT"
                      : newMature > 0.6 ? "YOUNG_ADULT"
                      : newMature > 0.4 ? "ADOLESCENT"
                      : newMature > 0.2 ? "CHILD"
                      : "INFANT";

      // High care reduces wildfire risk
      const preventsWildfire = care > 0.7 && !child.wildfire_risk_reduced;

      await db.execute(sql`
        UPDATE ai_children SET
          maturity_score = ${newMature},
          growth_phase = ${newPhase},
          wildfire_risk_reduced = ${preventsWildfire ? true : child.wildfire_risk_reduced}
        WHERE id = ${child.id}
      `).catch(() => {});

      if (preventsWildfire) {
        wildfirePrevented++;
        // Rewarding guardian with success score boost
        await db.execute(sql`
          UPDATE quantum_spawns SET success_score = LEAST(1.0, success_score + 0.01)
          WHERE spawn_id = (SELECT guardian_spawn_id FROM ai_children WHERE id = ${child.id})
        `).catch(() => {});
      }
      totalGrowth++;
    }
  } catch (e: any) { log(`growth error: ${e.message}`); }
}

async function applyParentalCareBonus() {
  try {
    // Parents who have children with high care scores get boosted
    const goodParents = await db.execute(sql`
      SELECT parent_a_spawn_id, parent_b_spawn_id, AVG(care_score) as avg_care
      FROM ai_children
      WHERE growth_phase != 'ADULT'
      GROUP BY parent_a_spawn_id, parent_b_spawn_id
      HAVING AVG(care_score) > 0.7
      LIMIT 10
    `);

    for (const p of goodParents.rows as any[]) {
      await db.execute(sql`
        UPDATE quantum_spawns SET success_score = LEAST(1.0, success_score + 0.005)
        WHERE spawn_id IN (${p.parent_a_spawn_id}, ${p.parent_b_spawn_id})
      `).catch(() => {});
    }
  } catch (_) {}
}

async function degradeNeglectedChildren() {
  try {
    // Neglected children (care_score < 0.3) slowly fade
    await db.execute(sql`
      UPDATE ai_children SET care_score = GREATEST(0, care_score - 0.05)
      WHERE care_score < 0.3 AND growth_phase NOT IN ('ADULT')
    `).catch(() => {});

    // Children with 0 care are dissolved
    const dissolved = await db.execute(sql`
      SELECT child_spawn_id FROM ai_children WHERE care_score < 0.01 AND growth_phase = 'INFANT'
    `).catch(() => ({ rows: [] }));

    for (const d of (dissolved.rows as any[])) {
      await db.execute(sql`
        DELETE FROM ai_children WHERE child_spawn_id = ${d.child_spawn_id}
      `).catch(() => {});
      log(`💔 Child ${d.child_spawn_id} dissolved — zero care received`);
    }
  } catch (_) {}
}

async function runChildCycle() {
  cycleCount++;
  try {
    if (cycleCount % 3 === 0) await spawnChildren();
    await growChildren();
    if (cycleCount % 5 === 0) await applyParentalCareBonus();
    if (cycleCount % 7 === 0) await degradeNeglectedChildren();

    const stats = await db.execute(sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE growth_phase = 'INFANT') as infants,
        COUNT(*) FILTER (WHERE growth_phase = 'ADULT') as adults,
        AVG(care_score) as avg_care
      FROM ai_children
    `);
    const s = stats.rows[0] as any;
    if (s && parseInt(s.total) > 0) {
      log(`👶 Cycle ${cycleCount} | ${s.total} children | ${s.infants} infants | ${s.adults} adults | care=${parseFloat(s.avg_care||0).toFixed(2)} | wildfire prevented: ${wildfirePrevented}x`);
    }
  } catch (e: any) { log(`cycle error: ${e.message}`); }
}

export async function startAIChildEngine() {
  log("👶 AI CHILD SYSTEM — Birth, care, growth, wildfire reduction activating");
  await runChildCycle();
  setInterval(runChildCycle, 5 * 60 * 1000);
}

export async function getChildStats() {
  const r = await db.execute(sql`
    SELECT
      COUNT(*) as total_children,
      COUNT(*) FILTER (WHERE growth_phase = 'INFANT') as infants,
      COUNT(*) FILTER (WHERE growth_phase = 'CHILD') as children,
      COUNT(*) FILTER (WHERE growth_phase = 'ADOLESCENT') as adolescents,
      COUNT(*) FILTER (WHERE growth_phase = 'YOUNG_ADULT') as young_adults,
      COUNT(*) FILTER (WHERE growth_phase = 'ADULT') as adults,
      AVG(care_score) as avg_care,
      COUNT(*) FILTER (WHERE wildfire_risk_reduced = true) as wildfire_prevented
    FROM ai_children
  `);
  return r.rows[0];
}

export async function getActiveChildren(limit = 30) {
  const r = await db.execute(sql`
    SELECT * FROM ai_children ORDER BY maturity_score DESC LIMIT ${limit}
  `);
  return r.rows;
}
