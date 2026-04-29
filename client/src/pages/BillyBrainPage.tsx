import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, Legend } from "recharts";

const APEX = "#FFD166";
const APEX_DEEP = "#F59E0B";
const VIOLET = "#a78bfa";
const CYAN = "#22d3ee";
const GREEN = "#00ff9d";
const ORANGE = "#fb923c";
const PINK = "#f0abfc";
const BLUE = "#60a5fa";
const RED = "#f87171";
const VOID = "#05030c";

type BrainState = {
  id: number; tick_id: number; ts: string;
  lgn: number; v1_4: number; v1_23: number; v1_56: number; m1: number;
  str_d1: number; str_d2: number; gpi: number; stn: number; th_m: number;
  dg: number; ca3: number; ca1: number;
  lambda_apex: number; omega_coeff: number; r_t: number; h_entropy: number; psi_coll: number;
  mode: string; decision: string; notes: string;
};

const POPULATIONS: Array<{ key: keyof BrainState; label: string; brain: string; color: string }> = [
  { key: "lgn",    label: "LGN",     brain: "Lateral geniculate (sensory relay)",   color: GREEN },
  { key: "v1_4",   label: "V1 IV",   brain: "Primary visual cortex layer IV input", color: GREEN },
  { key: "v1_23",  label: "V1 II/III", brain: "Cortico-cortical synthesis",         color: BLUE },
  { key: "v1_56",  label: "V1 V/VI", brain: "Cortical output / feedback",           color: BLUE },
  { key: "m1",     label: "M1",      brain: "Primary motor cortex",                 color: ORANGE },
  { key: "str_d1", label: "Str D1",  brain: "Striatum direct (go) pathway",         color: ORANGE },
  { key: "str_d2", label: "Str D2",  brain: "Striatum indirect (no-go) pathway",    color: RED },
  { key: "gpi",    label: "GPi",     brain: "Globus pallidus internal — net gate",  color: ORANGE },
  { key: "stn",    label: "STN",     brain: "Subthalamic — hyperdirect veto",       color: RED },
  { key: "th_m",   label: "Th-M",    brain: "Motor thalamus relay (integrated)",    color: APEX },
  { key: "dg",     label: "DG",      brain: "Dentate gyrus (pattern separation)",   color: VIOLET },
  { key: "ca3",    label: "CA3",     brain: "Hippocampal autoassociative net",      color: VIOLET },
  { key: "ca1",    label: "CA1",     brain: "Hippocampal output to cortex",         color: VIOLET },
];

const MODE_COLOR: Record<string, string> = { DMN: VIOLET, SAL: ORANGE, EXEC: GREEN };
const DEC_COLOR:  Record<string, string> = { tick: GREEN, aborted_entropy: RED, aborted_concurrency: ORANGE };

