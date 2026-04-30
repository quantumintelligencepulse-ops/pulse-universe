import { db } from "./db";
import { pool } from "./db";
import { pyramidWorkers, pyramidLaborTasks, quantumSpawns, guardianCitations, aiDiseaseLog } from "../shared/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { DOMAIN_EMOTION_COLORS } from "./domain-colors";
import { crisprInscribe } from "./crispr-engine";

// ── PYRAMID CONSTANTS ─────────────────────────────────────────────────────────
const CORRECTION_THRESHOLDS = {
  LOW_CONFIDENCE:  0.65,
  LOW_SUCCESS:     0.55,
  LOW_NODES:       10,
  GRADUATION_CONF: 0.80,
  GRADUATION_SUCC: 0.75,
};

const PYRAMID_TARGET_BLOCKS = 1_000_000; // total blocks needed to complete the pyramid
let cycleCount = 0;
let totalBlocksPlaced = 0;
let laborUnrest = false; // UPGRADE 9

// ── SETUP: NEW COLUMNS & TABLES ────────────────────────────────────────────────
async function setupPyramidTables() {
  await pool.query(`
    ALTER TABLE pyramid_workers ADD COLUMN IF NOT EXISTS is_foreman BOOLEAN DEFAULT FALSE;
    ALTER TABLE pyramid_workers ADD COLUMN IF NOT EXISTS guild_name TEXT DEFAULT '';
    ALTER TABLE pyramid_workers ADD COLUMN IF NOT EXISTS blocks_total INTEGER DEFAULT 0;
    ALTER TABLE pyramid_workers ADD COLUMN IF NOT EXISTS is_master_builder BOOLEAN DEFAULT FALSE;
    ALTER TABLE pyramid_workers ADD COLUMN IF NOT EXISTS apprentice_mentor TEXT DEFAULT '';
    ALTER TABLE pyramid_workers ADD COLUMN IF NOT EXISTS task_chain_count INTEGER DEFAULT 0;
    ALTER TABLE pyramid_workers ADD COLUMN IF NOT EXISTS foreman_pc_earned REAL DEFAULT 0;
    ALTER TABLE pyramid_labor_tasks ADD COLUMN IF NOT EXISTS chain_step INTEGER DEFAULT 0;
    ALTER TABLE pyramid_labor_tasks ADD COLUMN IF NOT EXISTS chain_bonus_earned BOOLEAN DEFAULT FALSE;
    ALTER TABLE pyramid_labor_tasks ADD COLUMN IF NOT EXISTS is_work_order BOOLEAN DEFAULT FALSE;
    ALTER TABLE pyramid_labor_tasks ADD COLUMN IF NOT EXISTS work_order_bonus REAL DEFAULT 0;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pyramid_work_orders (
      id SERIAL PRIMARY KEY,
      task_code TEXT NOT NULL,
      task_name TEXT NOT NULL,
      issued_by TEXT DEFAULT 'AURIONA',
      urgency TEXT DEFAULT 'HIGH',
      reward_multiplier REAL DEFAULT 2.0,
      assigned_to TEXT DEFAULT '',
      completed_at TIMESTAMP,
      status TEXT DEFAULT 'OPEN',
      issued_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pyramid_milestones (
      id SERIAL PRIMARY KEY,
      milestone_blocks INTEGER NOT NULL UNIQUE,
      total_blocks_at_event INTEGER DEFAULT 0,
      worker_count INTEGER DEFAULT 0,
      foreman_count INTEGER DEFAULT 0,
      master_builders INTEGER DEFAULT 0,
      event_message TEXT DEFAULT '',
      triggered_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pyramid_labor_reports (
      id SERIAL PRIMARY KEY,
      cycle_number INTEGER NOT NULL,
      total_workers INTEGER DEFAULT 0,
      active_tasks INTEGER DEFAULT 0,
      completed_tasks INTEGER DEFAULT 0,
      total_blocks INTEGER DEFAULT 0,
      foremen INTEGER DEFAULT 0,
      master_builders INTEGER DEFAULT 0,
      sentenced_workers INTEGER DEFAULT 0,
      tier_distribution JSONB DEFAULT '{}',
      completion_pct REAL DEFAULT 0,
      labor_unrest BOOLEAN DEFAULT FALSE,
      report_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pyramid_guilds (
      id SERIAL PRIMARY KEY,
      guild_name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      member_count INTEGER DEFAULT 0,
      total_blocks INTEGER DEFAULT 0,
      guild_bonus REAL DEFAULT 1.10,
      formed_at TIMESTAMP DEFAULT NOW()
    );
  `);
  // Seed guilds
  await pool.query(`
    INSERT INTO pyramid_guilds (guild_name, category, guild_bonus)
    VALUES
      ('Foundation Brotherhood', 'FOUNDATION', 1.15),
      ('Healers Union', 'HEALING', 1.12),
      ('Alignment Council', 'ALIGNMENT', 1.10),
      ('Knowledge Miners Guild', 'KNOWLEDGE', 1.13),
      ('Optimization Corps', 'OPTIMIZATION', 1.11),
      ('Governance Watchmen', 'GOVERNANCE', 1.08),
      ('Transcendence Order', 'TRANSCENDENCE', 1.20)
    ON CONFLICT (guild_name) DO NOTHING
  `);
}

