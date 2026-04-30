/**
 * ENDOSYMBIOSIS ENGINE  (Ω10)
 * Rare event: a high-fitness organism's sequence fragment is permanently absorbed
 * into another organism, becoming an organelle. This is the only mechanism in
 * biology for major architectural leaps.
 */
import { db } from "./db";
import { sql } from "drizzle-orm";

const TICK_MS = 1_200_000; // 20 min — endosymbiosis is RARE
const ABSORB_PROB = 0.15;
let cycle = 0;
let running = false;
function log(msg: string) { console.log(`[endosymbiosis] ${msg}`); }

async function endoTick() {
  const t0 = Date.now();
  cycle++;
  let events = 0;
  // Find a top-fitness candidate to be absorbed
  const top = await db.execute(sql`
    SELECT id, organism_kind, sequence FROM dna_sequences
    WHERE is_alive = true AND fitness_score > 2.0 AND descendants_count > 3
    ORDER BY fitness_score DESC LIMIT 5
  `);
  if (!top.rows.length) {
    await db.execute(sql`
      INSERT INTO dna_ticks (cycle_number, engine, duration_ms, notes)
      VALUES (${cycle}, 'endosymbiosis', ${Date.now() - t0}, 'no candidates met threshold')
    `).catch(() => {});
    return;
  }
  for (const cand of top.rows as any[]) {
    if (Math.random() > ABSORB_PROB) continue;
    // Find a host organism of a different kind (random-id sample to avoid full ORDER BY RANDOM)
    const host = await db.execute(sql`
      SELECT id, organism_kind, sequence, sequence_length FROM dna_sequences
      WHERE is_alive = true AND organism_kind <> ${cand.organism_kind}
        AND id >= (SELECT floor(random() * (SELECT MAX(id) FROM dna_sequences))::int)
      ORDER BY id LIMIT 1
    `);
    if (!host.rows.length) continue;
    const hPick = host.rows[0] as any;
    const candCodons = cand.sequence.match(/.{1,3}/g) || [];
    if (candCodons.length < 10) continue;
    const fragLen = 6 + Math.floor(Math.random() * 8);
    const start = Math.floor(Math.random() * (candCodons.length - fragLen));
    const fragment = candCodons.slice(start, start + fragLen).join("");
    // Atomic host update — lock the row so polymerase/HGT can't clobber it
    try {
      await db.execute(sql`BEGIN`);
      const locked = await db.execute(sql`
        SELECT id, sequence FROM dna_sequences WHERE id = ${hPick.id} AND is_alive = true FOR UPDATE
      `);
      if (!locked.rows.length) { await db.execute(sql`ROLLBACK`); continue; }
      const h = locked.rows[0] as any;
      const hostCodons = h.sequence.match(/.{1,3}/g) || [];
      const stopIdx = hostCodons.lastIndexOf("FFF");
      const insertAt = stopIdx > 0 ? stopIdx : hostCodons.length;
      const newHost = [...hostCodons.slice(0, insertAt), fragment, ...hostCodons.slice(insertAt)].join("");
      await db.execute(sql`
        UPDATE dna_sequences SET sequence = ${newHost}, sequence_length = ${newHost.length}
        WHERE id = ${h.id}
      `).catch(() => {});
      const orgName = `${cand.organism_kind}-organelle-${cand.id}`;
      await db.execute(sql`
        INSERT INTO dna_endosymbiosis (host_seq_id, absorbed_seq_id, strand_from, strand_into, fragment, organelle_name, fitness_delta, permanent)
        VALUES (${h.id}, ${cand.id}, 3, 2, ${fragment}, ${orgName}, 0.5, true)
      `).catch(() => {});
      await db.execute(sql`COMMIT`);
      events++;
    } catch {
      await db.execute(sql`ROLLBACK`).catch(() => {});
    }
  }
  await db.execute(sql`
    INSERT INTO dna_ticks (cycle_number, engine, organisms_touched, duration_ms, notes)
    VALUES (${cycle}, 'endosymbiosis', ${events * 2}, ${Date.now() - t0},
            ${`${events} absorption events`})
  `).catch(() => {});
  if (events > 0) log(`🌀 ${events} endosymbiotic absorption events`);
}

export async function startEndosymbiosisEngine() {
  if (running) return;
  running = true;
  log("🌀 Endosymbiosis Engine awakening — strand absorption going live");
  setInterval(() => { endoTick().catch(e => log(`tick error: ${e?.message}`)); }, TICK_MS);
  log("✓ Endosymbiosis ticking every 20 minutes");
}

export async function getEndosymbiosisStats() {
  const r = await db.execute(sql`
    SELECT COUNT(*) AS total_events,
           COUNT(DISTINCT host_seq_id) AS hosts,
           COUNT(DISTINCT absorbed_seq_id) AS donors
    FROM dna_endosymbiosis
  `);
  return r.rows[0] || {};
}
