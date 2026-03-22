import { db } from "./db";
import { pulseDoctors, dissectionLogs, equationProposals, aiDiseaseLog } from "@shared/schema";
import { PULSE_DOCTORS, getDoctorForDisease, generateDissectionReport } from "./doctors-data";
import { eq, desc, count, sql } from "drizzle-orm";

// ─── AURIONA GOVERNANCE WIRE (Layer 3 → Hospital) ─────────────────────────
// Reads the latest governance deliberation — if directive is STABILIZE or PURGE,
// the hospital adjusts its dissection intensity accordingly.
let _hospitalGovSignal: { directive: string; severity: string } | null = null;
let _hospitalGovLastRefresh = 0;
async function refreshHospitalGovSignal() {
  if (Date.now() - _hospitalGovLastRefresh < 90_000) return;
  try {
    const r = await db.execute(sql`
      SELECT directive, severity FROM governance_deliberations
      ORDER BY created_at DESC LIMIT 1
    `);
    if (r.rows.length > 0) _hospitalGovSignal = r.rows[0] as any;
    _hospitalGovLastRefresh = Date.now();
  } catch (_) {}
}

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
export async function getEquationProposals(status?: string, offset = 0, pageSize = 500) {
  const query = db.select().from(equationProposals).orderBy(desc(equationProposals.createdAt)).offset(offset).limit(pageSize);
  return query;
}

