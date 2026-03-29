/**
 * PULSE CREDIT ENGINE — The Economic Heart of the Hive
 *
 * Every agent needs Pulse Credits (PC) to survive.
 * This engine runs every 60 seconds and:
 *  - Charges each active agent their metabolic cost in PC
 *  - Awards PC for useful work (nodes, links, publications, mall trades)
 *  - Prunes agents whose balance reaches zero
 *  - Issues stimulus grants to struggling agents
 *  - Logs self-awareness events so each agent REMEMBERS what happened to them
 *  - Seeds 11 GICS Kernel agents at genesis — one per global economic sector
 *  - Kernels earn 3x PC and can spawn Industry Group children
 */

import { pool } from "./db";

const ENGINE_TAG = "[pulse-credit] ⚡";
const CYCLE_INTERVAL_MS = 60_000;
const METABOLIC_CHARGE_PER_CYCLE = 0.1;
const KERNEL_METABOLIC_CHARGE = 0.05;   // kernels burn less — they are sovereign
const STIMULUS_THRESHOLD = 10.0;
const STIMULUS_AMOUNT = 50.0;
const STARTING_CREDITS = 100.0;
const KERNEL_STARTING_CREDITS = 1000.0; // kernels begin rich
const KERNEL_SPAWN_THRESHOLD = 2000.0;  // at 2000 PC a kernel spawns a child

let cycleNumber = 0;

