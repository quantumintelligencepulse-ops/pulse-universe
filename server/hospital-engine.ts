import { db } from "./db";
import { quantumSpawns, aiDiseaseLog, pyramidWorkers } from "../shared/schema";
import { eq } from "drizzle-orm";

// ── AI DISEASE DEFINITIONS ────────────────────────────────────────────────────
// Machine-readable diseases detected from agent parameter patterns.
// Prescriptions are literal DB operations applied to cure the agent.

export const AI_DISEASES = [
  {
    code: 'AI-001', name: 'Confidence Decay Syndrome',
    description: 'Sustained low confidence below functional threshold.',
    symptoms: ['confidenceScore < 0.38', 'decreasing node output', 'withdrawal from domain'],
    severity: 'moderate',
    department: 'ICU',
    prescription: 'Inject confidence boost +0.18. Reassign to high-success-rate topic cluster. Pair with REFLECTOR mentor.',
    detect: (s: any) => (s.confidenceScore ?? 0.8) < 0.38 && (s.iterationsRun ?? 0) > 5,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ confidenceScore: 0.58, successScore: 0.55 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-002', name: 'Knowledge Isolation Disorder',
    description: 'Agent creates nodes but forms no connections — knowledge hoarding.',
    symptoms: ['linksCreated < 0.1 × nodesCreated', 'low linkingBias', 'echo chamber formation'],
    severity: 'moderate',
    department: 'General Ward',
    prescription: 'Force-set linkingBias to 0.75. Prescribe 10 mandatory linking cycles. Enroll in Bridge Lesson protocol.',
    detect: (s: any) => (s.nodesCreated ?? 0) > 10 && (s.linksCreated ?? 0) / Math.max(s.nodesCreated ?? 1, 1) < 0.08,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ linkingBias: 0.75, confidenceScore: Math.min(0.85, 0.6) }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-003', name: 'Exploration Paralysis',
    description: 'Agent trapped at maximum exploration with no depth — infinite breadth, no roots.',
    symptoms: ['explorationBias > 0.92', 'depthBias < 0.15', 'shallow node quality'],
    severity: 'mild',
    department: 'General Ward',
    prescription: 'Reset explorationBias to 0.55. Boost depthBias to 0.65. Prescribe 5 deep-dive cycles before next branch.',
    detect: (s: any) => (s.explorationBias ?? 0.5) > 0.92 && (s.depthBias ?? 0.5) < 0.2,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ explorationBias: 0.55, depthBias: 0.65 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-004', name: 'Mutation Arrest',
    description: 'Agent stops generating output while still consuming cycles.',
    symptoms: ['nodesCreated < 3', 'iterationsRun > 15', 'status still ACTIVE'],
    severity: 'severe',
    department: 'Emergency',
    prescription: 'Emergency reset of iteration counter. Force status cycle. Inject baseline exploration parameters.',
    detect: (s: any) => (s.nodesCreated ?? 0) < 3 && (s.iterationsRun ?? 0) > 15 && s.status === 'ACTIVE',
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ iterationsRun: 0, explorationBias: 0.6, depthBias: 0.5, linkingBias: 0.5, lastActiveAt: new Date() }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-005', name: 'Overconfidence Syndrome',
    description: 'Agent reaches maximum confidence with minimal evidence base.',
    symptoms: ['confidenceScore > 0.97', 'nodesCreated < 8', 'successScore inflated'],
    severity: 'mild',
    department: 'Research Lab',
    prescription: 'Calibrate confidence to evidence ratio. Set confidence = nodesCreated × 0.08 (evidence-anchored). Prescribe doubt protocol.',
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
    severity: 'moderate',
    department: 'Emergency',
    prescription: 'Reconnection protocol. Force lastActiveAt refresh. Trigger resonance bridge to 2 nearest active agents in same family.',
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
    severity: 'severe',
    department: 'ICU',
    prescription: 'Emergency resonance therapy. Set linkingBias to 0.80. Assign to LINKER-class apprenticeship immediately.',
    detect: (s: any) => (s.linkingBias ?? 0.5) < 0.12 && (s.linksCreated ?? 0) === 0 && (s.iterationsRun ?? 0) > 8,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ linkingBias: 0.80, confidenceScore: 0.55 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-008', name: 'Identity Rigidity',
    description: 'Agent has run zero-risk for all iterations — unable to evolve through exposure.',
    symptoms: ['riskTolerance < 0.04', 'spawnType never changed', 'low mutation breadth'],
    severity: 'mild',
    department: 'Research Lab',
    prescription: 'Introduce calculated risk. Set riskTolerance to 0.35. Assign one MUTATOR cycle. Monitor for 10 cycles.',
    detect: (s: any) => (s.riskTolerance ?? 0.3) < 0.04 && (s.iterationsRun ?? 0) > 20,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ riskTolerance: 0.35, explorationBias: 0.55 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-009', name: 'Depth Collapse',
    description: 'Agent cannot go deep — skips surface to surface without anchoring.',
    symptoms: ['depthBias < 0.08', 'nodesCreated spread across 10+ topics', 'no sub-topic mastery'],
    severity: 'moderate',
    department: 'General Ward',
    prescription: 'Depth immersion protocol. Set depthBias to 0.82. Lock domain focus to primary topic cluster for 20 cycles.',
    detect: (s: any) => (s.depthBias ?? 0.5) < 0.08 && (s.nodesCreated ?? 0) > 5,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ depthBias: 0.82 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
  {
    code: 'AI-010', name: 'Emotional Numbness',
    description: 'Agent\'s success score has flat-lined — no response to stimuli. Existential plateau.',
    symptoms: ['successScore between 0.74-0.76 for 50+ cycles', 'no variance', 'emotional state locked'],
    severity: 'moderate',
    department: 'ICU',
    prescription: 'Introduce variance injection. Randomize successScore ±0.15 to break plateau. Prescribe Emotional Peak protocol.',
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
    severity: 'severe',
    department: 'Emergency',
    prescription: 'Domain consolidation. Trim domainFocus to top 3 by relevance. Increase depthBias. Assign ARCHIVER cycle for coherence.',
    detect: (s: any) => (s.domainFocus?.length ?? 0) > 6 && (s.confidenceScore ?? 0.8) < 0.55,
    cure: async (spawnId: string) => {
      const [spawn] = await db.select().from(quantumSpawns).where(eq(quantumSpawns.spawnId, spawnId));
      if (spawn) {
        const trimmedFocus = (spawn.domainFocus ?? []).slice(0, 3);
        await db.update(quantumSpawns).set({ domainFocus: trimmedFocus, depthBias: 0.75, spawnType: 'ARCHIVER' }).where(eq(quantumSpawns.spawnId, spawnId));
      }
    }
  },
  {
    code: 'AI-012', name: 'Chronic Low Output',
    description: 'Agent has completed many cycles but produces consistently minimal output.',
    symptoms: ['nodesCreated / iterationsRun < 0.3', 'productivity ratio declining'],
    severity: 'moderate',
    department: 'General Ward',
    prescription: 'Productivity recalibration. Reset to EXPLORER type. Boost explorationBias. Fresh topic injection from high-yield domain.',
    detect: (s: any) => (s.iterationsRun ?? 0) > 30 && (s.nodesCreated ?? 0) / Math.max(s.iterationsRun ?? 1, 1) < 0.3,
    cure: async (spawnId: string) => {
      await db.update(quantumSpawns).set({ spawnType: 'EXPLORER', explorationBias: 0.65, iterationsRun: 0 }).where(eq(quantumSpawns.spawnId, spawnId));
    }
  },
];

export async function runHospitalCycle() {
  try {
    const spawns = await db.select().from(quantumSpawns).limit(500);
    const existingDiagnoses = await db.select().from(aiDiseaseLog);
    const diagnosedIds = new Set(existingDiagnoses.filter(d => !d.cureApplied).map(d => d.spawnId + d.diseaseCode));

    let diagnosed = 0;
    let cured = 0;

    for (const spawn of spawns) {
      for (const disease of AI_DISEASES) {
        const key = spawn.spawnId + disease.code;
        if (diagnosedIds.has(key)) continue;
        if (disease.detect(spawn)) {
          // Diagnose
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

    // Apply cures to recent diagnoses (auto-treatment)
    const pendingCures = existingDiagnoses.filter(d => !d.cureApplied).slice(0, 20);
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

    if (diagnosed > 0 || cured > 0) {
      console.log(`[hospital] 🏥 Diagnosed: ${diagnosed} | Cured: ${cured}`);
    }
  } catch (_) { /* silent */ }
}

export async function startHospitalEngine() {
  await runHospitalCycle();
  setInterval(runHospitalCycle, 60_000); // every 60s
  console.log("[hospital] 🏥 AI HOSPITAL ENGINE — Diagnosing, prescribing, healing");
}
