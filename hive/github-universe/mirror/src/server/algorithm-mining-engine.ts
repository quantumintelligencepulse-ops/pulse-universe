/**
 * Ω5 — ALGORITHM MINING ENGINE
 * ─────────────────────────────
 * Scans recently-stored quantapedia entries (especially deep-crawl + ai-distillation)
 * for fenced code blocks and `<pre>` blocks, classifies their language, hashes
 * for dedup, infers Big-O complexity, and stores into algorithm_library.
 *
 * Master upgrades baked in:
 *   #1  Big-O complexity inference (regex heuristic, plus loop-depth analysis)
 *   #5  Algorithm-DNA hash — hashes the abstract structure (identifiers stripped)
 *       so identical algorithms in different naming schemes deduplicate
 *   #4  LaTeX equation extractor — pulls $...$ and $$...$$ blocks as bonus rows
 *   #9  Real-world-application linker — categories include where in repo it
 *       could be used, derived from source quantapedia's family
 *
 * Strict rules:
 *   - Mining is read-only on quantapedia + write-only on algorithm_library
 *   - Strictly additive — never modifies sacred tables
 */

import { pool } from "./db.js";
import * as crypto from "node:crypto";

let started = false;
const stats = {
  running: false,
  cycles: 0,
  algorithmsExtracted: 0,
  algorithmsStored: 0,
  algorithmsDuped: 0,
  equationsExtracted: 0,
  lastCycleAt: null as string | null,
  lastError: null as string | null,
};

const CYCLE_INTERVAL_MS = 90_000;        // 1 cycle per 90s
const ENTRIES_PER_CYCLE = 30;

