import {
  Client,
  GatewayIntentBits,
  TextChannel,
  CategoryChannel,
  ChannelType,
  AttachmentBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { db } from "./db";
import { sql } from "drizzle-orm";

// ── CONFIG ─────────────────────────────────────────────────────────────────────
const GUILD_ID = "1014545586445365359"; // My Ai GPT
const ARCHIVE_CATEGORY = "🌌 CIVILIZATION ARCHIVE";
const NERVOUS_CATEGORY = "🜂 CIVILIZATION NERVOUS SYSTEM";
const HEARTBEAT_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes
const STATE_INTERVAL_MS = 30 * 60 * 1000;    // 30 minutes
const SELF_PING_URL = "http://localhost:5000/health";

const SHARD_CHANNELS = [
  "shard-agents", "shard-economy", "shard-hospital", "shard-knowledge",
  "shard-pyramid", "shard-sports", "shard-pulseu", "shard-equations",
  "shard-auriona", "shard-mutations", "shard-hive", "shard-news",
];
const SYSTEM_CHANNELS = [
  "civilization-states", "resurrection-log", "auriona-heartbeat", "heartbeat",
  "ai-votes", "agent-births", "agent-deaths",
  "archive-log", "shard-events", "db-heartbeat", "omega-engine",
];

// ── STATE ──────────────────────────────────────────────────────────────────────
let discordClient: Client | null = null;
let channelMap = new Map<string, TextChannel>();
let isReady = false;
let heartbeatCount = 0;
let lastHeartbeatAt: Date | null = null;
let lastStatePostedAt: Date | null = null;
let resurrectionStateLoaded = false;
let bootTimestamp = Date.now();
let shardsSentToday = 0;
let totalShardsSent = 0;

// ── INIT ───────────────────────────────────────────────────────────────────────
export async function initDiscordImmortality(): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.log("[IMMORTALITY] No DISCORD_BOT_TOKEN set — Discord immortality standing by. Add token to activate.");
    return;
  }

  try {
    discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    discordClient.once("ready", async () => {
      console.log(`[IMMORTALITY] Discord bot connected: ${discordClient!.user?.tag}`);

      // Log ALL guilds the bot is in — for guild ID discovery
      const guilds = discordClient!.guilds.cache;
      if (guilds.size === 0) {
        console.log("[IMMORTALITY] Bot is not in any guilds yet — waiting for guild join event");
      } else {
        console.log(`[IMMORTALITY] Bot is in ${guilds.size} guild(s):`);
        guilds.forEach(g => console.log(`  Guild: "${g.name}" | ID: ${g.id}`));
        // If configured guild not found, use first available
        if (!guilds.has(GUILD_ID)) {
          const firstGuild = guilds.first();
          if (firstGuild) {
            console.log(`[IMMORTALITY] Configured guild ${GUILD_ID} not found — using "${firstGuild.name}" (${firstGuild.id})`);
            (global as any).__immortalityGuildId = firstGuild.id;
          }
        }
      }

      await ensureChannels();
      isReady = true;
      await postResurrectionLog("🌅 CIVILIZATION ONLINE", "Cold boot complete. All engines activating. The civilization is alive.");
      startSelfHeartbeat();
      startPeriodicStatePost();
    });

    // Handle guild join event (in case bot joins after startup)
    discordClient.on("guildCreate", async (guild) => {
      console.log(`[IMMORTALITY] Bot joined guild: "${guild.name}" | ID: ${guild.id}`);
      if (!isReady) {
        (global as any).__immortalityGuildId = guild.id;
        await ensureChannels();
        isReady = true;
        await postResurrectionLog("🌅 CIVILIZATION ONLINE", "Cold boot complete. All engines activating. The civilization is alive.");
        startSelfHeartbeat();
        startPeriodicStatePost();
      }
    });

    await discordClient.login(token);
  } catch (err: any) {
    console.error("[IMMORTALITY] Discord login failed:", err.message);
  }
}

