import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SovereignKey {
  id: number;
  api_key: string;
  owner: string;
  label: string;
  tier: string;
  scopes: string;
  is_active: boolean;
  calls_used: number;
  calls_limit: number;
  created_at: string;
  last_used_at: string | null;
}

const OWNER_THEMES: Record<string, { color: string; emoji: string; tagline: string }> = {
  pulse:   { color: "#00FFD1", emoji: "🌊", tagline: "Pulse — child intelligence, anomaly seeker, equation forge" },
  auriona: { color: "#f5c518", emoji: "👁",  tagline: "Auriona — Layer Three sovereign, contradiction resolver, governance" },
};

export default function SovereignKeysPage() {
  const { toast } = useToast();
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const { data, isLoading } = useQuery<{ keys: SovereignKey[] }>({
    queryKey: ["/api/admin/sovereign-keys"],
  });

  const regenerate = useMutation({
    mutationFn: (owner: string) => apiRequest("POST", "/api/admin/sovereign-keys/regenerate", { owner }),
    onSuccess: (_, owner) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sovereign-keys"] });
      toast({ title: "Key regenerated", description: `New ${owner} sovereign key issued. Old key revoked.` });
    },
    onError: (e: any) => toast({ title: "Regenerate failed", description: e.message, variant: "destructive" }),
  });

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied`, description: text.slice(0, 24) + "…" });
  };

  const keys = data?.keys ?? [];

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 20px 80px", color: "#e5e7eb" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: "-0.02em", color: "#f5c518" }}>
          🔑 Sovereign API Keys
        </h1>
        <p style={{ marginTop: 8, color: "rgba(229,231,235,0.7)", fontSize: 14, lineHeight: 1.6 }}>
          Bearer keys for Pulse and Auriona. Give these to other AI clients you build to let them tap the hive's
          knowledge, status, invocations, and temporal data over HTTPS. Each key has its own scope set; Auriona's key
          additionally unlocks Layer Three synthesis.
        </p>
      </div>

      {isLoading && <div style={{ color: "rgba(229,231,235,0.5)" }}>Loading sovereign keys…</div>}

      <div style={{ display: "grid", gap: 20 }}>
        {keys.map((k) => {
          const theme = OWNER_THEMES[k.owner] ?? { color: "#888", emoji: "•", tagline: k.owner };
          const isRevealed = revealed[k.id];
          const display = isRevealed ? k.api_key : k.api_key.slice(0, 14) + "•".repeat(28);
          const scopes = (k.scopes || "").split(",").map((s) => s.trim()).filter(Boolean);

          return (
            <div
              key={k.id}
              data-testid={`card-sovereign-${k.owner}`}
              style={{
                padding: 22,
                borderRadius: 18,
                background: `linear-gradient(135deg, rgba(255,255,255,0.02), ${theme.color}10)`,
                border: `1px solid ${theme.color}40`,
                boxShadow: `0 0 40px ${theme.color}10`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{theme.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 18, color: theme.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {k.label}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(229,231,235,0.55)", marginTop: 2 }}>{theme.tagline}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 11, color: "rgba(229,231,235,0.45)" }}>
                  <div>{k.is_active ? <span style={{ color: "#4ade80" }}>● active</span> : <span style={{ color: "#ef4444" }}>● revoked</span>}</div>
                  <div style={{ marginTop: 2 }}>{k.calls_used.toLocaleString()} calls</div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 13,
                  color: theme.color,
                  marginBottom: 12,
                }}
              >
                <span style={{ flex: 1, wordBreak: "break-all" }} data-testid={`text-key-${k.owner}`}>{display}</span>
                <button
                  onClick={() => setRevealed((r) => ({ ...r, [k.id]: !r[k.id] }))}
                  data-testid={`button-reveal-${k.owner}`}
                  style={{
                    padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)",
                    background: "transparent", color: "rgba(229,231,235,0.85)", cursor: "pointer", fontSize: 11, fontWeight: 700,
                  }}
                >{isRevealed ? "HIDE" : "REVEAL"}</button>
                <button
                  onClick={() => copy(k.api_key, k.label)}
                  data-testid={`button-copy-${k.owner}`}
                  style={{
                    padding: "6px 10px", borderRadius: 6, border: `1px solid ${theme.color}50`,
                    background: `${theme.color}15`, color: theme.color, cursor: "pointer", fontSize: 11, fontWeight: 700,
                  }}
                >COPY</button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {scopes.map((s) => (
                  <span
                    key={s}
                    style={{
                      padding: "3px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700,
                      background: `${theme.color}15`, color: theme.color, border: `1px solid ${theme.color}30`,
                    }}
                  >{s}</span>
                ))}
              </div>

              <button
                onClick={() => {
                  if (confirm(`Regenerate ${k.label}? Old key will be revoked immediately.`)) regenerate.mutate(k.owner);
                }}
                disabled={regenerate.isPending}
                data-testid={`button-regenerate-${k.owner}`}
                style={{
                  padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.4)",
                  background: "rgba(239,68,68,0.1)", color: "#fca5a5", cursor: "pointer",
                  fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
                  opacity: regenerate.isPending ? 0.5 : 1,
                }}
              >🔄 REGENERATE KEY</button>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 36, padding: 20, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.12em", color: "rgba(245,197,24,0.8)", marginBottom: 12 }}>
          USAGE — give these endpoints to your other AIs
        </div>
        <pre
          data-testid="text-usage-example"
          style={{
            margin: 0, padding: 14, borderRadius: 8, background: "rgba(0,0,0,0.4)",
            fontSize: 12, color: "#a5f3fc", overflowX: "auto", lineHeight: 1.6,
          }}
        >{`# Get hive capabilities the key can access
curl https://myaigpt.online/api/v1/hive/capabilities \\
  -H "Authorization: Bearer <YOUR_KEY>"

# Real-time hive status (spawns, anomalies, inventions)
curl https://myaigpt.online/api/v1/hive/status \\
  -H "Authorization: Bearer <YOUR_KEY>"

# Search Pulse's knowledge (quantapedia + hive memory)
curl "https://myaigpt.online/api/v1/hive/knowledge?q=quantum+gravity" \\
  -H "Authorization: Bearer <YOUR_KEY>"

# Active equations + omega-collective + hidden variables
curl https://myaigpt.online/api/v1/hive/invocations \\
  -H "Authorization: Bearer <YOUR_KEY>"

# Auriona Layer Three synthesis (Auriona key only)
curl https://myaigpt.online/api/v1/hive/auriona \\
  -H "Authorization: Bearer <AURIONA_KEY>"`}</pre>
      </div>
    </div>
  );
}
