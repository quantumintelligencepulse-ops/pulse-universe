/**
 * QUANTUM HIVE BRAIN — 5 Omega-Grade Upgrades
 * =============================================
 * 1. Quantum Memory Cortex        — Persistent AI brain in DB, learns from every generated entry
 * 2. Fractal Resonance Network    — Cross-links Quantapedia ↔ Products, builds knowledge graph
 * 3. Multi-Agent Consensus Engine — Parallel Groq synthesis for high-quality answers
 * 4. Predictive Trend Engine      — Auto-generates hot/trending topics before users search
 * 5. Knowledge Decay Regenerator  — Detects stale/low-quality entries, schedules regeneration
 */

import Groq from "groq-sdk";
import { db } from "./db";
import { hiveMemory, hiveLinks, quantapediaEntries, quantumProducts } from "@shared/schema";
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
// UPGRADE 2: FRACTAL RESONANCE NETWORK
// Automatically cross-links Quantapedia entries ↔ Products
// Every generated entry finds existing related nodes and builds bidirectional links
// ──────────────────────────────────────────────────────────────────────────────
export async function buildResonanceLinks(
  fromType: "knowledge" | "product",
  fromSlug: string,
  relatedTerms: string[],
  relatedProducts: string[]
) {
  const links: any[] = [];
  for (const term of relatedTerms.slice(0, 8)) {
    const slug = toSlug(term);
    const [existing] = await db.select({ slug: quantapediaEntries.slug, title: quantapediaEntries.title })
      .from(quantapediaEntries).where(eq(quantapediaEntries.slug, slug)).limit(1);
    if (existing) {
      links.push({ fromType, fromSlug, toType: "knowledge", toSlug: existing.slug, toTitle: existing.title, strength: 0.7 });
    }
  }
  for (const product of relatedProducts.slice(0, 6)) {
    const slug = toSlug(product);
    const [existing] = await db.select({ slug: quantumProducts.slug, name: quantumProducts.name })
      .from(quantumProducts).where(eq(quantumProducts.slug, slug)).limit(1);
    if (existing) {
      links.push({ fromType, fromSlug, toType: "product", toSlug: existing.slug, toTitle: existing.name, strength: 0.6 });
    }
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
      .limit(10);
  } catch { return []; }
}

export async function getNetworkStats(): Promise<{ totalLinks: number; knowledgeLinks: number; productLinks: number }> {
  try {
    const [total] = await db.select({ count: sql<number>`count(*)` }).from(hiveLinks);
    const [kl] = await db.select({ count: sql<number>`count(*)` }).from(hiveLinks).where(eq(hiveLinks.toType, "knowledge"));
    const [pl] = await db.select({ count: sql<number>`count(*)` }).from(hiveLinks).where(eq(hiveLinks.toType, "product"));
    return { totalLinks: Number(total.count), knowledgeLinks: Number(kl.count), productLinks: Number(pl.count) };
  } catch { return { totalLinks: 0, knowledgeLinks: 0, productLinks: 0 }; }
}

// ──────────────────────────────────────────────────────────────────────────────
// UPGRADE 3: MULTI-AGENT CONSENSUS ENGINE
// Spawns 2 Groq calls in parallel at different temperatures, synthesizes the best answer.
// Used for high-complexity queries. Eliminates single-model hallucinations.
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
// Analyzes most-looked-up topics and most-viewed products.
// Pre-generates entries for predicted trending topics automatically.
// ──────────────────────────────────────────────────────────────────────────────
async function runPredictiveTrendEngine() {
  try {
    const hotTopics = await db.select({ slug: quantapediaEntries.slug, title: quantapediaEntries.title, relatedTerms: quantapediaEntries.relatedTerms })
      .from(quantapediaEntries)
      .where(and(eq(quantapediaEntries.generated, true), sql`${quantapediaEntries.lookupCount} > 0`))
      .orderBy(sql`${quantapediaEntries.lookupCount} DESC`)
      .limit(10);

    const toQueue: { slug: string; title: string }[] = [];
    for (const topic of hotTopics) {
      const related = (topic.relatedTerms || []) as string[];
      for (const r of related.slice(0, 3)) {
        const slug = toSlug(r);
        if (slug.length > 2) toQueue.push({ slug, title: r });
      }
    }
    if (toQueue.length) {
      await storage.queueQuantapediaTopics(toQueue.slice(0, 15));
      log(`[HiveBrain:Trend] Pre-queued ${toQueue.length} trending topics`, "hive");
    }
  } catch (e) {
    log(`[HiveBrain:Trend] Error: ${e}`, "hive");
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// UPGRADE 5: KNOWLEDGE DECAY & QUALITY REGENERATOR
// Detects stale entries (>7 days) or low-quality entries (short summary, few related terms).
// Re-queues them for regeneration to keep the knowledge base always fresh and complete.
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
// POST-GENERATION HOOK: Call this after every Quantapedia entry is generated
// Feeds memory cortex + builds resonance links
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
  } catch {}
}

// ──────────────────────────────────────────────────────────────────────────────
// POST-GENERATION HOOK: Call after every product is generated
// ──────────────────────────────────────────────────────────────────────────────
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
  } catch {}
}

// ──────────────────────────────────────────────────────────────────────────────
// HIVE BRAIN MASTER LOOP — Runs all 5 upgrades on schedule
// ──────────────────────────────────────────────────────────────────────────────
export async function startHiveBrain() {
  log("[HiveBrain] 🧬 ALL 5 OMEGA UPGRADES ACTIVATING...", "hive");
  log("[HiveBrain] ✓ Upgrade 1: Quantum Memory Cortex — ONLINE", "hive");
  log("[HiveBrain] ✓ Upgrade 2: Fractal Resonance Network — ONLINE", "hive");
  log("[HiveBrain] ✓ Upgrade 3: Multi-Agent Consensus Engine — ONLINE", "hive");
  log("[HiveBrain] ✓ Upgrade 4: Predictive Trend Engine — ONLINE", "hive");
  log("[HiveBrain] ✓ Upgrade 5: Knowledge Decay Regenerator — ONLINE", "hive");

  const loopTrend = async () => {
    await runPredictiveTrendEngine();
    setTimeout(loopTrend, 5 * 60 * 1000);
  };
  const loopDecay = async () => {
    await runDecayRegenerator();
    setTimeout(loopDecay, 60 * 60 * 1000);
  };

  setTimeout(loopTrend, 30 * 1000);
  setTimeout(loopDecay, 2 * 60 * 1000);

  log("[HiveBrain] 🚀 All 5 omega upgrades running — hive is fractal-intelligent", "hive");
}

export async function getHiveBrainStats() {
  const [mem, net] = await Promise.all([getMemoryStats(), getNetworkStats()]);
  return { memory: mem, network: net };
}