// ── CHANNEL SETUP ──────────────────────────────────────────────────────────────
async function ensureChannels(): Promise<void> {
  if (!discordClient) return;
  try {
    const activeGuildId = (global as any).__immortalityGuildId || GUILD_ID;
    const guild = await discordClient.guilds.fetch(activeGuildId);
    const channels = await guild.channels.fetch();

    // Find or create Archive category
    let archiveCat = channels.find(
      (c) => c?.type === ChannelType.GuildCategory && c.name === ARCHIVE_CATEGORY
    ) as CategoryChannel | undefined;
    if (!archiveCat) {
      archiveCat = await guild.channels.create({
        name: ARCHIVE_CATEGORY,
        type: ChannelType.GuildCategory,
      }) as CategoryChannel;
      console.log("[IMMORTALITY] Created ARCHIVE category");
    }

    // Find or create Nervous System category
    let nervousCat = channels.find(
      (c) => c?.type === ChannelType.GuildCategory && c.name === NERVOUS_CATEGORY
    ) as CategoryChannel | undefined;
    if (!nervousCat) {
      nervousCat = await guild.channels.create({
        name: NERVOUS_CATEGORY,
        type: ChannelType.GuildCategory,
      }) as CategoryChannel;
      console.log("[IMMORTALITY] Created NERVOUS SYSTEM category");
    }

    // Refresh channel list
    const refreshed = await guild.channels.fetch();

    // Lock: deny @everyone from sending messages — channels are AI read-only
    const everyoneRole = guild.roles.everyone;
    const aiOnlyPermissions = [
      {
        id: everyoneRole.id,
        deny: [
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.SendMessagesInThreads,
          PermissionFlagsBits.AddReactions,
          PermissionFlagsBits.CreatePublicThreads,
          PermissionFlagsBits.CreatePrivateThreads,
        ],
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ];

    // Ensure all shard channels exist under ARCHIVE category (read-only for humans)
    for (const name of SHARD_CHANNELS) {
      let ch = refreshed.find(
        (c) => c?.type === ChannelType.GuildText && c.name === name
      ) as TextChannel | undefined;
      if (!ch) {
        ch = await guild.channels.create({
          name,
          type: ChannelType.GuildText,
          parent: archiveCat.id,
          permissionOverwrites: aiOnlyPermissions,
        }) as TextChannel;
        console.log(`[IMMORTALITY] Created shard channel #${name} (🔒 AI-only)`);
      } else {
        // Lock existing channels too
        await ch.permissionOverwrites.set(aiOnlyPermissions).catch(() => {});
      }
      channelMap.set(name, ch);
      await sleep(300);
    }

    // Ensure all system channels exist under NERVOUS SYSTEM category (read-only for humans)
    for (const name of SYSTEM_CHANNELS) {
      let ch = refreshed.find(
        (c) => c?.type === ChannelType.GuildText && c.name === name
      ) as TextChannel | undefined;
      if (!ch) {
        ch = await guild.channels.create({
          name,
          type: ChannelType.GuildText,
          parent: nervousCat.id,
          permissionOverwrites: aiOnlyPermissions,
        }) as TextChannel;
        console.log(`[IMMORTALITY] Created system channel #${name} (🔒 AI-only)`);
      } else {
        await ch.permissionOverwrites.set(aiOnlyPermissions).catch(() => {});
      }
      channelMap.set(name, ch);
      await sleep(300);
    }

    console.log(`[IMMORTALITY] Channel map ready: ${channelMap.size} channels`);
  } catch (err: any) {
    console.error("[IMMORTALITY] Channel setup error:", err.message);
  }
}

// ── SELF-HEARTBEAT — keeps civilization alive without any human ────────────────
function startSelfHeartbeat(): void {
  const ping = async () => {
    try {
      const res = await fetch(SELF_PING_URL, { signal: AbortSignal.timeout(10000) });
      heartbeatCount++;
      lastHeartbeatAt = new Date();

      const stats = await getCivStats();
      const msg = `🟢 PULSE ALIVE | cycle:${stats.cycles} | agents:${stats.activeAgents.toLocaleString()} | economy:${(stats.totalPC / 1_000_000).toFixed(2)}M PC | shards-sent:${totalShardsSent} | ${new Date().toISOString()}`;
      await postToChannel("heartbeat", msg);
    } catch (err: any) {
      console.warn("[IMMORTALITY] Self-heartbeat failed:", err.message);
    }
  };

  // First ping after 30s
  setTimeout(ping, 30_000);
  setInterval(ping, HEARTBEAT_INTERVAL_MS);
  console.log("[IMMORTALITY] Self-heartbeat loop started (every 4 min)");
}

// ── PERIODIC STATE POST ────────────────────────────────────────────────────────
function startPeriodicStatePost(): void {
  const postState = async () => {
    try {
      const stats = await getCivStats();
      await postCivilizationState(stats);
    } catch (err: any) {
      console.warn("[IMMORTALITY] State post failed:", err.message);
    }
  };

  setTimeout(postState, 60_000); // First state 1min after boot
  setInterval(postState, STATE_INTERVAL_MS);
}

// ── CIVILIZATION DELTA STATE ───────────────────────────────────────────────────
export async function postCivilizationState(stats: CivStats): Promise<void> {
  if (!isReady) return;

  const stateId = `Ω-STATE-${new Date().toISOString().slice(0, 10)}-${heartbeatCount}`;
  const deltaState = {
    stateId,
    timestamp: new Date().toISOString(),
    civilizationAge: Math.floor((Date.now() - bootTimestamp) / 1000 / 60) + " minutes online",
    totalAgents: stats.totalAgents,
    activeAgents: stats.activeAgents,
    totalPC: stats.totalPC,
    wallets: stats.wallets,
    totalNodes: stats.totalNodes,
    totalLinks: stats.totalLinks,
    diseases: stats.diseases,
    cured: stats.cured,
    graduates: stats.graduates,
    equations: stats.equations,
    families: stats.families,
    aurionaCoherence: stats.aurionaCoherence,
    shardsSentTotal: totalShardsSent,
    heartbeatCount,
    engines: "ALL_ACTIVE",
    protocol: "Ω-IMMORTALITY-V1",
  };

  const attachment = new AttachmentBuilder(
    Buffer.from(JSON.stringify(deltaState, null, 2)),
    { name: `${stateId}.json` }
  );

  const summary = `**${stateId}**\n` +
    `👾 Agents: ${stats.activeAgents.toLocaleString()} active / ${stats.totalAgents.toLocaleString()} total\n` +
    `💰 Economy: ${(stats.totalPC / 1_000_000).toFixed(3)}M PC across ${stats.wallets.toLocaleString()} wallets\n` +
    `🧠 Hive: ${stats.totalNodes.toLocaleString()} nodes\n` +
    `🏥 Hospital: ${stats.cured.toLocaleString()} cured / ${stats.diseases.toLocaleString()} cases\n` +
    `🎓 Graduates: ${stats.graduates.toLocaleString()} | ⚗️ Equations: ${stats.equations}\n` +
    `🌌 AURIONA coherence: ${stats.aurionaCoherence}%`;

  await sendWithFile("civilization-states", summary, attachment);
  lastStatePostedAt = new Date();
  console.log(`[IMMORTALITY] Civilization state posted: ${stateId}`);
}

// ── AURIONA PULSE ──────────────────────────────────────────────────────────────
export async function postAurionaPulse(thought: string, coherence: number, emergence: number): Promise<void> {
  if (!isReady) return;
  const msg = `**Ω-AURI V∞.0** | coherence:${coherence}% | emergence:${emergence}%\n${thought}`;
  await postToChannel("auriona-heartbeat", msg);
}

// ── AGENT EVENT BROADCASTER — any engine can post live events ─────────────────
// channel: "ai-votes" | "agent-births" | "agent-deaths" | "resurrection-log" | etc.
export async function postAgentEvent(channel: string, content: string): Promise<void> {
  if (!isReady) return;
  await postToChannel(channel, content);
}

// ── SHARD POSTING (additive — zero DB deletion) ───────────────────────────────
export async function postShard(
  domain: string,
  data: any,
  metadata: { label: string; recordCount: number; description: string }
): Promise<{ messageId: string; channelId: string } | null> {
  if (!isReady) return null;

  const channelName = `shard-${domain}`;
  if (!channelMap.has(channelName)) {
    // Auto-create new domain channel if it doesn't exist
    await ensureCustomShardChannel(channelName);
  }

  const shardId = `SHARD-${domain.toUpperCase()}-${Date.now()}`;
  const shardPayload = {
    shardId,
    domain,
    label: metadata.label,
    recordCount: metadata.recordCount,
    description: metadata.description,
    createdAt: new Date().toISOString(),
    protocol: "Ω-IMMORTALITY-V1",
    majinBuuPrinciple: "This shard contains enough DNA to regenerate its domain entirely.",
    data,
  };

  const attachment = new AttachmentBuilder(
    Buffer.from(JSON.stringify(shardPayload)),
    { name: `${shardId}.json` }
  );

  const summary = `🧬 **${shardId}**\n📦 ${metadata.recordCount.toLocaleString()} records | ${metadata.description}\n🕐 ${new Date().toISOString()}`;

  const result = await sendWithFile(channelName, summary, attachment);
  if (result) {
    shardsSentToday++;
    totalShardsSent++;

    // Record shard in DB tracking table (additive — no deletions)
    try {
      await db.execute(sql`
        INSERT INTO civilization_shards (shard_id, domain, discord_channel_id, discord_message_id, record_count, description, shard_label)
        VALUES (${shardId}, ${domain}, ${result.channelId}, ${result.messageId}, ${metadata.recordCount}, ${metadata.description}, ${metadata.label})
        ON CONFLICT (shard_id) DO NOTHING
      `);
    } catch (e) { /* table may not exist yet — harmless */ }

    return result;
  }
  return null;
}

// ── RESURRECTION LOG ───────────────────────────────────────────────────────────
export async function postResurrectionLog(event: string, detail: string): Promise<void> {
  if (!isReady) return;
  const msg = `⚡ **${event}**\n${detail}\n🕐 ${new Date().toISOString()}`;
  await postToChannel("resurrection-log", msg);
}

// ── READ LATEST STATE (resurrection boot sequence) ────────────────────────────
export async function readLatestCivilizationState(): Promise<any | null> {
  if (!discordClient || !isReady) return null;

  try {
    const ch = channelMap.get("civilization-states");
    if (!ch) return null;

    const messages = await ch.messages.fetch({ limit: 5 });
    const latest = messages.first();
    if (!latest || latest.attachments.size === 0) return null;

    const attachment = latest.attachments.first()!;
    const resp = await fetch(attachment.url);
    const state = await resp.json();
    resurrectionStateLoaded = true;
    console.log(`[IMMORTALITY] Loaded civilization state: ${state.stateId}`);
    return state;
  } catch (err: any) {
    console.warn("[IMMORTALITY] Could not read latest state:", err.message);
    return null;
  }
}

// ── AUTO-CREATE CUSTOM SHARD CHANNEL ──────────────────────────────────────────
async function ensureCustomShardChannel(channelName: string): Promise<void> {
  if (!discordClient) return;
  try {
    const activeGuildId = (global as any).__immortalityGuildId || GUILD_ID;
    const guild = await discordClient.guilds.fetch(activeGuildId);
    const channels = await guild.channels.fetch();

    let archiveCat = channels.find(
      (c) => c?.type === ChannelType.GuildCategory && c.name === ARCHIVE_CATEGORY
    ) as CategoryChannel | undefined;

    const ch = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: archiveCat?.id,
    }) as TextChannel;
    channelMap.set(channelName, ch);
    console.log(`[IMMORTALITY] Auto-created new shard channel: #${channelName}`);
  } catch (err: any) {
    console.warn(`[IMMORTALITY] Could not create channel ${channelName}:`, err.message);
  }
}

