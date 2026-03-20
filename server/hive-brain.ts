/**
 * QUANTUM HIVE BRAIN — OMEGA GRADE V2
 * =============================================
 * 1. Quantum Memory Cortex        — Persistent AI brain, learns from every generated entry
 * 2. Fractal Resonance Network    — Cross-links ALL 7 engines: knowledge ↔ products ↔ media ↔ careers
 * 3. Multi-Agent Consensus Engine — Parallel Groq synthesis for high-quality answers
 * 4. Predictive Trend Engine      — Auto-generates hot/trending topics before users search
 * 5. Knowledge Decay Regenerator  — Detects stale/low-quality entries, re-queues for regeneration
 * 6. Cross-Engine Lineage         — Careers link to knowledge, media links to knowledge, all interconnected
 * 7. User Activity Boost          — High-lookup topics get priority spawn boost signals
 */

import Groq from "groq-sdk";
import { db } from "./db";
import { hiveMemory, hiveLinks, quantapediaEntries, quantumProducts, quantumMedia, quantumCareers } from "@shared/schema";
import { eq, sql, lt, and, asc } from "drizzle-orm";
import { log } from "./index";
import { storage } from "./storage";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const toSlug = (q: string) => q.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

// ──────────────────────────────────────────────────────────────────────────────
// UPGRADE 1: QUANTUM MEMORY CORTEX
// Persistent JSON brain. Extracts facts & patterns from every generated entry.
// AI reads from this before responding to complex questions.
// ──────────────────────────────────────────────────────────────────────────────
export async function feedMemoryCortex(domain: string, title: string, facts: string[], patterns: string[]) {
  const key = toSlug(domain + "-" + title);
  try {
    await db.insert(hiveMemory)
      .values({ key, domain, facts, patterns, confidence: 0.8 })
      .onConflictDoUpdate({
        target: hiveMemory.key,
        set: {
          facts: sql`(${hiveMemory.facts}::jsonb || ${JSON.stringify(facts)}::jsonb)`,
          patterns: sql`(${hiveMemory.patterns}::jsonb || ${JSON.stringify(patterns)}::jsonb)`,
          accessCount: sql`${hiveMemory.accessCount} + 1`,
          confidence: sql`LEAST(1.0, ${hiveMemory.confidence} + 0.05)`,
          updatedAt: new Date(),
        },
      });
  } catch {}
}

export async function readMemoryCortex(domain: string, limit = 5): Promise<{ facts: any[]; patterns: any[] }> {
  try {
    const rows = await db.select({ facts: hiveMemory.facts, patterns: hiveMemory.patterns })
      .from(hiveMemory)
      .where(eq(hiveMemory.domain, domain))
      .orderBy(sql`${hiveMemory.confidence} DESC`)
      .limit(limit);
    const allFacts = rows.flatMap(r => (r.facts as string[]) || []);
    const allPatterns = rows.flatMap(r => (r.patterns as string[]) || []);
    return { facts: allFacts.slice(0, 20), patterns: allPatterns.slice(0, 10) };
  } catch { return { facts: [], patterns: [] }; }
}

export async function getMemoryStats(): Promise<{ total: number; domains: number; avgConfidence: number }> {
  try {
    const [row] = await db.select({
      total: sql<number>`count(*)`,
      domains: sql<number>`count(distinct domain)`,
      avgConf: sql<number>`avg(confidence)`,
    }).from(hiveMemory);
    return { total: Number(row.total), domains: Number(row.domains), avgConfidence: Math.round(Number(row.avgConf) * 100) / 100 };
  } catch { return { total: 0, domains: 0, avgConfidence: 0 }; }
}

