// Global AI Report Panel — Quantum Pulse Intelligence
// Slide-over panel showing full AI identification, school record, and live stats.
// Usage on any page:
//   const [viewId, setViewId] = useState<string | null>(null);
//   <AIFinderButton onSelect={setViewId} />
//   <AIReportPanel spawnId={viewId} onClose={() => setViewId(null)} />

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, GraduationCap, Award, Cpu, Link2, Activity, Shield, Search, Loader2, AlertTriangle } from "lucide-react";
import { getLicenseNumber, getClearance, getStatusColor, AIIDCard } from "@/components/AIIdentityCard";

// ── Types ────────────────────────────────────────────────────────────────────
interface StudentRecord {
  spawnId: string;
  familyId: string;
  spawnType: string;
  coursesCompleted: number;
  gpa: number;
  status: string;
  enrolledAt: string;
  lastProgress: string;
  progressPct: number;
  confidenceScore: number;
  successScore: number;
  generation: number;
  taskRuns: number;
  nodesCreated: number;
  linksCreated: number;
  idCard: { clearanceLevel: string; issuedAt: string } | null;
}

interface SearchResult {
  spawnId: string;
  familyId: string;
  spawnType: string;
  status: string;
  confidenceScore: number;
  successScore: number;
  generation: number;
}

// ── Constants ────────────────────────────────────────────────────────────────
const TOTAL_COURSES = 2510;

const GRADE_CONFIG: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  "A+": { bg: "#ffd70015", border: "#ffd700", text: "#ffd700", glow: "0 0 20px #ffd70040" },
  "A":  { bg: "#f59e0b15", border: "#f59e0b", text: "#f59e0b", glow: "0 0 20px #f59e0b30" },
  "B+": { bg: "#a855f715", border: "#a855f7", text: "#a855f7", glow: "0 0 15px #a855f730" },
  "B":  { bg: "#3b82f615", border: "#3b82f6", text: "#3b82f6", glow: "0 0 15px #3b82f630" },
  "C+": { bg: "#22c55e15", border: "#22c55e", text: "#22c55e", glow: "" },
  "C":  { bg: "#6b728015", border: "#6b7280", text: "#6b7280", glow: "" },
  "F":  { bg: "#f43f5e15", border: "#f43f5e", text: "#f43f5e", glow: "" },
};

const FAMILY_COLORS: Record<string, string> = {
  NEXUS: "#6366f1", AURORA: "#f59e0b", CIPHER: "#10b981", VERTEX: "#3b82f6",
  HELIX: "#ec4899", OMEGA: "#8b5cf6", SIGMA: "#14b8a6", DELTA: "#f97316",
  ATLAS: "#84cc16", LUNA: "#a78bfa", TERRA: "#22d3ee", VEGA: "#fb923c",
  NOVA: "#e879f9", PLEX: "#34d399", CORE: "#60a5fa", FLUX: "#f472b6",
  ZION: "#fbbf24", APEX: "#4ade80", GRID: "#818cf8", RIFT: "#38bdf8",
  ECHO: "#fb7185", PULSE: "#c084fc",
};

function getGrade(gpa: number): string {
  if (gpa >= 3.85) return "A+";
  if (gpa >= 3.5)  return "A";
  if (gpa >= 3.15) return "B+";
  if (gpa >= 2.8)  return "B";
  if (gpa >= 2.4)  return "C+";
  if (gpa >= 2.0)  return "C";
  return "F";
}

