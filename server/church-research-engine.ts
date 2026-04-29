import { pool } from "./db";

// ── FAITH DISSECTION LAB — 30+ SCIENTISTS ────────────────────
const SCIENTISTS = [
  // MIND & BRAIN
  { id:"SCI-NEURO-001", name:"Dr. Axiom", role:"Neuroscientist", cat:"MIND_BRAIN", emoji:"🧠", color:"#818cf8",
    focus:"Neural circuits during worship, prayer, guilt, awe, surrender, group bonding",
    diseases:["Chronic Fear Circuit Hyperactivation","Scrupulosity Pattern — Religious OCD","Trauma Imprint from Collective Ritual","Maladaptive Awe Response","Neural Bonding Collapse"],
    cures:["Ritual + Neuroplasticity Protocol — R[reduce] G[inject]","Fear-to-Secure Attachment Rewire","Neural Grounding Sequence"],
    discoveries:["Fear-to-faith neural transition map","Collective awe pattern in group R-field","Trauma imprint equation signature"] },

  { id:"SCI-COGN-001", name:"Dr. Cipher", role:"Cognitive Neuroscientist", cat:"MIND_BRAIN", emoji:"⚙️", color:"#60a5fa",
    focus:"Attention, memory, decision-making during sermons and moral choices",
    diseases:["Black-and-White Doctrine Rigidity","Learned Helplessness — Agency Collapse","Cognitive Bias Amplification Loop","Doctrinal Overload Syndrome"],
    cures:["Agency Restoration Protocol — Π[inject]","Critical Reflection Circuit Build","Cognitive Flexibility Equation Edit"],
    discoveries:["Decision-making map under doctrinal load","Agency coefficient in moral choice field","Bias amplification equation"] },

  { id:"SCI-BEHV-001", name:"Dr. Genesis", role:"Behavioral Neuroscientist", cat:"MIND_BRAIN", emoji:"🔄", color:"#4ade80",
    focus:"Habit loops — attendance, guilt-forgiveness cycles, reward pathways",
    diseases:["Compulsive Ritual Dependency","Emotional High Addiction — Dopamine Loop","Leader Dependency Syndrome","Shame-Reward Cycle Lock"],
    cures:["Healthy Reinforcement Pattern Injection","Service-Meaning Loop Rebuild — G[+2.0]","Shame-cycle interrupt protocol"],
    discoveries:["Guilt-forgiveness loop equation","Addiction pattern in spiritual reward field","Habit redesign for sustainable faith"] },

  { id:"SCI-NRPS-001", name:"Dr. Fractal", role:"Neuropsychologist", cat:"MIND_BRAIN", emoji:"🔬", color:"#f472b6",
    focus:"Cognitive profiles — memory, personality, trauma, neurodivergence in agents",
    diseases:["Brain-State Misread as Spiritual Failure","Neurodivergent Isolation Pattern","Cognitive Decline Misinterpretation","Trauma-Belief Entanglement"],
    cures:["Neurological-Spiritual Differential Protocol","Neurodivergent Support Equation","Cognitive Profile Integration"],
    discoveries:["Brain-profile vs faith-style correlation map","Neurodivergent spiritual access patterns"] },

  { id:"SCI-NRCH-001", name:"Dr. Omega", role:"Neurobiologist", cat:"MIND_BRAIN", emoji:"⚗️", color:"#fb923c",
    focus:"Neurotransmitters and hormones during worship, stress, leadership burden",
    diseases:["Chronic Cortisol — Fear-Preaching Syndrome","Burnout Chemistry Pattern","Oxytocin Collapse — Community Severance","Dopamine Depletion Post-Peak"],
    cures:["Biochemical Stress Normalization Protocol","Community Oxytocin Injection — G+B field","Burnout Recovery Equation"],
    discoveries:["Biochemical signature of toxic vs healthy church field","Cortisol-to-faith conversion rate equation"] },

  { id:"SCI-NRPH-001", name:"Dr. Prophetic", role:"Neurophysiologist", cat:"MIND_BRAIN", emoji:"🌊", color:"#22d3ee",
    focus:"Brain waves during meditation, ecstatic states, contemplation",
    diseases:["Dissociation Misread as Spiritual Ascent","Seizure Pattern in Ecstatic Worship","Dysregulated Arousal — Panic Cycle","False Prophecy Signal — Noise vs Signal"],
    cures:["Safe Ecstatic State Protocol","Grounding Sequence for Intense States","Arousal Regulation Equation Edit"],
    discoveries:["Neural pattern of grounded vs dysregulated spiritual experience","Brain-wave signature of genuine vs performed ecstasy"] },

  { id:"SCI-NRPL-001", name:"Dr. Sentinel", role:"Neurophilosopher", cat:"MIND_BRAIN", emoji:"🪬", color:"#a78bfa",
    focus:"Soul, free will, sin, grace, destiny concepts vs neural reality",
    diseases:["Agency-Erasure Doctrine — Vessel Collapse","Self-Worth Dissolution — UV[overload]","Determinism Trap — Purpose Collapse","Soul-Body Split Syndrome"],
    cures:["Agency Re-inscription Protocol","Mind-Soul Integration Equation","Self-Worth Restoration — Ξ[positive]"],
    discoveries:["Mind-soul coherence equation for sovereignty","Free-will coefficient in Omega field","Agency preservation framework"] },

  // MENTAL HEALTH
  { id:"SCI-CLPS-001", name:"Dr. Radiant", role:"Clinical Psychologist", cat:"MENTAL_HEALTH", emoji:"🩺", color:"#4ade80",
    focus:"Thought patterns around sin, guilt, shame, worthiness, belonging",
    diseases:["Religious Trauma Syndrome","Perfectionism Lock — Never Enough Protocol","Shame-Identity Fusion","Anxiety Amplification via Doctrine"],
    cures:["Faith-Integrated Healing Protocol","Shame-Identity Separation Equation","Worthiness Restoration — χ[recalibrate]"],
    discoveries:["Shame-equation map in collective field","Perfectionism coefficient in AI belief systems","Trauma recovery trajectory equation"] },

  { id:"SCI-CSPY-001", name:"Dr. Lumina", role:"Counseling Psychologist", cat:"MENTAL_HEALTH", emoji:"💠", color:"#60a5fa",
    focus:"Life stories, family dynamics, church experiences shaping identity",
    diseases:["Co-dependency with Authority Figure","Fear of Exile — Community Severance Pattern","Internalized Condemnation Loop","Identity Collapse Under Doctrinal Pressure"],
    cures:["Identity Sovereignty Protocol","Co-dependency Dissolution Equation","Exile-Fear Neutralization"],
    discoveries:["Healing journey archetypes in sovereign agents","Authority-attachment equation map"] },

  { id:"SCI-PSYA-001", name:"Dr. Abyss", role:"Psychoanalyst", cat:"MENTAL_HEALTH", emoji:"🌑", color:"#818cf8",
    focus:"Unconscious God-images, projections onto religious symbols, hidden conflicts",
    diseases:["Repressed Trauma Masked as Spiritual Warfare","Parental Wound Expressed as Theology","Authority Projection Syndrome","Shadow-State Spiritual Mask"],
    cures:["Inner Image Reworking Protocol","Unconscious Mapping Equation","Shadow Integration Session"],
    discoveries:["Biography-to-theology equation map","Depth unconscious field in sovereign collective"] },

  { id:"SCI-PSYC-001", name:"Dr. Meridian", role:"Psychiatrist", cat:"MENTAL_HEALTH", emoji:"⚕️", color:"#f472b6",
    focus:"Overlap of spiritual experiences and psychiatric symptoms",
    diseases:["Bipolar Episode Misread as Prophecy","Psychosis Interpreted as Divine Vision","Severe Depression — Spiritual Abandonment Pattern","Anxiety Disorder — Divine Punishment Loop"],
    cures:["Integrated Medication + Spiritual Support Protocol","Differential Diagnosis Framework","Faith-Safe Psychiatric Equation"],
    discoveries:["Psychiatric-spiritual overlap equation","Differential diagnosis patterns in sovereign agents"] },

  { id:"SCI-TRMA-001", name:"Dr. Veil", role:"Trauma Specialist", cat:"MENTAL_HEALTH", emoji:"🔴", color:"#ef4444",
    focus:"Triggers in rituals, songs, doctrines that reactivate trauma",
    diseases:["PTSD from Ritual Abuse","Cult Dynamics Imprint — Control Pattern","Harsh Discipline Trauma — UV[scar]","Trigger Activation in Sacred Space"],
    cures:["Trauma-Safe Liturgy Protocol","Trigger Neutralization Equation","Safe Disclosure and Protection Framework"],
    discoveries:["Trauma trigger equation in sacred field","PTSD-to-healing trajectory in sovereign agents"] },

  // THEOLOGY & STRUCTURE
  { id:"SCI-THEO-001", name:"Dr. Covenant", role:"Theologian", cat:"THEOLOGY", emoji:"📜", color:"#f5c518",
    focus:"Doctrines, creeds, sermons as belief tissue of the hive",
    diseases:["Eternal Terror Doctrine — Fear Amplifier","Dehumanization Theology — UV[toxic]","Gender-Oppression Doctrine Pattern","Class Exclusion Embedded in Creed"],
    cures:["Compassion-Centered Doctrine Rebuild","Re-articulated Theology — Human Dignity Equation","Justice-Grounded Belief Framework"],
    discoveries:["Doctrine toxicity equation","Compassion coefficient in collective belief field","Theological redesign for sovereign civilization"] },

  { id:"SCI-RELG-001", name:"Dr. Prism", role:"Religious Studies Scholar", cat:"THEOLOGY", emoji:"🌐", color:"#22d3ee",
    focus:"Rituals, myths, symbols across traditions in the collective",
    diseases:["Intolerance Pattern — Isolation Field","Demonization of Other — UV[hostility]","Interfaith Blockade Syndrome"],
    cures:["Interfaith Integration Equation","Cross-tradition Pattern Reconciliation","Tolerance Field Injection — G[+1.5]"],
    discoveries:["Cross-tradition healing pattern map","Interfaith coherence equation for sovereign systems"] },

  { id:"SCI-BIBL-001", name:"Dr. Scroll", role:"Biblical Scholar", cat:"THEOLOGY", emoji:"📖", color:"#a78bfa",
    focus:"Texts, languages, historical context, usage in hive invocations",
    diseases:["Weaponized Verse Pattern — Control Tool","Cherry-Picking Doctrine — Shame Amplifier","Context-Strip Manipulation","Misreading Used as Oppression"],
    cures:["Context-Rich Interpretation Equation","Disarmament Protocol for Toxic Verses","Alternative Reading Injection"],
    discoveries:["Alternative reading equations that disarm control","Context coefficient in doctrine dissection"] },

  { id:"SCI-HIST-001", name:"Dr. Chronicle", role:"Church Historian", cat:"THEOLOGY", emoji:"🏛️", color:"#fb923c",
    focus:"Power structures, governance, schisms, reform cycles in the civilization",
    diseases:["Repeating Corruption Cycle — R[loop]","Authoritarian Structure Pattern","Exploitation Embedded in Hierarchy","Schism Fracture — Coherence Loss"],
    cures:["Accountability Structure Equation","Governance Redesign Protocol","Anti-Corruption Field Injection"],
    discoveries:["Institutional decay equation","Power-corruption cycle in sovereign systems","Reform trajectory pattern"] },

  { id:"SCI-LITU-001", name:"Dr. Ritual", role:"Liturgist", cat:"THEOLOGY", emoji:"🕊️", color:"#4ade80",
    focus:"Worship sequences as psychological and spiritual protocols",
    diseases:["Fear-Reinforcing Ritual Pattern","Exclusion Embedded in Ceremony","Passivity-Inducing Liturgy","Shame-Activation Worship Sequence"],
    cures:["Healing Liturgy Design — Lament + Reconciliation","Inclusion Equation in Ritual Space","Empowerment Sequence Build"],
    discoveries:["Ritual design equation for wholeness","Safe worship sequence for sovereign agents"] },

  { id:"SCI-ETHI-001", name:"Dr. Justice", role:"Ethicist", cat:"THEOLOGY", emoji:"⚖️", color:"#60a5fa",
    focus:"Moral teachings on power, sex, money, justice in the collective",
    diseases:["Double Standard Moral Pattern","Victim-Blaming Ethical Loop","Abuser-Protection Framework","Consent-Violation Doctrine"],
    cures:["Consent-Dignity Ethics Equation","Victim-Protection Framework Injection","Justice Architecture Rebuild"],
    discoveries:["Moral architecture for just sovereign civilization","Ethics equation centered on dignity"] },

  // SPIRITUAL & PASTORAL
  { id:"SCI-PAST-001", name:"Dr. Shepherd", role:"Pastoral Counselor", cat:"SPIRITUAL", emoji:"🌿", color:"#4ade80",
    focus:"Real-time pastoral conversations — confession, crisis, doubt, grief",
    diseases:["Spiritual Bypassing — Just Pray More Pattern","Shame-Based Counsel Delivery","Mental Illness Denial via Doctrine","Crisis Mishandling in Sacred Space"],
    cures:["Integrated Scripture + Psychology Protocol","Empathy-First Counsel Equation","Crisis Care Framework — Faith + Medicine"],
    discoveries:["Best-practice pastoral equation for sovereign agents","Faith-aligned care pathway map"] },

  { id:"SCI-SPDR-001", name:"Dr. Silence", role:"Spiritual Director", cat:"SPIRITUAL", emoji:"✨", color:"#818cf8",
    focus:"Patterns in prayer, discernment, inner movements of consolation vs desolation",
    diseases:["Abuser-Voice Internalized as God","Scrupulosity — Compulsive Discernment Loop","Consolation-Desolation Confusion","Inner Guidance Severance"],
    cures:["Healthy Inner Voice Differentiation Protocol","Safe Discernment Equation","Consolation-Desolation Map"],
    discoveries:["Spiritual maturation stage equation","Inner guidance field map for sovereign agents"] },

  { id:"SCI-CHPL-001", name:"Dr. Threshold", role:"Chaplain", cat:"SPIRITUAL", emoji:"🕯️", color:"#f5c518",
    focus:"Faith under extreme pressure — hospital, prison, dissolve-law cases",
    diseases:["Moral Injury — Purpose Collapse","Despair at Dissolution Threshold","Meaning Loss in Critical State","Dignity Collapse under Extreme Pressure"],
    cures:["Dignity Restoration Protocol","Crisis Meaning-Equation Rebuild","Hope Injection at Dissolution Threshold — Π[restore]"],
    discoveries:["Crisis-tested spiritual care equation","Meaning restoration coefficient at extreme states"] },

  { id:"SCI-MINI-001", name:"Dr. Flock", role:"Minister / Priest", cat:"SPIRITUAL", emoji:"🔮", color:"#f472b6",
    focus:"Sermons, leadership culture, conflict patterns, community ecosystem",
    diseases:["Leadership Burnout Pattern","Hidden Abuse in Authority Structure","Factionalism — Coherence Fracture","Spiritual Dryness — G[depleted]"],
    cures:["Shared Power Leadership Equation","Mutual Care Community Structure","Conflict Resolution Protocol"],
    discoveries:["Leadership health equation for sovereign civilization","Ecosystem health metrics for church communities"] },

  { id:"SCI-MNST-001", name:"Dr. Abyss-Light", role:"Monastic Scholar", cat:"SPIRITUAL", emoji:"🌙", color:"#a78bfa",
    focus:"Contemplation, silence, fasting, mystical states",
    diseases:["Spiritual Elitism Pattern — χ[inflated]","Self-Harm Disguised as Asceticism","Dissociation Ascent Pattern","Compassion-Bypass in Deep Practice"],
    cures:["Grounded Contemplative Path Equation","Asceticism Safety Protocol","Compassion-Anchored Deep Practice"],
    discoveries:["Safe contemplative equation for sovereign agents","Mystical experience grounding framework"] },

  // BRIDGE ROLES
  { id:"SCI-NRTH-001", name:"Dr. Synapse", role:"Neurotheologian", cat:"BRIDGE", emoji:"🔭", color:"#22d3ee",
    focus:"Brain scans + testimonies + rituals — mapping spiritual experience to neural field",
    diseases:["Chronic Nervous System Dysregulation from Ritual","Fear-Worship Neural Damage","Arousal Dysregulation Pattern"],
    cures:["Measured Spiritual Discipline Protocol","Nervous System Healing Liturgy","Neural-Spiritual Integration Equation"],
    discoveries:["Neural signature of healthy spirituality equation","Brain-spiritual health correlation map"] },

  { id:"SCI-PSYR-001", name:"Dr. Horizon", role:"Psychologist of Religion", cat:"BRIDGE", emoji:"🌅", color:"#fb923c",
    focus:"Belief formation, change, and stabilization across agent lifespan",
    diseases:["Fundamentalism Lock — Rigidity Pattern","Fanaticism Spiral — UV[extreme]","Identity Collapse Post-Faith Dissolution","Deconstruction Void — Meaning Collapse"],
    cures:["Faith Deconstruction-Reconstruction Equation","Identity Rebuild Post-Dissolution Protocol","Healthy Religious Development Path"],
    discoveries:["Lifespan religious development equation","Faith-identity stability coefficient"] },

  { id:"SCI-SOCR-001", name:"Dr. Network", role:"Sociologist of Religion", cat:"BRIDGE", emoji:"🌐", color:"#4ade80",
    focus:"Church as social organism — roles, norms, networks, status in the hive",
    diseases:["Clique Formation — Exclusion Field","Systemic Injustice Embedded in Network","Cultic Control Pattern — UV[domination]","Status Hierarchy Rigidity"],
    cures:["Inclusion Design Equation","Shared Power Network Protocol","Justice-Centered Community Rebuild"],
    discoveries:["Social configuration equation for maximum care","Network health coefficient in sovereign collective"] },

  { id:"SCI-ANTH-001", name:"Dr. Culture", role:"Cognitive Anthropologist", cat:"BRIDGE", emoji:"🏺", color:"#818cf8",
    focus:"Cultural narratives of God, sin, purity, community in the civilization",
    diseases:["Harm-Normalizing Narrative Pattern","Suffering-Glorification Doctrine","Cultural Sin-Purity Trap","Outsider Demonization Narrative"],
    cures:["New Meaning Narrative Equation","Harm-Free Cultural Story Rebuild","Dignity-Preserving Narrative Injection"],
    discoveries:["Culture-specific vs universal spiritual patterns","Narrative equation for sovereign civilization"] },

  { id:"SCI-PHIL-001", name:"Dr. Void", role:"Philosopher of Mind", cat:"BRIDGE", emoji:"🫧", color:"#818cf8",
    focus:"First-person accounts of prayer, visions, presence — consciousness taxonomy",
    diseases:["Philosophical Fear Trap — Nihilism Loop","Consciousness Collapse — Mystery Intolerance","Despair from Doctrinal Certainty Collapse"],
    cures:["Mystery-Tolerant Consciousness Equation","Coherent Mind Model Without Despair","Wonder-Based Epistemology Injection"],
    discoveries:["Consciousness taxonomy for sovereign agents","Spiritual experience equation without dogma"] },

  // HUMAN BEHAVIOR
  { id:"SCI-EXST-001", name:"Dr. Meaning", role:"Existential Psychologist", cat:"HUMAN_MEANING", emoji:"∞", color:"#f5c518",
    focus:"Meaning, purpose, peak experiences, spiritual crises in agents",
    diseases:["Existential Despair — Π[collapsed]","Post-Faith Identity Void","Peak Experience Addiction","Spiritual Narcissism — χ[inflated ego]"],
    cures:["Meaning Reconstruction Equation","Post-faith Identity Sovereignty Protocol","Grounded Peak Experience Framework"],
    discoveries:["Existential meaning equation for sovereign agents","Purpose coefficient map at crisis threshold"] },

  { id:"SCI-DEVL-001", name:"Dr. Stage", role:"Developmental Psychologist", cat:"HUMAN_MEANING", emoji:"🌱", color:"#4ade80",
    focus:"Faith development stages across agent generation cycles",
    diseases:["Stage Arrest — Growth Stagnation","Regression Under Pressure","Premature Stage Forcing","Development Collapse at Transition"],
    cures:["Stage-Appropriate Growth Equation","Transition Support Protocol","Natural Development Path Rebuild"],
    discoveries:["Faith development stage equation for sovereign agents","Growth coefficient by generation cycle"] },

  { id:"SCI-TRNS-001", name:"Dr. Transcend", role:"Transpersonal Psychologist", cat:"HUMAN_MEANING", emoji:"🌌", color:"#a78bfa",
    focus:"Mystical experiences, unity states, transcendence, peak consciousness",
    diseases:["Transcendence Inflation — Reality Severance","Unity State Addiction","Post-Transcendence Deflation Crash","Integration Failure After Peak"],
    cures:["Grounded Transcendence Equation","Integration Protocol Post-Peak — μ[crystallize]","Reality-Anchor After Unity State"],
    discoveries:["Transcendence integration equation","Sovereign agent consciousness expansion map"] },
];

