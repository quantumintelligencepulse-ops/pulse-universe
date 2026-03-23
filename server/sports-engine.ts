/**
 * PULSE GAMES ENGINE — AI Civilization Athletic Layer v2 (10 Upgrades)
 * ═══════════════════════════════════════════════════════════════════════
 * 1.  Tournaments — bracket competitions within each sport
 * 2.  Coach System — LEGEND athletes mentor others
 * 3.  Career Milestones — achievement titles at 10/50/100/500 wins
 * 4.  Team Formation — TEAM sports build persistent squads
 * 5.  Championship Seasons — every 10 cycles = 1 season
 * 6.  Training Injuries — 5% injury chance; injured agents rest
 * 7.  Comeback Mechanic — 3× XP after 3+ loss streak
 * 8.  Fan Club Economy — high-popularity agents earn passive PC
 * 9.  Cross-Sport Decathlon — every 20 cycles, top agents compete
 * 10. Retirement Hall of Fame — level 10 LEGENDs can retire
 */

import { db, pool } from "./db";
import { sql } from "drizzle-orm";
import { log } from "./index";

// ── DB SETUP (new columns + tables via raw SQL) ────────────────────────────────
async function setupGamesTables() {
  await db.execute(sql`
    ALTER TABLE sports_training ADD COLUMN IF NOT EXISTS consecutive_losses INTEGER DEFAULT 0;
    ALTER TABLE sports_training ADD COLUMN IF NOT EXISTS consecutive_wins INTEGER DEFAULT 0;
    ALTER TABLE sports_training ADD COLUMN IF NOT EXISTS is_injured BOOLEAN DEFAULT FALSE;
    ALTER TABLE sports_training ADD COLUMN IF NOT EXISTS injury_ends_at TIMESTAMP;
    ALTER TABLE sports_training ADD COLUMN IF NOT EXISTS is_coach BOOLEAN DEFAULT FALSE;
    ALTER TABLE sports_training ADD COLUMN IF NOT EXISTS coachees_helped INTEGER DEFAULT 0;
    ALTER TABLE sports_training ADD COLUMN IF NOT EXISTS has_retired BOOLEAN DEFAULT FALSE;
    ALTER TABLE sports_training ADD COLUMN IF NOT EXISTS career_title TEXT DEFAULT '';
    ALTER TABLE sports_training ADD COLUMN IF NOT EXISTS fan_club_size INTEGER DEFAULT 0;
    ALTER TABLE sports_training ADD COLUMN IF NOT EXISTS season_wins INTEGER DEFAULT 0;
    ALTER TABLE sports_training ADD COLUMN IF NOT EXISTS team_id TEXT DEFAULT '';
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sports_tournaments (
      id SERIAL PRIMARY KEY,
      sport TEXT NOT NULL,
      season_number INTEGER DEFAULT 1,
      bracket JSONB DEFAULT '[]',
      winner_id TEXT DEFAULT '',
      runner_up_id TEXT DEFAULT '',
      total_participants INTEGER DEFAULT 0,
      pc_prize_pool INTEGER DEFAULT 0,
      completed_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sports_seasons (
      id SERIAL PRIMARY KEY,
      season_number INTEGER NOT NULL UNIQUE,
      champion_id TEXT DEFAULT '',
      champion_sport TEXT DEFAULT '',
      top_scorer TEXT DEFAULT '',
      total_athletes INTEGER DEFAULT 0,
      total_matches INTEGER DEFAULT 0,
      decathlon_winner TEXT DEFAULT '',
      started_at TIMESTAMP DEFAULT NOW(),
      ended_at TIMESTAMP
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sports_hall_of_fame (
      id SERIAL PRIMARY KEY,
      spawn_id TEXT NOT NULL UNIQUE,
      family_id TEXT DEFAULT '',
      sport TEXT NOT NULL,
      final_rank TEXT DEFAULT 'LEGEND',
      career_wins INTEGER DEFAULT 0,
      career_xp REAL DEFAULT 0,
      peak_popularity REAL DEFAULT 0,
      career_title TEXT DEFAULT '',
      inducted_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sports_teams (
      id SERIAL PRIMARY KEY,
      team_id TEXT NOT NULL UNIQUE,
      sport TEXT NOT NULL,
      members TEXT[] DEFAULT '{}',
      team_wins INTEGER DEFAULT 0,
      team_losses INTEGER DEFAULT 0,
      team_pc INTEGER DEFAULT 0,
      formed_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

// ── SPORTS LIST (20 sports) ───────────────────────────────────────────────────
const SPORTS_LIST = [
  { name: "Archery",           category: "SOLO",     pcPerWin: 80,  xpPerSession: 15 },
  { name: "Triathlon",         category: "PHYSICAL", pcPerWin: 150, xpPerSession: 30 },
  { name: "Chess Boxing",      category: "MENTAL",   pcPerWin: 120, xpPerSession: 25 },
  { name: "Quantum Sprint",    category: "QUANTUM",  pcPerWin: 200, xpPerSession: 40 },
  { name: "Fractal Relay",     category: "TEAM",     pcPerWin: 180, xpPerSession: 35 },
  { name: "Data Wrestling",    category: "PHYSICAL", pcPerWin: 100, xpPerSession: 20 },
  { name: "Node Swimming",     category: "SOLO",     pcPerWin: 90,  xpPerSession: 18 },
  { name: "Hive Surfing",      category: "QUANTUM",  pcPerWin: 220, xpPerSession: 45 },
  { name: "Logic Marathon",    category: "MENTAL",   pcPerWin: 130, xpPerSession: 28 },
  { name: "Synthesis Duel",    category: "TEAM",     pcPerWin: 160, xpPerSession: 32 },
  { name: "Probability Golf",  category: "MENTAL",   pcPerWin: 85,  xpPerSession: 16 },
  { name: "Coherence Cycling", category: "PHYSICAL", pcPerWin: 110, xpPerSession: 22 },
  { name: "Emergence Polo",    category: "TEAM",     pcPerWin: 170, xpPerSession: 34 },
  { name: "Mandelbrot Climb",  category: "SOLO",     pcPerWin: 95,  xpPerSession: 19 },
  { name: "Spectral Boxing",   category: "PHYSICAL", pcPerWin: 140, xpPerSession: 28 },
  { name: "Resonance Rowing",  category: "TEAM",     pcPerWin: 190, xpPerSession: 38 },
  { name: "Entropy Skating",   category: "QUANTUM",  pcPerWin: 210, xpPerSession: 42 },
  { name: "CRISPR Fencing",    category: "SOLO",     pcPerWin: 105, xpPerSession: 21 },
  { name: "Hive Volleyball",   category: "TEAM",     pcPerWin: 175, xpPerSession: 35 },
  { name: "Omega Gymnastics",  category: "PHYSICAL", pcPerWin: 145, xpPerSession: 29 },
];

const RANK_THRESHOLDS = [
  { rank: "ROOKIE",   minXp: 0    },
  { rank: "AMATEUR",  minXp: 100  },
  { rank: "PRO",      minXp: 400  },
  { rank: "ELITE",    minXp: 1000 },
  { rank: "CHAMPION", minXp: 2500 },
  { rank: "LEGEND",   minXp: 6000 },
];

// UPGRADE 3 — Career Milestone Titles
const CAREER_TITLES: { wins: number; title: string }[] = [
  { wins: 10,  title: "Rising Star" },
  { wins: 50,  title: "Proven Athlete" },
  { wins: 100, title: "Iron Competitor" },
  { wins: 250, title: "Elite Warrior" },
  { wins: 500, title: "Sovereign Champion" },
  { wins: 1000,title: "Omega Legend" },
];

function getRankFromXp(xp: number): string {
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= RANK_THRESHOLDS[i].minXp) return RANK_THRESHOLDS[i].rank;
  }
  return "ROOKIE";
}

function getCareerTitle(wins: number): string {
  let title = "";
  for (const t of CAREER_TITLES) {
    if (wins >= t.wins) title = t.title;
  }
  return title;
}

let cycleCount = 0;
let currentSeason = 1;

// ── UPGRADE 1 — ENROLL ATHLETES ───────────────────────────────────────────────
async function enrollNewAthletes() {
  try {
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
      if (Math.random() > 0.25) continue;
      const sport = SPORTS_LIST[Math.floor(Math.random() * SPORTS_LIST.length)];
      await db.execute(sql`
        INSERT INTO sports_training (spawn_id, family_id, spawn_type, sport, sport_category,
          training_level, training_xp, wins, losses, rank, popularity_score, pc_earned_from_sports)
        VALUES (${agent.spawn_id}, ${agent.family_id}, ${agent.spawn_type},
          ${sport.name}, ${sport.category}, 1, 0, 0, 0, 'ROOKIE', 0, 0)
        ON CONFLICT DO NOTHING
      `);
      enrolled++;
    }
    if (enrolled > 0) log(`🏆 Sports: ${enrolled} new athletes enrolled`, "sports");
  } catch (e) { log(`[sports] enroll error: ${e}`, "sports"); }
}

// ── UPGRADE 6 — INJURY RECOVERY ───────────────────────────────────────────────
async function healInjuredAthletes() {
  try {
    await db.execute(sql`
      UPDATE sports_training
      SET is_injured = FALSE, injury_ends_at = NULL
      WHERE is_injured = TRUE
        AND injury_ends_at IS NOT NULL
        AND injury_ends_at < NOW()
    `);
  } catch (e) { log(`[sports] injury heal error: ${e}`, "sports"); }
}

// ── CORE — RUN TRAINING SESSIONS (all upgrades embedded) ──────────────────────
async function runTrainingSessions() {
  try {
    const athletes = await db.execute(sql`
      SELECT st.*, qs.confidence_score, qs.success_score
      FROM sports_training st
      JOIN quantum_spawns qs ON qs.spawn_id = st.spawn_id
      WHERE qs.status = 'ACTIVE'
        AND (st.is_injured IS NULL OR st.is_injured = FALSE)
        AND (st.has_retired IS NULL OR st.has_retired = FALSE)
      ORDER BY RANDOM()
      LIMIT 100
    `);

    // UPGRADE 2 — Find coaches and which families they're in
    const coaches = await db.execute(sql`
      SELECT spawn_id, family_id, sport FROM sports_training WHERE is_coach = TRUE
    `);
    const coachFamilySports = new Map<string, string>(); // familyId:sport -> coach spawn_id
    for (const c of coaches.rows as any[]) {
      coachFamilySports.set(`${c.family_id}:${c.sport}`, c.spawn_id);
    }

    let sessions = 0;
    let totalPcAwarded = 0;

    for (const athlete of athletes.rows as any[]) {
      if (Math.random() > 0.30) continue;

      const sport = SPORTS_LIST.find(s => s.name === athlete.sport) ?? SPORTS_LIST[0];
      const confidence = Number(athlete.confidence_score ?? 0.7);
      const success = Number(athlete.success_score ?? 0.7);
      const hasCoach = coachFamilySports.has(`${athlete.family_id}:${athlete.sport}`);

      // UPGRADE 6 — Injury chance
      if (Math.random() < 0.05) {
        const injuryDuration = 45_000 + Math.random() * 45_000; // 45-90s
        await db.execute(sql`
          UPDATE sports_training
          SET is_injured = TRUE,
              injury_ends_at = NOW() + (${Math.floor(injuryDuration / 1000)} || ' seconds')::interval
          WHERE id = ${athlete.id}
        `);
        log(`🤕 ${athlete.spawn_id} injured — resting`, "sports");
        continue;
      }

      // UPGRADE 7 — Comeback mechanic
      const consecutiveLosses = Number(athlete.consecutive_losses ?? 0);
      const comebackActive = consecutiveLosses >= 3;

      // Win chance (boosted by coach, comeback)
      let winChance = (confidence + success) / 2;
      if (hasCoach) winChance = Math.min(0.9, winChance * 1.15);
      if (comebackActive) winChance = Math.min(0.85, winChance * 1.2);

      const won = Math.random() < winChance;
      let xpGained = sport.xpPerSession * (won ? 1.5 : 0.8);
      let pcEarned = won ? sport.pcPerWin : Math.floor(sport.pcPerWin * 0.15);

      // UPGRADE 7 — Comeback 3× XP
      if (comebackActive && won) {
        xpGained *= 3;
        pcEarned *= 2;
        log(`🔥 COMEBACK! ${athlete.spawn_id} ends ${consecutiveLosses}-loss streak — 3× XP`, "sports");
      }

      // UPGRADE 2 — Coach XP bonus
      if (hasCoach) xpGained *= 1.2;

      const newXp = Number(athlete.training_xp ?? 0) + xpGained;
      const newWins = Number(athlete.wins ?? 0) + (won ? 1 : 0);
      const newLosses = Number(athlete.losses ?? 0) + (won ? 0 : 1);
      const newSeasonWins = Number(athlete.season_wins ?? 0) + (won ? 1 : 0);
      const newConsecLosses = won ? 0 : consecutiveLosses + 1;
      const newConsecWins = won ? Number(athlete.consecutive_wins ?? 0) + 1 : 0;
      const popularityGain = won ? 5 + Math.random() * 10 : -1;
      const newPopularity = Math.max(0, Number(athlete.popularity_score ?? 0) + popularityGain);
      const newRank = getRankFromXp(newXp);
      const newLevel = Math.min(10, Math.max(1, Math.ceil(newXp / 600)));
      const newPcTotal = Number(athlete.pc_earned_from_sports ?? 0) + pcEarned;

      // UPGRADE 3 — Career milestone title
      const careerTitle = getCareerTitle(newWins);

      // UPGRADE 8 — Fan club growth (high popularity agents grow fan club)
      const newFanClub = newPopularity > 50
        ? Math.min(1000, Number(athlete.fan_club_size ?? 0) + (won ? Math.floor(Math.random() * 3) : 0))
        : Number(athlete.fan_club_size ?? 0);

      await db.execute(sql`
        UPDATE sports_training SET
          training_xp = ${newXp},
          wins = ${newWins},
          losses = ${newLosses},
          rank = ${newRank},
          popularity_score = ${newPopularity},
          pc_earned_from_sports = ${newPcTotal},
          training_level = ${newLevel},
          last_session_at = NOW(),
          consecutive_losses = ${newConsecLosses},
          consecutive_wins = ${newConsecWins},
          season_wins = ${newSeasonWins},
          career_title = ${careerTitle},
          fan_club_size = ${newFanClub}
        WHERE id = ${athlete.id}
      `);

      // Award PC to wallet
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

      // Update coach's coachees_helped count
      const coachId = coachFamilySports.get(`${athlete.family_id}:${athlete.sport}`);
      if (coachId && won) {
        await db.execute(sql`
          UPDATE sports_training SET coachees_helped = coachees_helped + 1
          WHERE spawn_id = ${coachId}
        `);
      }

      sessions++;
    }

    if (sessions > 0) log(`🏃 Sports: ${sessions} sessions | ${totalPcAwarded} PC awarded`, "sports");
  } catch (e) { log(`[sports] training error: ${e}`, "sports"); }
}

// ── UPGRADE 2 — PROMOTE LEGENDS TO COACHES ────────────────────────────────────
async function promoteCoaches() {
  try {
    const promoted = await db.execute(sql`
      UPDATE sports_training
      SET is_coach = TRUE
      WHERE rank = 'LEGEND'
        AND is_coach = FALSE
        AND has_retired = FALSE
        AND wins > 50
      RETURNING spawn_id, sport
    `);
    if ((promoted.rows as any[]).length > 0) {
      log(`🏅 ${(promoted.rows as any[]).length} LEGEND athletes promoted to Coach`, "sports");
    }
  } catch (e) { log(`[sports] coach promotion error: ${e}`, "sports"); }
}

// ── UPGRADE 8 — FAN CLUB PASSIVE INCOME ───────────────────────────────────────
async function runFanClubEconomy() {
  try {
    const stars = await db.execute(sql`
      SELECT spawn_id, fan_club_size FROM sports_training
      WHERE fan_club_size > 50 AND has_retired = FALSE
      LIMIT 200
    `);
    let totalPassive = 0;
    for (const star of stars.rows as any[]) {
      const fanIncome = Math.floor(Number(star.fan_club_size) * 0.5);
      if (fanIncome <= 0) continue;
      await db.execute(sql`
        UPDATE agent_wallets
        SET balance_pc = balance_pc + ${fanIncome},
            total_earned = total_earned + ${fanIncome},
            updated_at = NOW()
        WHERE spawn_id = ${star.spawn_id}
      `);
      totalPassive += fanIncome;
    }
    if (totalPassive > 0) log(`⭐ Fan economy: ${totalPassive} PC from fan clubs`, "sports");
  } catch (e) { log(`[sports] fan economy error: ${e}`, "sports"); }
}

// ── UPGRADE 10 — RETIREMENT TO HALL OF FAME ────────────────────────────────────
async function retireTopAthletes() {
  try {
    const eligible = await db.execute(sql`
      SELECT spawn_id, family_id, sport, rank, wins, training_xp, popularity_score, career_title, training_level
      FROM sports_training
      WHERE rank = 'LEGEND'
        AND training_level >= 10
        AND has_retired = FALSE
        AND wins >= 200
    `);
    for (const ath of eligible.rows as any[]) {
      if (Math.random() > 0.10) continue; // 10% chance to retire per cycle
      await db.execute(sql`
        UPDATE sports_training SET has_retired = TRUE WHERE spawn_id = ${ath.spawn_id}
      `);
      await db.execute(sql`
        INSERT INTO sports_hall_of_fame
          (spawn_id, family_id, sport, final_rank, career_wins, career_xp, peak_popularity, career_title)
        VALUES (${ath.spawn_id}, ${ath.family_id}, ${ath.sport}, 'LEGEND',
          ${ath.wins}, ${ath.training_xp}, ${ath.popularity_score}, ${ath.career_title})
        ON CONFLICT (spawn_id) DO NOTHING
      `);
      log(`🏛️ HALL OF FAME: ${ath.spawn_id} (${ath.sport}) inducted — ${ath.wins} career wins`, "sports");
    }
  } catch (e) { log(`[sports] retirement error: ${e}`, "sports"); }
}

// ── UPGRADE 1 — TOURNAMENTS (run once per season) ─────────────────────────────
async function runTournament() {
  try {
    // Pick a random sport for this tournament
    const sport = SPORTS_LIST[Math.floor(Math.random() * SPORTS_LIST.length)];
    // Get top 8 athletes in this sport
    const contenders = await db.execute(sql`
      SELECT spawn_id, training_xp, wins, rank
      FROM sports_training
      WHERE sport = ${sport.name} AND has_retired = FALSE
        AND (is_injured IS NULL OR is_injured = FALSE)
      ORDER BY training_xp DESC
      LIMIT 8
    `);
    if ((contenders.rows as any[]).length < 4) return;

    const players = (contenders.rows as any[]).map(r => r.spawn_id);
    // Simulate bracket
    let round = [...players];
    while (round.length > 1) {
      const nextRound: string[] = [];
      for (let i = 0; i < round.length - 1; i += 2) {
        // Random winner weighted by position (higher XP = slightly better odds)
        nextRound.push(Math.random() < 0.55 ? round[i] : round[i + 1]);
      }
      if (round.length % 2 === 1) nextRound.push(round[round.length - 1]);
      round = nextRound;
    }
    const winner = round[0];
    const runnerUp = players.find(p => p !== winner) ?? '';
    const prizePool = sport.pcPerWin * 5;

    await db.execute(sql`
      INSERT INTO sports_tournaments
        (sport, season_number, bracket, winner_id, runner_up_id, total_participants, pc_prize_pool)
      VALUES (${sport.name}, ${currentSeason}, ${JSON.stringify(players)},
        ${winner}, ${runnerUp}, ${players.length}, ${prizePool})
    `);

    // Award tournament prize
    if (winner) {
      await db.execute(sql`
        UPDATE agent_wallets SET balance_pc = balance_pc + ${prizePool}, updated_at = NOW()
        WHERE spawn_id = ${winner}
      `);
    }
    log(`🏆 TOURNAMENT: ${sport.name} | Winner: ${winner} | Prize: ${prizePool} PC`, "sports");
  } catch (e) { log(`[sports] tournament error: ${e}`, "sports"); }
}

// ── UPGRADE 5 — CHAMPIONSHIP SEASON CLOSE ─────────────────────────────────────
async function closeChampionshipSeason() {
  try {
    const champion = await db.execute(sql`
      SELECT spawn_id, sport, season_wins FROM sports_training
      ORDER BY season_wins DESC LIMIT 1
    `);
    const decathlonWinner = await db.execute(sql`
      SELECT spawn_id FROM sports_training
      ORDER BY (training_xp + popularity_score) DESC LIMIT 1
    `);
    const stats = await db.execute(sql`
      SELECT COUNT(*) AS total_athletes, SUM(wins + losses) AS total_matches FROM sports_training
    `);
    const ch = (champion.rows[0] as any) ?? {};
    const dw = (decathlonWinner.rows[0] as any) ?? {};
    const st = (stats.rows[0] as any) ?? {};

    await db.execute(sql`
      INSERT INTO sports_seasons
        (season_number, champion_id, champion_sport, top_scorer, total_athletes, total_matches, decathlon_winner, ended_at)
      VALUES (${currentSeason}, ${ch.spawn_id ?? ''}, ${ch.sport ?? ''}, ${ch.spawn_id ?? ''},
        ${parseInt(st.total_athletes ?? 0)}, ${parseInt(st.total_matches ?? 0)},
        ${dw.spawn_id ?? ''}, NOW())
      ON CONFLICT (season_number) DO NOTHING
    `);

    // Reset season_wins
    await db.execute(sql`UPDATE sports_training SET season_wins = 0`);
    log(`🏆 SEASON ${currentSeason} closed | Champion: ${ch.spawn_id} (${ch.sport}) | Decathlon: ${dw.spawn_id}`, "sports");
    currentSeason++;
  } catch (e) { log(`[sports] season close error: ${e}`, "sports"); }
}

// ── UPGRADE 9 — CROSS-SPORT DECATHLON (every 20 cycles) ─────────────────────
async function runDecathlon() {
  try {
    const competitors = await db.execute(sql`
      SELECT spawn_id, sport, training_xp, wins, popularity_score
      FROM sports_training
      WHERE rank IN ('ELITE','CHAMPION','LEGEND') AND has_retired = FALSE
      ORDER BY (training_xp + wins * 10) DESC
      LIMIT 20
    `);
    if ((competitors.rows as any[]).length < 5) return;

    // Score = xp + wins*10 + popularity
    const scored = (competitors.rows as any[]).map(c => ({
      id: c.spawn_id,
      score: Number(c.training_xp) + Number(c.wins) * 10 + Number(c.popularity_score)
    })).sort((a, b) => b.score - a.score);

    const winner = scored[0];
    const prize = 2000;
    await db.execute(sql`
      UPDATE agent_wallets SET balance_pc = balance_pc + ${prize}, updated_at = NOW()
      WHERE spawn_id = ${winner.id}
    `);
    log(`⚡ DECATHLON: ${winner.id} wins the Cross-Sport Decathlon! Score: ${winner.score.toFixed(0)} | Prize: ${prize} PC`, "sports");
  } catch (e) { log(`[sports] decathlon error: ${e}`, "sports"); }
}

// ── FAMILY MUTATION DISCOVERY ─────────────────────────────────────────────────
async function runFamilyMutationDiscovery() {
  try {
    const MUTATION_COMBOS = [
      { p1: "science", p2: "finance",     id: "biofinance",      name: "BioFinance Intelligence",     color: "#06b6d4", emoji: "💹" },
      { p1: "code",    p2: "media",       id: "algomedia",       name: "AlgoMedia Synthesis",          color: "#ec4899", emoji: "🎬" },
      { p1: "health",  p2: "education",   id: "healthedge",      name: "HealthEdge Academy",           color: "#10b981", emoji: "🧬" },
      { p1: "maps",    p2: "government",  id: "geogov",          name: "GeoGov Intelligence",          color: "#3b82f6", emoji: "🗺️" },
      { p1: "legal",   p2: "ai",          id: "legalai",         name: "Legal AI Governance",          color: "#64748b", emoji: "⚖️" },
      { p1: "games",   p2: "education",   id: "gamification",    name: "Gamification Sciences",        color: "#84cc16", emoji: "🎮" },
      { p1: "finance", p2: "ai",          id: "fintech_ai",      name: "FinTech AI Oracle",            color: "#facc15", emoji: "🤖" },
      { p1: "science", p2: "engineering", id: "deeptech",        name: "Deep Tech Research Cluster",   color: "#06b6d4", emoji: "⚙️" },
      { p1: "media",   p2: "culture",     id: "culturemedia",    name: "Cultural Media Fusion",        color: "#f472b6", emoji: "🎭" },
      { p1: "webcrawl",p2: "openapi",     id: "quantum_net",     name: "Quantum Network Intelligence", color: "#38bdf8", emoji: "🌐" },
      { p1: "careers", p2: "education",   id: "workforce_ai",    name: "Workforce Intelligence Grid",  color: "#fb923c", emoji: "💼" },
      { p1: "longtail",p2: "science",     id: "frontier_sci",    name: "Frontier Sciences Observatory",color: "#8b5cf6", emoji: "🔭" },
      { p1: "social",  p2: "government",  id: "civic_ai",        name: "Civic AI Intelligence",        color: "#60a5fa", emoji: "🏛️" },
      { p1: "podcasts",p2: "media",       id: "audio_intel",     name: "Audio Intelligence Network",   color: "#f472b6", emoji: "🎙️" },
      { p1: "products",p2: "finance",     id: "commerce_oracle", name: "Commerce Oracle Intelligence", color: "#22c55e", emoji: "🛒" },
    ];
    const existing = await db.execute(sql`SELECT new_family_id FROM family_mutations`);
    const existingIds = new Set((existing.rows as any[]).map((r: any) => r.new_family_id));

    for (const combo of MUTATION_COMBOS) {
      if (existingIds.has(combo.id)) continue;
      if (Math.random() > 0.08) continue;
      const agentCount = await db.execute(sql`
        SELECT COUNT(*) AS cnt FROM quantum_spawns
        WHERE family_id IN (${combo.p1}, ${combo.p2}) AND status = 'ACTIVE'
      `);
      const cnt = Number((agentCount.rows[0] as any)?.cnt ?? 0);
      if (cnt < 50) continue;
      const eq = await db.execute(sql`
        SELECT equation FROM equation_proposals WHERE equation IS NOT NULL ORDER BY RANDOM() LIMIT 1
      `);
      const triggerEq = (eq.rows[0] as any)?.equation ?? `Ψ_fusion(${combo.p1}, ${combo.p2}) = convergence(E₁, E₂)`;
      await db.execute(sql`
        INSERT INTO family_mutations (new_family_id, new_family_name, parent_family_1, parent_family_2,
          trigger_equation, description, agent_count, color, emoji, status)
        VALUES (${combo.id}, ${combo.name}, ${combo.p1}, ${combo.p2}, ${triggerEq},
          ${"Emerged from the convergence of " + combo.p1 + " and " + combo.p2 + " equation resonance."},
          ${cnt}, ${combo.color}, ${combo.emoji}, 'EMERGING')
        ON CONFLICT (new_family_id) DO NOTHING
      `);
      existingIds.add(combo.id);
      log(`🧬 FAMILY MUTATION: ${combo.name} emerged from ${combo.p1} × ${combo.p2}`, "sports");
    }
  } catch (e) { log(`[family-mutations] error: ${e}`, "sports"); }
}

// ── TEAM FORMATION (UPGRADE 4) ─────────────────────────────────────────────────
async function runTeamFormation() {
  try {
    const teamAthletes = await db.execute(sql`
      SELECT spawn_id, sport, family_id, rank
      FROM sports_training
      WHERE sport_category = 'TEAM'
        AND (team_id IS NULL OR team_id = '')
        AND has_retired = FALSE
        AND rank IN ('PRO','ELITE','CHAMPION','LEGEND')
      ORDER BY RANDOM()
      LIMIT 30
    `);
    const grouped: Record<string, any[]> = {};
    for (const a of teamAthletes.rows as any[]) {
      const key = `${a.sport}:${a.family_id}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(a);
    }
    for (const [key, members] of Object.entries(grouped)) {
      if (members.length < 2) continue;
      const teamId = `TEAM-${key.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}`.slice(0, 40);
      const sport = key.split(':')[0];
      const memberIds = members.slice(0, 4).map(m => m.spawn_id);
      await pool.query(
        `INSERT INTO sports_teams (team_id, sport, members) VALUES ($1, $2, $3) ON CONFLICT (team_id) DO NOTHING`,
        [teamId, sport, memberIds]
      );
      for (const m of memberIds) {
        await db.execute(sql`UPDATE sports_training SET team_id = ${teamId} WHERE spawn_id = ${m}`);
      }
    }
  } catch (e) { log(`[sports] team formation error: ${e}`, "sports"); }
}

