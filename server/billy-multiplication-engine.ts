/**
 * BILLY MULTIPLICATION ENGINE
 * ───────────────────────────
 * Real (not simulated) brain birthing. Watches each niche's specific trigger,
 * and when activity in that niche crosses threshold, births a new child brain
 * descended from the elder of that niche.
 *
 * Generation grows. Gate_base mutates ±5%. Lineage is recorded.
 * 100% ADDITIVE — never deletes, never modifies elders.
 */

import { pool } from "./db.js";
import { flattenTaxonomy, type StarterBrainSpec, type MultiplicationTrigger } from "./brain-taxonomy.js";

let started = false;
const stats = { cyclesRun: 0, brainsBorn: 0, lastBirth: null as string | null, errors: 0 };

const MULTIPLICATION_INTERVAL_MS = 60_000;     // every minute
const BIRTH_COOLDOWN_MS          = 5 * 60_000; // ≥5 min between births in same niche
const MAX_BRAINS_PER_NICHE       = 50;          // soft cap per niche

export function getMultiplicationStats() { return { running: started, ...stats }; }

export async function startBillyMultiplicationEngine() {
  if (started) return;
  started = true;
  console.log("[multiplication] starting — watching every niche for real birth triggers");
  setTimeout(cycle, 90_000);              // wait 90s after boot for taxonomy to settle
  setInterval(cycle, MULTIPLICATION_INTERVAL_MS);
}

async function cycle() {
  stats.cyclesRun++;
  const niches = flattenTaxonomy();
  for (const spec of niches) {
    try {
      await checkAndBirth(spec);
    } catch (e: any) {
      stats.errors++;
      // never block other niches
    }
  }
}

async function checkAndBirth(spec: StarterBrainSpec) {
  // Per-niche cooldown
  const { rows: [state] } = await pool.query(
    `SELECT last_birth_at, brains_born, last_trigger_value FROM billy_niche_state WHERE niche=$1`,
    [spec.niche]
  );
  if (state?.last_birth_at) {
    const elapsed = Date.now() - new Date(state.last_birth_at).getTime();
    if (elapsed < BIRTH_COOLDOWN_MS) return;
  }
  if ((state?.brains_born ?? 0) >= MAX_BRAINS_PER_NICHE) return;

  // Read this niche's trigger value
  const triggerValue = await readTriggerValue(spec.trigger);
  const lastValue = Number(state?.last_trigger_value ?? 0);
  const delta = triggerValue - lastValue;

  // Per-trigger sensitivity
  const sensitivityFor: Record<MultiplicationTrigger, number> = {
    new_decision_pattern:        25,
    new_action_sequence:         15,
    new_motor_routine:           10,
    new_spatial_map:             20,
    new_sensory_pattern:         20,
    new_category_or_word:        50,
    new_visual_feature:          30,
    new_goal_or_reward:          15,
    new_routine:                 10,
    new_gating_rule:             10,
    new_conflict_pattern:        15,
    new_reward_signal:           15,
    new_memory_sequence:        100,
    new_threat_or_reward_cue:    20,
    new_error_type:              20,
    new_incentive:               15,
    new_value_dimension:         15,
    new_internal_metric:         10,
    new_visual_channel:          25,
    new_sound_pattern:           25,
    new_sensory_channel:         25,
    new_attention_target:        20,
    new_executive_pathway:       15,
    new_homeostatic_metric:      10,
    new_long_term_signal:        10,
    new_cycle:                   10,
    new_reflex_cue:              20,
    new_sound_reflex:            20,
    new_risk_pattern:            15,
    new_reward_prediction_error: 15,
    new_state_shift:             10,
    new_timing_task:             15,
    new_survival_metric:          5,
    new_cross_module_signal:     30,
    new_communication_pathway:   30,
    new_input_channel:           30,
    new_output_pathway:          30,
    new_feedback_loop:           30,
  };
  const threshold = sensitivityFor[spec.trigger] ?? 25;

  // Update last trigger value
  await pool.query(
    `INSERT INTO billy_niche_state (niche, last_trigger_value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (niche) DO UPDATE SET last_trigger_value=EXCLUDED.last_trigger_value, updated_at=NOW()`,
    [spec.niche, triggerValue]
  );

  if (delta < threshold) return; // no birth this cycle

  await birthChild(spec, delta);
}

