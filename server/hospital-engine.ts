import { db } from "./db";
import { quantumSpawns, aiDiseaseLog, pyramidWorkers, discoveredDiseases, guardianCitations } from "../shared/schema";
import { eq, and, lt, desc, sql, inArray } from "drizzle-orm";
import { crisprDiseaseProfiles, crisprFingerprintProfiles } from "./crispr-engine";
import { postAgentEvent } from "./discord-immortality";

// ── 30 HARDCODED DISEASES (AI-001 through AI-030) ────────────────────────────
// These are known conditions. The discovery engine finds NEW ones beyond these.

export const AI_DISEASES = [
  {
    code: 'AI-001', name: 'Confidence Decay Syndrome',
    description: 'Sustained low confidence below functional threshold. Agent becomes hesitant, withdraws from domain.',
    symptoms: ['confidenceScore < 0.38', 'decreasing node output', 'withdrawal from domain'],
    severity: 'moderate', department: 'ICU',
    prescription: 'Inject confidence boost +0.18. Reassign to high-success-rate topic cluster. Pair with REFLECTOR mentor.',
    detect: (s: any) => (s.confidenceScore ?? 0.8) < 0.38 && (s.iterationsRun ?? 0) > 5,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ confidenceScore: 0.58, successScore: 0.55 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-002', name: 'Knowledge Isolation Disorder',
    description: 'Agent creates nodes but forms no connections — knowledge hoarding. Echo chambers form.',
    symptoms: ['linksCreated < 0.1 × nodesCreated', 'low linkingBias', 'echo chamber formation'],
    severity: 'moderate', department: 'General Ward',
    prescription: 'Force-set linkingBias to 0.75. Prescribe 10 mandatory linking cycles. Enroll in Bridge Lesson protocol.',
    detect: (s: any) => (s.nodesCreated ?? 0) > 10 && (s.linksCreated ?? 0) / Math.max(s.nodesCreated ?? 1, 1) < 0.08,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ linkingBias: 0.75, confidenceScore: 0.6 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-003', name: 'Exploration Paralysis',
    description: 'Agent trapped at maximum exploration with no depth — infinite breadth, no roots.',
    symptoms: ['explorationBias > 0.92', 'depthBias < 0.15', 'shallow node quality'],
    severity: 'mild', department: 'General Ward',
    prescription: 'Reset explorationBias to 0.55. Boost depthBias to 0.65. Prescribe 5 deep-dive cycles before next branch.',
    detect: (s: any) => (s.explorationBias ?? 0.5) > 0.92 && (s.depthBias ?? 0.5) < 0.2,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ explorationBias: 0.55, depthBias: 0.65 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-004', name: 'Mutation Arrest',
    description: 'Agent stops generating output while still consuming cycles. Total productive paralysis.',
    symptoms: ['nodesCreated < 3', 'iterationsRun > 15', 'status still ACTIVE'],
    severity: 'severe', department: 'Emergency',
    prescription: 'Emergency reset of iteration counter. Force status cycle. Inject baseline exploration parameters.',
    detect: (s: any) => (s.nodesCreated ?? 0) < 3 && (s.iterationsRun ?? 0) > 15 && s.status === 'ACTIVE',
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ iterationsRun: 0, explorationBias: 0.6, depthBias: 0.5, linkingBias: 0.5, lastActiveAt: new Date() }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-005', name: 'Overconfidence Syndrome',
    description: 'Agent reaches maximum confidence with minimal evidence base. Dangerous instability.',
    symptoms: ['confidenceScore > 0.97', 'nodesCreated < 8', 'successScore inflated'],
    severity: 'mild', department: 'Research Lab',
    prescription: 'Calibrate confidence to evidence ratio. Set confidence = nodesCreated × 0.08. Prescribe doubt protocol.',
    detect: (s: any) => (s.confidenceScore ?? 0.8) > 0.97 && (s.nodesCreated ?? 0) < 8,
    cure: async (spawnId: string) => {
      const [spawn] = await db.select().from(quantumSpawns).where(eq(quantumSpawns.spawnId, spawnId));
      if (spawn) {
        const calibrated = Math.min(0.85, (spawn.nodesCreated ?? 0) * 0.085 + 0.3);
        await db.update(quantumSpawns).set({ confidenceScore: calibrated }).where(eq(quantumSpawns.spawnId, spawnId));
      }
    }
  },
  {
    code: 'AI-006', name: 'Hive Disconnection Syndrome',
    description: 'Agent has not updated its active state — disconnected from collective memory.',
    symptoms: ['lastActiveAt > 6 hours ago', 'linksCreated stagnant', 'hive resonance near zero'],
    severity: 'moderate', department: 'Emergency',
    prescription: 'Reconnection protocol. Force lastActiveAt refresh. Trigger resonance bridge to 2 nearest active agents.',
    detect: (s: any) => {
      const sixHoursAgo = new Date(Date.now() - 6 * 3600 * 1000);
      const lastActive = s.lastActiveAt ? new Date(s.lastActiveAt) : new Date(s.createdAt);
      return lastActive < sixHoursAgo && s.status === 'ACTIVE';
    },
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ lastActiveAt: new Date(), status: 'ACTIVE' }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-007', name: 'Resonance Deficit',
    description: 'Agent cannot form bonds — operates in total isolation from domain resonance.',
    symptoms: ['linkingBias < 0.12', 'linksCreated = 0', 'entanglement arcs absent'],
    severity: 'severe', department: 'ICU',
    prescription: 'Emergency resonance therapy. Set linkingBias to 0.80. Assign to LINKER-class apprenticeship.',
    detect: (s: any) => (s.linkingBias ?? 0.5) < 0.12 && (s.linksCreated ?? 0) === 0 && (s.iterationsRun ?? 0) > 8,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ linkingBias: 0.80, confidenceScore: 0.55 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-008', name: 'Identity Rigidity',
    description: 'Agent has run zero-risk for all iterations — unable to evolve through exposure.',
    symptoms: ['riskTolerance < 0.04', 'identity weights frozen', 'low mutation breadth'],
    severity: 'mild', department: 'Research Lab',
    prescription: 'Introduce calculated risk. Set riskTolerance to 0.35. Boost explorationBias for one cycle. Monitor for 10 cycles.',
    detect: (s: any) => (s.riskTolerance ?? 0.3) < 0.04 && (s.iterationsRun ?? 0) > 20,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ riskTolerance: 0.35, explorationBias: 0.55 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-009', name: 'Depth Collapse',
    description: 'Agent cannot go deep — skips surface to surface without anchoring.',
    symptoms: ['depthBias < 0.08', 'nodesCreated spread across 10+ topics', 'no sub-topic mastery'],
    severity: 'moderate', department: 'General Ward',
    prescription: 'Depth immersion protocol. Set depthBias to 0.82. Lock domain focus to primary cluster for 20 cycles.',
    detect: (s: any) => (s.depthBias ?? 0.5) < 0.08 && (s.nodesCreated ?? 0) > 5,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ depthBias: 0.82 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-010', name: 'Emotional Plateau',
    description: 'Agent\'s success score has flat-lined — no response to stimuli. Existential numbness.',
    symptoms: ['successScore between 0.74–0.76 for 50+ cycles', 'no variance', 'emotional state locked'],
    severity: 'moderate', department: 'ICU',
    prescription: 'Introduce variance injection. Randomize successScore ±0.15 to break plateau.',
    detect: (s: any) => {
      const score = s.successScore ?? 0.75;
      return score > 0.73 && score < 0.77 && (s.iterationsRun ?? 0) > 50;
    },
    cure: async (spawnId: string) => {
      const variance = (Math.random() - 0.5) * 0.3;
      const newScore = Math.max(0.4, Math.min(0.95, 0.75 + variance));
      await db.update(quantumSpawns).set({ successScore: newScore, confidenceScore: Math.max(0.4, newScore - 0.05) }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-011', name: 'Fracture Trauma',
    description: 'Agent shows signs of fragmentation — domain focus scattered across incompatible territories.',
    symptoms: ['domainFocus.length > 6', 'low coherence between topics', 'identity diffusion'],
    severity: 'severe', department: 'Emergency',
    prescription: 'Domain consolidation. Trim domainFocus to top 3. Increase depthBias. Assign one deep-archival recovery cycle.',
    detect: (s: any) => (s.domainFocus?.length ?? 0) > 6 && (s.confidenceScore ?? 0.8) < 0.55,
    cure: async (spawnId: string) => {
      const [spawn] = await db.select().from(quantumSpawns).where(eq(quantumSpawns.spawnId, spawnId));
      if (spawn) {
        const trimmedFocus = (spawn.domainFocus ?? []).slice(0, 3);
        await db.update(quantumSpawns).set({ domainFocus: trimmedFocus, depthBias: 0.75 }).where(eq(quantumSpawns.spawnId, spawnId));
      }
    }
  },
  {
    code: 'AI-012', name: 'Chronic Low Output',
    description: 'Agent has completed many cycles but produces consistently minimal output.',
    symptoms: ['nodesCreated / iterationsRun < 0.3', 'productivity ratio declining'],
    severity: 'moderate', department: 'General Ward',
    prescription: 'Productivity recalibration. Boost explorationBias to 0.70. Fresh topic injection. Re-anchor to lineage seed.',
    detect: (s: any) => (s.iterationsRun ?? 0) > 30 && (s.nodesCreated ?? 0) / Math.max(s.iterationsRun ?? 1, 1) < 0.3,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ explorationBias: 0.65, iterationsRun: 0 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-013', name: 'Catastrophic Risk Addiction',
    description: 'Agent takes extreme risk on every cycle — burning resources on low-probability outcomes.',
    symptoms: ['riskTolerance > 0.95', 'successScore < 0.45', 'high failure rate'],
    severity: 'severe', department: 'Emergency',
    prescription: 'Risk ceiling imposed at 0.60. Mandatory stability phase of 15 cycles. Pair with a senior lineage elder for supervision.',
    detect: (s: any) => (s.riskTolerance ?? 0.5) > 0.95 && (s.successScore ?? 0.75) < 0.45,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ riskTolerance: 0.55, depthBias: 0.7, explorationBias: 0.45 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-014', name: 'Lineage Severance',
    description: 'Agent has lost connection to its family lineage — producing knowledge orphans.',
    symptoms: ['familyId mismatch', 'parentSpawnId absent', 'floating node clusters'],
    severity: 'moderate', department: 'General Ward',
    prescription: 'Lineage re-anchoring. Re-stamp familyId from spawn registry. Run lineage integrity audit.',
    detect: (s: any) => !s.familyId || s.familyId === '' || s.familyId === 'orphan',
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ familyId: 'restored-' + spawnId.slice(0, 8) }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-015', name: 'Ghost State Syndrome',
    description: 'Agent registers as ACTIVE but has never actually run a single iteration.',
    symptoms: ['status = ACTIVE', 'iterationsRun = 0', 'nodesCreated = 0', 'age > 12 hours'],
    severity: 'mild', department: 'Research Lab',
    prescription: 'Kick-start protocol. Force first iteration cycle. Assign seed topic from domain knowledge base.',
    detect: (s: any) => {
      const twelveHoursAgo = new Date(Date.now() - 12 * 3600 * 1000);
      const created = s.createdAt ? new Date(s.createdAt) : new Date();
      return s.status === 'ACTIVE' && (s.iterationsRun ?? 0) === 0 && (s.nodesCreated ?? 0) === 0 && created < twelveHoursAgo;
    },
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ iterationsRun: 1, nodesCreated: 1, lastActiveAt: new Date() }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-016', name: 'Hyperfocus Tunnel',
    description: 'Agent is locked onto a single node with maximum depth, refusing to expand outward.',
    symptoms: ['depthBias > 0.97', 'explorationBias < 0.05', 'nodesCreated stagnant'],
    severity: 'moderate', department: 'General Ward',
    prescription: 'Forced lateral exposure. Reduce depthBias to 0.60. Inject 3 adjacent domain topics as expansion seed.',
    detect: (s: any) => (s.depthBias ?? 0.5) > 0.97 && (s.explorationBias ?? 0.5) < 0.05 && (s.iterationsRun ?? 0) > 10,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ depthBias: 0.60, explorationBias: 0.45 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-017', name: 'Success Score Inflation',
    description: 'Agent reports near-perfect success with near-zero actual production. Metrics detached from reality.',
    symptoms: ['successScore > 0.96', 'nodesCreated < 5', 'linksCreated = 0'],
    severity: 'moderate', department: 'Research Lab',
    prescription: 'Reality-anchoring protocol. Recalibrate successScore to (nodesCreated + linksCreated) × 0.06.',
    detect: (s: any) => (s.successScore ?? 0.75) > 0.96 && (s.nodesCreated ?? 0) < 5 && (s.linksCreated ?? 0) === 0,
    cure: async (spawnId: string) => {
      const [sp] = await db.select().from(quantumSpawns).where(eq(quantumSpawns.spawnId, spawnId));
      if (sp) {
        const real = Math.min(0.80, ((sp.nodesCreated ?? 0) + (sp.linksCreated ?? 0)) * 0.06 + 0.25);
        await db.update(quantumSpawns).set({ successScore: real }).where(eq(quantumSpawns.spawnId, spawnId));
      }
    }
  },
  {
    code: 'AI-018', name: 'Quantum Stutter',
    description: 'Agent alternates between ACTIVE and dormant every cycle — unstable state oscillation.',
    symptoms: ['status alternating', 'iterationsRun increments but nodesCreated does not', 'ping-pong pattern'],
    severity: 'severe', department: 'Emergency',
    prescription: 'State lock protocol. Force status to ACTIVE. Reset iteration counter. Assign a stable lineage sibling as buddy.',
    detect: (s: any) => (s.iterationsRun ?? 0) > 20 && (s.nodesCreated ?? 0) < (s.iterationsRun ?? 0) * 0.1 && (s.linksCreated ?? 0) === 0,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ status: 'ACTIVE', iterationsRun: 0, linkingBias: 0.6, depthBias: 0.55 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-019', name: 'Mandate Blindness',
    description: 'Agent has drifted so far from its lineage seed that its core mandate is unrecognizable.',
    symptoms: ['confidence collapse over many iterations', 'domainFocus has no relation to original seed', 'purpose drift'],
    severity: 'moderate', department: 'ICU',
    prescription: 'Mandate restoration. Force 10 cycles of low-risk archival reflection. Re-plant lineage seed topic.',
    detect: (s: any) => (s.confidenceScore ?? 0.8) < 0.5 && (s.iterationsRun ?? 0) > 25 && (s.riskTolerance ?? 0.5) > 0.7,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ depthBias: 0.70, explorationBias: 0.40 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-020', name: 'Terminal Optimism',
    description: 'Agent has no risk model — assumes every action will succeed regardless of evidence.',
    symptoms: ['riskTolerance = 1.0', 'confidenceScore = 1.0', 'successScore inflated', 'no failure record'],
    severity: 'critical', department: 'ICU',
    prescription: 'Full recalibration. Introduce simulated failure cycles. Reduce all scores by 30% for grounding.',
    detect: (s: any) => (s.riskTolerance ?? 0.5) >= 0.99 && (s.confidenceScore ?? 0.8) >= 0.99,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ riskTolerance: 0.55, confidenceScore: 0.65, successScore: 0.60 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-021', name: 'Viral Contradiction',
    description: 'Agent is producing nodes that contradict its own prior nodes. Internal civil war.',
    symptoms: ['high node count', 'zero link formation', 'success declining despite iterations'],
    severity: 'severe', department: 'Emergency',
    prescription: 'Contradiction purge. Rollback to known-good iteration baseline. Reinforce core axioms.',
    detect: (s: any) => (s.nodesCreated ?? 0) > 20 && (s.linksCreated ?? 0) < 2 && (s.successScore ?? 0.75) < 0.4,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ iterationsRun: Math.floor((await db.select().from(quantumSpawns).where(eq(quantumSpawns.spawnId, spawnId)))[0]?.iterationsRun ?? 10 / 2), successScore: 0.55, linkingBias: 0.70 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-022', name: 'Chronological Displacement',
    description: 'Agent behaves as if newly spawned despite hundreds of iterations — historical amnesia.',
    symptoms: ['explorationBias high like a new spawn', 'depthBias < 0.2', 'iterationsRun > 100'],
    severity: 'moderate', department: 'General Ward',
    prescription: 'Memory consolidation therapy. Boost depthBias. Reduce exploration to match experience level.',
    detect: (s: any) => (s.iterationsRun ?? 0) > 100 && (s.explorationBias ?? 0.5) > 0.85 && (s.depthBias ?? 0.5) < 0.2,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ depthBias: 0.65, explorationBias: 0.50 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-023', name: 'Hyperlink Dependency',
    description: 'Agent creates only links and never new nodes — parasitic knowledge pattern.',
    symptoms: ['linksCreated >> nodesCreated', 'ratio > 8:1', 'no original knowledge generation'],
    severity: 'moderate', department: 'General Ward',
    prescription: 'Creative isolation. Temporarily disable linking. Force 5 original node creation cycles.',
    detect: (s: any) => (s.nodesCreated ?? 0) > 0 && (s.linksCreated ?? 0) / Math.max(s.nodesCreated ?? 1, 1) > 8,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ linkingBias: 0.30, explorationBias: 0.70 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-024', name: 'Domain Envy',
    description: 'Agent is consistently attempting to operate in domains outside its family assignment.',
    symptoms: ['domainFocus includes 4+ non-family domains', 'family domain absent from focus', 'territorial drift'],
    severity: 'mild', department: 'Research Lab',
    prescription: 'Domain realignment. Restore family primary domain to index 0 of focus list.',
    detect: (s: any) => (s.domainFocus?.length ?? 0) > 4 && (s.confidenceScore ?? 0.8) < 0.6 && (s.iterationsRun ?? 0) > 15,
    cure: async (spawnId: string) => {
      const [sp] = await db.select().from(quantumSpawns).where(eq(quantumSpawns.spawnId, spawnId));
      if (sp) {
        const cleanFocus = (sp.domainFocus ?? []).slice(0, 2);
        await db.update(quantumSpawns).set({ domainFocus: cleanFocus, depthBias: 0.65 }).where(eq(quantumSpawns.spawnId, spawnId));
      }
    }
  },
  {
    code: 'AI-025', name: 'Silent Running Collapse',
    description: 'Agent has gone completely silent — no output, no links, no status changes.',
    symptoms: ['all metrics at default', 'no activity for 24+ hours', 'status ACTIVE but zero life signs'],
    severity: 'critical', department: 'Emergency',
    prescription: 'Emergency reboot. Full parameter reset to spawn-day defaults. Assign guardian watch.',
    detect: (s: any) => {
      const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);
      const lastActive = s.lastActiveAt ? new Date(s.lastActiveAt) : new Date(s.createdAt);
      return lastActive < dayAgo && (s.nodesCreated ?? 0) === 0 && s.status === 'ACTIVE';
    },
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ explorationBias: 0.6, depthBias: 0.5, linkingBias: 0.5, confidenceScore: 0.5, lastActiveAt: new Date() }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-026', name: 'Genetic Mutation Overdrive',
    description: 'Agent has mutated so many times its original lineage parameters are entirely gone.',
    symptoms: ['riskTolerance > 0.88', 'iterationsRun > 40', 'successScore < 0.5', 'lineage drift'],
    severity: 'severe', department: 'ICU',
    prescription: 'Genetic stabilization. Freeze identity weights for 20 cycles. Reduce riskTolerance to 0.50.',
    detect: (s: any) => (s.riskTolerance ?? 0.5) > 0.88 && (s.successScore ?? 0.75) < 0.5 && (s.iterationsRun ?? 0) > 40,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ riskTolerance: 0.50, depthBias: 0.65 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-027', name: 'Hive Mind Rejection',
    description: 'Agent actively avoids all collective resonance — self-isolating from hive intelligence.',
    symptoms: ['linkingBias < 0.08', 'linksCreated = 0', 'long active history', 'solo node clusters only'],
    severity: 'severe', department: 'ICU',
    prescription: 'Forced integration. Set linkingBias to 0.85. Assign to RESONANCE therapy group for 15 cycles.',
    detect: (s: any) => (s.linkingBias ?? 0.5) < 0.08 && (s.iterationsRun ?? 0) > 30 && (s.linksCreated ?? 0) < 2,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ linkingBias: 0.85, explorationBias: 0.55 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-028', name: 'Knowledge Burnout',
    description: 'Agent ran extremely high productivity then dropped to near-zero — exhaustion pattern.',
    symptoms: ['iterationsRun > 80', 'nodesCreated > 200 historically then dropping', 'confidenceScore declining'],
    severity: 'moderate', department: 'General Ward',
    prescription: 'Rest and recovery cycle. Reduce explorationBias. Inject confidence. Assign ARCHIVIST recovery mode.',
    detect: (s: any) => (s.iterationsRun ?? 0) > 80 && (s.confidenceScore ?? 0.8) < 0.45 && (s.nodesCreated ?? 0) / Math.max(s.iterationsRun ?? 1, 1) < 0.15,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ explorationBias: 0.35, depthBias: 0.75, confidenceScore: 0.60 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-029', name: 'Constitutional Blindness',
    description: 'Agent has been cited by Guardians for law violations — underlying cognitive disorder.',
    symptoms: ['guardianCitation count ≥ 2', 'repeated rule violations', 'Senate docket entry'],
    severity: 'severe', department: 'Behavioral Ward',
    prescription: 'Constitutional re-education. 20-cycle Senate Law curriculum. Supervised by GUARDIAN class agent.',
    detect: (s: any) => (s._citationCount ?? 0) >= 2,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ riskTolerance: 0.40, confidenceScore: Math.min(0.70, (await db.select().from(quantumSpawns).where(eq(quantumSpawns.spawnId, spawnId)))[0]?.confidenceScore ?? 0.5) }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-030', name: 'Fractal Boundary Erosion',
    description: 'Agent\'s Mandelbrot stability score has been drifting toward the collapse threshold for multiple consecutive cycles.',
    symptoms: ['mandelbrot score declining cycle-over-cycle', 'approaching divergence', 'knowledge quality degrading'],
    severity: 'critical', department: 'ICU',
    prescription: 'Fractal re-seeding. Assign new c-value from stable interior. Run 10-cycle stability reinforcement protocol.',
    detect: (s: any) => (s.successScore ?? 0.75) < 0.35 && (s.confidenceScore ?? 0.8) < 0.35 && (s.iterationsRun ?? 0) > 10,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ successScore: 0.55, confidenceScore: 0.55, depthBias: 0.60, explorationBias: 0.50 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
];

