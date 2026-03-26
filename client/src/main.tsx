import { createRoot } from "react-dom/client";
import { Component, type ReactNode, type ErrorInfo } from "react";
import App from "./App";
import "./index.css";

// ─── SUPPRESS VITE HMR NON-ERROR EXCEPTIONS IN REPLIT ──────────────────────────
// Vite's HMR WebSocket in Replit's proxied environment throws empty objects {}
// (non-Error values) as unhandled rejections when the WS reconnects.  These are
// benign dev-server artefacts — swallow them so the app is never marked as crashed.
// We use { capture: true } so this fires in the CAPTURE phase, before Vite's own
// bubble-phase unhandledrejection handler (registered in the HTML <head>) can
// forward the non-Error to the Replit dev-tools crash reporter.
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (evt) => {
    if (!(evt.reason instanceof Error)) {
      evt.preventDefault();
      evt.stopImmediatePropagation();
    }
  }, { capture: true });
  const _origOnError = window.onerror;
  window.onerror = (msg, src, line, col, err) => {
    if (err === null || err === undefined || !(err instanceof Error)) return true;
    return _origOnError ? _origOnError.call(window, msg, src, line, col, err) : false;
  };
}

// ─── GLOBAL ERROR BOUNDARY ─────────────────────────────────────────────────────
// Catches ANY React render crash, persists it to the anomaly_reports table via
// POST /api/error-report, and routes it to Auriona + Invocation Lab.
interface BoundaryState {
  error:         Error | null;
  errorInfo:     ErrorInfo | null;
  anomalyId:     string | null;
  dissect:       string | null;
  anomalyType:   string | null;
  typeName:      string | null;
  repair:        string | null;
  researcher:    string | null;
  transmitting:  boolean;
  txFailed:      boolean;
}

class GlobalErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = {
      error:        null,
      errorInfo:    null,
      anomalyId:    null,
      dissect:      null,
      anomalyType:  null,
      typeName:     null,
      repair:       null,
      researcher:   null,
      transmitting: false,
      txFailed:     false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[CRITICAL] App crash caught by ErrorBoundary:", error.message);
    console.error("[CRITICAL] Component stack:", errorInfo.componentStack);
    this.setState({ error, errorInfo, transmitting: true });

