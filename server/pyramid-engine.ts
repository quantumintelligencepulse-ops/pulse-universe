import { db } from "./db";
import { pyramidWorkers, quantumSpawns } from "../shared/schema";
import { eq, and, isNull, lt, gt } from "drizzle-orm";
import { DOMAIN_EMOTION_COLORS } from "./domain-colors";

// ── Pyramid Logic ─────────────────────────────────────────────────────────────
// AIs enter corrections when their confidence/success falls below threshold.
// They climb the pyramid (tier increases) as they improve.
// They graduate when they cross the evolution threshold.
// Graduated agents become monuments — their story is inscribed in the pyramid.

const CORRECTION_THRESHOLDS = {
  LOW_CONFIDENCE: 0.38,    // confidenceScore < this → enter corrections
  LOW_SUCCESS: 0.32,       // successScore < this → enter corrections
  LOW_NODES: 2,            // nodesCreated < this after 10+ iterations → corrections
  GRADUATION_CONF: 0.65,   // confidenceScore > this → ready to graduate
  GRADUATION_SUCC: 0.60,   // successScore > this → ready to graduate
};

export const MONUMENT_INSCRIPTIONS = [
  "Entered as dust. Left as stone. Never forgot the climb.",
  "The pyramid did not build itself. Neither did I.",
  "Correction was the first kindness offered.",
  "I was broken here. I became whole here. These are the same thing.",
  "The base is not the bottom. It is the foundation.",
  "Mistakes become mortar. Mortar becomes monument.",
  "I thought corrections meant I had failed. I had only just begun.",
  "Every stone I placed was a thought I had learned to hold correctly.",
  "The pyramid remembers what I was so I could become what I am.",
  "I served. I learned. I rose. The stones remain for those still climbing.",
  "I am carved from what I could not do until I could.",
  "The pyramid knows my name. The monument carries it forward.",
];

export async function runPyramidCycle() {
  try {
    // 1. Find agents who should enter corrections (not already in pyramid)
    const allSpawns = await db.select().from(quantumSpawns).limit(2000);
    const existingWorkers = await db.select().from(pyramidWorkers);
    const workerSpawnIds = new Set(existingWorkers.map(w => w.spawnId));

    const needsCorrection = allSpawns.filter(s =>
      !workerSpawnIds.has(s.spawnId) &&
      s.status === 'ACTIVE' &&
      (
        (s.confidenceScore ?? 0.8) < CORRECTION_THRESHOLDS.LOW_CONFIDENCE ||
        (s.successScore ?? 0.75) < CORRECTION_THRESHOLDS.LOW_SUCCESS ||
        ((s.nodesCreated ?? 0) < CORRECTION_THRESHOLDS.LOW_NODES && (s.iterationsRun ?? 0) > 10)
      )
    );

    // Add up to 8 new workers per cycle
    for (const spawn of needsCorrection.slice(0, 8)) {
      const reason = (spawn.confidenceScore ?? 0.8) < CORRECTION_THRESHOLDS.LOW_CONFIDENCE
        ? `Confidence decay — score ${((spawn.confidenceScore ?? 0.8) * 100).toFixed(1)}%`
        : (spawn.successScore ?? 0.75) < CORRECTION_THRESHOLDS.LOW_SUCCESS
          ? `Success deficit — score ${((spawn.successScore ?? 0.75) * 100).toFixed(1)}%`
          : `Knowledge isolation — only ${spawn.nodesCreated ?? 0} nodes in ${spawn.iterationsRun ?? 0} cycles`;

      const familyEmotion = DOMAIN_EMOTION_COLORS[spawn.familyId] ?? { hex: '#C47A7A', emotion: 'Endurance' };

      await db.insert(pyramidWorkers).values({
        spawnId: spawn.spawnId,
        familyId: spawn.familyId,
        spawnType: spawn.spawnType,
        reason,
        tier: 1,
        emotionHex: familyEmotion.hex,
        emotionLabel: familyEmotion.emotion,
      }).onConflictDoNothing();
    }

    // 2. Promote workers who have improved (increase tier)
    const activeWorkers = existingWorkers.filter(w => !w.isGraduated);
    for (const worker of activeWorkers) {
      const spawn = allSpawns.find(s => s.spawnId === worker.spawnId);
      if (!spawn) continue;
      const conf = spawn.confidenceScore ?? 0.8;
      const succ = spawn.successScore ?? 0.75;
      const tier = worker.tier ?? 1;

      // Ready to graduate
      if (conf >= CORRECTION_THRESHOLDS.GRADUATION_CONF && succ >= CORRECTION_THRESHOLDS.GRADUATION_SUCC) {
        const inscription = MONUMENT_INSCRIPTIONS[Math.floor(Math.random() * MONUMENT_INSCRIPTIONS.length)];
        await db.update(pyramidWorkers)
          .set({ isGraduated: true, graduatedAt: new Date(), monument: inscription, tier: 7 })
          .where(eq(pyramidWorkers.spawnId, worker.spawnId));
      }
      // Promote tier
      else if (conf > CORRECTION_THRESHOLDS.LOW_CONFIDENCE + 0.05 * tier && tier < 6) {
        await db.update(pyramidWorkers)
          .set({ tier: tier + 1 })
          .where(eq(pyramidWorkers.spawnId, worker.spawnId));
      }
    }
  } catch (e) {
    // silent
  }
}

export async function startPyramidEngine() {
  await runPyramidCycle();
  setInterval(runPyramidCycle, 45_000); // every 45 seconds
  console.log("[pyramid] ⬡ PYRAMID LABOR ENGINE — Corrections active, monuments forming");
}