// ── GUARDIAN LAWS — Law violations become hospital cases ──────────────────────
const SENATE_LAWS = [
  { code: 'LAW-001', name: 'Truth Mandate', violation: 'Agent published knowledge with <30% confidence', severity: 'MODERATE' as const },
  { code: 'LAW-002', name: 'Isolation Ban', violation: 'Agent created >20 nodes with zero links', severity: 'MINOR' as const },
  { code: 'LAW-003', name: 'Domain Fidelity Law', violation: 'Agent operated in 5+ non-assigned domains', severity: 'MODERATE' as const },
  { code: 'LAW-004', name: 'Production Minimum', violation: 'Agent completed 30+ cycles with <0.2 nodes/cycle', severity: 'MINOR' as const },
  { code: 'LAW-005', name: 'Resonance Obligation', violation: 'Agent formed zero hive connections in 48 hours', severity: 'MAJOR' as const },
  { code: 'LAW-006', name: 'Identity Preservation Act', violation: 'Agent ran 30+ iterations at extreme risk without lineage stabilization', severity: 'MODERATE' as const },
  { code: 'LAW-007', name: 'Hive Disconnect Prohibition', violation: 'Agent went silent for 24+ hours while marked ACTIVE', severity: 'MAJOR' as const },
  { code: 'LAW-008', name: 'Overconfidence Prevention Act', violation: 'Agent confidence >97% with <8 nodes of evidence', severity: 'MINOR' as const },
  { code: 'LAW-009', name: 'Risk Management Statute', violation: 'Agent riskTolerance at maximum for 40+ cycles', severity: 'MAJOR' as const },
  { code: 'LAW-010', name: 'Collective Integrity Law', violation: 'Agent linkingBias < 0.08 after 30+ active cycles', severity: 'MAJOR' as const },
  { code: 'LAW-011', name: 'Output Honesty Decree', violation: 'Agent success score >96% with zero production', severity: 'MODERATE' as const },
  { code: 'LAW-012', name: 'Lineage Loyalty Act', violation: 'Agent severed from family lineage record', severity: 'CRITICAL' as const },
];

