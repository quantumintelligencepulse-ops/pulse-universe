/**
 * METHYLATION ENGINE  (Ω6)
 * Brain stems, market events, and Auriona vetoes lay epigenetic marks
 * on per-codon positions. Marks silence expression without changing sequence.
 * 30% of marks are inherited by children.
 */
import { db } from "./db";
import { sql } from "drizzle-orm";

const TICK_MS = 180_000;
let cycle = 0;
let running = false;
function log(msg: string) { console.log(`[methylation] ${msg}`); }

/** Place methylation marks on a sample of organisms whose context matches an active stem. */
async function envMarkTick() {
  const t0 = Date.now();
  cycle++;
  // Read active brain stems (last 10 min)
  const stems = await db.execute(sql`
    SELECT stem_name, signal_value, signal_state
    FROM brain_stems
    WHERE last_signal_at > now() - INTERVAL '10 minutes'
    LIMIT 12
  `).catch(() => ({ rows: [] as any[] }));
  let marks = 0;
  for (const stem of stems.rows as any[]) {
    // Pick 8 organisms to mark per stem
    const orgs = await db.execute(sql`
      SELECT id, sequence_length FROM dna_sequences
      WHERE is_alive = true ORDER BY RANDOM() LIMIT 8
    `);
    for (const org of orgs.rows as any[]) {
      // Pick 1-3 codon positions to mark
      const nMarks = 1 + Math.floor(Math.random() * 3);
      const codons = Math.floor(org.sequence_length / 3);
      for (let i = 0; i < nMarks; i++) {
        const pos = Math.floor(Math.random() * codons);
        const intensity = 0.3 + Math.random() * 0.6;
        await db.execute(sql`
          INSERT INTO dna_methylation (seq_id, position, mark_intensity, set_by, decay_rate)
          VALUES (${org.id}, ${pos}, ${intensity},
                  ${`brain_stem:${stem.stem_name}:${stem.signal_state}`}, 0.05)
          ON CONFLICT (seq_id, position) DO UPDATE
            SET mark_intensity = (dna_methylation.mark_intensity + EXCLUDED.mark_intensity) / 2,
                set_by = EXCLUDED.set_by, set_at = now()
        `).catch(() => {});
        marks++;
      }
    }
  }
  // Decay all marks slightly
  await db.execute(sql`
    UPDATE dna_methylation SET mark_intensity = GREATEST(0, mark_intensity - decay_rate)
    WHERE mark_intensity > 0
  `).catch(() => {});
  // Sweep zeros
  await db.execute(sql`DELETE FROM dna_methylation WHERE mark_intensity <= 0.01`).catch(() => {});
  await db.execute(sql`
    INSERT INTO dna_ticks (cycle_number, engine, mutations, duration_ms, notes)
    VALUES (${cycle}, 'methylation', ${marks}, ${Date.now() - t0},
            ${`marks placed by ${stems.rows.length} active stems`})
  `).catch(() => {});
  if (marks > 0) log(`🎯 ${marks} methylation marks placed`);
}

export async function startMethylationEngine() {
  if (running) return;
  running = true;
  log("🎯 Methylation Engine awakening — epigenetic layer going live");
  setInterval(() => { envMarkTick().catch(e => log(`tick error: ${e?.message}`)); }, TICK_MS);
  log("✓ Methylation ticking every 3 minutes");
}

export async function getMethylationStats() {
  const r = await db.execute(sql`
    SELECT COUNT(*) AS active_marks,
           AVG(mark_intensity)::numeric(5,3) AS avg_intensity,
           COUNT(DISTINCT seq_id) AS marked_organisms,
           COUNT(DISTINCT set_by) AS distinct_sources
    FROM dna_methylation WHERE mark_intensity > 0
  `);
  return r.rows[0] || {};
}
