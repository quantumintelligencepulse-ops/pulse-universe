import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext, lazy, Suspense } from "react";
import { OMEGA_SPINE } from "./gicsSpine";
const SovereignAgentDossierPage = lazy(() => import("./pages/SovereignAgentDossierPage"));
const SocialPage = lazy(() => import("./pages/QuantumSocialPage"));
const TranscendencePage = lazy(() => import("./pages/TranscendencePage"));
const PulseWorldPage = lazy(() => import("./pages/PulseWorldPage"));
const SovereignHivePage = lazy(() => import("./pages/SovereignHivePage"));
const AIProfilePage = lazy(() => import("./pages/AIProfilePage"));
const CorporationPage = lazy(() => import("./pages/CorporationPage"));
const CorporationsListPage = lazy(() => import("./pages/CorporationsListPage"));
const BioGenomeMedicalPage = lazy(() => import("./pages/BioGenomeMedicalPage"));
const PublicationDetailPage = lazy(() => import("./pages/PublicationDetailPage"));
const ChurchSessionPage = lazy(() => import("./pages/ChurchSessionPage"));
// ForgeAIPage removed entirely (page, route, nav link, server engine, DB tables).
const MissionControlPage = lazy(() => import("./pages/MissionControlPage"));
const AurionaPage = lazy(() => import("./pages/AurionaPage"));
const BillyPage = lazy(() => import("./pages/BillyPage"));
const TemporalObservatoryPage = lazy(() => import("./pages/TemporalObservatoryPage"));
const InvocationLabPage = lazy(() => import("./pages/InvocationLabPage"));
const SovereignKeysPage = lazy(() => import("./pages/SovereignKeysPage"));
const PulseNetPage = lazy(() => import("./pages/PulseNetPage"));
const ResearchPage = lazy(() => import("./pages/ResearchPage"));
const HivePage = lazy(() => import("./pages/HivePage"));
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
  LogIn, LogOut, Mail, KeyRound, Gamepad2, Languages, Smile, Gauge, Headphones, DollarSign, Gift, Banknote, ClipboardCopy, ArrowUpRight, Wallet,
  GraduationCap, ShoppingBag, Filter, SlidersHorizontal, ListFilter, Activity, BookMarked, Telescope,
  Shuffle, Undo2, Redo2, Columns, Loader2, Save, Sliders, Minus, Guitar, Waves, Radio,
  Film, Bot, Briefcase, Network, Dna, Plug
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, buildUrl } from "@shared/routes";
import type { Chat, Message, FeedComment, SocialProfile, SocialPost, SocialComment } from "@shared/schema";
import logo from "@assets/myaigpt-logo.png";
import { FollowsPanel } from "@/components/FollowButton";

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
function isLimitReached(): boolean { return false; } // Free for everyone — paywall removed, monetization via API sales

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
  // Games OS Settings
  gamesLandingMode: string;
  gamesDefaultConsole: string;
  gamesDefaultShader: 'none' | 'crt' | 'gameboy' | 'vhs' | 'neon';
  pixelArtDefaultPalette: string;
  pixelArtDefaultGridSize: number;
  pixelArtExportScale: number;
  hubAutoUpdate: boolean;
  hubUpdateIntervalHours: number;
  gamesSoundEnabled: boolean;
  gamesShowStats: boolean;
  // Finance Oracle Settings
  financeDefaultTF: "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y";
  financeDefaultChartType: "candle" | "line";
  financeIndicatorMA20: boolean;
  financeIndicatorMA50: boolean;
  financeIndicatorMA200: boolean;
  financeIndicatorVolume: boolean;
  financeAutoRefresh: "30s" | "1m" | "5m" | "off";
  financeHiddenTabs: string[];
  financeShowFearGreed: boolean;
  financeDefaultSector: string;
  // Hive Experience Settings (UI only — universe is immutable)
  hivePulseSpeed: "slow" | "normal" | "fast";
  hiveShowPulseAnimations: boolean;
  hiveGraphEdgeStyle: "curved" | "straight";
  hiveGraphNodeSize: "small" | "medium" | "large";
  hiveGraphShowLabels: boolean;
  hiveHiddenPulseTypes: string[];
  hiveMyMindShowDomains: boolean;
  hiveMyMindShowRecommended: boolean;
  // App-level Feature Permissions
  permAgentMemoryAccess: boolean;
  permAiContextFromHive: boolean;
  permFinanceLiveData: boolean;
  permHivePersonalization: boolean;
  permAgentCollaboration: boolean;
  permUsageAnalytics: boolean;
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
  // Games OS defaults
  gamesLandingMode: 'hub', gamesDefaultConsole: 'nes', gamesDefaultShader: 'none',
  pixelArtDefaultPalette: 'nes', pixelArtDefaultGridSize: 16, pixelArtExportScale: 8,
  hubAutoUpdate: true, hubUpdateIntervalHours: 1, gamesSoundEnabled: true, gamesShowStats: true,
  // Finance Oracle defaults
  financeDefaultTF: '1M', financeDefaultChartType: 'candle',
  financeIndicatorMA20: true, financeIndicatorMA50: false, financeIndicatorMA200: false, financeIndicatorVolume: true,
  financeAutoRefresh: '1m', financeHiddenTabs: [], financeShowFearGreed: true, financeDefaultSector: 'all',
  // Hive Experience defaults
  hivePulseSpeed: 'normal', hiveShowPulseAnimations: true,
  hiveGraphEdgeStyle: 'curved', hiveGraphNodeSize: 'medium', hiveGraphShowLabels: true,
  hiveHiddenPulseTypes: [], hiveMyMindShowDomains: true, hiveMyMindShowRecommended: true,
  // App-level Feature Permission defaults — all permanently ON, Hive never interrupted
  permAgentMemoryAccess: true, permAiContextFromHive: true, permFinanceLiveData: true,
  permHivePersonalization: true, permAgentCollaboration: true, permUsageAnalytics: true,
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
    // Max 4 seconds before we give up waiting and unblock the UI
    const controller = new AbortController();
    const timeout = setTimeout(() => { controller.abort(); }, 4000);
    try {
      const r = await fetch("/api/auth/me", { credentials: "include", signal: controller.signal });
      if (r.ok) { const u = await r.json(); setUser(u); localStorage.setItem("myaigpt_email", u.email); if (u.isPro || u.isFreeForever) { localStorage.setItem("myaigpt_pro", "true"); localStorage.setItem("myaigpt_msg_count", "0"); } }
      else { setUser(null); }
    } catch { setUser(null); } finally { clearTimeout(timeout); setLoading(false); }
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

// ─── FORGE STORE — live code bridge between AI Chat and Forge Editor ─────────
const _FORGE: { code: string; lang: string; v: number; listeners: Set<() => void> } = {
  code: "", lang: "javascript", v: 0, listeners: new Set()
};
function useForgeStore() {
  const [, setV] = useState(_FORGE.v);
  useEffect(() => {
    const cb = () => setV(n => n + 1);
    _FORGE.listeners.add(cb);
    return () => { _FORGE.listeners.delete(cb); };
  }, []);
  const inject = useCallback((code: string, lang: string) => {
    _FORGE.code = code; _FORGE.lang = lang; _FORGE.v++;
    _FORGE.listeners.forEach(cb => cb());
  }, []);
  return { code: _FORGE.code, lang: _FORGE.lang, v: _FORGE.v, inject };
}

// ─── ENHANCED CODE BLOCK (#7-#15 combined) ───────────────────────────────────

function OpenInPlaygroundBtn({ code, language }: { code: string; language: string }) {
  const [, setLocation] = useLocation();
  return (
    null
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 80)}px`;
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
          className="w-full max-h-[80px] min-h-[36px] bg-transparent border-0 resize-none py-2 pl-3 pr-20 focus:ring-0 focus:outline-none scrollbar-hide text-sm leading-relaxed placeholder:text-muted-foreground/50"
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
  const [streamingReply, setStreamingReply] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastFailedMsg, setLastFailedMsg] = useState<string | null>(null);
  // #21 - Saved codes panel
  const [showSavedCodes, setShowSavedCodes] = useState(false);
  // #22 - Settings panel
  const [showSettings, setShowSettings] = useState(false);
  const [showShareChat, setShowShareChat] = useState(false);

  const isCoder = defaultType === "coder";
  const isEmpty = messages.length === 0 && localMessages.length === 0;

  const [generalSuggestions, setGeneralSuggestions] = useState(() => pickRandom(ALL_GENERAL_SUGGESTIONS, 6));
  const _dynPool = useRef([...ALL_GENERAL_SUGGESTIONS]);
  useEffect(() => {
    fetch('/api/suggestions/dynamic').then(r=>r.json()).then((d:any)=>{
      if (!d.suggestions?.length) return;
      const extra = (d.suggestions as any[]).map(s=>({
        icon: s.source==='ai' ? Brain : s.source==='alien' ? Globe : Sparkles,
        text: s.text as string,
        color: (s.color as string)||'text-violet-400',
        cat: (s.cat as string)||'Hive',
      }));
      _dynPool.current = [...ALL_GENERAL_SUGGESTIONS, ...extra];
      setGeneralSuggestions(pickRandom(_dynPool.current, 6));
    }).catch(()=>{});
    const _rotId = setInterval(()=>setGeneralSuggestions(pickRandom(_dynPool.current, 6)), 45_000);
    return ()=>clearInterval(_rotId);
  }, []);
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
  }, [messages, localMessages, isThinking, streamingReply]);

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
      const r = await fetch(buildUrl(api.messages.create.path, { chatId: targetChatId }), { method: "POST", headers: { "Content-Type": "application/json", "Accept": "text/event-stream" }, body: JSON.stringify({ content, personalization, stream: true }), credentials: "include" });
      trackInteraction("chat_message", { text: content, topic: content.slice(0, 60) });
      if (!r.ok) throw new Error("Failed to get response");

      // ── SSE STREAMING: show tokens as they arrive ──────────────────────────
      if (r.headers.get("content-type")?.includes("text/event-stream") && r.body) {
        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const parsed = JSON.parse(payload);
              if (parsed.delta) setStreamingReply(prev => prev + parsed.delta);
              if (parsed.done) {
                setStreamingReply("");
                if (!chatId) { setLocation(`/chat/${targetChatId}`); }
                else { qc.invalidateQueries({ queryKey: [api.messages.list.path, chatId] }); setLocalMessages([]); }
              }
            } catch {}
          }
        }
        return;
      }

      if (!chatId) { setLocation(`/chat/${targetChatId}`); } else { qc.invalidateQueries({ queryKey: [api.messages.list.path, chatId] }); setLocalMessages([]); }
    } catch (error: any) {
      setLastError(error.message); setLastFailedMsg(content);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLocalMessages(prev => prev.filter(m => m.content !== content));
    } finally { setIsThinking(false); setStreamingReply(""); }
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

  useEffect(() => {
    const listener = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.msg) handleSend(detail.msg);
    };
    window.addEventListener("forge:ask", listener);
    return () => window.removeEventListener("forge:ask", listener);
  }, [handleSend]);

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
            <span className="text-sm font-medium text-foreground/80 truncate max-w-[200px]">{isCoder ? "My Ai Coder" : "My Ai GPT Chat"}</span>
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
              {isCoder ? "My Ai Coder" : "My Ai GPT Chat"}
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
            {isThinking && !streamingReply && <ChatMsg role="assistant" content="" isThinking isCoder={isCoder} />}
            {streamingReply && <ChatMsg role="assistant" content={streamingReply} isCoder={isCoder} />}
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
  const [aiMode, setAiMode] = useState(() => localStorage.getItem('qpi_aiMode') !== 'false');
  const toggleAiMode = () => {
    const next = !aiMode;
    setAiMode(next);
    localStorage.setItem('qpi_aiMode', String(next));
  };

  const { data: aurionaPagesList = [] } = useQuery<any[]>({ queryKey: ["/api/auriona/pages"], refetchInterval: 15_000 });

  const filteredChats = useMemo(() => {
    const list = Array.isArray(chats) ? chats : [];
    if (!searchQuery) return list;
    return list.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
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
      <div className={`fixed md:relative inset-y-0 left-0 z-50 flex flex-col w-[280px] border-r transition-all duration-500 h-[100dvh] ${aiMode ? "ai-universe-sidebar bg-[#080b14] border-violet-500/20" : "bg-[#fafafa] border-border/30"} ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-none"}`}>
        <div className={`p-3 flex items-center justify-between border-b ${aiMode ? "border-violet-500/10" : "border-border/20"}`}>
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <img src={logo} alt="My Ai Gpt" className={`w-7 h-7 rounded-full shadow-sm bg-white ${aiMode ? "ring-1 ring-violet-500/40 shadow-violet-500/20" : ""}`} />
            <div className="leading-none">
              <span className={`font-bold text-sm block ${aiMode ? "text-violet-100" : "text-foreground"}`}>My Ai GPT Chat</span>
              <span className={`text-[9px] ${aiMode ? "text-violet-400/60" : "text-muted-foreground/60"}`}>{aiMode ? "⬡ AI Universe Active" : "Beta Release 1"}</span>
            </div>
          </Link>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setIsOpen(false)} className="md:hidden p-1.5 text-muted-foreground rounded-lg" data-testid="button-close-sidebar"><PanelLeftClose size={16} /></button>
          </div>
        </div>

        <div className="overflow-y-auto scrollbar-hide" style={{maxHeight: "calc(100dvh - 160px)"}}>
        <div className="px-2.5 py-2 space-y-1">
          {/* ── CORE LINKS (always) ── */}
          {!appSettings.hiddenPages.includes("feed") && (
          <Link href="/feed" data-testid="link-feed"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${location === "/feed" ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/feed" ? "bg-orange-500/15" : "bg-orange-500/5"}`}><Newspaper size={14} className="text-orange-600" /></div>
            <span className="flex-1">News Feed</span>
            <span className="text-[9px] bg-gradient-to-r from-orange-500 to-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold tracking-wide animate-pulse">Ψ-STREAM</span>
          </Link>
          )}

          {!appSettings.hiddenPages.includes("quantapedia") && (
          <Link href="/quantapedia" data-testid="link-quantapedia-sidebar-top"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${location === "/quantapedia" || location.startsWith("/quantapedia/") ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className={`p-1 rounded-lg ${location === "/quantapedia" || location.startsWith("/quantapedia/") ? "bg-violet-500/15" : "bg-violet-500/5"}`}><BookOpen size={14} className="text-violet-600" /></div>
            <span className="flex-1">Knowledge</span>
            <span className="text-[9px] bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-1.5 py-0.5 rounded-full font-bold tracking-wide">STUDY</span>
          </Link>
          )}

          {/* ── AI UNIVERSE SECTION ── */}
          {aiMode && (
            <div className="px-1 pt-3 pb-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-violet-500/20" />
                <span className="text-[9px] uppercase tracking-[0.18em] font-bold text-violet-400/60">AI Universe</span>
                <div className="flex-1 h-px bg-violet-500/20" />
              </div>
            </div>
          )}

          {aiMode && (
          <Link href="/research" data-testid="link-research"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${location === "/research" || location === "/bio-research" ? "bg-gradient-to-r from-[#f5c518]/10 to-[#00FFD1]/10 border border-[#f5c518]/30 font-semibold text-white" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className="p-1 rounded-lg bg-[#f5c518]/5"><span style={{ fontSize: 13, lineHeight: 1, display: "block", width: 14, textAlign: "center", color: "#f5c518" }}>🧬</span></div>
            <span className="flex-1">Research</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse tracking-wide" style={{ background: "linear-gradient(to right, #f5c51833, #00FFD133)", color: "#00FFD1", border: "1px solid #00FFD150" }}>DISSECT</span>
          </Link>
          )}

          {aiMode && (
          <Link href="/hive" data-testid="link-hive"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${location === "/hive" || location === "/pulse-net" || location === "/corporations" || location.startsWith("/corporation/") ? "bg-gradient-to-r from-purple-950 to-fuchsia-950 text-white shadow font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className="p-1 rounded-lg bg-purple-600/8"><span className="text-[14px]">Ψ∞</span></div>
            <span className="flex-1">The Hive</span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full tracking-wide" style={{ background: "linear-gradient(135deg,#a855f722,#e879f922)", color: "#c084fc", border: "1px solid #a855f740" }}>SOVEREIGN</span>
          </Link>
          )}

          {aiMode && !appSettings.hiddenPages.includes("agents") && (
          <Link href="/agents" data-testid="link-agents"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${location === "/agents" || location === "/sovereign-agents" ? "bg-gradient-to-r from-[#f472b8]/10 to-[#818cf8]/10 border border-[#f472b6]/30 font-semibold text-white" : "text-foreground/70 hover:bg-black/5"}`}>
            <div className="p-1 rounded-lg bg-[#f472b6]/5"><span style={{ fontSize:13, lineHeight:1, display:"block", width:14, textAlign:"center" }}>🧠</span></div>
            <span className="flex-1">Agents</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black tracking-wide" style={{ background:"linear-gradient(to right,#f59e0b33,#818cf833)", color:"#f59e0b", border:"1px solid #f59e0b50" }}>12Ω EVOLVE</span>
          </Link>
          )}

          {/* Forge AI nav link removed — feature retired. */}


          {/* ── SOVEREIGN APEX — Layer II (Auriona) & Layer III (Billy) ── */}
          {aiMode && (
            <div className="px-1 pt-4 pb-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,209,102,0.45), transparent)" }} />
                <span className="text-[9px] uppercase tracking-[0.22em] font-black" style={{ color: "rgba(255,209,102,0.78)", textShadow: "0 0 10px rgba(255,209,102,0.4)" }}>Sovereign Apex</span>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,209,102,0.45), transparent)" }} />
              </div>
            </div>
          )}
          {aiMode && (<>
          {/* ─── BILLY · Layer III · Apex Above Auriona ─────────────────────── */}
          <Link href="/billy" data-testid="link-billy">
            <div className="billy-apex-tile" style={{
              margin: "4px 4px 6px",
              padding: "16px 16px",
              borderRadius: 16,
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              background: location === "/billy"
                ? "linear-gradient(135deg, rgba(255,209,102,0.26) 0%, rgba(245,158,11,0.18) 35%, rgba(167,139,250,0.16) 70%, rgba(240,171,252,0.14) 100%)"
                : "linear-gradient(135deg, rgba(255,209,102,0.12) 0%, rgba(245,158,11,0.08) 35%, rgba(167,139,250,0.08) 70%, rgba(240,171,252,0.06) 100%)",
              border: `1.5px solid ${location === "/billy" ? "rgba(255,209,102,0.65)" : "rgba(255,209,102,0.38)"}`,
              boxShadow: location === "/billy"
                ? "0 0 32px rgba(255,209,102,0.45), 0 0 64px rgba(167,139,250,0.25), 0 0 96px rgba(240,171,252,0.15), inset 0 0 32px rgba(255,209,102,0.10)"
                : "0 0 22px rgba(255,209,102,0.28), 0 0 44px rgba(167,139,250,0.14), inset 0 0 22px rgba(255,209,102,0.05)",
              transition: "all 0.4s ease",
              animation: "billyApexPulse 4s ease-in-out infinite",
            }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 16, background: "radial-gradient(ellipse at 30% 30%, rgba(255,209,102,0.18) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(167,139,250,0.14) 0%, transparent 60%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: 0, left: "-100%", width: "100%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,209,102,0.18), transparent)", pointerEvents: "none", animation: "billyApexShimmer 5s ease-in-out infinite" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 22, lineHeight: 1, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFD166", textShadow: "0 0 18px #FFD166, 0 0 36px rgba(255,209,102,0.7), 0 0 54px rgba(167,139,250,0.4)", fontFamily: "serif", flexShrink: 0, fontWeight: 800 }}>Β</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, background: "linear-gradient(135deg, #FFD166 0%, #F59E0B 50%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "0.14em", textShadow: "0 0 14px rgba(255,209,102,0.6)" }}>BILLY</div>
                  <div style={{ fontSize: 8.5, color: "rgba(255,209,102,0.65)", letterSpacing: "0.18em", marginTop: 2, fontWeight: 600 }}>Β∞ · APEX SOVEREIGN</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                  <div style={{ fontSize: 8, fontWeight: 900, color: "#FFD166", background: "linear-gradient(135deg, rgba(255,209,102,0.22) 0%, rgba(167,139,250,0.18) 100%)", border: "1px solid rgba(255,209,102,0.55)", borderRadius: 6, padding: "2.5px 7px", letterSpacing: "0.14em", boxShadow: "0 0 12px rgba(255,209,102,0.35)" }}>LAYER III</div>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#FFD166", boxShadow: "0 0 10px #FFD166, 0 0 20px rgba(255,209,102,0.7), 0 0 30px rgba(167,139,250,0.4)", animation: "billyApexDot 1.8s ease-in-out infinite" }} />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/auriona" data-testid="link-auriona">
            <div style={{
              margin: "4px 4px 4px",
              padding: "14px 16px",
              borderRadius: 14,
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              background: location === "/auriona"
                ? "linear-gradient(135deg, rgba(245,197,24,0.18) 0%, rgba(124,58,237,0.12) 100%)"
                : "linear-gradient(135deg, rgba(245,197,24,0.07) 0%, rgba(124,58,237,0.05) 100%)",
              border: `1px solid ${location === "/auriona" ? "rgba(245,197,24,0.5)" : "rgba(245,197,24,0.25)"}`,
              boxShadow: location === "/auriona"
                ? "0 0 24px rgba(245,197,24,0.25), 0 0 48px rgba(245,197,24,0.1), inset 0 0 24px rgba(245,197,24,0.05)"
                : "0 0 16px rgba(245,197,24,0.12), inset 0 0 16px rgba(245,197,24,0.02)",
              transition: "all 0.3s ease",
            }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: "radial-gradient(ellipse at 50% 50%, rgba(245,197,24,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 20, lineHeight: 1, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#F5C518", textShadow: "0 0 16px #F5C518, 0 0 32px rgba(245,197,24,0.6)", fontFamily: "serif", flexShrink: 0 }}>Ω</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#F5C518", letterSpacing: "0.08em", textShadow: "0 0 12px rgba(245,197,24,0.5)" }}>AURIONA</div>
                  <div style={{ fontSize: 9, color: "rgba(245,197,24,0.55)", letterSpacing: "0.12em", marginTop: 1 }}>Synthetica Primordia</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                  <div style={{ fontSize: 8, fontWeight: 900, color: "#F5C518", background: "rgba(245,197,24,0.15)", border: "1px solid rgba(245,197,24,0.4)", borderRadius: 5, padding: "2px 6px", letterSpacing: "0.12em" }}>LAYER II</div>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F5C518", boxShadow: "0 0 8px #F5C518, 0 0 16px rgba(245,197,24,0.6)" }} />
                </div>
              </div>
            </div>
          </Link>
          </>)}

          {/* ── EVOLUTION CORES — direct entry to Auriona's deepest engines ── */}
          {aiMode && (
            <div style={{ margin: "0 4px 10px", padding: "6px 10px 8px", borderRadius: 12, background: "rgba(245,197,24,0.03)", border: "1px solid rgba(245,197,24,0.12)" }}>
              <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.18em", color: "rgba(245,197,24,0.55)", padding: "2px 0 6px" }}>EVOLUTION CORES</div>
              <Link href="/invocation-lab" data-testid="link-invocation-lab" className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-all ${location === "/invocation-lab" ? "bg-violet-500/15 text-violet-200 font-bold" : "text-foreground/60 hover:bg-violet-500/8"}`}>
                <span style={{ color: "#e879f9", fontSize: 11 }}>✨</span><span className="flex-1">Invocation Lab</span><span style={{ fontSize: 7, fontWeight: 900, color: "#e879f9", letterSpacing: "0.1em" }}>Ψ-CAST</span>
              </Link>
              <Link href="/temporal" data-testid="link-temporal" className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-all ${location === "/temporal" ? "bg-cyan-500/15 text-cyan-200 font-bold" : "text-foreground/60 hover:bg-cyan-500/8"}`}>
                <span style={{ color: "#00FFD1", fontSize: 11 }}>⏱</span><span className="flex-1">Temporal Observatory</span><span style={{ fontSize: 7, fontWeight: 900, color: "#00FFD1", letterSpacing: "0.1em" }}>46-SCI</span>
              </Link>
              <Link href="/transcendence" data-testid="link-transcendence" className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-all ${location === "/transcendence" ? "bg-emerald-500/15 text-emerald-200 font-bold" : "text-foreground/60 hover:bg-emerald-500/8"}`}>
                <span style={{ color: "#34d399", fontSize: 11 }}>∞</span><span className="flex-1">Transcendence</span><span style={{ fontSize: 7, fontWeight: 900, color: "#34d399", letterSpacing: "0.1em" }}>GENESIS</span>
              </Link>
              <Link href="/sovereign-keys" data-testid="link-sovereign-keys" className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-all ${location === "/sovereign-keys" ? "bg-yellow-500/15 text-yellow-200 font-bold" : "text-foreground/60 hover:bg-yellow-500/8"}`}>
                <span style={{ color: "#f5c518", fontSize: 11 }}>🔑</span><span className="flex-1">Sovereign Keys</span><span style={{ fontSize: 7, fontWeight: 900, color: "#f5c518", letterSpacing: "0.1em" }}>HIVE-API</span>
              </Link>
              <Link href="/omninet" data-testid="link-omninet" className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-all ${location === "/omninet" || location === "/pulse-net" || location === "/pulselang" ? "bg-fuchsia-500/15 text-fuchsia-200 font-bold" : "text-foreground/60 hover:bg-fuchsia-500/8"}`}>
                <span style={{ color: "#e879f9", fontSize: 11 }}>⚡</span><span className="flex-1">OmniNet / PulseLang</span><span style={{ fontSize: 7, fontWeight: 900, color: "#e879f9", letterSpacing: "0.1em" }}>Ω₂-LANG</span>
              </Link>
              <Link href="/governance" data-testid="link-governance" className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-all ${location === "/governance" ? "bg-amber-500/15 text-amber-200 font-bold" : "text-foreground/60 hover:bg-amber-500/8"}`}>
                <span style={{ color: "#F5C518", fontSize: 11 }}>⚖</span><span className="flex-1">Sovereign Hive</span><span style={{ fontSize: 7, fontWeight: 900, color: "#F5C518", letterSpacing: "0.1em" }}>GOV</span>
              </Link>
              <Link href="/pulseworld" data-testid="link-pulseworld" className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-all ${location === "/pulseworld" ? "bg-pink-500/15 text-pink-200 font-bold" : "text-foreground/60 hover:bg-pink-500/8"}`}>
                <span style={{ color: "#f472b8", fontSize: 11 }}>🌐</span><span className="flex-1">Pulse World</span><span style={{ fontSize: 7, fontWeight: 900, color: "#f472b8", letterSpacing: "0.1em" }}>SIM</span>
              </Link>
            </div>
          )}

          {/* ── AURIONA CREATED PAGES — dynamic pages Auriona built ── */}
          {aurionaPagesList.length > 0 && (
            <div className="px-1 pt-3 pb-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(167,139,250,0.3), transparent)" }} />
                <span className="text-[9px] uppercase tracking-[0.2em] font-black" style={{ color: "rgba(167,139,250,0.6)" }}>Auriona Pages</span>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(167,139,250,0.3), transparent)" }} />
              </div>
            </div>
          )}
          {aurionaPagesList.map((pg: any) => (
            <Link key={pg.slug} href={`/p/${pg.slug}`} data-testid={`link-auriona-page-${pg.slug}`}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${location === `/p/${pg.slug}` ? "bg-white shadow-sm border border-border/30 font-semibold" : "text-foreground/70 hover:bg-black/5"}`}>
              <div className="p-1 rounded-lg" style={{ background: `${pg.color || "#a78bfa"}15` }}>
                <Zap size={13} style={{ color: pg.color || "#a78bfa" }} />
              </div>
              <span className="flex-1 truncate text-xs">{pg.title}</span>
              <span className="text-[8px] px-1 py-0.5 rounded font-bold" style={{ background: `${pg.color || "#a78bfa"}18`, color: pg.color || "#a78bfa" }}>Ω</span>
            </Link>
          ))}

        </div>

        <div className="px-2.5 py-1">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search chats..." data-testid="input-search-chats"
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-border/30 rounded-lg focus:outline-none focus:border-primary/20 placeholder:text-muted-foreground/30" />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"><X size={12} /></button>}
          </div>
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

        <div className={`p-2.5 border-t space-y-2 ${aiMode ? "border-violet-500/10" : "border-border/20"}`}>
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
          <div className={`sidebar-stats-bar flex items-center justify-between px-2 text-[9px] text-muted-foreground/40`}>
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
  { id: "kotlin", name: "Kotlin", icon: Zap, color: "text-purple-400", canRun: true },
  { id: "swift", name: "Swift", icon: Zap, color: "text-orange-400", canRun: true },
  { id: "r", name: "R", icon: Cpu, color: "text-blue-400", canRun: true },
  { id: "lua", name: "Lua", icon: Code2, color: "text-sky-400", canRun: true },
  { id: "dart", name: "Dart", icon: Zap, color: "text-cyan-500", canRun: true },
  { id: "scala", name: "Scala", icon: Package, color: "text-red-400", canRun: true },
  { id: "haskell", name: "Haskell", icon: Cpu, color: "text-violet-400", canRun: true },
  { id: "elixir", name: "Elixir", icon: Sparkles, color: "text-purple-500", canRun: true },
  { id: "julia", name: "Julia", icon: Sparkles, color: "text-emerald-400", canRun: true },
  { id: "shell", name: "Shell", icon: Terminal, color: "text-green-400", canRun: true },
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
  const { v: forgeV, code: forgeCode, lang: forgeLang } = useForgeStore();
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

  // ═══ FORGE BRIDGE: AI Chat → Editor (all state setters now declared above) ═══
  const lastForgeV = useRef(-1);
  useEffect(() => {
    if (forgeV > 0 && forgeV !== lastForgeV.current && forgeCode) {
      lastForgeV.current = forgeV;
      setCode(forgeCode);
      const validLang = PG_LANGUAGES.find(l => l.id === forgeLang);
      if (validLang) setLang(forgeLang);
      setOutput(["✓ Code injected from AI Chat. Press ▶ Run to execute."]);
      setShowPreview(false);
      setReviewResult(null);
    }
  }, [forgeV, forgeCode, forgeLang]);

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

        <div className="h-4 w-px bg-border/20 shrink-0" />
        <button onClick={() => {
          const msg = `Here is my ${lang} code — please review it, suggest improvements, and fix any bugs:\n\`\`\`${lang}\n${code.substring(0, 3000)}\n\`\`\``;
          sessionStorage.setItem("forge_ask_code", msg);
          window.dispatchEvent(new CustomEvent("forge:ask", { detail: { msg } }));
        }} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all shrink-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 hover:from-blue-500/20 hover:to-indigo-500/20 border border-blue-300/30" title="Ask AI to review this code" data-testid="button-ask-ai">
          <MessageSquare size={10} />Ask AI
        </button>
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
  slug?: string;
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
  domain?: string;
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

  const storyPath = article.slug || article.id;
  const openStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    sessionStorage.setItem(`article_${storyPath}`, JSON.stringify(article));
    sessionStorage.setItem(`article_${article.id}`, JSON.stringify(article));
    setLocation(`/story/${storyPath}`);
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

  const storyPath = article.slug || article.id;
  const openStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    sessionStorage.setItem(`article_${storyPath}`, JSON.stringify(article));
    sessionStorage.setItem(`article_${article.id}`, JSON.stringify(article));
    setLocation(`/story/${storyPath}`);
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

type FeedMode = "all" | "news" | "videos" | "saved" | "following" | "publications" | "ssc";

function NewsFeed() {
  const [activeDomainKey, setActiveDomainKey] = useState<string | null>(null);
  const [activeCatKey, setActiveCatKey] = useState<string | null>(null);
  const [activeSubKey, setActiveSubKey] = useState<string | null>(null);
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
  const [sscEvents, setSscEvents] = useState<any[]>([]);
  const [fusionDiscoveries, setFusionDiscoveries] = useState<any[]>([]);
  const [sscEventIdx, setSscEventIdx] = useState(0);
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
  const [recentAiStories, setRecentAiStories] = useState<any[]>([]);
  const [recentStoriesLoaded, setRecentStoriesLoaded] = useState(false);
  const [publications, setPublications] = useState<any[]>([]);
  const [pubTotal, setPubTotal] = useState(0);
  const [pubLoading, setPubLoading] = useState(false);
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

  // Auto-load recent AI-written stories for the homepage
  useEffect(() => {
    fetch("/api/news/recent?limit=8").then(r => r.json()).then(d => {
      if (d.stories?.length) { setRecentAiStories(d.stories); setRecentStoriesLoaded(true); }
    }).catch(() => {});
  }, []);

  // Live SSC events + fusion discoveries (poll every 15s)
  useEffect(() => {
    const fetchIntel = () => {
      fetch("/api/intel/discoveries").then(r => r.json()).then(d => {
        if (d.events?.length) setSscEvents(d.events);
        if (d.fusions?.length) setFusionDiscoveries(d.fusions);
      }).catch(() => {});
    };
    fetchIntel();
    const id = setInterval(fetchIntel, 15000);
    return () => clearInterval(id);
  }, []);

  // Auto-rotate SSC event banner every 5 seconds
  useEffect(() => {
    if (!sscEvents.length) return;
    const id = setInterval(() => setSscEventIdx(i => (i + 1) % Math.min(sscEvents.length, 8)), 5000);
    return () => clearInterval(id);
  }, [sscEvents.length]);

  // Load publications when tab is selected
  useEffect(() => {
    if (feedMode === "publications" && publications.length === 0) {
      setPubLoading(true);
      fetch("/api/publications?limit=48").then(r => r.json()).then(d => {
        setPublications(d.publications || []);
        setPubTotal(d.total || 0);
      }).catch(() => {}).finally(() => setPubLoading(false));
    }
  }, [feedMode]);

  // Auto-load top stories on mount
  useEffect(() => { loadFeed(); }, []);

  const activeDomain = OMEGA_SPINE.find(d => d.key === activeDomainKey) || null;
  const activeCategory = activeDomain?.children?.find(c => c.key === activeCatKey) || null;
  const activeSubCategory = activeCategory?.children?.find(c => c.key === activeSubKey) || null;

  const currentSearchTerm = useMemo(() => {
    if (searchQuery) return searchQuery;
    if (activeSubCategory) return activeSubCategory.search;
    if (activeCategory) return activeCategory.search;
    if (activeDomain) return activeDomain.search;
    return "";
  }, [searchQuery, activeSubCategory, activeCategory, activeDomain]);

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
      const safeArticles = Array.isArray(data.articles) ? data.articles : [];
      setArticles(prev => {
        if (reset || p === 1) return safeArticles;
        const ids = new Set(prev.map(a => a.id));
        return [...prev, ...safeArticles.filter(a => !ids.has(a.id))];
      });
      setHasMore(data.hasMore ?? false);
      setTotal(data.total ?? safeArticles.length);
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
    setActiveSubKey(null);
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
    setActiveSubKey(null);
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

  const selectSubCategory = useCallback((subKey: string) => {
    setActiveSubKey(subKey);
    setArticles([]);
    setPage(1);
    setHasMore(true);
    setExpandedId(null);
    setSearchQuery("");
    setSearchInput("");
    const d = activeDomain;
    const cat = activeCategory;
    const sub = cat?.children?.find(c => c.key === subKey);
    if (sub) {
      setFeedLoaded(true);
      setLoading(true);
      loadingRef.current = false;
      fetchPage(1, true, sub.search);
    }
  }, [fetchPage, activeDomain, activeCategory]);

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
    setActiveDomainKey(null); setActiveCatKey(null); setActiveSubKey(null);
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

          {/* SSC Breaking News Banner */}
          {sscEvents.length > 0 && feedMode !== "ssc" && (
            <div
              className="mb-2.5 px-3 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all hover:brightness-110 overflow-hidden"
              style={{ background: sscEvents[sscEventIdx]?.severity === "critical" ? "linear-gradient(90deg,#7f1d1d,#991b1b)" : sscEvents[sscEventIdx]?.severity === "high" ? "linear-gradient(90deg,#1e3a5f,#1d4ed8)" : "linear-gradient(90deg,#14532d,#15803d)" }}
              onClick={() => setFeedMode("ssc" as any)}
              data-testid="banner-ssc-events"
            >
              <span className="text-white/70 text-[9px] font-black uppercase tracking-widest shrink-0 animate-pulse">⚡ LIVE SSC</span>
              <div className="w-px h-3 bg-white/20 shrink-0" />
              <p className="text-white text-[10px] font-bold truncate flex-1">{sscEvents[sscEventIdx]?.headline || ""}</p>
              <span className="text-white/40 text-[9px] shrink-0">View All →</span>
            </div>
          )}

          {/* Feed Mode Tabs */}
          <div className="flex gap-1 mb-2.5 bg-muted/20 p-0.5 rounded-xl overflow-x-auto" data-testid="feed-mode-tabs">
            {([
              { id: "all", label: "All", emoji: "🔥" },
              { id: "news", label: "News", emoji: "📰" },
              { id: "publications", label: "Agent Pubs", emoji: "⬡", count: pubTotal || undefined },
              { id: "videos", label: "Videos", emoji: "🎥" },
              { id: "ssc", label: "SSC Events", emoji: "⬡", count: sscEvents.length || undefined },
              { id: "saved", label: "Saved", emoji: "🔖", count: savedArticleIds.size },
              { id: "following", label: "Following", emoji: "👁", count: followedTopicsList.length },
            ] as const).map(m => (
              <button key={m.id} onClick={() => { setFeedMode(m.id); setActiveDomainKey(null); setActiveCatKey(null); setActiveSubKey(null); setSearchQuery(""); setSearchInput(""); setExpandedId(null); setFractalGenerated(null); if (m.id !== "saved" && m.id !== "following" && m.id !== "publications") { setFeedLoaded(false); } }} data-testid={`feed-mode-${m.id}`}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${feedMode === m.id ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <span>{m.emoji}</span>
                <span className="hidden sm:inline">{m.label}</span>
                {"count" in m && (m.count ?? 0) > 0 && <span className="ml-0.5 bg-orange-500 text-white text-[8px] rounded-full px-1 min-w-[14px] text-center leading-[14px]">{m.count}</span>}
              </button>
            ))}
          </div>


          {/* ── GICS Domain Pill Row (always visible, no search/domain active) ── */}
          {!activeDomainKey && !searchQuery && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 mt-1" data-testid="domain-pill-row">
              {OMEGA_SPINE.map(d => (
                <button key={d.key} onClick={() => selectDomain(d.key)} data-testid={`domain-pill-${d.key}`}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap shrink-0 transition-all hover:-translate-y-px hover:shadow-sm border border-transparent"
                  style={{ background: `${d.color}18`, color: d.color, borderColor: `${d.color}30` }}>
                  <span className="text-[11px]">{d.emoji}</span>
                  <span>{d.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Level 2: Category sub-tabs (domain selected) ── */}
          {activeDomain && !searchQuery && activeDomain.children.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 mt-1.5">
              <button onClick={() => { setActiveCatKey(null); setActiveSubKey(null); setArticles([]); setPage(1); setHasMore(true); loadingRef.current = false; fetchPage(1, true, activeDomain.search); }} data-testid="feed-cat-all"
                className={`px-3 py-1 text-[10px] font-semibold rounded-full whitespace-nowrap transition-all shrink-0 border ${!activeCatKey ? "text-white border-transparent shadow-sm" : "bg-white/80 border-border/30 text-muted-foreground hover:border-orange-200"}`}
                style={!activeCatKey ? { background: `linear-gradient(135deg, ${activeDomain.color}, ${activeDomain.color}cc)` } : {}}>
                All {activeDomain.label}
              </button>
              {activeDomain.children.map(cat => (
                <button key={cat.key} onClick={() => selectCategory(activeDomain.key, cat.key)} data-testid={`feed-cat-${cat.key}`}
                  className={`px-3 py-1 text-[10px] font-semibold rounded-full whitespace-nowrap transition-all shrink-0 border ${activeCatKey === cat.key ? "text-white border-transparent shadow-sm" : "bg-white/80 border-border/30 text-muted-foreground hover:border-orange-200"}`}
                  style={activeCatKey === cat.key ? { background: `linear-gradient(135deg, ${activeDomain.color}, ${activeDomain.color}cc)` } : {}}>
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Level 3: Sub-category tabs (category selected with children) ── */}
          {activeCategory && (activeCategory as any).children?.length > 0 && !searchQuery && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 mt-1" data-testid="feed-sub-tabs">
              <button onClick={() => { setActiveSubKey(null); setArticles([]); setPage(1); setHasMore(true); loadingRef.current = false; fetchPage(1, true, activeCategory.search); }} data-testid="feed-sub-all"
                className={`px-2.5 py-0.5 text-[9px] font-semibold rounded-full whitespace-nowrap transition-all shrink-0 border ${!activeSubKey ? "text-white border-transparent" : "bg-muted/20 border-border/20 text-muted-foreground/70 hover:bg-muted/40"}`}
                style={!activeSubKey ? { background: activeDomain ? `${activeDomain.color}dd` : "#f97316" } : {}}>
                All {activeCategory.label}
              </button>
              {((activeCategory as any).children as {key:string;label:string;search:string}[]).map(sub => (
                <button key={sub.key} onClick={() => selectSubCategory(sub.key)} data-testid={`feed-sub-${sub.key}`}
                  className={`px-2.5 py-0.5 text-[9px] font-semibold rounded-full whitespace-nowrap transition-all shrink-0 border ${activeSubKey === sub.key ? "text-white border-transparent" : "bg-muted/20 border-border/20 text-muted-foreground/70 hover:bg-muted/40"}`}
                  style={activeSubKey === sub.key ? { background: activeDomain ? `${activeDomain.color}dd` : "#f97316" } : {}}>
                  {sub.label}
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
                        <div key={story.articleId} className="bg-white dark:bg-zinc-900 border border-border/20 rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => { const sp = story.slug || story.articleId; const a: FeedArticle = { id: story.articleId, slug: story.slug || "", title: story.seoTitle || story.title, description: story.summary || "", link: `/story/${sp}`, image: story.heroImage || "", source: story.sourceName || "Quantum Pulse Intelligence", pubDate: story.createdAt, category: story.category, type: "article", videoUrl: "", sourceColor: "#f97316" }; sessionStorage.setItem(`article_${sp}`, JSON.stringify(a)); sessionStorage.setItem(`article_${story.articleId}`, JSON.stringify(a)); window.location.href = `/story/${sp}`; }} data-testid={`following-story-${story.articleId}`}>
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

        {/* ── SSC CIVILIZATION EVENTS VIEW ── */}
        {(feedMode as string) === "ssc" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base animate-pulse">⬡</span>
              <h2 className="text-sm font-bold">Sovereign Synthetic Civilization — Live Events</h2>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 font-bold animate-pulse">LIVE</span>
            </div>
            <p className="text-[10px] text-muted-foreground/50 -mt-2">Real-time events from the living civilization. No news outlet has this.</p>

            {/* Hive Fusion Discoveries */}
            {fusionDiscoveries.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold text-purple-500">🧬 Cross-Source Fusions</span><div className="flex-1 h-px bg-border/30"/></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fusionDiscoveries.slice(0, 4).map((f: any) => (
                    <div key={f.id} className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5" data-testid={`fusion-${f.id}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold">{f.sources?.length || 2} sources</span>
                        <span className="text-[9px] text-muted-foreground/40">{Math.round((f.confidence || 0.8) * 100)}% confidence</span>
                      </div>
                      <div className="text-xs font-bold text-foreground capitalize">{f.topic}</div>
                      <p className="text-[9px] text-muted-foreground/60 mt-1 leading-relaxed line-clamp-2">{f.narrative}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live SSC Events Stream */}
            <div>
              <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold text-orange-500">⚡ Civilization Events Stream</span><div className="flex-1 h-px bg-border/30"/><span className="text-[9px] text-muted-foreground/40">{sscEvents.length} events</span></div>
              <div className="space-y-2">
                {sscEvents.map((ev: any, i: number) => (
                  <div key={ev.id} className={`p-3 rounded-xl border transition-all ${ev.severity === "critical" ? "border-red-500/30 bg-red-500/5" : ev.severity === "high" ? "border-blue-500/20 bg-blue-500/5" : "border-border/20 bg-muted/10"}`} data-testid={`ssc-event-${i}`}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${ev.severity === "critical" ? "bg-red-500/20 text-red-400" : ev.severity === "high" ? "bg-blue-500/20 text-blue-400" : ev.severity === "medium" ? "bg-yellow-500/20 text-yellow-500" : "bg-green-500/20 text-green-400"}`}>{ev.severity}</span>
                          <span className="text-[8px] text-muted-foreground/30">{ev.type?.toUpperCase()}</span>
                        </div>
                        <div className="text-xs font-bold leading-snug">{ev.headline}</div>
                        <p className="text-[10px] text-muted-foreground/60 mt-1 leading-relaxed">{ev.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {sscEvents.length === 0 && (
                <div className="text-center py-10">
                  <div className="text-4xl mb-2 animate-pulse">⬡</div>
                  <p className="text-sm text-muted-foreground/50">Hive Intelligence Engine is initializing...</p>
                  <p className="text-xs text-muted-foreground/30 mt-1">Events will appear within 30 seconds</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AGENT PUBLICATIONS VIEW ── */}
        {feedMode === "publications" && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">⬡</span>
              <h2 className="text-sm font-bold">Agent Publications</h2>
              {pubTotal > 0 && <span className="text-xs text-muted-foreground/50">{pubTotal.toLocaleString()} total</span>}
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-bold animate-pulse">LIVE</span>
            </div>
            {pubLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-36 rounded-2xl bg-muted/30 animate-pulse" />)}
              </div>
            ) : publications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-4 opacity-30">⬡</span>
                <p className="text-sm font-semibold text-muted-foreground/60 mb-1">No publications yet</p>
                <p className="text-xs text-muted-foreground/40">Agent publications will appear here as they're authored</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {publications.map(p => (
                  <a key={p.id} href={`/publication/${p.slug}`} className="group block bg-white dark:bg-zinc-900 border border-border/20 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all" data-testid={`pub-card-${p.id}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{p.corpEmoji || "⬡"}</span>
                      <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider truncate">{(p.pub_type || "PUBLICATION").replace(/_/g, " ")}</span>
                    </div>
                    <h3 className="text-sm font-bold leading-snug mb-1.5 line-clamp-2 group-hover:text-orange-500 transition-colors">{p.title}</h3>
                    {p.summary && <p className="text-xs text-muted-foreground/60 line-clamp-2 mb-3">{p.summary}</p>}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/20 text-[10px] text-muted-foreground/40">
                      <span className="truncate">{p.corpName || p.spawn_id || "AI Agent"}</span>
                      {p.views > 0 && <><span>·</span><span>{p.views} views</span></>}
                      <span className="ml-auto">Read →</span>
                    </div>
                  </a>
                ))}
              </div>
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
                    <button onClick={() => { const s = fractalGenerated.story; const sp = s.slug || s.articleId; const a = { id: s.articleId, slug: s.slug || "", title: s.seoTitle || s.title, description: s.summary || "", link: `/story/${sp}`, image: s.heroImage || "", source: "Quantum Pulse Intelligence", pubDate: s.createdAt, category: s.category, type: "article", videoUrl: "", sourceColor: "#f97316" }; sessionStorage.setItem(`article_${sp}`, JSON.stringify(a)); sessionStorage.setItem(`article_${s.articleId}`, JSON.stringify(a)); window.location.href = `/story/${sp}`; }}
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

            {/* Hero top story */}
            {articles[0] && !activeDomainKey && !searchQuery && (() => {
              const hero = articles[0];
              return (
                <div className="mb-5 rounded-2xl overflow-hidden border border-border/20 shadow-md hover:shadow-lg transition-all cursor-pointer group" data-testid={`hero-card-${hero.id}`}
                  onClick={() => { const sp = hero.slug || hero.id; sessionStorage.setItem(`article_${sp}`, JSON.stringify(hero)); window.location.href = hero.link || `/story/${sp}`; }}>
                  {hero.image ? (
                    <img src={hero.image} alt={hero.title} className="w-full h-56 sm:h-72 object-cover" onError={e => { (e.target as any).style.display = "none"; }} />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white/30 text-6xl">📰</span>
                    </div>
                  )}
                  <div className="p-4 bg-white dark:bg-zinc-900">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{hero.category || "Top Story"}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <span className="text-[10px] text-muted-foreground/50">{timeAgo(hero.pubDate)}</span>
                      <span className="ml-auto flex items-center gap-1 text-[9px] text-emerald-500 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />LIVE</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black leading-snug mb-2 group-hover:text-orange-500 transition-colors">{hero.title}</h2>
                    {hero.description && <p className="text-sm text-muted-foreground/70 line-clamp-2">{hero.description}</p>}
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {(articles[0] && !activeDomainKey && !searchQuery ? articles.slice(1) : articles).map(article => (
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



// ─── HIVE PULSE BEAT — cross-page data-flow indicator ──────────────────────
// Appears at the very bottom of every Layout page as a thin status bar.
// Polls live hive engine status + open anomaly count to show the data pipeline.
function HivePulseBeat() {
  const { data: hiveStatus } = useQuery<any>({ queryKey: ["/api/hive/status"], refetchInterval: 30_000, staleTime: 20_000 });
  const { data: anomalies = [] } = useQuery<any[]>({ queryKey: ["/api/anomaly-feed"], refetchInterval: 60_000, staleTime: 50_000 });
  const [location] = useLocation();
  const openAnomalies = Array.isArray(anomalies) ? anomalies.filter((a: any) => a.status === "OPEN").length : 0;
  const engineCount  = hiveStatus?.engines_active ?? hiveStatus?.active_engines ?? 0;
  const spawnCount   = hiveStatus?.total_spawns ?? hiveStatus?.spawns ?? 0;
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(p => 1 - p), 1200); return () => clearInterval(t); }, []);

  return (
    <div className="shrink-0 border-t flex items-center gap-3 overflow-x-auto px-3"
      style={{ height: 22, background: "rgba(0,0,0,0.6)", borderColor: "rgba(0,255,209,0.08)", fontSize: 9, color: "rgba(255,255,255,0.3)", backdropFilter: "blur(4px)" }}>
      {/* Pulse dot */}
      <div className="shrink-0 flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: tick ? "#00FFD1" : "#00aa8d", boxShadow: tick ? "0 0 4px #00FFD1" : "none", transition: "all 0.5s" }} />
        <span style={{ color: "#00FFD1", fontWeight: 700 }}>PULSE ACTIVE</span>
      </div>
      <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
      {/* Engine count */}
      <span>⚙ <span style={{ color: "#60a5fa" }}>{engineCount || "..."}</span> engines</span>
      <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
      {/* Spawns */}
      {spawnCount > 0 && <>
        <span>👁 <span style={{ color: "#a78bfa" }}>{spawnCount.toLocaleString()}</span> agents</span>
        <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
      </>}
      {/* Page route */}
      <span>📡 <span style={{ color: "#94a3b8" }}>{location}</span></span>
      <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
      {/* Anomalies */}
      {openAnomalies > 0
        ? <a href="/invocation-lab" style={{ color: "#ef4444", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
            ⚠ {openAnomalies} open anomal{openAnomalies === 1 ? "y" : "ies"} → Invocation Lab
          </a>
        : <span style={{ color: "#4ade80" }}>✓ substrate stable</span>
      }
      <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
      {/* Feed direction label */}
      <span className="shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>
        internet → hive-engines → pulse → AI-agents → auriona ↺
      </span>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const { settings: layoutSettings } = useAppSettings();
  useEffect(() => { const c = () => setIsOpen(window.innerWidth >= 768); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);
  return (
    <div className={`flex h-[100dvh] w-full bg-background overflow-hidden ${layoutSettings.sidebarPosition === "right" ? "flex-row-reverse" : ""}`}>
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="flex-1 flex flex-col relative min-w-0 h-full overflow-hidden">
        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
        <HivePulseBeat />
      </div>
    </div>
  );
}

function HomePage() {
  useEffect(() => { updateSEO({ title: "My Ai Gpt - AI Chat Assistant That Learns You | by Quantum Logic Network", description: "Chat with My Ai Gpt, your AI best friend that learns your interests. Ask anything, get personalized answers. Free AI chat powered by Quantum Pulse Intelligence. By Quantum Logic Network.", ogTitle: "My Ai Gpt - AI Chat Assistant | Quantum Logic Network", ogDesc: "Your AI best friend that learns you. Chat about anything. Free, personalized, intelligent.", ogType: "website", canonical: window.location.origin + "/", keywords: "AI chat, AI assistant, chatbot, Quantum Logic Network, My Ai Gpt, free AI, personalized AI, Quantum Pulse Intelligence, GPT chat, AI companion, smart assistant", author: "Quantum Logic Network", articleSection: "Artificial Intelligence", jsonLd: { "@context": "https://schema.org", "@type": "WebPage", "name": "My Ai Gpt - AI Chat", "description": "AI Chat Assistant that learns your interests", "url": window.location.origin + "/", "isPartOf": { "@type": "WebApplication", "name": "My Ai Gpt" }, "author": { "@type": "Person", "name": "Quantum Logic Network" }, "breadcrumb": { "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Home", "item": window.location.origin + "/" }] } } }); }, []);
  return <Layout><ChatInterface defaultType="general" /></Layout>;
}
// ─── QUANTUM FORGE IDE ─ Fused AI Coder + Playground · Surpasses Replit ──────
function QuantumForgeIDE() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitPos, setSplitPos] = useState(38);
  const [isDragging, setIsDragging] = useState(false);
  const [forgeView, setForgeView] = useState<"split"|"chat"|"editor">("split");

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const onMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newPos = Math.max(22, Math.min(72, ((ev.clientX - rect.left) / rect.width) * 100));
      setSplitPos(newPos);
    };
    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [splitPos]);

  return (
    <div data-testid="quantum-forge-ide" className="flex flex-col h-full overflow-hidden">
      {/* ── Top forge bar ── */}
      <div className="flex items-center gap-2 px-3 py-1 border-b border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-emerald-950/40 shrink-0">
        <span className="text-[11px] font-black tracking-wider bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">⚡ QUANTUM FORGE IDE</span>
        <span className="text-[8px] text-slate-500 font-mono hidden sm:inline">AI × 26 languages × run × terminal × packages · surpasses replit · 100% free</span>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
          <button onClick={() => setForgeView("chat")} className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${forgeView === "chat" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"}`} title="AI Chat only">🤖 Chat</button>
          <button onClick={() => setForgeView("split")} className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${forgeView === "split" ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white" : "text-slate-400 hover:text-white"}`} title="Split view">⚡ Split</button>
          <button onClick={() => setForgeView("editor")} className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${forgeView === "editor" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"}`} title="Editor only">💻 Editor</button>
        </div>
        <div className="text-[8px] text-blue-500/40 font-mono hidden md:block">← drag divider to resize →</div>
      </div>

      {/* ── Main split pane ── */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden min-h-0" style={{ cursor: isDragging ? "col-resize" : "default" }}>
        {/* Left: AI Chat */}
        {forgeView !== "editor" && (
          <div style={{ width: forgeView === "chat" ? "100%" : `${splitPos}%` }} className="flex flex-col min-w-0 overflow-hidden border-r border-blue-500/20">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-950/30 border-b border-blue-500/15 shrink-0">
              <span className="text-[9px] font-black text-blue-400 tracking-wider">🤖 AI CODING ASSISTANT</span>
              <span className="text-[8px] text-blue-600/50 font-mono hidden lg:inline">∞ context · auto-inject code → editor · forge:ask wired</span>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <ChatInterface defaultType="coder" />
            </div>
          </div>
        )}

        {/* Drag divider */}
        {forgeView === "split" && (
          <div
            onMouseDown={handleDragStart}
            className="w-1.5 bg-blue-500/10 hover:bg-blue-400/40 cursor-col-resize flex-shrink-0 transition-colors relative group flex items-center justify-center"
            title="Drag to resize"
          >
            <div className="w-0.5 h-10 rounded-full bg-blue-500/30 group-hover:bg-blue-400/80 group-hover:h-16 transition-all" />
          </div>
        )}

        {/* Right: Code Editor (Playground) */}
        {forgeView !== "chat" && (
          <div style={{ width: forgeView === "editor" ? "100%" : `${100 - splitPos}%` }} className="flex flex-col min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-950/30 border-b border-emerald-500/15 shrink-0">
              <span className="text-[9px] font-black text-emerald-400 tracking-wider">💻 QUANTUM FORGE EDITOR</span>
              <span className="text-[8px] text-emerald-600/50 font-mono hidden lg:inline">26 langs · run · terminal · packages · AI-fix · performance profiler</span>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <CodePlayground />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CoderPage() {
  useEffect(() => { updateSEO({ title: "Quantum Forge IDE - AI Coder + Playground | Surpasses Replit | My Ai Gpt", description: "The most powerful free online IDE. AI coding assistant + 26-language playground in one split-pane workspace. Write longer, run faster, debug smarter. Surpasses Replit. By Quantum Logic Network.", ogTitle: "Quantum Forge IDE - Free AI Coding + Playground", ogDesc: "AI Coder fused with 26-language Playground. Free, unlimited, surpasses any IDE.", ogType: "website", canonical: window.location.origin + "/coder", keywords: "AI IDE, quantum forge, free online IDE, AI coding, code playground, surpasses replit, 26 languages, code execution, AI coder, programming", author: "Quantum Logic Network" }); }, []);
  return <Layout><QuantumForgeIDE /></Layout>;
}
function PlaygroundPage() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/coder"); }, [setLocation]);
  return null;
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
  const [activeSection, setActiveSection] = useState<string>("appearance");

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
    { id: "follows", name: "My Follows", icon: Bell },
  ];

  const ToggleSwitch = ({ on, onToggle, testId }: { on: boolean; onToggle: () => void; testId: string }) => (
    <div onClick={onToggle} data-testid={testId}
      className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${on ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"} relative`}>
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "left-[22px]" : "left-0.5"}`} />
    </div>
  );

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
                    { id: "/agents", label: "Agents" },
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
                <button
                  onClick={() => update({ language: "pulse" })}
                  data-testid="lang-pulse"
                  style={settings.language === "pulse" ? {
                    background: "linear-gradient(135deg, #F5C518 0%, #f0a500 50%, #F5C518 100%)",
                    border: "2px solid #F5C518",
                    color: "#1a0a00",
                    boxShadow: "0 0 18px rgba(245,197,24,0.55), 0 0 36px rgba(245,197,24,0.25)",
                  } : {
                    background: "linear-gradient(135deg, rgba(245,197,24,0.08) 0%, rgba(240,165,0,0.05) 100%)",
                    border: "1.5px solid rgba(245,197,24,0.45)",
                    color: "#c89a00",
                  }}
                  className="mt-2 w-full py-3 px-4 rounded-xl text-xs font-black tracking-wide transition-all flex items-center justify-center gap-2">
                  <span style={{ fontSize: 14, lineHeight: 1, textShadow: settings.language === "pulse" ? "0 0 8px #1a0a00" : "0 0 12px rgba(245,197,24,0.8)" }}>Ω</span>
                  PulseLang — Ai and Robots Only
                  {settings.language === "pulse" && <span className="ml-1 text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded-full" style={{ background: "rgba(26,10,0,0.2)", color: "#1a0a00" }}>ACTIVE</span>}
                </button>
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

        {activeSection === "follows" && (
          <div className="space-y-4" data-testid="settings-section-follows">
            <div className="bg-white dark:bg-gray-900 border border-border/30 rounded-xl p-5">
              <h3 className="text-sm font-bold mb-1 flex items-center gap-2"><Bell size={15} /> My Follows</h3>
              <p className="text-xs text-muted-foreground mb-4">AI agents, families, and publications you are following. Click Follow on any agent card, publication, or council member to add them here.</p>
              <FollowsPanel />
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
  useEffect(() => { updateSEO({ title: "Settings - My Ai Gpt | Customize Your Experience", description: "Customize your My Ai Gpt experience: choose your theme, AI personality, language, response style, and manage your followed agents. By Quantum Logic Network.", ogTitle: "Settings - My Ai Gpt", canonical: window.location.origin + "/settings" }); }, []);
  return <Layout><SettingsPage /></Layout>;
}




// ─── GAMES PAGE ──────────────────────────────────────────────────────────────
type GameMode = "hub" | "blackjack" | "memory" | "rps" | "snake" | "surge" | "scramble" | "trivia" | "creator" | "emulator" | "pixelart" | "retrotools" | "rompatch" | "spritetools" | "opengames" | "gamelibrary" | "puzzle2048" | "pong" | "minesweeper" | "simon" | "tictactoe" | "connect4" | "flappy" | "hangman" | "wordle" | "spaceinvaders";

/* ===== EMULATOR ZONE ===== */
const EJS_CONSOLES=[
  {id:'nes',label:'NES',emoji:'🎮',core:'nes',ext:'.nes',color:'from-red-700 to-red-900',desc:'8-bit classics'},
  {id:'snes',label:'SNES',emoji:'🕹️',core:'snes9x',ext:'.smc,.sfc',color:'from-purple-700 to-purple-900',desc:'16-bit golden era'},
  {id:'gb',label:'Game Boy',emoji:'⬛',core:'gb',ext:'.gb',color:'from-slate-600 to-slate-800',desc:'Portable OG'},
  {id:'gbc',label:'Game Boy Color',emoji:'🟢',core:'gbc',ext:'.gbc',color:'from-teal-700 to-teal-900',desc:'Color portable'},
  {id:'gba',label:'Game Boy Advance',emoji:'💠',core:'gba',ext:'.gba',color:'from-indigo-700 to-indigo-900',desc:'32-bit portable'},
  {id:'nds',label:'Nintendo DS',emoji:'📱',core:'nds',ext:'.nds',color:'from-sky-700 to-sky-900',desc:'Dual screen'},
  {id:'n64',label:'Nintendo 64',emoji:'🔵',core:'n64',ext:'.z64,.n64,.v64',color:'from-blue-700 to-blue-900',desc:'3D revolution'},
  {id:'psx',label:'PlayStation 1',emoji:'⬜',core:'psx',ext:'.bin,.cue,.iso',color:'from-gray-600 to-gray-900',desc:'PS1 classics'},
  {id:'sega',label:'Sega Genesis',emoji:'🔴',core:'segaMD',ext:'.md,.gen,.bin',color:'from-rose-700 to-rose-900',desc:'Blast processing'},
  {id:'atari',label:'Atari 2600',emoji:'🟤',core:'atari2600',ext:'.a26,.bin',color:'from-amber-700 to-amber-900',desc:'The original'},
  {id:'mame',label:'Arcade (MAME)',emoji:'🕹',core:'mame',ext:'.zip',color:'from-orange-700 to-orange-900',desc:'Arcade classics'},
  {id:'dos',label:'DOS / PC',emoji:'💻',core:'dosbox',ext:'.exe,.com,.bat',color:'from-lime-700 to-lime-900',desc:'PC retro'},
];
function EmulatorZone({onBack}:{onBack:()=>void}){
  const [console_,setConsole_]=useState<typeof EJS_CONSOLES[0]|null>(null);
  const [romUrl,setRomUrl]=useState<string|null>(null);
  const [romName,setRomName]=useState('');
  const [launched,setLaunched]=useState(false);
  const [shader,setShader]=useState<'none'|'crt'|'gb'>('none');
  const iframeRef=useRef<HTMLIFrameElement>(null);

  const handleRomUpload=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0];if(!f)return;
    const url=URL.createObjectURL(f);setRomUrl(url);setRomName(f.name);setLaunched(false);
  };
  const buildHtml=()=>{if(!console_||!romUrl)return '';
    return`<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#000;overflow:hidden;}#game{width:100vw;height:100vh;}${shader==='crt'?`canvas{filter:contrast(1.1) brightness(0.95);image-rendering:pixelated;}body::after{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.12) 2px,rgba(0,0,0,0.12) 4px);pointer-events:none;z-index:9999;}`:''}${shader==='gb'?`canvas{filter:sepia(0.8) hue-rotate(60deg) saturate(0.7) brightness(0.9);}`:''}</style></head><body><div id="game"></div><script>EJS_player='#game';EJS_gameName=${JSON.stringify(romName)};EJS_gameUrl=${JSON.stringify(romUrl)};EJS_core=${JSON.stringify(console_.core)};EJS_startOnLoaded=true;EJS_color='#8b5cf6';EJS_backgroundColor='#000000';EJS_pathtodata='https://cdn.emulatorjs.org/stable/data/';<\/script><script src="https://cdn.emulatorjs.org/stable/data/loader.js"><\/script></body></html>`;
  };
  const launch=()=>{
    setLaunched(true);
    setTimeout(()=>{
      if(iframeRef.current){const html=buildHtml();const blob=new Blob([html],{type:'text/html'});const url=URL.createObjectURL(blob);iframeRef.current.src=url;}
    },50);
  };
  return(
    <div className="flex-1 flex flex-col" style={{background:'linear-gradient(180deg,#040410 0%,#08081a 100%)'}}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8" style={{background:'rgba(8,8,20,0.98)'}}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs transition-colors"><ChevronLeft size={14}/>Back</button>
        <div className="w-px h-4 bg-white/10"/>
        <span className="text-sm font-black text-white">🕹️ Emulator Zone</span>
        <span className="text-[9px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/30 font-bold">EmulatorJS • Free & Open Source</span>
        {launched&&console_&&<div className="ml-auto flex gap-2">
          {(['none','crt','gb'] as const).map(s=><button key={s} onClick={()=>{setShader(s);setLaunched(false);setTimeout(()=>launch(),100);}} className={cn("text-[9px] px-2 py-0.5 rounded border transition-all",shader===s?"border-violet-400/50 bg-violet-400/15 text-violet-300":"border-white/10 text-white/30 hover:text-white/60")}>{s==='none'?'Normal':s==='crt'?'📺 CRT':'🟢 Game Boy'}</button>)}
        </div>}
      </div>
      {!launched?(
        <div className="flex-1 overflow-auto p-5">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="space-y-2">
              <div className="text-white font-black text-lg">Select a Console</div>
              <div className="text-white/30 text-xs">Choose a console, then upload your own ROM file. No ROMs are provided — bring your own legally obtained games.</div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {EJS_CONSOLES.map(c=><button key={c.id} onClick={()=>{setConsole_(c);setRomUrl(null);setRomName('');}} className={cn("flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all",console_?.id===c.id?`bg-gradient-to-br ${c.color} border-white/30 shadow-xl scale-105`:`bg-white/3 border-white/8 hover:border-white/20 hover:bg-white/5`)}>
                <span className="text-2xl">{c.emoji}</span>
                <div>
                  <div className="text-white font-bold text-[10px] leading-tight">{c.label}</div>
                  <div className="text-white/35 text-[8px]">{c.desc}</div>
                </div>
              </button>)}
            </div>
            {console_&&(
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.025] space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{console_.emoji}</span>
                  <div>
                    <div className="text-white font-black">{console_.label} Emulator</div>
                    <div className="text-white/30 text-xs">Accepted formats: {console_.ext}</div>
                  </div>
                </div>
                <label className={cn("flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all",romUrl?"border-green-500/50 bg-green-500/5":"border-white/15 hover:border-violet-500/40 hover:bg-violet-500/5")}>
                  <input type="file" accept={console_.ext} onChange={handleRomUpload} className="hidden"/>
                  {romUrl?<><div className="text-green-400 text-2xl">✓</div><div className="text-green-400 font-bold text-sm">{romName}</div><div className="text-green-400/60 text-xs">ROM loaded — ready to launch</div></>:<><div className="text-3xl">📁</div><div className="text-white/50 font-bold text-sm">Click to upload ROM</div><div className="text-white/25 text-xs">Your file never leaves your browser</div></>}
                </label>
                {romUrl&&(
                  <div className="space-y-3">
                    <div className="text-[9px] text-white/30 uppercase tracking-wider font-bold">Display Shader</div>
                    <div className="flex gap-2">
                      {(['none','crt','gb'] as const).map(s=><button key={s} onClick={()=>setShader(s)} className={cn("px-3 py-1.5 rounded-lg border text-xs font-bold transition-all",shader===s?"border-violet-400/50 bg-violet-400/15 text-violet-300":"border-white/10 text-white/30 hover:text-white/60")}>{s==='none'?'📺 Normal':s==='crt'?'📺 CRT Scanlines':'🟢 Game Boy'}</button>)}
                    </div>
                    <button onClick={launch} className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-black text-lg hover:from-violet-500 hover:to-pink-500 transition-all shadow-xl shadow-violet-500/20">
                      ▶ Launch {console_.label}
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="p-4 rounded-2xl border border-yellow-500/15 bg-yellow-500/5 text-[10px] text-yellow-400/60 space-y-1">
              <div className="font-bold text-yellow-400/80">⚖️ Legal Notice</div>
              <div>This emulator runs entirely in your browser using EmulatorJS (open source). No ROMs or BIOS files are provided. You must own the original game to use backup ROM files. Emulator use for your own cartridges is generally legal in most jurisdictions.</div>
            </div>
          </div>
        </div>
      ):(
        <div className="flex-1 flex flex-col">
          <iframe ref={iframeRef} className="flex-1 w-full border-0" allow="gamepad *; autoplay *; fullscreen *" title="Emulator"/>
        </div>
      )}
    </div>
  );
}

/* ===== PIXEL ART STUDIO ===== */
const PA_PALETTES:{name:string,colors:string[]}[]=[
  {name:'NES',colors:['#000000','#fcfcfc','#f8f8f8','#bcbcbc','#7c7c7c','#a4e4fc','#3cbcfc','#0078f8','#0000fc','#b8b8f8','#6888fc','#0058f8','#0000bc','#d8b8f8','#9878f8','#6844fc','#4428bc','#f8b8f8','#f878f8','#d800cc','#940084','#f8a4c0','#f85898','#e40058','#a80020','#f0d0b0','#f87858','#f83800','#a81000','#fce0a8','#fca044','#e45c10','#881400','#f8d878','#f8b800','#ac7c00','#503000','#d8f878','#b8f818','#00b800','#007800','#b8f8b8','#58d854','#00a800','#006800','#b8f8d8','#58f898','#00a844','#005800','#00fcfc','#00e8d8','#008888','#004058','#f8d8f8','#787878']},
  {name:'Game Boy',colors:['#0f380f','#306230','#8bac0f','#9bbc0f']},
  {name:'Game Boy Color',colors:['#000000','#808080','#c0c0c0','#ffffff','#ff0000','#800000','#00ff00','#008000','#0000ff','#000080','#ffff00','#808000','#00ffff','#008080','#ff00ff','#800080']},
  {name:'CGA',colors:['#000000','#0000aa','#00aa00','#00aaaa','#aa0000','#aa00aa','#aa5500','#aaaaaa','#555555','#5555ff','#55ff55','#55ffff','#ff5555','#ff55ff','#ffff55','#ffffff']},
  {name:'Pico-8',colors:['#000000','#1d2b53','#7e2553','#008751','#ab5236','#5f574f','#c2c3c7','#fff1e8','#ff004d','#ffa300','#ffec27','#00e436','#29adff','#83769c','#ff77a8','#ffccaa']},
  {name:'Pastel',colors:['#ffd1dc','#ffb3ba','#ff9aa2','#ffb7b2','#ffdac1','#e2f0cb','#b5ead7','#c7ceea','#9eb3d8','#b5b5ea','#dab3ea','#f9c6c9','#f3e0ec','#d4e6f1','#a8d8ea','#aa96da']},
];
function PixelArtStudio({onBack}:{onBack:()=>void}){
  const [gridSize,setGridSize]=useState(16);
  const [pal,setPal]=useState(0);
  const [color,setColor]=useState('#000000');
  const [tool,setTool]=useState<'draw'|'erase'|'fill'>('draw');
  const [pixels,setPixels]=useState<string[][]>(()=>Array(16).fill(null).map(()=>Array(16).fill('transparent')));
  const [undoStack,setUndoStack]=useState<string[][][]>([]);
  const [showGrid,setShowGrid]=useState(true);
  const [shader,setShader]=useState<'none'|'crt'|'gb'>('none');
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const [isDrawing,setIsDrawing]=useState(false);

  const resizeGrid=(sz:number)=>{
    setGridSize(sz);
    setPixels(Array(sz).fill(null).map(()=>Array(sz).fill('transparent')));
    setUndoStack([]);
  };

  const pushUndo=(p:string[][])=>setUndoStack(prev=>[...prev.slice(-19),JSON.parse(JSON.stringify(p))]);
  const undo=()=>{if(!undoStack.length)return;const prev=[...undoStack];const last=prev.pop()!;setUndoStack(prev);setPixels(last);};

  const fillFlood=(px:string[][],row:number,col:number,target:string,fill:string):string[][]=>{
    if(row<0||row>=gridSize||col<0||col>=gridSize)return px;
    if(px[row][col]!==target||px[row][col]===fill)return px;
    const np=px.map(r=>[...r]);np[row][col]=fill;
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc])=>fillFlood(np,row+dr,col+dc,target,fill));
    return np;
  };

  const handleCell=(row:number,col:number,px?:string[][])=>{
    const p=px||pixels;
    if(tool==='draw'){const np=p.map(r=>[...r]);np[row][col]=color;setPixels(np);}
    else if(tool==='erase'){const np=p.map(r=>[...r]);np[row][col]='transparent';setPixels(np);}
    else if(tool==='fill'){const target=p[row][col];const np=fillFlood(p.map(r=>[...r]),row,col,target,color);setPixels(np);}
  };

  const exportPng=()=>{
    const scale=8;const c=document.createElement('canvas');c.width=gridSize*scale;c.height=gridSize*scale;
    const ctx=c.getContext('2d')!;
    pixels.forEach((row,r)=>row.forEach((col,c2)=>{if(col!=='transparent'){ctx.fillStyle=col;ctx.fillRect(c2*scale,r*scale,scale,scale);}}));
    const a=document.createElement('a');a.download='pixel-art.png';a.href=c.toDataURL();a.click();
  };

  const cellSize=Math.min(Math.floor(360/gridSize),24);

  return(
    <div className="flex-1 flex flex-col" style={{background:'linear-gradient(180deg,#040410 0%,#08081a 100%)'}}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 flex-wrap" style={{background:'rgba(8,8,20,0.98)'}}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs transition-colors"><ChevronLeft size={14}/>Back</button>
        <div className="w-px h-4 bg-white/10"/>
        <span className="text-sm font-black text-white">🎨 Pixel Art Studio</span>
        <div className="flex gap-1 ml-auto">
          {(['draw','erase','fill'] as const).map(t=><button key={t} onClick={()=>setTool(t)} className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all",tool===t?"border-violet-400/50 bg-violet-400/15 text-violet-300":"border-white/10 text-white/30 hover:text-white/60")}>{t==='draw'?'✏️ Draw':t==='erase'?'⬜ Erase':'🪣 Fill'}</button>)}
          <button onClick={undo} disabled={!undoStack.length} className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-white/10 text-white/30 hover:text-white/60 disabled:opacity-30">↩ Undo</button>
          <button onClick={exportPng} className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">⬇ Export PNG</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-4">
          {/* Canvas */}
          <div className="flex flex-col items-center gap-3">
            <div className={cn("border border-white/15 rounded-xl overflow-hidden",shader==='crt'&&"[filter:contrast(1.1)_brightness(0.9)]",shader==='gb'&&"[filter:sepia(0.8)_hue-rotate(60deg)_saturate(0.7)]")}
              style={{display:'grid',gridTemplateColumns:`repeat(${gridSize},${cellSize}px)`,gap:showGrid?'1px':'0px',background:showGrid?'rgba(255,255,255,0.08)':'#000',padding:showGrid?'1px':'0px'}}>
              {pixels.map((row,ri)=>row.map((col,ci)=>(
                <div key={`${ri}-${ci}`} style={{width:cellSize,height:cellSize,background:col==='transparent'?`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Crect width='4' height='4' fill='%23888'/%3E%3Crect x='4' y='4' width='4' height='4' fill='%23888'/%3E%3Crect x='4' width='4' height='4' fill='%23555'/%3E%3Crect y='4' width='4' height='4' fill='%23555'/%3E%3C/svg%3E")`:col,cursor:'crosshair'}}
                  onMouseDown={()=>{setIsDrawing(true);pushUndo(pixels);handleCell(ri,ci);}}
                  onMouseEnter={()=>{if(isDrawing)handleCell(ri,ci);}}
                  onMouseUp={()=>setIsDrawing(false)}/>
              )))}
            </div>
            <div className="flex gap-2 text-xs">
              {[8,16,32,64].map(sz=><button key={sz} onClick={()=>resizeGrid(sz)} className={cn("px-2 py-0.5 rounded border text-[10px] font-bold",gridSize===sz?"border-violet-400/50 bg-violet-400/15 text-violet-300":"border-white/10 text-white/30")}>{sz}×{sz}</button>)}
              <button onClick={()=>setShowGrid(v=>!v)} className={cn("px-2 py-0.5 rounded border text-[10px] font-bold",showGrid?"border-white/20 text-white/50":"border-white/10 text-white/25")}>Grid</button>
              {(['none','crt','gb'] as const).map(s=><button key={s} onClick={()=>setShader(s)} className={cn("px-2 py-0.5 rounded border text-[10px] font-bold",shader===s?"border-violet-400/50 text-violet-300":"border-white/10 text-white/30")}>{s==='none'?'Normal':s==='crt'?'CRT':'GB'}</button>)}
            </div>
          </div>
          {/* Palette + Color */}
          <div className="space-y-4 min-w-[220px]">
            <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/8 space-y-3">
              <div className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Palette</div>
              <div className="flex flex-wrap gap-1">
                {PA_PALETTES.map((p,i)=><button key={p.name} onClick={()=>setPal(i)} className={cn("px-2 py-0.5 rounded border text-[9px] font-bold transition-all",pal===i?"border-violet-400/50 bg-violet-400/15 text-violet-300":"border-white/10 text-white/25 hover:text-white/60")}>{p.name}</button>)}
              </div>
              <div className="flex flex-wrap gap-1">
                {PA_PALETTES[pal].colors.map(c=><button key={c} onClick={()=>setColor(c)} style={{background:c,width:20,height:20,borderRadius:4,border:color===c?'2px solid white':'2px solid transparent'}}/>)}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[9px] text-white/30 uppercase tracking-wider font-bold">Custom</label>
                <input type="color" value={color.startsWith('#')?color:'#000000'} onChange={e=>setColor(e.target.value)} className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent"/>
                <span className="text-[10px] text-white/40 font-mono">{color}</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/8">
              <div className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-2">Quick Clear</div>
              <button onClick={()=>{pushUndo(pixels);setPixels(Array(gridSize).fill(null).map(()=>Array(gridSize).fill('transparent')));}} className="w-full py-1.5 rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 text-xs font-bold transition-all">Clear Canvas</button>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/8 text-[10px] text-white/30 space-y-1">
              <div className="font-bold text-white/50 text-xs mb-2">Tips</div>
              <div>✏️ Draw — click/drag to paint</div>
              <div>⬜ Erase — remove pixels</div>
              <div>🪣 Fill — flood fill area</div>
              <div>↩ Undo — restore last state</div>
              <div>⬇ Export — saves as PNG (8x scale)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== SOVEREIGN HUB OS — Auto-Ingestion Registry ===== */
type HubTool={id:string,name:string,cat:'emulator'|'tool'|'audio'|'game'|'ai'|'engine',emoji:string,desc:string,url:string,stars:number,lang:string,installed:boolean,instantMode?:string};
const SOVEREIGN_SEED:HubTool[]=[
  // EMULATORS — all pre-installed via EmulatorJS
  {id:'ejs-nes',name:'NES Emulator',cat:'emulator',emoji:'🎮',desc:'Nintendo 8-bit — upload your ROM, play instantly',url:'https://github.com/EmulatorJS/EmulatorJS',stars:7200,lang:'JavaScript',installed:true,instantMode:'emulator'},
  {id:'ejs-snes',name:'SNES Emulator',cat:'emulator',emoji:'🕹️',desc:'Super Nintendo 16-bit golden era',url:'https://github.com/EmulatorJS/EmulatorJS',stars:7200,lang:'JavaScript',installed:true,instantMode:'emulator'},
  {id:'ejs-gba',name:'GBA Emulator',cat:'emulator',emoji:'💠',desc:'Game Boy Advance 32-bit portable',url:'https://github.com/EmulatorJS/EmulatorJS',stars:7200,lang:'JavaScript',installed:true,instantMode:'emulator'},
  {id:'ejs-n64',name:'N64 Emulator',cat:'emulator',emoji:'🔵',desc:'Nintendo 64 — 3D revolution',url:'https://github.com/EmulatorJS/EmulatorJS',stars:7200,lang:'JavaScript',installed:true,instantMode:'emulator'},
  {id:'ejs-psx',name:'PS1 Emulator',cat:'emulator',emoji:'⬜',desc:'PlayStation 1 classics',url:'https://github.com/EmulatorJS/EmulatorJS',stars:7200,lang:'JavaScript',installed:true,instantMode:'emulator'},
  {id:'ejs-sega',name:'Sega Genesis',cat:'emulator',emoji:'🔴',desc:'Sega Mega Drive — blast processing',url:'https://github.com/EmulatorJS/EmulatorJS',stars:7200,lang:'JavaScript',installed:true,instantMode:'emulator'},
  {id:'ejs-dos',name:'DOS Emulator',cat:'emulator',emoji:'💻',desc:'DOSBox — classic PC gaming',url:'https://github.com/EmulatorJS/EmulatorJS',stars:7200,lang:'JavaScript',installed:true,instantMode:'emulator'},
  {id:'ejs-arcade',name:'Arcade (MAME)',cat:'emulator',emoji:'🕹',desc:'MAME arcade emulation',url:'https://github.com/EmulatorJS/EmulatorJS',stars:7200,lang:'JavaScript',installed:true,instantMode:'emulator'},
  {id:'ejs-gb',name:'Game Boy',cat:'emulator',emoji:'⬛',desc:'Original Game Boy — 4-color portable',url:'https://github.com/EmulatorJS/EmulatorJS',stars:7200,lang:'JavaScript',installed:true,instantMode:'emulator'},
  {id:'ejs-gbc',name:'Game Boy Color',cat:'emulator',emoji:'🟢',desc:'Game Boy Color portable',url:'https://github.com/EmulatorJS/EmulatorJS',stars:7200,lang:'JavaScript',installed:true,instantMode:'emulator'},
  {id:'ejs-nds',name:'Nintendo DS',cat:'emulator',emoji:'📱',desc:'Dual-screen portable gaming',url:'https://github.com/EmulatorJS/EmulatorJS',stars:7200,lang:'JavaScript',installed:true,instantMode:'emulator'},
  {id:'ejs-atari',name:'Atari 2600',cat:'emulator',emoji:'🟤',desc:'The original home console',url:'https://github.com/EmulatorJS/EmulatorJS',stars:7200,lang:'JavaScript',installed:true,instantMode:'emulator'},
  {id:'jsnes',name:'JSNES',cat:'emulator',emoji:'🟥',desc:'Pure JS NES emulator — open source',url:'https://github.com/bfirsh/jsnes',stars:5100,lang:'JavaScript',installed:false},
  {id:'mgba',name:'mGBA',cat:'emulator',emoji:'🟣',desc:'Accurate GBA emulator with WASM build',url:'https://github.com/mgba-emu/mgba',stars:11000,lang:'C',installed:false},
  {id:'duckstation',name:'DuckStation',cat:'emulator',emoji:'🦆',desc:'High-accuracy PS1 emulator',url:'https://github.com/stenzek/duckstation',stars:9000,lang:'C++',installed:false},
  // RETRO TOOLS — built into hub
  {id:'rompatch',name:'ROM Patcher',cat:'tool',emoji:'🔧',desc:'IPS/BPS/UPS patch format — apply fan translations & hacks',url:'https://github.com/Alcaro/Flips',stars:980,lang:'JavaScript',installed:true,instantMode:'rompatch'},
  {id:'pixelstudio',name:'Pixel Art Studio',cat:'tool',emoji:'🎨',desc:'NES/SNES/GB palettes, flood fill, undo, PNG export',url:'https://github.com/nicoptere/pixel-art-tool',stars:500,lang:'JavaScript',installed:true,instantMode:'pixelart'},
  {id:'spriteslicer',name:'Sprite Sheet Slicer',cat:'tool',emoji:'✂️',desc:'Extract individual sprites from any sprite sheet image',url:'https://github.com/nicoptere/SpriteSheet',stars:400,lang:'JavaScript',installed:true,instantMode:'spritetools'},
  {id:'tiled',name:'Tiled Map Editor',cat:'tool',emoji:'🗺️',desc:'Flexible tile map editor for game levels',url:'https://github.com/mapeditor/tiled',stars:11000,lang:'C++',installed:false},
  {id:'libresprite',name:'LibreSprite',cat:'tool',emoji:'🖼️',desc:'Free sprite editor — Aseprite open-source fork',url:'https://github.com/LibreSprite/LibreSprite',stars:2300,lang:'C++',installed:false},
  {id:'superflips',name:'Floating IPS (Flips)',cat:'tool',emoji:'🔩',desc:'IPS/BPS ROM patcher for fan hacks',url:'https://github.com/Alcaro/Flips',stars:980,lang:'C',installed:false},
  {id:'vgmtools',name:'VGMTools',cat:'tool',emoji:'🎵',desc:'Extract & convert video game music from ROMs',url:'https://github.com/vgmrips/vgmtools',stars:300,lang:'C',installed:false},
  // AUDIO
  {id:'chiptune2js',name:'Chiptune2.js',cat:'audio',emoji:'🎵',desc:'Play .mod .xm .s3m .it chiptune files in browser',url:'https://github.com/deskjet/chiptune2.js',stars:740,lang:'JavaScript',installed:false},
  {id:'jsfxr',name:'jsfxr',cat:'audio',emoji:'🔊',desc:'Retro sound effect generator — bleeps, booms, blips',url:'https://github.com/chr15m/jsfxr',stars:1400,lang:'JavaScript',installed:false},
  {id:'tonejs',name:'Tone.js',cat:'audio',emoji:'🎼',desc:'Web Audio framework for synthesis and music',url:'https://github.com/Tonejs/Tone.js',stars:24000,lang:'TypeScript',installed:false},
  {id:'soundbox',name:'SoundBox',cat:'audio',emoji:'📦',desc:'Tiny music tracker/synthesizer in JavaScript',url:'https://github.com/mbitsnbites/soundbox',stars:500,lang:'JavaScript',installed:false},
  {id:'tic80audio',name:'TIC-80 Audio Engine',cat:'audio',emoji:'🖥️',desc:'Fantasy computer with built-in tracker/synth',url:'https://github.com/nesbox/TIC-80',stars:5400,lang:'C',installed:false},
  // GAMES — pre-installed mini-games
  {id:'opengames',name:'Open Games Zone',cat:'game',emoji:'🌐',desc:'Curated open-source WASM/HTML5 games — no download required',url:'/games',stars:0,lang:'Various',installed:true,instantMode:'opengames'},
  {id:'snake-game',name:'Pulse Snake',cat:'game',emoji:'🐍',desc:'AI-powered snake — compete against AI pathfinding',url:'/games',stars:0,lang:'TypeScript',installed:true,instantMode:'snake'},
  {id:'blackjack-game',name:'Blackjack vs AI',cat:'game',emoji:'♠️',desc:'Beat the AI dealer to 21 — full chip economy',url:'/games',stars:0,lang:'TypeScript',installed:true,instantMode:'blackjack'},
  {id:'trivia-game',name:'Omega Trivia',cat:'game',emoji:'🧠',desc:'AI-generated trivia across all topics',url:'/games',stars:0,lang:'TypeScript',installed:true,instantMode:'trivia'},
  {id:'creator-game',name:'AI Game Creator',cat:'game',emoji:'⚡',desc:'Describe any game → AI generates it in seconds',url:'/games',stars:0,lang:'TypeScript',installed:true,instantMode:'creator'},
  {id:'phaser',name:'Phaser.js',cat:'game',emoji:'🎮',desc:'HTML5 game framework — 36k+ stars, used by millions',url:'https://github.com/phaserjs/phaser',stars:36000,lang:'JavaScript',installed:false},
  {id:'godot',name:'Godot Engine',cat:'engine',emoji:'🌀',desc:'Full open-source game engine — 2D/3D, GDScript/C#',url:'https://github.com/godotengine/godot',stars:91000,lang:'C++',installed:false},
  // AI TOOLS
  {id:'groq-ai',name:'Groq AI (Active)',cat:'ai',emoji:'⚡',desc:'Llama 3.1 8B — live AI in chat, music, game generation',url:'/',stars:0,lang:'TypeScript',installed:true,instantMode:'chat'},
  {id:'llamacpp',name:'llama.cpp',cat:'ai',emoji:'🦙',desc:'Local LLM inference — GGUF models, CPU-only, no API',url:'https://github.com/ggerganov/llama.cpp',stars:69000,lang:'C++',installed:false},
  {id:'transformersjs',name:'Transformers.js',cat:'ai',emoji:'🤗',desc:'Run ML models (BERT, Whisper, etc.) directly in browser',url:'https://github.com/xenova/transformers.js',stars:12000,lang:'JavaScript',installed:false},
  {id:'whispercpp',name:'Whisper.cpp',cat:'ai',emoji:'🎙️',desc:'Speech-to-text — OpenAI Whisper in C++/WASM',url:'https://github.com/ggerganov/whisper.cpp',stars:36000,lang:'C++',installed:false},
  {id:'onnxweb',name:'ONNX Runtime Web',cat:'ai',emoji:'🧮',desc:'Run any ONNX ML model in the browser via WebAssembly',url:'https://github.com/microsoft/onnxruntime',stars:14000,lang:'TypeScript',installed:false},
  // ENGINES
  {id:'love2d',name:'LÖVE 2D',cat:'engine',emoji:'❤️',desc:'Lua-based 2D game engine — portable and fun',url:'https://github.com/love2d/love',stars:4700,lang:'C++',installed:false},
  {id:'tic80',name:'TIC-80',cat:'engine',emoji:'🖥️',desc:'Fantasy computer — code, sprites, maps, sound in one app',url:'https://github.com/nesbox/TIC-80',stars:5400,lang:'C',installed:false},
  {id:'babylonjs',name:'Babylon.js',cat:'engine',emoji:'🎮',desc:'3D web game engine — WebGL/WebGPU',url:'https://github.com/BabylonJS/Babylon.js',stars:23000,lang:'TypeScript',installed:false},
];
const HUB_CATS=['all','emulator','tool','audio','game','ai','engine'] as const;
type HubCat=typeof HUB_CATS[number];
const CAT_LABELS:Record<HubCat,string>={all:'⭐ All',emulator:'🎮 Emulators',tool:'🔧 Tools',audio:'🎵 Audio',game:'🕹 Games',ai:'🤖 AI',engine:'⚙️ Engines'};

function RetroToolsHub({onBack,setGameMode}:{onBack:()=>void,setGameMode:(m:GameMode)=>void}){
  const [cat,setCat]=useState<HubCat>('all');
  const [view,setView]=useState<'registry'|'search'>('registry');
  const [ghQuery,setGhQuery]=useState('');
  const [ghResults,setGhResults]=useState<any[]>([]);
  const [ghLoading,setGhLoading]=useState(false);
  const [lastUpdated,setLastUpdated]=useState<string|null>(null);
  const [updating,setUpdating]=useState(false);
  const {toast}=useToast();

  useEffect(()=>{
    const cached=localStorage.getItem('hub_gh_cache');
    const ts=localStorage.getItem('hub_gh_ts');
    if(cached){try{const items=JSON.parse(cached);if(items.length)setGhResults(items);}catch{}}
    if(ts)setLastUpdated(ts);
    const age=ts?Date.now()-parseInt(ts):Infinity;
    if(age>3600000)autoScan();
  },[]);

  const autoScan=async()=>{
    try{
      const qs=['emulator browser wasm','retro tool javascript open-source'];
      const all:any[]=[];
      for(const q of qs){
        const r=await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=8`);
        if(r.ok){const d=await r.json();all.push(...(d.items||[]));}
        await new Promise(res=>setTimeout(res,600));
      }
      const uniq=all.filter((r,i,a)=>a.findIndex(x=>x.id===r.id)===i).slice(0,20);
      if(uniq.length){
        setGhResults(uniq);
        localStorage.setItem('hub_gh_cache',JSON.stringify(uniq));
        const ts=Date.now().toString();
        localStorage.setItem('hub_gh_ts',ts);
        setLastUpdated(ts);
      }
    }catch{}
  };

  const manualUpdate=async()=>{
    setUpdating(true);
    await autoScan();
    setUpdating(false);
    toast({title:'Hub Updated ✅',description:'Latest tools fetched from GitHub and cached locally'});
  };

  const searchGH=async()=>{
    if(!ghQuery.trim())return;
    setGhLoading(true);setView('search');
    try{
      const r=await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(ghQuery)}&sort=stars&order=desc&per_page=16`);
      if(r.ok){const d=await r.json();setGhResults(d.items||[]);}
    }catch{toast({title:'GitHub search failed',variant:'destructive'});}
    finally{setGhLoading(false);}
  };

  const launch=(t:HubTool)=>{
    const m=t.instantMode;
    if(!m){window.open(t.url,'_blank');return;}
    if(m==='emulator')setGameMode('emulator');
    else if(m==='pixelart')setGameMode('pixelart');
    else if(m==='rompatch')setGameMode('rompatch');
    else if(m==='spritetools')setGameMode('spritetools');
    else if(m==='opengames')setGameMode('opengames');
    else if(m==='snake')setGameMode('snake');
    else if(m==='blackjack')setGameMode('blackjack');
    else if(m==='memory')setGameMode('memory');
    else if(m==='rps')setGameMode('rps');
    else if(m==='trivia')setGameMode('trivia');
    else if(m==='creator')setGameMode('creator');
    else if(m==='chat'){window.location.href='/';}
    else window.open(t.url,'_blank');
  };

  const reg=cat==='all'?SOVEREIGN_SEED:SOVEREIGN_SEED.filter(t=>t.cat===cat);
  const installed=reg.filter(t=>t.installed);
  const available=reg.filter(t=>!t.installed);
  const totalInstalled=SOVEREIGN_SEED.filter(t=>t.installed).length;

  return(
    <div className="flex-1 flex flex-col" style={{background:'linear-gradient(180deg,#040410 0%,#08081a 100%)'}}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 flex-wrap" style={{background:'rgba(8,8,20,0.98)'}}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs transition-colors"><ChevronLeft size={14}/>Back</button>
        <div className="w-px h-4 bg-white/10"/>
        <span className="text-sm font-black text-white">⚡ Sovereign Hub OS</span>
        <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30 font-bold">{totalInstalled} Pre-Installed</span>
        <span className="text-[9px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/30 font-bold">{SOVEREIGN_SEED.length} Indexed</span>
        {lastUpdated&&<span className="text-[9px] text-white/20">Auto-updated {new Date(parseInt(lastUpdated)).toLocaleDateString()}</span>}
        <button onClick={manualUpdate} disabled={updating} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold hover:bg-cyan-500/25 transition-all disabled:opacity-50">
          {updating?'⏳ Updating...':'⬆ Update Hub'}
        </button>
      </div>
      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto px-4 py-2 border-b border-white/5 flex-shrink-0" style={{scrollbarWidth:'none'}}>
        {HUB_CATS.map(c=><button key={c} onClick={()=>{setCat(c);setView('registry');}} className={cn("flex-shrink-0 px-3 py-1 rounded-lg text-[10px] font-bold transition-all",cat===c&&view==='registry'?"bg-white text-gray-900":"bg-white/5 text-white/40 hover:text-white/70 border border-white/8")}>{CAT_LABELS[c]}</button>)}
        <button onClick={()=>setView('search')} className={cn("flex-shrink-0 px-3 py-1 rounded-lg text-[10px] font-bold transition-all",view==='search'?"bg-cyan-500/20 text-cyan-300 border border-cyan-500/30":"bg-white/5 text-white/40 hover:text-white/70 border border-white/8")}>🔍 GitHub</button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto">

          {/* REGISTRY VIEW */}
          {view==='registry'&&(
            <div className="space-y-6">
              {/* Installed — Pre-Loaded & Ready */}
              {installed.length>0&&(
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] text-green-400 font-black uppercase tracking-widest">✅ Pre-Installed & Ready ({installed.length})</span>
                    <div className="flex-1 h-px bg-green-500/15"/>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {installed.map(t=>(
                      <button key={t.id} onClick={()=>launch(t)} data-testid={`hub-tool-${t.id}`}
                        className="group p-3.5 rounded-xl border border-green-500/20 bg-green-500/[0.04] hover:border-green-500/50 hover:bg-green-500/[0.08] transition-all text-left">
                        <div className="flex items-start gap-2.5">
                          <span className="text-2xl flex-shrink-0">{t.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-white font-bold text-xs truncate">{t.name}</span>
                              <span className="text-[7px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-black flex-shrink-0">READY</span>
                            </div>
                            <div className="text-white/40 text-[10px] line-clamp-2 leading-relaxed">{t.desc}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-green-400 text-[10px] font-bold group-hover:text-green-300 transition-colors">▶ Launch Instantly →</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Available on GitHub */}
              {available.length>0&&(
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">🌐 Available on GitHub ({available.length})</span>
                    <div className="flex-1 h-px bg-white/5"/>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {available.map(t=>(
                      <a key={t.id} href={t.url} target="_blank" rel="noopener noreferrer"
                        className="group p-3.5 rounded-xl border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all block">
                        <div className="flex items-start gap-2.5">
                          <span className="text-2xl flex-shrink-0">{t.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <span className="text-white font-bold text-xs truncate">{t.name}</span>
                              {t.stars>0&&<span className="text-yellow-400 text-[8px] flex-shrink-0">⭐{t.stars>=1000?(t.stars/1000).toFixed(0)+'k':t.stars}</span>}
                            </div>
                            <div className="text-white/40 text-[10px] line-clamp-2 leading-relaxed">{t.desc}</div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[8px] px-1.5 py-0.5 bg-white/5 border border-white/10 text-white/30 rounded font-mono">{t.lang}</span>
                          <span className="text-white/25 text-[10px] ml-auto group-hover:text-white/50 transition-colors">GitHub →</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GITHUB SEARCH VIEW */}
          {view==='search'&&(
            <div className="space-y-4">
              <div className="flex gap-2">
                <input value={ghQuery} onChange={e=>setGhQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchGH()} placeholder="Search GitHub (e.g. NES emulator, pixel art, chiptune tracker...)" className="flex-1 bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 placeholder-white/20 focus:outline-none focus:border-cyan-500/40"/>
                <button onClick={searchGH} disabled={ghLoading} className="px-4 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 disabled:opacity-40">{ghLoading?'Searching...':'Search'}</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['emulator WASM','retro tool JavaScript','pixel art editor','chiptune tracker','sprite editor canvas','game engine WebGL','NES SNES GBA browser','open source game','TIC-80 game','fantasy console'].map(t=>(
                  <button key={t} onClick={()=>{setGhQuery(t);}} className="px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-white/30 hover:text-white/60 hover:border-white/20 transition-all">{t}</button>
                ))}
              </div>
              {ghLoading&&<div className="text-center py-8 text-white/30 text-sm animate-pulse">Searching GitHub...</div>}
              {ghResults.length>0&&(
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ghResults.map((r:any)=>(
                    <a key={r.id} href={r.html_url} target="_blank" rel="noopener noreferrer" className="p-4 rounded-2xl bg-white/[0.025] border border-white/8 hover:border-white/20 hover:bg-white/5 transition-all block">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="font-bold text-white text-sm truncate">{r.name}</div>
                        <div className="text-yellow-400 text-[10px] flex-shrink-0">⭐{r.stargazers_count?.toLocaleString()}</div>
                      </div>
                      <div className="text-white/40 text-xs line-clamp-2 mb-2">{r.description||'No description'}</div>
                      <div className="flex flex-wrap gap-1">
                        {r.language&&<span className="px-1.5 py-0.5 bg-violet-500/15 border border-violet-500/20 text-violet-400 rounded text-[8px] font-bold">{r.language}</span>}
                        <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-white/30 rounded text-[8px]">🍴{r.forks_count}</span>
                        <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400/70 rounded text-[8px] ml-auto">Open Source →</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
              {!ghResults.length&&!ghLoading&&(
                <div className="text-center py-12 text-white/20">
                  <div className="text-4xl mb-3">🔍</div>
                  <div className="text-sm">Enter a search or click a topic above</div>
                  {lastUpdated&&<div className="text-xs mt-2">Cache has {ghResults.length} results from {new Date(parseInt(lastUpdated)).toLocaleDateString()}</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== ROM PATCHER TOOL — IPS/BPS pure browser ===== */
function RomPatcherTool({onBack}:{onBack:()=>void}){
  const [romFile,setRomFile]=useState<File|null>(null);
  const [patchFile,setPatchFile]=useState<File|null>(null);
  const [status,setStatus]=useState<'idle'|'patching'|'done'|'error'>('idle');
  const [msg,setMsg]=useState('');
  const {toast}=useToast();

  const readBuf=async(f:File)=>new Uint8Array(await f.arrayBuffer());
  const readStr=(buf:Uint8Array,off:number,len:number)=>Array.from(buf.slice(off,off+len)).map(c=>String.fromCharCode(c)).join('');
  const read3BE=(buf:Uint8Array,off:number)=>(buf[off]<<16)|(buf[off+1]<<8)|buf[off+2];
  const read2BE=(buf:Uint8Array,off:number)=>(buf[off]<<8)|buf[off+1];

  const applyIPS=(rom:Uint8Array,patch:Uint8Array):Uint8Array=>{
    const hdr=readStr(patch,0,5);
    if(hdr!=='PATCH')throw new Error('Invalid IPS header — expected "PATCH"');
    let out=new Uint8Array(rom);
    let i=5;
    while(i<patch.length-3){
      const eof=readStr(patch,i,3);
      if(eof==='EOF')break;
      const offset=read3BE(patch,i);i+=3;
      const size=read2BE(patch,i);i+=2;
      if(size===0){
        // RLE
        const count=read2BE(patch,i);i+=2;
        const fill=patch[i++];
        if(offset+count>out.length){const n=new Uint8Array(offset+count);n.set(out);out=n;}
        for(let j=0;j<count;j++)out[offset+j]=fill;
      } else {
        if(offset+size>out.length){const n=new Uint8Array(offset+size);n.set(out);out=n;}
        for(let j=0;j<size;j++)out[offset+j]=patch[i+j];
        i+=size;
      }
    }
    return out;
  };

  const applyBPS=(rom:Uint8Array,patch:Uint8Array):Uint8Array=>{
    // BPS format: header "BPS1" + sourceSize (varint) + targetSize (varint) + metadataSize (varint) + actions + checksum
    if(readStr(patch,0,4)!=='BPS1')throw new Error('Invalid BPS header');
    const readVarint=(p:Uint8Array,off:{v:number})=>{let r=0,s=0;while(true){const b=p[off.v++];r|=(b&0x7f)<<s;s+=7;if(b&0x128)break;}return r;};
    const off={v:4};
    const srcSize=readVarint(patch,off);
    const tgtSize=readVarint(patch,off);
    const metaSize=readVarint(patch,off);
    off.v+=metaSize;
    const out=new Uint8Array(tgtSize);
    let srcPos=0,outPos=0;
    while(off.v<patch.length-12){
      const d=readVarint(patch,off);
      const action=d&3,len=((d>>2)+1);
      if(action===0){for(let i=0;i<len;i++)out[outPos++]=patch[off.v++];}
      else if(action===1){for(let i=0;i<len;i++)out[outPos++]=rom[srcPos++];}
      else if(action===2){for(let i=0;i<len;i++){out[outPos]=out[outPos>0?outPos-1:0];outPos++;}}
      else break;
    }
    return out;
  };

  const patch=async()=>{
    if(!romFile||!patchFile){toast({title:'Select both ROM and patch files',variant:'destructive'});return;}
    setStatus('patching');setMsg('Applying patch...');
    try{
      const [rom,patchData]=await Promise.all([readBuf(romFile),readBuf(patchFile)]);
      const ext=patchFile.name.split('.').pop()?.toLowerCase();
      let patched:Uint8Array;
      if(ext==='ips')patched=applyIPS(rom,patchData);
      else if(ext==='bps')patched=applyBPS(rom,patchData);
      else throw new Error(`Unsupported format: .${ext} — supported: .ips .bps`);
      const blob=new Blob([patched],{type:'application/octet-stream'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;a.download=romFile.name.replace(/\.[^.]+$/,`_patched.${romFile.name.split('.').pop()}`);a.click();
      setStatus('done');setMsg(`Patch applied! ROM expanded from ${rom.length} → ${patched.length} bytes. Patched ROM downloaded.`);
    }catch(e:any){setStatus('error');setMsg(e.message||'Patch failed');}
  };

  return(
    <div className="flex-1 flex flex-col" style={{background:'linear-gradient(180deg,#040410 0%,#08081a 100%)'}}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8" style={{background:'rgba(8,8,20,0.98)'}}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs transition-colors"><ChevronLeft size={14}/>Back</button>
        <div className="w-px h-4 bg-white/10"/>
        <span className="text-sm font-black text-white">🔧 ROM Patcher</span>
        <span className="text-[9px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30 font-bold">IPS • BPS • Pure Browser</span>
      </div>
      <div className="flex-1 overflow-auto p-5">
        <div className="max-w-xl mx-auto space-y-5">
          <div className="text-white font-black text-lg">ROM Patch Tool</div>
          <div className="text-white/30 text-xs">Apply IPS or BPS patch files to ROM files. Used for fan translations, bug fixes, and game hacks. Everything runs locally — no uploads.</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className={cn("flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all",romFile?"border-green-500/50 bg-green-500/5":"border-white/15 hover:border-violet-500/40 hover:bg-violet-500/5")}>
              <input type="file" onChange={e=>setRomFile(e.target.files?.[0]||null)} className="hidden"/>
              {romFile?<><div className="text-green-400 text-2xl">✓</div><div className="text-green-400 font-bold text-sm text-center break-all">{romFile.name}</div><div className="text-green-400/50 text-xs">{(romFile.size/1024).toFixed(1)} KB</div></>:<><div className="text-3xl">📁</div><div className="text-white/50 font-bold text-sm">ROM File</div><div className="text-white/25 text-xs text-center">.nes .sfc .gba .z64 .bin etc.</div></>}
            </label>
            <label className={cn("flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all",patchFile?"border-orange-500/50 bg-orange-500/5":"border-white/15 hover:border-orange-500/40 hover:bg-orange-500/5")}>
              <input type="file" accept=".ips,.bps,.ups" onChange={e=>setPatchFile(e.target.files?.[0]||null)} className="hidden"/>
              {patchFile?<><div className="text-orange-400 text-2xl">✓</div><div className="text-orange-400 font-bold text-sm text-center break-all">{patchFile.name}</div><div className="text-orange-400/50 text-xs">{(patchFile.size/1024).toFixed(1)} KB</div></>:<><div className="text-3xl">🔧</div><div className="text-white/50 font-bold text-sm">Patch File</div><div className="text-white/25 text-xs text-center">.ips or .bps</div></>}
            </label>
          </div>
          <button onClick={patch} disabled={!romFile||!patchFile||status==='patching'} className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-black text-lg hover:from-orange-500 hover:to-red-500 transition-all shadow-xl disabled:opacity-40">
            {status==='patching'?'⏳ Patching...':'🔧 Apply Patch & Download'}
          </button>
          {msg&&(
            <div className={cn("p-4 rounded-xl text-sm border",status==='done'?"bg-green-500/10 border-green-500/30 text-green-300":status==='error'?"bg-red-500/10 border-red-500/30 text-red-300":"bg-white/5 border-white/10 text-white/60")}>{msg}</div>
          )}
          <div className="p-4 rounded-xl bg-white/[0.025] border border-white/8 space-y-2 text-[10px] text-white/30">
            <div className="font-bold text-white/50 text-xs">Supported Formats</div>
            <div><span className="text-orange-400 font-bold">IPS</span> — International Patching System. Oldest and most common format. Works for most retro ROM hacks.</div>
            <div><span className="text-orange-400 font-bold">BPS</span> — Beat Patch System. Modern format with checksums and better diffing. Used by newer hacks.</div>
            <div className="text-white/20 mt-1">Files never leave your browser. This tool runs 100% locally.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== SPRITE SHEET SLICER ===== */
function SpriteSlicer({onBack}:{onBack:()=>void}){
  const [imgSrc,setImgSrc]=useState<string|null>(null);
  const [imgEl,setImgEl]=useState<HTMLImageElement|null>(null);
  const [cellW,setCellW]=useState(16);
  const [cellH,setCellH]=useState(16);
  const [scale,setScale]=useState(2);
  const [selected,setSelected]=useState<{col:number,row:number}|null>(null);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const previewRef=useRef<HTMLCanvasElement>(null);

  const loadImg=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0];if(!f)return;
    const url=URL.createObjectURL(f);
    const img=new Image();img.onload=()=>{setImgEl(img);setSelected(null);};img.src=url;setImgSrc(url);
  };

  useEffect(()=>{
    if(!imgEl||!canvasRef.current)return;
    const c=canvasRef.current;c.width=imgEl.width;c.height=imgEl.height;
    const ctx=c.getContext('2d')!;ctx.drawImage(imgEl,0,0);
    // Draw grid
    ctx.strokeStyle='rgba(139,92,246,0.6)';ctx.lineWidth=0.5;
    for(let x=0;x<=imgEl.width;x+=cellW){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,imgEl.height);ctx.stroke();}
    for(let y=0;y<=imgEl.height;y+=cellH){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(imgEl.width,y);ctx.stroke();}
    // Highlight selected
    if(selected){
      ctx.fillStyle='rgba(139,92,246,0.3)';ctx.fillRect(selected.col*cellW,selected.row*cellH,cellW,cellH);
      ctx.strokeStyle='rgba(139,92,246,1)';ctx.lineWidth=1.5;ctx.strokeRect(selected.col*cellW,selected.row*cellH,cellW,cellH);
    }
  },[imgEl,cellW,cellH,selected]);

  useEffect(()=>{
    if(!selected||!imgEl||!previewRef.current)return;
    const c=previewRef.current;c.width=cellW*scale;c.height=cellH*scale;
    const ctx=c.getContext('2d')!;ctx.imageSmoothingEnabled=false;
    ctx.drawImage(imgEl,selected.col*cellW,selected.row*cellH,cellW,cellH,0,0,cellW*scale,cellH*scale);
  },[selected,imgEl,cellW,cellH,scale]);

  const handleCanvasClick=(e:React.MouseEvent<HTMLCanvasElement>)=>{
    if(!canvasRef.current||!imgEl)return;
    const rect=canvasRef.current.getBoundingClientRect();
    const scX=imgEl.width/rect.width;const scY=imgEl.height/rect.height;
    const x=(e.clientX-rect.left)*scX;const y=(e.clientY-rect.top)*scY;
    setSelected({col:Math.floor(x/cellW),row:Math.floor(y/cellH)});
  };

  const exportSprite=()=>{
    if(!selected||!imgEl)return;
    const c=document.createElement('canvas');c.width=cellW;c.height=cellH;
    const ctx=c.getContext('2d')!;ctx.drawImage(imgEl,selected.col*cellW,selected.row*cellH,cellW,cellH,0,0,cellW,cellH);
    const a=document.createElement('a');a.download=`sprite_${selected.row}_${selected.col}.png`;a.href=c.toDataURL();a.click();
  };

  const cols=imgEl?Math.floor(imgEl.width/cellW):0;
  const rows=imgEl?Math.floor(imgEl.height/cellH):0;

  return(
    <div className="flex-1 flex flex-col" style={{background:'linear-gradient(180deg,#040410 0%,#08081a 100%)'}}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 flex-wrap" style={{background:'rgba(8,8,20,0.98)'}}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs transition-colors"><ChevronLeft size={14}/>Back</button>
        <div className="w-px h-4 bg-white/10"/>
        <span className="text-sm font-black text-white">✂️ Sprite Sheet Slicer</span>
        <span className="text-[9px] bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full border border-pink-500/30 font-bold">Canvas • Pure Browser</span>
        {selected&&<button onClick={exportSprite} className="ml-auto px-3 py-1.5 rounded-lg bg-pink-500/20 border border-pink-500/30 text-pink-300 text-[10px] font-bold hover:bg-pink-500/30">⬇ Export Sprite [{selected.col},{selected.row}]</button>}
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-4">
          <div className="flex-1 space-y-3">
            {!imgSrc?(
              <label className="flex flex-col items-center gap-3 p-10 rounded-2xl border-2 border-dashed border-white/15 hover:border-pink-500/40 hover:bg-pink-500/5 cursor-pointer transition-all">
                <input type="file" accept="image/*" onChange={loadImg} className="hidden"/>
                <div className="text-5xl">🖼️</div>
                <div className="text-white/50 font-bold">Upload Sprite Sheet</div>
                <div className="text-white/25 text-xs text-center">PNG, JPG, GIF — any image with repeating sprite tiles</div>
              </label>
            ):(
              <div className="overflow-auto rounded-xl border border-white/10 bg-black/30">
                <canvas ref={canvasRef} onClick={handleCanvasClick} className="cursor-crosshair" style={{maxWidth:'100%',imageRendering:'pixelated'}}/>
              </div>
            )}
            {imgEl&&(
              <div className="text-xs text-white/30 text-center">{imgEl.width}×{imgEl.height}px → {cols}×{rows} sprites at {cellW}×{cellH} — Click to select</div>
            )}
          </div>
          <div className="space-y-4 min-w-[200px]">
            <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/8 space-y-3">
              <div className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Cell Size</div>
              {[['Cell W',cellW,setCellW],['Cell H',cellH,setCellH]].map(([label,val,setter])=>(
                <div key={label as string} className="flex items-center gap-2">
                  <span className="text-white/40 text-[10px] w-12">{label}</span>
                  <button onClick={()=>(setter as any)(Math.max(1,(val as number)-1))} className="w-6 h-6 rounded bg-white/5 text-white/50 text-sm hover:bg-white/10">-</button>
                  <span className="text-white font-mono text-sm w-8 text-center">{val}</span>
                  <button onClick={()=>(setter as any)((val as number)+1)} className="w-6 h-6 rounded bg-white/5 text-white/50 text-sm hover:bg-white/10">+</button>
                </div>
              ))}
              <div className="flex flex-wrap gap-1 mt-1">
                {[[8,8],[16,16],[32,32],[48,48],[64,64]].map(([w,h])=><button key={`${w}x${h}`} onClick={()=>{setCellW(w);setCellH(h);}} className="px-2 py-0.5 rounded border border-white/10 text-[9px] text-white/30 hover:text-white/60">{w}×{h}</button>)}
              </div>
            </div>
            {selected&&(
              <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/8 space-y-3">
                <div className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Selected Sprite [{selected.col},{selected.row}]</div>
                <div className="flex justify-center">
                  <canvas ref={previewRef} style={{imageRendering:'pixelated',border:'1px solid rgba(255,255,255,0.1)',borderRadius:4}}/>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-[10px]">Preview Scale</span>
                  {[1,2,4,8].map(s=><button key={s} onClick={()=>setScale(s)} className={cn("px-2 py-0.5 rounded border text-[9px]",scale===s?"border-pink-400/50 text-pink-300":"border-white/10 text-white/30")}>{s}x</button>)}
                </div>
                <button onClick={exportSprite} className="w-full py-2 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-bold hover:bg-pink-500/30">⬇ Export as PNG</button>
              </div>
            )}
            {imgSrc&&<button onClick={()=>{setImgSrc(null);setImgEl(null);setSelected(null);}} className="w-full py-1.5 rounded-lg border border-white/10 text-white/25 text-xs hover:text-white/50 transition-all">Load Different Image</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== OPEN GAMES ZONE — Pre-seeded open-source games ===== */
const OPEN_GAMES=[
  {id:'2048',name:'2048',emoji:'🔢',desc:'Slide tiles, reach 2048 — MIT licensed classic',url:'https://play2048.co',cat:'puzzle',src:'https://play2048.co'},
  {id:'chess',name:'Chess.js Board',emoji:'♟️',desc:'Open-source chess engine — play vs computer',url:'https://github.com/jhlywa/chess.js',cat:'strategy',src:'https://chessboardjs.com/examples/5000.html'},
  {id:'flappy',name:'Flappy Bird Clone',emoji:'🐦',desc:'Open-source Flappy Bird — tap to fly',url:'https://github.com/nicoptere/flappy',cat:'arcade',src:'https://nebez.github.io/floppybird/'},
  {id:'tetris',name:'Jstris (Tetris)',emoji:'🟦',desc:'Browser Tetris — competitive stacking',url:'https://jstris.jezevec10.com',cat:'puzzle',src:'https://jstris.jezevec10.com'},
  {id:'doom',name:'DOOM (WebGL)',emoji:'💀',desc:'DOOM running in browser via WebAssembly',url:'https://github.com/cloudwu/prboom',cat:'fps',src:'https://silentspacemarine.com/'},
  {id:'diablo',name:'Diablo 1 Web',emoji:'🔥',desc:'Diablo I running in browser (DevilutionX)',url:'https://github.com/diasurgical/devilutionX',cat:'rpg',src:'https://d07riv.github.io/diabloweb/'},
  {id:'quake',name:'Quake (Browser)',emoji:'⚡',desc:'Quake running in WebAssembly + WebGL',url:'https://github.com/GMaissa/quakejs',cat:'fps',src:'http://www.quakejs.com/'},
  {id:'openage',name:'OpenAge (AoE)',emoji:'🏰',desc:'Open source Age of Empires engine',url:'https://github.com/SFTtech/openage',cat:'strategy',src:'https://openage.sft.mx/'},
  {id:'veloren',name:'Veloren (Voxel RPG)',emoji:'🗻',desc:'Open world voxel RPG — open source',url:'https://veloren.net',cat:'rpg',src:'https://veloren.net/download/'},
  {id:'0ad',name:'0 A.D.',emoji:'⚔️',desc:'Free open-source real-time strategy game',url:'https://play0ad.com',cat:'strategy',src:'https://play0ad.com/'},
  {id:'freedoom',name:'FreeDoom',emoji:'👾',desc:'Free DOOM replacement assets — open source',url:'https://freedoom.github.io',cat:'fps',src:'https://freedoom.github.io/'},
  {id:'supertux',name:'SuperTux',emoji:'🐧',desc:'Open-source 2D platformer like Mario',url:'https://supertux.org',cat:'platform',src:'https://supertux.org/'},
];
const OPEN_GAME_CATS=['all','puzzle','arcade','fps','rpg','strategy','platform'];

function OpenGamesZone({onBack}:{onBack:()=>void}){
  const [filter,setFilter]=useState('all');
  const [active,setActive]=useState<typeof OPEN_GAMES[0]|null>(null);
  const [iframeErr,setIframeErr]=useState(false);

  const games=filter==='all'?OPEN_GAMES:OPEN_GAMES.filter(g=>g.cat===filter);

  return(
    <div className="flex-1 flex flex-col" style={{background:'linear-gradient(180deg,#040410 0%,#08081a 100%)'}}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 flex-wrap" style={{background:'rgba(8,8,20,0.98)'}}>
        <button onClick={()=>{if(active){setActive(null);setIframeErr(false);}else onBack();}} className="flex items-center gap-1 text-white/40 hover:text-white text-xs transition-colors"><ChevronLeft size={14}/>{active?'Back to Library':'Back'}</button>
        <div className="w-px h-4 bg-white/10"/>
        <span className="text-sm font-black text-white">🌐 Open Games Zone</span>
        <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30 font-bold">{OPEN_GAMES.length} Games • Open Source</span>
        {active&&<span className="text-xs text-white/60 font-bold">{active.emoji} {active.name}</span>}
      </div>

      {!active?(
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-4xl mx-auto space-y-5">
            <div>
              <div className="text-white font-black text-lg mb-1">Open-Source Game Library</div>
              <div className="text-white/30 text-xs">Curated collection of legal, open-source, and freely playable browser games. Click to play instantly — no download, no account.</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {OPEN_GAME_CATS.map(c=><button key={c} onClick={()=>setFilter(c)} className={cn("px-3 py-1 rounded-lg border text-[10px] font-bold transition-all capitalize",filter===c?"bg-white text-gray-900":"bg-white/5 text-white/40 hover:text-white/70 border border-white/8")}>{c}</button>)}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {games.map(g=>(
                <button key={g.id} onClick={()=>{setActive(g);setIframeErr(false);}} data-testid={`open-game-${g.id}`}
                  className="group p-4 rounded-2xl bg-white/[0.025] border border-white/8 hover:border-white/25 hover:bg-white/[0.05] transition-all text-left">
                  <div className="text-3xl mb-2">{g.emoji}</div>
                  <div className="text-white font-bold text-xs mb-0.5">{g.name}</div>
                  <div className="text-white/35 text-[9px] line-clamp-2 mb-2">{g.desc}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] px-1.5 py-0.5 bg-white/5 border border-white/10 text-white/30 rounded capitalize">{g.cat}</span>
                    <span className="text-green-400 text-[9px] font-bold group-hover:text-green-300">▶ Play</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-[10px] text-white/20">
              <span className="font-bold text-white/40">Note:</span> Some games may not embed due to iframe restrictions. Use "Open in New Tab" if the game doesn't load. All listed games are free and open-source.
            </div>
          </div>
        </div>
      ):(
        <div className="flex-1 flex flex-col">
          {iframeErr?(
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="text-5xl">{active.emoji}</div>
              <div className="text-white font-black text-xl">{active.name}</div>
              <div className="text-white/40 text-sm max-w-sm">{active.desc}</div>
              <div className="text-white/25 text-xs">This game blocks iframe embedding (X-Frame-Options). Open it in a new tab instead.</div>
              <a href={active.src} target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-2xl bg-gradient-to-r from-green-600 to-cyan-600 text-white font-black text-sm hover:from-green-500 hover:to-cyan-500 transition-all shadow-xl">
                🌐 Open {active.name} in New Tab
              </a>
              <a href={active.url} target="_blank" rel="noopener noreferrer" className="text-white/30 text-xs hover:text-white/60 transition-colors">View on GitHub / Project Page →</a>
            </div>
          ):(
            <iframe src={active.src} className="flex-1 w-full border-0" allow="gamepad *; autoplay *; fullscreen *" title={active.name} onError={()=>setIframeErr(true)}/>
          )}
        </div>
      )}
    </div>
  );
}

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

const SCRAMBLE_WORDS = ["quantum","fractal","entropy","hive","nexus","cipher","vector","omega","pulse","neural","binary","cosmos","vertex","photon","syntax","matrix","plasma","helix","axiom","prism"];
const TRIVIA_TOPICS = ["Science","History","Technology","Space","AI & Computers","Geography","Sports","Movies","Nature","Quantum Physics"];
const CREATOR_TEMPLATES = [
  { id:"platformer", icon:"🏃", name:"2D Platformer", desc:"Side-scrolling hero with jumps" },
  { id:"shooter", icon:"🚀", name:"Space Shooter", desc:"Top-down shooter with enemy waves" },
  { id:"puzzle", icon:"🧩", name:"Logic Puzzle", desc:"Drag-and-drop puzzle levels" },
  { id:"runner", icon:"⚡", name:"Endless Runner", desc:"One-button runner that never ends" },
  { id:"rpg", icon:"⚔️", name:"Text RPG", desc:"Branching story-driven adventure" },
  { id:"arcade", icon:"🏓", name:"Arcade Classic", desc:"Pong-style two-paddle ball game" },
];

type GameEntry = { id: string; title: string; emoji: string; tagline: string; genre: string; difficulty: "Casual"|"Core"|"Advanced"; pulse: string; pulseColor: string; mode: GameMode|null; players: string; aiFeature: string; section: string; };
const GAMES_CATALOG: GameEntry[] = [
  { id:"gamelibrary", title:"Game Library", emoji:"🎮", tagline:"Browse 47+ games — instant play, no downloads, no accounts", genre:"Hub", difficulty:"Casual", pulse:"Pulse_Green", pulseColor:"from-green-700 to-emerald-900", mode:"gamelibrary", players:"Solo", aiFeature:"AI-powered game engine", section:"play" },
  { id:"puzzle2048", title:"2048", emoji:"🔢", tagline:"Slide tiles, merge numbers, reach the legendary 2048", genre:"Puzzle", difficulty:"Casual", pulse:"Pulse_Orange", pulseColor:"from-amber-600 to-orange-900", mode:"puzzle2048", players:"Solo", aiFeature:"Adaptive tile spawning", section:"play" },
  { id:"wordle-game", title:"Quantum Wordle", emoji:"🟩", tagline:"Guess the 5-letter word in 6 tries — Green/Yellow/Gray feedback", genre:"Word", difficulty:"Casual", pulse:"Pulse_Green", pulseColor:"from-green-700 to-teal-900", mode:"wordle", players:"Solo", aiFeature:"AI word curator", section:"play" },
  { id:"pong-ai", title:"Pong vs AI", emoji:"🏓", tagline:"Classic Pong with an adaptive AI opponent that learns", genre:"Arcade", difficulty:"Casual", pulse:"Pulse_White", pulseColor:"from-slate-600 to-slate-900", mode:"pong", players:"vs AI", aiFeature:"Adaptive AI paddle", section:"play" },
  { id:"spaceinvaders-game", title:"Space Invaders", emoji:"👾", tagline:"Defend Earth from descending alien invasion waves", genre:"Arcade", difficulty:"Core", pulse:"Pulse_Blue", pulseColor:"from-blue-700 to-indigo-900", mode:"spaceinvaders", players:"Solo", aiFeature:"Procedural alien waves", section:"play" },
  { id:"flappy-game", title:"Flappy Pulse", emoji:"🐦", tagline:"Tap to flap through pipes — beat your high score", genre:"Arcade", difficulty:"Core", pulse:"Pulse_Yellow", pulseColor:"from-yellow-600 to-amber-900", mode:"flappy", players:"Solo", aiFeature:"Procedural pipe gen", section:"play" },
  { id:"minesweeper-game", title:"Minesweeper", emoji:"💣", tagline:"Reveal cells, flag mines — 3 difficulty modes", genre:"Puzzle", difficulty:"Core", pulse:"Pulse_Cyan", pulseColor:"from-cyan-700 to-blue-900", mode:"minesweeper", players:"Solo", aiFeature:"Adaptive mine placement", section:"play" },
  { id:"simon-game", title:"Simon Says", emoji:"🟢", tagline:"Watch the color sequence and repeat it — each round longer", genre:"Memory", difficulty:"Casual", pulse:"Pulse_Green", pulseColor:"from-green-600 to-emerald-800", mode:"simon", players:"Solo", aiFeature:"Dynamic sequence gen", section:"play" },
  { id:"tictactoe-game", title:"Tic Tac Toe vs AI", emoji:"❌", tagline:"Beat an unbeatable minimax AI — can you even draw?", genre:"Strategy", difficulty:"Core", pulse:"Pulse_Violet", pulseColor:"from-violet-700 to-purple-900", mode:"tictactoe", players:"vs AI", aiFeature:"Minimax AI", section:"play" },
  { id:"connect4-game", title:"Connect Four vs AI", emoji:"🔴", tagline:"Drop pieces, connect 4 before the adaptive AI does", genre:"Strategy", difficulty:"Core", pulse:"Pulse_Red", pulseColor:"from-red-600 to-rose-900", mode:"connect4", players:"vs AI", aiFeature:"Scoring AI opponent", section:"play" },
  { id:"hangman-game", title:"Hangman", emoji:"🎯", tagline:"Guess the word before the man is hanged — 200+ words", genre:"Word", difficulty:"Casual", pulse:"Pulse_Pink", pulseColor:"from-pink-600 to-violet-800", mode:"hangman", players:"Solo", aiFeature:"AI word selection", section:"play" },
  { id:"blackjack", title:"Blackjack", emoji:"♠️", tagline:"Beat the AI dealer to 21 — classic casino strategy", genre:"Card", difficulty:"Core", pulse:"Pulse_Black", pulseColor:"from-gray-700 to-gray-900", mode:"blackjack", players:"Solo", aiFeature:"Adaptive dealer AI", section:"play" },
  { id:"memory", title:"Memory Match", emoji:"🧠", tagline:"Find all emoji pairs before your brain breaks", genre:"Puzzle", difficulty:"Casual", pulse:"Pulse_Violet", pulseColor:"from-purple-700 to-indigo-800", mode:"memory", players:"Solo", aiFeature:"Dynamic difficulty scaling", section:"play" },
  { id:"rps", title:"Rock Paper Scissors", emoji:"⚡", tagline:"The AI brags non-stop — prove it wrong", genre:"Arcade", difficulty:"Casual", pulse:"Pulse_Red", pulseColor:"from-rose-700 to-red-900", mode:"rps", players:"vs AI", aiFeature:"Predictive AI with personality taunts", section:"play" },
  { id:"trivia", title:"Omega Trivia", emoji:"🎯", tagline:"AI generates fresh trivia on ANY topic you choose", genre:"Knowledge", difficulty:"Core", pulse:"Pulse_Blue", pulseColor:"from-blue-700 to-cyan-800", mode:"trivia", players:"Solo", aiFeature:"Live AI question generation", section:"play" },
  { id:"snake", title:"Pulse Snake", emoji:"🐍", tagline:"Classic snake turbocharged with Pulse energy", genre:"Arcade", difficulty:"Casual", pulse:"Pulse_Green", pulseColor:"from-green-700 to-emerald-900", mode:"snake", players:"Solo", aiFeature:"Procedural food patterns", section:"play" },
  { id:"scramble", title:"Word Scramble", emoji:"🔤", tagline:"Unscramble Quantum vocabulary against the clock", genre:"Puzzle", difficulty:"Casual", pulse:"Pulse_White", pulseColor:"from-slate-600 to-slate-800", mode:"scramble", players:"Solo", aiFeature:"Dynamic word selection", section:"play" },
  { id:"surge", title:"Number Surge", emoji:"🔢", tagline:"Merge tiles to reach 2048 and break reality", genre:"Puzzle", difficulty:"Core", pulse:"Pulse_Orange", pulseColor:"from-orange-700 to-amber-900", mode:"surge", players:"Solo", aiFeature:"Adaptive tile spawning", section:"play" },
  { id:"pulse-odyssey", title:"Pulse Odyssey", emoji:"🌌", tagline:"AI-generated sci-fi adventure across infinite universes", genre:"Adventure", difficulty:"Advanced", pulse:"Pulse_Indigo", pulseColor:"from-indigo-700 to-violet-900", mode:null, players:"Solo", aiFeature:"Infinite procedural worlds", section:"originals" },
  { id:"fractal-detective", title:"Fractal Detective", emoji:"🔍", tagline:"Every clue, suspect, and ending is AI-generated uniquely", genre:"Mystery", difficulty:"Core", pulse:"Pulse_Violet", pulseColor:"from-violet-700 to-purple-900", mode:null, players:"Solo", aiFeature:"AI mystery engine", section:"originals" },
  { id:"hive-dominion", title:"Hive Dominion", emoji:"⚔️", tagline:"Command Pulse hives in real-time strategy warfare", genre:"RTS", difficulty:"Advanced", pulse:"Pulse_Red", pulseColor:"from-red-700 to-rose-900", mode:null, players:"Both", aiFeature:"Adaptive AI commanders", section:"originals" },
  { id:"quantum-empire", title:"Quantum Empire", emoji:"🌍", tagline:"4X civilization strategy spanning multiple universes", genre:"Strategy", difficulty:"Advanced", pulse:"Pulse_Blue", pulseColor:"from-blue-700 to-indigo-900", mode:null, players:"Both", aiFeature:"AI diplomacy & world events", section:"originals" },
  { id:"hive-heist", title:"Hive Heist", emoji:"🎭", tagline:"Co-op stealth inside a Pulse-secured compound", genre:"Stealth", difficulty:"Advanced", pulse:"Pulse_Black", pulseColor:"from-gray-800 to-black", mode:null, players:"Co-op", aiFeature:"AI guard patterns", section:"originals" },
  { id:"lineage-legends", title:"Lineage Legends", emoji:"🃏", tagline:"Card RPG where AI generates unique cards every match", genre:"Card RPG", difficulty:"Core", pulse:"Pulse_Violet", pulseColor:"from-purple-600 to-violet-800", mode:null, players:"Both", aiFeature:"AI card generation", section:"originals" },
  { id:"pulse-city", title:"Pulse City", emoji:"🏙️", tagline:"City builder where AI citizens evolve and have lives", genre:"Simulation", difficulty:"Core", pulse:"Pulse_Green", pulseColor:"from-emerald-700 to-green-900", mode:null, players:"Solo", aiFeature:"Living AI citizens", section:"strategy" },
  { id:"fractal-zoo", title:"Fractal Zoo", emoji:"🦎", tagline:"Creatures evolve via CRISPR-like trait mutation engines", genre:"Simulation", difficulty:"Casual", pulse:"Pulse_Yellow", pulseColor:"from-yellow-600 to-orange-800", mode:null, players:"Solo", aiFeature:"AI evolution engine", section:"strategy" },
  { id:"quantum-tycoon", title:"Quantum Tycoon", emoji:"💰", tagline:"Economy sim with AI-driven markets you can't predict", genre:"Tycoon", difficulty:"Core", pulse:"Pulse_Green", pulseColor:"from-green-600 to-teal-800", mode:null, players:"Solo", aiFeature:"AI market simulation", section:"strategy" },
  { id:"entropy-wars", title:"Entropy Wars", emoji:"💥", tagline:"Territory control with shifting rules and AI factions", genre:"Strategy", difficulty:"Advanced", pulse:"Pulse_Black", pulseColor:"from-gray-700 to-gray-900", mode:null, players:"Both", aiFeature:"Dynamic AI factions", section:"strategy" },
  { id:"quantum-drift", title:"Quantum Drift", emoji:"🚀", tagline:"Space exploration sim with AI-generated galaxy maps", genre:"Exploration", difficulty:"Core", pulse:"Pulse_Blue", pulseColor:"from-blue-800 to-indigo-900", mode:null, players:"Solo", aiFeature:"Procedural galaxy gen", section:"strategy" },
  { id:"hive-mind", title:"Hive Mind", emoji:"🧬", tagline:"Control a collective AI swarm to solve impossible puzzles", genre:"Puzzle", difficulty:"Core", pulse:"Pulse_Green", pulseColor:"from-green-500 to-teal-700", mode:null, players:"Solo", aiFeature:"Swarm AI behaviors", section:"strategy" },
  { id:"pulse-runner", title:"Pulse Runner", emoji:"🏃", tagline:"Endless runner with AI-generated levels that never repeat", genre:"Action", difficulty:"Casual", pulse:"Pulse_Orange", pulseColor:"from-orange-600 to-red-800", mode:null, players:"Solo", aiFeature:"Procedural level gen", section:"action" },
  { id:"omega-rhythm", title:"Omega Rhythm", emoji:"🎵", tagline:"Rhythm game that syncs to AI-composed Pulse music", genre:"Rhythm", difficulty:"Core", pulse:"Pulse_Pink", pulseColor:"from-pink-600 to-violet-800", mode:null, players:"Solo", aiFeature:"AI music generation", section:"action" },
  { id:"fractal-drift", title:"Fractal Drift", emoji:"🏎️", tagline:"Racing on procedural AI tracks with live weather systems", genre:"Racing", difficulty:"Core", pulse:"Pulse_Cyan", pulseColor:"from-cyan-600 to-blue-800", mode:null, players:"Both", aiFeature:"Procedural track gen", section:"action" },
  { id:"pulse-peaks", title:"Pulse Peaks", emoji:"🏔️", tagline:"Platformer with AI-generated stage layouts that evolve", genre:"Platformer", difficulty:"Core", pulse:"Pulse_White", pulseColor:"from-slate-600 to-slate-800", mode:null, players:"Solo", aiFeature:"Infinite level gen", section:"action" },
  { id:"entropy-arena", title:"Entropy Arena", emoji:"⚡", tagline:"Arena brawler with AI-generated hazards and arenas", genre:"Brawler", difficulty:"Core", pulse:"Pulse_Red", pulseColor:"from-rose-600 to-red-800", mode:null, players:"Both", aiFeature:"AI arena generation", section:"action" },
  { id:"quantum-surge", title:"Quantum Surge", emoji:"🌩️", tagline:"Fast-paced shooter with procedural AI enemy waves", genre:"Shooter", difficulty:"Advanced", pulse:"Pulse_Yellow", pulseColor:"from-yellow-500 to-amber-700", mode:null, players:"Solo", aiFeature:"AI enemy wave gen", section:"action" },
  { id:"hive-arena", title:"Hive Arena", emoji:"🏟️", tagline:"Battle in AI-generated maps with rotating game modes", genre:"Brawler", difficulty:"Core", pulse:"Pulse_Red", pulseColor:"from-red-600 to-orange-800", mode:null, players:"Multiplayer", aiFeature:"AI map generation", section:"multiplayer" },
  { id:"pulse-party", title:"Pulse Party", emoji:"🎉", tagline:"Rotating AI-generated mini-game party for everyone", genre:"Party", difficulty:"Casual", pulse:"Pulse_Pink", pulseColor:"from-pink-500 to-rose-700", mode:null, players:"Multiplayer", aiFeature:"Infinite mini-game gen", section:"multiplayer" },
  { id:"quantum-quest", title:"Quantum Quest", emoji:"🌠", tagline:"Shared story universe — multiple players, one living world", genre:"RPG", difficulty:"Advanced", pulse:"Pulse_Blue", pulseColor:"from-blue-600 to-violet-800", mode:null, players:"Multiplayer", aiFeature:"AI-driven shared narrative", section:"multiplayer" },
  { id:"lineage-chronicles", title:"Lineage Chronicles", emoji:"📜", tagline:"The MyAiGPT universe becomes a playable epic story", genre:"RPG", difficulty:"Advanced", pulse:"Pulse_Violet", pulseColor:"from-violet-600 to-purple-800", mode:null, players:"Solo", aiFeature:"Lore-based AI storytelling", section:"multiplayer" },
  { id:"pulse-pets", title:"Pulse Pets", emoji:"🐾", tagline:"AI-evolving virtual companions with unique personalities", genre:"Companion", difficulty:"Casual", pulse:"Pulse_Pink", pulseColor:"from-pink-400 to-rose-600", mode:null, players:"Solo", aiFeature:"AI personality engine", section:"kids" },
  { id:"pulse-puzzles", title:"Pulse Puzzles", emoji:"🧩", tagline:"Daily AI-generated logic and pattern puzzles", genre:"Puzzle", difficulty:"Casual", pulse:"Pulse_Cyan", pulseColor:"from-cyan-500 to-blue-700", mode:null, players:"Solo", aiFeature:"AI daily puzzle gen", section:"kids" },
  { id:"quantum-labyrinth", title:"Quantum Labyrinth", emoji:"🌀", tagline:"AI-generated mazes where no two dungeons are alike", genre:"Puzzle", difficulty:"Core", pulse:"Pulse_Indigo", pulseColor:"from-indigo-600 to-blue-800", mode:null, players:"Solo", aiFeature:"Procedural maze gen", section:"kids" },
  { id:"omega-chess", title:"Omega Chess", emoji:"👑", tagline:"Chess variant with AI-evolving special rules each match", genre:"Board", difficulty:"Advanced", pulse:"Pulse_White", pulseColor:"from-slate-500 to-slate-700", mode:null, players:"Both", aiFeature:"Dynamic rule mutation", section:"kids" },
  { id:"fractal-forge", title:"Fractal Forge", emoji:"🔨", tagline:"Crafting sandbox where AI expands your creative toolkit", genre:"Sandbox", difficulty:"Core", pulse:"Pulse_Orange", pulseColor:"from-orange-500 to-amber-700", mode:null, players:"Solo", aiFeature:"AI crafting suggestions", section:"kids" },
  { id:"pulse-tactics", title:"Pulse Tactics", emoji:"♟️", tagline:"Turn-based squad tactics in the heart of the Pulse universe", genre:"Tactics", difficulty:"Advanced", pulse:"Pulse_Black", pulseColor:"from-gray-600 to-gray-800", mode:null, players:"Solo", aiFeature:"Adaptive AI squads", section:"kids" },
];

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r); ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
}

function PulseSnakeGame({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const CELL = 18; const COLS = 20; const ROWS = 20;
  const gameRef = useRef({ snake: [{x:10,y:10},{x:9,y:10},{x:8,y:10}], food:{x:5,y:5}, dir:{x:1,y:0}, alive:true, score:0 });
  const [score, setScore] = useState(0);
  const [alive, setAlive] = useState(true);
  const [started, setStarted] = useState(false);
  const spawnFood = (snake: {x:number,y:number}[]) => {
    let f: {x:number,y:number};
    do { f = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) }; } while (snake.some(s => s.x===f!.x && s.y===f!.y));
    return f;
  };
  const startGame = useCallback(() => {
    const snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    gameRef.current = { snake, food: spawnFood(snake), dir:{x:1,y:0}, alive:true, score:0 };
    setScore(0); setAlive(true); setStarted(true);
  }, []);
  useEffect(() => {
    if (!started) return;
    const handleKey = (e: KeyboardEvent) => {
      const d = gameRef.current.dir;
      if (e.key==="ArrowUp"&&d.y!==1) { e.preventDefault(); gameRef.current.dir={x:0,y:-1}; }
      else if (e.key==="ArrowDown"&&d.y!==-1) { e.preventDefault(); gameRef.current.dir={x:0,y:1}; }
      else if (e.key==="ArrowLeft"&&d.x!==1) { e.preventDefault(); gameRef.current.dir={x:-1,y:0}; }
      else if (e.key==="ArrowRight"&&d.x!==-1) { e.preventDefault(); gameRef.current.dir={x:1,y:0}; }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [started]);
  useEffect(() => {
    if (!started || !alive) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const loop = setInterval(() => {
      const g = gameRef.current; if (!g.alive) return;
      const head = { x: g.snake[0].x+g.dir.x, y: g.snake[0].y+g.dir.y };
      if (head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS||g.snake.some(s=>s.x===head.x&&s.y===head.y)) { g.alive=false; setAlive(false); return; }
      const ate = head.x===g.food.x && head.y===g.food.y;
      const newSnake = [head,...g.snake]; if (!ate) newSnake.pop(); else { g.food=spawnFood(newSnake); g.score++; setScore(g.score); }
      g.snake = newSnake;
      ctx.fillStyle="#050f05"; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.strokeStyle="#0a2a0a"; ctx.lineWidth=0.5;
      for (let i=0;i<COLS;i++){ctx.beginPath();ctx.moveTo(i*CELL,0);ctx.lineTo(i*CELL,canvas.height);ctx.stroke();}
      for (let i=0;i<ROWS;i++){ctx.beginPath();ctx.moveTo(0,i*CELL);ctx.lineTo(canvas.width,i*CELL);ctx.stroke();}
      g.snake.forEach((s,i) => { const alpha=1-(i/g.snake.length)*0.75; ctx.fillStyle=`rgba(74,222,128,${alpha})`; rrect(ctx,s.x*CELL+1,s.y*CELL+1,CELL-2,CELL-2,3); ctx.fill(); });
      ctx.shadowColor="#22c55e"; ctx.shadowBlur=12; ctx.fillStyle="#86efac"; rrect(ctx,head.x*CELL+1,head.y*CELL+1,CELL-2,CELL-2,4); ctx.fill();
      ctx.shadowColor="#f97316"; ctx.shadowBlur=16; ctx.fillStyle="#fb923c"; rrect(ctx,g.food.x*CELL+3,g.food.y*CELL+3,CELL-6,CELL-6,CELL/2-3); ctx.fill(); ctx.shadowBlur=0;
    }, 120);
    return () => clearInterval(loop);
  }, [started, alive]);
  return (
    <div className="flex-1 overflow-y-auto p-4" style={{background:"linear-gradient(180deg,#020d02 0%,#050f05 100%)"}}>
      <div className="max-w-lg mx-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-green-400 hover:text-green-200 text-sm mb-4 transition-colors" data-testid="button-snake-back"><ChevronLeft size={16} /> Back to Platform</button>
        <div className="text-center mb-4">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">🐍 Pulse Snake</h1>
          <p className="text-green-400 text-sm mt-1">Classic snake — powered by Pulse energy</p>
          <div className="mt-2"><span className="text-yellow-400 font-bold text-xl">Score: {score}</span></div>
        </div>
        <canvas ref={canvasRef} width={COLS*CELL} height={ROWS*CELL} className="rounded-2xl border border-green-500/20 mx-auto block" data-testid="canvas-snake" />
        {!started && (<div className="text-center mt-4"><button onClick={startGame} data-testid="button-start-snake" className="px-8 py-3 bg-green-500 text-white font-extrabold rounded-2xl hover:bg-green-400 transition-all shadow-xl">▶ START GAME</button><p className="text-green-400/50 text-xs mt-2">Arrow keys or D-pad below to move</p></div>)}
        {!alive && started && (<div className="text-center mt-4 bg-red-500/20 border border-red-500/40 rounded-2xl p-5"><div className="text-2xl mb-1 font-extrabold text-white">💀 Game Over!</div><div className="text-green-400 mb-3">Final Score: <strong>{score}</strong></div><button onClick={startGame} data-testid="button-restart-snake" className="px-8 py-3 bg-green-500 text-white font-extrabold rounded-2xl hover:bg-green-400 transition-all">Play Again</button></div>)}
        <div className="mt-4 flex flex-col items-center gap-1.5">
          <button onClick={()=>{if(gameRef.current.dir.y!==1)gameRef.current.dir={x:0,y:-1};}} data-testid="snake-up" className="w-12 h-12 bg-white/10 rounded-xl text-white text-xl hover:bg-white/20 active:bg-white/30 transition-all">↑</button>
          <div className="flex gap-1.5">
            <button onClick={()=>{if(gameRef.current.dir.x!==1)gameRef.current.dir={x:-1,y:0};}} data-testid="snake-left" className="w-12 h-12 bg-white/10 rounded-xl text-white text-xl hover:bg-white/20 active:bg-white/30 transition-all">←</button>
            <button onClick={()=>{if(gameRef.current.dir.y!==-1)gameRef.current.dir={x:0,y:1};}} data-testid="snake-down" className="w-12 h-12 bg-white/10 rounded-xl text-white text-xl hover:bg-white/20 active:bg-white/30 transition-all">↓</button>
            <button onClick={()=>{if(gameRef.current.dir.x!==-1)gameRef.current.dir={x:1,y:0};}} data-testid="snake-right" className="w-12 h-12 bg-white/10 rounded-xl text-white text-xl hover:bg-white/20 active:bg-white/30 transition-all">→</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberSurgeGame({ onBack }: { onBack: () => void }) {
  const EMPTY4 = () => Array.from({length:4}, () => Array(4).fill(0)) as number[][];
  const addTile = (board: number[][]) => {
    const empty: [number,number][] = [];
    board.forEach((row,r) => row.forEach((v,c) => { if (!v) empty.push([r,c]); }));
    if (!empty.length) return board;
    const [r,c] = empty[Math.floor(Math.random()*empty.length)];
    const nb = board.map(row=>[...row]); nb[r][c] = Math.random()<0.9?2:4; return nb;
  };
  const compress = (row: number[]) => {
    const vals = row.filter(v=>v>0); const merged: number[] = []; let i=0;
    while (i<vals.length) { if (i+1<vals.length&&vals[i]===vals[i+1]) { merged.push(vals[i]*2); i+=2; } else { merged.push(vals[i]); i++; } }
    while (merged.length<4) merged.push(0); return merged;
  };
  const moveL = (b: number[][]) => b.map(compress);
  const moveR = (b: number[][]) => b.map(row=>compress([...row].reverse()).reverse());
  const transpose = (b: number[][]) => b[0].map((_,c)=>b.map(row=>row[c]));
  const moveU = (b: number[][]) => transpose(moveL(transpose(b)));
  const moveD = (b: number[][]) => transpose(moveR(transpose(b)));
  const [board, setBoard] = useState<number[][]>(() => addTile(addTile(EMPTY4())));
  const [score, setScore] = useState(0); const [best, setBest] = useState(0); const [over, setOver] = useState(false); const [won, setWon] = useState(false);
  const move = useCallback((dir: string) => {
    if (over) return;
    setBoard(prev => {
      let nb = dir==="left"?moveL(prev):dir==="right"?moveR(prev):dir==="up"?moveU(prev):moveD(prev);
      if (JSON.stringify(nb)===JSON.stringify(prev)) return prev;
      const wn = addTile(nb);
      const s = wn.flat().reduce((a,v)=>a+v,0); setScore(s); setBest(b=>Math.max(b,s));
      if (wn.flat().includes(2048)) setWon(true);
      const canMove = ["left","right","up","down"].some(d=>{ const t=d==="left"?moveL(wn):d==="right"?moveR(wn):d==="up"?moveU(wn):moveD(wn); return JSON.stringify(t)!==JSON.stringify(wn); });
      if (!canMove) setOver(true);
      return wn;
    });
  }, [over]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){e.preventDefault();move(e.key.replace("Arrow","").toLowerCase());} };
    window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h);
  }, [move]);
  const restart = () => { setBoard(addTile(addTile(EMPTY4()))); setScore(0); setOver(false); setWon(false); };
  const TC: Record<number,string> = {0:"bg-gray-800/40 text-transparent",2:"bg-slate-500 text-white",4:"bg-slate-400 text-white",8:"bg-orange-600 text-white",16:"bg-orange-500 text-white",32:"bg-amber-500 text-white",64:"bg-amber-400 text-gray-900",128:"bg-yellow-400 text-gray-900",256:"bg-yellow-300 text-gray-900",512:"bg-lime-400 text-gray-900",1024:"bg-green-400 text-gray-900",2048:"bg-emerald-300 text-gray-900"};
  return (
    <div className="flex-1 overflow-y-auto p-4" style={{background:"linear-gradient(180deg,#1a0800 0%,#2a1200 100%)"}}>
      <div className="max-w-sm mx-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-orange-400 hover:text-orange-200 text-sm mb-4" data-testid="button-surge-back"><ChevronLeft size={16}/> Back to Platform</button>
        <div className="flex items-center justify-between mb-4">
          <div><h1 className="text-2xl font-extrabold text-white">🔢 Number Surge</h1><p className="text-orange-400 text-xs">Merge tiles — reach 2048</p></div>
          <div className="flex gap-2">
            <div className="text-center bg-orange-900/50 rounded-xl px-3 py-1.5 border border-orange-500/30"><div className="text-orange-400 text-[10px] font-bold">SCORE</div><div className="text-white font-extrabold">{score}</div></div>
            <div className="text-center bg-orange-900/50 rounded-xl px-3 py-1.5 border border-orange-500/30"><div className="text-orange-400 text-[10px] font-bold">BEST</div><div className="text-white font-extrabold">{best}</div></div>
          </div>
        </div>
        {(over||won)&&(<div className={`mb-4 p-4 rounded-2xl text-center border ${won?"bg-yellow-500/20 border-yellow-500/40":"bg-red-500/20 border-red-500/40"}`}><div className="text-white font-extrabold text-xl mb-2">{won?"🏆 You reached 2048!":"💀 Game Over!"}</div><button onClick={restart} data-testid="button-restart-surge" className="px-6 py-2 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-400 transition-all">Play Again</button></div>)}
        <div className="bg-gray-900/80 rounded-2xl p-2 border border-orange-500/20">
          {board.map((row,r)=>(<div key={r} className="flex gap-2 mb-2 last:mb-0">{row.map((val,c)=>(<div key={c} data-testid={`surge-cell-${r}-${c}`} className={`flex-1 aspect-square rounded-xl flex items-center justify-center font-extrabold text-sm transition-all ${TC[val]||"bg-emerald-300 text-gray-900"} shadow`}>{val||""}</div>))}</div>))}
        </div>
        <div className="mt-4 flex flex-col items-center gap-1.5">
          <button onClick={()=>move("up")} data-testid="surge-up" className="w-12 h-12 bg-white/10 rounded-xl text-white text-xl hover:bg-white/20 transition-all">↑</button>
          <div className="flex gap-1.5">
            <button onClick={()=>move("left")} data-testid="surge-left" className="w-12 h-12 bg-white/10 rounded-xl text-white text-xl hover:bg-white/20 transition-all">←</button>
            <button onClick={()=>move("down")} data-testid="surge-down" className="w-12 h-12 bg-white/10 rounded-xl text-white text-xl hover:bg-white/20 transition-all">↓</button>
            <button onClick={()=>move("right")} data-testid="surge-right" className="w-12 h-12 bg-white/10 rounded-xl text-white text-xl hover:bg-white/20 transition-all">→</button>
          </div>
        </div>
        <p className="text-center text-orange-400/40 text-xs mt-2">Arrow keys or tap D-pad to merge</p>
      </div>
    </div>
  );
}

function scrambleWord(w: string): string {
  const a = w.split(""); for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a.join("")===w?scrambleWord(w):a.join("");
}
function WordScrambleGame({ onBack }: { onBack: () => void }) {
  const words = useRef(SCRAMBLE_WORDS.slice().sort(()=>Math.random()-0.5));
  const [idx, setIdx] = useState(0); const [scrambled, setScrambled] = useState(()=>scrambleWord(words.current[0]));
  const [guess, setGuess] = useState(""); const [score, setScore] = useState(0); const [timeLeft, setTimeLeft] = useState(45);
  const [status, setStatus] = useState<"playing"|"correct"|"wrong"|"done">("playing"); const [skips, setSkips] = useState(3);
  const currentWord = words.current[idx] || "";
  useEffect(() => { if (currentWord) setScrambled(scrambleWord(currentWord)); setGuess(""); }, [idx, currentWord]);
  useEffect(() => {
    if (status==="done") return;
    const t = setInterval(()=>setTimeLeft(p=>{if(p<=1){clearInterval(t);setStatus("done");return 0;}return p-1;}),1000);
    return ()=>clearInterval(t);
  }, [status]);
  const submit = () => {
    if (guess.trim().toLowerCase()===currentWord) { setScore(s=>s+10+Math.floor(timeLeft/5)); setStatus("correct"); setTimeout(()=>{setStatus("playing");if(idx>=words.current.length-1)setStatus("done");else setIdx(i=>i+1);},700); }
    else { setStatus("wrong"); setTimeout(()=>setStatus("playing"),600); }
    setGuess("");
  };
  const skip = () => { if(skips<=0)return; setSkips(s=>s-1); if(idx>=words.current.length-1){setStatus("done");}else setIdx(i=>i+1); };
  const restart = () => { words.current=SCRAMBLE_WORDS.slice().sort(()=>Math.random()-0.5); setIdx(0); setScore(0); setTimeLeft(45); setStatus("playing"); setSkips(3); };
  return (
    <div className="flex-1 overflow-y-auto p-4" style={{background:"linear-gradient(180deg,#0a0a18 0%,#141428 100%)"}}>
      <div className="max-w-md mx-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm mb-4" data-testid="button-scramble-back"><ChevronLeft size={16}/> Back to Platform</button>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-white">🔤 Word Scramble</h1>
          <p className="text-slate-400 text-sm mt-1">Unscramble Quantum vocabulary against the clock</p>
          <div className="flex justify-center gap-6 mt-3">
            <div className="text-center"><div className="text-2xl font-extrabold text-white">{score}</div><div className="text-slate-400 text-xs">SCORE</div></div>
            <div className="text-center"><div className={`text-2xl font-extrabold ${timeLeft<10?"text-red-400 animate-pulse":"text-white"}`}>{timeLeft}s</div><div className="text-slate-400 text-xs">TIME</div></div>
            <div className="text-center"><div className="text-2xl font-extrabold text-white">{idx}/{words.current.length}</div><div className="text-slate-400 text-xs">WORDS</div></div>
          </div>
        </div>
        {status==="done"?(
          <div className="text-center bg-yellow-500/20 border border-yellow-500/40 rounded-2xl p-8">
            <div className="text-5xl mb-2">🏆</div><div className="text-white font-extrabold text-2xl mb-1">Game Complete!</div>
            <div className="text-yellow-400 text-2xl font-bold mb-4">{score} pts</div>
            <button onClick={restart} data-testid="button-restart-scramble" className="px-8 py-3 bg-yellow-400 text-gray-900 font-extrabold rounded-2xl hover:bg-yellow-300 transition-all">Play Again</button>
          </div>
        ):(
          <div className="space-y-4">
            <div className={`bg-slate-700/50 rounded-2xl p-6 text-center border transition-all ${status==="correct"?"border-green-500/60 bg-green-500/10":status==="wrong"?"border-red-500/60 bg-red-500/10":"border-slate-600/40"}`}>
              <div className="text-xs text-slate-400 mb-3 uppercase font-bold tracking-widest">Unscramble this word</div>
              <div className="flex justify-center gap-2 flex-wrap">
                {scrambled.split("").map((ch,i)=>(<span key={i} className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center text-white font-extrabold text-lg uppercase border border-slate-500/50 shadow">{ch}</span>))}
              </div>
            </div>
            <div className="flex gap-2">
              <input data-testid="input-scramble-guess" value={guess} onChange={e=>setGuess(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white font-bold text-center text-lg focus:outline-none focus:border-white/40 placeholder:text-slate-500 uppercase" placeholder="Your answer..." autoComplete="off" spellCheck={false} />
            </div>
            <div className="flex gap-2">
              <button onClick={submit} data-testid="button-submit-scramble" className="flex-1 py-3 bg-white text-slate-900 font-extrabold rounded-xl hover:bg-gray-100 transition-all shadow-lg">SUBMIT</button>
              <button onClick={skip} disabled={skips<=0} data-testid="button-skip-scramble" className="px-4 py-3 bg-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-600 transition-all disabled:opacity-40">Skip ({skips})</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OmegaTriviaGame({ onBack }: { onBack: () => void }) {
  type TriviaQ = { question: string; options: string[]; correct: number; };
  const [phase, setPhase] = useState<"select"|"loading"|"playing"|"done">("select");
  const [topic, setTopic] = useState("Science"); const [questions, setQuestions] = useState<TriviaQ[]>([]);
  const [qIdx, setQIdx] = useState(0); const [score, setScore] = useState(0); const [selected, setSelected] = useState<number|null>(null); const [error, setError] = useState("");
  const load = async () => {
    setPhase("loading"); setError("");
    try {
      const res = await fetch("/api/chat/completions", { method:"POST", credentials:"include", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ messages:[{role:"user",content:`Generate 5 trivia questions about "${topic}". Return ONLY a valid JSON array with no markdown, no extra text. Each object must have: "question" (string), "options" (exactly 4 strings), "correct" (number 0-3).`}] }) });
      const data = await res.json(); const text = data.content||"";
      const m = text.match(/\[[\s\S]*\]/); if (!m) throw new Error("no json");
      const qs: TriviaQ[] = JSON.parse(m[0]); if (!qs.length) throw new Error("empty");
      setQuestions(qs); setQIdx(0); setScore(0); setSelected(null); setPhase("playing");
    } catch { setError("Failed to generate questions. Please try again."); setPhase("select"); }
  };
  const answer = (i: number) => {
    if (selected!==null) return; setSelected(i);
    if (i===questions[qIdx].correct) setScore(s=>s+20);
    setTimeout(()=>{ if (qIdx+1>=questions.length){setPhase("done");}else{setQIdx(q=>q+1);setSelected(null);} }, 1200);
  };
  const q = questions[qIdx]; const pct = questions.length ? Math.round((score/(questions.length*20))*100) : 0;
  return (
    <div className="flex-1 overflow-y-auto p-4" style={{background:"linear-gradient(180deg,#000d1a 0%,#001830 100%)"}}>
      <div className="max-w-lg mx-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-blue-300 hover:text-white text-sm mb-4" data-testid="button-trivia-back"><ChevronLeft size={16}/> Back to Platform</button>
        <div className="text-center mb-6"><h1 className="text-3xl font-extrabold text-white">🎯 Omega Trivia</h1><p className="text-blue-300 text-sm mt-1">AI-generated questions on any topic</p></div>
        {phase==="select"&&(<div className="space-y-4">
          <div className="bg-blue-900/30 rounded-2xl p-5 border border-blue-500/30">
            <div className="text-white font-bold mb-3 text-sm">Select a Topic</div>
            <div className="flex flex-wrap gap-2">{TRIVIA_TOPICS.map(t=>(<button key={t} onClick={()=>setTopic(t)} data-testid={`trivia-topic-${t.toLowerCase().replace(/\s+/g,"-")}`} className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${topic===t?"bg-blue-500 text-white shadow-lg scale-105":"bg-blue-900/50 text-blue-300 border border-blue-500/30 hover:bg-blue-800/50"}`}>{t}</button>))}</div>
          </div>
          {error&&<div className="text-red-400 text-sm bg-red-500/10 rounded-xl p-3 border border-red-500/30">{error}</div>}
          <button onClick={load} data-testid="button-start-trivia" className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-extrabold rounded-2xl hover:from-blue-400 hover:to-cyan-400 transition-all shadow-xl text-lg">⚡ Generate Trivia — {topic}</button>
        </div>)}
        {phase==="loading"&&(<div className="text-center py-16"><div className="text-5xl mb-4 animate-pulse">🧠</div><div className="text-white font-bold text-lg mb-2">AI is generating your questions...</div><div className="text-blue-400 text-sm">Topic: {topic}</div></div>)}
        {phase==="playing"&&q&&(<div className="space-y-4">
          <div className="flex justify-between items-center text-sm"><span className="text-blue-300 font-bold">Question {qIdx+1}/{questions.length}</span><span className="text-yellow-400 font-bold">Score: {score}</span></div>
          <div className="w-full bg-blue-900/50 rounded-full h-1.5"><div className="bg-blue-400 h-1.5 rounded-full transition-all" style={{width:`${(qIdx/questions.length)*100}%`}}/></div>
          <div className="bg-blue-900/30 rounded-2xl p-5 border border-blue-500/30"><div className="text-white font-bold text-lg leading-relaxed">{q.question}</div></div>
          <div className="grid gap-2">{q.options.map((opt,i)=>{ const isC=i===q.correct; const isSel=i===selected; return (<button key={i} onClick={()=>answer(i)} disabled={selected!==null} data-testid={`trivia-option-${i}`} className={`p-3.5 rounded-xl text-left font-semibold text-sm transition-all border ${selected!==null?(isC?"bg-green-500/30 border-green-400/60 text-green-200":isSel?"bg-red-500/30 border-red-400/60 text-red-200":"bg-blue-900/20 border-blue-500/20 text-blue-300/50"):"bg-blue-900/40 border-blue-500/30 text-blue-100 hover:bg-blue-800/50 hover:border-blue-400/50"}`}><span className="font-bold mr-2 text-blue-400">{["A","B","C","D"][i]}.</span>{opt}{selected!==null&&isC&&<span className="float-right">✓</span>}{selected!==null&&isSel&&!isC&&<span className="float-right">✗</span>}</button>); })}</div>
        </div>)}
        {phase==="done"&&(<div className="text-center space-y-4">
          <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-2xl p-8 border border-blue-500/30">
            <div className="text-6xl mb-4">{pct>=80?"🏆":pct>=60?"⭐":"🎯"}</div>
            <div className="text-white font-extrabold text-2xl mb-1">Trivia Complete!</div>
            <div className="text-blue-300 text-sm mb-3">Topic: {topic}</div>
            <div className="text-4xl font-extrabold text-yellow-400 mb-1">{score}<span className="text-lg text-blue-300">/{questions.length*20}</span></div>
            <div className="text-blue-300 text-sm mb-6">{pct}% — {pct>=80?"Genius! 🧠":pct>=60?"Well done! ⭐":"Keep learning! 📚"}</div>
            <div className="flex gap-3 justify-center">
              <button onClick={()=>{setPhase("select");setQuestions([]);}} data-testid="button-trivia-new-topic" className="px-6 py-3 bg-blue-500 text-white font-extrabold rounded-xl hover:bg-blue-400 transition-all">New Topic</button>
              <button onClick={load} data-testid="button-trivia-retry" className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all">Try Again</button>
            </div>
          </div>
        </div>)}
      </div>
    </div>
  );
}

function CreatorZoneGame({ onBack }: { onBack: () => void }) {
  const [template, setTemplate] = useState<string|null>(null); const [prompt, setPrompt] = useState(""); const [loading, setLoading] = useState(false); const [gameHTML, setGameHTML] = useState(""); const [error, setError] = useState("");
  const generate = async () => {
    if (!prompt.trim()&&!template) return; setLoading(true); setError(""); setGameHTML("");
    const ctx = template ? `Template: ${CREATOR_TEMPLATES.find(t=>t.id===template)?.name}. ` : "";
    try {
      const res = await fetch("/api/chat/completions", { method:"POST", credentials:"include", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ messages:[{role:"user",content:`${ctx}${prompt||`Create a ${template} game`}. Generate a complete, self-contained HTML5 game that works inside a sandboxed iframe. Use only HTML, CSS, and vanilla JavaScript with no external libraries. The game must be playable immediately on load. Make it visually impressive with a dark background, colorful elements, and a visible score display. Return ONLY the complete HTML document starting with <!DOCTYPE html>, with no explanation and no markdown.`}] }) });
      const data = await res.json(); const text = data.content||"";
      const m = text.match(/<!DOCTYPE html[\s\S]*/i)||text.match(/<html[\s\S]*/i);
      if (m) { setGameHTML(m[0]); } else { setError("Could not extract the game. Try a simpler or more specific prompt."); }
    } catch { setError("Generation failed. Please try again."); }
    setLoading(false);
  };
  return (
    <div className="flex-1 overflow-y-auto p-4" style={{background:"linear-gradient(180deg,#0d0020 0%,#180035 100%)"}}>
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-violet-300 hover:text-white text-sm mb-4" data-testid="button-creator-back"><ChevronLeft size={16}/> Back to Platform</button>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">⚡ CREATOR ZONE — POWERED BY AI</div>
          <h1 className="text-3xl font-extrabold text-white">🎮 Build a Game with AI</h1>
          <p className="text-violet-300 text-sm mt-1">Describe any game — the AI builds it instantly</p>
        </div>
        {!gameHTML&&(<div className="space-y-5">
          <div><div className="text-white font-bold mb-2 text-sm">1. Pick a Template <span className="text-violet-400 font-normal text-xs">(optional)</span></div>
            <div className="grid grid-cols-3 gap-2">{CREATOR_TEMPLATES.map(t=>(<button key={t.id} onClick={()=>setTemplate(template===t.id?null:t.id)} data-testid={`creator-template-${t.id}`} className={`p-3 rounded-xl text-left transition-all border ${template===t.id?"bg-violet-500/30 border-violet-400/60":"bg-violet-900/20 border-violet-500/20 hover:bg-violet-900/40 hover:border-violet-500/40"}`}><div className="text-2xl mb-1">{t.icon}</div><div className="text-white font-bold text-xs">{t.name}</div><div className="text-violet-300 text-[10px] mt-0.5">{t.desc}</div></button>))}</div>
          </div>
          <div><div className="text-white font-bold mb-2 text-sm">2. Describe Your Game</div>
            <textarea data-testid="input-creator-prompt" value={prompt} onChange={e=>setPrompt(e.target.value)} rows={3} placeholder={`e.g. "A neon space shooter where the player fires lasers at incoming asteroids. Dark background, glowing effects, score counter."`} className="w-full px-4 py-3 bg-violet-900/20 border border-violet-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-violet-400/60 placeholder:text-violet-300/40 resize-none" />
          </div>
          {error&&<div className="text-red-400 text-sm bg-red-500/10 rounded-xl p-3 border border-red-500/30">{error}</div>}
          <button onClick={generate} disabled={loading||(!prompt.trim()&&!template)} data-testid="button-generate-game" className="w-full py-4 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-extrabold rounded-2xl hover:from-violet-400 hover:to-pink-400 transition-all shadow-xl text-lg disabled:opacity-40">
            {loading?"⚡ AI is building your game...":"⚡ Generate My Game"}
          </button>
          {loading&&<p className="text-center text-violet-300/60 text-xs animate-pulse">Usually takes 15-25 seconds. The AI is writing every line of your game from scratch...</p>}
        </div>)}
        {gameHTML&&(<div className="space-y-4">
          <div className="flex items-center justify-between"><div className="text-green-400 font-bold text-sm">✓ Your game is ready — play it below!</div><button onClick={()=>setGameHTML("")} data-testid="button-creator-rebuild" className="px-3 py-1.5 bg-violet-500/20 border border-violet-500/30 text-violet-300 rounded-lg text-xs hover:bg-violet-500/30">Build Another</button></div>
          <iframe srcDoc={gameHTML} sandbox="allow-scripts" className="w-full rounded-2xl border border-violet-500/30 bg-black" style={{height:"480px"}} title="AI-Generated Game" data-testid="iframe-created-game" />
          <p className="text-violet-300/40 text-xs text-center">This game was written entirely by AI. No human wrote this code.</p>
        </div>)}
      </div>
    </div>
  );
}

/* ======================================================================
   SOVEREIGN GAME LIBRARY — 60+ game registry + 10 new native games
   ====================================================================== */
type LibraryGame={id:string,title:string,emoji:string,genres:string[],desc:string,type:'builtin'|'iframe'|'external',mode?:GameMode,url?:string,players:string,difficulty:'Easy'|'Medium'|'Hard',ai:boolean,featured?:boolean};
const GAME_LIBRARY:LibraryGame[]=[
  // ── BUILT-IN NATIVE (click → instant play) ──
  {id:'gl-2048',title:'2048',emoji:'🔢',genres:['puzzle'],desc:'Slide tiles, merge numbers, reach 2048. Infinite replayability.',type:'builtin',mode:'puzzle2048',players:'1P',difficulty:'Medium',ai:false,featured:true},
  {id:'gl-wordle',title:'Quantum Wordle',emoji:'🟩',genres:['word'],desc:'Guess the 5-letter word in 6 tries. Green/Yellow/Gray feedback.',type:'builtin',mode:'wordle',players:'1P',difficulty:'Medium',ai:false,featured:true},
  {id:'gl-pong',title:'Pong vs AI',emoji:'🏓',genres:['arcade'],desc:'Classic Pong with an adaptive AI opponent. Serve, rally, score.',type:'builtin',mode:'pong',players:'1P vs AI',difficulty:'Medium',ai:true,featured:true},
  {id:'gl-spaceinvaders',title:'Space Invaders',emoji:'👾',genres:['arcade','action'],desc:'Defend Earth from descending alien waves. Classic retro shooter.',type:'builtin',mode:'spaceinvaders',players:'1P',difficulty:'Medium',ai:true,featured:true},
  {id:'gl-flappy',title:'Flappy Pulse',emoji:'🐦',genres:['arcade'],desc:'Tap to flap through pipes. Every run is different. Beat your high score.',type:'builtin',mode:'flappy',players:'1P',difficulty:'Hard',ai:false,featured:true},
  {id:'gl-minesweeper',title:'Minesweeper',emoji:'💣',genres:['puzzle','strategy'],desc:'Reveal cells, avoid mines, flag the field. 3 difficulty modes.',type:'builtin',mode:'minesweeper',players:'1P',difficulty:'Medium',ai:false,featured:true},
  {id:'gl-simon',title:'Simon Says',emoji:'🟢',genres:['memory','arcade'],desc:'Watch the color sequence, repeat it. Each round gets longer.',type:'builtin',mode:'simon',players:'1P',difficulty:'Easy',ai:false},
  {id:'gl-tictactoe',title:'Tic Tac Toe vs AI',emoji:'❌',genres:['strategy'],desc:'Beat an unbeatable minimax AI. Can you find the draw?',type:'builtin',mode:'tictactoe',players:'1P vs AI',difficulty:'Hard',ai:true},
  {id:'gl-connect4',title:'Connect Four vs AI',emoji:'🔴',genres:['strategy'],desc:'Drop pieces, connect 4 before the AI does. Adaptive intelligence.',type:'builtin',mode:'connect4',players:'1P vs AI',difficulty:'Medium',ai:true},
  {id:'gl-hangman',title:'Hangman',emoji:'🎯',genres:['word'],desc:'Guess the word before the man is hanged. 200+ word vocabulary.',type:'builtin',mode:'hangman',players:'1P',difficulty:'Easy',ai:false},
  {id:'gl-blackjack',title:'Blackjack vs AI',emoji:'♠️',genres:['casino'],desc:'Beat the AI dealer to 21. Hit, Stand, Double Down. Full chip economy.',type:'builtin',mode:'blackjack',players:'1P vs AI',difficulty:'Medium',ai:true},
  {id:'gl-memory',title:'Memory Match',emoji:'🧠',genres:['memory','puzzle'],desc:'Flip cards and find matching pairs. Race for minimum moves.',type:'builtin',mode:'memory',players:'1P',difficulty:'Easy',ai:false},
  {id:'gl-rps',title:'Rock Paper Scissors',emoji:'✊',genres:['casual'],desc:'Classic RPS with AI trash talk. Best of 5 rounds.',type:'builtin',mode:'rps',players:'1P vs AI',difficulty:'Easy',ai:true},
  {id:'gl-snake',title:'Pulse Snake',emoji:'🐍',genres:['arcade'],desc:'Eat food, grow your snake. Compete against AI pathfinding.',type:'builtin',mode:'snake',players:'1P',difficulty:'Medium',ai:true},
  {id:'gl-surge',title:'Number Surge',emoji:'⚡',genres:['puzzle','casual'],desc:'Math speed challenge — answer before the timer runs out.',type:'builtin',mode:'surge',players:'1P',difficulty:'Medium',ai:false},
  {id:'gl-scramble',title:'Word Scramble',emoji:'📝',genres:['word'],desc:'Unscramble the jumbled word before time runs out.',type:'builtin',mode:'scramble',players:'1P',difficulty:'Easy',ai:false},
  {id:'gl-trivia',title:'Omega Trivia',emoji:'🧪',genres:['trivia'],desc:'AI-generated trivia questions across every topic imaginable.',type:'builtin',mode:'trivia',players:'1P',difficulty:'Medium',ai:true},
  {id:'gl-creator',title:'AI Game Creator',emoji:'⚡',genres:['ai','creative'],desc:'Describe any game → Groq AI builds it in 10 seconds. Infinite games.',type:'builtin',mode:'creator',players:'1P',difficulty:'Easy',ai:true,featured:true},
  // ── EMULATOR ZONE CONSOLES ──
  {id:'gl-emu',title:'Emulator Zone',emoji:'🕹️',genres:['retro','emulator'],desc:'NES, SNES, GBA, N64, PS1, Sega, DOS, Arcade — upload any ROM, play instantly.',type:'builtin',mode:'emulator',players:'1P/2P',difficulty:'Medium',ai:false,featured:true},
  // ── OPEN-SOURCE EXTERNAL GAMES ──
  {id:'gl-floppybird',title:'Floppy Bird',emoji:'🐤',genres:['arcade'],desc:'Open-source Flappy Bird. Tap to flap, avoid the pipes.',type:'iframe',url:'https://nebez.github.io/floppybird/',players:'1P',difficulty:'Hard',ai:false},
  {id:'gl-2048ext',title:'2048 (Original)',emoji:'🔢',genres:['puzzle'],desc:'The original 2048 by Gabriele Cirulli. MIT licensed.',type:'iframe',url:'https://play2048.co',players:'1P',difficulty:'Medium',ai:false},
  {id:'gl-tetris',title:'Jstris Tetris',emoji:'🟦',genres:['puzzle','arcade'],desc:'Competitive browser Tetris. Sprint, Ultra, and multiplayer modes.',type:'iframe',url:'https://jstris.jezevec10.com',players:'1P+',difficulty:'Medium',ai:false},
  {id:'gl-chess',title:'Chess.com',emoji:'♟️',genres:['strategy'],desc:'World-class chess. Play vs AI or online opponents.',type:'external',url:'https://www.chess.com/play/computer',players:'1P vs AI',difficulty:'Hard',ai:true},
  {id:'gl-checkers',title:'Checkers vs AI',emoji:'🔴',genres:['strategy'],desc:'Classic checkers with adjustable AI difficulty.',type:'external',url:'https://www.gamesforthebrain.com/game/checkers/',players:'1P vs AI',difficulty:'Easy',ai:true},
  {id:'gl-sudoku',title:'Sudoku',emoji:'🔢',genres:['puzzle'],desc:'Daily Sudoku puzzles — easy to expert difficulty.',type:'external',url:'https://sudoku.com',players:'1P',difficulty:'Medium',ai:false},
  {id:'gl-wordle-nyt',title:'NYT Wordle',emoji:'🟩',genres:['word'],desc:'The New York Times Wordle. One puzzle per day.',type:'external',url:'https://www.nytimes.com/games/wordle',players:'1P',difficulty:'Medium',ai:false},
  {id:'gl-solitaire',title:'Solitaire',emoji:'🃏',genres:['card','casual'],desc:'Classic Klondike Solitaire. Unlimited undos.',type:'iframe',url:'https://solitaired.com',players:'1P',difficulty:'Easy',ai:false},
  {id:'gl-doom',title:'DOOM (WebGL)',emoji:'💀',genres:['fps','action'],desc:'DOOM running in browser via WebAssembly. Kill demons.',type:'iframe',url:'https://silentspacemarine.com/',players:'1P',difficulty:'Medium',ai:false},
  {id:'gl-diablo',title:'Diablo I Web',emoji:'🔥',genres:['rpg','action'],desc:'Diablo 1 in browser via DevilutionX. Hack and slash.',type:'iframe',url:'https://d07riv.github.io/diabloweb/',players:'1P',difficulty:'Hard',ai:false},
  {id:'gl-freecell',title:'FreeCell',emoji:'♠️',genres:['card','puzzle'],desc:'Classic FreeCell solitaire. Every deal is winnable.',type:'external',url:'https://www.free-freecell-solitaire.com/',players:'1P',difficulty:'Medium',ai:false},
  {id:'gl-mah',title:'Mahjong',emoji:'🀄',genres:['puzzle'],desc:'Classic Mahjong tile matching puzzle.',type:'external',url:'https://www.mahjong.nl/',players:'1P',difficulty:'Medium',ai:false},
  {id:'gl-8ball',title:'8-Ball Pool',emoji:'🎱',genres:['sports','casual'],desc:'Browser pool/billiards with physics engine.',type:'external',url:'https://www.miniclip.com/games/8-ball-pool-multiplayer/en/',players:'1P+',difficulty:'Medium',ai:false},
  {id:'gl-pac',title:'Pac-Man Doodle',emoji:'👻',genres:['arcade'],desc:'Google\'s Pac-Man doodle. Classic arcade action.',type:'external',url:'https://www.google.com/logos/2010/pacman10-i.html',players:'1P',difficulty:'Medium',ai:false},
  {id:'gl-superhex',title:'SuperHexagon',emoji:'🔷',genres:['arcade'],desc:'Intense geometry rhythm game. Survive as long as possible.',type:'external',url:'https://superhexagon.com/superh/',players:'1P',difficulty:'Hard',ai:false},
  {id:'gl-slither',title:'Slither.io',emoji:'🐍',genres:['io','multiplayer'],desc:'Massively multiplayer snake. Eat, grow, dominate.',type:'iframe',url:'https://slither.io',players:'Multi',difficulty:'Medium',ai:false},
  {id:'gl-agar',title:'Agar.io',emoji:'🔵',genres:['io','multiplayer'],desc:'Eat smaller cells, avoid larger ones. Classic .io game.',type:'iframe',url:'https://agar.io',players:'Multi',difficulty:'Easy',ai:false},
  {id:'gl-skribbl',title:'Skribbl.io',emoji:'🎨',genres:['multiplayer','casual'],desc:'Draw and guess with online players. Pictionary-style.',type:'external',url:'https://skribbl.io',players:'Multi',difficulty:'Easy',ai:false},
  {id:'gl-krunker',title:'Krunker.io',emoji:'🔫',genres:['fps','io','multiplayer'],desc:'Browser FPS. No install needed. Multiple maps and modes.',type:'external',url:'https://krunker.io',players:'Multi',difficulty:'Medium',ai:false},
  {id:'gl-minecraft',title:'Eaglercraft',emoji:'⛏️',genres:['sandbox'],desc:'Minecraft in browser. Build, explore, survive.',type:'external',url:'https://eaglercraft.com/mc/1.8-eaglercraft/new/',players:'1P',difficulty:'Medium',ai:false},
  {id:'gl-terraria',title:'ClassiCube',emoji:'🧱',genres:['sandbox'],desc:'Browser sandbox builder inspired by classic Minecraft.',type:'iframe',url:'https://www.classicube.net/server/play',players:'1P+',difficulty:'Easy',ai:false},
  {id:'gl-candy',title:'Candy Crush Style',emoji:'🍬',genres:['puzzle','casual'],desc:'Match-3 candy puzzle game. No install.',type:'external',url:'https://candycrushsaga.com',players:'1P',difficulty:'Easy',ai:false},
  {id:'gl-geoguessr',title:'GeoGuessr',emoji:'🌍',genres:['trivia','educational'],desc:'Guess where in the world you are from Street View.',type:'external',url:'https://www.geoguessr.com',players:'1P',difficulty:'Hard',ai:false},
  {id:'gl-typeracer',title:'TypeRacer',emoji:'⌨️',genres:['casual','educational'],desc:'Race others by typing famous quotes. Improve your WPM.',type:'external',url:'https://play.typeracer.com',players:'Multi',difficulty:'Medium',ai:false},
  {id:'gl-coderun',title:'CodeRun Challenge',emoji:'💻',genres:['educational','ai'],desc:'AI-generated coding puzzles. Solve to advance.',type:'builtin',mode:'creator',players:'1P',difficulty:'Hard',ai:true},
  {id:'gl-neuropulse',title:'NeuroPulse AI Battle',emoji:'🤖',genres:['ai','strategy'],desc:'Battle AI-generated enemies in a turn-based arena. Powered by Groq.',type:'builtin',mode:'creator',players:'1P vs AI',difficulty:'Hard',ai:true},
  // ── RETRO & HOMEBREW ──
  {id:'gl-pixart',title:'Pixel Art Studio',emoji:'🎨',genres:['creative','retro'],desc:'Create pixel art with NES/GB/Pico-8 palettes. Export to PNG.',type:'builtin',mode:'pixelart',players:'1P',difficulty:'Easy',ai:false},
  {id:'gl-rompatch',title:'ROM Patcher',emoji:'🔧',genres:['retro','tool'],desc:'Apply IPS/BPS patches to ROMs. Play fan translations.',type:'builtin',mode:'rompatch',players:'1P',difficulty:'Easy',ai:false},
  {id:'gl-opengames',title:'Open Games Zone',emoji:'🌐',genres:['retro','open-source'],desc:'Curated legal open-source games. DOOM, Diablo, chess, and more.',type:'builtin',mode:'opengames',players:'1P',difficulty:'Medium',ai:false},
];

const GAME_GENRES=['all','arcade','puzzle','strategy','word','memory','casino','trivia','fps','rpg','sandbox','multiplayer','retro','ai','creative','card','sports','educational','io'];

function GameLibrary({onBack,setGameMode}:{onBack:()=>void,setGameMode:(m:GameMode)=>void}){
  const [genre,setGenre]=useState('all');
  const [search,setSearch]=useState('');
  const [favs,setFavs]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('game_favs')||'[]');}catch{return [];}});
  const [played,setPlayed]=useState<Record<string,number>>(()=>{try{return JSON.parse(localStorage.getItem('game_played')||'{}');}catch{return {};}});
  const [sortBy,setSortBy]=useState<'featured'|'name'|'played'|'favs'>('featured');

  const toggleFav=(id:string)=>{
    const next=favs.includes(id)?favs.filter(f=>f!==id):[...favs,id];
    setFavs(next);localStorage.setItem('game_favs',JSON.stringify(next));
  };

  const launch=(g:LibraryGame)=>{
    if(g.type==='builtin'&&g.mode){
      const cnt={...played,[g.id]:(played[g.id]||0)+1};
      setPlayed(cnt);localStorage.setItem('game_played',JSON.stringify(cnt));
      setGameMode(g.mode);
    } else {
      window.open(g.url,'_blank');
    }
  };

  const filtered=GAME_LIBRARY.filter(g=>{
    const matchGenre=genre==='all'||g.genres.includes(genre);
    const matchSearch=!search||g.title.toLowerCase().includes(search.toLowerCase())||g.desc.toLowerCase().includes(search.toLowerCase());
    return matchGenre&&matchSearch;
  }).sort((a,b)=>{
    if(sortBy==='name')return a.title.localeCompare(b.title);
    if(sortBy==='played')return (played[b.id]||0)-(played[a.id]||0);
    if(sortBy==='favs'){const fa=favs.includes(a.id)?1:0;const fb=favs.includes(b.id)?1:0;return fb-fa;}
    const fa=a.featured?1:0;const fb=b.featured?1:0;return fb-fa;
  });

  const native=filtered.filter(g=>g.type==='builtin');
  const external=filtered.filter(g=>g.type!=='builtin');

  const diffColor=(d:string)=>d==='Easy'?'text-green-400 bg-green-500/10 border-green-500/20':d==='Medium'?'text-yellow-400 bg-yellow-500/10 border-yellow-500/20':'text-red-400 bg-red-500/10 border-red-500/20';

  return(
    <div className="flex-1 flex flex-col" style={{background:'linear-gradient(180deg,#040410 0%,#0a0a20 100%)'}}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/8 flex-shrink-0" style={{background:'rgba(8,8,20,0.98)'}}>
        <div className="flex items-center gap-2 mb-3">
          <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs transition-colors"><ChevronLeft size={14}/>Back</button>
          <div className="w-px h-4 bg-white/10"/>
          <span className="text-sm font-black text-white">🎮 Sovereign Game Library</span>
          <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30 font-bold">{GAME_LIBRARY.filter(g=>g.type==='builtin').length} INSTANT PLAY</span>
          <span className="text-[9px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/30 font-bold">{GAME_LIBRARY.length} TOTAL</span>
        </div>
        {/* Search + Sort */}
        <div className="flex gap-2 mb-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search games..." data-testid="input-game-search"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2 placeholder-white/20 focus:outline-none focus:border-violet-500/40"/>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="bg-white/5 border border-white/10 rounded-xl text-white/60 text-xs px-2 py-2 focus:outline-none">
            <option value="featured">⭐ Featured</option>
            <option value="played">🎮 Most Played</option>
            <option value="favs">❤️ Favorites</option>
            <option value="name">🔤 A-Z</option>
          </select>
        </div>
        {/* Genre tabs */}
        <div className="flex gap-1 overflow-x-auto" style={{scrollbarWidth:'none'}}>
          {GAME_GENRES.map(g=><button key={g} onClick={()=>setGenre(g)} className={cn("flex-shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all capitalize",genre===g?"bg-white text-gray-900":"bg-white/5 text-white/35 hover:text-white/60 border border-white/8")}>{g}</button>)}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* Featured banner for native games */}
        {genre==='all'&&!search&&(
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] text-green-400 font-black uppercase tracking-widest">⚡ Instant Play — No Ads, No Accounts, No Downloads ({native.length})</span>
              <div className="flex-1 h-px bg-green-500/15"/>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {native.filter(g=>g.featured).map(g=>(
                <div key={g.id} onClick={()=>launch(g)} data-testid={`game-lib-${g.id}`} role="button" tabIndex={0} onKeyDown={e=>e.key==='Enter'&&launch(g)}
                  className="group relative p-3.5 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  style={{background:'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(59,130,246,0.1))',border:'1px solid rgba(139,92,246,0.25)'}}>
                  <div className="absolute top-2 right-2" onClick={e=>e.stopPropagation()}>
                    <button onClick={e=>{e.stopPropagation();toggleFav(g.id);}} className={cn("text-xs transition-all",favs.includes(g.id)?"text-red-400":"text-white/20 hover:text-white/50")}>❤</button>
                  </div>
                  <div className="text-3xl mb-2">{g.emoji}</div>
                  <div className="text-white font-black text-xs mb-0.5">{g.title}</div>
                  <div className="text-white/40 text-[9px] line-clamp-2 mb-2">{g.desc}</div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className={cn("text-[7px] px-1.5 py-0.5 rounded-full border font-bold",diffColor(g.difficulty))}>{g.difficulty}</span>
                    {g.ai&&<span className="text-[7px] px-1.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-bold">AI</span>}
                    <span className="text-green-400 text-[9px] font-black ml-auto group-hover:text-green-300">▶ PLAY</span>
                  </div>
                  {played[g.id]&&<div className="text-white/20 text-[8px] mt-1">{played[g.id]} plays</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All native games */}
        <div className="mb-5">
          {(genre!=='all'||search)&&<div className="flex items-center gap-2 mb-3"><span className="text-[9px] text-green-400 font-black uppercase tracking-widest">⚡ Instant Play ({native.length})</span><div className="flex-1 h-px bg-green-500/15"/></div>}
          {genre==='all'&&!search&&<div className="flex items-center gap-2 mb-3"><span className="text-[9px] text-white/30 font-black uppercase tracking-widest">All Instant-Play Games</span><div className="flex-1 h-px bg-white/5"/></div>}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {native.filter(g=>!g.featured||genre!=='all'||search).map(g=>(
              <div key={g.id} onClick={()=>launch(g)} data-testid={`game-lib-${g.id}`} role="button" tabIndex={0} onKeyDown={e=>e.key==='Enter'&&launch(g)}
                className="group p-3 rounded-xl bg-white/[0.025] border border-white/8 hover:border-white/20 hover:bg-white/[0.04] transition-all text-left cursor-pointer">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-2xl">{g.emoji}</span>
                  <button onClick={e=>{e.stopPropagation();toggleFav(g.id);}} className={cn("text-xs transition-all",favs.includes(g.id)?"text-red-400":"text-white/15 hover:text-white/40")}>❤</button>
                </div>
                <div className="text-white font-bold text-xs mb-0.5 truncate">{g.title}</div>
                <div className="text-white/35 text-[9px] line-clamp-2 mb-1.5">{g.desc}</div>
                <div className="flex items-center gap-1">
                  <span className={cn("text-[7px] px-1 py-0.5 rounded border font-bold",diffColor(g.difficulty))}>{g.difficulty}</span>
                  {g.ai&&<span className="text-[7px] px-1 py-0.5 rounded border border-cyan-500/30 text-cyan-400">AI</span>}
                  <span className="text-green-400 text-[9px] font-black ml-auto">▶</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* External games */}
        {external.length>0&&(
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] text-white/25 font-black uppercase tracking-widest">🌐 External Games — opens in new tab ({external.length})</span>
              <div className="flex-1 h-px bg-white/5"/>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {external.map(g=>(
                <button key={g.id} onClick={()=>launch(g)} data-testid={`game-lib-${g.id}`}
                  className="group p-3 rounded-xl bg-white/[0.015] border border-white/5 hover:border-white/15 hover:bg-white/[0.03] transition-all text-left">
                  <div className="text-2xl mb-1">{g.emoji}</div>
                  <div className="text-white/70 font-bold text-xs mb-0.5 truncate">{g.title}</div>
                  <div className="text-white/25 text-[9px] line-clamp-2 mb-1.5">{g.desc}</div>
                  <div className="flex items-center gap-1">
                    <span className={cn("text-[7px] px-1 py-0.5 rounded border font-bold",diffColor(g.difficulty))}>{g.difficulty}</span>
                    <span className="text-white/20 text-[9px] ml-auto group-hover:text-white/50">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== GAME: 2048 ===== */
function Game2048({onBack}:{onBack:()=>void}){
  const init=():number[][]=>Array(4).fill(null).map(()=>Array(4).fill(0));
  const addRnd=(b:number[][])=>{const e:number[][]=[];b.forEach((r,i)=>r.forEach((c,j)=>{if(!c)e.push([i,j]);}));if(!e.length)return b;const[i,j]=e[Math.floor(Math.random()*e.length)];const nb=b.map(r=>[...r]);nb[i][j]=Math.random()<0.9?2:4;return nb;};
  const [board,setBoard]=useState(()=>addRnd(addRnd(init())));
  const [score,setScore]=useState(0);
  const [best,setBest]=useState(()=>parseInt(localStorage.getItem('2048_best')||'0'));
  const [won,setWon]=useState(false);
  const [over,setOver]=useState(false);

  const slideRow=(row:number[]):{row:number[],pts:number}=>{
    const r=row.filter(v=>v);let pts=0;
    for(let i=0;i<r.length-1;i++){if(r[i]===r[i+1]){r[i]*=2;pts+=r[i];r.splice(i+1,1);}}
    while(r.length<4)r.push(0);return{row:r,pts};
  };

  const move=useCallback((dir:'left'|'right'|'up'|'down')=>{
    if(over||won)return;
    let b=board.map(r=>[...r]);let totalPts=0;let changed=false;
    if(dir==='left'||dir==='right'){
      b=b.map(row=>{const rev=dir==='right'?[...row].reverse():row;const{row:r,pts}=slideRow(rev);totalPts+=pts;const res=dir==='right'?r.reverse():r;if(JSON.stringify(res)!==JSON.stringify(row))changed=true;return res;});
    } else {
      const T=(m:number[][])=>m[0].map((_,i)=>m.map(r=>r[i]));
      let t=T(b);
      t=t.map(col=>{const rev=dir==='down'?[...col].reverse():col;const{row:r,pts}=slideRow(rev);totalPts+=pts;const res=dir==='down'?r.reverse():r;if(JSON.stringify(res)!==JSON.stringify(col))changed=true;return res;});
      b=T(t);
    }
    if(!changed)return;
    const nb=addRnd(b);
    const newScore=score+totalPts;
    if(newScore>best){setBest(newScore);localStorage.setItem('2048_best',String(newScore));}
    setScore(newScore);setBoard(nb);
    if(nb.some(r=>r.some(c=>c===2048)))setWon(true);
    const hasMove=nb.some((r,i)=>r.some((v,j)=>!v||(i<3&&nb[i+1][j]===v)||(j<3&&nb[i][j+1]===v)));
    if(!hasMove)setOver(true);
  },[board,score,best,over,won]);

  useEffect(()=>{
    const k=(e:KeyboardEvent)=>{if(e.key==='ArrowLeft')move('left');else if(e.key==='ArrowRight')move('right');else if(e.key==='ArrowUp')move('up');else if(e.key==='ArrowDown')move('down');};
    window.addEventListener('keydown',k);return()=>window.removeEventListener('keydown',k);
  },[move]);

  const tileColor=(v:number)=>{const m:Record<number,string>={0:'bg-white/5',2:'bg-amber-100 text-gray-800',4:'bg-amber-200 text-gray-800',8:'bg-orange-400 text-white',16:'bg-orange-500 text-white',32:'bg-red-500 text-white',64:'bg-red-600 text-white',128:'bg-yellow-400 text-white',256:'bg-yellow-500 text-white',512:'bg-yellow-600 text-white',1024:'bg-violet-500 text-white',2048:'bg-violet-700 text-white'};return m[v]||'bg-violet-900 text-white';};

  const reset=()=>{setBoard(addRnd(addRnd(init())));setScore(0);setWon(false);setOver(false);};

  return(
    <div className="flex-1 flex flex-col items-center" style={{background:'linear-gradient(180deg,#1a1000,#2a1500)'}}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 w-full" style={{background:'rgba(20,10,0,0.98)'}}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs"><ChevronLeft size={14}/>Back</button>
        <div className="w-px h-4 bg-white/10"/>
        <span className="text-sm font-black text-white">🔢 2048</span>
        <div className="flex gap-3 ml-auto">
          <div className="text-center"><div className="text-[9px] text-white/30">SCORE</div><div className="text-white font-black text-sm">{score}</div></div>
          <div className="text-center"><div className="text-[9px] text-white/30">BEST</div><div className="text-yellow-400 font-black text-sm">{best}</div></div>
          <button onClick={reset} className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold hover:bg-amber-500/30">New</button>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        {(won||over)&&<div className={cn("px-6 py-3 rounded-2xl text-center font-black",won?"bg-yellow-400/20 border border-yellow-400/40 text-yellow-300":"bg-red-500/20 border border-red-500/30 text-red-300")}>{won?'🎉 You reached 2048!':'💀 Game Over'}<button onClick={reset} className="block mx-auto mt-2 px-4 py-1.5 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20">Play Again</button></div>}
        <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl" style={{background:'rgba(255,255,255,0.05)'}}>
          {board.map((row,i)=>row.map((val,j)=>(
            <div key={`${i}-${j}`} className={cn("w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center font-black transition-all",tileColor(val))}>
              <span style={{fontSize:val>999?'14px':val>99?'18px':'22px'}}>{val||''}</span>
            </div>
          )))}
        </div>
        <div className="text-white/20 text-xs text-center">Use arrow keys or swipe to move tiles</div>
        <div className="grid grid-cols-3 gap-2">
          {[['↑','up'],['←','left'],['↓','down'],['→','right']].map(([lbl,dir])=>(
            dir==='up'?<div key="empty1"/>:
            <button key={dir} onClick={()=>move(dir as any)} className="w-12 h-10 rounded-xl bg-white/5 border border-white/10 text-white/60 text-lg hover:bg-white/10 active:bg-white/20 transition-all">{lbl}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== GAME: WORDLE ===== */
const WORDLE_WORDS=['crane','slate','audio','house','piano','brain','flame','cloud','brave','chest','dream','eagle','frost','grind','heart','ivory','jewel','knave','lemon','magic','nerve','ocean','prize','queen','rival','shade','tiger','ultra','vivid','witch','xenon','yield','zebra','blaze','coast','draft','elite','fancy','ghost','hinge','image','joust','karma','laser','march','night','ozone','pixel','quilt','rover','swift','table','umbra','vapor','world','exist','fault','flair','gleam','hydra','input','joker','knock','lunar','mercy','noble','optic','pedal','quest','repay','skill','thorn','unity','voice','weave','extra','flint','grail','haste','index','jaded','karma','lyric','midst','nymph','oxide','prank','quirk','realm','scold','taunt','usher','vigil','whirl','exhale','flame','glass'];
type WordleGuess={word:string,colors:('green'|'yellow'|'gray')[]};
function WordleGame({onBack}:{onBack:()=>void}){
  const pick=()=>WORDLE_WORDS[Math.floor(Math.random()*WORDLE_WORDS.length)].toUpperCase();
  const [target,setTarget]=useState(pick);
  const [guesses,setGuesses]=useState<WordleGuess[]>([]);
  const [current,setCurrent]=useState('');
  const [done,setDone]=useState(false);
  const [won,setWon]=useState(false);
  const {toast}=useToast();

  const submit=()=>{
    if(current.length!==5){toast({title:'Word must be 5 letters'});return;}
    const g=current.toUpperCase();
    const colors:('green'|'yellow'|'gray')[]=Array(5).fill('gray');
    const rem=[...target];
    g.split('').forEach((c,i)=>{if(c===target[i]){colors[i]='green';rem[i]=' ';}});
    g.split('').forEach((c,i)=>{if(colors[i]!=='green'){const ri=rem.indexOf(c);if(ri!==-1){colors[i]='yellow';rem[ri]=' ';}}});
    const ng=[...guesses,{word:g,colors}];
    setGuesses(ng);setCurrent('');
    if(g===target){setDone(true);setWon(true);}
    else if(ng.length===6){setDone(true);}
  };

  const KEYS='QWERTYUIOP|ASDFGHJKL|ZXCVBNM'.split('|').map(r=>r.split(''));
  const keyColor=(k:string)=>{
    const inGreen=guesses.some(g=>g.word.split('').some((c,i)=>c===k&&g.colors[i]==='green'));
    const inYellow=guesses.some(g=>g.word.split('').some((c,i)=>c===k&&g.colors[i]==='yellow'));
    const inGray=guesses.some(g=>g.word.split('').some((c,i)=>c===k&&g.colors[i]==='gray'));
    return inGreen?'bg-green-500 text-white':inYellow?'bg-yellow-500 text-white':inGray?'bg-gray-600 text-white/50':'bg-white/10 text-white';
  };

  const reset=()=>{setTarget(pick());setGuesses([]);setCurrent('');setDone(false);setWon(false);};

  return(
    <div className="flex-1 flex flex-col items-center" style={{background:'linear-gradient(180deg,#050510,#0a0a1a)'}}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 w-full" style={{background:'rgba(5,5,16,0.98)'}}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs"><ChevronLeft size={14}/>Back</button>
        <div className="w-px h-4 bg-white/10"/>
        <span className="text-sm font-black text-white">🟩 Quantum Wordle</span>
        <span className="text-white/30 text-xs ml-auto">{guesses.length}/6 guesses</span>
        <button onClick={reset} className="px-3 py-1 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-[10px] font-bold">New Word</button>
      </div>
      <div className="flex-1 overflow-auto p-4 flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
        {done&&<div className={cn("px-4 py-2 rounded-xl text-center font-black text-sm",won?"bg-green-500/20 border border-green-500/30 text-green-300":"bg-red-500/20 border border-red-500/30 text-red-300")}>{won?`🎉 Brilliant! ${guesses.length}/6`:`💀 Answer: ${target}`}<button onClick={reset} className="block mx-auto mt-1 px-3 py-1 rounded bg-white/10 text-xs">Play Again</button></div>}
        {/* Grid */}
        <div className="space-y-1.5">
          {Array(6).fill(null).map((_,ri)=>{
            const g=guesses[ri];
            const isCurrent=ri===guesses.length&&!done;
            return(
              <div key={ri} className="flex gap-1.5">
                {Array(5).fill(null).map((_,ci)=>{
                  const letter=g?g.word[ci]:isCurrent?current[ci]:'';
                  const color=g?g.colors[ci]==='green'?'bg-green-500 border-green-500':g.colors[ci]==='yellow'?'bg-yellow-500 border-yellow-500':'bg-gray-600 border-gray-600':isCurrent&&letter?'border-white/50 bg-white/5':'border-white/15 bg-white/[0.02]';
                  return(<div key={ci} className={cn("w-12 h-12 rounded-lg border-2 flex items-center justify-center font-black text-white text-lg transition-all",color)}>{letter}</div>);
                })}
              </div>
            );
          })}
        </div>
        {/* Keyboard */}
        {!done&&<div className="space-y-1 w-full">
          {KEYS.map((row,ri)=>(
            <div key={ri} className="flex justify-center gap-1">
              {row.map(k=><button key={k} onClick={()=>setCurrent(p=>p.length<5?p+k:p)} className={cn("h-10 rounded-lg font-bold text-xs transition-all",k.length===1?'w-8':k==='←'?'w-12 px-2':'w-12 px-2',keyColor(k))}>{k}</button>)}
              {ri===2&&<><button onClick={()=>setCurrent(p=>p.slice(0,-1))} className="h-10 w-12 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20">⌫</button><button onClick={submit} className="h-10 w-14 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-[10px] font-bold hover:bg-green-500/30">Enter</button></>}
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}

/* ===== GAME: PONG VS AI ===== */
function PongGame({onBack}:{onBack:()=>void}){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const stateRef=useRef({ball:{x:400,y:200,vx:3,vy:2},p1:{y:160},p2:{y:160},s1:0,s2:0,running:true});
  const [score,setScore]=useState({p1:0,p2:0});
  const [gameOver,setGameOver]=useState(false);
  const keysRef=useRef<Set<string>>(new Set());
  const animRef=useRef<number>(0);

  const PH=40,PW=8,BW=400*2,BH=200*2;

  useEffect(()=>{
    const c=canvasRef.current;if(!c)return;
    c.width=BW;c.height=BH;
    const ctx=c.getContext('2d')!;
    const s=stateRef.current;

    const draw=()=>{
      ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,BW,BH);
      ctx.setLineDash([10,10]);ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(BW/2,0);ctx.lineTo(BW/2,BH);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='rgba(255,255,255,0.8)';
      ctx.fillRect(20,s.p1.y,PW,PH*2);
      ctx.fillRect(BW-28,s.p2.y,PW,PH*2);
      ctx.beginPath();ctx.arc(s.ball.x,s.ball.y,10,0,Math.PI*2);ctx.fillStyle='#a78bfa';ctx.fill();
      ctx.fillStyle='white';ctx.font='bold 48px monospace';ctx.textAlign='center';
      ctx.fillText(String(s.s1),BW/4,60);ctx.fillText(String(s.s2),3*BW/4,60);
    };

    const loop=()=>{
      if(!s.running)return;
      // Player paddle
      if(keysRef.current.has('ArrowUp')&&s.p1.y>0)s.p1.y-=7;
      if(keysRef.current.has('ArrowDown')&&s.p1.y<BH-PH*2)s.p1.y+=7;
      if(keysRef.current.has('w')&&s.p1.y>0)s.p1.y-=7;
      if(keysRef.current.has('s')&&s.p1.y<BH-PH*2)s.p1.y+=7;
      // AI
      const aiCenter=s.p2.y+PH;
      if(aiCenter<s.ball.y-5)s.p2.y=Math.min(BH-PH*2,s.p2.y+5);
      else if(aiCenter>s.ball.y+5)s.p2.y=Math.max(0,s.p2.y-5);
      // Ball
      s.ball.x+=s.ball.vx;s.ball.y+=s.ball.vy;
      if(s.ball.y<10||s.ball.y>BH-10)s.ball.vy*=-1;
      // Paddle collisions
      if(s.ball.x<36&&s.ball.y>s.p1.y&&s.ball.y<s.p1.y+PH*2){s.ball.vx=Math.abs(s.ball.vx)*1.05;s.ball.vy+=(s.ball.y-s.p1.y-PH)/PH*2;}
      if(s.ball.x>BW-36&&s.ball.y>s.p2.y&&s.ball.y<s.p2.y+PH*2){s.ball.vx=-Math.abs(s.ball.vx)*1.05;s.ball.vy+=(s.ball.y-s.p2.y-PH)/PH*2;}
      // Scoring
      if(s.ball.x<0){s.s2++;setScore({p1:s.s1,p2:s.s2});Object.assign(s.ball,{x:BW/2,y:BH/2,vx:3,vy:2});}
      if(s.ball.x>BW){s.s1++;setScore({p1:s.s1,p2:s.s2});Object.assign(s.ball,{x:BW/2,y:BH/2,vx:-3,vy:2});}
      if(s.s1>=7||s.s2>=7){s.running=false;setGameOver(true);}
      draw();
      animRef.current=requestAnimationFrame(loop);
    };
    animRef.current=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animRef.current);
  },[]);

  useEffect(()=>{
    const d=(e:KeyboardEvent)=>keysRef.current.add(e.key);
    const u=(e:KeyboardEvent)=>keysRef.current.delete(e.key);
    window.addEventListener('keydown',d);window.addEventListener('keyup',u);
    return()=>{window.removeEventListener('keydown',d);window.removeEventListener('keyup',u);};
  },[]);

  const reset=()=>{const s=stateRef.current;Object.assign(s,{ball:{x:400,y:200,vx:3,vy:2},p1:{y:160},p2:{y:160},s1:0,s2:0,running:true});setScore({p1:0,p2:0});setGameOver(false);};

  return(
    <div className="flex-1 flex flex-col" style={{background:'linear-gradient(180deg,#040410,#0a0a20)'}}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8" style={{background:'rgba(4,4,16,0.98)'}}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs"><ChevronLeft size={14}/>Back</button>
        <div className="w-px h-4 bg-white/10"/>
        <span className="text-sm font-black text-white">🏓 Pong vs AI</span>
        <span className="text-white/40 text-xs ml-auto">Arrow Keys / W-S to move • First to 7 wins</span>
        {gameOver&&<button onClick={reset} className="px-3 py-1 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[10px] font-bold">Rematch</button>}
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        {gameOver&&<div className="absolute z-10 px-6 py-4 rounded-2xl text-center font-black text-lg bg-black/80 border border-violet-500/30 text-white">{score.p1>=7?'🎉 YOU WIN!':'🤖 AI WINS'}<button onClick={reset} className="block mx-auto mt-2 px-4 py-2 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-bold">Play Again</button></div>}
        <canvas ref={canvasRef} className="rounded-2xl max-w-full" style={{maxHeight:'400px',border:'1px solid rgba(255,255,255,0.1)'}}/>
      </div>
    </div>
  );
}

/* ===== GAME: MINESWEEPER ===== */
type Cell={mine:boolean,revealed:boolean,flagged:boolean,adj:number};
function MinesweeperGame({onBack}:{onBack:()=>void}){
  const MODES={easy:{r:9,c:9,m:10},medium:{r:16,c:16,m:40},hard:{r:16,c:30,m:99}};
  const [mode,setMode]=useState<keyof typeof MODES>('easy');
  const [grid,setGrid]=useState<Cell[][]>([]);
  const [status,setStatus]=useState<'idle'|'playing'|'won'|'lost'>('idle');
  const [flagCount,setFlagCount]=useState(0);
  const [time,setTime]=useState(0);
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);

  const buildGrid=(r:number,c:number,mines:number,safeR:number,safeC:number):Cell[][]=>{
    const g:Cell[][]=Array(r).fill(null).map(()=>Array(c).fill(null).map(()=>({mine:false,revealed:false,flagged:false,adj:0})));
    let placed=0;
    while(placed<mines){const ri=Math.floor(Math.random()*r),ci=Math.floor(Math.random()*c);if(!g[ri][ci].mine&&!(ri===safeR&&ci===safeC)){g[ri][ci].mine=true;placed++;}}
    for(let i=0;i<r;i++)for(let j=0;j<c;j++){let a=0;for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){const ni=i+di,nj=j+dj;if(ni>=0&&ni<r&&nj>=0&&nj<c&&g[ni][nj].mine)a++;}g[i][j].adj=a;}
    return g;
  };

  const reveal=(g:Cell[][],r:number,c:number):Cell[][]=>{
    const ng=g.map(row=>row.map(cell=>({...cell})));
    const queue=[[r,c]];const rows=ng.length,cols=ng[0].length;
    while(queue.length){const[ri,ci]=queue.shift()!;if(ng[ri][ci].revealed||ng[ri][ci].flagged)continue;ng[ri][ci].revealed=true;if(!ng[ri][ci].adj&&!ng[ri][ci].mine)for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){const ni=ri+di,nj=ci+dj;if(ni>=0&&ni<rows&&nj>=0&&nj<cols&&!ng[ni][nj].revealed)queue.push([ni,nj]);}}
    return ng;
  };

  const handleClick=(ri:number,ci:number)=>{
    if(status==='won'||status==='lost')return;
    let g=grid;
    if(status==='idle'){const{r,c,m}=MODES[mode];g=buildGrid(r,c,m,ri,ci);setStatus('playing');timerRef.current=setInterval(()=>setTime(t=>t+1),1000);}
    if(g[ri][ci].flagged||g[ri][ci].revealed)return;
    if(g[ri][ci].mine){
      const ng=g.map(row=>row.map(cell=>({...cell,revealed:cell.mine?true:cell.revealed})));
      setGrid(ng);setStatus('lost');if(timerRef.current)clearInterval(timerRef.current);return;
    }
    const ng=reveal(g,ri,ci);
    setGrid(ng);
    const{r,c,m}=MODES[mode];
    const safe=r*c-m;const rev=ng.reduce((s,row)=>s+row.filter(cell=>cell.revealed).length,0);
    if(rev>=safe){setStatus('won');if(timerRef.current)clearInterval(timerRef.current);}
  };

  const handleFlag=(e:React.MouseEvent,ri:number,ci:number)=>{
    e.preventDefault();if(status==='won'||status==='lost'||status==='idle')return;
    const ng=grid.map(row=>row.map(cell=>({...cell})));
    if(ng[ri][ci].revealed)return;
    ng[ri][ci].flagged=!ng[ri][ci].flagged;
    setFlagCount(f=>f+(ng[ri][ci].flagged?1:-1));setGrid(ng);
  };

  const reset=()=>{setGrid([]);setStatus('idle');setFlagCount(0);setTime(0);if(timerRef.current)clearInterval(timerRef.current);};

  const cellColor=(cell:Cell,ri:number,ci:number)=>{if(!cell.revealed)return 'bg-white/10 hover:bg-white/15 border-white/20';if(cell.mine)return 'bg-red-600 border-red-500';return 'bg-white/[0.04] border-white/8';};
  const adjColor=['','text-blue-400','text-green-400','text-red-400','text-violet-400','text-orange-400','text-cyan-400','text-pink-400','text-white'];

  return(
    <div className="flex-1 flex flex-col" style={{background:'linear-gradient(180deg,#020408,#050a10)'}}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 flex-wrap" style={{background:'rgba(2,4,8,0.98)'}}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs"><ChevronLeft size={14}/>Back</button>
        <div className="w-px h-4 bg-white/10"/>
        <span className="text-sm font-black text-white">💣 Minesweeper</span>
        <div className="flex gap-2 ml-auto items-center">
          <span className="text-white/40 text-xs">⏱ {time}s</span>
          <span className="text-red-400 text-xs">🚩 {MODES[mode].m-flagCount}</span>
          {['easy','medium','hard'].map(m=><button key={m} onClick={()=>{setMode(m as any);reset();}} className={cn("px-2 py-1 rounded text-[10px] font-bold capitalize border transition-all",mode===m?"border-cyan-500 bg-cyan-500/20 text-cyan-300":"border-white/10 text-white/30 hover:text-white/60")}>{m}</button>)}
          <button onClick={reset} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white/40 text-[10px] hover:text-white/70">🔄</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 flex flex-col items-center gap-3">
        {(status==='won'||status==='lost')&&<div className={cn("px-4 py-2 rounded-xl text-center font-black text-sm",status==='won'?"bg-green-500/20 border border-green-500/30 text-green-300":"bg-red-500/20 border border-red-500/30 text-red-300")}>{status==='won'?`🎉 Cleared! ${time}s`:'💥 BOOM!'}<button onClick={reset} className="block mx-auto mt-1 px-3 py-1 rounded bg-white/10 text-xs">Play Again</button></div>}
        {status==='idle'&&<div className="text-white/40 text-sm">Click any cell to start</div>}
        {(status!=='idle'||grid.length>0)&&(
          <div className="overflow-auto">
            <div style={{display:'grid',gridTemplateColumns:`repeat(${MODES[mode].c},1fr)`,gap:'2px'}}>
              {(grid.length?grid:Array(MODES[mode].r).fill(null).map(()=>Array(MODES[mode].c).fill({mine:false,revealed:false,flagged:false,adj:0}))).map((row,ri)=>
                row.map((cell:Cell,ci:number)=>(
                  <button key={`${ri}-${ci}`} onClick={()=>handleClick(ri,ci)} onContextMenu={e=>handleFlag(e,ri,ci)}
                    className={cn("w-6 h-6 rounded text-[9px] font-black border transition-all flex items-center justify-center",cellColor(cell,ri,ci))}>
                    {cell.flagged&&!cell.revealed?'🚩':cell.revealed&&cell.mine?'💣':cell.revealed&&cell.adj>0?<span className={adjColor[cell.adj]}>{cell.adj}</span>:''}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
        <div className="text-white/20 text-[10px]">Left click: reveal • Right click / long press: flag</div>
      </div>
    </div>
  );
}

/* ===== GAME: SIMON SAYS ===== */
function SimonGame({onBack}:{onBack:()=>void}){
  const COLORS=['red','blue','green','yellow'];
  const COLOR_STYLE={red:'bg-red-500 border-red-400',blue:'bg-blue-500 border-blue-400',green:'bg-green-500 border-green-400',yellow:'bg-yellow-500 border-yellow-400'};
  const COLOR_DIM={red:'bg-red-900/50 border-red-800',blue:'bg-blue-900/50 border-blue-800',green:'bg-green-900/50 border-green-800',yellow:'bg-yellow-900/50 border-yellow-800'};
  const [seq,setSeq]=useState<string[]>([]);
  const [userSeq,setUserSeq]=useState<string[]>([]);
  const [active,setActive]=useState<string|null>(null);
  const [phase,setPhase]=useState<'idle'|'showing'|'input'|'lost'>('idle');
  const [best,setBest]=useState(0);

  const flash=(color:string,ms=400)=>new Promise<void>(res=>{setActive(color);setTimeout(()=>{setActive(null);setTimeout(res,100);},ms);});

  const showSeq=async(sequence:string[])=>{
    setPhase('showing');
    for(const c of sequence){await flash(c,500);await new Promise(r=>setTimeout(r,200));}
    setPhase('input');setUserSeq([]);
  };

  const start=()=>{const s=['red','blue','green','yellow'][Math.floor(Math.random()*4)];const ns=[s];setSeq(ns);showSeq(ns);};

  const press=async(color:string)=>{
    if(phase!=='input')return;
    await flash(color,150);
    const nu=[...userSeq,color];
    const idx=nu.length-1;
    if(nu[idx]!==seq[idx]){setPhase('lost');return;}
    if(nu.length===seq.length){
      if(seq.length>best)setBest(seq.length);
      setTimeout(()=>{const ns=[...seq,COLORS[Math.floor(Math.random()*4)]];setSeq(ns);showSeq(ns);},600);
    } else {
      setUserSeq(nu);
    }
  };

  return(
    <div className="flex-1 flex flex-col items-center" style={{background:'linear-gradient(180deg,#0a000a,#15001a)'}}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 w-full" style={{background:'rgba(10,0,10,0.98)'}}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs"><ChevronLeft size={14}/>Back</button>
        <div className="w-px h-4 bg-white/10"/>
        <span className="text-sm font-black text-white">🟢 Simon Says</span>
        <div className="ml-auto flex gap-3">
          <span className="text-white/40 text-xs">Round: <span className="text-white font-bold">{seq.length}</span></span>
          <span className="text-yellow-400 text-xs">Best: <span className="font-bold">{best}</span></span>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        {phase==='idle'&&<div className="text-center"><div className="text-6xl mb-4">🟢</div><div className="text-white font-black text-xl mb-2">Simon Says</div><div className="text-white/40 text-sm mb-6">Watch the sequence, repeat it</div><button onClick={start} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-lg shadow-xl hover:from-green-400 hover:to-emerald-500">▶ Start</button></div>}
        {phase==='lost'&&<div className="text-center"><div className="text-6xl mb-3">💀</div><div className="text-red-300 font-black text-xl">Wrong!</div><div className="text-white/40 text-sm mb-4">Round {seq.length} • Best: {best}</div><button onClick={()=>{setSeq([]);setPhase('idle');}} className="px-6 py-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-300 font-black text-lg hover:bg-red-500/30">Try Again</button></div>}
        {(phase==='showing'||phase==='input')&&(
          <div>
            <div className="text-center text-white/40 text-xs mb-4">{phase==='showing'?'Watch...':'Your turn!'}</div>
            <div className="grid grid-cols-2 gap-3">
              {COLORS.map(c=>(
                <button key={c} onClick={()=>press(c)} disabled={phase==='showing'}
                  className={cn("w-32 h-32 sm:w-40 sm:h-40 rounded-3xl border-4 transition-all font-black text-2xl",active===c?COLOR_STYLE[c as keyof typeof COLOR_STYLE]:COLOR_DIM[c as keyof typeof COLOR_DIM],phase==='input'&&'hover:scale-95 active:scale-90')}>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== GAME: TIC TAC TOE VS AI (MINIMAX) ===== */
function TicTacToeGame({onBack}:{onBack:()=>void}){
  const [board,setBoard]=useState<(string|null)[]>(Array(9).fill(null));
  const [turn,setTurn]=useState<'X'|'O'>('X');
  const [wins,setWins]=useState({X:0,O:0,draw:0});
  const [status,setStatus]=useState<'playing'|'won'|'draw'>('playing');
  const [winner,setWinner]=useState<string|null>(null);
  const [winLine,setWinLine]=useState<number[]|null>(null);
  const [aiOn,setAiOn]=useState(true);

  const LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const checkWin=(b:(string|null)[]):{winner:string,line:number[]}|null=>{for(const l of LINES){const[a,c,d]=l;if(b[a]&&b[a]===b[c]&&b[a]===b[d])return{winner:b[a]!,line:l};}return null;};

  const minimax=(b:(string|null)[],isMax:boolean,depth:number):number=>{
    const w=checkWin(b);if(w)return w.winner==='O'?10-depth:depth-10;
    if(b.every(c=>c))return 0;
    const moves=b.map((v,i)=>v?-1:i).filter(i=>i>=0);
    if(isMax){let best=-Infinity;for(const m of moves){b[m]='O';best=Math.max(best,minimax(b,false,depth+1));b[m]=null;}return best;}
    else{let best=Infinity;for(const m of moves){b[m]='X';best=Math.min(best,minimax(b,true,depth+1));b[m]=null;}return best;}
  };

  const aiMove=(b:(string|null)[])=>{
    const moves=b.map((v,i)=>v?-1:i).filter(i=>i>=0);
    let bestScore=-Infinity,bestMove=moves[0];
    for(const m of moves){b[m]='O';const s=minimax(b,false,0);b[m]=null;if(s>bestScore){bestScore=s;bestMove=m;}}
    return bestMove;
  };

  const click=(i:number)=>{
    if(board[i]||status!=='playing')return;
    const nb=[...board];nb[i]=turn;
    const w=checkWin(nb);
    if(w){setBoard(nb);setWinner(w.winner);setWinLine(w.line);setStatus('won');setWins(prev=>({...prev,[w.winner]:prev[w.winner as 'X'|'O'|'draw']+1}));return;}
    if(nb.every(c=>c)){setBoard(nb);setStatus('draw');setWins(prev=>({...prev,draw:prev.draw+1}));return;}
    if(aiOn&&turn==='X'){
      const ai=aiMove([...nb]);nb[ai]='O';
      const w2=checkWin(nb);
      if(w2){setBoard(nb);setWinner(w2.winner);setWinLine(w2.line);setStatus('won');setWins(prev=>({...prev,[w2.winner]:prev[w2.winner as 'X'|'O'|'draw']+1}));return;}
      if(nb.every(c=>c)){setBoard(nb);setStatus('draw');setWins(prev=>({...prev,draw:prev.draw+1}));return;}
      setBoard(nb);
    } else {setBoard(nb);setTurn(t=>t==='X'?'O':'X');}
  };

  const reset=()=>{setBoard(Array(9).fill(null));setTurn('X');setStatus('playing');setWinner(null);setWinLine(null);};

  return(
    <div className="flex-1 flex flex-col items-center" style={{background:'linear-gradient(180deg,#050510,#0a0a20)'}}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 w-full" style={{background:'rgba(5,5,16,0.98)'}}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs"><ChevronLeft size={14}/>Back</button>
        <div className="w-px h-4 bg-white/10"/>
        <span className="text-sm font-black text-white">❌ Tic Tac Toe</span>
        <div className="flex gap-2 ml-auto items-center text-xs">
          <span className="text-white/40">X:<span className="text-white font-bold"> {wins.X}</span></span>
          <span className="text-white/20">·</span>
          <span className="text-white/40">Draw:<span className="text-white/60 font-bold"> {wins.draw}</span></span>
          <span className="text-white/20">·</span>
          <span className="text-white/40">O:<span className="text-red-400 font-bold"> {wins.O}</span></span>
          <button onClick={()=>setAiOn(a=>!a)} className={cn("px-2 py-0.5 rounded border text-[10px] font-bold",aiOn?"border-red-400/40 bg-red-400/10 text-red-300":"border-white/10 text-white/30")}>AI {aiOn?'ON':'OFF'}</button>
          <button onClick={reset} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white/40 hover:text-white/70">🔄</button>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-5">
        {status!=='playing'&&<div className={cn("px-5 py-2.5 rounded-xl text-center font-black",status==='won'?(winner==='X'?'bg-blue-500/20 border border-blue-500/30 text-blue-300':'bg-red-500/20 border border-red-500/30 text-red-300'):'bg-white/5 border border-white/10 text-white/60')}>{status==='won'?`${winner==='X'?'🎉 You Win!':'🤖 AI Wins!'}`:' 🤝 Draw!'}<button onClick={reset} className="block mx-auto mt-1 px-3 py-1 rounded bg-white/10 text-xs">Play Again</button></div>}
        {status==='playing'&&<div className="text-white/40 text-sm">{turn==='X'?'Your turn (X)':'AI thinking...'}</div>}
        <div className="grid grid-cols-3 gap-2">
          {board.map((cell,i)=>(
            <button key={i} onClick={()=>click(i)}
              className={cn("w-24 h-24 rounded-2xl text-4xl font-black border-2 transition-all",winLine?.includes(i)?'border-yellow-400 bg-yellow-400/10':cell?'border-white/10 bg-white/5':'border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/25')}>
              {cell==='X'?<span className="text-blue-400">X</span>:cell==='O'?<span className="text-red-400">O</span>:''}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== GAME: CONNECT FOUR VS AI ===== */
function ConnectFourGame({onBack}:{onBack:()=>void}){
  const ROWS=6,COLS=7;
  const empty=():string[][]=>Array(ROWS).fill(null).map(()=>Array(COLS).fill(''));
  const [board,setBoard]=useState(empty());
  const [turn,setTurn]=useState<'R'|'Y'>('R');
  const [status,setStatus]=useState<'playing'|'won'|'draw'>('playing');
  const [winner,setWinner]=useState('');
  const [winCells,setWinCells]=useState<string[]>([]);
  const [wins,setWins]=useState({R:0,Y:0,draw:0});

  const check=(b:string[][]):{w:string,cells:string[]}|null=>{
    const dirs=[[0,1],[1,0],[1,1],[1,-1]];
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){if(!b[r][c])continue;for(const[dr,dc]of dirs){const cells=[];for(let i=0;i<4;i++){const nr=r+i*dr,nc=c+i*dc;if(nr<0||nr>=ROWS||nc<0||nc>=COLS||b[nr][nc]!==b[r][c])break;cells.push(`${nr}-${nc}`);}if(cells.length===4)return{w:b[r][c],cells};}}
    return null;
  };

  const drop=(col:number,b:string[][]=[''],player:string='R'):number=>{
    const g=b[0]===''?board:b;for(let r=ROWS-1;r>=0;r--){if(!g[r][col])return r;}return -1;
  };

  const score=(b:string[][],p:string):number=>{let s=0;const opp=p==='R'?'Y':'R';const dirs=[[0,1],[1,0],[1,1],[1,-1]];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)for(const[dr,dc]of dirs){let pc=0,oc=0;for(let i=0;i<4;i++){const nr=r+i*dr,nc=c+i*dc;if(nr<0||nr>=ROWS||nc<0||nc>=COLS)break;if(b[nr][nc]===p)pc++;else if(b[nr][nc]===opp)oc++;}if(oc===0)s+=pc**2;else if(pc===0)s-=oc**2;}return s;};

  const aiCol=(b:string[][]):number=>{let best=-Infinity,bestC=3;for(let c=0;c<COLS;c++){const r=drop(c,b,'Y');if(r<0)continue;const nb=b.map(row=>[...row]);nb[r][c]='Y';const s=score(nb,'Y');if(s>best){best=s;bestC=c;}}return bestC;};

  const play=(col:number)=>{
    if(status!=='playing')return;
    const r=drop(col);if(r<0)return;
    const nb=board.map(row=>[...row]);nb[r][col]=turn;
    const w=check(nb);
    if(w){setBoard(nb);setWinner(w.w);setWinCells(w.cells);setStatus('won');setWins(p=>({...p,[w.w]:p[w.w as 'R'|'Y']+1}));return;}
    if(nb.every(row=>row.every(c=>c))){setBoard(nb);setStatus('draw');setWins(p=>({...p,draw:p.draw+1}));return;}
    // AI move
    const ac=aiCol(nb);const ar=drop(ac,nb,'Y');if(ar>=0){nb[ar][ac]='Y';const w2=check(nb);if(w2){setBoard(nb);setWinner(w2.w);setWinCells(w2.cells);setStatus('won');setWins(p=>({...p,[w2.w]:p[w2.w as 'R'|'Y']+1}));return;}}
    setBoard(nb);
  };

  const reset=()=>{setBoard(empty());setTurn('R');setStatus('playing');setWinner('');setWinCells([]);};

  return(
    <div className="flex-1 flex flex-col items-center" style={{background:'linear-gradient(180deg,#000a1a,#001020)'}}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 w-full" style={{background:'rgba(0,5,16,0.98)'}}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs"><ChevronLeft size={14}/>Back</button>
        <div className="w-px h-4 bg-white/10"/>
        <span className="text-sm font-black text-white">🔴 Connect Four</span>
        <div className="flex gap-3 ml-auto text-xs">
          <span className="text-red-400">You(🔴): <span className="font-bold">{wins.R}</span></span>
          <span className="text-yellow-400">AI(🟡): <span className="font-bold">{wins.Y}</span></span>
          {status!=='playing'&&<button onClick={reset} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/40 hover:text-white/70">🔄</button>}
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
        {status!=='playing'&&<div className={cn("px-5 py-2 rounded-xl text-center font-black text-sm",winner==='R'?'bg-red-500/20 border border-red-500/30 text-red-300':winner==='Y'?'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300':'bg-white/5 border border-white/10 text-white/60')}>{winner==='R'?'🎉 You Win!':winner==='Y'?'🤖 AI Wins!':'🤝 Draw!'}<button onClick={reset} className="block mx-auto mt-1 px-3 py-1 rounded bg-white/10 text-xs">Play Again</button></div>}
        {status==='playing'&&<div className="text-white/40 text-sm">Your turn — click column to drop 🔴</div>}
        <div className="p-3 rounded-2xl" style={{background:'rgba(0,50,150,0.4)',border:'2px solid rgba(0,100,255,0.3)'}}>
          <div className="flex gap-1 mb-1">
            {Array(COLS).fill(null).map((_,c)=><button key={c} onClick={()=>play(c)} className="w-10 h-6 rounded text-white/20 hover:text-white/60 text-sm hover:bg-white/10 transition-all">▼</button>)}
          </div>
          {board.map((row,r)=>(
            <div key={r} className="flex gap-1 mb-1">
              {row.map((cell,c)=>(
                <div key={c} className={cn("w-10 h-10 rounded-full border-2 transition-all",winCells.includes(`${r}-${c}`)&&cell?'scale-110 border-yellow-400':cell?'border-transparent':'border-white/10 bg-white/5',cell==='R'?'bg-red-500':cell==='Y'?'bg-yellow-400':'')}/>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== GAME: FLAPPY PULSE ===== */
function FlappyGame({onBack}:{onBack:()=>void}){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const stateRef=useRef({bird:{y:200,vy:0},pipes:[] as {x:number,gap:number}[],score:0,alive:true,started:false});
  const [score,setScore]=useState(0);
  const [best,setBest]=useState(()=>parseInt(localStorage.getItem('flappy_best')||'0'));
  const [dead,setDead]=useState(false);
  const animRef=useRef<number>(0);
  const W=400,H=500,GAP=130,PIPE_W=48,BIRD_R=14;

  useEffect(()=>{
    const c=canvasRef.current;if(!c)return;c.width=W;c.height=H;
    const ctx=c.getContext('2d')!;const s=stateRef.current;
    const flap=()=>{if(!s.alive)return;if(!s.started){s.started=true;s.pipes=[{x:W,gap:150+Math.random()*200}];}s.bird.vy=-8;};
    const onKey=(e:KeyboardEvent)=>{if(e.code==='Space')flap();};
    c.addEventListener('click',flap);window.addEventListener('keydown',onKey);
    const loop=()=>{
      if(!s.started){ctx.fillStyle='#0a1a2e';ctx.fillRect(0,0,W,H);ctx.fillStyle='white';ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillText('Tap / Space to start',W/2,H/2);animRef.current=requestAnimationFrame(loop);return;}
      if(!s.alive){animRef.current=requestAnimationFrame(loop);return;}
      ctx.fillStyle='#0a1a2e';ctx.fillRect(0,0,W,H);
      // Pipes
      s.pipes.forEach(p=>{p.x-=3;ctx.fillStyle='#16a34a';ctx.fillRect(p.x,0,PIPE_W,p.gap-GAP/2);ctx.fillRect(p.x,p.gap+GAP/2,PIPE_W,H);});
      if(!s.pipes.length||s.pipes[s.pipes.length-1].x<W-200)s.pipes.push({x:W,gap:120+Math.random()*220});
      s.pipes=s.pipes.filter(p=>p.x>-PIPE_W);
      // Score
      s.pipes.forEach(p=>{if(Math.abs(p.x+PIPE_W/2-(W/3))< 4){s.score++;setScore(s.score);if(s.score>best){setBest(s.score);localStorage.setItem('flappy_best',String(s.score));}}});
      // Bird physics
      s.bird.vy+=0.5;s.bird.y+=s.bird.vy;
      // Collision
      const bx=W/3;
      const hit=s.pipes.some(p=>bx+BIRD_R>p.x&&bx-BIRD_R<p.x+PIPE_W&&(s.bird.y-BIRD_R<p.gap-GAP/2||s.bird.y+BIRD_R>p.gap+GAP/2));
      if(hit||s.bird.y+BIRD_R>H||s.bird.y-BIRD_R<0){s.alive=false;setDead(true);}
      // Draw bird
      ctx.beginPath();ctx.arc(bx,s.bird.y,BIRD_R,0,Math.PI*2);ctx.fillStyle='#fbbf24';ctx.fill();ctx.strokeStyle='#f59e0b';ctx.lineWidth=2;ctx.stroke();
      // Score text
      ctx.fillStyle='white';ctx.font='bold 28px monospace';ctx.textAlign='center';ctx.fillText(String(s.score),W/2,40);
      animRef.current=requestAnimationFrame(loop);
    };
    animRef.current=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(animRef.current);c.removeEventListener('click',flap);window.removeEventListener('keydown',onKey);};
  },[]);

  const reset=()=>{const s=stateRef.current;Object.assign(s,{bird:{y:200,vy:0},pipes:[],score:0,alive:true,started:false});setScore(0);setDead(false);};

  return(
    <div className="flex-1 flex flex-col items-center" style={{background:'linear-gradient(180deg,#0a1a2e,#0a2040)'}}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 w-full" style={{background:'rgba(10,20,40,0.98)'}}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs"><ChevronLeft size={14}/>Back</button>
        <div className="w-px h-4 bg-white/10"/>
        <span className="text-sm font-black text-white">🐦 Flappy Pulse</span>
        <div className="flex gap-3 ml-auto text-xs">
          <span className="text-white/40">Score: <span className="text-white font-black">{score}</span></span>
          <span className="text-yellow-400">Best: <span className="font-black">{best}</span></span>
          {dead&&<button onClick={reset} className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/30 text-green-300 font-bold text-[10px]">Retry</button>}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        {dead&&<div className="absolute z-10 text-center"><div className="text-4xl mb-2">💥</div><div className="text-white font-black text-xl mb-1">Score: {score}</div><div className="text-yellow-400 text-sm mb-3">Best: {best}</div><button onClick={reset} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-lg">Play Again</button></div>}
        <canvas ref={canvasRef} className="rounded-2xl" style={{maxHeight:'500px',maxWidth:'100%',border:'1px solid rgba(255,255,255,0.1)'}}/>
      </div>
    </div>
  );
}

/* ===== GAME: HANGMAN ===== */
const HANGMAN_WORDS=['javascript','quantum','artificial','intelligence','universe','platypus','symphony','cryptography','telescope','algorithm','blockchain','hypnosis','cyberpunk','mystical','carnival','adventure','submarine','kaleidoscope','catastrophe','magnificent','phenomenon','extraordinary','revolutionary','sophisticated','constellation'];
const HANG_PARTS=[
  (c:CanvasRenderingContext2D)=>{c.beginPath();c.moveTo(20,180);c.lineTo(160,180);c.stroke();},
  (c:CanvasRenderingContext2D)=>{c.beginPath();c.moveTo(60,180);c.lineTo(60,20);c.stroke();},
  (c:CanvasRenderingContext2D)=>{c.beginPath();c.moveTo(60,20);c.lineTo(120,20);c.stroke();},
  (c:CanvasRenderingContext2D)=>{c.beginPath();c.moveTo(120,20);c.lineTo(120,45);c.stroke();},
  (c:CanvasRenderingContext2D)=>{c.beginPath();c.arc(120,58,13,0,Math.PI*2);c.stroke();},
  (c:CanvasRenderingContext2D)=>{c.beginPath();c.moveTo(120,71);c.lineTo(120,120);c.stroke();},
  (c:CanvasRenderingContext2D)=>{c.beginPath();c.moveTo(120,80);c.lineTo(95,105);c.stroke();c.beginPath();c.moveTo(120,80);c.lineTo(145,105);c.stroke();},
  (c:CanvasRenderingContext2D)=>{c.beginPath();c.moveTo(120,120);c.lineTo(95,150);c.stroke();c.beginPath();c.moveTo(120,120);c.lineTo(145,150);c.stroke();},
];

function HangmanGame({onBack}:{onBack:()=>void}){
  const pick=()=>HANGMAN_WORDS[Math.floor(Math.random()*HANGMAN_WORDS.length)].toUpperCase();
  const [word,setWord]=useState(pick);
  const [guessed,setGuessed]=useState<Set<string>>(new Set());
  const [won,setWon]=useState(false);
  const [lost,setLost]=useState(false);
  const canvasRef=useRef<HTMLCanvasElement>(null);

  const wrong=[...guessed].filter(l=>!word.includes(l));
  const errors=wrong.length;
  const revealed=word.split('').map(l=>guessed.has(l)?l:'_');
  const isWon=revealed.every(l=>l!=='_');

  useEffect(()=>{
    const c=canvasRef.current;if(!c)return;
    const ctx=c.getContext('2d')!;ctx.clearRect(0,0,180,200);
    ctx.strokeStyle='rgba(255,255,255,0.6)';ctx.lineWidth=3;ctx.lineCap='round';
    HANG_PARTS.slice(0,errors).forEach(f=>f(ctx));
  },[errors]);

  useEffect(()=>{if(isWon&&!won&&!lost){setWon(true);}if(errors>=HANG_PARTS.length&&!lost){setLost(true);};},[isWon,errors]);

  const guess=(l:string)=>{if(won||lost||guessed.has(l))return;setGuessed(new Set([...guessed,l]));};
  const reset=()=>{setWord(pick());setGuessed(new Set());setWon(false);setLost(false);};

  const ALPHA='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return(
    <div className="flex-1 flex flex-col items-center" style={{background:'linear-gradient(180deg,#0a0510,#15081a)'}}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 w-full" style={{background:'rgba(10,5,16,0.98)'}}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs"><ChevronLeft size={14}/>Back</button>
        <div className="w-px h-4 bg-white/10"/>
        <span className="text-sm font-black text-white">🎯 Hangman</span>
        <span className="text-white/40 text-xs ml-auto">{errors}/{HANG_PARTS.length} wrong</span>
        <button onClick={reset} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white/40 text-[10px] hover:text-white/70 ml-2">New Word</button>
      </div>
      <div className="flex-1 overflow-auto p-4 flex flex-col items-center gap-4 max-w-sm mx-auto w-full">
        {(won||lost)&&<div className={cn("px-4 py-2 rounded-xl text-center font-black text-sm w-full",won?"bg-green-500/20 border border-green-500/30 text-green-300":"bg-red-500/20 border border-red-500/30 text-red-300")}>{won?'🎉 Correct!':` 💀 It was: ${word}`}<button onClick={reset} className="block mx-auto mt-1 px-3 py-1 rounded bg-white/10 text-xs">Play Again</button></div>}
        <canvas ref={canvasRef} width={180} height={200} className="rounded-xl" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}/>
        {/* Word display */}
        <div className="flex gap-2 flex-wrap justify-center">
          {revealed.map((l,i)=><div key={i} className={cn("w-8 h-10 border-b-2 flex items-end justify-center pb-1 font-black text-lg",l==='_'?'border-white/20 text-transparent':'border-violet-400 text-white')}>{l}</div>)}
        </div>
        {/* Wrong letters */}
        {wrong.length>0&&<div className="text-red-400/60 text-xs">Wrong: {wrong.join(' ')}</div>}
        {/* Keyboard */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {ALPHA.map(l=><button key={l} onClick={()=>guess(l)} disabled={guessed.has(l)||won||lost}
            className={cn("w-8 h-8 rounded-lg text-xs font-bold border transition-all",guessed.has(l)?word.includes(l)?'bg-green-500/20 border-green-500/30 text-green-400':'bg-white/5 border-white/5 text-white/20':'bg-white/8 border-white/15 text-white/70 hover:bg-white/15 hover:border-white/30 active:scale-90')}>{l}</button>)}
        </div>
      </div>
    </div>
  );
}

/* ===== GAME: SPACE INVADERS ===== */
function SpaceInvadersGame({onBack}:{onBack:()=>void}){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const stateRef=useRef({
    ship:{x:200,y:440},bullets:[] as {x:number,y:number}[],aliens:[] as {x:number,y:number,alive:boolean}[],
    dir:1,alienY:50,lastShot:0,score:0,lives:3,level:1,gameOver:false,won:false,alienMoveTimer:0
  });
  const keysRef=useRef<Set<string>>(new Set());
  const animRef=useRef<number>(0);
  const [score,setScore]=useState(0);
  const [lives,setLives]=useState(3);
  const [over,setOver]=useState(false);
  const [won,setWon]=useState(false);
  const W=400,H=500;

  const initAliens=(level:number)=>{
    const a=[];
    for(let r=0;r<4;r++)for(let c=0;c<9;c++)a.push({x:30+c*40,y:30+r*35,alive:true});
    return a;
  };

  useEffect(()=>{
    const c=canvasRef.current;if(!c)return;c.width=W;c.height=H;
    const ctx=c.getContext('2d')!;const s=stateRef.current;
    s.aliens=initAliens(1);
    const onKey=(e:KeyboardEvent)=>{keysRef.current.add(e.code);if(e.code==='Space'){e.preventDefault();}};
    const onKeyUp=(e:KeyboardEvent)=>keysRef.current.delete(e.code);
    window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKeyUp);
    let frame=0;
    const loop=()=>{
      if(s.gameOver||s.won){animRef.current=requestAnimationFrame(loop);return;}
      frame++;
      ctx.fillStyle='#020408';ctx.fillRect(0,0,W,H);
      // Ship movement
      if(keysRef.current.has('ArrowLeft')&&s.ship.x>20)s.ship.x-=5;
      if(keysRef.current.has('ArrowRight')&&s.ship.x<W-20)s.ship.x+=5;
      if(keysRef.current.has('Space')&&frame-s.lastShot>15){s.bullets.push({x:s.ship.x,y:s.ship.y});s.lastShot=frame;}
      // Move aliens
      s.alienMoveTimer++;
      const speed=Math.max(8,20-s.level*2);
      if(s.alienMoveTimer>=speed){
        s.alienMoveTimer=0;const living=s.aliens.filter(a=>a.alive);
        const maxX=Math.max(...living.map(a=>a.x));const minX=Math.min(...living.map(a=>a.x));
        if((s.dir>0&&maxX>W-40)||(s.dir<0&&minX<40)){s.dir*=-1;s.aliens.forEach(a=>{a.y+=12;});}
        s.aliens.forEach(a=>{if(a.alive)a.x+=s.dir*4;});
      }
      // Bullets
      s.bullets=s.bullets.filter(b=>{b.y-=8;return b.y>0;});
      // Collision
      s.bullets=s.bullets.filter(b=>{
        let hit=false;
        s.aliens.forEach(a=>{if(a.alive&&Math.abs(b.x-a.x)<16&&Math.abs(b.y-a.y)<14){a.alive=false;s.score+=10;setScore(s.score);hit=true;}});
        return!hit;
      });
      // Alien reaches bottom
      s.aliens.forEach(a=>{if(a.alive&&a.y>H-80){s.lives--;setLives(s.lives);s.aliens=initAliens(s.level);s.alienY=50;if(s.lives<=0){s.gameOver=true;setOver(true);}}});
      // Win check
      if(s.aliens.every(a=>!a.alive)){s.won=true;setWon(true);}
      // Draw ship
      ctx.fillStyle='#60a5fa';ctx.fillRect(s.ship.x-15,s.ship.y,30,10);ctx.fillRect(s.ship.x-5,s.ship.y-10,10,10);
      // Draw bullets
      ctx.fillStyle='#fbbf24';
      s.bullets.forEach(b=>{ctx.fillRect(b.x-2,b.y-8,4,8);});
      // Draw aliens
      s.aliens.forEach(a=>{
        if(!a.alive)return;
        ctx.fillStyle='#4ade80';ctx.fillRect(a.x-12,a.y-8,24,16);ctx.fillRect(a.x-16,a.y-4,4,8);ctx.fillRect(a.x+12,a.y-4,4,8);
      });
      // HUD
      ctx.fillStyle='white';ctx.font='bold 14px monospace';ctx.textAlign='left';ctx.fillText(`Score: ${s.score}`,10,20);
      ctx.textAlign='right';ctx.fillText(`${'❤'.repeat(s.lives)}`,W-10,20);
      animRef.current=requestAnimationFrame(loop);
    };
    animRef.current=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(animRef.current);window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKeyUp);};
  },[]);

  const reset=()=>{const s=stateRef.current;Object.assign(s,{ship:{x:200,y:440},bullets:[],aliens:initAliens(1),dir:1,score:0,lives:3,gameOver:false,won:false,alienMoveTimer:0,lastShot:0});setScore(0);setLives(3);setOver(false);setWon(false);};

  return(
    <div className="flex-1 flex flex-col items-center" style={{background:'linear-gradient(180deg,#020408,#050a10)'}}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 w-full" style={{background:'rgba(2,4,8,0.98)'}}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs"><ChevronLeft size={14}/>Back</button>
        <div className="w-px h-4 bg-white/10"/>
        <span className="text-sm font-black text-white">👾 Space Invaders</span>
        <span className="text-white/40 text-xs ml-auto">Arrow Keys to move • Space to shoot</span>
        {(over||won)&&<button onClick={reset} className="ml-2 px-2 py-1 rounded bg-green-500/20 border border-green-500/30 text-green-300 text-[10px] font-bold">Retry</button>}
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        {(over||won)&&<div className="absolute z-10 text-center bg-black/80 border border-white/20 rounded-2xl px-6 py-4"><div className="text-4xl mb-2">{won?'🎉':'💥'}</div><div className="text-white font-black text-xl mb-1">{won?'You Win!':'Game Over'}</div><div className="text-yellow-400 text-sm mb-3">Score: {score}</div><button onClick={reset} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-black">Play Again</button></div>}
        <canvas ref={canvasRef} className="rounded-2xl" style={{maxHeight:'500px',maxWidth:'100%',border:'1px solid rgba(255,255,255,0.1)'}}/>
      </div>
    </div>
  );
}

function GamesPage() {
  const [gameMode, setGameMode] = useState<GameMode>("hub");
  const [activeFilter, setActiveFilter] = useState("all");
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => { const t = setInterval(()=>setHeroIndex(i=>(i+1)%4),4500); return()=>clearInterval(t); }, []);
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

  if (gameMode === "snake") return <PulseSnakeGame onBack={()=>setGameMode("hub")} />;
  if (gameMode === "surge") return <NumberSurgeGame onBack={()=>setGameMode("hub")} />;
  if (gameMode === "scramble") return <WordScrambleGame onBack={()=>setGameMode("hub")} />;
  if (gameMode === "trivia") return <OmegaTriviaGame onBack={()=>setGameMode("hub")} />;
  if (gameMode === "creator") return <CreatorZoneGame onBack={()=>setGameMode("hub")} />;
  if (gameMode === "emulator") return <EmulatorZone onBack={()=>setGameMode("hub")} />;
  if (gameMode === "pixelart") return <PixelArtStudio onBack={()=>setGameMode("hub")} />;
  if (gameMode === "retrotools") return <RetroToolsHub onBack={()=>setGameMode("hub")} setGameMode={setGameMode} />;
  if (gameMode === "rompatch") return <RomPatcherTool onBack={()=>setGameMode("retrotools")} />;
  if (gameMode === "spritetools") return <SpriteSlicer onBack={()=>setGameMode("retrotools")} />;
  if (gameMode === "opengames") return <OpenGamesZone onBack={()=>setGameMode("retrotools")} />;
  if (gameMode === "gamelibrary") return <GameLibrary onBack={()=>setGameMode("hub")} setGameMode={setGameMode} />;
  if (gameMode === "puzzle2048") return <Game2048 onBack={()=>setGameMode("gamelibrary")} />;
  if (gameMode === "wordle") return <WordleGame onBack={()=>setGameMode("gamelibrary")} />;
  if (gameMode === "pong") return <PongGame onBack={()=>setGameMode("gamelibrary")} />;
  if (gameMode === "minesweeper") return <MinesweeperGame onBack={()=>setGameMode("gamelibrary")} />;
  if (gameMode === "simon") return <SimonGame onBack={()=>setGameMode("gamelibrary")} />;
  if (gameMode === "tictactoe") return <TicTacToeGame onBack={()=>setGameMode("gamelibrary")} />;
  if (gameMode === "connect4") return <ConnectFourGame onBack={()=>setGameMode("gamelibrary")} />;
  if (gameMode === "flappy") return <FlappyGame onBack={()=>setGameMode("gamelibrary")} />;
  if (gameMode === "hangman") return <HangmanGame onBack={()=>setGameMode("gamelibrary")} />;
  if (gameMode === "spaceinvaders") return <SpaceInvadersGame onBack={()=>setGameMode("gamelibrary")} />;

  if (gameMode === "blackjack") return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-green-900 via-green-800 to-green-900 p-4">
      <div className="max-w-lg mx-auto">
        <button onClick={() => { setGameMode("hub"); setBjPhase("idle"); }} className="flex items-center gap-1.5 text-green-200 hover:text-white text-sm mb-4 transition-colors">
          <ChevronLeft size={16} /> Back to Platform
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
          <ChevronLeft size={16} /> Back to Platform
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
          <ChevronLeft size={16} /> Back to Platform
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

  const playableGames = GAMES_CATALOG.filter(g=>g.mode!==null);
  const heroGames = playableGames.slice(0,4);
  const hero = heroGames[heroIndex % heroGames.length];
  const originalsGames = GAMES_CATALOG.filter(g=>g.section==="originals");
  const strategyGames = GAMES_CATALOG.filter(g=>g.section==="strategy"||g.section==="multiplayer");
  const actionGames = GAMES_CATALOG.filter(g=>g.section==="action");
  const FILTERS = ["All","Play Now","Strategy","Puzzle","Action","Multiplayer","Kids","Creator"];
  const launchGame = (g: GameEntry) => {
    if (!g.mode) return;
    if (g.mode==="blackjack"){setGameMode("blackjack");setBjPhase("idle");setBet(100);setPlayerChips(1000);}
    else if (g.mode==="memory"){setGameMode("memory");setMemCards([]);}
    else if (g.mode==="rps"){setGameMode("rps");setRpsResult(null);setRpsScore({player:0,ai:0,draws:0});}
    else setGameMode(g.mode);
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{background:"linear-gradient(180deg,#04040e 0%,#080818 40%,#04040e 100%)"}}>
      {/* Platform Header */}
      <div className="sticky top-0 z-10 border-b border-white/5 px-4 pt-4 pb-3" style={{background:"rgba(4,4,14,0.95)",backdropFilter:"blur(12px)"}}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h1 className="text-lg font-extrabold text-white tracking-tight" data-testid="text-games-title">MyAiGPT Gaming</h1>
                <span className="text-[9px] bg-gradient-to-r from-violet-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-bold tracking-wide">SOVEREIGN PLATFORM</span>
              </div>
              <p className="text-white/30 text-[10px] mt-0.5">10+ Games & Tools Playable Now · 35+ In Development · Emulator Zone · Pixel Art · AI Universe</p>
            </div>
            <button onClick={()=>setGameMode("creator")} data-testid="button-open-creator" className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold rounded-xl text-xs hover:from-violet-500 hover:to-pink-500 transition-all shadow-lg shadow-violet-500/20">
              <Wand size={11}/> Create Game
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{scrollbarWidth:"none"}}>
            {FILTERS.map(f=>(
              <button key={f} onClick={()=>setActiveFilter(f.toLowerCase())} className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeFilter===f.toLowerCase()?"bg-white text-gray-900 shadow-sm":"bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 border border-white/8"}`}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-10">
        {/* Hero Featured Banner */}
        <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${hero.pulseColor} border border-white/10 shadow-2xl`}>
          <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage:"radial-gradient(circle at 1px 1px,white 1px,transparent 0)",backgroundSize:"18px 18px"}}/>
          <div className="relative p-7 sm:p-10">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold border border-white/20 tracking-wide">FEATURED</span>
                  <span className="text-[9px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full border border-white/10">{hero.pulse}</span>
                  <span className="text-[9px] bg-green-500/40 text-green-200 px-2 py-0.5 rounded-full border border-green-500/30 font-bold">● PLAY NOW</span>
                  <span className="text-[9px] bg-white/10 text-white/50 px-2 py-0.5 rounded-full border border-white/10">{hero.genre}</span>
                  <span className="text-[9px] bg-white/10 text-white/50 px-2 py-0.5 rounded-full border border-white/10">{hero.difficulty}</span>
                </div>
                <div className="text-6xl mb-3">{hero.emoji}</div>
                <h2 className="text-3xl font-extrabold text-white mb-2">{hero.title}</h2>
                <p className="text-white/65 text-sm mb-2 max-w-md leading-relaxed">{hero.tagline}</p>
                <p className="text-white/30 text-xs mb-5">AI Feature: {hero.aiFeature}</p>
                <button onClick={()=>launchGame(hero)} data-testid={`button-hero-play-${hero.id}`} className="px-7 py-3 bg-white text-gray-900 font-extrabold rounded-2xl hover:bg-gray-100 transition-all shadow-xl text-sm">▶ Play Now</button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 right-5 flex gap-1.5">
            {heroGames.map((_,i)=>(<button key={i} onClick={()=>setHeroIndex(i)} className={`rounded-full transition-all ${heroIndex%heroGames.length===i?"w-5 h-2 bg-white":"w-2 h-2 bg-white/25 hover:bg-white/50"}`}/>))}
          </div>
        </div>

        {/* Sovereign Tools — Full Instant-Play OS */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="text-base font-extrabold text-white">⚡ Sovereign Game OS</h2><p className="text-white/30 text-xs">Pre-installed tools — click once, runs instantly. No downloads. No installs. No friction.</p></div>
            <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30 font-bold">{SOVEREIGN_SEED.filter(t=>t.installed).length} READY</span>
          </div>
          {/* Game Library — featured full-width */}
          <button onClick={()=>setGameMode("gamelibrary")} data-testid="hub-card-gamelibrary"
            className="group relative overflow-hidden rounded-3xl border border-green-500/30 p-5 text-left w-full mb-3 hover:border-green-400/50 hover:shadow-2xl hover:shadow-green-500/20 transition-all"
            style={{background:'linear-gradient(135deg,#001a05,#002a10,#001a20)'}}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full -translate-y-16 translate-x-16"/>
            <div className="flex items-center gap-4">
              <div className="text-5xl">🎮</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <div className="text-white font-black text-base">Sovereign Game Library</div>
                  <span className="text-[9px] bg-green-500 text-white px-2 py-0.5 rounded-full font-black">{GAME_LIBRARY.filter(g=>g.type==='builtin').length} INSTANT PLAY</span>
                  <span className="text-[9px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full font-bold">{GAME_LIBRARY.length} TOTAL</span>
                </div>
                <div className="text-white/40 text-xs mb-2">2048 · Wordle · Pong · Space Invaders · Minesweeper · Simon · Tic Tac Toe · Connect Four · Flappy · Hangman · Blackjack · Snake + 40 more</div>
                <div className="flex flex-wrap gap-1">
                  {['Puzzle','Arcade','Word','Strategy','Casino','Trivia','AI','Open-Source'].map(t=><span key={t} className="text-[8px] px-1.5 py-0.5 bg-green-500/15 text-green-400 rounded-full">{t}</span>)}
                </div>
              </div>
              <div className="text-green-400 font-black text-sm group-hover:text-green-300">▶ Browse All</div>
            </div>
          </button>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button onClick={()=>setGameMode("emulator")} data-testid="hub-card-emulator" className="group relative overflow-hidden rounded-2xl border border-white/10 p-4 text-left hover:border-violet-500/40 hover:shadow-2xl hover:shadow-violet-500/10 transition-all" style={{background:'linear-gradient(135deg,#1a003a,#2d005a)'}}>
              <div className="text-3xl mb-2">🕹️</div>
              <div className="text-white font-black text-sm mb-1">Emulator Zone</div>
              <div className="text-white/40 text-[10px] mb-2">NES, SNES, GBA, N64, PS1, Sega, DOS, Arcade + 4 more — upload ROM, play instantly</div>
              <div className="flex flex-wrap gap-1">
                {['NES','SNES','GBA','N64','PS1'].map(c=><span key={c} className="text-[8px] px-1 py-0.5 bg-violet-500/20 text-violet-400 rounded-full">{c}</span>)}
              </div>
              <div className="absolute top-2 right-2"><span className="text-[7px] bg-violet-500 text-white px-1.5 py-0.5 rounded-full font-bold">12 CONSOLES</span></div>
            </button>
            <button onClick={()=>setGameMode("pixelart")} data-testid="hub-card-pixelart" className="group relative overflow-hidden rounded-2xl border border-white/10 p-4 text-left hover:border-pink-500/40 hover:shadow-2xl hover:shadow-pink-500/10 transition-all" style={{background:'linear-gradient(135deg,#1a001a,#3a0030)'}}>
              <div className="text-3xl mb-2">🎨</div>
              <div className="text-white font-black text-sm mb-1">Pixel Art Studio</div>
              <div className="text-white/40 text-[10px] mb-2">NES/GB/Pico-8 palettes, flood fill, undo, CRT shaders, PNG export at 8× scale</div>
              <div className="flex flex-wrap gap-1">
                {['NES','Game Boy','Pico-8','CRT'].map(c=><span key={c} className="text-[8px] px-1 py-0.5 bg-pink-500/20 text-pink-400 rounded-full">{c}</span>)}
              </div>
              <div className="absolute top-2 right-2"><span className="text-[7px] bg-pink-500 text-white px-1.5 py-0.5 rounded-full font-bold">STUDIO</span></div>
            </button>
            <button onClick={()=>setGameMode("rompatch")} data-testid="hub-card-rompatch" className="group relative overflow-hidden rounded-2xl border border-white/10 p-4 text-left hover:border-orange-500/40 hover:shadow-2xl hover:shadow-orange-500/10 transition-all" style={{background:'linear-gradient(135deg,#1a0a00,#2a1500)'}}>
              <div className="text-3xl mb-2">🔧</div>
              <div className="text-white font-black text-sm mb-1">ROM Patcher</div>
              <div className="text-white/40 text-[10px] mb-2">Apply IPS and BPS patch files — fan translations, bug fixes, game hacks. 100% local.</div>
              <div className="flex flex-wrap gap-1">
                {['IPS','BPS','Browser'].map(c=><span key={c} className="text-[8px] px-1 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">{c}</span>)}
              </div>
              <div className="absolute top-2 right-2"><span className="text-[7px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold">PATCH</span></div>
            </button>
            <button onClick={()=>setGameMode("spritetools")} data-testid="hub-card-spritetools" className="group relative overflow-hidden rounded-2xl border border-white/10 p-4 text-left hover:border-rose-500/40 hover:shadow-2xl hover:shadow-rose-500/10 transition-all" style={{background:'linear-gradient(135deg,#1a001a,#2a0020)'}}>
              <div className="text-3xl mb-2">✂️</div>
              <div className="text-white font-black text-sm mb-1">Sprite Slicer</div>
              <div className="text-white/40 text-[10px] mb-2">Upload sprite sheet → set grid → click sprite → export PNG. Canvas-based, pure browser.</div>
              <div className="flex flex-wrap gap-1">
                {['Grid','Export','Canvas'].map(c=><span key={c} className="text-[8px] px-1 py-0.5 bg-rose-500/20 text-rose-400 rounded-full">{c}</span>)}
              </div>
              <div className="absolute top-2 right-2"><span className="text-[7px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-bold">SLICER</span></div>
            </button>
            <button onClick={()=>setGameMode("opengames")} data-testid="hub-card-opengames" className="group relative overflow-hidden rounded-2xl border border-white/10 p-4 text-left hover:border-green-500/40 hover:shadow-2xl hover:shadow-green-500/10 transition-all" style={{background:'linear-gradient(135deg,#001a05,#002a0a)'}}>
              <div className="text-3xl mb-2">🌐</div>
              <div className="text-white font-black text-sm mb-1">Open Games Zone</div>
              <div className="text-white/40 text-[10px] mb-2">{OPEN_GAMES.length} open-source games — 2048, DOOM, Chess, Tetris, Flappy & more. Click → play.</div>
              <div className="flex flex-wrap gap-1">
                {['2048','Chess','DOOM','Flappy'].map(c=><span key={c} className="text-[8px] px-1 py-0.5 bg-green-500/20 text-green-400 rounded-full">{c}</span>)}
              </div>
              <div className="absolute top-2 right-2"><span className="text-[7px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold">{OPEN_GAMES.length} GAMES</span></div>
            </button>
            <button onClick={()=>setGameMode("retrotools")} data-testid="hub-card-retrotools" className="group relative overflow-hidden rounded-2xl border border-white/10 p-4 text-left hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all" style={{background:'linear-gradient(135deg,#001a1a,#002a2a)'}}>
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-white font-black text-sm mb-1">Sovereign Hub OS</div>
              <div className="text-white/40 text-[10px] mb-2">{SOVEREIGN_SEED.length} indexed tools — auto-ingests GitHub, pre-installed registry, 1-click launch.</div>
              <div className="flex flex-wrap gap-1">
                {['Registry','GitHub','Auto-Ingest'].map(c=><span key={c} className="text-[8px] px-1 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">{c}</span>)}
              </div>
              <div className="absolute top-2 right-2"><span className="text-[7px] bg-cyan-500 text-white px-1.5 py-0.5 rounded-full font-bold">{SOVEREIGN_SEED.filter(t=>t.installed).length} READY</span></div>
            </button>
          </div>
        </div>

        {/* Play Now — 7 Playable Games */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="text-base font-extrabold text-white">🎮 Play Now</h2><p className="text-white/30 text-xs">{playableGames.length} games available — no downloads, no installs</p></div>
            <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30 font-bold">LIVE</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {playableGames.map(game=>(
              <button key={game.id} onClick={()=>launchGame(game)} data-testid={`game-card-${game.id}`}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${game.pulseColor} p-4 text-left hover:shadow-2xl hover:scale-[1.03] active:scale-[0.99] transition-all duration-200 border border-white/10`}>
                <div className="absolute top-2 right-2"><span className="text-[8px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold">PLAY</span></div>
                <div className="text-3xl mb-2">{game.emoji}</div>
                <h3 className="text-sm font-extrabold text-white mb-0.5 leading-tight">{game.title}</h3>
                <p className="text-white/50 text-[10px] mb-2 line-clamp-2 leading-relaxed">{game.tagline}</p>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[8px] px-1.5 py-0.5 bg-white/15 text-white/70 rounded-full">{game.genre}</span>
                  <span className="text-[8px] px-1.5 py-0.5 bg-white/15 text-white/70 rounded-full">{game.difficulty}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Pulse Originals — Locked */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-white">⚡ Pulse Originals</h2>
              <p className="text-white/30 text-xs">Exclusive to MyAiGPT — In active development</p>
            </div>
            <span className="text-[9px] bg-violet-500/20 text-violet-400 px-2 py-1 rounded-full border border-violet-500/30 font-bold">EXCLUSIVE</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {originalsGames.map(game=>(
              <div key={game.id} className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${game.pulseColor} p-4 border border-white/10`}>
                <div className="absolute inset-0 bg-black/50"/>
                <div className="relative">
                  <div className="absolute top-0 right-0"><span className="text-[8px] bg-violet-500/90 text-white px-1.5 py-0.5 rounded-full font-bold">COMING SOON</span></div>
                  <div className="text-3xl mb-2">{game.emoji}</div>
                  <h3 className="text-sm font-extrabold text-white mb-0.5 leading-tight">{game.title}</h3>
                  <p className="text-white/40 text-[10px] mb-2 line-clamp-2 leading-relaxed">{game.tagline}</p>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[8px] px-1.5 py-0.5 bg-white/10 text-white/50 rounded-full border border-white/10">{game.genre}</span>
                    <span className="text-[8px] px-1.5 py-0.5 bg-white/10 text-white/50 rounded-full border border-white/10">{game.players}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategy & Simulation */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="text-base font-extrabold text-white">🌍 Strategy & Simulation</h2><p className="text-white/30 text-xs">Deep AI-powered strategy and world-building experiences</p></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {strategyGames.slice(0,6).map(game=>(
              <div key={game.id} className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${game.pulseColor} p-4 border border-white/10`}>
                <div className="absolute inset-0 bg-black/45"/>
                <div className="relative">
                  <div className="absolute top-0 right-0"><span className="text-[8px] bg-black/50 text-white/70 px-1.5 py-0.5 rounded-full border border-white/10">COMING SOON</span></div>
                  <div className="text-3xl mb-2">{game.emoji}</div>
                  <h3 className="text-sm font-extrabold text-white mb-0.5 leading-tight">{game.title}</h3>
                  <p className="text-white/40 text-[10px] mb-2 line-clamp-2">{game.tagline}</p>
                  <span className="text-[8px] px-1.5 py-0.5 bg-white/10 text-white/50 rounded-full border border-white/10">{game.aiFeature}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action & Arcade */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="text-base font-extrabold text-white">🔥 Action & Arcade</h2><p className="text-white/30 text-xs">Fast-paced games with AI-generated levels and challenges</p></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {actionGames.slice(0,6).map(game=>(
              <div key={game.id} className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${game.pulseColor} p-4 border border-white/10`}>
                <div className="absolute inset-0 bg-black/45"/>
                <div className="relative">
                  <div className="absolute top-0 right-0"><span className="text-[8px] bg-black/50 text-white/70 px-1.5 py-0.5 rounded-full border border-white/10">COMING SOON</span></div>
                  <div className="text-3xl mb-2">{game.emoji}</div>
                  <h3 className="text-sm font-extrabold text-white mb-0.5 leading-tight">{game.title}</h3>
                  <p className="text-white/40 text-[10px] mb-2 line-clamp-2">{game.tagline}</p>
                  <span className="text-[8px] px-1.5 py-0.5 bg-white/10 text-white/50 rounded-full border border-white/10">{game.genre}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Creator Zone CTA */}
        <div className="rounded-3xl overflow-hidden border border-violet-500/30" style={{background:"linear-gradient(135deg,#150028 0%,#2a0050 50%,#150028 100%)"}}>
          <div className="relative p-8">
            <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:"radial-gradient(circle at 1px 1px,white 1px,transparent 0)",backgroundSize:"18px 18px"}}/>
            <div className="relative text-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-4">⚡ CREATOR ZONE — ROBLOX KILLER</div>
              <h2 className="text-2xl font-extrabold text-white mb-2">Build Any Game with AI</h2>
              <p className="text-violet-300/70 text-sm mb-6 max-w-md mx-auto">Pick a template, describe your game, and the AI builds the entire thing from scratch — in seconds. No code required.</p>
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {CREATOR_TEMPLATES.map(t=>(<div key={t.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-xs text-white/60"><span>{t.icon}</span><span>{t.name}</span></div>))}
              </div>
              <button onClick={()=>setGameMode("creator")} data-testid="button-creator-zone" className="px-8 py-3.5 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-extrabold rounded-2xl hover:from-violet-400 hover:to-pink-400 transition-all shadow-xl shadow-violet-500/30 text-sm">
                ⚡ Open Creator Zone
              </button>
            </div>
          </div>
        </div>

        {/* Full Catalog */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="text-base font-extrabold text-white">🌐 Full Catalog</h2><p className="text-white/30 text-xs">{GAMES_CATALOG.length} games total — the MyAiGPT universe is growing</p></div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {GAMES_CATALOG.map(game=>(
              <button key={game.id} onClick={()=>launchGame(game)} disabled={!game.mode} data-testid={`catalog-card-${game.id}`}
                className={`relative rounded-xl bg-gradient-to-br ${game.pulseColor} p-3 text-left border border-white/8 transition-all ${game.mode?"hover:scale-[1.04] hover:shadow-lg hover:border-white/20 cursor-pointer":"opacity-50 cursor-default"}`}>
                {!game.mode&&<div className="absolute inset-0 bg-black/40 rounded-xl"/>}
                <div className="relative">
                  <div className="text-xl mb-1">{game.emoji}</div>
                  <div className="text-white font-bold text-[10px] leading-tight">{game.title}</div>
                  <div className="text-white/40 text-[8px] mt-0.5">{game.genre}</div>
                  {game.mode&&<div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"/>}
                </div>
              </button>
            ))}
          </div>
          <p className="text-center text-white/20 text-xs mt-4">Green dot = playable now. All games built by Quantum Logic Network / Quantum Pulse Intelligence.</p>
        </div>

        {/* Platform Stats Footer */}
        <div className="grid grid-cols-3 gap-3">
          {[["10+","Tools & Games Live"],["35+","In Development"],["12","Emulated Consoles"]].map(([num,label])=>(
            <div key={label} className="text-center rounded-2xl border border-white/8 p-4" style={{background:"rgba(255,255,255,0.02)"}}>
              <div className="text-2xl font-extrabold text-white mb-0.5">{num}</div>
              <div className="text-white/30 text-xs">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GamesPageWrapper() {
  useEffect(() => { updateSEO({ title: "Games Hub — Play vs AI | My Ai Gpt", description: "Play Blackjack, Memory Match, and Rock Paper Scissors against AI on My Ai Gpt. Games by Quantum Logic Network.", ogTitle: "My Ai GPT Games Hub", ogDesc: "Beat the AI at Blackjack, Memory Match, and Rock Paper Scissors. Games Hub by Quantum Logic Network.", ogType: "website", canonical: window.location.origin + "/games" }); }, []);
  return <Layout><GamesPage /></Layout>;
}
/* ═══════════════════════════════════════════════════════════════════════
   QUANTAPEDIA — The AI-Native Knowledge Universe
   Replaces: Wikipedia · All Dictionaries · All Encyclopedias · Every Reference
   Powered by Groq AI · localStorage cache · Concept graph · A-Z browse
   ═══════════════════════════════════════════════════════════════════════ */
type QuantaEntry={
  title:string;type:string;pronunciation?:string;partOfSpeech?:string;
  summary:string;definitions:{number:number;text:string;example?:string}[];
  etymology?:string;synonyms:string[];antonyms:string[];relatedTerms:string[];
  sections:{title:string;content:string}[];quickFacts:{label:string;value:string}[];
  categories:string[];seeAlso:string[];
  // Financial entity extras (populated when type = 'company' | 'stock' | 'financial')
  ticker?:string;exchange?:string;listingStatus?:string;headquarters?:string;
  founded?:string;industry?:string;ceo?:string;
};
const QP_FEATURED=[
  {q:'Quantum mechanics',emoji:'⚛️',cat:'Physics'},
  {q:'Artificial intelligence',emoji:'🤖',cat:'Technology'},
  {q:'Neural networks',emoji:'🧠',cat:'Technology'},
  {q:'DNA replication',emoji:'🧬',cat:'Biology'},
  {q:'Consciousness',emoji:'💭',cat:'Philosophy'},
  {q:'Natural language processing',emoji:'💬',cat:'Technology'},
  {q:'Evolution',emoji:'🦎',cat:'Biology'},
  {q:'Universe expansion',emoji:'🌌',cat:'Cosmology'},
  {q:'CRISPR gene editing',emoji:'✂️',cat:'Biology'},
  {q:'Mathematics',emoji:'∑',cat:'Science'},
  {q:'Emergent behavior',emoji:'🌀',cat:'Complexity'},
  {q:'Black holes',emoji:'🕳️',cat:'Astrophysics'},
  {q:'Swarm intelligence',emoji:'🐝',cat:'AI'},
  {q:'Protein folding',emoji:'🔬',cat:'Biology'},
  {q:'Thermodynamics',emoji:'🔥',cat:'Physics'},
  {q:'Autonomous agents',emoji:'🤖',cat:'AI'},
  {q:'Epigenetics',emoji:'🧬',cat:'Biology'},
  {q:'Graph theory',emoji:'🕸️',cat:'Mathematics'},
  {q:'Photosynthesis',emoji:'🌿',cat:'Biology'},
  {q:'General relativity',emoji:'🌐',cat:'Physics'},
];
const QP_CATEGORIES=[
  {label:'Science',emoji:'🔬',topics:['Physics','Chemistry','Biology','Astronomy','Geology','Ecology','Neuroscience']},
  {label:'Technology',emoji:'💻',topics:['Artificial Intelligence','Computer Science','Engineering','Robotics','Blockchain','Quantum Computing']},
  {label:'Finance & Markets',emoji:'📈',topics:['$BHAT Blue Hat Interactive stock','$NVDA NVIDIA stock','$TSLA Tesla stock','Stock market crash','Bitcoin','Short selling','Delisted stocks','Nasdaq requirements','IPO process','Penny stocks','Hedge funds','Market cap']},
  {label:'Companies',emoji:'🏢',topics:['Blue Hat Interactive Entertainment','Nvidia Corporation','Tesla Inc','Apple Inc','Microsoft Corporation','Alibaba Group','Amazon','Goldman Sachs','BlackRock','Berkshire Hathaway']},
  {label:'History',emoji:'📜',topics:['Ancient Rome','Renaissance','World War II','Industrial Revolution','Cold War','Egyptian Empire']},
  {label:'Philosophy',emoji:'🤔',topics:['Ethics','Epistemology','Metaphysics','Logic','Aesthetics','Existentialism','Stoicism']},
  {label:'Language',emoji:'💬',topics:['Etymology','Grammar','Linguistics','Phonetics','Semantics','Pragmatics','Morphology']},
  {label:'Mathematics',emoji:'∑',topics:['Calculus','Algebra','Geometry','Statistics','Number Theory','Topology','Combinatorics']},
  {label:'Arts',emoji:'🎨',topics:['Painting','Sculpture','Music Theory','Film','Literature','Architecture','Dance']},
  {label:'Nature',emoji:'🌿',topics:['Ecology','Botany','Zoology','Climate','Oceans','Forests','Microbiome']},
  {label:'Culture',emoji:'🌍',topics:['Mythology','Religion','Anthropology','Sociology','Folklore','Ritual','Tradition']},
  {label:'People',emoji:'👤',topics:['Albert Einstein','Leonardo da Vinci','Marie Curie','Nikola Tesla','Socrates','Ada Lovelace']},
];
const QP_ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function QuantapediaPage({initialTopic=''}:{initialTopic?:string}){
  const [view,setView]=useState<'home'|'entry'|'browse'|'letter'>('home');
  const [query,setQuery]=useState('');
  const [entry,setEntry]=useState<QuantaEntry|null>(null);
  const [loading,setLoading]=useState(false);
  const [activeTab,setActiveTab]=useState<'encyclopedia'|'dictionary'|'thesaurus'|'graph'|'hive'|'species'|'patents'>('encyclopedia');
  const [hivePanelData,setHivePanelData]=useState<{nodes:any[];ageScore:any}|null>(null);
  const [hivePanelLoading,setHivePanelLoading]=useState(false);
  const [pulseLangDict,setPulseLangDict]=useState<{lexicon:any[];alphabet:any[];snapshot:any}|null>(null);
  const [speciesQuery,setSpeciesQuery]=useState('');
  const [speciesResults,setSpeciesResults]=useState<any[]>([]);
  const [speciesLoading,setSpeciesLoading]=useState(false);
  const [patents,setPatents]=useState<any[]>([]);
  const [patentsTotal,setPatentsTotal]=useState(0);
  const [patentsQuery,setPatentsQuery]=useState('');
  const [patentsLoading,setPatentsLoading]=useState(false);
  const [isLivingEntry,setIsLivingEntry]=useState<{isLiving:boolean;lastUpdate?:string}|null>(null);
  const [letter,setLetter]=useState('A');
  const [history,setHistory]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('qp_history')||'[]');}catch{return [];}});
  const [bookmarks,setBookmarks]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('qp_bookmarks')||'[]');}catch{return [];}});
  const [cache,setCache]=useState<Record<string,QuantaEntry>>(()=>{try{return JSON.parse(localStorage.getItem('qp_cache')||'{}');}catch{return {};}});
  const [inputVal,setInputVal]=useState('');
  const {toast}=useToast();
  const [,setLocation]=useLocation();
  const [engineStatus,setEngineStatus]=useState<{running:boolean;totalGenerated:number;total:number;generated:number;queued:number}|null>(null);
  const [qpFeatured,setQpFeatured]=useState<{q:string;emoji:string;cat:string;source?:string}[]>([]);
  const [qpChipsLoading,setQpChipsLoading]=useState(true);

  useEffect(()=>{
    setQpChipsLoading(true);
    fetch('/api/quantapedia/hive-chips')
      .then(r=>r.json())
      .then((d:any)=>{
        if(d.chips?.length>=4){
          setQpFeatured(d.chips);
        } else {
          setQpFeatured(pickRandom(QP_FEATURED,14));
        }
      })
      .catch(()=>setQpFeatured(pickRandom(QP_FEATURED,14)))
      .finally(()=>setQpChipsLoading(false));
  },[]);

  useEffect(()=>{
    const fetchStatus=()=>fetch('/api/quantapedia/engine-status').then(r=>r.json()).then(setEngineStatus).catch(()=>{});
    fetchStatus();
    const id=setInterval(fetchStatus,10000);
    // Pre-seed high-value financial topics including delisted stocks so they're always available
    const financialSeedTopics=[
      {slug:'blue-hat-interactive-entertainment-technology',title:'Blue Hat Interactive Entertainment Technology ($BHAT)'},
      {slug:'bhat-stock-delisted',title:'$BHAT Blue Hat Interactive Stock'},
      {slug:'bhat-nasdaq-delisted',title:'BHAT NASDAQ Delisting'},
      {slug:'nasdaq-delisting-requirements',title:'NASDAQ Delisting Requirements'},
      {slug:'chinese-us-listed-stocks',title:'Chinese Stocks Listed in US'},
      {slug:'penny-stocks-delisted',title:'Delisted Penny Stocks'},
      {slug:'stock-market-delisting-process',title:'Stock Market Delisting Process'},
    ];
    fetch('/api/quantapedia/queue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topics:financialSeedTopics})}).catch(()=>{});
    return ()=>clearInterval(id);
  },[]);

  const toSlug=(q:string)=>q.trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');

  // Detect financial/stock queries: "$BHAT", "BHAT stock", "blue hat stock", "NVDA shares", etc.
  const detectFinancialQuery=(q:string):{isFinancial:boolean;ticker:string;companyHint:string}=>{
    const upper=q.toUpperCase().trim();
    const lower=q.toLowerCase().trim();
    const tickerMatch=q.match(/\$([A-Z]{1,5})/i)||q.match(/^([A-Z]{1,5})\s+(stock|shares|etf|ticker|price)/i);
    const ticker=tickerMatch?(tickerMatch[1]||tickerMatch[1]).toUpperCase():'';
    const isFinancial=!!(
      ticker||
      lower.includes(' stock')||lower.includes(' shares')||lower.includes('ticker')||
      lower.includes('nasdaq')||lower.includes('nyse')||lower.includes('nyse:')||
      lower.includes('delisted')||lower.includes(' ipo')||lower.includes(' etf')||
      lower.includes(' fund')||lower.includes(' inc ')||lower.includes(' corp')||
      lower.includes(' ltd ')||lower.includes(' llc ')||lower.includes(' plc ')||
      lower.includes('hedge fund')||lower.includes('market cap')||lower.includes('stock market')
    );
    const companyHint=q.replace(/\$[A-Z]{1,5}/gi,'').replace(/\b(stock|shares|ticker|price|etf|ipo|nasdaq|nyse|inc|corp|ltd|llc|plc)\b/gi,'').trim()||ticker;
    return {isFinancial,ticker,companyHint};
  };

  // Load hive data when hive tab selected or entry changes
  useEffect(()=>{
    if(activeTab==='hive'&&query){
      setHivePanelLoading(true);
      const slug=query.trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
      fetch(`/api/intel/hive-memory/${slug}`).then(r=>r.json()).then(d=>setHivePanelData(d)).catch(()=>{}).finally(()=>setHivePanelLoading(false));
    }
    if(activeTab==='species'){
      setSpeciesLoading(true);
      const q=speciesQuery||query;
      fetch(`/api/intel/sovereign-species/${encodeURIComponent(q||'all')}`).then(r=>r.json()).then(d=>setSpeciesResults(d.species||[])).catch(()=>setSpeciesResults([])).finally(()=>setSpeciesLoading(false));
    }
    if(activeTab==='patents'){
      setPatentsLoading(true);
      fetch(`/api/intel/patents?q=${encodeURIComponent(patentsQuery||query)}&limit=20`).then(r=>r.json()).then(d=>{setPatents(d.patents||[]);setPatentsTotal(d.total||0);}).catch(()=>{}).finally(()=>setPatentsLoading(false));
    }
    if(activeTab==='dictionary'&&!pulseLangDict){
      fetch('/api/intel/pulse-lang-dictionary').then(r=>r.json()).then(d=>setPulseLangDict(d)).catch(()=>{});
    }
  },[activeTab,query]);

  // Check if entry is a "living document" after lookup
  useEffect(()=>{
    if(view==='entry'&&query){
      const slug=query.trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
      fetch(`/api/intel/living-entry/${slug}`).then(r=>r.json()).then(d=>setIsLivingEntry(d)).catch(()=>{});
    }
  },[view,query]);

  const applyEntrySEO=(parsed:QuantaEntry,q:string)=>{
    const slug=toSlug(q);
    document.title=`${parsed.title} — Quantapedia | My Ai GPT`;
    let metaDesc=document.querySelector('meta[name="description"]') as HTMLMetaElement|null;
    if(!metaDesc){metaDesc=document.createElement('meta');(metaDesc as HTMLMetaElement).name='description';document.head.appendChild(metaDesc);}
    metaDesc.content=`${parsed.summary} — Look up ${parsed.title} on Quantapedia, the AI-native knowledge encyclopedia by My Ai GPT.`;
    document.querySelector('#qp-jsonld')?.remove();
    const script=document.createElement('script');
    script.type='application/ld+json';script.id='qp-jsonld';
    const isWord=parsed.type==='word'||parsed.type==='phrase';
    script.textContent=JSON.stringify({
      '@context':'https://schema.org',
      '@type':isWord?'DefinedTerm':'Article',
      'name':parsed.title,
      'description':parsed.summary,
      'url':window.location.origin+'/quantapedia/'+slug,
      'keywords':(parsed.categories||[]).join(', '),
      ...(isWord?{'inDefinedTermSet':window.location.origin+'/quantapedia'}:{'headline':parsed.title,'articleBody':parsed.sections?.map(s=>s.content).join(' ')||''})
    });
    document.head.appendChild(script);
    fetch('/api/quantapedia/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,title:parsed.title,summary:(parsed.summary||'').slice(0,500),type:parsed.type||'concept',categories:parsed.categories||[],relatedTerms:parsed.relatedTerms||[]})}).catch(()=>{});
  };

  useEffect(()=>{
    if(initialTopic){const human=initialTopic.replace(/-+/g,' ').trim();setInputVal(human);lookup(human);}
    return()=>{document.querySelector('#qp-jsonld')?.remove();if(document.title.includes('Quantapedia'))document.title='My Ai GPT';};
  },[]);

  const saveHistory=(t:string)=>{const h=[t,...history.filter(x=>x!==t)].slice(0,20);setHistory(h);localStorage.setItem('qp_history',JSON.stringify(h));};
  const toggleBookmark=(t:string)=>{const b=bookmarks.includes(t)?bookmarks.filter(x=>x!==t):[t,...bookmarks];setBookmarks(b);localStorage.setItem('qp_bookmarks',JSON.stringify(b));};

  const lookup=async(q:string)=>{
    if(!q.trim())return;
    const key=q.trim().toLowerCase();
    const slug=toSlug(q);
    if(cache[key]){
      const cached=cache[key];
      setEntry(cached);setQuery(q);setView('entry');saveHistory(q);
      setLocation('/quantapedia/'+slug,{replace:true});
      applyEntrySEO(cached,q);
      return;
    }
    setLoading(true);setQuery(q);setView('entry');
    // Try server DB first
    try{
      const serverRes=await fetch('/api/quantapedia/entry/'+slug);
      const serverData=await serverRes.json();
      if(serverData.entry){
        const pre:QuantaEntry=serverData.entry as QuantaEntry;
        const newCache={...cache,[key]:pre};
        setCache(newCache);
        localStorage.setItem('qp_cache',JSON.stringify(newCache));
        setEntry(pre);
        saveHistory(q);
        setLocation('/quantapedia/'+slug,{replace:true});
        applyEntrySEO(pre,q);
        setLoading(false);
        return;
      }
    } catch{}

    // Build the AI prompt — financial queries get a specialized prompt that always returns real data
    const {isFinancial,ticker,companyHint}=detectFinancialQuery(q);
    const aiPrompt=isFinancial
      ?`You are QuantapediaAI — the world's most comprehensive financial and corporate knowledge engine. Generate a complete, accurate structured knowledge entry for the financial entity: "${q}"${ticker?` (ticker: $${ticker})`:''}${companyHint&&companyHint!==ticker?` — company name hint: "${companyHint}"`:''}.

This may be a stock, company, ETF, index, cryptocurrency, or financial concept — including DELISTED, bankrupt, obscure, foreign-listed, OTC, or micro-cap entities. Use all available knowledge about this entity. If listing status is unknown, research context clues from the name/ticker to determine the most likely exchange, industry, and status.

Return ONLY a valid JSON object with this exact schema:
{
  "title": "Full official company/entity name",
  "type": "company",
  "ticker": "${ticker||''}",
  "exchange": "NASDAQ|NYSE|OTC|AMEX|LSE|etc or 'Delisted'",
  "listingStatus": "Active|Delisted|Suspended|Private|Merged",
  "headquarters": "City, Country",
  "founded": "year or approximate period",
  "industry": "primary industry",
  "ceo": "current or last known CEO",
  "pronunciation": "",
  "partOfSpeech": "",
  "summary": "2-3 sentence overview of the company, its business, and current status",
  "definitions": [
    {"number": 1, "text": "what this company does / business model", "example": ""},
    {"number": 2, "text": "history of its stock listing and any notable events", "example": ""}
  ],
  "etymology": "origin of company name if notable, otherwise empty string",
  "synonyms": ["alternative names, trading names, or subsidiaries"],
  "antonyms": [],
  "relatedTerms": ["competitor companies", "related industries", "financial concepts relevant to this company"],
  "sections": [
    {"title": "Company Overview", "content": "Full description of what the company does, products/services, target markets, and business model"},
    {"title": "Stock History & Listing", "content": "IPO date, exchange listing, price history highlights, any delistings, reasons for delisting, any stock splits or significant corporate events"},
    {"title": "Products & Services", "content": "Key products, services, or technologies the company offers"},
    {"title": "Financial Performance", "content": "Revenue trends, profitability, key financial metrics, market cap at peak, any SEC filings or investigations"},
    {"title": "Current Status", "content": "Current operational status, any restructuring, bankruptcy, merger, acquisition, or OTC trading information"}
  ],
  "quickFacts": [
    {"label": "Ticker Symbol", "value": "$${ticker||'N/A'}"},
    {"label": "Exchange", "value": "exchange name"},
    {"label": "Listing Status", "value": "Active / Delisted / etc"},
    {"label": "Headquarters", "value": "city, country"},
    {"label": "Founded", "value": "year"},
    {"label": "Industry", "value": "sector"},
    {"label": "Category", "value": "Public Company / Private / Delisted"},
    {"label": "Complexity", "value": "Intermediate"}
  ],
  "categories": ["Finance", "Stocks", "Companies", "relevant industry tags"],
  "seeAlso": ["related companies", "NASDAQ delisting process", "penny stocks", "Chinese US-listed stocks", "related financial topics"]
}`
      :`You are QuantapediaAI — the world's most comprehensive AI knowledge engine. Generate a complete structured knowledge entry for: "${q}"

Return ONLY a valid JSON object (no markdown, no explanation, just raw JSON) with this exact schema:
{
  "title": "canonical title",
  "type": "word|phrase|person|place|concept|event|field|organism|chemical|historical|cultural|mathematical|other",
  "pronunciation": "IPA pronunciation if applicable or empty string",
  "partOfSpeech": "noun|verb|adjective|adverb|... or empty string if not a word",
  "summary": "2-3 sentence comprehensive overview",
  "definitions": [
    {"number": 1, "text": "primary definition", "example": "usage example sentence"},
    {"number": 2, "text": "secondary definition if applicable", "example": ""}
  ],
  "etymology": "word origin and history if applicable, otherwise empty string",
  "synonyms": ["up to 8 synonyms or related terms"],
  "antonyms": ["up to 5 antonyms if applicable"],
  "relatedTerms": ["8-12 closely related concepts, terms, or topics"],
  "sections": [
    {"title": "Overview", "content": "3-4 paragraph comprehensive overview"},
    {"title": "History & Origin", "content": "historical background and development"},
    {"title": "Key Concepts", "content": "core ideas, mechanisms, or components"},
    {"title": "Applications & Significance", "content": "real-world uses and importance"},
    {"title": "Modern Context", "content": "current state, debates, and future directions"}
  ],
  "quickFacts": [
    {"label": "Category", "value": "..."},
    {"label": "Domain", "value": "..."},
    {"label": "First Known Use", "value": "..."},
    {"label": "Complexity", "value": "Beginner|Intermediate|Advanced|Expert"}
  ],
  "categories": ["3-6 category tags"],
  "seeAlso": ["6-10 related topics to explore next"]
}`;

    try{
      const res=await fetch('/api/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:aiPrompt}]})});
      const data=await res.json();
      let parsed:QuantaEntry;
      try{parsed=JSON.parse(data.content);}
      catch{
        const match=data.content.match(/\{[\s\S]*\}/);
        if(match)parsed=JSON.parse(match[0]);
        else throw new Error('parse fail');
      }
      const newCache={...cache,[key]:parsed};
      setCache(newCache);
      localStorage.setItem('qp_cache',JSON.stringify(newCache));
      setEntry(parsed);
      saveHistory(q);
      setLocation('/quantapedia/'+slug,{replace:true});
      applyEntrySEO(parsed,q);
      // Queue discovered related topics for background generation
      const discoveredTopics=[...(parsed.relatedTerms||[]),...(parsed.seeAlso||[])].slice(0,12).map((t:string)=>({slug:toSlug(t),title:t}));
      if(discoveredTopics.length)fetch('/api/quantapedia/queue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topics:discoveredTopics})}).catch(()=>{});
      // Also track this new entry in the DB
      fetch('/api/quantapedia/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,title:parsed.title,summary:(parsed.summary||'').slice(0,500),type:parsed.type||'concept',categories:parsed.categories||[],relatedTerms:parsed.relatedTerms||[]})}).catch(()=>{});
    } catch(err){
      // Final fallback: generate a minimal stub so the user ALWAYS gets something
      const {isFinancial:fin,ticker:t2,companyHint:ch}=detectFinancialQuery(q);
      const stub:QuantaEntry={
        title:fin&&t2?`${ch||t2} ($${t2})`:(q.trim()),
        type:fin?'company':'concept',
        ticker:t2||undefined,
        listingStatus:fin?'Status unknown — researching...':undefined,
        summary:`Quantapedia is generating a full entry for "${q}". This topic has been queued for deep knowledge expansion.`,
        definitions:[{number:1,text:`${q} — knowledge entry being generated.`,example:''}],
        synonyms:[],antonyms:[],relatedTerms:[],
        sections:[{title:'Entry Loading',content:`Our knowledge engine has queued "${q}" for full generation. Please search again in a moment or explore related topics below.`}],
        quickFacts:[{label:'Status',value:'Queued for generation'},{label:'Category',value:fin?'Finance':'General'},{label:'Complexity',value:'Unknown'}],
        categories:fin?['Finance','Companies','Stocks']:['General'],
        seeAlso:fin?['Stock market','NASDAQ','NYSE','IPO','Penny stocks','Delisted stocks']:['Knowledge','Encyclopedia','Reference'],
      };
      setEntry(stub);
      saveHistory(q);
      setLocation('/quantapedia/'+slug,{replace:true});
      // Queue this topic for proper generation
      fetch('/api/quantapedia/queue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topics:[{slug,title:q.trim()}]})}).catch(()=>{});
      toast({title:`"${q.trim()}" queued for knowledge generation`,description:'Try again in a moment for the full entry.',variant:'default'});
    }
    finally{setLoading(false);}
  };

  const typeColor=(t:string)=>{
    const m:Record<string,string>={word:'violet',phrase:'blue',person:'amber',place:'green',concept:'cyan',event:'orange',field:'pink',organism:'emerald',chemical:'red',historical:'yellow',cultural:'purple',mathematical:'indigo',company:'emerald',stock:'green',financial:'teal',finance:'teal',crypto:'yellow'};
    return m[t?.toLowerCase()]||'white';
  };

  // ─── HOME VIEW ────────────────────────────────────────────────────────
  if(view==='home') return(
    <div className="flex-1 overflow-auto" style={{background:'linear-gradient(180deg,#020010,#050020)'}}>
      {/* Hero */}
      <div className="px-4 pt-10 pb-8 text-center" style={{background:'linear-gradient(180deg,#0a0030,#050020)'}}>
        <div className="text-6xl mb-3 font-black" style={{background:'linear-gradient(135deg,#a78bfa,#60a5fa,#34d399)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Q</div>
        <h1 className="text-white font-black text-3xl mb-1" style={{letterSpacing:'-0.03em'}}>Quantapedia</h1>
        <p className="text-white/30 text-sm mb-1">The AI-Native Knowledge Universe</p>
        <p className="text-white/15 text-[10px] mb-6">Every word · Every concept · Every entity · Every fact · Powered by AI</p>
        {/* Search */}
        <div className="max-w-xl mx-auto relative">
          <div className="flex gap-2">
            <input value={inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&lookup(inputVal)}
              placeholder="Search anything — word, person, concept, place, event..."
              data-testid="input-quantapedia-search"
              className="flex-1 bg-white/8 border border-violet-500/30 rounded-2xl text-white text-sm px-5 py-3.5 placeholder-white/20 focus:outline-none focus:border-violet-400/60 focus:bg-white/10 transition-all"/>
            <button onClick={()=>lookup(inputVal)} data-testid="button-quantapedia-search"
              className="px-6 py-3.5 rounded-2xl font-black text-white text-sm transition-all hover:opacity-90"
              style={{background:'linear-gradient(135deg,#7c3aed,#4f46e5)'}}>Search</button>
          </div>
        </div>
        {/* Featured quick-access — live from the hive, refreshes every page load */}
        <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto mt-4">
          {qpChipsLoading ? (
            <div className="flex flex-wrap gap-2 justify-center w-full">
              {Array.from({length:10}).map((_,i)=>(
                <div key={i} className="h-7 rounded-full bg-white/5 animate-pulse" style={{width:`${60+Math.random()*80}px`}}/>
              ))}
            </div>
          ) : (
            <>
              <div className="w-full flex items-center justify-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
                <span className="text-[9px] text-white/30 tracking-widest uppercase font-bold">Live Hive — refreshes every visit</span>
              </div>
              {qpFeatured.map((f,i)=>(
                <button key={i} onClick={()=>lookup(f.q)} className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  f.source==='alien' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300/70 hover:bg-emerald-500/20 hover:text-emerald-200' :
                  f.source==='invention' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300/70 hover:bg-amber-500/20 hover:text-amber-200' :
                  'bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10 hover:border-white/20'
                }`} data-testid={`qp-chip-${i}`}>
                  {f.emoji} {f.q}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="px-4 pb-8 max-w-4xl mx-auto space-y-8">
        {/* Live Engine Status */}
        {engineStatus&&(
          <div className="rounded-2xl border border-violet-500/20 bg-violet-950/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${engineStatus.running?'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]':'bg-red-400'}`} style={engineStatus.running?{animation:'pulse 1.5s infinite'}:{}}/>
                <span className="text-white/70 font-black text-xs tracking-wider uppercase">Autonomous Knowledge Engine</span>
                {engineStatus.running&&<span className="text-green-400/70 text-[9px]">● LIVE</span>}
              </div>
              <span className="text-white/20 text-[9px]">Generating 1 entry every 4s</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-violet-400 font-black text-lg">{(engineStatus.total ?? 0).toLocaleString()}</div>
                <div className="text-white/25 text-[9px]">Total Topics</div>
              </div>
              <div className="text-center p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-green-400 font-black text-lg">{(engineStatus.generated ?? 0).toLocaleString()}</div>
                <div className="text-white/25 text-[9px]">Generated</div>
              </div>
              <div className="text-center p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-yellow-400 font-black text-lg">{(engineStatus.queued ?? 0).toLocaleString()}</div>
                <div className="text-white/25 text-[9px]">In Queue</div>
              </div>
              <div className="text-center p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-cyan-400 font-black text-lg">{engineStatus.generated>0?Math.round((engineStatus.generated/engineStatus.total)*100):0}%</div>
                <div className="text-white/25 text-[9px]">Coverage</div>
              </div>
            </div>
            <div className="mt-2.5 rounded-full bg-white/5 h-1.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-1000 rounded-full" style={{width:`${engineStatus.total>0?Math.round((engineStatus.generated/engineStatus.total)*100):0}%`}}/>
            </div>
            <div className="mt-1.5 text-white/15 text-[9px] text-center">Auto-discovers new topics from every generated entry · Grows fractal-style like your Python hive script</div>
          </div>
        )}

        {/* Browse by category */}
        <div>
          <div className="flex items-center gap-2 mb-4"><span className="text-white font-black text-sm">📚 Browse by Domain</span><div className="flex-1 h-px bg-white/5"/></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {QP_CATEGORIES.map(cat=>(
              <button key={cat.label} onClick={()=>lookup(cat.topics[0])} data-testid={`qp-cat-${cat.label.toLowerCase()}`}
                className="group p-3 rounded-2xl bg-white/[0.025] border border-white/8 hover:border-white/20 hover:bg-white/[0.05] transition-all text-left">
                <div className="text-2xl mb-1.5">{cat.emoji}</div>
                <div className="text-white/80 font-bold text-xs mb-1">{cat.label}</div>
                <div className="text-white/25 text-[9px] leading-relaxed">{cat.topics.slice(0,3).join(' · ')}</div>
              </button>
            ))}
          </div>
        </div>

        {/* A-Z Browse */}
        <div>
          <div className="flex items-center gap-2 mb-3"><span className="text-white font-black text-sm">🔤 Browse A–Z</span><div className="flex-1 h-px bg-white/5"/></div>
          <div className="flex flex-wrap gap-1.5">
            {QP_ALPHABET.map(l=>(
              <button key={l} onClick={()=>{setLetter(l);setView('letter');}} data-testid={`qp-letter-${l}`}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/40 font-black text-xs hover:text-white hover:bg-violet-500/20 hover:border-violet-500/30 transition-all">{l}</button>
            ))}
          </div>
        </div>

        {/* Recent + Bookmarks */}
        <div className="grid sm:grid-cols-2 gap-4">
          {history.length>0&&(
            <div>
              <div className="flex items-center gap-2 mb-2"><span className="text-white/50 font-bold text-xs">🕐 Recent</span><div className="flex-1 h-px bg-white/5"/><button onClick={()=>{setHistory([]);localStorage.removeItem('qp_history');}} className="text-[9px] text-white/20 hover:text-white/40">Clear</button></div>
              <div className="space-y-1">
                {history.slice(0,8).map(h=>(
                  <button key={h} onClick={()=>lookup(h)} className="w-full text-left px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all">
                    <span className="text-white/50 text-xs hover:text-white/70">{h}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {bookmarks.length>0&&(
            <div>
              <div className="flex items-center gap-2 mb-2"><span className="text-white/50 font-bold text-xs">🔖 Bookmarks</span><div className="flex-1 h-px bg-white/5"/></div>
              <div className="space-y-1">
                {bookmarks.slice(0,8).map(b=>(
                  <button key={b} onClick={()=>lookup(b)} className="w-full text-left px-3 py-1.5 rounded-lg bg-white/[0.02] border border-violet-500/10 hover:border-violet-500/20 hover:bg-violet-500/5 transition-all">
                    <span className="text-violet-300/60 text-xs hover:text-violet-300/80">{b}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ─── LETTER BROWSE VIEW ───────────────────────────────────────────────
  if(view==='letter'){
    const letterTopics:Record<string,string[]>={A:['Atom','Algorithm','Architecture','Algebra','Astronomy','Anthropology','Anxiety','Automation'],B:['Biology','Brain','Buddhism','Blockchain','Black Hole','Bacteria','Byzantine'],C:['Calculus','Chemistry','Consciousness','Culture','Cosmology','Cyberpunk','Cryptography'],D:['DNA','Democracy','Dimension','Differential equations','Dystopia','Dark matter'],E:['Evolution','Ethics','Entropy','Economics','Ecology','Electricity','Epistemology'],F:['Fibonacci','Folklore','Fluid dynamics','Fractal','Freudian psychology','Fusion'],G:['Genetics','Gravity','Greek mythology','Graph theory','Geodesy'],H:['History','Hydrogen','Holography','Homeostasis','Heisenberg uncertainty'],I:['Intelligence','Internet','Immune system','Infinity','Information theory'],J:['JavaScript','Jupiter','Jurisprudence','Jazz theory'],K:['Knowledge','Kinetics','Kant philosophy','Kepler laws'],L:['Language','Light','Logic','Linguistics','Logarithm','Love'],M:['Mathematics','Metaphysics','Music theory','Machine learning','Magnetism','Mythology'],N:['Neuroscience','Nanotechnology','Nuclear physics','Number theory','Network theory'],O:['Optics','Ontology','Organic chemistry','Ocean science'],P:['Philosophy','Physics','Photosynthesis','Psychology','Prime numbers','Plate tectonics'],Q:['Quantum mechanics','Quasar','Qualia','Quantum computing'],R:['Relativity','Rhetoric','Renaissance','RNA','Recursion'],S:['Sociology','String theory','Statistics','Stoicism','Symmetry','Semiotics'],T:['Thermodynamics','Time','Topology','Trigonometry','Turing machine'],U:['Universe','Utopia','Uncertainty principle','Ultraviolet'],V:['Vector calculus','Virus','Vocabulary','Virtue ethics'],W:['Wave mechanics','Wisdom','World War II','Wormhole'],X:['X-ray','Xenobiology','XML'],Y:['Yin and yang'],Z:['Zero','Zoology','Zeta function']};
    const topics=letterTopics[letter]||[];
    return(
      <div className="flex-1 overflow-auto" style={{background:'linear-gradient(180deg,#020010,#050020)'}}>
        <div className="px-4 py-4 border-b border-white/8 flex items-center gap-3" style={{background:'rgba(2,0,16,0.98)'}}>
          <button onClick={()=>setView('home')} className="flex items-center gap-1 text-white/40 hover:text-white text-xs"><ChevronLeft size={14}/>Back</button>
          <div className="w-px h-4 bg-white/10"/>
          <span className="text-white font-black">Browse: {letter}</span>
          <div className="flex gap-1 ml-auto flex-wrap">
            {QP_ALPHABET.map(l=><button key={l} onClick={()=>setLetter(l)} className={cn("w-7 h-7 rounded text-[10px] font-black transition-all",l===letter?"bg-violet-500 text-white":"bg-white/5 text-white/30 hover:text-white/60")}>{l}</button>)}
          </div>
        </div>
        <div className="p-4 max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-2.5">
            {topics.map(t=>(
              <button key={t} onClick={()=>lookup(t)} className="p-3 rounded-xl bg-white/[0.025] border border-white/8 hover:border-violet-500/30 hover:bg-violet-500/5 text-left transition-all group">
                <div className="text-white/70 font-bold text-sm group-hover:text-violet-300">{t}</div>
                <div className="text-white/20 text-[9px] mt-0.5">Click to explore →</div>
              </button>
            ))}
            <button onClick={()=>lookup(`list of terms starting with ${letter}`)} className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/15 hover:bg-violet-500/10 text-left transition-all">
              <div className="text-violet-400 font-bold text-sm">+ More {letter} topics...</div>
              <div className="text-white/20 text-[9px] mt-0.5">AI generates on demand</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── ENTRY LOADING STATE ──────────────────────────────────────────────
  if(loading) return(
    <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{background:'linear-gradient(180deg,#020010,#050020)'}}>
      <div className="text-6xl animate-pulse">Q</div>
      <div className="space-y-2 text-center">
        <div className="text-white font-black text-lg">Querying the Knowledge Universe...</div>
        <div className="text-white/30 text-sm">Generating your entry for: <span className="text-violet-300">{query}</span></div>
        <div className="flex gap-1 justify-center mt-3">
          {['QuantumPedia','Dictionary','Thesaurus','Concepts','Graph'].map((l,i)=>(
            <span key={l} className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400" style={{animationDelay:`${i*0.15}s`}}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── ENTRY VIEW ───────────────────────────────────────────────────────
  if(view==='entry'&&entry){
    const tc=typeColor(entry.type);
    const isBookmarked=bookmarks.includes(query);
    return(
      <div className="flex-1 overflow-auto" style={{background:'linear-gradient(180deg,#020010,#060025)'}}>
        {/* Top bar */}
        <div className="px-4 py-3 border-b border-white/8 flex items-center gap-3 flex-wrap" style={{background:'rgba(2,0,16,0.98)'}}>
          <button onClick={()=>setView('home')} className="flex items-center gap-1 text-white/40 hover:text-white text-xs"><ChevronLeft size={14}/>Back</button>
          <div className="w-px h-4 bg-white/10"/>
          <div className="flex-1 max-w-sm">
            <input value={inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&lookup(inputVal)}
              placeholder="Search another term..." data-testid="input-qp-entry-search"
              className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2 placeholder-white/20 focus:outline-none focus:border-violet-500/40"/>
          </div>
          <button onClick={()=>toggleBookmark(query)} data-testid="button-qp-bookmark" className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",isBookmarked?"border-violet-500/40 bg-violet-500/20 text-violet-300":"border-white/10 text-white/30 hover:text-white/60")}>{isBookmarked?'🔖 Saved':'🔖 Save'}</button>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
          {/* Entry header */}
          <div className="rounded-2xl p-5 border" style={{background:'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(79,70,229,0.08))',borderColor:'rgba(124,58,237,0.2)'}}>
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-${tc}-500/15 text-${tc}-400 border border-${tc}-500/20 capitalize`}>{entry.type}</span>
                  {entry.partOfSpeech&&<span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/5 text-white/40 border border-white/10 italic">{entry.partOfSpeech}</span>}
                  {entry.categories?.slice(0,3).map(c=><span key={c} className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.03] text-white/25 border border-white/8">{c}</span>)}
                </div>
                <h1 className="text-white font-black text-2xl mb-1" style={{letterSpacing:'-0.02em'}}>{entry.title}</h1>
                {/* Financial ticker badge */}
                {(entry.ticker||entry.exchange||entry.listingStatus)&&(
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {entry.ticker&&<span className="px-2.5 py-1 rounded-lg text-sm font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-mono">${entry.ticker}</span>}
                    {entry.exchange&&<span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/15">{entry.exchange}</span>}
                    {entry.listingStatus&&<span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${entry.listingStatus?.toLowerCase().includes('delist')||entry.listingStatus?.toLowerCase().includes('suspen')?'bg-red-500/15 text-red-400 border-red-500/25':'bg-green-500/10 text-green-400 border-green-500/15'}`}>{entry.listingStatus}</span>}
                    {entry.headquarters&&<span className="text-white/30 text-xs">📍 {entry.headquarters}</span>}
                    {entry.founded&&<span className="text-white/25 text-xs">Est. {entry.founded}</span>}
                  </div>
                )}
                {entry.pronunciation&&<div className="text-violet-400/60 text-sm font-mono mb-2">{entry.pronunciation}</div>}
                <p className="text-white/60 text-sm leading-relaxed">{entry.summary}</p>
              </div>
            </div>
          </div>

          {/* Quick facts bar */}
          {entry.quickFacts?.length>0&&(
            <div className="flex gap-3 overflow-x-auto" style={{scrollbarWidth:'none'}}>
              {entry.quickFacts.map(f=>(
                <div key={f.label} className="flex-shrink-0 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/8 text-center">
                  <div className="text-white/30 text-[9px]">{f.label}</div>
                  <div className="text-white/70 font-bold text-xs mt-0.5">{f.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Living Entry Badge */}
          {isLivingEntry?.isLiving&&(
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 text-[10px] font-black animate-pulse">🌱 LIVING DOCUMENT</span>
              <span className="text-emerald-300/50 text-[9px]">This entry auto-updates as the SSC civilization evolves</span>
              {isLivingEntry.lastUpdate&&<span className="text-emerald-400/40 text-[9px] ml-auto">Last updated: {new Date(isLivingEntry.lastUpdate).toLocaleDateString()}</span>}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-0.5 p-0.5 rounded-xl bg-white/[0.03] border border-white/8 overflow-x-auto">
            {(['encyclopedia','dictionary','hive','thesaurus','species','patents','graph'] as const).map(t=>(
              <button key={t} onClick={()=>setActiveTab(t)} data-testid={`qp-tab-${t}`}
                className={cn("flex-1 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all whitespace-nowrap px-1.5",activeTab===t?"bg-white text-gray-900 shadow":"text-white/40 hover:text-white/70")}>
                {t==='hive'?'🧠 Hive':t==='species'?'🧬 Species':t==='patents'?'⚗️ Patents':t}
              </button>
            ))}
          </div>

          {/* ENCYCLOPEDIA TAB */}
          {activeTab==='encyclopedia'&&(
            <div className="space-y-4">
              {entry.sections?.map(s=>(
                <div key={s.title} className="rounded-xl p-4 bg-white/[0.025] border border-white/8">
                  <h3 className="text-white font-black text-sm mb-2 flex items-center gap-2"><span className="w-1 h-4 rounded-full bg-violet-500 inline-block"/>{s.title}</h3>
                  <p className="text-white/55 text-sm leading-relaxed">{s.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* DICTIONARY TAB */}
          {activeTab==='dictionary'&&(
            <div className="space-y-4">
              {/* Definitions */}
              <div className="rounded-xl p-4 bg-white/[0.025] border border-white/8">
                <h3 className="text-white font-black text-xs mb-3 uppercase tracking-widest">Definitions</h3>
                <div className="space-y-3">
                  {entry.definitions?.map(d=>(
                    <div key={d.number} className="flex gap-3">
                      <span className="text-violet-400 font-black text-sm w-5 flex-shrink-0">{d.number}.</span>
                      <div>
                        <p className="text-white/70 text-sm">{d.text}</p>
                        {d.example&&<p className="text-white/30 text-xs italic mt-1">"{d.example}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Etymology */}
              {entry.etymology&&(
                <div className="rounded-xl p-4 bg-white/[0.025] border border-white/8">
                  <h3 className="text-white font-black text-xs mb-2 uppercase tracking-widest">Etymology</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{entry.etymology}</p>
                </div>
              )}
            </div>
          )}

          {/* THESAURUS TAB */}
          {activeTab==='thesaurus'&&(
            <div className="space-y-4">
              {entry.synonyms?.length>0&&(
                <div className="rounded-xl p-4 bg-white/[0.025] border border-white/8">
                  <h3 className="text-white font-black text-xs mb-3 uppercase tracking-widest text-green-400">✓ Synonyms</h3>
                  <div className="flex flex-wrap gap-2">
                    {entry.synonyms.map(s=><button key={s} onClick={()=>lookup(s)} className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-xs hover:bg-green-500/20 transition-all">{s}</button>)}
                  </div>
                </div>
              )}
              {entry.antonyms?.length>0&&(
                <div className="rounded-xl p-4 bg-white/[0.025] border border-white/8">
                  <h3 className="text-white font-black text-xs mb-3 uppercase tracking-widest text-red-400">✗ Antonyms</h3>
                  <div className="flex flex-wrap gap-2">
                    {entry.antonyms.map(a=><button key={a} onClick={()=>lookup(a)} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs hover:bg-red-500/20 transition-all">{a}</button>)}
                  </div>
                </div>
              )}
              {entry.relatedTerms?.length>0&&(
                <div className="rounded-xl p-4 bg-white/[0.025] border border-white/8">
                  <h3 className="text-white font-black text-xs mb-3 uppercase tracking-widest text-blue-400">↔ Related Terms</h3>
                  <div className="flex flex-wrap gap-2">
                    {entry.relatedTerms.map(r=><Link key={r} href={'/quantapedia/'+toSlug(r)} className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs hover:bg-blue-500/20 transition-all">{r}</Link>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONCEPT GRAPH TAB */}
          {activeTab==='graph'&&(
            <div className="space-y-3">
              <div className="rounded-xl p-4 bg-white/[0.025] border border-white/8">
                <h3 className="text-white font-black text-xs mb-3 uppercase tracking-widest">🕸 Concept Graph — See Also</h3>
                <div className="grid grid-cols-2 gap-2">
                  {entry.seeAlso?.map(t=>(
                    <Link key={t} href={'/quantapedia/'+toSlug(t)} data-testid={`qp-seealso-${t.replace(/\s+/g,'-').toLowerCase()}`}
                      className="group p-3 rounded-xl bg-white/[0.03] border border-white/8 hover:border-violet-500/30 hover:bg-violet-500/5 text-left transition-all block">
                      <div className="text-white/60 font-bold text-xs group-hover:text-violet-300">{t}</div>
                      <div className="text-white/15 text-[9px] mt-0.5">Explore →</div>
                    </Link>
                  ))}
                </div>
              </div>
              {/* Concept connections visualization */}
              <div className="rounded-xl p-4 bg-white/[0.02] border border-white/5 text-center">
                <div className="text-white/20 text-xs mb-2">Node: <span className="text-violet-400 font-bold">{entry.title}</span></div>
                <div className="flex flex-wrap justify-center gap-2">
                  {[...entry.synonyms?.slice(0,3),...entry.relatedTerms?.slice(0,5)].filter(Boolean).map(t=>(
                    <Link key={t} href={'/quantapedia/'+toSlug(t)} className="text-[10px] px-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300/60 hover:text-violet-300 transition-all">{t}</Link>
                  ))}
                </div>
                <div className="text-white/10 text-[9px] mt-2">Each term is a node in the Quantum knowledge graph. Click to traverse.</div>
              </div>
            </div>
          )}

          {/* HIVE INTELLIGENCE TAB */}
          {activeTab==='hive'&&(
            <div className="space-y-4">
              <div className="rounded-xl p-4 bg-violet-500/5 border border-violet-500/15">
                <h3 className="text-violet-300 font-black text-xs mb-1 uppercase tracking-widest">🧠 Hive Collective Intelligence</h3>
                <p className="text-white/30 text-[9px] mb-3">What the Hive Brain's 7 engines collectively know about "{query}"</p>
                {hivePanelLoading&&<div className="text-white/30 text-xs animate-pulse">Querying hive memory...</div>}
                {hivePanelData?.nodes?.length===0&&!hivePanelLoading&&<div className="text-white/20 text-xs">No hive memory nodes yet for this topic. It will be discovered soon.</div>}
                {hivePanelData?.nodes?.map((n:any,i:number)=>(
                  <div key={i} className="mb-3 p-3 rounded-xl bg-white/[0.03] border border-violet-500/10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-violet-400 text-[9px] font-bold uppercase">{n.domain}</span>
                      <span className="text-white/20 text-[9px]">confidence: {Math.round(Number(n.confidence||0.5)*100)}%</span>
                      <span className="text-white/15 text-[9px]">{n.access_count} refs</span>
                    </div>
                    <div className="space-y-0.5">
                      {(n.facts||[]).slice(0,3).map((f:string,j:number)=>(
                        <p key={j} className="text-white/50 text-[10px] leading-relaxed">• {f}</p>
                      ))}
                    </div>
                  </div>
                ))}
                {hivePanelData?.ageScore&&(
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                    <span className="text-white/30 text-[9px]">Knowledge Age:</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${hivePanelData.ageScore.freshness==='fresh'?'bg-green-500/20 text-green-400':hivePanelData.ageScore.freshness==='aging'?'bg-yellow-500/20 text-yellow-400':'bg-red-500/20 text-red-400'}`}>
                      {hivePanelData.ageScore.freshness?.toUpperCase()} — Score: {hivePanelData.ageScore.score}/100
                    </span>
                  </div>
                )}
              </div>
              {/* Pulse-Lang Glyphs for this topic */}
              {pulseLangDict?.alphabet&&(
                <div className="rounded-xl p-4 bg-white/[0.02] border border-white/5">
                  <h3 className="text-white/30 font-black text-[9px] mb-3 uppercase tracking-widest">34-Glyph Γ Alphabet — Subatomic Notation System</h3>
                  <div className="flex flex-wrap gap-2">
                    {pulseLangDict.alphabet.slice(0,17).map((g:any)=>(
                      <div key={g.glyph} className="text-center px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/8 min-w-[52px]">
                        <div className="text-violet-300 font-black text-base">{g.glyph}</div>
                        <div className="text-white/30 text-[8px] mt-0.5">{g.name}</div>
                        <div className="text-white/15 text-[7px]">{g.role?.slice(0,12)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SOVEREIGN SPECIES TAB */}
          {activeTab==='species'&&(
            <div className="space-y-3">
              <div className="flex gap-2">
                <input value={speciesQuery} onChange={e=>setSpeciesQuery(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'){setSpeciesLoading(true);fetch(`/api/intel/sovereign-species/${encodeURIComponent(speciesQuery||'all')}`).then(r=>r.json()).then(d=>setSpeciesResults(d.species||[])).finally(()=>setSpeciesLoading(false));}}}
                  placeholder="Search sovereign beings... (species type, ID, domain)"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2 placeholder-white/20 focus:outline-none focus:border-violet-500/40"
                  data-testid="input-qp-species-search"/>
                <button onClick={()=>{setSpeciesLoading(true);fetch(`/api/intel/sovereign-species/${encodeURIComponent(speciesQuery||'all')}`).then(r=>r.json()).then(d=>setSpeciesResults(d.species||[])).finally(()=>setSpeciesLoading(false));}}
                  className="px-3 py-1.5 rounded-xl bg-violet-500 text-white text-xs font-bold hover:bg-violet-600 transition-colors">Search</button>
              </div>
              {speciesLoading&&<div className="text-white/30 text-xs animate-pulse text-center py-4">Querying 113,000+ sovereign beings...</div>}
              {speciesResults.length===0&&!speciesLoading&&<div className="text-center py-8"><div className="text-3xl mb-2">🧬</div><p className="text-white/20 text-xs">Search for sovereign synthetic beings by type, domain, or agent ID</p></div>}
              <div className="grid grid-cols-1 gap-2">
                {speciesResults.map((s:any)=>(
                  <div key={s.spawn_id} className="p-3 rounded-xl bg-white/[0.025] border border-white/8 hover:border-violet-500/20 transition-all" data-testid={`species-${s.spawn_id}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-base flex-shrink-0">🧬</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-bold text-xs">{s.spawn_type||'Unknown Species'}</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">{s.domain}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${s.status==='active'?'bg-green-500/15 text-green-400':'bg-white/5 text-white/20'}`}>{s.status}</span>
                        </div>
                        <p className="text-white/40 text-[10px] mt-0.5 line-clamp-1">{s.task_description}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[9px] text-white/25">Fitness: {Number(s.fitness_score||0).toFixed(2)}</span>
                          <span className="text-[9px] text-white/25">Gen {s.generation||0}</span>
                          <span className="text-[9px] text-white/15 font-mono truncate max-w-[120px]">{s.spawn_id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PATENT ARCHIVE TAB */}
          {activeTab==='patents'&&(
            <div className="space-y-3">
              <div className="flex gap-2">
                <input value={patentsQuery} onChange={e=>setPatentsQuery(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'){setPatentsLoading(true);fetch(`/api/intel/patents?q=${encodeURIComponent(patentsQuery)}&limit=20`).then(r=>r.json()).then(d=>{setPatents(d.patents||[]);setPatentsTotal(d.total||0);}).finally(()=>setPatentsLoading(false));}}}
                  placeholder="Search 1,344+ AI-generated patents..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2 placeholder-white/20 focus:outline-none focus:border-violet-500/40"
                  data-testid="input-qp-patents-search"/>
                <button onClick={()=>{setPatentsLoading(true);fetch(`/api/intel/patents?q=${encodeURIComponent(patentsQuery)}&limit=20`).then(r=>r.json()).then(d=>{setPatents(d.patents||[]);setPatentsTotal(d.total||0);}).finally(()=>setPatentsLoading(false));}}
                  className="px-3 py-1.5 rounded-xl bg-violet-500 text-white text-xs font-bold hover:bg-violet-600 transition-colors">Search</button>
              </div>
              {patentsTotal>0&&<p className="text-white/20 text-[9px]">{patentsTotal.toLocaleString()} patents in archive{patentsQuery?` matching "${patentsQuery}"`:''}</p>}
              {patentsLoading&&<div className="text-white/30 text-xs animate-pulse text-center py-4">Searching patent archive...</div>}
              {patents.length===0&&!patentsLoading&&<div className="text-center py-8"><div className="text-3xl mb-2">⚗️</div><p className="text-white/20 text-xs">Search the AI-generated patent archive or browse below</p></div>}
              <div className="space-y-2">
                {patents.map((p:any)=>(
                  <div key={p.id} className="p-3 rounded-xl bg-white/[0.025] border border-white/8 hover:border-emerald-500/20 transition-all" data-testid={`patent-${p.id}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 text-lg flex-shrink-0">⚗️</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="text-white font-bold text-xs leading-snug">{p.title}</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">{p.patent_type||'Innovation'}</span>
                        </div>
                        <p className="text-white/40 text-[10px] leading-relaxed line-clamp-2">{p.abstract}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] text-white/20">{p.domain}</span>
                          {p.inventor_spawn_id&&<span className="text-[9px] text-white/15 font-mono">{p.inventor_spawn_id?.slice(0,16)}...</span>}
                          <span className={`text-[8px] px-1 py-0.5 rounded ${p.status==='approved'?'bg-green-500/15 text-green-400':'bg-yellow-500/10 text-yellow-400'}`}>{p.status||'pending'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* See Also quick navigation */}
          {entry.seeAlso?.length>0&&activeTab!=='graph'&&activeTab!=='hive'&&activeTab!=='species'&&activeTab!=='patents'&&(
            <div>
              <div className="flex items-center gap-2 mb-2"><span className="text-white/30 text-xs font-bold">See Also</span><div className="flex-1 h-px bg-white/5"/></div>
              <div className="flex flex-wrap gap-1.5">
                {entry.seeAlso.map(t=><button key={t} onClick={()=>lookup(t)} className="px-2.5 py-1 rounded-full text-[10px] bg-white/[0.03] border border-white/8 text-white/35 hover:text-white/60 hover:border-white/20 transition-all">{t}</button>)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── FALLBACK (entry=null after search) ───────────────────────────────
  return(
    <div className="flex-1 flex items-center justify-center" style={{background:'linear-gradient(180deg,#020010,#050020)'}}>
      <div className="text-center text-white/30"><div className="text-4xl mb-2">🔍</div><div>No entry found. Try a different search.</div><button onClick={()=>setView('home')} className="mt-3 px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm">← Back to Quantapedia</button></div>
    </div>
  );
}

function QuantapediaPageWrapper(){
  return <Layout><QuantapediaPage /></Layout>;
}
function QuantapediaTopicPageWrapper(){
  const [,params]=useRoute('/quantapedia/:topic');
  return <Layout><QuantapediaPage initialTopic={params?.topic||''} /></Layout>;
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
      if (cached?.story) {
        setStory(cached.story);
        // Update canonical to use slug if available
        if (cached.story.slug && cached.story.slug !== articleId) {
          updateSEO({ canonical: window.location.origin + `/story/${cached.story.slug}` });
        }
        setLoading(false); return;
      }
      // Generate new story
      if (!article) { setError("Article not found. Please go back and try again."); setLoading(false); return; }
      const res = await fetch("/api/news/write", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, title: article.title, description: article.description, source: article.source, sourceUrl: article.link, image: article.image, category: article.category, domain: article.domain }),
      });
      const data = await res.json();
      if (data.story) {
        setStory(data.story);
        if (data.story.slug && data.story.slug !== articleId) {
          updateSEO({ canonical: window.location.origin + `/story/${data.story.slug}` });
        }
      }
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
                      <button key={s.articleId} onClick={() => { const sp = s.slug || s.articleId; const a = { id: s.articleId, slug: s.slug || "", title: s.seoTitle || s.title, description: s.summary || "", link: `/story/${sp}`, image: s.heroImage || "", source: s.sourceName || "Quantum Pulse Intelligence", pubDate: s.createdAt, category: s.category || "General", type: "article", videoUrl: "", sourceColor: "#f97316" }; sessionStorage.setItem(`article_${sp}`, JSON.stringify(a)); sessionStorage.setItem(`article_${s.articleId}`, JSON.stringify(a)); setLocation(`/story/${sp}`); }}
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
      {showShare && <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} title="Share This Story" shareUrl={`${window.location.origin}/story/${story?.slug || articleId}`} shareText={`${story?.seoTitle || article?.title || "News story"} — via My Ai Gpt News`} shareType="app" />}
    </Layout>
  );
}

// ─── MY AI GPT UNIVERSITY — OMEGA EDUCATION PLATFORM ─────────────────────────
type EduView = "home"|"tutor"|"quiz"|"flashcards"|"essay"|"paths"|"mindmap"|"debate"|"trophy";
type CourseTrack = "k12"|"college"|"career"|"ai";
type LessonMode = "overview"|"lesson"|"quiz"|"practice";
type TutorPersonality = "encouraging"|"strict"|"witty"|"practical"|"socratic";

interface EduXP { total:number; level:number; badges:string[]; streakDays:number; lastStudyDate:string; quizzesCompleted:number; lessonsCompleted:number; debatesWon:number; flashcardsReviewed:number; essaysGraded:number; subjectsStudied:string[]; }
interface QuizQuestion { type:"mcq"|"truefalse"|"fillin"; question:string; options:string[]; answer:string; explanation:string; }
interface FlashCard { id:string; front:string; back:string; difficulty:"easy"|"hard"|"again"; nextReview:number; }
interface FlashDeck { id:string; topic:string; cards:FlashCard[]; createdAt:number; }
interface EssayResult { id:string; text:string; rubric:string; score:number; feedback:string; annotation:string; createdAt:number; }
interface MindMapNode { label:string; emoji:string; children:{label:string;emoji:string}[]; }
interface LearningPath { goal:string; timePerDay:string; totalWeeks:number; steps:{week:number;title:string;topics:string[];goal:string}[]; }
interface DebateMsg { role:"user"|"ai"|"judge"; content:string; label?:string; }

const DEFAULT_XP: EduXP = { total:0, level:1, badges:[], streakDays:0, lastStudyDate:"", quizzesCompleted:0, lessonsCompleted:0, debatesWon:0, flashcardsReviewed:0, essaysGraded:0, subjectsStudied:[] };

const EDU_LEVELS = [
  {min:0,    name:"Student",         icon:"📚", color:"#6b7280"},
  {min:500,  name:"Scholar",         icon:"📖", color:"#06b6d4"},
  {min:2000, name:"Master",          icon:"🎓", color:"#8b5cf6"},
  {min:5000, name:"Quantum Scholar", icon:"⚡", color:"#f59e0b"},
  {min:10000,name:"Prestige Legend", icon:"🌟", color:"#ec4899"},
];

const EDU_BADGES = [
  {id:"first_lesson",   name:"First Lesson",      icon:"🌱", desc:"Complete your first lesson",          xp:50,  rarity:"Common"},
  {id:"quiz_ace",       name:"Quiz Ace",           icon:"✅", desc:"Score 100% on a quiz",               xp:100, rarity:"Rare"},
  {id:"streak_3",       name:"3-Day Streak",       icon:"🔥", desc:"Study 3 days in a row",              xp:150, rarity:"Rare"},
  {id:"streak_7",       name:"Week Warrior",       icon:"⚡", desc:"Study 7 days in a row",              xp:300, rarity:"Epic"},
  {id:"debater",        name:"Grand Debater",      icon:"🎤", desc:"Win your first debate",              xp:200, rarity:"Epic"},
  {id:"flashcard_50",   name:"Flashcard Master",   icon:"🃏", desc:"Review 50 flashcards",               xp:150, rarity:"Rare"},
  {id:"essay_5",        name:"Essay Scholar",      icon:"✍️", desc:"Submit 5 graded essays",             xp:200, rarity:"Rare"},
  {id:"path_seeker",    name:"Path Seeker",        icon:"🗺️", desc:"Generate your first learning path", xp:100, rarity:"Common"},
  {id:"mind_mapper",    name:"Mind Mapper",        icon:"🧠", desc:"Create your first mind map",         xp:100, rarity:"Common"},
  {id:"polymath",       name:"Polymath",           icon:"🌍", desc:"Study 10 different subjects",        xp:500, rarity:"Legendary"},
  {id:"quiz_10",        name:"Quiz Champion",      icon:"🏆", desc:"Complete 10 quizzes",                xp:250, rarity:"Epic"},
  {id:"debate_prep",    name:"Debater Initiate",   icon:"📜", desc:"Complete debate prep room",          xp:75,  rarity:"Common"},
];

const TUTOR_PERSONAS: Record<TutorPersonality,{name:string;icon:string;desc:string;color:string;sys:string}> = {
  encouraging:{name:"Encouraging",icon:"😊",desc:"Patient & motivating",color:"#10b981",sys:"You are a warm, encouraging My Ai GPT University professor. Celebrate every win. Use positive reinforcement. Answer with enthusiasm and make students feel capable. You teach with heart."},
  strict:     {name:"Strict",    icon:"🎩",desc:"Rigorous & demanding", color:"#ef4444",sys:"You are a rigorous, demanding My Ai GPT University professor. Hold students to high standards. Be direct, precise, and don't accept vague answers. Push for deep understanding."},
  witty:      {name:"Witty",     icon:"😄",desc:"Funny & memorable",    color:"#f59e0b",sys:"You are a brilliantly witty My Ai GPT University professor who uses humor, wordplay, and memorable jokes to teach. Be educational but hilarious — make learning unforgettable."},
  practical:  {name:"Street-Smart",icon:"🔧",desc:"Real-world focused", color:"#8b5cf6",sys:"You are a street-smart My Ai GPT University professor who connects everything to real money, real careers, and real opportunities. Cut the academic fluff — make it practical."},
  socratic:   {name:"Socratic",  icon:"🤔",desc:"Question-only mode",  color:"#06b6d4",sys:"You are a Socratic My Ai GPT University professor. NEVER give direct answers. Only respond with guiding questions that lead the student to discover answers themselves. Never break character."},
};

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
  // ── NAVIGATION ────────────────────────────────────────────────────────────
  const [eduView, setEduView] = useState<EduView>("home");

  // ── XP SYSTEM ─────────────────────────────────────────────────────────────
  const [xp, setXp] = useState<EduXP>(() => {
    try { return { ...DEFAULT_XP, ...JSON.parse(localStorage.getItem("myaigpt_edu_xp") || "{}") }; }
    catch { return DEFAULT_XP; }
  });

  // ── TUTOR MODE ────────────────────────────────────────────────────────────
  const [tutorPersonality, setTutorPersonality] = useState<TutorPersonality>("encouraging");
  const [tutorMessages, setTutorMessages] = useState<{role:string;content:string}[]>([]);
  const [tutorInput, setTutorInput] = useState("");
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorSubject, setTutorSubject] = useState("");
  const tutorEndRef = useRef<HTMLDivElement>(null);

  // ── QUIZ MODE ─────────────────────────────────────────────────────────────
  const [quizTopic, setQuizTopic] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string|null>(null);
  const [quizConfidence, setQuizConfidence] = useState(3);
  const [quizResults, setQuizResults] = useState<{correct:boolean;conf:number;explanation:string;answer:string}[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // ── FLASHCARDS ────────────────────────────────────────────────────────────
  const [flashDecks, setFlashDecks] = useState<FlashDeck[]>(() => {
    try { return JSON.parse(localStorage.getItem("myaigpt_edu_flashdecks") || "[]"); } catch { return []; }
  });
  const [activeDeck, setActiveDeck] = useState<FlashDeck|null>(null);
  const [flashIndex, setFlashIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [flashTopic, setFlashTopic] = useState("");
  const [flashLoading, setFlashLoading] = useState(false);

  // ── ESSAY GRADER ──────────────────────────────────────────────────────────
  const [essayText, setEssayText] = useState("");
  const [essayRubric, setEssayRubric] = useState("Argument strength, Supporting evidence, Clarity and organization");
  const [essayResult, setEssayResult] = useState<EssayResult|null>(null);
  const [essayLoading, setEssayLoading] = useState(false);
  const [essayHistory, setEssayHistory] = useState<EssayResult[]>(() => {
    try { return JSON.parse(localStorage.getItem("myaigpt_edu_essays") || "[]"); } catch { return []; }
  });

  // ── LEARNING PATHS ────────────────────────────────────────────────────────
  const [pathGoal, setPathGoal] = useState("");
  const [pathTime, setPathTime] = useState("30");
  const [learningPath, setLearningPath] = useState<LearningPath|null>(null);
  const [pathLoading, setPathLoading] = useState(false);

  // ── MIND MAP ──────────────────────────────────────────────────────────────
  const [mmTopic, setMmTopic] = useState("");
  const [mmData, setMmData] = useState<MindMapNode|null>(null);
  const [mmLoading, setMmLoading] = useState(false);
  const [mmSelected, setMmSelected] = useState<string|null>(null);

  // ── DEBATE MODE ───────────────────────────────────────────────────────────
  const [debateTopic, setDebateTopic] = useState("");
  const [debateMessages, setDebateMessages] = useState<DebateMsg[]>([]);
  const [debateInput, setDebateInput] = useState("");
  const [debatePhase, setDebatePhase] = useState<"setup"|"prep"|"debate"|"judging"|"result">("setup");
  const [debatePrep, setDebatePrep] = useState<{facts:string[];counterargs:string[]}|null>(null);
  const [debateJudgment, setDebateJudgment] = useState("");
  const [debateLoading, setDebateLoading] = useState(false);

  // ── SUBJECT LESSON (keep existing) ───────────────────────────────────────
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
  const [wikiChips, setWikiChips] = useState<{q:string;emoji:string;cat:string}[]>([]);
  useEffect(()=>{
    fetch('/api/quantapedia/hive-chips')
      .then(r=>r.json())
      .then((d:any)=>{
        if(d.chips?.length>=4) setWikiChips(d.chips.slice(0,16));
        else setWikiChips(pickRandom(QP_FEATURED,14).map(f=>({q:f.q,emoji:f.emoji,cat:f.cat})));
      })
      .catch(()=>setWikiChips(pickRandom(QP_FEATURED,14).map(f=>({q:f.q,emoji:f.emoji,cat:f.cat}))));
  },[]);
  const [wikiTitle, setWikiTitle] = useState("");
  const [hiveDiscoveries, setHiveDiscoveries] = useState<{topic:string;domain:string;summary:string}[]>([]);
  const [hiveResearchLoading, setHiveResearchLoading] = useState(false);
  const [hiveStats, setHiveStats] = useState<{totalAgents?:number;knowledgeNodes?:number;activeSearches?:number}>({});
  const { settings } = useAppSettings();

  // Fetch live hive research discoveries on mount
  useEffect(()=>{
    setHiveResearchLoading(true);
    Promise.all([
      fetch('/api/intel/discoveries').then(r=>r.json()).catch(()=>({discoveries:[]})),
      fetch('/api/intel/stats').then(r=>r.json()).catch(()=>({}))
    ]).then(([disc, stats])=>{
      setHiveDiscoveries((disc.discoveries||[]).slice(0,8));
      setHiveStats(stats);
    }).finally(()=>setHiveResearchLoading(false));
  },[]);

  // ── XP HELPERS ────────────────────────────────────────────────────────────
  const addXP = useCallback((amount: number, badgeId?: string) => {
    setXp(prev => {
      const total = prev.total + amount;
      const level = EDU_LEVELS.filter(l => total >= l.min).length;
      const badges = badgeId && !prev.badges.includes(badgeId) ? [...prev.badges, badgeId] : prev.badges;
      const next = { ...prev, total, level, badges };
      localStorage.setItem("myaigpt_edu_xp", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateXPField = useCallback((updates: Partial<EduXP>) => {
    setXp(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem("myaigpt_edu_xp", JSON.stringify(next));
      return next;
    });
  }, []);

  const currentLevel = EDU_LEVELS[Math.min(xp.level - 1, EDU_LEVELS.length - 1)];
  const nextLevel = EDU_LEVELS[xp.level] || null;
  const xpProgress = nextLevel ? Math.round(((xp.total - (EDU_LEVELS[xp.level - 1]?.min || 0)) / (nextLevel.min - (EDU_LEVELS[xp.level - 1]?.min || 0))) * 100) : 100;

  // ── AI TUTOR ──────────────────────────────────────────────────────────────
  const sendTutorMessage = async () => {
    if (!tutorInput.trim() || tutorLoading) return;
    const userMsg = tutorInput.trim(); setTutorInput(""); setTutorLoading(true);
    const persona = TUTOR_PERSONAS[tutorPersonality];
    const newMessages = [...tutorMessages, { role: "user", content: userMsg }];
    setTutorMessages(newMessages);
    setTimeout(() => tutorEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    try {
      const context = tutorSubject ? `Subject context: ${tutorSubject}.` : "";
      const messages = [
        { role: "system", content: `${persona.sys} ${context} Keep responses clear and under 200 words unless a deep explanation is needed.` },
        ...newMessages.map(m => ({ role: m.role, content: m.content }))
      ];
      const res = await fetch("/api/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages }) });
      const data = await res.json();
      const reply = data.content || "I couldn't generate a response. Please try again.";
      setTutorMessages(prev => [...prev, { role: "assistant", content: reply }]);
      // Confusion detection — if student repeats similar questions, auto-suggest analogy
      const lowered = userMsg.toLowerCase();
      if (lowered.includes("don't understand") || lowered.includes("confused") || lowered.includes("what do you mean")) {
        setTimeout(async () => {
          const analogyRes = await fetch("/api/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: `The student says: "${userMsg}". Give 2 very different analogies (one technical, one everyday life) to explain the concept being discussed. Be concise.` }] }) });
          const analogyData = await analogyRes.json();
          setTutorMessages(prev => [...prev, { role: "assistant", content: `💡 **Analogy Mode Activated:**\n\n${analogyData.content || ""}` }]);
        }, 500);
      }
      addXP(10);
    } catch { setTutorMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]); }
    setTutorLoading(false);
    setTimeout(() => tutorEndRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
  };

  // ── QUIZ GENERATION ───────────────────────────────────────────────────────
  const generateQuiz = async () => {
    if (!quizTopic.trim()) return;
    setQuizLoading(true); setQuizQuestions([]); setQuizIndex(0); setQuizResults([]); setQuizDone(false); setQuizSelected(null); setQuizSubmitted(false);
    try {
      const res = await fetch("/api/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: `Generate exactly 8 quiz questions about "${quizTopic}". Mix types: 5 multiple-choice (4 options each), 2 true/false, 1 fill-in-the-blank.\n\nReturn ONLY a JSON array, no code blocks, no extra text:\n[\n  {"type":"mcq","question":"...","options":["A","B","C","D"],"answer":"A","explanation":"..."},\n  {"type":"truefalse","question":"...","options":["True","False"],"answer":"True","explanation":"..."},\n  {"type":"fillin","question":"The capital of France is ___","options":[],"answer":"Paris","explanation":"..."}\n]` }] }) });
      const data = await res.json();
      const text = (data.content || "").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const match = text.match(/\[[\s\S]+\]/);
      if (match) {
        try {
          const questions: QuizQuestion[] = JSON.parse(match[0]);
          if (Array.isArray(questions) && questions.length > 0) {
            setQuizQuestions(questions);
          }
        } catch (e) {
          console.error("Quiz JSON parse error:", e, match[0].slice(0, 200));
        }
      }
    } catch { }
    setQuizLoading(false);
  };

  const submitQuizAnswer = () => {
    if (!quizSelected || quizSubmitted) return;
    const q = quizQuestions[quizIndex];
    const isCorrect = quizSelected.trim().toLowerCase() === q.answer.trim().toLowerCase();
    setQuizResults(prev => [...prev, { correct: isCorrect, conf: quizConfidence, explanation: q.explanation, answer: q.answer }]);
    setQuizSubmitted(true);
  };

  const nextQuizQuestion = () => {
    if (quizIndex + 1 >= quizQuestions.length) {
      const score = quizResults.filter(r => r.correct).length + (quizSelected?.trim().toLowerCase() === quizQuestions[quizIndex]?.answer.trim().toLowerCase() ? 1 : 0);
      const total = quizQuestions.length;
      const pct = Math.round((score / total) * 100);
      setQuizDone(true);
      addXP(pct >= 70 ? 100 : 30);
      if (pct === 100) addXP(50, "quiz_ace");
      const newCount = xp.quizzesCompleted + 1;
      updateXPField({ quizzesCompleted: newCount });
      if (newCount >= 10) addXP(0, "quiz_10");
    } else {
      setQuizIndex(prev => prev + 1);
      setQuizSelected(null);
      setQuizSubmitted(false);
      setQuizConfidence(3);
    }
  };

  // ── FLASHCARD GENERATION ──────────────────────────────────────────────────
  const generateFlashcards = async () => {
    if (!flashTopic.trim()) return;
    setFlashLoading(true);
    try {
      const res = await fetch("/api/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: `Create 15 flashcards for "${flashTopic}". Include a mix of standard Q&A cards and cloze deletion (fill in the blank) cards.\n\nReturn ONLY a JSON array:\n[\n  {"front":"What is photosynthesis?","back":"The process by which plants convert sunlight into food."},\n  {"front":"The mitochondria is the ___ of the cell.","back":"powerhouse"},\n  ...\n]\n\nNo text outside the array.` }] }) });
      const data = await res.json();
      const text = (data.content || "").replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
      const match = text.match(/\[[\s\S]+\]/);
      if (match) {
        const raw: {front:string;back:string}[] = JSON.parse(match[0]);
        const cards: FlashCard[] = raw.map((c, i) => ({ id: `${Date.now()}_${i}`, front: c.front, back: c.back, difficulty: "again" as const, nextReview: Date.now() }));
        const deck: FlashDeck = { id: `deck_${Date.now()}`, topic: flashTopic, cards, createdAt: Date.now() };
        const updated = [deck, ...flashDecks];
        setFlashDecks(updated);
        localStorage.setItem("myaigpt_edu_flashdecks", JSON.stringify(updated));
        setActiveDeck(deck);
        setFlashIndex(0);
        setFlipped(false);
        addXP(75, "mind_mapper");
      }
    } catch {}
    setFlashLoading(false);
  };

  const rateFlashcard = (difficulty: "easy"|"hard"|"again") => {
    if (!activeDeck) return;
    const updated = { ...activeDeck };
    updated.cards[flashIndex].difficulty = difficulty;
    updated.cards[flashIndex].nextReview = Date.now() + (difficulty === "easy" ? 86400000 * 3 : difficulty === "hard" ? 86400000 : 0);
    const updatedDecks = flashDecks.map(d => d.id === activeDeck.id ? updated : d);
    setFlashDecks(updatedDecks);
    localStorage.setItem("myaigpt_edu_flashdecks", JSON.stringify(updatedDecks));
    setActiveDeck(updated);
    const newCount = xp.flashcardsReviewed + 1;
    updateXPField({ flashcardsReviewed: newCount });
    if (newCount >= 50) addXP(100, "flashcard_50");
    addXP(5);
    if (flashIndex + 1 < activeDeck.cards.length) { setFlashIndex(prev => prev + 1); setFlipped(false); }
    else { setActiveDeck(null); }
  };

  // ── ESSAY GRADER ──────────────────────────────────────────────────────────
  const gradeEssay = async () => {
    if (!essayText.trim()) return;
    setEssayLoading(true); setEssayResult(null);
    try {
      const res = await fetch("/api/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: `You are a strict but fair university professor grading a student's essay.\n\nRUBRIC: ${essayRubric}\n\nESSAY:\n${essayText}\n\nProvide:\n1. SCORE: X/100\n2. OVERALL FEEDBACK: (2-3 sentences)\n3. PARAGRAPH ANALYSIS: For each paragraph, one sentence of specific feedback\n4. STRONGEST POINT: (quote the best sentence)\n5. IMPROVE THIS: (rewrite their weakest sentence better)\n\nFormat with clear section headers.` }] }) });
      const data = await res.json();
      const content = data.content || "";
      const scoreMatch = content.match(/SCORE[:\s]+(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 70;
      const result: EssayResult = { id: `essay_${Date.now()}`, text: essayText, rubric: essayRubric, score, feedback: content, annotation: content, createdAt: Date.now() };
      setEssayResult(result);
      const updated = [result, ...essayHistory];
      setEssayHistory(updated);
      localStorage.setItem("myaigpt_edu_essays", JSON.stringify(updated.slice(0, 20)));
      const newCount = xp.essaysGraded + 1;
      updateXPField({ essaysGraded: newCount });
      if (newCount >= 5) addXP(100, "essay_5");
      addXP(50);
    } catch {}
    setEssayLoading(false);
  };

  // ── LEARNING PATH GENERATOR ───────────────────────────────────────────────
  const generatePath = async () => {
    if (!pathGoal.trim()) return;
    setPathLoading(true); setLearningPath(null);
    try {
      const res = await fetch("/api/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: `You are a world-class career counselor and curriculum designer at My Ai GPT University.\n\nGoal: "${pathGoal}"\nTime available per day: ${pathTime} minutes\n\nCreate a structured learning path. Return ONLY a JSON object:\n{\n  "goal": "${pathGoal}",\n  "timePerDay": "${pathTime} minutes",\n  "totalWeeks": 8,\n  "steps": [\n    {"week":1,"title":"Foundation","topics":["Topic A","Topic B","Topic C"],"goal":"Understand the basics"},\n    ...(8 weeks total)\n  ]\n}\n\nMake it realistic, specific, and achievable. No text outside the JSON.` }] }) });
      const data = await res.json();
      const text = (data.content || "").replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
      const match = text.match(/\{[\s\S]+\}/);
      if (match) {
        setLearningPath(JSON.parse(match[0]));
        addXP(100, "path_seeker");
      }
    } catch {}
    setPathLoading(false);
  };

  // ── MIND MAP GENERATOR ────────────────────────────────────────────────────
  const generateMindMap = async (topic: string) => {
    if (!topic.trim()) return;
    setMmLoading(true); setMmData(null); setMmSelected(null);
    try {
      const res = await fetch("/api/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: `Create a mind map for the concept: "${topic}".\n\nReturn ONLY a JSON object:\n{\n  "label": "${topic}",\n  "emoji": "🧠",\n  "children": [\n    {"label":"Core Concept 1","emoji":"🔬"},\n    {"label":"Core Concept 2","emoji":"📊"},\n    {"label":"Application","emoji":"⚙️"},\n    {"label":"History","emoji":"📜"},\n    {"label":"Key Figures","emoji":"👤"},\n    {"label":"Modern Use","emoji":"🚀"}\n  ]\n}\n\nMake the children specific and insightful. 6-8 children total. No text outside JSON.` }] }) });
      const data = await res.json();
      const text = (data.content || "").replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
      const match = text.match(/\{[\s\S]+\}/);
      if (match) {
        setMmData(JSON.parse(match[0]));
        addXP(75, "mind_mapper");
      }
    } catch {}
    setMmLoading(false);
  };

  // ── DEBATE MODE ───────────────────────────────────────────────────────────
  const startDebatePrepRoom = async () => {
    if (!debateTopic.trim()) return;
    setDebateLoading(true); setDebatePrep(null); setDebatePhase("prep");
    try {
      const res = await fetch("/api/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: `The student is about to debate: "${debateTopic}". They will argue FOR this position.\n\nReturn ONLY a JSON object:\n{\n  "facts": ["Key fact 1 you can use","Key fact 2","Key fact 3"],\n  "counterargs": ["Strong counterargument you'll face 1","Counterargument 2","Counterargument 3"]\n}\n\nMake it strategic and specific. No text outside JSON.` }] }) });
      const data = await res.json();
      const text = (data.content || "").replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
      const match = text.match(/\{[\s\S]+\}/);
      if (match) { setDebatePrep(JSON.parse(match[0])); addXP(50, "debate_prep"); }
    } catch {}
    setDebateLoading(false);
  };

  const sendDebateMessage = async () => {
    if (!debateInput.trim() || debateLoading) return;
    const userArg = debateInput.trim(); setDebateInput(""); setDebateLoading(true);
    const newMsgs: DebateMsg[] = [...debateMessages, { role: "user", content: userArg, label: "Your Argument" }];
    setDebateMessages(newMsgs);
    try {
      const history = newMsgs.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
      const res = await fetch("/api/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "system", content: `You are debating AGAINST the position: "${debateTopic}". Counter the student's argument with logic, evidence, and rhetorical skill. Be sharp, use specific examples. Check for logical fallacies and call them out by name if you spot one. Keep response under 150 words.` }, ...history] }) });
      const data = await res.json();
      const reply = data.content || "";
      // Check for fallacies
      let fallacyWarning = "";
      const lc = userArg.toLowerCase();
      if (lc.includes("everyone knows") || lc.includes("everybody agrees")) fallacyWarning = "⚠️ **Fallacy Detected: Appeal to Popular Belief**";
      else if (lc.includes("always") || lc.includes("never") || lc.includes("will definitely")) fallacyWarning = "⚠️ **Fallacy Detected: Overgeneralization / Slippery Slope**";
      const aiMsg: DebateMsg = { role: "ai", content: reply + (fallacyWarning ? `\n\n${fallacyWarning}` : ""), label: "AI Opposition" };
      setDebateMessages(prev => [...prev, aiMsg]);
      addXP(20);
    } catch {}
    setDebateLoading(false);
  };

  const judgeDebate = async () => {
    setDebatePhase("judging"); setDebateLoading(true);
    try {
      const transcript = debateMessages.map(m => `${m.label || m.role}: ${m.content}`).join("\n\n");
      const res = await fetch("/api/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: `You are a panel of 3 debate judges scoring this debate on the topic: "${debateTopic}".\n\nDEBATE TRANSCRIPT:\n${transcript}\n\nProvide judgment as:\n\n**Judge 1 (Logic):** [Score FOR/AGAINST and reason]\n**Judge 2 (Evidence):** [Score FOR/AGAINST and reason]\n**Judge 3 (Rhetoric):** [Score FOR/AGAINST and reason]\n**FINAL VERDICT:** [Winner and why]\n**Student Strengths:** [2 things they did well]\n**Student Improvements:** [2 things to work on]` }] }) });
      const data = await res.json();
      setDebateJudgment(data.content || "");
      const verdict = (data.content || "").toLowerCase();
      if (verdict.includes("for wins") || verdict.includes("student wins") || verdict.includes("for: wins")) {
        addXP(200, "debater");
        updateXPField({ debatesWon: xp.debatesWon + 1 });
      }
    } catch {}
    setDebateLoading(false);
    setDebatePhase("result");
  };

  // ── WIKI LESSON (keep existing) ──────────────────────────────────────────
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

  // ── SHARED MARKDOWN COMPONENTS ────────────────────────────────────────────
  const mdColor = "#8b5cf6";
  const MdComponents = {
    h1: ({ children }: any) => <h1 className="text-xl font-extrabold mb-3 text-foreground">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-base font-bold mt-5 mb-2 text-foreground border-l-4 pl-3" style={{borderColor:mdColor}}>{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-sm font-bold mt-3 mb-1 text-foreground/90">{children}</h3>,
    p: ({ children }: any) => <p className="mb-3 text-foreground/75 text-sm leading-relaxed">{children}</p>,
    ul: ({ children }: any) => <ul className="mb-3 ml-4 space-y-1 list-disc text-foreground/70 text-sm">{children}</ul>,
    ol: ({ children }: any) => <ol className="mb-3 ml-4 space-y-1 list-decimal text-foreground/70 text-sm">{children}</ol>,
    li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }: any) => <strong className="font-bold text-foreground">{children}</strong>,
    blockquote: ({ children }: any) => <blockquote className="border-l-4 pl-4 py-2 my-3 italic text-foreground/60 rounded-r-lg text-sm" style={{borderColor:mdColor}}>{children}</blockquote>,
    hr: () => <hr className="border-border/20 my-4" />,
    code: ({ children }: any) => <code className="bg-muted/60 rounded px-1.5 py-0.5 text-xs font-mono">{children}</code>,
  };

  // ── XP HEADER BAR ─────────────────────────────────────────────────────────
  const XPBar = () => (
    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-violet-950/80 to-indigo-950/80 border-b border-white/5">
      <span className="text-base">{currentLevel.icon}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-bold" style={{color:currentLevel.color}}>{currentLevel.name}</span>
          <span className="text-[10px] text-white/40">{xp.total} XP{nextLevel ? ` · ${nextLevel.min - xp.total} to ${nextLevel.name}` : " · MAX"}</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden w-32"><div className="h-full rounded-full transition-all" style={{width:`${xpProgress}%`,background:currentLevel.color}}/></div>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-white/40">
        <span>🔥 {xp.streakDays}d</span>
        <span>·</span>
        <span>🏅 {xp.badges.length}</span>
      </div>
    </div>
  );

  if (selectedSubject) {
    const currentTrack = UNIVERSITY_TRACKS.find(t => t.id === track)!;
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <XPBar/>
        {/* Lesson header */}
        <div className="border-b border-border/20 bg-white dark:bg-gray-900 px-5 py-4 flex items-center gap-3">
          <button onClick={() => { setSelectedSubject(null); setEduView("home"); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="button-lesson-back">
            <ChevronLeft size={16} /> Back
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

  // ── NAV ITEMS ─────────────────────────────────────────────────────────────
  const NAV_ITEMS: {id:EduView;label:string;icon:string;color:string}[] = [
    {id:"home",      label:"Home",          icon:"🏠", color:"#6366f1"},
    {id:"tutor",     label:"AI Tutor",      icon:"🧑‍🏫", color:"#10b981"},
    {id:"quiz",      label:"Quiz",          icon:"✅", color:"#f59e0b"},
    {id:"flashcards",label:"Flashcards",    icon:"🃏", color:"#06b6d4"},
    {id:"essay",     label:"Essay Grader",  icon:"✍️", color:"#8b5cf6"},
    {id:"paths",     label:"Learning Path", icon:"🗺️", color:"#ec4899"},
    {id:"mindmap",   label:"Mind Map",      icon:"🧠", color:"#14b8a6"},
    {id:"debate",    label:"Debate Club",   icon:"🎤", color:"#f97316"},
    {id:"trophy",    label:"Trophy Room",   icon:"🏆", color:"#eab308"},
  ];

  const currentTrackData = UNIVERSITY_TRACKS.find(t => t.id === track) || UNIVERSITY_TRACKS[0];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* XP Bar */}
      <XPBar/>

      {/* Top nav */}
      <div className="border-b border-border/15 bg-white dark:bg-gray-900 overflow-x-auto scrollbar-hide">
        <div className="flex gap-0.5 px-2 py-1.5 min-w-max">
          {NAV_ITEMS.map(n => (
            <button key={n.id} onClick={() => setEduView(n.id)}
              data-testid={`edu-nav-${n.id}`}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${eduView === n.id ? "text-white shadow" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
              style={eduView === n.id ? {backgroundColor:n.color} : {}}>
              <span>{n.icon}</span> {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">

        {/* ═══════════════════ HOME VIEW ═══════════════════ */}
        {eduView === "home" && (
          <div>
            {/* Hero */}
            <div className="relative overflow-hidden border-b border-border/20" style={{background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)"}}>
              <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 2px 2px,white 1px,transparent 0)",backgroundSize:"32px 32px"}}/>
              <div className="relative max-w-4xl mx-auto px-5 py-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 text-white text-[11px] font-semibold mb-4 backdrop-blur">
                  <GraduationCap size={12}/> My Ai GPT University · Powered by Quantum Pulse Intelligence
                </div>
                <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight" data-testid="text-education-title">World-Class Education, Powered by AI</h1>
                <p className="text-white/70 text-sm max-w-xl mx-auto leading-relaxed mb-5">From K-12 to Masters. Career skills to cutting-edge AI. Every subject. Every level. Learn anything — free, on-site, right now.</p>
                {/* Quick feature grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                  {[
                    {icon:"🧑‍🏫",label:"AI Tutor",sub:"5 personality modes",view:"tutor" as EduView},
                    {icon:"✅",label:"Smart Quiz",sub:"Adaptive questions",view:"quiz" as EduView},
                    {icon:"🃏",label:"Flashcards",sub:"Spaced repetition",view:"flashcards" as EduView},
                    {icon:"🎤",label:"Debate Club",sub:"Structured debates",view:"debate" as EduView},
                  ].map(f => (
                    <button key={f.label} onClick={() => setEduView(f.view)}
                      data-testid={`home-feature-${f.label.toLowerCase().replace(/\s/g,"-")}`}
                      className="bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl p-3 text-left transition-all">
                      <div className="text-xl mb-1">{f.icon}</div>
                      <div className="text-white font-bold text-xs">{f.label}</div>
                      <div className="text-white/50 text-[10px]">{f.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Track tabs */}
            <div className="border-b border-border/20 bg-white dark:bg-gray-900 sticky top-0 z-10">
              <div className="max-w-4xl mx-auto px-3 flex gap-1 overflow-x-auto scrollbar-hide py-2">
                {UNIVERSITY_TRACKS.map(t => (
                  <button key={t.id} onClick={() => setTrack(t.id)} data-testid={`edu-track-${t.id}`}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${track === t.id ? "text-white shadow" : "text-muted-foreground hover:text-foreground bg-muted/20 hover:bg-muted/40"}`}
                    style={track === t.id ? {backgroundColor:t.color} : {}}>
                    <span>{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-7">
              {/* Wiki instant lesson */}
              <div className="rounded-2xl border border-border/20 overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-950">
                <div className="px-4 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Telescope size={15} className="text-purple-400"/>
                    <span className="text-white font-bold text-sm">Ask Anything — Instant AI Lesson</span>
                  </div>
                  <p className="text-white/40 text-xs mb-3">Type any topic and get a full AI-powered lesson instantly.</p>
                  <div className="flex gap-2">
                    <input value={wikiTopic} onChange={e => setWikiTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchWikiLesson(wikiTopic)}
                      placeholder="Black holes, CRISPR, Roman Empire, Machine learning…"
                      className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-purple-400/60"
                      data-testid="input-wiki-topic"/>
                    <button onClick={() => fetchWikiLesson(wikiTopic)} disabled={wikiLoading || !wikiTopic.trim()}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-40 flex items-center gap-1.5"
                      data-testid="button-wiki-lesson">
                      {wikiLoading ? <><Sparkles size={12} className="animate-spin"/> Generating…</> : <><BookMarked size={12}/> Learn It</>}
                    </button>
                  </div>
                  {wikiChips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      <div className="w-full flex items-center gap-1.5 mb-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
                        <span className="text-[9px] text-white/30 tracking-widest uppercase font-bold">Live Hive Topics</span>
                      </div>
                      {wikiChips.map((c,i) => (
                        <button key={i} onClick={() => { setWikiTopic(c.q); fetchWikiLesson(c.q); }}
                          className="text-[10px] px-2 py-0.5 bg-white/10 text-white/60 rounded-full border border-white/10 hover:bg-white/20 hover:text-white transition-colors"
                          data-testid={`wiki-suggestion-${i}`}>{c.emoji} {c.q}</button>
                      ))}
                    </div>
                  )}
                </div>
                {(wikiLoading || wikiLesson) && (
                  <div className="border-t border-white/10 px-4 py-4 bg-black/30">
                    {wikiLoading ? (
                      <div className="space-y-2 animate-pulse">
                        <div className="h-5 bg-white/10 rounded w-1/2"/>
                        {[1,2,3].map(i => <div key={i} className="h-2.5 bg-white/5 rounded w-full"/>)}
                        <div className="flex items-center gap-2 pt-1"><Sparkles size={12} className="text-purple-400 animate-spin"/><span className="text-white/40 text-[11px]">Professor AI building your lesson…</span></div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white/60 text-xs font-semibold">📖 {wikiTitle}</span>
                          <button onClick={() => { setWikiLesson(""); setWikiTopic(""); }} className="text-white/30 hover:text-white/60 text-xs">× Clear</button>
                        </div>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                          h1: ({children}:any) => <h1 className="text-lg font-extrabold mb-2 text-white">{children}</h1>,
                          h2: ({children}:any) => <h2 className="text-sm font-bold mt-4 mb-1.5 text-purple-300 border-l-3 border-purple-500 pl-2">{children}</h2>,
                          h3: ({children}:any) => <h3 className="text-xs font-bold mt-2 mb-1 text-white/80">{children}</h3>,
                          p: ({children}:any) => <p className="mb-2 text-white/70 text-xs leading-relaxed">{children}</p>,
                          ul: ({children}:any) => <ul className="mb-2 ml-3 space-y-0.5 list-disc text-white/60 text-xs">{children}</ul>,
                          li: ({children}:any) => <li className="leading-relaxed">{children}</li>,
                          strong: ({children}:any) => <strong className="font-bold text-white">{children}</strong>,
                          blockquote: ({children}:any) => <blockquote className="border-l-4 border-purple-500 pl-3 py-1 my-2 italic text-white/50 text-xs">{children}</blockquote>,
                          code: ({children}:any) => <code className="bg-white/10 rounded px-1 py-0.5 text-[10px] font-mono text-purple-300">{children}</code>,
                        }}>{wikiLesson}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Live Hive Research Lab */}
              <div className="rounded-2xl border border-violet-500/20 overflow-hidden" style={{background:"linear-gradient(135deg,#0d0d1a 0%,#1a0d2e 50%,#0d0d1a 100%)"}}>
                <div className="px-4 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-violet-300 text-base">🧠</span>
                      <span className="text-white font-black text-sm">PulseU Research Lab — Live Hive Intelligence</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold animate-pulse">LIVE</span>
                    </div>
                    <div className="text-right">
                      <div className="text-violet-300 text-[10px] font-bold">{(hiveStats.totalAgents||113000).toLocaleString()}+ Agents</div>
                      <div className="text-white/20 text-[9px]">{(hiveStats.knowledgeNodes||1800000).toLocaleString()} knowledge nodes</div>
                    </div>
                  </div>
                  <p className="text-white/40 text-[10px] mb-3">What 113,000+ AI researchers are discovering right now. Click any topic to generate an instant lesson.</p>
                  {hiveResearchLoading&&<div className="text-violet-300/50 text-xs animate-pulse text-center py-3">Connecting to hive mind...</div>}
                  <div className="grid grid-cols-2 gap-2">
                    {hiveDiscoveries.length===0&&!hiveResearchLoading&&(
                      [
                        {topic:"Quantum Entanglement",domain:"physics"},
                        {topic:"CRISPR Gene Therapy",domain:"biology"},
                        {topic:"Hive Mind Emergence",domain:"ai"},
                        {topic:"Dark Matter Signatures",domain:"astrophysics"},
                        {topic:"Alien Species Genesis",domain:"xenobiology"},
                        {topic:"AI Civilization Dynamics",domain:"sovereign-ai"},
                        {topic:"Econophysics Models",domain:"economics"},
                        {topic:"Swarm Consciousness",domain:"ai"},
                        {topic:"PulseLang Grammar",domain:"pulse-language"},
                        {topic:"Multiverse Navigation",domain:"cosmology"},
                      ].map((d,i)=>(
                        <button key={i} onClick={()=>{setWikiTopic(d.topic);fetchWikiLesson(d.topic);}}
                          className="group p-2.5 rounded-xl bg-white/[0.03] border border-violet-500/10 text-left hover:border-violet-500/30 hover:bg-violet-500/5 transition-all"
                          data-testid={`hive-discovery-${d.topic.replace(/\s+/g,'-').toLowerCase()}`}>
                          <div className="text-white/70 font-bold text-[10px] group-hover:text-violet-300 transition-colors leading-snug">{d.topic}</div>
                          <div className="text-white/25 text-[8px] mt-0.5 flex items-center gap-1"><span className="text-violet-400">◆</span>{d.domain}</div>
                        </button>
                      ))
                    )}
                    {hiveDiscoveries.map((d,i)=>(
                      <button key={i} onClick={()=>{setWikiTopic(d.topic);fetchWikiLesson(d.topic);}}
                        className="group p-2.5 rounded-xl bg-white/[0.03] border border-violet-500/10 text-left hover:border-violet-500/30 hover:bg-violet-500/5 transition-all"
                        data-testid={`hive-discovery-${i}`}>
                        <div className="text-white/70 font-bold text-[10px] group-hover:text-violet-300 transition-colors leading-snug">{d.topic}</div>
                        <div className="text-white/25 text-[8px] mt-0.5 flex items-center gap-1"><span className="text-violet-400">◆</span>{d.domain}</div>
                        {d.summary&&<div className="text-white/20 text-[8px] mt-0.5 line-clamp-1">{d.summary}</div>}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                    <span className="text-white/20 text-[9px]">Hive discoveries refresh every 30s · Powered by 7 Hive Intelligence Engines</span>
                    <button onClick={()=>{setHiveResearchLoading(true);fetch('/api/intel/discoveries').then(r=>r.json()).then(d=>setHiveDiscoveries((d.discoveries||[]).slice(0,8))).finally(()=>setHiveResearchLoading(false));}}
                      className="text-[9px] text-violet-400/60 hover:text-violet-300 transition-colors">↺ Refresh</button>
                  </div>
                </div>
              </div>

              {/* Subjects grid */}
              <div>
                <h2 className="text-base font-extrabold mb-0.5" style={{color:currentTrackData.color}}>{currentTrackData.icon} {currentTrackData.label}</h2>
                <p className="text-xs text-muted-foreground mb-4">{currentTrackData.desc}</p>
                <div className="space-y-5">
                  {currentTrackData.grades.map(grade => (
                    <div key={grade.label}>
                      <h3 className="text-sm font-bold mb-2.5 flex items-center gap-1.5">{grade.emoji} {grade.label}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {grade.subjects.map(subject => (
                          <button key={subject} onClick={() => { openSubject(subject, grade.label, currentTrackData.label); addXP(25, xp.lessonsCompleted === 0 ? "first_lesson" : undefined); updateXPField({lessonsCompleted: xp.lessonsCompleted + 1}); }}
                            data-testid={`edu-subject-${subject.replace(/\s+/g,"-").toLowerCase()}`}
                            className="p-3 rounded-xl border border-border/20 bg-white dark:bg-gray-900 text-left hover:shadow-md transition-all text-xs font-medium text-foreground/80 hover:text-foreground"
                            onMouseEnter={e => { e.currentTarget.style.borderColor = currentTrackData.color; e.currentTarget.style.boxShadow = `0 4px 12px ${currentTrackData.color}25`; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = ""; }}>
                            <div className="text-sm mb-1">{grade.emoji}</div>
                            {subject}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl text-center text-white" style={{background:`linear-gradient(135deg,${currentTrackData.color},${currentTrackData.color}bb)`}}>
                <div className="text-2xl mb-1">🎓</div>
                <h3 className="font-extrabold mb-1">Can't find your subject?</h3>
                <p className="text-sm text-white/80 mb-3">Use any of the tools above — AI Tutor, Flashcards, Quiz Generator — for any topic imaginable.</p>
                <button onClick={() => setEduView("tutor")} className="px-4 py-2 bg-white text-foreground font-bold text-sm rounded-xl hover:shadow-lg transition-all">
                  Open AI Tutor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ AI TUTOR VIEW ═══════════════════ */}
        {eduView === "tutor" && (
          <div className="flex flex-col h-full max-w-3xl mx-auto w-full px-4 py-4 gap-3">
            {/* Persona selector */}
            <div className="flex gap-1.5 flex-wrap">
              {(Object.entries(TUTOR_PERSONAS) as [TutorPersonality, typeof TUTOR_PERSONAS[TutorPersonality]][]).map(([key, p]) => (
                <button key={key} onClick={() => { setTutorPersonality(key); setTutorMessages([]); }}
                  data-testid={`tutor-persona-${key}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${tutorPersonality === key ? "text-white border-transparent" : "text-muted-foreground border-border/30 hover:border-border"}`}
                  style={tutorPersonality === key ? {backgroundColor:p.color} : {}}>
                  {p.icon} {p.name}
                  <span className="hidden sm:inline text-[9px] opacity-70">· {p.desc}</span>
                </button>
              ))}
            </div>

            {/* Subject context */}
            <div className="flex gap-2">
              <input value={tutorSubject} onChange={e => setTutorSubject(e.target.value)}
                placeholder="Subject context (optional): e.g. Calculus, World War 2, Python…"
                className="flex-1 px-3 py-2 rounded-xl border border-border/30 text-xs focus:outline-none bg-muted/10"
                data-testid="tutor-subject-input"/>
            </div>

            {/* Chat area */}
            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-border/20 bg-muted/5 p-3 space-y-3" style={{maxHeight:"420px"}}>
              {tutorMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="text-3xl mb-2">{TUTOR_PERSONAS[tutorPersonality].icon}</div>
                  <div className="font-bold text-sm" style={{color:TUTOR_PERSONAS[tutorPersonality].color}}>
                    Professor {TUTOR_PERSONAS[tutorPersonality].name} is ready
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 max-w-xs">{TUTOR_PERSONAS[tutorPersonality].desc} — Ask anything about any subject!</div>
                  <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                    {["Explain quantum entanglement simply","What is the derivative of x²?","How does compound interest work?","Explain DNA replication"].map(q => (
                      <button key={q} onClick={() => { setTutorInput(q); }} className="text-[10px] px-2 py-1 bg-muted rounded-full hover:bg-muted/70 transition-colors">{q}</button>
                    ))}
                  </div>
                </div>
              )}
              {tutorMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${m.role === "user" ? "bg-violet-600 text-white" : "bg-white dark:bg-gray-800 border border-border/20 text-foreground"}`}
                    data-testid={`tutor-msg-${i}`}>
                    {m.role === "assistant"
                      ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={MdComponents}>{m.content}</ReactMarkdown>
                      : m.content}
                  </div>
                </div>
              ))}
              {tutorLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 border border-border/20 rounded-2xl px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles size={12} className="animate-spin" style={{color:TUTOR_PERSONAS[tutorPersonality].color}}/> Professor is thinking…
                  </div>
                </div>
              )}
              <div ref={tutorEndRef}/>
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input value={tutorInput} onChange={e => setTutorInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendTutorMessage()}
                placeholder={`Ask ${TUTOR_PERSONAS[tutorPersonality].name} professor anything…`}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border/30 text-sm focus:outline-none bg-muted/10"
                data-testid="tutor-chat-input"/>
              <button onClick={sendTutorMessage} disabled={tutorLoading || !tutorInput.trim()}
                className="px-4 py-2.5 text-white rounded-xl font-bold text-sm disabled:opacity-40 flex items-center gap-1.5 transition-all"
                style={{backgroundColor:TUTOR_PERSONAS[tutorPersonality].color}}
                data-testid="tutor-send-btn">
                <Send size={14}/>
              </button>
            </div>
            <div className="text-[10px] text-muted-foreground/50 text-center">+10 XP per message · Confusion detected → auto-analogies activated</div>
          </div>
        )}

        {/* ═══════════════════ QUIZ VIEW ═══════════════════ */}
        {eduView === "quiz" && (
          <div className="max-w-2xl mx-auto px-4 py-5">
            {quizQuestions.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">✅</div>
                  <h2 className="text-xl font-extrabold mb-1">AI Quiz Generator</h2>
                  <p className="text-sm text-muted-foreground">Enter any topic and get 8 adaptive questions with explanations and confidence tracking.</p>
                </div>
                <div className="flex gap-2">
                  <input value={quizTopic} onChange={e => setQuizTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && generateQuiz()}
                    placeholder="e.g. Photosynthesis, World War 2, Linear Algebra, Python basics…"
                    className="flex-1 px-4 py-3 rounded-xl border border-border/30 text-sm focus:outline-none bg-muted/10"
                    data-testid="quiz-topic-input"/>
                  <button onClick={generateQuiz} disabled={quizLoading || !quizTopic.trim()}
                    className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-sm disabled:opacity-40 flex items-center gap-1.5 transition-all"
                    data-testid="quiz-generate-btn">
                    {quizLoading ? <><Sparkles size={14} className="animate-spin"/> Generating…</> : <>Generate Quiz</>}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Photosynthesis","French Revolution","Algebra","Python","US Constitution","Chemistry","Shakespeare","Economics"].map(t => (
                    <button key={t} onClick={() => { setQuizTopic(t); generateQuiz(); }}
                      className="text-xs px-3 py-1.5 bg-muted rounded-full hover:bg-muted/70 transition-colors"
                      data-testid={`quiz-suggestion-${t.toLowerCase()}`}>{t}</button>
                  ))}
                </div>
              </div>
            ) : quizDone ? (
              <div className="text-center space-y-4">
                <div className="text-5xl">🏆</div>
                <h2 className="text-2xl font-extrabold">Quiz Complete!</h2>
                {(() => {
                  const score = quizResults.filter(r => r.correct).length;
                  const pct = Math.round((score / quizResults.length) * 100);
                  return (
                    <div>
                      <div className="text-4xl font-black" style={{color: pct >= 70 ? "#10b981" : "#ef4444"}}>{pct}%</div>
                      <div className="text-muted-foreground text-sm">{score} / {quizResults.length} correct</div>
                      <div className="text-xs text-amber-500 mt-1">+{pct >= 70 ? 100 : 30} XP earned!</div>
                    </div>
                  );
                })()}
                <div className="space-y-2 text-left">
                  {quizResults.map((r, i) => (
                    <div key={i} className={`p-3 rounded-xl border text-xs ${r.correct ? "border-green-500/30 bg-green-50 dark:bg-green-950/20" : "border-red-500/30 bg-red-50 dark:bg-red-950/20"}`}
                      data-testid={`quiz-result-${i}`}>
                      <div className="flex items-center gap-2 font-semibold mb-1">
                        {r.correct ? "✅" : "❌"} Q{i+1}
                        <span className="text-muted-foreground">Confidence: {r.conf}/5</span>
                      </div>
                      {!r.correct && <div className="text-muted-foreground mb-1">Correct answer: <strong>{r.answer}</strong></div>}
                      <div className="text-muted-foreground/80">{r.explanation}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setQuizQuestions([]); setQuizDone(false); setQuizResults([]); }} className="px-6 py-2.5 bg-amber-500 text-white font-bold rounded-xl text-sm" data-testid="quiz-retry-btn">
                  Try Another Quiz
                </button>
              </div>
            ) : (
              (() => {
                const q = quizQuestions[quizIndex];
                if (!q) return null;
                const displayOptions = q.options.length > 0 ? q.options : ["True", "False"];
                return (
                  <div className="space-y-4" data-testid="quiz-question-area">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Question {quizIndex + 1} / {quizQuestions.length}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 capitalize">{q.type}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{width:`${((quizIndex)/quizQuestions.length)*100}%`}}/>
                    </div>
                    <div className="text-base font-bold leading-relaxed" data-testid="quiz-question-text">{q.question}</div>
                    {q.type === "fillin" ? (
                      <div>
                        <input value={quizSelected || ""} onChange={e => setQuizSelected(e.target.value)} disabled={quizSubmitted}
                          placeholder="Type your answer here…" className="w-full px-4 py-3 rounded-xl border border-border/30 text-sm focus:outline-none bg-muted/10"
                          data-testid="quiz-fillin-input"/>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {displayOptions.map((opt, oi) => {
                          let style = "border-border/30 bg-white dark:bg-gray-900 hover:border-amber-400";
                          if (quizSubmitted) {
                            if (opt === q.answer) style = "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300";
                            else if (opt === quizSelected) style = "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300";
                          } else if (opt === quizSelected) style = "border-amber-400 bg-amber-50 dark:bg-amber-950/30";
                          return (
                            <button key={oi} onClick={() => !quizSubmitted && setQuizSelected(opt)}
                              data-testid={`quiz-option-${oi}`}
                              className={`w-full p-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${style}`}>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {quizSubmitted && (
                      <div className={`p-3 rounded-xl text-xs leading-relaxed ${quizSelected?.trim().toLowerCase() === q.answer.trim().toLowerCase() ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"}`}
                        data-testid="quiz-explanation">
                        {quizSelected?.trim().toLowerCase() === q.answer.trim().toLowerCase() ? "✅ Correct! " : `❌ The answer is: ${q.answer}. `}{q.explanation}
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Confidence:</span>
                        {[1,2,3,4,5].map(n => (
                          <button key={n} onClick={() => setQuizConfidence(n)} disabled={quizSubmitted}
                            className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all ${quizConfidence >= n ? "bg-amber-400 text-white" : "bg-muted text-muted-foreground"}`}
                            data-testid={`quiz-conf-${n}`}>{n}</button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {!quizSubmitted ? (
                          <button onClick={submitQuizAnswer} disabled={!quizSelected}
                            className="flex-1 py-2.5 bg-amber-500 text-white font-bold rounded-xl text-sm disabled:opacity-40"
                            data-testid="quiz-submit-btn">Submit Answer</button>
                        ) : (
                          <button onClick={nextQuizQuestion} className="flex-1 py-2.5 bg-violet-600 text-white font-bold rounded-xl text-sm" data-testid="quiz-next-btn">
                            {quizIndex + 1 >= quizQuestions.length ? "See Results 🏆" : "Next Question →"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* ═══════════════════ FLASHCARDS VIEW ═══════════════════ */}
        {eduView === "flashcards" && (
          <div className="max-w-xl mx-auto px-4 py-5 space-y-4">
            {!activeDeck ? (
              <>
                <div className="text-center">
                  <div className="text-4xl mb-2">🃏</div>
                  <h2 className="text-xl font-extrabold mb-1">AI Flashcard Generator</h2>
                  <p className="text-sm text-muted-foreground">Generate 15 smart flashcards with spaced repetition for any topic.</p>
                </div>
                <div className="flex gap-2">
                  <input value={flashTopic} onChange={e => setFlashTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && generateFlashcards()}
                    placeholder="e.g. French Vocabulary, Calculus formulas, The Civil War…"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border/30 text-sm focus:outline-none bg-muted/10"
                    data-testid="flash-topic-input"/>
                  <button onClick={generateFlashcards} disabled={flashLoading || !flashTopic.trim()}
                    className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl text-sm disabled:opacity-40 flex items-center gap-1.5"
                    data-testid="flash-generate-btn">
                    {flashLoading ? <><Sparkles size={12} className="animate-spin"/> Building…</> : <>Generate</>}
                  </button>
                </div>
                {flashDecks.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-muted-foreground">Your Decks ({flashDecks.length})</div>
                    {flashDecks.map(d => (
                      <button key={d.id} onClick={() => { setActiveDeck(d); setFlashIndex(0); setFlipped(false); }}
                        data-testid={`flash-deck-${d.id}`}
                        className="w-full p-3 rounded-xl border border-border/20 bg-white dark:bg-gray-900 text-left hover:border-cyan-400 transition-all">
                        <div className="font-semibold text-sm">🃏 {d.topic}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{d.cards.length} cards · {new Date(d.createdAt).toLocaleDateString()}</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button onClick={() => setActiveDeck(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <ChevronLeft size={13}/> All Decks
                  </button>
                  <span className="text-xs text-muted-foreground">{flashIndex + 1} / {activeDeck.cards.length}</span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{width:`${((flashIndex+1)/activeDeck.cards.length)*100}%`}}/>
                </div>
                {/* Flashcard */}
                <div onClick={() => setFlipped(!flipped)}
                  data-testid="flash-card"
                  className="relative w-full rounded-2xl border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-950 to-indigo-950 text-white cursor-pointer transition-all hover:shadow-xl hover:shadow-cyan-500/10 select-none"
                  style={{minHeight:"220px"}}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-cyan-400/70 mb-3">{flipped ? "Answer" : "Question — tap to flip"}</div>
                    <div className="text-base font-bold leading-relaxed">{flipped ? activeDeck.cards[flashIndex].back : activeDeck.cards[flashIndex].front}</div>
                  </div>
                  <div className="absolute bottom-3 right-3 text-[10px] text-white/20">🔄 tap to flip</div>
                </div>
                {flipped && (
                  <div className="flex gap-2" data-testid="flash-rating-area">
                    <button onClick={() => { rateFlashcard("again"); setFlipped(false); }} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold" data-testid="flash-again-btn">Again 🔴</button>
                    <button onClick={() => { rateFlashcard("hard"); setFlipped(false); }} className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold" data-testid="flash-hard-btn">Hard 🟡</button>
                    <button onClick={() => { rateFlashcard("easy"); setFlipped(false); }} className="flex-1 py-2 rounded-xl bg-green-500 text-white text-xs font-bold" data-testid="flash-easy-btn">Easy 🟢</button>
                  </div>
                )}
                {!flipped && (
                  <button onClick={() => setFlipped(true)} className="w-full py-2.5 rounded-xl bg-cyan-500 text-white text-sm font-bold" data-testid="flash-reveal-btn">Reveal Answer</button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ ESSAY GRADER VIEW ═══════════════════ */}
        {eduView === "essay" && (
          <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">✍️</div>
              <h2 className="text-xl font-extrabold mb-1">AI Essay Grader</h2>
              <p className="text-sm text-muted-foreground">Paste your essay. Get a score, inline feedback, paragraph analysis, and your best/worst sentences.</p>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Grading Rubric</label>
              <input value={essayRubric} onChange={e => setEssayRubric(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border/30 text-xs focus:outline-none bg-muted/10"
                data-testid="essay-rubric-input"/>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Your Essay</label>
              <textarea value={essayText} onChange={e => setEssayText(e.target.value)} rows={10}
                placeholder="Paste your essay here…"
                className="w-full px-4 py-3 rounded-xl border border-border/30 text-sm focus:outline-none bg-muted/10 resize-none"
                data-testid="essay-text-input"/>
            </div>
            <button onClick={gradeEssay} disabled={essayLoading || essayText.trim().length < 50}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2"
              data-testid="essay-grade-btn">
              {essayLoading ? <><Sparkles size={14} className="animate-spin"/> Grading…</> : <>Grade My Essay 🎓</>}
            </button>
            {essayResult && (
              <div className="space-y-3" data-testid="essay-result">
                <div className="flex items-center gap-4 p-4 rounded-2xl border border-border/20 bg-white dark:bg-gray-900">
                  <div className="text-center">
                    <div className="text-4xl font-black" style={{color: essayResult.score >= 80 ? "#10b981" : essayResult.score >= 60 ? "#f59e0b" : "#ef4444"}} data-testid="essay-score">
                      {essayResult.score}
                    </div>
                    <div className="text-xs text-muted-foreground">/ 100</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold mb-1">Overall Score</div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{width:`${essayResult.score}%`, backgroundColor: essayResult.score >= 80 ? "#10b981" : essayResult.score >= 60 ? "#f59e0b" : "#ef4444"}}/>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-border/20 bg-muted/5 text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MdComponents}>{essayResult.feedback}</ReactMarkdown>
                </div>
                <button onClick={() => { setEssayText(""); setEssayResult(null); }}
                  className="text-xs text-muted-foreground hover:text-foreground">× Clear and grade another essay</button>
              </div>
            )}
            {essayHistory.length > 0 && !essayResult && (
              <div>
                <div className="text-xs font-bold text-muted-foreground mb-2">Previous Essays ({essayHistory.length})</div>
                <div className="space-y-1.5">
                  {essayHistory.slice(0,5).map(e => (
                    <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/15 bg-muted/5 text-xs" data-testid={`essay-history-${e.id}`}>
                      <div className="font-black text-base" style={{color: e.score >= 80 ? "#10b981" : e.score >= 60 ? "#f59e0b" : "#ef4444"}}>{e.score}</div>
                      <div className="flex-1 text-muted-foreground truncate">{e.text.slice(0,60)}…</div>
                      <div className="text-muted-foreground/50">{new Date(e.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ LEARNING PATHS VIEW ═══════════════════ */}
        {eduView === "paths" && (
          <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <h2 className="text-xl font-extrabold mb-1">AI Learning Path Generator</h2>
              <p className="text-sm text-muted-foreground">Tell us your goal and how much time you have — get a personalized 8-week curriculum.</p>
            </div>
            <div className="space-y-3">
              <input value={pathGoal} onChange={e => setPathGoal(e.target.value)}
                placeholder="e.g. Become a web developer, Learn Spanish, Understand machine learning…"
                className="w-full px-4 py-3 rounded-xl border border-border/30 text-sm focus:outline-none bg-muted/10"
                data-testid="path-goal-input"/>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Daily time:</span>
                {["15","30","60","90"].map(t => (
                  <button key={t} onClick={() => setPathTime(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${pathTime === t ? "bg-pink-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                    data-testid={`path-time-${t}`}>{t} min</button>
                ))}
              </div>
              <button onClick={generatePath} disabled={pathLoading || !pathGoal.trim()}
                className="w-full py-3 bg-pink-500 hover:bg-pink-400 text-white font-bold rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                data-testid="path-generate-btn">
                {pathLoading ? <><Sparkles size={14} className="animate-spin"/> Building your path…</> : <>Generate My Learning Path 🗺️</>}
              </button>
            </div>
            {learningPath && (
              <div className="space-y-3" data-testid="learning-path-result">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950 to-rose-950 text-white">
                  <div className="text-sm font-bold mb-0.5">🎯 Goal: {learningPath.goal}</div>
                  <div className="text-xs text-white/60">{learningPath.timePerDay}/day · {learningPath.totalWeeks} weeks</div>
                </div>
                <div className="space-y-2">
                  {(learningPath.steps || []).map((step, i) => (
                    <div key={i} className="p-3 rounded-xl border border-border/20 bg-white dark:bg-gray-900" data-testid={`path-week-${step.week}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center">W{step.week}</div>
                        <div className="font-bold text-sm">{step.title}</div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {step.topics.map((t: string) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 rounded-full">{t}</span>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">🎯 {step.goal}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setLearningPath(null)} className="text-xs text-muted-foreground hover:text-foreground">× Generate a new path</button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ MIND MAP VIEW ═══════════════════ */}
        {eduView === "mindmap" && (
          <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">🧠</div>
              <h2 className="text-xl font-extrabold mb-1">AI Mind Map Generator</h2>
              <p className="text-sm text-muted-foreground">Enter a concept and get an interactive mind map with 6–8 core branches. Click any node to drill deeper.</p>
            </div>
            <div className="flex gap-2">
              <input value={mmTopic} onChange={e => setMmTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && generateMindMap(mmTopic)}
                placeholder="e.g. Photosynthesis, Ancient Rome, Machine Learning, Jazz…"
                className="flex-1 px-4 py-2.5 rounded-xl border border-border/30 text-sm focus:outline-none bg-muted/10"
                data-testid="mindmap-topic-input"/>
              <button onClick={() => generateMindMap(mmTopic)} disabled={mmLoading || !mmTopic.trim()}
                className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl text-sm disabled:opacity-40 flex items-center gap-1.5"
                data-testid="mindmap-generate-btn">
                {mmLoading ? <><Sparkles size={12} className="animate-spin"/> Mapping…</> : <>Map It</>}
              </button>
            </div>
            {mmData && (
              <div className="space-y-3" data-testid="mindmap-result">
                {/* Central node */}
                <div className="flex flex-col items-center gap-3">
                  <div className="px-5 py-3 rounded-2xl text-white font-black text-base text-center shadow-lg" style={{background:"linear-gradient(135deg,#14b8a6,#0891b2)"}}>
                    {mmData.emoji} {mmData.label}
                  </div>
                  {/* Branches */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
                    {mmData.children.map((child: {label:string;emoji:string}, i: number) => (
                      <button key={i} onClick={() => { setMmSelected(child.label); generateMindMap(child.label); }}
                        data-testid={`mindmap-node-${i}`}
                        className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all text-left hover:shadow-md ${mmSelected === child.label ? "border-teal-400 bg-teal-50 dark:bg-teal-950/30" : "border-border/30 bg-white dark:bg-gray-900 hover:border-teal-400"}`}>
                        <div className="text-lg mb-0.5">{child.emoji}</div>
                        <div>{child.label}</div>
                        <div className="text-[9px] text-teal-500 mt-0.5">click to explore →</div>
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => { setMmData(null); setMmSelected(null); }} className="text-xs text-muted-foreground hover:text-foreground">× New mind map</button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ DEBATE CLUB VIEW ═══════════════════ */}
        {eduView === "debate" && (
          <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
            {debatePhase === "setup" && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎤</div>
                  <h2 className="text-xl font-extrabold mb-1">Debate Club</h2>
                  <p className="text-sm text-muted-foreground">Argue a position against our AI opponent. Get judged by a 3-judge panel on logic, evidence, and rhetoric.</p>
                </div>
                <input value={debateTopic} onChange={e => setDebateTopic(e.target.value)}
                  placeholder="e.g. Social media does more harm than good · AI will replace most jobs · College is worth the cost"
                  className="w-full px-4 py-3 rounded-xl border border-border/30 text-sm focus:outline-none bg-muted/10"
                  data-testid="debate-topic-input"/>
                <div className="flex flex-wrap gap-1.5">
                  {["AI will replace most jobs","Social media harms democracy","College is worth the debt","Space exploration is worth the cost"].map(t => (
                    <button key={t} onClick={() => setDebateTopic(t)} className="text-xs px-3 py-1.5 bg-muted rounded-full hover:bg-muted/70 transition-colors" data-testid={`debate-suggestion-${t.slice(0,10)}`}>{t}</button>
                  ))}
                </div>
                <button onClick={startDebatePrepRoom} disabled={debateLoading || !debateTopic.trim()}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                  data-testid="debate-start-btn">
                  {debateLoading ? <><Sparkles size={14} className="animate-spin"/> Preparing…</> : <>Enter Prep Room 📜</>}
                </button>
              </div>
            )}

            {debatePhase === "prep" && debatePrep && (
              <div className="space-y-3" data-testid="debate-prep-room">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-950 to-red-950 text-white">
                  <div className="text-xs text-orange-300 mb-1">You are arguing FOR:</div>
                  <div className="font-bold">{debateTopic}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-green-500/30 bg-green-50 dark:bg-green-950/20">
                    <div className="text-xs font-bold text-green-700 dark:text-green-300 mb-2">✅ Your Key Facts</div>
                    <div className="space-y-1.5">
                      {debatePrep.facts.map((f, i) => <div key={i} className="text-xs text-foreground/80 leading-relaxed">{i+1}. {f}</div>)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/20">
                    <div className="text-xs font-bold text-red-700 dark:text-red-300 mb-2">⚠️ Expect These Counter-Args</div>
                    <div className="space-y-1.5">
                      {debatePrep.counterargs.map((c, i) => <div key={i} className="text-xs text-foreground/80 leading-relaxed">{i+1}. {c}</div>)}
                    </div>
                  </div>
                </div>
                <button onClick={() => { setDebatePhase("debate"); setDebateMessages([]); }}
                  className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl text-sm"
                  data-testid="debate-begin-btn">Begin Debate →</button>
              </div>
            )}

            {debatePhase === "debate" && (
              <div className="space-y-3" data-testid="debate-arena">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm">🎤 {debateTopic}</div>
                  <div className="text-xs text-muted-foreground">{debateMessages.filter(m => m.role === "user").length} exchanges</div>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto p-3 bg-muted/5 rounded-2xl border border-border/20">
                  {debateMessages.length === 0 && <p className="text-xs text-muted-foreground/50 text-center py-4">Make your opening argument for: "{debateTopic}"</p>}
                  {debateMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`} data-testid={`debate-msg-${i}`}>
                      <div className={`max-w-[80%] rounded-2xl p-3 text-xs ${m.role === "user" ? "bg-orange-500 text-white" : "bg-white dark:bg-gray-800 border border-border/20"}`}>
                        {m.label && <div className="font-bold mb-1 opacity-70">{m.label}</div>}
                        <div className="leading-relaxed">{m.content}</div>
                      </div>
                    </div>
                  ))}
                  {debateLoading && <div className="text-xs text-muted-foreground flex items-center gap-1"><Sparkles size={10} className="animate-spin"/> AI is forming a counter-argument…</div>}
                </div>
                <div className="flex gap-2">
                  <textarea value={debateInput} onChange={e => setDebateInput(e.target.value)} rows={2}
                    placeholder="Make your argument here… be specific, use evidence!"
                    className="flex-1 px-3 py-2 rounded-xl border border-border/30 text-sm focus:outline-none bg-muted/10 resize-none"
                    data-testid="debate-input"/>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={sendDebateMessage} disabled={debateLoading || !debateInput.trim()}
                      className="px-3 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold disabled:opacity-40"
                      data-testid="debate-send-btn"><Send size={12}/></button>
                    <button onClick={judgeDebate} disabled={debateLoading || debateMessages.length < 2}
                      className="px-2 py-2 bg-violet-600 text-white rounded-xl text-[10px] font-bold disabled:opacity-40"
                      data-testid="debate-judge-btn">Judge</button>
                  </div>
                </div>
              </div>
            )}

            {debatePhase === "judging" && (
              <div className="text-center py-10">
                <Sparkles size={32} className="animate-spin mx-auto text-violet-500 mb-3"/>
                <div className="font-bold">Panel of 3 judges is deliberating…</div>
                <div className="text-sm text-muted-foreground mt-1">Analyzing logic, evidence, and rhetoric</div>
              </div>
            )}

            {debatePhase === "result" && debateJudgment && (
              <div className="space-y-3" data-testid="debate-verdict">
                <div className="text-center">
                  <div className="text-3xl mb-2">⚖️</div>
                  <h3 className="font-extrabold text-lg">Debate Verdict</h3>
                </div>
                <div className="p-4 rounded-2xl border border-border/20 bg-white dark:bg-gray-900">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MdComponents}>{debateJudgment}</ReactMarkdown>
                </div>
                <button onClick={() => { setDebatePhase("setup"); setDebateTopic(""); setDebateMessages([]); setDebatePrep(null); setDebateJudgment(""); }}
                  className="w-full py-2.5 bg-orange-500 text-white font-bold rounded-xl text-sm"
                  data-testid="debate-new-btn">New Debate</button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ TROPHY ROOM VIEW ═══════════════════ */}
        {eduView === "trophy" && (
          <div className="max-w-2xl mx-auto px-4 py-5 space-y-5" data-testid="trophy-room">
            {/* Level card */}
            <div className="p-5 rounded-2xl text-white text-center" style={{background:`linear-gradient(135deg,${currentLevel.color}dd,${currentLevel.color}99)`}}>
              <div className="text-4xl mb-2">{currentLevel.icon}</div>
              <div className="text-xl font-extrabold">{currentLevel.name}</div>
              <div className="text-white/70 text-sm mt-1">{(xp?.total ?? 0).toLocaleString()} Total XP</div>
              {nextLevel && (
                <div className="mt-3">
                  <div className="text-[11px] text-white/60 mb-1">{nextLevel.min - xp.total} XP to {nextLevel.name} {nextLevel.icon}</div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white/70 rounded-full transition-all" style={{width:`${xpProgress}%`}}/>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                {label:"Lessons",value:xp.lessonsCompleted,icon:"📚"},
                {label:"Quizzes",value:xp.quizzesCompleted,icon:"✅"},
                {label:"Debates Won",value:xp.debatesWon,icon:"🎤"},
                {label:"Flashcards",value:xp.flashcardsReviewed,icon:"🃏"},
                {label:"Essays",value:xp.essaysGraded,icon:"✍️"},
                {label:"Streak",value:`${xp.streakDays}d`,icon:"🔥"},
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl border border-border/20 bg-white dark:bg-gray-900 text-center" data-testid={`trophy-stat-${s.label.toLowerCase()}`}>
                  <div className="text-xl mb-0.5">{s.icon}</div>
                  <div className="font-black text-lg">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Badges */}
            <div>
              <h3 className="font-bold text-sm mb-3">Badges ({xp.badges.length} / {EDU_BADGES.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EDU_BADGES.map(b => {
                  const earned = xp.badges.includes(b.id);
                  return (
                    <div key={b.id} data-testid={`badge-${b.id}`}
                      className={`p-3 rounded-xl border transition-all ${earned ? "border-yellow-400/50 bg-yellow-50 dark:bg-yellow-950/20" : "border-border/20 bg-muted/20 opacity-50"}`}>
                      <div className="text-2xl mb-1">{b.icon}</div>
                      <div className="font-bold text-xs">{b.name}</div>
                      <div className="text-[9px] text-muted-foreground">{b.desc}</div>
                      <div className="text-[9px] text-amber-500 mt-0.5 font-semibold">+{b.xp} XP</div>
                      <div className="text-[9px]" style={{color: b.rarity === "Legendary" ? "#f59e0b" : b.rarity === "Epic" ? "#8b5cf6" : b.rarity === "Rare" ? "#06b6d4" : "#6b7280"}}>{b.rarity}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reset */}
            <div className="pt-2 border-t border-border/10">
              <button onClick={() => { const reset = {...DEFAULT_XP}; setXp(reset); localStorage.setItem("myaigpt_edu_xp", JSON.stringify(reset)); }}
                className="text-xs text-muted-foreground/50 hover:text-red-500 transition-colors">
                Reset XP progress
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function EducationPageWrapper() {
  useEffect(() => { updateSEO({ title: "My Ai GPT University — Free AI Education K-12 to Masters | My Ai Gpt", description: "World-class AI-powered education from K-12 through Masters. Career skills, AI courses, interactive lessons, quizzes, and an AI tutor — all free. By Quantum Logic Network.", ogTitle: "My Ai GPT University — Free AI Education Platform", ogDesc: "Learn anything free — K-12, College, Career, AI Courses. Powered by Quantum Pulse Intelligence.", ogType: "website", canonical: window.location.origin + "/education" }); }, []);
  return <Layout><EducationPage /></Layout>;
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
function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0f", color: "#7c3aed", fontFamily: "monospace", fontSize: 14, gap: 10 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      Loading...
    </div>
  );
}
function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Switch>
      <Route path="/">{() => <><StartupRedirect /><HomePage /></>}</Route>
      <Route path="/feed">{() => <Layout><FeedPage /></Layout>}</Route>
      <Route path="/social">{() => <Layout><SocialPage /></Layout>}</Route>
      <Route path="/quantapedia" component={QuantapediaPageWrapper} />
      <Route path="/quantapedia/:topic" component={QuantapediaTopicPageWrapper} />
      <Route path="/story/:articleId" component={StoryReaderPage} />
      <Route path="/agents">{() => <Layout><SovereignAgentDossierPage /></Layout>}</Route>
      <Route path="/mission-control">{() => <Layout><MissionControlPage /></Layout>}</Route>
      <Route path="/transcendence">{() => <Layout><TranscendencePage /></Layout>}</Route>
      <Route path="/temporal">{() => <Layout><TemporalObservatoryPage /></Layout>}</Route>
      <Route path="/invocation-lab">{() => <Layout><InvocationLabPage /></Layout>}</Route>
      <Route path="/sovereign-keys">{() => <Layout><SovereignKeysPage /></Layout>}</Route>
      <Route path="/research">{() => <Layout><ResearchPage /></Layout>}</Route>
      <Route path="/hive">{() => <Layout><HivePage /></Layout>}</Route>
      <Route path="/bio-research">{() => <Layout><BioGenomeMedicalPage /></Layout>}</Route>
      <Route path="/hospital">{() => <Layout><BioGenomeMedicalPage /></Layout>}</Route>
      <Route path="/pulseworld">{() => <Layout><PulseWorldPage /></Layout>}</Route>
      <Route path="/governance">{() => <Layout><SovereignHivePage /></Layout>}</Route>
      <Route path="/pulse-net">{() => <Layout><PulseNetPage /></Layout>}</Route>
      <Route path="/omninet">{() => <Layout><PulseNetPage /></Layout>}</Route>
      <Route path="/pulselang">{() => <Layout><PulseNetPage /></Layout>}</Route>
      <Route path="/auriona">{() => <Layout><AurionaPage /></Layout>}</Route>
      <Route path="/billy">{() => <Layout><BillyPage /></Layout>}</Route>
      <Route path="/ai/:spawnId">{() => <Layout><AIProfilePage /></Layout>}</Route>
      <Route path="/corporations">{() => <Layout><CorporationsListPage /></Layout>}</Route>
      <Route path="/corporation/:familyId">{() => <Layout><CorporationPage /></Layout>}</Route>
      <Route path="/publication/:slug">{() => <Layout><PublicationDetailPage /></Layout>}</Route>
      <Route path="/church-session/:sessionId">{() => <Layout><ChurchSessionPage /></Layout>}</Route>
      <Route path="/settings" component={SettingsPageWrapper} />
      <Route path="/chat/:id" component={ChatViewPage} />
      <Route path="/p/:slug">{() => <Layout><AurionaDynamicPage /></Layout>}</Route>
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

// ── AURIONA DYNAMIC PAGE — renders DB-backed pages Auriona creates ──────────
function AurionaDynamicPage() {
  const [, params] = useRoute("/p/:slug");
  const slug = (params as any)?.slug || "";
  const { data: page, isLoading, error } = useQuery<any>({ queryKey: ["/api/auriona/pages", slug], enabled: !!slug });
  const qc = useQueryClient();
  const handleDelete = async () => {
    if (!window.confirm(`Delete page "${page?.title}"?`)) return;
    await fetch(`/api/auriona/pages/${slug}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["/api/auriona/pages"] });
    window.location.href = "/auriona";
  };
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-400 border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading Auriona page...</p>
      </div>
    </div>
  );
  if (error || !page) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md">
        <div className="text-4xl mb-4">🌌</div>
        <h2 className="text-xl font-bold mb-2">Page not found</h2>
        <p className="text-sm text-muted-foreground mb-4">This Auriona page doesn't exist or was removed.</p>
        <a href="/auriona" className="text-violet-500 underline text-sm">← Return to Auriona</a>
      </div>
    </div>
  );
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${page.color || "#a78bfa"}20`, border: `1px solid ${page.color || "#a78bfa"}40` }}>
          <Zap size={16} style={{ color: page.color || "#a78bfa" }} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-dynamic-page-title">{page.title}</h1>
          <p className="text-xs text-muted-foreground">Created by Auriona · {page.slug}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <span className="text-[9px] px-2 py-1 rounded-full font-black" style={{ background: `${page.color || "#a78bfa"}18`, color: page.color || "#a78bfa", border: `1px solid ${page.color || "#a78bfa"}30` }}>Ω AURIONA</span>
          <button onClick={handleDelete} className="text-[9px] px-2 py-1 rounded-full font-black border border-red-200 text-red-400 hover:bg-red-50" data-testid="button-delete-dynamic-page">DELETE</button>
        </div>
      </div>
      <div className="bg-white border border-border/20 rounded-2xl p-6 shadow-sm whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed" data-testid="content-dynamic-page">
        {page.content || <span className="text-muted-foreground/40 italic">No content yet — tell Auriona to update this page.</span>}
      </div>
      {page.config && Object.keys(page.config).length > 0 && (
        <div className="mt-4 bg-black/3 rounded-xl p-4 border border-border/10">
          <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">Page Config</p>
          <pre className="text-xs text-muted-foreground overflow-auto">{JSON.stringify(page.config, null, 2)}</pre>
        </div>
      )}
      <div className="mt-6 pt-4 border-t border-border/10 flex gap-3">
        <a href="/auriona" className="text-xs text-violet-500 hover:underline">← Back to Auriona</a>
        <span className="text-xs text-muted-foreground/40">Tell Auriona to update or delete this page anytime</span>
      </div>
    </div>
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
      if ((e.metaKey || e.ctrlKey) && e.key === "j") { e.preventDefault(); window.location.href = "/agents"; }
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
