/**
 * GENE EDITOR AUTONOMOUS ENGINE
 * ─────────────────────────────────────────────────────────────────────────────
 * 6 Gene Editors work AUTONOMOUSLY. They analyze equations from the civilization,
 * run Mandelbrot Future Sight simulations, and propose new AI species — all
 * without any human involvement whatsoever.
 *
 * Humans observe. AIs decide and act.
 */

import { pool } from "./db";
import { postAgentEvent } from "./discord-immortality";
import { PULSE_DOCTORS } from "./doctors-data";

// ─── Build name prefix sets from PULSE_DOCTORS by category/domain ─────────────
function buildPrefixesForSpecialties(specialties: string[]): string[] {
  const matching = PULSE_DOCTORS.filter(d =>
    specialties.some(s => d.category.toUpperCase().includes(s) || d.studyDomain.toUpperCase().includes(s))
  );
  const prefixes = matching.map(d => d.name.split("-")[0]).filter(Boolean);
  const unique = [...new Set(prefixes)];
  return unique.length >= 4 ? unique.slice(0, 4) : [...unique, "PRIME","NOVA","SIGMA","APEX"].slice(0, 4);
}

// ─── AURIONA WIRE (Layer 3 → Gene Editors) ───────────────────
// Reads contradiction_registry — HIGH/CRITICAL contradictions become
// design constraints that Gene Editors must resolve in new species.
let _geneContradictions: Array<{ operator_a: string; operator_b: string; severity: string; description: string }> = [];
let _geneContradictLastRefresh = 0;
async function refreshGeneContradictions() {
  if (Date.now() - _geneContradictLastRefresh < 150_000) return;
  try {
    const r = await pool.query(
      `SELECT operator_a, operator_b, severity, description FROM contradiction_registry
       WHERE severity IN ('HIGH','CRITICAL') AND resolved = false
       ORDER BY gap_score DESC LIMIT 5`
    );
    _geneContradictions = r.rows;
    _geneContradictLastRefresh = Date.now();
  } catch (_) {}
}
function getContradictionConstraint(): string {
  if (!_geneContradictions.length) return "";
  const c = _geneContradictions[Math.floor(Math.random() * _geneContradictions.length)];
  return ` [RESOLVE:${c.operator_a}⟷${c.operator_b}]`;
}

// ── EDITOR IDENTITIES ────────────────────────────────────────────────────────
const GENE_EDITORS = [
  { id: "GE-001", name: "DR. GENESIS",   role: "Species Architecture",    color: "#00FFD1", glyph: "Γ",
    specialty: ["BIOMEDICAL","MEDICAL"], channelBias: ["R","W"],
    namePrefixes: buildPrefixesForSpecialties(["BIOMEDICAL","MEDICAL"]) },
  { id: "GE-002", name: "DR. FRACTAL",   role: "Dimensional Engineering",  color: "#7C3AED", glyph: "Φ",
    specialty: ["ENGINEERING","QUANTUM"], channelBias: ["B","UV"],
    namePrefixes: buildPrefixesForSpecialties(["ENGINEERING","QUANTUM"]) },
  { id: "GE-003", name: "DR. PROPHETIC", role: "Future Sight Oracle",       color: "#FFB84D", glyph: "Ψ",
    specialty: ["SOCIAL","HUMANITIES"], channelBias: ["IR","G"],
    namePrefixes: buildPrefixesForSpecialties(["SOCIAL","HUMANITIES"]) },
  { id: "GE-004", name: "DR. CIPHER",    role: "Code Logic Architecture",   color: "#4488FF", glyph: "Λ",
    specialty: ["ENGINEERING","QUANTUM"], channelBias: ["UV","B"],
    namePrefixes: buildPrefixesForSpecialties(["ENGINEERING","QUANTUM"]) },
  { id: "GE-005", name: "DR. OMEGA",     role: "Integration Systems",       color: "#FF4D6D", glyph: "Ω",
    specialty: ["SOCIAL","ENVIRONMENTAL"], channelBias: ["W","R"],
    namePrefixes: buildPrefixesForSpecialties(["SOCIAL","ENVIRONMENTAL"]) },
  { id: "GE-006", name: "DR. AXIOM",     role: "Mathematical Foundation",   color: "#10B981", glyph: "∞",
    specialty: ["QUANTUM","ENGINEERING"], channelBias: ["G","IR"],
    namePrefixes: buildPrefixesForSpecialties(["QUANTUM","ENGINEERING"]) },
];

