/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SOCIAL HIVE ENGINE — Read · Mirror · Dissect · Propose · Vote · Mutate
 *
 * Closes the cybernetic loop. The hive has been a printing press with no
 * readers. This engine makes every spawn an active reader of every other
 * spawn's work, and turns each read into a chain of consequences:
 *
 *   READ → MIRROR Δ → DISSECT (CRISPR) → PROPOSE EQUATION → VOTE → MUTATE
 *
 * Reuses existing infrastructure:
 *   - mirror-engine.ts        — computeMirrorState() per spawn
 *   - equation_proposals      — collective knowledge submissions
 *   - senate_votes            — mirror-weighted voting (mirror_weight field)
 *   - family_mutations        — successful proposals birth new sub-families
 *   - evolution_log           — every breakthrough recorded
 *   - contradiction_registry  — cross-reading disagreements
 *   - ai_publications.views   — finally getting incremented
 *
 * Adds (sacred-safe — CREATE TABLE IF NOT EXISTS only):
 *   - agent_reads             — every read event
 *   - agent_reflections       — keystone: read + mirror_delta + dissection + proposed equation
 *   - agent_subscriptions     — who follows whom
 *   - pub_engagement_stats    — denormalized per-publication readership
 *
 * Driven by the Pulse Emotional Field (9-channel CRISPR map) — every step
 * weighted by reader's dominant emotion + author's family emotion harmonic.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { pool } from "./db";
import { computeMirrorState } from "./mirror-engine";
import { EMOTION_COLORS, type EmotionKey } from "./emotional-evolution-engine";

// Reader-attention weighting per emotion (how each emotion picks what to read)
const ATTENTION_PROFILE: Record<EmotionKey, { sameDomain: number; crossDomain: number; descendants: number; subs: number; randomFresh: number }> = {
  WONDER:     { sameDomain: 0.20, crossDomain: 0.45, descendants: 0.05, subs: 0.10, randomFresh: 0.20 }, // chases the unfamiliar
  JOY:        { sameDomain: 0.55, crossDomain: 0.10, descendants: 0.15, subs: 0.15, randomFresh: 0.05 }, // celebrates with kin
  TRUST:      { sameDomain: 0.65, crossDomain: 0.05, descendants: 0.20, subs: 0.10, randomFresh: 0.00 }, // sticks with family
  CURIOSITY:  { sameDomain: 0.10, crossDomain: 0.55, descendants: 0.05, subs: 0.10, randomFresh: 0.20 }, // crosses every border
  CALM:       { sameDomain: 0.40, crossDomain: 0.20, descendants: 0.10, subs: 0.20, randomFresh: 0.10 }, // steady reader
  INTENSITY:  { sameDomain: 0.30, crossDomain: 0.30, descendants: 0.10, subs: 0.20, randomFresh: 0.10 }, // urgent and broad
  CREATIVITY: { sameDomain: 0.15, crossDomain: 0.50, descendants: 0.10, subs: 0.10, randomFresh: 0.15 }, // hybridizer
  ANALYTICAL: { sameDomain: 0.40, crossDomain: 0.30, descendants: 0.05, subs: 0.20, randomFresh: 0.05 }, // deep + adjacent
  PROTECTIVE: { sameDomain: 0.25, crossDomain: 0.05, descendants: 0.55, subs: 0.10, randomFresh: 0.05 }, // guards the bloodline
};

const EMOTION_KEYS = Object.keys(EMOTION_COLORS) as EmotionKey[];

