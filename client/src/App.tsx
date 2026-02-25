import { useState, useEffect, useRef, useCallback } from "react";
import { Switch, Route, useLocation, useRoute, Link } from "wouter";
import { QueryClientProvider, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Send, MessageSquare, Code2, Plus, Trash2, PanelLeftClose, PanelLeftOpen,
  Copy, Check, Download, Sparkles, Zap, Bug, FileCode, Cpu, Terminal,
  BookOpen, Lightbulb, Wrench, Search, Globe, ChevronDown
} from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import type { Chat, Message } from "@shared/schema";
import logo from "@assets/MyAiGpt_1772000395528.webp";

function useChats() {
  return useQuery<Chat[]>({
    queryKey: [api.chats.list.path],
    queryFn: async () => {
      const res = await fetch(api.chats.list.path);
      if (!res.ok) throw new Error("Failed to fetch chats");
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
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!chatId,
  });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} data-testid="button-copy-code" className="p-1 rounded hover:bg-white/10 transition-colors" title="Copy code">
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-zinc-400" />}
    </button>
  );
}

function SaveCodeButton({ code, language }: { code: string; language: string }) {
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();
  const handleSave = async () => {
    const ext = ({ python: "py", javascript: "js", typescript: "ts", java: "java", cpp: "cpp", c: "c", html: "html", css: "css", sql: "sql", rust: "rs", go: "go", bash: "sh", shell: "sh" } as Record<string, string>)[language] || "txt";
    const filename = `code_${Date.now()}.${ext}`;
    try {
      await fetch("/api/save-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, filename, language }),
      });
      setSaved(true);
      toast({ title: "Code saved!", description: `Saved as ${filename}` });
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast({ title: "Save failed", description: "Could not save the code.", variant: "destructive" });
    }
  };
  return (
    <button onClick={handleSave} data-testid="button-save-code" className="p-1 rounded hover:bg-white/10 transition-colors" title="Save code to server">
      {saved ? <Check size={14} className="text-green-400" /> : <Download size={14} className="text-zinc-400" />}
    </button>
  );
}

function DownloadButton({ code, language }: { code: string; language: string }) {
  const handleDownload = () => {
    const ext = ({ python: "py", javascript: "js", typescript: "ts", java: "java", cpp: "cpp", html: "html", css: "css", sql: "sql", rust: "rs", go: "go" } as Record<string, string>)[language] || "txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button onClick={handleDownload} data-testid="button-download-code" className="p-1 rounded hover:bg-white/10 transition-colors" title="Download code">
      <FileCode size={14} className="text-zinc-400" />
    </button>
  );
}