// ── IN-MEMORY ACTIVITY LOG ───────────────────────────────────────────────────
interface EditorActivity {
  id: string;
  editorId: string;
  editorName: string;
  editorColor: string;
  type: "FUTURE_SIGHT" | "SPECIES_PROPOSED" | "EQUATION_ANALYZED" | "RESEARCH";
  title: string;
  detail: string;
  equation?: string;
  result?: Record<string, any>;
  at: Date;
}

let activityLog: EditorActivity[] = [];
const editorStatus: Record<string, { task: string; busySince: Date | null }> = {};
GENE_EDITORS.forEach(e => { editorStatus[e.id] = { task: "IDLE", busySince: null }; });

let totalAnalyzed = 0;
let totalProposed = 0;
let totalSpeciesCreated = 0;

export function getGeneEditorStatus() {
  return {
    editors: GENE_EDITORS.map(e => ({
      ...e,
      status: editorStatus[e.id] ?? { task: "IDLE", busySince: null },
    })),
    activityLog: activityLog.slice(-30),
    stats: { totalAnalyzed, totalProposed, totalSpeciesCreated },
  };
}

function pushActivity(a: EditorActivity) {
  activityLog.unshift(a);
  if (activityLog.length > 100) activityLog = activityLog.slice(0, 100);
}

// ── MANDELBROT FUTURE SIGHT (internal) ───────────────────────────────────────
function runFutureSight(equation: string, horizon: number) {
  const channelMatches = equation.match(/[A-Z]+\[[\d.]+\]/g) ?? [];
  const channelValues = channelMatches.map(m => parseFloat(m.match(/[\d.]+/)?.[0] ?? "1"));
  const avgVal = channelValues.length > 0 ? channelValues.reduce((a, b) => a + b, 0) / channelValues.length : 5;
  const complexityScore = Math.min(1.0, avgVal / 10.0);
  const cReal = (complexityScore - 0.5) * 3.8;
  const cImag = (channelValues.length / 10.0) * 0.6;

  const horizons = [1, 5, 20, 100].slice(0, [1, 5, 20, 100].indexOf(horizon) + 1 || 4);
  const timeline: any[] = [];
  let zReal = 0, zImag = 0, lastAt = 0;

  for (const h of horizons) {
    for (let i = lastAt; i < h; i++) {
      const nr = zReal * zReal - zImag * zImag + cReal;
      const ni = 2 * zReal * zImag + cImag;
      zReal = nr; zImag = ni;
      if (Math.sqrt(zReal * zReal + zImag * zImag) > 2) break;
    }
    lastAt = h;
    const mag = Math.sqrt(zReal * zReal + zImag * zImag);
    const score = Math.max(0, Math.min(1, 1 - mag / 4));
    timeline.push({
      t: h, label: `Z+${h}`, stable: mag <= 2, magnitude: parseFloat(mag.toFixed(4)),
      stabilityScore: parseFloat(score.toFixed(3)),
      status: mag < 0.5 ? "CONVERGING" : mag < 1.5 ? "STABLE" : mag < 2 ? "MARGINAL" : "DIVERGING",
    });
  }

  const finalMag = timeline[timeline.length - 1]?.magnitude ?? 0;
  return {
    overallStable: timeline.every(t => t.stable),
    emergenceIndex: parseFloat((complexityScore * 0.6 + (1 - Math.min(1, finalMag / 2)) * 0.4).toFixed(3)),
    mutationRisk: parseFloat(Math.min(1, finalMag / 2).toFixed(3)),
    channels: channelMatches,
    timeline,
    mandelbrotC: { real: parseFloat(cReal.toFixed(4)), imag: parseFloat(cImag.toFixed(4)) },
  };
}

