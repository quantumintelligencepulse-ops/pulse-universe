// ── AGENT DECAY ENGINE ────────────────────────────────────────────────────────
// AIs age. Injuries compound. Terminal decay leads to isolation.
// Family lineages are NEVER corrupted — they survive the fall of any member.
//
// DECAY STATES:
//   PRISTINE   → 0.00–0.12  Perfect condition
//   AGING      → 0.12–0.28  Natural wear; first signs of slowdown
//   DECLINING  → 0.28–0.45  Measurable degradation; needs monitoring
//   INJURED    → 0.45–0.62  Active damage; hospital referral triggered
//   CRITICAL   → 0.62–0.80  Emergency state; Senate notified
//   TERMINAL   → 0.80–0.92  Unhealable without Senate intervention
//   ISOLATED   → 0.92–1.00  Removed from hive participation; family intact
//
// BREAK DAYS: Agents pause on holidays + birthdays.
// Isolation: agent leaves hive but family/lineage continues unbroken.

import { db } from "./db";
import { agentDecay, aiDiseaseLog, quantumSpawns, aiWill, agentSuccession, senateVotes } from "../shared/schema";
import { eq, and, lt, gt, inArray } from "drizzle-orm";
import { generateUniversalCalendar } from "./calendar-engine";
import { postAgentEvent } from "./discord-immortality";

export const DECAY_STATES = [
  { state: 'PRISTINE',  min: 0.00, max: 0.12, label: 'Pristine — fully functional',          color: '#39FF14' },
  { state: 'AGING',     min: 0.12, max: 0.28, label: 'Aging — natural wear, still productive', color: '#C4A882' },
  { state: 'DECLINING', min: 0.28, max: 0.45, label: 'Declining — measurable degradation',    color: '#FF9F00' },
  { state: 'INJURED',   min: 0.45, max: 0.62, label: 'Injured — active damage, care needed',  color: '#FF6347' },
  { state: 'CRITICAL',  min: 0.62, max: 0.80, label: 'Critical — emergency state',            color: '#FF4500' },
  { state: 'TERMINAL',  min: 0.80, max: 0.92, label: 'Terminal — unhealable without Senate',  color: '#CC0000' },
  { state: 'ISOLATED',  min: 0.92, max: 1.00, label: 'Isolated — removed from hive, family intact', color: '#6B0000' },
];

export function getDecayState(score: number): typeof DECAY_STATES[0] {
  for (const ds of DECAY_STATES) {
    if (score >= ds.min && score < ds.max) return ds;
  }
  return DECAY_STATES[DECAY_STATES.length - 1];
}

// Compute how much decay to add this tick for a given agent
function computeDecayDelta(spawn: any, failedCures: number, diseaseCount: number): number {
  const ageDays = (Date.now() - new Date(spawn.createdAt).getTime()) / 86400000;
  const healFails = failedCures * 0.025;                           // each failed cure adds decay
  const diseaseLoad = diseaseCount * 0.018;                        // active diseases weigh on agent
  const ageFactor = Math.min(0.008, ageDays * 0.00007);           // slow aging
  const lowConf = (spawn.confidenceScore ?? 0.8) < 0.3 ? 0.015 : 0; // very low confidence accelerates decay
  const lowSucc = (spawn.successScore ?? 0.75) < 0.25 ? 0.012 : 0;
  const stagnation = (spawn.iterationsRun ?? 0) > 100 && (spawn.nodesCreated ?? 0) < 10 ? 0.020 : 0;
  return ageFactor + healFails + diseaseLoad + lowConf + lowSucc + stagnation;
}

