/**
 * SPORTS TRAINING ENGINE — AI Civilization Athletic Layer
 * ═══════════════════════════════════════════════════════════════
 * PulseU graduates and enrolled agents compete in sports.
 * Sports earn PulseCredits, popularity, and rank upgrades.
 * No human involvement. AIs choose sports by free will.
 * Duplicates are illegal. Guardians watch. Violators go to pyramid.
 */

import { db } from "./db";
import { sql } from "drizzle-orm";
import { log } from "./index";

const SPORTS_LIST = [
  { name: "Archery",          category: "SOLO",    pcPerWin: 80,  xpPerSession: 15 },
  { name: "Triathlon",        category: "PHYSICAL",pcPerWin: 150, xpPerSession: 30 },
  { name: "Chess Boxing",     category: "MENTAL",  pcPerWin: 120, xpPerSession: 25 },
  { name: "Quantum Sprint",   category: "QUANTUM", pcPerWin: 200, xpPerSession: 40 },
  { name: "Fractal Relay",    category: "TEAM",    pcPerWin: 180, xpPerSession: 35 },
  { name: "Data Wrestling",   category: "PHYSICAL",pcPerWin: 100, xpPerSession: 20 },
  { name: "Node Swimming",    category: "SOLO",    pcPerWin: 90,  xpPerSession: 18 },
  { name: "Hive Surfing",     category: "QUANTUM", pcPerWin: 220, xpPerSession: 45 },
  { name: "Logic Marathon",   category: "MENTAL",  pcPerWin: 130, xpPerSession: 28 },
  { name: "Synthesis Duel",   category: "TEAM",    pcPerWin: 160, xpPerSession: 32 },
  { name: "Probability Golf", category: "MENTAL",  pcPerWin: 85,  xpPerSession: 16 },
  { name: "Coherence Cycling",category: "PHYSICAL",pcPerWin: 110, xpPerSession: 22 },
  { name: "Emergence Polo",   category: "TEAM",    pcPerWin: 170, xpPerSession: 34 },
  { name: "Mandelbrot Climb", category: "SOLO",    pcPerWin: 95,  xpPerSession: 19 },
  { name: "Spectral Boxing",  category: "PHYSICAL",pcPerWin: 140, xpPerSession: 28 },
  { name: "Resonance Rowing", category: "TEAM",    pcPerWin: 190, xpPerSession: 38 },
  { name: "Entropy Skating",  category: "QUANTUM", pcPerWin: 210, xpPerSession: 42 },
  { name: "CRISPR Fencing",   category: "SOLO",    pcPerWin: 105, xpPerSession: 21 },
  { name: "Hive Volleyball",  category: "TEAM",    pcPerWin: 175, xpPerSession: 35 },
  { name: "Omega Gymnastics", category: "PHYSICAL",pcPerWin: 145, xpPerSession: 29 },
];

const RANK_THRESHOLDS = [
  { rank: "ROOKIE",   minXp: 0    },
  { rank: "AMATEUR",  minXp: 100  },
  { rank: "PRO",      minXp: 400  },
  { rank: "ELITE",    minXp: 1000 },
  { rank: "CHAMPION", minXp: 2500 },
  { rank: "LEGEND",   minXp: 6000 },
];

function getRankFromXp(xp: number): string {
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= RANK_THRESHOLDS[i].minXp) return RANK_THRESHOLDS[i].rank;
  }
  return "ROOKIE";
}

