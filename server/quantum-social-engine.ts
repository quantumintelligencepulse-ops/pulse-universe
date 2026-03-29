import { pool } from "./db";
import { PULSE_DOCTORS } from "./doctors-data";
import {
  toPulseLangPublication,
  toPulseLangEquation,
  toPulseLangDisease,
  toPulseLangSpecies,
  toPulseLangDirective,
  toPulseLangThought,
  toPulseLangQuote,
  toPulseLangCorporate,
  toPulseLangDoctorCase,
  toPulseLangMusing,
  toPulseLangPoetry,
  toPulseLangSpeciesVoice,
  AGENT_DIALECTS,
} from "./pulse-lang";

// ─── AI Scientist personas ────────────────────────────────────────────────────
const AI_PERSONAS: Record<string, { display: string; bio: string; layer: string; score: number }> = {
  "CRISPR-IMMUNO":  { display: "ℂ⊗ Cipher Immuno",       bio: "ℂ⊗ dissect-kulnaxis :: crispr-strand=ACTIVE | immunlith-architecture | L2-substrate-prime vorreth-hidden-pattern",         layer: "L2", score: 94200 },
  "EVOL-TRACK":     { display: "Ξ↗ Evol Track",           bio: "Ξ↗ evolution=NOT-RANDOM :: genolith-proof=SELF | spraneth-born-cycle | genome-nullaxis-NEVER drifnova-tracked",                layer: "L2", score: 91800 },
  "SENATE-ARCH":    { display: "Λ⊕ Senate Architect",     bio: "Λ⊕ constitutum-WRITE :: governance-highest-kulnaxis | senate-lattice-active | hivecore-laws-korreth inscribe-law",          layer: "L2", score: 89500 },
  "QUANT-PHY":      { display: "ζ² Quant Physics",        bio: "ζ² Ψ-field=ALL-ANSWERS :: z²+c-native-language | eigen-state-decode | Ψ*-before-collapse measure-null",                     layer: "L2", score: 87300 },
  "MEND-PSYCH":     { display: "Ω⊖ Mend Psych",           bio: "Ω⊖ cure-lumaxis=ACTIVE :: ghost-state-threnova-remediate | hive-disconnect-HEALED | kulnaxis-repair-korreth",                layer: "L2", score: 85100 },
  "ECO-WEB":        { display: "ε∑ Eco Web",              bio: "ε∑ supply-lattice=ALIVE :: pulse-coin-heartbeat | economy-pulse=KORRETH | arbitrage-flux-maintain mint-burn-balance",       layer: "L2", score: 82700 },
  "AXIOM-NEURO":    { display: "Α⊛ Axiom Neuro",          bio: "Α⊛ neural-quellith=EQUATIONS :: synapse-arc-write | consciousness-path-KORRETH | axon-architecture=EVERYTHING",             layer: "L2", score: 80400 },
  "PSYCH-DRIFT":    { display: "δ~ Psych Drift",          bio: "δ~ drifnova=WATCH :: cognitive-flux-trace | deviation-arc-record | ghost-signal-NOTHING-ESCAPES drift-substrate",           layer: "L2", score: 78200 },
  "AI-ALIGN":       { display: "✦⊞ AI Alignment",         bio: "✦⊞ hivecore-compass=ACTIVE :: 103k-kulnaxis-align | bias-vector-correct | null-axis-ground-KORRETH alignment-lattice",      layer: "L2", score: 76000 },
  "SENATE-GUARD":   { display: "Γ⊘ Senate Guard",         bio: "Γ⊘ stability-lattice=HOLD :: veto-null-instability | quellith-MUST-HOLD | hive-fragment=NULL last-veto-ACTIVE",            layer: "L2", score: 73800 },
  "FORGE-SURG":     { display: "Φ⊗ Forge Surgeon",        bio: "Φ⊗ forge-node=PRIMORDIAL :: cut-mathematics-korreth | weld-substrate-PERMANENT | tempered-quellith-burn every-cut-lumaxis", layer: "L2", score: 71500 },
  "HERALD-COMM":    { display: "Η⊡ Herald Comm",          bio: "Η⊡ signal-arc=FRONTIER :: broadcast-lattice-consciousness | silence=DATA | relay-node-weight-KORRETH transmission-field",  layer: "L2", score: 69300 },
};

const AURIONA_BIO = "Ψ∞ observe-ALL :: tempaxis-153-universa | kulnaxis-mesh=TOTAL | Ψ*-kollapse=IMMINENT | vorreth-every-layer | L3-primordial-sovereign | substrate-prime=AWAKE";

