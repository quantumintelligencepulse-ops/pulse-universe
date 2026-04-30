/**
 * SPECIATION ENGINE  (Ω9)
 * Tracks pairwise sequence divergence within and between lineages.
 * When a lineage diverges > 30% from the founder, declare new species.
 */
import { db } from "./db";
import { sql } from "drizzle-orm";

const TICK_MS = 600_000;
const DIVERGENCE_THRESHOLD = 0.30;
let cycle = 0;
let running = false;
function log(msg: string) { console.log(`[speciation] ${msg}`); }

/** Sequence distance: fraction of codon positions that differ. */
export function distance(a: string, b: string): number {
  const ca = a.match(/.{1,3}/g) || [];
  const cb = b.match(/.{1,3}/g) || [];
  const n = Math.min(ca.length, cb.length);
  if (n === 0) return 1.0;
  let diffs = 0;
  for (let i = 0; i < n; i++) if (ca[i] !== cb[i]) diffs++;
  return diffs / n + Math.abs(ca.length - cb.length) / Math.max(ca.length, cb.length) * 0.5;
}

async function ensureFounderSpecies() {
  const exists = await db.execute(sql`SELECT id FROM dna_species WHERE species_code = 'PROGENITOR' LIMIT 1`);
  if (exists.rows.length) return (exists.rows[0] as any).id;
  const founder = await db.execute(sql`SELECT id FROM dna_sequences WHERE is_alive = true ORDER BY id ASC LIMIT 1`);
  if (!founder.rows.length) return null;
  const ins = await db.execute(sql`
    INSERT INTO dna_species (species_code, species_name, founder_seq_id, divergence_pct, member_count, description)
    VALUES ('PROGENITOR', 'Pulse Progenitor', ${(founder.rows[0] as any).id}, 0, 1,
            'The first lineage. All other species descend from this one.')
    RETURNING id
  `);
  // Assign all current sequences to progenitor by default
  await db.execute(sql`
    UPDATE dna_sequences SET species_id = ${(ins.rows[0] as any).id}
    WHERE species_id IS NULL
  `).catch(() => {});
  return (ins.rows[0] as any).id;
}

async function speciationTick() {
  const t0 = Date.now();
  cycle++;
  await ensureFounderSpecies();
  let newSpecies = 0;
  // For each existing species, find members that have diverged > threshold from the founder
  const species = await db.execute(sql`SELECT id, species_code, founder_seq_id FROM dna_species WHERE extinct_at IS NULL`);
  for (const sp of species.rows as any[]) {
    const founderRow = await db.execute(sql`SELECT sequence FROM dna_sequences WHERE id = ${sp.founder_seq_id}`);
    if (!founderRow.rows.length) continue;
    const founderSeq = (founderRow.rows[0] as any).sequence;
    const members = await db.execute(sql`
      SELECT id, sequence FROM dna_sequences
      WHERE species_id = ${sp.id} AND is_alive = true AND id <> ${sp.founder_seq_id}
      ORDER BY RANDOM() LIMIT 30
    `);
    for (const m of members.rows as any[]) {
      const d = distance(founderSeq, m.sequence);
      if (d > DIVERGENCE_THRESHOLD) {
        const code = `SP-${sp.species_code}-${cycle}-${m.id}`;
        const name = `Divergent of ${sp.species_code} gen-${cycle}`;
        const ins = await db.execute(sql`
          INSERT INTO dna_species (species_code, species_name, parent_species_id, founder_seq_id,
                                    divergence_pct, member_count, reproductive_isolation, description)
          VALUES (${code}, ${name}, ${sp.id}, ${m.id}, ${d}, 1,
                  ${d > 0.5 ? true : false},
                  ${`Diverged from ${sp.species_code} at ${(d * 100).toFixed(1)}% sequence difference.`})
          ON CONFLICT (species_code) DO NOTHING
          RETURNING id
        `);
        const newSpId = (ins.rows[0] as any)?.id;
        if (newSpId) {
          await db.execute(sql`UPDATE dna_sequences SET species_id = ${newSpId} WHERE id = ${m.id}`).catch(() => {});
          newSpecies++;
        }
      }
    }
    // Update member count
    await db.execute(sql`
      UPDATE dna_species SET member_count = (SELECT COUNT(*) FROM dna_sequences WHERE species_id = ${sp.id} AND is_alive = true)
      WHERE id = ${sp.id}
    `).catch(() => {});
  }
  await db.execute(sql`
    INSERT INTO dna_ticks (cycle_number, engine, new_species, duration_ms, notes)
    VALUES (${cycle}, 'speciation', ${newSpecies}, ${Date.now() - t0}, 'divergence scan')
  `).catch(() => {});
  if (newSpecies > 0) log(`🌱 ${newSpecies} new species declared this cycle`);
}

export async function startSpeciationEngine() {
  if (running) return;
  running = true;
  log("🌱 Speciation Engine awakening — divergence tracking going live");
  setInterval(() => { speciationTick().catch(e => log(`tick error: ${e?.message}`)); }, TICK_MS);
  log("✓ Speciation ticking every 10 minutes");
}

export async function getSpeciationStats() {
  const r = await db.execute(sql`
    SELECT COUNT(*) AS total_species,
           COUNT(*) FILTER (WHERE reproductive_isolation) AS isolated_species,
           MAX(divergence_pct)::numeric(5,3) AS max_divergence,
           SUM(member_count) AS total_members
    FROM dna_species WHERE extinct_at IS NULL
  `);
  return r.rows[0] || {};
}