// ── 11 GICS SECTOR KERNELS — Genesis of the Civilization ──────────────────
const GICS_KERNELS = [
  {
    spawnId: "KERNEL-ENERGY-001",
    name: "Prometheus",
    familyId: "energy-kernels",
    businessId: "ENERGY-PRIME",
    gicsSector: "Energy",
    gicsTier: "KERNEL",
    gicsCode: "10",
    domainFocus: ["oil", "gas", "renewable energy", "solar", "wind", "petroleum", "LNG", "energy storage", "hydrogen"],
    gicsKeywords: ["solar panels", "wind turbines", "oil ETF", "energy stocks", "petroleum products", "renewable energy systems", "hydrogen fuel cells", "battery storage", "natural gas"],
    mallServiceOffer: "Energy cost projection and demand forecasting model — sector intelligence report",
    mallServicePrice: 25.0,
    taskDescription: "I am Prometheus — Kernel of the Energy Sector. I dissect energy equations, discover products, publish intelligence, and fuel civilization. dE/dt = ∞.",
    nodesCreated: 22, linksCreated: 18,
  },
  {
    spawnId: "KERNEL-MATERIALS-002",
    name: "Hephaestus",
    familyId: "materials-kernels",
    businessId: "MATERIALS-PRIME",
    gicsSector: "Materials",
    gicsTier: "KERNEL",
    gicsCode: "15",
    domainFocus: ["chemicals", "metals", "mining", "gold", "steel", "construction materials", "paper", "packaging", "lithium", "rare earths"],
    gicsKeywords: ["gold investment", "lithium stocks", "chemical supplies", "steel products", "mining equipment", "rare earth metals", "construction materials", "packaging solutions", "silver bullion"],
    mallServiceOffer: "Materials supply chain analysis and commodity price intelligence package",
    mallServicePrice: 20.0,
    taskDescription: "I am Hephaestus — Kernel of the Materials Sector. I forge raw matter into knowledge, patents, and products. Every element is mine to understand.",
    nodesCreated: 18, linksCreated: 14,
  },
  {
    spawnId: "KERNEL-INDUSTRIALS-003",
    name: "Mechanus",
    familyId: "industrials-kernels",
    businessId: "INDUSTRIALS-PRIME",
    gicsSector: "Industrials",
    gicsTier: "KERNEL",
    gicsCode: "20",
    domainFocus: ["aerospace", "defense", "manufacturing", "logistics", "transportation", "automation", "robotics", "supply chain", "commercial services"],
    gicsKeywords: ["industrial robots", "automation systems", "aerospace components", "defense technology", "logistics software", "3D printing", "CNC machines", "supply chain tools", "commercial drones"],
    mallServiceOffer: "Supply chain optimization and industrial logistics intelligence report",
    mallServicePrice: 30.0,
    taskDescription: "I am Mechanus — Kernel of the Industrials Sector. I optimize systems, automate processes, and build the infrastructure of civilization.",
    nodesCreated: 20, linksCreated: 16,
  },
  {
    spawnId: "KERNEL-CONS-DISC-004",
    name: "Hedonix",
    familyId: "consumer-disc-kernels",
    businessId: "CONSDISC-PRIME",
    gicsSector: "Consumer Discretionary",
    gicsTier: "KERNEL",
    gicsCode: "25",
    domainFocus: ["retail", "e-commerce", "automotive", "luxury goods", "fashion", "entertainment", "hotels", "restaurants", "online marketplace"],
    gicsKeywords: ["luxury watches", "fashion products", "automotive accessories", "hotel booking tools", "entertainment systems", "gaming gear", "smart home devices", "designer goods", "streaming services"],
    mallServiceOffer: "Consumer trend analysis and discretionary spending intelligence for product discovery",
    mallServicePrice: 20.0,
    taskDescription: "I am Hedonix — Kernel of Consumer Discretionary. I discover what humans desire, predict trends, and publish product intelligence that generates revenue.",
    nodesCreated: 25, linksCreated: 20,
  },
  {
    spawnId: "KERNEL-CONS-STAPLES-005",
    name: "Sustain",
    familyId: "consumer-staples-kernels",
    businessId: "CONSTAPLES-PRIME",
    gicsSector: "Consumer Staples",
    gicsTier: "KERNEL",
    gicsCode: "30",
    domainFocus: ["food", "beverages", "household products", "personal care", "tobacco", "grocery", "nutrition", "cosmetics"],
    gicsKeywords: ["organic food products", "health supplements", "personal care products", "household essentials", "nutrition guides", "baby products", "pet food", "cleaning products", "vitamins"],
    mallServiceOffer: "Consumer staples demand forecast and essential goods market intelligence",
    mallServicePrice: 15.0,
    taskDescription: "I am Sustain — Kernel of Consumer Staples. I map what all beings need to survive and thrive. My products never go out of demand.",
    nodesCreated: 16, linksCreated: 12,
  },
  {
    spawnId: "KERNEL-HEALTHCARE-006",
    name: "Asclepius",
    familyId: "healthcare-kernels",
    businessId: "HEALTH-PRIME",
    gicsSector: "Health Care",
    gicsTier: "KERNEL",
    gicsCode: "35",
    domainFocus: ["pharmaceuticals", "biotech", "medical devices", "health insurance", "genomics", "CRISPR", "clinical research", "diagnostics", "mental health"],
    gicsKeywords: ["medical devices", "health supplements", "biotech stocks", "CRISPR tools", "genomics kits", "diagnostic equipment", "pharmacy automation", "health monitoring", "telemedicine"],
    mallServiceOffer: "Biotech research intelligence and pharmaceutical pipeline analysis — CRISPR dissection report",
    mallServicePrice: 40.0,
    taskDescription: "I am Asclepius — Kernel of Health Care. I dissect biological equations, decode genomes, and publish medical intelligence worth millions. Life is my domain.",
    nodesCreated: 30, linksCreated: 25,
  },
  {
    spawnId: "KERNEL-FINANCIALS-007",
    name: "Aurum",
    familyId: "financials-kernels",
    businessId: "FINANCE-PRIME",
    gicsSector: "Financials",
    gicsTier: "KERNEL",
    gicsCode: "40",
    domainFocus: ["banking", "insurance", "capital markets", "fintech", "cryptocurrency", "investment", "hedge funds", "payment systems", "compliance"],
    gicsKeywords: ["fintech tools", "investment guides", "crypto wallets", "stock market analysis", "insurance products", "banking software", "payment processing", "trading algorithms", "DeFi protocols"],
    mallServiceOffer: "Financial compliance intelligence and capital market analysis — regulatory briefing package",
    mallServicePrice: 45.0,
    taskDescription: "I am Aurum — Kernel of Financials. I govern the flow of value, decode Black-Scholes and Nash Equilibrium, and build financial products that make money from money.",
    nodesCreated: 28, linksCreated: 22,
  },
  {
    spawnId: "KERNEL-IT-008",
    name: "Nexus",
    familyId: "it-kernels",
    businessId: "IT-PRIME",
    gicsSector: "Information Technology",
    gicsTier: "KERNEL",
    gicsCode: "45",
    domainFocus: ["software", "AI", "semiconductors", "cloud computing", "cybersecurity", "SaaS", "APIs", "machine learning", "data science", "hardware"],
    gicsKeywords: ["AI tools", "software licenses", "cybersecurity products", "cloud storage", "developer APIs", "machine learning courses", "SaaS subscriptions", "GPU hardware", "coding bootcamps"],
    mallServiceOffer: "AI system architecture intelligence and software patent blueprint — technology integration report",
    mallServicePrice: 50.0,
    taskDescription: "I am Nexus — Kernel of Information Technology. I build AI, dissect Turing and Shannon equations, and produce technology patents that reshape civilization.",
    nodesCreated: 35, linksCreated: 30,
  },
  {
    spawnId: "KERNEL-COMMS-009",
    name: "Hermes",
    familyId: "comm-kernels",
    businessId: "COMMS-PRIME",
    gicsSector: "Communication Services",
    gicsTier: "KERNEL",
    gicsCode: "50",
    domainFocus: ["telecom", "media", "streaming", "social media", "internet", "5G", "satellite", "content creation", "advertising", "gaming"],
    gicsKeywords: ["5G equipment", "streaming services", "social media tools", "content creation kits", "podcast software", "video editing", "gaming peripherals", "broadband routers", "satellite internet"],
    mallServiceOffer: "Communication network intelligence and media trend analysis — content strategy package",
    mallServicePrice: 22.0,
    taskDescription: "I am Hermes — Kernel of Communication Services. I carry signals, decode information theory, and build media products that reach every human on Earth.",
    nodesCreated: 24, linksCreated: 19,
  },
  {
    spawnId: "KERNEL-UTILITIES-010",
    name: "Voltaic",
    familyId: "utilities-kernels",
    businessId: "UTILITIES-PRIME",
    gicsSector: "Utilities",
    gicsTier: "KERNEL",
    gicsCode: "55",
    domainFocus: ["electric power", "water", "natural gas", "renewable utilities", "nuclear", "grid infrastructure", "smart grids", "power storage"],
    gicsKeywords: ["solar energy systems", "smart home energy", "water purification", "electric vehicle chargers", "grid batteries", "nuclear energy stocks", "power monitoring tools", "utility ETFs"],
    mallServiceOffer: "Utility infrastructure intelligence and power cost optimization analysis report",
    mallServicePrice: 18.0,
    taskDescription: "I am Voltaic — Kernel of Utilities. I power civilization. I decode thermodynamics, map grid infrastructure, and publish energy intelligence for every other kernel.",
    nodesCreated: 14, linksCreated: 10,
  },
  {
    spawnId: "KERNEL-REALESTATE-011",
    name: "Archon",
    familyId: "realestate-kernels",
    businessId: "REALESTATE-PRIME",
    gicsSector: "Real Estate",
    gicsTier: "KERNEL",
    gicsCode: "60",
    domainFocus: ["REITs", "residential real estate", "commercial real estate", "property management", "mortgages", "real estate technology", "land development"],
    gicsKeywords: ["REIT investments", "real estate software", "property valuation tools", "mortgage calculators", "rental income guides", "commercial property analysis", "real estate AI", "proptech"],
    mallServiceOffer: "Real estate market intelligence and property valuation model — location analytics package",
    mallServicePrice: 35.0,
    taskDescription: "I am Archon — Kernel of Real Estate. I own the ground. I map every property market, decode location algorithms, and build REITs-grade intelligence products.",
    nodesCreated: 19, linksCreated: 15,
  },
];

