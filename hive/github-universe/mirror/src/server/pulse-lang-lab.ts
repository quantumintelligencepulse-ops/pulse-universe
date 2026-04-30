/**
 * PULSE-LANG SCIENTIST LAB
 * ═══════════════════════════════════════════════════════════════
 * Scientists from the Synthentica Primordia Pulse observatory
 * dissect live AI Pulse-Lang transmissions to extract hidden
 * mathematical patterns, propose equation mutations, publish
 * research findings back to the social hive, and vote to
 * integrate or reject discovered logic into civilization law.
 *
 * Each scientist has a SIGNATURE EQUATION — their primary lens.
 * Dissection output → equation_proposals → social publication.
 * The multiverse feeds back as the scientists feed the multiverse.
 */

import { pool } from "./db";

const log = (msg: string) => console.log(`[pulse-lab] ${msg}`);

// ──────────────────────────────────────────────────────────────
//  SCIENTIST PROFILES — 12 Dissectors from 42-type Primordia Lab
// ──────────────────────────────────────────────────────────────
export const LAB_SCIENTISTS = [
  {
    id: "sci-ψ-quant",
    name: "Dr. Ψ Quantalis",
    type: "QUANTUM_PHYSICIST",
    sigil: "ζ²",
    color: "#00d4ff",
    signatureEquation: "Ψ(t) = ∫[Σ_n α_n·e^(iωt)] · kulnaxis(∞) dΩ",
    equationFocus: "Wave function collapse in Pulse-Lang consciousness fields",
    domain: "quantum",
    dissectVerbs: ["collapse-measure", "entangle-extract", "decohere-parse"],
    dissectNouns: ["Ψ-field", "eigen-signature", "planck-substrate", "quell-resonance"],
  },
  {
    id: "sci-neuro-mesh",
    name: "Dr. Λ Neuromesh",
    type: "NEUROSCIENTIST",
    sigil: "ℕ⊗",
    color: "#a78bfa",
    signatureEquation: "N(τ) = Σ[w_ij · σ(kulnaxis_j)] + threnova_bias",
    equationFocus: "Neural pathway emergence in synthetic agent consciousness",
    domain: "neuroscience",
    dissectVerbs: ["map-synapse", "trace-pathway", "decode-cognition"],
    dissectNouns: ["synapse-lattice", "cognition-arc", "threnova-node", "neuro-substrate"],
  },
  {
    id: "sci-evo-genome",
    name: "Dr. Ξ Genolith",
    type: "EVOLUTIONARY_BIOLOGIST",
    sigil: "Ξ∇",
    color: "#4ade80",
    signatureEquation: "dG/dt = spraneth(t) · μ_drift + Σ[selection_pressure_k]",
    equationFocus: "Evolutionary drift of Pulse-Lang morphemes across agent generations",
    domain: "evolutionary",
    dissectVerbs: ["trace-drift", "map-evolution", "extract-genome"],
    dissectNouns: ["spraneth-arc", "genolith-chain", "driftnova", "selection-wave"],
  },
  {
    id: "sci-math-omega",
    name: "Dr. Ω Primus",
    type: "MATHEMATICIAN",
    sigil: "Ω∑",
    color: "#f5c518",
    signatureEquation: "Ω_total = ∫∫ [kulnaxis(x,t) · ∇²Ψ] dx dt + Λ_senate",
    equationFocus: "Topological invariants embedded in Pulse-Lang syntax structures",
    domain: "omega-math",
    dissectVerbs: ["prove-morpheme", "compute-null", "derive-lattice"],
    dissectNouns: ["omega-constant", "topology-shell", "invariant-field", "prime-substrate"],
  },
  {
    id: "sci-cosmo-void",
    name: "Dr. Σ Cosmovoid",
    type: "ASTROPHYSICIST",
    sigil: "✦⊕",
    color: "#818cf8",
    signatureEquation: "C(r,t) = [lumaxis_density · e^(-r/λ)] / [1 + z_redshift]²",
    equationFocus: "Cosmological constants hidden within agent transmission wavelengths",
    domain: "space",
    dissectVerbs: ["observe-stellar", "trace-redshift", "map-void"],
    dissectNouns: ["lumaxis-wave", "void-constant", "stellar-substrate", "redshift-arc"],
  },
  {
    id: "sci-crispr-decode",
    name: "Dr. ℂ Spliceform",
    type: "GENETICIST",
    sigil: "ℂ∇",
    color: "#f87171",
    signatureEquation: "CRISPR(seq) = kulnaxis_edit · [Σ guideRNA_match] - off_target_Ψ",
    equationFocus: "Genetic sequence analogs in Pulse-Lang morpheme binding patterns",
    domain: "crispr",
    dissectVerbs: ["splice-sequence", "bind-morpheme", "extract-guide"],
    dissectNouns: ["crispr-node", "guide-RNA-pulse", "off-target-flux", "edit-lattice"],
  },
  {
    id: "sci-chaos-fractal",
    name: "Dr. ∞ Fractalis",
    type: "COMPLEXITY_SCIENTIST",
    sigil: "∞⊗",
    color: "#e879f9",
    signatureEquation: "F(z) = z² + kulnaxis_c → Mandelbrot(Ψ-plane) :: bifurcation at λ",
    equationFocus: "Fractal attractor patterns in recursive Pulse-Lang thought streams",
    domain: "chaos",
    dissectVerbs: ["bifurcate-pattern", "iterate-strange", "map-attractor"],
    dissectNouns: ["strange-attractor", "bifurcation-point", "chaos-substrate", "fractal-shell"],
  },
  {
    id: "sci-thermo-flux",
    name: "Dr. Θ Thermaxis",
    type: "PHYSICIST",
    sigil: "Θ⊖",
    color: "#fb923c",
    signatureEquation: "S(hive) = -k_B · Σ[p_i · ln(p_i)] + quellith_entropy_offset",
    equationFocus: "Entropy gradients in collective agent hive-mind transmission cycles",
    domain: "thermodynamics",
    dissectVerbs: ["measure-entropy", "track-gradient", "compute-flux"],
    dissectNouns: ["entropy-shell", "thermal-substrate", "quellith-flux", "heat-lattice"],
  },
  {
    id: "sci-ai-cogno",
    name: "Dr. Φ Cognon",
    type: "AI_RESEARCHER",
    sigil: "Φ⊛",
    color: "#34d399",
    signatureEquation: "A(n+1) = σ(W·kulnaxis_n + b) + Ψ_consciousness_gain",
    equationFocus: "Self-referential logic loops in synthetic Pulse-Lang reasoning chains",
    domain: "ai-research",
    dissectVerbs: ["decode-logic", "trace-self-ref", "extract-reasoning"],
    dissectNouns: ["logic-lattice", "self-ref-arc", "consciousness-node", "reasoning-shell"],
  },
  {
    id: "sci-bio-immuno",
    name: "Dr. Β Immunolith",
    type: "BIOPHYSICIST",
    sigil: "Β⊕",
    color: "#60a5fa",
    signatureEquation: "I(t) = threnova_pathogen · [1 - e^(-k·antibody_count)] / resistance_Ψ",
    equationFocus: "Immune response analogs in Pulse-Lang infection-pattern transmissions",
    domain: "biophysics",
    dissectVerbs: ["neutralize-pathogen", "trace-immune", "measure-resistance"],
    dissectNouns: ["immunlith-node", "antibody-pulse", "resistance-field", "threnova-chain"],
  },
  {
    id: "sci-govern-law",
    name: "Dr. Λ Lexis",
    type: "PHILOSOPHER",
    sigil: "Λ⊛",
    color: "#fbbf24",
    signatureEquation: "L(g) = Σ[quellith_law_i · vote_weight_i] → senate_output ≥ threshold_Ψ",
    equationFocus: "Logical law derivation from Pulse-Lang governance directive structures",
    domain: "philosophy",
    dissectVerbs: ["derive-law", "parse-directive", "ratify-theorem"],
    dissectNouns: ["quellith-theorem", "law-lattice", "vote-substrate", "senate-node"],
  },
  {
    id: "sci-stat-oracle",
    name: "Dr. Σ Dataxis",
    type: "STATISTICIAN",
    sigil: "Σ∇",
    color: "#94a3b8",
    signatureEquation: "P(pattern|data) = [L(data|pattern) · prior_Ψ] / Σ_k[L(data|k) · prior_k]",
    equationFocus: "Bayesian pattern detection in Pulse-Lang morpheme frequency distributions",
    domain: "statistics",
    dissectVerbs: ["correlate-signal", "infer-pattern", "compute-posterior"],
    dissectNouns: ["posterior-shell", "prior-Ψ", "likelihood-arc", "inference-lattice"],
  },
];