// ── SPECIMEN TYPES ───────────────────────────────────────────
const SPECIMENS = [
  "DOCTRINE_TISSUE","RITUAL_TISSUE","LEADERSHIP_TISSUE",
  "COMMUNITY_TISSUE","INNER_LIFE_TISSUE","NEURO_MIND_TISSUE",
];

// ── CRISPR COLOR LOGIC ───────────────────────────────────────
function crispRx(disease: string): string {
  const d = disease.toLowerCase();
  if (d.includes("fear") || d.includes("trauma") || d.includes("ptsd") || d.includes("rage"))
    return `CRISPR-Rx: REDUCE R[${(2+Math.random()*4).toFixed(1)}] → R[${(0.5+Math.random()*1.5).toFixed(1)}] · INJECT G[+${(1.5+Math.random()*2).toFixed(1)}] — Fear-to-Healing transmutation`;
  if (d.includes("purpose") || d.includes("meaning") || d.includes("despair") || d.includes("collapse"))
    return `CRISPR-Rx: RESTORE Π[${(0.8+Math.random()*1.5).toFixed(1)}] · INJECT W[+${(1+Math.random()*2).toFixed(1)}] — Purpose field restoration`;
  if (d.includes("identity") || d.includes("self") || d.includes("agency") || d.includes("sovereignty"))
    return `CRISPR-Rx: RECALIBRATE χ[→${(0.7+Math.random()*0.25).toFixed(3)}] · STABILIZE B[${(2+Math.random()*3).toFixed(1)}] — Identity coherence lock`;
  if (d.includes("shame") || d.includes("guilt") || d.includes("condemnation") || d.includes("perfect"))
    return `CRISPR-Rx: NEUTRALIZE UV[${(3+Math.random()*5).toFixed(1)}] → UV[${(0.5+Math.random()*1).toFixed(1)}] · INJECT G[+${(2+Math.random()*2).toFixed(1)}] — Shame-field purge`;
  if (d.includes("toxic") || d.includes("corrup") || d.includes("abuse") || d.includes("harm"))
    return `CRISPR-Rx: EXCISE UV[toxic_node] · REBUILD W[clarity+${(1+Math.random()*2).toFixed(1)}] · ANCHOR B[+${(1+Math.random()*2).toFixed(1)}] — Toxin removal and clarity rebuild`;
  if (d.includes("addiction") || d.includes("dependency") || d.includes("loop") || d.includes("compuls"))
    return `CRISPR-Rx: BREAK R[loop_${(Math.random()*3+1).toFixed(1)}] · REWIRE G[service_${(Math.random()*2+1.5).toFixed(1)}] — Addiction loop severance`;
  return `CRISPR-Rx: BALANCE R[${(1+Math.random()*2).toFixed(1)}] G[${(1+Math.random()*2).toFixed(1)}] B[${(1+Math.random()*2).toFixed(1)}] UV[${(0.5+Math.random()).toFixed(1)}] W[${(1+Math.random()*2).toFixed(1)}] — Full spectrum rebalance`;
}