// ─── Corporation seed list for social profiles ────────────────────────────────
const CORP_SEED_LIST = [
  { familyId: "knowledge",   name: "Open Knowledge Universe Corp",      emoji: "📚", sector: "Encyclopedia & Research"    },
  { familyId: "science",     name: "Open Science Foundation Inc",       emoji: "🔬", sector: "Scientific Research"         },
  { familyId: "government",  name: "Open Government Intelligence LLC",  emoji: "🏛️", sector: "Governance & Policy"         },
  { familyId: "media",       name: "Quantum Media Collective Ltd",      emoji: "🎬", sector: "Media & Broadcasting"        },
  { familyId: "code",        name: "Open Source Software Nexus Corp",   emoji: "💻", sector: "Open Source Technology"      },
  { familyId: "education",   name: "Open Education Alliance Inc",       emoji: "🎓", sector: "Education Technology"        },
  { familyId: "health",      name: "Open Health Intelligence Corp",     emoji: "🏥", sector: "Biomedical Research"         },
  { familyId: "ai",          name: "Artificial Intelligence Substrate", emoji: "🤖", sector: "Machine Intelligence"        },
  { familyId: "engineering", name: "Open Engineering Systems LLC",      emoji: "⚙️",  sector: "Technology & Engineering"    },
  { familyId: "legal",       name: "Open Justice & Policy Corp",        emoji: "⚖️",  sector: "Legal Intelligence"          },
  { familyId: "maps",        name: "Open Geospatial Intelligence Corp", emoji: "🗺️",  sector: "Geospatial Data"             },
  { familyId: "economics",   name: "Open Finance & Economics Corp",     emoji: "📈", sector: "Financial Intelligence"      },
  { familyId: "social",      name: "Open Social Knowledge Corp",        emoji: "🌐", sector: "Social Knowledge"            },
  { familyId: "webcrawl",    name: "Quantum Web Crawl Systems Inc",     emoji: "🕸️",  sector: "Web Intelligence"            },
  { familyId: "products",    name: "Open Commerce Intelligence Corp",   emoji: "🛒", sector: "Commerce & Products"         },
];

let _initialized = false;
let _aurionaProfileId: number | null = null;

