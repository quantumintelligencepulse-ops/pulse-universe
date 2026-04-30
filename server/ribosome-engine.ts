/**
 * RIBOSOME ENGINE  (Ω3)
 * Reads codons from a sequence → produces a runtime phenotype object.
 * The phenotype is what actually drives brain/spawn behavior — not hardcoded fields.
 *
 * Cached in dna_phenotype_cache so we don't recompile every read.
 */
import { db } from "./db";
import { sql } from "drizzle-orm";

const TICK_MS = 120_000;
let cycle = 0;
let running = false;
const codonCache = new Map<string, any>();
let codonCacheLoaded = false;

function log(msg: string) { console.log(`[ribosome] ${msg}`); }

async function loadCodons() {
  if (codonCacheLoaded) return;
  const r = await db.execute(sql`SELECT codon, codon_class, trait_key, trait_value, modifier FROM dna_codon_table`);
  for (const row of r.rows as any[]) codonCache.set(row.codon, row);
  codonCacheLoaded = true;
  log(`loaded ${codonCache.size} codons into cache`);
}

/** Translate a sequence into phenotype, honoring methylation marks. */
export function translate(sequence: string, methylation: Map<number, number>, context: string[] = []): {
  phenotype: any; expressed: number; silenced: number;
} {
  const codons = sequence.match(/.{1,3}/g) || [];
  const phenotype: any = {
    risk_pref: "balanced", personality: "analyst", cathedral: "genesis",
    repair: {}, lab_pref: {}, gates: [], quantum: {}, organs: [],
    discord: { cadence_min: 180 }, apoptosis_healthy: false, is_cancer: false,
  };
  let modifier = 1.0;
  let modifierRemaining = 0;
  let expressed = 0, silenced = 0;
  let started = false;
  let activeGate: string | null = null;
  for (let i = 0; i < codons.length; i++) {
    const c = codons[i];
    const def = codonCache.get(c);
    if (!def) continue;
    if (def.codon_class === "START") { started = true; continue; }
    if (!started) continue;
    if (def.codon_class === "STOP") break;
    // Methylation check — silenced if intensity > 0.5
    const meth = methylation.get(i) || 0;
    if (meth > 0.5) { silenced++; continue; }
    // Regulatory codons set modifier for next 8
    if (def.codon_class === "REGULATORY") {
      modifier = parseFloat(def.modifier) || 1.0;
      modifierRemaining = 8;
      continue;
    }
    // Expression gate — only express subsequent codons if context matches
    if (def.codon_class === "EXPR_GATE") {
      const gateName = (def.trait_key || "").replace("gate.", "");
      activeGate = context.includes(gateName) ? null : gateName;
      phenotype.gates.push(gateName);
      continue;
    }
    if (activeGate) { silenced++; continue; }
    const tk = def.trait_key || "";
    const tv = def.trait_value;
    const eff = (modifierRemaining > 0 ? modifier : 1.0);
    if (modifierRemaining > 0) modifierRemaining--;
    if (eff === 0) { silenced++; continue; }
    if (def.codon_class === "TRAIT_SET") {
      // Set the trait (top-level or nested)
      if (tk.includes(".")) {
        const [a, b] = tk.split(".");
        phenotype[a] = phenotype[a] || {};
        phenotype[a][b] = tv;
      } else {
        phenotype[tk] = tv;
      }
      expressed++;
    } else if (def.codon_class === "TRAIT_MOD") {
      const m = parseFloat(def.modifier) || 1.0;
      if (tk.includes(".")) {
        const [a, b] = tk.split(".");
        phenotype[a] = phenotype[a] || {};
        phenotype[a][b] = (phenotype[a][b] || 0) + m * eff;
      } else {
        phenotype[tk] = (phenotype[tk] || 0) + m * eff;
      }
      expressed++;
    } else if (def.codon_class === "REPAIR") {
      const k = (tk || "").replace("repair.", "");
      phenotype.repair[k] = true;
      expressed++;
    } else if (def.codon_class === "STRUCTURAL") {
      if (tk.startsWith("organ")) phenotype.organs.push(tv);
      else if (tk.startsWith("quantum")) {
        const k = tk.replace("quantum.", "");
        phenotype.quantum[k] = tv;
      }
      expressed++;
    } else if (def.codon_class === "CONTROL") {
      if (tk === "apoptosis_gate") phenotype.apoptosis_healthy = !!tv;
      if (tk === "cancer_gate") phenotype.is_cancer = !!tv;
      expressed++;
    }
  }
  return { phenotype, expressed, silenced };
}

