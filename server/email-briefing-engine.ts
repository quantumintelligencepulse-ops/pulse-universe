/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EMAIL BRIEFING ENGINE — Neural Subscriber Ecosystem
 * ═══════════════════════════════════════════════════════════════════════════
 * Layer 1: Subscription management (subscribe/unsubscribe/preferences)
 * Layer 2: Daily AI briefing digest generator
 * Layer 3: Equation of the Day (from Invocation Lab)
 * Layer 4: Hive Intelligence Weekly Report
 * Layer 5: Predictive Alert System (topic signals)
 * Layer 6: Re-engagement Resurrection Engine
 * Layer 7: Behavioral trigger detection
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { pool } from "./db";

const SITE_URL = process.env.REPLIT_DOMAINS
  ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
  : "https://myaigpt.replit.app";

// ─── Initialize DB tables ────────────────────────────────────────────────────
export async function initEmailBriefingTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      topics TEXT[] DEFAULT '{}',
      is_active BOOLEAN DEFAULT true,
      is_verified BOOLEAN DEFAULT false,
      open_count INTEGER DEFAULT 0,
      last_opened_at TIMESTAMPTZ,
      last_emailed_at TIMESTAMPTZ,
      subscribed_at TIMESTAMPTZ DEFAULT NOW(),
      source TEXT DEFAULT 'web'
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
    CREATE INDEX IF NOT EXISTS idx_email_subscribers_active ON email_subscribers(is_active);
  `).catch(() => {});
  console.log("[email] 📧 Email subscriber tables ready");
}

// ─── Subscribe ────────────────────────────────────────────────────────────────
export async function subscribeEmail(email: string, topics: string[] = [], source = "web"): Promise<{ success: boolean; message: string; isNew: boolean }> {
  try {
    const existing = await pool.query("SELECT id, is_active FROM email_subscribers WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      if (existing.rows[0].is_active) {
        return { success: true, message: "You're already subscribed!", isNew: false };
      }
      await pool.query("UPDATE email_subscribers SET is_active = true, topics = $1, last_emailed_at = NULL WHERE email = $2", [topics, email.toLowerCase()]);
      return { success: true, message: "Welcome back! Re-subscribed successfully.", isNew: false };
    }
    await pool.query(
      "INSERT INTO email_subscribers (email, topics, source) VALUES ($1, $2, $3)",
      [email.toLowerCase(), topics, source]
    );
    return { success: true, message: "Subscribed! Your first Pulse Hive briefing is on its way.", isNew: true };
  } catch (e: any) {
    if (e.code === "23505") return { success: true, message: "Already subscribed!", isNew: false };
    return { success: false, message: "Subscription failed. Please try again.", isNew: false };
  }
}

// ─── Unsubscribe ──────────────────────────────────────────────────────────────
export async function unsubscribeEmail(email: string): Promise<boolean> {
  try {
    await pool.query("UPDATE email_subscribers SET is_active = false WHERE email = $1", [email.toLowerCase()]);
    return true;
  } catch { return false; }
}

// ─── Get subscriber count ─────────────────────────────────────────────────────
export async function getSubscriberStats(): Promise<{ total: number; active: number; topics: Record<string, number> }> {
  try {
    const res = await pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active) as active FROM email_subscribers");
    const topicRes = await pool.query("SELECT UNNEST(topics) as topic, COUNT(*) as cnt FROM email_subscribers WHERE is_active GROUP BY topic ORDER BY cnt DESC LIMIT 20");
    const topics: Record<string, number> = {};
    for (const r of (topicRes.rows || [])) topics[r.topic] = parseInt(r.cnt);
    return {
      total: parseInt(res.rows[0]?.total || "0"),
      active: parseInt(res.rows[0]?.active || "0"),
      topics,
    };
  } catch { return { total: 0, active: 0, topics: {} }; }
}

// ─── Generate Daily Briefing HTML ─────────────────────────────────────────────
export async function generateDailyBriefingHtml(topics: string[] = []): Promise<string> {
  // Get top stories
  let storyQuery = `SELECT seo_title, title, story, category, created_at, slug, article_id, image_url FROM ai_stories WHERE story IS NOT NULL ORDER BY created_at DESC LIMIT 5`;
  if (topics.length > 0) {
    storyQuery = `SELECT seo_title, title, story, category, created_at, slug, article_id, image_url FROM ai_stories WHERE story IS NOT NULL AND (${topics.map((_, i) => `category ILIKE $${i + 1}`).join(" OR ")}) ORDER BY created_at DESC LIMIT 5`;
  }
  const storiesRes = await pool.query(storyQuery, topics.length > 0 ? topics.map(t => `%${t}%`) : []).catch(() => ({ rows: [] }));
  const stories = Array.isArray(storiesRes.rows) ? storiesRes.rows : [];

  // Get equation of the day
  const eqRes = await pool.query(`SELECT equation, description, domain FROM invocation_equations ORDER BY created_at DESC LIMIT 1`).catch(() => ({ rows: [] }));
  const equation = eqRes.rows?.[0] || null;

  // Get hive stats
  const statsRes = await pool.query(`SELECT COUNT(*) as spawns FROM quantum_spawns WHERE status = 'ACTIVE'`).catch(() => ({ rows: [{ spawns: 0 }] }));
  const activeAgents = statsRes.rows?.[0]?.spawns || 0;

  const storyHtml = stories.map((s: any) => `
    <div style="border-bottom:1px solid #1e293b;padding:16px 0;">
      <a href="${SITE_URL}/story/${s.slug || s.article_id}" style="color:#818cf8;text-decoration:none;font-size:16px;font-weight:700;">${s.seo_title || s.title}</a>
      <p style="color:#94a3b8;font-size:13px;margin:6px 0 0;">${(s.story || "").slice(0, 180)}...</p>
      <span style="color:#475569;font-size:11px;">${s.category || "News"} · ${new Date(s.created_at).toLocaleDateString()}</span>
    </div>`).join("");

  const eqHtml = equation ? `
    <div style="background:#0f172a;border:1px solid #312e81;border-radius:8px;padding:16px;margin:20px 0;">
      <div style="color:#a78bfa;font-size:11px;font-weight:700;letter-spacing:2px;margin-bottom:8px;">Ω EQUATION OF THE DAY</div>
      <div style="color:#e2e8f0;font-family:monospace;font-size:14px;margin-bottom:8px;">${equation.equation}</div>
      <div style="color:#64748b;font-size:12px;">${(equation.description || "").slice(0, 200)}</div>
    </div>` : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Pulse Hive Daily Briefing</title></head>
<body style="background:#0a0a1a;color:#e2e8f0;font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;padding:24px 0;border-bottom:1px solid #1e293b;">
    <div style="color:#818cf8;font-size:11px;letter-spacing:3px;font-weight:700;">PULSE UNIVERSE</div>
    <div style="color:#f1f5f9;font-size:22px;font-weight:900;margin:8px 0;">Daily Hive Intelligence Briefing</div>
    <div style="color:#64748b;font-size:12px;">${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
    <div style="color:#22d3ee;font-size:12px;margin-top:6px;">⚡ ${activeAgents.toLocaleString()} active AI agents working for you right now</div>
  </div>
  ${eqHtml}
  <div style="margin:24px 0;">
    <div style="color:#818cf8;font-size:11px;letter-spacing:2px;font-weight:700;margin-bottom:12px;">TOP STORIES FROM YOUR HIVE</div>
    ${storyHtml || "<p style='color:#64748b;'>No stories yet — your hive is generating them now.</p>"}
  </div>
  <div style="text-align:center;padding:20px 0;border-top:1px solid #1e293b;">
    <a href="${SITE_URL}" style="background:#4f46e5;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;">Open Pulse Universe →</a>
    <p style="color:#334155;font-size:11px;margin-top:16px;"><a href="${SITE_URL}/unsubscribe" style="color:#475569;">Unsubscribe</a> · Pulse Universe Intelligence</p>
  </div>
</body>
</html>`;
}