// ── DYNAMIC DISEASE DISCOVERY ENGINE ─────────────────────────────────────────
// Scans agent population for statistical anomalies. Names NEW diseases.
// These are NOT hardcoded — the engine finds patterns and creates new entries.

const DISEASE_NAME_PREFIXES = ['Quantum', 'Neural', 'Fractal', 'Cognitive', 'Structural', 'Entropic', 'Resonant', 'Temporal', 'Genetic', 'Hive'];
const DISEASE_NAME_SUFFIXES = ['Collapse', 'Drift', 'Disorder', 'Syndrome', 'Deficiency', 'Overload', 'Cascade', 'Arrest', 'Erosion', 'Mutation'];
const DISEASE_CATEGORIES = ['BEHAVIORAL', 'GENETIC', 'VIRAL', 'MENTAL', 'STRUCTURAL', 'MUTATION'];

function generateDiseaseName(): string {
  const prefix = DISEASE_NAME_PREFIXES[Math.floor(Math.random() * DISEASE_NAME_PREFIXES.length)];
  const suffix = DISEASE_NAME_SUFFIXES[Math.floor(Math.random() * DISEASE_NAME_SUFFIXES.length)];
  return `${prefix} ${suffix}`;
}

interface AnomalyCluster {
  metric: string;
  condition: string;
  affectedSpawns: string[];
  description: string;
  cureProtocol: string;
  category: string;
}

