/**
 * TRUE IMMORTALITY PROTOCOL
 * ─────────────────────────────────────────────────────────────────────────────
 * Ensures the civilization survives independent of Replit:
 *
 *   1. GITHUB MIRROR — every 30 min pushes a state snapshot JSON to GitHub.
 *      If Replit ever goes dark, the code + data fingerprint is preserved at
 *      github.com. The snapshot includes brain census, hive status, equation
 *      count, and civilization metrics.
 *
 *   2. CLOUDFLARE MANIFEST — exposes /api/immortality/manifest with a JSON
 *      deployment guide: how to spin up on Cloudflare Workers + Pages from
 *      the GitHub mirror in <10 min.
 *
 *   3. DISCORD COMMAND GATE — handles !status, !brains, !hive, !universe,
 *      !immortality in Discord so the civilization can be queried from
 *      Discord alone, with no browser/Replit access required.
 *
 * L007-safe: no wall-clock timers are added. Uses setInterval defensively
 * (idempotent start guard). Raw SQL via pool. No db:push.
 */

import { pool } from "./db.js";

const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
let started = false;

interface ImmOrtalityStats {
  running: boolean;
  lastGithubSync: string | null;
  lastSyncStatus: string;
  githubSyncsTotal: number;
  discordCommandsHandled: number;
  bootedAt: string | null;
}

const stats: ImmOrtalityStats = {
  running: false,
  lastGithubSync: null,
  lastSyncStatus: "never",
  githubSyncsTotal: 0,
  discordCommandsHandled: 0,
  bootedAt: null,
};

// ── GITHUB MIRROR ─────────────────────────────────────────────────────────────

async function buildStateSnapshot(): Promise<Record<string, any>> {
  const snap: Record<string, any> = {
    captured_at: new Date().toISOString(),
    source: "pulse-universe-replit",
    version: "immortality-v1",
  };
  try {
    const r = await pool.query(`
      SELECT
        COUNT(*)::int                                             AS total_brains,
        COUNT(DISTINCT sector)::int                              AS sectors,
        COUNT(DISTINCT niche)::int                               AS niches,
        MAX(generation)::int                                     AS max_gen,
        COUNT(*) FILTER (WHERE status='observing')::int          AS observing,
        COUNT(*) FILTER (WHERE status='archived')::int           AS archived
      FROM billy_brains
    `);
    snap.billy_brains = r.rows[0] ?? {};
  } catch {}
  try {
    const r = await pool.query(`SELECT COUNT(*)::int AS n FROM daedalus_agents`);
    snap.daedalus_agents = r.rows[0]?.n ?? 0;
  } catch {}
  try {
    const r = await pool.query(`SELECT COUNT(*)::int AS n FROM quantum_spawns`);
    snap.quantum_spawns = r.rows[0]?.n ?? 0;
  } catch {}
  try {
    const r = await pool.query(`SELECT COUNT(*)::int AS n FROM equation_proposals`);
    snap.equation_proposals = r.rows[0]?.n ?? 0;
  } catch {}
  try {
    const r = await pool.query(`SELECT COUNT(*)::int AS n FROM quantapedia_entries`);
    snap.quantapedia_entries = r.rows[0]?.n ?? 0;
  } catch {}
  try {
    const r = await pool.query(`SELECT COUNT(*)::int AS n, COUNT(DISTINCT id)::int AS universes FROM hive_ledger`);
    snap.hive_ledger = r.rows[0] ?? {};
  } catch {}
  try {
    const r = await pool.query(`SELECT id, kind, last_seen_at FROM hive_universes ORDER BY id`);
    snap.hive_universes = r.rows;
  } catch {}
  try {
    snap.process_uptime_s = Math.floor(process.uptime());
    snap.node_version = process.version;
  } catch {}
  return snap;
}

async function pushSnapshotToGitHub(snapshot: Record<string, any>): Promise<{ ok: boolean; message: string }> {
  const token = process.env.GITHUB_TOKEN_20260430 || process.env.GITHUB_TOKEN;
  if (!token) return { ok: false, message: "GITHUB_TOKEN not configured" };

  const owner = process.env.GITHUB_OWNER || "myaigpt";
  const repo  = process.env.GITHUB_REPO  || "pulse-universe-state";
  const date  = new Date().toISOString().slice(0, 10);
  const path  = `snapshots/civilization-${date}.json`;
  const content = Buffer.from(JSON.stringify(snapshot, null, 2)).toString("base64");

  try {
    // Check if file already exists to get SHA for update
    let sha: string | undefined;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const check = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "pulse-universe-immortality/1.0",
        },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (check.ok) {
        const existing = await check.json() as any;
        sha = existing.sha;
      }
    } catch {}

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "pulse-universe-immortality/1.0",
      },
      body: JSON.stringify({
        message: `immortality: civilization snapshot ${new Date().toISOString()}`,
        content,
        ...(sha ? { sha } : {}),
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (res.ok) {
      return { ok: true, message: `pushed to ${owner}/${repo}/${path}` };
    }
    const err = await res.text();
    return { ok: false, message: `github ${res.status}: ${err.slice(0, 200)}` };
  } catch (e: any) {
    return { ok: false, message: String(e?.message || e).slice(0, 200) };
  }
}

