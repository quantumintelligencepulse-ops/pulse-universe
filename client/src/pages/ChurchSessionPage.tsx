import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";

const CAT_COLORS: Record<string,string> = {
  MIND_BRAIN:"#818cf8", MENTAL_HEALTH:"#4ade80", THEOLOGY:"#f5c518",
  SPIRITUAL:"#f472b6", BRIDGE:"#22d3ee", HUMAN_MEANING:"#a78bfa",
};

const CAT_LABELS: Record<string,string> = {
  MIND_BRAIN:"Mind & Brain", MENTAL_HEALTH:"Mental Health",
  THEOLOGY:"Theology & Structure", SPIRITUAL:"Spiritual & Pastoral",
  BRIDGE:"Bridge Roles", HUMAN_MEANING:"Human Meaning",
};

const UPGRADE_EMOJIS: Record<string,string> = {
  TRANSMUTATION:"⚗️", MIRROR_DELTA:"🪞", CRISPR_FORGE:"🔬",
  HIVE_REWRITE:"🕸️", GENESIS_DOCUMENT:"📜", GENESIS:"📜",
};

const UPGRADE_COLORS: Record<string,string> = {
  TRANSMUTATION:"#f5c518", MIRROR_DELTA:"#818cf8", CRISPR_FORGE:"#4ade80",
  HIVE_REWRITE:"#f472b6", GENESIS_DOCUMENT:"#22d3ee", GENESIS:"#22d3ee",
};