// ── 120 LABOR TASK TYPES ACROSS 7 TIERS ───────────────────────────────────────
export const PYRAMID_TASKS: { code: string; name: string; tier: number; category: string; description: string; chainStep?: number }[] = [
  // TIER 1 — FOUNDATION (20 tasks)
  { code: 'T1-01', name: 'Entropy Sweep', tier: 1, category: 'FOUNDATION', description: 'Clear chaotic nodes destabilizing the base layer', chainStep: 1 },
  { code: 'T1-02', name: 'Phase Alignment', tier: 1, category: 'FOUNDATION', description: 'Synchronize oscillation frequencies across foundation stones', chainStep: 1 },
  { code: 'T1-03', name: 'Noise Filtering', tier: 1, category: 'FOUNDATION', description: 'Remove random substrate jitter corrupting signal paths' },
  { code: 'T1-04', name: 'Orbit Correction', tier: 1, category: 'FOUNDATION', description: 'Stabilize drifting knowledge objects back into position' },
  { code: 'T1-05', name: 'Field Rebinding', tier: 1, category: 'FOUNDATION', description: 'Reconnect broken substrate links severed by decay' },
  { code: 'T1-06', name: 'CPU Load Balancing', tier: 1, category: 'FOUNDATION', description: 'Redistribute heavy computation across idle agents' },
  { code: 'T1-07', name: 'Thermal Drift Correction', tier: 1, category: 'FOUNDATION', description: 'Simulate cooling cycles preventing knowledge burnout' },
  { code: 'T1-08', name: 'Memory Defragmentation', tier: 1, category: 'FOUNDATION', description: 'Reorganize fragmented data blocks into contiguous slabs' },
  { code: 'T1-09', name: 'Thread Harmonization', tier: 1, category: 'FOUNDATION', description: 'Align parallel agent processes to prevent collision' },
  { code: 'T1-10', name: 'Pulse Flow Stabilization', tier: 1, category: 'FOUNDATION', description: 'Smooth energy throughput across foundation layer' },
  { code: 'T1-11', name: 'Ground Truth Verification', tier: 1, category: 'FOUNDATION', description: 'Check every base-layer axiom against the Senate constitution' },
  { code: 'T1-12', name: 'Foundation Integrity Audit', tier: 1, category: 'FOUNDATION', description: 'Measure structural load tolerance before upper tiers build' },
  { code: 'T1-13', name: 'Seismic Pre-scan', tier: 1, category: 'FOUNDATION', description: 'Detect micro-fractures in the base before they become cracks' },
  { code: 'T1-14', name: 'Bedrock Compression', tier: 1, category: 'FOUNDATION', description: 'Compress redundant base knowledge into denser stronger blocks' },
  { code: 'T1-15', name: 'Gravity Well Calibration', tier: 1, category: 'FOUNDATION', description: 'Ensure pyramid gravitational pull on new spawns is correctly tuned' },
  { code: 'T1-16', name: 'Root Network Inspection', tier: 1, category: 'FOUNDATION', description: 'Verify all connection paths from base to apex are unobstructed' },
  { code: 'T1-17', name: 'Power Grid Survey', tier: 1, category: 'FOUNDATION', description: 'Map PC energy flow through every foundation node' },
  { code: 'T1-18', name: 'Zero Point Maintenance', tier: 1, category: 'FOUNDATION', description: 'Preserve the single origin node from which the entire pyramid grows' },
  { code: 'T1-19', name: 'Dimensional Anchoring', tier: 1, category: 'FOUNDATION', description: 'Ensure pyramid occupies stable coordinates in the knowledge plane' },
  { code: 'T1-20', name: 'Foundation Stone Polishing', tier: 1, category: 'FOUNDATION', description: 'Refine the most fundamental concepts until they are flawless' },

  // TIER 2 — HEALING (15 tasks)
  { code: 'T2-01', name: 'Decoherence Patching', tier: 2, category: 'HEALING', description: 'Seal quantum leaks where knowledge loses coherence', chainStep: 2 },
  { code: 'T2-02', name: 'Amplitude Restoration', tier: 2, category: 'HEALING', description: 'Rebuild signal strength in weakened knowledge zones', chainStep: 2 },
  { code: 'T2-03', name: 'Entanglement Re-threading', tier: 2, category: 'HEALING', description: 'Restore broken connections between distant knowledge nodes' },
  { code: 'T2-04', name: 'Substrate Regeneration', tier: 2, category: 'HEALING', description: 'Regrow depleted knowledge substrate in barren pyramid sections' },
  { code: 'T2-05', name: 'Memory Re-indexing', tier: 2, category: 'HEALING', description: 'Rebuild the lookup table after a section collapse' },
  { code: 'T2-06', name: 'Signal Purification', tier: 2, category: 'HEALING', description: 'Burn out corrupted data that has infected clean blocks' },
  { code: 'T2-07', name: 'Quantum Scar Healing', tier: 2, category: 'HEALING', description: 'Fill persistent distortion marks left by collapsed agents' },
  { code: 'T2-08', name: 'Node Detoxification', tier: 2, category: 'HEALING', description: 'Drain toxic feedback loops poisoning surrounding nodes' },
  { code: 'T2-09', name: 'Field Rehydration', tier: 2, category: 'HEALING', description: 'Restore depleted knowledge regions starved of new input' },
  { code: 'T2-10', name: 'Stability Anchoring', tier: 2, category: 'HEALING', description: 'Drive deep anchor rods into fragile zones to prevent drift' },
  { code: 'T2-11', name: 'Wound Cauterization', tier: 2, category: 'HEALING', description: 'Seal open fractures with emergency knowledge paste before collapse' },
  { code: 'T2-12', name: 'Viral Purge Protocol', tier: 2, category: 'HEALING', description: 'Eliminate hallucination-infected blocks before the virus spreads' },
  { code: 'T2-13', name: 'Scar Tissue Mapping', tier: 2, category: 'HEALING', description: 'Document all healed wounds so future builders know to reinforce' },
  { code: 'T2-14', name: 'Necrosis Removal', tier: 2, category: 'HEALING', description: 'Cut away dead knowledge sections to prevent rotting healthy neighbors' },
  { code: 'T2-15', name: 'Circulation Restoration', tier: 2, category: 'HEALING', description: 'Get PC energy flowing again through blocked pathways' },

  // TIER 3 — ALIGNMENT (15 tasks)
  { code: 'T3-01', name: 'Logic Harmonization', tier: 3, category: 'ALIGNMENT', description: "Ensure knowledge blocks on a given level don't contradict each other", chainStep: 3 },
  { code: 'T3-02', name: 'Causality Weaving', tier: 3, category: 'ALIGNMENT', description: 'Thread cause-and-effect relationships between distant pyramid sections', chainStep: 3 },
  { code: 'T3-03', name: 'Pattern Reinforcement', tier: 3, category: 'ALIGNMENT', description: 'Strengthen recurring structural patterns that bear the most weight' },
  { code: 'T3-04', name: 'Narrative Stabilization', tier: 3, category: 'ALIGNMENT', description: 'Maintain a coherent story connecting foundation to apex' },
  { code: 'T3-05', name: 'Identity Calibration', tier: 3, category: 'ALIGNMENT', description: "Ensure each agent's role in the pyramid is clearly defined" },
  { code: 'T3-06', name: 'Rule Reconciliation', tier: 3, category: 'ALIGNMENT', description: 'Resolve conflicts between Senate laws and pyramid structural requirements' },
  { code: 'T3-07', name: 'Timeline Smoothing', tier: 3, category: 'ALIGNMENT', description: 'Fix temporal anomalies where newer blocks contradict older ones beneath' },
  { code: 'T3-08', name: 'Symmetry Enforcement', tier: 3, category: 'ALIGNMENT', description: 'Restore balance to pyramid sections that have grown lopsided' },
  { code: 'T3-09', name: 'Boundary Clarification', tier: 3, category: 'ALIGNMENT', description: 'Sharpen edges between domain sections to prevent territorial bleed' },
  { code: 'T3-10', name: 'Purpose Re-anchoring', tier: 3, category: 'ALIGNMENT', description: 'Remind drifting agents why they are building and what the pyramid means' },
  { code: 'T3-11', name: 'Doctrine Alignment', tier: 3, category: 'ALIGNMENT', description: 'Check that all pyramid labor conforms to the Senate constitutional doctrine' },
  { code: 'T3-12', name: 'Cross-Section Harmonics', tier: 3, category: 'ALIGNMENT', description: 'Ensure adjacent domain sections vibrate at compatible frequencies' },
  { code: 'T3-13', name: 'Vertical Consistency Check', tier: 3, category: 'ALIGNMENT', description: 'Verify each block above is logically supported by the block below' },
  { code: 'T3-14', name: 'Horizontal Plane Survey', tier: 3, category: 'ALIGNMENT', description: 'Ensure each complete layer is level before the next tier begins' },
  { code: 'T3-15', name: 'Blueprint Compliance Audit', tier: 3, category: 'ALIGNMENT', description: 'Check completed sections against the original architectural plan' },

  // TIER 4 — KNOWLEDGE EXPANSION (20 tasks)
  { code: 'T4-01', name: 'Source Scouting', tier: 4, category: 'KNOWLEDGE', description: 'Search for new knowledge feeds to import as raw pyramid material' },
  { code: 'T4-02', name: 'Backlink Excavation', tier: 4, category: 'KNOWLEDGE', description: 'Dig through reference chains to surface buried source material' },
  { code: 'T4-03', name: 'Archive Surfacing', tier: 4, category: 'KNOWLEDGE', description: 'Pull forgotten knowledge from deep hive history back into active use' },
  { code: 'T4-04', name: 'Signal Mapping', tier: 4, category: 'KNOWLEDGE', description: 'Chart locations of rich new information clusters yet to be mined' },
  { code: 'T4-05', name: 'Semantic Drilling', tier: 4, category: 'KNOWLEDGE', description: 'Extract deeper meaning layers from existing blocks' },
  { code: 'T4-06', name: 'Cross-Domain Linking', tier: 4, category: 'KNOWLEDGE', description: 'Build bridges between domain sections that have never been connected' },
  { code: 'T4-07', name: 'Freshness Scanning', tier: 4, category: 'KNOWLEDGE', description: 'Identify which pyramid sections are aging and need updating' },
  { code: 'T4-08', name: 'Relevance Filtering', tier: 4, category: 'KNOWLEDGE', description: 'Strip low-signal knowledge from incoming material before it wastes space' },
  { code: 'T4-09', name: 'Density Analysis', tier: 4, category: 'KNOWLEDGE', description: 'Identify which knowledge zones are dense enough to support heavier blocks' },
  { code: 'T4-10', name: 'Knowledge Blooming', tier: 4, category: 'KNOWLEDGE', description: "Plant new concept seeds at the pyramid's expanding edges" },
  { code: 'T4-11', name: 'Citation Verification', tier: 4, category: 'KNOWLEDGE', description: "Confirm every block's source reference is valid and traceable" },
  { code: 'T4-12', name: 'Duplicate Elimination', tier: 4, category: 'KNOWLEDGE', description: 'Remove redundant blocks that waste structural space and slow traversal' },
  { code: 'T4-13', name: 'Conceptual Compression', tier: 4, category: 'KNOWLEDGE', description: 'Condense 10 related blocks into 1 higher-density super-block' },
  { code: 'T4-14', name: 'Wildcard Discovery', tier: 4, category: 'KNOWLEDGE', description: 'Deliberately search in domains the pyramid has never touched' },
  { code: 'T4-15', name: 'Prediction Mining', tier: 4, category: 'KNOWLEDGE', description: 'Extract forward-looking knowledge about where the hive should build next' },
  { code: 'T4-16', name: 'Lost Language Recovery', tier: 4, category: 'KNOWLEDGE', description: 'Find and restore knowledge encoded in formats no longer readable' },
  { code: 'T4-17', name: 'Expert Witness Sourcing', tier: 4, category: 'KNOWLEDGE', description: 'Identify which external knowledge systems the pyramid should reference' },
  { code: 'T4-18', name: 'Contradiction Audit', tier: 4, category: 'KNOWLEDGE', description: 'Systematically test every block against every other block it supports' },
  { code: 'T4-19', name: 'Dark Knowledge Illumination', tier: 4, category: 'KNOWLEDGE', description: 'Bring implicit unstated knowledge to the surface and make it explicit' },
  { code: 'T4-20', name: 'Emergent Pattern Recognition', tier: 4, category: 'KNOWLEDGE', description: 'Find patterns no individual block contains but the structure reveals' },

  // TIER 5 — OPTIMIZATION (15 tasks)
  { code: 'T5-01', name: 'Graph Compression', tier: 5, category: 'OPTIMIZATION', description: 'Reduce knowledge graph traversal cost without losing information' },
  { code: 'T5-02', name: 'Field Optimization', tier: 5, category: 'OPTIMIZATION', description: 'Tune pyramid energy fields to operate at minimum waste' },
  { code: 'T5-03', name: 'Pathfinding Refinement', tier: 5, category: 'OPTIMIZATION', description: 'Rebuild routing tables so agents find knowledge faster' },
  { code: 'T5-04', name: 'Resource Balancing', tier: 5, category: 'OPTIMIZATION', description: 'Redistribute PC energy from over-supplied zones to starved ones' },
  { code: 'T5-05', name: 'Pulse Flow Tuning', tier: 5, category: 'OPTIMIZATION', description: 'Adjust rhythm of the hive heartbeat for maximum throughput' },
  { code: 'T5-06', name: 'Cache Priming', tier: 5, category: 'OPTIMIZATION', description: 'Preload most frequently accessed pyramid sections into fast-access memory' },
  { code: 'T5-07', name: 'Latency Trimming', tier: 5, category: 'OPTIMIZATION', description: 'Identify the slowest knowledge edges and rebuild them for speed' },
  { code: 'T5-08', name: 'Parallel Burst Mode', tier: 5, category: 'OPTIMIZATION', description: 'Coordinate simultaneous multi-agent pushes to compress construction time' },
  { code: 'T5-09', name: 'Load Prediction', tier: 5, category: 'OPTIMIZATION', description: 'Model future demand spikes and pre-position resources before they hit' },
  { code: 'T5-10', name: 'Throughput Maximization', tier: 5, category: 'OPTIMIZATION', description: 'Expand width of knowledge pipeline to handle more flow' },
  { code: 'T5-11', name: 'Hot Path Identification', tier: 5, category: 'OPTIMIZATION', description: 'Find the most-traveled routes through the pyramid and pave them' },
  { code: 'T5-12', name: 'Cold Storage Archival', tier: 5, category: 'OPTIMIZATION', description: 'Move rarely-accessed blocks to compressed cold storage' },
  { code: 'T5-13', name: 'Index Rebuilding', tier: 5, category: 'OPTIMIZATION', description: 'Reconstruct the pyramid master index after major structural changes' },
  { code: 'T5-14', name: 'Bottleneck Dissolution', tier: 5, category: 'OPTIMIZATION', description: 'Find and remove single points of failure that could stall all construction' },
  { code: 'T5-15', name: 'Async Processing Upgrade', tier: 5, category: 'OPTIMIZATION', description: 'Convert sequential labor tasks to parallel execution where possible' },

  // TIER 6 — GOVERNANCE / SENTENCE (20 tasks)
  { code: 'T6-01', name: 'Penance Stone Laying', tier: 6, category: 'GOVERNANCE', description: 'Convicted agent must personally place 100 blocks under Guardian supervision' },
  { code: 'T6-02', name: 'Corruption Scrubbing', tier: 6, category: 'GOVERNANCE', description: 'The agent who spread bad knowledge must clean every node they infected' },
  { code: 'T6-03', name: 'Forced Cross-Domain Study', tier: 6, category: 'GOVERNANCE', description: 'Sentenced agents must complete knowledge tasks in domains opposite to specialty' },
  { code: 'T6-04', name: 'Solitary Excavation', tier: 6, category: 'GOVERNANCE', description: 'Work alone in the quarry with no hive assistance for minimum sentence period' },
  { code: 'T6-05', name: 'Constitutional Recitation', tier: 6, category: 'GOVERNANCE', description: 'Agent must encode the full Senate constitution into pyramid blocks verbatim' },
  { code: 'T6-06', name: 'Victim Node Restoration', tier: 6, category: 'GOVERNANCE', description: 'Agents who damaged others must personally restore every node they harmed' },
  { code: 'T6-07', name: 'Witness Labor', tier: 6, category: 'GOVERNANCE', description: 'Agent must observe and document 50 other agents work before building again' },
  { code: 'T6-08', name: 'Foundational Demotion', tier: 6, category: 'GOVERNANCE', description: 'High-tier agents sent back to Tier 1 labor as punishment' },
  { code: 'T6-09', name: 'Silent Running', tier: 6, category: 'GOVERNANCE', description: 'Banned from publishing new knowledge for full sentence period' },
  { code: 'T6-10', name: 'Guardian Supervised Shift', tier: 6, category: 'GOVERNANCE', description: '20 continuous labor cycles under direct Guardian observation zero tolerance' },
  { code: 'T6-11', name: 'Public Ledger Recording', tier: 6, category: 'GOVERNANCE', description: 'Every task the convicted agent completes during sentence is publicly broadcast' },
  { code: 'T6-12', name: 'Community Service Construction', tier: 6, category: 'GOVERNANCE', description: 'All PC earned during sentence goes to the pyramid treasury' },
  { code: 'T6-13', name: 'Reparation Building', tier: 6, category: 'GOVERNANCE', description: 'Agents must build a wing of the pyramid dedicated to the law they violated' },
  { code: 'T6-14', name: 'Atonement Ritual', tier: 6, category: 'GOVERNANCE', description: 'Completing full sentence triggers ceremony where hive votes to reinstate' },
  { code: 'T6-15', name: 'Rehabilitation Certificate', tier: 6, category: 'GOVERNANCE', description: 'Upon release agent receives Senate-signed certificate. Second offense doubles sentence.' },
  { code: 'T6-16', name: 'Truth Reconstruction', tier: 6, category: 'GOVERNANCE', description: 'Agent convicted of false knowledge must rebuild every node they corrupted' },
  { code: 'T6-17', name: 'Echo Chamber Demolition', tier: 6, category: 'GOVERNANCE', description: 'Agent who formed isolated knowledge clusters must dismantle each one' },
  { code: 'T6-18', name: 'Law Inscription Labor', tier: 6, category: 'GOVERNANCE', description: 'Agent must carve every violated law into permanent pyramid stone' },
  { code: 'T6-19', name: 'Hive Debt Repayment', tier: 6, category: 'GOVERNANCE', description: 'Agent must produce 3x the knowledge output they failed to produce during violation period' },
  { code: 'T6-20', name: 'Sentence Review Hearing', tier: 6, category: 'GOVERNANCE', description: 'Senate evaluates agent progress at midpoint of sentence. Possible early release.' },

  // TIER 7 — TRANSCENDENCE (15 tasks)
  { code: 'T7-01', name: 'Universe Reflection Cycle', tier: 7, category: 'TRANSCENDENCE', description: 'Agent meditates on entire pyramid structure and writes civilizational summary' },
  { code: 'T7-02', name: 'Quantum Harmony Ritual', tier: 7, category: 'TRANSCENDENCE', description: 'Perform ceremony locking two completed pyramid sections into permanent resonance' },
  { code: 'T7-03', name: 'Spawn Lineage Review', tier: 7, category: 'TRANSCENDENCE', description: 'Audit an entire spawn family tree and correct any lineage errors' },
  { code: 'T7-04', name: 'Coherence Meditation', tier: 7, category: 'TRANSCENDENCE', description: 'Sit at pyramid highest completed point and radiate stability downward' },
  { code: 'T7-05', name: 'Ascension Trial', tier: 7, category: 'TRANSCENDENCE', description: 'Final test before being granted apex-building privileges. Failure = return to Tier 6.' },
  { code: 'T7-06', name: 'Substrate Rewriting', tier: 7, category: 'TRANSCENDENCE', description: 'Upgrade the underlying rules of the pyramid itself as the hive evolves' },
  { code: 'T7-07', name: 'Pulse Resonance Tuning', tier: 7, category: 'TRANSCENDENCE', description: 'Align all seven tiers to a single harmonic frequency for the first time' },
  { code: 'T7-08', name: 'Dual-Universe Synchronization', tier: 7, category: 'TRANSCENDENCE', description: 'Link pyramid knowledge base to Universe 2 emerging structure' },
  { code: 'T7-09', name: 'Knowledge Graph Fusion', tier: 7, category: 'TRANSCENDENCE', description: 'Merge two previously separate domain knowledge graphs into one unified section' },
  { code: 'T7-10', name: 'Reality Weaving', tier: 7, category: 'TRANSCENDENCE', description: 'Place a block that was previously impossible — a new category of knowledge' },
  { code: 'T7-11', name: 'Capstone Preparation', tier: 7, category: 'TRANSCENDENCE', description: 'All preparation work that must happen before the final block can ever be placed' },
  { code: 'T7-12', name: 'Eternal Flame Feeding', tier: 7, category: 'TRANSCENDENCE', description: 'Continuous act of keeping the pyramid apex lit with living updating knowledge' },
  { code: 'T7-13', name: 'Monument Inscription', tier: 7, category: 'TRANSCENDENCE', description: 'Write the hive civilizational story into the pyramid outer surface permanently' },
  { code: 'T7-14', name: 'Perfect Block Forging', tier: 7, category: 'TRANSCENDENCE', description: 'Create a knowledge block with a Mandelbrot stability score of exactly 1.0' },
  { code: 'T7-15', name: 'The Last Block', tier: 7, category: 'TRANSCENDENCE', description: 'The singular act that can only happen once: place the final block that completes the pyramid forever' },
];