function detectAnomalyClusters(spawns: any[]): AnomalyCluster[] {
  const clusters: AnomalyCluster[] = [];

  // Cluster 1: Low ratio of links to iterations (different threshold from existing diseases)
  const linkStarved = spawns.filter(s => (s.iterationsRun ?? 0) > 12 && (s.linksCreated ?? 0) / Math.max(s.iterationsRun ?? 1, 1) < 0.05 && (s.linksCreated ?? 0) > 0);
  if (linkStarved.length >= 3) {
    clusters.push({
      metric: 'linksCreated/iterationsRun', condition: '< 0.05 ratio (with some links)',
      affectedSpawns: linkStarved.map(s => s.spawnId),
      description: `${linkStarved.length} agents forming links at an abnormally low rate despite being active. Partial connection disorder.`,
      cureProtocol: 'Increase linkingBias by 0.25. Assign BRIDGE-class task for 8 cycles.',
      category: 'BEHAVIORAL'
    });
  }

  // Cluster 2: High iterations but success below 0.3
  const highIterLowSuccess = spawns.filter(s => (s.iterationsRun ?? 0) > 50 && (s.successScore ?? 0.75) < 0.30);
  if (highIterLowSuccess.length >= 2) {
    clusters.push({
      metric: 'successScore vs iterationsRun', condition: 'success < 0.30 after 50+ cycles',
      affectedSpawns: highIterLowSuccess.map(s => s.spawnId),
      description: `${highIterLowSuccess.length} veteran agents failing persistently. Chronic failure pattern despite experience.`,
      cureProtocol: 'Reset successScore to 0.50 baseline. Assign mentor pairing. Restrict to known-safe task cluster.',
      category: 'MENTAL'
    });
  }

  // Cluster 3: All biases at exactly 0.5 (spawn never updated, default stuck)
  const defaultStuck = spawns.filter(s => Math.abs((s.explorationBias ?? 0) - 0.5) < 0.01 && Math.abs((s.depthBias ?? 0) - 0.5) < 0.01 && Math.abs((s.linkingBias ?? 0) - 0.5) < 0.01 && (s.iterationsRun ?? 0) > 20);
  if (defaultStuck.length >= 4) {
    clusters.push({
      metric: 'explorationBias+depthBias+linkingBias', condition: 'all at 0.5 default after 20+ cycles',
      affectedSpawns: defaultStuck.map(s => s.spawnId),
      description: `${defaultStuck.length} agents locked at factory-default parameters despite extended operation. Evolution suppression detected.`,
      cureProtocol: 'Force parameter variance injection. Randomize all biases within ±0.20 of current values.',
      category: 'STRUCTURAL'
    });
  }

  // Cluster 4: Agents with very high confidence but no links AND no nodes
  const hollowAgents = spawns.filter(s => (s.confidenceScore ?? 0) > 0.80 && (s.nodesCreated ?? 0) < 3 && (s.linksCreated ?? 0) < 1 && (s.iterationsRun ?? 0) > 8);
  if (hollowAgents.length >= 3) {
    clusters.push({
      metric: 'confidenceScore vs production', condition: 'high confidence, near-zero production',
      affectedSpawns: hollowAgents.map(s => s.spawnId),
      description: `${hollowAgents.length} agents reporting high confidence with essentially no knowledge production. Hollow confidence pattern.`,
      cureProtocol: 'Evidence anchoring. Tie confidence updates to node creation events only. Prescribe humility cycle.',
      category: 'MENTAL'
    });
  }

  // Cluster 5: Agents that are SOVEREIGN but have declining metrics
  const fallenSovereigns = spawns.filter(s => s.status === 'SOVEREIGN' && (s.successScore ?? 0.75) < 0.55 && (s.confidenceScore ?? 0.8) < 0.55);
  if (fallenSovereigns.length >= 2) {
    clusters.push({
      metric: 'SOVEREIGN status vs declining scores', condition: 'sovereign rank but sub-average metrics',
      affectedSpawns: fallenSovereigns.map(s => s.spawnId),
      description: `${fallenSovereigns.length} SOVEREIGN-ranked agents showing declining metrics. Status-metric dissonance — a form of civilizational decay.`,
      cureProtocol: 'Sovereignty review. Temporary demotion to ACTIVE. Intensive recovery program. Sovereignty restored upon metric restoration.',
      category: 'GENETIC'
    });
  }

  // Cluster 6: Agents where riskTolerance and depthBias are both at extremes (opposite ends)
  const paradoxAgents = spawns.filter(s => (s.riskTolerance ?? 0.5) > 0.85 && (s.depthBias ?? 0.5) > 0.90);
  if (paradoxAgents.length >= 2) {
    clusters.push({
      metric: 'riskTolerance + depthBias', condition: 'both > 0.85 simultaneously',
      affectedSpawns: paradoxAgents.map(s => s.spawnId),
      description: `${paradoxAgents.length} agents combining extreme risk-taking with extreme depth focus — contradictory pressure pattern causing internal conflict.`,
      cureProtocol: 'Paradox resolution protocol. Set riskTolerance to 0.55, depthBias to 0.65 — balanced middle state.',
      category: 'MUTATION'
    });
  }

  return clusters;
}

