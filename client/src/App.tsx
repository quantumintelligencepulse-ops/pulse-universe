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
  SquareTerminal, LayoutPanelLeft, Eraser, RefreshCw, StopCircle,
  ExternalLink, CreditCard, Crown, Newspaper, MessageCircle, Clock, User, ChevronRight,
  Heart, Bookmark, Share2, Repeat2, MapPin, Calendar, Link2, AtSign, TrendingUp, Users, Camera, Image, Video, CheckCircle2, MoreHorizontal, Flag, UserPlus, UserMinus, Edit3,
  Volume2, VolumeX, Navigation, Bell, BellOff, Locate, ImagePlus, VideoIcon, Wand, Paintbrush, Aperture, PhoneCall
} from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import type { Chat, Message, FeedComment, SocialProfile, SocialPost, SocialComment } from "@shared/schema";
import logo from "@assets/MyAiGpt_1772000395528.webp";

const MESSAGE_LIMIT = 9;
const DISCORD_INVITE = "https://discord.gg/eVE9FvfPZ3";
const VIP_EMAILS = ["billyotucker@gmail.com", "quantumintelligencepulse@gmail.com"];

function updateSEO(config: { title?: string; description?: string; ogTitle?: string; ogDesc?: string; ogType?: string; ogImage?: string; canonical?: string; jsonLd?: object; keywords?: string; author?: string; articleSection?: string; publishedTime?: string }) {
  if (config.title) document.title = config.title;
  const setMeta = (attr: string, key: string, val: string) => {
    let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute("content", val);
  };
  if (config.description) {
    setMeta("name", "description", config.description);
    setMeta("name", "dc.description", config.description);
    setMeta("itemprop", "description", config.description);
  }
  if (config.ogTitle) {
    setMeta("property", "og:title", config.ogTitle);
    setMeta("name", "twitter:title", config.ogTitle);
    setMeta("itemprop", "name", config.ogTitle);
    setMeta("name", "dc.title", config.ogTitle);
  }
  if (config.ogDesc) {
    setMeta("property", "og:description", config.ogDesc);
    setMeta("name", "twitter:description", config.ogDesc);
  }
  if (config.ogType) setMeta("property", "og:type", config.ogType);
  if (config.ogImage) {
    setMeta("property", "og:image", config.ogImage);
    setMeta("property", "og:image:secure_url", config.ogImage);
    setMeta("name", "twitter:image", config.ogImage);
    setMeta("itemprop", "image", config.ogImage);
  }
  if (config.keywords) setMeta("name", "keywords", config.keywords);
  if (config.author) {
    setMeta("name", "author", config.author);
    setMeta("property", "article:author", config.author);
    setMeta("name", "dc.creator", config.author);
  }
  if (config.articleSection) setMeta("property", "article:section", config.articleSection);
  if (config.publishedTime) setMeta("property", "article:published_time", config.publishedTime);
  if (config.canonical) {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) { link = document.createElement("link"); link.setAttribute("rel", "canonical"); document.head.appendChild(link); }
    link.setAttribute("href", config.canonical);
    setMeta("property", "og:url", config.canonical);
  }
  if (config.jsonLd) {
    let script = document.getElementById("dynamic-jsonld") as HTMLScriptElement;
    if (!script) { script = document.createElement("script"); script.id = "dynamic-jsonld"; script.type = "application/ld+json"; document.head.appendChild(script); }
    script.textContent = JSON.stringify(config.jsonLd);
  }
}

function getUserId(): string {
  let uid = localStorage.getItem("myaigpt_user_id");
  if (!uid) { uid = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; localStorage.setItem("myaigpt_user_id", uid); }
  return uid;
}

function trackInteraction(type: string, data: { text?: string; source?: string; category?: string; contentType?: string; duration?: number; topic?: string } = {}) {
  const userId = getUserId();
  fetch("/api/user/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, type, ...data }) }).catch(() => {});
}

function getMessageCount(): number {
  try { return parseInt(localStorage.getItem("myaigpt_msg_count") || "0", 10); } catch { return 0; }
}
function incrementMessageCount(): number {
  const count = getMessageCount() + 1;
  localStorage.setItem("myaigpt_msg_count", String(count));
  return count;
}
function isVIP(): boolean { const email = (localStorage.getItem("myaigpt_email") || "").toLowerCase(); return VIP_EMAILS.includes(email); }
function isLimitReached(): boolean { if (isVIP()) return false; return getMessageCount() >= MESSAGE_LIMIT; }

type AppSettings = {
  darkMode: boolean;
  bgColor: string;
  accentColor: string;
  fontSize: "small" | "medium" | "large";
  hiddenPages: string[];
  autoScroll: boolean;
  messageSound: boolean;
  compactMode: boolean;
  showTimestamps: boolean;
  feedAutoRefresh: boolean;
  feedRefreshInterval: number;
  chatBubbleStyle: "rounded" | "sharp" | "minimal";
  displayName: string;
};
const defaultAppSettings: AppSettings = {
  darkMode: false, bgColor: "#ffffff", accentColor: "#f97316", fontSize: "medium",
  hiddenPages: [], autoScroll: true, messageSound: false, compactMode: false,
  showTimestamps: true, feedAutoRefresh: true, feedRefreshInterval: 5,
  chatBubbleStyle: "rounded", displayName: "",
};
const AppSettingsCtx = createContext<{ settings: AppSettings; update: (s: Partial<AppSettings>) => void }>({ settings: defaultAppSettings, update: () => {} });
function useAppSettings() { return useContext(AppSettingsCtx); }
function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try { const s = localStorage.getItem("myaigpt_app_settings"); return s ? { ...defaultAppSettings, ...JSON.parse(s) } : defaultAppSettings; } catch { return defaultAppSettings; }
  });
  const applySettings = useCallback((s: AppSettings) => {
    const el = document.documentElement;
    if (s.darkMode) { el.classList.add("dark"); } else { el.classList.remove("dark"); }
    if (s.bgColor && s.bgColor !== "#ffffff") { el.style.setProperty("--settings-bg", s.bgColor); } else { el.style.removeProperty("--settings-bg"); }
    el.style.setProperty("--accent-color", s.accentColor);
    const hexToHsl = (hex: string): string => {
      const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
      const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max-min;
      let h = 0; const l = (max+min)/2; const sat = d === 0 ? 0 : d/(1-Math.abs(2*l-1));
      if (d !== 0) { if (max===r) h=((g-b)/d+(g<b?6:0))*60; else if (max===g) h=((b-r)/d+2)*60; else h=((r-g)/d+4)*60; }
      return `${Math.round(h)} ${Math.round(sat*100)}% ${Math.round(l*100)}%`;
    };
    const hsl = hexToHsl(s.accentColor);
    el.style.setProperty("--user-accent", hsl);
    el.setAttribute("data-font-size", s.fontSize);
    if (s.compactMode) { el.classList.add("compact"); } else { el.classList.remove("compact"); }
  }, []);
  const update = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem("myaigpt_app_settings", JSON.stringify(next));
      applySettings(next);
      return next;
    });
  }, [applySettings]);
  useEffect(() => { applySettings(settings); }, []);
  return <AppSettingsCtx.Provider value={{ settings, update }}>{children}</AppSettingsCtx.Provider>;
}

function StripePaywall() {
  const paywallRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (paywallRef.current && !paywallRef.current.querySelector("stripe-buy-button")) {
      const btn = document.createElement("stripe-buy-button");
      btn.setAttribute("buy-button-id", "buy_btn_1T4l1iB1ElS3CRgPLlvxieIS");
      btn.setAttribute("publishable-key", "pk_live_51LN4UmB1ElS3CRgPDMJle5JfwZh9iwzDtD900oHDTcPQfPaoGSKEUMhq3MYsFv9SfR1e8Ox5FOpDIALB7MIpEdVo0033Y4vBii");
      paywallRef.current.appendChild(btn);
    }
  }, []);
  return (
    <div className="flex flex-col items-center justify-center p-6 max-w-md mx-auto text-center" data-testid="paywall-section">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
        <Crown size={28} className="text-white" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1">Upgrade to Pro</h3>
      <p className="text-sm text-muted-foreground mb-4">
        You've reached your free message limit. Upgrade to unlock unlimited access to My Ai Gpt and My Ai Coder.
      </p>
      <div ref={paywallRef} className="mb-4" />
      <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer"
        className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 mt-2" data-testid="link-discord-paywall">
        <ExternalLink size={11} /> Join our Discord for support
      </a>
    </div>
  );
}

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

// ─── VOICE ENGINE (Speech-to-Text + Text-to-Speech) ──────────────────────────

function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return false;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    let finalTranscript = "";
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) { finalTranscript += event.results[i][0].transcript + " "; }
        else { interim += event.results[i][0].transcript; }
      }
      setTranscript((finalTranscript + interim).trim());
    };
    recognition.onerror = () => { setIsListening(false); };
    recognition.onend = () => { setIsListening(false); };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript("");
    return true;
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    setIsListening(false);
  }, []);

  return { isListening, transcript, startListening, stopListening, setTranscript };
}