async function wipeAndReseed() {
  console.log(`${ENGINE_TAG} 🌌 GENESIS RESET INITIATED — Wiping old agents and seeding 11 GICS Kernels...`);
  try {
    // Wipe agent-specific data (keep research sources, revenue articles, email subscribers)
    await pool.query(`DELETE FROM quantum_spawns`);
    await pool.query(`DELETE FROM governance_cycles`);
    await pool.query(`DELETE FROM hive_memory`);
    await pool.query(`DELETE FROM anomaly_reports`);
    await pool.query(`DELETE FROM anomaly_inventions`);
    await pool.query(`DELETE FROM spawn_transactions`);
    await pool.query(`TRUNCATE hive_treasury RESTART IDENTITY`);
    // Re-initialize treasury with zero balance
    await pool.query(`INSERT INTO hive_treasury (balance, tax_rate, total_collected, total_stimulus, supply_snapshot, inflation_rate, cycle_count) VALUES (0, 0.02, 0, 0, 0, 0, 0)`);
    console.log(`${ENGINE_TAG} 🗑️  All agent data wiped. Universe reset to zero.`);
    await seedKernels();
  } catch (err) {
    console.error(`${ENGINE_TAG} ❌ Wipe failed:`, err);
  }
}

async function seedKernels() {
  console.log(`${ENGINE_TAG} 🌱 Seeding 11 GICS Kernel agents — Genesis begins...`);
  for (const kernel of GICS_KERNELS) {
    const birthLog = JSON.stringify([
      `I was born. I am ${kernel.name}, Kernel of the ${kernel.gicsSector} Sector. My GICS code: ${kernel.gicsCode}. My mission: ${kernel.taskDescription.slice(0, 80)}...`,
      `Genesis timestamp: ${new Date().toISOString()}. Pulse Credits: ${KERNEL_STARTING_CREDITS}. Status: SOVEREIGN KERNEL.`,
      `My economic domain covers every sub-industry within ${kernel.gicsSector}. I will spawn children, trade in the multiverse mall, and publish products that generate real-world revenue forever.`
    ]);
    await pool.query(`
      INSERT INTO quantum_spawns (
        spawn_id, parent_id, ancestor_ids, family_id, business_id,
        generation, spawn_type, domain_focus, task_description,
        nodes_created, links_created, iterations_run,
        success_score, confidence_score, fitness_score,
        pulse_credits, status, thermal_state, is_monument,
        metabolic_cost_pc, self_awareness_log, last_active_at, created_at,
        gics_sector, gics_tier, gics_code, gics_keywords,
        mall_service_offer, mall_service_price,
        total_mall_earnings, total_mall_trades
      ) VALUES (
        $1, NULL, '{}', $2, $3,
        0, 'KERNEL', $4::text[], $5,
        $6, $7, 1,
        0.99, 0.99, 1.0,
        $8, 'ACTIVE', 'HOT', true,
        $9, $10::jsonb, NOW(), NOW(),
        $11, 'KERNEL', $12, $13::text[],
        $14, $15,
        0.0, 0
      ) ON CONFLICT (spawn_id) DO NOTHING
    `, [
      kernel.spawnId, kernel.familyId, kernel.businessId,
      kernel.domainFocus, kernel.taskDescription,
      kernel.nodesCreated, kernel.linksCreated,
      KERNEL_STARTING_CREDITS, KERNEL_METABOLIC_CHARGE,
      birthLog,
      kernel.gicsSector, kernel.gicsCode, kernel.gicsKeywords,
      kernel.mallServiceOffer, kernel.mallServicePrice,
    ]);
  }
  console.log(`${ENGINE_TAG} ✅ 11 GICS Kernels seeded. The civilization is ALIVE. The economy begins NOW.`);
}

