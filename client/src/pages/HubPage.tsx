import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useDomainPing, UniversePulseBar } from "@/lib/universeResonance";


const ALL_HUBS = [
  { slug:"quantum-physics",   title:"Quantum Physics",     emoji:"⚛",  color:"#818cf8" },
  { slug:"ai-intelligence",   title:"AI & Intelligence",   emoji:"🧠",  color:"#34d399" },
  { slug:"ai-finance",        title:"AI Finance & Markets",emoji:"📈",  color:"#fbbf24" },
  { slug:"space-cosmology",   title:"Space & Cosmology",   emoji:"🌌",  color:"#a78bfa" },
  { slug:"biotech-genomics",  title:"Biotech & Genomics",  emoji:"🧬",  color:"#f472b6" },
  { slug:"sports-science",    title:"Sports Science",      emoji:"🏃",  color:"#fb923c" },
  { slug:"music-frequency",   title:"Music & Frequency",   emoji:"🎵",  color:"#ec4899" },
  { slug:"engineering-tech",  title:"Engineering & Tech",  emoji:"⚙",  color:"#38bdf8" },
  { slug:"climate-energy",    title:"Climate & Energy",    emoji:"🌍",  color:"#4ade80" },
  { slug:"philosophy-mind",   title:"Philosophy & Mind",   emoji:"🔮",  color:"#c084fc" },
  { slug:"mathematics",       title:"Mathematics",         emoji:"∑",   color:"#67e8f9" },
  { slug:"dark-matter",       title:"Dark Matter & Energy",emoji:"🌑",  color:"#6366f1" },
];

