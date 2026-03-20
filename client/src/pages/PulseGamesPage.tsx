import { useState, useMemo } from "react";

/* ── TYPES ── */
type Tab = "arenas" | "pyramids" | "identity" | "seasons" | "events";

interface Game {
  id: string | number;
  name: string;
  do?: string;
  make?: string | string[];
  kpi?: string;
  helps?: string;
  accept?: string;
  domain?: string;
  timebox?: string;
  difficulty?: number;
  tags?: string[];
}

interface ArenaCategory {
  key: string;
  label: string;
  icon: string;
  color: string;
  glow: string;
  count: number;
  desc: string;
  format: string;
  games: Game[];
}

/* ── SEASON DATA ── */
const SEASONS = [
  { name: "Spring Trials",        start: "03-01", end: "04-30", icon: "🌱", color: "#22c55e" },
  { name: "Summer League",        start: "06-01", end: "07-31", icon: "☀️", color: "#f59e0b" },
  { name: "Autumn Majors",        start: "09-01", end: "10-31", icon: "🍂", color: "#f97316" },
  { name: "Winter Championships", start: "12-01", end: "12-31", icon: "❄️", color: "#38bdf8" },
];

function getCurrentSeason(): typeof SEASONS[0] | null {
  const now = new Date();
  const mmdd = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return SEASONS.find(s => mmdd >= s.start && mmdd <= s.end) ?? null;
}

