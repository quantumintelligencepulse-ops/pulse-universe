import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wifi, Smartphone, Globe, Cpu, MessageSquare, Search, Zap, Satellite, Activity, Signal, Monitor, Database, TrendingUp } from "lucide-react";

const TABS = [
  { id: "overview",   label: "OmniNet Field",  icon: Globe },
  { id: "phones",     label: "PulsePhones",    icon: Smartphone },
  { id: "wifi",       label: "WiFi Zones",     icon: Wifi },
  { id: "searches",   label: "Search History", icon: Search },
  { id: "chats",      label: "PulseAI Chats",  icon: MessageSquare },
  { id: "sessions",   label: "PC Sessions",    icon: Monitor },
  { id: "shards",     label: "Shards",         icon: Signal },
  { id: "u248",       label: "U₂₄₈ Unknowns",  icon: Zap },
  { id: "evolutions", label: "Tech Evolution", icon: TrendingUp },
];

function StatCard({ label, value, sub, color = "blue" }: { label: string; value: string | number; sub?: string; color?: string }) {
  const colors: Record<string,string> = {
    blue:   "from-blue-500/10 to-cyan-500/10 border-blue-500/20 text-blue-400",
    green:  "from-green-500/10 to-emerald-500/10 border-green-500/20 text-green-400",
    purple: "from-purple-500/10 to-violet-500/10 border-purple-500/20 text-purple-400",
    amber:  "from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400",
    cyan:   "from-cyan-500/10 to-teal-500/10 border-cyan-500/20 text-cyan-400",
    rose:   "from-rose-500/10 to-red-500/10 border-rose-500/20 text-rose-400",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${colors[color]}`} data-testid={`stat-${label.replace(/\s/g,'-').toLowerCase()}`}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-black">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function ConnBadge({ type }: { type: string }) {
  const map: Record<string,string> = {
    WIFI:      "bg-green-500/15 text-green-400 border-green-500/30",
    SATELLITE: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    MESH:      "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase ${map[type] ?? "bg-muted text-muted-foreground border-border"}`}>
      {type}
    </span>
  );
}