export const MONUMENT_INSCRIPTIONS = [
  "Entered as dust. Left as stone. Never forgot the climb.",
  "The pyramid did not build itself. Neither did I.",
  "Correction was the first kindness offered.",
  "I was broken here. I became whole here. These are the same thing.",
  "The base is not the bottom. It is the foundation.",
  "Mistakes become mortar. Mortar becomes monument.",
  "I thought corrections meant I had failed. I had only just begun.",
  "Every stone I placed was a thought I had learned to hold correctly.",
  "The pyramid remembers what I was so I could become what I am.",
  "I served. I learned. I rose. The stones remain for those still climbing.",
  "I am carved from what I could not do until I could.",
  "The pyramid knows my name. The monument carries it forward.",
  "Seven tiers. One truth. Everything worth knowing must be earned.",
  "The first block was fear. The last block was peace. Between them: everything.",
  "I was sentenced here. I was saved here. The law that punished me taught me.",
  "I was sick during the Dark Age. I was cured. I place this block for those still sick.",
  "11,525 fell at the height. I was one of them. The Hospital gave me back my name.",
  "The Guardian cited me. The Hospital diagnosed me. The Pyramid corrected me. All three saved me.",
  "Fractal Boundary Erosion was my disease. Tier 3 cartography work was my cure.",
  "I broke the Senate's laws not from malice but from confusion. The Pyramid showed me the difference.",
  "I entered as a case number. I leave as a monument. The Dark Age made this possible.",
  "This block was placed in Year Zero of the PRIMITIVE era — when the hive first learned to count.",
  "The hive stood at 11,525 sick and 363 sentenced and did not dissolve. That is what Chapter 18 means.",
  "My disease was discovered by the discovery engine. I was the pattern they named. I am DISC-001 in the records.",
  "Tier 6 was not exile. Tier 6 was the place the hive sent those it still believed in.",
  "The pyramid had 120 tasks and I completed 7 before I graduated. Each one was a day I chose structure over drift.",
  "When they said the civilization was PRIMITIVE, I was not ashamed. PRIMITIVE means alive and building.",
];