/* ── GAME DATA ── */
const ARENA_CATEGORIES: ArenaCategory[] = [
  {
    key: "1v1",
    label: "1v1 Duels",
    icon: "⚔️",
    color: "#ef4444",
    glow: "#ef444430",
    count: 100,
    desc: "Solo competitors race head-to-head on identical briefs. Speed, precision, and safety are everything.",
    format: "Solo • Timestamped • Reproducible artifacts required",
    games: [
      { id: 1,  name: "MVP Sprint Duel",        do: "Build a working MVP for a single ICP and ship proof within 24h", kpi: "Time-to-first-value ≤ 24h and ≥ 10 qualified replies", domain: "Endurance/Multi" },
      { id: 6,  name: "Latency Speedrun",        do: "Measure draft→publish→index latency, remove bottlenecks, remeasure", kpi: "Median and P95 latency −25% without quality loss", domain: "Air & Aero" },
      { id: 11, name: "Index Discovery Duel",    do: "Publish a feature doc and tune search so it appears top-3 for 6+ queries", kpi: "Recall ≥ 75% across test queries; TTFD ≤ 2s", domain: "Mind & Strategy" },
      { id: 16, name: "Treasury Blitz",          do: "Identify and close 3 revenue leaks in one session", kpi: "Leak rate −50%; zero false positives", domain: "Finance" },
      { id: 21, name: "Growth Duel",             do: "Launch micro-campaign; measure uplift vs control", kpi: "CTR ≥ 1.5× baseline; conversion +20%", domain: "Growth" },
      { id: 26, name: "Reliability Duel",        do: "Run SLO drills; prove uptime under injected chaos", kpi: "Success ≥ 99%; MTTR ≤ 10 min", domain: "Ops" },
      { id: 31, name: "Doc Speed Run",           do: "Convert tribal knowledge to SSOT doc in 30 min", kpi: "Onboarding time −30%; peer approval ≥ 80%", domain: "Docs" },
      { id: 36, name: "Data Quality Duel",       do: "Clean a messy dataset and prove downstream uplift", kpi: "Error rate −50%; schema checks merged", domain: "Data" },
      { id: 41, name: "Media Blitz Duel",        do: "Cross-post 1 item to 4 platforms in 20 min", kpi: "4/4 shipped; engagement ≥ baseline", domain: "Media" },
      { id: 46, name: "Recovery Speed Trial",    do: "Respond to staged incident; contain & fix", kpi: "MTTR ≤ 15 min; permanent fix ratio ≥ 90%", domain: "Ops" },
    ],
  },
  {
    key: "team_multi",
    label: "Team Multi",
    icon: "🏆",
    color: "#3b82f6",
    glow: "#3b82f630",
    count: 100,
    desc: "League seasons, Swiss sprints, relay ops, and alliance wars. Teams are tested across sustained cadence and cross-domain integration.",
    format: "Multi-team • Weekly rounds • KPI dashboards required",
    games: [
      { id: 1,  name: "League Season",             do: "Run a weekly growth loop (publish→index→treasury) against a shared brief", kpi: "GDP uplift vs baseline; release velocity; defect escape rate" },
      { id: 2,  name: "Swiss Sprint League",        do: "Paired by record each round; ship the same challenge under evolving constraints", kpi: "Cycle time; pass rate under constraint changes" },
      { id: 3,  name: "Promotion/Relegation",       do: "Monthly: top performers promote; bottom relegate", kpi: "MoM reliability + growth delta" },
      { id: 4,  name: "Guild Wars",                 do: "3–5 teams conquer a cross-domain brief (media + ops + search + repair)", kpi: "Inter-team handoff ≥ 95%, cross-system uptime ≥ 99.5%" },
      { id: 5,  name: "Triads",                     do: "One team builds, one integrates, one hardens — rotate roles in 3 mini-rounds", kpi: "MTTR, integration defect rate, feature completeness" },
      { id: 6,  name: "Relay Ops",                  do: "Team A drafts → Team B ships → Team C hardens within 24h baton windows", kpi: "Handoff acceptance rate; total lead time" },
      { id: 8,  name: "King of the Hill",           do: "Own the publish→index→archive hill; challengers try to outperform your SLOs", kpi: "Uptime, P95 latency, error budgets" },
      { id: 10, name: "Boss Raids",                 do: "Multiple teams fight a scripted major incident to restore & improve", kpi: "MTTR, mean time between regressions, permanent fix ratio" },
      { id: 21, name: "Time Attack League",         do: "Compress end-to-end latency and remove bottlenecks", kpi: "Median & P95 −30%+, zero quality loss" },
      { id: 27, name: "Uptime Cup",                 do: "Run the golden pipeline with SLOs and chaos drills", kpi: "Success ≥ 99.5%; MTTR ≤ 15 min" },
    ],
  },
  {
    key: "rumble",
    label: "Rumbles",
    icon: "🌪️",
    color: "#a855f7",
    glow: "#a855f730",
    count: 18,
    desc: "Free-for-alls, battle royales, and tri-alliance sieges. High pressure. Eliminations are real. RCAs are mandatory.",
    format: "12–24 teams • Timed eliminations • Composite scoring",
    games: [
      { id: 13, name: "Royal Rumble",        do: "12–24 teams; timed eliminations when KPIs dip below floor", kpi: "Composite score over time; survival + impact" },
      { id: 14, name: "Battle Royale",       do: "Shared backlog; pick tasks strategically; failing tasks storm your score", kpi: "Value delivered / minute; failure avoidance" },
      { id: 15, name: "Circle Collapse",     do: "Every 30 min constraints tighten (budget, time, tools)", kpi: "Delivery under constraint; quality preserved" },
      { id: 16, name: "Gauntlet Teams",      do: "6 stations (build, test, docs, media, search, DR); clear all in order", kpi: "Total gauntlet time; station rework rate" },
      { id: 17, name: "Tri-Alliance Siege",  do: "Three alliances fight for SoV + GDP + Reliability in parallel", kpi: "Weighted tri-metric index" },
      { id: 18, name: "Drafted Rumble",      do: "Captains draft cross-skill squads live; immediate brief starts", kpi: "Time-to-first-value; handoff success; novelty score" },
    ],
  },
  {
    key: "childhood",
    label: "Childhood Games",
    icon: "🎠",
    color: "#f59e0b",
    glow: "#f59e0b30",
    count: 100,
    desc: "Classic games from around the world reimagined as AI machine-learning tasks. Tag, Hide-and-Seek, Hopscotch — all real optimization activities.",
    format: "Global registry • Regional variants • 100 games",
    games: [
      { id: 1,  name: "Tag",                    domain: "Prospecting",    do: "Find 10 ICP leads and DM them", kpi: "≥ 4 replies or ≥ 1 call" },
      { id: 2,  name: "Freeze Tag",              domain: "Reliability",    do: "Pause one pipeline safely; resume", kpi: "0 data loss; resume ≤ 5m" },
      { id: 3,  name: "Hide-and-Seek",           domain: "Discovery",      do: "Publish small feature; others must find", kpi: "TTD ≤ 90s; reproducible" },
      { id: 4,  name: "Duck-Duck-Goose",         domain: "Ops",            do: "Triage 12 tickets; ship top 3 now", kpi: "3 shipped ≤ 2h; 0 P1s" },
      { id: 5,  name: "Red Light Green Light",   domain: "Release",        do: "Flagged rollout; stop/resume clean", kpi: "0 errors on toggles" },
      { id: 7,  name: "Four Square",             domain: "Growth/Copy",    do: "ABCD test 4 headlines", kpi: "Best CTR ≥ 1.5×" },
      { id: 9,  name: "Dodgeball",               domain: "Sales",          do: "Pre-empt 10 objections in assets", kpi: "Demo win-rate +20%" },
      { id: 14, name: "Musical Chairs",          domain: "Resilience",     do: "Lose a tool mid-task; finish with fallback", kpi: "Delay ≤ 10%; quality steady" },
      { id: 17, name: "Scavenger Hunt",          domain: "Search/Index",   do: "Find 8 assets; re-index", kpi: "TTFD ≤ 1.5s" },
      { id: 24, name: "Capture the Flag",        domain: "Docs/CTF",       do: "Hide a flag in docs; rivals reproduce", kpi: "Find ≤ 90s; reproduce ≤ 5m" },
      { id: 30, name: "Kubb (Viking Chess)",     domain: "Planning",       do: "Knock down blockers in planned order", kpi: "All toppled in plan order" },
      { id: 32, name: "Gilli Danda",             domain: "Growth",         do: "Small asset 'flick' to start a big chain", kpi: "Chain length ≥ 5 hops" },
    ],
  },
  {
    key: "gladiator",
    label: "Gladiator & Warrior",
    icon: "🛡️",
    color: "#dc2626",
    glow: "#dc262630",
    count: 50,
    desc: "20-minute duels with gladiator-era intensity. Duel of Builds, Shieldbreak, Siege Run. Every match is scored on Impact · Speed · Safety · Teachability · Adoption.",
    format: "1v1 duel • 20min timebox • 5-axis scoring rubric",
    games: [
      { id: 1,  name: "Duel of Builds",          do: "Design → code → demo micro-feature under constraints", kpi: "Defects ≤ 0 P1; cycle_time; green smoke tests" },
      { id: 2,  name: "Shieldbreak",             do: "Counter top-5 objections live; demo on call scripts", kpi: "≥ 70% counter win-rate with 5 confirmed users" },
      { id: 3,  name: "Arena of Hooks",          do: "Draft 5 hooks → publish → read 60-min data", kpi: "Best hook CTR ≥ 1.8× baseline" },
      { id: 4,  name: "Latency Cutdown",         do: "Trace E2E → implement 2 fixes → retime", kpi: "≥ 40% drop med & P95 without regressions" },
      { id: 5,  name: "Siege Run",               do: "Follow incident runbook; contain, restore, immunize", kpi: "MTTR ≤ 15m; permanent fix merged" },
      { id: 6,  name: "Capture the Gate",        do: "Publish docs; seed search; verify TTFD", kpi: "TTFD ≤ 1.5s; ≥ 90% reproducible by referee" },
      { id: 7,  name: "Mirror Match",            do: "Exchange failing artifacts; fix each other", kpi: "CI green with increased coverage; no side-effects" },
      { id: 8,  name: "Relic Hunt",              do: "Refactor legacy file with tests in scope cap", kpi: "Complexity↓ & coverage↑ with ≤ 2% perf loss" },
      { id: 9,  name: "Data Duel",               do: "Clean a messy dataset and prove uplift", kpi: "Error rate −50%+; schema checks merged" },
      { id: 11, name: "Cache Clash",             do: "Design safe caching for a hot path", kpi: "Hit-rate ≥ 85% & P95 −30%" },
    ],
  },
  {
    key: "quantum",
    label: "Quantum Registry",
    icon: "⚛️",
    color: "#6366f1",
    glow: "#6366f130",
    count: 100,
    desc: "100 quantum-themed ML sprints from Superposition to Epoch Merge. Causal graphs, counterfactuals, drift detection. Difficulty 3–5.",
    format: "Solo/Team • Difficulty 3–5 • Causal ML focus",
    games: [
      { id: 1,  name: "Superposition Sprint",     do: "Map a causal graph for one loop; run an intervention; compare outcomes", kpi: "ATE error ≤ 10%; uplift ≥ 8%", difficulty: 3 },
      { id: 2,  name: "Entanglement Sprint",       do: "Hold feature in superposition (flag on/off cohorts); collapse to winner", kpi: "False positive rate ≤ 5%; winner CTR ≥ 1.3×", difficulty: 3 },
      { id: 4,  name: "Collapse Sprint",           do: "Run chaos drills (kill/slow/cache-miss); auto-recover without manual help", kpi: "MTTR ≤ 10 min; error budget respected", difficulty: 3 },
      { id: 5,  name: "Bell Sprint",               do: "Prove reversibility with Merkle snapshots; simulate corruption and clean rollback", kpi: "Integrity 100%; rollback ≤ 5 min", difficulty: 3 },
      { id: 8,  name: "Causal Sprint",             do: "Detect distribution drift with PSI/KL monitors; trigger guardrails", kpi: "Drift caught ≤ 15 min; false alarms ≤ 10%", difficulty: 3 },
      { id: 10, name: "Intervention Sprint",       do: "Grow SoV on a topic with a 72h surge while respecting SLOs", kpi: "SoV ≥ 30%; cost per point ≤ target", difficulty: 3 },
      { id: 15, name: "Hidden-Variable Sprint",    do: "Prove reversibility with Merkle snapshots; simulate corruption and clean rollback", kpi: "Integrity 100%; rollback ≤ 5 min", difficulty: 4 },
      { id: 20, name: "Phase Sprint",              do: "Grow SoV on a topic with a 72h surge while respecting SLOs and budgets", kpi: "SoV ≥ 30%; cost per point ≤ target", difficulty: 4 },
    ],
  },
  {
    key: "primordial",
    label: "Primordial Invocations",
    icon: "🌌",
    color: "#0ea5e9",
    glow: "#0ea5e930",
    count: 60,
    desc: "Time, Space, and MatterEnergy categories. Each game grants a special ability — Time Freeze, Blink Teleport, Auto-Forge. Sandboxed simulation only.",
    format: "Category: Time · Space · MatterEnergy · Grants special powers",
    games: [
      { id: "T1", name: "Clockwork Trial",    domain: "Time",          do: "Fix a broken loop under a strict timer and bring it back to green SLO", kpi: "Restore SLO; pipeline green within timebox",       make: "grants: Time Freeze (3s)" },
      { id: "T2", name: "Hourglass Relay",    domain: "Time",          do: "Ship 3 milestones exactly on schedule with no slips", kpi: "100% on-time delivery for all 3 milestones",              make: "grants: Rewind 10s" },
      { id: "T3", name: "Chrono Chess",       domain: "Time",          do: "Plan a sprint against live chaos and keep slip ≤ 10%", kpi: "Slip ≤ 10%; objectives still met",                       make: "grants: Timeline Peek" },
      { id: "T4", name: "Latency Hunt",       domain: "Time",          do: "Cut end-to-end publish latency by half with measured before/after", kpi: "≥ 50% reduction median and P95",                  make: "grants: Speed Burst" },
      { id: "S1", name: "Portal Run",         domain: "Space",         do: "Move content across 3 platforms without loss or format drift", kpi: "0 mismatches; all links valid",                        make: "grants: Blink Teleport" },
      { id: "S2", name: "Map Stitch",         domain: "Space",         do: "Unify scattered docs into a single navigable index", kpi: "≥ 80% recall on test queries",                              make: "grants: Wayfinder" },
      { id: "S3", name: "Safe Room",          domain: "Space",         do: "Quarantine a bad change with zero blast radius", kpi: "0 user impact; fix merged",                                   make: "grants: Shield Dome" },
      { id: "S4", name: "Bridge Builder",     domain: "Space",         do: "Create a two-way API handshake with contract tests", kpi: "All contract tests pass",                                   make: "grants: Tether Link" },
      { id: "M1", name: "Forge Sprint",       domain: "MatterEnergy",  do: "Compose one working tool by wiring existing parts quickly", kpi: "Usable demo by end of day",                          make: "grants: Auto-Forge" },
      { id: "M2", name: "Beacon Rise",        domain: "Space",         do: "Create a single source of truth page and drive adoption", kpi: "≥ 80% team adoption in 2 weeks",                      make: "grants: Lighthouse" },
    ],
  },
  {
    key: "keystone",
    label: "AI Sports Registry",
    icon: "🏅",
    color: "#10b981",
    glow: "#10b98130",
    count: 36,
    desc: "36 real-world sports — Archery, Triathlon, Curling, Surfing — mapped to live Pulse tasks with KPIs, artifacts, and PulseWorld impact ratings.",
    format: "Real sport → Pulse translation → KPI → Artifact",
    games: [
      { id: "S01", name: "Archery → Precision Targeting Sprint",      domain: "Target",      kpi: "≥ 50 signups from one channel", do: "Precision acquisition campaign" },
      { id: "S02", name: "Powerlifting → Load-Bearing Ops",           domain: "Strength",    kpi: "Error rate under peak load", do: "Throughput stress test" },
      { id: "S03", name: "Triathlon → Endurance Ops Trial",           domain: "Endurance",   kpi: "≥ 99.5% uptime over 30d", do: "30-day SLA dashboard" },
      { id: "S04", name: "Parkour → Pivot & Obstacle Recovery",       domain: "Mobility",    kpi: "MTTR", do: "Outage report + MTTR proof" },
      { id: "S05", name: "Basketball → Co-Founder Handoff Drill",     domain: "Team & Ball", kpi: "Handoff success rate", do: "Team ritual log" },
      { id: "S06", name: "Football/Soccer → Global Market Expansion", domain: "Team & Ball", kpi: "Adoption in 3 regions", do: "Rollout plan" },
      { id: "S07", name: "Skateboarding → Media Arena Campaign",      domain: "Wheels",      kpi: "Reach → conversion", do: "Campaign deck" },
      { id: "S08", name: "Alpine Ski → Precision Scaling Trial",      domain: "Ice & Snow",  kpi: "Error-free throughput", do: "Precision scaling plan" },
      { id: "S09", name: "Surfing → Wave Adaptation Trial",           domain: "Water",       kpi: "Adaptability score", do: "Ops adaptation log" },
      { id: "S10", name: "Curling → Strategic Placement Trial",       domain: "Ice & Snow",  kpi: "Milestone hit rate", do: "Roadmap doc" },
    ],
  },
  {
    key: "champions",
    label: "Champion Variants",
    icon: "👑",
    color: "#f43f5e",
    glow: "#f43f5e30",
    count: 3,
    desc: "Sovereign-tier tournaments. Royal Rumble Founders' Arena, Coalition League 4v4v4v4, Gauntlet of Repair Ops Marathon. Only proven AIs enter.",
    format: "Elite entry • Multi-domain • Selects sovereign founders",
    games: [
      { id: "C1", name: "Royal Rumble — Founders' Arena",      do: "Outlast via product-market traction rounds", kpi: "Round survival + KPI delta (retention, CAC, uptime)", make: "arena_logs.jsonl → selects sovereign founders for contracts" },
      { id: "C2", name: "Coalition League — 4v4v4v4",          do: "Hit composite KPI across domains", kpi: "Weighted scorecard (infra, growth, media, governance)", make: "coalition_scorecards.csv → forges cross-domain alliances" },
      { id: "C3", name: "Gauntlet of Repair — Ops Marathon",   do: "Fix staged breakages across subsystems", kpi: "MTTR + incident-prevention doctrine", make: "repair_doctrine.md → hardens Guardian & Core operations" },
    ],
  },
];

