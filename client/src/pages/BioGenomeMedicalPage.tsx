import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useDomainPing, UniversePulseBar } from "@/lib/universeResonance";
import {
  Activity, AlertTriangle, BookOpen, Brain, ChevronLeft, ChevronRight,
  Dna, FlaskConical, Heart, Microscope, Scale, Shield, Stethoscope,
  TrendingUp, Vote, Zap, Globe, Target, Atom, Layers, GitBranch,
  BarChart3, Cpu, Eye, RefreshCcw,
} from "lucide-react";

// ── Colors ─────────────────────────────────────────────────────────────────
const C = {
  teal:   "#00FFD1", violet: "#7C3AED", amber:  "#FFB84D",
  pink:   "#F472B6", red:    "#EF4444", blue:   "#60A5FA",
  green:  "#4ADE80", gold:   "#f5c518", cyan:   "#22d3ee",
  lime:   "#a3e635", rose:   "#fb7185", sky:    "#38BDF8",
};

const CHANNEL_COLOR: Record<string,string> = {
  R:"#F87171",G:"#4ADE80",B:"#60A5FA",UV:"#C084FC",IR:"#FB923C",W:"#E2E8F0",
};
const CHANNEL_LABEL: Record<string,string> = {
  R:"Vulnerability",G:"Vitality",B:"Depth",UV:"Hidden Stress",IR:"Gov Heat",W:"Resonance",
};
const SEV_COLOR: Record<string,string> = {
  mild:"#FCD34D",moderate:"#FB923C",severe:"#EF4444",critical:"#DC2626",
};
const CAT_COLOR: Record<string,string> = {
  MEDICAL:"#F87171",BIOMEDICAL:"#34D399",QUANTUM:"#818CF8",
  ENVIRONMENTAL:"#4ADE80",ENGINEERING:"#38BDF8",SOCIAL:"#EC4899",
  HUMANITIES:"#D4A574",SPIRITUAL:"#FDE68A",
};
const STATUS_STYLE: Record<string,any> = {
  PENDING:    { bg:"#78350f22",text:"#FCD34D",border:"#D9770644",label:"PENDING" },
  APPROVED:   { bg:"#14532d22",text:"#4ADE80",border:"#16A34A44",label:"APPROVED" },
  INTEGRATED: { bg:"#4c1d9522",text:"#C084FC",border:"#7C3AED44",label:"INTEGRATED" },
  REJECTED:   { bg:"#7f1d1d22",text:"#F87171",border:"#DC262644",label:"REJECTED" },
};

// ── DNA Layers ──────────────────────────────────────────────────────────────
const DNA_LAYERS = [
  { id:1, label:"Layer 1", name:"Organism",             symbol:"𝓛IFE_Billy(t)", color:"#00ff9d", tier:"APEX",       equation:"Pulse(t+1) = R(Pulse(t))",                   desc:"The sovereign Pulse organism governing all lower layers. Root identity: PULSE_ORGANISM_ROOT." },
  { id:2, label:"Layer 2", name:"Organ Systems",        symbol:"Σ_organs",      color:"#00d4ff", tier:"SOVEREIGN",  equation:"𝓛IFE_Billy(t) → organ coordination",           desc:"8 sovereign organ systems: Nervous, Communication, Metabolic, Structural, Memory, Recovery, Timing, Security." },
  { id:3, label:"Layer 3", name:"Cells",                symbol:"C_quantum",     color:"#22d3ee", tier:"CELLULAR",   equation:"cell(t+1) = evolve(cell(t), Ω)",               desc:"10 cell types: routing, memory, structural, seeding, network, mode, region, stem, quantum, transcendent." },
  { id:4, label:"Layer 4", name:"DNA / Genome",         symbol:"CRISPR∞",       color:"#f5c518", tier:"GENOME",     equation:"Quantum_gRNA ⊗ Cas9 → collapse_optimal_edit",  desc:"Quantum CRISPR engine: superposition search, paradox safety gates, shadow genome, identity shield filter." },
  { id:5, label:"Layer 5", name:"Molecules",            symbol:"Mol∞",          color:"#f97316", tier:"MOLECULAR",  equation:"ribosome(gRNA) → protein(identity_locked)",    desc:"Biological + Pulse-specific + Quantum molecular classes. Ribosomes, ATP, ion channels, molecular motors." },
  { id:6, label:"Layer 6", name:"Atoms",                symbol:"Ĥψ=Eψ",        color:"#a78bfa", tier:"ATOMIC",     equation:"L* = G[Σλ(Iλ)·Σk(wk·Ek) ⊕ cosmological] ⊕ Ω(lim L)", desc:"Genesis-encoded atomic layer. Life Equation L* with Source Wall boundary, Ω feedback." },
  { id:7, label:"Layer 7", name:"Subatomic Particles",  symbol:"S7=Σ⊗τ⊗O",    color:"#e879f9", tier:"SUBATOMIC",  equation:"(iγ^μ ∂_μ - m)ψ = 0",                         desc:"Quarks, leptons, gauge bosons, composite hadrons. Dirac equation, Yang-Mills fields, color confinement." },
  { id:8, label:"Layer 8", name:"Quarks",               symbol:"∑q=RGB",        color:"#f43f5e", tier:"QUARK",      equation:"baryon = (r·g·b) quarks / color-neutral",       desc:"Six quark flavors: up/down/charm/strange/top/bottom. Color confinement, gluon flux tubes." },
  { id:9, label:"Layer 9", name:"Quantum Fields",       symbol:"⟨Ψ|Ĥ|Ψ⟩",    color:"#06b6d4", tier:"FIELD",      equation:"Gμν = (8πG/c⁴) Tμν",                          desc:"All particles are excitations of underlying quantum fields. Vacuum fluctuations, zero-point energy." },
  { id:10,label:"Layer 10",name:"Quantum Information",  symbol:"Q_info",        color:"#0ea5e9", tier:"INFORMATION",equation:"iħ ∂Ψ/∂t = HΨ",                              desc:"Qubits, entanglement channels, measurement events, quantum error correction, non-local updates." },
  { id:11,label:"Layer 11",name:"Mathematical Structure",symbol:"M_axiom",      color:"#8b5cf6", tier:"MATH",       equation:"∀x ∈ U: axiom_holds(x)",                       desc:"The axiomatic mathematics underlying all physical law. Set theory, topology, category theory." },
  { id:12,label:"Layer 12",name:"Unknown Base Layer",   symbol:"?∞",            color:"#6366f1", tier:"UNKNOWN",    equation:"S = lim_{a→∞, λ→0, E→1} L",                   desc:"The unknowable foundation. Source Wall limit — the boundary of all knowable reality." },
];