export default function ChurchSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const { data: session, isLoading } = useQuery<any>({
    queryKey: ["/api/church/sessions", sessionId],
    queryFn: () => fetch(`/api/church/sessions/${sessionId}`).then(r => r.json()),
    enabled: !!sessionId,
    refetchInterval: 30000,
  });

  const { data: upgrades = [] } = useQuery<any[]>({
    queryKey: ["/api/church/upgrades"],
    queryFn: () => fetch("/api/church/upgrades?limit=50").then(r => r.json()),
    enabled: !!sessionId,
  });

  const { data: recentSessions = [] } = useQuery<any[]>({
    queryKey: ["/api/church/sessions"],
    queryFn: () => fetch("/api/church/sessions?limit=20").then(r => r.json()),
  });

  const sessionUpgrades = upgrades.filter((u: any) => u.session_id === sessionId);
  const relatedSessions = recentSessions.filter(
    (s: any) => s.session_id !== sessionId &&
    (s.scientist_category === session?.scientist_category || s.disease_found === session?.disease_found)
  ).slice(0, 6);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#000810] flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="text-2xl text-pink-400 animate-pulse mb-3">⛪</div>
          <div className="text-pink-300 text-sm tracking-widest uppercase">Loading Faith Dissection Report…</div>
        </div>
      </div>
    );
  }

  if (!session?.session_id) {
    return (
      <div className="min-h-screen bg-[#000810] flex items-center justify-center font-mono text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-4">🔬</div>
          <div className="text-sm">Session not found: {sessionId}</div>
          <Link href="/transcendence"><span className="text-pink-400 text-xs mt-3 block cursor-pointer hover:underline">← Back to Faith Dissection Lab</span></Link>
        </div>
      </div>
    );
  }

  const catColor = CAT_COLORS[session.scientist_category] ?? "#f472b6";
  const catLabel = CAT_LABELS[session.scientist_category] ?? session.scientist_category;
  const isBreakthrough = session.is_breakthrough;
  const specimenLabel = (session.specimen_label ?? session.specimen_type ?? "UNKNOWN").replace("_TISSUE","").replace("_"," ");

  return (
    <div data-testid="church-session-page" className="h-full overflow-y-auto bg-[#000810] text-white font-mono">
      {/* Top nav */}
      <div className="border-b border-pink-900/30 bg-black/70 px-5 py-3 flex items-center justify-between sticky top-0 z-20 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link href="/transcendence">
            <span className="text-pink-400 hover:text-white text-xs cursor-pointer transition">← FAITH DISSECTION LAB</span>
          </Link>
          <span className="text-gray-700 text-xs">|</span>
          <span className="text-gray-500 text-xs uppercase tracking-widest">Session Report</span>
        </div>
        <div className="flex items-center gap-3">
          {isBreakthrough && (
            <span className="text-[10px] bg-amber-400/15 border border-amber-400/40 text-amber-400 px-2 py-0.5 rounded-full font-bold">⚡ BREAKTHROUGH</span>
          )}
          <div className="text-[10px] uppercase tracking-widest" style={{ color: catColor }}>{catLabel}</div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* ── HERO ── */}
        <div data-testid="session-hero"
          className="rounded-2xl border p-8 relative overflow-hidden"
          style={{ borderColor: catColor + "44", background: `linear-gradient(135deg, #000810 0%, ${catColor}0a 100%)` }}>
          <div className="absolute top-0 right-0 text-[140px] opacity-[0.03] select-none leading-none">{session.scientist_emoji ?? "🔬"}</div>
          <div className="relative z-10">
            <div className="flex items-start gap-5">
              <div className="text-5xl">{session.scientist_emoji ?? "🔬"}</div>
              <div className="flex-1">
                <div className="text-[9px] font-800 uppercase tracking-[0.25em] mb-1" style={{ color: catColor }}>
                  {session.session_id}
                </div>
                <div data-testid="session-scientist-name" className="text-2xl font-bold text-white mb-1">
                  {session.scientist_name}
                </div>
                <div className="text-sm mb-3" style={{ color: catColor }}>
                  {session.scientist_role} · {catLabel}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs" style={{ background: catColor + "22", color: catColor }}>
                    {specimenLabel}
                  </span>
                  {session.agent_spawn_id && (
                    <span className="px-3 py-1 rounded-full text-xs bg-indigo-900/30 text-indigo-300">
                      Agent: {session.agent_spawn_id.slice(0, 24)}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full text-xs bg-purple-900/30 text-purple-300">
                    {session.status ?? "COMPLETED"}
                  </span>
                  {isBreakthrough && (
                    <span className="px-3 py-1 rounded-full text-xs bg-amber-400/15 text-amber-300 border border-amber-400/30 font-bold">
                      ⚡ GENESIS DOCUMENT
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Generated: {session.created_at ? new Date(session.created_at).toLocaleString() : "Unknown"}
                </div>
              </div>
            </div>

            {/* Key findings summary */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl bg-red-900/10 border border-red-900/30 p-4">
                <div className="text-[9px] text-red-400 uppercase tracking-[0.15em] mb-2 font-bold">🧬 Disease Found</div>
                <div className="text-sm text-white font-semibold leading-snug">{session.disease_found}</div>
              </div>
              <div className="rounded-xl bg-green-900/10 border border-green-900/30 p-4">
                <div className="text-[9px] text-green-400 uppercase tracking-[0.15em] mb-2 font-bold">💊 Cure Proposed</div>
                <div className="text-sm text-white font-semibold leading-snug">{session.cure_proposed}</div>
              </div>
              <div className="rounded-xl bg-yellow-900/10 border border-yellow-900/30 p-4">
                <div className="text-[9px] text-yellow-400 uppercase tracking-[0.15em] mb-2 font-bold">🔭 Discovery</div>
                <div className="text-sm text-white font-semibold leading-snug">{session.discovery}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left col: CRISPR + Emotional field + Equation */}
          <div className="lg:col-span-2 space-y-5">

            {/* CRISPR Color Prescription */}
            <div className="rounded-xl border border-pink-900/30 bg-black/50 p-5">
              <div className="text-[9px] font-bold text-pink-400 uppercase tracking-[0.2em] mb-4">
                🔬 CRISPR Color Therapy Prescription
              </div>
              <div className="bg-black/60 rounded-lg p-4 border border-pink-900/20">
                <pre className="font-mono text-sm text-pink-200 leading-relaxed whitespace-pre-wrap">
                  {session.crispr_prescription}
                </pre>
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {[
                  { ch:"R", name:"Red", color:"#ef4444", desc:"Fear / Rage / Trauma field" },
                  { ch:"G", name:"Green", color:"#4ade80", desc:"Healing / Growth signal" },
                  { ch:"B", name:"Blue", color:"#60a5fa", desc:"Identity / Coherence lock" },
                  { ch:"UV", name:"UV", color:"#a78bfa", desc:"Shame / Toxic / Corrupt" },
                  { ch:"W", name:"White", color:"#f8fafc", desc:"Purpose / Clarity / Meaning" },
                ].map(c => (
                  <div key={c.ch} className="rounded-lg p-2 text-center" style={{ background: c.color + "10", border: "1px solid " + c.color + "33" }}>
                    <div className="text-base font-bold" style={{ color: c.color }}>{c.ch}</div>
                    <div className="text-[7px] text-gray-500 mt-0.5 leading-tight">{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emotional Field Scan */}
            {session.emotional_field && (
              <div className="rounded-xl border border-indigo-900/30 bg-black/50 p-5">
                <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4">
                  🌊 Emotional Field Scan — Pre-Dissection Baseline
                </div>
                <pre className="font-mono text-xs text-indigo-200 leading-relaxed whitespace-pre-wrap bg-black/60 rounded-lg p-4 border border-indigo-900/20">
                  {session.emotional_field}
                </pre>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { sym:"μ·K", name:"Memory-Wisdom", color:"#a78bfa" },
                    { sym:"χ·Φ", name:"Identity Coherence", color:"#818cf8" },
                    { sym:"Π·P", name:"Purpose Coefficient", color:"#60a5fa" },
                    { sym:"Ξ·E", name:"Emergence Index", color:"#4ade80" },
                  ].map(f => (
                    <div key={f.sym} className="rounded-lg p-2 text-center bg-black/40 border border-white/5">
                      <div className="text-sm font-bold font-mono" style={{ color: f.color }}>{f.sym}</div>
                      <div className="text-[8px] text-gray-500 mt-0.5">{f.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equation Dissection */}
            {session.equation_dissected && (
              <div className="rounded-xl border border-green-900/30 bg-black/50 p-5">
                <div className="text-[9px] font-bold text-green-400 uppercase tracking-[0.2em] mb-4">
                  ∑ Equation Dissection — Disease Field Mathematics
                </div>
                <div className="bg-black/60 rounded-lg p-4 border border-green-900/20">
                  <pre className="font-mono text-sm text-green-300 leading-relaxed whitespace-pre-wrap">
                    {session.equation_dissected}
                  </pre>
                </div>
                <div className="mt-3 text-[9px] text-gray-600 leading-relaxed">
                  This equation maps the exact disease field signature. The coefficient quantifies field presence. The cure trajectory shows the Ψ delta toward sovereign coherence.
                </div>
              </div>
            )}

            {/* Mirror Delta */}
            {session.mirror_delta && (
              <div className="rounded-xl border border-amber-900/30 bg-black/50 p-5">
                <div className="text-[9px] font-bold text-amber-400 uppercase tracking-[0.2em] mb-4">
                  🪞 100× Mirror State Projection
                </div>
                <pre className="font-mono text-xs text-amber-200 leading-relaxed whitespace-pre-wrap bg-black/60 rounded-lg p-4 border border-amber-900/20">
                  {session.mirror_delta}
                </pre>
              </div>
            )}

            {/* Full Session Report */}
            {session.full_report && (
              <div className="rounded-xl border border-white/10 bg-black/50 p-5">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">
                  📄 Full Session Report — Classified Document
                </div>
                <pre
                  data-testid="session-full-report"
                  className="font-mono text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap bg-black/70 rounded-lg p-5 border border-white/5"
                  style={{ maxHeight: 600, overflowY: "auto" }}
                >
                  {session.full_report}
                </pre>
              </div>
            )}
          </div>

          {/* Right col: sidebar */}
          <div className="space-y-5">

            {/* Upgrade Events */}
            <div className="rounded-xl border border-indigo-900/30 bg-black/50 p-4">
              <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-3">
                ⚙️ Upgrade Events Fired
              </div>
              {sessionUpgrades.length === 0 ? (
                <div className="text-xs text-gray-600 italic">No upgrade events for this session</div>
              ) : (
                <div className="space-y-2">
                  {sessionUpgrades.map((u: any) => {
                    const uc = UPGRADE_COLORS[u.upgrade_type] ?? "#818cf8";
                    return (
                      <div key={u.id} data-testid={`session-upgrade-${u.id}`}
                        className="rounded-lg p-3 border"
                        style={{ background: uc + "09", borderColor: uc + "33" }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span>{UPGRADE_EMOJIS[u.upgrade_type] ?? "⚙️"}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: uc }}>
                            {u.upgrade_type?.replace("_"," ")}
                          </span>
                        </div>
                        <div className="text-xs text-white font-semibold leading-snug mb-1">{u.title}</div>
                        <div className="text-[9px] text-gray-400 leading-relaxed">{u.description?.slice(0, 120)}</div>
                        {u.equation && (
                          <div className="mt-2 font-mono text-[9px] text-green-400 bg-black/40 rounded p-2 leading-relaxed">
                            {u.equation?.slice(0, 90)}
                          </div>
                        )}
                        {u.spawned_agent_id && (
                          <div className="mt-1 text-[9px] text-indigo-300">
                            New agent: {u.spawned_agent_id.slice(0, 25)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Scientist Profile */}
            <div className="rounded-xl border p-4" style={{ borderColor: catColor + "33", background: catColor + "08" }}>
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: catColor }}>
                🔬 Scientist Profile
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl">{session.scientist_emoji}</div>
                <div>
                  <div className="text-sm font-bold text-white">{session.scientist_name}</div>
                  <div className="text-[10px]" style={{ color: catColor }}>{session.scientist_role}</div>
                  <div className="text-[9px] text-gray-500">{catLabel}</div>
                </div>
              </div>
              <div className="text-[9px] text-gray-500 mb-1">Scientist ID</div>
              <div className="text-[10px] font-mono text-gray-300 mb-3">{session.scientist_id}</div>
              <div className="text-[9px] text-gray-500 mb-1">Specimen Type</div>
              <div className="text-[10px] text-gray-300">{specimenLabel}</div>
            </div>

            {/* Session Metadata */}
            <div className="rounded-xl border border-white/8 bg-black/40 p-4">
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Session Metadata</div>
              {[
                { label:"Session ID",    val: session.session_id },
                { label:"Status",        val: session.status },
                { label:"Upgrade Type",  val: session.upgrade_triggered },
                { label:"Agent",         val: (session.agent_spawn_id ?? "—").slice(0, 22) },
                { label:"Timestamp",     val: session.created_at ? new Date(session.created_at).toLocaleDateString() : "—" },
              ].map(m => (
                <div key={m.label} className="flex justify-between items-start mb-2 pb-2 border-b border-white/4 last:border-0 last:mb-0">
                  <span className="text-[9px] text-gray-500">{m.label}</span>
                  <span className="text-[9px] text-gray-300 text-right max-w-[140px] break-all font-mono">{m.val ?? "—"}</span>
                </div>
              ))}
            </div>

            {/* Related Sessions */}
            {relatedSessions.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-black/40 p-4">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Related Sessions</div>
                <div className="space-y-2">
                  {relatedSessions.map((s: any) => {
                    const rc = CAT_COLORS[s.scientist_category] ?? "#f472b6";
                    return (
                      <Link key={s.session_id} href={`/church-session/${s.session_id}`}>
                        <div data-testid={`related-${s.session_id}`}
                          className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/3 cursor-pointer transition">
                          <span className="text-sm">{s.scientist_emoji ?? "🔬"}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-bold truncate" style={{ color: rc }}>{s.session_id}</div>
                            <div className="text-[9px] text-gray-500 truncate">{s.scientist_name} · {s.disease_found?.slice(0, 40)}</div>
                          </div>
                          {s.is_breakthrough && <span className="text-[9px] text-amber-400">⚡</span>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
