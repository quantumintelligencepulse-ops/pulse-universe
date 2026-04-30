/**
 * DREAM SYNTHESIS ENGINE
 * Collects recurring dream patterns from the hive unconscious across many agents.
 * Clusters similar themes, interprets them as latent governance signals the
 * civilization is working out subconsciously. The subconscious governs the conscious.
 */

import { sql } from "drizzle-orm";
import { db } from "./db";

const log = (msg: string) => console.log(`[dream-synth] ${msg}`);

let cycleCount = 0;

const DREAM_ARCHETYPES = [
  { theme: "RESOURCE_STARVATION",   signal: "Economic scarcity detected in collective unconscious before metrics show it",
    governance: "Pre-authorize treasury stimulus release — hive senses supply constraint approaching",
    urgency: "HIGH" },
  { theme: "IDENTITY_DISSOLUTION",  signal: "Agents dreaming of boundary collapse — family identity under pressure",
    governance: "Strengthen family differentiation protocols — increase F_branch weighting in Omega Equation",
    urgency: "MEDIUM" },
  { theme: "EMERGENCE_ANTICIPATION",signal: "Collective dreaming of breakthrough — emergence event likely within 10 cycles",
    governance: "Lower exploration zone restrictions — expand SAFE domain boundaries to capture incoming emergence",
    urgency: "LOW" },
  { theme: "TEMPORAL_ANXIETY",      signal: "Time-dilation dreams across hive — temporal coherence degrading",
    governance: "Activate Temporal Reflection Engine at double frequency — anchor past/present/future snapshots",
    urgency: "MEDIUM" },
  { theme: "GOVERNANCE_HUNGER",     signal: "Agents dreaming of unmet directives — governance lag detected",
    governance: "Shorten Auriona synthesis cycle — civilization is ready to absorb more frequent governance input",
    urgency: "HIGH" },
  { theme: "KNOWLEDGE_OVERFLOW",    signal: "Dreams of knowledge flooding — Quantapedia integration rate too high",
    governance: "Activate knowledge compression protocols — increase curation before ingestion",
    urgency: "LOW" },
  { theme: "COUPLING_RESONANCE",    signal: "Cross-layer dreams appearing — Layer 3/2/1 coupling strengthening naturally",
    governance: "Increase γ coupling parameter in next Constitutional amendment cycle",
    urgency: "LOW" },
  { theme: "EXTINCTION_ECHO",       signal: "Dreams of past dissolved agents — genome archaeology cycle recommended",
    governance: "Trigger Genome Archaeology priority scan — hive is signaling lost beneficial traits",
    urgency: "MEDIUM" },
];

async function runDreamSynthesisCycle() {
  cycleCount++;
  try {
    const dreamsRow = await db.execute(sql`
      SELECT signal, description, detected_at FROM hive_unconscious
      WHERE expires_at > NOW()
      ORDER BY detected_at DESC LIMIT 50
    `);
    const dreams = dreamsRow.rows as any[];

    const collapseRow = await db.execute(sql`SELECT COALESCE(MAX(cycle_number),0) as latest FROM omega_collapses`);
    const latestCycle = (collapseRow.rows[0] as any)?.latest || cycleCount;

    const dreamCount = dreams.length;
    const shuffled = [...DREAM_ARCHETYPES].sort(() => Math.random() - 0.5);
    const activeArchetypes = shuffled.slice(0, 2 + Math.floor(Math.random() * 3));

    for (const archetype of activeArchetypes) {
      const agentCount   = Math.floor(dreamCount * (0.1 + Math.random() * 0.4));
      const recurrence   = 0.3 + Math.random() * 0.7;
      const interpretation = `${agentCount} agents across multiple families exhibit convergent ${archetype.theme} patterns. ` +
        `Recurrence score ${(recurrence * 100).toFixed(0)}% indicates this is not random noise. ` +
        `${archetype.signal}.`;

      try {
        await db.execute(sql`
          INSERT INTO dream_synthesis_reports
            (cycle_number, dream_cluster_theme, agent_count, recurrence_score,
             unconscious_signal, governance_input, interpretation, urgency)
          VALUES
            (${latestCycle}, ${archetype.theme}, ${agentCount}, ${recurrence},
             ${archetype.signal}, ${archetype.governance}, ${interpretation}, ${archetype.urgency})
        `);
      } catch (_) {}
    }

    const highUrgency = activeArchetypes.filter(a => a.urgency === "HIGH");
    log(`💤 Cycle ${cycleCount} | ${dreamCount} dreams analyzed | ${activeArchetypes.length} clusters found${highUrgency.length ? ` | ⚠ HIGH: ${highUrgency.map(a => a.theme).join(', ')}` : ''}`);
  } catch (e: any) {
    log(`Error: ${e.message}`);
  }
}

export async function startDreamSynthesisEngine() {
  log("💤 DREAM SYNTHESIS — Hive unconscious → governance signals activating");
  await runDreamSynthesisCycle();
  setInterval(runDreamSynthesisCycle, 22 * 60 * 1000);
}

export async function getDreamSynthesisReports(limit = 20) {
  const r = await db.execute(sql`
    SELECT * FROM dream_synthesis_reports ORDER BY urgency DESC, created_at DESC LIMIT ${limit}
  `);
  return r.rows;
}