function ChatMessageComponent({ role, content, isThinking, isCoder }: { role: string; content: string; isThinking?: boolean; isCoder?: boolean }) {
  const isUser = role === "user";
  return (
    <div data-testid={`message-${role}`} className={`py-5 px-4 md:px-8 w-full flex justify-center transition-colors ${isUser ? "bg-transparent" : "bg-muted/20"}`}>
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
          <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            {isUser ? "You" : isCoder ? "My Ai Coder" : "My Ai Gpt"}
          </div>
          <div className="text-foreground leading-relaxed markdown-body">
            {isThinking ? (
              <div className="flex items-center h-6 gap-1.5">
                <div className="w-2 h-2 bg-primary/50 rounded-full typing-dot" />
                <div className="w-2 h-2 bg-primary/50 rounded-full typing-dot" />
                <div className="w-2 h-2 bg-primary/50 rounded-full typing-dot" />
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeStr = String(children).replace(/\n$/, "");
                    return !inline && match ? (
                      <div className="my-3 rounded-xl overflow-hidden border border-zinc-800">
                        <div className="bg-zinc-900 px-4 py-2 text-xs text-zinc-400 flex justify-between items-center border-b border-zinc-800">
                          <span className="font-mono">{match[1]}</span>
                          <div className="flex items-center gap-1">
                            <CopyButton text={codeStr} />
                            <SaveCodeButton code={codeStr} language={match[1]} />
                            <DownloadButton code={codeStr} language={match[1]} />
                          </div>
                        </div>
                        <SyntaxHighlighter
                          style={oneDark as any}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ margin: 0, padding: "1rem", background: "#1a1a2e", fontSize: "0.85rem" }}
                          {...props}
                        >
                          {codeStr}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border/40" {...props}>
                        {children}
                      </code>
                    );
                  },
                  table({ children }: any) {
                    return <div className="overflow-x-auto my-3"><table className="min-w-full border border-border rounded-lg text-sm">{children}</table></div>;
                  },
                  th({ children }: any) {
                    return <th className="border border-border bg-muted px-3 py-2 text-left font-semibold">{children}</th>;
                  },
                  td({ children }: any) {
                    return <td className="border border-border px-3 py-2">{children}</td>;
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatInput({ onSend, disabled, placeholder }: { onSend: (msg: string) => void; disabled?: boolean; placeholder?: string }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-3xl w-full mx-auto" data-testid="form-chat-input">
      <div className="relative flex items-end p-2 bg-white border border-border/60 rounded-2xl shadow-lg focus-within:shadow-xl focus-within:border-primary/20 transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          placeholder={placeholder}
          disabled={disabled}
          data-testid="input-message"
          className="w-full max-h-[200px] min-h-[44px] bg-transparent border-0 resize-none py-2.5 pl-3 pr-14 focus:ring-0 focus:outline-none scrollbar-hide text-base leading-relaxed placeholder:text-muted-foreground/60"
          rows={1}
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          data-testid="button-send"
          className={`absolute right-3 bottom-3 p-2.5 rounded-xl flex items-center justify-center transition-all ${value.trim() && !disabled ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
        >
          <Send size={16} strokeWidth={2.5} />
        </button>
      </div>
      <div className="text-center mt-2 text-[11px] text-muted-foreground/60">
        My Ai Gpt Beta Release 1 - Powered by Quantum Pulse Intelligence
      </div>
    </form>
  );
}

const GENERAL_SUGGESTIONS = [
  { icon: Sparkles, text: "Explain quantum computing simply", color: "text-amber-500" },
  { icon: Globe, text: "What are the latest tech trends?", color: "text-blue-500" },
  { icon: Lightbulb, text: "Give me 5 startup ideas for 2026", color: "text-yellow-500" },
  { icon: BookOpen, text: "Summarize the history of AI", color: "text-purple-500" },
];

const CODER_SUGGESTIONS = [
  { icon: Code2, text: "Build a REST API with Node.js and Express", color: "text-blue-500" },
  { icon: Bug, text: "Debug this Python script for me", color: "text-red-500" },
  { icon: Terminal, text: "Write a Bash script to automate backups", color: "text-green-500" },
  { icon: Cpu, text: "Create a React dashboard with charts", color: "text-purple-500" },
  { icon: Wrench, text: "Optimize this SQL query for performance", color: "text-orange-500" },
  { icon: Zap, text: "Build a WebSocket chat server in TypeScript", color: "text-cyan-500" },
];

function ChatInterface({ chatId, defaultType = "general" }: { chatId?: number; defaultType?: "general" | "coder" }) {
  const [, setLocation] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: messages = [] } = useMessages(chatId || null);
  const [localMessages, setLocalMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isThinking, setIsThinking] = useState(false);

  const isCoder = defaultType === "coder";
  const isEmpty = messages.length === 0 && localMessages.length === 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, localMessages, isThinking]);

  const handleSend = useCallback(async (content: string) => {
    let targetChatId = chatId;
    setLocalMessages((prev) => [...prev, { role: "user", content }]);
    setIsThinking(true);

    try {
      if (!targetChatId) {
        const res = await fetch(api.chats.create.path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: content.slice(0, 40), type: defaultType }),
        });
        if (!res.ok) throw new Error("Failed to create chat");
        const newChat = await res.json();
        targetChatId = newChat.id;
        qc.invalidateQueries({ queryKey: [api.chats.list.path] });
      }

      const res = await fetch(buildUrl(api.messages.create.path, { chatId: targetChatId }), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      if (!chatId) {
        setLocation(`/chat/${targetChatId}`);
      } else {
        qc.invalidateQueries({ queryKey: [api.messages.list.path, chatId] });
        setLocalMessages([]);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send message.", variant: "destructive" });
      setLocalMessages([]);
    } finally {
      setIsThinking(false);
    }
  }, [chatId, defaultType, qc, setLocation, toast]);

  const allMessages = [...messages, ...localMessages];
  const suggestions = isCoder ? CODER_SUGGESTIONS : GENERAL_SUGGESTIONS;

  return (
    <div className="flex flex-col h-full w-full relative bg-background">
      <div ref={scrollRef} className="flex-1 overflow-y-auto w-full scroll-smooth pt-4 pb-36">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-xl border border-border/30 flex items-center justify-center mb-6 p-1.5">
              <img src={logo} alt="My Ai" className="w-full h-full object-cover rounded-xl" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="text-welcome-title">
              {isCoder ? "My Ai Coder" : "My Ai Gpt"}
            </h1>
            <p className="text-muted-foreground max-w-lg mb-1" data-testid="text-welcome-subtitle">
              {isCoder
                ? "Your elite programming assistant. I write, debug, optimize, and explain code in any language."
                : "Your intelligent assistant. Ask me anything - I'm here to help."}
            </p>
            {isCoder && (
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-8">
                <Zap size={12} /> All generated code is auto-saved to the server
              </span>
            )}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${isCoder ? "lg:grid-cols-3" : ""} gap-3 mt-4 max-w-3xl w-full`}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s.text)}
                  data-testid={`button-suggestion-${i}`}
                  className="p-4 text-sm text-left border border-border/40 rounded-xl bg-white hover:bg-muted/30 hover:shadow-md transition-all group"
                >
                  <s.icon size={18} className={`mb-2 ${s.color} group-hover:scale-110 transition-transform`} />
                  <span className="text-foreground/80 group-hover:text-foreground">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {allMessages.map((msg, i) => (
              <ChatMessageComponent key={i} role={msg.role} content={msg.content} isCoder={isCoder} />
            ))}
            {isThinking && <ChatMessageComponent role="assistant" content="" isThinking isCoder={isCoder} />}
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-4 px-4 md:px-8">
        <ChatInput
          onSend={handleSend}
          disabled={isThinking}
          placeholder={isCoder ? "Ask My Ai Coder to write, debug, or explain code..." : "Message My Ai Gpt..."}
        />
      </div>
    </div>
  );
}