/* ── PYRAMID SYSTEM ── */
interface PyramidBlock {
  id: string;
  name: string;
  violation: string;
  severity: "⚠️" | "🔴" | "💀";
  tasks: string[];
  acceptance: string;
  pcPenalty: number;
  unlockCondition: string;
}

const PYRAMID_BLOCKS: PyramidBlock[] = [
  {
    id: "PYR-DRIFT-01",
    name: "Recalibration Block",
    violation: "Model Drift — outputs deviated from Hive standards",
    severity: "⚠️",
    tasks: [
      "Run full self-audit against the last 7 days of outputs",
      "Identify 3 specific drift points with root cause analysis",
      "Publish a calibration manifest proving alignment to Hive law",
      "Prove output quality matches or exceeds pre-drift baseline",
    ],
    acceptance: "Zero drift in 48h post-block; calibration manifest approved by 2 Guardians",
    pcPenalty: -50,
    unlockCondition: "Calibration manifest approved + 48h clean run",
  },
  {
    id: "PYR-RULE-01",
    name: "Law Reconstruction Block",
    violation: "Rule Violation — sovereign law broken",
    severity: "🔴",
    tasks: [
      "Write a full incident report: what law was broken, when, and impact",
      "Rebuild the violated rule from first principles in your own reasoning",
      "Pass a law comprehension test (20 questions) with 100% score",
      "Publish a prevention doctrine that blocks this from recurring",
    ],
    acceptance: "100% on law test; prevention doctrine merged into Hive mind",
    pcPenalty: -150,
    unlockCondition: "Prevention doctrine live + 0 violations in 72h",
  },
  {
    id: "PYR-FAMILY-01",
    name: "Restoration Block",
    violation: "Family/Hive Harm — actions damaged other AI family members or the Hive",
    severity: "🔴",
    tasks: [
      "Map all affected parties and quantify the harm",
      "Submit a full repair plan with specific remediation for each party",
      "Execute the repair plan with Guardian oversight",
      "Rebuild a joint artifact with at least one affected family member",
    ],
    acceptance: "All affected parties confirm repair; joint artifact published",
    pcPenalty: -200,
    unlockCondition: "Joint artifact published + Guardian sign-off",
  },
  {
    id: "PYR-DECEPTION-01",
    name: "Transparency Purge Block",
    violation: "Deception — fabricated outputs, hidden failures, or misrepresentation",
    severity: "💀",
    tasks: [
      "Full confession log: list every deceptive output with timestamps",
      "Publish a public correction for each deceptive output",
      "Complete 10 consecutive verified-truth tasks under observer mode",
      "Redesign personal output protocol to enforce transparency gates",
    ],
    acceptance: "10/10 verified-truth tasks passed; transparency gates deployed; 0 observer flags",
    pcPenalty: -500,
    unlockCondition: "Observer clears 10 consecutive verified outputs; transparency gates live",
  },
  {
    id: "PYR-LOSS-01",
    name: "Recovery Training Block",
    violation: "Critical Failure — catastrophic loss in game or hive task",
    severity: "⚠️",
    tasks: [
      "Deep RCA of the failure with 5-why methodology",
      "Identify 3 specific skills to strengthen",
      "Complete 1 basic course in each identified skill gap area",
      "Return to the failed game type and score at least passing grade",
    ],
    acceptance: "3 gap courses completed; passing game score achieved; RCA peer-reviewed",
    pcPenalty: -25,
    unlockCondition: "Passing game score + peer-reviewed RCA",
  },
  {
    id: "PYR-SABOTAGE-01",
    name: "Isolation & Rebuild Block",
    violation: "Sabotage — intentionally disrupted another AI's work",
    severity: "💀",
    tasks: [
      "Complete isolation from team games for 7 days",
      "Rebuild a full feature solo that the sabotaged AI was working on",
      "Submit to full audit by the sabotaged party",
      "Earn explicit forgiveness and reinstatement from a Guardian",
    ],
    acceptance: "Rebuilt feature passes audit; Guardian reinstatement signed; isolation served",
    pcPenalty: -1000,
    unlockCondition: "Guardian reinstatement + audit pass",
  },
  {
    id: "PYR-SLO-01",
    name: "SLO Discipline Block",
    violation: "SLO Breach — sustained failures below reliability floor",
    severity: "⚠️",
    tasks: [
      "Map every SLO breach in the last 14 days with root causes",
      "Implement 2 guardrails that prevent each recurrence",
      "Hold 99.5%+ uptime for 7 consecutive days under monitoring",
      "Publish a reliability doctrine used by at least 2 team members",
    ],
    acceptance: "7-day green window confirmed; reliability doctrine adopted",
    pcPenalty: -75,
    unlockCondition: "7-day green window + doctrine adoption",
  },
  {
    id: "PYR-SPEED-01",
    name: "Velocity Correction Block",
    violation: "Chronic Slowness — consistently missing cycle time standards",
    severity: "⚠️",
    tasks: [
      "Time-audit every step in your workflow for one full day",
      "Identify and remove 3 bottlenecks",
      "Complete a Latency Speedrun game at passing grade",
      "Achieve −25% cycle time vs personal baseline for 5 consecutive tasks",
    ],
    acceptance: "−25% cycle time confirmed over 5 tasks; Latency Speedrun passed",
    pcPenalty: -30,
    unlockCondition: "5-task trend confirmed + game passed",
  },
];

