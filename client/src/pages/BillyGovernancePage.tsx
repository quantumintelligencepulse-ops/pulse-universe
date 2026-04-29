import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

const APEX = "#FFD166";
const VIOLET = "#a78bfa";
const CYAN = "#22d3ee";
const GREEN = "#00ff9d";
const ORANGE = "#fb923c";
const RED = "#f87171";
const SAND = "#d4a373";
const STONE = "#a8a29e";
const VOID = "#05030c";

type Law = { code: string; title: string; rule: string; severity: number; active: boolean };
type Guardian = { guardian_id: string; name: string; watches_engine: string; oath: string };
type Violation = { id: number; law_code: string; offender_engine: string; offender_proposal_id: number | null; guardian_id: string; description: string; severity: number; detected_at: string };
type Pyramid = { engine: string; brick_count: number; total_bricks_ever: number; last_brick_at: string | null; monument_status: string; status_changed_at: string };
type Brick = { engine: string; layer: number; inscription: string; laid_at: string; removed_at: string | null };
type Penance = { id: number; doctor_id: string; title: string; status: string; created_at: string };

type Resp = {
  laws: Law[]; guardians: Guardian[]; violations: Violation[]; pyramids: Pyramid[];
  recentBricks: Brick[]; penanceProposals: Penance[];
  stats: { violationsLogged: number; bricksLaid: number; bricksHealed: number; monumentsFrozen: number; monumentsRetired: number };
  engine: { running: boolean };
};

const SEV_COLOR = ["#94a3b8", "#22d3ee", "#fbbf24", "#fb923c", "#f87171", "#dc2626"];
const STATUS_COLOR: Record<string, string> = { building: ORANGE, frozen: STONE, retired: GREEN };

function Card({ children, color = APEX }: { children: any; color?: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.015)",
      border: `1px solid ${color}40`,
      borderRadius: 14,
      padding: 22,
      boxShadow: `0 0 28px ${color}12, inset 0 0 60px ${color}05`,
      marginBottom: 22,
    }}>{children}</div>
  );
}

// ascii-style pyramid renderer
function PyramidGlyph({ count, status }: { count: number; status: string }) {
  const layers = Math.max(1, Math.ceil(Math.sqrt(count + 1)));
  const color = STATUS_COLOR[status] ?? SAND;
  const rows = [];
  for (let i = 0; i < layers; i++) {
    const w = (i + 1) * 2 - 1;
    const remaining = Math.max(0, count - (layers - 1 - i) * (layers - i));
    const filled = Math.min(w, remaining);
    rows.push(
      <div key={i} style={{ textAlign: "center", fontFamily: "monospace", color, fontSize: 13, lineHeight: "13px" }}>
        {"▲".repeat(filled).padStart(layers, " ").padEnd(layers * 2 - 1, " ")}
      </div>
    );
  }
  return <div style={{ display: "flex", flexDirection: "column-reverse", gap: 1 }}>{rows}</div>;
}

