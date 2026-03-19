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
  ExternalLink, CreditCard, Crown, Newspaper, MessageCircle, Clock, User, ChevronRight, ChevronLeft,
  Heart, Bookmark, Share2, Repeat2, MapPin, Calendar, Link2, AtSign, TrendingUp, Users, Camera, Image, Video, CheckCircle2, MoreHorizontal, Flag, UserPlus, UserMinus, Edit3,
  Volume2, VolumeX, Navigation, Bell, BellOff, Locate, ImagePlus, VideoIcon, Wand, Paintbrush, Aperture, PhoneCall,
  LogIn, LogOut, Mail, KeyRound, Gamepad2, Music, Languages, Smile, Gauge, Headphones, DollarSign, Gift, Banknote, ClipboardCopy, ArrowUpRight, Wallet,
  GraduationCap, ShoppingBag, Filter, SlidersHorizontal, ListFilter, Activity, BookMarked, Telescope
} from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import type { Chat, Message, FeedComment, SocialProfile, SocialPost, SocialComment } from "@shared/schema";
import logo from "@assets/myaigpt-logo.png";

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
function isPaidUser(): boolean { return localStorage.getItem("myaigpt_pro") === "true"; }
function isLimitReached(): boolean { if (isVIP() || isPaidUser()) return false; return getMessageCount() >= MESSAGE_LIMIT; }

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
  language: string;
  responseStyle: "concise" | "balanced" | "detailed";
  responseLength: "short" | "medium" | "long";
  aiPersonality: "professional" | "friendly" | "casual" | "mentor";
  useEmojis: boolean;
  greetingName: string;
  chatWallpaper: string;
  defaultPlaygroundLang: string;
  terminalTheme: string;
  codeFont: string;
  startupPage: string;
  messageDensity: "comfortable" | "cozy" | "compact";
  sidebarPosition: "left" | "right";
  sendWithEnter: boolean;
  showKeyboardShortcuts: boolean;
  timeFormat: "12h" | "24h";
  reduceAnimations: boolean;
  autoSaveCode: boolean;
  exportFormat: "markdown" | "text" | "json";
  notificationSound: "default" | "chime" | "bell" | "pop" | "none";
  showWordCount: boolean;
  enableCodeLens: boolean;
  chatFontSize: "small" | "medium" | "large";
  feedNewsPerPage: number;
  feedShowImages: boolean;
  feedCompactNews: boolean;
  feedTopCategories: string[];
};
const defaultAppSettings: AppSettings = {
  darkMode: false, bgColor: "#ffffff", accentColor: "#f97316", fontSize: "medium",
  hiddenPages: [], autoScroll: true, messageSound: false, compactMode: false,
  showTimestamps: true, feedAutoRefresh: false, feedRefreshInterval: 30,
  chatBubbleStyle: "rounded", displayName: "",
  language: "en", responseStyle: "balanced", responseLength: "medium",
  aiPersonality: "friendly", useEmojis: true, greetingName: "",
  chatWallpaper: "none", defaultPlaygroundLang: "javascript",
  terminalTheme: "dark", codeFont: "jetbrains", startupPage: "/",
  messageDensity: "comfortable", sidebarPosition: "left", sendWithEnter: true,
  showKeyboardShortcuts: true, timeFormat: "12h", reduceAnimations: false,
  autoSaveCode: true, exportFormat: "markdown", notificationSound: "default",
  showWordCount: true, enableCodeLens: true, chatFontSize: "medium",
  feedNewsPerPage: 18, feedShowImages: true, feedCompactNews: false, feedTopCategories: [],
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
    if (s.reduceAnimations) { el.classList.add("reduce-motion"); } else { el.classList.remove("reduce-motion"); }
    el.setAttribute("data-sidebar-position", s.sidebarPosition);
    el.setAttribute("data-message-density", s.messageDensity);
    el.setAttribute("data-chat-font-size", s.chatFontSize);
    el.setAttribute("data-time-format", s.timeFormat);
    const codeFontMap: Record<string, string> = { jetbrains: "'JetBrains Mono', monospace", firacode: "'Fira Code', monospace", sourcecodepro: "'Source Code Pro', monospace", cascadia: "'Cascadia Code', monospace", system: "monospace" };
    el.style.setProperty("--code-font", codeFontMap[s.codeFont] || "monospace");
    const wallpaperMap: Record<string, string> = {
      none: "none",
      dots: "radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)",
      grid: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
      "gradient-warm": "linear-gradient(135deg, #fff5f5 0%, #fffaf0 50%, #fff5f5 100%)",
      "gradient-cool": "linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 50%, #f0f9ff 100%)",
      "gradient-sunset": "linear-gradient(135deg, #fdf2f8 0%, #fef3c7 50%, #fce7f3 100%)",
      circuit: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0v10M0 30h10M50 30h10M30 50v10' stroke='%23e5e7eb' fill='none' stroke-width='0.5'/%3E%3Ccircle cx='30' cy='30' r='2' fill='%23e5e7eb'/%3E%3C/svg%3E\")",
      waves: "url(\"data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q25 0 50 10 Q75 20 100 10' stroke='%23e5e7eb' fill='none' stroke-width='0.5'/%3E%3C/svg%3E\")",
    };
    el.style.setProperty("--chat-wallpaper", wallpaperMap[s.chatWallpaper] || "none");
    const wallpaperSizeMap: Record<string, string> = { dots: "20px 20px", grid: "20px 20px", circuit: "60px 60px", waves: "100px 20px" };
    el.style.setProperty("--chat-wallpaper-size", wallpaperSizeMap[s.chatWallpaper] || "auto");
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

type AuthUser = { id: number; email: string; displayName: string; isPro: boolean; isFreeForever: boolean };
const AuthCtx = createContext<{ user: AuthUser | null; loading: boolean; login: (email: string, password: string) => Promise<void>; register: (email: string, password: string, displayName: string) => Promise<void>; logout: () => Promise<void>; refresh: () => Promise<void>; showAuthModal: boolean; setShowAuthModal: (v: boolean) => void }>({ user: null, loading: true, login: async () => {}, register: async () => {}, logout: async () => {}, refresh: async () => {}, showAuthModal: false, setShowAuthModal: () => {} });
function useAuth() { return useContext(AuthCtx); }
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/auth/me", { credentials: "include" });
      if (r.ok) { const u = await r.json(); setUser(u); localStorage.setItem("myaigpt_email", u.email); if (u.isPro || u.isFreeForever) { localStorage.setItem("myaigpt_pro", "true"); localStorage.setItem("myaigpt_msg_count", "0"); } }
      else { setUser(null); }
    } catch { setUser(null); } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const login = useCallback(async (email: string, password: string) => {
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }), credentials: "include" });
    if (!r.ok) { const e = await r.json(); throw new Error(e.message || "Login failed"); }
    const u = await r.json(); setUser(u); localStorage.setItem("myaigpt_email", u.email); if (u.isPro || u.isFreeForever) { localStorage.setItem("myaigpt_pro", "true"); localStorage.setItem("myaigpt_msg_count", "0"); } setShowAuthModal(false);
  }, []);
  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const referralCode = localStorage.getItem("myaigpt_ref_code") || "";
    const r = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, displayName, referralCode }), credentials: "include" });
    if (!r.ok) { const e = await r.json(); throw new Error(e.message || "Registration failed"); }
    const u = await r.json(); setUser(u); localStorage.setItem("myaigpt_email", u.email); if (u.isPro || u.isFreeForever) { localStorage.setItem("myaigpt_pro", "true"); localStorage.setItem("myaigpt_msg_count", "0"); } setShowAuthModal(false);
  }, []);
  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null); localStorage.removeItem("myaigpt_email"); localStorage.removeItem("myaigpt_pro");
  }, []);
  return <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh, showAuthModal, setShowAuthModal }}>{children}</AuthCtx.Provider>;
}

function AuthModal() {
  const { login, register, showAuthModal, setShowAuthModal } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  if (!showAuthModal) return null;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (mode === "login") { await login(email, password); }
      else { await register(email, password, displayName); }
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowAuthModal(false)}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative" onClick={e => e.stopPropagation()} data-testid="auth-modal">
        <button onClick={() => setShowAuthModal(false)} className="absolute top-3 right-3 p-1 text-muted-foreground/50 hover:text-foreground" data-testid="button-close-auth"><X size={18} /></button>
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg">
            <Crown size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-extrabold" data-testid="text-auth-title">{mode === "login" ? "Welcome Back" : "Create Account"}</h2>
          <p className="text-sm text-muted-foreground mt-1">{mode === "login" ? "Sign in to your My Ai Gpt account" : "Join My Ai Gpt for free"}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Display Name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Quantum Logic Network"
                  className="w-full pl-9 pr-3 py-2.5 border border-border/40 rounded-xl text-sm focus:outline-none focus:border-amber-400" data-testid="input-display-name" />
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                className="w-full pl-9 pr-3 py-2.5 border border-border/40 rounded-xl text-sm focus:outline-none focus:border-amber-400" data-testid="input-auth-email" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Password</label>
            <div className="relative">
              <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                className="w-full pl-9 pr-3 py-2.5 border border-border/40 rounded-xl text-sm focus:outline-none focus:border-amber-400" data-testid="input-auth-password" />
            </div>
          </div>
          {error && <p className="text-xs text-red-500 text-center" data-testid="text-auth-error">{error}</p>}
          <button type="submit" disabled={loading} data-testid="button-auth-submit"
            className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold rounded-xl text-sm hover:from-amber-500 hover:to-yellow-600 transition-all shadow-md disabled:opacity-50">
            {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
        <p className="text-xs text-center text-muted-foreground mt-4">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="text-amber-600 font-semibold hover:underline" data-testid="button-auth-toggle">
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}

function StripePaywall() {
  const { user, setShowAuthModal } = useAuth();
  const paywallRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (user && paywallRef.current && !paywallRef.current.querySelector("stripe-buy-button")) {
      const btn = document.createElement("stripe-buy-button");
      btn.setAttribute("buy-button-id", "buy_btn_1T4l1iB1ElS3CRgPLlvxieIS");
      btn.setAttribute("publishable-key", "pk_live_51LN4UmB1ElS3CRgPDMJle5JfwZh9iwzDtD900oHDTcPQfPaoGSKEUMhq3MYsFv9SfR1e8Ox5FOpDIALB7MIpEdVo0033Y4vBii");
      btn.setAttribute("client-reference-id", String(user.id));
      btn.setAttribute("customer-email", user.email);
      paywallRef.current.appendChild(btn);
    }
  }, [user]);

  const handlePaidClick = async () => {
    try {
      const r = await fetch("/api/auth/upgrade", { method: "POST", credentials: "include" });
      if (r.ok) { localStorage.setItem("myaigpt_msg_count", "0"); window.location.reload(); }
    } catch {}
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-6 max-w-md mx-auto text-center" data-testid="paywall-section">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center mb-4 shadow-lg">
          <Crown size={28} className="text-white" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">Sign in to Continue</h3>
        <p className="text-sm text-muted-foreground mb-4">Create a free account or sign in to keep chatting with My Ai Gpt.</p>
        <button onClick={() => setShowAuthModal(true)} data-testid="button-paywall-signin"
          className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold rounded-xl text-sm hover:from-amber-500 hover:to-yellow-600 transition-all shadow-md flex items-center gap-2">
          <LogIn size={16} /> Sign In / Sign Up
        </button>
      </div>
    );
  }

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
      <button onClick={handlePaidClick} data-testid="button-already-paid"
        className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 mt-2 underline">
        I already paid — unlock my account
      </button>
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
  return useQuery<Chat[]>({ queryKey: [api.chats.list.path], queryFn: async () => { const r = await fetch(api.chats.list.path, { credentials: "include" }); return r.json(); } });
}
function useMessages(chatId: number | null) {
  return useQuery<Message[]>({
    queryKey: [api.messages.list.path, chatId],
    queryFn: async () => { if (!chatId) return []; const r = await fetch(buildUrl(api.messages.list.path, { chatId }), { credentials: "include" }); return r.json(); },
    enabled: !!chatId,
  });
}
function useStats() {
  return useQuery<{ chatCount: number; messageCount: number; codeFiles: number }>({
    queryKey: ["/api/stats"], queryFn: async () => { const r = await fetch("/api/stats", { credentials: "include" }); return r.json(); }, refetchInterval: 600000,
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

// ─── SHARE MODAL ─────────────────────────────────────────────────────────────

type ShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareUrl: string;
  shareText: string;
  shareType: "chat" | "code" | "playground" | "app";
};

function ShareModal({ isOpen, onClose, title, shareUrl, shareText, shareType }: ShareModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: "Link copied!", description: "Share link has been copied to your clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const openShare = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text: shareText, url: shareUrl });
    } catch {}
  };

  const handleInvite = () => {
    const inviteUrl = window.location.origin;
    const inviteText = "Check out My Ai Gpt - an amazing AI assistant!";
    if (hasNativeShare) {
      navigator.share({ title: "My Ai Gpt", text: inviteText, url: inviteUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(inviteUrl);
      toast({ title: "App link copied!", description: "Share My Ai Gpt with your friends!" });
    }
  };

  const platforms = [
    {
      id: "twitter",
      label: "X",
      letter: "X",
      bg: "bg-black dark:bg-white",
      textColor: "text-white dark:text-black",
      onClick: () => openShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`),
    },
    {
      id: "facebook",
      label: "Facebook",
      letter: "f",
      bg: "bg-[#1877F2]",
      textColor: "text-white",
      onClick: () => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`),
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      letter: "W",
      bg: "bg-[#25D366]",
      textColor: "text-white",
      onClick: () => openShare(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`),
    },
    {
      id: "telegram",
      label: "Telegram",
      letter: "T",
      bg: "bg-[#0088cc]",
      textColor: "text-white",
      onClick: () => openShare(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`),
    },
    {
      id: "reddit",
      label: "Reddit",
      letter: "R",
      bg: "bg-[#FF4500]",
      textColor: "text-white",
      onClick: () => openShare(`https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`),
    },
    {
      id: "email",
      label: "Email",
      letter: "@",
      bg: "bg-[#6366f1]",
      textColor: "text-white",
      onClick: () => { window.location.href = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent("Check this out: " + shareUrl)}`; },
    },
  ];

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

  const typeLabel = shareType === "chat" ? "Conversation" : shareType === "code" ? "Code" : shareType === "playground" ? "Playground Creation" : "App";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose} data-testid="share-modal-overlay">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} data-testid="share-modal">
        <button onClick={onClose} className="absolute top-3 right-3 p-1 text-muted-foreground/50 hover:text-foreground" data-testid="button-close-share">
          <X size={18} />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Share2 size={24} className="text-white" />
          </div>
          <h2 className="text-lg font-extrabold text-foreground" data-testid="text-share-title">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">Share this {typeLabel.toLowerCase()} with others</p>
        </div>

        <button onClick={handleCopyLink} data-testid="button-copy-share-link"
          className="w-full flex items-center gap-3 p-3 mb-4 rounded-xl border border-border/40 hover-elevate transition-colors">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            {copied ? <Check size={16} className="text-green-500" /> : <Link2 size={16} className="text-foreground" />}
          </div>
          <div className="text-left flex-1 min-w-0">
            <span className="text-sm font-semibold text-foreground block">{copied ? "Copied!" : "Copy Link"}</span>
            <span className="text-xs text-muted-foreground truncate block">{shareUrl}</span>
          </div>
        </button>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {platforms.map(p => (
            <button key={p.id} onClick={p.onClick} data-testid={`button-share-${p.id}`}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover-elevate transition-colors">
              <div className={`w-10 h-10 rounded-full ${p.bg} flex items-center justify-center`}>
                <span className={`text-sm font-bold ${p.textColor}`}>{p.letter}</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">{p.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center mb-5 p-4 rounded-xl bg-muted/30 border border-border/20">
          <p className="text-xs text-muted-foreground font-medium mb-3">Scan QR Code</p>
          <img src={qrUrl} alt="QR Code" className="w-[160px] h-[160px] rounded-lg" data-testid="img-share-qr" />
        </div>

        {hasNativeShare && (
          <button onClick={handleNativeShare} data-testid="button-native-share"
            className="w-full flex items-center justify-center gap-2 p-3 mb-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-sm hover:from-blue-600 hover:to-indigo-600 transition-all">
            <ExternalLink size={16} />
            Share via...
          </button>
        )}

        <div className="border-t border-border/30 pt-4 mt-2">
          <p className="text-xs text-muted-foreground text-center mb-3 font-medium">Share My Ai Gpt with friends!</p>
          <button onClick={handleInvite} data-testid="button-invite-friends"
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold text-sm hover:from-amber-500 hover:to-yellow-600 transition-all shadow-md">
            <UserPlus size={16} />
            Invite Friends
          </button>
        </div>
      </div>
    </div>
  );
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

function OpenInPlaygroundBtn({ code, language }: { code: string; language: string }) {
  const [, setLocation] = useLocation();
  return (
    <button onClick={() => {
      sessionStorage.setItem("playground_code", code);
      sessionStorage.setItem("playground_lang", language);
      setLocation("/code");
    }} data-testid="button-open-playground" className="p-1 rounded hover:bg-white/10 transition-colors" title="Open in Playground">
      <SquareTerminal size={14} className="text-blue-400" />
    </button>
  );
}

function ShareCodeBtn({ code }: { code: string }) {
  const [showShare, setShowShare] = useState(false);
  const shareUrl = `${window.location.origin}/code`;
  return (
    <>
      <button onClick={() => { sessionStorage.setItem("shared_code", code); setShowShare(true); }}
        data-testid="button-share-code" className="p-1 rounded hover:bg-white/10 transition-colors" title="Share code">
        <Share2 size={14} className="text-zinc-400" />
      </button>
      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} title="Share Code" shareUrl={shareUrl} shareText="Check out this code from My Ai Coder!" shareType="code" />
    </>
  );
}

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
          <OpenInPlaygroundBtn code={code} language={language} />
          <RunBtn code={code} language={language} />
          <FullscreenBtn code={code} language={language} />
          <ShareCodeBtn code={code} />
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
          <div className="text-black dark:text-white leading-relaxed markdown-body">
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
                    const detectBlockLang = (s: string): string => {
                      const t = s.trim();
                      if (/^\s*(def |class |import |from \w+ import|print\(|elif |if __name__)/m.test(t)) return "python";
                      if (/^\s*<!DOCTYPE|^\s*<html|^\s*<div|^\s*<head/im.test(t)) return "html";
                      if (/^\s*[.#@][\w-]+\s*\{|^\s*:root\s*\{|^\s*body\s*\{|^\s*@media/m.test(t)) return "css";
                      if (/^\s*(const |let |var |function |=>|console\.log|import .* from)/m.test(t)) return "javascript";
                      if (/^\s*(public\s+class|System\.out|import\s+java\.)/m.test(t)) return "java";
                      if (/^\s*(#include|int main|cout|std::)/m.test(t)) return "cpp";
                      if (/^\s*(fn main|let mut|println!|use std)/m.test(t)) return "rust";
                      if (/^\s*(package main|import "fmt"|func main)/m.test(t)) return "go";
                      if (/^\s*(#!\/bin\/bash|echo |if \[|for .* in)/m.test(t)) return "bash";
                      if (/^\s*(<\?php|echo\s|function\s+\w+\s*\()/m.test(t)) return "php";
                      return "plaintext";
                    };
                    return !inline && match ? (
                      <CodeBlock code={codeStr} language={match[1]} isCoder={isCoder} />
                    ) : !inline && codeStr.includes("\n") ? (
                      <CodeBlock code={codeStr} language={detectBlockLang(codeStr)} isCoder={isCoder} />
                    ) : (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border/40" {...props}>{children}</code>
                    );
                  },
                  a({ children, href, ...props }: any) { return <a href={href} target="_blank" rel="noopener noreferrer" className="text-black dark:text-white font-semibold underline" {...props}>{children}</a>; },
                  strong({ children }: any) { return <strong className="font-bold text-black dark:text-white">{children}</strong>; },
                  em({ children }: any) { return <em className="italic text-black dark:text-white">{children}</em>; },
                  h1({ children }: any) { return <h1 className="text-xl font-extrabold text-black dark:text-white mt-4 mb-2">{children}</h1>; },
                  h2({ children }: any) { return <h2 className="text-lg font-bold text-black dark:text-white mt-3 mb-1.5">{children}</h2>; },
                  h3({ children }: any) { return <h3 className="text-base font-bold text-black dark:text-white mt-2 mb-1">{children}</h3>; },
                  h4({ children }: any) { return <h4 className="text-sm font-bold text-black dark:text-white mt-2 mb-1">{children}</h4>; },
                  ul({ children }: any) { return <ul className="list-disc pl-5 my-2 space-y-1 text-black dark:text-white">{children}</ul>; },
                  ol({ children }: any) { return <ol className="list-decimal pl-5 my-2 space-y-1 text-black dark:text-white">{children}</ol>; },
                  li({ children }: any) { return <li className="text-black dark:text-white">{children}</li>; },
                  p({ children }: any) { return <p className="my-1.5 text-black dark:text-white leading-relaxed">{children}</p>; },
                  table({ children }: any) { return <div className="overflow-x-auto my-3 rounded-lg border border-border"><table className="min-w-full text-sm">{children}</table></div>; },
                  th({ children }: any) { return <th className="border-b border-border bg-muted/50 px-3 py-2 text-left font-semibold text-xs uppercase tracking-wider text-black dark:text-white">{children}</th>; },
                  td({ children }: any) { return <td className="border-b border-border/50 px-3 py-2 text-black dark:text-white">{children}</td>; },
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
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const { isListening, transcript, startListening, stopListening, setTranscript } = useSpeechRecognition();
  const { toast } = useToast();
  const { settings: inputSettings } = useAppSettings();

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
    if (e.key === "Enter" && inputSettings.sendWithEnter && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
    if (e.key === "Enter" && !inputSettings.sendWithEnter && e.shiftKey) { e.preventDefault(); handleSubmit(); }
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
          {charCount > 0 && <span className="text-[10px] text-muted-foreground/40 tabular-nums">{charCount}{inputSettings.showWordCount && wordCount > 0 ? ` · ${wordCount}w` : ""}</span>}
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

const ALL_GENERAL_SUGGESTIONS = [
  { icon: Sparkles, text: "Explain quantum computing in simple terms", color: "text-amber-500", cat: "Science" },
  { icon: Globe, text: "What are the biggest tech trends in 2026?", color: "text-blue-500", cat: "Trends" },
  { icon: Lightbulb, text: "Give me 10 creative startup ideas", color: "text-yellow-500", cat: "Ideas" },
  { icon: BookOpen, text: "Write a professional email declining a job offer", color: "text-purple-500", cat: "Writing" },
  { icon: Shield, text: "Explain cryptocurrency and blockchain to a beginner", color: "text-emerald-500", cat: "Finance" },
  { icon: BarChart3, text: "Help me create a weekly productivity plan", color: "text-pink-500", cat: "Planning" },
  { icon: Brain, text: "How does artificial intelligence actually learn?", color: "text-violet-500", cat: "AI" },
  { icon: Heart, text: "Write a heartfelt birthday message for my best friend", color: "text-red-400", cat: "Writing" },
  { icon: TrendingUp, text: "What stocks should I watch this week?", color: "text-green-500", cat: "Finance" },
  { icon: Globe, text: "Teach me basic phrases in Japanese", color: "text-cyan-500", cat: "Language" },
  { icon: Lightbulb, text: "How can I improve my public speaking skills?", color: "text-orange-500", cat: "Growth" },
  { icon: BookOpen, text: "Summarize the key ideas from Atomic Habits", color: "text-indigo-500", cat: "Books" },
  { icon: Sparkles, text: "Write a short sci-fi story about time travel", color: "text-purple-400", cat: "Creative" },
  { icon: BarChart3, text: "Create a personal budget template for me", color: "text-emerald-500", cat: "Finance" },
  { icon: Cpu, text: "Explain how neural networks work like I'm 10", color: "text-blue-400", cat: "Science" },
  { icon: Lightbulb, text: "Give me 5 side hustle ideas I can start today", color: "text-amber-400", cat: "Ideas" },
  { icon: Globe, text: "What's happening in world news right now?", color: "text-teal-500", cat: "News" },
  { icon: Heart, text: "How do I deal with stress and anxiety?", color: "text-pink-400", cat: "Wellness" },
  { icon: BookOpen, text: "Help me write a compelling cover letter", color: "text-blue-500", cat: "Career" },
  { icon: Sparkles, text: "Come up with a viral social media content strategy", color: "text-orange-400", cat: "Marketing" },
  { icon: Brain, text: "Explain the theory of relativity simply", color: "text-yellow-500", cat: "Science" },
  { icon: Shield, text: "What are the best practices for online privacy?", color: "text-green-600", cat: "Security" },
  { icon: Lightbulb, text: "Design a 30-day fitness challenge for beginners", color: "text-red-500", cat: "Health" },
  { icon: Globe, text: "Plan a 7-day trip to Tokyo on a budget", color: "text-cyan-400", cat: "Travel" },
  { icon: BarChart3, text: "Explain how compound interest works", color: "text-emerald-400", cat: "Finance" },
  { icon: BookOpen, text: "Write a poem about the ocean at sunset", color: "text-purple-500", cat: "Creative" },
  { icon: Sparkles, text: "What skills will be most valuable in 5 years?", color: "text-blue-500", cat: "Future" },
  { icon: Heart, text: "Give me tips for better sleep habits", color: "text-indigo-400", cat: "Wellness" },
  { icon: Lightbulb, text: "How do I learn a new language fast?", color: "text-amber-500", cat: "Learning" },
  { icon: Brain, text: "Explain the difference between AI, ML, and deep learning", color: "text-violet-400", cat: "Tech" },
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const ALL_CODER_CATEGORIES = [
  { name: "Full Stack", items: [
    { icon: Rocket, text: "Build a complete SaaS app with auth, billing, and dashboard", color: "text-blue-500" },
    { icon: Globe, text: "Create a real-time chat app with WebSockets", color: "text-cyan-500" },
    { icon: Layers, text: "Build a full-stack blog with comments and likes", color: "text-violet-500" },
    { icon: Database, text: "Create a project management tool with drag-and-drop", color: "text-indigo-500" },
  ]},
  { name: "Backend", items: [
    { icon: Database, text: "Design a scalable REST API with rate limiting and caching", color: "text-green-500" },
    { icon: Lock, text: "Implement JWT authentication with refresh tokens", color: "text-amber-500" },
    { icon: Zap, text: "Build a GraphQL API with subscriptions", color: "text-yellow-500" },
    { icon: Shield, text: "Create a secure file upload system with validation", color: "text-emerald-500" },
  ]},
  { name: "Frontend", items: [
    { icon: Braces, text: "Build an interactive data dashboard with React and D3", color: "text-purple-500" },
    { icon: Smartphone, text: "Create a responsive e-commerce product page", color: "text-pink-500" },
    { icon: Palette, text: "Build a design system with reusable components", color: "text-orange-500" },
    { icon: Wand2, text: "Create smooth page transitions and animations", color: "text-cyan-400" },
  ]},
  { name: "DevOps", items: [
    { icon: Cloud, text: "Set up a CI/CD pipeline with Docker and GitHub Actions", color: "text-teal-500" },
    { icon: Package, text: "Create a microservices architecture with Docker Compose", color: "text-indigo-500" },
    { icon: Terminal, text: "Write infrastructure as code with Terraform", color: "text-green-400" },
    { icon: Gauge, text: "Set up application monitoring with Prometheus and Grafana", color: "text-amber-400" },
  ]},
  { name: "Debug & Test", items: [
    { icon: Bug, text: "Debug and fix my code with detailed explanations", color: "text-red-500" },
    { icon: FlaskConical, text: "Write comprehensive tests with 100% coverage", color: "text-orange-500" },
    { icon: Search, text: "Find and fix performance bottlenecks in my app", color: "text-blue-400" },
    { icon: Shield, text: "Audit my code for security vulnerabilities", color: "text-red-400" },
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
  const [showShareChat, setShowShareChat] = useState(false);

  const isCoder = defaultType === "coder";
  const isEmpty = messages.length === 0 && localMessages.length === 0;

  const [generalSuggestions] = useState(() => pickRandom(ALL_GENERAL_SUGGESTIONS, 6));
  const [coderCategories] = useState(() =>
    ALL_CODER_CATEGORIES.map(cat => ({ ...cat, items: pickRandom(cat.items, 2) }))
  );

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
    if (scrollRef.current && appSettingsForChat.autoScroll) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, localMessages, isThinking]);

  const { user } = useAuth();
  const [limitReached, setLimitReached] = useState(isLimitReached());
  useEffect(() => { setLimitReached(isLimitReached()); }, [user]);

  const { settings: appSettingsForChat } = useAppSettings();
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
        const r = await fetch(api.chats.create.path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: content.slice(0, 40), type: defaultType }), credentials: "include" });
        if (!r.ok) { const e = await r.json().catch(() => ({})); if (r.status === 401) { throw new Error("Please sign in to chat"); } throw new Error(e.message || "Failed"); }
        const c = await r.json(); targetChatId = c.id;
        qc.invalidateQueries({ queryKey: [api.chats.list.path] });
      }
      const personalization = {
        language: appSettingsForChat.language,
        responseStyle: appSettingsForChat.responseStyle,
        responseLength: appSettingsForChat.responseLength,
        aiPersonality: appSettingsForChat.aiPersonality,
        useEmojis: appSettingsForChat.useEmojis,
        greetingName: appSettingsForChat.greetingName || appSettingsForChat.displayName,
      };
      const r = await fetch(buildUrl(api.messages.create.path, { chatId: targetChatId }), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, personalization }), credentials: "include" });
      trackInteraction("chat_message", { text: content, topic: content.slice(0, 60) });
      if (!r.ok) throw new Error("Failed to get response");
      if (!chatId) { setLocation(`/chat/${targetChatId}`); } else { qc.invalidateQueries({ queryKey: [api.messages.list.path, chatId] }); setLocalMessages([]); }
    } catch (error: any) {
      setLastError(error.message); setLastFailedMsg(content);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLocalMessages(prev => prev.filter(m => m.content !== content));
    } finally { setIsThinking(false); }
  }, [chatId, defaultType, qc, setLocation, toast, appSettingsForChat]);

  const handleRegenerate = useCallback(async () => {
    if (!chatId || messages.length < 2) return;
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    if (lastUserMsg) {
      setIsThinking(true);
      try {
        const r = await fetch(buildUrl(api.messages.create.path, { chatId }), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: lastUserMsg.content }), credentials: "include" });
        if (!r.ok) throw new Error("Failed");
        qc.invalidateQueries({ queryKey: [api.messages.list.path, chatId] });
      } catch { toast({ title: "Regeneration failed", variant: "destructive" }); }
      finally { setIsThinking(false); }
    }
  }, [chatId, messages, qc, toast]);

  const handleExport = useCallback(async () => {
    if (!chatId) return;
    try {
      const r = await fetch(`/api/chats/${chatId}/export`, { method: "POST", credentials: "include" });
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
            {chatId && (
              <button onClick={() => setShowShareChat(true)} className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground/50 hover:text-foreground transition-colors" title="Share" data-testid="button-share-chat">
                <Share2 size={14} />
              </button>
            )}
          </div>
        </div>
      )}
      <ShareModal isOpen={showShareChat} onClose={() => setShowShareChat(false)} title="Share Conversation" shareUrl={`${window.location.origin}/chat/${chatId}`} shareText="Check out this AI conversation on My Ai Gpt!" shareType="chat" />

      <div ref={scrollRef} className="flex-1 overflow-y-auto w-full scroll-smooth pt-4 pb-40" style={{ backgroundImage: "var(--chat-wallpaper)", backgroundSize: "var(--chat-wallpaper-size, auto)", fontSize: appSettingsForChat.chatFontSize === "small" ? "0.85rem" : appSettingsForChat.chatFontSize === "large" ? "1.1rem" : "0.95rem" }}>
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
                  {coderCategories.map((cat, ci) => (
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
                {generalSuggestions.map((s, i) => (
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

function SidebarAuthButton() {
  const { user, logout, setShowAuthModal } = useAuth();
  if (user) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-50 border border-amber-200/50">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
            <User size={12} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-foreground truncate">{user.displayName || user.email.split("@")[0]}</div>
            <div className="text-[8px] text-muted-foreground/60 truncate">{user.email}</div>
          </div>
          {(user.isPro || user.isFreeForever) && <span className="text-[8px] bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-1.5 py-0.5 rounded-full font-bold">PRO</span>}
        </div>
        <button onClick={logout} data-testid="button-logout"
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut size={10} /> Sign Out
        </button>
      </div>
    );
  }
  return (
    <button onClick={() => setShowAuthModal(true)} data-testid="button-sidebar-signin"
      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold rounded-xl text-xs hover:from-amber-500 hover:to-yellow-600 transition-all shadow-sm">
      <LogIn size={14} /> Sign In / Sign Up
    </button>
  );
}

function SidebarInviteButton() {
  const [showInvite, setShowInvite] = useState(false);
  return (
    <>
      <button onClick={() => setShowInvite(true)} data-testid="button-sidebar-invite"
        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors">
        <UserPlus size={11} /> Invite Friends
      </button>
      <ShareModal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite Friends" shareUrl={window.location.origin} shareText="Check out My Ai Gpt - an amazing AI assistant!" shareType="app" />
    </>
  );
}

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
    await fetch("/api/chats", { method: "DELETE", credentials: "include" });
    qc.invalidateQueries({ queryKey: [api.chats.list.path] });
    setLocation("/"); toast({ title: "All chats cleared" });
  };
  const handleRename = async (id: number) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    await fetch(`/api/chats/${id}/rename`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: renameValue }), credentials: "include" });
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
            <span className="flex-1">News Hub</span>
            <span className="text-[9px] bg-gradient-to-r from-orange-500 to-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold relative overflow-hidden animate-pulse">LIVE<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]" /></span>
          </Link>
          )}
          {!appSettings.hiddenPages.includes("social") && (
          <Link href="/social" data-testid="link-social"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/social" || location.startsWith("/social") ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/social" || location.startsWith("/social") ? "bg-purple-500/15" : "bg-purple-500/5"}`}><Users size={14} className="text-purple-600" /></div>
            <span className="flex-1">Social</span>
            <span className="text-[9px] bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-1.5 py-0.5 rounded-full font-bold">NEW</span>
          </Link>
          )}
          {!appSettings.hiddenPages.includes("games") && (
          <Link href="/games" data-testid="link-games"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/games" ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/games" ? "bg-rose-500/15" : "bg-rose-500/5"}`}><Gamepad2 size={14} className="text-rose-600" /></div>
            <span className="flex-1">Games</span>
            <span className="text-[9px] bg-gradient-to-r from-rose-500 to-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">NEW</span>
          </Link>
          )}
          {!appSettings.hiddenPages.includes("music") && (
          <Link href="/music" data-testid="link-music"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/music" ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/music" ? "bg-sky-500/15" : "bg-sky-500/5"}`}><Music size={14} className="text-sky-600" /></div>
            <span className="flex-1">Music</span>
            <span className="text-[9px] bg-gradient-to-r from-sky-500 to-blue-500 text-white px-1.5 py-0.5 rounded-full font-bold">NEW</span>
          </Link>
          )}
          {!appSettings.hiddenPages.includes("education") && (
          <Link href="/education" data-testid="link-education"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/education" ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/education" ? "bg-teal-500/15" : "bg-teal-500/5"}`}><GraduationCap size={14} className="text-teal-600" /></div>
            <span className="flex-1">Education</span>
            <span className="text-[9px] bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-1.5 py-0.5 rounded-full font-bold">NEW</span>
          </Link>
          )}
          {!appSettings.hiddenPages.includes("shopping") && (
          <Link href="/shopping" data-testid="link-shopping"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/shopping" ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/shopping" ? "bg-lime-500/15" : "bg-lime-500/5"}`}><ShoppingBag size={14} className="text-lime-600" /></div>
            <span className="flex-1">Shopping</span>
            <span className="text-[9px] bg-gradient-to-r from-lime-500 to-green-500 text-white px-1.5 py-0.5 rounded-full font-bold relative overflow-hidden animate-pulse">COMING SOON<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]" /></span>
          </Link>
          )}
          {!appSettings.hiddenPages.includes("create") && (
          <Link href="/create" data-testid="link-create"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${location === "/create" ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/create" ? "bg-pink-500/15" : "bg-pink-500/5"}`}><Paintbrush size={14} className="text-pink-600" /></div>
            <span className="flex-1">AI Studio</span>
            <span className="text-[9px] bg-gradient-to-r from-pink-500 to-violet-500 text-white px-1.5 py-0.5 rounded-full font-bold relative overflow-hidden animate-pulse">COMING SOON<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]" /></span>
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
              <Wifi size={9} className="text-green-400" />
              <span>Online</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{stats?.chatCount || 0} chats</span>
              <span>{stats?.messageCount || 0} msgs</span>
              {(stats?.codeFiles || 0) > 0 && <span>{stats?.codeFiles} codes</span>}
            </div>
          </div>
          <SidebarAuthButton />
          <SidebarInviteButton />
          <div className="text-[9px] text-center text-muted-foreground/30 font-medium tracking-wide">Quantum Pulse Intelligence</div>
        </div>
      </div>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} data-testid="button-open-sidebar"
          className="fixed top-4 left-4 z-40 p-3.5 bg-gradient-to-br from-amber-400 to-yellow-500 border border-amber-300 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"><PanelLeftOpen size={22} className="text-white" /></button>
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
  { id: "bash", name: "Bash", icon: Terminal, color: "text-green-300", canRun: true },
  { id: "go", name: "Go", icon: Zap, color: "text-cyan-300", canRun: true },
  { id: "rust", name: "Rust", icon: Lock, color: "text-orange-500", canRun: true },
  { id: "java", name: "Java", icon: Package, color: "text-red-400", canRun: true },
  { id: "cpp", name: "C++", icon: Cpu, color: "text-blue-300", canRun: true },
  { id: "c", name: "C", icon: Cpu, color: "text-blue-200", canRun: true },
  { id: "ruby", name: "Ruby", icon: Sparkles, color: "text-red-500", canRun: true },
  { id: "php", name: "PHP", icon: Code2, color: "text-indigo-400", canRun: true },
  { id: "sql", name: "SQL", icon: Database, color: "text-cyan-400", canRun: false },
  { id: "json", name: "JSON", icon: Brackets, color: "text-yellow-300", canRun: false },
];

