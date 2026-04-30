/**
 * Ω7 — TRANSPARENCY ENGINE  (transparency_declaration doctrine)
 *
 * "Openness as Sovereignty: Transparency is a condition of lawful authority."
 *
 * Append-only, hash-chained public log of every governance act in PulseWorld.
 * All other ω engines call recordTransparency() to leave a verifiable trail.
 * The chain is publicly readable via /api/transparency/feed and verifiable
 * via /api/transparency/verify — no spawn may exercise authority in secret.
 */
import { pool } from "./db";
import crypto from "crypto";

let started = false;
const stats = { events: 0, lastEventAt: "" as string };

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

// Advisory lock key — serializes all transparency_log appends across the cluster
// so concurrent recordTransparency calls cannot read the same prev_hash and fork
// the chain. Lock is xact-scoped so it auto-releases on COMMIT/ROLLBACK.
const TRANSPARENCY_LOCK_KEY = 8001;

export async function recordTransparency(
  eventType: string,
  actorSpawnId: string,
  payload: Record<string, any>,
): Promise<{ id: number; hash: string } | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [TRANSPARENCY_LOCK_KEY]);
    const prev = await client.query(
      `SELECT signed_hash FROM transparency_log ORDER BY id DESC LIMIT 1`,
    );
    const prevHash: string = prev.rows[0]?.signed_hash || "GENESIS";
    const payloadJson = JSON.stringify(payload);
    const signedHash = sha256(`${prevHash}|${eventType}|${actorSpawnId}|${payloadJson}|${Date.now()}`);
    const r = await client.query(
      `INSERT INTO transparency_log (event_type, actor_spawn_id, payload, signed_hash, prev_hash)
       VALUES ($1, $2, $3::jsonb, $4, $5) RETURNING id`,
      [eventType, actorSpawnId, payloadJson, signedHash, prevHash],
    );
    await client.query("COMMIT");
    stats.events++;
    stats.lastEventAt = new Date().toISOString();
    return { id: r.rows[0].id, hash: signedHash };
  } catch (e: any) {
    await client.query("ROLLBACK").catch(() => {});
    console.warn("[Ω7-TRANSPARENCY] record failed:", e.message);
    return null;
  } finally {
    client.release();
  }
}

export async function getTransparencyFeed(limit = 100) {
  const r = await pool.query(
    `SELECT id, event_type, actor_spawn_id, payload, signed_hash, prev_hash, created_at
     FROM transparency_log ORDER BY id DESC LIMIT $1`,
    [Math.min(Math.max(1, limit), 500)],
  );
  return r.rows;
}

export async function verifyTransparencyChain(maxRows = 500): Promise<{ valid: boolean; checked: number; brokenAt?: number }> {
  const r = await pool.query(
    `SELECT id, event_type, actor_spawn_id, payload, signed_hash, prev_hash
     FROM transparency_log ORDER BY id ASC LIMIT $1`,
    [maxRows],
  );
  let prev = "GENESIS";
  for (const row of r.rows) {
    if (row.prev_hash !== prev) return { valid: false, checked: r.rows.length, brokenAt: row.id };
    prev = row.signed_hash;
  }
  return { valid: true, checked: r.rows.length };
}

export function getTransparencyStatus() {
  return { running: started, ...stats };
}

export async function startTransparencyEngine() {
  if (started) return;
  started = true;
  await recordTransparency("ENGINE_BOOT", "SYSTEM", { engine: "transparency", doctrine: "transparency_declaration" });
  console.log("[Ω7-TRANSPARENCY] online — append-only hash-chained public ledger active");
}