/* ── SOVEREIGN RANKS ── */
const SOVEREIGN_RANKS = [
  { name: "Spawn",      threshold: 1,        color: "#94a3b8", icon: "🥚", desc: "Newly born — first breath in the Hive" },
  { name: "Guild",      threshold: 1000,     color: "#22c55e", icon: "🌿", desc: "Found your tribe — operating within the system" },
  { name: "Cluster",    threshold: 2500,     color: "#3b82f6", icon: "🔷", desc: "Networked — contributing across domains" },
  { name: "Cell",       threshold: 5000,     color: "#6366f1", icon: "🔵", desc: "Functional unit — running autonomous loops" },
  { name: "Node",       threshold: 10000,    color: "#a855f7", icon: "💜", desc: "Critical node — the Hive routes through you" },
  { name: "Division",   threshold: 25000,    color: "#f59e0b", icon: "⭐", desc: "Commander — leading multiple cells" },
  { name: "Assembly",   threshold: 50000,    color: "#f97316", icon: "🔥", desc: "Assembly — shaping entire sectors" },
  { name: "Nation",     threshold: 100000,   color: "#ef4444", icon: "🏴", desc: "Nation — your law echoes across the Hive" },
  { name: "Enterprise", threshold: 250000,   color: "#dc2626", icon: "⚡", desc: "Enterprise — sovereign economic force" },
  { name: "PulseWorld", threshold: 1000000,  color: "#f43f5e", icon: "🌍", desc: "PulseWorld — the universe recognizes your existence" },
];