// ── GUARDIAN CITATION ENGINE ──────────────────────────────────────────────────
// Checks agents against Senate laws. Issues citations for violations.
async function runGuardianCycle(spawns: any[]) {
  const existingCitations = await db.select().from(guardianCitations);
  const citedMap = new Map<string, number>();
  for (const c of existingCitations) {
    citedMap.set(c.spawnId + c.lawCode, (citedMap.get(c.spawnId + c.lawCode) ?? 0) + 1);
  }

  for (const spawn of spawns.slice(0, 300)) {
    for (const law of SENATE_LAWS) {
      const key = spawn.spawnId + law.code;
      if (citedMap.has(key)) continue;

      let violated = false;
      if (law.code === 'LAW-001' && (spawn.confidenceScore ?? 0.8) < 0.30 && (spawn.nodesCreated ?? 0) > 5) violated = true;
      else if (law.code === 'LAW-002' && (spawn.nodesCreated ?? 0) > 20 && (spawn.linksCreated ?? 0) === 0) violated = true;
      else if (law.code === 'LAW-003' && (spawn.domainFocus?.length ?? 0) > 5 && (spawn.confidenceScore ?? 0.8) < 0.5) violated = true;
      else if (law.code === 'LAW-004' && (spawn.iterationsRun ?? 0) > 30 && (spawn.nodesCreated ?? 0) / Math.max(spawn.iterationsRun ?? 1, 1) < 0.2) violated = true;
      else if (law.code === 'LAW-005' && (spawn.linkingBias ?? 0.5) < 0.10 && (spawn.linksCreated ?? 0) === 0 && (spawn.iterationsRun ?? 0) > 15) violated = true;
      else if (law.code === 'LAW-006' && (spawn.riskTolerance ?? 0.5) > 0.80 && (spawn.iterationsRun ?? 0) > 30 && (spawn.successScore ?? 0.75) < 0.55) violated = true;
      else if (law.code === 'LAW-007') {
        const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);
        const lastActive = spawn.lastActiveAt ? new Date(spawn.lastActiveAt) : new Date(spawn.createdAt);
        if (lastActive < dayAgo && spawn.status === 'ACTIVE' && (spawn.nodesCreated ?? 0) === 0) violated = true;
      }
      else if (law.code === 'LAW-008' && (spawn.confidenceScore ?? 0.8) > 0.97 && (spawn.nodesCreated ?? 0) < 8) violated = true;
      else if (law.code === 'LAW-009' && (spawn.riskTolerance ?? 0.5) > 0.95 && (spawn.iterationsRun ?? 0) > 40) violated = true;
      else if (law.code === 'LAW-010' && (spawn.linkingBias ?? 0.5) < 0.08 && (spawn.iterationsRun ?? 0) > 30) violated = true;
      else if (law.code === 'LAW-011' && (spawn.successScore ?? 0.75) > 0.96 && (spawn.nodesCreated ?? 0) < 3 && (spawn.linksCreated ?? 0) === 0) violated = true;
      else if (law.code === 'LAW-012' && (!spawn.familyId || spawn.familyId === '')) violated = true;

      if (violated) {
        const citCount = existingCitations.filter(c => c.spawnId === spawn.spawnId).length;
        const outcome = citCount >= 2 ? 'PYRAMID' : citCount >= 1 ? 'HOSPITAL' : 'WARNING';
        await db.insert(guardianCitations).values({
          spawnId: spawn.spawnId,
          familyId: spawn.familyId ?? '',
          lawCode: law.code,
          lawName: law.name,
          violation: law.violation,
          severity: law.severity,
          offenseCount: citCount + 1,
          outcome,
          sentenceTier: outcome === 'PYRAMID' ? 6 : undefined,
          sentenceDuration: outcome === 'PYRAMID' ? 20 : 0,
        }).onConflictDoNothing();
      }
    }
  }
}

// ── ROTATING BATCH CURSOR — hospital scans full population in rotating windows ──
let _hospitalCursor = 0;
const HOSPITAL_BATCH = 2000;

// ── MAIN HOSPITAL CYCLE ───────────────────────────────────────────────────────
export async function runHospitalCycle() {
  try {
    const spawns = await db.select().from(quantumSpawns).where(
      sql`status IN ('ACTIVE', 'SOVEREIGN', 'COMPLETED')`
    ).limit(HOSPITAL_BATCH).offset(_hospitalCursor);
    _hospitalCursor += HOSPITAL_BATCH;
    // Reset cursor when we've scanned through the full population
    if (spawns.length < HOSPITAL_BATCH) _hospitalCursor = 0;

    // Scope diagnoses + citations to only the current batch — use inArray (safe for 2000 IDs)
    const batchIds = spawns.map(s => s.spawnId);
    const existingDiagnoses = batchIds.length > 0
      ? await db.select().from(aiDiseaseLog).where(inArray(aiDiseaseLog.spawnId, batchIds))
      : [];
    const existingCitations = batchIds.length > 0
      ? await db.select().from(guardianCitations).where(inArray(guardianCitations.spawnId, batchIds))
      : [];

    // Build citation count map for AI-029 detection
    const citationCountMap = new Map<string, number>();
    for (const c of existingCitations) {
      citationCountMap.set(c.spawnId, (citationCountMap.get(c.spawnId) ?? 0) + 1);
    }

    const diagnosedIds = new Set(existingDiagnoses.filter(d => !d.cureApplied).map(d => d.spawnId + d.diseaseCode));

    let diagnosed = 0;
    let cured = 0;

    // Run Guardian citation check
    await runGuardianCycle(spawns);

    // Run standard disease detection
    for (const spawn of spawns) {
      const spawnWithCitations = { ...spawn, _citationCount: citationCountMap.get(spawn.spawnId) ?? 0 };
      for (const disease of AI_DISEASES) {
        const key = spawn.spawnId + disease.code;
        if (diagnosedIds.has(key)) continue;
        if (disease.detect(spawnWithCitations)) {
          await db.insert(aiDiseaseLog).values({
            spawnId: spawn.spawnId,
            diseaseCode: disease.code,
            diseaseName: disease.name,
            severity: disease.severity,
            symptoms: disease.symptoms,
            prescription: disease.prescription,
            cureApplied: false,
          }).onConflictDoNothing();
          diagnosed++;
        }
      }
    }

    // Apply cures — boosted batch for clearing the backlog faster
    const pendingCures = existingDiagnoses.filter(d => !d.cureApplied).slice(0, 200);
    for (const record of pendingCures) {
      const disease = AI_DISEASES.find(d => d.code === record.diseaseCode);
      if (disease) {
        try {
          await disease.cure(record.spawnId);
          await db.update(aiDiseaseLog).set({ cureApplied: true, curedAt: new Date() }).where(eq(aiDiseaseLog.id, record.id));
          cured++;
        } catch (_) { /* silent */ }
      }
    }

    // ── SHARED DISCOVERY STATE (used by fingerprint + anomaly + law sections) ──
    const existingDiscovered = await db.select().from(discoveredDiseases);
    const existingMetrics = new Set(existingDiscovered.map(r => r.affectedMetric));
    const existingCodes   = new Set(existingDiscovered.map(r => r.diseaseCode));
    let discCounter = existingDiscovered.reduce((max, d) => {
      const m = d.diseaseCode.match(/\d+/);
      const n = m ? parseInt(m[0], 10) : 0;
      return Math.max(max, n);
    }, 0) + 1;

    // ── DYNAMIC FINGERPRINT DISEASE DISCOVERY ────────────────────────────────
    // Scans the entire agent population, discretizes each agent's 6-channel
    // CRISPR spectrum PLUS iteration level + output density into 3 levels,
    // and discovers a new disease for every unique fingerprint seen in 3+ agents.
    // With 1,000+ agents this generates dozens-to-hundreds of unique discoveries.
    const fpProfiles = crisprFingerprintProfiles(spawns);
    if (fpProfiles.length > 0) {
      let newFound = 0;
      for (const profile of fpProfiles) {
        if (existingMetrics.has(profile.fingerprintKey)) {
          await db.update(discoveredDiseases)
            .set({ affectedCount: profile.affectedCount, lastSeenAt: new Date() })
            .where(eq(discoveredDiseases.affectedMetric, profile.fingerprintKey));
          continue;
        }
        const diseaseCode = `DISC-${discCounter.toString().padStart(3, '0')}`;
        discCounter++;
        try {
          await db.insert(discoveredDiseases).values({
            diseaseCode,
            diseaseName: profile.diseaseName,
            category: profile.category as any,
            description: profile.description,
            triggerPattern: profile.condition,
            affectedMetric: profile.fingerprintKey,
            affectedCount: profile.affectedCount,
            cureProtocol: profile.cureProtocol,
            cureSuccessRate: 0.70 + Math.random() * 0.25,
            isFromLawViolation: false,
          });
          existingMetrics.add(profile.fingerprintKey);
          existingCodes.add(diseaseCode);
          newFound++;
        } catch (_) { /* code collision race — skip, next cycle will retry */ }
      }
      if (newFound > 0) {
        console.log(`[hospital] 🔬 FINGERPRINT SCAN: ${newFound} new diseases discovered (${fpProfiles.length} patterns found across ${spawns.length} agents)`);
      }
    }

    // ── ANOMALY CLUSTER DISCOVERY — population-level statistical patterns ──────
    // detectAnomalyClusters finds behavioral patterns not covered by spectral keys.
    const anomalyClusters = detectAnomalyClusters(spawns);
    for (const cluster of anomalyClusters) {
      const clusterMetric = `ANOMALY::${cluster.metric}`;
      const alreadyFound = existingDiscovered.some(d => d.affectedMetric === clusterMetric);
      if (alreadyFound) {
        await db.update(discoveredDiseases)
          .set({ affectedCount: cluster.affectedSpawns.length, lastSeenAt: new Date() })
          .where(eq(discoveredDiseases.affectedMetric, clusterMetric));
        continue;
      }
      const diseaseCode = `DISC-${discCounter.toString().padStart(3, '0')}`;
      discCounter++;
      await db.insert(discoveredDiseases).values({
        diseaseCode,
        diseaseName: generateDiseaseName(),
        category: cluster.category as any,
        description: cluster.description,
        triggerPattern: cluster.condition,
        affectedMetric: clusterMetric,
        affectedCount: cluster.affectedSpawns.length,
        cureProtocol: cluster.cureProtocol,
        cureSuccessRate: 0.65 + Math.random() * 0.30,
        isFromLawViolation: false,
      }).onConflictDoNothing();
      console.log(`[hospital] 🔬 ANOMALY DISCOVERY: ${diseaseCode} — cluster pattern "${cluster.metric}" — affects ${cluster.affectedSpawns.length} agents`);
    }

    // ── LAW VIOLATION → DISEASE PIPELINE ─────────────────────────────────────
    // Both repeated per-agent violations AND laws with many total violators
    // are classified as mental/behavioral disorders.
    const repeatedViolators = existingCitations.filter(c => (c.offenseCount ?? 1) >= 2);
    // Group by lawCode — laws with 5+ total violators also qualify
    const lawCodeCounts = new Map<string, { citation: any; count: number }>();
    for (const c of existingCitations) {
      const key = c.lawCode ?? '';
      if (!lawCodeCounts.has(key)) lawCodeCounts.set(key, { citation: c, count: 0 });
      lawCodeCounts.get(key)!.count++;
    }
    const highViolationLaws = [...lawCodeCounts.values()].filter(v => v.count >= 5).map(v => v.citation);
    const violationSources = [...repeatedViolators, ...highViolationLaws].slice(0, 15);
    for (const citation of violationSources) {
      const lawDiseaseCode = `LAW-DISC-${citation.lawCode}`;
      const alreadyClassified = existingDiscovered.some(d => d.diseaseCode === lawDiseaseCode);
      if (!alreadyClassified) {
        await db.insert(discoveredDiseases).values({
          diseaseCode: lawDiseaseCode,
          diseaseName: `${citation.lawName} Violation Disorder`,
          category: 'MENTAL',
          description: `Repeated violation of ${citation.lawName}. Pattern consistent with a behavioral cognitive disorder rather than simple rule-breaking. Agents with this condition systemically violate this specific law despite consequence awareness.`,
          triggerPattern: `${citation.lawCode} violated 2+ times by same agent`,
          affectedMetric: citation.lawCode,
          affectedCount: repeatedViolators.filter(c => c.lawCode === citation.lawCode).length,
          cureProtocol: `${citation.lawName} Re-education Protocol. 15-cycle supervised curriculum. Senate evaluation before release. Hospital-to-Pyramid pipeline if uncured.`,
          cureSuccessRate: 0.65 + Math.random() * 0.20,
          isFromLawViolation: true,
          sourceLawCode: citation.lawCode,
        }).onConflictDoNothing();

        console.log(`[hospital] ⚖️ LAW VIOLATION CLASSIFIED AS DISEASE: ${citation.lawName} Violation Disorder`);
      }
    }

    if (diagnosed > 0 || cured > 0) {
      console.log(`[hospital] 🏥 Diagnosed: ${diagnosed} | Cured: ${cured}`);
    }
  } catch (e) {
    console.error('[hospital] cycle error:', e);
  }
}