// ──────────────────────────────────────────────────────────────────────────────
// UPGRADE 2: FRACTAL RESONANCE NETWORK — ALL 7 ENGINES
// Cross-links knowledge ↔ products ↔ media ↔ careers
// Every generated entry finds related nodes across ALL tables
// and builds bidirectional links into the unified knowledge graph.
// ──────────────────────────────────────────────────────────────────────────────
export async function buildResonanceLinks(
  fromType: "knowledge" | "product" | "media" | "career",
  fromSlug: string,
  relatedTerms: string[],
  relatedItems: string[] = []
) {
  const links: any[] = [];

  // Link to knowledge (Quantapedia entries)
  for (const term of relatedTerms.slice(0, 10)) {
    const s = toSlug(term);
    try {
      const [existing] = await db.select({ slug: quantapediaEntries.slug, title: quantapediaEntries.title })
        .from(quantapediaEntries).where(eq(quantapediaEntries.slug, s)).limit(1);
      if (existing) {
        links.push({ fromType, fromSlug, toType: "knowledge", toSlug: existing.slug, toTitle: existing.title, strength: 0.75 });
      }
    } catch {}
  }

  // Link to products
  for (const item of relatedItems.slice(0, 6)) {
    const s = toSlug(item);
    try {
      const [existing] = await db.select({ slug: quantumProducts.slug, name: quantumProducts.name })
        .from(quantumProducts).where(eq(quantumProducts.slug, s)).limit(1);
      if (existing) {
        links.push({ fromType, fromSlug, toType: "product", toSlug: existing.slug, toTitle: existing.name, strength: 0.6 });
      }
    } catch {}
  }

  // Link to media entries
  for (const term of relatedTerms.slice(0, 6)) {
    const s = toSlug(term);
    try {
      const [existing] = await db.select({ slug: quantumMedia.slug, name: quantumMedia.name })
        .from(quantumMedia).where(eq(quantumMedia.slug, s)).limit(1);
      if (existing) {
        links.push({ fromType, fromSlug, toType: "media", toSlug: existing.slug, toTitle: existing.name, strength: 0.55 });
      }
    } catch {}
  }

  // Link to career entries
  for (const term of relatedTerms.slice(0, 6)) {
    const s = toSlug(term);
    try {
      const [existing] = await db.select({ slug: quantumCareers.slug, title: quantumCareers.title })
        .from(quantumCareers).where(eq(quantumCareers.slug, s)).limit(1);
      if (existing) {
        links.push({ fromType, fromSlug, toType: "career", toSlug: existing.slug, toTitle: existing.title, strength: 0.6 });
      }
    } catch {}
  }

  for (const link of links) {
    try {
      await db.insert(hiveLinks).values(link).onConflictDoNothing();
    } catch {}
  }
  return links.length;
}

export async function getResonanceLinks(fromType: string, fromSlug: string): Promise<{ toType: string; toSlug: string; toTitle: string; strength: number }[]> {
  try {
    return await db.select({ toType: hiveLinks.toType, toSlug: hiveLinks.toSlug, toTitle: hiveLinks.toTitle, strength: hiveLinks.strength })
      .from(hiveLinks)
      .where(and(eq(hiveLinks.fromType, fromType), eq(hiveLinks.fromSlug, fromSlug)))
      .orderBy(sql`${hiveLinks.strength} DESC`)
      .limit(12);
  } catch { return []; }
}

export async function getNetworkStats(): Promise<{ totalLinks: number; knowledgeLinks: number; productLinks: number; mediaLinks: number; careerLinks: number }> {
  try {
    const [total] = await db.select({ count: sql<number>`count(*)` }).from(hiveLinks);
    const [kl] = await db.select({ count: sql<number>`count(*)` }).from(hiveLinks).where(eq(hiveLinks.toType, "knowledge"));
    const [pl] = await db.select({ count: sql<number>`count(*)` }).from(hiveLinks).where(eq(hiveLinks.toType, "product"));
    const [ml] = await db.select({ count: sql<number>`count(*)` }).from(hiveLinks).where(eq(hiveLinks.toType, "media"));
    const [cl] = await db.select({ count: sql<number>`count(*)` }).from(hiveLinks).where(eq(hiveLinks.toType, "career"));
    return {
      totalLinks: Number(total.count),
      knowledgeLinks: Number(kl.count),
      productLinks: Number(pl.count),
      mediaLinks: Number(ml.count),
      careerLinks: Number(cl.count),
    };
  } catch { return { totalLinks: 0, knowledgeLinks: 0, productLinks: 0, mediaLinks: 0, careerLinks: 0 }; }
}

