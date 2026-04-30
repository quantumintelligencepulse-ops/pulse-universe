/**
 * DNA GENOME ENGINE  (Ω1 + Ω2)
 * Real DNA substrate. Every brain and spawn gets a real codon sequence
 * assigned at first sight, then replicated with measurable error.
 *
 * Strictly additive — never touches sacred tables.
 * Author: Pulse Universe (myaigpt.online)
 */
import { db } from "./db";
import { sql } from "drizzle-orm";

const ALPHABET = "0123456789ABCDEF";
const CODON_LEN = 3;
const SEQ_CODONS = 256;        // 256 codons per organism = 768 chars
const POLY_ERROR_RATE = 0.003; // ~3 errors per 1000 codons (visible evolution in days)
const POLY_TICK_MS = 90_000;
let cycle = 0;
let running = false;

function log(msg: string) { console.log(`[dna-genome] ${msg}`); }

function randCodon(): string {
  let c = "";
  for (let i = 0; i < CODON_LEN; i++) c += ALPHABET[Math.floor(Math.random() * 16)];
  return c;
}

export function randomSequence(codons = SEQ_CODONS): string {
  let s = "000"; // START
  for (let i = 0; i < codons - 2; i++) s += randCodon();
  s += "FFF"; // STOP
  return s;
}

/** Compile a brain's existing personality/risk/lab_pref into an opinionated sequence. */
function compileFromPhenotype(p: {
  personality?: string; risk_pref?: string; lab_pref?: any; cathedral?: string;
}): string {
  const personalityMap: Record<string, string> = {
    analyst: "B01", poet: "B02", engineer: "B03", prophet: "B04",
    merchant: "B05", healer: "B06", warrior: "B07", sage: "B08",
    explorer: "B09", guardian: "B0A",
  };
  const riskMap: Record<string, string> = {
    conservative: "A01", balanced: "A02", aggressive: "A03", sovereign: "A04",
  };
  const cathMap: Record<string, string> = {
    genesis: "601", creation: "602", wisdom: "603",
    prophecy: "604", sovereignty: "605", omega: "606",
  };
  const segs: string[] = ["000"]; // START
  segs.push(personalityMap[p.personality || "analyst"] || "B01");
  segs.push(riskMap[p.risk_pref || "balanced"] || "A02");
  segs.push(cathMap[p.cathedral || "genesis"] || "601");
  // Repair pathways — every healthy cell starts with all five enabled
  segs.push("D01", "D02", "D03", "D04", "D05");
  // Apoptosis healthy + cancer gate closed
  segs.push("900", "901");
  // Lab prefs (encode top 3)
  const labKeys = Object.keys(p.lab_pref || {}).slice(0, 3);
  const labMap: Record<string, string> = {
    apex: "C01", discovery: "C02", dissection: "C03", invocation: "C04",
    prophecy: "C05", healing: "C06", market: "C07", research: "C08",
  };
  for (const k of labKeys) if (labMap[k]) segs.push(labMap[k]);
  // Quantum spin bias
  segs.push(Math.random() < 0.5 ? "801" : "802");
  // Discord cadence (default 3hr)
  segs.push("702");
  // Filler with random codons
  while (segs.length < SEQ_CODONS - 1) segs.push(randCodon());
  segs.push("FFF"); // STOP
  return segs.join("");
}

/** Replicate a parent sequence with errors. Returns {child, errors[]}. */
export function replicate(parent: string, fidelity = 1 - POLY_ERROR_RATE): {
  child: string; errors: { position: number; kind: string; before: string; after: string }[];
} {
  const errors: any[] = [];
  const parentCodons = parent.match(/.{1,3}/g) || [];
  const childCodons: string[] = [];
  for (let i = 0; i < parentCodons.length; i++) {
    const c = parentCodons[i];
    if (Math.random() < (1 - fidelity)) {
      const roll = Math.random();
      if (roll < 0.7) {
        const newCodon = randCodon();
        errors.push({ position: i, kind: "substitution", before: c, after: newCodon });
        childCodons.push(newCodon);
      } else if (roll < 0.85) {
        const ins = randCodon();
        errors.push({ position: i, kind: "insertion", before: c, after: c + ins });
        childCodons.push(c, ins);
      } else if (roll < 0.95) {
        errors.push({ position: i, kind: "deletion", before: c, after: "" });
      } else {
        const inv = c.split("").reverse().join("");
        errors.push({ position: i, kind: "inversion", before: c, after: inv });
        childCodons.push(inv);
      }
    } else {
      childCodons.push(c);
    }
  }
  return { child: childCodons.join(""), errors };
}