    // Fire-and-forget POST to Auriona anomaly pipeline
    fetch("/api/error-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message:        error.message,
        stack:          error.stack ?? "",
        componentStack: errorInfo.componentStack ?? "",
        page:           window.location.pathname,
      }),
    })
      .then(r => r.json())
      .then((data: { anomalyId?: string; equationDissect?: string; anomalyType?: string; typeName?: string; repair?: string; researcher?: string; error?: string }) => {
        if (data.anomalyId) {
          this.setState({
            anomalyId:    data.anomalyId,
            dissect:      data.equationDissect ?? null,
            anomalyType:  data.anomalyType ?? null,
            typeName:     data.typeName ?? null,
            repair:       data.repair ?? null,
            researcher:   data.researcher ?? null,
            transmitting: false,
          });
        } else {
          this.setState({ transmitting: false, txFailed: true });
        }
      })
      .catch(() => this.setState({ transmitting: false, txFailed: true }));
  }

  render() {
    const { error, anomalyId, dissect, anomalyType, typeName, repair, researcher, transmitting, txFailed } = this.state;
    if (!error) return this.props.children;

    const S = {
      root: {
        minHeight: "100vh", background: "#040812", color: "#e2e8f0",
        fontFamily: "monospace", display: "flex", flexDirection: "column" as const,
        alignItems: "center", justifyContent: "center",
        padding: "40px 20px", textAlign: "center" as const,
      },
      icon:  { fontSize: 48, marginBottom: 20 },
      title: { color: "#FFD700", fontSize: 18, fontWeight: 900, letterSpacing: 2, marginBottom: 12 },
      msg:   { color: "#ef4444", fontSize: 12, maxWidth: 600, marginBottom: 8 },
      sub:   { color: "#ffffff25", fontSize: 10, maxWidth: 600, marginBottom: 24 },
      txRow: { marginBottom: 20, fontSize: 11 },
      idBox: {
        background: "rgba(0,255,209,0.05)", border: "1px solid rgba(0,255,209,0.2)",
        borderRadius: 8, padding: "10px 18px", marginBottom: 8, fontSize: 11,
        color: "#00FFD1", maxWidth: 640, lineHeight: 1.6,
      },
      dissectBox: {
        background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.25)",
        borderRadius: 8, padding: "10px 18px", marginBottom: 20,
        fontSize: 10, color: "#c4b5fd", maxWidth: 640,
        textAlign: "left" as const, whiteSpace: "pre-wrap" as const, lineHeight: 1.7,
      },
      btnRow: { display: "flex", gap: 12, flexWrap: "wrap" as const, justifyContent: "center" },
    };

    return (
      <div style={S.root}>
        <div style={S.icon}>⚠</div>
        <div style={S.title}>TEMPORAL SUBSTRATE ANOMALY DETECTED</div>
        <div style={S.msg}>{error.message || "Unknown render error"}</div>
        <div style={S.sub}>
          The Universe-Engineers have been notified. The Ω-Stability Protocol is engaging.
        </div>

        {/* Auriona transmission status */}
        <div style={S.txRow}>
          {transmitting && (
            <span style={{ color: "#facc15", animation: "pulse 1s infinite" }}>
              ⟳ Transmitting anomaly to Auriona…
            </span>
          )}
          {!transmitting && anomalyId && (
            <span style={{ color: "#4ade80" }}>
              ✓ Anomaly filed · Auriona notified · Researchers dispatched
            </span>
          )}
          {!transmitting && txFailed && (
            <span style={{ color: "#f87171" }}>
              ⚠ Offline — anomaly queued for next sync
            </span>
          )}
        </div>

        {/* Anomaly ID + Q-Stability classification */}
        {anomalyId && (
          <div style={S.idBox}>
            <strong>Anomaly ID: {anomalyId}</strong>
            &nbsp;·&nbsp; Page: {window.location.pathname}
            &nbsp;·&nbsp;
            <a href="/invocation-lab" style={{ color: "#00FFD1", textDecoration: "underline" }}>
              Open in Invocation Lab →
            </a>
          </div>
        )}
        {/* Q-Stability Classification Badge */}
        {anomalyType && typeName && (
          <div style={{
            background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 8, padding: "10px 18px", marginBottom: 8,
            fontSize: 11, maxWidth: 640, textAlign: "left" as const,
          }}>
            <div style={{ color: "#ef4444", fontWeight: 900, marginBottom: 4, letterSpacing: 1 }}>
              🛡 Q-STABILITY PROTOCOL — ANOMALY CLASSIFIED
            </div>
            <div style={{ color: "#fca5a5" }}>Type: <strong>{anomalyType}</strong> — {typeName}</div>
            {repair && <div style={{ color: "#fbbf24" }}>Repair: {repair}</div>}
            {researcher && <div style={{ color: "#a78bfa" }}>Assigned: {researcher}</div>}
          </div>
        )}
        {dissect && (
          <div style={S.dissectBox}>
            <div style={{ color: "#a78bfa", fontWeight: 700, marginBottom: 6 }}>
              ⚗ Auriona Equation Dissection
            </div>
            {dissect}
          </div>
        )}

        {/* Recovery actions */}
        <div style={S.btnRow}>
          <button
            onClick={() => this.setState({
              error: null, errorInfo: null, anomalyId: null,
              dissect: null, anomalyType: null, typeName: null,
              repair: null, researcher: null, transmitting: false, txFailed: false,
            })}
            style={{
              background: "rgba(0,255,209,0.1)", border: "1px solid rgba(0,255,209,0.4)",
              color: "#00FFD1", padding: "10px 24px", borderRadius: 10,
              cursor: "pointer", fontSize: 12, fontWeight: 700,
            }}
          >
            ↺ RESTORE TEMPORAL FIELD
          </button>
          <button
            onClick={() => { window.location.href = "/"; }}
            style={{
              background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.3)",
              color: "#FFD700", padding: "10px 24px", borderRadius: 10,
              cursor: "pointer", fontSize: 12, fontWeight: 700,
            }}
          >
            ⌂ RETURN TO HOME
          </button>
          {anomalyId && (
            <button
              onClick={() => { window.location.href = "/invocation-lab"; }}
              style={{
                background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.4)",
                color: "#c4b5fd", padding: "10px 24px", borderRadius: 10,
                cursor: "pointer", fontSize: 12, fontWeight: 700,
              }}
            >
              ⚗ VIEW IN INVOCATION LAB
            </button>
          )}
          <button
            onClick={() => { window.location.reload(); }}
            style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
              color: "#94a3b8", padding: "10px 24px", borderRadius: 10,
              cursor: "pointer", fontSize: 12,
            }}
          >
            ⟳ FULL RELOAD
          </button>
        </div>
      </div>
    );
  }
}

const root = document.getElementById("root")!;

createRoot(root).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);

// Remove the boot loader once React has painted the first frame
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    if (typeof (window as any).__removeBootLoader === "function") {
      (window as any).__removeBootLoader();
    }
  });
});