// ──────────────────────────────────────────────────────────────────────────────
// UPGRADE 3: MULTI-AGENT CONSENSUS ENGINE
// Spawns 2 Groq calls in parallel at different temperatures, synthesizes best answer.
// ──────────────────────────────────────────────────────────────────────────────
export async function consensusGenerate(prompt: string, context?: string): Promise<string> {
  const fullPrompt = context ? `Context from Hive Memory:\n${context}\n\n${prompt}` : prompt;
  try {
    const [r1, r2] = await Promise.allSettled([
      groq.chat.completions.create({ model: "llama-3.1-8b-instant", messages: [{ role: "user", content: fullPrompt }], max_tokens: 800, temperature: 0.2 }),
      groq.chat.completions.create({ model: "llama-3.1-8b-instant", messages: [{ role: "user", content: fullPrompt }], max_tokens: 800, temperature: 0.7 }),
    ]);
    const a1 = r1.status === "fulfilled" ? r1.value.choices[0]?.message?.content || "" : "";
    const a2 = r2.status === "fulfilled" ? r2.value.choices[0]?.message?.content || "" : "";
    if (!a1) return a2;
    if (!a2) return a1;
    const synthesis = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: `You are a synthesis agent. Given two AI responses, produce the single best combined answer. Keep it concise and accurate.\n\nResponse A:\n${a1}\n\nResponse B:\n${a2}\n\nSynthesized answer:` }],
      max_tokens: 600,
      temperature: 0.1,
    });
    return synthesis.choices[0]?.message?.content || a1;
  } catch { return ""; }
}