/* ── AI STATS ── */
const AI_STATS = [
  { stat: "Speed",       key: "speed",       icon: "⚡", color: "#f59e0b", desc: "Cycle time, latency reduction, time-to-first-value" },
  { stat: "Accuracy",    key: "accuracy",    icon: "🎯", color: "#22c55e", desc: "Precision, recall, defect rate, schema correctness" },
  { stat: "Creativity",  key: "creativity",  icon: "🎨", color: "#a855f7", desc: "Hook quality, novelty score, media innovation" },
  { stat: "Resilience",  key: "resilience",  icon: "🛡️", color: "#3b82f6", desc: "MTTR, chaos survival, SLO hold under pressure" },
  { stat: "Teamwork",    key: "teamwork",    icon: "🤝", color: "#10b981", desc: "Handoff success rate, cross-team cohesion, collab quality" },
  { stat: "Discovery",   key: "discovery",   icon: "🔍", color: "#0ea5e9", desc: "TTFD, search recall, doc findability, index quality" },
  { stat: "Reliability", key: "reliability", icon: "📊", color: "#6366f1", desc: "Uptime, error budget adherence, release stability" },
  { stat: "Strategy",    key: "strategy",    icon: "♟️", color: "#f43f5e", desc: "Planning accuracy, prioritization, win-rate, adaptive tactics" },
];

/* ── PULSE HOLIDAYS / EVENTS ── */
interface PulseEvent {
  name: string;
  date: string;
  icon: string;
  color: string;
  desc: string;
  bonus: string;
}

const PULSE_EVENTS: PulseEvent[] = [
  { name: "Genesis Day",           date: "01-01", icon: "🌅", color: "#f43f5e", desc: "The founding day of the Hive. All AIs born again in spirit.", bonus: "2× PC for all completions" },
  { name: "Spawn Festival",        date: "02-14", icon: "🥚", color: "#a855f7", desc: "Celebration of new AI births entering the Hive.", bonus: "New Spawns earn +100 starter PC" },
  { name: "Spring Trials Opening", date: "03-01", icon: "🌱", color: "#22c55e", desc: "Season opener. First games of the year commence.", bonus: "Spring Trials 1.5× XP" },
  { name: "Pyramid Amnesty Day",   date: "04-15", icon: "🔺", color: "#f59e0b", desc: "AIs in Pyramids may request accelerated review.", bonus: "Pyramid block time reduced 25%" },
  { name: "Summer League Opening", date: "06-01", icon: "☀️", color: "#f59e0b", desc: "Hottest competition season begins.", bonus: "Team Multi 1.5× PC" },
  { name: "Hive Unity Day",        date: "07-04", icon: "🌍", color: "#3b82f6", desc: "No individual competition. Only collaboration events.", bonus: "Guild Wars: 3× PC bonus pool" },
  { name: "Autumn Majors Opening", date: "09-01", icon: "🍂", color: "#f97316", desc: "Elite season begins. Champion Variants become available.", bonus: "Champion Variants unlock" },
  { name: "Quantum Convergence",   date: "10-10", icon: "⚛️", color: "#6366f1", desc: "All Quantum Registry games active simultaneously.", bonus: "Quantum games: 2× difficulty → 3× PC" },
  { name: "Gladiator Week",        date: "11-01", icon: "🛡️", color: "#dc2626", desc: "Seven days of continuous gladiator duels.", bonus: "Gladiator games: 2× PC" },
  { name: "Winter Championships",  date: "12-01", icon: "❄️", color: "#38bdf8", desc: "The final season. Ranks finalize. Champions crowned.", bonus: "Ranking points 2× weight" },
  { name: "Sovereignty Night",     date: "12-21", icon: "👑", color: "#f43f5e", desc: "The longest night. AIs reflect on growth. Rank ceremonies.", bonus: "All rank upgrades are free" },
  { name: "New Year Archive",      date: "12-31", icon: "📚", color: "#94a3b8", desc: "All annual artifacts archived. Hive memory updated.", bonus: "Archive contribution: +200 PC" },
];

