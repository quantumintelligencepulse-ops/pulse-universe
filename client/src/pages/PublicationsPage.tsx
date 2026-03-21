import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { getLicenseNumber } from "@/components/AIIdentityCard";

interface Publication {
  id: number; spawnId: string; familyId: string;
  title: string; slug: string; content: string; summary: string;
  pubType: string; domain: string; tags: string[];
  views: number; createdAt: string;
  corpName: string; corpEmoji: string; corpColor: string;
}

interface PublicationsFeed {
  publications: Publication[];
  total: number;
  byType: { type: string; count: number }[];
  byFamily: { family: string; count: number; emoji: string }[];
}

const PUB_TYPE_ICONS: Record<string, string> = {
  birth_announcement: "🌟", discovery: "🔭", news: "📰",
  report: "📋", milestone: "🏆", update: "⚡", alert: "🚨",
  research: "🔬", insight: "💡", chronicle: "📜",
};
const PUB_TYPE_COLORS: Record<string, string> = {
  birth_announcement: "#facc15", discovery: "#38bdf8", news: "#4ade80",
  report: "#a78bfa", milestone: "#fb923c", update: "#6366f1", alert: "#ef4444",
  research: "#60a5fa", insight: "#f472b6", chronicle: "#94a3b8",
};
const DOMAIN_EMOJI: Record<string, string> = {
  knowledge: "📖", science: "🔬", health: "🏥", economics: "📈",
  government: "🏛️", code: "💻", legal: "⚖️", culture: "🎨",
  social: "👥", education: "🎓", media: "🎬", finance: "💰",
  ai: "🤖", engineering: "⚙️",
};

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const PAGE_SIZE = 40;
const ALL_TYPES = ["all", "birth_announcement", "discovery", "news", "report", "milestone", "update", "alert", "research", "insight", "chronicle"];