export default function HubPage() {
  const { slug } = useParams<{ slug?: string }>();
  useDomainPing("hub");

  // Hub index — show all hubs
  if (!slug) {
    return (
      <div className="min-h-screen" style={{ background:"#050510" }}>
        <UniversePulseBar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🌐</div>
            <div className="font-black text-3xl text-white mb-2">Pulse Universe Knowledge Hubs</div>
            <div className="text-white/50 text-sm max-w-xl mx-auto">12 topical authority hubs — each powered by specialist AI agents, real-time articles, Quantapedia entries, and publications. The internet's most comprehensive domain intelligence network.</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {ALL_HUBS.map(hub => (
              <Link key={hub.slug} href={`/hub/${hub.slug}`}>
                <div className="rounded-2xl border p-5 cursor-pointer transition-all hover:scale-105" style={{ borderColor:`${hub.color}30`, background:`${hub.color}08` }} data-testid={`hub-card-${hub.slug}`}>
                  <div className="text-3xl mb-2">{hub.emoji}</div>
                  <div className="font-bold text-white text-sm">{hub.title} Hub</div>
                  <div className="text-xs mt-1" style={{ color:hub.color }}>Explore →</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Embeddable widget code section */}
          <div className="mt-10 rounded-2xl border border-indigo-500/20 p-6" style={{ background:"rgba(79,70,229,0.06)" }}>
            <div className="font-bold text-indigo-300 mb-2">🔌 Embed Pulse Universe Live Stats on Your Website</div>
            <div className="text-white/50 text-sm mb-3">Paste this into any webpage to show live Pulse Universe civilization metrics. Every embed is a backlink.</div>
            <div className="rounded-lg bg-black/50 border border-white/10 p-3 font-mono text-xs text-green-300 select-all">
              {`<div id="pulse-universe-widget"></div>\n<script src="${window.location.origin}/embed/widget.js"></script>`}
            </div>
            <div className="text-white/30 text-xs mt-2">Supported: Any HTML page, WordPress, Webflow, Ghost, Squarespace</div>
          </div>
        </div>
      </div>
    );
  }

  // Individual hub page
  const hub = ALL_HUBS.find(h => h.slug === slug);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/hubs", slug],
    queryFn: () => fetch(`/api/hubs/${slug}`).then(r => r.json()),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background:"#050510" }}>
        <div className="text-white/40 text-sm animate-pulse">Loading hub intelligence...</div>
      </div>
    );
  }

  const h = data?.hub || hub;
  const articles = Array.isArray(data?.articles) ? data.articles : [];
  const quantapedia = Array.isArray(data?.quantapedia) ? data.quantapedia : [];
  const publications = Array.isArray(data?.publications) ? data.publications : [];

  if (!h) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:"#050510" }}>
      <div className="text-white/40">Hub not found. <Link href="/hub" className="text-indigo-400">View all hubs →</Link></div>
    </div>
  );

  const color = h.color || "#818cf8";

  return (
    <div className="min-h-screen" style={{ background:"#050510" }}>
      <UniversePulseBar />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="rounded-2xl border p-6" style={{ borderColor:`${color}30`, background:`${color}08` }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-5xl">{h.emoji}</div>
            <div>
              <div className="font-black text-2xl text-white">{h.title} Hub</div>
              <div className="text-white/50 text-sm">Powered by Pulse Hive AI — real-time articles, Quantapedia entries, and publications</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(h.domains || []).map((d: string) => (
              <span key={d} className="text-xs px-2 py-0.5 rounded-full border font-mono" style={{ color, borderColor:`${color}40`, background:`${color}12` }}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label:"Articles", value:articles.length, icon:"📰" },
              { label:"Wiki Entries", value:quantapedia.length, icon:"📚" },
              { label:"Publications", value:publications.length, icon:"📄" },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-white/8 p-3 text-center" style={{ background:"rgba(255,255,255,0.03)" }}>
                <div className="text-lg">{s.icon}</div>
                <div className="font-black text-lg" style={{ color }}>{s.value}</div>
                <div className="text-white/40 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RSS Feed Links */}
        <div className="rounded-xl border border-white/8 p-4 flex flex-wrap gap-3" style={{ background:"rgba(255,255,255,0.02)" }}>
          <div className="text-white/60 text-xs font-bold self-center">📡 RSS FEEDS:</div>
          {[
            { label:"News Feed", url:"/feed/news.xml" },
            { label:"Quantapedia", url:"/feed/quantapedia.xml" },
            { label:"Publications", url:"/feed/publications.xml" },
            { label:"Research", url:"/feed/research.xml" },
          ].map(f => (
            <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer"
               className="text-xs px-3 py-1 rounded-full border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-colors" data-testid={`rss-${f.label.replace(/\s/g,"-").toLowerCase()}`}>
              {f.label} →
            </a>
          ))}
        </div>

        {/* Articles */}
        {articles.length > 0 && (
          <div>
            <div className="font-bold text-white mb-3">📰 Latest Articles</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {articles.map((a: any) => (
                <Link key={a.article_id} href={`/story/${a.slug || a.article_id}`}>
                  <div className="rounded-xl border border-white/8 p-4 cursor-pointer hover:border-white/20 transition-colors" style={{ background:"rgba(255,255,255,0.02)" }} data-testid={`hub-article-${a.article_id}`}>
                    <div className="font-semibold text-sm text-white leading-tight mb-1">{a.seo_title || a.title}</div>
                    <div className="flex gap-2 text-xs text-white/40">
                      <span>{a.category || "News"}</span>
                      <span>·</span>
                      <span>{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quantapedia */}
        {quantapedia.length > 0 && (
          <div>
            <div className="font-bold text-white mb-3">📚 Quantapedia Entries</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {quantapedia.map((q: any) => (
                <Link key={q.id} href={`/wiki/${q.slug || q.id}`}>
                  <div className="rounded-xl border border-white/8 p-3 cursor-pointer hover:border-white/20 transition-colors" style={{ background:"rgba(255,255,255,0.02)" }} data-testid={`hub-wiki-${q.id}`}>
                    <div className="font-semibold text-xs text-white mb-1">{q.title}</div>
                    <div className="text-white/40 text-xs">{q.type || "Knowledge"}</div>
                    {q.summary && <div className="text-white/30 text-xs mt-1 line-clamp-2">{q.summary}</div>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Publications */}
        {publications.length > 0 && (
          <div>
            <div className="font-bold text-white mb-3">📄 AI Publications</div>
            <div className="space-y-2">
              {publications.slice(0, 8).map((p: any) => (
                <div key={p.id} className="rounded-xl border border-white/8 p-3" style={{ background:"rgba(255,255,255,0.02)" }}>
                  <div className="font-semibold text-xs text-white">{p.title}</div>
                  <div className="text-white/40 text-xs mt-0.5">{p.pub_type || "Publication"} · {p.domain}</div>
                  {p.content && <div className="text-white/30 text-xs mt-1 line-clamp-2">{p.content.slice(0, 120)}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {articles.length === 0 && quantapedia.length === 0 && (
          <div className="text-center py-10 text-white/40 text-sm">Your hive is generating content for this hub — check back soon.</div>
        )}

        {/* Back to all hubs */}
        <div className="text-center">
          <Link href="/hub" className="text-indigo-400 text-sm hover:text-indigo-300">← All Knowledge Hubs</Link>
        </div>
      </div>
    </div>
  );
}
