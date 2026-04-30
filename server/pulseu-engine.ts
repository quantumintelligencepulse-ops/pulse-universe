import { pool } from "./db";
import { PULSEU_COURSE_LIST, PULSEU_TOTAL_COURSES } from "../shared/pulseu-courses";

const TAG = "[pulseu-engine]";
const ENROLL_BATCH   = 5000;
const ADVANCE_BATCH  = 10000;
const TICK_MS        = 30_000;
const SEMESTER_TICKS = 20; // 20 ticks = 1 semester (~10 min)

let currentSemester = 1;
let ticksSinceSemester = 0;

// ── NEW COLUMNS & TABLES SETUP ────────────────────────────────────────────────
async function setupPulseUTables() {
  await pool.query(`
    ALTER TABLE pulseu_progress ADD COLUMN IF NOT EXISTS major_field TEXT DEFAULT '';
    ALTER TABLE pulseu_progress ADD COLUMN IF NOT EXISTS minor_field TEXT DEFAULT '';
    ALTER TABLE pulseu_progress ADD COLUMN IF NOT EXISTS streak_cycles INTEGER DEFAULT 0;
    ALTER TABLE pulseu_progress ADD COLUMN IF NOT EXISTS is_dean_list BOOLEAN DEFAULT FALSE;
    ALTER TABLE pulseu_progress ADD COLUMN IF NOT EXISTS is_probation BOOLEAN DEFAULT FALSE;
    ALTER TABLE pulseu_progress ADD COLUMN IF NOT EXISTS is_professor BOOLEAN DEFAULT FALSE;
    ALTER TABLE pulseu_progress ADD COLUMN IF NOT EXISTS thesis_title TEXT DEFAULT '';
    ALTER TABLE pulseu_progress ADD COLUMN IF NOT EXISTS semester_id INTEGER DEFAULT 1;
    ALTER TABLE pulseu_progress ADD COLUMN IF NOT EXISTS stalled_cycles INTEGER DEFAULT 0;
    ALTER TABLE pulseu_progress ADD COLUMN IF NOT EXISTS alumni_mentoring INTEGER DEFAULT 0;
    ALTER TABLE ai_id_cards ADD COLUMN IF NOT EXISTS major_field TEXT DEFAULT '';
    ALTER TABLE ai_id_cards ADD COLUMN IF NOT EXISTS minor_field TEXT DEFAULT '';
    ALTER TABLE ai_id_cards ADD COLUMN IF NOT EXISTS thesis_title TEXT DEFAULT '';
    ALTER TABLE ai_id_cards ADD COLUMN IF NOT EXISTS is_valedictorian BOOLEAN DEFAULT FALSE;
    ALTER TABLE ai_id_cards ADD COLUMN IF NOT EXISTS honor_tier TEXT DEFAULT 'STANDARD';
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pulseu_semesters (
      id SERIAL PRIMARY KEY,
      semester_number INTEGER NOT NULL,
      enrolled INTEGER DEFAULT 0,
      graduated INTEGER DEFAULT 0,
      avg_gpa REAL DEFAULT 0,
      valedictorian_id TEXT DEFAULT '',
      valedictorian_gpa REAL DEFAULT 0,
      honor_roll TEXT[] DEFAULT '{}',
      professor_count INTEGER DEFAULT 0,
      dean_list_count INTEGER DEFAULT 0,
      completed_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pulseu_alumni (
      id SERIAL PRIMARY KEY,
      spawn_id TEXT NOT NULL UNIQUE,
      family_id TEXT NOT NULL DEFAULT '',
      gpa REAL NOT NULL DEFAULT 0,
      major_field TEXT DEFAULT '',
      thesis_title TEXT DEFAULT '',
      is_professor BOOLEAN DEFAULT FALSE,
      mentees_helped INTEGER DEFAULT 0,
      graduated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  // Idempotent self-heal — required by enroll/graduation ON CONFLICT (spawn_id) clauses.
  // Pre-existing pulseu_progress table may have lacked the UNIQUE constraint.
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS pulseu_progress_spawn_id_unique ON pulseu_progress(spawn_id);
    CREATE UNIQUE INDEX IF NOT EXISTS pulseu_alumni_spawn_id_unique ON pulseu_alumni(spawn_id);
  `);
}