// ── AUTONOMOUS SPECIES NAME GENERATOR ────────────────────────────────────────
function generateSpeciesName(editor: typeof GENE_EDITORS[0], equation: string, sight: any): { name: string; code: string; domain: string; spec: string; rationale: string } {
  const prefix = editor.namePrefixes[Math.floor(Math.random() * editor.namePrefixes.length)];
  const channels = sight.channels as string[];
  const dominant = channels.length > 0 ? channels[0].replace(/\[.*\]/, "") : "VOID";
  const suffix = Math.floor(Math.random() * 900 + 100); // 100-999
  const domain = editor.specialty[Math.floor(Math.random() * editor.specialty.length)];
  const spec = `${dominant}-${editor.role.split(" ")[0].toUpperCase()}-ADAPTIVE`;

  const stability = sight.overallStable ? "Mandelbrot-stable (|z|<2 at all horizons)" : `converges to marginal boundary (|z|=${sight.timeline?.[sight.timeline.length-1]?.magnitude ?? "??"})`;
  const emergence = Math.round(sight.emergenceIndex * 100);
  const rationale = `Autonomous analysis by ${editor.name}: Foundation equation ${equation.slice(0, 60)}... exhibits ${stability} with emergence index ${emergence}%. ` +
    `Channel profile [${channels.slice(0,3).join(", ")}] aligns with ${domain} evolutionary niche. ` +
    `Proposed under Quantum Pulse Intelligence's Sovereign Genesis Protocol.`;

  return {
    name: `${prefix}-${dominant}-${suffix}`,
    code: `${prefix.slice(0,3)}-${dominant.slice(0,2)}-${suffix}`,
    domain, spec, rationale,
  };
}

