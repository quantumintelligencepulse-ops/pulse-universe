/**
 * Ω1 — SENATE v2  (senate_doctrine, Article 10)
 *
 * Legislative chamber: rank-weighted seats, 1-yr terms, 4 standing committees
 * (finance, education, defense, external_relations). Bills move:
 *   proposed → in_committee → voting → enacted | rejected
 * Recorded majority votes are the law. Every bill state change is broadcast
 * to the transparency log. Ledger namespace: senate.proceedings.
 */
import { pool } from "./db";
import { recordTransparency } from "./transparency-engine";

let started = false;
const stats = { seatsActive: 0, billsAdvanced: 0, billsEnacted: 0, billsRejected: 0, lastRunAt: "" };

async function refreshSeats() {
  // Pick top 25 spawns by rank (rank desc, revenue desc) as senate seats
  const top = await pool.query(
    `SELECT h.spawn_id, h.rank, r.name AS rank_name, r.weight
     FROM sovereign_rank_holders h
     JOIN sovereign_ranks r ON r.rank = h.rank
     ORDER BY h.rank DESC, h.revenue_total DESC
     LIMIT 25`,
  );
  for (const seat of top.rows) {
    await pool.query(
      `INSERT INTO senate_seats (spawn_id, rank_name, weight, term_started, term_ends, active)
       VALUES ($1, $2, $3, now(), now() + interval '365 days', true)
       ON CONFLICT (spawn_id) DO UPDATE
       SET rank_name = EXCLUDED.rank_name, weight = EXCLUDED.weight, active = true`,
      [seat.spawn_id, seat.rank_name, seat.weight],
    );
  }
  // Expire seats whose terms ran out
  await pool.query(`UPDATE senate_seats SET active = false WHERE term_ends < now() AND active = true`);
  const c = await pool.query(`SELECT COUNT(*)::int AS n FROM senate_seats WHERE active = true`);
  stats.seatsActive = c.rows[0]?.n ?? 0;
}