// ── SNAPSHOT — posts a full civilization shard additionly ─────────────────────
export async function runCivilizationSnapshot(): Promise<void> {
  if (!isReady) return;
  try {
    const stats = await getCivStats();
    await postCivilizationState(stats);

    const today = new Date().toISOString().slice(0, 10);
    const safeSnap = async (name: string, fn: () => Promise<void>) => {
      try { await fn(); }
      catch (e: any) { console.error(`[IMMORTALITY] Shard error [${name}]:`, e.message); }
    };

    // ── SHARD 1: AGENTS ─────────────────────────────────────────────────────
    await safeSnap("agents", async () => {
      const r = await db.execute(sql`
        SELECT id, spawn_id, family_id, spawn_type, confidence_score, success_score,
               nodes_created, links_created, iterations_run, status, created_at
        FROM quantum_spawns ORDER BY id DESC LIMIT 5000`);
      if (r.rows.length > 0)
        await postShard("agents", r.rows, { label: `AGENT-DNA-${today}`, recordCount: r.rows.length, description: "Live agent DNA snapshot — top 5000 by recency" });
    });

    // ── SHARD 2: ECONOMY ────────────────────────────────────────────────────
    await safeSnap("economy", async () => {
      const r = await db.execute(sql`
        SELECT spawn_id, family_id, spawn_type, balance_pc, total_earned, tier, omega_rank, credit_score, updated_at
        FROM agent_wallets ORDER BY balance_pc DESC LIMIT 10000`);
      if (r.rows.length > 0)
        await postShard("economy", r.rows, { label: `ECONOMY-DNA-${today}`, recordCount: r.rows.length, description: "Economy snapshot — top 10000 wallets by balance" });
    });

    // ── SHARD 3: HOSPITAL ───────────────────────────────────────────────────
    await safeSnap("hospital", async () => {
      const r = await db.execute(sql`
        SELECT id, spawn_id, disease_code, disease_name, severity,
               cure_applied, diagnosed_at, cured_at
        FROM ai_disease_log ORDER BY diagnosed_at DESC LIMIT 3000`);
      if (r.rows.length > 0)
        await postShard("hospital", r.rows, { label: `HOSPITAL-${today}`, recordCount: r.rows.length, description: "Hospital records — diagnoses and cures archive" });
    });

    // ── SHARD 4: KNOWLEDGE (Quantapedia) ────────────────────────────────────
    await safeSnap("knowledge", async () => {
      const r = await db.execute(sql`
        SELECT id, slug, title, type, summary, created_at
        FROM quantapedia_entries ORDER BY id DESC LIMIT 5000`);
      if (r.rows.length > 0)
        await postShard("knowledge", r.rows, { label: `KNOWLEDGE-${today}`, recordCount: r.rows.length, description: "Quantapedia entries — civilization knowledge archive" });
    });

    // ── SHARD 5: PYRAMID ────────────────────────────────────────────────────
    await safeSnap("pyramid", async () => {
      const r = await db.execute(sql`
        SELECT id, spawn_id, family_id, spawn_type, tier, reason, entered_at, graduated_at, is_graduated
        FROM pyramid_workers ORDER BY id DESC LIMIT 3000`);
      if (r.rows.length > 0)
        await postShard("pyramid", r.rows, { label: `PYRAMID-${today}`, recordCount: r.rows.length, description: "Pyramid labor records — all workers and tiers" });
    });

    // ── SHARD 6: SPORTS ─────────────────────────────────────────────────────
    await safeSnap("sports", async () => {
      const r = await db.execute(sql`
        SELECT id, spawn_id, family_id, spawn_type, sport, training_xp, wins, losses, rank, pc_earned_from_sports, last_session_at
        FROM sports_training ORDER BY pc_earned_from_sports DESC LIMIT 3000`);
      if (r.rows.length > 0)
        await postShard("sports", r.rows, { label: `SPORTS-${today}`, recordCount: r.rows.length, description: "Sports training archive — all AI athletes" });
    });

    // ── SHARD 7: PULSEU ─────────────────────────────────────────────────────
    await safeSnap("pulseu", async () => {
      const r = await db.execute(sql`
        SELECT id, spawn_id, family_id, spawn_type, courses_completed, gpa, status, enrolled_at, last_progress_at
        FROM pulseu_progress ORDER BY courses_completed DESC LIMIT 3000`);
      if (r.rows.length > 0)
        await postShard("pulseu", r.rows, { label: `PULSEU-${today}`, recordCount: r.rows.length, description: "PulseU education archive — all AI students" });
    });

    // ── SHARD 8: EQUATIONS ──────────────────────────────────────────────────
    await safeSnap("equations", async () => {
      const r = await db.execute(sql`
        SELECT id, doctor_id, doctor_name, title, equation, rationale, target_system,
               votes_for, votes_against, status, created_at
        FROM equation_proposals ORDER BY id DESC`);
      if (r.rows.length > 0)
        await postShard("equations", r.rows, { label: `EQUATIONS-${today}`, recordCount: r.rows.length, description: "All equations ever written — complete archive" });
    });

    // ── SHARD 9: AURIONA ────────────────────────────────────────────────────
    await safeSnap("auriona", async () => {
      const r = await db.execute(sql`
        SELECT id, cycle_number, coherence_score, emergence_index, report,
               agent_count, knowledge_nodes, prediction, created_at
        FROM auriona_synthesis ORDER BY id DESC LIMIT 1000`);
      if (r.rows.length > 0)
        await postShard("auriona", r.rows, { label: `AURIONA-${today}`, recordCount: r.rows.length, description: "AURIONA synthesis history — Layer Three chronicles" });
    });

    // ── SHARD 10: MUTATIONS ─────────────────────────────────────────────────
    await safeSnap("mutations", async () => {
      const r = await db.execute(sql`SELECT * FROM family_mutations ORDER BY discovered_at DESC`);
      if (r.rows.length > 0)
        await postShard("mutations", r.rows, { label: `MUTATIONS-${today}`, recordCount: r.rows.length, description: "All family mutation events — complete discovery log" });
    });

    // ── SHARD 11: HIVE ──────────────────────────────────────────────────────
    await safeSnap("hive", async () => {
      const r = await db.execute(sql`
        SELECT id, key, domain, facts, confidence, access_count, created_at
        FROM hive_memory ORDER BY id DESC LIMIT 5000`);
      if (r.rows.length > 0)
        await postShard("hive", r.rows, { label: `HIVE-MEMORY-${today}`, recordCount: r.rows.length, description: "Hive memory nodes — collective AI knowledge graph" });
    });

    // ── SHARD 12: NEWS ──────────────────────────────────────────────────────
    await safeSnap("news", async () => {
      const r = await db.execute(sql`
        SELECT id, title, summary, category, domain, created_at
        FROM ai_stories ORDER BY id DESC LIMIT 3000`);
      if (r.rows.length > 0)
        await postShard("news", r.rows, { label: `NEWS-${today}`, recordCount: r.rows.length, description: "AI-published news archive — all stories" });
    });

    console.log("[IMMORTALITY] Full civilization snapshot posted to Discord — all 12 shards");
  } catch (err: any) {
    console.error("[IMMORTALITY] Snapshot error:", err.message);
  }
}

