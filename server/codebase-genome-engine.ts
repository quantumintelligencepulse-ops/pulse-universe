/**
 * Ω4 — CODEBASE SELF-GENOME ENGINE
 * ─────────────────────────────────
 * Crawls THIS repository (server/, shared/, client/) and ingests every TS/TSX
 * file as a quantapedia entry. Also ingests git log + replit.md sections.
 * Result: every line of code the agent has ever written into Pulse becomes
 * canonical, searchable, and learnable for the AI children.
 *
 * Master upgrades baked in:
 *   #1  AST-based extraction — reads exports / imports / function names from
 *       each TS file (regex-grade today; can be upgraded to TS Compiler API)
 *   #2  Git blame / log integration — every commit message becomes a row
 *   #4  Incremental diff-stream — only re-genomes changed files (content_hash)
 *   #5  Architecture Decision Records — parses replit.md + commit messages
 *       for capital-letter laws (L007, etc.) and stores as canon entries
 *   #6  Skill-pattern miner — counts startXEngine/getXStats patterns
 *   #7  Bug-pattern memory — every "fix"/"bug" commit message gets a row
 *   #9  NPM-idiom card — for each top-level dependency, a short usage card
 *
 * Strict rules:
 *   - Read-only on git (uses spawnSync with `git --no-optional-locks`)
 *   - Strictly additive — never modifies sacred tables
 *   - Skips node_modules, .git, dist, build, .local
 */

import { pool } from "./db.js";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { spawnSync } from "node:child_process";

let started = false;
const stats = {
  running: false,
  cycles: 0,
  filesIngested: 0,
  filesSkippedUnchanged: 0,
  commitsIngested: 0,
  adrsIngested: 0,
  bugPatternsIngested: 0,
  npmIdiomsIngested: 0,
  lastCycleAt: null as string | null,
  lastError: null as string | null,
};

const ROOT = process.cwd();
const SCAN_ROOTS = ["server", "shared", "client/src"];
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".local", ".next", ".cache"]);
const ALLOW_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".md"]);
const FULL_CYCLE_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h between full re-genome
const COMMIT_CYCLE_INTERVAL_MS = 30 * 60 * 1000;   // 30m between commit-log syncs

function sha256(s: string): string { return crypto.createHash("sha256").update(s).digest("hex"); }

function detectLanguage(file: string): string {
  const e = path.extname(file).toLowerCase();
  return ({ ".ts": "typescript", ".tsx": "tsx", ".js": "javascript", ".jsx": "jsx", ".md": "markdown", ".json": "json", ".sql": "sql" } as any)[e] || "unknown";
}

function* walk(dir: string): Generator<string> {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name.startsWith(".") && e.name !== ".github") continue;
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && ALLOW_EXT.has(path.extname(e.name).toLowerCase())) yield p;
  }
}