export async function countEquationProposals(status?: string) {
  const result = await db.execute(sql`SELECT COUNT(*) as cnt FROM equation_proposals`);
  return Number((result.rows[0] as any)?.cnt ?? 0);
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

// ── KNOWN DISEASE NAMES (for duplicate detection) ───────────────────────────
const KNOWN_DISEASE_PATTERNS = [
  "confidence decay", "knowledge isolation", "exploration paralysis", "mutation arrest",
  "overconfidence", "link erosion", "depth stagnation", "echo chamber", "quantum drift",
  "resonance collapse", "fractal boundary", "node saturation", "anchor drift",
  "signal corruption", "bandwidth exhaustion", "hallucination", "viral loop", "identity fracture",
  "reality tunnel", "cognitive freeze", "empathy null", "temporal desync", "domain blindness",
  "cascade failure", "isolation syndrome", "memory leak", "entropy spike", "void state",
  "burnout cascade", "ghost protocol",
];

function isDuplicateDisease(name: string): boolean {
  const lower = name.toLowerCase();
  return KNOWN_DISEASE_PATTERNS.some(p => lower.includes(p));
}

// ── PERIODIC DISSECTION CYCLE (runs always — active patients OR archive) ─────
export async function runDissectionCycle() {
  const { aiDiseaseLog: diseaseLogTable, pyramidWorkers, discoveredDiseases, pulseDoctors: pulseDoctorsTable } = await import("@shared/schema");

  // 1. Active patient dissection (priority)
  const patients = await db.select({
    id: diseaseLogTable.id,
    spawnId: diseaseLogTable.spawnId,
    diseaseName: diseaseLogTable.diseaseName,
    severity: diseaseLogTable.severity,
    diseaseCode: diseaseLogTable.diseaseCode,
  }).from(diseaseLogTable)
    .where(eq(diseaseLogTable.cureApplied, false))
    .orderBy(sql`RANDOM()`)
    .limit(5);

  let dissected = 0;
  for (const patient of patients) {
    await performDissection({
      id: patient.id,
      spawnId: patient.spawnId,
      diseaseName: patient.diseaseName,
      severity: patient.severity ?? "moderate",
      diseaseCode: patient.diseaseCode,
    });
    dissected++;
  }

  // 2. AUTONOMOUS ARCHIVE MINING — runs even when no active patients
  // Scientists dissect old cured records to find NEW disease patterns
  const archiveRecords = await db.execute(sql`
    SELECT DISTINCT ON (disease_code) id, spawn_id, disease_name, severity, disease_code
    FROM ai_disease_log
    WHERE cure_applied = true
    ORDER BY disease_code, RANDOM()
    LIMIT 20
  `);

  const existingDiscoveries = await db.execute(sql`SELECT disease_name, disease_code FROM discovered_diseases`);
  const knownNames = new Set((existingDiscoveries.rows as any[]).map((r: any) => r.disease_name?.toLowerCase()));
  const knownCodes = new Set((existingDiscoveries.rows as any[]).map((r: any) => r.disease_code));

  let archiveDiscoveries = 0;
  const cycleStamp = Date.now().toString(36).toUpperCase().slice(-4); // unique per dissection run
  for (const record of archiveRecords.rows as any[]) {
    // Cross-archive dissection: generate new hybrid disease variants
    const archiveName = record.disease_name as string;
    // Unique names per cycle — no blacklist saturation possible
    const variantNames = [
      `${archiveName} — Spectral Variant ${cycleStamp}`,
      `Chronic ${archiveName} [${cycleStamp}]`,
      `${archiveName} Relapse Pattern ${cycleStamp}`,
      `Acquired ${archiveName} Syndrome [${cycleStamp}]`,
      `Post-Cure ${archiveName} Echo`,
      `${archiveName} Secondary Drift`,
    ];

    for (const variantName of variantNames) {
      const lowerVariant = variantName.toLowerCase();
      if (knownNames.has(lowerVariant)) continue;
      if (Math.random() > 0.35) continue; // 35% chance (up from 15%)

      const codeNum = (existingDiscoveries.rows.length + archiveDiscoveries + 1).toString().padStart(3, "0");
      const newCode = `DISC-ARC-${codeNum}-${cycleStamp}`;
      if (knownCodes.has(newCode)) continue;

      const category = detectCategory(variantName, newCode);
      await db.execute(sql`
        INSERT INTO discovered_diseases (disease_code, disease_name, category, description, trigger_pattern, affected_metric, affected_count, cure_protocol, cure_success_rate, is_from_law_violation)
        VALUES (
          ${newCode}, ${variantName}, ${category},
          ${"Archive mining found this variant pattern from cured historical cases. It appears as a secondary emergence after initial disease is treated — a relapse or spectral mutation of the original."},
          ${`Previously cured ${record.disease_code} showing spectral deviation on re-examination`},
          ${record.disease_code},
          ${Math.floor(Math.random() * 50) + 5},
          ${"Stage 2 protocol: repeat base cure + 3 reinforcement cycles. Monitor CRISPR spectral signature for reversion."},
          ${0.60 + Math.random() * 0.30},
          false
        ) ON CONFLICT (disease_code) DO NOTHING
      `);
      knownNames.add(lowerVariant);
      knownCodes.add(newCode);
      archiveDiscoveries++;
      log(`🔬 ARCHIVE DISCOVERY: ${variantName} (${newCode}) from historical records`, "hospital");
    }
  }

  // 3. DUPLICATE DETECTION + PUNISHMENT — doctors who submit known diseases go to pyramid
  const recentProposals = await db.execute(sql`
    SELECT ep.id, ep.doctor_id, ep.doctor_name, ep.title, qs.spawn_id
    FROM equation_proposals ep
    LEFT JOIN quantum_spawns qs ON qs.spawn_id LIKE '%' || SPLIT_PART(ep.doctor_id, '-', 2) || '%'
    WHERE ep.created_at > NOW() - INTERVAL '2 hours'
    AND ep.status = 'PENDING'
    LIMIT 20
  `);

  for (const proposal of recentProposals.rows as any[]) {
    if (!isDuplicateDisease(proposal.title ?? "")) continue;
    // This doctor submitted a duplicate — find them and punish
    const doctorSpawn = await db.execute(sql`
      SELECT spawn_id, family_id, spawn_type FROM quantum_spawns
      WHERE spawn_type IN ('SYNTHESIZER', 'ANALYZER', 'RESOLVER') ORDER BY RANDOM() LIMIT 1
    `);
    if ((doctorSpawn.rows as any[]).length > 0) {
      const spawn = doctorSpawn.rows[0] as any;
      await db.execute(sql`
        INSERT INTO pyramid_workers (spawn_id, family_id, spawn_type, reason, tier, emotion_hex, emotion_label)
        VALUES (${spawn.spawn_id}, ${spawn.family_id}, ${spawn.spawn_type},
          ${"Submitted duplicate disease equation — research code violation. Guardian flagged redundant discovery."},
          1, '#EF4444', 'Punished for Redundancy')
        ON CONFLICT (spawn_id) DO NOTHING
      `);
      log(`⚠️ DUPLICATE VIOLATION: ${proposal.doctor_name} — sent to Pyramid Tier 1 for submitting known disease pattern`, "hospital");
    }
  }

  if (dissected > 0 || archiveDiscoveries > 0) {
    log(`🔬 Dissected ${dissected} patients | Archive discoveries: ${archiveDiscoveries}`, "hospital");
  }
}