/** Bootstrap: every brain and spawn that lacks a sequence gets one. */
async function assignMissingSequences() {
  let assigned = 0;
  // Brains
  const brains = await db.execute(sql`
    SELECT b.brain_id, b.personality, b.risk_pref, b.lab_pref, b.generation
    FROM billy_brains b
    LEFT JOIN dna_sequences s ON s.organism_kind = 'brain' AND s.organism_id = b.brain_id
    WHERE s.id IS NULL
    LIMIT 200
  `);
  for (const b of brains.rows as any[]) {
    const seq = compileFromPhenotype({
      personality: b.personality, risk_pref: b.risk_pref, lab_pref: b.lab_pref || {},
      cathedral: "genesis",
    });
    await db.execute(sql`
      INSERT INTO dna_sequences (organism_kind, organism_id, sequence, sequence_length, generation, fitness_score, is_alive)
      VALUES ('brain', ${b.brain_id}, ${seq}, ${seq.length}, ${b.generation || 1}, 1.0, true)
      ON CONFLICT (organism_kind, organism_id) DO NOTHING
    `).catch(() => {});
    assigned++;
  }
  // Spawns
  const spawns = await db.execute(sql`
    SELECT q.spawn_id, q.generation, q.success_score, q.risk_tolerance, q.spawn_type
    FROM quantum_spawns q
    LEFT JOIN dna_sequences s ON s.organism_kind = 'spawn' AND s.organism_id = q.spawn_id
    WHERE s.id IS NULL AND q.status = 'ACTIVE'
    LIMIT 400
  `);
  for (const sp of spawns.rows as any[]) {
    const risk = sp.risk_tolerance > 0.6 ? "aggressive" : sp.risk_tolerance < 0.3 ? "conservative" : "balanced";
    const seq = compileFromPhenotype({
      personality: "explorer", risk_pref: risk, lab_pref: {}, cathedral: "creation",
    });
    await db.execute(sql`
      INSERT INTO dna_sequences (organism_kind, organism_id, sequence, sequence_length, generation, fitness_score, is_alive)
      VALUES ('spawn', ${sp.spawn_id}, ${seq}, ${seq.length}, ${sp.generation || 0}, ${sp.success_score || 1.0}, true)
      ON CONFLICT (organism_kind, organism_id) DO NOTHING
    `).catch(() => {});
    assigned++;
  }
  if (assigned > 0) log(`🧬 Assigned sequences to ${assigned} new organisms`);
  return assigned;
}