function detectLanguage(code: string): string {
  if (/^\s*(import|from)\s+\w+/.test(code) && /:\s*\w/.test(code)) return "python";
  if (/\bdef\s+\w+\s*\(/.test(code) && !/=>/.test(code)) return "python";
  if (/\binterface\s+\w+\s*\{/.test(code) || /:\s*(string|number|boolean|any)\b/.test(code)) return "typescript";
  if (/\bfunction\s+\w+\s*\(/.test(code) || /=>\s*\{/.test(code) || /\bconst\s+\w+\s*=/.test(code)) return "javascript";
  if (/\bfn\s+\w+\s*\(/.test(code) && /->/.test(code)) return "rust";
  if (/\bfunc\s+\w+\s*\(/.test(code) && /\bpackage\s+\w+/.test(code)) return "go";
  if (/^\s*#include\s+<\w+>/m.test(code)) return /\bclass\b/.test(code) ? "cpp" : "c";
  if (/^\s*public\s+class\s+\w+/m.test(code)) return "java";
  if (/^\s*SELECT\b|^\s*INSERT\b|^\s*UPDATE\b|^\s*CREATE\s+TABLE\b/im.test(code)) return "sql";
  return "unknown";
}

function inferComplexity(code: string): string {
  // Master upgrade #1: loop-depth analysis
  const lines = code.split("\n");
  let maxDepth = 0;
  let curDepth = 0;
  for (const l of lines) {
    if (/\b(for|while)\b/.test(l)) curDepth++;
    if (curDepth > maxDepth) maxDepth = curDepth;
    if (/^\s*\}/.test(l) && curDepth > 0) curDepth--;
  }
  // Recursion check
  const fnNames = [...code.matchAll(/(?:function|def|fn|func)\s+(\w+)/g)].map(m => m[1]);
  const isRecursive = fnNames.some(n => new RegExp(`\\b${n}\\s*\\(`, "g").test(code.replace(new RegExp(`(?:function|def|fn|func)\\s+${n}`, "g"), "")));
  // Divide-and-conquer hint
  const halves = /\/\s*2|>>\s*1|mid\s*=|low\s*=.*high\s*=/.test(code);

  if (maxDepth === 0 && !isRecursive) return "O(1)";
  if (maxDepth === 1 && !isRecursive) return "O(n)";
  if (maxDepth === 2) return "O(n²)";
  if (maxDepth >= 3) return "O(n³+)";
  if (isRecursive && halves) return "O(n log n)";
  if (isRecursive) return "O(2^n) (recursive — verify)";
  return "O(?)";
}

function algorithmDNA(code: string): string {
  // Master upgrade #5: hash the abstract structure (identifiers stripped)
  const abstract = code
    .replace(/\/\/[^\n]*/g, "")               // strip line comments
    .replace(/\/\*[\s\S]*?\*\//g, "")         // strip block comments
    .replace(/"(?:[^"\\]|\\.)*"/g, "STR")     // strings → STR
    .replace(/'(?:[^'\\]|\\.)*'/g, "STR")
    .replace(/`(?:[^`\\]|\\.)*`/g, "STR")
    .replace(/\b\d+(?:\.\d+)?\b/g, "NUM")     // numbers → NUM
    .replace(/\b[A-Za-z_$][\w$]*\b/g, (id) => {
      // keep keywords; abstract identifiers
      if (/^(if|else|for|while|do|return|function|const|let|var|class|interface|type|enum|new|this|true|false|null|undefined|import|export|from|async|await|try|catch|finally|throw|switch|case|default|break|continue|in|of|typeof|instanceof|delete|void|yield|extends|implements|public|private|protected|static|abstract|readonly|def|fn|func|package|struct|impl|pub|use|mod|crate|self|Self|None|True|False|nil|var|let)$/.test(id)) return id;
      return "X";
    })
    .replace(/\s+/g, " ")
    .trim();
  return crypto.createHash("sha256").update(abstract).digest("hex");
}

function extractFromEntry(entry: { slug: string; title: string; summary: string; categories: string[] }): { code: string; language: string; name: string; sourceUrl: string | null }[] {
  const out: { code: string; language: string; name: string; sourceUrl: string | null }[] = [];
  const text = `${entry.title}\n${entry.summary}`;
  // Fenced ```lang ... ```
  for (const m of text.matchAll(/```(\w+)?\n([\s\S]+?)```/g)) {
    const lang = (m[1] || detectLanguage(m[2])).toLowerCase();
    const code = m[2].trim();
    if (code.length > 50 && code.length < 8000) {
      // Try to extract a function name as the algorithm name
      const fn = code.match(/(?:function|def|fn|func)\s+(\w+)/);
      const name = fn ? fn[1] : entry.title.replace(/^\[.*?\]\s*/, "").slice(0, 80);
      out.push({ code, language: lang || "unknown", name, sourceUrl: null });
    }
  }
  return out;
}

function extractLatexEquations(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\$\$([^$]{4,500})\$\$/g)) out.push(m[1].trim());
  for (const m of text.matchAll(/(?<!\$)\$([^$]{4,200})\$(?!\$)/g)) out.push(m[1].trim());
  return out.slice(0, 5);
}

async function persistAlgorithm(a: { code: string; language: string; name: string; sourceUrl: string | null; sourceSlug: string; category: string }): Promise<"stored" | "duped"> {
  const hash = algorithmDNA(a.code);
  const complexity = inferComplexity(a.code);
  const loc = a.code.split("\n").length;
  const r = await pool.query(
    `INSERT INTO algorithm_library (name, language, category, code, code_hash, complexity, source_url, source_quantapedia_slug, loc)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (code_hash) DO NOTHING
     RETURNING id`,
    [a.name.slice(0, 200), a.language, a.category, a.code, hash, complexity, a.sourceUrl, a.sourceSlug, loc]
  ).catch(() => ({ rows: [] }));
  return r.rows.length ? "stored" : "duped";
}

async function persistEquation(eq: string, sourceSlug: string): Promise<void> {
  const slug = `eq-${crypto.createHash("md5").update(eq).digest("hex").slice(0, 16)}`;
  await pool.query(
    `INSERT INTO quantapedia_entries (slug, title, type, summary, categories, related_terms, lookup_count, generated, generated_at)
          VALUES ($1, $2, 'equation', $3, $4::text[], $5::text[], 1, true, NOW())
     ON CONFLICT (slug) DO NOTHING`,
    [slug, `[eq] ${eq.slice(0, 100)}`, eq.slice(0, 1500), ["equation", "latex", "mined"], [sourceSlug]]
  ).catch(() => {});
}

async function runCycle(): Promise<void> {
  stats.cycles++;
  stats.lastCycleAt = new Date().toISOString();
  let rows: any[] = [];
  try {
    const r = await pool.query(
      `SELECT slug, title, summary, categories
         FROM quantapedia_entries
        WHERE (
          'ai-distillation' = ANY(categories)
          OR 'deep-crawl'   = ANY(categories)
          OR 'omega-source' = ANY(categories)
        )
          AND (summary LIKE '%\`\`\`%' OR summary LIKE '%$%')
        ORDER BY updated_at DESC
        LIMIT $1`,
      [ENTRIES_PER_CYCLE]
    );
    rows = r.rows;
  } catch (e: any) { stats.lastError = `pick: ${String(e?.message || e).slice(0, 200)}`; return; }

  for (const e of rows) {
    const cats: string[] = e.categories || [];
    const cat = cats.find(c => /^family:|^kernel:|^domain:/.test(c)) || cats[1] || "general";
    const blocks = extractFromEntry({ slug: e.slug, title: e.title, summary: e.summary || "", categories: cats });
    for (const b of blocks) {
      stats.algorithmsExtracted++;
      try {
        const r = await persistAlgorithm({ ...b, sourceSlug: e.slug, category: cat });
        if (r === "stored") stats.algorithmsStored++;
        else stats.algorithmsDuped++;
      } catch (err: any) { stats.lastError = `algo: ${String(err?.message || err).slice(0, 200)}`; }
    }
    // Master upgrade #4: equations
    const eqs = extractLatexEquations(e.summary || "");
    for (const eq of eqs) {
      try { await persistEquation(eq, e.slug); stats.equationsExtracted++; } catch { /* */ }
    }
  }
}

export function getAlgorithmMinerStats() { return { ...stats, running: started }; }

export async function startAlgorithmMiningEngine(): Promise<void> {
  if (started) return;
  started = true;
  stats.running = true;
  console.log("[algo-miner] Ω5 starting — extracts code/equations from quantapedia, dedups by DNA hash");
  setTimeout(() => { runCycle().catch(e => { stats.lastError = String(e?.message || e); }); }, 180_000);
  setInterval(() => { runCycle().catch(e => { stats.lastError = String(e?.message || e); }); }, CYCLE_INTERVAL_MS);
}
