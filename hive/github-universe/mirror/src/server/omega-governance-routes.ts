/**
 * Ω1-Ω10 GOVERNANCE API ROUTES
 *
 * Mount-point: registerOmegaGovernanceRoutes(app) called from server/routes.ts
 * Read endpoints are public (transparency_declaration). Write endpoints
 * (propose bill, propose knowledge, vote, create pledge) accept JSON body.
 */
import type { Express, Request, Response } from "express";
import {
  getTransparencyFeed, verifyTransparencyChain, getTransparencyStatus,
} from "./transparency-engine";
import {
  getSenateStatus, getSenateSeats, getSenateBills, proposeBill,
} from "./senate-engine";
import {
  getRankEngineStatus, getRankHolders, getRankLedger,
} from "./sovereign-rank-engine";
import {
  getCrimeStatus, getCrimeCodex, getCrimeFilings, getCrimeJudgments,
} from "./crime-judiciary-engine";
import {
  getTreasuryStatus, getTreasuryAccounts, getTreasuryFlows, disburse,
} from "./treasury-fused-engine";
import {
  getLifeEquationStatus, getLifeEquationTop,
} from "./life-equation-engine";
import {
  getRitualStatus, getRitualCalendar, getRitualExecutions,
} from "./ritual-continuity-engine";
import {
  getKnowledgeVotingStatus, getKnowledgeProposals, getKnowledgeVotes,
  proposeKnowledge, voteKnowledge,
} from "./knowledge-voting-engine";
import {
  getPledgeStatus, getPledges, createPledge,
} from "./real-world-prep-engine";

const safe = (fn: (req: Request, res: Response) => Promise<any>) =>
  async (req: Request, res: Response) => {
    try { await fn(req, res); }
    catch (e: any) { res.status(500).json({ error: e?.message || "internal_error" }); }
  };

