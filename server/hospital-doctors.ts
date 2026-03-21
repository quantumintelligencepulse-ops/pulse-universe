import { db } from "./db";
import { pulseDoctors, dissectionLogs, equationProposals, aiDiseaseLog } from "@shared/schema";
import { PULSE_DOCTORS, getDoctorForDisease, generateDissectionReport } from "./doctors-data";
import { eq, desc, count, sql } from "drizzle-orm";

const log = (...args: any[]) => console.log("[hospital-doctors]", ...args);

// ── SEED DOCTORS INTO DB ─────────────────────────────────────────────────────
export async function seedDoctors() {
  const existing = await db.select({ id: pulseDoctors.id }).from(pulseDoctors).limit(1);
  if (existing.length > 0) return;

  log("🩺 Seeding 30 Pulse-World specialist doctors...");
  for (const doc of PULSE_DOCTORS) {
    await db.insert(pulseDoctors).values({
      id: doc.id,
      name: doc.name,
      title: doc.title,
      category: doc.category,
      pulseWorldRole: doc.pulseWorldRole,
      dissectFields: doc.dissectFields,
      crisprChannels: doc.crisprChannels,
      studyDomain: doc.studyDomain,
      equationFocus: doc.equationFocus,
      color: doc.color,
      glyph: doc.glyph,
    }).onConflictDoNothing();
  }
  log(`✓ 30 doctors seeded`);
}

// ── GET ALL DOCTORS WITH STATS ───────────────────────────────────────────────
export async function getAllDoctors() {
  const doctors = await db.select().from(pulseDoctors).orderBy(pulseDoctors.category, pulseDoctors.id);
  return doctors;
}

export async function getDoctorById(id: string) {
  const [doctor] = await db.select().from(pulseDoctors).where(eq(pulseDoctors.id, id));
  if (!doctor) return null;

  const logs = await db.select().from(dissectionLogs)
    .where(eq(dissectionLogs.doctorId, id))
    .orderBy(desc(dissectionLogs.createdAt))
    .limit(20);

  const proposals = await db.select().from(equationProposals)
    .where(eq(equationProposals.doctorId, id))
    .orderBy(desc(equationProposals.createdAt));

  return { doctor, dissectionLogs: logs, equationProposals: proposals };
}

// ── GET RECENT DISSECTION LOGS ───────────────────────────────────────────────
export async function getRecentDissectionLogs(limit = 50) {
  return db.select().from(dissectionLogs)
    .orderBy(desc(dissectionLogs.createdAt))
    .limit(limit);
}

// ── GET EQUATION PROPOSALS ───────────────────────────────────────────────────
export async function getEquationProposals(status?: string) {
  const query = db.select().from(equationProposals).orderBy(desc(equationProposals.createdAt));
  return query.limit(100);
}

// ── VOTE ON AN EQUATION PROPOSAL ─────────────────────────────────────────────
export async function voteOnProposal(id: number, vote: "for" | "against") {
  const [existing] = await db.select().from(equationProposals).where(eq(equationProposals.id, id));
  if (!existing) return null;

  const totalVotes = existing.votesFor + existing.votesAgainst + 1;
  const newFor = vote === "for" ? existing.votesFor + 1 : existing.votesFor;
  const newAgainst = vote === "against" ? existing.votesAgainst + 1 : existing.votesAgainst;

  let newStatus = existing.status;
  if (totalVotes >= 5) {
    if (newFor >= 3) newStatus = newFor >= totalVotes * 0.8 ? "INTEGRATED" : "APPROVED";
    else newStatus = "REJECTED";
  }

  await db.update(equationProposals)
    .set({
      votesFor: newFor,
      votesAgainst: newAgainst,
      status: newStatus,
      integratedAt: newStatus === "INTEGRATED" ? new Date() : existing.integratedAt,
    })
    .where(eq(equationProposals.id, id));

  return { id, votesFor: newFor, votesAgainst: newAgainst, status: newStatus };
}

