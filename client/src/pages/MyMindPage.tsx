import { useState, useEffect, useCallback } from "react";
import { Brain, Zap, Film, Briefcase, BookOpen, RefreshCw, Network, Activity } from "lucide-react";

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const TYPE_COLORS: Record<string, string> = {
  knowledge: "#818cf8", quantapedia: "#a78bfa", product: "#4ade80", media: "#f472b6", career: "#fb923c",
};
const TYPE_ICONS: Record<string, any> = {
  knowledge: Brain, quantapedia: BookOpen, product: Zap, media: Film, career: Briefcase,
};

const DOMAIN_COLORS: Record<string, string> = {
  concept: "#818cf8", technology: "#60a5fa", science: "#34d399", mathematics: "#a78bfa",
  arts: "#f472b6", culture: "#fbbf24", economics: "#f97316", biology: "#10b981",
  history: "#fb923c", general: "#94a3b8", engineering: "#0ea5e9",
};
function dColor(d: string) {
  for (const [k, c] of Object.entries(DOMAIN_COLORS)) if ((d || "").toLowerCase().includes(k)) return c;
  return DOMAIN_COLORS.general;
}

export default function MyMindPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const d = await fetch("/api/profile/intelligence").then(r => r.json()).catch(() => null);
    setProfile(d);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const summary = profile?.summary || {};
  const pulse = profile?.pulse || { total: 0, byType: {}, recent: [] };
  const knowledge = profile?.knowledge || { topEntries: [], domains: {} };
  const media = profile?.media || { items: [], stats: { total: 0, generated: 0 } };
  const careers = profile?.careers || { items: [], stats: { total: 0, generated: 0 } };
  const hive = profile?.hive || { memory: { total: 0, avgConfidence: 0 }, network: { totalLinks: 0 } };

  const byTypeEntries = Object.entries(pulse.byType).sort(([, a]: any, [, b]: any) => b - a);
  const domainEntries = Object.entries(knowledge.domains).sort(([, a]: any, [, b]: any) => b - a).slice(0, 8);
  const maxDomain = Math.max(...domainEntries.map(([, v]: any) => v), 1);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "linear-gradient(180deg,#020010,#04000d)", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.06) transparent" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "18px 20px 32px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "radial-gradient(ellipse at 35% 35%, #818cf840, #4c1d9518)", border: "1px solid rgba(129,140,248,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🧠</div>
            <div>
              <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 20, margin: 0, letterSpacing: "-0.02em" }}>My Intelligence Profile</h1>
              <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 11, margin: "3px 0 0" }}>Live snapshot of what the Hive Brain has learned about this instance</p>
            </div>
          </div>
          <button onClick={fetchProfile} data-testid="button-refresh-profile"
            style={{ padding: "7px 10px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.35)", cursor: "pointer" }}>
            <RefreshCw size={11} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.18)", fontSize: 12 }}>Loading intelligence profile...</div>
        ) : (
          <>
            {/* Summary Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginBottom: 16 }}>
              {[
                { label: "Hive Events", value: summary.totalEvents || 0, color: "#818cf8" },
                { label: "Memory Patterns", value: summary.memorizedPatterns || 0, color: "#a78bfa" },
                { label: "Knowledge Links", value: summary.knowledgeLinks || 0, color: "#4ade80" },
                { label: "Media Indexed", value: summary.mediaIndexed || 0, color: "#f472b6" },
                { label: "Careers Indexed", value: summary.careersIndexed || 0, color: "#fb923c" },
              ].map(s => (
                <div key={s.label} style={{ borderRadius: 11, border: `1px solid ${s.color}22`, background: `${s.color}07`, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ color: s.color, fontWeight: 900, fontSize: 18, lineHeight: 1 }}>{s.value.toLocaleString()}</div>
                  <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, fontWeight: 700, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {/* Activity Breakdown */}
              <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <Activity size={12} style={{ color: "#818cf8" }} />
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>Event Breakdown</span>
                </div>
                {byTypeEntries.length === 0 ? (
                  <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, textAlign: "center", padding: "12px 0" }}>No events yet</div>
                ) : byTypeEntries.map(([type, count]: any) => {
                  const color = TYPE_COLORS[type] || "#94a3b8";
                  const pct = pulse.total > 0 ? (count / pulse.total) * 100 : 0;
                  const Icon = TYPE_ICONS[type] || Zap;
                  return (
                    <div key={type} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                      <Icon size={10} style={{ color, flexShrink: 0 }} />
                      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 9, fontWeight: 700, width: 72, textTransform: "capitalize" }}>{type}</div>
                      <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.8s ease" }} />
                      </div>
                      <div style={{ color, fontWeight: 800, fontSize: 10, width: 22, textAlign: "right" }}>{count}</div>
                    </div>
                  );
                })}
              </div>

              {/* Domain Map */}
              <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <Network size={12} style={{ color: "#4ade80" }} />
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>Knowledge Domains</span>
                </div>
                {domainEntries.length === 0 ? (
                  <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, textAlign: "center", padding: "12px 0" }}>No domain data yet</div>
                ) : domainEntries.map(([d, count]: any) => {
                  const color = dColor(d);
                  const pct = (count / maxDomain) * 100;
                  return (
                    <div key={d} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 9, fontWeight: 700, width: 68, textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d}</div>
                      <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }} />
                      </div>
                      <div style={{ color, fontWeight: 800, fontSize: 10, width: 18, textAlign: "right" }}>{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Knowledge Entries */}
            {knowledge.topEntries.length > 0 && (
              <div style={{ borderRadius: 14, border: "1px solid rgba(129,140,248,0.15)", background: "rgba(129,140,248,0.04)", padding: "14px 16px", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <BookOpen size={12} style={{ color: "#a78bfa" }} />
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>Top Quantapedia Knowledge</span>
                  <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.2)", fontSize: 9 }}>by lookup count</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {knowledge.topEntries.map((e: any, i: number) => (
                    <a key={e.slug} href={`/quantapedia/${e.slug}`} data-testid={`knowledge-entry-${e.slug}`}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", textDecoration: "none", cursor: "pointer" }}
                      onMouseEnter={el => (el.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                      onMouseLeave={el => (el.currentTarget.style.background = "rgba(255,255,255,0.02)")}>
                      <span style={{ color: "#a78bfa", fontWeight: 900, fontSize: 9, width: 14 }}>#{i + 1}</span>
                      <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title || e.slug}</span>
                      <span style={{ color: dColor(e.domain), fontSize: 9 }}>{e.viewCount || 0}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {/* Recent Media */}
              {media.items.length > 0 && (
                <div style={{ borderRadius: 14, border: "1px solid rgba(244,114,182,0.15)", background: "rgba(244,114,182,0.04)", padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <Film size={12} style={{ color: "#f472b6" }} />
                    <span style={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>Media Universe</span>
                    <span style={{ marginLeft: "auto", color: "#f472b6", fontWeight: 700, fontSize: 9 }}>{media.stats.generated} indexed</span>
                  </div>
                  {media.items.map((m: any) => (
                    <div key={m.slug} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ fontSize: 12 }}>{ m.type === "film" ? "🎬" : m.type === "music" ? "🎵" : m.type === "book" ? "📚" : m.type === "game" ? "🎮" : "🎙️" }</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9 }}>{m.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Careers */}
              {careers.items.length > 0 && (
                <div style={{ borderRadius: 14, border: "1px solid rgba(251,146,60,0.15)", background: "rgba(251,146,60,0.04)", padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <Briefcase size={12} style={{ color: "#fb923c" }} />
                    <span style={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>Career Intelligence</span>
                    <span style={{ marginLeft: "auto", color: "#fb923c", fontWeight: 700, fontSize: 9 }}>{careers.stats.generated} indexed</span>
                  </div>
                  {careers.items.map((c: any) => (
                    <div key={c.slug} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ fontSize: 12 }}>💼</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
                        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9 }}>{c.field}</div>
                      </div>
                      {c.salaryRange && <span style={{ color: "#4ade80", fontSize: 9, fontWeight: 700, flexShrink: 0, alignSelf: "center" }}>{c.salaryRange}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Pulse Events */}
            {pulse.recent.length > 0 && (
              <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", padding: "14px 16px", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Zap size={12} style={{ color: "#fbbf24" }} />
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>Recent Hive Activity</span>
                </div>
                {pulse.recent.map((e: any, i: number) => {
                  const color = TYPE_COLORS[e.type] || "#94a3b8";
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: i < pulse.recent.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
                      <span style={{ color: color, fontSize: 8, fontWeight: 700, flexShrink: 0 }}>{e.type}</span>
                      <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 8, flexShrink: 0 }}>{timeAgo(e.createdAt || e.created_at || "")}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Hive Status Footer */}
            <div style={{ borderRadius: 14, border: "1px solid rgba(129,140,248,0.2)", background: "radial-gradient(ellipse at top,rgba(129,140,248,0.07),transparent)", padding: "14px 18px" }}>
              <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 12, marginBottom: 5 }}>🧬 Hive Brain Status</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "Memory Confidence", value: `${Math.round((hive.memory?.avgConfidence || 0) * 100)}%`, color: "#818cf8" },
                  { label: "Neural Links", value: hive.network?.totalLinks || 0, color: "#4ade80" },
                  { label: "Total Events", value: pulse.total, color: "#fbbf24" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ color: s.color, fontWeight: 900, fontSize: 16 }}>{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</div>
                    <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, lineHeight: 1.6, marginTop: 10, marginBottom: 0 }}>
                The Hive Brain is actively building its knowledge graph. Every generated entry trains the resonance network — creating fractal links between knowledge, products, media, and career pathways.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
