import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Switch, Route, useLocation, useRoute, Link } from "wouter";
import { QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Send, MessageSquare, Code2, Plus, Trash2, PanelLeftClose, PanelLeftOpen,
  Copy, Check, Download, Sparkles, Zap, Bug, FileCode, Cpu, Terminal,
  BookOpen, Lightbulb, Wrench, Globe, ArrowDown, RotateCcw,
  Pencil, Search, X, Trash, FileDown, ThumbsUp, ThumbsDown,
  Clock, BarChart3, Wifi, WifiOff, Play, ChevronRight, Hash, Shield
} from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import type { Chat, Message } from "@shared/schema";
import logo from "@assets/MyAiGpt_1772000395528.webp";

// ─── HOOKS ───────────────────────────────────────────────────────────────────

function useChats() {
  return useQuery<Chat[]>({
    queryKey: [api.chats.list.path],
    queryFn: async () => {
      const res = await fetch(api.chats.list.path);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
}

function useMessages(chatId: number | null) {
  return useQuery<Message[]>({
    queryKey: [api.messages.list.path, chatId],
    queryFn: async () => {
      if (!chatId) return [];
      const res = await fetch(buildUrl(api.messages.list.path, { chatId }));
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!chatId,
  });
}

function useStats() {
  return useQuery<{ chatCount: number; messageCount: number; codeFiles: number; discordConnected: boolean }>({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      return res.json();
    },
    refetchInterval: 30000,
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

function getExt(lang: string) { return EXT_MAP[lang] || "txt"; }

function formatTime(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString();
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
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
  return (
    <button onClick={async () => {
      const fn = `code_${Date.now()}.${getExt(language)}`;
      try {
        await fetch("/api/save-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, filename: fn, language }) });
        setOk(true); toast({ title: "Saved to server", description: fn }); setTimeout(() => setOk(false), 3000);
      } catch { toast({ title: "Save failed", variant: "destructive" }); }
    }} data-testid="button-save-code" className="p-1 rounded hover:bg-white/10 transition-colors" title="Save to server">
      {ok ? <Check size={14} className="text-green-400" /> : <Download size={14} className="text-zinc-400" />}
    </button>
  );
}

function DlBtn({ code, language }: { code: string; language: string }) {
  return (
    <button onClick={() => {
      const blob = new Blob([code], { type: "text/plain" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = `code_${Date.now()}.${getExt(language)}`; a.click();
    }} data-testid="button-download-code" className="p-1 rounded hover:bg-white/10 transition-colors" title="Download">
      <FileCode size={14} className="text-zinc-400" />
    </button>
  );
}

// #1 - Live HTML/CSS/JS Preview
function RunBtn({ code, language }: { code: string; language: string }) {
  const [show, setShow] = useState(false);
  if (!["html", "javascript", "css"].includes(language)) return null;
  const html = language === "html" ? code : language === "javascript" ? `<html><body><script>${code}<\/script><pre id="out"></pre></body></html>` : `<html><head><style>${code}</style></head><body><div class="demo">Styled Preview</div></body></html>`;
  return (
    <>
      <button onClick={() => setShow(!show)} className="p-1 rounded hover:bg-white/10 transition-colors" title="Run preview">
        <Play size={14} className="text-emerald-400" />
      </button>
      {show && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 border border-zinc-700 rounded-lg overflow-hidden bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-zinc-800 px-3 py-1.5">
            <span className="text-xs text-zinc-400">Live Preview</span>
            <button onClick={() => setShow(false)} className="text-zinc-400 hover:text-white"><X size={14} /></button>
          </div>
          <iframe srcDoc={html} sandbox="allow-scripts" className="w-full h-48 bg-white" title="preview" />
        </div>
      )}
    </>
  );
}

// ─── CHAT MESSAGE ────────────────────────────────────────────────────────────

function ChatMsg({ role, content, isThinking, isCoder, timestamp, onRetry }: {
  role: string; content: string; isThinking?: boolean; isCoder?: boolean; timestamp?: string; onRetry?: () => void;
}) {
  const isUser = role === "user";
  // #2 - Message reactions
  const [reaction, setReaction] = useState<"up" | "down" | null>(null);
  // #3 - Copy full message
  const [msgCopied, setMsgCopied] = useState(false);

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
            {/* #4 - Timestamps */}
            {timestamp && <span className="text-[10px] text-muted-foreground/40">{formatTime(timestamp)}</span>}
          </div>
          <div className="text-foreground leading-relaxed markdown-body">
            {isThinking ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center h-6 gap-1.5">
                  <div className="w-2 h-2 bg-primary/50 rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-primary/50 rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-primary/50 rounded-full typing-dot" />
                </div>
                <span className="text-xs text-muted-foreground/50 animate-pulse">Thinking...</span>
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeStr = String(children).replace(/\n$/, "");
                    const lines = codeStr.split("\n").length;
                    return !inline && match ? (
                      <div className="my-3 rounded-xl overflow-hidden border border-zinc-800 relative">
                        <div className="bg-zinc-900 px-4 py-2 text-xs text-zinc-400 flex justify-between items-center border-b border-zinc-800">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-zinc-300">{match[1]}</span>
                            {/* #5 - Line count badge */}
                            <span className="bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded text-[10px]">{lines} lines</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CopyBtn text={codeStr} />
                            <SaveBtn code={codeStr} language={match[1]} />
                            <DlBtn code={codeStr} language={match[1]} />
                            {/* #1 - Run preview for HTML/JS/CSS */}
                            <RunBtn code={codeStr} language={match[1]} />
                          </div>
                        </div>
                        {/* #6 - Line numbers built into syntax highlighter */}
                        <SyntaxHighlighter
                          style={oneDark as any}
                          language={match[1]}
                          PreTag="div"
                          showLineNumbers={lines > 3}
                          lineNumberStyle={{ color: "#555", fontSize: "0.7rem", minWidth: "2em" }}
                          customStyle={{ margin: 0, padding: "1rem", background: "#1a1a2e", fontSize: "0.83rem" }}
                          {...props}
                        >
                          {codeStr}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border/40" {...props}>{children}</code>
                    );
                  },
                  table({ children }: any) {
                    return <div className="overflow-x-auto my-3 rounded-lg border border-border"><table className="min-w-full text-sm">{children}</table></div>;
                  },
                  th({ children }: any) { return <th className="border-b border-border bg-muted/50 px-3 py-2 text-left font-semibold text-xs uppercase tracking-wider">{children}</th>; },
                  td({ children }: any) { return <td className="border-b border-border/50 px-3 py-2">{children}</td>; },
                }}
              >
                {content}
              </ReactMarkdown>
            )}
          </div>
          {/* #2 - Reactions + #3 Copy message + #7 Retry button */}
          {!isUser && !isThinking && content && (
            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { navigator.clipboard.writeText(content); setMsgCopied(true); setTimeout(() => setMsgCopied(false), 2000); }}
                className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground/50 hover:text-foreground transition-colors" title="Copy message">
                {msgCopied ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button onClick={() => setReaction(reaction === "up" ? null : "up")}
                className={`p-1.5 rounded-md hover:bg-muted/50 transition-colors ${reaction === "up" ? "text-green-500" : "text-muted-foreground/50 hover:text-foreground"}`}>
                <ThumbsUp size={14} />
              </button>
              <button onClick={() => setReaction(reaction === "down" ? null : "down")}
                className={`p-1.5 rounded-md hover:bg-muted/50 transition-colors ${reaction === "down" ? "text-red-500" : "text-muted-foreground/50 hover:text-foreground"}`}>
                <ThumbsDown size={14} />
              </button>
              {onRetry && (
                <button onClick={onRetry} className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground/50 hover:text-foreground transition-colors" title="Regenerate">
                  <RotateCcw size={14} />
                </button>
              )}
              {/* #8 - Word count */}
              <span className="text-[10px] text-muted-foreground/30 ml-2">{wordCount(content)} words</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CHAT INPUT ──────────────────────────────────────────────────────────────

function ChatInput({ onSend, disabled, placeholder, isCoder }: { onSend: (msg: string) => void; disabled?: boolean; placeholder?: string; isCoder?: boolean }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // #9 - Input history (up/down arrow)
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  // #10 - Character count
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
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
    if (e.key === "ArrowUp" && !value && history.length > 0) {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setValue(history[next]);
    }
    if (e.key === "ArrowDown" && histIdx >= 0) {
      e.preventDefault();
      const next = histIdx - 1;
      setHistIdx(next);
      setValue(next >= 0 ? history[next] : "");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-3xl w-full mx-auto" data-testid="form-chat-input">
      <div className="relative flex items-end p-2 bg-white border border-border/60 rounded-2xl shadow-lg focus-within:shadow-xl focus-within:border-primary/20 transition-all">
        <textarea
          ref={textareaRef} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={handleKey}
          placeholder={placeholder} disabled={disabled} data-testid="input-message"
          className="w-full max-h-[200px] min-h-[44px] bg-transparent border-0 resize-none py-2.5 pl-3 pr-14 focus:ring-0 focus:outline-none scrollbar-hide text-base leading-relaxed placeholder:text-muted-foreground/50"
          rows={1}
        />
        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          {/* #10 - Char count */}
          {charCount > 0 && <span className="text-[10px] text-muted-foreground/40 tabular-nums">{charCount}</span>}
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
        {/* #11 - Keyboard shortcut hint */}
        <span className="text-[10px] text-muted-foreground/20">|</span>
        <span className="text-[10px] text-muted-foreground/30">Enter to send</span>
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

const CODER_SUGGESTIONS = [
  { icon: Code2, text: "Build a complete REST API with Node.js, Express, and PostgreSQL", color: "text-blue-500", cat: "Backend" },
  { icon: Bug, text: "Debug and fix this code for me", color: "text-red-500", cat: "Debug" },
  { icon: Terminal, text: "Write a Python web scraper with BeautifulSoup", color: "text-green-500", cat: "Python" },
  { icon: Cpu, text: "Create a React dashboard with real-time charts", color: "text-purple-500", cat: "Frontend" },
  { icon: Wrench, text: "Optimize this SQL query and explain the execution plan", color: "text-orange-500", cat: "Database" },
  { icon: Zap, text: "Build a full-stack TypeScript app with authentication", color: "text-cyan-500", cat: "Full Stack" },
  { icon: FileCode, text: "Write comprehensive unit tests for this function", color: "text-indigo-500", cat: "Testing" },
  { icon: Hash, text: "Create a Dockerfile and docker-compose for my project", color: "text-teal-500", cat: "DevOps" },
];

// ─── SCROLL TO BOTTOM BUTTON (#12) ──────────────────────────────────────────

function ScrollBtn({ scrollRef }: { scrollRef: React.RefObject<HTMLDivElement> }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShow(gap > 200);
    };
    el.addEventListener("scroll", check);
    return () => el.removeEventListener("scroll", check);
  }, [scrollRef]);
  if (!show) return null;
  return (
    <button onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })}
      data-testid="button-scroll-bottom"
      className="absolute bottom-44 right-6 z-30 p-2.5 bg-white border border-border/50 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
      <ArrowDown size={16} />
    </button>
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
  // #13 - Error state with retry
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastFailedMsg, setLastFailedMsg] = useState<string | null>(null);

  const isCoder = defaultType === "coder";
  const isEmpty = messages.length === 0 && localMessages.length === 0;

  // #14 - Dynamic page title
  useEffect(() => {
    document.title = isCoder ? "My Ai Coder - Quantum Pulse Intelligence" : "My Ai Gpt - Quantum Pulse Intelligence";
  }, [isCoder]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, localMessages, isThinking]);

  const handleSend = useCallback(async (content: string) => {
    let targetChatId = chatId;
    setLocalMessages((prev) => [...prev, { role: "user", content }]);
    setIsThinking(true);
    setLastError(null);
    setLastFailedMsg(null);

    try {
      if (!targetChatId) {
        const res = await fetch(api.chats.create.path, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: content.slice(0, 40), type: defaultType }),
        });
        if (!res.ok) throw new Error("Failed to create chat");
        const newChat = await res.json();
        targetChatId = newChat.id;
        qc.invalidateQueries({ queryKey: [api.chats.list.path] });
      }

      const res = await fetch(buildUrl(api.messages.create.path, { chatId: targetChatId }), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      if (!chatId) {
        setLocation(`/chat/${targetChatId}`);
      } else {
        qc.invalidateQueries({ queryKey: [api.messages.list.path, chatId] });
        setLocalMessages([]);
      }
    } catch (error: any) {
      setLastError(error.message);
      setLastFailedMsg(content);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLocalMessages(prev => prev.filter(m => m.content !== content));
    } finally {
      setIsThinking(false);
    }
  }, [chatId, defaultType, qc, setLocation, toast]);

  // #7 - Regenerate last response
  const handleRegenerate = useCallback(async () => {
    if (!chatId || messages.length < 2) return;
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    if (lastUserMsg) {
      setIsThinking(true);
      try {
        const res = await fetch(buildUrl(api.messages.create.path, { chatId }), {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: lastUserMsg.content }),
        });
        if (!res.ok) throw new Error("Failed");
        qc.invalidateQueries({ queryKey: [api.messages.list.path, chatId] });
      } catch {
        toast({ title: "Regeneration failed", variant: "destructive" });
      } finally {
        setIsThinking(false);
      }
    }
  }, [chatId, messages, qc, toast]);

  // #15 - Export conversation
  const handleExport = useCallback(async () => {
    if (!chatId) return;
    try {
      const res = await fetch(`/api/chats/${chatId}/export`, { method: "POST" });
      const text = await res.text();
      const blob = new Blob([text], { type: "text/markdown" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = `chat_${chatId}.md`; a.click();
      toast({ title: "Conversation exported!" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  }, [chatId, toast]);

  const allMessages = [...messages, ...localMessages];
  const suggestions = isCoder ? CODER_SUGGESTIONS : GENERAL_SUGGESTIONS;

  return (
    <div className="flex flex-col h-full w-full relative bg-background">
      {/* #16 - Top bar with chat info */}
      {chatId && messages.length > 0 && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/30 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCoder ? <Code2 size={14} className="text-blue-500" /> : <MessageSquare size={14} className="text-muted-foreground" />}
            <span className="text-sm font-medium text-foreground/80 truncate max-w-[200px]">
              {isCoder ? "My Ai Coder" : "My Ai Gpt"}
            </span>
            <span className="text-xs text-muted-foreground/40">{messages.length} messages</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleExport} className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground/50 hover:text-foreground transition-colors" title="Export chat" data-testid="button-export">
              <FileDown size={14} />
            </button>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto w-full scroll-smooth pt-4 pb-40">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            {/* #17 - Animated welcome */}
            <div className="w-20 h-20 rounded-2xl bg-white shadow-xl border border-border/20 flex items-center justify-center mb-6 p-1.5 animate-[bounce_3s_ease-in-out_1]">
              <img src={logo} alt="My Ai" className="w-full h-full object-cover rounded-xl" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2" data-testid="text-welcome-title">
              {isCoder ? "My Ai Coder" : "My Ai Gpt"}
            </h1>
            <p className="text-muted-foreground max-w-lg mb-2" data-testid="text-welcome-subtitle">
              {isCoder
                ? "Your S-class programming assistant. I write, debug, optimize, test, and deploy code in every language."
                : "Your world-class intelligent assistant. Ask me anything."}
            </p>
            {isCoder && (
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full"><Zap size={10} /> Auto-Save</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full"><Play size={10} /> Live Preview</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full"><Code2 size={10} /> 20+ Languages</span>
              </div>
            )}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${isCoder ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-2.5 mt-2 max-w-4xl w-full`}>
              {suggestions.map((s, i) => (
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
          </div>
        ) : (
          <div className="flex flex-col pt-10">
            {allMessages.map((msg, i) => (
              <ChatMsg
                key={i} role={msg.role} content={msg.content} isCoder={isCoder}
                timestamp={(msg as any).createdAt}
                onRetry={msg.role === "assistant" && i === allMessages.length - 1 ? handleRegenerate : undefined}
              />
            ))}
            {isThinking && <ChatMsg role="assistant" content="" isThinking isCoder={isCoder} />}
            {/* #13 - Error retry */}
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

      {/* #12 - Scroll to bottom */}
      <ScrollBtn scrollRef={scrollRef as React.RefObject<HTMLDivElement>} />

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-4 px-4 md:px-8">
        <ChatInput
          onSend={handleSend} disabled={isThinking} isCoder={isCoder}
          placeholder={isCoder ? "Ask My Ai Coder to write, debug, or explain code..." : "Message My Ai Gpt..."}
        />
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
  // #18 - Search chats
  const [searchQuery, setSearchQuery] = useState("");
  // #19 - Rename chat
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;
    return chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [chats, searchQuery]);

  // #20 - Group chats by date
  const groupedChats = useMemo(() => {
    const today: Chat[] = [];
    const week: Chat[] = [];
    const older: Chat[] = [];
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

  // #21 - Clear all chats
  const handleClearAll = async () => {
    if (!confirm("Delete ALL chats? This cannot be undone.")) return;
    await fetch("/api/chats", { method: "DELETE" });
    qc.invalidateQueries({ queryKey: [api.chats.list.path] });
    setLocation("/");
    toast({ title: "All chats cleared" });
  };

  // #19 - Rename
  const handleRename = async (id: number) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    await fetch(`/api/chats/${id}/rename`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: renameValue }) });
    qc.invalidateQueries({ queryKey: [api.chats.list.path] });
    setRenamingId(null);
    toast({ title: "Chat renamed" });
  };

  const renderChatGroup = (title: string, items: Chat[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-3">
        <div className="text-[10px] font-bold text-muted-foreground/40 mb-1 px-3 tracking-widest uppercase">{title}</div>
        {items.map((chat) => (
          <div key={chat.id} className="relative group" data-testid={`chat-item-${chat.id}`}>
            {renamingId === chat.id ? (
              <div className="flex items-center gap-1 px-2 py-1">
                <input value={renameValue} onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleRename(chat.id); if (e.key === "Escape") setRenamingId(null); }}
                  className="flex-1 text-xs bg-white border border-border rounded-md px-2 py-1.5 focus:outline-none focus:border-primary/30" autoFocus
                />
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
                  <button onClick={() => { setRenamingId(chat.id); setRenameValue(chat.title); }}
                    className="p-1 text-muted-foreground hover:text-foreground rounded" title="Rename" data-testid={`button-rename-${chat.id}`}>
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => handleDelete(chat.id)}
                    className="p-1 text-muted-foreground hover:text-red-500 rounded" title="Delete" data-testid={`button-delete-chat-${chat.id}`}>
                    <Trash2 size={12} />
                  </button>
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
        {/* Header */}
        <div className="p-3 flex items-center justify-between border-b border-border/20">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <img src={logo} alt="My Ai Gpt" className="w-7 h-7 rounded-full shadow-sm bg-white" />
            <div className="leading-none">
              <span className="font-bold text-sm text-foreground block">My Ai Gpt</span>
              <span className="text-[9px] text-muted-foreground/60">Beta Release 1</span>
            </div>
          </Link>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-1.5 text-muted-foreground rounded-lg" data-testid="button-close-sidebar">
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* Nav Links */}
        <div className="px-2.5 py-2 space-y-1">
          <Link href="/" data-testid="link-general-chat"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/" ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/" ? "bg-primary/10" : "bg-muted/50"}`}>
              <MessageSquare size={14} className={location === "/" ? "text-primary" : ""} />
            </div>
            <span className="flex-1">My Ai Gpt</span>
            <Plus size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
          </Link>
          <Link href="/coder" data-testid="link-coder-chat"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/coder" ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/coder" ? "bg-blue-500/15" : "bg-blue-500/5"}`}>
              <Code2 size={14} className="text-blue-600" />
            </div>
            <span className="flex-1">My Ai Coder</span>
            <Plus size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
          </Link>
        </div>

        {/* #18 - Search */}
        <div className="px-2.5 py-1">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chats..." data-testid="input-search-chats"
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-border/30 rounded-lg focus:outline-none focus:border-primary/20 placeholder:text-muted-foreground/30"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2 scrollbar-hide">
          {isLoading ? (
            <div className="space-y-2 px-2">{[1, 2, 3].map(i => <div key={i} className="h-8 bg-black/5 rounded-lg animate-pulse" />)}</div>
          ) : filteredChats.length === 0 ? (
            <div className="px-3 py-8 text-xs text-muted-foreground/50 text-center">
              {searchQuery ? "No matching chats" : "No chats yet. Start a conversation!"}
            </div>
          ) : (
            <>
              {renderChatGroup("Today", groupedChats.today)}
              {renderChatGroup("This Week", groupedChats.week)}
              {renderChatGroup("Older", groupedChats.older)}
            </>
          )}
        </div>

        {/* #22 - Stats footer + #21 Clear all */}
        <div className="p-2.5 border-t border-border/20 space-y-2">
          {chats.length > 0 && (
            <button onClick={handleClearAll} data-testid="button-clear-all"
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash size={11} /> Clear All Chats
            </button>
          )}
          {/* #23 - Connection status */}
          <div className="flex items-center justify-between px-2 text-[9px] text-muted-foreground/40">
            <div className="flex items-center gap-1">
              {stats?.discordConnected ? <Wifi size={9} className="text-green-400" /> : <WifiOff size={9} className="text-red-400" />}
              <span>{stats?.discordConnected ? "Connected" : "Offline"}</span>
            </div>
            {/* #24 - Chat/message count */}
            <div className="flex items-center gap-2">
              <span>{stats?.chatCount || 0} chats</span>
              <span>{stats?.messageCount || 0} msgs</span>
              {stats?.codeFiles ? <span>{stats.codeFiles} codes</span> : null}
            </div>
          </div>
          {/* #25 - Branding */}
          <div className="text-[9px] text-center text-muted-foreground/30 font-medium tracking-wide">
            Quantum Pulse Intelligence
          </div>
        </div>
      </div>

      {!isOpen && (
        <button onClick={() => setIsOpen(true)} data-testid="button-open-sidebar"
          className="fixed top-4 left-4 z-40 p-2.5 bg-white border border-border/30 rounded-xl shadow-sm hover:shadow-md transition-all">
          <PanelLeftOpen size={16} />
        </button>
      )}
    </>
  );
}

// ─── LAYOUT + PAGES + ROUTER ─────────────────────────────────────────────────

function Layout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  useEffect(() => {
    const check = () => setIsOpen(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <main className="flex-1 flex flex-col relative min-w-0 h-full">{children}</main>
    </div>
  );
}

function HomePage() { return <Layout><ChatInterface defaultType="general" /></Layout>; }
function CoderPage() { return <Layout><ChatInterface defaultType="coder" /></Layout>; }

function ChatViewPage() {
  const [, params] = useRoute("/chat/:id");
  const chatId = params?.id ? parseInt(params.id, 10) : undefined;
  const { data: chat } = useQuery<Chat>({
    queryKey: [api.chats.get.path, chatId],
    queryFn: async () => { const res = await fetch(buildUrl(api.chats.get.path, { id: chatId! })); if (!res.ok) throw new Error("Not found"); return res.json(); },
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
        <Link href="/" data-testid="link-go-home" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all">
          Go Home
        </Link>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/coder" component={CoderPage} />
      <Route path="/chat/:id" component={ChatViewPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  // #25 - Keyboard shortcut: Ctrl+K for new chat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        window.location.href = "/";
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}