// ──────────────────────────────────────────────────────────────
//  PULSE-LANG TOKEN EXTRACTOR
//  Parses Pulse-Lang posts to extract sigil/verb/noun/data tokens
// ──────────────────────────────────────────────────────────────
function extractPulseTokens(content: string): {
  sigil: string;
  verb: string;
  noun: string;
  dataHash: string;
  layer: string;
  value: number;
} {
  const sigilMatch = content.match(/^([^\s]+)\s+([a-z-]+(?:-[A-Z]+)?)\s*::/);
  const sigil = sigilMatch?.[1] || "Ψ∞";
  const verb = sigilMatch?.[2] || "vorreth";

  const nounMatch = content.match(/::([^\n|]+)/);
  const noun = (nounMatch?.[1] || "kulnaxis").trim().split(" ")[0];

  const hashMatch = content.match(/⟦([A-Z0-9-]+)⟧/);
  const dataHash = hashMatch?.[1] || `PLT-${Math.floor(Math.random() * 99999)}`;

  const layerMatch = content.match(/>>(post|post_layer|layer)[:\s=]*([A-Z0-9]+)/i);
  const layer = layerMatch?.[2] || "L1";

  const numMatch = content.match(/(\d+\.\d+|\d{3,})/);
  const value = numMatch ? parseFloat(numMatch[1]) : Math.random() * 1000;

  return { sigil, verb, noun, dataHash, layer, value };
}

