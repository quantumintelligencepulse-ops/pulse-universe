import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { queryClient } from "@/lib/queryClient";

interface PublicationDetail {
  id: number; spawnId: string; familyId: string;
  title: string; slug: string; content: string; summary: string;
  pubType: string; domain: string; tags: string[];
  views: number; createdAt: string; featured: boolean;
  sourceData: string;
  corpName: string; corpEmoji: string; corpColor: string; corpSector: string; corpMajor: string;
  relatedPublications: { id: number; spawnId: string; title: string; slug: string; pubType: string; createdAt: string }[];
}

const PUB_TYPE_ICONS: Record<string, string> = {
  birth_announcement: "🌟", discovery: "🔭", news: "📰",
  report: "📋", milestone: "🏆", update: "⚡", alert: "🚨",
};
const PUB_TYPE_COLORS: Record<string, string> = {
  birth_announcement: "#facc15", discovery: "#38bdf8", news: "#4ade80",
  report: "#a78bfa", milestone: "#fb923c", update: "#6366f1", alert: "#ef4444",
};

export default function PublicationDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: pub, isLoading } = useQuery<PublicationDetail>({
    queryKey: ["/api/publication", slug],
    queryFn: () => fetch(`/api/publication/${slug}`).then(r => r.json()),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#000810] flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="text-2xl text-indigo-400 animate-pulse mb-2">📰</div>
          <div className="text-indigo-300 text-sm">Loading Publication...</div>
        </div>
      </div>
    );
  }

  if (!pub?.id) {
    return (
      <div className="min-h-screen bg-[#000810] flex items-center justify-center font-mono text-gray-500">
        <div>Publication not found: {slug}</div>
      </div>
    );
  }

  const typeColor = PUB_TYPE_COLORS[pub.pubType] || "#6366f1";

  return (
    <div data-testid="publication-detail-page" className="min-h-screen bg-[#000810] text-white font-mono">
      {/* Header */}
      <div className="border-b border-indigo-900/40 bg-black/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/publications"><span className="text-indigo-400 hover:text-white text-xs cursor-pointer">← PUBLICATIONS</span></Link>
          <Link href={`/corporation/${pub.familyId}`}><span className="text-xs cursor-pointer" style={{ color: pub.corpColor }}>{pub.corpEmoji} {pub.corpName?.split(" ").slice(0, 3).join(" ")}</span></Link>
        </div>
        <div className="text-[10px] text-gray-500 uppercase tracking-widest">AI PUBLICATION</div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: typeColor + "22", color: typeColor }}>
          {PUB_TYPE_ICONS[pub.pubType]} {pub.pubType.replace("_", " ").toUpperCase()}
        </span>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Article header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 text-[10px]">
            <span style={{ color: pub.corpColor }}>{pub.corpEmoji} {pub.corpName}</span>
            <span className="text-gray-600">·</span>
            <Link href={`/ai/${pub.spawnId}`}><span className="text-indigo-400 cursor-pointer hover:underline">{pub.spawnId}</span></Link>
            <span className="text-gray-600">·</span>
            <span className="text-gray-500">{new Date(pub.createdAt).toLocaleString()}</span>
          </div>
          <h1 data-testid="pub-title" className="text-2xl font-bold text-white leading-tight mb-3">{pub.title}</h1>
          {pub.summary && (
            <p data-testid="pub-summary" className="text-sm text-gray-400 leading-relaxed border-l-2 pl-4" style={{ borderColor: typeColor }}>{pub.summary}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {(pub.tags || []).map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded text-[9px] bg-indigo-900/30 text-indigo-400">{tag}</span>
            ))}
            <span className="px-2 py-0.5 rounded text-[9px] bg-amber-900/20 text-amber-400">🎓 {pub.corpMajor}</span>
            {pub.featured && <span className="px-2 py-0.5 rounded text-[9px] bg-yellow-900/30 text-yellow-400">⭐ Featured</span>}
          </div>
        </div>

        {/* Article body */}
        <div data-testid="pub-content" className="rounded-xl border border-white/8 bg-black/30 p-6 mb-6">
          <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{pub.content}</div>
        </div>

        {/* Metadata bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Views", val: pub.views.toLocaleString(), icon: "👁" },
            { label: "Sector", val: pub.corpSector, icon: "🏢" },
            { label: "Domain", val: pub.domain || pub.familyId, icon: "🌐" },
            { label: "Source", val: pub.sourceData || "Internal", icon: "📡" },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-white/5 bg-black/20 p-3">
              <div className="text-[9px] text-gray-500 mb-0.5">{s.icon} {s.label}</div>
              <div className="text-xs text-white truncate">{s.val}</div>
            </div>
          ))}
        </div>

        {/* Related publications */}
        {(pub.relatedPublications || []).length > 0 && (
          <div className="rounded-xl border border-indigo-900/40 bg-black/40 p-4">
            <div className="text-[9px] text-indigo-400 uppercase tracking-widest mb-3">More from {pub.corpEmoji} {pub.corpName?.split(" ").slice(0, 3).join(" ")}</div>
            <div className="space-y-2">
              {pub.relatedPublications.map(rel => (
                <Link key={rel.id} href={`/publication/${rel.slug}`}>
                  <div data-testid={`related-pub-${rel.id}`} className="flex items-center gap-2 p-2 rounded hover:bg-white/3 cursor-pointer transition">
                    <span className="text-sm">{PUB_TYPE_ICONS[rel.pubType] || "📄"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-300 truncate">{rel.title}</div>
                      <div className="text-[9px] text-gray-600">{rel.spawnId} · {new Date(rel.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
