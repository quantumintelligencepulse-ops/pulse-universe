import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, Eye, Code2, Sparkles, Play, FileText, FileCode, Cpu, X, Loader2, CheckCircle2, Globe, Send, MessageSquare, GitBranch, ExternalLink, Copy, BarChart3 } from "lucide-react";
import JSZip from "jszip";
import { generatePythonInstaller, generatePowerShellInstaller, generateBatchLauncher, generateReadme, generateRequirementsTxt } from "./InstallerGenerator";

interface EditorViewProps { appId: number; onBack: () => void; }

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
  chatMutate: (appId: number, message: string) => fetch(`/api/forge/chat/${appId}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }),
  }).then(r => r.json()),
  getMutations: (appId: number) => fetch(`/api/forge/mutations/${appId}`).then(r => r.json()).catch(() => []),
  getAnalytics: (appId: number) => fetch(`/api/forge/analytics/${appId}`).then(r => r.json()).catch(() => ({ events: [], total_views: 0 })),
  remix: (appId: number) => fetch(`/api/forge/remix/${appId}`, { method: "POST" }).then(r => r.json()),
};

function isFullDocument(html: string): boolean {
  const trimmed = (html || "").trim().toLowerCase();
  return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html");
}

function buildSrcDoc(app: any, fullHtml: string): string {
  if (isFullDocument(fullHtml)) return fullHtml;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${app?.app_name || "App Preview"}</title>
  <style>${app?.generated_css || ""}</style>
</head>
<body>
${app?.generated_html || ""}
<script>
document.addEventListener('DOMContentLoaded', function() {
${app?.generated_js || ""}
});
<\/script>
</body>
</html>`;
}