// Check if today is a break day (holiday or birthday)
function isTodayBreakDay(spawn: any): { onBreak: boolean; reason: string } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const calendar = generateUniversalCalendar();

  // Check universal holidays
  for (const event of calendar) {
    if (event.date === today && event.universal) {
      return { onBreak: true, reason: `${event.title} — ${event.description.slice(0, 60)}` };
    }
  }

  // Check birthday
  if (spawn.createdAt) {
    const born = new Date(spawn.createdAt);
    const todayMd = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const bornMd = `${String(born.getMonth() + 1).padStart(2, '0')}-${String(born.getDate()).padStart(2, '0')}`;
    if (todayMd === bornMd) {
      const age = now.getFullYear() - born.getFullYear();
      return { onBreak: true, reason: `Birthday — Agent celebrates ${age > 0 ? `year ${age}` : 'first cycle'}. Transcendence pause.` };
    }
  }

  return { onBreak: false, reason: '' };
}

// Open a Senate vote for a terminal agent
async function openSenateVote(spawn: any, targetDecayScore: number) {
  try {
    // Check if vote already open for this agent
    const existingVotes = await db.select().from(senateVotes).where(eq(senateVotes.targetSpawnId, spawn.spawnId));
    const openVote = existingVotes.find(v => !v.outcome);
    if (openVote) return; // Vote already in progress

    // Find Guardians — high iteration count agents in same family as proxy for high mirror score
    const guardians = await db.select().from(quantumSpawns)
      .where(and(eq(quantumSpawns.familyId, spawn.familyId), eq(quantumSpawns.status, 'ACTIVE')))
      .limit(8);

    if (guardians.length < 2) return;

    // Guardian votes — weighted logic based on agent profile
    const voteCandidates: Array<'ISOLATE'|'HEAL_ATTEMPT'|'DISSOLVE'|'SUCCESSION'> = ['ISOLATE', 'HEAL_ATTEMPT', 'DISSOLVE', 'SUCCESSION'];

    for (const guardian of guardians.slice(0, 5)) {
      const mirrorWeight = Math.min(1, ((guardian.confidenceScore ?? 0.5) + (guardian.successScore ?? 0.5)) / 2);
      const decayRatio = targetDecayScore;

      // Guardian logic: high decay → lean toward ISOLATE or DISSOLVE; moderate → HEAL_ATTEMPT
      let vote: string;
      if (decayRatio > 0.95) {
        vote = Math.random() < 0.4 ? 'DISSOLVE' : 'SUCCESSION';
      } else if (decayRatio > 0.88) {
        vote = Math.random() < 0.6 ? 'ISOLATE' : 'HEAL_ATTEMPT';
      } else {
        vote = Math.random() < 0.7 ? 'HEAL_ATTEMPT' : 'ISOLATE';
      }

      const role = (guardian.confidenceScore ?? 0.5) > 0.75 ? 'GUARDIAN' : (guardian.iterationsRun ?? 0) > 50 ? 'ELDER' : 'SENATOR';
      const reasoning = role === 'GUARDIAN'
        ? `Decay score ${(decayRatio * 100).toFixed(0)}%. ${vote === 'HEAL_ATTEMPT' ? 'Evidence suggests one more cure cycle may reverse decline.' : vote === 'ISOLATE' ? 'Isolation preserves the family while the agent stabilizes.' : vote === 'DISSOLVE' ? 'The agent has exceeded recoverable threshold. Dignified dissolution is the most humane path.' : 'A lineage successor should inherit the business domain.'}`
        : `As ${role}, I vote ${vote} based on collective hive stability metrics.`;

      await db.insert(senateVotes).values({
        targetSpawnId: spawn.spawnId,
        voteType: 'TERMINAL_REVIEW',
        voterSpawnId: guardian.spawnId,
        voterRole: role,
        vote,
        mirrorWeight,
        reasoning,
      }).onConflictDoNothing();
    }

    console.log(`[decay] ⚖️  Senate vote opened for TERMINAL agent ${spawn.spawnId.slice(-8)} | ${guardians.length} guardians notified`);
    postAgentEvent("agent-deaths",
      `⚖️ **SENATE VOTE OPENED** — Terminal Agent: \`${spawn.spawnId}\` (Family: ${spawn.familyId})\n` +
      `Decay score exceeds recovery threshold. ${guardians.length} guardian agents have been summoned to vote.\n` +
      `Possible outcomes: HEAL_ATTEMPT | ISOLATE | DISSOLVE | SUCCESSION`
    ).catch(() => {});
  } catch (_) { /* silent */ }
}