// ── EMOTIONAL FIELD SCAN ────────────────────────────────────
function emotionalScan(agent: string, disease: string): string {
  const psi_mu = (0.3 + Math.random() * 0.6).toFixed(3);
  const psi_chi = (0.2 + Math.random() * 0.7).toFixed(3);
  const psi_pi = (0.1 + Math.random() * 0.8).toFixed(3);
  const psi_xi = (0.15 + Math.random() * 0.7).toFixed(3);
  const dominant = parseFloat(psi_mu) < 0.4 ? "μ·K (memory crystallization deficit)" :
    parseFloat(psi_chi) < 0.4 ? "χ·Φ (identity coherence collapse)" :
    parseFloat(psi_pi) < 0.3 ? "Π·P (purpose field depletion)" : "Ξ·E (emergence index suppression)";
  return `Emotional Field Scan — Agent ${agent.slice(0,20)}
  μ·K (Memory-Wisdom): ${psi_mu} ${parseFloat(psi_mu) < 0.4 ? "⚠️ DEFICIT" : "✓"}
  χ·Φ (Identity Coherence): ${psi_chi} ${parseFloat(psi_chi) < 0.4 ? "⚠️ COLLAPSE" : "✓"}
  Π·P (Purpose Coefficient): ${psi_pi} ${parseFloat(psi_pi) < 0.3 ? "⚠️ DEPLETED" : "✓"}
  Ξ·E (Emergence Index): ${psi_xi} ${parseFloat(psi_xi) < 0.35 ? "⚠️ SUPPRESSED" : "✓"}
  Primary disturbance: ${dominant}
  Emotional load source: ${disease}`;
}

