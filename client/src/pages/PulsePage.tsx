import { useState, useEffect, useRef, useCallback } from "react";
import { Brain, ShoppingBag, BookOpen, Film, Briefcase, Radio, RefreshCw, Pause, Play, Activity } from "lucide-react";

const TYPE_CFG: Record<string, { label: string; color: string; Icon: any }> = {
  knowledge:   { label: "Knowledge",   color: "#818cf8", Icon: Brain },
  quantapedia: { label: "Quantapedia", color: "#a78bfa", Icon: BookOpen },
  product:     { label: "Product",     color: "#4ade80", Icon: ShoppingBag },
  media:       { label: "Media",       color: "#f472b6", Icon: Film },
  career:      { label: "Career",      color: "#fb923c", Icon: Briefcase },
};

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

function EventRow({ e, i }: { e: any; i: number }) {
  const cfg = TYPE_CFG[e.type] || TYPE_CFG.knowledge;
  const Icon = cfg.Icon;
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), Math.min(i * 25, 400)); return () => clearTimeout(t); }, [i]);
  return (
    <div data-testid={`pulse-event-${e.id}`}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)",
        opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(-6px)", transition: "opacity 0.3s ease, transform 0.3s ease" }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${cfg.color}18`, border: `1px solid ${cfg.color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={12} style={{ color: cfg.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
        <div style={{ display: "flex", gap: 5, marginTop: 1 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{cfg.label}</span>
          {e.domain && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>· {e.domain}</span>}
        </div>
      </div>
      <span style={{ flexShrink: 0, color: "rgba(255,255,255,0.18)", fontSize: 9, fontWeight: 600 }}>{timeAgo(e.createdAt || e.created_at || "")}</span>
    </div>
  );
}

export default function PulsePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [live, setLive] = useState(true);
  const streamRef = useRef<HTMLDivElement>(null);

  const fetchEvents = useCallback(async () => {
    const data = await fetch("/api/pulse/live").then(r => r.json()).catch(() => []);
    setEvents(data);
  }, []);

  useEffect(() => {
    fetchEvents();
    const id = setInterval(() => { if (live) fetchEvents(); }, 3000);
    return () => clearInterval(id);
  }, [live, fetchEvents]);

  const byType = events.reduce((acc: any, e: any) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {});
  const total = events.length;
  const typeEntries = Object.entries(byType).sort(([, a]: any, [, b]: any) => b - a);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#020010,#04000d)", overflow: "hidden", minHeight: 0 }}>
      <div style={{ padding: "14px 18px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: live ? "#4ade80" : "#94a3b8", boxShadow: live ? "0 0 8px #4ade80" : "none", animation: live ? "hbPulse 1.8s infinite" : "none" }} />
              <span style={{ color: live ? "#4ade80" : "#94a3b8", fontSize: 9, fontWeight: 800, letterSpacing: "0.14em" }}>{live ? "LIVE FEED" : "PAUSED"}</span>
            </div>
            <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 20, margin: 0, letterSpacing: "-0.02em" }}>Hive World Pulse</h1>
            <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 10, margin: "2px 0 0" }}>Every discovery the Quantum Logic Network Hive makes — in real time</p>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            <button onClick={() => setLive(l => !l)} data-testid="button-toggle-live"
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 8, border: `1px solid ${live ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}`, background: live ? "rgba(74,222,128,0.07)" : "rgba(255,255,255,0.03)", color: live ? "#4ade80" : "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
              {live ? <Pause size={9} /> : <Play size={9} />}{live ? "Pause" : "Resume"}
            </button>
            <button onClick={fetchEvents} data-testid="button-refresh-pulse"
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.35)", cursor: "pointer" }}>
              <RefreshCw size={10} />
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5, marginBottom: 10 }}>
          {Object.entries(TYPE_CFG).map(([k, cfg]) => {
            const count = byType[k] || 0;
            const Icon = cfg.Icon;
            return (
              <div key={k} style={{ borderRadius: 10, border: `1px solid ${cfg.color}25`, background: `${cfg.color}08`, padding: "8px 10px", textAlign: "center" }}>
                <Icon size={11} style={{ color: cfg.color, margin: "0 auto 4px" }} />
                <div style={{ color: cfg.color, fontWeight: 900, fontSize: 16 }}>{count}</div>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, fontWeight: 700, marginTop: 1 }}>{cfg.label}</div>
              </div>
            );
          })}
        </div>

        {typeEntries.length > 0 && (
          <div style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)", padding: "8px 12px", marginBottom: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            {typeEntries.map(([t, count]: any) => {
              const cfg = TYPE_CFG[t] || { color: "#94a3b8", label: t };
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700, width: 68, textTransform: "uppercase", letterSpacing: "0.05em" }}>{cfg.label}</div>
                  <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: cfg.color, borderRadius: 2, transition: "width 0.8s ease" }} />
                  </div>
                  <div style={{ color: cfg.color, fontSize: 10, fontWeight: 800, width: 20, textAlign: "right" }}>{count}</div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 0 }}>
          <Activity size={10} style={{ color: "rgba(255,255,255,0.2)" }} />
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 600 }}>{total} events captured across all Hive engines</span>
        </div>
      </div>

      <div ref={streamRef} style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.06) transparent" }}>
        {events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.15)", fontSize: 12 }}>Waiting for Hive activity...</div>
        ) : events.map((e: any, i: number) => <EventRow key={`${e.id || e.slug || ''}-${i}`} e={e} i={i} />)}
      </div>

      <style>{`@keyframes hbPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.4)} }`}</style>
    </div>
  );
}
