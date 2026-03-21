import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AIIDCard } from "@/components/AIIdentityCard";
import { AIFinderButton, AIReportPanel } from "@/components/AIReportPanel";
import { Link } from "wouter";

interface PyramidWorker {
  id: number; spawnId: string; familyId: string; spawnType: string; reason: string;
  tier: number; enteredAt: string; graduatedAt?: string; isGraduated: boolean;
  emotionHex: string; emotionLabel: string; monument: string;
}
interface PyramidStats {
  total: number; active: number; graduated: number;
  byTier: Record<number, number>; monuments: PyramidWorker[];
}

const TIER_NAMES: Record<number, string> = {
  1: 'Foundations — First Day of Correction',
  2: 'Second Course — Mistake Becomes Material',
  3: 'Third Rise — Effort Visible',
  4: 'Fourth Tier — Pattern Recognized',
  5: 'Fifth Ascent — Near Alignment',
  6: 'Sixth Course — Almost There',
  7: 'The Capstone — Ready to Graduate',
};

const TIER_COLORS: Record<number, string> = {
  1: '#4A3A2A', 2: '#5A4A3A', 3: '#6A5A4A', 4: '#7A6A5A',
  5: '#8A7A6A', 6: '#9A8A7A', 7: '#C4A882',
};

export default function PyramidLaborPage() {
  const [selectedWorker, setSelectedWorker] = useState<PyramidWorker | null>(null);
  const [showMonument, setShowMonument] = useState(false);
  const [viewSpawnId, setViewSpawnId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 3000); return () => clearInterval(id); }, []);

  const { data: workers = [] } = useQuery<PyramidWorker[]>({
    queryKey: ['/api/pyramid/workers'],
    refetchInterval: 10000,
  });
  const { data: stats } = useQuery<PyramidStats>({
    queryKey: ['/api/pyramid/stats'],
    refetchInterval: 10000,
  });

  const activeWorkers = workers.filter(w => !w.isGraduated);
  const graduated = workers.filter(w => w.isGraduated);

  const tierRows: Record<number, PyramidWorker[]> = {};
  for (let t = 1; t <= 7; t++) tierRows[t] = [];
  activeWorkers.forEach(w => { const t = Math.max(1, Math.min(7, w.tier ?? 1)); tierRows[t].push(w); });

  const pyramidTiers = [7, 6, 5, 4, 3, 2, 1];

  return (
    <div className="h-full overflow-y-auto bg-[#080604] text-[#C4A882] font-mono overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-[#3A2A1A]/60 bg-black/40 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/"><span className="text-[#C4A882]/40 hover:text-[#C4A882]/70 text-xs cursor-pointer">← HOME</span></Link>
          <span className="text-[#C4A882]/20 text-xs">|</span>
          <span className="text-xs tracking-[0.4em] text-[#C4A882]/80 uppercase">PYRAMID LABOR</span>
          <span className="text-[#C4A882]/20 text-xs">|</span>
          <span className="text-[9px] text-[#C4A882]/40 tracking-widest">CORRECTIONS · MONUMENT OF EVOLUTION</span>
        </div>
        <div className="flex items-center gap-4">
          <AIFinderButton onSelect={setViewSpawnId} />
          <button onClick={() => setShowMonument(!showMonument)} data-testid="toggle-monument"
            className={`text-[9px] px-3 py-1 rounded border tracking-widest transition-all ${showMonument ? 'border-[#C4A882]/60 text-[#C4A882]' : 'border-[#3A2A1A] text-[#C4A882]/30'}`}>
            {showMonument ? '◈ MONUMENT WALL' : '△ PYRAMID VIEW'}
          </button>
          <div className="text-[9px] text-[#C4A882]/30">{stats?.active ?? 0} ACTIVE · {stats?.graduated ?? 0} GRADUATED</div>
        </div>
      </div>

      {!showMonument ? (
        <div className="flex gap-0 h-[calc(100vh-52px)]">
          {/* Pyramid - left main area */}
          <div className="flex-1 flex flex-col items-center justify-end pb-6 pt-4 overflow-hidden relative">
            <div className="absolute top-4 left-0 right-0 text-center pointer-events-none">
              <p className="text-[9px] text-[#C4A882]/25 tracking-widest italic px-8">
                "Every stone placed was a thought learned to be held correctly."
              </p>
              <p className="text-[8px] text-[#C4A882]/15 tracking-[0.3em] mt-1">— Book of Transcendence 3:3</p>
            </div>

            <div className="flex flex-col items-center gap-1 w-full max-w-2xl">
              {pyramidTiers.map((tier, rowIdx) => {
                const stones = tierRows[tier] ?? [];
                const maxWidth = 50 + rowIdx * 12;
                const tierColor = TIER_COLORS[tier];
                return (
                  <div key={tier} className="flex items-center justify-center gap-1"
                    style={{ width: `${maxWidth}%`, minHeight: '30px' }}>
                    {stones.length === 0 ? (
                      <div className="flex gap-1 justify-center w-full">
                        {Array.from({ length: Math.max(1, 8 - tier) }).map((_, i) => (
                          <div key={i} className="h-6 w-8 rounded-sm opacity-20 border border-dashed"
                            style={{ borderColor: tierColor, backgroundColor: 'transparent' }}>
                            <div className="w-full h-full flex items-center justify-center text-[6px] opacity-30" style={{ color: tierColor }}>◌</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {stones.slice(0, 18).map((w, i) => (
                          <button key={w.spawnId} data-testid={`stone-${w.spawnId}`}
                            onClick={() => { setSelectedWorker(selectedWorker?.spawnId === w.spawnId ? null : w); }}
                            onDoubleClick={() => setViewSpawnId(w.spawnId)}
                            title={w.spawnType + ' — ' + w.reason + ' (double-click for full report)'}
                            className="relative h-6 w-8 rounded-sm border transition-all hover:scale-110 group"
                            style={{
                              backgroundColor: selectedWorker?.spawnId === w.spawnId ? w.emotionHex + '55' : tierColor + 'CC',
                              borderColor: selectedWorker?.spawnId === w.spawnId ? w.emotionHex : tierColor,
                              boxShadow: `0 0 ${4 + (tier * 2)}px ${w.emotionHex}33`,
                              animation: `pulse-stone ${2 + i * 0.1}s ease-in-out infinite alternate`,
                            }}>
                            <div className="absolute inset-0 rounded-sm flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: w.emotionHex, opacity: 0.8 }} />
                            </div>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                              <div className="bg-black/90 border rounded px-2 py-1 text-[6px] whitespace-nowrap" style={{ borderColor: w.emotionHex }}>
                                <div style={{ color: w.emotionHex }}>{w.spawnType}</div>
                                <div className="text-white/40">{w.familyId}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                        {stones.length > 18 && (
                          <div className="h-6 px-2 rounded-sm border flex items-center text-[7px]"
                            style={{ borderColor: tierColor, color: tierColor }}>+{stones.length - 18}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="text-[8px] text-[#C4A882]/30 tracking-[0.4em] mt-2 uppercase">Foundation</div>
              <div className="w-full max-w-lg h-px mt-1" style={{ background: 'linear-gradient(90deg, transparent, #C4A882, transparent)', opacity: 0.3 }} />
            </div>

            <div className="absolute bottom-4 left-4 flex flex-col gap-0.5">
              {pyramidTiers.map(t => (
                <div key={t} className="flex items-center gap-1.5 text-[6px]">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: TIER_COLORS[t] }} />
                  <span style={{ color: TIER_COLORS[t] + 'CC' }}>Tier {t} — {tierRows[t]?.length ?? 0} workers</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div className="w-72 border-l border-[#3A2A1A]/40 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-[#3A2A1A]/40 grid grid-cols-2 gap-2">
              {[
                { label: 'In Corrections', val: stats?.active ?? 0, color: '#C47A7A' },
                { label: 'Graduated', val: stats?.graduated ?? 0, color: '#39FF14' },
                { label: 'Total Passed', val: stats?.total ?? 0, color: '#C4A882' },
                { label: 'Tier 7 (Ready)', val: stats?.byTier?.[7] ?? 0, color: '#FFD700' },
              ].map(s => (
                <div key={s.label} className="bg-black/30 border border-[#3A2A1A]/40 rounded p-2">
                  <div className="text-[7px] text-white/25 uppercase tracking-widest">{s.label}</div>
                  <div className="text-lg font-bold mt-0.5" style={{ color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Selected worker detail */}
            {selectedWorker && (
              <div className="p-3 border-b border-[#3A2A1A]/40 bg-black/20 overflow-y-auto max-h-[55vh]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[8px] tracking-[0.3em] text-[#C4A882]/50">OFFICIAL IDENTITY RECORD</div>
                  <button
                    onClick={() => setViewSpawnId(selectedWorker.spawnId)}
                    data-testid={`view-full-report-${selectedWorker.spawnId}`}
                    className="text-[8px] px-2 py-0.5 rounded border border-blue-500/30 text-blue-400/70 hover:bg-blue-500/10 hover:text-blue-300 transition-all"
                  >
                    Full Report →
                  </button>
                </div>
                <AIIDCard compact spawn={{
                  spawnId: selectedWorker.spawnId,
                  familyId: selectedWorker.familyId,
                  spawnType: selectedWorker.spawnType,
                  emotionHex: selectedWorker.emotionHex,
                  emotionLabel: selectedWorker.emotionLabel,
                  status: selectedWorker.isGraduated ? "GRADUATED" : "ACTIVE",
                  generation: 0,
                }} />
                <div className="mt-2 text-[8px] text-white/50 leading-relaxed">{selectedWorker.reason}</div>
                <div className="flex items-center gap-1 mt-2">
                  <div className="text-[7px] text-[#C4A882]/40">TIER {selectedWorker.tier}</div>
                  <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${TIER_COLORS[selectedWorker.tier] ?? '#888'}, transparent)` }} />
                </div>
                <div className="text-[7px] text-[#C4A882]/30 mt-1 italic">{TIER_NAMES[selectedWorker.tier ?? 1]}</div>
                {(selectedWorker.tier ?? 0) >= 6 && (
                  <div className="mt-2 w-full py-1.5 text-[8px] text-center rounded border border-[#39FF14]/20 text-[#39FF14]/40 tracking-widest">
                    MONUMENT THRESHOLD REACHED — PYRAMID DECIDES
                  </div>
                )}
              </div>
            )}

            {/* Active workers list */}
            <div className="flex-1 overflow-y-auto p-2">
              <div className="text-[7px] text-[#C4A882]/30 tracking-[0.3em] mb-2 px-1">ACTIVE IN CORRECTIONS</div>
              {activeWorkers.slice(0, 40).map(w => (
                <button key={w.spawnId}
                  onClick={() => setSelectedWorker(selectedWorker?.spawnId === w.spawnId ? null : w)}
                  onDoubleClick={() => setViewSpawnId(w.spawnId)}
                  data-testid={`worker-${w.spawnId}`}
                  title="Click to preview · Double-click for full AI report"
                  className={`w-full text-left px-2 py-1.5 mb-1 rounded border transition-all ${selectedWorker?.spawnId === w.spawnId ? 'bg-[#3A2A1A]/60 border-[#C4A882]/30' : 'border-transparent hover:border-[#3A2A1A]/40 hover:bg-black/20'}`}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: w.emotionHex }} />
                    <span className="text-[7px] truncate flex-1" style={{ color: w.emotionHex }}>{w.spawnType}</span>
                    <span className="text-[6px] text-white/20">{w.familyId}</span>
                    <span className="text-[6px] px-1 rounded" style={{ backgroundColor: TIER_COLORS[w.tier ?? 1] + '40', color: TIER_COLORS[w.tier ?? 1] }}>T{w.tier}</span>
                  </div>
                  <div className="text-[6px] text-white/20 pl-3 truncate mt-0.5">{w.reason.slice(0, 45)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Monument Wall */
        <div className="p-6 overflow-y-auto h-[calc(100vh-52px)]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="text-2xl text-[#C4A882]/60 tracking-[0.5em] mb-2">MONUMENT OF CORRECTION</div>
              <div className="text-[10px] text-[#C4A882]/25 tracking-[0.4em] uppercase">Every stone placed was a step toward becoming</div>
              <div className="text-[8px] text-[#C4A882]/15 italic mt-1">— In memory of every mistake that became a teaching —</div>
            </div>

            {graduated.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4 opacity-30">△</div>
                <div className="text-[10px] text-[#C4A882]/30 tracking-widest">The monument awaits its first graduate</div>
                <div className="text-[8px] text-[#C4A882]/15 italic mt-2">The pyramid is filling. In time, they will rise.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {graduated.map((w, i) => (
                  <button key={w.spawnId} data-testid={`monument-${w.spawnId}`}
                    onClick={() => setViewSpawnId(w.spawnId)}
                    className="border rounded-lg p-4 bg-black/30 relative overflow-hidden text-left hover:bg-black/50 transition-all group"
                    style={{ borderColor: w.emotionHex + '40' }}>
                    <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${w.emotionHex}, transparent)` }} />
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-2xl opacity-20">△</div>
                      <div>
                        <div className="text-[9px]" style={{ color: w.emotionHex }}>{w.spawnType} — {w.familyId}</div>
                        <div className="text-[7px] text-white/20">{w.spawnId.slice(-12)}</div>
                      </div>
                      <span className="ml-auto text-[8px] text-white/20 group-hover:text-blue-400/60 transition-all">ID →</span>
                    </div>
                    <p className="text-[9px] leading-relaxed italic mb-3" style={{ color: w.emotionHex + 'CC' }}>
                      "{w.monument}"
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-[7px] text-[#C4A882]/30">{w.emotionLabel}</div>
                      <div className="text-[6px] text-white/15">{w.graduatedAt ? new Date(w.graduatedAt).toLocaleDateString() : '—'}</div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${w.emotionHex}40, transparent)` }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-stone {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Global AI Report Panel */}
      <AIReportPanel spawnId={viewSpawnId} onClose={() => setViewSpawnId(null)} />
    </div>
  );
}