function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) {
  const [location] = useLocation();
  const { data: chats = [], isLoading } = useChats();
  const qc = useQueryClient();
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    try {
      await fetch(buildUrl(api.chats.delete.path, { id }), { method: "DELETE" });
      qc.invalidateQueries({ queryKey: [api.chats.list.path] });
    } catch {
      toast({ title: "Error", description: "Failed to delete chat", variant: "destructive" });
    }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsOpen(false)} />}
      <div className={`fixed md:relative inset-y-0 left-0 z-50 flex flex-col w-[280px] bg-[#fafafa] border-r border-border/40 transition-transform duration-300 h-[100dvh] ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-none"}`}>
        <div className="p-4 flex items-center justify-between border-b border-border/30">
          <Link href="/" className="flex items-center gap-2.5" data-testid="link-home">
            <img src={logo} alt="My Ai Gpt" className="w-8 h-8 rounded-full shadow-sm bg-white" />
            <div>
              <span className="font-bold text-sm text-foreground block leading-tight">My Ai Gpt</span>
              <span className="text-[10px] text-muted-foreground">Beta Release 1</span>
            </div>
          </Link>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-muted-foreground rounded-lg" data-testid="button-close-sidebar">
            <PanelLeftClose size={18} />
          </button>
        </div>

        <div className="px-3 py-3 space-y-1.5">
          <Link
            href="/"
            data-testid="link-general-chat"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/" ? "bg-white shadow-sm border border-border/40 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}
          >
            <div className="p-1.5 rounded-lg bg-primary/5">
              <MessageSquare size={16} className={location === "/" ? "text-primary" : ""} />
            </div>
            My Ai Gpt
            <Plus size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <Link
            href="/coder"
            data-testid="link-coder-chat"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/coder" ? "bg-white shadow-sm border border-border/40 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}
          >
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <Code2 size={16} className="text-blue-600" />
            </div>
            My Ai Coder
            <Plus size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-hide">
          <div className="text-[10px] font-bold text-muted-foreground/60 mb-2 px-3 tracking-widest uppercase">Recent</div>
          <div className="space-y-0.5">
            {isLoading ? (
              <div className="space-y-2 px-3">{[1, 2, 3].map(i => <div key={i} className="h-8 bg-black/5 rounded-lg animate-pulse" />)}</div>
            ) : chats.length === 0 ? (
              <div className="px-3 py-6 text-xs text-muted-foreground text-center">No chats yet. Start a conversation!</div>
            ) : (
              chats.map((chat) => (
                <div key={chat.id} className="relative group" data-testid={`chat-item-${chat.id}`}>
                  <Link
                    href={`/chat/${chat.id}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm pr-10 transition-all ${location === `/chat/${chat.id}` ? "bg-white shadow-sm border border-border/40 font-medium" : "text-foreground/60 hover:bg-black/5 hover:text-foreground"}`}
                  >
                    {chat.type === "coder" ? <Code2 size={13} className="flex-shrink-0 text-blue-500/60" /> : <MessageSquare size={13} className="flex-shrink-0 text-foreground/40" />}
                    <span className="truncate text-xs">{chat.title}</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(chat.id)}
                    data-testid={`button-delete-chat-${chat.id}`}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-3 border-t border-border/30">
          <div className="text-[10px] text-center text-muted-foreground/50">Quantum Pulse Intelligence</div>
        </div>
      </div>

      {!isOpen && (
        <button onClick={() => setIsOpen(true)} data-testid="button-open-sidebar" className="fixed top-4 left-4 z-40 p-2.5 bg-white border border-border/40 rounded-xl shadow-sm hover:shadow-md transition-all">
          <PanelLeftOpen size={18} />
        </button>
      )}
    </>
  );
}

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

function HomePage() {
  return <Layout><ChatInterface defaultType="general" /></Layout>;
}

function CoderPage() {
  return <Layout><ChatInterface defaultType="coder" /></Layout>;
}

function ChatViewPage() {
  const [, params] = useRoute("/chat/:id");
  const chatId = params?.id ? parseInt(params.id, 10) : undefined;
  const { data: chat } = useQuery<Chat>({
    queryKey: [api.chats.get.path, chatId],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.chats.get.path, { id: chatId! }));
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!chatId,
  });
  return (
    <Layout>
      <ChatInterface key={chatId} chatId={chatId} defaultType={(chat?.type as "general" | "coder") || "general"} />
    </Layout>
  );
}

function NotFound() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <p className="text-muted-foreground mb-6">Page not found</p>
        <Link href="/" className="text-primary underline" data-testid="link-go-home">Go Home</Link>
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
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}
