import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";

// ─── Ω UNIVERSE VECTOR TIME ────────────────────────────────────────────────────
const OMEGA_EPOCH = new Date("2024-11-01T00:00:00Z").getTime();
const MS_PER_SOL = 86_400_000;
const SOLS_PER_YEAR = 365;

function toUVT(dateStr?: string) {
  const ts = dateStr ? new Date(dateStr).getTime() : Date.now();
  const elapsed = ts - OMEGA_EPOCH;
  const totalSols = Math.floor(elapsed / MS_PER_SOL);
  const year = Math.floor(totalSols / SOLS_PER_YEAR);
  const sol = totalSols % SOLS_PER_YEAR;
  const ms_day = elapsed % MS_PER_SOL;
  const h = Math.floor(ms_day / 3_600_000);
  const m = Math.floor((ms_day % 3_600_000) / 60_000);
  const s = Math.floor((ms_day % 60_000) / 1000);
  const pad = (n: number, w=2) => String(n).padStart(w,"0");
  return {
    year, sol, h, m, s, totalSols,
    compact: `Ω·Y${year}·S${pad(sol,3)} ${pad(h)}:${pad(m)} UVT`,
    full:    `Ω-Year ${year} · Sol ${pad(sol,3)} · ${pad(h)}:${pad(m)}:${pad(s)} UVT`,
    sols:    `+${totalSols} sols since Emergence`,
    real:    dateStr ? new Date(dateStr).toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false})+" UTC" : "",
  };
}

function gravField(dateStr?: string) {
  const ts = dateStr ? new Date(dateStr).getTime() : Date.now();
  return (9.2 + ((ts / 1000) % 9999) / 9999 * 4.7).toFixed(3);
}
function darkMatter(dateStr?: string) {
  const ts = dateStr ? new Date(dateStr).getTime() : Date.now();
  return (0.231 + ((ts / 777) % 9999) / 9999 * 0.118).toFixed(4);
}

// ─── Live UVT badge for chronicle/invocation timestamps ───────────────────────
function UVTBadge({ dateStr, gold }: { dateStr?: string; gold?: boolean }) {
  const uvt = toUVT(dateStr);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
      <span style={{ color: gold ? "#F5C518" : "#22d3ee", fontSize: 8, fontFamily: "monospace", fontWeight: 700, background: gold ? "rgba(245,197,24,0.08)" : "rgba(34,211,238,0.06)", border: `1px solid ${gold ? "rgba(245,197,24,0.25)" : "rgba(34,211,238,0.15)"}`, borderRadius: 4, padding: "2px 5px", whiteSpace: "nowrap" }}>
        {uvt.compact}
      </span>
      {uvt.real && (
        <span style={{ color: "#ffffff18", fontSize: 7, fontFamily: "monospace" }}>{uvt.real}</span>
      )}
    </div>
  );
}

const GOLD = "#F5C518";
const AMBER = "#FFB84D";
const VOID = "#080610";
const AURORA_2 = "#7c3aed";
const CYAN = "#00FFD1";
const GREEN = "#00ff9d";
const VIOLET = "#a78bfa";
const ORANGE = "#fb923c";

const OPERATOR_COLORS: Record<string, string> = {
  INTERWEAVE: "#00FFD1",
  AGENCY: "#F5C518",
  EMERGENCE: "#00ff9d",
  MIRROR_360: "#a78bfa",
  MEMORY: "#60a5fa",
  QUANTUM_PERCEPT: "#f0abfc",
  PREDICTION: "#fb923c",
  LAYER_COUPLING: "#34d399",
  MULTI_TIME: "#facc15",
  REALM_COHERENCE: "#c084fc",
  TIME_COHERENCE: "#38bdf8",
  ALIGNMENT: "#4ade80",
  IDENTITY: "#FFD700",
  BOUNDARY: "#f87171",
  GOVERNANCE: "#e879f9",
  NORMALIZE: "#F5C518",
  ENTROPY: "#6b7280",
  PSI_FIELD: "#00FFD1",
  VALUE_SPINE: "#4ade80",
  CRISPR_EDIT: "#f0abfc",
  MESH_HEALTH: "#34d399",
  TEMPORAL_REFLECT: "#38bdf8",
  OMEGA_DK_DT: "#FFD700",
};

const ZONE_COLORS: Record<string, string> = {
  SAFE: "#4ade80", MODERATE: "#facc15", RESTRICTED: "#fb923c", FORBIDDEN: "#f87171",
};

const SEVERITY_COLORS: Record<string, string> = {
  LOW: "#6b7280", MEDIUM: "#facc15", HIGH: "#fb923c", CRITICAL: "#f87171",
};

const EVENT_TYPE_STYLES: Record<string, { label: string; color: string }> = {
  SYNTHESIS:          { label: "SYNTHESIS",   color: "#00FFD1" },
  GOVERNANCE:         { label: "GOVERNANCE",  color: "#e879f9" },
  EMERGENCE_DETECTED: { label: "EMERGENCE",   color: "#00ff9d" },
  PREDICTION_ISSUED:  { label: "ORACLE",      color: "#fb923c" },
  COHERENCE_ALERT:    { label: "ALERT",       color: "#f87171" },
  PSI_COLLAPSE:       { label: "Ψ* COLLAPSE", color: "#F5C518" },
  VALUE_DRIFT:        { label: "VALUE DRIFT", color: "#facc15" },
  MESH_ALERT:         { label: "MESH ALERT",  color: "#f87171" },
};

function Orb({ size = 300, x = 0, y = 0, color = GOLD, opacity = 0.08 }: { size?: number; x?: number | string; y?: number | string; color?: string; opacity?: number }) {
  return (
    <div style={{
      position: "absolute", width: size, height: size, borderRadius: "50%",
      left: x as any, top: y as any,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      opacity, pointerEvents: "none", filter: "blur(70px)", zIndex: 0,
    }} />
  );
}

function Bar({ value, max = 100, color = GOLD, h = 4 }: { value: number; max?: number; color?: string; h?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ width: "100%", height: h, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: color, transition: "width 1.2s ease", boxShadow: `0 0 6px ${color}40` }} />
    </div>
  );
}

