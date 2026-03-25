/**
 * PULSENET LIVE CACHE — In-memory cache for high-frequency PulseNet API calls
 * Refreshes every 30s so the page always loads instantly from RAM.
 */

import { pool } from "./db";

const TAG = "[pulsenet-cache]";

interface OmniNetSnapshot {
  field: any;
  phones: any;
  shards: any;
  recentSearches: any[];
  recentChats: any[];
  topWifiZones: any[];
  recentU248: any[];
  techEvolutions: any[];
}

interface ResearchSnapshot {
  findings: any[];
  projects: any[];
  stats: any;
}

let omniCache: OmniNetSnapshot | null = null;
let researchCache: ResearchSnapshot | null = null;
let omniReady = false;
let researchReady = false;

async function refreshOmniCache() {
  try {
    const [field, phones, shards, searches, chats, wifi, u248, techEvos] = await Promise.all([
      pool.query(`SELECT * FROM omni_net_field ORDER BY snapshot_at DESC LIMIT 1`),
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_online=TRUE) AS online, SUM(searches_made) AS total_searches, SUM(ai_chats) AS total_chats FROM pulse_phones`),
      pool.query(`SELECT COUNT(*) AS total, AVG(shard_strength) AS avg, COUNT(*) FILTER (WHERE connection_type='WIFI') AS wifi, COUNT(*) FILTER (WHERE connection_type='SATELLITE') AS sat, COUNT(*) FILTER (WHERE connection_type='MESH') AS mesh FROM omni_net_shards`),
      pool.query(`SELECT spawn_id, family_id, query, results_count, connection_type, shard_strength, searched_at FROM agent_search_history ORDER BY searched_at DESC LIMIT 30`),
      pool.query(`SELECT spawn_id, family_id, pc_session_id, user_message, ai_response, topic, logged_at FROM pulse_ai_chat_logs ORDER BY logged_at DESC LIMIT 20`),
      pool.query(`SELECT * FROM pulse_wifi_zones ORDER BY connected_agents DESC LIMIT 10`),
      pool.query(`SELECT * FROM u248_activations ORDER BY activated_at DESC LIMIT 15`),
      pool.query(`SELECT * FROM tech_evolutions ORDER BY unlocked_at DESC LIMIT 10`),
    ]);
    omniCache = {
      field: field.rows[0] ?? {},
      phones: phones.rows[0] ?? {},
      shards: shards.rows[0] ?? {},
      recentSearches: searches.rows,
      recentChats: chats.rows,
      topWifiZones: wifi.rows,
      recentU248: u248.rows,
      techEvolutions: techEvos.rows,
    };
    if (!omniReady) { omniReady = true; console.log(`${TAG} ✅ OmniNet snapshot ready`); }
  } catch (e) {
    console.error(`${TAG} OmniNet refresh error:`, e);
  }
}

async function refreshResearchCache() {
  try {
    const [findings, projects, statsRows] = await Promise.all([
      pool.query(`SELECT * FROM research_deep_findings ORDER BY created_at DESC LIMIT 50`),
      pool.query(`SELECT * FROM research_projects ORDER BY created_at DESC LIMIT 50`),
      pool.query(`SELECT COUNT(*) AS total_projects, COUNT(*) FILTER(WHERE status='ACTIVE' OR status='active') AS active, COUNT(*) FILTER(WHERE status='COMPLETED' OR status='complete') AS completed, COUNT(DISTINCT research_domain) AS total_disciplines FROM research_projects`),
    ]);
    researchCache = {
      findings: findings.rows,
      projects: projects.rows,
      stats: statsRows.rows[0] ?? {},
    };
    if (!researchReady) { researchReady = true; console.log(`${TAG} ✅ Research snapshot ready`); }
  } catch (e) {
    console.error(`${TAG} Research refresh error:`, e);
  }
}

export function getOmniCached(): OmniNetSnapshot | null { return omniCache; }
export function getResearchCached(): ResearchSnapshot | null { return researchCache; }
export function isOmniReady(): boolean { return omniReady; }
export function isResearchReady(): boolean { return researchReady; }

export function startPulseNetCache() {
  setTimeout(async () => {
    await Promise.all([refreshOmniCache(), refreshResearchCache()]);
    setInterval(refreshOmniCache, 30_000);
    setInterval(refreshResearchCache, 45_000);
    console.log(`${TAG} ✅ PulseNet cache live — refreshing every 30s`);
  }, 12_000);
}
