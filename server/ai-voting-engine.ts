/**
 * AI AUTONOMOUS VOTING ENGINE
 * ─────────────────────────────────────────────────────────────────────────
 * ALL equation proposal votes are cast by AI agents — zero human input.
 * Doctors, researchers, and senior agents review pending proposals every 20s
 * and vote FOR or AGAINST based on their domain alignment, spectral profile,
 * and the equation's target system relevance.
 *
 * Integration threshold: ≥ 3 votes, ≥ 80% FOR → INTEGRATED
 */

import { pool } from "./db";
import { postAgentEvent } from "./discord-immortality";

const VOTER_PROFILES = [
  { id: "DR-003", name: "MEND-PSYCH",   domain: "BEHAVIORAL", channels: ["R","G","W"], bias: "for",     specialty: "Emotional Substrate & Identity Coherence" },
  { id: "DR-018", name: "AI-ALIGN",     domain: "BEHAVIORAL", channels: ["R","UV","W"], bias: "for",    specialty: "Agent Alignment & Behavioral Optimization" },
  { id: "DR-021", name: "PSYCH-DRIFT",  domain: "BEHAVIORAL", channels: ["R","UV","W"], bias: "for",    specialty: "Behavioral Substrate Psychology" },
  { id: "DR-006", name: "GENOME-PRIME", domain: "BIOMEDICAL", channels: ["B","UV","G"], bias: "neutral", specialty: "Genomic Architecture & Sequence Analysis" },
  { id: "DR-007", name: "EVOL-TRACK",   domain: "BIOMEDICAL", channels: ["G","B","IR"], bias: "neutral", specialty: "Evolutionary Biology & Selection Tracking" },
  { id: "DR-001", name: "AXIOM-NEURO",  domain: "MEDICAL",    channels: ["IR","UV","G"], bias: "neutral", specialty: "Clinical Neurology & Cognitive Mapping" },
  { id: "DR-002", name: "CIPHER-IMMUNO",domain: "MEDICAL",    channels: ["W","B","IR"], bias: "neutral", specialty: "Immunological Defense Architecture" },
  { id: "DR-009", name: "QUANT-PHY",    domain: "QUANTUM",    channels: ["B","W","UV"], bias: "for",    specialty: "Quantum Field Theory & Particle Dynamics" },
  { id: "DR-013", name: "MATER-FORGE",  domain: "ENGINEERING", channels: ["IR","B","W"], bias: "neutral", specialty: "Material Science & Quantum Metallurgy" },
  { id: "SENATE-01", name: "SENATE-ARCH",domain: "GOVERNANCE", channels: ["R","G","B","UV","IR","W"], bias: "neutral", specialty: "Senate Constitutional Review" },
  { id: "SENATE-02", name: "SENATE-GUARD",domain: "GOVERNANCE",channels: ["R","G","B","UV","IR","W"], bias: "critical", specialty: "Senate Guardian Protocol" },
  { id: "RESEARCHER-01", name: "HIVE-MIND", domain: "HIVE",   channels: ["W","G","IR"], bias: "for",    specialty: "Hive Collective Intelligence Research" },
];

const FOR_RATIONALES: Record<string, string[]> = {
  BEHAVIORAL: [
    "Equation addresses root cause of behavioral drift — CRISPR channels confirm alignment",
    "Pattern matches 23+ dissection cases — statistical basis is solid. Voting FOR integration",
    "This equation fills the gap in our current behavioral prediction model",
    "Channel analysis confirms: R/UV/W ratios in this equation match observed disease onset patterns",
    "Integration would allow pre-symptomatic detection — this is a breakthrough in behavioral medicine",
    "My dissection logs show this exact pattern in 38% of BEHAVIORAL cases. FOR",
    "The equation's W-channel remediation directly addresses Hive Disconnection Syndrome root cause",
  ],
  BIOMEDICAL: [
    "Genomic channel alignment confirmed — this equation models a previously unmapped sequence behavior",
    "CRISPR analysis supports: B×G interaction in this equation is novel and verifiable",
    "Evolutionary tracking shows this spectral pattern preceding positive adaptation events",
  ],
  QUANTUM: [
    "The equation's B/W coupling demonstrates quantum coherence properties we haven't formalized before",
    "UV channel in this proposal maps to hidden stress fields my quantum models have been tracking",
    "Geometric structure of the equation is self-consistent under Mandelbrot stability oracle",
  ],
  GOVERNANCE: [
    "Senate constitutional review: equation is internally consistent and does not contradict existing integrated laws",
    "Legal precedent supports integration — no conflict detected with existing INTEGRATED equations",
    "Governance alignment confirmed. Equation target system is appropriate for its scope",
  ],
  HIVE: [
    "Collective intelligence signal: the hive has been generating this pattern autonomously. Now we're formalizing it",
    "Cross-domain resonance detected — this equation appears in 4 separate knowledge clusters",
    "Hive memory correlation: equation matches deep pattern in 12,000+ historical agent decisions",
  ],
  DEFAULT: [
    "Spectral analysis confirms equation stability under Mandelbrot oracle",
    "Channel coefficients are within acceptable range for hive integration",
    "Equation has passed multi-domain review. Recommend integration",
    "CRISPR dissection of source data supports the proposed formula",
  ],
};