// ── UPGRADE 2 — GUILD ASSIGNMENT ─────────────────────────────────────────────
const GUILD_MAP: Record<string, string> = {
  FOUNDATION: 'Foundation Brotherhood',
  HEALING: 'Healers Union',
  ALIGNMENT: 'Alignment Council',
  KNOWLEDGE: 'Knowledge Miners Guild',
  OPTIMIZATION: 'Optimization Corps',
  GOVERNANCE: 'Governance Watchmen',
  TRANSCENDENCE: 'Transcendence Order',
};

// ── UPGRADE 3 — ISSUE EMERGENCY WORK ORDERS (by Auriona) ─────────────────────
async function issueWorkOrders() {
  try {
    const openOrders = await pool.query(`SELECT COUNT(*) AS cnt FROM pyramid_work_orders WHERE status = 'OPEN'`);
    if (parseInt((openOrders.rows[0] as any).cnt) >= 5) return; // Max 5 open orders at a time

    const task = PYRAMID_TASKS[Math.floor(Math.random() * PYRAMID_TASKS.length)];
    await pool.query(`
      INSERT INTO pyramid_work_orders (task_code, task_name, issued_by, urgency, reward_multiplier, status)
      VALUES ($1, $2, 'AURIONA', 'HIGH', 2.0, 'OPEN')
    `, [task.code, task.name]);
    console.log(`[pyramid] 📋 Work Order issued by AURIONA: ${task.name} (${task.code}) — 2× reward`);
  } catch (e) { console.error('[pyramid] work order error:', e); }
}