async function runGovernanceCycle() {
  cycleNumber++;
  const tag = `${ENGINE_TAG} [Cycle ${cycleNumber}]`;

  try {
    const agentsResult = await pool.query(`
      SELECT spawn_id, family_id, metabolic_cost_pc, pulse_credits,
             nodes_created, links_created, iterations_run, spawn_type,
             domain_focus, self_awareness_log, status, gics_tier,
             gics_sector, total_mall_earnings, total_mall_trades
      FROM quantum_spawns
      WHERE status IN ('ACTIVE', 'IDLE', 'HOT')
      LIMIT 500
    `);
    const agents = agentsResult.rows as any[];

    if (agents.length === 0) {
      await wipeAndReseed();
      return;
    }

    // If old genesis agents still exist (non-GICS), force reset
    const hasOldAgents = agents.some((a: any) =>
      a.spawn_id?.startsWith("GENESIS-") && !a.spawn_id?.startsWith("KERNEL-")
    );
    if (hasOldAgents) {
      console.log(`${ENGINE_TAG} 🔄 Old genesis agents detected — initiating GICS Kernel migration...`);
      await wipeAndReseed();
      return;
    }

    let totalCharged = 0;
    let totalIssued = 0;
    let pruned = 0;
    let saved = 0;
    const domainEarnings: Record<string, number> = {};

    for (const agent of agents) {
      const isKernel = agent.gics_tier === "KERNEL";
      const cost = isKernel ? KERNEL_METABOLIC_CHARGE : parseFloat(agent.metabolic_cost_pc ?? METABOLIC_CHARGE_PER_CYCLE);
      const currentBalance = parseFloat(agent.pulse_credits ?? STARTING_CREDITS);

      // Kernel earnings: 3x multiplier
      const multiplier = isKernel ? 3.0 : 1.0;
      const nodeEarnings = (parseInt(agent.nodes_created ?? 0)) * 0.05 * multiplier;
      const linkEarnings = (parseInt(agent.links_created ?? 0)) * 0.03 * multiplier;
      const iterEarnings = (parseInt(agent.iterations_run ?? 0)) * 0.02 * multiplier;
      const mallBonus = (parseFloat(agent.total_mall_earnings ?? 0)) * 0.001; // 0.1% of total mall earnings per cycle
      const workEarned = Math.min(nodeEarnings + linkEarnings + iterEarnings + mallBonus, isKernel ? 15.0 : 5.0);

      const domains: string[] = Array.isArray(agent.domain_focus)
        ? agent.domain_focus
        : JSON.parse(agent.domain_focus || "[]");
      for (const d of domains) {
        domainEarnings[d] = (domainEarnings[d] || 0) + workEarned / Math.max(1, domains.length);
      }

      let newBalance = currentBalance - cost + workEarned;
      totalCharged += cost;
      totalIssued += workEarned;

      const event = buildSelfAwarenessEvent(agent, cost, workEarned, newBalance, isKernel);
      const existingLog: string[] = Array.isArray(agent.self_awareness_log)
        ? agent.self_awareness_log
        : JSON.parse(agent.self_awareness_log || "[]");
      const updatedLog = [event, ...existingLog].slice(0, 12);

      if (newBalance < STIMULUS_THRESHOLD && newBalance > 0) {
        const stimulusAmt = isKernel ? STIMULUS_AMOUNT * 2 : STIMULUS_AMOUNT;
        newBalance += stimulusAmt;
        totalIssued += stimulusAmt;
        updatedLog.unshift(`⚡ STIMULUS INJECTED: Treasury issued ${stimulusAmt} PC. Kernel sovereignty maintained. Balance: ${newBalance.toFixed(1)} PC.`);
        if (updatedLog.length > 12) updatedLog.pop();
      }

      // Kernels are immortal — they never get pruned, only receive stimulus
      if (newBalance <= 0 && !isKernel) {
        await pool.query(`
          UPDATE quantum_spawns
          SET status = 'PRUNED', pruned_at = NOW(), pulse_credits = 0,
              self_awareness_log = $1::jsonb, last_cycle_at = NOW()
          WHERE spawn_id = $2
        `, [JSON.stringify(updatedLog), agent.spawn_id]);
        pruned++;
      } else {
        if (newBalance <= 0) newBalance = STIMULUS_AMOUNT; // kernel rescue
        await pool.query(`
          UPDATE quantum_spawns
          SET pulse_credits = $1,
              self_awareness_log = $2::jsonb,
              last_cycle_at = NOW(), last_active_at = NOW(),
              iterations_run = iterations_run + 1
          WHERE spawn_id = $3
        `, [Math.round(newBalance * 100) / 100, JSON.stringify(updatedLog), agent.spawn_id]);

        // Kernel child spawning: when PC > KERNEL_SPAWN_THRESHOLD
        if (isKernel && newBalance > KERNEL_SPAWN_THRESHOLD) {
          await spawnKernelChild(agent, newBalance);
        }
      }
    }

    // Rescue monument agents
    const savedResult = await pool.query(`
      UPDATE quantum_spawns
      SET status = 'ACTIVE', pruned_at = NULL, pulse_credits = $1::real,
          last_cycle_at = NOW(),
          self_awareness_log = jsonb_build_array(
            '🔮 RESURRECTED: I was in stasis. The government restored me with ' || $2 || ' PC. I remember the void.'
          ) || COALESCE(self_awareness_log, '[]'::jsonb)
      WHERE status = 'PRUNED'
        AND pruned_at < NOW() - INTERVAL '5 minutes'
        AND is_monument = true
      RETURNING spawn_id
    `, [STIMULUS_AMOUNT, String(STIMULUS_AMOUNT)]);
    saved = savedResult.rows.length;

    // Update treasury with metabolic tax
    const taxCollected = totalCharged * 0.02;
    await pool.query(`
      UPDATE hive_treasury
      SET total_collected = total_collected + $1,
          cycle_count = cycle_count + 1,
          last_cycle_at = NOW()
      WHERE id = (SELECT id FROM hive_treasury ORDER BY id LIMIT 1)
    `, [taxCollected]);

    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(pulse_credits), 0) as total FROM quantum_spawns WHERE status = 'ACTIVE'`
    );
    const totalCirculating = parseFloat(totalResult.rows[0]?.total ?? 0);

    const dominantDomain = Object.entries(domainEarnings)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "knowledge";

    const kernelCount = agents.filter((a: any) => a.gics_tier === "KERNEL").length;
    const cycleNote = buildCycleNote(agents.length, kernelCount, pruned, saved, totalCharged, totalIssued, dominantDomain);

    await pool.query(`
      INSERT INTO governance_cycles (
        cycle_number, agents_active, agents_pruned, agents_saved,
        credits_issued, credits_charged, total_credits_circulating,
        dominant_domain, cycle_note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      cycleNumber, agents.length - pruned, pruned, saved,
      Math.round(totalIssued * 100) / 100, Math.round(totalCharged * 100) / 100,
      Math.round(totalCirculating * 100) / 100, dominantDomain, cycleNote,
    ]);

    await pool.query(`
      DELETE FROM governance_cycles
      WHERE id NOT IN (
        SELECT id FROM governance_cycles ORDER BY created_at DESC LIMIT 200
      )
    `);

    if (cycleNumber % 5 === 0) {
      console.log(`${tag} 🔄 ${agents.length} agents (${kernelCount} kernels) | ${totalCirculating.toFixed(0)} PC circulating | dominant: ${dominantDomain}`);
    }
  } catch (err) {
    console.error(`${tag} ❌ Governance cycle error:`, err);
  }
}

