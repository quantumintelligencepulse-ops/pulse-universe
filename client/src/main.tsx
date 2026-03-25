import { createRoot } from "react-dom/client";
import { Component, type ReactNode, type ErrorInfo } from "react";
import App from "./App";
import "./index.css";

// ─── GLOBAL ERROR BOUNDARY ─────────────────────────────────────────────────────
// Catches ANY React render crash and shows a recovery screen instead of blank page
class GlobalErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null; errorInfo: ErrorInfo | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[CRITICAL] App crash caught by ErrorBoundary:", error.message);
    console.error("[CRITICAL] Component stack:", errorInfo.componentStack);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.error) {
      const { error } = this.state;
      return (
        <div style={{
          minHeight: "100vh",
          background: "#040812",
          color: "#e2e8f0",
          fontFamily: "monospace",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⚠</div>
          <div style={{ color: "#FFD700", fontSize: 18, fontWeight: 900, letterSpacing: 2, marginBottom: 12 }}>
            TEMPORAL SUBSTRATE ANOMALY DETECTED
          </div>
          <div style={{ color: "#ef4444", fontSize: 12, maxWidth: 600, marginBottom: 8 }}>
            {error.message || "Unknown render error"}
          </div>
          <div style={{ color: "#ffffff25", fontSize: 10, maxWidth: 600, marginBottom: 32 }}>
            The Universe-Engineers have been notified. The Ω-Stability Protocol is engaging.
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => { this.setState({ error: null, errorInfo: null }); }}
              style={{ background: "rgba(0,255,209,0.1)", border: "1px solid rgba(0,255,209,0.4)", color: "#00FFD1", padding: "10px 24px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700 }}
            >
              ↺ RESTORE TEMPORAL FIELD
            </button>
            <button
              onClick={() => { window.location.href = "/"; }}
              style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.3)", color: "#FFD700", padding: "10px 24px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700 }}
            >
              ⌂ RETURN TO HOME
            </button>
            <button
              onClick={() => { window.location.reload(); }}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "#94a3b8", padding: "10px 24px", borderRadius: 10, cursor: "pointer", fontSize: 12 }}
            >
              ⟳ FULL RELOAD
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);