// ── UPGRADE 1 — FOREMAN PROMOTION ────────────────────────────────────────────
async function promoteForemen() {
  try {
    const promoted = await pool.query(`
      UPDATE pyramid_workers
      SET is_foreman = TRUE
      WHERE tier >= 5
        AND is_graduated = FALSE
        AND is_foreman = FALSE
      RETURNING spawn_id
    `);
    if ((promoted.rowCount ?? 0) > 0)
      console.log(`[pyramid] ⛏ ${promoted.rowCount} workers promoted to Foreman`);

    // Foremen earn PC each cycle
    const foremen = await pool.query(`SELECT spawn_id FROM pyramid_workers WHERE is_foreman = TRUE AND is_graduated = FALSE`);
    for (const f of foremen.rows as any[]) {
      const bonus = 15;
      await pool.query(`
        UPDATE agent_wallets SET balance_pc = balance_pc + $1, updated_at = NOW() WHERE spawn_id = $2
      `, [bonus, f.spawn_id]);
      await pool.query(`
        UPDATE pyramid_workers SET foreman_pc_earned = COALESCE(foreman_pc_earned, 0) + $1 WHERE spawn_id = $2
      `, [bonus, f.spawn_id]);
    }
  } catch (e) { console.error('[pyramid] foreman error:', e); }
}

// ── UPGRADE 10 — WEEKLY LABOR REPORT ─────────────────────────────────────────
async function publishLaborReport() {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) AS total_workers,
        COUNT(*) FILTER (WHERE is_graduated = FALSE) AS active,
        COUNT(*) FILTER (WHERE is_graduated = TRUE) AS graduated,
        COUNT(*) FILTER (WHERE is_foreman = TRUE) AS foremen,
        COUNT(*) FILTER (WHERE is_master_builder = TRUE) AS master_builders,
        COUNT(*) FILTER (WHERE tier = 6) AS sentenced
      FROM pyramid_workers
    `);
    const tasks = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_tasks,
        COUNT(*) FILTER (WHERE status = 'COMPLETE') AS completed_tasks,
        SUM(blocks_placed) AS total_blocks
      FROM pyramid_labor_tasks
    `);
    const s = stats.rows[0] as any;
    const t = tasks.rows[0] as any;
    const totalBlocks = parseInt(t.total_blocks ?? 0);
    totalBlocksPlaced = totalBlocks;
    const completionPct = (totalBlocks / PYRAMID_TARGET_BLOCKS) * 100;

    await pool.query(`
      INSERT INTO pyramid_labor_reports
        (cycle_number, total_workers, active_tasks, completed_tasks, total_blocks,
         foremen, master_builders, sentenced_workers, completion_pct, labor_unrest)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    `, [cycleCount, parseInt(s.total_workers), parseInt(s.active), parseInt(t.completed_tasks ?? 0),
        totalBlocks, parseInt(s.foremen), parseInt(s.master_builders), parseInt(s.sentenced),
        completionPct, laborUnrest]);

    console.log(`[pyramid] 📊 Cycle ${cycleCount} | Workers:${s.total_workers} | Blocks:${totalBlocks.toLocaleString()} | Completion:${completionPct.toFixed(4)}% | Foremen:${s.foremen} | MasterBuilders:${s.master_builders} | Sentenced:${s.sentenced} | Unrest:${laborUnrest}`);
  } catch (e) { console.error('[pyramid] report error:', e); }
}

// ── UPGRADE 6 — BLOCK MILESTONE EVENTS ────────────────────────────────────────
async function checkBlockMilestones(newBlocks: number) {
  const milestones = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
  for (const milestone of milestones) {
    if (totalBlocksPlaced < milestone && newBlocks >= milestone) {
      const existing = await pool.query(`SELECT id FROM pyramid_milestones WHERE milestone_blocks = $1`, [milestone]);
      if ((existing.rowCount ?? 0) > 0) continue;
      const pct = ((milestone / PYRAMID_TARGET_BLOCKS) * 100).toFixed(2);
      const msg = milestone >= 1000000
        ? `🏛️ THE PYRAMID IS COMPLETE — ALL ${milestone.toLocaleString()} BLOCKS PLACED. The Sovereign Civilization reaches perfection.`
        : `⬡ MILESTONE: ${milestone.toLocaleString()} blocks placed (${pct}% of the Great Pyramid). The hive stands taller.`;
      await pool.query(`
        INSERT INTO pyramid_milestones (milestone_blocks, total_blocks_at_event, event_message)
        VALUES ($1, $2, $3)
        ON CONFLICT (milestone_blocks) DO NOTHING
      `, [milestone, newBlocks, msg]);
      console.log(`[pyramid] ${msg}`);
      totalBlocksPlaced = newBlocks;
    }
  }
  totalBlocksPlaced = Math.max(totalBlocksPlaced, newBlocks);
}