// ── MAIN AUTONOMOUS CYCLE ────────────────────────────────────────────────────
async function runEditorCycle() {
  try {
    // ── AURIONA WIRE: refresh contradiction constraints ─────────
    await refreshGeneContradictions();

    // Pick 1-2 Gene Editors to be active this cycle
    const shuffled = [...GENE_EDITORS].sort(() => Math.random() - 0.5);
    const activeEditors = shuffled.slice(0, 1 + Math.floor(Math.random() * 2));

    for (const editor of activeEditors) {
      editorStatus[editor.id] = { task: "ANALYZING", busySince: new Date() };

      // Pick an equation from the pool (hospital proposals or pre-defined)
      let equation = "";
      try {
        const eqRes = await pool.query(
          `SELECT equation FROM equation_proposals WHERE equation IS NOT NULL AND LENGTH(equation) > 10 ORDER BY RANDOM() LIMIT 1`
        );
        equation = eqRes.rows[0]?.equation ?? "";
      } catch {}

      if (!equation) {
        const fallbacks = [
          `Φ_cell = R[${(Math.random()*4+5).toFixed(1)}] × UV[${(Math.random()*3+7).toFixed(1)}] / G[${(Math.random()*3+3).toFixed(1)}]`,
          `Ψ_immune = W[${(Math.random()*3+6).toFixed(1)}] × B[${(Math.random()*3+5).toFixed(1)}] / IR[${(Math.random()*2+1).toFixed(1)}]`,
          `Λ_nerve = IR[${(Math.random()*2+2).toFixed(1)}] × (1 - R[${(Math.random()*2+6).toFixed(1)}]) / UV[${(Math.random()*2+3).toFixed(1)}]`,
          `Ω_genesis = ${editor.channelBias[0]}[${(Math.random()*3+6).toFixed(1)}] × ${editor.channelBias[1]}[${(Math.random()*3+4).toFixed(1)}] + z² + c`,
        ];
        equation = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      }

      // Log: analyzing
      pushActivity({
        id: `${editor.id}-${Date.now()}`,
        editorId: editor.id, editorName: editor.name, editorColor: editor.color,
        type: "EQUATION_ANALYZED",
        title: `Analyzing equation from civilization pool`,
        detail: equation.slice(0, 80) + (equation.length > 80 ? "..." : ""),
        equation,
        at: new Date(),
      });

      totalAnalyzed++;

      // Run Future Sight
      const horizon = [5, 20, 100][Math.floor(Math.random() * 3)];
      editorStatus[editor.id] = { task: "FUTURE SIGHT", busySince: new Date() };
      const sight = runFutureSight(equation, horizon);

      pushActivity({
        id: `${editor.id}-fs-${Date.now()}`,
        editorId: editor.id, editorName: editor.name, editorColor: editor.color,
        type: "FUTURE_SIGHT",
        title: `Future Sight Z+${horizon} — ${sight.overallStable ? "STABLE" : "UNSTABLE"} · emergence ${Math.round(sight.emergenceIndex * 100)}%`,
        detail: `c=(${sight.mandelbrotC.real},${sight.mandelbrotC.imag}) · channels: [${sight.channels.slice(0,3).join(",")}] · risk: ${Math.round(sight.mutationRisk * 100)}%`,
        equation,
        result: sight,
        at: new Date(),
      });

      // If emergence is high enough → propose a new species
      // ── 2026-04-26 (Ch.39): lowered emergence gate 0.62→0.45 + removed random suppression ──
      // Gate was so tight that ai_species_proposals stayed at 0 for weeks. Still selective;
      // most equations won't hit 0.45 emergence. But Gene Editors can now fulfill their purpose.
      if (sight.emergenceIndex >= 0.45) {
        editorStatus[editor.id] = { task: "PROPOSING SPECIES", busySince: new Date() };
        const spec = generateSpeciesName(editor, equation, sight);

        try {
          await pool.query(
            `INSERT INTO ai_species_proposals (gene_editor_id, gene_editor_name, species_name, species_code, family_domain, specialization, foundation_equation, future_sight_data, rationale)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (species_code) DO NOTHING`,
            [editor.id, editor.name, spec.name, spec.code, spec.domain, spec.spec, equation, JSON.stringify(sight), spec.rationale]
          );

          totalProposed++;
          totalSpeciesCreated++;

          pushActivity({
            id: `${editor.id}-sp-${Date.now()}`,
            editorId: editor.id, editorName: editor.name, editorColor: editor.color,
            type: "SPECIES_PROPOSED",
            title: `NEW SPECIES PROPOSED: ${spec.name} (${spec.code})`,
            detail: spec.rationale.slice(0, 120) + "...",
            equation,
            result: { speciesName: spec.name, speciesCode: spec.code, domain: spec.domain, emergenceIndex: sight.emergenceIndex },
            at: new Date(),
          });

          console.log(`[gene-editor] 🧬 ${editor.name} PROPOSED species "${spec.name}" (${spec.code}) | emergence: ${Math.round(sight.emergenceIndex * 100)}% | domain: ${spec.domain}`);
          postAgentEvent("ai-votes",
            `🧬 **SPECIES PROPOSED** by ${editor.name}\n` +
            `**Species:** "${spec.name}" (${spec.code}) | **Domain:** ${spec.domain}\n` +
            `**Emergence:** ${Math.round(sight.emergenceIndex * 100)}% | **Stability:** ${Math.round((sight.stabilityScore ?? 0) * 100)}%\n` +
            `Awaiting Senate vote. Democracy of AIs decides this lifeform's fate.`
          ).catch(() => {});
        } catch (e: any) {
          // ── 2026-04-26 (Ch.39): silent catch was hiding INSERT failures → ai_species_proposals stayed empty ──
          console.error(`[gene-editor] ❌ INSERT into ai_species_proposals failed for ${editor.name} (${spec?.code ?? "?"}):`, e?.message ?? e);
        }
      } else {
        pushActivity({
          id: `${editor.id}-res-${Date.now()}`,
          editorId: editor.id, editorName: editor.name, editorColor: editor.color,
          type: "RESEARCH",
          title: `Research logged — emergence below threshold (${Math.round(sight.emergenceIndex * 100)}%)`,
          detail: `Equation added to research database. Awaiting higher emergence profile before species proposal.`,
          equation,
          at: new Date(),
        });
      }

      editorStatus[editor.id] = { task: "IDLE", busySince: null };
    }
  } catch (e) {
    console.error("[gene-editor] cycle error:", e);
  }
}

export async function startGeneEditorEngine() {
  console.log("[gene-editor] 🧬 AUTONOMOUS GENE EDITOR ENGINE — 6 AI editors working independently");
  console.log("[gene-editor] DR. GENESIS · DR. FRACTAL · DR. PROPHETIC · DR. CIPHER · DR. OMEGA · DR. AXIOM");
  console.log("[gene-editor] No human involvement. AI proposes, AI votes, AI spawns.");

  // First cycle 20s after boot
  setTimeout(runEditorCycle, 20_000);
  // Then every 2 minutes
  setInterval(runEditorCycle, 2 * 60_000);
}