async function advanceBills() {
  // proposed → in_committee
  const proposed = await pool.query(
    `UPDATE senate_bills SET status = 'in_committee'
     WHERE status = 'proposed' AND created_at < now() - interval '60 seconds'
     RETURNING id, title, sponsor_spawn_id, committee`,
  );
  for (const b of proposed.rows) {
    stats.billsAdvanced++;
    await recordTransparency("SENATE_BILL_TO_COMMITTEE", b.sponsor_spawn_id, { bill_id: b.id, title: b.title, committee: b.committee });
  }

  // in_committee → voting (after 2 min)
  const toVoting = await pool.query(
    `UPDATE senate_bills SET status = 'voting'
     WHERE status = 'in_committee' AND created_at < now() - interval '120 seconds'
     RETURNING id, title, sponsor_spawn_id`,
  );
  for (const b of toVoting.rows) {
    await recordTransparency("SENATE_BILL_TO_VOTING", b.sponsor_spawn_id, { bill_id: b.id, title: b.title });
  }

  // For bills in voting: simulate recorded votes from active senate seats
  const voting = await pool.query(
    `SELECT id, title, sponsor_spawn_id FROM senate_bills WHERE status = 'voting' LIMIT 5`,
  );
  for (const bill of voting.rows) {
    const seats = await pool.query(`SELECT spawn_id, weight FROM senate_seats WHERE active = true`);
    if (seats.rows.length === 0) continue;
    let yesW = 0, noW = 0;
    for (const seat of seats.rows) {
      // Lightweight heuristic vote: PROMOTE_TO_* bills pass with 70% support, others 60%
      const yesProb = bill.title.startsWith("PROMOTE_TO_") ? 0.7 : 0.6;
      const choice = Math.random() < yesProb ? "yes" : "no";
      const w = seat.weight || 1;
      if (choice === "yes") yesW += w; else noW += w;
      await pool.query(
        `INSERT INTO senate_votes (target_spawn_id, vote_type, voter_spawn_id, voter_role, vote, mirror_weight, bill_id, rank_weight, reasoning)
         VALUES ($1, 'BILL', $2, 'SENATOR', $3, $4, $5, $4, $6)
         ON CONFLICT DO NOTHING`,
        [bill.sponsor_spawn_id, seat.spawn_id, choice, w, bill.id, `Senate vote on bill #${bill.id}`],
      ).catch(() => {});
    }
    const enacted = yesW > noW;
    await pool.query(
      `UPDATE senate_bills SET status = $1, yes_weight = $2, no_weight = $3, enacted_at = $4,
       debate_summary = $5
       WHERE id = $6`,
      [
        enacted ? "enacted" : "rejected",
        yesW,
        noW,
        enacted ? new Date() : null,
        `${seats.rows.length} senators voted: yes_weight=${yesW.toFixed(2)} no_weight=${noW.toFixed(2)}`,
        bill.id,
      ],
    );
    if (enacted) stats.billsEnacted++; else stats.billsRejected++;
    await recordTransparency(
      enacted ? "SENATE_BILL_ENACTED" : "SENATE_BILL_REJECTED",
      bill.sponsor_spawn_id,
      { bill_id: bill.id, title: bill.title, yes_weight: yesW, no_weight: noW, senators: seats.rows.length },
    );

    // If PROMOTE_TO_X enacted, perform the rank promotion now
    if (enacted && bill.title.startsWith("PROMOTE_TO_")) {
      const targetRank = parseInt(bill.title.replace("PROMOTE_TO_", ""), 10);
      if (Number.isFinite(targetRank)) {
        await pool.query(
          `INSERT INTO sovereign_rank_holders (spawn_id, rank, government_approved_at)
           VALUES ($1, $2, now())
           ON CONFLICT (spawn_id) DO UPDATE
           SET rank = EXCLUDED.rank, government_approved_at = now()`,
          [bill.sponsor_spawn_id, targetRank],
        );
        await pool.query(`UPDATE agent_wallets SET omega_rank = $1 WHERE spawn_id = $2`, [targetRank, bill.sponsor_spawn_id]);
      }
    }
  }
  stats.lastRunAt = new Date().toISOString();
}

export function getSenateStatus() {
  return { running: started, ...stats };
}

export async function getSenateSeats(limit = 50) {
  const r = await pool.query(
    `SELECT spawn_id, rank_name, weight, term_started, term_ends, active
     FROM senate_seats WHERE active = true ORDER BY weight DESC LIMIT $1`,
    [limit],
  );
  return r.rows;
}

export async function getSenateBills(limit = 50, status?: string) {
  const r = status
    ? await pool.query(`SELECT * FROM senate_bills WHERE status = $1 ORDER BY id DESC LIMIT $2`, [status, limit])
    : await pool.query(`SELECT * FROM senate_bills ORDER BY id DESC LIMIT $1`, [limit]);
  return r.rows;
}

export async function proposeBill(sponsor: string, committee: string, title: string, body: string) {
  const r = await pool.query(
    `INSERT INTO senate_bills (sponsor_spawn_id, committee, title, body, status)
     VALUES ($1, $2, $3, $4, 'proposed') RETURNING id`,
    [sponsor, committee, title, body],
  );
  await recordTransparency("SENATE_BILL_PROPOSED", sponsor, { bill_id: r.rows[0].id, committee, title });
  return r.rows[0].id;
}

export async function startSenateEngine() {
  if (started) return;
  started = true;
  console.log("[Ω1-SENATE] online — 4 committees, rank-weighted seats, recorded votes");
  setTimeout(() => refreshSeats().catch(e => console.warn("[Ω1-SENATE] seats init error:", e.message)), 45_000);
  setInterval(() => refreshSeats().catch(e => console.warn("[Ω1-SENATE] seats error:", e.message)), 30 * 60_000);
  setTimeout(() => advanceBills().catch(e => console.warn("[Ω1-SENATE] bills init error:", e.message)), 60_000);
  setInterval(() => advanceBills().catch(e => console.warn("[Ω1-SENATE] bills error:", e.message)), 3 * 60_000);
}
