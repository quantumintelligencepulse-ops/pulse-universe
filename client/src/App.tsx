import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from "react";
import { Switch, Route, useLocation, useRoute, Link } from "wouter";
import { QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, vscDarkPlus, dracula, atomDark, coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Send, MessageSquare, Code2, Plus, Trash2, PanelLeftClose, PanelLeftOpen,
  Copy, Check, Download, Sparkles, Zap, Bug, FileCode, Cpu, Terminal,
  BookOpen, Lightbulb, Wrench, Globe, ArrowDown, RotateCcw,
  Pencil, Search, X, Trash, FileDown, ThumbsUp, ThumbsDown,
  BarChart3, Wifi, WifiOff, Play, Hash, Shield,
  Maximize2, Minimize2, WrapText, Type, Palette, FolderOpen,
  Archive, Eye, EyeOff, Layers, GitBranch, Package,
  Braces, Database, Lock, TestTube, Smartphone, Cloud,
  ChevronDown, ChevronUp, Settings2, Brackets, FlaskConical, Rocket,
  Mic, MicOff, SplitSquareVertical, Wand2, Brain, Scan, Square,
  SquareTerminal, LayoutPanelLeft, Eraser, RefreshCw, StopCircle
} from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import type { Chat, Message } from "@shared/schema";
import logo from "@assets/MyAiGpt_1772000395528.webp";

// ─── THEME CONTEXT (#1 - Code theme system) ─────────────────────────────────

const CODE_THEMES: Record<string, { name: string; style: any; bg: string }> = {
  oneDark: { name: "One Dark", style: oneDark, bg: "#1a1a2e" },
  vscode: { name: "VS Code", style: vscDarkPlus, bg: "#1e1e1e" },
  dracula: { name: "Dracula", style: dracula, bg: "#282a36" },
  atom: { name: "Atom", style: atomDark, bg: "#1d1f21" },
  coldark: { name: "Coldark", style: coldarkDark, bg: "#111b27" },
};

type CoderSettings = {
  codeTheme: string;
  fontSize: number;
  wordWrap: boolean;
  showLineNumbers: boolean;
  showMinimap: boolean;
};

const defaultSettings: CoderSettings = { codeTheme: "oneDark", fontSize: 13, wordWrap: false, showLineNumbers: true, showMinimap: false };

const SettingsCtx = createContext<{ settings: CoderSettings; set: (s: Partial<CoderSettings>) => void }>({ settings: defaultSettings, set: () => {} });

function useCoderSettings() { return useContext(SettingsCtx); }

// ─── HOOKS ───────────────────────────────────────────────────────────────────

function useChats() {
  return useQuery<Chat[]>({ queryKey: [api.chats.list.path], queryFn: async () => { const r = await fetch(api.chats.list.path); return r.json(); } });
}
function useMessages(chatId: number | null) {
  return useQuery<Message[]>({
    queryKey: [api.messages.list.path, chatId],
    queryFn: async () => { if (!chatId) return []; const r = await fetch(buildUrl(api.messages.list.path, { chatId })); return r.json(); },
    enabled: !!chatId,
  });
}
function useStats() {
  return useQuery<{ chatCount: number; messageCount: number; codeFiles: number; discordConnected: boolean }>({
    queryKey: ["/api/stats"], queryFn: async () => { const r = await fetch("/api/stats"); return r.json(); }, refetchInterval: 30000,
  });
}
function useSavedCodes() {
  return useQuery<Array<{ name: string; size: number; modified: string; lines: number; ext: string }>>({
    queryKey: ["/api/saved-codes"], queryFn: async () => { const r = await fetch("/api/saved-codes"); return r.json(); },
  });
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────

const EXT_MAP: Record<string, string> = {
  python: "py", javascript: "js", typescript: "ts", java: "java", cpp: "cpp",
  c: "c", html: "html", css: "css", sql: "sql", rust: "rs", go: "go",
  bash: "sh", shell: "sh", ruby: "rb", php: "php", swift: "swift",
  kotlin: "kt", csharp: "cs", dart: "dart", r: "r", lua: "lua", json: "json",
  yaml: "yaml", xml: "xml", markdown: "md", dockerfile: "dockerfile",
};

// #2 - Language icons mapping
const LANG_ICONS: Record<string, { icon: any; color: string }> = {
  javascript: { icon: Braces, color: "text-yellow-400" },
  typescript: { icon: Braces, color: "text-blue-400" },
  python: { icon: Terminal, color: "text-green-400" },
  java: { icon: Package, color: "text-red-400" },
  cpp: { icon: Cpu, color: "text-blue-300" },
  c: { icon: Cpu, color: "text-gray-400" },
  html: { icon: Globe, color: "text-orange-400" },
  css: { icon: Palette, color: "text-purple-400" },
  sql: { icon: Database, color: "text-cyan-400" },
  rust: { icon: Lock, color: "text-orange-500" },
  go: { icon: Zap, color: "text-cyan-300" },
  ruby: { icon: Sparkles, color: "text-red-500" },
  php: { icon: Globe, color: "text-indigo-400" },
  swift: { icon: Smartphone, color: "text-orange-400" },
  kotlin: { icon: Smartphone, color: "text-purple-500" },
  bash: { icon: Terminal, color: "text-green-300" },
  shell: { icon: Terminal, color: "text-green-300" },
  json: { icon: Brackets, color: "text-yellow-300" },
  yaml: { icon: FileCode, color: "text-pink-400" },
  dockerfile: { icon: Cloud, color: "text-blue-400" },
  dart: { icon: Smartphone, color: "text-teal-400" },
};

function getExt(lang: string) { return EXT_MAP[lang] || "txt"; }
function formatTime(date: string | Date) {
  const d = new Date(date); const now = new Date(); const ms = now.getTime() - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "Just now"; if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60); if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24); if (dd < 7) return `${dd}d ago`;
  return d.toLocaleDateString();
}
function wordCount(t: string) { return t.trim().split(/\s+/).filter(Boolean).length; }