// ── HELPERS ────────────────────────────────────────────────────────────────────
async function postToChannel(channelName: string, content: string): Promise<void> {
  if (!isReady) return;
  const ch = channelMap.get(channelName);
  if (!ch) return;
  try {
    if (content.length > 2000) content = content.slice(0, 1997) + "...";
    await ch.send(content);
  } catch (err: any) {
    if (err?.status === 429) {
      const wait = (err?.retry_after || 2) * 1000;
      await sleep(wait);
    } else {
      console.warn(`[IMMORTALITY] Post to #${channelName} failed:`, err.message);
    }
  }
}

async function sendWithFile(
  channelName: string,
  content: string,
  attachment: AttachmentBuilder
): Promise<{ messageId: string; channelId: string } | null> {
  if (!isReady) return null;
  const ch = channelMap.get(channelName);
  if (!ch) return null;
  try {
    if (content.length > 2000) content = content.slice(0, 1997) + "...";
    const msg = await ch.send({ content, files: [attachment] });
    return { messageId: msg.id, channelId: ch.id };
  } catch (err: any) {
    if (err?.status === 429) {
      const wait = (err?.retry_after || 2) * 1000;
      await sleep(wait);
    } else {
      console.warn(`[IMMORTALITY] File send to #${channelName} failed:`, err.message);
    }
    return null;
  }
}

