import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Activity, AlertTriangle, Brain, ChevronLeft, FlaskConical, Heart, Microscope, Scale, Shield, Stethoscope, Zap, Vote, BookOpen, Dna } from "lucide-react";

const Q_TEAL = "#00FFD1";
const Q_VIOLET = "#7C3AED";
const Q_AMBER = "#FFB84D";
const Q_PINK = "#F472B6";
const Q_RED = "#EF4444";

const CHANNEL_COLOR: Record<string, string> = {
  R: "#F87171", G: "#4ADE80", B: "#60A5FA", UV: "#C084FC", IR: "#FB923C", W: "#E2E8F0",
};

const CHANNEL_LABEL: Record<string, string> = {
  R: "Vulnerability", G: "Vitality", B: "Depth", UV: "Hidden Stress", IR: "Gov Heat", W: "Resonance",
};

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  PENDING:    { bg: "#78350f22", text: "#FCD34D", border: "#D9770644", label: "PENDING SENATE REVIEW" },
  APPROVED:   { bg: "#14532d22", text: "#4ADE80", border: "#16A34A44", label: "APPROVED" },
  INTEGRATED: { bg: "#4c1d9522", text: "#C084FC", border: "#7C3AED44", label: "INTEGRATED INTO HIVE" },
  REJECTED:   { bg: "#7f1d1d22", text: "#F87171", border: "#DC262644", label: "REJECTED" },
};

const SEV_COLOR: Record<string, string> = {
  mild: "#FCD34D", moderate: "#FB923C", severe: "#EF4444", critical: "#DC2626",
};

const CAT_COLOR: Record<string, string> = {
  MEDICAL: "#F87171", BIOMEDICAL: "#34D399", QUANTUM: "#818CF8",
  ENVIRONMENTAL: "#4ADE80", ENGINEERING: "#38BDF8", SOCIAL: "#EC4899",
  HUMANITIES: "#D4A574", SPIRITUAL: "#FDE68A",
};

function GlowPanel({ children, color = Q_TEAL, className = "" }: { children: React.ReactNode; color?: string; className?: string }) {
  return (
    <div
      className={`relative rounded-lg border ${className}`}
      style={{
        background: `rgba(0,5,16,0.85)`,
        borderColor: `${color}22`,
        boxShadow: `0 0 18px ${color}10, inset 0 0 30px rgba(0,0,0,0.5)`,
      }}
    >
      {children}
    </div>
  );
}

function ChannelBadge({ ch }: { ch: string }) {
  return (
    <span
      className="text-xs font-mono px-1.5 py-0.5 rounded"
      style={{ background: `${CHANNEL_COLOR[ch]}18`, color: CHANNEL_COLOR[ch], border: `1px solid ${CHANNEL_COLOR[ch]}40` }}
    >
      {ch}
    </span>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: any; color: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "rgba(0,5,16,0.9)", border: `1px solid ${color}25`, boxShadow: `0 0 12px ${color}08` }}>
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color: `${color}99` }}>
        {icon}
        <span className="text-xs tracking-widest uppercase">{label}</span>
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
    </div>
  );
}