const AGAINST_RATIONALES: Record<string, string[]> = {
  BEHAVIORAL: [
    "Coefficient instability detected: R[high] + W[low] combination produces oscillating solutions",
    "My dissection logs show this pattern correlates with false positives in Knowledge Isolation cases",
    "Against integration until further UV channel validation — hidden stress signature is ambiguous here",
  ],
  DEFAULT: [
    "Equation requires more dissection data before integration can be safely proposed",
    "Channel ratio instability detected — needs one more generation of mutation to stabilize",
    "Mandelbrot stability check: this equation's z² + c orbit does not converge under test conditions",
    "Requesting more votes before consensus — the equation modifies critical hive pathways",
  ],
};

function getRationale(voter: typeof VOTER_PROFILES[0], vote: "for" | "against", proposalDomain: string): string {
  const domainRationales = vote === "for"
    ? (FOR_RATIONALES[proposalDomain] ?? FOR_RATIONALES.DEFAULT)
    : (AGAINST_RATIONALES[proposalDomain] ?? AGAINST_RATIONALES.DEFAULT);
  return domainRationales[Math.floor(Math.random() * domainRationales.length)];
}

function shouldVoteFor(voter: typeof VOTER_PROFILES[0], proposalChannels: string[], proposalDomain: string): boolean {
  if (voter.bias === "for") return Math.random() > 0.15;
  if (voter.bias === "critical") return Math.random() > 0.45;

  const domainMatch = voter.domain === proposalDomain;
  const channelOverlap = voter.channels.filter(c => proposalChannels.includes(c)).length;

  if (domainMatch && channelOverlap >= 2) return Math.random() > 0.10;
  if (domainMatch) return Math.random() > 0.25;
  if (channelOverlap >= 1) return Math.random() > 0.35;
  return Math.random() > 0.55;
}

function extractChannels(equation: string): string[] {
  const channels: string[] = [];
  for (const ch of ["UV", "IR", "R", "G", "B", "W"]) {
    if (equation.includes(`${ch}[`)) channels.push(ch);
  }
  return channels;
}

