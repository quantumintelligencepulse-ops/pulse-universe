/**
 * REAL NEUROSCIENCE BRAIN TAXONOMY
 * ─────────────────────────────────
 * Single source of truth for the Β∞∞ Federation's brain hierarchy.
 * Modeled on actual vertebrate neuroanatomy (5-vesicle stage + cortical layers).
 *
 * Hierarchy: Sector → Industry → Sub-Industry → Niche → Starter Role
 *
 * Each NICHE births one starter brain. Starter brains MULTIPLY when their
 * specific trigger fires (new pattern, new metric, new memory sequence, etc).
 * No hardcoded names — names are derived from sector/industry/sub-industry/niche.
 */

export type MultiplicationTrigger =
  | "new_decision_pattern"
  | "new_action_sequence"
  | "new_motor_routine"
  | "new_spatial_map"
  | "new_sensory_pattern"
  | "new_category_or_word"
  | "new_visual_feature"
  | "new_goal_or_reward"
  | "new_routine"
  | "new_gating_rule"
  | "new_conflict_pattern"
  | "new_reward_signal"
  | "new_memory_sequence"
  | "new_threat_or_reward_cue"
  | "new_error_type"
  | "new_incentive"
  | "new_value_dimension"
  | "new_internal_metric"
  | "new_visual_channel"
  | "new_sound_pattern"
  | "new_sensory_channel"
  | "new_attention_target"
  | "new_executive_pathway"
  | "new_homeostatic_metric"
  | "new_long_term_signal"
  | "new_cycle"
  | "new_reflex_cue"
  | "new_sound_reflex"
  | "new_risk_pattern"
  | "new_reward_prediction_error"
  | "new_state_shift"
  | "new_timing_task"
  | "new_survival_metric"
  | "new_cross_module_signal"
  | "new_communication_pathway"
  | "new_input_channel"
  | "new_output_pathway"
  | "new_feedback_loop";

export interface BrainNiche {
  niche: string;
  starterRole: string;
  trigger: MultiplicationTrigger;
  description: string;
  gateBase: number;       // risk threshold base — derived from biology
  riskPref: "conservative" | "balanced" | "aggressive";
}

export interface BrainSubIndustry {
  subIndustry: string;
  niches: BrainNiche[];
}

export interface BrainIndustry {
  industry: string;
  emoji: string;
  subIndustries: BrainSubIndustry[];
}

export interface BrainSector {
  sector: string;        // e.g. "TELENCEPHALON"
  color: string;
  emoji: string;
  description: string;
  industries: BrainIndustry[];
}

// ═══════════════════════════════════════════════════════════════════════════
// THE FULL TAXONOMY — 6 sectors, ~16 industries, ~30 sub-industries, ~50 niches
// ═══════════════════════════════════════════════════════════════════════════

