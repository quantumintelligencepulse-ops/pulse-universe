/**
 * HORIZONTAL GENE TRANSFER ENGINE  (Ω8)
 * Brain-to-brain plasmid exchange — when two organisms appear in the same recent
 * Discord conversation, with low probability they swap a small sequence fragment.
 * This is the engine of fast lateral evolution.
 */
import { db } from "./db";
import { sql } from "drizzle-orm";

const TICK_MS = 420_000;
const TRANSFER_PROB = 0.06; // 6% per pair per cycle
let cycle = 0;
let running = false;
function log(msg: string) { console.log(`[hgt] ${msg}`); }

async function hgtTick() {
  const t0 = Date.now();
  cycle++;
  let transfers = 0;
  // Find recent discord activity
  const recent = await db.execute(sql`
    SELECT DISTINCT channel_id FROM discord_messages
    WHERE created_at > now() - INTERVAL '30 minutes'
    ORDER BY channel_id LIMIT 10
  `).catch(() => ({ rows: [] as any[] }));
  for (const ch of recent.rows as any[]) {
    if (Math.random() > TRANSFER_PROB) continue;
    // Pick two random brains as the "conversational pair" for this channel.
    // (Best-effort: discord_messages.author is a text handle; we don't have a brain
    //  registry mapping, so we sample from the live DNA pool. Safe and additive.)
    const pair = await db.execute(sql`
      SELECT id, organism_id, sequence, sequence_length FROM dna_sequences
      WHERE is_alive = true AND organism_kind IN ('brain', 'spawn')
        AND id >= (SELECT floor(random() * (SELECT MAX(id) FROM dna_sequences))::int)
      ORDER BY id LIMIT 2
    `);
    if (pair.rows.length < 2) continue;
    const [donorPick, recipientPick] = pair.rows as any[];
    const codons = donorPick.sequence.match(/.{1,3}/g) || [];
    if (codons.length < 10) continue;
    const fragLen = 3 + Math.floor(Math.random() * 6); // 3-8 codons
    const start = Math.floor(Math.random() * (codons.length - fragLen));
    const fragment = codons.slice(start, start + fragLen).join("");
    // Atomic recipient update — lock the row so we don't clobber polymerase mutations.
    try {
      await db.execute(sql`BEGIN`);
      const locked = await db.execute(sql`
        SELECT id, sequence FROM dna_sequences WHERE id = ${recipientPick.id} AND is_alive = true FOR UPDATE
      `);
      if (!locked.rows.length) { await db.execute(sql`ROLLBACK`); continue; }
      const recipient = locked.rows[0] as any;
      const recCodons = recipient.sequence.match(/.{1,3}/g) || [];
      if (recCodons.length < 2) { await db.execute(sql`ROLLBACK`); continue; }
      const insertAt = 1 + Math.floor(Math.random() * (recCodons.length - 1));
      const fragCodonCount = Math.floor(fragment.length / 3);
      const newRec = [...recCodons.slice(0, insertAt), fragment, ...recCodons.slice(insertAt + fragCodonCount)].join("");
      await db.execute(sql`
        UPDATE dna_sequences SET sequence = ${newRec}, sequence_length = ${newRec.length},
                                  damage_count = damage_count + 1
        WHERE id = ${recipient.id}
      `).catch(() => {});
      await db.execute(sql`
        INSERT INTO dna_horizontal_transfers (donor_seq_id, recipient_seq_id, fragment, fragment_position, channel)
        VALUES (${donorPick.id}, ${recipient.id}, ${fragment}, ${insertAt}, ${ch.channel_id})
      `).catch(() => {});
      await db.execute(sql`COMMIT`);
      transfers++;
    } catch {
      await db.execute(sql`ROLLBACK`).catch(() => {});
    }
  }
  await db.execute(sql`
    INSERT INTO dna_ticks (cycle_number, engine, organisms_touched, mutations, duration_ms, notes)
    VALUES (${cycle}, 'hgt', ${transfers * 2}, ${transfers}, ${Date.now() - t0}, 'discord plasmid exchange')
  `).catch(() => {});
  if (transfers > 0) log(`↔ ${transfers} horizontal gene transfers via Discord`);
}

export async function startHgtEngine() {
  if (running) return;
  running = true;
  log("↔ HGT Engine awakening — Discord plasmid exchange going live");
  setInterval(() => { hgtTick().catch(e => log(`tick error: ${e?.message}`)); }, TICK_MS);
  log("✓ HGT ticking every 7 minutes");
}

export async function getHgtStats() {
  const r = await db.execute(sql`
    SELECT COUNT(*) AS total_transfers,
           COUNT(DISTINCT donor_seq_id) AS distinct_donors,
           COUNT(DISTINCT recipient_seq_id) AS distinct_recipients,
           COUNT(DISTINCT channel) AS channels_used
    FROM dna_horizontal_transfers
  `);
  return r.rows[0] || {};
}