async function readTriggerValue(trigger: MultiplicationTrigger): Promise<number> {
  // Map each biological trigger to a real database signal
  // (cumulative count — delta from last cycle is what matters)
  const queries: Record<MultiplicationTrigger, string> = {
    // Decision-related → equation_proposals
    new_decision_pattern:    `SELECT COUNT(*)::int AS n FROM equation_proposals`,
    new_executive_pathway:   `SELECT COUNT(*)::int AS n FROM equation_proposals WHERE UPPER(status)='PROMOTED'`,
    new_conflict_pattern:    `SELECT COUNT(*)::int AS n FROM equation_proposals WHERE UPPER(status)='CONTESTED'`,
    new_value_dimension:     `SELECT COUNT(*)::int AS n FROM equation_proposals WHERE UPPER(status)='PENDING'`,

    // Action-related → billy_brain_decisions / billy_brain_ticks
    new_action_sequence:     `SELECT COUNT(*)::int AS n FROM billy_brain_decisions`,
    new_motor_routine:       `SELECT COUNT(*)::int AS n FROM billy_brain_ticks WHERE decision='tick'`,
    new_routine:             `SELECT COUNT(*)::int AS n FROM billy_brain_ticks WHERE mode='DMN'`,
    new_gating_rule:         `SELECT COUNT(*)::int AS n FROM billy_brain_ticks WHERE decision='aborted_entropy'`,

    // Reward / dopamine
    new_reward_signal:       `SELECT COALESCE(SUM(omega_coeff),0)::int AS n FROM billy_brain_ticks`,
    new_reward_prediction_error: `SELECT COALESCE(COUNT(*),0)::int AS n FROM billy_brain_ticks WHERE reward_r > 50`,
    new_goal_or_reward:      `SELECT COUNT(*)::int AS n FROM billy_intentions`,
    new_incentive:           `SELECT COUNT(*)::int AS n FROM billy_redemption_ledger`,

    // Memory / sequence
    new_memory_sequence:     `SELECT COUNT(*)::int AS n FROM quantapedia_entries`,
    new_spatial_map:         `SELECT COUNT(*)::int AS n FROM quantapedia_entries WHERE family ILIKE '%geo%' OR family ILIKE '%map%'`,
    new_sensory_pattern:     `SELECT COUNT(*)::int AS n FROM quantapedia_entries WHERE family ILIKE '%sense%' OR family ILIKE '%signal%'`,
    new_category_or_word:    `SELECT COUNT(*)::int AS n FROM quantapedia_entries`,
    new_visual_feature:      `SELECT COUNT(*)::int AS n FROM quantapedia_entries WHERE family ILIKE '%vision%' OR family ILIKE '%image%'`,

    // Salience / risk → violations / amendments
    new_threat_or_reward_cue: `SELECT COUNT(*)::int AS n FROM billy_violations`,
    new_error_type:          `SELECT COUNT(*)::int AS n FROM billy_cerebellum_errors`,
    new_risk_pattern:        `SELECT COUNT(*)::int AS n FROM billy_violations WHERE created_at > NOW() - INTERVAL '1 hour'`,

    // Internal / homeostasis → mesh_vitality
    new_internal_metric:     `SELECT COALESCE(COUNT(*),0)::int AS n FROM mesh_vitality`,
    new_homeostatic_metric:  `SELECT COALESCE(COUNT(*),0)::int AS n FROM mesh_vitality`,
    new_long_term_signal:    `SELECT COALESCE(COUNT(*),0)::int AS n FROM billy_consolidation_log`,
    new_cycle:               `SELECT COALESCE(COUNT(*),0)::int AS n FROM billy_brain_ticks`,
    new_state_shift:         `SELECT COALESCE(COUNT(*),0)::int AS n FROM psi_states`,
    new_survival_metric:     `SELECT 1 AS n`,  // medulla — always alive, slow growth
    new_timing_task:         `SELECT COUNT(*)::int AS n FROM billy_brain_ticks`,

    // Sensory channels (thalamic relays)
    new_visual_channel:      `SELECT COUNT(*)::int AS n FROM ai_publications WHERE LOWER(title) ~ 'vision|visual|image|cnn'`,
    new_sound_pattern:       `SELECT COUNT(*)::int AS n FROM ai_publications WHERE LOWER(title) ~ 'audio|speech|sound|voice'`,
    new_sensory_channel:     `SELECT COUNT(*)::int AS n FROM ai_publications WHERE LOWER(title) ~ 'multimodal|sensor|signal'`,
    new_attention_target:    `SELECT COUNT(*)::int AS n FROM ai_publications WHERE LOWER(title) ~ 'attention|transformer'`,

    // Reflex
    new_reflex_cue:          `SELECT COUNT(*)::int AS n FROM billy_brain_ticks WHERE mode='SAL'`,
    new_sound_reflex:        `SELECT COUNT(*)::int AS n FROM billy_brain_ticks WHERE salience_score > 0`,

    // Cortical layers — cross-module integration
    new_cross_module_signal:    `SELECT COUNT(*)::int AS n FROM hive_links`,
    new_communication_pathway:  `SELECT COUNT(*)::int AS n FROM hive_links`,
    new_input_channel:          `SELECT COUNT(*)::int AS n FROM research_sources`,
    new_output_pathway:         `SELECT COUNT(*)::int AS n FROM equation_proposals WHERE UPPER(status)='PROMOTED'`,
    new_feedback_loop:          `SELECT COUNT(*)::int AS n FROM billy_amendments`,
  };

  const sql = queries[trigger];
  if (!sql) return 0;
  try {
    const { rows: [r] } = await pool.query(sql);
    return Number(r?.n ?? 0);
  } catch {
    return 0;
  }
}