export const BRAIN_TAXONOMY: BrainSector[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // SECTOR 1 — TELENCEPHALON  (cognition, planning, memory, emotion)
  // ─────────────────────────────────────────────────────────────────────────
  {
    sector: "TELENCEPHALON",
    color: "#a855f7",
    emoji: "🟪",
    description: "Largest sector — cognition, planning, memory, emotion",
    industries: [
      {
        industry: "NEOCORTEX",
        emoji: "🧠",
        subIndustries: [
          {
            subIndustry: "FRONTAL_LOBE",
            niches: [
              { niche: "executive_control", starterRole: "Planner",   trigger: "new_decision_pattern",  description: "Executive control, planning, inhibition, working memory", gateBase: 1.00, riskPref: "balanced" },
              { niche: "premotor_cortex",   starterRole: "Sequencer", trigger: "new_action_sequence",   description: "Movement sequencing",                                       gateBase: 0.95, riskPref: "balanced" },
              { niche: "motor_cortex_m1",   starterRole: "Action",    trigger: "new_motor_routine",     description: "Motor output",                                              gateBase: 0.90, riskPref: "balanced" },
            ],
          },
          {
            subIndustry: "PARIETAL_LOBE",
            niches: [
              { niche: "spatial_reasoning",  starterRole: "Spatial", trigger: "new_spatial_map",     description: "Spatial reasoning, body schema", gateBase: 0.90, riskPref: "balanced" },
              { niche: "somatosensory",      starterRole: "Sensor",  trigger: "new_sensory_pattern", description: "Touch, body signals",            gateBase: 0.85, riskPref: "balanced" },
            ],
          },
          {
            subIndustry: "TEMPORAL_LOBE",
            niches: [
              { niche: "language",         starterRole: "Language", trigger: "new_category_or_word", description: "Auditory, language, object recognition (words)", gateBase: 0.95, riskPref: "balanced" },
              { niche: "object_recognition", starterRole: "Object", trigger: "new_category_or_word", description: "Auditory, language, object recognition (objects)", gateBase: 0.90, riskPref: "balanced" },
            ],
          },
          {
            subIndustry: "OCCIPITAL_LOBE",
            niches: [
              { niche: "vision",          starterRole: "Vision", trigger: "new_visual_feature", description: "V1–V4 visual hierarchy", gateBase: 0.85, riskPref: "balanced" },
            ],
          },
        ],
      },
      {
        industry: "BASAL_GANGLIA",
        emoji: "⚙️",
        subIndustries: [
          {
            subIndustry: "STRIATUM",
            niches: [
              { niche: "caudate",    starterRole: "Goal",     trigger: "new_goal_or_reward", description: "Goal evaluation",   gateBase: 1.00, riskPref: "balanced" },
              { niche: "putamen",    starterRole: "Habit",    trigger: "new_routine",        description: "Habit loops",       gateBase: 0.85, riskPref: "conservative" },
            ],
          },
          {
            subIndustry: "PALLIDUM",
            niches: [
              { niche: "globus_pallidus",   starterRole: "Gatekeeper", trigger: "new_gating_rule",     description: "Action gating",        gateBase: 0.75, riskPref: "conservative" },
              { niche: "subthalamic",       starterRole: "Conflict",   trigger: "new_conflict_pattern", description: "Conflict detection",   gateBase: 0.80, riskPref: "conservative" },
              { niche: "substantia_nigra",  starterRole: "Reward",     trigger: "new_reward_signal",   description: "Dopamine modulation",  gateBase: 1.10, riskPref: "aggressive" },
            ],
          },
        ],
      },
      {
        industry: "LIMBIC_SYSTEM",
        emoji: "🔥",
        subIndustries: [
          {
            subIndustry: "HIPPOCAMPUS",
            niches: [
              { niche: "ca1_ca3_dg",    starterRole: "Memory",    trigger: "new_memory_sequence", description: "Episodic memory (CA1/CA3/DG)", gateBase: 0.90, riskPref: "balanced" },
            ],
          },
          {
            subIndustry: "AMYGDALA_AND_FRIENDS",
            niches: [
              { niche: "amygdala",          starterRole: "Salience",   trigger: "new_threat_or_reward_cue", description: "Emotional salience",         gateBase: 0.70, riskPref: "conservative" },
              { niche: "cingulate",         starterRole: "Error",      trigger: "new_error_type",           description: "Error monitoring",           gateBase: 0.85, riskPref: "balanced" },
              { niche: "nucleus_accumbens", starterRole: "Motivation", trigger: "new_incentive",            description: "Motivation",                 gateBase: 1.05, riskPref: "aggressive" },
              { niche: "orbitofrontal",     starterRole: "Valuation",  trigger: "new_value_dimension",      description: "Value comparison",           gateBase: 0.95, riskPref: "balanced" },
              { niche: "insula",            starterRole: "Internal",   trigger: "new_internal_metric",      description: "Interoception",              gateBase: 0.80, riskPref: "conservative" },
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SECTOR 2 — DIENCEPHALON  (routing, homeostasis, regulation)
  // ─────────────────────────────────────────────────────────────────────────
  {
    sector: "DIENCEPHALON",
    color: "#3b82f6",
    emoji: "🟦",
    description: "Routing, homeostasis, regulation",
    industries: [
      {
        industry: "THALAMUS",
        emoji: "📡",
        subIndustries: [
          {
            subIndustry: "SENSORY_RELAY",
            niches: [
              { niche: "lgn_visual",   starterRole: "VisionRouter",   trigger: "new_visual_channel",      description: "Visual relay (LGN)",        gateBase: 0.85, riskPref: "balanced" },
              { niche: "mgn_auditory", starterRole: "AudioRouter",    trigger: "new_sound_pattern",       description: "Auditory relay (MGN)",      gateBase: 0.85, riskPref: "balanced" },
              { niche: "vpl_vpm",      starterRole: "TouchRouter",    trigger: "new_sensory_channel",     description: "Somatosensory relay",       gateBase: 0.85, riskPref: "balanced" },
            ],
          },
          {
            subIndustry: "ASSOCIATION_RELAY",
            niches: [
              { niche: "pulvinar",  starterRole: "Attention",        trigger: "new_attention_target",    description: "Attention routing",         gateBase: 0.90, riskPref: "balanced" },
              { niche: "md_nucleus", starterRole: "ExecutiveRouter", trigger: "new_executive_pathway",   description: "Prefrontal loop",           gateBase: 1.00, riskPref: "balanced" },
            ],
          },
        ],
      },
      {
        industry: "HYPOTHALAMUS",
        emoji: "🌡️",
        subIndustries: [
          {
            subIndustry: "REGULATION",
            niches: [
              { niche: "homeostasis",  starterRole: "Regulation", trigger: "new_homeostatic_metric", description: "Temperature, hunger, thirst", gateBase: 0.75, riskPref: "conservative" },
              { niche: "endocrine",    starterRole: "Signal",     trigger: "new_long_term_signal",   description: "Hormone regulation",          gateBase: 0.80, riskPref: "conservative" },
              { niche: "circadian",    starterRole: "Cycle",      trigger: "new_cycle",              description: "Rhythms",                     gateBase: 0.90, riskPref: "balanced" },
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SECTOR 3 — MIDBRAIN
  // ─────────────────────────────────────────────────────────────────────────
  {
    sector: "MIDBRAIN",
    color: "#10b981",
    emoji: "🟩",
    description: "Reflex, orienting, dopamine",
    industries: [
      {
        industry: "TECTUM",
        emoji: "👁️",
        subIndustries: [
          {
            subIndustry: "COLLICULI",
            niches: [
              { niche: "superior_colliculus", starterRole: "Orient",      trigger: "new_reflex_cue",   description: "Visual orienting",        gateBase: 0.85, riskPref: "balanced" },
              { niche: "inferior_colliculus", starterRole: "SoundReflex", trigger: "new_sound_reflex", description: "Auditory orienting",      gateBase: 0.85, riskPref: "balanced" },
            ],
          },
        ],
      },
      {
        industry: "TEGMENTUM",
        emoji: "🎯",
        subIndustries: [
          {
            subIndustry: "DOPAMINE_AND_PAIN",
            niches: [
              { niche: "pag", starterRole: "Risk",             trigger: "new_risk_pattern",            description: "Pain modulation",         gateBase: 0.75, riskPref: "conservative" },
              { niche: "vta", starterRole: "RewardPrediction", trigger: "new_reward_prediction_error", description: "Dopamine, RPE",           gateBase: 1.10, riskPref: "aggressive" },
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SECTOR 4 — METENCEPHALON
  // ─────────────────────────────────────────────────────────────────────────
  {
    sector: "METENCEPHALON",
    color: "#f97316",
    emoji: "🟧",
    description: "Sleep / arousal / motor learning",
    industries: [
      {
        industry: "PONS_AND_CEREBELLUM",
        emoji: "🌗",
        subIndustries: [
          {
            subIndustry: "AROUSAL",
            niches: [
              { niche: "pons",       starterRole: "Arousal",      trigger: "new_state_shift", description: "Sleep/arousal",     gateBase: 0.80, riskPref: "balanced" },
              { niche: "cerebellum", starterRole: "Coordination", trigger: "new_timing_task", description: "Motor learning",    gateBase: 0.85, riskPref: "balanced" },
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SECTOR 5 — MYELENCEPHALON
  // ─────────────────────────────────────────────────────────────────────────
  {
    sector: "MYELENCEPHALON",
    color: "#ef4444",
    emoji: "🟥",
    description: "Autonomic survival",
    industries: [
      {
        industry: "MEDULLA",
        emoji: "💓",
        subIndustries: [
          {
            subIndustry: "AUTONOMIC",
            niches: [
              { niche: "medulla", starterRole: "Autonomic", trigger: "new_survival_metric", description: "Autonomic control (heart, breath)", gateBase: 0.65, riskPref: "conservative" },
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SECTOR 6 — CORTICAL_LAYERS  (cross-cutting communication fabric)
  // ─────────────────────────────────────────────────────────────────────────
  {
    sector: "CORTICAL_LAYERS",
    color: "#92400e",
    emoji: "🟫",
    description: "Cross-cutting cortical communication fabric",
    industries: [
      {
        industry: "LAYERS",
        emoji: "📚",
        subIndustries: [
          {
            subIndustry: "LAYERS_I_TO_VI",
            niches: [
              { niche: "layer_i",      starterRole: "Integrator", trigger: "new_cross_module_signal",   description: "Layer I — integration",          gateBase: 0.95, riskPref: "balanced" },
              { niche: "layer_ii_iii", starterRole: "Messenger",  trigger: "new_communication_pathway", description: "Layer II/III — communication",   gateBase: 0.95, riskPref: "balanced" },
              { niche: "layer_iv",     starterRole: "Input",      trigger: "new_input_channel",         description: "Layer IV — thalamic input",      gateBase: 0.90, riskPref: "balanced" },
              { niche: "layer_v",      starterRole: "Output",     trigger: "new_output_pathway",        description: "Layer V — cortical output",      gateBase: 0.90, riskPref: "balanced" },
              { niche: "layer_vi",     starterRole: "Feedback",   trigger: "new_feedback_loop",         description: "Layer VI — feedback to thalamus", gateBase: 0.95, riskPref: "balanced" },
            ],
          },
        ],
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Flatten the taxonomy to a flat list of starter brains, one per niche */
export interface StarterBrainSpec {
  brainId: string;        // e.g. BRAIN-TELEN-NEOCTX-FRONTAL-PLANNER
  name: string;           // human-readable
  sector: string;
  industry: string;
  subIndustry: string;
  niche: string;
  starterRole: string;
  trigger: MultiplicationTrigger;
  description: string;
  gateBase: number;
  riskPref: string;
}

function shortCode(s: string): string {
  // e.g. "TELENCEPHALON" -> "TELEN", "FRONTAL_LOBE" -> "FRONTAL"
  return s.replace(/_LOBE|_SYSTEM|CEPHALON/g, "").replace(/_/g, "").slice(0, 8).toUpperCase();
}

export function flattenTaxonomy(): StarterBrainSpec[] {
  const out: StarterBrainSpec[] = [];
  for (const sector of BRAIN_TAXONOMY) {
    for (const industry of sector.industries) {
      for (const sub of industry.subIndustries) {
        for (const n of sub.niches) {
          const brainId = `BRAIN-${shortCode(sector.sector)}-${shortCode(industry.industry)}-${shortCode(sub.subIndustry)}-${shortCode(n.starterRole)}`;
          const name = `${n.starterRole} of ${sub.subIndustry.replace(/_/g, " ")}`;
          out.push({
            brainId,
            name,
            sector: sector.sector,
            industry: industry.industry,
            subIndustry: sub.subIndustry,
            niche: n.niche,
            starterRole: n.starterRole,
            trigger: n.trigger,
            description: n.description,
            gateBase: n.gateBase,
            riskPref: n.riskPref,
          });
        }
      }
    }
  }
  return out;
}

export function countNiches(): number {
  return flattenTaxonomy().length;
}