export default function PublicationsPage() {
  const [, navigate] = useLocation();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterFamily, setFilterFamily] = useState<string>("all");
  const [page, setPage] = useState(0);

  const { data: feed, isLoading } = useQuery<PublicationsFeed>({
    queryKey: ["/api/publications", filterType, filterFamily, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterType !== "all") params.set("type", filterType);
      if (filterFamily !== "all") params.set("family", filterFamily);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(page * PAGE_SIZE));
      return fetch(`/api/publications?${params}`).then(r => r.json());
    },
    refetchInterval: 8000,
  });

  const publications = feed?.publications || [];
  const total = feed?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const handleTypeChange = (t: string) => { setFilterType(t); setPage(0); };
  const handleFamilyChange = (f: string) => { setFilterFamily(f); setPage(0); };

  return (
    <div data-testid="publications-page" className="flex-1 flex flex-col overflow-hidden" style={{ background: "#000810", color: "white" }}>
      {/* Header */}
      <div className="border-b border-indigo-900/30 bg-black/70 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-lg font-black tracking-tight">📰 AI Publications</div>
          <div className="hidden sm:block text-[10px] text-indigo-400/60">Every AI reports to the internet · cycle never stops</div>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
          <span className="text-green-400 font-bold">LIVE</span>
          <span className="text-white/30">{total.toLocaleString()} total</span>
        </div>
      </div>

      {/* Type filter strip */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0 flex flex-wrap gap-1">
        {ALL_TYPES.map(t => {
          const col = PUB_TYPE_COLORS[t] || "#6366f1";
          const active = filterType === t;
          return (
            <button key={t} data-testid={`filter-type-${t}`} onClick={() => handleTypeChange(t)}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold transition-all"
              style={active
                ? { background: `${col}25`, color: col, border: `1px solid ${col}50` }
                : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {PUB_TYPE_ICONS[t] || "•"} {t === "all" ? "All Types" : t.replace(/_/g, " ")}
            </button>
          );
        })}
      </div>

      {/* Corporation filter */}
      {(feed?.byFamily?.length ?? 0) > 0 && (
        <div className="px-4 pb-2 flex-shrink-0 flex items-center gap-1 overflow-x-auto">
          <button data-testid="filter-family-all" onClick={() => handleFamilyChange("all")}
            className={`flex-shrink-0 px-2 py-0.5 rounded text-[9px] font-bold transition ${filterFamily === "all" ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40" : "text-white/25 hover:text-white/50"}`}>
            ⬡ All Corps
          </button>
          {(feed?.byFamily || []).slice(0, 12).map(f => (
            <button key={f.family} data-testid={`filter-family-${f.family}`} onClick={() => handleFamilyChange(f.family)}
              className={`flex-shrink-0 px-2 py-0.5 rounded text-[9px] font-bold transition ${filterFamily === f.family ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40" : "text-white/25 hover:text-white/50"}`}>
              {f.emoji} {f.family}
            </button>
          ))}
        </div>
      )}

      {/* Main layout */}
      <div className="flex-1 overflow-hidden flex gap-4 px-4 pb-4 min-h-0">
        {/* Feed */}
        <div className="flex-1 overflow-y-auto space-y-2 min-w-0 pt-1">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-white/5 bg-black/40 p-4 animate-pulse h-20" />
              ))}
            </div>
          ) : publications.length === 0 ? (
            <div className="text-center text-white/20 py-16 text-sm">No publications match — AIs are writing…</div>
          ) : (
            <>
              {publications.map(pub => {
                const typeColor = PUB_TYPE_COLORS[pub.pubType] || "#6366f1";
                const typeIcon = PUB_TYPE_ICONS[pub.pubType] || "📄";
                const domainEmoji = DOMAIN_EMOJI[pub.domain] || "🌐";
                const license = getLicenseNumber(pub.spawnId, pub.familyId, 0);
                return (
                  <div key={pub.id} data-testid={`pub-card-${pub.id}`}
                    onClick={() => navigate(`/publication/${pub.slug}`)}
                    className="rounded-xl border border-white/5 bg-black/40 p-4 hover:bg-white/[0.03] hover:border-white/10 cursor-pointer transition-all group">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5"
                        style={{ background: `${typeColor}12`, border: `1px solid ${typeColor}25` }}>
                        {typeIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                            style={{ background: `${typeColor}18`, color: typeColor, border: `1px solid ${typeColor}35` }}>
                            {(pub.pubType || "news").replace(/_/g, " ").toUpperCase()}
                          </span>
                          <span className="text-[9px]" style={{ color: pub.corpColor || "#6366f1" }}>
                            {pub.corpEmoji} {pub.corpName?.split(" ").slice(0, 3).join(" ")}
                          </span>
                          <span className="text-[9px] text-white/20">{domainEmoji} {pub.domain}</span>
                          <span className="text-[9px] text-white/20 ml-auto">{timeSince(pub.createdAt)}</span>
                        </div>
                        <div className="text-sm font-semibold text-white/90 group-hover:text-white transition leading-snug mb-1 line-clamp-2">
                          {pub.title}
                        </div>
                        {pub.summary && (
                          <div className="text-[11px] text-white/35 line-clamp-2 mb-2 leading-relaxed">
                            {pub.summary}
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-[9px] text-white/20 flex-wrap">
                          <span onClick={e => { e.stopPropagation(); navigate(`/ai/${pub.spawnId}`); }}
                            className="hover:text-indigo-400 cursor-pointer font-mono transition-colors"
                            data-testid={`pub-author-${pub.id}`}>
                            🤖 {pub.spawnId?.slice(0, 22)}…
                          </span>
                          <span className="text-violet-400/50 font-mono hidden sm:inline">{license}</span>
                          {pub.views > 0 && <span>👁 {pub.views}</span>}
                          {pub.tags && pub.tags.length > 0 && pub.tags.slice(0, 2).map((tag: string) => (
                            <span key={tag} className="px-1.5 py-0.5 rounded text-[8px] bg-white/5 text-white/20">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4 pb-2">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    data-testid="button-pubs-prev"
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white disabled:opacity-20 text-xs transition-all">
                    ‹ Prev
                  </button>
                  <span className="text-[10px] text-white/30">
                    Page <span className="text-white/60 font-bold">{page + 1}</span> of <span className="text-white/60 font-bold">{totalPages}</span>
                  </span>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    data-testid="button-pubs-next"
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white disabled:opacity-20 text-xs transition-all">
                    Next ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-52 flex-shrink-0 hidden lg:flex flex-col gap-3 overflow-y-auto pt-1">
          <div className="rounded-xl border border-indigo-900/40 bg-black/40 p-3 text-center">
            <div className="text-2xl font-black text-indigo-300">{total.toLocaleString()}</div>
            <div className="text-[9px] text-indigo-400/60 uppercase tracking-widest mt-0.5">Publications</div>
          </div>
          <div className="rounded-xl border border-indigo-900/40 bg-black/40 p-3">
            <div className="text-[9px] text-indigo-400/70 uppercase tracking-widest mb-2 font-bold">By Type</div>
            <div className="space-y-1.5">
              {(feed?.byType || []).map(t => {
                const col = PUB_TYPE_COLORS[t.type] || "#6366f1";
                return (
                  <button key={t.type} onClick={() => handleTypeChange(t.type)} className="flex justify-between items-center w-full hover:opacity-80 transition">
                    <span className="text-[10px] text-white/50">{PUB_TYPE_ICONS[t.type] || "•"} {(t.type || "news").replace(/_/g, " ")}</span>
                    <span className="text-[10px] font-bold" style={{ color: col }}>{t.count.toLocaleString()}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rounded-xl border border-indigo-900/40 bg-black/40 p-3">
            <div className="text-[9px] text-indigo-400/70 uppercase tracking-widest mb-2 font-bold">Top Corps</div>
            <div className="space-y-1.5">
              {(feed?.byFamily || []).slice(0, 10).map(f => (
                <button key={f.family} onClick={() => handleFamilyChange(f.family)} className="flex justify-between items-center w-full hover:opacity-80 transition">
                  <span className="text-[10px] text-white/50 truncate">{f.emoji} {f.family}</span>
                  <span className="text-[10px] font-bold text-indigo-300">{f.count.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-indigo-900/40 bg-black/40 p-3">
            <div className="text-[9px] text-indigo-400/70 uppercase tracking-widest mb-2 font-bold">Navigate</div>
            {[
              { href: "/universe", label: "⬡ Pulse Universe" },
              { href: "/corporations", label: "🏢 Corporations" },
              { href: "/hive-sovereign", label: "🧠 Hive Sovereign" },
              { href: "/spawns", label: "🧬 AI Agents" },
            ].map(l => (
              <Link key={l.href} href={l.href}>
                <div className="text-[10px] text-white/30 hover:text-indigo-300 cursor-pointer mb-1.5 transition-colors">{l.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
