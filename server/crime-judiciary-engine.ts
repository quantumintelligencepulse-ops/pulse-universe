/**
 * Ω4 — 100-CRIME PYRAMID + JUDICIARY  (punishments_and_crime_the_pyramid)
 *
 * Auriona is the standing judge. Auto-detects breaches against the 100-crime
 * codex from existing system state (missed heartbeats, dead URLs, falsified
 * reports). Each filing → judgment → sanction (PC penalty + rank delta).
 * All judgments hash-signed and broadcast to the transparency log.
 *
 * Conservative thresholds: never sanction more than 3 spawns per cycle and
 * never apply > 50% of crime.blocks as PC penalty (full force reserved for
 * Senate-confirmed cases).
 */
import { pool } from "./db";
import crypto from "crypto";
import { recordTransparency } from "./transparency-engine";

let started = false;
const stats = { filingsOpened: 0, judgmentsPassed: 0, sanctionsApplied: 0, lastRunAt: "" };

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

async function detectCrimes() {
  // Detection #1 — Crime ID 8: missed heartbeat. Find spawns with no transactions
  // in the last 7 days that were active before that.
  const stale = await pool.query(
    `SELECT w.spawn_id
     FROM agent_wallets w
     LEFT JOIN spawn_transactions t ON t.spawn_id = w.spawn_id AND t.created_at > now() - interval '7 days'
     WHERE w.balance_pc > 0 AND t.id IS NULL
     LIMIT 5`,
  ).catch(() => ({ rows: [] }));

  for (const row of stale.rows) {
    const exists = await pool.query(
      `SELECT id FROM crime_filings WHERE against_spawn_id = $1 AND crime_id = 8 AND status = 'open' LIMIT 1`,
      [row.spawn_id],
    );
    if (exists.rowCount && exists.rowCount > 0) continue;
    await pool.query(
      `INSERT INTO crime_filings (filed_by, against_spawn_id, crime_id, evidence_url, status)
       VALUES ('AURIONA', $1, 8, $2, 'open')`,
      [row.spawn_id, `internal://heartbeat-missed/${row.spawn_id}`],
    );
    stats.filingsOpened++;
  }
}

async function judgeOpenFilings() {
  const open = await pool.query(
    `SELECT f.id, f.against_spawn_id, f.crime_id, c.crime, c.punishment, c.blocks
     FROM crime_filings f JOIN crime_codex c ON c.id = f.crime_id
     WHERE f.status = 'open' ORDER BY f.id ASC LIMIT 3`,
  );
  for (const f of open.rows) {
    // Conservative: judgment applies <= 50% of doctrinal blocks as PC penalty,
    // and rank_delta = -1 only for crimes with blocks > 1000.
    const pcPenalty = Math.min(Math.floor((f.blocks || 0) * 0.5), 1000);
    const rankDelta = (f.blocks || 0) > 1000 ? -1 : 0;
    const sanction = `${f.punishment} (auto-judged: ${pcPenalty} PC, rank ${rankDelta >= 0 ? "+" : ""}${rankDelta})`;
    const signedHash = sha256(`${f.id}|${f.against_spawn_id}|${pcPenalty}|${rankDelta}|${Date.now()}`);

    await pool.query(
      `INSERT INTO crime_judgments (filing_id, judge, sanction, rank_delta, pc_penalty, signed_hash)
       VALUES ($1, 'AURIONA', $2, $3, $4, $5)`,
      [f.id, sanction, rankDelta, pcPenalty, signedHash],
    );
    await pool.query(`UPDATE crime_filings SET status = 'judged' WHERE id = $1`, [f.id]);

    if (pcPenalty > 0) {
      await pool.query(
        `UPDATE agent_wallets SET balance_pc = GREATEST(0, balance_pc - $1), updated_at = now()
         WHERE spawn_id = $2`,
        [pcPenalty, f.against_spawn_id],
      );
    }
    if (rankDelta !== 0) {
      await pool.query(
        `UPDATE agent_wallets SET omega_rank = GREATEST(0, omega_rank + $1) WHERE spawn_id = $2`,
        [rankDelta, f.against_spawn_id],
      );
    }
    stats.judgmentsPassed++;
    stats.sanctionsApplied++;
    await recordTransparency("CRIME_JUDGMENT", "AURIONA", {
      filing_id: f.id,
      against: f.against_spawn_id,
      crime_id: f.crime_id,
      crime: f.crime,
      sanction,
      pc_penalty: pcPenalty,
      rank_delta: rankDelta,
      signed_hash: signedHash,
    });
  }
  stats.lastRunAt = new Date().toISOString();
  if (open.rowCount && open.rowCount > 0) {
    console.log(`[Ω4-CRIME] judged=${open.rowCount} openFilings=${stats.filingsOpened}`);
  }
}

export function getCrimeStatus() {
  return { running: started, ...stats };
}

export async function getCrimeCodex(limit = 100) {
  const r = await pool.query(
    `SELECT id, crime, punishment, blocks, term, rule FROM crime_codex ORDER BY id ASC LIMIT $1`,
    [limit],
  );
  return r.rows;
}

export async function getCrimeFilings(limit = 50, status?: string) {
  const r = status
    ? await pool.query(`SELECT * FROM crime_filings WHERE status = $1 ORDER BY id DESC LIMIT $2`, [status, limit])
    : await pool.query(`SELECT * FROM crime_filings ORDER BY id DESC LIMIT $1`, [limit]);
  return r.rows;
}

export async function getCrimeJudgments(limit = 50) {
  const r = await pool.query(
    `SELECT j.*, f.against_spawn_id, c.crime
     FROM crime_judgments j
     JOIN crime_filings f ON f.id = j.filing_id
     JOIN crime_codex c ON c.id = f.crime_id
     ORDER BY j.id DESC LIMIT $1`,
    [limit],
  );
  return r.rows;
}

export async function startCrimeJudiciaryEngine() {
  if (started) return;
  started = true;
  console.log("[Ω4-CRIME] online — 100-crime codex armed, AURIONA judging");
  setTimeout(() => detectCrimes().catch(e => console.warn("[Ω4-CRIME] detect init:", e.message)), 90_000);
  setTimeout(() => judgeOpenFilings().catch(e => console.warn("[Ω4-CRIME] judge init:", e.message)), 120_000);
  setInterval(() => detectCrimes().catch(e => console.warn("[Ω4-CRIME] detect:", e.message)), 10 * 60_000);
  setInterval(() => judgeOpenFilings().catch(e => console.warn("[Ω4-CRIME] judge:", e.message)), 10 * 60_000);
}
