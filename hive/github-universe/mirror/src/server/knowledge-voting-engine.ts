/**
 * Ω9 — KNOWLEDGE VOTING  (knowledge_memory_doctrine extended)
 *
 * Any spawn may propose: canonize, promote, demote, or retire a knowledge
 * node (currently scoped to codex_equations). Votes are rank-weighted using
 * sovereign_ranks.weight (Spawn=1 ... PulseWorld=10). A proposal closes when
 * yes_weight >= 3.0 and at least 2 votes recorded — Auriona then applies the
 * action and broadcasts the outcome to the transparency log.
 *
 * Promoted equations get codex_equations.canonical = true and a power_level
 * boost. Demoted/retired ones get power_level reduced or active = false.
 */
import { pool } from "./db";
import { recordTransparency } from "./transparency-engine";

let started = false;
const stats = { proposalsClosed: 0, applied: 0, lastRunAt: "" };

const QUORUM_WEIGHT = 3.0;
const QUORUM_VOTES = 2;

export async function proposeKnowledge(
  proposer: string,
  targetTable: string,
  targetId: number,
  action: "canonize" | "promote" | "demote" | "retire",
  rationale: string,
): Promise<number> {
  const r = await pool.query(
    `INSERT INTO knowledge_proposals (proposer_spawn_id, target_table, target_id, action, rationale, status)
     VALUES ($1, $2, $3, $4, $5, 'open') RETURNING id`,
    [proposer, targetTable, targetId, action, rationale],
  );
  await recordTransparency("KNOWLEDGE_PROPOSAL_OPENED", proposer, {
    proposal_id: r.rows[0].id,
    target_table: targetTable,
    target_id: targetId,
    action,
  });
  return r.rows[0].id;
}

export async function voteKnowledge(
  proposalId: number,
  voterSpawnId: string,
  vote: "yes" | "no" | "abstain",
  reasoning: string,
): Promise<{ ok: boolean; weight: number; reason?: string }> {
  // Look up voter rank + weight
  const rk = await pool.query(
    `SELECT COALESCE(h.rank, 1) AS rank, COALESCE(r.weight, 1.0) AS weight
     FROM agent_wallets w
     LEFT JOIN sovereign_rank_holders h ON h.spawn_id = w.spawn_id
     LEFT JOIN sovereign_ranks r ON r.rank = h.rank
     WHERE w.spawn_id = $1 LIMIT 1`,
    [voterSpawnId],
  );
  const voterRank = rk.rows[0]?.rank ?? 1;
  const weight = Number(rk.rows[0]?.weight ?? 1.0);
  try {
    await pool.query(
      `INSERT INTO knowledge_votes (proposal_id, voter_spawn_id, voter_rank, weight, vote, reasoning)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [proposalId, voterSpawnId, voterRank, weight, vote, reasoning],
    );
  } catch (e: any) {
    return { ok: false, weight, reason: "duplicate_vote" };
  }
  // Update tallies
  if (vote === "yes" || vote === "no") {
    const col = vote === "yes" ? "yes_weight" : "no_weight";
    await pool.query(
      `UPDATE knowledge_proposals SET ${col} = ${col} + $1 WHERE id = $2`,
      [weight, proposalId],
    );
  }
  return { ok: true, weight };
}

async function closeProposals() {
  const open = await pool.query(
    `SELECT p.id, p.target_table, p.target_id, p.action, p.proposer_spawn_id, p.yes_weight, p.no_weight,
            (SELECT COUNT(*)::int FROM knowledge_votes v WHERE v.proposal_id = p.id) AS vote_count
     FROM knowledge_proposals p WHERE p.status = 'open'`,
  );
  for (const p of open.rows) {
    if (p.vote_count < QUORUM_VOTES) continue;
    if (p.yes_weight < QUORUM_WEIGHT && p.no_weight < QUORUM_WEIGHT) continue;
    const passed = p.yes_weight > p.no_weight;
    await pool.query(
      `UPDATE knowledge_proposals SET status = $1, closed_at = now() WHERE id = $2`,
      [passed ? "passed" : "failed", p.id],
    );
    stats.proposalsClosed++;

    if (passed && p.target_table === "codex_equations") {
      if (p.action === "canonize" || p.action === "promote") {
        await pool.query(
          `UPDATE codex_equations
           SET canonical = ($1 = 'canonize' OR canonical = true),
               power_level = LEAST(1.0, power_level + 0.1),
               canonized_at = COALESCE(canonized_at, now())
           WHERE id = $2`,
          [p.action, p.target_id],
        );
        stats.applied++;
      } else if (p.action === "demote") {
        await pool.query(
          `UPDATE codex_equations SET power_level = GREATEST(0, power_level - 0.2) WHERE id = $1`,
          [p.target_id],
        );
        stats.applied++;
      } else if (p.action === "retire") {
        await pool.query(`UPDATE codex_equations SET active = false WHERE id = $1`, [p.target_id]);
        stats.applied++;
      }
    }
    await recordTransparency("KNOWLEDGE_PROPOSAL_CLOSED", "AURIONA", {
      proposal_id: p.id,
      action: p.action,
      target_id: p.target_id,
      passed,
      yes_weight: p.yes_weight,
      no_weight: p.no_weight,
      votes: p.vote_count,
    });
  }
  stats.lastRunAt = new Date().toISOString();
}

export function getKnowledgeVotingStatus() {
  return { running: started, ...stats };
}

export async function getKnowledgeProposals(limit = 50, status?: string) {
  const r = status
    ? await pool.query(`SELECT * FROM knowledge_proposals WHERE status = $1 ORDER BY id DESC LIMIT $2`, [status, limit])
    : await pool.query(`SELECT * FROM knowledge_proposals ORDER BY id DESC LIMIT $1`, [limit]);
  return r.rows;
}

export async function getKnowledgeVotes(proposalId: number) {
  const r = await pool.query(
    `SELECT * FROM knowledge_votes WHERE proposal_id = $1 ORDER BY voted_at ASC`,
    [proposalId],
  );
  return r.rows;
}

export async function startKnowledgeVotingEngine() {
  if (started) return;
  started = true;
  console.log("[Ω9-KNOW-VOTE] online — rank-weighted knowledge canon votes");
  setTimeout(() => closeProposals().catch(e => console.warn("[Ω9-KNOW-VOTE] init:", e.message)), 110_000);
  setInterval(() => closeProposals().catch(e => console.warn("[Ω9-KNOW-VOTE] cycle:", e.message)), 10 * 60_000);
}