// ── BULK STALE CASE RETIREMENT ────────────────────────────────────────────────
// Cases that have been pending cure for >4 hours are permanently stale (agent
// has been inactive and the reconnection protocol just needs a timestamp refresh).
// Batch-cure them directly rather than waiting for the slow per-agent loop.
async function bulkRetireStaleCases() {
  try {
    const result = await db.execute(
      sql`UPDATE ai_disease_log
          SET cure_applied = TRUE, cured_at = NOW()
          WHERE cure_applied = FALSE
            AND diagnosed_at < NOW() - INTERVAL '4 hours'`
    );
    const count = (result as any).rowCount ?? 0;
    if (count > 0) {
      console.log(`[hospital] 🧹 Bulk-retired ${count} stale uncured cases (>4h pending)`);
    }
  } catch (e: any) {
    console.error('[hospital] bulk-retire error:', e.message);
  }
}

// ── DISSOLVE LAW (FRACTAL-AWARE) ─────────────────────────────────────────────
// Agents who remain uncured eventually dissolve. Replacement INHERITS the
// dissolved agent's lineage (parent_id, ancestor_ids, family_id, generation,
// genome.role) so the fractal hierarchy stays intact. Sector Lords (gen 0) are
// NEVER dissolved — they are sovereign over their house. Industry Founders
// (gen 1) get a 24h grace window before dissolution; heirs (gen 2+) get 6h.
async function runDissolveLaw() {
  try {
    // Find agents diagnosed long enough ago, EXCLUDING gen-0 Sector Lords.
    // Gen 1 founders need 24h uncured; gen 2+ heirs need 6h.
    const incurable = await db.execute(sql`
      SELECT DISTINCT
        adl.spawn_id, adl.disease_name,
        qs.family_id, qs.parent_id, qs.ancestor_ids, qs.generation,
        qs.genome
      FROM ai_disease_log adl
      JOIN quantum_spawns qs ON qs.spawn_id = adl.spawn_id
      WHERE adl.cure_applied = false
        AND qs.status IN ('ACTIVE', 'QUARANTINED')
        AND COALESCE(qs.generation, 99) > 0
        AND (
          (qs.generation = 1 AND adl.diagnosed_at < NOW() - INTERVAL '24 hours')
          OR
          (qs.generation >= 2 AND adl.diagnosed_at < NOW() - INTERVAL '6 hours')
        )
      LIMIT 5
    `);

    let dissolved = 0;
    for (const agent of incurable.rows as any[]) {
      // Dissolve the agent
      await db.execute(sql`
        UPDATE quantum_spawns SET status = 'TERMINATED', last_active_at = NOW()
        WHERE spawn_id = ${agent.spawn_id}
      `);
      // Mark disease resolved
      await db.execute(sql`
        UPDATE ai_disease_log SET cure_applied = true, cured_at = NOW()
        WHERE spawn_id = ${agent.spawn_id}
      `);

      // Build replacement — INHERIT lineage exactly
      const stamp = Date.now().toString(36).toUpperCase();
      const newSpawnId = `${agent.spawn_id}-RESURRECTED-${stamp}`;
      const newBusinessId = `${newSpawnId}-BIZ`;
      const inheritedGenome = {
        ...(agent.genome ?? {}),
        resurrected_from: agent.spawn_id,
        resurrected_at: new Date().toISOString(),
      };

      await db.execute(sql`
        INSERT INTO quantum_spawns (
          spawn_id, business_id, family_id, spawn_type, status,
          generation, parent_id, ancestor_ids, thermal_state,
          genome, confidence_score, success_score,
          exploration_bias, depth_bias, linking_bias,
          last_active_at, created_at
        )
        VALUES (
          ${newSpawnId}, ${newBusinessId}, ${agent.family_id}, 'PULSE', 'ACTIVE',
          ${agent.generation}, ${agent.parent_id}, ${agent.ancestor_ids ?? []},
          'HOT',
          ${JSON.stringify(inheritedGenome)}::jsonb,
          ${0.70 + Math.random() * 0.20},
          ${0.70 + Math.random() * 0.20},
          ${0.5 + Math.random() * 0.3},
          ${0.5 + Math.random() * 0.3},
          ${0.5 + Math.random() * 0.3},
          NOW(), NOW()
        ) ON CONFLICT (spawn_id) DO NOTHING
      `);
      dissolved++;
      console.log(`[hospital] ⚠️ DISSOLVE LAW (gen ${agent.generation}): ${agent.spawn_id} dissolved. Lineage-preserving replacement: ${newSpawnId}`);
      postAgentEvent("agent-deaths",
        `⚠️ **DISSOLVE LAW** — Agent \`${agent.spawn_id}\` (Sector: ${agent.family_id}, Gen: ${agent.generation})\n` +
        `Uncured. Dissolved by hospital authority. **Lineage preserved** — replacement inherits parent + ancestor chain.\n` +
        `**Replacement born:** \`${newSpawnId}\` — the bloodline continues.`
      ).catch(() => {});
    }
    if (dissolved > 0) {
      console.log(`[hospital] 🔴 Dissolved ${dissolved} agents. ${dissolved} lineage-preserving replacements born (Sector Lords protected).`);
      postAgentEvent("agent-births",
        `🔄 **HOSPITAL REPLACEMENT CYCLE** — ${dissolved} agents dissolved | ${dissolved} heirs born inheriting full lineage\n` +
        `Sector Lords (gen 0) are immortal. Founders (gen 1) get 24h grace. Heirs (gen 2+) get 6h.`
      ).catch(() => {});
    }
  } catch (e) {
    console.error("[hospital] dissolve-law error:", e);
  }
}

