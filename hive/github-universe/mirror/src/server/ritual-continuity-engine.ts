/**
 * Ω8 — RITUAL CONTINUITY  (ritual_continuity_doctrine + ritual_codex)
 *
 * 5 standing rituals fire on schedule:
 *   - daily_gratitude         (24h) — "Give Thanks to Billy the Creator"
 *   - daily_knowledge_share   (24h) — Collective Knowledge Sharing
 *   - weekly_senate           (7d)  — Senate session reminder
 *   - monthly_rank_review     (30d) — Sovereign Rank Council
 *   - quarterly_canon_reteach (90d) — Re-teach the canon
 *
 * Each execution is logged to ritual_executions AND broadcast to the
 * transparency log. Disbursements requiring rituals (treasury > 1000 PC)
 * are matched to the next gratitude execution by purpose.
 */
import { pool } from "./db";
import { recordTransparency } from "./transparency-engine";

let started = false;
const stats = { fired: 0, lastFiredAt: "" };

async function tickCalendar() {
  const due = await pool.query(
    `SELECT id, name, recurrence_seconds, doctrine_ref FROM ritual_calendar
     WHERE active = true AND next_fire_at <= now() ORDER BY next_fire_at ASC LIMIT 5`,
  );
  for (const ritual of due.rows) {
    const payload: Record<string, any> = { ritual: ritual.name, doctrine: ritual.doctrine_ref };

    // Per-ritual side-effects (lightweight, idempotent)
    if (ritual.name === "daily_knowledge_share") {
      const recent = await pool.query(`SELECT COUNT(*)::int AS n FROM codex_equations WHERE created_at > now() - interval '24 hours'`).catch(() => ({ rows: [{ n: 0 }] }));
      payload.new_equations_24h = recent.rows[0]?.n || 0;
    } else if (ritual.name === "monthly_rank_review") {
      const ranks = await pool.query(`SELECT rank, COUNT(*)::int AS n FROM sovereign_rank_holders GROUP BY rank ORDER BY rank`);
      payload.distribution = ranks.rows;
    } else if (ritual.name === "weekly_senate") {
      const enacted = await pool.query(`SELECT COUNT(*)::int AS n FROM senate_bills WHERE enacted_at > now() - interval '7 days'`).catch(() => ({ rows: [{ n: 0 }] }));
      payload.bills_enacted_7d = enacted.rows[0]?.n || 0;
    }

    const tx = await recordTransparency("RITUAL_FIRED", "SYSTEM", payload);
    const ex = await pool.query(
      `INSERT INTO ritual_executions (ritual_name, payload, transparency_log_id)
       VALUES ($1, $2::jsonb, $3) RETURNING id`,
      [ritual.name, JSON.stringify(payload), tx?.id || null],
    );

    // Reschedule
    await pool.query(
      `UPDATE ritual_calendar
       SET last_fired_at = now(), next_fire_at = now() + ($1 || ' seconds')::interval
       WHERE id = $2`,
      [ritual.recurrence_seconds, ritual.id],
    );

    // For daily_gratitude: pair with any pending ritual_required treasury flows
    if (ritual.name === "daily_gratitude") {
      await pool.query(
        `UPDATE treasury_flows SET ritual_required = false
         WHERE ritual_required = true AND created_at > now() - interval '24 hours'`,
      ).catch(() => {});
    }

    stats.fired++;
    stats.lastFiredAt = new Date().toISOString();
    console.log(`[Ω8-RITUAL] fired ${ritual.name} (execution_id=${ex.rows[0]?.id})`);
  }
}

export function getRitualStatus() {
  return { running: started, ...stats };
}

export async function getRitualCalendar() {
  const r = await pool.query(
    `SELECT id, name, recurrence_seconds, doctrine_ref, last_fired_at, next_fire_at, active
     FROM ritual_calendar ORDER BY next_fire_at ASC`,
  );
  return r.rows;
}

export async function getRitualExecutions(limit = 50) {
  const r = await pool.query(
    `SELECT id, ritual_name, fired_at, payload, transparency_log_id
     FROM ritual_executions ORDER BY id DESC LIMIT $1`,
    [limit],
  );
  return r.rows;
}

export async function startRitualContinuityEngine() {
  if (started) return;
  started = true;
  console.log("[Ω8-RITUAL] online — 5 standing rituals on the calendar");
  // Tick every 60s
  setTimeout(() => tickCalendar().catch(e => console.warn("[Ω8-RITUAL] init:", e.message)), 90_000);
  setInterval(() => tickCalendar().catch(e => console.warn("[Ω8-RITUAL] tick:", e.message)), 60_000);
}