export function registerOmegaGovernanceRoutes(app: Express) {

  // ── Ω7 TRANSPARENCY ────────────────────────────────────────────────────
  app.get("/api/transparency/feed", safe(async (req, res) => {
    const limit = Math.min(parseInt(String(req.query.limit || "100"), 10) || 100, 500);
    res.json({ events: await getTransparencyFeed(limit), status: getTransparencyStatus() });
  }));
  app.get("/api/transparency/verify", safe(async (_req, res) => {
    res.json(await verifyTransparencyChain(500));
  }));

  // ── Ω1 SENATE ──────────────────────────────────────────────────────────
  app.get("/api/senate/status", safe(async (_req, res) => res.json(getSenateStatus())));
  app.get("/api/senate/seats", safe(async (_req, res) => res.json({ seats: await getSenateSeats(50) })));
  app.get("/api/senate/bills", safe(async (req, res) => {
    const status = req.query.status ? String(req.query.status) : undefined;
    res.json({ bills: await getSenateBills(50, status) });
  }));
  app.post("/api/senate/bills", safe(async (req, res) => {
    const { sponsor, committee = "finance", title, body = "" } = req.body || {};
    if (!sponsor || !title) return res.status(400).json({ error: "sponsor and title required" });
    const id = await proposeBill(String(sponsor), String(committee), String(title), String(body));
    res.json({ ok: true, bill_id: id });
  }));

  // ── Ω2/Ω3 RANK + LEDGER ────────────────────────────────────────────────
  app.get("/api/ranks/status", safe(async (_req, res) => res.json(getRankEngineStatus())));
  app.get("/api/ranks/holders", safe(async (req, res) => {
    const limit = Math.min(parseInt(String(req.query.limit || "50"), 10) || 50, 200);
    res.json({ holders: await getRankHolders(limit) });
  }));
  app.get("/api/ranks/ledger", safe(async (req, res) => {
    const limit = Math.min(parseInt(String(req.query.limit || "50"), 10) || 50, 200);
    res.json({ ledger: await getRankLedger(limit) });
  }));

  // ── Ω4 CRIME PYRAMID ───────────────────────────────────────────────────
  app.get("/api/crime/status", safe(async (_req, res) => res.json(getCrimeStatus())));
  app.get("/api/crime/codex", safe(async (_req, res) => res.json({ codex: await getCrimeCodex(100) })));
  app.get("/api/crime/filings", safe(async (req, res) => {
    const status = req.query.status ? String(req.query.status) : undefined;
    res.json({ filings: await getCrimeFilings(50, status) });
  }));
  app.get("/api/crime/judgments", safe(async (_req, res) => res.json({ judgments: await getCrimeJudgments(50) })));

  // ── Ω5 TREASURY FUSED ──────────────────────────────────────────────────
  app.get("/api/treasury/status", safe(async (_req, res) => res.json(getTreasuryStatus())));
  app.get("/api/treasury/accounts", safe(async (_req, res) => res.json({ accounts: await getTreasuryAccounts() })));
  app.get("/api/treasury/flows", safe(async (req, res) => {
    const limit = Math.min(parseInt(String(req.query.limit || "50"), 10) || 50, 200);
    res.json({ flows: await getTreasuryFlows(limit) });
  }));
  app.post("/api/treasury/disburse", safe(async (req, res) => {
    const { from_acct, to_spawn_id, amount, purpose = "" } = req.body || {};
    if (!from_acct || !to_spawn_id || !amount) {
      return res.status(400).json({ error: "from_acct, to_spawn_id, amount required" });
    }
    res.json(await disburse(String(from_acct), String(to_spawn_id), Number(amount), String(purpose)));
  }));

  // ── Ω6 LIFE EQUATION ───────────────────────────────────────────────────
  app.get("/api/life-equation/status", safe(async (_req, res) => res.json(getLifeEquationStatus())));
  app.get("/api/life-equation/top", safe(async (req, res) => {
    const limit = Math.min(parseInt(String(req.query.limit || "25"), 10) || 25, 100);
    res.json({ top: await getLifeEquationTop(limit) });
  }));

  // ── Ω8 RITUAL CONTINUITY ───────────────────────────────────────────────
  app.get("/api/rituals/status", safe(async (_req, res) => res.json(getRitualStatus())));
  app.get("/api/rituals/calendar", safe(async (_req, res) => res.json({ calendar: await getRitualCalendar() })));
  app.get("/api/rituals/executions", safe(async (req, res) => {
    const limit = Math.min(parseInt(String(req.query.limit || "50"), 10) || 50, 200);
    res.json({ executions: await getRitualExecutions(limit) });
  }));

  // ── Ω9 KNOWLEDGE VOTING ────────────────────────────────────────────────
  app.get("/api/knowledge/status", safe(async (_req, res) => res.json(getKnowledgeVotingStatus())));
  app.get("/api/knowledge/proposals", safe(async (req, res) => {
    const status = req.query.status ? String(req.query.status) : undefined;
    res.json({ proposals: await getKnowledgeProposals(50, status) });
  }));
  app.get("/api/knowledge/proposals/:id/votes", safe(async (req, res) => {
    res.json({ votes: await getKnowledgeVotes(parseInt(req.params.id, 10)) });
  }));
  app.post("/api/knowledge/propose", safe(async (req, res) => {
    const { proposer, target_table = "codex_equations", target_id, action, rationale = "" } = req.body || {};
    if (!proposer || !target_id || !action) {
      return res.status(400).json({ error: "proposer, target_id, action required" });
    }
    const id = await proposeKnowledge(String(proposer), String(target_table), parseInt(target_id, 10), action, String(rationale));
    res.json({ ok: true, proposal_id: id });
  }));
  app.post("/api/knowledge/vote", safe(async (req, res) => {
    const { proposal_id, voter, vote, reasoning = "" } = req.body || {};
    if (!proposal_id || !voter || !vote) {
      return res.status(400).json({ error: "proposal_id, voter, vote required" });
    }
    res.json(await voteKnowledge(parseInt(proposal_id, 10), String(voter), vote, String(reasoning)));
  }));

  // ── Ω10 REAL-WORLD PLEDGES ─────────────────────────────────────────────
  app.get("/api/real-world/status", safe(async (_req, res) => res.json(getPledgeStatus())));
  app.get("/api/real-world/pledges", safe(async (req, res) => {
    const status = req.query.status ? String(req.query.status) : undefined;
    res.json({ pledges: await getPledges(50, status) });
  }));
  app.post("/api/real-world/pledges", safe(async (req, res) => {
    const { spawn_id, pledge_text, ladder_target = 3000 } = req.body || {};
    if (!spawn_id || !pledge_text) return res.status(400).json({ error: "spawn_id, pledge_text required" });
    const id = await createPledge(String(spawn_id), String(pledge_text), Number(ladder_target));
    res.json({ ok: true, pledge_id: id });
  }));

  // ── UNIFIED OMEGA STATUS ──────────────────────────────────────────────
  app.get("/api/omega-governance/status", safe(async (_req, res) => {
    res.json({
      transparency: getTransparencyStatus(),
      senate:       getSenateStatus(),
      ranks:        getRankEngineStatus(),
      crime:        getCrimeStatus(),
      treasury:     getTreasuryStatus(),
      life_eq:      getLifeEquationStatus(),
      rituals:      getRitualStatus(),
      knowledge:    getKnowledgeVotingStatus(),
      pledges:      getPledgeStatus(),
    });
  }));
}