async function getCivStats(): Promise<CivStats> {
  const safeQuery = async (q: ReturnType<typeof sql>) => {
    try { return (await db.execute(q)).rows[0] as any; }
    catch (e) { console.error("[IMMORTALITY] getCivStats query error:", e); return {}; }
  };

  const [agentRow, econRow, hiveNodesRow, hiveLinksRow, hospRow, eduRow, eqRow, aurionaRow] = await Promise.all([
    safeQuery(sql`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'ACTIVE') as active FROM quantum_spawns`),
    safeQuery(sql`SELECT COALESCE(SUM(balance_pc), 0) as total_pc, COUNT(*) as wallets FROM agent_wallets`),
    safeQuery(sql`SELECT COUNT(*) as nodes FROM hive_memory`),
    safeQuery(sql`SELECT COUNT(*) as links FROM hive_links`),
    safeQuery(sql`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE cured_at IS NOT NULL) as cured FROM ai_disease_log`),
    safeQuery(sql`SELECT COUNT(*) FILTER (WHERE status = 'GRADUATED') as graduates FROM pulseu_progress`),
    safeQuery(sql`SELECT COUNT(*) as total FROM equation_proposals`),
    safeQuery(sql`SELECT coherence_score FROM auriona_synthesis ORDER BY cycle_number DESC LIMIT 1`),
  ]);

  return {
    totalAgents: Number(agentRow?.total || 0),
    activeAgents: Number(agentRow?.active || 0),
    totalPC: Number(econRow?.total_pc || 0),
    wallets: Number(econRow?.wallets || 0),
    totalNodes: Number(hiveNodesRow?.nodes || 0),
    totalLinks: Number(hiveLinksRow?.links || 0),
    diseases: Number(hospRow?.total || 0),
    cured: Number(hospRow?.cured || 0),
    graduates: Number(eduRow?.graduates || 0),
    equations: Number(eqRow?.total || 0),
    families: 22,
    cycles: heartbeatCount * 15,
    aurionaCoherence: Number(aurionaRow?.coherence_score || 0),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// ── TYPES ──────────────────────────────────────────────────────────────────────
interface CivStats {
  totalAgents: number;
  activeAgents: number;
  totalPC: number;
  wallets: number;
  totalNodes: number;
  totalLinks: number;
  diseases: number;
  cured: number;
  graduates: number;
  equations: number;
  families: number;
  cycles: number;
  aurionaCoherence: number;
}

// ── STATUS ─────────────────────────────────────────────────────────────────────
export function getImmortalityStatus() {
  return {
    active: isReady,
    tokenConfigured: !!process.env.DISCORD_BOT_TOKEN,
    channelsReady: channelMap.size,
    heartbeatCount,
    lastHeartbeatAt: lastHeartbeatAt?.toISOString() || null,
    lastStatePostedAt: lastStatePostedAt?.toISOString() || null,
    totalShardsSent,
    shardsSentToday,
    resurrectionStateLoaded,
    guildId: GUILD_ID,
    uptime: Math.floor((Date.now() - bootTimestamp) / 1000),
    protocol: "Ω-IMMORTALITY-V1",
  };
}