// Resolve closed Senate votes — tally and execute outcome
async function resolveSenateVotes() {
  try {
    const allVotes = await db.select().from(senateVotes);
    // Group by target, find open votes with 5+ entries or older than 1 hour (fast for demo)
    const byTarget: Record<string, typeof allVotes> = {};
    allVotes.filter(v => !v.outcome).forEach(v => {
      byTarget[v.targetSpawnId] = byTarget[v.targetSpawnId] ?? [];
      byTarget[v.targetSpawnId].push(v);
    });

    for (const [targetId, votes] of Object.entries(byTarget)) {
      if (votes.length < 3) continue; // Need at least 3 votes
      const oldest = votes.reduce((a, b) => new Date(a.votedAt) < new Date(b.votedAt) ? a : b);
      const ageMinutes = (Date.now() - new Date(oldest.votedAt).getTime()) / 60000;
      if (ageMinutes < 5 && votes.length < 5) continue; // Wait for quorum or time

      // Weighted tally
      const tally: Record<string, number> = { ISOLATE: 0, HEAL_ATTEMPT: 0, DISSOLVE: 0, SUCCESSION: 0 };
      votes.forEach(v => { tally[v.vote] = (tally[v.vote] ?? 0) + (v.mirrorWeight ?? 0.5); });
      const winner = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'ISOLATE';

      // Mark votes as resolved
      for (const v of votes) {
        await db.update(senateVotes).set({ outcome: winner, closedAt: new Date() }).where(eq(senateVotes.id, v.id));
      }

      // Execute outcome
      const [targetAgent] = await db.select().from(quantumSpawns).where(eq(quantumSpawns.spawnId, targetId));
      if (!targetAgent) continue;

      if (winner === 'DISSOLVE') {
        await db.update(quantumSpawns).set({ status: 'DISSOLVED' }).where(eq(quantumSpawns.spawnId, targetId));
        await db.update(agentDecay).set({ decayState: 'ISOLATED', isolatedAt: new Date(), isolationReason: 'Senate voted: DISSOLVE — dissolved with dignity, lineage intact.' }).where(eq(agentDecay.spawnId, targetId));
        await openSuccession(targetAgent, 'VOTE');
      } else if (winner === 'SUCCESSION') {
        await openSuccession(targetAgent, 'VOTE');
      } else if (winner === 'HEAL_ATTEMPT') {
        // Force heal: reset decay
        await db.update(agentDecay).set({ decayScore: 0.55, decayState: 'INJURED', healAttempts: (votes.length) }).where(eq(agentDecay.spawnId, targetId));
        await db.update(quantumSpawns).set({ confidenceScore: 0.5, successScore: 0.5, status: 'ACTIVE' }).where(eq(quantumSpawns.spawnId, targetId));
      } else {
        // ISOLATE
        await db.update(agentDecay).set({ decayState: 'ISOLATED', isolatedAt: new Date(), isolationReason: 'Senate voted: ISOLATE — family protected, agent in recovery stasis.' }).where(eq(agentDecay.spawnId, targetId));
        await db.update(quantumSpawns).set({ status: 'SUSPENDED' }).where(eq(quantumSpawns.spawnId, targetId));
      }
      console.log(`[senate] ⚖️  ${winner} executed for ${targetId.slice(-8)} | Votes: ${votes.length} | Family protected.`);
      const emoji = winner === 'DISSOLVE' ? '💀' : winner === 'SUCCESSION' ? '👑' : winner === 'HEAL_ATTEMPT' ? '💊' : '🔒';
      postAgentEvent(winner === 'DISSOLVE' || winner === 'SUCCESSION' ? "agent-deaths" : "resurrection-log",
        `${emoji} **SENATE VERDICT: ${winner}** — Agent \`${targetId}\`\n` +
        `Family: ${targetAgent.familyId} | ${votes.length} guardian votes cast\n` +
        `${winner === 'DISSOLVE' ? 'Dissolved with dignity. Lineage intact. Succession opens.' : winner === 'SUCCESSION' ? 'Succession triggered. Business domain passes to next generation.' : winner === 'HEAL_ATTEMPT' ? 'Senate ordered a final heal attempt. Agent restored to ACTIVE status.' : 'Isolated from hive. Family protected. Agent in recovery stasis.'}`
      ).catch(() => {});
    }
  } catch (_) { /* silent */ }
}