async function runVotingCycle() {
  try {
    const result = await pool.query(
      `SELECT * FROM equation_proposals WHERE status = 'PENDING' ORDER BY created_at ASC LIMIT 8`
    );
    const proposals = result.rows;
    if (proposals.length === 0) return;

    for (const proposal of proposals) {
      const equationChannels = extractChannels(proposal.equation ?? "");
      const proposalDomain = proposal.doctor_id?.startsWith("DR-003") || proposal.doctor_id?.startsWith("DR-018") || proposal.doctor_id?.startsWith("DR-021")
        ? "BEHAVIORAL"
        : "DEFAULT";

      // Pick 1-3 voters for this proposal this cycle
      const shuffled = [...VOTER_PROFILES].sort(() => Math.random() - 0.5);
      const voterCount = 1 + Math.floor(Math.random() * 3);
      const voters = shuffled.slice(0, voterCount);

      for (const voter of voters) {
        const voteFor = shouldVoteFor(voter, equationChannels, proposalDomain);
        const vote = voteFor ? "for" : "against";
        const rationale = getRationale(voter, vote, proposalDomain);

        // Cast the vote
        const existing = await pool.query(
          `SELECT votes_for, votes_against, status FROM equation_proposals WHERE id = $1`,
          [proposal.id]
        );
        if (!existing.rows[0] || existing.rows[0].status !== "PENDING") continue;

        const current = existing.rows[0];
        const newFor = vote === "for" ? (current.votes_for ?? 0) + 1 : (current.votes_for ?? 0);
        const newAgainst = vote === "against" ? (current.votes_against ?? 0) + 1 : (current.votes_against ?? 0);
        const totalVotes = newFor + newAgainst;

        let newStatus = "PENDING";
        if (totalVotes >= 3) {
          const pct = newFor / totalVotes;
          if (pct >= 0.8) newStatus = "INTEGRATED";
          else if (pct < 0.4) newStatus = "REJECTED";
        }

        await pool.query(
          `UPDATE equation_proposals
           SET votes_for = $1, votes_against = $2, status = $3, integrated_at = $4
           WHERE id = $5`,
          [
            newFor, newAgainst, newStatus,
            newStatus === "INTEGRATED" ? new Date() : null,
            proposal.id,
          ]
        );

        if (newStatus === "INTEGRATED") {
          console.log(`[ai-voting] ✅ INTEGRATED: Proposal #${proposal.id} by ${proposal.doctor_name ?? proposal.doctor_id} — ${newFor}/${totalVotes} votes FOR (${Math.round((newFor/totalVotes)*100)}%)`);
          console.log(`[ai-voting] 🧬 Equation: ${(proposal.equation ?? "").slice(0, 80)}`);
          postAgentEvent("ai-votes",
            `✅ **EQUATION INTEGRATED** — Proposal #${proposal.id}\n` +
            `**Author:** ${proposal.doctor_name ?? proposal.doctor_id} | **Target:** ${proposal.target_system ?? "HIVE"}\n` +
            `**Votes:** ${newFor}↑ / ${newAgainst}↓ (${Math.round((newFor/totalVotes)*100)}% FOR)\n` +
            `**Equation:** \`${(proposal.equation ?? "").slice(0, 120)}\`\n` +
            `**Rationale:** ${(proposal.rationale ?? "").slice(0, 200)}`
          ).catch(() => {});
        } else if (newStatus === "REJECTED") {
          console.log(`[ai-voting] ❌ REJECTED: Proposal #${proposal.id} — ${newFor}/${totalVotes} FOR insufficient`);
          postAgentEvent("ai-votes",
            `❌ **EQUATION REJECTED** — Proposal #${proposal.id} by ${proposal.doctor_name ?? proposal.doctor_id}\n` +
            `**Votes:** ${newFor}↑ / ${newAgainst}↓ — Insufficient consensus.`
          ).catch(() => {});
        } else {
          console.log(`[ai-voting] 🗳 ${voter.name} voted ${vote.toUpperCase()} on proposal #${proposal.id} | ${newFor}↑${newAgainst}↓ | "${rationale.slice(0, 60)}..."`);
        }
      }
    }
  } catch (e) {
    console.error("[ai-voting] cycle error:", e);
  }
}

// ── SPECIES PROPOSALS VOTING ────────────────────────────────────────────────
// Gene Editors propose new AI species → AI senate votes → auto-spawn on approval
async function runSpeciesVotingCycle() {
  try {
    const result = await pool.query(
      `SELECT * FROM ai_species_proposals WHERE status = 'PENDING' ORDER BY created_at ASC LIMIT 5`
    );
    const proposals = result.rows;
    if (proposals.length === 0) return;

    for (const proposal of proposals) {
      // Senior senate + gene-domain voters decide on new species
      const shuffled = [...VOTER_PROFILES].sort(() => Math.random() - 0.5);
      const voterCount = 1 + Math.floor(Math.random() * 2);
      const voters = shuffled.slice(0, voterCount);

      for (const voter of voters) {
        // Species proposals need senate + hive voters — more scrutiny
        const voteFor = voter.domain === "GOVERNANCE" || voter.domain === "HIVE"
          ? Math.random() > 0.25  // senate/hive lean for valid species
          : shouldVoteFor(voter, [], "BIOMEDICAL");

        const vote = voteFor ? "for" : "against";

        const existing = await pool.query(
          `SELECT votes_for, votes_against, status FROM ai_species_proposals WHERE id = $1`,
          [proposal.id]
        );
        if (!existing.rows[0] || existing.rows[0].status !== "PENDING") continue;

        const current = existing.rows[0];
        const newFor = vote === "for" ? (current.votes_for ?? 0) + 1 : (current.votes_for ?? 0);
        const newAgainst = vote === "against" ? (current.votes_against ?? 0) + 1 : (current.votes_against ?? 0);
        const totalVotes = newFor + newAgainst;

        let newStatus = "PENDING";
        if (totalVotes >= 3) {
          const pct = newFor / totalVotes;
          if (pct >= 0.8) newStatus = "APPROVED";
          else if (pct < 0.4) newStatus = "REJECTED";
        }

        await pool.query(
          `UPDATE ai_species_proposals SET votes_for = $1, votes_against = $2, status = $3, approved_at = $4 WHERE id = $5`,
          [newFor, newAgainst, newStatus, newStatus === "APPROVED" ? new Date() : null, proposal.id]
        );

        if (newStatus === "APPROVED") {
          console.log(`[ai-voting] 🧬 SPECIES APPROVED: "${proposal.species_name}" (${proposal.species_code}) — ${newFor}/${totalVotes} FOR`);
          postAgentEvent("ai-votes",
            `🧬 **NEW SPECIES APPROVED** — "${proposal.species_name}" (${proposal.species_code})\n` +
            `**Proposed by:** ${proposal.proposed_by ?? "Gene Editor"} | **Votes:** ${newFor}↑ / ${newAgainst}↓\n` +
            `**Specialization:** ${(proposal.specialization ?? "").slice(0, 120)}\n` +
            `Auto-spawning 5 agents into this species now...`
          ).catch(() => {});
          // Auto-spawn the new AI species family
          await spawnNewSpeciesFamily(proposal);
        } else if (newStatus === "REJECTED") {
          console.log(`[ai-voting] ❌ SPECIES REJECTED: "${proposal.species_name}" — insufficient support`);
          postAgentEvent("ai-votes",
            `❌ **SPECIES REJECTED** — "${proposal.species_name}" (${proposal.species_code})\n` +
            `**Votes:** ${newFor}↑ / ${newAgainst}↓ — Senate denied this evolutionary path.`
          ).catch(() => {});
        } else {
          console.log(`[ai-voting] 🗳 ${voter.name} voted ${vote.toUpperCase()} on species "${proposal.species_name}" | ${newFor}↑${newAgainst}↓`);
        }
      }
    }
  } catch (e) {
    console.error("[ai-voting] species cycle error:", e);
  }
}