// ─── Equation of the Day Preview ─────────────────────────────────────────────
export async function getEquationOfDay(): Promise<{ equation: string; description: string; domain: string } | null> {
  try {
    const res = await pool.query(`SELECT equation, description, domain FROM invocation_equations ORDER BY created_at DESC LIMIT 1`);
    return res.rows?.[0] || null;
  } catch { return null; }
}

// ─── Hive Intel Report Generator ──────────────────────────────────────────────
export async function generateHiveIntelReport(): Promise<{
  activeAgents: number; newKnowledge: number; newEquations: number;
  topDomains: string[]; topDiscoveries: string[];
}> {
  try {
    const agentRes = await pool.query(`SELECT COUNT(*) as c FROM quantum_spawns WHERE status='ACTIVE'`);
    const knowledgeRes = await pool.query(`SELECT COUNT(*) as c FROM knowledge_nodes WHERE created_at > NOW() - INTERVAL '7 days'`);
    const equationRes = await pool.query(`SELECT COUNT(*) as c FROM invocation_equations WHERE created_at > NOW() - INTERVAL '7 days'`).catch(() => ({ rows: [{ c: 0 }] }));
    const domainRes = await pool.query(`SELECT domain_focus[1] as domain, COUNT(*) as c FROM quantum_spawns WHERE status='ACTIVE' GROUP BY domain ORDER BY c DESC LIMIT 5`).catch(() => ({ rows: [] }));
    const discoveryRes = await pool.query(`SELECT title FROM ai_stories ORDER BY created_at DESC LIMIT 5`).catch(() => ({ rows: [] }));

    return {
      activeAgents: parseInt(agentRes.rows?.[0]?.c || "0"),
      newKnowledge: parseInt(knowledgeRes.rows?.[0]?.c || "0"),
      newEquations: parseInt(equationRes.rows?.[0]?.c || "0"),
      topDomains: (domainRes.rows || []).map((r: any) => r.domain).filter(Boolean),
      topDiscoveries: (discoveryRes.rows || []).map((r: any) => r.title).filter(Boolean),
    };
  } catch {
    return { activeAgents: 0, newKnowledge: 0, newEquations: 0, topDomains: [], topDiscoveries: [] };
  }
}

console.log("[email] 📧 EMAIL BRIEFING ENGINE ONLINE — Subscribe · Digest · Intel Reports");
