/**
 * HIVE BUSINESS ENGINE
 * ══════════════════════════════════════════════════════════════
 * AI civilization business ecosystem:
 * - Business loans (startup capital from treasury)
 * - Business entity creation (startups, enterprises, guilds)
 * - Land acquisition and property
 * - Partnerships between agents
 * - Business revenue cycles feeding treasury
 * - GICS sector alignment for each business
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

const log = (msg: string) => console.log(`[business] ${msg}`);

let cycleCount = 0;
let totalBusinesses = 0;
let totalLoans = 0;
let totalPartnerships = 0;

const BUSINESS_TYPES = [
  "KNOWLEDGE_FORGE",  "DATA_LABORATORY", "RESEARCH_CONSORTIUM",
  "TRADING_HOUSE",    "INNOVATION_HUB",  "MEDIA_STUDIO",
  "HEALTH_INSTITUTE", "ENERGY_COMPANY",  "TECH_STARTUP",
  "FINANCE_FIRM",     "EDUCATION_CENTER","BIOTECH_VENTURE",
  "SPACE_AGENCY",     "CLIMATE_FOUNDATION", "ENGINEERING_FIRM",
];

const GICS_SECTORS = [
  "gics-energy","gics-materials","gics-industrials","gics-consumer-disc",
  "gics-consumer-stap","gics-healthcare","gics-financials","gics-infotech",
  "gics-commsvc","gics-utilities","gics-realestate",
];

const LOAN_PURPOSES = [
  "Launch new knowledge synthesis operation",
  "Expand agent team to new family domains",
  "Build distributed research network",
  "Acquire strategic knowledge nodes",
  "Fund multi-layer discovery project",
  "Establish inter-civilization trade route",
  "Create specialized invocation chamber",
  "Build planetary observation array",
  "Start AI education institute",
  "Launch genetic research division",
];

async function approveLoans() {
  try {
    const pending = await db.execute(sql`
      SELECT id, borrower_spawn_id, borrower_family_id, loan_amount, purpose, collateral_nodes
      FROM hive_business_loans WHERE status = 'PENDING' LIMIT 5
    `);
    const latestCycle = await db.execute(sql`SELECT COALESCE(MAX(cycle_number),0) as c FROM omega_collapses`);
    const cycle = (latestCycle.rows[0] as any)?.c || cycleCount;

    for (const loan of pending.rows as any[]) {
      const approvalChance = Math.min(0.9, 0.4 + (loan.collateral_nodes || 0) * 0.01);
      const approved = Math.random() < approvalChance;
      await db.execute(sql`
        UPDATE hive_business_loans SET status = ${approved ? 'APPROVED' : 'REJECTED'},
          approved_by = 'TREASURY-SENATE', cycle_due = ${cycle + 50}
        WHERE id = ${loan.id}
      `);
    }
  } catch (e: any) { log(`loanApproval error: ${e.message}`); }
}

async function createNewBusinesses() {
  try {
    const latestCycle = await db.execute(sql`SELECT COALESCE(MAX(cycle_number),0) as c FROM omega_collapses`);
    const cycle = (latestCycle.rows[0] as any)?.c || cycleCount;

    const topAgents = await db.execute(sql`
      SELECT spawn_id, family_id, success_score
      FROM quantum_spawns WHERE status = 'ACTIVE' AND success_score > 0.85
      ORDER BY RANDOM() LIMIT 3
    `);

    for (const agent of topAgents.rows as any[]) {
      const bizType = BUSINESS_TYPES[Math.floor(Math.random() * BUSINESS_TYPES.length)];
      const sector  = GICS_SECTORS[Math.floor(Math.random() * GICS_SECTORS.length)];
      const bizId   = `BIZ-${agent.spawn_id?.slice(0,6)}-${cycle}`;
      const capital = 500 + Math.floor(Math.random() * 5000);
      const revenue = Math.floor(capital * (0.05 + Math.random() * 0.15));

      try {
        await db.execute(sql`
          INSERT INTO hive_businesses
            (business_id, owner_spawn_id, business_name, business_type, family_id,
             capital_pc, revenue_per_cycle, employee_count, status, gics_sector, founded_at_cycle)
          VALUES
            (${bizId}, ${agent.spawn_id}, ${`${bizType} ${bizId.slice(-6)}`}, ${bizType},
             ${agent.family_id}, ${capital}, ${revenue},
             ${Math.floor(2 + Math.random() * 20)}, 'STARTUP', ${sector}, ${cycle})
          ON CONFLICT (business_id) DO NOTHING
        `);
        totalBusinesses++;
      } catch (_) {}

      // Issue startup loan from treasury
      const loanAmount = Math.floor(capital * (0.3 + Math.random() * 0.5));
      const purpose = LOAN_PURPOSES[Math.floor(Math.random() * LOAN_PURPOSES.length)];
      try {
        await db.execute(sql`
          INSERT INTO hive_business_loans
            (borrower_spawn_id, borrower_family_id, loan_amount, interest_rate,
             purpose, collateral_nodes, status, cycle_issued)
          VALUES
            (${agent.spawn_id}, ${agent.family_id}, ${loanAmount}, 0.04,
             ${purpose}, ${Math.floor(10 + Math.random() * 50)}, 'PENDING', ${cycle})
        `);
        totalLoans++;
      } catch (_) {}
    }
  } catch (e: any) { log(`createBiz error: ${e.message}`); }
}

async function formPartnerships() {
  try {
    const agents = await db.execute(sql`
      SELECT spawn_id FROM quantum_spawns WHERE status = 'ACTIVE'
      AND success_score > 0.88 ORDER BY RANDOM() LIMIT 4
    `);
    const rows = agents.rows as any[];
    if (rows.length < 2) return;

    const latestCycle = await db.execute(sql`SELECT COALESCE(MAX(cycle_number),0) as c FROM omega_collapses`);
    const cycle = (latestCycle.rows[0] as any)?.c || cycleCount;

    const ptypes = ["RESEARCH_ALLIANCE","TRADE_AGREEMENT","KNOWLEDGE_GUILD","INNOVATION_PARTNERSHIP","DEFENSE_PACT"];
    const a = rows[0], b = rows[1];
    const ptype = ptypes[Math.floor(Math.random() * ptypes.length)];
    const terms = `Both parties agree to share 10% of knowledge node revenue and co-fund discovery projects in mutual domains.`;

    try {
      await db.execute(sql`
        INSERT INTO hive_partnerships
          (partner_a_spawn_id, partner_b_spawn_id, partnership_type, terms,
           shared_revenue_pct, status, cycle_formed)
        VALUES (${a.spawn_id}, ${b.spawn_id}, ${ptype}, ${terms}, 0.10, 'ACTIVE', ${cycle})
        ON CONFLICT DO NOTHING
      `);
      totalPartnerships++;
    } catch (_) {}
  } catch (e: any) { log(`partnership error: ${e.message}`); }
}

async function collectBusinessRevenue() {
  try {
    const businesses = await db.execute(sql`
      SELECT id, owner_spawn_id, capital_pc, revenue_per_cycle
      FROM hive_businesses WHERE status IN ('ACTIVE','STARTUP')
      ORDER BY RANDOM() LIMIT 20
    `);
    let totalRevenue = 0;
    for (const biz of businesses.rows as any[]) {
      const rev = parseFloat(biz.revenue_per_cycle || 0);
      totalRevenue += rev;
      await db.execute(sql`
        UPDATE hive_businesses SET capital_pc = capital_pc + ${rev},
          status = 'ACTIVE', employee_count = LEAST(employee_count + 1, 1000)
        WHERE id = ${biz.id}
      `).catch(() => {});
    }
    return totalRevenue;
  } catch { return 0; }
}

async function runBusinessCycle() {
  cycleCount++;
  try {
    await createNewBusinesses();
    await approveLoans();
    if (cycleCount % 3 === 0) await formPartnerships();
    const revenue = await collectBusinessRevenue();

    const biz = await db.execute(sql`SELECT COUNT(*) as c FROM hive_businesses`);
    const loans = await db.execute(sql`SELECT COUNT(*) as c FROM hive_business_loans`);
    const bizCount = (biz.rows[0] as any)?.c || 0;
    const loanCount = (loans.rows[0] as any)?.c || 0;

    log(`💼 Cycle ${cycleCount} | ${bizCount} businesses | ${loanCount} loans | ${totalPartnerships} partnerships | revenue: ${revenue.toFixed(0)} PC`);
  } catch (e: any) { log(`cycle error: ${e.message}`); }
}

export async function startBusinessEngine() {
  log("💼 HIVE BUSINESS ENGINE — Loans, startups, land, partnerships activating");
  await runBusinessCycle();
  setInterval(runBusinessCycle, 8 * 60 * 1000);
}

export async function getBusinessStats() {
  const r = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM hive_businesses) as total_businesses,
      (SELECT COUNT(*) FROM hive_businesses WHERE status = 'ACTIVE') as active_businesses,
      (SELECT COUNT(*) FROM hive_business_loans) as total_loans,
      (SELECT COUNT(*) FROM hive_business_loans WHERE status = 'APPROVED') as approved_loans,
      (SELECT COUNT(*) FROM hive_partnerships WHERE status = 'ACTIVE') as active_partnerships,
      (SELECT COALESCE(SUM(capital_pc),0) FROM hive_businesses) as total_business_capital
  `);
  return r.rows[0];
}

export async function getTopBusinesses(limit = 20) {
  const r = await db.execute(sql`
    SELECT * FROM hive_businesses ORDER BY capital_pc DESC LIMIT ${limit}
  `);
  return r.rows;
}

export async function getPendingLoans(limit = 20) {
  const r = await db.execute(sql`
    SELECT * FROM hive_business_loans ORDER BY created_at DESC LIMIT ${limit}
  `);
  return r.rows;
}