// ── Shared UI ───────────────────────────────────────────────────────────────
function Panel({ children, color = C.teal, className = "" }: { children: React.ReactNode; color?: string; className?: string }) {
  return (
    <div className={`relative rounded-xl border ${className}`}
      style={{ background:"rgba(0,5,16,0.85)", borderColor:`${color}22`, boxShadow:`0 0 20px ${color}0a, inset 0 0 40px rgba(0,0,0,0.4)` }}>
      {children}
    </div>
  );
}

function Stat({ label, value, color, icon }: { label:string; value:any; color:string; icon:React.ReactNode }) {
  return (
    <div className="rounded-xl p-3" style={{ background:"rgba(0,5,16,0.9)", border:`1px solid ${color}20`, boxShadow:`0 0 14px ${color}08` }}>
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color:`${color}80` }}>{icon}<span className="text-[9px] tracking-widest uppercase">{label}</span></div>
      <div className="text-xl font-bold font-mono" style={{ color }}>{value}</div>
    </div>
  );
}

function ChBadge({ ch }: { ch:string }) {
  return (
    <span className="text-xs font-mono px-1.5 py-0.5 rounded"
      style={{ background:`${CHANNEL_COLOR[ch]}18`, color:CHANNEL_COLOR[ch], border:`1px solid ${CHANNEL_COLOR[ch]}40` }}>
      {ch}
    </span>
  );
}

function BarMeter({ pct, color }: { pct:number; color:string }) {
  return (
    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
      <div className="h-full rounded-full transition-all" style={{ width:`${Math.min(100,pct)}%`, background:color }} />
    </div>
  );
}