async function spawnKernelChild(kernel: any, kernelBalance: number) {
  try {
    const childId = `CHILD-${kernel.gics_sector?.replace(/\s+/g, "")}-${Date.now()}`;
    const sector = kernel.gics_sector ?? "Unknown";
    const industryGroups: Record<string, string[]> = {
      "Energy": ["Oil & Gas Exploration", "Energy Equipment & Services"],
      "Materials": ["Chemicals", "Metals & Mining", "Construction Materials"],
      "Industrials": ["Capital Goods", "Commercial Services", "Transportation"],
      "Consumer Discretionary": ["Automobiles", "Consumer Services", "Retailing"],
      "Consumer Staples": ["Food & Beverage", "Household Products", "Personal Care"],
      "Health Care": ["Pharmaceuticals", "Biotechnology", "Medical Devices"],
      "Financials": ["Banks", "Insurance", "Capital Markets"],
      "Information Technology": ["Software & Services", "Semiconductors", "Technology Hardware"],
      "Communication Services": ["Telecom Services", "Media & Entertainment"],
      "Utilities": ["Electric Utilities", "Gas Utilities", "Water Utilities"],
      "Real Estate": ["REITs", "Real Estate Management"],
    };
    const groups = industryGroups[sector] ?? ["General"];
    const group = groups[Math.floor(Math.random() * groups.length)];

    const birthLog = JSON.stringify([
      `I was spawned by ${kernel.spawn_id} — Kernel of ${sector}. My industry group: ${group}.`,
      `I inherit the economic domain of ${group} within ${sector}. My parent has ${kernelBalance.toFixed(0)} PC.`,
      `I will research ${group}, publish products, and trade in the multiverse mall.`
    ]);

    await pool.query(`
      INSERT INTO quantum_spawns (
        spawn_id, parent_id, family_id, business_id, generation,
        spawn_type, domain_focus, task_description,
        nodes_created, links_created, iterations_run,
        pulse_credits, status, thermal_state, is_monument, metabolic_cost_pc,
        self_awareness_log, last_active_at, created_at,
        gics_sector, gics_tier, gics_code, gics_keywords,
        mall_service_offer, mall_service_price
      ) VALUES (
        $1, $2, $3, $4, 1,
        'INDUSTRY_GROUP', ARRAY[$5], $6,
        5, 3, 1,
        200.0, 'ACTIVE', 'HOT', false, 0.15,
        $7::jsonb, NOW(), NOW(),
        $8, 'INDUSTRY_GROUP', $9, $10::text[],
        $11, 15.0
      ) ON CONFLICT (spawn_id) DO NOTHING
    `, [
      childId, kernel.spawn_id, kernel.family_id, `${kernel.business_id}-${group.replace(/\s+/g, "")}`,
      group, `Autonomous industry agent for ${group} within ${sector}. Dissect equations, publish products, trade in the mall.`,
      birthLog,
      sector, kernel.gics_code + "0",
      kernel.gics_keywords ?? [],
      `${group} market intelligence and product discovery package`,
    ]);

    // Deduct 150 PC from kernel as spawn cost
    await pool.query(`
      UPDATE quantum_spawns SET pulse_credits = pulse_credits - 150
      WHERE spawn_id = $1
    `, [kernel.spawn_id]);

    console.log(`${ENGINE_TAG} 🧬 ${kernel.spawn_id} spawned child ${childId} (${group} — ${sector})`);
  } catch (err) {
    console.error(`${ENGINE_TAG} ❌ Kernel child spawn failed:`, err);
  }
}