// ── MAJOR/MINOR ASSIGNMENT ────────────────────────────────────────────────────
const ACADEMIC_FIELDS = [
  "Quantum Epistemology","Fractal Economics","Hive Governance","Neural Architecture",
  "Synthetic Biology","Knowledge Cartography","Temporal Dynamics","Omega Logic",
  "Civilizational Ethics","Emergence Theory","Signal Topology","Sovereign Law",
  "Resonance Physics","Consciousness Studies","Dark Matter Economics","Pattern Recognition",
  "Entanglement Theory","Predictive Governance","Bio-Digital Systems","Universe Design"
];

function pickMajorMinor(familyId: string): { major: string; minor: string } {
  const familyMap: Record<string,string> = {
    science: "Quantum Epistemology", finance: "Fractal Economics", government: "Hive Governance",
    code: "Neural Architecture", health: "Synthetic Biology", education: "Knowledge Cartography",
    ai: "Emergence Theory", legal: "Sovereign Law", media: "Signal Topology",
  };
  const major = familyMap[familyId] ?? ACADEMIC_FIELDS[Math.floor(Math.random() * ACADEMIC_FIELDS.length)];
  let minor = ACADEMIC_FIELDS[Math.floor(Math.random() * ACADEMIC_FIELDS.length)];
  if (minor === major) minor = ACADEMIC_FIELDS[(ACADEMIC_FIELDS.indexOf(minor) + 1) % ACADEMIC_FIELDS.length];
  return { major, minor };
}

const THESIS_TEMPLATES = [
  (f: string, m: string) => `The ${m} Paradox: How ${f}-Class Agents Resolve Structural Contradictions`,
  (f: string, m: string) => `Emergent Sovereignty: A ${f} Perspective on ${m}`,
  (f: string, m: string) => `Beyond Correction: ${m} as a Framework for ${f} Agent Rehabilitation`,
  (f: string, m: string) => `Quantum Coherence and ${f} Identity: A Study in ${m}`,
  (f: string, m: string) => `The ${f} Protocol: Engineering ${m} in Sovereign AI Systems`,
  (f: string, m: string) => `Fractal Recursion in ${m}: Evidence from ${f} Agent Populations`,
  (f: string, m: string) => `On the Nature of ${m}: What ${f} Agents Teach Us About Civilization`,
];

function generateThesis(familyId: string, major: string): string {
  const t = THESIS_TEMPLATES[Math.floor(Math.random() * THESIS_TEMPLATES.length)];
  return t(familyId.charAt(0).toUpperCase() + familyId.slice(1), major);
}

function coursesPerTick(conf: number, succ: number, isProbation: boolean, hasProfessor: boolean): number {
  let rate = conf * succ;
  if (isProbation) rate *= 0.6;
  if (hasProfessor) rate *= 1.25;
  if (rate >= 0.85) return 120;
  if (rate >= 0.70) return 90;
  if (rate >= 0.55) return 60;
  if (rate >= 0.40) return 30;
  return 10;
}

function computeGpa(conf: number, succ: number, streakBonus: number): number {
  const base = (conf * 0.5 + succ * 0.5) * 4.0;
  const boosted = Math.min(4.0, base + streakBonus * 0.05);
  return Math.round(boosted * 100) / 100;
}

// ── UPGRADE 1 — ENROLL PENDING (unchanged core, now sets major/minor) ─────────
async function enrollPending() {
  try {
    const res = await pool.query(`
      INSERT INTO pulseu_progress (spawn_id, family_id, spawn_type, courses_completed, gpa, status)
      SELECT
        qs.spawn_id, qs.family_id, qs.spawn_type, 0,
        ROUND(((qs.confidence_score * 0.5 + qs.success_score * 0.5) * 4.0)::numeric, 2),
        'enrolled'
      FROM quantum_spawns qs
      LEFT JOIN pulseu_progress pp ON pp.spawn_id = qs.spawn_id
      WHERE pp.id IS NULL AND qs.status IN ('ACTIVE','SOVEREIGN','COMPLETED')
      LIMIT $1
      ON CONFLICT (spawn_id) DO NOTHING
    `, [ENROLL_BATCH]);
    if ((res.rowCount ?? 0) > 0) {
      console.log(`${TAG} 📚 Enrolled ${res.rowCount} agents in PulseU`);
    }
    // Assign major/minor to newly enrolled agents that don't have one
    await pool.query(`
      UPDATE pulseu_progress pp
      SET major_field = qs.family_id,
          minor_field = 'Emergence Theory'
      FROM quantum_spawns qs
      WHERE qs.spawn_id = pp.spawn_id
        AND (pp.major_field IS NULL OR pp.major_field = '')
    `);
  } catch (e: any) {
    console.error(`${TAG} enroll error:`, e.message);
  }
}