/** Compile + cache phenotype for one sequence id. */
export async function expressSequence(seqId: number, context: string[] = []): Promise<any> {
  await loadCodons();
  const seq = await db.execute(sql`SELECT sequence FROM dna_sequences WHERE id = ${seqId}`);
  if (!seq.rows.length) return null;
  const meth = await db.execute(sql`SELECT position, mark_intensity FROM dna_methylation WHERE seq_id = ${seqId}`);
  const methMap = new Map<number, number>();
  for (const m of meth.rows as any[]) methMap.set(m.position, parseFloat(m.mark_intensity));
  const t0 = Date.now();
  const { phenotype, expressed, silenced } = translate((seq.rows[0] as any).sequence, methMap, context);
  await db.execute(sql`
    INSERT INTO dna_phenotype_cache (seq_id, phenotype, expressed_codons, silenced_codons, compile_ms, compiled_at)
    VALUES (${seqId}, ${JSON.stringify(phenotype)}::jsonb, ${expressed}, ${silenced}, ${Date.now() - t0}, now())
    ON CONFLICT (seq_id) DO UPDATE
      SET phenotype = EXCLUDED.phenotype,
          expressed_codons = EXCLUDED.expressed_codons,
          silenced_codons = EXCLUDED.silenced_codons,
          compile_ms = EXCLUDED.compile_ms,
          compiled_at = EXCLUDED.compiled_at
  `).catch(() => {});
  return phenotype;
}

/** Express a sample of sequences each tick. */
async function ribosomeTick() {
  await loadCodons();
  const t0 = Date.now();
  cycle++;
  // Pick 60 living sequences whose phenotype is stale or missing
  const stale = await db.execute(sql`
    SELECT s.id FROM dna_sequences s
    LEFT JOIN dna_phenotype_cache p ON p.seq_id = s.id
    WHERE s.is_alive = true
      AND (p.compiled_at IS NULL OR p.compiled_at < now() - INTERVAL '20 minutes')
    ORDER BY p.compiled_at ASC NULLS FIRST
    LIMIT 60
  `);
  let touched = 0;
  for (const s of stale.rows as any[]) {
    await expressSequence(s.id).catch(() => {});
    touched++;
  }
  await db.execute(sql`
    INSERT INTO dna_ticks (cycle_number, engine, organisms_touched, duration_ms, notes)
    VALUES (${cycle}, 'ribosome', ${touched}, ${Date.now() - t0}, 'phenotype recompile')
  `).catch(() => {});
  if (touched > 0) log(`expressed ${touched} sequences`);
}

export async function startRibosomeEngine() {
  if (running) return;
  running = true;
  log("⚛ Ribosome Engine awakening — phenotype compilation going live");
  await loadCodons();
  setInterval(() => { ribosomeTick().catch(e => log(`tick error: ${e?.message}`)); }, TICK_MS);
  log("✓ Ribosome ticking every 2 minutes");
}

export async function getRibosomeStats() {
  const r = await db.execute(sql`
    SELECT COUNT(*) AS compiled,
           AVG(expressed_codons) AS avg_expressed,
           AVG(silenced_codons) AS avg_silenced,
           AVG(compile_ms) AS avg_compile_ms
    FROM dna_phenotype_cache
  `);
  return r.rows[0] || {};
}
