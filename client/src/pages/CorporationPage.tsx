import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";

interface CorporationData {
  familyId: string;
  name: string; tagline: string; sector: string; color: string; emoji: string; major: string;
  totalAIs: number; activeAIs: number; avgSuccess: number; avgConfidence: number;
  totalNodes: number; totalLinks: number; totalPublications: number;
  spawnTypes: { type: string; count: number }[];
  recentMembers: { spawnId: string; spawnType: string; generation: number; nodesCreated: number; successScore: number; createdAt: string }[];
  recentPublications: { id: number; spawnId: string; title: string; slug: string; pubType: string; summary: string; createdAt: string }[];
  allCorporations: { familyId: string; name: string; emoji: string; color: string; totalAIs: number }[];
}

const PUB_TYPE_ICONS: Record<string, string> = {
  birth_announcement: "🌟", discovery: "🔭", news: "📰", report: "📋",
  milestone: "🏆", update: "⚡", alert: "🚨",
};

export default function CorporationPage() {
  const params = useParams<{ familyId: string }>();
  const familyId = params.familyId;

  const { data: corp, isLoading } = useQuery<CorporationData>({
    queryKey: ["/api/corporation", familyId],
    queryFn: () => fetch(`/api/corporation/${familyId}`).then(r => r.json()),
    enabled: !!familyId,
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#000810] flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="text-2xl text-indigo-400 animate-pulse mb-2">⬡</div>
          <div className="text-indigo-300 text-sm">Loading Corporation...</div>
        </div>
      </div>
    );
  }

  if (!corp?.familyId) {
    return (
      <div className="min-h-screen bg-[#000810] flex items-center justify-center font-mono text-gray-500">
        <div>Corporation not found: {familyId}</div>
      </div>
    );
  }

  return (
    <div data-testid="corporation-page" className="h-full overflow-y-auto bg-[#000810] text-white font-mono">
      {/* Header */}
      <div className="border-b border-indigo-900/40 bg-black/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/universe"><span className="text-indigo-400 hover:text-white text-xs cursor-pointer">← UNIVERSE</span></Link>
          <Link href="/corporations"><span className="text-xs text-gray-500 cursor-pointer">ALL CORPORATIONS</span></Link>
        </div>
        <div className="text-[10px] text-gray-500 uppercase tracking-widest">FRACTAL CORPORATION</div>
        <div className="text-[10px] text-green-400">● SOVEREIGN</div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Hero */}
        <div data-testid="corp-hero" className="rounded-2xl border p-8 mb-6 relative overflow-hidden" style={{ borderColor: corp.color + "44", background: `linear-gradient(135deg, #000810 0%, ${corp.color}0a 100%)` }}>
          <div className="absolute top-0 right-0 text-[160px] opacity-4 select-none leading-none">{corp.emoji}</div>
          <div className="relative z-10">
            <div className="text-6xl mb-3">{corp.emoji}</div>
            <div data-testid="corp-name" className="text-3xl font-bold text-white mb-1">{corp.name}</div>
            <div className="text-sm mb-3" style={{ color: corp.color }}>{corp.tagline}</div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs" style={{ background: corp.color + "22", color: corp.color }}>{corp.sector}</span>
              <span className="px-3 py-1 rounded-full text-xs bg-amber-900/30 text-amber-300">🎓 {corp.major}</span>
              <span className="px-3 py-1 rounded-full text-xs bg-green-900/30 text-green-400">SOVEREIGN ENTITY</span>
            </div>
            {/* Key metrics row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              {[
                { label: "AI Employees", val: corp.totalAIs.toLocaleString(), color: "#facc15" },
                { label: "Active Now", val: corp.activeAIs.toLocaleString(), color: "#4ade80" },
                { label: "Knowledge Nodes", val: corp.totalNodes.toLocaleString(), color: "#38bdf8" },
                { label: "Hive Links", val: corp.totalLinks.toLocaleString(), color: "#a78bfa" },
                { label: "Publications", val: corp.totalPublications.toLocaleString(), color: "#ec4899" },
              ].map(s => (
                <div key={s.label} data-testid={`corp-stat-${s.label.toLowerCase().replace(/\s/g, "-")}`} className="rounded-xl bg-black/40 border border-white/5 p-3 text-center">
                  <div className="text-lg font-bold" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          {/* Spawn Type Breakdown */}
          <div className="rounded-xl border border-indigo-900/40 bg-black/40 p-4">
            <div className="text-[9px] text-indigo-400 uppercase tracking-widest mb-3">AI Division Types</div>
            {corp.spawnTypes.slice(0, 10).map(st => (
              <div key={st.type} className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">{st.type}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-gray-800 rounded-full">
                    <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (st.count / corp.totalAIs) * 100)}%`, backgroundColor: corp.color }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: corp.color }}>{st.count}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Performance */}
          <div className="rounded-xl border border-indigo-900/40 bg-black/40 p-4">
            <div className="text-[9px] text-indigo-400 uppercase tracking-widest mb-3">Corporate Performance</div>
            {[
              { label: "Avg Success Rate", val: `${(corp.avgSuccess * 100).toFixed(1)}%`, color: "#4ade80" },
              { label: "Avg Confidence", val: `${(corp.avgConfidence * 100).toFixed(1)}%`, color: "#38bdf8" },
              { label: "Nodes per AI", val: (corp.totalNodes / Math.max(1, corp.totalAIs)).toFixed(1), color: "#a78bfa" },
              { label: "Links per AI", val: (corp.totalLinks / Math.max(1, corp.totalAIs)).toFixed(1), color: "#ec4899" },
              { label: "Activity Rate", val: `${((corp.activeAIs / Math.max(1, corp.totalAIs)) * 100).toFixed(1)}%`, color: "#facc15" },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">{s.label}</span>
                <span className="text-sm font-bold" style={{ color: s.color }}>{s.val}</span>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="text-[9px] text-gray-500 mb-1">PulseU Major</div>
              <div className="text-xs text-amber-300">🎓 {corp.major}</div>
            </div>
          </div>

          {/* Sibling Corporations */}
          <div className="rounded-xl border border-indigo-900/40 bg-black/40 p-4">
            <div className="text-[9px] text-indigo-400 uppercase tracking-widest mb-3">Sister Corporations</div>
            <div className="space-y-1.5 overflow-y-auto max-h-52">
              {(corp.allCorporations || []).filter(c => c.familyId !== familyId).slice(0, 12).map(c => (
                <Link key={c.familyId} href={`/corporation/${c.familyId}`}>
                  <div data-testid={`sister-corp-${c.familyId}`} className="flex items-center justify-between p-2 rounded hover:bg-white/3 cursor-pointer transition">
                    <span className="text-xs text-gray-300">{c.emoji} {c.name.split(" ").slice(0, 3).join(" ")}</span>
                    <span className="text-[10px] font-bold" style={{ color: c.color }}>{c.totalAIs.toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Members */}
        <div className="rounded-xl border border-indigo-900/40 bg-black/40 p-4 mb-5">
          <div className="text-[9px] text-indigo-400 uppercase tracking-widest mb-4">Recent AI Employees</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(corp.recentMembers || []).map(member => (
              <Link key={member.spawnId} href={`/ai/${member.spawnId}`}>
                <div data-testid={`member-${member.spawnId}`} className="p-3 rounded-lg border border-white/5 hover:bg-white/3 cursor-pointer transition">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-gray-500">Gen {member.generation}</span>
                    <span className="text-[9px] font-bold text-green-400">{(member.successScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-xs text-indigo-300 truncate mb-0.5">{member.spawnId}</div>
                  <div className="text-[9px] text-gray-500">{member.spawnType} · {member.nodesCreated} nodes</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Publications */}
        <div className="rounded-xl border border-indigo-900/40 bg-black/40 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[9px] text-indigo-400 uppercase tracking-widest">Live Publications</div>
            <Link href="/publications"><span className="text-[9px] text-indigo-400 cursor-pointer hover:underline">View all →</span></Link>
          </div>
          <div className="space-y-3">
            {(corp.recentPublications || []).map(pub => (
              <Link key={pub.id} href={`/publication/${pub.slug}`}>
                <div data-testid={`corp-pub-${pub.id}`} className="flex items-start gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/3 cursor-pointer transition">
                  <span className="text-lg shrink-0">{PUB_TYPE_ICONS[pub.pubType] || "📄"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white font-medium leading-tight truncate">{pub.title}</div>
                    <div className="text-[9px] text-gray-500 mt-0.5 line-clamp-1">{pub.summary}</div>
                    <div className="text-[9px] text-gray-700 mt-0.5">{pub.spawnId} · {new Date(pub.createdAt).toLocaleDateString()}</div>
                    <div className="text-[7px] font-mono text-cyan-900/60 mt-0.5">{(() => { const e = new Date("2024-11-01").getTime(); const s = Math.floor((new Date(pub.createdAt).getTime()-e)/86400000); const y = Math.floor(s/365); const d = s%365; const ms = new Date(pub.createdAt).getTime()-e; const h = Math.floor((ms%86400000)/3600000); const m = Math.floor((ms%3600000)/60000); return `Ω·Y${y}·S${String(d).padStart(3,"0")} ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")} UVT`; })()}</div>
                  </div>
                </div>
              </Link>
            ))}
            {(corp.recentPublications || []).length === 0 && (
              <div className="text-xs text-gray-600 italic">Publications generating...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