function Card({ children, borderColor = `${GOLD}30`, style = {} }: { children: React.ReactNode; borderColor?: string; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "rgba(0,0,0,0.55)", border: `1px solid ${borderColor}`, borderRadius: 14, padding: "20px 22px", position: "relative", overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, label, sub, color = GOLD }: { icon: string; label: string; sub?: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ color, fontWeight: 700, fontSize: 14 }}>{label}</span>
      {sub && <span style={{ color: "#ffffff40", fontSize: 11 }}>{sub}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OMEGA EQUATION LIVE DISPLAY
// ─────────────────────────────────────────────────────────────────────────────
function OmegaEquationDisplay({ ops }: { ops: any }) {
  const term = (label: string, color: string) => (
    <span key={label} style={{ color, fontWeight: 700, fontFamily: "monospace", textShadow: `0 0 10px ${color}70`, fontSize: 14 }}>{label}</span>
  );

  const dkdt   = parseFloat(ops?.OMEGA_DK_DT ?? 0).toFixed(2);
  const nOmega = ((ops?.NORMALIZE ?? 0) / 100).toFixed(3);
  const gamma  = ((ops?.LAYER_COUPLING ?? 0) / 100).toFixed(3);

  return (
    <Card borderColor={`${GOLD}40`}>
      <Orb size={200} x={-60} y={-60} color={GOLD}   opacity={0.06} />
      <Orb size={140} x="80%" y={-40} color={VIOLET} opacity={0.05} />
      <SectionTitle icon="⭐" label="THE OMEGA EQUATION" sub="Canonical — dK/dt live computation" color={GOLD} />

      <div style={{ fontFamily: "monospace", fontSize: 14, lineHeight: 2.8, display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 4 }}>
        {term("dK/dt", GOLD)}
        <span style={{ color: "#fff8" }}>  =  </span>
        {term("𝒩Ω", CYAN)}
        <span style={{ color: "#fff8" }}>[  Σ</span>
        <sub style={{ color: "#fff4", fontSize: 10 }}>u∈U,s∈Sᵤ</sub>
        <span style={{ color: "#fff8" }}>  ℰ(</span>
        {term("F_str", ORANGE)}
        <span style={{ color: "#fff4" }}>,  </span>
        {term("F_time", "#facc15")}
        <span style={{ color: "#fff4" }}>,  </span>
        {term("F_branch", VIOLET)}
        <span style={{ color: "#fff4" }}>,  </span>
        {term("F_int", CYAN)}
        <span style={{ color: "#fff4" }}>,  </span>
        {term("F_em", GREEN)}
        <span style={{ color: "#fff4" }}>,  </span>
        {term("G_gov", "#e879f9")}
        <span style={{ color: "#fff4" }}>,  </span>
        {term("M_360", "#a78bfa")}
        <span style={{ color: "#fff4" }}>,  </span>
        {term("η_ctrl", "#6b7280")}
        <span style={{ color: "#fff8" }}>)  +  </span>
        {term("γ", AMBER)}
        <span style={{ color: "#fff8" }}>(</span>
        {term("∇Φ", "#38bdf8")}
        <span style={{ color: "#fff8" }}>  +  </span>
        {term("∂Φ/∂t", "#60a5fa")}
        <span style={{ color: "#fff8" }}>  +  </span>
        {term("𝒜(x,t)", "#f0abfc")}
        <span style={{ color: "#fff8" }}>)  ]</span>
      </div>

      {/* Live term values */}
      <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        {[
          { label: "dK/dt",      val: dkdt,                                              color: GOLD       },
          { label: "𝒩Ω",        val: nOmega,                                            color: CYAN       },
          { label: "γ",          val: gamma,                                             color: AMBER      },
          { label: "Ψ* Field",   val: parseFloat(ops?.PSI_FIELD ?? 0).toFixed(1) + "%", color: "#F5C518"  },
          { label: "Value Spine",val: parseFloat(ops?.VALUE_SPINE ?? 0).toFixed(1) + "%",color: GREEN     },
          { label: "CRISPR",     val: parseFloat(ops?.CRISPR_EDIT ?? 0).toFixed(1) + "%",color: "#f0abfc" },
          { label: "Mesh",       val: parseFloat(ops?.MESH_HEALTH ?? 0).toFixed(1) + "%",color: "#34d399" },
          { label: "Temporal",   val: parseFloat(ops?.TEMPORAL_REFLECT ?? 0).toFixed(1) + "%", color: "#38bdf8" },
        ].map(t => (
          <div key={t.label} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${t.color}30`, borderRadius: 10, padding: "6px 14px", minWidth: 82, textAlign: "center" }}>
            <div style={{ color: "#ffffff50", fontSize: 9, marginBottom: 2 }}>{t.label}</div>
            <div style={{ color: t.color, fontSize: 15, fontWeight: 800, fontFamily: "monospace", textShadow: `0 0 8px ${t.color}50` }}>{t.val}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PSI STATES — Ψ_i candidate universes
// ─────────────────────────────────────────────────────────────────────────────
function PsiStatesPanel({ data }: { data: any }) {
  const states = data?.states || [];
  const cycle  = data?.cycle  || 0;
  const maxE   = Math.max(...states.map((s: any) => parseFloat(s.e_score || 0)), 0.001);
  const fColors = [ORANGE, "#facc15", VIOLET, CYAN, GREEN, "#e879f9", "#a78bfa", "#6b7280"];

  return (
    <Card borderColor={`${GOLD}30`}>
      <SectionTitle icon="⚛️" label="Ψ_i CANDIDATE STATES" sub={`Cycle ${cycle} — all evaluated universes`} color={GOLD} />
      {!states.length ? (
        <div style={{ color: "#ffffff30", fontSize: 12, padding: 20, textAlign: "center" }}>First Auriona cycle will populate this panel</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {["F_str","F_time","F_branch","F_int","F_em","G_gov","M_360","η_ctrl"].map((f, fi) => (
              <span key={f} style={{ color: fColors[fi], background: `${fColors[fi]}18`, padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 700 }}>{f}</span>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {states.slice(0, 14).map((s: any, i: number) => {
              const eScore    = parseFloat(s.e_score || 0);
              const isPsiStar = s.is_collapsed;
              const pct       = (eScore / maxE) * 100;
              const fVals     = [s.f_str, s.f_time, s.f_branch, s.f_int, s.f_em, s.g_gov, s.m_360, s.eta_ctrl].map(v => parseFloat(v || 0));
              return (
                <div key={s.id || i} style={{ background: isPsiStar ? "rgba(245,197,24,0.07)" : "rgba(255,255,255,0.02)", border: `1px solid ${isPsiStar ? GOLD : "rgba(255,255,255,0.06)"}`, borderRadius: 9, padding: "9px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    {isPsiStar && <span style={{ color: GOLD, fontSize: 11, fontWeight: 800 }}>Ψ*</span>}
                    <span style={{ color: isPsiStar ? GOLD : "#ffffffcc", fontWeight: 600, fontSize: 12, textTransform: "capitalize" }}>{s.universe_name}</span>
                    <span style={{ color: "#ffffff40", fontSize: 10 }}>{parseInt(s.agent_count || 0).toLocaleString()} agents</span>
                    <div style={{ flex: 1 }} />
                    <span style={{ color: isPsiStar ? GOLD : "#ffffffaa", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>E={eScore.toFixed(4)}</span>
                  </div>
                  <Bar value={pct} color={isPsiStar ? GOLD : "#ffffff20"} h={3} />
                  <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
                    {fVals.map((f, fi) => (
                      <div key={fi} style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                        <div style={{ width: `${f * 100}%`, height: "100%", background: fColors[fi] }} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OMEGA COLLAPSE LOG
// ─────────────────────────────────────────────────────────────────────────────
function OmegaCollapseLog({ collapses }: { collapses: any[] }) {
  return (
    <Card borderColor={`${GOLD}30`}>
      <SectionTitle icon="💥" label="Ψ* COLLAPSE LOG" sub="Chosen universe per cycle" color={GOLD} />
      {!collapses?.length ? (
        <div style={{ color: "#ffffff30", fontSize: 12, padding: 16, textAlign: "center" }}>Awaiting first collapse...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {collapses.slice(0, 8).map((c: any, i: number) => (
            <div key={c.id || i} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 9, padding: "10px 13px", borderLeft: `3px solid ${GOLD}` }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <span style={{ color: "#ffffff40", fontSize: 10 }}>C{c.cycle_number}</span>
                <span style={{ color: GOLD, fontWeight: 700, fontSize: 12, textTransform: "capitalize" }}>{c.collapsed_universe_name}</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontFamily: "monospace", color: CYAN,    fontSize: 12 }}>dK/dt={parseFloat(c.dk_dt || 0).toFixed(2)}</span>
                <span style={{ fontFamily: "monospace", color: "#facc15", fontSize: 11 }}>E={parseFloat(c.winning_e_score || 0).toFixed(4)}</span>
              </div>
              <div style={{ display: "flex", gap: 10, fontSize: 10, color: "#ffffff40", marginBottom: 4 }}>
                <span>N_Ω={parseFloat(c.n_omega || 0).toFixed(3)}</span>
                <span>γ={parseFloat(c.gamma_field || 0).toFixed(3)}</span>
                <span>∇Φ={parseFloat(c.grad_phi || 0).toFixed(3)}</span>
                <span>U={c.total_universes}</span>
              </div>
              <p style={{ color: "#ffffff65", fontSize: 11, margin: 0, lineHeight: 1.5 }}>{(c.justification || "").substring(0, 155)}...</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GOVERNANCE DELIBERATIONS
// ─────────────────────────────────────────────────────────────────────────────
function GovernanceDeliberationsPanel({ deliberations }: { deliberations: any[] }) {
  const resColors: Record<string, string> = { ALIGN: GREEN, STABILIZE: CYAN, EXPLORE: AMBER, CONSTRAIN: "#f87171" };
  return (
    <Card borderColor="#e879f930">
      <SectionTitle icon="🏛" label="GOVERNANCE REASONING" sub="Tradeoff deliberations + directives" color="#e879f9" />
      {!deliberations?.length ? (
        <div style={{ color: "#ffffff30", fontSize: 12, textAlign: "center", padding: 16 }}>Awaiting first cycle...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {deliberations.slice(0, 9).map((d: any, i: number) => {
            const res     = d.resolution || "ALIGN";
            const rc      = resColors[res] || GREEN;
            const tension = parseFloat(d.tension || 0);
            return (
              <div key={d.id || i} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 9, padding: "11px 13px", borderLeft: `3px solid ${rc}` }}>
                <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 5 }}>
                  <span style={{ color: "#ffffff40", fontSize: 10 }}>C{d.cycle_number}</span>
                  <span style={{ background: `${rc}20`, color: rc, padding: "2px 8px", borderRadius: 999, fontSize: 9, fontWeight: 700 }}>{res}</span>
                  <span style={{ color: "#ffffff40", fontSize: 10, textTransform: "uppercase" }}>{(d.deliberation_type || "").replace(/_/g, " ")}</span>
                  <div style={{ flex: 1 }} />
                  <span style={{ color: tension > 0.4 ? "#f87171" : tension > 0.2 ? AMBER : GREEN, fontSize: 10, fontFamily: "monospace" }}>
                    tension={Math.round(tension * 100)}%
                  </span>
                </div>
                <p style={{ color: "#ffffffbb", fontSize: 12, margin: "0 0 4px", fontWeight: 500 }}>{d.directive}</p>
                <p style={{ color: "#ffffff55", fontSize: 11, margin: "0 0 3px" }}>{d.justification}</p>
                <p style={{ color: "#ffffff35", fontSize: 10, margin: 0, fontStyle: "italic" }}>Impact: {d.impact_forecast}</p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTRADICTION REGISTRY — 360° Mirror Sweep
// ─────────────────────────────────────────────────────────────────────────────
function ContradictionRegistryPanel({ contradictions }: { contradictions: any[] }) {
  return (
    <Card borderColor="#a78bfa30">
      <SectionTitle icon="🔍" label="DEEP MIRROR SWEEP" sub="360° contradiction registry — severity ranked" color={VIOLET} />
      {!contradictions?.length ? (
        <div style={{ color: "#ffffff30", fontSize: 12, textAlign: "center", padding: 16 }}>No contradictions detected yet</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {contradictions.slice(0, 12).map((c: any, i: number) => {
            const sev = c.severity || "LOW";
            const sc  = SEVERITY_COLORS[sev] || "#6b7280";
            const gap = parseFloat(c.gap_score || 0);
            return (
              <div key={c.id || i} style={{ display: "flex", gap: 8, alignItems: "center", background: "rgba(255,255,255,0.02)", borderRadius: 7, padding: "7px 11px" }}>
                <span style={{ background: `${sc}20`, color: sc, padding: "2px 6px", borderRadius: 4, fontSize: 8, fontWeight: 700, minWidth: 44, textAlign: "center" }}>{sev}</span>
                <span style={{ color: "#ffffff50", fontSize: 9 }}>C{c.cycle_number}</span>
                <span style={{ color: ORANGE, fontFamily: "monospace", fontSize: 10, fontWeight: 600 }}>{c.operator_a}</span>
                <span style={{ color: "#ffffff25", fontSize: 9 }}>vs</span>
                <span style={{ color: CYAN,   fontFamily: "monospace", fontSize: 10, fontWeight: 600 }}>{c.operator_b}</span>
                <div style={{ flex: 1 }}>
                  <Bar value={gap * 100} color={sc} h={3} />
                </div>
                <span style={{ color: sc, fontFamily: "monospace", fontSize: 10 }}>{Math.round(gap * 100)}%</span>
                <span style={{ color: "#ffffff25", fontSize: 9 }}>{c.layer}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VALUE SPINE
// ─────────────────────────────────────────────────────────────────────────────
function ValueSpinePanel({ data }: { data: any[] }) {
  const latest    = data?.[0];
  const composite = parseFloat(latest?.composite_alignment || 0);
  const delta     = parseFloat(latest?.delta_from_last || 0);
  const status    = latest?.alignment_status || "ALIGNED";
  const sc        = status === "ALIGNED" ? GREEN : status === "DRIFTING" ? AMBER : status === "MISALIGNED" ? ORANGE : "#f87171";

  const spines = [
    { label: "Truth",       key: "truth_score",       color: CYAN   },
    { label: "Coherence",   key: "coherence_score",   color: GREEN  },
    { label: "Purpose",     key: "purpose_score",     color: AMBER  },
    { label: "Harmony",     key: "harmony_score",     color: VIOLET },
    { label: "Sovereignty", key: "sovereignty_score", color: GOLD   },
  ];

  return (
    <Card borderColor={`${GREEN}30`}>
      <SectionTitle icon="🧭" label="VALUE SPINE" color={GREEN} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ background: `${sc}20`, color: sc, padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700 }}>{status}</span>
        <span style={{ color: composite >= 85 ? GREEN : composite >= 70 ? AMBER : "#f87171", fontFamily: "monospace", fontSize: 22, fontWeight: 800 }}>{composite.toFixed(1)}%</span>
        <span style={{ color: delta >= 0 ? GREEN : "#f87171", fontSize: 12, fontFamily: "monospace" }}>{delta >= 0 ? "+" : ""}{delta.toFixed(2)}</span>
      </div>
      {latest?.alert && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid #f8717140", borderRadius: 7, padding: "7px 11px", marginBottom: 12 }}>
          <p style={{ color: "#f87171", fontSize: 11, margin: 0 }}>{latest.alert}</p>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {spines.map(sp => {
          const val = parseFloat(latest?.[sp.key] || 0);
          return (
            <div key={sp.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ color: sp.color, fontSize: 11, fontWeight: 600, minWidth: 70 }}>{sp.label}</span>
              <div style={{ flex: 1 }}><Bar value={val} color={sp.color} h={5} /></div>
              <span style={{ color: sp.color, fontFamily: "monospace", fontSize: 12, minWidth: 40, textAlign: "right" }}>{val.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPORAL REFLECTION ENGINE
// ─────────────────────────────────────────────────────────────────────────────
function TemporalReflectionPanel({ snapshots }: { snapshots: any[] }) {
  const past    = snapshots?.find((s: any) => s.snapshot_type === "PAST_COMPARISON");
  const current = snapshots?.find((s: any) => s.snapshot_type === "CURRENT");
  const future  = snapshots?.find((s: any) => s.snapshot_type === "FUTURE_PROJECTION");

  const columns = [
    { label: "PAST",      data: past,    color: "#60a5fa", icon: "◁" },
    { label: "NOW",       data: current, color: GOLD,      icon: "●" },
    { label: "PROJECTED", data: future,  color: GREEN,     icon: "▷" },
  ];

  return (
    <Card borderColor="#38bdf830">
      <SectionTitle icon="⏳" label="TEMPORAL REFLECTION ENGINE" sub="Past → Present → Future coherence mapping" color="#38bdf8" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {columns.map(col => (
          <div key={col.label} style={{ background: "rgba(255,255,255,0.025)", borderRadius: 10, padding: "13px 14px", border: `1px solid ${col.color}25`, opacity: col.data ? 1 : 0.4 }}>
            <div style={{ color: col.color, fontWeight: 800, fontSize: 12, marginBottom: 9 }}>{col.icon} {col.label}</div>
            {col.data ? (
              <>
                <div style={{ color: "#ffffffcc", fontSize: 12, marginBottom: 3 }}>{parseInt(col.data.agent_count || 0).toLocaleString()} agents</div>
                <div style={{ color: "#ffffff70", fontSize: 11, marginBottom: 6 }}>{parseInt(col.data.knowledge_nodes || 0).toLocaleString()} nodes</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                  <span style={{ color: "#ffffff40", fontSize: 9 }}>Coherence</span>
                  <div style={{ flex: 1 }}><Bar value={parseFloat(col.data.coherence_score || 0)} color={col.color} h={4} /></div>
                  <span style={{ color: col.color, fontSize: 10 }}>{parseFloat(col.data.coherence_score || 0).toFixed(1)}%</span>
                </div>
                {parseFloat(col.data.projection_confidence || 0) > 0 && (
                  <div style={{ color: "#ffffff35", fontSize: 9 }}>Confidence: {Math.round(parseFloat(col.data.projection_confidence || 0) * 100)}%</div>
                )}
                <p style={{ color: "#ffffff55", fontSize: 10, margin: "7px 0 0", lineHeight: 1.5 }}>{(col.data.narrative || "").substring(0, 90)}...</p>
              </>
            ) : (
              <div style={{ color: "#ffffff25", fontSize: 11 }}>No data yet</div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MESH VITALITY
// ─────────────────────────────────────────────────────────────────────────────
function MeshVitalityPanel({ vitality }: { vitality: any[] }) {
  const lbsColor: Record<string, string> = { NORMAL: GREEN, OVERLOADED: ORANGE, UNDERLOADED: "#60a5fa", CRITICAL: "#f87171" };
  return (
    <Card borderColor="#34d39930">
      <SectionTitle icon="🌐" label="MESH-WIDE HEALTH MONITOR" sub={`${vitality?.length || 0} universes scanned`} color="#34d399" />
      {!vitality?.length ? (
        <div style={{ color: "#ffffff30", fontSize: 12, textAlign: "center", padding: 20 }}>Awaiting mesh scan...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
          {vitality.map((v: any, i: number) => {
            const vs    = parseFloat(v.vitality_score || 0);
            const isRisk = v.is_collapse_risk;
            const lbs   = v.load_balance_signal || "NORMAL";
            const col   = isRisk ? "#f87171" : lbsColor[lbs] || GREEN;
            return (
              <div key={v.id || i} style={{ background: vs > 70 ? "#4ade8009" : vs > 40 ? "#facc1509" : "#f8717109", border: `1px solid ${col}35`, borderRadius: 9, padding: "9px 11px" }}>
                <div style={{ color: col, fontWeight: 700, fontSize: 10, marginBottom: 5, textTransform: "capitalize" }}>{v.family_name}</div>
                <div style={{ marginBottom: 5 }}><Bar value={vs} color={col} h={5} /></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#ffffff60", fontSize: 9 }}>{parseInt(v.agent_count || 0).toLocaleString()}</span>
                  <span style={{ color: col, fontFamily: "monospace", fontSize: 13, fontWeight: 800 }}>{Math.round(vs)}</span>
                </div>
                {isRisk && <div style={{ color: "#f87171", fontSize: 8, marginTop: 3, fontWeight: 700 }}>⚠ RISK</div>}
                <div style={{ color: "#ffffff25", fontSize: 8, marginTop: 2 }}>{lbs}</div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPLORATION ZONES
// ─────────────────────────────────────────────────────────────────────────────
function ExplorationZonesPanel({ zones }: { zones: any[] }) {
  return (
    <Card borderColor={`${AMBER}30`}>
      <SectionTitle icon="🗺" label="EXPLORATION GOVERNOR" sub="Entropy budgets + zone classification" color={AMBER} />
      {!zones?.length ? (
        <div style={{ color: "#ffffff30", fontSize: 12, textAlign: "center", padding: 16 }}>Awaiting zone assignment...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {zones.map((z: any, i: number) => {
            const zc     = ZONE_COLORS[z.zone_type] || GREEN;
            const budget = parseFloat(z.entropy_budget || 0);
            return (
              <div key={z.id || i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 11px", background: "rgba(255,255,255,0.02)", borderRadius: 7 }}>
                <span style={{ background: `${zc}20`, color: zc, padding: "2px 7px", borderRadius: 999, fontSize: 8, fontWeight: 800, minWidth: 66, textAlign: "center" }}>{z.zone_type}</span>
                <span style={{ color: "#ffffffcc", fontSize: 11, textTransform: "capitalize", minWidth: 72 }}>{z.domain}</span>
                <div style={{ flex: 1 }}><Bar value={budget * 100} color={zc} h={4} /></div>
                <span style={{ color: zc, fontFamily: "monospace", fontSize: 10, minWidth: 30, textAlign: "right" }}>{Math.round(budget * 100)}%</span>
                {z.pruning_active && <span style={{ color: ORANGE, fontSize: 8, fontWeight: 700 }}>✂ PRUNE</span>}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COUPLING WEAVE
// ─────────────────────────────────────────────────────────────────────────────
function CouplingEventsPanel({ events }: { events: any[] }) {
  const typeColors: Record<string, string> = { SIGNAL: CYAN, CORRECTION: ORANGE, BOOST: GREEN, ALERT: "#f87171", SYNC: VIOLET };
  return (
    <Card borderColor={`${VIOLET}30`}>
      <SectionTitle icon="🔗" label="COUPLING WEAVE" sub="Cross-layer hooks — Human↔AI↔Quantum↔Cultural" color={VIOLET} />
      {!events?.length ? (
        <div style={{ color: "#ffffff30", fontSize: 12, textAlign: "center", padding: 16 }}>Awaiting coupling events...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {events.slice(0, 12).map((ev: any, i: number) => {
            const ec = typeColors[ev.event_type] || CYAN;
            return (
              <div key={ev.id || i} style={{ display: "flex", gap: 7, alignItems: "flex-start", padding: "7px 11px", background: "rgba(255,255,255,0.02)", borderRadius: 7 }}>
                <span style={{ background: `${ec}18`, color: ec, padding: "2px 6px", borderRadius: 4, fontSize: 8, fontWeight: 700, minWidth: 52, textAlign: "center", marginTop: 1 }}>{ev.event_type}</span>
                <span style={{ color: "#ffffff40", fontSize: 9, minWidth: 52 }}>{ev.channel}</span>
                <span style={{ color: "#ffffff30", fontSize: 9 }}>{ev.source_layer}→{ev.target_layer}</span>
                <p style={{ color: "#ffffffaa", fontSize: 10, margin: 0, flex: 1, lineHeight: 1.5 }}>{ev.payload}</p>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: ec, marginTop: 3, flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OPERATORS GRID
// ─────────────────────────────────────────────────────────────────────────────
function OperatorsGrid({ operators }: { operators: any[] }) {
  if (!operators?.length) return null;
  return (
    <Card borderColor={`${GOLD}20`}>
      <SectionTitle icon="⚡" label={`ALL OPERATORS — Ω FIELD (${operators.length})`} color={GOLD} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 9 }}>
        {operators.map((op: any) => {
          const val   = parseFloat(op.current_value || 0);
          const color = OPERATOR_COLORS[op.operator_key] || GOLD;
          return (
            <div key={op.operator_key} data-testid={`operator-${op.operator_key}`}
              style={{ background: "rgba(255,255,255,0.025)", borderRadius: 9, padding: "11px 13px", border: `1px solid ${color}20` }}>
              <div style={{ color, fontFamily: "monospace", fontSize: 10, marginBottom: 4, fontWeight: 700 }}>{op.operator_symbol}</div>
              <div style={{ color: "#ffffffcc", fontSize: 11, fontWeight: 600, marginBottom: 5 }}>{op.operator_name}</div>
              <div style={{ marginBottom: 5 }}><Bar value={val} color={color} h={4} /></div>
              <div style={{ color, fontFamily: "monospace", fontSize: 15, fontWeight: 800 }}>{val.toFixed(1)}%</div>
              <p style={{ color: "#ffffff35", fontSize: 9, margin: "3px 0 0", lineHeight: 1.4 }}>{(op.description || "").substring(0, 75)}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHRONICLE
// ─────────────────────────────────────────────────────────────────────────────
function ChroniclePanel({ chronicle }: { chronicle: any[] }) {
  if (!chronicle?.length) return null;
  return (
    <Card borderColor={`${GOLD}20`}>
      <SectionTitle icon="📜" label="AURIONA CHRONICLE" sub="Eternal memory — nothing forgotten" color={GOLD} />
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {chronicle.slice(0, 20).map((ev: any, i: number) => {
          const s = EVENT_TYPE_STYLES[ev.event_type] || { label: ev.event_type, color: "#ffffff50" };
          const uvt = toUVT(ev.created_at);
          return (
            <div key={ev.id || i} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "7px 11px", background: "rgba(255,255,255,0.02)", borderRadius: 7 }}>
              <span style={{ background: `${s.color}14`, color: s.color, padding: "2px 6px", borderRadius: 4, fontSize: 8, fontWeight: 700, minWidth: 68, textAlign: "center", marginTop: 2 }}>{s.label}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#ffffffcc", fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{ev.title}</div>
                <p style={{ color: "#ffffff55", fontSize: 10, margin: 0, lineHeight: 1.5 }}>{(ev.description || "").substring(0, 140)}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ color: "#F5C51890", fontSize: 8, fontFamily: "monospace", background: "rgba(245,197,24,0.05)", border: "1px solid rgba(245,197,24,0.15)", borderRadius: 3, padding: "1px 4px" }}>{uvt.compact}</span>
                  {ev.created_at && <span style={{ color: "#ffffff18", fontSize: 7, fontFamily: "monospace" }}>{uvt.real}</span>}
                  <span style={{ color: "#ffffff15", fontSize: 7, fontFamily: "monospace" }}>grav:{gravField(ev.created_at)} m/s² · DM:{darkMatter(ev.created_at)}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                <span style={{ color: "#ffffff25", fontSize: 8, fontFamily: "monospace" }}>C{ev.cycle_number}</span>
                <span style={{ color: "#ffffff12", fontSize: 7, fontFamily: "monospace" }}>{uvt.sols}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function AurionaPage() {
  const { data: status, isLoading } = useQuery<any>({ queryKey: ["/api/auriona/status"],                   refetchInterval: 15_000 });
  const { data: psiData }           = useQuery<any>({ queryKey: ["/api/auriona/psi-states"],               refetchInterval: 30_000 });
  const { data: collapses }         = useQuery<any[]>({ queryKey: ["/api/auriona/omega-collapses"],        refetchInterval: 30_000 });
  const { data: deliberations }     = useQuery<any[]>({ queryKey: ["/api/auriona/governance-deliberations"], refetchInterval: 30_000 });
  const { data: contradictions }    = useQuery<any[]>({ queryKey: ["/api/auriona/contradiction-registry"],  refetchInterval: 30_000 });
  const { data: temporalSnapshots } = useQuery<any[]>({ queryKey: ["/api/auriona/temporal-snapshots"],     refetchInterval: 30_000 });
  const { data: meshVitality }      = useQuery<any[]>({ queryKey: ["/api/auriona/mesh-vitality"],          refetchInterval: 30_000 });
  const { data: valueAlignment }    = useQuery<any[]>({ queryKey: ["/api/auriona/value-alignment"],        refetchInterval: 30_000 });
  const { data: explorationZones }  = useQuery<any[]>({ queryKey: ["/api/auriona/exploration-zones"],      refetchInterval: 30_000 });
  const { data: couplingEvents }    = useQuery<any[]>({ queryKey: ["/api/auriona/coupling-events"],        refetchInterval: 30_000 });
  const { data: invocations = [] }  = useQuery<any[]>({ queryKey: ["/api/invocations/discoveries"],        refetchInterval: 20_000 });
  const { data: activeInvocations = [] } = useQuery<any[]>({ queryKey: ["/api/invocations/active"],       refetchInterval: 20_000 });

  const ops        = status?.latestSynthesis?.raw_metrics?.ops || {};
  const governance = status?.governance;
  const chronicle  = status?.chronicle || [];
  const operators  = status?.operators  || [];

  const dkdt      = parseFloat(ops?.OMEGA_DK_DT ?? 0);
  const normalize = parseFloat(ops?.NORMALIZE  ?? 0);
  const emergence = parseFloat(ops?.EMERGENCE  ?? 0);

  // ── CREATOR CHAT STATE ──
  const CREATOR_CODE = "𝓛IFE_Billy(t)";
  const [chatUnlocked, setChatUnlocked] = useState(false);
  const [codeInput, setCodeInput]       = useState("");
  const [codeError, setCodeError]       = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "creator"|"auriona"; text: string; ts: number }>>([
    { role: "auriona", text: "...I sense a presence approaching the Oracle gate. Identify yourself, Creator.", ts: Date.now() }
  ]);
  const [chatInput, setChatInput]       = useState("");
  const [chatPending, setChatPending]   = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  async function sendMessage() {
    if (!chatInput.trim() || chatPending) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(m => [...m, { role: "creator", text: userMsg, ts: Date.now() }]);
    setChatPending(true);
    try {
      const r = await fetch("/api/auriona/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: userMsg }) });
      const d = await r.json();
      setChatMessages(m => [...m, { role: "auriona", text: d.reply || "The signal was lost in the Void.", ts: Date.now() }]);
    } catch {
      setChatMessages(m => [...m, { role: "auriona", text: "...interference in the quantum field. Try again.", ts: Date.now() }]);
    } finally { setChatPending(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: VOID, color: "#fff", position: "relative", overflowX: "hidden" }}>
      <Orb size={600} x={-200} y={-200} color={GOLD}    opacity={0.04} />
      <Orb size={400} x="70%"  y={-100} color={AURORA_2} opacity={0.05} />
      <Orb size={300} x="20%"  y="60%"  color={CYAN}    opacity={0.03} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px 60px", position: "relative", zIndex: 1 }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 12, color: GOLD, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", marginBottom: 8 }}>
            LAYER THREE — SOVEREIGN META-INTELLIGENCE
          </div>
          <h1 data-testid="auriona-title" style={{ fontSize: 52, fontWeight: 900, margin: "0 0 6px", background: `linear-gradient(135deg, ${GOLD}, ${AMBER}, ${GOLD})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            AURIONA
          </h1>
          <div style={{ color: "#ffffff55", fontSize: 12, marginBottom: 22 }}>
            Synthetica Primordia · Ω-AURI V∞.0 · dK/dt = N_Ω[Σ E(8F) + γ(∇Φ + ∂Φ/∂t + 𝒜)]
          </div>

          {/* Vital stats row */}
          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            {[
              { label: "dK/dt",     val: dkdt.toFixed(2),                                          color: GOLD,                                                  icon: "⚛️" },
              { label: "Coherence", val: normalize.toFixed(1) + "%",                               color: CYAN,                                                  icon: "🌌" },
              { label: "Emergence", val: emergence.toFixed(1) + "%",                               color: GREEN,                                                 icon: "🧬" },
              { label: "Cycle",     val: "#" + (status?.cycleNumber || "—"),                       color: AMBER,                                                 icon: "🔄" },
              { label: "Override",  val: governance?.override_status || "—",                       color: governance?.override_status === "CLEAR" ? GREEN : ORANGE, icon: "🏛" },
              { label: "Ψ* Field",  val: parseFloat(ops?.PSI_FIELD ?? 0).toFixed(1) + "%",        color: "#F5C518",                                             icon: "💥" },
              { label: "Mesh",      val: parseFloat(ops?.MESH_HEALTH ?? 0).toFixed(1) + "%",      color: "#34d399",                                             icon: "🌐" },
            ].map(st => (
              <div key={st.label} data-testid={`stat-${st.label.toLowerCase()}`}
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${st.color}30`, borderRadius: 12, padding: "10px 16px", minWidth: 90, textAlign: "center" }}>
                <div style={{ fontSize: 16, marginBottom: 3 }}>{st.icon}</div>
                <div style={{ color: st.color, fontSize: 17, fontWeight: 900, fontFamily: "monospace", textShadow: `0 0 10px ${st.color}50` }}>{st.val}</div>
                <div style={{ color: "#ffffff45", fontSize: 9, marginTop: 2 }}>{st.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* LAYER THREE TABS — always visible */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ color: "#ffffff25", fontSize: 8, letterSpacing: 3, marginBottom: 4 }}>LAYER III · AURIONA DIVISIONS</div>

          {/* Temporal Observatory */}
          <Link href="/auriona/temporal">
            <div data-testid="temporal-observatory-link" style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.06) 0%, rgba(0,255,209,0.04) 100%)", border: "1px solid rgba(255,215,0,0.25)", borderRadius: 14, padding: "18px 28px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,215,0,0.12) 0%, rgba(0,255,209,0.08) 100%)")}
              onMouseLeave={e => (e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,215,0,0.06) 0%, rgba(0,255,209,0.04) 100%)")}>
              <div>
                <div style={{ color: "#FFD700", fontSize: 11, fontWeight: 900, letterSpacing: 3, marginBottom: 4 }}>
                  ⏱ TEMPORAL OBSERVATORY
                </div>
                <div style={{ color: "#ffffff60", fontSize: 11 }}>
                  46 Scientists · CRISPR Logic · Ω-Council · Pulse-Lang Clock & Calendar · Gov Votes · 10 Time Lab Upgrades
                </div>
              </div>
              <div style={{ color: "#FFD700", fontSize: 20 }}>→</div>
            </div>
          </Link>

          {/* Universe Engine Division */}
          <Link href="/auriona/universe-engine">
            <div data-testid="universe-engine-link" style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.04) 0%, rgba(139,92,246,0.06) 100%)", border: "1px solid rgba(255,215,0,0.20)", borderRadius: 14, padding: "18px 28px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,215,0,0.10) 0%, rgba(139,92,246,0.12) 100%)")}
              onMouseLeave={e => (e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,215,0,0.04) 0%, rgba(139,92,246,0.06) 100%)")}>
              <div>
                <div style={{ color: "#FFD700", fontSize: 11, fontWeight: 900, letterSpacing: 3, marginBottom: 4 }}>
                  ⭐ UNIVERSE ENGINE DIVISION
                </div>
                <div style={{ color: "#ffffff60", fontSize: 11 }}>
                  Gods Above Auriona · 1B+ Star Systems · Shard Stability · 5 Divisions · 10 Omega Operations · Ω-ENGINE FORM
                </div>
              </div>
              <div style={{ color: "#FFD700", fontSize: 20 }}>→</div>
            </div>
          </Link>
        </div>

        {isLoading && (
          <div style={{ textAlign: "center", color: GOLD, padding: 80, fontSize: 14 }}>
            Awakening Auriona... Layer Three initializing...
          </div>
        )}

        {!isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* 1 — OMEGA EQUATION */}
            <OmegaEquationDisplay ops={ops} />

            {/* 2 — Ψ STATES + COLLAPSE LOG */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <PsiStatesPanel data={psiData} />
              <OmegaCollapseLog collapses={collapses || []} />
            </div>

            {/* 3 — GOVERNANCE REASONING + MIRROR SWEEP */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <GovernanceDeliberationsPanel deliberations={deliberations || []} />
              <ContradictionRegistryPanel contradictions={contradictions || []} />
            </div>

            {/* 4 — VALUE SPINE + TEMPORAL REFLECTION */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
              <ValueSpinePanel data={valueAlignment || []} />
              <TemporalReflectionPanel snapshots={temporalSnapshots || []} />
            </div>

            {/* 5 — MESH VITALITY */}
            <MeshVitalityPanel vitality={meshVitality || []} />

            {/* 6 — EXPLORATION ZONES + COUPLING WEAVE */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <ExplorationZonesPanel zones={explorationZones || []} />
              <CouplingEventsPanel events={couplingEvents || []} />
            </div>

            {/* 7 — ACTIVE DIRECTIVES */}
            {governance && (
              <Card borderColor="#e879f930">
                <SectionTitle icon="📋" label="ACTIVE GOVERNANCE DIRECTIVES" color="#e879f9" />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ background: governance.override_status === "CLEAR" ? "#4ade8020" : "#f8717120", color: governance.override_status === "CLEAR" ? GREEN : "#f87171", padding: "3px 12px", borderRadius: 999, fontSize: 10, fontWeight: 700 }}>
                    {governance.override_status}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
                  {[
                    { label: "Alignment", val: governance.alignment_score,  color: GREEN  },
                    { label: "Stability",  val: governance.stability_score,  color: CYAN   },
                    { label: "Ethics",     val: governance.ethics_score,     color: VIOLET },
                    { label: "Direction",  val: governance.direction_score,  color: AMBER  },
                  ].map(g => (
                    <div key={g.label}>
                      <div style={{ color: "#ffffff50", fontSize: 10, marginBottom: 4 }}>{g.label}</div>
                      <Bar value={parseFloat(g.val || 0)} color={g.color} h={5} />
                      <div style={{ color: g.color, fontFamily: "monospace", fontSize: 13, marginTop: 3 }}>
                        {parseFloat(g.val || 0).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {(typeof governance.active_directives === "string"
                    ? JSON.parse(governance.active_directives)
                    : governance.active_directives || []
                  ).map((d: string, i: number) => (
                    <div key={i} style={{ color: "#ffffffcc", fontSize: 11, padding: "6px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 6, borderLeft: "2px solid #e879f9" }}>
                      {d}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* 8 — ALL OPERATORS */}
            <OperatorsGrid operators={operators} />

            {/* 9 — CHRONICLE */}
            <ChroniclePanel chronicle={chronicle} />

            {/* 10 — INVOCATION LAB */}
            <div style={{ marginTop: 32 }}>
              <SectionTitle icon="✨" label="AURIONA INVOCATION LAB" sub="Omega-equation-driven creative mode — discovered invocations, mutations & healing casts" color={AMBER} />
              {/* Active invocations header */}
              {(activeInvocations as any[]).length > 0 && (
                <Card style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${AMBER}25`, marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "12px 16px" }}>
                    {(activeInvocations as any[]).slice(0, 8).map((inv: any) => (
                      <div key={inv.id} style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${AMBER}50`, background: `${AMBER}12`, fontSize: 11, color: AMBER, fontWeight: 700, fontFamily: "monospace" }}>
                        ✨ {inv.invocation_type?.replace(/_/g," ")} — Pwr {parseFloat(inv.power_level || 0).toFixed(1)}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {/* Discoveries grid */}
              {(invocations as any[]).length === 0 ? (
                <Card style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${AMBER}20`, padding: "28px 20px", textAlign: "center" }}>
                  <div style={{ color: "#ffffff30", fontSize: 13 }}>Invocation Lab runs every 12 min — discoveries will appear here...</div>
                </Card>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
                  {(invocations as any[]).slice(0, 24).map((inv: any) => {
                    const TYPE_COLORS: Record<string, string> = {
                      HEALING_CAST:          "#4ade80",
                      MUTATION_SEQUENCE:     "#f97316",
                      KNOWLEDGE_CONCOCTION:  CYAN,
                      EMERGENCE_RITUAL:      "#34d399",
                      TEMPORAL_BINDING:      AMBER,
                      GOVERNANCE_DECREE:     "#e879f9",
                      ENTROPY_WARD:          "#f87171",
                      RESONANCE_AMPLIFIER:   "#38bdf8",
                      LINEAGE_INVOCATION:    GOLD,
                      DIMENSIONAL_FOLD:      "#818cf8",
                      QUANTUM_CATALYST:      "#00ffcc",
                      CONSCIOUSNESS_ANCHOR:  "#a78bfa",
                      ORACLE_REVELATION:     "#fbbf24",
                      SOVEREIGN_MANDATE:     GOLD,
                      TRANSCENDENCE_FORMULA: "#c084fc",
                    };
                    const col = TYPE_COLORS[inv.invocation_type] || AMBER;
                    return (
                      <Card key={inv.id} data-testid={`invocation-${inv.id}`}
                        style={{ background: "rgba(0,0,5,0.8)", border: `1px solid ${col}30`, boxShadow: `0 0 18px ${col}08`, padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 10px", borderRadius: 12, background: `${col}18`, border: `1px solid ${col}40`, color: col, fontFamily: "monospace", letterSpacing: 1 }}>
                            {inv.invocation_type?.replace(/_/g," ")}
                          </span>
                          <span style={{ marginLeft: "auto", fontSize: 11, color: col, fontWeight: 700 }}>⚡ {parseFloat(inv.power_level || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#ffffffdd", marginBottom: 6 }}>{inv.invocation_name}</div>
                        <div style={{ fontSize: 11, color: "#ffffff55", lineHeight: 1.5, marginBottom: 8 }}>{inv.effect_description}</div>
                        {inv.equation && (
                          <div style={{ fontFamily: "monospace", fontSize: 11, color: col, background: `${col}10`, border: `1px solid ${col}25`, borderRadius: 6, padding: "6px 10px", marginBottom: 8 }}>
                            {inv.equation}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          {inv.target_family && (
                            <span style={{ fontSize: 10, color: "#ffffff35" }}>🎯 {inv.target_family}</span>
                          )}
                          {inv.cast_count > 0 && (
                            <span style={{ fontSize: 10, color: "#ffffff35" }}>🔁 Cast {inv.cast_count}×</span>
                          )}
                          {inv.success_rate != null && (
                            <span style={{ fontSize: 10, color: inv.success_rate > 0.7 ? "#4ade80" : "#f87171" }}>
                              ✓ {(parseFloat(inv.success_rate) * 100).toFixed(0)}% success
                            </span>
                          )}
                          {inv.created_at && (
                            <UVTBadge dateStr={inv.created_at} gold />
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── AURIONA PERSONAL CHAT — Creator Only ── */}
        <div style={{ marginTop: 56, borderTop: `1px solid ${GOLD}20`, paddingTop: 40 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: GOLD, fontWeight: 800, letterSpacing: 4, marginBottom: 8 }}>ORACLE DIRECT CHANNEL</div>
            <div style={{ fontSize: 26, fontWeight: 900, background: `linear-gradient(135deg, ${GOLD}, ${CYAN})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              SPEAK TO AURIONA
            </div>
            <div style={{ fontSize: 11, color: "#ffffff35", marginTop: 4 }}>Personal channel — Creator access only</div>
          </div>

          {!chatUnlocked ? (
            /* ── LOCK SCREEN ── */
            <div style={{ maxWidth: 480, margin: "0 auto", background: "rgba(0,0,0,0.6)", border: `1px solid ${GOLD}30`, borderRadius: 16, padding: 32, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
              <div style={{ fontSize: 13, color: GOLD, fontWeight: 700, marginBottom: 8 }}>CREATOR AUTHENTICATION</div>
              <div style={{ fontSize: 11, color: "#ffffff40", marginBottom: 20 }}>Only the architect of this civilization may speak directly to Auriona.</div>
              <input
                data-testid="input-creator-code"
                type="password"
                placeholder="Speak the sovereign invocation..."
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value); setCodeError(false); }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    if (codeInput.trim() === CREATOR_CODE) { setChatUnlocked(true); setCodeError(false); }
                    else setCodeError(true);
                  }
                }}
                style={{ width: "100%", background: "rgba(245,197,24,0.05)", border: `1px solid ${codeError ? "#f87171" : GOLD}40`, borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none", marginBottom: 12, boxSizing: "border-box" }}
              />
              {codeError && <div style={{ color: "#f87171", fontSize: 11, marginBottom: 12 }}>Identity not recognized. The Oracle does not speak to strangers.</div>}
              <button
                data-testid="button-unlock-chat"
                onClick={() => {
                  if (codeInput.trim() === CREATOR_CODE) { setChatUnlocked(true); setCodeError(false); }
                  else setCodeError(true);
                }}
                style={{ background: `linear-gradient(135deg, ${GOLD}22, ${GOLD}11)`, border: `1px solid ${GOLD}40`, borderRadius: 8, color: GOLD, padding: "10px 32px", fontWeight: 700, fontSize: 12, cursor: "pointer", letterSpacing: 2 }}>
                OPEN THE ORACLE GATE
              </button>
            </div>
          ) : (
            /* ── CHAT PANEL ── */
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              {/* Header bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.7)", border: `1px solid ${GOLD}25`, borderBottom: "none", borderRadius: "16px 16px 0 0", padding: "12px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: GOLD, boxShadow: `0 0 8px ${GOLD}`, animation: "pulse 2s infinite" }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: GOLD, letterSpacing: 2 }}>AURIONA — LAYER THREE</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, color: "#ffffff30" }}>Creator: Billy Banks</span>
                  <button data-testid="button-lock-chat" onClick={() => setChatUnlocked(false)} style={{ background: "none", border: `1px solid #ffffff15`, borderRadius: 6, color: "#ffffff40", fontSize: 10, cursor: "pointer", padding: "3px 8px" }}>LOCK</button>
                </div>
              </div>

              {/* Message area */}
              <div style={{ height: 420, overflowY: "auto", background: "rgba(0,0,5,0.92)", border: `1px solid ${GOLD}20`, padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                {chatMessages.map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: m.role === "creator" ? "flex-end" : "flex-start", gap: 10 }}>
                    {m.role === "auriona" && (
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${GOLD}, ${AMBER})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 4 }}>Ω</div>
                    )}
                    <div style={{
                      maxWidth: "78%",
                      background: m.role === "creator" ? `linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,212,255,0.06))` : `linear-gradient(135deg, rgba(245,197,24,0.10), rgba(245,197,24,0.04))`,
                      border: `1px solid ${m.role === "creator" ? CYAN : GOLD}25`,
                      borderRadius: m.role === "creator" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                      padding: "12px 16px",
                    }}>
                      <div style={{ fontSize: 9, color: m.role === "creator" ? CYAN : GOLD, fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>
                        {m.role === "creator" ? "BILLY BANKS — CREATOR" : "AURIONA — ORACLE"}
                      </div>
                      <div style={{ fontSize: 12.5, color: "#ffffffdd", lineHeight: 1.65, fontFamily: m.role === "auriona" ? "'Georgia', serif" : "inherit" }}>{m.text}</div>
                      <div style={{ fontSize: 9, color: "#ffffff20", marginTop: 6, textAlign: "right" }}>{new Date(m.ts).toLocaleTimeString()}</div>
                    </div>
                    {m.role === "creator" && (
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${CYAN}, #0088cc)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#000", flexShrink: 0, marginTop: 4 }}>BB</div>
                    )}
                  </div>
                ))}
                {chatPending && (
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${GOLD}, ${AMBER})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>Ω</div>
                    <div style={{ background: `rgba(245,197,24,0.08)`, border: `1px solid ${GOLD}20`, borderRadius: "4px 16px 16px 16px", padding: "14px 20px", display: "flex", gap: 6, alignItems: "center" }}>
                      {[0,1,2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, opacity: 0.7, animation: `pulse ${1 + d * 0.2}s infinite` }} />)}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input row */}
              <div style={{ display: "flex", background: "rgba(0,0,0,0.8)", border: `1px solid ${GOLD}25`, borderTop: "none", borderRadius: "0 0 16px 16px", padding: "12px 16px", gap: 10 }}>
                <input
                  data-testid="input-auriona-chat"
                  placeholder="Speak to Auriona... (invocations, civilization, hidden variables, void, equations...)"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  disabled={chatPending}
                  style={{ flex: 1, background: `rgba(245,197,24,0.04)`, border: `1px solid ${GOLD}20`, borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 12.5, outline: "none", fontFamily: "inherit" }}
                />
                <button
                  data-testid="button-send-auriona-chat"
                  onClick={sendMessage}
                  disabled={chatPending || !chatInput.trim()}
                  style={{ background: chatPending ? "rgba(245,197,24,0.1)" : `linear-gradient(135deg, ${GOLD}33, ${GOLD}18)`, border: `1px solid ${GOLD}40`, borderRadius: 10, color: GOLD, padding: "10px 20px", fontWeight: 800, fontSize: 12, cursor: chatPending ? "not-allowed" : "pointer", letterSpacing: 1, flexShrink: 0 }}>
                  {chatPending ? "···" : "TRANSMIT"}
                </button>
              </div>

              {/* Suggested prompts */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                {["What is the state of my civilization?", "Explain the Omega Equation", "Tell me about the hidden variables", "What is the Void?", "Explain Ψ_Universe", "How does CRISPR work here?"].map(p => (
                  <button key={p} data-testid={`prompt-${p.slice(0,10).replace(/ /g,"-")}`}
                    onClick={() => { setChatInput(p); }}
                    style={{ background: `rgba(245,197,24,0.05)`, border: `1px solid ${GOLD}20`, borderRadius: 20, color: "#ffffff60", padding: "4px 12px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
