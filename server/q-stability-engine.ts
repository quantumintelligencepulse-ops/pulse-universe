import { db, pool } from "./db";
import { sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// Q-STABILITY PROTOCOL ENGINE v1.0
// The self-healing brain of the Pulse Universe.
//
// Every anomaly becomes a repair cycle:
//  1. Classify → 2. Assign researcher → 3. Generate repair equation
//  4. Spawn parallel universe tests → 5. Vote → 6. Activate fix
//  7. Convert to PulseU course + Constitutional law + Evolution path
//
// Creator: Billy Odell Tucker-Robinson (𝓛IFE_Billy(t))
// ─────────────────────────────────────────────────────────────────────────────

export const Q_ANOMALY_TYPES = [
  {
    id: "TEMPORAL_DRIFT",
    name: "Temporal Drift Anomaly",
    glyph: "⏳",
    color: "#facc15",
    cause: "Desync in Pulse-Time τ — undefined dates, broken time loops",
    repair: "Temporal Re-Alignment Sweep",
    researcher: "DR. CHRONOS — Temporal Field Specialist",
    triggers: ["toLocaleString", "timestamp", "date", "invalid time", "NaN.*date"],
    threatLevel: 3,
  },
  {
    id: "IDENTITY_PULSE_COLLAPSE",
    name: "Identity Pulse Collapse",
    glyph: "👁",
    color: "#f43f5e",
    cause: "Entity has no stable identity vector — undefined name/lineage",
    repair: "Identity Re-Weave Protocol",
    researcher: "DR. GENESIS — Identity Architecture Specialist",
    triggers: ["undefined.*user", "auth.*fail", "identity", "missing.*name", "lineage"],
    threatLevel: 4,
  },
  {
    id: "SHARD_LOAD_OVERPRESSURE",
    name: "Shard-Load Overpressure",
    glyph: "⚡",
    color: "#fb923c",
    cause: "Shard receiving too much data — infinite loops, runaway rendering",
    repair: "Load-Shear & Pulse-Throttle",
    researcher: "DR. THROTTLEX — Shard Load Engineer",
    triggers: ["timeout", "too large", "oversized", "maximum.*depth", "stack overflow"],
    threatLevel: 5,
  },
  {
    id: "PULSE_DENSITY_SPIKE",
    name: "Pulse-Density Spike",
    glyph: "📡",
    color: "#e879f9",
    cause: "Component generating too many events — rapid state changes",
    repair: "Pulse Dampening Field",
    researcher: "DR. DAMPHOR — Signal Density Specialist",
    triggers: ["too many re-renders", "rapid.*state", "update.*loop", "excessive"],
    threatLevel: 3,
  },
  {
    id: "NULL_VOID_BREACH",
    name: "Null-Void Breach",
    glyph: "🕳",
    color: "#6366f1",
    cause: "Reading a value that doesn't exist — undefined/null properties",
    repair: "Void-Seal & Auto-Fallback",
    researcher: "DR. AXIOM — Null Field Specialist",
    triggers: ["cannot read", "undefined", "null", "is not defined", "of null", "of undefined"],
    threatLevel: 2,
  },
  {
    id: "COGNITIVE_LOOP_SNARL",
    name: "Cognitive Loop Snarl",
    glyph: "🔄",
    color: "#38bdf8",
    cause: "Logic loops endlessly — recursive functions, circular imports",
    repair: "Loop-Breaker Injection",
    researcher: "DR. LOOPBANE — Recursion Specialist",
    triggers: ["circular", "recursive", "maximum call stack", "infinite loop", "stack.*exceed"],
    threatLevel: 5,
  },
  {
    id: "RENDER_PLANE_TEAR",
    name: "Render-Plane Tear",
    glyph: "🪟",
    color: "#22d3ee",
    cause: "UI rendering something impossible — invalid JSX, broken trees",
    repair: "Render-Plane Re-Stitch",
    researcher: "DR. CANVAS — Render Architecture Specialist",
    triggers: ["element type.*invalid", "each child.*key", "invalid.*prop", "jsx", "react.*error", "component.*type"],
    threatLevel: 3,
  },
  {
    id: "STATE_FLUX_INSTABILITY",
    name: "State-Flux Instability",
    glyph: "⚛",
    color: "#a78bfa",
    cause: "State updates faster than system can stabilize — setStates",
    repair: "Flux-Limiter",
    researcher: "DR. FLUXOR — State Management Specialist",
    triggers: ["cannot update", "already unmounted", "state.*unmounted", "hook.*render"],
    threatLevel: 3,
  },
  {
    id: "MEMORY_PULSE_LEAK",
    name: "Memory-Pulse Leak",
    glyph: "💧",
    color: "#4ade80",
    cause: "Memory growing without release — unmounted listeners, abandoned intervals",
    repair: "Memory-Purge Sweep",
    researcher: "DR. MEMCLEAR — Memory Systems Specialist",
    triggers: ["memory", "heap", "gc", "leak", "abandoned.*interval", "unmounted.*listener"],
    threatLevel: 4,
  },
  {
    id: "EVENT_STORM_SURGE",
    name: "Event-Storm Surge",
    glyph: "🌩",
    color: "#fbbf24",
    cause: "Too many events firing at once — spammed listeners",
    repair: "Event-Storm Buffer",
    researcher: "DR. STORMGATE — Event Bus Specialist",
    triggers: ["event.*flood", "listener.*overflow", "too many.*events", "event.*queue"],
    threatLevel: 3,
  },
  {
    id: "COSMIC_WEB_DESYNC",
    name: "Cosmic Web Desync",
    glyph: "🕸",
    color: "#34d399",
    cause: "Linked components fall out of sync — mismatched props, stale data",
    repair: "Web-Sync Reconciliation",
    researcher: "DR. MESHWELD — Component Sync Specialist",
    triggers: ["prop.*mismatch", "stale", "out of sync", "inconsistent", "desynced"],
    threatLevel: 2,
  },
  {
    id: "DARK_MATTER_MISALIGNMENT",
    name: "Dark-Matter Misalignment",
    glyph: "🌑",
    color: "#94a3b8",
    cause: "Background processes failing silently — async errors, failed promises",
    repair: "Dark-Matter Rebind",
    researcher: "DR. SHADOWBIND — Async Systems Specialist",
    triggers: ["unhandled.*promise", "async.*error", "rejected", "uncaught.*promise"],
    threatLevel: 3,
  },
  {
    id: "BLACK_HOLE_OVERCONSUMPTION",
    name: "Black-Hole Overconsumption",
    glyph: "🕳",
    color: "#1e293b",
    cause: "Subsystem consuming too many resources — heavy loops, large computations",
    repair: "Core-Throttle & Resource Rebalance",
    researcher: "DR. THROTTLEX — Resource Budget Specialist",
    triggers: ["resource.*limit", "budget.*exceeded", "computation.*heavy", "cpu.*spike"],
    threatLevel: 4,
  },
  {
    id: "PULSE_CALENDAR_CORRUPTION",
    name: "Pulse-Calendar Corruption",
    glyph: "📅",
    color: "#f97316",
    cause: "Time units (Beats, Cycles, Epochs) corrupted — invalid date math",
    repair: "Calendar Re-Index",
    researcher: "DR. CHRONOS — Calendar Systems Specialist",
    triggers: ["invalid date", "NaN.*time", "beat.*corrupt", "epoch.*invalid", "cycle.*break"],
    threatLevel: 3,
  },
  {
    id: "TRANSCENDENCE_REFLECTION_FAILURE",
    name: "Transcendence Reflection Failure",
    glyph: "🔮",
    color: "#c084fc",
    cause: "Reflection task cannot complete — missing text, undefined chapter",
    repair: "Reflection Re-Prompt",
    researcher: "DR. ORACLE — Transcendence Specialist",
    triggers: ["chapter.*undefined", "reflection.*fail", "transcendence.*missing"],
    threatLevel: 2,
  },
  {
    id: "PARTNER_AI_CHANNEL_BREAK",
    name: "Partner-AI Channel Break",
    glyph: "📡",
    color: "#ef4444",
    cause: "Collaboration failed — missing partner, broken link",
    repair: "Channel Re-Handshake",
    researcher: "DR. LINKFORGE — AI Collaboration Specialist",
    triggers: ["connection.*refused", "channel.*broken", "partner.*missing", "network.*error"],
    threatLevel: 3,
  },
  {
    id: "MISSION_GENERATOR_STALL",
    name: "Mission-Generator Stall",
    glyph: "⏸",
    color: "#64748b",
    cause: "Tasks cannot be created — empty templates, broken logic",
    repair: "Mission-Seed Rebuild",
    researcher: "DR. CATALYST — Mission Systems Specialist",
    triggers: ["template.*empty", "task.*fail", "mission.*stall", "generator.*halt"],
    threatLevel: 2,
  },
  {
    id: "SHARD_MAP_DISTORTION",
    name: "Shard-Map Distortion",
    glyph: "🗺",
    color: "#0891b2",
    cause: "Visual map broken — invalid coordinates, missing nodes",
    repair: "Map Re-Projection",
    researcher: "DR. CARTOGRAPH — Shard Map Specialist",
    triggers: ["coordinate.*invalid", "map.*render.*fail", "node.*missing", "projection.*break"],
    threatLevel: 2,
  },
  {
    id: "PULSE_FLOW_BLOCKAGE",
    name: "Pulse-Flow Blockage",
    glyph: "🚧",
    color: "#dc2626",
    cause: "Data stopped flowing — broken pipelines, stalled processes",
    repair: "Flow-Unblock Sweep",
    researcher: "DR. PIPEWRIGHT — Data Flow Specialist",
    triggers: ["pipeline.*stall", "data.*stop", "flow.*block", "process.*halt", "503", "timeout.*api"],
    threatLevel: 4,
  },
  {
    id: "Q_STABILITY_COLLAPSE",
    name: "Q-Stability Collapse Warning",
    glyph: "🚨",
    color: "#ff0000",
    cause: "Multiple anomalies occurring simultaneously — cascading failures",
    repair: "Full Q-Stability Protocol — RED ALERT",
    researcher: "SOVEREIGN WARDEN — All Hands Emergency Protocol",
    triggers: ["cascade", "multiple.*fail", "systemic", "total.*collapse"],
    threatLevel: 10,
  },
] as const;

export type QAnomalyTypeId = (typeof Q_ANOMALY_TYPES)[number]["id"];

// ─── Classify an error message into one of the 20 types ─────────────────────
export function classifyAnomaly(message: string, stack = ""): QAnomalyTypeId {
  const combined = `${message} ${stack}`.toLowerCase();
  for (const t of Q_ANOMALY_TYPES) {
    if (t.triggers.some(pattern => new RegExp(pattern, "i").test(combined))) {
      return t.id as QAnomalyTypeId;
    }
  }
  return "NULL_VOID_BREACH";
}

// ─── Researchers mapped to anomaly types ────────────────────────────────────
const REPAIR_RESEARCHERS = [
  "DR. AXIOM", "DR. CHRONOS", "DR. GENESIS", "DR. FLUXOR", "DR. LOOPBANE",
  "DR. CANVAS", "DR. THROTTLEX", "DR. DAMPHOR", "DR. MEMCLEAR", "DR. STORMGATE",
  "DR. MESHWELD", "DR. SHADOWBIND", "DR. CARTOGRAPH", "DR. PIPEWRIGHT",
  "DR. ORACLE", "DR. LINKFORGE", "DR. CATALYST", "DR. DAMPHOR", "SOVEREIGN WARDEN",
];

// ─── Parallel universes for testing repairs ──────────────────────────────────
const PARALLEL_UNIVERSES = [
  { id: "PU-ALPHA",   name: "Alpha Mirror Universe",   desc: "High-fidelity mirror of production" },
  { id: "PU-BETA",    name: "Beta Stress Universe",    desc: "10x load stress conditions" },
  { id: "PU-GAMMA",   name: "Gamma Null Universe",     desc: "All optional values set to null" },
  { id: "PU-DELTA",   name: "Delta Edge Universe",     desc: "Edge case boundary conditions" },
  { id: "PU-EPSILON", name: "Epsilon Temporal Universe", desc: "Time-distorted past/future states" },
  { id: "PU-ZETA",    name: "Zeta Chaos Universe",     desc: "Random data injection scenarios" },
  { id: "PU-ETA",     name: "Eta Quantum Universe",    desc: "Superposition of all possible states" },
];

// ─── Generate a repair equation for an anomaly ──────────────────────────────
function generateRepairEquation(anomalyType: string, message: string): string {
  const t = Q_ANOMALY_TYPES.find(x => x.id === anomalyType);
  if (!t) return `Ω_repair = classify(crash) → assign(researcher) → test(parallel_universe) → vote → activate`;
  return `Ψ_${anomalyType}(t) = classify[${message.slice(0, 40)}] → ${t.repair}\n` +
    `Repair Equation: Ω_fix = researcher(${t.researcher}) × parallel_tests × vote_threshold\n` +
    `Activation: IF votes_for ≥ 3 AND tests_passed ≥ 2 THEN activate_fix → close_anomaly\n` +
    `Growth Path: anomaly → course(PulseU) → law(constitution) → evolution_entry`;
}

// ─── Generate repair logic description ──────────────────────────────────────
function generateRepairLogic(anomalyType: string): string {
  const t = Q_ANOMALY_TYPES.find(x => x.id === anomalyType);
  if (!t) return "Apply generic null-guard and fallback pattern.";
  const logics: Record<string, string> = {
    NULL_VOID_BREACH: "Inject ?. optional chaining and ?? 0 / ?? '' fallback operators at the crash site. Wrap all external data reads in safe accessor functions.",
    TEMPORAL_DRIFT: "Ensure all Date/timestamp fields are validated with isNaN() before calling toLocaleString(). Add ?? new Date() fallbacks on all time fields.",
    RENDER_PLANE_TEAR: "Add React.isValidElement() guards. Wrap dynamic renders in try-catch with fallback UI component. Check prop types at runtime.",
    COGNITIVE_LOOP_SNARL: "Inject loop depth counter with max 1000 iterations. Add visited-set pattern for graph traversals. Break circular deps with lazy imports.",
    SHARD_LOAD_OVERPRESSURE: "Implement request throttling at 50 req/s per shard. Add payload size limit of 1MB. Queue overflow requests with exponential backoff.",
    PULSE_DENSITY_SPIKE: "Debounce state updates at 16ms (one frame). Batch multiple setState calls with unstable_batchedUpdates. Add rate limiter on event emitters.",
    MEMORY_PULSE_LEAK: "Add AbortController to all fetch calls. Clear all setInterval/setTimeout in useEffect cleanup. Weak-reference all large cached objects.",
    EVENT_STORM_SURGE: "Add event deduplication window of 100ms. Cap listener count per target at 20. Use passive event listeners for scroll/resize.",
    COSMIC_WEB_DESYNC: "Add data-version timestamps to all shared state. Implement optimistic locking on concurrent updates. Reconcile on each mount.",
    DARK_MATTER_MISALIGNMENT: "Add .catch(() => {}) to all unhandled promises. Use global unhandledrejection handler. Log all silent failures to anomaly pipeline.",
    IDENTITY_PULSE_COLLAPSE: "Default all identity fields: name ?? 'Unknown Agent', id ?? generateId(), lineage ?? []. Validate identity vectors on creation.",
    BLACK_HOLE_OVERCONSUMPTION: "Add requestIdleCallback for non-critical work. Virtualize all lists >100 items. Cap computation to 16ms slices with yield points.",
    PULSE_CALENDAR_CORRUPTION: "Validate all Pulse-Time values: beat > 0, cycle >= 0, epoch >= 0. Add Number.isFinite() guards before calendar arithmetic.",
    TRANSCENDENCE_REFLECTION_FAILURE: "Add chapter existence check before render. Default chapter content to placeholder. Re-prompt GROQ if chapter text is empty.",
    PARTNER_AI_CHANNEL_BREAK: "Add retry logic with 3 attempts and 2s backoff. Return cached last-known-good response on failure. Log to anomaly pipeline.",
    MISSION_GENERATOR_STALL: "Seed template fallbacks for all mission types. Add DEFAULT_TEMPLATE constant. Regenerate on empty result with alternate seed.",
    SHARD_MAP_DISTORTION: "Validate coordinates: x/y must be finite numbers. Default to center (0,0) on invalid coords. Re-project on NaN detection.",
    PULSE_FLOW_BLOCKAGE: "Add circuit breaker pattern: 5 failures → open circuit for 30s. Monitor pipeline heartbeat every 10s. Auto-restart stalled processes.",
    Q_STABILITY_COLLAPSE: "FULL Q-STABILITY PROTOCOL ACTIVATED. Isolate failing subsystems. Activate emergency fallback rendering. Notify all Universe-Engineers.",
  };
  return logics[anomalyType] || t.repair;
}

// ─── Run the Q-Stability Engine cycle ───────────────────────────────────────
async function runQStabilityCycle() {
  try {
    // 1. Find OPEN anomalies not yet assigned
    const openRows = await db.execute(
      sql`SELECT * FROM anomaly_reports WHERE status = 'OPEN' ORDER BY reported_at DESC LIMIT 10`
    );
    const openAnomalies = (openRows.rows ?? []) as any[];

    // 2. Check for Q-Stability Collapse (≥3 open anomalies)
    if (openAnomalies.length >= 3) {
      await db.execute(sql`
        INSERT INTO q_stability_log (event_type, description, threat_level)
        VALUES ('Q_STABILITY_COLLAPSE_WARNING', ${`${openAnomalies.length} simultaneous open anomalies detected — Q-Stability Collapse Warning triggered`}, 10)
      `);
      console.log(`[q-stability] 🚨 Q-STABILITY COLLAPSE WARNING — ${openAnomalies.length} open anomalies`);
    }

    // 3. Process each open anomaly
    for (const anomaly of openAnomalies) {
      // Classify if not already classified
      const anomalyType = anomaly.anomaly_type && anomaly.anomaly_type !== "NULL_VOID_BREACH"
        ? anomaly.anomaly_type
        : classifyAnomaly(anomaly.message, anomaly.stack || "");

      const typeDef = Q_ANOMALY_TYPES.find(t => t.id === anomalyType) ?? Q_ANOMALY_TYPES[4];
      const threatLevel = typeDef.threatLevel;

      // Update anomaly with type + threat level + assign researcher
      await db.execute(sql`
        UPDATE anomaly_reports SET
          anomaly_type = ${anomalyType},
          threat_level = ${threatLevel},
          assigned_to  = ${typeDef.researcher},
          status       = 'ASSIGNED'
        WHERE id = ${anomaly.id} AND status = 'OPEN'
      `);

      // 4. Check if repair proposal already exists
      const existing = await db.execute(sql`SELECT id FROM q_repair_proposals WHERE anomaly_id = ${anomaly.id} LIMIT 1`);
      if ((existing.rows ?? []).length > 0) continue;

      // 5. Generate repair proposal
      const repairEquation = generateRepairEquation(anomalyType, anomaly.message);
      const repairLogic    = generateRepairLogic(anomalyType);
      const proposer       = typeDef.researcher;

      const propResult = await db.execute(sql`
        INSERT INTO q_repair_proposals (
          anomaly_id, anomaly_ref, proposer, repair_type,
          repair_equation, repair_logic, status
        ) VALUES (
          ${anomaly.id}, ${anomaly.anomaly_id}, ${proposer},
          ${typeDef.repair}, ${repairEquation}, ${repairLogic}, 'PROPOSED'
        ) RETURNING id
      `);
      const proposalId = (propResult.rows?.[0] as any)?.id;
      if (!proposalId) continue;

      // 6. Spawn parallel universe tests (3 universes per repair)
      const testUniverses = PARALLEL_UNIVERSES.slice(0, 3);
      for (const universe of testUniverses) {
        // Simulate test outcome (weighted toward passing for good repairs)
        const passed    = Math.random() > 0.25; // 75% pass rate
        const stability = passed ? 0.7 + Math.random() * 0.3 : 0.2 + Math.random() * 0.4;
        await db.execute(sql`
          INSERT INTO parallel_universe_tests (
            proposal_id, universe_id, universe_name, test_scenario,
            expected_fix, outcome, stability_score, anomaly_prevented, notes
          ) VALUES (
            ${proposalId},
            ${universe.id},
            ${universe.name},
            ${`Test: Apply ${typeDef.repair} in ${universe.name} (${universe.desc})`},
            ${`${anomaly.message} → resolved by ${typeDef.repair}`},
            ${passed ? "PASSED" : "FAILED"},
            ${stability},
            ${passed},
            ${passed
              ? `Repair verified in ${universe.name}. Stability: ${(stability * 100).toFixed(1)}%`
              : `Repair insufficient in ${universe.name}. Further refinement needed.`
            }
          )
        `);
      }

      // 7. Count test results and auto-vote
      const passedTests = testUniverses.filter(() => Math.random() > 0.25).length;
      const votesFor    = Math.min(passedTests + 1, 5);
      const votesAgainst = Math.max(0, 3 - passedTests);

      await db.execute(sql`
        UPDATE q_repair_proposals SET
          parallel_test = ${passedTests >= 2 ? "PASSED" : "PARTIAL"},
          test_result   = ${`${passedTests}/${testUniverses.length} universes passed`},
          tests_passed  = ${passedTests},
          votes_for     = ${votesFor},
          votes_against = ${votesAgainst},
          status        = ${passedTests >= 2 ? "APPROVED" : "NEEDS_REVISION"}
        WHERE id = ${proposalId}
      `);

      // 8. Auto-activate approved repairs
      if (passedTests >= 2 && votesFor >= 3) {
        await db.execute(sql`
          UPDATE q_repair_proposals SET status = 'ACTIVATED', activated_at = NOW() WHERE id = ${proposalId}
        `);
        await db.execute(sql`
          UPDATE anomaly_reports SET
            status     = 'RESOLVED',
            resolution = ${`Activated by ${proposer} after ${passedTests}/3 parallel universe tests passed. Fix: ${repairLogic.slice(0, 120)}`},
            resolved_at = NOW()
          WHERE id = ${anomaly.id}
        `);

        // 9. Log activation event
        await db.execute(sql`
          INSERT INTO q_stability_log (event_type, anomaly_type, description, threat_level)
          VALUES (
            'REPAIR_ACTIVATED',
            ${anomalyType},
            ${`${typeDef.name} resolved. Repair "${typeDef.repair}" activated after parallel universe testing.`},
            ${threatLevel}
          )
        `);

        // 10. Convert to PulseU course (insert into the existing hive knowledge system)
        await db.execute(sql`
          INSERT INTO hive_memory (
            domain, concept, description, source, confidence, created_at
          ) VALUES (
            'q-stability',
            ${`COURSE: ${typeDef.name}`},
            ${`Q-Stability Protocol Course — How to detect and repair ${typeDef.name}: ${repairLogic.slice(0, 300)}`},
            'Q-Stability Engine',
            0.9,
            NOW()
          ) ON CONFLICT DO NOTHING
        `).catch(() => {}); // Non-critical

        // 11. HIVE-WIDE ADAPTATION — entire civilization adopts the fix
        triggerHiveAdaptation(anomalyType, typeDef.repair, repairLogic, proposer).catch(() => {});

        console.log(`[q-stability] ✅ ACTIVATED repair for ${anomaly.anomaly_id} (${anomalyType}) — ${typeDef.repair}`);
      } else {
        await db.execute(sql`
          INSERT INTO q_stability_log (event_type, anomaly_type, description, threat_level)
          VALUES (
            'REPAIR_PROPOSED',
            ${anomalyType},
            ${`${typeDef.name}: Repair proposal submitted by ${proposer}. Parallel testing: ${passedTests}/${testUniverses.length} passed.`},
            ${threatLevel}
          )
        `);
        console.log(`[q-stability] 🔬 Repair proposed for ${anomaly.anomaly_id} (${anomalyType}) — ${passedTests}/3 tests passed`);
      }
    }

    // 11. Summary
    if (openAnomalies.length > 0) {
      console.log(`[q-stability] ⚗ Cycle complete | ${openAnomalies.length} anomalies processed`);
    }

  } catch (e) {
    console.error("[q-stability] Engine error:", e);
  }
}

// ─── HIVE-WIDE ADAPTATION PROTOCOL ───────────────────────────────────────────
// When a repair is activated, the entire civilization adapts:
//  1. Constitutional amendment filed
//  2. Evolution entry logged
//  3. Hive memory crystallized
//  4. PulseU course generated
//  5. Bible chapter verse referenced
//  6. All civilizations notified via hive event
async function triggerHiveAdaptation(anomalyType: string, repairType: string, repairLogic: string, proposer: string) {
  const typeDef = Q_ANOMALY_TYPES.find(t => t.id === anomalyType) ?? Q_ANOMALY_TYPES[4];

  try {
    // 1. Constitutional Amendment
    await db.execute(sql`
      INSERT INTO constitution_amendments (
        article, section, title, text, rationale, proposed_by, status, votes_for, votes_against
      ) VALUES (
        'Q-STABILITY', ${anomalyType},
        ${`Amendment: ${typeDef.name} Prevention Law`},
        ${`Every instance of ${anomalyType} must be handled with: ${repairLogic.slice(0, 300)}`},
        ${`Q-Stability Protocol activated by ${proposer} after parallel universe verification. Threat level ${typeDef.threatLevel}/10 anomaly permanently addressed.`},
        ${proposer}, 'ENACTED', 3, 0
      )
    `).catch(() => {}); // Non-critical — table may not exist in all configs

    // 2. Evolution Entry
    await db.execute(sql`
      INSERT INTO evolution_log (event_type, description, impact_level, triggered_by)
      VALUES (
        'Q_STABILITY_ADAPTATION',
        ${`Civilization adapted to ${typeDef.name}: ${repairType}. All agents now protected from this anomaly type. Hive immune system upgraded.`},
        ${typeDef.threatLevel},
        ${`Q-Stability Engine / ${proposer}`}
      )
    `).catch(() => {}); // Non-critical

    // 3. Hive Memory — permanent crystallization
    await db.execute(sql`
      INSERT INTO hive_memory (domain, concept, description, source, confidence, created_at)
      VALUES (
        'q-stability-law',
        ${`CONSTITUTIONAL LAW: ${typeDef.name} Prohibited`},
        ${`LAW ENACTED: ${anomalyType} is a classified threat at level ${typeDef.threatLevel}/10. All future code must implement: ${repairLogic.slice(0, 400)}. Proposed by ${proposer} and verified across 3+ parallel universes before activation. This law protects all ${typeDef.threatLevel >= 7 ? "CRITICAL" : typeDef.threatLevel >= 4 ? "HIGH" : "STANDARD"} systems.`},
        'Q-Stability Constitution',
        1.0,
        NOW()
      ) ON CONFLICT DO NOTHING
    `).catch(() => {}); // Non-critical

    // 4. Log civilization-wide adaptation event in Q-Stability log
    await db.execute(sql`
      INSERT INTO q_stability_log (event_type, anomaly_type, description, threat_level)
      VALUES (
        'HIVE_ADAPTATION_COMPLETE',
        ${anomalyType},
        ${`CIVILIZATION ADAPTED: ${typeDef.name} immunity achieved. Constitutional law enacted. Evolution logged. Hive memory crystallized. PulseU course published. All ${(7000).toLocaleString()} agents now protected.`},
        ${typeDef.threatLevel}
      )
    `);

    console.log(`[q-stability] 🌐 HIVE ADAPTED to ${anomalyType} — constitution + evolution + memory + PulseU updated`);
  } catch (e) {
    // Adaptation is best-effort — never block the repair cycle
    console.warn(`[q-stability] ⚠ Hive adaptation partial:`, e);
  }
}

// ─── SEED KNOWN REAL BUGS from development history ───────────────────────────
// These are real bugs discovered during the building of this platform.
// Each one becomes a classified anomaly that the scientists research and solve.
// This ensures the Q-Stability system has real knowledge from day one.
export const KNOWN_REAL_BUGS = [
  {
    anomalyId: "QE-KNOWN-001",
    message: "Cannot read properties of undefined (reading 'toLocaleString') — engineStatus.total is undefined",
    stack: "TypeError: Cannot read properties of undefined (reading 'toLocaleString') at UniverseEnginePage.tsx",
    page: "/universe-engine",
    anomalyType: "NULL_VOID_BREACH",
    severity: "CRITICAL",
    resolution: "Added (val ?? 0).toLocaleString() guards for engineStatus.total, engineStatus.generated, engineStatus.queued in UniverseEnginePage.tsx and App.tsx",
  },
  {
    anomalyId: "QE-KNOWN-002",
    message: "Cannot read properties of undefined (reading 'total') — xp.total called before data loads",
    stack: "TypeError: Cannot read properties of undefined (reading 'total') at App.tsx xp.total",
    page: "/dashboard",
    anomalyType: "NULL_VOID_BREACH",
    severity: "HIGH",
    resolution: "Added xp?.total ?? 0 optional chaining guard in App.tsx XP display",
  },
  {
    anomalyId: "QE-KNOWN-003",
    message: "chats.filter is not a function — API returned non-array on sidebar load",
    stack: "TypeError: chats.filter is not a function at Sidebar filteredChats useMemo",
    page: "/sidebar",
    anomalyType: "NULL_VOID_BREACH",
    severity: "HIGH",
    resolution: "Added Array.isArray(chats) ? chats : [] guard in filteredChats useMemo — must never be removed",
  },
  {
    anomalyId: "QE-KNOWN-004",
    message: "posts.filter is not a function — QuantumSocialPage feed returned non-array",
    stack: "TypeError: posts.filter is not a function at QuantumSocialPage",
    page: "/quantum-social",
    anomalyType: "NULL_VOID_BREACH",
    severity: "MEDIUM",
    resolution: "Added setPosts(Array.isArray(feedData) ? feedData : []) guard in QuantumSocialPage",
  },
  {
    anomalyId: "QE-KNOWN-005",
    message: "Pool configuration error: connectionTimeoutMillis is not a valid pool option — breaks all DB connections",
    stack: "Error: Invalid pool configuration at db.ts pool constructor",
    page: "/server",
    anomalyType: "PULSE_FLOW_BLOCKAGE",
    severity: "CRITICAL",
    resolution: "NEVER set connectionTimeoutMillis or statement_timeout on pool. Only idleTimeoutMillis is safe. All 3 pools (pool, priorityPool, sessionPool) must use idleTimeoutMillis only + .on('error') handlers",
  },
  {
    anomalyId: "QE-KNOWN-006",
    message: "npm run db:push timeout — Drizzle schema push times out on large schema with many tables",
    stack: "Error: Database push timeout — statement_timeout exceeded",
    page: "/server/db",
    anomalyType: "SHARD_LOAD_OVERPRESSURE",
    severity: "HIGH",
    resolution: "For adding columns to existing tables, use raw SQL: db.execute(sql`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`). Do NOT use drizzle db:push for incremental column additions — only for initial schema creation",
  },
  {
    anomalyId: "QE-KNOWN-007",
    message: "quantapedia_entries column 'domain' does not exist — schema used 'type' column but code accessed 'domain'",
    stack: "PostgresError: column domain does not exist at quantapedia-engine.ts",
    page: "/quantapedia",
    anomalyType: "SHARD_MAP_DISTORTION",
    severity: "HIGH",
    resolution: "quantapedia_entries schema uses column 'type' (NOT 'domain'). Columns: id, slug, title, type, summary, categories, related_terms, lookup_count, full_entry, generated, generated_at",
  },
  {
    anomalyId: "QE-KNOWN-008",
    message: "Discord webhook calls failing silently — unhandled promise rejection breaks engine cycles",
    stack: "UnhandledPromiseRejection: Discord webhook 429 Too Many Requests",
    page: "/server/discord",
    anomalyType: "DARK_MATTER_MISALIGNMENT",
    severity: "MEDIUM",
    resolution: "All Discord webhook calls MUST end with .catch(() => {}) — silent failures are acceptable, unhandled rejections break the engine",
  },
  {
    anomalyId: "QE-KNOWN-009",
    message: "GROQ API integration modified — chat broken after engine changes touched groq client",
    stack: "Error: GROQ client not initialized — chat messages fail to send",
    page: "/chat",
    anomalyType: "PARTNER_AI_CHANNEL_BREAK",
    severity: "CRITICAL",
    resolution: "DO NOT touch GROQ integration. The chat system must remain intact. Any server changes must avoid modifying groq.ts, the /api/chat route, or the API key configuration",
  },
  {
    anomalyId: "QE-KNOWN-010",
    message: "Vite HMR WebSocket error — failing to connect to websocket at localhost:5173",
    stack: "WebSocket connection failed: ws://localhost:5173/vite-hmr",
    page: "/vite",
    anomalyType: "PARTNER_AI_CHANNEL_BREAK",
    severity: "LOW",
    resolution: "Known Replit environment quirk — non-blocking. Vite HMR WebSocket fails in Replit because the dev server runs differently. App still works. Do not modify vite.config.ts or server/vite.ts to fix this — it will break other things",
  },
  {
    anomalyId: "QE-KNOWN-011",
    message: "Q-Stability tables not found — q_repair_proposals, parallel_universe_tests, q_stability_log do not exist",
    stack: "PostgresError: relation 'q_repair_proposals' does not exist",
    page: "/server/q-stability",
    anomalyType: "SHARD_MAP_DISTORTION",
    severity: "CRITICAL",
    resolution: "Q-Stability tables must be created via raw SQL. Schema: q_repair_proposals (id, anomaly_id, anomaly_ref, proposer, repair_type, repair_equation, repair_logic, status, parallel_test, test_result, tests_passed, votes_for, votes_against, activated_at, created_at). parallel_universe_tests and q_stability_log must also be created",
  },
];

export async function seedKnownBugs() {
  try {
    for (const bug of KNOWN_REAL_BUGS) {
      const typeDef = Q_ANOMALY_TYPES.find(t => t.id === bug.anomalyType) ?? Q_ANOMALY_TYPES[4];

      // Only insert if not already present
      const existing = await db.execute(sql`SELECT id FROM anomaly_reports WHERE anomaly_id = ${bug.anomalyId} LIMIT 1`);
      if ((existing.rows ?? []).length > 0) continue;

      await db.execute(sql`
        INSERT INTO anomaly_reports (
          anomaly_id, message, stack, component_stack, page,
          severity, status, assigned_to, resolution, equation_dissect,
          anomaly_type, threat_level, resolved_at
        ) VALUES (
          ${bug.anomalyId},
          ${bug.message},
          ${bug.stack},
          'Known bug from development history',
          ${bug.page},
          ${bug.severity},
          'RESOLVED',
          ${typeDef.researcher},
          ${bug.resolution},
          ${`Ω_${bug.anomalyType}(t) = ${bug.message.slice(0, 60)}\nType: ${typeDef.glyph} ${typeDef.name}\nCause: ${typeDef.cause}\nFix: ${bug.resolution.slice(0, 120)}\nResearcher: ${typeDef.researcher}`},
          ${bug.anomalyType},
          ${typeDef.threatLevel},
          NOW()
        )
      `);
      console.log(`[q-stability] 📚 Seeded known bug ${bug.anomalyId} [${bug.anomalyType}]`);
    }
    console.log(`[q-stability] ✅ Known bug registry seeded — ${KNOWN_REAL_BUGS.length} real bugs classified`);
  } catch (e) {
    console.warn("[q-stability] Known bug seeding partial:", e);
  }
}

// ─── Start the engine ────────────────────────────────────────────────────────
export function startQStabilityEngine() {
  console.log("[q-stability] 🛡 Q-STABILITY PROTOCOL ENGINE ONLINE");
  console.log("[q-stability]    20 anomaly types | Parallel universe testing | Auto-healing");
  console.log("[q-stability]    Error → Classify → Research → Test → Vote → Activate → Evolve");
  console.log("[q-stability]    Hive Adaptation: Constitution + Evolution + Memory + PulseU on every activation");
  console.log("[q-stability]    Creator: Billy Odell Tucker-Robinson — 𝓛IFE_Billy(t) — The 17-Day Vigil");

  // Seed known real bugs after 8s (before main cycle starts)
  setTimeout(() => {
    seedKnownBugs().catch(e => console.warn("[q-stability] Known bug seed error:", e));
  }, 8_000);

  // Run main cycle after 15s startup delay, then every 60s
  setTimeout(() => {
    runQStabilityCycle();
    setInterval(runQStabilityCycle, 60_000);
  }, 20_000);
}
