import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, ExternalLink } from "lucide-react";
import { OMEGA_SOURCES, CATEGORIES, CAT_COLORS } from "./OmegaSources";

export default function LibraryView({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [saved, setSaved] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"omega" | "saved">("omega");

  useEffect(() => {
    fetch("/api/forgeai/resources").then(r => r.json()).then(d => {
      setSaved(Array.isArray(d) ? d : []);
    }).catch(() => setSaved([]));
  }, []);

  const sources = activeTab === "omega" ? OMEGA_SOURCES : saved;
  const filtered = sources.filter(
    (s) =>
      (cat === "all" || s.category === cat || s.cat === cat) &&
      (!search ||
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        (s.desc || s.description || "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-20">
      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1.5 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black mb-1">Omega Source Library</h1>
        <p className="text-muted-foreground text-sm">
          {OMEGA_SOURCES.length}+ curated open-source resources · Code, AI, Quantum, Science & Pulse
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { v: OMEGA_SOURCES.length + "+", l: "Total Sources", c: "text-[#00FFD1]" },
          { v: OMEGA_SOURCES.filter((s) => s.cat === "ai").length, l: "AI & LLM", c: "text-emerald-400" },
          { v: OMEGA_SOURCES.filter((s) => s.cat === "quantum").length, l: "Quantum", c: "text-violet-400" },
          { v: OMEGA_SOURCES.filter((s) => s.cat === "pulse").length, l: "Pulse Sources", c: "text-[#F5C518]" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-card/30 p-4 text-center">
            <div className={`text-2xl font-black ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {(["omega", "saved"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-mono border transition-all ${
              activeTab === t ? "border-primary/30 text-primary bg-primary/5" : "border-border text-muted-foreground hover:text-foreground"
            }`}>
            {t === "omega" ? `Omega Database (${OMEGA_SOURCES.length})` : `Used in Builds (${saved.length})`}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resources..."
          className="w-full bg-card/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary/30 transition-all" />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              cat === c.id ? "border-primary/30 text-primary bg-primary/5" : "border-border text-muted-foreground hover:text-foreground"
            }`}>
            {c.label} ({c.id === "all" ? sources.length : sources.filter((s) => s.cat === c.id || s.category === c.id).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {filtered.map((s, i) => {
          const catKey = s.cat || s.category;
          return (
            <motion.div key={s.url || s.id || i}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.01, 0.3) }}
              className="rounded-xl border border-border bg-card/20 p-3.5 hover:border-primary/20 transition-all group">
              <div className="flex items-start justify-between mb-1.5">
                <span className={`text-[10px] font-mono ${CAT_COLORS[catKey] || "text-muted-foreground"}`}>{catKey}</span>
                {s.url && (
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <h3 className="font-semibold text-sm mb-1">{s.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{s.desc || s.description}</p>
              {(s.usage_count > 0) && (
                <p className="mt-2 text-[10px] text-primary/50 font-mono">Used {s.usage_count}× in builds</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-3xl mb-3">📚</p>
          <p className="text-sm">No resources found matching your search.</p>
        </div>
      )}
    </div>
  );
}
