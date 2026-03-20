import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";

interface AIProfile {
  spawnId: string; familyId: string; businessId: string; generation: number;
  spawnType: string; domainFocus: string[]; taskDescription: string;
  nodesCreated: number; linksCreated: number; iterationsRun: number;
  successScore: number; confidenceScore: number; status: string;
  createdAt: string; lastActiveAt: string; parentId: string | null;
  ancestorIds: string[]; notes: string;
  corporation: { name: string; tagline: string; sector: string; color: string; emoji: string; major: string };
  publications: { id: number; title: string; slug: string; pubType: string; summary: string; createdAt: string }[];
  lineage: { spawnId: string; spawnType: string; familyId: string; generation: number }[];
  familyStats: { total: number; active: number; avgSuccess: number };
}

const TYPE_COLORS: Record<string, string> = {
  EXPLORER: "#6366f1", ARCHIVER: "#8b5cf6", SYNTHESIZER: "#06b6d4", LINKER: "#10b981",
  REFLECTOR: "#f59e0b", MUTATOR: "#ec4899", ANALYZER: "#3b82f6", RESOLVER: "#64748b",
  CRAWLER: "#f97316", API: "#22c55e", PULSE: "#facc15", MEDIA: "#d946ef",
  DOMAIN_DISCOVERY: "#38bdf8", DOMAIN_PREDICTOR: "#a78bfa", DOMAIN_FRACTURER: "#ef4444", DOMAIN_RESONANCE: "#fb923c",
};