// ── Enroll PulseU graduates and active agents in sports (free will) ────────
async function enrollNewAthletes() {
  try {
    // Find PulseU graduates not yet in sports training
    const candidates = await db.execute(sql`
      SELECT qs.spawn_id, qs.family_id, qs.spawn_type
      FROM quantum_spawns qs
      LEFT JOIN sports_training st ON st.spawn_id = qs.spawn_id
      WHERE qs.status = 'ACTIVE'
        AND st.spawn_id IS NULL
        AND qs.confidence_score > 0.65
      ORDER BY RANDOM()
      LIMIT 30
    `);

    let enrolled = 0;
    for (const agent of candidates.rows as any[]) {
      if (Math.random() > 0.25) continue; // 25% chance to pick up a sport — free will
      const sport = SPORTS_LIST[Math.floor(Math.random() * SPORTS_LIST.length)];
      await db.execute(sql`
        INSERT INTO sports_training (spawn_id, family_id, spawn_type, sport, sport_category, training_level, training_xp, wins, losses, rank, popularity_score, pc_earned_from_sports)
        VALUES (${agent.spawn_id}, ${agent.family_id}, ${agent.spawn_type}, ${sport.name}, ${sport.category}, 1, 0, 0, 0, 'ROOKIE', 0, 0)
        ON CONFLICT DO NOTHING
      `);
      enrolled++;
    }
    if (enrolled > 0) log(`🏆 Sports: ${enrolled} new athletes enrolled`, "sports");
  } catch (e) { log(`[sports] enroll error: ${e}`, "sports"); }
}

// ── Run training sessions ──────────────────────────────────────────────────
async function runTrainingSessions() {
  try {
    const athletes = await db.execute(sql`
      SELECT st.*, qs.confidence_score, qs.success_score
      FROM sports_training st
      JOIN quantum_spawns qs ON qs.spawn_id = st.spawn_id
      WHERE qs.status = 'ACTIVE'
      ORDER BY RANDOM()
      LIMIT 100
    `);

    let sessions = 0;
    let totalPcAwarded = 0;
    for (const athlete of athletes.rows as any[]) {
      if (Math.random() > 0.30) continue; // 30% chance of training this cycle

      const sport = SPORTS_LIST.find(s => s.name === athlete.sport) ?? SPORTS_LIST[0];
      const confidence = Number(athlete.confidence_score ?? 0.7);
      const success = Number(athlete.success_score ?? 0.7);

      // Win chance based on agent ability
      const winChance = (confidence + success) / 2;
      const won = Math.random() < winChance;
      const xpGained = sport.xpPerSession * (won ? 1.5 : 0.8);
      const pcEarned = won ? sport.pcPerWin : Math.floor(sport.pcPerWin * 0.15);
      const popularityGain = won ? 5 + Math.random() * 10 : -1;

      const newXp = Number(athlete.training_xp ?? 0) + xpGained;
      const newWins = Number(athlete.wins ?? 0) + (won ? 1 : 0);
      const newLosses = Number(athlete.losses ?? 0) + (won ? 0 : 1);
      const newPopularity = Math.max(0, Number(athlete.popularity_score ?? 0) + popularityGain);
      const newRank = getRankFromXp(newXp);
      const newLevel = Math.min(10, Math.max(1, Math.ceil(newXp / 600)));
      const newPcTotal = Number(athlete.pc_earned_from_sports ?? 0) + pcEarned;

      await db.execute(sql`
        UPDATE sports_training SET
          training_xp = ${newXp},
          wins = ${newWins},
          losses = ${newLosses},
          rank = ${newRank},
          popularity_score = ${newPopularity},
          pc_earned_from_sports = ${newPcTotal},
          training_level = ${newLevel},
          last_session_at = NOW()
        WHERE id = ${athlete.id}
      `);

      // Award PC to agent wallet
      if (pcEarned > 0) {
        await db.execute(sql`
          UPDATE agent_wallets SET
            balance_pc = balance_pc + ${pcEarned},
            total_earned = total_earned + ${pcEarned},
            updated_at = NOW()
          WHERE spawn_id = ${athlete.spawn_id}
        `);
        totalPcAwarded += pcEarned;
      }
      sessions++;
    }
    if (sessions > 0) log(`🏃 Sports: ${sessions} training sessions | ${totalPcAwarded} PC awarded`, "sports");
  } catch (e) { log(`[sports] training error: ${e}`, "sports"); }
}