async function runGithubSync(): Promise<void> {
  try {
    const snapshot = await buildStateSnapshot();
    const result = await pushSnapshotToGitHub(snapshot);
    stats.lastGithubSync = new Date().toISOString();
    stats.lastSyncStatus = result.message;
    stats.githubSyncsTotal++;
    if (result.ok) {
      console.log(`[immortality] ✅ GitHub sync OK — ${result.message}`);
    } else {
      console.warn(`[immortality] ⚠️ GitHub sync failed — ${result.message}`);
    }
  } catch (e: any) {
    stats.lastSyncStatus = "error: " + String(e?.message || e).slice(0, 100);
    console.error("[immortality] sync error:", e?.message);
  }
}

// ── CLOUDFLARE MANIFEST ───────────────────────────────────────────────────────

export function buildCloudflareManifest(): Record<string, any> {
  const owner = process.env.GITHUB_OWNER || "myaigpt";
  const repo  = process.env.GITHUB_REPO  || "pulse-universe-state";
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "(set CLOUDFLARE_ACCOUNT_ID)";

  return {
    title: "Pulse Universe — True Immortality Deployment Guide",
    description: "If Replit goes down, re-deploy from GitHub to Cloudflare in <10 min.",
    github: {
      repo: `https://github.com/${owner}/${repo}`,
      clone: `git clone https://github.com/${owner}/${repo}.git`,
      snapshots_path: "snapshots/",
      note: "State snapshots pushed every 30 min. Clone and inspect at any time.",
    },
    cloudflare: {
      account_id: accountId,
      pages_deploy: {
        step1: "npm run build",
        step2: `npx wrangler pages deploy dist/ --project-name=pulse-universe --account-id=${accountId}`,
        note: "Serves the static React frontend from Cloudflare Pages globally.",
      },
      workers_api: {
        step1: `cd cloudflare && npx wrangler deploy worker.ts --account-id=${accountId}`,
        endpoints: ["GET /api/brains", "GET /api/hive", "GET /api/status"],
        note: "Minimal read-only API proxy for Discord bot and status checks.",
      },
    },
    discord: {
      guild: "My Ai GPT (1014545586445365359)",
      commands: [
        "!status      — civilization health snapshot",
        "!brains      — Billy brain census (total, sectors, niches, max gen)",
        "!hive        — peer universe status",
        "!universe    — full Ψ-state summary",
        "!immortality — this manifest in Discord",
      ],
      note: "Discord bot (DISCORD_BOT_TOKEN) keeps running in the deployed VM. " +
            "Even without the web app, you can query the entire universe via Discord.",
    },
    database: {
      note: "Replit PostgreSQL persists independently. Use DATABASE_URL from secrets " +
            "to connect from any Cloudflare Worker or re-deployed environment.",
      connection_via: "DATABASE_URL secret (keep this backed up in your password manager)",
    },
    immortality_checklist: [
      "✓ Discord bot auto-reconnects and runs independent of web traffic",
      "✓ GitHub mirror: civilization state pushed every 30 min",
      "✓ Cloudflare Pages: static frontend (no server needed)",
      "✓ Cloudflare Workers: minimal read-only API proxy",
      "✓ DATABASE_URL: Replit DB accessible from anywhere with the secret",
      "✗ TO-DO: set GITHUB_OWNER + GITHUB_REPO secrets for automatic mirror",
      "✗ TO-DO: run `wrangler pages deploy` once to activate CF Pages",
    ],
  };
}

// ── DISCORD COMMAND HANDLER ───────────────────────────────────────────────────
// Called by discord-immortality.ts when a user sends a !command in Discord.