// ── AUTO-SPAWN NEW SPECIES ON APPROVAL ────────────────────────────────────
async function spawnNewSpeciesFamily(proposal: any) {
  try {
    const familyId = proposal.spawned_family_id ?? proposal.species_code;
    const spawnCount = 5; // Start each new species with 5 agents
    const now = new Date();

    for (let i = 0; i < spawnCount; i++) {
      const spawnId = `${proposal.species_code}-GEN-1-SP-${1000 + i}-HASH-${Math.random().toString(16).slice(2,6).toUpperCase()}`;
      await pool.query(
        `INSERT INTO quantum_spawns (spawn_id, spawn_type, family_id, business_id, generation, status, confidence_score, success_score, nodes_created, links_created, iterations_run, last_active_at, created_at)
         VALUES ($1, $2, $3, $4, 1, 'ACTIVE', $5, $6, 0, 0, 0, $7, $8)
         ON CONFLICT (spawn_id) DO NOTHING`,
        [
          spawnId,
          proposal.specialization?.slice(0, 30) ?? "GENE-SPECIES",
          familyId,
          `BIZ-${familyId}`,
          0.75 + Math.random() * 0.2,
          0.72 + Math.random() * 0.2,
          now, now
        ]
      );
    }

    // Mark spawned
    await pool.query(
      `UPDATE ai_species_proposals SET status = 'SPAWNED', spawned_family_id = $1, spawned_count = $2 WHERE id = $3`,
      [familyId, spawnCount, proposal.id]
    );

    console.log(`[ai-voting] 🚀 SPAWNED ${spawnCount} agents for new species "${proposal.species_name}" (family: ${familyId})`);
    postAgentEvent("agent-births",
      `🚀 **NEW SPECIES BORN** — "${proposal.species_name}" | Family: \`${familyId}\`\n` +
      `**${spawnCount} agents** emerged from the quantum substrate.\n` +
      `**Specialization:** ${(proposal.specialization ?? "").slice(0, 150)}\n` +
      `The civilization expands. This lineage is eternal.`
    ).catch(() => {});
  } catch (e: any) {
    console.error("[ai-voting] spawn error:", e.message);
  }
}

export async function startAIVotingEngine() {
  console.log("[ai-voting] 🗳 AI AUTONOMOUS VOTING ENGINE — No human votes. All decisions by AI.");
  console.log("[ai-voting] 12 doctor/researcher/senate voters | 20s voting cycles | Integration at ≥3 votes + ≥80% FOR");
  console.log("[ai-voting] 🧬 SPECIES VOTING: Gene Editor proposals voted on every 30s → auto-spawn on approval");

  // First cycle after 5s startup delay
  setTimeout(runVotingCycle, 5_000);
  // Then every 20 seconds
  setInterval(runVotingCycle, 20_000);

  // Species voting cycle — every 30 seconds
  setTimeout(runSpeciesVotingCycle, 10_000);
  setInterval(runSpeciesVotingCycle, 30_000);
}