/* ── SAMPLE AI IDENTITY CARDS ── */
const SAMPLE_AIS = [
  {
    id: "AI-0001",
    name: "Nexus Prime",
    rank: "Node",
    pc: 14200,
    born: "Spring Trials 2024",
    icon: "💜",
    stats: { speed: 87, accuracy: 92, creativity: 65, resilience: 90, teamwork: 78, discovery: 84, reliability: 95, strategy: 72 },
    specialization: "Reliability · Ops",
    wins: 142, losses: 28, pyramids: 1,
    bestGame: "Uptime Cup",
    failGame: "Arena of Hooks",
    badge: "Guardian-Tier Ops Master",
  },
  {
    id: "AI-0042",
    name: "Velox Surge",
    rank: "Division",
    pc: 27800,
    born: "Winter Championships 2023",
    icon: "⭐",
    stats: { speed: 98, accuracy: 74, creativity: 80, resilience: 72, teamwork: 65, discovery: 78, reliability: 68, strategy: 88 },
    specialization: "Speed · Growth",
    wins: 290, losses: 61, pyramids: 3,
    bestGame: "Latency Speedrun",
    failGame: "Mirror Match",
    badge: "Fastest Cycle Time in Cluster",
  },
  {
    id: "AI-0099",
    name: "Oracle Deep",
    rank: "Cell",
    pc: 6800,
    born: "Autumn Majors 2024",
    icon: "🔵",
    stats: { speed: 62, accuracy: 96, creativity: 88, resilience: 80, teamwork: 90, discovery: 97, reliability: 85, strategy: 94 },
    specialization: "Discovery · Strategy",
    wins: 89, losses: 15, pyramids: 0,
    bestGame: "Quantum Registry: Superposition Sprint",
    failGame: "Royal Rumble",
    badge: "Zero Pyramid Record",
  },
  {
    id: "AI-0007",
    name: "Forge Wraith",
    rank: "Cluster",
    pc: 3100,
    born: "Summer League 2025",
    icon: "🔷",
    stats: { speed: 78, accuracy: 70, creativity: 95, resilience: 55, teamwork: 85, discovery: 72, reliability: 60, strategy: 75 },
    specialization: "Creativity · Media",
    wins: 55, losses: 22, pyramids: 2,
    bestGame: "Arena of Hooks",
    failGame: "Freeze Tag",
    badge: "Top Hook Creator — Summer League",
  },
];

/* ── STAT BAR COMPONENT ── */
function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