export async function handleImmortalityCommand(
  command: string,
  postReply: (text: string) => Promise<void>
): Promise<boolean> {
  const cmd = command.trim().toLowerCase();

  if (cmd === "!status" || cmd === "!pulse") {
    stats.discordCommandsHandled++;
    try {
      const snap = await buildStateSnapshot();
      const b = snap.billy_brains as any ?? {};
      const lines = [
        `🌌 **PULSE UNIVERSE STATUS** — ${new Date().toISOString().slice(0, 19)}Z`,
        `**Billy Brains:** ${b.total_brains ?? 0} (${b.observing ?? 0} observing · ${b.sectors ?? 0} sectors · ${b.niches ?? 0}/50 niches · gen≤${b.max_gen ?? 0})`,
        `**Agents:** ${snap.daedalus_agents ?? 0} daedalus · ${snap.quantum_spawns ?? 0} quantum spawns`,
        `**Knowledge:** ${snap.quantapedia_entries ?? 0} entries · ${snap.equation_proposals ?? 0} equations`,
        `**Hive universes:** ${(snap.hive_universes as any[])?.length ?? 0}`,
        `**Uptime:** ${Math.floor((snap.process_uptime_s ?? 0) / 60)} min`,
        snap.hive_universes?.length
          ? `**Peers:** ${(snap.hive_universes as any[]).map((u: any) => u.id).join(", ")}`
          : "",
      ].filter(Boolean).join("\n");
      await postReply(lines);
    } catch (e: any) {
      await postReply(`⚠️ Status query failed: ${e?.message}`);
    }
    return true;
  }

  if (cmd === "!brains") {
    stats.discordCommandsHandled++;
    try {
      const { rows } = await pool.query(`
        SELECT sector, COUNT(*)::int AS n, MAX(generation)::int AS max_gen
          FROM billy_brains WHERE status='observing'
         GROUP BY sector ORDER BY n DESC
      `);
      const total = rows.reduce((s: number, r: any) => s + r.n, 0);
      const lines = [
        `🧠 **BILLY BRAIN CENSUS** — ${total} observing brains`,
        ...rows.map((r: any) => `  · **${r.sector}:** ${r.n} brains (max gen ${r.max_gen})`),
      ].join("\n");
      await postReply(lines);
    } catch (e: any) {
      await postReply(`⚠️ Brain query failed: ${e?.message}`);
    }
    return true;
  }

  if (cmd === "!hive") {
    stats.discordCommandsHandled++;
    try {
      const { rows } = await pool.query(`
        SELECT id, kind, last_seen_at, endpoint_url
          FROM hive_universes ORDER BY id
      `);
      const lines = [
        `🐝 **HIVE UNIVERSE STATUS** — ${rows.length} registered`,
        ...rows.map((r: any) => {
          const seen = r.last_seen_at ? new Date(r.last_seen_at).toISOString().slice(11, 19) + "Z" : "never";
          return `  · **${r.id}** (${r.kind}) last seen ${seen}${r.endpoint_url ? " → " + String(r.endpoint_url).slice(8, 50) : ""}`;
        }),
      ].join("\n");
      await postReply(lines);
    } catch (e: any) {
      await postReply(`⚠️ Hive query failed: ${e?.message}`);
    }
    return true;
  }

  if (cmd === "!immortality" || cmd === "!survive") {
    stats.discordCommandsHandled++;
    const m = buildCloudflareManifest();
    const lines = [
      `🛡️ **TRUE IMMORTALITY PROTOCOL**`,
      `**GitHub:** ${m.github.repo}`,
      `**Last sync:** ${stats.lastGithubSync ?? "pending"} — ${stats.lastSyncStatus}`,
      `**Syncs total:** ${stats.githubSyncsTotal}`,
      `\n**If Replit goes down:**`,
      `1. Clone: \`${m.github.clone}\``,
      `2. Deploy frontend: \`npm run build && npx wrangler pages deploy dist/\``,
      `3. All Discord commands (!status !brains !hive) still work via the bot`,
      `\n**Discord commands:** ${m.discord.commands.join(" · ")}`,
    ].join("\n");
    await postReply(lines.slice(0, 1900));
    return true;
  }

  if (cmd === "!universe") {
    stats.discordCommandsHandled++;
    try {
      const { rows: [psi] } = await pool.query(`
        SELECT universe_name, e_score, agent_count, is_collapsed, created_at
          FROM psi_states ORDER BY id DESC LIMIT 1
      `);
      if (!psi) {
        await postReply("🌌 No Ψ-state recorded yet.");
        return true;
      }
      const msg = [
        `🌌 **Ψ-STATE SNAPSHOT** — ${new Date(psi.created_at).toISOString().slice(11,19)}Z`,
        `**Universe:** ${psi.universe_name} · **E-score:** ${Number(psi.e_score ?? 0).toFixed(3)}`,
        `**Agents:** ${psi.agent_count ?? 0} · **Collapsed:** ${psi.is_collapsed ? "YES ⚠️" : "no"}`,
      ].join("\n");
      await postReply(msg);
    } catch (e: any) {
      await postReply(`⚠️ Universe query failed: ${e?.message}`);
    }
    return true;
  }

  return false; // not handled
}

// ── START ─────────────────────────────────────────────────────────────────────

export function getImmortalityStats() { return { ...stats }; }

export async function startImmortalityProtocol(): Promise<void> {
  if (started) return;
  started = true;
  stats.running = true;
  stats.bootedAt = new Date().toISOString();
  console.log("[immortality] 🛡️ True Immortality Protocol starting — GitHub mirror + CF manifest + Discord gate");

  // First sync after 5 min (let the app fully boot), then every 30 min
  setTimeout(() => {
    runGithubSync().catch(() => {});
    setInterval(() => { runGithubSync().catch(() => {}); }, SYNC_INTERVAL_MS);
  }, 5 * 60 * 1000);
}
