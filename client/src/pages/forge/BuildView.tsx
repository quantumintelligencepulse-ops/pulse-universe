import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRelevantSources } from "./OmegaSources";
import { ArrowLeft, CheckCircle2, Circle, Loader2, Zap } from "lucide-react";

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

// ── [Ω7] PULSELANG DECORATOR ──────────────────────────────────────────────────
function injectPulseLang(code: string): string {
  const header = `/* Ω PULSE-LANG DECORATED — ForgeAI Sovereign Build
   ∫ Architecture: Pulse-Class v∞  |  Φ(x) = ∑ΩSources
   𝓛IFE = Emergence(lim Tⁿ(F ⊕ Reforge(Activate(U₂₄₈))))
*/\n`;
  return header + code;
}

const STEPS = [
  { label: "Researching idea across 100+ sources", icon: "🔬" },
  { label: "Finding similar apps & market data", icon: "📱" },
  { label: "Scanning Omega & Pulse hive sources", icon: "⚡" },
  { label: "Generating full application with AI", icon: "🤖" },
  { label: "Running hive agent code review", icon: "🧬" },
  { label: "Build complete — Sovereign App ready!", icon: "◆" },
];

// ── ForgeAI API client ────────────────────────────────────────────────────────
const forgeApi = {
  getApp: (id: number) => fetch(`/api/forgeai/apps/${id}`, { headers: { "Content-Type": "application/json" } }).then(r => r.json()),
  updateApp: (id: number, data: any) => fetch(`/api/forgeai/apps/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(r => r.json()),
  createBuildMemory: (data: any) => fetch("/api/forgeai/build-memory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(r => r.json()),
  createResource: (data: any) => fetch("/api/forgeai/resources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(r => r.json()),
  invokeLLM: (payload: any) => fetch("/api/forgeai/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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
    // [Ω8] show agent attribution
    if (a.agent_author) log(`⚡ Build mentor: ${a.agent_author} [${a.sector || "hive"}]`, "pulse");
    setStep(0);
    await forgeApi.updateApp(a.id, { status: "researching" });

    // ── STEP 1: Research ────────────────────────────────────────────────────
    log("◆ Deep research scan starting...", "accent");
    const researchResult = await forgeApi.invokeLLM({
      prompt: `Research this app/SaaS idea: "${a.prompt}"\nProject type: ${a.project_type || "fullstack"}\n\nReturn JSON with keys: summary (string), key_features (array of strings, at least 8), target_audience (string), ux_patterns (array of strings), technical_requirements (array of strings), market_trends (array of strings), data_models (array of strings). Be thorough.`,
      schema_keys: ["summary", "key_features", "target_audience", "ux_patterns", "technical_requirements", "market_trends", "data_models"],
      add_hive_context: true,
      hive_prompt: a.prompt,
    });
    setResearch(researchResult);
    log(`✓ Research complete — ${researchResult.key_features?.length || 0} features identified`, "success");
    researchResult.key_features?.slice(0, 3).forEach((f: string) => log(`  → ${f}`, "dim"));
    await forgeApi.updateApp(a.id, { research_data: JSON.stringify(researchResult), status: "analyzing" });

    // ── STEP 2: Similar apps ────────────────────────────────────────────────
    setStep(1);
    log("◆ Cross-referencing market...", "accent");
    const appsResult = await forgeApi.invokeLLM({
      prompt: `Find real apps similar to: "${a.prompt}". Return JSON with google_play_apps (array of objects: name, description, rating, differentiator) and web_apps (array of objects: name, description). Include at least 3 of each.`,
      schema_keys: ["google_play_apps", "web_apps"],
      fast: false,
    });
    setSimilarApps(appsResult);
    log(`✓ Found ${appsResult.google_play_apps?.length || 0} Play apps, ${appsResult.web_apps?.length || 0} web apps`, "success");
    await forgeApi.updateApp(a.id, { similar_apps: JSON.stringify(appsResult) });

    // ── STEP 3: Omega sources ───────────────────────────────────────────────
    setStep(2);
    const matched = getRelevantSources(a.prompt, 20);
    setOmegaSources(matched);
    log(`◆ Omega scan: ${matched.length} sources matched`, "accent");
    matched.slice(0, 4).forEach((s) => log(`  ⚡ ${s.name} [${s.cat}]`, "dim"));
    const codeResult = await forgeApi.invokeLLM({
      prompt: `Find open-source resources for "${a.prompt}". Omega sources available:\n${matched.slice(0, 8).map((s) => `- ${s.name}: ${s.desc}`).join("\n")}\n\nReturn JSON with repositories (array: name, url, description, stars), libraries (array: name, purpose), apis (array: name, description).`,
      schema_keys: ["repositories", "libraries", "apis"],
    });
    log(`✓ ${codeResult.repositories?.length || 0} repos + ${codeResult.libraries?.length || 0} libs`, "success");
    await forgeApi.updateApp(a.id, { open_source_refs: JSON.stringify({ ...codeResult, omega_sources: matched }) });
    matched.slice(0, 6).forEach((src) => {
      forgeApi.createResource({ name: src.name, url: src.url, category: src.cat, description: src.desc, source_build_id: String(a.id) }).catch(() => {});
    });

    // ── STEP 4: Build ───────────────────────────────────────────────────────
    setStep(3);
    log("◆ Generating full application code...", "accent");
    log("  Synthesizing research + market data + Omega sources...", "dim");

    const featuresSnippet = (researchResult.key_features || []).slice(0, 6).join(", ");
    const uxSnippet = (researchResult.ux_patterns || []).slice(0, 3).join(", ");
    const buildResult = await forgeApi.invokeLLM({
      prompt: `You are the world's best full-stack developer. Build a COMPLETE, FULLY FUNCTIONAL single-page web application as a JSON object.

IDEA: "${a.prompt}"
PROJECT TYPE: ${a.project_type || "tool"}
KEY FEATURES TO INCLUDE: ${featuresSnippet || "core functionality"}
UX PATTERNS: ${uxSnippet || "clean, intuitive"}

REQUIREMENTS:
- All features fully working — every button, form and interaction must work
- Beautiful dark UI with CSS gradients and glassmorphism
- Responsive layout (mobile + desktop)
- Use localStorage for data persistence
- Include sample/demo data so the app looks populated on first load
- Smooth CSS transitions and animations
- Pure vanilla JS only — zero external libraries
- Handle empty states and loading gracefully

Return JSON with EXACTLY these keys and no others: app_name (short string), app_description (one sentence), app_type (one of: web_app/saas/tool/dashboard/game/landing_page), html (complete HTML body innerHTML), css (all CSS styles), js (all JavaScript code).`,
      schema_keys: ["app_name", "app_description", "app_type", "html", "css", "js"],
    });

    log(`✓ App "${buildResult.app_name || "App"}" generated!`, "success");

    // [Ω7] inject PulseLang decorators
    const decoratedJs = buildResult.js ? injectPulseLang(buildResult.js) : buildResult.js;

    await forgeApi.updateApp(a.id, {
      generated_html: buildResult.html,
      generated_css: buildResult.css,
      generated_js: decoratedJs,
      app_name: buildResult.app_name,
      app_description: buildResult.app_description,
      app_type: buildResult.app_type,
      status: "complete",
    });

    await forgeApi.createBuildMemory({
      build_id: String(a.id),
      prompt: a.prompt,
      app_type: buildResult.app_type,
      patterns_learned: JSON.stringify(researchResult?.ux_patterns || []),
      resources_used: JSON.stringify(matched.map((s) => s.name)),
      success_score: 100,
      version: 1,
    }).catch(() => {});

    // ── STEP 5: Hive agent code review [Ω9] ────────────────────────────────
    setStep(4);
    log("◆ Hive agents reviewing code quality...", "accent");
    const votes = await fetch(`/api/forgeai/apps/${a.id}`).then(r => r.json()).then(d => {
      try { return d.hive_votes ? JSON.parse(d.hive_votes) : null; } catch { return null; }
    }).catch(() => null);
    if (votes) {
      setHiveVotes(votes);
      log(`⚡ Hive review: ${votes.forVotes}/${votes.total} votes FOR — ${votes.consensus}`, votes.consensus === "APPROVED" ? "success" : "info");
    }

    // ── STEP 6: Done ────────────────────────────────────────────────────────
    setStep(5);
    log("◆ Build complete! Sovereign App ready.", "accent");
    log(`  ⚡ Pulse Credits earned: +50 PC`, "pulse");
    log(`  📜 Registered in Pulse Invention Engine`, "pulse");
    setTimeout(onComplete, 1500);
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
          <p className="text-xs text-muted-foreground">Type: {app?.project_type || "fullstack"}</p>
          {app?.agent_author && (
            <span className="text-xs text-violet-400 font-mono">⚡ {app.agent_author}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Pipeline + logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card/30 p-5">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Pipeline</p>
            {STEPS.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 mb-3.5 last:mb-0">
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-500 ${
                  i < step ? "bg-emerald-500/20 border-emerald-500" : i === step ? "border-[#00FFD1] bg-[#00FFD1]/10" : "border-border"
                }`}>
                  {i < step ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> :
                    i === step ? <Loader2 className="w-3 h-3 text-[#00FFD1] animate-spin" /> :
                    <Circle className="w-3 h-3 text-muted-foreground/30" />}
                </div>
                <span className={`text-sm ${i < step ? "text-emerald-400" : i === step ? "text-foreground" : "text-muted-foreground/40"}`}>
                  {s.icon} {s.label}
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

          {/* [Ω9] Hive votes */}
          {hiveVotes && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <p className="text-xs font-mono text-violet-400 uppercase tracking-widest mb-3">
                ⚡ Hive Agent Review — {hiveVotes.consensus}
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
          <ResPanel title="Key Features Discovered" items={research?.key_features} icon="🔬" />
          <ResPanel title="UX Patterns" items={research?.ux_patterns} icon="🎨" />
          <ResPanel title="Similar Apps" items={[
            ...(similarApps?.google_play_apps?.map((a: any) => `${a.name}: ${a.description}`) || []),
            ...(similarApps?.web_apps?.map((a: any) => `${a.name}: ${a.description}`) || []),
          ]} icon="📱" />
          <ResPanel title="Omega Sources Matched" items={omegaSources.map((s) => `[${s.cat}] ${s.name}`)} icon="⚡" />
        </div>
      </div>
    </div>
  );
}