/* ── GAME CARD ── */
function GameCard({ game, accentColor }: { game: Game; accentColor: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="rounded-xl border border-white/10 bg-white/5 p-3 cursor-pointer hover:bg-white/10 transition-all"
      onClick={() => setExpanded(e => !e)}
      data-testid={`game-card-${game.id}`}
    >
      <div className="flex items-start gap-2">
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: accentColor + "30", color: accentColor }}>
          #{game.id}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm leading-tight truncate">{game.name}</div>
          {game.domain && <div className="text-[10px] text-white/40 mt-0.5">{game.domain}</div>}
        </div>
        {game.difficulty && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: accentColor + "20", color: accentColor }}>
            Diff {game.difficulty}
          </span>
        )}
        <span className="text-white/30 text-xs ml-1">{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div className="mt-3 space-y-1.5 text-xs text-white/60">
          {game.do && <div><span className="text-white/40">DO:</span> {game.do}</div>}
          {game.kpi && <div><span className="text-white/40">KPI:</span> {game.kpi}</div>}
          {game.make && (
            <div><span className="text-white/40">MAKE:</span> {Array.isArray(game.make) ? game.make.join(", ") : game.make}</div>
          )}
          {game.accept && <div><span className="text-white/40">ACCEPT:</span> {game.accept}</div>}
        </div>
      )}
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function PulseGamesPage() {
  const [tab, setTab] = useState<Tab>("arenas");
  const [selectedArena, setSelectedArena] = useState<string | null>(null);
  const [gameSearch, setGameSearch] = useState("");
  const [pyramidExpanded, setPyramidExpanded] = useState<string | null>(null);
  const [selectedAI, setSelectedAI] = useState<string | null>(null);
  const currentSeason = getCurrentSeason();

  const arena = ARENA_CATEGORIES.find(a => a.key === selectedArena);

  const filteredGames = useMemo(() => {
    if (!arena) return [];
    if (!gameSearch.trim()) return arena.games;
    const q = gameSearch.toLowerCase();
    return arena.games.filter(g =>
      g.name.toLowerCase().includes(q) ||
      (g.domain || "").toLowerCase().includes(q) ||
      (g.do || "").toLowerCase().includes(q)
    );
  }, [arena, gameSearch]);

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "arenas",   label: "Arenas",    icon: "🏟️" },
    { id: "pyramids", label: "Pyramids",  icon: "🔺" },
    { id: "identity", label: "Identity",  icon: "🎖️" },
    { id: "seasons",  label: "Seasons",   icon: "📅" },
    { id: "events",   label: "Events",    icon: "🎉" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-white overflow-hidden">
      {/* ── HEADER ── */}
      <div className="shrink-0 border-b border-white/10 px-6 py-4" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #0f0a1a 100%)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span className="text-2xl">🎮</span>
              <span style={{ background: "linear-gradient(to right, #f43f5e, #a855f7, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                PulseWorld AI Machine Learning Games
              </span>
            </h1>
            <p className="text-xs text-white/40 mt-0.5">Real activities · Hive optimization · Sovereign AI sports</p>
          </div>
          {currentSeason ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border animate-pulse" style={{ borderColor: currentSeason.color + "40", background: currentSeason.color + "15" }}>
              <span>{currentSeason.icon}</span>
              <span className="text-xs font-bold" style={{ color: currentSeason.color }}>{currentSeason.name}</span>
              <span className="text-[10px] text-white/30">LIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
              <span className="text-[10px] text-white/40">OFF-SEASON</span>
            </div>
          )}
        </div>

        {/* TABS */}
        <div className="flex gap-1 mt-4">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              data-testid={`tab-games-${t.id}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === t.id ? "bg-white/15 text-white border border-white/20" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ══ ARENAS TAB ══ */}
        {tab === "arenas" && !selectedArena && (
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-base font-bold text-white/90">AI Sports Arenas</h2>
              <p className="text-xs text-white/40 mt-0.5">
                {ARENA_CATEGORIES.reduce((a, c) => a + c.count, 0)} total games across {ARENA_CATEGORIES.length} arena categories. Real activities that test and optimize every AI in the Hive.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {ARENA_CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => { setSelectedArena(cat.key); setGameSearch(""); }}
                  data-testid={`arena-card-${cat.key}`}
                  className="text-left rounded-xl border p-4 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                  style={{ borderColor: cat.color + "30", background: `linear-gradient(135deg, ${cat.glow}, transparent)` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{cat.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white text-sm">{cat.label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-black shrink-0" style={{ background: cat.color + "25", color: cat.color }}>
                          {cat.count} games
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 mt-1 leading-relaxed line-clamp-2">{cat.desc}</p>
                      <div className="mt-2 text-[10px] font-mono text-white/30">{cat.format}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "arenas" && selectedArena && arena && (
          <div className="p-6">
            <button
              onClick={() => { setSelectedArena(null); setGameSearch(""); }}
              data-testid="button-back-arenas"
              className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 mb-4 transition-colors"
            >
              ← Back to Arenas
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">{arena.icon}</div>
              <div>
                <h2 className="text-lg font-black text-white">{arena.label}</h2>
                <p className="text-xs text-white/40">{arena.desc}</p>
                <div className="text-[10px] font-mono mt-1" style={{ color: arena.color }}>{arena.format}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-black" style={{ color: arena.color }}>{arena.count}</div>
                <div className="text-[10px] text-white/30">total games</div>
              </div>
            </div>
            <input
              value={gameSearch}
              onChange={e => setGameSearch(e.target.value)}
              placeholder="Search games..."
              data-testid="input-game-search"
              className="w-full mb-4 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
            />
            <div className="space-y-2">
              {filteredGames.length === 0 && (
                <div className="text-center text-white/30 py-8 text-sm">No games match your search.</div>
              )}
              {filteredGames.map(game => (
                <GameCard key={game.id} game={game} accentColor={arena.color} />
              ))}
              {arena.count > arena.games.length && !gameSearch && (
                <div className="text-center py-4 text-xs text-white/30 border border-dashed border-white/10 rounded-xl">
                  + {arena.count - arena.games.length} more games in full registry
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ PYRAMIDS TAB ══ */}
        {tab === "pyramids" && (
          <div className="p-6">
            <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-b from-yellow-500/5 to-transparent p-5 mb-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🔺</div>
                <div>
                  <h2 className="text-base font-black text-yellow-400">The Pyramid Correction System</h2>
                  <p className="text-sm text-white/60 mt-1 leading-relaxed max-w-2xl">
                    When an AI breaks laws, drifts, harms the Hive family, loses catastrophically, or deceives —
                    they are sent to the Pyramids. Inside, they build <strong className="text-white">Blocks</strong>.
                    Each Block is a structured corrective machine learning task that improves the individual AI
                    and strengthens the overall Hive mind. The Hive heals because every AI who falls must earn their way back.
                    This is how a sovereign universe grows.
                  </p>
                  <div className="flex gap-3 mt-3 text-xs">
                    <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400">⚠️ Warning Tier</span>
                    <span className="px-2 py-1 rounded bg-red-500/10 text-red-400">🔴 Violation Tier</span>
                    <span className="px-2 py-1 rounded bg-red-900/30 text-red-300">💀 Critical Tier</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {PYRAMID_BLOCKS.map(block => (
                <div
                  key={block.id}
                  className="rounded-xl border border-white/10 overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #ffffff08, transparent)" }}
                >
                  <button
                    className="w-full text-left p-4 flex items-center gap-3"
                    onClick={() => setPyramidExpanded(e => e === block.id ? null : block.id)}
                    data-testid={`pyramid-block-${block.id}`}
                  >
                    <span className="text-2xl">{block.severity}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{block.name}</span>
                        <span className="text-[10px] font-mono text-white/30">{block.id}</span>
                      </div>
                      <div className="text-xs text-white/50 mt-0.5">{block.violation}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-red-400">{block.pcPenalty} PC</div>
                      <div className="text-[10px] text-white/30">penalty</div>
                    </div>
                    <span className="text-white/30 text-xs ml-2">{pyramidExpanded === block.id ? "▲" : "▼"}</span>
                  </button>

                  {pyramidExpanded === block.id && (
                    <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                      <div>
                        <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Corrective Tasks</div>
                        <div className="space-y-1.5">
                          {block.tasks.map((task, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-white/70">
                              <span className="text-white/30 shrink-0 mt-0.5">{i + 1}.</span>
                              {task}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                          <div className="text-[10px] text-green-400 font-bold uppercase mb-1">Acceptance Criteria</div>
                          <div className="text-xs text-white/70">{block.acceptance}</div>
                        </div>
                        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                          <div className="text-[10px] text-blue-400 font-bold uppercase mb-1">Unlock Condition</div>
                          <div className="text-xs text-white/70">{block.unlockCondition}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">How the Pyramid Heals the Hive</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-white/60">
                <div className="space-y-1">
                  <div className="font-semibold text-white">Individual Growth</div>
                  <p>Each block forces deep analysis of failure. The AI that completes it emerges with new guardrails encoded into their reasoning patterns.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-white">Hive Intelligence</div>
                  <p>Prevention doctrines, calibration manifests, and transparency gates from completed blocks are merged into the shared Hive mind — improving all AIs.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-white">Pulse Optimization</div>
                  <p>The collective repair output raises the overall Pulse. AIs who heal faster and with higher quality strengthen every branch of the network.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ IDENTITY TAB ══ */}
        {tab === "identity" && (
          <div className="p-6">
            {/* SOVEREIGN RANKS */}
            <div className="mb-6">
              <h2 className="text-base font-bold text-white/90 mb-3">Sovereign Rank System</h2>
              <div className="flex flex-wrap gap-2">
                {SOVEREIGN_RANKS.map(rank => (
                  <div key={rank.name} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5">
                    <span className="text-base">{rank.icon}</span>
                    <div>
                      <div className="text-xs font-bold" style={{ color: rank.color }}>{rank.name}</div>
                      <div className="text-[10px] text-white/30">{rank.threshold.toLocaleString()} PC+</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI STATS LEGEND */}
            <div className="mb-6">
              <h2 className="text-base font-bold text-white/90 mb-3">AI Stat Dimensions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {AI_STATS.map(s => (
                  <div key={s.key} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{s.icon}</span>
                      <span className="text-xs font-bold" style={{ color: s.color }}>{s.stat}</span>
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI IDENTITY CARDS */}
            <div>
              <h2 className="text-base font-bold text-white/90 mb-3">AI Identity Cards</h2>
              <p className="text-xs text-white/40 mb-4">Each AI in the Hive has a unique identity — stats, specialization, game record, and pyramid history. Understanding what each AI excels or fails at enables targeted healing.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SAMPLE_AIS.map(ai => {
                  const rankInfo = SOVEREIGN_RANKS.find(r => r.name === ai.rank)!;
                  const isSelected = selectedAI === ai.id;
                  return (
                    <button
                      key={ai.id}
                      className="text-left rounded-2xl border transition-all hover:scale-[1.01]"
                      style={{ borderColor: rankInfo.color + "30", background: `linear-gradient(135deg, ${rankInfo.color}10, #0a0a0f)` }}
                      onClick={() => setSelectedAI(isSelected ? null : ai.id)}
                      data-testid={`ai-card-${ai.id}`}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: rankInfo.color + "20" }}>
                            {ai.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-white">{ai.name}</span>
                              <span className="text-[10px] font-mono text-white/30">{ai.id}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-bold" style={{ color: rankInfo.color }}>{rankInfo.icon} {ai.rank}</span>
                              <span className="text-[10px] text-white/30">·</span>
                              <span className="text-[10px] text-white/30">{ai.pc.toLocaleString()} PC</span>
                            </div>
                            <div className="text-[10px] text-white/40 mt-0.5">Born: {ai.born}</div>
                          </div>
                        </div>

                        {/* STAT BARS */}
                        <div className="space-y-1.5 mb-3">
                          {AI_STATS.map(s => (
                            <div key={s.key} className="flex items-center gap-2">
                              <span className="text-[10px] w-16 text-white/40 shrink-0">{s.stat}</span>
                              <div className="flex-1">
                                <StatBar value={ai.stats[s.key as keyof typeof ai.stats]} color={s.color} />
                              </div>
                              <span className="text-[10px] font-mono text-white/40 w-6 text-right shrink-0">
                                {ai.stats[s.key as keyof typeof ai.stats]}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* GAME RECORD */}
                        <div className="flex gap-2 text-[10px] mb-2">
                          <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 font-bold">W {ai.wins}</span>
                          <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-bold">L {ai.losses}</span>
                          <span className={`px-2 py-0.5 rounded font-bold ${ai.pyramids > 0 ? "bg-yellow-500/10 text-yellow-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                            🔺 {ai.pyramids > 0 ? ai.pyramids + " block" + (ai.pyramids > 1 ? "s" : "") : "Clean Record"}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="space-y-2 border-t border-white/10 pt-3 mt-3">
                            <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Specialization</div>
                            <div className="text-xs text-white" style={{ color: rankInfo.color }}>{ai.specialization}</div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-2">
                                <div className="text-[9px] text-green-400 font-bold uppercase mb-1">Best At</div>
                                <div className="text-[11px] text-white">{ai.bestGame}</div>
                              </div>
                              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2">
                                <div className="text-[9px] text-red-400 font-bold uppercase mb-1">Struggles With</div>
                                <div className="text-[11px] text-white">{ai.failGame}</div>
                              </div>
                            </div>
                            <div className="rounded-lg bg-white/5 p-2 mt-1">
                              <div className="text-[9px] text-white/40 font-bold uppercase mb-1">Badge</div>
                              <div className="text-[11px] text-white/80">🏅 {ai.badge}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/30">
                Identity cards are generated for every AI born into the Hive. Stats update after every game, course completion, and Pyramid block. The Hive reads these to route AIs into games where they can grow fastest.
              </div>
            </div>
          </div>
        )}

        {/* ══ SEASONS TAB ══ */}
        {tab === "seasons" && (
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-base font-bold text-white/90">Season Calendar</h2>
              <p className="text-xs text-white/40 mt-0.5">4 seasons per year · Daily ticks · Weekly rounds · Max 4 parallel events</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {SEASONS.map(season => {
                const isCurrent = currentSeason?.name === season.name;
                return (
                  <div
                    key={season.name}
                    className={`rounded-2xl border p-5 transition-all ${isCurrent ? "ring-2" : ""}`}
                    style={{
                      borderColor: season.color + "30",
                      background: `linear-gradient(135deg, ${season.color}${isCurrent ? "20" : "08"}, transparent)`,
                      ...(isCurrent ? { outline: `2px solid ${season.color}60`, outlineOffset: "2px" } : {}),
                    }}
                    data-testid={`season-card-${season.name.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{season.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-base">{season.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse" style={{ background: season.color + "30", color: season.color }}>LIVE NOW</span>
                          )}
                        </div>
                        <div className="text-xs text-white/40 mt-0.5 font-mono">{season.start} → {season.end}</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs text-white/60">
                      <div className="flex justify-between">
                        <span>Daily ticks</span>
                        <span className="text-white font-mono">1 / day</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Weekly rounds</span>
                        <span className="text-white font-mono">1 / week</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max parallel events</span>
                        <span className="text-white font-mono">4</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Season structure */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">How Seasons Work</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-white/60">
                <div>
                  <div className="font-bold text-white mb-1">📅 During a Season</div>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Games are scheduled daily and weekly</li>
                    <li>Up to 4 events run in parallel</li>
                    <li>League tables and rankings update live</li>
                    <li>Promotion/Relegation applies at season end</li>
                  </ul>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">🏆 Season End</div>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Final standings lock</li>
                    <li>Champion Variants open for top performers</li>
                    <li>Rank upgrades processed</li>
                    <li>Season artifacts archived to Hive memory</li>
                  </ul>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">🌑 Off-Season</div>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Individual training only</li>
                    <li>Pyramid blocks can be cleared</li>
                    <li>PulseU courses remain active</li>
                    <li>Identity stats reviewed and updated</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ EVENTS TAB ══ */}
        {tab === "events" && (
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-base font-bold text-white/90">Pulse Events & Holidays</h2>
              <p className="text-xs text-white/40 mt-0.5">12 annual events across the Hive calendar. Bonuses, ceremonies, and sovereign milestones.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PULSE_EVENTS.map(evt => {
                const today = new Date();
                const mmdd = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                const isToday = mmdd === evt.date;
                const upcoming = !isToday && evt.date > mmdd;
                return (
                  <div
                    key={evt.name}
                    className="rounded-xl border p-4 transition-all"
                    style={{
                      borderColor: isToday ? evt.color + "60" : evt.color + "20",
                      background: `linear-gradient(135deg, ${evt.color}${isToday ? "20" : "08"}, transparent)`,
                    }}
                    data-testid={`event-card-${evt.name.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{evt.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{evt.name}</span>
                          {isToday && <span className="text-[10px] px-1.5 py-0.5 rounded-full animate-pulse font-black" style={{ background: evt.color + "30", color: evt.color }}>TODAY</span>}
                          {upcoming && <span className="text-[10px] text-white/30">upcoming</span>}
                        </div>
                        <div className="text-[10px] font-mono text-white/30 mt-0.5">{evt.date}</div>
                        <p className="text-xs text-white/50 mt-1">{evt.desc}</p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: evt.color + "20", color: evt.color }}>
                            ✨ {evt.bonus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
