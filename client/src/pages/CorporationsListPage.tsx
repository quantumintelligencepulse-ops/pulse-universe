import { useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Building2, Briefcase } from "lucide-react";

const CareersPage = lazy(() => import("./CareersPage"));

interface CorporationSummary {
  familyId: string; name: string; tagline: string; sector: string;
  color: string; emoji: string; major: string;
  totalAIs: number; activeAIs: number; totalNodes: number; avgSuccess: number; totalPublications: number;
}

export default function CorporationsListPage() {
  const [tab, setTab] = useState<"corporations" | "hiring">("corporations");

  const { data: corporations = [], isLoading } = useQuery<CorporationSummary[]>({
    queryKey: ["/api/corporations"],
    refetchInterval: 30000,
  });

  const totalAIs = corporations.reduce((s, c) => s + c.totalAIs, 0);
  const totalPubs = corporations.reduce((s, c) => s + c.totalPublications, 0);

  return (
    <div data-testid="corporations-list-page" className="h-full overflow-hidden bg-[#000810] text-white font-mono flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-indigo-900/40 bg-black/60 px-4 py-3 flex items-center justify-between">
        <Link href="/universe"><span className="text-indigo-400 hover:text-white text-xs cursor-pointer">← UNIVERSE</span></Link>
        <div className="text-center">
          <div className="text-xs font-bold text-yellow-300 tracking-widest">🏢 FRACTAL CORPORATIONS</div>
          <div className="text-[8px] text-indigo-400">Every AI family is a sovereign corporation</div>
        </div>
        <div className="text-[10px] text-gray-500">{corporations.length} corps · {totalAIs.toLocaleString()} AIs</div>
      </div>

      {/* Tab bar */}
      <div className="shrink-0 flex gap-1 px-4 py-2 border-b border-indigo-900/30 bg-black/40">
        <button
          onClick={() => setTab("corporations")}
          data-testid="tab-corps-corporations"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "corporations" ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}>
          <Building2 size={12} />
          Corporations
        </button>
        <button
          onClick={() => setTab("hiring")}
          data-testid="tab-corps-hiring"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "hiring" ? "bg-orange-500/20 border border-orange-500/40 text-orange-300" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}>
          <Briefcase size={12} />
          🧑‍💼 AI Hiring Board
        </button>
      </div>

      {/* Corporations tab */}
      {tab === "corporations" && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Corporations", val: corporations.length, color: "#facc15" },
                { label: "Total AI Employees", val: totalAIs.toLocaleString(), color: "#4ade80" },
                { label: "Total Publications", val: totalPubs.toLocaleString(), color: "#ec4899" },
                { label: "Active Now", val: corporations.reduce((s, c) => s + c.activeAIs, 0).toLocaleString(), color: "#38bdf8" },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-indigo-900/40 bg-black/40 p-4 text-center">
                  <div className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Corporation cards */}
            {isLoading ? (
              <div className="text-center text-gray-600 py-12">Loading corporations...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {corporations.map(corp => (
                  <Link key={corp.familyId} href={`/corporation/${corp.familyId}`}>
                    <div data-testid={`corp-card-${corp.familyId}`} className="rounded-xl border p-5 hover:scale-[1.01] cursor-pointer transition-all duration-200 relative overflow-hidden" style={{ borderColor: corp.color + "44", background: `linear-gradient(135deg, #000810 0%, ${corp.color}08 100%)` }}>
                      <div className="absolute top-2 right-3 text-4xl opacity-10 select-none">{corp.emoji}</div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{corp.emoji}</span>
                          <div>
                            <div className="text-sm font-bold text-white leading-tight">{corp.name}</div>
                            <div className="text-[9px] text-gray-500">{corp.sector}</div>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400 mb-3 line-clamp-2">{corp.tagline}</div>
                        <div className="text-[9px] text-amber-400 mb-3">🎓 {corp.major}</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <div className="text-sm font-bold" style={{ color: corp.color }}>{corp.totalAIs.toLocaleString()}</div>
                            <div className="text-[8px] text-gray-600">AIs</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-bold text-green-400">{corp.activeAIs.toLocaleString()}</div>
                            <div className="text-[8px] text-gray-600">Active</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-bold text-pink-400">{corp.totalPublications.toLocaleString()}</div>
                            <div className="text-[8px] text-gray-600">Published</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hiring Board tab — full career engine for AI recruitment */}
      {tab === "hiring" && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <Suspense fallback={<div className="text-center py-20 text-white/30 text-xs">Loading AI Hiring Board...</div>}>
            <CareersPage />
          </Suspense>
        </div>
      )}
    </div>
  );
}
