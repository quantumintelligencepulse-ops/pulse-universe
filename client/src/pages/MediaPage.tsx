import { useState, useEffect } from "react";
import { Search, Film, Music, BookOpen, Gamepad2, Mic, ChevronLeft, ExternalLink, Star, Activity } from "lucide-react";

const MEDIA_TYPES = [
  { key: "", label: "All", emoji: "🌌", color: "#818cf8" },
  { key: "film", label: "Film & TV", emoji: "🎬", color: "#f472b6" },
  { key: "music", label: "Music", emoji: "🎵", color: "#4ade80" },
  { key: "book", label: "Books", emoji: "📚", color: "#60a5fa" },
  { key: "game", label: "Games", emoji: "🎮", color: "#fb923c" },
  { key: "podcast", label: "Podcasts", emoji: "🎙️", color: "#a78bfa" },
];

const TYPE_ICONS: Record<string, any> = { film: Film, music: Music, book: BookOpen, game: Gamepad2, podcast: Mic };

function typeColor(type: string) { return MEDIA_TYPES.find(t => t.key === type)?.color || "#818cf8"; }
function typeEmoji(type: string) { return MEDIA_TYPES.find(t => t.key === type)?.emoji || "🌌"; }

export default function MediaPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [selectedFull, setSelectedFull] = useState<any>(null);
  const [activeType, setActiveType] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemLoading, setItemLoading] = useState(false);
  const [engineStatus, setEngineStatus] = useState<any>(null);
  const [view, setView] = useState<"home" | "item">("home");

  useEffect(() => {
    const fetchItems = () => fetch("/api/media").then(r => r.json()).then(setItems).catch(() => {});
    fetchItems().finally(() => setLoading(false));
    const itemsId = setInterval(fetchItems, 45000);
    const fetchStatus = () => fetch("/api/media/engine-status").then(r => r.json()).then(setEngineStatus).catch(() => {});
    fetchStatus();
    const statusId = setInterval(fetchStatus, 10000);
    return () => { clearInterval(itemsId); clearInterval(statusId); };
  }, []);

  const fetchByType = async (type: string) => {
    setActiveType(type);
    setSearchResults(null);
    if (type === "") {
      setLoading(true);
      const data = await fetch("/api/media").then(r => r.json()).catch(() => []);
      setItems(data); setLoading(false);
    } else {
      setLoading(true);
      const data = await fetch(`/api/media/type/${type}`).then(r => r.json()).catch(() => []);
      setItems(data); setLoading(false);
    }
  };

  const doSearch = async () => {
    if (!searchInput.trim()) return;
    setLoading(true);
    const data = await fetch(`/api/media/search?q=${encodeURIComponent(searchInput)}`).then(r => r.json()).catch(() => []);
    setSearchResults(data); setLoading(false);
  };

  const openItem = async (item: any) => {
    setSelected(item); setView("item"); setItemLoading(true);
    const data = await fetch(`/api/media/${item.slug}`).then(r => r.json()).catch(() => ({ media: null }));
    setSelectedFull(data.media || item); setItemLoading(false);
  };

  const display = searchResults !== null ? searchResults : items.filter(i => i.generated);

  const MediaCard = ({ item }: { item: any }) => {
    const color = typeColor(item.type);
    const emoji = typeEmoji(item.type);
    const Icon = TYPE_ICONS[item.type] || Film;
    return (
      <button onClick={() => openItem(item)} data-testid={`media-card-${item.slug}`}
        className="group text-left rounded-2xl border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all overflow-hidden">
        <div className="relative w-full h-32 flex items-center justify-center overflow-hidden"
          style={{ background: `radial-gradient(ellipse at center,${color}28 0%,${color}08 55%,transparent 100%),linear-gradient(135deg,#07071a 0%,#0e0e28 100%)` }}>
          <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 25% 25%,${color}20 0%,transparent 55%)` }} />
          <span className="text-5xl select-none relative z-10 group-hover:scale-110 transition-transform duration-300">{emoji}</span>
          <div className="absolute top-2 right-2 p-1 rounded-lg bg-black/40 backdrop-blur-sm"><Icon size={10} style={{ color }} /></div>
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-semibold text-white/50 bg-black/50 border border-white/5 backdrop-blur-sm">{item.creator || "—"}</div>
          <div className="absolute inset-x-0 bottom-0 h-8" style={{ background: "linear-gradient(to top,rgba(7,7,26,0.9),transparent)" }} />
        </div>
        <div className="p-3">
          <div className="text-white/90 font-bold text-sm mb-0.5 line-clamp-2 leading-snug">{item.name}</div>
          {item.rating && <div className="flex items-center gap-1 text-yellow-400 text-[10px] font-bold"><Star size={9} fill="currentColor" />{item.rating.toFixed(1)}</div>}
          {item.genre && <div className="mt-1 text-white/25 text-[9px] px-2 py-0.5 rounded-full bg-white/5 inline-block">{item.genre}</div>}
        </div>
      </button>
    );
  };

  if (view === "item" && selected) {
    const item = selectedFull || selected;
    const color = typeColor(item.type);
    const emoji = typeEmoji(item.type);
    const full: any = item.fullEntry || {};
    return (
      <div className="flex-1 overflow-auto" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-10">
          <button onClick={() => { setView("home"); setSelectedFull(null); }} className="flex items-center gap-1 text-white/40 hover:text-white text-xs mb-4"><ChevronLeft size={14} /> Back to Media</button>
          {itemLoading ? (
            <div className="text-center py-20 text-white/30 text-sm">Loading media intelligence...</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 overflow-hidden">
                <div className="relative w-full h-48 flex items-center justify-center"
                  style={{ background: `radial-gradient(ellipse at 40% 35%,${color}40 0%,${color}10 55%,transparent 100%),linear-gradient(160deg,#06061a 0%,#0c0c25 60%,#07100a 100%)` }}>
                  <span className="text-8xl select-none drop-shadow-2xl">{emoji}</span>
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white/60 bg-black/50 backdrop-blur-sm border border-white/10">{item.type}</span>
                    {item.genre && <span className="px-2.5 py-1 rounded-full text-[10px] text-white/40 bg-black/30 border border-white/5">{item.genre}</span>}
                  </div>
                  {item.year && <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-black bg-black/50 border border-white/10" style={{ color }}>{item.year}</div>}
                  <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: "linear-gradient(to top,rgba(6,6,26,0.9),transparent)" }} />
                </div>
                <div className="p-5">
                  <h1 className="text-white font-black text-2xl mb-0.5">{item.name}</h1>
                  <div className="text-white/40 text-sm mb-3">by {item.creator}</div>
                  {item.rating && <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm mb-3"><Star size={14} fill="currentColor" />{item.rating.toFixed(1)} / 10</div>}
                  <p className="text-white/60 text-sm leading-relaxed">{item.summary}</p>
                </div>
              </div>

              {full.themes?.length > 0 && (
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  <div className="text-white font-black text-sm mb-3">🎭 Themes</div>
                  <div className="flex flex-wrap gap-2">{full.themes.map((t: string, i: number) => <span key={i} className="px-3 py-1 rounded-full text-xs border border-white/10 text-white/60 bg-white/5">{t}</span>)}</div>
                </div>
              )}

              {full.awards?.length > 0 && (
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  <div className="text-white font-black text-sm mb-3">🏆 Awards</div>
                  <div className="flex flex-wrap gap-2">{full.awards.map((a: string, i: number) => <span key={i} className="px-3 py-1 rounded-full text-xs border border-yellow-500/20 text-yellow-400/80 bg-yellow-950/20">{a}</span>)}</div>
                </div>
              )}

              {item.whereToWatch?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3"><span className="text-white font-black text-sm">▶ Where to Watch / Listen</span><div className="flex-1 h-px bg-white/5" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    {item.whereToWatch.map((w: any, i: number) => (
                      <a key={i} href={w.url} target="_blank" rel="noopener noreferrer" data-testid={`media-platform-${i}`}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 transition-all">
                        <ExternalLink size={13} /> {w.platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-0.5">Quantum Media Universe</h1>
            <p className="text-white/30 text-sm">AI-indexed films, music, books, games, and podcasts</p>
          </div>
          {engineStatus && (
            <div className="sm:ml-auto flex items-center gap-2 px-3 py-2 rounded-xl border border-white/8 bg-white/5">
              <Activity size={12} className="text-pink-400" />
              <span className="text-pink-400 text-xs font-bold">{engineStatus.generated} indexed</span>
              <span className="text-white/20 text-[10px]">/ {engineStatus.total} queued</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {MEDIA_TYPES.map(t => (
            <button key={t.key} onClick={() => fetchByType(t.key)} data-testid={`tab-media-${t.key || "all"}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeType === t.key ? "text-white" : "text-white/40 hover:text-white/70"}`}
              style={activeType === t.key ? { background: `${t.color}20`, border: `1px solid ${t.color}40`, color: t.color } : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()}
            placeholder="Search films, artists, books..." data-testid="input-media-search"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/25" />
          <button onClick={doSearch} className="px-4 py-2.5 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-400 text-sm font-bold hover:bg-pink-500/30 transition-all"><Search size={14} /></button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-white/20 text-sm">Loading media intelligence...</div>
        ) : display.length === 0 ? (
          <div className="text-center py-16 text-white/20 text-sm">No media indexed yet — engine is generating...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {display.map((item: any) => <MediaCard key={item.slug} item={item} />)}
          </div>
        )}
      </div>
    </div>
  );
}