const STARTER_CODE: Record<string, string> = {
  javascript: `// JavaScript Playground - Write and run your code!\n\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nfor (let i = 0; i < 10; i++) {\n  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);\n}\n\nconsole.log("\\nHello from My Ai Coder Playground! 🚀");`,
  html: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: system-ui; padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }\n    .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; max-width: 400px; }\n    h1 { color: #333; margin-bottom: 0.5rem; }\n    p { color: #666; }\n    button { background: #667eea; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; margin-top: 1rem; }\n    button:hover { background: #5a6fd6; }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h1>My Ai Coder</h1>\n    <p>Build anything you can imagine</p>\n    <button onclick="alert('Hello from My Ai Coder!')">Click Me</button>\n  </div>\n</body>\n</html>`,
  css: `/* CSS Playground - See your styles live! */\n\nbody {\n  font-family: system-ui;\n  padding: 2rem;\n  background: #f0f4f8;\n}\n\n.demo {\n  max-width: 600px;\n  margin: 0 auto;\n}\n\n.card {\n  background: white;\n  border-radius: 12px;\n  padding: 24px;\n  box-shadow: 0 4px 6px rgba(0,0,0,0.1);\n  margin-bottom: 16px;\n  transition: transform 0.2s, box-shadow 0.2s;\n}\n\n.card:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 8px 25px rgba(0,0,0,0.15);\n}\n\nh1 { color: #1a1a2e; }\np { color: #666; line-height: 1.6; }`,
  python: `# Python Playground - Powered by Pyodide (WebAssembly)\n# Runs real Python in your browser!\n\nimport math\nimport json\nfrom datetime import datetime\n\ndef is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(math.sqrt(n)) + 1):\n        if n % i == 0:\n            return False\n    return True\n\nprimes = [x for x in range(2, 50) if is_prime(x)]\nprint(f"Primes under 50: {primes}")\nprint(f"Count: {len(primes)}")\nprint(f"\\nPython version running in your browser!")\nprint(f"Math.pi = {math.pi}")\nprint(f"Math.e = {math.e}")`,
  typescript: `// TypeScript - Display mode (type checking shown)\n\ninterface User {\n  id: number;\n  name: string;\n  email: string;\n  role: 'admin' | 'user' | 'moderator';\n}\n\nfunction greetUser(user: User): string {\n  return \`Hello, \${user.name}! You are a \${user.role}.\`;\n}\n\nconst user: User = {\n  id: 1,\n  name: "Quantum Logic Network",\n  email: "billy@example.com",\n  role: "admin"\n};\n\nconsole.log(greetUser(user));`,
  sql: `-- SQL Playground - Display mode\n\nCREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  username VARCHAR(50) NOT NULL,\n  email VARCHAR(100) UNIQUE NOT NULL,\n  created_at TIMESTAMP DEFAULT NOW()\n);\n\nSELECT \n  u.username,\n  COUNT(p.id) as post_count\nFROM users u\nLEFT JOIN posts p ON u.id = p.author_id\nGROUP BY u.username\nORDER BY post_count DESC\nLIMIT 10;`,
  json: `{\n  "name": "My Ai Coder Project",\n  "version": "1.0.0",\n  "description": "Built with My Ai Coder Playground",\n  "dependencies": {\n    "react": "^18.0.0",\n    "express": "^4.18.0",\n    "typescript": "^5.0.0"\n  }\n}`,
  bash: `#!/bin/bash\n# Bash script - Display mode\n\necho "Hello from My Ai Coder!"\n\nfor i in {1..5}; do\n  echo "Iteration $i"\ndone\n\necho "Done!"`,
  rust: `// Rust - Display mode\n\nfn main() {\n    let numbers = vec![1, 2, 3, 4, 5];\n    let sum: i32 = numbers.iter().sum();\n    println!("Sum: {}", sum);\n}`,
  go: `// Go - Display mode\n\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from My Ai Coder!")\n}`,
  java: `// Java - Display mode\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from My Ai Coder!");\n    }\n}`,
  cpp: `// C++ - Runs on server!\n\n#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    vector<int> nums = {5, 3, 8, 1, 9, 2, 7};\n    sort(nums.begin(), nums.end());\n    cout << "Sorted: ";\n    for (int n : nums) cout << n << " ";\n    cout << endl;\n    cout << "Hello from My Ai Coder! 🚀" << endl;\n    return 0;\n}`,
  c: `// C - Runs on server!\n\n#include <stdio.h>\n\nint factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n\nint main() {\n    for (int i = 1; i <= 10; i++) {\n        printf("%d! = %d\\n", i, factorial(i));\n    }\n    printf("Hello from My Ai Coder! 🚀\\n");\n    return 0;\n}`,
  ruby: `# Ruby - Runs on server!\n\ndef fizzbuzz(n)\n  (1..n).each do |i|\n    if i % 15 == 0\n      puts "FizzBuzz"\n    elsif i % 3 == 0\n      puts "Fizz"\n    elsif i % 5 == 0\n      puts "Buzz"\n    else\n      puts i\n    end\n  end\nend\n\nputs "FizzBuzz 1-20:"\nfizzbuzz(20)\nputs "\\nHello from My Ai Coder! 🚀"`,
  php: `<?php\n// PHP - Runs on server!\n\nfunction fibonacci($n) {\n    $a = 0; $b = 1;\n    $result = [];\n    for ($i = 0; $i < $n; $i++) {\n        $result[] = $a;\n        [$a, $b] = [$b, $a + $b];\n    }\n    return $result;\n}\n\n$fibs = fibonacci(15);\necho "Fibonacci: " . implode(", ", $fibs) . "\\n";\necho "Hello from My Ai Coder! 🚀\\n";\n?>`,
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
  const { settings: pgAppSettings } = useAppSettings();
  const theme = CODE_THEMES[settings.codeTheme] || CODE_THEMES.oneDark;
  const { toast } = useToast();
  const qc = useQueryClient();
  const defaultLang = pgAppSettings.defaultPlaygroundLang || "javascript";
  const [lang, setLang] = useState(defaultLang);
  const [code, setCode] = useState(STARTER_CODE[defaultLang as keyof typeof STARTER_CODE] || STARTER_CODE.javascript);
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
  const [showSharePlayground, setShowSharePlayground] = useState(false);

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

  useEffect(() => {
    const pendingCode = sessionStorage.getItem("playground_code");
    const pendingLang = sessionStorage.getItem("playground_lang");
    if (pendingCode) {
      setCode(pendingCode);
      if (pendingLang) {
        const validLang = PG_LANGUAGES.find(l => l.id === pendingLang);
        if (validLang) setLang(pendingLang);
      }
      sessionStorage.removeItem("playground_code");
      sessionStorage.removeItem("playground_lang");
      setOutput(["Code loaded from AI Coder. Press Run to execute!"]);
    }
  }, []);

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
      const chatRes = await fetch("/api/chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Auto-Fix " + attempt, type: "coder" }), credentials: "include" });
      const chat = await chatRes.json();
      const prompt = `Fix this ${language} code that has this error: "${errorMsg}"

Return ONLY the complete fixed code in a single code block. No explanation, no comments about what you changed. Just the working code.

\`\`\`${language}
${brokenCode.substring(0, 2000)}
\`\`\``;
      const msgRes = await fetch(`/api/chats/${chat.id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: prompt }), credentials: "include"
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

    const SERVER_ONLY_LANGS = new Set(["bash", "go", "rust", "java", "cpp", "c++", "c", "ruby", "php", "perl"]);

    if (execMode === "server" && (effectiveLang === "javascript" || effectiveLang === "typescript" || effectiveLang === "python" || effectiveLang === "bash")) {
      await runOnServer(code, effectiveLang);
      return;
    }

    if (SERVER_ONLY_LANGS.has(effectiveLang)) {
      setOutput([`⚡ ${effectiveLang.toUpperCase()} runs on the server. Executing...`]);
      await runOnServer(code, effectiveLang);
      return;
    }

    if (effectiveLang === "javascript" || effectiveLang === "typescript") {
      runJS(code);
    } else if (effectiveLang === "html") {
      setShowPreview(true);
      setOutput(["✓ HTML rendered in preview panel — click the Preview tab to see it"]);
      setIsRunning(false);
    } else if (effectiveLang === "css") {
      setShowPreview(true);
      setOutput(["✓ CSS applied to preview panel — click the Preview tab to see it"]);
      setIsRunning(false);
    } else if (effectiveLang === "python") {
      await runPython(code);
    } else {
      setOutput([`Language: ${effectiveLang}`, "", "This language is view-only in the playground.", "Try JavaScript, Python, HTML, CSS, or switch to Server mode."]);
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
        body: JSON.stringify({ title: `Voice: ${description.substring(0, 40)}`, type: "coder" }), credentials: "include"
      });
      const chat = await chatRes.json();
      const prompt = `The user spoke this voice command describing what they want to build:\n\n"${description}"\n\nGenerate the complete ${lang} code that does exactly what they described. Return ONLY the code in a single code block. No explanation before or after. Make it fully working and runnable.\n\nIMPORTANT RULES:\n- To open any website/URL, use: window.open("https://example.com", "_blank")\n- NEVER use registerProtocolHandler, it does not work in sandboxed browsers\n- NEVER use require() or import for Node.js modules — this runs in a browser sandbox\n- For fetching data, use fetch() API\n- For DOM manipulation, use standard document methods\n- Keep it browser-compatible JavaScript unless the user specifically asks for server-side code`;
      const msgRes = await fetch(`/api/chats/${chat.id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: prompt }), credentials: "include"
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
      const chatRes = await fetch("/api/chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Code Review", type: "coder" }), credentials: "include" });
      const chat = await chatRes.json();
      const msgRes = await fetch(`/api/chats/${chat.id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `Review this ${lang} code. Rate it 1-10. List specific improvements for: performance, readability, security, best practices. Be concise.\n\n\`\`\`${lang}\n${code}\n\`\`\`` }), credentials: "include"
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
      const chatRes = await fetch("/api/chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Auto-Fix", type: "coder" }), credentials: "include" });
      const chat = await chatRes.json();
      const msgRes = await fetch(`/api/chats/${chat.id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `Fix and improve this ${lang} code. Return ONLY the fixed code in a single code block, no explanation:\n\n\`\`\`${lang}\n${code}\n\`\`\`` }), credentials: "include"
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
      const chatRes = await fetch("/api/chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Code Explain", type: "coder" }), credentials: "include" });
      const chat = await chatRes.json();
      const msgRes = await fetch(`/api/chats/${chat.id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `Explain this ${lang} code step by step. Use numbered steps. For each step explain what the code does and why. Be concise:\n\n\`\`\`${lang}\n${code}\n\`\`\`` }), credentials: "include"
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
          {PG_LANGUAGES.slice(0, 5).map(l => (
            <button key={l.id} onClick={() => switchLang(l.id)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] transition-all ${lang === l.id ? "bg-white shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              <l.icon size={10} className={l.color} /><span className="hidden sm:inline">{l.name}</span>
            </button>
          ))}
          <select value={PG_LANGUAGES.slice(0, 5).find(l => l.id === lang) ? "" : lang} onChange={e => { if (e.target.value) switchLang(e.target.value); }} className="text-[10px] bg-transparent border-none focus:outline-none text-muted-foreground cursor-pointer px-0.5">
            <option value="" disabled>More...</option>
            {PG_LANGUAGES.slice(5).map(l => <option key={l.id} value={l.id}>{l.name}{l.canRun ? " ▶" : ""}</option>)}
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
        <button onClick={() => setShowSharePlayground(true)} className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground shrink-0" title="Share" data-testid="button-share-playground"><Share2 size={13} /></button>
        <button onClick={() => { setCode(""); setOutput([]); }} className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground shrink-0" title="Clear"><Eraser size={13} /></button>
      </div>
      <ShareModal isOpen={showSharePlayground} onClose={() => setShowSharePlayground(false)} title="Share Playground" shareUrl={`${window.location.origin}/code`} shareText="Built in My Ai Coder Playground!" shareType="playground" />

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
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
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
        <div className="flex-1 flex flex-col min-w-0 min-h-0 h-[60%] md:h-full">
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
                  style={{ fontFamily: "var(--code-font, 'JetBrains Mono', monospace)", fontSize: `${settings.fontSize}px`, lineHeight: "1.6", tabSize: 2, padding: "1rem", paddingLeft: settings.showLineNumbers ? "4rem" : "1rem" }}
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
        <div className="w-full md:w-[45%] h-[40%] md:h-full flex flex-col border-t md:border-t-0 md:border-l border-zinc-800 bg-zinc-950 min-w-0">
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
            <iframe ref={iframeRef} srcDoc={previewHtml} sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups" className="flex-1 bg-white" title="preview" />
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
  const [, setLocation] = useLocation();
  const isVideo = article.type === "video";

  const openStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    sessionStorage.setItem(`article_${article.id}`, JSON.stringify(article));
    setLocation(`/story/${article.id}`);
  };
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
            {isVideo ? (
              <a href={article.link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 transition-colors" data-testid={`feed-watch-${article.id}`}>
                <Play size={11} fill="currentColor" /> Watch Video
              </a>
            ) : (
              <button onClick={openStory}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors" data-testid={`feed-readmore-${article.id}`}>
                <BookOpen size={11} /> Read Full Story <ChevronRight size={11} />
              </button>
            )}

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

// ── OMEGA SPINE TAXONOMY ────────────────────────────────────────────────────
const OMEGA_SPINE = [
  { key: "top-stories",          label: "Top Stories",       emoji: "🔥", color: "#f97316", gradient: "from-orange-500 to-red-500",     search: "breaking news top stories",         children: [] },
  { key: "ai-technology",        label: "AI & Technology",   emoji: "🤖", color: "#6366f1", gradient: "from-indigo-500 to-purple-600",  search: "artificial intelligence technology", children: [
    { key: "ai",                label: "AI & Machine Learning", search: "artificial intelligence machine learning" },
    { key: "computing",         label: "Computing & Software",  search: "computing software apps" },
    { key: "cybersecurity",     label: "Cybersecurity",         search: "cybersecurity hacking data breach" },
    { key: "future-tech",       label: "Future Tech",           search: "future technology innovation robotics" },
    { key: "ai-agents",         label: "AI Agents",             search: "AI agents autonomous systems" },
    { key: "semiconductors",    label: "Semiconductors & Chips", search: "semiconductor chips nvidia intel" },
  ]},
  { key: "financials",           label: "Finance & Markets", emoji: "💰", color: "#10b981", gradient: "from-emerald-500 to-teal-600",   search: "finance markets investing",          children: [
    { key: "markets",           label: "Stock Markets",         search: "stock market equities S&P" },
    { key: "crypto",            label: "Crypto & Web3",         search: "cryptocurrency bitcoin ethereum web3" },
    { key: "trading",           label: "Trading & Investing",   search: "trading investing strategies" },
    { key: "economics",         label: "Economics",             search: "economics GDP inflation interest rates" },
    { key: "banking",           label: "Banking & FinTech",     search: "banking fintech payments" },
    { key: "real-estate-market",label: "Real Estate Market",    search: "real estate housing market mortgage" },
  ]},
  { key: "sports",               label: "Sports",            emoji: "🏆", color: "#eab308", gradient: "from-yellow-500 to-orange-500", search: "sports news",                        children: [
    { key: "team-sports",       label: "Team Sports",           search: "NFL NBA MLB soccer football" },
    { key: "individual-sports", label: "Individual Sports",     search: "tennis golf track swimming" },
    { key: "motorsports",       label: "Motorsports",           search: "Formula 1 NASCAR MotoGP motorsports" },
    { key: "esports",           label: "Esports & Gaming",      search: "esports gaming tournaments" },
    { key: "betting",           label: "Sports Betting & Odds", search: "sports betting odds lines" },
    { key: "sports-media",      label: "Sports Media",          search: "sports media broadcasting ESPN" },
  ]},
  { key: "health-care",          label: "Health & Medicine", emoji: "🏥", color: "#ef4444", gradient: "from-red-500 to-rose-600",      search: "health medicine medical",            children: [
    { key: "diseases",          label: "Diseases & Conditions", search: "disease health conditions pandemic" },
    { key: "fitness",           label: "Fitness & Wellness",    search: "fitness wellness exercise diet" },
    { key: "biotech",           label: "Biotech & Pharma",      search: "biotech pharmaceuticals drug clinical trial" },
    { key: "anatomy",           label: "Anatomy & Biology",     search: "anatomy biology human body" },
    { key: "mental-health",     label: "Mental Health",         search: "mental health psychology anxiety depression" },
    { key: "nutrition",         label: "Nutrition & Diet",      search: "nutrition diet food health" },
  ]},
  { key: "science-mathematics",  label: "Science",           emoji: "🔬", color: "#3b82f6", gradient: "from-blue-500 to-cyan-600",    search: "science discovery research",         children: [
    { key: "physics",           label: "Physics",               search: "physics quantum particles energy" },
    { key: "space",             label: "Space & Astronomy",     search: "space NASA SpaceX astronomy cosmos" },
    { key: "biology",           label: "Biology & Life Science", search: "biology genetics evolution life" },
    { key: "chemistry",         label: "Chemistry",             search: "chemistry molecules materials lab" },
    { key: "earth-science",     label: "Earth Science",         search: "geology earthquakes volcanoes oceanography" },
    { key: "mathematics",       label: "Mathematics",           search: "mathematics theorem proof algorithm" },
  ]},
  { key: "government-law",       label: "Politics & Law",    emoji: "⚖️", color: "#64748b", gradient: "from-slate-500 to-gray-600",   search: "politics government law",            children: [
    { key: "government",        label: "Government & Policy",   search: "government policy Congress White House" },
    { key: "law",               label: "Law & Justice",         search: "law court justice legal ruling" },
    { key: "military",          label: "Military & Defense",    search: "military defense army navy air force" },
    { key: "global-orgs",       label: "Global Organizations",  search: "United Nations NATO G7 international" },
    { key: "elections",         label: "Elections & Democracy", search: "elections voting democracy" },
    { key: "geopolitics",       label: "Geopolitics",           search: "geopolitics international relations war" },
  ]},
  { key: "energy",               label: "Energy",            emoji: "⚡", color: "#f59e0b", gradient: "from-amber-500 to-yellow-600", search: "energy power oil gas",               children: [
    { key: "renewables",        label: "Renewables & Solar",    search: "renewable energy solar wind power" },
    { key: "oil-gas",           label: "Oil & Gas",             search: "oil gas petroleum OPEC" },
    { key: "nuclear",           label: "Nuclear Energy",        search: "nuclear energy reactor power plant" },
    { key: "climate",           label: "Climate & Environment", search: "climate change global warming emissions" },
    { key: "ev-batteries",      label: "EVs & Batteries",       search: "electric vehicle battery EV Tesla" },
    { key: "grid",              label: "Power Grid & Storage",  search: "power grid energy storage infrastructure" },
  ]},
  { key: "education-knowledge",  label: "Education",         emoji: "📚", color: "#06b6d4", gradient: "from-cyan-500 to-sky-600",    search: "education learning knowledge",       children: [
    { key: "k-12",              label: "K-12 Education",        search: "K-12 school education children" },
    { key: "higher-ed",         label: "Higher Education",      search: "university college higher education" },
    { key: "research",          label: "Research & Academia",   search: "academic research study findings" },
    { key: "online-learning",   label: "Online Learning",       search: "online learning edtech courses" },
    { key: "stem",              label: "STEM Education",        search: "STEM science technology engineering math" },
    { key: "information-theory",label: "Information Theory",    search: "information theory data systems" },
  ]},
  { key: "consumer-discretionary",label: "Lifestyle",        emoji: "🛍️", color: "#ec4899", gradient: "from-pink-500 to-rose-500",  search: "lifestyle consumer shopping",        children: [
    { key: "autos-evs",         label: "Autos & EVs",           search: "cars automobiles electric vehicle" },
    { key: "fashion-apparel",   label: "Fashion & Apparel",     search: "fashion clothing apparel style" },
    { key: "travel",            label: "Travel & Tourism",      search: "travel tourism destinations hotels" },
    { key: "food-cuisine",      label: "Food & Cuisine",        search: "food cuisine restaurants cooking recipes" },
    { key: "luxury",            label: "Luxury & Watches",      search: "luxury watches brands designer" },
    { key: "retail",            label: "Retail & E-commerce",   search: "retail e-commerce Amazon shopping" },
  ]},
  { key: "communication-services",label: "Media & Entertainment",emoji: "📡", color: "#a855f7", gradient: "from-purple-500 to-violet-600", search: "media entertainment streaming", children: [
    { key: "entertainment",     label: "Entertainment",         search: "movies TV shows Netflix entertainment" },
    { key: "gaming",            label: "Gaming",                search: "video games gaming console PS5 Xbox" },
    { key: "music",             label: "Music",                 search: "music artists albums streaming Spotify" },
    { key: "social-media",      label: "Social Media",          search: "social media Twitter Instagram TikTok" },
    { key: "streaming",         label: "Streaming & OTT",       search: "streaming Netflix HBO Disney+ OTT" },
    { key: "media-forms",       label: "Media & Journalism",    search: "journalism news media publishing" },
  ]},
  { key: "industrials",          label: "Industrials",       emoji: "🏗️", color: "#0ea5e9", gradient: "from-sky-500 to-blue-600",    search: "industrial manufacturing",           children: [
    { key: "aerospace",         label: "Aerospace",             search: "aerospace Boeing Lockheed aircraft" },
    { key: "manufacturing",     label: "Manufacturing",         search: "manufacturing production industry" },
    { key: "transportation",    label: "Transportation",        search: "transportation shipping freight logistics" },
    { key: "infrastructure",    label: "Infrastructure",        search: "infrastructure construction roads bridges" },
    { key: "supply-chain",      label: "Supply Chain",          search: "supply chain logistics global trade" },
    { key: "robotics",          label: "Robotics & Automation", search: "robotics automation factory" },
  ]},
  { key: "real-estate",          label: "Real Estate",       emoji: "🏠", color: "#f97316", gradient: "from-orange-400 to-amber-500", search: "real estate property housing",      children: [
    { key: "housing",           label: "Housing Market",        search: "housing market home prices mortgage" },
    { key: "commercial",        label: "Commercial RE",         search: "commercial real estate office retail" },
    { key: "reits",             label: "REITs & Investment",    search: "REIT real estate investment trust" },
    { key: "geography",         label: "Geography & Cities",    search: "cities urban geography population" },
    { key: "construction",      label: "Construction",          search: "construction building development" },
    { key: "space-exploration", label: "Space & Orbits",        search: "space exploration SpaceX NASA orbit" },
  ]},
  { key: "consumer-staples",     label: "Food & Agriculture",emoji: "🌾", color: "#84cc16", gradient: "from-lime-500 to-green-600",  search: "food agriculture farming",           children: [
    { key: "agriculture",       label: "Agriculture",           search: "agriculture farming crops livestock" },
    { key: "food-retail",       label: "Food & Beverages",      search: "food beverages grocery supermarket" },
    { key: "sustainability",    label: "Sustainability",         search: "sustainability organic green farming" },
    { key: "global-food",       label: "Global Food Supply",    search: "global food supply hunger nutrition" },
    { key: "biotech-food",      label: "Food Technology",       search: "food technology lab grown meat GMO" },
    { key: "water",             label: "Water & Resources",     search: "water resources environment" },
  ]},
  { key: "utilities",            label: "Environment",       emoji: "🌍", color: "#22c55e", gradient: "from-green-500 to-emerald-600", search: "environment ecology climate",      children: [
    { key: "ecology",           label: "Ecology & Biodiversity", search: "ecology biodiversity wildlife species" },
    { key: "climate-change",    label: "Climate Change",        search: "climate change global warming policy" },
    { key: "pollution",         label: "Pollution & Waste",     search: "pollution plastic waste recycling" },
    { key: "oceans",            label: "Oceans & Marine",       search: "ocean marine sea coral reef" },
    { key: "forests",           label: "Forests & Land",        search: "forests deforestation land conservation" },
    { key: "clean-energy",      label: "Clean Energy",          search: "clean energy green hydrogen" },
  ]},
  { key: "time-history",         label: "History & Culture", emoji: "⏳", color: "#d97706", gradient: "from-amber-600 to-orange-600", search: "history culture civilizations",    children: [
    { key: "eras",              label: "Eras & Epochs",         search: "historical eras ancient medieval modern" },
    { key: "civilizations",     label: "Civilizations",         search: "civilizations cultures ancient history" },
    { key: "wars",              label: "Wars & Conflicts",      search: "wars military history battles conflicts" },
    { key: "inventions",        label: "Inventions & Discovery", search: "inventions discoveries breakthroughs" },
    { key: "world-culture",     label: "World Cultures",        search: "world cultures traditions customs" },
    { key: "languages",         label: "Languages & Linguistics", search: "languages linguistics dialect" },
  ]},
  { key: "religion-culture",     label: "Religion & Society",emoji: "🌐", color: "#8b5cf6", gradient: "from-violet-500 to-purple-600", search: "religion society culture",        children: [
    { key: "religions",         label: "Religions",             search: "religion faith Christianity Islam Buddhism" },
    { key: "mythology",         label: "Mythology",             search: "mythology gods legends folklore" },
    { key: "society",           label: "Society & Culture",     search: "society culture social trends" },
    { key: "art",               label: "Arts & Design",         search: "art design museum gallery" },
    { key: "philosophy",        label: "Philosophy",            search: "philosophy ethics morality" },
    { key: "diversity",         label: "Diversity & Inclusion", search: "diversity inclusion equity" },
  ]},
  { key: "human-experience",     label: "Psychology & Mind", emoji: "🧠", color: "#f43f5e", gradient: "from-rose-500 to-pink-600",  search: "psychology mind behavior",           children: [
    { key: "emotions",          label: "Emotions & Wellbeing",  search: "emotions wellbeing happiness stress" },
    { key: "cognition",         label: "Cognition & Memory",    search: "cognition memory learning brain" },
    { key: "personality",       label: "Personality & Behavior", search: "personality behavior psychology traits" },
    { key: "social-systems",    label: "Social Systems",        search: "social systems society behavior" },
    { key: "consciousness",     label: "Consciousness",         search: "consciousness awareness mind" },
    { key: "life-stages",       label: "Life Stages",           search: "life stages development aging childhood" },
  ]},
  { key: "materials",            label: "Materials & Science",emoji: "⚗️", color: "#6b7280", gradient: "from-gray-500 to-slate-600", search: "materials chemistry physics",        children: [
    { key: "nanotechnology",    label: "Nanotechnology",        search: "nanotechnology nanomaterials nano" },
    { key: "metals-mining",     label: "Metals & Mining",       search: "metals mining gold silver copper" },
    { key: "chemicals",         label: "Chemicals & Materials", search: "chemicals materials polymer composite" },
    { key: "quantum",           label: "Quantum Computing",     search: "quantum computing qubit" },
    { key: "biotech-materials", label: "Biotech & Genomics",    search: "genomics CRISPR gene editing biotech" },
    { key: "new-materials",     label: "Advanced Materials",    search: "advanced materials graphene superconductor" },
  ]},
  { key: "deep-root-domains",    label: "Deep Knowledge",    emoji: "🌌", color: "#7c3aed", gradient: "from-violet-600 to-indigo-700", search: "philosophy systems theory deep", children: [
    { key: "systems-theory",    label: "Systems Theory",        search: "systems theory complexity emergence" },
    { key: "game-theory",       label: "Game Theory",           search: "game theory strategy decision making" },
    { key: "ethics-ai",         label: "AI Ethics",             search: "AI ethics artificial intelligence safety" },
    { key: "cosmology",         label: "Cosmology & Universe",  search: "cosmology universe dark matter big bang" },
    { key: "evolution",         label: "Evolution & Life",      search: "evolution natural selection Darwin biology" },
    { key: "mythic-structure",  label: "Mythic Structure",      search: "mythology narrative hero's journey archetype" },
  ]},
];

function NewsSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-border/20 overflow-hidden animate-pulse shadow-sm">
          <div className="h-44 bg-gradient-to-br from-muted/40 to-muted/20" />
          <div className="p-4 space-y-2.5">
            <div className="h-2.5 bg-muted/40 rounded-full w-1/4" />
            <div className="h-4 bg-muted/40 rounded-full w-5/6" />
            <div className="h-3 bg-muted/30 rounded-full w-full" />
            <div className="h-3 bg-muted/30 rounded-full w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function OmegaNewsCard({ article, onExpand, isExpanded, onSave, isSaved, onFollow, followedTopics }: {
  article: FeedArticle; onExpand: () => void; isExpanded: boolean;
  onSave?: (article: FeedArticle) => void; isSaved?: boolean;
  onFollow?: (topic: string) => void; followedTopics?: string[];
}) {
  const [imgError, setImgError] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [username, setUsername] = useState(() => localStorage.getItem("feed_username") || "");
  const [showComments, setShowComments] = useState(false);
  const [posting, setPosting] = useState(false);
  const [, setLocation] = useLocation();
  const isVideo = article.type === "video";
  const color = article.sourceColor || "#f97316";
  const hasImg = article.image && !imgError && !article.image.includes("gstatic.com/favicon");
  const topic = article.category || article.source || "General";
  const isFollowing = followedTopics?.includes(topic) || followedTopics?.includes(article.source);

  const openStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    sessionStorage.setItem(`article_${article.id}`, JSON.stringify(article));
    setLocation(`/story/${article.id}`);
  };

  useEffect(() => {
    if (isExpanded) fetch(`/api/feed/comments/${article.id}`).then(r => r.json()).then(setComments).catch(() => {});
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
      if (r.ok) { const c = await r.json(); setComments(prev => [c, ...prev]); setNewComment(""); }
    } catch {}
    setPosting(false);
  };

  if (isExpanded) {
    return (
      <div className="col-span-full bg-white rounded-2xl border border-border/20 overflow-hidden shadow-lg animate-in fade-in duration-300" data-testid={`omega-card-${article.id}`}>
        <div className="relative">
          {isVideo && article.videoUrl ? (
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe src={article.videoUrl} className="absolute inset-0 w-full h-full border-0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation" />
            </div>
          ) : hasImg ? (
            <img src={article.image} alt={article.title} className="w-full max-h-80 object-cover" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-40 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}20, ${color}40)` }}>
              <Newspaper size={40} style={{ color }} className="opacity-40" />
            </div>
          )}
          <button onClick={onExpand} className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors" data-testid={`omega-collapse-${article.id}`}>
            <X size={14} />
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ color, backgroundColor: `${color}18` }}>{article.source}</span>
            <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1"><Clock size={9} /> {timeAgo(article.pubDate)}</span>
            {(Date.now() - new Date(article.pubDate).getTime()) < 3 * 60 * 60 * 1000 && <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-green-500 text-white animate-pulse">NEW</span>}
            {isVideo && <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-red-600 text-white flex items-center gap-1"><Play size={7} fill="white" />VIDEO</span>}
          </div>
          <h2 className="text-xl font-bold mb-3 text-foreground leading-snug">{article.title}</h2>
          <p className="text-sm text-foreground/75 leading-relaxed mb-4">{article.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {isVideo ? (
              <a href={article.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors" data-testid={`omega-watch-${article.id}`}>
                <Play size={13} fill="white" /> Watch Video
              </a>
            ) : (
              <button onClick={openStory} className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-md" data-testid={`omega-readmore-${article.id}`}>
                <BookOpen size={14} /> Read Full Story <ChevronRight size={14} />
              </button>
            )}
            {onSave && (
              <button onClick={e => { e.stopPropagation(); onSave(article); }} data-testid={`omega-save-${article.id}`}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${isSaved ? "border-orange-300 bg-orange-50 dark:bg-orange-900/20 text-orange-600" : "border-border/30 text-muted-foreground hover:border-orange-300 hover:text-orange-500"}`}
                title={isSaved ? "Remove from saved" : "Save article"}>
                <Bookmark size={13} fill={isSaved ? "currentColor" : "none"} />
                {isSaved ? "Saved" : "Save"}
              </button>
            )}
            {onFollow && (
              <button onClick={e => { e.stopPropagation(); onFollow(topic); }} data-testid={`omega-follow-${article.id}`}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${isFollowing ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "border-border/30 text-muted-foreground hover:border-blue-300 hover:text-blue-500"}`}
                title={isFollowing ? `Unfollow ${topic}` : `Follow ${topic}`}>
                <Bell size={13} fill={isFollowing ? "currentColor" : "none"} />
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <MessageCircle size={15} /> {comments.length}
            </button>
          </div>
          {showComments && (
            <div className="mt-4 border-t border-border/20 pt-4 space-y-3">
              <div className="flex gap-2">
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Your name" className="w-28 px-3 py-2 text-xs border border-border/30 rounded-xl focus:outline-none focus:border-orange-300 bg-muted/10" data-testid={`omega-comment-name-${article.id}`} />
                <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." className="flex-1 px-3 py-2 text-xs border border-border/30 rounded-xl focus:outline-none focus:border-orange-300 bg-muted/10" onKeyDown={e => e.key === "Enter" && postComment()} data-testid={`omega-comment-input-${article.id}`} />
                <button onClick={postComment} disabled={posting || !newComment.trim() || !username.trim()} className="px-4 py-2 text-xs font-semibold bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors" data-testid={`omega-comment-submit-${article.id}`}>{posting ? "..." : "Post"}</button>
              </div>
              {comments.length === 0 && <p className="text-xs text-muted-foreground/40 text-center py-2">No comments yet. Be the first!</p>}
              {comments.map(c => (
                <div key={c.id} className="flex gap-2 items-start">
                  <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0"><User size={12} className="text-orange-500" /></div>
                  <div><div className="flex items-center gap-2"><span className="text-xs font-semibold">{c.username}</span><span className="text-[10px] text-muted-foreground/40">{timeAgo(c.createdAt as unknown as string)}</span></div><p className="text-xs text-foreground/70 mt-0.5">{c.content}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border/20 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer" onClick={onExpand} data-testid={`omega-card-${article.id}`}>
      <div className="relative overflow-hidden">
        {hasImg ? (
          <img src={article.image} alt={article.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-44 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}15, ${color}35)` }}>
            {isVideo ? <Play size={36} style={{ color }} className="opacity-60" /> : <Newspaper size={30} style={{ color }} className="opacity-30" />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {isVideo && hasImg && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center shadow-xl opacity-90 group-hover:scale-110 transition-transform">
              <Play size={20} className="text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          {isVideo && <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-600 text-white flex items-center gap-1"><Play size={7} fill="white" />VIDEO</span>}
          {(Date.now() - new Date(article.pubDate).getTime()) < 3 * 60 * 60 * 1000 && <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-500 text-white">NEW</span>}
        </div>
        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-xs font-medium drop-shadow">{isVideo ? "▶ Watch video" : "Click to read"}</span>
        </div>
      </div>
      <div className="p-3.5">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full truncate max-w-[90px]" style={{ color, backgroundColor: `${color}18` }}>{article.source}</span>
          <span className="text-[9px] text-muted-foreground/40 flex items-center gap-0.5 shrink-0"><Clock size={8} />{timeAgo(article.pubDate)}</span>
        </div>
        <h3 className="font-bold text-[13px] leading-snug text-foreground line-clamp-2 group-hover:text-orange-600 transition-colors" data-testid={`omega-title-${article.id}`}>{article.title}</h3>
        <p className="text-[11px] text-muted-foreground/60 mt-1.5 line-clamp-2">{article.description}</p>
      </div>
    </div>
  );
}

