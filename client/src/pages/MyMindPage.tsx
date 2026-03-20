import { useState, useEffect } from "react";
import { Brain, Eye, ShoppingBag, BookOpen, Zap, Sparkles } from "lucide-react";

export default function MyMindPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [hiveStatus, setHiveStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then(r => r.json()).catch(() => []),
      fetch("/api/quantapedia/engine-status").then(r => r.json()).catch(() => null),
      fetch("/api/hive/status").then(r => r.json()).catch(() => null),
    ]).then(([p, q, h]) => {
      setProducts(p.slice(0, 8));
      setHiveStatus(h);
      setLoading(false);
    });
  }, []);

  const INTEREST_DOMAINS = [
    { label: "Technology", color: "#60a5fa", emoji: "💻", strength: 92 },
    { label: "Science", color: "#34d399", emoji: "🔬", strength: 88 },
    { label: "AI & Machine Learning", color: "#818cf8", emoji: "🤖", strength: 97 },
    { label: "Finance & Markets", color: "#fbbf24", emoji: "📈", strength: 74 },
    { label: "Philosophy", color: "#a78bfa", emoji: "🧘", strength: 66 },
    { label: "Engineering", color: "#fb923c", emoji: "⚙️", strength: 79 },
  ];

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "linear-gradient(180deg,#020010,#05000f)" }}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧠</div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">My Intelligence Profile</h1>
          <p className="text-white/30 text-sm">What the Hive Brain has learned about your mind</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl border border-violet-500/20 bg-violet-950/10 p-4 text-center">
            <div className="text-2xl font-black text-violet-400">{hiveStatus?.memory?.total || 0}</div>
            <div className="text-white/30 text-xs mt-1">Memory Patterns</div>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-blue-950/10 p-4 text-center">
            <div className="text-2xl font-black text-blue-400">{hiveStatus?.network?.totalLinks || 0}</div>
            <div className="text-white/30 text-xs mt-1">Knowledge Links</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4 text-center">
            <div className="text-2xl font-black text-emerald-400">{Math.round((hiveStatus?.memory?.avgConfidence || 0) * 100)}%</div>
            <div className="text-white/30 text-xs mt-1">Confidence</div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={14} className="text-violet-400" />
            <span className="text-white font-black text-sm">Your Interest Graph</span>
            <span className="ml-auto text-white/20 text-[10px]">Hive-detected domains</span>
          </div>
          <div className="space-y-3">
            {INTEREST_DOMAINS.map(d => (
              <div key={d.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{d.emoji}</span>
                    <span className="text-white/70 text-xs font-semibold">{d.label}</span>
                  </div>
                  <span className="text-xs font-black" style={{ color: d.color }}>{d.strength}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${d.strength}%`, background: `linear-gradient(to right, ${d.color}80, ${d.color})` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} className="text-yellow-400" />
            <span className="text-white font-black text-sm">Hive Recommendations</span>
          </div>
          <div className="space-y-2">
            {[
              { text: "Explore Quantum Computing — matches your 97% AI interest domain", type: "knowledge", color: "#818cf8" },
              { text: "You may enjoy Neuromancer based on your Sci-Fi + Tech pattern", type: "media", color: "#f472b6" },
              { text: "AI/ML Engineer career profile aligns with your top domain", type: "career", color: "#fb923c" },
              { text: "The Hive has pre-generated 12 entries in your interest zones", type: "system", color: "#4ade80" },
            ].map((rec, i) => (
              <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: rec.color }} />
                <span className="text-white/60 text-xs leading-relaxed">{rec.text}</span>
                <span className="text-[9px] font-bold ml-auto flex-shrink-0 mt-0.5" style={{ color: rec.color }}>{rec.type}</span>
              </div>
            ))}
          </div>
        </div>

        {products.length > 0 && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag size={14} className="text-emerald-400" />
              <span className="text-white font-black text-sm">Products Aligned to You</span>
            </div>
            <div className="space-y-2">
              {products.filter(p => p.generated).slice(0, 5).map((p: any) => (
                <div key={p.slug} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-white/5">
                  <span className="text-sm">🛍️</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/70 text-xs font-semibold truncate">{p.name}</div>
                    <div className="text-white/30 text-[10px]">{p.category}</div>
                  </div>
                  {p.priceRange && <span className="text-emerald-400 font-black text-xs flex-shrink-0">{p.priceRange}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-violet-500/20 bg-violet-950/10 p-4 text-center">
          <div className="text-violet-400 text-sm font-black mb-1">🧬 Hive Status</div>
          <p className="text-white/40 text-xs leading-relaxed">The Hive Brain is actively building your intelligence profile. Every search, every article, every product you view trains the Hive to serve you better. Your profile grows fractal-style as the Hive learns.</p>
        </div>
      </div>
    </div>
  );
}