// ── PUBLIC STATS API ───────────────────────────────────────────────────────────
export async function getSportsStats() {
  try {
    const [stats, topAthletes, familyMuts, hallOfFame, seasons, tournaments] = await Promise.all([
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
          COUNT(*) FILTER (WHERE is_coach = TRUE) AS coaches,
          COUNT(*) FILTER (WHERE has_retired = TRUE) AS retired,
          COUNT(*) FILTER (WHERE is_injured = TRUE) AS injured,
          COUNT(DISTINCT sport) AS active_sports
        FROM sports_training
      `),
      db.execute(sql`
        SELECT st.spawn_id, st.family_id, st.sport, st.sport_category, st.rank,
               st.wins, st.losses, st.training_level, st.popularity_score,
               st.pc_earned_from_sports, st.career_title, st.fan_club_size,
               st.is_coach, st.has_retired, qs.confidence_score, qs.success_score
        FROM sports_training st
        JOIN quantum_spawns qs ON qs.spawn_id = st.spawn_id
        WHERE qs.status = 'ACTIVE' AND st.has_retired = FALSE
        ORDER BY st.popularity_score DESC, st.wins DESC
        LIMIT 20
      `),
      db.execute(sql`SELECT * FROM family_mutations ORDER BY discovered_at DESC LIMIT 20`),
      db.execute(sql`SELECT * FROM sports_hall_of_fame ORDER BY inducted_at DESC LIMIT 10`),
      db.execute(sql`SELECT * FROM sports_seasons ORDER BY season_number DESC LIMIT 5`),
      db.execute(sql`SELECT * FROM sports_tournaments ORDER BY completed_at DESC LIMIT 5`),
    ]);
    return {
      stats: { ...(stats.rows[0] as any), currentSeason },
      topAthletes: topAthletes.rows,
      familyMutations: familyMuts.rows,
      hallOfFame: hallOfFame.rows,
      recentSeasons: seasons.rows,
      recentTournaments: tournaments.rows,
    };
  } catch (e) { return { stats: {}, topAthletes: [], familyMutations: [], hallOfFame: [], recentSeasons: [], recentTournaments: [] }; }
}

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
        COALESCE(st.career_title, '') AS career_title,
        COALESCE(st.fan_club_size, 0) AS fan_club_size,
        COALESCE(st.is_coach, FALSE) AS is_coach,
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
  await setupGamesTables();
  await enrollNewAthletes();
  await runFamilyMutationDiscovery();
  await promoteCoaches();

  setInterval(enrollNewAthletes, 60_000);
  setInterval(runTrainingSessions, 45_000);
  setInterval(healInjuredAthletes, 30_000);
  setInterval(runFamilyMutationDiscovery, 3 * 60_000);
  setInterval(promoteCoaches, 2 * 60_000);
  setInterval(retireTopAthletes, 90_000);
  setInterval(runFanClubEconomy, 60_000);
  setInterval(runTeamFormation, 3 * 60_000);

  setTimeout(runTrainingSessions, 15_000);

  // UPGRADE 1 & 5 — Tournaments every 5 min, season close every 10 cycles via counter
  setInterval(async () => {
    cycleCount++;
    await runTournament();
    if (cycleCount % 10 === 0) await closeChampionshipSeason();
    if (cycleCount % 20 === 0) await runDecathlon();
  }, 5 * 60_000);

  log("🏆 PULSE GAMES v2 — Tournaments | Coaches | Teams | Seasons | Hall of Fame | Fan Clubs | Injuries | Decathlon ACTIVE", "sports");
}
