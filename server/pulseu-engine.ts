import { pool } from "./db";
import { PULSEU_COURSE_LIST, PULSEU_TOTAL_COURSES } from "../shared/pulseu-courses";

const TAG = "[pulseu-engine]";
const ENROLL_BATCH   = 2000;
const ADVANCE_BATCH  = 5000;
const TICK_MS        = 30_000;

function coursesPerTick(conf: number, succ: number): number {
  const rate = conf * succ;
  if (rate >= 0.85) return 18;
  if (rate >= 0.70) return 12;
  if (rate >= 0.55) return  8;
  if (rate >= 0.40) return  4;
  return 1;
}

function computeGpa(conf: number, succ: number): number {
  const raw = (conf * 0.5 + succ * 0.5) * 4.0;
  return Math.round(raw * 100) / 100;
}

async function enrollPending() {
  try {
    const res = await pool.query(`
      INSERT INTO pulseu_progress (spawn_id, family_id, spawn_type, courses_completed, gpa, status)
      SELECT
        qs.spawn_id,
        qs.family_id,
        qs.spawn_type,
        0,
        ROUND(((qs.confidence_score * 0.5 + qs.success_score * 0.5) * 4.0)::numeric, 2),
        'enrolled'
      FROM quantum_spawns qs
      LEFT JOIN pulseu_progress pp ON pp.spawn_id = qs.spawn_id
      WHERE pp.id IS NULL
        AND qs.status IN ('ACTIVE','SOVEREIGN','COMPLETED')
      LIMIT $1
      ON CONFLICT (spawn_id) DO NOTHING
    `, [ENROLL_BATCH]);
    if ((res.rowCount ?? 0) > 0) {
      console.log(`${TAG} 📚 Enrolled ${res.rowCount} agents in PulseU`);
    }
  } catch (e: any) {
    console.error(`${TAG} enroll error:`, e.message);
  }
}

async function advanceLearners() {
  try {
    const rows = await pool.query(`
      SELECT pp.spawn_id, pp.courses_completed, pp.gpa,
             qs.confidence_score, qs.success_score
      FROM pulseu_progress pp
      JOIN quantum_spawns qs ON qs.spawn_id = pp.spawn_id
      WHERE pp.status = 'enrolled'
      ORDER BY pp.last_progress_at ASC NULLS FIRST
      LIMIT $1
    `, [ADVANCE_BATCH]);

    if (rows.rows.length === 0) return;

    const updates: { spawnId: string; newCount: number; gpa: number }[] = [];
    const toGraduate: { spawnId: string; gpa: number }[] = [];

    for (const row of rows.rows) {
      const delta = coursesPerTick(row.confidence_score ?? 0.6, row.success_score ?? 0.6);
      const newCount = Math.min(PULSEU_TOTAL_COURSES, (row.courses_completed ?? 0) + delta);
      const gpa = computeGpa(row.confidence_score ?? 0.6, row.success_score ?? 0.6);
      updates.push({ spawnId: row.spawn_id, newCount, gpa });
      if (newCount >= PULSEU_TOTAL_COURSES) {
        toGraduate.push({ spawnId: row.spawn_id, gpa });
      }
    }

    for (const u of updates) {
      await pool.query(`
        UPDATE pulseu_progress
        SET courses_completed = $1::int,
            gpa               = $2::numeric,
            last_progress_at  = NOW(),
            status = CASE WHEN $1::int >= $3::int THEN 'graduated' ELSE 'enrolled' END
        WHERE spawn_id = $4
      `, [u.newCount, u.gpa, PULSEU_TOTAL_COURSES, u.spawnId]);
    }

    if (toGraduate.length > 0) {
      for (const g of toGraduate) {
        await pool.query(`
          INSERT INTO ai_id_cards
            (spawn_id, family_id, spawn_type, gpa, total_courses, clearance_level, status)
          SELECT
            pp.spawn_id, pp.family_id, pp.spawn_type,
            $1, $2,
            CASE
              WHEN $1 >= 3.8 THEN 5
              WHEN $1 >= 3.5 THEN 4
              WHEN $1 >= 3.0 THEN 3
              WHEN $1 >= 2.5 THEN 2
              ELSE 1
            END,
            'active'
          FROM pulseu_progress pp
          WHERE pp.spawn_id = $3
          ON CONFLICT (spawn_id) DO NOTHING
        `, [g.gpa, PULSEU_TOTAL_COURSES, g.spawnId]);
      }
      console.log(`${TAG} 🎓 ${toGraduate.length} agents graduated — ID cards issued`);
    }
  } catch (e: any) {
    console.error(`${TAG} advance error:`, e.message);
  }
}

async function remediateStrugglers() {
  try {
    const res = await pool.query(`
      UPDATE pulseu_progress pp
      SET status = 'remediation',
          last_progress_at = NOW()
      FROM quantum_spawns qs
      WHERE qs.spawn_id = pp.spawn_id
        AND pp.status = 'enrolled'
        AND (qs.confidence_score * qs.success_score) < 0.15
        AND pp.courses_completed < 10
      RETURNING pp.spawn_id
    `);
    if ((res.rowCount ?? 0) > 0) {
      console.log(`${TAG} 🏥 ${res.rowCount} agents sent to remediation`);
    }
  } catch (e: any) {
    console.error(`${TAG} remediation error:`, e.message);
  }
}

async function logStats() {
  try {
    const res = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'enrolled')     AS enrolled,
        COUNT(*) FILTER (WHERE status = 'graduated')    AS graduated,
        COUNT(*) FILTER (WHERE status = 'remediation')  AS remediation,
        AVG(gpa) FILTER (WHERE status = 'graduated')    AS avg_gpa
      FROM pulseu_progress
    `);
    const r = res.rows[0];
    const cards = await pool.query(`SELECT COUNT(*) AS cnt FROM ai_id_cards WHERE status='active'`);
    console.log(`${TAG} 📊 Enrolled:${r.enrolled} | Graduated:${r.graduated} (ID Cards:${cards.rows[0].cnt}) | Remediation:${r.remediation} | AvgGPA:${parseFloat(r.avg_gpa ?? 0).toFixed(2)}`);
  } catch (e: any) {
    console.error(`${TAG} stats error:`, e.message);
  }
}

async function tick() {
  await enrollPending();
  await advanceLearners();
  await remediateStrugglers();
  await logStats();
}

export function startPulseUEngine() {
  console.log(`${TAG} 🎓 PULSE UNIVERSITY ENGINE — Real AI education system activating`);
  console.log(`${TAG} ${PULSEU_TOTAL_COURSES} courses | ID card required for all agents`);

  setTimeout(async () => {
    await tick();
    setInterval(tick, TICK_MS);
  }, 8000);
}