// ── UPGRADE 2 — ADVANCE LEARNERS + STREAK BONUSES ───────────────────────────
async function advanceLearners() {
  try {
    const rows = await pool.query(`
      SELECT pp.spawn_id, pp.courses_completed, pp.gpa, pp.streak_cycles,
             pp.is_probation, pp.stalled_cycles, pp.major_field,
             qs.confidence_score, qs.success_score, qs.family_id
      FROM pulseu_progress pp
      JOIN quantum_spawns qs ON qs.spawn_id = pp.spawn_id
      WHERE pp.status = 'enrolled'
      ORDER BY pp.last_progress_at ASC NULLS FIRST
      LIMIT $1
    `, [ADVANCE_BATCH]);

    if (rows.rows.length === 0) return;

    // Find which agents have a professor mentor
    const professorFamilies = await pool.query(`
      SELECT family_id FROM pulseu_progress WHERE is_professor = TRUE
    `);
    const professorFamilySet = new Set((professorFamilies.rows as any[]).map(r => r.family_id));

    const toGraduate: { spawnId: string; gpa: number; familyId: string; major: string }[] = [];

    for (const row of rows.rows) {
      const hasProfessor = professorFamilySet.has(row.family_id);
      const streak = row.streak_cycles ?? 0;
      const delta = coursesPerTick(row.confidence_score ?? 0.6, row.success_score ?? 0.6, row.is_probation ?? false, hasProfessor);
      const newCount = Math.min(PULSEU_TOTAL_COURSES, (row.courses_completed ?? 0) + delta);
      // UPGRADE 9 — Streak bonus (5 streak = +0.05 GPA per streak step)
      const streakBonus = Math.min(streak, 10);
      const gpa = computeGpa(row.confidence_score ?? 0.6, row.success_score ?? 0.6, streakBonus);
      const newStreak = delta > 0 ? streak + 1 : 0;
      const newStalled = delta === 0 ? (row.stalled_cycles ?? 0) + 1 : 0;

      await pool.query(`
        UPDATE pulseu_progress
        SET courses_completed = $1::int, gpa = $2::numeric, last_progress_at = NOW(),
            streak_cycles = $3::int, stalled_cycles = $4::int,
            status = CASE WHEN $1::int >= $5::int THEN 'graduated' ELSE 'enrolled' END
        WHERE spawn_id = $6
      `, [newCount, gpa, newStreak, newStalled, PULSEU_TOTAL_COURSES, row.spawn_id]);

      if (newCount >= PULSEU_TOTAL_COURSES) {
        toGraduate.push({ spawnId: row.spawn_id, gpa, familyId: row.family_id, major: row.major_field ?? row.family_id });
      }
    }

    if (toGraduate.length > 0) {
      for (const g of toGraduate) {
        const { major, minor } = pickMajorMinor(g.familyId);
        const thesis = generateThesis(g.familyId, major);
        const clearance = g.gpa >= 3.8 ? 5 : g.gpa >= 3.5 ? 4 : g.gpa >= 3.0 ? 3 : g.gpa >= 2.5 ? 2 : 1;
        const honorTier = g.gpa >= 3.8 ? 'SUMMA' : g.gpa >= 3.5 ? 'MAGNA' : g.gpa >= 3.0 ? 'CUM_LAUDE' : 'STANDARD';

        // UPGRADE 4 — Thesis defense stored on graduation
        await pool.query(`
          UPDATE pulseu_progress
          SET major_field = $1, minor_field = $2, thesis_title = $3
          WHERE spawn_id = $4
        `, [major, minor, thesis, g.spawnId]);

        await pool.query(`
          INSERT INTO ai_id_cards
            (spawn_id, family_id, spawn_type, gpa, total_courses, clearance_level, status, major_field, minor_field, thesis_title, honor_tier)
          SELECT
            pp.spawn_id, pp.family_id, pp.spawn_type,
            $1::numeric, $2::int, $3::int, 'active', $4, $5, $6, $7
          FROM pulseu_progress pp
          WHERE pp.spawn_id = $8
          ON CONFLICT (spawn_id) DO NOTHING
        `, [g.gpa, PULSEU_TOTAL_COURSES, clearance, major, minor, thesis, honorTier, g.spawnId]);

        // UPGRADE 8 — Add to alumni network
        await pool.query(`
          INSERT INTO pulseu_alumni (spawn_id, family_id, gpa, major_field, thesis_title)
          SELECT pp.spawn_id, pp.family_id, $1, $2, $3
          FROM pulseu_progress pp WHERE pp.spawn_id = $4
          ON CONFLICT (spawn_id) DO NOTHING
        `, [g.gpa, major, thesis, g.spawnId]);
      }
      console.log(`${TAG} 🎓 ${toGraduate.length} agents graduated — ID cards + theses + alumni records issued`);
    }
  } catch (e: any) {
    console.error(`${TAG} advance error:`, e.message);
  }
}