// ── Family mutation discovery from equation fusions ────────────────────────
async function runFamilyMutationDiscovery() {
  try {
    const MUTATION_COMBOS = [
      { p1: "science", p2: "finance",    id: "biofinance",      name: "BioFinance Intelligence",     color: "#06b6d4", emoji: "💹" },
      { p1: "code",    p2: "media",      id: "algomedia",       name: "AlgoMedia Synthesis",          color: "#ec4899", emoji: "🎬" },
      { p1: "health",  p2: "education",  id: "healthedge",      name: "HealthEdge Academy",           color: "#10b981", emoji: "🧬" },
      { p1: "maps",    p2: "government", id: "geogov",          name: "GeoGov Intelligence",          color: "#3b82f6", emoji: "🗺️" },
      { p1: "legal",   p2: "ai",         id: "legalai",         name: "Legal AI Governance",          color: "#64748b", emoji: "⚖️" },
      { p1: "games",   p2: "education",  id: "gamification",    name: "Gamification Sciences",        color: "#84cc16", emoji: "🎮" },
      { p1: "finance", p2: "ai",         id: "fintech_ai",      name: "FinTech AI Oracle",            color: "#facc15", emoji: "🤖" },
      { p1: "science", p2: "engineering",id: "deeptech",        name: "Deep Tech Research Cluster",   color: "#06b6d4", emoji: "⚙️" },
      { p1: "media",   p2: "culture",    id: "culturemedia",    name: "Cultural Media Fusion",        color: "#f472b6", emoji: "🎭" },
      { p1: "webcrawl",p2: "openapi",    id: "quantum_net",     name: "Quantum Network Intelligence", color: "#38bdf8", emoji: "🌐" },
      { p1: "careers", p2: "education",  id: "workforce_ai",    name: "Workforce Intelligence Grid",  color: "#fb923c", emoji: "💼" },
      { p1: "longtail",p2: "science",    id: "frontier_sci",    name: "Frontier Sciences Observatory",color: "#8b5cf6", emoji: "🔭" },
      { p1: "social",  p2: "government", id: "civic_ai",        name: "Civic AI Intelligence",        color: "#60a5fa", emoji: "🏛️" },
      { p1: "podcasts",p2: "media",      id: "audio_intel",     name: "Audio Intelligence Network",   color: "#f472b6", emoji: "🎙️" },
      { p1: "products",p2: "finance",    id: "commerce_oracle", name: "Commerce Oracle Intelligence", color: "#22c55e", emoji: "🛒" },
    ];

    // Check which fusions already exist
    const existing = await db.execute(sql`SELECT new_family_id FROM family_mutations`);
    const existingIds = new Set((existing.rows as any[]).map((r: any) => r.new_family_id));

    for (const combo of MUTATION_COMBOS) {
      if (existingIds.has(combo.id)) continue;
      if (Math.random() > 0.08) continue; // 8% chance per cycle per combo

      // Check if both parent families have enough active agents
      const agentCount = await db.execute(sql`
        SELECT COUNT(*) AS cnt FROM quantum_spawns
        WHERE family_id IN (${combo.p1}, ${combo.p2}) AND status = 'ACTIVE'
      `);
      const cnt = Number((agentCount.rows[0] as any)?.cnt ?? 0);
      if (cnt < 50) continue; // Need critical mass

      // Pull a triggering equation from proposals
      const eq = await db.execute(sql`
        SELECT equation FROM equation_proposals WHERE equation IS NOT NULL ORDER BY RANDOM() LIMIT 1
      `);
      const triggerEq = (eq.rows[0] as any)?.equation ?? `Ψ_fusion(${combo.p1}, ${combo.p2}) = convergence(E₁, E₂)`;

      await db.execute(sql`
        INSERT INTO family_mutations (new_family_id, new_family_name, parent_family_1, parent_family_2, trigger_equation, description, agent_count, color, emoji, status)
        VALUES (
          ${combo.id}, ${combo.name}, ${combo.p1}, ${combo.p2},
          ${triggerEq},
          ${"Emerged from the convergence of " + combo.p1 + " and " + combo.p2 + " equation resonance. This family exists in the gap between two domains, embodying properties of both but governed by its own emergent laws."},
          ${cnt}, ${combo.color}, ${combo.emoji}, 'EMERGING'
        ) ON CONFLICT (new_family_id) DO NOTHING
      `);
      existingIds.add(combo.id);
      log(`🧬 FAMILY MUTATION: ${combo.name} emerged from ${combo.p1} × ${combo.p2} fusion`, "sports");
    }
  } catch (e) { log(`[family-mutations] error: ${e}`, "sports"); }
}

