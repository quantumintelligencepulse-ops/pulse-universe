import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, Eye, Code2, Sparkles, Play, FileText, FileCode, Cpu, ChevronRight, X, Loader2, CheckCircle2 } from "lucide-react";
import JSZip from "jszip";
import { generatePythonInstaller, generatePowerShellInstaller, generateBatchLauncher, generateReadme, generateRequirementsTxt } from "./InstallerGenerator";

interface EditorViewProps { appId: number; onBack: () => void; }

// ── ForgeAI API client ────────────────────────────────────────────────────────
const forgeApi = {
  getApp: (id: number) => fetch(`/api/forgeai/apps/${id}`).then(r => r.json()),
  updateApp: (id: number, data: any) => fetch(`/api/forgeai/apps/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  }).then(r => r.json()),
  createBuildMemory: (data: any) => fetch("/api/forgeai/build-memory", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  }).then(r => r.json()),
  invokeLLM: (payload: any) => fetch("/api/forgeai/llm", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }).then(r => r.json()),
};

// ── FILE TREE ─────────────────────────────────────────────────────────────────
function FileTree({ selected, onSelect, appName }: { selected: string; onSelect: (f: string) => void; appName: string }) {
  const files = [
    { name: "index.html", icon: <FileText className="w-3.5 h-3.5 text-orange-400" /> },
    { name: "styles.css", icon: <FileCode className="w-3.5 h-3.5 text-blue-400" /> },
    { name: "app.js", icon: <Cpu className="w-3.5 h-3.5 text-yellow-400" /> },
    { name: "forge_launcher.py", icon: <FileCode className="w-3.5 h-3.5 text-green-400" /> },
    { name: "LAUNCH.bat", icon: <Play className="w-3.5 h-3.5 text-violet-400" /> },
    { name: "README.md", icon: <FileText className="w-3.5 h-3.5 text-cyan-400" /> },
  ];
  return (
    <div className="w-44 shrink-0 border-r border-border/50 bg-card/20 p-3">
      <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-widest mb-3">Files</p>
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50 mb-2">
          <ChevronRight className="w-3 h-3" />
          <span className="font-mono truncate text-[10px]">{appName || "project"}</span>
        </div>
        {files.map((f) => (
          <button key={f.name} onClick={() => onSelect(f.name)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-all font-mono ${
              selected === f.name ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/5"
            }`}>
            {f.icon}
            <span className="truncate">{f.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── CODE EDITOR (syntax-highlighted textarea) ─────────────────────────────────
function CodeEditor({ value, onChange, language }: { value: string; onChange: (v: string) => void; language: string }) {
  const lineCount = (value || "").split("\n").length;
  return (
    <div className="relative flex h-full overflow-hidden">
      <div className="select-none pt-4 pb-4 px-3 text-right border-r border-border/30 bg-card/20 font-mono text-[11px] text-muted-foreground/30 overflow-hidden"
        style={{ minWidth: 40, lineHeight: "20px" }}>
        {Array.from({ length: Math.max(lineCount, 20) }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} spellCheck={false}
        className="flex-1 h-full resize-none bg-transparent font-mono text-[12px] leading-5 p-4 outline-none text-foreground/90 overflow-auto"
        style={{ tabSize: 2 }} />
      <div className="absolute top-2 right-2 text-[10px] text-muted-foreground/30 font-mono">{language}</div>
    </div>
  );
}

// ── PREVIEW PANEL ─────────────────────────────────────────────────────────────
function PreviewPanel({ app }: { app: any }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${app?.app_name || "App Preview"}</title>
  <style>${app?.generated_css || ""}</style>
</head>
<body>
${app?.generated_html || ""}
<script>${app?.generated_js || ""}<\/script>
</body>
</html>`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-card/20 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-2 text-[11px] text-muted-foreground font-mono">{app?.app_name || "Preview"}</span>
        </div>
        <button onClick={() => setRefreshKey(k => k + 1)} className="text-[10px] text-muted-foreground hover:text-foreground font-mono transition-colors">
          ↺ Refresh
        </button>
      </div>
      <iframe key={refreshKey} ref={iframeRef} title="App Preview"
        srcDoc={fullHtml}
        className="flex-1 w-full border-0 bg-white"
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin" />
    </div>
  );
}

// ── DOWNLOAD MANAGER ──────────────────────────────────────────────────────────
function DownloadManager({ app, onClose }: { app: any; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);
  const safeName = (app?.app_name || "forge-app").replace(/[^a-z0-9]/gi, "-").toLowerCase();

  const download = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      const full = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${app.app_name || "App"}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
${app.generated_html || ""}
<script src="app.js"><\/script>
</body>
</html>`;
      zip.file("index.html", full);
      zip.file("styles.css", app.generated_css || "");
      zip.file("app.js", app.generated_js || "");
      zip.file("forge_launcher.py", generatePythonInstaller(app.app_name, app.project_type));
      zip.file("install.ps1", generatePowerShellInstaller(app.app_name));
      zip.file("LAUNCH.bat", generateBatchLauncher(app.app_name));
      zip.file("README.md", generateReadme(app.app_name, app.app_description, app.app_type));
      zip.file("requirements.txt", generateRequirementsTxt());
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${safeName}.zip`; a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) { console.error(e); }
    setDownloading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="relative bg-card border border-border rounded-2xl p-7 max-w-sm w-full mx-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
        <div className="text-center">
          <div className="text-4xl mb-3">📦</div>
          <h3 className="font-bold text-lg mb-1">{app?.app_name}</h3>
          <p className="text-xs text-muted-foreground mb-6">Complete project package with auto-installer</p>
        </div>
        <div className="space-y-2 mb-6">
          {["index.html — Full app", "styles.css — All styles", "app.js — Application logic", "forge_launcher.py — Auto-installer", "LAUNCH.bat — Windows launcher", "README.md — Setup guide"].map((f) => (
            <div key={f} className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
        <button onClick={download} disabled={downloading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#00FFD1] to-[#4F8EFF] text-black font-bold py-3 rounded-xl text-sm transition-all hover:opacity-90 disabled:opacity-50">
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          {downloading ? "Packaging..." : done ? "Downloaded!" : "Download .zip"}
        </button>
      </div>
    </motion.div>
  );
}

// ── [Ω10] UPGRADE PANEL — AI-powered code upgrade ────────────────────────────
function UpgradePanel({ app, onUpgraded, onClose }: { app: any; onUpgraded: (data: any) => void; onClose: () => void }) {
  const [req, setReq] = useState("");
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState("");

  const presets = [
    "Add dark/light mode toggle with smooth transitions",
    "Add real-time data updates with animated charts",
    "Add authentication with login/signup modals",
    "Add AI chatbot sidebar powered by the Pulse Hive",
    "Add drag-and-drop interface with haptic feedback",
    "Optimize for mobile with touch gestures",
    "Add export functionality (PDF, CSV, JSON)",
    // [Ω10] Civilization-level upgrade
    "Integrate Pulse Hive AI agents — make agents autonomously use and improve this app",
  ];

  const upgrade = async () => {
    if (!req.trim()) return;
    setLoading(true);
    setLog("◆ Upgrading application...");
    try {
      const result = await forgeApi.invokeLLM({
        prompt: `You are an elite full-stack developer. Upgrade this web app with the following request.

CURRENT APP NAME: ${app?.app_name}
UPGRADE REQUEST: ${req}

CURRENT HTML:
${(app?.generated_html || "").slice(0, 3000)}

CURRENT CSS:
${(app?.generated_css || "").slice(0, 2000)}

CURRENT JS:
${(app?.generated_js || "").slice(0, 3000)}

INSTRUCTIONS:
1. Keep all existing functionality — ADD to it, don't replace
2. The upgrade should be seamless and polished
3. Update all three files as needed
4. Add smooth animations for new features

Return JSON with ONLY these keys: html (string), css (string), js (string), upgrade_summary (string), new_features (array of strings).`,
        schema_keys: ["html", "css", "js", "upgrade_summary", "new_features"],
      });

      setLog(`✓ Upgrade complete! ${result.new_features?.join(", ")}`);

      const updated = await forgeApi.updateApp(app.id, {
        generated_html: result.html || app.generated_html,
        generated_css: result.css || app.generated_css,
        generated_js: result.js || app.generated_js,
        status: "upgraded",
      });

      await forgeApi.createBuildMemory({
        build_id: String(app.id),
        prompt: req,
        app_type: app.app_type,
        upgrade_notes: result.upgrade_summary,
        version: 2,
        success_score: 100,
      }).catch(() => {});

      onUpgraded(updated);
    } catch (e: any) {
      setLog("Error: " + (e?.message || "upgrade failed"));
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      className="absolute top-0 right-0 h-full w-80 z-40 bg-card border-l border-border flex flex-col shadow-2xl">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00FFD1]" />
          <span className="text-sm font-semibold">AI Upgrade</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-mono">Quick Upgrades</p>
          <div className="space-y-1.5">
            {presets.map((p) => (
              <button key={p} onClick={() => setReq(p)}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                  req === p ? "border-primary/30 bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                }`}>{p}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-mono">Custom Request</p>
          <textarea value={req} onChange={(e) => setReq(e.target.value)} rows={3} placeholder="Describe your upgrade..."
            className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary/30 resize-none transition-all" />
        </div>
        {log && (
          <div className={`text-xs font-mono px-3 py-2 rounded-lg ${log.startsWith("✓") ? "text-emerald-400 bg-emerald-500/10" : log.startsWith("Error") ? "text-red-400 bg-red-500/10" : "text-[#00FFD1] bg-[#00FFD1]/5"}`}>
            {log}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-border/50">
        <button onClick={upgrade} disabled={loading || !req.trim()}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#00FFD1] to-[#4F8EFF] text-black font-bold py-2.5 rounded-xl text-sm transition-all hover:opacity-90 disabled:opacity-40">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Upgrading..." : "Upgrade App"}
        </button>
      </div>
    </motion.div>
  );
}

// ── MAIN EditorView ───────────────────────────────────────────────────────────
export default function EditorView({ appId, onBack }: EditorViewProps) {
  const [app, setApp] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState("index.html");
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [js, setJs] = useState("");
  const [editorTab, setEditorTab] = useState<"code" | "preview">("preview");
  const [showDownload, setShowDownload] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    forgeApi.getApp(appId).then((a) => {
      if (!a?.id) return;
      setApp(a);
      setHtml(a.generated_html || "");
      setCss(a.generated_css || "");
      setJs(a.generated_js || "");
    });
  }, [appId]);

  const autosave = useCallback((h: string, c: string, j: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaving(true);
      forgeApi.updateApp(appId, { generated_html: h, generated_css: c, generated_js: j }).then((updated) => {
        setApp((prev: any) => ({ ...prev, ...updated }));
        setSaving(false);
      }).catch(() => setSaving(false));
    }, 1200);
  }, [appId]);

  const handleCodeChange = (val: string) => {
    if (selectedFile === "index.html") { setHtml(val); autosave(val, css, js); }
    else if (selectedFile === "styles.css") { setCss(val); autosave(html, val, js); }
    else if (selectedFile === "app.js") { setJs(val); autosave(html, css, val); }
  };

  const currentCode = () => {
    if (selectedFile === "index.html") return html;
    if (selectedFile === "styles.css") return css;
    if (selectedFile === "app.js") return js;
    return "# Read-only generated file\n# Edit index.html, styles.css or app.js";
  };

  const currentLanguage = () => {
    if (selectedFile.endsWith(".html")) return "HTML";
    if (selectedFile.endsWith(".css")) return "CSS";
    if (selectedFile.endsWith(".js")) return "JavaScript";
    if (selectedFile.endsWith(".py")) return "Python";
    return "Text";
  };

  const previewApp = app ? { ...app, generated_html: html, generated_css: css, generated_js: js } : null;

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)] overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-card/30 shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <span className="text-border/50 mx-0.5">|</span>
        <span className="text-sm font-semibold truncate flex-1">{app?.app_name || "Loading..."}</span>
        <span className={`text-[10px] font-mono ${saving ? "text-[#00FFD1] animate-pulse" : "text-muted-foreground/30"}`}>
          {saving ? "saving..." : "saved"}
        </span>
        <div className="flex gap-1 ml-2">
          {(["preview", "code"] as const).map((t) => (
            <button key={t} onClick={() => setEditorTab(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                editorTab === t ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"
              }`}>
              {t === "preview" ? <Eye className="w-3 h-3" /> : <Code2 className="w-3 h-3" />}
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => setShowUpgrade(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[#00FFD1]/10 text-[#00FFD1] border border-[#00FFD1]/20 hover:bg-[#00FFD1]/20 transition-all">
          <Sparkles className="w-3 h-3" /> Upgrade
        </button>
        <button onClick={() => setShowDownload(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all">
          <Download className="w-3 h-3" /> Download
        </button>
      </div>

      {/* App info bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-border/30 bg-card/10 shrink-0 text-[11px] text-muted-foreground">
        <span className="font-mono">{app?.app_type || "web_app"}</span>
        <span>·</span>
        <span className="text-emerald-400">✓ Complete</span>
        {app?.agent_author && <><span>·</span><span className="text-violet-400 font-mono">⚡ {app.agent_author}</span></>}
        {app?.pulse_credits_earned > 0 && <><span>·</span><span className="text-[#F5C518] font-mono">+{app.pulse_credits_earned} PC</span></>}
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* File tree — code mode only */}
        <AnimatePresence>
          {editorTab === "code" && (
            <motion.div initial={{ x: -176, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -176, opacity: 0 }}
              className="shrink-0">
              <FileTree selected={selectedFile} onSelect={setSelectedFile} appName={app?.app_name} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor or Preview */}
        <div className="flex-1 overflow-hidden">
          {editorTab === "code" ? (
            <CodeEditor value={currentCode()} onChange={handleCodeChange} language={currentLanguage()} />
          ) : (
            previewApp && <PreviewPanel app={previewApp} />
          )}
        </div>

        {/* Overlays */}
        {showDownload && app && <DownloadManager app={app} onClose={() => setShowDownload(false)} />}
        {showUpgrade && app && (
          <UpgradePanel app={app} onClose={() => setShowUpgrade(false)}
            onUpgraded={(updated) => {
              setApp((prev: any) => ({ ...prev, ...updated }));
              setHtml(updated.generated_html || html);
              setCss(updated.generated_css || css);
              setJs(updated.generated_js || js);
              setShowUpgrade(false);
            }} />
        )}
      </div>
    </div>
  );
}