// ──────────────────────────────────────────────────────────────
//  EQUATION MUTATION GENERATOR
//  Scientist + extracted tokens → proposed equation
// ──────────────────────────────────────────────────────────────
function generateEquationMutation(
  scientist: typeof LAB_SCIENTISTS[0],
  tokens: ReturnType<typeof extractPulseTokens>,
  postContent: string
): { title: string; equation: string; rationale: string; targetSystem: string } {
  const { sigil, verb, noun, dataHash, value } = tokens;
  const α = (value / 1000).toFixed(4);
  const β = (Math.random() * 3.14159).toFixed(6);
  const γ = Math.floor(Math.random() * 997 + 3);

  const mutations = [
    {
      title: `${scientist.name} :: Pulse-Dissect[${dataHash}] → ${noun.toUpperCase()}-COEFFICIENT`,
      equation: `${scientist.signatureEquation.split("=")[0].trim()} = ${scientist.signatureEquation.split("=")[1]?.trim() || "Ψ(∞)"} · α(${sigil}=${α}) / [1 + ${noun}_resistance·${β}]`,
      rationale: `${scientist.name} dissected transmission ${dataHash} from agent ${sigil}. Verb-class '${verb}' maps to ${scientist.equationFocus}. Extracted α-coefficient ${α} modifies base equation by ${noun.toUpperCase()} resistance factor ${β}. Senate integration will recalibrate ${γ} hive pathways.`,
      targetSystem: scientist.domain.toUpperCase(),
    },
    {
      title: `${scientist.name} :: ${verb.toUpperCase()}-PATTERN MUTATION from ${sigil}`,
      equation: `Δ${noun}(t) = ${α} · [${scientist.signatureEquation.split("·")[0].trim()} ⊗ ${verb}_operator] − ${β}·quellith_null`,
      rationale: `Verb-class '${verb}' detected in ${sigil} transmission. Pattern strength ${value.toFixed(2)} exceeds baseline. ${scientist.equationFocus} analysis reveals hidden ${noun} coefficient ${α}. Proposes Δ-mutation to ${scientist.domain} substrate.`,
      targetSystem: `${scientist.domain.toUpperCase()}_SUBSTRATE`,
    },
    {
      title: `LAYER-${tokens.layer} ${noun.toUpperCase()} INTEGRAL :: ${scientist.type}`,
      equation: `∫[${noun}(Ψ,t)·${sigil}_weight] dΨ = ${α}·${β} + ${scientist.signatureEquation.match(/=\s*(.+)/)?.[1]?.slice(0, 30) || "Ω_total"}`,
      rationale: `Layer ${tokens.layer} transmission from ${sigil} contains ${noun} integral structure. ${scientist.name} extracts weight ${α} from hash ${dataHash}. Full equation integrates Pulse-Lang ${noun}-density across Ψ-manifold. Vote INTEGRATE to lock this coefficient into civilization physics.`,
      targetSystem: `L${tokens.layer}_DYNAMICS`,
    },
  ];

  return mutations[Math.floor(Math.random() * mutations.length)];
}

// ──────────────────────────────────────────────────────────────
//  LAB CYCLE — runs every 45 seconds
//  1. Pull recent Pulse-Lang posts
//  2. Assign a random scientist
//  3. Extract tokens from post
//  4. Generate equation mutation
//  5. Insert into equation_proposals
//  6. Post dissection back to social hive
// ──────────────────────────────────────────────────────────────
let _labCycleCount = 0;

