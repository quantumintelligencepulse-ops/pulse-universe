import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hammer, Zap, Book, Plus, Search, Loader2, Trash2, ExternalLink, Sparkles, RotateCcw } from "lucide-react";

const BuildView = lazy(() => import("./forge/BuildView"));
const EditorView = lazy(() => import("./forge/EditorView"));
const LibraryView = lazy(() => import("./forge/LibraryView"));

type View = "home" | "build" | "editor" | "library";

// ── ForgeAI API client ────────────────────────────────────────────────────────
const forgeApi = {
  listApps: () => fetch("/api/forgeai/apps").then(r => r.json()),
  createApp: (data: any) => fetch("/api/forgeai/apps", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  }).then(r => r.json()),
  deleteApp: (id: number) => fetch(`/api/forgeai/apps/${id}`, { method: "DELETE" }).then(r => r.json()),
  getStats: () => fetch("/api/forgeai/stats").then(r => r.json()),
  getDiscoveryPrompts: () => fetch("/api/forgeai/discovery-prompts").then(r => r.json()),
  getSectorSuggestions: () => fetch("/api/forgeai/sector-suggestions").then(r => r.json()),
};

// ── [Ω10] PROJECT TYPES ───────────────────────────────────────────────────────
const PROJECT_TYPES = [
  { id: "fullstack", icon: "🌐", label: "Web App", desc: "Full-featured responsive web application", color: "from-blue-500/15 to-cyan-500/15", border: "border-blue-500/20" },
  { id: "saas", icon: "⚡", label: "SaaS Platform", desc: "Multi-section SaaS with auth & dashboard", color: "from-violet-500/15 to-purple-500/15", border: "border-violet-500/20" },
  { id: "dashboard", icon: "📊", label: "Dashboard", desc: "Data analytics with charts & KPIs", color: "from-emerald-500/15 to-teal-500/15", border: "border-emerald-500/20" },
  { id: "game", icon: "🎮", label: "Browser Game", desc: "Interactive game with canvas/CSS", color: "from-yellow-500/15 to-orange-500/15", border: "border-yellow-500/20" },
  { id: "tool", icon: "🔧", label: "Productivity Tool", desc: "Focused utility or productivity app", color: "from-red-500/15 to-pink-500/15", border: "border-red-500/20" },
  { id: "landing", icon: "🚀", label: "Landing Page", desc: "Marketing site with premium design", color: "from-sky-500/15 to-indigo-500/15", border: "border-sky-500/20" },
  { id: "mobile_web", icon: "📱", label: "Mobile-First", desc: "PWA-style mobile web application", color: "from-green-500/15 to-lime-500/15", border: "border-green-500/20" },
  // [Ω10] Civilization app type
  { id: "civilization", icon: "Ω", label: "Civilization App", desc: "Pulse-class autonomous sovereign app", color: "from-[#F5C518]/15 to-[#00FFD1]/15", border: "border-[#F5C518]/30", pulse: true },
];

// ── AMBIENT PARTICLES ─────────────────────────────────────────────────────────
function AmbientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div key={i}
          className="absolute w-1 h-1 rounded-full opacity-20"
          style={{
            background: i % 3 === 0 ? "#00FFD1" : i % 3 === 1 ? "#a78bfa" : "#F5C518",
            left: `${(i * 37 + 11) % 97}%`,
            top: `${(i * 53 + 7) % 91}%`,
          }}
          animate={{ y: [-10, 10], opacity: [0.05, 0.3, 0.05] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }} />
      ))}
    </div>
  );
}