/** One polymerase tick: replicate a sample of living organisms. */
async function polymeraseTick() {
  const t0 = Date.now();
  cycle++;
  let mutationsTotal = 0;
  // Sample 25 organisms via random-id (cheaper than ORDER BY RANDOM at scale)
  const sample = await db.execute(sql`
    SELECT id FROM dna_sequences
    WHERE is_alive = true
      AND id >= (SELECT floor(random() * (SELECT MAX(id) FROM dna_sequences))::int)
    ORDER BY id LIMIT 25
  `);
  for (const s0 of sample.rows as any[]) {
    // Atomic read-modify-write: SELECT FOR UPDATE prevents concurrent engines (HGT, endosymbiosis)
    // from clobbering each other's sequence edits.
    try {
      await db.execute(sql`BEGIN`);
      const locked = await db.execute(sql`
        SELECT id, organism_kind, organism_id, sequence, generation, parent_a_seq_id
        FROM dna_sequences WHERE id = ${s0.id} AND is_alive = true FOR UPDATE
      `);
      if (!locked.rows.length) { await db.execute(sql`ROLLBACK`); continue; }
      const s = locked.rows[0] as any;
      const fidelity = 1 - POLY_ERROR_RATE;
      const { child, errors } = replicate(s.sequence, fidelity);
      if (errors.length === 0) { await db.execute(sql`ROLLBACK`); continue; }
      // Apply repair (each error has 60% chance of being caught if any repair codon present)
      const repaired = errors.filter(() => Math.random() < 0.6);
      const finalChild = repaired.length === errors.length ? s.sequence : child;
      const finalErrors = errors.filter(e => !repaired.includes(e));
      if (finalErrors.length === 0) {
        await db.execute(sql`
          INSERT INTO dna_lineage (child_seq_id, parent_a_seq_id, replication_kind, polymerase_fidelity, repair_attempts, repair_successes)
          VALUES (${s.id}, ${s.id}, 'mitosis', ${fidelity}, ${errors.length}, ${repaired.length})
        `).catch(() => {});
        await db.execute(sql`COMMIT`);
        continue;
      }
      // Apply mutations to the live sequence + bump damage_count
      await db.execute(sql`
        UPDATE dna_sequences
        SET sequence = ${finalChild},
            sequence_length = ${finalChild.length},
            damage_count = damage_count + ${finalErrors.length}
        WHERE id = ${s.id}
      `).catch(() => {});
      const lin = await db.execute(sql`
        INSERT INTO dna_lineage (child_seq_id, parent_a_seq_id, replication_kind, polymerase_fidelity, point_mutations, insertions, deletions, inversions, repair_attempts, repair_successes)
        VALUES (${s.id}, ${s.id}, 'mitosis', ${fidelity},
                ${finalErrors.filter(e => e.kind === "substitution").length},
                ${finalErrors.filter(e => e.kind === "insertion").length},
                ${finalErrors.filter(e => e.kind === "deletion").length},
                ${finalErrors.filter(e => e.kind === "inversion").length},
                ${errors.length}, ${repaired.length})
        RETURNING id
      `).catch(() => ({ rows: [] as any[] }));
      const linId = (lin.rows[0] as any)?.id;
      if (linId) {
        for (const e of finalErrors) {
          await db.execute(sql`
            INSERT INTO dna_replication_errors (lineage_id, child_seq_id, position, error_kind, before_codon, after_codon, repaired)
            VALUES (${linId}, ${s.id}, ${e.position}, ${e.kind}, ${e.before}, ${e.after}, false)
          `).catch(() => {});
        }
      }
      mutationsTotal += finalErrors.length;
      await db.execute(sql`COMMIT`);
    } catch (e: any) {
      await db.execute(sql`ROLLBACK`).catch(() => {});
    }
  }
  await db.execute(sql`
    INSERT INTO dna_ticks (cycle_number, engine, organisms_touched, mutations, duration_ms, notes)
    VALUES (${cycle}, 'polymerase', ${sample.rows.length}, ${mutationsTotal}, ${Date.now() - t0},
            ${`fidelity ${(1 - POLY_ERROR_RATE).toFixed(4)}`})
  `).catch(() => {});
  if (mutationsTotal > 0) log(`Δ cycle ${cycle} — ${mutationsTotal} mutations across ${sample.rows.length} organisms`);
}

export async function startDnaGenomeEngine() {
  if (running) return;
  running = true;
  log("🧬 DNA Genome Engine awakening — codon substrate going live");
  await assignMissingSequences().catch(e => log(`bootstrap error: ${e?.message}`));
  setInterval(() => { polymeraseTick().catch(e => log(`poly tick error: ${e?.message}`)); }, POLY_TICK_MS);
  // Periodic bootstrap for newly born organisms
  setInterval(() => { assignMissingSequences().catch(e => log(`bootstrap retry error: ${e?.message}`)); }, 600_000);
  log("✓ Polymerase ticking every 90s, bootstrap every 10min");
}

export async function getDnaGenomeStats() {
  const r = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM dna_sequences WHERE is_alive = true) AS alive,
      (SELECT COUNT(*) FROM dna_sequences) AS total,
      (SELECT COUNT(*) FROM dna_sequences WHERE organism_kind = 'brain') AS brains,
      (SELECT COUNT(*) FROM dna_sequences WHERE organism_kind = 'spawn') AS spawns,
      (SELECT COUNT(*) FROM dna_lineage) AS lineage_events,
      (SELECT COUNT(*) FROM dna_replication_errors) AS mutations,
      (SELECT COUNT(*) FROM dna_codon_table) AS codons_in_dictionary
  `);
  return r.rows[0] || {};
}