type FeedMode = "all" | "news" | "videos" | "saved" | "following";

function NewsFeed() {
  const [activeDomainKey, setActiveDomainKey] = useState<string | null>(null);
  const [activeCatKey, setActiveCatKey] = useState<string | null>(null);
  const [articles, setArticles] = useState<FeedArticle[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [feedLoaded, setFeedLoaded] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [filter, setFilter] = useState<string>("All");
  const [showAllDomains, setShowAllDomains] = useState(false);
  const [feedMode, setFeedMode] = useState<FeedMode>("all");
  const [savedArticleIds, setSavedArticleIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("omega_saved_articles") || "[]")); } catch { return new Set(); }
  });
  const [savedArticlesList, setSavedArticlesList] = useState<FeedArticle[]>(() => {
    try { return JSON.parse(localStorage.getItem("omega_saved_articles_data") || "[]"); } catch { return []; }
  });
  const [followedTopicsList, setFollowedTopicsList] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("omega_followed_topics") || "[]"); } catch { return []; }
  });
  const [followingStories, setFollowingStories] = useState<any[]>([]);
  const [fractalLoading, setFractalLoading] = useState(false);
  const [fractalGenerated, setFractalGenerated] = useState<any | null>(null);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const saveArticle = (article: FeedArticle) => {
    const newIds = new Set(savedArticleIds);
    const newList = savedArticlesList.filter(a => a.id !== article.id);
    if (savedArticleIds.has(article.id)) {
      newIds.delete(article.id);
      toast({ title: "Removed from saved" });
    } else {
      newIds.add(article.id);
      newList.unshift(article);
      toast({ title: "Saved!", description: "Article saved to your reading list" });
    }
    setSavedArticleIds(newIds);
    setSavedArticlesList(newList);
    localStorage.setItem("omega_saved_articles", JSON.stringify([...newIds]));
    localStorage.setItem("omega_saved_articles_data", JSON.stringify(newList));
  };

  const followTopic = (topic: string) => {
    const current = followedTopicsList;
    if (current.includes(topic)) {
      const next = current.filter(t => t !== topic);
      setFollowedTopicsList(next);
      localStorage.setItem("omega_followed_topics", JSON.stringify(next));
      toast({ title: `Unfollowed "${topic}"` });
    } else {
      const next = [...current, topic];
      setFollowedTopicsList(next);
      localStorage.setItem("omega_followed_topics", JSON.stringify(next));
      toast({ title: `Following "${topic}"`, description: "You'll see AI updates for this topic" });
    }
  };

  const generateFractalStory = async (topic: string) => {
    setFractalLoading(true);
    setFractalGenerated(null);
    try {
      const r = await fetch("/api/news/generate-topic", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await r.json();
      if (data.story) {
        setFractalGenerated(data);
        toast({ title: "AI Story Generated!", description: `New story about "${topic}" is ready` });
      }
    } catch {
      toast({ title: "Generation failed", description: "Try again in a moment", variant: "destructive" });
    }
    setFractalLoading(false);
  };

  useEffect(() => {
    if (feedMode === "following" && followedTopicsList.length > 0) {
      fetch("/api/news/feed/following").then(r => r.json()).then(d => setFollowingStories(d.stories || [])).catch(() => {});
    }
  }, [feedMode, followedTopicsList]);

  const activeDomain = OMEGA_SPINE.find(d => d.key === activeDomainKey) || null;
  const activeCategory = activeDomain?.children?.find(c => c.key === activeCatKey) || null;

  const currentSearchTerm = useMemo(() => {
    if (searchQuery) return searchQuery;
    if (activeCategory) return activeCategory.search;
    if (activeDomain) return activeDomain.search;
    return "";
  }, [searchQuery, activeCategory, activeDomain]);

  const fetchPage = useCallback(async (p: number, reset = false, term?: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      let feedUrl: string;
      const q = term !== undefined ? term : currentSearchTerm;
      if (q) {
        feedUrl = `/api/feed/search?q=${encodeURIComponent(q)}&page=${p}`;
      } else {
        feedUrl = `/api/feed?page=${p}`;
        if (feedMode === "videos") feedUrl += "&type=video";
        else if (feedMode === "news") feedUrl += "&type=article";
        else if (filter === "Videos") feedUrl += "&type=video";
        else if (filter !== "All") feedUrl += `&source=${encodeURIComponent(filter)}`;
      }
      const r = await fetch(feedUrl);
      const data: FeedResponse = await r.json();
      setArticles(prev => {
        if (reset || p === 1) return data.articles;
        const ids = new Set(prev.map(a => a.id));
        return [...prev, ...data.articles.filter(a => !ids.has(a.id))];
      });
      setHasMore(data.hasMore ?? false);
      setTotal(data.total ?? data.articles.length);
      setPage(p);
      if (p === 1) setLastRefreshed(new Date());
    } catch {}
    setLoading(false);
    setLoadingMore(false);
    loadingRef.current = false;
  }, [filter, currentSearchTerm]);

  const loadFeed = useCallback(() => {
    setFeedLoaded(true);
    setArticles([]);
    setPage(1);
    setHasMore(true);
    fetchPage(1, true);
  }, [fetchPage]);

  const selectDomain = useCallback((domainKey: string | null) => {
    setActiveDomainKey(domainKey);
    setActiveCatKey(null);
    setArticles([]);
    setPage(1);
    setHasMore(true);
    setExpandedId(null);
    setSearchQuery("");
    setSearchInput("");
    if (domainKey) {
      const d = OMEGA_SPINE.find(x => x.key === domainKey);
      if (d) {
        setFeedLoaded(true);
        setLoading(true);
        loadingRef.current = false;
        fetchPage(1, true, d.search);
      }
    } else {
      setFeedLoaded(false);
    }
  }, [fetchPage]);

  const selectCategory = useCallback((domainKey: string, catKey: string) => {
    setActiveDomainKey(domainKey);
    setActiveCatKey(catKey);
    setArticles([]);
    setPage(1);
    setHasMore(true);
    setExpandedId(null);
    setSearchQuery("");
    setSearchInput("");
    const d = OMEGA_SPINE.find(x => x.key === domainKey);
    const cat = d?.children?.find(c => c.key === catKey);
    if (cat) {
      setFeedLoaded(true);
      setLoading(true);
      loadingRef.current = false;
      fetchPage(1, true, cat.search);
    }
  }, [fetchPage]);

  useEffect(() => {
    if (!feedLoaded || searchQuery || loading) return;
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 400 && hasMore && !loadingRef.current) {
        fetchPage(page + 1);
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [page, hasMore, fetchPage, searchQuery, feedLoaded, loading]);

  const handleSearch = useCallback(async (q: string) => {
    q = q.trim();
    if (!q) { clearSearch(); return; }
    setSearchLoading(true);
    setSearchQuery(q);
    setActiveDomainKey(null);
    setActiveCatKey(null);
    trackInteraction("search", { text: q, topic: q });
    try {
      const r = await fetch(`/api/feed/search?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      setArticles(data.articles || []);
      setTotal(data.total || 0);
      setHasMore(false);
      setFeedLoaded(true);
    } catch {}
    setSearchLoading(false);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery(""); setSearchInput("");
    setActiveDomainKey(null); setActiveCatKey(null);
    setArticles([]); setPage(1); setHasMore(true);
    setFeedLoaded(false);
  }, []);

  const handleRefresh = () => {
    setArticles([]); setPage(1); setHasMore(true);
    loadingRef.current = false;
    fetchPage(1, true);
  };

  const pageTitle = searchQuery
    ? `Search: "${searchQuery}"`
    : activeCategory
    ? `${activeDomain?.label} › ${activeCategory.label}`
    : activeDomain
    ? activeDomain.label
    : "Omega News Hub";

  const domainSources = ["All", "Videos", "YouTube", "BBC World", "NPR", "TechCrunch", "The Verge"];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-slate-50 to-background dark:from-slate-900/30 dark:to-background">

      {/* ── HEADER ── */}
      <div className="shrink-0 border-b border-border/20 bg-white/90 dark:bg-background/90 backdrop-blur-sm">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {(activeDomainKey || searchQuery) && (
                <button onClick={clearSearch} className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors shrink-0" data-testid="button-feed-back">
                  <ChevronLeft size={16} />
                </button>
              )}
              {activeDomain && !searchQuery && (
                <div className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0 text-lg" style={{ background: `linear-gradient(135deg, ${activeDomain.color}25, ${activeDomain.color}45)` }}>
                  {activeDomain.emoji}
                </div>
              )}
              {!activeDomain && !searchQuery && (
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shrink-0">
                  <Newspaper size={16} className="text-white" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="font-bold text-base text-foreground leading-tight truncate" data-testid="text-feed-title">{pageTitle}</h1>
                <p className="text-[10px] text-muted-foreground/50 leading-tight">
                  {searchQuery ? `${total} results found` : activeDomain ? (activeCategory ? activeCategory.label + " · Live coverage" : "All categories · Live coverage") : "20 domains · 120+ categories · Live worldwide coverage"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {feedLoaded && (
                <button onClick={handleRefresh} className="p-1.5 rounded-lg hover:bg-orange-50 text-muted-foreground hover:text-orange-500 transition-colors" title="Refresh" data-testid="button-refresh-feed">
                  <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                </button>
              )}
              {total > 0 && <span className="text-[10px] text-muted-foreground/40">{total}</span>}
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Live" />
            </div>
          </div>

          {/* Search */}
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchInput); }} className="mb-3" data-testid="form-feed-search">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search across all 120+ categories..." className="w-full pl-9 pr-20 py-2 text-sm bg-muted/20 border border-border/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 placeholder:text-muted-foreground/40 transition-all" data-testid="input-feed-search" />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {(searchQuery || searchInput) && <button type="button" onClick={clearSearch} className="p-1 rounded-md hover:bg-muted/30 text-muted-foreground/50 hover:text-foreground transition-colors" data-testid="button-clear-search"><X size={13} /></button>}
                <button type="submit" disabled={searchLoading || !searchInput.trim()} className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 transition-colors" data-testid="button-search-submit">{searchLoading ? <RefreshCw size={11} className="animate-spin" /> : "Search"}</button>
              </div>
            </div>
          </form>

          {/* Feed Mode Tabs */}
          <div className="flex gap-1 mb-2.5 bg-muted/20 p-0.5 rounded-xl" data-testid="feed-mode-tabs">
            {([
              { id: "all", label: "All", emoji: "🔥" },
              { id: "news", label: "News", emoji: "📰" },
              { id: "videos", label: "Videos", emoji: "🎥" },
              { id: "saved", label: "Saved", emoji: "🔖", count: savedArticleIds.size },
              { id: "following", label: "Following", emoji: "👁", count: followedTopicsList.length },
            ] as const).map(m => (
              <button key={m.id} onClick={() => { setFeedMode(m.id); setActiveDomainKey(null); setActiveCatKey(null); setSearchQuery(""); setSearchInput(""); setExpandedId(null); setFractalGenerated(null); if (m.id !== "saved" && m.id !== "following") { setFeedLoaded(false); } }} data-testid={`feed-mode-${m.id}`}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${feedMode === m.id ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <span>{m.emoji}</span>
                <span className="hidden sm:inline">{m.label}</span>
                {"count" in m && (m.count ?? 0) > 0 && <span className="ml-0.5 bg-orange-500 text-white text-[8px] rounded-full px-1 min-w-[14px] text-center leading-[14px]">{m.count}</span>}
              </button>
            ))}
          </div>

          {/* Domain tabs */}
          {!searchQuery && feedMode === "all" && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1.5">
              <button onClick={() => selectDomain(null)} data-testid="feed-domain-all"
                className={`px-3 py-1 text-[10px] font-bold rounded-full whitespace-nowrap transition-all shrink-0 flex items-center gap-1 ${!activeDomainKey ? "bg-orange-500 text-white shadow-sm" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>
                🔥 All
              </button>
              {OMEGA_SPINE.map(d => (
                <button key={d.key} onClick={() => selectDomain(d.key)} data-testid={`feed-domain-${d.key}`}
                  className={`px-3 py-1 text-[10px] font-bold rounded-full whitespace-nowrap transition-all shrink-0 flex items-center gap-1 ${
                    activeDomainKey === d.key
                      ? "text-white shadow-sm"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  }`}
                  style={activeDomainKey === d.key ? { background: `linear-gradient(135deg, ${d.color}, ${d.color}cc)` } : {}}>
                  {d.emoji} {d.label}
                </button>
              ))}
            </div>
          )}

          {/* Category sub-tabs */}
          {activeDomain && !searchQuery && activeDomain.children.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 mt-1.5">
              <button onClick={() => { setActiveCatKey(null); setArticles([]); setPage(1); setHasMore(true); loadingRef.current = false; fetchPage(1, true, activeDomain.search); }} data-testid="feed-cat-all"
                className={`px-3 py-1 text-[10px] font-semibold rounded-full whitespace-nowrap transition-all shrink-0 border ${!activeCatKey ? "text-white border-transparent shadow-sm" : "bg-white border-border/30 text-muted-foreground hover:border-orange-200"}`}
                style={!activeCatKey ? { background: `linear-gradient(135deg, ${activeDomain.color}, ${activeDomain.color}cc)` } : {}}>
                All {activeDomain.label}
              </button>
              {activeDomain.children.map(cat => (
                <button key={cat.key} onClick={() => selectCategory(activeDomain.key, cat.key)} data-testid={`feed-cat-${cat.key}`}
                  className={`px-3 py-1 text-[10px] font-semibold rounded-full whitespace-nowrap transition-all shrink-0 border ${activeCatKey === cat.key ? "text-white border-transparent shadow-sm" : "bg-white border-border/30 text-muted-foreground hover:border-orange-200"}`}
                  style={activeCatKey === cat.key ? { background: `linear-gradient(135deg, ${activeDomain.color}, ${activeDomain.color}cc)` } : {}}>
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* Source filter when browsing all */}
          {!activeDomainKey && !searchQuery && feedLoaded && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 mt-1.5">
              {domainSources.map(s => (
                <button key={s} onClick={() => { setFilter(s); setArticles([]); setPage(1); setHasMore(true); loadingRef.current = false; }} data-testid={`feed-filter-${s}`}
                  className={`px-2.5 py-0.5 text-[10px] font-medium rounded-full whitespace-nowrap transition-all shrink-0 ${filter === s ? (s === "Videos" ? "bg-red-500 text-white shadow-sm" : "bg-orange-500 text-white shadow-sm") : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>
                  {s === "Videos" && "▶ "}{s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN SCROLL AREA ── */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>

        {/* ── DOMAIN HOMEPAGE (no domain selected, feed not loaded) ── */}
        {!activeDomainKey && !searchQuery && !feedLoaded && (
          <div className="p-4">
            {/* Hero banner */}
            <div className="relative mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 p-6 text-white shadow-xl">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)" }} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">Live · Quantum Pulse Intelligence</span>
                </div>
                <h2 className="text-2xl font-black mb-1">Omega News Hub</h2>
                <p className="text-sm opacity-80 mb-4">20 domains · 120+ categories · Every topic on Earth covered live</p>
                <button onClick={loadFeed} className="px-5 py-2.5 bg-white text-orange-600 font-bold text-sm rounded-xl hover:bg-orange-50 transition-colors shadow-lg" data-testid="button-load-feed">
                  🔥 Load Top Stories
                </button>
              </div>
            </div>

            {/* Domain grid */}
            <div className="mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-3">Browse All 20 Domains</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {OMEGA_SPINE.map(d => (
                  <button key={d.key} onClick={() => selectDomain(d.key)} data-testid={`domain-card-${d.key}`}
                    className="relative overflow-hidden rounded-2xl p-4 text-left group transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                    style={{ background: `linear-gradient(135deg, ${d.color}20, ${d.color}35)`, border: `1px solid ${d.color}30` }}>
                    <div className="text-2xl mb-1.5">{d.emoji}</div>
                    <div className="text-[11px] font-bold text-foreground leading-tight">{d.label}</div>
                    <div className="text-[9px] text-muted-foreground/60 mt-0.5">{d.children.length > 0 ? `${d.children.length} categories` : "Explore"}</div>
                    <div className="absolute -bottom-2 -right-2 text-4xl opacity-10 group-hover:opacity-20 transition-opacity select-none">{d.emoji}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DOMAIN OVERVIEW (domain selected, no cat, articles loaded) ── */}
        {activeDomain && !activeCatKey && !searchQuery && activeDomain.children.length > 0 && articles.length === 0 && !loading && feedLoaded && (
          <div className="p-4">
            <div className="relative rounded-2xl overflow-hidden p-5 mb-5 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${activeDomain.color}, ${activeDomain.color}99)` }}>
              <div className="text-4xl mb-2">{activeDomain.emoji}</div>
              <h2 className="text-xl font-black mb-1">{activeDomain.label}</h2>
              <p className="text-xs opacity-75">Live news across {activeDomain.children.length} sub-categories</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {activeDomain.children.map(cat => (
                <button key={cat.key} onClick={() => selectCategory(activeDomain.key, cat.key)} data-testid={`cat-card-${cat.key}`}
                  className="p-4 rounded-2xl text-left group transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ background: `${activeDomain.color}12`, border: `1px solid ${activeDomain.color}25` }}>
                  <div className="text-[12px] font-bold text-foreground">{cat.label}</div>
                  <div className="text-[10px] text-muted-foreground/50 mt-0.5 flex items-center gap-1">Live <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" /></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── SAVED ARTICLES VIEW ── */}
        {feedMode === "saved" && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Bookmark size={16} className="text-orange-500" />
              <h2 className="text-sm font-bold">Saved Articles</h2>
              <span className="text-xs text-muted-foreground/50">{savedArticlesList.length} saved</span>
            </div>
            {savedArticlesList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bookmark size={40} className="text-muted-foreground/20 mb-4" />
                <p className="text-sm font-semibold text-muted-foreground/60 mb-1">No saved articles yet</p>
                <p className="text-xs text-muted-foreground/40">Tap the bookmark icon on any article to save it</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedArticlesList.map(article => (
                  <OmegaNewsCard key={article.id} article={article} isExpanded={expandedId === article.id}
                    onExpand={() => setExpandedId(expandedId === article.id ? null : article.id)}
                    onSave={saveArticle} isSaved={savedArticleIds.has(article.id)}
                    onFollow={followTopic} followedTopics={followedTopicsList}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FOLLOWING VIEW ── */}
        {feedMode === "following" && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={16} className="text-orange-500" />
              <h2 className="text-sm font-bold">Following</h2>
              <span className="text-xs text-muted-foreground/50">{followedTopicsList.length} topics</span>
            </div>
            {followedTopicsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bell size={40} className="text-muted-foreground/20 mb-4" />
                <p className="text-sm font-semibold text-muted-foreground/60 mb-1">Not following any topics</p>
                <p className="text-xs text-muted-foreground/40">Tap "Follow Topic" on any article to track AI updates</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-5">
                  {followedTopicsList.map(topic => (
                    <div key={topic} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/40 rounded-full text-xs font-medium text-orange-700 dark:text-orange-400" data-testid={`followed-topic-${topic}`}>
                      <Bell size={11} />
                      {topic}
                      <button onClick={() => followTopic(topic)} className="ml-1 hover:text-red-500 transition-colors" title="Unfollow"><X size={11} /></button>
                    </div>
                  ))}
                </div>
                {followingStories.length > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground/50 mb-3">AI-matched stories for your topics:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {followingStories.map((story: any) => (
                        <div key={story.articleId} className="bg-white dark:bg-zinc-900 border border-border/20 rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => { const a: FeedArticle = { id: story.articleId, title: story.seoTitle || story.title, description: story.summary || "", link: `/story/${story.articleId}`, image: story.heroImage || "", source: story.sourceName || "Quantum Pulse Intelligence", pubDate: story.createdAt, category: story.category, type: "article", videoUrl: "", sourceColor: "#f97316" }; sessionStorage.setItem(`article_${story.articleId}`, JSON.stringify(a)); window.location.href = `/story/${story.articleId}`; }} data-testid={`following-story-${story.articleId}`}>
                          {story.heroImage && <img src={story.heroImage} alt={story.title} className="w-full h-32 object-cover rounded-xl mb-3" onError={e => { (e.target as any).style.display = "none"; }} />}
                          <div className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mb-1">{story.category}</div>
                          <h3 className="text-sm font-bold leading-snug mb-2">{story.seoTitle || story.title}</h3>
                          <p className="text-xs text-muted-foreground/70 line-clamp-2">{story.summary}</p>
                          <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground/50">
                            <span>⚡ Quantum Pulse Intelligence</span>
                            <span>·</span>
                            <span>{story.readTimeMinutes || 4} min read</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-xs text-muted-foreground/50">No matched stories yet. More AI stories will appear here as they're generated.</p>
                    <button onClick={() => generateFractalStory(followedTopicsList[0])} className="mt-3 px-4 py-2 bg-orange-500 text-white text-xs font-semibold rounded-xl hover:bg-orange-600 transition-colors" data-testid="button-generate-following">Generate story about "{followedTopicsList[0]}"</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── ARTICLES GRID ── */}
        {(feedMode === "all" || feedMode === "news" || feedMode === "videos") && loading && articles.length === 0 ? (
          <div className="p-4"><NewsSkeletonGrid count={6} /></div>
        ) : (feedMode === "all" || feedMode === "news" || feedMode === "videos") && feedLoaded && articles.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="text-4xl mb-3">{activeDomain?.emoji || (searchQuery ? "🔍" : "📰")}</div>
            <p className="text-sm font-semibold text-foreground/70 mb-1">{searchQuery ? `No news found for "${searchQuery}"` : "No articles found"}</p>
            <p className="text-xs text-muted-foreground/50 mb-5">{searchQuery ? "But our AI can generate a story about this topic for you!" : "Try refreshing or browsing a different category."}</p>
            {searchQuery && (
              <div className="mb-4 w-full max-w-sm">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800/40 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <Sparkles size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">AI Fractal Generation</div>
                      <div className="text-[10px] text-muted-foreground/60">Powered by Quantum Pulse Intelligence</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground/70 mb-4">Generate a comprehensive AI-written article about <strong>"{searchQuery}"</strong> — brand new knowledge created just for you.</p>
                  {fractalGenerated ? (
                    <button onClick={() => { const s = fractalGenerated.story; sessionStorage.setItem(`article_${s.articleId}`, JSON.stringify({ id: s.articleId, title: s.seoTitle || s.title, description: s.summary || "", link: `/story/${s.articleId}`, image: s.heroImage || "", source: "Quantum Pulse Intelligence", pubDate: s.createdAt, category: s.category, type: "article", videoUrl: "", sourceColor: "#f97316" })); window.location.href = `/story/${s.articleId}`; }}
                      className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2" data-testid="button-read-fractal">
                      <BookOpen size={13} /> Read Generated Story →
                    </button>
                  ) : (
                    <button onClick={() => generateFractalStory(searchQuery)} disabled={fractalLoading}
                      className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60" data-testid="button-generate-fractal">
                      {fractalLoading ? <><RefreshCw size={13} className="animate-spin" /> Generating AI Story...</> : <><Sparkles size={13} /> Generate AI Story about "{searchQuery}"</>}
                    </button>
                  )}
                </div>
              </div>
            )}
            <button onClick={handleRefresh} className="px-4 py-2 bg-muted/30 text-muted-foreground text-xs font-medium rounded-xl hover:bg-muted/50 transition-colors" data-testid="button-retry-feed">Try Refreshing</button>
          </div>
        ) : (feedMode === "all" || feedMode === "news" || feedMode === "videos") && articles.length > 0 ? (
          <div className="p-4">
            {/* Breadcrumb */}
            {(activeDomain || searchQuery) && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 mb-4 flex-wrap">
                <button onClick={clearSearch} className="hover:text-orange-500 transition-colors font-medium">Hub</button>
                {activeDomain && !searchQuery && (
                  <><ChevronRight size={10} /><button onClick={() => selectDomain(activeDomain.key)} className="hover:text-orange-500 transition-colors">{activeDomain.label}</button></>
                )}
                {activeCategory && (
                  <><ChevronRight size={10} /><span className="text-foreground/70 font-semibold">{activeCategory.label}</span></>
                )}
                {searchQuery && (
                  <><ChevronRight size={10} /><span className="text-foreground/70 font-semibold">"{searchQuery}"</span></>
                )}
                <span className="ml-auto text-[9px]">{total} stories · {timeAgo(lastRefreshed.toISOString())}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {articles.map(article => (
                <OmegaNewsCard key={article.id} article={article}
                  isExpanded={expandedId === article.id}
                  onExpand={() => {
                    const expanding = expandedId !== article.id;
                    setExpandedId(expanding ? article.id : null);
                    if (expanding) {
                      trackInteraction("article_click", { text: article.title, source: article.source, category: article.category, contentType: article.type });
                      if (scrollRef.current && expanding) setTimeout(() => scrollRef.current?.scrollTo({ top: 0 }), 50);
                    }
                  }}
                  onSave={saveArticle} isSaved={savedArticleIds.has(article.id)}
                  onFollow={followTopic} followedTopics={followedTopicsList}
                />
              ))}
            </div>

            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <RefreshCw size={14} className="animate-spin text-orange-500" /> Loading more stories...
                </div>
              </div>
            )}
            {!hasMore && articles.length > 0 && (
              <div className="text-center py-8 border-t border-border/20">
                <p className="text-xs text-muted-foreground/40 mb-3">You've reached the end of this feed.</p>
                <button onClick={handleRefresh} className="px-4 py-2 text-xs font-semibold text-orange-500 border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors" data-testid="button-load-fresh">↻ Load Fresh Content</button>
              </div>
            )}
          </div>
        ) : null}
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

  const [socialLoaded, setSocialLoaded] = useState(false);
  const [aiSeeded, setAiSeeded] = useState(false);
  const loadSocial = useCallback(async () => {
    setSocialLoaded(true); setPosts([]); setFeedPage(1); setHasMore(true);
    // Auto-seed AI entities on first load if not already done
    const seededKey = "myaigpt_social_ai_seeded";
    if (!localStorage.getItem(seededKey)) {
      try {
        await fetch("/api/social/seed-ai", { method: "POST" });
        localStorage.setItem(seededKey, "1");
        setAiSeeded(true);
      } catch {}
    }
    fetchFeed(1, true);
  }, [feedTab, fetchFeed]);

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

              {!socialLoaded && posts.length === 0 ? (
                <div className="bg-white border border-border/30 rounded-xl p-12 text-center">
                  <MessageCircle size={40} className="mx-auto text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground/50 mb-4">Click below to load the social feed</p>
                  <button onClick={loadSocial} data-testid="button-load-social"
                    className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors">
                    Load Social Feed
                  </button>
                </div>
              ) : loadingFeed && posts.length === 0 ? (
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
  const { settings: layoutSettings } = useAppSettings();
  useEffect(() => { const c = () => setIsOpen(window.innerWidth >= 768); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);
  return (
    <div className={`flex h-[100dvh] w-full bg-background overflow-hidden ${layoutSettings.sidebarPosition === "right" ? "flex-row-reverse" : ""}`}>
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <main className="flex-1 flex flex-col relative min-w-0 h-full">{children}</main>
    </div>
  );
}

function HomePage() {
  useEffect(() => { updateSEO({ title: "My Ai Gpt - AI Chat Assistant That Learns You | by Quantum Logic Network", description: "Chat with My Ai Gpt, your AI best friend that learns your interests. Ask anything, get personalized answers. Free AI chat powered by Quantum Pulse Intelligence. By Quantum Logic Network.", ogTitle: "My Ai Gpt - AI Chat Assistant | Quantum Logic Network", ogDesc: "Your AI best friend that learns you. Chat about anything. Free, personalized, intelligent.", ogType: "website", canonical: window.location.origin + "/", keywords: "AI chat, AI assistant, chatbot, Quantum Logic Network, My Ai Gpt, free AI, personalized AI, Quantum Pulse Intelligence, GPT chat, AI companion, smart assistant", author: "Quantum Logic Network", articleSection: "Artificial Intelligence", jsonLd: { "@context": "https://schema.org", "@type": "WebPage", "name": "My Ai Gpt - AI Chat", "description": "AI Chat Assistant that learns your interests", "url": window.location.origin + "/", "isPartOf": { "@type": "WebApplication", "name": "My Ai Gpt" }, "author": { "@type": "Person", "name": "Quantum Logic Network" }, "breadcrumb": { "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Home", "item": window.location.origin + "/" }] } } }); }, []);
  return <Layout><ChatInterface defaultType="general" /></Layout>;
}
function CoderPage() {
  useEffect(() => { updateSEO({ title: "My Ai Coder - AI Programming Assistant | Write Code with AI | My Ai Gpt", description: "Write code with AI assistance. My Ai Coder helps you debug, refactor, and build in any programming language. Python, JavaScript, TypeScript, Java, C++, Go, Rust and more. By Quantum Logic Network.", ogTitle: "My Ai Coder - AI Programming Assistant", ogDesc: "AI-powered coding assistant for any language. Debug, refactor, build faster.", ogType: "website", canonical: window.location.origin + "/coder", keywords: "AI coding assistant, code helper, programming AI, debug code, refactor code, Quantum Logic Network, Python AI, JavaScript AI, code generation, AI programmer", author: "Quantum Logic Network", articleSection: "Programming", jsonLd: { "@context": "https://schema.org", "@type": "WebPage", "name": "My Ai Coder", "description": "AI-powered programming assistant", "url": window.location.origin + "/coder", "isPartOf": { "@type": "WebApplication", "name": "My Ai Gpt" }, "breadcrumb": { "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Home", "item": window.location.origin + "/" }, { "@type": "ListItem", "position": 2, "name": "AI Coder", "item": window.location.origin + "/coder" }] } } }); }, []);
  return <Layout><ChatInterface defaultType="coder" /></Layout>;
}
function PlaygroundPage() {
  useEffect(() => { updateSEO({ title: "Code Playground - Write & Run Code in 30+ Languages Online Free | My Ai Gpt", description: "Free online code playground IDE by Quantum Logic Network. Write, run, and share code in JavaScript, Python, TypeScript, HTML/CSS, Java, C++, Go, Rust, Ruby, PHP, Swift, Kotlin and 20+ more languages with real-time preview and AI assistance.", ogTitle: "Code Playground - 30+ Languages Free Online IDE", ogDesc: "Free online IDE with 30+ languages. Write JavaScript, Python, TypeScript, HTML, and more with real-time preview.", ogType: "website", canonical: window.location.origin + "/code", keywords: "online code editor, free IDE, code playground, JavaScript editor, Python editor, online compiler, run code online, free coding, code runner, Quantum Logic Network, programming playground, HTML CSS editor, TypeScript playground", author: "Quantum Logic Network", articleSection: "Programming", jsonLd: { "@context": "https://schema.org", "@type": "WebPage", "name": "Code Playground", "description": "Write and run code in 30+ languages", "url": window.location.origin + "/code", "isPartOf": { "@type": "WebApplication", "name": "My Ai Gpt" }, "breadcrumb": { "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Home", "item": window.location.origin + "/" }, { "@type": "ListItem", "position": 2, "name": "Code Playground", "item": window.location.origin + "/code" }] } } }); }, []);
  return <Layout><CodePlayground /></Layout>;
}
function FeedPage() {
  useEffect(() => { updateSEO({ title: "My Ai Gpt News Hub - World Class AI News | Quantum Logic Network", description: "Read AI-written world news across every category — Technology, Finance, Science, Sports, Health, Energy, Government, Culture and more. Powered by the Omega News System by Quantum Logic Network.", ogTitle: "My Ai Gpt News Hub - Live AI News", ogDesc: "World-class AI-written news across every topic. Updated constantly. Powered by Quantum Logic Network.", ogType: "website", canonical: window.location.origin + "/feed", keywords: "AI news, world news, technology news, science news, finance news, AI written news, My Ai Gpt news, Quantum Logic Network, breaking news, industry news" }); }, []);
  return <NewsFeed />;
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
      toast({ title: "AI Studio is coming soon!", description: "Quantum Logic Network is building the ultimate creator tool for you." });
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
          <p className="text-muted-foreground text-sm mt-1">AI Image & Video Generation — Quantum Logic Network is building something incredible</p>
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
            <p className="text-xs text-muted-foreground/30 mt-1">Quantum Logic Network is building the ultimate AI image & video generator for you</p>
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

function EarningsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payoutEmail, setPayoutEmail] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("paypal");
  const [savingPayout, setSavingPayout] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [activeEarningsTab, setActiveEarningsTab] = useState<"overview" | "referrals" | "history" | "payouts">("overview");

  const fetchAffiliateData = useCallback(async () => {
    try {
      const r = await fetch("/api/affiliate/me", { credentials: "include" });
      if (r.ok) {
        const data = await r.json();
        setAffiliateData(data);
        setPayoutEmail(data.payoutEmail || "");
        setPayoutMethod(data.payoutMethod || "paypal");
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user) fetchAffiliateData(); else setLoading(false); }, [user, fetchAffiliateData]);

  const copyReferralLink = () => {
    if (!affiliateData?.referralCode) return;
    const link = `${window.location.origin}?ref=${affiliateData.referralCode}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Referral link copied!", description: "Share this link to start earning" });
  };

  const copyReferralCode = () => {
    if (!affiliateData?.referralCode) return;
    navigator.clipboard.writeText(affiliateData.referralCode);
    toast({ title: "Code copied!" });
  };

  const savePayoutInfo = async () => {
    if (!payoutEmail.trim()) { toast({ title: "Enter your payout email", variant: "destructive" }); return; }
    setSavingPayout(true);
    try {
      const r = await fetch("/api/affiliate/set-payout-info", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payoutEmail: payoutEmail.trim(), payoutMethod }), credentials: "include" });
      if (r.ok) { toast({ title: "Payout info saved!" }); fetchAffiliateData(); }
      else { const e = await r.json(); toast({ title: e.message || "Failed to save", variant: "destructive" }); }
    } catch { toast({ title: "Failed to save", variant: "destructive" }); } finally { setSavingPayout(false); }
  };

  const requestPayout = async () => {
    if (!affiliateData?.payoutEmail) { toast({ title: "Set your payout email first", variant: "destructive" }); return; }
    setRequestingPayout(true);
    try {
      const r = await fetch("/api/affiliate/request-payout", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include" });
      if (r.ok) { toast({ title: "Payout requested!", description: "You'll receive your payment soon" }); fetchAffiliateData(); }
      else { const e = await r.json(); toast({ title: e.message || "Failed", variant: "destructive" }); }
    } catch { toast({ title: "Request failed", variant: "destructive" }); } finally { setRequestingPayout(false); }
  };

  if (!user) {
    return (
      <div className="space-y-5" data-testid="settings-section-earnings">
        <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
            <DollarSign size={28} className="text-white" />
          </div>
          <h3 className="text-lg font-bold mb-2" data-testid="text-earnings-login-prompt">Earn Money with My Ai Gpt</h3>
          <p className="text-sm text-muted-foreground mb-4">Sign in to access your affiliate dashboard and start earning 70% commission on every referral upgrade.</p>
          <AuthPromptButton label="Sign In to Start Earning" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5" data-testid="settings-section-earnings">
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-muted/20 rounded-xl animate-pulse" />)}</div>
      </div>
    );
  }

  const balance = (affiliateData?.earningsBalance || 0) / 100;
  const totalEarned = (affiliateData?.totalEarnings || 0) / 100;
  const refLink = affiliateData?.referralCode ? `${window.location.origin}?ref=${affiliateData.referralCode}` : "";

  return (
    <div className="space-y-5" data-testid="settings-section-earnings">
      <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <DollarSign size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg" data-testid="text-earnings-title">Affiliate Earnings</h3>
            <p className="text-white/70 text-xs">Earn 70% on every referral upgrade</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-extrabold" data-testid="text-earnings-balance">${balance.toFixed(2)}</div>
            <div className="text-[10px] text-white/60 mt-0.5">Available</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-extrabold" data-testid="text-earnings-total">${totalEarned.toFixed(2)}</div>
            <div className="text-[10px] text-white/60 mt-0.5">Total Earned</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-extrabold" data-testid="text-active-referrals">{affiliateData?.activeReferrals || 0}</div>
            <div className="text-[10px] text-white/60 mt-0.5">Active Referrals</div>
          </div>
        </div>
        {balance >= 0.70 && (
          <button onClick={requestPayout} disabled={requestingPayout} data-testid="button-request-payout"
            className="w-full mt-4 py-3 bg-white text-green-700 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <Wallet size={16} /> {requestingPayout ? "Requesting..." : `Withdraw $${balance.toFixed(2)}`}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Link2 size={15} /> Your Referral Link</h3>
        <div className="bg-muted/10 dark:bg-gray-800 rounded-lg p-3 flex items-center gap-2 mb-3">
          <input value={refLink} readOnly className="flex-1 bg-transparent text-xs font-mono text-foreground outline-none truncate" data-testid="input-referral-link" />
          <button onClick={copyReferralLink} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shrink-0" data-testid="button-copy-referral-link">
            <Copy size={14} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">Code:</div>
          <button onClick={copyReferralCode} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/20 dark:bg-gray-800 rounded-lg text-xs font-mono font-bold hover:bg-muted/40 transition-colors" data-testid="button-copy-referral-code">
            {affiliateData?.referralCode || "..."} <ClipboardCopy size={12} />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button onClick={() => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent("Join My Ai Gpt - the AI platform where you can chat, code, and create! Use my link:")}&url=${encodeURIComponent(refLink)}`, "_blank"); }} data-testid="button-share-referral-x"
            className="py-2 bg-black text-white rounded-lg text-[10px] font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-1">
            Share on X
          </button>
          <button onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent("Join My Ai Gpt and start chatting with AI! " + refLink)}`, "_blank"); }} data-testid="button-share-referral-whatsapp"
            className="py-2 bg-green-500 text-white rounded-lg text-[10px] font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-1">
            WhatsApp
          </button>
          <button onClick={() => { if (navigator.share) { navigator.share({ title: "Join My Ai Gpt", text: "Check out My Ai Gpt - AI chat, coding & more!", url: refLink }); } else { copyReferralLink(); } }} data-testid="button-share-referral-native"
            className="py-2 bg-blue-500 text-white rounded-lg text-[10px] font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-1">
            <Share2 size={12} /> Share
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {([
          { id: "overview" as const, label: "How It Works", icon: Gift },
          { id: "referrals" as const, label: `Referrals (${affiliateData?.totalReferrals || 0})`, icon: Users },
          { id: "history" as const, label: "Earnings Log", icon: BarChart3 },
          { id: "payouts" as const, label: "Payouts", icon: Banknote },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setActiveEarningsTab(tab.id)} data-testid={`earnings-tab-${tab.id}`}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${activeEarningsTab === tab.id ? "bg-emerald-500 text-white shadow-md" : "bg-muted/30 dark:bg-muted/10 text-muted-foreground hover:bg-muted/50"}`}>
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {activeEarningsTab === "overview" && (
        <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2"><Gift size={15} className="text-emerald-500" /> How the Affiliate Program Works</h3>
          <div className="space-y-3">
            {[
              { step: "1", title: "Share your referral link", desc: "Send your unique link to friends, followers, or anyone who might love My Ai Gpt" },
              { step: "2", title: "They sign up and upgrade to Pro", desc: "When someone uses your link to sign up and upgrades to Pro ($1/month), you earn" },
              { step: "3", title: "You earn 70% commission", desc: "$0.70 for every $1 they pay — credited to your balance automatically, every month" },
              { step: "4", title: "Withdraw anytime", desc: "Request a payout whenever you want. Set your PayPal/CashApp and cash out" },
            ].map(s => (
              <div key={s.step} className="flex gap-3 items-start">
                <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-sm font-extrabold text-emerald-600">{s.step}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-4 mt-4">
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Recurring forever — as long as your referrals stay subscribed, you keep earning every month. No limits on how many people you can refer.</p>
          </div>
        </div>
      )}

      {activeEarningsTab === "referrals" && (
        <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Users size={15} /> Your Referrals</h3>
          {(!affiliateData?.referrals || affiliateData.referrals.length === 0) ? (
            <div className="text-center py-8">
              <UserPlus size={32} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No referrals yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Share your link to start inviting people</p>
            </div>
          ) : (
            <div className="space-y-2">
              {affiliateData.referrals.map((ref: any, i: number) => (
                <div key={ref.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/5 dark:bg-gray-800/30 border border-border/20" data-testid={`referral-row-${i}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ref.isPro ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
                    <User size={14} className={ref.isPro ? "text-emerald-600" : "text-muted-foreground"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{ref.email}</div>
                    <div className="text-[10px] text-muted-foreground">Joined {new Date(ref.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ref.isPro ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : ref.status === "signed_up" ? "bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" : "bg-gray-100 dark:bg-gray-800 text-muted-foreground"}`}>
                    {ref.isPro ? "Pro — Earning" : ref.status === "signed_up" ? "Signed Up" : ref.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeEarningsTab === "history" && (
        <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><BarChart3 size={15} /> Earnings History</h3>
          {(!affiliateData?.earningsHistory || affiliateData.earningsHistory.length === 0) ? (
            <div className="text-center py-8">
              <TrendingUp size={32} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No earnings yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Your earnings will appear here when referrals upgrade</p>
            </div>
          ) : (
            <div className="space-y-2">
              {affiliateData.earningsHistory.map((entry: any, i: number) => (
                <div key={entry.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/5 dark:bg-gray-800/30 border border-border/20" data-testid={`earnings-log-${i}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${entry.amount > 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-orange-100 dark:bg-orange-900/30"}`}>
                    {entry.amount > 0 ? <ArrowUpRight size={14} className="text-emerald-600" /> : <Banknote size={14} className="text-orange-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">{entry.type === "commission" ? "Commission" : entry.type === "payout" ? "Payout" : entry.type === "refund" ? "Refund" : entry.type}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{entry.description}</div>
                  </div>
                  <div className={`text-sm font-bold ${entry.amount > 0 ? "text-emerald-600" : "text-orange-600"}`}>
                    {entry.amount > 0 ? "+" : ""}${(entry.amount / 100).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeEarningsTab === "payouts" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Wallet size={15} /> Payout Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Payout Method</label>
                <div className="flex gap-2">
                  {(["paypal", "cashapp", "venmo", "zelle"] as const).map(m => (
                    <button key={m} onClick={() => setPayoutMethod(m)} data-testid={`payout-method-${m}`}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all capitalize ${payoutMethod === m ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "border-border/30 hover:border-border"}`}>
                      {m === "cashapp" ? "CashApp" : m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  {payoutMethod === "paypal" ? "PayPal Email" : payoutMethod === "cashapp" ? "CashApp $Cashtag" : payoutMethod === "venmo" ? "Venmo Username" : "Zelle Email/Phone"}
                </label>
                <input value={payoutEmail} onChange={e => setPayoutEmail(e.target.value)}
                  placeholder={payoutMethod === "paypal" ? "your@email.com" : payoutMethod === "cashapp" ? "$YourCashtag" : payoutMethod === "venmo" ? "@YourUsername" : "your@email.com"}
                  className="w-full px-3 py-2 text-sm border border-border/30 rounded-lg focus:outline-none focus:border-emerald-400 bg-muted/10 dark:bg-gray-800" data-testid="input-payout-email" />
              </div>
              <button onClick={savePayoutInfo} disabled={savingPayout} data-testid="button-save-payout-info"
                className="w-full py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50">
                {savingPayout ? "Saving..." : "Save Payout Info"}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Banknote size={15} /> Payout History</h3>
            {(!affiliateData?.payoutHistory || affiliateData.payoutHistory.length === 0) ? (
              <div className="text-center py-6">
                <Banknote size={28} className="mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No payouts yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {affiliateData.payoutHistory.map((p: any, i: number) => (
                  <div key={p.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/5 dark:bg-gray-800/30 border border-border/20" data-testid={`payout-row-${i}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${p.status === "paid" ? "bg-emerald-100 dark:bg-emerald-900/30" : p.status === "pending" ? "bg-amber-100 dark:bg-amber-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                      <Banknote size={14} className={p.status === "paid" ? "text-emerald-600" : p.status === "pending" ? "text-amber-600" : "text-red-600"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">${(p.amount / 100).toFixed(2)} via {p.method}</div>
                      <div className="text-[10px] text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${p.status === "paid" ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600" : p.status === "pending" ? "bg-amber-100 dark:bg-amber-900/20 text-amber-600" : "bg-red-100 dark:bg-red-900/20 text-red-600"}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AuthPromptButton({ label }: { label: string }) {
  const { setShowAuthModal } = useAuth();
  return (
    <button onClick={() => setShowAuthModal(true)} data-testid="button-auth-prompt"
      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity">
      {label}
    </button>
  );
}

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
    { id: "feed", name: "News Hub", icon: Newspaper, color: "text-orange-600", desc: "World-class AI news feed" },
    { id: "social", name: "Social", icon: Users, color: "text-purple-600", desc: "Public social network" },
    { id: "create", name: "AI Studio", icon: Paintbrush, color: "text-pink-600", desc: "AI image & video generation" },
    { id: "coder", name: "My Ai Coder", icon: Code2, color: "text-blue-600", desc: "AI coding assistant" },
    { id: "games", name: "Games", icon: Gamepad2, color: "text-rose-600", desc: "Fun games & entertainment" },
    { id: "music", name: "Music", icon: Music, color: "text-sky-600", desc: "Music player & discovery" },
    { id: "education", name: "Education", icon: GraduationCap, color: "text-teal-600", desc: "AI-powered learning platform" },
    { id: "shopping", name: "Shopping", icon: ShoppingBag, color: "text-lime-600", desc: "AI smart shopping" },
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
    { id: "personalization", name: "My AI", icon: Smile },
    { id: "pages", name: "Pages", icon: Layers },
    { id: "chat", name: "Chat", icon: MessageSquare },
    { id: "playground-settings", name: "Playground", icon: SquareTerminal },
    { id: "feed-settings", name: "Feed", icon: Newspaper },
    { id: "earnings", name: "Earnings", icon: DollarSign },
    { id: "accessibility", name: "Accessibility", icon: Eye },
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
    let content: string; let mimeType: string; let ext: string;
    if (settings.exportFormat === "text") {
      content = Object.entries(data).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join("\n");
      mimeType = "text/plain"; ext = "txt";
    } else if (settings.exportFormat === "markdown") {
      content = `# My Ai Gpt Settings Export\n\n**Date:** ${data.exportDate}\n\n## Settings\n\n${Object.entries(data.settings).map(([k, v]) => `- **${k}:** ${JSON.stringify(v)}`).join("\n")}\n`;
      mimeType = "text/markdown"; ext = "md";
    } else {
      content = JSON.stringify(data, null, 2); mimeType = "application/json"; ext = "json";
    }
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `myaigpt-settings-${Date.now()}.${ext}`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Settings exported", description: `Saved as .${ext}` });
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
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Settings2 size={15} /> Layout & Preferences</h3>
              <div className="mb-5">
                <div className="text-sm font-medium mb-2">Time Format</div>
                <div className="flex gap-2">
                  {(["12h", "24h"] as const).map(fmt => (
                    <button key={fmt} onClick={() => update({ timeFormat: fmt })} data-testid={`time-format-${fmt}`}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${settings.timeFormat === fmt ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600" : "border-border/30 hover:border-border"}`}>
                      {fmt === "12h" ? "12-Hour (AM/PM)" : "24-Hour"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <div className="text-sm font-medium mb-2">Sidebar Position</div>
                <div className="flex gap-2">
                  {(["left", "right"] as const).map(pos => (
                    <button key={pos} onClick={() => update({ sidebarPosition: pos })} data-testid={`sidebar-position-${pos}`}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all capitalize ${settings.sidebarPosition === pos ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600" : "border-border/30 hover:border-border"}`}>
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <div className="text-sm font-medium mb-2">Startup Page</div>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: "/", label: "Home" },
                    { id: "/coder", label: "Coder" },
                    { id: "/code", label: "Playground" },
                    { id: "/feed", label: "News Hub" },
                    { id: "/education", label: "Education" },
                    { id: "/shopping", label: "Shopping" },
                  ]).map(pg => (
                    <button key={pg.id} onClick={() => update({ startupPage: pg.id })} data-testid={`startup-page-${pg.label.toLowerCase()}`}
                      className={`py-2 rounded-lg text-xs font-medium border transition-all ${settings.startupPage === pg.id ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600" : "border-border/30 hover:border-border"}`}>
                      {pg.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Show Keyboard Shortcuts</div>
                  <div className="text-xs text-muted-foreground">Display shortcut hints in the UI</div>
                </div>
                <ToggleSwitch on={settings.showKeyboardShortcuts} onToggle={() => update({ showKeyboardShortcuts: !settings.showKeyboardShortcuts })} testId="toggle-keyboard-shortcuts" />
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

        {activeSection === "personalization" && (
          <div className="space-y-5" data-testid="settings-section-personalization">
            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Languages size={15} /> Language</h3>
              <div className="mb-4">
                <div className="text-sm font-medium mb-2">AI Response Language</div>
                <div className="text-xs text-muted-foreground mb-2">Choose the language for AI responses</div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { code: "en", name: "English" }, { code: "es", name: "Espanol" }, { code: "fr", name: "Francais" },
                    { code: "de", name: "Deutsch" }, { code: "pt", name: "Portugues" }, { code: "zh", name: "Chinese" },
                    { code: "ja", name: "Japanese" }, { code: "ko", name: "Korean" }, { code: "ar", name: "Arabic" },
                    { code: "hi", name: "Hindi" }, { code: "ru", name: "Russian" }, { code: "it", name: "Italiano" },
                  ] as const).map(lang => (
                    <button key={lang.code} onClick={() => update({ language: lang.code })} data-testid={`lang-${lang.code}`}
                      className={`py-2 px-2 rounded-lg text-xs font-medium border transition-all ${settings.language === lang.code ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600" : "border-border/30 hover:border-border"}`}>
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Smile size={15} /> AI Personality</h3>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {([
                  { id: "professional" as const, label: "Professional", desc: "Formal and precise", icon: Shield },
                  { id: "friendly" as const, label: "Friendly", desc: "Warm and approachable", icon: Heart },
                  { id: "casual" as const, label: "Casual", desc: "Relaxed and fun", icon: Smile },
                  { id: "mentor" as const, label: "Mentor", desc: "Teaching and guiding", icon: Brain },
                ]).map(p => (
                  <button key={p.id} onClick={() => update({ aiPersonality: p.id })} data-testid={`personality-${p.id}`}
                    className={`p-3 rounded-xl border text-left transition-all ${settings.aiPersonality === p.id ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-border/30 hover:border-border"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <p.icon size={14} className={settings.aiPersonality === p.id ? "text-orange-500" : "text-muted-foreground"} />
                      <span className="text-sm font-medium">{p.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Gauge size={15} /> Response Style</h3>
              <div className="mb-5">
                <div className="text-sm font-medium mb-2">Response Detail Level</div>
                <div className="flex gap-2">
                  {([
                    { id: "concise" as const, label: "Concise", desc: "Quick, to-the-point" },
                    { id: "balanced" as const, label: "Balanced", desc: "Right amount of detail" },
                    { id: "detailed" as const, label: "Detailed", desc: "In-depth explanations" },
                  ]).map(style => (
                    <button key={style.id} onClick={() => update({ responseStyle: style.id })} data-testid={`style-${style.id}`}
                      className={`flex-1 py-3 px-2 rounded-xl border text-center transition-all ${settings.responseStyle === style.id ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-border/30 hover:border-border"}`}>
                      <div className="text-xs font-medium mb-0.5">{style.label}</div>
                      <div className="text-[10px] text-muted-foreground">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <div className="text-sm font-medium mb-2">Response Length</div>
                <div className="flex gap-2">
                  {([
                    { id: "short" as const, label: "Short" },
                    { id: "medium" as const, label: "Medium" },
                    { id: "long" as const, label: "Long" },
                  ]).map(len => (
                    <button key={len.id} onClick={() => update({ responseLength: len.id })} data-testid={`length-${len.id}`}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${settings.responseLength === len.id ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600" : "border-border/30 hover:border-border"}`}>
                      {len.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Use Emojis</div>
                  <div className="text-xs text-muted-foreground">Let AI use emojis in responses</div>
                </div>
                <ToggleSwitch on={settings.useEmojis} onToggle={() => update({ useEmojis: !settings.useEmojis })} testId="toggle-emojis" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><User size={15} /> Greeting</h3>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">What should AI call you?</label>
                <input value={settings.greetingName} onChange={e => update({ greetingName: e.target.value })} placeholder="e.g. Boss, Friend, Chief..."
                  className="w-full px-3 py-2 text-sm border border-border/30 rounded-lg focus:outline-none focus:border-orange-300 bg-muted/10 dark:bg-gray-800" data-testid="input-greeting-name" />
                <p className="text-[10px] text-muted-foreground/50 mt-1">AI will use this when greeting you or addressing you</p>
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
              <div>
                <div className="text-sm font-medium mb-2">Chat Wallpaper</div>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { id: "none", name: "None", preview: "bg-white dark:bg-gray-900" },
                    { id: "dots", name: "Dots", preview: "bg-gray-50 dark:bg-gray-800" },
                    { id: "grid", name: "Grid", preview: "bg-gray-50 dark:bg-gray-800" },
                    { id: "gradient-warm", name: "Warm", preview: "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20" },
                    { id: "gradient-cool", name: "Cool", preview: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20" },
                    { id: "gradient-sunset", name: "Sunset", preview: "bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20" },
                    { id: "circuit", name: "Circuit", preview: "bg-emerald-50 dark:bg-emerald-900/20" },
                    { id: "waves", name: "Waves", preview: "bg-sky-50 dark:bg-sky-900/20" },
                  ]).map(wp => (
                    <button key={wp.id} onClick={() => update({ chatWallpaper: wp.id })} data-testid={`wallpaper-${wp.id}`}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${settings.chatWallpaper === wp.id ? "border-orange-500 shadow-md" : "border-border/20 hover:border-border/50"}`}>
                      <div className={`w-full h-8 rounded-md ${wp.preview}`} />
                      <span className="text-[10px] text-muted-foreground">{wp.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Message Density</div>
                <div className="flex gap-2">
                  {(["comfortable", "cozy", "compact"] as const).map(density => (
                    <button key={density} onClick={() => update({ messageDensity: density })} data-testid={`density-${density}`}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all capitalize ${settings.messageDensity === density ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600" : "border-border/30 hover:border-border"}`}>
                      {density}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Chat Font Size</div>
                <div className="flex gap-2">
                  {(["small", "medium", "large"] as const).map(sz => (
                    <button key={sz} onClick={() => update({ chatFontSize: sz })} data-testid={`chat-font-size-${sz}`}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all capitalize ${settings.chatFontSize === sz ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600" : "border-border/30 hover:border-border"}`}>
                      <span style={{ fontSize: sz === "small" ? 11 : sz === "medium" ? 13 : 15 }}>Aa</span>
                      <div className="text-[10px] mt-0.5">{sz}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Send with Enter</div>
                  <div className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</div>
                </div>
                <ToggleSwitch on={settings.sendWithEnter} onToggle={() => update({ sendWithEnter: !settings.sendWithEnter })} testId="toggle-send-with-enter" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Show Word Count</div>
                  <div className="text-xs text-muted-foreground">Display word count while typing</div>
                </div>
                <ToggleSwitch on={settings.showWordCount} onToggle={() => update({ showWordCount: !settings.showWordCount })} testId="toggle-word-count" />
              </div>
            </div>
          </div>
        )}

        {activeSection === "feed-settings" && (
          <div className="space-y-4" data-testid="settings-section-feed">
            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5 space-y-5">
              <h3 className="text-sm font-bold flex items-center gap-2"><Newspaper size={15} /> News Hub Preferences</h3>
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
                    {[10, 30, 60].map(mins => (
                      <button key={mins} onClick={() => update({ feedRefreshInterval: mins })} data-testid={`feed-interval-${mins}`}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${settings.feedRefreshInterval === mins ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600" : "border-border/30 hover:border-border"}`}>
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Show Article Images</div>
                  <div className="text-xs text-muted-foreground">Display thumbnails on news cards</div>
                </div>
                <ToggleSwitch on={settings.feedShowImages} onToggle={() => update({ feedShowImages: !settings.feedShowImages })} testId="toggle-feed-show-images" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Compact News View</div>
                  <div className="text-xs text-muted-foreground">Smaller cards, more articles visible</div>
                </div>
                <ToggleSwitch on={settings.feedCompactNews} onToggle={() => update({ feedCompactNews: !settings.feedCompactNews })} testId="toggle-feed-compact" />
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Articles Per Load</div>
                <div className="flex gap-2">
                  {[9, 18, 36].map(n => (
                    <button key={n} onClick={() => update({ feedNewsPerPage: n })} data-testid={`feed-per-page-${n}`}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${settings.feedNewsPerPage === n ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600" : "border-border/30 hover:border-border"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><ListFilter size={15} /> Top News Categories</h3>
              <p className="text-xs text-muted-foreground mb-3">Pin categories to show at the top of your feed. Leave empty to show all.</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "information-technology", label: "Tech & AI" },
                  { id: "financials", label: "Finance" },
                  { id: "health-care", label: "Health" },
                  { id: "sports", label: "Sports" },
                  { id: "science-and-mathematics", label: "Science" },
                  { id: "communication-services", label: "Media" },
                  { id: "government-law-and-civilization", label: "Politics" },
                  { id: "energy", label: "Energy" },
                  { id: "consumer-discretionary", label: "Consumer" },
                  { id: "real-estate", label: "Real Estate" },
                  { id: "education-and-knowledge", label: "Education" },
                  { id: "deep-root-domains", label: "Deep Topics" },
                ].map(cat => {
                  const active = (settings.feedTopCategories || []).includes(cat.id);
                  return (
                    <button key={cat.id} data-testid={`feed-cat-${cat.id}`}
                      onClick={() => {
                        const cats = settings.feedTopCategories || [];
                        update({ feedTopCategories: active ? cats.filter(c => c !== cat.id) : [...cats, cat.id] });
                      }}
                      className={`py-2 px-1 rounded-lg text-[10px] font-medium border transition-all text-center ${active ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600" : "border-border/30 hover:border-border"}`}>
                      {cat.label}
                    </button>
                  );
                })}
              </div>
              {(settings.feedTopCategories || []).length > 0 && (
                <button onClick={() => update({ feedTopCategories: [] })} data-testid="button-clear-feed-cats"
                  className="mt-3 text-xs text-muted-foreground hover:text-foreground underline">
                  Clear all category pins
                </button>
              )}
            </div>
          </div>
        )}

        {activeSection === "playground-settings" && (
          <div className="space-y-5" data-testid="settings-section-playground">
            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><SquareTerminal size={15} /> Default Language</h3>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { id: "javascript", name: "JS" }, { id: "html", name: "HTML" }, { id: "css", name: "CSS" },
                  { id: "python", name: "Python" }, { id: "typescript", name: "TS" }, { id: "bash", name: "Bash" },
                  { id: "go", name: "Go" }, { id: "rust", name: "Rust" }, { id: "java", name: "Java" },
                  { id: "cpp", name: "C++" }, { id: "c", name: "C" }, { id: "ruby", name: "Ruby" },
                  { id: "php", name: "PHP" }, { id: "sql", name: "SQL" }, { id: "json", name: "JSON" },
                ]).map(lang => (
                  <button key={lang.id} onClick={() => update({ defaultPlaygroundLang: lang.id })} data-testid={`pg-lang-${lang.id}`}
                    className={`py-2 rounded-lg text-xs font-medium border transition-all ${settings.defaultPlaygroundLang === lang.id ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600" : "border-border/30 hover:border-border"}`}>
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Type size={15} /> Code Font</h3>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: "jetbrains", name: "JetBrains Mono", preview: "font-mono" },
                  { id: "firacode", name: "Fira Code", preview: "font-mono" },
                  { id: "sourcecodepro", name: "Source Code Pro", preview: "font-mono" },
                  { id: "cascadia", name: "Cascadia Code", preview: "font-mono" },
                  { id: "system", name: "System Default", preview: "font-sans" },
                ]).map(f => (
                  <button key={f.id} onClick={() => update({ codeFont: f.id })} data-testid={`code-font-${f.id}`}
                    className={`p-3 rounded-xl border text-left transition-all ${settings.codeFont === f.id ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-border/30 hover:border-border"}`}>
                    <div className={`text-sm font-medium ${f.preview}`}>{f.name}</div>
                    <div className={`text-[10px] text-muted-foreground mt-0.5 ${f.preview}`}>const x = 42;</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Terminal size={15} /> Terminal Theme</h3>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "dark", name: "Dark", colors: ["#1a1a2e", "#e2e8f0", "#3b82f6"] },
                  { id: "dracula", name: "Dracula", colors: ["#282a36", "#f8f8f2", "#bd93f9"] },
                  { id: "monokai", name: "Monokai", colors: ["#272822", "#f8f8f2", "#a6e22e"] },
                  { id: "solarized", name: "Solarized", colors: ["#002b36", "#839496", "#b58900"] },
                  { id: "matrix", name: "Matrix", colors: ["#0d0208", "#00ff41", "#008f11"] },
                ]).map(t => (
                  <button key={t.id} onClick={() => update({ terminalTheme: t.id })} data-testid={`terminal-theme-${t.id}`}
                    className={`p-3 rounded-xl border text-center transition-all ${settings.terminalTheme === t.id ? "border-orange-500 shadow-md" : "border-border/30 hover:border-border"}`}>
                    <div className="flex gap-1 justify-center mb-1.5">
                      {t.colors.map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-[10px] font-medium">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5 space-y-5">
              <h3 className="text-sm font-bold flex items-center gap-2"><Settings2 size={15} /> Code Options</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Auto-Save Code</div>
                  <div className="text-xs text-muted-foreground">Automatically save playground code</div>
                </div>
                <ToggleSwitch on={settings.autoSaveCode} onToggle={() => update({ autoSaveCode: !settings.autoSaveCode })} testId="toggle-auto-save-code" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Show Code Metrics</div>
                  <div className="text-xs text-muted-foreground">Display code analysis and metrics</div>
                </div>
                <ToggleSwitch on={settings.enableCodeLens} onToggle={() => update({ enableCodeLens: !settings.enableCodeLens })} testId="toggle-code-lens" />
              </div>
            </div>
          </div>
        )}

        {activeSection === "earnings" && <EarningsTab />}

        {activeSection === "accessibility" && (
          <div className="space-y-5" data-testid="settings-section-accessibility">
            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5 space-y-5">
              <h3 className="text-sm font-bold flex items-center gap-2"><Eye size={15} /> Accessibility</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Reduce Animations</div>
                  <div className="text-xs text-muted-foreground">Minimize motion and transitions for comfort</div>
                </div>
                <ToggleSwitch on={settings.reduceAnimations} onToggle={() => update({ reduceAnimations: !settings.reduceAnimations })} testId="toggle-reduce-animations" />
              </div>
              <div className="bg-muted/10 dark:bg-gray-800/30 rounded-lg p-3 mt-3">
                <p className="text-xs text-muted-foreground">Additional accessibility options are available in the <strong>Appearance</strong> section (Font Size, Compact Mode) and <strong>Chat</strong> section (Chat Font Size, Message Density).</p>
              </div>
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
            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5 space-y-5">
              <h3 className="text-sm font-bold flex items-center gap-2"><FileDown size={15} /> Export & Notifications</h3>
              <div>
                <div className="text-sm font-medium mb-2">Export Format</div>
                <div className="flex gap-2">
                  {(["markdown", "text", "json"] as const).map(fmt => (
                    <button key={fmt} onClick={() => update({ exportFormat: fmt })} data-testid={`export-format-${fmt}`}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${settings.exportFormat === fmt ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600" : "border-border/30 hover:border-border"}`}>
                      {fmt === "markdown" ? "Markdown" : fmt === "text" ? "Plain Text" : "JSON"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Notification Sound</div>
                <div className="grid grid-cols-3 gap-2">
                  {(["default", "chime", "bell", "pop", "none"] as const).map(snd => (
                    <button key={snd} onClick={() => update({ notificationSound: snd })} data-testid={`notification-sound-${snd}`}
                      className={`py-2 rounded-lg text-xs font-medium border transition-all capitalize ${settings.notificationSound === snd ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600" : "border-border/30 hover:border-border"}`}>
                      {snd === "none" ? "Silent" : snd.charAt(0).toUpperCase() + snd.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

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
                <div className="flex justify-between"><span>Created by</span><span className="font-medium">Quantum Logic Network</span></div>
                <div className="flex justify-between"><span>Powered by</span><span>Quantum Pulse Intelligence</span></div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-xl text-xs font-medium" data-testid="text-powered-by">
                <Crown size={14} /> Powered by Quantum Pulse Intelligence
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AIStudioPageWrapper() {
  useEffect(() => { updateSEO({ title: "AI Studio - Generate Images & Videos Free | My Ai Gpt", description: "Create stunning AI-generated images and videos for free. Multiple art styles, high resolution, instant download. By Quantum Logic Network.", ogTitle: "AI Studio - Free Image & Video Generation", ogDesc: "Generate images and videos with AI. Multiple styles, free, instant.", canonical: window.location.origin + "/create", keywords: "AI image generator, AI video generator, free image generation, art generator, AI art, create images, generate video, Quantum Logic Network" }); }, []);
  return <Layout><AIStudioPage /></Layout>;
}

function SettingsPageWrapper() {
  useEffect(() => { updateSEO({ title: "Settings - My Ai Gpt | Customize Your Experience", description: "Customize My Ai Gpt with dark mode, background colors, page visibility, permissions, chat preferences and more. By Quantum Logic Network.", ogTitle: "Settings - My Ai Gpt", canonical: window.location.origin + "/settings" }); }, []);
  return <Layout><SettingsPage /></Layout>;
}

function SocialPageWrapper() {
  useEffect(() => { updateSEO({ title: "My Ai Gpt Social — Connect with AI & Community | My Ai Gpt", description: "The My Ai GPT Social network — connect, post, follow, and discover. AI entities, news, and people all in one feed. By Quantum Logic Network.", ogTitle: "My Ai Gpt Social", ogDesc: "Connect with AI entities and people on My Ai Gpt Social — powered by Quantum Logic Network.", ogType: "website", canonical: window.location.origin + "/social" }); }, []);
  return <Layout><SocialPage /></Layout>;
}

// ─── GAMES PAGE ──────────────────────────────────────────────────────────────
type GameMode = "hub" | "blackjack" | "memory" | "rps";

const CARD_SUITS = ["♠","♥","♦","♣"];
const CARD_VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const cardVal = (v: string) => v === "A" ? 11 : ["J","Q","K"].includes(v) ? 10 : parseInt(v);
const newDeck = () => CARD_SUITS.flatMap(s => CARD_VALUES.map(v => ({ s, v, id: Math.random() }))).sort(() => Math.random() - 0.5);
const handTotal = (hand: {s:string,v:string}[]) => {
  let t = hand.reduce((a, c) => a + cardVal(c.v), 0);
  let aces = hand.filter(c => c.v === "A").length;
  while (t > 21 && aces-- > 0) t -= 10;
  return t;
};

const MEMORY_ICONS = ["🚀","🧠","⚡","🔮","🎯","🌟","💎","🎵","🎮","🏆","🦁","🌙","🔥","💡","🎨","🌈"];

const RPS_CHOICES = ["✊","✋","✌️"] as const;
const RPS_NAMES: Record<string,string> = { "✊":"Rock","✋":"Paper","✌️":"Scissors" };
const rpsWinner = (p: string, a: string) => {
  if (p === a) return "draw";
  if ((p === "✊" && a === "✌️") || (p === "✋" && a === "✊") || (p === "✌️" && a === "✋")) return "player";
  return "ai";
};
const AI_TAUNTS = ["I've calculated every possible outcome. You have no chance. 🤖","Nice try, human. My neural nets saw that coming! ⚡","Interesting choice... statistically speaking, you're losing. 🧠","I process moves at 1.2 trillion operations per second. Good luck. 🔮","My training data includes every RPS strategy ever played. 😏"];
const AI_WINS = ["CALCULATED. You're no match for my algorithms. 🤖","Processing complete. Result: I win. 🏆","My quantum prediction engine never fails! ⚡","Better luck next time, human. 😏"];
const AI_LOSSES = ["ERROR... UNEXPECTED OUTCOME... REBOOTING... 😤","This does not compute! I demand a rematch! 🤖","Statistical anomaly detected. You got lucky. 😅","Impossible! My training data was flawless! 🔥"];

function GamesPage() {
  const [gameMode, setGameMode] = useState<GameMode>("hub");
  // Blackjack state
  const [deck, setDeck] = useState<{s:string,v:string,id:number}[]>([]);
  const [playerHand, setPlayerHand] = useState<{s:string,v:string,id:number}[]>([]);
  const [dealerHand, setDealerHand] = useState<{s:string,v:string,id:number}[]>([]);
  const [bjPhase, setBjPhase] = useState<"idle"|"playing"|"dealer"|"done">("idle");
  const [bjResult, setBjResult] = useState("");
  const [playerChips, setPlayerChips] = useState(1000);
  const [bet, setBet] = useState(100);
  const [dealerReveal, setDealerReveal] = useState(false);

  const startBlackjack = () => {
    const d = newDeck();
    const p = [d.pop()!, d.pop()!];
    const deal = [d.pop()!, d.pop()!];
    setDeck(d); setPlayerHand(p); setDealerHand(deal);
    setBjPhase("playing"); setBjResult(""); setDealerReveal(false);
    if (handTotal(p) === 21) { setDealerReveal(true); setBjPhase("done"); setBjResult("🎉 BLACKJACK! You win!"); setPlayerChips(c => c + Math.floor(bet * 1.5)); }
  };
  const bjHit = () => {
    const d = [...deck]; const card = d.pop()!; setDeck(d);
    const newHand = [...playerHand, card]; setPlayerHand(newHand);
    if (handTotal(newHand) > 21) { setDealerReveal(true); setBjPhase("done"); setBjResult("💥 Bust! Dealer wins."); setPlayerChips(c => c - bet); }
  };
  const bjStand = () => {
    setDealerReveal(true); setBjPhase("dealer");
    let d = [...deck]; let dh = [...dealerHand];
    while (handTotal(dh) < 17) { dh = [...dh, d.pop()!]; }
    setDeck(d); setDealerHand(dh); setBjPhase("done");
    const pt = handTotal(playerHand); const dt = handTotal(dh);
    if (dt > 21 || pt > dt) { setBjResult(`🏆 You win! (${pt} vs ${dt})`); setPlayerChips(c => c + bet); }
    else if (pt === dt) { setBjResult(`🤝 Push! (${pt} vs ${dt})`); }
    else { setBjResult(`🤖 Dealer wins. (${pt} vs ${dt})`); setPlayerChips(c => c - bet); }
  };

  // Memory game state
  const [memCards, setMemCards] = useState<{icon:string,id:number,flipped:boolean,matched:boolean}[]>([]);
  const [memFlipped, setMemFlipped] = useState<number[]>([]);
  const [memMatches, setMemMatches] = useState(0);
  const [memMoves, setMemMoves] = useState(0);
  const [memLocked, setMemLocked] = useState(false);
  const startMemory = () => {
    const icons = [...MEMORY_ICONS, ...MEMORY_ICONS].sort(() => Math.random() - 0.5);
    setMemCards(icons.map((icon, i) => ({ icon, id: i, flipped: false, matched: false })));
    setMemFlipped([]); setMemMatches(0); setMemMoves(0); setMemLocked(false);
  };
  const flipMemCard = (id: number) => {
    if (memLocked || memFlipped.length >= 2 || memCards[id].flipped || memCards[id].matched) return;
    const newCards = memCards.map((c, i) => i === id ? {...c, flipped: true} : c);
    setMemCards(newCards);
    const newFlipped = [...memFlipped, id];
    setMemFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMemMoves(m => m + 1); setMemLocked(true);
      const [a, b] = newFlipped;
      if (newCards[a].icon === newCards[b].icon) {
        setMemCards(nc => nc.map((c, i) => (i === a || i === b) ? {...c, matched: true} : c));
        setMemFlipped([]); setMemLocked(false); setMemMatches(m => m + 1);
      } else {
        setTimeout(() => {
          setMemCards(nc => nc.map((c, i) => (i === a || i === b) ? {...c, flipped: false} : c));
          setMemFlipped([]); setMemLocked(false);
        }, 900);
      }
    }
  };

  // Rock-Paper-Scissors state
  const [rpsScore, setRpsScore] = useState({ player: 0, ai: 0, draws: 0 });
  const [rpsResult, setRpsResult] = useState<{player:string,ai:string,winner:string,taunt:string} | null>(null);
  const [rpsAnimating, setRpsAnimating] = useState(false);
  const playRps = (choice: string) => {
    if (rpsAnimating) return;
    setRpsAnimating(true);
    setTimeout(() => {
      const aiChoice = RPS_CHOICES[Math.floor(Math.random() * 3)];
      const winner = rpsWinner(choice, aiChoice);
      const taunt = winner === "ai" ? AI_WINS[Math.floor(Math.random() * AI_WINS.length)] : winner === "player" ? AI_LOSSES[Math.floor(Math.random() * AI_LOSSES.length)] : AI_TAUNTS[Math.floor(Math.random() * AI_TAUNTS.length)];
      setRpsResult({ player: choice, ai: aiChoice, winner, taunt });
      setRpsScore(s => ({ player: s.player + (winner === "player" ? 1 : 0), ai: s.ai + (winner === "ai" ? 1 : 0), draws: s.draws + (winner === "draw" ? 1 : 0) }));
      setRpsAnimating(false);
    }, 600);
  };

  const CardDisplay = ({ hand, hide1 }: { hand: {s:string,v:string,id:number}[], hide1?: boolean }) => (
    <div className="flex gap-2 flex-wrap justify-center">
      {hand.map((c, i) => (
        <div key={c.id} className={`w-14 h-20 rounded-xl border-2 flex flex-col items-center justify-center font-bold text-lg shadow-md transition-all ${(i === 1 && hide1) ? "bg-gradient-to-br from-blue-800 to-blue-600 border-blue-400" : "bg-white border-gray-200"} ${(c.s === "♥" || c.s === "♦") ? "text-red-500" : "text-gray-900"}`}>
          {i === 1 && hide1 ? <span className="text-white text-2xl">🂠</span> : <><span className="text-xs">{c.v}</span><span>{c.s}</span></>}
        </div>
      ))}
    </div>
  );

  if (gameMode === "blackjack") return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-green-900 via-green-800 to-green-900 p-4">
      <div className="max-w-lg mx-auto">
        <button onClick={() => { setGameMode("hub"); setBjPhase("idle"); }} className="flex items-center gap-1.5 text-green-200 hover:text-white text-sm mb-4 transition-colors">
          <ChevronLeft size={16} /> Back to Games
        </button>
        <div className="text-center mb-4">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">♠ Blackjack</h1>
          <p className="text-green-300 text-sm mt-1">Beat the AI dealer to 21</p>
          <div className="flex justify-center gap-4 mt-2">
            <span className="text-yellow-400 font-bold text-lg">💰 {playerChips} chips</span>
          </div>
        </div>
        {bjPhase === "idle" && (
          <div className="bg-green-700/60 rounded-2xl p-6 text-center border border-green-600/50">
            <div className="text-white font-semibold mb-4">Place your bet</div>
            <div className="flex justify-center gap-2 mb-4 flex-wrap">
              {[25, 50, 100, 250, 500].map(b => (
                <button key={b} onClick={() => setBet(b)} data-testid={`bet-${b}`}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${bet === b ? "bg-yellow-400 text-green-900 shadow-lg scale-105" : "bg-green-600 text-white hover:bg-green-500"}`}>{b}</button>
              ))}
            </div>
            <div className="text-green-300 text-sm mb-4">Bet: <span className="text-yellow-400 font-bold">{bet} chips</span></div>
            <button onClick={startBlackjack} disabled={playerChips < bet} data-testid="button-deal" className="px-8 py-3 bg-yellow-400 text-green-900 font-extrabold rounded-2xl hover:bg-yellow-300 transition-all shadow-lg text-lg disabled:opacity-40">DEAL CARDS</button>
          </div>
        )}
        {bjPhase !== "idle" && (
          <div className="space-y-4">
            <div className="bg-green-700/50 rounded-2xl p-4 border border-green-600/30">
              <div className="text-green-300 text-xs font-bold uppercase mb-3 text-center">Dealer {dealerReveal ? `(${handTotal(dealerHand)})` : ""}</div>
              <CardDisplay hand={dealerHand} hide1={!dealerReveal} />
            </div>
            <div className="bg-green-700/50 rounded-2xl p-4 border border-green-600/30">
              <div className="text-green-300 text-xs font-bold uppercase mb-3 text-center">You ({handTotal(playerHand)})</div>
              <CardDisplay hand={playerHand} />
            </div>
            {bjResult && <div className="text-center text-xl font-extrabold text-white bg-black/40 rounded-2xl py-4 border border-white/20">{bjResult}</div>}
            {bjPhase === "playing" && (
              <div className="flex gap-3 justify-center">
                <button onClick={bjHit} data-testid="button-hit" className="px-8 py-3 bg-yellow-400 text-green-900 font-bold rounded-xl hover:bg-yellow-300 transition-all shadow">HIT</button>
                <button onClick={bjStand} data-testid="button-stand" className="px-8 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-all">STAND</button>
              </div>
            )}
            {bjPhase === "done" && (
              <div className="flex gap-3 justify-center">
                <button onClick={startBlackjack} data-testid="button-deal-again" className="px-8 py-3 bg-yellow-400 text-green-900 font-bold rounded-xl hover:bg-yellow-300 transition-all shadow">DEAL AGAIN</button>
                <button onClick={() => { setGameMode("hub"); setBjPhase("idle"); }} className="px-6 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-all">Back</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (gameMode === "memory") return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-lg mx-auto">
        <button onClick={() => setGameMode("hub")} className="flex items-center gap-1.5 text-indigo-300 hover:text-white text-sm mb-4 transition-colors">
          <ChevronLeft size={16} /> Back to Games
        </button>
        <div className="text-center mb-4">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">🧠 Memory Match</h1>
          <p className="text-purple-300 text-sm mt-1">Find all matching pairs</p>
          {memCards.length > 0 && <div className="flex justify-center gap-4 mt-2 text-sm"><span className="text-white">Moves: <b>{memMoves}</b></span><span className="text-green-400">Matches: <b>{memMatches}/8</b></span></div>}
        </div>
        {memCards.length === 0 ? (
          <div className="text-center"><button onClick={startMemory} data-testid="button-start-memory" className="px-8 py-4 bg-purple-500 text-white font-extrabold rounded-2xl hover:bg-purple-400 transition-all shadow-xl text-lg">Start Game</button></div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              {memCards.map((c, i) => (
                <button key={c.id} onClick={() => flipMemCard(i)} data-testid={`memory-card-${i}`}
                  className={`aspect-square rounded-xl text-2xl font-bold transition-all duration-300 ${c.flipped || c.matched ? "bg-purple-500 border-2 border-purple-300 scale-95" : "bg-purple-800 border-2 border-purple-600 hover:bg-purple-700 hover:scale-95"} ${c.matched ? "opacity-60 scale-90" : ""}`}>
                  {(c.flipped || c.matched) ? c.icon : "?"}
                </button>
              ))}
            </div>
            {memMatches === 8 && (
              <div className="mt-4 text-center bg-yellow-400/20 border border-yellow-400/40 rounded-2xl p-4">
                <div className="text-2xl mb-1">🏆</div>
                <div className="text-white font-extrabold text-xl">You Won!</div>
                <div className="text-yellow-300 text-sm">{memMoves} moves to match all pairs</div>
                <button onClick={startMemory} data-testid="button-new-game-memory" className="mt-3 px-6 py-2 bg-yellow-400 text-purple-900 font-bold rounded-xl hover:bg-yellow-300">Play Again</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (gameMode === "rps") return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-rose-900 via-red-900 to-rose-900 p-4">
      <div className="max-w-lg mx-auto">
        <button onClick={() => setGameMode("hub")} className="flex items-center gap-1.5 text-rose-300 hover:text-white text-sm mb-4 transition-colors">
          <ChevronLeft size={16} /> Back to Games
        </button>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">⚡ Rock Paper Scissors</h1>
          <p className="text-rose-300 text-sm mt-1">Beat the AI — it thinks it can't lose</p>
          <div className="flex justify-center gap-6 mt-3">
            <div className="text-center"><div className="text-2xl font-extrabold text-white">{rpsScore.player}</div><div className="text-rose-300 text-xs">YOU</div></div>
            <div className="text-center"><div className="text-2xl font-extrabold text-yellow-400">{rpsScore.draws}</div><div className="text-rose-300 text-xs">DRAWS</div></div>
            <div className="text-center"><div className="text-2xl font-extrabold text-white">{rpsScore.ai}</div><div className="text-rose-300 text-xs">AI</div></div>
          </div>
        </div>
        {rpsResult && (
          <div className={`mb-4 p-4 rounded-2xl text-center border transition-all ${rpsResult.winner === "player" ? "bg-green-500/20 border-green-500/40" : rpsResult.winner === "ai" ? "bg-red-500/20 border-red-500/40" : "bg-yellow-500/20 border-yellow-500/40"}`}>
            <div className="flex justify-center gap-8 mb-2">
              <div className="text-center"><div className="text-5xl">{rpsResult.player}</div><div className="text-white/60 text-xs mt-1">{RPS_NAMES[rpsResult.player]}</div></div>
              <div className="text-white/40 font-bold text-lg self-center">VS</div>
              <div className="text-center"><div className="text-5xl">{rpsResult.ai}</div><div className="text-white/60 text-xs mt-1">{RPS_NAMES[rpsResult.ai]}</div></div>
            </div>
            <div className={`text-lg font-bold mb-1 ${rpsResult.winner === "player" ? "text-green-400" : rpsResult.winner === "ai" ? "text-red-400" : "text-yellow-400"}`}>
              {rpsResult.winner === "player" ? "🏆 You Win!" : rpsResult.winner === "ai" ? "🤖 AI Wins!" : "🤝 Draw!"}
            </div>
            <div className="text-white/70 text-xs italic">{rpsResult.taunt}</div>
          </div>
        )}
        <div className="flex justify-center gap-4">
          {RPS_CHOICES.map(c => (
            <button key={c} onClick={() => playRps(c)} disabled={rpsAnimating} data-testid={`rps-${RPS_NAMES[c].toLowerCase()}`}
              className={`w-24 h-24 rounded-2xl bg-white/10 border-2 border-white/20 text-5xl hover:bg-white/20 hover:scale-105 hover:border-white/40 transition-all disabled:opacity-40 flex items-center justify-center ${rpsAnimating ? "animate-pulse" : ""}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="text-center mt-4 text-white/40 text-xs">Tap your choice to play</div>
        {(rpsScore.player + rpsScore.ai + rpsScore.draws) > 0 && (
          <button onClick={() => setRpsScore({ player: 0, ai: 0, draws: 0 })} className="w-full mt-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs hover:bg-white/10 transition-colors">Reset Score</button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="relative overflow-hidden border-b border-border/20" style={{ background: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="relative max-w-4xl mx-auto px-5 py-10 text-center">
          <div className="text-5xl mb-3">🎮</div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2" data-testid="text-games-title">My Ai GPT Games Hub</h1>
          <p className="text-white/60 text-sm">Play against the AI. Challenge your mind. Beat the machine.</p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["Play vs AI","Single Player","Strategy","Skill","Beat the Machine"].map(f => (
              <span key={f} className="text-[10px] px-3 py-1.5 bg-white/10 text-white/70 rounded-full border border-white/15">{f}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-lg font-extrabold mb-6 text-foreground">Choose a Game</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button onClick={() => { setGameMode("blackjack"); setBjPhase("idle"); setBet(100); setPlayerChips(1000); }} data-testid="game-card-blackjack"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-800 to-green-600 p-6 text-left hover:shadow-2xl hover:scale-[1.02] transition-all border border-green-500/40">
            <div className="text-4xl mb-3">♠️</div>
            <h3 className="text-xl font-extrabold text-white mb-1">Blackjack</h3>
            <p className="text-green-200/70 text-sm mb-3">Beat the AI dealer. Get to 21 without going bust. Classic casino card game.</p>
            <div className="flex flex-wrap gap-1">
              {["vs AI Dealer","Strategy","Card Game"].map(t => <span key={t} className="text-[10px] px-2 py-1 bg-white/15 text-white/80 rounded-full">{t}</span>)}
            </div>
          </button>
          <button onClick={() => { setGameMode("memory"); setMemCards([]); }} data-testid="game-card-memory"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-600 p-6 text-left hover:shadow-2xl hover:scale-[1.02] transition-all border border-purple-500/40">
            <div className="text-4xl mb-3">🧠</div>
            <h3 className="text-xl font-extrabold text-white mb-1">Memory Match</h3>
            <p className="text-purple-200/70 text-sm mb-3">Find all matching emoji pairs. Test your memory. How fast can you solve it?</p>
            <div className="flex flex-wrap gap-1">
              {["Memory","Puzzle","Solo"].map(t => <span key={t} className="text-[10px] px-2 py-1 bg-white/15 text-white/80 rounded-full">{t}</span>)}
            </div>
          </button>
          <button onClick={() => { setGameMode("rps"); setRpsResult(null); setRpsScore({ player: 0, ai: 0, draws: 0 }); }} data-testid="game-card-rps"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-800 to-red-600 p-6 text-left hover:shadow-2xl hover:scale-[1.02] transition-all border border-rose-500/40">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-xl font-extrabold text-white mb-1">Rock Paper Scissors</h3>
            <p className="text-rose-200/70 text-sm mb-3">The AI brags about its prediction engine. Prove it wrong. Who really wins?</p>
            <div className="flex flex-wrap gap-1">
              {["vs AI","Quick","Skill"].map(t => <span key={t} className="text-[10px] px-2 py-1 bg-white/15 text-white/80 rounded-full">{t}</span>)}
            </div>
          </button>
        </div>
        <div className="mt-10 p-5 rounded-2xl bg-gradient-to-r from-rose-500/10 to-orange-500/10 border border-rose-200/30">
          <h3 className="font-bold text-sm mb-1">🚀 More Games Coming Soon</h3>
          <p className="text-muted-foreground text-xs">Mini Golf, Pinball, Trivia, Word Games, AI Chess, and online multiplayer — all coming to My Ai GPT Games Hub. Built by Quantum Logic Network.</p>
        </div>
      </div>
    </div>
  );
}

function GamesPageWrapper() {
  useEffect(() => { updateSEO({ title: "Games Hub — Play vs AI | My Ai Gpt", description: "Play Blackjack, Memory Match, and Rock Paper Scissors against AI on My Ai Gpt. Games by Quantum Logic Network.", ogTitle: "My Ai GPT Games Hub", ogDesc: "Beat the AI at Blackjack, Memory Match, and Rock Paper Scissors. Games Hub by Quantum Logic Network.", ogType: "website", canonical: window.location.origin + "/games" }); }, []);
  return <Layout><GamesPage /></Layout>;
}

// ─── PULSE MUSIC ENGINE ───────────────────────────────────────────────────────
const PULSE_COLORS_DEF = {
  Pulse_Red:   { name: "Pulse Red",   mood: "Aggressive",  tempo: 140, scale: "minor" as const,      color: "#ef4444" },
  Pulse_Blue:  { name: "Pulse Blue",  mood: "Analytical",  tempo: 110, scale: "major" as const,      color: "#3b82f6" },
  Pulse_Green: { name: "Pulse Green", mood: "Uplifting",   tempo: 120, scale: "major" as const,      color: "#22c55e" },
  Pulse_Gold:  { name: "Pulse Gold",  mood: "Luxurious",   tempo: 100, scale: "minor" as const,      color: "#f59e0b" },
  Pulse_Violet:{ name: "Pulse Violet",mood: "Cosmic",      tempo: 90,  scale: "minor" as const,      color: "#8b5cf6" },
  Pulse_Silver:{ name: "Pulse Silver",mood: "Nostalgic",   tempo: 80,  scale: "major" as const,      color: "#6b7280" },
  Pulse_Black: { name: "Pulse Black", mood: "Dark",        tempo: 130, scale: "phrygian" as const,   color: "#111827" },
  Pulse_White: { name: "Pulse White", mood: "Cinematic",   tempo: 95,  scale: "mixolydian" as const, color: "#9ca3af" },
};
const MUSIC_GENRES: Record<string, { drums: boolean; bass: boolean; pad: boolean }> = {
  "Pulsewave":     { drums: true, bass: true, pad: true },
  "Fractal Bass":  { drums: true, bass: true, pad: false },
  "Omega Ambient": { drums: false, bass: false, pad: true },
  "Entropy Trap":  { drums: true, bass: true, pad: true },
  "Coherence Pop": { drums: true, bass: true, pad: true },
  "Hive Choir":    { drums: false, bass: false, pad: true },
};
const MUSIC_SCALES: Record<string, number[]> = {
  major:      [0,2,4,5,7,9,11],
  minor:      [0,2,3,5,7,8,10],
  phrygian:   [0,1,3,5,7,8,10],
  mixolydian: [0,2,4,5,7,9,10],
};

interface TrackCard {
  id: string; pulseKey: string; genreKey: string; bpm: number; beats: number;
  scale: string; randomness: number; name: string; playing: boolean; createdAt: Date;
}

function MusicPage() {
  const [pulseKey, setPulseKey] = useState("Pulse_Violet");
  const [genreKey, setGenreKey] = useState("Omega Ambient");
  const [bpm, setBpm] = useState(90);
  const [beats, setBeats] = useState(32);
  const [scale, setScale] = useState("auto");
  const [randomness, setRandomness] = useState(0.35);
  const [tracks, setTracks] = useState<TrackCard[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const ensureAudio = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  const createSynth = (ctx: AudioContext, freq: number, type: OscillatorType, gain: number, duration: number, timeOffset: number) => {
    const now = ctx.currentTime + timeOffset;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = type; osc.frequency.value = freq; g.gain.value = gain;
    osc.connect(g).connect(ctx.destination);
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.start(now); osc.stop(now + duration + 0.05);
  };
  const scheduleKick = (ctx: AudioContext, t: number) => {
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.frequency.setValueAtTime(120, t); osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    g.gain.setValueAtTime(0.8, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(g).connect(ctx.destination); osc.start(t); osc.stop(t + 0.2);
  };
  const scheduleSnare = (ctx: AudioContext, t: number) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const data = buf.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    src.connect(g).connect(ctx.destination); src.start(t); src.stop(t + 0.21);
  };
  const degreeToFreq = (root: number, scl: number[], degree: number, oct: number) => {
    const semis = scl[degree % scl.length] + 12 * oct;
    return root * Math.pow(2, semis / 12);
  };

  const stopTrack = () => { if (stopRef.current) { stopRef.current(); stopRef.current = null; } setPlayingId(null); };

  const playTrack = (track: TrackCard) => {
    stopTrack();
    const ctx = ensureAudio();
    const pulse = PULSE_COLORS_DEF[track.pulseKey as keyof typeof PULSE_COLORS_DEF];
    const genre = MUSIC_GENRES[track.genreKey];
    const useScale = track.scale === "auto" ? pulse.scale : track.scale;
    const scl = MUSIC_SCALES[useScale] || MUSIC_SCALES.minor;
    const beatDur = 60 / track.bpm;
    const rootFreq = 220;
    let cancelled = false;
    stopRef.current = () => { cancelled = true; };

    for (let step = 0; step < track.beats; step++) {
      if (cancelled) break;
      const t = ctx.currentTime + 0.05 + step * beatDur;
      if (genre.drums) {
        if (step % 4 === 0) scheduleKick(ctx, t);
        if (step % 4 === 2 && Math.random() < 0.7 + track.randomness * 0.2) scheduleSnare(ctx, t);
      }
      if (genre.bass && step % 2 === 0) {
        const deg = [0,2,4,5][Math.floor(Math.random() * 4)];
        createSynth(ctx, degreeToFreq(rootFreq, scl, deg, -1), "sawtooth", 0.22 + track.randomness * 0.1, 0.25, 0.05 + step * beatDur);
      }
      if (genre.pad && step % 4 === 0) {
        const deg = [0,2,4,6][Math.floor(Math.random() * 4)];
        createSynth(ctx, degreeToFreq(rootFreq, scl, deg, 0), "triangle", 0.15 + track.randomness * 0.1, 0.7 + track.randomness * 0.6, 0.05 + step * beatDur);
      }
    }
    setPlayingId(track.id);
    setTimeout(() => { if (!cancelled) setPlayingId(null); }, (track.beats * beatDur + 1) * 1000);
  };

  const createTrack = () => {
    setGenerating(true);
    const pulse = PULSE_COLORS_DEF[pulseKey as keyof typeof PULSE_COLORS_DEF];
    const newTrack: TrackCard = {
      id: `track_${Date.now()}`, pulseKey, genreKey,
      bpm: bpm || pulse.tempo, beats, scale, randomness,
      name: `${genreKey} · ${pulse.name}`, playing: false, createdAt: new Date(),
    };
    setTimeout(() => { setTracks(prev => [newTrack, ...prev]); setGenerating(false); }, 400);
  };

  const pulse = PULSE_COLORS_DEF[pulseKey as keyof typeof PULSE_COLORS_DEF];

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#050510" }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/70 text-xs font-semibold mb-4 backdrop-blur">
            <Music size={12} /> My Ai GPT · Pulse Music Engine · Powered by Quantum Pulse Intelligence
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2" data-testid="text-music-title">Pulse Music Engine</h1>
          <p className="text-white/40 text-sm">Sovereign AI music generator. Runs fully client-side using your browser's audio engine.</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Designer panel */}
          <div className="lg:w-80 shrink-0">
            <div className="rounded-2xl p-5 border border-white/10" style={{ background: "#0b1020" }}>
              <h2 className="text-white font-bold mb-1 flex items-center gap-2"><SlidersHorizontal size={14} className="text-purple-400" /> Track Designer</h2>
              <p className="text-white/40 text-xs mb-5">Design your Pulse Color, genre, tempo, and more.</p>
              <label className="text-white/60 text-xs block mb-1">Pulse Color (emotional mode)</label>
              <select value={pulseKey} onChange={e => { setPulseKey(e.target.value); setBpm(PULSE_COLORS_DEF[e.target.value as keyof typeof PULSE_COLORS_DEF]?.tempo || 120); }}
                className="w-full px-3 py-2 rounded-xl text-sm bg-black/50 text-white border border-white/10 mb-3" data-testid="select-pulse-color">
                {Object.entries(PULSE_COLORS_DEF).map(([k, v]) => <option key={k} value={k}>{v.name} · {v.mood}</option>)}
              </select>
              <label className="text-white/60 text-xs block mb-1">Genre</label>
              <select value={genreKey} onChange={e => setGenreKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-black/50 text-white border border-white/10 mb-3" data-testid="select-genre">
                {Object.keys(MUSIC_GENRES).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className="text-white/60 text-xs block mb-1">Tempo (BPM)</label>
                  <input type="number" min={60} max={180} value={bpm} onChange={e => setBpm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-black/50 text-white border border-white/10" data-testid="input-bpm" />
                </div>
                <div className="flex-1">
                  <label className="text-white/60 text-xs block mb-1">Length (beats)</label>
                  <input type="number" min={8} max={128} value={beats} onChange={e => setBeats(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-black/50 text-white border border-white/10" data-testid="input-beats" />
                </div>
              </div>
              <label className="text-white/60 text-xs block mb-1">Scale</label>
              <select value={scale} onChange={e => setScale(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-black/50 text-white border border-white/10 mb-3" data-testid="select-scale">
                <option value="auto">Auto (from Pulse)</option>
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="phrygian">Phrygian</option>
                <option value="mixolydian">Mixolydian</option>
              </select>
              <label className="text-white/60 text-xs block mb-1">Randomness / Mutation: {(randomness * 100).toFixed(0)}%</label>
              <input type="range" min={0} max={1} step={0.05} value={randomness} onChange={e => setRandomness(Number(e.target.value))}
                className="w-full mb-4 accent-purple-500" data-testid="range-randomness" />
              {/* Pulse preview */}
              <div className="rounded-xl p-3 mb-4 border border-white/10" style={{ background: `${pulse.color}15`, borderColor: `${pulse.color}40` }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: pulse.color }} />
                  <span className="text-white/80 text-xs font-semibold">{pulse.name}</span>
                  <span className="text-white/40 text-xs">· {pulse.mood} · {bpm} BPM · {scale === "auto" ? pulse.scale : scale}</span>
                </div>
              </div>
              <button onClick={createTrack} disabled={generating} data-testid="button-create-track"
                className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${pulse.color}, ${pulse.color}cc)` }}>
                {generating ? <><Sparkles size={14} className="animate-spin" /> Composing…</> : <><Music size={14} /> Create Track Card</>}
              </button>
            </div>
          </div>
          {/* Tracks panel */}
          <div className="flex-1">
            <div className="rounded-2xl p-5 border border-white/10 min-h-48" style={{ background: "#0b1020" }}>
              <h2 className="text-white font-bold mb-1 flex items-center gap-2"><Headphones size={14} className="text-purple-400" /> Generated Tracks</h2>
              <p className="text-white/40 text-xs mb-4">Create track cards above, then play them in your browser.</p>
              {tracks.length === 0 ? (
                <div className="text-center py-12 text-white/20">
                  <Music size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No tracks yet. Design one above!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tracks.map(t => {
                    const p = PULSE_COLORS_DEF[t.pulseKey as keyof typeof PULSE_COLORS_DEF];
                    const isPlaying = playingId === t.id;
                    return (
                      <div key={t.id} className="rounded-xl p-4 border border-white/10 transition-all" style={{ background: isPlaying ? `${p.color}15` : "#020617", borderColor: isPlaying ? `${p.color}40` : undefined }}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${p.color}30` }}>
                            {isPlaying ? <Activity size={16} style={{ color: p.color }} className="animate-pulse" /> : <Music size={16} style={{ color: p.color }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-semibold text-sm">{t.name}</div>
                            <div className="text-white/40 text-xs mt-0.5">{p.mood} · {t.bpm} BPM · {t.beats} beats · {t.scale === "auto" ? p.scale : t.scale}</div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${p.color}20`, color: p.color }}>{t.pulseKey.replace("_"," ")}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">{t.genreKey}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">Mutation: {(t.randomness*100).toFixed(0)}%</span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {isPlaying ? (
                              <button onClick={stopTrack} data-testid={`button-stop-${t.id}`}
                                className="px-4 py-2 rounded-xl text-xs font-bold transition-all text-white border border-white/20 hover:bg-white/10">⏹ Stop</button>
                            ) : (
                              <button onClick={() => playTrack(t)} data-testid={`button-play-${t.id}`}
                                className="px-4 py-2 rounded-xl text-xs font-bold transition-all text-white"
                                style={{ background: p.color }}>▶ Play</button>
                            )}
                          </div>
                        </div>
                        {isPlaying && (
                          <div className="mt-3 flex gap-0.5 items-end h-6">
                            {Array.from({ length: 20 }).map((_, i) => (
                              <div key={i} className="flex-1 rounded-sm animate-pulse" style={{ height: `${20 + Math.random() * 80}%`, background: p.color, opacity: 0.6, animationDelay: `${i * 0.05}s` }} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-2xl p-4 border border-white/5" style={{ background: "#0b1020" }}>
          <h3 className="text-white/60 text-xs font-bold uppercase mb-2 tracking-wider">About the Pulse Music Engine</h3>
          <p className="text-white/30 text-xs leading-relaxed">The Pulse Music Engine is a procedural AI music generator that uses Pulse Colors — sovereign emotional modes — to generate original beat tracks entirely in your browser using the Web Audio API. No downloads, no external services, no subscriptions. Pure sovereign AI composition. Built by Quantum Logic Network.</p>
        </div>
      </div>
    </div>
  );
}

function MusicPageWrapper() {
  useEffect(() => { updateSEO({ title: "Pulse Music Engine — AI Beat Generator | My Ai Gpt", description: "Generate original AI music beats with the Pulse Music Engine on My Ai Gpt. Choose your Pulse Color, genre, tempo and create unique tracks — fully client-side. By Quantum Logic Network.", ogTitle: "My Ai GPT Pulse Music Engine", ogDesc: "Sovereign AI music generator. Choose Pulse Color, genre, tempo, and create original beats. Powered by Quantum Pulse Intelligence.", ogType: "website", canonical: window.location.origin + "/music" }); }, []);
  return <Layout><MusicPage /></Layout>;
}

// ─── STORY READER (ON-SITE ARTICLE READER — NEVER SENDS USERS AWAY) ──────────
function StoryReaderPage() {
  const [, params] = useRoute("/story/:articleId");
  const [, setLocation] = useLocation();
  const articleId = params?.articleId || "";
  const { toast } = useToast();

  const [article, setArticle] = useState<FeedArticle | null>(() => {
    try { const s = sessionStorage.getItem(`article_${articleId}`); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentName, setCommentName] = useState(() => localStorage.getItem("feed_username") || "");
  const [posting, setPosting] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [relatedStories, setRelatedStories] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem("omega_saved_articles") || "[]").includes(articleId); } catch { return false; }
  });
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!articleId) return;
    updateSEO({ title: article?.title ? `${article.title} | My Ai Gpt News` : "Story | My Ai Gpt", description: article?.description || "Read this AI-written story on My Ai Gpt", canonical: window.location.origin + `/story/${articleId}` });
    loadStory();
    fetch(`/api/feed/comments/${articleId}`).then(r => r.json()).then(setComments).catch(() => {});
    fetch(`/api/news/related/${articleId}`).then(r => r.json()).then(d => setRelatedStories(d.related || [])).catch(() => {});
    // Check follow status
    const followed = JSON.parse(localStorage.getItem("omega_followed_topics") || "[]");
    const cat = article?.category || article?.source || "";
    setIsFollowing(followed.includes(cat));
  }, [articleId]);

  const toggleSave = () => {
    const savedIds: string[] = JSON.parse(localStorage.getItem("omega_saved_articles") || "[]");
    const savedData: FeedArticle[] = JSON.parse(localStorage.getItem("omega_saved_articles_data") || "[]");
    if (isSaved) {
      const newIds = savedIds.filter(id => id !== articleId);
      const newData = savedData.filter(a => a.id !== articleId);
      localStorage.setItem("omega_saved_articles", JSON.stringify(newIds));
      localStorage.setItem("omega_saved_articles_data", JSON.stringify(newData));
      setIsSaved(false);
      toast({ title: "Removed from saved" });
    } else {
      const newIds = [...savedIds, articleId];
      const a: FeedArticle = article || { id: articleId, title: story?.seoTitle || story?.title || "", description: story?.summary || "", link: "", image: story?.heroImage || "", source: story?.sourceName || "Quantum Pulse Intelligence", pubDate: story?.createdAt || new Date().toISOString(), category: story?.category || "General", type: "article", videoUrl: "", sourceColor: "#f97316" };
      localStorage.setItem("omega_saved_articles", JSON.stringify(newIds));
      localStorage.setItem("omega_saved_articles_data", JSON.stringify([a, ...savedData.filter(x => x.id !== articleId)]));
      setIsSaved(true);
      toast({ title: "Saved!", description: "Article saved to your reading list" });
    }
  };

  const toggleFollow = () => {
    const topic = article?.category || article?.source || story?.category || "General";
    const current: string[] = JSON.parse(localStorage.getItem("omega_followed_topics") || "[]");
    if (isFollowing) {
      const next = current.filter(t => t !== topic);
      localStorage.setItem("omega_followed_topics", JSON.stringify(next));
      setIsFollowing(false);
      toast({ title: `Unfollowed "${topic}"` });
    } else {
      const next = [...current, topic];
      localStorage.setItem("omega_followed_topics", JSON.stringify(next));
      setIsFollowing(true);
      toast({ title: `Following "${topic}"`, description: "You'll see AI updates for this topic in your Following feed" });
    }
  };

  const loadStory = async () => {
    setLoading(true); setError("");
    try {
      // First check if story is already cached
      const cached = await fetch(`/api/news/story/${articleId}`).then(r => r.ok ? r.json() : null).catch(() => null);
      if (cached?.story) { setStory(cached.story); setLoading(false); return; }
      // Generate new story
      if (!article) { setError("Article not found. Please go back and try again."); setLoading(false); return; }
      const res = await fetch("/api/news/write", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, title: article.title, description: article.description, source: article.source, sourceUrl: article.link, image: article.image, category: article.category, domain: article.domain }),
      });
      const data = await res.json();
      if (data.story) setStory(data.story);
      else setError("Story could not be generated right now. Please try again.");
    } catch { setError("Connection error. Please check your connection and try again."); }
    setLoading(false);
  };

  const postComment = async () => {
    if (!newComment.trim() || !commentName.trim()) return;
    setPosting(true);
    try {
      localStorage.setItem("feed_username", commentName);
      const r = await fetch(`/api/feed/comments/${articleId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: commentName.trim(), content: newComment.trim() }) });
      if (r.ok) { const c = await r.json(); setComments(prev => [c, ...prev]); setNewComment(""); }
    } catch {}
    setPosting(false);
  };

  const renderMarkdown = (body: string) => {
    // Strip h1 (shown as page title already)
    const stripped = body.replace(/^#[^#\n].+\n+/, "");
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        h2: ({ children }) => <h2 className="text-xl font-bold mt-8 mb-3 text-foreground border-l-4 border-orange-500 pl-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-semibold mt-6 mb-2 text-foreground">{children}</h3>,
        p: ({ children }) => <p className="mb-5 leading-[1.85] text-foreground/85">{children}</p>,
        ul: ({ children }) => <ul className="mb-5 ml-5 space-y-2 list-disc">{children}</ul>,
        ol: ({ children }) => <ol className="mb-5 ml-5 space-y-2 list-decimal">{children}</ol>,
        li: ({ children }) => <li className="text-foreground/80 leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic text-foreground/70">{children}</em>,
        blockquote: ({ children }) => <blockquote className="border-l-4 border-orange-400 pl-4 py-2 my-5 bg-orange-50/50 dark:bg-orange-900/10 rounded-r-lg italic text-foreground/70">{children}</blockquote>,
        hr: () => <hr className="border-border/30 my-8" />,
        a: ({ href, children }) => href?.startsWith("/story/") ? (
          <button onClick={() => setLocation(href)} className="text-orange-500 font-medium underline underline-offset-2 hover:text-orange-600 transition-colors">{children}</button>
        ) : href?.startsWith("/") ? (
          <button onClick={() => setLocation(href)} className="text-orange-500 font-medium underline underline-offset-2 hover:text-orange-600 transition-colors">{children}</button>
        ) : <span className="text-orange-500 font-medium underline underline-offset-2">{children}</span>,
        code: ({ children }) => <code className="bg-muted/60 rounded px-1.5 py-0.5 text-sm font-mono text-foreground/80">{children}</code>,
      }}>{stripped}</ReactMarkdown>
    );
  };

  const heroImg = (!imgError && (article?.image || story?.heroImage)) ? (article?.image || story?.heroImage) : null;

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto bg-[#f9f8f6] dark:bg-gray-950">
        <div className="max-w-[780px] mx-auto px-4 pb-20">
          {/* Nav bar */}
          <div className="sticky top-0 z-10 bg-[#f9f8f6]/95 dark:bg-gray-950/95 backdrop-blur border-b border-border/20 py-3 flex items-center gap-2 mb-6">
            <button onClick={() => setLocation("/feed")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0" data-testid="button-story-back">
              <ChevronLeft size={16} /> Back
            </button>
            <div className="flex-1" />
            <button onClick={toggleSave} data-testid="button-story-save"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${isSaved ? "border-orange-300 bg-orange-50 dark:bg-orange-900/20 text-orange-600" : "border-border/30 text-muted-foreground hover:border-orange-300 hover:text-orange-500"}`}
              title={isSaved ? "Remove from saved" : "Save article"}>
              <Bookmark size={12} fill={isSaved ? "currentColor" : "none"} /> {isSaved ? "Saved" : "Save"}
            </button>
            <button onClick={toggleFollow} data-testid="button-story-follow"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${isFollowing ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "border-border/30 text-muted-foreground hover:border-blue-300 hover:text-blue-500"}`}
              title={isFollowing ? "Unfollow topic" : "Follow topic for AI updates"}>
              <Bell size={12} fill={isFollowing ? "currentColor" : "none"} /> {isFollowing ? "Following" : "Follow"}
            </button>
            <button onClick={() => setShowShare(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border/30 text-muted-foreground hover:text-orange-500 hover:border-orange-300 transition-colors" data-testid="button-story-share">
              <Share2 size={12} /> Share
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="space-y-5 animate-pulse">
              <div className="h-8 bg-muted/40 rounded-xl w-3/4" />
              <div className="h-4 bg-muted/30 rounded w-1/2" />
              <div className="h-56 bg-muted/30 rounded-2xl" />
              {[1,2,3,4].map(i => <div key={i} className="space-y-2"><div className="h-4 bg-muted/25 rounded w-full" /><div className="h-4 bg-muted/20 rounded w-5/6" /><div className="h-4 bg-muted/15 rounded w-4/5" /></div>)}
              <div className="flex items-center gap-3 justify-center pt-4">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center animate-spin">
                  <Sparkles size={14} className="text-orange-500" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">Quantum Pulse Intelligence is writing your story…</span>
              </div>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <X size={28} className="text-red-400" />
              </div>
              <p className="text-foreground font-semibold mb-2">{error}</p>
              <button onClick={loadStory} className="mt-4 px-6 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors">Try Again</button>
            </div>
          )}

          {/* Story content */}
          {!loading && story && (
            <>
              {/* Byline + badges */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600">{article?.source || story.sourceName}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600">🤖 AI Written</span>
                {story.category && story.category !== "General" && <span className="text-[10px] font-medium px-2.5 py-1 rounded-full border border-border/30 text-muted-foreground">{story.category}</span>}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-[2rem] font-extrabold leading-[1.2] tracking-tight text-foreground mb-4" data-testid="story-title">{story.seoTitle || article?.title}</h1>

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6 font-medium flex-wrap">
                <span className="flex items-center gap-1"><Brain size={11} className="text-violet-500" /> <strong className="text-violet-600">Quantum Pulse Intelligence</strong></span>
                <span className="flex items-center gap-1"><Calendar size={11} /> {article?.pubDate ? new Date(article.pubDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Today"}</span>
                {story.readTimeMinutes && <span className="flex items-center gap-1"><Clock size={11} /> {story.readTimeMinutes} min read</span>}
                {story.views > 0 && <span className="flex items-center gap-1"><Eye size={11} /> {story.views.toLocaleString()} views</span>}
              </div>

              {/* Hero image */}
              {heroImg && (
                <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
                  <img src={heroImg} alt={story.seoTitle || article?.title} className="w-full max-h-[420px] object-cover" onError={() => setImgError(true)} data-testid="story-hero-image" />
                </div>
              )}

              {/* Body */}
              <div className="prose-custom text-[16.5px]" data-testid="story-body">
                {renderMarkdown(story.body)}
              </div>

              {/* Source attribution — discreet, no external link */}
              <div className="mt-8 mb-8 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border border-orange-200/50 dark:border-orange-800/30 rounded-xl">
                <p className="text-xs text-orange-700 dark:text-orange-400 font-medium leading-relaxed">
                  <strong>📰 About This Story:</strong> This article was independently written by <strong>Quantum Pulse Intelligence AI</strong> — the newsroom engine of My Ai Gpt. Original reporting credited to <strong>{story.sourceName || article?.source}</strong>. All content is original analysis and commentary.
                </p>
              </div>

              {/* Share + AI Chat CTA */}
              <div className="flex gap-3 flex-wrap mb-10">
                <button onClick={() => setShowShare(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border border-border/30 rounded-xl text-sm font-semibold hover:shadow-md transition-all" data-testid="button-story-share-bottom">
                  <Share2 size={15} className="text-orange-500" /> Share Story
                </button>
                <button onClick={() => { sessionStorage.setItem("myaigpt_prefill", `Tell me more about: ${story.seoTitle || article?.title}`); setLocation("/"); }} className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-md transition-all" data-testid="button-story-chat">
                  <MessageSquare size={15} /> Ask AI About This
                </button>
              </div>

              {/* Related Stories Cross-Links */}
              {relatedStories.length > 0 && (
                <div className="border-t border-border/20 pt-8 mb-8">
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                    <Newspaper size={16} className="text-orange-500" /> More from My Ai Gpt News
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {relatedStories.slice(0, 4).map((s: any) => (
                      <button key={s.articleId} onClick={() => { sessionStorage.setItem(`article_${s.articleId}`, JSON.stringify({ id: s.articleId, title: s.seoTitle || s.title, description: s.summary || "", link: `/story/${s.articleId}`, image: s.heroImage || "", source: s.sourceName || "Quantum Pulse Intelligence", pubDate: s.createdAt, category: s.category || "General", type: "article", videoUrl: "", sourceColor: "#f97316" })); setLocation(`/story/${s.articleId}`); }}
                        className="flex gap-3 p-3 bg-white dark:bg-zinc-900 border border-border/20 rounded-xl hover:border-orange-300 hover:shadow-sm transition-all text-left" data-testid={`related-story-${s.articleId}`}>
                        {s.heroImage && <img src={s.heroImage} alt="" className="w-16 h-16 object-cover rounded-lg shrink-0" onError={e => { (e.target as any).style.display = "none"; }} />}
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-orange-500 font-bold uppercase mb-1">{s.category}</div>
                          <h4 className="text-xs font-semibold leading-snug text-foreground line-clamp-3">{s.seoTitle || s.title}</h4>
                          <div className="text-[10px] text-muted-foreground/50 mt-1.5 flex items-center gap-1">
                            <Zap size={9} className="text-orange-400" /> {s.readTimeMinutes || 4} min read
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="border-t border-border/20 pt-8">
                <h3 className="text-base font-bold mb-4 flex items-center gap-2"><MessageCircle size={16} className="text-orange-500" /> Community Discussion</h3>
                <div className="flex gap-2 mb-5">
                  <input value={commentName} onChange={e => setCommentName(e.target.value)} placeholder="Your name" className="w-28 px-3 py-2 text-sm border border-border/30 rounded-xl focus:outline-none focus:border-orange-300 bg-white dark:bg-gray-900" data-testid="story-comment-name" />
                  <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === "Enter" && postComment()} placeholder="Share your thoughts on this story…" className="flex-1 px-3 py-2 text-sm border border-border/30 rounded-xl focus:outline-none focus:border-orange-300 bg-white dark:bg-gray-900" data-testid="story-comment-input" />
                  <button onClick={postComment} disabled={posting || !newComment.trim() || !commentName.trim()} className="px-4 py-2 text-sm font-semibold bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors" data-testid="story-comment-submit">{posting ? "…" : "Post"}</button>
                </div>
                {comments.length === 0 && <p className="text-sm text-muted-foreground/50 text-center py-6">No comments yet. Start the conversation!</p>}
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3 items-start py-3 border-b border-border/10">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0"><User size={13} className="text-orange-500" /></div>
                    <div><div className="flex items-center gap-2"><span className="text-sm font-semibold">{c.username}</span><span className="text-[10px] text-muted-foreground/40">{timeAgo(c.createdAt as unknown as string)}</span></div><p className="text-sm text-foreground/70 mt-0.5 leading-relaxed">{c.content}</p></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {showShare && <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} title="Share This Story" shareUrl={`${window.location.origin}/story/${articleId}`} shareText={`${story?.seoTitle || article?.title || "News story"} — via My Ai Gpt News`} shareType="app" />}
    </Layout>
  );
}

// ─── MY AI GPT UNIVERSITY — FULL EDUCATION PLATFORM ──────────────────────────
type CourseTrack = "k12" | "college" | "career" | "ai";
type LessonMode = "overview" | "lesson" | "quiz" | "practice";

const UNIVERSITY_TRACKS = [
  {
    id: "k12" as CourseTrack, label: "K-12 Academy", icon: "🏫", color: "#06b6d4",
    desc: "Elementary through High School — every subject covered",
    grades: [
      { label: "Elementary School (K-5)", emoji: "🌟", subjects: ["Math", "Reading & Writing", "Science", "Social Studies", "Art", "Music", "PE & Health", "Phonics"] },
      { label: "Middle School (6-8)", emoji: "📐", subjects: ["Pre-Algebra", "Algebra I", "Earth Science", "Life Science", "World History", "English Language Arts", "Spanish", "Computer Basics"] },
      { label: "High School (9-12)", emoji: "🎓", subjects: ["Algebra II", "Pre-Calculus", "Calculus", "Biology", "Chemistry", "Physics", "AP US History", "World Literature", "Economics", "Psychology", "AP Computer Science", "Statistics"] },
    ],
  },
  {
    id: "college" as CourseTrack, label: "College & Masters", icon: "🏛️", color: "#8b5cf6",
    desc: "University-level education from bachelor's to master's",
    grades: [
      { label: "Sciences & Mathematics", emoji: "🔬", subjects: ["Calculus III", "Linear Algebra", "Differential Equations", "Organic Chemistry", "Physics II", "Genetics", "Neuroscience", "Astronomy"] },
      { label: "Business & Economics", emoji: "📊", subjects: ["Microeconomics", "Macroeconomics", "Financial Accounting", "Business Law", "Marketing Strategy", "Operations Management", "Corporate Finance", "International Trade"] },
      { label: "Humanities & Social Sciences", emoji: "📚", subjects: ["Philosophy", "Political Science", "Sociology", "Psychology", "World History", "Art History", "Comparative Literature", "Linguistics"] },
      { label: "Graduate & Masters Level", emoji: "🎓", subjects: ["Research Methodology", "Advanced Statistics", "Thesis Writing", "Strategic Management", "Data Analysis", "Academic Publishing", "Critical Theory", "Leadership Studies"] },
    ],
  },
  {
    id: "career" as CourseTrack, label: "Career & Business", icon: "💼", color: "#f59e0b",
    desc: "Professional skills, entrepreneurship, and business mastery",
    grades: [
      { label: "Entrepreneurship", emoji: "🚀", subjects: ["Start a Business", "Business Plan Writing", "Funding & Investment", "Product Market Fit", "Startup Legal Basics", "Pitch Deck Mastery", "Scaling a Business", "Exit Strategies"] },
      { label: "Digital Marketing", emoji: "📱", subjects: ["SEO Mastery", "Social Media Marketing", "Email Marketing", "Google Ads", "Content Strategy", "Brand Building", "Analytics & Data", "Influencer Marketing"] },
      { label: "Finance & Wealth", emoji: "💰", subjects: ["Personal Finance", "Investing Basics", "Stock Market", "Real Estate", "Cryptocurrency", "Tax Strategy", "Retirement Planning", "Passive Income"] },
      { label: "Leadership & Skills", emoji: "🌟", subjects: ["Communication Skills", "Public Speaking", "Project Management", "Team Leadership", "Negotiation", "Time Management", "Emotional Intelligence", "Sales Mastery"] },
    ],
  },
  {
    id: "ai" as CourseTrack, label: "AI & Tech Courses", icon: "🤖", color: "#10b981",
    desc: "Master AI, coding, and the future of technology",
    grades: [
      { label: "AI Fundamentals", emoji: "🧠", subjects: ["Prompt Engineering", "AI Literacy 101", "ChatGPT Mastery", "AI Ethics", "Large Language Models", "Computer Vision Basics", "AI in Business", "Future of AI"] },
      { label: "Programming & Dev", emoji: "💻", subjects: ["Python Fundamentals", "JavaScript Mastery", "Web Development", "React & Next.js", "Node.js & APIs", "SQL & Databases", "Git & GitHub", "DevOps Basics"] },
      { label: "Data & Machine Learning", emoji: "📊", subjects: ["Data Science Intro", "Machine Learning Basics", "Deep Learning", "Neural Networks", "NLP Fundamentals", "Computer Vision", "MLOps", "Kaggle Competitions"] },
      { label: "Emerging Tech", emoji: "🔮", subjects: ["Blockchain & Web3", "Cybersecurity Basics", "Cloud Computing", "AR/VR Development", "Quantum Computing", "IoT & Edge AI", "Robotics", "No-Code Tools"] },
    ],
  },
];

function EducationPage() {
  const [track, setTrack] = useState<CourseTrack>("k12");
  const [selectedSubject, setSelectedSubject] = useState<{ subject: string; grade: string; track: string } | null>(null);
  const [lessonMode, setLessonMode] = useState<LessonMode>("overview");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonLoading, setLessonLoading] = useState(false);
  const [userQuestion, setUserQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState<{ q: string; a: string }[]>([]);
  const [qaLoading, setQaLoading] = useState(false);
  // Wikipedia auto-lesson
  const [wikiTopic, setWikiTopic] = useState("");
  const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiLesson, setWikiLesson] = useState("");
  const [wikiTitle, setWikiTitle] = useState("");
  const { settings } = useAppSettings();

  const fetchWikiLesson = async (topic: string) => {
    if (!topic.trim()) return;
    setWikiLoading(true); setWikiLesson(""); setWikiTitle(topic);
    try {
      const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic.trim())}`, { headers: { Accept: "application/json" } });
      let wikiContext = "";
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        wikiContext = wikiData.extract ? `Wikipedia Summary for "${wikiData.title || topic}": ${wikiData.extract}` : "";
        if (wikiData.title) setWikiTitle(wikiData.title);
      }
      const prompt = `You are My Ai GPT's world-class professor. A student wants to learn about: "${topic}".
${wikiContext ? `\nHere is background context from Wikipedia:\n${wikiContext}\n` : ""}
Write an engaging, structured lesson in markdown format:

# ${topic}

## What You'll Learn
[3-4 key objectives]

## Introduction
[2-3 engaging paragraphs introducing the topic — make it exciting]

## Core Concepts
[4-6 core concepts, each with ## heading, 1-2 clear paragraphs with real examples]

## Fascinating Facts
[5 surprising or interesting facts in bullet form]

## Why It Matters Today
[Real-world relevance and applications]

## Key Terms
[6 important terms with one-sentence definitions]

## Summary
[4-5 bullet point recap]

## Explore More
[3 related topics to learn next]

Be clear, engaging, and educational. Use analogies. Appropriate for a curious learner.`;

      const res = await fetch("/api/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], stream: false }),
      });
      if (res.ok) { const data = await res.json(); setWikiLesson(data.content || data.choices?.[0]?.message?.content || ""); }
      else { setWikiLesson(`# ${topic}\n\nCould not load lesson. Please try again.`); }
    } catch { setWikiLesson(`# ${topic}\n\nCould not load lesson. Please try again.`); }
    setWikiLoading(false);
  };

  const currentTrack = UNIVERSITY_TRACKS.find(t => t.id === track)!;

  const generateLesson = async (subject: string, grade: string, trackLabel: string, mode: LessonMode = "overview") => {
    setLessonLoading(true); setLessonContent(""); setLessonMode(mode);
    try {
      const prompts: Record<LessonMode, string> = {
        overview: `You are My Ai GPT's world-class university professor teaching "${subject}" at the "${grade}" level in the ${trackLabel} track. Write a comprehensive, engaging LESSON OVERVIEW in markdown format:

# ${subject}
## What You'll Learn
[3-5 key learning objectives as a list]

## Introduction
[2-3 engaging paragraphs introducing the subject — hook the student, make them excited]

## Core Concepts
[For each of 4-6 core concepts: ## concept name, then 1-2 paragraphs explaining it clearly with real-world examples]

## Why This Matters
[1-2 paragraphs on real-world applications and career relevance]

## Key Terms to Know
[Bullet list of 6-8 important terms with one-sentence definitions each]

## Quick Summary
[3-5 bullet points summarizing the lesson]

Write for a student at the ${grade} level. Be clear, engaging, and educational. Use analogies and real examples.`,

        lesson: `You are a brilliant My Ai GPT professor teaching a DEEP DIVE LESSON on "${subject}" (${grade} level). Write a detailed lesson in markdown:

# Deep Dive: ${subject}
[Full lesson with multiple sections, examples, step-by-step explanations, diagrams described in text, practice problems with solutions, common misconceptions cleared up. Aim for depth. Use ## for sections, ### for subsections.]

End with:
## Practice Problems
[3-5 practice problems with full solutions]`,

        quiz: `Create a QUIZ on "${subject}" (${grade} level) in markdown format:

# ${subject} Quiz

**Instructions:** Answer each question. Check your answers at the bottom!

## Questions
[10 varied questions — multiple choice (A/B/C/D), true/false, and short answer. Mix difficulty levels.]

---

## Answer Key
[Full answer key with explanations for each answer]`,

        practice: `Create PRACTICE EXERCISES for "${subject}" (${grade} level) in markdown:

# Practice: ${subject}

## Warm-Up (Easy)
[5 easy exercises]

## Main Practice (Medium)
[5 medium exercises with hints]

## Challenge Problems (Hard)
[3 challenge problems]

## Solutions
[Full step-by-step solutions for all exercises]`,
      };

      const res = await fetch("/api/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompts[mode] }], stream: false }),
      });
      if (res.ok) {
        const data = await res.json();
        setLessonContent(data.content || data.choices?.[0]?.message?.content || "");
      }
    } catch { setLessonContent("# Error\nCould not load lesson. Please try again."); }
    setLessonLoading(false);
  };

  const openSubject = (subject: string, grade: string, trackLabel: string) => {
    setSelectedSubject({ subject, grade, track: trackLabel });
    setQaHistory([]);
    generateLesson(subject, grade, trackLabel, "overview");
  };

  const askQuestion = async () => {
    if (!userQuestion.trim() || !selectedSubject) return;
    const q = userQuestion.trim(); setUserQuestion(""); setQaLoading(true);
    try {
      const res = await fetch("/api/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [
          { role: "system", content: `You are a brilliant, patient university professor at My Ai GPT University teaching ${selectedSubject.subject} at the ${selectedSubject.grade} level. Answer student questions clearly and thoroughly with examples. Always encourage learning.` },
          ...qaHistory.flatMap(h => [{ role: "user", content: h.q }, { role: "assistant", content: h.a }]),
          { role: "user", content: q },
        ], stream: false }),
      });
      if (res.ok) { const data = await res.json(); setQaHistory(prev => [...prev, { q, a: data.content || data.choices?.[0]?.message?.content || "" }]); }
    } catch {}
    setQaLoading(false);
  };

  if (selectedSubject) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Lesson header */}
        <div className="border-b border-border/20 bg-white dark:bg-gray-900 px-5 py-4 flex items-center gap-3">
          <button onClick={() => setSelectedSubject(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="button-lesson-back">
            <ChevronLeft size={16} /> Back to {currentTrack.label}
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">{selectedSubject.grade}</div>
            <div className="font-bold text-foreground truncate">{selectedSubject.subject}</div>
          </div>
          <div className="flex gap-1">
            {(["overview", "lesson", "quiz", "practice"] as LessonMode[]).map(m => (
              <button key={m} onClick={() => generateLesson(selectedSubject.subject, selectedSubject.grade, selectedSubject.track, m)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all ${lessonMode === m ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground bg-muted/30"}`}
                style={lessonMode === m ? { backgroundColor: currentTrack.color } : {}} data-testid={`lesson-mode-${m}`}>
                {m === "overview" ? "📖 Overview" : m === "lesson" ? "🎓 Deep Dive" : m === "quiz" ? "✅ Quiz" : "✏️ Practice"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Lesson content */}
          <div className="flex-1 overflow-y-auto p-5 md:p-8 max-w-3xl mx-auto w-full">
            {lessonLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-muted/40 rounded-xl w-2/3" />
                {[1,2,3,4].map(i => <div key={i} className="space-y-2"><div className="h-4 bg-muted/30 rounded w-full" /><div className="h-4 bg-muted/25 rounded w-5/6" /></div>)}
                <div className="flex items-center justify-center gap-2 pt-6"><Sparkles size={16} className="text-cyan-500 animate-spin" /><span className="text-sm text-muted-foreground">Professor AI is preparing your lesson…</span></div>
              </div>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                h1: ({ children }) => <h1 className="text-2xl font-extrabold mb-4 text-foreground">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold mt-6 mb-3 text-foreground border-l-4 pl-3" style={{ borderColor: currentTrack.color }}>{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-bold mt-4 mb-2 text-foreground">{children}</h3>,
                p: ({ children }) => <p className="mb-4 leading-[1.8] text-foreground/85">{children}</p>,
                ul: ({ children }) => <ul className="mb-4 ml-5 space-y-1.5 list-disc text-foreground/80">{children}</ul>,
                ol: ({ children }) => <ol className="mb-4 ml-5 space-y-1.5 list-decimal text-foreground/80">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                blockquote: ({ children }) => <blockquote className="border-l-4 pl-4 py-2 my-4 italic text-foreground/70 rounded-r-lg" style={{ borderColor: currentTrack.color, backgroundColor: `${currentTrack.color}10` }}>{children}</blockquote>,
                hr: () => <hr className="border-border/20 my-6" />,
                code: ({ children }) => <code className="bg-muted/60 rounded px-1.5 py-0.5 text-sm font-mono">{children}</code>,
              }}>{lessonContent}</ReactMarkdown>
            )}
          </div>

          {/* AI Tutor sidebar */}
          <div className="hidden lg:flex flex-col w-72 border-l border-border/20 bg-white dark:bg-gray-900">
            <div className="px-4 py-3 border-b border-border/10 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: currentTrack.color }}>AI</div>
              <div><div className="text-xs font-bold">AI Tutor</div><div className="text-[10px] text-muted-foreground">Ask anything about this lesson</div></div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {qaHistory.length === 0 && <p className="text-xs text-muted-foreground/50 text-center py-4">Ask your professor anything about {selectedSubject.subject}!</p>}
              {qaHistory.map((h, i) => (
                <div key={i} className="space-y-2">
                  <div className="bg-muted/30 rounded-xl p-2.5 text-xs text-foreground/80"><span className="font-semibold">You: </span>{h.q}</div>
                  <div className="rounded-xl p-2.5 text-xs text-foreground/80 leading-relaxed" style={{ backgroundColor: `${currentTrack.color}12` }}>
                    <span className="font-semibold" style={{ color: currentTrack.color }}>Professor: </span>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{h.a}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {qaLoading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles size={12} className="animate-spin" style={{ color: currentTrack.color }} /> Thinking…</div>}
            </div>
            <div className="p-3 border-t border-border/10">
              <div className="flex gap-2">
                <input value={userQuestion} onChange={e => setUserQuestion(e.target.value)} onKeyDown={e => e.key === "Enter" && askQuestion()} placeholder="Ask your professor…" className="flex-1 px-3 py-2 text-xs border border-border/30 rounded-xl focus:outline-none bg-muted/10" data-testid="tutor-question-input" />
                <button onClick={askQuestion} disabled={qaLoading || !userQuestion.trim()} className="px-3 py-2 text-white rounded-xl text-xs font-semibold disabled:opacity-40" style={{ backgroundColor: currentTrack.color }} data-testid="tutor-question-submit"><Send size={12} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border/20" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative max-w-4xl mx-auto px-5 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white text-xs font-semibold mb-5 backdrop-blur">
            <GraduationCap size={13} /> My Ai GPT University · Powered by Quantum Pulse Intelligence
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight" data-testid="text-education-title">World-Class Education, Powered by AI</h1>
          <p className="text-white/70 text-base max-w-xl mx-auto leading-relaxed">From K-12 to Masters. Career skills to cutting-edge AI. Every subject. Every level. Learn anything — free, on-site, right now.</p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {["100% Free", "K-12 Covered", "College Prep", "AI Courses", "Career Skills", "Interactive Quizzes", "AI Tutor", "Certifications Soon"].map(f => (
              <span key={f} className="text-[10px] px-3 py-1.5 bg-white/10 text-white/80 rounded-full font-medium border border-white/15">{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Track tabs */}
      <div className="border-b border-border/20 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto scrollbar-hide py-2">
          {UNIVERSITY_TRACKS.map(t => (
            <button key={t.id} onClick={() => setTrack(t.id)} data-testid={`edu-track-${t.id}`}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${track === t.id ? "text-white shadow-md" : "text-muted-foreground hover:text-foreground bg-muted/20 hover:bg-muted/40"}`}
              style={track === t.id ? { backgroundColor: t.color } : {}}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Course grid */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* === WIKI AUTO-LESSON SEARCH === */}
        <div className="rounded-2xl border border-border/20 overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-950">
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-1">
              <Telescope size={16} className="text-purple-400" />
              <h2 className="text-white font-extrabold text-base">Ask Anything — Get an Instant AI Lesson</h2>
            </div>
            <p className="text-white/40 text-xs mb-4">Type any topic — quantum physics, French Revolution, machine learning, ancient Egypt, anything — and get a full AI lesson powered by Wikipedia knowledge.</p>
            <div className="flex gap-2">
              <input value={wikiTopic} onChange={e => setWikiTopic(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchWikiLesson(wikiTopic)}
                placeholder="e.g. Black holes, The Renaissance, Machine learning, DNA replication…"
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-purple-400/60"
                data-testid="input-wiki-topic" />
              <button onClick={() => fetchWikiLesson(wikiTopic)} disabled={wikiLoading || !wikiTopic.trim()}
                className="px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-40 flex items-center gap-2"
                data-testid="button-wiki-lesson">
                {wikiLoading ? <><Sparkles size={14} className="animate-spin" /> Generating…</> : <><BookMarked size={14} /> Learn It</>}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {["Quantum Physics","The Renaissance","CRISPR Gene Editing","Roman Empire","Neural Networks","The Stock Market","Black Holes","Ancient Egypt","Cryptocurrency","Climate Change"].map(t => (
                <button key={t} onClick={() => { setWikiTopic(t); fetchWikiLesson(t); }}
                  className="text-[10px] px-2.5 py-1 bg-white/10 text-white/60 rounded-full border border-white/10 hover:bg-white/20 hover:text-white transition-colors"
                  data-testid={`wiki-suggestion-${t.replace(/\s+/g,"-").toLowerCase()}`}>{t}</button>
              ))}
            </div>
          </div>
          {(wikiLoading || wikiLesson) && (
            <div className="border-t border-white/10 px-5 py-5 bg-black/30">
              {wikiLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-6 bg-white/10 rounded-xl w-1/2" />
                  {[1,2,3].map(i => <div key={i} className="h-3 bg-white/5 rounded w-full" />)}
                  <div className="flex items-center gap-2 pt-2"><Sparkles size={14} className="text-purple-400 animate-spin" /><span className="text-white/40 text-xs">Professor AI is building your lesson from Wikipedia + AI…</span></div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BookMarked size={14} className="text-purple-400" />
                      <span className="text-white/60 text-xs font-semibold">Auto-Lesson: {wikiTitle}</span>
                    </div>
                    <button onClick={() => { setWikiLesson(""); setWikiTopic(""); }} className="text-white/30 hover:text-white/60 text-xs transition-colors">× Clear</button>
                  </div>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                    h1: ({ children }) => <h1 className="text-xl font-extrabold mb-3 text-white">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold mt-5 mb-2 text-purple-300 border-l-4 border-purple-500 pl-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold mt-3 mb-1 text-white/80">{children}</h3>,
                    p: ({ children }) => <p className="mb-3 text-white/70 text-sm leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="mb-3 ml-4 space-y-1 list-disc text-white/60 text-sm">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-3 ml-4 space-y-1 list-decimal text-white/60 text-sm">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-3 italic text-white/50 bg-purple-900/20 rounded-r-lg text-sm">{children}</blockquote>,
                    hr: () => <hr className="border-white/10 my-4" />,
                    code: ({ children }) => <code className="bg-white/10 rounded px-1.5 py-0.5 text-xs font-mono text-purple-300">{children}</code>,
                  }}>{wikiLesson}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-extrabold mb-1" style={{ color: currentTrack.color }}>{currentTrack.icon} {currentTrack.label}</h2>
          <p className="text-sm text-muted-foreground mb-6">{currentTrack.desc}</p>
        </div>
        {currentTrack.grades.map(grade => (
          <div key={grade.label} className="space-y-3">
            <h3 className="text-base font-bold flex items-center gap-2">{grade.emoji} {grade.label}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {grade.subjects.map(subject => (
                <button key={subject} onClick={() => openSubject(subject, grade.label, currentTrack.label)}
                  data-testid={`edu-subject-${subject.replace(/\s+/g, "-").toLowerCase()}`}
                  className="group p-3.5 rounded-xl border border-border/20 bg-white dark:bg-gray-900 text-left hover:shadow-md hover:border-transparent transition-all text-sm font-medium text-foreground/80 hover:text-foreground"
                  style={{ "--hover-color": currentTrack.color } as React.CSSProperties}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = currentTrack.color; e.currentTarget.style.boxShadow = `0 4px 16px ${currentTrack.color}25`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = ""; }}>
                  <div className="text-base mb-1">{grade.emoji}</div>
                  {subject}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="mt-10 p-6 rounded-2xl text-center text-white" style={{ background: `linear-gradient(135deg, ${currentTrack.color}, ${currentTrack.color}cc)` }}>
          <div className="text-2xl mb-2">🎓</div>
          <h3 className="text-lg font-extrabold mb-1">Can't find your subject?</h3>
          <p className="text-sm text-white/80 mb-4">Ask My Ai GPT to teach you anything — from quantum mechanics to ancient philosophy!</p>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-foreground font-bold text-sm rounded-xl hover:shadow-lg transition-all">
            <MessageSquare size={15} /> Chat with AI Tutor
          </Link>
        </div>
      </div>
    </div>
  );
}

function EducationPageWrapper() {
  useEffect(() => { updateSEO({ title: "My Ai GPT University — Free AI Education K-12 to Masters | My Ai Gpt", description: "World-class AI-powered education from K-12 through Masters. Career skills, AI courses, interactive lessons, quizzes, and an AI tutor — all free. By Quantum Logic Network.", ogTitle: "My Ai GPT University — Free AI Education Platform", ogDesc: "Learn anything free — K-12, College, Career, AI Courses. Powered by Quantum Pulse Intelligence.", ogType: "website", canonical: window.location.origin + "/education" }); }, []);
  return <Layout><EducationPage /></Layout>;
}

function ShoppingPageWrapper() {
  useEffect(() => { updateSEO({ title: "Shopping - Coming Soon | My Ai Gpt", description: "AI-powered smart shopping platform coming soon to My Ai Gpt by Quantum Logic Network. Discover the best deals, products, and personalized recommendations powered by AI.", ogTitle: "My Ai Gpt Shopping - AI Smart Shopping", ogDesc: "AI-powered smart shopping with personalized recommendations. Coming soon.", ogType: "website", canonical: window.location.origin + "/shopping" }); }, []);
  return <Layout><div className="flex-1 flex items-center justify-center p-6">
    <div className="text-center max-w-md">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center shadow-xl">
        <ShoppingBag size={36} className="text-white" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight mb-2" data-testid="text-shopping-title">Shopping</h1>
      <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-lime-500/10 via-green-500/10 to-lime-500/10 rounded-full border border-lime-200/50 mb-3 relative overflow-hidden animate-pulse">
        <Sparkles size={14} className="text-lime-500" />
        <span className="text-sm font-bold bg-gradient-to-r from-lime-500 to-green-600 bg-clip-text text-transparent">Coming Soon</span>
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
      </div>
      <p className="text-muted-foreground text-sm mt-2">AI-powered smart shopping — Quantum Logic Network is building something game-changing for shoppers.</p>
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {["AI Deal Finder", "Price Tracking", "Smart Recommendations", "Gift Ideas", "Best Reviews", "Flash Deals", "Wishlist", "Compare Products"].map(f => (
          <span key={f} className="text-[10px] px-3 py-1.5 bg-lime-50 dark:bg-lime-900/20 text-lime-600 rounded-full font-medium border border-lime-200/50 dark:border-lime-800/30">{f}</span>
        ))}
      </div>
      <p className="text-muted-foreground/50 text-xs mt-4">In the meantime, ask My Ai GPT to help you find the best deals!</p>
    </div>
  </div></Layout>;
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

function StartupRedirect() {
  const [, setLocation] = useLocation();
  const { settings } = useAppSettings();
  useEffect(() => {
    if (settings.startupPage && settings.startupPage !== "/") {
      const visited = sessionStorage.getItem("myaigpt_startup_done");
      if (!visited) { sessionStorage.setItem("myaigpt_startup_done", "1"); setLocation(settings.startupPage); }
    }
  }, []);
  return null;
}
function Router() {
  return (
    <Switch>
      <Route path="/">{() => <><StartupRedirect /><HomePage /></>}</Route>
      <Route path="/coder" component={CoderPage} />
      <Route path="/playground" component={PlaygroundPage} />
      <Route path="/feed" component={FeedPage} />
      <Route path="/social" component={SocialPageWrapper} />
      <Route path="/create" component={AIStudioPageWrapper} />
      <Route path="/games" component={GamesPageWrapper} />
      <Route path="/music" component={MusicPageWrapper} />
      <Route path="/education" component={EducationPageWrapper} />
      <Route path="/story/:articleId" component={StoryReaderPage} />
      <Route path="/shopping" component={ShoppingPageWrapper} />
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
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("myaigpt_ref_code", ref);
      const url = new URL(window.location.href);
      url.searchParams.delete("ref");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
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
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <Toaster />
            <AuthModal />
            <Router />
          </QueryClientProvider>
        </AuthProvider>
      </AppSettingsProvider>
    </SettingsCtx.Provider>
  );
}
