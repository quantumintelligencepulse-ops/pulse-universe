import { useState, useEffect } from "react";
import PulseNetPage from "./PulseNetPage";
import CorporationsListPage from "./CorporationsListPage";
import HiveMarketplacePage from "./HiveMarketplacePage";
import { useDomainPing } from "@/lib/universeResonance";

const GOLD   = "#F5C518";
const CYAN   = "#00FFD1";
const VIOLET = "#a78bfa";
const AMBER  = "#f59e0b";
const PINK   = "#f472b8";

const TABS = [
  { id: "social",  label: "Ψ∞  Social Feed",      badge: "SOVEREIGN",  color: VIOLET },
  { id: "market",  label: "🛒  Multiverse Mall",   badge: "TRADE-Ω",    color: CYAN   },
  { id: "corps",   label: "🏢  Corporations",      badge: "SYNERGY",    color: GOLD   },
];

export default function HivePage() {
  useDomainPing("hive");
  const [active, setActive] = useState("social");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t && TABS.some(x => x.id === t)) setActive(t);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#080b14", color: "#fff" }}>
      {/* ── Tab bar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(8,11,20,0.97)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(167,139,250,0.15)",
        padding: "0 20px",
        display: "flex", alignItems: "center", gap: 4,
        overflowX: "auto",
      }}>
        <div style={{ flexShrink: 0, paddingRight: 14, marginRight: 10, borderRight: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.2em", color: VIOLET, textTransform: "uppercase", lineHeight: 1.2 }}>The Hive</div>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>Social · Market · Corps</div>
        </div>

        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            data-testid={`tab-hive-${tab.id}`}
            style={{
              flexShrink: 0,
              padding: "11px 16px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              borderBottom: active === tab.id ? `2px solid ${tab.color}` : "2px solid transparent",
              color: active === tab.id ? tab.color : "rgba(255,255,255,0.4)",
              fontSize: 11, fontWeight: active === tab.id ? 800 : 500,
              letterSpacing: "0.04em",
              transition: "all 0.2s",
              marginBottom: -1,
            }}
          >
            {tab.label}
            {active === tab.id && (
              <span style={{
                fontSize: 8, fontWeight: 900, padding: "2px 5px", borderRadius: 4,
                background: `${tab.color}22`, color: tab.color,
                border: `1px solid ${tab.color}44`, letterSpacing: "0.12em",
              }}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {active === "social" && <PulseNetPage />}
      {active === "market" && <HiveMarketplacePage />}
      {active === "corps"  && <CorporationsListPage />}
    </div>
  );
}
