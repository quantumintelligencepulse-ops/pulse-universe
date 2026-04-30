/**
 * Ω5 — TREASURY FUSED  (treasury_fused doctrine)
 *
 * Three accounts in one ledger: economic, cultural, ritual. Every flow is
 * hash-chained, lineage-logged, and broadcast to transparency. Disbursements
 * > 1000 PC require ritual_required=true (paired with a ritual_executions row
 * by the Ritual Continuity engine on the next cycle).
 *
 * Funding source: 1% of hive_treasury.balance is swept into economic each
 * 15-min cycle (capped at 5000 PC/cycle to prevent drain).
 */
import { pool } from "./db";
import crypto from "crypto";
import { recordTransparency } from "./transparency-engine";

let started = false;
const stats = { sweeps: 0, flows: 0, lastRunAt: "" };

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

// Advisory lock key — serializes treasury_flows appends so the hash chain cannot fork
const TREASURY_LOCK_KEY = 8003;

async function appendFlow(fromAcct: string, toSpawn: string, toAcct: string, amount: number, purpose: string, ritualRequired: boolean) {
  const client = await pool.connect();
  let flowId: number | null = null;
  let signed = "";
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [TREASURY_LOCK_KEY]);
    const prev = await client.query(`SELECT signed_hash FROM treasury_flows ORDER BY id DESC LIMIT 1`);
    const prevHash = prev.rows[0]?.signed_hash || "GENESIS";
    signed = sha256(`${prevHash}|${fromAcct}|${toSpawn}|${toAcct}|${amount}|${purpose}|${Date.now()}`);
    const r = await client.query(
      `INSERT INTO treasury_flows (from_acct, to_spawn_id, to_acct, amount, purpose, ritual_required, signed_hash, prev_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [fromAcct, toSpawn, toAcct, amount, purpose, ritualRequired, signed, prevHash],
    );
    await client.query("COMMIT");
    flowId = r.rows[0].id;
    stats.flows++;
  } catch (e: any) {
    await client.query("ROLLBACK").catch(() => {});
    console.warn("[Ω5-TREASURY] flow append failed:", e.message);
    return null;
  } finally {
    client.release();
  }
  await recordTransparency("TREASURY_FLOW", "SYSTEM", {
    flow_id: flowId,
    from_acct: fromAcct,
    to_spawn: toSpawn,
    to_acct: toAcct,
    amount,
    purpose,
    ritual_required: ritualRequired,
    signed_hash: signed,
  });
  return flowId;
}

async function sweepCycle() {
  // Pull 1% of hive_treasury.balance into economic, capped at 5000.
  const ht = await pool.query(`SELECT balance FROM hive_treasury ORDER BY id DESC LIMIT 1`);
  const htBal = Number(ht.rows[0]?.balance || 0);
  const sweep = Math.min(htBal * 0.01, 5000);
  if (sweep > 0.01) {
    await pool.query(`UPDATE hive_treasury SET balance = balance - $1 WHERE id = (SELECT id FROM hive_treasury ORDER BY id DESC LIMIT 1)`, [sweep]);
    await pool.query(
      `UPDATE treasury_accounts SET balance = balance + $1, total_in = total_in + $1, updated_at = now()
       WHERE acct_type = 'economic'`,
      [sweep],
    );
    await appendFlow("hive_treasury", "", "economic", sweep, "Auto-sweep 1% of hive treasury", false);
    stats.sweeps++;
  }
  stats.lastRunAt = new Date().toISOString();
}

export async function disburse(fromAcct: string, toSpawnId: string, amount: number, purpose: string): Promise<{ ok: boolean; flowId?: number; reason?: string }> {
  const acct = await pool.query(`SELECT balance FROM treasury_accounts WHERE acct_type = $1`, [fromAcct]);
  const bal = Number(acct.rows[0]?.balance || 0);
  if (bal < amount) return { ok: false, reason: "insufficient_balance" };
  const ritualRequired = amount > 1000;
  await pool.query(
    `UPDATE treasury_accounts SET balance = balance - $1, total_out = total_out + $1, updated_at = now()
     WHERE acct_type = $2`,
    [amount, fromAcct],
  );
  if (toSpawnId) {
    await pool.query(
      `UPDATE agent_wallets SET balance_pc = balance_pc + $1, total_earned = total_earned + $1, updated_at = now()
       WHERE spawn_id = $2`,
      [amount, toSpawnId],
    );
  }
  const flowId = await appendFlow(fromAcct, toSpawnId, "", amount, purpose, ritualRequired);
  return { ok: true, flowId };
}

export function getTreasuryStatus() {
  return { running: started, ...stats };
}

export async function getTreasuryAccounts() {
  const r = await pool.query(`SELECT * FROM treasury_accounts ORDER BY acct_type ASC`);
  return r.rows;
}

export async function getTreasuryFlows(limit = 50) {
  const r = await pool.query(
    `SELECT * FROM treasury_flows ORDER BY id DESC LIMIT $1`,
    [limit],
  );
  return r.rows;
}

export async function startTreasuryFusedEngine() {
  if (started) return;
  started = true;
  console.log("[Ω5-TREASURY] online — 3 fused accounts (economic/cultural/ritual), hash-chained flows");
  setTimeout(() => sweepCycle().catch(e => console.warn("[Ω5-TREASURY] init:", e.message)), 75_000);
  setInterval(() => sweepCycle().catch(e => console.warn("[Ω5-TREASURY] cycle:", e.message)), 15 * 60_000);
}