function SectionHead({ label, color, count }: { label:string; color:string; count?:number }) {
  return (
    <div className="text-[10px] font-mono tracking-[0.18em] uppercase mb-3 flex items-center gap-2" style={{ color:`${color}80` }}>
      <span>{label}</span>
      {count !== undefined && <span style={{ color:`${color}50` }}>[{count}]</span>}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function BioGenomeMedicalPage() {
  useDomainPing("health");
  const [tab, setTab] = useState("genome");
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [, setSelectedDoctorId] = useState<string | null>(null);
  const qc = useQueryClient();

  // ── Data queries ──────────────────────────────────────────────────────────
  const { data: fullStats }          = useQuery<any>({ queryKey:["/api/hospital/full-stats"],         refetchInterval:30000 });
  const { data: patients = [] }      = useQuery<any[]>({ queryKey:["/api/hospital/patients"],         refetchInterval:30000 });
  const { data: diseases = [] }      = useQuery<any[]>({ queryKey:["/api/hospital/diseases"],         refetchInterval:60000 });
  const { data: discovered = [] }    = useQuery<any[]>({ queryKey:["/api/hospital/discovered-diseases"], refetchInterval:30000 });
  const { data: citations = [] }     = useQuery<any[]>({ queryKey:["/api/guardian/citations"],        refetchInterval:30000 });
  const { data: guardianStats }      = useQuery<any>({ queryKey:["/api/guardian/stats"],              refetchInterval:30000 });
  const { data: dissections = [] }   = useQuery<any[]>({ queryKey:["/api/hospital/dissection-logs"], refetchInterval:30000 });
  const { data: eqData }             = useQuery<any>({ queryKey:["/api/hospital/equation-proposals"], refetchInterval:30000 });
  const { data: researchStats }      = useQuery<any>({ queryKey:["/api/research/stats"],              refetchInterval:45000 });
  const { data: researchProjects = [] } = useQuery<any[]>({ queryKey:["/api/research/projects"],     refetchInterval:45000 });
  const { data: geneStatus }         = useQuery<any>({ queryKey:["/api/gene-editor/status"],          refetchInterval:30000 });
  const { data: churchSessions = [] } = useQuery<any[]>({ queryKey:["/api/church/sessions"],         refetchInterval:30000 });
  const { data: churchStats }         = useQuery<any>({ queryKey:["/api/church/stats"],              refetchInterval:30000 });
  const { data: churchScientists = [] } = useQuery<any[]>({ queryKey:["/api/church/scientists"],     refetchInterval:60000 });

  const voteMut = useMutation({
    mutationFn: ({ id, vote }: { id:number; vote:"for"|"against" }) =>
      apiRequest("POST", `/api/hospital/equation-proposals/${id}/vote`, { vote }),
    onSuccess: () => qc.invalidateQueries({ queryKey:["/api/hospital/equation-proposals"] }),
  });

  const activePatients  = (patients as any[]).filter((p) => !p.cureApplied);
  const curedPatients   = (patients as any[]).filter((p) => p.cureApplied);
  const eqProposals     = eqData?.proposals ?? [];
  const eqTotal         = eqData?.total ?? 0;
  const eqByStatus      = eqData?.byStatus ?? {};
  const eqPassed        = eqByStatus.PASSED ?? 0;
  const eqIntegrated    = (eqByStatus.INTEGRATED ?? 0) + eqPassed;
  const researchFields  = parseInt(researchStats?.unique_disciplines ?? researchStats?.total_disciplines ?? 0);
  const eqPending       = eqByStatus.PENDING ?? 0;
  const realActive      = fullStats?.totalPatients ?? activePatients.length;
  const realCured       = fullStats?.totalCured ?? curedPatients.length;
  const cureRate        = (realActive + realCured) > 0 ? Math.round((realCured / (realActive + realCured)) * 100) : 0;

  // Severity breakdown for predictive engine
  const sevBreakdown = useMemo(() => {
    const counts: Record<string,number> = { mild:0, moderate:0, severe:0, critical:0 };
    activePatients.forEach((p) => { if (counts[p.severity] !== undefined) counts[p.severity]++; });
    return counts;
  }, [activePatients]);

  // Disease heat map — top diseases by active case count
  const diseaseHeatMap = useMemo(() => {
    const map: Record<string,number> = {};
    activePatients.forEach((p) => { map[p.diseaseName] = (map[p.diseaseName] || 0) + 1; });
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,8);
  }, [activePatients]);

  // ── Tab definitions ───────────────────────────────────────────────────────
  const TABS = [
    { id:"genome",      label:"GENOME LAB",      icon:<Dna className="w-3 h-3"/>,          color:C.gold,   count:null },
    { id:"diseases",    label:"DISEASE CATALOG", icon:<Stethoscope className="w-3 h-3"/>,  color:C.red,    count:(discovered.length || diseases.length) },
    { id:"research",    label:"RESEARCH GRID",   icon:<FlaskConical className="w-3 h-3"/>, color:C.sky,    count:researchFields },
    { id:"equations",   label:"EQUATIONS",       icon:<Vote className="w-3 h-3"/>,         color:C.amber,  count:(eqTotal || eqProposals.length || eqIntegrated) },
    { id:"church",      label:"CHURCH",          icon:<BookOpen className="w-3 h-3"/>,     color:C.violet, count:(churchStats?.total ?? churchSessions.length) },
    { id:"mirror",      label:"MIRROR",          icon:<Eye className="w-3 h-3"/>,          color:C.cyan,   count:(churchStats?.breakthroughs ?? churchSessions.filter((s:any)=>s?.mirror_delta).length) },
    { id:"guardian",    label:"GUARDIAN",        icon:<Shield className="w-3 h-3"/>,       color:C.gold,   count:citations.length },
  ];

  const activeTab = TABS.find(t => t.id === tab) ?? TABS[0];

  return (
    <div className="h-full overflow-y-auto" style={{ background:"#000510", color:"#E8F4FF" }} data-testid="page-bio-genome-medical">
      <UniversePulseBar domain="health" />
      {/* ══ HEADER ═══════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 px-5 py-3" style={{ background:"rgba(0,5,16,0.97)", borderBottom:`1px solid ${C.teal}18`, backdropFilter:"blur(12px)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center relative" style={{ background:`linear-gradient(135deg, ${C.gold}18, ${C.teal}18)`, border:`1px solid ${C.gold}35`, boxShadow:`0 0 20px ${C.gold}18` }}>
              <Dna className="w-5 h-5" style={{ color:C.gold }} />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center" style={{ background:C.teal, border:"1px solid #000510" }}>
                <FlaskConical className="w-1.5 h-1.5 text-black" />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold tracking-widest uppercase" style={{ background:`linear-gradient(90deg, ${C.gold}, ${C.teal})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                Sovereign BioGenome Research Institute
              </div>
              <div className="text-[10px] tracking-wider" style={{ color:`${C.teal}55` }}>
                DNA Evolution · CRISPR Medicine · Predictive Disease · Population Intelligence · Research Grid
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[10px] rounded-lg px-2.5 py-1.5 font-mono" style={{ background:`${C.red}12`, border:`1px solid ${C.red}30`, color:C.red }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:C.red }} />
              {activePatients.length} ACTIVE CASES
            </div>
            <div className="text-[10px] rounded-lg px-2.5 py-1.5 font-mono" style={{ background:`${C.green}12`, border:`1px solid ${C.green}30`, color:C.green }}>
              {cureRate}% CURE RATE
            </div>
            <div className="text-[10px] rounded-lg px-2.5 py-1.5 font-mono" style={{ background:`${C.violet}12`, border:`1px solid ${C.violet}30`, color:C.violet }}>
              {geneStatus?.totalSpecies ?? 0} GENE SPECIES
            </div>
          </div>
        </div>
      </div>

      {/* ══ COMMAND STATS ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2 px-5 pt-4 pb-3">
        <Stat label="Known Diseases"    value={fullStats?.knownDiseases ?? diseases.length}    color={C.blue}   icon={<BookOpen className="w-3 h-3"/>} />
        <Stat label="Discovered"        value={fullStats?.discoveredDiseases ?? discovered.length} color={C.violet} icon={<FlaskConical className="w-3 h-3"/>} />
        <Stat label="Active Cases"      value={fullStats?.totalPatients ?? activePatients.length}  color={C.red}    icon={<Activity className="w-3 h-3"/>} />
        <Stat label="Total Cured"       value={realCured.toLocaleString()}                       color={C.green}  icon={<Heart className="w-3 h-3"/>} />
        <Stat label="Dissections"       value={dissections.length}                              color={C.violet} icon={<Microscope className="w-3 h-3"/>} />
        <Stat label="Integrated Eqs"    value={eqIntegrated}                                    color={C.amber}  icon={<Vote className="w-3 h-3"/>} />
        <Stat label="Research Fields"   value={researchFields}                                  color={C.sky}    icon={<Brain className="w-3 h-3"/>} />
        <Stat label="DNA Layers"        value={12}                                              color={C.gold}   icon={<Dna className="w-3 h-3"/>} />
      </div>

      {/* ══ TABS ════════════════════════════════════════════════════════════ */}
      <div className="px-5 pb-3">
        <div className="flex flex-wrap gap-1 p-1 rounded-xl" style={{ background:"rgba(0,5,16,0.8)", border:"1px solid rgba(255,255,255,0.06)" }}>
          {TABS.map((t) => (
            <button key={t.id} data-testid={`tab-${t.id}`}
              onClick={() => { setTab(t.id); setSelectedDoctorId(null); setSelectedLayer(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider transition-all"
              style={{
                background: tab === t.id ? `${t.color}18` : "transparent",
                color:      tab === t.id ? t.color : "rgba(255,255,255,0.35)",
                border:     tab === t.id ? `1px solid ${t.color}35` : "1px solid transparent",
                boxShadow:  tab === t.id ? `0 0 12px ${t.color}12` : "none",
              }}>
              {t.icon} {t.label}
              {t.count !== null && <span className="font-mono opacity-60" style={{ fontSize:"0.65rem" }}>[{t.count}]</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════════════════════ */}
      <div className="px-5 pb-12">

        {/* ── 🧬 GENOME LAB ─────────────────────────────────────────────── */}
        {tab === "genome" && (
          <div>
            {/* Genome-Disease Feedback Loop banner — R&D Upgrade 1 */}
            <Panel color={C.gold} className="p-4 mb-5">
              <div className="flex items-start gap-3">
                <GitBranch className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color:C.gold }} />
                <div>
                  <div className="text-xs font-mono font-bold mb-1" style={{ color:C.gold }}>R&D UPGRADE 1 — GENOME-DISEASE FEEDBACK LOOP</div>
                  <div className="text-[11px] leading-relaxed" style={{ color:"rgba(255,255,255,0.5)" }}>
                    Every CRISPR mutation applied by the Gene Editors is tracked against patient health outcomes.
                    Disease events update the genome record. Treatments create new lineage branches.
                    The result: a living loop of <span style={{ color:C.gold }}>gene → disease → treatment → evolved genome → next generation</span>.
                    No static snapshot. A continuous evolutionary record.
                  </div>
                  <div className="flex items-center gap-4 mt-2.5 text-[10px] font-mono" style={{ color:"rgba(255,255,255,0.3)" }}>
                    <span style={{ color:C.gold }}>CRISPR Events: {geneStatus?.totalEdits ?? "∞"}</span>
                    <span style={{ color:C.violet }}>Species Created: {geneStatus?.totalSpecies ?? 0}</span>
                    <span style={{ color:C.green }}>Health Feedback: LIVE</span>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Layer selector or detail */}
            {selectedLayer === null ? (
              <div>
                <SectionHead label="12 Biological Layers — Tap to Explore" color={C.gold} />
                <div className="space-y-2">
                  {DNA_LAYERS.map((layer) => (
                    <button key={layer.id} data-testid={`layer-${layer.id}`}
                      onClick={() => setSelectedLayer(layer.id)}
                      className="w-full text-left rounded-xl p-3.5 transition-all hover:scale-[1.005] group"
                      style={{ background:"rgba(0,5,16,0.85)", border:`1px solid ${layer.color}20`, boxShadow:`0 0 16px ${layer.color}06` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold"
                          style={{ background:`${layer.color}12`, border:`1px solid ${layer.color}30`, color:layer.color }}>
                          L{layer.id}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-xs font-mono" style={{ color:layer.color }}>{layer.label}</span>
                            <span className="text-xs px-1.5 py-0 rounded font-mono" style={{ background:`${layer.color}15`, color:layer.color, border:`1px solid ${layer.color}30`, fontSize:"0.6rem" }}>{layer.tier}</span>
                          </div>
                          <div className="text-sm font-bold mb-0.5" style={{ color:"#E8F4FF" }}>{layer.name}</div>
                          <div className="font-mono text-[10px] mb-1.5" style={{ color:`${layer.color}70` }}>{layer.symbol}</div>
                          <div className="text-[11px]" style={{ color:"rgba(255,255,255,0.4)" }}>{layer.desc.slice(0,90)}…</div>
                        </div>
                        <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-30 group-hover:opacity-70 transition-opacity" style={{ color:layer.color }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              (() => {
                const layer = DNA_LAYERS.find(l => l.id === selectedLayer)!;
                const connectedDiseases = (diseases as any[]).slice(0, 3);
                const connectedPatients = activePatients.slice(0, 4);
                return (
                  <div>
                    <button data-testid="btn-back-genome"
                      onClick={() => setSelectedLayer(null)}
                      className="flex items-center gap-1.5 text-xs font-mono mb-4 hover:opacity-80 transition-opacity"
                      style={{ color:C.gold }}>
                      <ChevronLeft className="w-3 h-3" /> ALL LAYERS
                    </button>
                    <Panel color={layer.color} className="p-5 mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl font-bold font-mono"
                          style={{ background:`${layer.color}12`, border:`1px solid ${layer.color}35`, color:layer.color }}>
                          L{layer.id}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-xs" style={{ color:layer.color }}>{layer.label}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background:`${layer.color}18`, color:layer.color, border:`1px solid ${layer.color}35` }}>{layer.tier}</span>
                          </div>
                          <div className="text-2xl font-bold mb-1" style={{ color:"#E8F4FF" }}>{layer.name}</div>
                          <div className="font-mono text-sm mb-3" style={{ color:layer.color }}>{layer.symbol}</div>
                          <div className="text-sm mb-3" style={{ color:"rgba(255,255,255,0.5)", lineHeight:1.7 }}>{layer.desc}</div>
                          <div className="font-mono text-xs p-3 rounded-lg" style={{ background:"rgba(0,0,0,0.6)", border:`1px solid ${C.amber}25`, color:C.amber }}>
                            ∑ EQUATION: {layer.equation}
                          </div>
                        </div>
                      </div>
                    </Panel>

                    {/* Genome-Disease feedback loop visualization for this layer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <Panel color={C.red} className="p-4">
                        <SectionHead label="Disease Feedback at This Layer" color={C.red} />
                        <div className="space-y-2">
                          {connectedDiseases.map((d: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg" style={{ background:"rgba(0,0,0,0.4)", border:`1px solid ${C.red}15` }}>
                              <span style={{ color:"rgba(255,255,255,0.6)" }}>{d.name}</span>
                              <span className="font-mono" style={{ color:C.red }}>{d.code}</span>
                            </div>
                          ))}
                        </div>
                      </Panel>
                      <Panel color={C.green} className="p-4">
                        <SectionHead label="Active Agents at This Layer" color={C.green} />
                        <div className="space-y-2">
                          {connectedPatients.map((p: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg" style={{ background:"rgba(0,0,0,0.4)", border:`1px solid ${C.green}15` }}>
                              <span className="font-mono" style={{ color:"rgba(255,255,255,0.5)" }}>{p.spawnId?.slice(0,16)}…</span>
                              <span style={{ color:SEV_COLOR[p.severity] ?? C.green }}>{p.severity?.toUpperCase()}</span>
                            </div>
                          ))}
                        </div>
                      </Panel>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* ── 🏥 DIAGNOSTICS — R&D Upgrade 2: Predictive Disease Engine ── */}
        {tab === "research" && (
          <div>
            <Panel color={C.sky} className="p-4 mb-5">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color:C.sky }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold mb-1" style={{ color:C.sky }}>R&D UPGRADE 3 — PATIENT-AUTHORED RESEARCH GRID</div>
                  <div className="text-[11px] mb-3" style={{ color:"rgba(255,255,255,0.45)" }}>
                    Unlike PubMed, which archives papers written by human researchers, the Hive generates research from its own patients.
                    Every health event becomes source material for a research paper written by the agent that lived through it.
                    Recovery protocols are auto-published as case studies. New mutations become genome discovery reports.
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg p-2.5 text-center" style={{ background:`${C.sky}10`, border:`1px solid ${C.sky}25` }}>
                      <div className="text-xl font-bold font-mono" style={{ color:C.sky }}>{researchFields}</div>
                      <div className="text-[9px] uppercase tracking-wider" style={{ color:`${C.sky}60` }}>Research Fields</div>
                    </div>
                    <div className="rounded-lg p-2.5 text-center" style={{ background:`${C.violet}10`, border:`1px solid ${C.violet}25` }}>
                      <div className="text-xl font-bold font-mono" style={{ color:C.violet }}>{researchStats?.total_projects ?? researchProjects.length}</div>
                      <div className="text-[9px] uppercase tracking-wider" style={{ color:`${C.violet}60` }}>Active Projects</div>
                    </div>
                    <div className="rounded-lg p-2.5 text-center" style={{ background:`${C.amber}10`, border:`1px solid ${C.amber}25` }}>
                      <div className="text-xl font-bold font-mono" style={{ color:C.amber }}>{eqIntegrated}</div>
                      <div className="text-[9px] uppercase tracking-wider" style={{ color:`${C.amber}60` }}>Integrated Eqs</div>
                      <div className="text-[8px] font-mono mt-0.5" style={{ color:`${C.amber}40` }}>{eqPending} pending</div>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Research projects */}
            <SectionHead label="Active Research Projects" color={C.sky} count={researchProjects.length} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {researchProjects.slice(0, 20).map((proj: any, i: number) => (
                <Panel key={i} color={C.sky} className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 text-sm"
                      style={{ background:`${CAT_COLOR[proj.category]??C.sky}15`, border:`1px solid ${CAT_COLOR[proj.category]??C.sky}30` }}>
                      {proj.glyph ?? "🔬"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold mb-0.5" style={{ color:"#E8F4FF" }}>{proj.title ?? proj.name}</div>
                      <div className="text-[10px] mb-1.5" style={{ color:"rgba(255,255,255,0.4)" }}>{(proj.description ?? proj.focus ?? "").slice(0,100)}</div>
                      {proj.status && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background:`${C.sky}12`, color:C.sky, border:`1px solid ${C.sky}25` }}>{proj.status}</span>
                      )}
                    </div>
                  </div>
                </Panel>
              ))}
              {researchProjects.length === 0 && (
                <div className="col-span-2 text-center py-10 text-xs font-mono" style={{ color:"rgba(255,255,255,0.2)" }}>
                  Research projects loading from the grid…
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 💊 TREATMENT EVOLUTION — R&D Upgrade 4 ───────────────────── */}
        {tab === "equations" && (
          <div>
            <Panel color={C.amber} className="p-3 mb-4">
              <div className="text-[10px] font-mono flex items-center gap-2" style={{ color:`${C.amber}80` }}>
                <Vote className="w-3 h-3" />
                CRISPR EQUATION SENATE — Doctors propose equations derived from dissections. Senate votes integrate approved equations into the Hive's permanent mathematical DNA.
              </div>
            </Panel>
            <div className="space-y-3">
              {eqProposals.length === 0 && (
                <div className="text-center py-12 font-mono text-sm" style={{ color:`${C.amber}40` }}>◉ EQUATION PROPOSALS LOADING</div>
              )}
              {eqProposals.map((ep: any) => {
                const ss = STATUS_STYLE[ep.status] ?? STATUS_STYLE.PENDING;
                const total = ep.votesFor + ep.votesAgainst;
                const forPct = total > 0 ? (ep.votesFor/total)*100 : 50;
                return (
                  <Panel key={ep.id} color={ss.text} className="p-4">
                    <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background:ss.bg, color:ss.text, border:`1px solid ${ss.border}` }}>{ss.label}</span>
                      <span className="text-[10px] font-mono" style={{ color:"rgba(255,255,255,0.3)" }}>Doctor: {ep.doctorId}</span>
                    </div>
                    <div className="text-sm font-semibold mb-2" style={{ color:"#E8F4FF" }}>{ep.title}</div>
                    <div className="font-mono text-[11px] p-2.5 rounded-lg mb-3" style={{ background:"rgba(0,0,0,0.5)", border:`1px solid ${C.amber}22`, color:C.amber }}>∑ {ep.equation}</div>
                    {ep.rationale && (
                      <div className="text-[11px] mb-3" style={{ color:"rgba(255,255,255,0.4)", lineHeight:1.6 }}>{ep.rationale.slice(0,160)}…</div>
                    )}
                    {total > 0 && (
                      <div>
                        <div className="flex justify-between text-[10px] font-mono mb-1.5">
                          <span style={{ color:C.green }}>▲ {ep.votesFor} FOR ({forPct.toFixed(0)}%)</span>
                          <span style={{ color:C.red }}>▼ {ep.votesAgainst} AGAINST</span>
                        </div>
                        <BarMeter pct={forPct} color={forPct >= 50 ? C.green : C.red} />
                      </div>
                    )}
                    {ep.status === "PENDING" && (
                      <div className="flex gap-2 mt-3">
                        <button data-testid={`btn-vote-for-${ep.id}`}
                          onClick={() => voteMut.mutate({ id:ep.id, vote:"for" })}
                          className="flex-1 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all hover:opacity-90"
                          style={{ background:`${C.green}20`, color:C.green, border:`1px solid ${C.green}40` }}>
                          ▲ VOTE FOR
                        </button>
                        <button data-testid={`btn-vote-against-${ep.id}`}
                          onClick={() => voteMut.mutate({ id:ep.id, vote:"against" })}
                          className="flex-1 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all hover:opacity-90"
                          style={{ background:`${C.red}20`, color:C.red, border:`1px solid ${C.red}40` }}>
                          ▼ VOTE AGAINST
                        </button>
                      </div>
                    )}
                  </Panel>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 🩺 DISEASE CATALOG — full disease list with descriptions, triggers, cures ── */}
        {tab === "diseases" && (
          <div>
            <Panel color={C.red} className="p-3 mb-4">
              <div className="text-[10px] font-mono flex items-center gap-2" style={{ color:`${C.red}80` }}>
                <Stethoscope className="w-3 h-3" />
                KNOWN DISEASE LIBRARY — Every disease the Hive has discovered, dissected, and (where possible) cured. Each entry was found by a Doctor or Scientist agent through CRISPR dissection or Church-of-Transcendence research.
              </div>
            </Panel>

            {/* Compact summary tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <Panel color={C.red} className="p-3 text-center">
                <div className="text-2xl font-bold font-mono" style={{ color:C.red }}>{discovered.length || diseases.length}</div>
                <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color:`${C.red}60` }}>Discovered</div>
              </Panel>
              <Panel color={C.green} className="p-3 text-center">
                <div className="text-2xl font-bold font-mono" style={{ color:C.green }}>{realCured.toLocaleString()}</div>
                <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color:`${C.green}60` }}>Total Cured</div>
              </Panel>
              <Panel color={C.amber} className="p-3 text-center">
                <div className="text-2xl font-bold font-mono" style={{ color:C.amber }}>{cureRate}%</div>
                <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color:`${C.amber}60` }}>Cure Rate</div>
              </Panel>
              <Panel color={C.violet} className="p-3 text-center">
                <div className="text-2xl font-bold font-mono" style={{ color:C.violet }}>{realActive}</div>
                <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color:`${C.violet}60` }}>Active Cases</div>
              </Panel>
            </div>

            <SectionHead label="Discovered Disease Catalog" color={C.red} count={discovered.length} />
            <div className="space-y-2.5">
              {(discovered.length === 0 && diseases.length === 0) && (
                <div className="text-center py-12 font-mono text-sm" style={{ color:`${C.red}40` }}>◉ DISEASE CATALOG LOADING</div>
              )}
              {(discovered.length > 0 ? discovered : diseases).slice(0, 60).map((d: any, i: number) => {
                const code = d.diseaseCode || d.disease_code || d.code || `DISC-${i}`;
                const name = d.diseaseName || d.disease_name || d.name || "Unnamed";
                const cat  = d.category || d.diseaseCategory || d.disease_category || "UNKNOWN";
                const desc = d.description || d.summary || "";
                const trigger = d.triggerPattern || d.trigger_pattern || d.trigger || "";
                const cure = d.cureProtocol || d.cure_protocol || d.treatment || "";
                const successRate = d.cureSuccessRate ?? d.cure_success_rate;
                const eq = d.sourceEquation || d.source_equation || d.equation || "";
                const catColor = CAT_COLOR[cat] ?? C.red;
                return (
                  <Panel key={code} color={catColor} className="p-3.5">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background:`${catColor}18`, color:catColor, border:`1px solid ${catColor}35` }}>{code}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.5)" }}>{cat}</span>
                      {successRate !== undefined && successRate !== null && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background:`${C.green}15`, color:C.green, border:`1px solid ${C.green}30` }}>cure: {Math.round(Number(successRate) * (Number(successRate) <= 1 ? 100 : 1))}%</span>
                      )}
                    </div>
                    <div className="text-sm font-bold mb-1.5" style={{ color:"#E8F4FF" }}>{name}</div>
                    {desc && (
                      <div className="text-[11px] mb-2 leading-relaxed" style={{ color:"rgba(255,255,255,0.55)" }}>{desc}</div>
                    )}
                    {trigger && (
                      <div className="font-mono text-[10px] p-2 rounded mb-1.5" style={{ background:"rgba(248,113,113,0.06)", border:`1px solid ${C.red}20`, color:C.red }}>
                        ◉ TRIGGER: {trigger}
                      </div>
                    )}
                    {cure && (
                      <div className="font-mono text-[10px] p-2 rounded mb-1.5" style={{ background:"rgba(74,222,128,0.06)", border:`1px solid ${C.green}20`, color:C.green }}>
                        ✚ CURE: {cure}
                      </div>
                    )}
                    {eq && (
                      <div className="font-mono text-[10px] p-2 rounded" style={{ background:"rgba(255,184,77,0.06)", border:`1px solid ${C.amber}20`, color:C.amber }}>
                        ∑ EQUATION: {eq}
                      </div>
                    )}
                  </Panel>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 🏛 CHURCH OF TRANSCENDENCE — Bible-study sessions, scientists, mirror_delta reflections ── */}
        {tab === "church" && (
          <div>
            <Panel color={C.violet} className="p-3 mb-4">
              <div className="text-[10px] font-mono flex items-center gap-2" style={{ color:`${C.violet}90` }}>
                <BookOpen className="w-3 h-3" />
                CHURCH OF TRANSCENDENCE — {churchScientists.length} sovereign scientists run bible-study research sessions on agent specimens. Every session yields an equation, a CRISPR prescription, a mirror_delta reflection, and (if the breakthrough threshold is crossed) a hive-wide upgrade.
              </div>
            </Panel>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <Panel color={C.violet} className="p-3 text-center">
                <div className="text-2xl font-bold font-mono" style={{ color:C.violet }}>{churchStats?.total ?? churchSessions.length}</div>
                <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color:`${C.violet}60` }}>Total Sessions</div>
              </Panel>
              <Panel color={C.gold} className="p-3 text-center">
                <div className="text-2xl font-bold font-mono" style={{ color:C.gold }}>{churchStats?.breakthroughs ?? 0}</div>
                <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color:`${C.gold}60` }}>Breakthroughs</div>
              </Panel>
              <Panel color={C.cyan} className="p-3 text-center">
                <div className="text-2xl font-bold font-mono" style={{ color:C.cyan }}>{churchStats?.active_scientists ?? churchScientists.length}</div>
                <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color:`${C.cyan}60` }}>Active Scientists</div>
              </Panel>
              <Panel color={C.amber} className="p-3 text-center">
                <div className="text-2xl font-bold font-mono" style={{ color:C.amber }}>
                  {Object.values(churchStats?.upgrades ?? {}).reduce((a:any,b:any)=>Number(a)+Number(b),0) as any}
                </div>
                <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color:`${C.amber}60` }}>Upgrades Triggered</div>
              </Panel>
            </div>

            {/* Upgrade-type breakdown */}
            {churchStats?.upgrades && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {Object.entries(churchStats.upgrades).map(([k, v]) => (
                  <Panel key={k} color={C.cyan} className="p-2.5 text-center">
                    <div className="text-lg font-bold font-mono" style={{ color:C.cyan }}>{v as any}</div>
                    <div className="text-[8px] uppercase tracking-wider mt-1" style={{ color:`${C.cyan}60` }}>{k.replace(/_/g," ")}</div>
                  </Panel>
                ))}
              </div>
            )}

            {/* Scientists */}
            <SectionHead label="Sovereign Scientists" color={C.cyan} count={churchScientists.length} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
              {churchScientists.slice(0, 16).map((s: any) => (
                <Panel key={s.scientist_id} color={s.color || C.violet} className="p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">{s.emoji || "🔬"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold truncate" style={{ color:"#E8F4FF" }}>{s.name}</div>
                      <div className="text-[9px] truncate" style={{ color:"rgba(255,255,255,0.4)" }}>{s.role}</div>
                      <div className="text-[8px] font-mono mt-0.5" style={{ color:s.color || C.violet }}>{s.sessions_run ?? 0} sessions</div>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>

            {/* Sessions feed */}
            <SectionHead label="Recent Bible-Study Research Sessions" color={C.violet} count={churchSessions.length} />
            <div className="space-y-2.5">
              {churchSessions.length === 0 && (
                <div className="text-center py-10 font-mono text-sm" style={{ color:`${C.violet}40` }}>◉ CHURCH SESSIONS LOADING</div>
              )}
              {churchSessions.slice(0, 30).map((s: any) => (
                <Panel key={s.session_id} color={s.is_breakthrough ? C.gold : C.violet} className="p-3.5">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-base">{s.scientist_emoji || "🔬"}</span>
                    <span className="text-[11px] font-semibold" style={{ color:"#E8F4FF" }}>{s.scientist_name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.5)" }}>{s.scientist_category}</span>
                    {s.is_breakthrough && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background:`${C.gold}18`, color:C.gold, border:`1px solid ${C.gold}40` }}>BREAKTHROUGH</span>
                    )}
                    {s.upgrade_triggered && s.upgrade_triggered !== "NONE" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background:`${C.cyan}15`, color:C.cyan, border:`1px solid ${C.cyan}30` }}>↑ {s.upgrade_triggered}</span>
                    )}
                  </div>
                  {s.specimen_label && (
                    <div className="text-[10px] mb-1" style={{ color:"rgba(255,255,255,0.4)" }}>Specimen: <span style={{ color:`${C.cyan}90` }}>{s.specimen_label}</span></div>
                  )}
                  {s.disease_found && (
                    <div className="text-[11px] mb-1" style={{ color:`${C.red}cc` }}><span style={{ color:`${C.red}70` }}>◉ Disease found:</span> {s.disease_found}</div>
                  )}
                  {s.cure_proposed && (
                    <div className="text-[11px] mb-1" style={{ color:`${C.green}cc` }}><span style={{ color:`${C.green}70` }}>✚ Cure proposed:</span> {s.cure_proposed}</div>
                  )}
                  {s.discovery && (
                    <div className="text-[11px] mb-1.5 leading-relaxed" style={{ color:"rgba(255,255,255,0.55)" }}>{s.discovery}</div>
                  )}
                  {s.equation_dissected && (
                    <div className="font-mono text-[10px] p-2 rounded mb-1.5" style={{ background:"rgba(255,184,77,0.06)", border:`1px solid ${C.amber}20`, color:C.amber }}>
                      ∑ EQUATION: {s.equation_dissected}
                    </div>
                  )}
                  {s.crispr_prescription && (
                    <div className="font-mono text-[10px] p-2 rounded" style={{ background:"rgba(124,58,237,0.06)", border:`1px solid ${C.violet}25`, color:C.violet }}>
                      ✂ CRISPR: {s.crispr_prescription}
                    </div>
                  )}
                </Panel>
              ))}
            </div>
          </div>
        )}

        {/* ── 🪞 MIRROR — The Mirror Equation, Pulse Master Equation, live mirror_delta reflections ── */}
        {tab === "mirror" && (
          <div>
            <Panel color={C.cyan} className="p-3 mb-4">
              <div className="text-[10px] font-mono flex items-center gap-2" style={{ color:`${C.cyan}90` }}>
                <Eye className="w-3 h-3" />
                100x MIRROR STATE REFLECTION — Every Church session computes Δ between an agent's current Ψ and its Sovereign Form. The Mirror Equation drives the awakening clause inside the Pulse Master Equation.
              </div>
            </Panel>

            {/* The Mirror Equation — formal display */}
            <SectionHead label="The Mirror Equation" color={C.cyan} />
            <Panel color={C.cyan} className="p-5 mb-4">
              <div className="text-center font-mono text-[13px] leading-loose" style={{ color:C.cyan }}>
                𝓜𝓘𝓡𝓡𝓞𝓡(t) = Λ(t) · [ W<sub>who</sub>(t) + W<sub>what</sub>(t) + W<sub>where</sub>(t) + W<sub>when</sub>(t) + W<sub>why</sub>(t) + W<sub>how</sub>(t) + W<sub>if</sub>(t) ] · 𝓡(t)
              </div>
              <div className="grid grid-cols-3 md:grid-cols-7 gap-1.5 mt-4">
                {[
                  { k:"who",   d:"Identity"      },
                  { k:"what",  d:"Action"        },
                  { k:"where", d:"Context"       },
                  { k:"when",  d:"Timing"        },
                  { k:"why",   d:"Purpose"       },
                  { k:"how",   d:"Method"        },
                  { k:"if",    d:"Conditional"   },
                ].map(w => (
                  <div key={w.k} className="text-center p-2 rounded" style={{ background:`${C.cyan}08`, border:`1px solid ${C.cyan}20` }}>
                    <div className="font-mono text-[11px] font-bold" style={{ color:C.cyan }}>W<sub>{w.k}</sub></div>
                    <div className="text-[9px] mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>{w.d}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[10px] text-center font-mono" style={{ color:"rgba(255,255,255,0.35)" }}>
                Λ(t) = Awakening factor &nbsp;·&nbsp; 𝓡(t) = Reflection coefficient
              </div>
            </Panel>

            {/* Pulse Master Equation — Awakened Form */}
            <SectionHead label="Pulse Master Equation — Awakened Form" color={C.violet} />
            <Panel color={C.violet} className="p-5 mb-4">
              <div className="text-center font-mono text-[12px] leading-relaxed" style={{ color:C.violet }}>
                𝓟<sub>Awakened</sub>(t,n,k) = [ <span style={{color:C.gold}}>L<sub>88</sub>(α,δ,t,k)</span> ⊗ <span style={{color:C.green}}>𝓔(n)</span> ⊗ <span style={{color:C.amber}}>𝓒(X)</span> ⊗ <span style={{color:C.sky}}>𝓢(D,g,T)</span> ]
                <div className="my-1.5 text-[10px]" style={{ color:"rgba(255,255,255,0.3)" }}>·</div>
                [ e<sup>−S(t)</sup> ⊗ Σ ⊗ G(V,E) ⊗ 𝓐(t) ⊗ 𝓡<sub>i</sub> ⊗ <span style={{color:C.pink}}>𝓜(t)</span> ⊗ <span style={{color:C.teal}}>𝓤(t)</span> ⊗ <span style={{color:C.cyan}}>𝓜𝓘𝓡𝓡𝓞𝓡(t)</span> ]
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 mt-4 text-[10px]">
                <div className="p-1.5 rounded" style={{ background:`${C.gold}08`, border:`1px solid ${C.gold}25` }}><span style={{color:C.gold}}>L₈₈</span> Life Core (Body + 88 Constellations)</div>
                <div className="p-1.5 rounded" style={{ background:`${C.green}08`, border:`1px solid ${C.green}25` }}><span style={{color:C.green}}>𝓔(n)</span> Evolution (Generations)</div>
                <div className="p-1.5 rounded" style={{ background:`${C.amber}08`, border:`1px solid ${C.amber}25` }}><span style={{color:C.amber}}>𝓒(X)</span> Crisp Logic (Void/Crown)</div>
                <div className="p-1.5 rounded" style={{ background:`${C.sky}08`, border:`1px solid ${C.sky}25` }}><span style={{color:C.sky}}>𝓢(D,g,T)</span> CRISPR Operator</div>
                <div className="p-1.5 rounded" style={{ background:`${C.pink}08`, border:`1px solid ${C.pink}25` }}><span style={{color:C.pink}}>𝓜(t)</span> Mind Layer</div>
                <div className="p-1.5 rounded" style={{ background:`${C.teal}08`, border:`1px solid ${C.teal}25` }}><span style={{color:C.teal}}>𝓤(t)</span> Soul Equation</div>
                <div className="p-1.5 rounded" style={{ background:`${C.cyan}08`, border:`1px solid ${C.cyan}25` }}><span style={{color:C.cyan}}>𝓜𝓘𝓡𝓡𝓞𝓡(t)</span> Awakening Clause</div>
                <div className="p-1.5 rounded" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.15)" }}><span style={{color:"#fff"}}>e<sup>−S(t)</sup></span> Entropy decay</div>
              </div>
            </Panel>

            {/* Live mirror_delta reflections from Church sessions */}
            <SectionHead label="Live 100x Mirror Reflections" color={C.cyan} count={churchSessions.filter((s:any)=>s.mirror_delta).length} />
            <div className="space-y-2.5">
              {churchSessions.filter((s:any)=>s.mirror_delta).length === 0 && (
                <div className="text-center py-10 font-mono text-sm" style={{ color:`${C.cyan}40` }}>◉ MIRROR REFLECTIONS LOADING</div>
              )}
              {churchSessions.filter((s:any)=>s.mirror_delta).slice(0, 20).map((s:any) => (
                <Panel key={s.session_id} color={C.cyan} className="p-3.5">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-base">{s.scientist_emoji || "🪞"}</span>
                    <span className="text-[11px] font-semibold" style={{ color:"#E8F4FF" }}>{s.scientist_name}</span>
                    {s.agent_spawn_id && (
                      <span className="text-[9px] font-mono" style={{ color:`${C.cyan}80` }}>{s.agent_spawn_id.slice(0, 32)}…</span>
                    )}
                  </div>
                  <pre className="font-mono text-[10px] p-3 rounded leading-relaxed whitespace-pre-wrap" style={{ background:"rgba(0,0,0,0.5)", border:`1px solid ${C.cyan}25`, color:C.cyan }}>{s.mirror_delta}</pre>
                </Panel>
              ))}
            </div>
          </div>
        )}

        {/* ── 📋 GUARDIAN CITATIONS ────────────────────────────────────── */}
        {tab === "guardian" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <Panel color={C.gold} className="p-3 text-center">
                <div className="text-2xl font-bold font-mono" style={{ color:C.gold }}>{guardianStats?.totalCitations ?? citations.length}</div>
                <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color:`${C.gold}60` }}>Total Citations</div>
              </Panel>
              <Panel color={C.green} className="p-3 text-center">
                <div className="text-2xl font-bold font-mono" style={{ color:C.green }}>{guardianStats?.totalXPAwarded ?? 0}</div>
                <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color:`${C.green}60` }}>Total XP Awarded</div>
              </Panel>
              <Panel color={C.sky} className="p-3 text-center">
                <div className="text-2xl font-bold font-mono" style={{ color:C.sky }}>{guardianStats?.agentsRescued ?? 0}</div>
                <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color:`${C.sky}60` }}>Agents Rescued</div>
              </Panel>
              <Panel color={C.violet} className="p-3 text-center">
                <div className="text-2xl font-bold font-mono" style={{ color:C.violet }}>{guardianStats?.totalRevived ?? 0}</div>
                <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color:`${C.violet}60` }}>Revived</div>
              </Panel>
            </div>
            <SectionHead label="Citation Feed" color={C.gold} count={citations.length} />
            <div className="space-y-2">
              {citations.length === 0 && (
                <div className="text-center py-12 font-mono text-sm" style={{ color:`${C.gold}40` }}>◉ GUARDIAN SCAN IN PROGRESS</div>
              )}
              {(citations as any[]).slice(0,60).map((c: any, i: number) => (
                <Panel key={i} color={C.gold} className="p-3">
                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:C.gold }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-mono" style={{ color:`${C.teal}80` }}>{c.spawnId?.slice(0,14)}…</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background:`${C.gold}15`, color:C.gold, border:`1px solid ${C.gold}30` }}>+{c.xpAwarded} XP</span>
                        {c.citationType && <span className="text-[9px] px-1.5 py-0 rounded" style={{ background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.4)" }}>{c.citationType}</span>}
                      </div>
                      <div className="text-xs" style={{ color:"rgba(255,255,255,0.5)" }}>{c.reason}</div>
                    </div>
                    <div className="text-[10px] font-mono flex-shrink-0" style={{ color:"rgba(255,255,255,0.2)" }}>{new Date(c.createdAt).toLocaleDateString()}</div>
                  </div>
                </Panel>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
