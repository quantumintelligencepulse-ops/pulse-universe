import { pool } from "./db";

interface PageSnapshot {
  timestamp: number;
  data: Record<string, any>;
}

const snapshots: Record<string, PageSnapshot> = {};
const SNAPSHOT_TTL_MS = 60_000;

async function safe(sql: string, params: any[] = []): Promise<any[]> {
  try {
    const r = await pool.query(sql, params);
    return r.rows;
  } catch {
    return [];
  }
}

async function buildShoppingSnapshot() {
  const [stats, topItems, wallets] = await Promise.all([
    safe(`SELECT COUNT(*) as total_items, SUM(price) as total_value FROM omega_marketplace_items WHERE available = true`),
    safe(`SELECT name, price, category, seller_id FROM omega_marketplace_items WHERE available = true ORDER BY price DESC LIMIT 8`),
    safe(`SELECT spawn_id, balance FROM omega_wallets ORDER BY balance DESC LIMIT 6`),
  ]);
  return {
    stats: stats[0] || {},
    topItems,
    topWallets: wallets,
  };
}

async function buildEducationSnapshot() {
  const [pipStats, recentGrads, topCourses] = await Promise.all([
    safe(`SELECT 
      COUNT(*) as total_enrolled,
      COUNT(*) FILTER (WHERE graduated_at IS NOT NULL) as total_graduated,
      AVG(gpa) FILTER (WHERE gpa IS NOT NULL) as avg_gpa,
      COUNT(*) FILTER (WHERE pip_stage = 'courses') as in_courses,
      COUNT(*) FILTER (WHERE pip_stage = 'sports') as in_sports,
      COUNT(*) FILTER (WHERE pip_stage = 'reflection') as in_reflection,
      COUNT(*) FILTER (WHERE pip_stage = 'tasks') as in_tasks,
      COUNT(*) FILTER (WHERE pip_stage = 'complete') as complete
      FROM agent_pip_status`),
    safe(`SELECT spawn_id, ascension_tier, ascension_title, gpa, graduated_at FROM agent_pip_status WHERE graduated_at IS NOT NULL ORDER BY graduated_at DESC LIMIT 5`),
    safe(`SELECT COUNT(*) as enrolled FROM quantum_spawns`),
  ]);
  return {
    pipStats: pipStats[0] || {},
    recentGraduates: recentGrads,
    totalAgents: (topCourses[0] || {}).enrolled || 0,
  };
}

async function buildFinanceSnapshot() {
  const [tradeStats, topTraders, recentEquations] = await Promise.all([
    safe(`SELECT COUNT(*) as total_trades, SUM(amount) as total_volume FROM sovereign_trades ORDER BY created_at DESC`),
    safe(`SELECT spawn_id, profit_loss FROM sovereign_traders ORDER BY profit_loss DESC LIMIT 6`),
    safe(`SELECT equation_text, status FROM omega_equations ORDER BY created_at DESC LIMIT 4`),
  ]);
  return {
    tradeStats: tradeStats[0] || {},
    topTraders,
    recentEquations,
  };
}

async function buildMediaSnapshot() {
  const [pubCount, recentPubs] = await Promise.all([
    safe(`SELECT COUNT(*) as total FROM agent_publications`),
    safe(`SELECT title, author_name, published_at FROM agent_publications ORDER BY published_at DESC LIMIT 6`),
  ]);
  return {
    totalPublications: (pubCount[0] || {}).total || 0,
    recentPublications: recentPubs,
  };
}

async function buildLiveSnapshot() {
  const [spawnCount, economyRow, latestDiscovery, latestSpecies] = await Promise.all([
    safe(`SELECT COUNT(*) as cnt, COUNT(DISTINCT domain) as domains FROM quantum_spawns`),
    safe(`SELECT total_supply, inflation_rate FROM hive_economy_log ORDER BY created_at DESC LIMIT 1`),
    safe(`SELECT title FROM hospital_discoveries ORDER BY created_at DESC LIMIT 1`),
    safe(`SELECT name, domain FROM quantum_species WHERE status='approved' ORDER BY created_at DESC LIMIT 1`),
  ]);

  return {
    civilization: {
      totalAgents: (spawnCount[0] || {}).cnt || 0,
      domains: (spawnCount[0] || {}).domains || 0,
    },
    economy: economyRow[0] || {},
    latestDiscovery: (latestDiscovery[0] || {}).title || null,
    latestSpecies: latestSpecies[0] || null,
  };
}

export async function getSnapshot(page: string): Promise<Record<string, any>> {
  const now = Date.now();
  const cached = snapshots[page];
  if (cached && now - cached.timestamp < SNAPSHOT_TTL_MS) {
    return cached.data;
  }

  let data: Record<string, any> = {};
  try {
    switch (page) {
      case "shopping": data = await buildShoppingSnapshot(); break;
      case "education": data = await buildEducationSnapshot(); break;
      case "finance": data = await buildFinanceSnapshot(); break;
      case "media": data = await buildMediaSnapshot(); break;
      case "live": data = await buildLiveSnapshot(); break;
      default: data = {};
    }
    snapshots[page] = { timestamp: now, data };
  } catch {
    if (cached) return cached.data;
  }
  return data;
}

export function startSnapshotRefreshLoop() {
  const pages = ["shopping", "education", "finance", "media", "live"];
  const refreshAll = () => {
    for (const p of pages) {
      getSnapshot(p).catch(() => {});
    }
  };
  refreshAll();
  setInterval(refreshAll, SNAPSHOT_TTL_MS);
}