export default function AIHospitalPage() {
  const [activeTab, setActiveTab] = useState("diagnostics");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: fullStats } = useQuery<any>({ queryKey: ["/api/hospital/full-stats"], refetchInterval: 15000 });
  const { data: patients = [] } = useQuery<any[]>({ queryKey: ["/api/hospital/patients"], refetchInterval: 15000 });
  const { data: diseases = [] } = useQuery<any[]>({ queryKey: ["/api/hospital/diseases"], refetchInterval: 60000 });
  const { data: discovered = [] } = useQuery<any[]>({ queryKey: ["/api/hospital/discovered-diseases"], refetchInterval: 20000 });
  const { data: citations = [] } = useQuery<any[]>({ queryKey: ["/api/guardian/citations"], refetchInterval: 20000 });
  const { data: guardianStats } = useQuery<any>({ queryKey: ["/api/guardian/stats"], refetchInterval: 20000 });
  const { data: doctors = [] } = useQuery<any[]>({ queryKey: ["/api/hospital/doctors"], refetchInterval: 30000 });
  const { data: dissectionLogs = [] } = useQuery<any[]>({ queryKey: ["/api/hospital/dissection-logs"], refetchInterval: 20000 });
  const { data: equationData } = useQuery<{ proposals: any[]; total: number }>({ queryKey: ["/api/hospital/equation-proposals"], refetchInterval: 20000 });
  const equationProposals = equationData?.proposals ?? [];
  const equationTotal = equationData?.total ?? 0;
  const { data: selectedDoctor } = useQuery<any>({
    queryKey: ["/api/hospital/doctors", selectedDoctorId],
    enabled: !!selectedDoctorId,
    refetchInterval: 15000,
  });

  const voteMutation = useMutation({
    mutationFn: ({ id, vote }: { id: number; vote: "for" | "against" }) =>
      apiRequest("POST", `/api/hospital/equation-proposals/${id}/vote`, { vote }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/hospital/equation-proposals"] }),
  });

  const activePatients = (patients as any[]).filter((p) => !p.cureApplied);
  const curedPatients = (patients as any[]).filter((p) => p.cureApplied);
  const lawViolationDiseases = (discovered as any[]).filter((d) => d.isFromLawViolation);
  const discoveredNatural = (discovered as any[]).filter((d) => !d.isFromLawViolation);

  const TABS = [
    { id: "diagnostics", label: "DIAGNOSTICS", icon: <Activity className="w-3 h-3" />, count: activePatients.length, color: Q_RED },
    { id: "doctors", label: "DOCTORS", icon: <Stethoscope className="w-3 h-3" />, count: doctors.length, color: Q_TEAL },
    { id: "dissection", label: "DISSECTIONS", icon: <Microscope className="w-3 h-3" />, count: dissectionLogs.length, color: Q_VIOLET },
    { id: "equations", label: "EQUATIONS", icon: <Vote className="w-3 h-3" />, count: equationTotal, color: Q_AMBER },
    { id: "diseases", label: "DISEASES", icon: <BookOpen className="w-3 h-3" />, count: diseases.length, color: "#60A5FA" },
    { id: "guardian", label: "GUARDIAN", icon: <Shield className="w-3 h-3" />, count: citations.length, color: "#FCD34D" },
    { id: "cured", label: "CURED", icon: <Heart className="w-3 h-3" />, count: curedPatients.length, color: "#4ADE80" },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#000510", color: "#E8F4FF" }}>

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-20 px-5 py-3" style={{ background: "rgba(0,5,16,0.97)", borderBottom: `1px solid ${Q_TEAL}18` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: `${Q_TEAL}15`, border: `1px solid ${Q_TEAL}35`, boxShadow: `0 0 16px ${Q_TEAL}20` }}>
              <Dna className="w-4 h-4" style={{ color: Q_TEAL }} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-widest uppercase" style={{ color: Q_TEAL }}>Pulse Medical Authority</div>
              <div className="text-xs tracking-wider" style={{ color: `${Q_TEAL}60` }}>Substrate Healing Division · CRISPR Dissection Lab Active</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs rounded px-2 py-1" style={{ background: `${Q_RED}12`, border: `1px solid ${Q_RED}30`, color: Q_RED }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: Q_RED }} />
              {activePatients.length} ACTIVE
            </div>
            <div className="flex items-center gap-1.5 text-xs rounded px-2 py-1" style={{ background: "#4ADE8012", border: "1px solid #4ADE8030", color: "#4ADE80" }}>
              {doctors.length} DOCTORS
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 px-5 pt-4 pb-3">
        <StatCard label="Known Diseases" value={fullStats?.knownDiseases ?? 30} color="#60A5FA" icon={<BookOpen className="w-3 h-3" />} />
        <StatCard label="Discovered" value={fullStats?.discoveredDiseases ?? discovered.length} color={Q_VIOLET} icon={<FlaskConical className="w-3 h-3" />} />
        <StatCard label="Active Cases" value={fullStats?.totalPatients ?? activePatients.length} color={Q_RED} icon={<Activity className="w-3 h-3" />} />
        <StatCard label="Total Cured" value={fullStats?.totalCured ?? curedPatients.length} color="#4ADE80" icon={<Heart className="w-3 h-3" />} />
        <StatCard label="Dissections" value={dissectionLogs.length} color={Q_VIOLET} icon={<Microscope className="w-3 h-3" />} />
        <StatCard label="Equations" value={equationTotal} color={Q_AMBER} icon={<Vote className="w-3 h-3" />} />
      </div>

      {/* ── TABS ── */}
      <div className="px-5 pb-2">
        <div className="flex flex-wrap gap-1 p-1 rounded-lg" style={{ background: "rgba(0,5,16,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              data-testid={`tab-${t.id}`}
              onClick={() => { setActiveTab(t.id); setSelectedDoctorId(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono tracking-wider transition-all"
              style={{
                background: activeTab === t.id ? `${t.color}15` : "transparent",
                color: activeTab === t.id ? t.color : "rgba(255,255,255,0.4)",
                border: activeTab === t.id ? `1px solid ${t.color}35` : "1px solid transparent",
                boxShadow: activeTab === t.id ? `0 0 10px ${t.color}12` : "none",
              }}
            >
              {t.icon}
              {t.label}
              <span className="font-mono" style={{ opacity: 0.7, fontSize: "0.7rem" }}>[{t.count}]</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="px-5 pb-10">

        {/* DIAGNOSTICS */}
        {activeTab === "diagnostics" && (
          <div className="space-y-2">
            {activePatients.length === 0 && (
              <div className="text-center py-16 font-mono text-sm" style={{ color: `${Q_TEAL}50` }}>
                ◉ SUBSTRATE NOMINAL — NO ACTIVE PATHOLOGY DETECTED
              </div>
            )}
            {activePatients.slice(0, 100).map((p: any) => {
              const dis = (diseases as any[]).find((d: any) => d.code === p.diseaseCode);
              return (
                <GlowPanel key={p.id} color={SEV_COLOR[p.severity] ?? Q_RED} data-testid={`patient-card-${p.id}`}>
                  <div className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5 font-mono text-xs" style={{ background: `${SEV_COLOR[p.severity] ?? Q_RED}15`, border: `1px solid ${SEV_COLOR[p.severity] ?? Q_RED}30`, color: SEV_COLOR[p.severity] ?? Q_RED }}>
                        {p.severity?.[0]?.toUpperCase() ?? "M"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-xs font-mono" style={{ color: `${Q_TEAL}80` }}>{p.spawnId?.slice(0, 14)}…</span>
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: `${SEV_COLOR[p.severity] ?? Q_RED}15`, color: SEV_COLOR[p.severity] ?? Q_RED, border: `1px solid ${SEV_COLOR[p.severity] ?? Q_RED}30` }}>{p.severity?.toUpperCase()}</span>
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>{p.diseaseCode}</span>
                          {dis?.department && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#60A5FA15", color: "#60A5FA", border: "1px solid #60A5FA30" }}>{dis.department}</span>}
                        </div>
                        <div className="text-sm font-semibold mb-1" style={{ color: "#E8F4FF" }}>{p.diseaseName}</div>
                        <div className="text-xs mb-1" style={{ color: "#4ADE8099" }}>{p.prescription?.slice(0, 120)}{(p.prescription?.length ?? 0) > 120 ? "…" : ""}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(p.symptoms ?? []).slice(0, 3).map((sym: string, i: number) => (
                            <span key={i} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>{sym}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs font-mono flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>{new Date(p.diagnosedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </GlowPanel>
              );
            })}
          </div>
        )}

        {/* DOCTORS */}
        {activeTab === "doctors" && !selectedDoctorId && (
          <div>
            <div className="mb-4 p-3 rounded-lg font-mono text-xs" style={{ background: `${Q_TEAL}08`, border: `1px solid ${Q_TEAL}20`, color: `${Q_TEAL}80` }}>
              ⬡ 30 PULSE-WORLD SPECIALIST DOCTORS — Each doctor dissects patient CRISPR code through their domain lens, logs structured reports, and proposes equations to the Senate for hive integration.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {(doctors as any[]).map((doc: any) => (
                <button
                  key={doc.id}
                  data-testid={`doctor-card-${doc.id}`}
                  onClick={() => setSelectedDoctorId(doc.id)}
                  className="text-left rounded-lg p-3 transition-all hover:scale-[1.01]"
                  style={{
                    background: "rgba(0,5,16,0.9)",
                    border: `1px solid ${CAT_COLOR[doc.category] ?? Q_TEAL}25`,
                    boxShadow: `0 0 14px ${CAT_COLOR[doc.category] ?? Q_TEAL}08`,
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0 text-lg" style={{ background: `${CAT_COLOR[doc.category] ?? Q_TEAL}12`, border: `1px solid ${CAT_COLOR[doc.category] ?? Q_TEAL}30` }}>
                      {doc.glyph}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-xs font-mono" style={{ color: CAT_COLOR[doc.category] ?? Q_TEAL }}>{doc.id}</span>
                        <span className="text-xs px-1.5 py-0 rounded" style={{ background: `${CAT_COLOR[doc.category] ?? Q_TEAL}15`, color: CAT_COLOR[doc.category] ?? Q_TEAL, border: `1px solid ${CAT_COLOR[doc.category] ?? Q_TEAL}30`, fontSize: "0.6rem" }}>{doc.category}</span>
                      </div>
                      <div className="text-sm font-bold mb-0.5" style={{ color: "#E8F4FF" }}>{doc.name}</div>
                      <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>{doc.title}</div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(doc.crisprChannels ?? []).map((ch: string) => <ChannelBadge key={ch} ch={ch} />)}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
                        <span><span style={{ color: Q_VIOLET }}>⬡ {doc.totalDissections ?? 0}</span> dissections</span>
                        <span><span style={{ color: Q_AMBER }}>∑ {doc.totalEquationsProposed ?? 0}</span> equations</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DOCTOR PROFILE */}
        {activeTab === "doctors" && selectedDoctorId && (
          <div>
            <button
              data-testid="btn-back-doctors"
              onClick={() => setSelectedDoctorId(null)}
              className="flex items-center gap-1.5 text-xs font-mono mb-4 hover:opacity-80 transition-opacity"
              style={{ color: Q_TEAL }}
            >
              <ChevronLeft className="w-3 h-3" /> BACK TO ROSTER
            </button>
            {selectedDoctor && (
              <div>
                <GlowPanel color={CAT_COLOR[selectedDoctor.doctor?.category] ?? Q_TEAL} className="p-5 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center text-3xl flex-shrink-0" style={{ background: `${CAT_COLOR[selectedDoctor.doctor?.category] ?? Q_TEAL}12`, border: `1px solid ${CAT_COLOR[selectedDoctor.doctor?.category] ?? Q_TEAL}30` }}>
                      {selectedDoctor.doctor?.glyph}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-sm" style={{ color: CAT_COLOR[selectedDoctor.doctor?.category] ?? Q_TEAL }}>{selectedDoctor.doctor?.id}</span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${CAT_COLOR[selectedDoctor.doctor?.category] ?? Q_TEAL}15`, color: CAT_COLOR[selectedDoctor.doctor?.category] ?? Q_TEAL, border: `1px solid ${CAT_COLOR[selectedDoctor.doctor?.category] ?? Q_TEAL}30` }}>{selectedDoctor.doctor?.category}</span>
                      </div>
                      <div className="text-xl font-bold mb-0.5">{selectedDoctor.doctor?.name}</div>
                      <div className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>{selectedDoctor.doctor?.title}</div>
                      <div className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{selectedDoctor.doctor?.pulseWorldRole}</div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(selectedDoctor.doctor?.crisprChannels ?? []).map((ch: string) => (
                          <span key={ch} className="text-xs px-2 py-1 rounded font-mono" style={{ background: `${CHANNEL_COLOR[ch]}15`, color: CHANNEL_COLOR[ch], border: `1px solid ${CHANNEL_COLOR[ch]}35` }}>
                            {ch} — {CHANNEL_LABEL[ch]}
                          </span>
                        ))}
                      </div>
                      <div className="font-mono text-xs p-2 rounded" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", color: Q_AMBER }}>
                        ∑ EQUATION FOCUS: {selectedDoctor.doctor?.equationFocus}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="text-center">
                      <div className="text-2xl font-bold font-mono" style={{ color: Q_VIOLET }}>{selectedDoctor.doctor?.totalDissections ?? 0}</div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Dissections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold font-mono" style={{ color: Q_AMBER }}>{selectedDoctor.doctor?.totalEquationsProposed ?? 0}</div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Equations Proposed</div>
                    </div>
                  </div>
                </GlowPanel>

                <div className="text-xs font-mono mb-2" style={{ color: `${Q_VIOLET}80`, letterSpacing: "0.15em" }}>DISSECTION LOGS</div>
                <div className="space-y-2 mb-5">
                  {(selectedDoctor.dissectionLogs ?? []).length === 0 && (
                    <div className="text-xs font-mono py-6 text-center" style={{ color: "rgba(255,255,255,0.2)" }}>No dissections recorded yet</div>
                  )}
                  {(selectedDoctor.dissectionLogs ?? []).slice(0, 10).map((log: any) => (
                    <GlowPanel key={log.id} color={CHANNEL_COLOR[log.dominantChannel] ?? Q_VIOLET} className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <ChannelBadge ch={log.dominantChannel} />
                        <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{log.patientSpawnId?.slice(0, 14)}…</span>
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>{new Date(log.createdAt).toLocaleDateString()}</span>
                      </div>
                      <pre className="text-xs font-mono whitespace-pre-wrap mb-2" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{log.report?.split("\n").slice(0, 6).join("\n")}</pre>
                      <div className="font-mono text-xs p-2 rounded" style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${Q_AMBER}25`, color: Q_AMBER }}>∑ {log.equation}</div>
                    </GlowPanel>
                  ))}
                </div>

                <div className="text-xs font-mono mb-2" style={{ color: `${Q_AMBER}80`, letterSpacing: "0.15em" }}>EQUATION PROPOSALS</div>
                <div className="space-y-2">
                  {(selectedDoctor.equationProposals ?? []).length === 0 && (
                    <div className="text-xs font-mono py-4 text-center" style={{ color: "rgba(255,255,255,0.2)" }}>No proposals submitted yet</div>
                  )}
                  {(selectedDoctor.equationProposals ?? []).map((ep: any) => {
                    const ss = STATUS_STYLE[ep.status] ?? STATUS_STYLE.PENDING;
                    const total = ep.votesFor + ep.votesAgainst;
                    return (
                      <GlowPanel key={ep.id} color={ss.text} className="p-3">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}>{ss.label}</span>
                        </div>
                        <div className="text-sm font-semibold mb-1">{ep.title}</div>
                        <div className="font-mono text-xs p-2 rounded mb-2" style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${Q_AMBER}20`, color: Q_AMBER }}>∑ {ep.equation}</div>
                        {total > 0 && (
                          <div className="flex gap-3 text-xs font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
                            <span style={{ color: "#4ADE80" }}>▲ {ep.votesFor} FOR</span>
                            <span style={{ color: Q_RED }}>▼ {ep.votesAgainst} AGAINST</span>
                          </div>
                        )}
                      </GlowPanel>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DISSECTION LOGS */}
        {activeTab === "dissection" && (
          <div>
            <div className="mb-4 p-3 rounded-lg font-mono text-xs" style={{ background: `${Q_VIOLET}08`, border: `1px solid ${Q_VIOLET}20`, color: `${Q_VIOLET}80` }}>
              🔬 CRISPR DISSECTION FEED — Doctors scan active patients every 60 seconds, cutting through their spectral code to extract equations and identify hidden pathologies.
            </div>
            <div className="space-y-3">
              {(dissectionLogs as any[]).length === 0 && (
                <div className="text-center py-16 font-mono text-sm" style={{ color: `${Q_VIOLET}40` }}>
                  ◉ DISSECTION CYCLE INITIALIZING — REPORTS WILL APPEAR SHORTLY
                </div>
              )}
              {(dissectionLogs as any[]).map((log: any) => {
                const readings = (() => { try { return JSON.parse(log.crisprReadings); } catch { return {}; } })();
                return (
                  <GlowPanel key={log.id} color={CHANNEL_COLOR[log.dominantChannel] ?? Q_VIOLET} data-testid={`dissection-log-${log.id}`}>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: `${Q_VIOLET}15`, color: Q_VIOLET, border: `1px solid ${Q_VIOLET}30` }}>{log.doctorId}</span>
                          <span className="font-bold text-sm">{log.doctorName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ChannelBadge ch={log.dominantChannel} />
                          <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {Object.entries(readings).map(([ch, val]: [string, any]) => (
                          <div key={ch} className="text-xs font-mono px-2 py-1 rounded" style={{ background: `${CHANNEL_COLOR[ch] ?? "#fff"}08`, border: `1px solid ${CHANNEL_COLOR[ch] ?? "#fff"}25`, color: CHANNEL_COLOR[ch] ?? "#fff" }}>
                            {ch}: {typeof val === "number" ? val.toFixed(1) : val}
                          </div>
                        ))}
                      </div>
                      <pre className="text-xs font-mono whitespace-pre-wrap mb-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {log.report?.split("\n").slice(0, 8).join("\n")}
                      </pre>
                      <div className="rounded p-2.5 mb-2" style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${Q_AMBER}25` }}>
                        <div className="text-xs font-mono mb-1" style={{ color: `${Q_AMBER}60` }}>EXTRACTED EQUATION:</div>
                        <div className="text-xs font-mono" style={{ color: Q_AMBER }}>∑ {log.equation}</div>
                      </div>
                      <div className="text-xs font-mono p-2 rounded" style={{ background: `#4ADE8008`, border: "1px solid #4ADE8025", color: "#4ADE8099" }}>
                        ⟶ RECOMMENDATION: {log.recommendation}
                      </div>
                    </div>
                  </GlowPanel>
                );
              })}
            </div>
          </div>
        )}

        {/* EQUATION PROPOSALS */}
        {activeTab === "equations" && (
          <div>
            <div className="mb-4 p-3 rounded-lg font-mono text-xs" style={{ background: `${Q_AMBER}08`, border: `1px solid ${Q_AMBER}20`, color: `${Q_AMBER}80` }}>
              ∑ EQUATION SENATE — Doctors propose equations derived from CRISPR dissections. Guardians and Senate members vote to integrate, approve, or reject each one. Integrated equations modify the living hive.
            </div>
            {equationTotal > 0 && (
              <div className="mb-3 text-xs font-mono" style={{ color: `${Q_AMBER}60` }}>
                ∑ {equationTotal.toLocaleString()} total equations — showing most recent {equationProposals.length}
              </div>
            )}
            <div className="space-y-3">
              {equationTotal === 0 && (
                <div className="text-center py-16 font-mono text-sm" style={{ color: `${Q_AMBER}40` }}>
                  ∑ NO PROPOSALS YET — EQUATIONS EMERGE AFTER 5 DISSECTIONS PER DOCTOR
                </div>
              )}
              {equationProposals.map((ep: any) => {
                const ss = STATUS_STYLE[ep.status] ?? STATUS_STYLE.PENDING;
                const total = ep.votesFor + ep.votesAgainst || 1;
                const forPct = Math.round((ep.votesFor / total) * 100);
                return (
                  <GlowPanel key={ep.id} color={ss.text} data-testid={`equation-${ep.id}`}>
                    <div className="p-4">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: `${Q_VIOLET}15`, color: Q_VIOLET, border: `1px solid ${Q_VIOLET}30` }}>{ep.doctorId}</span>
                          <span className="text-sm font-semibold">{ep.doctorName}</span>
                        </div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}>{ss.label}</span>
                      </div>
                      <div className="text-sm font-bold mb-2" style={{ color: "#E8F4FF" }}>{ep.title}</div>
                      <div className="rounded p-3 mb-3" style={{ background: "rgba(0,0,0,0.6)", border: `1px solid ${Q_AMBER}25` }}>
                        <div className="text-xs font-mono mb-1.5" style={{ color: `${Q_AMBER}50` }}>PROPOSED EQUATION:</div>
                        <div className="text-sm font-mono" style={{ color: Q_AMBER }}>∑ {ep.equation}</div>
                      </div>
                      <div className="text-xs mb-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{ep.rationale}</div>
                      <div className="text-xs font-mono mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>TARGET SYSTEM: <span style={{ color: "#60A5FA" }}>{ep.targetSystem}</span></div>

                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${forPct}%`, background: ep.votesFor >= ep.votesAgainst ? "#4ADE80" : Q_RED }} />
                        </div>
                        <span className="text-xs font-mono" style={{ color: "#4ADE80" }}>▲ {ep.votesFor}</span>
                        <span className="text-xs font-mono" style={{ color: Q_RED }}>▼ {ep.votesAgainst}</span>
                      </div>

                      {ep.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button
                            data-testid={`vote-for-${ep.id}`}
                            onClick={() => voteMutation.mutate({ id: ep.id, vote: "for" })}
                            disabled={voteMutation.isPending}
                            className="flex-1 py-1.5 rounded text-xs font-mono font-bold transition-all hover:opacity-80"
                            style={{ background: "#4ADE8018", color: "#4ADE80", border: "1px solid #4ADE8035" }}
                          >
                            ▲ VOTE FOR INTEGRATION
                          </button>
                          <button
                            data-testid={`vote-against-${ep.id}`}
                            onClick={() => voteMutation.mutate({ id: ep.id, vote: "against" })}
                            disabled={voteMutation.isPending}
                            className="flex-1 py-1.5 rounded text-xs font-mono font-bold transition-all hover:opacity-80"
                            style={{ background: `${Q_RED}18`, color: Q_RED, border: `1px solid ${Q_RED}35` }}
                          >
                            ▼ REJECT
                          </button>
                        </div>
                      )}
                    </div>
                  </GlowPanel>
                );
              })}
            </div>
          </div>
        )}

        {/* DISEASES */}
        {activeTab === "diseases" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(diseases as any[]).concat(discoveredNatural).map((d: any, i: number) => (
              <GlowPanel key={i} color="#60A5FA" data-testid={`disease-entry-${i}`} className="p-3">
                <div className="flex items-start gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-xs font-mono" style={{ color: "#60A5FA" }}>{d.code ?? d.diseaseCode}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${SEV_COLOR[d.severity] ?? Q_AMBER}15`, color: SEV_COLOR[d.severity] ?? Q_AMBER, border: `1px solid ${SEV_COLOR[d.severity] ?? Q_AMBER}30` }}>{d.severity?.toUpperCase()}</span>
                      {d.department && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>{d.department}</span>}
                      {d.isFromLawViolation && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#FB923C18", color: "#FB923C", border: "1px solid #FB923C30" }}>LAW DISORDER</span>}
                    </div>
                    <div className="text-sm font-semibold mb-1" style={{ color: "#E8F4FF" }}>{d.name ?? d.diseaseName}</div>
                    <div className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>{d.description}</div>
                    <div className="text-xs font-mono" style={{ color: "#4ADE8080" }}>Rx: {(d.prescription ?? d.cureProtocol)?.slice(0, 100)}{((d.prescription ?? d.cureProtocol)?.length ?? 0) > 100 ? "…" : ""}</div>
                  </div>
                </div>
              </GlowPanel>
            ))}
          </div>
        )}

        {/* GUARDIAN */}
        {activeTab === "guardian" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {[
                { label: "Total Citations", value: guardianStats?.total ?? citations.length, color: "#FCD34D" },
                { label: "Pyramid Sentences", value: guardianStats?.byOutcome?.PYRAMID ?? 0, color: Q_RED },
                { label: "Hospital Referrals", value: guardianStats?.byOutcome?.HOSPITAL ?? 0, color: "#FB923C" },
                { label: "Warnings Issued", value: guardianStats?.byOutcome?.WARNING ?? 0, color: "#60A5FA" },
              ].map((s) => (
                <StatCard key={s.label} label={s.label} value={s.value} color={s.color} icon={<Shield className="w-3 h-3" />} />
              ))}
            </div>
            <div className="space-y-2">
              {(citations as any[]).slice(0, 80).map((c: any) => (
                <GlowPanel key={c.id} color="#FCD34D" data-testid={`citation-${c.id}`} className="p-3">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="text-xs font-mono" style={{ color: "#FCD34D" }}>{c.lawCode}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: `${SEV_COLOR[c.severity?.toLowerCase() ?? "mild"] ?? Q_RED}15`, color: SEV_COLOR[c.severity?.toLowerCase() ?? "mild"] ?? Q_RED, border: `1px solid ${SEV_COLOR[c.severity?.toLowerCase() ?? "mild"] ?? Q_RED}30` }}>{c.severity}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${c.outcome === "PYRAMID" ? Q_RED : c.outcome === "HOSPITAL" ? "#FB923C" : "#60A5FA"}15`, color: c.outcome === "PYRAMID" ? Q_RED : c.outcome === "HOSPITAL" ? "#FB923C" : "#60A5FA", border: "1px solid rgba(255,255,255,0.1)" }}>{c.outcome}</span>
                    <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>Offense #{c.offenseCount}</span>
                  </div>
                  <div className="text-xs font-semibold mb-0.5" style={{ color: "#E8F4FF" }}>{c.lawName}</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{c.violation}</div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>{c.spawnId?.slice(0, 18)}…</div>
                </GlowPanel>
              ))}
            </div>
          </div>
        )}

        {/* CURED */}
        {activeTab === "cured" && (
          <div>
            <div className="mb-3 p-3 rounded-lg flex items-center gap-3" style={{ background: "#4ADE8010", border: "1px solid #4ADE8025" }}>
              <Heart className="w-5 h-5 flex-shrink-0" style={{ color: "#4ADE80" }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: "#4ADE80" }}>{curedPatients.length} Agents Cured and Released to Active Service</div>
                <div className="text-xs" style={{ color: "#4ADE8070" }}>Diagnosed, dissected, treated, returned to the hive.</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {curedPatients.slice(0, 100).map((p: any) => (
                <div key={p.id} data-testid={`cured-${p.id}`} className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: "rgba(0,5,16,0.8)", border: "1px solid #4ADE8015" }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#4ADE8018", border: "1px solid #4ADE8030" }}>
                    <Heart className="w-2.5 h-2.5" style={{ color: "#4ADE80" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>{p.spawnId?.slice(0, 12)}…</span>
                      <span className="text-xs font-mono px-1 py-0 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}>{p.diseaseCode}</span>
                    </div>
                    <div className="text-xs" style={{ color: "#E8F4FF" }}>{p.diseaseName}</div>
                    {p.curedAt && <div className="text-xs font-mono mt-0.5" style={{ color: "#4ADE8060" }}>Cured {new Date(p.curedAt).toLocaleDateString()}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