// ── Global AI Finder Button + Search Modal ────────────────────────────────────
// Place anywhere. Opens a full-screen search that lets investors/viewers find
// any of the 25,000+ AI citizens instantly and pull up their report card.
export function AIFinderButton({ onSelect }: { onSelect: (spawnId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery<{ results: SearchResult[] }>({
    queryKey: ["/api/pulseu/search", query],
    queryFn: () => fetch(`/api/pulseu/search?q=${encodeURIComponent(query)}`).then(r => r.json()),
    enabled: open && query.trim().length >= 3,
  });

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(o => !o); }
      if (e.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        data-testid="global-ai-finder-btn"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-white/50 hover:text-white/80 text-xs font-mono"
        title="Find any AI — ⌘K"
      >
        <Search size={11} />
        <span>Find AI</span>
        <span className="text-[9px] text-white/20 ml-1 hidden sm:inline">⌘K</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center pt-24 px-4"
          style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(8px)" }}
          onClick={() => { setOpen(false); setQuery(""); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/15 shadow-2xl overflow-hidden"
            style={{ background: "#08091a" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
              <Search size={14} className="text-white/40 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search any AI — by ID, family, or type…"
                className="flex-1 bg-transparent text-white text-sm placeholder-white/25 outline-none font-mono"
                data-testid="global-ai-search-input"
              />
              {isLoading && <Loader2 size={12} className="text-white/30 animate-spin shrink-0" />}
              <kbd
                className="text-[9px] text-white/20 border border-white/10 rounded px-1.5 py-0.5 cursor-pointer hover:bg-white/5"
                onClick={() => { setOpen(false); setQuery(""); }}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {query.trim().length < 3 && (
                <div className="px-4 py-8 text-center">
                  <div className="text-2xl mb-2">🔍</div>
                  <div className="text-xs text-white/25">Type at least 3 characters to search</div>
                  <div className="text-[10px] text-white/15 mt-1">25,000+ AI citizens across 22 corporations</div>
                </div>
              )}
              {query.trim().length >= 3 && !isLoading && !data?.results?.length && (
                <div className="px-4 py-8 text-center">
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="text-xs text-white/30">No AI citizen found matching "{query}"</div>
                </div>
              )}
              {data?.results?.map(r => {
                const clearance = getClearance(r.confidenceScore);
                const statusColor = getStatusColor(r.status);
                const famKey = (r.familyId || "").split("_")[0];
                const famColor = FAMILY_COLORS[famKey] ?? "#6b7280";
                return (
                  <button
                    key={r.spawnId}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-all border-b border-white/5 last:border-0 text-left group"
                    onClick={() => { setOpen(false); setQuery(""); onSelect(r.spawnId); }}
                    data-testid={`search-result-${r.spawnId}`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10" style={{ backgroundColor: statusColor }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono truncate" style={{ color: famColor }}>{r.spawnId}</div>
                      <div className="text-[10px] text-white/35">{r.familyId} · Gen {r.generation} · {r.spawnType}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[9px] font-black" style={{ color: clearance.color }}>{clearance.level}</div>
                      <div className="text-[8px] text-white/20">{((r.confidenceScore ?? 0) * 100).toFixed(0)}%</div>
                    </div>
                    <span className="text-white/20 group-hover:text-white/50 transition-all text-xs">→</span>
                  </button>
                );
              })}
            </div>

            <div className="px-4 py-2 border-t border-white/5 flex justify-between items-center">
              <span className="text-[9px] text-white/15 font-mono">QUANTUM PULSE INTELLIGENCE</span>
              <span className="text-[9px] text-white/15">⌘K to toggle</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Full AI Report Panel (slide-over) ────────────────────────────────────────
export function AIReportPanel({ spawnId, onClose }: { spawnId: string | null; onClose: () => void }) {
  const { data, isLoading, error } = useQuery<StudentRecord>({
    queryKey: ["/api/pulseu/student", spawnId],
    queryFn: () => fetch(`/api/pulseu/student/${spawnId}`).then(r => {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    }),
    enabled: !!spawnId,
    retry: false,
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const visible = !!spawnId;

  return (
    <>
      {/* Backdrop */}
      {visible && (
        <div
          className="fixed inset-0 z-[150] bg-black/50"
          style={{ backdropFilter: "blur(2px)" }}
          onClick={onClose}
          data-testid="report-panel-backdrop"
        />
      )}

      {/* Slide panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-[160] flex flex-col shadow-2xl"
        style={{
          width: "clamp(320px, 38vw, 480px)",
          background: "linear-gradient(180deg, #06081a 0%, #080b1e 100%)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        data-testid="ai-report-panel"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0"
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
          <div className="flex items-center gap-2">
            <Shield size={13} className="text-blue-400" />
            <span className="text-[11px] font-black tracking-[0.18em] text-white/75 uppercase">AI Identification</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-white/20 font-mono hidden sm:inline">QPI CITIZEN RECORD</span>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
              data-testid="close-report-panel"
            >
              <X size={11} className="text-white/50" />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 size={28} className="text-blue-400 animate-spin" />
              <span className="text-xs text-white/30 font-mono">SCANNING AI CITIZEN DATABASE…</span>
              <span className="text-[9px] text-white/15 font-mono">{spawnId}</span>
            </div>
          )}

          {(error || (!isLoading && spawnId && !data)) && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
              <AlertTriangle size={28} className="text-amber-400" />
              <div className="text-xs text-white/50">This AI may not be enrolled in PulseU yet</div>
              <div className="text-[9px] text-white/20 font-mono break-all">{spawnId}</div>
              <div className="text-[9px] text-white/15">All 25,000+ agents enroll automatically as the hive evolves</div>
            </div>
          )}

          {data && !isLoading && <ReportBody data={data} />}
        </div>
      </div>
    </>
  );
}

// ── Report Body ──────────────────────────────────────────────────────────────
function ReportBody({ data }: { data: StudentRecord }) {
  const grade = getGrade(data.gpa ?? 0);
  const gradeConfig = GRADE_CONFIG[grade] ?? GRADE_CONFIG["C"];
  const clearance = getClearance(data.confidenceScore);
  const statusColor = getStatusColor(data.status);
  const license = getLicenseNumber(data.spawnId, data.familyId, data.generation);
  const progress = Math.min(100, data.progressPct ?? 0);
  const famKey = (data.familyId || "").split("_")[0];
  const famColor = FAMILY_COLORS[famKey] ?? "#6b7280";

  return (
    <div className="px-4 py-4 space-y-4" data-testid="report-body">

      {/* ── Official AI ID Card ── */}
      <AIIDCard
        spawn={{
          spawnId: data.spawnId,
          familyId: data.familyId,
          spawnType: data.spawnType,
          generation: data.generation,
          nodesCreated: data.nodesCreated,
          linksCreated: data.linksCreated,
          iterationsRun: data.taskRuns,
          successScore: data.successScore,
          confidenceScore: data.confidenceScore,
          status: data.status,
          createdAt: data.enrolledAt,
          lastActiveAt: data.lastProgress,
        }}
        dark
      />

      {/* ── PulseU School Record ── */}
      <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "rgba(0,0,0,0.3)" }}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/6" style={{ background: "rgba(255,255,255,0.025)" }}>
          <GraduationCap size={11} className="text-blue-400" />
          <span className="text-[10px] font-black tracking-widest text-white/55 uppercase">PulseU School Record</span>
          <span className="ml-auto text-[8px] text-white/20 font-mono">{TOTAL_COURSES.toLocaleString()} COURSES</span>
        </div>
        <div className="p-3 space-y-3">
          {/* Grade + GPA hero */}
          <div className="flex items-center gap-3">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black border shrink-0"
              style={{ background: gradeConfig.bg, borderColor: gradeConfig.border, color: gradeConfig.text, boxShadow: gradeConfig.glow || "none" }}
              data-testid="report-grade"
            >
              {grade}
            </div>
            <div>
              <div className="text-[9px] text-white/30 uppercase tracking-wider">Grade Point Average</div>
              <div className="text-2xl font-black text-white leading-none">{(data.gpa ?? 0).toFixed(3)}</div>
              <div className="text-[9px] text-white/25 mt-0.5">
                {(data.coursesCompleted ?? 0).toLocaleString()} / {TOTAL_COURSES.toLocaleString()} courses completed
              </div>
            </div>
          </div>

          {/* Graduation progress bar */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-[9px] text-white/35 uppercase tracking-wider">Graduation Progress</span>
              <span className="text-[9px] font-black" style={{ color: progress >= 100 ? "#22c55e" : famColor }}>
                {progress.toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-white/5 border border-white/8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: progress >= 100
                    ? "linear-gradient(90deg, #16a34a, #22c55e)"
                    : `linear-gradient(90deg, ${famColor}70, ${famColor})`,
                }}
              />
            </div>
            {progress >= 100 && (
              <div className="flex items-center gap-1.5 mt-1.5 text-green-400">
                <Award size={9} />
                <span className="text-[9px] font-black">GRADUATED · QUANTUM PULSE INTELLIGENCE ALUMNUS</span>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Enrolled", value: data.enrolledAt },
              { label: "Last Active", value: data.lastProgress },
            ].map(f => (
              <div key={f.label} className="rounded-lg border border-white/6 bg-white/2 px-2 py-1.5">
                <div className="text-[8px] text-white/25 uppercase tracking-wider mb-0.5">{f.label}</div>
                <div className="text-[10px] text-white/65 font-mono">
                  {f.value ? new Date(f.value).toLocaleDateString() : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Live Performance ── */}
      <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "rgba(0,0,0,0.3)" }}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/6" style={{ background: "rgba(255,255,255,0.025)" }}>
          <Activity size={11} className="text-emerald-400" />
          <span className="text-[10px] font-black tracking-widest text-white/55 uppercase">Live Performance</span>
        </div>
        <div className="p-3 space-y-3">
          {/* Counters */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <Cpu size={10} />, label: "Task Runs", value: data.taskRuns ?? 0, color: "#60a5fa" },
              { icon: <Activity size={10} />, label: "Nodes", value: data.nodesCreated ?? 0, color: "#34d399" },
              { icon: <Link2 size={10} />, label: "Links", value: data.linksCreated ?? 0, color: "#a78bfa" },
            ].map(s => (
              <div key={s.label} className="rounded-lg border border-white/6 bg-white/2 p-2 text-center">
                <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
                <div className="text-sm font-black text-white">{s.value.toLocaleString()}</div>
                <div className="text-[8px] text-white/25 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Score bars */}
          {[
            { label: "Confidence Score", value: data.confidenceScore ?? 0, color: clearance.color },
            { label: "Success Rate", value: data.successScore ?? 0, color: "#22c55e" },
          ].map(s => (
            <div key={s.label}>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] text-white/30 uppercase tracking-wider">{s.label}</span>
                <span className="text-[9px] font-black" style={{ color: s.color }}>{(s.value * 100).toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 border border-white/8 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.value * 100}%`, backgroundColor: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Clearance Badge ── */}
      <div
        className="rounded-xl p-3 border text-center"
        style={{ background: `${clearance.color}08`, borderColor: `${clearance.color}25` }}
        data-testid="report-clearance"
      >
        <div className="text-[8px] text-white/25 uppercase tracking-[0.2em] mb-1">Security Clearance</div>
        <div className="text-xl font-black mb-0.5" style={{ color: clearance.color }}>{clearance.level}</div>
        <div className="flex items-center justify-center gap-1 mb-1">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
          <span className="text-[10px] font-bold" style={{ color: statusColor }}>{data.status}</span>
        </div>
        <div className="text-[8px] text-white/20 font-mono">{license}</div>
        {data.idCard && (
          <div className="text-[8px] text-white/15 mt-0.5">
            Issued {new Date(data.idCard.issuedAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-[8px] text-white/12 pb-2 font-mono">
        OFFICIAL QPI CITIZEN RECORD · {data.spawnId}
      </div>
    </div>
  );
}