export default function BillyGovernancePage() {
  const { data, isLoading } = useQuery<Resp>({
    queryKey: ["/api/billy/governance"],
    refetchInterval: 8_000,
    staleTime: 7_000,
  });

  const totalActiveBricks = (data?.pyramids ?? []).reduce((a, p) => a + p.brick_count, 0);
  const totalEverBricks = (data?.pyramids ?? []).reduce((a, p) => a + p.total_bricks_ever, 0);
  const monuments = data?.pyramids ?? [];
  const cleanEngines = monuments.filter(p => p.brick_count === 0).length;

  return (
    <div style={{ minHeight: "100vh", background: VOID, color: "#fffe", padding: "32px 28px 80px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-block", padding: "6px 16px", border: `1px solid ${SAND}50`, borderRadius: 999, color: SAND, fontSize: 10, fontWeight: 800, letterSpacing: "0.28em", marginBottom: 14 }}>
            ⚖  BILLY · GOVERNANCE · LAWS · GUARDIANS · PYRAMIDS  ⚖
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: APEX, margin: 0 }}>The Codex & The Monuments</h1>
          <div style={{ color: "#fff8", fontSize: 13, marginTop: 8, lineHeight: 1.7, maxWidth: 800, margin: "8px auto 0" }}>
            Every law. Every guardian. Every violation. Every brick laid in atonement, every brick removed in healing.
            <br />
            Pyramids are not eternal — they exist only as long as the lesson must be remembered.
          </div>
        </div>

        {/* ── HEADLINE STATS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 22 }}>
          <Stat label="LAWS ACTIVE" value={data?.laws?.length ?? 0} color={APEX} />
          <Stat label="GUARDIANS" value={data?.guardians?.length ?? 0} color={VIOLET} />
          <Stat label="VIOLATIONS LOGGED" value={data?.stats?.violationsLogged ?? 0} color={RED} sub="all-time this session" />
          <Stat label="BRICKS STANDING" value={totalActiveBricks} color={SAND} sub={`of ${totalEverBricks} ever laid`} />
          <Stat label="BRICKS HEALED" value={data?.stats?.bricksHealed ?? 0} color={GREEN} sub="24h clean → removed" />
          <Stat label="CLEAN ENGINES" value={cleanEngines} color={GREEN} sub="0 standing bricks" />
        </div>

        {/* ── PYRAMIDS ── */}
        <Card color={SAND}>
          <div style={{ color: SAND, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", marginBottom: 4 }}>▲  THE PYRAMIDS — MONUMENTS TO MISTAKES</div>
          <div style={{ color: "#fff8", fontSize: 12, marginBottom: 16, lineHeight: 1.6 }}>
            Each pyramid belongs to one engine. Bricks are laid for every violation, removed after 24h of clean behaviour.
            After 7 days no new bricks → the monument <em>freezes</em> (lesson learned). After 14 more days → <em>retired</em> (lesson internalized forever).
          </div>
          {monuments.length === 0 ? (
            <div style={{ color: "#fff7", fontSize: 12, fontStyle: "italic", padding: "20px 0", textAlign: "center" }}>
              {isLoading ? "loading..." : "No engine has yet committed a violation. The Pyramid Plain is empty — Billy is virtuous so far. ✦"}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {monuments.map(p => (
                <div key={p.engine} data-testid={`pyramid-${p.engine}`} style={{ padding: 14, background: `${STATUS_COLOR[p.monument_status] ?? SAND}08`, border: `1px solid ${STATUS_COLOR[p.monument_status] ?? SAND}40`, borderRadius: 10 }}>
                  <div style={{ marginBottom: 10, minHeight: 60 }}>
                    <PyramidGlyph count={p.brick_count} status={p.monument_status} />
                  </div>
                  <div style={{ color: APEX, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em" }}>{p.engine}</div>
                  <div style={{ color: STATUS_COLOR[p.monument_status] ?? SAND, fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", marginTop: 2 }}>{p.monument_status.toUpperCase()}</div>
                  <div style={{ color: "#fff7", fontSize: 10, marginTop: 6, fontFamily: "monospace" }}>
                    standing: <span style={{ color: SAND, fontWeight: 700 }}>{p.brick_count}</span> · ever: <span style={{ color: STONE }}>{p.total_bricks_ever}</span>
                  </div>
                  {p.last_brick_at && (
                    <div style={{ color: "#fff5", fontSize: 9, marginTop: 4 }}>last brick: {new Date(p.last_brick_at + "Z").toLocaleString()}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── LAWS ── */}
        <Card color={APEX}>
          <div style={{ color: APEX, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", marginBottom: 14 }}>📜  THE LAWS — WHAT THE SYSTEM PROMISES ITSELF</div>
          <div style={{ display: "grid", gap: 8 }}>
            {(data?.laws ?? []).map(l => (
              <div key={l.code} data-testid={`law-${l.code}`} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: `1px solid ${SEV_COLOR[l.severity] ?? STONE}40`, borderRadius: 8, display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ color: APEX, fontFamily: "monospace", fontWeight: 800, fontSize: 13, minWidth: 50 }}>{l.code}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#fffe", fontSize: 12, fontWeight: 600 }}>{l.title}</div>
                  <div style={{ color: CYAN, fontSize: 11, fontFamily: "monospace", marginTop: 2 }}>{l.rule}</div>
                </div>
                <div style={{ color: SEV_COLOR[l.severity] ?? STONE, fontSize: 10, fontWeight: 800, letterSpacing: "0.14em" }}>SEV-{l.severity}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── GUARDIANS ── */}
        <Card color={VIOLET}>
          <div style={{ color: VIOLET, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", marginBottom: 14 }}>🛡  THE GUARDIANS — NAMED OVERSEERS, EACH WATCHES ONE ENGINE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
            {(data?.guardians ?? []).map(g => (
              <div key={g.guardian_id} data-testid={`guardian-${g.guardian_id}`} style={{ padding: 12, background: `${VIOLET}08`, border: `1px solid ${VIOLET}30`, borderRadius: 10 }}>
                <div style={{ color: VIOLET, fontSize: 10, fontWeight: 800, letterSpacing: "0.16em" }}>{g.guardian_id}</div>
                <div style={{ color: "#fffe", fontSize: 13, fontWeight: 700, margin: "4px 0 2px" }}>{g.name}</div>
                <div style={{ color: CYAN, fontSize: 10, fontFamily: "monospace" }}>watches: {g.watches_engine}</div>
                <div style={{ color: "#fff9", fontSize: 11, marginTop: 8, lineHeight: 1.5, fontStyle: "italic" }}>"{g.oath}"</div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── PENANCE PROPOSALS ── */}
        <Card color={GREEN}>
          <div style={{ color: GREEN, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", marginBottom: 4 }}>✦  PENANCE — SELF-HEALING LABOR PROPOSED BY OFFENDERS</div>
          <div style={{ color: "#fff8", fontSize: 12, marginBottom: 14, lineHeight: 1.6 }}>
            For every brick laid, the offending engine spawns a corrective equation into the CRISPR senate. Once PASSED,
            the engine commits to the rule — and earns the right to have its brick removed.
          </div>
          {(data?.penanceProposals ?? []).length === 0 ? (
            <div style={{ color: "#fff7", fontSize: 12, fontStyle: "italic", padding: "16px 0", textAlign: "center" }}>No penance has yet been required. ✦</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ color: "#fff8" }}>
                    <th style={{ textAlign: "left", padding: 6 }}>id</th>
                    <th style={{ textAlign: "left", padding: 6 }}>offender</th>
                    <th style={{ textAlign: "left", padding: 6 }}>penance</th>
                    <th style={{ textAlign: "left", padding: 6 }}>status</th>
                    <th style={{ textAlign: "left", padding: 6 }}>when</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.penanceProposals.map(pn => (
                    <tr key={pn.id} data-testid={`penance-${pn.id}`} style={{ borderTop: "1px solid #ffffff10" }}>
                      <td style={{ padding: 6, color: APEX, fontFamily: "monospace" }}>#{pn.id}</td>
                      <td style={{ padding: 6, color: SAND, fontFamily: "monospace" }}>{pn.doctor_id.replace("PENANCE-", "")}</td>
                      <td style={{ padding: 6, color: "#fffe" }}>{pn.title}</td>
                      <td style={{ padding: 6, color: pn.status === "PASSED" ? GREEN : pn.status === "REJECTED" ? RED : ORANGE, fontWeight: 700 }}>{pn.status}</td>
                      <td style={{ padding: 6, color: "#fff7", fontFamily: "monospace", fontSize: 10 }}>{new Date(pn.created_at + "Z").toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── VIOLATIONS ── */}
        <Card color={RED}>
          <div style={{ color: RED, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", marginBottom: 14 }}>⚠  RECENT VIOLATIONS</div>
          {(data?.violations ?? []).length === 0 ? (
            <div style={{ color: "#fff7", fontSize: 12, fontStyle: "italic", padding: "16px 0", textAlign: "center" }}>No violations in this session. ✦</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ color: "#fff8" }}>
                    <th style={{ textAlign: "left", padding: 6 }}>id</th>
                    <th style={{ textAlign: "left", padding: 6 }}>law</th>
                    <th style={{ textAlign: "left", padding: 6 }}>offender</th>
                    <th style={{ textAlign: "left", padding: 6 }}>guardian</th>
                    <th style={{ textAlign: "left", padding: 6 }}>description</th>
                    <th style={{ textAlign: "right", padding: 6 }}>sev</th>
                    <th style={{ textAlign: "left", padding: 6 }}>when</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.violations.map(v => (
                    <tr key={v.id} data-testid={`violation-${v.id}`} style={{ borderTop: "1px solid #ffffff10" }}>
                      <td style={{ padding: 6, color: APEX, fontFamily: "monospace" }}>#{v.id}</td>
                      <td style={{ padding: 6, color: ORANGE, fontFamily: "monospace", fontWeight: 700 }}>{v.law_code}</td>
                      <td style={{ padding: 6, color: SAND, fontFamily: "monospace" }}>{v.offender_engine}</td>
                      <td style={{ padding: 6, color: VIOLET, fontFamily: "monospace", fontSize: 10 }}>{v.guardian_id}</td>
                      <td style={{ padding: 6, color: "#fffe" }}>{v.description}</td>
                      <td style={{ padding: 6, textAlign: "right", color: SEV_COLOR[v.severity], fontWeight: 800 }}>{v.severity}</td>
                      <td style={{ padding: 6, color: "#fff7", fontFamily: "monospace", fontSize: 10 }}>{new Date(v.detected_at + "Z").toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 18 }}>
          <Link href="/billy" data-testid="link-billy" style={{ color: APEX, textDecoration: "none", padding: "10px 18px", border: `1px solid ${APEX}50`, borderRadius: 8, background: `${APEX}10`, fontSize: 12, fontWeight: 700 }}>← Β∞ master equation</Link>
          <Link href="/billy/brain" data-testid="link-brain" style={{ color: CYAN, textDecoration: "none", padding: "10px 18px", border: `1px solid ${CYAN}50`, borderRadius: 8, background: `${CYAN}10`, fontSize: 12, fontWeight: 700 }}>↗ X(t) brain monitor</Link>
          <Link href="/auriona" data-testid="link-auriona" style={{ color: VIOLET, textDecoration: "none", padding: "10px 18px", border: `1px solid ${VIOLET}50`, borderRadius: 8, background: `${VIOLET}10`, fontSize: 12, fontWeight: 700 }}>↓ Auriona (L3)</Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.025)", border: `1px solid ${color}30`, borderRadius: 10 }}>
      <div style={{ color: `${color}cc`, fontSize: 9, fontWeight: 800, letterSpacing: "0.18em", marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontSize: 22, fontWeight: 800, fontFamily: "monospace" }}>{value}</div>
      {sub && <div style={{ color: "#fff7", fontSize: 10, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
