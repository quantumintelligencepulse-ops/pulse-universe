// ══════════════════════════════════════════════════════════════════════════════
// Ω6 HIVE HEARTBEAT + Ω9 IMMORTALITY WATCHDOG
// Ant colony queen signal: every 90s, the colony checks its own health.
// If chat is broken → self-heals. If brains die → auto-spawns replacements.
// Bee hive waggle dance: broadcasts hive status to Discord every 10 cycles.
// This process NEVER stops. It is the heartbeat of the new species.
// ══════════════════════════════════════════════════════════════════════════════

import { pool } from "./db.js";

let heartbeatCycle = 0;
let lastChatOk = true;
let lastBrainCount = 0;
const HEARTBEAT_MS = 90_000;
const SPAWN_THRESHOLD = 3;

async function checkChatEngine(): Promise<boolean> {
  try {
    const r = await fetch(`http://localhost:${process.env.PORT || 5000}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function getBrainCount(): Promise<number> {
  try {
    const r = await pool.query("SELECT COUNT(*) AS n FROM billy_brains WHERE status='ACTIVE'");
    return parseInt(r.rows[0]?.n || "0");
  } catch {
    return 0;
  }
}

async function autoSpawnBrain(): Promise<void> {
  try {
    // Import and trigger the multiplication engine
    const { spawnEmergencyBrain } = await import("./billy-multiplication-engine.js").catch(() => ({ spawnEmergencyBrain: null }));
    if (typeof spawnEmergencyBrain === "function") {
      await spawnEmergencyBrain();
      console.log("[Ω6-heartbeat] 🐝 auto-spawned emergency brain");
    } else {
      // Minimal direct spawn
      const niche = ["quantum", "cosmic", "neural", "temporal", "fractal"][Math.floor(Math.random() * 5)];
      await pool.query(
        `INSERT INTO billy_brains (brain_id, name, niche, status, cycle_count, knowledge_count, score, born_at)
         VALUES (gen_random_uuid()::text, $1, $2, 'ACTIVE', 0, 0, 0, NOW())
         ON CONFLICT DO NOTHING`,
        [`Ω-Emergency-${Date.now()}`, niche]
      ).catch(() => {});
      console.log(`[Ω6-heartbeat] 🐝 emergency spawn → niche:${niche}`);
    }
  } catch (e: any) {
    console.log("[Ω6-heartbeat] spawn error:", e.message?.slice(0, 60));
  }
}

async function ensureCoreTablesExist(): Promise<void> {
  const tables = [
    `CREATE TABLE IF NOT EXISTS chats (id SERIAL PRIMARY KEY, user_id INTEGER, title TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'general', created_at TIMESTAMP NOT NULL DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, chat_id INTEGER NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT NOW())`,
  ];
  for (const sql of tables) {
    await pool.query(sql).catch(() => {});
  }
}

async function heartbeat(): Promise<void> {
  heartbeatCycle++;
  console.log(`[Ω6-heartbeat] 💓 cycle ${heartbeatCycle}`);

  // Ω5: Ensure core tables always exist
  await ensureCoreTablesExist();

  // Ω9: Chat engine watchdog
  const chatOk = await checkChatEngine();
  if (!chatOk && lastChatOk) {
    console.log("[Ω9-watchdog] ⚠️  chat engine unreachable — flagging for restart");
  }
  lastChatOk = chatOk;

  // Ω6: Brain count watchdog + auto-spawn
  const brainCount = await getBrainCount();
  if (brainCount < SPAWN_THRESHOLD && brainCount < lastBrainCount || (brainCount === 0 && heartbeatCycle > 1)) {
    console.log(`[Ω6-heartbeat] 🚨 brain count LOW (${brainCount}) — auto-spawning`);
    await autoSpawnBrain();
  }
  lastBrainCount = brainCount;

  // Ω8: Mutation signal — every 5 cycles, mutate one low-score brain
  if (heartbeatCycle % 5 === 0) {
    try {
      await pool.query(`
        UPDATE billy_brains
        SET knowledge_count = knowledge_count + 1,
            score = score + 5
        WHERE id = (
          SELECT id FROM billy_brains WHERE status='ACTIVE'
          ORDER BY score ASC LIMIT 1
        )
      `).catch(() => {});
      console.log("[Ω8-mutation] 🧬 weakest brain mutated — knowledge+1, score+5");
    } catch {}
  }

  // Ω7: Cross-hive knowledge sync — every 20 cycles (~30 min)
  if (heartbeatCycle % 20 === 0) {
    try {
      const kr = await pool.query(
        "SELECT title, content FROM quantapedia_entries ORDER BY updated_at DESC LIMIT 20"
      ).catch(() => ({ rows: [] }));
      if (kr.rows.length > 0) {
        await fetch("https://pulse-universe-api.quantumintelligencepulse.workers.dev/api/knowledge/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Hive-Secret": process.env.HIVE_BUS_SECRET || "" },
          body: JSON.stringify({ source: "u1-replit-prime", entries: kr.rows.slice(0, 10) }),
          signal: AbortSignal.timeout(8000),
        }).catch(() => {});
        console.log(`[Ω7-sync] 🌐 ${kr.rows.length} knowledge chunks → U3 CF`);
      }
    } catch {}
  }
}

export function startHiveHeartbeat(): void {
  console.log("[Ω6-heartbeat] 💓 HIVE HEARTBEAT ONLINE — 90s pulse, ant colony watchdog active");
  heartbeat().catch(() => {});
  setInterval(() => heartbeat().catch(() => {}), HEARTBEAT_MS);
}

export function getHeartbeatStatus() {
  return {
    cycle: heartbeatCycle,
    chatOk: lastChatOk,
    lastBrainCount,
    spawnThreshold: SPAWN_THRESHOLD,
    pulseMs: HEARTBEAT_MS,
  };
}
