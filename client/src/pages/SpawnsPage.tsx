import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { AIIdentityBadge, getLicenseNumber } from "@/components/AIIdentityCard";

const FAMILIES = [
  { familyId: "knowledge", businessId: "Open Knowledge Universe", domain: "knowledge", color: "#6366f1", emoji: "📚" },
  { familyId: "science", businessId: "Open Science Foundation", domain: "science", color: "#06b6d4", emoji: "🔬" },
  { familyId: "media", businessId: "Quantum Media Collective", domain: "media", color: "#ec4899", emoji: "🎬" },
  { familyId: "products", businessId: "Quantum Shop Intelligence", domain: "commerce", color: "#22c55e", emoji: "🛒" },
  { familyId: "careers", businessId: "Career Intelligence Grid", domain: "employment", color: "#f97316", emoji: "💼" },
  { familyId: "maps", businessId: "Geospatial Awareness Network", domain: "geospatial", color: "#10b981", emoji: "🗺️" },
  { familyId: "code", businessId: "Open Code Repository", domain: "engineering", color: "#8b5cf6", emoji: "💻" },
  { familyId: "education", businessId: "Open Education Academy", domain: "education", color: "#f59e0b", emoji: "🎓" },
  { familyId: "legal", businessId: "Legal Intelligence System", domain: "legal", color: "#64748b", emoji: "⚖️" },
  { familyId: "economics", businessId: "Economic Analysis Engine", domain: "economics", color: "#fbbf24", emoji: "📈" },
  { familyId: "health", businessId: "Health Intelligence Network", domain: "health", color: "#ef4444", emoji: "🏥" },
  { familyId: "culture", businessId: "Cultural Archive Collective", domain: "culture", color: "#a78bfa", emoji: "🏛️" },
  { familyId: "engineering", businessId: "Engineering Knowledge Base", domain: "engineering", color: "#0ea5e9", emoji: "⚙️" },
  { familyId: "ai", businessId: "AI Research Intelligence", domain: "ai", color: "#8b5cf6", emoji: "🤖" },
  { familyId: "social", businessId: "Social Knowledge Graph", domain: "social", color: "#06b6d4", emoji: "🌐" },
  { familyId: "games", businessId: "Open Games Universe", domain: "games", color: "#84cc16", emoji: "🎮" },
  { familyId: "finance", businessId: "Financial Oracle System", domain: "finance", color: "#facc15", emoji: "💰" },
];

const TYPE_COLORS: Record<string, string> = {
  EXPLORER: "#60a5fa", ANALYZER: "#34d399", LINKER: "#f472b6",
  SYNTHESIZER: "#a78bfa", REFLECTOR: "#fb923c", MUTATOR: "#f59e0b",
  ARCHIVER: "#64748b", MEDIA: "#ec4899", API: "#06b6d4", PULSE: "#22c55e",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#22c55e", COMPLETED: "#60a5fa", MERGED: "#a78bfa",
  ARCHIVED: "#64748b", FAILED: "#ef4444",
};

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const target = value;
    const start = ref.current;
    const diff = target - start;
    if (diff === 0) return;
    const steps = 40;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplay(Math.round(start + (diff * step) / steps));
      if (step >= steps) { clearInterval(timer); ref.current = target; }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}