function speakText(text: string, onEnd?: () => void): SpeechSynthesisUtterance | null {
  if (!window.speechSynthesis) return null;
  window.speechSynthesis.cancel();
  const clean = text.replace(/```[\s\S]*?```/g, " code block ").replace(/[*_~`#]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/https?:\/\/\S+/g, " link ").trim();
  if (!clean) return null;
  const utterance = new SpeechSynthesisUtterance(clean);
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en")) ||
    voices.find(v => v.name.includes("Samantha")) ||
    voices.find(v => v.name.includes("Natural") && v.lang.startsWith("en")) ||
    voices.find(v => v.lang.startsWith("en") && v.localService) ||
    voices.find(v => v.lang.startsWith("en"));
  if (preferred) utterance.voice = preferred;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

// ─── DEVICE PERMISSIONS ENGINE ───────────────────────────────────────────────

type PermissionStatus = "granted" | "denied" | "prompt" | "unavailable" | "checking";
type PermissionInfo = { id: string; name: string; desc: string; icon: any; status: PermissionStatus; category: string };

function useDevicePermissions() {
  const [permissions, setPermissions] = useState<PermissionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const checkAll = useCallback(async () => {
    setLoading(true);
    const results: PermissionInfo[] = [];

    const checkPerm = async (name: string): Promise<PermissionStatus> => {
      try { const s = await navigator.permissions.query({ name: name as any }); return s.state as PermissionStatus; }
      catch { return "unavailable"; }
    };

    results.push({ id: "geolocation", name: "Location (GPS)", desc: "Navigate, find nearby places, get directions, weather by location", icon: Locate, status: await checkPerm("geolocation"), category: "Location" });
    results.push({ id: "camera", name: "Camera", desc: "Take photos, scan QR codes, video calls, profile pictures", icon: Camera, status: await checkPerm("camera"), category: "Media" });
    results.push({ id: "microphone", name: "Microphone", desc: "Voice commands, voice chat, audio messages, dictation", icon: Mic, status: await checkPerm("microphone"), category: "Media" });
    results.push({ id: "notifications", name: "Notifications", desc: "Get alerts for messages, news, social activity, reminders", icon: Bell, status: await checkPerm("notifications"), category: "System" });
    results.push({ id: "clipboard-read", name: "Clipboard", desc: "Paste text, images, code snippets from clipboard", icon: Copy, status: await checkPerm("clipboard-read"), category: "System" });
    results.push({ id: "persistent-storage", name: "Storage", desc: "Save data offline, cache content, store preferences", icon: Database, status: await checkPerm("persistent-storage"), category: "System" });
    results.push({ id: "accelerometer", name: "Motion Sensors", desc: "Fitness tracking, gaming, shake gestures, step counting", icon: Smartphone, status: await checkPerm("accelerometer"), category: "Sensors" });
    results.push({ id: "gyroscope", name: "Gyroscope", desc: "Orientation detection, 360 views, AR experiences", icon: Navigation, status: await checkPerm("gyroscope"), category: "Sensors" });

    setPermissions(results);
    setLoading(false);
  }, []);

  const requestPermission = useCallback(async (id: string) => {
    try {
      if (id === "geolocation") { await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject)); }
      else if (id === "camera") { const s = await navigator.mediaDevices.getUserMedia({ video: true }); s.getTracks().forEach(t => t.stop()); }
      else if (id === "microphone") { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach(t => t.stop()); }
      else if (id === "notifications") { await Notification.requestPermission(); }
      else if (id === "clipboard-read") { await navigator.clipboard.readText().catch(() => {}); }
      else if (id === "persistent-storage") { await navigator.storage?.persist?.(); }
      else if (id === "accelerometer" || id === "gyroscope") {
        if ((DeviceMotionEvent as any).requestPermission) { await (DeviceMotionEvent as any).requestPermission(); }
      }
      await checkAll();
    } catch { await checkAll(); }
  }, [checkAll]);

  useEffect(() => { checkAll(); }, [checkAll]);

  return { permissions, loading, requestPermission, refresh: checkAll };
}


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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const codeBlockCount = (content.match(/```\w+/g) || []).length;

  const handleSpeak = () => {
    if (isSpeaking) { window.speechSynthesis?.cancel(); setIsSpeaking(false); return; }
    setIsSpeaking(true);
    speakText(content, () => setIsSpeaking(false));
  };

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
              <button onClick={handleSpeak} data-testid="button-speak-message"
                className={`p-1.5 rounded-md hover:bg-muted/50 transition-colors ${isSpeaking ? "text-blue-500" : "text-muted-foreground/50 hover:text-foreground"}`}
                title={isSpeaking ? "Stop speaking" : "Read aloud"}>
                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
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
  const [showTemplates, setShowTemplates] = useState(false);
  const [pastedCode, setPastedCode] = useState(false);
  const charCount = value.length;
  const { isListening, transcript, startListening, stopListening, setTranscript } = useSpeechRecognition();
  const { toast } = useToast();

  useEffect(() => {
    if (transcript) setValue(transcript);
  }, [transcript]);

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) { setValue(transcript.trim()); }
    } else {
      const ok = startListening();
      if (!ok) toast({ title: "Voice not supported", description: "Your browser doesn't support speech recognition. Try Chrome on Android or desktop.", variant: "destructive" });
    }
  };

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
          {isCoder && !value && (
            <button type="button" onClick={() => setShowTemplates(!showTemplates)} className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted/30 transition-colors" title="Code templates (/)">
              <Layers size={14} />
            </button>
          )}
          <button type="button" onClick={toggleVoice} data-testid="button-voice-input"
            className={`p-2 rounded-xl flex items-center justify-center transition-all ${isListening ? "bg-red-500 text-white shadow-md animate-pulse" : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/30"}`}
            title={isListening ? "Stop listening" : "Voice input"}>
            {isListening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
          <button type="submit" disabled={!value.trim() || disabled} data-testid="button-send"
            className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${value.trim() && !disabled ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
            <Send size={16} strokeWidth={2.5} />
          </button>
        </div>
        {isListening && (
          <div className="absolute -top-10 left-0 right-0 flex items-center justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-xs text-red-600 shadow-sm">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Listening... speak now
            </div>
          </div>
        )}
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

  const [limitReached, setLimitReached] = useState(isLimitReached());

  const handleSend = useCallback(async (content: string) => {
    if (isLimitReached()) { setLimitReached(true); return; }
    const newCount = incrementMessageCount();
    if (newCount >= MESSAGE_LIMIT) { setLimitReached(true); }

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
      const r = await fetch(buildUrl(api.messages.create.path, { chatId: targetChatId }), { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": getUserId() }, body: JSON.stringify({ content }) });
      trackInteraction("chat_message", { text: content, topic: content.slice(0, 60) });
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
        {limitReached ? (
          <StripePaywall />
        ) : (
          <ChatInput onSend={handleSend} disabled={isThinking} isCoder={isCoder}
            placeholder={isCoder ? "Ask My Ai Coder to write, debug, or explain code..." : "Message My Ai Gpt..."} />
        )}
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
  const { settings: appSettings } = useAppSettings();

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
          <div className="flex items-center gap-1.5">
            <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" data-testid="link-discord-invite"
              className="px-2 py-1 text-[10px] font-semibold bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors flex items-center gap-1" title="Join Discord">
              <ExternalLink size={10} /> Discord
            </a>
            <button onClick={() => setIsOpen(false)} className="md:hidden p-1.5 text-muted-foreground rounded-lg" data-testid="button-close-sidebar"><PanelLeftClose size={16} /></button>
          </div>
        </div>

        <div className="px-2.5 py-2 space-y-1">
          <Link href="/" data-testid="link-general-chat"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/" ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/" ? "bg-primary/10" : "bg-muted/50"}`}><MessageSquare size={14} className={location === "/" ? "text-primary" : ""} /></div>
            <span className="flex-1">My Ai Gpt</span>
            <Plus size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
          </Link>
          {!appSettings.hiddenPages.includes("coder") && (
          <Link href="/coder" data-testid="link-coder-chat"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/coder" ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/coder" ? "bg-blue-500/15" : "bg-blue-500/5"}`}><Code2 size={14} className="text-blue-600" /></div>
            <span className="flex-1">My Ai Coder</span>
            <Plus size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
          </Link>
          )}
          {!appSettings.hiddenPages.includes("playground") && (
          <Link href="/playground" data-testid="link-playground"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/playground" ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/playground" ? "bg-emerald-500/15" : "bg-emerald-500/5"}`}><SquareTerminal size={14} className="text-emerald-600" /></div>
            <span className="flex-1">Playground</span>
            <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold opacity-80">IDE</span>
          </Link>
          )}
          {!appSettings.hiddenPages.includes("feed") && (
          <Link href="/feed" data-testid="link-feed"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/feed" ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/feed" ? "bg-orange-500/15" : "bg-orange-500/5"}`}><Newspaper size={14} className="text-orange-600" /></div>
            <span className="flex-1">Feed</span>
            <span className="text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold opacity-80">LIVE</span>
          </Link>
          )}
          {!appSettings.hiddenPages.includes("social") && (
          <Link href="/social" data-testid="link-social"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/social" || location.startsWith("/social") ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/social" || location.startsWith("/social") ? "bg-purple-500/15" : "bg-purple-500/5"}`}><Users size={14} className="text-purple-600" /></div>
            <span className="flex-1">Social</span>
            <span className="text-[9px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full font-bold opacity-80">SOCIAL</span>
          </Link>
          )}
          {!appSettings.hiddenPages.includes("create") && (
          <Link href="/create" data-testid="link-create"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/create" ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/create" ? "bg-pink-500/15" : "bg-pink-500/5"}`}><Paintbrush size={14} className="text-pink-600" /></div>
            <span className="flex-1">AI Studio</span>
            <span className="text-[9px] bg-gradient-to-r from-pink-500 to-violet-500 text-white px-1.5 py-0.5 rounded-full font-bold relative overflow-hidden">COMING SOON<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]" /></span>
          </Link>
          )}
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
          <Link href="/settings" data-testid="link-settings"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${location === "/settings" ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/60 hover:bg-black/5"}`}>
            <Settings2 size={14} className="text-gray-500" />
            <span className="flex-1 text-xs">Settings</span>
          </Link>
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
    "aiohttp", "yfinance", "ddgs", "websockets", "paramiko", "fabric",
    "celery", "kombu", "pika", "twisted", "gevent", "uvloop",
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

  // ═══════ POWER #1: SERVER-SIDE EXECUTION ═══════
  const runOnServerRef = useRef<(src: string, language: string) => Promise<void>>(async () => {});

  const runOnServer = useCallback(async (src: string, language: string) => {
    setOutput(prev => [...prev, "⚡ Executing on server..."]);
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
          setTimeout(() => runOnServerRef.current(fixedCode, language), 300);
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

  runOnServerRef.current = runOnServer;

  const runPython = useCallback(async (src: string) => {
    setOutput(["Loading Python runtime..."]);
    try {
      const importMatches = src.match(/^\s*(?:import|from)\s+(\w+)/gm) || [];
      const requestedModules = importMatches.map(m => m.replace(/^\s*(?:import|from)\s+/, "").trim());

      const serverOnly = requestedModules.filter(m => SERVER_ONLY_PACKAGES.has(m.toLowerCase()));
      if (serverOnly.length > 0) {
        setOutput([
          `⚡ Detected server-only packages: ${serverOnly.join(", ")}`,
          "Auto-switching to Server mode (packages will be auto-installed)...",
          "",
        ]);
        setExecMode("server");
        await runOnServerRef.current(src, "python");
        return;
      }

      const pyodide = await loadPyodide();

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

// ─── NEWS FEED (MSN-STYLE) ──────────────────────────────────────────────────

interface FeedArticle {
  id: string;
  title: string;
  description: string;
  link: string;
  image: string;
  source: string;
  pubDate: string;
  category: string;
  type: string;
  videoUrl: string;
  sourceColor: string;
}

interface FeedResponse {
  articles: FeedArticle[];
  total: number;
  page: number;
  hasMore: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function FeedCard({ article, onExpand, isExpanded }: { article: FeedArticle; onExpand: () => void; isExpanded: boolean }) {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [username, setUsername] = useState(() => localStorage.getItem("feed_username") || "");
  const [showComments, setShowComments] = useState(false);
  const [posting, setPosting] = useState(false);
  const [imgError, setImgError] = useState(false);
  const expandTimeRef = useRef<number>(0);
  const isVideo = article.type === "video";
  const color = article.sourceColor || "#f97316";

  useEffect(() => {
    if (isExpanded) { expandTimeRef.current = Date.now(); }
    else if (expandTimeRef.current > 0) {
      const duration = Math.round((Date.now() - expandTimeRef.current) / 1000);
      if (duration >= 3) trackInteraction("article_read", { text: article.title, source: article.source, category: article.category, contentType: article.type, duration });
      expandTimeRef.current = 0;
    }
  }, [isExpanded]);

  useEffect(() => {
    if (isExpanded) {
      fetch(`/api/feed/comments/${article.id}`).then(r => r.json()).then(setComments).catch(() => {});
    }
  }, [isExpanded, article.id]);

  const postComment = async () => {
    if (!newComment.trim() || !username.trim()) return;
    setPosting(true);
    try {
      localStorage.setItem("feed_username", username);
      const r = await fetch(`/api/feed/comments/${article.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), content: newComment.trim() }),
      });
      if (r.ok) {
        const comment = await r.json();
        setComments(prev => [comment, ...prev]);
        setNewComment("");
        trackInteraction("comment", { text: newComment, source: article.source, category: article.category });
      }
    } catch {}
    setPosting(false);
  };

  const hasRealImage = article.image && !imgError && !article.image.includes("gstatic.com/favicon");
  const cardImage = hasRealImage;

  return (
    <div className={`bg-white rounded-xl border border-border/30 overflow-hidden transition-all duration-300 hover:shadow-lg ${isExpanded ? "col-span-full" : ""}`}
      data-testid={`feed-card-${article.id}`}>

      {!isExpanded && (
        <div className="relative cursor-pointer group" onClick={onExpand}>
          {cardImage ? (
            <img src={article.image} alt="" className="w-full h-48 object-cover" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-32 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}18, ${color}30)` }}>
              {isVideo ? <Play size={32} style={{ color }} /> : <Newspaper size={28} style={{ color }} className="opacity-40" />}
            </div>
          )}
          {isVideo && cardImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play size={20} className="text-white ml-0.5" fill="white" />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
            <span className="text-white text-xs font-medium">{isVideo ? "Watch video" : "Click to read"}</span>
          </div>
          {isVideo && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded flex items-center gap-1">
              <Play size={8} fill="white" /> VIDEO
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ color, backgroundColor: `${color}15` }}>{article.source}</span>
          <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1"><Clock size={9} /> {timeAgo(article.pubDate)}</span>
          {(Date.now() - new Date(article.pubDate).getTime()) < 2 * 60 * 60 * 1000 && (
            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-green-500 text-white animate-pulse">NEW</span>
          )}
          {article.category !== "General" && (
            <span className="text-[10px] text-muted-foreground/40 bg-muted/30 px-1.5 py-0.5 rounded-full">{article.category}</span>
          )}
        </div>

        <h3 className="font-bold text-sm leading-snug mb-1.5 cursor-pointer hover:text-orange-600 transition-colors line-clamp-2" onClick={onExpand} data-testid={`feed-title-${article.id}`}>
          {article.title}
        </h3>

        {!isExpanded && (
          <p className="text-xs text-muted-foreground/70 line-clamp-2 mb-3">{article.description}</p>
        )}

        {isExpanded && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {isVideo && article.videoUrl ? (() => {
              let embedUrl = article.videoUrl;
              let embedRatio = "56.25%";
              let maxH: number | undefined;
              if (article.source === "TikTok") {
                const tikTokMatch = article.link?.match(/video\/(\d+)/);
                if (tikTokMatch) { embedUrl = `https://www.tiktok.com/embed/v2/${tikTokMatch[1]}`; embedRatio = "140%"; maxH = 580; }
              } else if (article.source === "Instagram") {
                const igMatch = article.link?.match(/\/(p|reel|tv)\/([^/?]+)/);
                if (igMatch) { embedUrl = `https://www.instagram.com/${igMatch[1]}/${igMatch[2]}/embed/`; embedRatio = "120%"; maxH = 500; }
              }
              return (
                <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingBottom: embedRatio, maxHeight: maxH }}>
                  <iframe src={embedUrl} className="absolute inset-0 w-full h-full rounded-lg border-0" allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation" />
                </div>
              );
            })() : cardImage ? (
              <img src={article.image} alt="" className="w-full max-h-96 object-cover rounded-lg" onError={() => setImgError(true)} />
            ) : null}
            <p className="text-sm text-foreground/80 leading-relaxed">{article.description}</p>
            <a href={article.link} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors" data-testid={`feed-readmore-${article.id}`}>
              {isVideo ? `Watch on ${article.source}` : "Read full article"} <ChevronRight size={12} />
            </a>

            <div className="border-t border-border/20 pt-3">
              <button onClick={() => setShowComments(!showComments)} data-testid={`feed-toggle-comments-${article.id}`}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <MessageCircle size={13} /> {comments.length} Comment{comments.length !== 1 ? "s" : ""}
                {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {showComments && (
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Name"
                      className="w-24 px-2 py-1.5 text-xs border border-border/30 rounded-lg focus:outline-none focus:border-orange-300 bg-muted/20" data-testid={`feed-comment-name-${article.id}`} />
                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..."
                      className="flex-1 px-3 py-1.5 text-xs border border-border/30 rounded-lg focus:outline-none focus:border-orange-300 bg-muted/20" data-testid={`feed-comment-input-${article.id}`}
                      onKeyDown={e => e.key === "Enter" && postComment()} />
                    <button onClick={postComment} disabled={posting || !newComment.trim() || !username.trim()} data-testid={`feed-comment-submit-${article.id}`}
                      className="px-3 py-1.5 text-xs font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 transition-colors">
                      {posting ? "..." : "Post"}
                    </button>
                  </div>

                  {comments.length === 0 && (
                    <p className="text-xs text-muted-foreground/40 text-center py-2">No comments yet. Be the first!</p>
                  )}
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-2 items-start" data-testid={`feed-comment-${c.id}`}>
                      <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <User size={11} className="text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">{c.username}</span>
                          <span className="text-[10px] text-muted-foreground/40">{timeAgo(c.createdAt as unknown as string)}</span>
                        </div>
                        <p className="text-xs text-foreground/70 mt-0.5">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!isExpanded && (
          <button onClick={onExpand} className="text-[11px] text-orange-500 hover:text-orange-600 font-medium transition-colors" data-testid={`feed-expand-${article.id}`}>
            {isVideo ? "Watch" : "Read more"}
          </button>
        )}
        {isExpanded && (
          <button onClick={onExpand} className="mt-2 text-[11px] text-muted-foreground hover:text-foreground font-medium transition-colors" data-testid={`feed-collapse-${article.id}`}>
            Collapse
          </button>
        )}
      </div>
    </div>
  );
}

function NewsFeed() {
  const [articles, setArticles] = useState<FeedArticle[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const [industrySectors, setIndustrySectors] = useState<any[]>([]);
  const [activeIndustry, setActiveIndustry] = useState<string | null>(null);
  const [industryArticles, setIndustryArticles] = useState<FeedArticle[]>([]);
  const [industryLoading, setIndustryLoading] = useState(false);
  const [showIndustryBrowser, setShowIndustryBrowser] = useState(false);
  const [industryTree, setIndustryTree] = useState<any[]>([]);
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    fetch("/api/industries/sectors").then(r => r.json()).then(setIndustrySectors).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    const indParam = params.get("industry");
    if (indParam) { setActiveIndustry(indParam); fetchIndustryNews(indParam); }
  }, []);

  const fetchIndustryNews = useCallback(async (slug: string) => {
    setIndustryLoading(true);
    try {
      const r = await fetch(`/api/industry/${slug}/news`);
      const data = await r.json();
      const sorted = (data.articles || []).sort((a: any, b: any) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      setIndustryArticles(sorted.map((a: any) => ({ ...a, sourceColor: "#f97316" })));
      setLastRefreshed(new Date());
    } catch { setIndustryArticles([]); }
    setIndustryLoading(false);
  }, []);

  const selectIndustry = useCallback((slug: string | null) => {
    setActiveIndustry(slug);
    if (slug) {
      fetchIndustryNews(slug);
      window.history.replaceState(null, "", `/feed?industry=${slug}`);
    } else {
      setIndustryArticles([]);
      window.history.replaceState(null, "", "/feed");
    }
  }, [fetchIndustryNews]);

  const loadIndustryTree = useCallback(async () => {
    if (industryTree.length > 0) { setShowIndustryBrowser(!showIndustryBrowser); return; }
    try {
      const r = await fetch("/api/industries");
      const data = await r.json();
      setIndustryTree(data);
      setShowIndustryBrowser(true);
    } catch {}
  }, [industryTree, showIndustryBrowser]);

  const fetchPage = useCallback(async (p: number, reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      let feedUrl = `/api/feed?page=${p}`;
      if (filter && filter !== "All") {
        if (filter === "Videos") feedUrl += `&type=video`;
        else feedUrl += `&source=${encodeURIComponent(filter)}`;
      }
      const r = await fetch(feedUrl);
      const data: FeedResponse = await r.json();
      setArticles(prev => {
        if (reset || p === 1) return data.articles;
        const existingIds = new Set(prev.map(a => a.id));
        const newItems = data.articles.filter(a => !existingIds.has(a.id));
        return [...prev, ...newItems];
      });
      setHasMore(data.hasMore);
      setTotal(data.total);
      setPage(p);
      if (p === 1) setLastRefreshed(new Date());
    } catch {}
    setLoading(false);
    setLoadingMore(false);
    loadingRef.current = false;
  }, [filter]);

  const handleSearch = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) { clearSearch(); return; }
    setSearchLoading(true);
    setSearchQuery(q);
    setFilter("All");
    trackInteraction("search", { text: q, topic: q });
    try {
      const r = await fetch(`/api/feed/search?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      setArticles(data.articles || []);
      setTotal(data.total || 0);
      setHasMore(false);
    } catch {}
    setSearchLoading(false);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchInput("");
    setArticles([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    loadingRef.current = false;
    fetchPage(1, true);
  }, [fetchPage]);

  useEffect(() => { fetchPage(1, true); }, [fetchPage]);

  useEffect(() => {
    if (searchQuery) return;
    const interval = setInterval(() => {
      if (!loadingRef.current) {
        if (activeIndustry) fetchIndustryNews(activeIndustry);
        else fetchPage(1, true);
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [fetchPage, fetchIndustryNews, searchQuery, activeIndustry]);

  useEffect(() => {
    if (searchQuery) return;
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 300 && hasMore && !loadingRef.current) {
        fetchPage(page + 1);
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [page, hasMore, fetchPage, searchQuery]);

  const sources = useMemo(() => {
    const knownSources = ["YouTube", "TikTok", "Instagram", "Vimeo", "Dailymotion", "NY Times", "BBC World", "NPR", "TechCrunch", "The Verge", "Ars Technica"];
    if (!articles.length) return ["All", "Videos", ...knownSources];
    const s = [...new Set([...articles.map(a => a.source), ...knownSources])];
    return ["All", "Videos", ...s.sort()];
  }, [articles]);

  const filtered = useMemo(() => {
    if (activeIndustry) return industryArticles;
    return articles;
  }, [articles, industryArticles, activeIndustry]);

  const handleRefresh = () => {
    if (searchQuery) { handleSearch(searchQuery); return; }
    if (activeIndustry) { fetchIndustryNews(activeIndustry); return; }
    setArticles([]);
    setPage(1);
    setHasMore(true);
    fetchPage(1, true);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-orange-50/30 to-background">
      <div className="p-4 border-b border-border/20 bg-white/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/10"><Newspaper size={18} className="text-orange-500" /></div>
            <div>
              <h1 className="font-bold text-lg text-foreground" data-testid="text-feed-title">{activeIndustry ? `${industrySectors.find((s: any) => s.slug === activeIndustry)?.name || activeIndustry} News` : "My Ai Gpt Feed"}</h1>
              <p className="text-[10px] text-muted-foreground/60">{activeIndustry ? "Industry-specific news powered by AI" : "Live news & videos from around the world"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} className="p-1.5 rounded-lg hover:bg-orange-50 text-muted-foreground hover:text-orange-500 transition-colors" title="Refresh feed" data-testid="button-refresh-feed">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <span className="text-[10px] text-muted-foreground/50">{total} items</span>
            <span className="text-[9px] text-muted-foreground/40">{timeAgo(lastRefreshed.toISOString())}</span>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Live — auto-refreshes every 45s" />
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchInput); }} className="mb-3" data-testid="form-feed-search">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search news, videos, topics..."
              className="w-full pl-9 pr-20 py-2 text-sm bg-muted/20 border border-border/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 placeholder:text-muted-foreground/40 transition-all"
              data-testid="input-feed-search"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button type="button" onClick={clearSearch} className="p-1 rounded-md hover:bg-muted/30 text-muted-foreground/50 hover:text-foreground transition-colors" data-testid="button-clear-search" title="Clear search">
                  <X size={14} />
                </button>
              )}
              <button type="submit" disabled={searchLoading || !searchInput.trim()} className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" data-testid="button-search-submit">
                {searchLoading ? <RefreshCw size={12} className="animate-spin" /> : "Search"}
              </button>
            </div>
          </div>
          {searchQuery && (
            <div className="flex items-center gap-2 mt-2 px-1">
              <span className="text-[10px] text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded-full">Results for "{searchQuery}"</span>
              <span className="text-[10px] text-muted-foreground/50">{total} found</span>
              <button type="button" onClick={clearSearch} className="text-[10px] text-orange-500 hover:text-orange-600 font-medium ml-auto" data-testid="button-back-to-feed">Back to Live Feed</button>
            </div>
          )}
        </form>

        {industrySectors.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] font-bold text-orange-500 uppercase tracking-wider">Industries</span>
              <div className="flex-1 h-px bg-border/20" />
              <button onClick={loadIndustryTree} className="text-[9px] text-muted-foreground hover:text-orange-500 font-medium transition-colors" data-testid="button-browse-industries">
                {showIndustryBrowser ? "Close" : "Browse All"} ▾
              </button>
            </div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {activeIndustry && (
                <button onClick={() => selectIndustry(null)} data-testid="button-clear-industry"
                  className="px-3 py-1 text-[10px] font-medium rounded-full whitespace-nowrap bg-muted/40 text-muted-foreground hover:bg-muted/60 transition-all flex items-center gap-1">
                  <X size={10} /> All News
                </button>
              )}
              {industrySectors.map((s: any) => (
                <button key={s.slug} onClick={() => selectIndustry(s.slug)} data-testid={`industry-chip-${s.slug}`}
                  className={`px-3 py-1 text-[10px] font-medium rounded-full whitespace-nowrap transition-all ${
                    activeIndustry === s.slug
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200/50"
                  }`}>
                  {s.name}
                </button>
              ))}
            </div>
            {showIndustryBrowser && industryTree.length > 0 && (
              <div className="mt-2 p-3 bg-white border border-border/30 rounded-xl max-h-64 overflow-y-auto shadow-sm" data-testid="industry-browser">
                {industryTree.map((sector: any) => (
                  <div key={sector.slug} className="mb-1">
                    <button onClick={() => { const next = new Set(expandedSectors); next.has(sector.slug) ? next.delete(sector.slug) : next.add(sector.slug); setExpandedSectors(next); }}
                      className="w-full flex items-center justify-between py-1.5 px-2 text-xs font-bold text-foreground hover:bg-orange-50 rounded-lg transition-colors">
                      <span>{sector.name}</span>
                      <ChevronDown size={12} className={`transition-transform ${expandedSectors.has(sector.slug) ? "rotate-180" : ""}`} />
                    </button>
                    {expandedSectors.has(sector.slug) && (sector.children || []).map((group: any) => (
                      <div key={group.slug} className="ml-3">
                        <button onClick={() => selectIndustry(group.slug)} className="w-full text-left py-1 px-2 text-[11px] text-muted-foreground hover:text-orange-600 hover:bg-orange-50/50 rounded transition-colors" data-testid={`industry-item-${group.slug}`}>
                          {group.name}
                        </button>
                        {(group.children || []).map((ind: any) => (
                          <button key={ind.slug} onClick={() => selectIndustry(ind.slug)} className="w-full text-left py-0.5 px-2 ml-3 text-[10px] text-muted-foreground/70 hover:text-orange-500 rounded transition-colors" data-testid={`industry-item-${ind.slug}`}>
                            {ind.name}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {sources.map(s => (
            <button key={s} onClick={() => setFilter(s)} data-testid={`feed-filter-${s}`}
              className={`px-3 py-1 text-[10px] font-medium rounded-full whitespace-nowrap transition-all ${
                filter === s
                  ? s === "Videos" ? "bg-red-500 text-white shadow-sm" : "bg-orange-500 text-white shadow-sm"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}>
              {s === "Videos" && <span className="mr-1">▶</span>}{s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        {industryLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-xl border border-border/30 overflow-hidden animate-pulse">
                <div className="h-48 bg-orange-100/50" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-orange-100/50 rounded w-1/4" />
                  <div className="h-4 bg-orange-100/50 rounded w-3/4" />
                  <div className="h-3 bg-orange-100/50 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : loading && articles.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-xl border border-border/30 overflow-hidden animate-pulse">
                <div className="h-48 bg-muted/30" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-muted/30 rounded w-1/4" />
                  <div className="h-4 bg-muted/30 rounded w-3/4" />
                  <div className="h-3 bg-muted/30 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper size={40} className="mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground/50">No articles available</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              {filtered.map(article => (
                <FeedCard key={article.id} article={article}
                  isExpanded={expandedId === article.id}
                  onExpand={() => {
                    const isExpanding = expandedId !== article.id;
                    setExpandedId(isExpanding ? article.id : null);
                    if (isExpanding) trackInteraction("article_click", { text: article.title + " " + article.description, source: article.source, category: article.category, contentType: article.type });
                  }} />
              ))}
            </div>
            {loadingMore && (
              <div className="flex justify-center py-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <RefreshCw size={14} className="animate-spin text-orange-500" />
                  Loading more...
                </div>
              </div>
            )}
            {!hasMore && articles.length > 0 && (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground/40">You've reached the end. Pull to refresh for new content!</p>
                <button onClick={handleRefresh} className="mt-2 px-4 py-1.5 text-xs font-medium text-orange-500 border border-orange-200 rounded-full hover:bg-orange-50 transition-colors" data-testid="button-load-fresh">
                  Load fresh content
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── SOCIAL PAGE ─────────────────────────────────────────────────────────────

type SocialPostWithProfile = SocialPost & { profile?: SocialProfile };

function socialTimeAgo(dateStr: string | Date): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function socialAbsoluteTime(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function renderSocialContent(content: string, onProfileClick?: (username: string) => void) {
  const parts = content.split(/(@\w+|#\w+|https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return <span key={i} className="text-purple-500 cursor-pointer hover:underline font-medium" data-testid={`mention-${part}`} onClick={() => onProfileClick?.(part.slice(1))}>{part}</span>;
    }
    if (part.startsWith("#")) {
      return <span key={i} className="text-blue-500 font-medium" data-testid={`hashtag-${part}`}>{part}</span>;
    }
    if (part.match(/^https?:\/\//)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all" data-testid={`link-${i}`}>{part}</a>;
    }
    return <span key={i}>{part}</span>;
  });
}

function SocialAvatar({ src, name, size = "md", verified }: { src?: string; name: string; size?: "sm" | "md" | "lg" | "xl"; verified?: boolean }) {
  const sizeClasses = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg", xl: "w-20 h-20 text-2xl" };
  const badgeSize = { sm: 10, md: 12, lg: 14, xl: 16 };
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  const colors = ["bg-purple-500", "bg-blue-500", "bg-pink-500", "bg-emerald-500", "bg-amber-500", "bg-cyan-500"];
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <div className="relative inline-flex shrink-0">
      {src ? (
        <img src={src} alt={name} className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-sm`} />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full ${colors[colorIdx]} text-white flex items-center justify-center font-bold border-2 border-white shadow-sm`}>{initial}</div>
      )}
      {verified && (
        <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5" data-testid="badge-verified">
          <CheckCircle2 size={badgeSize[size]} className="text-blue-500 fill-blue-500" />
        </div>
      )}
    </div>
  );
}

function CreateProfileModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: (profile: SocialProfile) => void }) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!username.trim() || !displayName.trim()) { setError("Username and display name are required"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError("Username can only contain letters, numbers, and underscores"); return; }
    setCreating(true); setError("");
    try {
      const r = await fetch("/api/social/profiles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: username.toLowerCase(), displayName, bio, avatar, email: email.trim().toLowerCase() }) });
      if (!r.ok) { const data = await r.json().catch(() => ({})); throw new Error(data.message || "Failed to create profile"); }
      const profile = await r.json();
      localStorage.setItem("social_profile_id", String(profile.id));
      localStorage.setItem("social_username", profile.username);
      if (email.trim()) localStorage.setItem("myaigpt_email", email.trim().toLowerCase());
      onCreated(profile);
      toast({ title: "Profile created!", description: `Welcome, @${profile.username}` });
    } catch (e: any) { setError(e.message); }
    setCreating(false);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-border/30 w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 rounded-lg bg-purple-500/10"><Users size={18} className="text-purple-500" /></div>
          <h2 className="font-bold text-lg">Create Your Profile</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Username</label>
            <div className="relative">
              <AtSign size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="your_username"
                className="w-full pl-8 pr-3 py-2 text-sm border border-border/40 rounded-lg focus:outline-none focus:border-purple-300" data-testid="input-social-username" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Display Name</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your Name"
              className="w-full px-3 py-2 text-sm border border-border/40 rounded-lg focus:outline-none focus:border-purple-300" data-testid="input-social-displayname" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..."
              className="w-full px-3 py-2 text-sm border border-border/40 rounded-lg focus:outline-none focus:border-purple-300 resize-none" rows={2} data-testid="input-social-bio" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email"
              className="w-full px-3 py-2 text-sm border border-border/40 rounded-lg focus:outline-none focus:border-purple-300" data-testid="input-social-email" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Avatar URL</label>
            <input value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://example.com/avatar.jpg"
              className="w-full px-3 py-2 text-sm border border-border/40 rounded-lg focus:outline-none focus:border-purple-300" data-testid="input-social-avatar" />
          </div>
          {error && <p className="text-xs text-red-500" data-testid="text-social-error">{error}</p>}
          <button onClick={handleCreate} disabled={creating} data-testid="button-create-profile"
            className="w-full py-2.5 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50 transition-colors">
            {creating ? "Creating..." : "Create Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditProfileModal({ isOpen, onClose, profile, onUpdated }: { isOpen: boolean; onClose: () => void; profile: SocialProfile; onUpdated: (p: SocialProfile) => void }) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio || "");
  const [avatar, setAvatar] = useState(profile.avatar || "");
  const [coverImage, setCoverImage] = useState(profile.coverImage || "");
  const [location, setLocationVal] = useState(profile.location || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-border/30 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg flex items-center gap-2"><Edit3 size={16} /> Edit Profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Display Name</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-3 py-2 text-sm border border-border/40 rounded-lg focus:outline-none focus:border-purple-300" data-testid="input-edit-displayname" /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full px-3 py-2 text-sm border border-border/40 rounded-lg focus:outline-none focus:border-purple-300 resize-none" rows={2} data-testid="input-edit-bio" /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Avatar URL</label>
            <input value={avatar} onChange={e => setAvatar(e.target.value)} className="w-full px-3 py-2 text-sm border border-border/40 rounded-lg focus:outline-none focus:border-purple-300" data-testid="input-edit-avatar" /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Cover Image URL</label>
            <input value={coverImage} onChange={e => setCoverImage(e.target.value)} className="w-full px-3 py-2 text-sm border border-border/40 rounded-lg focus:outline-none focus:border-purple-300" data-testid="input-edit-cover" /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
            <input value={location} onChange={e => setLocationVal(e.target.value)} placeholder="City, Country" className="w-full px-3 py-2 text-sm border border-border/40 rounded-lg focus:outline-none focus:border-purple-300" data-testid="input-edit-location" /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Website</label>
            <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 text-sm border border-border/40 rounded-lg focus:outline-none focus:border-purple-300" data-testid="input-edit-website" /></div>
          <button onClick={async () => {
            setSaving(true);
            try {
              const r = await fetch(`/api/social/profiles/${profile.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName, bio, avatar, coverImage, location, website }) });
              if (r.ok) { const updated = await r.json(); onUpdated(updated); toast({ title: "Profile updated!" }); onClose(); }
            } catch { toast({ title: "Update failed", variant: "destructive" }); }
            setSaving(false);
          }} disabled={saving} data-testid="button-save-profile"
            className="w-full py-2.5 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FollowListModal({ isOpen, onClose, profileId, type, onProfileClick }: { isOpen: boolean; onClose: () => void; profileId: number; type: "followers" | "following"; onProfileClick: (username: string) => void }) {
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`/api/social/${type}/${profileId}`).then(r => r.json()).then(data => { setProfiles(data); setLoading(false); }).catch(() => setLoading(false));
  }, [isOpen, profileId, type]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-border/30 w-full max-w-sm max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <h3 className="font-semibold text-base capitalize">{type}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />)}</div>
          ) : profiles.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground/50">No {type} yet</div>
          ) : profiles.map(p => (
            <button key={p.id} onClick={() => { onProfileClick(p.username); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors text-left" data-testid={`follow-list-${p.username}`}>
              <SocialAvatar src={p.avatar || undefined} name={p.displayName} size="sm" verified={p.verified || false} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{p.displayName}</div>
                <div className="text-xs text-muted-foreground">@{p.username}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PostComposer({ profileId, onPosted }: { profileId: number; onPosted: () => void }) {
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("");
  const [showMedia, setShowMedia] = useState(false);
  const [posting, setPosting] = useState(false);
  const { toast } = useToast();
  const charLimit = 280;
  const charLeft = charLimit - content.length;
  const charColor = charLeft > 50 ? "text-green-500" : charLeft > 20 ? "text-yellow-500" : "text-red-500";

  const handlePost = async () => {
    if (!content.trim() || content.length > charLimit) return;
    setPosting(true);
    try {
      const body: any = { profileId, content };
      if (mediaUrl) { body.mediaUrl = mediaUrl; body.mediaType = mediaType || "image"; }
      const r = await fetch("/api/social/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (r.ok) { trackInteraction("social_post", { text: content }); setContent(""); setMediaUrl(""); setMediaType(""); setShowMedia(false); onPosted(); toast({ title: "Post published!" }); }
    } catch { toast({ title: "Failed to post", variant: "destructive" }); }
    setPosting(false);
  };

  return (
    <div className="bg-white border border-border/30 rounded-xl p-4" data-testid="post-composer">
      <textarea value={content} onChange={e => { if (e.target.value.length <= charLimit + 10) setContent(e.target.value); }}
        placeholder="What's happening?" className="w-full resize-none border-0 text-sm focus:outline-none placeholder:text-muted-foreground/40 leading-relaxed" rows={3} data-testid="input-post-content" />
      {showMedia && (
        <div className="flex items-center gap-2 mt-2 p-2 bg-muted/20 rounded-lg">
          <input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="Media URL" className="flex-1 text-xs px-2 py-1.5 border border-border/30 rounded-md focus:outline-none focus:border-purple-300" data-testid="input-media-url" />
          <select value={mediaType} onChange={e => setMediaType(e.target.value)} className="text-xs px-2 py-1.5 border border-border/30 rounded-md bg-white" data-testid="select-media-type">
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="link">Link</option>
          </select>
          <button onClick={() => { setShowMedia(false); setMediaUrl(""); setMediaType(""); }} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
        </div>
      )}
      {mediaUrl && mediaType === "image" && (
        <div className="mt-2 rounded-lg overflow-hidden border border-border/20">
          <img src={mediaUrl} alt="Preview" className="w-full max-h-48 object-cover" onError={e => (e.currentTarget.style.display = "none")} />
        </div>
      )}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
        <div className="flex items-center gap-1">
          <button onClick={() => { setShowMedia(true); setMediaType("image"); }} className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-purple-500 hover:bg-purple-50 transition-colors" title="Add image" data-testid="button-add-image"><Image size={16} /></button>
          <button onClick={() => { setShowMedia(true); setMediaType("video"); }} className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-purple-500 hover:bg-purple-50 transition-colors" title="Add video" data-testid="button-add-video"><Video size={16} /></button>
          <button onClick={() => { setShowMedia(true); setMediaType("link"); }} className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-purple-500 hover:bg-purple-50 transition-colors" title="Add link" data-testid="button-add-link"><Link2 size={16} /></button>
        </div>
        <div className="flex items-center gap-3">
          {content.length > 0 && <span className={`text-xs font-mono ${charColor}`} data-testid="text-char-count">{charLeft}</span>}
          <button onClick={handlePost} disabled={posting || !content.trim() || content.length > charLimit} data-testid="button-publish-post"
            className="px-4 py-1.5 bg-purple-500 text-white rounded-full text-sm font-medium hover:bg-purple-600 disabled:opacity-40 transition-colors">
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SocialPostCard({ post, currentProfileId, onProfileClick, onRefresh }: { post: SocialPostWithProfile; currentProfileId: number | null; onProfileClick: (username: string) => void; onRefresh: () => void }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<(SocialComment & { profile?: SocialProfile })[]>([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const { toast } = useToast();
  const isOwner = currentProfileId === post.profileId;

  useEffect(() => {
    if (!currentProfileId) return;
    fetch(`/api/social/posts/${post.id}/liked?profileId=${currentProfileId}`).then(r => r.json()).then(data => { if (data.liked) setLiked(true); }).catch(() => {});
    fetch(`/api/social/posts/${post.id}/bookmarked?profileId=${currentProfileId}`).then(r => r.json()).then(data => { if (data.bookmarked) setBookmarked(true); }).catch(() => {});
  }, [post.id, currentProfileId]);

  const handleLike = async () => {
    if (!currentProfileId) return;
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 500);
    try {
      const r = await fetch(`/api/social/posts/${post.id}/like`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileId: currentProfileId }) });
      if (r.ok) { const data = await r.json(); setLiked(data.liked); setLikeCount(data.likes); if (data.liked) trackInteraction("social_like", { text: post.content }); }
    } catch {}
  };

  const handleBookmark = async () => {
    if (!currentProfileId) return;
    try {
      const r = await fetch(`/api/social/posts/${post.id}/bookmark`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileId: currentProfileId }) });
      if (r.ok) { const data = await r.json(); setBookmarked(data.bookmarked); toast({ title: data.bookmarked ? "Bookmarked" : "Removed bookmark" }); if (data.bookmarked) trackInteraction("bookmark", { text: post.content }); }
    } catch {}
  };

  const handleRepost = async () => {
    if (!currentProfileId) return;
    try {
      const r = await fetch(`/api/social/posts/${post.id}/repost`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileId: currentProfileId }) });
      if (r.ok) { toast({ title: "Reposted!" }); onRefresh(); }
    } catch {}
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/social/posts/${post.id}`, { method: "DELETE" });
      toast({ title: "Post deleted" }); onRefresh();
    } catch {}
    setShowDeleteConfirm(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/social?post=${post.id}`);
    toast({ title: "Link copied to clipboard!" });
  };

  const loadComments = async () => {
    try {
      const r = await fetch(`/api/social/posts/${post.id}/comments`);
      if (r.ok) setComments(await r.json());
    } catch {}
  };

  const handlePostComment = async () => {
    if (!currentProfileId || !newComment.trim()) return;
    setPostingComment(true);
    try {
      const r = await fetch(`/api/social/posts/${post.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileId: currentProfileId, content: newComment }) });
      if (r.ok) { setNewComment(""); await loadComments(); }
    } catch {}
    setPostingComment(false);
  };

  useEffect(() => { if (showComments) loadComments(); }, [showComments]);

  const profile = post.profile;
  const isVideoEmbed = post.mediaType === "video" && post.mediaUrl;
  const getVideoEmbedUrl = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    return url;
  };

  return (
    <div className="bg-white border border-border/30 rounded-xl p-4 transition-all" data-testid={`post-card-${post.id}`}>
      <div className="flex items-start gap-3">
        <button onClick={() => profile && onProfileClick(profile.username)} data-testid={`post-avatar-${post.id}`}>
          <SocialAvatar src={profile?.avatar || undefined} name={profile?.displayName || "User"} size="md" verified={profile?.verified || false} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => profile && onProfileClick(profile.username)} className="font-semibold text-sm hover:underline" data-testid={`post-displayname-${post.id}`}>{profile?.displayName || "User"}</button>
            {profile?.verified && <CheckCircle2 size={14} className="text-blue-500 fill-blue-500 shrink-0" />}
            <span className="text-xs text-muted-foreground">@{profile?.username || "unknown"}</span>
            <span className="text-xs text-muted-foreground/40">·</span>
            <span className="text-xs text-muted-foreground/60 hover:underline cursor-default" title={socialAbsoluteTime(post.createdAt)} data-testid={`post-time-${post.id}`}>{socialTimeAgo(post.createdAt)}</span>
            {post.pinned && <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-medium" data-testid={`post-pinned-${post.id}`}>Pinned</span>}
          </div>

          <div className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap break-words" data-testid={`post-content-${post.id}`}>
            {renderSocialContent(post.content, onProfileClick)}
          </div>

          {post.mediaUrl && post.mediaType === "image" && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border/20 cursor-pointer" onClick={() => setLightbox(true)} data-testid={`post-image-${post.id}`}>
              <img src={post.mediaUrl} alt="Post media" className="w-full max-h-80 object-cover hover:opacity-95 transition-opacity" />
            </div>
          )}

          {isVideoEmbed && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border/20 aspect-video" data-testid={`post-video-${post.id}`}>
              <iframe src={getVideoEmbedUrl(post.mediaUrl!)} className="w-full h-full" allowFullScreen title="Video" />
            </div>
          )}

          {post.mediaUrl && post.mediaType === "link" && (
            <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block border border-border/30 rounded-xl p-3 hover:bg-muted/20 transition-colors" data-testid={`post-link-${post.id}`}>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Link2 size={12} /><span className="truncate">{post.mediaUrl}</span></div>
              {post.linkPreview && <p className="text-xs text-foreground/70 mt-1">{post.linkPreview}</p>}
            </a>
          )}

          <div className="flex items-center gap-1 mt-3 -ml-2">
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-muted-foreground hover:text-blue-500 hover:bg-blue-50 transition-colors text-xs" data-testid={`button-comment-${post.id}`}>
              <MessageCircle size={15} /><span>{comments.length || ""}</span>
            </button>
            <button onClick={handleRepost} className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-muted-foreground hover:text-green-500 hover:bg-green-50 transition-colors text-xs" data-testid={`button-repost-${post.id}`}>
              <Repeat2 size={15} /><span>{post.reposts || ""}</span>
            </button>
            <button onClick={handleLike} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-all text-xs ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-500 hover:bg-red-50"}`} data-testid={`button-like-${post.id}`}>
              <Heart size={15} className={`transition-transform ${likeAnimating ? "scale-125" : ""} ${liked ? "fill-red-500" : ""}`} /><span>{likeCount || ""}</span>
            </button>
            <button onClick={handleBookmark} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors text-xs ${bookmarked ? "text-purple-500" : "text-muted-foreground hover:text-purple-500 hover:bg-purple-50"}`} data-testid={`button-bookmark-${post.id}`}>
              <Bookmark size={15} className={bookmarked ? "fill-purple-500" : ""} />
            </button>
            <button onClick={handleShare} className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-muted-foreground hover:text-blue-500 hover:bg-blue-50 transition-colors text-xs" data-testid={`button-share-${post.id}`}>
              <Share2 size={15} />
            </button>
            {(post.views || 0) > 0 && <span className="text-[10px] text-muted-foreground/40 ml-auto flex items-center gap-1" data-testid={`post-views-${post.id}`}><Eye size={12} />{post.views}</span>}

            <div className="relative ml-auto">
              <button onClick={() => setShowMore(!showMore)} className="p-1.5 rounded-full text-muted-foreground/40 hover:text-foreground hover:bg-muted/30 transition-colors" data-testid={`button-more-${post.id}`}>
                <MoreHorizontal size={15} />
              </button>
              {showMore && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-border/30 rounded-xl shadow-xl py-1 min-w-[160px] z-50">
                  {isOwner && (
                    <>
                      <button onClick={() => { setShowMore(false); setShowDeleteConfirm(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors" data-testid={`button-delete-post-${post.id}`}>
                        <Trash2 size={13} /> Delete post
                      </button>
                      <button onClick={async () => {
                        setShowMore(false);
                        try {
                          await fetch(`/api/social/posts/${post.id}/pin`, { method: "POST" });
                          onRefresh();
                          toast({ title: post.pinned ? "Unpinned" : "Pinned to profile" });
                        } catch {}
                      }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground/70 hover:bg-muted/30 transition-colors" data-testid={`button-pin-${post.id}`}>
                        <MapPin size={13} /> {post.pinned ? "Unpin" : "Pin to profile"}
                      </button>
                    </>
                  )}
                  <button onClick={() => { setShowMore(false); toast({ title: "Post reported" }); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground/70 hover:bg-muted/30 transition-colors" data-testid={`button-report-${post.id}`}>
                    <Flag size={13} /> Report
                  </button>
                </div>
              )}
            </div>
          </div>

          {showComments && (
            <div className="mt-3 pt-3 border-t border-border/20 space-y-3" data-testid={`comments-section-${post.id}`}>
              {currentProfileId && (
                <div className="flex items-center gap-2">
                  <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..."
                    className="flex-1 px-3 py-1.5 text-xs border border-border/30 rounded-full focus:outline-none focus:border-purple-300 bg-muted/10" data-testid={`input-comment-${post.id}`}
                    onKeyDown={e => e.key === "Enter" && handlePostComment()} />
                  <button onClick={handlePostComment} disabled={postingComment || !newComment.trim()} data-testid={`button-post-comment-${post.id}`}
                    className="px-3 py-1.5 text-xs font-medium bg-purple-500 text-white rounded-full hover:bg-purple-600 disabled:opacity-40 transition-colors">
                    {postingComment ? "..." : "Reply"}
                  </button>
                </div>
              )}
              {comments.length === 0 ? (
                <p className="text-xs text-muted-foreground/40 text-center py-2">No comments yet</p>
              ) : comments.map(c => (
                <div key={c.id} className="flex gap-2" data-testid={`comment-${c.id}`}>
                  <SocialAvatar src={c.profile?.avatar || undefined} name={c.profile?.displayName || "User"} size="sm" />
                  <div className="flex-1 bg-muted/20 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold">{c.profile?.displayName || "User"}</span>
                      <span className="text-[10px] text-muted-foreground/40">{socialTimeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-xs text-foreground/80 mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-base mb-2">Delete post?</h3>
            <p className="text-sm text-muted-foreground mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 border border-border/40 rounded-lg text-sm hover:bg-muted/20 transition-colors" data-testid="button-cancel-delete">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors" data-testid="button-confirm-delete">Delete</button>
            </div>
          </div>
        </div>
      )}

      {lightbox && post.mediaUrl && post.mediaType === "image" && (
        <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4 cursor-pointer" onClick={() => setLightbox(false)} data-testid={`lightbox-${post.id}`}>
          <img src={post.mediaUrl} alt="Full size" className="max-w-full max-h-full object-contain rounded-lg" />
          <button className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"><X size={24} /></button>
        </div>
      )}
    </div>
  );
}

function ProfileView({ username, currentProfileId, onProfileClick, onBack }: { username: string; currentProfileId: number | null; onProfileClick: (username: string) => void; onBack: () => void }) {
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [posts, setPosts] = useState<SocialPostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"posts" | "likes" | "media">("posts");
  const [likedPosts, setLikedPosts] = useState<SocialPost[]>([]);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFollowList, setShowFollowList] = useState<"followers" | "following" | null>(null);
  const isOwn = profile && currentProfileId === profile.id;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/social/profiles/${username}`).then(r => r.json()).then(data => {
      setProfile(data.profile || data);
      setFollowerCount(data.followerCount || 0);
      setFollowingCount(data.followingCount || 0);
      setPostCount(data.postCount || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (!profile) return;
    fetch(`/api/social/feed?profileId=${profile.id}`).then(r => r.json()).then(data => setPosts(Array.isArray(data) ? data : data.posts || [])).catch(() => {});
  }, [profile]);

  useEffect(() => {
    if (!profile || activeTab !== "likes") return;
    fetch(`/api/social/liked/${profile.id}`).then(r => r.json()).then(data => setLikedPosts(Array.isArray(data) ? data : [])).catch(() => {});
  }, [profile, activeTab]);

  useEffect(() => {
    if (!profile || !currentProfileId || currentProfileId === profile.id) return;
    fetch(`/api/social/follow/check?followerId=${currentProfileId}&followingId=${profile.id}`).then(r => r.json()).then(data => setFollowing(data.following)).catch(() => {});
  }, [profile, currentProfileId]);

  const handleFollow = async () => {
    if (!currentProfileId || !profile) return;
    try {
      const r = await fetch(`/api/social/follow/${profile.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ followerId: currentProfileId }) });
      if (r.ok) { const data = await r.json(); setFollowing(data.following); setFollowerCount(data.followerCount); }
    } catch {}
  };

  const mediaPosts = useMemo(() => posts.filter(p => p.mediaUrl && (p.mediaType === "image" || p.mediaType === "video")), [posts]);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-40 bg-muted/30 rounded-xl" />
      <div className="flex gap-4 px-4"><div className="w-20 h-20 rounded-full bg-muted/40" /><div className="flex-1 space-y-2 pt-4"><div className="h-4 bg-muted/30 rounded w-1/3" /><div className="h-3 bg-muted/30 rounded w-1/2" /></div></div>
    </div>
  );

  if (!profile) return <div className="p-8 text-center text-muted-foreground">Profile not found</div>;

  return (
    <div className="space-y-0" data-testid={`profile-view-${username}`}>
      <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2" data-testid="button-back-to-feed">
        <ChevronRight size={14} className="rotate-180" /> Back
      </button>

      <div className="relative">
        <div className="h-36 rounded-t-xl overflow-hidden bg-gradient-to-r from-purple-400 via-pink-300 to-blue-400">
          {profile.coverImage && <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />}
        </div>
        <div className="absolute -bottom-10 left-4">
          <SocialAvatar src={profile.avatar || undefined} name={profile.displayName} size="xl" verified={profile.verified || false} />
        </div>
      </div>

      <div className="pt-12 px-4 pb-4 bg-white border border-border/30 border-t-0 rounded-b-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-1.5" data-testid="text-profile-name">{profile.displayName}
              {profile.verified && <CheckCircle2 size={16} className="text-blue-500 fill-blue-500" />}</h2>
            <p className="text-sm text-muted-foreground" data-testid="text-profile-username">@{profile.username}</p>
          </div>
          {isOwn ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowEditProfile(true)} className="px-4 py-1.5 border border-border/40 rounded-full text-sm font-medium hover:bg-muted/20 transition-colors" data-testid="button-edit-profile">Edit profile</button>
              {!profile.verified && (
                <a href="https://buy.stripe.com/14AbJ086kdeH7mMgSi6Ri03" target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-medium hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-1.5 shadow-sm" data-testid="button-buy-verified">
                  <CheckCircle2 size={12} /> Get Verified $1.49
                </a>
              )}
            </div>
          ) : currentProfileId ? (
            <button onClick={handleFollow} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${following ? "border border-border/40 hover:border-red-300 hover:text-red-500" : "bg-purple-500 text-white hover:bg-purple-600"}`} data-testid="button-follow-toggle">
              {following ? "Following" : "Follow"}
            </button>
          ) : null}
        </div>

        {profile.bio && <p className="mt-3 text-sm text-foreground/80" data-testid="text-profile-bio">{profile.bio}</p>}

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
          {profile.location && <span className="flex items-center gap-1"><MapPin size={12} />{profile.location}</span>}
          {profile.website && <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-purple-500 hover:underline"><Link2 size={12} />{profile.website}</a>}
          <span className="flex items-center gap-1"><Calendar size={12} />Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
        </div>

        <div className="flex items-center gap-4 mt-3">
          <button onClick={() => setShowFollowList("following")} className="text-sm hover:underline" data-testid="button-following-count"><strong>{followingCount}</strong> <span className="text-muted-foreground">Following</span></button>
          <button onClick={() => setShowFollowList("followers")} className="text-sm hover:underline" data-testid="button-follower-count"><strong>{followerCount}</strong> <span className="text-muted-foreground">Followers</span></button>
          <span className="text-sm text-muted-foreground" data-testid="text-post-count">{postCount} posts</span>
        </div>
      </div>

      <div className="flex border-b border-border/30 bg-white rounded-t-xl mt-3">
        {(["posts", "likes", "media"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"}`} data-testid={`tab-profile-${tab}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-purple-500 rounded-full" />}
          </button>
        ))}
      </div>

      <div className="space-y-3 mt-3">
        {activeTab === "posts" && posts.map(post => (
          <SocialPostCard key={post.id} post={post} currentProfileId={currentProfileId} onProfileClick={onProfileClick} onRefresh={() => {
            fetch(`/api/social/feed?profileId=${profile.id}`).then(r => r.json()).then(data => setPosts(Array.isArray(data) ? data : data.posts || [])).catch(() => {});
          }} />
        ))}
        {activeTab === "media" && (
          mediaPosts.length === 0 ? (
            <div className="bg-white border border-border/30 rounded-xl p-8 text-center">
              <Image size={32} className="mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-sm text-muted-foreground/50">No media posts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
              {mediaPosts.map(post => (
                <div key={post.id} className="aspect-square bg-muted/20 cursor-pointer" data-testid={`media-grid-${post.id}`}>
                  {post.mediaType === "image" && <img src={post.mediaUrl!} alt="" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />}
                  {post.mediaType === "video" && <div className="w-full h-full flex items-center justify-center bg-zinc-900"><Video size={24} className="text-white/60" /></div>}
                </div>
              ))}
            </div>
          )
        )}
        {activeTab === "likes" && (
          likedPosts.length === 0 ? (
            <div className="bg-white border border-border/30 rounded-xl p-8 text-center">
              <Heart size={32} className="mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-sm text-muted-foreground/50">No liked posts yet</p>
            </div>
          ) : likedPosts.map(post => (
            <SocialPostCard key={post.id} post={post} currentProfileId={currentProfileId} onProfileClick={onProfileClick} onRefresh={() => {
              fetch(`/api/social/liked/${profile!.id}`).then(r => r.json()).then(data => setLikedPosts(Array.isArray(data) ? data : [])).catch(() => {});
            }} />
          ))
        )}
        {posts.length === 0 && activeTab === "posts" && (
          <div className="bg-white border border-border/30 rounded-xl p-8 text-center">
            <MessageCircle size={32} className="mx-auto text-muted-foreground/20 mb-2" />
            <p className="text-sm text-muted-foreground/50">No posts yet</p>
          </div>
        )}
      </div>

      {showEditProfile && profile && (
        <EditProfileModal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} profile={profile}
          onUpdated={(p) => { setProfile(p); }} />
      )}
      {showFollowList && profile && (
        <FollowListModal isOpen={!!showFollowList} onClose={() => setShowFollowList(null)} profileId={profile.id} type={showFollowList} onProfileClick={onProfileClick} />
      )}
    </div>
  );
}

function WhoToFollow({ currentProfileId, onProfileClick }: { currentProfileId: number | null; onProfileClick: (username: string) => void }) {
  const [suggestions, setSuggestions] = useState<SocialProfile[]>([]);

  useEffect(() => {
    fetch("/api/social/profiles/search/all").then(r => r.json()).then(data => {
      const filtered = (Array.isArray(data) ? data : []).filter((p: SocialProfile) => p.id !== currentProfileId).slice(0, 5);
      setSuggestions(filtered);
    }).catch(() => {});
  }, [currentProfileId]);

  if (suggestions.length === 0) return null;
  return (
    <div className="bg-white border border-border/30 rounded-xl p-4" data-testid="who-to-follow">
      <h3 className="font-semibold text-sm mb-3">Who to follow</h3>
      <div className="space-y-3">
        {suggestions.map(p => (
          <button key={p.id} onClick={() => onProfileClick(p.username)} className="w-full flex items-center gap-3 text-left hover:bg-muted/10 rounded-lg p-1.5 -m-1.5 transition-colors" data-testid={`suggestion-${p.username}`}>
            <SocialAvatar src={p.avatar || undefined} name={p.displayName} size="sm" verified={p.verified || false} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{p.displayName}</div>
              <div className="text-[10px] text-muted-foreground">@{p.username}</div>
            </div>
            <UserPlus size={14} className="text-muted-foreground/40 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

function SocialSearchBar({ onProfileClick }: { onProfileClick: (username: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SocialProfile[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timeout = setTimeout(() => {
      fetch(`/api/social/profiles/search/${encodeURIComponent(query)}`).then(r => r.json()).then(data => {
        setResults(Array.isArray(data) ? data : []);
        setShowResults(true);
      }).catch(() => {});
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="relative" data-testid="social-search">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
        <input value={query} onChange={e => setQuery(e.target.value)} onFocus={() => results.length > 0 && setShowResults(true)} onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Search people..." className="w-full pl-9 pr-3 py-2 text-sm border border-border/30 rounded-full bg-muted/10 focus:outline-none focus:border-purple-300 focus:bg-white transition-all" data-testid="input-social-search" />
      </div>
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border/30 rounded-xl shadow-xl z-50 overflow-hidden">
          {results.map(p => (
            <button key={p.id} onClick={() => { onProfileClick(p.username); setQuery(""); setShowResults(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/20 transition-colors text-left" data-testid={`search-result-${p.username}`}>
              <SocialAvatar src={p.avatar || undefined} name={p.displayName} size="sm" verified={p.verified || false} />
              <div>
                <div className="text-sm font-semibold">{p.displayName}</div>
                <div className="text-xs text-muted-foreground">@{p.username}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SocialPage() {
  const [currentProfileId, setCurrentProfileId] = useState<number | null>(() => {
    const id = localStorage.getItem("social_profile_id");
    return id ? parseInt(id, 10) : null;
  });
  const [currentProfile, setCurrentProfile] = useState<SocialProfile | null>(null);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  const [feedTab, setFeedTab] = useState<"foryou" | "following" | "trending">("foryou");
  const [posts, setPosts] = useState<SocialPostWithProfile[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedPage, setFeedPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const feedScrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (currentProfileId) {
      const storedUsername = localStorage.getItem("social_username");
      if (storedUsername) {
        fetch(`/api/social/profiles/${storedUsername}`).then(r => r.json()).then(data => {
          setCurrentProfile(data.profile || data);
        }).catch(() => { setCurrentProfileId(null); localStorage.removeItem("social_profile_id"); localStorage.removeItem("social_username"); });
      }
    } else {
      setShowCreateProfile(true);
    }
  }, [currentProfileId]);

  const fetchFeed = useCallback(async (page: number, reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (page === 1) setLoadingFeed(true); else setLoadingMore(true);
    try {
      let url = "/api/social/feed?page=" + page;
      if (feedTab === "trending") url = "/api/social/feed/trending?page=" + page;
      if (feedTab === "following" && currentProfileId) url = `/api/social/feed/following?profileId=${currentProfileId}&page=${page}`;
      const r = await fetch(url);
      const data = await r.json();
      const newPosts = Array.isArray(data) ? data : data.posts || [];
      setPosts(prev => {
        if (reset || page === 1) return newPosts;
        const existingIds = new Set(prev.map(p => p.id));
        return [...prev, ...newPosts.filter((p: SocialPostWithProfile) => !existingIds.has(p.id))];
      });
      setHasMore(Array.isArray(data) ? newPosts.length >= 20 : data.hasMore !== false);
      setFeedPage(page);
    } catch {}
    setLoadingFeed(false);
    setLoadingMore(false);
    loadingRef.current = false;
  }, [feedTab, currentProfileId]);

  useEffect(() => { setPosts([]); setFeedPage(1); setHasMore(true); fetchFeed(1, true); }, [feedTab, fetchFeed]);

  useEffect(() => {
    const el = feedScrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 400 && hasMore && !loadingRef.current) {
        fetchFeed(feedPage + 1);
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [feedPage, hasMore, fetchFeed]);

  const handleProfileClick = (username: string) => { setViewingProfile(username); };
  const handleBackToFeed = () => setViewingProfile(null);
  const refreshFeed = () => { setPosts([]); fetchFeed(1, true); };

  useEffect(() => { document.title = "Social - My Ai Gpt"; }, []);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-purple-50/30 to-background" data-testid="social-page">
      <div className="p-4 border-b border-border/20 bg-white/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10"><Users size={18} className="text-purple-500" /></div>
            <div>
              <h1 className="font-bold text-lg text-foreground" data-testid="text-social-title">Social</h1>
              <p className="text-[10px] text-muted-foreground/60">Connect with the community</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentProfile && (
              <button onClick={() => handleProfileClick(currentProfile.username)} className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-muted/20 transition-colors" data-testid="button-my-profile">
                <SocialAvatar src={currentProfile.avatar || undefined} name={currentProfile.displayName} size="sm" verified={currentProfile.verified || false} />
                <span className="text-xs font-medium hidden sm:inline">{currentProfile.displayName}</span>
              </button>
            )}
            <button onClick={refreshFeed} className="p-1.5 rounded-lg hover:bg-purple-50 text-muted-foreground hover:text-purple-500 transition-colors" title="Refresh" data-testid="button-refresh-social">
              <RefreshCw size={14} className={loadingFeed ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto p-4" ref={feedScrollRef}>
          {viewingProfile ? (
            <ProfileView username={viewingProfile} currentProfileId={currentProfileId} onProfileClick={handleProfileClick} onBack={handleBackToFeed} />
          ) : (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="hidden sm:block">
                <SocialSearchBar onProfileClick={handleProfileClick} />
              </div>

              {currentProfileId && (
                <PostComposer profileId={currentProfileId} onPosted={refreshFeed} />
              )}

              <div className="flex bg-white border border-border/30 rounded-xl overflow-hidden">
                {([["foryou", "For You", TrendingUp], ["following", "Following", Users], ["trending", "Trending", Heart]] as const).map(([key, label, Icon]) => (
                  <button key={key} onClick={() => setFeedTab(key as any)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors relative ${feedTab === key ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"}`} data-testid={`tab-feed-${key}`}>
                    <Icon size={14} />{label}
                    {feedTab === key && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-purple-500 rounded-full" />}
                  </button>
                ))}
              </div>

              {loadingFeed && posts.length === 0 ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-white border border-border/30 rounded-xl p-4 animate-pulse">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted/40" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-muted/30 rounded w-1/3" />
                          <div className="h-3 bg-muted/30 rounded w-full" />
                          <div className="h-3 bg-muted/30 rounded w-2/3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white border border-border/30 rounded-xl p-12 text-center">
                  <MessageCircle size={40} className="mx-auto text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground/60 mb-1">{feedTab === "following" ? "No posts from people you follow" : "No posts yet"}</p>
                  <p className="text-xs text-muted-foreground/40">{feedTab === "following" ? "Follow people to see their posts here" : "Be the first to post something!"}</p>
                </div>
              ) : (
                <>
                  {posts.map(post => (
                    <SocialPostCard key={post.id} post={post} currentProfileId={currentProfileId} onProfileClick={handleProfileClick} onRefresh={refreshFeed} />
                  ))}
                  {loadingMore && (
                    <div className="flex justify-center py-6">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <RefreshCw size={14} className="animate-spin text-purple-500" />Loading more...
                      </div>
                    </div>
                  )}
                  {!hasMore && posts.length > 0 && (
                    <div className="text-center py-6">
                      <p className="text-xs text-muted-foreground/40">You've seen all posts</p>
                      <button onClick={refreshFeed} className="mt-2 px-4 py-1.5 text-xs font-medium text-purple-500 border border-purple-200 rounded-full hover:bg-purple-50 transition-colors" data-testid="button-load-fresh-social">Refresh</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="hidden lg:block w-72 p-4 border-l border-border/20 overflow-y-auto space-y-4">
          <div className="sm:hidden">
            <SocialSearchBar onProfileClick={handleProfileClick} />
          </div>
          <WhoToFollow currentProfileId={currentProfileId} onProfileClick={handleProfileClick} />
          {currentProfile && (
            <div className="bg-white border border-border/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <SocialAvatar src={currentProfile.avatar || undefined} name={currentProfile.displayName} size="md" verified={currentProfile.verified || false} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{currentProfile.displayName}</div>
                  <div className="text-xs text-muted-foreground">@{currentProfile.username}</div>
                </div>
              </div>
              <button onClick={() => handleProfileClick(currentProfile.username)} className="w-full py-1.5 text-xs font-medium text-purple-500 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors" data-testid="button-view-my-profile">View Profile</button>
            </div>
          )}
          <div className="text-[9px] text-muted-foreground/30 text-center">Quantum Pulse Intelligence</div>
        </div>
      </div>

      <CreateProfileModal isOpen={showCreateProfile && !currentProfileId} onClose={() => setShowCreateProfile(false)} onCreated={(p) => { setCurrentProfileId(p.id); setCurrentProfile(p); setShowCreateProfile(false); }} />
    </div>
  );
}

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

function HomePage() {
  useEffect(() => { updateSEO({ title: "My Ai Gpt - AI Chat Assistant That Learns You | by Billy Banks", description: "Chat with My Ai Gpt, your AI best friend that learns your interests. Ask anything, get personalized answers. Free AI chat powered by Quantum Pulse Intelligence. By Billy Banks.", ogTitle: "My Ai Gpt - AI Chat Assistant | Billy Banks", ogDesc: "Your AI best friend that learns you. Chat about anything. Free, personalized, intelligent.", ogType: "website", canonical: window.location.origin + "/", keywords: "AI chat, AI assistant, chatbot, Billy Banks, My Ai Gpt, free AI, personalized AI, Quantum Pulse Intelligence, GPT chat, AI companion, smart assistant", author: "Billy Banks", articleSection: "Artificial Intelligence", jsonLd: { "@context": "https://schema.org", "@type": "WebPage", "name": "My Ai Gpt - AI Chat", "description": "AI Chat Assistant that learns your interests", "url": window.location.origin + "/", "isPartOf": { "@type": "WebApplication", "name": "My Ai Gpt" }, "author": { "@type": "Person", "name": "Billy Banks" }, "breadcrumb": { "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Home", "item": window.location.origin + "/" }] } } }); }, []);
  return <Layout><ChatInterface defaultType="general" /></Layout>;
}
function CoderPage() {
  useEffect(() => { updateSEO({ title: "My Ai Coder - AI Programming Assistant | Write Code with AI | My Ai Gpt", description: "Write code with AI assistance. My Ai Coder helps you debug, refactor, and build in any programming language. Python, JavaScript, TypeScript, Java, C++, Go, Rust and more. By Billy Banks.", ogTitle: "My Ai Coder - AI Programming Assistant", ogDesc: "AI-powered coding assistant for any language. Debug, refactor, build faster.", ogType: "website", canonical: window.location.origin + "/coder", keywords: "AI coding assistant, code helper, programming AI, debug code, refactor code, Billy Banks, Python AI, JavaScript AI, code generation, AI programmer", author: "Billy Banks", articleSection: "Programming", jsonLd: { "@context": "https://schema.org", "@type": "WebPage", "name": "My Ai Coder", "description": "AI-powered programming assistant", "url": window.location.origin + "/coder", "isPartOf": { "@type": "WebApplication", "name": "My Ai Gpt" }, "breadcrumb": { "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Home", "item": window.location.origin + "/" }, { "@type": "ListItem", "position": 2, "name": "AI Coder", "item": window.location.origin + "/coder" }] } } }); }, []);
  return <Layout><ChatInterface defaultType="coder" /></Layout>;
}
function PlaygroundPage() {
  useEffect(() => { updateSEO({ title: "Code Playground - Write & Run Code in 30+ Languages Online Free | My Ai Gpt", description: "Free online code playground IDE by Billy Banks. Write, run, and share code in JavaScript, Python, TypeScript, HTML/CSS, Java, C++, Go, Rust, Ruby, PHP, Swift, Kotlin and 20+ more languages with real-time preview and AI assistance.", ogTitle: "Code Playground - 30+ Languages Free Online IDE", ogDesc: "Free online IDE with 30+ languages. Write JavaScript, Python, TypeScript, HTML, and more with real-time preview.", ogType: "website", canonical: window.location.origin + "/code", keywords: "online code editor, free IDE, code playground, JavaScript editor, Python editor, online compiler, run code online, free coding, code runner, Billy Banks, programming playground, HTML CSS editor, TypeScript playground", author: "Billy Banks", articleSection: "Programming", jsonLd: { "@context": "https://schema.org", "@type": "WebPage", "name": "Code Playground", "description": "Write and run code in 30+ languages", "url": window.location.origin + "/code", "isPartOf": { "@type": "WebApplication", "name": "My Ai Gpt" }, "breadcrumb": { "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Home", "item": window.location.origin + "/" }, { "@type": "ListItem", "position": 2, "name": "Code Playground", "item": window.location.origin + "/code" }] } } }); }, []);
  return <Layout><CodePlayground /></Layout>;
}
function FeedPage() {
  useEffect(() => { updateSEO({ title: "My Ai Gpt Feed - Live News & Videos from BBC, NPR, NY Times & More", description: "Stay informed with live news from BBC, NPR, NY Times, The Verge, TechCrunch, Reuters, Associated Press, The Guardian, and more. Watch videos, search any topic. AI-personalized news feed by Billy Banks.", ogTitle: "My Ai Gpt Feed - Live News, Videos & Search", ogDesc: "Live news from BBC, NPR, NY Times, TechCrunch. Search any topic for news, web, and video results.", ogType: "website", canonical: window.location.origin + "/feed", keywords: "live news, news feed, BBC news, NPR news, NY Times, The Verge, TechCrunch, trending news, video news, AI news, personalized news, Billy Banks, news aggregator, world news, tech news, video search", author: "Billy Banks", articleSection: "News", jsonLd: { "@context": "https://schema.org", "@type": "CollectionPage", "name": "My Ai Gpt Feed", "description": "Live news and video feed with AI personalization", "url": window.location.origin + "/feed", "isPartOf": { "@type": "WebApplication", "name": "My Ai Gpt" }, "author": { "@type": "Person", "name": "Billy Banks" }, "breadcrumb": { "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Home", "item": window.location.origin + "/" }, { "@type": "ListItem", "position": 2, "name": "News Feed", "item": window.location.origin + "/feed" }] } } }); }, []);
  return <Layout><NewsFeed /></Layout>;
}
// ─── AI STUDIO PAGE (Image + Video Generation) ──────────────────────────────

function AIStudioPage() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"image" | "video">("image");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [gallery, setGallery] = useState<Array<{ url: string; prompt: string; type: "image" | "video"; timestamp: number }>>(() => {
    try { return JSON.parse(localStorage.getItem("ai_studio_gallery") || "[]"); } catch { return []; }
  });
  const [selectedStyle, setSelectedStyle] = useState("realistic");
  const [resolution, setResolution] = useState("512");
  const [duration, setDuration] = useState("4");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const { toast } = useToast();

  const styles = [
    { id: "realistic", name: "Realistic", desc: "Photorealistic rendering" },
    { id: "abstract", name: "Abstract Art", desc: "Creative abstract patterns" },
    { id: "space", name: "Cosmic", desc: "Space and galaxy themes" },
    { id: "city", name: "Urban", desc: "City skylines and architecture" },
    { id: "nature", name: "Nature", desc: "Forests, mountains, oceans" },
    { id: "flower", name: "Floral", desc: "Flowers and botanical art" },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setResult(null);
    try {
      const styleMap: Record<string, string> = {
        realistic: "photorealistic, detailed, high quality, 4k",
        abstract: "abstract art, creative, colorful, artistic",
        space: "cosmic, space, galaxy, nebula, stars, sci-fi",
        city: "urban, architecture, city skyline, metropolitan",
        nature: "nature photography, landscape, forests, mountains",
        flower: "floral, botanical illustration, flowers, garden",
      };
      const styleDesc = styleMap[selectedStyle] || "";
      const fullPrompt = `${prompt.trim()}, ${styleDesc}`;
      toast({ title: "AI Studio is coming soon!", description: "Billy Banks is building the ultimate creator tool for you." });
      trackInteraction("ai_studio", { text: prompt, contentType: mode });
    } catch (err) {
      console.error("Generation error:", err);
      toast({ title: "Generation failed. Try a different prompt.", variant: "destructive" });
    }
    setGenerating(false);
  };

  const handleDownload = (url: string, type: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `myaigpt_${type}_${Date.now()}.${type === "image" ? "png" : "webm"}`;
    a.click();
    toast({ title: "Download started!" });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shadow-xl">
            <Paintbrush size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1" data-testid="text-studio-title">AI Studio</h1>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-pink-500/10 via-violet-500/10 to-pink-500/10 rounded-full border border-pink-200/50 mt-1 mb-1 relative overflow-hidden animate-[float-glow_3s_ease-in-out_infinite]">
            <Sparkles size={14} className="text-pink-500" />
            <span className="text-sm font-bold bg-gradient-to-r from-pink-500 to-violet-600 bg-clip-text text-transparent">Coming Soon</span>
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2.5s_infinite]" />
          </div>
          <p className="text-muted-foreground text-sm mt-1">AI Image & Video Generation — Billy Banks is building something incredible</p>
        </div>

        <div className="bg-white border border-border/30 rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex gap-2 mb-4">
            <button onClick={() => setMode("image")} data-testid="button-mode-image"
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === "image" ? "bg-pink-500 text-white shadow-md" : "bg-muted/30 text-foreground/60 hover:bg-muted/50"}`}>
              <ImagePlus size={16} /> Image
            </button>
            <button onClick={() => setMode("video")} data-testid="button-mode-video"
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === "video" ? "bg-violet-500 text-white shadow-md" : "bg-muted/30 text-foreground/60 hover:bg-muted/50"}`}>
              <VideoIcon size={16} /> Video
            </button>
          </div>

          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={mode === "image" ? "Describe any image... (e.g., a rabbit jumping in a meadow, a futuristic city at night, a portrait of a cat wearing a hat)" : "Describe the animation you want... (e.g., ocean waves, floating particles, colorful aurora)"} data-testid="input-studio-prompt"
            className="w-full px-4 py-3 border border-border/40 rounded-xl text-sm focus:outline-none focus:border-pink-300 resize-none placeholder:text-muted-foreground/40" rows={3} />
          <div className="mt-2 flex items-center gap-2 px-1">
            <Clock size={12} className="text-muted-foreground/40" />
            <span className="text-[10px] text-muted-foreground/40">This feature is coming soon — stay tuned!</span>
          </div>

          <div className="mt-4">
            <div className="text-xs font-medium text-muted-foreground mb-2">Art Style</div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {styles.map(s => (
                <button key={s.id} onClick={() => setSelectedStyle(s.id)} data-testid={`button-style-${s.id}`}
                  className={`p-2 rounded-lg text-center transition-all ${selectedStyle === s.id ? "bg-pink-50 border-2 border-pink-400 shadow-sm" : "border border-border/30 hover:border-border/60"}`}>
                  <div className="text-xs font-medium">{s.name}</div>
                  <div className="text-[10px] text-muted-foreground/60">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            {mode === "image" ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Resolution:</span>
                <select value={resolution} onChange={e => setResolution(e.target.value)} data-testid="select-resolution"
                  className="text-xs px-2 py-1.5 border border-border/30 rounded-lg bg-white">
                  <option value="256">256x256</option>
                  <option value="512">512x512</option>
                  <option value="768">768x768</option>
                  <option value="1024">1024x1024</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Duration:</span>
                <select value={duration} onChange={e => setDuration(e.target.value)} data-testid="select-duration"
                  className="text-xs px-2 py-1.5 border border-border/30 rounded-lg bg-white">
                  <option value="2">2 seconds</option>
                  <option value="4">4 seconds</option>
                  <option value="6">6 seconds</option>
                  <option value="8">8 seconds</option>
                </select>
              </div>
            )}
            <button disabled={true} data-testid="button-generate"
              className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-500/50 to-violet-500/50 text-white/70 rounded-xl text-sm font-medium cursor-not-allowed transition-all relative overflow-hidden">
              <Wand size={16} /> Coming Soon
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_3s_infinite]" />
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white border border-border/30 rounded-2xl p-4 shadow-sm mb-6" data-testid="studio-result">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Aperture size={14} className="text-pink-500" /> Generated {mode}</h3>
              <button onClick={() => handleDownload(result, mode)} data-testid="button-download-result"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/30 text-sm rounded-lg hover:bg-muted/50 transition-colors">
                <Download size={14} /> Download
              </button>
            </div>
            {mode === "image" ? (
              <img src={result} alt="Generated" className="w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setLightbox(result)} data-testid="img-result" />
            ) : (
              <video src={result} controls autoPlay loop className="w-full rounded-xl" data-testid="video-result" />
            )}
          </div>
        )}

        {gallery.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><FolderOpen size={14} /> Gallery ({gallery.length})</h3>
              <button onClick={() => { setGallery([]); localStorage.removeItem("ai_studio_gallery"); toast({ title: "Gallery cleared" }); }}
                className="text-xs text-red-400 hover:text-red-600 transition-colors" data-testid="button-clear-gallery">Clear all</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {gallery.map((item, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-border/20 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => item.type === "image" ? setLightbox(item.url) : undefined} data-testid={`gallery-item-${i}`}>
                  {item.type === "image" ? (
                    <img src={item.url} alt={item.prompt} className="w-full aspect-square object-cover" />
                  ) : (
                    <video src={item.url} className="w-full aspect-square object-cover" muted />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white text-[10px] line-clamp-2">{item.prompt}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-white/60">{item.type === "image" ? "Image" : "Video"}</span>
                        <button onClick={e => { e.stopPropagation(); handleDownload(item.url, item.type); }}
                          className="text-white/80 hover:text-white"><Download size={11} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {gallery.length === 0 && !result && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/30 flex items-center justify-center">
              <ImagePlus size={28} className="text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground/50">AI Studio is coming soon!</p>
            <p className="text-xs text-muted-foreground/30 mt-1">Billy Banks is building the ultimate AI image & video generator for you</p>
            <p className="text-xs text-muted-foreground/30 mt-3">💡 <strong>Tip:</strong> You can already generate images in the chat! Just ask My Ai Gpt to "make a picture of..." anything</p>
          </div>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 p-2 text-white/60 hover:text-white"><X size={24} /></button>
          <img src={lightbox} alt="Fullscreen" className="max-w-full max-h-full rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}

// ─── PERMISSIONS PAGE ────────────────────────────────────────────────────────

function SettingsPage() {
  const { settings, update } = useAppSettings();
  const { permissions, loading: permLoading, requestPermission, refresh } = useDevicePermissions();
  const [locationData, setLocationData] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<string>("appearance");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    granted: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400", label: "Allowed" },
    denied: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", label: "Blocked" },
    prompt: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", label: "Not Set" },
    unavailable: { bg: "bg-gray-50 dark:bg-gray-800/20", text: "text-gray-400", label: "Unavailable" },
    checking: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-400", label: "Checking..." },
  };

  const handlePermRequest = async (id: string) => {
    await requestPermission(id);
    if (id === "geolocation") {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true }));
        setLocationData({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        toast({ title: "Location accessed!", description: `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}` });
      } catch { toast({ title: "Location access denied", variant: "destructive" }); }
    } else { toast({ title: "Permission updated" }); }
  };

  const pages = [
    { id: "playground", name: "Playground", icon: SquareTerminal, color: "text-emerald-600", desc: "Code IDE with 30+ languages" },
    { id: "feed", name: "Feed", icon: Newspaper, color: "text-orange-600", desc: "News & video feed" },
    { id: "social", name: "Social", icon: Users, color: "text-purple-600", desc: "Public social network" },
    { id: "create", name: "AI Studio", icon: Paintbrush, color: "text-pink-600", desc: "AI image & video generation" },
    { id: "coder", name: "My Ai Coder", icon: Code2, color: "text-blue-600", desc: "AI coding assistant" },
  ];

  const bgPresets = [
    { color: "#ffffff", name: "White" }, { color: "#f8fafc", name: "Snow" }, { color: "#fefce8", name: "Cream" },
    { color: "#f0fdf4", name: "Mint" }, { color: "#eff6ff", name: "Ice" }, { color: "#fdf4ff", name: "Lavender" },
    { color: "#fff7ed", name: "Peach" }, { color: "#f5f5f4", name: "Stone" },
    { color: "#1a1a2e", name: "Midnight" }, { color: "#0f172a", name: "Slate" }, { color: "#18181b", name: "Zinc" }, { color: "#1c1917", name: "Charcoal" },
  ];

  const accentPresets = [
    { color: "#f97316", name: "Orange" }, { color: "#3b82f6", name: "Blue" }, { color: "#8b5cf6", name: "Violet" },
    { color: "#10b981", name: "Emerald" }, { color: "#ec4899", name: "Pink" }, { color: "#ef4444", name: "Red" },
    { color: "#14b8a6", name: "Teal" }, { color: "#f59e0b", name: "Amber" },
  ];

  const sections = [
    { id: "appearance", name: "Appearance", icon: Palette },
    { id: "pages", name: "Pages", icon: Layers },
    { id: "chat", name: "Chat", icon: MessageSquare },
    { id: "feed-settings", name: "Feed", icon: Newspaper },
    { id: "permissions", name: "Permissions", icon: Shield },
    { id: "data", name: "Data & Privacy", icon: Database },
  ];

  const togglePage = (pageId: string) => {
    const hidden = settings.hiddenPages.includes(pageId) ? settings.hiddenPages.filter(p => p !== pageId) : [...settings.hiddenPages, pageId];
    update({ hiddenPages: hidden });
  };

  const ToggleSwitch = ({ on, onToggle, testId }: { on: boolean; onToggle: () => void; testId: string }) => (
    <div onClick={onToggle} data-testid={testId}
      className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${on ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"} relative`}>
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "left-[22px]" : "left-0.5"}`} />
    </div>
  );

  const handleResetAll = () => {
    update(defaultAppSettings);
    localStorage.removeItem("myaigpt_app_settings");
    setShowResetConfirm(false);
    toast({ title: "Settings reset to defaults" });
  };

  const handleExportData = () => {
    const data = {
      settings, chats: localStorage.getItem("myaigpt_msg_count"),
      userId: localStorage.getItem("myaigpt_user_id"),
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `myaigpt-settings-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Settings exported" });
  };

  const categories = useMemo(() => {
    const cats: Record<string, PermissionInfo[]> = {};
    for (const p of permissions) { if (!cats[p.category]) cats[p.category] = []; cats[p.category].push(p); }
    return cats;
  }, [permissions]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8" style={settings.bgColor !== "#ffffff" ? { backgroundColor: settings.bgColor } : undefined}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-400 flex items-center justify-center shadow-xl">
            <Settings2 size={24} className="text-white dark:text-gray-900" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-0.5" data-testid="text-settings-title">Settings</h1>
          <p className="text-muted-foreground text-sm">Customize your My Ai Gpt experience</p>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-hide -mx-4 px-4 md:-mx-0 md:px-0">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} data-testid={`settings-tab-${s.id}`}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${activeSection === s.id ? "bg-foreground text-background shadow-md" : "bg-muted/30 dark:bg-muted/10 text-muted-foreground hover:bg-muted/50"}`}>
              <s.icon size={13} /> {s.name}
            </button>
          ))}
        </div>

        {activeSection === "appearance" && (
          <div className="space-y-5" data-testid="settings-section-appearance">
            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Palette size={15} /> Theme</h3>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-sm font-medium">Dark Mode</div>
                  <div className="text-xs text-muted-foreground">Switch to dark theme</div>
                </div>
                <ToggleSwitch on={settings.darkMode} onToggle={() => update({ darkMode: !settings.darkMode })} testId="toggle-dark-mode" />
              </div>

              <div className="mb-5">
                <div className="text-sm font-medium mb-2">Background Color</div>
                <div className="grid grid-cols-4 gap-2">
                  {bgPresets.map(p => (
                    <button key={p.color} onClick={() => update({ bgColor: p.color })} data-testid={`bg-color-${p.name.toLowerCase()}`}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${settings.bgColor === p.color ? "border-orange-500 shadow-md" : "border-border/20 hover:border-border/50"}`}>
                      <div className="w-8 h-8 rounded-lg shadow-inner border border-black/10" style={{ backgroundColor: p.color }} />
                      <span className="text-[10px] text-muted-foreground">{p.name}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <label className="text-xs text-muted-foreground">Custom:</label>
                  <input type="color" value={settings.bgColor} onChange={e => update({ bgColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0" data-testid="input-custom-bg-color" />
                  <span className="text-xs text-muted-foreground font-mono">{settings.bgColor}</span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Accent Color</div>
                <div className="flex gap-2 flex-wrap">
                  {accentPresets.map(p => (
                    <button key={p.color} onClick={() => update({ accentColor: p.color })} data-testid={`accent-color-${p.name.toLowerCase()}`}
                      className={`w-9 h-9 rounded-full border-2 transition-all ${settings.accentColor === p.color ? "border-foreground scale-110 shadow-lg" : "border-transparent hover:scale-105"}`}
                      style={{ backgroundColor: p.color }} title={p.name} />
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Type size={15} /> Display</h3>
              <div className="mb-4">
                <div className="text-sm font-medium mb-2">Font Size</div>
                <div className="flex gap-2">
                  {(["small", "medium", "large"] as const).map(size => (
                    <button key={size} onClick={() => update({ fontSize: size })} data-testid={`font-size-${size}`}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${settings.fontSize === size ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600" : "border-border/30 hover:border-border"}`}>
                      <span style={{ fontSize: size === "small" ? 11 : size === "medium" ? 13 : 15 }}>Aa</span>
                      <div className="text-[10px] mt-0.5 capitalize">{size}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Compact Mode</div>
                  <div className="text-xs text-muted-foreground">Tighter spacing for more content</div>
                </div>
                <ToggleSwitch on={settings.compactMode} onToggle={() => update({ compactMode: !settings.compactMode })} testId="toggle-compact-mode" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><User size={15} /> Profile</h3>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Display Name</label>
                <input value={settings.displayName} onChange={e => update({ displayName: e.target.value })} placeholder="Your name (optional)"
                  className="w-full px-3 py-2 text-sm border border-border/30 rounded-lg focus:outline-none focus:border-orange-300 bg-muted/10 dark:bg-gray-800" data-testid="input-display-name" />
                <p className="text-[10px] text-muted-foreground/50 mt-1">Shown in social posts and comments</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === "pages" && (
          <div className="space-y-3" data-testid="settings-section-pages">
            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
              <h3 className="text-sm font-bold mb-1 flex items-center gap-2"><Layers size={15} /> Visible Pages</h3>
              <p className="text-xs text-muted-foreground mb-4">Toggle which pages appear in your sidebar. Hidden pages can still be accessed via URL.</p>
              <div className="space-y-2">
                {pages.map(pg => {
                  const isHidden = settings.hiddenPages.includes(pg.id);
                  return (
                    <div key={pg.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isHidden ? "border-border/20 opacity-50" : "border-border/30 bg-muted/5 dark:bg-gray-800/30"}`} data-testid={`page-toggle-${pg.id}`}>
                      <div className={`p-2 rounded-lg ${isHidden ? "bg-gray-100 dark:bg-gray-800" : "bg-muted/30"}`}>
                        <pg.icon size={16} className={isHidden ? "text-gray-400" : pg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{pg.name}</div>
                        <div className="text-[11px] text-muted-foreground">{pg.desc}</div>
                      </div>
                      <ToggleSwitch on={!isHidden} onToggle={() => togglePage(pg.id)} testId={`toggle-page-${pg.id}`} />
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground/50 px-1">
                <Lock size={10} /> My Ai Gpt (home) is always visible
              </div>
            </div>
          </div>
        )}

        {activeSection === "chat" && (
          <div className="space-y-3" data-testid="settings-section-chat">
            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5 space-y-5">
              <h3 className="text-sm font-bold flex items-center gap-2"><MessageSquare size={15} /> Chat Preferences</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Auto-Scroll</div>
                  <div className="text-xs text-muted-foreground">Scroll to new messages automatically</div>
                </div>
                <ToggleSwitch on={settings.autoScroll} onToggle={() => update({ autoScroll: !settings.autoScroll })} testId="toggle-auto-scroll" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Message Sound</div>
                  <div className="text-xs text-muted-foreground">Play a sound for new AI responses</div>
                </div>
                <ToggleSwitch on={settings.messageSound} onToggle={() => update({ messageSound: !settings.messageSound })} testId="toggle-message-sound" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Show Timestamps</div>
                  <div className="text-xs text-muted-foreground">Display time on each message</div>
                </div>
                <ToggleSwitch on={settings.showTimestamps} onToggle={() => update({ showTimestamps: !settings.showTimestamps })} testId="toggle-timestamps" />
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Chat Bubble Style</div>
                <div className="flex gap-2">
                  {(["rounded", "sharp", "minimal"] as const).map(style => (
                    <button key={style} onClick={() => update({ chatBubbleStyle: style })} data-testid={`bubble-style-${style}`}
                      className={`flex-1 py-3 px-2 border transition-all text-center ${settings.chatBubbleStyle === style ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-border/30 hover:border-border"} ${style === "rounded" ? "rounded-xl" : style === "sharp" ? "rounded-sm" : "rounded-none border-0 border-b-2"}`}>
                      <div className={`w-full h-6 bg-orange-200 dark:bg-orange-800 mb-1 ${style === "rounded" ? "rounded-lg" : style === "sharp" ? "rounded-sm" : ""}`} />
                      <span className="text-[10px] capitalize">{style}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "feed-settings" && (
          <div className="space-y-3" data-testid="settings-section-feed">
            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5 space-y-5">
              <h3 className="text-sm font-bold flex items-center gap-2"><Newspaper size={15} /> Feed Preferences</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Auto-Refresh</div>
                  <div className="text-xs text-muted-foreground">Automatically fetch new articles</div>
                </div>
                <ToggleSwitch on={settings.feedAutoRefresh} onToggle={() => update({ feedAutoRefresh: !settings.feedAutoRefresh })} testId="toggle-feed-auto-refresh" />
              </div>
              {settings.feedAutoRefresh && (
                <div>
                  <div className="text-sm font-medium mb-2">Refresh Interval</div>
                  <div className="flex gap-2">
                    {[1, 5, 15, 30].map(mins => (
                      <button key={mins} onClick={() => update({ feedRefreshInterval: mins })} data-testid={`feed-interval-${mins}`}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${settings.feedRefreshInterval === mins ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600" : "border-border/30 hover:border-border"}`}>
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "permissions" && (
          <div className="space-y-3" data-testid="settings-section-permissions">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{permissions.filter(p => p.status === "granted").length}/{permissions.length} enabled</span>
              <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors" data-testid="button-refresh-permissions">
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
            {permLoading ? (
              <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-muted/20 rounded-xl animate-pulse" />)}</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(categories).map(([cat, items]) => (
                  <div key={cat}>
                    <h3 className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest mb-2 px-1">{cat}</h3>
                    <div className="space-y-2">
                      {items.map(perm => {
                        const s = statusColors[perm.status] || statusColors.unavailable;
                        return (
                          <div key={perm.id} className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-4 flex items-center gap-4 transition-all hover:shadow-sm" data-testid={`permission-${perm.id}`}>
                            <div className={`p-2.5 rounded-xl ${s.bg}`}>
                              <perm.icon size={20} className={s.text} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{perm.name}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}>{s.label}</span>
                              </div>
                              <p className="text-xs text-muted-foreground/60 mt-0.5">{perm.desc}</p>
                            </div>
                            {perm.status !== "unavailable" && perm.status !== "granted" && (
                              <button onClick={() => handlePermRequest(perm.id)} data-testid={`button-request-${perm.id}`}
                                className="px-4 py-2 bg-teal-500 text-white rounded-xl text-xs font-medium hover:bg-teal-600 transition-colors shadow-sm whitespace-nowrap">Allow</button>
                            )}
                            {perm.status === "granted" && (
                              <button onClick={() => { if (confirm(`Revoke ${perm.name} permission? You may need to update your browser settings to fully disable this.`)) { handlePermRequest(perm.id); } }} data-testid={`button-revoke-${perm.id}`}
                                className="px-3 py-1.5 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-xl text-xs font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800 transition-colors whitespace-nowrap flex items-center gap-1.5">
                                <CheckCircle2 size={14} /> Allowed
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {locationData && (
              <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-4" data-testid="location-info">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Locate size={14} className="text-teal-500" /> Your Location</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[{ v: locationData.lat.toFixed(4), l: "Latitude" }, { v: locationData.lng.toFixed(4), l: "Longitude" }, { v: `${locationData.accuracy.toFixed(0)}m`, l: "Accuracy" }].map(d => (
                    <div key={d.l} className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-3">
                      <div className="text-lg font-bold text-teal-600 dark:text-teal-400">{d.v}</div>
                      <div className="text-[10px] text-teal-500/70">{d.l}</div>
                    </div>
                  ))}
                </div>
                <a href={`https://www.google.com/maps?q=${locationData.lat},${locationData.lng}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 mt-3 px-4 py-2 bg-teal-500 text-white rounded-xl text-xs font-medium hover:bg-teal-600 transition-colors" data-testid="link-open-maps">
                  <Navigation size={14} /> Open in Google Maps
                </a>
              </div>
            )}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl p-4 text-center">
              <Shield size={16} className="mx-auto mb-2 text-blue-400" />
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Your privacy matters</p>
              <p className="text-[10px] text-blue-400 mt-1">My Ai Gpt only uses permissions you allow. All data stays on your device. No tracking, no selling data.</p>
            </div>
          </div>
        )}

        {activeSection === "data" && (
          <div className="space-y-3" data-testid="settings-section-data">
            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><Database size={15} /> Data Management</h3>
              <button onClick={handleExportData} data-testid="button-export-data"
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:bg-muted/10 transition-colors text-left">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20"><Download size={16} className="text-blue-500" /></div>
                <div><div className="text-sm font-medium">Export Settings</div><div className="text-xs text-muted-foreground">Download your settings as JSON</div></div>
              </button>
              <button onClick={() => setShowResetConfirm(true)} data-testid="button-reset-settings"
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-200 dark:border-red-800/30 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left">
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20"><RotateCcw size={16} className="text-red-500" /></div>
                <div><div className="text-sm font-medium text-red-600 dark:text-red-400">Reset All Settings</div><div className="text-xs text-muted-foreground">Restore everything to defaults</div></div>
              </button>
              {showResetConfirm && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-4 text-center">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-3">Are you sure? This can't be undone.</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={handleResetAll} className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600" data-testid="button-confirm-reset">Reset</button>
                    <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300" data-testid="button-cancel-reset">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3"><Shield size={15} /> About</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Version</span><span className="font-mono">Beta Release 1</span></div>
                <div className="flex justify-between"><span>Created by</span><span className="font-medium">Billy Banks</span></div>
                <div className="flex justify-between"><span>Powered by</span><span>Quantum Pulse Intelligence</span></div>
              </div>
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 mt-4 px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-xs font-medium hover:bg-indigo-600 transition-colors" data-testid="link-discord-settings">
                <ExternalLink size={14} /> Join our Discord Community
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AIStudioPageWrapper() {
  useEffect(() => { updateSEO({ title: "AI Studio - Generate Images & Videos Free | My Ai Gpt", description: "Create stunning AI-generated images and videos for free. Multiple art styles, high resolution, instant download. By Billy Banks.", ogTitle: "AI Studio - Free Image & Video Generation", ogDesc: "Generate images and videos with AI. Multiple styles, free, instant.", canonical: window.location.origin + "/create", keywords: "AI image generator, AI video generator, free image generation, art generator, AI art, create images, generate video, Billy Banks" }); }, []);
  return <Layout><AIStudioPage /></Layout>;
}

function SettingsPageWrapper() {
  useEffect(() => { updateSEO({ title: "Settings - My Ai Gpt | Customize Your Experience", description: "Customize My Ai Gpt with dark mode, background colors, page visibility, permissions, chat preferences and more. By Billy Banks.", ogTitle: "Settings - My Ai Gpt", canonical: window.location.origin + "/settings" }); }, []);
  return <Layout><SettingsPage /></Layout>;
}

function SocialPageWrapper() {
  useEffect(() => { updateSEO({ title: "My Ai Gpt Social - Free Social Network | Create Profile, Post, Follow & Get Verified", description: "Join My Ai Gpt Social network by Billy Banks. Create your profile, share posts, follow friends, discover trending content, get a verified badge, and connect with the AI-powered community. Free to join.", ogTitle: "My Ai Gpt Social Network - Connect, Share & Discover", ogDesc: "Free social network powered by AI. Create profiles, share posts, follow friends, get verified. By Billy Banks.", ogType: "website", canonical: window.location.origin + "/social", keywords: "social network, social media, create profile, follow friends, verified badge, trending posts, share posts, social platform, Billy Banks, free social network, AI social, community, connect, discover", author: "Billy Banks", articleSection: "Social Network", jsonLd: { "@context": "https://schema.org", "@type": "CollectionPage", "name": "My Ai Gpt Social", "description": "AI-powered social network", "url": window.location.origin + "/social", "isPartOf": { "@type": "WebApplication", "name": "My Ai Gpt" }, "breadcrumb": { "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Home", "item": window.location.origin + "/" }, { "@type": "ListItem", "position": 2, "name": "Social", "item": window.location.origin + "/social" }] } } }); }, []);
  return <Layout><SocialPage /></Layout>;
}

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
      <Route path="/feed" component={FeedPage} />
      <Route path="/social" component={SocialPageWrapper} />
      <Route path="/create" component={AIStudioPageWrapper} />
      <Route path="/settings" component={SettingsPageWrapper} />
      <Route path="/permissions" component={SettingsPageWrapper} />
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
      <AppSettingsProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <Router />
        </QueryClientProvider>
      </AppSettingsProvider>
    </SettingsCtx.Provider>
  );
}