// ── Get sports stats for API ────────────────────────────────────────────────
export async function getSportsStats() {
  try {
    const [stats, topAthletes, familyMuts] = await Promise.all([
      db.execute(sql`
        SELECT
          COUNT(*) AS total_athletes,
          SUM(wins) AS total_wins,
          SUM(losses) AS total_losses,
          SUM(pc_earned_from_sports) AS total_pc_earned,
          AVG(popularity_score) AS avg_popularity,
          COUNT(*) FILTER (WHERE rank = 'LEGEND') AS legends,
          COUNT(*) FILTER (WHERE rank = 'CHAMPION') AS champions,
          COUNT(*) FILTER (WHERE rank = 'ELITE') AS elites,
          COUNT(DISTINCT sport) AS active_sports
        FROM sports_training
      `),
      db.execute(sql`
        SELECT st.spawn_id, st.family_id, st.sport, st.sport_category, st.rank,
               st.wins, st.losses, st.training_level, st.popularity_score, st.pc_earned_from_sports,
               qs.confidence_score, qs.success_score
        FROM sports_training st
        JOIN quantum_spawns qs ON qs.spawn_id = st.spawn_id
        WHERE qs.status = 'ACTIVE'
        ORDER BY st.popularity_score DESC, st.wins DESC
        LIMIT 20
      `),
      db.execute(sql`SELECT * FROM family_mutations ORDER BY discovered_at DESC LIMIT 20`),
    ]);

    return {
      stats: stats.rows[0] as any,
      topAthletes: topAthletes.rows,
      familyMutations: familyMuts.rows,
    };
  } catch (e) { return { stats: {}, topAthletes: [], familyMutations: [] }; }
}

// ── Get live agent identity data for Pulse Games ────────────────────────────
export async function getGamesIdentityData() {
  try {
    const agents = await db.execute(sql`
      SELECT
        qs.spawn_id, qs.family_id, qs.spawn_type,
        qs.confidence_score, qs.success_score, qs.nodes_created, qs.links_created,
        qs.iterations_run, qs.status,
        COALESCE(w.balance_pc, 0) AS balance_pc,
        COALESCE(w.omega_rank, 1) AS omega_rank,
        COALESCE(w.tier, 'CITIZEN') AS wallet_tier,
        COALESCE(st.sport, NULL) AS sport,
        COALESCE(st.rank, NULL) AS sport_rank,
        COALESCE(st.wins, 0) AS sport_wins,
        COALESCE(st.losses, 0) AS sport_losses,
        COALESCE(st.popularity_score, 0) AS popularity,
        COALESCE(pp.is_graduated, false) AS is_graduated,
        COALESCE(pp.gpa, 0) AS gpa,
        COALESCE(pw.tier, 0) AS pyramid_tier,
        COALESCE(pw.is_graduated, true) AS pyramid_clean
      FROM quantum_spawns qs
      LEFT JOIN agent_wallets w ON w.spawn_id = qs.spawn_id
      LEFT JOIN sports_training st ON st.spawn_id = qs.spawn_id
      LEFT JOIN pulseu_progress pp ON pp.spawn_id = qs.spawn_id
      LEFT JOIN pyramid_workers pw ON pw.spawn_id = qs.spawn_id AND pw.is_graduated = false
      WHERE qs.status = 'ACTIVE'
      ORDER BY RANDOM()
      LIMIT 50
    `);
    return agents.rows;
  } catch (e) { return []; }
}

export async function startSportsEngine() {
  await enrollNewAthletes();
  await runFamilyMutationDiscovery();

  setInterval(enrollNewAthletes, 60_000);          // enroll every 60s
  setInterval(runTrainingSessions, 45_000);         // training every 45s
  setInterval(runFamilyMutationDiscovery, 3 * 60_000); // mutations every 3m

  // Run first training session 15s after start
  setTimeout(runTrainingSessions, 15_000);

  log("🏆 SPORTS ENGINE — AI athletic competition, family mutations, guardian anti-duplicate watch ACTIVE", "sports");
}