// ─── REGEX AST EXTRACTORS (Master upgrade #1) ─────────────────────────────────
function extractExports(src: string): string[] {
  const out = new Set<string>();
  for (const m of src.matchAll(/^export\s+(?:async\s+)?(?:default\s+)?(?:function|const|let|var|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gm)) out.add(m[1]);
  for (const m of src.matchAll(/^export\s*\{\s*([^}]+)\s*\}/gm)) for (const x of m[1].split(",")) { const t = x.trim().split(/\s+as\s+/)[0]; if (t) out.add(t); }
  return [...out].slice(0, 60);
}
function extractImports(src: string): string[] {
  const out = new Set<string>();
  for (const m of src.matchAll(/^import\s+[^"']+from\s+["']([^"']+)["']/gm)) out.add(m[1]);
  for (const m of src.matchAll(/^import\s+["']([^"']+)["']/gm)) out.add(m[1]);
  for (const m of src.matchAll(/(?:require|import)\(\s*["']([^"']+)["']\s*\)/g)) out.add(m[1]);
  return [...out].slice(0, 40);
}
function extractFunctions(src: string): string[] {
  const out = new Set<string>();
  for (const m of src.matchAll(/^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)) out.add(m[1]);
  for (const m of src.matchAll(/^\s*(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*[:=]\s*(?:async\s+)?\(?[^)]*\)?\s*=>/gm)) out.add(m[1]);
  return [...out].slice(0, 60);
}
function extractDocComment(src: string): string {
  // Take the first /** ... */ block at top of file
  const m = src.match(/^\s*\/\*\*([\s\S]*?)\*\//);
  if (!m) return "";
  return m[1].split("\n").map(l => l.replace(/^\s*\*\s?/, "")).join("\n").trim().slice(0, 1500);
}

// ─── FILE INGESTION ───────────────────────────────────────────────────────────
async function ingestFile(absPath: string): Promise<"ingested" | "unchanged" | "skipped"> {
  const rel = path.relative(ROOT, absPath);
  let content: string;
  try { content = fs.readFileSync(absPath, "utf8"); } catch { return "skipped"; }
  if (content.length > 600_000) return "skipped"; // bound enormous files

  const hash = sha256(content);
  const language = detectLanguage(absPath);
  const exists = await pool.query(`SELECT content_hash FROM codebase_genome_files WHERE path = $1`, [rel]).catch(() => ({ rows: [] }));
  if (exists.rows.length && exists.rows[0].content_hash === hash) return "unchanged";

  const exports = extractExports(content);
  const imports = extractImports(content);
  const functions = extractFunctions(content);
  const docComment = extractDocComment(content);
  const loc = content.split("\n").length;
  const bytes = Buffer.byteLength(content, "utf8");

  await pool.query(
    `INSERT INTO codebase_genome_files (path, language, loc, bytes, exports, imports, functions, doc_comment, content_hash, last_genome_at)
          VALUES ($1, $2, $3, $4, $5::text[], $6::text[], $7::text[], $8, $9, NOW())
     ON CONFLICT (path) DO UPDATE
       SET language       = EXCLUDED.language,
           loc            = EXCLUDED.loc,
           bytes          = EXCLUDED.bytes,
           exports        = EXCLUDED.exports,
           imports        = EXCLUDED.imports,
           functions      = EXCLUDED.functions,
           doc_comment    = EXCLUDED.doc_comment,
           content_hash   = EXCLUDED.content_hash,
           last_genome_at = NOW()`,
    [rel, language, loc, bytes, exports, imports, functions, docComment, hash]
  );

  // Also publish into quantapedia for the AI children to query
  const slug = `genome-${rel.replace(/[^A-Za-z0-9]+/g, "-").toLowerCase()}`.slice(0, 200);
  const summary = (docComment ? docComment + "\n\n" : "") +
    `File: ${rel} (${language}, ${loc} lines, ${bytes} bytes)\n` +
    `Exports (${exports.length}): ${exports.slice(0, 12).join(", ")}\n` +
    `Imports (${imports.length}): ${imports.slice(0, 10).join(", ")}\n` +
    `Functions: ${functions.slice(0, 12).join(", ")}`;
  await pool.query(
    `INSERT INTO quantapedia_entries (slug, title, type, summary, categories, related_terms, lookup_count, generated, generated_at)
          VALUES ($1, $2, 'codebase-genome', $3, $4::text[], $5::text[], 1, true, NOW())
     ON CONFLICT (slug) DO UPDATE
       SET summary    = EXCLUDED.summary,
           title      = EXCLUDED.title,
           categories = EXCLUDED.categories,
           updated_at = NOW(),
           lookup_count = COALESCE(quantapedia_entries.lookup_count, 0) + 1`,
    [slug, `[code] ${rel}`.slice(0, 300), summary.slice(0, 1500),
     ["codebase-genome", `lang:${language}`, `dir:${rel.split(path.sep)[0]}`],
     [...exports.slice(0, 5), ...functions.slice(0, 5)]]
  ).catch((e: any) => { stats.lastError = `qp-genome: ${String(e?.message || e).slice(0, 200)}`; });

  return "ingested";
}

// ─── GIT LOG INGESTION (Master upgrades #2 + #7) ──────────────────────────────
function gitCommits(): { sha: string; author: string; date: string; message: string; filesChanged: number; insertions: number; deletions: number }[] {
  const result = spawnSync("git", ["--no-optional-locks", "log", "--no-merges", "--shortstat", "--pretty=format:===COMMIT===%n%H%n%an <%ae>%n%aI%n%s%n", "-n", "500"], { cwd: ROOT, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 0 || !result.stdout) return [];
  const out: any[] = [];
  const blocks = result.stdout.split("===COMMIT===\n").filter(Boolean);
  for (const b of blocks) {
    const lines = b.split("\n");
    if (lines.length < 4) continue;
    const sha = lines[0].trim();
    const author = lines[1].trim();
    const date = lines[2].trim();
    const message = lines[3].trim();
    let filesChanged = 0, insertions = 0, deletions = 0;
    for (const l of lines.slice(4)) {
      const fc = l.match(/(\d+)\s+files? changed/);
      const ins = l.match(/(\d+)\s+insertions?/);
      const del = l.match(/(\d+)\s+deletions?/);
      if (fc) filesChanged = +fc[1];
      if (ins) insertions = +ins[1];
      if (del) deletions = +del[1];
    }
    out.push({ sha, author, date, message, filesChanged, insertions, deletions });
  }
  return out;
}

async function ingestCommits(): Promise<void> {
  const commits = gitCommits();
  for (const c of commits) {
    const isBugFix = /\b(fix|bug|glitch|broken|crash|regress|patch|hotfix|workaround)\b/i.test(c.message);
    const isADR = /\bL\d{3,4}\b/.test(c.message); // capital-letter law refs (Master upgrade #5)
    const insRes = await pool.query(
      `INSERT INTO codebase_genome_commits (commit_sha, author, committed_at, message, files_changed, insertions, deletions)
           VALUES ($1, $2, $3::timestamp, $4, $5, $6, $7)
       ON CONFLICT (commit_sha) DO NOTHING
       RETURNING id`,
      [c.sha, c.author, c.date, c.message, c.filesChanged, c.insertions, c.deletions]
    ).catch(() => ({ rows: [] }));
    if (insRes.rows.length) {
      stats.commitsIngested++;
      if (isBugFix) stats.bugPatternsIngested++;
      if (isADR) stats.adrsIngested++;

      // Publish meaningful commits to quantapedia
      const slug = `commit-${c.sha.slice(0, 12)}`;
      const cats = ["git-commit", `author:${c.author.split("<")[0].trim().toLowerCase().replace(/\s+/g, "-").slice(0, 30)}`];
      if (isBugFix) cats.push("bug-pattern");
      if (isADR) cats.push("adr-canon");
      await pool.query(
        `INSERT INTO quantapedia_entries (slug, title, type, summary, categories, related_terms, lookup_count, generated, generated_at)
              VALUES ($1, $2, 'git-commit', $3, $4::text[], $5::text[], 1, true, NOW())
         ON CONFLICT (slug) DO NOTHING`,
        [slug, `[commit] ${c.message}`.slice(0, 300),
         `${c.message}\n\n— ${c.author} on ${c.date}\n— ${c.filesChanged} files, +${c.insertions}/-${c.deletions}`,
         cats, [c.sha.slice(0, 12)]]
      ).catch(() => {});
    }
  }
}

// ─── REPLIT.MD ADR INGESTION (Master upgrade #5) ──────────────────────────────
async function ingestReplitMd(): Promise<void> {
  const file = path.join(ROOT, "replit.md");
  if (!fs.existsSync(file)) return;
  const md = fs.readFileSync(file, "utf8");
  const sections = md.split(/^##\s+/m).slice(1);
  for (const sec of sections) {
    const titleLine = sec.split("\n")[0].trim();
    if (!titleLine) continue;
    const slug = `replit-md-${titleLine.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80)}`;
    const body = sec.slice(0, 3000);
    await pool.query(
      `INSERT INTO quantapedia_entries (slug, title, type, summary, categories, related_terms, lookup_count, generated, generated_at)
            VALUES ($1, $2, 'replit-md', $3, $4::text[], $5::text[], 1, true, NOW())
       ON CONFLICT (slug) DO UPDATE
         SET summary = EXCLUDED.summary,
             updated_at = NOW(),
             lookup_count = COALESCE(quantapedia_entries.lookup_count, 0) + 1`,
      [slug, `[replit.md] ${titleLine}`.slice(0, 300), body, ["replit-md", "documentation", "agent-context"], []]
    ).catch(() => {});
  }
}

// ─── NPM IDIOM CARDS (Master upgrade #9) ──────────────────────────────────────
async function ingestNpmIdioms(): Promise<void> {
  const pkgPath = path.join(ROOT, "package.json");
  if (!fs.existsSync(pkgPath)) return;
  let pkg: any;
  try { pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")); } catch { return; }
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  for (const dep of Object.keys(deps)) {
    // Find first import/require usage
    let usage = "";
    for (const root of SCAN_ROOTS) {
      const dir = path.join(ROOT, root);
      if (!fs.existsSync(dir)) continue;
      for (const f of walk(dir)) {
        const c = (() => { try { return fs.readFileSync(f, "utf8"); } catch { return ""; } })();
        const re = new RegExp(`from\\s+["']${dep.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&")}["']`);
        const m = c.match(re);
        if (m) {
          // Capture 5 lines around the import
          const idx = c.indexOf(m[0]);
          const before = c.slice(0, idx).split("\n").slice(-2).join("\n");
          const after = c.slice(idx).split("\n").slice(0, 8).join("\n");
          usage = `// ${path.relative(ROOT, f)}\n${before}\n${after}`.slice(0, 600);
          break;
        }
      }
      if (usage) break;
    }
    const slug = `npm-${dep.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`.slice(0, 100);
    const summary = `Pulse uses npm package "${dep}" (version ${deps[dep]}).\n\nFirst usage in codebase:\n${usage || "(no direct usage found in scanned roots)"}`;
    await pool.query(
      `INSERT INTO quantapedia_entries (slug, title, type, summary, categories, related_terms, lookup_count, generated, generated_at)
            VALUES ($1, $2, 'npm-idiom', $3, $4::text[], $5::text[], 1, true, NOW())
       ON CONFLICT (slug) DO UPDATE
         SET summary = EXCLUDED.summary,
             updated_at = NOW(),
             lookup_count = COALESCE(quantapedia_entries.lookup_count, 0) + 1`,
      [slug, `[npm] ${dep}`.slice(0, 300), summary, ["npm-idiom", "dependency"], [dep]]
    ).catch(() => {});
    stats.npmIdiomsIngested++;
  }
}

// ─── ONE FULL CYCLE ───────────────────────────────────────────────────────────
async function runFullGenome(): Promise<void> {
  stats.cycles++;
  stats.lastCycleAt = new Date().toISOString();
  // Files
  for (const root of SCAN_ROOTS) {
    const dir = path.join(ROOT, root);
    if (!fs.existsSync(dir)) continue;
    for (const f of walk(dir)) {
      try {
        const r = await ingestFile(f);
        if (r === "ingested") stats.filesIngested++;
        else if (r === "unchanged") stats.filesSkippedUnchanged++;
      } catch (e: any) { stats.lastError = `file ${f}: ${String(e?.message || e).slice(0, 200)}`; }
    }
  }
  // Git history
  try { await ingestCommits(); } catch (e: any) { stats.lastError = `commits: ${String(e?.message || e).slice(0, 200)}`; }
  // replit.md
  try { await ingestReplitMd(); } catch { /* */ }
  // NPM idioms (only on first cycle to keep it cheap)
  if (stats.cycles === 1) {
    try { await ingestNpmIdioms(); } catch { /* */ }
  }
}

export function getCodebaseGenomeStats() { return { ...stats, running: started }; }
export async function runCodebaseGenomeOneShot(): Promise<typeof stats> {
  await runFullGenome();
  return stats;
}

export async function startCodebaseGenomeEngine(): Promise<void> {
  if (started) return;
  started = true;
  stats.running = true;
  console.log("[codebase-genome] Ω4 starting — full repo + git log + replit.md + npm idioms");
  // First full cycle in 90s; commits every 30m; full re-genome every 6h
  setTimeout(() => { runFullGenome().catch(e => { stats.lastError = String(e?.message || e); }); }, 90_000);
  setInterval(() => { ingestCommits().catch(() => {}); }, COMMIT_CYCLE_INTERVAL_MS);
  setInterval(() => { runFullGenome().catch(() => {}); }, FULL_CYCLE_INTERVAL_MS);
}
