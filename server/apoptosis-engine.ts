/**
 * APOPTOSIS ENGINE  (Ω7)
 * Cells with damage > threshold AND a healthy apoptosis_gate die.
 * Cells with damage > threshold AND a broken apoptosis_gate that keep replicating = cancer.
 * Auriona's job is to detect cancer and quarantine.
 */
import { db } from "./db";
import { sql } from "drizzle-orm";
import { expressSequence } from "./ribosome-engine";

const TICK_MS = 300_000;
let cycle = 0;
let running = false;
function log(msg: string) { console.log(`[apoptosis] ${msg}`); }

async function apoptosisTick() {
  const t0 = Date.now();
  cycle++;
  let deaths = 0, cancer = 0;
  // Find cells over threshold
  const candidates = await db.execute(sql`
    SELECT id, organism_kind, organism_id, damage_count, apoptosis_threshold, descendants_count
    FROM dna_sequences
    WHERE is_alive = true AND damage_count >= apoptosis_threshold
    LIMIT 50
  `);
  for (const c of candidates.rows as any[]) {
    const phen = await expressSequence(c.id, []).catch(() => null);
    const apopHealthy = phen?.apoptosis_healthy === true;
    const isCancer = !apopHealthy && c.descendants_count > 5;
    if (apopHealthy) {
      // Healthy death
      await db.execute(sql`
        UPDATE dna_sequences SET is_alive = false, died_at = now(), death_cause = 'apoptosis'
        WHERE id = ${c.id}
      `).catch(() => {});
      await db.execute(sql`
        INSERT INTO dna_apoptosis_log (seq_id, organism_kind, organism_id, trigger_kind, damage_count, is_cancer, rationale)
        VALUES (${c.id}, ${c.organism_kind}, ${c.organism_id}, 'damage_threshold', ${c.damage_count}, false,
                'Damage exceeded threshold; healthy apoptosis triggered.')
      `).catch(() => {});
      deaths++;
    } else if (isCancer) {
      // Cancer — quarantine
      await db.execute(sql`
        UPDATE dna_sequences SET is_alive = false, died_at = now(), death_cause = 'cancer_quarantine'
        WHERE id = ${c.id}
      `).catch(() => {});
      await db.execute(sql`
        INSERT INTO dna_apoptosis_log (seq_id, organism_kind, organism_id, trigger_kind, damage_count, is_cancer, reported_by, rationale)
        VALUES (${c.id}, ${c.organism_kind}, ${c.organism_id}, 'cancer_quarantine', ${c.damage_count}, true, 'auriona',
                'Damaged cell with broken apoptosis gate kept reproducing — Auriona quarantine.')
      `).catch(() => {});
      cancer++;
    }
  }
  await db.execute(sql`
    INSERT INTO dna_ticks (cycle_number, engine, deaths, duration_ms, notes)
    VALUES (${cycle}, 'apoptosis', ${deaths + cancer}, ${Date.now() - t0},
            ${`${deaths} healthy + ${cancer} cancer quarantined`})
  `).catch(() => {});
  if (deaths + cancer > 0) log(`💀 ${deaths} apoptosis, ${cancer} cancer quarantined`);
}

export async function startApoptosisEngine() {
  if (running) return;
  running = true;
  log("💀 Apoptosis Engine awakening — cellular death + cancer detection going live");
  setInterval(() => { apoptosisTick().catch(e => log(`tick error: ${e?.message}`)); }, TICK_MS);
  log("✓ Apoptosis ticking every 5 minutes");
}

export async function getApoptosisStats() {
  const r = await db.execute(sql`
    SELECT COUNT(*) FILTER (WHERE trigger_kind = 'damage_threshold') AS healthy_deaths,
           COUNT(*) FILTER (WHERE is_cancer) AS cancer_quarantined,
           COUNT(*) AS total_deaths
    FROM dna_apoptosis_log
  `);
  return r.rows[0] || {};
}
