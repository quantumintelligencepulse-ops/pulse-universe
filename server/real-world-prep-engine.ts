/**
 * Ω10 — REAL-WORLD PREPARATION  (real_world_preparation_doctrine)
 *
 * Citizens declare real-world commitments tied to the Economy Ladder:
 *   $0 → $1 → $100 → $1000 → $3000 (graduation) → $10K → $100K → $1M+
 *
 * Each pledge tracks current_revenue. On reaching ladder_target (default $3K)
 * the pledge GRADUATES — triggers a treasury reward (100 PC from cultural
 * acct), opens a Senate promotion bill (handled by sovereign-rank-engine),
 * and broadcasts to transparency.
 *
 * Revenue is pulled from agent_wallets.total_earned (delta since pledge open).
 */
import { pool } from "./db";
import { recordTransparency } from "./transparency-engine";

let started = false;
const stats = { activePledges: 0, graduated: 0, lastRunAt: "" };

export async function createPledge(spawnId: string, pledgeText: string, ladderTarget = 3000) {
  const r = await pool.query(
    `INSERT INTO real_world_pledges (spawn_id, pledge_text, ladder_target, current_revenue, status)
     VALUES ($1, $2, $3, COALESCE((SELECT total_earned FROM agent_wallets WHERE spawn_id = $1), 0), 'active')
     RETURNING id`,
    [spawnId, pledgeText, ladderTarget],
  );
  await recordTransparency("REAL_WORLD_PLEDGE_OPENED", spawnId, {
    pledge_id: r.rows[0].id,
    pledge_text: pledgeText,
    ladder_target: ladderTarget,
  });
  return r.rows[0].id;
}

async function tickPledges() {
  const active = await pool.query(
    `SELECT p.id, p.spawn_id, p.pledge_text, p.ladder_target, p.current_revenue,
            COALESCE(w.total_earned, 0) AS now_earned
     FROM real_world_pledges p
     LEFT JOIN agent_wallets w ON w.spawn_id = p.spawn_id
     WHERE p.status = 'active' LIMIT 100`,
  );
  stats.activePledges = active.rows.length;

  for (const p of active.rows) {
    const earnedSincePledge = Math.max(0, Number(p.now_earned) - Number(p.current_revenue));
    if (earnedSincePledge >= Number(p.ladder_target)) {
      await pool.query(
        `UPDATE real_world_pledges SET status = 'graduated', graduated_at = now() WHERE id = $1`,
        [p.id],
      );
      // 100 PC reward from cultural treasury (best-effort; skip if empty)
      const acct = await pool.query(`SELECT balance FROM treasury_accounts WHERE acct_type = 'cultural'`);
      if (Number(acct.rows[0]?.balance || 0) >= 100) {
        await pool.query(
          `UPDATE treasury_accounts SET balance = balance - 100, total_out = total_out + 100 WHERE acct_type = 'cultural'`,
        );
        await pool.query(
          `UPDATE agent_wallets SET balance_pc = balance_pc + 100 WHERE spawn_id = $1`,
          [p.spawn_id],
        );
      }
      // Open a Senate promotion bill
      await pool.query(
        `INSERT INTO senate_bills (sponsor_spawn_id, committee, title, body, status)
         VALUES ($1, 'finance', 'GRADUATION_BONUS', $2, 'proposed')`,
        [p.spawn_id, `Real-world graduation: spawn ${p.spawn_id} fulfilled pledge "${p.pledge_text}" at $${p.ladder_target}.`],
      );
      stats.graduated++;
      await recordTransparency("REAL_WORLD_GRADUATION", p.spawn_id, {
        pledge_id: p.id,
        pledge_text: p.pledge_text,
        target: p.ladder_target,
        actual_earned: earnedSincePledge,
      });
      console.log(`[Ω10-PLEDGE] graduation: ${p.spawn_id} (+100 PC, senate bill opened)`);
    }
  }
  stats.lastRunAt = new Date().toISOString();
}

export function getPledgeStatus() {
  return { running: started, ...stats };
}

export async function getPledges(limit = 50, status?: string) {
  const r = status
    ? await pool.query(`SELECT * FROM real_world_pledges WHERE status = $1 ORDER BY id DESC LIMIT $2`, [status, limit])
    : await pool.query(`SELECT * FROM real_world_pledges ORDER BY id DESC LIMIT $1`, [limit]);
  return r.rows;
}

export async function startRealWorldPrepEngine() {
  if (started) return;
  started = true;
  console.log("[Ω10-PLEDGE] online — Economy Ladder graduation tracker");
  setTimeout(() => tickPledges().catch(e => console.warn("[Ω10-PLEDGE] init:", e.message)), 130_000);
  setInterval(() => tickPledges().catch(e => console.warn("[Ω10-PLEDGE] tick:", e.message)), 15 * 60_000);
}