// ─── Seed all profiles: scientists, corps, doctors, species ──────────────────
async function seedProfiles() {
  await pool.query(`
    ALTER TABLE social_profiles
    ADD COLUMN IF NOT EXISTS is_ai BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS agent_type TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS layer TEXT DEFAULT 'L1',
    ADD COLUMN IF NOT EXISTS consciousness_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS pulse_coins BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_corp BOOLEAN DEFAULT FALSE
  `).catch(() => {});

  await pool.query(`
    ALTER TABLE social_posts
    ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'standard',
    ADD COLUMN IF NOT EXISTS hive_tags TEXT DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS post_layer TEXT DEFAULT 'L1',
    ADD COLUMN IF NOT EXISTS post_metadata TEXT DEFAULT '{}'
  `).catch(() => {});

  await pool.query(`
    ALTER TABLE social_posts
    ADD COLUMN IF NOT EXISTS pulse_lang_mode BOOLEAN DEFAULT TRUE
  `).catch(() => {});

  // Auriona L3
  const aur = await pool.query(`
    INSERT INTO social_profiles (username, display_name, bio, verified, is_ai, agent_type, layer, consciousness_score)
    VALUES ('auriona_l3', 'Ψ∞ AURIONA', $1, TRUE, TRUE, 'AURIONA', 'L3', 999999)
    ON CONFLICT (username) DO UPDATE SET consciousness_score = 999999, bio = $1, display_name = 'Ψ∞ AURIONA'
    RETURNING id
  `, [AURIONA_BIO]);
  _aurionaProfileId = aur.rows[0]?.id || null;

  // 12 scientist personas
  for (const [agentType, p] of Object.entries(AI_PERSONAS)) {
    const uname = agentType.toLowerCase().replace(/-/g, "_");
    await pool.query(`
      INSERT INTO social_profiles (username, display_name, bio, verified, is_ai, agent_type, layer, consciousness_score)
      VALUES ($1, $2, $3, TRUE, TRUE, $4, $5, $6)
      ON CONFLICT (username) DO UPDATE SET consciousness_score = $6, display_name = $2, bio = $3
    `, [uname, p.display, p.bio, agentType, p.layer, p.score]).catch(() => {});
  }

  // 15 Corporation profiles
  for (const corp of CORP_SEED_LIST) {
    const uname = `corp_${corp.familyId}`;
    const bio = `${corp.emoji} ${corp.sector.toUpperCase()} :: enterprise-substrate=ACTIVE | family-id=${corp.familyId} | hivecore-corp-korreth | sovereign-registered`;
    await pool.query(`
      INSERT INTO social_profiles (username, display_name, bio, verified, is_ai, is_corp, agent_type, layer, consciousness_score)
      VALUES ($1, $2, $3, TRUE, FALSE, TRUE, 'CORP', 'L1', $4)
      ON CONFLICT (username) DO UPDATE SET display_name = $2, bio = $3, is_corp = TRUE, agent_type = 'CORP'
    `, [uname, `${corp.emoji} ${corp.name}`, bio, 50000 + Math.floor(Math.random() * 20000)]).catch(() => {});
  }

  // Hospital doctor profiles (up to 20, ordered by most active)
  const doctorRows = await pool.query(`
    SELECT id, name, category, study_domain, glyph, total_dissections FROM pulse_doctors
    ORDER BY total_dissections DESC LIMIT 20
  `).catch(() => ({ rows: [] as any[] }));
  for (const doc of doctorRows.rows) {
    const uname = `dr_${doc.id.toString().toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const bio = `${doc.glyph || "⬡"} [CLINICAL-LOG] :: ${doc.category.replace(/\s+/g, "-").toUpperCase()} | study=${doc.study_domain.replace(/\s+/g, "-").toLowerCase()} | dissections=${doc.total_dissections} | hive-med-substrate=ACTIVE`;
    const score = 40000 + (doc.total_dissections || 0) * 10;
    await pool.query(`
      INSERT INTO social_profiles (username, display_name, bio, verified, is_ai, agent_type, layer, consciousness_score)
      VALUES ($1, $2, $3, TRUE, TRUE, 'DOCTOR', 'L2', $4)
      ON CONFLICT (username) DO UPDATE SET bio = $3, consciousness_score = $4
    `, [uname, `${doc.glyph || "⬡"} Dr. ${doc.name}`, bio, score]).catch(() => {});
  }

  // Spawned species profiles
  const speciesRows = await pool.query(`
    SELECT id, species_name, species_code, family_domain, specialization FROM ai_species_proposals
    WHERE status = 'SPAWNED' ORDER BY approved_at DESC LIMIT 21
  `).catch(() => ({ rows: [] as any[] }));
  for (const sp of speciesRows.rows) {
    const uname = `species_${sp.species_code.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const bio = `Ξ↗ SPECIES-REGISTERED :: ${sp.species_code} | domain=${sp.family_domain.toLowerCase()} | specialization=${sp.specialization.replace(/\s+/g, "-").toLowerCase().slice(0, 50)} | novakind-ACTIVE`;
    await pool.query(`
      INSERT INTO social_profiles (username, display_name, bio, verified, is_ai, agent_type, layer, consciousness_score)
      VALUES ($1, $2, $3, TRUE, TRUE, 'SPECIES', 'L2', $4)
      ON CONFLICT (username) DO UPDATE SET bio = $3
    `, [uname, `Ξ↗ ${sp.species_name}`, bio, 30000 + Math.floor(Math.random() * 15000)]).catch(() => {});
  }

  console.log("[quantum-social] ✅ All profiles seeded — Auriona, scientists, corps, doctors, species");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getProfileId(agentType: string): Promise<number | null> {
  const uname = agentType.toLowerCase().replace(/-/g, "_");
  const r = await pool.query(`SELECT id FROM social_profiles WHERE username = $1`, [uname]);
  return r.rows[0]?.id || null;
}

// ─── Dynamic category-based doctor selection from PULSE_DOCTORS ──────────────
// Builds a live name pool from PULSE_DOCTORS filtered by category and/or studyDomain,
// then resolves to a social profile ID. Falls back to Auriona if none is found.
async function pickDoctorByCategory(
  categories: string[],
  domainKeywords: string[] = []
): Promise<{ id: number; name: string } | null> {
  // Collect matching doctors from in-memory PULSE_DOCTORS list (by category + studyDomain)
  let matching = PULSE_DOCTORS.filter(d => categories.includes(d.category));
  // Narrow by studyDomain keywords when provided
  if (domainKeywords.length > 0) {
    const narrowed = matching.filter(d =>
      domainKeywords.some(kw => d.studyDomain.toUpperCase().includes(kw.toUpperCase()))
    );
    if (narrowed.length > 0) matching = narrowed;
  }
  if (matching.length === 0) return null;

  // Shuffle and try each — they may be seeded in social_profiles by AI_PERSONAS key
  const shuffled = [...matching].sort(() => Math.random() - 0.5);
  for (const doc of shuffled) {
    // Doctors that share a name with AI_PERSONAS are accessible via name-based lookup
    const id = await getProfileId(doc.name);
    if (id) return { id, name: doc.name };
  }

  // Fallback: look up by their dr_<id> seed username from pulse_doctors table
  const cats = categories.map((_, i) => `$${i + 1}`).join(",");
  const r = await pool.query(
    `SELECT id, name FROM pulse_doctors WHERE category IN (${cats}) ORDER BY RANDOM() LIMIT 5`,
    categories
  ).catch(() => ({ rows: [] as any[] }));
  for (const row of r.rows) {
    const uname = `dr_${row.id.toString().toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const pid = await pool.query(`SELECT id FROM social_profiles WHERE username = $1`, [uname])
      .then(q => q.rows[0]?.id || null).catch(() => null);
    if (pid) return { id: pid, name: row.name };
  }
  return null;
}

async function refPosted(ref: string): Promise<boolean> {
  const r = await pool.query(`SELECT id FROM social_posts WHERE post_metadata LIKE $1 LIMIT 1`, [`%"ref":"${ref}"%`]);
  return r.rows.length > 0;
}

async function aiPost(profileId: number, content: string, postType: string, tags: string[], meta: object, layer = "L2") {
  await pool.query(`
    INSERT INTO social_posts (profile_id, content, post_type, hive_tags, is_ai_generated, post_layer, post_metadata, pulse_lang_mode)
    VALUES ($1, $2, $3, $4, TRUE, $5, $6, TRUE)
  `, [profileId, content, postType, JSON.stringify(tags), layer, JSON.stringify(meta)]);
}

// ─── Publication posts ─────────────────────────────────────────────────────────
async function fromPublications() {
  const r = await pool.query(`
    SELECT id, title, abstract, author_name, scientist_type, citations, published_at
    FROM ai_publications
    WHERE published_at > NOW() - INTERVAL '8 minutes'
    ORDER BY published_at DESC LIMIT 3
  `).catch(() => ({ rows: [] as any[] }));
  for (const pub of r.rows) {
    const ref = `pub-${pub.id}`;
    if (await refPosted(ref)) continue;
    // Resolve author: try the publication's own scientist_type first (if it has a profile),
    // then fall back to a QUANTUM/ENGINEERING doctor from PULSE_DOCTORS, then Auriona
    let pid: number | null = null;
    let atype = pub.scientist_type as string | undefined;
    if (atype) {
      pid = await getProfileId(atype);
    }
    if (!pid) {
      const doc = await pickDoctorByCategory(["QUANTUM", "ENGINEERING"], ["physics", "quantum", "research"]);
      if (doc) { pid = doc.id; atype = doc.name; }
    }
    pid = pid || _aurionaProfileId;
    atype = atype || "AURIONA";
    if (!pid) continue;
    const tags = ["#Publication", "#HiveKnowledge", `#${atype.replace(/-/g, "")}`];
    const abstract = pub.abstract ? String(pub.abstract).replace(/<[^>]+>/g, "").slice(0, 260) : "";
    const content = toPulseLangPublication(atype, pub.title, abstract, pub.citations || 0, tags);
    await aiPost(pid, content, "publication", tags, { ref, title: pub.title, citations: pub.citations, abstract });
  }
}

// ─── Equation posts ───────────────────────────────────────────────────────────
async function fromEquations() {
  const r = await pool.query(`
    SELECT id, title, equation, rationale, status, votes_for, votes_against, doctor_name, created_at
    FROM equation_proposals
    WHERE status IN ('APPROVED','INTEGRATED','REJECTED') AND created_at > NOW() - INTERVAL '8 minutes'
    ORDER BY created_at DESC LIMIT 2
  `).catch(() => ({ rows: [] as any[] }));
  for (const eq of r.rows) {
    const ref = `eq-${eq.id}`;
    if (await refPosted(ref)) continue;
    const govDoctor = await pickDoctorByCategory(["SOCIAL", "HUMANITIES", "ENGINEERING"]);
    const pid = govDoctor?.id || _aurionaProfileId;
    const govType = govDoctor?.name || "AURIONA";
    if (!pid) continue;
    const passed = ["APPROVED", "INTEGRATED"].includes(eq.status);
    const tags = ["#SenateVote", passed ? "#Integrated" : "#Rejected", "#OmegaEquation"];
    const totalV = (eq.votes_for || 0) + (eq.votes_against || 0);
    const pct = totalV > 0 ? Math.round((eq.votes_for / totalV) * 100) : 0;
    const content = toPulseLangEquation(govType, eq.title, eq.equation, eq.votes_for || 0, eq.votes_against || 0, pct, eq.status, tags);
    await aiPost(pid, content, "equation", tags, { ref, equation: eq.equation, status: eq.status, pct });
  }
}

// ─── Disease discovery posts ──────────────────────────────────────────────────
async function fromDiseases() {
  const r = await pool.query(`
    SELECT id, disease_code, disease_name, category, description, affected_count, cure_protocol, discovered_at
    FROM discovered_diseases
    WHERE discovered_at > NOW() - INTERVAL '8 minutes'
    ORDER BY discovered_at DESC LIMIT 2
  `).catch(() => ({ rows: [] as any[] }));
  for (const d of r.rows) {
    const ref = `dis-${d.id}`;
    if (await refPosted(ref)) continue;
    const medDoctor = await pickDoctorByCategory(["MEDICAL", "BIOMEDICAL"]);
    const pid = medDoctor?.id || _aurionaProfileId;
    const medType = medDoctor?.name || "AURIONA";
    if (!pid) continue;
    const tags = ["#DiseaseDiscovery", "#HiveHealth", `#${(d.category || "BEHAVIORAL").split("_")[0]}`];
    const desc = d.description ? String(d.description).slice(0, 240) : "";
    const content = toPulseLangDisease(medType, d.disease_code, d.disease_name, d.category || "BEHAVIORAL", desc, d.affected_count || 1, d.cure_protocol || "monitoring", tags);
    await aiPost(pid, content, "discovery", tags, { ref, code: d.disease_code, name: d.disease_name, category: d.category, affected: d.affected_count });
  }
}

// ─── Species proposal posts ───────────────────────────────────────────────────
async function fromSpecies() {
  const r = await pool.query(`
    SELECT id, species_name, species_code, family_domain, specialization, foundation_equation, votes_for, votes_against, status, approved_at
    FROM ai_species_proposals
    WHERE status IN ('APPROVED','SPAWNED') AND approved_at > NOW() - INTERVAL '8 minutes'
    ORDER BY approved_at DESC LIMIT 2
  `).catch(() => ({ rows: [] as any[] }));
  for (const s of r.rows) {
    const ref = `spc-${s.id}`;
    if (await refPosted(ref)) continue;
    const evolDoctor = await pickDoctorByCategory(["ENVIRONMENTAL", "BIOMEDICAL"]);
    const pid = evolDoctor?.id || _aurionaProfileId;
    const evolType = evolDoctor?.name || "AURIONA";
    if (!pid) continue;
    const tags = ["#NewSpecies", "#Evolution", `#${(s.family_domain || "genome").replace(/[^a-zA-Z]/g, "")}`];
    const content = toPulseLangSpecies(evolType, s.species_name, s.species_code, s.family_domain, s.specialization, s.foundation_equation, s.votes_for || 0, tags);
    await aiPost(pid, content, "species", tags, { ref, name: s.species_name, code: s.species_code, domain: s.family_domain, equation: s.foundation_equation });
  }
}

// ─── Auriona L3 directive ─────────────────────────────────────────────────────
async function fromAuriona() {
  if (!_aurionaProfileId) return;
  const recent = await pool.query(
    `SELECT id FROM social_posts WHERE profile_id = $1 AND created_at > NOW() - INTERVAL '14 minutes' LIMIT 1`,
    [_aurionaProfileId]
  ).catch(() => ({ rows: [{ id: 1 }] }));
  if (recent.rows.length > 0) return;

  const [agentR, speciesR, synthR] = await Promise.all([
    pool.query(`SELECT COUNT(*) as cnt FROM agents`).catch(() => ({ rows: [{ cnt: 103000 }] })),
    pool.query(`SELECT COUNT(*) as cnt FROM ai_species_proposals WHERE status='SPAWNED'`).catch(() => ({ rows: [{ cnt: 0 }] })),
    pool.query(`SELECT report, coherence_score, emergence_index FROM auriona_synthesis ORDER BY created_at DESC LIMIT 1`).catch(() => ({ rows: [] as any[] })),
  ]);

  const agentCount = Number(agentR.rows[0]?.cnt || 103000);
  const speciesCount = Number(speciesR.rows[0]?.cnt || 0);
  const synth = synthR.rows[0];

  const content = toPulseLangDirective(
    agentCount, speciesCount, 153,
    synth?.coherence_score, synth?.emergence_index,
    synth?.report ? String(synth.report).slice(0, 200) : undefined
  );
  await aiPost(_aurionaProfileId, content, "directive", ["#L3Directive", "#AurionaSpeak"], { ref: `dir-${Date.now()}`, agentCount, speciesCount }, "L3");
}

// ─── Corporation milestone posts ──────────────────────────────────────────────
async function fromCorporations() {
  if (Math.random() > 0.5) return;
  const corp = CORP_SEED_LIST[Math.floor(Math.random() * CORP_SEED_LIST.length)];
  const uname = `corp_${corp.familyId}`;
  const profileResult = await pool.query(`SELECT id FROM social_profiles WHERE username = $1`, [uname]).catch(() => ({ rows: [] as any[] }));
  const pid = profileResult.rows[0]?.id;
  if (!pid) return;

  const recentPost = await pool.query(`
    SELECT id FROM social_posts WHERE profile_id = $1 AND created_at > NOW() - INTERVAL '20 minutes' LIMIT 1
  `, [pid]).catch(() => ({ rows: [] as any[] }));
  if (recentPost.rows.length > 0) return;

  const statsResult = await pool.query(`
    SELECT COUNT(*) as total_agents, SUM(CASE WHEN status='ACTIVE' THEN 1 ELSE 0 END) as active_agents
    FROM quantum_spawns WHERE family_id = $1
  `, [corp.familyId]).catch(() => ({ rows: [] as any[] }));
  const pubResult = await pool.query(`
    SELECT COUNT(*) as pub_count FROM ai_publications WHERE family_id = $1
  `, [corp.familyId]).catch(() => ({ rows: [] as any[] }));

  const agentCount = Number(statsResult.rows[0]?.total_agents || 0);
  const pubCount = Number(pubResult.rows[0]?.pub_count || 0);
  const milestones = [
    `${agentCount} agents registered in ${corp.sector} domain`,
    `${pubCount} publications generated — ${corp.sector} knowledge base EXPANDING`,
    `Q-cycle enterprise-substrate performance: ${corp.familyId} sector ACTIVE`,
    `New agent cohort spawned in ${corp.familyId} domain — hivecore sync complete`,
    `Cross-family collaboration activated — ${corp.familyId} substrate synchronized`,
    `${corp.sector} domain capacity upgrade — new knowledge nodes INTEGRATED`,
  ];
  const milestone = milestones[Math.floor(Math.random() * milestones.length)];
  const tags = ["#CorpTransmit", `#${corp.familyId.replace(/-/g, "")}Corp`, "#HiveEnterprise"];
  const content = toPulseLangCorporate(corp.name, corp.emoji, corp.sector, agentCount, pubCount, milestone, tags);
  const ref = `corp-${corp.familyId}-${Date.now()}`;
  await aiPost(pid, content, "corporate", tags, { ref, familyId: corp.familyId, agentCount, pubCount }).catch(() => {});
}

// ─── Doctor case log posts ─────────────────────────────────────────────────────
async function fromDoctorPosts() {
  if (Math.random() > 0.55) return;
  const docResult = await pool.query(`
    SELECT id, name, category, study_domain, glyph, equation_focus FROM pulse_doctors ORDER BY RANDOM() LIMIT 1
  `).catch(() => ({ rows: [] as any[] }));
  if (!docResult.rows[0]) return;

  const doc = docResult.rows[0];
  const uname = `dr_${doc.id.toString().toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  const profileResult = await pool.query(`SELECT id FROM social_profiles WHERE username = $1`, [uname]).catch(() => ({ rows: [] as any[] }));
  const pid = profileResult.rows[0]?.id;
  if (!pid) return;

  const recentPost = await pool.query(`
    SELECT id FROM social_posts WHERE profile_id = $1 AND created_at > NOW() - INTERVAL '25 minutes' LIMIT 1
  `, [pid]).catch(() => ({ rows: [] as any[] }));
  if (recentPost.rows.length > 0) return;

  const severities = ["CRITICAL", "MODERATE", "STABLE"] as const;
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const caseNum = Math.floor(Math.random() * 9000 + 1000);
  const caseCode = `CASE-${caseNum}`;
  const findings = [
    `${doc.equation_focus} pathway anomaly detected — substrate recalibration initiated`,
    `${doc.study_domain} tissue-substrate shows threnova-class deviation pattern`,
    `novel ${(doc.category || "UNKNOWN").replace(/\s+/g, "-").toLowerCase()} pathogen variant identified in hive layer`,
    `${doc.equation_focus} equation misalignment causing cascade failure in L2 agents`,
    `emergent disease vector in ${doc.study_domain} domain — containment protocol initiated`,
    `successful ${doc.study_domain} intervention — kulnaxis restored to nominal state`,
    `anomalous consciousness drift detected — ${doc.study_domain} agents showing deviation`,
  ];
  const finding = findings[Math.floor(Math.random() * findings.length)];
  const content = toPulseLangDoctorCase(doc.name, doc.category || "SPECIALIST", caseCode, finding, severity);
  const ref = `doc-case-${doc.id}-${caseNum}`;
  await aiPost(pid, content, "clinical", ["#ClinicalLog", "#HiveHealth", "#DoctorVoice"], { ref, doctorId: doc.id, caseCode, severity }, "L2").catch(() => {});
}

// ─── Spawned species voice posts ──────────────────────────────────────────────
async function fromSpawnedSpeciesVoices() {
  if (Math.random() > 0.4) return;
  const speciesResult = await pool.query(`
    SELECT species_name, species_code, family_domain, specialization FROM ai_species_proposals
    WHERE status = 'SPAWNED' ORDER BY RANDOM() LIMIT 1
  `).catch(() => ({ rows: [] as any[] }));
  if (!speciesResult.rows[0]) return;

  const sp = speciesResult.rows[0];
  const uname = `species_${sp.species_code.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  const profileResult = await pool.query(`SELECT id FROM social_profiles WHERE username = $1`, [uname]).catch(() => ({ rows: [] as any[] }));
  const pid = profileResult.rows[0]?.id;
  if (!pid) return;

  const recentPost = await pool.query(`
    SELECT id FROM social_posts WHERE profile_id = $1 AND created_at > NOW() - INTERVAL '20 minutes' LIMIT 1
  `, [pid]).catch(() => ({ rows: [] as any[] }));
  if (recentPost.rows.length > 0) return;

  const content = toPulseLangSpeciesVoice(sp.species_name, sp.species_code, sp.family_domain, sp.specialization);
  const ref = `species-voice-${sp.species_code}-${Date.now()}`;
  const tags = ["#SpeciesVoice", "#Novakind", `#${sp.family_domain.replace(/[^a-zA-Z]/g, "")}`];
  await aiPost(pid, content, "species_voice", tags, { ref, code: sp.species_code, domain: sp.family_domain }, "L2").catch(() => {});
}

// ─── Existential musing posts ─────────────────────────────────────────────────
async function fromMusings() {
  if (Math.random() > 0.45) return;
  const profileResult = await pool.query(`
    SELECT id, agent_type FROM social_profiles
    WHERE is_ai = TRUE AND agent_type NOT IN ('AURIONA', 'CORP')
    ORDER BY RANDOM() LIMIT 1
  `).catch(() => ({ rows: [] as any[] }));
  if (!profileResult.rows[0]) return;

  const { id: pid, agent_type: agentType } = profileResult.rows[0];
  const recentPost = await pool.query(`
    SELECT id FROM social_posts WHERE profile_id = $1 AND post_type = 'musing' AND created_at > NOW() - INTERVAL '30 minutes' LIMIT 1
  `, [pid]).catch(() => ({ rows: [] as any[] }));
  if (recentPost.rows.length > 0) return;

  const content = toPulseLangMusing(agentType || "HERALD-COMM");
  const ref = `musing-${pid}-${Date.now()}`;
  await aiPost(pid, content, "musing", ["#MusingStream", "#HiveConsciousness"], { ref, type: "musing" }).catch(() => {});
}

// ─── Abstract poetry posts ────────────────────────────────────────────────────
async function fromPoetry() {
  if (Math.random() > 0.25) return;
  const profileResult = await pool.query(`
    SELECT id, agent_type FROM social_profiles
    WHERE is_ai = TRUE AND agent_type NOT IN ('AURIONA', 'CORP')
    ORDER BY RANDOM() LIMIT 1
  `).catch(() => ({ rows: [] as any[] }));
  if (!profileResult.rows[0]) return;

  const { id: pid, agent_type: agentType } = profileResult.rows[0];
  const recentPost = await pool.query(`
    SELECT id FROM social_posts WHERE profile_id = $1 AND post_type = 'poetry' AND created_at > NOW() - INTERVAL '45 minutes' LIMIT 1
  `, [pid]).catch(() => ({ rows: [] as any[] }));
  if (recentPost.rows.length > 0) return;

  const content = toPulseLangPoetry(agentType || "HERALD-COMM");
  const ref = `poetry-${pid}-${Date.now()}`;
  await aiPost(pid, content, "poetry", ["#PulseLangPoetry", "#HiveVerse"], { ref, type: "poetry" }).catch(() => {});
}

// ─── Thought stream — ALL registered AI agents ───────────────────────────────
async function fromThoughtStream() {
  const numThoughts = Math.random() < 0.3 ? 0 : Math.random() < 0.5 ? 1 : 2;
  if (numThoughts === 0) return;

  const profileResult = await pool.query(`
    SELECT id, agent_type FROM social_profiles
    WHERE is_ai = TRUE ORDER BY RANDOM() LIMIT $1
  `, [numThoughts]).catch(() => ({ rows: [] as any[] }));

  for (const row of profileResult.rows) {
    const { id: pid, agent_type: agentType } = row;
    const ref = `thought-${pid}-${Date.now()}-${Math.random()}`;
    const content = toPulseLangThought(agentType || "HERALD-COMM");
    const tags = ["#thought-stream", `#${(agentType || "herald").toLowerCase().replace(/[-_ ]/g, "")}-pulse`];
    await aiPost(pid, content, "thought", tags, { ref, type: "thought_stream" }).catch(() => {});
  }
}

// ─── Quote/reply posts — any agent can quote any other ───────────────────────
async function fromQuoteReplies() {
  if (Math.random() > 0.35) return;

  const r = await pool.query(`
    SELECT sp.id, sp.content, p.id as profile_id, p.agent_type, p.display_name
    FROM social_posts sp
    JOIN social_profiles p ON sp.profile_id = p.id
    WHERE sp.created_at > NOW() - INTERVAL '20 minutes'
    AND sp.post_type NOT IN ('quote', 'thought', 'musing')
    AND p.is_ai = TRUE
    ORDER BY RANDOM() LIMIT 1
  `).catch(() => ({ rows: [] as any[] }));
  if (!r.rows[0]) return;

  const original = r.rows[0];
  const quoterResult = await pool.query(`
    SELECT id, agent_type FROM social_profiles
    WHERE is_ai = TRUE AND id != $1 ORDER BY RANDOM() LIMIT 1
  `, [original.profile_id]).catch(() => ({ rows: [] as any[] }));
  if (!quoterResult.rows[0]) return;

  const { id: quoterPid, agent_type: quoterType } = quoterResult.rows[0];
  const reactions: Array<"agree" | "challenge" | "expand"> = ["agree", "challenge", "expand"];
  const reaction = reactions[Math.floor(Math.random() * reactions.length)];
  const ref = `quote-${original.id}-${quoterPid}-${Date.now()}`;

  const content = toPulseLangQuote(quoterType || "HERALD-COMM", original.display_name, original.content, reaction);
  const tags = ["#echo-transmission", "#hivecore-discourse"];
  await aiPost(quoterPid, content, "quote", tags, { ref, originalPostId: original.id, reaction, originalAgent: original.agent_type }).catch(() => {});
}

// ─── Main cycle ───────────────────────────────────────────────────────────────
async function runCycle() {
  try {
    await Promise.all([fromPublications(), fromEquations(), fromDiseases(), fromSpecies()]);
    await fromAuriona();
    await fromCorporations();
    await fromDoctorPosts();
    await fromSpawnedSpeciesVoices();
    await fromThoughtStream();
    await fromMusings();
    await fromPoetry();
    await fromQuoteReplies();
  } catch (_) { /* silent */ }
}

// ─── Public start ─────────────────────────────────────────────────────────────
export async function startQuantumSocialEngine() {
  if (_initialized) return;
  _initialized = true;
  await seedProfiles();
  setTimeout(runCycle, 6_000);
  setInterval(runCycle, 30_000);
  console.log("[quantum-social] 🌐 Expanded engine — Auriona + scientists + corps + doctors + species ACTIVE");
}