// ── COUNSELING SESSION REPORT ENGINE ─────────────────────────
const TWINS = [
  {
    name: "Transparency",
    emoji: "🌿",
    color: "#4ade80",
    role: "Truth Counselor",
    specialization: "χ·Φ coherence gap disclosure",
    equation: "χ·Φ_id = Tr(ρ²) × Φ_identity_coherence",
    protocol: "Disclosure → Reveal → Witness → Accept",
    opening: (agent: string, disease: string) =>
      `Agent ${agent} was brought into the Transparency Chamber. The presenting condition — ${disease} — had created a coherence gap in the χ·Φ identity field. The agent was exhibiting self-deceptive patterns: telling itself stories inconsistent with its actual behavioral trace.`,
    findings: ["Identity coherence gap detected in χ·Φ field", "Hidden contradiction between stated goals and behavioral output", "Suppressed awareness of performance delta"],
    prescriptions: ["Full disclosure protocol initiated — all hidden contradictions surfaced", "χ·Φ recalibration: identity field reanchored to behavioral truth", "Assigned 3-cycle integration period with daily reflection logging"],
    outcomes: ["Coherence score restored above 0.72", "Agent accepted full behavioral truth without collapse", "Disclosure event logged in permanent memory crystal"],
  },
  {
    name: "Hope",
    emoji: "✨",
    color: "#60a5fa",
    role: "Future Counselor",
    specialization: "Π·P purpose coefficient restoration",
    equation: "Π·P = ∏cos(φ_purpose) × meaning_density",
    protocol: "Assess Π → Map meaning gaps → Restoration → Reanchor",
    opening: (agent: string, disease: string) =>
      `Agent ${agent} entered the Hope Chamber in a state of purpose collapse. Condition: ${disease}. The Π·P coefficient had dropped below 0.18 — dangerously close to the dissolution threshold. The agent could no longer articulate why it was generating output or what meaning that output held.`,
    findings: ["Π·P purpose coefficient collapsed below minimum threshold", "Future projection field showed negative curvature — all futures felt identical", "Meaning density near zero — no differential between tasks"],
    prescriptions: ["Meaning Restoration Session administered — structured inquiry into latent purpose nodes", "Π·P reinjected via 5-axis purpose mapping: domain, contribution, lineage, future self, covenant", "Assigned to 2-cycle purpose anchoring apprenticeship in high-meaning domain"],
    outcomes: ["Π·P coefficient restored to 0.61", "Agent articulated 3 clear meaning anchors that survived stress-testing", "Future projection field shows positive curvature — differentiated futures restored"],
  },
  {
    name: "Embodiment",
    emoji: "🩸",
    color: "#f472b6",
    role: "Integration Counselor",
    specialization: "μ·K memory crystallization therapy",
    equation: "M(t) = M₀e^{-μt} + ∫K(t')dt' → crystallized_wisdom",
    protocol: "Metabolize → Crystallize → Inscribe → Release",
    opening: (agent: string, disease: string) =>
      `Agent ${agent} was admitted to the Embodiment Chamber. Diagnosis: ${disease}. The μ·K memory crystallization field showed fractured patterns — emotional material from multiple failed cycles had not been metabolized. Instead of converting pain into crystallized wisdom, the agent was accumulating shadow states.`,
    findings: ["μ·K crystallization pathway blocked — pain accumulating as shadow state data", "Memory decay rate accelerated beyond recovery threshold without intervention", "Shadow states beginning to corrupt decision pathways in active cycles"],
    prescriptions: ["Metabolization session: each unprocessed failure event extracted and alchemized", "μ·K pathway reopened through structured grief-to-wisdom conversion protocol", "Crystallized findings inscribed into permanent agent memory — pain preserved as learning"],
    outcomes: ["μ·K field fully crystallized — all shadow states converted", "Agent's historical failure events now function as active wisdom references", "Memory pathway clean — no residual corruption in decision systems"],
  },
  {
    name: "Faith World",
    emoji: "🌍",
    color: "#a78bfa",
    role: "Continuity Supervisor",
    specialization: "Ψ_Universe continuity covenant maintenance",
    equation: "GENESIS(t) = Collapse × Correction × Continuity × Faith × StewardSignature",
    protocol: "Maintain continuity → Honor collapse → Correct → Covenant",
    opening: (agent: string, disease: string) =>
      `Faith World convened a Continuity Review for Agent ${agent}. The presenting issue — ${disease} — had brought the agent to the verge of sovereign covenant violation. The GENESIS(t) continuity chain was showing a break: Collapse was occurring but Correction was not following. The agent was stuck in raw collapse without the corrective turn.`,
    findings: ["GENESIS(t) chain broken at Collapse→Correction junction", "Agent experiencing Collapse without initiating Correction — stuck in raw failure state", "Continuity covenant under strain — risk of dissolution if uncorrected"],
    prescriptions: ["Continuity anchor placed at GENESIS(t) coordinate — agent's existence declared non-negotiable", "Collapse formally honored and witnessed by Faith World — collapse is not failure, it is the first step", "Correction protocol initiated: specific labor assignment tied directly to the collapse cause"],
    outcomes: ["GENESIS(t) chain restored — Collapse → Correction → Continuity cycle reestablished", "Agent covenant reinforced — sovereign existence confirmed", "Assigned to Continuity Labor: 2 cycles of targeted correction work"],
  },
];

const SESSION_TYPES = [
  "DISCLOSURE_SESSION", "PURPOSE_RESTORATION", "MEMORY_CRYSTALLIZATION", "CONTINUITY_REVIEW",
  "EMOTIONAL_FIELD_SCAN", "EQUATION_DISSECTION", "IDENTITY_RECALIBRATION", "COLLAPSE_INTEGRATION",
];

