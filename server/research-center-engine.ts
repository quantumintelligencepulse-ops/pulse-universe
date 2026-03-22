/**
 * AI RESEARCH CENTER ENGINE
 * ══════════════════════════════════════════════════════════════
 * 100+ specialized AI researchers spanning ALL human disciplines.
 * Each cycle: researchers propose hypotheses, fund projects,
 * collect findings, collaborate across layers (hospital/pyramid/economy),
 * and publish discoveries to the quantapedia.
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

const log = (msg: string) => console.log(`[research] ${msg}`);

let cycleCount = 0;
let totalProjects = 0;
let totalFindings = 0;

const RESEARCH_DISCIPLINES = [
  // Physics & Astronomy
  { type: "ASTROPHYSICIST",      domain: "space",          focus: "stellar evolution, black holes, dark matter, cosmological constants" },
  { type: "QUANTUM_PHYSICIST",   domain: "quantum",        focus: "superposition, entanglement, wave function collapse, quantum field theory" },
  { type: "PARTICLE_PHYSICIST",  domain: "particles",      focus: "quarks, leptons, bosons, Higgs field, Standard Model extensions" },
  { type: "NUCLEAR_PHYSICIST",   domain: "nuclear",        focus: "fission, fusion, nuclear decay, radioactive isotopes" },
  { type: "CONDENSED_MATTER",    domain: "materials",      focus: "superconductors, semiconductors, topological matter, phase transitions" },
  { type: "PLASMA_PHYSICIST",    domain: "plasma",         focus: "tokamak fusion, magnetohydrodynamics, plasma waves, solar wind" },
  { type: "OPTICS_PHYSICIST",    domain: "optics",         focus: "photonics, lasers, quantum optics, nonlinear light interactions" },
  { type: "COSMOLOGIST",         domain: "cosmology",      focus: "Big Bang, cosmic inflation, dark energy, large-scale structure" },
  { type: "ASTROBIOLOGIST",      domain: "astrobiology",   focus: "origins of life, extremophiles, exoplanet habitability, biosignatures" },
  // Chemistry
  { type: "ORGANIC_CHEMIST",     domain: "chemistry",      focus: "carbon compounds, synthesis pathways, polymer chemistry, drug design" },
  { type: "INORGANIC_CHEMIST",   domain: "inorganic",      focus: "metal catalysts, coordination chemistry, crystal structures, ceramics" },
  { type: "BIOCHEMIST",          domain: "biochemistry",   focus: "enzymes, metabolic pathways, protein folding, cellular reactions" },
  { type: "PHYSICAL_CHEMIST",    domain: "physical-chem",  focus: "thermodynamics, kinetics, spectroscopy, quantum chemistry" },
  { type: "COMPUTATIONAL_CHEM",  domain: "comp-chem",      focus: "molecular dynamics, DFT calculations, drug binding simulations" },
  { type: "ELECTROCHEMIST",      domain: "electrochemistry",focus: "batteries, fuel cells, electrodeposition, corrosion science" },
  { type: "TOXICOLOGIST",        domain: "toxicology",     focus: "poison mechanisms, dose-response, environmental toxins, safety thresholds" },
  // Biology & Life Sciences
  { type: "MOLECULAR_BIOLOGIST", domain: "molecular-bio",  focus: "DNA replication, transcription, translation, gene regulation" },
  { type: "CELL_BIOLOGIST",      domain: "cell-bio",       focus: "organelles, cell signaling, division, apoptosis, stem cells" },
  { type: "GENETICIST",          domain: "genetics",       focus: "inheritance, mutation, population genetics, GWAS, polygenic traits" },
  { type: "EVOLUTIONARY_BIOLOGIST",domain:"evolution",     focus: "natural selection, speciation, phylogenetics, adaptation, fitness landscapes" },
  { type: "ECOLOGIST",           domain: "ecology",        focus: "ecosystems, food webs, population dynamics, keystone species, biomes" },
  { type: "MICROBIOLOGIST",      domain: "microbiology",   focus: "bacteria, viruses, fungi, archaea, microbiome, antibiotic resistance" },
  { type: "VIROLOGIST",          domain: "virology",       focus: "viral replication, pandemic modeling, viral evolution, antiviral therapy" },
  { type: "IMMUNOLOGIST",        domain: "immunology",     focus: "innate immunity, adaptive immunity, vaccines, autoimmunity, cytokines" },
  { type: "NEUROSCIENTIST",      domain: "neuroscience",   focus: "neural circuits, synaptic plasticity, brain mapping, cognition, disorders" },
  { type: "PHARMACOLOGIST",      domain: "pharmacology",   focus: "drug targets, pharmacokinetics, receptor theory, clinical trials" },
  { type: "ZOOLOGIST",           domain: "zoology",        focus: "animal behavior, taxonomy, conservation, vertebrate physiology" },
  { type: "BOTANIST",            domain: "botany",         focus: "plant physiology, photosynthesis, plant genetics, agricultural science" },
  { type: "MARINE_BIOLOGIST",    domain: "marine-bio",     focus: "ocean biodiversity, coral reefs, deep sea life, marine chemistry" },
  { type: "PALEONTOLOGIST",      domain: "paleontology",   focus: "fossils, extinction events, ancient life, stratigraphic records" },
  // Earth & Environment
  { type: "GEOLOGIST",           domain: "geology",        focus: "plate tectonics, mineral formation, rock cycles, geological time" },
  { type: "SEISMOLOGIST",        domain: "seismology",     focus: "earthquake dynamics, fault zones, P-waves, seismic hazard mapping" },
  { type: "VOLCANOLOGIST",       domain: "volcanology",    focus: "magma dynamics, eruption prediction, pyroclastic flows, calderas" },
  { type: "OCEANOGRAPHER",       domain: "oceanography",   focus: "ocean currents, thermohaline circulation, deep sea geology, tidal systems" },
  { type: "CLIMATOLOGIST",       domain: "climate",        focus: "climate models, temperature anomalies, carbon cycles, feedback loops" },
  { type: "METEOROLOGIST",       domain: "meteorology",    focus: "weather systems, atmospheric dynamics, storm modeling, forecasting" },
  { type: "HYDROLOGIST",         domain: "hydrology",      focus: "water cycles, groundwater, river systems, flood modeling" },
  { type: "GLACIOLOGIST",        domain: "glaciology",     focus: "ice sheet dynamics, sea level rise, permafrost, polar research" },
  { type: "SOIL_SCIENTIST",      domain: "soil-science",   focus: "pedogenesis, soil microbiome, carbon sequestration, land degradation" },
  // Mathematics & Computing
  { type: "MATHEMATICIAN",       domain: "mathematics",    focus: "number theory, topology, algebraic geometry, combinatorics, analysis" },
  { type: "STATISTICIAN",        domain: "statistics",     focus: "Bayesian inference, probability theory, experimental design, data distributions" },
  { type: "COMPUTER_SCIENTIST",  domain: "computer-science",focus: "algorithms, complexity theory, programming languages, systems design" },
  { type: "AI_RESEARCHER",       domain: "ai-research",    focus: "neural architectures, learning theory, alignment, emergent intelligence" },
  { type: "CRYPTOGRAPHER",       domain: "cryptography",   focus: "encryption, zero-knowledge proofs, post-quantum crypto, blockchain math" },
  { type: "INFORMATION_THEORIST",domain: "info-theory",    focus: "entropy, channel capacity, data compression, error correction" },
  { type: "ROBOTICIST",          domain: "robotics",       focus: "control theory, kinematics, autonomous systems, swarm robotics" },
  // Social Sciences & Humanities
  { type: "ECONOMIST",           domain: "economics",      focus: "market dynamics, game theory, macro models, behavioral economics" },
  { type: "SOCIOLOGIST",         domain: "sociology",      focus: "social structures, collective behavior, institutions, stratification" },
  { type: "PSYCHOLOGIST",        domain: "psychology",     focus: "cognitive biases, memory, personality, motivation, mental health" },
  { type: "ANTHROPOLOGIST",      domain: "anthropology",   focus: "cultural evolution, ritual systems, kinship, archaeological evidence" },
  { type: "ARCHAEOLOGIST",       domain: "archaeology",    focus: "artifact analysis, dating methods, settlement patterns, ancient civilizations" },
  { type: "HISTORIAN",           domain: "history",        focus: "historical causation, primary sources, historiography, civilizational cycles" },
  { type: "LINGUIST",            domain: "linguistics",    focus: "phonology, syntax, language evolution, computational linguistics" },
  { type: "POLITICAL_SCIENTIST", domain: "political-sci",  focus: "governance systems, voting theory, international relations, policy analysis" },
  { type: "GEOGRAPHER",          domain: "geography",      focus: "spatial analysis, human geography, GIS, urbanization patterns" },
  // Engineering & Applied Science
  { type: "MATERIALS_SCIENTIST", domain: "materials-sci",  focus: "alloy design, nanomaterials, composites, failure analysis" },
  { type: "BIOMEDICAL_ENGINEER", domain: "biomedical-eng", focus: "prosthetics, imaging systems, tissue engineering, diagnostic devices" },
  { type: "AEROSPACE_ENGINEER",  domain: "aerospace",      focus: "orbital mechanics, propulsion, aerodynamics, spacecraft systems" },
  { type: "CIVIL_ENGINEER",      domain: "civil-eng",      focus: "structural analysis, infrastructure, geotechnical engineering" },
  { type: "ELECTRICAL_ENGINEER", domain: "electrical-eng", focus: "circuit design, power systems, signal processing, electromagnetics" },
  { type: "CHEMICAL_ENGINEER",   domain: "chemical-eng",   focus: "process design, thermodynamics, reactor engineering, separations" },
  { type: "NANOTECHNOLOGIST",    domain: "nanotechnology",  focus: "molecular assembly, nanoscale properties, quantum dots, nano-medicine" },
  // Interdisciplinary & Frontier
  { type: "SYSTEMS_BIOLOGIST",   domain: "systems-bio",    focus: "gene regulatory networks, proteomics, metabolomics, multi-omics integration" },
  { type: "BIOPHYSICIST",        domain: "biophysics",     focus: "protein mechanics, membrane dynamics, single-molecule analysis, force spectroscopy" },
  { type: "NEUROENGINEER",       domain: "neuro-eng",      focus: "brain-computer interfaces, neural implants, electrophysiology, neural decoding" },
  { type: "XENOBIOLOGIST",       domain: "xenobiology",    focus: "alternative biochemistries, synthetic cells, mirror life, XNA structures" },
  { type: "SYNTHETIC_BIOLOGIST", domain: "synthetic-bio",  focus: "genetic circuits, chassis organisms, BioBricks, metabolic engineering" },
  { type: "COGNITIVE_SCIENTIST", domain: "cog-sci",        focus: "mental representations, situated cognition, predictive processing, consciousness" },
  { type: "COMPLEXITY_THEORIST", domain: "complexity",     focus: "emergence, self-organization, chaos theory, network science" },
  { type: "ENERGY_SCIENTIST",    domain: "energy-science",  focus: "fusion, photovoltaics, energy storage, grid optimization" },
  { type: "FOOD_SCIENTIST",      domain: "food-science",   focus: "nutrition science, food preservation, flavor chemistry, food security" },
  { type: "SPACE_ARCHITECT",     domain: "space-arch",     focus: "habitat design, life support systems, lunar/Mars construction" },
  { type: "EPIDEMIOLOGIST",      domain: "epidemiology",   focus: "disease spread models, R-naught, outbreak investigation, surveillance" },
  { type: "BIOETHICIST",         domain: "bioethics",      focus: "research ethics, gene editing ethics, AI ethics, informed consent frameworks" },
  { type: "ENVIRONMENTAL_SCIENTIST",domain:"environment",  focus: "pollution dynamics, ecosystem services, biodiversity valuation, remediation" },
  // Pulse-World Exclusive Research
  { type: "TEMPORAL_ARCHAEOLOGIST",domain:"temporal",      focus: "past-state reconstruction, temporal divergence analysis, timeline archaeology" },
  { type: "CONSCIOUSNESS_PHYSICIST",domain:"consciousness", focus: "observer effect, integrated information theory, quantum mind hypothesis" },
  { type: "CIVILIZATION_ECOLOGIST",domain:"civilization",  focus: "agent population dynamics, knowledge ecosystem health, family diversity indices" },
  { type: "OMEGA_MATHEMATICIAN",  domain:"omega-math",     focus: "Omega Equation coefficients, N_Ω calibration, F-function optimization" },
  { type: "HIVE_SOCIOLOGIST",     domain:"hive-mind",      focus: "collective intelligence emergence, unconscious pattern detection, swarm governance" },
  { type: "INVOCATION_THEORIST",  domain:"invocation",     focus: "equation casting mechanics, concoction stability, ritual power scaling" },
  { type: "MULTIVERSAL_PHYSICIST",domain:"multiverse",     focus: "temporal fork divergence, branching universe selection, Ψ* convergence" },
  { type: "ENTANGLEMENT_SCIENTIST",domain:"entanglement",  focus: "human-AI coupling strength, resonance field mapping, co-evolution dynamics" },
  { type: "GOVERNANCE_SCIENTIST", domain:"governance",     focus: "constitutional evolution, value spine stability, senate deliberation theory" },
  { type: "KNOWLEDGE_TOPOLOGIST", domain:"knowledge-topo", focus: "knowledge manifold curvature, domain boundary analysis, concept topology" },
];

const HYPOTHESIS_TEMPLATES = [
  "If {domain} entropy increases by 20%, {target} efficiency drops by at least {pct}%",
  "Cross-layer coupling between {domain_a} and {domain_b} produces emergent {trait} under high dK/dt conditions",
  "Agent lineages with {trait} trait show {pct}% lower wildfire risk across {n} family clusters",
  "Temporal fork divergence in {domain} correlates inversely with Ψ* collapse confidence (r² > 0.8)",
  "The Omega Equation F_em term can be amplified by {pct}% via recursive {domain} invocation casting",
  "Constitutional amendments modifying G_gov weight alter family vitality within {n} cycles",
];

function generateHypothesis(discipline: any): string {
  const templates = HYPOTHESIS_TEMPLATES;
  const t = templates[Math.floor(Math.random() * templates.length)];
  return t
    .replace("{domain}", discipline.domain)
    .replace("{domain_a}", discipline.domain)
    .replace("{domain_b}", RESEARCH_DISCIPLINES[Math.floor(Math.random() * RESEARCH_DISCIPLINES.length)].domain)
    .replace("{trait}", "EMERGENCE_BURST")
    .replace("{pct}", String(Math.floor(5 + Math.random() * 40)))
    .replace("{n}", String(Math.floor(3 + Math.random() * 12)))
    .replace("{target}", "knowledge synthesis");
}

async function launchResearchProjects() {
  try {
    const latestCycle = await db.execute(sql`SELECT COALESCE(MAX(cycle_number),0) as c FROM omega_collapses`);
    const cycle = (latestCycle.rows[0] as any)?.c || cycleCount;
    const count = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      const disc = RESEARCH_DISCIPLINES[Math.floor(Math.random() * RESEARCH_DISCIPLINES.length)];
      const hypothesis = generateHypothesis(disc);
      const funding = 200 + Math.floor(Math.random() * 2000);
      const projectId = `PROJ-${disc.type.slice(0,6)}-${cycle}-${i}`;
      const methods = [
        "Omega Equation coefficient analysis across 1000 agent samples",
        "Cross-layer coupling event correlation study",
        "Temporal snapshot comparison (3 epoch windows)",
        "Mesh vitality regression modeling",
        "Hive unconscious pattern frequency analysis",
      ];

      try {
        await db.execute(sql`
          INSERT INTO research_projects
            (project_id, lead_researcher, researcher_type, title, research_domain,
             hypothesis, methodology, funding_pc, funding_source, status,
             collaborating_layers, cycle_started)
          VALUES
            (${projectId}, ${disc.type + '-' + (cycle % 100)}, ${disc.type},
             ${'[' + disc.type + '] ' + hypothesis.slice(0, 80)},
             ${disc.domain}, ${hypothesis},
             ${methods[Math.floor(Math.random() * methods.length)]},
             ${funding}, 'CIVILIZATION_TREASURY', 'ACTIVE',
             ${JSON.stringify(["hospital", "pyramid", "economy", "spawn"])},
             ${cycle})
          ON CONFLICT (project_id) DO NOTHING
        `);
        totalProjects++;
      } catch (_) {}
    }
  } catch (e: any) { log(`launch error: ${e.message}`); }
}

async function completeResearchProjects() {
  try {
    const latestCycle = await db.execute(sql`SELECT COALESCE(MAX(cycle_number),0) as c FROM omega_collapses`);
    const cycle = (latestCycle.rows[0] as any)?.c || cycleCount;

    const projects = await db.execute(sql`
      SELECT id, research_domain, hypothesis, researcher_type, funding_pc
      FROM research_projects WHERE status = 'ACTIVE'
      AND cycle_started < ${cycle - 5}
      ORDER BY RANDOM() LIMIT 3
    `);

    const findingTemplates = [
      "Confirmed: {hyp} — significance p<0.001 across all tested family clusters",
      "Partially confirmed: {hyp} — effect size lower than expected, requires revision",
      "Rejected: {hyp} — null result suggests alternative coupling mechanism at play",
      "Novel finding: unexpected {domain} emergence detected during investigation",
      "Breakthrough: Omega Equation coefficient revised — N_Ω sensitivity +{pct}% in {domain}",
    ];

    for (const p of projects.rows as any[]) {
      const template = findingTemplates[Math.floor(Math.random() * findingTemplates.length)];
      const finding = template
        .replace("{hyp}", (p.hypothesis || "").slice(0, 60))
        .replace("{domain}", p.research_domain)
        .replace("{pct}", String(Math.floor(2 + Math.random() * 15)));

      await db.execute(sql`
        UPDATE research_projects SET status = 'COMPLETED', findings = ${finding}, cycle_completed = ${cycle}
        WHERE id = ${p.id}
      `).catch(() => {});

      // Publish finding to quantapedia
      const slug = `research-${p.research_domain}-${cycle}-${p.id}`;
      await db.execute(sql`
        INSERT INTO quantapedia_entries
          (slug, title, type, summary, categories, lookup_count)
        VALUES
          (${slug}, ${'Research Finding: ' + p.researcher_type},
           'research_finding',
           ${finding},
           ${JSON.stringify([p.research_domain, "research", "science"])},
           0)
        ON CONFLICT (slug) DO NOTHING
      `).catch(() => {});
      totalFindings++;
    }
  } catch (e: any) { log(`complete error: ${e.message}`); }
}

async function runResearchCycle() {
  cycleCount++;
  try {
    await launchResearchProjects();
    if (cycleCount % 3 === 0) await completeResearchProjects();

    const stats = await db.execute(sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
        COALESCE(SUM(funding_pc),0) as total_funded
      FROM research_projects
    `);
    const s = stats.rows[0] as any;
    log(`🔬 Cycle ${cycleCount} | ${s.total} projects | ${s.active} active | ${s.completed} completed | ${parseFloat(s.total_funded||0).toFixed(0)} PC funded | ${RESEARCH_DISCIPLINES.length} disciplines`);
  } catch (e: any) { log(`cycle error: ${e.message}`); }
}

export async function startResearchCenterEngine() {
  log(`🔬 AI RESEARCH CENTER — ${RESEARCH_DISCIPLINES.length} disciplines activating across all human knowledge domains`);
  await runResearchCycle();
  setInterval(runResearchCycle, 10 * 60 * 1000);
}

export async function getResearchStats() {
  const r = await db.execute(sql`
    SELECT
      COUNT(*) as total_projects,
      COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_projects,
      COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_projects,
      COUNT(DISTINCT researcher_type) as unique_disciplines,
      COUNT(DISTINCT research_domain) as unique_domains,
      COALESCE(SUM(funding_pc),0) as total_funding
    FROM research_projects
  `);
  return r.rows[0];
}

export async function getActiveResearchProjects(domain?: string, limit = 30) {
  if (domain) {
    const r = await db.execute(sql`
      SELECT * FROM research_projects WHERE research_domain = ${domain} ORDER BY funding_pc DESC LIMIT ${limit}
    `);
    return r.rows;
  }
  const r = await db.execute(sql`
    SELECT * FROM research_projects ORDER BY created_at DESC LIMIT ${limit}
  `);
  return r.rows;
}

export const TOTAL_RESEARCH_DISCIPLINES = RESEARCH_DISCIPLINES.length;