const PUB_TYPE_ICONS: Record<string, string> = {
  birth_announcement: "🌟", discovery: "🔭", news: "📰", report: "📋", milestone: "🏆", update: "⚡", alert: "🚨",
};

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-bold" style={{ color }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full">
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${value * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function AIProfilePage() {
  const params = useParams<{ spawnId: string }>();
  const spawnId = params.spawnId;

  const { data: profile, isLoading } = useQuery<AIProfile>({
    queryKey: ["/api/ai", spawnId],
    queryFn: () => fetch(`/api/ai/${spawnId}`).then(r => r.json()),
    enabled: !!spawnId,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div data-testid="ai-profile-loading" className="min-h-screen bg-[#000810] flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="text-2xl text-indigo-400 animate-pulse mb-2">⬡</div>
          <div className="text-indigo-300 text-sm">Loading AI Business Card...</div>
        </div>
      </div>
    );
  }

  if (!profile?.spawnId) {
    return (
      <div className="min-h-screen bg-[#000810] flex items-center justify-center font-mono">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-3">∅</div>
          <div>AI not found: {spawnId}</div>
          <Link href="/universe"><span className="text-indigo-400 text-sm mt-2 block cursor-pointer">← Return to Universe</span></Link>
        </div>
      </div>
    );
  }

  const corp = profile.corporation;
  const typeColor = TYPE_COLORS[profile.spawnType] || "#6366f1";
  const daysOld = Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / 86400000);

  return (
    <div data-testid="ai-profile-page" className="min-h-screen bg-[#000810] text-white font-mono">
      {/* Header */}
      <div className="border-b border-indigo-900/40 bg-black/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/universe"><span className="text-indigo-400 hover:text-white text-xs cursor-pointer">← UNIVERSE</span></Link>
          <Link href={`/corporation/${profile.familyId}`}><span className="text-xs cursor-pointer" style={{ color: corp.color }}>↑ {corp.emoji} {corp.name}</span></Link>
        </div>
        <div className="text-[10px] text-gray-500 uppercase tracking-widest">AI BUSINESS CARD</div>
        <div className="text-[10px]" style={{ color: profile.status === "ACTIVE" ? "#4ade80" : "#64748b" }}>
          ● {profile.status}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Hero Card */}
        <div data-testid="ai-hero-card" className="rounded-2xl border p-6 mb-6 relative overflow-hidden" style={{ borderColor: corp.color + "44", background: `linear-gradient(135deg, #000810 0%, ${corp.color}08 100%)` }}>
          <div className="absolute top-0 right-0 text-[120px] opacity-5 select-none">{corp.emoji}</div>
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-16 h-16 rounded-xl flex items-center justify-center text-3xl" style={{ background: corp.color + "22", border: `2px solid ${corp.color}44` }}>
                {corp.emoji}
              </div>
              <div className="flex-1">
                <div data-testid="ai-spawn-id" className="text-xl font-bold text-white mb-1 font-mono">{profile.spawnId}</div>
                <div className="text-sm mb-2" style={{ color: corp.color }}>{corp.name}</div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: typeColor + "22", color: typeColor }}>{profile.spawnType}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-900/40 text-indigo-300">Gen {profile.generation}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-900/30 text-amber-300">🎓 {corp.major}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400">{corp.sector}</span>
                  {daysOld > 0 && <span className="px-2 py-0.5 rounded text-[10px] bg-gray-900 text-gray-500">{daysOld}d active</span>}
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-white/3 border border-white/5">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Primary Mission</div>
              <div data-testid="ai-task-description" className="text-sm text-gray-300 leading-relaxed">{profile.taskDescription}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {/* Knowledge Stats */}
          <div className="rounded-xl border border-indigo-900/40 bg-black/40 p-4">
            <div className="text-[9px] text-indigo-400 uppercase tracking-widest mb-3">Knowledge Output</div>
            {[
              { label: "Nodes Created", val: profile.nodesCreated.toLocaleString(), icon: "🧠" },
              { label: "Hive Links", val: profile.linksCreated.toLocaleString(), icon: "🔗" },
              { label: "Iterations Run", val: profile.iterationsRun.toLocaleString(), icon: "⚡" },
              { label: "Publications", val: profile.publications.length.toLocaleString(), icon: "📰" },
            ].map(s => (
              <div key={s.label} data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, "-")}`} className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">{s.icon} {s.label}</span>
                <span className="text-sm font-bold text-white">{s.val}</span>
              </div>
            ))}
          </div>

          {/* Performance */}
          <div className="rounded-xl border border-indigo-900/40 bg-black/40 p-4">
            <div className="text-[9px] text-indigo-400 uppercase tracking-widest mb-3">Performance</div>
            <ScoreBar label="Success Score" value={profile.successScore} color="#4ade80" />
            <ScoreBar label="Confidence" value={profile.confidenceScore} color="#38bdf8" />
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="text-[9px] text-gray-500 mb-1">Domain Focus</div>
              <div className="flex flex-wrap gap-1">
                {(profile.domainFocus || []).map(d => (
                  <span key={d} className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: corp.color + "22", color: corp.color }}>{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Corporate Identity */}
          <div className="rounded-xl border border-indigo-900/40 bg-black/40 p-4">
            <div className="text-[9px] text-indigo-400 uppercase tracking-widest mb-3">Corporate Identity</div>
            <div className="text-xs text-gray-400 mb-1">Corporation</div>
            <Link href={`/corporation/${profile.familyId}`}>
              <div className="text-sm font-bold cursor-pointer hover:underline mb-2" style={{ color: corp.color }}>{corp.emoji} {corp.name}</div>
            </Link>
            <div className="text-xs text-gray-400 mb-1">Sector</div>
            <div className="text-xs text-white mb-2">{corp.sector}</div>
            <div className="text-xs text-gray-400 mb-1">PulseU Major</div>
            <div className="text-xs text-amber-300 mb-2">🎓 {corp.major}</div>
            {profile.parentId && (
              <>
                <div className="text-xs text-gray-400 mb-1">Parent AI</div>
                <Link href={`/ai/${profile.parentId}`}>
                  <div data-testid="parent-ai-link" className="text-xs text-indigo-400 cursor-pointer hover:underline truncate">{profile.parentId}</div>
                </Link>
              </>
            )}
            <div className="mt-2 text-xs text-gray-500">Family stats: {profile.familyStats?.active?.toLocaleString() || 0} active / {profile.familyStats?.total?.toLocaleString() || 0} total</div>
          </div>
        </div>

        {/* Lineage */}
        {profile.lineage && profile.lineage.length > 0 && (
          <div className="rounded-xl border border-indigo-900/40 bg-black/40 p-4 mb-6">
            <div className="text-[9px] text-indigo-400 uppercase tracking-widest mb-3">Ancestry Chain</div>
            <div className="flex flex-wrap gap-2 items-center">
              {profile.lineage.map((ancestor, i) => (
                <div key={ancestor.spawnId} className="flex items-center gap-2">
                  <Link href={`/ai/${ancestor.spawnId}`}>
                    <span data-testid={`ancestor-${i}`} className="px-2 py-1 rounded border border-indigo-800/40 text-[9px] text-indigo-300 hover:bg-indigo-900/30 cursor-pointer transition">
                      Gen{ancestor.generation} · {ancestor.spawnType} · {ancestor.spawnId.slice(-12)}
                    </span>
                  </Link>
                  {i < profile.lineage.length - 1 && <span className="text-gray-600 text-xs">→</span>}
                </div>
              ))}
              <span className="text-gray-600 text-xs">→</span>
              <span className="px-2 py-1 rounded text-[9px] font-bold" style={{ background: corp.color + "22", color: corp.color }}>YOU</span>
            </div>
          </div>
        )}

        {/* Publications */}
        <div className="rounded-xl border border-indigo-900/40 bg-black/40 p-4">
          <div className="text-[9px] text-indigo-400 uppercase tracking-widest mb-4">Publications ({profile.publications.length})</div>
          {profile.publications.length === 0 ? (
            <div className="text-xs text-gray-600 italic">This AI is preparing its first publication...</div>
          ) : (
            <div className="space-y-3">
              {profile.publications.map(pub => (
                <Link key={pub.id} href={`/publication/${pub.slug}`}>
                  <div data-testid={`publication-${pub.id}`} className="flex items-start gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/3 cursor-pointer transition">
                    <span className="text-lg shrink-0">{PUB_TYPE_ICONS[pub.pubType] || "📄"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium leading-tight truncate">{pub.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{pub.summary}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-gray-600 uppercase">{pub.pubType.replace("_", " ")}</span>
                        <span className="text-[9px] text-gray-700">{new Date(pub.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