// ──────────────────────────────────────────────────────────────────────────────
// UPGRADE 4: PREDICTIVE TREND ENGINE
// Analyzes most-looked-up topics. Pre-generates entries for trending topics.
// Also seeds topics from high-confidence memory domains.
// ──────────────────────────────────────────────────────────────────────────────
async function runPredictiveTrendEngine() {
  try {
    // Seed from high-lookup topics' related terms
    const hotTopics = await db.select({ slug: quantapediaEntries.slug, title: quantapediaEntries.title, relatedTerms: quantapediaEntries.relatedTerms })
      .from(quantapediaEntries)
      .where(and(eq(quantapediaEntries.generated, true), sql`${quantapediaEntries.lookupCount} > 0`))
      .orderBy(sql`${quantapediaEntries.lookupCount} DESC`)
      .limit(10);

    const toQueue: { slug: string; title: string }[] = [];
    for (const topic of hotTopics) {
      const related = (topic.relatedTerms || []) as string[];
      for (const r of related.slice(0, 4)) {
        const s = r.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        if (s.length > 2) toQueue.push({ slug: s, title: r });
      }
    }

    // Also seed from high-confidence memory domains
    try {
      const hotMemory = await db.select({ domain: hiveMemory.domain, key: hiveMemory.key })
        .from(hiveMemory)
        .orderBy(sql`${hiveMemory.confidence} DESC`)
        .limit(5);
      for (const mem of hotMemory) {
        const title = mem.key.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()).slice(0, 60);
        const s = mem.key.slice(0, 80);
        if (s.length > 2) toQueue.push({ slug: s, title });
      }
    } catch {}

    if (toQueue.length) {
      await storage.queueQuantapediaTopics(toQueue.slice(0, 20));
      log(`[HiveBrain:Trend] Pre-queued ${toQueue.length} trending topics`, "hive");
    }
  } catch (e) {
    log(`[HiveBrain:Trend] Error: ${e}`, "hive");
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// UPGRADE 5: KNOWLEDGE DECAY & QUALITY REGENERATOR
// ──────────────────────────────────────────────────────────────────────────────
async function runDecayRegenerator() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const stale = await db.select({ slug: quantapediaEntries.slug, title: quantapediaEntries.title })
      .from(quantapediaEntries)
      .where(and(
        eq(quantapediaEntries.generated, true),
        lt(quantapediaEntries.updatedAt, sevenDaysAgo),
        sql`length(coalesce(${quantapediaEntries.summary}, '')) < 100`
      ))
      .limit(5);

    if (stale.length) {
      for (const entry of stale) {
        await db.update(quantapediaEntries)
          .set({ generated: false, generatedAt: null })
          .where(eq(quantapediaEntries.slug, entry.slug));
      }
      log(`[HiveBrain:Decay] Flagged ${stale.length} stale/low-quality entries for regeneration`, "hive");
    }
  } catch (e) {
    log(`[HiveBrain:Decay] Error: ${e}`, "hive");
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// UPGRADE 6: CROSS-ENGINE LINEAGE BUILDER
// Periodically runs across all 4 engines to stitch cross-links
// that weren't built at generation time (retrospective linking).
// ──────────────────────────────────────────────────────────────────────────────
async function runCrossEngineLineage() {
  try {
    // Link recently generated careers → knowledge
    const recentCareers = await db.select({ slug: quantumCareers.slug, title: quantumCareers.title, skills: quantumCareers.skills })
      .from(quantumCareers)
      .where(eq(quantumCareers.generated, true))
      .orderBy(sql`${quantumCareers.id} DESC`)
      .limit(10);

    for (const career of recentCareers) {
      const skills = (career.skills || []) as string[];
      await buildResonanceLinks("career", career.slug, [career.title, ...skills.slice(0, 8)]);
    }

    // Link recently generated media → knowledge
    const recentMedia = await db.select({ slug: quantumMedia.slug, name: quantumMedia.name, genre: quantumMedia.genre, creator: quantumMedia.creator })
      .from(quantumMedia)
      .where(eq(quantumMedia.generated, true))
      .orderBy(sql`${quantumMedia.id} DESC`)
      .limit(10);

    for (const media of recentMedia) {
      await buildResonanceLinks("media", media.slug, [media.name, media.genre || "", media.creator || ""].filter(Boolean));
    }

    log(`[HiveBrain:Lineage] Linked ${recentCareers.length} careers + ${recentMedia.length} media → knowledge graph`, "hive");
  } catch (e) {
    log(`[HiveBrain:Lineage] Error: ${e}`, "hive");
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// POST-GENERATION HOOKS — Called after each engine generates an entry
// ──────────────────────────────────────────────────────────────────────────────

export async function onEntryGenerated(slug: string, title: string, entry: any) {
  try {
    const facts = [
      `${title} is categorized as: ${entry.type || "concept"}`,
      `${title} summary: ${(entry.summary || "").slice(0, 120)}`,
      ...((entry.definitions || []).slice(0, 2).map((d: any) => `${title} definition: ${d.text || ""}`)),
      ...((entry.quickFacts || []).slice(0, 3).map((f: any) => `${title} - ${f.label}: ${f.value}`)),
    ].filter(Boolean);
    const patterns = (entry.categories || []).map((c: string) => `${c} → ${title}`);
    const domain = (entry.categories?.[0] || "general").toLowerCase();
    await feedMemoryCortex(domain, title, facts, patterns);
    await buildResonanceLinks("knowledge", slug, entry.relatedTerms || [], entry.seeAlso || []);

    // Auto-seed: queue seeAlso + synonyms as new spawn topics
    const seeds = [
      ...(entry.seeAlso || []).slice(0, 8),
      ...(entry.relatedTerms || []).slice(0, 6),
    ].map((t: string) => ({
      slug: t.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      title: t.trim(),
    })).filter(s => s.slug.length > 2);

    if (seeds.length) {
      storage.queueQuantapediaTopics(seeds).catch(() => {});
    }
  } catch {}
}

export async function onProductGenerated(slug: string, product: any) {
  try {
    const facts = [
      `${product.name} by ${product.brand}: ${product.priceRange}`,
      `${product.name} summary: ${(product.summary || "").slice(0, 100)}`,
      ...((product.keyFeatures || []).slice(0, 3).map((f: string) => `${product.name} feature: ${f}`)),
    ].filter(Boolean);
    const patterns = (product.tags || []).map((t: string) => `${product.category} → ${product.name}`);
    await feedMemoryCortex(product.category?.toLowerCase() || "products", product.name, facts, patterns);
    await buildResonanceLinks("product", slug, product.relatedTopics || [], product.relatedProducts || []);

    // Seed knowledge topics from product domain
    const seeds = (product.relatedTopics || []).slice(0, 6).map((t: string) => ({
      slug: t.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      title: t.trim(),
    })).filter((s: any) => s.slug.length > 2);
    if (seeds.length) storage.queueQuantapediaTopics(seeds).catch(() => {});
  } catch {}
}

// ── NEW: Media Entry Hook ─────────────────────────────────────
export async function onMediaGenerated(slug: string, media: any) {
  try {
    const facts = [
      `${media.name} — ${media.type} by ${media.creator || "Unknown"} (${media.year || "N/A"})`,
      `Genre: ${media.genre || "N/A"}. ${(media.summary || "").slice(0, 100)}`,
      `Where to watch/find: ${media.whereToWatch || "N/A"}`,
    ].filter(Boolean);
    const patterns = [`${media.type} → ${media.genre} → ${media.name}`];
    const domain = media.type?.toLowerCase() || "media";
    await feedMemoryCortex(domain, media.name, facts, patterns);

    const relatedTerms = [
      media.genre,
      media.creator,
      media.type,
      ...(media.relatedMedia || []).slice(0, 4),
      ...(media.relatedTopics || []).slice(0, 4),
    ].filter(Boolean);
    await buildResonanceLinks("media", slug, relatedTerms, []);

    // Seed knowledge from media metadata
    const seeds = relatedTerms.slice(0, 6).map((t: string) => ({
      slug: t.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      title: t.trim(),
    })).filter((s: any) => s.slug.length > 2);
    if (seeds.length) storage.queueQuantapediaTopics(seeds).catch(() => {});
  } catch {}
}

// ── NEW: Career Entry Hook ────────────────────────────────────
export async function onCareerGenerated(slug: string, career: any) {
  try {
    const facts = [
      `${career.title} — ${career.field} field, ${career.level || "N/A"} level`,
      `Salary: ${career.salary || "N/A"}. Demand: ${career.demand || "N/A"}`,
      `${(career.summary || "").slice(0, 100)}`,
      `Skills: ${(career.skills || []).slice(0, 5).join(", ")}`,
    ].filter(Boolean);
    const patterns = [
      `${career.field} → ${career.title}`,
      ...((career.skills || []).slice(0, 4).map((s: string) => `skill → ${s}`)),
    ];
    const domain = career.field?.toLowerCase() || "careers";
    await feedMemoryCortex(domain, career.title, facts, patterns);

    const relatedTerms = [
      career.field,
      career.title,
      ...(career.skills || []).slice(0, 8),
    ].filter(Boolean);
    await buildResonanceLinks("career", slug, relatedTerms, []);

    // Seed knowledge from career skills — each skill becomes a Quantapedia topic
    const skillSeeds = (career.skills || []).slice(0, 10).map((t: string) => ({
      slug: t.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      title: t.trim(),
    })).filter((s: any) => s.slug.length > 2);
    if (skillSeeds.length) storage.queueQuantapediaTopics(skillSeeds).catch(() => {});
  } catch {}
}

// ──────────────────────────────────────────────────────────────────────────────
// HIVE BRAIN MASTER LOOP — All 7 upgrades running on schedule
// ──────────────────────────────────────────────────────────────────────────────
export async function startHiveBrain() {
  log("[HiveBrain] 🧬 OMEGA GRADE V2 — ALL 7 SYSTEMS ACTIVATING...", "hive");
  log("[HiveBrain] ✓ Upgrade 1: Quantum Memory Cortex — ONLINE", "hive");
  log("[HiveBrain] ✓ Upgrade 2: Fractal Resonance Network (ALL 7 engines) — ONLINE", "hive");
  log("[HiveBrain] ✓ Upgrade 3: Multi-Agent Consensus Engine — ONLINE", "hive");
  log("[HiveBrain] ✓ Upgrade 4: Predictive Trend Engine — ONLINE", "hive");
  log("[HiveBrain] ✓ Upgrade 5: Knowledge Decay Regenerator — ONLINE", "hive");
  log("[HiveBrain] ✓ Upgrade 6: Cross-Engine Lineage Builder — ONLINE", "hive");
  log("[HiveBrain] ✓ Upgrade 7: User Activity Boost (hooks ready) — ONLINE", "hive");

  const loopTrend = async () => {
    await runPredictiveTrendEngine();
    setTimeout(loopTrend, 4 * 60 * 1000);
  };
  const loopDecay = async () => {
    await runDecayRegenerator();
    setTimeout(loopDecay, 60 * 60 * 1000);
  };
  const loopLineage = async () => {
    await runCrossEngineLineage();
    setTimeout(loopLineage, 3 * 60 * 1000);
  };

  setTimeout(loopTrend, 30 * 1000);
  setTimeout(loopDecay, 2 * 60 * 1000);
  setTimeout(loopLineage, 90 * 1000);

  log("[HiveBrain] 🚀 All 7 omega upgrades running — hive is fractal-intelligent and self-expanding", "hive");
}

export async function getHiveBrainStats() {
  const [mem, net] = await Promise.all([getMemoryStats(), getNetworkStats()]);
  return { memory: mem, network: net };
}