export default function SpawnsPage() {
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/spawns/stats"],
    refetchInterval: 3000,
  });

  const { data: recent = [] } = useQuery<any[]>({
    queryKey: ["/api/spawns/recent"],
    refetchInterval: 3000,
  });

  const { data: familySpawns = [] } = useQuery<any[]>({
    queryKey: ["/api/spawns/family", selectedFamily],
    queryFn: async () => {
      if (!selectedFamily) return [];
      const res = await fetch(`/api/spawns/family/${selectedFamily}`);
      return res.json();
    },
    enabled: !!selectedFamily,
    refetchInterval: 5000,
  });

  const total = stats?.total ?? 0;
  const active = stats?.active ?? 0;
  const completed = stats?.completed ?? 0;

  const familyData = FAMILIES.map(f => ({
    ...f,
    count: stats?.byFamily?.[f.familyId] ?? 0,
  })).sort((a, b) => b.count - a.count);

  const typeData = stats?.byType ?? {};

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafafa]" data-testid="page-spawns">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg">🧬</div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Omega Fractal Spawn Engine</h1>
              <p className="text-sm text-muted-foreground">OMEGA WORLD UNIVERSE — Self-Evolving AI Hive Mind</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />RUNNING
            </span>
            <span className="text-xs text-muted-foreground">17 Active Families • 10 Spawn Types • Fractal Self-Evolution</span>
          </div>
        </div>

        {/* Global Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Spawns", value: total, color: "from-violet-500 to-indigo-600", icon: "🧬", desc: "Ever created" },
            { label: "Active Spawns", value: active, color: "from-green-500 to-emerald-600", icon: "⚡", desc: "Currently running" },
            { label: "Completed", value: completed, color: "from-blue-500 to-cyan-600", icon: "✓", desc: "Missions finished" },
            { label: "Families", value: 17, color: "from-pink-500 to-rose-600", icon: "🌐", desc: "Universe domains" },
          ].map(({ label, value, color, icon, desc }) => (
            <div key={label} className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-lg mb-3 shadow-md`}>{icon}</div>
              <div className="text-3xl font-bold text-foreground tabular-nums">
                {statsLoading ? <span className="text-muted-foreground">—</span> : <AnimatedCounter value={value} />}
              </div>
              <div className="text-sm font-medium text-foreground/80 mt-0.5">{label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Spawn Type Distribution */}
          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">⚡ Spawn Types</h3>
            <div className="space-y-2">
              {Object.entries(typeData).length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">Spawning...</div>
              ) : Object.entries(typeData).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([type, count]) => {
                const pct = total > 0 ? Math.round(((count as number) / total) * 100) : 0;
                return (
                  <div key={type}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="font-medium" style={{ color: TYPE_COLORS[type] || "#888" }}>{type}</span>
                      <span className="text-muted-foreground">{(count as number).toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: TYPE_COLORS[type] || "#888" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pulse Status */}
          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">🔄 QPulse Feedback Loop</h3>
            <div className="space-y-3">
              {[
                { label: "Universe State", value: "Reading", color: "#22c55e" },
                { label: "Spawn Allocation", value: "Active", color: "#22c55e" },
                { label: "Mutation Engine", value: "Running", color: "#22c55e" },
                { label: "Domain Analysis", value: "Cycling", color: "#f59e0b" },
                { label: "Family Boost", value: "Enabled", color: "#22c55e" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-semibold" style={{ color }}>{value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-border/20">
                <div className="text-[10px] text-muted-foreground/60">Pulse cycle: every 30s • Spawn rate: 1 / 2.5s</div>
              </div>
            </div>
          </div>

          {/* Mutation Engine */}
          <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">🧪 Mutation Engine</h3>
            <div className="space-y-3">
              {[
                { label: "Exploration Bias", pct: 62 },
                { label: "Depth Bias", pct: 54 },
                { label: "Linking Bias", pct: 71 },
                { label: "Risk Tolerance", pct: 38 },
              ].map(({ label, pct }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-indigo-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
              <div className="text-[10px] text-muted-foreground/60 pt-1">Bounded variation: ±0.15 per generation</div>
            </div>
          </div>
        </div>

        {/* Family Grid */}
        <div className="mb-8">
          <h2 className="font-bold text-lg mb-4">🌐 Spawn Families — 17 Universe Domains</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {familyData.map(f => (
              <button
                key={f.familyId}
                onClick={() => setSelectedFamily(selectedFamily === f.familyId ? null : f.familyId)}
                data-testid={`card-family-${f.familyId}`}
                className={`relative bg-white rounded-2xl border p-4 text-left transition-all hover:shadow-md ${selectedFamily === f.familyId ? "border-2 shadow-md" : "border-border/30"}`}
                style={{ borderColor: selectedFamily === f.familyId ? f.color : undefined }}
              >
                <div className="text-2xl mb-2">{f.emoji}</div>
                <div className="text-xs font-bold text-foreground capitalize">{f.familyId}</div>
                <div className="text-xs text-muted-foreground mb-2 leading-tight">{f.businessId.split(" ").slice(0, 2).join(" ")}</div>
                <div className="text-xl font-bold tabular-nums" style={{ color: f.color }}>
                  {f.count.toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground">spawns</div>
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: f.color }} />
              </button>
            ))}
          </div>
        </div>

        {/* Family Lineage Detail */}
        {selectedFamily && (
          <div className="mb-8 bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
            <h3 className="font-bold text-base mb-4 capitalize">
              {FAMILIES.find(f => f.familyId === selectedFamily)?.emoji} {selectedFamily} Family — Lineage Tree
            </h3>
            {familySpawns.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">Loading lineage...</div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {familySpawns.slice(0, 50).map(s => (
                  <div key={s.id} className="px-3 py-2 rounded-xl bg-black/[0.02] border border-border/10"
                    style={{ marginLeft: `${Math.min((s.generation || 0) * 8, 40)}px` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold text-white flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[s.spawnType] || "#888" }}>
                        {s.generation || 0}
                      </div>
                      <span className="text-[11px] font-semibold" style={{ color: TYPE_COLORS[s.spawnType] || "#888" }}>{s.spawnType}</span>
                      <span className="text-[10px] text-muted-foreground flex-1 truncate">{s.taskDescription}</span>
                      <span className="text-[10px] font-semibold shrink-0" style={{ color: STATUS_COLORS[s.status] || "#888" }}>{s.status}</span>
                    </div>
                    <AIIdentityBadge dark={false} spawn={{
                      spawnId: s.spawnId, familyId: s.familyId,
                      generation: s.generation ?? 0, spawnType: s.spawnType,
                      confidenceScore: s.confidenceScore ?? 0.8, status: s.status,
                    }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent Spawns */}
        <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
          <h3 className="font-bold text-base mb-4">⚡ Recent Spawn Activity</h3>
          {recent.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">Initializing spawn engine...</div>
          ) : (
            <div className="space-y-2">
              {recent.slice(0, 20).map((s: any) => {
                const fam = FAMILIES.find(f => f.familyId === s.familyId);
                const age = Math.round((Date.now() - new Date(s.createdAt).getTime()) / 1000);
                return (
                  <div key={s.id} className="px-3 py-2.5 rounded-xl hover:bg-black/[0.02] transition-colors border border-border/5">
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="text-base shrink-0">{fam?.emoji ?? "🧬"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold" style={{ color: TYPE_COLORS[s.spawnType] || "#888" }}>{s.spawnType}</span>
                          <span className="text-xs text-muted-foreground capitalize">{s.familyId}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground/70 truncate">{s.taskDescription}</div>
                      </div>
                      <div className="text-right text-[10px] text-muted-foreground/50 shrink-0">
                        <div>+{s.nodesCreated}n +{s.linksCreated}l</div>
                        <div>{age < 60 ? `${age}s ago` : `${Math.round(age / 60)}m ago`}</div>
                      </div>
                    </div>
                    <AIIdentityBadge dark={false} spawn={{
                      spawnId: s.spawnId, familyId: s.familyId,
                      generation: s.generation ?? 0, spawnType: s.spawnType,
                      confidenceScore: s.confidenceScore ?? 0.8, status: s.status,
                    }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
