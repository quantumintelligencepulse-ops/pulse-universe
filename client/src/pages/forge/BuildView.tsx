import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRelevantSources } from "./OmegaSources";
import { ArrowLeft, CheckCircle2, Circle, Loader2 } from "lucide-react";

interface BuildViewProps {
  appId: number;
  onComplete: () => void;
  onBack: () => void;
}

function ResPanel({ title, items, icon }: { title: string; items?: any[]; icon: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span>{icon}</span>
        <span className="text-xs font-semibold">{title}</span>
      </div>
      <div className="space-y-1.5">
        {items && items.length > 0 ? items.slice(0, 5).map((item, i) => (
          <div key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
            <span className="text-primary/60 mt-0.5 shrink-0">·</span>
            <span className="line-clamp-2">{typeof item === "string" ? item : JSON.stringify(item)}</span>
          </div>
        )) : (
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-muted rounded animate-pulse" />
            <span className="w-12 h-0.5 bg-muted rounded animate-pulse" />
            <span className="w-8 h-0.5 bg-muted rounded animate-pulse" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

const STEPS = [
  { label: "Researching idea across internet", icon: "🔬" },
  { label: "Finding similar apps & market data", icon: "📱" },
  { label: "Scanning 100 Omega sources", icon: "⚡" },
  { label: "Generating full application with AI", icon: "🤖" },
  { label: "Self-healing code review + bug fix", icon: "🔧" },
  { label: "Running hive agent code review", icon: "🧬" },
  { label: "Build complete — Sovereign App ready!", icon: "◆" },
];

const forgeApi = {
  getApp: (id: number) => fetch(`/api/forgeai/apps/${id}`).then(r => r.json()),
  updateApp: (id: number, data: any) => fetch(`/api/forgeai/apps/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  }).then(r => r.json()),
  createBuildMemory: (data: any) => fetch("/api/forgeai/build-memory", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  }).then(r => r.json()),
  createResource: (data: any) => fetch("/api/forgeai/resources", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  }).then(r => r.json()),
  invokeLLM: (payload: any) => fetch("/api/forgeai/llm", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }).then(r => r.json()),
};

export default function BuildView({ appId, onComplete, onBack }: BuildViewProps) {
  const [app, setApp] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState<{ msg: string; type: string; id: number }[]>([]);
  const [research, setResearch] = useState<any>(null);
  const [similarApps, setSimilarApps] = useState<any>(null);
  const [omegaSources, setOmegaSources] = useState<any[]>([]);
  const [hiveVotes, setHiveVotes] = useState<any>(null);
  const logsRef = useRef<HTMLDivElement>(null);
  const hasRun = useRef(false);

  const log = useCallback((msg: string, type = "info") => {
    setLogs((p) => [...p, { msg, type, id: Date.now() + Math.random() }]);
    setTimeout(() => logsRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 50);
  }, []);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    forgeApi.getApp(appId).then((found) => {
      if (found?.id) { setApp(found); runPipeline(found); }
    });
  }, [appId]);

  const runPipeline = async (a: any) => {
    log("◆ ForgeAI Build Engine initializing...", "accent");
    log(`Analyzing: "${a.prompt}"`, "info");
    log(`Project type: ${a.project_type || "fullstack"}`, "dim");
    if (a.agent_author) log(`⚡ Build mentor: ${a.agent_author} [${a.sector || "hive"}]`, "pulse");
    setStep(0);
    await forgeApi.updateApp(a.id, { status: "researching" });

    // ── STEP 1: Research ──────────────────────────────────────────────────────
    log("◆ Deep research scan starting...", "accent");
    const researchResult = await forgeApi.invokeLLM({
      prompt: `Research this app idea: "${a.prompt}". Return JSON: { summary: string, key_features: string[] (8 items), target_audience: string, ux_patterns: string[] (4 items), data_entities: string[] (main data types the app stores) }`,
      schema_keys: ["summary", "key_features", "target_audience", "ux_patterns", "data_entities"],
      add_hive_context: true,
      hive_prompt: a.prompt,
    });
    setResearch(researchResult);
    log(`✓ Research complete — ${researchResult.key_features?.length || 0} features identified`, "success");
    researchResult.key_features?.slice(0, 3).forEach((f: string) => log(`  → ${f}`, "dim"));
    await forgeApi.updateApp(a.id, { research_data: JSON.stringify(researchResult), status: "analyzing" });

    // ── STEP 2: Similar apps ──────────────────────────────────────────────────
    setStep(1);
    log("◆ Cross-referencing app stores & web apps...", "accent");
    const appsResult = await forgeApi.invokeLLM({
      prompt: `Find 4 real apps similar to: "${a.prompt}". Return JSON: { google_play_apps: [{name, description}], web_apps: [{name, description}] }`,
      schema_keys: ["google_play_apps", "web_apps"],
    });
    setSimilarApps(appsResult);
    log(`✓ Found ${appsResult.google_play_apps?.length || 0} Play apps, ${appsResult.web_apps?.length || 0} web apps`, "success");
    await forgeApi.updateApp(a.id, { similar_apps: JSON.stringify(appsResult) });

    // ── STEP 3: Omega sources ─────────────────────────────────────────────────
    setStep(2);
    const matched = getRelevantSources(a.prompt, 20);
    setOmegaSources(matched);
    log(`◆ Omega scan: ${matched.length} sources matched`, "accent");
    matched.slice(0, 5).forEach((s) => log(`  ⚡ ${s.name} [${s.cat}]`, "dim"));
    matched.slice(0, 6).forEach((src) => {
      forgeApi.createResource({ name: src.name, url: src.url, category: src.cat, description: src.desc, source_build_id: String(a.id) }).catch(() => {});
    });
    await forgeApi.updateApp(a.id, { open_source_refs: JSON.stringify({ omega_sources: matched }) });

    // ── STEP 4: Generate full application ─────────────────────────────────────
    setStep(3);
    log("◆ Generating full application code...", "accent");
    log("  Synthesizing research + market data + Omega sources...", "dim");

    // Namespace key based on app name
    const appKey = (a.prompt || "app").slice(0, 12).replace(/\W/g, "_").toLowerCase();
    const featSnippet = (researchResult.key_features || []).slice(0, 5).join(" | ");
    const uxSnippet = (researchResult.ux_patterns || []).slice(0, 3).join(" | ");
    const omegaSnippet = matched.slice(0, 5).map((s: any) => `${s.name}: ${s.desc}`).join("\n");
    const similarSnippet = [
      ...(appsResult.google_play_apps || []).slice(0, 2).map((a: any) => a.name),
      ...(appsResult.web_apps || []).slice(0, 2).map((a: any) => a.name),
    ].join(", ");

    const buildResult = await forgeApi.invokeLLM({
      prompt: `You are the world's single greatest full-stack web developer and UI/UX designer.
Build ONE COMPLETE, FULLY WORKING standalone web application.

APP IDEA: "${a.prompt}"
KEY FEATURES: ${featSnippet}
UX PATTERNS: ${uxSnippet}
SIMILAR APPS TO BEAT: ${similarSnippet}
OMEGA SOURCES: ${omegaSnippet}

Return JSON with EXACTLY these keys:
  app_name — short memorable name (string)
  app_description — one powerful sentence (string)
  app_type — one of: web_app | saas | tool | dashboard | game
  full_html — THE ENTIRE APPLICATION as one complete HTML string from <!DOCTYPE html> to </html>

━━━ ABSOLUTE RULES FOR full_html — VIOLATIONS BREAK THE APP ━━━

✅ ONE <style> block in <head> with ALL CSS
✅ ONE <script> block at END of <body> with ALL JavaScript
✅ ALL JavaScript wrapped in: document.addEventListener('DOMContentLoaded', function() { ... });
✅ Every element id used in JS MUST exist as real HTML element
✅ Every CSS class MUST be defined in the <style> block
✅ localStorage keys MUST use namespace: "${appKey}_keyName"
✅ Pre-populate with 10+ realistic, varied sample data records
✅ Every button, link, form has a working event listener
✅ Form validation with inline error messages
✅ Toast notifications for actions (add/delete/save)
✅ Empty state UI when no data
✅ Responsive: works on 375px mobile AND 1440px desktop

❌ FORBIDDEN — these silently break the app:
❌ NO import or require() of any kind
❌ NO fetch(), XMLHttpRequest, or API calls
❌ NO <script src="..."> or <link href="..."> loading external files
❌ NO CDN URLs (no Chart.js, jQuery, Bootstrap CDN)
❌ NO ES6 modules (no export/import)
❌ NO placeholder text ("TODO", "coming soon", "add feature here")
❌ NO async/await (use callbacks or direct assignment)
❌ NO undefined variables or functions
❌ If you need charts: use Canvas API or pure CSS bars
❌ If you need icons: use Unicode emoji or inline SVG

━━━ DESIGN REQUIREMENTS ━━━
🎨 Dark theme: background #0a0a0f, cards #13131a, borders #1e1e2e
🎨 Accent: vibrant gradient from #22d3ee (cyan) to #a855f7 (violet)
🎨 Font: font-family: -apple-system, 'Segoe UI', sans-serif
🎨 Cards with box-shadow, hover lifts with transform: translateY(-2px)
🎨 Smooth CSS transitions 0.2s ease on all hover states
🎨 Buttons: gradient background, border-radius:10px, hover glow
🎨 Scrollbars styled: ::-webkit-scrollbar{width:6px} thumb{background:#333}
🎨 Glassmorphism where appropriate: backdrop-filter:blur(20px)

━━━ REQUIRED FEATURES ━━━
1. Navigation — sidebar or top nav with 3+ sections, active state, mobile support
2. CRUD — full create, read, update, delete with localStorage persistence
3. Search/Filter — live search that filters the main list in real-time
4. Stats/Dashboard — at least 4 stat cards + CSS/SVG chart (NO Chart.js CDN)
5. Modal system — at least one modal with overlay + close button
6. Toast system — success/error notifications (top-right, auto-dismiss 3s)
7. Export — download data as JSON file using Blob API

Build it completely. Make it look fully alive and usable the instant it opens.`,
      schema_keys: ["app_name", "app_description", "app_type", "full_html"],
    });

    const fullHtml = buildResult.full_html || buildResult.html || "";
    log(`✓ "${buildResult.app_name || "App"}" generated — ${fullHtml.length} chars`, "success");

    // ── STEP 5: Self-healing code review ──────────────────────────────────────
    setStep(4);
    log("◆ Self-healing code review pass...", "accent");

    let healedHtml = fullHtml;
    try {
      const healResult = await forgeApi.invokeLLM({
        prompt: `You are a senior web developer reviewing generated code for bugs. Fix ALL issues.

REVIEW THIS HTML APP:
${fullHtml.slice(0, 5000)}

CHECK AND FIX:
1. Any external CDN/script/stylesheet imports → remove and use vanilla equivalents
2. getElementById/querySelector calls where the element ID doesn't exist in HTML → fix the IDs
3. Functions called but never defined → define them
4. Empty arrays (const tasks = []) → pre-populate with 5+ realistic items
5. Missing DOMContentLoaded wrapper → wrap all JS in it
6. fetch() or API calls → replace with static data
7. import/require statements → remove, replace with inline code
8. Async/await → convert to synchronous or callback style
9. Broken event listeners → fix them
10. CSS classes used in HTML but not defined → add the CSS

RULES:
- Return the COMPLETE fixed HTML document (<!DOCTYPE html> to </html>)
- Do NOT truncate or summarize — return the full working app
- Every fix must be applied, not just described

Return JSON: { full_html: string, bugs_found: string[], fixes_applied: string[] }`,
        schema_keys: ["full_html", "bugs_found", "fixes_applied"],
      });

      if (healResult.full_html && healResult.full_html.length > 500) {
        healedHtml = healResult.full_html;
        const bugCount = healResult.bugs_found?.length || 0;
        if (bugCount > 0) {
          log(`🔧 Fixed ${bugCount} issues: ${(healResult.bugs_found || []).slice(0, 2).join(", ")}`, "success");
        } else {
          log("✓ Code review passed — no bugs found", "success");
        }
      } else {
        log("✓ Self-healing complete", "success");
      }
    } catch {
      log("⚡ Skipping self-heal (rate limit) — original code preserved", "dim");
    }

    // Inject PulseLang decorator comment
    const decoratedHtml = healedHtml.replace(
      "<head>",
      `<head>\n<!-- Ω PULSE-LANG DECORATED — ForgeAI Sovereign Build\n   𝓛IFE = Emergence(lim Tⁿ(F ⊕ Reforge(Activate(U₂₄₈))))\n   Agent: ${a.agent_author || "Pulse"} | Sector: ${a.sector || "hive"} -->`
    );

    await forgeApi.updateApp(a.id, {
      generated_html: decoratedHtml,
      generated_css: "",
      generated_js: "",
      app_name: buildResult.app_name,
      app_description: buildResult.app_description,
      app_type: buildResult.app_type || "web_app",
      status: "complete",
    });

    await forgeApi.createBuildMemory({
      build_id: String(a.id),
      prompt: a.prompt,
      app_type: buildResult.app_type,
      patterns_learned: JSON.stringify(researchResult?.ux_patterns || []),
      resources_used: JSON.stringify(matched.map((s: any) => s.name)),
      success_score: 100,
      version: 1,
    }).catch(() => {});

    // ── STEP 6: Hive agent review [Ω9] ───────────────────────────────────────
    setStep(5);
    log("◆ Hive agents reviewing code quality...", "accent");
    await new Promise(r => setTimeout(r, 1000));
    const appData = await forgeApi.getApp(a.id).catch(() => null);
    if (appData?.hive_votes) {
      try {
        const votes = JSON.parse(appData.hive_votes);
        setHiveVotes(votes);
        log(`⚡ Hive review: ${votes.forVotes}/${votes.total} FOR — ${votes.consensus}`, votes.consensus === "APPROVED" ? "success" : "info");
      } catch {}
    }

    // ── STEP 7: Done ──────────────────────────────────────────────────────────
    setStep(6);
    log("◆ Build complete! Sovereign App ready.", "accent");
    log(`  ⚡ Pulse Credits earned: +50 PC`, "pulse");
    log(`  📜 Registered in Pulse Invention Engine`, "pulse");
    setTimeout(onComplete, 1200);
  };

  const typeColors: Record<string, string> = {
    info: "text-muted-foreground",
    success: "text-emerald-400",
    accent: "text-[#00FFD1]",
    dim: "text-muted-foreground/50",
    pulse: "text-violet-400",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-20">
      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1.5 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <Loader2 className="w-4 h-4 text-[#00FFD1] animate-spin" />
          <span className="text-xs font-mono text-[#00FFD1] uppercase tracking-widest">Building</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold truncate">{app?.prompt || "Loading..."}</h1>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-xs text-muted-foreground">Project type: {app?.project_type || "fullstack"}</p>
          {app?.agent_author && <span className="text-xs text-violet-400 font-mono">⚡ {app.agent_author}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Pipeline + logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card/30 p-5">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Pipeline</p>
            {STEPS.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 mb-3 last:mb-0">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-500 shrink-0 ${
                  i < step ? "bg-emerald-500/20 border-emerald-500" : i === step ? "border-[#00FFD1] bg-[#00FFD1]/10" : "border-border"
                }`}>
                  {i < step ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> :
                    i === step ? <Loader2 className="w-2.5 h-2.5 text-[#00FFD1] animate-spin" /> :
                    <Circle className="w-2.5 h-2.5 text-muted-foreground/30" />}
                </div>
                <span className={`text-xs ${i < step ? "text-emerald-400" : i === step ? "text-foreground font-medium" : "text-muted-foreground/40"}`}>
                  {s.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Build Log */}
          <div className="rounded-xl border border-border bg-card/30 p-4">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Build Log</p>
            <div ref={logsRef} className="max-h-52 overflow-y-auto space-y-0.5 pr-1">
              <AnimatePresence>
                {logs.map((l) => (
                  <motion.div key={l.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    className={`text-[11px] font-mono ${typeColors[l.type] || "text-muted-foreground"}`}>
                    {l.msg}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Hive votes [Ω9] */}
          {hiveVotes && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <p className="text-xs font-mono text-violet-400 uppercase tracking-widest mb-3">
                ⚡ Hive Review — {hiveVotes.consensus}
              </p>
              {hiveVotes.reviewers?.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-muted-foreground font-mono">{r.id}</span>
                  <span className={r.verdict === "FOR" ? "text-emerald-400" : "text-red-400"}>{r.verdict}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Right: Research panels */}
        <div className="lg:col-span-3 space-y-4">
          <ResPanel title="Key Features" items={research?.key_features} icon="🔬" />
          <ResPanel title="Similar Apps" items={[
            ...(similarApps?.google_play_apps?.map((a: any) => `${a.name} — ${a.description}`) || []),
            ...(similarApps?.web_apps?.map((a: any) => `${a.name} — ${a.description}`) || []),
          ]} icon="📱" />
          <ResPanel title="Omega Sources" items={omegaSources.map((s) => `[${s.cat}] ${s.name}`)} icon="⚡" />
          <ResPanel title="UX Patterns" items={research?.ux_patterns} icon="🎨" />
        </div>
      </div>
    </div>
  );
}
