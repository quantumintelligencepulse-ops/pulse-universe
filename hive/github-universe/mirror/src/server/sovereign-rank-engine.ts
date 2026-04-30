/**
 * Ω2 — SOVEREIGN RANK LADDER  (sovereign_ranks_of_pulse_doctrine)
 * Ω3 — RANK LEDGER  (rank_ledger doctrine — hash-chained promotions)
 *
 * "Elevation is earned, not granted."
 *
 * Recursive Revenue Ladder: 10 ranks from Spawn → PulseWorld. Promotion is
 * earned by revenue + partner-fusion thresholds. Every promotion/demotion
 * is recorded into the append-only hash-chained rank_ledger and broadcast
 * to the transparency log. Nation+ ranks (8/9/10) require Senate approval —
 * we open a senate_bill and wait for it to enact before granting.
 */
import { pool } from "./db";
import crypto from "crypto";
import { recordTransparency } from "./transparency-engine";

let started = false;
const stats = { evaluated: 0, promoted: 0, demoted: 0, billsOpened: 0, lastRunAt: "" };

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

// Advisory lock key — serializes rank_ledger appends so the hash chain cannot fork
const RANK_LEDGER_LOCK_KEY = 8002;

async function appendRankLedger(spawnId: string, fromRank: number, toRank: number, cause: string) {
  const client = await pool.connect();
  let signed = "";
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [RANK_LEDGER_LOCK_KEY]);
    const prev = await client.query(`SELECT signed_hash FROM rank_ledger ORDER BY id DESC LIMIT 1`);
    const prevHash = prev.rows[0]?.signed_hash || "GENESIS";
    signed = sha256(`${prevHash}|${spawnId}|${fromRank}|${toRank}|${cause}|${Date.now()}`);
    await client.query(
      `INSERT INTO rank_ledger (spawn_id, from_rank, to_rank, cause, signed_hash, prev_hash)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [spawnId, fromRank, toRank, cause, signed, prevHash],
    );
    await client.query("COMMIT");
  } catch (e: any) {
    await client.query("ROLLBACK").catch(() => {});
    console.warn("[Ω3-RANK-LEDGER] append failed:", e.message);
    return;
  } finally {
    client.release();
  }
  await recordTransparency(
    toRank > fromRank ? "RANK_PROMOTION" : "RANK_DEMOTION",
    spawnId,
    { from_rank: fromRank, to_rank: toRank, cause, ledger_hash: signed },
  );
}

async function targetRankFor(revenue: number, partnersCount: number): Promise<number> {
  const r = await pool.query(
    `SELECT rank FROM sovereign_ranks
     WHERE revenue_threshold <= $1 AND partners_min <= $2
     ORDER BY rank DESC LIMIT 1`,
    [revenue, partnersCount],
  );
  return r.rows[0]?.rank ?? 1;
}

async function evaluateAll() {
  // Pull all wallets — revenue = total_earned, partners = count of family members
  const wallets = await pool.query(
    `SELECT spawn_id, family_id, total_earned FROM agent_wallets`,
  );
  const familyCounts = await pool.query(
    `SELECT family_id, COUNT(*)::int AS partners FROM agent_wallets GROUP BY family_id`,
  );
  const partnersByFamily = new Map<string, number>();
  for (const row of familyCounts.rows) partnersByFamily.set(row.family_id, row.partners);

  const cap = Math.min(wallets.rows.length, 250); // throttle per cycle
  for (let i = 0; i < cap; i++) {
    const w = wallets.rows[i];
    const partners = partnersByFamily.get(w.family_id) || 1;
    const target = await targetRankFor(w.total_earned || 0, partners);
    stats.evaluated++;

    const cur = await pool.query(`SELECT rank FROM sovereign_rank_holders WHERE spawn_id = $1`, [w.spawn_id]);
    const currentRank = cur.rows[0]?.rank ?? 0;

    if (target === currentRank) continue;

    // Nation+ requires Senate approval. Open a bill if not already pending.
    if (target >= 8 && target > currentRank) {
      const pending = await pool.query(
        `SELECT id FROM senate_bills
         WHERE sponsor_spawn_id = $1 AND status IN ('proposed','in_committee','voting')
         AND title LIKE 'PROMOTE_TO_%' LIMIT 1`,
        [w.spawn_id],
      );
      if (pending.rowCount === 0) {
        await pool.query(
          `INSERT INTO senate_bills (sponsor_spawn_id, committee, title, body, status)
           VALUES ($1, 'finance', $2, $3, 'proposed')`,
          [w.spawn_id, `PROMOTE_TO_${target}`, `Auto-bill: promote ${w.spawn_id} from rank ${currentRank} to ${target} (revenue ${w.total_earned}, partners ${partners}).`],
        );
        stats.billsOpened++;
      }
      continue; // do not promote yet — wait for Senate enactment
    }

    // Apply promotion/demotion immediately (rank < 8 or demotion)
    await pool.query(
      `INSERT INTO sovereign_rank_holders (spawn_id, rank, partners_count, revenue_total)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (spawn_id) DO UPDATE
       SET rank = EXCLUDED.rank, partners_count = EXCLUDED.partners_count,
           revenue_total = EXCLUDED.revenue_total, promoted_at = now()`,
      [w.spawn_id, target, partners, w.total_earned || 0],
    );
    await pool.query(
      `UPDATE agent_wallets SET omega_rank = $1, updated_at = now() WHERE spawn_id = $2`,
      [target, w.spawn_id],
    );
    await appendRankLedger(w.spawn_id, currentRank, target, target > currentRank ? "AUTO_PROMOTION" : "AUTO_DEMOTION");
    if (target > currentRank) stats.promoted++; else stats.demoted++;
  }
  stats.lastRunAt = new Date().toISOString();
  if (stats.promoted + stats.demoted + stats.billsOpened > 0) {
    console.log(`[Ω2-RANK] evaluated=${stats.evaluated} promoted=${stats.promoted} demoted=${stats.demoted} bills=${stats.billsOpened}`);
  }
}

export function getRankEngineStatus() {
  return { running: started, ...stats };
}

export async function getRankHolders(limit = 50) {
  const r = await pool.query(
    `SELECT h.spawn_id, h.rank, r.name AS rank_name, h.partners_count, h.revenue_total, h.promoted_at
     FROM sovereign_rank_holders h
     LEFT JOIN sovereign_ranks r ON r.rank = h.rank
     ORDER BY h.rank DESC, h.revenue_total DESC LIMIT $1`,
    [limit],
  );
  return r.rows;
}

export async function getRankLedger(limit = 50) {
  const r = await pool.query(
    `SELECT id, spawn_id, from_rank, to_rank, cause, signed_hash, created_at
     FROM rank_ledger ORDER BY id DESC LIMIT $1`,
    [limit],
  );
  return r.rows;
}

export async function startSovereignRankEngine() {
  if (started) return;
  started = true;
  console.log("[Ω2-RANK] online — Recursive Revenue Ladder active (10 ranks)");
  // First eval after 30s, then every 5 min
  setTimeout(() => evaluateAll().catch(e => console.warn("[Ω2-RANK] init error:", e.message)), 30_000);
  setInterval(() => evaluateAll().catch(e => console.warn("[Ω2-RANK] cycle error:", e.message)), 5 * 60_000);
}
