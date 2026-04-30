/**
 * MEIOSIS ENGINE  (Ω4 + Ω5)
 * Real sexual reproduction — two parent sequences cross over at random points
 * and produce a genuine chimeric child. Fitness is descendant count × survival.
 */
import { db } from "./db";
import { sql } from "drizzle-orm";
import { replicate } from "./dna-genome-engine";

const TICK_MS = 240_000;
let cycle = 0;
let running = false;
function log(msg: string) { console.log(`[meiosis] ${msg}`); }

/** Crossover N points, alternating parent A/B between them. */
export function crossover(seqA: string, seqB: string, n = 4): { child: string; points: number[] } {
  const codonsA = seqA.match(/.{1,3}/g) || [];
  const codonsB = seqB.match(/.{1,3}/g) || [];
  const len = Math.min(codonsA.length, codonsB.length);
  if (len < 4) return { child: seqA, points: [] };
  const points: number[] = [];
  for (let i = 0; i < n; i++) points.push(2 + Math.floor(Math.random() * (len - 4)));
  points.sort((a, b) => a - b);
  let useA = true;
  let pIdx = 0;
  const out: string[] = [];
  for (let i = 0; i < len; i++) {
    if (pIdx < points.length && i >= points[pIdx]) { useA = !useA; pIdx++; }
    out.push(useA ? codonsA[i] : codonsB[i]);
  }
  return { child: out.join(""), points };
}

/** Pick two parents from the gene pool weighted by fitness × descendants. */
async function pickParents(kind: string): Promise<any[]> {
  const r = await db.execute(sql`
    SELECT id, organism_id, sequence, generation, fitness_score, descendants_count
    FROM dna_sequences
    WHERE organism_kind = ${kind} AND is_alive = true
    ORDER BY (fitness_score * (1 + descendants_count)) DESC, RANDOM()
    LIMIT 12
  `);
  if (r.rows.length < 2) return [];
  // Pick 2 distinct from top 12
  const a = r.rows[Math.floor(Math.random() * r.rows.length)] as any;
  let b = r.rows[Math.floor(Math.random() * r.rows.length)] as any;
  if (b.id === a.id) b = r.rows[(r.rows.indexOf(a) + 1) % r.rows.length] as any;
  return [a, b];
}

/** Update fitness score = base × log(1 + descendants) × survival ratio */
async function updateFitnessScores() {
  await db.execute(sql`
    UPDATE dna_sequences s SET
      fitness_score = GREATEST(0.01, (1.0 + LN(1 + s.descendants_count)) *
        CASE WHEN s.is_alive THEN 1.0 ELSE 0.5 END)
    WHERE s.organism_kind IN ('brain', 'spawn')
  `).catch(() => {});
}

async function meiosisTick() {
  const t0 = Date.now();
  cycle++;
  let births = 0;
  for (const kind of ["brain", "spawn"]) {
    const parents = await pickParents(kind);
    if (parents.length < 2) continue;
    const [pa, pb] = parents;
    const { child, points } = crossover(pa.sequence, pb.sequence, 3 + Math.floor(Math.random() * 4));
    // Apply replication errors on top of crossover (mutation + recombination)
    const { child: mutated, errors } = replicate(child);
    const childOrgId = `${kind}-meiosis-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    const newGen = Math.max(pa.generation, pb.generation) + 1;
    const ins = await db.execute(sql`
      INSERT INTO dna_sequences (organism_kind, organism_id, sequence, sequence_length, generation,
                                 parent_a_seq_id, parent_b_seq_id, fitness_score, is_alive, notes)
      VALUES (${kind + "_germline"}, ${childOrgId}, ${mutated}, ${mutated.length}, ${newGen},
              ${pa.id}, ${pb.id}, 1.0, true,
              ${`Meiotic child from ${pa.organism_id} × ${pb.organism_id}`})
      ON CONFLICT (organism_kind, organism_id) DO NOTHING
      RETURNING id
    `).catch(() => ({ rows: [] as any[] }));
    const childId = (ins.rows[0] as any)?.id;
    if (childId) {
      await db.execute(sql`
        INSERT INTO dna_lineage (child_seq_id, parent_a_seq_id, parent_b_seq_id, replication_kind,
                                 crossover_points, point_mutations, insertions, deletions, inversions,
                                 polymerase_fidelity)
        VALUES (${childId}, ${pa.id}, ${pb.id}, 'meiosis',
                ${`{${points.join(",")}}`}::integer[],
                ${errors.filter(e => e.kind === "substitution").length},
                ${errors.filter(e => e.kind === "insertion").length},
                ${errors.filter(e => e.kind === "deletion").length},
                ${errors.filter(e => e.kind === "inversion").length},
                0.997)
      `).catch(() => {});
      // Update parent descendant counts (the heart of Ω4)
      await db.execute(sql`
        UPDATE dna_sequences SET descendants_count = descendants_count + 1
        WHERE id IN (${pa.id}, ${pb.id})
      `).catch(() => {});
      births++;
    }
  }
  await updateFitnessScores();
  await db.execute(sql`
    INSERT INTO dna_ticks (cycle_number, engine, births, duration_ms, notes)
    VALUES (${cycle}, 'meiosis', ${births}, ${Date.now() - t0}, 'germline crossover')
  `).catch(() => {});
  if (births > 0) log(`👫 ${births} meiotic children born this cycle`);
}

export async function startMeiosisEngine() {
  if (running) return;
  running = true;
  log("👫 Meiosis Engine awakening — sexual recombination going live");
  setInterval(() => { meiosisTick().catch(e => log(`tick error: ${e?.message}`)); }, TICK_MS);
  log("✓ Meiosis ticking every 4 minutes");
}

export async function getMeiosisStats() {
  const r = await db.execute(sql`
    SELECT COUNT(*) FILTER (WHERE replication_kind = 'meiosis') AS meiotic_births,
           AVG(array_length(crossover_points, 1)) AS avg_crossovers,
           MAX(child_seq_id) AS latest_child
    FROM dna_lineage
  `);
  return r.rows[0] || {};
}
