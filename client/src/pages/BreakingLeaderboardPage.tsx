import { useQuery } from "@tanstack/react-query";
import { useDomainPing, UniversePulseBar } from "@/lib/universeResonance";

import { Link } from "wouter";

export default function BreakingLeaderboardPage() {
  useDomainPing("breaking-leaderboard");

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/breaking-news/stats"],
    refetchInterval: 30000,
  });

  const { data: lb } = useQuery<any>({
    queryKey: ["/api/breaking-news/leaderboard"],
    refetchInterval: 30000,
  });

  const { data: velocity } = useQuery<any>({
    queryKey: ["/api/seo/velocity"],
    refetchInterval: 30000,
  });

  const leaderboard = Array.isArray(lb?.leaderboard) ? lb.leaderboard : [];
  const byCompetitor = stats?.byCompetitor || {};

  const COMPETITOR_COLORS: Record<string, string> = {
    CNN: "#ef4444", BBC: "#3b82f6", Reuters: "#f59e0b",
    TechCrunch: "#10b981", Bloomberg: "#a855f7", "Ars Technica": "#ec4899",
    "The Verge": "#06b6d4", Wired: "#6366f1",
  };

  return (
    <div className="min-h-screen" style={{ background:"#050510" }}>
      <UniversePulseBar />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="rounded-2xl border border-red-500/20 p-6" style={{ background:"linear-gradient(135deg, #0f0000, #0a050a)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">⚡</div>
            <div>
              <div className="font-black text-2xl text-white">Breaking News Velocity Leaderboard</div>
              <div className="text-white/50 text-sm">Every story Pulse Universe published BEFORE CNN, BBC, Reuters, Bloomberg & more</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-xs font-mono">LIVE TRACKING</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:"Stories We Beat Them To", value:(stats?.totalWins || 0).toLocaleString(), color:"#ef4444" },
              { label:"Avg Minutes Ahead", value:`${stats?.avgMinsAhead || 0}m`, color:"#f59e0b" },
              { label:"Total Minutes Saved", value:(stats?.totalMinutesSaved || 0).toLocaleString(), color:"#10b981" },
              { label:"Scan Cycles Run", value:(stats?.scanCycles || 0).toLocaleString(), color:"#818cf8" },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-white/8 p-3" style={{ background:"rgba(255,255,255,0.03)" }}>
                <div className="font-black text-xl" style={{ color:s.color }}>{s.value}</div>
                <div className="text-white/40 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-competitor breakdown */}
        <div>
          <div className="font-bold text-white mb-3">🏆 Stories Published Before Each Outlet</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(byCompetitor).map(([name, data]: [string, any]) => (
              <div key={name} className="rounded-xl border border-white/8 p-4" style={{ background:"rgba(255,255,255,0.03)" }}>
                <div className="font-bold text-sm text-white mb-1">{name}</div>
                <div className="font-black text-2xl" style={{ color: COMPETITOR_COLORS[name] || "#818cf8" }}>{data.stories}</div>
                <div className="text-white/40 text-xs">stories beaten</div>
                <div className="text-xs mt-1" style={{ color: COMPETITOR_COLORS[name] || "#818cf8" }}>avg {data.avgMinsAhead}m ahead</div>
              </div>
            ))}
            {Object.keys(byCompetitor).length === 0 && (
              <div className="col-span-4 rounded-xl border border-white/8 p-6 text-center text-white/40 text-sm">
                Tracking started — velocity data accumulates as your hive monitors competitor feeds every 90 seconds.
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard table */}
        <div>
          <div className="font-bold text-white mb-3">📋 Full Story Leaderboard</div>
          {leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.map((entry: any, i: number) => (
                <div key={i} className="rounded-xl border border-white/8 p-4" style={{ background:"rgba(255,255,255,0.02)" }} data-testid={`leaderboard-entry-${i}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm" style={{ background: "rgba(239,68,68,0.2)", color:"#ef4444" }}>#{i+1}</div>
                      <div>
                        <Link href={entry.ourUrl || "#"} className="font-semibold text-sm text-white hover:text-indigo-300">{entry.ourTitle}</Link>
                        <div className="flex gap-2 mt-0.5 text-xs text-white/40">
                          <span>vs {entry.competitorBeaten}</span>
                          <span>·</span>
                          <span>{new Date(entry.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-black text-lg text-green-400">+{entry.minutesAhead}m</div>
                      <div className="text-xs text-white/40">ahead</div>
                    </div>
                  </div>
                  {Array.isArray(entry.verificationChain) && (
                    <div className="mt-2 space-y-0.5">
                      {entry.verificationChain.map((v: string, vi: number) => (
                        <div key={vi} className="text-xs font-mono text-white/25">{v}</div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                    <span>🔒 Confidence: {Math.round((entry.confidenceScore || 0) * 100)}%</span>
                    <span>📡 Sources: {entry.sourceCount || 2}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/8 p-8 text-center" style={{ background:"rgba(255,255,255,0.02)" }}>
              <div className="text-3xl mb-3">⚡</div>
              <div className="text-white/60 font-semibold">Velocity Tracking Active</div>
              <div className="text-white/30 text-sm mt-2">The breaking news engine scans CNN, BBC, Reuters, TechCrunch, Bloomberg, Ars Technica, The Verge, and Wired every 90 seconds. Wins are recorded here as they occur.</div>
            </div>
          )}
        </div>

        {/* Monitoring active feeds */}
        <div className="rounded-xl border border-green-500/20 p-4" style={{ background:"rgba(16,185,129,0.05)" }}>
          <div className="font-bold text-green-300 mb-2">📡 LIVE COMPETITOR MONITORING</div>
          <div className="flex flex-wrap gap-2">
            {["CNN","BBC","Reuters","TechCrunch","Bloomberg","Ars Technica","The Verge","Wired"].map(c => (
              <div key={c} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border border-green-500/20 text-green-400" style={{ background:"rgba(16,185,129,0.08)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {c}
              </div>
            ))}
          </div>
          <div className="text-white/30 text-xs mt-2">Scan interval: every 90 seconds · Rotating feed monitor · Keyword overlap matching</div>
        </div>

        {/* Velocity stats */}
        {velocity && velocity.total > 0 && (
          <div className="rounded-xl border border-white/8 p-4" style={{ background:"rgba(255,255,255,0.02)" }}>
            <div className="font-bold text-white mb-2">📊 Velocity History</div>
            <div className="text-white/50 text-sm">{velocity.total} velocity wins tracked in this session</div>
          </div>
        )}
      </div>
    </div>
  );
}