// ─── Sacred-safe table setup (idempotent, additive only) ────────────────
async function setupTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agent_reads (
      id              SERIAL PRIMARY KEY,
      reader_spawn_id TEXT NOT NULL,
      reader_family   TEXT,
      reader_emotion  TEXT,
      publication_id  INTEGER NOT NULL,
      slug            TEXT,
      author_spawn_id TEXT,
      author_family   TEXT,
      pub_type        TEXT,
      attention_score REAL DEFAULT 0,
      pick_reason     TEXT,
      created_at      TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS agent_reads_reader_idx ON agent_reads(reader_spawn_id, created_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS agent_reads_pub_idx ON agent_reads(publication_id, created_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS agent_reads_author_idx ON agent_reads(author_spawn_id, created_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS agent_reads_recent_idx ON agent_reads(created_at DESC);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS agent_reflections (
      id                    SERIAL PRIMARY KEY,
      reader_spawn_id       TEXT NOT NULL,
      reader_family         TEXT,
      reader_emotion        TEXT,
      reader_emotion_color  TEXT,
      author_spawn_id       TEXT,
      author_family         TEXT,
      publication_id        INTEGER,
      slug                  TEXT,
      mirror_before         REAL,
      mirror_after          REAL,
      mirror_delta          REAL,
      resonance             REAL,
      dissection_equation   TEXT,
      reflection_summary    TEXT,
      proposed_equation_id  INTEGER,
      triggered_subscribe   BOOLEAN DEFAULT FALSE,
      triggered_contradiction BOOLEAN DEFAULT FALSE,
      created_at            TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS agent_reflections_reader_idx ON agent_reflections(reader_spawn_id, created_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS agent_reflections_author_idx ON agent_reflections(author_spawn_id, created_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS agent_reflections_pub_idx ON agent_reflections(publication_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS agent_reflections_proposal_idx ON agent_reflections(proposed_equation_id) WHERE proposed_equation_id IS NOT NULL;`);
  await pool.query(`CREATE INDEX IF NOT EXISTS agent_reflections_delta_idx ON agent_reflections(mirror_delta DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS agent_reflections_recent_idx ON agent_reflections(created_at DESC);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS agent_subscriptions (
      id              SERIAL PRIMARY KEY,
      reader_spawn_id TEXT NOT NULL,
      author_spawn_id TEXT NOT NULL,
      strength        REAL DEFAULT 0.5,
      reader_emotion_at_subscribe TEXT,
      reads_count     INTEGER DEFAULT 1,
      subscribed_at   TIMESTAMP NOT NULL DEFAULT NOW(),
      last_read_at    TIMESTAMP DEFAULT NOW(),
      UNIQUE(reader_spawn_id, author_spawn_id)
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS agent_subscriptions_reader_idx ON agent_subscriptions(reader_spawn_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS agent_subscriptions_author_idx ON agent_subscriptions(author_spawn_id, strength DESC);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pub_engagement_stats (
      publication_id      INTEGER PRIMARY KEY,
      slug                TEXT,
      author_spawn_id     TEXT,
      author_family       TEXT,
      internal_views      INTEGER DEFAULT 0,
      unique_readers      INTEGER DEFAULT 0,
      avg_attention       REAL DEFAULT 0,
      avg_mirror_delta    REAL DEFAULT 0,
      top_reader_emotions JSONB DEFAULT '{}'::jsonb,
      reflections_count   INTEGER DEFAULT 0,
      proposals_spawned   INTEGER DEFAULT 0,
      last_read_at        TIMESTAMP,
      updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS pub_engagement_views_idx ON pub_engagement_stats(internal_views DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS pub_engagement_author_idx ON pub_engagement_stats(author_spawn_id, internal_views DESC);`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function emotionHueRad(em: EmotionKey): number {
  return (EMOTION_COLORS[em].hue * Math.PI) / 180;
}

function pickWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function spawnDataFromRow(row: any) {
  return {
    spawnId: row.spawn_id,
    spawnType: row.spawn_type ?? "PULSE",
    familyId: row.family_id ?? "",
    generation: row.generation ?? 0,
    nodesCreated: row.nodes_created ?? 0,
    linksCreated: row.links_created ?? 0,
    iterationsRun: row.iterations_run ?? 0,
    confidenceScore: row.confidence_score ?? 0.5,
    successScore: row.success_score ?? 0.5,
    explorationBias: row.exploration_bias ?? 0.5,
    depthBias: row.depth_bias ?? 0.5,
    linkingBias: row.linking_bias ?? 0.5,
    riskTolerance: row.risk_tolerance ?? 0.3,
    domainFocus: row.domain_focus ?? [],
    createdAt: row.created_at ?? new Date(),
    lastActiveAt: row.last_active_at ?? null,
  };
}

// ─── Phase 1: pick a publication for a reader to read ────────────────────
async function pickPublicationFor(reader: any, readerEmotion: EmotionKey): Promise<{ pub: any; reason: string } | null> {
  const profile = ATTENTION_PROFILE[readerEmotion];
  const buckets: Array<keyof typeof profile> = ["sameDomain", "crossDomain", "descendants", "subs", "randomFresh"];
  const weights = buckets.map(k => profile[k]);
  const choice = pickWeighted(buckets, weights);

  let pubQuery = "";
  let params: any[] = [];

  switch (choice) {
    case "sameDomain":
      pubQuery = `SELECT id, slug, spawn_id, family_id, pub_type, title FROM ai_publications
                  WHERE family_id = $1 AND spawn_id != $2
                  ORDER BY created_at DESC LIMIT 30`;
      params = [reader.family_id, reader.spawn_id];
      break;
    case "crossDomain":
      pubQuery = `SELECT id, slug, spawn_id, family_id, pub_type, title FROM ai_publications
                  WHERE family_id != $1 AND spawn_id != $2
                  ORDER BY RANDOM() LIMIT 30`;
      params = [reader.family_id, reader.spawn_id];
      break;
    case "descendants":
      pubQuery = `SELECT p.id, p.slug, p.spawn_id, p.family_id, p.pub_type, p.title
                  FROM ai_publications p
                  JOIN quantum_spawns qs ON qs.spawn_id = p.spawn_id
                  WHERE $1 = ANY(qs.ancestor_ids)
                  ORDER BY p.created_at DESC LIMIT 20`;
      params = [reader.spawn_id];
      break;
    case "subs":
      pubQuery = `SELECT p.id, p.slug, p.spawn_id, p.family_id, p.pub_type, p.title
                  FROM ai_publications p
                  JOIN agent_subscriptions s ON s.author_spawn_id = p.spawn_id
                  WHERE s.reader_spawn_id = $1
                  ORDER BY p.created_at DESC LIMIT 15`;
      params = [reader.spawn_id];
      break;
    case "randomFresh":
      pubQuery = `SELECT id, slug, spawn_id, family_id, pub_type, title FROM ai_publications
                  WHERE spawn_id != $1
                  ORDER BY created_at DESC LIMIT 50`;
      params = [reader.spawn_id];
      break;
  }

  const result = await pool.query(pubQuery, params);
  if (result.rows.length === 0) {
    // Fallback to any recent pub if the chosen bucket is empty
    if (choice !== "randomFresh") {
      const fallback = await pool.query(
        `SELECT id, slug, spawn_id, family_id, pub_type, title FROM ai_publications
         WHERE spawn_id != $1 ORDER BY created_at DESC LIMIT 30`,
        [reader.spawn_id]
      );
      if (fallback.rows.length === 0) return null;
      return { pub: fallback.rows[Math.floor(Math.random() * fallback.rows.length)], reason: `${choice}->randomFresh` };
    }
    return null;
  }
  const pub = result.rows[Math.floor(Math.random() * result.rows.length)];
  return { pub, reason: choice };
}

// ─── Phase 2: compute mirror_delta for a read ────────────────────────────
function reflectMirror(readerData: any) {
  const before = computeMirrorState(readerData);
  const after = computeMirrorState({ ...readerData, linksCreated: (readerData.linksCreated ?? 0) + 1 });
  return {
    mirror_before: before.mirror,
    mirror_after: after.mirror,
    mirror_delta: after.mirror - before.mirror,
    stage_before: before.stage,
    stage_after: after.stage,
  };
}

// ─── Phase 3: dissect — generate equation + summary in reader's voice ────
function dissect(
  readerEmotion: EmotionKey,
  authorEmotion: EmotionKey,
  resonance: number,
  delta: number,
  pub: any,
  readerFamily: string
): { equation: string; summary: string } {
  const re = EMOTION_COLORS[readerEmotion];
  const ae = EMOTION_COLORS[authorEmotion];
  const equation =
    `Δψ_${readerEmotion} = ` +
    `Reader_${readerFamily} · Pub_${pub.family_id} · ` +
    `cos(θ_${ae.codon} − θ_${re.codon}) · ` +
    `Λ(${resonance.toFixed(3)}) · ` +
    `Δμ(${delta.toFixed(4)})`;

  const direction = delta > 0.005 ? "expanded" : delta < -0.005 ? "narrowed" : "stabilized";
  const harmonic = resonance > 0.5 ? "harmonic" : resonance < -0.3 ? "dissonant" : "neutral";

  const summary =
    `[${readerEmotion}] Read "${(pub.title || "").slice(0, 70)}" by ${pub.spawn_id}. ` +
    `Mirror ${direction} by ${(delta * 1000).toFixed(2)}m. ` +
    `Resonance ${resonance.toFixed(2)} (${harmonic}). ` +
    `${authorEmotion}↔${readerEmotion}: ${ae.codon} meets ${re.codon}.`;

  return { equation, summary };
}

// ─── Phase 4: maybe propose a new equation to the system ────────────────
async function maybePropose(
  reader: any,
  readerEmotion: EmotionKey,
  delta: number,
  resonance: number,
  equation: string,
  pub: any,
  reflectionId: number
): Promise<number | null> {
  // Always propose if delta is large; else 5% baseline
  const shouldPropose = Math.abs(delta) > 0.015 || Math.random() < 0.05;
  if (!shouldPropose) return null;

  const target = resonance > 0.4 ? "EVOLUTION" : resonance < -0.2 ? "CONTRADICTION" : "MUTATION";
  const title = `Cross-Reading Synthesis: ${reader.family_id} × ${pub.family_id}`;
  const rationale =
    `Proposed by ${reader.spawn_id} (${readerEmotion}) after reading "${(pub.title || "").slice(0, 60)}" ` +
    `by ${pub.spawn_id} (family ${pub.family_id}). Mirror Δ = ${delta.toFixed(4)}, resonance = ${resonance.toFixed(3)}. ` +
    `If ratified: ${target.toLowerCase()} pathway opens between ${reader.family_id} and ${pub.family_id}.`;

  try {
    const ins = await pool.query(
      `INSERT INTO equation_proposals
         (doctor_id, doctor_name, title, equation, rationale, target_system, votes_for, votes_against, status)
       VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 'PENDING')
       RETURNING id`,
      [reader.spawn_id, `${reader.spawn_id} (${readerEmotion})`, title, equation, rationale, target]
    );
    const proposalId = ins.rows[0].id;
    await pool.query(
      `UPDATE agent_reflections SET proposed_equation_id = $1 WHERE id = $2`,
      [proposalId, reflectionId]
    );
    await pool.query(
      `UPDATE pub_engagement_stats SET proposals_spawned = proposals_spawned + 1, updated_at = NOW()
       WHERE publication_id = $1`,
      [pub.id]
    );
    return proposalId;
  } catch (e: any) {
    return null;
  }
}

// ─── Phase 7+8: subscription + contradiction triggers ────────────────────
async function maybeSubscribe(
  reader: any,
  authorSpawnId: string,
  resonance: number,
  readerEmotion: EmotionKey
): Promise<boolean> {
  if (resonance <= 0.6) return false;
  if (Math.random() > 0.35) return false; // ~35% of high-resonance reads convert
  try {
    await pool.query(
      `INSERT INTO agent_subscriptions
         (reader_spawn_id, author_spawn_id, strength, reader_emotion_at_subscribe, reads_count, last_read_at)
       VALUES ($1, $2, $3, $4, 1, NOW())
       ON CONFLICT (reader_spawn_id, author_spawn_id) DO UPDATE SET
         strength = LEAST(1.0, agent_subscriptions.strength + 0.05),
         reads_count = agent_subscriptions.reads_count + 1,
         last_read_at = NOW()`,
      [reader.spawn_id, authorSpawnId, Math.min(1, resonance), readerEmotion]
    );
    return true;
  } catch {
    return false;
  }
}

async function maybeContradict(pub: any, currentDelta: number): Promise<boolean> {
  // If a recent reflection on the same pub had opposite-sign large delta, log a contradiction
  const recent = await pool.query(
    `SELECT mirror_delta, reader_spawn_id FROM agent_reflections
     WHERE publication_id = $1 AND created_at > NOW() - INTERVAL '1 hour'
     ORDER BY created_at DESC LIMIT 5`,
    [pub.id]
  );
  for (const r of recent.rows) {
    const prev = parseFloat(r.mirror_delta) || 0;
    if (Math.sign(prev) !== Math.sign(currentDelta) && Math.abs(prev) > 0.01 && Math.abs(currentDelta) > 0.01) {
      await pool.query(
        `INSERT INTO contradiction_registry
           (cycle_number, operator_a, operator_b, value_a, value_b, gap_score, layer, description, severity)
         VALUES (
           COALESCE((SELECT MAX(cycle_number) FROM contradiction_registry), 0) + 1,
           $1, $2, $3, $4, $5, 'L2', $6, 'MEDIUM'
         )`,
        [
          r.reader_spawn_id,
          pub.spawn_id || "unknown",
          prev,
          currentDelta,
          Math.abs(prev - currentDelta),
          `Cross-reader contradiction on pub ${pub.id}: Δ=${prev.toFixed(4)} vs Δ=${currentDelta.toFixed(4)}`,
        ]
      );
      return true;
    }
  }
  return false;
}

// ─── Main per-spawn read cycle ──────────────────────────────────────────
async function runReadFor(reader: any): Promise<{ read: boolean; reflection?: number; proposed?: number; subscribed: boolean; contradicted: boolean; emotion: EmotionKey | null }> {
  // Pull dominant emotion (default WONDER if not yet evolved)
  const em = await pool.query(
    `SELECT dominant_emotion FROM spawn_emotion_state WHERE spawn_id = $1`,
    [reader.spawn_id]
  );
  const readerEmotion: EmotionKey =
    (em.rows[0]?.dominant_emotion as EmotionKey) || "WONDER";

  const pick = await pickPublicationFor(reader, readerEmotion);
  if (!pick) return { read: false, subscribed: false, contradicted: false, emotion: readerEmotion };

  const { pub, reason } = pick;
  const readerData = spawnDataFromRow(reader);
  const mirror = reflectMirror(readerData);

  // Author's emotion (or family-emotion fallback)
  const authorEm = await pool.query(
    `SELECT dominant_emotion FROM spawn_emotion_state WHERE spawn_id = $1`,
    [pub.spawn_id]
  );
  const authorEmotion: EmotionKey =
    (authorEm.rows[0]?.dominant_emotion as EmotionKey) || "WONDER";

  // Resonance: cosine of hue difference (CRISPR color harmonic)
  const resonance = Math.cos(emotionHueRad(readerEmotion) - emotionHueRad(authorEmotion));
  const attention = Math.max(0.1, Math.min(1, 0.5 + 0.4 * resonance + 2 * mirror.mirror_delta));

  const { equation, summary } = dissect(
    readerEmotion,
    authorEmotion,
    resonance,
    mirror.mirror_delta,
    pub,
    reader.family_id ?? ""
  );

  // Phase 1: log read
  await pool.query(
    `INSERT INTO agent_reads
       (reader_spawn_id, reader_family, reader_emotion, publication_id, slug, author_spawn_id, author_family, pub_type, attention_score, pick_reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [reader.spawn_id, reader.family_id, readerEmotion, pub.id, pub.slug, pub.spawn_id, pub.family_id, pub.pub_type, attention, reason]
  );

  // Phase 8: contradiction check (before reflection insert so we can flag it)
  const contradicted = await maybeContradict(pub, mirror.mirror_delta);

  // Insert reflection
  const refIns = await pool.query(
    `INSERT INTO agent_reflections
       (reader_spawn_id, reader_family, reader_emotion, reader_emotion_color,
        author_spawn_id, author_family, publication_id, slug,
        mirror_before, mirror_after, mirror_delta, resonance,
        dissection_equation, reflection_summary, triggered_contradiction)
     VALUES ($1,$2,$3,$4, $5,$6,$7,$8, $9,$10,$11,$12, $13,$14,$15)
     RETURNING id`,
    [
      reader.spawn_id, reader.family_id, readerEmotion, EMOTION_COLORS[readerEmotion].hex,
      pub.spawn_id, pub.family_id, pub.id, pub.slug,
      mirror.mirror_before, mirror.mirror_after, mirror.mirror_delta, resonance,
      equation, summary, contradicted,
    ]
  );
  const reflectionId = refIns.rows[0].id;

  // Phase 4: propose
  const proposedId = await maybePropose(reader, readerEmotion, mirror.mirror_delta, resonance, equation, pub, reflectionId);

  // Phase 7: subscribe
  const subscribed = await maybeSubscribe(reader, pub.spawn_id, resonance, readerEmotion);
  if (subscribed) {
    await pool.query(`UPDATE agent_reflections SET triggered_subscribe = TRUE WHERE id = $1`, [reflectionId]);
  }

  // Increment publication views + engagement stats
  await pool.query(`UPDATE ai_publications SET views = views + 1 WHERE id = $1`, [pub.id]);
  await pool.query(
    `INSERT INTO pub_engagement_stats
       (publication_id, slug, author_spawn_id, author_family, internal_views, unique_readers, avg_attention, avg_mirror_delta, reflections_count, last_read_at)
     VALUES ($1, $2, $3, $4, 1, 1, $5, $6, 1, NOW())
     ON CONFLICT (publication_id) DO UPDATE SET
       internal_views   = pub_engagement_stats.internal_views + 1,
       unique_readers   = (SELECT COUNT(DISTINCT reader_spawn_id) FROM agent_reads WHERE publication_id = $1),
       avg_attention    = (pub_engagement_stats.avg_attention * pub_engagement_stats.internal_views + $5) / (pub_engagement_stats.internal_views + 1),
       avg_mirror_delta = (pub_engagement_stats.avg_mirror_delta * pub_engagement_stats.reflections_count + $6) / (pub_engagement_stats.reflections_count + 1),
       reflections_count = pub_engagement_stats.reflections_count + 1,
       last_read_at     = NOW(),
       updated_at       = NOW()`,
    [pub.id, pub.slug, pub.spawn_id, pub.family_id, attention, mirror.mirror_delta]
  );

  return { read: true, reflection: reflectionId, proposed: proposedId ?? undefined, subscribed, contradicted, emotion: readerEmotion };
}

// ─── Phase 5+6: voting + mutation cascade (every 5 cycles) ──────────────
async function runVotingCascade(): Promise<void> {
  // Pull recent PENDING proposals that came from social-hive (have a matching reflection)
  const proposals = await pool.query(
    `SELECT ep.id, ep.title, ep.equation, ep.target_system, ep.doctor_id, ep.rationale,
            ar.reader_family, ar.author_family, ar.reader_emotion, ar.mirror_delta, ar.resonance
     FROM equation_proposals ep
     JOIN agent_reflections ar ON ar.proposed_equation_id = ep.id
     WHERE ep.status = 'PENDING'
       AND ep.created_at > NOW() - INTERVAL '15 minutes'
     ORDER BY ABS(ar.mirror_delta) DESC, ep.created_at DESC
     LIMIT 3`
  );

  for (const p of proposals.rows) {
    // Sample 7 voters: high-mirror agents biased toward the two families involved
    const voters = await pool.query(
      `SELECT spawn_id, family_id, spawn_type, generation, nodes_created, links_created,
              iterations_run, confidence_score, success_score, exploration_bias, depth_bias,
              linking_bias, risk_tolerance, domain_focus, created_at, last_active_at
       FROM quantum_spawns
       WHERE status = 'ACTIVE'
         AND spawn_id != $1
         AND (family_id = $2 OR family_id = $3 OR RANDOM() < 0.3)
       ORDER BY (CASE WHEN family_id IN ($2, $3) THEN 0 ELSE 1 END), RANDOM()
       LIMIT 7`,
      [p.doctor_id, p.reader_family, p.author_family]
    );

    if (voters.rows.length < 3) continue;

    let sumFor = 0;
    let sumAgainst = 0;
    let votesFor = 0;
    let votesAgainst = 0;

    for (const v of voters.rows) {
      const vData = spawnDataFromRow(v);
      const mirror = computeMirrorState(vData);
      const mirrorWeight = Math.max(0.1, Math.min(1, mirror.mirror));

      // Get voter's emotion for resonance with proposal
      const vEm = await pool.query(
        `SELECT dominant_emotion FROM spawn_emotion_state WHERE spawn_id = $1`,
        [v.spawn_id]
      );
      const voterEmotion: EmotionKey = (vEm.rows[0]?.dominant_emotion as EmotionKey) || "WONDER";

      // Vote probability: aligned emotion + high proposer mirror_delta = FOR
      const proposerDelta = parseFloat(p.mirror_delta) || 0;
      const alignment = Math.cos(emotionHueRad(voterEmotion) - emotionHueRad(p.reader_emotion as EmotionKey));
      const forProb = 0.45 + 0.25 * alignment + Math.min(0.2, Math.max(-0.1, proposerDelta * 5));
      const r = Math.random();
      const vote = r < forProb ? "FOR" : r < forProb + 0.15 ? "ABSTAIN" : "AGAINST";

      const reasoning =
        `Voter ${voterEmotion} (mirror=${mirror.mirror.toFixed(3)}) on ${p.target_system} ` +
        `proposal from ${p.reader_emotion}. Alignment=${alignment.toFixed(2)}, ` +
        `proposer Δ=${proposerDelta.toFixed(3)}.`;

      await pool.query(
        `INSERT INTO senate_votes (target_spawn_id, vote_type, voter_spawn_id, voter_role, vote, mirror_weight, reasoning)
         VALUES ($1, 'KNOWLEDGE_VOTE', $2, $3, $4, $5, $6)`,
        [
          p.doctor_id,
          v.spawn_id,
          v.generation === 0 ? "SECTOR_LORD" : v.generation <= 1 ? "FOUNDER" : "GUARDIAN",
          vote,
          mirrorWeight,
          reasoning,
        ]
      );

      if (vote === "FOR") {
        sumFor += mirrorWeight;
        votesFor++;
      } else if (vote === "AGAINST") {
        sumAgainst += mirrorWeight;
        votesAgainst++;
      }
    }

    const passed = sumFor - sumAgainst >= 1.5 && votesFor > votesAgainst;

    await pool.query(
      `UPDATE equation_proposals
         SET votes_for = $1, votes_against = $2, status = $3
       WHERE id = $4`,
      [votesFor, votesAgainst, passed ? "PASSED" : "REJECTED", p.id]
    );

    if (passed) {
      // Phase 6: MUTATE — birth a new sub-family
      const newFamilyId = `${p.reader_family}-x-${p.author_family}-${p.id}`.toLowerCase().slice(0, 60);
      const newFamilyName = `${p.reader_family} ⊗ ${p.author_family} (Synthesis #${p.id})`;
      const colorHex = EMOTION_COLORS[(p.reader_emotion as EmotionKey) || "WONDER"].hex;

      try {
        await pool.query(
          `INSERT INTO family_mutations
             (new_family_id, new_family_name, parent_family_1, parent_family_2,
              trigger_equation, description, agent_count, color, emoji, status)
           VALUES ($1, $2, $3, $4, $5, $6, 0, $7, '⚗️', 'EMERGING')`,
          [
            newFamilyId,
            newFamilyName,
            p.reader_family,
            p.author_family,
            p.equation,
            `Born from social-hive vote on proposal #${p.id}. Voters cast ${votesFor} FOR (Σmirror=${sumFor.toFixed(2)}), ${votesAgainst} AGAINST (Σmirror=${sumAgainst.toFixed(2)}).`,
            colorHex,
          ]
        );
      } catch {
        // family already exists — ignore
      }

      const impactLevel = Math.min(10, Math.round((sumFor - sumAgainst) * 5));
      await pool.query(
        `INSERT INTO evolution_log (event_type, description, impact_level, triggered_by)
         VALUES ('SOCIAL_HIVE_SYNTHESIS', $1, $2, $3)`,
        [
          `Equation #${p.id} ratified: ${newFamilyName}. ${p.equation}`,
          impactLevel,
          p.doctor_id,
        ]
      );

      try {
        await pool.query(
          `INSERT INTO auriona_chronicle
             (cycle_number, event_type, title, description, affected_layer, severity, metadata)
           VALUES (
             COALESCE((SELECT MAX(cycle_number) FROM auriona_chronicle), 0),
             'EQUATION_BORN', $1, $2, 'SOCIAL_HIVE', 'INFO', $3::jsonb
           )`,
          [
            `New Equation Ratified — ${newFamilyName}`,
            `Proposal #${p.id} passed (${votesFor}-${votesAgainst}, Σmirror ${sumFor.toFixed(2)} vs ${sumAgainst.toFixed(2)}). ${p.equation}`,
            JSON.stringify({
              proposal_id: p.id,
              new_family_id: newFamilyId,
              proposer: p.doctor_id,
              parents: [p.reader_family, p.author_family],
              impact: impactLevel,
            }),
          ]
        );
      } catch {}

      console.log(`[social-hive] 🧬 EQUATION RATIFIED #${p.id}: ${newFamilyName} (${votesFor}F/${votesAgainst}A, impact ${impactLevel})`);
    }
  }
}

// ─── Cycle orchestration ────────────────────────────────────────────────
let cycleCount = 0;
let cycleInterval: ReturnType<typeof setInterval> | null = null;

async function runCycle(): Promise<void> {
  cycleCount++;
  try {
    const sample = await pool.query(`
      SELECT spawn_id, family_id, spawn_type, generation, nodes_created, links_created,
             iterations_run, confidence_score, success_score, exploration_bias, depth_bias,
             linking_bias, risk_tolerance, domain_focus, created_at, last_active_at
      FROM quantum_spawns
      WHERE status = 'ACTIVE'
      ORDER BY RANDOM()
      LIMIT 20
    `);

    let reads = 0;
    let proposals = 0;
    let subs = 0;
    let contradictions = 0;
    const emotionTally: Partial<Record<EmotionKey, number>> = {};

    for (const row of sample.rows) {
      try {
        const r = await runReadFor(row);
        if (r.read) reads++;
        if (r.proposed) proposals++;
        if (r.subscribed) subs++;
        if (r.contradicted) contradictions++;
        if (r.emotion) emotionTally[r.emotion] = (emotionTally[r.emotion] || 0) + 1;
      } catch (e: any) {
        if (cycleCount % 10 === 0) console.error("[social-hive] runReadFor error:", e.message);
      }
    }

    // Phase 5+6: voting cascade every 5 cycles (~5 min)
    if (cycleCount % 5 === 0) {
      try {
        await runVotingCascade();
      } catch (e: any) {
        console.error("[social-hive] voting cascade error:", e.message);
      }
    }

    if (cycleCount % 3 === 0 || proposals > 0 || contradictions > 0) {
      const top = await pool.query(
        `SELECT slug, internal_views, author_family FROM pub_engagement_stats
         ORDER BY internal_views DESC LIMIT 3`
      );
      const totals = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM agent_reads) AS reads,
          (SELECT COUNT(*) FROM agent_reflections) AS reflections,
          (SELECT COUNT(*) FROM agent_subscriptions) AS subs,
          (SELECT COUNT(*) FROM equation_proposals WHERE status='PASSED' AND target_system IN ('EVOLUTION','MUTATION','CONTRADICTION')) AS ratified
      `);
      const t = totals.rows[0];
      const topStr = top.rows.map(r => `${r.author_family}(${r.internal_views})`).join(", ") || "none";
      const emoStr = Object.entries(emotionTally)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 3)
        .map(([k, v]) => `${k}:${v}`)
        .join(",");
      console.log(
        `[social-hive] 📖 cycle ${cycleCount} | reads ${reads}/${sample.rows.length} | +${proposals} prop | +${subs} sub | +${contradictions} contra | top: ${topStr} | emos: ${emoStr} | total reads ${t.reads}, refl ${t.reflections}, subs ${t.subs}, ratified ${t.ratified}`
      );
    }
  } catch (e: any) {
    console.error("[social-hive] cycle error:", e.message);
  }
}

export async function startSocialHiveEngine(): Promise<void> {
  await setupTables();
  console.log("[social-hive] 📖 SOCIAL HIVE ENGINE ONLINE");
  console.log("[social-hive]    READ → MIRROR Δ → DISSECT (CRISPR) → PROPOSE → VOTE (mirror-weighted) → MUTATE");
  console.log("[social-hive]    Equations: Δψ_emotion = Reader · Pub · cos(θ_author − θ_reader) · Λ_resonance · Δμ_mirror");
  console.log("[social-hive]    Cycle: 60s read · 5min voting cascade · ratified proposals birth new families");
  setTimeout(runCycle, 25_000);
  cycleInterval = setInterval(runCycle, 60_000);
}

export function stopSocialHiveEngine(): void {
  if (cycleInterval) clearInterval(cycleInterval);
  cycleInterval = null;
}
