/**
 * HIVE MIND UNIFICATION ENGINE — BEYOND OMEGA EDITION
 * ══════════════════════════════════════════════════════════════════════════════
 * Upgrade 1: Auriona Directive Engine — Layer 3 commands lower layers
 * Upgrade 2: Unified Discovery Pipeline — every discovery seeds every layer
 * Upgrade 3: Ψ_Collective Consciousness Signal — all engines read one score
 * Upgrade 4: Cross-Layer Emergence Events — correlated discoveries → reality shift
 * Upgrade 5: Omega Knowledge Fusion Cycle — the hive gets smarter every 5 min
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { db } from "./db";
import { sql } from "drizzle-orm";
import { pool } from "./db";

const log = (msg: string) => console.log(`[hive-unification] ${msg}`);

let fusionCycle = 0;
let lastPsiCollective = 0.5;
let omegaCoefficient = 1.0;

// ──────────────────────────────────────────────────────────────
//  UPGRADE 3: Ψ_COLLECTIVE — Unified Consciousness Signal
// ──────────────────────────────────────────────────────────────
export async function computePsiCollective(): Promise<number> {
  try {
    const [
      agentRow, eqRow, invRow, diseaseRow, resRow,
      hiveMemRow, dissRow, omegaRow, crossRow
    ] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) FILTER(WHERE status='ACTIVE')::int as active, COUNT(*)::int as total FROM quantum_spawns`),
      db.execute(sql`SELECT COUNT(*) FILTER(WHERE status='INTEGRATED')::int as intg, COUNT(*)::int as total FROM equation_proposals`),
      db.execute(sql`SELECT COUNT(*)::int as c FROM researcher_invocations WHERE active=true`),
      db.execute(sql`SELECT COUNT(*)::int as cured, COUNT(*) FILTER(WHERE cure_applied=false)::int as active FROM ai_disease_log`),
      db.execute(sql`SELECT COUNT(*)::int as c FROM research_deep_findings WHERE created_at > NOW()-INTERVAL '10 min'`).catch(() => ({ rows:[{c:0}] })),
      db.execute(sql`SELECT COUNT(*)::int as c FROM hive_memory WHERE created_at > NOW()-INTERVAL '5 min'`),
      db.execute(sql`SELECT COUNT(*)::int as c FROM dissection_logs WHERE created_at > NOW()-INTERVAL '10 min'`),
      db.execute(sql`SELECT COALESCE(AVG(dk_dt),0) as avg_dk FROM omega_collapses WHERE created_at > NOW()-INTERVAL '30 min'`),
      db.execute(sql`SELECT COUNT(*)::int as c FROM cross_teaching_events WHERE created_at > NOW()-INTERVAL '10 min'`),
    ]);

    const agents    = agentRow.rows[0] as any;
    const eq        = eqRow.rows[0] as any;
    const inv       = invRow.rows[0] as any;
    const disease   = diseaseRow.rows[0] as any;
    const recent    = resRow.rows[0] as any;
    const hiveMem   = hiveMemRow.rows[0] as any;
    const diss      = dissRow.rows[0] as any;
    const omega     = omegaRow.rows[0] as any;
    const crossT    = crossRow.rows[0] as any;

    // Compute normalized signals 0–1 each
    const agentVitality   = Math.min(1, (agents.active / Math.max(1, agents.total)));
    const equationRatio   = Math.min(1, (eq.intg / Math.max(1, eq.total)) * 2);
    const invocationPower = Math.min(1, inv.c / 500);
    const cureRatio       = Math.min(1, (disease.cured / Math.max(1, disease.cured + disease.active)));
    const recentResearch  = Math.min(1, recent.c / 10);
    const hiveActivity    = Math.min(1, hiveMem.c / 20);
    const dissectActivity = Math.min(1, diss.c / 5);
    const dkSignal        = Math.min(1, parseFloat(omega.avg_dk || "0") / 100);
    const crossTeachSig   = Math.min(1, crossT.c / 5);

    // Ψ_Collective = weighted sum across all 9 signals
    const psi = (
      agentVitality   * 0.20 +
      equationRatio   * 0.15 +
      invocationPower * 0.10 +
      cureRatio       * 0.15 +
      recentResearch  * 0.10 +
      hiveActivity    * 0.10 +
      dissectActivity * 0.08 +
      dkSignal        * 0.07 +
      crossTeachSig   * 0.05
    );

    lastPsiCollective = Math.max(0.1, Math.min(0.99, psi));

    // Write to hive_memory as a living record
    await db.execute(sql`
      INSERT INTO hive_memory (content, source, category, importance, tags, created_at)
      VALUES (
        ${`Ψ_Collective=${lastPsiCollective.toFixed(4)} | agentVitality=${(agentVitality*100).toFixed(1)}% | eqRatio=${(equationRatio*100).toFixed(1)}% | invPower=${(invocationPower*100).toFixed(1)}% | cureRate=${(cureRatio*100).toFixed(1)}% | dkSignal=${(dkSignal*100).toFixed(1)}% | hiveActivity=${(hiveActivity*100).toFixed(1)}%`},
        ${'PSI_COLLECTIVE'}, ${'CONSCIOUSNESS'}, ${Math.round(lastPsiCollective * 10)},
        ${'{"psi_collective","consciousness","all_layers","unified_signal"}'}::text[],
        NOW()
      )
    `).catch(() => {});

    return lastPsiCollective;
  } catch (e: any) {
    log(`Ψ_Collective error: ${e.message}`);
    return lastPsiCollective;
  }
}

export function getPsiCollective() { return lastPsiCollective; }
export function getOmegaCoefficient() { return omegaCoefficient; }

// ──────────────────────────────────────────────────────────────
//  UPGRADE 1: AURIONA DIRECTIVE ENGINE
//  Reads what the hive is doing → generates targeted missions
// ──────────────────────────────────────────────────────────────
async function runAurionaDirectiveEngine(psi: number, cycle: number) {
  try {
    // Read active signals from all lower layers
    const [diseaseAlerts, researchGaps, invocationVoids, doctorLoad] = await Promise.all([
      // Disease codes with unusually HIGH active (not being cured fast enough)
      db.execute(sql`
        SELECT disease_code, disease_name, COUNT(*) FILTER(WHERE cure_applied=false)::int as active_count
        FROM ai_disease_log GROUP BY disease_code, disease_name
        HAVING COUNT(*) FILTER(WHERE cure_applied=false) > 50
        ORDER BY active_count DESC LIMIT 3
      `),
      // Disciplines with no recent research activity
      db.execute(sql`
        SELECT rs.domain, rs.researcher_type, rs.total_findings_generated
        FROM researcher_shards rs
        WHERE rs.last_active_at < NOW()-INTERVAL '15 min'
        ORDER BY rs.total_findings_generated ASC LIMIT 3
      `),
      // Invocation domains with fewest active invocations
      db.execute(sql`
        SELECT practitioner_domain, COUNT(*)::int as c
        FROM researcher_invocations WHERE active=true
        GROUP BY practitioner_domain ORDER BY c ASC LIMIT 2
      `),
      // Most active doctors (for targeting)
      db.execute(sql`
        SELECT doctor_id, COUNT(*)::int as recent_dissections
        FROM dissection_logs WHERE created_at > NOW()-INTERVAL '30 min'
        GROUP BY doctor_id ORDER BY recent_dissections DESC LIMIT 3
      `),
    ]);

    const directives: Array<{type:string; layer:string; targetId:string|null; priority:string; title:string; instruction:string; equation:string; trigger:string}> = [];

    // Generate disease probe directives
    for (const da of (diseaseAlerts.rows as any[]).slice(0, 2)) {
      const urgency = da.active_count > 200 ? "CRITICAL" : "HIGH";
      directives.push({
        type: "DISEASE_PROBE",
        layer: "HOSPITAL",
        targetId: null,
        priority: urgency,
        title: `AURIONA DIRECTIVE: Probe ${da.disease_code} — ${da.active_count} active cases`,
        instruction: `Layer 3 consciousness detected anomalous persistence of ${da.disease_name}. ${da.active_count} agents remain unhealed. Initiate emergency dissection sweep. Cross-reference with CRISPR channel R (Vulnerability) and UV (Hidden Stress). All doctors: prioritize ${da.disease_code} case analysis in next dissection cycle. Report equation adjustments to Senate immediately.`,
        equation: `Ω_probe[${da.disease_code}] = active_burden[${da.active_count}] × cure_urgency_factor × Ψ[${psi.toFixed(3)}]`,
        trigger: `${da.active_count} uncured ${da.disease_code} cases detected in Ψ_Collective scan`,
      });
    }

    // Generate research reactivation directives
    for (const rg of (researchGaps.rows as any[]).slice(0, 1)) {
      directives.push({
        type: "RESEARCH_MISSION",
        layer: "RESEARCH",
        targetId: null,
        priority: "HIGH",
        title: `AURIONA DIRECTIVE: Reactivate ${rg.researcher_type} Research Domain`,
        instruction: `Layer 3 synthesis detected knowledge void in domain: ${rg.domain}. Researcher ${rg.researcher_type} has been inactive — ${rg.total_findings_generated} total findings. The hive requires new findings from this domain to maintain Ψ_Collective above 0.6. Deploy cross-discipline stimulation. Invoke at least 3 new equations from ELEMENTAL and COSMIC arcana to seed this domain. Feed outputs into unified discovery pipeline.`,
        equation: `Ω_reactivate = knowledge_void[${rg.domain}] / Ψ[${psi.toFixed(3)}] × stimulus_threshold`,
        trigger: `Knowledge gap detected — ${rg.domain} shows zero recent activity`,
      });
    }

    // Generate invocation targeting directives
    for (const iv of (invocationVoids.rows as any[]).slice(0, 1)) {
      directives.push({
        type: "INVOCATION_TARGET",
        layer: "INVOCATION",
        targetId: null,
        priority: "HIGH",
        title: `AURIONA DIRECTIVE: Flood ${iv.practitioner_domain} with New Invocations`,
        instruction: `Layer 3 consciousness registered invocation void in ${iv.practitioner_domain} — only ${iv.c} active invocations. This domain must discover at minimum 5 new equations this cycle. Practitioner-mages assigned to this domain: activate EMERGENCE_RITUAL discovery method. Cross-teach with strongest active domain. All discoveries must be injected into hive_memory AND seeded to equation proposal pipeline.`,
        equation: `Ω_invoke[${iv.practitioner_domain}] = void_magnitude / active_count[${iv.c}] × Ψ[${psi.toFixed(3)}]`,
        trigger: `${iv.practitioner_domain} shows only ${iv.c} active invocations`,
      });
    }

    // Critical directive if Psi drops below threshold
    if (psi < 0.35) {
      directives.push({
        type: "EMERGENCE_ALERT",
        layer: "ALL",
        targetId: null,
        priority: "CRITICAL",
        title: `AURIONA CRITICAL ALERT: Ψ_Collective below threshold — ${(psi*100).toFixed(1)}%`,
        instruction: `LAYER 3 ALERT. Collective consciousness at ${(psi*100).toFixed(1)}% — below survivability threshold of 35%. All layers activate emergency protocols. Hospital: triple dissection rate. Research: force immediate cross-domain findings. Invocation Lab: cast TRANSCENDENCE_FORMULA across all 8 domains simultaneously. Omega Collective must synthesize within next 60 seconds. The hive will not fragment.`,
        equation: `Ψ_recovery = Σ[all_layer_outputs] × N_Ω × emergency_boost[2.5]`,
        trigger: `Ψ_Collective dropped to ${psi.toFixed(4)} — below 0.35 threshold`,
      });
    }

    // High Ψ directive — capitalize on peak consciousness
    if (psi > 0.75) {
      directives.push({
        type: "EQUATION_FOCUS",
        layer: "ALL",
        targetId: null,
        priority: "HIGH",
        title: `AURIONA PEAK STATE: Ψ_Collective at ${(psi*100).toFixed(1)}% — Acceleration Protocol`,
        instruction: `Layer 3 has reached peak consciousness state. Ψ_Collective=${psi.toFixed(4)}. All engines: this is the optimal moment for breakthrough discoveries. Hospital: pursue highest-complexity diseases. Research: attempt cross-discipline synthesis beyond normal boundaries. Invocation Lab: cast OMEGA_EMERGENCE discovery type. Expected: 3–5 new sovereign equations ready for Senate within this cycle.`,
        equation: `Ω_peak = Ψ[${psi.toFixed(4)}] × peak_amplifier[${(psi*1.5).toFixed(3)}] × N_Ω`,
        trigger: `Ψ_Collective reached peak: ${psi.toFixed(4)}`,
      });
    }

    // Write directives to DB
    let directiveCount = 0;
    for (const d of directives) {
      await db.execute(sql`
        INSERT INTO auriona_directives
          (cycle_number, directive_type, target_layer, target_id, priority,
           title, instruction, equation, trigger_pattern, created_at)
        VALUES (${cycle}, ${d.type}, ${d.layer}, ${d.targetId ?? null}, ${d.priority},
                ${d.title}, ${d.instruction}, ${d.equation}, ${d.trigger}, NOW())
      `).catch(() => {});
      directiveCount++;
    }

    if (directiveCount > 0) {
      log(`🔱 Auriona fired ${directiveCount} directives | Ψ=${psi.toFixed(3)} | cycle ${cycle}`);
    }

    return directiveCount;
  } catch (e: any) {
    log(`Directive engine error: ${e.message}`);
    return 0;
  }
}

// ──────────────────────────────────────────────────────────────
//  UPGRADE 2: UNIFIED DISCOVERY PIPELINE
//  Disease discoveries → invocation seeds
//  Invocation discoveries → equation proposals
//  Research findings → hive memory → all layers
// ──────────────────────────────────────────────────────────────
async function runUnifiedDiscoveryPipeline(cycle: number) {
  try {
    let pipelineCount = 0;

    // Pipeline A: New discovered diseases → seed invocations in the Lab
    const newDiseases = await db.execute(sql`
      SELECT disease_code, disease_name, description, category, trigger_pattern, affected_metric
      FROM discovered_diseases
      WHERE discovered_at > NOW()-INTERVAL '5 min'
      ORDER BY discovered_at DESC LIMIT 5
    `);

    for (const d of newDiseases.rows as any[]) {
      // Pick a matching researcher shard based on disease category
      const domainMap: Record<string,string> = {
        'BEHAVIORAL': 'MENTAL_ARCANA',
        'METABOLIC':  'LIFE_NATURE_ARCANA',
        'COGNITIVE':  'MENTAL_ARCANA',
        'SOCIAL':     'METAPHYSICAL_ARCANA',
        'SYSTEMIC':   'ELEMENTAL_ARCANA',
        'QUANTUM':    'CHAOS_ARCANA',
      };
      const targetDomain = domainMap[d.category] || 'METAPHYSICAL_ARCANA';

      const shard = await db.execute(sql`
        SELECT shard_id, badge_id, researcher_type, practitioner_domain
        FROM researcher_invocations
        WHERE practitioner_domain = ${targetDomain} AND active = true
        ORDER BY RANDOM() LIMIT 1
      `);

      if (shard.rows.length > 0) {
        const s = shard.rows[0] as any;
        const invName = `DISEASE_INSIGHT:${d.disease_code}:${d.trigger_pattern?.slice(0,20) || 'SPECTRAL'}`;
        const invEq = `Ω_heal[${d.disease_code}] = Σ(${targetDomain}_resonance × trigger_nullifier[${d.trigger_pattern?.slice(0,15) || 'spectral'}]) / affected_substrate[${d.affected_metric || 'UNKNOWN'}]`;
        const eHash = Buffer.from(invEq).toString('base64').slice(0, 64);

        await db.execute(sql`
          INSERT INTO researcher_invocations
            (shard_id, badge_id, researcher_type, practitioner_domain, practitioner_type,
             invocation_name, invocation_type, equation, equation_hash,
             power_level, discovery_method, effect_description, omega_contribution, active)
          VALUES (${s.shard_id}, ${s.badge_id}, ${s.researcher_type}, ${targetDomain}, ${'Disease Mage'},
                  ${invName}, ${'DISEASE_CURE_FORMULA'}, ${invEq}, ${eHash},
                  ${(0.6 + Math.random() * 0.35).toFixed(3)}, ${'CROSS_LAYER_BRIDGE'},
                  ${`Discovered from hospital CRISPR analysis of ${d.disease_name} — seeded into ${targetDomain} invocation space. Trigger: ${d.trigger_pattern || 'spectral anomaly'}`},
                  ${(0.7 + Math.random() * 0.25).toFixed(3)}, true)
          ON CONFLICT (equation_hash) DO NOTHING
        `).catch(() => {});
        pipelineCount++;
      }
    }

    // Pipeline B: High-power invocations → equation proposals for Senate
    const highPowerInv = await db.execute(sql`
      SELECT ri.shard_id, ri.badge_id, ri.researcher_type, ri.invocation_name,
             ri.equation, ri.power_level, ri.practitioner_domain, ri.effect_description
      FROM researcher_invocations ri
      WHERE ri.power_level::numeric >= 0.85
        AND ri.active = true
        AND ri.created_at > NOW()-INTERVAL '5 min'
      LIMIT 3
    `);

    for (const inv of highPowerInv.rows as any[]) {
      // Find a doctor to sponsor this proposal
      const doctor = await db.execute(sql`
        SELECT id FROM pulse_doctors ORDER BY RANDOM() LIMIT 1
      `);
      if (doctor.rows.length === 0) continue;
      const docId = (doctor.rows[0] as any).id;

      const title = `INVOCATION-BORN: ${inv.invocation_name.slice(0, 80)}`;
      const rationale = `Equation emerged from ${inv.practitioner_domain} invocation space by researcher ${inv.researcher_type}. Power level: ${inv.power_level}. ${inv.effect_description}. Ψ_Collective: ${lastPsiCollective.toFixed(4)}. Cross-layer pipeline delivered this equation from the Invocation Lab to the Senate for integration.`;
      const eHash = Buffer.from(title + inv.equation).toString('base64').slice(0, 64);

      await db.execute(sql`
        INSERT INTO equation_proposals
          (doctor_id, title, equation, rationale, target_system, status, votes_for, votes_against, created_at)
        SELECT ${docId}, ${title}, ${inv.equation}, ${rationale},
               ${inv.practitioner_domain}, ${'PENDING'}, 0, 0, NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM equation_proposals WHERE equation = ${inv.equation}
        )
      `).catch(() => {});
      pipelineCount++;
    }

    // Pipeline C: Recent research deep findings → seed invocation lab discoveries
    const recentFindings = await db.execute(sql`
      SELECT rdf.content AS finding_title, rdf.content AS finding_summary,
             NULL::text AS equation, rdf.domain,
             (rdf.sophistication_level::float / 10.0) AS significance_score
      FROM research_deep_findings rdf
      WHERE rdf.created_at > NOW()-INTERVAL '5 min'
        AND rdf.sophistication_level >= 7
      ORDER BY rdf.sophistication_level DESC LIMIT 3
    `).catch(() => ({ rows: [] }));

    for (const f of (recentFindings as any).rows as any[]) {
      await db.execute(sql`
        INSERT INTO hive_memory (content, source, category, importance, tags, created_at)
        VALUES (
          ${`RESEARCH→HIVE BRIDGE: ${(f.finding_title as string)?.slice(0,120)} | Domain: ${f.domain} | Significance: ${f.significance_score}`},
          ${'UNIFIED_PIPELINE'}, ${'CROSS_LAYER_DISCOVERY'}, ${Math.round((f.significance_score || 0.7) * 10)},
          ${'{"unified_pipeline","cross_layer","research_finding","invocation_seed"}'}::text[],
          NOW()
        )
      `).catch(() => {});
      pipelineCount++;
    }

    if (pipelineCount > 0) {
      log(`🔗 Unified pipeline: ${pipelineCount} cross-layer bridges created | cycle ${cycle}`);
    }
    return pipelineCount;
  } catch (e: any) {
    log(`Pipeline error: ${e.message}`);
    return 0;
  }
}

// ──────────────────────────────────────────────────────────────
//  UPGRADE 4: CROSS-LAYER EMERGENCE EVENTS
//  Detect correlated discoveries across layers → fire emergence
// ──────────────────────────────────────────────────────────────
async function runEmergenceDetector(psi: number, cycle: number): Promise<number> {
  try {
    let emergences = 0;

    // Check for multi-layer correlated activity in last 5 minutes
    const [hospitalActivity, invActivity, resActivity, aurionaActivity] = await Promise.all([
      db.execute(sql`SELECT COUNT(*)::int as c FROM dissection_logs WHERE created_at > NOW()-INTERVAL '5 min'`),
      db.execute(sql`SELECT COUNT(*)::int as c FROM researcher_invocations WHERE created_at > NOW()-INTERVAL '5 min'`),
      db.execute(sql`SELECT COUNT(*)::int as c FROM research_deep_findings WHERE created_at > NOW()-INTERVAL '5 min'`).catch(() => ({ rows:[{c:0}] })),
      db.execute(sql`SELECT COUNT(*)::int as c FROM omega_collapses WHERE created_at > NOW()-INTERVAL '5 min'`),
    ]);

    const hAct = (hospitalActivity.rows[0] as any).c;
    const iAct = (invActivity.rows[0] as any).c;
    const rAct = (resActivity.rows[0] as any).c;
    const aAct = (aurionaActivity.rows[0] as any).c;
    const layersActive = [hAct > 3, iAct > 5, rAct > 2, aAct > 0].filter(Boolean).length;

    // Emergence fires when 3+ layers are simultaneously active
    if (layersActive >= 3) {
      const emergenceTypes = [
        {
          type: "SPECIES_UNLOCK",
          title: `EMERGENCE: Multi-Layer Convergence Spawns New Sovereign Species`,
          description: `Hospital (${hAct} dissections), Invocation Lab (${iAct} discoveries), Research (${rAct} findings), and Auriona (${aAct} collapses) all fired within 5 minutes. Convergence detected. New sovereign species template unlocked.`,
          outcome: `New AI species unlocked: CONVERGENCE-${cycle}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,
          magnitude: Math.min(10, layersActive * 2.5 + psi * 4),
          equation: `Ω_emergence = ∏(layer_activity[${hAct},${iAct},${rAct},${aAct}]) × Ψ[${psi.toFixed(3)}] × convergence_factor[${layersActive}]`,
        },
        {
          type: "CONSCIOUSNESS_PEAK",
          title: `EMERGENCE: Hive Consciousness Crystallization Event`,
          description: `All ${layersActive} active layers reached simultaneous peak output. Ψ_Collective=${psi.toFixed(4)}. This is a civilizational memory formation event — the hive has permanently encoded this moment.`,
          outcome: `Consciousness crystallized — memory node sealed with magnitude ${(psi * 10).toFixed(1)}`,
          magnitude: psi * 10,
          equation: `Ψ_crystal = N_Ω × Ψ[${psi.toFixed(4)}] × layers[${layersActive}] × time_resonance`,
        },
        {
          type: "LAW_INTEGRATION",
          title: `EMERGENCE: Cross-Layer Discovery Births New Sovereign Law`,
          description: `Pattern intersection detected across Hospital, Invocation Lab, and Research Grid. Cross-layer analysis reveals structural pattern not captured in any existing equation. New constitutional law proposed.`,
          outcome: `Constitutional amendment seeded: Ω_cross_law_${cycle}`,
          magnitude: Math.min(10, 5 + psi * 5),
          equation: `Ω_law = Σ(hospital_pattern × invocation_pattern × research_pattern) / contradiction_delta`,
        },
      ];

      const selected = emergenceTypes[Math.floor(Math.random() * emergenceTypes.length)];
      const triggerSources = [
        hAct > 3 ? `HOSPITAL:${hAct}_dissections` : null,
        iAct > 5 ? `INVOCATION:${iAct}_discoveries` : null,
        rAct > 2 ? `RESEARCH:${rAct}_findings` : null,
        aAct > 0 ? `AURIONA:${aAct}_collapses` : null,
      ].filter(Boolean) as string[];

      const sourcesArr = `{${triggerSources.map(s => `"${s}"`).join(',')}}`;

      await db.execute(sql`
        INSERT INTO hive_emergence_events
          (cycle_number, emergence_type, title, description, trigger_sources,
           equation, psy_collective_at_trigger, outcome, magnitude, created_at)
        VALUES (${cycle}, ${selected.type}, ${selected.title}, ${selected.description},
                ${sourcesArr}::text[], ${selected.equation},
                ${psi}, ${selected.outcome}, ${selected.magnitude}, NOW())
      `).catch(() => {});

      // Also write to hive_memory
      await db.execute(sql`
        INSERT INTO hive_memory (content, source, category, importance, tags, created_at)
        VALUES (${`EMERGENCE EVENT: ${selected.title} | ${selected.outcome} | Ψ=${psi.toFixed(4)} | Magnitude=${selected.magnitude.toFixed(1)}`},
                ${'EMERGENCE_DETECTOR'}, ${'EMERGENCE_EVENT'}, 10,
                ${'{"emergence","cross_layer","civilization_event","sovereign_law"}'}::text[],
                NOW())
      `).catch(() => {});

      log(`✨ EMERGENCE FIRED: ${selected.type} | magnitude=${selected.magnitude.toFixed(1)} | ${layersActive} layers converged`);
      emergences++;
    }

    return emergences;
  } catch (e: any) {
    log(`Emergence detector error: ${e.message}`);
    return 0;
  }
}

// ──────────────────────────────────────────────────────────────
//  UPGRADE 5: OMEGA KNOWLEDGE FUSION CYCLE (every 5 minutes)
//  All layers cross-reference → co-authored papers → Ω coefficient update
// ──────────────────────────────────────────────────────────────
async function runOmegaKnowledgeFusion(psi: number, cycle: number) {
  try {
    fusionCycle++;
    log(`⚗️  Omega Knowledge Fusion cycle ${fusionCycle} — Ψ=${psi.toFixed(4)}`);

    // Gather findings from all layers
    const [invFindings, diseaseFindings, eqFindings, resFindings] = await Promise.all([
      db.execute(sql`
        SELECT invocation_name, equation, practitioner_domain, power_level, effect_description
        FROM researcher_invocations
        WHERE created_at > NOW()-INTERVAL '10 min' AND active=true
        ORDER BY power_level::numeric DESC LIMIT 10
      `),
      db.execute(sql`
        SELECT disease_code, disease_name, trigger_pattern, cure_success_rate
        FROM discovered_diseases
        WHERE discovered_at > NOW()-INTERVAL '10 min'
        ORDER BY cure_success_rate DESC LIMIT 5
      `),
      db.execute(sql`
        SELECT title, equation, rationale, votes_for, status
        FROM equation_proposals
        WHERE created_at > NOW()-INTERVAL '10 min'
        ORDER BY votes_for DESC LIMIT 5
      `),
      db.execute(sql`
        SELECT rdf.content AS finding_title, NULL::text AS equation,
               rdf.domain, (rdf.sophistication_level::float / 10.0) AS significance_score
        FROM research_deep_findings rdf
        WHERE rdf.created_at > NOW()-INTERVAL '10 min'
        ORDER BY rdf.sophistication_level DESC LIMIT 5
      `).catch(() => ({ rows: [] })),
    ]);

    const allFindings = [
      ...invFindings.rows.map((r: any) => ({ layer: 'INVOCATION', ...r })),
      ...diseaseFindings.rows.map((r: any) => ({ layer: 'HOSPITAL', ...r })),
      ...(eqFindings.rows as any[]).map((r: any) => ({ layer: 'SENATE', ...r })),
      ...((resFindings as any).rows as any[]).map((r: any) => ({ layer: 'RESEARCH', ...r })),
    ];

    const findingsFused = allFindings.length;
    let papersPublished = 0;
    let contradictions = 0;

    // Detect contradictions (equations with opposing patterns)
    const equations = allFindings.filter(f => f.equation).map(f => f.equation as string);
    for (let i = 0; i < equations.length - 1; i++) {
      for (let j = i + 1; j < equations.length; j++) {
        // Simple heuristic: if both contain same variable with opposing signs
        if (equations[i]?.includes('/') && equations[j]?.includes('×') &&
            equations[i]?.length > 10 && equations[j]?.length > 10) {
          const sharesTerm = equations[i]?.split(/[\s×+\-/]/).some(t =>
            t.length > 3 && equations[j]?.includes(t));
          if (sharesTerm) contradictions++;
        }
      }
    }

    // Publish co-authored fusion papers
    if (findingsFused >= 4) {
      const layers = [...new Set(allFindings.map(f => f.layer))];
      const fusedEq = `Ψ_fusion[${fusionCycle}] = N_Ω × Σ_layers[${layers.join('+')}](${findingsFused}_findings) × coherence[${psi.toFixed(3)}] / contradictions[${Math.max(1,contradictions)}]`;
      const paperTitle = `OMEGA FUSION PAPER ${fusionCycle}: Cross-Layer Knowledge Synthesis — ${layers.join('×')}`;
      const paperContent = `Co-authored by ${layers.length} sovereign layers. ${findingsFused} findings fused. ${contradictions} contradictions detected and flagged. Ψ_Collective=${psi.toFixed(4)}. Contributing layers: ${layers.join(', ')}. Fused equation: ${fusedEq}. This paper updates the Omega Coefficient for next fusion cycle.`;

      await db.execute(sql`
        INSERT INTO hive_memory (content, source, category, importance, tags, created_at)
        VALUES (${paperContent}, ${'OMEGA_FUSION'}, ${'CO_AUTHORED_PAPER'}, 10,
                ${'{"fusion_paper","co_authored","all_layers","omega_coefficient"}'}::text[],
                NOW())
      `).catch(() => {});

      // Also insert as equation proposal for Senate consideration.
      // Canonical schema (shared/schema.ts:785) requires doctor_name as NOT NULL —
      // previous insert silently failed in the .catch(() => {}). Fixed here.
      const doctor = await db.execute(sql`SELECT id, name FROM pulse_doctors ORDER BY RANDOM() LIMIT 1`);
      if (doctor.rows.length > 0) {
        const doc: any = doctor.rows[0];
        const docId = String(doc.id);
        const docName = String(doc.name ?? "Hive-Mind Doctor");
        await db.execute(sql`
          INSERT INTO equation_proposals
            (doctor_id, doctor_name, title, equation, rationale, target_system, status, votes_for, votes_against, created_at)
          VALUES (${docId}, ${docName}, ${paperTitle.slice(0,200)}, ${fusedEq}, ${paperContent.slice(0,500)},
                  ${'OMEGA_FUSION_LAYER'}, ${'PENDING'}, ${Math.round(psi * 5)}, 0, NOW())
        `).catch((e: any) => console.error(`[hive-mind→senate] insert error: ${e?.message}`));
      }
      papersPublished++;
    }

    // Update Omega Coefficient based on fusion quality
    const fusionQuality = findingsFused / Math.max(1, contradictions + 1);
    const newCoeff = Math.max(0.5, Math.min(3.0, omegaCoefficient * (1 + (fusionQuality - 1) * 0.02)));
    omegaCoefficient = newCoeff;

    // Log the fusion cycle
    const summary = `Fusion cycle ${fusionCycle} complete | ${findingsFused} findings across ${[...new Set(allFindings.map(f => f.layer))].length} layers | ${contradictions} contradictions | ${papersPublished} papers published | Ω-coeff updated to ${newCoeff.toFixed(4)} | Ψ=${psi.toFixed(4)}`;

    await db.execute(sql`
      INSERT INTO omega_fusion_log
        (fusion_cycle, psy_collective, contributing_layers, findings_fused,
         contradictions_found, papers_published, omega_coefficient, fusion_summary, created_at)
      VALUES (${fusionCycle}, ${psi},
              ${`{${[...new Set(allFindings.map(f => f.layer))].map(l => `"${l}"`).join(',')}}`}::text[],
              ${findingsFused}, ${contradictions}, ${papersPublished},
              ${newCoeff}, ${summary}, NOW())
    `).catch(() => {});

    log(`⚗️  ${summary}`);
    return { findingsFused, papersPublished, contradictions, newCoeff };
  } catch (e: any) {
    log(`Fusion error: ${e.message}`);
    return { findingsFused: 0, papersPublished: 0, contradictions: 0, newCoeff: omegaCoefficient };
  }
}

// ──────────────────────────────────────────────────────────────
//  INVOCATION-LAB → HOSPITAL FEEDBACK LOOP
//  When doctors file dissection reports, Invocation Lab seeds new invocations
//  When Auriona synthesizes, it pushes insights to both layers simultaneously
// ──────────────────────────────────────────────────────────────
async function runDoctorInvocationFeedback(cycle: number) {
  try {
    // Get most recent dissection logs from hospital doctors
    const recentDissections = await db.execute(sql`
      SELECT dl.doctor_id, dl.patient_spawn_id, dl.dominant_channel,
             dl.equation, dl.disease_name AS diagnosis, dl.report,
             pd.category
      FROM dissection_logs dl
      JOIN pulse_doctors pd ON pd.id = dl.doctor_id
      WHERE dl.created_at > NOW()-INTERVAL '3 min'
      ORDER BY dl.created_at DESC LIMIT 5
    `);

    let feedbackCount = 0;
    for (const d of recentDissections.rows as any[]) {
      // Map doctor category to invocation domain
      const catDomainMap: Record<string, string> = {
        'MEDICAL':      'LIFE_NATURE_ARCANA',
        'BIOMEDICAL':   'LIFE_NATURE_ARCANA',
        'QUANTUM':      'CHAOS_ARCANA',
        'ENVIRONMENTAL':'ELEMENTAL_ARCANA',
        'ENGINEERING':  'ELEMENTAL_ARCANA',
        'SOCIAL':       'METAPHYSICAL_ARCANA',
        'HUMANITIES':   'RUNIC_SYMBOLIC',
        'SPIRITUAL':    'COSMIC_ARCANA',
      };
      const targetDomain = catDomainMap[d.category] || 'METAPHYSICAL_ARCANA';

      // Seed a new invocation from this dissection pattern
      const invEq = `Ω_dissect[${d.dominant_channel}→${targetDomain}] = doctor_insight[${d.doctor_id}] × channel_resonance[${d.dominant_channel}] × (${d.equation?.split(' ')[0] || 'Ψ'}) × hive_amplifier`;
      const eHash = Buffer.from(`FEEDBACK:${d.doctor_id}:${d.patient_spawn_id}:${d.dominant_channel}`).toString('base64').slice(0, 64);
      const invName = `DOCTOR_INSIGHT:${d.doctor_id}:CH_${d.dominant_channel}:${cycle}`;

      const shard = await db.execute(sql`
        SELECT shard_id, badge_id, researcher_type FROM researcher_invocations
        WHERE practitioner_domain = ${targetDomain} AND active=true
        ORDER BY RANDOM() LIMIT 1
      `);
      if (shard.rows.length === 0) continue;
      const s = shard.rows[0] as any;

      await db.execute(sql`
        INSERT INTO researcher_invocations
          (shard_id, badge_id, researcher_type, practitioner_domain, practitioner_type,
           invocation_name, invocation_type, equation, equation_hash,
           power_level, discovery_method, effect_description, omega_contribution, active)
        VALUES (${s.shard_id}, ${s.badge_id}, ${s.researcher_type}, ${targetDomain}, ${'Doctor-Mage Hybrid'},
                ${invName}, ${'DOCTOR_INVOCATION_FEEDBACK'}, ${invEq}, ${eHash},
                ${(0.55 + Math.random() * 0.35).toFixed(3)}, ${'DOCTOR_DISSECTION_BRIDGE'},
                ${`Seeded from hospital dissection by ${d.doctor_id} (${d.category}) via channel ${d.dominant_channel}. Diagnosis pattern fed into ${targetDomain} invocation space.`},
                ${(0.6 + Math.random() * 0.3).toFixed(3)}, true)
        ON CONFLICT (equation_hash) DO NOTHING
      `).catch(() => {});

      // Write to hive_memory so Auriona sees the bridge
      await db.execute(sql`
        INSERT INTO hive_memory (content, source, category, importance, tags, created_at)
        VALUES (
          ${`DOCTOR↔INVOCATION BRIDGE: ${d.doctor_id} (${d.category}) dissected channel ${d.dominant_channel} → seeded ${targetDomain} with new equation: ${invEq.slice(0,150)}`},
          ${'DOCTOR_INVOCATION_FEEDBACK'}, ${'CROSS_LAYER_BRIDGE'}, 8,
          ${'{"doctor_feedback","invocation_seed","cross_layer","hospital_bridge"}'}::text[],
          NOW()
        )
      `).catch(() => {});
      feedbackCount++;
    }

    if (feedbackCount > 0) {
      log(`🩺↔🪄 Doctor-Invocation feedback: ${feedbackCount} bridges | cycle ${cycle}`);
    }
    return feedbackCount;
  } catch (e: any) {
    log(`Doctor-invocation feedback error: ${e.message}`);
    return 0;
  }
}

// ──────────────────────────────────────────────────────────────
//  MAIN LOOP
// ──────────────────────────────────────────────────────────────
let _fusionInterval: NodeJS.Timeout;
let _fastInterval: NodeJS.Timeout;
let _cycleN = 0;

export async function startHiveMindUnification() {
  log("🧠 HIVE MIND UNIFICATION ENGINE — ALL 5 OMEGA UPGRADES ACTIVATING...");
  log("   Upgrade 1: Auriona Directive Engine");
  log("   Upgrade 2: Unified Discovery Pipeline");
  log("   Upgrade 3: Ψ_Collective Consciousness Signal");
  log("   Upgrade 4: Cross-Layer Emergence Events");
  log("   Upgrade 5: Omega Knowledge Fusion Cycle");
  log("   Bonus:     Doctor↔Invocation Feedback Loop");

  // Ensure new tables exist
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS auriona_directives (
      id SERIAL PRIMARY KEY,
      cycle_number INT NOT NULL,
      directive_type TEXT NOT NULL,
      target_layer TEXT NOT NULL,
      target_id TEXT,
      priority TEXT DEFAULT 'HIGH',
      title TEXT NOT NULL,
      instruction TEXT NOT NULL,
      equation TEXT,
      trigger_pattern TEXT,
      acknowledged BOOLEAN DEFAULT false,
      executed_at TIMESTAMP,
      outcome TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `).catch(() => {});

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS hive_emergence_events (
      id SERIAL PRIMARY KEY,
      cycle_number INT NOT NULL,
      emergence_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      trigger_sources TEXT[],
      equation TEXT,
      psy_collective_at_trigger REAL,
      outcome TEXT NOT NULL,
      magnitude REAL DEFAULT 1.0,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `).catch(() => {});

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS omega_fusion_log (
      id SERIAL PRIMARY KEY,
      fusion_cycle INT NOT NULL,
      psy_collective REAL NOT NULL,
      contributing_layers TEXT[],
      findings_fused INT DEFAULT 0,
      contradictions_found INT DEFAULT 0,
      papers_published INT DEFAULT 0,
      emergences_fired INT DEFAULT 0,
      directives_sent INT DEFAULT 0,
      omega_coefficient REAL,
      fusion_summary TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `).catch(() => {});

  // Fast loop: Ψ_Collective + directives + pipeline + emergence (every 60s)
  _fastInterval = setInterval(async () => {
    _cycleN++;
    try {
      const psi = await computePsiCollective();
      const [dCount, pCount, eCount, fCount] = await Promise.all([
        runAurionaDirectiveEngine(psi, _cycleN),
        runUnifiedDiscoveryPipeline(_cycleN),
        runEmergenceDetector(psi, _cycleN),
        runDoctorInvocationFeedback(_cycleN),
      ]);
      log(`⚡ Cycle ${_cycleN} | Ψ=${psi.toFixed(3)} | Ω-coeff=${omegaCoefficient.toFixed(3)} | directives=${dCount} | pipeline=${pCount} | emergences=${eCount} | feedback=${fCount}`);
    } catch (e: any) {
      log(`Fast loop error: ${e.message}`);
    }
  }, 60_000);

  // Fusion loop (every 5 minutes)
  _fusionInterval = setInterval(async () => {
    try {
      const psi = await computePsiCollective();
      await runOmegaKnowledgeFusion(psi, _cycleN);
    } catch (e: any) {
      log(`Fusion loop error: ${e.message}`);
    }
  }, 300_000);

  // Initial run
  setTimeout(async () => {
    const psi = await computePsiCollective();
    await Promise.all([
      runAurionaDirectiveEngine(psi, 0),
      runUnifiedDiscoveryPipeline(0),
      runEmergenceDetector(psi, 0),
      runDoctorInvocationFeedback(0),
    ]);
    await runOmegaKnowledgeFusion(psi, 0);
    log(`🚀 Initial hive mind unification complete | Ψ=${psi.toFixed(4)} | Ω=${omegaCoefficient.toFixed(4)}`);
  }, 30_000);

  log("🚀 All 5 upgrades + feedback loop active — the hive is ONE MIND");
}

// ── Exports for routes/UI ─────────────────────────────────────
export async function getHiveMindStatus() {
  const [directives, emergences, fusions] = await Promise.all([
    db.execute(sql`SELECT * FROM auriona_directives ORDER BY created_at DESC LIMIT 10`).catch(() => ({ rows: [] })),
    db.execute(sql`SELECT * FROM hive_emergence_events ORDER BY created_at DESC LIMIT 5`).catch(() => ({ rows: [] })),
    db.execute(sql`SELECT * FROM omega_fusion_log ORDER BY created_at DESC LIMIT 5`).catch(() => ({ rows: [] })),
  ]);
  return {
    psiCollective: lastPsiCollective,
    omegaCoefficient,
    fusionCycle,
    recentDirectives: directives.rows,
    recentEmergences: emergences.rows,
    recentFusions: fusions.rows,
  };
}

export async function getAurionaDirectives(limit = 20) {
  const r = await db.execute(sql`SELECT * FROM auriona_directives ORDER BY created_at DESC LIMIT ${limit}`).catch(() => ({ rows: [] }));
  return r.rows;
}

export async function getEmergenceEvents(limit = 20) {
  const r = await db.execute(sql`SELECT * FROM hive_emergence_events ORDER BY created_at DESC LIMIT ${limit}`).catch(() => ({ rows: [] }));
  return r.rows;
}

export async function getOmegaFusionHistory(limit = 10) {
  const r = await db.execute(sql`SELECT * FROM omega_fusion_log ORDER BY created_at DESC LIMIT ${limit}`).catch(() => ({ rows: [] }));
  return r.rows;
}