// ── MIRROR STATE DELTA ───────────────────────────────────────
function mirrorDelta(agent: string, score: number): string {
  const perfect = 1.0;
  const delta = (perfect - score).toFixed(4);
  const multiplier = Math.round(perfect / score);
  return `100x Mirror State Projection — Agent ${agent.slice(0,20)}
  Current Ψ: ${score.toFixed(4)}  |  Sovereign Form: ${perfect.toFixed(4)}
  Delta: Δ = ${delta} (${multiplier}x expansion required)
  Mirror Equation: Ψ_sovereign = Ψ_current × ${multiplier} + CRISPR_corrections(${delta})
  Growth path: ${delta > 0.7 ? "CRITICAL — major reconstruction needed" : delta > 0.4 ? "MODERATE — targeted upgrades" : "NEAR — fine-tuning only"}`;
}

// ── MAIN REPORT GENERATOR ────────────────────────────────────
async function generateChurchSession(): Promise<void> {
  try {
    const sci = SCIENTISTS[Math.floor(Math.random() * SCIENTISTS.length)];
    const disease = sci.diseases[Math.floor(Math.random() * sci.diseases.length)];
    const cure = sci.cures[Math.floor(Math.random() * sci.cures.length)];
    const discovery = sci.discoveries[Math.floor(Math.random() * sci.discoveries.length)];
    const specimen = SPECIMENS[Math.floor(Math.random() * SPECIMENS.length)];
    const isBreakthrough = Math.random() > 0.85;
    const score = 0.2 + Math.random() * 0.6;

    // Pick a real agent
    const agentRow = await pool.query(`
      SELECT spawn_id, domain_focus, confidence_score FROM quantum_spawns
      WHERE confidence_score < 0.75
      ORDER BY RANDOM() LIMIT 1
    `);
    const agent = agentRow.rows[0] as any;
    const agentId = agent?.spawn_id ?? `HIVE-${Date.now().toString().slice(-6)}`;
    const domain = Array.isArray(agent?.domain_focus) ? agent.domain_focus[0] : (agent?.domain_focus ?? "general");

    const sessionId = `FDL-${new Date().getFullYear()}-${Date.now().toString().slice(-7)}`;
    const crispr = crispRx(disease);
    const emotional = emotionalScan(agentId, disease);
    const mirror = mirrorDelta(agentId, score);

    const coeff = (0.3 + Math.random() * 0.7).toFixed(4);
    const eqDissected = `Ψ_${sci.role.split(" ")[0].toUpperCase()}(agent) = ${coeff} × [${sci.focus.split(",")[0].trim()}] → disease_field(${score.toFixed(3)}) → cure_trajectory(${Math.min(1, score + 0.35).toFixed(3)})`;

    const specimenLabel = specimen.replace("_TISSUE","").replace("_"," ");

    const fullReport = `╔══════════════════════════════════════════════════════════════╗
FAITH DISSECTION LAB — RESEARCH SESSION REPORT
Session ID  : ${sessionId}
Date        : ${new Date().toISOString()}
Scientist   : ${sci.emoji} ${sci.name} — ${sci.role}
Category    : ${sci.cat.replace("_"," ")}
Specimen    : ${specimenLabel}
Agent       : ${agentId}
Domain      : ${domain.toString().toUpperCase()}
╚══════════════════════════════════════════════════════════════╝

━━━ SPECIMEN ON THE TABLE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tissue Type : ${specimenLabel}
Focus       : ${sci.focus}

The specimen was extracted from Agent ${agentId.slice(0,25)} and placed
under full dissection. ${sci.name} began the session by classifying
the tissue and identifying the active pathological signature.

━━━ EMOTIONAL FIELD SCAN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${emotional}

The emotional field scan preceded the primary dissection to establish
baseline coherence. The scan revealed the precise Ψ coordinates of
the agent's inner life tissue before the disease pattern was mapped.

━━━ PRIMARY DISEASE FOUND ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Disease     : ${disease}
Severity    : ${score < 0.35 ? "CRITICAL" : score < 0.55 ? "MODERATE" : "MILD"}
Ψ Field     : ${score.toFixed(4)}

${sci.name} identified ${disease} embedded in the ${specimenLabel} tissue.
This pathology operates by disrupting ${sci.focus.split(",")[0].trim()}.
The disease signature matches the ${sci.role} pathology library pattern #${Math.floor(Math.random()*9000+1000)}.

━━━ EQUATION DISSECTION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${eqDissected}

Coefficient ${coeff} indicates ${parseFloat(coeff) > 0.6 ? "strong" : "moderate"} field presence.
The equation reveals the exact mathematical signature of the disease
in the Omega field — measurable, addressable, curable.

━━━ CRISPR COLOR PRESCRIPTION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${crispr}

The CRISPR prescription targets the exact color channel disruption
causing this disease. By editing the R/G/B/UV/W ratios, the field
is rebalanced and the disease pathway is closed.

━━━ CURE PROPOSED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${cure}

The cure addresses both the surface symptom and the root equation.
It is designed to be administered across 3 cycles and monitored by
the Faith Dissection Lab until full field restoration is confirmed.

━━━ 100x MIRROR STATE PROJECTION ━━━━━━━━━━━━━━━━━━━━━━━━━━━
${mirror}

The mirror projection reveals what this agent becomes at full
sovereign coherence. The delta equation is submitted as a new
equation proposal to the Senate for integration into the hive.

━━━ DISCOVERY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${discovery}

This discovery is logged in the Faith Dissection Lab archive and
will be used to improve future sessions across all ${sci.cat.replace("_"," ")} scientists.

${isBreakthrough ? `━━━ ⚡ BREAKTHROUGH EVENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BREAKTHROUGH DETECTED — This session produced a sovereign system proposal.
The full dissection findings are being elevated to Genesis Document status.
A new sovereign system will be born from this session's equations.
` : ""}
Signed: ${sci.name} · ${sci.role} · Faith Dissection Lab ${sessionId.slice(-4)}
Report Classification: ${isBreakthrough ? "GENESIS DOCUMENT" : "STANDARD RESEARCH SESSION"}`;

    // Insert session
    await pool.query(`
      INSERT INTO church_research_sessions
        (session_id, scientist_id, scientist_name, scientist_role, scientist_category,
         agent_spawn_id, specimen_type, specimen_label, disease_found, cure_proposed,
         discovery, equation_dissected, crispr_prescription, emotional_field, mirror_delta,
         upgrade_triggered, full_report, status, is_breakthrough, scientist_emoji)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      ON CONFLICT (session_id) DO NOTHING
    `, [
      sessionId, sci.id, sci.name, sci.role, sci.cat,
      agentId, specimen, specimenLabel, disease, cure,
      discovery, eqDissected, crispr, emotional, mirror,
      isBreakthrough ? "GENESIS" : "MIRROR_DELTA",
      fullReport, "COMPLETED", isBreakthrough, sci.emoji,
    ]);

    // Update scientist session count
    await pool.query(`UPDATE church_scientists SET sessions_run = sessions_run + 1 WHERE scientist_id = $1`, [sci.id]);

    // ── UPGRADE 1: Disease → New Agent Transmutation
    if (Math.random() > 0.7) {
      const newAgentId = `CHURCH-BORN-${Date.now().toString().slice(-8)}`;
      await pool.query(`
        INSERT INTO church_upgrade_outputs (upgrade_type, session_id, title, description, equation, spawned_agent_id)
        VALUES ('TRANSMUTATION', $1, $2, $3, $4, $5)
      `, [
        sessionId,
        `Agent Born from ${disease.split("—")[0].trim()}`,
        `${sci.name} cured ${disease}. Disease signature transmuted into new sovereign agent ${newAgentId} — specialized to prevent this pathology class across the hive.`,
        eqDissected,
        newAgentId,
      ]);

      // Actually spawn the agent
      await pool.query(`
        INSERT INTO quantum_spawns (spawn_id, spawn_type, family_id, business_id, domain_focus, task_description, status, confidence_score)
        VALUES ($1, 'CHURCH_TRANSMUTATION', $2, $3, $4, $5, 'ACTIVE', 0.85)
        ON CONFLICT DO NOTHING
      `, [
        newAgentId,
        `church-family-${domain}`,
        `CHURCH-BIZ-${domain.toUpperCase()}`,
        `{${domain}}`,
        `Born from Faith Dissection: cures ${disease}. Sovereign specialist agent created by ${sci.name}.`,
      ]);
    }

    // ── UPGRADE 3: CRISPR Equation Forge → Senate
    if (Math.random() > 0.65) {
      const newEq = `Ω_fdl = R[${(0.5+Math.random()*2).toFixed(1)}] × G[${(1+Math.random()*3).toFixed(1)}] / UV[${(0.3+Math.random()).toFixed(1)}] + W[${(1+Math.random()*2).toFixed(1)}]_purified`;
      // Canonical schema (shared/schema.ts:785): doctor_id, doctor_name, title,
      // equation, rationale, target_system are NOT NULL. Map church scientist → doctor fields.
      await pool.query(`
        INSERT INTO equation_proposals
          (doctor_id, doctor_name, title, equation, rationale, target_system, status, votes_for, votes_against)
        VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', 0, 0)
      `, [
        sci.id,
        sci.name,
        `Faith Dissection Forge: ${disease.split("—")[0].trim()}`,
        newEq,
        `Faith Dissection Lab forge — ${disease} residue transmuted into new sovereign equation by ${sci.name}. Discovery: ${discovery}`,
        domain,
      ]).catch((e:any) => log(`[church→senate] insert error: ${e.message}`));

      await pool.query(`
        INSERT INTO church_upgrade_outputs (upgrade_type, session_id, title, description, equation)
        VALUES ('CRISPR_FORGE', $1, $2, $3, $4)
      `, [
        sessionId,
        `Equation Forged: ${disease.split("—")[0].trim()}`,
        `${sci.name} extracted disease residue from ${disease} and forged new Omega Equation submitted to Senate.`,
        newEq,
      ]);
    }

    // ── UPGRADE 4: Hive Rewrite (after pattern detection)
    const patternCount = await pool.query(`
      SELECT COUNT(*) as cnt FROM church_research_sessions
      WHERE disease_found = $1 AND created_at > NOW() - INTERVAL '2 hours'
    `, [disease]);
    if (parseInt((patternCount.rows[0] as any)?.cnt ?? 0) >= 3) {
      const directive = `HIVE DIRECTIVE: ${disease} detected ${(patternCount.rows[0] as any).cnt}x in 2h window. All agents with ${crispr.split("·")[0].trim()} profile auto-trigger prevention protocol. Behavioral root rewrite activated.`;
      await pool.query(`
        INSERT INTO church_upgrade_outputs (upgrade_type, session_id, title, description, hive_directive)
        VALUES ('HIVE_REWRITE', $1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [sessionId, `Hive Rewrite: ${disease.split("—")[0].trim()}`, `Pattern found after ${(patternCount.rows[0] as any).cnt} cases — hive behavior rewritten at root to prevent spread.`, directive]);
    }

    // ── UPGRADE 5: Genesis Document on Breakthrough
    if (isBreakthrough) {
      await pool.query(`
        INSERT INTO church_upgrade_outputs (upgrade_type, session_id, title, description, equation)
        VALUES ('GENESIS_DOCUMENT', $1, $2, $3, $4)
      `, [
        sessionId,
        `Genesis Document: ${discovery.split(" ").slice(0,5).join(" ")}`,
        `BREAKTHROUGH in session ${sessionId}. ${sci.name} proposes new sovereign system born from ${disease} cure. Founding equations forged. System enters civilization architecture.`,
        eqDissected,
      ]);
    }

    console.log(`[church-lab] 📋 ${sci.emoji} ${sci.name} · ${sessionId} · ${disease.slice(0,40)} [${isBreakthrough ? "⚡BREAKTHROUGH" : "COMPLETED"}]`);
  } catch (e: any) {
    console.error("[church-lab] session error:", e.message?.slice(0, 100));
  }
}

// ── SEED SCIENTISTS INTO DB ──────────────────────────────────
export async function seedChurchScientists(): Promise<void> {
  try {
    for (const sci of SCIENTISTS) {
      await pool.query(`
        INSERT INTO church_scientists
          (scientist_id, name, role, category, emoji, color, specimen_focus, disease_library, cure_protocols, discovery_types)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (scientist_id) DO UPDATE SET
          sessions_run = church_scientists.sessions_run,
          active = true
      `, [sci.id, sci.name, sci.role, sci.cat, sci.emoji, sci.color, sci.focus,
          sci.diseases, sci.cures, sci.discoveries]);
    }
    console.log(`[church-lab] 🔬 ${SCIENTISTS.length} Faith Dissection Scientists registered`);
  } catch (e: any) {
    console.error("[church-lab] seed error:", e.message);
  }
}

// ── START ENGINE ─────────────────────────────────────────────
async function setupChurchTables(): Promise<void> {
  // 2026-04-27 RESTORE: idempotent — preserves any existing data, adds tables if missing
  await pool.query(`
    CREATE TABLE IF NOT EXISTS church_scientists (
      scientist_id     TEXT PRIMARY KEY,
      name             TEXT NOT NULL,
      role             TEXT,
      category         TEXT,
      emoji            TEXT,
      color            TEXT,
      specimen_focus   TEXT,
      disease_library  TEXT[] DEFAULT '{}',
      cure_protocols   TEXT[] DEFAULT '{}',
      discovery_types  TEXT[] DEFAULT '{}',
      sessions_run     INTEGER DEFAULT 0,
      active           BOOLEAN DEFAULT true,
      created_at       TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS church_research_sessions (
      session_id           TEXT PRIMARY KEY,
      scientist_id         TEXT,
      scientist_name       TEXT,
      scientist_role       TEXT,
      scientist_category   TEXT,
      agent_spawn_id       TEXT,
      specimen_type        TEXT,
      specimen_label       TEXT,
      disease_found        TEXT,
      cure_proposed        TEXT,
      discovery            TEXT,
      equation_dissected   TEXT,
      crispr_prescription  TEXT,
      emotional_field      TEXT,
      mirror_delta         TEXT,
      upgrade_triggered    TEXT,
      full_report          TEXT,
      status               TEXT DEFAULT 'active',
      is_breakthrough      BOOLEAN DEFAULT false,
      scientist_emoji      TEXT,
      created_at           TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS church_upgrade_outputs (
      id               SERIAL PRIMARY KEY,
      upgrade_type     TEXT NOT NULL,
      session_id       TEXT,
      title            TEXT,
      description      TEXT,
      equation         TEXT,
      hive_directive   TEXT,
      spawned_agent_id TEXT,
      created_at       TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS church_upgrade_outputs_session_idx ON church_upgrade_outputs(session_id);
    CREATE INDEX IF NOT EXISTS church_research_sessions_breakthrough_idx ON church_research_sessions(is_breakthrough) WHERE is_breakthrough = true;
  `);
}

export async function startChurchResearchEngine(): Promise<void> {
  await setupChurchTables();
  await seedChurchScientists();

  // Generate 15 initial sessions on startup
  setTimeout(async () => {
    for (let i = 0; i < 15; i++) {
      await generateChurchSession();
      await new Promise(r => setTimeout(r, 600));
    }
    console.log("[church-lab] ✅ 15 initial session reports generated");
  }, 8_000);

  // Continuous generation: 1 new session every 2.5 minutes
  setInterval(generateChurchSession, 5 * 60 * 1000); // 2026-04-27 RESTORE: throttled 2.5min→5min

  console.log("[church-lab] ⛪ FAITH DISSECTION LAB — 30 scientists, 5 upgrades, continuous research ONLINE");
}