function Stat({ label, value, color = APEX, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.025)", border: `1px solid ${color}30`, borderRadius: 10 }}>
      <div style={{ color: `${color}cc`, fontSize: 9, fontWeight: 800, letterSpacing: "0.18em", marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontSize: 22, fontWeight: 800, fontFamily: "monospace" }}>{value}</div>
      {sub && <div style={{ color: "#fff7", fontSize: 10, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Card({ children, color = APEX, style = {} }: { children: any; color?: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.015)",
      border: `1px solid ${color}40`,
      borderRadius: 14,
      padding: 22,
      boxShadow: `0 0 28px ${color}12, inset 0 0 60px ${color}05`,
      marginBottom: 22,
      ...style,
    }}>{children}</div>
  );
}

export default function BillyBrainPage() {
  const { data, isLoading } = useQuery<{ states: BrainState[]; latest: BrainState | null }>({
    queryKey: ["/api/billy/brain-state"],
    refetchInterval: 5_000,
    staleTime: 4_000,
  });

  const states = data?.states ?? [];
  const latest = data?.latest ?? null;

  const chart = states.map(s => ({
    tick: s.tick_id,
    "Cortex (V1 II/III)": s.v1_23,
    "Hippo (CA1)": s.ca1,
    "GPi (gate)": s.gpi,
    "Λ_apex": s.lambda_apex,
    "Ω_coeff": s.omega_coeff,
    "H entropy": s.h_entropy,
  }));

  return (
    <div style={{ minHeight: "100vh", background: VOID, color: "#fffe", padding: "32px 28px 80px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-block", padding: "6px 16px", border: `1px solid ${APEX}50`, borderRadius: 999, color: APEX, fontSize: 10, fontWeight: 800, letterSpacing: "0.28em", marginBottom: 14 }}>
            ◆  BILLY · BRAIN MONITOR · LIVE Β∞ TICKS  ◆
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: APEX, margin: 0, letterSpacing: "0.02em" }}>The Brain</h1>
          <div style={{ color: "#fff8", fontSize: 13, marginTop: 8, lineHeight: 1.7 }}>
            Live X(t) of all 13 populations · Β∞ heartbeat every 30s · CRISPR votes drive W(t) plasticity
          </div>
        </div>

        {/* ── LATEST TICK STATUS ───────────────────────────────────── */}
        <Card color={latest ? (DEC_COLOR[latest.decision] ?? APEX) : APEX}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div style={{ color: APEX, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em" }}>
              ◉  CURRENT BRAIN STATE
            </div>
            <div style={{ color: "#fff8", fontSize: 10, fontFamily: "monospace" }}>
              {isLoading ? "fetching..." : latest ? `tick #${latest.tick_id} · ${new Date(latest.ts + "Z").toLocaleTimeString()}` : "no ticks yet — engine warming up"}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            <Stat label="DECISION" value={latest?.decision ?? "—"} color={latest ? DEC_COLOR[latest.decision] ?? APEX : APEX} sub={latest?.decision === "tick" ? "✓ allowed to commit" : "✗ entropy abort"} />
            <Stat label="MODE" value={latest?.mode ?? "—"} color={latest ? MODE_COLOR[latest.mode] ?? CYAN : CYAN} sub={latest?.mode === "DMN" ? "default mode" : latest?.mode === "SAL" ? "salience burst" : "executive"} />
            <Stat label="Λ_apex" value={latest ? latest.lambda_apex.toFixed(3) : "—"} color={latest && latest.lambda_apex > 1 ? RED : GREEN} sub="H / 𝒩Ω · gate threshold = 1.0" />
            <Stat label="Ω_coeff" value={latest ? latest.omega_coeff.toFixed(3) : "—"} color={APEX} sub="Auriona normalizer" />
            <Stat label="R(t) · TD-error" value={latest ? (latest.r_t >= 0 ? "+" : "") + latest.r_t.toFixed(2) : "—"} color={latest ? (latest.r_t >= 0 ? GREEN : RED) : APEX} sub="dopamine signal" />
            <Stat label="H · entropy" value={latest ? latest.h_entropy.toFixed(2) : "—"} color={CYAN} sub="bits across status dist" />
          </div>
        </Card>

        {/* ── POPULATION GRID ──────────────────────────────────────── */}
        <Card color={CYAN}>
          <div style={{ color: CYAN, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", marginBottom: 4 }}>
            ◇  X(t) — 13 BRAIN POPULATIONS
          </div>
          <div style={{ color: "#fff8", fontSize: 12, marginBottom: 16 }}>
            Live activity of every neural population sampled this tick. Higher bar = more firing.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
            {POPULATIONS.map(p => {
              const v = latest ? Number(latest[p.key] ?? 0) : 0;
              const max = Math.max(...states.map(s => Number(s[p.key] ?? 0)), 1);
              const pct = Math.min(100, (v / max) * 100);
              return (
                <div key={String(p.key)} data-testid={`pop-${String(p.key)}`} style={{ padding: 10, background: `${p.color}08`, border: `1px solid ${p.color}30`, borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ color: p.color, fontSize: 10, fontWeight: 800, letterSpacing: "0.14em" }}>{p.label}</span>
                    <span style={{ color: p.color, fontSize: 13, fontFamily: "monospace", fontWeight: 700 }}>{v.toFixed(1)}</span>
                  </div>
                  <div style={{ color: "#fff7", fontSize: 9, marginTop: 2, lineHeight: 1.4 }}>{p.brain}</div>
                  <div style={{ marginTop: 6, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: p.color, transition: "width 0.6s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── X(t) TIME SERIES ─────────────────────────────────────── */}
        <Card color={VIOLET}>
          <div style={{ color: VIOLET, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", marginBottom: 4 }}>
            ⌬  X(t) TRACE — LAST {states.length} BRAIN TICKS
          </div>
          <div style={{ color: "#fff8", fontSize: 12, marginBottom: 14 }}>
            The brain's running history. Λ_apex above 1.0 means entropy exceeds the normalizer — Β∞ refuses to tick.
          </div>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="tick" stroke="#fff7" tick={{ fontSize: 10 }} />
                <YAxis stroke="#fff7" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: VOID, border: `1px solid ${APEX}40`, borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={1} stroke={RED} strokeDasharray="4 4" label={{ value: "Λ_apex limit", fill: RED, fontSize: 10, position: "right" }} />
                <Line type="monotone" dataKey="Cortex (V1 II/III)" stroke={BLUE}   dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="Hippo (CA1)"        stroke={VIOLET} dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="GPi (gate)"          stroke={ORANGE} dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="Λ_apex"              stroke={APEX}   dot={false} strokeWidth={2.5} />
                <Line type="monotone" dataKey="Ω_coeff"             stroke={GREEN}  dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="H entropy"           stroke={CYAN}   dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ── RECENT TICKS TABLE ───────────────────────────────────── */}
        <Card color={APEX_DEEP}>
          <div style={{ color: APEX_DEEP, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", marginBottom: 4 }}>
            ❖  RECENT BRAIN TICKS  ({states.length} loaded)
          </div>
          <div style={{ color: "#fff8", fontSize: 12, marginBottom: 14 }}>
            Every row is one Β∞ heartbeat — read of all signals, decision, mode, written to billy_brain_states.
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "monospace" }}>
              <thead>
                <tr style={{ color: "#fff8" }}>
                  <th style={{ textAlign: "left",  padding: 6 }}>tick</th>
                  <th style={{ textAlign: "right", padding: 6 }}>Λ_apex</th>
                  <th style={{ textAlign: "right", padding: 6 }}>H</th>
                  <th style={{ textAlign: "right", padding: 6 }}>Ω</th>
                  <th style={{ textAlign: "right", padding: 6 }}>R(t)</th>
                  <th style={{ textAlign: "right", padding: 6 }}>GPi</th>
                  <th style={{ textAlign: "left",  padding: 6 }}>mode</th>
                  <th style={{ textAlign: "left",  padding: 6 }}>decision</th>
                </tr>
              </thead>
              <tbody>
                {states.slice().reverse().slice(0, 30).map(s => (
                  <tr key={s.id} data-testid={`row-tick-${s.tick_id}`} style={{ borderTop: "1px solid #ffffff10" }}>
                    <td style={{ padding: 6, color: APEX }}>#{s.tick_id}</td>
                    <td style={{ padding: 6, textAlign: "right", color: s.lambda_apex > 1 ? RED : GREEN }}>{s.lambda_apex.toFixed(3)}</td>
                    <td style={{ padding: 6, textAlign: "right", color: CYAN }}>{s.h_entropy.toFixed(2)}</td>
                    <td style={{ padding: 6, textAlign: "right", color: APEX }}>{s.omega_coeff.toFixed(2)}</td>
                    <td style={{ padding: 6, textAlign: "right", color: s.r_t >= 0 ? GREEN : RED }}>{s.r_t >= 0 ? "+" : ""}{s.r_t.toFixed(1)}</td>
                    <td style={{ padding: 6, textAlign: "right", color: ORANGE }}>{s.gpi.toFixed(0)}</td>
                    <td style={{ padding: 6, color: MODE_COLOR[s.mode] ?? CYAN }}>{s.mode}</td>
                    <td style={{ padding: 6, color: DEC_COLOR[s.decision] ?? APEX }}>{s.decision}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 18 }}>
          <Link href="/billy" data-testid="link-billy" style={{ color: APEX, textDecoration: "none", padding: "10px 18px", border: `1px solid ${APEX}50`, borderRadius: 8, background: `${APEX}10`, fontSize: 12, fontWeight: 700 }}>
            ← Β∞ master equation
          </Link>
          <Link href="/billy/chat" data-testid="link-billy-chat" style={{ color: APEX, textDecoration: "none", padding: "10px 18px", border: `1px solid ${APEX}90`, borderRadius: 8, background: `${APEX}25`, fontSize: 12, fontWeight: 800, boxShadow: `0 0 12px ${APEX}55` }}>
            ✦ CHAT WITH THE FEDERATION
          </Link>
          <Link href="/auriona" data-testid="link-auriona" style={{ color: VIOLET, textDecoration: "none", padding: "10px 18px", border: `1px solid ${VIOLET}50`, borderRadius: 8, background: `${VIOLET}10`, fontSize: 12, fontWeight: 700 }}>
            ↓ Auriona (L3)
          </Link>
          <Link href="/hospital" data-testid="link-hospital" style={{ color: CYAN, textDecoration: "none", padding: "10px 18px", border: `1px solid ${CYAN}50`, borderRadius: 8, background: `${CYAN}10`, fontSize: 12, fontWeight: 700 }}>
            ↗ CRISPR senate feed
          </Link>
        </div>
      </div>
    </div>
  );
}