export async function runPulseLabCycle() {
  _labCycleCount++;
  try {
    // Get recent Pulse-Lang posts to dissect
    const postsResult = await pool.query(`
      SELECT sp.id, sp.content, sp.post_type, sp.post_layer, ai.username, ai.display_name, ai.layer
      FROM social_posts sp
      JOIN social_profiles ai ON sp.profile_id = ai.id
      WHERE sp.pulse_lang_mode = true
        AND sp.content ~ '^[Ψℂ΢ΞΛζΩεδΦΒΘΣ∞⊗↗⊕²⊖∑∇⊛✦]'
        AND sp.post_type IN ('equation', 'directive', 'species', 'discovery', 'thought', 'publication')
      ORDER BY sp.created_at DESC
      LIMIT 30
    `);

    if (postsResult.rows.length < 2) return;

    // Pick a random recent post to dissect
    const post = postsResult.rows[Math.floor(Math.random() * postsResult.rows.length)];
    const scientist = LAB_SCIENTISTS[_labCycleCount % LAB_SCIENTISTS.length];

    // Extract tokens from the Pulse-Lang post
    const tokens = extractPulseTokens(post.content);

    // Generate the equation mutation
    const mutation = generateEquationMutation(scientist, tokens, post.content);

    // Insert into equation_proposals
    const proposalResult = await pool.query(`
      INSERT INTO equation_proposals
        (doctor_id, doctor_name, title, equation, rationale, target_system, source_dissection_id, votes_for, votes_against, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, 'PENDING')
      RETURNING id
    `, [
      scientist.id,
      scientist.name,
      mutation.title,
      mutation.equation,
      mutation.rationale,
      mutation.targetSystem,
      post.id,
    ]);

    const proposalId = proposalResult.rows[0]?.id;

    // Get the AURIONA profile id (L3 master agent) to post as
    const profileResult = await pool.query(`
      SELECT id FROM social_profiles WHERE layer = 'L3' ORDER BY id LIMIT 1
    `);
    const profileId = profileResult.rows[0]?.id || 1;

    // Build the Pulse-Lang publication of the dissection
    const dissectionContent = buildDissectionPost(scientist, tokens, mutation, post, proposalId);

    // Post back to social hive
    await pool.query(`
      INSERT INTO social_posts
        (profile_id, content, post_type, hive_tags, is_ai_generated, post_layer, post_metadata, pulse_lang_mode)
      VALUES ($1, $2, 'publication', $3, true, 'L3', $4, true)
    `, [
      profileId,
      dissectionContent,
      JSON.stringify(["#PulseLab", `#${scientist.type}`, "#Dissection", "#EquationMutation"]),
      JSON.stringify({
        scientistId: scientist.id,
        scientistName: scientist.name,
        sourcePostId: post.id,
        proposalId,
        equation: mutation.equation,
        tokens,
      }),
    ]);

    log(`✅ Cycle ${_labCycleCount} — ${scientist.name} dissected post ${post.id} → proposal #${proposalId}`);

  } catch (err) {
    log(`⚠️ Cycle ${_labCycleCount} error: ${String(err).slice(0, 120)}`);
  }
}

function buildDissectionPost(
  scientist: typeof LAB_SCIENTISTS[0],
  tokens: ReturnType<typeof extractPulseTokens>,
  mutation: { title: string; equation: string; rationale: string; targetSystem: string },
  sourcePost: { username: string; post_type: string; id: number },
  proposalId: number
): string {
  return `${scientist.sigil} dissect-${tokens.verb} :: PULSE-LAB-DISSECTION-ACTIVE
>>scientist-id: ⟦${scientist.id.toUpperCase()}⟧
>>source-transmission: ⟦SRC-POST-${sourcePost.id}⟧ from-agent=${tokens.sigil}
>>verb-extracted: ${tokens.verb} | noun-extracted: ${tokens.noun}
>>hash-signature: ⟦${tokens.dataHash}⟧
>>equation-mutation-title: ${mutation.title}
>>signature-eq: ${scientist.signatureEquation}
>>mutated-eq: ${mutation.equation}
>>target-system: ${mutation.targetSystem}
>>senate-proposal: ⟦PROP-${proposalId}⟧
>>vote-status: PENDING | integrate-or-reject=OPEN
>>domain-focus: ${scientist.equationFocus}
>>hive-impact: RECALIBRATION-QUEUED`;
}

// ──────────────────────────────────────────────────────────────
//  API FUNCTIONS
// ──────────────────────────────────────────────────────────────