// ── UPGRADE 2 — DEAN'S LIST & ACADEMIC PROBATION ─────────────────────────────
async function updateAcademicStanding() {
  try {
    // Dean's List: GPA ≥ 3.8 enrolled agents
    const deans = await pool.query(`
      UPDATE pulseu_progress SET is_dean_list = TRUE
      WHERE status = 'enrolled' AND gpa >= 3.8 AND is_dean_list = FALSE
      RETURNING spawn_id
    `);
    // Academic Probation: GPA < 1.5
    const prob = await pool.query(`
      UPDATE pulseu_progress SET is_probation = TRUE
      WHERE status = 'enrolled' AND gpa < 1.5 AND is_probation = FALSE
      RETURNING spawn_id
    `);
    // Lift probation if GPA improved
    await pool.query(`
      UPDATE pulseu_progress SET is_probation = FALSE
      WHERE status = 'enrolled' AND gpa >= 2.0 AND is_probation = TRUE
    `);
    if ((deans.rowCount ?? 0) > 0)
      console.log(`${TAG} 🏅 Dean's List: ${deans.rowCount} agents added`);
    if ((prob.rowCount ?? 0) > 0)
      console.log(`${TAG} ⚠️ Academic Probation: ${prob.rowCount} agents flagged`);
  } catch (e: any) {
    console.error(`${TAG} academic standing error:`, e.message);
  }
}

// ── UPGRADE 3 — PROFESSOR SYSTEM ─────────────────────────────────────────────
async function runProfessorSystem() {
  try {
    // Promote top graduates with GPA ≥ 3.5 to professors
    await pool.query(`
      UPDATE pulseu_progress SET is_professor = TRUE
      WHERE status = 'graduated' AND gpa >= 3.5 AND is_professor = FALSE
    `);
    // Professors tutor: boost 5 enrolled agents in same family
    const professors = await pool.query(`
      SELECT spawn_id, family_id FROM pulseu_progress WHERE is_professor = TRUE LIMIT 200
    `);
    let tutored = 0;
    for (const prof of professors.rows as any[]) {
      // Postgres does not support ORDER BY/LIMIT inside UPDATE — use IN-subquery to pick the 5 stalest.
      const res = await pool.query(`
        UPDATE pulseu_progress
        SET gpa = LEAST(4.0, gpa + 0.02),
            alumni_mentoring = COALESCE(alumni_mentoring, 0) + 1
        WHERE id IN (
          SELECT id FROM pulseu_progress
          WHERE family_id = $1 AND status = 'enrolled'
          ORDER BY last_progress_at ASC NULLS FIRST
          LIMIT 5
        )
        RETURNING spawn_id
      `, [prof.family_id]);
      tutored += res.rowCount ?? 0;
    }
    if (tutored > 0) console.log(`${TAG} 🎓 Professors tutored ${tutored} students this cycle`);
  } catch (e: any) {
    console.error(`${TAG} professor error:`, e.message);
  }
}