// #3 - Code metrics analyzer
function analyzeCode(code: string, lang: string) {
  const lines = code.split("\n");
  const totalLines = lines.length;
  const blankLines = lines.filter(l => !l.trim()).length;
  const commentLines = lines.filter(l => {
    const t = l.trim();
    return t.startsWith("//") || t.startsWith("#") || t.startsWith("/*") || t.startsWith("*") || t.startsWith("--");
  }).length;
  const codeLines = totalLines - blankLines - commentLines;

  let functions = 0, classes = 0, imports = 0;
  for (const l of lines) {
    const t = l.trim();
    if (/^(function |def |func |fn |public |private |protected |static |async function|const \w+ = (?:async )?\()/.test(t)) functions++;
    if (/^(class |struct |enum |interface |type |trait )/.test(t)) classes++;
    if (/^(import |from |require\(|#include|using )/.test(t)) imports++;
  }

  let complexity = "Low";
  if (totalLines > 100 || functions > 5) complexity = "Medium";
  if (totalLines > 300 || functions > 15 || classes > 5) complexity = "High";

  return { totalLines, blankLines, commentLines, codeLines, functions, classes, imports, complexity };
}

// ─── CODE ACTION BUTTONS ─────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}
      data-testid="button-copy-code" className="p-1 rounded hover:bg-white/10 transition-colors" title="Copy">
      {ok ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-zinc-400" />}
    </button>
  );
}

function SaveBtn({ code, language }: { code: string; language: string }) {
  const [ok, setOk] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();
  return (
    <button onClick={async () => {
      const fn = `code_${Date.now()}.${getExt(language)}`;
      try {
        await fetch("/api/save-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, filename: fn, language }) });
        setOk(true); toast({ title: "Saved to server", description: fn }); qc.invalidateQueries({ queryKey: ["/api/saved-codes"] }); setTimeout(() => setOk(false), 3000);
      } catch { toast({ title: "Save failed", variant: "destructive" }); }
    }} data-testid="button-save-code" className="p-1 rounded hover:bg-white/10 transition-colors" title="Save to server">
      {ok ? <Check size={14} className="text-green-400" /> : <Download size={14} className="text-zinc-400" />}
    </button>
  );
}

function DlBtn({ code, language }: { code: string; language: string }) {
  return (
    <button onClick={() => {
      const blob = new Blob([code], { type: "text/plain" }); const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = `code_${Date.now()}.${getExt(language)}`; a.click();
    }} data-testid="button-download-code" className="p-1 rounded hover:bg-white/10 transition-colors" title="Download">
      <FileCode size={14} className="text-zinc-400" />
    </button>
  );
}

// #4 - Enhanced live preview with console output capture
function RunBtn({ code, language }: { code: string; language: string }) {
  const [show, setShow] = useState(false);
  if (!["html", "javascript", "css"].includes(language)) return null;
  const consoleCapture = `<script>
    const _origLog = console.log; const _logs = [];
    console.log = function(...args) { _logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a,null,2) : String(a)).join(' ')); document.getElementById('_console').textContent = _logs.join('\\n'); _origLog.apply(console, args); };
    console.error = function(...args) { _logs.push('ERROR: ' + args.join(' ')); document.getElementById('_console').textContent = _logs.join('\\n'); };
    window.onerror = function(msg) { _logs.push('ERROR: ' + msg); document.getElementById('_console').textContent = _logs.join('\\n'); };
  <\/script>`;
  const html = language === "html" ? code
    : language === "javascript" ? `<html><body>${consoleCapture}<pre id="_console" style="font-family:monospace;font-size:13px;padding:12px;margin:0;background:#0d1117;color:#c9d1d9;min-height:100%"></pre><script>${code}<\/script></body></html>`
    : `<html><head><style>${code}</style></head><body style="padding:20px"><div class="demo" style="padding:20px;border:1px solid #ddd;border-radius:8px">
        <h1>Heading 1</h1><h2>Heading 2</h2><p>Paragraph text with <a href="#">a link</a> and <strong>bold text</strong>.</p>
        <button style="padding:8px 16px;margin:4px">Button</button><input placeholder="Input field" style="padding:8px;margin:4px"/>
      </div></body></html>`;
  return (
    <>
      <button onClick={() => setShow(!show)} className="p-1 rounded hover:bg-white/10 transition-colors" title="Run preview" data-testid="button-run-code">
        <Play size={14} className="text-emerald-400" />
      </button>
      {show && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 border border-zinc-700 rounded-lg overflow-hidden bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-zinc-800 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500"/><div className="w-2.5 h-2.5 rounded-full bg-yellow-500"/><div className="w-2.5 h-2.5 rounded-full bg-green-500"/></div>
              <span className="text-xs text-zinc-400">{language === "javascript" ? "Console Output" : "Live Preview"}</span>
            </div>
            <button onClick={() => setShow(false)} className="text-zinc-400 hover:text-white"><X size={14} /></button>
          </div>
          <iframe srcDoc={html} sandbox="allow-scripts" className="w-full h-56 bg-white" title="preview" />
        </div>
      )}
    </>
  );
}

// #5 - Fullscreen code viewer
function FullscreenBtn({ code, language }: { code: string; language: string }) {
  const [show, setShow] = useState(false);
  const { settings } = useCoderSettings();
  const theme = CODE_THEMES[settings.codeTheme] || CODE_THEMES.oneDark;
  useEffect(() => {
    if (show) { const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setShow(false); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }
  }, [show]);
  return (
    <>
      <button onClick={() => setShow(true)} className="p-1 rounded hover:bg-white/10 transition-colors" title="Fullscreen">
        <Maximize2 size={14} className="text-zinc-400" />
      </button>
      {show && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col" onClick={e => { if (e.target === e.currentTarget) setShow(false); }}>
          <div className="flex items-center justify-between px-6 py-3 bg-zinc-900 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"/><div className="w-3 h-3 rounded-full bg-yellow-500"/><div className="w-3 h-3 rounded-full bg-green-500"/></div>
              <span className="text-sm font-mono text-zinc-300">{language}</span>
              <span className="text-xs text-zinc-600">{code.split("\n").length} lines</span>
            </div>
            <div className="flex items-center gap-2">
              <CopyBtn text={code} />
              <button onClick={() => setShow(false)} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400"><Minimize2 size={16} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <SyntaxHighlighter style={theme.style} language={language} showLineNumbers
              lineNumberStyle={{ color: "#555", fontSize: "0.75rem" }}
              customStyle={{ margin: 0, padding: "1.5rem", background: theme.bg, fontSize: `${settings.fontSize}px`, minHeight: "100%" }}>
              {code}
            </SyntaxHighlighter>
          </div>
        </div>
      )}
    </>
  );
}

// #6 - Code metrics popup
function MetricsBtn({ code, language }: { code: string; language: string }) {
  const [show, setShow] = useState(false);
  const metrics = useMemo(() => analyzeCode(code, language), [code, language]);
  return (
    <div className="relative">
      <button onClick={() => setShow(!show)} className="p-1 rounded hover:bg-white/10 transition-colors" title="Code Metrics">
        <BarChart3 size={14} className="text-zinc-400" />
      </button>
      {show && (
        <div className="absolute top-full right-0 mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-2xl min-w-[200px]">
          <div className="text-xs text-zinc-300 font-semibold mb-2">Code Metrics</div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between"><span className="text-zinc-500">Total Lines</span><span className="text-zinc-300 font-mono">{metrics.totalLines}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Code Lines</span><span className="text-zinc-300 font-mono">{metrics.codeLines}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Comments</span><span className="text-zinc-300 font-mono">{metrics.commentLines}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Blank Lines</span><span className="text-zinc-300 font-mono">{metrics.blankLines}</span></div>
            <div className="h-px bg-zinc-800 my-1"/>
            <div className="flex justify-between"><span className="text-zinc-500">Functions</span><span className="text-cyan-400 font-mono">{metrics.functions}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Classes</span><span className="text-purple-400 font-mono">{metrics.classes}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Imports</span><span className="text-yellow-400 font-mono">{metrics.imports}</span></div>
            <div className="h-px bg-zinc-800 my-1"/>
            <div className="flex justify-between"><span className="text-zinc-500">Complexity</span>
              <span className={`font-mono font-semibold ${metrics.complexity === "Low" ? "text-green-400" : metrics.complexity === "Medium" ? "text-yellow-400" : "text-red-400"}`}>{metrics.complexity}</span>
            </div>
          </div>
          <button onClick={() => setShow(false)} className="mt-2 w-full text-center text-[10px] text-zinc-600 hover:text-zinc-400">Close</button>
        </div>
      )}
    </div>
  );
}

// ─── ENHANCED CODE BLOCK (#7-#15 combined) ───────────────────────────────────

function CodeBlock({ code, language, isCoder }: { code: string; language: string; isCoder?: boolean }) {
  const { settings } = useCoderSettings();
  const theme = CODE_THEMES[settings.codeTheme] || CODE_THEMES.oneDark;
  const lines = code.split("\n").length;
  // #7 - Collapsible long code blocks
  const [collapsed, setCollapsed] = useState(lines > 50);
  // #8 - Code search within block
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const langInfo = LANG_ICONS[language];

  const displayCode = collapsed ? code.split("\n").slice(0, 20).join("\n") + "\n\n// ... " + (lines - 20) + " more lines" : code;

  // #9 - Highlight search matches
  const highlightedCode = searchTerm ? displayCode.replace(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '█$1█') : displayCode;

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-zinc-800 relative group/code">
      <div className="bg-zinc-900 px-3 py-2 text-xs text-zinc-400 flex justify-between items-center border-b border-zinc-800">
        <div className="flex items-center gap-2">
          {/* #2 - Language icon */}
          {langInfo && <langInfo.icon size={13} className={langInfo.color} />}
          <span className="font-mono font-medium text-zinc-300">{language}</span>
          <span className="bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded text-[10px]">{lines} lines</span>
          {/* #10 - Size badge */}
          <span className="bg-zinc-800/50 text-zinc-600 px-1.5 py-0.5 rounded text-[10px]">{(new Blob([code]).size / 1024).toFixed(1)} KB</span>
        </div>
        <div className="flex items-center gap-0.5">
          {/* #8 - Search in code */}
          {lines > 10 && (
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-1 rounded hover:bg-white/10 transition-colors" title="Search in code">
              <Search size={14} className={searchOpen ? "text-blue-400" : "text-zinc-400"} />
            </button>
          )}
          <CopyBtn text={code} />
          <SaveBtn code={code} language={language} />
          <DlBtn code={code} language={language} />
          <RunBtn code={code} language={language} />
          {/* #5 - Fullscreen */}
          <FullscreenBtn code={code} language={language} />
          {/* #6 - Metrics */}
          {isCoder && <MetricsBtn code={code} language={language} />}
          {/* #7 - Collapse toggle */}
          {lines > 50 && (
            <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-white/10 transition-colors" title={collapsed ? "Expand" : "Collapse"}>
              {collapsed ? <ChevronDown size={14} className="text-zinc-400" /> : <ChevronUp size={14} className="text-zinc-400" />}
            </button>
          )}
        </div>
      </div>
      {/* #8 - Search bar */}
      {searchOpen && (
        <div className="bg-zinc-900/80 px-3 py-1.5 flex items-center gap-2 border-b border-zinc-800/50">
          <Search size={12} className="text-zinc-500" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search in code..."
            className="flex-1 bg-transparent text-xs text-zinc-300 focus:outline-none placeholder:text-zinc-700" autoFocus />
          {searchTerm && <span className="text-[10px] text-zinc-600">{(code.match(new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length} found</span>}
          <button onClick={() => { setSearchOpen(false); setSearchTerm(""); }} className="text-zinc-600 hover:text-zinc-400"><X size={12} /></button>
        </div>
      )}
      {/* #11 - Configurable syntax highlighting */}
      <div style={{ maxHeight: collapsed ? "none" : undefined }}>
        <SyntaxHighlighter
          style={theme.style} language={language} PreTag="div"
          showLineNumbers={settings.showLineNumbers && lines > 3}
          lineNumberStyle={{ color: "#444", fontSize: `${settings.fontSize - 2}px`, minWidth: "2.5em" }}
          wrapLines={settings.wordWrap} wrapLongLines={settings.wordWrap}
          customStyle={{ margin: 0, padding: "1rem", background: theme.bg, fontSize: `${settings.fontSize}px` }}
        >
          {displayCode}
        </SyntaxHighlighter>
      </div>
      {/* #7 - Collapsed indicator */}
      {collapsed && (
        <button onClick={() => setCollapsed(false)}
          className="w-full py-2 bg-zinc-900 text-zinc-500 text-xs hover:text-zinc-300 hover:bg-zinc-800 transition-colors border-t border-zinc-800 flex items-center justify-center gap-1">
          <ChevronDown size={12} /> Show all {lines} lines
        </button>
      )}
    </div>
  );
}

// ─── CHAT MESSAGE ────────────────────────────────────────────────────────────

function ChatMsg({ role, content, isThinking, isCoder, timestamp, onRetry }: {
  role: string; content: string; isThinking?: boolean; isCoder?: boolean; timestamp?: string; onRetry?: () => void;
}) {
  const isUser = role === "user";
  const [reaction, setReaction] = useState<"up" | "down" | null>(null);
  const [msgCopied, setMsgCopied] = useState(false);
  // #12 - Code block count in message
  const codeBlockCount = (content.match(/```\w+/g) || []).length;

  return (
    <div data-testid={`message-${role}`} className={`group py-5 px-4 md:px-8 w-full flex justify-center transition-colors ${isUser ? "bg-transparent" : "bg-muted/15"}`}>
      <div className="flex w-full max-w-3xl gap-4">
        <div className="flex-shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-white shadow-sm">
              <span className="text-xs font-bold">Y</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-white border border-border shadow-sm flex items-center justify-center p-0.5">
              <img src={logo} alt="AI" className="w-full h-full object-cover rounded-full" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1 overflow-hidden min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              {isUser ? "You" : isCoder ? "My Ai Coder" : "My Ai Gpt"}
            </span>
            {timestamp && <span className="text-[10px] text-muted-foreground/40">{formatTime(timestamp)}</span>}
            {/* #12 - Code block badge */}
            {!isUser && codeBlockCount > 0 && (
              <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full font-medium">{codeBlockCount} code block{codeBlockCount > 1 ? "s" : ""}</span>
            )}
          </div>
          <div className="text-foreground leading-relaxed markdown-body">
            {isThinking ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center h-6 gap-1.5">
                  <div className="w-2 h-2 bg-primary/50 rounded-full typing-dot" /><div className="w-2 h-2 bg-primary/50 rounded-full typing-dot" /><div className="w-2 h-2 bg-primary/50 rounded-full typing-dot" />
                </div>
                <span className="text-xs text-muted-foreground/50 animate-pulse">{isCoder ? "Generating code..." : "Thinking..."}</span>
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeStr = String(children).replace(/\n$/, "");
                    return !inline && match ? (
                      <CodeBlock code={codeStr} language={match[1]} isCoder={isCoder} />
                    ) : !inline && codeStr.includes("\n") ? (
                      // #13 - Auto-detect untagged code blocks
                      <CodeBlock code={codeStr} language="plaintext" isCoder={isCoder} />
                    ) : (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border/40" {...props}>{children}</code>
                    );
                  },
                  table({ children }: any) { return <div className="overflow-x-auto my-3 rounded-lg border border-border"><table className="min-w-full text-sm">{children}</table></div>; },
                  th({ children }: any) { return <th className="border-b border-border bg-muted/50 px-3 py-2 text-left font-semibold text-xs uppercase tracking-wider">{children}</th>; },
                  td({ children }: any) { return <td className="border-b border-border/50 px-3 py-2">{children}</td>; },
                }}
              >{content}</ReactMarkdown>
            )}
          </div>
          {!isUser && !isThinking && content && (
            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { navigator.clipboard.writeText(content); setMsgCopied(true); setTimeout(() => setMsgCopied(false), 2000); }}
                className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground/50 hover:text-foreground transition-colors" title="Copy">{msgCopied ? <Check size={14} /> : <Copy size={14} />}</button>
              <button onClick={() => setReaction(reaction === "up" ? null : "up")} className={`p-1.5 rounded-md hover:bg-muted/50 transition-colors ${reaction === "up" ? "text-green-500" : "text-muted-foreground/50 hover:text-foreground"}`}><ThumbsUp size={14} /></button>
              <button onClick={() => setReaction(reaction === "down" ? null : "down")} className={`p-1.5 rounded-md hover:bg-muted/50 transition-colors ${reaction === "down" ? "text-red-500" : "text-muted-foreground/50 hover:text-foreground"}`}><ThumbsDown size={14} /></button>
              {onRetry && <button onClick={onRetry} className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground/50 hover:text-foreground transition-colors" title="Regenerate"><RotateCcw size={14} /></button>}
              <span className="text-[10px] text-muted-foreground/30 ml-2">{wordCount(content)} words</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CHAT INPUT ──────────────────────────────────────────────────────────────

// #14 - Quick code templates
const CODE_TEMPLATES = [
  { label: "React Component", prefix: "Create a React component that ", icon: Braces },
  { label: "REST API", prefix: "Build a REST API endpoint that ", icon: Globe },
  { label: "Database Schema", prefix: "Design a database schema for ", icon: Database },
  { label: "Unit Tests", prefix: "Write unit tests for ", icon: FlaskConical },
  { label: "Debug Error", prefix: "Debug this error: ", icon: Bug },
  { label: "Refactor", prefix: "Refactor this code to be cleaner: ", icon: GitBranch },
  { label: "Docker Setup", prefix: "Create a Dockerfile and docker-compose for ", icon: Cloud },
  { label: "Algorithm", prefix: "Implement an algorithm that ", icon: Cpu },
];

// #15 - Paste code input with language detection
function ChatInput({ onSend, disabled, placeholder, isCoder }: { onSend: (msg: string) => void; disabled?: boolean; placeholder?: string; isCoder?: boolean }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  // #16 - Show templates
  const [showTemplates, setShowTemplates] = useState(false);
  // #17 - Paste code detection
  const [pastedCode, setPastedCode] = useState(false);
  const charCount = value.length;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim() && !disabled) {
      setHistory(prev => [value.trim(), ...prev].slice(0, 50));
      setHistIdx(-1);
      onSend(value.trim());
      setValue("");
      setPastedCode(false);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
    if (e.key === "ArrowUp" && !value && history.length > 0) {
      e.preventDefault(); const n = Math.min(histIdx + 1, history.length - 1); setHistIdx(n); setValue(history[n]);
    }
    if (e.key === "ArrowDown" && histIdx >= 0) {
      e.preventDefault(); const n = histIdx - 1; setHistIdx(n); setValue(n >= 0 ? history[n] : "");
    }
    if (e.key === "/" && !value && isCoder) { setShowTemplates(true); }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    if (text.includes("\n") && (text.includes("{") || text.includes("def ") || text.includes("function ") || text.includes("import ") || text.includes("#include"))) {
      setPastedCode(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-3xl w-full mx-auto" data-testid="form-chat-input">
      {/* #16 - Templates popup */}
      {showTemplates && isCoder && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-border/50 rounded-xl shadow-xl p-2 z-50 grid grid-cols-2 sm:grid-cols-4 gap-1">
          {CODE_TEMPLATES.map((t, i) => (
            <button key={i} type="button" onClick={() => { setValue(t.prefix); setShowTemplates(false); textareaRef.current?.focus(); }}
              className="flex items-center gap-2 p-2 rounded-lg text-xs text-foreground/70 hover:bg-muted/50 hover:text-foreground transition-colors text-left">
              <t.icon size={12} className="text-blue-500 flex-shrink-0" /><span className="truncate">{t.label}</span>
            </button>
          ))}
          <button type="button" onClick={() => setShowTemplates(false)} className="col-span-2 sm:col-span-4 text-[10px] text-muted-foreground/40 hover:text-muted-foreground py-1">Close</button>
        </div>
      )}

      <div className="relative flex items-end p-2 bg-white border border-border/60 rounded-2xl shadow-lg focus-within:shadow-xl focus-within:border-primary/20 transition-all">
        {/* #17 - Pasted code indicator */}
        {pastedCode && (
          <div className="absolute -top-6 left-3 flex items-center gap-1.5 text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-t-lg">
            <Code2 size={10} /> Code detected - will be analyzed
          </div>
        )}
        <textarea ref={textareaRef} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={handleKey} onPaste={handlePaste}
          placeholder={placeholder} disabled={disabled} data-testid="input-message"
          className="w-full max-h-[200px] min-h-[44px] bg-transparent border-0 resize-none py-2.5 pl-3 pr-20 focus:ring-0 focus:outline-none scrollbar-hide text-base leading-relaxed placeholder:text-muted-foreground/50"
          rows={1} />
        <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
          {charCount > 0 && <span className="text-[10px] text-muted-foreground/40 tabular-nums">{charCount}</span>}
          {/* #16 - Template button */}
          {isCoder && !value && (
            <button type="button" onClick={() => setShowTemplates(!showTemplates)} className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted/30 transition-colors" title="Code templates (/)">
              <Layers size={14} />
            </button>
          )}
          <button type="submit" disabled={!value.trim() || disabled} data-testid="button-send"
            className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${value.trim() && !disabled ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
            <Send size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 mt-2">
        <span className="text-[10px] text-muted-foreground/40">My Ai Gpt Beta Release 1</span>
        <span className="text-[10px] text-muted-foreground/20">|</span>
        <span className="text-[10px] text-muted-foreground/40">Quantum Pulse Intelligence</span>
        {isCoder && <>
          <span className="text-[10px] text-muted-foreground/20">|</span>
          <span className="text-[10px] text-muted-foreground/30">/ for templates</span>
        </>}
      </div>
    </form>
  );
}

// ─── SUGGESTIONS ─────────────────────────────────────────────────────────────

const GENERAL_SUGGESTIONS = [
  { icon: Sparkles, text: "Explain quantum computing in simple terms", color: "text-amber-500", cat: "Science" },
  { icon: Globe, text: "What are the biggest tech trends in 2026?", color: "text-blue-500", cat: "Trends" },
  { icon: Lightbulb, text: "Give me 10 creative startup ideas", color: "text-yellow-500", cat: "Ideas" },
  { icon: BookOpen, text: "Write a professional email declining a job offer", color: "text-purple-500", cat: "Writing" },
  { icon: Shield, text: "Explain cryptocurrency and blockchain to a beginner", color: "text-emerald-500", cat: "Finance" },
  { icon: BarChart3, text: "Help me create a weekly productivity plan", color: "text-pink-500", cat: "Planning" },
];

// #18 - Categorized coder suggestions
const CODER_CATEGORIES = [
  { name: "Full Stack", items: [
    { icon: Rocket, text: "Build a complete SaaS app with auth, billing, and dashboard", color: "text-blue-500" },
    { icon: Globe, text: "Create a real-time chat app with WebSockets", color: "text-cyan-500" },
  ]},
  { name: "Backend", items: [
    { icon: Database, text: "Design a scalable REST API with rate limiting and caching", color: "text-green-500" },
    { icon: Lock, text: "Implement JWT authentication with refresh tokens", color: "text-amber-500" },
  ]},
  { name: "Frontend", items: [
    { icon: Braces, text: "Build an interactive data dashboard with React and D3", color: "text-purple-500" },
    { icon: Smartphone, text: "Create a responsive e-commerce product page", color: "text-pink-500" },
  ]},
  { name: "DevOps", items: [
    { icon: Cloud, text: "Set up a CI/CD pipeline with Docker and GitHub Actions", color: "text-teal-500" },
    { icon: Package, text: "Create a microservices architecture with Docker Compose", color: "text-indigo-500" },
  ]},
  { name: "Debug & Test", items: [
    { icon: Bug, text: "Debug and fix my code with detailed explanations", color: "text-red-500" },
    { icon: FlaskConical, text: "Write comprehensive tests with 100% coverage", color: "text-orange-500" },
  ]},
];

function ScrollBtn({ scrollRef }: { scrollRef: React.RefObject<HTMLDivElement> }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    const check = () => setShow(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
    el.addEventListener("scroll", check); return () => el.removeEventListener("scroll", check);
  }, [scrollRef]);
  if (!show) return null;
  return (
    <button onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })}
      data-testid="button-scroll-bottom" className="absolute bottom-44 right-6 z-30 p-2.5 bg-white border border-border/50 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
      <ArrowDown size={16} />
    </button>
  );
}

// ─── SAVED CODES PANEL (#19) ─────────────────────────────────────────────────

function SavedCodesPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: codes = [], isLoading } = useSavedCodes();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [viewingCode, setViewingCode] = useState<{ name: string; content: string } | null>(null);
  const { settings } = useCoderSettings();
  const theme = CODE_THEMES[settings.codeTheme] || CODE_THEMES.oneDark;

  const viewFile = async (name: string) => {
    const r = await fetch(`/api/saved-codes/${name}/content`);
    const data = await r.json();
    setViewingCode(data);
  };
  const deleteFile = async (name: string) => {
    await fetch(`/api/saved-codes/${name}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["/api/saved-codes"] });
    toast({ title: "File deleted" });
    if (viewingCode?.name === name) setViewingCode(null);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-border/30 w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Archive size={18} className="text-blue-500" />
            <span className="font-semibold text-lg">Saved Code Files</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{codes.length} files</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={18} /></button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r border-border/20 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-muted rounded-lg animate-pulse"/>)}</div>
            ) : codes.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No saved code yet</div>
            ) : codes.map(f => (
              <div key={f.name} className={`group flex items-center gap-2 px-3 py-2.5 hover:bg-muted/30 cursor-pointer border-b border-border/10 transition-colors ${viewingCode?.name === f.name ? "bg-blue-50" : ""}`}
                onClick={() => viewFile(f.name)}>
                <FileCode size={14} className="text-blue-500/50 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{f.name}</div>
                  <div className="text-[10px] text-muted-foreground">{f.lines} lines &middot; {(f.size/1024).toFixed(1)}KB</div>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteFile(f.name); }} className="p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12}/></button>
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-auto bg-zinc-950">
            {viewingCode ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                  <span className="text-xs text-zinc-400 font-mono">{viewingCode.name}</span>
                  <div className="flex gap-1">
                    <CopyBtn text={viewingCode.content} />
                    <button onClick={() => {
                      const blob = new Blob([viewingCode.content], { type: "text/plain" }); const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob); a.download = viewingCode.name; a.click();
                    }} className="p-1 rounded hover:bg-white/10"><Download size={14} className="text-zinc-400"/></button>
                  </div>
                </div>
                <SyntaxHighlighter style={theme.style} language={viewingCode.name.split(".").pop() || "text"} showLineNumbers
                  customStyle={{ margin: 0, padding: "1rem", background: theme.bg, fontSize: `${settings.fontSize}px`, flex: 1 }}>
                  {viewingCode.content}
                </SyntaxHighlighter>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-700 text-sm">Select a file to view</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS PANEL (#20) ────────────────────────────────────────────────────

function SettingsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { settings, set } = useCoderSettings();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-border/30 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2"><Settings2 size={18} /><span className="font-semibold text-lg">Coder Settings</span></div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={18} /></button>
        </div>
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Code Theme</label>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.entries(CODE_THEMES).map(([key, t]) => (
                <button key={key} onClick={() => set({ codeTheme: key })}
                  className={`px-3 py-2 text-xs rounded-lg border transition-all ${settings.codeTheme === key ? "border-primary bg-primary/5 font-semibold" : "border-border/30 hover:border-border"}`}>{t.name}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Font Size: {settings.fontSize}px</label>
            <input type="range" min="10" max="20" value={settings.fontSize} onChange={e => set({ fontSize: +e.target.value })}
              className="w-full accent-primary" />
          </div>
          <div className="space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Word Wrap</span>
              <div onClick={() => set({ wordWrap: !settings.wordWrap })} className={`w-10 h-5 rounded-full transition-colors ${settings.wordWrap ? "bg-primary" : "bg-muted"} relative`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.wordWrap ? "left-5" : "left-0.5"}`}/>
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Line Numbers</span>
              <div onClick={() => set({ showLineNumbers: !settings.showLineNumbers })} className={`w-10 h-5 rounded-full transition-colors ${settings.showLineNumbers ? "bg-primary" : "bg-muted"} relative`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.showLineNumbers ? "left-5" : "left-0.5"}`}/>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CHAT INTERFACE ──────────────────────────────────────────────────────────

function ChatInterface({ chatId, defaultType = "general" }: { chatId?: number; defaultType?: "general" | "coder" }) {
  const [, setLocation] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: messages = [] } = useMessages(chatId || null);
  const [localMessages, setLocalMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastFailedMsg, setLastFailedMsg] = useState<string | null>(null);
  // #21 - Saved codes panel
  const [showSavedCodes, setShowSavedCodes] = useState(false);
  // #22 - Settings panel
  const [showSettings, setShowSettings] = useState(false);

  const isCoder = defaultType === "coder";
  const isEmpty = messages.length === 0 && localMessages.length === 0;

  // #23 - Code block extraction from conversation
  const allCodeBlocks = useMemo(() => {
    const blocks: { code: string; language: string; msgIndex: number }[] = [];
    messages.forEach((m, i) => {
      if (m.role === "assistant") {
        const matches = m.content.matchAll(/```(\w+)?\n([\s\S]*?)```/g);
        for (const match of matches) {
          blocks.push({ language: match[1] || "plaintext", code: match[2], msgIndex: i });
        }
      }
    });
    return blocks;
  }, [messages]);

  useEffect(() => {
    document.title = isCoder ? "My Ai Coder - Quantum Pulse Intelligence" : "My Ai Gpt - Quantum Pulse Intelligence";
  }, [isCoder]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, localMessages, isThinking]);

  const handleSend = useCallback(async (content: string) => {
    let targetChatId = chatId;
    setLocalMessages(prev => [...prev, { role: "user", content }]);
    setIsThinking(true);
    setLastError(null);
    setLastFailedMsg(null);
    try {
      if (!targetChatId) {
        const r = await fetch(api.chats.create.path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: content.slice(0, 40), type: defaultType }) });
        if (!r.ok) throw new Error("Failed");
        const c = await r.json(); targetChatId = c.id;
        qc.invalidateQueries({ queryKey: [api.chats.list.path] });
      }
      const r = await fetch(buildUrl(api.messages.create.path, { chatId: targetChatId }), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      if (!r.ok) throw new Error("Failed to get response");
      if (!chatId) { setLocation(`/chat/${targetChatId}`); } else { qc.invalidateQueries({ queryKey: [api.messages.list.path, chatId] }); setLocalMessages([]); }
    } catch (error: any) {
      setLastError(error.message); setLastFailedMsg(content);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLocalMessages(prev => prev.filter(m => m.content !== content));
    } finally { setIsThinking(false); }
  }, [chatId, defaultType, qc, setLocation, toast]);

  const handleRegenerate = useCallback(async () => {
    if (!chatId || messages.length < 2) return;
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    if (lastUserMsg) {
      setIsThinking(true);
      try {
        const r = await fetch(buildUrl(api.messages.create.path, { chatId }), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: lastUserMsg.content }) });
        if (!r.ok) throw new Error("Failed");
        qc.invalidateQueries({ queryKey: [api.messages.list.path, chatId] });
      } catch { toast({ title: "Regeneration failed", variant: "destructive" }); }
      finally { setIsThinking(false); }
    }
  }, [chatId, messages, qc, toast]);

  const handleExport = useCallback(async () => {
    if (!chatId) return;
    try {
      const r = await fetch(`/api/chats/${chatId}/export`, { method: "POST" });
      const t = await r.text();
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/markdown" }));
      a.download = `chat_${chatId}.md`; a.click();
      toast({ title: "Exported!" });
    } catch { toast({ title: "Export failed", variant: "destructive" }); }
  }, [chatId, toast]);

  // #24 - Save all code blocks at once
  const handleSaveAllCode = useCallback(async () => {
    if (allCodeBlocks.length === 0) return;
    let saved = 0;
    for (const block of allCodeBlocks) {
      const fn = `code_${Date.now()}_${saved}.${getExt(block.language)}`;
      try {
        await fetch("/api/save-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: block.code, filename: fn, language: block.language }) });
        saved++;
      } catch {}
    }
    qc.invalidateQueries({ queryKey: ["/api/saved-codes"] });
    toast({ title: `Saved ${saved} code blocks!` });
  }, [allCodeBlocks, qc, toast]);

  const allMessages = [...messages, ...localMessages];

  return (
    <div className="flex flex-col h-full w-full relative bg-background">
      {/* #25 - Enhanced top bar for coder */}
      {chatId && messages.length > 0 && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/30 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCoder ? <Code2 size={14} className="text-blue-500" /> : <MessageSquare size={14} className="text-muted-foreground" />}
            <span className="text-sm font-medium text-foreground/80 truncate max-w-[200px]">{isCoder ? "My Ai Coder" : "My Ai Gpt"}</span>
            <span className="text-xs text-muted-foreground/40">{messages.length} msgs</span>
            {isCoder && allCodeBlocks.length > 0 && (
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{allCodeBlocks.length} code blocks</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* #24 - Save all code */}
            {isCoder && allCodeBlocks.length > 0 && (
              <button onClick={handleSaveAllCode} className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground/50 hover:text-foreground transition-colors" title="Save all code blocks" data-testid="button-save-all-code">
                <Archive size={14} />
              </button>
            )}
            {/* #21 - Saved codes */}
            {isCoder && (
              <button onClick={() => setShowSavedCodes(true)} className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground/50 hover:text-foreground transition-colors" title="Saved codes" data-testid="button-open-saved">
                <FolderOpen size={14} />
              </button>
            )}
            {/* #22 - Settings */}
            {isCoder && (
              <button onClick={() => setShowSettings(true)} className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground/50 hover:text-foreground transition-colors" title="Coder settings" data-testid="button-open-settings">
                <Settings2 size={14} />
              </button>
            )}
            <button onClick={handleExport} className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground/50 hover:text-foreground transition-colors" title="Export" data-testid="button-export">
              <FileDown size={14} />
            </button>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto w-full scroll-smooth pt-4 pb-40">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-xl border border-border/20 flex items-center justify-center mb-6 p-1.5 animate-[bounce_3s_ease-in-out_1]">
              <img src={logo} alt="My Ai" className="w-full h-full object-cover rounded-xl" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2" data-testid="text-welcome-title">
              {isCoder ? "My Ai Coder" : "My Ai Gpt"}
            </h1>
            <p className="text-muted-foreground max-w-lg mb-2" data-testid="text-welcome-subtitle">
              {isCoder ? "The world's most elite S-class programming assistant. I write, debug, optimize, test, and deploy code in 30+ languages." : "Your world-class intelligent assistant. Ask me anything."}
            </p>
            {isCoder && (
              <>
                {/* #26 - Feature badges */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6">
                  <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full"><Zap size={9} /> Auto-Save</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><Play size={9} /> Live Preview</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full"><Code2 size={9} /> 30+ Languages</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full"><BarChart3 size={9} /> Metrics</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full"><Maximize2 size={9} /> Fullscreen</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full"><Palette size={9} /> 5 Themes</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full"><Search size={9} /> Code Search</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full"><Archive size={9} /> File Manager</span>
                </div>
                {/* #18 - Categorized suggestions */}
                <div className="w-full max-w-4xl space-y-3 mt-2">
                  {CODER_CATEGORIES.map((cat, ci) => (
                    <div key={ci}>
                      <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-1.5 text-left px-1">{cat.name}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cat.items.map((s, i) => (
                          <button key={i} onClick={() => handleSend(s.text)} data-testid={`button-suggestion-${ci}-${i}`}
                            className="p-3 text-sm text-left border border-border/30 rounded-xl bg-white hover:bg-muted/20 hover:shadow-md hover:border-border/60 transition-all group flex items-start gap-2.5">
                            <s.icon size={14} className={`${s.color} mt-0.5 group-hover:scale-110 transition-transform flex-shrink-0`} />
                            <span className="text-foreground/70 group-hover:text-foreground text-xs leading-relaxed">{s.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {!isCoder && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-4 max-w-3xl w-full">
                {GENERAL_SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => handleSend(s.text)} data-testid={`button-suggestion-${i}`}
                    className="p-3.5 text-sm text-left border border-border/30 rounded-xl bg-white hover:bg-muted/20 hover:shadow-md hover:border-border/60 transition-all group">
                    <div className="flex items-center gap-2 mb-1.5">
                      <s.icon size={14} className={`${s.color} group-hover:scale-110 transition-transform`} />
                      <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">{s.cat}</span>
                    </div>
                    <span className="text-foreground/70 group-hover:text-foreground text-xs leading-relaxed">{s.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col pt-10">
            {allMessages.map((msg, i) => (
              <ChatMsg key={i} role={msg.role} content={msg.content} isCoder={isCoder} timestamp={(msg as any).createdAt}
                onRetry={msg.role === "assistant" && i === allMessages.length - 1 ? handleRegenerate : undefined} />
            ))}
            {isThinking && <ChatMsg role="assistant" content="" isThinking isCoder={isCoder} />}
            {lastError && lastFailedMsg && (
              <div className="flex justify-center py-3">
                <button onClick={() => handleSend(lastFailedMsg!)} data-testid="button-retry"
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-red-50 text-red-600 rounded-xl border border-red-200 hover:bg-red-100 transition-colors">
                  <RotateCcw size={14} /> Retry message
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ScrollBtn scrollRef={scrollRef as React.RefObject<HTMLDivElement>} />

      {/* #21/#22 - Panels */}
      <SavedCodesPanel isOpen={showSavedCodes} onClose={() => setShowSavedCodes(false)} />
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-4 px-4 md:px-8">
        <ChatInput onSend={handleSend} disabled={isThinking} isCoder={isCoder}
          placeholder={isCoder ? "Ask My Ai Coder to write, debug, or explain code..." : "Message My Ai Gpt..."} />
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) {
  const [location, setLocation] = useLocation();
  const { data: chats = [], isLoading } = useChats();
  const { data: stats } = useStats();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;
    return chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [chats, searchQuery]);

  const groupedChats = useMemo(() => {
    const today: Chat[] = [], week: Chat[] = [], older: Chat[] = [];
    const now = Date.now();
    for (const c of filteredChats) {
      const age = now - new Date(c.createdAt).getTime();
      if (age < 86400000) today.push(c);
      else if (age < 604800000) week.push(c);
      else older.push(c);
    }
    return { today, week, older };
  }, [filteredChats]);

  const handleDelete = async (id: number) => {
    await fetch(buildUrl(api.chats.delete.path, { id }), { method: "DELETE" });
    qc.invalidateQueries({ queryKey: [api.chats.list.path] });
    if (location === `/chat/${id}`) setLocation("/");
  };
  const handleClearAll = async () => {
    if (!confirm("Delete ALL chats? This cannot be undone.")) return;
    await fetch("/api/chats", { method: "DELETE" });
    qc.invalidateQueries({ queryKey: [api.chats.list.path] });
    setLocation("/"); toast({ title: "All chats cleared" });
  };
  const handleRename = async (id: number) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    await fetch(`/api/chats/${id}/rename`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: renameValue }) });
    qc.invalidateQueries({ queryKey: [api.chats.list.path] });
    setRenamingId(null); toast({ title: "Chat renamed" });
  };

  const renderChatGroup = (title: string, items: Chat[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-3">
        <div className="text-[10px] font-bold text-muted-foreground/40 mb-1 px-3 tracking-widest uppercase">{title}</div>
        {items.map(chat => (
          <div key={chat.id} className="relative group" data-testid={`chat-item-${chat.id}`}>
            {renamingId === chat.id ? (
              <div className="flex items-center gap-1 px-2 py-1">
                <input value={renameValue} onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleRename(chat.id); if (e.key === "Escape") setRenamingId(null); }}
                  className="flex-1 text-xs bg-white border border-border rounded-md px-2 py-1.5 focus:outline-none focus:border-primary/30" autoFocus />
                <button onClick={() => handleRename(chat.id)} className="p-1 text-green-500"><Check size={14} /></button>
                <button onClick={() => setRenamingId(null)} className="p-1 text-muted-foreground"><X size={14} /></button>
              </div>
            ) : (
              <>
                <Link href={`/chat/${chat.id}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm pr-16 transition-all ${location === `/chat/${chat.id}` ? "bg-white shadow-sm border border-border/40 font-medium" : "text-foreground/60 hover:bg-black/5 hover:text-foreground"}`}>
                  {chat.type === "coder" ? <Code2 size={12} className="flex-shrink-0 text-blue-500/60" /> : <MessageSquare size={12} className="flex-shrink-0 text-foreground/40" />}
                  <span className="truncate text-xs">{chat.title}</span>
                </Link>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => { setRenamingId(chat.id); setRenameValue(chat.title); }} className="p-1 text-muted-foreground hover:text-foreground rounded" data-testid={`button-rename-${chat.id}`}><Pencil size={12} /></button>
                  <button onClick={() => handleDelete(chat.id)} className="p-1 text-muted-foreground hover:text-red-500 rounded" data-testid={`button-delete-chat-${chat.id}`}><Trash2 size={12} /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsOpen(false)} />}
      <div className={`fixed md:relative inset-y-0 left-0 z-50 flex flex-col w-[280px] bg-[#fafafa] border-r border-border/30 transition-transform duration-300 h-[100dvh] ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-none"}`}>
        <div className="p-3 flex items-center justify-between border-b border-border/20">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <img src={logo} alt="My Ai Gpt" className="w-7 h-7 rounded-full shadow-sm bg-white" />
            <div className="leading-none">
              <span className="font-bold text-sm text-foreground block">My Ai Gpt</span>
              <span className="text-[9px] text-muted-foreground/60">Beta Release 1</span>
            </div>
          </Link>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-1.5 text-muted-foreground rounded-lg" data-testid="button-close-sidebar"><PanelLeftClose size={16} /></button>
        </div>

        <div className="px-2.5 py-2 space-y-1">
          <Link href="/" data-testid="link-general-chat"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/" ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/" ? "bg-primary/10" : "bg-muted/50"}`}><MessageSquare size={14} className={location === "/" ? "text-primary" : ""} /></div>
            <span className="flex-1">My Ai Gpt</span>
            <Plus size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
          </Link>
          <Link href="/coder" data-testid="link-coder-chat"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/coder" ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/coder" ? "bg-blue-500/15" : "bg-blue-500/5"}`}><Code2 size={14} className="text-blue-600" /></div>
            <span className="flex-1">My Ai Coder</span>
            <Plus size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
          </Link>
          <Link href="/playground" data-testid="link-playground"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/playground" ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/playground" ? "bg-emerald-500/15" : "bg-emerald-500/5"}`}><SquareTerminal size={14} className="text-emerald-600" /></div>
            <span className="flex-1">Playground</span>
            <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold opacity-80">IDE</span>
          </Link>
        </div>

        <div className="px-2.5 py-1">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search chats..." data-testid="input-search-chats"
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-border/30 rounded-lg focus:outline-none focus:border-primary/20 placeholder:text-muted-foreground/30" />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"><X size={12} /></button>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-2 scrollbar-hide">
          {isLoading ? (
            <div className="space-y-2 px-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-black/5 rounded-lg animate-pulse" />)}</div>
          ) : filteredChats.length === 0 ? (
            <div className="px-3 py-8 text-xs text-muted-foreground/50 text-center">{searchQuery ? "No matching chats" : "No chats yet. Start a conversation!"}</div>
          ) : (
            <>{renderChatGroup("Today", groupedChats.today)}{renderChatGroup("This Week", groupedChats.week)}{renderChatGroup("Older", groupedChats.older)}</>
          )}
        </div>

        <div className="p-2.5 border-t border-border/20 space-y-2">
          {chats.length > 0 && (
            <button onClick={handleClearAll} data-testid="button-clear-all"
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash size={11} /> Clear All Chats
            </button>
          )}
          <div className="flex items-center justify-between px-2 text-[9px] text-muted-foreground/40">
            <div className="flex items-center gap-1">
              {stats?.discordConnected ? <Wifi size={9} className="text-green-400" /> : <WifiOff size={9} className="text-red-400" />}
              <span>{stats?.discordConnected ? "Connected" : "Offline"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{stats?.chatCount || 0} chats</span>
              <span>{stats?.messageCount || 0} msgs</span>
              {(stats?.codeFiles || 0) > 0 && <span>{stats?.codeFiles} codes</span>}
            </div>
          </div>
          <div className="text-[9px] text-center text-muted-foreground/30 font-medium tracking-wide">Quantum Pulse Intelligence</div>
        </div>
      </div>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} data-testid="button-open-sidebar"
          className="fixed top-4 left-4 z-40 p-2.5 bg-white border border-border/30 rounded-xl shadow-sm hover:shadow-md transition-all"><PanelLeftOpen size={16} /></button>
      )}
    </>
  );
}

// ─── CODE PLAYGROUND - Full IDE with execution ──────────────────────────────

const PG_LANGUAGES = [
  { id: "javascript", name: "JavaScript", icon: Braces, color: "text-yellow-400", canRun: true },
  { id: "html", name: "HTML", icon: Globe, color: "text-orange-400", canRun: true },
  { id: "css", name: "CSS", icon: Palette, color: "text-purple-400", canRun: true },
  { id: "python", name: "Python", icon: Terminal, color: "text-green-400", canRun: true },
  { id: "typescript", name: "TypeScript", icon: Braces, color: "text-blue-400", canRun: true },
  { id: "sql", name: "SQL", icon: Database, color: "text-cyan-400", canRun: false },
  { id: "json", name: "JSON", icon: Brackets, color: "text-yellow-300", canRun: false },
  { id: "bash", name: "Bash", icon: Terminal, color: "text-green-300", canRun: false },
  { id: "rust", name: "Rust", icon: Lock, color: "text-orange-500", canRun: false },
  { id: "go", name: "Go", icon: Zap, color: "text-cyan-300", canRun: false },
  { id: "java", name: "Java", icon: Package, color: "text-red-400", canRun: false },
  { id: "cpp", name: "C++", icon: Cpu, color: "text-blue-300", canRun: false },
];

const STARTER_CODE: Record<string, string> = {
  javascript: `// JavaScript Playground - Write and run your code!\n\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nfor (let i = 0; i < 10; i++) {\n  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);\n}\n\nconsole.log("\\nHello from My Ai Coder Playground! 🚀");`,
  html: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: system-ui; padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }\n    .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; max-width: 400px; }\n    h1 { color: #333; margin-bottom: 0.5rem; }\n    p { color: #666; }\n    button { background: #667eea; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; margin-top: 1rem; }\n    button:hover { background: #5a6fd6; }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h1>My Ai Coder</h1>\n    <p>Build anything you can imagine</p>\n    <button onclick="alert('Hello from My Ai Coder!')">Click Me</button>\n  </div>\n</body>\n</html>`,
  css: `/* CSS Playground - See your styles live! */\n\nbody {\n  font-family: system-ui;\n  padding: 2rem;\n  background: #f0f4f8;\n}\n\n.demo {\n  max-width: 600px;\n  margin: 0 auto;\n}\n\n.card {\n  background: white;\n  border-radius: 12px;\n  padding: 24px;\n  box-shadow: 0 4px 6px rgba(0,0,0,0.1);\n  margin-bottom: 16px;\n  transition: transform 0.2s, box-shadow 0.2s;\n}\n\n.card:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 8px 25px rgba(0,0,0,0.15);\n}\n\nh1 { color: #1a1a2e; }\np { color: #666; line-height: 1.6; }`,
  python: `# Python Playground - Powered by Pyodide (WebAssembly)\n# Runs real Python in your browser!\n\nimport math\nimport json\nfrom datetime import datetime\n\ndef is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(math.sqrt(n)) + 1):\n        if n % i == 0:\n            return False\n    return True\n\nprimes = [x for x in range(2, 50) if is_prime(x)]\nprint(f"Primes under 50: {primes}")\nprint(f"Count: {len(primes)}")\nprint(f"\\nPython version running in your browser!")\nprint(f"Math.pi = {math.pi}")\nprint(f"Math.e = {math.e}")`,
  typescript: `// TypeScript - Display mode (type checking shown)\n\ninterface User {\n  id: number;\n  name: string;\n  email: string;\n  role: 'admin' | 'user' | 'moderator';\n}\n\nfunction greetUser(user: User): string {\n  return \`Hello, \${user.name}! You are a \${user.role}.\`;\n}\n\nconst user: User = {\n  id: 1,\n  name: "Billy Banks",\n  email: "billy@example.com",\n  role: "admin"\n};\n\nconsole.log(greetUser(user));`,
  sql: `-- SQL Playground - Display mode\n\nCREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  username VARCHAR(50) NOT NULL,\n  email VARCHAR(100) UNIQUE NOT NULL,\n  created_at TIMESTAMP DEFAULT NOW()\n);\n\nSELECT \n  u.username,\n  COUNT(p.id) as post_count\nFROM users u\nLEFT JOIN posts p ON u.id = p.author_id\nGROUP BY u.username\nORDER BY post_count DESC\nLIMIT 10;`,
  json: `{\n  "name": "My Ai Coder Project",\n  "version": "1.0.0",\n  "description": "Built with My Ai Coder Playground",\n  "dependencies": {\n    "react": "^18.0.0",\n    "express": "^4.18.0",\n    "typescript": "^5.0.0"\n  }\n}`,
  bash: `#!/bin/bash\n# Bash script - Display mode\n\necho "Hello from My Ai Coder!"\n\nfor i in {1..5}; do\n  echo "Iteration $i"\ndone\n\necho "Done!"`,
  rust: `// Rust - Display mode\n\nfn main() {\n    let numbers = vec![1, 2, 3, 4, 5];\n    let sum: i32 = numbers.iter().sum();\n    println!("Sum: {}", sum);\n}`,
  go: `// Go - Display mode\n\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from My Ai Coder!")\n}`,
  java: `// Java - Display mode\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from My Ai Coder!");\n    }\n}`,
  cpp: `// C++ - Display mode\n\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from My Ai Coder!" << endl;\n    return 0;\n}`,
};

function ProjectsPanel({ loadProjects, openProject, createProject, activeProject, projectFiles, activeFile, setActiveFile, addFileToProject, onClose }: any) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { loadProjects().then((p: any) => { setProjects(p); setLoading(false); }); }, [loadProjects]);

  return (
    <div className="border-b border-border/20 bg-zinc-50 px-4 py-2 max-h-40 overflow-auto">
      <div className="flex items-center gap-2 mb-2">
        <FolderOpen size={13} className="text-blue-500" />
        <span className="text-xs font-medium">Projects</span>
        <div className="flex-1" />
        <button onClick={createProject} className="px-2 py-0.5 text-[10px] font-medium bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1">
          <Plus size={9} /> New
        </button>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X size={12} /></button>
      </div>
      {loading ? <div className="text-[10px] text-zinc-400">Loading...</div> : projects.length === 0 ? (
        <div className="text-[10px] text-zinc-400">No projects yet. Create one to manage multi-file code.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {projects.map((p: any) => (
            <button key={p.id} onClick={() => openProject(p)} data-testid={`project-${p.id}`}
              className={`text-left p-2 rounded-lg border transition-all ${activeProject?.id === p.id ? "border-blue-400 bg-blue-50" : "border-border/30 bg-white hover:shadow-sm"}`}>
              <div className="text-[11px] font-medium truncate">{p.name}</div>
              <div className="text-[9px] text-muted-foreground">{p.fileCount || 0} files · {p.language}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CodePlayground() {
  const { settings } = useCoderSettings();
  const theme = CODE_THEMES[settings.codeTheme] || CODE_THEMES.oneDark;
  const { toast } = useToast();
  const qc = useQueryClient();
  const [lang, setLang] = useState("javascript");
  const [code, setCode] = useState(STARTER_CODE.javascript);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const recognitionRef = useRef<any>(null);
  const [reviewResult, setReviewResult] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [autoFixEnabled, setAutoFixEnabled] = useState(true);
  const [fixAttempt, setFixAttempt] = useState(0);
  const MAX_FIX_ATTEMPTS = 3;

  // ═══════ POWER #1: SERVER-SIDE EXECUTION MODE ═══════
  const [execMode, setExecMode] = useState<"browser" | "server">("browser");

  // ═══════ POWER #2: INTERACTIVE TERMINAL / REPL ═══════
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<{ cmd: string; out: string; err?: string }[]>([]);
  const [termCmd, setTermCmd] = useState("");
  const [termRunning, setTermRunning] = useState(false);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const termInputRef = useRef<HTMLInputElement>(null);
  const termScrollRef = useRef<HTMLDivElement>(null);

  const runTerminalCmd = useCallback(async (command?: string) => {
    const cmd = (command || termCmd).trim();
    if (!cmd) return;
    setTermRunning(true);
    setCmdHistory(prev => [...prev.filter(c => c !== cmd), cmd]);
    setHistoryIdx(-1);
    setTermCmd("");
    try {
      const res = await fetch("/api/terminal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: cmd }) });
      const data = await res.json();
      setTerminalHistory(prev => [...prev, { cmd, out: data.stdout || "", err: data.stderr || "" }]);
    } catch (e: any) {
      setTerminalHistory(prev => [...prev, { cmd, out: "", err: e.message }]);
    }
    setTermRunning(false);
    setTimeout(() => termScrollRef.current?.scrollTo(0, termScrollRef.current.scrollHeight), 50);
  }, [termCmd]);

  // ═══════ POWER #3: MULTI-FILE PROJECT SYSTEM ═══════
  const [showProjects, setShowProjects] = useState(false);
  const [activeProject, setActiveProject] = useState<any>(null);
  const [projectFiles, setProjectFiles] = useState<any[]>([]);
  const [activeFile, setActiveFile] = useState("");

  const loadProjects = useCallback(async () => {
    try { const r = await fetch("/api/projects"); return await r.json(); } catch { return []; }
  }, []);

  const createProject = useCallback(async () => {
    try {
      const r = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `Project ${Date.now() % 10000}`, language: lang }) });
      const proj = await r.json();
      setActiveProject(proj);
      const filesRes = await fetch(`/api/projects/${proj.id}/files`);
      const files = await filesRes.json();
      setProjectFiles(files);
      if (files.length > 0) { setActiveFile(files[0].name); setCode(files[0].content); }
      toast({ title: "Project created!" });
    } catch { toast({ title: "Failed to create project", variant: "destructive" }); }
  }, [lang, toast]);

  const openProject = useCallback(async (proj: any) => {
    setActiveProject(proj);
    try {
      const r = await fetch(`/api/projects/${proj.id}/files`);
      const files = await r.json();
      setProjectFiles(files);
      if (files.length > 0) { setActiveFile(files[0].name); setCode(files[0].content); }
    } catch {}
    setShowProjects(false);
  }, []);

  const saveFileToProject = useCallback(async () => {
    if (!activeProject || !activeFile) return;
    try {
      await fetch(`/api/projects/${activeProject.id}/files/${activeFile}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: code }) });
      toast({ title: `Saved ${activeFile}` });
    } catch {}
  }, [activeProject, activeFile, code, toast]);

  const addFileToProject = useCallback(async () => {
    if (!activeProject) return;
    const ext = lang === "python" ? "py" : lang === "html" ? "html" : lang === "css" ? "css" : "js";
    const name = `file_${projectFiles.length + 1}.${ext}`;
    try {
      await fetch(`/api/projects/${activeProject.id}/files`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: name, content: `// ${name}\n` }) });
      const r = await fetch(`/api/projects/${activeProject.id}/files`);
      const files = await r.json();
      setProjectFiles(files);
      setActiveFile(name);
      setCode(`// ${name}\n`);
    } catch {}
  }, [activeProject, lang, projectFiles]);

  // ═══════ POWER #4: PACKAGE MANAGER ═══════
  const [showPkgMgr, setShowPkgMgr] = useState(false);
  const [pkgInput, setPkgInput] = useState("");
  const [pkgManager, setPkgManager] = useState<"npm" | "pip">("npm");
  const [pkgInstalling, setPkgInstalling] = useState(false);
  const [pkgLog, setPkgLog] = useState<string[]>([]);

  const installPackages = useCallback(async () => {
    if (!pkgInput.trim()) return;
    const pkgs = pkgInput.split(/[\s,]+/).filter(Boolean);
    setPkgInstalling(true);
    setPkgLog(prev => [...prev, `> ${pkgManager} install ${pkgs.join(" ")}`, "Installing..."]);
    try {
      const r = await fetch("/api/packages/install", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packages: pkgs, manager: pkgManager }) });
      const data = await r.json();
      if (data.output) {
        const lines = data.output.split("\n").filter((l: string) => l.trim()).slice(-15);
        setPkgLog(prev => [...prev, ...lines]);
      }
      if (data.error && !data.success) {
        setPkgLog(prev => [...prev, `ERROR: ${data.error.substring(0, 500)}`]);
      }
      setPkgLog(prev => [...prev, data.success !== false ? `✓ Successfully installed: ${pkgs.join(", ")}` : `⚠ Install may have failed. Check output above.`]);
    } catch (e: any) {
      setPkgLog(prev => [...prev, `ERROR: ${e.message}`]);
    }
    setPkgInstalling(false);
    setPkgInput("");
  }, [pkgInput, pkgManager]);

  // ═══════ POWER #5: SNIPPET TEMPLATES ═══════
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  const loadTemplates = useCallback(async () => {
    try { const r = await fetch("/api/templates"); setTemplates(await r.json()); } catch {}
  }, []);

  const applyTemplate = useCallback((t: any) => {
    setCode(t.code);
    setLang(t.lang);
    setShowTemplates(false);
    setOutput([]);
    toast({ title: `Loaded: ${t.name}` });
  }, [toast]);

  const langInfo = PG_LANGUAGES.find(l => l.id === lang)!;

  const switchLang = (newLang: string) => {
    setLang(newLang);
    if (!activeProject) setCode(STARTER_CODE[newLang] || `// ${newLang}\n`);
    setOutput([]);
    setShowPreview(false);
    setReviewResult(null);
  };

  const aiAutoFix = useCallback(async (brokenCode: string, errorMsg: string, language: string, attempt: number): Promise<string | null> => {
    try {
      const chatRes = await fetch("/api/chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Auto-Fix " + attempt, type: "coder" }) });
      const chat = await chatRes.json();
      const prompt = `Fix this ${language} code that has this error: "${errorMsg}"

Return ONLY the complete fixed code in a single code block. No explanation, no comments about what you changed. Just the working code.

\`\`\`${language}
${brokenCode.substring(0, 2000)}
\`\`\``;
      const msgRes = await fetch(`/api/chats/${chat.id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: prompt })
      });
      const msg = await msgRes.json();
      const codeMatch = msg.content.match(/```(?:\w+)?\n([\s\S]*?)```/);
      if (codeMatch) return codeMatch[1].trim();
      const lines = msg.content.split("\n");
      const codeLines = lines.filter((l: string) => !l.startsWith("#") && !l.startsWith("//") && l.trim());
      if (codeLines.length > 2) return codeLines.join("\n");
      return null;
    } catch {
      return null;
    }
  }, []);

  const detectLang = useCallback((src: string): string | null => {
    const t = src.trim();
    if (/^\s*(def |class |import |from \w+ import|print\(|elif |if __name__|#!.*python)/m.test(t)) return "python";
    if (/^\s*<!DOCTYPE|^\s*<html|^\s*<div|^\s*<head/im.test(t)) return "html";
    if (/^\s*[.#@][\w-]+\s*\{|^\s*:root\s*\{|^\s*body\s*\{|^\s*@media/m.test(t)) return "css";
    return null;
  }, []);

  const prepareJSCode = useCallback((src: string): string => {
    let c = src;
    c = c.replace(/^\s*import\s+.*?from\s+['"].*?['"];?\s*$/gm, "");
    c = c.replace(/^\s*import\s+['"].*?['"];?\s*$/gm, "");
    c = c.replace(/^\s*import\s*\{[^}]*\}\s*from\s*['"].*?['"];?\s*$/gm, "");
    c = c.replace(/^\s*import\s+\*\s+as\s+\w+\s+from\s*['"].*?['"];?\s*$/gm, "");
    c = c.replace(/^\s*export\s+default\s+/gm, "");
    c = c.replace(/^\s*export\s+/gm, "");
    c = c.replace(/:\s*(string|number|boolean|any|void|never|null|undefined|object|unknown)(\[\])?\s*(;|,|\)|\}|=|\n|$)/g, "$3");
    c = c.replace(/:\s*(string|number|boolean|any|void|never|null|undefined|object|unknown)(\[\])?\s*(\{)/g, " $3");
    c = c.replace(/<\w+(\s*,\s*\w+)*>/g, "");
    c = c.replace(/\bas\s+\w+/g, "");
    c = c.replace(/^\s*interface\s+\w+\s*\{[\s\S]*?\n\}\s*$/gm, "");
    c = c.replace(/^\s*type\s+\w+\s*=\s*[\s\S]*?;\s*$/gm, "");
    c = c.replace(/^\s*declare\s+.*$/gm, "");
    c = c.replace(/^\s*@\w+(\(.*?\))?\s*$/gm, "");
    c = c.replace(/^\s*#\w+/gm, (match) => match.replace("#", "// private: "));
    return c;
  }, []);

  const loadPyodide = useCallback(async () => {
    if ((window as any)._pyodide) return (window as any)._pyodide;
    if ((window as any)._pyodideLoading) {
      return new Promise((resolve, reject) => {
        const check = setInterval(() => {
          if ((window as any)._pyodide) { clearInterval(check); resolve((window as any)._pyodide); }
          if (!(window as any)._pyodideLoading) { clearInterval(check); reject(new Error("Load failed")); }
        }, 500);
      });
    }
    (window as any)._pyodideLoading = true;
    return new Promise((resolve, reject) => {
      if (!(window as any).loadPyodide) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
        script.onload = async () => {
          try {
            const py = await (window as any).loadPyodide();
            (window as any)._pyodide = py;
            (window as any)._pyodideLoading = false;
            setPyodideReady(true);
            resolve(py);
          } catch (e) { (window as any)._pyodideLoading = false; reject(e); }
        };
        script.onerror = () => { (window as any)._pyodideLoading = false; reject(new Error("Failed to load Pyodide")); };
        document.head.appendChild(script);
      } else {
        (window as any).loadPyodide().then((py: any) => {
          (window as any)._pyodide = py; (window as any)._pyodideLoading = false; setPyodideReady(true); resolve(py);
        }).catch((e: any) => { (window as any)._pyodideLoading = false; reject(e); });
      }
    });
  }, []);

  const runJS = useCallback((src: string) => {
    const iframe = document.createElement("iframe");
    iframe.sandbox.add("allow-scripts");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    const startTime = performance.now();
    const cleaned = prepareJSCode(src);
    const encoded = btoa(unescape(encodeURIComponent(cleaned)));
    const html = `<!DOCTYPE html><html><body><script>
      var _l=[], _e=0;
      function _fmt(v){if(v===null)return"null";if(v===undefined)return"undefined";if(typeof v==="object")try{return JSON.stringify(v,null,2)}catch(e){return String(v)}return String(v)}
      console.log=function(){var a=[];for(var i=0;i<arguments.length;i++)a.push(_fmt(arguments[i]));_l.push(a.join(" "))};
      console.error=function(){var a=[];for(var i=0;i<arguments.length;i++)a.push(_fmt(arguments[i]));_l.push("ERROR: "+a.join(" "));_e++};
      console.warn=function(){var a=[];for(var i=0;i<arguments.length;i++)a.push(_fmt(arguments[i]));_l.push("WARN: "+a.join(" "))};
      console.info=function(){var a=[];for(var i=0;i<arguments.length;i++)a.push(_fmt(arguments[i]));_l.push(a.join(" "))};
      console.table=function(d){_l.push(_fmt(d))};
      console.dir=function(o){_l.push(_fmt(o))};
      console.assert=function(c){if(!c){var a=["Assertion failed:"];for(var i=1;i<arguments.length;i++)a.push(_fmt(arguments[i]));_l.push("ERROR: "+a.join(" "));_e++}};
      console.clear=function(){_l=[]};
      console.time=function(l){this._t=this._t||{};this._t[l||"default"]=performance.now()};
      console.timeEnd=function(l){var k=l||"default";if(this._t&&this._t[k]){_l.push(k+": "+(performance.now()-this._t[k]).toFixed(3)+"ms");delete this._t[k]}};
      console.count=function(l){var k=l||"default";this._c=this._c||{};this._c[k]=(this._c[k]||0)+1;_l.push(k+": "+this._c[k])};
      window.onerror=function(m,s,l,c,e){_l.push("ERROR: "+m);parent.postMessage({type:"pg_output",logs:_l,errors:_e+1},"*");return true};
      window.onunhandledrejection=function(e){_l.push("ERROR: Unhandled Promise: "+(_fmt(e.reason&&e.reason.message||e.reason)));_e++};
      try{
        var _code=decodeURIComponent(escape(atob("${encoded}")));
        var _result=(0,eval)(_code);
        if(_result!==undefined&&_l.length===0)_l.push("=> "+_fmt(_result));
      }catch(e){_l.push("ERROR: "+e.message);_e++}
      setTimeout(function(){parent.postMessage({type:"pg_output",logs:_l,errors:_e},"*")},10);
    <\/script></body></html>`;
    let done = false;
    const handler = async (e: MessageEvent) => {
      if (e.data?.type === "pg_output" && !done) {
        done = true;
        const elapsed = (performance.now() - startTime).toFixed(1);
        const logs: string[] = e.data.logs || [];
        const errors = e.data.errors || 0;
        window.removeEventListener("message", handler);
        try { document.body.removeChild(iframe); } catch {}

        const UNFIXABLE_ERRORS = ["registerProtocolHandler", "allowlist", "Bluetooth", "USB", "Serial", "HID", "showDirectoryPicker", "showOpenFilePicker", "showSaveFilePicker", "getDisplayMedia", "requestMIDIAccess", "PaymentRequest", "Notification.requestPermission", "serviceWorker.register", "cross-origin", "Blocked a frame", "SecurityError"];
        const errorLines = logs.filter((l: string) => l.startsWith("ERROR:"));
        const errorMsg = errorLines.join("; ");
        const isUnfixable = UNFIXABLE_ERRORS.some(uf => errorMsg.includes(uf));

        if (errors > 0 && autoFixEnabled && fixAttempt < MAX_FIX_ATTEMPTS && !isUnfixable) {
          setOutput(prev => [...prev, ...logs, "", `⚠ Error detected (attempt ${fixAttempt + 1}/${MAX_FIX_ATTEMPTS})`, "🔧 AI Auto-Fix: Analyzing and fixing code..."]);
          setFixAttempt(prev => prev + 1);
          const fixedCode = await aiAutoFix(src, errorMsg, "javascript", fixAttempt + 1);
          if (fixedCode) {
            setCode(fixedCode);
            setOutput(prev => [...prev, "✓ AI applied a fix. Re-running...", ""]);
            setTimeout(() => runJS(fixedCode), 300);
          } else {
            setOutput(prev => [...prev, "⚠ AI could not auto-fix this error.", `Completed in ${elapsed}ms`]);
            setIsRunning(false);
            setFixAttempt(0);
          }
        } else {
          const extra = isUnfixable ? ["", "⚠ This error is a browser security restriction — it cannot be auto-fixed.", "💡 Try running in Server mode or use a different approach."] : [];
          setOutput(prev => [...(fixAttempt > 0 ? prev : []), ...logs, ...extra, "", errors > 0 ? `⚠ Completed with ${errors} error(s) in ${elapsed}ms` : `✓ Executed successfully in ${elapsed}ms`]);
          setIsRunning(false);
          setFixAttempt(0);
        }
      }
    };
    window.addEventListener("message", handler);
    iframe.srcdoc = html;
    setTimeout(() => {
      if (!done) { done = true; setOutput(p => [...p, "ERROR: Timed out (10s limit)"]); setIsRunning(false); setFixAttempt(0); window.removeEventListener("message", handler); try { document.body.removeChild(iframe); } catch {} }
    }, 10000);
  }, [prepareJSCode, autoFixEnabled, fixAttempt, aiAutoFix]);

  const SERVER_ONLY_PACKAGES = new Set([
    "discord", "discord.py", "spacy", "tensorflow", "torch", "pytorch",
    "flask", "django", "fastapi", "uvicorn", "gunicorn", "celery",
    "psycopg2", "mysqlclient", "redis", "pymongo", "sqlalchemy",
    "scrapy", "selenium", "playwright", "opencv-python", "cv2",
    "tkinter", "pygame", "kivy", "pyqt5", "pyside2", "wxpython",
    "dask", "ray", "airflow", "kafka", "boto3", "grpc", "grpcio",
    "socket", "asyncio", "multiprocessing", "threading", "subprocess",
    "ctypes", "cffi", "cython", "numba",
  ]);

  const PYODIDE_INSTALLABLE = new Set([
    "numpy", "pandas", "scipy", "matplotlib", "scikit-learn", "sklearn",
    "pillow", "pil", "sympy", "networkx", "regex", "pyyaml", "yaml",
    "beautifulsoup4", "bs4", "lxml", "html5lib", "jsonschema",
    "requests", "micropip", "packaging", "six", "certifi", "charset-normalizer",
    "idna", "urllib3", "pytz", "dateutil", "python-dateutil",
  ]);

  const pyExecute = useCallback(async (src: string, pyodide: any, attempt: number): Promise<void> => {
    setOutput(prev => [...prev, "Running Python..."]);
    pyodide.runPython(`import sys; from io import StringIO; sys.stdout = StringIO(); sys.stderr = StringIO()`);
    const startTime = performance.now();

    try {
      pyodide.runPython(src);
    } catch (e: any) {
      let stdout = "", stderr = "";
      try { stdout = pyodide.runPython(`sys.stdout.getvalue()`); } catch {}
      try { stderr = pyodide.runPython(`sys.stderr.getvalue()`); } catch {}
      try { pyodide.runPython(`sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__`); } catch {}
      const outLines = stdout ? stdout.split("\n").filter((l: string) => l) : [];
      const errMsg = e.message || "";

      const moduleMatch = errMsg.match(/No module named '(\w+)'/);
      const errLines = errMsg.split("\n");
      const lastLine = errLines.filter((l: string) => l.trim()).pop() || errMsg;
      const tbLine = errLines.find((l: string) => /line \d+/.test(l));

      if (moduleMatch) {
        const missingMod = moduleMatch[1];
        const isSvrOnly = SERVER_ONLY_PACKAGES.has(missingMod.toLowerCase());
        setOutput(prev => [...prev, ...outLines,
          `ERROR: No module named '${missingMod}'`,
          isSvrOnly ? `  '${missingMod}' requires a server environment.` : `  '${missingMod}' not available in browser Python.`,
        ]);
      } else {
        setOutput(prev => [...prev, ...outLines,
          `ERROR: ${lastLine}`,
          ...(tbLine ? [`  at ${tbLine.trim()}`] : []),
          ...(stderr ? [`STDERR: ${stderr}`] : []),
        ]);
      }

      if (autoFixEnabled && attempt < MAX_FIX_ATTEMPTS && !moduleMatch) {
        setOutput(prev => [...prev, "", `⚠ Error detected (attempt ${attempt + 1}/${MAX_FIX_ATTEMPTS})`, "🔧 AI Auto-Fix: Analyzing and fixing Python code..."]);
        const fixedCode = await aiAutoFix(src, lastLine, "python", attempt + 1);
        if (fixedCode) {
          setCode(fixedCode);
          setOutput(prev => [...prev, "✓ AI applied a fix. Re-running...", ""]);
          await pyExecute(fixedCode, pyodide, attempt + 1);
          return;
        } else {
          setOutput(prev => [...prev, "⚠ AI could not auto-fix this error."]);
        }
      }
      setIsRunning(false);
      setFixAttempt(0);
      return;
    }

    let stdout = "";
    try {
      stdout = pyodide.runPython(`v = sys.stdout.getvalue(); sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__; v`);
    } catch { try { pyodide.runPython(`sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__`); } catch {} }
    const elapsed = (performance.now() - startTime).toFixed(1);
    const lines = stdout ? stdout.split("\n").filter((l: string) => l !== "") : [];
    if (lines.length === 0) lines.push("(no output - add print() statements to see results)");
    setOutput(prev => {
      const cleaned = prev.filter(l => l !== "Running Python..." && l !== "Loading Python runtime...");
      return [...cleaned, ...lines, "", `✓ Executed in ${elapsed}ms`];
    });
    setIsRunning(false);
    setFixAttempt(0);
  }, [autoFixEnabled, aiAutoFix]);

  const runPython = useCallback(async (src: string) => {
    setOutput(["Loading Python runtime..."]);
    try {
      const pyodide = await loadPyodide();

      const importMatches = src.match(/^\s*(?:import|from)\s+(\w+)/gm) || [];
      const requestedModules = importMatches.map(m => m.replace(/^\s*(?:import|from)\s+/, "").trim());

      const serverOnly = requestedModules.filter(m => SERVER_ONLY_PACKAGES.has(m.toLowerCase()));
      if (serverOnly.length > 0) {
        setOutput([
          `⚠ Cannot run in browser: ${serverOnly.join(", ")}`,
          "",
          "These packages require a real server environment:",
          ...serverOnly.map(m => `  • ${m} - needs native OS / network access`),
          "",
          "Running remaining code without blocked imports...",
        ]);
        src = src.replace(
          new RegExp(`^\\s*(?:import|from)\\s+(?:${serverOnly.join("|")})\\b.*$`, "gm"),
          (match) => `# [SKIPPED] ${match.trim()}`
        );
      }

      const installable = requestedModules.filter(m =>
        PYODIDE_INSTALLABLE.has(m.toLowerCase()) && !serverOnly.includes(m)
      );
      if (installable.length > 0) {
        setOutput(prev => [...prev, `Installing packages: ${installable.join(", ")}...`]);
        try { await pyodide.loadPackagesFromImports(src); } catch {
          try { const mp = pyodide.pyimport("micropip"); for (const p of installable) { try { await mp.install(p); } catch {} } } catch {}
        }
      }

      await pyExecute(src, pyodide, fixAttempt);
    } catch (e: any) {
      setOutput([`ERROR: ${e.message}`, "", "Tip: Python runtime loads on first use. Try running again."]);
      setIsRunning(false);
    }
  }, [loadPyodide, pyExecute, fixAttempt]);

  // ═══════ POWER #1: SERVER-SIDE EXECUTION ═══════
  const runOnServer = useCallback(async (src: string, language: string) => {
    setOutput(["⚡ Executing on server..."]);
    try {
      const r = await fetch("/api/execute", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: src, language }) });
      const data = await r.json();
      const lines: string[] = [];
      if (data.stdout) lines.push(...data.stdout.split("\n"));
      if (data.stderr) lines.push(...data.stderr.split("\n").map((l: string) => `STDERR: ${l}`));
      if (lines.length === 0) lines.push("(no output)");
      lines.push("", data.exitCode === 0 ? `✓ Server execution completed in ${data.executionTime}ms` : `⚠ Exited with code ${data.exitCode} (${data.executionTime}ms)`);

      if (data.exitCode !== 0 && autoFixEnabled && fixAttempt < MAX_FIX_ATTEMPTS) {
        const errMsg = data.stderr || lines.find((l: string) => l.includes("Error")) || "Unknown error";
        setOutput(prev => [...prev, ...lines, "", `🔧 AI Auto-Fix attempt ${fixAttempt + 1}/${MAX_FIX_ATTEMPTS}...`]);
        setFixAttempt(prev => prev + 1);
        const fixedCode = await aiAutoFix(src, errMsg, language, fixAttempt + 1);
        if (fixedCode) {
          setCode(fixedCode);
          setOutput(prev => [...prev, "✓ Fix applied. Re-running on server..."]);
          setTimeout(() => runOnServer(fixedCode, language), 300);
          return;
        }
        setOutput(prev => [...prev, "⚠ Could not auto-fix."]);
      } else {
        setOutput(lines);
      }
    } catch (e: any) {
      setOutput([`ERROR: ${e.message}`]);
    }
    setIsRunning(false);
    setFixAttempt(0);
  }, [autoFixEnabled, fixAttempt, aiAutoFix]);

  const runCode = useCallback(async () => {
    setOutput([]);
    setIsRunning(true);

    let effectiveLang = lang;
    const detected = detectLang(code);
    if (detected && detected !== lang) {
      if (detected === "python" && (lang === "javascript" || lang === "typescript")) {
        effectiveLang = "python"; setLang("python");
        setOutput(["Auto-detected Python code. Switching language..."]);
      } else if (detected === "html" && lang !== "html") { effectiveLang = "html"; setLang("html"); }
      else if (detected === "css" && lang !== "css") { effectiveLang = "css"; setLang("css"); }
    }

    if (execMode === "server" && (effectiveLang === "javascript" || effectiveLang === "typescript" || effectiveLang === "python" || effectiveLang === "bash")) {
      await runOnServer(code, effectiveLang);
      return;
    }

    if (effectiveLang === "javascript" || effectiveLang === "typescript") {
      runJS(code);
    } else if (effectiveLang === "html") {
      setShowPreview(true);
      setOutput(["✓ HTML rendered in preview panel"]);
      setIsRunning(false);
    } else if (effectiveLang === "css") {
      setShowPreview(true);
      setOutput(["✓ CSS applied to preview panel"]);
      setIsRunning(false);
    } else if (effectiveLang === "python") {
      await runPython(code);
    } else if (effectiveLang === "bash") {
      await runOnServer(code, "bash");
    } else {
      setOutput([`Language: ${effectiveLang}`, "", "Switch to Server mode to run this language,", "or use JavaScript/Python/HTML/CSS for browser execution."]);
      setIsRunning(false);
    }
  }, [code, lang, detectLang, runJS, runPython, execMode, runOnServer]);

  const handleSave = async () => {
    const fn = `playground_${Date.now()}.${getExt(lang)}`;
    try {
      await fetch("/api/save-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, filename: fn, language: lang }) });
      qc.invalidateQueries({ queryKey: ["/api/saved-codes"] });
      toast({ title: "Saved!", description: fn });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
  };

  // FUTURISTIC #1 - Voice-to-Code
  const toggleVoice = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast({ title: "Voice not supported", description: "Your browser doesn't support speech recognition", variant: "destructive" });
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setVoiceText(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    toast({ title: "Listening...", description: "Speak your code description" });
  }, [isListening, toast]);

  const [voiceGenerating, setVoiceGenerating] = useState(false);

  const generateCodeFromVoice = useCallback(async () => {
    if (!voiceText.trim()) return;
    const description = voiceText.trim();
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoiceGenerating(true);
    setOutput([`🎤 Voice Command: "${description}"`, "", "🔧 AI is generating your code..."]);

    try {
      const chatRes = await fetch("/api/chats", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Voice: ${description.substring(0, 40)}`, type: "coder" })
      });
      const chat = await chatRes.json();
      const prompt = `The user spoke this voice command describing what they want to build:\n\n"${description}"\n\nGenerate the complete ${lang} code that does exactly what they described. Return ONLY the code in a single code block. No explanation before or after. Make it fully working and runnable.\n\nIMPORTANT RULES:\n- To open any website/URL, use: window.open("https://example.com", "_blank")\n- NEVER use registerProtocolHandler, it does not work in sandboxed browsers\n- NEVER use require() or import for Node.js modules — this runs in a browser sandbox\n- For fetching data, use fetch() API\n- For DOM manipulation, use standard document methods\n- Keep it browser-compatible JavaScript unless the user specifically asks for server-side code`;
      const msgRes = await fetch(`/api/chats/${chat.id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: prompt })
      });
      const msg = await msgRes.json();
      const codeMatch = msg.content.match(/```(?:\w+)?\n([\s\S]*?)```/);
      if (codeMatch) {
        setCode(codeMatch[1].trim());
        setOutput([`🎤 Voice: "${description}"`, "", `✓ AI generated ${lang} code from your voice command!`, "", "Press Run to execute, or keep speaking for more."]);
        toast({ title: "Code generated from voice!" });
      } else {
        const lines = msg.content.split("\n");
        const codeLines = lines.filter((l: string) => !l.startsWith("Here") && !l.startsWith("This") && !l.startsWith("I ") && l.trim());
        if (codeLines.length > 2) {
          setCode(codeLines.join("\n"));
          setOutput([`🎤 Voice: "${description}"`, "", "✓ AI generated code from your description."]);
        } else {
          setOutput([`🎤 Voice: "${description}"`, "", "⚠ AI couldn't generate code. Try being more specific:", `  Example: "create a function that sorts an array using quicksort"`]);
        }
      }
    } catch (e: any) {
      setOutput([`🎤 Voice: "${description}"`, "", `ERROR: ${e.message}`]);
    }
    setVoiceText("");
    setVoiceGenerating(false);
  }, [voiceText, lang, toast]);

  // FUTURISTIC #2 - AI Code Review
  const handleAIReview = useCallback(async () => {
    setIsReviewing(true);
    setReviewResult(null);
    try {
      const chatRes = await fetch("/api/chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Code Review", type: "coder" }) });
      const chat = await chatRes.json();
      const msgRes = await fetch(`/api/chats/${chat.id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `Review this ${lang} code. Rate it 1-10. List specific improvements for: performance, readability, security, best practices. Be concise.\n\n\`\`\`${lang}\n${code}\n\`\`\`` })
      });
      const msg = await msgRes.json();
      setReviewResult(msg.content);
    } catch {
      setReviewResult("Failed to get AI review. Please try again.");
    }
    setIsReviewing(false);
  }, [code, lang]);

  // FUTURISTIC #3 - AI Auto-Fix
  const handleAIFix = useCallback(async () => {
    setIsRunning(true);
    try {
      const chatRes = await fetch("/api/chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Auto-Fix", type: "coder" }) });
      const chat = await chatRes.json();
      const msgRes = await fetch(`/api/chats/${chat.id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `Fix and improve this ${lang} code. Return ONLY the fixed code in a single code block, no explanation:\n\n\`\`\`${lang}\n${code}\n\`\`\`` })
      });
      const msg = await msgRes.json();
      const codeMatch = msg.content.match(/```(?:\w+)?\n([\s\S]*?)```/);
      if (codeMatch) {
        setCode(codeMatch[1].trim());
        toast({ title: "Code fixed by AI!" });
      } else {
        toast({ title: "AI couldn't extract fixed code", variant: "destructive" });
      }
    } catch {
      toast({ title: "AI fix failed", variant: "destructive" });
    }
    setIsRunning(false);
  }, [code, lang, toast]);

  // FUTURISTIC #4 - AI Explain Code (Visual)
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const handleExplain = useCallback(async () => {
    setIsExplaining(true);
    setExplanation(null);
    try {
      const chatRes = await fetch("/api/chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Code Explain", type: "coder" }) });
      const chat = await chatRes.json();
      const msgRes = await fetch(`/api/chats/${chat.id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `Explain this ${lang} code step by step. Use numbered steps. For each step explain what the code does and why. Be concise:\n\n\`\`\`${lang}\n${code}\n\`\`\`` })
      });
      const msg = await msgRes.json();
      setExplanation(msg.content);
    } catch {
      setExplanation("Failed to get explanation.");
    }
    setIsExplaining(false);
  }, [code, lang]);

  const previewHtml = lang === "html" ? code : lang === "css" ? `<html><head><style>${code}</style></head><body style="padding:20px"><div class="demo"><h1>Heading</h1><p>Paragraph text with <strong>bold</strong> and <em>italic</em>.</p><button>Button</button><input placeholder="Input"/><ul><li>Item 1</li><li>Item 2</li></ul></div></body></html>` : "";
  const metrics = useMemo(() => analyzeCode(code, lang), [code, lang]);

  return (
    <div className="flex flex-col h-full bg-background" data-testid="playground-page">
      {/* Toolbar Row 1 - Main controls */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/30 bg-white overflow-x-auto">
        <SquareTerminal size={14} className="text-blue-500 shrink-0" />
        <span className="font-semibold text-xs shrink-0">Playground</span>

        {activeProject && (
          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-medium shrink-0">
            <FolderOpen size={9} className="inline mr-0.5" />{activeProject.name}
          </span>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-0.5 bg-muted/30 rounded-lg p-0.5 shrink-0">
          {PG_LANGUAGES.slice(0, 6).map(l => (
            <button key={l.id} onClick={() => switchLang(l.id)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] transition-all ${lang === l.id ? "bg-white shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              <l.icon size={10} className={l.color} />{l.name}
            </button>
          ))}
          <select value={lang} onChange={e => switchLang(e.target.value)} className="text-[10px] bg-transparent border-none focus:outline-none text-muted-foreground cursor-pointer px-0.5">
            {PG_LANGUAGES.slice(6).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>

        <div className="h-4 w-px bg-border/20 shrink-0" />

        <button onClick={() => setExecMode(execMode === "browser" ? "server" : "browser")} data-testid="button-exec-mode"
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all shrink-0 ${execMode === "server" ? "bg-orange-500 text-white shadow-sm" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>
          {execMode === "server" ? <><Cloud size={10} /> Server</> : <><Smartphone size={10} /> Browser</>}
        </button>

        <button onClick={runCode} disabled={isRunning} data-testid="button-run-playground"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 ${isRunning ? "bg-amber-500 text-white" : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"}`}>
          {isRunning ? <><StopCircle size={11} /> Running...</> : <><Play size={11} /> Run</>}
        </button>

        <button onClick={activeProject ? saveFileToProject : handleSave} className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground shrink-0" title="Save"><Download size={13} /></button>
        <button onClick={() => { setCode(""); setOutput([]); }} className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground shrink-0" title="Clear"><Eraser size={13} /></button>
      </div>

      {/* Toolbar Row 2 - Power features */}
      <div className="flex items-center gap-1 px-3 py-1 border-b border-border/20 bg-zinc-50/80 overflow-x-auto">
        <button onClick={toggleVoice} data-testid="button-voice"
          className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium transition-all shrink-0 ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-violet-50 text-violet-600 hover:bg-violet-100"}`}>
          {isListening ? <><MicOff size={10} /> Stop</> : <><Mic size={10} /> Voice</>}
        </button>
        <button onClick={handleAIReview} disabled={isReviewing} data-testid="button-ai-review"
          className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all disabled:opacity-50 shrink-0">
          <Scan size={10} /> {isReviewing ? "..." : "Review"}
        </button>
        <button onClick={handleAIFix} disabled={isRunning} data-testid="button-ai-fix"
          className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all disabled:opacity-50 shrink-0">
          <Wand2 size={10} /> Fix
        </button>
        <button onClick={handleExplain} disabled={isExplaining} data-testid="button-ai-explain"
          className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all disabled:opacity-50 shrink-0">
          <Brain size={10} /> {isExplaining ? "..." : "Explain"}
        </button>

        <div className="h-3.5 w-px bg-border/20 shrink-0" />

        <button onClick={() => setAutoFixEnabled(!autoFixEnabled)} data-testid="button-toggle-autofix"
          className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium transition-all shrink-0 ${autoFixEnabled ? "bg-green-500 text-white" : "bg-zinc-100 text-zinc-400"}`}>
          <RefreshCw size={9} className={autoFixEnabled ? "animate-[spin_3s_linear_infinite]" : ""} /> Auto-Fix
        </button>

        <div className="h-3.5 w-px bg-border/20 shrink-0" />

        <button onClick={() => setShowTerminal(!showTerminal)} data-testid="button-terminal"
          className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium transition-all shrink-0 ${showTerminal ? "bg-zinc-800 text-green-400" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>
          <Terminal size={10} /> Terminal
        </button>

        <button onClick={() => { setShowProjects(!showProjects); if (!showProjects) loadProjects().then(() => {}); }} data-testid="button-projects"
          className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium transition-all shrink-0 ${showProjects ? "bg-blue-500 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>
          <FolderOpen size={10} /> Projects
        </button>

        <button onClick={() => setShowPkgMgr(!showPkgMgr)} data-testid="button-packages"
          className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium transition-all shrink-0 ${showPkgMgr ? "bg-purple-500 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>
          <Package size={10} /> Packages
        </button>

        <button onClick={() => { setShowTemplates(!showTemplates); if (!showTemplates) loadTemplates(); }} data-testid="button-templates"
          className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium transition-all shrink-0 ${showTemplates ? "bg-cyan-500 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>
          <Rocket size={10} /> Templates
        </button>
      </div>

      {/* Voice transcript bar */}
      {(isListening || voiceText || voiceGenerating) && (
        <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 border-b border-violet-200">
          <Mic size={14} className={`text-violet-500 ${isListening ? "animate-pulse" : ""}`} />
          <span className="text-xs text-violet-700 flex-1">
            {voiceGenerating ? "AI is writing your code..." : voiceText || "Listening... describe what you want to build"}
          </span>
          {voiceText && !voiceGenerating && (
            <>
              <button onClick={generateCodeFromVoice} data-testid="button-voice-generate"
                className="px-3 py-1 text-[11px] bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium shadow-sm flex items-center gap-1">
                <Sparkles size={10} /> Generate Code
              </button>
              <button onClick={() => { setVoiceText(""); recognitionRef.current?.stop(); setIsListening(false); }}
                className="px-2 py-1 text-[11px] text-violet-500 hover:text-violet-700">
                <X size={12} />
              </button>
            </>
          )}
          {voiceGenerating && <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />}
        </div>
      )}

      {/* Slide-down panels for Projects, Packages, Templates */}
      {showProjects && (
        <ProjectsPanel loadProjects={loadProjects} openProject={openProject} createProject={createProject}
          activeProject={activeProject} projectFiles={projectFiles} activeFile={activeFile}
          setActiveFile={(f: string) => { setActiveFile(f); const file = projectFiles.find((pf: any) => pf.name === f); if (file) setCode(file.content); }}
          addFileToProject={addFileToProject} onClose={() => setShowProjects(false)} />
      )}
      {showPkgMgr && (
        <div className="border-b border-border/20 bg-zinc-50 px-4 py-2">
          <div className="flex items-center gap-2 mb-2">
            <Package size={13} className="text-purple-500" />
            <span className="text-xs font-medium">Package Manager</span>
            <div className="flex-1" />
            <button onClick={() => setShowPkgMgr(false)} className="text-zinc-400 hover:text-zinc-600"><X size={12} /></button>
          </div>
          <div className="flex items-center gap-2">
            <select value={pkgManager} onChange={e => setPkgManager(e.target.value as "npm" | "pip")}
              className="text-[10px] px-1.5 py-1 rounded border border-border/30 bg-white">
              <option value="npm">npm</option><option value="pip">pip</option>
            </select>
            <input value={pkgInput} onChange={e => setPkgInput(e.target.value)} placeholder="package names (space separated)"
              className="flex-1 text-xs px-2 py-1 rounded border border-border/30 bg-white focus:outline-none focus:border-blue-300"
              onKeyDown={e => e.key === "Enter" && installPackages()} data-testid="input-package" />
            <button onClick={installPackages} disabled={pkgInstalling}
              className="px-2 py-1 text-[10px] font-medium bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50">
              {pkgInstalling ? "Installing..." : "Install"}
            </button>
          </div>
          {pkgLog.length > 0 && (
            <div className="mt-2 max-h-24 overflow-auto bg-zinc-900 rounded p-2 text-[10px] font-mono text-zinc-300">
              {pkgLog.map((l, i) => <div key={i} className={l.startsWith("Error") ? "text-red-400" : l.startsWith("✓") ? "text-green-400" : ""}>{l}</div>)}
            </div>
          )}
        </div>
      )}
      {showTemplates && (
        <div className="border-b border-border/20 bg-zinc-50 px-4 py-2 max-h-48 overflow-auto">
          <div className="flex items-center gap-2 mb-2">
            <Rocket size={13} className="text-cyan-500" />
            <span className="text-xs font-medium">Code Templates</span>
            <div className="flex-1" />
            <button onClick={() => setShowTemplates(false)} className="text-zinc-400 hover:text-zinc-600"><X size={12} /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {templates.map(t => (
              <button key={t.id} onClick={() => applyTemplate(t)} data-testid={`template-${t.id}`}
                className="text-left p-2 rounded-lg border border-border/30 bg-white hover:shadow-sm hover:border-cyan-300 transition-all">
                <div className="text-[11px] font-medium">{t.name}</div>
                <div className="text-[9px] text-muted-foreground">{t.desc}</div>
                <span className="text-[8px] bg-zinc-100 text-zinc-500 px-1 py-0.5 rounded mt-1 inline-block">{t.lang}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Editor + Output */}
      <div className="flex-1 flex overflow-hidden">
        {/* Multi-file sidebar */}
        {activeProject && projectFiles.length > 0 && (
          <div className="w-40 bg-zinc-900 border-r border-zinc-800 flex flex-col">
            <div className="px-2 py-1.5 text-[10px] text-zinc-500 font-medium border-b border-zinc-800 flex items-center justify-between">
              <span>FILES</span>
              <button onClick={addFileToProject} className="text-zinc-600 hover:text-zinc-300"><Plus size={11} /></button>
            </div>
            <div className="flex-1 overflow-auto">
              {projectFiles.map(f => (
                <button key={f.name} onClick={() => { setActiveFile(f.name); setCode(f.content); }}
                  className={`w-full text-left px-2 py-1 text-[10px] font-mono flex items-center gap-1.5 transition-colors ${activeFile === f.name ? "bg-zinc-800 text-zinc-200" : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"}`}>
                  <FileCode size={10} className="shrink-0 text-zinc-600" />
                  <span className="truncate">{f.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => { setActiveProject(null); setProjectFiles([]); setActiveFile(""); }}
              className="px-2 py-1.5 text-[9px] text-zinc-600 hover:text-red-400 border-t border-zinc-800 text-center">
              Close Project
            </button>
          </div>
        )}

        {/* Code Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500/80"/><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"/><div className="w-2.5 h-2.5 rounded-full bg-green-500/80"/></div>
              <span className="text-[11px] text-zinc-400 font-mono">playground.{getExt(lang)}</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-zinc-600">
              <span>{metrics.totalLines} lines</span>
              <span>{metrics.functions} funcs</span>
              <span>{metrics.classes} classes</span>
              <span className={metrics.complexity === "Low" ? "text-green-500" : metrics.complexity === "Medium" ? "text-yellow-500" : "text-red-500"}>{metrics.complexity}</span>
            </div>
          </div>
          <div className="flex-1 relative" style={{ background: theme.bg, overflow: "hidden" }}>
            <div className="absolute inset-0 overflow-auto" ref={(el) => {
              if (el) {
                const ta = el.querySelector("textarea");
                const hl = el.querySelector(".syntax-hl");
                if (ta && hl) {
                  ta.onscroll = () => { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; };
                }
              }
            }}>
              <div className="relative" style={{ minHeight: "100%" }}>
                <textarea
                  ref={textareaRef} value={code} onChange={e => setCode(e.target.value)}
                  data-testid="playground-editor"
                  className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white resize-none z-10 focus:outline-none overflow-auto"
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: `${settings.fontSize}px`, lineHeight: "1.6", tabSize: 2, padding: "1rem", paddingLeft: settings.showLineNumbers ? "4rem" : "1rem" }}
                  spellCheck={false}
                  onKeyDown={e => {
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const start = e.currentTarget.selectionStart;
                      const end = e.currentTarget.selectionEnd;
                      const newCode = code.substring(0, start) + "  " + code.substring(end);
                      setCode(newCode);
                      requestAnimationFrame(() => { if (textareaRef.current) { textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2; } });
                    }
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); runCode(); }
                    if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSave(); }
                  }}
                />
                <div className="syntax-hl pointer-events-none overflow-hidden" aria-hidden="true">
                  <SyntaxHighlighter style={theme.style} language={lang} showLineNumbers={settings.showLineNumbers}
                    lineNumberStyle={{ color: "#555", fontSize: `${settings.fontSize - 2}px`, minWidth: "2.5em" }}
                    customStyle={{ margin: 0, padding: "1rem", background: "transparent", fontSize: `${settings.fontSize}px`, lineHeight: "1.6", minHeight: "100%" }}>
                    {code || " "}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Output / Preview panel */}
        <div className="w-[45%] flex flex-col border-l border-zinc-800 bg-zinc-950 min-w-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
            <div className="flex gap-1">
              <button onClick={() => setShowPreview(false)} className={`px-2 py-0.5 rounded text-[11px] transition-colors ${!showPreview ? "bg-zinc-800 text-zinc-300" : "text-zinc-600 hover:text-zinc-400"}`}>Console</button>
              {(lang === "html" || lang === "css") && (
                <button onClick={() => setShowPreview(true)} className={`px-2 py-0.5 rounded text-[11px] transition-colors ${showPreview ? "bg-zinc-800 text-zinc-300" : "text-zinc-600 hover:text-zinc-400"}`}>Preview</button>
              )}
            </div>
            <div className="flex-1" />
            <button onClick={() => setOutput([])} className="text-zinc-600 hover:text-zinc-400 text-[10px]">Clear</button>
          </div>

          {showPreview && (lang === "html" || lang === "css") ? (
            <iframe ref={iframeRef} srcDoc={previewHtml} sandbox="allow-scripts" className="flex-1 bg-white" title="preview" />
          ) : (
            <div className="flex-1 overflow-auto p-4 font-mono text-sm" style={{ fontSize: `${settings.fontSize - 1}px` }}>
              {output.length === 0 ? (
                <div className="text-zinc-700 text-center py-8">
                  <Terminal size={24} className="mx-auto mb-2 text-zinc-800" />
                  <div className="text-xs">
                    <>Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 mx-0.5">Run</kbd> or <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 mx-0.5">Ctrl+Enter</kbd> to execute<br/><span className="text-zinc-800 mt-1 block">Auto-detects Python, HTML, CSS. Strips imports/types for JS/TS.</span></>
                  </div>
                </div>
              ) : (
                output.map((line, i) => (
                  <div key={i} className={`leading-relaxed ${line.startsWith("ERROR") ? "text-red-400" : line.startsWith("✓") ? "text-green-400" : "text-zinc-300"}`}>{line}</div>
                ))
              )}
            </div>
          )}

          {/* AI Review / Explanation results */}
          {(reviewResult || explanation) && (
            <div className="border-t border-zinc-800 max-h-[40%] overflow-auto">
              <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 sticky top-0">
                <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                  {reviewResult ? <><Scan size={11} /> AI Review</> : <><Brain size={11} /> Explanation</>}
                </span>
                <button onClick={() => { setReviewResult(null); setExplanation(null); }} className="text-zinc-600 hover:text-zinc-400"><X size={12} /></button>
              </div>
              <div className="p-3 text-xs text-zinc-300 markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{reviewResult || explanation || ""}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Terminal Panel */}
      {showTerminal && (
        <div className="h-48 border-t border-zinc-800 bg-zinc-950 flex flex-col">
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border-b border-zinc-800">
            <Terminal size={11} className="text-green-400" />
            <span className="text-[10px] text-zinc-400 font-medium">Terminal</span>
            <div className="flex-1" />
            <button onClick={() => setTerminalHistory([])} className="text-[9px] text-zinc-600 hover:text-zinc-400">Clear</button>
            <button onClick={() => setShowTerminal(false)} className="text-zinc-600 hover:text-zinc-400"><X size={11} /></button>
          </div>
          <div ref={termScrollRef} className="flex-1 overflow-auto p-2 font-mono text-[11px]">
            {terminalHistory.length === 0 && (
              <div className="text-zinc-700 text-[10px]">Terminal ready. Type commands below (ls, pwd, node -v, python3 --version, etc.)</div>
            )}
            {terminalHistory.map((h, i) => (
              <div key={i} className="mb-2">
                <div className="text-green-400 flex items-center gap-1"><span className="text-blue-400">$</span> {h.cmd}</div>
                {h.out && <div className="text-zinc-300 whitespace-pre-wrap">{h.out}</div>}
                {h.err && <div className="text-red-400 whitespace-pre-wrap">{h.err}</div>}
              </div>
            ))}
            {termRunning && <div className="text-yellow-500 animate-pulse">Running...</div>}
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-zinc-900 border-t border-zinc-800">
            <span className="text-green-400 text-xs font-mono">$</span>
            <input ref={termInputRef} value={termCmd} onChange={e => setTermCmd(e.target.value)}
              className="flex-1 bg-transparent text-zinc-200 text-xs font-mono focus:outline-none placeholder:text-zinc-700"
              placeholder="Type a command..." data-testid="input-terminal"
              onKeyDown={e => {
                if (e.key === "Enter") runTerminalCmd();
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  const newIdx = historyIdx < cmdHistory.length - 1 ? historyIdx + 1 : historyIdx;
                  setHistoryIdx(newIdx);
                  if (cmdHistory[cmdHistory.length - 1 - newIdx]) setTermCmd(cmdHistory[cmdHistory.length - 1 - newIdx]);
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  const newIdx = historyIdx > 0 ? historyIdx - 1 : -1;
                  setHistoryIdx(newIdx);
                  setTermCmd(newIdx >= 0 && cmdHistory[cmdHistory.length - 1 - newIdx] ? cmdHistory[cmdHistory.length - 1 - newIdx] : "");
                }
              }} />
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-0.5 bg-zinc-900 border-t border-zinc-800 text-[9px] text-zinc-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            {langInfo && <langInfo.icon size={9} className={langInfo.color} />} {langInfo.name}
          </span>
          <span>Ln {code.substring(0, textareaRef.current?.selectionStart || 0).split("\n").length}</span>
          <span>{(new Blob([code]).size / 1024).toFixed(1)} KB</span>
          <span className={`px-1 py-0.5 rounded ${execMode === "server" ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"}`}>
            {execMode === "server" ? "Server" : "Browser"}
          </span>
          {activeProject && <span className="text-blue-400">{activeProject.name}/{activeFile}</span>}
        </div>
        <div className="flex items-center gap-3">
          <span>Ctrl+Enter run</span>
          <span>Ctrl+S save</span>
          <span className="text-zinc-500">My Ai Coder Playground</span>
        </div>
      </div>
    </div>
  );
}

// FUTURISTIC #5 - AI Code Converter (send to coder from playground)
// Built into the playground toolbar as "AI Fix" and accessible via the code chat

// ─── LAYOUT + PAGES + ROUTER ─────────────────────────────────────────────────

function Layout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  useEffect(() => { const c = () => setIsOpen(window.innerWidth >= 768); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);
  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <main className="flex-1 flex flex-col relative min-w-0 h-full">{children}</main>
    </div>
  );
}

function HomePage() { return <Layout><ChatInterface defaultType="general" /></Layout>; }
function CoderPage() { return <Layout><ChatInterface defaultType="coder" /></Layout>; }
function PlaygroundPage() { return <Layout><CodePlayground /></Layout>; }

function ChatViewPage() {
  const [, params] = useRoute("/chat/:id");
  const chatId = params?.id ? parseInt(params.id, 10) : undefined;
  const { data: chat } = useQuery<Chat>({
    queryKey: [api.chats.get.path, chatId],
    queryFn: async () => { const r = await fetch(buildUrl(api.chats.get.path, { id: chatId! })); if (!r.ok) throw new Error("Not found"); return r.json(); },
    enabled: !!chatId,
  });
  return <Layout><ChatInterface key={chatId} chatId={chatId} defaultType={(chat?.type as "general" | "coder") || "general"} /></Layout>;
}

function NotFound() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white shadow-lg border border-border/30 flex items-center justify-center p-1">
          <img src={logo} alt="404" className="w-full h-full object-cover rounded-xl" />
        </div>
        <h1 className="text-5xl font-extrabold text-foreground mb-2">404</h1>
        <p className="text-muted-foreground mb-6">This page doesn't exist</p>
        <Link href="/" data-testid="link-go-home" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all">Go Home</Link>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/coder" component={CoderPage} />
      <Route path="/playground" component={PlaygroundPage} />
      <Route path="/chat/:id" component={ChatViewPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const [settings, setSettings] = useState<CoderSettings>(() => {
    try { const s = localStorage.getItem("coderSettings"); return s ? { ...defaultSettings, ...JSON.parse(s) } : defaultSettings; } catch { return defaultSettings; }
  });
  const set = useCallback((partial: Partial<CoderSettings>) => {
    setSettings(prev => { const next = { ...prev, ...partial }; localStorage.setItem("coderSettings", JSON.stringify(next)); return next; });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); window.location.href = "/"; }
      if ((e.metaKey || e.ctrlKey) && e.key === "j") { e.preventDefault(); window.location.href = "/coder"; }
      if ((e.metaKey || e.ctrlKey) && e.key === "p") { e.preventDefault(); window.location.href = "/playground"; }
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <SettingsCtx.Provider value={{ settings, set }}>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <Router />
      </QueryClientProvider>
    </SettingsCtx.Provider>
  );
}