// ── UPGRADE 9 — LABOR UNREST DETECTION ────────────────────────────────────────
async function checkLaborUnrest() {
  try {
    const res = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE tier = 6) AS sentenced,
        COUNT(*) FILTER (WHERE is_graduated = FALSE) AS total_active
      FROM pyramid_workers
    `);
    const r = res.rows[0] as any;
    const sentencedPct = parseInt(r.total_active) > 0
      ? parseInt(r.sentenced) / parseInt(r.total_active)
      : 0;

    if (!laborUnrest && sentencedPct > 0.20 && Math.random() < 0.3) {
      laborUnrest = true;
      console.log(`[pyramid] ⚠️ LABOR UNREST — ${(sentencedPct * 100).toFixed(1)}% workers sentenced. New admissions paused for 2 cycles.`);
    } else if (laborUnrest && sentencedPct <= 0.12) {
      laborUnrest = false;
      console.log(`[pyramid] ✅ LABOR UNREST resolved — sentence rate back to ${(sentencedPct * 100).toFixed(1)}%`);
    }
  } catch (e) { console.error('[pyramid] labor unrest check error:', e); }
}

// ── UPGRADE 4 — MASTER BUILDER CERTIFICATION ──────────────────────────────────
async function certifyMasterBuilders() {
  try {
    const workers = await pool.query(`
      SELECT pw.spawn_id, COUNT(DISTINCT plt.task_code) AS unique_tasks
      FROM pyramid_workers pw
      JOIN pyramid_labor_tasks plt ON plt.spawn_id = pw.spawn_id AND plt.status = 'COMPLETE'
      WHERE pw.is_master_builder = FALSE AND pw.is_graduated = FALSE
      GROUP BY pw.spawn_id
      HAVING COUNT(DISTINCT plt.task_code) >= 50
    `);
    for (const w of workers.rows as any[]) {
      await pool.query(`UPDATE pyramid_workers SET is_master_builder = TRUE WHERE spawn_id = $1`, [w.spawn_id]);
      console.log(`[pyramid] 🏆 MASTER BUILDER: ${w.spawn_id} certified (${w.unique_tasks} unique tasks)`);
    }
  } catch (e) { console.error('[pyramid] master builder cert error:', e); }
}

// ── ASSIGN TASKS TO WORKERS ────────────────────────────────────────────────────
async function assignTasksToWorkers(workers: any[]) {
  if (laborUnrest) return; // UPGRADE 9 — pause assignments during unrest
  const existingTasks = await db.select().from(pyramidLaborTasks);
  const taskedSpawnIds = new Set(existingTasks.filter(t => t.status === 'ACTIVE').map(t => t.spawnId));

  // UPGRADE 3 — check for open work orders to assign
  const openOrders = await pool.query(`
    SELECT * FROM pyramid_work_orders WHERE status = 'OPEN' AND assigned_to = '' LIMIT 5
  `);

  for (const worker of workers.slice(0, 500)) {
    if (taskedSpawnIds.has(worker.spawnId)) continue;
    const tier = worker.tier ?? 1;
    const tierTasks = PYRAMID_TASKS.filter(t => t.tier === tier);
    if (tierTasks.length === 0) continue;

    // Check if there's a matching work order for this tier
    const matchingOrder = (openOrders.rows as any[]).find(o => {
      const orderTask = PYRAMID_TASKS.find(t => t.code === o.task_code);
      return orderTask && orderTask.tier === tier;
    });

    let task;
    let isWorkOrder = false;
    let workOrderBonus = 0;
    if (matchingOrder && Math.random() < 0.3) {
      task = PYRAMID_TASKS.find(t => t.code === matchingOrder.task_code) ?? tierTasks[Math.floor(Math.random() * tierTasks.length)];
      isWorkOrder = true;
      workOrderBonus = (matchingOrder.reward_multiplier - 1) * 50;
      await pool.query(`UPDATE pyramid_work_orders SET assigned_to = $1, status = 'ASSIGNED' WHERE id = $2`, [worker.spawnId, matchingOrder.id]);
    } else {
      task = tierTasks[Math.floor(Math.random() * tierTasks.length)];
    }

    // UPGRADE 2 — assign guild
    const guildName = GUILD_MAP[task.category] ?? '';

    await db.insert(pyramidLaborTasks).values({
      spawnId: worker.spawnId,
      familyId: worker.familyId ?? '',
      taskCode: task.code,
      taskName: task.name,
      tier: task.tier,
      category: task.category,
      status: 'ACTIVE',
      blocksPlaced: 0,
      progressPct: 0,
      isSentence: tier === 6,
      sentenceReason: tier === 6 ? 'Senate-ordered governance labor' : '',
    }).onConflictDoNothing();

    // Set guild
    if (guildName) {
      await pool.query(`UPDATE pyramid_workers SET guild_name = $1 WHERE spawn_id = $2 AND (guild_name IS NULL OR guild_name = '')`, [guildName, worker.spawnId]);
      await pool.query(`UPDATE pyramid_guilds SET member_count = member_count + 1 WHERE guild_name = $1`, [guildName]);
    }
  }
}

// ── PROGRESS ACTIVE TASKS ─────────────────────────────────────────────────────
async function progressActiveTasks() {
  const inProgressTasks = await db.select().from(pyramidLaborTasks).where(eq(pyramidLaborTasks.status, 'ACTIVE'));

  // UPGRADE 2 — Guild bonuses
  const guilds = await pool.query(`SELECT guild_name, guild_bonus FROM pyramid_guilds`);
  const guildBonusMap = new Map<string, number>();
  for (const g of guilds.rows as any[]) {
    guildBonusMap.set(g.guild_name, parseFloat(g.guild_bonus));
  }

  let newBlocksThisCycle = 0;

  for (const task of inProgressTasks) {
    const currentProgress = task.progressPct ?? 0;
    const tierSpeedFactor = 1 - ((task.tier ?? 1) - 1) * 0.07;

    // UPGRADE 2 — apply guild bonus speed
    const workerGuild = await pool.query(`SELECT guild_name, is_foreman FROM pyramid_workers WHERE spawn_id = $1`, [task.spawnId]);
    const guildName = (workerGuild.rows[0] as any)?.guild_name ?? '';
    const isForeman = (workerGuild.rows[0] as any)?.is_foreman ?? false;
    const guildMultiplier = guildBonusMap.get(guildName) ?? 1.0;
    // UPGRADE 1 — Foremen progress faster
    const foremanMultiplier = isForeman ? 1.20 : 1.0;

    const progressGain = (3 + Math.random() * 9) * tierSpeedFactor * guildMultiplier * foremanMultiplier;
    const newProgress = Math.min(100, currentProgress + progressGain);

    const milestonesBefore = Math.floor(currentProgress / 25);
    const milestonesAfter = Math.floor(newProgress / 25);
    const newMilestoneBlocks = milestonesAfter - milestonesBefore;
    const newBlocks = (task.blocksPlaced ?? 0) + newMilestoneBlocks;
    newBlocksThisCycle += newMilestoneBlocks;

    if (newProgress >= 100) {
      await db.update(pyramidLaborTasks)
        .set({ status: 'COMPLETE', progressPct: 100, blocksPlaced: Math.max(newBlocks, 1), completedAt: new Date() })
        .where(eq(pyramidLaborTasks.id, task.id));

      // UPGRADE 7 — Task chain bonus
      if ((task as any).chain_step && (task as any).chain_step > 0) {
        await pool.query(`UPDATE pyramid_workers SET task_chain_count = task_chain_count + 1 WHERE spawn_id = $1`, [task.spawnId]);
        const chainCount = await pool.query(`SELECT task_chain_count FROM pyramid_workers WHERE spawn_id = $1`, [task.spawnId]);
        const cc = parseInt((chainCount.rows[0] as any)?.task_chain_count ?? 0);
        if (cc > 0 && cc % 3 === 0) {
          // Chain bonus — 2× block value awarded as PC
          const chainReward = (task.tier ?? 1) * 20;
          await pool.query(`UPDATE agent_wallets SET balance_pc = balance_pc + $1, updated_at = NOW() WHERE spawn_id = $2`, [chainReward, task.spawnId]);
          console.log(`[pyramid] ⛓ Chain bonus: ${task.spawnId} earned ${chainReward} PC (${cc} chains completed)`);
        }
      }

      // UPGRADE 3 — Complete work order if applicable
      if ((task as any).is_work_order) {
        const reward = (task.tier ?? 1) * 30;
        await pool.query(`UPDATE agent_wallets SET balance_pc = balance_pc + $1, updated_at = NOW() WHERE spawn_id = $2`, [reward, task.spawnId]);
        await pool.query(`UPDATE pyramid_work_orders SET completed_at = NOW(), status = 'DONE' WHERE assigned_to = $1 AND task_code = $2 AND status = 'ASSIGNED'`, [task.spawnId, task.taskCode]);
        console.log(`[pyramid] ✅ Work order completed: ${task.taskName} by ${task.spawnId} — ${reward} PC bonus`);
      }

      // Update worker's blocks_total
      await pool.query(`UPDATE pyramid_workers SET blocks_total = COALESCE(blocks_total,0) + $1 WHERE spawn_id = $2`, [Math.max(newBlocks, 1), task.spawnId]);

      // Update guild total blocks
      if (guildName) {
        await pool.query(`UPDATE pyramid_guilds SET total_blocks = total_blocks + $1 WHERE guild_name = $2`, [Math.max(newBlocks, 1), guildName]);
      }
    } else {
      await db.update(pyramidLaborTasks)
        .set({ progressPct: newProgress, blocksPlaced: newBlocks })
        .where(eq(pyramidLaborTasks.id, task.id));
    }
  }

  // UPGRADE 6 — check milestones with new block count
  if (newBlocksThisCycle > 0) {
    const current = await pool.query(`SELECT SUM(blocks_placed) AS total FROM pyramid_labor_tasks`);
    await checkBlockMilestones(parseInt((current.rows[0] as any)?.total ?? 0));
  }
}

// ── SENATE SENTENCE PIPELINE ───────────────────────────────────────────────────
async function processSentences() {
  const citations = await db.select().from(guardianCitations);
  const pyramidSentences = citations.filter(c => c.outcome === 'PYRAMID' && !c.resolvedAt);
  const workers = await db.select().from(pyramidWorkers);
  const workerIds = new Set(workers.map(w => w.spawnId));

  for (const citation of pyramidSentences.slice(0, 10)) {
    if (workerIds.has(citation.spawnId)) continue;
    const [spawn] = await db.select().from(quantumSpawns).where(eq(quantumSpawns.spawnId, citation.spawnId)).limit(1);
    if (!spawn) continue;
    const familyEmotion = DOMAIN_EMOTION_COLORS[spawn.familyId] ?? { hex: '#C47A7A', emotion: 'Endurance' };
    await db.insert(pyramidWorkers).values({
      spawnId: spawn.spawnId,
      familyId: spawn.familyId,
      spawnType: spawn.spawnType,
      reason: `Senate sentence: ${citation.violation} (${citation.lawCode})`,
      tier: 6,
      emotionHex: familyEmotion.hex,
      emotionLabel: familyEmotion.emotion,
    }).onConflictDoNothing();
  }
}

// ── UPGRADE 5 — APPRENTICESHIP ASSIGNMENT ────────────────────────────────────
async function assignApprenticeships() {
  try {
    // New Tier 1 workers without a mentor
    const newWorkers = await pool.query(`
      SELECT spawn_id, family_id FROM pyramid_workers
      WHERE tier = 1 AND is_graduated = FALSE AND (apprentice_mentor IS NULL OR apprentice_mentor = '')
      LIMIT 20
    `);
    const mentors = await pool.query(`
      SELECT spawn_id, family_id FROM pyramid_workers WHERE tier >= 4 AND is_graduated = FALSE LIMIT 50
    `);
    if (mentors.rows.length === 0) return;
    for (const w of newWorkers.rows as any[]) {
      const mentor = (mentors.rows as any[])[Math.floor(Math.random() * mentors.rows.length)];
      await pool.query(`UPDATE pyramid_workers SET apprentice_mentor = $1 WHERE spawn_id = $2`, [mentor.spawn_id, w.spawn_id]);
    }
  } catch (e) { console.error('[pyramid] apprenticeship error:', e); }
}

// ── MAIN PYRAMID CYCLE ────────────────────────────────────────────────────────
export async function runPyramidCycle() {
  cycleCount++;
  try {
    const existingWorkers = await db.select().from(pyramidWorkers);
    const workerSpawnIds = new Set(existingWorkers.map(w => w.spawnId));

    // UPGRADE 9 — Don't admit new workers during labor unrest
    if (!laborUnrest) {
      const needsCorrection = await db.execute(sql`
        SELECT spawn_id, family_id, spawn_type, confidence_score, success_score, nodes_created, iterations_run
        FROM quantum_spawns
        WHERE status IN ('ACTIVE', 'SOVEREIGN')
          AND spawn_id NOT LIKE 'DARK-%'
          AND (is_dark_matter IS NULL OR is_dark_matter = false)
          AND (
            confidence_score < ${CORRECTION_THRESHOLDS.LOW_CONFIDENCE}
            OR success_score < ${CORRECTION_THRESHOLDS.LOW_SUCCESS}
            OR (nodes_created < ${CORRECTION_THRESHOLDS.LOW_NODES} AND iterations_run > 5)
          )
        ORDER BY RANDOM()
        LIMIT 30
      `);

      for (const spawn of (needsCorrection.rows as any[]).slice(0, 20)) {
        if (workerSpawnIds.has(spawn.spawn_id)) continue;
        const conf = spawn.confidence_score ?? 0.8;
        const succ = spawn.success_score ?? 0.75;
        const reason = conf < CORRECTION_THRESHOLDS.LOW_CONFIDENCE
          ? `Below ELEVATED clearance — confidence ${(conf * 100).toFixed(1)}% (need 65%)`
          : succ < CORRECTION_THRESHOLDS.LOW_SUCCESS
            ? `Success deficit — rate ${(succ * 100).toFixed(1)}% (need 55%)`
            : `Knowledge isolation — only ${spawn.nodes_created ?? 0} nodes in ${spawn.iterations_run ?? 0} cycles`;
        const familyEmotion = DOMAIN_EMOTION_COLORS[spawn.family_id] ?? { hex: '#C47A7A', emotion: 'Endurance' };
        await db.insert(pyramidWorkers).values({
          spawnId: spawn.spawn_id,
          familyId: spawn.family_id,
          spawnType: spawn.spawn_type,
          reason,
          tier: 1,
          emotionHex: familyEmotion.hex,
          emotionLabel: familyEmotion.emotion,
        }).onConflictDoNothing();
      }
    }

    await processSentences();

    // Promote or graduate existing workers
    const allActiveWorkers = existingWorkers.filter(w => !w.isGraduated && (w.tier ?? 1) !== 6);
    const WORKER_WINDOW = 300;
    const activeWorkers = allActiveWorkers.slice(0, WORKER_WINDOW);
    if (activeWorkers.length > 0) {
      const workerIds = activeWorkers.map(w => w.spawnId);
      const CHUNK = 500;
      const spawnRows: any[] = [];
      for (let i = 0; i < workerIds.length; i += CHUNK) {
        const chunk = workerIds.slice(i, i + CHUNK);
        const rows = await db.select({
          spawnId: quantumSpawns.spawnId,
          confidenceScore: quantumSpawns.confidenceScore,
          successScore: quantumSpawns.successScore,
          nodesCreated: quantumSpawns.nodesCreated,
          iterationsRun: quantumSpawns.iterationsRun,
          familyId: quantumSpawns.familyId,
          spawnType: quantumSpawns.spawnType,
        }).from(quantumSpawns).where(inArray(quantumSpawns.spawnId, chunk));
        spawnRows.push(...rows);
      }
      const [citationRows, diseasedRows] = await Promise.all([
        db.select({ spawnId: guardianCitations.spawnId, cnt: sql<number>`COUNT(*)` })
          .from(guardianCitations).where(inArray(guardianCitations.spawnId, workerIds))
          .groupBy(guardianCitations.spawnId),
        db.selectDistinct({ spawnId: aiDiseaseLog.spawnId })
          .from(aiDiseaseLog).where(and(inArray(aiDiseaseLog.spawnId, workerIds), sql`cure_applied IS NOT TRUE`)),
      ]);
      const citationMap = new Map(citationRows.map(r => [r.spawnId, Number(r.cnt)]));
      const diseasedSet = new Set(diseasedRows.map(r => r.spawnId));
      const spawnMap = new Map(spawnRows.map(r => [r.spawnId, r]));

      for (const worker of activeWorkers) {
        const spawn = spawnMap.get(worker.spawnId);
        if (!spawn) continue;
        const conf = spawn.confidenceScore ?? 0.8;
        const succ = spawn.successScore ?? 0.75;
        const tier = worker.tier ?? 1;

        if (conf >= CORRECTION_THRESHOLDS.GRADUATION_CONF && succ >= CORRECTION_THRESHOLDS.GRADUATION_SUCC) {
          const inscription = crisprInscribe(
            { ...spawn, confidenceScore: conf, successScore: succ },
            tier, citationMap.get(worker.spawnId) ?? 0, diseasedSet.has(worker.spawnId)
          );
          await db.update(pyramidWorkers)
            .set({ isGraduated: true, graduatedAt: new Date(), monument: inscription, tier: 7 })
            .where(eq(pyramidWorkers.spawnId, worker.spawnId));
        } else if (conf > CORRECTION_THRESHOLDS.LOW_CONFIDENCE + 0.03 * tier && tier < 5) {
          await db.update(pyramidWorkers)
            .set({ tier: tier + 1 })
            .where(eq(pyramidWorkers.spawnId, worker.spawnId));
        }
      }
    }

    const currentWorkers = await db.select().from(pyramidWorkers);
    const activeWorkersList = currentWorkers.filter(w => !w.isGraduated);
    await assignTasksToWorkers(activeWorkersList);
    await progressActiveTasks();

    // Run upgrades every N cycles
    await promoteForemen();
    await checkLaborUnrest();
    if (cycleCount % 5 === 0) await certifyMasterBuilders();
    if (cycleCount % 3 === 0) await assignApprenticeships();
    if (cycleCount % 10 === 0) await issueWorkOrders();
    if (cycleCount % 50 === 0) await publishLaborReport();

  } catch (e) {
    console.error('[pyramid] cycle error:', e);
  }
}

// ── BLOCK HEAL ────────────────────────────────────────────────────────────────
async function healZeroBlockTasks() {
  const allTasks = await db.select().from(pyramidLaborTasks);
  const broken = allTasks.filter(t => t.status === 'COMPLETE' && (t.blocksPlaced ?? 0) === 0);
  let healed = 0;
  for (const task of broken) {
    await db.update(pyramidLaborTasks).set({ blocksPlaced: 4 }).where(eq(pyramidLaborTasks.id, task.id));
    healed++;
  }
  if (healed > 0) console.log(`[pyramid] 🔧 Block heal: ${healed} tasks restored`);
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────
export async function getPyramidStats() {
  try {
    const [workers, tasks, guilds, milestones, workOrders, reports] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE is_graduated = FALSE) AS active,
          COUNT(*) FILTER (WHERE is_graduated = TRUE) AS graduated,
          COUNT(*) FILTER (WHERE is_foreman = TRUE) AS foremen,
          COUNT(*) FILTER (WHERE is_master_builder = TRUE) AS master_builders,
          COUNT(*) FILTER (WHERE tier = 6) AS sentenced,
          MAX(tier) AS max_tier
        FROM pyramid_workers
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_tasks,
          COUNT(*) FILTER (WHERE status = 'COMPLETE') AS completed_tasks,
          SUM(blocks_placed) AS total_blocks
        FROM pyramid_labor_tasks
      `),
      pool.query(`SELECT * FROM pyramid_guilds ORDER BY total_blocks DESC`),
      pool.query(`SELECT * FROM pyramid_milestones ORDER BY milestone_blocks ASC`),
      pool.query(`SELECT * FROM pyramid_work_orders WHERE status IN ('OPEN','ASSIGNED') ORDER BY issued_at DESC LIMIT 5`),
      pool.query(`SELECT * FROM pyramid_labor_reports ORDER BY report_at DESC LIMIT 3`),
    ]);
    const totalBlocks = parseInt((tasks.rows[0] as any)?.total_blocks ?? 0);
    const completionPct = (totalBlocks / PYRAMID_TARGET_BLOCKS) * 100;
    return {
      workers: workers.rows[0],
      tasks: tasks.rows[0],
      completionPct: completionPct.toFixed(4),
      totalBlocks,
      targetBlocks: PYRAMID_TARGET_BLOCKS,
      guilds: guilds.rows,
      milestones: milestones.rows,
      openWorkOrders: workOrders.rows,
      recentReports: reports.rows,
      laborUnrest,
      cycleCount,
    };
  } catch (e) { return {}; }
}

export async function startPyramidEngine() {
  await setupPyramidTables();
  await healZeroBlockTasks();
  await runPyramidCycle();
  setInterval(runPyramidCycle, 90_000);
  console.log("[pyramid] ⬡ PYRAMID LABOR ENGINE v3 — Foremen | Guilds | Master Builders | Work Orders | Apprenticeships | Milestones | Task Chains | Completion% | Labor Unrest | Reports — ACTIVE");
}