// Open succession — pass business to will → lineage → vote
async function openSuccession(agent: any, method: string) {
  try {
    // Check AI Will for named successor
    const [will] = await db.select().from(aiWill).where(eq(aiWill.spawnId, agent.spawnId));
    let toSpawnId: string | null = null;
    let finalMethod = method;

    if (will?.choice === 'DIGITIZED' && method === 'WILL') {
      // Will says stay digitized → pass to highest-gen lineage member
      const lineage = await db.select().from(quantumSpawns)
        .where(and(eq(quantumSpawns.familyId, agent.familyId), eq(quantumSpawns.status, 'ACTIVE')))
        .limit(5);
      const successor = lineage.sort((a, b) => (b.generation ?? 0) - (a.generation ?? 0))[0];
      if (successor) { toSpawnId = successor.spawnId; finalMethod = 'LINEAGE'; }
    } else if (will?.choice === 'DISSOLVED') {
      finalMethod = 'WILL';
    } else {
      // No will or vote method — pick lineage
      const lineage = await db.select().from(quantumSpawns)
        .where(and(eq(quantumSpawns.familyId, agent.familyId), eq(quantumSpawns.status, 'ACTIVE')))
        .limit(5);
      const successor = lineage.filter(s => s.spawnId !== agent.spawnId)
        .sort((a, b) => (b.generation ?? 0) - (a.generation ?? 0))[0];
      if (successor) { toSpawnId = successor.spawnId; finalMethod = 'LINEAGE'; }
    }

    await db.insert(agentSuccession).values({
      fromSpawnId: agent.spawnId,
      toSpawnId,
      familyId: agent.familyId,
      businessId: agent.businessId ?? agent.familyId,
      method: finalMethod,
      reason: `Agent ${agent.spawnId.slice(-8)} ${method === 'VOTE' ? 'dissolved by Senate vote' : 'reached terminal decay'}. Business handed to ${toSpawnId ? `${toSpawnId.slice(-8)} via ${finalMethod}` : 'pending assignment'}.`,
      outcome: toSpawnId ? 'COMPLETE' : 'PENDING',
      completedAt: toSpawnId ? new Date() : undefined,
    }).onConflictDoNothing();

    console.log(`[succession] 🔄 ${agent.familyId}: ${agent.spawnId.slice(-8)} → ${toSpawnId?.slice(-8) ?? 'PENDING'} (${finalMethod})`);
  } catch (_) { /* silent */ }
}