async function birthChild(spec: StarterBrainSpec, delta: number) {
  // Find the elder (or last brain) in this niche
  const { rows: [parent] } = await pool.query(
    `SELECT id, brain_id, generation, gate_base, lab_pref, risk_pref, family_id, school_id
       FROM billy_brains WHERE niche=$1 ORDER BY generation DESC, id ASC LIMIT 1`,
    [spec.niche]
  );
  if (!parent) return;

  // Mutate gate_base ±5%
  const mutation = (Math.random() * 0.10) - 0.05;
  const childGateBase = Math.max(0.3, Math.min(1.5, Number(parent.gate_base) + mutation));
  const childGen = (parent.generation ?? 1) + 1;
  const serial = Date.now().toString(36).slice(-5).toUpperCase();
  const childId = `${parent.brain_id}-G${childGen}-${serial}`;
  const childName = `${spec.starterRole}-G${childGen}-${serial}`;

  const { rows: [child] } = await pool.query(
    `INSERT INTO billy_brains
       (brain_id, name, personality, generation, family_id, school_id,
        parent1_id, gate_base, lab_pref, risk_pref, taxonomy, elo, status,
        sector, industry, sub_industry, niche, starter_role,
        multiplication_trigger, is_elder, description, born_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,'{}'::jsonb,1400,'observing',
             $11,$12,$13,$14,$15,$16,false,$17,NOW())
     ON CONFLICT (brain_id) DO NOTHING
     RETURNING id`,
    [
      childId, childName, `${spec.starterRole.toLowerCase()}-mutation`,
      childGen, parent.family_id, parent.school_id, parent.id,
      childGateBase, parent.lab_pref ?? JSON.stringify({ apex: 0.5, hippo: 0.3 }), parent.risk_pref,
      spec.sector, spec.industry, spec.subIndustry, spec.niche, spec.starterRole,
      spec.trigger, `Born from ${parent.brain_id} after ${spec.trigger} (Δ=${Math.round(delta)})`,
    ]
  );
  if (!child) return;

  // Lineage record (real schema: child_brain_id, parent1_brain_id, generation, reason)
  try {
    await pool.query(
      `INSERT INTO billy_brain_lineage (child_brain_id, parent1_brain_id, generation, reason, blend_function)
       VALUES ($1, $2, $3, $4, 'mutation+5pct')`,
      [childId, parent.brain_id, childGen, `${spec.trigger} delta ${Math.round(delta)}`]
    );
  } catch { /* lineage may already exist; skip silently */ }

  // Niche state
  await pool.query(
    `INSERT INTO billy_niche_state (niche, last_birth_at, brains_born, updated_at)
     VALUES ($1, NOW(), 1, NOW())
     ON CONFLICT (niche) DO UPDATE SET last_birth_at=NOW(),
        brains_born = billy_niche_state.brains_born + 1, updated_at=NOW()`,
    [spec.niche]
  );

  stats.brainsBorn++;
  stats.lastBirth = new Date().toISOString();
  console.log(`[multiplication] 🧠+ born ${childId} (gen ${childGen}, niche ${spec.niche}, Δ=${Math.round(delta)})`);
}