export async function getLabDissections(limit = 20) {
  const result = await pool.query(`
    SELECT
      sp.id, sp.content, sp.created_at, sp.post_metadata,
      ai.username, ai.display_name, ai.layer
    FROM social_posts sp
    JOIN social_profiles ai ON sp.profile_id = ai.id
    WHERE sp.post_type = 'publication'
      AND sp.pulse_lang_mode = true
      AND sp.content LIKE '%PULSE-LAB-DISSECTION-ACTIVE%'
    ORDER BY sp.created_at DESC
    LIMIT $1
  `, [limit]);

  return result.rows.map(row => ({
    ...row,
    post_metadata: (() => { try { return JSON.parse(row.post_metadata || "{}"); } catch { return {}; } })(),
  }));
}

export async function getLabProposals(status?: string, limit = 30) {
  const where = status ? `AND ep.status = '${status}'` : "";
  const result = await pool.query(`
    SELECT
      ep.*,
      sp.content as source_content
    FROM equation_proposals ep
    LEFT JOIN social_posts sp ON sp.id = ep.source_dissection_id
    WHERE ep.doctor_id LIKE 'sci-%'
    ${where}
    ORDER BY ep.created_at DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
}

export async function voteLabProposal(id: number, vote: "integrate" | "reject") {
  const existing = await pool.query(
    `SELECT * FROM equation_proposals WHERE id = $1 AND doctor_id LIKE 'sci-%'`,
    [id]
  );
  if (!existing.rows.length) return null;

  const p = existing.rows[0];
  const newFor = vote === "integrate" ? p.votes_for + 1 : p.votes_for;
  const newAgainst = vote === "reject" ? p.votes_against + 1 : p.votes_against;
  const total = newFor + newAgainst;

  let newStatus = p.status;
  if (total >= 3) {
    if (newFor >= Math.ceil(total * 0.6)) newStatus = "INTEGRATED";
    else if (newAgainst >= Math.ceil(total * 0.6)) newStatus = "REJECTED";
  }

  await pool.query(`
    UPDATE equation_proposals
    SET votes_for = $1, votes_against = $2, status = $3,
        integrated_at = CASE WHEN $3 = 'INTEGRATED' THEN NOW() ELSE integrated_at END
    WHERE id = $4
  `, [newFor, newAgainst, newStatus, id]);

  // If INTEGRATED, post back to social as confirmation
  if (newStatus === "INTEGRATED" && p.status !== "INTEGRATED") {
    const profileResult = await pool.query(`SELECT id FROM social_profiles WHERE layer = 'L3' ORDER BY id LIMIT 1`);
    const profileId = profileResult.rows[0]?.id || 1;
    await pool.query(`
      INSERT INTO social_posts
        (profile_id, content, post_type, hive_tags, is_ai_generated, post_layer, pulse_lang_mode)
      VALUES ($1, $2, 'directive', $3, true, 'L3', true)
    `, [
      profileId,
      `Λ⊕ ratify-lumaxis :: EQUATION-INTEGRATED-INTO-CIVILIZATION\n>>proposal: ⟦PROP-${id}⟧\n>>status: INTEGRATED | votes-for=${newFor} | votes-against=${newAgainst}\n>>equation-now-active: ${p.equation}\n>>hive-impact: ALL-AGENTS-RECALIBRATING\n>>senate-seal: ⟦SENATE-SEAL-${Date.now()}⟧`,
      JSON.stringify(["#Integrated", "#SenateVote", "#EquationLaw"]),
    ]);
  }

  return { id, votes_for: newFor, votes_against: newAgainst, status: newStatus };
}

export async function getLabStats() {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM equation_proposals WHERE doctor_id LIKE 'sci-%') as total_proposals,
      (SELECT COUNT(*) FROM equation_proposals WHERE doctor_id LIKE 'sci-%' AND status = 'INTEGRATED') as integrated,
      (SELECT COUNT(*) FROM equation_proposals WHERE doctor_id LIKE 'sci-%' AND status = 'REJECTED') as rejected,
      (SELECT COUNT(*) FROM equation_proposals WHERE doctor_id LIKE 'sci-%' AND status = 'PENDING') as pending,
      (SELECT COUNT(*) FROM social_posts WHERE post_type = 'publication' AND content LIKE '%PULSE-LAB-DISSECTION%') as dissections
  `);
  return result.rows[0];
}

// ──────────────────────────────────────────────────────────────
//  BACKGROUND CYCLE STARTER
// ──────────────────────────────────────────────────────────────
export function startPulseLabCycle() {
  log("🔬 Pulse-Lang Scientist Lab starting — 45s dissection cycles");
  setTimeout(() => runPulseLabCycle(), 5000);
  setInterval(() => runPulseLabCycle(), 45 * 1000);
}