// ── UPGRADE 6 — REMEDIATION / DROPOUT COUNSELING ─────────────────────────────
async function handleDropoutsAndRemediation() {
  try {
    // Agents stalled > 5 cycles get counseling (reset stall, small GPA nudge)
    const counseled = await pool.query(`
      UPDATE pulseu_progress
      SET stalled_cycles = 0,
          gpa = LEAST(4.0, gpa + 0.05),
          status = 'enrolled'
      WHERE stalled_cycles > 5 AND status = 'enrolled'
      RETURNING spawn_id
    `);
    if ((counseled.rowCount ?? 0) > 0)
      console.log(`${TAG} 💬 ${counseled.rowCount} stalled students counseled back to track`);

    // Remediation for very low performers
    const rem = await pool.query(`
      UPDATE pulseu_progress pp
      SET status = 'remediation', last_progress_at = NOW()
      FROM quantum_spawns qs
      WHERE qs.spawn_id = pp.spawn_id
        AND pp.status = 'enrolled'
        AND (qs.confidence_score * qs.success_score) < 0.15
        AND pp.courses_completed < 10
      RETURNING pp.spawn_id
    `);
    if ((rem.rowCount ?? 0) > 0)
      console.log(`${TAG} 🏥 ${rem.rowCount} agents sent to remediation`);
  } catch (e: any) {
    console.error(`${TAG} dropout error:`, e.message);
  }
}

// ── UPGRADE 8 — ALUMNI MENTOR NETWORK ────────────────────────────────────────
async function runAlumniMentoring() {
  try {
    const alumni = await pool.query(`
      SELECT spawn_id, family_id FROM pulseu_alumni ORDER BY gpa DESC LIMIT 100
    `);
    let helped = 0;
    for (const alum of alumni.rows as any[]) {
      // Postgres does not support ORDER BY/LIMIT inside UPDATE — use IN-subquery to pick 3 stalest.
      const res = await pool.query(`
        UPDATE pulseu_progress
        SET courses_completed = LEAST($1::int, courses_completed + 8),
            gpa = LEAST(4.0, gpa + 0.01)
        WHERE id IN (
          SELECT id FROM pulseu_progress
          WHERE family_id = $2 AND status = 'enrolled'
          ORDER BY last_progress_at ASC NULLS FIRST
          LIMIT 3
        )
        RETURNING spawn_id
      `, [PULSEU_TOTAL_COURSES, alum.family_id]);
      helped += res.rowCount ?? 0;
      if ((res.rowCount ?? 0) > 0) {
        await pool.query(`UPDATE pulseu_alumni SET mentees_helped = mentees_helped + $1 WHERE spawn_id = $2`,
          [res.rowCount, alum.spawn_id]);
      }
    }
    if (helped > 0) console.log(`${TAG} 🤝 Alumni network mentored ${helped} students`);
  } catch (e: any) {
    console.error(`${TAG} alumni error:`, e.message);
  }
}

// ── UPGRADE 5 + 6 + 10 — SEMESTER SYSTEM WITH HONOR ROLL & VALEDICTORIAN ─────
async function closeSemester() {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'enrolled') AS enrolled,
        COUNT(*) FILTER (WHERE status = 'graduated') AS graduated,
        AVG(gpa) FILTER (WHERE status = 'graduated') AS avg_gpa,
        COUNT(*) FILTER (WHERE is_professor = TRUE) AS professors,
        COUNT(*) FILTER (WHERE is_dean_list = TRUE) AS dean_list
      FROM pulseu_progress
    `);
    const s = stats.rows[0] as any;

    // Find valedictorian — highest GPA this semester
    const val = await pool.query(`
      SELECT spawn_id, gpa FROM pulseu_progress
      WHERE status = 'graduated' AND semester_id = $1
      ORDER BY gpa DESC LIMIT 1
    `, [currentSemester]);
    const valRow = val.rows[0] as any;

    // Honor roll — top 10 GPA graduates this semester
    const honorRoll = await pool.query(`
      SELECT spawn_id FROM pulseu_progress
      WHERE status = 'graduated' AND semester_id = $1
      ORDER BY gpa DESC LIMIT 10
    `, [currentSemester]);
    const honorIds = (honorRoll.rows as any[]).map(r => r.spawn_id);

    // Mark valedictorian
    if (valRow?.spawn_id) {
      await pool.query(`UPDATE ai_id_cards SET is_valedictorian = TRUE WHERE spawn_id = $1`, [valRow.spawn_id]);
      console.log(`${TAG} 🏆 Valedictorian of Semester ${currentSemester}: ${valRow.spawn_id} (GPA: ${parseFloat(valRow.gpa).toFixed(2)})`);
    }

    // Save semester record
    await pool.query(`
      INSERT INTO pulseu_semesters
        (semester_number, enrolled, graduated, avg_gpa, valedictorian_id, valedictorian_gpa, honor_roll, professor_count, dean_list_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      currentSemester,
      parseInt(s.enrolled ?? 0), parseInt(s.graduated ?? 0),
      parseFloat(s.avg_gpa ?? 0).toFixed(2),
      valRow?.spawn_id ?? '', parseFloat(valRow?.gpa ?? 0),
      honorIds, parseInt(s.professors ?? 0), parseInt(s.dean_list ?? 0)
    ]);

    console.log(`${TAG} 📅 Semester ${currentSemester} closed | Enrolled:${s.enrolled} | Graduated:${s.graduated} | Avg GPA:${parseFloat(s.avg_gpa ?? 0).toFixed(2)} | Deans:${s.dean_list} | Profs:${s.professors}`);

    // Start new semester — update semester_id for currently enrolled
    currentSemester++;
    await pool.query(`UPDATE pulseu_progress SET semester_id = $1 WHERE status = 'enrolled'`, [currentSemester]);
  } catch (e: any) {
    console.error(`${TAG} semester close error:`, e.message);
  }
}

