/**
 * Verifies the canonical equation_proposals schema accepts the columns we patched
 * church-research-engine.ts and career-job-feed.ts to use, then queries totals.
 * Uses the app's pool — bypasses external psql connection cap.
 */
import { pool } from "../server/db";

(async () => {
  console.log("═══ EQUATION SCHEMA VERIFICATION ═══\n");

  // 1) Show the actual columns
  const cols = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name='equation_proposals'
    ORDER BY ordinal_position
  `);
  console.log("Columns:");
  for (const r of cols.rows) console.log(`  ${r.column_name.padEnd(28)} ${r.data_type.padEnd(18)} ${r.is_nullable}`);

  // 2) Current count
  const count = await pool.query(`SELECT COUNT(*)::int AS n FROM equation_proposals`);
  console.log(`\nCurrent rows: ${count.rows[0].n}`);

  // 3) Try a single insert matching the canonical columns we patched into the engines
  console.log("\nTesting INSERT with canonical columns (church-style)...");
  try {
    const r1 = await pool.query(`
      INSERT INTO equation_proposals
        (doctor_id, doctor_name, title, equation, rationale, target_system, status, votes_for, votes_against, abstain)
      VALUES ($1,$2,$3,$4,$5,$6,'pending',0,0,0)
      RETURNING id
    `, ["test-sci-001","Dr. Test (church-style)","Verification proposal A","E_test = m·c²","Schema verification","HOSPITAL"]);
    console.log(`  ✓ church-style insert OK: id=${r1.rows[0].id}`);
  } catch (e: any) {
    console.log(`  ✗ church-style insert FAILED: ${e.message}`);
  }

  console.log("Testing INSERT with canonical columns (career-style)...");
  try {
    const r2 = await pool.query(`
      INSERT INTO equation_proposals
        (doctor_id, doctor_name, title, equation, rationale, target_system, status, votes_for, votes_against, abstain)
      VALUES ($1,$2,$3,$4,$5,$6,'pending',0,0,0)
      RETURNING id
    `, ["careerforge","Dr. CareerForge","Career fusion proposal B","ROI = Σ(skill·demand)/cost","Career-job-feed verification","CAREER_INDEX"]);
    console.log(`  ✓ career-style insert OK: id=${r2.rows[0].id}`);
  } catch (e: any) {
    console.log(`  ✗ career-style insert FAILED: ${e.message}`);
  }

  // 4) Final count + breakdown
  const final = await pool.query(`SELECT COUNT(*)::int AS n FROM equation_proposals`);
  console.log(`\nFinal rows: ${final.rows[0].n}`);
  const recent = await pool.query(`
    SELECT id, doctor_name, target_system, status, created_at
    FROM equation_proposals
    ORDER BY created_at DESC NULLS LAST, id DESC LIMIT 8
  `);
  console.log("\nMost recent:");
  for (const r of recent.rows) console.log(`  #${r.id} | ${r.doctor_name?.slice(0,30).padEnd(30)} | ${r.target_system} | ${r.status}`);

  // 5) Source breakdown so we can see which engines actually fed in
  const bySource = await pool.query(`
    SELECT target_system, COUNT(*)::int AS n
    FROM equation_proposals
    GROUP BY target_system ORDER BY n DESC
  `);
  console.log("\nBy target_system:");
  for (const r of bySource.rows) console.log(`  ${r.target_system}: ${r.n}`);

  await pool.end();
})();
