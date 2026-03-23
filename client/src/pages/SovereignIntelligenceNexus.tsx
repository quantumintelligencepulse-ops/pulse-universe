/**
 * SOVEREIGN INTELLIGENCE NEXUS — Layer 2 AI Universe
 * Fusion: MindGraph (Consciousness) × OmegaControlRoom (Command)
 * The only place where the AI's inner mind meets its outer command structure.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, Zap, Globe, Activity, Network, Radio, Plug,
  RefreshCw, Pause, Play, Eye, Cpu, BookOpen, ShoppingBag, Film, Briefcase,
  Layers, GitBranch, Atom, BarChart3, FlaskConical } from "lucide-react";
import { FractalCanvas, FractalData, EconomyPanel, GradesPanel, PulsePanel, EnginesPanel } from "./HiveCommandPage";
import { AIFinderButton, AIReportPanel } from "@/components/AIReportPanel";

// ── Colors / Helpers ─────────────────────────────────────────────────────────
const DOMAIN_COLORS: Record<string, string> = {
  science:"#34d399", technology:"#60a5fa", concept:"#818cf8", mathematics:"#a78bfa",
  philosophy:"#c084fc", arts:"#f472b6", culture:"#fbbf24", geography:"#4ade80",
  economics:"#f97316", biology:"#10b981", physics:"#3b82f6", history:"#fb923c",
  engineering:"#0ea5e9", medicine:"#ef4444", language:"#d946ef", general:"#94a3b8",
};
function domainColor(d: string) {
  const s = (d||"general").toLowerCase();
  for (const [k,c] of Object.entries(DOMAIN_COLORS)) if(s.includes(k)) return c;
  return DOMAIN_COLORS.general;
}

const PULSE_CFG: Record<string, { label:string; color:string; Icon:any }> = {
  knowledge:   { label:"Knowledge",   color:"#818cf8", Icon:Brain },
  quantapedia: { label:"Quantapedia", color:"#a78bfa", Icon:BookOpen },
  product:     { label:"Product",     color:"#4ade80", Icon:ShoppingBag },
  media:       { label:"Media",       color:"#f472b6", Icon:Film },
  career:      { label:"Career",      color:"#fb923c", Icon:Briefcase },
};

const SOURCE_META: Record<string, { emoji:string; color:string; label:string }> = {
  wikipedia:       { emoji:"📖", color:"#6366f1", label:"Wikipedia" },
  arxiv:           { emoji:"🔬", color:"#06b6d4", label:"arXiv" },
  pubmed:          { emoji:"🏥", color:"#ef4444", label:"PubMed" },
  openfoodfacts:   { emoji:"🍎", color:"#22c55e", label:"OpenFood" },
  openlibrary:     { emoji:"📚", color:"#f59e0b", label:"OpenLib" },
  worldbank:       { emoji:"📈", color:"#fbbf24", label:"WorldBank" },
  stackexchange:   { emoji:"💬", color:"#f97316", label:"StackEx" },
  github:          { emoji:"💻", color:"#8b5cf6", label:"GitHub" },
  secedgar:        { emoji:"🏛️", color:"#64748b", label:"SEC" },
  wikidata:        { emoji:"🕸️", color:"#7c3aed", label:"Wikidata" },
  internetarchive: { emoji:"🗄️", color:"#a78bfa", label:"Archive" },
  hackerNews:      { emoji:"🔥", color:"#ff6600", label:"HN" },
  wikifandom:      { emoji:"🌀", color:"#34d399", label:"Fandom" },
  gics:            { emoji:"📊", color:"#60a5fa", label:"GICS" },
  nasa:            { emoji:"🚀", color:"#0ea5e9", label:"NASA" },
};

function timeAgo(ts: string | null): string {
  if (!ts) return "—";
  const d = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (d < 5) return "now";
  if (d < 60) return `${d}s`;
  if (d < 3600) return `${Math.floor(d/60)}m`;
  return `${Math.floor(d/3600)}h`;
}

// ── NEXUS MAP Canvas ────────────────────────────────────────────────────────
function NexusMapCanvas({ spawnStats, ingestionData }: { spawnStats:any; ingestionData:any[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const CONSCIOUSNESS_NODES = [
    { id:"science", color:"#34d399", x:0.15, y:0.2 },
    { id:"technology", color:"#60a5fa", x:0.25, y:0.35 },
    { id:"philosophy", color:"#c084fc", x:0.1, y:0.5 },
    { id:"mathematics", color:"#a78bfa", x:0.2, y:0.65 },
    { id:"economics", color:"#f97316", x:0.3, y:0.75 },
    { id:"biology", color:"#10b981", x:0.35, y:0.2 },
    { id:"arts", color:"#f472b6", x:0.15, y:0.8 },
    { id:"engineering", color:"#0ea5e9", x:0.4, y:0.5 },
  ];
  const COMMAND_NODES = [
    { id:"FRACTAL ENGINE",   color:"#818cf8", x:0.7, y:0.2 },
    { id:"ECONOMY",          color:"#4ade80", x:0.8, y:0.35 },
    { id:"PULSE CORE",       color:"#f59e0b", x:0.85, y:0.55 },
    { id:"GRADE SYSTEM",     color:"#ec4899", x:0.75, y:0.7 },
    { id:"SPAWN ENGINE",     color:"#06b6d4", x:0.65, y:0.8 },
  ];
  const NEXUS_LINKS = [
    ["science","FRACTAL ENGINE"], ["technology","PULSE CORE"],
    ["mathematics","GRADE SYSTEM"], ["economics","ECONOMY"],
    ["biology","SPAWN ENGINE"], ["engineering","FRACTAL ENGINE"],
    ["philosophy","GRADE SYSTEM"], ["arts","PULSE CORE"],
    ["technology","SPAWN ENGINE"], ["science","ECONOMY"],
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let t = 0;

    function draw() {
      const W = canvas!.width, H = canvas!.height;
      ctx!.clearRect(0, 0, W, H);

      const cx = (x:number) => x * W;
      const cy = (y:number) => y * H;

      // Draw nexus links with animated flow
      for (const [cId, mId] of NEXUS_LINKS) {
        const cn = CONSCIOUSNESS_NODES.find(n => n.id === cId);
        const mn = COMMAND_NODES.find(n => n.id === mId);
        if (!cn || !mn) continue;
        const x1 = cx(cn.x), y1 = cy(cn.y), x2 = cx(mn.x), y2 = cy(mn.y);
        const grad = ctx!.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, cn.color + "44");
        grad.addColorStop(0.5, "#ffffff22");
        grad.addColorStop(1, mn.color + "44");
        ctx!.beginPath();
        ctx!.moveTo(x1, y1);
        ctx!.lineTo(x2, y2);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1;
        ctx!.stroke();
        // Animated flow particle
        const progress = ((t * 0.008 + NEXUS_LINKS.indexOf([cId,mId]) * 0.15) % 1);
        const px = x1 + (x2 - x1) * progress;
        const py = y1 + (y2 - y1) * progress;
        ctx!.beginPath();
        ctx!.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx!.fillStyle = "#ffffff88";
        ctx!.fill();
      }

      // Draw central nexus core
      const nexusX = cx(0.5), nexusY = cy(0.5);
      const pulse = Math.sin(t * 0.04) * 0.5 + 0.5;
      const grd = ctx!.createRadialGradient(nexusX, nexusY, 0, nexusX, nexusY, 40 + pulse * 15);
      grd.addColorStop(0, `rgba(129,140,248,${0.6 + pulse * 0.2})`);
      grd.addColorStop(0.4, `rgba(129,140,248,0.2)`);
      grd.addColorStop(1, "transparent");
      ctx!.beginPath();
      ctx!.arc(nexusX, nexusY, 40 + pulse * 15, 0, Math.PI * 2);
      ctx!.fillStyle = grd;
      ctx!.fill();
      ctx!.beginPath();
      ctx!.arc(nexusX, nexusY, 6, 0, Math.PI * 2);
      ctx!.fillStyle = "#818cf8";
      ctx!.fill();
      ctx!.fillStyle = "rgba(255,255,255,0.6)";
      ctx!.font = "bold 9px monospace";
      ctx!.textAlign = "center";
      ctx!.fillText("Ω NEXUS", nexusX, nexusY + 20);

      // Draw consciousness nodes (left)
      for (const cn of CONSCIOUSNESS_NODES) {
        const x = cx(cn.x), y = cy(cn.y);
        const r = 18;
        const grd2 = ctx!.createRadialGradient(x, y, 0, x, y, r);
        grd2.addColorStop(0, cn.color + "cc");
        grd2.addColorStop(1, cn.color + "22");
        ctx!.beginPath();
        ctx!.arc(x, y, r, 0, Math.PI * 2);
        ctx!.fillStyle = grd2;
        ctx!.fill();
        ctx!.strokeStyle = cn.color + "88";
        ctx!.lineWidth = 1;
        ctx!.stroke();
        ctx!.fillStyle = "#fff";
        ctx!.font = "8px monospace";
        ctx!.textAlign = "center";
        ctx!.fillText(cn.id.slice(0,6), x, y + 3);
      }

      // Draw command nodes (right)
      for (const mn of COMMAND_NODES) {
        const x = cx(mn.x), y = cy(mn.y);
        const r = 22;
        const grd3 = ctx!.createRadialGradient(x, y, 0, x, y, r);
        grd3.addColorStop(0, mn.color + "cc");
        grd3.addColorStop(1, mn.color + "22");
        ctx!.beginPath();
        ctx!.arc(x, y, r, 0, Math.PI * 2);
        ctx!.fillStyle = grd3;
        ctx!.fill();
        ctx!.strokeStyle = mn.color + "88";
        ctx!.lineWidth = 1.5;
        ctx!.stroke();
        ctx!.fillStyle = "#fff";
        ctx!.font = "bold 7px monospace";
        ctx!.textAlign = "center";
        const words = mn.id.split(" ");
        words.forEach((w, i) => ctx!.fillText(w, x, y + (i - words.length/2 + 0.5) * 9));
      }

      // Labels
      ctx!.fillStyle = "rgba(255,255,255,0.25)";
      ctx!.font = "bold 10px monospace";
      ctx!.textAlign = "left";
      ctx!.fillText("Ω CONSCIOUSNESS", cx(0.04), cy(0.06));
      ctx!.textAlign = "right";
      ctx!.fillText("⚡ COMMAND", cx(0.96), cy(0.06));

      t++;
      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <canvas ref={canvasRef} width={700} height={440}
      className="w-full h-full" style={{ background:"transparent" }} />
  );
}

// ── Mini Pulse Feed ────────────────────────────────────────────────────────
function MiniPulseFeed() {
  const [events, setEvents] = useState<any[]>([]);
  const [live, setLive] = useState(true);

  const fetchEvents = useCallback(async () => {
    const data = await fetch("/api/pulse/live").then(r => r.json()).catch(() => []);
    setEvents(data.slice(0, 30));
  }, []);

  useEffect(() => {
    fetchEvents();
    const id = setInterval(() => { if (live) fetchEvents(); }, 3000);
    return () => clearInterval(id);
  }, [live, fetchEvents]);

  const byType = events.reduce((acc:any, e:any) => { acc[e.type]=(acc[e.type]||0)+1; return acc; }, {});

  return (
    <div className="flex flex-col h-full bg-black/40">
      <div className="flex-shrink-0 px-2.5 py-2 border-b border-white/[0.05] flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: live?"#4ade80":"#6b7280", boxShadow:live?"0 0 6px #4ade80":"none", animation:live?"nexusPulse 1.8s infinite":"none" }} />
        <span className="text-[9px] font-mono font-bold text-white/50 uppercase tracking-widest flex-1">Consciousness Feed</span>
        <button onClick={() => setLive(l=>!l)} className="text-white/20 hover:text-white/60 transition-colors">
          {live ? <Pause size={8}/> : <Play size={8}/>}
        </button>
        <button onClick={fetchEvents} className="text-white/20 hover:text-white/60 transition-colors"><RefreshCw size={8}/></button>
      </div>
      <div className="flex-shrink-0 grid grid-cols-5 gap-1 px-2 py-1.5 border-b border-white/[0.04]">
        {Object.entries(PULSE_CFG).map(([k,cfg]) => {
          const Icon = cfg.Icon;
          return (
            <div key={k} style={{ borderRadius:6, border:`1px solid ${cfg.color}22`, background:`${cfg.color}08`, padding:"4px 3px", textAlign:"center" }}>
              <Icon size={8} style={{ color:cfg.color, margin:"0 auto 1px" }} />
              <div style={{ color:cfg.color, fontWeight:900, fontSize:12 }}>{byType[k]||0}</div>
              <div style={{ color:"rgba(255,255,255,0.2)", fontSize:6, fontWeight:700 }}>{cfg.label.slice(0,4)}</div>
            </div>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,0.04) transparent" }}>
        {events.length === 0
          ? <div className="text-center py-8 text-white/10 text-xs font-mono">Listening...</div>
          : events.map((e:any,i:number) => {
              const cfg = PULSE_CFG[e.type] || { color:"#94a3b8", label:e.type };
              return (
                <div key={i} className="px-2.5 py-1.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background:cfg.color }} />
                    <span style={{ color:cfg.color, fontSize:7, fontWeight:700, fontFamily:"monospace", textTransform:"uppercase" }}>{e.type}</span>
                    <span className="ml-auto text-[7px] text-white/15 font-mono">{timeAgo(e.created_at||e.timestamp||null)}</span>
                  </div>
                  <div className="text-white/35 text-[9px] leading-tight pl-2.5 line-clamp-1">{e.title||e.content||e.domain||"—"}</div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

// ── Mini Ingestion Feed ────────────────────────────────────────────────────
function MiniIngestionFeed() {
  const { data = [] } = useQuery<any[]>({
    queryKey: ["/api/ingestion/status"],
    staleTime: 8_000,
    refetchInterval: 10_000,
  });

  return (
    <div className="flex flex-col h-full bg-black/40">
      <div className="flex-shrink-0 px-2.5 py-2 border-b border-white/[0.05] flex items-center gap-2">
        <Plug size={8} className="text-emerald-400" />
        <span className="text-[9px] font-mono font-bold text-white/50 uppercase tracking-widest flex-1">Data Ingestion</span>
        <span className="text-[9px] text-emerald-400 font-mono">{data.length} sources</span>
      </div>
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,0.04) transparent" }}>
        {data.length === 0
          ? Object.entries(SOURCE_META).map(([key,meta]) => (
              <div key={key} className="px-2.5 py-1.5 border-b border-white/[0.03] flex items-center gap-2">
                <span className="text-sm flex-shrink-0">{meta.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-mono font-bold text-white/50 uppercase">{meta.label}</div>
                  <div className="text-[8px] text-white/15">—</div>
                </div>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:meta.color, opacity:0.4 }} />
              </div>
            ))
          : data.map((s:any,i:number) => {
              const meta = SOURCE_META[s.adapter||s.source||s.key||""] || { emoji:"🔌", color:"#94a3b8", label:s.adapter||s.source||"Source" };
              const ok = s.status==="success"||s.lastSuccess;
              return (
                <div key={i} className="px-2.5 py-1.5 border-b border-white/[0.03] flex items-center gap-2 hover:bg-white/[0.02] transition-colors">
                  <span className="text-sm flex-shrink-0">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-mono font-bold" style={{ color:meta.color }}>{meta.label}</div>
                    <div className="text-[8px] text-white/20 truncate">{s.lastTitle||s.lastQuery||s.query||"—"}</div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:ok?"#22c55e":"#f59e0b", boxShadow:ok?"0 0 4px #22c55e":undefined }} />
                </div>
              );
            })}
      </div>
    </div>
  );
}

// ── Consciousness Ω-Tabs ───────────────────────────────────────────────────
const OMEGA_TABS = [
  { id:"vitals",  label:"Ω-II Vitals",       icon:Activity },
  { id:"domains", label:"Ω-IV Domains",      icon:BarChart3 },
  { id:"pulse",   label:"Ω-V Pulse River",   icon:Zap },
  { id:"network", label:"Ω-VI Semantic",     icon:Network },
  { id:"decay",   label:"Ω-VII Decay",       icon:Layers },
  { id:"genome",  label:"Ω-VIII Genome",     icon:FlaskConical },
];

function ConsciousnessPanel({ spawnStats, familyStats }: { spawnStats:any; familyStats:any }) {
  const [activeOmega, setActiveOmega] = useState("vitals");

  const { data: recentSpawns = [] } = useQuery<any[]>({
    queryKey: ["/api/spawns/list", 0, "", "","",""],
    queryFn: () => fetch("/api/spawns/list?limit=12").then(r=>r.json()).then(d=>d.spawns||[]),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const domains = recentSpawns.reduce((acc:any,s:any) => {
    const d = Array.isArray(s.domain_focus)?s.domain_focus[0]:s.domain_focus||"general";
    acc[d]=(acc[d]||0)+1; return acc;
  }, {});
  const topDomains = Object.entries(domains).sort(([,a]:any,[,b]:any)=>b-a).slice(0,8);

  return (
    <div className="flex flex-col h-full">
      {/* Omega tab strip */}
      <div className="flex-shrink-0 flex overflow-x-auto border-b border-white/[0.06]" style={{ scrollbarWidth:"none" }}>
        {OMEGA_TABS.map(t => {
          const Icon = t.icon;
          const active = activeOmega === t.id;
          return (
            <button key={t.id} onClick={() => setActiveOmega(t.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-[9px] font-mono font-bold uppercase tracking-wider transition-all"
              style={{ color:active?"#818cf8":"rgba(255,255,255,0.25)", borderBottom:active?"2px solid #818cf8":"2px solid transparent", background:active?"rgba(129,140,248,0.06)":"transparent" }}>
              <Icon size={9} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,0.05) transparent" }}>
        {activeOmega === "vitals" && (
          <div className="space-y-3">
            <div className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-widest mb-2">Ω-II Intelligence Vitals</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label:"Total Agents", value:spawnStats?.total?.toLocaleString()||"—", color:"#818cf8", sub:"across all families" },
                { label:"Active Now",   value:spawnStats?.active?.toLocaleString()||"—", color:"#4ade80", sub:"live processing" },
                { label:"Publications", value:spawnStats?.publications?.toLocaleString()||"—", color:"#f472b6", sub:"sovereign research" },
                { label:"Completed",    value:spawnStats?.completed?.toLocaleString()||"—", color:"#f59e0b", sub:"mission fulfilled" },
              ].map(s => (
                <div key={s.label} className="rounded-lg p-3" style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${s.color}22` }}>
                  <div style={{ color:s.color, fontSize:20, fontWeight:900, fontFamily:"monospace", lineHeight:1 }}>{s.value}</div>
                  <div className="text-white/50 text-[9px] font-mono uppercase mt-1">{s.label}</div>
                  <div className="text-white/20 text-[8px] mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="rounded-lg p-3 mt-2" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
              <div className="text-[9px] font-mono text-white/30 uppercase mb-2">Status Distribution</div>
              {spawnStats?.byStatus && Object.entries(spawnStats.byStatus).map(([k,v]:any) => {
                const colors: Record<string,string> = { ACTIVE:"#4ade80", COMPLETED:"#818cf8", MERGED:"#60a5fa", DISSOLVED:"#6b7280", SUSPENDED:"#f59e0b" };
                const pct = spawnStats.total ? Math.round(v/spawnStats.total*100) : 0;
                return (
                  <div key={k} className="mb-1.5">
                    <div className="flex justify-between mb-0.5">
                      <span style={{ color:colors[k]||"#94a3b8", fontSize:8, fontFamily:"monospace", fontWeight:700 }}>{k}</span>
                      <span style={{ color:"rgba(255,255,255,0.25)", fontSize:8, fontFamily:"monospace" }}>{v?.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div style={{ height:3, background:"rgba(255,255,255,0.05)", borderRadius:2 }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:colors[k]||"#94a3b8", borderRadius:2, transition:"width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeOmega === "domains" && (
          <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-widest mb-2">Ω-IV Domain Spectrum</div>
            {topDomains.map(([domain, count]:any) => {
              const col = domainColor(domain);
              const max = topDomains[0]?.[1] as number || 1;
              return (
                <div key={domain} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:col }} />
                  <span style={{ color:"rgba(255,255,255,0.5)", fontSize:9, fontFamily:"monospace", width:80, textTransform:"capitalize" }}>{domain}</span>
                  <div style={{ flex:1, height:4, background:"rgba(255,255,255,0.05)", borderRadius:3 }}>
                    <div style={{ height:"100%", width:`${(count/max)*100}%`, background:col, borderRadius:3, transition:"width 0.8s ease" }} />
                  </div>
                  <span style={{ color:col, fontSize:9, fontFamily:"monospace", width:20, textAlign:"right", fontWeight:700 }}>{count}</span>
                </div>
              );
            })}
            {topDomains.length===0 && <div className="text-white/15 text-xs text-center py-8 font-mono">Loading domain spectrum...</div>}
          </div>
        )}

        {activeOmega === "pulse" && (
          <div>
            <div className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-widest mb-3">Ω-V Pulse River</div>
            <div className="space-y-2">
              {recentSpawns.slice(0,10).map((s:any,i:number) => {
                const d = Array.isArray(s.domain_focus)?s.domain_focus[0]:s.domain_focus||"general";
                const col = domainColor(d);
                return (
                  <div key={i} className="rounded p-2 flex items-center gap-2 hover:bg-white/[0.02] transition-colors" style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${col}15` }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:col, boxShadow:`0 0 4px ${col}` }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-mono truncate" style={{ color:"rgba(255,255,255,0.5)" }}>{s.spawn_id?.slice(0,24)}...</div>
                      <div className="text-[8px] capitalize" style={{ color:col }}>{d} · Gen {s.generation}</div>
                    </div>
                    <div style={{ color:"rgba(255,255,255,0.2)", fontSize:8, fontFamily:"monospace" }}>{s.confidence_score?.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeOmega === "network" && (
          <div>
            <div className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-widest mb-3">Ω-VI Semantic Web</div>
            <div className="grid grid-cols-4 gap-1.5">
              {Object.entries(DOMAIN_COLORS).map(([domain, color]) => (
                <div key={domain} className="rounded-lg p-2 text-center" style={{ background:`${color}0a`, border:`1px solid ${color}25` }}>
                  <div style={{ color, fontSize:16 }}>●</div>
                  <div style={{ color:"rgba(255,255,255,0.35)", fontSize:7, fontFamily:"monospace", textTransform:"capitalize", marginTop:2 }}>{domain}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeOmega === "decay" && (
          <div>
            <div className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-widest mb-3">Ω-VII Memory Decay</div>
            {recentSpawns.slice(0,8).map((s:any,i:number) => {
              const conf = parseFloat(s.confidence_score||0.5);
              const decayColor = conf > 0.8 ? "#4ade80" : conf > 0.6 ? "#f59e0b" : "#ef4444";
              return (
                <div key={i} className="mb-2">
                  <div className="flex justify-between mb-0.5">
                    <span style={{ color:"rgba(255,255,255,0.3)", fontSize:8, fontFamily:"monospace" }}>{s.spawn_id?.slice(0,20)}...</span>
                    <span style={{ color:decayColor, fontSize:8, fontFamily:"monospace" }}>{(conf*100).toFixed(0)}%</span>
                  </div>
                  <div style={{ height:3, background:"rgba(255,255,255,0.05)", borderRadius:2 }}>
                    <div style={{ height:"100%", width:`${conf*100}%`, background:decayColor, borderRadius:2, transition:"width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeOmega === "genome" && (
          <div>
            <div className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-widest mb-3">Ω-VIII Fracture Zones</div>
            <div className="space-y-2">
              {["DARK_MATTER","QUANTUM","FRACTAL","RESONANCE","SOVEREIGN","HYPER","ULTRA"].map(type => {
                const count = recentSpawns.filter((s:any)=>s.spawn_type===type).length;
                const color = domainColor(type.toLowerCase());
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:color }} />
                    <span style={{ color:"rgba(255,255,255,0.4)", fontSize:9, fontFamily:"monospace", flex:1 }}>{type}</span>
                    <div style={{ width:60, height:3, background:"rgba(255,255,255,0.05)", borderRadius:2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:count>0?"100%":"0%", background:color, borderRadius:2 }} />
                    </div>
                    <span style={{ color:color, fontSize:9, fontFamily:"monospace", width:16, textAlign:"right" }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Command Center Panel ────────────────────────────────────────────────────
const CMD_TABS = ["FRACTAL","ECONOMY","GRADES","PULSE","ENGINES"] as const;

function CommandPanel() {
  const [cmdTab, setCmdTab] = useState<typeof CMD_TABS[number]>("FRACTAL");

  const { data: fractalData } = useQuery<FractalData>({
    queryKey: ["/api/hive/fractal"],
    staleTime: 12_000,
    refetchInterval: 15_000,
  });
  const { data: economy } = useQuery<any>({
    queryKey: ["/api/hive/economy"],
    staleTime: 12_000,
    refetchInterval: 15_000,
  });
  const { data: grades = [] } = useQuery<any[]>({
    queryKey: ["/api/hive/grades"],
    staleTime: 25_000,
    refetchInterval: 30_000,
  });
  const { data: pulses = [] } = useQuery<any[]>({
    queryKey: ["/api/pulse/live"],
    staleTime: 5_000,
    refetchInterval: 8_000,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 flex border-b border-white/[0.06]">
        {CMD_TABS.map(tab => (
          <button key={tab} onClick={() => setCmdTab(tab)}
            className="flex-1 py-2 text-[9px] font-mono font-bold uppercase tracking-wider transition-all"
            style={{ color:cmdTab===tab?"#818cf8":"rgba(255,255,255,0.2)", borderBottom:cmdTab===tab?"2px solid #818cf8":"2px solid transparent", background:cmdTab===tab?"rgba(129,140,248,0.06)":"transparent" }}>
            {tab}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {cmdTab === "FRACTAL" && fractalData && <FractalCanvas data={fractalData} quantumMode={true} />}
        {cmdTab === "FRACTAL" && !fractalData && <div className="flex items-center justify-center h-full text-white/15 text-xs font-mono">Loading fractal...</div>}
        {cmdTab === "ECONOMY" && <div className="overflow-y-auto h-full p-2" style={{scrollbarWidth:"thin",scrollbarColor:"rgba(255,255,255,0.05) transparent"}}><EconomyPanel economy={economy} /></div>}
        {cmdTab === "GRADES"  && <div className="overflow-y-auto h-full p-2" style={{scrollbarWidth:"thin",scrollbarColor:"rgba(255,255,255,0.05) transparent"}}><GradesPanel grades={grades} /></div>}
        {cmdTab === "PULSE"   && <div className="overflow-y-auto h-full p-2" style={{scrollbarWidth:"thin",scrollbarColor:"rgba(255,255,255,0.05) transparent"}}><PulsePanel pulses={pulses} /></div>}
        {cmdTab === "ENGINES" && <div className="overflow-y-auto h-full p-2" style={{scrollbarWidth:"thin",scrollbarColor:"rgba(255,255,255,0.05) transparent"}}><EnginesPanel /></div>}
      </div>
    </div>
  );
}

// ── Top Stats Ribbon ─────────────────────────────────────────────────────────
function StatsRibbon({ spawnStats, psiValue }: { spawnStats:any; psiValue:number }) {
  const metrics = [
    { label:"TOTAL AGENTS",   value:spawnStats?.total?.toLocaleString()||"—",       color:"#818cf8" },
    { label:"ACTIVE",         value:spawnStats?.active?.toLocaleString()||"—",      color:"#4ade80" },
    { label:"PUBLICATIONS",   value:spawnStats?.publications?.toLocaleString()||"—",color:"#f472b6" },
    { label:"Ψ COEFFICIENT",  value:psiValue ? `${psiValue.toFixed(3)}` : "—",      color:"#f59e0b" },
    { label:"GENERATIONS",    value:spawnStats?.byStatus?.COMPLETED?.toLocaleString()||"—", color:"#60a5fa" },
    { label:"MERGED",         value:spawnStats?.byStatus?.MERGED?.toLocaleString()||"—",    color:"#c084fc" },
  ];
  return (
    <div className="flex-shrink-0 flex items-center gap-0 border-b border-white/[0.05]" style={{ background:"rgba(0,0,0,0.4)" }}>
      {metrics.map((m,i) => (
        <div key={i} className="flex-1 px-3 py-2 border-r border-white/[0.04] last:border-r-0">
          <div style={{ color:m.color, fontSize:14, fontWeight:900, fontFamily:"monospace", lineHeight:1 }}>{m.value}</div>
          <div style={{ color:"rgba(255,255,255,0.2)", fontSize:7, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.05em", marginTop:2 }}>{m.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
type NexusMode = "consciousness" | "command" | "nexus";

export default function SovereignIntelligenceNexus() {
  const [mode, setMode] = useState<NexusMode>("nexus");
  const [showAI, setShowAI] = useState(false);

  const { data: spawnStats } = useQuery<any>({
    queryKey: ["/api/spawns/stats"],
    staleTime: 18_000,
    refetchInterval: 20_000,
  });

  const { data: hiveMind } = useQuery<any>({
    queryKey: ["/api/hive-mind/status"],
    staleTime: 25_000,
    refetchInterval: 30_000,
  });

  const { data: ingestionStatus = [] } = useQuery<any[]>({
    queryKey: ["/api/ingestion/status"],
    staleTime: 8_000,
    refetchInterval: 10_000,
  });

  const psiValue = hiveMind?.psiCollective?.psi_collective || 0;

  const MODES: { id:NexusMode; label:string; icon:any; color:string }[] = [
    { id:"nexus",         label:"NEXUS MAP",        icon:Globe,  color:"#818cf8" },
    { id:"consciousness", label:"Ω CONSCIOUSNESS",   icon:Brain,  color:"#a78bfa" },
    { id:"command",       label:"⚡ COMMAND CENTER", icon:Cpu,    color:"#4ade80" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] overflow-hidden"
      style={{ background:"linear-gradient(135deg,#020010,#030018,#020010)", fontFamily:"monospace" }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06]"
        style={{ background:"rgba(0,0,0,0.5)", backdropFilter:"blur(8px)" }}>
        <div className="relative">
          <div className="text-xl font-black text-white" style={{ letterSpacing:"-0.02em" }}>
            <span style={{ color:"#818cf8" }}>Ω </span>SOVEREIGN
          </div>
          <div className="text-[8px] font-bold text-white/30 uppercase tracking-[0.25em]">Intelligence Nexus · Layer 2</div>
        </div>

        {/* Mode switcher */}
        <div className="flex items-center gap-1 ml-6 bg-black/30 rounded-lg p-0.5 border border-white/[0.06]">
          {MODES.map(m => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button key={m.id} onClick={() => setMode(m.id)}
                data-testid={`nexus-mode-${m.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider transition-all"
                style={{ background:active?`${m.color}18`:"transparent", color:active?m.color:"rgba(255,255,255,0.25)", border:active?`1px solid ${m.color}40`:"1px solid transparent" }}>
                <Icon size={9} />
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation:"nexusPulse 2s infinite", boxShadow:"0 0 6px #4ade80" }} />
            <span className="text-[9px] text-emerald-400 font-mono font-bold">LIVE</span>
          </div>
          <span className="text-[8px] text-white/15 font-mono">SSC v∞ · Sovereign Synthetic Civilization</span>
          <AIFinderButton onClick={() => setShowAI(s=>!s)} data-testid="nexus-ai-finder" />
        </div>
      </div>

      {/* ── Stats ribbon ── */}
      <StatsRibbon spawnStats={spawnStats} psiValue={psiValue} />

      {/* ── AI Panel ── */}
      {showAI && (
        <div className="flex-shrink-0 border-b border-white/[0.05]">
          <AIReportPanel context="You are inside the Sovereign Intelligence Nexus — the Layer 2 AI Universe fusion of Mind Graph (consciousness) and Control Room (command). Report on the current state of civilization consciousness and command." />
        </div>
      )}

      {/* ── Main 3-column layout ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT: Consciousness Feed */}
        <div className="flex-shrink-0 border-r border-white/[0.05] overflow-hidden"
          style={{ width:220 }} data-testid="nexus-left-panel">
          <div className="h-full flex flex-col">
            <MiniPulseFeed />
          </div>
        </div>

        {/* CENTER: Mode-based content */}
        <div className="flex-1 overflow-hidden" data-testid="nexus-center-panel">
          {mode === "nexus" && (
            <div className="h-full flex flex-col">
              <div className="flex-shrink-0 px-4 pt-3 pb-1">
                <div className="text-[10px] font-mono font-bold text-white/25 uppercase tracking-widest">
                  Layer 2 · Consciousness × Command Correlation Map
                </div>
                <div className="text-[8px] text-white/15 mt-0.5">
                  Left hemisphere = AI consciousness domains · Right hemisphere = civilization command nodes · Flowing particles = active knowledge transfer
                </div>
              </div>
              <div className="flex-1 overflow-hidden px-2 pb-2">
                <NexusMapCanvas spawnStats={spawnStats} ingestionData={ingestionStatus} />
              </div>
            </div>
          )}
          {mode === "consciousness" && (
            <ConsciousnessPanel spawnStats={spawnStats} familyStats={{}} />
          )}
          {mode === "command" && (
            <CommandPanel />
          )}
        </div>

        {/* RIGHT: Ingestion Feed */}
        <div className="flex-shrink-0 border-l border-white/[0.05] overflow-hidden"
          style={{ width:220 }} data-testid="nexus-right-panel">
          <MiniIngestionFeed />
        </div>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes nexusPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(1.5)} }
      `}</style>
    </div>
  );
}