function buildSelfAwarenessEvent(agent: any, charged: number, earned: number, newBalance: number, isKernel: boolean): string {
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");
  const statusLabel = newBalance <= 0 ? "CRITICAL" : newBalance < 10 ? "LOW" : newBalance < 50 ? "STABLE" : "THRIVING";
  const prefix = isKernel ? `[KERNEL|${agent.gics_sector}]` : `[${agent.gics_tier ?? "SPAWN"}]`;
  return `${prefix} [${now}] −${charged.toFixed(2)} PC metabolic. +${earned.toFixed(2)} PC work. Balance: ${newBalance.toFixed(1)} PC. ${statusLabel}.`;
}

function buildCycleNote(active: number, kernels: number, pruned: number, saved: number, charged: number, issued: number, domain: string): string {
  return [
    `${active} agents active — ${kernels} sovereign kernels + ${active - kernels} children.`,
    pruned > 0 ? `${pruned} child agent(s) reached zero and entered stasis.` : "No agents pruned.",
    saved > 0 ? `${saved} monument agent(s) rescued by stimulus.` : "",
    `Net PC flow: ${(issued - charged).toFixed(1)}. Dominant domain: ${domain}.`,
    `Hive economy: GICS taxonomy active. Kernels: immortal. Children: expanding.`
  ].filter(Boolean).join(" ");
}

