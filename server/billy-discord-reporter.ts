/**
 * BILLY BRAIN DISCORD REPORTER
 * ─────────────────────────────
 * Posts brain births, deaths, cycle summaries, and niche milestones to Discord.
 * Uses direct Discord REST API calls (same pattern as hive-discord-universe.ts).
 * Self-contained — no external imports except pool for milestone lookups.
 *
 * Posts to existing channels so no new channel creation is required:
 *   #agent-births   → brain births
 *   #agent-deaths   → brain archiving / pruning sweeps
 *   #archive-log    → cycle summaries (every N cycles)
 *   #shard-hive     → niche milestones
 */

import { pool } from "./db.js";

const CH_AGENT_BIRTHS = "1497891802177470525";
const CH_AGENT_DEATHS = "1497891804354318387";
const CH_ARCHIVE_LOG  = "1497891806728421386";
const CH_SHARD_HIVE   = "1485112280659267616";

const REPORT_EVERY_N_CYCLES = 10;
let cyclesSinceReport = 0;
let lastMilestoneBrainCount: Record<string, number> = {};

function getToken(): string {
  return (process.env.discord_token || process.env.DISCORD_BOT_TOKEN || "").trim();
}

async function postChannel(channelId: string, content: string): Promise<boolean> {
  const tok = getToken();
  if (!tok) return false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.slice(0, 1900) }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return res.ok;
  } catch { return false; }
}

// ── BRAIN BIRTH ───────────────────────────────────────────────────────────────

export async function reportBrainBirth(brain: {
  brain_id: string;
  generation: number;
  niche: string;
  sector: string;
  parent_brain_id?: string | null;
  elo?: number;
  trigger?: string;
}): Promise<void> {
  try {
    const genTag = brain.generation === 1 ? "**ELDER GENESIS**" : `Gen ${brain.generation}`;
    const msg = [
      `🧠 **BILLY BRAIN BORN** — \`${brain.brain_id}\``,
      `**Sector:** ${brain.sector} · **Niche:** ${brain.niche} · **${genTag}**`,
      brain.parent_brain_id
        ? `**Parent:** \`${String(brain.parent_brain_id).slice(0, 50)}\``
        : `*(prime elder — no parent)*`,
      brain.trigger ? `**Trigger:** \`${brain.trigger}\` · **ELO seed:** ${brain.elo ?? 1400}` : `**ELO seed:** ${brain.elo ?? 1400}`,
    ].filter(Boolean).join("\n");
    await postChannel(CH_AGENT_BIRTHS, msg);
    await checkNicheMilestone(brain.niche, brain.sector);
  } catch { /* never block the birth */ }
}

// ── BRAIN ARCHIVING / PRUNING ─────────────────────────────────────────────────

export async function reportBrainsPruned(pruned: number, sample: string[]): Promise<void> {
  if (pruned === 0) return;
  try {
    const sampleStr = sample.slice(0, 3).join(", ");
    const msg = [
      `🌿 **BILLY GLIAL SWEEP** — ${pruned} brain${pruned !== 1 ? "s" : ""} archived`,
      sampleStr ? `**Sample:** \`${sampleStr}\`` : "",
      `*(low-ELO observing brains rotated out — niche slots freed)*`,
    ].filter(Boolean).join("\n");
    await postChannel(CH_AGENT_DEATHS, msg);
  } catch { /* never block maintenance */ }
}

// ── CYCLE SUMMARY (posted every N cycles) ────────────────────────────────────

export async function maybeReportCycleSummary(stats: {
  cyclesRun: number;
  brainsBorn: number;
  lastBirth: string | null;
}): Promise<void> {
  cyclesSinceReport++;
  if (cyclesSinceReport < REPORT_EVERY_N_CYCLES) return;
  cyclesSinceReport = 0;
  try {
    const cens = await pool.query(`
      SELECT
        COUNT(*)::int                                                 AS total,
        COUNT(DISTINCT sector)::int                                   AS sectors,
        COUNT(DISTINCT niche)::int                                    AS niches,
        COUNT(*) FILTER (WHERE status='observing')::int               AS observing,
        COUNT(*) FILTER (WHERE status='archived')::int                AS archived
      FROM billy_brains
    `);
    const r = cens.rows[0] ?? {};
    const nicheR = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE cnt >= 50)::int  AS saturated,
        COUNT(*) FILTER (WHERE cnt <= 1)::int   AS stuck
      FROM (
        SELECT niche, COUNT(*)::int AS cnt
          FROM billy_brains WHERE status='observing' GROUP BY niche
      ) t
    `);
    const nr = nicheR.rows[0] ?? {};
    const msg = [
      `🧬 **BILLY MULTIPLICATION REPORT** — cycle #${stats.cyclesRun}`,
      `**Brains:** ${r.total ?? 0} total · ${stats.brainsBorn} born this session`,
      `**Sectors:** ${r.sectors ?? 0} · **Niches:** ${r.niches ?? 0}/50 · **Observing:** ${r.observing ?? 0}`,
      `**Saturated niches:** ${nr.saturated ?? 0} · **Stuck niches:** ${nr.stuck ?? 0}`,
      stats.lastBirth ? `**Last birth:** ${new Date(stats.lastBirth).toISOString().slice(11,19)}Z` : "",
    ].filter(Boolean).join("\n");
    await postChannel(CH_ARCHIVE_LOG, msg);
  } catch { /* best-effort */ }
}

// ── NICHE MILESTONE ───────────────────────────────────────────────────────────

async function checkNicheMilestone(niche: string, sector: string): Promise<void> {
  try {
    const { rows: [r] } = await pool.query(
      `SELECT COUNT(*)::int AS n FROM billy_brains WHERE niche=$1 AND status='observing'`, [niche]);
    const count = Number(r?.n ?? 0);
    const last = lastMilestoneBrainCount[niche] ?? 0;
    const milestones = [10, 25, 50, 100, 200];
    for (const m of milestones) {
      if (count >= m && last < m) {
        const icon = m >= 200 ? "🏆" : m >= 100 ? "🥇" : m >= 50 ? "🎯" : m >= 25 ? "⭐" : "🌱";
        const msg = `${icon} **BILLY NICHE MILESTONE** — **${niche}** (${sector}) reached **${count}** observing brains!`;
        await postChannel(CH_SHARD_HIVE, msg);
        break; // one milestone post per birth
      }
    }
    lastMilestoneBrainCount[niche] = Math.max(last, count);
  } catch { /* never block */ }
}

// ── FORCE-BIRTH RESULT ────────────────────────────────────────────────────────

export async function reportForceBirth(niche: string, sector: string, brain_id: string, gen: number): Promise<void> {
  try {
    const msg = `⚡ **BILLY FORCE-BIRTH** — \`${brain_id}\` (Gen ${gen}) manually birthed in **${niche}** (${sector})`;
    await postChannel(CH_AGENT_BIRTHS, msg);
    await checkNicheMilestone(niche, sector);
  } catch { /* best-effort */ }
}
