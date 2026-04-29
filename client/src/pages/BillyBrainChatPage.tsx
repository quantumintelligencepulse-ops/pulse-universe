import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

const APEX = "#FFD166";
const VIOLET = "#a78bfa";
const CYAN = "#22d3ee";
const GREEN = "#00ff9d";
const VOID = "#05030c";

type Brain = {
  brain_id: string; name: string; personality: string;
  gate_base: number; risk_pref: string; elo: number; status: string;
  family_name?: string; motto?: string; school_name?: string;
};

type Msg = { role: "user" | "assistant"; content: string; brain?: string };

const COLOR_FOR_PERSONA: Record<string, string> = {
  "conservative-sage":   "#FFD166",
  "balanced-strategist": "#a78bfa",
  "aggressive-explorer": "#fb923c",
  "forager-trickster":   "#22d3ee",
  "deep-sage":           "#c084fc",
  "volatile-prodigy":    "#f87171",
  "guardian-watcher":    "#00ff9d",
};

export default function BillyBrainChatPage() {
  const { data: brainsData } = useQuery<{ brains: Brain[]; count: number }>({
    queryKey: ["/api/billy/brains"],
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
  const { data: fedStatus } = useQuery<any>({
    queryKey: ["/api/billy/federation/status"],
    refetchInterval: 10_000,
  });

  const brains = brainsData?.brains ?? [];
  const [selected, setSelected] = useState<string>(""); // "" = federation collective
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages.length]);

  async function send() {
    const msg = input.trim();
    if (!msg || pending) return;
    setInput("");
    const newMsgs: Msg[] = [...messages, { role: "user", content: msg }];
    setMessages(newMsgs);
    setPending(true);
    try {
      const r = await fetch("/api/billy/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          brainId: selected || undefined,
          history: newMsgs.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const j = await r.json();
      setMessages([...newMsgs, { role: "assistant", content: j.reply || "(silence)", brain: j.brain }]);
    } catch (e: any) {
      setMessages([...newMsgs, { role: "assistant", content: `[error] ${e?.message || e}` }]);
    } finally { setPending(false); }
  }

  const activeBrain = brains.find(b => b.brain_id === selected);
  const accent = activeBrain ? (COLOR_FOR_PERSONA[activeBrain.personality] || APEX) : APEX;

  return (
    <div style={{ minHeight: "100vh", background: VOID, color: "#e2e8f0", padding: "24px 18px" }} data-testid="page-billy-brain-chat">
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
          <Link href="/billy/brain" data-testid="link-back-billy">
            <div style={{ padding: "6px 12px", border: `1px solid ${APEX}55`, borderRadius: 8, fontSize: 12, color: APEX, cursor: "pointer", letterSpacing: "0.1em", fontWeight: 700 }}>← BACK TO BRAIN</div>
          </Link>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: APEX, letterSpacing: "0.04em", textShadow: `0 0 20px ${APEX}55` }} data-testid="text-page-title">
            Billy Brain · Federation Chat
          </h1>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, fontSize: 11, color: "#fff9", fontFamily: "monospace" }}>
            <span data-testid="status-fed-running">FED: {fedStatus?.federation?.running ? "ON" : "OFF"}</span>
            <span data-testid="status-fed-brains">BRAINS: {fedStatus?.federation?.brainsActive ?? "?"}</span>
            <span data-testid="status-fed-ticks">TICKS: {fedStatus?.federation?.ticksTotal ?? "?"}</span>
            <span data-testid="status-phase2">Φ2: {fedStatus?.phase2?.running ? "ON" : "OFF"}</span>
            <span data-testid="status-phase3">⌬3: {fedStatus?.phase3?.running ? "ON" : "OFF"}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18 }}>
          {/* Left: brain roster */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${APEX}33`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 10, color: `${APEX}cc`, letterSpacing: "0.18em", fontWeight: 800, marginBottom: 10 }}>FEDERATION ROSTER</div>
            <div onClick={() => setSelected("")} data-testid="brain-card-federation" style={{
              padding: 12, marginBottom: 8, borderRadius: 10, cursor: "pointer",
              background: selected === "" ? `${APEX}22` : "rgba(255,255,255,0.025)",
              border: `1px solid ${selected === "" ? APEX : APEX + "33"}`,
            }}>
              <div style={{ color: APEX, fontWeight: 800, fontSize: 14 }}>Federation (collective)</div>
              <div style={{ color: "#fff8", fontSize: 11, marginTop: 4 }}>All brains, majority voice</div>
            </div>
            {brains.length === 0 && (
              <div style={{ color: "#fff7", fontSize: 12, padding: 12, fontStyle: "italic" }} data-testid="text-empty-roster">
                Brains seeding... federation engine boots ~170s after server start.
              </div>
            )}
            {brains.map(b => {
              const c = COLOR_FOR_PERSONA[b.personality] || APEX;
              const sel = selected === b.brain_id;
              return (
                <div key={b.brain_id} onClick={() => setSelected(b.brain_id)} data-testid={`brain-card-${b.name.toLowerCase()}`} style={{
                  padding: 12, marginBottom: 8, borderRadius: 10, cursor: "pointer",
                  background: sel ? `${c}22` : "rgba(255,255,255,0.025)",
                  border: `1px solid ${sel ? c : c + "33"}`,
                  transition: "all 0.15s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ color: c, fontWeight: 800, fontSize: 15 }}>{b.name}</div>
                    <div style={{ color: c, fontSize: 11, fontFamily: "monospace", opacity: 0.85 }}>ELO {b.elo}</div>
                  </div>
                  <div style={{ color: "#fffa", fontSize: 10, marginTop: 3, fontFamily: "monospace" }} data-testid={`text-brain-id-${b.name.toLowerCase()}`}>{b.brain_id}</div>
                  <div style={{ color: "#fff7", fontSize: 11, marginTop: 4 }}>{b.personality}</div>
                  {b.family_name && <div style={{ color: "#fff6", fontSize: 10, marginTop: 3, fontStyle: "italic" }}>{b.family_name}</div>}
                  {b.motto && <div style={{ color: `${c}aa`, fontSize: 10, marginTop: 2 }}>"{b.motto}"</div>}
                  <div style={{ display: "flex", gap: 6, marginTop: 6, fontSize: 9, color: "#fff7", fontFamily: "monospace" }}>
                    <span>gate {b.gate_base?.toFixed?.(2)}</span>
                    <span>·</span>
                    <span>{b.risk_pref}</span>
                    <span>·</span>
                    <span style={{ color: b.status === "voting" ? GREEN : "#fff7" }}>{b.status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: chat */}
          <div style={{ background: "rgba(255,255,255,0.015)", border: `1px solid ${accent}44`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
            <div style={{ paddingBottom: 12, borderBottom: `1px solid ${accent}33`, marginBottom: 12 }}>
              <div style={{ color: accent, fontSize: 14, fontWeight: 800 }} data-testid="text-active-brain-name">
                Talking to: {activeBrain?.name || "Federation (collective)"}
              </div>
              {activeBrain && (
                <div style={{ color: "#fff8", fontSize: 11, marginTop: 4 }}>
                  {activeBrain.personality} · {activeBrain.family_name} · ELO {activeBrain.elo}
                </div>
              )}
            </div>
            <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", paddingRight: 6 }} data-testid="chat-messages">
              {messages.length === 0 && (
                <div style={{ color: "#fff8", fontSize: 13, padding: 20, textAlign: "center", fontStyle: "italic" }} data-testid="text-empty-chat">
                  Ask the federation — or pick a brain on the left.<br />
                  Try: "Solomon, what should we do about overpulse?" or "Federation, is rebirth safe?"
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} data-testid={`msg-${m.role}-${i}`} style={{
                  margin: "10px 0",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: m.role === "user" ? "rgba(255,255,255,0.04)" : `${accent}11`,
                  border: m.role === "user" ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${accent}33`,
                  color: m.role === "user" ? "#e2e8f0" : "#fff",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.55,
                }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.18em", marginBottom: 6, color: m.role === "user" ? "#fff8" : accent }}>
                    {m.role === "user" ? "YOU" : (m.brain || "BILLY")}
                  </div>
                  <div style={{ fontSize: 14 }}>{m.content}</div>
                </div>
              ))}
              {pending && (
                <div style={{ margin: "10px 0", padding: "10px 14px", color: accent, fontSize: 12, fontStyle: "italic" }} data-testid="status-thinking">
                  {activeBrain?.name || "Federation"} is thinking...
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${accent}33` }}>
              <input
                type="text" value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={`Ask ${activeBrain?.name || "the federation"}...`}
                disabled={pending}
                data-testid="input-chat-message"
                style={{
                  flex: 1, padding: "11px 14px", borderRadius: 8,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${accent}55`,
                  color: "#fff", fontSize: 14, outline: "none",
                }}
              />
              <button
                onClick={send} disabled={pending || !input.trim()}
                data-testid="button-send-chat"
                style={{
                  padding: "11px 18px", borderRadius: 8,
                  background: pending ? "rgba(255,255,255,0.04)" : accent,
                  border: "none", color: pending ? "#fff7" : VOID,
                  fontWeight: 800, fontSize: 13, letterSpacing: "0.08em", cursor: pending ? "wait" : "pointer",
                }}
              >SEND</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