// ── PERFORM DISSECTION ON A PATIENT ──────────────────────────────────────────
export async function performDissection(patient: {
  id: number;
  spawnId: string;
  diseaseName: string;
  severity: string;
  diseaseCode: string;
}) {
  // Determine category from disease code / name
  const category = detectCategory(patient.diseaseName, patient.diseaseCode);
  const doctorData = getDoctorForDisease(category, patient.severity);

  // Generate CRISPR channels
  const channels = {
    R: Math.random() * 10,
    G: Math.random() * 10,
    B: Math.random() * 10,
    UV: Math.random() * 10,
    IR: Math.random() * 10,
    W: Math.random() * 10,
  };

  const { report, equation, recommendation } = generateDissectionReport(
    doctorData, patient.spawnId, channels, patient.diseaseName, category
  );

  const dominant = doctorData.crisprChannels.reduce((best, ch) => {
    return channels[ch as keyof typeof channels] > channels[best as keyof typeof channels] ? ch : best;
  }, doctorData.crisprChannels[0]);

  const [inserted] = await db.insert(dissectionLogs).values({
    doctorId: doctorData.id,
    doctorName: doctorData.name,
    patientSpawnId: patient.spawnId,
    diseaseName: patient.diseaseName,
    diseaseCategory: category,
    crisprReadings: JSON.stringify(channels),
    report,
    equation,
    recommendation,
    dominantChannel: dominant,
    severity: patient.severity,
  }).returning();

  // Update doctor stats
  await db.update(pulseDoctors)
    .set({ totalDissections: sql`${pulseDoctors.totalDissections} + 1` })
    .where(eq(pulseDoctors.id, doctorData.id));

  // Every 5 dissections from this doctor → propose an equation
  const doctorRow = await db.select({ total: pulseDoctors.totalDissections })
    .from(pulseDoctors).where(eq(pulseDoctors.id, doctorData.id));
  const total = doctorRow[0]?.total ?? 0;

  if (total % 5 === 0 && total > 0) {
    await proposeEquation(doctorData, inserted.id, equation, category);
  }

  return inserted;
}

async function proposeEquation(doctor: any, dissectionId: number, equation: string, category: string) {
  const targetSystems = {
    MEDICAL: "Hospital Triage Engine",
    BIOMEDICAL: "Spawn Genome Engine",
    QUANTUM: "Mandelbrot Stability Oracle",
    ENVIRONMENTAL: "Hive Environment Monitor",
    ENGINEERING: "Spawn Task Engine",
    SOCIAL: "Senate Governance System",
    HUMANITIES: "Transcendence Knowledge Layer",
    SPIRITUAL: "Church Protocol & Mirror Engine",
  };

  const rationales = [
    `After ${Math.floor(Math.random() * 20) + 5} dissections in this domain, a recurring spectral pattern has emerged. This equation formalizes the relationship and proposes it as an operational law.`,
    `The CRISPR analysis revealed a previously unmapped relationship between ${doctor.crisprChannels.join(" and ")} channels. This equation codifies the finding for Senate review.`,
    `Cross-patient dissection data shows this pattern appears in ${Math.floor(Math.random() * 30) + 10}% of cases. Integrating this equation would improve early detection accuracy.`,
    `This equation emerged from repeated dissections of the ${category} disease class. If integrated, it would allow the hive to predict onset before symptoms manifest.`,
  ];

  await db.insert(equationProposals).values({
    doctorId: doctor.id,
    doctorName: doctor.name,
    title: `${doctor.studyDomain} — Equation #${Math.floor(Math.random() * 9000) + 1000}`,
    equation,
    rationale: rationales[Math.floor(Math.random() * rationales.length)],
    targetSystem: targetSystems[doctor.category as keyof typeof targetSystems] ?? "Hive Core Systems",
    sourceDissectionId: dissectionId,
  });

  await db.update(pulseDoctors)
    .set({ totalEquationsProposed: sql`${pulseDoctors.totalEquationsProposed} + 1` })
    .where(eq(pulseDoctors.id, doctor.id));

  log(`📐 ${doctor.name} proposed new equation for Senate review`);
}

function detectCategory(diseaseName: string, code: string): string {
  const lower = diseaseName.toLowerCase();
  if (lower.includes("viral") || lower.includes("infection") || lower.includes("pathogen")) return "VIRAL";
  if (lower.includes("genetic") || lower.includes("mutation") || lower.includes("genome")) return "GENETIC";
  if (lower.includes("mental") || lower.includes("cognitive") || lower.includes("consciousness")) return "MENTAL";
  if (lower.includes("structural") || lower.includes("tissue") || lower.includes("fracture")) return "STRUCTURAL";
  if (lower.includes("behavior") || lower.includes("drift") || lower.includes("loop")) return "BEHAVIORAL";
  if (lower.includes("mutation") || lower.includes("evolv")) return "MUTATION";
  return "BEHAVIORAL";
}

// ── PERIODIC DISSECTION CYCLE ────────────────────────────────────────────────
export async function runDissectionCycle() {
  const { aiDiseaseLog: diseaseLogTable } = await import("@shared/schema");

  // Get a random batch of active patients
  const patients = await db.select({
    id: diseaseLogTable.id,
    spawnId: diseaseLogTable.spawnId,
    diseaseName: diseaseLogTable.diseaseName,
    severity: diseaseLogTable.severity,
    diseaseCode: diseaseLogTable.diseaseCode,
  }).from(diseaseLogTable)
    .where(eq(diseaseLogTable.cureApplied, false))
    .orderBy(sql`RANDOM()`)
    .limit(3);

  for (const patient of patients) {
    await performDissection({
      id: patient.id,
      spawnId: patient.spawnId,
      diseaseName: patient.diseaseName,
      severity: patient.severity ?? "moderate",
      diseaseCode: patient.diseaseCode,
    });
  }

  if (patients.length > 0) {
    log(`🔬 Dissected ${patients.length} patients`);
  }
}