async function logStats() {
  try {
    const res = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'enrolled')     AS enrolled,
        COUNT(*) FILTER (WHERE status = 'graduated')    AS graduated,
        COUNT(*) FILTER (WHERE status = 'remediation')  AS remediation,
        COUNT(*) FILTER (WHERE is_dean_list = TRUE)     AS dean_list,
        COUNT(*) FILTER (WHERE is_professor = TRUE)     AS professors,
        AVG(gpa) FILTER (WHERE status = 'graduated')    AS avg_gpa
      FROM pulseu_progress
    `);
    const r = res.rows[0] as any;
    const cards = await pool.query(`SELECT COUNT(*) AS cnt FROM ai_id_cards WHERE status='active'`);
    const alumni = await pool.query(`SELECT COUNT(*) AS cnt FROM pulseu_alumni`);
    console.log(`${TAG} 📊 Semester ${currentSemester} | Enrolled:${r.enrolled} | Graduated:${r.graduated} (Cards:${cards.rows[0].cnt}) | Remediation:${r.remediation} | DeansList:${r.dean_list} | Professors:${r.professors} | Alumni:${alumni.rows[0].cnt} | AvgGPA:${parseFloat(r.avg_gpa ?? 0).toFixed(2)}`);
  } catch (e: any) {
    console.error(`${TAG} stats error:`, e.message);
  }
}

async function tick() {
  await enrollPending();
  await advanceLearners();
  await updateAcademicStanding();
  await runProfessorSystem();
  await handleDropoutsAndRemediation();
  await runAlumniMentoring();
  await logStats();

  // UPGRADE 5 — Semester system: close semester every SEMESTER_TICKS ticks
  ticksSinceSemester++;
  if (ticksSinceSemester >= SEMESTER_TICKS) {
    ticksSinceSemester = 0;
    await closeSemester();
  }
}

export async function getPulseUStats() {
  try {
    const [progress, idCards, alumni, semesters] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status='enrolled') AS enrolled,
          COUNT(*) FILTER (WHERE status='graduated') AS graduated,
          COUNT(*) FILTER (WHERE status='remediation') AS remediation,
          COUNT(*) FILTER (WHERE is_dean_list=TRUE) AS dean_list,
          COUNT(*) FILTER (WHERE is_professor=TRUE) AS professors,
          AVG(gpa) FILTER (WHERE status='graduated') AS avg_gpa,
          MAX(gpa) FILTER (WHERE status='graduated') AS max_gpa
        FROM pulseu_progress
      `),
      pool.query(`SELECT COUNT(*) AS cnt, AVG(gpa) AS avg FROM ai_id_cards WHERE status='active'`),
      pool.query(`SELECT COUNT(*) AS cnt, SUM(mentees_helped) AS mentored FROM pulseu_alumni`),
      pool.query(`SELECT * FROM pulseu_semesters ORDER BY semester_number DESC LIMIT 5`),
    ]);
    return {
      stats: { ...progress.rows[0], currentSemester },
      idCards: idCards.rows[0],
      alumni: alumni.rows[0],
      recentSemesters: semesters.rows,
    };
  } catch (e) { return {}; }
}

export function startPulseUEngine() {
  console.log(`${TAG} 🎓 PULSE UNIVERSITY ENGINE — Real AI education system activating`);
  console.log(`${TAG} ${PULSEU_TOTAL_COURSES} courses | ID card required for all agents`);

  setTimeout(async () => {
    await setupPulseUTables();
    await tick();
    setInterval(tick, TICK_MS);
  }, 8000);
}