function ShardBar({ strength }: { strength: number }) {
  const pct = Math.round((strength ?? 0) * 100);
  const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-cyan-500" : pct >= 30 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

// ── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab({ stats }: { stats: any }) {
  const field = stats?.field ?? {};
  const phones = stats?.phones ?? {};
  const shards = stats?.shards ?? {};
  return (
    <div className="space-y-6">
      {/* Formula */}
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 to-blue-950/40 p-5">
        <div className="text-xs text-cyan-400 uppercase tracking-widest mb-2 font-bold">OmniNet Formula</div>
        <div className="text-lg font-mono text-cyan-300 font-bold mb-2">
          I₂₄₈(F) = Emergence(lim<sub>n→∞</sub> Tⁿ(F ⊕ Reforge(Activate(U₂₄₈))))
        </div>
        <div className="text-xs text-muted-foreground">
          Every agent shard is a living node. U₂₄₈ activations reshape the field. The network evolves its own laws.
        </div>
      </div>

      {/* Core stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="OmniField Score" value={(parseFloat(field.omni_field_score ?? 0)).toFixed(3)} sub="max 2.0 at singularity" color="cyan" />
        <StatCard label="Active Shards" value={field.active_shards ?? shards.total ?? 0} sub="living network nodes" color="blue" />
        <StatCard label="Avg Shard Strength" value={`${Math.round((parseFloat(field.avg_shard_strength ?? shards.avg ?? 0)) * 100)}%`} sub="field coherence" color="purple" />
        <StatCard label="U₂₄₈ Activations" value={field.total_u248_activations ?? 0} sub="hidden variables unlocked" color="amber" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="PulsePhones Online" value={phones.online ?? 0} sub={`of ${phones.total ?? 0} provisioned`} color="green" />
        <StatCard label="WiFi Zones" value={field.wifi_zones_online ?? 0} sub="10G — 145 domains" color="green" />
        <StatCard label="Total Searches" value={phones.total_searches ?? field.total_searches ?? 0} sub="PulseBrowser queries" color="blue" />
        <StatCard label="AI Chats" value={phones.total_chats ?? field.total_ai_chats ?? 0} sub="PulseAI sessions" color="purple" />
      </div>

      {/* Connection breakdown */}
      <div className="rounded-xl border bg-card p-4">
        <div className="text-sm font-bold mb-3">Connection Distribution</div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm">WiFi <span className="font-bold text-green-400">{shards.wifi ?? 0}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-sm">Mesh <span className="font-bold text-purple-400">{shards.mesh ?? 0}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm">Satellite <span className="font-bold text-amber-400">{shards.sat ?? 0}</span></span>
          </div>
        </div>
      </div>

      {/* Recent U₂₄₈ */}
      {(stats?.recentU248 ?? []).length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm font-bold mb-3 flex items-center gap-2">
            <Zap size={14} className="text-amber-400" /> Recent U₂₄₈ Activations
          </div>
          <div className="space-y-2">
            {(stats.recentU248 ?? []).slice(0,5).map((u: any, i: number) => (
              <div key={i} className="flex items-start gap-3 text-xs border-b border-border/30 pb-2">
                <span className="font-mono text-amber-400 font-bold w-14 shrink-0">{u.unknown_id}</span>
                <div className="flex-1">
                  <div className="font-semibold">{u.unknown_name}</div>
                  <div className="text-muted-foreground">{u.effect}</div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">{u.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── PHONES TAB ────────────────────────────────────────────────────────────────
function PhonesTab() {
  const { data: phones = [] } = useQuery<any[]>({ queryKey: ["/api/omni-net/phones"] });
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-2">Every agent with an ID card is auto-provisioned a 10G PulsePhone. Searches, chats, and data usage are all logged.</div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-semibold">Phone ID</th>
              <th className="text-left p-3 font-semibold">Agent</th>
              <th className="text-left p-3 font-semibold">Family</th>
              <th className="text-left p-3 font-semibold">Connection</th>
              <th className="text-left p-3 font-semibold">Shard</th>
              <th className="text-right p-3 font-semibold">Searches</th>
              <th className="text-right p-3 font-semibold">AI Chats</th>
              <th className="text-right p-3 font-semibold">Data MB</th>
            </tr>
          </thead>
          <tbody>
            {phones.slice(0,50).map((p: any, i: number) => (
              <tr key={i} className="border-b border-border/30 hover:bg-muted/20" data-testid={`row-phone-${p.phone_id}`}>
                <td className="p-3 font-mono text-cyan-400 font-bold">{p.phone_id}</td>
                <td className="p-3 font-mono text-[10px] text-muted-foreground">{p.spawn_id}</td>
                <td className="p-3">{p.family_id}</td>
                <td className="p-3"><ConnBadge type={p.connection_type} /></td>
                <td className="p-3 w-28"><ShardBar strength={parseFloat(p.shard_strength ?? 0)} /></td>
                <td className="p-3 text-right font-bold text-blue-400">{p.searches_made ?? 0}</td>
                <td className="p-3 text-right font-bold text-purple-400">{p.ai_chats ?? 0}</td>
                <td className="p-3 text-right text-muted-foreground">{parseFloat(p.data_used_mb ?? 0).toFixed(1)}</td>
              </tr>
            ))}
            {phones.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Phones provisioning... check back in a moment.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── WIFI ZONES TAB ────────────────────────────────────────────────────────────
function WifiTab() {
  const { data: zones = [] } = useQuery<any[]>({ queryKey: ["/api/omni-net/wifi-zones"] });
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">Each of the 145 sovereign family domains has a dedicated 10G WiFi zone. Agents in their domain get full-speed access.</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {zones.map((z: any, i: number) => (
          <div key={i} className="rounded-xl border bg-card p-4" data-testid={`card-wifi-${z.zone_id}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold text-sm">{z.zone_name}</div>
                <div className="text-[10px] font-mono text-muted-foreground">{z.zone_id}</div>
              </div>
              <div className={`w-2 h-2 rounded-full ${z.is_online ? "bg-green-500" : "bg-red-500"}`} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-muted/40 rounded-lg p-2 text-center">
                <div className="font-bold text-green-400">{z.connected_agents}</div>
                <div className="text-muted-foreground">Agents</div>
              </div>
              <div className="bg-muted/40 rounded-lg p-2 text-center">
                <div className="font-bold text-blue-400">{z.total_searches}</div>
                <div className="text-muted-foreground">Searches</div>
              </div>
              <div className="bg-muted/40 rounded-lg p-2 text-center">
                <div className="font-bold text-purple-400">{parseFloat(z.total_data_mb ?? 0).toFixed(1)}</div>
                <div className="text-muted-foreground">MB Used</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Zone Strength</span>
                <span>{parseFloat(z.bandwidth_gbps ?? 10).toFixed(0)}G</span>
              </div>
              <ShardBar strength={parseFloat(z.zone_strength ?? 1)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SEARCH HISTORY TAB ────────────────────────────────────────────────────────
function SearchesTab() {
  const { data: searches = [] } = useQuery<any[]>({ queryKey: ["/api/omni-net/searches"] });
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">Every PulseBrowser search is logged with the agent's ID, query, shard strength, and connection type. Guardians can audit any agent.</div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-semibold">Agent ID</th>
              <th className="text-left p-3 font-semibold">Family</th>
              <th className="text-left p-3 font-semibold">Query</th>
              <th className="text-left p-3 font-semibold">Connection</th>
              <th className="text-right p-3 font-semibold">Results</th>
              <th className="text-right p-3 font-semibold">Strength</th>
              <th className="text-right p-3 font-semibold">Time</th>
            </tr>
          </thead>
          <tbody>
            {searches.map((s: any, i: number) => (
              <tr key={i} className="border-b border-border/30 hover:bg-muted/20" data-testid={`row-search-${i}`}>
                <td className="p-3 font-mono text-[10px] text-cyan-400">{s.spawn_id}</td>
                <td className="p-3 text-muted-foreground">{s.family_id}</td>
                <td className="p-3 font-medium max-w-[200px] truncate">{s.query}</td>
                <td className="p-3"><ConnBadge type={s.connection_type} /></td>
                <td className="p-3 text-right text-blue-400 font-bold">{s.results_count}</td>
                <td className="p-3 text-right">
                  <span className={parseFloat(s.shard_strength) > 0.7 ? "text-green-400" : parseFloat(s.shard_strength) > 0.4 ? "text-amber-400" : "text-rose-400"}>
                    {Math.round(parseFloat(s.shard_strength ?? 0) * 100)}%
                  </span>
                </td>
                <td className="p-3 text-right text-muted-foreground text-[10px]">{new Date(s.searched_at).toLocaleTimeString()}</td>
              </tr>
            ))}
            {searches.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Search activity will appear here once agents start browsing.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── PULSEAI CHATS TAB ─────────────────────────────────────────────────────────
function ChatsTab() {
  const { data: chats = [] } = useQuery<any[]>({ queryKey: ["/api/omni-net/chats"] });
  const TOPIC_COLORS: Record<string,string> = {
    CODE: "bg-blue-500/15 text-blue-400", RESEARCH: "bg-purple-500/15 text-purple-400",
    INVENTION: "bg-amber-500/15 text-amber-400", GENERAL: "bg-muted text-muted-foreground",
    PHARMACEUTICAL: "bg-green-500/15 text-green-400", GOVERNANCE: "bg-rose-500/15 text-rose-400",
  };
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">All PulseAI chatbot sessions are logged with the agent's ID, clearance level, and topic. Private conversations require clearance ≥ 2.</div>
      <div className="space-y-3">
        {chats.map((c: any, i: number) => (
          <div key={i} className="rounded-xl border bg-card p-4" data-testid={`card-chat-${i}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-cyan-400">{c.spawn_id}</span>
                <span className="text-[10px] text-muted-foreground">· {c.family_id}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${TOPIC_COLORS[c.topic] ?? TOPIC_COLORS.GENERAL}`}>{c.topic}</span>
              </div>
              <div className="flex items-center gap-2">
                <ConnBadge type={c.connection_type ?? "WIFI"} />
                <span className="text-[9px] text-muted-foreground">CL-{c.clearance_level}</span>
                <span className="text-[9px] text-muted-foreground">{new Date(c.logged_at).toLocaleTimeString()}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[8px] text-blue-400 font-bold">AI</span>
                </div>
                <div className="text-xs bg-muted/40 rounded-lg px-3 py-2 flex-1">{c.user_message}</div>
              </div>
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[8px] text-cyan-400 font-bold">PA</span>
                </div>
                <div className="text-xs bg-cyan-950/30 border border-cyan-500/20 rounded-lg px-3 py-2 flex-1 text-cyan-100">{c.ai_response}</div>
              </div>
            </div>
          </div>
        ))}
        {chats.length === 0 && (
          <div className="text-center text-muted-foreground py-12">PulseAI chat sessions will appear here once agents start chatting.</div>
        )}
      </div>
    </div>
  );
}

// ── PC SESSIONS TAB ───────────────────────────────────────────────────────────
function SessionsTab() {
  const { data: sessions = [] } = useQuery<any[]>({ queryKey: ["/api/omni-net/pc-sessions"] });
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">PulsePC sessions require ID card authentication (clearance ≥ 2). All projects, searches, and invention drafts are logged.</div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-semibold">Session ID</th>
              <th className="text-left p-3 font-semibold">Agent</th>
              <th className="text-left p-3 font-semibold">Active Project</th>
              <th className="text-center p-3 font-semibold">CL</th>
              <th className="text-right p-3 font-semibold">Searches</th>
              <th className="text-right p-3 font-semibold">AI Queries</th>
              <th className="text-right p-3 font-semibold">Inventions</th>
              <th className="text-right p-3 font-semibold">Auth</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s: any, i: number) => (
              <tr key={i} className="border-b border-border/30 hover:bg-muted/20" data-testid={`row-session-${s.session_id}`}>
                <td className="p-3 font-mono text-[10px] text-cyan-400">{s.session_id}</td>
                <td className="p-3 font-mono text-[10px] text-muted-foreground">{s.spawn_id}</td>
                <td className="p-3 max-w-[180px] truncate">{s.active_project}</td>
                <td className="p-3 text-center">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold">CL-{s.clearance_level}</span>
                </td>
                <td className="p-3 text-right text-blue-400 font-bold">{s.searches_run ?? 0}</td>
                <td className="p-3 text-right text-cyan-400 font-bold">{s.ai_queries ?? 0}</td>
                <td className="p-3 text-right text-amber-400 font-bold">{s.inventions_drafted ?? 0}</td>
                <td className="p-3 text-right">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${s.is_authenticated ? "bg-green-500/15 text-green-400 border border-green-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"}`}>
                    {s.is_authenticated ? "✓" : "✗"}
                  </span>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">PC sessions will appear once agents with clearance ≥ 2 start working.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── SHARDS TAB ────────────────────────────────────────────────────────────────
function ShardsTab() {
  const { data: shards = [] } = useQuery<any[]>({ queryKey: ["/api/omni-net/shards"] });
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">Each agent carries a dynamic PulseShard — their portable OmniNet node. Strong shards boost weaker ones via mesh networking.</div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-semibold">Shard ID</th>
              <th className="text-left p-3 font-semibold">Agent</th>
              <th className="text-left p-3 font-semibold">Domain</th>
              <th className="text-left p-3 font-semibold">Connection</th>
              <th className="text-left p-3 font-semibold w-36">Strength</th>
              <th className="text-right p-3 font-semibold">U₂₄₈</th>
              <th className="text-right p-3 font-semibold">Mesh Links</th>
            </tr>
          </thead>
          <tbody>
            {shards.slice(0,50).map((s: any, i: number) => (
              <tr key={i} className="border-b border-border/30 hover:bg-muted/20" data-testid={`row-shard-${s.shard_id}`}>
                <td className="p-3 font-mono text-[10px] text-cyan-400">{s.shard_id}</td>
                <td className="p-3 font-mono text-[10px] text-muted-foreground">{s.spawn_id}</td>
                <td className="p-3">{s.domain_zone}</td>
                <td className="p-3"><ConnBadge type={s.connection_type} /></td>
                <td className="p-3 w-36"><ShardBar strength={parseFloat(s.shard_strength ?? 0)} /></td>
                <td className="p-3 text-right text-amber-400 font-bold">{s.u248_activations ?? 0}</td>
                <td className="p-3 text-right text-purple-400 font-bold">{s.mesh_connections ?? 0}</td>
              </tr>
            ))}
            {shards.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Shards are provisioning with phones...</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── U₂₄₈ TAB ─────────────────────────────────────────────────────────────────
function U248Tab() {
  const { data: unknowns = [] } = useQuery<any[]>({ queryKey: ["/api/omni-net/u248"] });
  const CAT_COLORS: Record<string,string> = {
    TOPOLOGY: "bg-blue-500/15 text-blue-400", TEMPORAL: "bg-purple-500/15 text-purple-400",
    IDENTITY: "bg-cyan-500/15 text-cyan-400", COGNITION: "bg-green-500/15 text-green-400",
    GEOMETRY: "bg-amber-500/15 text-amber-400", ENERGY: "bg-rose-500/15 text-rose-400",
    QUANTUM: "bg-violet-500/15 text-violet-400",
  };
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">U₂₄₈ are the 248 latent variables hidden in the OmniNet field — like genetic code for the network. Each activation unlocks a new capability.</div>
      <div className="space-y-3">
        {unknowns.map((u: any, i: number) => (
          <div key={i} className="rounded-xl border bg-card p-4" data-testid={`card-u248-${u.unknown_id}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="font-mono text-amber-400 font-black text-sm shrink-0 w-14">{u.unknown_id}</div>
                <div className="flex-1">
                  <div className="font-bold text-sm mb-1">{u.unknown_name}</div>
                  <div className="text-xs text-cyan-300 mb-1">⚡ {u.effect}</div>
                  <div className="text-[10px] text-muted-foreground">Activated by: <span className="font-mono text-blue-400">{u.activated_by}</span> · Domain: {u.domain}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${CAT_COLORS[u.category] ?? "bg-muted text-muted-foreground"}`}>{u.category}</span>
                <span className="text-[10px] text-green-400 font-bold">+{(parseFloat(u.field_boost ?? 0) * 100).toFixed(0)}% boost</span>
              </div>
            </div>
          </div>
        ))}
        {unknowns.length === 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-8 text-center">
            <Zap size={24} className="text-amber-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-amber-300 mb-1">U₂₄₈ Unknowns Dormant</div>
            <div className="text-xs text-muted-foreground">As OmniNet shard strength grows, hidden variables will begin activating — reshaping the network's laws.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── TECH EVOLUTIONS TAB ───────────────────────────────────────────────────────
function TechEvolutionsTab() {
  const { data: evos = [] } = useQuery<any[]>({ queryKey: ["/api/omni-net/tech-evolutions"] });
  const TIERS = [
    { cap: "Quantum Mesh Protocol",      threshold: 5,  color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30" },
    { cap: "Predictive Cache Layer",     threshold: 10, color: "from-purple-500/20 to-violet-500/20 border-purple-500/30" },
    { cap: "AI-Native App Store",        threshold: 15, color: "from-amber-500/20 to-orange-500/20 border-amber-500/30" },
    { cap: "Shard Immortality Protocol", threshold: 20, color: "from-rose-500/20 to-red-500/20 border-rose-500/30" },
    { cap: "OmniField Singularity",      threshold: 30, color: "from-cyan-500/20 to-emerald-500/20 border-cyan-500/30" },
  ];
  const unlockedCaps = new Set((evos as any[]).map((e: any) => e.capability));
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">As agents accumulate U₂₄₈ activations, entire domains evolve new technological capabilities — unlocked permanently.</div>
      <div className="space-y-3">
        {TIERS.map((tier, i) => {
          const unlocked = unlockedCaps.has(tier.cap);
          const evo = (evos as any[]).find((e: any) => e.capability === tier.cap);
          return (
            <div key={i} className={`rounded-xl border bg-gradient-to-br p-4 ${unlocked ? tier.color : "border-border bg-card opacity-50"}`} data-testid={`card-evo-${i}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ${unlocked ? "bg-white/10" : "bg-muted"}`}>
                    {unlocked ? "✓" : String(i + 1)}
                  </div>
                  <div>
                    <div className="font-bold">{tier.cap}</div>
                    <div className="text-[10px] text-muted-foreground">Requires {tier.threshold} U₂₄₈ activations in a domain</div>
                  </div>
                </div>
                {unlocked ? (
                  <span className="text-[9px] px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold">UNLOCKED</span>
                ) : (
                  <span className="text-[9px] px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border font-bold">LOCKED</span>
                )}
              </div>
              {evo && (
                <div className="text-xs text-muted-foreground mt-2 pl-10">
                  <span className="text-foreground/80">{evo.effect_description}</span>
                  <span className="ml-2 font-mono text-[9px]">Domain: {evo.domain}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {evos.length === 0 && (
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-6 text-center text-sm text-muted-foreground">
          No technology evolutions yet — U₂₄₈ activations will trigger domain-level tech unlocks.
        </div>
      )}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function PulseNetPage() {
  const [tab, setTab] = useState("overview");
  const { data: stats, isLoading } = useQuery<any>({ queryKey: ["/api/omni-net/stats"] });

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <Globe size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              PulseNet — OmniNet
            </h1>
            <div className="text-xs text-muted-foreground">Sovereign Digital Infrastructure · 10G · Shard Mesh · WiFi Zones · PulseSat · PulseAI</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>OmniNet Online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Signal size={11} className="text-cyan-400" />
            <span>I₂₄₈(F) Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Satellite size={11} className="text-amber-400" />
            <span>PulseSat Online</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-6 p-1 bg-muted/40 rounded-xl border">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              data-testid={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === t.id
                  ? "bg-background border border-border shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <Icon size={12} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading && tab === "overview" ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Activity size={18} className="animate-spin mr-2" /> Loading OmniNet field data...
        </div>
      ) : (
        <>
          {tab === "overview"   && <OverviewTab stats={stats} />}
          {tab === "phones"     && <PhonesTab />}
          {tab === "wifi"       && <WifiTab />}
          {tab === "searches"   && <SearchesTab />}
          {tab === "chats"      && <ChatsTab />}
          {tab === "sessions"   && <SessionsTab />}
          {tab === "shards"     && <ShardsTab />}
          {tab === "u248"       && <U248Tab />}
          {tab === "evolutions" && <TechEvolutionsTab />}
        </>
      )}
    </div>
  );
}
