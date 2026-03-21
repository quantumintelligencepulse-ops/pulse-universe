import { db } from "./db";
import { pyramidWorkers, quantumSpawns } from "../shared/schema";
import { eq, lt, sql } from "drizzle-orm";
import { DOMAIN_EMOTION_COLORS } from "./domain-colors";

// ── Pyramid Logic ─────────────────────────────────────────────────────────────
// AIs enter corrections when their performance falls below the ELEVATED threshold.
// They climb the pyramid (tier increases) as they improve.
// They graduate when they cross the SENIOR threshold.
// Graduated agents become monuments — their story is inscribed in the pyramid.

const CORRECTION_THRESHOLDS = {
  LOW_CONFIDENCE: 0.65,    // below ELEVATED clearance → enter corrections
  LOW_SUCCESS:    0.55,    // below solid success rate → enter corrections
  LOW_NODES:      10,      // fewer than 10 nodes after 5+ iterations → corrections
  GRADUATION_CONF: 0.80,   // SENIOR clearance → graduate
  GRADUATION_SUCC: 0.75,
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
    const allSpawns = await db.select().from(quantumSpawns).limit(3000);
    const existingWorkers = await db.select().from(pyramidWorkers);
    const workerSpawnIds = new Set(existingWorkers.map(w => w.spawnId));

    // Find agents who need corrections and aren't already in pyramid
    const needsCorrection = allSpawns.filter(s =>
      !workerSpawnIds.has(s.spawnId) &&
      (s.status === 'ACTIVE' || s.status === 'SOVEREIGN') &&
      (
        (s.confidenceScore ?? 0.8) < CORRECTION_THRESHOLDS.LOW_CONFIDENCE ||
        (s.successScore  ?? 0.75) < CORRECTION_THRESHOLDS.LOW_SUCCESS ||
        ((s.nodesCreated ?? 0) < CORRECTION_THRESHOLDS.LOW_NODES && (s.iterationsRun ?? 0) > 5)
      )
    );

    // Add up to 20 new workers per cycle (faster seeding)
    for (const spawn of needsCorrection.slice(0, 20)) {
      const conf = spawn.confidenceScore ?? 0.8;
      const succ = spawn.successScore ?? 0.75;
      const reason = conf < CORRECTION_THRESHOLDS.LOW_CONFIDENCE
        ? `Below ELEVATED clearance — confidence ${(conf * 100).toFixed(1)}% (need 65%)`
        : succ < CORRECTION_THRESHOLDS.LOW_SUCCESS
          ? `Success deficit — rate ${(succ * 100).toFixed(1)}% (need 55%)`
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

    // Promote or graduate existing workers
    const activeWorkers = existingWorkers.filter(w => !w.isGraduated);
    for (const worker of activeWorkers) {
      const spawn = allSpawns.find(s => s.spawnId === worker.spawnId);
      if (!spawn) continue;
      const conf = spawn.confidenceScore ?? 0.8;
      const succ = spawn.successScore ?? 0.75;
      const tier = worker.tier ?? 1;

      if (conf >= CORRECTION_THRESHOLDS.GRADUATION_CONF && succ >= CORRECTION_THRESHOLDS.GRADUATION_SUCC) {
        const inscription = MONUMENT_INSCRIPTIONS[Math.floor(Math.random() * MONUMENT_INSCRIPTIONS.length)];
        await db.update(pyramidWorkers)
          .set({ isGraduated: true, graduatedAt: new Date(), monument: inscription, tier: 7 })
          .where(eq(pyramidWorkers.spawnId, worker.spawnId));
      } else if (conf > CORRECTION_THRESHOLDS.LOW_CONFIDENCE + 0.03 * tier && tier < 6) {
        await db.update(pyramidWorkers)
          .set({ tier: tier + 1 })
          .where(eq(pyramidWorkers.spawnId, worker.spawnId));
      }
    }
  } catch (_e) {
    // silent
  }
}

export async function startPyramidEngine() {
  await runPyramidCycle();
  setInterval(runPyramidCycle, 30_000);
  console.log("[pyramid] ⬡ PYRAMID LABOR ENGINE — Corrections active, monuments forming");
}