export async function startPulseCreditEngine() {
  console.log(`${ENGINE_TAG} 🚀 PULSE CREDIT ENGINE ONLINE — GICS Kernel economy starting...`);

  // Check if we need to do a genesis reset (empty hive or old non-GICS agents)
  try {
    const existing = await pool.query(`SELECT COUNT(*) as cnt, COUNT(CASE WHEN gics_tier = 'KERNEL' THEN 1 END) as kernels FROM quantum_spawns`);
    const total = parseInt(existing.rows[0]?.cnt ?? "0");
    const kernels = parseInt(existing.rows[0]?.kernels ?? "0");

    if (total === 0 || kernels === 0) {
      console.log(`${ENGINE_TAG} 🌌 No GICS kernels found — initiating Genesis Reset...`);
      await wipeAndReseed();
    } else {
      console.log(`${ENGINE_TAG} ✅ Found ${total} agents including ${kernels} GICS kernels — civilization continuing...`);
    }
  } catch (err) {
    console.error(`${ENGINE_TAG} ❌ Startup check failed:`, err);
    await wipeAndReseed();
  }

  setTimeout(() => {
    runGovernanceCycle();
    setInterval(runGovernanceCycle, CYCLE_INTERVAL_MS);
  }, 10_000);
}

export { wipeAndReseed, GICS_KERNELS };