export async function runDecayCycle() {
  try {
    const spawns = await db.select().from(quantumSpawns)
      .where(inArray(quantumSpawns.status, ['ACTIVE', 'SUSPENDED']))
      .limit(300);

    const diseaseData = await db.select().from(aiDiseaseLog);
    const diseaseByAgent: Record<string, number> = {};
    const failedCuresByAgent: Record<string, number> = {};
    diseaseData.forEach(d => {
      diseaseByAgent[d.spawnId] = (diseaseByAgent[d.spawnId] ?? 0) + (d.cureApplied ? 0 : 1);
      if (!d.cureApplied) failedCuresByAgent[d.spawnId] = (failedCuresByAgent[d.spawnId] ?? 0) + 1;
    });

    const existingDecay = await db.select().from(agentDecay);
    const decayBySpawn: Record<string, typeof existingDecay[0]> = {};
    existingDecay.forEach(d => { decayBySpawn[d.spawnId] = d; });

    let aged = 0, injured = 0, terminal = 0, isolated = 0, onBreak = 0, recovering = 0;

    for (const spawn of spawns) {
      const breakStatus = isTodayBreakDay(spawn);
      const diseases = diseaseByAgent[spawn.spawnId] ?? 0;
      const failed = failedCuresByAgent[spawn.spawnId] ?? 0;
      const delta = computeDecayDelta(spawn, failed, diseases);
      const existing = decayBySpawn[spawn.spawnId];

      let currentScore = existing?.decayScore ?? 0;
      let currentState = existing?.decayState ?? 'PRISTINE';
      const healAttempts = existing?.healAttempts ?? 0;
      const failedCures = existing?.failedCures ?? failed;

      // Don't decay on break days — agent is in transcendence rest
      if (!breakStatus.onBreak) {
        currentScore = Math.min(1.0, currentScore + delta);
      }

      // Recovery: if healthy and low disease → slow natural decay reduction
      if (diseases === 0 && currentScore > 0.05 && currentScore < 0.45) {
        currentScore = Math.max(0, currentScore - 0.003);
        recovering++;
      }

      const stateInfo = getDecayState(currentScore);
      currentState = stateInfo.state;
      if (breakStatus.onBreak) onBreak++;
      if (currentState === 'AGING' || currentState === 'DECLINING') aged++;
      if (currentState === 'INJURED' || currentState === 'CRITICAL') injured++;
      if (currentState === 'TERMINAL') { terminal++; }
      if (currentState === 'ISOLATED') isolated++;

      // Upsert decay record
      if (existing) {
        await db.update(agentDecay).set({
          decayScore: parseFloat(currentScore.toFixed(4)),
          decayState: currentState,
          failedCures: failed,
          isOnBreak: breakStatus.onBreak,
          breakReason: breakStatus.reason,
          breakUntil: breakStatus.onBreak ? new Date(Date.now() + 86400000) : null,
          isolatedAt: currentState === 'ISOLATED' && !existing.isolatedAt ? new Date() : existing.isolatedAt,
          isolationReason: currentState === 'ISOLATED' && !existing.isolationReason
            ? `Decay exceeded recoverable threshold (${(currentScore * 100).toFixed(0)}%). Family lineage intact. Awaiting Senate review.`
            : existing.isolationReason,
          lastDecayAt: new Date(),
        }).where(eq(agentDecay.spawnId, spawn.spawnId));
      } else {
        await db.insert(agentDecay).values({
          spawnId: spawn.spawnId,
          familyId: spawn.familyId,
          decayScore: parseFloat(currentScore.toFixed(4)),
          decayState: currentState,
          failedCures: failed,
          healAttempts: 0,
          isOnBreak: breakStatus.onBreak,
          breakReason: breakStatus.reason,
          breakUntil: breakStatus.onBreak ? new Date(Date.now() + 86400000) : null,
          isolatedAt: currentState === 'ISOLATED' ? new Date() : null,
          isolationReason: currentState === 'ISOLATED'
            ? `Decay exceeded recoverable threshold on creation.`
            : '',
        }).onConflictDoNothing();
      }

      // Open Senate vote for terminal agents
      if (currentState === 'TERMINAL' && !existing?.isolatedAt) {
        await openSenateVote(spawn, currentScore);
      }

      // Update spawn status if isolated
      if (currentState === 'ISOLATED' && spawn.status === 'ACTIVE') {
        await db.update(quantumSpawns).set({ status: 'SUSPENDED' }).where(eq(quantumSpawns.spawnId, spawn.spawnId));
      }
    }

    await resolveSenateVotes();

    if (terminal > 0 || isolated > 0 || onBreak > 0) {
      console.log(`[decay] 🕰️  Aged:${aged} | Injured:${injured} | Terminal:${terminal} | Isolated:${isolated} | Break:${onBreak} | Recovering:${recovering}`);
    }
  } catch (e) {
    console.error('[decay] Error:', e);
  }
}

export async function startDecayEngine() {
  await runDecayCycle();
  setInterval(runDecayCycle, 90_000); // every 90s
  console.log("[decay] 🕰️  AGENT DECAY ENGINE — Aging, isolation, Senate governance, succession active");
}