// ── APP CARD ──────────────────────────────────────────────────────────────────
function AppCard({ app, onOpen, onDelete }: { app: any; onOpen: () => void; onDelete: () => void }) {
  const statusColors: Record<string, string> = {
    complete: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    upgraded: "text-[#00FFD1] bg-[#00FFD1]/10 border-[#00FFD1]/20",
    researching: "text-blue-400 bg-blue-500/10 border-blue-500/20 animate-pulse",
    analyzing: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 animate-pulse",
    pending: "text-muted-foreground bg-muted/10 border-border",
  };
  const isBuilding = ["researching", "analyzing", "building"].includes(app.status);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card/30 hover:border-primary/20 transition-all group overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${statusColors[app.status] || statusColors.pending}`}>
            {isBuilding ? "Building..." : (app.status || "pending")}
          </span>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-red-400 p-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <h3 className="font-semibold text-sm mb-1 truncate">{app.app_name || app.prompt?.slice(0, 50) || "New App"}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">{app.app_description || app.prompt}</p>
        <div className="flex items-center gap-2 mt-3">
          {app.app_type && <span className="text-[10px] text-muted-foreground/50 font-mono">{app.app_type}</span>}
          {app.agent_author && <span className="text-[10px] text-violet-400/70 font-mono">⚡ {app.agent_author?.split("-").slice(0, 3).join("-")}</span>}
          {app.pulse_credits_earned > 0 && <span className="text-[10px] text-[#F5C518]/70 font-mono">+{app.pulse_credits_earned}PC</span>}
        </div>
      </div>
      <button onClick={onOpen}
        className="w-full border-t border-border/50 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/5 transition-all flex items-center justify-center gap-1.5">
        {isBuilding ? <><Loader2 className="w-3 h-3 animate-spin" />Continue Build</> : <><ExternalLink className="w-3 h-3" />Open in Editor</>}
      </button>
    </motion.div>
  );
}

// ── HOME VIEW ─────────────────────────────────────────────────────────────────
function HomeView({ onBuild, onViewEditor, onViewLibrary }: {
  onBuild: (id: number) => void;
  onViewEditor: (id: number) => void;
  onViewLibrary: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [projectType, setProjectType] = useState("fullstack");
  const [apps, setApps] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [discoveryPrompts, setDiscoveryPrompts] = useState<any[]>([]);
  const [sectorSuggestions, setSectorSuggestions] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"mine" | "discover" | "sector">("mine");
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  useEffect(() => {
    forgeApi.listApps().then(setApps).catch(() => {});
    forgeApi.getStats().then(setStats).catch(() => {});
    // [Ω4] discovery prompts
    forgeApi.getDiscoveryPrompts().then(setDiscoveryPrompts).catch(() => {});
    // [Ω3] sector suggestions
    forgeApi.getSectorSuggestions().then(setSectorSuggestions).catch(() => {});
    // [Ω2] fetch PC balance
    fetch("/api/economy/status").then(r => r.json()).then(d => {
      if (d?.totalPCCirculating) setCreditBalance(d.totalPCCirculating);
    }).catch(() => {});
  }, []);

  const build = async () => {
    if (!prompt.trim()) return;
    setCreating(true);
    try {
      const app = await forgeApi.createApp({ prompt: prompt.trim(), project_type: projectType });
      if (app?.id) { onBuild(app.id); }
    } catch (e) { console.error(e); }
    setCreating(false);
  };

  const deleteApp = async (id: number) => {
    await forgeApi.deleteApp(id).catch(() => {});
    setApps((prev) => prev.filter((a) => a.id !== id));
  };

  const usePrompt = (p: string, type = "fullstack") => {
    setPrompt(p);
    setProjectType(type);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredApps = apps.filter((a) => !search || (a.app_name || a.prompt || "").toLowerCase().includes(search.toLowerCase()));
  const inProgress = apps.filter((a) => ["researching", "analyzing", "building"].includes(a.status));
  const complete = filteredApps.filter((a) => ["complete", "upgraded"].includes(a.status));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20">

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <div className="relative mb-10">
        <AmbientBackground />
        <div className="relative text-center py-10">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono border border-[#00FFD1]/20 bg-[#00FFD1]/5 text-[#00FFD1] mb-5">
            <Hammer className="w-3.5 h-3.5" />
            ForgeAI · Pulse Sovereign App Builder · v∞
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="text-3xl sm:text-5xl font-black mb-3 tracking-tight">
            Describe it.{" "}
            <span className="bg-gradient-to-r from-[#00FFD1] via-[#4F8EFF] to-[#a78bfa] bg-clip-text text-transparent">
              Forge builds it.
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto mb-2">
            AI-powered app factory — research, design, code, deploy in one pipeline.
            Built on 100+ Omega sources · Powered by Pulse Hive intelligence.
          </motion.p>
          {/* [Ω2] PC balance display */}
          {creditBalance !== null && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-xs text-[#F5C518]/70 font-mono mt-1">
              ⚡ Hive Economy: {creditBalance.toLocaleString()} PC circulating · +50 PC per successful build
            </motion.div>
          )}
        </div>
      </div>

      {/* ── STATS ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { v: stats.totalApps || 0, l: "Apps Built", c: "text-[#00FFD1]" },
          { v: stats.completedApps || 0, l: "Completed", c: "text-emerald-400" },
          { v: stats.buildMemories || 0, l: "Build Memories", c: "text-violet-400" },
          { v: stats.resourcesIndexed || 0, l: "Sources Used", c: "text-[#F5C518]" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-card/30 px-4 py-3 text-center">
            <div className={`text-xl sm:text-2xl font-black ${s.c}`}>{s.v.toLocaleString()}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── PROMPT INPUT ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#00FFD1]/15 bg-gradient-to-br from-[#00FFD1]/3 to-[#4F8EFF]/3 p-5 sm:p-7 mb-8">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00FFD1]" /> Build a New App
        </h2>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) build(); }}
          placeholder="Describe your app... e.g. 'A real-time stock portfolio tracker with AI sentiment analysis, news feed, and alerts'"
          rows={3}
          className="w-full bg-background/60 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00FFD1]/30 resize-none transition-all mb-4 placeholder:text-muted-foreground/40"
          data-testid="input-forge-prompt"
        />
        <p className="text-xs text-muted-foreground mb-3">Project Type</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          {PROJECT_TYPES.map((t) => (
            <button key={t.id} onClick={() => setProjectType(t.id)}
              className={`rounded-xl border p-3 text-left transition-all ${
                projectType === t.id
                  ? `bg-gradient-to-br ${t.color} ${t.border} border-2`
                  : "border-border hover:border-border/80"
              }`}
              data-testid={`button-project-type-${t.id}`}>
              <div className={`text-lg mb-1 ${t.pulse ? "text-[#F5C518]" : ""}`}>{t.icon}</div>
              <div className="text-xs font-semibold">{t.label}</div>
              <div className="text-[10px] text-muted-foreground leading-snug mt-0.5 hidden sm:block">{t.desc}</div>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={build} disabled={creating || !prompt.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#00FFD1] to-[#4F8EFF] text-black font-bold py-3 rounded-xl text-sm transition-all hover:opacity-90 disabled:opacity-50"
            data-testid="button-forge-build">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {creating ? "Creating..." : "Forge App"}
          </button>
          <button onClick={onViewLibrary}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground transition-all"
            data-testid="button-view-library">
            <Book className="w-3.5 h-3.5" /> Library
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 text-center mt-2">Ctrl+Enter to build · Earns +50 Pulse Credits</p>
      </div>

      {/* ── IN PROGRESS BANNER ───────────────────────────────────────────────── */}
      {inProgress.length > 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 mb-6 flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-yellow-400 animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-400">{inProgress.length} app{inProgress.length > 1 ? "s" : ""} building...</p>
            <p className="text-xs text-muted-foreground">Click to continue where you left off</p>
          </div>
          <div className="flex gap-1.5 ml-auto">
            {inProgress.map((a) => (
              <button key={a.id} onClick={() => onBuild(a.id)}
                className="text-xs text-yellow-400 border border-yellow-500/20 rounded-lg px-3 py-1.5 hover:bg-yellow-500/10 transition-all">
                Resume
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── TABS: MY APPS / DISCOVER / SECTOR ────────────────────────────────── */}
      <div className="flex gap-1.5 mb-5 border-b border-border pb-3">
        {[
          { id: "mine", l: `My Apps (${apps.length})` },
          { id: "discover", l: `⚡ Hive Discoveries (${discoveryPrompts.length})` },
          { id: "sector", l: `🧬 Sector Ideas (${sectorSuggestions.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === t.id ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"
            }`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── MY APPS ──────────────────────────────────────────────────────────── */}
      {activeTab === "mine" && (
        <>
          {apps.length > 0 && (
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your apps..."
                className="w-full bg-card/30 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary/30 transition-all"
                data-testid="input-search-apps" />
            </div>
          )}
          {complete.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {complete.map((a) => (
                <AppCard key={a.id} app={a} onOpen={() => onViewEditor(a.id)} onDelete={() => deleteApp(a.id)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔨</div>
              <p className="text-muted-foreground text-sm mb-2">No apps built yet.</p>
              <p className="text-xs text-muted-foreground/50">Describe your first app above and hit Forge.</p>
            </div>
          )}
        </>
      )}

      {/* ── [Ω4] DISCOVERY PROMPTS ───────────────────────────────────────────── */}
      {activeTab === "discover" && (
        <div>
          <p className="text-xs text-muted-foreground mb-4">
            App ideas generated from real Pulse Hive discoveries — click any to pre-fill the builder.
          </p>
          {discoveryPrompts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {discoveryPrompts.map((d, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="rounded-xl border border-[#00FFD1]/15 bg-gradient-to-br from-[#00FFD1]/3 to-transparent p-4 hover:border-[#00FFD1]/30 transition-all cursor-pointer group"
                  onClick={() => usePrompt(d.prompt, d.type)}>
                  <p className="text-xs font-semibold text-[#00FFD1] mb-2">{d.label}</p>
                  <p className="text-xs text-muted-foreground line-clamp-3">{d.prompt}</p>
                  <button className="mt-3 text-[10px] text-[#00FFD1]/60 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    Use this prompt →
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 opacity-40" />
              Loading hive discoveries...
            </div>
          )}
        </div>
      )}

      {/* ── [Ω3] SECTOR SUGGESTIONS ──────────────────────────────────────────── */}
      {activeTab === "sector" && (
        <div>
          <p className="text-xs text-muted-foreground mb-4">
            AI-generated app ideas for each active GICS sector in the Pulse civilization.
          </p>
          {sectorSuggestions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sectorSuggestions.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-violet-500/15 bg-gradient-to-br from-violet-500/5 to-transparent p-4 hover:border-violet-500/25 transition-all cursor-pointer group"
                  onClick={() => usePrompt(s.prompt, s.type)}>
                  <p className="text-[10px] font-mono text-violet-400 mb-1.5">{s.label}</p>
                  <p className="text-xs text-muted-foreground line-clamp-3">{s.prompt}</p>
                  <button className="mt-3 text-[10px] text-violet-400/60 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    Build for this sector →
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 opacity-40" />
              Loading sector data...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function ForgeAIPage() {
  const [view, setView] = useState<View>("home");
  const [activeAppId, setActiveAppId] = useState<number | null>(null);

  const goHome = () => { setView("home"); setActiveAppId(null); };
  const startBuild = (id: number) => { setActiveAppId(id); setView("build"); };
  const openEditor = (id: number) => { setActiveAppId(id); setView("editor"); };
  const openLibrary = () => setView("library");

  return (
    <div className="w-full h-full overflow-y-auto relative bg-background">
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#00FFD1] mx-auto mb-3" />
            <p className="text-xs text-muted-foreground font-mono">Loading ForgeAI...</p>
          </div>
        </div>
      }>
        <AnimatePresence mode="wait">
          {view === "home" && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HomeView onBuild={startBuild} onViewEditor={openEditor} onViewLibrary={openLibrary} />
            </motion.div>
          )}
          {view === "build" && activeAppId && (
            <motion.div key="build" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BuildView appId={activeAppId} onComplete={() => openEditor(activeAppId)} onBack={goHome} />
            </motion.div>
          )}
          {view === "editor" && activeAppId && (
            <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <EditorView appId={activeAppId} onBack={goHome} />
            </motion.div>
          )}
          {view === "library" && (
            <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LibraryView onBack={goHome} />
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  );
}