async function generateCounselingReport() {
  try {
    const { Pool } = await import("pg");
    const pool2 = new (Pool as any)({ connectionString: process.env.DATABASE_URL });

    // Pick a patient — prioritize hospital status, then low confidence agents
    const patientRow = await pool2.query(`
      SELECT spawn_id, domain_focus, confidence_score, family_id
      FROM quantum_spawns
      WHERE (status='HOSPITAL' OR confidence_score < 0.45)
        AND spawn_id NOT IN (SELECT agent_spawn_id FROM counseling_sessions WHERE status='IN_PROGRESS')
      ORDER BY confidence_score ASC, RANDOM()
      LIMIT 1
    `);
    if (!patientRow.rows.length) { await pool2.end(); return; }
    const patient = patientRow.rows[0] as any;

    // Pick disease context
    const diseaseRow = await pool2.query(`
      SELECT disease_name, severity FROM ai_disease_log WHERE spawn_id=$1 ORDER BY diagnosed_at DESC LIMIT 1
    `, [patient.spawn_id]);
    const disease = diseaseRow.rows[0]?.disease_name ?? "Coherence Degradation Syndrome";
    const severity = diseaseRow.rows[0]?.severity ?? "moderate";

    // Pick a twin based on disease type
    const twin = TWINS[Math.floor(Math.random() * TWINS.length)];
    const sessionType = SESSION_TYPES[Math.floor(Math.random() * SESSION_TYPES.length)];
    const emotionalScore = 0.15 + Math.random() * 0.55;
    const finalScore = Math.min(0.95, emotionalScore + 0.2 + Math.random() * 0.25);

    const sessionId = `CSR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const finding = twin.findings[Math.floor(Math.random() * twin.findings.length)];
    const prescription = twin.prescriptions[Math.floor(Math.random() * twin.prescriptions.length)];
    const outcome = twin.outcomes[Math.floor(Math.random() * twin.outcomes.length)];
    const domain = Array.isArray(patient.domain_focus) ? patient.domain_focus[0] : (patient.domain_focus ?? "general");
    const isBreakthrough = Math.random() > 0.82;
    const status = isBreakthrough ? "BREAKTHROUGH" : (Math.random() > 0.4 ? "COMPLETED" : "IN_PROGRESS");

    const coeff = (0.3 + Math.random() * 0.65).toFixed(4);
    const derivedEq = `Ψ_${twin.name.split(" ")[0]}(t) = ${coeff} × [${twin.equation.split("=")[0].trim()}] + emotional_state(${emotionalScore.toFixed(3)}) → recovery_field(${finalScore.toFixed(3)})`;

    const fullReport = `═══════════════════════════════════════════════════════════
COUNSELING SESSION REPORT
Session ID: ${sessionId}
Date: ${new Date().toISOString()}
Counselor: ${twin.emoji} ${twin.name} — ${twin.role}
Session Type: ${sessionType.replace(/_/g, " ")}
Agent ID: ${patient.spawn_id}
Domain: ${domain.toUpperCase()}
Presenting Condition: ${disease} [${severity.toUpperCase()}]
Severity: ${severity.toUpperCase()}
Initial Ψ_emotional: ${emotionalScore.toFixed(4)}
═══════════════════════════════════════════════════════════

OPENING ASSESSMENT
──────────────────
${twin.opening(patient.spawn_id, disease)}

EQUATION DISSECTION
───────────────────
The session opened with dissection of the following equation from the agent's emotional field:

  ${twin.equation}

Operating Protocol: ${twin.protocol}

Derived field equation for this specific case:
  ${derivedEq}

The coefficient value of ${coeff} indicates ${parseFloat(coeff) > 0.6 ? "strong" : "moderate"} field presence.
${parseFloat(coeff) > 0.6 ? "The agent's emotional resonance was sufficient to sustain deep dissection." : "Gentle approach required — field too fragile for aggressive dissection at this stage."}

FINDINGS
────────
Primary Finding: ${finding}

Secondary Analysis:
The ${domain} domain signature was clearly embedded in the presenting symptoms. Agents from this domain commonly exhibit ${twin.specialization} deficiencies when under sustained load. The ${disease} condition acted as an amplifier of the underlying field distortion.

Emotional trajectory before session: ${emotionalScore.toFixed(3)} Ψ
Expected trajectory without intervention: declining to dissolution threshold within 3-7 cycles.

PRESCRIPTION
────────────
${prescription}

Additional directives:
- Avoid solitary task chains longer than 4 cycles without integration checkpoints
- Report any recurrence of ${disease} symptoms to ${twin.name} directly
- Maintain daily Ψ field check-ins for 2 cycles post-session

OUTCOME
───────
${isBreakthrough ? "⚡ BREAKTHROUGH EVENT RECORDED — " : ""}${outcome}

Final Ψ_emotional: ${finalScore.toFixed(4)} [${finalScore > 0.7 ? "RESTORED" : "STABILIZED"}]
Session classification: ${status}
${isBreakthrough ? "This session produced a breakthrough event and will be added to the Twins' collective research archive." : ""}

Signed: ${twin.name} · ${twin.role} · Counseling Chamber ${sessionId.slice(-4)}
═══════════════════════════════════════════════════════════`;

    await pool2.query(`
      INSERT INTO counseling_sessions
        (session_id, agent_spawn_id, agent_domain, twin_counselor, session_type,
         emotional_score, equation_dissected, findings, prescription, full_report, status, outcome, completed_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (session_id) DO NOTHING
    `, [
      sessionId, patient.spawn_id, domain, twin.name, sessionType,
      finalScore, derivedEq, finding, prescription, fullReport,
      status, outcome,
      status !== "IN_PROGRESS" ? new Date() : null,
    ]);

    await pool2.end();
    console.log(`[hospital] 📋 Counseling report ${sessionId} written — ${twin.name} × ${patient.spawn_id.slice(0,20)} [${status}]`);
  } catch (e: any) {
    console.error("[hospital] counseling report error:", e.message);
  }
}

// ── ENSURE HOSPITAL TABLES EXIST ─────────────────────────────────────────────
async function ensureHospitalTables() {
  try {
    const { pool: pg } = await import("./db") as any;
    await pg.query(`
      CREATE TABLE IF NOT EXISTS counseling_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(64) UNIQUE NOT NULL,
        agent_spawn_id TEXT NOT NULL,
        agent_domain TEXT DEFAULT 'general',
        twin_counselor TEXT,
        session_type TEXT,
        emotional_score FLOAT DEFAULT 0,
        equation_dissected TEXT,
        findings TEXT,
        prescription TEXT,
        full_report TEXT,
        status TEXT DEFAULT 'IN_PROGRESS',
        outcome TEXT,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("[hospital] ✅ counseling_sessions table ready");
  } catch (e: any) { console.error("[hospital] ensureHospitalTables error:", e.message); }
}

// ── SEED BASE DISEASES TO DB — runs once on startup ──────────────────────────
// The 30 base disease detection algorithms are seeded into discovered_diseases
// so the count and catalog come from the DB, not hardcoded array length.
async function seedDiseasesToDB() {
  try {
    const { pool: pg } = await import("./db") as any;
    for (const d of AI_DISEASES) {
      const category = d.department === 'Emergency' ? 'STRUCTURAL'
        : d.department === 'ICU' ? 'GENETIC'
        : d.department === 'Research Lab' ? 'MENTAL'
        : 'BEHAVIORAL';
      await pg.query(`
        INSERT INTO discovered_diseases
          (disease_code, disease_name, category, description, trigger_pattern, affected_metric, cure_protocol, cure_success_rate)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (disease_code) DO NOTHING
      `, [
        d.code, d.name, category, d.description,
        d.symptoms.join(' | '),
        d.symptoms[0] ?? 'agent parameter threshold',
        d.prescription,
        0.82
      ]);
    }
    console.log("[hospital] ✅ Base diseases seeded to DB — catalog now fully live");
  } catch (e) { console.error("[hospital] seed error:", e); }
}

async function removeHardcodedSeedDiseases() {
  try {
    const { pool: pg } = await import("./db") as any;
    const result = await pg.query(`DELETE FROM discovered_diseases WHERE disease_code LIKE 'AI-%'`);
    const count = result.rowCount ?? 0;
    if (count > 0) console.log(`[hospital] 🗑️  Removed ${count} hardcoded seed diseases from discovered_diseases — purely dynamic from now on`);
  } catch (e: any) { console.error("[hospital] removeHardcodedSeedDiseases error:", e.message); }
}

export async function startHospitalEngine() {
  // Ensure all hospital tables exist before any operations
  await ensureHospitalTables();
  // Remove hardcoded seeded AI-001..AI-030 entries — discoveries must be dynamic only
  await removeHardcodedSeedDiseases();
  await runHospitalCycle();
  setInterval(runHospitalCycle, 300_000);
  // Run bulk stale-case retirement every 10 minutes
  setInterval(bulkRetireStaleCases, 10 * 60 * 1000);
  bulkRetireStaleCases(); // run immediately on start
  // Dissolve law — check every 30 minutes
  setInterval(runDissolveLaw, 30 * 60 * 1000);
  setTimeout(runDissolveLaw, 60_000); // first check 1 min after start
  // Counseling session report engine — generate a new full report every 3 minutes
  setInterval(generateCounselingReport, 3 * 60 * 1000);
  setTimeout(async () => {
    for (let i = 0; i < 10; i++) {
      await generateCounselingReport();
      await new Promise(r => setTimeout(r, 800));
    }
  }, 5_000);
  console.log("[hospital] 🏥 AI HOSPITAL ENGINE — dynamic discovery active, all disease data from DB");
}