function FileTree({ selected, onSelect, appName, isFull }: {
  selected: string; onSelect: (f: string) => void; appName: string; isFull: boolean;
}) {
  const files = isFull ? [
    { name: "index.html", icon: <FileText className="w-3.5 h-3.5 text-orange-400" /> },
    { name: "forge_launcher.py", icon: <FileCode className="w-3.5 h-3.5 text-green-400" /> },
    { name: "LAUNCH.bat", icon: <Play className="w-3.5 h-3.5 text-violet-400" /> },
    { name: "README.md", icon: <FileText className="w-3.5 h-3.5 text-cyan-400" /> },
  ] : [
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
        <div className="text-[10px] text-muted-foreground/50 font-mono truncate mb-2 px-2">{appName || "project"}/</div>
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

function CodeEditor({ value, onChange, language, readOnly = false }: {
  value: string; onChange: (v: string) => void; language: string; readOnly?: boolean;
}) {
  const lineCount = (value || "").split("\n").length;
  return (
    <div className="relative flex h-full overflow-hidden">
      <div className="select-none pt-4 pb-4 px-3 text-right border-r border-border/30 bg-card/20 font-mono text-[11px] text-muted-foreground/30 overflow-hidden"
        style={{ minWidth: 40, lineHeight: "20px" }}>
        {Array.from({ length: Math.max(lineCount, 20) }, (_, i) => <div key={i}>{i + 1}</div>)}
      </div>
      <textarea value={value || ""} onChange={(e) => !readOnly && onChange(e.target.value)}
        readOnly={readOnly} spellCheck={false}
        className="flex-1 h-full resize-none bg-transparent font-mono text-[12px] leading-5 p-4 outline-none text-foreground/90 overflow-auto"
        style={{ tabSize: 2 }} />
      <div className="absolute top-2 right-2 text-[10px] text-muted-foreground/30 font-mono">{language}</div>
    </div>
  );
}

function PreviewPanel({ srcDoc, appName }: { srcDoc: string; appName: string }) {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-card/20 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-2 text-[11px] text-muted-foreground font-mono">{appName || "Preview"}</span>
        </div>
        <button onClick={() => setRefreshKey(k => k + 1)} className="text-[10px] text-muted-foreground hover:text-foreground font-mono transition-colors">
          ↺ Refresh
        </button>
      </div>
      <iframe key={refreshKey} title="App Preview"
        srcDoc={srcDoc}
        className="flex-1 w-full border-0"
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin" />
    </div>
  );
}

function DownloadManager({ app, fullHtml, onClose }: { app: any; fullHtml: string; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);
  const safeName = (app?.app_name || "forge-app").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const isFull = isFullDocument(fullHtml);

  const download = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      if (isFull) {
        zip.file("index.html", fullHtml);
      } else {
        const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${app.app_name || "App"}</title><link rel="stylesheet" href="styles.css" /></head><body>${app.generated_html || ""}<script src="app.js"><\/script></body></html>`;
        zip.file("index.html", html);
        zip.file("styles.css", app.generated_css || "");
        zip.file("app.js", app.generated_js || "");
      }
      zip.file("forge_launcher.py", generatePythonInstaller(app.app_name, app.project_type));
      zip.file("install.ps1", generatePowerShellInstaller(app.app_name));
      zip.file("LAUNCH.bat", generateBatchLauncher(app.app_name));
      zip.file("README.md", generateReadme(app.app_name, app.app_description, app.app_type));
      zip.file("requirements.txt", generateRequirementsTxt());
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${safeName}.zip`; a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) { console.error(e); }
    setDownloading(false);
  };

  const fileList = isFull
    ? ["index.html — Complete standalone app", "forge_launcher.py — Auto-installer", "LAUNCH.bat — Windows launcher", "README.md — Setup guide"]
    : ["index.html — App shell", "styles.css — All styles", "app.js — Application logic", "forge_launcher.py — Auto-installer", "LAUNCH.bat — Windows launcher", "README.md — Setup guide"];

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
          {fileList.map((f) => (
            <div key={f} className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
        <button onClick={download} disabled={downloading} data-testid="button-download-zip"
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#00FFD1] to-[#4F8EFF] text-black font-bold py-3 rounded-xl text-sm transition-all hover:opacity-90 disabled:opacity-50">
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          {downloading ? "Packaging..." : done ? "Downloaded!" : "Download .zip"}
        </button>
      </div>
    </motion.div>
  );
}

// ── SOLUTION 5: CONVERSATIONAL MUTATION CHAT PANEL ──────────────────────────
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  changes?: string[];
  generation?: number;
  timestamp: number;
}

function ChatMutationPanel({ appId, app, onMutated, onClose }: {
  appId: number; app: any; onMutated: (html: string, gen: number) => void; onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: `I'm Ultron — your app's evolution engine. Tell me what to change, add, fix, or improve in "${app?.app_name || "your app"}". I'll make surgical edits without breaking anything.`, timestamp: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mutations, setMutations] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    forgeApi.getMutations(appId).then(setMutations).catch(() => {});
  }, [appId]);

  const scrollBottom = () => setTimeout(() => chatRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 50);

  const presets = [
    "Change the primary color to blue",
    "Add a calendar view for date items",
    "Make the search bar more prominent",
    "Add CSV export to the dashboard",
    "Add a settings page with user preferences",
    "Make it fully responsive for mobile",
  ];

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: msg, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    scrollBottom();
    setLoading(true);

    try {
      const result = await forgeApi.chatMutate(appId, msg);
      if (result.ok && result.full_html) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(), role: "assistant",
          content: result.summary || "Changes applied successfully.",
          changes: result.changes_made, generation: result.generation,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, aiMsg]);
        onMutated(result.full_html, result.generation);
        forgeApi.getMutations(appId).then(setMutations).catch(() => {});
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), role: "assistant",
          content: result.error || "Could not apply that change — try rephrasing.",
          timestamp: Date.now(),
        }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: "assistant",
        content: `Error: ${e.message || "mutation failed"}. Try again in a moment.`,
        timestamp: Date.now(),
      }]);
    }
    setLoading(false);
    scrollBottom();
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      className="absolute top-0 right-0 h-full w-[340px] z-40 bg-card border-l border-border flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#00FFD1]" />
          <span className="text-sm font-semibold">Chat with Ultron</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowHistory(!showHistory)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors" title="Mutation History">
            <GitBranch className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Mutation Ancestry</p>
          {mutations.length === 0 && <p className="text-xs text-muted-foreground">No mutations yet</p>}
          {mutations.map((m: any, i: number) => (
            <div key={m.id || i} className="rounded-lg border border-border/50 bg-card/20 p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-violet-400">Gen {m.generation}</span>
                <span className="text-[9px] text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-foreground/80 line-clamp-2">{m.instruction}</p>
              <p className="text-[9px] text-muted-foreground mt-1 font-mono">#{m.html_snapshot_hash?.slice(0, 8)}</p>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Quick presets */}
          <div className="p-2 border-b border-border/30 shrink-0">
            <div className="flex flex-wrap gap-1">
              {presets.map(p => (
                <button key={p} onClick={() => setInput(p)}
                  className="text-[9px] px-2 py-1 rounded-full border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
                  {p.length > 30 ? p.slice(0, 28) + "…" : p}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                  msg.role === "user"
                    ? "bg-primary/10 border border-primary/20 text-foreground"
                    : "bg-card/40 border border-border/30 text-foreground/90"
                }`}>
                  <p className="text-xs leading-relaxed">{msg.content}</p>
                  {msg.changes && msg.changes.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.changes.map((c, i) => (
                        <div key={i} className="text-[10px] text-emerald-400 flex items-start gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.generation && (
                    <p className="text-[9px] text-violet-400 font-mono mt-1">Gen {msg.generation}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-card/40 border border-border/30 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-[#00FFD1]" />
                  <span className="text-xs text-muted-foreground">Ultron mutating...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border/50 shrink-0">
            <div className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Tell Ultron what to change..."
                data-testid="input-chat-mutation"
                className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/30 transition-all" />
              <button onClick={sendMessage} disabled={loading || !input.trim()} data-testid="button-send-mutation"
                className="px-3 py-2 bg-gradient-to-r from-[#00FFD1] to-[#4F8EFF] text-black rounded-xl transition-all hover:opacity-90 disabled:opacity-40">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ── GO LIVE PANEL — instant public URL ──────────────────────────────────────
function GoLivePanel({ app, onToggle, onClose }: { app: any; onToggle: (isPublic: boolean) => void; onClose: () => void }) {
  const isLive = app?.is_public;
  const publicUrl = `${window.location.origin}/forge/live/${app?.id}`;
  const badgeUrl = `${window.location.origin}/forge/badge/${app?.id}`;
  const certUrl = `${window.location.origin}/forge/cert/${app?.id}`;
  const [copied, setCopied] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (app?.id) forgeApi.getAnalytics(app.id).then(setAnalytics).catch(() => {});
  }, [app?.id]);

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggle = async () => {
    await forgeApi.updateApp(app.id, { is_public: !isLive });
    onToggle(!isLive);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="relative bg-card border border-border rounded-2xl p-7 max-w-md w-full mx-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">{isLive ? "🌐" : "🚀"}</div>
          <h3 className="font-bold text-lg">{isLive ? "Your App is Live!" : "Go Live"}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {isLive ? "Anyone with the link can access your app" : "Make your app available at a permanent public URL"}
          </p>
        </div>

        {isLive && (
          <div className="space-y-3 mb-5">
            <div className="bg-background rounded-xl border border-[#00FFD1]/20 p-3">
              <p className="text-[10px] text-muted-foreground mb-1 font-mono">PUBLIC URL</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-[#00FFD1] flex-1 truncate" data-testid="text-public-url">{publicUrl}</code>
                <button onClick={copyUrl} className="shrink-0 p-1.5 rounded-md bg-[#00FFD1]/10 hover:bg-[#00FFD1]/20 transition-colors" data-testid="button-copy-url">
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#00FFD1]" />}
                </button>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1.5 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors" data-testid="link-open-live">
                  <ExternalLink className="w-3.5 h-3.5 text-primary" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background rounded-lg border border-border p-2.5">
                <p className="text-[9px] text-muted-foreground font-mono mb-0.5">VIEWS</p>
                <p className="text-lg font-bold text-foreground">{analytics?.total_views || 0}</p>
              </div>
              <div className="bg-background rounded-lg border border-border p-2.5">
                <p className="text-[9px] text-muted-foreground font-mono mb-0.5">TRUST SCORE</p>
                <p className="text-lg font-bold text-[#00FFD1]">{app?.trust_score || 70}/100</p>
              </div>
            </div>

            <div className="bg-background rounded-lg border border-border p-2.5">
              <p className="text-[9px] text-muted-foreground font-mono mb-1.5">EMBED BADGE</p>
              <code className="text-[10px] text-muted-foreground break-all">{`<img src="${badgeUrl}" alt="Pulse Certified" />`}</code>
            </div>

            <div className="bg-background rounded-lg border border-border p-2.5">
              <p className="text-[9px] text-muted-foreground font-mono mb-1.5">SOVEREIGN CERTIFICATE</p>
              <a href={certUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> View machine-readable provenance
              </a>
            </div>
          </div>
        )}

        <button onClick={toggle} data-testid="button-go-live"
          className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-sm transition-all ${
            isLive
              ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
              : "bg-gradient-to-r from-[#00FFD1] to-[#4F8EFF] text-black hover:opacity-90"
          }`}>
          <Globe className="w-4 h-4" />
          {isLive ? "Take Offline" : "Go Live — Get Public URL"}
        </button>
      </div>
    </motion.div>
  );
}

// ── MAIN EditorView ───────────────────────────────────────────────────────────
export default function EditorView({ appId, onBack }: EditorViewProps) {
  const [app, setApp] = useState<any>(null);
  const [fullHtml, setFullHtml] = useState("");
  const [selectedFile, setSelectedFile] = useState("index.html");
  const [editorTab, setEditorTab] = useState<"code" | "preview">("preview");
  const [showDownload, setShowDownload] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showGoLive, setShowGoLive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generation, setGeneration] = useState(1);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    forgeApi.getApp(appId).then((a) => {
      if (!a?.id) return;
      setApp(a);
      const html = a.generated_html || "";
      if (isFullDocument(html)) {
        setFullHtml(html);
      } else {
        setFullHtml(buildSrcDoc(a, html));
      }
    });
  }, [appId]);

  const autosave = useCallback((html: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaving(true);
      forgeApi.updateApp(appId, {
        generated_html: html, generated_css: "", generated_js: "",
      }).then((updated) => {
        setApp((prev: any) => ({ ...prev, ...updated }));
        setSaving(false);
      }).catch(() => setSaving(false));
    }, 1500);
  }, [appId]);

  const handleCodeChange = (val: string) => {
    if (selectedFile === "index.html") {
      setFullHtml(val);
      autosave(val);
    }
  };

  const getCodeContent = () => {
    if (selectedFile === "index.html") return fullHtml;
    if (selectedFile === "forge_launcher.py") return generatePythonInstaller(app?.app_name, app?.project_type);
    if (selectedFile === "LAUNCH.bat") return generateBatchLauncher(app?.app_name);
    if (selectedFile === "README.md") return generateReadme(app?.app_name, app?.app_description, app?.app_type);
    return "# Read-only file";
  };

  const getLanguage = () => {
    if (selectedFile.endsWith(".html")) return "HTML";
    if (selectedFile.endsWith(".css")) return "CSS";
    if (selectedFile.endsWith(".js")) return "JavaScript";
    if (selectedFile.endsWith(".py")) return "Python";
    if (selectedFile.endsWith(".md")) return "Markdown";
    return "Text";
  };

  const isEditableFile = selectedFile === "index.html";
  const isFull = isFullDocument(fullHtml);
  const isLive = app?.is_public;

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)] overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-card/30 shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back-editor">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <span className="text-border/50 mx-0.5">|</span>
        <span className="text-sm font-semibold truncate flex-1" data-testid="text-app-name">{app?.app_name || "Loading..."}</span>
        {generation > 1 && <span className="text-[10px] font-mono text-violet-400">Gen {generation}</span>}
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
        <button onClick={() => setShowChat(true)} data-testid="button-open-chat"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[#00FFD1]/10 text-[#00FFD1] border border-[#00FFD1]/20 hover:bg-[#00FFD1]/20 transition-all">
          <MessageSquare className="w-3 h-3" /> Chat
        </button>
        <button onClick={() => setShowGoLive(true)} data-testid="button-go-live-toggle"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
            isLive
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20"
          }`}>
          <Globe className="w-3 h-3" /> {isLive ? "Live" : "Go Live"}
        </button>
        <button onClick={() => setShowDownload(true)} data-testid="button-download"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all">
          <Download className="w-3 h-3" /> Download
        </button>
      </div>

      {/* App info bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-border/30 bg-card/10 shrink-0 text-[11px] text-muted-foreground">
        <span className="font-mono">{app?.app_type || "web_app"}</span>
        <span>·</span>
        <span className="text-emerald-400">✓ {app?.status || "complete"}</span>
        {isFull && <><span>·</span><span className="text-[#00FFD1]/70 font-mono">◆ Standalone HTML</span></>}
        {isLive && <><span>·</span><span className="text-emerald-400 font-mono">🌐 Live</span></>}
        {app?.agent_author && <><span>·</span><span className="text-violet-400 font-mono">⚡ {app.agent_author}</span></>}
        {app?.trust_score > 0 && <><span>·</span><span className="text-[#F5C518] font-mono">Trust: {app.trust_score}/100</span></>}
        {app?.view_count > 0 && <><span>·</span><span className="text-muted-foreground font-mono">{app.view_count} views</span></>}
        {app?.pulse_credits_earned > 0 && <><span>·</span><span className="text-[#F5C518] font-mono">+{app.pulse_credits_earned} PC</span></>}
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden relative">
        <AnimatePresence>
          {editorTab === "code" && (
            <motion.div initial={{ x: -176, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -176, opacity: 0 }} className="shrink-0">
              <FileTree selected={selectedFile} onSelect={setSelectedFile} appName={app?.app_name} isFull={isFull} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-hidden">
          {editorTab === "code" ? (
            <CodeEditor value={getCodeContent()} onChange={handleCodeChange} language={getLanguage()} readOnly={!isEditableFile} />
          ) : (
            fullHtml ? <PreviewPanel srcDoc={fullHtml} appName={app?.app_name || "App Preview"} /> : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading preview...</div>
            )
          )}
        </div>

        {/* Overlays */}
        {showDownload && app && (
          <DownloadManager app={app} fullHtml={fullHtml} onClose={() => setShowDownload(false)} />
        )}
        {showGoLive && app && (
          <GoLivePanel
            app={app}
            onToggle={(pub) => { setApp((prev: any) => ({ ...prev, is_public: pub })); }}
            onClose={() => setShowGoLive(false)}
          />
        )}
        {showChat && app && (
          <ChatMutationPanel
            appId={appId} app={app}
            onClose={() => setShowChat(false)}
            onMutated={(newHtml, gen) => {
              setFullHtml(newHtml);
              setGeneration(gen);
              setApp((prev: any) => ({ ...prev, generated_html: newHtml, generated_css: "", generated_js: "" }));
            }}
          />
        )}
      </div>
    </div>
  );
}
